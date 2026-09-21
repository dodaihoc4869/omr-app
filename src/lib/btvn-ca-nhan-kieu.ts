// BTVN "NÂNG ĐỠ" — KIỂU + HÀM THUẦN phía máy em. Hợp đồng: docs/hop-dong-btvn-nang-do-2109.md (mục 3, 4).
//
// TỆP NÀY KHÔNG ĐƯỢC ĐỤNG API TRÌNH DUYỆT (localStorage, window, document…): `bai-tap-pdf.ts` (kéo theo `cau-hinh-chua.ts`)
// được biên dịch cả phía MÁY CHỦ, nơi các tên ấy không tồn tại (tsc -p server đỏ — Boss 21/09). Phần lưu ở máy nằm ở
// `btvn-ca-nhan-em.ts` (tái xuất tệp này). Có test khoá (tests/btvn-ca-nhan-kieu-2109.test.ts).
// Đọc phản hồi máy chủ thành kiểu chặt, chia câu theo chặng, đặt tên nhãn, ghép kết quả chặng vào câu thô.
//
// LUẬT CỨNG (đề bài prompt-btvn-nang-do.md, Boss 21/09):
//  · Bài `caNhan` KHÔNG có đáp án/lời giải trong `de.cau` (`khongDapAn:true`) — máy em
//    KHÔNG chấm tại chỗ. Đáp án đúng + lời giải chỉ về sau khi nộp chặng thành công.
//  · Không lộ số câu của bạn khác, không xếp hạng em với em.
//  · Bài KHÔNG `caNhan` (hoặc `caNhan` khác đúng `true`): các hàm ở đây trả null — phiếu cũ
//    chạy y như cũ.

export type NhanCauEm = 'loi' | 'khoi_dong' | 'dang_yeu' | 'cung_co' | 'thu_thach' | 'loi_cao'
const NHAN_HOP_LE: ReadonlySet<string> = new Set(['loi', 'khoi_dong', 'dang_yeu', 'cung_co', 'thu_thach', 'loi_cao'])

export interface ChangEm {
  chiSo: number
  soCau: number
  moLuc: string
  daMo: boolean
  daXong: boolean
}

export interface BaiCaNhanEm {
  /** Số câu CỦA EM (không phải số câu của cả bài). */
  soCauCuaEm: number
  soChang: number
  /** Số chặng đã xong (giữ tên cũ `loDaXong` của máy chủ). */
  loDaXong: number
  /** Chặng em làm bây giờ (0-based); null khi đã xong hết. */
  changDangMo: number | null
  chang: ChangEm[]
  /** Nhãn của các câu đã mở. Nhãn lạ bị bỏ (câu đó chỉ không có nhãn). */
  nhan: Record<string, NhanCauEm>
}

const laSo = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const laSoNguyenKhongAm = (v: unknown): v is number => laSo(v) && Number.isInteger(v) && v >= 0
const laDoiTuong = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Đọc phản hồi `/btvn/cua-em`. null khi KHÔNG phải bài cá nhân hoá (`caNhan` phải đúng `true`). */
export function docBaiCaNhan(r: unknown): BaiCaNhanEm | null {
  if (!laDoiTuong(r) || r.caNhan !== true) return null
  const chang: ChangEm[] = []
  if (Array.isArray(r.chang)) {
    for (const c of r.chang) {
      if (!laDoiTuong(c) || !laSoNguyenKhongAm(c.chiSo) || !laSoNguyenKhongAm(c.soCau)) continue
      chang.push({
        chiSo: c.chiSo,
        soCau: c.soCau,
        moLuc: typeof c.moLuc === 'string' ? c.moLuc : '',
        daMo: c.daMo === true,
        daXong: c.daXong === true,
      })
    }
  }
  chang.sort((a, b) => a.chiSo - b.chiSo)
  const nhan: Record<string, NhanCauEm> = {}
  if (laDoiTuong(r.nhan)) {
    for (const [qid, n] of Object.entries(r.nhan)) if (typeof n === 'string' && NHAN_HOP_LE.has(n)) nhan[qid] = n as NhanCauEm
  }
  const soCauCuaEm = laSoNguyenKhongAm(r.soCauCuaEm) ? r.soCauCuaEm : laSoNguyenKhongAm(r.soCau) ? r.soCau : chang.reduce((t, c) => t + c.soCau, 0)
  return {
    soCauCuaEm,
    soChang: laSoNguyenKhongAm(r.soChang) ? r.soChang : chang.length,
    loDaXong: laSoNguyenKhongAm(r.loDaXong) ? r.loDaXong : chang.filter((c) => c.daXong).length,
    changDangMo: laSoNguyenKhongAm(r.changDangMo) ? r.changDangMo : null,
    chang,
    nhan,
  }
}

/** Câu của MỘT chặng, cắt từ `de.cau` (thứ tự: chặng đã mở theo chỉ số → thứ tự trong chặng). */
export function cauCuaChang<T>(b: BaiCaNhanEm, cau: readonly T[], chiSo: number): T[] {
  let dau = 0
  for (const c of b.chang) {
    if (!c.daMo) continue
    if (c.chiSo === chiSo) return cau.slice(dau, dau + c.soCau)
    dau += c.soCau
  }
  return []
}

/** Đầu bài "Bài của riêng em": chỉ số ĐẾM của chính em. 80 s/câu là mặc định của app (nhiem-vu-adapter). */
export function chuDauBai(b: BaiCaNhanEm): { tong: number; soChang: number; phutMoiNgay: number | null } {
  const phut = b.soCauCuaEm > 0 && b.soChang > 0 ? Math.max(1, Math.ceil(((b.soCauCuaEm / b.soChang) * 80) / 60)) : null
  return { tong: b.soCauCuaEm, soChang: b.soChang, phutMoiNgay: phut }
}

export type KieuNhan = 'kd' | 'cl' | 'rr' | 'tt'
export interface ThongTinNhan {
  kieu: KieuNhan
  chu: string
  bieuTuong: 'zap' | 'target' | 'user' | 'flag'
  /** Câu THƯỞNG: đúng thì cộng, sai không bị trừ (Boss 21/09). */
  thuong: boolean
  ghi: string | null
}

/** Nhãn nhẹ trên thẻ câu. `loi_cao` = câu lõi cao hơn bậc em (Code 1): cùng kiểu vàng với thử thách. */
export function thongTinNhan(n: NhanCauEm): ThongTinNhan {
  switch (n) {
    case 'khoi_dong':
      return { kieu: 'kd', chu: 'Khởi động', bieuTuong: 'zap', thuong: false, ghi: null }
    case 'loi':
      return { kieu: 'cl', chu: 'Cốt lõi', bieuTuong: 'target', thuong: false, ghi: null }
    case 'dang_yeu':
    case 'cung_co':
      return { kieu: 'rr', chu: 'Dành riêng cho em', bieuTuong: 'user', thuong: false, ghi: null }
    case 'thu_thach':
      return { kieu: 'tt', chu: 'Thử thách', bieuTuong: 'flag', thuong: true, ghi: 'Câu này để em thử sức — sai không sao, không bị trừ gì.' }
    case 'loi_cao':
      return { kieu: 'tt', chu: 'Cốt lõi · câu cao', bieuTuong: 'flag', thuong: true, ghi: 'Câu cốt lõi hơi cao hơn — sai không sao, không bị trừ gì.' }
  }
}

/** "ngày mai" / "ngày 24/09" — cho dòng "Chặng k mở …". Giờ máy em (VN). */
export function chuNgayMo(moLuc: string, bayGio: Date): string {
  const d = new Date(moLuc)
  if (!Number.isFinite(d.getTime())) return ''
  const ngay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const chenh = Math.round((ngay(d) - ngay(bayGio)) / 86_400_000)
  if (chenh <= 0) return 'hôm nay'
  if (chenh === 1) return 'ngày mai'
  const hai = (v: number) => String(v).padStart(2, '0')
  return `ngày ${hai(d.getDate())}/${hai(d.getMonth() + 1)}`
}

// ───────────────────────── lịch chặng THEO GIỜ (bản 1.1) ─────────────────────────
// Hạn ngắn ⇒ chặng chia theo giờ trong cửa sổ học (vd 20:00 · 21:20 · 22:40); hạn dài ⇒ mỗi chặng mở 00:00 của ngày nó.
// Máy chủ trả `moLuc` (ISO) từng chặng; máy em chỉ ĐỌC và nói cho em biết chặng kế mở lúc nào, còn bao lâu.

const hai = (n: number): string => String(n).padStart(2, '0')
const ngayCuaNgay = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

export interface MoLucView {
  /** "lúc 21:20" · "lúc 20:00 ngày mai" · "ngày mai" · "ngày 24/09" · "ngay bây giờ". Ghép sau chữ "mở". */
  chu: string
  /** "còn 25 phút" · "còn 1 giờ 20 phút" — chỉ khi còn < 3 giờ; ngoài ra null (không dọa em bằng đồng hồ xa). */
  conLai: string | null
  /** Mốc đã tới (hoặc qua): chặng phải mở được — nếu máy chưa cho thì em tải lại bài. */
  daToi: boolean
}

/** Chữ "chặng kế mở …". null khi `moLuc` hỏng. Mốc đúng 00:00 nói theo NGÀY (như cũ); mốc có giờ nói cả giờ. */
export function chuMoLuc(moLuc: string, bayGio: Date): MoLucView | null {
  const d = new Date(moLuc)
  if (!Number.isFinite(d.getTime())) return null
  const ms = d.getTime() - bayGio.getTime()
  if (ms <= 0) return { chu: 'ngay bây giờ', conLai: null, daToi: true }
  const nuaDem = d.getHours() === 0 && d.getMinutes() === 0
  const chenh = Math.round((ngayCuaNgay(d) - ngayCuaNgay(bayGio)) / 86_400_000)
  const gio = `${hai(d.getHours())}:${hai(d.getMinutes())}`
  const ngay = chenh <= 0 ? '' : chenh === 1 ? 'ngày mai' : `ngày ${hai(d.getDate())}/${hai(d.getMonth() + 1)}`
  const chu = nuaDem ? (chenh <= 0 ? 'hôm nay' : ngay) : `lúc ${gio}${ngay ? ' ' + ngay : ''}`
  const phut = Math.max(1, Math.ceil(ms / 60_000))
  const conLai = ms > 3 * 3_600_000 ? null : phut < 60 ? `còn ${phut} phút` : `còn ${Math.floor(phut / 60)} giờ${phut % 60 ? ` ${phut % 60} phút` : ''}`
  return { chu, conLai, daToi: false }
}

/** Nhãn NGẮN dưới chấm chặng (cột chỉ rộng ~46 px): "21:20" (hôm nay có giờ) · "Hôm nay" · "Mai" · "24/09". */
export function nhanMoLucNgan(moLuc: string, bayGio: Date): string {
  const d = new Date(moLuc)
  if (!Number.isFinite(d.getTime())) return ''
  const chenh = Math.round((ngayCuaNgay(d) - ngayCuaNgay(bayGio)) / 86_400_000)
  if (chenh <= 0) return d.getHours() === 0 && d.getMinutes() === 0 ? 'Hôm nay' : `${hai(d.getHours())}:${hai(d.getMinutes())}`
  if (chenh === 1) return 'Mai'
  return `${hai(d.getDate())}/${hai(d.getMonth() + 1)}`
}

// ───────────────────────── kết quả nộp chặng ─────────────────────────

/** Giá trị đáp án/lời giải máy chủ trả NGUYÊN DẠNG như kho lưu: chuỗi ("B", "DSDS", "12,5") hoặc đối tượng có cấu trúc
 * (Phần II `{a,b,c,d}`; `loi_giai` của kho là đối tượng). Đưa thẳng vào cửa nạp kho, KHÔNG ép về chuỗi. */
export type GiaTriTho = string | Record<string, unknown>

export interface KetQuaCauChang {
  qid: string
  dung: boolean
  dapAnDung: GiaTriTho
  /** null = câu này không có lời giải. */
  loiGiai: GiaTriTho | null
  anhLoiGiai: unknown[]
}

/** Chuỗi (kể cả số) hoặc đối tượng phẳng; mọi thứ khác ⇒ null. */
function giaTriTho(v: unknown): GiaTriTho | null {
  if (typeof v === 'string') return v
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  if (laDoiTuong(v)) return v
  return null
}
/** Rỗng theo nghĩa "không có gì để hiện": chuỗi trắng hoặc đối tượng không khoá. */
const laRong = (v: GiaTriTho | null): boolean => v === null || (typeof v === 'string' ? v.trim() === '' : Object.keys(v).length === 0)

export interface TienBoEm {
  dangLenBac: { ma: string; ten: string; tu: number; den: number }[]
  soCauDungLai: number
  soCauMoiGap: number
  soDangMoi: number
  coTienBo: boolean
}

export interface KetQuaChang {
  ok: boolean
  lyDo?: string
  error?: string
  loDaXong?: number
  changDangMo?: number | null
  chang?: { chiSo: number; soCau: number; soDung: number; xong: boolean }
  ketQua: KetQuaCauChang[]
  /** Câu bỏ trống: KHÔNG chấm, chưa có lời giải, em làm tiếp được. */
  chuaLam: string[]
  exp?: { homNay: number; conLaiLenCap: number | null }
  tienBo?: TienBoEm
  /** CHỈ có khi chặng CUỐI vừa xong: máy chủ TỰ chốt nộp bài. `soCau` là MẪU điểm (đã trừ câu thưởng sai),
   * điểm = soDung / soCau × 10. Máy em không gọi /btvn/nop cho bài ca_nhan. */
  nop?: { daNop: boolean; nopLuc: string; soDung: number; soCau: number; soCauCuaEm: number; soCauThuongSai: number; qidSai: string[] }
}

/** Đọc phản hồi `/btvn/xong-lo` của bài cá nhân hoá. null khi không phải một đối tượng. */
export function docKetQuaChang(r: unknown): KetQuaChang | null {
  if (!laDoiTuong(r)) return null
  const ketQua: KetQuaCauChang[] = []
  if (Array.isArray(r.ketQua)) {
    for (const k of r.ketQua) {
      if (!laDoiTuong(k) || typeof k.qid !== 'string' || k.qid === '' || typeof k.dung !== 'boolean') continue
      ketQua.push({
        qid: k.qid,
        dung: k.dung,
        dapAnDung: giaTriTho(k.dapAnDung) ?? '',
        loiGiai: laRong(giaTriTho(k.loiGiai)) ? null : giaTriTho(k.loiGiai),
        anhLoiGiai: Array.isArray(k.anhLoiGiai) ? k.anhLoiGiai : [],
      })
    }
  }
  const out: KetQuaChang = {
    ok: r.ok === true,
    ketQua,
    chuaLam: Array.isArray(r.chuaLam) ? r.chuaLam.filter((q): q is string => typeof q === 'string') : [],
  }
  if (typeof r.lyDo === 'string') out.lyDo = r.lyDo
  if (typeof r.error === 'string') out.error = r.error
  if (laSoNguyenKhongAm(r.loDaXong)) out.loDaXong = r.loDaXong
  if (laSoNguyenKhongAm(r.changDangMo)) out.changDangMo = r.changDangMo
  else if (r.changDangMo === null) out.changDangMo = null
  if (laDoiTuong(r.chang) && laSoNguyenKhongAm(r.chang.chiSo) && laSoNguyenKhongAm(r.chang.soCau) && laSoNguyenKhongAm(r.chang.soDung)) {
    out.chang = { chiSo: r.chang.chiSo, soCau: r.chang.soCau, soDung: r.chang.soDung, xong: r.chang.xong === true }
  }
  if (laDoiTuong(r.exp) && laSo(r.exp.homNay)) {
    out.exp = { homNay: r.exp.homNay, conLaiLenCap: laSo(r.exp.conLaiLenCap) ? r.exp.conLaiLenCap : null }
  }
  if (laDoiTuong(r.nop) && r.nop.daNop === true && laSoNguyenKhongAm(r.nop.soDung) && laSoNguyenKhongAm(r.nop.soCau)) {
    out.nop = {
      daNop: true,
      nopLuc: typeof r.nop.nopLuc === 'string' ? r.nop.nopLuc : '',
      soDung: r.nop.soDung,
      soCau: r.nop.soCau,
      soCauCuaEm: laSoNguyenKhongAm(r.nop.soCauCuaEm) ? r.nop.soCauCuaEm : r.nop.soCau,
      soCauThuongSai: laSoNguyenKhongAm(r.nop.soCauThuongSai) ? r.nop.soCauThuongSai : 0,
      qidSai: Array.isArray(r.nop.qidSai) ? r.nop.qidSai.filter((q): q is string => typeof q === 'string') : [],
    }
  }
  if (laDoiTuong(r.tienBo)) {
    const t = r.tienBo
    out.tienBo = {
      dangLenBac: Array.isArray(t.dangLenBac)
        ? t.dangLenBac
            .filter(laDoiTuong)
            .filter((d) => typeof d.ma === 'string' && laSo(d.tu) && laSo(d.den))
            .map((d) => ({ ma: String(d.ma), ten: typeof d.ten === 'string' && d.ten !== '' ? d.ten : String(d.ma), tu: d.tu as number, den: d.den as number }))
        : [],
      soCauDungLai: laSoNguyenKhongAm(t.soCauDungLai) ? t.soCauDungLai : 0,
      soCauMoiGap: laSoNguyenKhongAm(t.soCauMoiGap) ? t.soCauMoiGap : 0,
      soDangMoi: laSoNguyenKhongAm(t.soDangMoi) ? t.soDangMoi : 0,
      coTienBo: t.coTienBo === true,
    }
  }
  return out
}

// ───────────────────────── câu thô ↔ kết quả ─────────────────────────

/** Đáp án GIẢ cho câu thô chưa có đáp án, để đi qua cửa nạp kho (nó LOẠI câu thiếu `dap_an`).
 * Giá trị này KHÔNG bao giờ được dùng để chấm hay hiển thị: `dungPhieuBtvn` dùng tập `chuaCo` để đánh dấu
 * `chuaCoDapAn` và xoá nó khỏi câu đã dựng. */
export function themDapAnGiaChoCau(cauTho: readonly Record<string, unknown>[]): { cau: Record<string, unknown>[]; chuaCo: Set<string> } {
  const chuaCo = new Set<string>()
  const cau = cauTho.map((c) => {
    const co = c.dap_an !== undefined && c.dap_an !== null && c.dap_an !== ''
    if (co) return c
    if (typeof c.qid === 'string') chuaCo.add(c.qid)
    return { ...c, dap_an: c.phan === 'II' ? 'DDDD' : c.phan === 'III' ? '0' : 'A' }
  })
  return { cau, chuaCo }
}

/** Ghép kết quả máy chủ vào câu thô: câu đã chấm có đáp án đúng + lời giải + ảnh lời giải. Không sửa mảng vào. */
export function ghepKetQuaVaoCau(cauTho: readonly Record<string, unknown>[], ketQua: readonly KetQuaCauChang[]): Record<string, unknown>[] {
  const theoQid = new Map(ketQua.map((k) => [k.qid, k]))
  return cauTho.map((c) => {
    const k = typeof c.qid === 'string' ? theoQid.get(c.qid) : undefined
    if (!k) return c
    const hinh = Array.isArray(c.hinh) ? c.hinh : []
    return {
      ...c,
      dap_an: k.dapAnDung,
      // Cửa nạp kho chỉ nhận `loi_giai` là ĐỐI TƯỢNG, và phiếu chỉ vẽ `chot`/`buoc`/`tung_*` (không vẽ `noi_dung`):
      // một chuỗi trơn ⇒ bọc vào `chot` để em thật sự đọc được lời giải.
      ...(!laRong(k.loiGiai) ? { loi_giai: typeof k.loiGiai === 'string' ? { chot: k.loiGiai } : k.loiGiai } : {}),
      ...(k.anhLoiGiai.length > 0 ? { hinh: [...hinh, ...k.anhLoiGiai] } : {}),
    }
  })
}

const TEN_MUC = ['Biết', 'Hiểu', 'Vận dụng'] as const
export const tenMucBac = (n: number): string => TEN_MUC[n] ?? ''

// ───────────────────────── thẻ cuối chặng: "hôm nay em tiến thêm gì" ─────────────────────────
// Bản vẽ đã duyệt: docs/ban-ve-btvn-nang-do-2109/hs-3-the-cuoi-chang.jpg. CHỈ số đếm, so em với chính em; không xếp hạng,
// không chữ "nắm chắc", không kết luận năng lực. Có gì thì nói, không có thì im — không bịa (`coTienBo:false` ⇒ thẻ im).

export interface TheChangView {
  tieuDe: string
  /** Dòng phụ dưới tiêu đề. */
  phu: string
  /** true khi có ít nhất một tiến triển để kể (dạng lên bậc / đúng lại / câu mới / dạng mới). */
  coTienBo: boolean
  dangLenBac: { ten: string; tu: string; den: string }[]
  dong: { kieu: 'lai' | 'moi' | 'dang'; chu: string }[]
  exp: { homNay: number; conLai: number | null } | null
  /** Chỉ khi chặng CUỐI vừa xong và máy chủ đã tự chốt nộp bài. */
  nop: { chu: string; ghiThuong: string | null } | null
  tram: { xong: number; tong: number } | null
}

/** null khi chặng CHƯA xong hẳn (còn câu bỏ trống): chỉ làm mới phiếu, không bật thẻ. */
export function theChangView(ket: KetQuaChang, soChang?: number | null): TheChangView | null {
  if (!ket.ok || !ket.chang?.xong) return null
  const k = ket.chang.chiSo + 1
  const tong = soChang && soChang > 0 ? soChang : null
  const dangLenBac = (ket.tienBo?.dangLenBac ?? [])
    .map((d) => ({ ten: d.ten, tu: tenMucBac(d.tu), den: tenMucBac(d.den) }))
    .filter((d) => d.tu !== '' && d.den !== '')
  const dong: TheChangView['dong'] = []
  const t = ket.tienBo
  if (t && t.soCauDungLai > 0) dong.push({ kieu: 'lai', chu: `Đúng lại ${t.soCauDungLai} câu từng sai` })
  if (t && t.soCauMoiGap > 0) dong.push({ kieu: 'moi', chu: `Gặp ${t.soCauMoiGap} câu mới` })
  if (t && t.soDangMoi > 0) dong.push({ kieu: 'dang', chu: `Mở thêm ${t.soDangMoi} dạng mới` })
  const nop = ket.nop
    ? {
        chu: `Em đã xong cả bài: đúng ${ket.nop.soDung}/${ket.nop.soCau} câu`,
        ghiThuong: ket.nop.soCauThuongSai > 0 ? `${ket.nop.soCauThuongSai} câu thưởng chưa đúng không bị tính vào điểm.` : null,
      }
    : null
  return {
    tieuDe: nop ? 'Xong cả bài' : `Xong chặng ${k}`,
    phu: `Chặng ${k}${tong ? `/${tong}` : ''} · đúng ${ket.chang.soDung}/${ket.chang.soCau} câu`,
    coTienBo: dangLenBac.length > 0 || dong.length > 0,
    dangLenBac,
    dong,
    exp: ket.exp && ket.exp.homNay > 0 ? { homNay: ket.exp.homNay, conLai: ket.exp.conLaiLenCap } : null,
    nop,
    tram: tong ? { xong: Math.min(ket.loDaXong ?? k, tong), tong } : null,
  }
}
