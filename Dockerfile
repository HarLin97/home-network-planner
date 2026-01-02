# 使用多阶段构建
# 阶段 1: 构建
FROM public.ecr.aws/docker/library/node:18-alpine AS build

WORKDIR /app

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./

# 设置为开发环境以确保安装 devDependencies (如 typescript, @types/*)
ENV NODE_ENV=development

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# 阶段 2: 运行 (使用 Caddy)
FROM public.ecr.aws/docker/library/caddy:2-alpine AS runtime

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# 复制 Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
EXPOSE 443
