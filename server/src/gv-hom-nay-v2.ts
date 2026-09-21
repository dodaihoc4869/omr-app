// MÀN "HÔM NAY" CỦA THẦY, BẢN 2 — năm lệnh ĐỌC-CHỈ (docs/hop-dong-hom-nay-v2-2109.md, Code 3 ↔ Code 4, 21/09/2026):
//   /gv/tim-em · /gv/chua-nop · /gv/can-giup · /gv/vinh-danh-ngay · /gv/em-toan-canh (lệnh GHI /gv/canh-bao-nop-bai nằm ở canh-bao-thay.ts).
// Mọi lệnh: sau cổng `laThay`, KHÔNG ghi một byte, ≤ 12 truy vấn D1 (đo bằng `soTruyVan`, test khoá). Mọi con số truy được về một dòng D1; chỗ chưa có dữ liệu VẮNG KHOÁ (không bịa).
// Không kết luận năng lực từ điểm; không chữ "nắm chắc". Lỗi đọc một khối ⇒ khối ấy trống/vắng, lệnh vẫn trả `ok`.
import type { Env } from './kieu'
import { PETS } from '../../src/game/than-thu-v2/core'
import { trangThaiNopBai, ngayVnCuaMs } from './canh-bao-thay'
import { dangYeu, themNgay, type NamKtDang } from './ho-so-nam-kt'
import { demChuoiDat } from './ke-hoach-ngay'
import { phanTichNgayNghi } from './ke-hoach-ngay-d1'
import { NGUONG_TRE_NHIP_NGAY, NGUONG_TUT_BAC_CAU, SO_NGAY_TUT_BAC } from './hom-nay-thay'
import { docCauHinh, lanChayKe, nhacKeCuaEm } from './nhac-tu-dong'

type Dong = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const so = (v: unknown): number => Number(v) || 0
const json = (v: unknown): string => JSON.stringify(v)
const MOT_NGAY_MS = 86_400_000
const GIO_VN_MS = 7 * 3_600_000
const DANG_NGAY = /^\d{4}-\d{2}-\d{2}$/

export const TOI_DA_GOI_Y = 10
export const TOI_DA_EM_CAN_GIUP = 60
export const TOI_DA_DONG_MOT_TRANG = 30
/** Xu hướng 7 ngày: chênh tỉ lệ đúng ≥ ngần này điểm % thì `tang` / `giam`; mỗi kỳ phải có ≥ 2 câu. */
export const NGUONG_XU_HUONG_DIEM = 15
export const SO_CAU_TOI_THIEU_XU_HUONG = 2

/** Đếm truy vấn; lỗi ⇒ `null` (khối phụ thuộc vắng), KHÔNG ném. */
function boDem(env: Env) {
  let n = 0
  return {
    dem: () => n,
    async hoi(sql: string, ...bind: unknown[]): Promise<Dong[] | null> {
      n++
      try {
        return ((await env.DB.prepare(sql).bind(...bind).all<Dong>()).results ?? []) as Dong[]
      } catch (e) {
        console.error('[gv-hom-nay-v2] truy vấn lỗi (khối liên quan vắng):', e instanceof Error ? e.message : e, sql.replace(/\s+/g, ' ').slice(0, 80))
        return null
      }
    },
  }
}

const homNayVn = (nowMs: number): string => ngayVnCuaMs(nowMs)
const dauNgayVnIso = (ngay: string): string => new Date(Date.parse(`${ngay}T00:00:00Z`) - GIO_VN_MS).toISOString()
const soNgay = (ngay: string): number => Math.floor(Date.parse(`${ngay}T00:00:00Z`) / MOT_NGAY_MS)

/** Bỏ dấu tiếng Việt, hạ chữ thường, `đ` → `d`, gộp khoảng trắng. */
export function khongDau(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().replace(/\s+/g, ' ').trim()
}

const BAC_CHU = ['biet', 'hieu', 'van_dung'] as const
const bacChu = (b: unknown): (typeof BAC_CHU)[number] => BAC_CHU[Math.max(0, Math.min(2, so(b)))]!

/** Chênh tỉ lệ đúng 7 ngày qua so với 7 ngày trước. Thiếu câu ở một kỳ ⇒ `undefined` (không bịa xu hướng). */
export function xuHuong7(nMoi: number, dMoi: number, nCu: number, dCu: number): 'tang' | 'giam' | 'giu' | undefined {
  if (nMoi < SO_CAU_TOI_THIEU_XU_HUONG || nCu < SO_CAU_TOI_THIEU_XU_HUONG) return undefined
  const chenh = (dMoi / nMoi - dCu / nCu) * 100
  return chenh >= NGUONG_XU_HUONG_DIEM ? 'tang' : chenh <= -NGUONG_XU_HUONG_DIEM ? 'giam' : 'giu'
}

/** Học sinh + danh sách lớp (hoc_sinh ưu tiên, danh_sach bổ sung). Một truy vấn. */
async function docEm(Q: ReturnType<typeof boDem>): Promise<Map<string, { hoTen: string; lop: string }> | null> {
  const r = await Q.hoi("SELECT sbd, ho_ten, lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, 0 AS uu FROM danh_sach")
  if (!r) return null
  const em = new Map<string, { hoTen: string; lop: string }>()
  for (const x of [...r].sort((a, b) => so(b.uu) - so(a.uu))) {
    const sbd = chuoi(x.sbd)
    if (!sbd) continue
    const cu = em.get(sbd)
    em.set(sbd, { hoTen: chuoi(x.ho_ten) || cu?.hoTen || '', lop: chuoi(x.lop) || cu?.lop || '' })
  }
  return em
}

// ================================================================== /gv/tim-em ==================================================================

/** `POST /gv/tim-em {q}` — gợi ý ≤ 10: gõ tên (không dấu cũng ra) hoặc số báo danh. SBD trùng/đứng đầu trước, rồi tên bắt đầu bằng, rồi có chứa. */
export async function gvTimEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const q = khongDau(chuoi(b.q))
  if (q.length > 60) return { ok: false, error: 'Từ khoá tối đa 60 ký tự' }
  if (!q) return { ok: true, ds: [], soTruyVan: 0 }
  const Q = boDem(env)
  const em = await docEm(Q)
  if (!em) return { ok: false, error: 'Không đọc được danh sách học sinh', soTruyVan: Q.dem() }
  const ket: { sbd: string; hoTen: string; lop: string; diem: number }[] = []
  for (const [sbd, e] of em) {
    const s = khongDau(sbd)
    const ten = khongDau(e.hoTen)
    const tu = ten.split(' ')
    let diem = -1
    if (s === q) diem = 0
    else if (s.startsWith(q)) diem = 1
    else if (ten.startsWith(q)) diem = 2
    else if (tu.some((t) => t.startsWith(q))) diem = 3
    else if (ten.includes(q)) diem = 4
    else if (s.includes(q)) diem = 5
    if (diem >= 0) ket.push({ sbd, hoTen: e.hoTen, lop: e.lop, diem })
  }
  ket.sort((a, c) => a.diem - c.diem || a.hoTen.localeCompare(c.hoTen, 'vi') || (a.sbd < c.sbd ? -1 : 1))
  return { ok: true, ds: ket.slice(0, TOI_DA_GOI_Y).map(({ sbd, hoTen, lop }) => ({ sbd, hoTen, lop })), soTruyVan: Q.dem() }
}

// ================================================================== /gv/chua-nop ==================================================================

/** Bài quá hạn quá ngần này ngày thì không còn là "việc gấp". */
const NGAY_QUA_HAN_HIEN = 3

/**
 * `POST /gv/chua-nop {ngay?, lop?}` — bài ĐANG CHẠY còn em chưa nộp (chưa xoá, đã giao tới hết `ngay`, hạn chưa quá 3 ngày) kèm trạng thái THẬT từng em
 * và cảnh báo thầy đã gửi. `nowMs` để test tiêm giờ.
 */
export async function gvChuaNop(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Record<string, unknown>> {
  const ngayXin = chuoi(b.ngay)
  if (ngayXin && !DANG_NGAY.test(ngayXin)) return { ok: false, error: 'Ngày phải có dạng YYYY-MM-DD.' }
  const ngay = ngayXin || homNayVn(nowMs)
  const lopLoc = chuoi(b.lop)
  const cuoiNgayMs = Date.parse(dauNgayVnIso(themNgay(ngay, 1)))
  const mocNow = Math.min(nowMs, cuoiNgayMs - 1) // xem "như lúc cuối ngày ấy" khi hỏi ngày đã qua
  const Q = boDem(env)

  const rb = await Q.hoi(
    `SELECT ma_btvn, ma_ca, ma_de, giao_luc, han_nop, ca_nhan FROM btvn WHERE da_xoa = 0 AND giao_luc < ? AND han_nop >= ? ORDER BY han_nop, ma_btvn LIMIT 60`,
    new Date(cuoiNgayMs).toISOString(), new Date(mocNow - NGAY_QUA_HAN_HIEN * MOT_NGAY_MS).toISOString(),
  ).then((r) => r ?? Q.hoi('SELECT ma_btvn, ma_ca, ma_de, giao_luc, han_nop, 0 AS ca_nhan FROM btvn WHERE da_xoa = 0 AND giao_luc < ? AND han_nop >= ? ORDER BY han_nop, ma_btvn LIMIT 60',
    new Date(cuoiNgayMs).toISOString(), new Date(mocNow - NGAY_QUA_HAN_HIEN * MOT_NGAY_MS).toISOString()))
  if (!rb) return { ok: false, error: 'Không đọc được bài tập đang giao', soTruyVan: Q.dem() }
  if (rb.length === 0) return { ok: true, ngay, bai: [], soTruyVan: Q.dem() }
  const dsMa = rb.map((x) => chuoi(x.ma_btvn))

  const re = await Q.hoi(
    `SELECT ma_btvn, sbd, ho_ten, nop_luc, thu_hoi, substr(COALESCE(dap_an_json, ''), 1, 4) AS dap_an_json, xong_vong1_luc, lo_da_xong, so_chang, chot_luc
       FROM btvn_em WHERE ma_btvn IN (SELECT value FROM json_each(?)) AND thu_hoi = 0`,
    json(dsMa),
  ) ?? []
  const em = (await docEm(Q)) ?? new Map<string, { hoTen: string; lop: string }>()
  const rc = await Q.hoi(
    `SELECT id, ma_btvn, sbd, gui_luc, em_xem_luc, ph_xem_luc, moc, gui_ph FROM canh_bao_thay WHERE ma_btvn IN (SELECT value FROM json_each(?)) ORDER BY gui_luc`,
    json(dsMa),
  ) // bảng chưa có ⇒ null ⇒ không ai có cảnh báo
  const canhBao = new Map<string, Dong>() // `${ma}|${sbd}` → cảnh báo MỚI NHẤT (tay hoặc tự động)
  const daNhacTheo = new Map<string, Dong[]>() // `${ma}|${sbd}` → các lần NHẮC TỰ ĐỘNG (mốc M1..M4), mới nhất trước
  for (const x of rc ?? []) {
    const k = `${chuoi(x.ma_btvn)}|${chuoi(x.sbd)}`
    canhBao.set(k, x)
    if (/^M[1-4]$/.test(chuoi(x.moc))) daNhacTheo.set(k, [x, ...(daNhacTheo.get(k) ?? [])])
  }
  // NHẮC TỰ ĐỘNG: cờ + lượt chạy kế + số tin HÔM NAY (đếm trong D1, toàn trường — không chỉ các em đang hiện).
  const cfg = await docCauHinh(env)
  const rHomNay = await Q.hoi("SELECT COUNT(DISTINCT sbd) AS em, COUNT(DISTINCT ph_nhom) AS ph FROM canh_bao_thay WHERE ngay = ? AND moc <> 'tay'", ngay)

  const theoBai = new Map<string, Dong[]>()
  for (const x of re) theoBai.set(chuoi(x.ma_btvn), [...(theoBai.get(chuoi(x.ma_btvn)) ?? []), x])

  const bai = []
  for (const bt of rb) {
    const ma = chuoi(bt.ma_btvn)
    const hanNop = chuoi(bt.han_nop)
    const dsEm = (theoBai.get(ma) ?? []).filter((x) => !lopLoc || (em.get(chuoi(x.sbd))?.lop ?? '') === lopLoc)
    const chuaNop = dsEm.filter((x) => chuoi(x.nop_luc) === '')
    if (chuaNop.length === 0) continue
    const lopCuaBai = new Map<string, number>()
    for (const x of dsEm) lopCuaBai.set(em.get(chuoi(x.sbd))?.lop ?? '', (lopCuaBai.get(em.get(chuoi(x.sbd))?.lop ?? '') ?? 0) + 1)
    const lopChinh = [...lopCuaBai].sort((a, c) => c[1] - a[1] || (a[0] < c[0] ? -1 : 1))[0]?.[0] ?? ''
    const dsHienThi = chuaNop.map((x) => {
      const sbd = chuoi(x.sbd)
      const st = trangThaiNopBai(x, hanNop, mocNow)
      const cb = canhBao.get(`${ma}|${sbd}`)
      const daNhac = (daNhacTheo.get(`${ma}|${sbd}`) ?? []).map((n) => ({ moc: chuoi(n.moc), luc: chuoi(n.gui_luc), emDaXem: chuoi(n.em_xem_luc) !== '', phDaXem: so(n.gui_ph) === 1 ? chuoi(n.ph_xem_luc) !== '' : null }))
      const ke = nhacKeCuaEm({ hanIso: hanNop, nowMs: mocNow, chuaMo: st.trangThai === 'chua_mo', daCoMoc: new Set(daNhac.map((n) => n.moc)), cfg })
      return {
        sbd, hoTen: chuoi(x.ho_ten) || em.get(sbd)?.hoTen || '', lop: em.get(sbd)?.lop ?? '',
        trangThai: st.trangThai, nhan: st.nhan,
        ...(st.chang ? { chang: { daXong: st.chang.daXong, tong: st.chang.tong } } : {}),
        soNgayQuaHan: st.soNgayQuaHan,
        ...(cb ? { canhBao: { id: chuoi(cb.id), luc: chuoi(cb.gui_luc), emDaXem: chuoi(cb.em_xem_luc) !== '', phuHuynhDaXem: chuoi(cb.ph_xem_luc) !== '' } } : {}),
        ...(daNhac.length > 0 ? { daNhac } : {}),
        ...(ke ? { nhacKe: ke } : {}),
      }
    })
    const thuTu = { qua_han: 0, chua_mo: 1, do_chang: 2 } as const
    dsHienThi.sort((a, c) => thuTu[a.trangThai] - thuTu[c.trangThai] || c.soNgayQuaHan - a.soNgayQuaHan || (a.sbd < c.sbd ? -1 : 1))
    bai.push({
      maBtvn: ma, maCa: chuoi(bt.ma_ca), maDe: chuoi(bt.ma_de), lop: lopChinh, caNhan: so(bt.ca_nhan) === 1, giaoLuc: chuoi(bt.giao_luc), hanNop,
      tong: dsEm.length, daNop: dsEm.length - chuaNop.length, chuaNop: chuaNop.length, quaHan: Date.parse(hanNop) > 0 && mocNow > Date.parse(hanNop), em: dsHienThi,
    })
  }
  bai.sort((a, c) => (a.hanNop < c.hanNop ? -1 : a.hanNop > c.hanNop ? 1 : a.maBtvn < c.maBtvn ? -1 : 1))
  return {
    ok: true, ngay, bai,
    tuDong: { bat: cfg.bat, gioTu: cfg.gioTu, gioDen: cfg.gioDen, ...(cfg.bat ? { lanKe: lanChayKe(nowMs, cfg) } : {}) },
    ...(rHomNay ? { homNay: { soEm: so(rHomNay[0]?.em), soPhuHuynh: so(rHomNay[0]?.ph) } } : {}),
    soTruyVan: Q.dem(),
  }
}

// ================================================================== /gv/can-giup ==================================================================

/**
 * `POST /gv/can-giup {ngay?, lop?}` — em cần thầy giúp: trễ nhịp ≥ 3 ngày (trừ ngày nghỉ) · tụt bậc ≥ 3 câu trong 3 ngày · có dạng yếu theo `dangYeu` của hồ sơ.
 * Cùng tiêu chí và hằng số với `hom-nay-thay.ts` (một nguồn). Chi tiết dạng: sai x / gặp y câu, bậc, xu hướng 7 ngày.
 */
export async function gvCanGiup(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Record<string, unknown>> {
  const ngayXin = chuoi(b.ngay)
  if (ngayXin && !DANG_NGAY.test(ngayXin)) return { ok: false, error: 'Ngày phải có dạng YYYY-MM-DD.' }
  const ngay = ngayXin || homNayVn(nowMs)
  const lopLoc = chuoi(b.lop)
  const Q = boDem(env)
  const em = await docEm(Q)
  if (!em) return { ok: false, error: 'Không đọc được danh sách học sinh', soTruyVan: Q.dem() }
  const cfg = await Q.hoi("SELECT gia_tri FROM cau_hinh WHERE khoa = 'ngay_nghi'")
  const nghi = phanTichNgayNghi(chuoi(cfg?.[0]?.gia_tri))

  const truoc = themNgay(ngay, -(SO_NGAY_TUT_BAC - 1))
  const rDang = await Q.hoi('SELECT sbd, ma_dang, so_gap, so_sai, so_da_khac_phuc, so_moi_sai, so_chua_thay_sai, bac, moc_on_ke, moc_moi_sai FROM nam_kt_dang')
  const rCuoi = await Q.hoi('SELECT sbd, MAX(ngay_vn) AS cuoi FROM su_kien_hoc GROUP BY sbd')
  const rTut = await Q.hoi('SELECT sbd, SUM(so_cau_tut_bac) AS tut FROM ke_hoach_ngay WHERE ngay >= ? AND ngay <= ? GROUP BY sbd', truoc, ngay)

  const yeu = new Map<string, { ma: string; soGap: number; soSai: number; bac: number }[]>()
  for (const x of rDang ?? []) {
    const d: NamKtDang = {
      sbd: chuoi(x.sbd), maDang: chuoi(x.ma_dang), soGap: so(x.so_gap), soSai: so(x.so_sai), soDaKhacPhuc: so(x.so_da_khac_phuc), soMoiSai: so(x.so_moi_sai),
      soChuaThaySai: so(x.so_chua_thay_sai), bac: so(x.bac), mocOnKe: x.moc_on_ke ? chuoi(x.moc_on_ke) : null, mocMoiSai: x.moc_moi_sai ? chuoi(x.moc_moi_sai) : null,
    } as NamKtDang
    if (!em.has(d.sbd) || !dangYeu(d, ngay)) continue
    yeu.set(d.sbd, [...(yeu.get(d.sbd) ?? []), { ma: d.maDang, soGap: d.soGap, soSai: d.soSai, bac: d.bac }])
  }
  const tre = new Map<string, number>() // ngày trễ nhịp, trừ ngày nghỉ
  for (const x of rCuoi ?? []) {
    const cuoi = chuoi(x.cuoi)
    if (!DANG_NGAY.test(cuoi)) continue
    let n = 0
    for (let d = soNgay(cuoi) + 1; d <= soNgay(ngay); d++) if (!nghi.has(new Date(d * MOT_NGAY_MS).toISOString().slice(0, 10))) n++
    if (n >= NGUONG_TRE_NHIP_NGAY) tre.set(chuoi(x.sbd), n)
  }
  const tut = new Map<string, number>()
  for (const x of rTut ?? []) if (so(x.tut) >= NGUONG_TUT_BAC_CAU) tut.set(chuoi(x.sbd), so(x.tut))

  type CanGiup = { sbd: string; hoTen: string; lop: string; lyDo: 'tre_nhip' | 'tut_bac' | 'dang_yeu'; ngayTre?: number; nhieuLyDo: number; soSaiTong: number; dang: { ma: string; ten: string; sai: number; gap: number; bac: (typeof BAC_CHU)[number]; xuHuong?: 'tang' | 'giam' | 'giu' }[] }
  const ds: CanGiup[] = []
  for (const [sbd, e] of em) {
    const co = { tre: tre.has(sbd), tut: tut.has(sbd), yeu: (yeu.get(sbd) ?? []).length > 0 }
    const nhieu = Number(co.tre) + Number(co.tut) + Number(co.yeu)
    if (nhieu === 0) continue
    const dangEm = [...(yeu.get(sbd) ?? [])].sort((a, c) => c.soSai - a.soSai || (a.ma < c.ma ? -1 : 1))
    ds.push({
      sbd, hoTen: e.hoTen, lop: e.lop, lyDo: co.tre ? 'tre_nhip' : co.tut ? 'tut_bac' : 'dang_yeu', ...(co.tre ? { ngayTre: tre.get(sbd)! } : {}), nhieuLyDo: nhieu,
      soSaiTong: dangEm.reduce((s, d) => s + d.soSai, 0), dang: dangEm.slice(0, 4).map((d) => ({ ma: d.ma, ten: d.ma, sai: d.soSai, gap: d.soGap, bac: bacChu(d.bac) })),
    })
  }
  ds.sort((a, c) => c.nhieuLyDo - a.nhieuLyDo || ({ tre_nhip: 0, tut_bac: 1, dang_yeu: 2 }[a.lyDo] - { tre_nhip: 0, tut_bac: 1, dang_yeu: 2 }[c.lyDo]) || c.soSaiTong - a.soSaiTong || (a.sbd < c.sbd ? -1 : 1))
  const lop = [...new Set(ds.map((x) => x.lop).filter(Boolean))].sort((a, c) => a.localeCompare(c, 'vi'))
  const loc = ds.filter((x) => !lopLoc || x.lop === lopLoc)
  const cat = loc.slice(0, TOI_DA_EM_CAN_GIUP)

  // Tên dạng + xu hướng 7 ngày của các dạng hiển thị (2 truy vấn, chỉ cho em/dạng thật sự hiện).
  const dsSbd = [...new Set(cat.map((x) => x.sbd))]
  const dsMa = [...new Set(cat.flatMap((x) => x.dang.map((d) => d.ma)))]
  if (dsMa.length > 0) {
    const d7 = themNgay(ngay, -6)
    const d14 = themNgay(ngay, -13)
    const rTen = await Q.hoi("SELECT dang AS ma, MIN(json_extract(json, '$.tenDang')) AS ten FROM game_v2_question WHERE dang IN (SELECT value FROM json_each(?)) GROUP BY dang", json(dsMa))
    const ten = new Map((rTen ?? []).filter((x) => chuoi(x.ten)).map((x) => [chuoi(x.ma), chuoi(x.ten)]))
    const rXh = await Q.hoi(
      `SELECT sbd, ma_dang,
              SUM(CASE WHEN ngay_vn >= ? THEN 1 ELSE 0 END) AS n_moi, SUM(CASE WHEN ngay_vn >= ? AND ket_qua = 1 THEN 1 ELSE 0 END) AS d_moi,
              SUM(CASE WHEN ngay_vn < ? THEN 1 ELSE 0 END) AS n_cu, SUM(CASE WHEN ngay_vn < ? AND ket_qua = 1 THEN 1 ELSE 0 END) AS d_cu
         FROM su_kien_hoc WHERE ngay_vn >= ? AND ngay_vn <= ? AND sbd IN (SELECT value FROM json_each(?)) AND ma_dang IN (SELECT value FROM json_each(?)) GROUP BY sbd, ma_dang`,
      d7, d7, d7, d7, d14, ngay, json(dsSbd), json(dsMa),
    )
    const xh = new Map((rXh ?? []).map((x) => [`${chuoi(x.sbd)}|${chuoi(x.ma_dang)}`, xuHuong7(so(x.n_moi), so(x.d_moi), so(x.n_cu), so(x.d_cu))]))
    for (const e of cat) for (const d of e.dang) {
      d.ten = ten.get(d.ma) ?? d.ma.replace(/^CD:/, '')
      const h = xh.get(`${e.sbd}|${d.ma}`)
      if (h) d.xuHuong = h
    }
  }
  return {
    ok: true, ngay, tong: loc.length, lop,
    ds: cat.map(({ sbd, hoTen, lop: l, lyDo, ngayTre, dang }) => ({ sbd, hoTen, lop: l, lyDo, ...(ngayTre !== undefined ? { ngayTre } : {}), dang })),
    soTruyVan: Q.dem(),
  }
}

// ================================================================== /gv/vinh-danh-ngay ==================================================================

/**
 * `POST /gv/vinh-danh-ngay {ngay?}` — một em mỗi bục, CHỈ khi có số > 0: chăm nhất (EXP trong ngày), tiến bộ nhất (câu sai trước nay làm đúng lại + lần lên bậc trong 7 ngày),
 * bền bỉ nhất (chuỗi ngày đạt), điểm cao của ca gần nhất nộp trong ngày. Không có dữ liệu ⇒ khoá vắng.
 */
export async function gvVinhDanhNgay(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Record<string, unknown>> {
  const ngayXin = chuoi(b.ngay)
  if (ngayXin && !DANG_NGAY.test(ngayXin)) return { ok: false, error: 'Ngày phải có dạng YYYY-MM-DD.' }
  const ngay = ngayXin || homNayVn(nowMs)
  const Q = boDem(env)
  const d7 = themNgay(ngay, -6)
  const dauNgay = dauNgayVnIso(ngay)
  const cuoiNgay = dauNgayVnIso(themNgay(ngay, 1))

  const rExp = await Q.hoi('SELECT sbd, SUM(exp) AS exp FROM exp_so WHERE ngay_vn = ? GROUP BY sbd HAVING SUM(exp) > 0 ORDER BY SUM(exp) DESC, sbd LIMIT 1', ngay)
  const rDung = await Q.hoi(
    `SELECT sbd, COUNT(*) AS dung_lai FROM nam_kt_cau WHERE trang_thai = 'da_khac_phuc' AND substr(COALESCE(luc_cuoi, ''), 1, 10) >= ? AND substr(COALESCE(luc_cuoi, ''), 1, 10) <= ? GROUP BY sbd`,
    d7, ngay,
  )
  const rLen = await Q.hoi('SELECT sbd, SUM(so_cau_len_bac) AS len FROM ke_hoach_ngay WHERE ngay >= ? AND ngay <= ? GROUP BY sbd', d7, ngay)
  const rKh = await Q.hoi('SELECT sbd, ngay, ket_qua, la_ngay_nghi FROM ke_hoach_ngay WHERE ngay >= ? AND ngay <= ? ORDER BY sbd, ngay DESC', themNgay(ngay, -60), ngay)
  const rDiem = await Q.hoi(
    `SELECT l.ma_ca, l.sbd, l.tong, l.nop_luc, COALESCE(c.ten_ca, '') AS ten_ca FROM luot l LEFT JOIN ca c ON c.ma_ca = l.ma_ca
      WHERE l.nop_luc >= ? AND l.nop_luc < ? AND l.tong IS NOT NULL AND l.ma_ca NOT LIKE 'BTVN%' ORDER BY l.nop_luc DESC LIMIT 400`,
    dauNgay, cuoiNgay,
  )

  // Tiến bộ nhất: nhiều câu làm đúng lại nhất; hoà thì nhiều lần lên bậc hơn; hoà nữa thì SBD nhỏ.
  const len = new Map((rLen ?? []).map((x) => [chuoi(x.sbd), so(x.len)]))
  const dungLai = new Map((rDung ?? []).map((x) => [chuoi(x.sbd), so(x.dung_lai)]))
  const tienBo = [...new Set([...len.keys(), ...dungLai.keys()])]
    .map((sbd) => ({ sbd, soCauDungLai: dungLai.get(sbd) ?? 0, soDangLenBac: len.get(sbd) ?? 0 }))
    .filter((x) => x.soCauDungLai + x.soDangLenBac > 0)
    .sort((a, c) => c.soCauDungLai - a.soCauDungLai || c.soDangLenBac - a.soDangLenBac || (a.sbd < c.sbd ? -1 : 1))[0]

  // Bền bỉ nhất: chuỗi ngày `dat` liên tiếp (ngày nghỉ bị bỏ qua, không đứt chuỗi) — đúng công thức `demChuoiDat` của kế hoạch ngày.
  const lichSu = new Map<string, { ketQua: 'dat' | 'mot_phan' | 'khong' | null }[]>()
  for (const x of rKh ?? []) {
    const sbd = chuoi(x.sbd)
    const kq = so(x.la_ngay_nghi) === 1 ? null : (chuoi(x.ket_qua) as 'dat' | 'mot_phan' | 'khong')
    lichSu.set(sbd, [...(lichSu.get(sbd) ?? []), { ketQua: kq || null }])
  }
  const benBi = [...lichSu].map(([sbd, ls]) => ({ sbd, chuoiNgay: demChuoiDat(ls as never) })).filter((x) => x.chuoiNgay > 0).sort((a, c) => c.chuoiNgay - a.chuoiNgay || (a.sbd < c.sbd ? -1 : 1))[0]

  // Điểm cao: ca nộp GẦN NHẤT trong ngày, em điểm cao nhất ca ấy.
  let diemCao: { sbd: string; diem: number; tenCa: string } | undefined
  if (rDiem && rDiem.length > 0) {
    const maCa = chuoi(rDiem[0]!.ma_ca)
    const cua = rDiem.filter((x) => chuoi(x.ma_ca) === maCa).sort((a, c) => so(c.tong) - so(a.tong) || (chuoi(a.sbd) < chuoi(c.sbd) ? -1 : 1))[0]!
    if (so(cua.tong) > 0) diemCao = { sbd: chuoi(cua.sbd), diem: so(cua.tong), tenCa: chuoi(cua.ten_ca) || `Ca ${maCa}` }
  }
  const cham = rExp?.[0] && so(rExp[0].exp) > 0 ? { sbd: chuoi(rExp[0].sbd), exp: so(rExp[0].exp) } : undefined

  const can = [...new Set([cham?.sbd, tienBo?.sbd, benBi?.sbd, diemCao?.sbd].filter((x): x is string => !!x))]
  const ten = new Map<string, { hoTen: string; lop: string }>()
  if (can.length > 0) {
    const r = await Q.hoi("SELECT sbd, ho_ten, lop, 1 AS uu FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?)) UNION ALL SELECT sbd, ho_ten, lop, 0 FROM danh_sach WHERE sbd IN (SELECT value FROM json_each(?))", json(can), json(can))
    for (const x of [...(r ?? [])].sort((a, c) => so(c.uu) - so(a.uu))) if (!ten.has(chuoi(x.sbd)) || !ten.get(chuoi(x.sbd))!.hoTen) ten.set(chuoi(x.sbd), { hoTen: chuoi(x.ho_ten), lop: chuoi(x.lop) })
  }
  const ai = (sbd: string) => ({ sbd, hoTen: ten.get(sbd)?.hoTen ?? '', lop: ten.get(sbd)?.lop ?? '' })
  return {
    ok: true, ngay,
    ...(cham ? { chamNhat: { ...ai(cham.sbd), exp: cham.exp } } : {}),
    ...(tienBo ? { tienBoNhat: { ...ai(tienBo.sbd), soDangLenBac: tienBo.soDangLenBac, soCauDungLai: tienBo.soCauDungLai } } : {}),
    ...(benBi ? { benBiNhat: { ...ai(benBi.sbd), chuoiNgay: benBi.chuoiNgay } } : {}),
    ...(diemCao ? { diemCao: { ...ai(diemCao.sbd), diem: diemCao.diem, tenCa: diemCao.tenCa } } : {}),
    soTruyVan: Q.dem(),
  }
}

// ================================================================== /gv/em-toan-canh ==================================================================

const LOAI_DONG = ['ca', 'btvn', 'on_lai', 'bai_rieng', 'len_bang', 'game', 'exp', 'bo_nao', 'canh_bao'] as const
type LoaiDong = (typeof LOAI_DONG)[number]
type Chip = { chu: string; muc: 'tot' | 'sai' | 'trung' }
const TIEU_DE: Record<LoaiDong, string> = { ca: 'Ca kiểm tra', btvn: 'Bài tập về nhà', on_lai: 'Ôn lại', bai_rieng: 'Bài riêng', len_bang: 'Lên bảng', game: 'Game', exp: 'EXP', bo_nao: 'Bộ não A.I', canh_bao: 'Cảnh báo của thầy' }

const chuThoiGian = (giay: number): string => {
  if (giay <= 0) return ''
  const p = Math.floor(giay / 60)
  const s = Math.round(giay % 60)
  return p > 0 ? `${p} phút${s ? ` ${s} giây` : ''}` : `${s} giây`
}
/** Mức chấm điểm nhịp học 30 ngày: 0 không làm · 1 (1–4 câu) · 2 (5–14) · 3 (≥ 15). */
export const mucNhip = (soCau: number): 0 | 1 | 2 | 3 => (soCau <= 0 ? 0 : soCau <= 4 ? 1 : soCau <= 14 ? 2 : 3)

const DONG_THOI_GIAN = (coCanhBao: boolean) => `
  SELECT l.nop_luc AS luc, 'ca' AS loai, l.ma_ca AS ma, COALESCE(c.ten_ca, '') AS ten, l.tong AS n1, l.so_lan_roi_man AS n2, l.tong_giay_roi_man AS n3,
         CAST(ROUND((julianday(l.nop_luc) - julianday(l.vao_luc)) * 1440) AS INTEGER) AS n4, '' AS txt
    FROM luot l LEFT JOIN ca c ON c.ma_ca = l.ma_ca WHERE l.sbd = ? AND l.nop_luc IS NOT NULL AND l.ma_ca NOT LIKE 'BTVN%'
  UNION ALL
  SELECT MAX(s.luc), CASE WHEN s.nguon IN ('btvn', 'btvn_lo') THEN 'btvn' WHEN s.nguon = 'on_lai' THEN 'on_lai' WHEN s.nguon = 'game' THEN 'game' ELSE 'bai_rieng' END,
         s.ma_nguon, s.nguon, COUNT(*), SUM(s.ket_qua), SUM(COALESCE(s.giay, 0)), 0, ''
    FROM su_kien_hoc s WHERE s.sbd = ? AND s.nguon NOT IN ('thi', 'len_bang') GROUP BY s.nguon, s.ma_nguon, s.ngay_vn
  UNION ALL SELECT luc, 'len_bang', qid, COALESCE(chuyen_de, ''), COALESCE(dat, 0), 0, 0, 0, '' FROM len_bang WHERE sbd = ?
  UNION ALL SELECT MAX(luc), 'exp', ngay_vn, '', SUM(exp), COUNT(*), 0, 0, '' FROM exp_so WHERE sbd = ? GROUP BY ngay_vn
  UNION ALL SELECT COALESCE(nop_luc, ngay || 'T05:00:00.000Z'), 'bo_nao', ngay, COALESCE(che_do, ''), 0, 0, 0, 0, COALESCE(json, '') FROM ai_dieu_chinh WHERE sbd = ? AND COALESCE(huy, 0) = 0 AND COALESCE(json_extract(json, '$.luot'), '') <> 'chieu'
  ${coCanhBao ? "UNION ALL SELECT gui_luc, 'canh_bao', id, ma_btvn, CASE WHEN em_xem_luc IS NULL THEN 0 ELSE 1 END, CASE WHEN ph_xem_luc IS NULL THEN 0 ELSE 1 END, 0, 0, loi_em FROM canh_bao_thay WHERE sbd = ?" : ''}`

function dongTuHang(x: Dong): { luc: string; loai: LoaiDong; tieuDe: string; chiTiet: Record<string, unknown>; chips: Chip[] } {
  const loai = chuoi(x.loai) as LoaiDong
  const luc = chuoi(x.luc)
  const ma = chuoi(x.ma)
  const n1 = so(x.n1), n2 = so(x.n2), n3 = so(x.n3), n4 = so(x.n4)
  const chips: Chip[] = []
  const chiTiet: Record<string, unknown> = {}
  let tieuDe: string = TIEU_DE[loai] ?? loai
  let mota = ''
  if (loai === 'ca') {
    tieuDe = `Ca kiểm tra: ${chuoi(x.ten) || ma}`
    chiTiet.maCa = ma
    const phan = [n4 > 0 ? `Làm ${n4} phút` : '', `rời màn ${n2} lần${n3 > 0 ? ` (${n3} giây)` : ''}`, x.n1 !== null && x.n1 !== undefined ? `điểm ${n1}` : ''].filter(Boolean)
    mota = phan.join(' · ')
    if (x.n1 !== null && x.n1 !== undefined) chips.push({ chu: `Điểm ${n1}`, muc: 'trung' })
    chips.push({ chu: `Rời màn ${n2} lần`, muc: n2 > 0 ? 'sai' : 'tot' })
  } else if (loai === 'btvn' || loai === 'on_lai' || loai === 'bai_rieng' || loai === 'game') {
    if (loai === 'btvn') { chiTiet.maBtvn = ma }
    chiTiet.nguon = chuoi(x.ten)
    chiTiet.soCau = n1
    chiTiet.soDung = n2
    const tg = chuThoiGian(n3)
    mota = `Làm ${n1} câu${tg ? ` trong ${tg}` : ''}: đúng ${n2}, sai ${n1 - n2}`
    if (n2 > 0) chips.push({ chu: `Đúng ${n2}`, muc: 'tot' })
    if (n1 - n2 > 0) chips.push({ chu: `Sai ${n1 - n2}`, muc: 'sai' })
    if (tg) chips.push({ chu: tg, muc: 'trung' })
  } else if (loai === 'len_bang') {
    tieuDe = `Lên bảng${chuoi(x.ten) ? `: ${chuoi(x.ten)}` : ''}`
    chiTiet.qid = ma
    mota = n1 === 1 ? 'Lên bảng và làm đúng' : 'Lên bảng, chưa làm đúng'
    chips.push({ chu: n1 === 1 ? 'Đúng' : 'Chưa đúng', muc: n1 === 1 ? 'tot' : 'sai' })
  } else if (loai === 'exp') {
    tieuDe = `EXP ngày ${ma.slice(8, 10)}/${ma.slice(5, 7)}`
    chiTiet.ngay = ma
    chiTiet.exp = n1
    mota = `Nhận ${n1} EXP trong ngày (${n2} lần ghi)`
    chips.push({ chu: `+${n1} EXP`, muc: 'trung' })
  } else if (loai === 'bo_nao') {
    let loiEm = ''
    let loiPh = ''
    try {
      const j = JSON.parse(chuoi(x.txt)) as { loiNhanChoEm?: unknown; loiNhanChoPhuHuynh?: unknown }
      loiEm = chuoi(j.loiNhanChoEm)
      loiPh = chuoi(j.loiNhanChoPhuHuynh)
    } catch { /* json hỏng: chỉ hiện nhãn */ }
    const that = chuoi(x.ten) === 'that'
    tieuDe = `Bộ não A.I${that ? '' : ' (chạy thử)'}`
    chiTiet.ngay = ma
    chiTiet.cheDo = that ? 'that' : 'bong'
    if (loiEm) chiTiet.loiChoEm = loiEm
    if (loiPh) chiTiet.loiChoPhuHuynh = loiPh
    mota = loiEm ? `Lời nhắn cho em: ${loiEm}` : loiPh ? `Lời nhắn cho phụ huynh: ${loiPh}` : 'Bộ não A.I đã soi ngày này'
    chips.push({ chu: that ? 'Đã gửi' : 'Chạy thử, chưa gửi', muc: 'trung' })
  } else if (loai === 'canh_bao') {
    chiTiet.maBtvn = chuoi(x.ten)
    chiTiet.id = ma
    chiTiet.emDaXem = n1 === 1
    chiTiet.phuHuynhDaXem = n2 === 1
    mota = chuoi(x.txt)
    chips.push({ chu: n1 === 1 ? 'Em đã xem' : 'Em chưa xem', muc: n1 === 1 ? 'tot' : 'trung' }, { chu: n2 === 1 ? 'Phụ huynh đã xem' : 'Phụ huynh chưa xem', muc: n2 === 1 ? 'tot' : 'trung' })
  }
  if (mota) chiTiet.mota = mota
  return { luc, loai, tieuDe, chiTiet, chips }
}

/**
 * `POST /gv/em-toan-canh {sbd, truoc?, loai?}` — TOÀN CẢNH MỘT EM: đầu trang, dòng thời gian (mới nhất trước, ≤ 30/trang, phân trang theo thời gian), bản đồ dạng, nhịp 30 ngày.
 * Loại `mo_app` CHƯA có nguồn thật ⇒ không bao giờ trả. Chỗ thiếu dữ liệu VẮNG KHOÁ.
 */
export async function gvEmToanCanh(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd)
  if (!sbd || sbd.length > 40) return { ok: false, error: 'Thiếu số báo danh' }
  const truoc = chuoi(b.truoc)
  if (truoc && !(Date.parse(truoc) > 0)) return { ok: false, error: 'Mốc "truoc" phải là thời điểm ISO' }
  const loaiXin = Array.isArray(b.loai) ? (b.loai as unknown[]).map(chuoi).filter((x): x is LoaiDong => (LOAI_DONG as readonly string[]).includes(x)) : []
  const loaiLoc = loaiXin.length > 0 ? loaiXin : [...LOAI_DONG]
  const homNay = homNayVn(nowMs)
  const Q = boDem(env)

  // 1 · đầu trang: em + thần thú + phụ huynh xem + EXP + hoạt động cuối + điểm ca gần nhất (5 truy vấn nhỏ)
  const rEm = await Q.hoi('SELECT ho_ten, nam_sinh, lop, 1 AS uu FROM hoc_sinh WHERE sbd = ? UNION ALL SELECT ho_ten, nam_sinh, lop, 0 FROM danh_sach WHERE sbd = ? ORDER BY uu DESC LIMIT 1', sbd, sbd)
  if (!rEm) return { ok: false, error: 'Không đọc được học sinh', soTruyVan: Q.dem() }
  if (rEm.length === 0) return { ok: false, error: 'Không tìm thấy học sinh', soTruyVan: Q.dem() }
  const rTt = await Q.hoi('SELECT json FROM game_v2_profile WHERE sbd = ?', sbd)
  const rTong = await Q.hoi(
    `SELECT (SELECT MAX(luc) FROM ph_truy_cap WHERE sbd = ?) AS ph, (SELECT SUM(exp) FROM exp_so WHERE sbd = ?) AS exp_tong, (SELECT SUM(exp) FROM exp_so WHERE sbd = ? AND ngay_vn = ?) AS exp_nay,
            (SELECT luc FROM su_kien_hoc WHERE sbd = ? ORDER BY luc DESC LIMIT 1) AS cuoi_luc, (SELECT nguon FROM su_kien_hoc WHERE sbd = ? ORDER BY luc DESC LIMIT 1) AS cuoi_nguon,
            (SELECT nop_luc FROM luot WHERE sbd = ? AND nop_luc IS NOT NULL ORDER BY nop_luc DESC LIMIT 1) AS ca_luc`,
    sbd, sbd, sbd, homNay, sbd, sbd, sbd,
  )
  const rDiem = await Q.hoi(
    `SELECT l.tong, l.ma_ca, l.nop_luc, COALESCE(c.ten_ca, '') AS ten_ca FROM luot l LEFT JOIN ca c ON c.ma_ca = l.ma_ca
      WHERE l.sbd = ? AND l.nop_luc IS NOT NULL AND l.tong IS NOT NULL AND l.ma_ca NOT LIKE 'BTVN%' ORDER BY l.nop_luc DESC LIMIT 1`,
    sbd,
  )
  const rChuoi = await Q.hoi('SELECT ngay, ket_qua, la_ngay_nghi FROM ke_hoach_ngay WHERE sbd = ? AND ngay <= ? ORDER BY ngay DESC LIMIT 90', sbd, homNay)
  let thanThu: { ten: string; cap: number } | undefined
  try {
    const p = JSON.parse(chuoi(rTt?.[0]?.json)) as { pet?: string; cap?: number; nickname?: string; choice?: boolean }
    if (p && p.choice !== true && p.pet) thanThu = { ten: chuoi(p.nickname) || PETS.find((x) => x.id === p.pet)?.name || chuoi(p.pet), cap: so(p.cap) || 1 }
  } catch { /* chưa có hồ sơ game */ }
  const tong = rTong?.[0]
  const cuoiLuc = [chuoi(tong?.cuoi_luc), chuoi(tong?.ca_luc)].filter(Boolean).sort().pop() ?? ''
  const viecCuoi = cuoiLuc && cuoiLuc === chuoi(tong?.ca_luc) ? 'Ca kiểm tra' : ({ btvn: 'Bài tập về nhà', btvn_lo: 'Bài tập về nhà', on_lai: 'Ôn lại', game: 'Game', mom: 'Bài riêng', khac_phuc: 'Bài riêng', luyen: 'Luyện đề', len_bang: 'Lên bảng' } as Record<string, string>)[chuoi(tong?.cuoi_nguon)] ?? ''
  const lichSuChuoi = (rChuoi ?? []).map((x) => ({ ketQua: so(x.la_ngay_nghi) === 1 ? null : ((chuoi(x.ket_qua) || null) as 'dat' | 'mot_phan' | 'khong' | null) }))
  const emRow = rEm[0]!
  const em = {
    sbd, hoTen: chuoi(emRow.ho_ten), lop: chuoi(emRow.lop),
    ...(chuoi(emRow.nam_sinh) ? { namSinh: chuoi(emRow.nam_sinh) } : {}),
    ...(thanThu ? { thanThu } : {}),
    chuoiNgay: demChuoiDat(lichSuChuoi as never),
    ...(cuoiLuc ? { hoatDongCuoi: { luc: cuoiLuc, viec: viecCuoi } } : {}),
    ...(chuoi(tong?.ph) ? { phuHuynhXemCuoi: chuoi(tong?.ph) } : {}),
    ...(rDiem?.[0] ? { diemCaGanNhat: { diem: so(rDiem[0].tong), tenCa: chuoi(rDiem[0].ten_ca) || `Ca ${chuoi(rDiem[0].ma_ca)}`, maCa: chuoi(rDiem[0].ma_ca), luc: chuoi(rDiem[0].nop_luc) } } : {}),
    ...(tong && tong.exp_tong !== null && tong.exp_tong !== undefined ? { expTong: so(tong.exp_tong), expHomNay: so(tong.exp_nay) } : {}),
  }

  // 2 · dòng thời gian: MỘT truy vấn UNION (ca, sổ học theo nhóm, lên bảng, EXP theo ngày, Bộ não, cảnh báo)
  const bindDong = (coCb: boolean) => [sbd, sbd, sbd, sbd, sbd, ...(coCb ? [sbd] : [])]
  const sqlNgoai = (coCb: boolean) => `SELECT * FROM (${DONG_THOI_GIAN(coCb)}) WHERE luc IS NOT NULL AND luc <> '' AND luc < ? AND loai IN (SELECT value FROM json_each(?)) ORDER BY luc DESC LIMIT ${TOI_DA_DONG_MOT_TRANG + 1}`
  const mocTruoc = truoc || '9999-12-31T00:00:00.000Z'
  const rDong = (await Q.hoi(sqlNgoai(true), ...bindDong(true), mocTruoc, json(loaiLoc))) ?? (await Q.hoi(sqlNgoai(false), ...bindDong(false), mocTruoc, json(loaiLoc))) ?? []
  const conNua = rDong.length > TOI_DA_DONG_MOT_TRANG
  const dong = rDong.slice(0, TOI_DA_DONG_MOT_TRANG).map(dongTuHang)

  // 3 · bản đồ dạng: hồ sơ + tên dạng + xu hướng 7 ngày + câu sai gần nhất (em chọn gì / đáp án)
  const rDang = await Q.hoi('SELECT ma_dang, so_gap, so_sai, so_da_khac_phuc, bac FROM nam_kt_dang WHERE sbd = ? ORDER BY so_sai DESC, ma_dang LIMIT 60', sbd)
  const dsMa = (rDang ?? []).map((x) => chuoi(x.ma_dang))
  const d7 = themNgay(homNay, -6)
  const d14 = themNgay(homNay, -13)
  const rTen = dsMa.length ? await Q.hoi("SELECT dang AS ma, MIN(json_extract(json, '$.tenDang')) AS ten FROM game_v2_question WHERE dang IN (SELECT value FROM json_each(?)) GROUP BY dang", json(dsMa)) : []
  const rXh = dsMa.length
    ? await Q.hoi(
      `SELECT ma_dang, SUM(CASE WHEN ngay_vn >= ? THEN 1 ELSE 0 END) AS n_moi, SUM(CASE WHEN ngay_vn >= ? AND ket_qua = 1 THEN 1 ELSE 0 END) AS d_moi,
              SUM(CASE WHEN ngay_vn < ? THEN 1 ELSE 0 END) AS n_cu, SUM(CASE WHEN ngay_vn < ? AND ket_qua = 1 THEN 1 ELSE 0 END) AS d_cu
         FROM su_kien_hoc WHERE sbd = ? AND ngay_vn >= ? AND ngay_vn <= ? AND ma_dang IN (SELECT value FROM json_each(?)) GROUP BY ma_dang`,
      d7, d7, d7, d7, sbd, d14, homNay, json(dsMa),
    )
    : []
  const rSai = dsMa.length ? await Q.hoi('SELECT ma_dang, qid, luc, nguon FROM su_kien_hoc WHERE sbd = ? AND ket_qua = 0 AND ma_dang IN (SELECT value FROM json_each(?)) ORDER BY luc DESC LIMIT 400', sbd, json(dsMa)) : []
  const saiCuoi = new Map<string, Dong>()
  for (const x of rSai ?? []) if (!saiCuoi.has(chuoi(x.ma_dang))) saiCuoi.set(chuoi(x.ma_dang), x)
  const rCt = saiCuoi.size ? await Q.hoi('SELECT qid, so_cau, dap_an_chon, dap_an_dung FROM chi_tiet_cau WHERE sbd = ? AND dung_sai = 0 AND qid IN (SELECT value FROM json_each(?)) ORDER BY cap_nhat_luc DESC', sbd, json([...saiCuoi.values()].map((x) => chuoi(x.qid)))) : []
  const ct = new Map<string, Dong>()
  for (const x of rCt ?? []) if (!ct.has(chuoi(x.qid))) ct.set(chuoi(x.qid), x)
  const ten = new Map((rTen ?? []).filter((x) => chuoi(x.ten)).map((x) => [chuoi(x.ma), chuoi(x.ten)]))
  const xh = new Map((rXh ?? []).map((x) => [chuoi(x.ma_dang), xuHuong7(so(x.n_moi), so(x.d_moi), so(x.n_cu), so(x.d_cu))]))
  const dang = (rDang ?? []).map((x) => {
    const ma = chuoi(x.ma_dang)
    const sai = saiCuoi.get(ma)
    const c = sai ? ct.get(chuoi(sai.qid)) : undefined
    return {
      ma, ten: ten.get(ma) ?? ma.replace(/^CD:/, ''), bac: bacChu(x.bac), gap: so(x.so_gap), sai: so(x.so_sai), khacPhuc: so(x.so_da_khac_phuc),
      ...(xh.get(ma) ? { xuHuong: xh.get(ma) } : {}),
      ...(c ? { cauSaiGanNhat: { stt: so(c.so_cau), emChon: chuoi(c.dap_an_chon), dapAn: chuoi(c.dap_an_dung) } } : {}),
    }
  })

  // 4 · nhịp 30 ngày (đủ 30 ngày, ngày không làm = 0)
  const d29 = themNgay(homNay, -29)
  const rNhip = await Q.hoi('SELECT ngay_vn, COUNT(*) AS n FROM su_kien_hoc WHERE sbd = ? AND ngay_vn >= ? AND ngay_vn <= ? GROUP BY ngay_vn', sbd, d29, homNay)
  const nhip = new Map((rNhip ?? []).map((x) => [chuoi(x.ngay_vn), so(x.n)]))
  const nhip30 = Array.from({ length: 30 }, (_, i) => { const ngay = themNgay(d29, i); return { ngay, muc: mucNhip(nhip.get(ngay) ?? 0) } })

  return {
    ok: true, em, dong, ...(conNua && dong.length > 0 ? { conNua: dong[dong.length - 1]!.luc } : {}), dang, nhip30, soTruyVan: Q.dem(),
  }
}
