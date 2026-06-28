FROM node:20-alpine
# rebuild 2026-06-26
WORKDIR /app
COPY . .

ENV DATABASE_URL="file:/data/prod.db"
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

RUN npm install
RUN npx prisma generate
RUN npm run build

RUN mkdir -p /data && chmod 777 /data

# Entrypoint script for reliable startup
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
