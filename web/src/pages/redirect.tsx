import { useEffect, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { Brand } from '../components/brand'
import { Spinner } from '../components/spinner'
import { ApiError, getLinkByShortCode, incrementLinkAccess } from '../lib/api'

export function RedirectPage() {
  const { shortCode = '' } = useParams()
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    async function redirect() {
      try {
        const link = await getLinkByShortCode(shortCode)
        setOriginalUrl(link.originalUrl)
        await incrementLinkAccess(link.id).catch(() => undefined)
        window.location.replace(link.originalUrl)
      } catch (cause) {
        if (cause instanceof ApiError && cause.status === 404) {
          setNotFound(true)
          return
        }
        setError(
          cause instanceof Error ? cause.message : 'Erro ao buscar o link.'
        )
      }
    }

    redirect()
  }, [shortCode])

  if (notFound) {
    return <Navigate to="/url/not-found" replace />
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="grid w-full max-w-[520px] justify-items-center gap-4 rounded-2xl border border-line bg-white px-6 py-12 text-center shadow-[0_12px_35px_rgb(34_33_46_/_4%)]">
        <Brand />
        {error ? (
          <>
            <h1 className="m-0 text-xl font-bold text-ink">
              Não foi possível redirecionar
            </h1>
            <p className="m-0 text-sm text-muted">{error}</p>
          </>
        ) : (
          <>
            <Spinner className="size-6 text-brand" />
            <h1 className="m-0 text-xl font-bold text-ink">
              Redirecionando...
            </h1>
            <p className="m-0 text-sm text-muted">
              O link será aberto automaticamente em alguns instantes.
              {originalUrl && (
                <>
                  <br />
                  Não foi redirecionado?{' '}
                  <a className="font-bold text-brand" href={originalUrl}>
                    Acesse aqui
                  </a>
                </>
              )}
            </p>
          </>
        )}
      </section>
    </main>
  )
}
