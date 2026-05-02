-- Add A/B test variant and UTM tracking fields to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS test_variant  text,
  ADD COLUMN IF NOT EXISTS utm_source    text,
  ADD COLUMN IF NOT EXISTS utm_campaign  text;
