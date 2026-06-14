FROM node:20-alpine
WORKDIR /app
COPY . .

ENV DATABASE_URL="file:/data/prod.db"
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

RUN npm install
RUN npx prisma generate
RUN npm run build

RUN mkdir -p /data && chmod 777 /data

EXPOSE 80

CMD ["sh", "-c", "./node_modules/.bin/prisma db push --skip-generate && npx next start -p 80 -H 0.0.0.0"]
