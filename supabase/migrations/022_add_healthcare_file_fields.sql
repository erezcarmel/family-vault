-- Add file fields to healthcare_records table to support document uploads
ALTER TABLE public.healthcare_records
ADD COLUMN file_name TEXT,
ADD COLUMN file_path TEXT,
ADD COLUMN file_size BIGINT,
ADD COLUMN file_type TEXT;

-- Create index for file_path for better query performance
CREATE INDEX IF NOT EXISTS idx_healthcare_records_file_path ON public.healthcare_records(file_path);
