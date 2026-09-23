// HỒ SƠ NẮM KIẾN THỨC — GĐ 1 (DE-XUAT-CA-NHAN-HOA-1909.md mục 1.2).
//
// `phatLaiSuKien` là HÀM THUẦN: đọc sổ `su_kien_hoc` của một hay nhiều em, phát lại
// theo thứ tự (giờ, khoá) và ra trạng thái từng câu (`nam_kt_cau`) + từng dạng
// (`nam_kt_dang`). Không đọc đồng hồ, không Math.random: cùng sổ → cùng kết quả,
// từng chữ. Đó là tính chất để dựng lại hồ sơ bất cứ lúc nào từ sổ.
//
// Nhãn khắc phục/dạy lại giữ luật sư phạm; mốc ôn tính bằng FSRS từ lịch sử riêng
// của từng em × câu. Một quan sát/ngày VN, sai ưu tiên; bỏ trống không chấm Again.
import type { D1PreparedStatement, Env } from './kieu'
import { DemTTL } from './dem-chung'
import { ngayVnFsrs, taoLichOnFsrs, type LichOnFsrs } from './lich-on-fsrs'
import {
  BAC_DANG_BAT_DAU,
  BAC_DANG_TOI_DA,
  NGUONG_DANG_YEU,
  SO_CAU_DU_TIN,
  SO_LAN_SAI_DAY_LAI,
  SO_MOC_KHAC_PHUC,
} from './ho-so-cau-hinh'

export type TrangThaiCau = 'moi_sai' | 'dang_on' | 'da_khac_phuc' | 'chua_thay_sai'

/** Một dòng của `su_kien_hoc` (đúng tên trường camelCase của mã, không phải cột SQL). */
export interface SuKienDoc {
  khoa: string
  sbd: string
  qid: string
  nguon: string
  ketQua: 0 | 1 | null
  giay: number | null
  luc: string
  ngayVn: string
  maDang: string | null
  chuyenDe: string
}

export interface NamKtCau {
  sbd: string
  qid: string
  maDang: string | null
  chuyenDe: string
  lanGap: number
  lanSai: number
  lanTrong: number
  dungLienTiep: number
  ngayDungKhacNhau: number
  ketQuaCuoi: 0 | 1 | null
  nguonCuoi: string
  lucCuoi: string
  mocOnKe: string | null
  trangThai: TrangThaiCau
  canDayLai: boolean
  giayTb: number | null
}

export interface NamKtDang {
  sbd: string
  maDang: string
  soGap: number
  soSai: number
  soDaKhacPhuc: number
  soMoiSai: number
  soChuaThaySai: number
  bac: number
  mocOnKe: string | null
  mocMoiSai: string | null
}

/** Tra cứu bổ sung theo qid khi sự kiện không mang sẵn mã dạng/chuyên đề. */
export interface TraCuuCau {
  dang: ReadonlyMap<string, string>
  chuyenDe: ReadonlyMap<string, string>
}

const KHONG_TRA: TraCuuCau = { dang: new Map(), chuyenDe: new Map() }

export function themNgay(ngay: string, n: number): string {
  const ms = Date.parse(`${ngay}T00:00:00Z`)
  return new Date(ms + n * 86_400_000).toISOString().slice(0, 10)
}

const sosanh = (a: SuKienDoc, b: SuKienDoc): number => {
  const d = (Date.parse(a.luc) || 0) - (Date.parse(b.luc) || 0)
  return d !== 0 ? d : a.khoa < b.khoa ? -1 : a.khoa > b.khoa ? 1 : 0
}

interface TrongCau {
  c: NamKtCau
  lich?: LichOnFsrs
  ngayDungCuoi: string | null
  tungDung: boolean
  giayTong: number
  giayMau: number
}

/** Mã dạng của một qid: ưu tiên mã sự kiện mang sẵn, rồi tra kho, cuối cùng rơi về chuyên đề. */
function dangCua(qid: string, ev: SuKienDoc[], tra: TraCuuCau): { maDang: string | null; chuyenDe: string } {
  let ma = ''
  let cd = ''
  for (const e of ev) {
    if (!ma && e.maDang) ma = e.maDang
    if (!cd && e.chuyenDe) cd = e.chuyenDe
  }
  ma = ma || tra.dang.get(qid) || ''
  cd = cd || tra.chuyenDe.get(qid) || ''
  return { maDang: ma || (cd ? `CD:${cd}` : null), chuyenDe: cd }
}

export function phatLaiSuKien(ds: readonly SuKienDoc[], tra: TraCuuCau = KHONG_TRA, tuyChon: { denLuc?: number; retention?: number } = {}): { cau: NamKtCau[]; dang: NamKtDang[] } {
  const theoEm = new Map<string, SuKienDoc[]>()
  const on = taoLichOnFsrs(tuyChon.retention)
  const daDoc = new Set<string>()
  // Sổ SQL đã có khoá duy nhất; vẫn khử trùng khi replay từ bản export/fixture.
  for (const e0 of [...ds].sort(sosanh)) {
    const ms = Date.parse(e0.luc)
    if (!e0.sbd || !e0.qid || !e0.khoa || !Number.isFinite(ms) || ms > (tuyChon.denLuc ?? Infinity)) continue
    const khoa = JSON.stringify([e0.sbd, e0.khoa])
    if (daDoc.has(khoa)) continue
    daDoc.add(khoa)
    const e = { ...e0, ngayVn: ngayVnFsrs(ms) }
    const l = theoEm.get(e.sbd)
    if (l) l.push(e)
    else theoEm.set(e.sbd, [e])
  }
  const cau: NamKtCau[] = []
  const dang: NamKtDang[] = []

  for (const sbd of [...theoEm.keys()].sort()) {
    const ev = theoEm.get(sbd)!.sort(sosanh)
    const theoCau = new Map<string, SuKienDoc[]>()
    for (const e of ev) {
      const l = theoCau.get(e.qid)
      if (l) l.push(e)
      else theoCau.set(e.qid, [e])
    }
    const dangCuaCau = new Map<string, { maDang: string | null; chuyenDe: string }>()
    for (const [qid, l] of theoCau) dangCuaCau.set(qid, dangCua(qid, l, tra))

    const bac = new Map<string, number>()
    const bacCua = (ma: string) => bac.get(ma) ?? BAC_DANG_BAT_DAU
    const trong = new Map<string, TrongCau>()

    // PHÁT LẠI theo đúng thứ tự thời gian của cả em — bậc dạng phụ thuộc thứ tự xen kẽ giữa các câu.
    for (const e of ev) {
      const { maDang, chuyenDe } = dangCuaCau.get(e.qid)!
      let t = trong.get(e.qid)
      if (!t) {
        t = {
          c: {
            sbd, qid: e.qid, maDang, chuyenDe, lanGap: 0, lanSai: 0, lanTrong: 0, dungLienTiep: 0, ngayDungKhacNhau: 0,
            ketQuaCuoi: null, nguonCuoi: e.nguon, lucCuoi: e.luc, mocOnKe: null, trangThai: 'chua_thay_sai', canDayLai: false, giayTb: null,
          },
          ngayDungCuoi: null, tungDung: false, giayTong: 0, giayMau: 0,
        }
        trong.set(e.qid, t)
      }
      const c = t.c
      c.lanGap++
      c.ketQuaCuoi = e.ketQua
      c.nguonCuoi = e.nguon
      c.lucCuoi = e.luc
      if (e.giay && e.giay > 0) {
        t.giayTong += e.giay
        t.giayMau++
        c.giayTb = Math.round(t.giayTong / t.giayMau)
      }

      if (e.ketQua === 0) {
        c.lanSai++
        c.dungLienTiep = 0
        c.ngayDungKhacNhau = 0
        t.ngayDungCuoi = null
        c.trangThai = 'moi_sai'
        if (maDang) bac.set(maDang, Math.max(0, bacCua(maDang) - 1))
      } else if (e.ketQua === null) {
        c.lanTrong++
        // Chưa có quan sát được chấm: hẹn thử lại một lần, không dời xa mỗi lần bỏ trống.
        if (c.mocOnKe === null) c.mocOnKe = themNgay(e.ngayVn, 1)
        if (!t.tungDung) c.trangThai = 'moi_sai'
      } else if (t.ngayDungCuoi === e.ngayVn) {
        // Đúng thêm lần nữa trong CÙNG ngày: chỉ ghi nhận giờ, không thành mốc mới.
      } else {
        t.tungDung = true
        t.ngayDungCuoi = e.ngayVn
        c.dungLienTiep++
        c.ngayDungKhacNhau++
        c.trangThai = c.lanSai > 0 ? (c.ngayDungKhacNhau >= SO_MOC_KHAC_PHUC ? 'da_khac_phuc' : 'dang_on') : 'chua_thay_sai'
        if (maDang) bac.set(maDang, Math.min(BAC_DANG_TOI_DA, bacCua(maDang) + 1))
      }
      if (e.ketQua !== null) {
        t.lich = on(t.lich, Date.parse(e.luc), e.ketQua)
        c.mocOnKe = ngayVnFsrs(t.lich.card.due.getTime())
      }
      c.canDayLai = c.lanSai >= SO_LAN_SAI_DAY_LAI && c.dungLienTiep === 0
    }

    const dd = new Map<string, NamKtDang>()
    for (const qid of [...trong.keys()].sort()) {
      const c = trong.get(qid)!.c
      cau.push(c)
      if (!c.maDang) continue
      let d = dd.get(c.maDang)
      if (!d) {
        d = { sbd, maDang: c.maDang, soGap: 0, soSai: 0, soDaKhacPhuc: 0, soMoiSai: 0, soChuaThaySai: 0, bac: bacCua(c.maDang), mocOnKe: null, mocMoiSai: null }
        dd.set(c.maDang, d)
      }
      d.soGap++
      if (c.lanSai > 0) d.soSai++
      if (c.trangThai === 'da_khac_phuc') d.soDaKhacPhuc++
      if (c.trangThai === 'chua_thay_sai') d.soChuaThaySai++
      if (c.trangThai === 'moi_sai') {
        d.soMoiSai++
        if (c.mocOnKe && (!d.mocMoiSai || c.mocOnKe < d.mocMoiSai)) d.mocMoiSai = c.mocOnKe
      }
      if ((c.trangThai === 'moi_sai' || c.trangThai === 'dang_on') && c.mocOnKe && (!d.mocOnKe || c.mocOnKe < d.mocOnKe)) d.mocOnKe = c.mocOnKe
    }
    dang.push(...[...dd.keys()].sort().map((k) => dd.get(k)!))
  }
  return { cau, dang }
}

/**
 * ĐỊNH NGHĨA "DẠNG YẾU" DUY NHẤT (thay 5 định nghĩa rải rác):
 *   đủ căn cứ (≥ SO_CAU_DU_TIN câu đã gặp) và (đã khắc phục + chưa từng sai) / đã gặp < NGUONG_DANG_YEU,
 *   HOẶC có ≥ 1 câu `moi_sai` đã tới hạn ôn (mốc ≤ hôm nay).
 * Chữ hiển thị luôn kèm số ("đúng 2/3 mốc"), không bao giờ in "nắm chắc".
 */
export function dangYeu(d: NamKtDang, homNay: string): boolean {
  if (d.soGap >= SO_CAU_DU_TIN && (d.soDaKhacPhuc + d.soChuaThaySai) / d.soGap < NGUONG_DANG_YEU) return true
  return d.soMoiSai >= 1 && d.mocMoiSai !== null && d.mocMoiSai <= homNay
}

// --- Đọc sổ, tra dạng, ghi hồ sơ ------------------------------------------------

const CHON_SO = `SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de
                   FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY sbd, luc, khoa`

export async function docSuKienDoc(env: Env, dsSbd: string[]): Promise<SuKienDoc[]> {
  if (dsSbd.length === 0) return []
  const r = await env.DB.prepare(CHON_SO).bind(JSON.stringify(dsSbd)).all<Record<string, unknown>>()
  return (r.results ?? []).map((x) => ({
    khoa: String(x.khoa),
    sbd: String(x.sbd),
    qid: String(x.qid),
    nguon: String(x.nguon),
    ketQua: x.ket_qua === null || x.ket_qua === undefined ? null : Number(x.ket_qua) === 1 ? 1 : 0,
    giay: x.giay === null || x.giay === undefined ? null : Number(x.giay),
    luc: String(x.luc),
    ngayVn: String(x.ngay_vn),
    maDang: x.ma_dang ? String(x.ma_dang) : null,
    chuyenDe: String(x.chuyen_de ?? ''),
  }))
}

/**
 * Tra mã dạng và chuyên đề theo qid từ kho đã lập chỉ mục. Mỗi truy vấn nhận MỘT tham số JSON
 * (`json_each`) nên không vướng giới hạn 100 tham số của D1. Thiếu bảng nào thì bỏ tra bảng ấy —
 * hồ sơ rơi về `CD:<chuyên đề>` hoặc không có dạng, và `docDoPhuDang` nói thật con số.
 */
// HẠ TẢI D1 (Boss 22/09, đo Code 1: hai truy vấn này đứng #2/#3 tổng dòng đọc — 3.042 lượt × 285/qid → dạng, × ~211/qid → chuyên đề
// ≈ 1,5 triệu dòng cộng lại). Dạng/chuyên đề của MỘT qid gần như KHÔNG ĐỔI (chỉ đổi khi thầy sửa lại kho câu, hoạ hoằn) — không phải
// dữ liệu an toàn/chống gian lận như `protectedQuestions`, sai lệch tạm thời chỉ làm hồ sơ "chưa cập nhật dạng mới nhất" trong ít phút,
// tự sửa ở lần gọi sau khi đệm hết hạn — nên ĐỆM THEO THỜI GIAN THUẦN (không cần móc bất hoạt) là đủ an toàn. Đệm CẢ kết quả VẮNG (chuỗi
// rỗng) để qid không có dạng/chuyên đề (rất nhiều câu Phần I) không dội lại D1 mỗi lần — nơi đọc dùng `.get(qid) || ''` nên chuỗi rỗng
// tương đương "vắng khoá", an toàn. TTL 30 phút: đủ dài để đỡ tải, đủ ngắn để kho vừa sửa xong vẫn thấy trong buổi.
const HAN_DEM_TRA_CUU_MS = 30 * 60_000
const demDangTheoQid = new DemTTL<string>(HAN_DEM_TRA_CUU_MS, 30_000)
const demChuyenDeTheoQid = new DemTTL<string>(HAN_DEM_TRA_CUU_MS, 30_000)

export async function traCuuTheoQid(env: Env, qids: string[]): Promise<TraCuuCau> {
  const dang = new Map<string, string>()
  const chuyenDe = new Map<string, string>()
  if (qids.length === 0) return { dang, chuyenDe }
  const now = Date.now()
  const thieuDang = qids.filter((q) => { const c = demDangTheoQid.doc(q, now); if (c === undefined) return true; if (c) dang.set(q, c); return false })
  if (thieuDang.length > 0) {
    try {
      const r = await env.DB.prepare(
        'SELECT qid, MIN(dang) AS dang FROM game_v2_question WHERE dang IS NOT NULL AND qid IN (SELECT value FROM json_each(?)) GROUP BY qid',
      ).bind(JSON.stringify(thieuDang)).all<{ qid: string; dang: string }>()
      const co = new Map((r.results ?? []).map((x) => [String(x.qid), String(x.dang)]))
      for (const q of thieuDang) { const v = co.get(q) ?? ''; if (v) dang.set(q, v); demDangTheoQid.ghi(q, now, v) }
    } catch {
      /* chưa lập chỉ mục dạng */
    }
  }
  const thieuCd = qids.filter((q) => { const c = demChuyenDeTheoQid.doc(q, now); if (c === undefined) return true; if (c) chuyenDe.set(q, c); return false })
  if (thieuCd.length > 0) {
    try {
      const r = await env.DB.prepare(
        "SELECT qid, chuyen_de FROM cau_hoi WHERE COALESCE(chuyen_de,'') <> '' AND qid IN (SELECT value FROM json_each(?))",
      ).bind(JSON.stringify(thieuCd)).all<{ qid: string; chuyen_de: string }>()
      const co = new Map((r.results ?? []).map((x) => [String(x.qid), String(x.chuyen_de)]))
      for (const q of thieuCd) { const v = co.get(q) ?? ''; if (v) chuyenDe.set(q, v); demChuyenDeTheoQid.ghi(q, now, v) }
    } catch {
      /* chưa có chỉ mục câu hỏi */
    }
  }
  return { dang, chuyenDe }
}

const CHEN_CAU = `INSERT INTO nam_kt_cau (khoa, sbd, qid, ma_dang, chuyen_de, lan_gap, lan_sai, lan_trong, dung_lien_tiep,
    ngay_dung_khac_nhau, ket_qua_cuoi, nguon_cuoi, luc_cuoi, moc_on_ke, trang_thai, can_day_lai, giay_tb, cap_nhat_luc)
  SELECT json_extract(j.value,'$.k'), json_extract(j.value,'$.s'), json_extract(j.value,'$.q'), json_extract(j.value,'$.a'),
         json_extract(j.value,'$.c'), json_extract(j.value,'$.g'), json_extract(j.value,'$.x'), json_extract(j.value,'$.t'),
         json_extract(j.value,'$.d'), json_extract(j.value,'$.n'), json_extract(j.value,'$.r'), json_extract(j.value,'$.o'),
         json_extract(j.value,'$.l'), json_extract(j.value,'$.m'), json_extract(j.value,'$.z'), json_extract(j.value,'$.y'),
         json_extract(j.value,'$.b'), ?
    FROM json_each(?) j`

const CHEN_DANG = `INSERT INTO nam_kt_dang (khoa, sbd, ma_dang, so_gap, so_sai, so_da_khac_phuc, so_moi_sai, so_chua_thay_sai, bac, moc_on_ke, moc_moi_sai, cap_nhat_luc)
  SELECT json_extract(j.value,'$.k'), json_extract(j.value,'$.s'), json_extract(j.value,'$.a'), json_extract(j.value,'$.g'),
         json_extract(j.value,'$.x'), json_extract(j.value,'$.d'), json_extract(j.value,'$.m'), json_extract(j.value,'$.c'),
         json_extract(j.value,'$.b'), json_extract(j.value,'$.o'), json_extract(j.value,'$.p'), ?
    FROM json_each(?) j`

const DONG_MOI_LENH = 60

export interface KetQuaDung {
  soEm: number
  soCau: number
  soDang: number
  /** Số câu KHÔNG xác định được dạng (cả mã dạng lẫn chuyên đề đều thiếu). */
  cauKhongDang: number
  /**
   * HẠ TẢI D1 (Boss 22/09, M3): hồ sơ ĐẦY ĐỦ vừa phát lại (không chỉ phần THAY ĐỔI) của từng em trong `dsSbd`, theo đúng
   * thứ tự KHÔNG đảm bảo — nơi gọi tự nhóm theo `sbd`. Nơi gọi NGAY SAU `dungLaiHoSo` (ví dụ `lapVaLuuKeHoach`) dùng bản
   * này thay vì đọc lại `nam_kt_cau`/`nam_kt_dang` từ D1 — hồ sơ nguồn không đổi giữa lúc dựng và lúc đọc lại (cùng một
   * lượt xử lý). CHỈ có mặt cho em nằm trong `dsSbd`; em khác (không đổi sổ) không có ở đây, nơi gọi tự đọc D1 cho họ.
   */
  hoSo: Map<string, { cau: NamKtCau[]; dang: NamKtDang[] }>
}

/**
 * Dựng lại hồ sơ của các em từ sổ, thay thế hoàn toàn dòng cũ của đúng những em ấy.
 * Một `batch` (giao dịch): xoá bản cũ của các em rồi chèn bản phát lại — không bao giờ để hồ sơ nửa cũ nửa mới.
 * `nay` do nơi gọi truyền (giờ máy chủ), hàm này không đọc đồng hồ.
 */
/** Số/Chuỗi chuẩn hoá để so hai dòng (hồ sơ cũ trong D1 với hồ sơ mới dựng) — khác kiểu số/chuỗi không được làm hai dòng giống nhau bị coi là khác (chỉ tốn ghi), nhưng khác nội dung phải bị coi là khác. */
const so = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v))
const chu = (v: unknown): string | null => (v === null || v === undefined ? null : String(v))
const dau = (v: unknown[]): string => JSON.stringify(v)

/**
 * DỰNG LẠI hồ sơ mạnh yếu của các em từ sổ học. HẠ TẢI D1 (Boss 21/09): bản cũ XOÁ TOÀN BỘ hồ sơ của em rồi CHÈN LẠI TẤT CẢ mỗi lần em nộp một câu (em nặng ~900 dòng ghi/lượt nộp, nhân với 250 em) — ghi là việc đắt nhất của D1 một luồng.
 * Bản này ĐỌC hồ sơ hiện có, so từng dòng, và chỉ GHI phần THAY ĐỔI: dòng mới / đổi nội dung ⇒ INSERT OR REPLACE; dòng không còn trong sổ ⇒ DELETE; dòng y nguyên ⇒ không đụng (cả `cap_nhat_luc`, cột này giờ là "lần đổi cuối" của dòng, không nơi nào khác đọc).
 * KẾT QUẢ CUỐI (nội dung mọi dòng) giống hệt bản xoá-chèn-lại, và không bao giờ có lúc hồ sơ của em bị rỗng giữa chừng.
 */
export async function dungLaiHoSo(env: Env, dsSbd: string[], nay: string): Promise<KetQuaDung> {
  const em = [...new Set(dsSbd.map((x) => x.trim()).filter(Boolean))]
  const ds = await docSuKienDoc(env, em)
  const tra = await traCuuTheoQid(env, [...new Set(ds.filter((e) => !e.maDang || !e.chuyenDe).map((e) => e.qid))])
  const denLuc = Date.parse(nay)
  if (!Number.isFinite(denLuc)) throw new RangeError('Giờ dựng hồ sơ không hợp lệ')
  const { cau, dang } = phatLaiSuKien(ds, tra, { denLuc })
  const arr = JSON.stringify(em)

  const [rcCu, rdCu] = await Promise.all([
    env.DB.prepare(`SELECT khoa, ma_dang, chuyen_de, lan_gap, lan_sai, lan_trong, dung_lien_tiep, ngay_dung_khac_nhau, ket_qua_cuoi, nguon_cuoi, luc_cuoi, moc_on_ke, trang_thai, can_day_lai, giay_tb FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?))`).bind(arr).all<Record<string, unknown>>(),
    env.DB.prepare(`SELECT khoa, so_gap, so_sai, so_da_khac_phuc, so_moi_sai, so_chua_thay_sai, bac, moc_on_ke, moc_moi_sai FROM nam_kt_dang WHERE sbd IN (SELECT value FROM json_each(?))`).bind(arr).all<Record<string, unknown>>(),
  ])
  const dauCauCu = new Map((rcCu.results ?? []).map((r) => [String(r.khoa), dau([chu(r.ma_dang), chu(r.chuyen_de), so(r.lan_gap), so(r.lan_sai), so(r.lan_trong), so(r.dung_lien_tiep), so(r.ngay_dung_khac_nhau), so(r.ket_qua_cuoi), chu(r.nguon_cuoi), chu(r.luc_cuoi), chu(r.moc_on_ke), chu(r.trang_thai), so(r.can_day_lai), so(r.giay_tb)])]))
  const dauDangCu = new Map((rdCu.results ?? []).map((r) => [String(r.khoa), dau([so(r.so_gap), so(r.so_sai), so(r.so_da_khac_phuc), so(r.so_moi_sai), so(r.so_chua_thay_sai), so(r.bac), chu(r.moc_on_ke), chu(r.moc_moi_sai)])]))

  const cauMoi = cau.map((c) => ({
    k: `${c.sbd}|${c.qid}`, s: c.sbd, q: c.qid, a: c.maDang, c: c.chuyenDe, g: c.lanGap, x: c.lanSai, t: c.lanTrong,
    d: c.dungLienTiep, n: c.ngayDungKhacNhau, r: c.ketQuaCuoi, o: c.nguonCuoi, l: c.lucCuoi, m: c.mocOnKe,
    z: c.trangThai, y: c.canDayLai ? 1 : 0, b: c.giayTb,
  }))
  const dangMoi = dang.map((d) => ({
    k: `${d.sbd}|${d.maDang}`, s: d.sbd, a: d.maDang, g: d.soGap, x: d.soSai, d: d.soDaKhacPhuc, m: d.soMoiSai,
    c: d.soChuaThaySai, b: d.bac, o: d.mocOnKe, p: d.mocMoiSai,
  }))
  const dauCauMoi = (c: (typeof cauMoi)[number]) => dau([chu(c.a), chu(c.c), so(c.g), so(c.x), so(c.t), so(c.d), so(c.n), so(c.r), chu(c.o), chu(c.l), chu(c.m), chu(c.z), so(c.y), so(c.b)])
  const dauDangMoi = (d: (typeof dangMoi)[number]) => dau([so(d.g), so(d.x), so(d.d), so(d.m), so(d.c), so(d.b), chu(d.o), chu(d.p)])
  const cauDoi = cauMoi.filter((c) => dauCauCu.get(c.k) !== dauCauMoi(c))
  const dangDoi = dangMoi.filter((d) => dauDangCu.get(d.k) !== dauDangMoi(d))
  const khoaCauMoi = new Set(cauMoi.map((c) => c.k)), khoaDangMoi = new Set(dangMoi.map((d) => d.k))
  const cauBo = [...dauCauCu.keys()].filter((k) => !khoaCauMoi.has(k)), dangBo = [...dauDangCu.keys()].filter((k) => !khoaDangMoi.has(k))

  const lenh: D1PreparedStatement[] = []
  for (let i = 0; i < cauBo.length; i += 300) lenh.push(env.DB.prepare('DELETE FROM nam_kt_cau WHERE khoa IN (SELECT value FROM json_each(?))').bind(JSON.stringify(cauBo.slice(i, i + 300))))
  for (let i = 0; i < dangBo.length; i += 300) lenh.push(env.DB.prepare('DELETE FROM nam_kt_dang WHERE khoa IN (SELECT value FROM json_each(?))').bind(JSON.stringify(dangBo.slice(i, i + 300))))
  for (let i = 0; i < cauDoi.length; i += DONG_MOI_LENH) lenh.push(env.DB.prepare(CHEN_CAU.replace('INSERT INTO', 'INSERT OR REPLACE INTO')).bind(nay, JSON.stringify(cauDoi.slice(i, i + DONG_MOI_LENH))))
  for (let i = 0; i < dangDoi.length; i += DONG_MOI_LENH) lenh.push(env.DB.prepare(CHEN_DANG.replace('INSERT INTO', 'INSERT OR REPLACE INTO')).bind(nay, JSON.stringify(dangDoi.slice(i, i + DONG_MOI_LENH))))
  for (let i = 0; i < lenh.length; i += 25) await env.DB.batch(lenh.slice(i, i + 25))
  const hoSo = new Map<string, { cau: NamKtCau[]; dang: NamKtDang[] }>()
  for (const sbd of em) hoSo.set(sbd, { cau: [], dang: [] })
  for (const c of cau) hoSo.get(c.sbd)?.cau.push(c)
  for (const d of dang) hoSo.get(d.sbd)?.dang.push(d)
  return { soEm: em.length, soCau: cau.length, soDang: dang.length, cauKhongDang: cau.filter((c) => !c.maDang).length, hoSo }
}

// --- Đọc hồ sơ đã dựng ------------------------------------------------------------

export interface HoSoEm {
  cau: NamKtCau[]
  dang: NamKtDang[]
}

export async function docHoSoEm(env: Env, sbd: string): Promise<HoSoEm> {
  const rc = await env.DB.prepare('SELECT * FROM nam_kt_cau WHERE sbd = ? ORDER BY qid').bind(sbd).all<Record<string, unknown>>()
  const rd = await env.DB.prepare('SELECT * FROM nam_kt_dang WHERE sbd = ? ORDER BY ma_dang').bind(sbd).all<Record<string, unknown>>()
  const kq = (v: unknown): 0 | 1 | null => (v === null || v === undefined ? null : Number(v) === 1 ? 1 : 0)
  return {
    cau: (rc.results ?? []).map((x) => ({
      sbd: String(x.sbd), qid: String(x.qid), maDang: x.ma_dang ? String(x.ma_dang) : null, chuyenDe: String(x.chuyen_de ?? ''),
      lanGap: Number(x.lan_gap), lanSai: Number(x.lan_sai), lanTrong: Number(x.lan_trong), dungLienTiep: Number(x.dung_lien_tiep),
      ngayDungKhacNhau: Number(x.ngay_dung_khac_nhau), ketQuaCuoi: kq(x.ket_qua_cuoi), nguonCuoi: String(x.nguon_cuoi),
      lucCuoi: String(x.luc_cuoi), mocOnKe: x.moc_on_ke ? String(x.moc_on_ke) : null, trangThai: String(x.trang_thai) as TrangThaiCau,
      canDayLai: Number(x.can_day_lai) === 1, giayTb: x.giay_tb === null || x.giay_tb === undefined ? null : Number(x.giay_tb),
    })),
    dang: (rd.results ?? []).map((x) => ({
      sbd: String(x.sbd), maDang: String(x.ma_dang), soGap: Number(x.so_gap), soSai: Number(x.so_sai), soDaKhacPhuc: Number(x.so_da_khac_phuc),
      soMoiSai: Number(x.so_moi_sai), soChuaThaySai: Number(x.so_chua_thay_sai), bac: Number(x.bac),
      mocOnKe: x.moc_on_ke ? String(x.moc_on_ke) : null, mocMoiSai: x.moc_moi_sai ? String(x.moc_moi_sai) : null,
    })),
  }
}

/**
 * Độ phủ mã dạng trên sổ THẬT: bao nhiêu qid phân giải được ra mã dạng thật (`game_v2_question.dang`),
 * bao nhiêu chỉ rơi về chuyên đề, bao nhiêu không có gì. Đo trước khi tin hồ sơ theo dạng.
 */
export async function docDoPhuDang(env: Env): Promise<Record<string, unknown>> {
  const r = await env.DB.prepare(
    `WITH q AS (SELECT DISTINCT qid FROM su_kien_hoc),
          d AS (SELECT qid, 1 AS co FROM game_v2_question WHERE dang IS NOT NULL GROUP BY qid),
          c AS (SELECT qid, 1 AS co FROM cau_hoi WHERE COALESCE(chuyen_de,'') <> '' GROUP BY qid)
     SELECT COUNT(*) AS tong_qid,
            SUM(CASE WHEN d.co = 1 THEN 1 ELSE 0 END) AS co_ma_dang,
            SUM(CASE WHEN d.co IS NULL AND c.co = 1 THEN 1 ELSE 0 END) AS chi_co_chuyen_de,
            SUM(CASE WHEN d.co IS NULL AND c.co IS NULL THEN 1 ELSE 0 END) AS khong_co_gi
       FROM q LEFT JOIN d ON d.qid = q.qid LEFT JOIN c ON c.qid = q.qid`,
  ).first<Record<string, number>>()
  const tong = Number(r?.tong_qid) || 0
  const coMa = Number(r?.co_ma_dang) || 0
  return {
    ok: true,
    tongQid: tong,
    coMaDang: coMa,
    chiCoChuyenDe: Number(r?.chi_co_chuyen_de) || 0,
    khongCoGi: Number(r?.khong_co_gi) || 0,
    tiLeCoMaDang: tong ? Math.round((coMa / tong) * 1000) / 10 : null,
  }
}
