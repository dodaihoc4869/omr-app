// BỐ CỤC NGANG của Đảo 2.0 (bản vẽ docs/ban-ve-ngang-2809/Ngang-Dao*.dc.html): máy tính (≥ 1024 px) hoặc điện thoại/máy tính bảng xoay ngang (≥ 700 px).
// Bố cục do CSS lo (cùng câu truy vấn trong dao2.css); hook này chỉ cho biết để GIỮ cảnh trận ở cột trái lúc đọc lời giải — bố cục dọc giữ nguyên như cũ.
import {useSyncExternalStore} from 'react'

/** Trùng ĐÚNG câu `@media` trong dao2.css. */
export const MQ_NGANG='(min-width: 1024px), (orientation: landscape) and (min-width: 700px)'
const mq=():MediaQueryList|null=>typeof window!=='undefined'&&typeof window.matchMedia==='function'?window.matchMedia(MQ_NGANG)??null:null
function theoDoi(bao:()=>void){const m=mq();if(!m)return()=>{}
 if(typeof m.addEventListener==='function'){m.addEventListener('change',bao);return()=>m.removeEventListener('change',bao)}
 m.addListener?.(bao);return()=>m.removeListener?.(bao)}
/** true khi màn đang ở bố cục ngang. Không có matchMedia (jsdom, máy cũ) ⇒ false = bố cục dọc. */
export function useNgang():boolean{return useSyncExternalStore(theoDoi,()=>!!mq()?.matches,()=>false)}
