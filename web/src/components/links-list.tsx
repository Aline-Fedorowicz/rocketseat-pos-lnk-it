import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { exportLinks, listLinks, PAGE_SIZE } from '../lib/api'
import { ui } from '../ui'
import { LinkItem } from './link-item'
import { Spinner } from './spinner'

interface LinksListProps {
  onNotice: (message: string) => void
  onError: (message: string) => void
}

export function LinksList({ onNotice, onError }: LinksListProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['links'],
    queryFn: ({ pageParam }) => listLinks(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      pages.length * PAGE_SIZE < lastPage.total ? pages.length + 1 : undefined,
  })

  const links = data?.pages.flatMap(page => page.links) ?? []
  const total = data?.pages[0]?.total ?? 0

  const { mutate: downloadCsv, isPending: isExporting } = useMutation({
    mutationFn: exportLinks,
    onSuccess: ({ reportUrl }) => {
      window.open(reportUrl, '_blank', 'noopener')
      onNotice('Relatório CSV gerado.')
    },
    onError: err =>
      onError(err instanceof Error ? err.message : 'Erro ao gerar o CSV.'),
  })

  return (
    <section className="pt-10 sm:pt-[54px]" aria-labelledby="links-heading">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-[1.4px] text-brand">
            SUA COLEÇÃO
          </p>
          <h2
            className="m-0 font-sans text-xl font-bold tracking-[-0.5px]"
            id="links-heading"
          >
            Meus links
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={ui.linkCount()}>
            {total} {total === 1 ? 'link' : 'links'}
          </span>
          <button
            className={ui.iconButton()}
            type="button"
            onClick={() => downloadCsv()}
            disabled={isExporting || total === 0}
          >
            <span className="inline-flex items-center gap-1.5">
              {isExporting ? (
                <Spinner className="size-3" />
              ) : (
                <span aria-hidden="true">↓</span>
              )}
              Baixar CSV
            </span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d9d7de] text-center text-xs text-muted">
          <Spinner className="size-5 text-brand" />
          Carregando seus links...
        </div>
      ) : isError ? (
        <p className={ui.message({ tone: 'error' })} role="alert">
          {error instanceof Error ? error.message : 'Erro ao carregar links.'}
        </p>
      ) : links.length === 0 ? (
        <div className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d9d7de] text-center text-xs text-muted">
          <span
            className="mb-1 grid size-9 place-items-center rounded-full bg-brand-pale text-lg text-brand"
            aria-hidden="true"
          >
            ↗
          </span>
          <strong className="text-sm text-[#484953]">
            Ainda não existem links cadastrados
          </strong>
          <span>Seu próximo link curto começa no formulário acima.</span>
        </div>
      ) : (
        <div className="grid gap-[11px]">
          {links.map(link => (
            <LinkItem
              key={link.id}
              link={link}
              onNotice={onNotice}
              onError={onError}
            />
          ))}
          {hasNextPage && (
            <button
              className={`${ui.iconButton()} justify-self-center`}
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
