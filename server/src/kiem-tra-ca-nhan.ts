import type { Env } from './kieu'
import { docCauHinhDem } from './cau-hinh-dem'
import { damBaoKtCn } from './kiem-tra-ca-nhan-schema'
import { bamKt, chonDeKt, congNgayKt, dauNgayKt, henKt, ngayKt, phutCauKt, type BangChungKt, type MucKt, type UngKt } from './kiem-tra-ca-nhan-loi'
import { phamViLop } from './bai-da-day'
import { docCauTheoRef, docKhoiEm, protectedQuestions } from './game-v2-bank'
import { chanKhacKhoiEm } from './chan-khac-khoi'
import { readGameScope } from './game-v2-reports'
import { docCauBtvnChuaNop } from './game-v2-luot'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import { grade, publicQuestion, type PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { hoSoOmniEm } from './omni-d1'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { diemGoi7, diemTo7 } from './goi-bai-7-loi'
import { khopPhanIII } from '../../src/lib/cham-so'
import { ketQuaTungY } from './omni-game'
import { ghiSuKien, type SuKien } from './su-kien-hoc'
import { sqlTenLopHs } from './goi-bai-7'
import { henHalfLife, type MoHinhHalfLife } from './half-life'
import { chuanMucDo } from './lich-su-lam-cau'

type Row = Record<string, unknown>
const s = (v: unknown) => String(v ?? '')
const mang = (v: unknown): string[] => { try { const a = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string' && !!x) : [] } catch { return [] } }
interface CauDe { q: PrivateQuestion; muc: string[]; y: Record<string, string[]>; phut: number }
interface DeKt { phienBan: 1; lyDo: string; bai: {khoa:string;ten:string}[]; muc: MucKt[]; cau: CauDe[]; soPhu: number; phut: number; thieu: string[]; chang: { qids: string[]; giay: number }[] }
const de = (r: Row): DeKt => JSON.parse(s(r.json)) as DeKt
const tra = (r: Row): Record<string, string> => JSON.parse(s(r.tra_json)) as Record<string, string>
/** Số tĩnh của một đề (không đổi sau khi lập) + phần của từng câu để đếm "đã trả lời" từ tra_json. Cùng phép tính với nhánh đọc đề của tomTatKt. */
export interface MetaKt { tong: number; soChang: number; phut: number; soBai: number; tongKienThuc: number; phuDe: number; lyDo: string; thieuNguon: number; phan: Record<string, string> }
export function metaKt(d: DeKt): MetaKt {
  const thieu = new Set(d.thieu)
  return { tong: d.cau.length, soChang: d.chang.length, phut: d.phut, soBai: d.bai?.length ?? new Set(d.muc.map(m => m.bai)).size, tongKienThuc: d.muc.length,
    phuDe: d.muc.filter(m => !thieu.has(m.id)).length, lyDo: d.lyDo, thieuNguon: d.thieu.length, phan: Object.fromEntries(d.cau.map(c => [c.q.qid, c.q.phan])) }
}
const SQL_GHI_META_KT = `INSERT INTO kiem_tra_ca_nhan_meta(id,meta_json) SELECT ?1,?2 WHERE EXISTS(SELECT 1 FROM kiem_tra_ca_nhan WHERE id=?1 AND cap_nhat_luc=?3) ON CONFLICT(id) DO UPDATE SET meta_json=excluded.meta_json`
/** Bù số tính sẵn cho lịch lập trước bản vá 13/10 (mỗi lượt ≤ tran dòng). Chỉ ghi khi đề chưa đổi kể từ lúc đọc (cap_nhat_luc khớp). */
export async function buMetaKt(env: Env, tran = 10): Promise<number> {
  const r = await env.DB.prepare(`SELECT k.id,k.json,k.cap_nhat_luc FROM kiem_tra_ca_nhan k WHERE NOT EXISTS(SELECT 1 FROM kiem_tra_ca_nhan_meta km WHERE km.id=k.id) LIMIT ?`).bind(tran).all<Row>()
  if (!r.results.length) return 0
  await env.DB.batch(r.results.map(x => env.DB.prepare(SQL_GHI_META_KT).bind(s(x.id), JSON.stringify(metaKt(de(x))), Number(x.cap_nhat_luc))))
  return r.results.length
}
export async function coKtCn(env: Env): Promise<boolean> {
  const v = await docCauHinhDem(env, 'kiem_tra_ca_nhan_v1')
  if (!v) return false
  try { return JSON.parse(v).bat === true } catch { throw new Error('Cấu hình kiểm tra riêng đang lỗi. Chưa thể xác định nhiệm vụ hôm nay.') }
}
export const duTraKt = (phan: string, a: string) => phan === 'I' ? /^[ABCD]$/.test(a) : phan === 'II' ? /^[DS]{4}$/.test(a) : a.trim().length > 0 && a.length <= 100
const dungKt = (q: PrivateQuestion, a: string) => q.phan === 'III' ? khopPhanIII(a, q.correct) : grade(q, a)
// Lịch/báo cáo chỉ lấy số ở D1, không tải hàng trăm bản đề riêng chứa nội dung/đáp án lên Worker.
// Lịch/báo cáo chỉ lấy SỐ, không tải đề riêng chứa nội dung/đáp án lên Worker. KHẨN 13/10 (D1 quá tải, mã 7429): bản cũ bóc JSON đề
// lớn ngay trong SQL (json_each lồng nhau + NOT IN tương quan) ≈ 0,9 s MỖI dòng ⇒ mỗi lần em mở app, phụ huynh xem, thầy mở bảng là D1 xếp hàng.
// Nay: số tĩnh tính SẴN lúc lập đề vào `kiem_tra_ca_nhan_meta` (metaKt); "đã trả lời" đếm trên hai JSON NHỎ (bảng phần từng câu × tra_json),
// cùng phép đếm chặt cũ. Không trả đề / câu trả lời ra Worker. Dòng chưa có số tính sẵn (lập trước bản vá, chờ bù) mới rơi về phép tính cũ.
export const COT_META_KT = `k.id,k.sbd,k.lop,k.ngay,k.mo_luc,k.han_luc,k.trang_thai,k.nop_luc,k.diem,k.da_ghi,k.cap_nhat_luc,
 COALESCE((SELECT json_remove(json_set(km.meta_json,'$.daTra',(SELECT COUNT(*) FROM json_each(km.meta_json,'$.phan') p JOIN json_each(k.tra_json) a ON a.key=p.key WHERE a.type='text' AND CASE p.value WHEN 'I' THEN a.value IN('A','B','C','D') WHEN 'II' THEN length(a.value)=4 AND replace(replace(a.value,'D',''),'S','')='' ELSE length(trim(a.value,char(9,10,11,12,13,32,160,5760,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288,65279)))>0 AND length(a.value)<=100 END)),'$.phan') FROM kiem_tra_ca_nhan_meta km WHERE km.id=k.id),
 json_object('tong',json_array_length(k.json,'$.cau'),'soChang',json_array_length(k.json,'$.chang'),'phut',json_extract(k.json,'$.phut'),'soBai',json_array_length(k.json,'$.bai'),'tongKienThuc',json_array_length(k.json,'$.muc'),'phuDe',(SELECT COUNT(*) FROM json_each(k.json,'$.muc') m WHERE json_extract(m.value,'$.id') NOT IN(SELECT value FROM json_each(k.json,'$.thieu'))),'lyDo',json_extract(k.json,'$.lyDo'),'thieuNguon',json_array_length(k.json,'$.thieu'),'daTra',(SELECT COUNT(*) FROM json_each(k.json,'$.cau') c JOIN json_each(k.tra_json) a ON a.key=json_extract(c.value,'$.q.qid') WHERE a.type='text' AND CASE json_extract(c.value,'$.q.phan') WHEN 'I' THEN a.value IN('A','B','C','D') WHEN 'II' THEN length(a.value)=4 AND replace(replace(a.value,'D',''),'S','')='' ELSE length(trim(a.value,char(9,10,11,12,13,32,160,5760,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288,65279)))>0 AND length(a.value)<=100 END))) meta_json`

/** Chỉ đọc; bảng chỉ được tạo ở cron/migration, không ở trang của thầy/PH. */
export async function docKtCn(env: Env, sbd: string, now: number, chiMeta=false): Promise<Row | null> {
  if (!await coKtCn(env)) return null
  const r = await env.DB.prepare(`SELECT ${chiMeta?COT_META_KT:'k.*'} FROM kiem_tra_ca_nhan k JOIN hoc_sinh h ON h.sbd=k.sbd AND k.lop=${sqlTenLopHs('h')} WHERE k.sbd=? AND k.ngay>=? AND COALESCE(h.trang_thai,'')<>'khoa' ORDER BY (k.trang_thai='cho_nguon'),k.ngay LIMIT 1`).bind(sbd, ngayKt(now)).first<Row>()
  if (!r) return null
  return r
}
export function laNgayKt(r: Row | null, now: number): boolean { return !!r && s(r.ngay) === ngayKt(now) && s(r.trang_thai) !== 'cho_nguon' }
export function tomTatKt(r: Row, now: number) {
  const d=r.meta_json?null:de(r),t=d?tra(r):null
  const meta=r.meta_json?JSON.parse(s(r.meta_json)) as Record<string,number|string>:null
  const tong=d?.cau.length??Number(meta!.tong),daTra=d?d.cau.filter(c=>duTraKt(c.q.phan,t![c.q.qid]??'')).length:Number(meta!.daTra)
  const thieu=d?.thieu.length??Number(meta!.thieuNguon),tongKienThuc=d?.muc.length??Number(meta!.tongKienThuc)
  return { id: s(r.id), ngay: s(r.ngay), moLuc: Number(r.mo_luc), hanLuc: Number(r.han_luc), serverNow: now,
    trangThai: s(r.trang_thai) === 'cho_nguon' ? 'cho_nguon' : r.nop_luc ? s(r.trang_thai) : now < Number(r.mo_luc) ? 'sap_den' : now >= Number(r.han_luc) ? 'het_han' : 'can_lam',
    homNay: laNgayKt(r, now),tong,daTra,con:tong-daTra,soChang:d?.chang.length??Number(meta!.soChang),phut:d?.phut??Number(meta!.phut),
    soBai:d?(d.bai?.length??new Set(d.muc.map(m=>m.bai)).size):Number(meta!.soBai),tongKienThuc,phuDe:d?d.muc.filter(m=>!d.thieu.includes(m.id)).length:Number(meta!.phuDe),
    nguonDayDu:thieu===0&&tongKienThuc>0,lyDo:d?.lyDo??String(meta!.lyDo),thieuNguon:thieu,
    diem: r.diem === null || r.diem === undefined ? null : Number(r.diem), nopLuc: r.nop_luc ? Number(r.nop_luc) : null }
}

/** Chuẩn bị trên cron, không bắt mỗi lượt mở app đọc lại toàn kho/lập đề. */
export async function lapKtCn(env: Env, sbd: string, now: number, lamMoi=false) {
  await damBaoKtCn(env)
  const em=await env.DB.prepare(`SELECT ${sqlTenLopHs('h')} lop FROM hoc_sinh h WHERE sbd=? AND COALESCE(trang_thai,'')<>'khoa'`).bind(sbd).first<Row>()
  const lop=s(em?.lop),pv = lop ? await phamViLop(env, lop) : null
  if (!lop || !pv?.maDe.size) return null
  const cu=await env.DB.prepare("SELECT * FROM kiem_tra_ca_nhan WHERE sbd=? AND lop=? AND ngay>=? AND trang_thai<>'cho_nguon' ORDER BY ngay LIMIT 1").bind(sbd,lop,ngayKt(now)).first<Row>()
  if(cu&&(!lamMoi||Number(cu.mo_luc)<=now))return {id:s(cu.id),ngay:s(cu.ngay),tong:de(cu).cau.length,thieu:de(cu).thieu.length,phut:de(cu).phut}
  const goc = JSON.stringify([...pv.maDe])
  const [rows, matrices, hs, baoVe, btvn, control, khoi, lichSu, lanCuoi] = await Promise.all([
    env.DB.prepare(`SELECT q.json,q.qid,q.version,q.ma_de FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index i ON i.ma_de=d.ma_de AND i.source_version=d.cap_nhat_luc WHERE COALESCE(d.da_xoa,0)=0 AND q.ma_de IN(SELECT value FROM json_each(?))`).bind(goc).all<Row>(),
    env.DB.prepare(`SELECT o.qid,o.y,o.vkn_json FROM omni_q o WHERE o.qid IN(SELECT q.qid FROM game_v2_question q WHERE q.ma_de IN(SELECT value FROM json_each(?)))`).bind(goc).all<Row>(),
    hoSoOmniEm(env, sbd, now), protectedQuestions(env), docCauBtvnChuaNop(env, sbd), readGameScope(env, sbd), docKhoiEm(env, sbd),
    env.DB.prepare(`SELECT qid,ngay_vn,ket_qua,raw_json,subitem_json FROM su_kien_hoc WHERE sbd=? AND assistance='none' AND COALESCE(visibility,'')<>'embargoed' AND nguon<>'thi' AND ${SQL_LA_LAN_LAM} AND ngay_vn>=? ORDER BY luc DESC LIMIT 500`).bind(sbd, congNgayKt(ngayKt(now), -60)).all<Row>(),
    env.DB.prepare(`SELECT ngay FROM kiem_tra_ca_nhan WHERE sbd=? AND trang_thai IN('da_nop','het_han') ORDER BY ngay DESC LIMIT 1`).bind(sbd).first<Row>(),
  ])
  if (!control.enabled) return null
  const byQ = new Map<string, Row[]>()
  for (const m of matrices.results) (byQ.get(s(m.qid)) ?? byQ.set(s(m.qid), []).get(s(m.qid))!).push(m)
  const muc = new Map<string, MucKt>(), ds: CauDe[] = [], thieu = new Set<string>()
  const coTo = new Set(rows.results.map(r => s(r.ma_de)))
  const phanQ=new Map(rows.results.map(r=>[s(r.qid),(JSON.parse(s(r.json)) as PrivateQuestion).phan]))
  for (const ma of pv.maDe) if (!coTo.has(ma)) thieu.add(`nguon:${ma}`)
  for (const r of rows.results) {
    const q = JSON.parse(s(r.json)) as PrivateQuestion
    if (laCauTuLuan(q)) continue
    const bai = pv.baiTheoMaDe.get(q.maDe)
    if (!bai) continue
    const ms = byQ.get(q.qid) ?? [], ids = new Set<string>(), y: Record<string, string[]> = {}
    for (const m of ms) for (const kn of mang(m.vkn_json)) {
      const mucDo=chuanMucDo(q.mucDo)||'chua_ro',id = JSON.stringify([bai.khoaBai, kn, mucDo])
      muc.set(id, { id, bai: bai.khoaBai, tenBai: bai.tenBai, kyNang: kn, mucDo }); ids.add(id)
      ;(y[s(m.y)] ??= []).push(id)
    }
    // Không dùng qid/dang dự phòng để tuyên bố đã phủ đủ kiến thức.
    if (!ids.size) { thieu.add(`ma_tran:${q.qid}`); continue }
    const mau = lichSu.results.filter(l => phanQ.get(s(l.qid)) === q.phan && Number(l.ket_qua) === 1).map(l => { try { return Number(JSON.parse(s(l.raw_json)).ms) } catch { return NaN } })
    ds.push({ q, muc: [...ids], y, phut: phutCauKt(q.phan, mau) })
  }
  const quaKhoi = new Set((await chanKhacKhoiEm(env, 'ktcn', { sbd, khoiEm: khoi }, ds.map(c => c.q))).map(q => q.qid))
  const bc = new Map<string, BangChungKt>()
  const model=await env.DB.prepare('SELECT mo_hinh_json FROM hanh_trinh_v4_em WHERE sbd=?').bind(sbd).first<{mo_hinh_json:string}>().catch(()=>null)
  let memory:MoHinhHalfLife|undefined
  try{memory=model?JSON.parse(model.mo_hinh_json).halfLife:undefined}catch{/* Dữ liệu mô hình hỏng không được dùng để dự đoán quên. */}
  for (const m of muc.values()) {
    const b = hs.vkn[m.kyNang]
    let hen:string|undefined
    try{hen=memory?henHalfLife(memory,[m.kyNang],0.9)??undefined:undefined}catch{/* Mô hình không hợp lệ: dùng chu kỳ kiểm chứng tuần. */}
    bc.set(m.id, { p: b?.p ?? 0.3, vung: b?.trangThai === 'vung', n: b?.nTuLam ?? 0, ngayCuoi: b?.ngayCuoi ?? null,hen })
  }
  const ung: UngKt[] = ds.map(c => ({ qid: c.q.qid, group: c.q.group, muc: c.muc, phut: c.phut,
    daGap: lichSu.results.some(l => l.qid === c.q.qid), hopLe: c.q.reviewed && quaKhoi.has(c.q.qid) && !baoVe.has(c.q.qid) && !baoVe.has(c.q.group) && !btvn.has(c.q.qid) && !control.blocked.includes(c.q.qid) && (!control.types.length || !!c.q.dang && control.types.includes(c.q.dang)) }))
  const chon = chonDeKt([...muc.values()], ung, bc, sbd + ngayKt(now))
  for (const id of chon.thieu) thieu.add(id)
  const nhip = new Map<number, number>()
  for (const d of new Set(lichSu.results.map(l => s(l.ngay_vn)))) { const thu = new Date(d + 'T00:00:00Z').getUTCDay(); nhip.set(thu, (nhip.get(thu) ?? 0) + 1) }
  const maxNhip = Math.max(1, ...nhip.values()); for (const [k, v] of nhip) nhip.set(k, v / maxNhip)
  const hanBai = await env.DB.prepare(`SELECT e.han FROM goi_bai_7_em e WHERE e.sbd=? AND e.han>=?`).bind(sbd, ngayKt(now)).all<Row>().catch(() => ({ results: [] as Row[] }))
  const hen = henKt({ sbd, homNay: ngayKt(now), lanTruoc: lanCuoi ? s(lanCuoi.ngay) : undefined, bangChung: [...bc.values()], nhip: nhip, hanBai: hanBai.results.map(r => s(r.han)) })
  if(cu)hen.ngay=s(cu.ngay)
  const cau = chon.qids.map(id => ds.find(c => c.q.qid === id)!).sort((a, b) => bamKt(sbd + a.q.qid) - bamKt(sbd + b.q.qid))
  const chang: DeKt['chang'] = []
  let du = Math.max(0, chon.phut * 60 - cau.reduce((n, c) => n + Math.ceil(c.phut * 72), 0))
  for (let i = 0; i < cau.length; i += 6) { const cs = cau.slice(i, i + 6); chang.push({ qids: cs.map(c => c.q.qid), giay: Math.ceil(cs.reduce((n, c) => n + c.phut * 72, 0)) + (i === 0 ? du : 0) }); du = 0 }
  const bai=[...new Map([...pv.baiTheoMaDe.values()].map(b=>[b.khoaBai,{khoa:b.khoaBai,ten:b.tenBai}])).values()]
  const d: DeKt = { phienBan: 1, lyDo: hen.lyDo, bai, muc: [...muc.values()], cau, soPhu: chon.soPhu, phut: Math.ceil(chang.reduce((n,c)=>n+c.giay,0)/60), thieu: [...thieu], chang }
  const id = `ktcn:${sbd}:${hen.ngay}`
  // Cùng giao dịch: số tính sẵn chỉ ghi khi đề vừa ghi thật (cap_nhat_luc = now) ⇒ không lệch đề đang lưu.
  await env.DB.batch([env.DB.prepare(`INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,cap_nhat_luc) SELECT ?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo') AND (?=1 OR NOT EXISTS(SELECT 1 FROM kiem_tra_ca_nhan WHERE sbd=? AND lop=? AND ngay>=? AND trang_thai<>'cho_nguon')) ON CONFLICT(sbd,ngay) DO UPDATE SET lop=excluded.lop,json=excluded.json,trang_thai=excluded.trang_thai,cap_nhat_luc=excluded.cap_nhat_luc WHERE (?=1 OR kiem_tra_ca_nhan.trang_thai='cho_nguon' OR kiem_tra_ca_nhan.lop<>excluded.lop) AND kiem_tra_ca_nhan.mo_luc>? AND kiem_tra_ca_nhan.nop_luc IS NULL AND NOT EXISTS(SELECT 1 FROM kiem_tra_ca_nhan_chang c WHERE c.bai_id=kiem_tra_ca_nhan.id)`).bind(id,sbd,lop,hen.ngay,dauNgayKt(hen.ngay),dauNgayKt(congNgayKt(hen.ngay,1)),thieu.size || !muc.size ? 'cho_nguon' : 'hen',JSON.stringify(d),now,lamMoi?1:0,sbd,lop,ngayKt(now),lamMoi?1:0,now),env.DB.prepare(SQL_GHI_META_KT).bind(id,JSON.stringify(metaKt(d)),now)])
  return { id, ngay: hen.ngay, tong: cau.length, thieu: thieu.size, phut: d.phut }
}

async function docBai(env: Env, sbd: string, id: string) {
  const r = await env.DB.prepare(`SELECT k.* FROM kiem_tra_ca_nhan k JOIN hoc_sinh h ON h.sbd=k.sbd AND k.lop=${sqlTenLopHs('h')} WHERE k.id=? AND k.sbd=? AND COALESCE(h.trang_thai,'')<>'khoa'`).bind(id,sbd).first<Row>()
  if (!r) throw new Error('Bài kiểm tra này không thuộc lớp hiện tại của em.')
  return r
}
async function kiemNguon(env: Env, sbd: string, cs: readonly CauDe[]) {
  const [baoVe, scope, btvn, khoi] = await Promise.all([protectedQuestions(env),readGameScope(env,sbd),docCauBtvnChuaNop(env,sbd),docKhoiEm(env,sbd)])
  if (!scope.enabled) throw new Error('Việc học đang tạm dừng.')
  const qua = new Set((await chanKhacKhoiEm(env,'ktcn',{sbd,khoiEm:khoi},cs.map(c=>c.q))).map(q=>q.qid))
  const refs = await Promise.all(cs.map(c=>docCauTheoRef(env,c.q)))
  for (let i=0;i<cs.length;i++) { const q=cs[i]!.q, current=refs[i]; if (!current?.reviewed || current.version!==q.version || !qua.has(q.qid) || baoVe.has(q.qid) || baoVe.has(q.group) || btvn.has(q.qid) || scope.blocked.includes(q.qid) || scope.types.length && (!q.dang || !scope.types.includes(q.dang))) throw new Error('Một câu của bài đang đổi nguồn hoặc được giữ cho ca kiểm tra. Thầy sẽ xử lý; kết quả đã lưu của em được giữ.') }
}

/** Chốt một lần, ghi sổ có receipt ổn định; retry/cron có thể hồi phục sau khi ghi sổ lỗi. */
export async function chotKtCn(env: Env, r: Row, now: number, hetHan = false) {
  for(let lan=0;!r.nop_luc&&lan<4;lan++) {
    const d=de(r), t=tra(r), diem=diemTo7(d.cau.reduce((n,c)=>n+diemGoi7(c.q.phan,t[c.q.qid]??'',c.q.correct,dungKt(c.q,t[c.q.qid]??'')),0),d.cau.reduce((n,c)=>n+(c.q.phan==='II'?1:0.25),0))
    // Chốt đúng phiên bản nháp đã chấm; một lượt lưu chen vào phải khiến chấm lại, không lệch điểm với sổ.
    await env.DB.prepare(`UPDATE kiem_tra_ca_nhan SET nop_luc=?,diem=?,trang_thai=?,cap_nhat_luc=? WHERE id=? AND nop_luc IS NULL AND revision=?`).bind(Math.min(now,Number(r.han_luc)),diem,hetHan?'het_han':'da_nop',now,r.id,r.revision).run()
    r=(await env.DB.prepare('SELECT * FROM kiem_tra_ca_nhan WHERE id=?').bind(r.id).first<Row>())!
  }
  if(!r.nop_luc)throw new Error('Bản nháp đang cập nhật. Em thử nộp lại để chốt đúng câu trả lời mới nhất.')
  if (Number(r.da_ghi)===1) return r
  const d=de(r), t=tra(r), luc=new Date(Number(r.nop_luc)).toISOString()
  const events:SuKien[]=d.cau.filter(c=>duTraKt(c.q.phan,t[c.q.qid]??'')).map(c=>({nguon:'game',maNguon:s(r.id),sbd:s(r.sbd),qid:c.q.qid,cauVersion:c.q.version,lan:1,ketQua:dungKt(c.q,t[c.q.qid]!)?1:0,luc,receivedAt:Number(r.nop_luc),assistance:'none',purpose:'de_thu',attemptId:`${s(r.id)}|${c.q.qid}`,maDang:c.q.dang,mucDo:c.q.mucDo??undefined,raw:{answer:t[c.q.qid],kiemTraCaNhan:true,recall:true},...(c.q.phan==='II'?{subitem:ketQuaTungY(t[c.q.qid]!,c.q.correct)}:{})}))
  const ghi=await ghiSuKien(env,events)
  if (ghi.ok) { await env.DB.prepare('UPDATE kiem_tra_ca_nhan SET da_ghi=1 WHERE id=? AND nop_luc IS NOT NULL').bind(r.id).run(); r.da_ghi=1 }
  return r
}

export async function ktCnAction(env: Env, sbd: string, action: string, b: Row, now: number): Promise<Row> {
  if (!await coKtCn(env)) throw new Error('Kiểm tra riêng chưa được bật.')
  let r=await docBai(env,sbd,s(b.id)), d=de(r)
  if (s(r.trang_thai)==='cho_nguon') throw new Error('Bài đang chờ đủ nguồn. Em tiếp tục lịch học thường.')
  if(action==='hoc-tap-ktcn-trang-thai'){
    if(!r.nop_luc&&now>=Number(r.han_luc))r=await chotKtCn(env,r,now,true)
    const rows=await env.DB.prepare('SELECT * FROM kiem_tra_ca_nhan_chang WHERE bai_id=?').bind(r.id).all<Row>()
    return {ok:true,kiemTra:tomTatKt(r,now),chang:d.chang.map((c,i)=>{const cr=rows.results.find(v=>Number(v.stt)===i);return {stt:i,soCau:c.qids.length,giay:c.giay,han:cr?Number(cr.han):null,daChot:!!cr&&(!!cr.chot_luc||now>=Number(cr.han))}})}
  }
  if (now<Number(r.mo_luc)) throw new Error('Chưa đến lịch kiểm tra của em.')
  if (!r.nop_luc && now>=Number(r.han_luc)) r=await chotKtCn(env,r,now,true)
  if (action==='hoc-tap-ktcn-nop') {
    // Không nhận đáp án ở lệnh nộp; chỉ chốt bản nháp đã lưu đúng giờ ở máy chủ.
    if (!r.nop_luc) {
      const active=await env.DB.prepare('SELECT 1 AS co FROM kiem_tra_ca_nhan_chang WHERE bai_id=? AND chot_luc IS NULL AND han>? LIMIT 1').bind(r.id,now).first()
      if (active) throw new Error('Em nộp chặng đang làm trước khi nộp toàn bài.')
      r=await chotKtCn(env,r,now)
    } else r=await chotKtCn(env,r,now)
    return {ok:true,kiemTra:tomTatKt(r,now),ketQua:await ketQuaKt(env,r,now)}
  }
  if (action==='hoc-tap-ktcn-ket-qua') {
    if (!r.nop_luc) throw new Error('Em nộp toàn bài trước khi xem phần chữa.')
    r=await chotKtCn(env,r,now)
    return {ok:true,kiemTra:tomTatKt(r,now),ketQua:await ketQuaKt(env,r,now)}
  }
  if (r.nop_luc) return {ok:true,kiemTra:tomTatKt(r,now),daNop:true}
  const stt=Number(b.chang)
  if (!Number.isInteger(stt)||stt<0||stt>=d.chang.length) throw new Error('Chặng kiểm tra không hợp lệ.')
  const ch=d.chang[stt]!, cs=d.cau.filter(c=>ch.qids.includes(c.q.qid))
  let row=await env.DB.prepare('SELECT * FROM kiem_tra_ca_nhan_chang WHERE bai_id=? AND stt=?').bind(r.id,stt).first<Row>()
  if (action==='hoc-tap-ktcn-start') {
    await kiemNguon(env,sbd,cs)
    const views=await env.DB.prepare('SELECT qid FROM loi_giai_hoi WHERE sbd=? AND qid IN(SELECT value FROM json_each(?)) AND julianday(luc)>julianday(?)-0.5 LIMIT 1').bind(sbd,JSON.stringify(ch.qids),new Date(now).toISOString()).first()
    if(views)throw new Error('Em vừa xem phần chữa của một câu trong chặng. Hãy quay lại sau ít nhất 12 giờ để kiểm chứng độc lập.')
    await env.DB.prepare(`INSERT OR IGNORE INTO kiem_tra_ca_nhan_chang(bai_id,stt,bat_dau,han) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM kiem_tra_ca_nhan WHERE id=? AND nop_luc IS NULL AND han_luc>?) AND NOT EXISTS(SELECT 1 FROM kiem_tra_ca_nhan_chang WHERE bai_id=? AND stt<>? AND chot_luc IS NULL AND han>?)`).bind(r.id,stt,now,Math.min(Number(r.han_luc),now+ch.giay*1000),r.id,now,r.id,stt,now).run()
    row=await env.DB.prepare('SELECT * FROM kiem_tra_ca_nhan_chang WHERE bai_id=? AND stt=?').bind(r.id,stt).first<Row>()
    if (!row) throw new Error('Em hoàn thành chặng đang mở trước nhé.')
    if (now>=Number(row.han)&&!row.chot_luc) { await env.DB.prepare('UPDATE kiem_tra_ca_nhan_chang SET chot_luc=han WHERE bai_id=? AND stt=? AND chot_luc IS NULL').bind(r.id,stt).run(); row.chot_luc=row.han }
    return {ok:true,kiemTra:tomTatKt(r,now),revision:Number(r.revision),chang:stt,hanChang:Number(row.han),daChot:!!row.chot_luc,questions:cs.map(c=>publicQuestion(c.q)),tra:Object.fromEntries(ch.qids.map(id=>[id,tra(r)[id]??'']))}
  }
  if (!row) throw new Error('Em mở chặng trước khi lưu bài.')
  if (action!=='hoc-tap-ktcn-luu'&&action!=='hoc-tap-ktcn-chot-chang') throw new Error('Lệnh kiểm tra chưa có.')
  let daLuu=false
  // Nộp chặng idempotent; không ghi nháp sau khi hết giờ hoặc đã chốt.
  if (!row.chot_luc && now<Number(row.han)) {
    const input=b.tra
    if (!input || typeof input!=='object' || Array.isArray(input)) throw new Error('Bản nháp chưa hợp lệ.')
    const entries=Object.entries(input).filter(([id])=>ch.qids.includes(id))
    if (entries.some(([,a])=>typeof a!=='string'||a.length>100)) throw new Error('Câu trả lời chưa hợp lệ.')
    // Patch JSON trong SQL, không đọc-gộp-ghi cả bản gây mất nháp khi hai chặng/lượt lưu tới cùng lúc.
    const patch=JSON.stringify(Object.fromEntries(entries))
    if(!Number.isInteger(b.revision)||Number(b.revision)<0)throw new Error('Bản nháp thiếu phiên bản. Em tải lại chặng để giữ câu trả lời mới nhất.')
    const saved=await env.DB.prepare(`UPDATE kiem_tra_ca_nhan SET tra_json=json_patch(tra_json,?),revision=revision+1,cap_nhat_luc=? WHERE id=? AND sbd=? AND revision=? AND nop_luc IS NULL AND han_luc>? AND EXISTS(SELECT 1 FROM kiem_tra_ca_nhan_chang WHERE bai_id=? AND stt=? AND chot_luc IS NULL AND han>?)`).bind(patch,now,r.id,sbd,b.revision,now,r.id,stt,now).run()
    if(!saved.meta.changes){const fresh=await docBai(env,sbd,s(r.id));if(entries.some(([id,a])=>tra(fresh)[id]!==a))throw new Error('Bản nháp đã thay đổi ở một lượt khác. Em tải lại chặng trước khi lưu tiếp.')}
    daLuu=true
  }
  if (action==='hoc-tap-ktcn-chot-chang'||now>=Number(row.han)) await env.DB.prepare('UPDATE kiem_tra_ca_nhan_chang SET chot_luc=? WHERE bai_id=? AND stt=? AND chot_luc IS NULL').bind(Math.min(now,Number(row.han)),r.id,stt).run()
  r=await docBai(env,sbd,s(r.id)); d=de(r)
  return {ok:true,kiemTra:tomTatKt(r,now),revision:Number(r.revision),daLuu,daChot:action==='hoc-tap-ktcn-chot-chang'||!!row.chot_luc||now>=Number(row.han)}
}

async function ketQuaKt(env: Env, r: Row, now: number) {
  const d=de(r), t=tra(r)
  await kiemNguon(env,s(r.sbd),d.cau)
  // Phần chữa tới SAU receipt nộp: không để hai dấu giờ cùng mili giây phủ nhận lượt tự làm vừa chốt.
  const xemLuc=Math.max(now,Number(r.nop_luc)+1)
  await env.DB.prepare('INSERT OR IGNORE INTO loi_giai_hoi(sbd,qid,luc) SELECT ?,value,? FROM json_each(?)').bind(r.sbd,new Date(xemLuc).toISOString(),JSON.stringify(d.cau.map(c=>c.q.qid))).run()
  const bang=new Map<string,{daKiem:boolean;dung:boolean}>()
  for (const c of d.cau) {
    if (!duTraKt(c.q.phan,t[c.q.qid]??'')) continue
    const dung=dungKt(c.q,t[c.q.qid]!)
    for (const id of c.muc) {
      const ys=Object.entries(c.y).filter(([y,ids])=>Number(y)>=0&&ids.includes(id)).map(([y])=>Number(y))
      const kq=c.q.phan==='II'&&ys.length?ys.every(i=>t[c.q.qid]![i]===c.q.correct[i]):dung
      const old=bang.get(id); bang.set(id,{daKiem:true,dung:(old?.dung??true)&&kq})
    }
  }
  const bai=[...new Set(d.muc.map(m=>m.bai))].map(id=>{const ms=d.muc.filter(m=>m.bai===id);return {ten:ms[0]!.tenBai,tong:ms.length,daKiem:ms.filter(m=>bang.has(m.id)).length,dungLanNay:ms.filter(m=>bang.get(m.id)?.dung).length}})
  return {bai,daGhiSo:Number(r.da_ghi)===1,cau:d.cau.map(c=>({de:publicQuestion(c.q),tra:t[c.q.qid]??'',dung:dungKt(c.q,t[c.q.qid]??''),dapAn:c.q.correct,loiGiai:c.q.solution})),chu:'Kết quả lần này; khả năng nhớ lâu được kiểm chứng tiếp trong lịch học.'}
}

export async function dongBoKtCn(env: Env, now: number, tran=2) {
  if (!await coKtCn(env)) return {soEm:0}
  await damBaoKtCn(env)
  if (await env.DB.prepare("SELECT 1 FROM ca WHERE trang_thai='mo' LIMIT 1").first()) return {soEm:0,hoan:true}
  // Lịch lập trước bản vá 13/10 chưa có số tính sẵn: bù dần, mỗi phút ≤ 10 dòng (hết dòng thiếu ⇒ một lượt đọc chỉ mục rỗng).
  await buMetaKt(env, 10)
  const het=await env.DB.prepare(`SELECT * FROM kiem_tra_ca_nhan WHERE trang_thai<>'cho_nguon' AND ((nop_luc IS NULL AND han_luc<=?) OR (nop_luc IS NOT NULL AND da_ghi=0)) ORDER BY han_luc LIMIT ?`).bind(now,tran).all<Row>()
  for (const r of het.results) await chotKtCn(env,r,now,true)
  // Làm mới phạm vi/đề trước ngày kiểm tra; ngày đã mở tuyệt đối không đổi N/nguồn.
  const moi=await env.DB.prepare("SELECT sbd FROM kiem_tra_ca_nhan WHERE ngay=? AND nop_luc IS NULL AND cap_nhat_luc<? LIMIT ?").bind(congNgayKt(ngayKt(now),1),dauNgayKt(ngayKt(now)),tran).all<Row>()
  for(const r of moi.results)await lapKtCn(env,s(r.sbd),now,true)
  const em=await env.DB.prepare(`SELECT h.sbd,${sqlTenLopHs('h')} lop FROM hoc_sinh h WHERE COALESCE(h.trang_thai,'')<>'khoa' AND EXISTS(SELECT 1 FROM bai_da_day b WHERE b.lop=${sqlTenLopHs('h')} AND b.bo_tick_luc IS NULL) AND NOT EXISTS(SELECT 1 FROM kiem_tra_ca_nhan k WHERE k.sbd=h.sbd AND k.lop=${sqlTenLopHs('h')} AND k.ngay>=? AND k.trang_thai<>'cho_nguon') AND NOT EXISTS(SELECT 1 FROM kiem_tra_ca_nhan_dieu_phoi n WHERE n.sbd=h.sbd AND n.lop=${sqlTenLopHs('h')} AND n.thu_luc>?) ORDER BY h.sbd LIMIT ?`).bind(ngayKt(now),now-6*3600000,tran).all<Row>()
  // Ghi lượt thử trước khi lập: một em tạm dừng/nguồn lỗi không chiếm mãi hai vị trí đầu hàng đợi.
  for (const r of em.results) {
    await env.DB.prepare(`INSERT INTO kiem_tra_ca_nhan_dieu_phoi(sbd,lop,thu_luc) VALUES(?,?,?) ON CONFLICT(sbd) DO UPDATE SET lop=excluded.lop,thu_luc=excluded.thu_luc,loi=''`).bind(r.sbd,r.lop,now).run()
    try { await lapKtCn(env,s(r.sbd),now) }
    catch { await env.DB.prepare("UPDATE kiem_tra_ca_nhan_dieu_phoi SET loi='Chưa lập được đề; sẽ thử lại' WHERE sbd=?").bind(r.sbd).run() }
  }
  return {soEm:em.results.length}
}
