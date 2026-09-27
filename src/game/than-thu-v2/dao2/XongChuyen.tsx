// ĐẢO 2.0 · XONG CHUYẾN (bản vẽ Moi-DaoXong.dc.html): "SƯƠNG MÙ ĐÃ TAN", cụm lục giác sáng (ô đất mới), 3 chỉ số, tiến độ chuyến trong ngày,
// Rương Bát Linh, nút "ĐI CHUYẾN k/n". Số ải đúng / EXP = máy chủ chấm; ô đất = `hoa2-sanh` trước/sau chuyến; ngày ôn lại = `hoa2-cau-da-lam`.
import {chuNgay} from './dao2-core'
import type {Ruong2} from './dao2-core'
import './dao2.css'

/** Cụm lục giác: 7 ô nền (đất đã có) + tối đa 5 ô sáng (ô đất mới của chuyến này). */
const NEN=['-36,-62 -18,-62 -9,-46 -18,-31 -36,-31 -45,-46','0,-62 18,-62 27,-46 18,-31 0,-31 -9,-46','36,-62 54,-62 63,-46 54,-31 36,-31 27,-46','-54,-31 -36,-31 -27,-15 -36,0 -54,0 -63,-15','54,-31 72,-31 81,-15 72,0 54,0 45,-15','-36,0 -18,0 -9,15 -18,31 -36,31 -45,15','36,0 54,0 63,15 54,31 36,31 27,15']
const SANG=['-18,-31 0,-31 9,-15 0,0 -18,0 -27,-15','18,-31 36,-31 45,-15 36,0 18,0 9,-15','0,0 18,0 27,15 18,31 0,31 -9,15','-18,31 0,31 9,46 0,62 -18,62 -27,46','18,31 36,31 45,46 36,62 18,62 9,46']

export interface XongChuyenProps{
 /** Chuyến vừa xong là chuyến thứ `k` trong `n` chuyến hôm nay (null ⇒ không nói số). */
 soChuyen:{k:number;n:number}|null;conCau:number|null
 tongKet:{dung:number;tong:number;exp:number};enemy:number
 /** Ô đất mới = cọ xát sau chuyến − trước chuyến (null khi chưa đọc được). */
 oMoi:number|null;coXat:{co:number;tong:number}|null
 aiSai:readonly {ai:number;hen?:string}[];ruong:Ruong2|null;ruongVua?:number|null
 busy?:boolean;loi?:string
 onDiTiep?:()=>void;onVeBanDo:()=>void;onMoSoTay?:()=>void;onMoRuong?:()=>void
}
export default function XongChuyen({soChuyen,conCau,tongKet,enemy,oMoi,coXat,aiSai,ruong,ruongVua=null,busy=false,loi='',onDiTiep,onVeBanDo,onMoSoTay,onMoRuong}:XongChuyenProps){
 const haQuai=enemy===0,sang=Math.max(0,Math.min(SANG.length,oMoi??0)),n=soChuyen?.n??0,k=soChuyen?.k??0
 return <div className="dao2-xong" aria-live="polite">
  <div className="dao2-xong-canh">
   <svg viewBox="0 0 390 330" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
     <radialGradient id="d2-hao" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="rgb(31,140,138)"/><stop offset=".55" stopColor="rgb(18,48,102)"/><stop offset="1" stopColor="rgb(7,18,41)"/></radialGradient>
     <filter id="d2-suong-x" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
     <filter id="d2-sang-x" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <rect width="390" height="330" fill="url(#d2-hao)"/>
    <g transform="translate(195 175)">
     <g className="dao2-luc-nen">{NEN.map(p=><polygon key={p} points={p}/>)}</g>
     <g className="dao2-luc-sang">{SANG.slice(0,sang).map(p=><polygon key={p} points={p}/>)}</g>
     <circle cx="0" cy="0" r="80" className="dao2-luc-hao" filter="url(#d2-sang-x)"/>
     <g filter="url(#d2-suong-x)" className="dao2-luc-suong"><circle cx="-120" cy="-40" r="40"/><circle cx="120" cy="40" r="44"/><circle cx="-100" cy="70" r="30"/><circle cx="110" cy="-70" r="30"/></g>
    </g>
    <g className="dao2-sao-vang"><path d="M60 60 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/><path d="M330 90 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/><path d="M300 300 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/></g>
   </svg>
   <h2>{haQuai?'SƯƠNG MÙ ĐÃ TAN':'XONG CHUYẾN THÁM HIỂM'}</h2>
   <p>{soChuyen?`Chuyến thám hiểm ${k}/${n} · `:''}{haQuai?'đã hạ Quái Sương Mù':`Quái Sương Mù còn ${enemy}/100 máu`}</p>
   {oMoi!==null&&oMoi>0&&<span className="dao2-kinh dao2-xong-chip">+{oMoi} ô đất mới</span>}
  </div>

  <div className="dao2-xong-than">
   <ul className="dao2-xong-so">
    <li className="dao2-kinh"><b>{tongKet.dung}/{tongKet.tong}</b><span>ải đúng</span></li>
    <li className="dao2-kinh"><b>+{tongKet.exp}</b><span>EXP</span></li>
    {coXat&&<li className="dao2-kinh"><b className="dao2-so-xanh">{coXat.co}/{coXat.tong}</b><span>ô đã khai phá</span></li>}
   </ul>
   {soChuyen&&<div className="dao2-kinh dao2-xong-ngay">
    <p><span>Hôm nay: chuyến {k}/{n} xong</span>{conCau!==null&&<b>{conCau>0?`còn ${conCau} câu`:'đã hết câu ở đảo'}</b>}</p>
    {n<=12?<ol aria-label={`Đã xong ${k} trên ${n} chuyến hôm nay`}>{Array.from({length:n},(_,i)=><li key={i} data-xong={i<k?'':undefined}/>)}</ol>
     :<span className="dao2-vach" role="progressbar" aria-label="Chuyến đã xong hôm nay" aria-valuemin={0} aria-valuemax={n} aria-valuenow={k}><i style={{width:`${k/n*100}%`}}/></span>}
    {aiSai.map(a=><small key={a.ai}>Ải {a.ai} em chưa đúng: {a.hen&&chuNgay(a.hen)?`câu này đến lịch ôn lại ${chuNgay(a.hen)}.`:'câu này sẽ quay lại theo lịch ôn lại.'}</small>)}
   </div>}
   {ruong&&ruong.tong>0&&<div className="dao2-ruong dao2-ruong-to">
    <svg viewBox="0 0 28 24" width="40" height="34" aria-hidden="true"><rect x="2" y="9" width="24" height="13" rx="2" className="dao2-ruong-than"/><path d="M2 11 C2 4 26 4 26 11 Z" className="dao2-ruong-nap"/><rect x="12" y="9" width="4" height="7" rx="1" className="dao2-ruong-khoa"/></svg>
    <span className="dao2-ruong-chu"><b>Rương Bát Linh · {Math.min(ruong.daLam,ruong.tong)}/{ruong.tong} câu hôm nay</b>
     <span className="dao2-vach dao2-vach-vang" role="progressbar" aria-label="Câu đã làm hôm nay" aria-valuemin={0} aria-valuemax={ruong.tong} aria-valuenow={Math.min(ruong.daLam,ruong.tong)}><i style={{width:`${Math.min(100,ruong.daLam/ruong.tong*100)}%`}}/></span>
     <small>{ruong.daMo?`Đã mở rương hôm nay${(ruongVua??ruong.vang)?` · +${ruongVua??ruong.vang} vàng dùng ở Cửa hàng phụ kiện`:''}`:`Xong ${ruong.tong}/${ruong.tong} câu → mở rương phụ kiện cho thần thú`}</small></span>
    {ruong.moDuoc&&!ruong.daMo&&onMoRuong&&<button type="button" className="dao2-nut-vien dao2-nut-ruong" disabled={busy} onClick={onMoRuong}>Mở rương</button>}
   </div>}
   {loi&&<p className="dao2-loi" role="alert">{loi}</p>}
  </div>

  <div className="dao2-xong-nut">
   {onDiTiep?<button type="button" className="dao2-nut-vang" disabled={busy} onClick={onDiTiep}>{soChuyen&&k<n?`ĐI CHUYẾN ${k+1}/${n}`:'ĐI CHUYẾN MỚI'}</button>
    :<button type="button" className="dao2-nut-vang" onClick={onVeBanDo}>VỀ BẢN ĐỒ</button>}
   <div className="dao2-xong-phu">
    {onDiTiep&&<button type="button" className="dao2-nut-vien" onClick={onVeBanDo}>Về bản đồ</button>}
    {onMoSoTay&&<button type="button" className="dao2-nut-vien" onClick={onMoSoTay}>Xem Sổ tay</button>}
   </div>
  </div>
 </div>
}
