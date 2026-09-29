// TU LUYỆN — máy chủ (29/09/2026). Hợp đồng: docs/hop-dong-tu-luyen-2909.md. Bảng: server/migration-2909-tu-luyen.sql.
//
// Thầy chốt: "đặt ở sảnh bật lại 4 chế độ, giữ nguyên thuật toán của từng chế độ … hiển thị đáp án đúng chuẩn … tu luyện cho hs
// luyện thủ công không tính exp gì không liên quan gì đến các câu trong game, độc lập một chỗ, có thêm tổng hợp đánh giá".
//
// KHÁC khối Khắc phục cũ (KhoiKhacPhuc3CheDo.tsx): khối cũ tải NGUYÊN gói kho (có đáp án) xuống máy em rồi rút + chấm tại máy.
// Ở đây MÁY CHỦ rút bằng ĐÚNG các hàm cũ (src/lib/thuat-toan-rut-cau-sai.ts: dsCauLamLaiCauSai · rutDsThemDangCauSai ·
// rutDsDangBai · rutDsTuDo), gửi máy em CÂU CÔNG KHAI (không đáp án, không lời giải), cất phần riêng trong `tu_luyen_luot`,
// và CHẤM khi em nộp bằng luật chung (`chamCauTuLuyen` → `khopPhanIII`). Sau nộp mới trả đáp án + lời giải.
//
// ĐỘC LẬP: chỉ đọc (hsCauSai · cauKhacPhucGoi · deTheoDangBai · danhMucDangBai — mấy lệnh ấy đã gỡ câu của ca đang bảo vệ và câu tự luận)
// và chỉ ghi HAI bảng riêng `tu_luyen_luot` / `tu_luyen_cau`. KHÔNG EXP/vàng/mảnh, KHÔNG su_kien_hoc, KHÔNG kế hoạch ngày,
// KHÔNG qid_da_lam, KHÔNG trần game — nên không ảnh hưởng chọn câu của Đảo / Đoàn / Bi-a hay chiến dịch.
import type { Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { docKhoiEm } from './game-v2-bank'
import { coCaDangMo } from './bi-a'
import { docBaoVeKho, LOI_CHUA_KIEM_BAO_VE } from './bao-ve-kho-cong-khai'
import { cauKhacPhucGoi, danhMucDangBai, deTheoDangBai, hsCauSai } from './goi-cu'
import type { TeacherExamSource } from '../../src/data/examContent'
import type { CauLuyen } from '../../src/lib/bai-tap-pdf'
import { buildTeacherSourceFromKhoDe, parseKhoDeJson } from '../../src/lib/exam-kho-de-import'
import { duocChonLop, lopEmDuocChon, nguonHopKhoi } from '../../src/lib/khac-phuc-khoi'
import { khoiCuaCau, type Khoi } from '../../src/lib/khoi-cau'
import { hopLeDeRut } from '../../src/lib/loc-cau-rut'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import {
  dsCauLamLaiCauSai,
  phanTichTyLeDang,
  rutDsDangBai,
  rutDsThemDangCauSai,
  rutDsTuDo,
  ungVienTuDo,
  demCauDangBai,
  type CauSaiDauVao,
} from '../../src/lib/thuat-toan-rut-cau-sai-loi'
import {
  SO_CAU_MAC_DINH,
  TEN_CHE_DO,
  TRAN_CAU_TU_LUYEN,
  cauCongKhaiTu,
  chamCauTuLuyen,
  loiGiaiTuCauRieng,
  type CauCongKhai,
  type CauRieng,
  type CheDoTuLuyen,
  type KetQuaCau,
  type LopDangBaiTL,
} from '../../src/lib/tu-luyen'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))
const LUA_CHON_TU_DO = new Set(['ngau_nhien', 'sao_2', 'sao_1', 'ly_thuyet', 'bai_tap'])
/** Gói câu xin kho mỗi lượt — đúng số máy em cũ xin (`SO_CAU_XIN_KHO` của kho-cho-may-em.ts). */
const SO_CAU_XIN_KHO = 200
export const LOI_CHUA_BAT = 'Máy chủ chưa bật Tu luyện. Em quay lại sau nhé.'
export const LOI_DANG_THI = 'Em đang có ca kiểm tra mở nên Tu luyện tạm khoá. Làm xong ca kiểm tra rồi luyện tiếp nhé.'

/** Xác thực: SBD LUÔN lấy từ token của em (không nhận `sbd` trần). */
async function emCua(env: Env, b: Obj): Promise<string> {
  return gameIdentity(env, b)
}

// ------------------------------------------------------------------ nạp nguồn (y hệt đường của máy em cũ, nhưng chạy ở máy chủ)

/** Câu sai của em (hsCauSai, CHỈ ca đã công bố) đã qua cửa `hopLeDeRut` — đúng bộ lọc khối cũ áp trước khi xin kho. */
async function cauSaiRutDuoc(env: Env, sbd: string, dsMaCa: string[] = []): Promise<{ ds: CauSaiDauVao[]; loi: string }> {
  const res = await hsCauSai(env, { sbd, dsMaCa })
  const items = Array.isArray(res.items) ? (res.items as CauSaiDauVao[]) : []
  if (res.ok === false || items.length === 0) return { ds: [], loi: str(res.error) || 'Em không có câu sai nào trong lịch sử.' }
  const ds = items.filter((c) => hopLeDeRut({ phan: c.phan, maDe: c.maCa, dapAnDung: c.dapAnDung, text: c.text, choices: c.choices || c.ideas }))
  return { ds, loi: ds.length ? '' : 'Em không có câu sai nào rút lại được.' }
}

/** Kho câu cùng chuyên đề/dạng với câu sai — `napKhoChoMayEm` chuyển sang máy chủ (gọi thẳng `cauKhacPhucGoi`). */
async function khoTheoCauSai(env: Env, sbd: string, dsCauSai: CauSaiDauVao[], khoiEm: Khoi | null): Promise<{ kho: TeacherExamSource[]; loi: string }> {
  const chuyenDe = [...new Set(dsCauSai.map((c) => str(c.chuyenDe).trim()).filter(Boolean))]
  if (chuyenDe.length === 0) return { kho: [], loi: 'Các câu sai chưa gắn chuyên đề nên chưa tìm được câu cùng dạng.' }
  const maCa = str(dsCauSai.find((c) => c.maCa)?.maCa)
  const loaiTru = dsCauSai.map((c) => str(c.qid)).filter(Boolean)
  const dsDang = [...new Set(dsCauSai.map((c) => str(c.dangMa).trim()).filter(Boolean))]
  const kq = await cauKhacPhucGoi(env, { maCa, sbd, chuyenDe, loaiTru, soCau: SO_CAU_XIN_KHO, ...(dsDang.length ? { dsDang } : {}) })
  if (kq.ok === false) return { kho: [], loi: str(kq.error) || 'Không xin được kho từ máy chủ.' }
  const nguon: TeacherExamSource[] = []
  for (const x of Array.isArray(kq.items) ? kq.items : []) {
    const doc = parseKhoDeJson(x)
    if (!doc.ok || !doc.json) continue
    const dung = buildTeacherSourceFromKhoDe(doc.json)
    if (dung.errors.length === 0) nguon.push(dung.source)
  }
  const kho = nguonHopKhoi(khoiEm, nguon)
  return { kho, loi: kho.length ? '' : 'Chưa tìm được câu nào cùng dạng trong kho.' }
}

/** Danh mục Lớp → Bài → Dạng, CHỈ lớp em được chọn (không vượt khối em — luật Boss 21/09). */
async function danhMucCuaEm(env: Env, khoiEm: Khoi | null): Promise<{ lops: LopDangBaiTL[]; loi: string }> {
  const kq = await danhMucDangBai(env).catch((e) => ({ ok: false, error: e instanceof Error ? e.message : '' }) as Obj)
  if (kq.ok === false) return { lops: [], loi: str(kq.error) || 'Chưa đọc được danh mục dạng bài.' }
  return { lops: lopEmDuocChon(khoiEm, (Array.isArray(kq.lops) ? kq.lops : []) as LopDangBaiTL[]), loi: '' }
}

/** Tờ dạng bài (DB-…) → nguồn. Chỉ nhận mã có trong danh mục của em. */
async function khoDangBai(env: Env, dsMa: string[], khoiEm: Khoi | null): Promise<{ kho: TeacherExamSource[]; loi: string }> {
  const nguon: TeacherExamSource[] = []
  let loi = ''
  for (const ma of dsMa) {
    const kq = await deTheoDangBai(env, { ma })
    if (!kq.de) { loi = loi || str(kq.error); continue }
    const doc = parseKhoDeJson(kq.de)
    if (!doc.ok || !doc.json) continue
    const dung = buildTeacherSourceFromKhoDe(doc.json)
    if (dung.errors.length === 0) nguon.push(dung.source)
  }
  const kho = nguonHopKhoi(khoiEm, nguon)
  return { kho, loi: kho.length ? '' : loi || 'Dạng bài này chưa có câu trong kho.' }
}

// ------------------------------------------------------------------ tham số từ máy em (đọc CHẶT, kẹp lại)

interface ThamSo {
  cheDo: CheDoTuLuyen
  soCau: number
  dsMaCa: string[]
  dsDang: string[]
  mucDo: string[]
}
function docThamSo(b: Obj): ThamSo | null {
  const cheDo = Number(b.cheDo)
  if (![1, 2, 3, 4].includes(cheDo)) return null
  const mang = (v: unknown, tran: number) => (Array.isArray(v) ? v.map((x) => str(x).trim()).filter(Boolean).slice(0, tran) : [])
  const soCau = Math.max(1, Math.min(TRAN_CAU_TU_LUYEN, Math.floor(Number(b.soCau)) || SO_CAU_MAC_DINH))
  return {
    cheDo: cheDo as CheDoTuLuyen,
    soCau,
    dsMaCa: mang(b.dsMaCa, 40),
    dsDang: mang(b.dsDang, 30).filter((m) => /^DB-[A-Za-z0-9-]+$/.test(m)),
    mucDo: mang(b.mucDo, 5).filter((m) => LUA_CHON_TU_DO.has(m)),
  }
}

/** Mã dạng trong danh mục của em ⇒ { tên dạng, bài, lớp }. */
function banDoDanhMuc(lops: LopDangBaiTL[]): Map<string, { ten: string; bai: string; lop: string }> {
  const m = new Map<string, { ten: string; bai: string; lop: string }>()
  for (const l of lops) for (const b of l.bais) for (const d of b.dangs) m.set(d.ma, { ten: d.ten, bai: b.tenBai, lop: l.lop })
  return m
}

/** Nhãn dạng của từng câu trong kho: khoá `<mã đề>|<qid>` ⇒ { mã, tên } (đúng cách `nhanKho` của thuật toán cũ khoá câu). */
function nhanDangKho(kho: TeacherExamSource[]): Map<string, { ma: string; ten: string }> {
  const m = new Map<string, { ma: string; ten: string }>()
  for (const de of kho) for (const q of [...de.phanI, ...de.phanII, ...de.phanIII]) {
    const ma = str(q.dang?.ma).trim(), ten = str(q.dang?.ten).trim()
    if (ma || ten) m.set(`${de.maDe}|${q.id}`, { ma, ten: ten || ma })
  }
  return m
}

// ------------------------------------------------------------------ /hs/tu-luyen/nguon — thứ em cần để chọn chế độ (KHÔNG đáp án)

export async function tuLuyenNguon(env: Env, sbd: string): Promise<Obj> {
  const khoiEm = await docKhoiEm(env, sbd).catch(() => null)
  const [cs, dm] = await Promise.all([cauSaiRutDuoc(env, sbd), danhMucCuaEm(env, khoiEm)])
  const theoCa = new Map<string, { maCa: string; tenCa: string; soCauSai: number }>()
  for (const c of cs.ds) {
    const ma = c.maCa || 'mac_dinh'
    const x = theoCa.get(ma)
    if (x) x.soCauSai++
    else theoCa.set(ma, { maCa: ma, tenCa: c.tenCa || (c.maCa ? `Ca kiểm tra ${c.maCa}` : 'Ca kiểm tra'), soCauSai: 1 })
  }
  return {
    ok: true,
    khoi: khoiEm,
    cacCa: [...theoCa.values()],
    soCauSai: cs.ds.length,
    loiCauSai: cs.loi,
    danhMuc: dm.lops,
    loiDanhMuc: dm.loi,
    dangThi: await coCaDangMo(env, sbd, Date.now()).catch(() => false),
  }
}

// ------------------------------------------------------------------ xem trước (số câu tối đa cho thanh chọn) + rút

interface KetQuaRutTho {
  dsCau: CauLuyen[]
  tongToiDa: number
  tieuDe: string
  meta: Map<string, { dangMa: string; dangTen: string; bai: string; lop: string }>
  loi: string
  /** Chế độ 2: thống kê theo dạng câu sai (để màn chọn nói rõ). */
  thongKe?: { tenDang: string; soCauSai: number; soUngVien: number }[]
}

/** Chạy ĐÚNG thuật toán của chế độ. `rut = false` ⇒ chỉ đếm (xem trước), không rút. */
async function chayCheDo(env: Env, sbd: string, t: ThamSo, rut: boolean): Promise<KetQuaRutTho> {
  const khoiEm = await docKhoiEm(env, sbd).catch(() => null)
  const meta = new Map<string, { dangMa: string; dangTen: string; bai: string; lop: string }>()
  const rong = (loi: string): KetQuaRutTho => ({ dsCau: [], tongToiDa: 0, tieuDe: '', meta, loi })
  const lopCua = (c: CauLuyen) => { const k = khoiCuaCau({ qid: c.id, maDe: c.maDe }); return k ? String(k) : '' }

  if (t.cheDo === 1) {
    if (t.dsMaCa.length === 0) return rong('Em chọn ít nhất 1 ca kiểm tra để rút câu sai.')
    const cs = await cauSaiRutDuoc(env, sbd, t.dsMaCa)
    if (cs.ds.length === 0) return rong(cs.loi || 'Các ca kiểm tra đã chọn không có câu sai nào cần sửa.')
    const dsCau = rut ? dsCauLamLaiCauSai(cs.ds) : []
    for (const c of dsCau) meta.set(c.id, { dangMa: str(c.chuaCho?.maDang), dangTen: str(c.chuaCho?.tenDang), bai: '', lop: lopCua(c) })
    const tieuDe = t.dsMaCa.length === 1 ? `Sửa câu sai · ${cs.ds[0]?.tenCa || 'ca đã chọn'}` : `Sửa câu sai · ${t.dsMaCa.length} ca kiểm tra`
    return { dsCau, tongToiDa: cs.ds.length, tieuDe, meta, loi: '' }
  }

  if (t.cheDo === 2 || t.cheDo === 4) {
    const csTatCa = await cauSaiRutDuoc(env, sbd)
    if (csTatCa.ds.length === 0) return rong(csTatCa.loi)
    const { kho, loi } = await khoTheoCauSai(env, sbd, csTatCa.ds, khoiEm)
    if (kho.length === 0) return rong(loi)
    const nhan = nhanDangKho(kho)
    const ganMeta = (c: CauLuyen) => {
      const n = nhan.get(`${c.maDe}|${c.id}`)
      meta.set(c.id, { dangMa: n?.ma || str(c.chuaCho?.maDang), dangTen: n?.ten || str(c.chuaCho?.tenDang), bai: '', lop: lopCua(c) })
    }
    if (t.cheDo === 2) {
      // Chế độ 2 lọc câu sai theo CA em tick (mặc định mọi ca) — đúng như khối cũ.
      const chon = new Set(t.dsMaCa)
      const dsCauSai = chon.size ? csTatCa.ds.filter((c) => chon.has(c.maCa || 'mac_dinh')) : csTatCa.ds
      if (dsCauSai.length === 0) return rong('Em tick chọn ít nhất một ca kiểm tra có câu sai.')
      const pt = phanTichTyLeDang(dsCauSai, kho)
      const gom = new Map<string, { tenDang: string; soCauSai: number; soUngVien: number }>()
      for (const x of pt.thongKe) {
        const g = gom.get(x.nhanDan) ?? { tenDang: x.tenDang, soCauSai: 0, soUngVien: 0 }
        g.soCauSai++
        g.soUngVien = Math.max(g.soUngVien, x.soUngVienToiDa)
        gom.set(x.nhanDan, g)
      }
      const thongKe = [...gom.values()].sort((a, b) => b.soCauSai - a.soCauSai)
      if (!rut) return { dsCau: [], tongToiDa: pt.tongToiDa, tieuDe: '', meta, loi: '', thongKe }
      const { dsCau, tongToiDa } = rutDsThemDangCauSai(dsCauSai, kho, t.soCau)
      dsCau.forEach(ganMeta)
      return { dsCau, tongToiDa, tieuDe: `Dạng câu sai · ${dsCau.length} câu cùng dạng`, meta, loi: dsCau.length ? '' : 'Kho đề chưa có câu nào cùng dạng câu sai của em.', thongKe }
    }
    const loc = new Set(t.mucDo.length ? t.mucDo : ['ngau_nhien'])
    if (!rut) return { dsCau: [], tongToiDa: ungVienTuDo(kho, loc).length, tieuDe: '', meta, loi: '' }
    const { dsCau, tong } = rutDsTuDo(kho, loc, t.soCau)
    dsCau.forEach(ganMeta)
    const nhanLoc = loc.has('ngau_nhien') ? ['Ngẫu nhiên'] : [loc.has('sao_2') && '2 sao', loc.has('sao_1') && '1 sao', loc.has('ly_thuyet') && 'Lý thuyết', loc.has('bai_tap') && 'Bài tập'].filter(Boolean)
    return { dsCau, tongToiDa: tong, tieuDe: `Tự do · ${nhanLoc.join(' + ')}`, meta, loi: dsCau.length ? '' : 'Không tìm thấy câu hợp với lựa chọn của em.' }
  }

  // Chế độ 3: Dạng bài — chỉ mã trong danh mục CỦA EM (không vượt khối).
  if (t.dsDang.length === 0) return rong('Em chọn ít nhất 1 dạng bài.')
  const dm = await danhMucCuaEm(env, khoiEm)
  const banDo = banDoDanhMuc(dm.lops)
  const hopLe = t.dsDang.filter((m) => banDo.has(m) && duocChonLop(khoiEm, banDo.get(m)!.lop))
  if (hopLe.length === 0) return rong(dm.loi || 'Dạng bài em chọn không có trong danh mục lớp của em.')
  const { kho, loi } = await khoDangBai(env, hopLe, khoiEm)
  if (kho.length === 0) return rong(loi)
  if (!rut) return { dsCau: [], tongToiDa: demCauDangBai(kho), tieuDe: '', meta, loi: '' }
  const { dsCau, tong } = rutDsDangBai(kho, t.soCau)
  for (const c of dsCau) {
    const d = banDo.get(c.maDe)
    meta.set(c.id, { dangMa: c.maDe, dangTen: d?.ten ?? '', bai: d?.bai ?? '', lop: d?.lop ?? lopCua(c) })
  }
  const dau = banDo.get(hopLe[0])!
  const tieuDe = hopLe.length === 1 ? `Dạng bài · ${dau.ten}` : `Dạng bài · ${hopLe.length} dạng · Lớp ${dau.lop}`
  return { dsCau, tongToiDa: tong, tieuDe, meta, loi: dsCau.length ? '' : 'Không tìm thấy câu nào thuộc dạng bài đã chọn.' }
}

export async function tuLuyenXemTruoc(env: Env, sbd: string, b: Obj): Promise<Obj> {
  const t = docThamSo(b)
  if (!t) return { ok: false, error: 'Chế độ luyện không hợp lệ.' }
  const r = await chayCheDo(env, sbd, t, false)
  if (r.loi && r.tongToiDa === 0) return { ok: true, tongToiDa: 0, loi: r.loi, ...(r.thongKe ? { thongKe: r.thongKe } : {}) }
  return { ok: true, tongToiDa: r.tongToiDa, ...(r.thongKe ? { thongKe: r.thongKe } : {}) }
}

/** Mã lượt: 16 ký tự ngẫu nhiên (không đoán được). */
function maLuot(): string {
  const a = new Uint8Array(10)
  crypto.getRandomValues(a)
  return 'tl_' + [...a].map((x) => x.toString(36).padStart(2, '0')).join('').slice(0, 16)
}

export async function tuLuyenRut(env: Env, sbd: string, b: Obj): Promise<Obj> {
  const t = docThamSo(b)
  if (!t) return { ok: false, error: 'Chế độ luyện không hợp lệ.' }
  if (await coCaDangMo(env, sbd, Date.now()).catch(() => false)) return { ok: false, khoa: 'dang_kiem_tra', error: LOI_DANG_THI }
  // Lưới an toàn cuối: gỡ câu thuộc ca kiểm tra đang bảo vệ (qid) — các lệnh nguồn đã gỡ, ở đây gỡ lần nữa cho chắc (cả chế độ 1).
  const baoVe = await docBaoVeKho(env)
  if (!baoVe) return { ok: false, error: LOI_CHUA_KIEM_BAO_VE }
  const r = await chayCheDo(env, sbd, t, true)
  const dsCau = r.dsCau.filter((c) => !laCauTuLuan(c) && !baoVe.has(c.id)).slice(0, TRAN_CAU_TU_LUYEN)
  if (dsCau.length === 0) return { ok: false, error: r.loi || 'Không rút được câu nào. Em đổi lựa chọn rồi thử lại.' }

  const congKhai: CauCongKhai[] = []
  const rieng: CauRieng[] = []
  const daCo = new Set<string>()
  for (const c of dsCau) {
    if (daCo.has(c.id)) continue
    daCo.add(c.id)
    const m = r.meta.get(c.id) ?? { dangMa: '', dangTen: '', bai: '', lop: '' }
    congKhai.push(cauCongKhaiTu(c, m.dangTen))
    rieng.push({
      qid: c.id, phan: c.phan, dapAn: c.dapAn, chot: c.chot, lyDo: c.lyDo, buoc: c.buoc, ketQua: c.ketQua,
      dangMa: m.dangMa, dangTen: m.dangTen, bai: m.bai, lop: m.lop, sao: c.sao === 2 || c.sao === 1 ? c.sao : 0,
    })
  }
  const id = maLuot()
  const nay = Date.now()
  const tieuDe = r.tieuDe || TEN_CHE_DO[t.cheDo]
  try {
    await env.DB.prepare(
      `INSERT INTO tu_luyen_luot (id, sbd, che_do, tieu_de, tham_so_json, de_rieng_json, so_cau, trang_thai, tao_luc) VALUES (?,?,?,?,?,?,?, 'dang_lam', ?)`,
    ).bind(id, sbd, t.cheDo, tieuDe, JSON.stringify({ soCau: t.soCau, dsMaCa: t.dsMaCa, dsDang: t.dsDang, mucDo: t.mucDo }), JSON.stringify(rieng), rieng.length, nay).run()
  } catch (e) {
    if (/no such table/i.test(String(e))) return { ok: false, error: LOI_CHUA_BAT }
    throw e
  }
  return { ok: true, luotId: id, cheDo: t.cheDo, tieuDe, taoLuc: nay, tongToiDa: r.tongToiDa, cau: congKhai }
}

// ------------------------------------------------------------------ nộp: CHẤM ở máy chủ, rồi mới trả đáp án + lời giải

function docRieng(json: unknown): CauRieng[] {
  try {
    const a = JSON.parse(str(json))
    return Array.isArray(a) ? (a as CauRieng[]) : []
  } catch {
    return []
  }
}

export async function tuLuyenNop(env: Env, sbd: string, b: Obj): Promise<Obj> {
  const luotId = str(b.luotId).trim()
  if (!/^tl_[a-z0-9]{6,20}$/.test(luotId)) return { ok: false, error: 'Không tìm thấy lượt luyện này.' }
  let dong: Obj | null
  try {
    dong = await env.DB.prepare('SELECT * FROM tu_luyen_luot WHERE id = ? AND sbd = ?').bind(luotId, sbd).first<Obj>()
  } catch (e) {
    if (/no such table/i.test(String(e))) return { ok: false, error: LOI_CHUA_BAT }
    throw e
  }
  if (!dong) return { ok: false, error: 'Không tìm thấy lượt luyện này.' }
  const rieng = docRieng(dong.de_rieng_json)
  const traLoiVao = (b.traLoi && typeof b.traLoi === 'object' ? b.traLoi : {}) as Obj
  const giayCauVao = (b.giayCau && typeof b.giayCau === 'object' ? b.giayCau : {}) as Obj
  const coGoiY = new Set((Array.isArray(b.coGoiY) ? b.coGoiY : []).map(str))
  const daNop = str(dong.trang_thai) === 'da_nop'
  const baoVe = (await docBaoVeKho(env)) ?? null

  // Đã nộp rồi ⇒ trả lại ĐÚNG kết quả đã chốt (nộp lại không đổi gì — không chấm lần hai).
  let daChot = new Map<string, { traLoi: string; dung: boolean; diem: number }>()
  if (daNop) {
    const r = await env.DB.prepare('SELECT qid, tra_loi, dung, diem FROM tu_luyen_cau WHERE luot_id = ?').bind(luotId).all<Obj>()
    daChot = new Map((r.results ?? []).map((x) => [str(x.qid), { traLoi: str(x.tra_loi), dung: Number(x.dung) === 1, diem: Number(x.diem) || 0 }]))
  }
  const nay = daNop ? Number(dong.nop_luc) || Date.now() : Date.now()
  const giay = daNop ? Number(dong.giay) || 0 : Math.max(0, Math.min(6 * 3600, Math.round(Number(b.giay) || 0)))
  const ketQua: KetQuaCau[] = []
  const ghi = []
  let soDung = 0, tongDiem = 0
  for (const c of rieng) {
    const traLoi = daNop ? daChot.get(c.qid)?.traLoi ?? '' : str(traLoiVao[c.qid]).slice(0, 40)
    const cham = chamCauTuLuyen(c.phan, c.dapAn, traLoi)
    const dung = daNop ? daChot.get(c.qid)?.dung ?? cham.dung : cham.dung
    const diem = daNop ? daChot.get(c.qid)?.diem ?? cham.diem : cham.diem
    if (dung) soDung++
    tongDiem += diem
    const an = !!baoVe && baoVe.has(c.qid)
    ketQua.push({
      qid: c.qid, phan: c.phan, dung, diem, traLoi,
      dapAn: an ? '' : c.dapAn,
      ...(c.phan === 'II' ? { yDung: cham.yDung } : {}),
      ...(an ? { anDapAn: true as const } : { loiGiai: loiGiaiTuCauRieng(c) }),
    })
    if (!daNop) {
      ghi.push(env.DB.prepare(
        `INSERT OR IGNORE INTO tu_luyen_cau (luot_id, sbd, che_do, qid, phan, dung, diem, tra_loi, dang_ma, dang_ten, bai, lop, sao, giay, co_goi_y, nop_luc)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(luotId, sbd, Number(dong.che_do), c.qid, c.phan, dung ? 1 : 0, diem, traLoi, c.dangMa, c.dangTen, c.bai, c.lop, c.sao,
        Math.max(0, Math.min(3600, Math.round(Number(giayCauVao[c.qid]) || 0))), coGoiY.has(c.qid) ? 1 : 0, nay))
    }
  }
  const diem10 = rieng.length ? Math.round((tongDiem / rieng.length) * 1000) / 100 : 0
  if (!daNop) {
    // Chốt trạng thái TRƯỚC (điều kiện 'dang_lam' ⇒ hai lượt nộp đồng thời chỉ một lượt ghi câu).
    const chot = await env.DB.prepare(
      `UPDATE tu_luyen_luot SET trang_thai = 'da_nop', nop_luc = ?, so_dung = ?, diem = ?, giay = ? WHERE id = ? AND sbd = ? AND trang_thai = 'dang_lam'`,
    ).bind(nay, soDung, diem10, giay, luotId, sbd).run()
    if (Number(chot.meta?.changes ?? 0) > 0 && ghi.length) await env.DB.batch(ghi)
  }
  return {
    ok: true,
    luotId,
    cheDo: Number(dong.che_do),
    tieuDe: str(dong.tieu_de),
    soCau: rieng.length,
    soDung,
    diem: diem10,
    giay,
    nopLuc: nay,
    cau: ketQua,
  }
}

// ------------------------------------------------------------------ tổng hợp đánh giá (dữ liệu thô; máy em tính bằng `tongHopTuLuyen`)

export async function tuLuyenTongHop(env: Env, sbd: string): Promise<Obj> {
  try {
    const [l, c] = await Promise.all([
      env.DB.prepare(`SELECT id, che_do, tieu_de, tao_luc, nop_luc, so_cau, so_dung, giay FROM tu_luyen_luot
        WHERE sbd = ? AND trang_thai = 'da_nop' ORDER BY nop_luc DESC LIMIT 500`).bind(sbd).all<Obj>(),
      env.DB.prepare(`SELECT luot_id, che_do, nop_luc, qid, phan, dung, dang_ma, dang_ten, bai, lop, sao, giay FROM tu_luyen_cau
        WHERE sbd = ? ORDER BY nop_luc DESC LIMIT 6000`).bind(sbd).all<Obj>(),
    ])
    return {
      ok: true,
      luot: (l.results ?? []).map((x) => ({ id: str(x.id), cheDo: Number(x.che_do), tieuDe: str(x.tieu_de), taoLuc: Number(x.tao_luc), nopLuc: Number(x.nop_luc), soCau: Number(x.so_cau), soDung: Number(x.so_dung), giay: Number(x.giay) })),
      cau: (c.results ?? []).map((x) => ({
        luotId: str(x.luot_id), cheDo: Number(x.che_do), luc: Number(x.nop_luc), qid: str(x.qid), phan: str(x.phan), dung: Number(x.dung) === 1,
        dangMa: str(x.dang_ma), dangTen: str(x.dang_ten), bai: str(x.bai), lop: str(x.lop), sao: Number(x.sao) === 2 ? 2 : Number(x.sao) === 1 ? 1 : 0, giay: Number(x.giay) || 0,
      })),
    }
  } catch (e) {
    if (/no such table/i.test(String(e))) return { ok: true, luot: [], cau: [], chuaBat: true }
    throw e
  }
}

/** Định tuyến `/hs/tu-luyen/<lệnh>` (index.ts). Lỗi xác thực ⇒ trả lời có chữ, không ném ra ngoài. */
export async function tuLuyen(env: Env, lenh: string, b: Obj): Promise<Obj> {
  let sbd: string
  try {
    sbd = await emCua(env, b)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Em đăng nhập lại nhé.' }
  }
  if (lenh === 'nguon') return tuLuyenNguon(env, sbd)
  if (lenh === 'xem-truoc') return tuLuyenXemTruoc(env, sbd, b)
  if (lenh === 'rut') return tuLuyenRut(env, sbd, b)
  if (lenh === 'nop') return tuLuyenNop(env, sbd, b)
  if (lenh === 'tong-hop') return tuLuyenTongHop(env, sbd)
  return { ok: false, error: 'Lệnh Tu luyện không có.' }
}
