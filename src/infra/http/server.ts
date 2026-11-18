import { readFileSync } from 'node:fs'
import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import scalarApiReference from '@scalar/fastify-api-reference'
import { fastify } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { pool } from '../database/pool.js'
import { healthRoute } from './routes/health.js'
import { linksRoutes } from './routes/links.js'
import { shortLinksRoute } from './routes/short-links.js'

const server = fastify({
  logger: true,
  ignoreTrailingSlash: true,
}).withTypeProvider<ZodTypeProvider>()

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

const corsOrigins = (process.env.WEB_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())

server.register(fastifyCors, { origin: corsOrigins })

server.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'lnk.it API',
      description:
        'API para encurtar URLs, redirecionar links e acompanhar acessos.',
      version: '1.0.0',
    },
    servers: [
      { url: 'http://localhost:3333', description: 'Desenvolvimento local' },
    ],
    tags: [
      { name: 'Links', description: 'Criação e gerenciamento de links curtos' },
      { name: 'Redirecionamentos', description: 'Abertura de links curtos' },
      { name: 'Sistema', description: 'Estado da API' },
    ],
  },
  transform: jsonSchemaTransform,
})

server.register(scalarApiReference, {
  routePrefix: '/docs',
  configuration: {
    pageTitle: 'lnk.it API Reference',
    spec: { url: '/documentation/json' },
    theme: 'purple',
  },
})

server.register(healthRoute)
server.register(linksRoutes, { prefix: '/api/links' })
server.register(shortLinksRoute)

async function start() {
  const schema = readFileSync(
    new URL('../database/schema.sql', import.meta.url),
    'utf8'
  )
  await pool.query(schema)

  await server.listen({
    port: Number(process.env.PORT ?? 3333),
    host: '0.0.0.0',
  })
}

start().catch(async (error: unknown) => {
  server.log.error(error, 'Server startup failed')
  await pool.end()
  process.exitCode = 1
})
