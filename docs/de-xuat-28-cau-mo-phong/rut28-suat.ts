// Chạy MÃ ĐANG SỐNG (chonGoi7) trên một em giả, so với lõi đề xuất «đề 28 theo suất».
import { chonGoi7, type CauGoi7 } from '../../server/src/goi-bai-7-loi'
import { MA_TRAN_RUT_MOI, oMaTran } from '../../server/src/ma-tran-rut-moi'

const O = ['I|biet','I|hieu','I|van_dung','II|hieu','II|van_dung','III|hieu','III|van_dung'] as const
const SUAT: Record<string, number> = Object.fromEntries(O.map(o => { const [p,m] = o.split('|'); return [o, (MA_TRAN_RUT_MOI as any)[p][m]] }))
const tao = (tt: string, so: number[]) => O.flatMap((o, i) => Array.from({ length: so[i]! }, (_, k) => ({ qid: `${tt}-${o}-${k}`, o })))
// GIẢ ĐỊNH (không phải số thật): bài 112 câu lệch về Phần I Hiểu; em có 30 lỗi chờ sửa, 60 câu ôn đến hẹn — đa số Phần I.
const moi = tao('moi', [46, 26, 10, 8, 4, 8, 10]), sua = tao('sua', [14, 6, 2, 2, 1, 2, 3]), on = tao('on', [30, 10, 4, 4, 2, 5, 5])
// câu em ĐÃ làm ở 4 bài cũ, chưa tới hẹn ôn (kho «ôn sớm») — cùng tỉ lệ ô với bài
const som = tao('som', [184, 104, 40, 32, 16, 32, 40])
const oCua = new Map([...moi, ...sua, ...on, ...som].map(c => [c.qid, c.o]))
const cau: CauGoi7[] = moi.map(c => { const [p, m] = c.o.split('|'); return { qid: c.qid, maDe: 'B', version: '1', group: c.qid, phan: p as any, kho: false, tinhToan: false, kyNang: [], mucDo: m } })
if (cau.some(c => oMaTran(c.phan, c.mucDo) !== oCua.get(c.qid))) throw new Error('ô lệch')

const dem = (ids: string[]) => { const n: Record<string, number> = {}; for (const id of ids) n[oCua.get(id)!] = (n[oCua.get(id)!] ?? 0) + 1; return n }
const dungO = (n: Record<string, number>) => O.reduce((s, o) => s + Math.min(n[o] ?? 0, SUAT[o]!), 0)
const phan = (n: Record<string, number>) => ['I', 'II', 'III'].map(p => O.filter(o => o.startsWith(p + '|')).reduce((s, o) => s + (n[o] ?? 0), 0)).join('/')
const dong = (ten: string, ids: string[]) => { const n = dem(ids), ng = (t: string) => ids.filter(i => i.startsWith(t)).length
  console.log(`${ten.padEnd(22)} ${String(ids.length).padStart(2)} câu · phần ${phan(n).padEnd(8)} · đúng ô ${String(dungO(n)).padStart(2)}/28 · mới ${ng('moi')} sửa ${ng('sua')} ôn ${ng('on') + ng('som')} · ô ${O.map(o => n[o] ?? 0).join('·')}`) }

// ĐỀ XUẤT: một hàm cho mọi loại ngày. Ứng viên = (câu, ô, điểm); đúng ô trước, thiếu thì ô gần nhất CÙNG PHẦN trước.
const gia = (a: string, b: string) => { const [P, M] = a.split('|'), [p, m] = b.split('|'), B = ['biet', 'hieu', 'van_dung']; return (P === p ? 0 : 10) + Math.abs(B.indexOf(M!) - B.indexOf(m!)) }
function rut28(uv: { qid: string; o: string; diem: number }[], gap = false) {
  const con = new Map(O.map(o => [o as string, SUAT[o]!])), ra: string[] = [], dung = new Set<string>()
  const xep = [...uv].sort((a, b) => b.diem - a.diem), dinh = xep[0]?.diem ?? 0
  if (gap) {
    for (const u of xep) if (u.diem === dinh && (con.get(u.o) ?? 0) > 0) { con.set(u.o, con.get(u.o)! - 1); ra.push(u.qid); dung.add(u.qid) }
    for (const u of xep) { if (u.diem !== dinh || dung.has(u.qid)) continue; const o = [...con].filter(([k, n]) => n > 0 && k.split('|')[0] === u.o.split('|')[0]).sort((a, b) => gia(a[0], u.o) - gia(b[0], u.o))[0]; if (o) { con.set(o[0], o[1] - 1); ra.push(u.qid); dung.add(u.qid) } }
  }
  for (const u of xep) if (!dung.has(u.qid) && (con.get(u.o) ?? 0) > 0) { con.set(u.o, con.get(u.o)! - 1); ra.push(u.qid); dung.add(u.qid) }
  for (const [o, n0] of con) for (let n = n0; n > 0; n--) {
    const t = uv.filter(u => !dung.has(u.qid)).sort((a, b) => gia(o, a.o) - gia(o, b.o) || b.diem - a.diem)[0]
    if (!t) break
    ra.push(t.qid); dung.add(t.qid)
  }
  return ra
}

for (const che of ['HIỆN TẠI', 'ĐỀ XUẤT', 'ĐỀ XUẤT + KỊP HẠN'] as const) {
  console.log(`\n=== ${che} ===`)
  const daGap = new Set<string>(); let suaCon = sua.map(c => c.qid), onCon = on.map(c => c.qid), somCon = som.map(c => c.qid); let tongDung = 0, ngay = 0
  const lich = ['moi', 'moi', 'sua', 'moi', 'moi', 'sua', 'moi', 'moi', 'sua', 'moi', 'moi', 'moi']
  for (const loai of lich) {
    const moiCon = cau.filter(c => !daGap.has(c.qid))
    if (!moiCon.length && !suaCon.length) break
    let ids: string[]
    if (che === 'HIỆN TẠI') {
      const vao = (onSom?: string[]) => chonGoi7({ onSom, cau, daGap, daLamNgay: new Set(), quotaCon: 0, sanSang: new Set([...cau.map(c => c.qid), ...suaCon, ...onCon, ...somCon]), chan: new Set(), sua: suaCon, on: onCon,
        mucTieuNgay: 28, nhomPhu: [{ qids: cau.map(c => c.qid), quota: loai === 'sua' ? 0 : moiCon.length }], chiTrongMuc: true, ngay: `2026-11-${10 + ngay}`, loaiNgay: loai as any }).viec.map(v => v.qid)
      ids = vao(); if (ids.length < 28) ids = vao(somCon)
    } else {
      const d = loai === 'moi' ? { moi: 3, sua: 2, on: 1 } : { sua: 3, on: 2, moi: 1 }
      ids = rut28([...moiCon.map(c => ({ qid: c.qid, o: oCua.get(c.qid)!, diem: d.moi })), ...suaCon.map(q => ({ qid: q, o: oCua.get(q)!, diem: d.sua })), ...onCon.map(q => ({ qid: q, o: oCua.get(q)!, diem: d.on })), ...somCon.map(q => ({ qid: q, o: oCua.get(q)!, diem: 0 }))], che !== 'ĐỀ XUẤT' && loai === 'moi')
    }
    ngay++; tongDung += dungO(dem(ids))
    dong(`Ngày ${ngay} (${loai === 'moi' ? 'Học mới' : 'Sửa lỗi'})`, ids)
    for (const id of ids) if (id.startsWith('moi')) daGap.add(id)
    suaCon = suaCon.filter(q => !ids.includes(q)); onCon = onCon.filter(q => !ids.includes(q)); somCon = somCon.filter(q => !ids.includes(q))
  }
  console.log(`Tổng ${ngay} ngày: đúng ô ${tongDung}/${ngay * 28} = ${(100 * tongDung / (ngay * 28)).toFixed(1)} % · câu mới còn ${cau.filter(c => !daGap.has(c.qid)).length} · lỗi còn ${suaCon.length} · ôn còn ${onCon.length}`)
}
