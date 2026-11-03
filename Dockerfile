

# ---------------------------------------------------------------------
# Stage 1: Build Frontend and Server
# ---------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------------------------------------------------------------------
# Stage 2: Production Runtime
# ---------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime dependencies for healthcheck curl and git CLI
RUN apk add --no-cache curl git

COPY --from=builder /usr/src/app .

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
