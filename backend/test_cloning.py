#!/usr/bin/env python
"""Quick test of database cloning."""

import psycopg2

conn = psycopg2.connect(dbname='postgres', user='postgres', password='postgres', host='localhost', port=5432)
conn.autocommit = True
cur = conn.cursor()

# Check if source exists
cur.execute("SELECT 1 FROM pg_database WHERE datname='tileflowsys'")
result = cur.fetchone()
print(f'tileflowsys exists: {result is not None}')

# Check for active sessions
cur.execute("SELECT COUNT(*) FROM pg_stat_activity WHERE datname='tileflowsys' AND pid <> pg_backend_pid()")
active = cur.fetchone()[0]
print(f'Active sessions on tileflowsys: {active}')

# Try creating clone
try:
    print('\nAttempting to create clone...')
    cur.execute('DROP DATABASE IF EXISTS tileflowsys_stage WITH (FORCE)')
    print('  ✓ Dropped existing tileflowsys_stage')
    
    cur.execute('CREATE DATABASE tileflowsys_stage WITH TEMPLATE tileflowsys')
    print('  ✓ Successfully created tileflowsys_stage from tileflowsys')
    
    # Verify clone exists
    cur.execute("SELECT 1 FROM pg_database WHERE datname='tileflowsys_stage'")
    if cur.fetchone():
        print('  ✓ Clone verified to exist')
    
except Exception as e:
    print(f'  ✗ Error: {e}')

cur.close()
conn.close()
