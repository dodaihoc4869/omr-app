import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import BieuCamThu, { CAM_XUC, NHAN_CAM_XUC, type CamXucThu } from '../../src/game/than-thu-v2/BieuCamThu'
import { ThuHinh } from '../../src/game/than-thu-v2/DoanHinh'
import XeLinhTam from '../../src/game/than-thu-v2/XeLinhTam'
import { PETS } from '../../src/game/than-thu-v2/core'
import '../../src/game/than-thu-v2/doan.css'

function ThuVien() {
  const [cam, setCam] = useState<CamXucThu>('chao'), [hp, setHp] = useState(80)
  return <main className="bl-thu-vien">
    <style>{`
      * { box-sizing: border-box; } body { margin:0; background:rgb(245 244 231); color:rgb(28 72 62); font:15px system-ui,sans-serif; }
      .bl-thu-vien { max-width:1100px; margin:auto; padding:24px 16px; } h1 { font:700 30px Georgia,serif; margin:0 0 12px; }
      .bl-thu-vien nav { display:flex; flex-wrap:wrap; gap:8px; margin:20px 0; }
      .bl-thu-vien button { font:inherit; padding:10px 14px; background:rgb(255 252 240); border:1px solid rgb(210 192 143); color:inherit; border-radius:14px; cursor:pointer; }
      .bl-thu-vien button[aria-pressed=true] { background:rgb(31 106 89); color:white; }
      .bl-thu-vien section { display:grid; grid-template-columns:repeat(auto-fit,minmax(145px,1fr)); gap:14px; }
      .bl-thu-vien article { text-align:center; background:rgb(255 252 240); border:1px solid rgb(227 218 188); border-radius:24px; padding:22px 8px 12px; }
      .bl-thu-vien article .dh-thu { margin:8px auto; }
      .bl-thu-vien aside { max-width:450px; margin:28px auto; padding:16px; border-radius:24px; background:rgb(220 238 217); text-align:center; }
      .bl-thu-vien aside > svg { display:block; width:100%; height:220px; }
      .bl-thu-vien input { width:100%; accent-color:rgb(31 106 89); }
      .bl-thu-vien details { margin-top:26px; } .bl-thu-vien summary { cursor:pointer; padding:12px; }
      .bl-cac-net { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; padding:16px 0; text-align:center; }
      .bl-cac-net div { display:flex; align-items:center; gap:8px; flex-direction:column; }
      @media(min-width:700px) { .bl-cac-net { grid-template-columns:repeat(6,1fr); } }
    `}</style>
    <h1>Tám người bạn · Sáu nét mặt</h1>
    <p>Chọn trạng thái để xem phản ứng. Hình toàn thân vẫn giữ đúng cấp tiến hoá; nét mặt hiện trong khung cận cảnh.</p>
    <nav aria-label="Trạng thái biểu cảm">{CAM_XUC.map(c => <button key={c} aria-pressed={cam === c} onClick={() => setCam(c)}>{NHAN_CAM_XUC[c]}</button>)}</nav>
    <section>{PETS.map((p, i) => <article key={p.id}><ThuHinh pet={i} cap={50} camXuc={cam} size={124}/><h2 style={{fontSize:16}}>{p.name}</h2><small>{NHAN_CAM_XUC[cam]}</small></article>)}</section>
    <aside><h2>Xe Linh Tâm mới</h2><svg viewBox="110 166 170 144" role="img" aria-label={`Xe Linh Tâm, máu ${hp}/100`}><XeLinhTam hp={hp} toiDa={100}/></svg>
      <label htmlFor="mau">Máu Linh Tâm: {hp}/100</label><input id="mau" type="range" min="0" max="100" value={hp} onChange={e => setHp(Number(e.target.value))}/>
    </aside>
    <details><summary>Xem đủ 48 nét mặt cùng lúc</summary>{PETS.map((p,i) => <div key={p.id}><h3>{p.name}</h3><div className="bl-cac-net">{CAM_XUC.map(c => <div key={c}><BieuCamThu thu={i} camXuc={c} size={90}/><small>{NHAN_CAM_XUC[c]}</small></div>)}</div></div>)}</details>
  </main>
}
createRoot(document.getElementById('root')!).render(<ThuVien/> )
