import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Maximize, Minimize } from 'lucide-react'

export default function KhungThanThuToanManHinh({children}:{children:ReactNode}) {
  const root=useRef<HTMLDivElement>(null)
  const [expanded,setExpanded]=useState(false)
  useEffect(()=>{
    const change=()=>{if(!document.fullscreenElement)setExpanded(false)}
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!document.fullscreenElement)setExpanded(false)}
    document.addEventListener('fullscreenchange',change);document.addEventListener('keydown',key)
    return()=>{document.removeEventListener('fullscreenchange',change);document.removeEventListener('keydown',key)}
  },[])
  useEffect(()=>{
    if(!expanded)return
    const old=document.body.style.overflow;document.body.style.overflow='hidden'
    return()=>{document.body.style.overflow=old}
  },[expanded])
  async function toggle(){
    if(expanded){if(document.fullscreenElement===root.current)await document.exitFullscreen().catch(()=>{});setExpanded(false);return}
    setExpanded(true)
    try{await root.current?.requestFullscreen?.()}catch{/* Safari không hỗ trợ: giữ khung phủ trong ứng dụng. */}
  }
  return <div ref={root} data-than-thu-fullscreen={expanded?'true':'false'} style={expanded?{position:'fixed',inset:0,zIndex:1000,overflowY:'auto',background:'var(--nen, white)',padding:'max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left))'}:undefined}>
    <div className="flex justify-end sticky top-0 z-50 p-2">
      <button type="button" onClick={()=>void toggle()} aria-pressed={expanded} className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-slate-900 text-white font-bold shadow-md">
        {expanded?<Minimize size={18}/>:<Maximize size={18}/>} {expanded?'Thoát toàn màn hình':'Toàn màn hình'}
      </button>
    </div>
    {children}
  </div>
}
