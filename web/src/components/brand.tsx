import { Link } from 'react-router'
import { ui } from '../ui'

export function Brand() {
  return (
    <Link
      className="inline-flex items-center gap-2.5 font-sans text-[21px] font-extrabold tracking-[-1px] text-ink no-underline"
      to="/"
      aria-label="lnk.it início"
    >
      <span className={ui.brandMark()}>L</span>
      <span>
        lnk<span className="text-brand">.</span>it
      </span>
    </Link>
  )
}
