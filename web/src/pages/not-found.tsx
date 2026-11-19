import { Link } from 'react-router'
import { Brand } from '../components/brand'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="grid w-full max-w-[520px] justify-items-center gap-4 rounded-2xl border border-line bg-white px-6 py-12 text-center shadow-[0_12px_35px_rgb(34_33_46_/_4%)]">
        <Brand />
        <p className="m-0 font-sans text-[64px] font-extrabold leading-none tracking-[-3px] text-brand">
          404
        </p>
        <h1 className="m-0 text-xl font-bold text-ink">Link não encontrado</h1>
        <p className="m-0 text-sm text-muted">
          O link que você está tentando acessar não existe, foi removido ou é
          uma URL inválida. Saiba mais em{' '}
          <Link className="font-bold text-brand" to="/">
            lnk.it
          </Link>
          .
        </p>
      </section>
    </main>
  )
}
