// OMNI 3 — P VI KỸ NĂNG (BKT hội qua cổng AND có nhiễu) + SƠ Ý RIÊNG + TỐC ĐỘ RIÊNG + KHUNG GIỜ + SPRT. LÕI THUẦN.
// Không đọc D1, không đọc đồng hồ, không Math.random: cùng tập sự kiện (mọi thứ tự) ⇒ cùng hồ sơ (deep-equal).
// Đặc tả: DAC-TA-BUILD-OMNI-3-0510.md mục 4.1–4.4; công thức đã chạy trong docs/omni-0510/mo-phong-chac-8.mjs (hàm capNhat).
import { CAC_KHUNG_GIO, MUC_DICH_LUOT, PHIEN_BAN_OMNI, THAM_SO_OMNI, khungGioCua, type HoSoOmniEm, type HoSoVkn, type KhungGio, type Phan, type QCau, type SuKienOmni, type ThamSoOmni, type XacNhanThay } from './omni-kieu'
import { buocSprtPhatLai, nguongSprt, trangThaiSprt } from './omni-sprt'
import { TIEN_TO_NEN } from './omni-q'
import { uocTau } from './omni-toc-do'

/** Đọc lời giải một câu (dòng purpose 'xem_loi_giai') ⇒ lượt làm câu ấy trong 12 giờ sau KHÔNG độc lập (đặc tả 4.1 "đọc lời giải 12 h"). */
export const MS_SAU_DOC_LOI_GIAI = 12 * 3_600_000
/** Đúng mà "Chưa chắc" ⇒ nghi đoán: G của quan sát nhân HE_SO_G_CHUA_CHAC, kẹp ≤ G_CHUA_CHAC_TOI_DA (nghiên cứu 4.3). */
export const HE_SO_G_CHUA_CHAC = 2
export const G_CHUA_CHAC_TOI_DA = 0.5
const MUC_DICH_XEM_LOI_GIAI = 'xem_loi_giai'

const boTrung = (ds: readonly string[] | null | undefined): string[] => [...new Set((ds ?? []).filter((k) => typeof k === 'string' && k.length > 0))]

/** Vi kỹ năng của ý `i` (Phần II): vknY[i] nếu có và không rỗng, vắng ⇒ vkn của câu. Không bao giờ rỗng (thiếu hết ⇒ `cau:<qid>`). */
export function vknCuaY(cau: QCau, i: number): string[] {
  const y = boTrung(cau.vknY?.[i])
  const ds = y.length ? y : boTrung(cau.vkn)
  return ds.length ? ds : [`cau:${cau.qid}`]
}
/** Vi kỹ năng CẢ CÂU (cổng AND): Phần II có vknY ⇒ hợp 4 ý; còn lại ⇒ vkn. Không bao giờ rỗng. */
export function vknCaCau(cau: QCau): string[] {
  if (cau.phan === 'II' && cau.vknY?.length) return boTrung([0, 1, 2, 3].flatMap((i) => vknCuaY(cau, i)))
  const ds = boTrung(cau.vkn)
  return ds.length ? ds : [`cau:${cau.qid}`]
}

/** Lõi Bayes hội + bước học: trả [vi kỹ năng, P mới] cho các vi kỹ năng (đã bỏ trùng) của `kn`. `lay` đọc P hiện tại. */
function buocHoi(lay: (k: string) => number, kn: readonly string[], dung: boolean, g: number, s: number, T: number, ts: ThamSoOmni): [string, number][] {
  const ds = boTrung(kn)
  if (!ds.length) return []
  const pk = ds.map((k) => lay(k))
  const pall = pk.reduce((a, b) => a * b, 1)
  const pc = pall * (1 - s) + (1 - pall) * g
  const mau = dung ? pc : 1 - pc
  return ds.map((k, i): [string, number] => {
    const p = pk[i]!
    const pKhac = p > 0 ? pall / p : pk.reduce((a, b, j) => (j === i ? a : a * b), 1)
    const thich = mau > 0 ? (dung ? ((1 - s) * pKhac + g * (1 - pKhac)) / pc : (s * pKhac + (1 - g) * (1 - pKhac)) / (1 - pc)) : 1
    const pm = Math.min(ts.P_MAX, Math.max(ts.P_MIN, p * thich))
    return [k, pm + (1 - pm) * T]
  })
}

/**
 * Cập nhật Bayes HỘI cho các vi kỹ năng `kn` của MỘT quan sát (cổng AND: đúng cần ĐỦ mọi kỹ năng), rồi bước học T.
 *   pall = Π P[k]; pc = pall(1−s) + (1−pall)g
 *   đúng: P[k]' = P[k]·((1−s)·pKhac + g·(1−pKhac))/pc ; sai: P[k]' = P[k]·(s·pKhac + (1−g)(1−pKhac))/(1−pc), pKhac = pall/P[k]
 *   kẹp [P_MIN, P_MAX] rồi P'' = P' + (1−P')·T. Kỹ năng không có trong P ⇒ dùng P0. Trả object MỚI (không sửa đầu vào).
 * `kn` trùng ⇒ coi là một. Sai ⇒ kỹ năng P thấp hơn nhận nhiều "trách" hơn (giảm nhiều hơn); đúng ⇒ mọi kỹ năng cùng tăng.
 */
export function capNhatHoi(P: Readonly<Record<string, number>>, kn: readonly string[], dung: boolean, g: number, s: number, T: number, ts: ThamSoOmni = THAM_SO_OMNI): Record<string, number> {
  const moi: Record<string, number> = { ...P }
  for (const [k, p] of buocHoi((k) => P[k] ?? ts.P0, kn, dung, g, s, T, ts)) moi[k] = p
  return moi
}

export interface DauVaoPhatLai {
  suKien: readonly SuKienOmni[]
  /** Ma trận Q theo qid gốc. Câu không có trong map ⇒ bỏ qua sự kiện (không bịa vi kỹ năng). */
  q: ReadonlyMap<string, QCau>
  /** β câu = ln(ms) trung vị của lớp (omni_beta_cau). Vắng ⇒ nơi tính tốc độ dùng ước lượng theo phần × mức. */
  beta?: ReadonlyMap<string, number>
  xacNhan?: readonly XacNhanThay[]
  /** Prior theo vi kỹ năng (ca mở màn của em / prior lớp). Vắng ⇒ THAM_SO_OMNI.P0. */
  p0?: ReadonlyMap<string, number>
  /** Ngày VN "hôm nay" (đếm lượt lướt hôm nay). */
  homNay: string
  /** Bài (khoá) của câu trong phạm vi DẠY HỌC — để đếm "câu chưa gặp từ BÀI KHÁC" khi xét chuyển giao. */
  baiCuaQid?: ReadonlyMap<string, string>
  ts?: ThamSoOmni
}

interface DemVkn {
  nTuLam: number
  cau: Set<string>
  ngay: Set<string>
  nTroiChay: number
  nCauLaDung: number
  diemSprt: number
  ngayCuoi: string | null
  dayLai: boolean
  /** Bài → các câu (qid) đã có quan sát ở vi kỹ năng này (để biết "bài của đa số câu đã làm"). */
  baiDem: Map<string, Set<string>>
}

const thoiDiem = (e: SuKienOmni): number => {
  if (typeof e.receivedAt === 'number' && Number.isFinite(e.receivedAt)) return e.receivedAt
  const t = Date.parse(e.luc)
  return Number.isFinite(t) ? t : 0
}
const ngayVnTuMs = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
const soSanhChuoi = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)
/** Chuỗi chuẩn của một sự kiện (khoá sắp xếp) — chỉ để phân xử hai dòng cùng (receivedAt, khoa). */
const chuoiChuan = (e: SuKienOmni): string => JSON.stringify(e, Object.keys(e).sort())
/** Chủ của một vi kỹ năng theo quy ước id: `dang:<ma>` hoặc `<ma>#<số>`; `nen:*` dùng CHUNG mọi dạng ⇒ '' (không dạng nào sở hữu);
 *  id khác (cd:, cau:, tự đặt) ⇒ null (chưa rõ chủ). */
const dangChu = (k: string): string | null => {
  if (k.startsWith(TIEN_TO_NEN)) return ''
  if (k.startsWith('dang:')) return k.slice(5)
  const i = k.lastIndexOf('#')
  return i > 0 ? k.slice(0, i) : null
}
/** Câu `bai` có thuộc BÀI KHÁC bài của đa số câu đã làm ở vi kỹ năng không (chưa có câu nào biết bài ⇒ không). */
function laBaiKhac(baiDem: ReadonlyMap<string, ReadonlySet<string>>, bai: string): boolean {
  let max = 0
  for (const s of baiDem.values()) max = Math.max(max, s.size)
  return max > 0 && (baiDem.get(bai)?.size ?? 0) < max
}

/**
 * PHÁT LẠI TẤT ĐỊNH sổ của MỘT em ⇒ hồ sơ OMNI. Luật (đặc tả 4.1–4.4):
 *  · Sắp (receivedAt, khoa) tăng (thiếu receivedAt ⇒ Date.parse(luc)); dòng trùng y hệt chỉ tính một lần; dòng của SBD khác bị bỏ.
 *  · Lượt TỰ LÀM = purpose khác 'xem_loi_giai'/'luot', ketQua khác null, assistance = 'none' (lượt có hỗ trợ không là quan sát).
 *  · MỘT quan sát / câu (qid gốc) / ngày VN: lượt ĐẦU TIÊN của câu trong ngày, và chỉ khi lượt đó tự làm, độc lập (làm lại cùng ngày không
 *    đổi sai thành đúng; dòng đầu ngày là đọc lời giải / có hỗ trợ / lướt / bỏ trống ⇒ ngày đó không có quan sát của câu). Lượt trong
 *    MS_SAU_DOC_LOI_GIAI (12 h) sau dòng 'xem_loi_giai' của chính câu ấy không độc lập.
 *  · Phần II có `y` ⇒ MỖI Ý là một quan sát trên `vknY[i]` (vắng ⇒ vkn) với G.Y; không có `y` ⇒ một quan sát cả câu trên `vkn` với G.II_CA_CAU.
 *  · Trước khi cập nhật: nếu mọi vi kỹ năng cần có P ≥ P_VUNG_DO_SO_Y ⇒ lượt VỮNG: nVung += 1, sai ⇒ nSaiVung += 1; chắc-mà-sai (tuTin 'chac'
 *    tường minh) nhân đôi trọng số (nVung += 2, nSaiVung += 2 — S luôn ≤ 1). sEm = (nSaiVung + S0·S_AO)/(nVung + S_AO), tính lại NGAY sau
 *    lượt vững ấy (như mô phỏng) và dùng cho lần cập nhật này và mọi lần sau.
 *  · Đúng + tuTin 'chua_chac' ⇒ g × 2 (kẹp ≤ 0,5) cho quan sát đó (nghi đoán) và KHÔNG cộng bằng chứng "vững" (SPRT, trôi chảy, câu lạ, đóng dạy lại).
 *  · SPRT mỗi vi kỹ năng (omni-sprt `buocSprtPhatLai`: ý Đúng–sai p1 0,93; không xuống dưới ngưỡng dưới); nTroiChay đếm lượt đúng có nhanTocDo
 *    'troi_chay' (nhãn đã tính lúc chấm); nCau đếm content_group khác nhau (thiếu ⇒ qid); nNgay đếm ngày VN; nCauLaDung đếm câu CHƯA GẶP
 *    (chưa có dòng nào trước đó) thuộc bài KHÁC bài của đa số câu đã làm ở vi kỹ năng ấy (bài: baiCuaQid → khoaBai sự kiện → khoaBai Q),
 *    làm đúng ngay lần đầu.
 *  · Xác nhận thầy (phát lại cùng dòng thời gian, cùng mốc ⇒ sau sự kiện): 'vung' ⇒ P = XAC_NHAN.vung cho mọi vi kỹ năng của dạng, điểm SPRT
 *    = max(điểm, 0) + ngưỡng trên (≥ ngưỡng), hết dạy lại; 'day_lai' ⇒ P = XAC_NHAN.dayLai, điểm SPRT = ngưỡng dưới, dayLai = true (hết khi có
 *    lượt đúng tự làm sau đó). Vi kỹ năng của dạng = id `dang:<ma>`/`<ma>#…` đã biết + vi kỹ năng câu của dạng chưa rõ chủ (id tự đặt);
 *    KHÔNG gồm `nen:*` (kiến thức nền dùng chung mọi dạng) và vi kỹ năng của dạng khác.
 *  · τ = uocTau(β − ln ms) trên TAU_SO_MAU lượt đúng tự làm gần nhất có ms và có β lớp (thiếu β ⇒ bỏ mẫu), co về 0 bằng TAU_MAU_AO mẫu ảo.
 *  · Câu không có Q ⇒ không cập nhật vi kỹ năng/sơ ý; vẫn tính τ, khung giờ, lướt (không cần vi kỹ năng).
 *  · khungGio: đếm lượt thật (lượt tự làm + lướt) và lượt "sơ ý" (lướt + chắc-mà-sai + nhãn 'luot') theo khungGioCua(receivedAt).
 *    luotHomNay = số dòng purpose 'luot' ngày homNay. Hồ sơ có mọi vi kỹ năng đã quan sát / được thầy xác nhận / có prior trong `p0`.
 *  · cursor = `${receivedAt}|${khoa}` của sự kiện cuối (theo thứ tự phát lại); không có ⇒ ''.
 */
export function phatLaiEm(sbd: string, dv: DauVaoPhatLai): HoSoOmniEm {
  const ts = dv.ts ?? THAM_SO_OMNI
  const { tren, duoi } = nguongSprt(ts)

  // 1) Dòng thời gian: sự kiện (receivedAt, khoa, chuỗi chuẩn) — bỏ trùng y hệt; xác nhận thầy theo mốc (sau sự kiện cùng mốc).
  const chuan = new Map<SuKienOmni, string>()
  const layChuan = (e: SuKienOmni): string => {
    let c = chuan.get(e)
    if (c === undefined) { c = chuoiChuan(e); chuan.set(e, c) }
    return c
  }
  const sapXep = dv.suKien
    .filter((e) => !!e && typeof e.qid === 'string' && (!e.sbd || e.sbd === sbd))
    .map((e) => ({ e, t: thoiDiem(e) }))
    .sort((a, b) => a.t - b.t || soSanhChuoi(a.e.khoa ?? '', b.e.khoa ?? '') || soSanhChuoi(layChuan(a.e), layChuan(b.e)))
  const suKien: { e: SuKienOmni; t: number }[] = []
  for (const x of sapXep) {
    const truoc = suKien[suKien.length - 1]
    if (truoc && truoc.t === x.t && truoc.e.khoa === x.e.khoa && layChuan(truoc.e) === layChuan(x.e)) continue
    suKien.push(x)
  }
  const xacNhan = (dv.xacNhan ?? [])
    .filter((x) => !!x && (!x.sbd || x.sbd === sbd) && (x.ket === 'vung' || x.ket === 'day_lai') && typeof x.maDang === 'string' && Number.isFinite(Date.parse(x.luc)))
    .map((x) => ({ x, t: Date.parse(x.luc) }))
    .sort((a, b) => a.t - b.t || soSanhChuoi(a.x.maDang, b.x.maDang) || soSanhChuoi(a.x.ket, b.x.ket))
    .filter((x, i, ds) => i === 0 || x.t !== ds[i - 1]!.t || x.x.maDang !== ds[i - 1]!.x.maDang || x.x.ket !== ds[i - 1]!.x.ket)

  // 2) Trạng thái phát lại.
  const P = new Map<string, number>()
  const dem = new Map<string, DemVkn>()
  const dam = (k: string): DemVkn => {
    if (!P.has(k)) P.set(k, dv.p0?.get(k) ?? ts.P0)
    let d = dem.get(k)
    if (!d) {
      d = { nTuLam: 0, cau: new Set(), ngay: new Set(), nTroiChay: 0, nCauLaDung: 0, diemSprt: 0, ngayCuoi: null, dayLai: false, baiDem: new Map() }
      dem.set(k, d)
    }
    return d
  }
  for (const k of [...(dv.p0?.keys() ?? [])].sort()) if (typeof k === 'string' && k) dam(k)
  let nVung = 0
  let nSaiVung = 0
  const sUoc = (): number => (nSaiVung + ts.S0 * ts.S_AO) / (nVung + ts.S_AO)
  const khungGio = Object.fromEntries(CAC_KHUNG_GIO.map((k) => [k, { n: 0, soY: 0 }])) as Record<KhungGio, { n: number; soY: number }>
  const daCham = new Set<string>()
  const daGap = new Set<string>()
  const docLoiGiaiLuc = new Map<string, number>()
  const mauTau: { betaLn: number; ms: number }[] = []
  let luotHomNay = 0

  /** Một quan sát trên tập `kn0`: đo sơ ý (lượt vững) → cập nhật Bayes hội + bước học → đếm + SPRT. Trả các vi kỹ năng đã dùng. */
  const quanSat = (kn0: readonly string[], dung: boolean, g0: number, laY: boolean, chac: boolean, chuaChac: boolean, ngay: string, nhom: string): string[] => {
    const kn = boTrung(kn0)
    if (!kn.length) return []
    for (const k of kn) dam(k)
    if (kn.every((k) => P.get(k)! >= ts.P_VUNG_DO_SO_Y)) {
      const w = !dung && chac ? 2 : 1
      nVung += w
      if (!dung) nSaiVung += w
    }
    const g = dung && chuaChac ? Math.min(G_CHUA_CHAC_TOI_DA, g0 * HE_SO_G_CHUA_CHAC) : g0
    for (const [k, p] of buocHoi((k) => P.get(k)!, kn, dung, g, sUoc(), ts.T, ts)) P.set(k, p)
    for (const k of kn) {
      const d = dem.get(k)!
      d.nTuLam++
      d.ngay.add(ngay)
      d.cau.add(nhom)
      if (d.ngayCuoi === null || ngay > d.ngayCuoi) d.ngayCuoi = ngay
      if (!(dung && chuaChac)) d.diemSprt = buocSprtPhatLai(d.diemSprt, dung, laY, ts)
    }
    return kn
  }

  /** Vi kỹ năng của một dạng (cho xác nhận thầy), sắp theo id; không biết gì ⇒ [`dang:<ma>`]. `nen:*` dùng chung ⇒ không bao giờ thuộc riêng dạng nào. */
  const vknCuaDang = (maDang: string): string[] => {
    const ds = new Set<string>()
    const cua = (k: string): boolean => dangChu(k) === maDang
    for (const k of P.keys()) if (cua(k)) ds.add(k)
    for (const q of dv.q.values()) {
      const tatCa = boTrung([...(q.vkn ?? []), ...(q.vknY ?? []).flat()])
      for (const k of tatCa) if (cua(k) || (q.maDang === maDang && dangChu(k) === null)) ds.add(k)
    }
    if (!ds.size) ds.add(`dang:${maDang}`)
    return [...ds].sort()
  }
  const apXacNhan = (x: XacNhanThay): void => {
    for (const k of vknCuaDang(x.maDang)) {
      const d = dam(k)
      if (x.ket === 'vung') {
        P.set(k, ts.XAC_NHAN.vung)
        d.diemSprt = Math.max(d.diemSprt, 0) + tren
        d.dayLai = false
      } else {
        P.set(k, ts.XAC_NHAN.dayLai)
        d.diemSprt = duoi
        d.dayLai = true
      }
    }
  }

  // 3) Phát lại theo dòng thời gian.
  let iXn = 0
  for (const { e, t } of suKien) {
    while (iXn < xacNhan.length && xacNhan[iXn]!.t < t) apXacNhan(xacNhan[iXn++]!.x)
    const qid = e.qid
    const ngay = e.ngayVn || ngayVnTuMs(t)
    const laLuot = e.purpose === MUC_DICH_LUOT
    const laXem = e.purpose === MUC_DICH_XEM_LOI_GIAI
    const tuLam = !laLuot && !laXem && (e.ketQua === 0 || e.ketQua === 1) && e.assistance === 'none'
    if (laLuot && ngay === dv.homNay) luotHomNay++
    const kg = khungGio[khungGioCua(t)]
    if (laLuot) {
      if (e.assistance !== 'assisted') { kg.n++; kg.soY++ }
    } else if (tuLam) {
      kg.n++
      if ((e.ketQua === 0 && e.tuTin === 'chac') || e.nhanTocDo === 'luot') kg.soY++
    }
    const khoaNgay = `${qid}|${ngay}`
    const dauNgay = !daCham.has(khoaNgay)
    daCham.add(khoaNgay)
    const daGapTruoc = daGap.has(qid)
    daGap.add(qid)
    const docLuc = docLoiGiaiLuc.get(qid)
    if (laXem) docLoiGiaiLuc.set(qid, t)
    if (!dauNgay || !tuLam) continue
    if (docLuc !== undefined && t - docLuc <= MS_SAU_DOC_LOI_GIAI) continue

    // Quan sát độc lập của câu trong ngày.
    const dung = e.ketQua === 1
    const chuaChac = e.tuTin === 'chua_chac'
    const chac = e.tuTin === 'chac'
    const beta = dv.beta?.get(qid)
    if (dung && !chuaChac && typeof beta === 'number' && Number.isFinite(beta) && typeof e.msLam === 'number' && e.msLam > 0 && e.msLam <= ts.MS_TOI_DA) {
      mauTau.push({ betaLn: beta, ms: e.msLam })
    }
    const q = dv.q.get(qid)
    if (!q) continue
    const phan: Phan = e.phan === 'I' || e.phan === 'II' || e.phan === 'III' ? e.phan : q.phan
    const nhom = e.contentGroup || q.contentGroup || qid
    const bai = dv.baiCuaQid?.get(qid) ?? e.khoaBai ?? q.khoaBai ?? null
    const dungTheoVkn = new Map<string, boolean>()
    const ghi = (kn: readonly string[], d: boolean): void => { for (const k of kn) dungTheoVkn.set(k, (dungTheoVkn.get(k) ?? true) && d) }
    const y = phan === 'II' && Array.isArray(e.y) && e.y.some((v) => v === 0 || v === 1) ? e.y : null
    if (y) {
      y.forEach((v, i) => {
        if (v === 0 || v === 1) ghi(quanSat(vknCuaY(q, i), v === 1, ts.G.Y, true, chac, chuaChac, ngay, nhom), v === 1)
      })
    } else {
      const g = phan === 'II' ? ts.G.II_CA_CAU : phan === 'III' ? ts.G.III : ts.G.I
      ghi(quanSat(q.vkn ?? [], dung, g, false, chac, chuaChac, ngay, nhom), dung)
    }
    for (const [k, d] of dungTheoVkn) {
      const x = dem.get(k)!
      if (d && !chuaChac) {
        if (dung && e.nhanTocDo === 'troi_chay') x.nTroiChay++
        if (!daGapTruoc && bai && laBaiKhac(x.baiDem, bai)) x.nCauLaDung++
        x.dayLai = false
      }
      if (bai) {
        const s = x.baiDem.get(bai) ?? new Set<string>()
        s.add(qid)
        x.baiDem.set(bai, s)
      }
    }
  }
  while (iXn < xacNhan.length) apXacNhan(xacNhan[iXn++]!.x)

  // 4) Kết quả (khoá vi kỹ năng sắp theo id).
  const tau = uocTau(mauTau, ts)
  const vkn: Record<string, HoSoVkn> = {}
  for (const k of [...dem.keys()].sort()) {
    const d = dem.get(k)!
    vkn[k] = {
      vkn: k, p: P.get(k)!, nTuLam: d.nTuLam, nCau: d.cau.size, nNgay: d.ngay.size, nTroiChay: d.nTroiChay, nCauLaDung: d.nCauLaDung,
      diemSprt: d.diemSprt, trangThai: trangThaiSprt(d.diemSprt, ts), ngayCuoi: d.ngayCuoi, dayLai: d.dayLai,
    }
  }
  const cuoi = suKien[suKien.length - 1]
  return {
    sbd, vkn, sEm: sUoc(), nVung, nSaiVung, tau: tau.tau, nTau: tau.n, khungGio, luotHomNay,
    cursor: cuoi ? `${cuoi.t}|${cuoi.e.khoa}` : '', phienBan: PHIEN_BAN_OMNI,
  }
}

/** P nắm của một tập vi kỹ năng (cổng AND) = Π P (trùng ⇒ một lần); vi kỹ năng chưa có hồ sơ ⇒ P0. */
export function pAnd(hs: Pick<HoSoOmniEm, 'vkn'>, kn: readonly string[], ts: ThamSoOmni = THAM_SO_OMNI): number {
  return boTrung(kn).reduce((s, k) => s * (hs.vkn[k]?.p ?? ts.P0), 1)
}
