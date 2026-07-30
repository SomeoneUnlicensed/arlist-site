# Build React
FROM node:22-bookworm-slim AS build-client
WORKDIR /app/react-app
COPY react-app/package*.json ./
RUN npm install
COPY react-app/ ./
RUN npm run build

# Build Backend
FROM node:22-bookworm-slim AS build-server
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .
RUN npm run build

# Final Stage
FROM node:22-bookworm-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build-server /app/dist ./dist
COPY --from=build-server /app/node_modules ./node_modules
COPY --from=build-server /app/package*.json ./
COPY --from=build-server /app/prisma ./prisma
COPY --from=build-server /app/html ./html
COPY --from=build-client /app/dist-client ./dist-client

EXPOSE 8086
CMD ["sh", "-c", "npx prisma db push --schema=/app/prisma/schema.prisma && npm start"]
