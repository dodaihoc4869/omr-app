// ĐIỀU KHIỂN MÁY CHIẾU TỪ XA BẰNG ĐIỆN THOẠI (REMOTE CONTROL)
//
// Giáo viên dùng điện thoại điều khiển máy chiếu trong lớp qua WiFi/4G hoặc cùng máy:
//   - Bấm "Lên bảng": máy chiếu kích hoạt hiệu ứng mời em lên bảng (thần thú, vầng hào quang).
//   - Bấm "Hiện lời giải / Ẩn lời giải": máy chiếu mở/đóng lời giải chi tiết theo thời gian thực.
//   - Chuyển câu trước / sau, bước tiếp (Space), chấm Đạt / Chưa đạt, đổi em khác.
//   - Trên điện thoại giáo viên xem được toàn bộ đề bài, đáp án đúng và lời giải chi tiết để giảng dạy.

export interface CauPhienToChieu {
  soCau: number
  phan?: string
  sbd?: string
  hoTen?: string
  lop?: string
  lanLenBang?: number
  qid?: string
  de?: string
  pa?: string[]
  dapAn?: string
  loiGiai?: string
  huongDan?: string
  kienThucCotLoi?: string
  mucDo?: string
  sao?: number
  tuLuan?: boolean
  hinhAnh?: { src: string; viTri?: string; alt?: string }[]
}

export interface LenhRemoteToChieu {
  id: number
  loai: 'LEN_BANG' | 'BAT_LOI_GIAI' | 'CHUYEN_DOT' | 'CHAM' | 'BUOC_TIEP' | 'DOI_EM' | 'XUONG' | 'LEN'
  thamSo?: any
  thoiGian: number
}

export interface PhienToChieu {
  maPhien: string
  maPin: string
  tieuDe?: string
  ngayTao: number
  capNhatCuoi: number
  dotHienTai: number
  tongSoDot: number
  pha: string // 'cho' | 'goi' | 'chua'
  loiGiaiMo: boolean
  daCham: Record<string, boolean>
  dsO: CauPhienToChieu[]
  lenhCho: LenhRemoteToChieu[]
  soThuTuLenh: number
}

// Bộ nhớ isolate của Cloudflare Worker (giữ các phiên đang chiếu trong ngày)
const KHO_PHIEN = new Map<string, PhienToChieu>()
const TRA_CUU_PIN = new Map<string, string>() // maPin -> maPhien

function sinhMaPin(): string {
  // 6 chữ số ngẫu nhiên dễ nhập trên điện thoại
  const n = Math.floor(100000 + Math.random() * 900000)
  return String(n)
}

function donDepPhienCu(): void {
  const bayGio = Date.now()
  const TOI_DA_MS = 24 * 3600 * 1000 // 24 giờ
  for (const [ma, p] of KHO_PHIEN.entries()) {
    if (bayGio - p.capNhatCuoi > TOI_DA_MS) {
      TRA_CUU_PIN.delete(p.maPin)
      KHO_PHIEN.delete(ma)
    }
  }
}

export function taoHoacCapNhatPhienToChieu(data: {
  maPhien: string
  maPin?: string
  tieuDe?: string
  dotHienTai?: number
  tongSoDot?: number
  pha?: string
  loiGiaiMo?: boolean
  dsO?: CauPhienToChieu[]
  daCham?: Record<string, boolean>
}): { ok: boolean; maPhien: string; maPin: string; phien: PhienToChieu } {
  donDepPhienCu()
  const ma = String(data.maPhien || '').trim()
  if (!ma) throw new Error('Thiếu mã phiên')

  let phien = KHO_PHIEN.get(ma)
  const bayGio = Date.now()

  if (!phien) {
    let pin = data.maPin || sinhMaPin()
    while (TRA_CUU_PIN.has(pin) && TRA_CUU_PIN.get(pin) !== ma) {
      pin = sinhMaPin()
    }
    phien = {
      maPhien: ma,
      maPin: pin,
      tieuDe: data.tieuDe || 'Tờ máy chiếu',
      ngayTao: bayGio,
      capNhatCuoi: bayGio,
      dotHienTai: typeof data.dotHienTai === 'number' ? data.dotHienTai : 0,
      tongSoDot: typeof data.tongSoDot === 'number' ? data.tongSoDot : (data.dsO?.length ?? 1),
      pha: data.pha || 'cho',
      loiGiaiMo: data.loiGiaiMo ?? false,
      daCham: data.daCham || {},
      dsO: Array.isArray(data.dsO) ? data.dsO : [],
      lenhCho: [],
      soThuTuLenh: 0,
    }
    KHO_PHIEN.set(ma, phien)
    TRA_CUU_PIN.set(pin, ma)
  } else {
    phien.capNhatCuoi = bayGio
    if (data.tieuDe) phien.tieuDe = data.tieuDe
    if (typeof data.dotHienTai === 'number') phien.dotHienTai = data.dotHienTai
    if (typeof data.tongSoDot === 'number') phien.tongSoDot = data.tongSoDot
    if (data.pha) phien.pha = data.pha
    if (typeof data.loiGiaiMo === 'boolean') phien.loiGiaiMo = data.loiGiaiMo
    if (Array.isArray(data.dsO) && data.dsO.length > 0) phien.dsO = data.dsO
    if (data.daCham) phien.daCham = { ...phien.daCham, ...data.daCham }
  }

  return { ok: true, maPhien: phien.maPhien, maPin: phien.maPin, phien }
}

export function layPhienToChieu(maHoacPin: string): PhienToChieu | null {
  const ma = String(maHoacPin || '').trim()
  if (!ma) return null
  if (KHO_PHIEN.has(ma)) return KHO_PHIEN.get(ma)!
  const maThat = TRA_CUU_PIN.get(ma)
  if (maThat && KHO_PHIEN.has(maThat)) return KHO_PHIEN.get(maThat)!
  return null
}

export function guiLenhToChieu(
  maPhien: string,
  loai: LenhRemoteToChieu['loai'],
  thamSo?: any,
): { ok: boolean; id: number; phien?: PhienToChieu } {
  const phien = layPhienToChieu(maPhien)
  if (!phien) return { ok: false, id: 0 }

  phien.soThuTuLenh++
  const lenh: LenhRemoteToChieu = {
    id: phien.soThuTuLenh,
    loai,
    thamSo,
    thoiGian: Date.now(),
  }
  phien.lenhCho.push(lenh)
  // Chỉ giữ tối đa 50 lệnh gần nhất
  if (phien.lenhCho.length > 50) {
    phien.lenhCho = phien.lenhCho.slice(-50)
  }
  phien.capNhatCuoi = Date.now()

  // Đồng thời cập nhật trạng thái ước lượng trên phiên
  if (loai === 'LEN_BANG') {
    phien.pha = 'goi'
  } else if (loai === 'BAT_LOI_GIAI') {
    if (thamSo && typeof thamSo.mo === 'boolean') phien.loiGiaiMo = thamSo.mo
    else phien.loiGiaiMo = !phien.loiGiaiMo
  } else if (loai === 'CHUYEN_DOT' && typeof thamSo?.dot === 'number') {
    phien.dotHienTai = thamSo.dot
    phien.loiGiaiMo = false
    phien.pha = 'cho'
  } else if (loai === 'CHAM' && thamSo?.khoa) {
    phien.daCham[thamSo.khoa] = Boolean(thamSo.dat)
  }

  return { ok: true, id: lenh.id, phien }
}

export function layLenhMoiToChieu(
  maPhien: string,
  sauId = 0,
): { ok: boolean; lenh: LenhRemoteToChieu[]; phien?: PhienToChieu } {
  const phien = layPhienToChieu(maPhien)
  if (!phien) return { ok: false, lenh: [] }
  phien.capNhatCuoi = Date.now()
  const lenh = phien.lenhCho.filter((x) => x.id > sauId)
  return { ok: true, lenh, phien }
}

export function capNhatTrangThaiToChieu(
  maPhien: string,
  trangThai: {
    dotHienTai?: number
    tongSoDot?: number
    pha?: string
    loiGiaiMo?: boolean
    daCham?: Record<string, boolean>
    doiEm?: { khoa: string; sbd: string; hoTen: string }
  },
): { ok: boolean; phien?: PhienToChieu } {
  const phien = layPhienToChieu(maPhien)
  if (!phien) return { ok: false }
  phien.capNhatCuoi = Date.now()
  if (typeof trangThai.dotHienTai === 'number') phien.dotHienTai = trangThai.dotHienTai
  if (typeof trangThai.tongSoDot === 'number') phien.tongSoDot = trangThai.tongSoDot
  if (trangThai.pha) phien.pha = trangThai.pha
  if (typeof trangThai.loiGiaiMo === 'boolean') phien.loiGiaiMo = trangThai.loiGiaiMo
  if (trangThai.daCham) phien.daCham = { ...phien.daCham, ...trangThai.daCham }
  if (trangThai.doiEm) {
    const o = phien.dsO.find((x) => x.qid === trangThai.doiEm!.khoa || (x.sbd && `${x.sbd}|${x.qid}` === trangThai.doiEm!.khoa))
    if (o) {
      o.sbd = trangThai.doiEm.sbd
      o.hoTen = trangThai.doiEm.hoTen
    }
  }
  return { ok: true, phien }
}
