// BTVN "NÂNG ĐỠ" — PHÍA MÁY EM. Hợp đồng: docs/hop-dong-btvn-nang-do-2109.md (mục 3, 4).
//
// Tệp THUẦN: đọc phản hồi máy chủ thành kiểu chặt, chia câu theo chặng, đặt tên nhãn,
// ghép kết quả chặng vào câu thô. Chỉ hai hàm lưu máy (`luuKetQuaChang`,
// `docKetQuaChangDaLuu`) chạm localStorage và đều bọc try/catch.
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

// ───────────────────────── lưu kết quả ở máy ─────────────────────────
// Máy chủ không gửi lại đáp án cho câu đã nộp qua `de.cau` — muốn xem lại lời giải chặng đã xong
// thì dùng chính kết quả máy chủ đã trả lúc nộp, giữ ở máy em.

export const khoaKetQuaChang = (maBtvn: string, sbd: string, chiSo: number): string => `ddh.btvn.ketqua.${maBtvn}.${sbd}.${chiSo}`

export interface KetQuaChangDaLuu {
  ketQua: KetQuaCauChang[]
  /** Đáp án em đã nộp (đáp án ĐẦU thắng, giống máy chủ). */
  dapAn: Record<string, string>
}

export function docKetQuaChangDaLuu(maBtvn: string, sbd: string, chiSo: number): KetQuaChangDaLuu {
  const rong: KetQuaChangDaLuu = { ketQua: [], dapAn: {} }
  try {
    const raw = localStorage.getItem(khoaKetQuaChang(maBtvn, sbd, chiSo))
    if (!raw) return rong
    const o = JSON.parse(raw) as unknown
    if (!laDoiTuong(o)) return rong
    const kq = docKetQuaChang({ ok: true, ketQua: o.ketQua })
    const dapAn: Record<string, string> = {}
    if (laDoiTuong(o.dapAn)) for (const [q, v] of Object.entries(o.dapAn)) if (typeof v === 'string') dapAn[q] = v
    return { ketQua: kq?.ketQua ?? [], dapAn }
  } catch {
    return rong
  }
}

/** Gộp thêm kết quả mới vào bản đã lưu. ĐÁP ÁN ĐẦU THẮNG: câu đã có thì giữ bản cũ. */
export function luuKetQuaChang(maBtvn: string, sbd: string, chiSo: number, moi: KetQuaCauChang[], dapAnGui: Record<string, string>): KetQuaChangDaLuu {
  const cu = docKetQuaChangDaLuu(maBtvn, sbd, chiSo)
  const coSan = new Set(cu.ketQua.map((k) => k.qid))
  const ketQua = [...cu.ketQua, ...moi.filter((k) => !coSan.has(k.qid))]
  const dapAn = { ...dapAnGui, ...cu.dapAn }
  for (const k of ketQua) if (!(k.qid in dapAn) && k.qid in dapAnGui) dapAn[k.qid] = dapAnGui[k.qid]
  const gop: KetQuaChangDaLuu = { ketQua, dapAn }
  try {
    localStorage.setItem(khoaKetQuaChang(maBtvn, sbd, chiSo), JSON.stringify(gop))
  } catch {
    /* máy chặn lưu: em vẫn thấy kết quả lần này, chỉ không xem lại được sau khi tải lại */
  }
  return gop
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
