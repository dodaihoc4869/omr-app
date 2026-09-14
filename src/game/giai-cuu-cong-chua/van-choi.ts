/**
 * MÔ PHỎNG MỘT VÁN — KHÔNG CÓ MỘT LỆNH VẼ NÀO.
 *
 * Tách hẳn vẽ ra `ve-van.ts` để mọi tiêu chí nghiệm thu chạy được bằng lệnh,
 * không cần trình duyệt: 2 000 ván đánh trùm, 500 ván kiểm bot, đều chạy ở đây.
 * Đặc tả mục 9 đòi "tự chứng minh" — cách duy nhất làm được là để logic chạy
 * không cần màn hình.
 */
import { CAU_HINH } from './cau-hinh'
import { HOA_CHAT } from './hoa-chat'
import { xuLyHoaChat, biKhacChe } from './bang-khac-che'
import { sinhDao, sanDuoi, boSinh, type Dao } from './man-choi'
import { xuLyDam, type ThanhPhan } from './xu-ly-dam'
import { taoRong, buocRong, dinhDauRong, rongMatMau, type Rong } from './rong'
import { taoNao, nghiBot, type NaoBot } from './bot'
import { MUOI_HAI_NGUOI } from './bo-nguoi'
import { KhoHieuUng } from './hieu-ung'
import { LOI_CANH_MO_DAU, type NguoiChoi, type PhaVan, type BangTin } from './types'
import { layDoKho, type DoKho, type MaDoKho } from './do-kho'
import {
  sinhQuai, sinhHoa, buocQuai, chongNhau, damTrungQuai,
  CAO_QUAI, RONG_QUAI, BAN_KINH_HOA, type Quai, type Hoa,
} from './quai-va-hoa'

export interface KetVan {
  thang: number | null
  duong: 'rong' | 'sotCuoi' | null
  botChamCongChua: boolean
}

export class VanChoi {
  dao: Dao
  nguoi: NguoiChoi[] = []
  nao = new Map<number, NaoBot>()
  rong: Rong
  giay = 0
  pha: PhaVan = 'chay'
  ket: KetVan = { thang: null, duong: null, botChamCongChua: false }
  bang: BangTin | null = null
  /** Cảnh mở đầu trận rồng: giây bắt đầu, null khi không chiếu. */
  canhMoDau: number | null = null
  readonly loiCanhMoDau = LOI_CANH_MO_DAU
  hieuUng: KhoHieuUng | null
  /** id của người thật. -1 nghĩa là ván toàn bot (dùng cho phép kiểm). */
  idNguoiThat: number
  private rChat: () => number
  /** x của công chúa — bot KHÔNG BAO GIỜ được tới đây. */
  xCongChua: number
  doKho: DoKho
  quai: Quai[]
  hoa: Hoa[]

  constructor(
    hat: number, chatNguoiThat: string | null, veDuoc = false, idNguoiThat = 0,
    maDoKho: MaDoKho = 'do',
  ) {
    this.doKho = layDoKho(maDoKho)
    this.dao = sinhDao(hat)
    this.rChat = boSinh(hat ^ 0x5eed)
    this.idNguoiThat = idNguoiThat
    this.hieuUng = veDuoc ? new KhoHieuUng() : null
    this.xCongChua = this.dao.xHang + 420

    // ——— chia hoá chất: 12 người 12 chất, CẤM TRÙNG
    const conLai = HOA_CHAT.map((h) => h.ct)
    if (chatNguoiThat !== null) {
      const i = conLai.indexOf(chatNguoiThat)
      if (i >= 0) conLai.splice(i, 1)
    }
    // xáo bằng bộ sinh có hạt giống, không dùng Math.random
    for (let i = conLai.length - 1; i > 0; i--) {
      const j = Math.floor(this.rChat() * (i + 1))
      const t = conLai[i]!; conLai[i] = conLai[j]!; conLai[j] = t
    }

    for (let id = 0; id < CAU_HINH.SO_NGUOI_TOI_DA; id++) {
      const laBot = id !== idNguoiThat
      const ct = laBot ? conLai.pop()! : (chatNguoiThat ?? conLai.pop()!)
      this.nguoi.push({
        id, laBot,
        hocTro: MUOI_HAI_NGUOI[id % MUOI_HAI_NGUOI.length]!,
        hoaChat: ct,
        mang: CAU_HINH.SO_MANG,
        x: this.dao.choTha[id] ?? 120, y: 0, vx: 0, vy: 0,
        chamDat: true, roiDatLuc: -999, nhayConLai: CAU_HINH.SO_LAN_NHAY,
        batTuDen: 0.8, song: true, huong: 1, tuThe: 'dung',
        phim: { trai: false, phai: false, nhayLuc: -999 },
        chonLaiDen: 0, soLanDoiChat: 0, soLanDuocChon: 0, khongLoDen: 0,
      })
      if (laBot) this.nao.set(id, taoNao(boSinh(hat + id * 7919), this.doKho.botDoChinhXac))
    }
    this.quai = sinhQuai(this.dao, this.doKho, boSinh(hat ^ 0x9a11))
    this.hoa = sinhHoa(this.dao, this.doKho, boSinh(hat ^ 0xb10a))
    this.rong = taoRong(
      this.dao.xHang,
      () => Math.floor(this.rChat() * HOA_CHAT.length),
      this.doKho.giayHoRong,
    )
    this.rong.mau = this.doKho.mauRong
  }

  /** Ăn hoa thì khổng lồ 10 giây: chạm ai người đó mất mạng, chạm quái quái chết. */
  khongLo(n: NguoiChoi): boolean { return n.khongLoDen > this.giay }

  get nguoiThat(): NguoiChoi | undefined {
    return this.nguoi.find((n) => n.id === this.idNguoiThat)
  }

  conSong(): NguoiChoi[] { return this.nguoi.filter((n) => n.song) }

  private thanhPhan(n: NguoiChoi): ThanhPhan {
    return {
      x: n.x, y: n.y, vy: n.vy,
      rong: CAU_HINH.RONG_NHAN_VAT, cao: CAU_HINH.CAO_NHAN_VAT,
      batTuDen: n.batTuDen, song: n.song, hoaChat: n.hoaChat,
    }
  }

  /** Mất một mạng: bất tử một lúc, và ĐƯỢC CHỌN LẠI hoá chất. */
  matMang(n: NguoiChoi): void {
    if (n.batTuDen > this.giay || !n.song) return
    n.mang -= 1
    n.batTuDen = this.giay + CAU_HINH.GIAY_BAT_TU_SAU_MAT_MANG
    this.hieuUng?.chuNoi(n.x, n.y + CAU_HINH.CAO_NHAN_VAT + 30, '−1', '#FF3B30')
    if (n.mang <= 0) { n.song = false; return }
    if (CAU_HINH.DOI_CHAT_KHI_MAT_MANG) {
      n.soLanDuocChon += 1
      n.chonLaiDen = this.giay + CAU_HINH.GIAY_CHON_LAI_CHAT
      if (n.laBot) this.botChonLaiChat(n)
    }
  }

  /**
   * Chất chọn lại được: TẤT CẢ, trừ chất mình đang cầm.
   *
   * Không lọc theo "chất còn trống" nữa. Khi cả 12 người còn sống thì không
   * chất nào trống — màn chọn lại sẽ RỖNG đúng vào lúc em cầm chất yếu và cần
   * đổi nhất. Hai luật "12 người 12 chất" và "mất mạng được đổi chất" mâu
   * thuẫn nhau; chữa bằng ĐỔI CHÉO ở doiChat().
   */
  chatChonDuoc(n: NguoiChoi): string[] {
    return HOA_CHAT.map((h) => h.ct).filter((ct) => ct !== n.hoaChat)
  }

  /**
   * ĐỔI CHÉO. Lấy chất của ai thì người đó nhận lại chất của mình.
   *
   * Bộ chất luôn là một HOÁN VỊ — không bao giờ có hai người cùng chất, mà
   * lúc nào cũng có 11 lựa chọn thật. Và nó thêm một nước cờ: giật NaOH của
   * đối thủ cũng là dúi AgNO₃ vào tay họ.
   */
  doiChat(n: NguoiChoi, ct: string): boolean {
    if (ct === n.hoaChat) { n.chonLaiDen = 0; return false }
    if (!HOA_CHAT.some((h) => h.ct === ct)) return false
    const cu = n.hoaChat
    // tìm cả người đã ra khỏi ván: bộ 12 chất phải luôn là một hoán vị,
    // bỏ sót người chết là sinh ra hai người cùng chất.
    const kia = this.nguoi.find((k) => k !== n && k.hoaChat === ct)
    n.hoaChat = ct
    n.soLanDoiChat += 1
    if (kia) { kia.hoaChat = cu; kia.soLanDoiChat += 1 }
    n.chonLaiDen = 0
    return true
  }

  /** Bot chọn chất khắc chế được nhiều người đang sống nhất. */
  private botChonLaiChat(n: NguoiChoi): void {
    const doiThu = this.conSong().filter((k) => k !== n).map((k) => k.hoaChat)
    let tot = n.hoaChat, diemTot = -99
    for (const ct of this.chatChonDuoc(n)) {
      let d = 0
      for (const ho of doiThu) {
        const kq = xuLyHoaChat(ct, ho)
        if (kq.loai === 'khacChe') d += kq.thang === ct ? 1 : -1
      }
      if (d > diemTot) { diemTot = d; tot = ct }
    }
    this.doiChat(n, tot)
  }

  private vatLy(n: NguoiChoi, dt: number): void {
    const dangChon = n.chonLaiDen > this.giay
    const traiPhai = dangChon ? 0 : (n.phim.phai ? 1 : 0) - (n.phim.trai ? 1 : 0)
    n.vx = traiPhai * CAU_HINH.TOC_DO_CHAY
    if (traiPhai !== 0) n.huong = traiPhai > 0 ? 1 : -1

    // nhảy: cho bấm SỚM và cho nhảy MUỘN sau khi rời mép
    const vuaRoiMep = !n.chamDat && this.giay - n.roiDatLuc <= CAU_HINH.GIAY_NHAY_MUON
    const bamSom = this.giay - n.phim.nhayLuc <= CAU_HINH.GIAY_NHAY_SOM
    if (!dangChon && bamSom && (n.chamDat || vuaRoiMep || n.nhayConLai > 0)) {
      if (n.chamDat || vuaRoiMep) n.nhayConLai = CAU_HINH.SO_LAN_NHAY
      n.vy = CAU_HINH.TOC_DO_NHAY
      n.nhayConLai -= 1
      n.chamDat = false
      n.phim.nhayLuc = -999
      this.hieuUng?.buiChan(n.x, n.y)
    }

    n.vy -= CAU_HINH.TRONG_LUC * dt
    n.x += n.vx * dt
    const yTruoc = n.y
    n.y += n.vy * dt
    if (n.x < 0) n.x = 0
    if (n.x > this.dao.dai + 700) n.x = this.dao.dai + 700

    // đáp xuống sàn — chỉ khi ĐANG RƠI và vừa cắt qua mặt sàn
    const dangChamTruoc = n.chamDat
    n.chamDat = false
    if (n.vy <= 0) {
      const san = sanDuoi(this.dao, n.x, yTruoc)
      if (san !== null && yTruoc >= san - 1 && n.y <= san) {
        n.y = san; n.vy = 0; n.chamDat = true
        n.nhayConLai = CAU_HINH.SO_LAN_NHAY
      }
    }
    if (dangChamTruoc && !n.chamDat) n.roiDatLuc = this.giay

    // rơi xuống vực
    if (n.y < -420) { this.matMang(n); this.hoiSinh(n) }

    n.tuThe = !n.chamDat
      ? (n.vy < -CAU_HINH.TOC_DO_ROI_TOI_THIEU ? 'dam' : 'nhay')
      : (Math.abs(n.vx) > 1 ? 'chay' : 'dung')
  }

  private hoiSinh(n: NguoiChoi): void {
    if (!n.song) return
    let x = n.x - 200
    if (x < 60) x = 60
    while (x > 60 && sanDuoi(this.dao, x, 0) === null) x -= 40
    n.x = x; n.y = 320; n.vx = 0; n.vy = 0
  }

  private vaChamNguoi(): void {
    const ds = this.conSong()
    for (const a of ds) {
      for (const b of ds) {
        if (a === b) continue
        const kq = xuLyDam(this.thanhPhan(a), this.thanhPhan(b), this.giay)
        if (kq.cham !== 'dam' || kq.hoa === null) continue
        a.vy = CAU_HINH.NAY_SAU_DAM
        a.y = b.y + CAU_HINH.CAO_NHAN_VAT + 2
        for (const ai of kq.matMang) this.matMang(ai === 'nguoiDam' ? a : b)
        const mau = kq.hoa.loai === 'khacChe'
          ? (kq.hoa.thang === a.hoaChat ? '#1EA05A' : '#FF5A4E')
          : kq.hoa.loai === 'trungHoa' ? '#FF8A3D' : '#8894B4'
        const nhan = kq.hoa.loai === 'khacChe'
          ? (kq.hoa.thang === a.hoaChat ? 'KHẮC CHẾ' : 'BỊ KHẮC CHẾ')
          : kq.hoa.loai === 'trungHoa' ? 'TRUNG HOÀ' : 'KHÔNG PHẢN ỨNG'
        if (a.id === this.idNguoiThat || b.id === this.idNguoiThat) {
          this.bang = {
            pt: kq.hoa.pt, tieuChi: kq.hoa.tieuChi, nhan, mau,
            den: this.giay + CAU_HINH.GIAY_HIEN_PHUONG_TRINH,
          }
        }
        this.hieuUng?.no(b.x, b.y + CAU_HINH.CAO_NHAN_VAT, mau, '#FFF0A8')
      }
    }
  }

  /**
   * Quái đi tuần, người ăn hoa, và ba kiểu va chạm:
   *  · khổng lồ CHẠM quái  ⇒ quái chết
   *  · dẫm trúng đỉnh đầu quái ⇒ quái chết  (đúng động tác đã học suốt ván)
   *  · chạm quái kiểu khác  ⇒ MÌNH mất một mạng
   * Khổng lồ chạm NGƯỜI khác thì người đó mất mạng, không tra bảng hoá chất —
   * đó chính là thứ bông hoa mua được.
   */
  private vaChamQuaiVaHoa(): void {
    const dtKhung = 1 / CAU_HINH.FPS_MUC_TIEU
    for (const q of this.quai) buocQuai(q, this.dao, dtKhung)

    for (const n of this.conSong()) {
      const to = this.khongLo(n) ? 1.8 : 1
      const rongN = CAU_HINH.RONG_NHAN_VAT * to
      const caoN = CAU_HINH.CAO_NHAN_VAT * to

      // ——— ăn hoa
      for (const h of this.hoa) {
        if (!h.conDo) continue
        if (chongNhau(n.x, n.y, rongN, caoN, h.x, h.y - BAN_KINH_HOA, BAN_KINH_HOA * 2, BAN_KINH_HOA * 2)) {
          h.conDo = false
          n.khongLoDen = this.giay + CAU_HINH.GIAY_KHONG_LO
          this.hieuUng?.no(h.x, h.y, '#FF5A9E', '#FFC13D', 22)
          if (n.id === this.idNguoiThat) {
            this.bang = {
              pt: 'KHỔNG LỒ ' + CAU_HINH.GIAY_KHONG_LO + ' giây',
              tieuChi: 'chạm ai người đó mất mạng — không cần dẫm',
              nhan: 'ĂN HOA', mau: '#FF5A9E',
              den: this.giay + CAU_HINH.GIAY_HIEN_PHUONG_TRINH,
            }
          }
        }
      }

      // ——— quái
      for (const q of this.quai) {
        if (!q.song) continue
        if (!chongNhau(n.x, n.y, rongN, caoN, q.x, q.y, RONG_QUAI, CAO_QUAI)) continue
        if (this.khongLo(n)) {
          q.song = false
          this.hieuUng?.no(q.x, q.y + CAO_QUAI / 2, '#8A5AC8', '#FFF0A8', 16)
          continue
        }
        if (damTrungQuai(n.x, n.y, n.vy, CAU_HINH.RONG_NHAN_VAT, q)) {
          q.song = false
          n.vy = CAU_HINH.NAY_SAU_DAM
          this.hieuUng?.no(q.x, q.y + CAO_QUAI / 2, '#8A5AC8', '#FFF0A8', 16)
          continue
        }
        this.matMang(n)
      }

      // ——— khổng lồ chạm người khác
      if (this.khongLo(n)) {
        for (const k of this.conSong()) {
          if (k === n || this.khongLo(k)) continue
          if (chongNhau(n.x, n.y, rongN, caoN, k.x, k.y, CAU_HINH.RONG_NHAN_VAT, CAU_HINH.CAO_NHAN_VAT)) {
            this.matMang(k)
            if (k.id === this.idNguoiThat || n.id === this.idNguoiThat) {
              this.bang = {
                pt: '', tieuChi: 'khổng lồ chạm là mất mạng, không tra hoá chất',
                nhan: n.id === this.idNguoiThat ? 'KHỔNG LỒ HẤT VĂNG' : 'BỊ KHỔNG LỒ HẤT',
                mau: '#FF5A9E', den: this.giay + CAU_HINH.GIAY_HIEN_PHUONG_TRINH,
              }
            }
          }
        }
      }
    }
  }

  private buocTrum(dt: number): void {
    const truoc = this.rong.pha
    buocRong(this.rong, dt)
    if (truoc !== 'phun' && this.rong.pha === 'phun') this.rong.huongPhun = -1

    for (const n of this.conSong()) {
      // lửa: đứng trong tầm mà không nấp sau cột thì mất một mạng
      if (this.rong.pha === 'phun' && this.rong.cotConLai > 0) {
        const trongTam = n.x > this.rong.x - 560 && n.x < this.rong.x - 60 && n.chamDat
        const dangNap = n.x > this.rong.x - 330 && n.x < this.rong.x - 250
        if (trongTam && !dangNap) this.matMang(n)
      }
      // dẫm đầu rồng — chỉ ăn trong giai đoạn 'ho'
      const dinh = dinhDauRong(this.rong)
      const gan = Math.abs(n.x - dinh.x) < 90 && Math.abs(n.y - dinh.y) < 60
      if (this.rong.pha === 'ho' && gan && n.vy < -CAU_HINH.TOC_DO_ROI_TOI_THIEU) {
        n.vy = CAU_HINH.NAY_SAU_DAM
        // RỒNG CŨNG CẦM HOÁ CHẤT: dẫm bằng chất bị rồng khắc chế thì mình mất mạng
        if (biKhacChe(n.hoaChat, this.rong.hoaChat)) {
          this.matMang(n)
          if (n.id === this.idNguoiThat) {
            const kq = xuLyHoaChat(n.hoaChat, this.rong.hoaChat)
            this.bang = {
              pt: kq.pt, tieuChi: kq.tieuChi, nhan: 'BỊ KHẮC CHẾ', mau: '#FF5A4E',
              den: this.giay + CAU_HINH.GIAY_HIEN_PHUONG_TRINH,
            }
          }
        } else {
          rongMatMau(this.rong, () => Math.floor(this.rChat() * HOA_CHAT.length))
          this.hieuUng?.no(dinh.x, dinh.y, '#FFC13D', '#FF5A4E', 26)
        }
      }
    }

    if (this.rong.pha === 'nga') {
      for (const n of this.conSong()) {
        if (n.laBot) continue           // BOT KHÔNG BAO GIỜ CHẠM CÔNG CHÚA
        if (Math.abs(n.x - this.xCongChua) < 60) {
          this.pha = 'xong'
          this.ket = { thang: n.id, duong: 'rong', botChamCongChua: false }
        }
      }
      // cờ này để phép kiểm bắt được nếu luật trên bị phá
      for (const n of this.conSong()) {
        if (n.laBot && Math.abs(n.x - this.xCongChua) < 60) this.ket.botChamCongChua = true
      }
    }
  }

  buoc(dt: number): void {
    if (this.pha === 'xong') return
    this.giay += dt

    if (this.pha === 'canhMoDau') {
      if (this.canhMoDau !== null && this.giay - this.canhMoDau >= CAU_HINH.GIAY_CANH_MO_DAU) {
        this.pha = 'chay'
      } else {
        for (const n of this.conSong()) {
          n.phim.trai = false; n.phim.phai = false; n.phim.nhayLuc = -999
          n.batTuDen = Math.max(n.batTuDen, this.giay + 0.5)
          n.vx = 0
        }
        this.hieuUng?.buoc(dt)
        return
      }
    }

    for (const n of this.conSong()) {
      if (n.laBot) {
        const nao = this.nao.get(n.id)
        if (nao) nghiBot(n, nao, this.dao, this.nguoi, this.giay, this.dao.xHang)
      }
      this.vatLy(n, dt)
    }
    this.vaChamNguoi()
    this.vaChamQuaiVaHoa()

    const song = this.conSong()

    // ——— CỬA HANG CHỈ MỞ CHO NGƯỜI SỐNG SÓT CUỐI CÙNG
    //
    // Thầy chốt 14-09. Bản trước mở hang ngay khi CÓ NGƯỜI chạm cửa, nên hai
    // ba người cùng đánh rồng — và ai tới trước thì thắng bằng chân chạy, không
    // phải bằng chuyện sống sót. Nay: còn hơn một người thì cửa đóng, ai chạm
    // cửa cũng bị đẩy lại. Muốn gặp rồng thì phải là người cuối cùng.
    const chiMotNguoi = song.length <= 1

    // ——— CẢNH MỞ ĐẦU: vừa còn một người thì màn tối lại, chữ hiện dần.
    // Chiếu TRƯỚC khi mở hang, và máy chủ giữ mốc thời gian để 12 máy thấy
    // cùng lúc — máy khách tự đếm giờ là mỗi máy một kiểu.
    if (CAU_HINH.CHI_NGUOI_CUOI_CUNG_GAP_RONG && this.pha === 'chay'
        && chiMotNguoi && this.canhMoDau === null && song.length === 1) {
      this.canhMoDau = this.giay
      this.pha = 'canhMoDau'
    }
    if (this.pha === 'canhMoDau') {
      if (this.canhMoDau !== null && this.giay - this.canhMoDau >= CAU_HINH.GIAY_CANH_MO_DAU) {
        this.pha = 'chay'
      } else {
        // đứng yên, bất tử, không quái không lửa: đây là phút lấy hơi
        for (const n of song) {
          n.phim.trai = false; n.phim.phai = false; n.phim.nhayLuc = -999
          n.batTuDen = Math.max(n.batTuDen, this.giay + 0.5)
        }
        this.hieuUng?.buoc(dt)
        return
      }
    }

    const moDuocHang = CAU_HINH.CHI_NGUOI_CUOI_CUNG_GAP_RONG ? chiMotNguoi : true
    if (!moDuocHang) {
      for (const n of song) {
        if (n.x > this.dao.xHang - 40) {
          n.x = this.dao.xHang - 40
          if (n.vx > 0) n.vx = 0
          if (n.id === this.idNguoiThat && this.bang === null) {
            this.bang = {
              pt: '', tieuChi: 'phải là người sống sót cuối cùng',
              nhan: 'CỬA HANG CÒN ĐÓNG · còn ' + song.length + ' người',
              mau: '#8894B4', den: this.giay + CAU_HINH.GIAY_HIEN_PHUONG_TRINH,
            }
          }
        }
      }
    }
    const nguoiVaoHang = moDuocHang && song.some((n) => n.x > this.dao.xHang - 40)
    if (this.pha === 'chay' && nguoiVaoHang) this.pha = 'trum'
    if (this.pha === 'trum') this.buocTrum(dt)
    if (song.length === 0) { this.pha = 'xong'; this.ket = { thang: null, duong: null, botChamCongChua: this.ket.botChamCongChua } }

    if (this.bang && this.bang.den < this.giay) this.bang = null
    this.hieuUng?.buoc(dt)
  }

  /** Chạy nhanh không vẽ — dùng cho phép kiểm. */
  chayHet(giayToiDa = 240, dt = 1 / 60): void {
    let t = 0
    while (t < giayToiDa && this.pha !== 'xong') { this.buoc(dt); t += dt }
  }
}
