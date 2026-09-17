import type {ReactNode} from 'react'
import {gomCaTheoNamSinh,THU_MUC_KHAC} from '../lib/nam-sinh-ca'
/** Cùng quy ước năm sinh ở đầu tên ca như danh sách lịch sử. */
export default function NhomCaThuGon<T extends {maCa:string;tenCa:string}>({ds,render,selected}:{ds:T[];render:(c:T)=>ReactNode;selected?:(c:T)=>boolean}){
 return <>{gomCaTheoNamSinh(ds,c=>c.tenCa).map(g=><details key={g.nam} style={{border:'1px solid var(--vien)',borderRadius:14,padding:'10px 12px',background:'var(--the)'}}><summary style={{cursor:'pointer',fontWeight:700,padding:8}}>{g.nam===THU_MUC_KHAC?'Chưa có năm sinh trong tên ca':`Năm sinh ${g.nam}`} · {g.ca.length} ca{selected?` · ${g.ca.filter(selected).length} đã chọn`:''}</summary><div style={{display:'grid',gap:8,paddingTop:8}} className="grid grid-cols-1 sm:grid-cols-2">{g.ca.map(render)}</div></details>)}</>
}
