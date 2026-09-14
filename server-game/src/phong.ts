/**
 * PHÒNG CHƠI — Durable Object. MÁY CHỦ LÀ TRỌNG TÀI DUY NHẤT.
 *
 * Mỗi phòng là một đối tượng, giữ đúng MỘT `VanChoi` và chạy nó 20 nhịp mỗi
 * giây. Máy khách gửi phím, máy chủ tính va chạm, tra bảng hoá chất, quyết ai
 * mất mạng, rồi bắn ảnh chụp xuống.
 *
 * Máy chủ chạy ĐÚNG mã mà máy khách chạy — cùng `van-choi.ts`, cùng
 * `bang-khac-che.ts`. Đó là lý do phải tách mô phỏng khỏi vẽ ngay từ đợt 1:
 * hai bộ luật viết hai lần là hai bộ luật sẽ lệch nhau.
 */
import { VanChoi } from '../../src/game/giai-cuu-cong-chua/van-choi'
import { CAU_HINH } from '../../src/game/giai-cuu-cong-chua/cau-hinh'
import { HOA_CHAT } from '../../src/game/giai-cuu-cong-chua/hoa-chat'
import { MUOI_HAI_NGUOI } from '../../src/game/giai-cuu-cong-chua/bo-nguoi'
import {
  PHIEN_BAN_GIAO_THUC, tron, loBietDanh,
  type GoiLen, type GoiXuong, type GoiAnh, type GoiPhongCho,
} from '../../src/game/giai-cuu-cong-chua/giao-thuc'
import type { MaDoKho } from '../../src/game/giai-cuu-cong-chua/do-kho'

interface Khach {
  o: WebSocket
  maMay: string
  bietDanh: string
  hoaChat: string | null
  /** id trong ván, gán khi ván bắt đầu. -1 khi còn ở phòng chờ. */
  id: number
  sttCuoi: number
}

const GIAY_CHO = 30
const NHIP_MS = Math.round(1000 / CAU_HINH.NHIP_MAY_CHU_HZ)

export class PhongChoi {
  private khach = new Map<WebSocket, Khach>()
  private van: VanChoi | null = null
  private maPhong = ''
  private doKho: MaDoKho = 'do'
  private hetChoLuc = 0
  private dongHo: number | null = null

  // DurableObjectState chưa cần dùng: ván sống trong bộ nhớ, rớt phòng là
  // xoá ván — không có gì đáng ghi xuống đĩa, và cũng không nên ghi.
  constructor(_state: DurableObjectState) {
    // không giữ gì: ván sống trong bộ nhớ, rớt phòng là xoá ván.
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)
    this.maPhong = url.searchParams.get('ma') ?? this.maPhong
    if (req.headers.get('Upgrade') !== 'websocket') {
      return new Response(JSON.stringify({ soNguoi: this.khach.size, dangChoi: this.van !== null }), {
        headers: { 'content-type': 'application/json' },
      })
    }
    const cap = new WebSocketPair()
    const [client, server] = [cap[0], cap[1]]
    server.accept()
    this.gan(server)
    return new Response(null, { status: 101, webSocket: client })
  }

  private gui(o: WebSocket, g: GoiXuong): void {
    try { o.send(JSON.stringify(g)) } catch { this.roi(o) }
  }

  private phat(g: GoiXuong): void {
    for (const o of this.khach.keys()) this.gui(o, g)
  }

  private gan(o: WebSocket): void {
    o.addEventListener('message', (e) => {
      let g: GoiLen
      try { g = JSON.parse(String(e.data)) as GoiLen } catch {
        this.gui(o, { loai: 'loi', ma: 'goiLa', loi: 'gói không đọc được' }); return
      }
      this.nhan(o, g)
    })
    o.addEventListener('close', () => this.roi(o))
    o.addEventListener('error', () => this.roi(o))
  }

  private roi(o: WebSocket): void {
    const k = this.khach.get(o)
    this.khach.delete(o)
    // Đang chơi mà rớt mạng: người đó thành BOT, ván không dừng lại vì một người.
    if (k && this.van && k.id >= 0) {
      const n = this.van.nguoi.find((x) => x.id === k.id)
      if (n) n.laBot = true
    }
    if (this.khach.size === 0) this.dungDongHo()
    else if (!this.van) this.banPhongCho()
  }

  private nhan(o: WebSocket, g: GoiLen): void {
    if (g.loai === 'vao') {
      if (g.phienBan !== PHIEN_BAN_GIAO_THUC) {
        this.gui(o, { loai: 'loi', ma: 'phienBanLech', loi: 'Tải lại trang để cập nhật bản mới' })
        return
      }
      if (this.khach.size >= CAU_HINH.SO_NGUOI_TOI_DA) {
        this.gui(o, { loai: 'loi', ma: 'phongDay', loi: 'Phòng đủ 12 người rồi' }); return
      }
      this.khach.set(o, {
        o, maMay: String(g.maMay).slice(0, 32), bietDanh: loBietDanh(g.bietDanh),
        hoaChat: null, id: -1, sttCuoi: -1,
      })
      if (this.hetChoLuc === 0) this.hetChoLuc = Date.now() + GIAY_CHO * 1000
      this.batDongHo()
      this.banPhongCho()
      return
    }

    const k = this.khach.get(o)
    if (!k) { this.gui(o, { loai: 'loi', ma: 'chuaVao', loi: 'chưa vào phòng' }); return }

    if (g.loai === 'chonMuc') {
      if (this.laChuPhong(k) && !this.van) { this.doKho = g.doKho; this.banPhongCho() }
      return
    }

    if (g.loai === 'chonChat') {
      if (!HOA_CHAT.some((h) => h.ct === g.hoaChat)) return
      if (!this.van) {
        // phòng chờ: cấm trùng
        for (const x of this.khach.values()) {
          if (x !== k && x.hoaChat === g.hoaChat) {
            this.gui(o, { loai: 'loi', ma: 'chatDaCoNguoi', loi: 'Chất này có người lấy rồi' }); return
          }
        }
        k.hoaChat = g.hoaChat
        this.banPhongCho()
      } else {
        // trong ván: đổi chéo, và CHỈ khi máy chủ đang mời người này chọn lại
        const n = this.van.nguoi.find((x) => x.id === k.id)
        if (n && n.chonLaiDen > this.van.giay) this.van.doiChat(n, g.hoaChat)
      }
      return
    }

    if (g.loai === 'phim') {
      if (!this.van || k.id < 0) return
      // bỏ gói đến muộn: chỉ nhận gói mới hơn gói cuối
      if (typeof g.stt !== 'number' || g.stt <= k.sttCuoi) return
      k.sttCuoi = g.stt
      const n = this.van.nguoi.find((x) => x.id === k.id)
      if (!n || !n.song) return
      n.phim.trai = !!g.trai
      n.phim.phai = !!g.phai
      if (g.nhay) n.phim.nhayLuc = this.van.giay
      // KHÔNG đọc bất kỳ trường vị trí nào từ gói, kể cả nếu máy khách có gửi.
    }
  }

  private laChuPhong(k: Khach): boolean {
    const dau = this.khach.values().next().value as Khach | undefined
    return dau !== undefined && dau.maMay === k.maMay
  }

  private banPhongCho(): void {
    const g: GoiPhongCho = {
      loai: 'phongCho',
      maPhong: this.maPhong,
      giayConLai: Math.max(0, Math.ceil((this.hetChoLuc - Date.now()) / 1000)),
      doKho: this.doKho,
      nguoi: [...this.khach.values()].map((k, i) => ({
        maMay: k.maMay, bietDanh: k.bietDanh, hoaChat: k.hoaChat, laChuPhong: i === 0,
      })),
      chatDaLay: [...this.khach.values()].map((k) => k.hoaChat).filter((c): c is string => c !== null),
    }
    this.phat(g)
  }

  private batDongHo(): void {
    if (this.dongHo !== null) return
    this.dongHo = setInterval(() => this.nhip(), NHIP_MS) as unknown as number
  }

  private dungDongHo(): void {
    if (this.dongHo !== null) { clearInterval(this.dongHo as unknown as number); this.dongHo = null }
    this.van = null
    this.hetChoLuc = 0
    for (const k of this.khach.values()) { k.id = -1; k.hoaChat = null; k.sttCuoi = -1 }
  }

  private nhip(): void {
    if (!this.van) {
      if (this.hetChoLuc > 0 && Date.now() >= this.hetChoLuc) this.moVan()
      else if (Date.now() % 1000 < NHIP_MS) this.banPhongCho()
      return
    }
    this.van.buoc(NHIP_MS / 1000)
    this.banAnh()
    if (this.van.pha === 'xong') this.ketVan()
  }

  private moVan(): void {
    const hat = (Math.floor(Date.now() / 1000) ^ 0x51a1) & 0xffff
    const ds = [...this.khach.values()]
    // Người thật nhận id 0..n-1; chỗ còn lại là bot.
    const van = new VanChoi(hat, ds[0]?.hoaChat ?? null, false, 0, this.doKho)
    ds.forEach((k, i) => {
      k.id = i
      const n = van.nguoi[i]
      if (!n) return
      n.laBot = false
      if (k.hoaChat) van.doiChat(n, k.hoaChat)
      k.hoaChat = n.hoaChat
    })
    van.idNguoiThat = -1   // máy chủ không thiên vị ai: không ai là "người thật" ở đây
    this.van = van
    for (const k of this.khach.values()) {
      this.gui(k.o, {
        loai: 'vaoVan',
        hat, doKho: this.doKho, idCuaBan: k.id,
        nguoi: van.nguoi.map((n) => {
          const chu = ds.find((x) => x.id === n.id)
          return {
            id: n.id,
            bietDanh: chu?.bietDanh ?? 'Máy ' + (n.id + 1),
            laBot: chu === undefined,
            hoaChat: n.hoaChat,
            kieuDau: MUOI_HAI_NGUOI[n.id % MUOI_HAI_NGUOI.length]!.dau,
            mauAo: MUOI_HAI_NGUOI[n.id % MUOI_HAI_NGUOI.length]!.mau.chinh,
          }
        }),
      })
    }
  }

  private banAnh(): void {
    const v = this.van!
    const g: GoiAnh = {
      loai: 'anh',
      giay: tron(v.giay),
      nguoi: v.nguoi.map((n) => ({
        id: n.id, x: tron(n.x), y: tron(n.y), vy: tron(n.vy),
        huong: n.huong, tuThe: n.tuThe, mang: n.mang, hoaChat: n.hoaChat,
        song: n.song, batTu: tron(n.batTuDen), khongLo: tron(n.khongLoDen),
      })),
      quaiSong: v.quai.map((q, i) => (q.song ? i : -1)).filter((i) => i >= 0),
      hoaCon: v.hoa.map((h, i) => (h.conDo ? i : -1)).filter((i) => i >= 0),
      rong: v.pha === 'trum'
        ? { x: tron(v.rong.x), mau: v.rong.mau, pha: v.rong.pha, hoaChat: v.rong.hoaChat, cotConLai: v.rong.cotConLai }
        : null,
      pha: v.pha,
      canhMoDau: v.canhMoDau === null ? null : tron(v.canhMoDau),
      conSong: v.conSong().length,
    }
    this.phat(g)
  }

  private ketVan(): void {
    const v = this.van!
    const ds = [...this.khach.values()]
    this.phat({
      loai: 'ketVan',
      thang: v.ket.thang,
      duong: v.ket.duong,
      bang: v.nguoi.map((n) => ({
        id: n.id,
        bietDanh: ds.find((x) => x.id === n.id)?.bietDanh ?? 'Máy ' + (n.id + 1),
        mang: n.mang,
        hoaChatCuoi: n.hoaChat,
      })),
    })
    this.van = null
    this.hetChoLuc = Date.now() + GIAY_CHO * 1000
    for (const k of this.khach.values()) { k.id = -1; k.sttCuoi = -1 }
  }
}
