FROM node:20-alpine

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

EXPOSE 3000

CMD ["pnpm", "start:prod"]