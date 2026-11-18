FROM node:22-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV API_URL=http://localhost:3333
ENV NODE_ENV=production

RUN pnpm run build

EXPOSE 3000 3333

CMD ["pnpm", "run", "start"]
