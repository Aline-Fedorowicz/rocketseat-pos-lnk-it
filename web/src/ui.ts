import { tv } from 'tailwind-variants'

export const ui = {
  brandMark: tv({
    base: 'grid size-8 shrink-0 place-items-center rounded-[10px] bg-brand text-[17px] font-bold text-white',
  }),
  primaryButton: tv({
    base: 'mt-3 flex min-h-12 items-center justify-between rounded-lg bg-brand px-4 text-[13px] font-bold text-white transition hover:-translate-y-px hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-70',
  }),
  iconButton: tv({
    base: 'min-h-[34px] rounded-md border px-2.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50',
    variants: {
      tone: {
        neutral:
          'border-[#e8e7eb] bg-white text-[#555661] hover:border-brand/40 hover:bg-[#faf9ff] hover:text-brand',
        danger:
          'border-[#e8e7eb] bg-white text-[#555661] hover:border-red-200 hover:bg-red-50 hover:text-red-700',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  }),
  message: tv({
    base: 'mb-3 rounded-lg px-3.5 py-3 text-[13px]',
    variants: {
      tone: {
        error: 'bg-red-50 text-red-800',
        success: 'bg-green-50 text-green-800',
      },
    },
  }),
  linkCount: tv({
    base: 'rounded-full bg-[#eeedf1] px-2.5 py-1.5 text-[11px] font-semibold text-[#6b6877]',
  }),
}
