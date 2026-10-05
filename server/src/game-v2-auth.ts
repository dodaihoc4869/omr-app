import type {Env} from './kieu'
import {hash} from './game-v2-bank'
import {DemTTL} from './dem-chung'
const enc=new TextEncoder()
async function signature(env:Env,payload:string){const k=await crypto.subtle.importKey('raw',enc.encode(env.MA_BI_MAT),{name:'HMAC',hash:'SHA-256'},false,['sign']);const s=await crypto.subtle.sign('HMAC',k,enc.encode(payload));return [...new Uint8Array(s)].map(x=>x.toString(16).padStart(2,'0')).join('')}
/** `matKhauVuaDoc` (chỉ-thêm, tối ưu 05/10 — CHỈ đường đăng nhập truyền): `mat_khau` THÔ của dòng `hoc_sinh` mà CHÍNH request này vừa đọc và vừa so khớp
 *  ⇒ khỏi đọc lại dòng ấy. Token vừa ký từ mật khẩu ấy là token ĐÃ QUA MỌI KIỂM (chữ ký, hạn 30 ngày, mật khẩu khớp) ⇒ ghi luôn vào đệm xác thực 60 giây:
 *  lượt game đầu tiên sau đăng nhập (Sảnh) khỏi một đợt `SELECT mat_khau` — cùng luật đệm đã chấp nhận bên dưới. Không truyền ⇒ y như cũ. */
export async function gameToken(env:Env,sbd:string,matKhauVuaDoc?:unknown):Promise<string>{
  const daDoc=matKhauVuaDoc!==undefined
  const mk=daDoc?(matKhauVuaDoc==null?null:String(matKhauVuaDoc)):(await env.DB.prepare('SELECT mat_khau FROM hoc_sinh WHERE sbd=?').bind(sbd).first<{mat_khau:string}>())?.mat_khau
  if(!mk)return ''
  const exp=Date.now()+30*86400000
  const payload=btoa(JSON.stringify({sbd,exp,pwd:await hash(mk)}));const token=`${payload}.${await signature(env,payload)}`
  if(daDoc)demXacThuc.ghi(token,Date.now(),{sbd,exp})
  return token
}
/** ĐỆM XÁC THỰC TOKEN 60 giây (Boss 21/09: `SELECT mat_khau` 38 nghìn lượt/giờ khi D1 nghẽn): chỉ lưu token ĐÃ QUA MỌI KIỂM (chữ ký, hạn, mật khẩu còn khớp); khoá = chính chuỗi token nên không lẫn giữa các em; hết hạn = sớm hơn hạn token.
 *  HỆ QUẢ ĐÃ CHẤP NHẬN: em/thầy đổi mật khẩu hoặc khoá em ⇒ token cũ còn dùng được tới 60 giây rồi mới bị từ chối. KHÔNG dùng cho đăng nhập, vào thi, nộp bài thi (các đường ấy không đi qua hàm này). Token sai/hết hạn KHÔNG bao giờ được đệm. */
const demXacThuc=new DemTTL<{sbd:string;exp:number}>(60_000,3000)
/** `khiDaKy` (chỉ-thêm, tối ưu 05/10): gọi NGAY khi token qua bước kiểm KHÔNG chạm D1 (đệm / chữ ký / hạn), TRƯỚC lượt đọc mật khẩu — nơi gọi bắt đầu
 *  các lượt ĐỌC của mình cùng đợt với lượt ấy (xem `gameIdentityHaiBuoc`). Kết quả, lỗi, đệm y như cũ. */
export async function gameIdentity(env:Env,b:Record<string,unknown>,khiDaKy?:(sbd:string)=>void):Promise<string>{
  const {sbd,xong}=await gameIdentityHaiBuoc(env,b)
  khiDaKy?.(sbd)
  return xong
}
/**
 * `gameIdentity` TÁCH HAI BƯỚC (tối ưu 05/10) — cùng kiểm, cùng thứ tự, cùng lời lỗi, cùng đệm:
 *  - bước 1 (KHÔNG chạm D1): đệm xác thực → chữ ký → JSON → không phải mã phụ huynh → còn hạn. Sai ⇒ ném NGAY như cũ (token giả không tốn lượt D1 nào).
 *    Trả `sbd` của token ĐÃ KÝ ĐÚNG (chính là SBD sẽ trả về nếu bước 2 qua).
 *  - bước 2 `xong`: mật khẩu còn khớp (một lượt D1; qua ⇒ vào đệm 60 s) ⇒ `sbd`, sai ⇒ lỗi "Mật khẩu đã đổi" như cũ.
 * Nơi gọi CHỈ được bắt đầu các lượt ĐỌC theo `sbd` (không ghi, không đệm gì, không trả gì cho em) trong lúc chờ `xong` — cùng đợt với lượt đọc mật khẩu;
 * mọi việc còn lại làm SAU `await xong`. Trúng đệm ⇒ `xong` đã xong sẵn.
 */
export async function gameIdentityHaiBuoc(env:Env,b:Record<string,unknown>):Promise<{sbd:string;xong:Promise<string>}>{
  const token=String(b.token??'');const [payload,sig]=token.split('.');if(!payload||!sig)throw new Error('Em nhập lại mật khẩu để mở hồ sơ game trên máy này.')
  const daBiet=demXacThuc.doc(token,Date.now());if(daBiet&&daBiet.exp>=Date.now())return {sbd:daBiet.sbd,xong:Promise.resolve(daBiet.sbd)} // hết hạn của chính token vẫn được kiểm ở mỗi lượt
  const expected=await signature(env,payload);let diff=expected.length^sig.length;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^(sig.charCodeAt(i)||0);if(diff)throw new Error('Phiên game không hợp lệ.')
  let o:{sbd:string;exp:number;pwd:string};try{o=JSON.parse(atob(payload))}catch{throw new Error('Phiên game không hợp lệ.')}
  if((o as {purpose?:unknown}).purpose)throw new Error('Phiên game không hợp lệ.') // mã phụ huynh (có `purpose`) KHÔNG bao giờ là phiên học sinh
  if(!o.sbd||o.exp<Date.now())throw new Error('Phiên game đã hết hạn. Em đăng nhập lại.')
  const xong=(async()=>{
    // Nhường MỘT vi tác vụ: lượt đọc mật khẩu vào CÙNG lô D1 với các lượt đọc nơi gọi bắt đầu ngay sau bước 1 (bản gộp đọc của lượt) — chỉ bớt lượt gọi D1.
    await null
    const row=await env.DB.prepare('SELECT mat_khau FROM hoc_sinh WHERE sbd=?').bind(o.sbd).first<{mat_khau:string}>();if(!row?.mat_khau||await hash(row.mat_khau)!==o.pwd)throw new Error('Mật khẩu đã đổi. Em đăng nhập lại.')
    demXacThuc.ghi(token,Date.now(),{sbd:o.sbd,exp:Number(o.exp)})
    return o.sbd
  })()
  xong.catch(()=>{}) // nơi gọi luôn `await xong` (lỗi tới đúng chỗ); chặn cảnh báo "lỗi chưa xử lý" khi nơi gọi đang bận chỗ khác
  return {sbd:o.sbd,xong}
}
/**
 * MÃ PHỤ HUYNH (dùng cho `/game-v2-parent`, `/parent-news/*`, `/mom/create|parent-list`, `/ph/*`). HMAC-SHA256, 30 ngày, `purpose:'game-parent'`.
 * RÀNG BUỘC MẬT KHẨU EM: nếu em có mật khẩu thì token mang `pk` = băm mật khẩu lúc cấp — em/thầy đổi mật khẩu là mọi liên kết đã phát THU HỒI ngay (như `gameToken`).
 * Token cũ (cấp trước 21/09, không có `pk`) vẫn dùng được tới khi hết hạn 30 ngày; không thu hồi được.
 */
export async function parentPass(env:Env,sbd:string,ngayHan=30):Promise<string>{
  const row=await env.DB.prepare('SELECT mat_khau FROM hoc_sinh WHERE sbd=?').bind(sbd).first<{mat_khau:string|null}>().catch(()=>null)
  const o:Record<string,unknown>={sbd,exp:Date.now()+Math.max(1,Math.min(365,Math.round(ngayHan)||30))*86400000,purpose:'game-parent'}
  if(row?.mat_khau)o.pk=await hash(row.mat_khau) // KHÔNG đặt tên `pwd`: `gameIdentity` kiểm `pwd` — token PH mà đọc được như token học sinh là PH thành em
  const payload=btoa(JSON.stringify(o));return `${payload}.${await signature(env,payload)}`
}
const soSanhHang=(a:string,b:string)=>{let d=a.length^b.length;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^(b.charCodeAt(i)||0);return d===0}
export async function parentIdentity(env:Env,token:string):Promise<string>{
  const [payload,sig]=String(token??'').split('.');if(!payload||!sig||!soSanhHang(await signature(env,payload),sig))throw new Error('Mã xem tiến bộ không hợp lệ.')
  let o:{sbd?:unknown;exp?:unknown;purpose?:unknown;pk?:unknown};try{o=JSON.parse(atob(payload))}catch{throw new Error('Mã xem tiến bộ không hợp lệ.')}
  if(o.purpose!=='game-parent'||!(Number(o.exp)>=Date.now()))throw new Error('Mã xem tiến bộ đã hết hạn.')
  const sbd=String(o.sbd??'');if(!sbd)throw new Error('Mã xem tiến bộ không hợp lệ.')
  if(typeof o.pk==='string'){
    const row=await env.DB.prepare('SELECT mat_khau FROM hoc_sinh WHERE sbd=?').bind(sbd).first<{mat_khau:string|null}>()
    if(!row?.mat_khau||await hash(row.mat_khau)!==o.pk)throw new Error('Mật khẩu của con đã đổi nên liên kết này hết hiệu lực. Anh/chị nhờ Thầy gửi lại liên kết mới.')
  }
  return sbd
}
