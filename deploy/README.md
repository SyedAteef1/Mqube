# Putting MQube live

One Linux server runs everything: PostgreSQL 16, the MQube API, the web app (Caddy, automatic HTTPS) and daily backups.

## What you need
- A Linux server (Ubuntu 24.04, 2 vCPU, 4 GB RAM, 50 GB disk) in an India region, with Docker installed.
- A domain or sub-domain (for example `billing.yourshop.in`) whose DNS **A record** points at the server's IP.

## First start
```sh
git clone <this repo> mqube && cd mqube/tileflowretail/deploy
cp .env.production.example .env.production
# fill in DOMAIN and the secrets (openssl rand -hex 32 for each), and the first admin password
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml logs -f api    # wait for "Starting MQube API..."
```
Then open `https://<DOMAIN>` and sign in as `admin` with `MQUBE_ADMIN_PASSWORD`.

On first start the API migrates both databases, then creates:
- the company;
- the admin user;
- the four tile categories;
- a Main Showroom and a Main Godown;
- a Walk-in customer.

No demo users, demo customers or sample stock are created, and restarts never reset passwords.

## Local server in the shop (no cloud, no domain)
One computer in the shop runs MQube. Every other computer on the shop network opens it in a browser.

- **Server:** a desktop or mini PC that stays on. Ubuntu 24.04 is recommended; Windows with Docker Desktop also works. 4 GB RAM or more, SSD, and a UPS.
- **Install on Ubuntu:** `sudo bash local/install-linux.sh`. It installs Docker, asks for the owner password and a backup folder, generates every secret, and starts MQube.
- **Install on Windows:** install Docker Desktop, then `powershell -ExecutionPolicy Bypass -File local\install-windows.ps1`.
- **Open it:** `http://<server-ip>` from any shop computer. Sign in as `admin`.
- **Fixed address:** reserve the server's IP in the router (DHCP reservation), so the address never changes.
- **Starts by itself:** Docker starts on boot and MQube restarts automatically after a power cut.
- **Backups:** point the backup folder at an external drive, and also copy it somewhere outside the shop each week.
- **Internet:** needed only for the first install and for updates. Daily billing works on the shop network alone.
- **HTTP:** traffic stays inside the shop network. A few "copy to clipboard" buttons need HTTPS and do not work over plain HTTP; billing, stock and printing are not affected.

## Day one, in the app
1. **Business Profile:** add your legal name, GSTIN, address, phone and bank details. These print on every bill, and the GSTIN state decides CGST+SGST or IGST.
2. **Godowns and showrooms:** rename or add your locations.
3. **Users:** create staff logins (manager or cashier) for each person.
4. **Item Master:** add brands, items, HSN and GST rates.
5. **Stock in:** add opening stock with an Inward GRN for each godown.

## Backups
- **What and when:** the `backup` container saves both databases every 24 hours to `BACKUP_DIR` and keeps the last 14 days.
- **Copy them off the server:** copy that folder somewhere else as well, for example with a nightly `rclone` to Google Drive or S3. A backup kept only on the server is lost if the server is lost.
- **Restore:**
  ```sh
  docker compose -f docker-compose.prod.yml exec -T db pg_restore -U mqube -d tileflow001 --clean < backups/tileflow001_<date>.dump
  ```

## Updating
```sh
git pull && docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```
Migrations run automatically on every start.
