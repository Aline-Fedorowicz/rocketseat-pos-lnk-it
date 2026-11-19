import { randomUUID } from 'node:crypto'
import type { Readable } from 'node:stream'
import { Upload } from '@aws-sdk/lib-storage'
import { env } from '../../env/index'
import { r2 } from './client'

interface UploadFileToStorageInput {
  folder: string
  fileName: string
  contentType: string
  contentStream: Readable
}

export async function uploadFileToStorage({
  folder,
  fileName,
  contentType,
  contentStream,
}: UploadFileToStorageInput) {
  const key = `${folder}/${randomUUID()}-${fileName}`

  const upload = new Upload({
    client: r2,
    params: {
      Key: key,
      Bucket: env.CLOUDFLARE_BUCKET,
      Body: contentStream,
      ContentType: contentType,
    },
  })

  await upload.done()

  return {
    key,
    url: new URL(
      key,
      `${env.CLOUDFLARE_PUBLIC_URL.replace(/\/$/, '')}/`
    ).toString(),
  }
}
