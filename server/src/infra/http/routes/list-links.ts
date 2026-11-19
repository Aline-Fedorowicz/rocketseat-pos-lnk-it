import { count, desc } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../db'
import { links } from '../../db/schemas/links'
import { linkSchema } from '../schemas/link'

export const listLinksRoute: FastifyPluginAsyncZod = async app => {
  app.get(
    '/links',
    {
      schema: {
        tags: ['Links'],
        summary: 'Lista os links cadastrados (paginado)',
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1),
          pageSize: z.coerce.number().int().min(1).max(100).default(20),
        }),
        response: {
          200: z.object({
            links: z.array(linkSchema),
            total: z.number().int(),
          }),
        },
      },
    },
    async request => {
      const { page, pageSize } = request.query

      const [rows, [{ total }]] = await Promise.all([
        db
          .select()
          .from(links)
          .orderBy(desc(links.createdAt), desc(links.id))
          .limit(pageSize)
          .offset((page - 1) * pageSize),
        db.select({ total: count() }).from(links),
      ])

      return { links: rows, total }
    }
  )
}
