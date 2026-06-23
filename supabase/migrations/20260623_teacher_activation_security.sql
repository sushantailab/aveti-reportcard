-- Tighten Teacher Activation Hub browser access.
-- Authenticated admins use RLS policies; anonymous users must not access PII tables.

revoke all on public.tah_teachers from anon;
revoke all on public.tah_message_templates from anon;
revoke all on public.tah_message_logs from anon;
revoke all on public.tah_feedback from anon;
revoke all on public.tah_referrals from anon;
revoke all on public.tah_testimonials from anon;
