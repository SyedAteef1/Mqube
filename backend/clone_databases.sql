-- SQL Script to clone databases for staging reconciliation
-- Must be executed with -U postgres on the postgres database

-- Terminate all connections to production databases
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
WHERE datname IN ('tileflowsys', 'tileflow001') 
  AND pid <> pg_backend_pid()
  AND usename NOT IN ('postgres');

-- Wait a moment (PostgreSQL processing)
SELECT pg_sleep(1);

-- Confirm connections terminated
SELECT datname, COUNT(*) as session_count 
FROM pg_stat_activity 
WHERE datname IN ('tileflowsys', 'tileflow001')
  AND pid <> pg_backend_pid()
GROUP BY datname;

-- Clone tileflowsys
DROP DATABASE IF EXISTS tileflowsys_stage WITH (FORCE);
CREATE DATABASE tileflowsys_stage WITH TEMPLATE tileflowsys;
SELECT 'tileflowsys_stage created' as result;

-- Clone tileflow001
DROP DATABASE IF EXISTS tileflow001_stage WITH (FORCE);
CREATE DATABASE tileflow001_stage WITH TEMPLATE tileflow001;
SELECT 'tileflow001_stage created' as result;

-- Verify clones
SELECT datname, pg_database_size(datname) as size_bytes
FROM pg_database
WHERE datname IN ('tileflowsys_stage', 'tileflow001_stage')
ORDER BY datname;
