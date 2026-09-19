import {useEffect,useRef,type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {ThanhTren} from './m3'
import './m3/phong-vao-thi.css'

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
  return createPortal(<div role="dialog" aria-modal="true" aria-label="Vào phòng thi" className="m3 m3-phong" style={{padding:'0 max(16px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))'}}>
    <div className="m3-phong-than"><ThanhTren tieuDe="Vào phòng thi" onQuayLai={onClose}/>{children}</div>
  </div>,document.body)
}
