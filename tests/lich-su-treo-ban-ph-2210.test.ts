// @vitest-environment node
// HỒ SƠ 6 MỨC — MÁY CHỦ (thầy duyệt bản vẽ docs/ban-ve-ho-so-em-2210 22/10, chốt 4 điểm như đề xuất). D1 THẬT (SQLite, lược đồ repo).
// Kiểm: trường mới `mucLam6` (7 ngày, theo ngày, đúng/sai lượt treo, bằng chứng Mức 6 CHỈ thầy) · `mucLam` cũ giữ nguyên cho máy PWA cũ ·
// học sinh/phụ huynh không bao giờ thấy 'co_tinh' · lượt vừa treo vừa đúng vẫn là "Máy để treo" · phụ huynh không có số phút treo ·
// hồ sơ thái độ: giây trung bình / phân bố giây bỏ lượt treo, số lượt và tín hiệu giữ nguyên.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import type { KetQuaLichSuLamCau } from '../server/src/lich-su-lam-cau-kieu'
import { lichSuLamCauCuaEm, mucLam6 } from '../server/src/lich-su-lam-cau'
import { lichSuLamCauBanHocSinh } from '../server/src/ho-so-em-hs'
import { banPhuHuynhLichSu } from '../server/src/ph-ho-so-con'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import { gvHoSoThaiDo } from '../server/src/bai-hang-ngay'
import type { KetQuaHoSoThaiDo } from '../server/src/bai-hang-ngay-kieu'

type D = ReturnType<typeof taoD1That>
const NOW = Date.parse('2026-10-21T05:00:00Z') // 12:00 Thứ Tư 21/10 giờ Việt Nam
let dem = 0
/** Một lượt game của S1 lúc `gio` (giờ VN) ngày `ngay`. `doc` = raw_json.doc; `treo` = số đo v/a/l (vắng ⇒ máy em cũ, chưa đo treo). */
const luot = (d: D, qid: string, ngay: string, gio: number, kq: 0 | 1, giay: number, treo?: { v: number; a: number; l: number } | null) => {
  const luc = new Date(Date.parse(`${ngay}T00:00:00+07:00`) + gio * 3_600_000 + dem * 60_000).toISOString()
  const doc = { t: 20, h: 0, p: 'I', dh: 1, ...(treo ? treo : {}) }
  d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, raw_json) VALUES (?, 'S1', ?, 'game', 'P1', 1, ?, ?, ?, ?, ?)`)
    .run(`t${dem++}`, qid, kq, giay, luc, ngay, JSON.stringify({ doc }))
}
const HUNG = { v: 640, a: 0, l: 600 } // lặng 10 phút ⇒ Treo máy
const SACH = { v: 40, a: 0, l: 20 } // có số đo, không treo

function duLieu() {
  const d = taoD1That()
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', 'Trần An', '2009', '12', 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', 'Trần An', '12', '12 - Tinh Hoa', 'x')
  // 20/10: 3 lượt treo ⇒ Mức 6 (thầy) · 2 sai, 1 đúng
  luot(d, 'T-I-1', '2026-10-20', 9, 0, 185, HUNG)
  luot(d, 'T-I-2', '2026-10-20', 10, 0, 185, HUNG)
  luot(d, 'T-I-3', '2026-10-20', 11, 1, 185, HUNG)
  // 21/10: 1 lượt treo ĐÚNG ở Mức 1 theo giây (8 giây < T_đọc 15) · 1 lượt sạch sai Mức 2 · 1 lượt máy cũ (chưa đo treo) sai Mức 1
  luot(d, 'T-I-4', '2026-10-21', 8, 1, 8, HUNG)
  luot(d, 'T-I-5', '2026-10-21', 9, 0, 18, SACH)
  luot(d, 'T-I-6', '2026-10-21', 10, 0, 10, null)
  // 10/10: ngoài 7 ngày ⇒ chỉ vào "toàn bộ"
  luot(d, 'T-I-7', '2026-10-10', 9, 0, 10, SACH)
  return d
}

describe('mucLam6 — thầy', () => {
  it('7 ngày (15/10 – 21/10) cũ → mới; Mức 6 từ 3 lượt treo cùng ngày; bốn dòng Mức 1–4 KHÔNG gồm lượt treo; bằng chứng ngày 20/10', async () => {
    const r = (await lichSuLamCauCuaEm(duLieu().env as unknown as Env, 'S1', undefined, 'thay', NOW)) as KetQuaLichSuLamCau
    const m = r.mucLam6!
    expect([m.tu, m.den]).toEqual(['2026-10-15', '2026-10-21'])
    expect(m.theoNgay.map((n) => n.ngay)).toEqual(['2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21'])
    expect(m.theoNgay[5]).toEqual({ ngay: '2026-10-20', dem: [0, 0, 0, 0, 0, 3], chuaCoSoDo: 0, soChuaDoTreo: 0 })
    expect(m.theoNgay[6]).toEqual({ ngay: '2026-10-21', dem: [1, 1, 0, 0, 1, 0], chuaCoSoDo: 0, soChuaDoTreo: 1 })
    expect(m.bay).toMatchObject({ soDo: 6, soTreo: 1, soCoTinh: 3, soChuaDoTreo: 1 })
    expect(m.bay.theoMuc.map((x) => x.luot)).toEqual([1, 1, 0, 0]) // lượt treo tách khỏi bốn dòng
    expect(m.toanBo).toMatchObject({ soDo: 7, soCoTinh: 3, soTreo: 1 })
    expect(m.treoDungSai).toEqual({ treo: { dung: 1, sai: 0 }, coTinh: { dung: 1, sai: 2 } })
    expect(m.ngayCoTinh).toHaveLength(1)
    expect(m.ngayCoTinh![0]).toMatchObject({ ngay: '2026-10-20', so: 3 })
    expect(m.ngayCoTinh![0]!.luot.map((l) => l.giayTreo)).toEqual([600, 600, 600])
    expect(m.ngayCoTinh![0]!.luot[0]!.luc < m.ngayCoTinh![0]!.luot[2]!.luc).toBe(true) // cũ → mới trong ngày
  })
  it('`mucLam` CŨ giữ nguyên (không tách treo — bốn dòng cộng = soDo) cho máy PWA chưa cập nhật', async () => {
    const r = (await lichSuLamCauCuaEm(duLieu().env as unknown as Env, 'S1', undefined, 'thay', NOW)) as KetQuaLichSuLamCau
    expect(r.mucLam!.theoMuc.reduce((t, x) => t + x.luot, 0)).toBe(r.mucLam!.soDo)
  })
})

describe('học sinh / phụ huynh — không bao giờ có Mức 6; phụ huynh không có số phút treo', () => {
  it('học sinh: Mức 6 hạ về 5 khắp nơi; lượt vừa treo vừa ĐÚNG ở Mức 1 vẫn mang "treo"; không bằng chứng', async () => {
    const r = (await lichSuLamCauBanHocSinh(duLieu().env as unknown as Env, 'S1', undefined)) as KetQuaLichSuLamCau
    expect(JSON.stringify(r)).not.toContain('co_tinh')
    expect(r.mucLam6!.ngayCoTinh).toBeUndefined()
    expect(r.mucLam6!.bay).toMatchObject({ soTreo: 4, soCoTinh: 0 })
    const dungTreo = r.lan.filter((l) => l.dung === true && l.mucLam?.treo === 'treo')
    expect(dungTreo.length).toBe(2) // T-I-3 (20/10) và T-I-4 (21/10, Mức 1 theo giây)
    expect(dungTreo.every((l) => typeof l.mucLam!.giayTreo === 'number')).toBe(true) // học sinh có số phút
  })
  it('phụ huynh: bỏ `giayTreo` từng lượt, GIỮ `treo: "treo"` (không rơi về Mức 1–4)', async () => {
    const r = banPhuHuynhLichSu(await lichSuLamCauBanHocSinh(duLieu().env as unknown as Env, 'S1', undefined)) as KetQuaLichSuLamCau
    expect(JSON.stringify(r)).not.toMatch(/giayTreo|co_tinh/)
    expect(r.lan.filter((l) => l.mucLam?.treo === 'treo')).toHaveLength(4)
    expect(r.lan.find((l) => l.giay === 18)?.mucLam?.daDoTreo).toBe(true) // bản học sinh đổi mã câu ⇒ tìm theo giây
  })
  it('hàm thuần: tập rỗng ⇒ 7 hàng số 0, không bằng chứng cho học sinh', () => {
    const m = mucLam6([], NOW, false)
    expect(m.theoNgay).toHaveLength(7)
    expect(m.theoNgay.every((n) => n.dem.every((x) => x === 0))).toBe(true)
    expect('ngayCoTinh' in m).toBe(false)
  })
})

describe('hồ sơ thái độ — giây bỏ lượt treo, số lượt và tín hiệu giữ nguyên', () => {
  it('giây trung bình / trung vị / phân bố giây chỉ tính lượt KHÔNG treo; soLuot vẫn đếm cả lượt treo', async () => {
    const d = taoD1That()
    for (const q of [...SQL_BANG_HANH_TRINH, ...SQL_GOI7]) d.sql.exec(q)
    d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', 'Trần An', '2009', '12', 'x')
    d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', 'Trần An', '12', '12 - Tinh Hoa', 'x')
    d.sql.prepare("INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, tao_luc, trang_thai) VALUES ('hanh-trinh-v3-khoi-12','HT','Khối 12','[\"S1\"]','[]','[]','9999-12-31','2026-10-01T00:00:00Z','dang_chay')").run()
    d.sql.prepare("INSERT INTO srs2_ke_hoach (sbd, ngay, chien_dich_id, dao_json, doan_json, tong, tao_luc) VALUES ('S1','2026-10-21','hanh-trinh-v3-khoi-12',?, '[]', 2, 'x')").run(JSON.stringify(['T-I-1', 'T-I-2']))
    luot(d, 'T-I-1', '2026-10-21', 8, 0, 20, SACH)
    luot(d, 'T-I-2', '2026-10-21', 9, 0, 185, HUNG)
    const r = (await gvHoSoThaiDo(d.env as unknown as Env, { sbd: 'S1', tu: '2026-10-21' }, NOW)) as KetQuaHoSoThaiDo
    expect(r.ok).toBe(true)
    expect(r.dem).toMatchObject({ soLuot: 2, giayTb: 20, giayTrungVi: 20, soLuotCoGiay: 1 })
    expect(r.phanBoGiay.reduce((t, n) => t + n.soLuot, 0)).toBe(1)
  })
})
