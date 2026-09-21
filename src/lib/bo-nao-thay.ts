/** BỘ NÃO AI — LỚP NỐI của app thầy (Code 4, đề bài `prompt-bo-nao.md` mục Code 4, bản vẽ `docs/ban-ve-bo-nao-2109/`).
 *
 *  Mọi thứ dính hợp đồng máy chủ (đường lệnh, tên trường, hình dạng phản hồi) nằm ở ĐÂY; màn chỉ đọc các kiểu bên dưới. Hợp đồng chính thức là
 *  `docs/hop-dong-bo-nao-2109.md` (Code 1, 21/09) — đổi hợp đồng thì sửa tại đây, màn không vỡ.
 *  Lệnh thầy CHỈ ĐỌC trừ `boDieuChinh` và `datCauHinhBoNao`. Máy chủ chưa có lệnh ⇒ trả lời bằng LỜI THẬT ("bộ não chưa chạy"), KHÔNG giả số, KHÔNG dựng bản tin.
 *  Bộ não chỉ VẶN NÚM trong khung (nhịp, dạng, cờ, lời nhắn); nó không bao giờ chọn câu, sửa điểm hay gửi gì cho phụ huynh. */

import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'
export type { KetQuaLenh } from './goi-lenh-thay'

export type LoaiDongBanTin = 'can_thay_y' | 'ca_lop' | 'goi_len_bang' | 'dieu_chinh' | 'thay_xem_lai'
export type HanhDongDong = 'khong' | 'goi_len_bang' | 'dua_vao_buoi_chua' | 'nhan_phu_huynh' | 'giao_bai_rieng' | 'xem_ho_so'
export type CheDoBoNao = 'bong' | 'that'
export type KetQuaDieuChinh = 'an_thua' | 'khong_doi' | 'xau_di' | 'chua_du_du_lieu'

/** Một dòng bản tin sáng (≤ 6 dòng). `sbd`/`hoTen` do MÁY CHỦ ghép (AI chỉ viết chữ không tên); rỗng với dòng nói về cả lớp. */
export interface DongBanTin {
  loai: LoaiDongBanTin
  chu: string
  sbd: string
  hoTen: string
  dang: string
  hanhDong: HanhDongDong
  /** Bộ não TỰ HÀNH (thầy chốt 21/09): điều chỉnh của dòng này ĐÃ ÁP cho em (`false` = chỉ ghi sổ / chạy bóng). Vắng ⇒ theo chế độ của lớp. */
  apDung: boolean | null
  /** Kết quả HÔM SAU của điều chỉnh hôm qua cho em ấy (máy chủ tự chấm) + câu ngắn máy chủ ghép; `tuGo` = kết quả xấu ⇒ bộ não đã tự gỡ. Vắng ⇒ chưa có. */
  ketQua: KetQuaDieuChinh | null
  ketQuaChu: string
  tuGo: boolean
  /** Ngày của điều chỉnh (để gọi Bỏ); vắng ⇒ dùng `ngay` của bản tin. */
  ngayDieuChinh: string
}

export interface DemQua {
  ngay: string
  /** ISO — lúc bộ não chạy lần cuối; `null` = chưa chạy lần nào. */
  chayLanCuoi: string | null
  bat: boolean
  cheDo: CheDoBoNao
  /** Lớp đang ở chế độ THẬT (chỉ có nghĩa khi `cheDo === 'that'`). */
  lopThat: string[]
  soEm: number | null
  /** Số em có điều chỉnh ĐÃ ÁP đêm qua (chạy bóng ⇒ 0). Vắng ⇒ null: màn tự tính từ `soDieuChinh` hoặc không nêu số. */
  soEmHoTro: number | null
  soSoiNhanh: number | null
  soSoiKy: number | null
  soVang: number | null
  /** `nhan` = qua kiểm khuôn · `chiGhiSo` = độ tin cậy < 0,5 (không áp dụng) · `biLoai` = sai khuôn. */
  soDieuChinh: { nhan: number; chiGhiSo: number; biLoai: number } | null
  banTin: DongBanTin[]
}

export interface DongNhatKy {
  ngay: string
  hetHan: string
  cheDo: CheDoBoNao
  doTin: number
  nhip: { lech: number; khoiDong: number } | null
  /** `ten` = tên dạng do máy chủ trả cạnh mã (Code 3, đề nghị 21/09); vắng ⇒ màn nói "dạng chưa đặt tên (mã …)". */
  dang: { ma: string; ten: string; hanhDong: string; lyDo: string }[]
  co: string
  loiNhanChoEm: string
  /** NGUYÊN VĂN lời cho phụ huynh (chỉ khi đáng) và thư tuần — thầy xem lại được cả hai; chạy thử thì CHƯA gửi. Vắng ⇒ rỗng. */
  loiNhanChoPhuHuynh: string
  thuTuan: string
  goiYChoThay: { chu: string; hanhDong: string; dang: string } | null
  ghiChuHlv: string
  /** Núm KHẮC PHỤC LUÔN (rút câu cùng dạng chưa giao / kéo ôn về sớm) — thuật toán thực hiện, AI chỉ chọn dạng. */
  khacPhuc: { dang: string; tenDang: string; kieu: 'khac_phuc' | 'on_som'; soCau: number | null; bac: string }[]
  /** Đã ÁP cho em (chế độ thật + tin cậy đủ + chưa gỡ). `null` = máy chủ chưa nói. */
  apDung: boolean | null
  /** Núm bị lõi BTVN bỏ vì làm lõi không kịp hạn (deadline thắng mọi núm). */
  lyDoBo: string[]
  /** Bộ não tự gỡ vì kết quả hôm sau xấu. */
  tuGo: boolean
  ketQua: KetQuaDieuChinh | null
  ketQuaChu: string
  daBo: boolean
}

export interface CauHinhBoNao {
  bat: boolean
  cheDo: CheDoBoNao
  lopThat: string[]
}

/** Quá bấy nhiêu giờ kể từ lần chạy cuối thì cảnh báo (đề bài: 36 giờ). */
export const QUA_HAN_GIO = 36

const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const chu = (v: unknown): string => (typeof v === 'string' ? v : '')
const LOAI: LoaiDongBanTin[] = ['can_thay_y', 'ca_lop', 'goi_len_bang', 'dieu_chinh', 'thay_xem_lai']
const HANH: HanhDongDong[] = ['khong', 'goi_len_bang', 'dua_vao_buoi_chua', 'nhan_phu_huynh', 'giao_bai_rieng', 'xem_ho_so']
const KET_QUA: KetQuaDieuChinh[] = ['an_thua', 'khong_doi', 'xau_di', 'chua_du_du_lieu']
const cheDo = (v: unknown): CheDoBoNao => (v === 'that' ? 'that' : 'bong')

/** Bản tin đêm qua. Đọc rộng rãi: dòng thiếu chữ hoặc loại lạ thì BỎ (không đoán). Tối đa 6 dòng. */
export function docDemQua(j: Record<string, unknown>): DemQua {
  const bt = (j.banTin ?? {}) as { cacDong?: unknown }
  const ds = Array.isArray(bt) ? bt : Array.isArray(bt.cacDong) ? bt.cacDong : []
  const banTin: DongBanTin[] = []
  for (const x of ds as Record<string, unknown>[]) {
    if (!x || typeof x !== 'object') continue
    const c = chu(x.chu).trim()
    if (!c) continue
    const loai = LOAI.includes(x.loai as LoaiDongBanTin) ? (x.loai as LoaiDongBanTin) : null
    if (!loai) continue
    banTin.push({ loai, chu: c, sbd: chu(x.sbd), hoTen: chu(x.hoTen), dang: chu(x.dang), hanhDong: HANH.includes(x.hanhDong as HanhDongDong) ? (x.hanhDong as HanhDongDong) : 'khong', apDung: typeof x.apDung === 'boolean' ? x.apDung : null, ketQua: KET_QUA.includes(x.ketQua as KetQuaDieuChinh) ? (x.ketQua as KetQuaDieuChinh) : null, ketQuaChu: chu(x.ketQuaChu), tuGo: x.tuGo === true, ngayDieuChinh: chu(x.ngayDieuChinh) })
  }
  const dc = j.soDieuChinh as Record<string, unknown> | undefined
  const dieuChinh = dc && so(dc.nhan) !== null ? { nhan: so(dc.nhan)!, chiGhiSo: so(dc.chiGhiSo) ?? 0, biLoai: so(dc.biLoai) ?? 0 } : null
  return {
    ngay: chu(j.ngay),
    chayLanCuoi: chu(j.chayLanCuoi) || null,
    bat: j.bat !== false,
    cheDo: cheDo(j.cheDo),
    lopThat: Array.isArray(j.lopThat) ? (j.lopThat as unknown[]).map(String) : [],
    soEm: so(j.soEm),
    soEmHoTro: so(j.soEmHoTro),
    soSoiNhanh: so(j.soSoiNhanh),
    soSoiKy: so(j.soSoiKy),
    soVang: so(j.soVang),
    soDieuChinh: dieuChinh,
    banTin: banTin.slice(0, 6),
  }
}

export function docNhatKy(j: Record<string, unknown>): DongNhatKy[] {
  const ds = Array.isArray(j.ds) ? (j.ds as Record<string, unknown>[]) : []
  return ds
    .filter((x) => x && typeof x === 'object' && chu(x.ngay))
    .map((x) => {
      const nhip = x.nhip as { lech?: unknown; khoiDong?: unknown } | undefined
      const gy = x.goiYChoThay as { chu?: unknown; hanhDong?: unknown; dang?: unknown } | undefined
      return {
        ngay: chu(x.ngay),
        hetHan: chu(x.hetHan),
        cheDo: cheDo(x.cheDo),
        doTin: so(x.doTin) ?? 0,
        nhip: nhip && so(nhip.lech) !== null && so(nhip.khoiDong) !== null ? { lech: so(nhip.lech)!, khoiDong: so(nhip.khoiDong)! } : null,
        dang: Array.isArray(x.dang) ? (x.dang as Record<string, unknown>[]).map((d) => ({ ma: chu(d.ma), ten: chu(d.ten) || chu(d.tenDang), hanhDong: chu(d.hanhDong), lyDo: chu(d.lyDo) })) : [],
        co: chu(x.co),
        loiNhanChoEm: chu(x.loiNhanChoEm),
        loiNhanChoPhuHuynh: chu(x.loiNhanChoPhuHuynh),
        thuTuan: chu(x.thuTuan),
        goiYChoThay: gy && chu(gy.chu) ? { chu: chu(gy.chu), hanhDong: chu(gy.hanhDong), dang: chu(gy.dang) } : null,
        ghiChuHlv: chu(x.ghiChuHlv),
        khacPhuc: Array.isArray(x.khacPhuc) ? (x.khacPhuc as Record<string, unknown>[]).map((k) => ({ dang: chu(k.dang), tenDang: chu(k.tenDang) || chu(k.ten), kieu: k.kieu === 'on_som' ? ('on_som' as const) : ('khac_phuc' as const), soCau: so(k.soCau), bac: chu(k.bac) })) : [],
        apDung: typeof x.apDung === 'boolean' ? x.apDung : null,
        lyDoBo: Array.isArray(x.lyDoBo) ? (x.lyDoBo as unknown[]).map(String) : [],
        tuGo: x.tuGo === true,
        ketQua: KET_QUA.includes(x.ketQua as KetQuaDieuChinh) ? (x.ketQua as KetQuaDieuChinh) : null,
        ketQuaChu: chu(x.ketQuaChu),
        daBo: x.daBo === true,
      }
    })
}

/** `ngay` 'YYYY-MM-DD' (tuỳ chọn; mặc định đêm gần nhất có dữ liệu). */
export async function layDemQua(ngay?: string): Promise<KetQuaLenh<DemQua>> {
  const r = await goiLenh('/ai/dem-qua', ngay ? { ngay } : {}, 'Bộ não A.I chưa chạy — máy chủ chưa có bản tin Bộ não A.I.')
  return r.ok ? { ok: true, du: docDemQua(r.du) } : r
}

export async function layNhatKy(sbd: string): Promise<KetQuaLenh<DongNhatKy[]>> {
  const r = await goiLenh('/ai/nhat-ky', { sbd }, 'Bộ não A.I chưa chạy — máy chủ chưa có nhật ký điều chỉnh.')
  return r.ok ? { ok: true, du: docNhatKy(r.du) } : r
}

/** Bỏ MỘT điều chỉnh (thầy không đồng ý). Trả `du` = máy chủ báo `daBo`: `false` = KHÔNG có điều chỉnh nào để bỏ (đã bỏ / đã tự gỡ / không tồn tại) — màn không được nói "đã bỏ".
 *  Quá hạn chờ ⇒ nói CHƯA CHẮC đã bỏ (lệnh có thể đã tới máy chủ) — bài học từ "Thêm phút". */
export async function boDieuChinh(sbd: string, ngay: string): Promise<KetQuaLenh<boolean>> {
  const r = await goiLenh('/ai/dieu-chinh/bo', { sbd, ngay }, 'Máy chủ chưa có lệnh Bỏ điều chỉnh — chưa bỏ được.', 'Máy chủ trả lời chậm — CHƯA CHẮC đã bỏ điều chỉnh. Mở lại hồ sơ em để xem tình trạng thật.')
  return r.ok ? { ok: true, du: r.du.daBo === true } : r
}

function docCauHinh(j: Record<string, unknown>): CauHinhBoNao {
  const c = ((j.cauHinh ?? j.boNao ?? j) as Record<string, unknown>) || {}
  return { bat: c.bat !== false, cheDo: cheDo(c.cheDo), lopThat: Array.isArray(c.lopThat) ? (c.lopThat as unknown[]).map(String) : [] }
}

export async function layCauHinhBoNao(): Promise<KetQuaLenh<CauHinhBoNao>> {
  const r = await goiLenh('/ai/cau-hinh', {}, 'Máy chủ chưa có lệnh cài đặt Bộ não A.I — chưa đọc được công tắc.')
  return r.ok ? { ok: true, du: docCauHinh(r.du) } : r
}

/** Ghi công tắc / chế độ theo lớp. Máy chủ chưa có lệnh ⇒ "chưa lưu được" (KHÔNG giả là đã lưu). */
export async function datCauHinhBoNao(moi: Partial<CauHinhBoNao>): Promise<KetQuaLenh<CauHinhBoNao>> {
  const r = await goiLenh('/ai/cau-hinh', moi, 'Máy chủ chưa có lệnh cài đặt Bộ não A.I — chưa lưu được.', 'Máy chủ trả lời chậm — CHƯA CHẮC đã lưu. Tải lại trang để xem cài đặt thật.')
  return r.ok ? { ok: true, du: docCauHinh(r.du) } : r
}

// ─────────────────────────────── HIỂN THỊ ───────────────────────────────

export type TrangThaiChay = 'chua_chay' | 'binh_thuong' | 'qua_han'

/** Giờ kể từ lần chạy cuối (làm tròn xuống); `null` nếu chưa chạy / không đọc được. */
export function gioTuLanChay(chayLanCuoi: string | null, nayMs: number): number | null {
  if (!chayLanCuoi) return null
  const t = Date.parse(chayLanCuoi)
  if (!Number.isFinite(t)) return null
  return Math.max(0, Math.floor((nayMs - t) / 3_600_000))
}

export function trangThaiChay(chayLanCuoi: string | null, nayMs: number): TrangThaiChay {
  const g = gioTuLanChay(chayLanCuoi, nayMs)
  if (g === null) return 'chua_chay'
  return g > QUA_HAN_GIO ? 'qua_han' : 'binh_thuong'
}

const hai = (n: number) => String(n).padStart(2, '0')
/** "04:07 sáng nay" · "20/09 20:11" (giờ máy — máy thầy ở giờ VN). */
export function gioChayCuoi(iso: string, nayMs: number): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  const gio = `${hai(d.getHours())}:${hai(d.getMinutes())}`
  const homNay = new Date(nayMs)
  if (d.toDateString() === homNay.toDateString()) return `${gio} ${d.getHours() < 12 ? 'sáng nay' : 'hôm nay'}`
  return `${hai(d.getDate())}/${hai(d.getMonth() + 1)} ${gio}`
}

/** "5 giờ trước" / "vừa xong" / "2 ngày trước". */
export function truocDay(chayLanCuoi: string, nayMs: number): string {
  const g = gioTuLanChay(chayLanCuoi, nayMs)
  if (g === null) return ''
  if (g < 1) return 'vừa xong'
  if (g < 48) return `${g} giờ trước`
  return `${Math.floor(g / 24)} ngày trước`
}

export const NHAN_LOAI: Record<LoaiDongBanTin, { nhan: string; vai: 'loi' | 'thuong' | 'chinh' | 'tot' | 'canh' }> = {
  can_thay_y: { nhan: 'CẦN THẦY Ý', vai: 'loi' },
  ca_lop: { nhan: 'CẢ LỚP', vai: 'thuong' },
  goi_len_bang: { nhan: 'GỌI LÊN BẢNG', vai: 'chinh' },
  dieu_chinh: { nhan: 'ĐÃ LÀM', vai: 'tot' },
  thay_xem_lai: { nhan: 'THẦY XEM LẠI', vai: 'canh' },
}

/** Nhãn của dòng theo giọng TỰ HÀNH: CHỈ khi máy chủ nói `apDung:true` mới ghi "ĐÃ LÀM"; mới ghi sổ / chạy thử / máy chủ không nói ⇒ "ĐỀ XUẤT" (không nói đã làm khi chưa chắc đã làm — tầng áp dụng ở máy chủ có thể chưa bật). */
export function nhanCuaDong(d: DongBanTin): { nhan: string; vai: 'loi' | 'thuong' | 'chinh' | 'tot' | 'canh' } {
  if (d.loai === 'dieu_chinh' && d.apDung !== true) return { nhan: 'ĐỀ XUẤT', vai: 'thuong' }
  return NHAN_LOAI[d.loai]
}

/** Dòng CHỈ BÁO thầy (không có gì để bỏ): "thầy xem lại" và em vắng lâu (gợi ý nhắn phụ huynh). */
export function laDongChiBao(d: DongBanTin): boolean {
  return d.loai === 'thay_xem_lai' || (d.loai === 'can_thay_y' && d.hanhDong === 'nhan_phu_huynh')
}

/** Dòng còn có thể "Bỏ điều chỉnh": là điều chỉnh của MỘT em, chưa tự gỡ. */
export function coTheBoDong(d: DongBanTin): boolean {
  return d.loai === 'dieu_chinh' && !!d.sbd && !d.tuGo
}

/** Tiêu đề khối theo giọng TỰ HÀNH (thầy chốt 21/09). Chạy thật: "Bộ não A.I · đêm qua đã hỗ trợ N em"; chạy thử: chưa hỗ trợ ai nên chỉ nói đã soi bao nhiêu em; thiếu số thì KHÔNG nêu số. */
export function tieuDeKhoi(dem: Pick<DemQua, 'soEm' | 'soEmHoTro'>, tatCaThat: boolean): string {
  if (!tatCaThat) return dem.soEm === 0 ? 'Bộ não A.I · đêm qua chưa soi em nào' : dem.soEm != null ? `Bộ não A.I · đêm qua đã soi ${dem.soEm} em` : 'Bộ não A.I · đêm qua đã soi các em'
  // CHỈ nêu số em khi MÁY CHỦ nói (`soEmHoTro`): không suy từ số điều chỉnh qua kiểm khuôn, vì "qua kiểm khuôn" chưa có nghĩa là đã áp cho em.
  const n = dem.soEmHoTro
  if (n === null) return 'Bộ não A.I · đêm qua'
  return n > 0 ? `Bộ não A.I · đêm qua đã hỗ trợ ${n} em` : 'Bộ não A.I · đêm qua chưa áp điều chỉnh nào cho em'
}

/** Nút "Xem" của một dòng (thầy chỉ ĐỌC; "Bỏ điều chỉnh" là nút thứ hai, tuỳ thầy): NỐI HÀM SẴN CÓ — mở hồ sơ em, hoặc sang Gọi lên bảng với dòng nói về cả lớp. Không tạo luồng mới. `null` = dòng không có nút. */
export function nutCuaDong(d: DongBanTin): { nhan: string; dich: 'ho_so' | 'goi_len_bang' } | null {
  if (d.sbd) return { nhan: 'Xem', dich: 'ho_so' }
  if (d.hanhDong === 'goi_len_bang' || d.hanhDong === 'dua_vao_buoi_chua') return { nhan: 'Xem', dich: 'goi_len_bang' }
  return null
}

/** Tách chữ thành đoạn, in đậm các con số ("4/5", "12 ngày", "0,25") để thầy quét mắt lấy số. */
export function tachSoDam(van: string): { t: string; dam: boolean }[] {
  const kq: { t: string; dam: boolean }[] = []
  let cuoi = 0
  for (const m of van.matchAll(/\d+(?:[.,]\d+)?(?:\/\d+)?(?:\s?(?:ngày|câu|em|giây|lần|chặng|giờ|phút|%))?/gu)) {
    const i = m.index ?? 0
    if (i > cuoi) kq.push({ t: van.slice(cuoi, i), dam: false })
    kq.push({ t: m[0], dam: true })
    cuoi = i + m[0].length
  }
  if (cuoi < van.length) kq.push({ t: van.slice(cuoi), dam: false })
  return kq
}

export const NHAN_KET_QUA: Record<KetQuaDieuChinh | 'cho', { chu: string; vai: 'tot' | 'trung' | 'xau' | 'cho' }> = {
  an_thua: { chu: 'Có hiệu quả', vai: 'tot' },
  khong_doi: { chu: 'Không đổi', vai: 'trung' },
  xau_di: { chu: 'Chưa hiệu quả', vai: 'xau' },
  chua_du_du_lieu: { chu: 'Chưa đủ dữ liệu', vai: 'cho' },
  cho: { chu: 'Chờ dữ liệu ngày mai', vai: 'cho' },
}

export const TEN_HANH_DONG_DANG: Record<string, string> = {
  uu_tien: 'Ưu tiên',
  ha_mot_bac: 'Hạ một bậc',
  cho_thu_len_bac: 'Thử lên bậc',
  tam_nghi: 'Tạm nghỉ',
}

/** Điều chỉnh CÒN HIỆU LỰC (chưa hết hạn, chưa bị bỏ) — chỉ khi ấy mới có nút "Bỏ điều chỉnh này". `hetHan` là ngày 'YYYY-MM-DD' hoặc ISO; hết hạn tính hết ngày ấy. */
export function conHieuLuc(d: Pick<DongNhatKy, 'hetHan' | 'daBo' | 'tuGo'>, nayMs: number): boolean {
  if (d.daBo || d.tuGo || !d.hetHan) return false
  const t = /^\d{4}-\d{2}-\d{2}$/.test(d.hetHan) ? Date.parse(`${d.hetHan}T23:59:59`) : Date.parse(d.hetHan)
  return Number.isFinite(t) && nayMs <= t
}

/** "2026-09-22" → "22/09". */
export function ngayNgan(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}` : iso
}

/** Tên dạng cho thầy: có tên máy chủ trả thì dùng; CHƯA có ⇒ "dạng chưa đặt tên (mã …)" (không để mã trơ trọi — chuẩn từ ngữ luật 4). */
export function tenDangHienThi(ma: string, ten?: string): string {
  return ten && ten.trim() ? ten.trim() : `dạng chưa đặt tên (mã ${ma})`
}

/** Chữ mô tả "núm" cho thầy: "Nhịp −2 · khởi động 3" + các dạng ("Ưu tiên: <tên dạng>", "Ôn lại: <tên dạng>"). */
export function moTaNum(d: Pick<DongNhatKy, 'nhip' | 'dang' | 'co'> & Partial<Pick<DongNhatKy, 'khacPhuc'>>): { chinh: string; phu: string[] } {
  // Máy chủ điền nhịp mặc định {lech:0, khoiDong:2} khi bộ não KHÔNG vặn nhịp ⇒ không in "Nhịp ±0" như một thay đổi.
  const coVanNhip = d.nhip != null && !(d.nhip.lech === 0 && d.nhip.khoiDong === 2)
  const chinh = coVanNhip && d.nhip ? `Nhịp ${d.nhip.lech > 0 ? '+' : d.nhip.lech < 0 ? '−' : '±'}${Math.abs(d.nhip.lech)} · khởi động ${d.nhip.khoiDong}` : d.dang.length > 0 || (d.khacPhuc?.length ?? 0) > 0 ? '' : 'Giữ nguyên'
  const phu = d.dang.map((x) => `${TEN_HANH_DONG_DANG[x.hanhDong] ?? x.hanhDong}: ${tenDangHienThi(x.ma, x.ten)}`)
  for (const k of d.khacPhuc ?? []) phu.push(k.kieu === 'on_som' ? `Ôn sớm: ${tenDangHienThi(k.dang, k.tenDang)}` : `Ôn lại: ${tenDangHienThi(k.dang, k.tenDang)}${k.soCau ? ` · ${k.soCau} câu` : ''}${k.bac === 'thap_hon_mot_bac' ? ' · thấp hơn một bậc' : ''}`)
  return { chinh, phu }
}

/** Chế độ HIỆU LỰC của một lớp (hợp đồng): `lopThat.includes(L) ? 'that' : cheDo`. */
export function cheDoHieuLuc(c: Pick<CauHinhBoNao, 'cheDo' | 'lopThat'>, lop: string): CheDoBoNao {
  return c.lopThat.includes(lop) ? 'that' : c.cheDo
}

/** Danh sách lớp ở chế độ THẬT trong số `cacLop` (rỗng ⇒ mọi lớp đang CHẠY BÓNG). */
export function lopDangThat(c: Pick<CauHinhBoNao, 'cheDo' | 'lopThat'>, cacLop: string[]): string[] {
  return cacLop.filter((l) => cheDoHieuLuc(c, l) === 'that')
}

/** Cờ mới sau khi đổi MỘT lớp. Luôn viết ở dạng `cheDo:'bong'` + `lopThat` (hợp đồng chỉ cho lớp "thật" nằm trong `lopThat`): nếu cờ đang ở `cheDo:'that'` toàn cục thì mọi lớp còn lại được liệt kê vào `lopThat` để KHÔNG vô tình đổi chúng. */
export function doiCheDoLop(c: Pick<CauHinhBoNao, 'cheDo' | 'lopThat'>, cacLop: string[], lop: string, sang: CheDoBoNao): { cheDo: CheDoBoNao; lopThat: string[] } {
  const dangThat = new Set(lopDangThat(c, cacLop))
  if (sang === 'that') dangThat.add(lop)
  else dangThat.delete(lop)
  return { cheDo: 'bong', lopThat: cacLop.filter((l) => dangThat.has(l)) }
}
