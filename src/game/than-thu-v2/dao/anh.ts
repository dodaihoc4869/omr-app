/** Ảnh nhẹ của Đảo thần thú (sinh bằng scripts/cat-anh-than-thu.mjs → public/than-thu-v2/nho/). Màn mới KHÔNG nạp atlas 3 MB. */
import {evolutionStage} from '../evolution'
const GOC='/than-thu-v2/nho'
const kep=(n:number,max:number)=>Math.max(0,Math.min(max,Math.trunc(Number.isFinite(n)?n:0)))
/** Thú `thu` (0..7) ở DẠNG tiến hoá `dang` (0..5); `be` = bản 96 px cho ô nhỏ. */
export const anhThuTheoDang=(thu:number,dang:number,be=false)=>`${GOC}/thu-${kep(thu,7)}-${kep(dang,5)}${be?'-be':''}.webp`
/** Thú ở đúng dạng của CẤP thật. */
export const anhThu=(thu:number,cap:number,be=false)=>anhThuTheoDang(thu,evolutionStage(cap),be)
export type TrangThaiThe='binh-thuong'|'cuong-no'
/** Thẻ tranh 512 px: Bình thường | Cuồng nộ. */
export const anhThe=(thu:number,trangThai:TrangThaiThe)=>`${GOC}/the-${kep(thu,7)}-${trangThai}.webp`
