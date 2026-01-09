-- Create healthcare_records table
CREATE TABLE IF NOT EXISTS public.healthcare_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id),
  provider_name TEXT,
  provider_type TEXT NOT NULL,
  doctor_name TEXT,
  specialty TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  policy_number TEXT,
  group_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create healthcare_medications table
CREATE TABLE IF NOT EXISTS public.healthcare_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  healthcare_record_id UUID NOT NULL REFERENCES public.healthcare_records(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  prescribing_doctor TEXT,
  pharmacy_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create healthcare_allergies table
CREATE TABLE IF NOT EXISTS public.healthcare_allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  healthcare_record_id UUID NOT NULL REFERENCES public.healthcare_records(id) ON DELETE CASCADE,
  allergen_name TEXT NOT NULL,
  severity TEXT,
  reaction_description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create healthcare_conditions table
CREATE TABLE IF NOT EXISTS public.healthcare_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  healthcare_record_id UUID NOT NULL REFERENCES public.healthcare_records(id) ON DELETE CASCADE,
  condition_name TEXT NOT NULL,
  diagnosis_date DATE,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create healthcare_emergency_contacts table
CREATE TABLE IF NOT EXISTS public.healthcare_emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  healthcare_record_id UUID NOT NULL REFERENCES public.healthcare_records(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_healthcare_records_family_id ON public.healthcare_records(family_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_records_member_id ON public.healthcare_records(member_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_records_provider_type ON public.healthcare_records(provider_type);
CREATE INDEX IF NOT EXISTS idx_healthcare_medications_record_id ON public.healthcare_medications(healthcare_record_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_allergies_record_id ON public.healthcare_allergies(healthcare_record_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_conditions_record_id ON public.healthcare_conditions(healthcare_record_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_emergency_contacts_record_id ON public.healthcare_emergency_contacts(healthcare_record_id);

-- Enable Row Level Security
ALTER TABLE public.healthcare_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_emergency_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for healthcare_records table
CREATE POLICY "Users can view their own healthcare records"
  ON public.healthcare_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = healthcare_records.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create healthcare records for their own families"
  ON public.healthcare_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = healthcare_records.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own healthcare records"
  ON public.healthcare_records
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = healthcare_records.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own healthcare records"
  ON public.healthcare_records
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = healthcare_records.family_id
      AND families.user_id = auth.uid()
    )
  );

-- RLS Policies for healthcare_medications table
CREATE POLICY "Users can view their own healthcare medications"
  ON public.healthcare_medications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_medications.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create healthcare medications for their own records"
  ON public.healthcare_medications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_medications.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own healthcare medications"
  ON public.healthcare_medications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_medications.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own healthcare medications"
  ON public.healthcare_medications
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_medications.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

-- RLS Policies for healthcare_allergies table
CREATE POLICY "Users can view their own healthcare allergies"
  ON public.healthcare_allergies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_allergies.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create healthcare allergies for their own records"
  ON public.healthcare_allergies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_allergies.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own healthcare allergies"
  ON public.healthcare_allergies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_allergies.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own healthcare allergies"
  ON public.healthcare_allergies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_allergies.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

-- RLS Policies for healthcare_conditions table
CREATE POLICY "Users can view their own healthcare conditions"
  ON public.healthcare_conditions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_conditions.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create healthcare conditions for their own records"
  ON public.healthcare_conditions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_conditions.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own healthcare conditions"
  ON public.healthcare_conditions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_conditions.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own healthcare conditions"
  ON public.healthcare_conditions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_conditions.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

-- RLS Policies for healthcare_emergency_contacts table
CREATE POLICY "Users can view their own healthcare emergency contacts"
  ON public.healthcare_emergency_contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_emergency_contacts.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create healthcare emergency contacts for their own records"
  ON public.healthcare_emergency_contacts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_emergency_contacts.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own healthcare emergency contacts"
  ON public.healthcare_emergency_contacts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_emergency_contacts.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own healthcare emergency contacts"
  ON public.healthcare_emergency_contacts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_records
      JOIN public.families ON families.id = healthcare_records.family_id
      WHERE healthcare_records.id = healthcare_emergency_contacts.healthcare_record_id
      AND families.user_id = auth.uid()
    )
  );

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_healthcare_records_updated_at
  BEFORE UPDATE ON public.healthcare_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_healthcare_medications_updated_at
  BEFORE UPDATE ON public.healthcare_medications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_healthcare_allergies_updated_at
  BEFORE UPDATE ON public.healthcare_allergies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_healthcare_conditions_updated_at
  BEFORE UPDATE ON public.healthcare_conditions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_healthcare_emergency_contacts_updated_at
  BEFORE UPDATE ON public.healthcare_emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

