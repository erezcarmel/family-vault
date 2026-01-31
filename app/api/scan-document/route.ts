import {NextRequest, NextResponse} from "next/server";
import OpenAI from "openai";
import {getPromptForAsset} from "@/lib/document-scanner-prompts";

export const runtime = "nodejs";

function stripDataUrlPrefix(value: string) {
  const match = value.match(/^data:[^;]+;base64,(.+)$/);
  return (match?.[1] ?? value).trim();
}

function normalizeBase64(value: string) {
  return stripDataUrlPrefix(value).replace(/\s+/g, "");
}

function looksLikePdfBase64(value: string) {
  const v = normalizeBase64(value);
  return v.startsWith("JVBERi0");
}

function getResponseText(response: any) {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }
  const outputs = Array.isArray(response?.output) ? response.output : [];
  for (const item of outputs) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const c of content) {
      if (typeof c?.text === "string" && c.text.trim()) return c.text.trim();
    }
  }
  return "";
}

export async function POST(request: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    let body;
    try {
      body = await request.json();
    } catch (_parseError) {
      return NextResponse.json(
        {error: "Invalid JSON in request body"},
        {status: 400}
      );
    }
    const {imageBase64, fileBase64, mimeType, filename, category, type} = body;
    const providedBase64 = fileBase64 ?? imageBase64;

    if (!providedBase64 || !category || !type) {
      return NextResponse.json(
        {error: "Missing required fields: fileBase64 (or imageBase64), category, type"},
        {status: 400}
      );
    }

    const promptConfig = getPromptForAsset(category, type);

    if (!promptConfig) {
      return NextResponse.json(
        {error: "No prompt configuration found for this asset type"},
        {status: 400}
      );
    }

    const effectiveMimeType =
      typeof mimeType === "string" && mimeType.trim()
        ? mimeType.trim()
        : looksLikePdfBase64(providedBase64)
          ? "application/pdf"
          : "image/jpeg";

    const base64Data = normalizeBase64(providedBase64);
    
    // Check file size (base64 is ~1.33x the original size, limit to ~20MB original = ~27MB base64)
    const maxBase64Size = 27 * 1024 * 1024; // 27MB in bytes
    if (base64Data.length > maxBase64Size) {
      return NextResponse.json(
        {error: "File is too large. Please upload a file smaller than 20MB."},
        {status: 413}
      );
    }
    
    const isPdf = effectiveMimeType === "application/pdf";

    const fileOrImagePart =
      isPdf
        ? ({
            type: "input_file" as const,
            filename:
              typeof filename === "string" && filename.trim()
                ? filename.trim()
                : "document.pdf",
            file_data: `data:application/pdf;base64,${base64Data}`,
          } as const)
        : ({
            type: "input_image" as const,
            detail: "auto" as const,
            image_url: `data:${effectiveMimeType};base64,${base64Data}`,
          } as const);

    const createResponse = (part: any) =>
      openai.responses.create({
        model: "gpt-4o",
        input: [
          {
            role: "system",
            content: [{type: "input_text", text: promptConfig.systemPrompt}],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Please analyze this document and extract the relevant information. Don't analyze money figures. Return ONLY a valid JSON object with the extracted data, no additional text.",
              },
              part,
            ],
          },
        ],
        max_output_tokens: 1000,
        temperature: 0.1,
      });

    let response: any;
    try {
      response = await createResponse(fileOrImagePart);
    } catch (e: any) {
      const param = typeof e?.param === "string" ? e.param : "";
      if (isPdf && e?.status === 400 && param.includes("file_data")) {
        const bytes = Buffer.from(base64Data, "base64");
        const name =
          typeof filename === "string" && filename.trim() ? filename.trim() : "document.pdf";
        const uploaded = await openai.files.create({
          file: new File([bytes], name, {type: "application/pdf"}),
          purpose: "assistants",
        });
        response = await createResponse({type: "input_file", file_id: uploaded.id, filename: name});
      } else {
        throw e;
      }
    }

    const content = getResponseText(response);

    if (!content) {
      return NextResponse.json(
        {error: "No response from OpenAI"},
        {status: 500}
      );
    }

    // Parse the JSON response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      extractedData = JSON.parse(cleanContent);
    } catch (_parseError) {
      console.error("Failed to parse OpenAI response:", content);
      return NextResponse.json(
        {error: "Failed to parse extracted data", rawResponse: content},
        {status: 500}
      );
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      usage: (response as any).usage,
    });
  } catch (error: any) {
    console.error("Error scanning document:", error);
    return NextResponse.json(
      {error: error.message || "Failed to scan document"},
      {status: 500}
    );
  }
}
