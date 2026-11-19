<div align="center">

# lnk.it

### Um projeto full-stack: da interface à infraestrutura.

### Corte o link. Não a ideia.

Transforme URLs enormes em links curtos, simples de compartilhar e fáceis de
acompanhar.

</div>

---

## 📁 Estrutura do repositório

```
.
├── server/   # Back-end + DevOps (Fastify, Drizzle, PostgreSQL, Docker, AWS)
└── web/      # Front-end (React + Vite, SPA)
```

Cada pasta é um projeto independente, com seu próprio `package.json`,
`pnpm-lock.yaml` e `.env.example`.

## ✂️ O que dá para fazer

| Recurso | O que faz |
| --- | --- |
| **Encurtar** | Cria um link com uma URL encurtada personalizada (validada e única). |
| **Listar** | Lista os links cadastrados com paginação e contagem de acessos. |
| **Redirecionar** | `/:url-encurtada` busca a URL original, incrementa o acesso e redireciona. |
| **Remover** | Exclui um link. |
| **Exportar** | Gera um CSV com nome aleatório e único no Cloudflare R2 (CDN). |

## ⚙️ Back-end (`server/`)

**TypeScript**, **Fastify**, **Drizzle**, **PostgreSQL**, **Zod**, OpenAPI +
Scalar e Cloudflare R2.

```bash
cd server
cp .env.example .env          # preencha as variáveis
docker compose up -d pg       # PostgreSQL local
pnpm install
pnpm db:migrate               # executa as migrations
pnpm dev                      # http://localhost:3333 (docs em /docs)
```

### Endpoints

| Método | Caminho | Descrição |
| --- | --- | --- |
| `POST` | `/links` | Cria um link (`originalUrl`, `shortCode`). `400` se mal formatado, `409` se já existir. |
| `GET` | `/links?page=1&pageSize=20` | Lista os links (paginado). |
| `GET` | `/links/:shortCode` | Obtém a URL original pela URL encurtada. |
| `PATCH` | `/links/:id/access` | Incrementa a quantidade de acessos. |
| `DELETE` | `/links/:id` | Remove um link. |
| `POST` | `/links/exports` | Exporta os links em CSV para o R2 e retorna `reportUrl`. |
| `GET` | `/health` | Verifica se a API está no ar. |

O CSV contém: URL original, URL encurtada, contagem de acessos e data de
criação.

### Docker

```bash
cd server
docker build -t lnk-it-server .
docker compose up --build     # API + PostgreSQL
```

O `Dockerfile` usa build multi-stage, instala só as dependências de produção na
imagem final e roda com o usuário `node`.

### ☁️ Deploy na AWS

O workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)
valida `server/` e `web/` (typecheck, lint, build e Trivy) e publica a imagem
do `server/` no **Amazon ECR**. A task definition Fargate de referência está em
[`server/.aws/task-definition.json`](./server/.aws/task-definition.json)
(substitua os valores `REPLACE_WITH_*`).

## 🖥️ Front-end (`web/`)

**React**, **Vite** (SPA), **TypeScript**, **Tailwind CSS**, **React Router**,
**React Query**, **React Hook Form** e **Zod**.

```bash
cd web
cp .env.example .env
pnpm install
pnpm dev                      # http://localhost:5173
```

Páginas:

- `/` — formulário de cadastro e listagem dos links (com download do CSV);
- `/:url-encurtada` — redireciona para a URL original;
- qualquer outra rota — página de recurso não encontrado.

## 🧪 Verificações

```bash
cd server && pnpm typecheck && pnpm lint && pnpm build
cd web && pnpm typecheck && pnpm lint && pnpm build
```

---

<div align="center">

**lnk.it — um link longo a menos.**

</div>
