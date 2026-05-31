# Simple single-stage image for a one-command demo run.
# `docker compose up` generates the Prisma client, creates + seeds the SQLite DB,
# then starts Next.js. No external services required.
FROM node:20-alpine

# Prisma needs openssl on Alpine.
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV DATABASE_URL="file:./dev.db"
ENV NODE_ENV="development"
EXPOSE 3000

CMD ["sh", "-c", "npm run db:setup && npx next dev -H 0.0.0.0"]
