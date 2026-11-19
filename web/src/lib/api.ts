import { env } from '../env'

export interface Link {
  id: string
  originalUrl: string
  shortCode: string
  accessCount: number
  createdAt: string
}

export interface ListLinksResponse {
  links: Link[]
  total: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.backendUrl}${path}`, {
    ...init,
    headers: init?.body
      ? { 'Content-Type': 'application/json', ...init.headers }
      : init?.headers,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string
    } | null
    throw new ApiError(
      body?.message ?? `A solicitação falhou (${response.status}).`,
      response.status
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const PAGE_SIZE = 20

export function listLinks(page: number) {
  return request<ListLinksResponse>(`/links?page=${page}&pageSize=${PAGE_SIZE}`)
}

export function createLink(data: { originalUrl: string; shortCode: string }) {
  return request<Link>('/links', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteLink(id: string) {
  return request<void>(`/links/${id}`, { method: 'DELETE' })
}

export function getLinkByShortCode(shortCode: string) {
  return request<Link>(`/links/${encodeURIComponent(shortCode)}`)
}

export function incrementLinkAccess(id: string) {
  return request<{ accessCount: number }>(`/links/${id}/access`, {
    method: 'PATCH',
  })
}

export function exportLinks() {
  return request<{ reportUrl: string }>('/links/exports', { method: 'POST' })
}
