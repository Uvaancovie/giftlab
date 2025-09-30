# Migrations

1) Run `schema.sql` in Supabase SQL editor.
2) Run `seed.sql` for dev data.
3) Create a storage bucket named `invoices` in Supabase (public for MVP or signed URLs).
4) Add RLS policies (already included in schema).

For changes, create timestamped files, e.g.:
- 2025-09-27_add_profiles.sql
- 2025-10-02_add_indexes.sql