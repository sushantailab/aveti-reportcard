-- Teacher Activation Hub: allow WhatsApp templates to carry an optional image link.
-- Run in Supabase SQL editor before saving image links in the Send workflow editor.

alter table public.tah_message_templates
  add column if not exists image_url text;
