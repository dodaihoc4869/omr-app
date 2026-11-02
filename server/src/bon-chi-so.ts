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
// Đợt 2 (01/11): máy em đo thêm trong lượt luyện tập (`src/lib/doi-dap-an.ts` → `raw_json.doc`): dd đổi lựa chọn · dq số phương án đã thử · ar giây rời app
// ngay trước lựa chọn cuối · rn số lần rời app ⇒ họ Đối phó «dò đáp án» (`ho.do`) + luật «tra ngoài» dùng `ar` khi có. Lượt cũ (chưa đo) ⇒ luật cũ.
// v3 (02/11, thầy: «Làm luôn với ca thi thật rồi đếm lại, lấy yếu tố đó làm chính, tính từng câu từng đơn vị kiến thức … thêm phần lên bảng đạt và chưa đạt»):
// HAI YẾU TỐ CHÍNH từ `bon-ca-thi.ts` — (1) ca thi thật so với luyện tập theo TỪNG đơn vị kiến thức (chuyên đề), hiệu chỉnh độ khó từng câu; (2) lên bảng /
// kiểm tra đầu giờ Đạt – Chưa đạt. Học thật: nhóm `ca` (ca thi khớp) / `bang` (lên bảng đạt) thay cho điều kiện «sửa sai hoặc kiểm tra khớp», trọng số lớn
// nhất trong điểm (35% + 15%); có bằng chứng NGƯỢC (`lechCa` / `bangChua`) ⇒ không vào Học thật. Đối phó: họ `lechCa` (tới 3 điểm mạnh — nặng nhất) +
// `bangChua`. Kiểm tra ôn tập (KTCN) giữ làm yếu tố phụ. Em chưa có ca thi / lên bảng trong 60 ngày ⇒ trục chất lượng quyết bằng hành vi + kiểm tra ôn tập (luật v2 + quyết nốt). Dòng sổ ca thi / lên bảng không còn trộn
// vào «luyện tập» (`nguon`).
// Bằng chứng: mỗi bảng 3–4 thẻ, CHỈ số đo + ví dụ có giờ (thầy 01/11: «ẩn phần cách tính, chỉ hiện các thông số sắc bén»). `so` của thẻ cùng khoá với `soLieu`
// ⇒ lệnh thầy điền «cả lớp» (trung vị) lúc trả lời.
import { canDuoiWilson, type DauVaoDanhGia, type KetQuaDanhGia, type LuotDanhGia } from './danh-gia-hoc-that'
import { LUOT_TOI_THIEU_BON, NGUONG_BANG, type DiemBon, type MaBang, type NgayBon, type TheBangChung, type ViDuBon } from '../../src/lib/bon-bang-kieu'
import { SO_NGAY_CA, tinhCaThi, type CauCaThi, type LuotBang, type LuyenCuDv } from './bon-ca-thi'

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
  /** CHỈ THÊM 02/11 (v3): câu ca thi thật · lần lên bảng / kiểm tra đầu giờ (60 ngày) · luyện tập cũ hơn 14 ngày gộp theo đơn vị. Vắng / rỗng ⇒ luật v2. */
  caThi?: readonly CauCaThi[]
  lenBang?: readonly LuotBang[]
  luyenCu?: readonly LuyenCuDv[]
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
  /** Đợt 2 (01/11): % lượt Phần I (có đo) em thử từ 3 phương án khác nhau trở lên trước khi bấm «Kiểm tra» (dò đáp án); null = chưa có lượt đo. */
  do?: number | null
  donHan?: number | null
  photLo?: number | null
  hoi?: number
  /** Phiên bản bộ máy (2 = v2). Bản cũ (không có) ⇒ cron tính lại. */
  ban?: number
  /** Quyết định vào bảng của v2 (đủ chắc mới xếp). */
  vao?: Record<MaBang, boolean>
  /** Lý do «Đang theo dõi» (có dấu hiệu nhưng chưa đủ chắc); null = không theo dõi. */
  theoDoi?: string | null
  /** Các họ bằng chứng Đối phó đã bật (0/1/2; `lechCa` tới 3) — minh bạch, để soát. */
  ho?: Record<string, number>
  /** v3 (02/11): CA THI — số câu thi trong 60 ngày · số câu đã ghép với luyện tập cùng đơn vị · % đúng câu ghép · % kỳ vọng (theo luyện + độ khó) · % đúng
   *  luyện tập cùng đơn vị · số đơn vị khớp / lệch · số ca lệch. LÊN BẢNG — % đạt · số lần · số đạt · số lần chưa đạt ở phần đã luyện đúng nhiều. */
  caCau?: number
  caGhep?: number
  caThi?: number | null
  caKyVong?: number | null
  luyenDv?: number | null
  dvKhop?: number
  dvLech?: number
  caLech?: number
  lenBang?: number | null
  bangTong?: number
  bangDat?: number
  bangChuaLq?: number
  /** v3: vào bảng NHỜ ca thi / lên bảng — 2 = không có hai yếu tố này thì KHÔNG vào · 1 = có làm bằng chứng nhưng vẫn vào · 0 = không dùng;
   *  `htRa` / `dpRa` = 1 khi hai yếu tố này đưa em RA khỏi bảng (bản không có chúng thì vào). Để đếm trên dữ liệu thật. */
  nho?: { ht: number; dp: number; htRa: number; dpRa: number }
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
/** Dòng sổ KHÔNG phải luyện tập (v3): ca thi, lên bảng, kiểm tra đầu giờ — đo riêng ở `bon-ca-thi.ts`. */
const NGUON_KIEM = new Set(['thi', 'len_bang', 'dau_gio'])

export function tinhBon(v: DauVaoBon): KetQuaBon {
  const lam = (v.dg?.dauVao.luot ?? []).filter((l) => l.dung !== null && !NGUON_KIEM.has(l.nguon ?? ''))
  // ═════ v3: HAI YẾU TỐ CHÍNH — ca thi thật theo đơn vị kiến thức + lên bảng (bon-ca-thi.ts). Rỗng ⇒ mọi số 0 / null ⇒ luật v2.
  const coCaBang = (v.caThi?.length ?? 0) + (v.lenBang?.length ?? 0) > 0
  const ca = tinhCaThi({ luyen: lam, luyenCu: v.luyenCu ?? [], caThi: v.caThi ?? [], lenBang: v.lenBang ?? [] })
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
    + 12 * ca.lechCa + 8 * ca.bangChua
  const dp = duDuLieu ? tron(kep(dpTho)) : null
  // ───── Học thật
  const tpSua = sc.tong >= 3 ? canDuoiWilson(sc.sua, sc.tong) : null
  const tpKy = kyMau >= 20 ? canDuoiWilson(kyN, kyMau) : null
  const tpMoi = moi.length >= 10 ? canDuoiWilson(moi.filter((l) => l.dung === true).length, moi.length) : null
  const tpKt = ktTB !== null && dungLuyen !== null ? kep(1 - Math.max(0, dungLuyen - ktTB / 10) / 0.4, 0, 1) : null
  // v3: có ca thi đã ghép (≥ 4 câu) hoặc lên bảng (≥ 2 lần) ⇒ hai yếu tố này nặng nhất (35% + 15%); không có ⇒ ĐÚNG trọng số v2.
  const tp: [number, number | null][] = ca.caDiem !== null || ca.bangDiem !== null
    ? [[0.35, ca.caDiem], [0.15, ca.bangDiem], [0.2, tpSua], [0.12, tpKy], [0.1, tpMoi], [0.08, tpKt]]
    : [[0.35, tpSua], [0.25, tpKy], [0.2, tpMoi], [0.2, tpKt]]
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
  // Rời app rồi quay lại chọn ĐÚNG câu không dễ ⇒ nghi tra ngoài (Google / A.I / hỏi bạn). Đợt 2 (01/11): máy em đo `ar` = giây ẩn app trong 30 giây NGAY
  // TRƯỚC lựa chọn cuối ⇒ có `ar` thì xét ar ≥ 6 (rời ngay trước khi chọn — thông báo kéo ra lúc đang đọc đề rồi quay lại đọc tiếp không tính);
  // lượt cũ chưa có `ar` ⇒ luật cũ (tổng giây ẩn ≥ 8). Ẩn từ 180 giây (gần treo máy) không tính ở cả hai luật.
  const dungHet = lam.filter((l) => l.dung === true && !l.treo)
  const roiTruocChon = (l: LuotDanhGia) => (typeof l.ar === 'number' ? l.ar >= 6 && !(typeof l.an === 'number' && l.an >= 180) : typeof l.an === 'number' && l.an >= 8 && l.an < 180)
  const traNgoai = dungHet.filter((l) => roiTruocChon(l) && (l.pLop === null || l.pLop < 0.6))
  // DÒ ĐÁP ÁN (đợt 2, 01/11): lượt Phần I em thử từ 3 phương án KHÁC NHAU trở lên trước khi bấm «Kiểm tra» (`dq`, đo ở máy em). Mẫu = lượt Phần I CÓ đo `dq`.
  const coDq = lam.filter((l) => l.phan === 'I' && typeof l.dq === 'number')
  const doDa = coDq.filter((l) => l.dq! >= 3)
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
  // v3: năng lực đã được XÁC NHẬN khi tự làm một lần — kiểm tra cá nhân khớp (≥ 6 điểm) HOẶC ca thi thật khớp luyện tập theo đơn vị VÀ đúng ≥ 60% câu thi đã
  // ghép (cùng mức «≥ 6 điểm»: em yếu mà ca thi khớp mức yếu thì chưa chứng minh được «đúng nhanh câu khó» là giỏi thật).
  const xacNhan = ktKhop || (ca.caKhop && ca.K >= 0.6 * ca.N)
  // ── Đối phó: HỌ bằng chứng (0 / 1 / 2 = nhẹ / mạnh). Vào bảng khi ≥ 2 họ độc lập và tổng ≥ 3.
  const ho: Record<string, number> = {}
  const voiSaiTL = doLuot.length ? voiSai.length / doLuot.length : 0
  if (doLuot.length >= LUOT_TOI_THIEU_BON && voiSaiTL >= 0.15) ho.voi = voiSaiTL >= 0.3 ? 2 : 1
  // v3: ca thi thật đúng HƠN HẲN luyện tập cùng đơn vị (z ≤ −1,96) ⇒ câu chọn vội mà sai là LÀM CHO CÓ, không phải không biết làm ⇒ «chọn vội» lên mạnh.
  if (ho.voi === 1 && ca.N >= 6 && ca.z <= -1.96) ho.voi = 2
  if (lap.so) ho.lap = lap.so >= 3 ? 2 : 1
  if (treo.some((l) => l.treo === 'co_tinh')) ho.treo = 2
  else if (treo.length >= 3 && treo.length >= 0.05 * lam.length) ho.treo = 1
  if (phat('thuocKhongHieu') > 0) ho.thuoc = phat('thuocKhongHieu') >= 10 ? 2 : 1
  // Luyện tập cao hơn kiểm tra cá nhân: luật cũ (luyện ≥ 70%, kiểm tra ≤ 5) = mạnh; chênh từ 2,5 điểm trở lên mà kiểm tra ≤ 6 = nhẹ.
  if (lechKt) ho.lech = 2
  else if (ktTB !== null && dungLuyen !== null && ktTB <= 6 && ktTB / 10 <= dungLuyen - 0.25) ho.lech = 1
  if (sc.tong >= 8 && boMacTiLe >= 0.6) ho.boMac = 1
  // Kiểm tra khớp ⇒ «đúng nhanh câu khó» là GIỎI THẬT (không tính); «rời app rồi đúng» hạ còn nhẹ (có thể do thông báo, năng lực đã xác nhận).
  if (!xacNhan && nhanhLa.length >= 3 && nhanhLa.length >= 0.15 * khoDung.length) ho.nhanh = nhanhLa.length >= 5 && nhanhLa.length >= 0.3 * khoDung.length ? 2 : 1
  if (traNgoai.length >= 3 && traNgoai.length >= 0.1 * dungHet.length) ho.tra = !xacNhan && traNgoai.length >= 6 && traNgoai.length >= 0.2 * dungHet.length ? 2 : 1
  // Dò đáp án: ≥ 5 lượt và ≥ 10% ⇒ nhẹ; ≥ 10 lượt và ≥ 20% ⇒ mạnh. Kiểm tra cá nhân KHỚP ⇒ chỉ nhẹ (em phân vân nhiều nhưng năng lực đã được xác nhận).
  if (doDa.length >= 5 && doDa.length >= 0.1 * coDq.length) ho.do = !xacNhan && doDa.length >= 10 && doDa.length >= 0.2 * coDq.length ? 2 : 1
  if (phat('goiY') > 0) ho.goiY = 1
  if (phat('thi') > 0) ho.thi = phat('thi') >= 20 ? 2 : 1
  // v3 — HAI HỌ CHÍNH: luyện cao mà ca thi thấp TRÊN CÙNG ĐƠN VỊ (tới 3: nhiều đơn vị, nhiều ca, lệch gộp có ý nghĩa) · lên bảng chưa đạt ở phần luyện đúng nhiều.
  if (ca.lechCa) ho.lechCa = ca.lechCa
  if (ca.bangChua) ho.bangChua = ca.bangChua
  const soHo = Object.keys(ho).length
  const manh = Object.values(ho).reduce((a, b) => a + b, 0)
  // ═════ v3b (02/11, thầy: «Với tiêu chí này thì phải đánh giá trọn vẹn và chính xác hết mọi học sinh 99%, không còn theo dõi nữa nhé»): HAI TRỤC, MỖI EM MỘT
  // NHÃN TRÊN MỖI TRỤC — không còn «Đang theo dõi». Bỏ hai luật loại trừ chéo cũ (Học thật ⇏ không Lười, Đối phó ⇏ không Chăm): chính chúng để em lửng lơ; «học
  // thật nhưng học ít» và «chăm làm nhưng đối phó» là kiểu có thật (đo trên mô phỏng: thi_tot_it_luyen, dp_thuoc).
  // ── TRỤC CHẤT LƯỢNG (Học thật ⇄ Đối phó) — có bất kỳ bằng chứng nào (lượt luyện / ca thi / lên bảng / kiểm tra ôn tập) là xếp:
  //   · Đối phó CHẮC: ≥ 2 họ, tổng ≥ ngưỡng; hoặc `lechCa` = 3 mà ca thi thấp hơn kỳ vọng ≥ 25 điểm % (ca thi là yếu tố chính, tự đủ).
  //   · Đối phó (quyết nốt): có họ «treo máy», hoặc tổng sức các họ ≥ ngưỡng.
  //   · Ngưỡng = 4 khi ca thi KHỚP luyện tập mà chỉ có họ NHẸ, không chọn vội / treo máy (thi đã xác nhận điểm luyện là thật); còn lại 3.
  //   · Còn lại ⇒ Học thật (không có bằng chứng đối phó đủ sức). Không có bằng chứng nào (chưa làm gì) ⇒ không xếp trục này, trục công sức vẫn xếp (Lười).
  const ktcnSo = (v.dg?.dauVao.ktcn.daNop ?? 0) + (v.dg?.dauVao.ktcn.boHan ?? 0)
  const coBangChungCl = lam.length > 0 || ca.caCau > 0 || ca.bang.tong > 0 || ktcnSo > 0
  const nguongManh = ca.caKhop && Object.values(ho).every((x) => x <= 1) && !ho.voi && !ho.treo ? 4 : 3
  const dpChac = duDuLieu && ((soHo >= 2 && manh >= nguongManh) || (ho.lechCa === 3 && ca.N > 0 && ca.E - ca.K >= 0.25 * ca.N))
  const vaoDp = coBangChungCl && (dpChac || !!ho.treo || manh >= nguongManh)
  const dp2 = coBangChungCl ? tron(kep(0.6 * dpTho + 10 * manh)) : null

  // ── Học thật «rõ» (dùng cho lời giải thích, thứ hạng): 5 nhóm + hai nhóm chính ca thi / lên bảng.
  const kyThat = doLuot.length - voi.length // chọn vội mà ĐÚNG cũng không phải «đọc kỹ»
  const ssDung = ss.filter((l) => l.dung === true).length
  const nhom = {
    sua: sc.tong >= 4 && canDuoiWilson(sc.sua, sc.tong) >= 0.55,
    ky: kyMau >= 30 && canDuoiWilson(kyThat, kyMau) >= 0.8,
    moi: moi.length >= 10 && canDuoiWilson(moi.filter((l) => l.dung === true).length, moi.length) >= 0.5,
    kt: ktKhop,
    // «Chủ động hỏi» KHÔNG tính nhóm (dữ liệu thật 01/11: 264/272 em có lượt hỏi ⇒ không phân biệt được) — chỉ hiểu thật: đúng câu song sinh khác số liệu.
    chu: ss.length >= 3 && canDuoiWilson(ssDung, ss.length) >= 0.5,
    // v3 — HAI NHÓM CHÍNH: ca thi khớp luyện tập theo đơn vị · lên bảng đạt.
    ca: ca.caKhop,
    bang: ca.bangDat,
  }
  const soNhom = Object.values(nhom).filter(Boolean).length
  const nguocCa = !!ho.lechCa || !!ho.bangChua
  const htRo = duDuLieu && !nguocCa && (nhom.ca || nhom.bang || nhom.sua || nhom.kt) && soNhom >= 3 && !vaoDp && manh <= 1 && ht !== null && ht >= NGUONG_BANG.ht
  const vaoHt = coBangChungCl && !vaoDp

  // ── TRỤC CÔNG SỨC (Chăm ⇄ Lười) — mọi em: Chăm ⇔ ≥ 70% số ngày phải làm có câu làm THẬT ≥ 75% mức, câu làm cho có (chọn vội mà sai — trừ em đọc nhanh mà câu
  // nhanh đúng ≥ 70% — + treo máy) ≤ 10% số lượt,
  // và không dồn sát giờ chốt (< 50% số ngày). Còn lại ⇒ Lười (lý do: bỏ ngày / làm cho có / dồn hạn). Chưa có ngày nào phải làm (vừa vào app) ⇒ có làm là Chăm.
  const n = ngay.length
  const duThat = ngay.filter((x) => lamThat(x) >= 0.9 * x.muc).length
  const du75 = ngay.filter((x) => lamThat(x) >= 0.75 * x.muc).length
  const daLamThat = ngay.reduce((s2, x) => s2 + lamThat(x), 0)
  let chuoiThat = 0
  for (let i = n - 1; i >= 0 && lamThat(ngay[i]!) >= 0.9 * ngay[i]!.muc; i--) chuoiThat++
  // «Chọn vội mà sai» chỉ là làm cho có khi câu bấm nhanh của em phần lớn SAI; em đọc nhanh mà câu nhanh đúng ≥ 70% (cờ «thuộc» = nhanh mà đúng) là giỏi, không tính.
  const nhanhDung = lam.filter((l) => l.thuoc && !l.treo).length
  const docNhanh = nhanhDung + voi.length > 0 && nhanhDung / (nhanhDung + voi.length) >= 0.7
  const choCo = (docNhanh ? 0 : voiSai.length) + treo.length
  const choCoTL = lam.length ? choCo / lam.length : 0
  const vaoCh = n > 0 ? du75 >= 0.7 * n && choCoTL <= 0.1 && donHanTL < 0.5 : lam.length > 0 || !!v.lanCuoiHoc
  // Lý do Lười (lời cho thầy): bỏ ngày (< 70% số ngày có làm) ⇒ «ngày»; có làm mà làm cho có ⇒ «làm cho có»; làm thiếu mức ⇒ «ngày»; còn lại dồn sát giờ chốt.
  const lyDoLu: 'ngay' | 'choCo' | 'donHan' | null = vaoCh ? null : n > 0 && coLam < 0.7 * n ? 'ngay' : choCoTL > 0.1 ? 'choCo' : n > 0 && du75 < 0.7 * n ? 'ngay' : donHanTL >= 0.5 ? 'donHan' : 'ngay'
  const ch2 = n >= 3 ? tron(100 * (0.5 * (duThat / n) + 0.2 * Math.min(1, daLamThat / Math.max(1, giao)) + 0.15 * Math.min(1, chuoiThat / 7) + 0.15 * (1 - donHanTL)))
    : n > 0 ? tron((100 * du75) / n) : vaoCh ? 100 : 0
  const khongNgay = n - coLam
  const boKt = v.dg?.dauVao.ktcn.boHan ?? 0
  const boMacMoi = sc.tong >= 3 ? (sc.tong - sc.sua) / sc.tong : 0
  // vắng hẳn cả cửa sổ ⇒ 100; còn lại: ngày không làm (55%) · câu được giao chưa làm thật (25%) · phớt lờ lời nhắc (10%) · bỏ mặc câu sai / bỏ kiểm tra cá nhân (10%)
  const boTerm = coLam === 0 ? 1 : Math.max(boMacMoi, Math.min(1, boKt / 2))
  const lu2 = n >= 3 ? tron(100 * (0.55 * (khongNgay / n) + 0.25 * (1 - Math.min(1, daLamThat / Math.max(1, giao))) + 0.1 * (photLo / n) + 0.1 * boTerm)) : 100 - ch2

  const vao: Record<MaBang, boolean> = { ht: vaoHt, dp: vaoDp, ch: vaoCh, lu: !vaoCh }
  // «Đang theo dõi» đã bỏ (v3b) — giữ khoá cho dữ liệu / API cũ, luôn null.
  const theoDoi: string | null = null
  // Điểm hiển thị: đủ thành phần mới có số; em được xếp mà chưa đủ dữ liệu ⇒ điểm suy từ trục còn lại (để xếp hạng trong bảng).
  if (ht === null && vaoHt) ht = tw > 0 ? tron((100 * tp.reduce((s3, [w, x]) => s3 + (x === null ? 0 : w * x), 0)) / tw) : tron(kep(100 - (dp2 ?? 0)))
  ht = ht === null ? null : vaoDp ? Math.min(ht, 100 - (dp2 ?? 0)) : ht
  Object.assign(soLieu, {
    nhanhLa: pt(nhanhLa.length, khoDung.length), traNgoai: pt(traNgoai.length, dungHet.length), do: pt(doDa.length, coDq.length), donHan: ngayDem.length ? tron(100 * donHanTL) : null,
    photLo: v.dg && n ? pt(photLo, n) : null, hoi, ban: BAN_BON, vao, theoDoi, ho,
    caCau: ca.caCau, caGhep: ca.N, caThi: ca.N >= 4 ? pt(ca.K, ca.N) : null, caKyVong: ca.N >= 4 ? pt(Math.round(ca.E), ca.N) : null, luyenDv: pt(ca.kL, ca.nL),
    dvKhop: ca.dvKhop, dvLech: ca.dvLech, caLech: ca.caLech,
    lenBang: pt(ca.bang.dat, ca.bang.tong), bangTong: ca.bang.tong, bangDat: ca.bang.dat, bangChuaLq: ca.bang.chuaLq,
  })
  // v3: bản KHÔNG có ca thi / lên bảng (đúng luật v2 trên cùng em) ⇒ đếm «vào nhờ» / «ra nhờ» hai yếu tố này. Không đệ quy thêm (bản ấy rỗng ca thi).
  if (coCaBang) {
    const v2 = tinhBon({ ...v, caThi: [], lenBang: [], luyenCu: [] }).soLieu.vao!
    soLieu.nho = {
      ht: vao.ht && (nhom.ca || nhom.bang) ? (v2.ht ? 1 : 2) : 0, dp: vao.dp && (ho.lechCa || ho.bangChua) ? (v2.dp ? 1 : 2) : 0,
      htRa: v2.ht && !vao.ht ? 1 : 0, dpRa: v2.dp && !vao.dp ? 1 : 0,
    }
  }

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
  // Đợt 2 (01/11): dò đáp án — mạnh xếp đầu thẻ (bằng chứng hành vi trực tiếp), dưới ngưỡng vẫn hiện số nhưng xếp cuối.
  if (doDa.length) theDp.push({ w: ho.do ? 12 * ho.do : 0.5, ma: 'do', tieu: 'Dò đáp án', lon: `${doDa.length}/${coDq.length}`, nhoSo: `lượt · ${soLieu.do}%`, so: soLieu.do ?? undefined,
    viDu: [...doDa].sort(theoLuc).slice(-3).reverse().map((l) => ({ luc: l.luc, qid: l.qid ?? l.cau ?? '', phu: `thử ${l.dq} phương án${typeof l.dd === 'number' ? `, đổi ${l.dd} lần` : ''} trước khi bấm Kiểm tra`, kq: `chốt ${l.chon ?? '?'} · ${chuKq(l)}`, dung: l.dung })),
    chu: `Em thử từ 3 phương án trở lên ở ${doDa.length}/${coDq.length} lượt Phần I; đúng ${doDa.filter((l) => l.dung === true).length}/${doDa.length} lượt ấy.` })
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
  // v3 — thẻ CA THI / LÊN BẢNG (đơn vị kiến thức = chuyên đề; ví dụ mỗi dòng một đơn vị: «Amine · luyện 90% (18/20) → thi 2/6»).
  const soCa = new Set((v.caThi ?? []).map((c) => c.ma)).size
  const pL = pt(ca.kL, ca.nL) ?? 0
  const dvLechDs = ca.dv.filter((d) => d.lech).sort((a, b) => (b.eT - b.kT) / b.nT - (a.eT - a.kT) / a.nT)
  if (ca.dvLech || ca.lechGop) theDp.push({ w: ca.lechCa ? 14 * ca.lechCa : 1, ma: 'lechCa', tieu: 'Luyện cao, ca thi thấp', lon: `${pL}% → ${ca.K}/${ca.N}`, nhoSo: 'câu thi cùng đơn vị',
    hai: [{ nhan: 'Luyện tập · cùng đơn vị', so: `${pL}%`, phu: `${ca.kL}/${ca.nL} lượt đúng` },
      { nhan: `Ca thi thật · ${soCa} ca · ${SO_NGAY_CA} ngày`, so: `${ca.K}/${ca.N}`, phu: `kỳ vọng ${Math.round(ca.E)} câu theo độ khó từng câu`, lech: true }],
    viDu: (dvLechDs.length ? dvLechDs : ca.dv).slice(0, 3).map((d) => ({ luc: d.luc, qid: '', cau: d.ten, phu: `luyện ${pt(d.kL, d.nL)}% (${d.kL}/${d.nL})`, kq: `thi ${d.kT}/${d.nT}`, dung: false })),
    chu: `${ca.dvLech ? `Ở **${ca.dvLech} đơn vị**` : 'Gộp các đơn vị'}, ca thi thấp hơn hẳn mức luyện tập (đã tính độ khó từng câu)${ca.caLech >= 2 ? `, lặp lại ở ${ca.caLech} ca` : ''}.` })
  if (ca.bang.chuaLq) {
    const chua = ca.bang.dsLq.filter((b) => !b.dat)
    theDp.push({ w: ca.bangChua ? 10 * ca.bangChua : 0.8, ma: 'bangChua', tieu: 'Lên bảng chưa đạt ở phần luyện đúng nhiều', lon: `${ca.bang.chuaLq}/${ca.bang.lq}`, nhoSo: 'lần',
      viDu: chua.slice(-3).reverse().map((b) => ({ luc: b.luc, qid: b.qid, phu: `${b.loai === 'dau_gio' ? 'Kiểm tra đầu giờ — câu em từng làm đúng' : 'Lên bảng'}${b.dv ? ` · ${b.dv}` : ''}`, kq: 'Chưa đạt', dung: false })),
      chu: `Lúc luyện em làm đúng, nhưng lên bảng tự làm lại thì chưa đạt ${ca.bang.chuaLq}/${ca.bang.lq} lần.` })
  }
  theDp.sort((a, b) => b.w - a.w)

  // ───── Thẻ Học thật (v3: ca thi + lên bảng đứng đầu — hai yếu tố chính)
  const theHt: TheTho[] = []
  if (ca.N >= 4) theHt.push({ ma: 'caThi', tieu: ca.dvLech ? 'Ca thi thấp hơn luyện tập' : 'Ca thi khớp luyện tập', lon: `${ca.K}/${ca.N}`, nhoSo: `câu thi · ${ca.dv.length} đơn vị`, so: soLieu.caThi ?? undefined,
    hai: [{ nhan: 'Luyện tập · cùng đơn vị', so: `${pL}%`, phu: `${ca.kL}/${ca.nL} lượt đúng` },
      { nhan: `Ca thi thật · ${soCa} ca · ${SO_NGAY_CA} ngày`, so: `${soLieu.caThi}%`, phu: `kỳ vọng ${soLieu.caKyVong}% theo độ khó từng câu`, ...(ca.dvLech ? { lech: true } : {}) }],
    viDu: ca.dv.slice(0, 3).map((d) => ({ luc: d.luc, qid: '', cau: d.ten, phu: `luyện ${d.kL}/${d.nL}`, kq: `thi ${d.kT}/${d.nT}`, dung: !d.lech })) })
  if (ca.bang.tong) {
    const chua = ca.bang.tong - ca.bang.dat
    theHt.push({ ma: 'lenBang', tieu: 'Lên bảng', lon: `${ca.bang.dat}/${ca.bang.tong}`, nhoSo: `lần đạt${chua ? ` · chưa đạt ${chua}` : ''}`, so: soLieu.lenBang ?? undefined,
      viDu: ca.bang.ds.slice(-3).reverse().map((b) => ({ luc: b.luc, qid: b.qid, phu: `${b.loai === 'dau_gio' ? 'Kiểm tra đầu giờ' : 'Lên bảng'}${b.dv ? ` · ${b.dv}` : ''}`, kq: b.dat ? 'Đạt' : 'Chưa đạt', dung: b.dat })) })
  }
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
  // v3b: Lười vì LÀM CHO CÓ / DỒN HẠN (có làm đủ ngày) — thẻ lý do đứng đầu.
  if (lyDoLu === 'choCo') theLu.unshift({ ma: 'choCo', tieu: 'Câu làm cho có (chọn vội mà sai, treo máy)', lon: `${choCo}/${lam.length}`, nhoSo: `lượt · ${pt(choCo, lam.length)}%`,
    chu: 'Câu chọn khi chưa đọc hết đề mà sai và lượt treo máy KHÔNG được tính là đã làm.' })
  if (lyDoLu === 'donHan') theLu.unshift({ ma: 'donHan', tieu: 'Dồn sát giờ chốt (từ 23:00)', lon: `${ngayDon}/${ngayDem.length}`, nhoSo: 'ngày', so: soLieu.donHan ?? undefined })

  // ───── Một dòng + kết luận
  const nhan = (x: string) => `**${x}**`
  const bcDp = theDp[0] ? (theDp[0].ma === 'lechCa' ? `Luyện ${pL}% · ca thi ${nhan(`${ca.K}/${ca.N}`)}` : theDp[0].ma === 'bangChua' ? `Lên bảng chưa đạt ${nhan(`${ca.bang.chuaLq}/${ca.bang.lq}`)}` : theDp[0].ma === 'voi' ? `${nhan(`${soLieu.voi}%`)} câu chọn khi chưa đọc hết đề` : theDp[0].ma === 'lap' ? `Chọn ${nhan(lap.dai[0]!.chon ?? '')} liền ${nhan(`${lap.dai.length} câu`)}` : theDp[0].ma === 'lech' ? `Luyện đúng ${tron((dungLuyen ?? 0) * 100)}% · kiểm tra ${nhan(so1(ktTB ?? 0))}` : theDp[0].ma === 'boMac' ? `${nhan(`${sc.tong - sc.sua}/${sc.tong}`)} câu sai để đó không sửa` : theDp[0].ma === 'do' ? `${nhan(`${doDa.length} lượt`)} dò đáp án` : `${theDp[0].tieu}: ${nhan(theDp[0].lon)}`) : ''
  const bc: Record<MaBang, string> = {
    ht: ca.caKhop ? `Ca thi đúng ${nhan(`${ca.K}/${ca.N}`)} câu — khớp luyện tập` : ca.bangDat ? `Lên bảng đạt ${nhan(`${ca.bang.dat}/${ca.bang.tong}`)}`
      : htRo && sc.tong >= 3 ? `Sửa đúng ${nhan(`${sc.sua}/${sc.tong}`)} câu từng sai`
      : `Không có dấu hiệu đối phó${ca.N >= 4 ? ` · ca thi ${nhan(`${ca.K}/${ca.N}`)} câu` : soLieu.ky !== null ? ` · đọc kỹ ${nhan(`${soLieu.ky}%`)} lượt` : ' · ít dữ liệu'}`,
    dp: bcDp || 'Có dấu hiệu đối phó',
    ch: `Đủ mức ${nhan(`${du}/${ngay.length}`)} ngày${daLam ? ` · ${daLam} câu` : ''}`,
    lu: lyDoLu === 'choCo' ? `${nhan(`${pt(choCo, lam.length)}%`)} lượt làm cho có` : lyDoLu === 'donHan' ? `Dồn sát giờ chốt ${nhan(`${ngayDon}/${ngayDem.length}`)} ngày`
      : khong >= ngay.length && ngay.length ? `${nhan(`${khong}/${ngay.length}`)} ngày không làm${lanCuoi ? ` · lần cuối ${ngayNgan(lanCuoi)}` : ''}` : khong ? `${nhan(`${khong}/${ngay.length}`)} ngày không làm` : `Làm ${nhan(`${daLam}/${giao}`)} câu được giao`,
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
      case 'do': return `${nhan(`${doDa.length} lượt`)} dò đáp án — thử từ 3 phương án trở lên`
      case 'lechCa': return `${nhan(`${ca.K}/${ca.N} câu`)} ca thi đúng, dù luyện đúng ${pL}% ở cùng đơn vị${ca.dvLech ? ` (${ca.dvLech} đơn vị lệch)` : ''}`
      case 'bangChua': return `${nhan(`${ca.bang.chuaLq}/${ca.bang.lq} lần`)} lên bảng chưa đạt ở phần đã luyện đúng`
      default: return `${nhan(`${t.lon}${t.nhoSo ? ` ${t.nhoSo}` : ''}`)} ${t.tieu.toLowerCase()}`
    }
  }
  const kl: Record<MaBang, string> = {
    // v3: Đối phó vì ca thi / lên bảng ⇒ nói đúng việc (điểm luyện không giữ được khi tự làm), không gọi là «làm cho có».
    dp: dong(theDp[0] && (theDp[0].ma === 'lechCa' || theDp[0].ma === 'bangChua') ? 'Điểm luyện tập chưa thật — tự làm ở ca thi / trên bảng không giữ được:'
      : du ? `Em làm ${du}/${ngay.length} ngày đủ mức nhưng làm cho có:` : 'Em làm cho có:', ...theDp.slice(0, 3).map(lyDoDp)),
    ht: dong(htRo ? 'Em học thật:' : 'Em học thật (không có dấu hiệu đối phó):',
      ca.caKhop ? `${nhan(`${ca.K}/${ca.N} câu`)} ca thi đúng — khớp mức luyện tập ${pL}% ở ${ca.dvKhop} đơn vị kiến thức` : '',
      ca.bangDat ? `${nhan(`${ca.bang.dat}/${ca.bang.tong} lần`)} lên bảng đạt` : '',
      sc.tong >= 3 ? `${nhan(`${sc.sua}/${sc.tong} câu`)} từng sai đã sửa đến khi đúng` : '',
      soLieu.ky !== null ? `${nhan(`${soLieu.ky}%`)} lượt đọc đủ thời gian trước khi chọn` : '',
      ktTB !== null && !lechKt ? `${nhan(`${so1(ktTB)} điểm`)} kiểm tra cá nhân — khớp mức luyện tập ${tron((dungLuyen ?? 0) * 100)}%` : ''),
    ch: dong('Em chăm:',
      `${nhan(`${du}/${ngay.length} ngày`)} đủ mức`,
      `${nhan(`${daLam} câu`)} đã làm (mức giao ${giao})`,
      soLieu.ky !== null ? `${nhan(`${soLieu.ky}%`)} số câu làm kỹ` : '',
      `${nhan(`${chuoi} ngày`)} đủ mức liền nhau (chuỗi hiện tại)`),
    lu: dong('Em lười:',
      lyDoLu === 'choCo' ? `${nhan(`${choCo}/${lam.length} lượt`)} làm cho có — chọn vội mà sai, treo máy (không tính là đã làm)` : '',
      lyDoLu === 'donHan' ? `${nhan(`${ngayDon}/${ngayDem.length} ngày`)} dồn hết sau 23:00, sát giờ chốt` : '',
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

/** Phiên bản bộ máy 4 bảng: 2 = v2 «chắc mới xếp» (01/11 chiều); 3 = bỏ «chủ động hỏi» khỏi nhóm Học thật (dữ liệu thật: 264/272 em có ⇒ không phân biệt);
 *  4 = v3 ca thi thật + lên bảng theo đơn vị kiến thức (02/11). Đổi số ⇒ cron tính lại mọi em. */
export const BAN_BON = 4

/** Em có vào bảng không (ngưỡng hợp đồng). Thuần. */
export function vaoBang(d: DiemBon, b: MaBang): boolean {
  if (b === 'ht') return d.ht !== null && d.ht >= NGUONG_BANG.ht && (d.dp ?? 0) < NGUONG_BANG.htDpDuoi
  if (b === 'dp') return d.dp !== null && d.dp >= NGUONG_BANG.dp
  if (b === 'ch') return d.ch !== null && d.ch >= NGUONG_BANG.ch
  return d.lu !== null && d.lu >= NGUONG_BANG.lu
}

export { trungVi }
