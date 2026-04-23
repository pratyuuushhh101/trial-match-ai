# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Final stage
FROM node:20-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy source from builder
COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "start"]
