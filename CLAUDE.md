# TileFlow ERP — Architecture & Development Spec

## Tech Stack
- Backend: Python (FastAPI), SQLAlchemy, Alembic, PostgreSQL
- Frontend: React, TypeScript, Vite, Tailwind CSS

## Core Domain Requirements
1. Multi-Location Inventory:
   - Locations are typed as SHOWROOM (customer quoting, display boards, billing) or GODOWN (bulk storage, batch/shade tracking, dispatch).
2. Tiles Unit & Shade Management:
   - Products track sqft_per_box, pieces_per_box, batch_shade_no, caliber_code, and hsn_code (default 6907).
   - Billing inputs in Sq.Ft. auto-convert to whole Boxes (ceil(sqft / sqft_per_box)).
3. GST & Split Dispatch:
   - Support B2B Customer GSTIN, intra-state CGST+SGST, inter-state IGST, and Godown-wise Delivery Challan generation.
