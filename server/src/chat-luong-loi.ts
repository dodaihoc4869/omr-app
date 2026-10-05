// 5 THƯỚC ĐO CHẤT LƯỢNG SỬA LỖI THEO LỚP — app thầy (thầy 05/10: "làm tất nhé" — mục (6) của đề xuất cải thiện thuật toán: chỉnh luật theo SỐ
// THẬT, không cảm tính). CHỈ ĐỌC: không ghi bảng nào, không tạo bảng (route dùng bản đọc `envDoc`).
//
// Nguồn: sổ `su_kien_hoc` của các em trong lớp (từ TU_NGAY 29/09 — như luật đóng lỗi), `loi_giai_hoi` (mốc đọc lời giải), kho câu (dạng, tờ, tự luận),
// `cau_bo_tro` (câu có song sinh dùng được), tham số luật (chung `v2_tham_so` + riêng em `v2_tham_so_em`). Hàm THUẦN `tinhChatLuongLoi` (test không cần
// D1) + `gvChatLuongLoi` (lệnh `/gv/chat-luong-loi {lop?, soNgay?}`: một lô truy vấn theo SBD của MỘT lớp — không quét cả bảng).
//
// LƯỢT TỰ LÀM (luật đóng lỗi `loi-hoc-luat.ts`): không hỗ trợ (assistance khác 'assisted'), không phải dòng đọc lời giải / lướt, em không đọc lời giải câu
// đó (hay câu gốc mà nó thay thế) trong 12 giờ trước. Bỏ trống chỉ tính sai ở ca thi (kênh khác: chưa làm ⇒ không phải một lượt làm).
// CÂU GỐC: `q#n` (lượt lặp game) và `q~ssN` (song sinh, N bất kỳ — trần 2 → 4 bản) quy về `q`; dòng có `raw_json.tc = q` (câu thay thế, thang 4 bậc)
// là một lượt làm lại `q`, tính như song sinh.
// KHỐI (thầy 05/10: "chặn chuẩn 100% không được rút nhầm kho khác khối"): chỉ tính câu hợp khối của lớp — `cauHopKhoi` (src/lib/khoi-cau.ts) với khối lớp
// `khoiCuaEm({lop: khối, tenLop})`. Dòng của câu khác khối lọt vào sổ trước đây bị BỎ HẲN (cả câu thay thế khác khối), đếm ở `boKhacKhoi` (số câu gốc).
// Câu tự luận (kho) cũng bỏ — không vào vòng làm lại. Dòng câu nền (`nen:*`) bỏ.
// CỬA SỔ: `soNgay` ngày VN tính tới hôm nay (mặc định 14; trước 29/09 không có số). Mỗi số kèm n; n < N_TOI_THIEU (10) ⇒ `du: false` ("chưa đủ dữ liệu").
//
// 1. lamLaiDau — sau mỗi lượt tự làm SAI, lượt tự làm ĐẦU TIÊN của câu đó (câu gốc, song sinh hay câu thay thế) ở một NGÀY SAU ngày sai: tỉ lệ ĐÚNG.
//    Lượt cùng ngày với lần sai không phải lượt làm lại (em vừa thấy đáp án); lượt làm lại mà sai thì chờ lượt làm lại kế. n = số lượt làm lại đầu tiên.
// 2. saiLaiDuyTri[] — mỗi mốc kiểm duy trì của tham số chung (mặc định 14 và 30 ngày): `luotKiemDuyTri` (tu-hoan-thien.ts, số hiệu chỉnh tuần đang dùng)
//    với đúng mốc đó — sau mỗi lần đóng lỗi, lượt không hỗ trợ đầu tiên cách ngày đóng ≥ mốc: tỉ lệ SAI LẠI. n = số lượt kiểm rơi vào cửa sổ
//    (= đếm trên cả sổ − đếm trên phần sổ trước cửa sổ: lượt kiểm chỉ phụ thuộc các lượt trước nó).
// 3. ngayToiDong — mỗi lần ĐÓNG lỗi (phatLaiLoi: mở/chờ kiểm ⇒ đóng) có ngày đóng trong cửa sổ: số ngày từ lần sai cuối (`saiCuoi`) tới ngày đóng
//    (`dongNgay`); trả TRUNG VỊ. n = số lần đóng.
// 4. cauLaCungDang — chuyển giao, định nghĩa của OMNI (omni-p-vkn `phatLaiEm`, như `nCauLaDung`/`nTuLam`): quan sát độc lập = lượt ĐẦU TIÊN của câu trong
//    ngày, tự làm (không lướt, không dòng đọc lời giải, có kết quả, assistance 'none'), không trong 12 giờ sau dòng đọc lời giải của câu; câu LẠ = em chưa
//    có dòng sổ nào của câu gốc trước đó (kể cả trước 29/09); CÙNG DẠNG = `dang` trùng dạng của một câu em đã tự làm sai trước đó: tỉ lệ ĐÚNG. n = số quan sát.
// 5. lapNguyenVan — lượt làm (mọi lượt, kể cả có hỗ trợ) trong CỬA SỔ LỖI của câu (trạng thái phatLaiLoi trước lượt là mở / chờ kiểm) mà đề là NGUYÊN VĂN
//    câu đã sai: có cờ `raw_json.nv` ⇒ theo cờ (1 = nguyên văn); không cờ ⇒ cùng qid gốc, không song sinh, không câu thay thế, không bản xáo (`raw_json.xt = 1`).
//    `dat` = số lượt lặp nguyên văn, n = số lượt làm lại trong cửa sổ lỗi.
import type { Env } from './kieu'
import { GIO_DOC_LOI_GIAI_CAM, THAM_SO_GOC, TU_NGAY, cachNgay, congNgayVn, phatLaiLoi, type LanLamLoi, type ThamSoLuat } from './loi-hoc-luat'
import { docThamSo, luotKiemDuyTri } from './tu-hoan-thien'
import { MS_SAU_DOC_LOI_GIAI } from './omni-p-vkn'
import { MUC_DICH_LUOT } from './omni-kieu'
import { MUC_DICH_XEM_LOI_GIAI, ngayVn, phanTuQid } from './su-kien-hoc'
import { gvLop } from './ten-lop'
import { docCauKho, type CauKho } from './omni-d1'
import { boTroTheoQid } from './song-sinh-game'
import { songSinhDuDuLieu } from './cau-bo-tro'
import { gopDocD1 } from './doc-d1-theo-luot'
import { cauHopKhoi, khoiCuaEm } from '../../src/lib/khoi-cau'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))

/** Dưới số mẫu này một thước đo là "chưa đủ dữ liệu". */
export const N_TOI_THIEU = 10
export const SO_NGAY_MAC_DINH = 14
export const SO_NGAY_TOI_DA = 90
const MS_DOC_LOI_GIAI = GIO_DOC_LOI_GIAI_CAM * 3_600_000

/** Số ngày cửa sổ hợp lệ (số nguyên 1..90; lạ ⇒ 14). */
export function chuanSoNgay(v: unknown): number {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 && n <= SO_NGAY_TOI_DA ? n : SO_NGAY_MAC_DINH
}

/** qid ⇒ câu gốc: bỏ `#n` (lượt lặp của game), `~ssN` (song sinh, N bất kỳ) ⇒ câu gốc. */
export function gocCua(qid: unknown): { goc: string; songSinh: boolean } {
  const q = str(qid).trim().replace(/#\d+$/, '')
  const m = /^(.*)~ss(\d+)$/.exec(q)
  return m && m[1] ? { goc: m[1], songSinh: true } : { goc: q, songSinh: false }
}

/** Một dòng sổ đã đọc (đủ cột cho 5 thước đo). */
export interface DongSoCl {
  khoa?: string
  sbd: string
  qid: string
  nguon: string
  /** 1 đúng · 0 sai · null bỏ trống (chỉ ca thi tính là sai). */
  ketQua: 0 | 1 | null
  luc: string
  ngayVn: string
  /** '' | 'none' | 'assisted' | 'unknown'. */
  assistance?: string | null
  purpose?: string | null
  /** Cột `ma_dang` của sổ (chỉ có khi nguồn biết chắc) — dùng khi kho không có câu. */
  maDang?: string | null
  /** `raw_json.tc` — dòng này là câu THAY THẾ cho câu đã sai `tc`. */
  tc?: string | null
  /** `raw_json.nv` — cờ lặp nguyên văn (1) / không (0). */
  nv?: number | null
  /** `raw_json.xt` — bản xáo phương án/ý (1). */
  xt?: number | null
}

export interface DauVaoChatLuong {
  /** Dòng sổ từ TU_NGAY của các em trong lớp (đã bỏ dòng che — ca chưa công bố). */
  dong: readonly DongSoCl[]
  homNay: string
  soNgay?: number
  /** `${sbd}|${qid gốc}` đã có dòng sổ TRƯỚC TU_NGAY (để biết câu "chưa từng gặp"). */
  daGapTruoc?: ReadonlySet<string>
  /** `${sbd}|${qid gốc}` ⇒ mốc ISO em đọc lời giải (`loi_giai_hoi`). */
  docLoiGiai?: ReadonlyMap<string, readonly string[]>
  /** Dạng của câu gốc theo kho; vắng / null ⇒ cột `ma_dang` của sổ. */
  dangCua?: (qidGoc: string) => string | null
  /** Câu gốc hợp khối của lớp (`cauHopKhoi`). Vắng ⇒ mọi câu hợp. */
  hopKhoi?: (qidGoc: string) => boolean
  /** Câu tự luận (kho) ⇒ bỏ. */
  laTuLuan?: (qidGoc: string) => boolean
  /** Câu gốc có song sinh dùng được (`cau_bo_tro`). Vắng ⇒ suy từ sổ: em đã từng được ra song sinh / câu thay thế của câu. */
  coSongSinh?: (qidGoc: string) => boolean
  /** Tham số luật của em (`v2_tham_so_em` ⇒ chung). Vắng ⇒ THAM_SO_GOC. */
  thamSoEm?: (sbd: string) => ThamSoLuat
  /** Mốc kiểm duy trì báo cho thầy (tham số chung). Vắng ⇒ THAM_SO_GOC.mocDuyTri. */
  mocDuyTri?: readonly number[]
}

/** Một tỉ lệ: `dat` / `n` (null khi n = 0), `du` = n ≥ N_TOI_THIEU. */
export interface TiLeCl { tiLe: number | null; dat: number; n: number; du: boolean }
export interface KetQuaChatLuong {
  tuNgay: string
  denNgay: string
  soNgay: number
  nToiThieu: number
  /** 1 · `dat` = lượt làm lại đầu tiên ĐÚNG. */
  lamLaiDau: TiLeCl
  /** 2 · mỗi mốc: `dat` = lượt kiểm SAI LẠI. */
  saiLaiDuyTri: (TiLeCl & { moc: number })[]
  /** 3 · trung vị số ngày (có thể lẻ ,5), n = số lần đóng lỗi. */
  ngayToiDong: { trungVi: number | null; n: number; du: boolean }
  /** 4 · `dat` = câu lạ cùng dạng làm ĐÚNG. */
  cauLaCungDang: TiLeCl
  /** 5 · `dat` = lượt lặp NGUYÊN VĂN, n = lượt làm lại trong cửa sổ lỗi. */
  lapNguyenVan: TiLeCl
  /** Số câu gốc bị bỏ vì khác khối lớp (dữ liệu cũ lọt vào sổ). */
  boKhacKhoi: number
  /** Số em có ít nhất một lượt làm trong cửa sổ. */
  soEmCoLuot: number
}

const tiLe = (dat: number, n: number): TiLeCl => ({ tiLe: n > 0 ? dat / n : null, dat, n, du: n >= N_TOI_THIEU })
export function trungVi(ds: readonly number[]): number | null {
  if (!ds.length) return null
  const s = [...ds].sort((a, b) => a - b)
  const g = s.length >> 1
  return s.length % 2 ? s[g]! : (s[g - 1]! + s[g]!) / 2
}

/** Một dòng đã phân loại (nội bộ). */
interface DongPl {
  x: DongSoCl
  t: number
  /** Câu của CHÍNH dòng (câu thay thế ⇒ câu anh em). */
  goc: string
  /** Câu đã sai mà dòng này tính cho (câu thay thế ⇒ `tc`). */
  gocLoi: string
  songSinh: boolean
  thayThe: boolean
  laXem: boolean
  laLuot: boolean
  /** Một lượt làm (không đọc lời giải, không lướt; bỏ trống chỉ ở ca thi). */
  laLanLam: boolean
  /** Lượt làm có hỗ trợ HOẶC trong 12 giờ sau mốc đọc lời giải (câu của dòng hoặc câu gốc nó thay thế). */
  hoTro: boolean
}
interface LanCl extends LanLamLoi { nguyenVan: boolean }

const soCo = (v: unknown): 0 | 1 | null => (v === 1 || v === '1' || v === true ? 1 : v === 0 || v === '0' || v === false ? 0 : null)

/** TÍNH 5 THƯỚC ĐO (thuần, tất định). */
export function tinhChatLuongLoi(dv: DauVaoChatLuong): KetQuaChatLuong {
  const soNgay = chuanSoNgay(dv.soNgay ?? SO_NGAY_MAC_DINH)
  const denNgay = dv.homNay
  const tuCuaSo = congNgayVn(denNgay, -(soNgay - 1))
  const tuNgay = tuCuaSo < TU_NGAY ? TU_NGAY : tuCuaSo
  const trong = (ngay: string): boolean => ngay >= tuNgay && ngay <= denNgay
  const nho = <T>(f: (q: string) => T): ((q: string) => T) => { const m = new Map<string, T>(); return (q) => { if (!m.has(q)) m.set(q, f(q)); return m.get(q)! } }
  const hopKhoi = nho(dv.hopKhoi ?? (() => true))
  const laTuLuan = nho(dv.laTuLuan ?? (() => false))
  const mocDuyTri = (dv.mocDuyTri?.length ? dv.mocDuyTri : THAM_SO_GOC.mocDuyTri).filter((m) => Number.isFinite(m) && m > 0)
  const thamSoEm = dv.thamSoEm ?? (() => THAM_SO_GOC)

  // Dạng: kho ⇒ cột ma_dang đầu tiên khác rỗng của câu trong sổ.
  const dangSo = new Map<string, string>()
  for (const x of dv.dong) { const g = gocCua(x?.qid).goc, d = str(x?.maDang).trim(); if (g && d && !dangSo.has(g)) dangSo.set(g, d) }
  const dangCua = nho((g: string) => dv.dangCua?.(g) ?? dangSo.get(g) ?? null)

  // Mốc đọc lời giải: loi_giai_hoi + dòng 'xem_loi_giai' (khoá `${sbd}|${qid gốc}`).
  const docMs = new Map<string, number[]>()
  const themDoc = (k: string, luc: string): void => { const t = Date.parse(luc); if (Number.isFinite(t)) docMs.set(k, [...(docMs.get(k) ?? []), t]) }
  for (const [k, ds] of dv.docLoiGiai ?? []) for (const l of ds) themDoc(k, l)
  const sapXep = dv.dong
    .filter((x) => !!x && !!str(x.sbd) && !!gocCua(x.qid).goc && Number.isFinite(Date.parse(str(x.luc))) && !!str(x.ngayVn))
    .slice()
    .sort((a, b) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : str(a.khoa) < str(b.khoa) ? -1 : str(a.khoa) > str(b.khoa) ? 1 : 0))
  for (const x of sapXep) if (str(x.purpose) === MUC_DICH_XEM_LOI_GIAI) themDoc(`${x.sbd}|${gocCua(x.qid).goc}`, x.luc)
  const daDoc = (k: string, t: number): boolean => (docMs.get(k) ?? []).some((d) => d <= t && t - d < MS_DOC_LOI_GIAI)

  // 1) Phân loại dòng; bỏ câu nền, câu khác khối, câu tự luận.
  const boKhacKhoi = new Set<string>()
  const theoEm = new Map<string, DongPl[]>()
  const theoLoi = new Map<string, LanCl[]>()
  const emCoLuot = new Set<string>()
  for (const x of sapXep) {
    const sbd = str(x.sbd)
    const own = gocCua(x.qid)
    if (str(x.nguon) === 'nen' || own.goc.startsWith('nen:')) continue
    const tcGoc = x.tc ? gocCua(x.tc).goc : ''
    const thayThe = !!tcGoc && tcGoc !== own.goc
    const gocLoi = thayThe ? tcGoc : own.goc
    if (!hopKhoi(own.goc)) { boKhacKhoi.add(own.goc); continue }
    if (thayThe && !hopKhoi(gocLoi)) { boKhacKhoi.add(gocLoi); continue }
    if (laTuLuan(own.goc) || (thayThe && laTuLuan(gocLoi))) continue
    const purpose = str(x.purpose)
    const laXem = purpose === MUC_DICH_XEM_LOI_GIAI
    const laLuot = purpose === MUC_DICH_LUOT
    const coKetQua = x.ketQua === 0 || x.ketQua === 1 || (x.ketQua == null && str(x.nguon) === 'thi')
    const t = Date.parse(x.luc)
    const p: DongPl = {
      x, t, goc: own.goc, gocLoi, songSinh: own.songSinh, thayThe, laXem, laLuot,
      laLanLam: !laXem && !laLuot && coKetQua,
      hoTro: str(x.assistance) === 'assisted' || daDoc(`${sbd}|${own.goc}`, t) || (thayThe && daDoc(`${sbd}|${gocLoi}`, t)),
    }
    const dsEm = theoEm.get(sbd) ?? []
    dsEm.push(p)
    theoEm.set(sbd, dsEm)
    if (!p.laLanLam) continue
    if (trong(x.ngayVn)) emCoLuot.add(sbd)
    const nv = soCo(x.nv)
    const k = `${sbd}|${gocLoi}`
    const ds = theoLoi.get(k) ?? []
    ds.push({
      luc: x.luc, ngayVn: x.ngayVn, ketQua: x.ketQua === 1 ? 1 : 0, coHoTro: p.hoTro, songSinh: own.songSinh || thayThe, nguon: str(x.nguon),
      nguyenVan: nv !== null ? nv === 1 : !own.songSinh && !thayThe && soCo(x.xt) !== 1,
    })
    theoLoi.set(k, ds)
  }

  // 2) Thước đo 1, 2, 3, 5 theo (em, câu gốc) có ít nhất một lượt tự làm sai.
  let n1 = 0, d1 = 0, n5 = 0, d5 = 0
  const kiem = mocDuyTri.map(() => ({ n: 0, sai: 0 }))
  const ngayDong: number[] = []
  for (const [k, lan] of theoLoi) {
    if (!lan.some((l) => !l.coHoTro && l.ketQua !== 1)) continue
    const sbd = k.slice(0, k.indexOf('|'))
    const goc = k.slice(k.indexOf('|') + 1)
    const ts = thamSoEm(sbd)
    const coSS = dv.coSongSinh ? dv.coSongSinh(goc) : lan.some((l) => l.songSinh)
    // `coHoTro` đã gộp luật 12 giờ đọc lời giải (cả của câu thay thế) ⇒ không truyền mốc đọc riêng cho phatLaiLoi.
    const doc: string[] = []

    // 1 · lượt làm lại đầu tiên (ngày sau ngày sai).
    let cho: string | null = null
    for (const l of lan) {
      if (l.coHoTro) continue
      if (cho !== null && l.ngayVn > cho) {
        if (trong(l.ngayVn)) { n1++; if (l.ketQua === 1) d1++ }
        cho = null
      }
      if (l.ketQua !== 1) cho = l.ngayVn
    }

    // 2 · lượt kiểm duy trì (luotKiemDuyTri, từng mốc) rơi vào cửa sổ.
    const truocCuaSo = lan.filter((l) => l.ngayVn < tuNgay)
    mocDuyTri.forEach((moc, i) => {
      const tsMoc: ThamSoLuat = { ...ts, mocDuyTri: [moc] }
      const ca = luotKiemDuyTri(lan, doc, coSS, tsMoc)
      const truoc = truocCuaSo.length ? luotKiemDuyTri(truocCuaSo, doc, coSS, tsMoc) : { kiem: 0, saiLai: 0 }
      kiem[i]!.n += ca.kiem - truoc.kiem
      kiem[i]!.sai += ca.saiLai - truoc.saiLai
    })

    // 3 · lần đóng lỗi trong cửa sổ, 5 · lượt làm trong cửa sổ lỗi.
    for (let i = 0; i < lan.length; i++) {
      const l = lan[i]!
      if (!trong(l.ngayVn)) continue
      const truoc = phatLaiLoi(lan.slice(0, i), doc, coSS, denNgay, ts)
      const moLoi = truoc.trangThai === 'mo' || truoc.trangThai === 'cho_kiem'
      if (moLoi) { n5++; if (l.nguyenVan) d5++ }
      if (moLoi && !l.coHoTro && l.ketQua === 1) {
        const sau = phatLaiLoi(lan.slice(0, i + 1), doc, coSS, denNgay, ts)
        if (sau.trangThai === 'dong' && sau.dongNgay === l.ngayVn) ngayDong.push(cachNgay(sau.saiCuoi, sau.dongNgay))
      }
    }
  }

  // 3) Thước đo 4 — câu lạ cùng dạng (quan sát độc lập kiểu OMNI), theo từng em.
  let n4 = 0, d4 = 0
  for (const [sbd, ds] of theoEm) {
    const daGap = new Set<string>()
    const daCham = new Set<string>()
    const docLuc = new Map<string, number>()
    const dangCoLoi = new Set<string>()
    for (const p of ds) {
      const x = p.x
      const khoaNgay = `${p.goc}|${x.ngayVn}`
      const dauNgay = !daCham.has(khoaNgay)
      daCham.add(khoaNgay)
      const gapTruoc = daGap.has(p.goc) || !!dv.daGapTruoc?.has(`${sbd}|${p.goc}`)
      daGap.add(p.goc)
      const doc0 = docLuc.get(p.goc)
      if (p.laXem) docLuc.set(p.goc, p.t)
      const as = str(x.assistance)
      const tuLamOmni = !p.laLuot && !p.laXem && (x.ketQua === 0 || x.ketQua === 1) && (as === '' || as === 'none')
      const quanSat = dauNgay && tuLamOmni && !(doc0 !== undefined && p.t - doc0 <= MS_SAU_DOC_LOI_GIAI)
      const dang = dangCua(p.goc)
      if (quanSat && !gapTruoc && dang && dangCoLoi.has(dang) && trong(x.ngayVn)) { n4++; if (x.ketQua === 1) d4++ }
      // Dạng có lỗi: lượt TỰ LÀM sai (luật đóng lỗi) của câu khác khối đã bị bỏ ở trên.
      if (dang && p.laLanLam && !p.hoTro && x.ketQua !== 1) dangCoLoi.add(dang)
    }
  }

  return {
    tuNgay, denNgay, soNgay, nToiThieu: N_TOI_THIEU,
    lamLaiDau: tiLe(d1, n1),
    saiLaiDuyTri: mocDuyTri.map((moc, i) => ({ moc, ...tiLe(kiem[i]!.sai, kiem[i]!.n) })),
    ngayToiDong: { trungVi: trungVi(ngayDong), n: ngayDong.length, du: ngayDong.length >= N_TOI_THIEU },
    cauLaCungDang: tiLe(d4, n4),
    lapNguyenVan: tiLe(d5, n5),
    boKhacKhoi: boKhacKhoi.size,
    soEmCoLuot: emCoLuot.size,
  }
}

// ---------------------------------------------------------------- đọc D1 (một lớp)
const dsJson = (ds: Iterable<string>): string => JSON.stringify([...new Set(ds)])
const SQL_SO = (moi: boolean) => moi
  ? `SELECT khoa, sbd, qid, nguon, ket_qua, luc, ngay_vn, ma_dang, assistance, purpose,
      CASE WHEN json_valid(raw_json) THEN json_extract(raw_json, '$.tc') END AS tc,
      CASE WHEN json_valid(raw_json) THEN json_extract(raw_json, '$.nv') END AS nv,
      CASE WHEN json_valid(raw_json) THEN json_extract(raw_json, '$.xt') END AS xt
    FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn >= ? AND COALESCE(visibility, '') <> 'embargoed'`
  : 'SELECT khoa, sbd, qid, nguon, ket_qua, luc, ngay_vn, ma_dang FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn >= ?'
const dongSangCl = (x: Row): DongSoCl => ({
  khoa: str(x.khoa), sbd: str(x.sbd), qid: str(x.qid), nguon: str(x.nguon),
  ketQua: x.ket_qua == null || x.ket_qua === '' ? null : Number(x.ket_qua) === 1 ? 1 : 0,
  luc: str(x.luc), ngayVn: str(x.ngay_vn) || ngayVn(str(x.luc)),
  assistance: str(x.assistance), purpose: str(x.purpose), maDang: str(x.ma_dang).trim() || null,
  tc: str(x.tc).trim() || null, nv: soCo(x.nv), xt: soCo(x.xt),
})
/** Tham số riêng của em (như `docThamSoEm` của ca-nhan-hoa-v2): hợp lệ ⇒ gộp lên THAM_SO_GOC; không ⇒ null. */
export function thamSoEmTu(json: unknown): ThamSoLuat | null {
  try {
    const o = JSON.parse(str(json)) as ThamSoLuat
    return Number.isInteger(o.cachSaiCuoi) && Array.isArray(o.mocDuyTri) && o.mocDuyTri.length ? { ...THAM_SO_GOC, ...o } : null
  } catch {
    return null
  }
}

interface LopGv { tenLop: string; khoi: string; soEm: number; sbd: string[] }

/** 5 thước đo của MỘT lớp: một lô SELECT theo SBD của lớp (gộp bằng `gopDocD1`) + siêu dữ liệu câu. */
export async function chatLuongCuaLop(env0: Env, lop: LopGv, homNay: string, soNgay: number): Promise<{ kq: KetQuaChatLuong; soTruyVan: number }> {
  // Mọi SELECT phát cùng lúc ⇒ `gopDocD1` gộp thành MỘT lô D1 (lỗi một câu — bảng/cột chưa có — không làm mất các câu khác).
  const env: Env = { ...env0, DB: gopDocD1(env0.DB) }
  const sbds = [...new Set(lop.sbd.map(str).filter(Boolean))]
  let soTruyVan = 0
  const hoi = (sql: string, ...bien: unknown[]): Promise<Row[]> => {
    soTruyVan++
    return env.DB.prepare(sql).bind(...bien).all<Row>().then((r) => r.results ?? [])
  }
  const ds = dsJson(sbds)
  let rows: Row[] = [], gap: Row[] = [], doc: Row[] = [], tsRieng: Row[] = []
  let tsChung: ThamSoLuat = THAM_SO_GOC
  if (sbds.length) {
    soTruyVan++ // docThamSo
    ;[rows, gap, doc, tsRieng, tsChung] = await Promise.all([
      // D1 cũ thiếu cột CNH-1.0 ⇒ lùi câu SQL không có cột mới (như `docLanLam`).
      hoi(SQL_SO(true), ds, TU_NGAY).catch(() => hoi(SQL_SO(false), ds, TU_NGAY)).catch(() => [] as Row[]),
      // Câu đã gặp TRƯỚC 29/09 (chỉ mục phủ idx_skh_em_ngay_qid — không đọc dòng).
      hoi('SELECT DISTINCT sbd, qid FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn < ?', ds, TU_NGAY).catch(() => [] as Row[]),
      hoi('SELECT sbd, qid, luc FROM loi_giai_hoi WHERE sbd IN (SELECT value FROM json_each(?)) AND luc >= ?', ds, `${TU_NGAY}T00:00:00`).catch(() => [] as Row[]),
      hoi('SELECT sbd, tham_so_json FROM v2_tham_so_em WHERE sbd IN (SELECT value FROM json_each(?))', ds).catch(() => [] as Row[]),
      docThamSo(env),
    ])
  }
  const dong = rows.map(dongSangCl)
  const daGapTruoc = new Set(gap.map((x) => `${str(x.sbd)}|${gocCua(x.qid).goc}`))
  const docLoiGiai = new Map<string, string[]>()
  for (const x of doc) { const k = `${str(x.sbd)}|${gocCua(x.qid).goc}`; docLoiGiai.set(k, [...(docLoiGiai.get(k) ?? []), str(x.luc)]) }
  const tsEm = new Map<string, ThamSoLuat>()
  for (const x of tsRieng) { const t = thamSoEmTu(x.tham_so_json); if (t) tsEm.set(str(x.sbd), t) }

  // Siêu dữ liệu câu (dạng, tờ ⇒ khối, phần, tự luận) + câu có song sinh dùng được — cho câu gốc của mọi dòng (kể cả câu được thay thế).
  const qids = new Set<string>()
  const qidSai = new Set<string>()
  for (const x of dong) {
    const g = gocCua(x.qid).goc, tc = x.tc ? gocCua(x.tc).goc : ''
    if (g) qids.add(g)
    if (tc) { qids.add(tc); qidSai.add(tc) }
    if (g && (x.ketQua !== 1)) qidSai.add(g)
  }
  const dsSai = [...qidSai]
  const LO_BO_TRO = 400
  const loBoTro = Array.from({ length: Math.ceil(dsSai.length / LO_BO_TRO) }, (_, i) => dsSai.slice(i * LO_BO_TRO, (i + 1) * LO_BO_TRO))
  soTruyVan += Math.ceil(qids.size / 800) + loBoTro.length
  const [kho, boTroLo] = await Promise.all([
    docCauKho(env, [...qids]).catch(() => new Map<string, CauKho>()),
    // Cùng nguồn với kế hoạch ngày (`docBoTroLoi` ⇒ `boTroTheoQid`; lỗi đọc ⇒ rỗng = coi như không có song sinh, như luật đang chạy).
    Promise.all(loBoTro.map((lo) => boTroTheoQid(env, lo))),
  ])
  const coSS = new Set<string>()
  for (const m of boTroLo) for (const [q, bt] of m) {
    const phan = kho.get(q)?.phan ?? phanTuQid(q, 'I')
    if (bt.songSinh.some((ss) => songSinhDuDuLieu(phan, ss))) coSS.add(q)
  }
  const khoiLop = khoiCuaEm({ lop: lop.khoi, tenLop: lop.tenLop })
  const kq = tinhChatLuongLoi({
    dong, homNay, soNgay, daGapTruoc, docLoiGiai,
    dangCua: (g) => kho.get(g)?.dang ?? null,
    // Câu ở nhiều tờ ⇒ đưa đủ mọi tờ cho luật khối (khối của câu đọc từ tờ chứa nó).
    hopKhoi: (g) => { const m = kho.get(g); return cauHopKhoi(khoiLop, m ? { ...m, maDe: m.maDeDs.join(' ') } : { qid: g }) },
    laTuLuan: (g) => kho.get(g)?.tuLuan === true,
    coSongSinh: (g) => coSS.has(g),
    thamSoEm: (s) => tsEm.get(s) ?? tsChung,
    mocDuyTri: tsChung.mocDuyTri,
  })
  return { kq, soTruyVan }
}

/**
 * `POST /gv/chat-luong-loi {lop?, soNgay?}` (thầy, CHỈ ĐỌC): danh sách lớp (`/gv/lop`) + 5 thước đo của lớp `lop` (tên lớp như `/gv/lop`; vắng / không có ⇒
 * lớp đầu danh sách — `chon` nói lớp nào). Một lớp mỗi lượt gọi ⇒ không bao giờ đọc sổ của cả trường.
 */
export async function gvChatLuongLoi(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  const soNgay = chuanSoNgay(b.soNgay ?? SO_NGAY_MAC_DINH)
  const homNay = ngayVn(nowMs)
  const dsLop = await gvLop(env)
  if (dsLop.ok !== true) return { ok: false, error: str(dsLop.error) || 'Không đọc được danh sách lớp.' }
  const lopDs = (Array.isArray(dsLop.lop) ? dsLop.lop : []) as LopGv[]
  const muon = str(b.lop).trim()
  const chon = lopDs.find((l) => l.tenLop === muon) ?? lopDs[0] ?? null
  const lop = lopDs.map((l) => ({ tenLop: l.tenLop, khoi: l.khoi, soEm: l.soEm }))
  const chung = { ok: true, homNay, soNgay, nToiThieu: N_TOI_THIEU, lop }
  if (!chon) return { ...chung, chon: null, ketQua: null, soTruyVan: Number(dsLop.soTruyVan) || 0 }
  const { kq, soTruyVan } = await chatLuongCuaLop(env, chon, homNay, soNgay)
  return { ...chung, chon: chon.tenLop, ketQua: { tenLop: chon.tenLop, khoi: chon.khoi, soEm: chon.soEm, ...kq }, soTruyVan: (Number(dsLop.soTruyVan) || 0) + soTruyVan }
}
