// ĐỒNG BỘ ĐIỀU KHIỂN TỜ MÁY CHIẾU ↔ ĐIỆN THOẠI (CLIENT-SIDE)
//
// Hai kênh đồng bộ:
//   1. Cùng thiết bị / cùng trình duyệt: BroadcastChannel('ddh-to-chieu-' + maPhien) tức thì 0ms.
//   2. Khác thiết bị (Điện thoại 4G/WiFi ↔ Máy tính kết nối máy chiếu):
//      Cloudflare Worker API (/gv/to-chieu/*).

import { layDiaChiMayChu } from './dia-chi-may-chu'

export interface CauPhienToChieu {
  khoa: string
  dot: number
  soCau?: number
  phan?: string
  sao?: number
  sbd?: string
  hoTen?: string
  lop?: string
  lanLenBang?: number
  qid?: string
  de?: string
  pa?: string[]
  dapAn?: any
  loiGiai?: string
  huongDan?: string
  kienThucCotLoi?: string
  mucDo?: string
  tuLuan?: boolean
  hinhAnh?: string[]
}

export interface PhienToChieu {
  maPhien: string
  tieuDe?: string
  dotHienTai: number
  tongSoDot: number
  pha?: string
  loiGiaiMo?: boolean
  dsO?: CauPhienToChieu[]
  daCham?: Record<string, boolean>
  maPin?: string
}

export interface ThongTinPhienGui {
  maPhien: string
  tieuDe?: string
  dotHienTai?: number
  tongSoDot?: number
  pha?: string
  loiGiaiMo?: boolean
  dsO?: any[]
  daCham?: Record<string, boolean>
}

export interface LenhRemoteNhan {
  id: number
  loai: 'LEN_BANG' | 'BAT_LOI_GIAI' | 'CHUYEN_DOT' | 'CHAM' | 'BUOC_TIEP' | 'DOI_EM' | 'XUONG' | 'LEN'
  thamSo?: any
  thoiGian: number
}

export interface TrangThaiToChieuClient {
  dot: number
  soDot: number
  pha: string
  lgMo: boolean
}

/** Đăng ký hoặc cập nhật phiên chiếu lên máy chủ để điện thoại có thể truy cập */
export async function dangKyPhienMayChu(thongTin: ThongTinPhienGui): Promise<{ ok: boolean; maPin?: string; error?: string }> {
  try {
    const base = await layDiaChiMayChu()
    if (!base) return { ok: false, error: 'Chưa có địa chỉ máy chủ' }

    const res = await fetch(`${base}/gv/to-chieu/phien`, {
      method: 'POST',
      headers: { 'content-type': 'application/json;charset=utf-8' },
      body: JSON.stringify(thongTin),
    })
    const data = (await res.json()) as any
    if (data && data.ok) {
      return { ok: true, maPin: data.maPin }
    }
    return { ok: false, error: data?.error || 'Lỗi đăng ký phiên' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Không kết nối được máy chủ' }
  }
}

/** Điện thoại lấy toàn bộ thông tin phiên (danh sách câu, lời giải, trạng thái) */
export async function layThongTinPhien(maHoacPin: string): Promise<{ ok: boolean; phien?: any; error?: string }> {
  try {
    const base = await layDiaChiMayChu()
    if (!base) return { ok: false, error: 'Chưa có địa chỉ máy chủ' }

    const res = await fetch(`${base}/gv/to-chieu/phien?ma=${encodeURIComponent(maHoacPin)}`, {
      method: 'GET',
      headers: { 'content-type': 'application/json;charset=utf-8' },
    })
    const data = (await res.json()) as any
    if (data && data.ok && data.phien) {
      return { ok: true, phien: data.phien }
    }
    return { ok: false, error: data?.error || 'Không tìm thấy phiên' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Lỗi kết nối' }
  }
}

/** Điện thoại gửi lệnh điều khiển lên máy chủ + BroadcastChannel */
export async function guiLenhRemote(
  maPhien: string,
  loai: LenhRemoteNhan['loai'],
  thamSo?: any,
): Promise<{ ok: boolean; error?: string }> {
  // 1. Gửi qua BroadcastChannel cục bộ nếu cùng máy (0ms)
  try {
    if (typeof BroadcastChannel !== 'undefined' && maPhien) {
      const bc = new BroadcastChannel('ddh-to-chieu-' + maPhien)
      bc.postMessage({ type: 'ddh-mc-lenh', loai, thamSo })
      setTimeout(() => bc.close(), 100)
    }
  } catch {
    /* bỏ qua nếu trình duyệt không hỗ trợ */
  }

  // 2. Gửi lên máy chủ Cloudflare Worker
  try {
    const base = await layDiaChiMayChu()
    if (!base) return { ok: true } // Vẫn coi như ok nếu đã bắn qua BroadcastChannel

    const res = await fetch(`${base}/gv/to-chieu/lenh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json;charset=utf-8' },
      body: JSON.stringify({ maPhien, loai, thamSo }),
    })
    const data = (await res.json()) as any
    return { ok: Boolean(data?.ok), error: data?.error }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Lỗi mạng khi gửi lệnh' }
  }
}

/** Máy tính cập nhật trạng thái chiếu hiện tại lên máy chủ + BroadcastChannel */
export async function capNhatTrangThaiServer(
  maPhien: string,
  trangThai: {
    dotHienTai?: number
    tongSoDot?: number
    pha?: string
    loiGiaiMo?: boolean
    daCham?: Record<string, boolean>
  },
): Promise<void> {
  try {
    const base = await layDiaChiMayChu()
    if (!base) return
    await fetch(`${base}/gv/to-chieu/trang-thai`, {
      method: 'POST',
      headers: { 'content-type': 'application/json;charset=utf-8' },
      body: JSON.stringify({ maPhien, ...trangThai }),
    })
  } catch {
    /* im lặng bỏ qua khi lỗi cập nhật nền */
  }
}

/** Điện thoại kiểm tra trạng thái máy chiếu đang hiển thị */
export async function layTrangThaiServer(
  maPhien: string,
): Promise<{ ok: boolean; dotHienTai?: number; tongSoDot?: number; pha?: string; loiGiaiMo?: boolean; daCham?: Record<string, boolean> }> {
  try {
    const base = await layDiaChiMayChu()
    if (!base) return { ok: false }
    const res = await fetch(`${base}/gv/to-chieu/trang-thai?ma=${encodeURIComponent(maPhien)}`)
    const data = (await res.json()) as any
    return data && data.ok ? data : { ok: false }
  } catch {
    return { ok: false }
  }
}

/** Lớp lắng nghe lệnh từ điện thoại trên máy tính đang chiếu */
export class BoLangNgheLenhToChieu {
  private maPhien: string
  private sauId = 0
  private daDung = false
  private henPoll: ReturnType<typeof setTimeout> | null = null
  private bc: BroadcastChannel | null = null
  private onLenh: (lenh: LenhRemoteNhan) => void

  constructor(maPhien: string, onLenh: (lenh: LenhRemoteNhan) => void) {
    this.maPhien = maPhien
    this.onLenh = onLenh

    // 1. Lắng nghe BroadcastChannel cục bộ (0ms)
    try {
      if (typeof BroadcastChannel !== 'undefined' && maPhien) {
        this.bc = new BroadcastChannel('ddh-to-chieu-' + maPhien)
        this.bc.onmessage = (e) => {
          const d = e?.data
          if (d && (d.type === 'ddh-mc-lenh' || d.type === 'mc-lenh' || d.loai)) {
            const loai = d.lenh || d.loai
            this.onLenh({ id: Date.now(), loai, thamSo: d.thamSo, thoiGian: Date.now() })
          }
        }
      }
    } catch {
      /* trình duyệt không hỗ trợ */
    }

    // 2. Bắt đầu polling lệnh từ máy chủ
    void this.poll()
  }

  private async poll() {
    if (this.daDung) return
    try {
      const base = await layDiaChiMayChu()
      if (base && this.maPhien) {
        const res = await fetch(`${base}/gv/to-chieu/lenh-moi?ma=${encodeURIComponent(this.maPhien)}&sau=${this.sauId}`)
        const data = (await res.json()) as any
        if (data && data.ok && Array.isArray(data.lenh)) {
          for (const l of data.lenh) {
            if (l.id > this.sauId) {
              this.sauId = l.id
              this.onLenh(l)
            }
          }
        }
      }
    } catch {
      /* lỗi mạng tạm thời, tiếp tục thử lại */
    }

    if (!this.daDung) {
      // Nhịp poll ngắn 650ms để phản hồi nhanh gần như tức thời khi điều khiển qua 4G/WiFi
      this.henPoll = setTimeout(() => void this.poll(), 650)
    }
  }

  dung() {
    this.daDung = true
    if (this.henPoll) {
      clearTimeout(this.henPoll)
      this.henPoll = null
    }
    if (this.bc) {
      this.bc.close()
      this.bc = null
    }
  }
}
