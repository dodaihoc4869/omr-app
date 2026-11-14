// TRÒ «SINH TỒN · TRANG VỞ» (bản 2 — thầy duyệt bản vẽ 13/11: docs/ban-ve-sinh-ton-v2-1311/, đặc tả docs/dac-ta-sinh-ton-v2-1311.md) ở phòng chờ Live theo khối
// và phòng chờ ca kiểm tra (bản ÊM). Bốn đội, mỗi em một bé ma vẽ tay đeo súng tự bắn đối thủ gần nhất; KHÔNG có nút điều khiển: vuốt ở đâu cũng chạy, chạm một
// điểm thì tự chạy tới. Luật nằm cả ở LÕI THUẦN src/lib/live-khoi/sinh-ton-loi.ts; tệp này chỉ lo: MỘT canvas (vòng requestAnimationFrame, tab ẩn ⇒ dừng),
// cử chỉ, kênh lớp, vài lớp DOM phủ (vẽ ở sinh-ton-phu.tsx; cử chỉ sinh-ton-cu-chi.ts; tiện ích thuần sinh-ton-tien-ich.ts). Nền LUÔN TỐI (--st-*), máy bù mang tên như học sinh (tenMay).
// Máy yếu / giảm chuyển động ⇒ 30 khung / giây + kiểu phẳng. Lượt hạ trong trò KHÔNG cộng vào kJ buổi học.
// Đợt 3 (13/11, ảnh 10 · 11 · 12): THẦY VÀO TRẬN (`thayVao` — chỉ máy thầy ở phòng chờ live: máy thầy mô phỏng bé ma THAY như máy em, vẫn xem cả sân, chạm để
// tới) + MA MỰC (`bx` — tính sát thương / ngắm gồm `nvBoss` đặt cuối) + mỗi trang một hộp (`viTriHop`, `hn`).
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { DOI_BPU } from '../../lib/bpu/phong'
import type { KenhLop, NguoiLop, SinhTonAnh, TinLop } from '../../lib/live-khoi/kieu'
import {
  ANH_MS, BAT_TU_MS, CAP_TOI_DA, DOI_THAY, HOP_BK, KHIEN_MS, MA_MUC, MAU_DAY, MAU_THAY, NHANH_MS, NHIP_BAN_MS, NHIP_GUI_MS, NHIP_NHAC_MS, SAO_MS, SUNG_TEN, THAY, VAN_MS, apHop,
  buocToi, capSung, chonMucTieu, anVoi, coKhien, conLai, dangAn, dangChet, dangNghi, dangNhanh, docDong, hopSo, laMay, loaiHopO, nhanDon, nvBoss, satThuong, taoBanDo, taoToi,
  timDuong, trongBui, vanSo, viTriHop, vong, type BanDo, type Diem, type LoaiHop, type NhanVat, type Toi,
} from '../../lib/live-khoi/sinh-ton-loi'
import { tenMay } from '../../lib/live-khoi/ten-may'
import { chuDanhHieu, doTheoMa, moGon } from '../../lib/live-khoi/tu-do'
import { veDoTrenMa } from '../phong-cho/be-ma-mac'
import { MAU_SINH_TON } from '../../lib/live-khoi/mau'
import { datTat, datYeuAm, docTat, moAm, tieng, tiengBan } from './sinh-ton-am'
import { BoHinh, type BangMau } from './sinh-ton-hinh'
import { BoO, taoBoSan, type BoSan } from './sinh-ton-san'
import {
  BIEU_CAM, BoTen, HIEN_MS, MUC_MS, THE_HOP, bamSo, camNhin, cauChuoi, diemMaEm, taoGoi, tiMan, veKhung, type BossVe, type Hieu, type HopVe, type NvVe,
} from './sinh-ton-ve'
import { PHIM, taoBanPhim, taoVao, useCuChi } from './sinh-ton-cu-chi'
import {
  BangDiem, DaiThongBao, DaiTruyNa, DauHo, DsTin, NhanBieuCam, NutThay, TheBiHa, TheCuoiVan, TheHop, ThanhMau, ThanhSung, type Bao, type BiHa, type DaiBao, type Dau, type KetQua,
  type ManhTin, type ThanhLon, type TinTran, type TruyNa, type Vang,
} from './sinh-ton-phu'
import { DoTuHa, NguonThanh, bienDoi, cauHoHa, chonBao, chuGio, docBangMau, docBangVang, docPhang, ghiPhang, kepDoi, noiSuyAnh, phanCungYeu, rungNhe, tenNgan, veNho, xepHangVan, type NoiSuy } from './sinh-ton-tien-ich'
import './tro-giu-lua.css'
import './tro-sinh-ton.css'

export interface TroSinhTonProps {
  /** Em đang chơi; `null` khi `xemThoi` (máy thầy). */ toi: NguoiLop | null
  /** Cả phòng: tên + đội theo số báo danh. */ ds: readonly NguoiLop[]
  kenh: KenhLop
  soEm: number
  mayYeu?: boolean
  /** Khung cha đang bị XOAY HÌNH bằng CSS (điện thoại cầm dọc; chiều xoay theo src/components/live/chieu-xoay.ts) ⇒ đổi toạ độ con trỏ về hệ của khung. */ xoay?: boolean
  /** Máy thầy xem trận: thấy CẢ sân, không có bé ma của mình, không gửi gì. */ xemThoi?: boolean
  /** Phòng chờ CA KIỂM TRA: tiếng trò mặc định TẮT (thầy 27/10: màn kiểm tra tự tắt âm thanh); em bấm nút loa thì bật cho lượt chơi này. */ imLang?: boolean
  /** BẢN ÊM phòng chờ ca kiểm tra (đặc tả: ngay trước giờ kiểm tra thật): không con dấu câu hô, không rung, không chớp, KHÔNG chữ «trượt». Khác `imLang` (chỉ là tiếng). */ banEm?: boolean
  /** Máy THẦY ở phòng chờ LIVE (đợt 3): có nút «Thầy vào trận / Rời trận». Phòng ca KHÔNG truyền (không có Thầy; phòng cũng không nhận vai Thầy). */ thayVao?: boolean
}

const TIN_SONG_MS = 6000
const DAU_MS = 1900

export default function TroSinhTon({ toi, ds, kenh, soEm, mayYeu = false, xoay = false, xemThoi = false, imLang = false, banEm = false, thayVao = false }: TroSinhTonProps) {
  const xem = xemThoi || !toi
  const sbd = toi?.sbd ?? ''
  const doiToi = kepDoi(toi?.doi ?? 0)
  const gocRef = useRef<HTMLDivElement>(null)
  const rungRef = useRef<HTMLDivElement>(null)
  const vaiRef = useRef<HTMLCanvasElement>(null)
  const nhoRef = useRef<HTMLCanvasElement>(null)
  /** Đầu vào đang giữ: hướng vuốt, bàn phím, và một lần CHẠM chờ khung kế tiếp đổi ra toạ độ sân (ý từng trường: sinh-ton-cu-chi.ts). */
  const vao = useRef(taoVao())
  const dsRef = useRef(ds)
  const [diem, setDiem] = useState<[number, number, number, number]>([0, 0, 0, 0])
  const [gio, setGio] = useState({ van: 1, con: '2:00' })
  const [tin, setTin] = useState<TinTran[]>([])
  const [bao, setBao] = useState<Bao | null>(null)
  const [cap, setCap] = useState(1)
  const [biHa, setBiHa] = useState<BiHa | null>(null)
  const [ketQua, setKetQua] = useState<KetQua | null>(null)
  const [bang, setBang] = useState<BangMau | null>(null)
  const [dau, setDau] = useState<Dau | null>(null)
  const [truyNa, setTruyNa] = useState<TruyNa | null>(null)
  const [theHop, setTheHop] = useState<{ id: number; loai: LoaiHop } | null>(null)
  /** Pháo Sao TẠM (hộp tiếp tế): số giây còn lại, 0 = không. */
  const [sao, setSao] = useState(0)
  /** Bốn nhãn biểu cảm đang mở quanh bé ma của em (toạ độ khung). */
  const [bieuCam, setBieuCam] = useState<Diem[] | null>(null)
  const [vang, setVang] = useState<Vang | null>(null)
  const [tatTieng, setTatTieng] = useState(() => { if (!imLang) return docTat(); datTat(true, false); return true })
  /** Đợt 3: thanh máu Thầy / Ma Mực, dải báo, Thầy đang trong trận (máy thầy) + máu bé ma Thầy. */
  const [nguonThanh] = useState(() => new NguonThanh())
  const [dai, setDai] = useState<DaiBao | null>(null)
  const [trongTran, setTrongTran] = useState(false)
  const thayRef = useRef(false)

  useEffect(() => { dsRef.current = ds }, [ds])

  useEffect(() => {
    const goc = gocRef.current, vai = vaiRef.current
    const g = vai?.getContext('2d', { alpha: false })
    if (!goc || !vai || !g) return
    const giam = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nhe = mayYeu || giam
    const nhipKhung = nhe ? 1000 / 30 : 0
    /** MÁY YẾU = khai báo / giảm chuyển động / phần cứng yếu / đã tự hạ từ lần trước ⇒ vẽ dpr 1, kiểu phẳng, ít hạt, ít tiếng. Tự hạ giữa chừng cũng vào đây. */
    let yeu = nhe || phanCungYeu() || docPhang()
    datYeuAm(yeu)
    const hat = bamSo(sbd) / 997
    let conSong = true
    /** Đội của em THEO PHÒNG (dòng của chính em trong ảnh chụp là chuẩn): phòng vừa chia lại đội mà máy chưa kịp nhận thì vẫn không bắn nhầm đồng đội. */
    let doiEm = doiToi
    /** Máy thầy đang điều khiển bé ma Thầy (đọc `thayRef` mỗi khung); `coMa` = máy này có bé ma riêng (em, hoặc Thầy trong trận); `toiId` = mã của bé ma đó. */
    let laThay = false, coMa = !xem, toiId = sbd
    /** Ma Mực (ảnh vừa nhận) + vị trí nội suy, máu tối đa / phần trăm đội (`bp` gửi thưa), Thầy (mã + máu theo ảnh), hộp trang đã nhặt (`hn`). */
    let boss: NhanVat | null = null, bossTx = 0, bossTy = 0, lucBoss = 0, bossMax = 0, bossP: number[] = [0, 0, 0, 0]
    let tyAnh = '', mauThayAnh = 0, thanhCu = ''
    let hnCu: Record<string, string> = {}, hnSo = -1, choK = 0
    let haThay: string[] = []
    /** Dùng lại mỗi khung (không sinh rác): hộp còn trên sân, Ma Mực nội suy. */
    const hopVe: HopVe[] = []
    const bossKhung: NhanVat = { id: MA_MUC, x: 0, y: 0, mau: 0, doi: 0, cap: 1, t: '' }
    const bossVe: BossVe = { x: 0, y: 0, t: null }

    // ── Trạng thái trò (không qua React: đổi 60 lần / giây) ──
    let bd: BanDo = taoBanDo(0)
    let tt: Toi = taoToi(bd, doiEm, Date.now(), hat)
    let noi: Record<string, NoiSuy> = {}
    /** Lệch giờ phòng so với đồng hồ máy (ms), làm mượt theo dấu `l` của từng ảnh chụp. */
    let lech = 0, coLech = false
    let lucAnh = 0, soAnh = 0
    let mucTieu = '', lucNgam = 0, huong = 0, gioEm = NaN
    /** `choA` = mã kẻ hạ em còn chờ báo phòng; `keHa` = kẻ hạ em ở lượt này ('' = hết máu ngoài vòng). */
    let choA = '', keHa = '', choH = -1
    let vanHien = 1, lucNho = 0
    let hop: [number, string] = [-1, '']
    /** Hiệu ứng hộp của NGƯỜI KHÁC (suy từ `h` + `loaiHop` + thời gian, hợp đồng kieu.ts): người nhặt hộp gần nhất và mốc hết khiên / chạy nhanh (giờ phòng). */
    let hh = { id: '', khienDen: 0, nhanhDen: 0 }
    let lucGui = 0, khoaGui = ''
    let chetCu = false, nghiCu = false, vanKq = -1
    const soHa = new Map<string, number>()
    let haVan = 0, vanThuBai = -1
    /** Thủ khoa đang bị truy nã (`tk`), người đã diệt thủ khoa trong ván, chấm đồng đội ở xa (`dd`), biểu cảm còn hiệu lực (`bc`). */
    let tk = '', soTruy = 0, henTruy = 0, henHop = 0, soTheHop = 0, lucChan = 0, henDai = 0
    let dietTk: string[] = []
    let dd: readonly number[] = []
    let bc: Record<string, number> = {}
    /** Biểu cảm của chính em hiện ngay (khỏi chờ phòng): chữ + hết lúc (đồng hồ khung). `lucBcEm` = lần gửi gần nhất (phòng nhận 1 lần / 2 giây). */
    let bcEm = { chu: '', het: 0 }, lucBcEm = -1e9
    let bvCu = '', saoCu = 0
    /** Vào / rời phòng chỉ đọc từ danh sách lớp (`lop-ds` / `st-ds` ⇒ prop `ds`), không đọc từ ảnh chụp («chỉ gửi gần»: người vào / ra `ds` là chuyện thường). */
    const daBiet = new Set(ds.map((n) => n.sbd))
    let dsCu = dsRef.current
    /** Tra cứu danh sách phòng theo số báo danh (dựng lại khi danh sách đổi) + đồ / danh hiệu đã giải sẵn (đợt 4 — CHỈ HÌNH). */
    let dsTra = new Map<string, { n: NguoiLop; mac: string; dh: string; cv: boolean; ha: string }>(), dsTraCu: readonly NguoiLop[] | null = null
    const nguoiCua = (id: string) => {
      if (dsRef.current !== dsTraCu) {
        dsTraCu = dsRef.current
        dsTra = new Map(dsTraCu.map((n) => { const m = moGon(n.c); return [n.sbd, { n, mac: n.c ?? '', dh: chuDanhHieu(n.dh), cv: m.dan === 'dan-cau-vong', ha: doTheoMa(m.ha)?.ma ?? '' }] }))
      }
      return dsTra.get(id)
    }
    /** Dòng của ẢNH VỪA NHẬN (không gồm em) — chỉ những dòng này được tính sát thương; `khacBan` = nhân vật khác lúc vẽ trừ dòng giữ lại (để ngắm). */
    const dongAnh: NhanVat[] = []
    const khacBan: NhanVat[] = []
    let hieu: Hieu[] = []
    const lucMuc = new Map<string, number>()
    /** Bé ma của em đang hiện ra (vào trận / sống lại) từ lúc này (đồng hồ khung hình); 0 = không. Em vào giữa ván ⇒ hiện kiểu sống lại. */
    let hienEm = performance.now(), hienSong = true
    let dsTin: TinTran[] = [], soTin = 0, soDau = 0, henDau = 0
    let vui: { chu: string; het: number } | null = null
    let baoCu = '', diemCu = '', gioCu = '', capCu = 1, haCu = ''
    const lucMo = performance.now()
    const khac: NhanVat[] = []
    const nvVe: NvVe[] = []
    /** Nhịp bắn gần nhất đã kêu của từng nhân vật (tiếng súng đi cùng nhịp đạn trên màn). */
    const nhipBan = new Map<string, number>()
    let lucTrungTieng = 0

    // ── Khung vẽ ──
    let W = 0, H = 0, ti = 1, dpr = 1
    let bm = docBangMau(goc)
    /** KIỂU PHẲNG: máy yếu ngay từ đầu, hoặc TỰ HẠ khi máy vẽ không kịp (xem vòng khung) ⇒ bé ma 1 khung, không khối 3D / bóng đổ, không nhún. */
    let phang = yeu
    if (phang) goc.setAttribute('data-phang', '1')
    const veDo = (gv: CanvasRenderingContext2D, b: BangMau, gon: string) => veDoTrenMa(gv, b, moGon(gon))
    let hinh = new BoHinh(bm, 1, phang, veDo)
    let san: BoSan = taoBoSan(g, bm, 1)
    /** Ô nướng sẵn lớp dưới (nền + trang; kiểu phẳng cả vật chặn); trần bộ nhớ theo máy. */
    let oSan: BoO | null = null
    let phiVe = 0
    let bangTen = new BoTen(bm, 1, 13)
    const tuHa = new DoTuHa()
    setBang(bm)
    const doKhung = () => {
      W = goc.clientWidth; H = goc.clientHeight
      if (!W || !H) return
      dpr = Math.min(yeu ? 1 : 2, window.devicePixelRatio || 1)
      vai.width = Math.round(W * dpr); vai.height = Math.round(H * dpr)
      // Mọi máy thấy CÙNG diện tích sân (máy to không nhìn xa hơn máy nhỏ, nửa đường chéo ≤ 840 — «chỉ gửi gần»); máy thầy thấy cả sân. Ô mẫu nền = số nguyên điểm ảnh.
      ti = tiMan(W, H, dpr, xem, bd)
      // Ảnh nướng sẵn: trần 2,4 điểm ảnh / đơn vị sân (máy tính bảng 1180 × 820 dpr 2 cần 2,73 ⇒ 13,8 MB; trần này giữ bộ nhớ ảnh ≤ 12 MB, mắt không thấy khác).
      hinh = new BoHinh(bm, Math.min(2.4, ti * dpr), phang, veDo)
      san = taoBoSan(g, bm, ti * dpr)
      oSan?.huy()
      // Chỉ máy yếu / đã tự hạ mới dùng ô: máy thường đủ sức vẽ thẳng, khỏi tốn thêm bộ nhớ ảnh.
      oSan = yeu ? new BoO(bm, hinh, bd, san, ti * dpr, phang, false, 14e6) : null
      bangTen = new BoTen(bm, dpr, Math.round(Math.max(12, Math.min(16, 17 * ti))))
    }
    const doiMau = () => { bm = docBangMau(goc); setBang(bm); doKhung() }
    // Phông viết tay về muộn ⇒ nướng lại chữ (công thức, tên trại, bảng tên) bằng đúng phông.
    const phong = (document as Document & { fonts?: FontFaceSet }).fonts
    void phong?.load?.('16px "Patrick Hand"', 'Đỗ đại học ạ').then(() => { if (conSong) doKhung() }).catch(() => { /* không tải được phông: giữ phông dự phòng */ })

    // ── Tin trận, câu hô, dòng chữ nhỏ (DOM, chỉ đặt lại khi đổi) ──
    const tenCua = (id: string): string => (id === THAY ? 'Thầy' : id === MA_MUC ? 'Ma Mực' : laMay(id) ? tenMay(id) ?? 'Bạn cùng lớp' : !xem && id === sbd ? 'Em' : tenNgan(nguoiCua(id)?.n.ten ?? `Bạn ${id}`))
    /** Đội 0..3; Thầy / Ma Mực ⇒ -1 (chữ không tô màu đội, không vết mực màu đội). */
    const doiCua = (id: string): number => (id === THAY || id === MA_MUC ? -1 : !xem && id === sbd ? doiEm : noi[id]?.nv.doi ?? nguoiCua(id)?.n.doi ?? 0)
    const themTin = (manh: ManhTin[], luc: number) => {
      dsTin = [...dsTin, { id: ++soTin, het: luc + TIN_SONG_MS, manh }].slice(-3)
      setTin(dsTin)
    }
    const datBao = (b: Bao | null) => {
      const khoa = b ? b.kieu + b.chu : ''
      if (khoa === baoCu) return
      baoCu = khoa; setBao(b)
    }
    const baoVui = (chu: string, luc: number) => { vui = { chu, het: luc + 2600 } }
    /** Con dấu câu hô (bản êm: không có). */
    const hoDau = (chu: string, phu = '', vang = false) => {
      if (banEm) return
      setDau({ id: ++soDau, chu, phu, vang })
      window.clearTimeout(henDau)
      henDau = window.setTimeout(() => { if (conSong) setDau(null) }, DAU_MS)
    }
    /** Rung nhẹ màn khi em hạ được bạn (≤ 120 ms, transform trên lớp bọc canvas); tắt khi giảm chuyển động / bản êm. */
    const rung = () => { if (!giam && !banEm && !yeu) rungNhe(rungRef.current) }
    /** Lên `buoc` cấp THẬT (hạ thủ khoa ⇒ 2, một tiếng + một dòng báo). Pháo Sao tạm không đổi `cap` thật. */
    const lenCap = (luc: number, buoc = 1): boolean => {
      if (tt.cap >= CAP_TOI_DA) return false
      tt = { ...tt, cap: Math.min(CAP_TOI_DA, tt.cap + buoc) }
      capCu = tt.cap; setCap(tt.cap)
      tieng('lenCap')
      baoVui(`Súng lên cấp ${tt.cap} · ${SUNG_TEN[tt.cap - 1]}`, luc)
      return true
    }
    /** Hết ván / bảng vàng tới: xếp hạng bốn đội «Đỗ thủ khoa · Đỗ á khoa · Đỗ vớt · Thi lại ván sau» (một lần mỗi ván). */
    const chotVan = (van: number) => {
      vanKq = van
      if (!xem) tieng('hetVan')
      setKetQua({ van: vanHien, hang: xepHangVan(diemCu, soHa, tenCua, doiCua) })
    }
    const datDai = (chu: string, phu: string) => { setDai({ id: ++soTruy, chu, phu }); window.clearTimeout(henDai); henDai = window.setTimeout(() => { if (conSong) setDai(null) }, 6000) }
    /** Hộp tiếp tế loại `loai` vừa có người nhặt (`nhat`): hiệu ứng người khác, dòng tin; em nhặt ⇒ `apHop` + thẻ báo. */
    const nhatHop = (nhat: string, loai: LoaiHop, nay: number, luc: number) => {
      hh = { id: nhat, khienDen: loai === 'khien' ? nay + KHIEN_MS : 0, nhanhDen: loai === 'nhanh' ? nay + NHANH_MS : 0 }
      if (!laMay(nhat)) themTin([{ c: tenCua(nhat), doi: doiCua(nhat) }, { c: ` nhặt hộp ${THE_HOP[loai][0]}` }], luc)
      if (!xem && nhat === sbd && !dangChet(tt, nay)) {
        tt = apHop(tt, loai, nay); tieng('hop')
        setTheHop({ id: ++soTheHop, loai })
        window.clearTimeout(henHop)
        henHop = window.setTimeout(() => { if (conSong) setTheHop(null) }, 2800)
        if (loai === 'sao') { saoCu = Math.ceil(SAO_MS / 1000); setSao(saoCu) }
      }
    }
    /** Hộp k của lượt `soHop` còn trên sân? (k = 0 tâm sân theo `h`; k ≥ 1 theo `hn`.) */
    const conHop = (k: number, soHop: number): boolean => (k ? !(hnSo === soHop && hnCu[k]) : hop[0] !== soHop)
    const themHieu = (e: Hieu) => {
      if (yeu && e.k === 'muc') { let n = 0; for (const x of hieu) if (x.k === 'muc') n++; if (n >= 3) return }
      hieu.push(e); if (hieu.length > (yeu ? 10 : 24)) hieu = hieu.slice(-(yeu ? 10 : 24))
    }

    // ── Kênh lớp: ảnh chụp mỗi 250 ms ──
    const boNghe = kenh.nghe('tro', (t: TinLop) => {
      const anh = t.x as Partial<SinhTonAnh> | null
      if (!anh || typeof anh !== 'object' || !anh.ds || typeof anh.ds !== 'object') return
      const luc = performance.now()
      if (Number.isFinite(t.l) && t.l > 0) {
        const d = t.l - Date.now()
        lech = coLech ? lech + (d - lech) * 0.1 : d
        coLech = true
      }
      const nay = Date.now() + lech
      lucAnh = luc; soAnh++
      // Cỡ sân đổi ở đầu ván theo số nhân vật (bản đồ nhớ sẵn theo cỡ ⇒ so đúng đối tượng; cỡ lạ quy về 0, không dựng lại mỗi nhịp).
      const bdMoi = typeof anh.c === 'number' ? taoBanDo(anh.c) : bd
      // Đổi sân / sang ván mới ⇒ không giữ dòng cũ, bỏ chấm đồng đội xa.
      const doiSan = bdMoi !== bd || (typeof anh.v === 'number' && anh.v > 0 && anh.v !== vanHien)
      if (bdMoi !== bd) {
        const roiRong = bdMoi.rong * bdMoi.cao > bd.rong * bd.cao
        bd = bdMoi
        if (!xem) { tt = { ...taoToi(bd, doiEm, nay, hat), cap: tt.cap, mau: tt.mau }; if (soAnh > 1) baoVui(roiRong ? 'Lớp đông hơn · sân mở rộng' : 'Sân thu gọn lại', luc) }
        doKhung()
      }
      if (doiSan) { dd = []; hh = { id: '', khienDen: 0, nhanhDen: 0 }; dietTk = []; haThay = []; hnCu = {} }
      // Ván mới theo PHÒNG ⇒ đếm lượt hạ lại từ 0 (máy thầy không có vòng ván riêng — số «THỦ KHOA … n lượt hạ» trên máy chiếu phải là của ván này).
      if (typeof anh.v === 'number' && anh.v > 0 && anh.v !== vanHien) { soHa.clear(); haVan = 0 }
      // Ảnh mỏng thiếu dòng của em ⇒ giữ đội cũ.
      const dongToi = xem ? null : docDong(sbd, anh.ds[sbd])
      if (dongToi && dongToi.doi !== doiEm) { doiEm = dongToi.doi; tt = { ...taoToi(bd, doiEm, nay, hat), cap: tt.cap }; mucTieu = '' }
      const dauVan = ((nay % VAN_MS) + VAN_MS) % VAN_MS < 3000
      const matMau: string[] = []
      const moi = noiSuyAnh(anh.ds, coMa ? toiId : null, noi, luc, dauVan, bd, soAnh, anh.m === 1 && !doiSan, dongAnh, matMau)
      // Đối thủ em đang bắn vừa mất máu ⇒ số máu trừ bay lên.
      if (!xem && matMau.includes(mucTieu)) { const n = moi[mucTieu].nv; themHieu({ k: 'so', x: n.x + 20, y: n.y - 66, doi: doiEm, luc, chu: `−${Math.round(noi[mucTieu].nv.mau - n.mau)}`, mau: 'sai' }) }
      // Người nhặt hộp bị hạ ⇒ mất hiệu ứng hộp.
      for (const nv of dongAnh) if (nv.mau <= 0 && nv.id === hh.id) hh = { id: '', khienDen: 0, nhanhDen: 0 }
      noi = moi
      if (Array.isArray(anh.dd)) dd = anh.dd.every((v) => typeof v === 'number') ? anh.dd : dd
      // Vết mực màu đội của kẻ đang bắn lên người vừa mất máu (mỗi người tối đa ~3 vết / giây).
      for (const id of matMau) {
        if (luc - (lucMuc.get(id) ?? -1e9) < 350) continue
        let doiBan = !xem && mucTieu === id ? doiEm : -1
        if (doiBan < 0) for (const k in moi) if (moi[k].nv.t === id) { doiBan = moi[k].nv.doi; break }
        if (doiBan < 0) continue
        lucMuc.set(id, luc)
        const n = moi[id].nv
        themHieu({ k: 'muc', x: n.x + ((luc % 17) - 8), y: n.y - 30 + ((luc % 11) - 5), doi: doiBan, luc, chu: '', mau: 'sai' })
      }
      // Lượt hạ (bản 4): [kẻ hạ, bị hạ, chuỗi người bị hạ, chuỗi kẻ hạ, 1 = người bị hạ là thủ khoa] — chuỗi do PHÒNG đếm (thiếu ⇒ 0).
      for (const dong of Array.isArray(anh.an) ? anh.an : []) {
        if (!Array.isArray(dong) || typeof dong[0] !== 'string' || typeof dong[1] !== 'string') continue
        const [ai, bi] = dong, chBi = Number(dong[2]) || 0, ch = Number(dong[3]) || 0, laTk = dong[4] === 1
        // Đợt 3: hạ Thầy · Thầy gạch tên · Ma Mực nuốt — không tính lượt hạ đội / thủ khoa (phòng cũng không cộng).
        const haTh = bi === THAY, thHa = ai === THAY, mmHa = ai === MA_MUC, thuong = !haTh && !thHa && !mmHa
        if (thuong) { soHa.set(ai, (soHa.get(ai) ?? 0) + 1); haVan++ }
        // Máy hạ máy thì không báo (đỡ rối tin trận); có em thật ở một trong hai phía mới hiện.
        const coEm = !laMay(ai) || !laMay(bi)
        if (thHa) themTin([{ c: 'Thầy', noi: true }, { c: ' gạch tên ', noi: true }, { c: tenCua(bi), doi: doiCua(bi), noi: true }], luc)
        else if (haTh) {
          themTin([{ c: tenCua(ai), doi: doiCua(ai), noi: true }, { c: ' hạ gục Thầy!', noi: true }], luc)
          if (!laMay(ai) && !haThay.includes(ai)) haThay = [...haThay, ai]
        } else if (mmHa) { if (!laMay(bi)) themTin([{ c: 'Ma Mực' }, { c: ' nuốt ' }, { c: tenCua(bi), doi: doiCua(bi) }], luc) }
        else if (coEm) themTin([{ c: tenCua(ai), doi: doiCua(ai) }, { c: ' hạ ' }, { c: tenCua(bi), doi: doiCua(bi) }], luc)
        if (laTk) {
          if (!laMay(ai) && !dietTk.includes(ai)) dietTk = [...dietTk, ai]
          themTin([{ c: tenCua(ai), doi: doiCua(ai), noi: true }, { c: ' diệt thủ khoa!', noi: true }], luc)
          // Nợ đợt 2: thủ khoa bị hạ ⇒ «<tên> mất vương miện».
          themTin([{ c: tenCua(bi), doi: doiCua(bi) }, { c: ' mất vương miện' }], luc)
        } else if (coEm && thuong && ch >= 2) themTin([{ c: tenCua(ai), doi: doiCua(ai), noi: true }, { c: ` chuỗi ${ch} · ${cauChuoi(ch)}`, noi: true }], luc)
        // Hiệu ứng KHI HẠ của bộ đồ người hạ (đợt 4, chỉ hình) tại chỗ người bị hạ — cả lớp thấy.
        const doHa = thuong ? nguoiCua(ai)?.ha : ''
        if (doHa) { const n = bi === sbd && !xem ? tt : noi[bi]?.nv; if (n) themHieu({ k: 'do', x: n.x, y: n.y, doi: doiCua(ai), luc, chu: doHa, mau: 'sai' }) }
        if (!xem && ai === sbd) {
          tieng('ha'); rung()
          // Hạ thủ khoa ⇒ lên THÊM một cấp (tổng +2, tối đa 6) — một lần lên, một tiếng.
          const len = !dangChet(tt, nay) && lenCap(luc, laTk ? 2 : 1)
          const n = noi[bi]?.nv
          if (n) themHieu({ k: 'so', x: n.x, y: n.y - 70, doi: doiEm, luc, chu: '+1', mau: 'sao' })
          const ho = haTh ? ['ĐÃ HẠ GỤC THẦY!', 'Tên em lên bảng vàng'] as const : cauHoHa(laTk, chBi, ch, haVan, tenCua(bi), len ? ` · súng lên ${SUNG_TEN[tt.cap - 1]}` : '')
          if (ho) hoDau(ho[0], ho[1], haTh)
        } else if (thuong && haVan === 1) hoDau('MỞ BÀI!', `${tenCua(ai)} hạ được bạn đầu tiên của ván`)
      }
      if (typeof anh.v === 'number' && anh.v > 0) vanHien = anh.v
      if (Array.isArray(anh.d) && anh.d.length === 4 && anh.d.join() !== diemCu) { diemCu = anh.d.join(); setDiem([anh.d[0], anh.d[1], anh.d[2], anh.d[3]]) }
      // TRUY NÃ THỦ KHOA: `tk` đổi ⇒ dòng tin + dải báo 6 giây; em thành thủ khoa ⇒ con dấu vàng.
      const tkMoi = typeof anh.tk === 'string' ? anh.tk : ''
      if (tkMoi !== tk) {
        tk = tkMoi
        window.clearTimeout(henTruy)
        if (tk) {
          const em = !xem && tk === sbd
          themTin([{ c: tenCua(tk), doi: doiCua(tk), noi: true }, { c: ` thành thủ khoa ván ${vanHien}!`, noi: true }], luc)
          setTruyNa({ id: ++soTruy, ten: em ? '' : tenCua(tk), ha: soHa.get(tk) ?? 0, em })
          henTruy = window.setTimeout(() => { if (conSong) setTruyNa(null) }, 6000)
          if (em) hoDau('EM LÀ THỦ KHOA!', 'Cả lớp đang truy nã em', true)
        } else setTruyNa(null)
      }
      // Biểu cảm còn hiệu lực; biểu cảm MỚI của đồng đội (em thật) ⇒ một dòng tin.
      const bcMoi: Record<string, number> = {}
      if (anh.bc && typeof anh.bc === 'object') for (const id in anh.bc) {
        const e = anh.bc[id]
        if (!Number.isInteger(e) || e < 0 || e >= BIEU_CAM.length) continue
        bcMoi[id] = e
        if (bc[id] !== e && id !== sbd && !laMay(id) && !xem && doiCua(id) === doiEm) themTin([{ c: tenCua(id), doi: doiCua(id) }, { c: `: ${BIEU_CAM[e]}` }], luc)
      }
      bc = bcMoi
      if (Array.isArray(anh.h) && typeof anh.h[0] === 'number') {
        const nhat = typeof anh.h[1] === 'string' ? anh.h[1] : ''
        // Hộp vừa có người nhặt (lần đầu thấy) ⇒ hiệu ứng theo loại hộp; em nhặt ⇒ `apHop` (không lên cấp, không kích chuỗi) + thẻ báo.
        if (nhat && (anh.h[0] !== hop[0] || nhat !== hop[1]) && soAnh > 1) nhatHop(nhat, loaiHopO(anh.h[0], 0), nay, luc)
        hop = [anh.h[0], nhat]
      }
      // Hộp giữa trang (đợt 3, `hn` = {k: mã} của lượt hộp hiện tại): người nhặt mới ⇒ như hộp tâm.
      const soHopNay = hopSo(nay), hnMoi: Record<string, string> = anh.hn && typeof anh.hn === 'object' ? anh.hn : {}
      if (hnSo !== soHopNay) hnCu = {}
      for (const k in hnMoi) if (typeof hnMoi[k] === 'string' && hnCu[k] !== hnMoi[k] && soAnh > 1) nhatHop(hnMoi[k], loaiHopO(soHopNay, Number(k)), nay, luc)
      hnCu = hnMoi; hnSo = soHopNay
      // THẦY VÀO TRẬN: `ty` = [mã, máu] (chỉ ảnh đủ vành; ảnh mỏng thiếu ⇒ giữ) ⇒ thanh máu Thầy; vừa vào ⇒ dải báo; vừa rời ⇒ dòng tin.
      const coTy = Array.isArray(anh.ty) && typeof anh.ty[0] === 'string' && typeof anh.ty[1] === 'number'
      const tyMoi = coTy ? anh.ty![0] : anh.m === 1 && !doiSan ? tyAnh : ''
      if (coTy) mauThayAnh = anh.ty![1]
      if (tyMoi !== tyAnh) {
        if (tyMoi && soAnh > 0) { datDai('THẦY ĐÃ VÀO TRẬN!', 'Hạ được Thầy thì tên em lên bảng vàng'); themTin([{ c: 'Thầy', noi: true }, { c: ' vào trận!', noi: true }], luc) }
        else if (!tyMoi) themTin([{ c: 'Thầy' }, { c: ' rời trận' }], luc)
        tyAnh = tyMoi
      }
      // MA MỰC: `bx` luôn có khi boss trên sân; `bp` thưa (giữ số cũ); `bh` = đội vừa diệt (+5 đã nằm trong `d`).
      const bMoi = nvBoss(anh.bx)
      if (Array.isArray(anh.bp) && anh.bp.length === 5 && anh.bp.every((v) => typeof v === 'number')) { bossMax = anh.bp[0]; bossP = anh.bp.slice(1) }
      if (bMoi) {
        if (!boss) { bossTx = bMoi.x; bossTy = bMoi.y; if (soAnh > 1) { datDai('MA MỰC TRỒI LÊN GIỮA SÂN!', 'Đội đánh nhiều nhất được cộng 5 lượt hạ'); themTin([{ c: 'Ma Mực trồi lên giữa sân!', noi: true }], luc) } }
        else {
          const f = Math.min(1, (luc - lucBoss) / ANH_MS)
          bossTx += (boss.x - bossTx) * f; bossTy += (boss.y - bossTy) * f
          // Em đang bắn Ma Mực ⇒ số máu boss mất bay lên.
          if (coMa && mucTieu === MA_MUC && bMoi.mau < boss.mau) themHieu({ k: 'so', x: bMoi.x + 30, y: bMoi.y - 150, doi: doiEm, luc, chu: `−${Math.max(1, Math.round(boss.mau - bMoi.mau))}`, mau: 'sai' })
        }
        lucBoss = luc
      } else bossMax = 0
      boss = bMoi
      if (typeof anh.bh === 'number' && anh.bh >= 0 && anh.bh < 4) {
        themTin([{ c: `Đội ${DOI_BPU[anh.bh].ten}`, doi: anh.bh, noi: true }, { c: ' diệt Ma Mực! +5 lượt hạ', noi: true }], luc)
        if (!xem && anh.bh === doiEm) hoDau('ĐÃ DIỆT MA MỰC!', 'Đội em được cộng 5 lượt hạ', true)
      }
      // BẢNG VÀNG (chỉ trong 5 giây nghỉ): top 3 em thật + hạng của em ⇒ chốt ván ngay (không chờ vòng khung).
      if (Array.isArray(anh.bv)) {
        const hg = typeof anh.hg === 'number' && anh.hg > 0 ? Math.floor(anh.hg) : 0, khoa = `${JSON.stringify(anh.bv)}|${hg}|${tk}`
        if (khoa !== bvCu) {
          bvCu = khoa
          if (vanKq !== vanSo(nay)) chotVan(vanSo(nay))
          const top = docBangVang(anh.bv, xem, sbd, toi?.ten ?? '', doiEm, tk, tenCua, doiCua)
          setVang({ top, hg, haEm: soHa.get(sbd) ?? 0, dietTk: dietTk.map(tenCua), haThay: haThay.map(tenCua) })
        }
      }
      if (!coMa) return
      // Em (hoặc bé ma Thầy) bị bắn: tự tính từ ẢNH VỪA NHẬN (dòng giữ lại không tính) + Ma Mực đặt CUỐI; Súng Lửa Màu bắn thẳng ⇒ châm lửa. Có khiên ⇒ «chặn!».
      if (boss) dongAnh.push(boss)
      const don = satThuong({ id: toiId, x: tt.x, y: tt.y, doi: laThay ? DOI_THAY : doiEm }, dongAnh, ANH_MS / 1000)
      const song = !dangChet(tt, nay), mauTruoc = tt.mau
      if (song && don.tong > 0 && coKhien(tt, nay) && luc - lucChan > 600) { lucChan = luc; themHieu({ k: 'so', x: tt.x + 18, y: tt.y - 66, doi: doiEm, luc, chu: 'chặn!', mau: 'dung' }) }
      tt = nhanDon(tt, don.tong, nay, don.chay)
      if (song && tt.mau < mauTruoc) {
        themHieu({ k: 'so', x: tt.x + 18, y: tt.y - 66, doi: doiEm, luc, chu: `−${Math.max(1, Math.round(mauTruoc - tt.mau))}`, mau: 'sai' })
        if (don.ai && doiCua(don.ai) >= 0 && luc - (lucMuc.get(toiId) ?? -1e9) >= 350) { lucMuc.set(toiId, luc); themHieu({ k: 'muc', x: tt.x, y: tt.y - 30, doi: doiCua(don.ai), luc, chu: '', mau: 'sai' }) }
      }
      if (song && dangChet(tt, nay)) { choA = don.ai; keHa = don.ai; if (!xem) tieng('biHa') }
      else if (!xem && don.tong > 0 && song && luc - lucTrungTieng > 240 && nay >= tt.batTuDen) { lucTrungTieng = luc; tieng('trung') }
    })

    // ── Vòng khung hình ──
    let rafId = 0, lucTruoc = 0, lucCham = 0
    const khung = (luc: number) => {
      rafId = requestAnimationFrame(khung)
      if (!W || !H) { doKhung(); return }
      if (!lucTruoc) lucTruoc = luc - 16
      const dt = luc - lucTruoc
      if (nhipKhung && dt < nhipKhung - 3) return
      lucTruoc = luc
      // TỰ HẠ: HAI cửa sổ 0,6 giây liền nhau dưới 48 khung / giây ⇒ chuyển hẳn sang kiểu phẳng và GHI NHỚ ở máy 1 ngày.
      if (!phang && tuHa.buoc(luc)) { phang = true; yeu = true; datYeuAm(true); ghiPhang(); goc.setAttribute('data-phang', '1'); doKhung() }
      const nay = Date.now() + lech
      const nghi = dangNghi(nay), van = vanSo(nay), v = vong(bd, nay)
      // Thầy vào / rời trận (nút ở máy thầy): vào ⇒ bé ma Thầy hiện quanh tâm sân; rời ⇒ báo phòng gỡ ngay.
      if (xem && thayRef.current !== laThay) {
        laThay = thayRef.current; coMa = laThay; toiId = laThay ? THAY : sbd; mucTieu = ''; vao.current.cham = null
        if (laThay) tt = taoToi(bd, DOI_THAY, nay, 0.37)
        else kenh.gui('tro', { p: [0, 0, 0, 2], roi: 1 })
      }
      // Ma Mực tại lúc này (nội suy giữa hai ảnh) — đặt CUỐI danh sách ngắm.
      let bossNay: NhanVat | null = null
      if (boss) { const f = Math.min(1, (luc - lucBoss) / ANH_MS); bossNay = Object.assign(bossKhung, boss); bossNay.x = bossTx + (boss.x - bossTx) * f; bossNay.y = bossTy + (boss.y - bossTy) * f }
      const matMang = soAnh > 0 && luc - lucAnh > 2500
      // Nhân vật khác tại lúc này (nội suy giữa hai ảnh chụp); dùng lại mảng để không sinh rác mỗi khung. `khacBan` bỏ dòng giữ lại của ảnh mỏng (không ngắm).
      let n = 0
      khacBan.length = 0
      for (const id in noi) {
        const o = noi[id], f = Math.min(1, (luc - o.luc) / ANH_MS)
        const k = khac[n] ?? (khac[n] = { id: '', x: 0, y: 0, mau: 0, doi: 0, cap: 1, t: '' })
        k.id = id; k.x = o.tx + (o.nv.x - o.tx) * f; k.y = o.ty + (o.nv.y - o.ty) * f; k.mau = o.nv.mau; k.doi = o.nv.doi; k.cap = o.nv.cap; k.t = o.nv.t
        if (!o.giu) khacBan.push(k)
        n++
      }
      khac.length = n
      // 10 giây cuối ván: SẮP THU BÀI! (một lần mỗi ván).
      if (!nghi && vanThuBai !== van && conLai(nay) <= 10_000) { vanThuBai = van; if (soAnh > 0) hoDau('SẮP THU BÀI!', 'Còn 10 giây') }
      const i = vao.current
      // Bốn nhãn biểu cảm tự đóng sau 4 giây.
      if (i.moBc && luc - i.moBc > 4000) { i.moBc = 0; setBieuCam(null) }
      let cam: Diem = { x: bd.rong / 2, y: bd.cao / 2 }, duong: Diem[] | null = null
      if (!xem) {
        if (van !== tt.van) {
          tt = taoToi(bd, doiEm, nay, hat); soHa.clear(); haVan = 0; mucTieu = ''; i.cham = null; hh = { id: '', khienDen: 0, nhanhDen: 0 }; dietTk = []
          hienEm = luc; hienSong = false
          hoDau('VÀO TRẬN!', 'Cả đội được vẽ ra ở trại', true)
        }
        let dx = i.cx, dy = i.cy
        for (const ma in PHIM) if (i.phim[ma]) { dx += PHIM[ma][0]; dy += PHIM[ma][1] }
        if (dx || dy) i.daDung = true
        // Chạm một điểm ⇒ tự chạy tới, vòng qua vật chặn.
        if (i.cham && !dangChet(tt, nay)) {
          const c0 = camNhin(bd, W, H, ti, tt.x, tt.y)
          tt = { ...tt, duong: timDuong(bd, tt.x, tt.y, c0.x + (i.cham.x - W / 2) / ti, c0.y + (i.cham.y - H / 2) / ti) }
          i.daDung = true
        }
        i.cham = null
        // `vuaSong`: hết 3 giây bị hạ ⇒ bước này `buocToi` hồi sinh em ở trại (hoặc mép vòng).
        const xCu = tt.x, yCu = tt.y, songTruoc = !dangChet(tt, nay), vuaSong = tt.chetDen > 0 && songTruoc
        tt = buocToi(bd, tt, { dx, dy }, dt, nay, hat)
        // Chết vì CHÁY (Súng Lửa Màu) ⇒ kẻ châm lửa là kẻ hạ em; chết ngoài vòng ⇒ ''.
        if (songTruoc && dangChet(tt, nay)) { keHa = tt.chayAi; if (tt.chayAi) choA = tt.chayAi; tieng('biHa') }
        if (vuaSong && !dangChet(tt, nay)) { hienEm = luc; hienSong = true; hoDau('THI LẠI!', 'Bất tử 2 giây · súng về cấp 1', true) }
        const diChuyen = tt.x !== xCu || tt.y !== yCu
        if (diChuyen) huong = Math.atan2(tt.y - yCu, tt.x - xCu)
        gioEm = diChuyen ? huong : NaN
        const chet = dangChet(tt, nay)
        cam = camNhin(bd, W, H, ti, tt.x, tt.y)
        // Thân bé ma của em trên khung (chạm trúng ⇒ mở nhãn biểu cảm); bị hạ ⇒ không chạm được, nhãn đang mở thì đóng.
        i.ma = chet ? null : diemMaEm(tt.x, tt.y, cam, ti, W, H); i.ti = ti
        if (chet && i.moBc) { i.moBc = 0; setBieuCam(null) }
        // Súng bắn đối thủ gần nhất ĐANG HIỆN TRÊN MÀN của em (lùi mép 24 px để thấy rõ bé ma, không chỉ thấy mép áo) — chỉ dòng có trong ảnh vừa nhận.
        if (luc - lucNgam >= 100) {
          lucNgam = luc
          const nx = (W / 2 - 24) / ti, ny = (H / 2 - 24) / ti
          // Bé ma cao chừng 60 đơn vị: lấy thân (chân + 34) làm điểm «đang thấy».
          if (bossNay) khacBan.push(bossNay)
          mucTieu = chet || nghi || dangAn(bd, tt, nay) ? '' : chonMucTieu(bd, tt, khacBan, { x0: cam.x - nx, y0: cam.y - ny + 34, x1: cam.x + nx, y1: cam.y + ny + 34 })
        }
        // Hộp tiếp tế (tâm sân + giữa mỗi trang): chạm là xin phòng (em chạm đầu tiên được nhận).
        const soHop = hopSo(nay), dsHop = viTriHop(bd)
        if (!chet && !nghi && choH !== soHop) for (let k = 0; k < dsHop.length; k++) if (conHop(k, soHop) && Math.hypot(tt.x - dsHop[k].x, tt.y - dsHop[k].y) < HOP_BK) { choH = soHop; choK = k; break }
        // Gửi ≤ 4 gói / giây (`p[3]` = cấp súng đang dùng — Pháo Sao tạm ⇒ 6); đứng yên vẫn nhắc mỗi 2 giây để phòng không gỡ em. Biểu cảm chờ gửi ⇒ gửi ở nhịp kế.
        const goi = taoGoi(tt, nay, chet, mucTieu)
        const khoa = `${goi.p.join()}|${mucTieu}`
        if ((luc - lucGui >= NHIP_GUI_MS && (khoa !== khoaGui || choA || choH === soHop || i.e >= 0)) || luc - lucGui >= NHIP_NHAC_MS) {
          if (choA) { goi.a = choA; choA = '' }
          if (choH === soHop && conHop(choK, soHop)) { goi.h = soHop; if (choK) goi.k = choK }
          if (i.e >= 0) {
            // Bong bóng của em hiện ngay (phòng nhận 1 lần / 2 giây — lần dư thì không hiện, như phòng).
            if (luc - lucBcEm >= 2000) { lucBcEm = luc; bcEm = { chu: BIEU_CAM[i.e] ?? '', het: luc + 2000 } }
            goi.e = i.e; i.e = -1
          }
          lucGui = luc; khoaGui = khoa
          kenh.gui('tro', goi)
        }
        // Lớp DOM: bị hạ, cấp súng (Pháo Sao tạm đếm giây), dòng chữ nhỏ.
        if (chet !== chetCu || chet) {
          const giay = chet ? Math.max(1, Math.ceil((tt.chetDen - nay) / 1000)) : 0
          const khoaHa = chet ? `${keHa}|${giay}` : ''
          if (khoaHa !== haCu) { haCu = khoaHa; setBiHa(chet ? { ai: keHa ? tenCua(keHa) : '', doi: keHa ? doiCua(keHa) : -1, giay, thay: keHa === THAY } : null) }
          chetCu = chet
        }
        if (tt.cap !== capCu) { capCu = tt.cap; setCap(tt.cap) }
        const saoCon = (tt.saoDen ?? 0) > nay ? Math.ceil(((tt.saoDen ?? 0) - nay) / 1000) : 0
        if (saoCon !== saoCu) { saoCu = saoCon; setSao(saoCon) }
        const an = !chet && dangAn(bd, tt, nay)
        if (vui && vui.het <= luc) vui = null
        datBao(chonBao(chet, nghi, matMang, vui, v, an, tt, nay, i.daDung, luc - lucMo, lucBcEm))
      } else {
        if (laThay) {
          // BÉ MA THẦY (máy thầy, xem cả sân): chạm vào sân để chạy tới (cùng «chạm để tới» của em, đổi toạ độ theo khung nhìn cả sân), vuốt để đi; bút đỏ tự bắn
          // đối thủ gần nhất (khung nhìn mặc định quanh Thầy); không nhặt hộp, không biểu cảm, không lên cấp.
          if (van !== tt.van) tt = taoToi(bd, DOI_THAY, nay, 0.37)
          if (i.cham && !dangChet(tt, nay)) tt = { ...tt, duong: timDuong(bd, tt.x, tt.y, cam.x + (i.cham.x - W / 2) / ti, cam.y + (i.cham.y - H / 2) / ti) }
          i.cham = null
          const xCu = tt.x, yCu = tt.y, songTruoc = !dangChet(tt, nay)
          tt = buocToi(bd, tt, { dx: i.cx, dy: i.cy }, dt, nay, 0.37)
          if (songTruoc && dangChet(tt, nay)) { keHa = tt.chayAi; if (tt.chayAi) choA = tt.chayAi }
          if (tt.x !== xCu || tt.y !== yCu) huong = Math.atan2(tt.y - yCu, tt.x - xCu)
          const chet = dangChet(tt, nay)
          if (luc - lucNgam >= 100) { lucNgam = luc; if (bossNay) khacBan.push(bossNay); mucTieu = chet || nghi ? '' : chonMucTieu(bd, tt, khacBan) }
          const goi = taoGoi(tt, nay, chet, mucTieu), khoa = `${goi.p.join()}|${mucTieu}`
          if ((luc - lucGui >= NHIP_GUI_MS && (khoa !== khoaGui || choA)) || luc - lucGui >= NHIP_NHAC_MS) {
            if (choA) { goi.a = choA; choA = '' }
            lucGui = luc; khoaGui = khoa
            kenh.gui('tro', goi)
          }
          if (tt.duong.length) duong = [{ x: tt.x, y: tt.y }, ...tt.duong]
        }
        if (vui && vui.het <= luc) vui = null
        datBao(vui ? { kieu: 'vui', chu: vui.chu } : null)
      }
      // Hết ván: xếp hạng bốn đội (một lần mỗi ván; bảng vàng tới trước thì đã chốt ở người nghe).
      if (nghi !== nghiCu) {
        nghiCu = nghi
        if (nghi && vanKq !== van) chotVan(van)
        else if (!nghi) { setKetQua(null); setVang(null); bvCu = '' }
      }
      if (luc - lucCham >= 500) {
        lucCham = luc
        const chu = chuGio(conLai(nay)), khoa = `${vanHien}|${chu}`
        if (khoa !== gioCu) { gioCu = khoa; setGio({ van: vanHien, con: chu }) }
        if (dsTin.length && dsTin[0].het <= luc) { dsTin = dsTin.filter((t) => t.het > luc); setTin(dsTin) }
        // Thanh máu lớn: Thầy (máy thầy đang điều khiển ⇒ máu tại máy) · Ma Mực (máu tối đa thiếu ⇒ coi máu đầu tiên thấy là tối đa).
        const mThay = laThay ? (dangChet(tt, nay) ? 0 : tt.mau) : tyAnh ? mauThayAnh : null
        const tl: ThanhLon = { thay: mThay === null ? null : Math.ceil(mThay), boss: boss ? { mau: boss.mau, max: Math.max(bossMax, boss.mau), p: bossP } : null }
        const khoaT = `${tl.thay}|${tl.boss ? `${tl.boss.mau}|${tl.boss.max}|${tl.boss.p.join()}` : ''}`
        if (khoaT !== thanhCu) { thanhCu = khoaT; nguonThanh.dat(tl) }
        if (hieu.length) hieu = hieu.filter((e) => luc - e.luc < MUC_MS)
        // Em mới VÀO PHÒNG (danh sách lớp `lop-ds` / `st-ds` có thêm người) ⇒ «<tên> vào <đội>».
        if (dsRef.current !== dsCu) {
          dsCu = dsRef.current
          for (const e of dsCu) if (!daBiet.has(e.sbd)) { daBiet.add(e.sbd); if (e.sbd !== sbd) baoVui(`${tenNgan(e.ten)} vào ${DOI_BPU[kepDoi(e.doi)].ten}`, luc) }
        }
      }
      // ── Dựng danh sách vẽ ──
      let m = 0
      const them = (): NvVe => nvVe[m] ?? (nvVe[m] = { id: '', x: 0, y: 0, mau: 0, doi: 0, cap: 1, goc: 0, ban: false, dx: 0, dy: 0, toi: false, dong: false, mo: 1, ten: '', an: false, hien: -1, song: false, batTu: false, tk: false, khien: false, nhanh: false, gio: NaN, bc: '', thay: false, mac: '', dh: '', cv: false })
      const viTri = (id: string): NhanVat | undefined => (coMa && id === toiId ? { id, x: tt.x, y: tt.y, mau: tt.mau, doi: laThay ? DOI_THAY : doiEm, cap: tt.cap, t: mucTieu } : id === MA_MUC ? bossNay ?? undefined : khac.find((k) => k.id === id))
      for (const k of khac) {
        // Đối thủ ẩn trong bụi: em không thấy (máy thầy thấy hết).
        if (!xem && k.mau > 0 && anVoi(bd, k, tt.x, tt.y, doiEm)) continue
        const o = noi[k.id], mt = k.t ? viTri(k.t) : undefined, e = them()
        if (mt) o.goc = Math.atan2(mt.y - k.y, mt.x - k.x)
        else if (Math.hypot(o.nv.x - o.tx, o.nv.y - o.ty) > 4) o.goc = Math.atan2(o.nv.y - o.ty, o.nv.x - o.tx)
        const tuoi = o.hl ? luc - o.hl : 1e9
        // Bé ma Thầy: vạch máu theo thang 0..100 như mọi người (máu thật 0..2000), không hiệu ứng hiện ra.
        e.thay = k.id === THAY
        e.id = k.id; e.x = k.x; e.y = k.y; e.mau = e.thay ? (k.mau * MAU_DAY) / MAU_THAY : k.mau; e.doi = k.doi; e.cap = k.cap; e.goc = o.goc
        e.ban = !!mt && !nghi && k.mau > 0; e.dx = mt?.x ?? 0; e.dy = mt?.y ?? 0
        e.toi = false; e.dong = !xem && k.doi === doiEm
        // Đứng trong bụi mà vẫn thấy (đồng đội, đang bắn, máy thầy) ⇒ vẽ sau bụi; không bắn thì mờ.
        e.an = k.mau > 0 && trongBui(bd, k.x, k.y)
        e.mo = matMang ? 0.45 : e.an && !k.t ? 0.6 : 1
        e.ten = tenCua(k.id)
        e.hien = tuoi < HIEN_MS && !e.thay ? tuoi / HIEN_MS : -1; e.song = o.hs; e.batTu = !e.thay && tuoi >= HIEN_MS && tuoi < BAT_TU_MS
        // Truy nã · hộp tiếp tế (suy từ `h` + thời gian) · biểu cảm.
        e.tk = k.id === tk; e.khien = k.id === hh.id && hh.khienDen > nay; e.nhanh = k.id === hh.id && hh.nhanhDen > nay
        e.gio = e.nhanh && Math.hypot(o.nv.x - o.tx, o.nv.y - o.ty) > 4 ? Math.atan2(o.nv.y - o.ty, o.nv.x - o.tx) : NaN
        const sb = bc[k.id]; e.bc = sb === undefined ? '' : BIEU_CAM[sb]
        const nd = e.thay || laMay(k.id) ? undefined : nguoiCua(k.id); e.mac = nd?.mac ?? ''; e.dh = nd?.dh ?? ''; e.cv = nd?.cv ?? false
        m++
      }
      if (!xem) {
        const chet = dangChet(tt, nay), mt = mucTieu ? viTri(mucTieu) : undefined, e = them()
        if (mt) huong = Math.atan2(mt.y - tt.y, mt.x - tt.x)
        const tuoi = hienEm ? luc - hienEm : 1e9
        e.id = sbd; e.x = tt.x; e.y = tt.y; e.mau = chet ? 0 : tt.mau; e.doi = doiEm; e.cap = capSung(tt, nay); e.goc = huong
        e.ban = !!mt; e.dx = mt?.x ?? 0; e.dy = mt?.y ?? 0; e.toi = true; e.dong = true
        e.an = !chet && trongBui(bd, tt.x, tt.y); e.mo = !chet && dangAn(bd, tt, nay) ? 0.6 : 1; e.ten = `${tenNgan(toi?.ten ?? '')} (em)`
        e.hien = !chet && tuoi < HIEN_MS ? tuoi / HIEN_MS : -1; e.song = hienSong; e.batTu = !chet && tuoi >= HIEN_MS && nay < tt.batTuDen
        e.tk = tk === sbd; e.khien = coKhien(tt, nay); e.nhanh = dangNhanh(tt, nay)
        e.gio = e.nhanh ? gioEm : NaN
        const sb = bc[sbd]; e.bc = bcEm.het > luc ? bcEm.chu : sb === undefined ? '' : BIEU_CAM[sb]
        e.thay = false
        // Đồ của CHÍNH em: tra theo số báo danh trong danh sách phòng (`toi` của live không mang đồ).
        const nd = nguoiCua(sbd); e.mac = nd?.mac ?? toi?.c ?? ''; e.dh = nd?.dh ?? chuDanhHieu(toi?.dh); e.cv = nd?.cv ?? moGon(toi?.c).dan === 'dan-cau-vong'
        m++
        if (tt.duong.length) duong = [{ x: tt.x, y: tt.y }, ...tt.duong]
      } else if (laThay) {
        // Bé ma Thầy do chính máy thầy mô phỏng (không lấy dòng của phòng — trễ hơn).
        const chet = dangChet(tt, nay), mt = mucTieu ? viTri(mucTieu) : undefined, e = them()
        if (mt) huong = Math.atan2(mt.y - tt.y, mt.x - tt.x)
        e.id = THAY; e.x = tt.x; e.y = tt.y; e.mau = chet ? 0 : (tt.mau * MAU_DAY) / MAU_THAY; e.doi = DOI_THAY; e.cap = tt.cap; e.goc = huong
        e.ban = !!mt && !nghi && !chet; e.dx = mt?.x ?? 0; e.dy = mt?.y ?? 0; e.toi = false; e.dong = false; e.an = false; e.mo = 1; e.ten = 'Thầy'
        e.hien = -1; e.song = false; e.batTu = false; e.tk = false; e.khien = false; e.nhanh = false; e.gio = NaN; e.bc = ''; e.thay = true; e.mac = ''; e.dh = ''; e.cv = false
        m++
      }
      nvVe.length = m
      // Tiếng súng đi cùng nhịp đạn trên màn (cùng công thức nhịp với sinh-ton-ve.ts); chỉ máy em đang chơi mới kêu.
      if (!xem) for (const e of nvVe) {
        if (!e.ban) continue
        const nhip = Math.floor((luc + bamSo(e.id) * 37) / NHIP_BAN_MS[e.cap - 1])
        if (nhipBan.get(e.id) === nhip) continue
        nhipBan.set(e.id, nhip)
        tiengBan(e.cap, e.toi, e.toi ? 1 : Math.max(0, 1 - Math.hypot(e.x - tt.x, e.y - tt.y) / 620))
      }
      if (nhipBan.size > 160) nhipBan.clear()
      const tVe = performance.now()
      hinh.han = tVe - lucMo < 2500 ? tVe + 9 : 0
      // Hộp còn trên sân (dùng lại mảng) + Ma Mực và chân mục tiêu đang bị phun mực.
      const soHopVe = hopSo(nay), dsHopVe = viTriHop(bd)
      let nHop = 0
      if (!nghi) for (let k = 0; k < dsHopVe.length; k++) if (conHop(k, soHopVe)) { const o = hopVe[nHop] ?? (hopVe[nHop] = { x: 0, y: 0, loai: 'mau' }); o.x = dsHopVe[k].x; o.y = dsHopVe[k].y; o.loai = loaiHopO(soHopVe, k); nHop++ }
      hopVe.length = nHop
      if (bossNay) { bossVe.x = bossNay.x; bossVe.y = bossNay.y; const mt = bossNay.t && !nghi ? viTri(bossNay.t) : undefined; bossVe.t = mt ? { x: mt.x, y: mt.y } : null }
      veKhung({ g, W, H, dpr, ti, cx: cam.x, cy: cam.y, bd, bang: bm, hinh, san, ten: bangTen, phang, em: banEm, luc, vong: v, nv: nvVe, hop: hopVe, boss: bossNay ? bossVe : null, nghi, duong, hieu, yeu, o: oSan, ranh: phiVe < 9 })
      phiVe = performance.now() - tVe
      const nho = nhoRef.current, gn = nho?.getContext('2d')
      if (nho && gn && luc - lucNho >= 500) {
        lucNho = luc
        // Bản đồ nhỏ = đồng đội trong ảnh + chấm `dd` + sao thủ khoa.
        veNho(nho, gn, yeu, bd, bm, v, nvVe, doiEm, dd, !tk ? null : !xem && tk === sbd ? tt : khac.find((k) => k.id === tk) ?? null, bossNay)
      }
    }
    // Tab vừa hiện lại ⇒ đo lại từ đầu (khung đầu sau khi ẩn không phản ánh sức máy).
    const chay = () => { if (!rafId && !document.hidden) { lucTruoc = 0; tuHa.datLai(); rafId = requestAnimationFrame(khung) } }
    const dung = () => { if (rafId) cancelAnimationFrame(rafId); rafId = 0 }
    const doiHien = () => { if (document.hidden) dung(); else chay() }

    // ── Bàn phím (máy tính): WASD / mũi tên để đi (sinh-ton-cu-chi.ts). ──
    const { phimXuong, phimLen, buongPhim } = taoBanPhim(vao)

    doKhung()
    const quanSat = typeof ResizeObserver === 'function' ? new ResizeObserver(doKhung) : null
    quanSat?.observe(goc)
    const nenToi = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null
    nenToi?.addEventListener?.('change', doiMau)
    window.addEventListener('resize', doKhung)
    if (!xem) {
      window.addEventListener('keydown', phimXuong)
      window.addEventListener('keyup', phimLen)
      window.addEventListener('blur', buongPhim)
    }
    document.addEventListener('visibilitychange', doiHien)
    chay()
    return () => {
      conSong = false
      oSan?.huy(); oSan = null
      dung(); boNghe(); quanSat?.disconnect(); window.clearTimeout(henDau); window.clearTimeout(henDai)
      // Rời màn khi Thầy đang trong trận ⇒ báo phòng gỡ bé ma Thầy ngay (không đợi 5 giây im).
      if (laThay) kenh.gui('tro', { p: [0, 0, 0, 2], roi: 1 })
      nenToi?.removeEventListener?.('change', doiMau)
      window.removeEventListener('resize', doKhung)
      window.removeEventListener('keydown', phimXuong)
      window.removeEventListener('keyup', phimLen)
      window.removeEventListener('blur', buongPhim)
      document.removeEventListener('visibilitychange', doiHien)
    }
  }, [kenh, sbd, doiToi, mayYeu, xem, banEm]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cử chỉ: VUỐT ở đâu cũng là cần ảo vô hình; CHẠM nhanh một điểm = chạy tới đó (sinh-ton-cu-chi.ts). ──
  const { xuong, di, buong, guiBieuCam } = useCuChi(vao, vaiRef, gocRef, xoay, setBieuCam)

  const tenToi = toi ? DOI_BPU[doiToi].ten : ''
  const bamThay = () => { const v = !thayRef.current; thayRef.current = v; setTrongTran(v) }
  const coVung = !xem || trongTran
  return (
    <div className="gl st" ref={gocRef} style={{ ...MAU_SINH_TON, ...bienDoi(doiToi) } as CSSProperties} data-xem={xem ? '1' : undefined} data-phang={mayYeu ? '1' : undefined} data-em={banEm ? '1' : undefined}>
      <div className="st-rung" ref={rungRef}><canvas className="gl-san" ref={vaiRef} aria-hidden="true" /></div>
      {coVung ? <div className="st-vung" onPointerDown={xuong} onPointerMove={di} onPointerUp={buong} onPointerCancel={buong} onLostPointerCapture={buong} /> : null}
      <BangDiem diem={diem} gio={gio} xem={xem} doiToi={doiToi} />
      <DsTin tin={tin} />
      <ThanhMau nguon={nguonThanh} an={!!ketQua} />
      {dai && !biHa && !ketQua ? <DaiThongBao key={`dai${dai.id}`} dai={dai} /> : truyNa && !biHa && !ketQua ? <DaiTruyNa key={`truy${truyNa.id}`} truyNa={truyNa} /> : null}
      {bao ? <div className="st-bao" data-kieu={bao.kieu} role="status">{bao.chu}</div> : null}
      {xem ? null : <ThanhSung cap={cap} sao={sao} />}
      {xem && thayVao ? <NutThay trong={trongTran} nguon={nguonThanh} bam={bamThay} /> : null}
      {theHop && bang && !biHa && !ketQua ? <TheHop key={`hop${theHop.id}`} bang={bang} loai={theHop.loai} /> : null}
      {bieuCam && !biHa && !ketQua ? <NhanBieuCam bieuCam={bieuCam} chon={guiBieuCam} /> : null}
      {xem ? null : (
        <button type="button" className="st-am" aria-pressed={!tatTieng} aria-label={tatTieng ? 'Bật tiếng trò chơi' : 'Tắt tiếng trò chơi'} onClick={() => { const v = !tatTieng; datTat(v, !imLang); setTatTieng(v); if (!v) moAm() }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" />{tatTieng ? <path d="M16 9.5l5 5m0-5l-5 5" /> : <path d="M15.5 9a4.2 4.2 0 0 1 0 6m2.6-8.6a8 8 0 0 1 0 11.2" />}</svg>
        </button>
      )}
      {xem ? null : <div className="st-bd"><canvas ref={nhoRef} aria-hidden="true" /><span>Bản đồ · vòng an toàn</span></div>}
      {xem ? null : <div className="st-cho"><i />{banEm ? 'Phòng chờ ca · thầy bấm Bắt đầu là vào bài ngay' : `Phòng chờ · ${soEm} em đã vào · chờ thầy bấm Bắt đầu`}</div>}
      {dau && !banEm && !biHa && !ketQua ? <DauHo key={dau.id} dau={dau} /> : null}
      {biHa && !ketQua ? <TheBiHa biHa={biHa} banEm={banEm} tenToi={tenToi} /> : null}
      {ketQua ? <TheCuoiVan ketQua={ketQua} vang={vang} xem={xem} bang={bang} doiToi={doiToi} banEm={banEm} /> : null}
    </div>
  )
}
