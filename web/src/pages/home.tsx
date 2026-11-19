import { useCallback, useEffect, useState } from 'react'
import { Brand } from '../components/brand'
import { CreateLinkForm } from '../components/create-link-form'
import { LinksList } from '../components/links-list'
import { env } from '../env'
import { ui } from '../ui'

type Feedback = { tone: 'error' | 'success'; message: string } | null

export function HomePage() {
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    if (!feedback) return
    const timeout = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timeout)
  }, [feedback])

  const showNotice = useCallback(
    (message: string) => setFeedback({ tone: 'success', message }),
    []
  )
  const showError = useCallback(
    (message: string) => setFeedback({ tone: 'error', message }),
    []
  )

  return (
    <main className="mx-auto w-[calc(100%-28px)] max-w-[920px] sm:w-[calc(100%-40px)]">
      <header className="flex h-[68px] items-center justify-between border-b border-line sm:h-[82px]">
        <Brand />
        <span className="hidden text-[13px] text-muted sm:inline">
          Encurtador de links
        </span>
        <a
          className="text-xs font-bold text-brand no-underline hover:underline"
          href={`${env.backendUrl}/docs`}
          target="_blank"
          rel="noreferrer"
        >
          API docs <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="py-12 sm:py-16">
        <p className="mb-3 text-[10px] font-bold tracking-[1.4px] text-brand">
          MENOS CARACTERES, MAIS POSSIBILIDADES
        </p>
        <h1 className="mb-4 font-sans text-[clamp(40px,7vw,64px)] font-extrabold leading-[1.03] tracking-[-3.8px] text-ink">
          Links curtos.
          <br />
          Ideias longas.
        </h1>
        <p className="mb-0 max-w-[490px] text-[15px] leading-[1.7] text-muted">
          Crie links fáceis de compartilhar e acompanhe cada acesso em um só
          lugar.
        </p>
      </section>

      <section
        className="rounded-2xl border border-line bg-white px-[18px] py-[22px] shadow-[0_12px_35px_rgb(34_33_46_/_4%)] sm:px-[30px] sm:py-[27px]"
        aria-labelledby="create-heading"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[1.4px] text-brand">
              COMECE POR AQUI
            </p>
            <h2
              className="m-0 font-sans text-xl font-bold tracking-[-0.5px]"
              id="create-heading"
            >
              Novo link
            </h2>
          </div>
          <span className="font-sans text-2xl font-bold text-[#c9c7d0]">
            01
          </span>
        </div>

        <CreateLinkForm onCreated={showNotice} />
      </section>

      {feedback && (
        <p
          className={`${ui.message({ tone: feedback.tone })} fixed bottom-4 left-1/2 z-10 w-[calc(100%-28px)] max-w-[420px] -translate-x-1/2 shadow-lg`}
          role={feedback.tone === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      )}

      <LinksList onNotice={showNotice} onError={showError} />

      <footer className="flex justify-between py-8 text-[10px] text-[#92939a]">
        <span className="font-bold text-[#646570]">lnk.it</span>
        <span>Um link de cada vez.</span>
      </footer>
    </main>
  )
}
