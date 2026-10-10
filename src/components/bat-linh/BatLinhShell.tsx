import { useLayoutEffect, type ReactNode } from 'react'
import './bat-linh.css'
import './hoc-sinh.css'
import './phu-huynh.css'
import './game-toan-bo.css'
import './che-do-toi.css'

/** Visual scope only. No account, routing, scoring or server configuration changes.
 * The body marker also themes dialogs rendered through a React portal. */
export default function BatLinhShell({ vai, children }: { vai: 'hs' | 'ph'; children: ReactNode }) {
  useLayoutEffect(() => {
    const truoc = document.body.getAttribute('data-bat-linh')
    const truocHoc = document.body.getAttribute('data-hoc-tap')
    if (vai === 'hs') { document.body.removeAttribute('data-bat-linh'); document.body.setAttribute('data-hoc-tap', 'hs') }
    else document.body.setAttribute('data-bat-linh', vai)
    return () => {
      if (truocHoc === null) document.body.removeAttribute('data-hoc-tap')
      else document.body.setAttribute('data-hoc-tap', truocHoc)
      if (truoc === null) document.body.removeAttribute('data-bat-linh')
      else document.body.setAttribute('data-bat-linh', truoc)
    }
  }, [vai])
  return <div className={vai === 'hs' ? 'ht-shell' : 'bl-app'} data-vai={vai}>{children}</div>
}
