<!--
  Project      : TILEFLOW Retail OS
  Author       : Syed Ateef
  Designation  : Chief Systems Architect & Creator
  Email        : ateef@tileflow.in
  Version      : 3.7.0
  Created      : 2026-07-11
  Modified     : 2026-07-11
  Copyright    :  tileflow.in. Open Source - Permissive Use
  License      : MIT Open Source License
  Classification: Open Source
-->

# Alembic Database Migrations Guide

This folder contains database migration scripts generated via Alembic.

## Commands

### 1. Create a New Migration
To autogenerate a migration reflecting current model changes:
```bash
python -m alembic revision --autogenerate -m "description of changes"
```

### 2. Apply Migrations
To upgrade the database to the latest revision:
```bash
python -m alembic upgrade head
```

### 3. Rollback Last Migration
To revert the last applied migration:
```bash
python -m alembic downgrade -1
```
