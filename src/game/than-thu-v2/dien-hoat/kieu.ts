import {giamHieuUng} from '../../../lib/may-yeu'
/** Sáu khung trong bảng gốc; biên cắt có thể chéo để giữ bàn chân/cánh. */
export interface KhungThu{x:number;y:number;w:number;h:number;col:number;anchorX:number;foot:number;clip?:number[][]}
export type BangThu='chay'|'dam'|'chuong'|'dung-trung'
export interface SacChuong{main:string;accent:string;type:string}
export interface ThuDienHoat extends SacChuong{id:number;name:string;spell:string;portrait:string;release:{x:number;y:number};sheets:Record<BangThu,{preview:string;frames:KhungThu[]}>}
export type DongTac='idle'|'run'|'punch'|'cast'|'ultimate'|'hit'|'guard'
export interface BanDongHanh{id:number;pet:number;raDon?:boolean}
export interface DichDienHoat{id:string|number;loai:string;ha?:boolean}
/** Đơn vị sân 1100×580 (ngang) / 680×550 (dọc), cùng vị trí với video đã duyệt. */
export function boCucSan(rong:number,cao:number){const doc=rong<650,W=doc?680:1100,H=W*cao/Math.max(1,rong),ground=H*.852,size=Math.min(doc?285:335,H*.66);return {W,H,ground,left:W*(doc?175/680:275/1100),right:W*(doc?527/680:851/1100),size,enemySize:Math.min(doc?175:220,H*.49)}}
export const NHIP_CHUONG={thuong:{phong:.63,trung:1.12,het:2.16},tuyet:{phong:.96,trung:1.58,het:3.05}} as const

/** Một công tắc cho tranh, tiếng và thời gian chờ lời giải. */
export function giamDienHoat(){try{return giamHieuUng()||localStorage.getItem('game-v2-low')==='1'}catch{return giamHieuUng()}}
