# syntax=docker/dockerfile:1

FROM node:20-slim AS build
WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable

# Copy only the files needed to install deps first (better layer caching)
COPY package.json pnpm-lock.yaml tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts drizzle.config.ts components.json ./
COPY patches ./patches
COPY scripts ./scripts
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY drizzle ./drizzle
COPY vercel.json MANUS_DEPLOY.md CONFIGURATION.md ./

# Install full deps for build
RUN pnpm install --frozen-lockfile

# Build client + server bundle into /app/dist
RUN pnpm run build

# Prune to production deps for runtime image
RUN pnpm prune --prod


FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy runtime deps + built output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# The app reads PORT; most hosts set it automatically
EXPOSE 3000

CMD ["node", "dist/index.js"]
