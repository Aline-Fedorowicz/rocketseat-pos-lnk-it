<div align="center">

# lnk.it

### Um projeto full-stack: da interface à infraestrutura.

### Corte o link. Não a ideia.

Transforme URLs enormes em links curtos, simples de compartilhar e fáceis de
acompanhar.

[Começar](#-comece-por-aqui) · [O que é](#-o-que-é-o-lnkit) ·
[Como funciona](#-como-funciona) · [Tecnologias](#-por-baixo-do-capô)

</div>


---

## ✂️ O que é o lnk.it?

O **lnk.it** é um encurtador de URLs: você entrega aquele endereço comprido,
cheio de parâmetros, e recebe um link curto que leva ao mesmo destino.

O nome acompanha a ideia. **`lnk`** é *link* já enxuto — as vogais foram
cortadas — e **`.it`** dá o empurrão de uma chamada para a ação: *link it*.
Em outras palavras: **“corta isso, esse link!”**. Menos endereço, mais fácil
de compartilhar.

Além de encurtar, o projeto permite escolher um código personalizado, consultar
os links criados, ver quantas vezes foram acessados e remover links que não são
mais necessários.

> **Exemplo**
>
> `https://exemplo.com/artigos/guia-completo?origem=newsletter`
>
> vira
>
> `lnk.it/guia`

> `lnk.it` é a identidade do projeto. No ambiente local, os links curtos usam
> `http://localhost:3333`; em produção, configure o domínio desejado.

## ✨ O que dá para fazer

| Recurso | O que faz |
| --- | --- |
| **Encurtar** | Cria um código curto para qualquer URL HTTP ou HTTPS. |
| **Personalizar** | Permite sugerir um código próprio, se estiver disponível. |
| **Organizar** | Lista os links criados e a quantidade de acessos. |
| **Acompanhar** | Registra data, navegador e origem de cada redirecionamento. |
| **Redirecionar** | Leva quem abre o link curto ao endereço original. |
| **Remover** | Exclui o link e o relatório de acessos associado. |

A listagem aceita `page` e `perPage` para navegação paginada.

## 🧩 Um projeto full-stack

O **lnk.it** reúne as três partes da aplicação: uma interface para quem usa o
produto, um backend que implementa as regras e uma base de DevOps para executar
os serviços em conjunto.

### 🖥️ Frontend

Construído com **Next.js**, **React**, **TypeScript**, **Tailwind CSS** e
**tailwind-variants**:

- interface responsiva para criar e consultar links;
- formulário com opção de personalizar o código curto;
- lista de links com contagem de acessos e paginação pela API;
- ações para copiar, remover e consultar o relatório de acessos;
- estilos utilitários Tailwind e variantes compartilhadas para botões e avisos.

### ⚙️ Backend

Construído com **Node.js**, **Fastify**, **TypeScript**, **Zod** e
**PostgreSQL**:

- rotas tipadas organizadas como plugins Fastify;
- validação de payloads, parâmetros e paginação com schemas Zod;
- criação e listagem de links, remoção, métricas e redirecionamentos;
- registro dos acessos com data, navegador e origem;
- especificação **OpenAPI** e documentação interativa **Scalar**.

### 🛠️ DevOps

Preparado para desenvolvimento local e execução em containers:

- **pnpm + Corepack** para fixar e instalar as dependências;
- **Dockerfile** para construir a imagem Node.js da aplicação;
- **Docker Compose** para executar frontend e API no mesmo container, com o
  PostgreSQL em um container separado;
- verificação de saúde do banco e dependência de inicialização da API;
- volume persistente para os dados do PostgreSQL;
- variáveis de ambiente documentadas em `.env.example`.

## ☁️ Deploy na AWS

O deploy de referência segue **ECR → ECS/Fargate**, com **GitHub Actions**,
**CloudWatch Logs** e análise **Trivy**. A imagem é construída e verificada
antes de ser publicada no ECR; em seguida, a action registra a nova task
definition e aguarda o serviço ECS estabilizar.

Arquivos de infraestrutura incluídos:

- [`.aws/task-definition.json`](./.aws/task-definition.json): task Fargate
  Linux/X86_64, container `lnk-it`, portas `3000` (Next.js) e `3333` (Fastify),
  health check e CloudWatch Logs;
- [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml): typecheck,
  lint, build, Trivy e deploy por push à branch `main`.

### Preparar a conta AWS

1. Crie um repositório ECR e um cluster ECS com serviço Fargate. Sugestão de
   nomes para este projeto: cluster `lnk-it-cluster`, serviço `lnk-it-service`
   e família da task definition `lnk-it`.
2. Crie uma instância PostgreSQL no **Amazon RDS** em uma VPC acessível pelas
   tasks. Crie no Secrets Manager um secret cujo valor seja a connection string
   PostgreSQL completa e segura; ela será injetada como `DATABASE_URL`.
3. Crie uma task execution role com permissões para baixar do ECR, publicar no
   CloudWatch Logs e ler o secret de conexão. Limite o acesso ao secret e à
   chave KMS necessária. Não é necessário dar permissões de S3 à aplicação.
4. No arquivo `.aws/task-definition.json`, substitua os valores
   `REPLACE_WITH_*` pela execution role ARN, ARN do secret e região apropriada.
   Crie previamente o grupo `/ecs/lnk-it` ou autorize a criação pela execution
   role.
5. Configure o service Fargate atrás de um **Application Load Balancer**. O
   target group deve encaminhar à porta `3000` e verificar `GET /health` com
   resposta `200`. A porta `3333` é interna ao task: Next.js encaminha `/api`
   e links curtos ao Fastify. Permita entrada nas tasks somente a partir do
   security group do ALB; permita saída para PostgreSQL/RDS e para ECR/Logs
   (NAT ou VPC endpoints em subnets privadas).
6. Configure o GitHub Actions para OIDC: crie uma IAM role confiável apenas
   para este repositório e branch `main`, com as permissões mínimas de ECR
   (`GetAuthorizationToken`, `BatchCheckLayerAvailability`,
   `InitiateLayerUpload`, `UploadLayerPart`, `CompleteLayerUpload`,
   `PutImage`) e ECS (`RegisterTaskDefinition`, leitura da task definition,
   atualização e leitura do serviço), além de `iam:PassRole` apenas para a
   execution role desta task.
7. Cadastre no repositório GitHub as **Variables** `AWS_REGION`,
   `ECR_REPOSITORY` (nome, sem URI), `ECS_CLUSTER` (`lnk-it-cluster`) e
   `ECS_SERVICE` (`lnk-it-service`), e o
   **Secret** `AWS_ROLE_ARN` com a ARN da role de deploy/OIDC. A role precisa
   confiar no `token.actions.githubusercontent.com`, restringindo
   `sub` ao repositório e à branch usados no deploy.
8. Faça push para `main` e confira a execução do workflow, a estabilidade do
   serviço e os logs no grupo `/ecs/lnk-it`.

### Publicar a imagem manualmente no Amazon ECR

Use a região e o repositório ECR da sua conta. O exemplo abaixo usa a conta
`372293371742`, a região `us-east-2` e o repositório `lnk-it`; ajuste os valores
se seu ambiente for diferente. Não coloque access keys neste README, no código
ou em comandos salvos no histórico do terminal.

Com AWS CLI autenticado e Docker em execução, rode na raiz do projeto
(Git Bash):

```bash
# Autentique o Docker no ECR
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 372293371742.dkr.ecr.us-east-2.amazonaws.com

# Construa e marque a imagem local para o ECR
docker compose build app
docker tag lnkit-app:v1 372293371742.dkr.ecr.us-east-2.amazonaws.com/lnk-it:v1

# Envie a imagem para o ECR
docker push 372293371742.dkr.ecr.us-east-2.amazonaws.com/lnk-it:v1
```

Para baixar a imagem publicada em outra máquina, faça login no ECR com a AWS
CLI e execute:

```bash
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 372293371742.dkr.ecr.us-east-2.amazonaws.com
docker pull 372293371742.dkr.ecr.us-east-2.amazonaws.com/lnk-it:v1
```

> **Não copie identificadores entre contas.** Região, nomes, ARNs, VPC, subnets,
> grupos de segurança e domínios devem pertencer ao ambiente AWS de destino.
> O template não configura a infraestrutura da conta: ECR, ECS, RDS, ALB,
> OIDC/IAM, Secrets Manager e rede precisam ser criados e revisados nela.
> O domínio público é usado automaticamente pela interface para montar links
> curtos; configure DNS e HTTPS no ALB antes de compartilhar os links.

## 🚀 Comece por aqui

### Você vai precisar

- Node.js 20.10 ou superior, com Corepack habilitado
- Docker e Docker Compose

### Desenvolvimento local

```bash
# Ative o pnpm pelo Corepack e instale as dependências
corepack enable
pnpm install

# Inicie o PostgreSQL
docker compose up -d pg

# Inicie a API e o Next.js
pnpm dev
```

Abra **http://localhost:3000**. A API fica disponível em
**http://localhost:3333**; a documentação interativa fica em
**http://localhost:3333/docs**.

As configurações locais podem ser ajustadas em `.env` (veja
[`.env.example`](./.env.example)). O esquema do banco é criado automaticamente
quando a API inicia.

### Tudo com Docker

```bash
docker compose up --build
```

O Compose inicia dois containers: um para a aplicação (Next.js e API Fastify)
e outro para o PostgreSQL. Abra **http://localhost:3000**; essa é a única porta
publicada no computador. A aplicação encaminha internamente as chamadas para
a API, e o PostgreSQL persiste os dados no volume `postgres_data`.

Para conferir os containers e pará-los:

```bash
docker compose ps
docker compose down
```

### Publicar a imagem no Docker Hub

O serviço `app` constrói a imagem local `lnkit-app:v1`. Para publicá-la no
Docker Hub usando a conta `alinewicz`, execute na raiz do projeto:

```bash
# Construa a imagem
docker compose build app

# Autentique-se no Docker Hub
docker login

# Marque a imagem com o usuário e o repositório do Docker Hub
docker tag lnkit-app:v1 alinewicz/lnkit-app:v1

# Envie a imagem para o Docker Hub
docker push alinewicz/lnkit-app:v1
```

Depois do envio, a imagem estará disponível como
`alinewicz/lnkit-app:v1`. Antes de enviar, confirme que o repositório
`lnkit-app` existe na conta do Docker Hub e que sua conta tem permissão para
publicar nele.

### Baixar e executar a imagem publicada

Em outra máquina, baixe a imagem do Docker Hub e marque-a com o nome local
esperado pelo Compose:

```bash
docker pull alinewicz/lnkit-app:v1
docker tag alinewicz/lnkit-app:v1 lnkit-app:v1
```

Na raiz do projeto, inicie os serviços sem reconstruir a imagem da aplicação:

```bash
docker compose up -d --no-build
```

O Compose ainda inicia o PostgreSQL e conecta a aplicação a ele. Acesse
**http://localhost:3000**. Para conferir a imagem local, use
`docker image ls lnkit-app`.

## 🔌 Como funciona

O navegador conversa com o **Next.js**, que encaminha `/api/*` para a API
**Fastify**. O Fastify valida as entradas com **Zod**, persiste os dados no
**PostgreSQL** e registra um acesso quando alguém abre um link curto.

```text
┌─────────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│  Next.js            │ ───▶  │  Fastify + Zod  │ ───▶  │  PostgreSQL      │
│  interface web      │       │  API e redirects│       │  links e acessos│
└─────────────────────┘       └─────────────────┘       └──────────────────┘
```

### Endpoints

| Método | Caminho | Descrição |
| --- | --- | --- |
| `POST` | `/api/links` | Cria um link (`originalUrl`, opcionalmente `shortCode`). |
| `GET` | `/api/links` | Lista os links e a contagem de acessos. |
| `GET` | `/api/links/:id/metrics` | Consulta os acessos de um link. |
| `DELETE` | `/api/links/:id` | Remove um link. |
| `GET` | `/:shortCode` | Registra o acesso e redireciona ao destino. |
| `GET` | `/health` | Verifica se a API está no ar. |

A referência interativa usa **Scalar** e é gerada a partir da especificação
**OpenAPI** em `/documentation/json`. Schemas **Zod** validam as entradas e
também descrevem corpos e respostas na documentação.

## 🧰 Por baixo do capô

- **Next.js** — aplicação web e encaminhamento das chamadas à API
- **Fastify** — API HTTP e redirecionamentos
- **Zod** — validação de dados
- **OpenAPI + Scalar** — documentação navegável e interativa da API
- **PostgreSQL** — armazenamento de links e acessos
- **Docker Compose** — ambiente local reproduzível
- **TypeScript** — tipos no frontend e no backend

## 🧪 Verificações

```bash
pnpm typecheck
pnpm lint
pnpm build
```

---

<div align="center">

**lnk.it — um link longo a menos.**

</div>
