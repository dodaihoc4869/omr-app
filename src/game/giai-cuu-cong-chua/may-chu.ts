/**
 * MÁY KHÁCH NỐI MÁY CHỦ GAME.
 *
 * Đợt 2 chọn **vẽ theo máy chủ, có nội suy** — KHÔNG dự đoán tại máy khách.
 *
 * Vì sao: dự đoán rồi hoà giải là nguồn lỗi lớn nhất của game nhiều người, và
 * nó chỉ đáng làm khi đã đo thấy có độ trễ khó chịu thật. Máy chủ bắn 20 ảnh
 * mỗi giây; máy khách nội suy giữa hai ảnh gần nhất nên hình vẫn mượt 60 hình
 * mỗi giây. Nếu chơi thật thấy nặng tay thì đợt 3 thêm dự đoán — sửa đặc tả
 * trước, code sau.
 */
import {
  PHIEN_BAN_GIAO_THUC, taoMaMay,
  type GoiAnh, type GoiLen, type GoiXuong,
} from './giao-thuc'
import type { MaDoKho } from './do-kho'
import type { VanChoi } from './van-choi'

export type TrangThaiNoi = 'chuaNoi' | 'dangNoi' | 'daNoi' | 'dut'

export interface TayCam {
  trai: boolean
  phai: boolean
  /** true đúng một khung hình khi vừa bấm nhảy. */
  nhay: boolean
}

export interface BoNghe {
  phongCho?: (g: Extract<GoiXuong, { loai: 'phongCho' }>) => void
  vaoVan?: (g: Extract<GoiXuong, { loai: 'vaoVan' }>) => void
  ketVan?: (g: Extract<GoiXuong, { loai: 'ketVan' }>) => void
  loi?: (g: Extract<GoiXuong, { loai: 'loi' }>) => void
  doiTrangThai?: (t: TrangThaiNoi) => void
}

const KHOA_MA_MAY = 'gcc_ma_may'

/** Mã máy 16 byte, giữ lại giữa các lần chơi. Không tra ngược ra em nào. */
export function maMayCuaToi(): string {
  try {
    const cu = localStorage.getItem(KHOA_MA_MAY)
    if (cu && /^[0-9a-f]{32}$/.test(cu)) return cu
    const moi = taoMaMay()
    localStorage.setItem(KHOA_MA_MAY, moi)
    return moi
  } catch {
    return taoMaMay()   // chế độ ẩn danh: dùng tạm, không giữ lại
  }
}

export class NoiMayChu {
  private o: WebSocket | null = null
  private stt = 0
  private anhTruoc: GoiAnh | null = null
  private anhSau: GoiAnh | null = null
  private nhanLuc = 0
  trangThai: TrangThaiNoi = 'chuaNoi'
  idCuaBan = -1

  private diaChi: string
  private nghe: BoNghe

  constructor(diaChi: string, nghe: BoNghe = {}) {
    this.diaChi = diaChi
    this.nghe = nghe
  }

  private datTrangThai(t: TrangThaiNoi): void {
    this.trangThai = t
    this.nghe.doiTrangThai?.(t)
  }

  noi(maPhong: string, bietDanh: string): void {
    this.dong()
    this.datTrangThai('dangNoi')
    const url = this.diaChi.replace(/^http/, 'ws') + '/phong/' + maPhong
    const o = new WebSocket(url)
    this.o = o
    o.onopen = () => {
      this.datTrangThai('daNoi')
      this.gui({ loai: 'vao', bietDanh, maMay: maMayCuaToi(), phienBan: PHIEN_BAN_GIAO_THUC })
    }
    o.onclose = () => this.datTrangThai('dut')
    o.onerror = () => this.datTrangThai('dut')
    o.onmessage = (e) => {
      let g: GoiXuong
      try { g = JSON.parse(String(e.data)) as GoiXuong } catch { return }
      this.nhan(g)
    }
  }

  private nhan(g: GoiXuong): void {
    switch (g.loai) {
      case 'anh':
        this.anhTruoc = this.anhSau
        this.anhSau = g
        this.nhanLuc = performance.now()
        break
      case 'vaoVan':
        this.idCuaBan = g.idCuaBan
        this.anhTruoc = null; this.anhSau = null
        this.nghe.vaoVan?.(g)
        break
      case 'phongCho': this.nghe.phongCho?.(g); break
      case 'ketVan': this.nghe.ketVan?.(g); break
      case 'loi': this.nghe.loi?.(g); break
      default: break
    }
  }

  gui(g: GoiLen): void {
    if (this.o && this.o.readyState === WebSocket.OPEN) this.o.send(JSON.stringify(g))
  }

  /** Gửi phím. KHÔNG kèm toạ độ — máy chủ tự tính. */
  guiPhim(tay: TayCam): void {
    this.gui({ loai: 'phim', trai: tay.trai, phai: tay.phai, nhay: tay.nhay, stt: ++this.stt })
  }

  chonChat(hoaChat: string): void { this.gui({ loai: 'chonChat', hoaChat }) }
  chonMuc(doKho: MaDoKho): void { this.gui({ loai: 'chonMuc', doKho }) }

  /**
   * Đắp hai ảnh gần nhất vào một `VanChoi` cục bộ để VẼ.
   *
   * Ván cục bộ ở đây chỉ là cái khung để vẽ — mọi con số đều do máy chủ đưa.
   * Nội suy tuyến tính giữa hai ảnh, trễ đúng một nhịp (50 ms) để luôn có hai
   * mốc mà nội suy, không phải ngoại suy rồi giật lại.
   */
  dapVaoVan(van: VanChoi): void {
    const a = this.anhTruoc, b = this.anhSau
    if (!b) return
    const nhip = 1000 / 20
    let k = 1
    if (a) k = Math.min(1, (performance.now() - this.nhanLuc) / nhip)

    van.giay = b.giay
    van.pha = b.pha as VanChoi['pha']
    van.canhMoDau = b.canhMoDau
    for (const nb of b.nguoi) {
      const n = van.nguoi.find((x) => x.id === nb.id)
      if (!n) continue
      const na = a?.nguoi.find((x) => x.id === nb.id)
      n.x = na ? na.x + (nb.x - na.x) * k : nb.x
      n.y = na ? na.y + (nb.y - na.y) * k : nb.y
      n.vy = nb.vy
      n.huong = nb.huong
      n.tuThe = nb.tuThe
      n.mang = nb.mang
      n.hoaChat = nb.hoaChat
      n.song = nb.song
      n.batTuDen = nb.batTu
      n.khongLoDen = nb.khongLo
    }
    const quai = new Set(b.quaiSong)
    van.quai.forEach((q, i) => { q.song = quai.has(i) })
    const hoa = new Set(b.hoaCon)
    van.hoa.forEach((h, i) => { h.conDo = hoa.has(i) })
    if (b.rong) {
      van.rong.x = b.rong.x
      van.rong.mau = b.rong.mau
      van.rong.pha = b.rong.pha as VanChoi['rong']['pha']
      van.rong.hoaChat = b.rong.hoaChat
      van.rong.cotConLai = b.rong.cotConLai
    }
  }

  dong(): void {
    if (this.o) { try { this.o.close() } catch { /* đã đóng */ } this.o = null }
    this.anhTruoc = null; this.anhSau = null; this.stt = 0
  }
}
