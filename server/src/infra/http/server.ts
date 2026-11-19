import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import scalarApiReference from '@scalar/fastify-api-reference'
import { fastify } from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { env } from '../../env'
import { createLinkRoute } from './routes/create-link'
import { deleteLinkRoute } from './routes/delete-link'
import { exportLinksRoute } from './routes/export-links'
import { getLinkByShortCodeRoute } from './routes/get-link-by-short-code'
import { healthRoute } from './routes/health'
import { incrementLinkAccessRoute } from './routes/increment-link-access'
import { listLinksRoute } from './routes/list-links'

const server = fastify({ logger: true })

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.setErrorHandler((error, request, reply) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      message: error.validation[0]?.message ?? 'Dados inválidos.',
      issues: error.validation,
    })
  }

  request.log.error(error)
  return reply.status(500).send({ message: 'Erro interno do servidor.' })
})

server.register(fastifyCors, {
  origin:
    env.WEB_ORIGIN === '*'
      ? '*'
      : env.WEB_ORIGIN.split(',').map(origin => origin.trim()),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
})

server.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'lnk.it API',
      description: 'API para encurtar URLs e gerenciar links.',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
})

server.register(scalarApiReference, { routePrefix: '/docs' })

server.register(healthRoute)
server.register(createLinkRoute)
server.register(listLinksRoute)
server.register(exportLinksRoute)
server.register(getLinkByShortCodeRoute)
server.register(incrementLinkAccessRoute)
server.register(deleteLinkRoute)

server.listen({ port: env.PORT, host: '0.0.0.0' }).catch(error => {
  server.log.error(error)
  process.exit(1)
})
