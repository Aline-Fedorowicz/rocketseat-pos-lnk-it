import { randomUUID } from 'node:crypto'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { pool } from '../../database/pool.js'
import { shortCodeParamsSchema } from '../schemas/link.js'

export const shortLinksRoute: FastifyPluginAsyncZod = async app => {
  app.get(
    '/:shortCode',
    {
      schema: {
        tags: ['Redirecionamentos'],
        summary: 'Abre um link curto',
        description: 'Registra o acesso e redireciona para a URL original.',
        params: shortCodeParamsSchema,
        response: {
          302: {
            description: 'Redireciona para a URL original.',
            headers: {
              Location: {
                description: 'URL original do link.',
                schema: { type: 'string', format: 'uri' },
              },
            },
          },
          400: {
            description: 'Código curto inválido.',
            type: 'object',
            properties: {
              statusCode: { type: 'integer', example: 400 },
              error: { type: 'string', example: 'Bad Request' },
              message: { type: 'string', example: 'Invalid short code' },
            },
          },
          404: {
            description: 'Link curto não encontrado.',
            type: 'object',
            properties: {
              error: { type: 'string', example: 'Short link not found' },
            },
          },
          500: {
            description: 'Erro interno do servidor.',
            type: 'object',
            properties: {
              statusCode: { type: 'integer', example: 500 },
              error: { type: 'string', example: 'Internal Server Error' },
              message: { type: 'string', example: 'Internal Server Error' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await pool.query(
        `SELECT id, original_url
         FROM links
         WHERE short_code = $1`,
        [request.params.shortCode.toLowerCase()]
      )
      const link = result.rows[0]

      if (!link) {
        return reply.code(404).send({ error: 'Short link not found' })
      }

      await pool.query(
        `INSERT INTO link_accesses (id, link_id, user_agent, referer)
         VALUES ($1, $2, $3, $4)`,
        [
          randomUUID(),
          link.id,
          request.headers['user-agent'] ?? null,
          request.headers.referer ?? null,
        ]
      )

      return reply.redirect(link.original_url, 302)
    }
  )
}
