FROM mcr.microsoft.com/playwright:v1.42.1-jammy

# Create app directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install application dependencies
RUN npm ci

# Copy source code files
COPY . .

# Environment flag to let playwright run in headless mode inside docker
ENV HEADLESS=true
ENV NODE_ENV=production

# Compile TypeScript
RUN npx tsc

# Start the worker daemon
CMD [ "npm", "start" ]
