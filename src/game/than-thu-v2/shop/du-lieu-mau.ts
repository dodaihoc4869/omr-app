// CỬA HÀNG PHỤ KIỆN — MÁY CHỦ GIẢ cho trang xem thử + test (chưa nối máy chủ thật, B1). Giả ĐÚNG hợp đồng docs/hop-dong-shop-phu-kien-2109.md:
//   · danh mục 40 món lấy từ src/lib/phu-kien-danh-muc.ts (tên, giá, Bật mí, điều kiện — KHÔNG gõ lại ở đây); chỉ bán món `moBan <= dotMoBan`;
//   · `vang-xem` cờ tắt ⇒ {ok:true,bat:false}; `vang-doi`, `shop-danh-sach`, `shop-mua` ⇒ lỗi `tam_dong`; `thu-mac-do` vẫn chạy;
//   · `shop-danh-sach` trả thêm `dangMac` + `emCo`, `thieu` chữ ngắn ("Cần chuỗi 14 ngày"), `suatCon`/`suatTong` null khi không giới hạn;
//   · `shop-mua` kiểm theo thứ tự tam_dong → khong_co_mon → sap_mo → da_co → het_suat → chua_mo → gia_doi → thieu_vang, khoá lặp ⇒ lapLai:true TRƯỚC mọi kiểm khác, mua xong TỰ MẶC;
//   · `vang-doi`: soExp nguyên 1..doiToiDa, luôn giữ lại 200 EXP (duoi_nguong), khoá lặp ⇒ daDoi của lần gốc + số HIỆN TẠI, lapLai:true;
//   · số dư luôn do máy chủ giả trả (có công tắc `vangSauGhi` để thử "số lạ": màn phải hiện đúng số ấy, không tự trừ).
// Chữ lời máy chủ mẫu nằm ở chu-shop.ts (`loiMayChu`); tệp này không có chữ tiếng Việt.
import { DANH_MUC_PHU_KIEN, DOT_MO_BAN } from '../../../lib/phu-kien-danh-muc'
import type { MonPhuKien } from '../../../lib/phu-kien-danh-muc'
import { CAC_O, LoiShopApi, MA_MAT_MANG, MA_TAM_DONG } from './kieu'
import type { DangMac, DapDanhSach, DapDoi, DapMacDo, DapMua, MonMayChu, OGan, ShopApi, ViSo } from './kieu'
import { chuCanChuoiNgan, chuLoiTheoMa, loiMayChu } from './chu-shop'

/** Lỗi giả một lần (tự tắt sau khi bắn) — để thử "Thử lại". */
export type MaLoiEp = 'thieu_vang' | 'chua_mo' | 'het_suat' | 'gia_doi' | 'tam_dong' | 'da_co' | 'duoi_nguong' | 'khong_co_mon' | 'sap_mo' | 'sai_dau_vao'

export interface CongTacGia {
  /** Mọi lệnh ném `mat_mang` (công tắc bật/tắt, không tự tắt). */
  matMang: boolean
  /** `false` = cờ cửa hàng TẮT (công tắc bật/tắt). */
  batShop: boolean
  /** Lệnh GHI kế tiếp (`vang-doi`/`shop-mua`) trả lỗi này, rồi tự tắt. */
  epLoi: MaLoiEp | null
  /** Số lần TẢI (`vang-xem`, `shop-danh-sach`) kế tiếp sẽ trả lỗi máy chủ chung. */
  loiTai: number
  /** Số dư mới của lần GHI kế tiếp (đổi/mua) — số "lạ", để thử màn không tự tính. Tự tắt sau khi dùng. */
  vangSauGhi: number | null
}

export interface TuyChonGia {
  /** Độ chậm mỗi lệnh (ms, 0–1500). */
  tre?: number
  vang?: number
  ongNghiem?: number
  chuoiNgay?: number
  anThachSang?: number
  soHuu?: readonly string[]
  dangMac?: DangMac
  /** Số cái đã bán của món có giới hạn (mã → số). */
  daBan?: Readonly<Record<string, number>>
  danhMuc?: readonly MonPhuKien[]
  dotMoBan?: number
  congTac?: Partial<CongTacGia>
}

/** Số liệu mẫu của hợp đồng: 340 vàng, ống nghiệm 620, chuỗi 9 ngày, 3 ấn thạch; có sẵn 2 món (một đang mặc); mỗi loại trạng thái của món đều có mặt. */
export const SO_LIEU_MAU = {
  vang: 340,
  ongNghiem: 620,
  chuoiNgay: 9,
  anThachSang: 3,
  soHuu: ['VD-01', 'KT-03'] as readonly string[],
  dangMac: { khung: 'KT-03' } as DangMac,
  /** KT-08 còn 12/30 (còn ít) · VD-08 hết 25/25 · HQ-08 chưa ai mua (20/20). */
  daBan: { 'KT-08': 18, 'VD-08': 25 } as Readonly<Record<string, number>>,
}

/** Các kịch bản để bấm thử ở trang xem thử (không phụ thuộc chữ). */
export const KICH_BAN_MAU: Readonly<Record<string, TuyChonGia>> = {
  'mac-dinh': {},
  'du-vang': { vang: 5000 },
  'thieu-vang': { vang: 40 },
  'het-exp-thua': { ongNghiem: 180 },
  'tu-trong': { soHuu: [], dangMac: {} },
  'co-tat': { congTac: { batShop: false } },
  'mat-mang': { congTac: { matMang: true } },
  'loi-tai': { congTac: { loiTai: 1 } },
}

const KHOA_HOP_LE = /^[A-Za-z0-9_-]{8,64}$/
const cho = (ms: number) => new Promise<void>((xong) => setTimeout(xong, ms))
const trong = (): DangMac => Object.fromEntries(CAC_O.map((o) => [o, null])) as DangMac

export class ShopApiGia implements ShopApi {
  tre: number
  congTac: CongTacGia
  vang: number
  ongNghiem: number
  chuoiNgay: number
  anThachSang: number
  readonly giuLai = 200
  readonly soHuu: Set<string>
  dangMac: DangMac
  readonly daBan: Map<string, number>
  /** Tên lệnh theo thứ tự được gọi (kể cả lệnh lỗi). */
  readonly nhatKy: string[] = []
  /** Số lần GHI THẬT (khoá lặp không tính). */
  readonly ghi = { doi: 0, mua: 0, mac: 0 }
  private readonly nho = new Map<string, DapDoi | DapMua>()
  private readonly giaLech = new Map<string, number>()
  private readonly danhMuc: readonly MonPhuKien[]
  private readonly dotMoBan: number

  constructor(t: TuyChonGia = {}) {
    this.tre = Math.min(1500, Math.max(0, t.tre ?? 0))
    this.vang = t.vang ?? SO_LIEU_MAU.vang
    this.ongNghiem = t.ongNghiem ?? SO_LIEU_MAU.ongNghiem
    this.chuoiNgay = t.chuoiNgay ?? SO_LIEU_MAU.chuoiNgay
    this.anThachSang = t.anThachSang ?? SO_LIEU_MAU.anThachSang
    this.soHuu = new Set(t.soHuu ?? SO_LIEU_MAU.soHuu)
    this.dangMac = { ...trong(), ...(t.dangMac ?? SO_LIEU_MAU.dangMac) }
    this.daBan = new Map(Object.entries(t.daBan ?? SO_LIEU_MAU.daBan))
    this.danhMuc = t.danhMuc ?? DANH_MUC_PHU_KIEN
    this.dotMoBan = t.dotMoBan ?? DOT_MO_BAN
    this.congTac = { matMang: false, batShop: true, epLoi: null, loiTai: 0, vangSauGhi: null, ...t.congTac }
  }

  get doiToiDa(): number {
    return Math.max(0, this.ongNghiem - this.giuLai)
  }
  private ngayAn(): number {
    return Math.floor(this.ongNghiem / this.giuLai)
  }
  private gia(m: MonPhuKien): number {
    return m.gia + (this.giaLech.get(m.ma) ?? 0)
  }
  private suatCon(m: MonPhuKien): number | null {
    return m.suatTong == null ? null : m.suatTong - (this.daBan.get(m.ma) ?? 0)
  }
  private moKhoa(m: MonPhuKien): boolean {
    return (!m.canChuoiNgay || this.chuoiNgay >= m.canChuoiNgay) && (!m.canAnThach || this.anThachSang >= m.canAnThach)
  }

  private async vao(lenh: string): Promise<void> {
    this.nhatKy.push(lenh)
    if (this.tre > 0) await cho(this.tre)
    if (this.congTac.matMang) throw new LoiShopApi(MA_MAT_MANG, loiMayChu.matMang)
  }
  private loiTai(): void {
    if (this.congTac.loiTai > 0) {
      this.congTac.loiTai -= 1
      throw new LoiShopApi('loi_may_chu', loiMayChu.loiKhongRo)
    }
  }
  private dongCua(): void {
    if (!this.congTac.batShop) throw new LoiShopApi(MA_TAM_DONG, loiMayChu.tamDong)
  }
  /** Lỗi giả một lần cho lệnh ghi; trả `true` nếu đã ném. */
  private epLoi(m: MonPhuKien | undefined, giaThay?: number): void {
    const ma = this.congTac.epLoi
    if (!ma) return
    this.congTac.epLoi = null
    switch (ma) {
      case 'thieu_vang':
        throw new LoiShopApi(ma, loiMayChu.thieuVang(Math.max(1, (m ? this.gia(m) : giaThay ?? 1) - this.vang)))
      case 'chua_mo':
        throw new LoiShopApi(ma, loiMayChu.chuaMo(m?.canChuoiNgay ?? 1, this.chuoiNgay))
      case 'het_suat':
        throw new LoiShopApi(ma, loiMayChu.hetSuat(m?.suatTong ?? 0))
      case 'gia_doi':
        if (m) this.giaLech.set(m.ma, (this.giaLech.get(m.ma) ?? 0) + 10)
        throw new LoiShopApi(ma, loiMayChu.giaDoi)
      case 'tam_dong':
        throw new LoiShopApi(ma, loiMayChu.tamDong)
      case 'da_co':
        throw new LoiShopApi(ma, loiMayChu.daCo)
      case 'duoi_nguong':
        throw new LoiShopApi(ma, loiMayChu.duoiNguong(this.giuLai, this.doiToiDa))
      default:
        throw new LoiShopApi(ma, chuLoiTheoMa[ma] ?? loiMayChu.loiKhongRo)
    }
  }
  private soDuSauGhi(tinhTheoLuat: number): number {
    const la = this.congTac.vangSauGhi
    this.congTac.vangSauGhi = null
    return la ?? tinhTheoLuat
  }

  async vangXem(): Promise<ViSo> {
    await this.vao('vang-xem')
    this.loiTai()
    if (!this.congTac.batShop) return { ok: true, bat: false }
    return { ok: true, bat: true, vang: this.vang, ongNghiem: this.ongNghiem, giuLai: this.giuLai, doiToiDa: this.doiToiDa, ngayAn: this.ngayAn(), chuoiNgay: this.chuoiNgay, anThachSang: this.anThachSang, mua: 'm1' }
  }

  async shopDanhSach(): Promise<DapDanhSach> {
    await this.vao('shop-danh-sach')
    this.loiTai()
    this.dongCua()
    const mon: MonMayChu[] = this.danhMuc
      .filter((m) => m.moBan <= this.dotMoBan)
      .map((m) => {
        const moKhoa = this.moKhoa(m)
        return {
          ma: m.ma,
          gia: this.gia(m),
          daCo: this.soHuu.has(m.ma),
          dangMac: this.dangMac[m.o] === m.ma,
          moKhoa,
          thieu: moKhoa ? null : chuCanChuoiNgan(m.canChuoiNgay, m.canAnThach),
          suatCon: this.suatCon(m),
          suatTong: m.suatTong,
        }
      })
    return { ok: true, phienBan: 'm1-v1', vang: this.vang, mon, dangMac: { ...this.dangMac }, emCo: { chuoiNgay: this.chuoiNgay, anThachSang: this.anThachSang } }
  }

  async vangDoi(soExp: number, khoaYeuCau: string): Promise<DapDoi> {
    await this.vao('vang-doi')
    if (typeof khoaYeuCau !== 'string' || !KHOA_HOP_LE.test(khoaYeuCau)) throw new LoiShopApi('sai_dau_vao', chuLoiTheoMa.sai_dau_vao!)
    const cu = this.nho.get(`doi:${khoaYeuCau}`) as DapDoi | undefined
    if (cu) return { ...cu, vang: this.vang, ongNghiem: this.ongNghiem, ngayAn: this.ngayAn(), lapLai: true }
    this.dongCua()
    this.epLoi(undefined)
    if (!Number.isInteger(soExp) || soExp < 1) throw new LoiShopApi('sai_dau_vao', chuLoiTheoMa.sai_dau_vao!)
    if (soExp > this.doiToiDa) throw new LoiShopApi('duoi_nguong', loiMayChu.duoiNguong(this.giuLai, this.doiToiDa))
    this.ongNghiem -= soExp
    this.vang = this.soDuSauGhi(this.vang + soExp)
    this.ghi.doi += 1
    const dap: DapDoi = { ok: true, daDoi: soExp, vang: this.vang, ongNghiem: this.ongNghiem, ngayAn: this.ngayAn(), lapLai: false }
    this.nho.set(`doi:${khoaYeuCau}`, dap)
    return { ...dap }
  }

  async shopMua(maMon: string, giaThay: number, khoaYeuCau: string): Promise<DapMua> {
    await this.vao('shop-mua')
    if (typeof khoaYeuCau !== 'string' || !KHOA_HOP_LE.test(khoaYeuCau) || typeof maMon !== 'string' || !Number.isFinite(giaThay)) throw new LoiShopApi('sai_dau_vao', chuLoiTheoMa.sai_dau_vao!)
    const cu = this.nho.get(`mua:${khoaYeuCau}`) as DapMua | undefined
    if (cu) return { ...cu, vang: this.vang, lapLai: true }
    this.dongCua()
    const m = this.danhMuc.find((x) => x.ma === maMon)
    this.epLoi(m, giaThay)
    if (!m) throw new LoiShopApi('khong_co_mon', chuLoiTheoMa.khong_co_mon!)
    if (m.moBan > this.dotMoBan) throw new LoiShopApi('sap_mo', chuLoiTheoMa.sap_mo!)
    if (this.soHuu.has(m.ma)) throw new LoiShopApi('da_co', loiMayChu.daCo)
    if (m.suatTong != null && (this.suatCon(m) ?? 0) <= 0) throw new LoiShopApi('het_suat', loiMayChu.hetSuat(m.suatTong))
    if (!this.moKhoa(m)) throw new LoiShopApi('chua_mo', loiMayChu.chuaMo(m.canChuoiNgay ?? 1, this.chuoiNgay))
    if (giaThay !== this.gia(m)) throw new LoiShopApi('gia_doi', loiMayChu.giaDoi)
    if (this.vang < this.gia(m)) throw new LoiShopApi('thieu_vang', loiMayChu.thieuVang(this.gia(m) - this.vang))
    this.vang = this.soDuSauGhi(this.vang - this.gia(m))
    this.soHuu.add(m.ma)
    this.dangMac[m.o] = m.ma
    if (m.suatTong != null) this.daBan.set(m.ma, (this.daBan.get(m.ma) ?? 0) + 1)
    this.ghi.mua += 1
    const dap: DapMua = { ok: true, maMon: m.ma, vang: this.vang, daMac: true, lapLai: false }
    this.nho.set(`mua:${khoaYeuCau}`, dap)
    return { ...dap }
  }

  async thuMacDo(oGan: OGan, maMon: string | null): Promise<DapMacDo> {
    await this.vao('thu-mac-do')
    if (!CAC_O.includes(oGan) || (maMon !== null && typeof maMon !== 'string')) throw new LoiShopApi('sai_dau_vao', chuLoiTheoMa.sai_dau_vao!)
    if (maMon !== null) {
      const m = this.danhMuc.find((x) => x.ma === maMon)
      if (!m || m.o !== oGan || !this.soHuu.has(maMon)) throw new LoiShopApi('chua_co', loiMayChu.chuaCo)
    }
    this.dangMac[oGan] = maMon
    this.ghi.mac += 1
    return { ok: true, dangMac: { ...trong(), ...this.dangMac } }
  }
}
