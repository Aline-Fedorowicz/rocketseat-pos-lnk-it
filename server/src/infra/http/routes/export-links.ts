import { PassThrough, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { stringify } from 'csv-stringify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { pg } from '../../db'
import { uploadFileToStorage } from '../../storage/upload-file-to-storage'

export const exportLinksRoute: FastifyPluginAsyncZod = async app => {
  app.post(
    '/links/exports',
    {
      schema: {
        tags: ['Links'],
        summary: 'Exporta os links cadastrados em CSV',
        description:
          'Gera um CSV com nome aleatório e único, envia para a CDN (Cloudflare R2) e retorna a URL pública.',
        response: {
          200: z.object({ reportUrl: z.string().url() }),
        },
      },
    },
    async () => {
      const cursor = pg`
        SELECT original_url, short_code, access_count, created_at
        FROM links
        ORDER BY created_at DESC
      `.cursor(100)

      const csv = stringify({
        delimiter: ',',
        header: true,
        columns: [
          { key: 'original_url', header: 'URL original' },
          { key: 'short_code', header: 'URL encurtada' },
          { key: 'access_count', header: 'Contagem de acessos' },
          { key: 'created_at', header: 'Data de criação' },
        ],
      })

      const uploadStream = new PassThrough()

      const convertToCsvPipeline = pipeline(
        cursor,
        new Transform({
          objectMode: true,
          transform(chunks: unknown[], _encoding, callback) {
            for (const chunk of chunks) {
              this.push(chunk)
            }
            callback()
          },
        }),
        csv,
        uploadStream
      )

      const uploadToStorage = uploadFileToStorage({
        folder: 'downloads',
        fileName: 'links.csv',
        contentType: 'text/csv',
        contentStream: uploadStream,
      })

      const [{ url }] = await Promise.all([
        uploadToStorage,
        convertToCsvPipeline,
      ])

      return { reportUrl: url }
    }
  )
}
