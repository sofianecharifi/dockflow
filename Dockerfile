FROM node:24-alpine AS builder

WORKDIR /app

# Install build tools required for native modules (sqlite3/bcrypt)
RUN apk add --no-cache python3 make g++ bash

# Copy package.json files
COPY backend/package*.json ./backend/

WORKDIR /app/backend
# Install production dependencies
RUN npm install --omit=dev

# --- Final Image ---
FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache bash

# Copy node_modules from builder and source files
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY backend/package.json ./backend/package.json
COPY backend/src ./backend/src
COPY backend/app.js ./backend/app.js
COPY frontend ./frontend

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start application without npm wrapper to save memory
WORKDIR /app/backend
CMD ["node", "app.js"]