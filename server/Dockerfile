# Use Node.js 20 Alpine (lightweight)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy the rest of the server code
COPY . .

# Cloud Run requires port 8080
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
