import {useEffect,useRef,type ReactNode} from 'react'
import {createPortal} from 'react-dom'

export default function PhongVaoThi({children,onClose}:{children:ReactNode;onClose:()=>void}) {
  const close=useRef(onClose);close.current=onClose
  useEffect(()=>{
    const before=document.body.style.overflow
    const focused=document.activeElement as HTMLElement|null
    document.body.style.overflow='hidden'
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape')close.current()}
    document.addEventListener('keydown',key)
    return()=>{document.body.style.overflow=before;document.removeEventListener('keydown',key);focused?.focus()}
  },[])
  return createPortal(<div role="dialog" aria-modal="true" aria-label="Vào phòng thi" className="fixed inset-0 z-[1000] overflow-y-auto overscroll-contain bg-slate-50 dark:bg-slate-950" style={{padding:'max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))'}}>
    <div className="mx-auto max-w-xl"><button type="button" onClick={onClose} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">← Quay lại</button>{children}</div>
  </div>,document.body)
}
