// HÔM NAY · 4 BẢNG — LÕI THUẦN (thầy chốt bản vẽ 01/11, docs/ban-ve-hom-nay-4-bang-0111; hợp đồng src/lib/bon-bang-kieu.ts). Không đọc D1 (xem bon-chi-so-d1.ts).
//
// Hai trục, mỗi em bốn điểm 0–100, cửa sổ 14 ngày TRỌN tới hết hôm qua:
//   · CHẤT LƯỢNG — dựng trên ĐÚNG lượt làm câu + Mức làm của bộ xếp Học thật (danh-gia-hoc-that*.ts: giây đo thật, T_đọc, Thuộc, treo máy, song sinh, KTCN):
//       Học thật = 35% sửa ĐÚNG câu từng sai (cùng câu / song sinh, không phải lướt) + 25% lượt đọc đủ thời gian + 20% đúng ở câu mới lần đầu tự làm
//                  + 20% kiểm tra cá nhân khớp luyện tập; mỗi tỉ lệ lấy CẬN DƯỚI Wilson 90%; thiếu thành phần nào thì chia lại trọng số.
//       Đối phó  = 1,5 × phạt «chọn khi chưa đọc hết đề mà sai» + 1,5 × phạt «bấm lặp» + phạt treo máy / xem lời giải trước / thuộc đáp án không hiểu / rời
//                  màn khi thi (đúng số phạt có trần của bộ Học thật) + 20 khi luyện ≥ 70% mà kiểm tra cá nhân TB ≤ 5 + tới 15 khi bỏ mặc ≥ 50% câu sai. Trần 100.
//       Đối phó ≥ 30 ⇒ Học thật không quá 100 − Đối phó. Dưới 40 lượt có giây đo thật ⇒ cả hai = null (chưa đủ dữ liệu).
//   · CHĂM CHỈ — dựng trên ĐÚNG mức ngày / đã làm của Nhịp học (nhip-hoc.ts, ngày vào app, ngày bảo trì đã bỏ):
//       Chăm = 50% ngày đủ mức + 30% câu làm KỸ / câu được giao (câu chọn vội mà sai không tính) + 20% chuỗi ngày đủ mức gần nhất (đủ 7 ngày = trọn). Lười = 100 − Chăm.
//       Dưới 3 ngày phải làm ⇒ null.
// Bằng chứng: mỗi bảng 3–4 thẻ, CHỈ số đo + ví dụ có giờ (thầy 01/11: «ẩn phần cách tính, chỉ hiện các thông số sắc bén»). `so` của thẻ cùng khoá với `soLieu`
// ⇒ lệnh thầy điền «cả lớp» (trung vị) lúc trả lời.
import { canDuoiWilson, type DauVaoDanhGia, type KetQuaDanhGia, type LuotDanhGia } from './danh-gia-hoc-that'
import { LUOT_TOI_THIEU_BON, NGUONG_BANG, type DiemBon, type MaBang, type NgayBon, type TheBangChung, type ViDuBon } from '../../src/lib/bon-bang-kieu'

/** Ví dụ thô: `qid` để lệnh thầy tra tên bài + đầu đề lúc trả lời. */
export type ViDuTho = Omit<ViDuBon, 'cau'> & { qid: string; cau?: string }
export type TheTho = Omit<TheBangChung, 'viDu'> & { viDu?: ViDuTho[] }

export interface NgayNhip { ngay: string; muc: number; lam: number }
export interface DauVaoBon {
  /** Kết quả + đầu vào của bộ Học thật trên CÙNG cửa sổ (null = không đọc được sổ lượt). */
  dg: { kq: KetQuaDanhGia; dauVao: DauVaoDanhGia } | null
  /** Ngày phải làm trong cửa sổ (đã bỏ hôm nay, ngày trước khi vào app, ngày bảo trì chưa đủ mức). */
  ngay: readonly NgayNhip[]
  /** Ngày gần nhất em có làm câu (mọi lúc, kể cả ngoài cửa sổ); '' = chưa bao giờ. */
  lanCuoiHoc: string
  /** Hôm qua (ngày cuối cửa sổ) — để nói «N ngày trước». */
  den: string
  /** CHỈ THÊM 01/11 (v2): số lần em CHỦ ĐỘNG hỏi (Hỏi thầy · hỏi trợ lý về câu) trong cửa sổ; không có ⇒ 0. */
  hoi?: number
}

/** Số đo của em — khoá trùng `TheBangChung.so` để lệnh thầy tính trung vị cả lớp. Mọi tỉ lệ là phần trăm 0–100. */
export interface SoLieuBon {
  soLuot: number
  soDo: number
  /** % lượt chọn khi chưa đọc hết đề (Mức 1), % lượt đủ thời gian đọc (không vội-sai, không treo). */
  voi: number | null
  ky: number | null
  /** % câu từng sai được sửa đúng thật; % câu sai bỏ mặc. */
  sua: number | null
  boMac: number | null
  /** % đúng câu mới lần đầu tự làm; % đúng bản song sinh của câu từng sai. */
  dungMoi: number | null
  songSinh: number | null
  /** % ngày đủ mức; % ngày có làm; % câu đã làm / được giao. */
  ngayDu: number | null
  ngayCoLam: number | null
  cauLam: number | null
  /** Giây trung vị mỗi lượt (đo thật). */
  giayTV: number | null
  /** v2 (01/11): % câu KHÓ (lớp đúng < 35%) em đúng nhanh hơn thời gian đọc đề; % câu đúng ngay sau khi rời app ≥ 8 giây; % ngày dồn hạn (≥ 70% câu sau 23:00);
   *  % ngày phớt lờ lời nhắc (21:00 còn thiếu mà không làm thêm); số lần chủ động hỏi. */
  nhanhLa?: number | null
  traNgoai?: number | null
  donHan?: number | null
  photLo?: number | null
  hoi?: number
  /** Phiên bản bộ máy (2 = v2). Bản cũ (không có) ⇒ cron tính lại. */
  ban?: number
  /** Quyết định vào bảng của v2 (đủ chắc mới xếp). */
  vao?: Record<MaBang, boolean>
  /** Lý do «Đang theo dõi» (có dấu hiệu nhưng chưa đủ chắc); null = không theo dõi. */
  theoDoi?: string | null
  /** Các họ bằng chứng Đối phó đã bật (0/1/2) — minh bạch, để soát. */
  ho?: Record<string, number>
}

export interface KetQuaBon {
  diem: DiemBon
  soLieu: SoLieuBon
  /** MỘT bằng chứng sắc nhất cho dòng bảng (nhấn bằng **…**). */
  bc: Record<MaBang, string>
  ketLuan: Record<MaBang, string>
  the: Record<MaBang, TheTho[]>
  ngay: NgayBon[]
}

const pt = (k: number, n: number): number | null => (n > 0 ? Math.round((100 * k) / n) : null)
const tron = (x: number) => Math.round(x)
const kep = (x: number, a = 0, b = 100) => Math.max(a, Math.min(b, x))
const so1 = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',')
const ngayNgan = (n: string) => (n ? `${n.slice(8, 10)}/${n.slice(5, 7)}` : '')
const cachNgay = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000)
const theoLuc = (a: LuotDanhGia, b: LuotDanhGia) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0)
const chuKq = (l: LuotDanhGia) => (l.dung === true ? 'đúng' : l.dung === false ? 'sai' : '—')
const trungVi = (xs: number[]): number | null => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const g = Math.floor(s.length / 2)
  return s.length % 2 ? s[g]! : (s[g - 1]! + s[g]!) / 2
}

/** Chuỗi bấm lặp dài nhất (Phần I, cùng ngày, cùng một chữ, ≥ 6 câu khác nhau, sai ≥ 50%) — đúng luật B2 của bộ Học thật. */
function chuoiLap(lam: readonly LuotDanhGia[]): { so: number; dai: LuotDanhGia[] } {
  const tn = lam.filter((l) => l.phan === 'I' && l.chon && /^[ABCD]$/.test(l.chon)).sort(theoLuc)
  let so = 0, dai: LuotDanhGia[] = []
  for (let i = 0; i < tn.length;) {
    let j = i + 1
    while (j < tn.length && tn[j]!.chon === tn[i]!.chon && tn[j]!.ngay === tn[i]!.ngay) j++
    const c = tn.slice(i, j)
    if (new Set(c.map((l, k) => l.cau ?? `#${i + k}`)).size >= 6 && c.filter((l) => l.dung === false).length >= 0.5 * c.length) {
      so++
      if (c.length > dai.length) dai = c
    }
    i = j
  }
  return { so, dai }
}

/** Câu từng sai (lần sai ĐẦU trong cửa sổ, cách ngày cuối ≥ 3 ngày ⇒ đã có thời gian sửa): sửa thật = sau đó đúng (cùng câu / song sinh) mà không phải bấm vội. */
function suaCauSai(lam: readonly LuotDanhGia[], den: string): { tong: number; sua: number; viDuSua: { sai: LuotDanhGia; dung: LuotDanhGia }[]; viDuBo: LuotDanhGia[] } {
  const sx = [...lam].sort(theoLuc)
  const saiDau = new Map<string, LuotDanhGia>()
  const suaBoi = new Map<string, LuotDanhGia>()
  for (const l of sx) {
    if (!l.cau) continue
    const s = saiDau.get(l.cau)
    if (!s) { if (l.dung === false) saiDau.set(l.cau, l); continue }
    if (!suaBoi.has(l.cau) && l.dung === true && l.ma !== 1) suaBoi.set(l.cau, l)
  }
  const du = [...saiDau.values()].filter((l) => l.ngay && cachNgay(l.ngay, den) >= 3)
  const da = du.filter((l) => suaBoi.has(l.cau!))
  return {
    tong: du.length,
    sua: da.length,
    viDuSua: da.slice(-2).reverse().map((sai) => ({ sai, dung: suaBoi.get(sai.cau!)! })),
    viDuBo: du.filter((l) => !suaBoi.has(l.cau!)).slice(-2).reverse(),
  }
}

/** Một em ⇒ 4 điểm + số đo + bằng chứng. Thuần. */
export function tinhBon(v: DauVaoBon): KetQuaBon {
  const lam = (v.dg?.dauVao.luot ?? []).filter((l) => l.dung !== null)
  const doLuot = lam.filter((l) => l.ma !== null && !l.treo)
  const treo = lam.filter((l) => l.treo)
  const voi = doLuot.filter((l) => l.ma === 1)
  const voiSai = voi.filter((l) => l.dung === false)
  const kyN = doLuot.length - voiSai.length
  const kyMau = doLuot.length + treo.length
  const sc = suaCauSai(lam, v.den)
  const lap = chuoiLap(lam)
  // Câu mới lần đầu tự làm: không phải song sinh, chưa gặp trước đó trong cửa sổ, không mở gợi ý.
  const daGap = new Set<string>()
  const moi: LuotDanhGia[] = []
  for (const l of [...lam].sort(theoLuc)) {
    if (l.cau && !daGap.has(l.cau) && !l.songSinh && !l.coGoiY) moi.push(l)
    if (l.cau) daGap.add(l.cau)
  }
  const ss = lam.filter((l) => l.songSinh)
  const kt = v.dg?.dauVao.ktcn
  const ktTB = kt && kt.diem.length ? kt.diem.reduce((s, x) => s + x, 0) / kt.diem.length : null
  const dungLuyen = lam.length ? lam.filter((l) => l.dung === true).length / lam.length : null
  const phat = (ma: string) => v.dg?.kq.phat.filter((p) => p.ma === ma).reduce((s, p) => s + p.diem, 0) ?? 0
  const giays = doLuot.map((l) => l.giay).filter((g): g is number => typeof g === 'number' && g > 0)
  const duDuLieu = doLuot.length >= LUOT_TOI_THIEU_BON

  // ───── Đối phó
  const lechKt = ktTB !== null && dungLuyen !== null && dungLuyen >= 0.7 && ktTB <= 5
  const boMacTiLe = sc.tong >= 5 ? (sc.tong - sc.sua) / sc.tong : 0
  const dpTho = 1.5 * phat('nhanMaSai') + 1.5 * phat('bamLap') + phat('treo') + phat('goiY') + phat('thuocKhongHieu') + phat('thi') + (lechKt ? 20 : 0) + (boMacTiLe >= 0.5 ? 15 * kep((boMacTiLe - 0.5) / 0.5, 0, 1) : 0)
  const dp = duDuLieu ? tron(kep(dpTho)) : null
  // ───── Học thật
  const tp: [number, number | null][] = [
    [0.35, sc.tong >= 3 ? canDuoiWilson(sc.sua, sc.tong) : null],
    [0.25, kyMau >= 20 ? canDuoiWilson(kyN, kyMau) : null],
    [0.2, moi.length >= 10 ? canDuoiWilson(moi.filter((l) => l.dung === true).length, moi.length) : null],
    [0.2, ktTB !== null && dungLuyen !== null ? kep(1 - Math.max(0, dungLuyen - ktTB / 10) / 0.4, 0, 1) : null],
  ]
  const tw = tp.reduce((s, [w, x]) => s + (x === null ? 0 : w), 0)
  let ht = duDuLieu && tw > 0 ? tron((100 * tp.reduce((s, [w, x]) => s + (x === null ? 0 : w * x), 0)) / tw) : null
  if (ht !== null && dp !== null && dp >= NGUONG_BANG.htDpDuoi) ht = Math.min(ht, 100 - dp)
  // ───── Chăm / Lười
  const ngay = v.ngay.filter((n) => n.muc > 0)
  const du = ngay.filter((n) => n.lam >= n.muc).length
  const coLam = ngay.filter((n) => n.lam > 0).length
  const giao = ngay.reduce((s, n) => s + n.muc, 0)
  const daLam = ngay.reduce((s, n) => s + n.lam, 0)
  let chuoi = 0
  for (let i = ngay.length - 1; i >= 0 && ngay[i]!.lam >= ngay[i]!.muc; i--) chuoi++

  const soLieu: SoLieuBon = {
    soLuot: lam.length, soDo: doLuot.length,
    voi: pt(voi.length, doLuot.length), ky: pt(kyN, kyMau), sua: pt(sc.sua, sc.tong), boMac: pt(sc.tong - sc.sua, sc.tong),
    dungMoi: pt(moi.filter((l) => l.dung === true).length, moi.length), songSinh: pt(ss.filter((l) => l.dung === true).length, ss.length),
    ngayDu: pt(du, ngay.length), ngayCoLam: pt(coLam, ngay.length), cauLam: pt(daLam, giao), giayTV: trungVi(giays),
  }

  // ═════ V2 (thầy 01/11: «tự đo tự làm tất tự tối ưu và phải đạt 99%») — CHẮC MỚI XẾP: mỗi bảng cần NHIỀU NHÓM bằng chứng độc lập + đủ mẫu (cận dưới Wilson);
  // có dấu hiệu mà chưa đủ ⇒ «Đang theo dõi» (không xếp sai). Bốn bảng loại trừ chéo: Học thật không thể Lười; Đối phó không được Chăm. Tự đo: tests/danh-gia-99-mo-phong.
  const gioVn = (l: LuotDanhGia) => { const t = Date.parse(l.luc); return Number.isFinite(t) ? new Date(t + 7 * 3_600_000).getUTCHours() : -1 }
  // Đúng nhanh bất thường ở câu KHÓ (lớp đúng < 35%): nhanh hơn 60% thời gian đọc đề (hoặc «thuộc») mà đúng ⇒ biết trước đáp án / chép.
  const khoDung = lam.filter((l) => l.dung === true && l.pLop !== null && l.pLop < 0.35 && !l.treo)
  const nhanhLa = khoDung.filter((l) => l.thuoc || (typeof l.giay === 'number' && typeof l.giayDoc === 'number' && l.giayDoc > 0 && l.giay < 0.6 * l.giayDoc))
  // Rời app ≥ 8 giây (chưa tới mức treo) rồi quay lại chọn ĐÚNG câu không dễ ⇒ nghi tra ngoài (Google / A.I / hỏi bạn).
  const dungHet = lam.filter((l) => l.dung === true && !l.treo)
  const traNgoai = dungHet.filter((l) => typeof l.an === 'number' && l.an >= 8 && l.an < 180 && (l.pLop === null || l.pLop < 0.6))
  // Theo ngày: câu làm THẬT (bỏ câu vội-sai, câu treo), dồn hạn, phớt lờ lời nhắc 21:00.
  const theoNgay = new Map<string, LuotDanhGia[]>()
  for (const l of lam) if (l.ngay) theoNgay.set(l.ngay, [...(theoNgay.get(l.ngay) ?? []), l])
  const xau = (l: LuotDanhGia) => !!l.treo || (l.ma === 1 && l.dung === false)
  const lamThat = (n: NgayNhip) => (v.dg ? Math.max(0, n.lam - (theoNgay.get(n.ngay) ?? []).filter(xau).length) : n.lam)
  const ngayDem = [...theoNgay.values()].filter((ds) => ds.length >= 10)
  const ngayDon = ngayDem.filter((ds) => ds.filter((l) => gioVn(l) >= 23).length >= 0.7 * ds.length).length
  const donHanTL = ngayDem.length ? ngayDon / ngayDem.length : 0
  const photLo = v.dg ? ngay.filter((n) => { const ds = theoNgay.get(n.ngay) ?? []; return n.lam < n.muc && ds.filter((l) => gioVn(l) >= 21).length === 0 && ds.filter((l) => gioVn(l) >= 0 && gioVn(l) < 21).length < n.muc }).length : 0
  const hoi = Math.max(0, v.hoi ?? 0)

  // Kiểm tra cá nhân KHỚP luyện tập (≥ 6 điểm, không thấp hơn luyện tập quá 1,5 điểm) = năng lực đã được xác nhận khi phải tự làm.
  const ktKhop = ktTB !== null && dungLuyen !== null && ktTB >= 6 && ktTB / 10 >= dungLuyen - 0.15
  // ── Đối phó: HỌ bằng chứng (0 / 1 / 2 = nhẹ / mạnh). Vào bảng khi ≥ 2 họ độc lập và tổng ≥ 3.
  const ho: Record<string, number> = {}
  const voiSaiTL = doLuot.length ? voiSai.length / doLuot.length : 0
  if (doLuot.length >= LUOT_TOI_THIEU_BON && voiSaiTL >= 0.15) ho.voi = voiSaiTL >= 0.3 ? 2 : 1
  if (lap.so) ho.lap = lap.so >= 3 ? 2 : 1
  if (treo.some((l) => l.treo === 'co_tinh')) ho.treo = 2
  else if (treo.length >= 3 && treo.length >= 0.05 * lam.length) ho.treo = 1
  if (phat('thuocKhongHieu') > 0) ho.thuoc = phat('thuocKhongHieu') >= 10 ? 2 : 1
  // Luyện tập cao hơn kiểm tra cá nhân: luật cũ (luyện ≥ 70%, kiểm tra ≤ 5) = mạnh; chênh từ 2,5 điểm trở lên mà kiểm tra ≤ 6 = nhẹ.
  if (lechKt) ho.lech = 2
  else if (ktTB !== null && dungLuyen !== null && ktTB <= 6 && ktTB / 10 <= dungLuyen - 0.25) ho.lech = 1
  if (sc.tong >= 8 && boMacTiLe >= 0.6) ho.boMac = 1
  // Kiểm tra khớp ⇒ «đúng nhanh câu khó» là GIỎI THẬT (không tính); «rời app rồi đúng» hạ còn nhẹ (có thể do thông báo, năng lực đã xác nhận).
  if (!ktKhop && nhanhLa.length >= 3 && nhanhLa.length >= 0.15 * khoDung.length) ho.nhanh = nhanhLa.length >= 5 && nhanhLa.length >= 0.3 * khoDung.length ? 2 : 1
  if (traNgoai.length >= 3 && traNgoai.length >= 0.1 * dungHet.length) ho.tra = !ktKhop && traNgoai.length >= 6 && traNgoai.length >= 0.2 * dungHet.length ? 2 : 1
  if (phat('goiY') > 0) ho.goiY = 1
  if (phat('thi') > 0) ho.thi = phat('thi') >= 20 ? 2 : 1
  const soHo = Object.keys(ho).length
  const manh = Object.values(ho).reduce((a, b) => a + b, 0)
  const vaoDp = duDuLieu && soHo >= 2 && manh >= 3
  const dp2 = duDuLieu ? tron(kep(0.6 * dpTho + 10 * manh)) : null

  // ── Học thật: 5 NHÓM; bắt buộc có «sửa sai thật» hoặc «kiểm tra khớp»; cần ≥ 3 nhóm đạt và KHÔNG có dấu hiệu đối phó đáng kể.
  const kyThat = doLuot.length - voi.length // chọn vội mà ĐÚNG cũng không phải «đọc kỹ»
  const ssDung = ss.filter((l) => l.dung === true).length
  const nhom = {
    sua: sc.tong >= 4 && canDuoiWilson(sc.sua, sc.tong) >= 0.55,
    ky: kyMau >= 30 && canDuoiWilson(kyThat, kyMau) >= 0.8,
    moi: moi.length >= 10 && canDuoiWilson(moi.filter((l) => l.dung === true).length, moi.length) >= 0.5,
    kt: ktKhop,
    chu: hoi >= 1 || (ss.length >= 3 && canDuoiWilson(ssDung, ss.length) >= 0.5),
  }
  const soNhom = Object.values(nhom).filter(Boolean).length
  const vaoHt = duDuLieu && (nhom.sua || nhom.kt) && soNhom >= 3 && !vaoDp && manh <= 1 && ht !== null && ht >= NGUONG_BANG.ht

  // ── Chăm (chỉ tính câu làm THẬT) — Lười đo RIÊNG (không còn = 100 − Chăm).
  const n = ngay.length
  // đủ mức THẬT: câu làm thật ≥ 90% mức (một vài câu vội-sai trong ngày không làm mất ngày)
  const duThat = ngay.filter((x) => lamThat(x) >= 0.9 * x.muc).length
  const daLamThat = ngay.reduce((s2, x) => s2 + lamThat(x), 0)
  let chuoiThat = 0
  for (let i = n - 1; i >= 0 && lamThat(ngay[i]!) >= 0.9 * ngay[i]!.muc; i--) chuoiThat++
  const ch2 = n >= 3 ? tron(100 * (0.5 * (duThat / n) + 0.2 * Math.min(1, daLamThat / Math.max(1, giao)) + 0.15 * Math.min(1, chuoiThat / 7) + 0.15 * (1 - donHanTL))) : null
  const vaoCh = n >= 5 && ch2 !== null && ch2 >= 80 && duThat >= 0.8 * n && donHanTL < 0.5 && !vaoDp && manh < 2 // có dấu hiệu đối phó mạnh ⇒ không Chăm (theo dõi)
  const khongNgay = n - coLam
  const boKt = v.dg?.dauVao.ktcn.boHan ?? 0
  const boMacMoi = sc.tong >= 3 ? (sc.tong - sc.sua) / sc.tong : 0
  // vắng hẳn cả cửa sổ ⇒ 100; còn lại: ngày không làm (55%) · câu được giao chưa làm thật (25%) · phớt lờ lời nhắc (10%) · bỏ mặc câu sai / bỏ kiểm tra cá nhân (10%)
  const boTerm = coLam === 0 ? 1 : Math.max(boMacMoi, Math.min(1, boKt / 2))
  const lu2 = n >= 3 ? tron(100 * (0.55 * (khongNgay / n) + 0.25 * (1 - Math.min(1, daLamThat / Math.max(1, giao))) + 0.1 * (photLo / n) + 0.1 * boTerm)) : null
  const vaoLu = n >= 5 && lu2 !== null && lu2 >= 55 && khongNgay >= 0.4 * n && !vaoHt

  const vao: Record<MaBang, boolean> = { ht: vaoHt, dp: vaoDp, ch: vaoCh && !vaoLu, lu: vaoLu }
  const theoDoi = vao.ht || vao.dp || vao.ch || vao.lu ? null
    : !duDuLieu && n < 5 ? null
    : manh >= 2 ? 'Có dấu hiệu đối phó nhưng chưa đủ hai nhóm bằng chứng'
    : ht !== null && ht >= 70 && !(nhom.sua || nhom.kt) ? 'Làm kỹ nhưng chưa có bằng chứng sửa sai / kiểm tra khớp'
    : ht !== null && ht >= 70 ? 'Gần đạt Học thật, cần thêm bằng chứng'
    : ch2 !== null && ch2 >= 70 ? (donHanTL >= 0.5 ? 'Làm đủ nhưng hay dồn sát giờ chốt' : 'Gần đạt Chăm')
    : lu2 !== null && lu2 >= 45 ? 'Có dấu hiệu lười, chưa đủ ngày để kết luận'
    : null
  ht = ht === null ? null : vaoDp ? Math.min(ht, 100 - (dp2 ?? 0)) : ht
  Object.assign(soLieu, {
    nhanhLa: pt(nhanhLa.length, khoDung.length), traNgoai: pt(traNgoai.length, dungHet.length), donHan: ngayDem.length ? tron(100 * donHanTL) : null,
    photLo: v.dg && n ? pt(photLo, n) : null, hoi, ban: 2, vao, theoDoi, ho,
  })

  // ───── Ví dụ
  const viDuVoi = (l: LuotDanhGia): ViDuTho => ({
    luc: l.luc, qid: l.qid ?? l.cau ?? '',
    phu: l.giayDoc ? `cần ít nhất ${tron(l.giayDoc)} giây để đọc đề` : 'chọn trước khi đọc xong đề',
    kq: `chọn sau ${l.giay ? tron(l.giay) : '?'} giây${l.chon ? ` · ${l.chon}` : ''} · ${chuKq(l)}`, dung: l.dung,
  })
  const ngayVi = (l: LuotDanhGia) => ngayNgan(l.ngay)

  // ───── Thẻ Đối phó (xếp từ mạnh tới nhẹ theo phạt)
  const theDp: (TheTho & { w: number })[] = []
  if (voi.length) theDp.push({ w: 1.5 * phat('nhanMaSai') + 0.1, ma: 'voi', tieu: 'Chọn đáp án khi chưa kịp đọc hết đề', lon: `${voi.length}/${doLuot.length}`, nhoSo: `lượt · ${soLieu.voi}%`, so: soLieu.voi ?? undefined,
    viDu: voiSai.sort(theoLuc).slice(-3).reverse().map(viDuVoi),
    chu: `Trong ${voi.length} câu này em sai ${voiSai.length} câu (${pt(voiSai.length, voi.length)}%).${doLuot.length > voi.length ? ` Ở những câu đọc đủ thời gian, em đúng ${pt(doLuot.filter((l) => l.ma !== 1 && l.dung === true).length, doLuot.length - voi.length)}%.` : ''}` })
  if (lap.so) {
    const d = lap.dai
    const giay = Math.max(1, (Date.parse(d[d.length - 1]!.luc) - Date.parse(d[0]!.luc)) / 1000)
    theDp.push({ w: 1.5 * phat('bamLap') + 0.1, ma: 'lap', tieu: 'Bấm cùng một chữ nhiều câu liền', lon: `${lap.so}`, nhoSo: 'chuỗi từ 6 câu', chuoi: { chu: d.map((l) => l.chon).join(''), dung: d.map((l, i) => (l.dung === true ? i : -1)).filter((i) => i >= 0) },
      chu: `Dài nhất: ${ngayVi(d[0]!)} **${d.length} câu liền chọn ${d[0]!.chon} trong ${tron(giay)} giây** (trung bình ${tron(giay / d.length)} giây/câu), đúng ${d.filter((l) => l.dung === true).length}/${d.length}.` })
  }
  if (lechKt && ktTB !== null && dungLuyen !== null) theDp.push({ w: 20, ma: 'lech', tieu: 'Luyện tập cao, kiểm tra thấp', lon: `${tron(dungLuyen * 100)}% → ${so1(ktTB)}`,
    hai: [{ nhan: 'Luyện tập · 14 ngày', so: `${tron(dungLuyen * 100)}%`, phu: `${lam.filter((l) => l.dung === true).length}/${lam.length} câu đúng` }, { nhan: `Kiểm tra cá nhân · ${kt!.diem.length} bài`, so: `${so1(ktTB)}/10`, phu: 'tự làm một lần, không lời giải', lech: true }],
    chu: 'Khi có lời giải và làm lại được, em đúng nhiều; khi phải tự làm một lần, điểm thấp hẳn.' })
  if (sc.tong >= 5 && sc.tong - sc.sua > 0) theDp.push({ w: boMacTiLe >= 0.5 ? 15 * boMacTiLe : 1, ma: 'boMac', tieu: 'Câu sai để đó không sửa', lon: `${sc.tong - sc.sua}/${sc.tong}`, nhoSo: 'câu', so: soLieu.boMac ?? undefined,
    viDu: sc.viDuBo.map((l) => ({ luc: l.luc, qid: l.qid ?? l.cau ?? '', phu: `sai ${ngayVi(l)}, quá 3 ngày chưa làm lại đúng`, kq: 'chưa sửa', dung: false })),
    chu: `Chỉ ${sc.sua}/${sc.tong} câu sai được em làm lại đúng sau 3 ngày.` })
  if (treo.length) theDp.push({ w: phat('treo'), ma: 'treo', tieu: 'Treo máy cho đủ giờ', lon: `${treo.length}`, nhoSo: 'lượt', chu: `${treo.length} lượt để máy đứng quá lâu mà không làm${v.dg?.kq.soLieu.ngayCoTinh ? `, ${v.dg.kq.soLieu.ngayCoTinh} ngày cố tình treo máy` : ''}.` })
  const goiY = lam.filter((l) => l.coGoiY).length
  if (phat('goiY') > 0) theDp.push({ w: phat('goiY'), ma: 'goiY', tieu: 'Mở lời giải trước khi tự làm', lon: `${goiY}/${lam.length}`, nhoSo: 'lượt' })
  if (phat('thuocKhongHieu') > 0) theDp.push({ w: phat('thuocKhongHieu'), ma: 'songSinh', tieu: 'Thuộc đáp án, đổi số liệu là sai', lon: `${soLieu.songSinh ?? 0}%`, nhoSo: 'đúng câu song sinh', so: soLieu.songSinh ?? undefined,
    chu: v.dg!.kq.phat.find((p) => p.ma === 'thuocKhongHieu')?.chu.replace(/^câu từng sai: /, 'Câu từng sai: ') })
  if (phat('thi') > 0) theDp.push({ w: phat('thi'), ma: 'thi', tieu: 'Rời màn hình khi thi', lon: v.dg!.kq.phat.find((p) => p.ma === 'thi')?.chu.match(/^\d+/)?.[0] ?? '!', nhoSo: 'bài', chu: v.dg!.kq.phat.filter((p) => p.ma === 'thi').map((p) => p.chu).join(' · ') })
  theDp.sort((a, b) => b.w - a.w)

  // ───── Thẻ Học thật
  const theHt: TheTho[] = []
  if (sc.tong) theHt.push({ ma: 'sua', tieu: 'Sửa câu sai đến khi đúng', lon: `${sc.sua}/${sc.tong}`, nhoSo: `câu · ${soLieu.sua}%`, so: soLieu.sua ?? undefined,
    viDu: sc.viDuSua.map(({ sai, dung }) => ({ luc: dung.luc, qid: dung.qid ?? dung.cau ?? '', phu: `sai ${ngayVi(sai)} → làm lại${dung.songSinh ? ' câu song sinh khác số liệu' : ''} ${ngayVi(dung)}`, kq: `đúng${dung.giay ? ` · ${tron(dung.giay)} giây` : ''}`, dung: true })) })
  if (ss.length >= 3) theHt.push({ ma: 'songSinh', tieu: 'Làm đúng câu song sinh khác số liệu', lon: `${ss.filter((l) => l.dung === true).length}/${ss.length}`, so: soLieu.songSinh ?? undefined, chu: 'Câu song sinh giữ cách làm nhưng đổi số liệu và thứ tự phương án — đúng câu này là hiểu cách làm, không nhớ đáp án.' })
  if (kyMau) theHt.push({ ma: 'ky', tieu: 'Đọc kỹ trước khi chọn', lon: `${soLieu.ky}%`, nhoSo: 'lượt đủ thời gian đọc', so: soLieu.ky ?? undefined, chu: soLieu.giayTV !== null ? `Trung vị ${tron(soLieu.giayTV)} giây mỗi câu.` : undefined })
  if (ktTB !== null && dungLuyen !== null) theHt.push({ ma: 'khop', tieu: lechKt ? 'Kiểm tra thấp hơn luyện tập' : 'Kiểm tra khớp luyện tập', lon: `${tron(dungLuyen * 100)}% → ${so1(ktTB)}`,
    hai: [{ nhan: 'Luyện tập · 14 ngày', so: `${tron(dungLuyen * 100)}%`, phu: `${lam.filter((l) => l.dung === true).length}/${lam.length} câu đúng` }, { nhan: `Kiểm tra cá nhân · ${kt!.diem.length} bài`, so: `${so1(ktTB)}/10`, phu: 'tự làm một lần', ...(lechKt ? { lech: true } : {}) }] })
  if (moi.length >= 10) theHt.push({ ma: 'dungMoi', tieu: 'Đúng ở câu mới lần đầu tự làm', lon: `${moi.filter((l) => l.dung === true).length}/${moi.length}`, so: soLieu.dungMoi ?? undefined })

  // ───── Thẻ Chăm / Lười
  const theCh: TheTho[] = []
  if (ngay.length) theCh.push({ ma: 'ngayDu', tieu: 'Đủ mức mỗi ngày', lon: `${du}/${ngay.length}`, nhoSo: 'ngày', so: soLieu.ngayDu ?? undefined })
  if (giao) theCh.push({ ma: 'cauLam', tieu: 'Làm đủ số câu được giao', lon: `${daLam}/${giao}`, nhoSo: 'câu', so: Math.min(100, soLieu.cauLam ?? 0) })
  if (kyMau) theCh.push({ ma: 'ky', tieu: 'Câu nào cũng làm thật', lon: `${soLieu.ky}%`, nhoSo: 'câu làm kỹ', so: soLieu.ky ?? undefined, chu: 'Câu chọn khi chưa đọc hết đề mà sai KHÔNG được tính vào Chăm.' })
  theCh.push({ ma: 'chuoi', tieu: 'Chuỗi ngày đủ mức', lon: `${chuoi}`, nhoSo: 'ngày liền' })
  const theLu: TheTho[] = []
  // lần cuối học = ngày muộn nhất giữa sổ học (su_kien_hoc) và các ngày trong cửa sổ có làm câu — sổ trống mà em có làm ⇒ không được nói «chưa làm câu nào»
  const lanCuoi = [v.lanCuoiHoc, ...ngay.filter((n) => n.lam > 0).map((n) => n.ngay)].filter(Boolean).sort().pop() ?? ''
  const khong = ngay.length - coLam
  if (ngay.length) theLu.push({ ma: 'ngayCoLam', tieu: khong ? 'Ngày không làm câu nào' : 'Ngày có làm', lon: `${khong ? khong : coLam}/${ngay.length}`, nhoSo: 'ngày', so: soLieu.ngayCoLam ?? undefined, chu: khong ? `Có làm ${coLam}/${ngay.length} ngày, đủ mức ${du} ngày.` : undefined })
  if (lanCuoi) theLu.push({ ma: 'lanCuoi', tieu: 'Lần cuối học', lon: ngayNgan(lanCuoi), nhoSo: lanCuoi > v.den ? 'hôm nay' : cachNgay(lanCuoi, v.den) > 0 ? `${cachNgay(lanCuoi, v.den) + 1} ngày trước` : 'hôm qua' })
  else theLu.push({ ma: 'lanCuoi', tieu: 'Lần cuối học', lon: 'chưa có', nhoSo: 'em chưa làm câu nào' })
  if (giao) theLu.push({ ma: 'cauLam', tieu: 'Câu được giao chưa làm', lon: `${Math.max(0, giao - daLam)}/${giao}`, nhoSo: 'câu', so: Math.min(100, soLieu.cauLam ?? 0) })
  if (sc.tong - sc.sua > 0) theLu.push({ ma: 'boMac', tieu: 'Câu sai chưa sửa', lon: `${sc.tong - sc.sua}`, nhoSo: 'câu', so: soLieu.boMac ?? undefined })

  // ───── Một dòng + kết luận
  const nhan = (x: string) => `**${x}**`
  const bcDp = theDp[0] ? (theDp[0].ma === 'voi' ? `${nhan(`${soLieu.voi}%`)} câu chọn khi chưa đọc hết đề` : theDp[0].ma === 'lap' ? `Chọn ${nhan(lap.dai[0]!.chon ?? '')} liền ${nhan(`${lap.dai.length} câu`)}` : theDp[0].ma === 'lech' ? `Luyện đúng ${tron((dungLuyen ?? 0) * 100)}% · kiểm tra ${nhan(so1(ktTB ?? 0))}` : theDp[0].ma === 'boMac' ? `${nhan(`${sc.tong - sc.sua}/${sc.tong}`)} câu sai để đó không sửa` : `${theDp[0].tieu}: ${nhan(theDp[0].lon)}`) : ''
  const bc: Record<MaBang, string> = {
    ht: sc.tong >= 3 ? `Sửa đúng ${nhan(`${sc.sua}/${sc.tong}`)} câu từng sai` : soLieu.ky !== null ? `Đọc kỹ ${nhan(`${soLieu.ky}%`)} lượt` : '',
    dp: bcDp,
    ch: `Đủ mức ${nhan(`${du}/${ngay.length}`)} ngày${daLam ? ` · ${daLam} câu` : ''}`,
    lu: khong >= ngay.length && ngay.length ? `${nhan(`${khong}/${ngay.length}`)} ngày không làm${lanCuoi ? ` · lần cuối ${ngayNgan(lanCuoi)}` : ''}` : khong ? `${nhan(`${khong}/${ngay.length}`)} ngày không làm` : `Làm ${nhan(`${daLam}/${giao}`)} câu được giao`,
  }
  // KẾT LUẬN (thầy 01/11: «làm rõ ràng và nổi bật hơn, hai con số kia liền nhau, cách dòng xuống»): dòng đầu = nhận định; mỗi lý do MỘT DÒNG,
  // mở đầu bằng con số CÓ ĐƠN VỊ in đậm (không còn «treo máy cho đủ giờ: 16»). Màn bằng chứng tách theo «\n».
  const dong = (dau: string, ...y: string[]): string => [dau, ...y.filter(Boolean)].join('\n')
  const lyDoDp = (t: TheTho): string => {
    switch (t.ma) {
      case 'voi': return `${nhan(`${soLieu.voi}%`)} số câu chọn đáp án khi chưa kịp đọc hết đề — sai ${voiSai.length}/${voi.length} câu`
      case 'lap': return `${nhan(`${lap.so} lần`)} bấm cùng một chữ từ 6 câu liền trở lên`
      case 'lech': return `${nhan(`${so1(ktTB ?? 0)} điểm`)} kiểm tra cá nhân, dù luyện tập đúng ${tron((dungLuyen ?? 0) * 100)}%`
      case 'boMac': return `${nhan(`${sc.tong - sc.sua}/${sc.tong} câu sai`)} để đó không sửa`
      case 'treo': return `${nhan(`${treo.length} lượt`)} treo máy cho đủ giờ — để máy đứng quá lâu mà không làm`
      case 'goiY': return `${nhan(`${goiY}/${lam.length} lượt`)} mở lời giải trước khi tự làm`
      case 'songSinh': return `${nhan(`${soLieu.songSinh ?? 0}%`)} câu song sinh đổi số liệu làm đúng — thuộc đáp án, chưa hiểu bài`
      case 'thi': return `${nhan(`${t.lon} bài`)} thi rời màn hình`
      default: return `${nhan(`${t.lon}${t.nhoSo ? ` ${t.nhoSo}` : ''}`)} ${t.tieu.toLowerCase()}`
    }
  }
  const kl: Record<MaBang, string> = {
    dp: dong(du ? `Em làm ${du}/${ngay.length} ngày đủ mức nhưng làm cho có:` : 'Em làm cho có:', ...theDp.slice(0, 3).map(lyDoDp)),
    ht: dong('Em học thật:',
      sc.tong >= 3 ? `${nhan(`${sc.sua}/${sc.tong} câu`)} từng sai đã sửa đến khi đúng` : '',
      soLieu.ky !== null ? `${nhan(`${soLieu.ky}%`)} lượt đọc đủ thời gian trước khi chọn` : '',
      ktTB !== null && !lechKt ? `${nhan(`${so1(ktTB)} điểm`)} kiểm tra cá nhân — khớp mức luyện tập ${tron((dungLuyen ?? 0) * 100)}%` : ''),
    ch: dong('Em chăm:',
      `${nhan(`${du}/${ngay.length} ngày`)} đủ mức`,
      `${nhan(`${daLam} câu`)} đã làm (mức giao ${giao})`,
      soLieu.ky !== null ? `${nhan(`${soLieu.ky}%`)} số câu làm kỹ` : '',
      `${nhan(`${chuoi} ngày`)} đủ mức liền nhau (chuỗi hiện tại)`),
    lu: dong('Em lười:',
      khong ? `${nhan(`${khong}/${ngay.length} ngày`)} gần nhất không làm câu nào` : `${nhan(`${du}/${ngay.length} ngày`)} đủ mức — có làm nhưng thiếu`,
      lanCuoi ? `${nhan(ngayNgan(lanCuoi))} là lần cuối em học` : 'Chưa từng làm câu nào',
      `${nhan(`${Math.max(0, giao - daLam)} câu`)} được giao chưa làm`,
      sc.tong - sc.sua > 0 ? `${nhan(`${sc.tong - sc.sua} câu sai`)} vẫn để nguyên` : ''),
  }


  // ───── 14 ngày (cột chồng)
  const voiNgay = new Map<string, number>()
  for (const l of voiSai) voiNgay.set(l.ngay, (voiNgay.get(l.ngay) ?? 0) + 1)
  const ngay14: NgayBon[] = v.ngay.map((n) => { const vo = Math.min(n.lam, voiNgay.get(n.ngay) ?? 0); return { ngay: n.ngay, muc: n.muc, ky: Math.max(0, n.lam - vo), voi: vo } })

  return {
    diem: { ht, dp: dp2, ch: ch2, lu: lu2 }, soLieu, bc, ketLuan: kl,
    the: { dp: theDp.map(({ w: _w, ...t }) => t).slice(0, 4), ht: theHt.slice(0, 4), ch: theCh.slice(0, 4), lu: theLu.slice(0, 4) },
    ngay: ngay14,
  }
}

/** Em có vào bảng không (ngưỡng hợp đồng). Thuần. */
export function vaoBang(d: DiemBon, b: MaBang): boolean {
  if (b === 'ht') return d.ht !== null && d.ht >= NGUONG_BANG.ht && (d.dp ?? 0) < NGUONG_BANG.htDpDuoi
  if (b === 'dp') return d.dp !== null && d.dp >= NGUONG_BANG.dp
  if (b === 'ch') return d.ch !== null && d.ch >= NGUONG_BANG.ch
  return d.lu !== null && d.lu >= NGUONG_BANG.lu
}

export { trungVi }
