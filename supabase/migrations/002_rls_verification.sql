-- ============================================================
-- 002_rls_verification.sql
-- Run after 001_initial_schema.sql to verify RLS is enabled
-- All 4 tables should show rowsecurity = true
-- ============================================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
