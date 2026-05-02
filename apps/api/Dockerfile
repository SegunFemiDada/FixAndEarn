FROM node:20-alpine

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .

# IMPORTANT: Generate the Prisma client during the build
RUN npx prisma generate --schema=apps/api/schema.prisma

EXPOSE 3000

# Tell Docker how to start your app
CMD ["pnpm", "start"]