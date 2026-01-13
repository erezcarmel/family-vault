async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  const apiKey = process.env.BREVO_API_KEY

  if (!apiKey) {
    console.warn('BREVO_API_KEY not set. Email not sent. Email would be:', {
      to,
      subject,
      html,
    })
    return
  }

  const emailFrom = process.env.EMAIL_FROM || 'Family Vault <noreply@familyvault.app>'
  const fromMatch = emailFrom.match(/^(.+?)\s*<(.+)>$|^(.+)$/)
  const senderName = fromMatch?.[1]?.trim() || fromMatch?.[3]?.trim() || 'Family Vault'
  const senderEmail = fromMatch?.[2]?.trim() || fromMatch?.[3]?.trim() || 'noreply@familyvault.app'

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Failed to send email: ${error.message || response.statusText}`)
  }

  return response.json()
}

export async function sendInvitationEmail({
  to,
  invitationToken,
  role,
  familyName,
  inviterName,
}: {
  to: string
  invitationToken: string
  role: string
  familyName: string
  inviterName: string
}) {
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL
  
  if (!baseUrl) {
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
    } else {
      baseUrl = 'http://localhost:3000'
    }
  }
  
  const invitationLink = `${baseUrl}/auth/signup?token=${invitationToken}`

  const roleLabel = role === 'admin' ? 'Admin' : role === 'editor' ? 'Editor' : 'Member'
  const roleDescription = 
    role === 'admin' ? 'can manage the family account' :
    role === 'editor' ? 'can update account data' :
    'can view the data'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Family Vault Invitation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Family Vault</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #111827; margin-top: 0;">You've been invited!</h2>
        
        <p style="font-size: 16px; color: #4b5563;">
          <strong>${inviterName}</strong> has invited you to join <strong>${familyName}</strong> on Family Vault.
        </p>
        
        <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #374151;">
            <strong>Your Role:</strong> ${roleLabel}<br>
            <span style="font-size: 14px; color: #6b7280;">${roleDescription}</span>
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" 
             style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Accept Invitation
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          Or copy and paste this link into your browser:<br>
          <a href="${invitationLink}" style="color: #667eea; word-break: break-all;">${invitationLink}</a>
        </p>
        
        <p style="font-size: 12px; color: #9ca3af; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          This invitation will expire in 30 days. If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `

  const text = `
You've been invited to join ${familyName} on Family Vault!

${inviterName} has invited you with the role: ${roleLabel} (${roleDescription})

Accept your invitation by clicking this link:
${invitationLink}

This invitation will expire in 30 days.
  `.trim()

  return sendEmail({
    to,
    subject: `You've been invited to join ${familyName} on Family Vault`,
    html,
    text,
  })
}

