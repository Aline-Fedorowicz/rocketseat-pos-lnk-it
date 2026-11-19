import { useMutation, useQueryClient } from '@tanstack/react-query'
import { env, shortUrlHost } from '../env'
import { deleteLink, type Link } from '../lib/api'
import { ui } from '../ui'
import { Spinner } from './spinner'

interface LinkItemProps {
  link: Link
  onNotice: (message: string) => void
  onError: (message: string) => void
}

export function LinkItem({ link, onNotice, onError }: LinkItemProps) {
  const queryClient = useQueryClient()
  const shortUrl = `${env.frontendUrl}/${link.shortCode}`

  const { mutate: removeLink, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteLink(link.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['links'] })
      onNotice('Link removido.')
    },
    onError: error =>
      onError(error instanceof Error ? error.message : 'Erro ao remover link.'),
  })

  function handleDelete() {
    if (
      window.confirm(`Você realmente quer apagar o link ${link.shortCode}?`)
    ) {
      removeLink()
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shortUrl)
      onNotice(
        `O link ${link.shortCode} foi copiado para a área de transferência.`
      )
    } catch {
      onError('Não foi possível copiar o link neste navegador.')
    }
  }

  return (
    <article
      className="overflow-hidden rounded-xl border border-line bg-white data-[deleting=true]:opacity-60"
      data-deleting={isDeleting}
    >
      <div className="grid grid-cols-1 items-center gap-3 p-[15px] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-5 sm:px-[19px] sm:py-[17px]">
        <div className="grid min-w-0 gap-1.5">
          <a
            className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-brand no-underline hover:underline"
            href={shortUrl}
            target="_blank"
            rel="noreferrer"
          >
            {shortUrlHost}/{link.shortCode}
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
            onClick={handleCopy}
            disabled={isDeleting}
            aria-label={`Copiar ${shortUrlHost}/${link.shortCode}`}
          >
            Copiar
          </button>
          <button
            className={ui.iconButton({ tone: 'danger' })}
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Remover ${shortUrlHost}/${link.shortCode}`}
          >
            {isDeleting ? <Spinner className="size-3" /> : 'Remover'}
          </button>
        </div>
      </div>
    </article>
  )
}
