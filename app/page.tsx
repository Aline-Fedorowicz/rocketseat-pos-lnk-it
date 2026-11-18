'use client'

import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ui } from './ui'

interface Link {
  id: string
  originalUrl: string
  shortCode: string
  createdAt: string
  accessCount: number
}

interface Access {
  accessedAt: string
  userAgent: string | null
  referer: string | null
}

interface LinkMetrics {
  link: Omit<Link, 'accessCount'>
  totalAccesses: number
  accesses: Access[]
}

async function getError(response: Response) {
  const body = (await response.json()) as { error?: string }
  return body.error ?? `A solicitação falhou (${response.status})`
}

function App() {
  const [shortUrlBase, setShortUrlBase] = useState(
    () =>
      (process.env.NEXT_PUBLIC_SHORT_URL_BASE ?? 'http://localhost:3333').replace(
        /\/$/,
        '',
      ),
  )
  const [links, setLinks] = useState<Link[]>([])
  const [originalUrl, setOriginalUrl] = useState('')
  const [shortCode, setShortCode] = useState('')
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<LinkMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SHORT_URL_BASE) {
      setShortUrlBase(window.location.origin)
    }
  }, [])

  const loadLinks = useCallback(async () => {
    setError('')
    const response = await fetch('/api/links?page=1&perPage=100')

    if (!response.ok) {
      throw new Error(await getError(response))
    }

    setLinks((await response.json()) as Link[])
  }, [])

  useEffect(() => {
    loadLinks()
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Erro ao carregar links')
      })
      .finally(() => setLoading(false))
  }, [loadLinks])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl,
          ...(shortCode.trim() ? { shortCode: shortCode.trim() } : {}),
        }),
      })

      if (!response.ok) {
        throw new Error(await getError(response))
      }

      setOriginalUrl('')
      setShortCode('')
      setNotice('Link criado com sucesso.')
      await loadLinks()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao criar link')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(link: Link) {
    if (!window.confirm(`Remover o link lnk.it/${link.shortCode}?`)) {
      return
    }

    setError('')
    setNotice('')

    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(await getError(response))
      }

      if (expandedLinkId === link.id) {
        setExpandedLinkId(null)
        setMetrics(null)
      }

      setNotice('Link removido.')
      await loadLinks()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao remover link')
    }
  }

  async function toggleMetrics(link: Link) {
    setError('')

    if (expandedLinkId === link.id) {
      setExpandedLinkId(null)
      setMetrics(null)
      return
    }

    try {
      const response = await fetch(`/api/links/${link.id}/metrics`)

      if (!response.ok) {
        throw new Error(await getError(response))
      }

      setMetrics((await response.json()) as LinkMetrics)
      setExpandedLinkId(link.id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao carregar relatório')
    }
  }

  async function copyShortUrl(link: Link) {
    try {
      await navigator.clipboard.writeText(`${shortUrlBase}/${link.shortCode}`)
      setNotice('Link curto copiado.')
    } catch {
      setError('Não foi possível copiar o link neste navegador.')
    }
  }

  return (
    <main className="mx-auto w-[calc(100%-28px)] max-w-[920px] sm:w-[calc(100%-40px)]">
      <header className="flex h-[68px] items-center justify-between border-b border-line sm:h-[82px]">
        <a className="inline-flex items-center gap-2.5 font-sans text-[21px] font-extrabold tracking-[-1px] text-ink no-underline" href="/" aria-label="lnk.it início">
          <span className={ui.brandMark()}>L</span>
          <span>lnk<span className="text-brand">.</span>it</span>
        </a>
        <span className="hidden text-[13px] text-muted sm:inline">Encurtador de links</span>
        <a
          className="text-xs font-bold text-brand no-underline hover:underline"
          href={`${shortUrlBase}/docs`}
          target="_blank"
          rel="noreferrer"
        >
          API docs <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="py-12 sm:py-16">
        <p className="mb-3 text-[10px] font-bold tracking-[1.4px] text-brand">MENOS CARACTERES, MAIS POSSIBILIDADES</p>
        <h1 className="mb-4 font-sans text-[clamp(40px,7vw,64px)] font-extrabold leading-[1.03] tracking-[-3.8px] text-ink">Links curtos.<br />Ideias longas.</h1>
        <p className="mb-0 max-w-[490px] text-[15px] leading-[1.7] text-muted">
          Crie links fáceis de compartilhar e acompanhe cada acesso em um só lugar.
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-white px-[18px] py-[22px] shadow-[0_12px_35px_rgb(34_33_46_/_4%)] sm:px-[30px] sm:py-[27px]" aria-labelledby="create-heading">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[1.4px] text-brand">COMECE POR AQUI</p>
            <h2 className="m-0 font-sans text-xl font-bold tracking-[-0.5px]" id="create-heading">Novo link</h2>
          </div>
          <span className="font-sans text-2xl font-bold text-[#c9c7d0]">01</span>
        </div>

        <form className="mt-6 grid gap-2.5" onSubmit={handleSubmit}>
          <label className="mt-2 text-xs font-bold text-[#454650]" htmlFor="original-url">Link original</label>
          <input
            id="original-url"
            type="url"
            placeholder="https://exemplo.com/seu-link-grande"
            className="min-h-[47px] w-full rounded-lg border border-[#dedde3] bg-white px-3.5 text-[13px] text-ink outline-none transition placeholder:text-[#aaabb3] focus:border-brand focus:ring-[3px] focus:ring-brand/10"
            value={originalUrl}
            onChange={(event) => setOriginalUrl(event.target.value)}
            required
          />

          <label className="mt-2 text-xs font-bold text-[#454650]" htmlFor="short-code">Personalize seu link <span className="font-normal text-[#999aa2]">(opcional)</span></label>
          <div className="flex min-h-[47px] items-center rounded-lg border border-[#dedde3] pl-3.5 text-[13px] font-semibold text-brand focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/10">
            <span>lnk.it/</span>
            <input
              id="short-code"
              type="text"
              placeholder="meu-link"
              className="min-h-[44px] w-full border-0 bg-transparent px-3 text-[13px] text-ink outline-none placeholder:text-[#aaabb3]"
              value={shortCode}
              onChange={(event) => setShortCode(event.target.value)}
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9_-]+"
              title="Use letras, números, hífens ou sublinhados."
            />
          </div>

          <button className={ui.primaryButton()} type="submit" disabled={submitting}>
            {submitting ? 'Criando...' : 'Encurtar link'}
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </section>

      <section className="pt-10 sm:pt-[54px]" aria-labelledby="links-heading">
        <div className="mb-[18px] flex items-center justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[1.4px] text-brand">SUA COLEÇÃO</p>
            <h2 className="m-0 font-sans text-xl font-bold tracking-[-0.5px]" id="links-heading">Meus links</h2>
          </div>
          <span className={ui.linkCount()}>{links.length} {links.length === 1 ? 'link' : 'links'}</span>
        </div>

        {error && <p className={ui.message({ tone: 'error' })} role="alert">{error}</p>}
        {notice && <p className={ui.message({ tone: 'success' })} role="status">{notice}</p>}

        {loading ? (
          <div className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d9d7de] text-center text-xs text-muted">Carregando seus links...</div>
        ) : links.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d9d7de] text-center text-xs text-muted">
            <span className="mb-1 grid size-9 place-items-center rounded-full bg-[#f0ecfc] text-lg text-brand" aria-hidden="true">↗</span>
            <strong className="text-sm text-[#484953]">Nenhum link por aqui ainda</strong>
            <span>Seu próximo link curto começa no formulário acima.</span>
          </div>
        ) : (
          <div className="grid gap-[11px]">
            {links.map((link) => (
              <article className="overflow-hidden rounded-xl border border-line bg-white" key={link.id}>
                <div className="grid grid-cols-1 items-center gap-3 p-[15px] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-5 sm:px-[19px] sm:py-[17px]">
                  <div className="grid min-w-0 gap-1.5">
                    <a
                      className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-brand no-underline hover:underline"
                      href={`${shortUrlBase}/${link.shortCode}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      lnk.it/{link.shortCode}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                    <a
                      className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[#888992] no-underline"
                      href={link.originalUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.originalUrl}
                    </a>
                  </div>
                  <div className="flex justify-between gap-2 text-[10px] text-[#8e8f96] sm:grid sm:gap-[5px] sm:text-right">
                    <span className="text-[#676873]">
                      <strong className="text-xs text-ink">{link.accessCount}</strong>
                      {link.accessCount === 1 ? ' acesso' : ' acessos'}
                    </span>
                    <span>{new Date(link.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <button
                      className={ui.iconButton()}
                      type="button"
                      onClick={() => copyShortUrl(link)}
                      aria-label={`Copiar lnk.it/${link.shortCode}`}
                      title="Copiar link"
                    >
                      Copiar
                    </button>
                    <button
                      className={ui.iconButton()}
                      type="button"
                      onClick={() => toggleMetrics(link)}
                    >
                      {expandedLinkId === link.id ? 'Fechar relatório' : 'Relatório'}
                    </button>
                    <button
                      className={ui.iconButton({ tone: 'danger' })}
                      type="button"
                      onClick={() => handleDelete(link)}
                      aria-label={`Remover lnk.it/${link.shortCode}`}
                    >
                      Remover
                    </button>
                  </div>
                </div>

                {expandedLinkId === link.id && metrics && (
                  <div className="border-t border-line bg-[#fbfafc] px-[15px] py-[17px] sm:px-[19px]">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="m-0 text-xs font-bold">Relatório de acessos</h3>
                      <span className="text-[11px] text-muted">{metrics.totalAccesses} no total</span>
                    </div>
                    {metrics.accesses.length === 0 ? (
                      <p className="mb-0 text-[11px] text-muted">Este link ainda não recebeu acessos.</p>
                    ) : (
                      <ul className="m-0 grid max-h-[220px] list-none gap-2 overflow-y-auto p-0 text-[10px] text-muted">
                        {metrics.accesses.map((access, index) => (
                          <li className="flex justify-between gap-3 max-sm:flex-col max-sm:items-start max-sm:gap-[3px]" key={`${access.accessedAt}-${index}`}>
                            <time className="whitespace-nowrap text-[#454650]" dateTime={access.accessedAt}>
                              {new Date(access.accessedAt).toLocaleString('pt-BR')}
                            </time>
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{access.referer ?? 'Acesso direto'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="flex justify-between py-8 text-[10px] text-[#92939a]">
        <span className="font-bold text-[#646570]">lnk.it</span>
        <span>Um link de cada vez.</span>
      </footer>
    </main>
  )
}

export default App
