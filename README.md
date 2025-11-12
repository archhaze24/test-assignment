# Test Assignment

API для работы с блокчейнами Cosmos и EVM.

## Установка

```
pnpm install
cp .env.example .env
```

В `.env.example` указаны публичные RPC.

## Запуск

### Dev-режим

```bash
pnpm run start:dev
```

### Prod-режим

```bash
pnpm run build
pnpm run start:prod
```

### Docker

```bash
docker compose up -d
```

## Swagger

Swagger документация доступна по пути `/api/docs`.
