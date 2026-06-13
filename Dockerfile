FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools required for native modules (sqlite3/bcrypt)
RUN apk add --no-cache python3 make g++

# Copy package.json files
COPY backend/package*.json ./backend/

WORKDIR /app/backend
# Install production dependencies and build sqlite3 from source
RUN npm install --omit=dev --build-from-source=sqlite3

# --- Final Image ---
FROM node:20-alpine

WORKDIR /app

# Copy node_modules from builder and source files
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY backend/package.json ./backend/package.json
COPY backend/src ./backend/src
COPY backend/app.js ./backend/app.js
COPY frontend ./frontend

# Expose port
EXPOSE 3000

# Start application
WORKDIR /app/backend
CMD ["npm", "start"]