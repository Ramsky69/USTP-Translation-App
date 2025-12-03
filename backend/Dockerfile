FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Cloud platforms like Cloud Run set PORT; default to 8080
ENV PORT=8080

EXPOSE 8080

CMD ["node", "index.js"]
