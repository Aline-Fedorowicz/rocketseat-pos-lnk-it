import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { shortUrlHost } from '../env'
import { ApiError, createLink } from '../lib/api'
import { ui } from '../ui'
import { Spinner } from './spinner'

const createLinkFormSchema = z.object({
  originalUrl: z
    .string()
    .trim()
    .url('Informe uma URL válida.')
    .refine(url => /^https?:\/\//i.test(url), 'Informe uma URL HTTP ou HTTPS.'),
  shortCode: z
    .string()
    .trim()
    .min(3, 'O link encurtado deve ter pelo menos 3 caracteres.')
    .max(32, 'O link encurtado deve ter no máximo 32 caracteres.')
    .regex(
      /^[a-z0-9-]+$/,
      'Informe uma URL minúscula e sem espaço/caracter especial.'
    ),
})

type CreateLinkFormData = z.infer<typeof createLinkFormSchema>

const inputClass =
  'min-h-[47px] w-full rounded-lg border border-[#dedde3] bg-white px-3.5 text-[13px] text-ink outline-none transition placeholder:text-[#aaabb3] focus:border-brand focus:ring-[3px] focus:ring-brand/10 aria-[invalid=true]:border-red-400'

interface CreateLinkFormProps {
  onCreated: (message: string) => void
}

export function CreateLinkForm({ onCreated }: CreateLinkFormProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateLinkFormData>({
    resolver: zodResolver(createLinkFormSchema),
    defaultValues: { originalUrl: '', shortCode: '' },
  })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createLink,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['links'] }),
  })

  async function handleCreateLink(data: CreateLinkFormData) {
    try {
      await mutateAsync(data)
      reset()
      onCreated('Link criado com sucesso.')
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('shortCode', { message: error.message })
        return
      }

      setError('root', {
        message:
          error instanceof Error ? error.message : 'Erro ao criar o link.',
      })
    }
  }

  return (
    <form
      className="mt-6 grid gap-2.5"
      onSubmit={handleSubmit(handleCreateLink)}
      noValidate
    >
      <label
        className="mt-2 text-xs font-bold text-[#454650]"
        htmlFor="original-url"
      >
        Link original
      </label>
      <input
        id="original-url"
        type="url"
        placeholder="https://exemplo.com/seu-link-grande"
        className={inputClass}
        aria-invalid={!!errors.originalUrl}
        disabled={isPending}
        {...register('originalUrl')}
      />
      {errors.originalUrl && (
        <span className="text-[11px] text-red-700" role="alert">
          {errors.originalUrl.message}
        </span>
      )}

      <label
        className="mt-2 text-xs font-bold text-[#454650]"
        htmlFor="short-code"
      >
        Link encurtado
      </label>
      <div className="flex min-h-[47px] items-center rounded-lg border border-[#dedde3] pl-3.5 text-[13px] font-semibold text-brand focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/10 has-[[aria-invalid=true]]:border-red-400">
        <span className="shrink-0">{shortUrlHost}/</span>
        <input
          id="short-code"
          type="text"
          placeholder="meu-link"
          autoCapitalize="none"
          className="min-h-[44px] w-full min-w-0 border-0 bg-transparent px-1 text-[13px] text-ink outline-none placeholder:text-[#aaabb3]"
          aria-invalid={!!errors.shortCode}
          disabled={isPending}
          {...register('shortCode')}
        />
      </div>
      {errors.shortCode && (
        <span className="text-[11px] text-red-700" role="alert">
          {errors.shortCode.message}
        </span>
      )}

      {errors.root && (
        <p className={ui.message({ tone: 'error' })} role="alert">
          {errors.root.message}
        </p>
      )}

      <button className={ui.primaryButton()} type="submit" disabled={isPending}>
        {isPending ? 'Salvando...' : 'Salvar link'}
        {isPending ? <Spinner /> : <span aria-hidden="true">→</span>}
      </button>
    </form>
  )
}
