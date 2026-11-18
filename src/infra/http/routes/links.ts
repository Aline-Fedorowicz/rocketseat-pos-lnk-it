import { randomBytes, randomUUID } from 'node:crypto'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { pool } from '../../database/pool.js'
import { createLinkSchema, linkIdParamsSchema } from '../schemas/link.js'

function isDuplicateShortCode(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  )
}

export const linksRoutes: FastifyPluginAsyncZod = async app => {
  app.post(
    '/',
    {
      schema: {
        tags: ['Links'],
        summary: 'Cria um link curto',
        description:
          'Gera um código curto automaticamente ou utiliza o código personalizado enviado.',
        body: createLinkSchema,
        response: {
          201: {
            description: 'Link criado.',
            type: 'object',
            required: [
              'id',
              'originalUrl',
              'shortCode',
              'createdAt',
              'accessCount',
            ],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'ID do link.',
              },
              originalUrl: {
                type: 'string',
                format: 'uri',
                description: 'URL original.',
                example: 'https://example.com/articles/long-url',
              },
              shortCode: {
                type: 'string',
                description: 'Código curto do link.',
                example: 'guia',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Data de criação.',
              },
              accessCount: {
                type: 'integer',
                minimum: 0,
                description: 'Quantidade de acessos.',
              },
            },
            examples: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                originalUrl: 'https://example.com/articles/long-url',
                shortCode: 'guia',
                createdAt: '2026-11-18T10:00:00.000Z',
                accessCount: 0,
              },
            ],
          },
          400: {
            description: 'Falha de validação.',
            type: 'object',
            properties: {
              statusCode: { type: 'integer', example: 400 },
              error: { type: 'string', example: 'Bad Request' },
              message: { type: 'string', example: 'Invalid URL' },
            },
          },
          409: {
            description: 'O código curto já está em uso.',
            type: 'object',
            properties: {
              error: {
                type: 'string',
                example: 'Short code is already in use',
              },
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
      const { originalUrl, shortCode } = request.body
      const id = randomUUID()
      const code = shortCode ?? randomBytes(5).toString('base64url').slice(0, 7)

      try {
        const result = await pool.query(
          `INSERT INTO links (id, original_url, short_code)
           VALUES ($1, $2, $3)
           RETURNING id, original_url, short_code, created_at`,
          [id, originalUrl, code]
        )

        return reply.code(201).send({
          id: result.rows[0].id,
          originalUrl: result.rows[0].original_url,
          shortCode: result.rows[0].short_code,
          createdAt: result.rows[0].created_at.toISOString(),
          accessCount: 0,
        })
      } catch (error) {
        if (isDuplicateShortCode(error)) {
          return reply.code(409).send({ error: 'Short code is already in use' })
        }

        throw error
      }
    }
  )

  app.get(
    '/',
    {
      schema: {
        tags: ['Links'],
        summary: 'Lista os links',
        description:
          'Lista os links por página, incluindo a quantidade de acessos.',
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1),
          perPage: z.coerce.number().int().min(1).max(100).default(20),
        }),
        response: {
          200: {
            description: 'Lista paginada dos links cadastrados.',
            type: 'array',
            items: {
              type: 'object',
              required: [
                'id',
                'originalUrl',
                'shortCode',
                'createdAt',
                'accessCount',
              ],
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  description: 'ID do link.',
                },
                originalUrl: {
                  type: 'string',
                  format: 'uri',
                  description: 'URL original.',
                },
                shortCode: {
                  type: 'string',
                  description: 'Código curto do link.',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Data de criação.',
                },
                accessCount: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Quantidade de acessos.',
                },
              },
            },
            examples: [
              [
                {
                  id: '123e4567-e89b-12d3-a456-426614174000',
                  originalUrl: 'https://example.com/articles/long-url',
                  shortCode: 'guia',
                  createdAt: '2026-11-18T10:00:00.000Z',
                  accessCount: 3,
                },
              ],
            ],
          },
          400: {
            description: 'Falha de validação nos parâmetros de paginação.',
            type: 'object',
            properties: {
              statusCode: { type: 'integer', example: 400 },
              error: { type: 'string', example: 'Bad Request' },
              message: { type: 'string', example: 'Invalid querystring' },
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
    async request => {
      const { page, perPage } = request.query
      const offset = (page - 1) * perPage
      const result = await pool.query(
        `SELECT l.id, l.original_url, l.short_code, l.created_at,
                COUNT(a.id)::int AS access_count
         FROM links l
         LEFT JOIN link_accesses a ON a.link_id = l.id
         GROUP BY l.id
         ORDER BY l.created_at DESC
         LIMIT $1 OFFSET $2`,
        [perPage, offset]
      )

      return result.rows.map(row => ({
        id: row.id,
        originalUrl: row.original_url,
        shortCode: row.short_code,
        createdAt: row.created_at.toISOString(),
        accessCount: row.access_count,
      }))
    }
  )

  app.get(
    '/:id/metrics',
    {
      schema: {
        tags: ['Links'],
        summary: 'Consulta os acessos de um link',
        description: 'Retorna os dados do link e o histórico de acessos.',
        params: linkIdParamsSchema,
        response: {
          200: {
            description: 'Relatório de acessos do link.',
            type: 'object',
            required: ['link', 'totalAccesses', 'accesses'],
            properties: {
              link: {
                type: 'object',
                required: ['id', 'originalUrl', 'shortCode', 'createdAt'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  originalUrl: { type: 'string', format: 'uri' },
                  shortCode: { type: 'string', example: 'guia' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
              totalAccesses: {
                type: 'integer',
                minimum: 0,
                description: 'Quantidade total de acessos.',
              },
              accesses: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['id', 'accessedAt', 'userAgent', 'referer'],
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    accessedAt: { type: 'string', format: 'date-time' },
                    userAgent: { type: 'string', nullable: true },
                    referer: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          400: {
            description: 'ID do link inválido.',
            type: 'object',
            properties: {
              statusCode: { type: 'integer', example: 400 },
              error: { type: 'string', example: 'Bad Request' },
              message: { type: 'string', example: 'Invalid link ID' },
            },
          },
          404: {
            description: 'Link não encontrado.',
            type: 'object',
            properties: {
              error: { type: 'string', example: 'Link not found' },
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
      const linkResult = await pool.query(
        `SELECT id, original_url, short_code, created_at
         FROM links
         WHERE id = $1`,
        [request.params.id]
      )

      if (linkResult.rowCount === 0) {
        return reply.code(404).send({ error: 'Link not found' })
      }

      const accessesResult = await pool.query(
        `SELECT id, accessed_at, user_agent, referer
         FROM link_accesses
         WHERE link_id = $1
         ORDER BY accessed_at DESC`,
        [request.params.id]
      )

      return {
        link: {
          id: linkResult.rows[0].id,
          originalUrl: linkResult.rows[0].original_url,
          shortCode: linkResult.rows[0].short_code,
          createdAt: linkResult.rows[0].created_at.toISOString(),
        },
        totalAccesses: accessesResult.rowCount ?? 0,
        accesses: accessesResult.rows.map(row => ({
          id: row.id,
          accessedAt: row.accessed_at.toISOString(),
          userAgent: row.user_agent,
          referer: row.referer,
        })),
      }
    }
  )

  app.delete(
    '/:id',
    {
      schema: {
        tags: ['Links'],
        summary: 'Remove um link',
        description: 'Remove o link e todos os acessos associados.',
        params: linkIdParamsSchema,
        response: {
          204: { description: 'Link removido.' },
          400: {
            description: 'ID do link inválido.',
            type: 'object',
            properties: {
              statusCode: { type: 'integer', example: 400 },
              error: { type: 'string', example: 'Bad Request' },
              message: { type: 'string', example: 'Invalid link ID' },
            },
          },
          404: {
            description: 'Link não encontrado.',
            type: 'object',
            properties: {
              error: { type: 'string', example: 'Link not found' },
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
      const result = await pool.query('DELETE FROM links WHERE id = $1', [
        request.params.id,
      ])

      if (result.rowCount === 0) {
        return reply.code(404).send({ error: 'Link not found' })
      }

      return reply.code(204).send()
    }
  )
}
