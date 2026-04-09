# ══════════════════════════════════════════════════════════════════════════════
# ImmoMaroc — Frontend Dockerfile
# Build : Node 20 (Debian slim — build stage only, not shipped)
# Runtime: Ubuntu 22.04 + Nginx
# ══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Build React app ──────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Copy package files first (layer cache: reinstall only when deps change)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Copy all source files
# VITE_API_URL is intentionally empty so all /api/ and /uploads/
# calls are relative URLs → Nginx handles the routing at runtime.
COPY . .
RUN npm run build

# ── Stage 2: Serve with Nginx on Ubuntu 22.04 ─────────────────────────────────
FROM ubuntu:22.04
LABEL maintainer="ImmoMaroc"

# Prevent apt from asking interactive questions during build
ENV DEBIAN_FRONTEND=noninteractive

# Install Nginx + curl (for healthcheck) + clean cache
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx curl && \
    rm -rf /var/lib/apt/lists/* && \
    # Remove the Ubuntu default site — we use our own config
    rm -f /etc/nginx/sites-enabled/default && \
    # Remove the default HTML page
    rm -rf /usr/share/nginx/html/*

# Copy the built React app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/immomaroc.conf

# The uploads volume will be mounted at runtime by docker-compose (read-only).
# Create the mount point now so Nginx can access it.
RUN mkdir -p /var/immomaroc/uploads

# Nginx runs as www-data on Ubuntu — set correct ownership
RUN chown -R www-data:www-data /usr/share/nginx/html /var/immomaroc/uploads

EXPOSE 80

# Healthcheck — verify Nginx serves the SPA
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:80/ > /dev/null || exit 1

# Run Nginx in foreground (required for Docker)
CMD ["nginx", "-g", "daemon off;"]