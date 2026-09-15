/**
 * THẦN THÚ HOÁ HỌC — vỏ giao diện.
 *
 * Bốn tab: Đảo Thần Thú · Leo Tháp Tri Thức · Săn Câu Sai · Kỷ Lục.
 *
 * Hai luật của game này, cả hai đều do thầy chốt 14-09:
 *  · **EXP chỉ đổi được bằng việc học thật** — leo tháp, sửa câu sai, nộp bài,
 *    thi. Không có nút bấm phát ra EXP.
 *  · **Mười hai hình thái**, cấp sau ngầu hơn cấp trước, không ngoại lệ.
 *
 * Và một luật của kho: chỉ dùng rgb / rgba / token Tailwind, không hex.
 */

import { Fragment, Suspense, lazy, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import {
  Sparkles,
  Trophy,
  Swords,
  Shield,
  Zap,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Clock,
  LogIn,
} from 'lucide-react'
import {
  DANH_SACH_THAN_THU,
  KHOA_LUU_THAN_THU,
  layHoSoThanThuMacDinh,
  vaHoSo,
  tinhLucChienPet,
  tinhHeSoTuongKhac,
  TEN_HE_DAY_DU,
  TEN_HE_NGAN,
  heKhacDuoc,
  heBiKhacBoi,
  type HoSoThanThuLuu,
  type CapTienHoa,
  type ThanThuInfo,
} from '../game/than-thu-hoa-hoc/he-thong-pet'
import { layHinhThai, CAP_TOI_DA } from '../game/than-thu-hoa-hoc/hinh-thai'
import {
  TANG_TOI_DA, heTrumTang as heTrumTangMoi, mauTrumTang as mauTrumTangMoi,
  satThuongTrum, tenTrumTang, saoMucTieuTheoTang, laTangCanh,
} from '../game/than-thu-hoa-hoc/can-bang-thap'
import {
  rutCauChoTang, ghiLichSu, CHU_LY_DO_NOI,
  type CauUngVien, type LyDoNoi,
} from '../game/than-thu-hoa-hoc/rut-cau-thap'
import {
  nhanExp, NGUON_EXP, BANG_NGUON_EXP, SUC_CHUA_ONG,
  DS_NGUON_EXP, TEN_NGUON_EXP, tongSoExp, type NguonKiemExp,
} from '../game/than-thu-hoa-hoc/kinh-nghiem'
import { KHO_CAU_HOI, type CauHoi } from '../game/than-thu-hoa-hoc/kho-cau-hoi'
import {
  doiCauSaiThanhCauChoi, TEN_LY_DO,
  type CauHoiCuaEm, type CauSaiTho, type KetQuaDoiCau,
} from '../game/than-thu-hoa-hoc/cau-hoi-cua-em'
import { veThanThuCanvas, khungVeThanThu } from '../game/than-thu-hoa-hoc/ve-than-thu'
import { hoaGiaiHoSo } from '../game/than-thu-hoa-hoc/dong-bo'
import KhungLoiGiaiGame from './KhungLoiGiaiGame'
import OngNghiemExp from './OngNghiemExp'
import PopupThuongExp, { type TinThuongExp } from './PopupThuongExp'
/**
 * Màn 3D nặng khoảng 600 KB (three.js), nên nhập kiểu `lazy`: chỉ tải khi em
 * thật sự mở Đảo Thần Thú, không nằm trong gói khởi động của cổng học sinh.
 */
const ThanThu3D = lazy(() => import('./ThanThu3D'))
import { AmThanhPet } from '../game/than-thu-hoa-hoc/am-thanh-pet'

interface Props {
  /**
   * KHÔNG NHẬN `auth`. Game không cần biết em là ai: điểm game không được
   * dính vào hồ sơ học tập, và game không cần danh tính để chạy.
   * Chỉ nhận hai danh sách để TÍNH buff và quy đổi EXP; không hiện tên, không
   * hiện số báo danh, không ghi số báo danh vào localStorage.
   */
  dsLichSu: { tong?: number; soCauSai?: number; maCa?: string; id?: string }[]
  dsBtvn: { daNop?: boolean; id?: string }[]
  /** Bài phụ huynh (MOM) đã giao — chỉ đọc `id`, `trangThai`, `diem`. */
  dsMom?: { id?: string; trangThai?: string; diem?: number }[]
  /**
   * Lấy danh sách câu em đã làm SAI, kèm nhãn `chuyenDe` / `mucDo` / `dang`
   * thầy gắn trong kho đề — đúng nguồn mục Khắc Phục Câu Sai đang dùng.
   *
   * Là HÀM GỌI LẠI chứ không phải số báo danh: game vẫn không biết em là ai,
   * cổng học sinh gọi máy chủ rồi đưa kết quả xuống.
   */
  layCauSaiCuaEm?: () => Promise<CauSaiTho[]>
  /**
   * ĐỒNG BỘ THẦN THÚ ĐA THIẾT BỊ. Cổng học sinh cung cấp hai hàm gọi lại; game
   * vẫn không biết số báo danh — cổng biết em là ai và tự gọi máy chủ.
   * Thiếu hai hàm này thì game chạy y như cũ, chỉ lưu trong máy.
   */
  docThanThuMayChu?: () => Promise<unknown>
  ghiThanThuMayChu?: (hoSo: unknown) => Promise<unknown>
  onDong: () => void
  onChuyenSangKhacPhuc: () => void
  onChuyenSangBtvn: () => void
  onChuyenSangVaoThi: () => void
}

type TabGame = 'dao_thu' | 'leo_thap' | 'san_cau_sai' | 'xep_hang'

/** Sổ ghi câu sai đã làm đúng lại — để mỗi câu chỉ trả EXP một lần trong đời. */
const KHOA_QID_THANH_TAY = 'omr_than_thu_qid_thanh_tay'

// Tên hệ dùng chung với bảng tương khắc — một nguồn sự thật, sáu hệ.
const TEN_HE = TEN_HE_DAY_DU

/** Trạng thái thú trong trận: đứng yên · ra đòn · trúng đòn · tung chiêu nộ. */
type HieuUngCombat = 'yen' | 'danh' | 'biDanh' | 'no'

/**
 * Vòng lặp vẽ thần thú — dùng chung cho canvas Đảo Thần Thú và canvas màn đấu.
 *
 * Trước đây chỉ Đảo Thần Thú có canvas, và ba cờ `dangDanh` / `dangBiDanh` /
 * `dangTungNo` luôn truyền `false`: mã vẽ hiệu ứng có sẵn nhưng không ai bật.
 * Cờ đọc từ ref chứ không từ state, để mỗi đòn đánh không dựng lại vòng lặp vẽ.
 */
function useVeThanThu(
  canvasRef: { current: HTMLCanvasElement | null },
  info: ThanThuInfo,
  cap: number,
  hieuUngRef: { current: HieuUngCombat },
  dangHien: boolean,
  /** Góc xoay em vuốt được; đọc từ ref nên xoay không dựng lại vòng lặp. */
  gocRef?: { current: number },
) {
  useEffect(() => {
    if (!dangHien) return
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    let animId = 0
    const moc = performance.now()
    // Tâm và bán kính tính từ hộp bao ĐO THẬT của hình, không phải
    // `min(w,h) * 0,32` như bản trước — bản ấy cắt cụt đuôi và cánh.
    const k = khungVeThanThu(cvs.width, cvs.height)
    const ve = (now: number) => {
      const t = (now - moc) / 1000
      ctx.clearRect(0, 0, cvs.width, cvs.height)
      const hu = hieuUngRef.current
      veThanThuCanvas(
        ctx,
        k.cx,
        k.cy,
        k.banKinh,
        info,
        cap,
        {
          thoiGian: t,
          dangDanh: hu === 'danh',
          dangBiDanh: hu === 'biDanh',
          dangTungNo: hu === 'no',
          gocXoay: gocRef?.current ?? 0,
        },
      )
      animId = requestAnimationFrame(ve)
    }
    animId = requestAnimationFrame(ve)
    return () => cancelAnimationFrame(animId)
  }, [canvasRef, info, cap, hieuUngRef, dangHien, gocRef])
}

export default function ThanThuHoaHocGame({
  dsLichSu,
  dsBtvn,
  dsMom = [],
  layCauSaiCuaEm,
  docThanThuMayChu,
  ghiThanThuMayChu,
  onDong,
  onChuyenSangKhacPhuc,
  onChuyenSangBtvn,
  onChuyenSangVaoThi,
}: Props) {
  const [tabGame, setTabGame] = useState<TabGame>('dao_thu')
  const [hoSo, setHoSo] = useState<HoSoThanThuLuu>(() => {
    try {
      // KHOÁ KHÔNG GẮN SỐ BÁO DANH. Bản trước ghi 'omr_than_thu_..._123456',
      // tức là rắc số báo danh vào localStorage của máy — game không cần biết
      // em là ai, và cùng một máy thì cũng chỉ một em dùng.
      const raw = localStorage.getItem(KHOA_LUU_THAN_THU)
      return vaHoSo(raw === null ? null : JSON.parse(raw))
    } catch {
      return layHoSoThanThuMacDinh()
    }
  })
  const [batAm, setBatAm] = useState(true)
  const amThanhRef = useRef<AmThanhPet | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const canvasCombatRef = useRef<HTMLCanvasElement | null>(null)
  /**
   * 3D bật sẵn; máy nào không dựng được WebGL thì tự rơi về canvas 2D.
   * Nhớ luôn vào máy để lần sau khỏi thử lại và khỏi chớp một nhịp.
   */
  const KHOA_HONG_3D = 'omr_than_thu_khong_3d'
  const [dung3D, setDung3D] = useState(() => {
    try { return localStorage.getItem(KHOA_HONG_3D) !== '1' } catch { return true }
  })
  const bo3D = useCallback(() => {
    try { localStorage.setItem(KHOA_HONG_3D, '1') } catch { /* bỏ qua */ }
    setDung3D(false)
  }, [])
  /** Đổi `lan` là màn 3D bắn chiêu. */
  const [lenhChieu, setLenhChieu] = useState({ lan: 0, no: false })

  /** Góc xoay của thú ở Đảo Thần Thú — em vuốt ngang để quay 360°. */
  const gocXoayRef = useRef(0)
  const keoRef = useRef<{ dangKeo: boolean; xTruoc: number; daKeo: number }>({
    dangKeo: false, xTruoc: 0, daKeo: 0,
  })

  // Khởi tạo audio context
  // Tạo MỘT lần. Trước đây phụ thuộc [batAm] nên mỗi lần bật/tắt loa lại dựng
  // một AudioContext mới, ctx cũ không đóng — rò tài nguyên và phải mở khoá lại.
  useEffect(() => {
    amThanhRef.current = new AmThanhPet()
    return () => { amThanhRef.current = null }
  }, [])
  useEffect(() => { amThanhRef.current?.datBat(batAm) }, [batAm])

  // Lưu hồ sơ thần thú khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(KHOA_LUU_THAN_THU, JSON.stringify(hoSo))
    } catch { /* chế độ ẩn danh: không lưu được thì thôi */ }
  }, [hoSo])

  // Tính toán chỉ số học tập để buff sức mạnh cho Pet
  const chiSoHocTap = useMemo(() => {
    let tongDiem = 0
    let soCaDiem = 0
    for (const ca of dsLichSu) {
      if (typeof ca.tong === 'number' && !Number.isNaN(ca.tong)) {
        tongDiem += ca.tong
        soCaDiem++
      }
    }
    // CHƯA THI CA NÀO THÌ LÀ null, KHÔNG phải 7.0.
    // Bản trước in "Điểm trung bình ca thi: 7.00đ" cho em chưa thi lần nào.
    const diemTb = soCaDiem > 0 ? tongDiem / soCaDiem : null

    let btvnDaNop = 0
    for (const bt of dsBtvn) {
      // `trangThai` là nhánh CHẾT: mục BTVN trong StudentPortalScreen chỉ có
      // `daNop`. Viết theo hình dung chứ không theo dữ liệu thật — bỏ.
      if (bt.daNop) btvnDaNop++
    }
    // Chưa giao bài nào thì tỷ lệ là 0, không phải 80%.
    const tyLeBtvn = dsBtvn.length > 0 ? btvnDaNop / dsBtvn.length : 0

    return { diemTb, tyLeBtvn, btvnDaNop, tongBtvn: dsBtvn.length, soCa: dsLichSu.length }
  }, [dsLichSu, dsBtvn])

  /** Em đã chốt thần thú chưa. Chưa thì game hiện màn chọn, khoá mọi tab. */
  const daChonThu = hoSo.idThanhThuChon !== '' && DANH_SACH_THAN_THU[hoSo.idThanhThuChon] !== undefined
  const infoPet = DANH_SACH_THAN_THU[hoSo.idThanhThuChon] ?? DANH_SACH_THAN_THU['hoa_long']!
  const chiSoPet = useMemo(() => {
    return tinhLucChienPet({
      capDo: hoSo.capDo,
      capTienHoa: hoSo.capDo as CapTienHoa,
      diemTrungBinh: chiSoHocTap.diemTb,
      tyLeBtvn: chiSoHocTap.tyLeBtvn,
      he: infoPet.he,
    })
  }, [hoSo.capDo, hoSo.capTienHoa, chiSoHocTap, infoPet.he])

  // Hiệu ứng thú trong trận. Ghi vào ref chứ không vào state: state thì mỗi đòn
  // đánh lại dựng lại vòng lặp vẽ và đồng hồ hoạt hình giật về 0.
  const hieuUngRef = useRef<HieuUngCombat>('yen')
  const henHieuUngRef = useRef<number | null>(null)
  /** Canvas Đảo Thần Thú không đánh nhau — luôn đứng yên khoe hình thái. */
  const hieuUngYenRef = useRef<HieuUngCombat>('yen')

  const batHieuUng = useCallback((hu: HieuUngCombat, ms: number) => {
    hieuUngRef.current = hu
    if (henHieuUngRef.current !== null) clearTimeout(henHieuUngRef.current)
    henHieuUngRef.current = window.setTimeout(() => {
      hieuUngRef.current = 'yen'
      henHieuUngRef.current = null
    }, ms)
  }, [])

  useEffect(() => () => {
    if (henHieuUngRef.current !== null) clearTimeout(henHieuUngRef.current)
  }, [])

  /**
   * RÓT EXP VÀO ỐNG NGHIỆM — ĐƯỜNG DUY NHẤT vào bể thứ nhất.
   *
   * Mọi việc học đều đổ vào đây, KHÔNG đổ thẳng vào thần thú. Muốn thú lên cấp
   * thì em phải tự bấm nạp — đó là lúc ống vơi đi (thầy chốt 15-09).
   *
   * Ống đầy thì CHẶN và báo, không bao giờ vứt EXP em đã kiếm được.
   */
  const [ongDayKhongNhan, setOngDayKhongNhan] = useState(0)
  const [tinThuong, setTinThuong] = useState<TinThuongExp | null>(null)
  const demLanThuong = useRef(0)

  const themVaoKho = useCallback((them: number, nguon: NguonKiemExp, viec: string) => {
    if (them <= 0) return
    amThanhRef.current?.moKhoa()
    let daNhan = 0
    setHoSo((prev) => {
      const conCho = Math.max(0, SUC_CHUA_ONG - prev.khoExp)
      const nhan = Math.min(them, conCho)
      if (nhan < them) setOngDayKhongNhan(them - nhan)
      if (nhan <= 0) return prev
      daNhan = nhan
      // Sổ ghi ĐÚNG phần rót được, không ghi phần ống không chứa nổi —
      // nếu không tổng sổ sẽ vênh với tổng EXP thật.
      return {
        ...prev,
        khoExp: prev.khoExp + nhan,
        soExp: { ...prev.soExp, [nguon]: (prev.soExp[nguon] ?? 0) + nhan },
      }
    })
    if (daNhan > 0) {
      demLanThuong.current += 1
      setTinThuong({ exp: daNhan, nguon, viec, lan: demLanThuong.current })
      amThanhRef.current?.thangTran()
    }
    setViecVuaLam(viec + ' · +' + them + ' EXP vào ống')
  }, [])

  /**
   * NẠP TINH LỰC — rót từ ống sang thần thú. Ống vơi đúng bằng phần đã rót.
   *
   * Hàm này KHÔNG sinh EXP. Nó là chỗ duy nhất đổ vào bể thứ hai, và nó chỉ
   * lấy từ bể thứ nhất ra.
   */
  const [dangNap, setDangNap] = useState(false)
  const napVaoThu = useCallback(() => {
    amThanhRef.current?.moKhoa()
    setHoSo((prev) => {
      const rot = prev.khoExp
      if (rot <= 0) return prev
      const kq = nhanExp({ capDo: prev.capDo, exp: prev.exp }, rot)
      if (kq.soCapLen > 0) {
        amThanhRef.current?.tienHoa()
        setTinTienHoa({ cap: kq.capDo, ten: layHinhThai(kq.capDo).ten })
      } else {
        amThanhRef.current?.kichNo()
      }
      setViecVuaLam(`Đã nạp ${rot} EXP từ ống vào thần thú`)
      return {
        ...prev,
        capDo: kq.capDo,
        capTienHoa: kq.capTienHoa,
        exp: kq.exp,
        expToiDa: kq.expToiDa,
        khoExp: 0,
        danhHieuHienTai: `${layHinhThai(kq.capDo).ten} · Lv.${kq.capDo}`,
      }
    })
    // Hoạt ảnh ống vơi: chỉ là cờ cho CSS, không đụng gì tới số liệu.
    setDangNap(true)
    window.setTimeout(() => setDangNap(false), 850)
  }, [])

  useEffect(() => {
    if (ongDayKhongNhan <= 0) return
    const h = setTimeout(() => setOngDayKhongNhan(0), 6000)
    return () => clearTimeout(h)
  }, [ongDayKhongNhan])

  const [tinTienHoa, setTinTienHoa] = useState<{ cap: number; ten: string } | null>(null)
  const [viecVuaLam, setViecVuaLam] = useState('')
  useEffect(() => {
    if (viecVuaLam === '') return
    const h = setTimeout(() => setViecVuaLam(''), 2600)
    return () => clearTimeout(h)
  }, [viecVuaLam])
  useEffect(() => {
    if (tinTienHoa === null) return
    const h = setTimeout(() => setTinTienHoa(null), 3200)
    return () => clearTimeout(h)
  }, [tinTienHoa])

  /**
   * KHO CÂU CỦA CHÍNH EM.
   *
   * Thầy chốt 15-09: câu hỏi trong game phải nằm trong phần em đã học. Máy chủ
   * không có trường "chuyên đề đã học", nhưng TỪNG CÂU em làm sai thì có nhãn
   * `chuyenDe` / `mucDo` / `dang` thầy gắn sẵn trong kho đề. Nên game hỏi
   * thẳng bằng chính những câu ấy — sát hơn mọi cách suy đoán chuyên đề.
   *
   * Nạp một lần, khi em bước vào phần cần dùng, không nạp lúc mở game.
   */
  const [dsCauCuaEm, setDsCauCuaEm] = useState<CauHoiCuaEm[]>([])
  const [tinhTrangKho, setTinhTrangKho] = useState<'chua' | 'dangTai' | 'xong' | 'loi'>('chua')
  const [tomTatKho, setTomTatKho] = useState<KetQuaDoiCau | null>(null)
  const [loiKho, setLoiKho] = useState('')

  /**
   * CHỐT "ĐÃ NẠP" BẰNG REF, KHÔNG BẰNG STATE.
   *
   * Bản đầu để `tinhTrangKho` trong danh sách phụ thuộc: `setTinhTrangKho('dangTai')`
   * làm effect chạy lại, React dọn lượt cũ, `huy = true` — và lời hứa vừa gửi
   * đi bị vứt kết quả ngay khi nó về. Màn hình đứng mãi ở "đang tải", không ai
   * thấy lỗi ở đâu. Phép kiểm `than-thu-man-dau` bắt đúng chỗ này.
   */
  const daNapKhoRef = useRef(false)
  const conGanRef = useRef(true)
  // Phải bật lại khi GẮN, không chỉ tắt khi rời. StrictMode dựng → dọn → dựng
  // lại trên CÙNG một thể hiện, nên ref sống qua lượt dọn: bản cũ chỉ tắt mà
  // không bật lại, thế là từ lượt gắn thứ hai trở đi MỌI kết quả mạng về đều bị
  // vứt lặng lẽ, màn hình treo ở "đang tải" mà không ai thấy lỗi.
  useEffect(() => {
    conGanRef.current = true
    return () => { conGanRef.current = false }
  }, [])

  useEffect(() => {
    if (tabGame !== 'leo_thap' && tabGame !== 'san_cau_sai') return
    if (daNapKhoRef.current) return
    daNapKhoRef.current = true
    if (!layCauSaiCuaEm) { setTinhTrangKho('xong'); return }
    setTinhTrangKho('dangTai')
    layCauSaiCuaEm()
      .then((tho) => {
        if (!conGanRef.current) return
        const kq = doiCauSaiThanhCauChoi(tho)
        setDsCauCuaEm(kq.dsCau)
        setTomTatKho(kq)
        setTinhTrangKho('xong')
      })
      .catch((e: unknown) => {
        if (!conGanRef.current) return
        setLoiKho(e instanceof Error ? e.message : 'Không tải được câu sai của em')
        setTinhTrangKho('loi')
      })
  }, [tabGame, layCauSaiCuaEm])

  /**
   * ĐỒNG BỘ VỚI MÁY CHỦ.
   *
   * Thầy bắt được 15-09: "trên điện thoại vẫn là trứng, trên web thì là có sừng".
   *
   * Mở game: đọc bản máy chủ, hoà giải với bản trong máy (theo TỔNG EXP, không
   * theo đồng hồ — xem `dong-bo.ts`), lấy bản trộn làm chuẩn.
   * Sau đó: mỗi lần hồ sơ đổi thì đẩy lên, có chờ 2,5 giây gộp lại — em bấm
   * liên tục lúc leo tháp, đẩy từng nhịp là phá 3G của em.
   */
  const [tinhTrangDongBo, setTinhTrangDongBo] = useState<'chua' | 'dangTai' | 'xong' | 'loi' | 'khongCo'>('chua')
  /** Lý do hỏng, NGUYÊN VĂN từ tầng gọi mạng. Nuốt lý do là tự bịt mắt mình. */
  const [lyDoDongBo, setLyDoDongBo] = useState('')
  const [lucDongBo, setLucDongBo] = useState('')
  /** Đã hỏi xong máy chủ LẦN ĐẦU chưa. Tách hẳn khỏi `tinhTrangDongBo`: từ
   *  15-09 máy tự đồng bộ lại nhiều lần, mỗi lần lại kéo trạng thái về
   *  'dangTai'; nếu màn chọn thú vẫn nhìn vào đó thì cứ vài chục giây nó lại
   *  chớp về màn chờ. */
  const [daHoiLanDau, setDaHoiLanDau] = useState(false)
  /** Chặn hai vòng đồng bộ chồng lên nhau — ba mồi tự động có thể nổ cùng lúc. */
  const dangDongBoRef = useRef(false)
  const daNuotRef = useRef(false)
  /** Gương của `hoSo` để hàm đồng bộ tay đọc được bản mới nhất mà không phụ
   *  thuộc vào lượt dựng lại của React. */
  const hoSoRef = useRef(hoSo)
  useEffect(() => { hoSoRef.current = hoSo }, [hoSo])

  useEffect(() => {
    if (daNuotRef.current) return
    daNuotRef.current = true
    if (!docThanThuMayChu) { setTinhTrangDongBo('khongCo'); setDaHoiLanDau(true); return }
    setTinhTrangDongBo('dangTai')
    docThanThuMayChu()
      .then((tho) => {
        if (!conGanRef.current) return
        setHoSo((prev) => hoaGiaiHoSo(prev, tho).hoSo)
        setTinhTrangDongBo('xong')
        setLucDongBo(new Date().toLocaleTimeString('vi-VN'))
      })
      .catch((e) => {
        if (!conGanRef.current) return
        setTinhTrangDongBo('loi')
        setLyDoDongBo(e instanceof Error ? e.message : 'Không rõ lý do')
      })
      .finally(() => {
        if (conGanRef.current) setDaHoiLanDau(true)
      })
  }, [docThanThuMayChu])

  /**
   * MỘT VÒNG ĐỒNG BỘ TRỌN VẸN: kéo bản máy chủ về → trộn → đẩy ngược lên →
   * nuốt lại bản máy chủ trả về.
   *
   * Thầy chốt 15-09: *"bỏ nút đồng bộ để tự đồng bộ"*. Trước đây vòng này chỉ
   * chạy khi em BẤM NÚT, còn đường tự động thì mỏng: đọc một lần lúc mở game
   * rồi chỉ đẩy lên sau mỗi lần hồ sơ đổi. Hệ quả là em mở app trên máy này
   * trong khi máy kia vừa ăn EXP thì máy này KHÔNG BAO GIỜ biết, trừ khi tự
   * bấm. Nay không còn nút — vòng này do máy tự gọi, xem ba mồi ở dưới.
   */
  const dongBoNgay = useCallback(async () => {
    if (!docThanThuMayChu || !ghiThanThuMayChu) {
      setTinhTrangDongBo('khongCo')
      setLyDoDongBo('Màn này chưa nối máy chủ')
      return
    }
    // Ba mồi có thể nổ sát nhau (hiện tab + đúng nhịp hẹn giờ). Chạy chồng thì
    // hai vòng cùng đọc–ghi một hồ sơ, bản sau đè bản trước.
    if (dangDongBoRef.current) return
    dangDongBoRef.current = true
    setTinhTrangDongBo('dangTai')
    setLyDoDongBo('')
    try {
      const tho = await docThanThuMayChu()
      const kq = hoaGiaiHoSo(hoSoRef.current, tho)
      hoSoRef.current = kq.hoSo
      if (conGanRef.current) setHoSo(kq.hoSo)
      const tra = (await ghiThanThuMayChu(kq.hoSo)) as
        { ok?: boolean; daGhi?: boolean; hoSo?: unknown; error?: string } | null
      if (tra !== null && tra.ok === false) throw new Error(tra.error || 'Máy chủ từ chối ghi')
      // Máy chủ trả bản đã trộn (ghi được hay bị từ chối đều có) — nuốt lại
      // cho hai bên bằng nhau ngay.
      if (tra !== null && tra.hoSo !== undefined && tra.hoSo !== null) {
        const k2 = hoaGiaiHoSo(kq.hoSo, tra.hoSo)
        hoSoRef.current = k2.hoSo
        if (conGanRef.current) setHoSo(k2.hoSo)
      }
      if (conGanRef.current) {
        setTinhTrangDongBo('xong')
        setLucDongBo(new Date().toLocaleTimeString('vi-VN'))
      }
    } catch (e) {
      if (conGanRef.current) {
        setTinhTrangDongBo('loi')
        setLyDoDongBo(e instanceof Error ? e.message : 'Không rõ lý do')
      }
    } finally {
      dangDongBoRef.current = false
    }
  }, [docThanThuMayChu, ghiThanThuMayChu])

  /**
   * BA MỒI TỰ ĐỒNG BỘ — thay cho cái nút vừa bỏ.
   *
   *  1. QUAY LẠI TAB. Đây là mồi quan trọng nhất: em học trên máy tính rồi
   *     cầm điện thoại lên, vừa mở ra là kéo bản mới nhất về ngay.
   *  2. CÓ MẠNG LẠI. Mất sóng giữa chừng thì lần có sóng đầu tiên chạy bù.
   *  3. NHỊP 45 GIÂY khi tab đang hiện. Hai máy mở song song vẫn đuổi kịp
   *     nhau; tab ẩn thì không chạy, không phá 3G của em.
   */
  const henGhiRef = useRef<number | null>(null)
  const dongBoNgayRef = useRef(dongBoNgay)
  useEffect(() => { dongBoNgayRef.current = dongBoNgay }, [dongBoNgay])

  useEffect(() => {
    if (!docThanThuMayChu || !ghiThanThuMayChu) return
    const chay = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      void dongBoNgayRef.current()
    }
    const doiTab = () => {
      if (document.visibilityState === 'visible') { chay(); return }
      // RỜI TAB: đẩy nốt phần đang chờ. Lượt đẩy thường hẹn 2,5 giây cho đỡ
      // phá 3G; em ăn EXP xong tắt máy ngay trong 2,5 giây ấy là mất trắng
      // lượt đẩy — đúng cảnh "máy tính có, điện thoại không".
      if (henGhiRef.current !== null) {
        window.clearTimeout(henGhiRef.current)
        henGhiRef.current = null
      }
      void ghiThanThuMayChu(hoSoRef.current).catch(() => { /* lát nữa đẩy bù */ })
    }
    const nhip = window.setInterval(chay, 45_000)
    document.addEventListener('visibilitychange', doiTab)
    window.addEventListener('pagehide', doiTab)
    window.addEventListener('online', chay)
    return () => {
      window.clearInterval(nhip)
      document.removeEventListener('visibilitychange', doiTab)
      window.removeEventListener('pagehide', doiTab)
      window.removeEventListener('online', chay)
    }
  }, [docThanThuMayChu, ghiThanThuMayChu])

  useEffect(() => {
    // Chưa nuốt xong bản máy chủ thì CHƯA ĐƯỢC ĐẨY — đẩy lúc này là lấy bản
    // trong máy đè lên bản máy chủ, đúng cái lỗi đang đi sửa.
    if (!ghiThanThuMayChu || tinhTrangDongBo === 'chua' || tinhTrangDongBo === 'dangTai') return
    if (henGhiRef.current !== null) clearTimeout(henGhiRef.current)
    henGhiRef.current = window.setTimeout(() => {
      henGhiRef.current = null
      void ghiThanThuMayChu(hoSo)
        .then((tra) => {
          // Máy chủ TRỘN hai bản rồi trả bản trộn về — kể cả khi ghi thành
          // công. Nuốt lại là hai bên bằng nhau ngay trong một vòng, không
          // phải đợi lần mở game sau.
          const o = tra as { hoSo?: unknown } | null
          if (o !== null && o.hoSo !== undefined && o.hoSo !== null && conGanRef.current) {
            setHoSo((prev) => hoaGiaiHoSo(prev, o.hoSo).hoSo)
          }
        })
        .then(() => {
          if (conGanRef.current) setLucDongBo(new Date().toLocaleTimeString('vi-VN'))
        })
        .catch((e) => {
          // Mất mạng thì lần sau đẩy tiếp — nhưng PHẢI hiện ra, đừng nuốt.
          if (conGanRef.current) {
            setTinhTrangDongBo('loi')
            setLyDoDongBo(e instanceof Error ? e.message : 'Không đẩy được lên máy chủ')
          }
        })
    }, 2500)
    return () => {
      if (henGhiRef.current !== null) { clearTimeout(henGhiRef.current); henGhiRef.current = null }
    }
  }, [hoSo, ghiThanThuMayChu, tinhTrangDongBo])

  /**
   * ĐANG HỎI MÁY CHỦ XEM EM ĐÃ CHỌN THẦN THÚ CHƯA.
   *
   * Thầy bắt được 15-09 qua ảnh chụp máy em: màn "Chọn thần thú đồng hành"
   * hiện ra NGAY, trước khi máy chủ kịp trả lời. Mà màn ấy ghi rõ "chọn một
   * lần duy nhất và không đổi được" — em bấm trong một hai giây chờ ấy là chốt
   * nhầm một con thứ hai, trong khi con thật đang nằm ở máy kia.
   *
   * Nên: còn đang hỏi thì KHÔNG bày nút chọn ra. Hỏi xong (hoặc hỏi hỏng) mới
   * bày — hỏng thì bày kèm lời cảnh báo, chứ không khoá em lại vĩnh viễn khi
   * mất mạng.
   */
  const dangHoiMayChu = docThanThuMayChu !== undefined && !daHoiLanDau

  /**
   * THANH ĐỒNG BỘ — chỉ còn là một dòng TRẠNG THÁI, không còn nút.
   *
   * Thầy chốt 15-09: *"bỏ nút đồng bộ để tự đồng bộ"*. Nút cũ là dấu hiệu máy
   * chưa làm tròn việc: bắt em tự nhớ bấm thì kiểu gì cũng có em quên, mà
   * chính em lại là người không biết hai máy đang lệch nhau. Nay máy tự chạy
   * (ba mồi ở trên), thanh này chỉ nói ra nó đang ở đâu.
   */
  const thanhDongBo = (
    <div className="relative w-full z-10 mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/70 px-3 py-2 text-left backdrop-blur-sm">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          tinhTrangDongBo === 'xong' ? 'bg-emerald-500'
            : tinhTrangDongBo === 'dangTai' ? 'bg-amber-400 animate-pulse'
            : tinhTrangDongBo === 'loi' ? 'bg-rose-500'
            : 'bg-slate-400'
        }`}
      />
      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
        {tinhTrangDongBo === 'xong' ? 'Đã đồng bộ với máy chủ'
          : tinhTrangDongBo === 'dangTai' ? 'Đang đồng bộ…'
          : tinhTrangDongBo === 'loi' ? 'Chưa đồng bộ được'
          : tinhTrangDongBo === 'khongCo' ? 'Màn này chạy một mình, không nối máy chủ'
          : 'Chưa đồng bộ lần nào'}
        {lucDongBo !== '' && tinhTrangDongBo === 'xong' ? ` · ${lucDongBo}` : ''}
      </span>
      {lyDoDongBo !== '' && (
        <span className="text-[11px] text-rose-600 dark:text-rose-400 basis-full sm:basis-auto">
          {lyDoDongBo}
        </span>
      )}
      <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">
        {tinhTrangDongBo === 'khongCo' ? '' : 'Máy tự đồng bộ'}
      </span>
    </div>
  )

  /** Câu của em đang dùng được hay đang phải mượn kho chung. */
  const dungKhoCuaEm = dsCauCuaEm.length > 0

  /**
   * SĂN CÂU SAI — PHẢI LÀM ĐÚNG MỚI CÓ EXP.
   *
   * Bản trước là một nút tự khai: bấm "Quy đổi câu đã sửa" là ăn 100 EXP mỗi
   * câu, không ai kiểm em có sửa thật hay không. Thầy bắt đúng chỗ ấy 15-09.
   *
   * Nay muốn lấy EXP của một câu thì phải TRẢ LỜI ĐÚNG chính câu đó, và mỗi
   * `qid` chỉ trả một lần trong đời — ghi vào máy để bấm lại không ăn thêm.
   * Trả lời sai thì hiện lời giải và không cộng gì; câu vẫn nằm đó chờ làm lại.
   */
  const [qidDaThanhTay, setQidDaThanhTay] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(KHOA_QID_THANH_TAY)
      const v: unknown = raw === null ? null : JSON.parse(raw)
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
    } catch { return [] }
  })
  const [cauSanHienTai, setCauSanHienTai] = useState<CauHoiCuaEm | null>(null)
  /** Đã trả lời chưa, và chọn ý nào — lời giải dựng từ `cauSanHienTai`, không nhét chuỗi vào đây. */
  const [ketQuaSan, setKetQuaSan] = useState<{ dung: boolean; daChon: number } | null>(null)

  useEffect(() => {
    try { localStorage.setItem(KHOA_QID_THANH_TAY, JSON.stringify(qidDaThanhTay)) }
    catch { /* chế độ ẩn danh: không lưu được thì thôi */ }
  }, [qidDaThanhTay])

  /** Quái chưa hạ = câu em làm sai mà chưa trả lời đúng lại lần nào. */
  const dsQuaiConLai = useMemo(
    () => dsCauCuaEm.filter((c) => !qidDaThanhTay.includes(c.qid)),
    [dsCauCuaEm, qidDaThanhTay],
  )

  const goiQuaiTiepTheo = useCallback(() => {
    amThanhRef.current?.moKhoa()
    setKetQuaSan(null)
    const q = dsQuaiConLai[Math.floor(Math.random() * dsQuaiConLai.length)] ?? null
    if (q) amThanhRef.current?.tanCong()
    setCauSanHienTai(q)
  }, [dsQuaiConLai])

  const traLoiQuai = useCallback((idx: number) => {
    const q = cauSanHienTai
    if (!q || ketQuaSan !== null) return
    if (idx === q.dung) {
      amThanhRef.current?.dungCauHoi()
      amThanhRef.current?.thangTran()
      setKetQuaSan({ dung: true, daChon: idx })
      // Chốt EXP theo qid: đã trả rồi thì thôi, dù em bấm lại bao nhiêu lần.
      setQidDaThanhTay((truoc) => {
        if (truoc.includes(q.qid)) return truoc
        const sau = [...truoc, q.qid]
        setHoSo((h) => ({ ...h, soCauDaThanhTay: sau.length }))
        themVaoKho(NGUON_EXP.suaCauSai(), 'sanBoss', `Hạ quái câu sai: ${q.tenDang || q.chuyenDe}`)
        return sau
      })
    } else {
      amThanhRef.current?.saiCauHoi()
      amThanhRef.current?.trungDon()
      setKetQuaSan({ dung: false, daChon: idx })
    }
  }, [cauSanHienTai, ketQuaSan, themVaoKho])

  /**
   * EXP TỪ VIỆC HỌC ĐÃ CÓ SẴN — nhận một lần, không nhận lại.
   *
   * Đây là thứ thay cho nút "Nạp Tinh Thể Não Lực (+35 EXP)" cũ: nút đó cho EXP
   * không cần làm gì, biến trục tiến bộ của game thành trò bấm nút.
   */
  const KHOA_DA_NHAN = 'omr_than_thu_da_nhan_exp'
  const nhanExpTuHocTap = useCallback(() => {
    let daNhan: Record<string, boolean> = {}
    try {
      const raw = localStorage.getItem(KHOA_DA_NHAN)
      if (raw) daNhan = JSON.parse(raw) as Record<string, boolean>
    } catch { /* hỏng thì coi như chưa nhận gì */ }

    // CHỖ TRỐNG TRONG ỐNG QUYẾT ĐỊNH RÓT ĐƯỢC BAO NHIÊU.
    //
    // Bản đầu đánh dấu "đã nhận" cho MỌI ca rồi mới rót; ống đầy thì phần dư
    // bay mất vĩnh viễn vì ca đã bị đánh dấu. Nay duyệt tới đâu đánh dấu tới
    // đó, hết chỗ thì DỪNG và giữ nguyên các ca chưa rót cho lần sau.
    const conCho = Math.max(0, SUC_CHUA_ONG - hoSo.khoExp)
    if (conCho <= 0) {
      setViecVuaLam('Ống đã đầy — nạp cho thần thú trước rồi rót tiếp')
      return
    }

    // Duyệt theo TỪNG NGUỒN để sổ nhật ký ghi đúng chỗ. Ba nguồn quy đổi được
    // từ dữ liệu có sẵn: ca thi, bài tập về nhà, bài MOM.
    let tong = 0
    let conCho2 = conCho
    let conViec = 0
    const ghi: Record<string, boolean> = {}
    const gom: { nguon: NguonKiemExp; exp: number; so: number }[] = [
      { nguon: 'caThi', exp: 0, so: 0 },
      { nguon: 'btvn', exp: 0, so: 0 },
      { nguon: 'mom', exp: 0, so: 0 },
    ]
    const cong = (i: number, khoa: string, them: number) => {
      if (daNhan[khoa] || ghi[khoa]) return
      if (them > conCho2) { conViec++; return }
      ghi[khoa] = true
      conCho2 -= them
      tong += them
      gom[i]!.exp += them
      gom[i]!.so += 1
    }

    for (const ca of dsLichSu) {
      const ma = String((ca as { maCa?: string; id?: string }).maCa ?? (ca as { id?: string }).id ?? '')
      if (ma === '') continue
      if (typeof ca.tong !== 'number' || Number.isNaN(ca.tong)) continue
      cong(0, 'ca_' + ma, NGUON_EXP.caThi(ca.tong))
    }
    for (const bt of dsBtvn) {
      if (!bt.daNop) continue
      const ma = String((bt as { id?: string }).id ?? '')
      if (ma === '') continue
      cong(1, 'bt_' + ma, NGUON_EXP.nopBtvn())
    }
    for (const m of dsMom) {
      if (m.trangThai !== 'da_nop') continue
      const ma = String(m.id ?? '')
      if (ma === '') continue
      const d = typeof m.diem === 'number' && Number.isFinite(m.diem) ? m.diem : 0
      cong(2, 'mom_' + ma, NGUON_EXP.nopMom(d))
    }

    if (tong <= 0) {
      setViecVuaLam(
        conViec > 0
          ? 'Ống không còn chỗ cho việc học tiếp theo — nạp cho thần thú trước'
          : 'Chưa có việc học nào mới để quy đổi',
      )
      return
    }

    // Chỉ ghi "đã nhận" cho đúng những thứ VỪA rót được.
    for (const k of Object.keys(ghi)) daNhan[k] = true
    try { localStorage.setItem(KHOA_DA_NHAN, JSON.stringify(daNhan)) } catch { /* bỏ qua */ }

    setOngDayKhongNhan(0)
    const TEN_VIEC: Record<NguonKiemExp, string> = {
      caThi: 'ca thi', btvn: 'bài tập', mom: 'bài MOM', leoThap: 'tầng tháp', sanBoss: 'quái câu sai',
    }
    for (const g of gom) {
      if (g.exp > 0) themVaoKho(g.exp, g.nguon, `${g.so} ${TEN_VIEC[g.nguon]}`)
    }
    if (conViec > 0) {
      setViecVuaLam(`Đã rót ${tong} EXP. Còn ${conViec} việc học chờ ống có chỗ — chưa mất đâu.`)
    }
  }, [dsLichSu, dsBtvn, dsMom, themVaoKho, hoSo.khoExp])

  /**
   * VUỐT NGANG ĐỂ XOAY 360°, CHẠM ĐỂ NGHE TIẾNG KÊU.
   *
   * Góc ghi vào ref chứ không vào state: vẽ lại 60 lần mỗi giây mà đi qua state
   * thì React dựng lại cây giao diện 60 lần — giật ngay trên điện thoại.
   *
   * Phân biệt chạm và kéo bằng quãng đường: dưới 6 điểm ảnh coi là chạm.
   */
  const batDauKeo = useCallback((x: number) => {
    keoRef.current = { dangKeo: true, xTruoc: x, daKeo: 0 }
  }, [])

  const dangKeoToi = useCallback((x: number) => {
    const k = keoRef.current
    if (!k.dangKeo) return
    const dx = x - k.xTruoc
    k.xTruoc = x
    k.daKeo += Math.abs(dx)
    // 220 điểm ảnh ngang ≈ một vòng tròn đầy.
    gocXoayRef.current = (gocXoayRef.current + (dx / 220) * Math.PI * 2) % (Math.PI * 2)
  }, [])

  /** Chạm vào thú trên màn 3D — dùng lại đúng đường của bản 2D. */
  const chamThu3D = useCallback(() => {
    amThanhRef.current?.moKhoa()
    amThanhRef.current?.keu(infoPet.he)
    batHieuUng('danh', 420)
  }, [infoPet.he, batHieuUng])

  const ketThucKeo = useCallback(() => {
    const k = keoRef.current
    k.dangKeo = false
    if (k.daKeo < 6) {
      // Chạm, không phải kéo: thú kêu.
      amThanhRef.current?.moKhoa()
      amThanhRef.current?.keu(infoPet.he)
      batHieuUng('danh', 420)
    }
    k.daKeo = 0
  }, [infoPet.he, batHieuUng])

  /** Bấm nút chiêu: thú tung chiêu thật, kèm âm. */
  const tungChieu = useCallback((no: boolean) => {
    amThanhRef.current?.moKhoa()
    setLenhChieu((t) => ({ lan: t.lan + 1, no }))
    if (no) {
      amThanhRef.current?.kichNo()
      amThanhRef.current?.keu(infoPet.he)
      batHieuUng('no', 1200)
    } else {
      amThanhRef.current?.tanCong()
      batHieuUng('danh', 600)
    }
  }, [infoPet.he, batHieuUng])

  /**
   * CHỐT THẦN THÚ — MỘT LẦN, KHÔNG ĐỔI.
   *
   * Thầy chốt 15-09. Trước đây là nút đổi tự do, nên vòng tương khắc thành vô
   * nghĩa: gặp trùm hệ nào thì đổi sang hệ khắc hệ ấy rồi đánh. Nay chọn xong
   * là gắn bó — em phải học cách đánh bằng đúng con mình chọn, kể cả khi bị khắc.
   */
  const chonThanThu = useCallback((id: string) => {
    if (DANH_SACH_THAN_THU[id] === undefined) return
    setHoSo((prev) => {
      if (prev.idThanhThuChon !== '') return prev   // đã chốt thì thôi
      return { ...prev, idThanhThuChon: id, ngayChonThu: new Date().toISOString() }
    })
    amThanhRef.current?.moKhoa()
    amThanhRef.current?.tanCong()
  }, [])

  // State cho mini-game LEO THÁP TRI THỨC
  const [dangLeoThap, setDangLeoThap] = useState(false)
  const [tangHienTai, setTangHienTai] = useState(1)
  const [mauBoss, setMauBoss] = useState(100)
  const [mauPetCombat, setMauPetCombat] = useState(100)
  const [mauBossToiDa, setMauBossToiDa] = useState(100)
  /** Khoá câu đang hỏi: `qid` thật khi là câu của em, `kho_<i>` khi mượn kho chung. */
  const [khoaCauHienTai, setKhoaCauHienTai] = useState('')
  const [daHoiCau, setDaHoiCau] = useState<string[]>([])
  /**
   * KẾT QUẢ CÂU VỪA LÀM — màn hình dừng ở đây cho em ĐỌC LỜI GIẢI.
   *
   * Bản trước tự nhảy sang câu kế sau 1,2–1,8 giây. Thầy chốt 15-09: mỗi câu
   * phải có nút bấm để em dừng lại đọc. Một giây tám không đủ đọc hết một dòng,
   * nói gì tới lý do bốn phương án — tức là phần học bị nuốt mất.
   *
   * `null` = đang làm bài, đồng hồ chạy. Khác `null` = đang đọc lời giải, đồng
   * hồ dừng, chờ em bấm.
   */
  const [ketQuaCauVua, setKetQuaCauVua] = useState<{
    dung: boolean
    daChon: number
    cau: CauHoi
    /** Trùm vừa gục: nút sẽ là "Lên tầng N". */
    haTrum: boolean
    tangKeTiep: number
    /** Thú hết máu: hết lượt leo. */
    thua: boolean
  } | null>(null)
  const [thongBaoChienDau, setThongBaoChienDau] = useState('')
  const [cauHoiHienTai, setCauHoiHienTai] = useState<CauHoi | null>(null)
  const [thoiGianConLaiCau, setThoiGianConLaiCau] = useState(15)

  /**
   * HỆ TRÙM và MÁU TRÙM nay nằm trong `can-bang-thap.ts`.
   *
   * Hai hàm cũ ở đây có hai lỗi: hệ trùm chỉ chạy BỐN hệ nên trùm Điện hoá và
   * Hữu cơ chưa từng xuất hiện lần nào; và máu trùm là đường thẳng
   * `100 + 18×tầng`, kéo lên 999 tầng thì từ tầng ~25 trở đi một câu đúng là
   * hạ trùm. Xem phần đo trong `can-bang-thap.ts`.
   */
  const heTrumTang = heTrumTangMoi
  const mauTrumTang = mauTrumTangMoi

  /** Vì sao lượt rút câu vừa rồi phải nới lỏng — hiện thẳng lên màn cho em biết. */
  const [lyDoNoiCau, setLyDoNoiCau] = useState<LyDoNoi[]>([])

  const batDauLeoThap = () => {
    amThanhRef.current?.moKhoa()
    amThanhRef.current?.tanCong()
    const tang = hoSo.tangThapCaoNhat
    setDangLeoThap(true)
    setTangHienTai(tang)
    setMauBoss(mauTrumTang(tang))
    setMauBossToiDa(mauTrumTang(tang))
    setMauPetCombat(chiSoPet.mau)
    setDaHoiCau([])
    const tkMo = tinhHeSoTuongKhac(infoPet.he, heTrumTang(tang))
    setThongBaoChienDau(`Tầng ${tang} — ${tenTrumTang(tang)}. ${tkMo.thongDiep}`)
    raCauHoiMoi([], tang)
  }

  /**
   * RÚT CÂU CHO TẦNG N — theo SAO, có sổ chống lặp sống qua mọi lượt.
   *
   * Thầy chốt 15-09: *"khó là những câu 2 sao... 2 sao khó nhất, xong đến 1
   * sao, rồi 0 sao"*, và *"số câu chơi ở các tầng lặp lại nhiều"*.
   *
   * Công thức chọn nằm hết trong `rut-cau-thap.ts` (tệp thuần, kiểm được).
   * Chỗ này chỉ nối dữ liệu vào và ghi sổ.
   */
  const raCauHoiMoi = useCallback((daHoi: string[], tang: number) => {
    // ƯU TIÊN CÂU CỦA CHÍNH EM. Chỉ khi em chưa có câu nào đọc được mới mượn
    // kho chung — và màn hình NÓI RÕ đang mượn, không giả vờ là câu của em.
    if (dsCauCuaEm.length === 0) {
      const ds = KHO_CAU_HOI.map((c, i) => ({ cau: c, khoa: 'kho_' + i }))
      const conLai = ds.filter((x) => !daHoi.includes(x.khoa))
      const chon = conLai.length > 0 ? conLai : ds
      const x = chon[Math.floor(Math.random() * chon.length)]!
      setKhoaCauHienTai(x.khoa)
      setCauHoiHienTai(x.cau)
      setLyDoNoiCau(['muonKhoChung'])
      setThoiGianConLaiCau(15)
      return
    }

    const chuyenDeDaGap = new Set(
      daHoi.map((q) => dsCauCuaEm.find((c) => c.qid === q)?.chuyenDe ?? '').filter((x) => x !== ''),
    )
    const kho: CauUngVien[] = dsCauCuaEm.map((c) => ({
      qid: c.qid, sao: c.sao, chuyenDe: c.chuyenDe, tungSai: c.tungSai, doDai: c.doDai,
    }))
    const kq = rutCauChoTang({
      kho,
      tang,
      saoMucTieu: saoMucTieuTheoTang(tang),
      // Thầy chốt 15-09: *"càng tầng cao câu càng khó càng dài"*. Tầng 1 nhắm
      // câu ngắn nhất kho của em, tầng 999 nhắm câu dài nhất.
      daiMucTieu: saoMucTieuTheoTang(tang) / 2,
      lichSu: hoSoRef.current.lichSuThap,
      daHoiLuotNay: daHoi,
      chuyenDeDaGap,
      ngauNhien: Math.random,
    })
    if (kq.cau === null) return
    const day = dsCauCuaEm.find((c) => c.qid === kq.cau!.qid)
    if (day === undefined) return
    setKhoaCauHienTai(day.qid)
    setCauHoiHienTai(day as CauHoi)
    setLyDoNoiCau(kq.daNoi)
    setThoiGianConLaiCau(15)
    // GHI SỔ ngay lúc hỏi, không đợi trả lời: em thoát giữa chừng thì câu ấy
    // vẫn coi như đã gặp, nếu không là mở lại gặp đúng nó.
    const bayGio = Date.now()
    setHoSo((prev) => ({ ...prev, lichSuThap: ghiLichSu(prev.lichSuThap, day.qid, bayGio) }))
  }, [dsCauCuaEm])

  /**
   * Đồng hồ câu hỏi.
   *
   * Hai lỗi của bản trước, cả hai đều trừ máu oan:
   *  · `setInterval` không dọn khi về 0 ⇒ giây sau `0 <= 1` vẫn đúng, trừ máu
   *    lần hai. Và gọi `setState` bên trong hàm cập nhật của một `setState`
   *    khác là sai mẫu React; StrictMode chạy đôi thì trừ thêm lần nữa.
   *  · Thắng tầng xong đồng hồ CŨ vẫn chạy 1,8 giây chờ sang tầng mới, nên vừa
   *    thắng đã ăn ngay một đòn "hết giờ".
   * Nay: đếm bằng một ô nhớ riêng, hết giờ thì DỪNG hẳn rồi mới xử.
   */
  useEffect(() => {
    if (!dangLeoThap || !cauHoiHienTai || ketQuaCauVua !== null) return
    let con = 15
    setThoiGianConLaiCau(con)
    const timer = setInterval(() => {
      con -= 1
      setThoiGianConLaiCau(Math.max(0, con))
      if (con <= 0) {
        clearInterval(timer)
        xuLyTraLoiRef.current(-1)
      }
    }, 1000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dangLeoThap, cauHoiHienTai, ketQuaCauVua])

  const xuLyTraLoi = (idxChon: number) => {
    if (!cauHoiHienTai || ketQuaCauVua !== null) return
    const daHoi = [...daHoiCau, khoaCauHienTai]
    setDaHoiCau(daHoi)

    if (idxChon === cauHoiHienTai.dung) {
      amThanhRef.current?.dungCauHoi()
      amThanhRef.current?.kichNo()
      // SÁT THƯƠNG THẬT: lấy từ chỉ số thú, nhân hệ số tương khắc nguyên tố.
      // Bản trước cắm cứng 45 — nên mọi buff từ điểm học tập chỉ là chữ trang trí.
      const tk = tinhHeSoTuongKhac(infoPet.he, heTrumTang(tangHienTai))
      const satThuong = Math.max(1, Math.round(chiSoPet.cong * tk.heSo))
      const mauBossMoi = Math.max(0, mauBoss - satThuong)
      setMauBoss(mauBossMoi)
      // Bật cờ hiệu ứng cho canvas màn đấu: hạ trùm thì tung chiêu nộ, còn lại là đòn thường.
      batHieuUng(mauBossMoi <= 0 ? 'no' : 'danh', mauBossMoi <= 0 ? 1200 : 550)
      setThongBaoChienDau(`Đúng! ${infoPet.kyNangThuong} gây ${satThuong} sát thương — ${tk.thongDiep}`)

      if (mauBossMoi <= 0) {
        amThanhRef.current?.thangTran()
        // TẦNG MỚI trả đủ, LEO LẠI tầng cũ chỉ 12%. Không có luật này thì 999
        // tầng in ra 3 triệu EXP — cày tháp một buổi là khỏi cần thi.
        const tangMoi = tangHienTai >= hoSoRef.current.tangThapCaoNhat
        const thuong = tangMoi
          ? NGUON_EXP.leoThap(tangHienTai)
          : NGUON_EXP.leoThapLai(tangHienTai)
        const nhan = laTangCanh(tangHienTai) ? thuong * 2 : thuong
        setThongBaoChienDau(
          `${infoPet.kyNangNo}! Hạ ${tenTrumTang(tangHienTai)} — +${nhan} EXP`
          + (tangMoi ? '' : ' (tầng đã hạ, chỉ 12%)'),
        )
        setHoSo((prev) => ({
          ...prev,
          tangThapCaoNhat: Math.min(TANG_TOI_DA, Math.max(prev.tangThapCaoNhat, tangHienTai + 1)),
        }))
        themVaoKho(nhan, 'leoThap', `Hạ trùm tầng ${tangHienTai}`)
      }
      setKetQuaCauVua({
        dung: true,
        daChon: idxChon,
        cau: cauHoiHienTai,
        haTrum: mauBossMoi <= 0,
        tangKeTiep: mauBossMoi <= 0 ? tangHienTai + 1 : tangHienTai,
        thua: false,
      })
    } else {
      amThanhRef.current?.saiCauHoi()
      amThanhRef.current?.trungDon()
      // Giáp thật sự đỡ đòn.
      const tk = tinhHeSoTuongKhac(heTrumTang(tangHienTai), infoPet.he)
      // Cũ `28 + tầng × 3`: tầng 999 ra 3 025 sát thương một đòn, thú cấp 120
      // chỉ ~4 800 máu ⇒ sai hai câu là chết. Nay bám theo máu tối đa của thú:
      // mỗi đòn ~18% máu, tức sai 5 câu là kiệt sức, ở MỌI tầng.
      const satThuongBoss = Math.max(
        1,
        Math.round(satThuongTrum(tangHienTai, chiSoPet.mau) * tk.heSo - chiSoPet.giap * 0.25),
      )
      const mauPetMoi = Math.max(0, mauPetCombat - satThuongBoss)
      setMauPetCombat(mauPetMoi)
      batHieuUng('biDanh', 700)
      const loi = idxChon === -1 ? 'Hết giờ!' : 'Sai rồi!'
      // Lời giải KHÔNG nhét vào dòng thông báo nữa — nó có khung riêng ở dưới.
      setThongBaoChienDau(`${loi} Mất ${satThuongBoss} máu.`)
      if (mauPetMoi <= 0) {
        setThongBaoChienDau('Thần thú kiệt sức. Đọc kỹ lời giải rồi quay lại leo tiếp.')
      }
      setKetQuaCauVua({
        dung: false,
        daChon: idxChon,
        cau: cauHoiHienTai,
        haTrum: false,
        tangKeTiep: tangHienTai,
        thua: mauPetMoi <= 0,
      })
    }
  }

  /** Bấm "Câu tiếp theo" / "Lên tầng". Đây là chỗ DUY NHẤT đi tiếp. */
  const diTiep = useCallback(() => {
    const kq = ketQuaCauVua
    if (kq === null) return
    setKetQuaCauVua(null)
    if (kq.thua) { setDangLeoThap(false); setCauHoiHienTai(null); return }
    if (kq.haTrum) {
      const tangMoi = kq.tangKeTiep
      setTangHienTai(tangMoi)
      setMauBoss(mauTrumTang(tangMoi))
      setMauBossToiDa(mauTrumTang(tangMoi))
      setThongBaoChienDau(`Tầng ${tangMoi} — trùm hệ ${TEN_HE[heTrumTang(tangMoi)]}`)
      raCauHoiMoi(daHoiCau, tangMoi)
    } else {
      raCauHoiMoi(daHoiCau, kq.tangKeTiep)
    }
  }, [ketQuaCauVua, daHoiCau, mauTrumTang, heTrumTang, raCauHoiMoi])

  // Đồng hồ gọi xuLyTraLoi qua ref: hàm này dựng lại mỗi lần vẽ, giữ bản mới nhất.
  const xuLyTraLoiRef = useRef(xuLyTraLoi)
  useEffect(() => { xuLyTraLoiRef.current = xuLyTraLoi })

  // Hai canvas, một con thú. Canvas nào không hiện thì không quay vòng lặp.
  useVeThanThu(canvasRef, infoPet, hoSo.capTienHoa, hieuUngYenRef, tabGame === 'dao_thu' && !dung3D, gocXoayRef)
  useVeThanThu(
    canvasCombatRef, infoPet, hoSo.capTienHoa, hieuUngRef,
    tabGame === 'leo_thap' && dangLeoThap,
  )

  /**
   * DẢI NÓI RÕ CÂU HỎI LẤY TỪ ĐÂU.
   * Không được để em tưởng đang làm câu của mình trong khi game mượn kho chung.
   */
  const daiNguonCau = (
    <>
      {tinhTrangKho === 'dangTai' && (
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[12px] text-slate-600 dark:text-slate-300 text-center">
          Đang lấy các câu em từng làm sai…
        </div>
      )}

      {tinhTrangKho === 'loi' && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[12px] text-amber-800 dark:text-amber-300">
          Không lấy được câu sai của em ({loiKho}). Đang dùng kho câu chung {KHO_CAU_HOI.length} câu.
        </div>
      )}

      {tinhTrangKho === 'xong' && dungKhoCuaEm && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[12px] text-emerald-900 dark:text-emerald-200 space-y-1">
          <div>
            Câu hỏi lấy từ <b>{dsCauCuaEm.length} câu chính em từng làm sai</b> — không phải câu chung.
          </div>
          {tomTatKho !== null && tomTatKho.dsChuyenDe.length > 0 && (
            <div className="text-[11px] opacity-80">
              Chuyên đề: {tomTatKho.dsChuyenDe.join(' · ')}
            </div>
          )}
          {tomTatKho !== null && tomTatKho.soBoQua > 0 && (
            <div className="text-[11px] opacity-80">
              Đã bỏ {tomTatKho.soBoQua} câu không đưa vào game được:{' '}
              {Object.entries(tomTatKho.lyDoBoQua)
                .map(([ly, so]) => `${so} câu ${TEN_LY_DO[ly as keyof typeof TEN_LY_DO]}`)
                .join(', ')}.
            </div>
          )}
        </div>
      )}

      {tinhTrangKho === 'xong' && !dungKhoCuaEm && (
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[12px] text-slate-600 dark:text-slate-300 space-y-1">
          <div>
            Chưa lấy được câu sai nào của em, nên đang dùng <b>kho câu chung {KHO_CAU_HOI.length} câu</b>.
          </div>
          {tomTatKho !== null && tomTatKho.soBoQua > 0 && (
            <div className="text-[11px] opacity-80">
              Có {tomTatKho.soBoQua} câu sai nhưng không đưa vào game được:{' '}
              {Object.entries(tomTatKho.lyDoBoQua)
                .map(([ly, so]) => `${so} câu ${TEN_LY_DO[ly as keyof typeof TEN_LY_DO]}`)
                .join(', ')}.
            </div>
          )}
        </div>
      )}
    </>
  )

  return (
    <div className="space-y-5 animate-google-fade pb-10">
      {/* Popup lấp lánh mỗi lần nhận EXP — thầy chốt 15-09. */}
      <PopupThuongExp tin={tinThuong} onDong={() => setTinThuong(null)} />
      {/* Thanh tiêu đề Game */}
      <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 dark:from-amber-950/30 dark:via-purple-950/30 dark:to-blue-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  THẦN THÚ HÓA HỌC
                </h1>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  ALCHEMON
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Nuôi thú, thức tỉnh nguyên tố & leo tháp tri thức cùng kết quả học tập của em
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setBatAm(!batAm)}
              title={batAm ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              {batAm ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onDong}
              className="btn-google-outlined text-xs py-2 px-3 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Thoát Game</span>
            </button>
          </div>
        </div>

        {/* 4 Tabs Chế Độ Game — ẩn cho tới khi em chốt thần thú. */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 ${daChonThu ? '' : 'hidden'}`}>
          <button
            onClick={() => { setTabGame('dao_thu'); setDangLeoThap(false); }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tabGame === 'dao_thu'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Đảo Thần Thú</span>
          </button>

          <button
            onClick={() => { setTabGame('leo_thap'); setDangLeoThap(false); }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tabGame === 'leo_thap'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Leo Tháp Tri Thức</span>
          </button>

          <button
            onClick={() => { setTabGame('san_cau_sai'); setDangLeoThap(false); }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tabGame === 'san_cau_sai'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Săn Boss Câu Sai</span>
          </button>

          <button
            onClick={() => { setTabGame('xep_hang'); setDangLeoThap(false); }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tabGame === 'xep_hang'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Võ Đài Xếp Hạng</span>
          </button>
        </div>
      </div>

      {/* CÒN ĐANG HỎI MÁY CHỦ — chưa được bày nút chọn ra. Xem `dangHoiMayChu`. */}
      {!daChonThu && dangHoiMayChu && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-3">
          <div className="mx-auto h-9 w-9 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-emerald-500 animate-spin" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Đang hỏi máy chủ xem em đã chọn thần thú chưa
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Nếu em đã nuôi thú ở máy khác, con thú ấy sẽ hiện ra ngay — em không
            phải chọn lại. Chờ một nhịp.
          </p>
        </div>
      )}

      {/* MÀN CHỌN LẦN ĐẦU — chưa chọn thì không vào được tab nào. */}
      {!daChonThu && !dangHoiMayChu && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Chọn thần thú đồng hành của em
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              Sáu hệ, mỗi hệ một lối đánh. <b>Chọn một lần duy nhất và không đổi được</b>,
              nên đọc kỹ hệ nào khắc hệ nào trước khi bấm.
            </p>
          </div>

          {/* HỎI MÁY CHỦ KHÔNG ĐƯỢC thì phải nói ra TRƯỚC KHI em bấm chọn.
              Em có thể đang có thú ở máy khác mà máy này không biết — bấm chọn
              lúc này là chốt nhầm một con thứ hai. */}
          {tinhTrangDongBo === 'loi' && (
            <div className="rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
              <b>Chưa hỏi được máy chủ.</b> Nếu em đã nuôi thần thú ở máy khác thì máy
              này chưa thấy con ấy — bấm chọn bây giờ là chốt nhầm một con thứ hai.
              Máy đang tự thử lại; <b>chờ có mạng rồi hãy chọn</b>, đừng chọn lúc này.
            </div>
          )}

          {/* HỎI XONG, MÁY CHỦ KHÔNG CÓ THÚ NÀO. Phải nói thẳng ra.
              Thầy bắt được 15-09: thanh đồng bộ báo "Đã đồng bộ với máy chủ ·
              21:28:12" chấm xanh, mà màn vẫn bày nút chọn — nhìn như bấm đồng
              bộ không ăn thua gì. Thật ra đồng bộ chạy đúng, chỉ là máy chủ
              không có gì để trả về. Câu "đã đồng bộ" một mình KHÔNG trả lời
              được câu hỏi em đang hỏi: "thế con thú của tôi đâu?" */}
          {tinhTrangDongBo === 'xong' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Đã hỏi máy chủ xong: <b>chưa có thần thú nào mang số báo danh của em</b>.
              Con em chọn ở đây sẽ là con đầu tiên, và từ đó hiện ở mọi máy em đăng nhập.
              <br />
              Nếu em nhớ là đã nuôi thú ở máy khác thì <b>mở game ở đúng máy ấy một lượt</b> trước
              đã — con thú sẽ tự lên máy chủ rồi về đây, khỏi phải chọn lại.
            </div>
          )}

          {thanhDongBo}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(DANH_SACH_THAN_THU).map((pet) => (
              <button
                key={pet.id}
                type="button"
                onClick={() => chonThanThu(pet.id)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-left space-y-2 cursor-pointer transition-all active:scale-95"
              >
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">{pet.ten}</div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {TEN_HE[pet.he]}
                  </div>
                </div>
                <p className="text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">
                  {pet.moTa}
                </p>
                <div className="space-y-0.5 text-[11px]">
                  <div className="text-emerald-700 dark:text-emerald-400">
                    <b>Khắc được:</b>{' '}
                    {heKhacDuoc(pet.he).map((c) => TEN_HE_NGAN[c.thu]).join(', ') || '—'}
                  </div>
                  <div className="text-rose-700 dark:text-rose-400">
                    <b>Bị khắc bởi:</b>{' '}
                    {heBiKhacBoi(pet.he).map((c) => TEN_HE_NGAN[c.cong]).join(', ') || '—'}
                  </div>
                  <div className="text-slate-500 font-mono">Gốc: {pet.nguyenToGoc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* NỘI DUNG TAB 1: ĐẢO THẦN THÚ */}
      {daChonThu && tabGame === 'dao_thu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 items-start gap-5">
          {/* Cột trái: Khung hiển thị thần thú tương tác Canvas */}
          <div className="lg:col-span-2 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm overflow-hidden flex flex-col text-center">
            {/* ═══ SÂN KHẤU ═══ Thầy chốt 15-09: *"nền xung quanh của thần thú
                tràn ra tất cả ô mà thần thú đó đứng"* và *"để nền và thú trọn
                vẹn không dính chữ gì"*. Ô đó là SÂN KHẤU này — cảnh 3D tràn
                sát bốn mép, trên nó chỉ có tên thú ở đỉnh và hai nút chiêu nép
                hai bên. Mọi thanh số liệu đẩy hết xuống bảng điều khiển bên
                dưới, nền đục, để chữ đọc được mà thân thú không dính chữ nào.
                Trước đây cảnh trải kín CẢ thẻ: khung ảnh cao gấp ba lần rộng
                nên con thú bị kéo phình, còn bảng EXP thì nằm đè lên bụng nó. */}
            <div className={`relative w-full ${dung3D ? 'bg-slate-950 text-white' : ''}`}>
            {dung3D && (
              <Suspense fallback={null}>
                <ThanThu3D
                  info={infoPet}
                  cap={hoSo.capTienHoa}
                  lenhChieu={lenhChieu}
                  onCham={chamThu3D}
                  onKhongDungDuoc={bo3D}
                  lapDay
                />
              </Suspense>
            )}
            {/* Hai dải tối trên–dưới: chữ đè lên cảnh phải đọc được ở mọi hệ,
                kể cả hệ Base nền sáng băng. */}
            {dung3D && (
              <div
                className="pointer-events-none absolute inset-0 z-[5]"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(2,6,23,0.82) 0%, rgba(2,6,23,0.28) 22%, rgba(2,6,23,0) 42%, rgba(2,6,23,0.35) 68%, rgba(2,6,23,0.9) 100%)',
                }}
              />
            )}
            {/* Thầy bắt 15-09: *"bản mới không xoay được"*. Lớp nội dung này
                nằm ĐÈ KÍN sân khấu (nó chính là thứ quyết định chiều cao sân
                khấu), nên mọi cú chạm–kéo rơi vào nó chứ không tới được lớp
                canvas 3D phía dưới. Ở bản 3D phải cho chạm XUYÊN QUA lớp này;
                riêng hai nút chiêu bật lại nhận chạm. Bản phẳng thì canvas 2D
                nằm TRONG lớp này nên giữ nguyên. */}
            <div className={`relative z-10 flex flex-col p-5 sm:p-6 ${dung3D ? 'pointer-events-none' : ''}`}>
            {/* Header thú cưng */}
            <div className="relative w-full flex items-start justify-between gap-3 z-10">
              <div className="text-left min-w-0">
                <span
                  className={`inline-block max-w-full whitespace-nowrap text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono ${
                    dung3D
                      ? 'bg-white/12 border border-white/20 text-slate-100 backdrop-blur-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Hình thái {hoSo.capDo}/{CAP_TOI_DA}
                  <span className="hidden sm:inline"> · {layHinhThai(hoSo.capDo).ten}</span>
                </span>
                <h2
                  className={`text-lg font-black mt-1 ${
                    dung3D ? 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {infoPet.ten}
                </h2>
                <div
                  className={`text-xs font-semibold ${
                    dung3D ? 'text-slate-200/90' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {infoPet.danhHieu}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xl font-black text-amber-500 font-mono whitespace-nowrap">
                  CP: {chiSoPet.cp.toLocaleString()}
                </div>
                <div className={`text-[11px] ${dung3D ? 'text-slate-300/85' : 'text-slate-400'}`}>
                  Lực chiến tổng
                </div>
              </div>
            </div>

            {/* HAI NÚT CHƯỞNG nổi hai bên. Bản 3D thì con thú đã nằm ở lớp
                nền phía sau, khoảng giữa để trống cho thấy cảnh; bản phẳng thì
                canvas 2D vẫn đứng giữa như cũ. */}
            <div
              className={`my-2 relative z-10 flex items-center justify-between w-full gap-2 sm:gap-3 ${
                dung3D ? 'min-h-[300px]' : 'justify-center'
              }`}
            >
              <button
                type="button"
                onClick={() => tungChieu(false)}
                title={infoPet.kyNangThuong}
                aria-label={infoPet.kyNangThuong}
                className={`pointer-events-auto shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer transition-transform active:scale-90 ${
                  dung3D
                    ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 backdrop-blur-sm hover:bg-emerald-500/35'
                    : 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                }`}
              >
                <Swords className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {!dung3D && (
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={260}
                  aria-label={`${infoPet.ten} — vuốt ngang để xoay, chạm để nghe tiếng kêu`}
                  className="max-w-full drop-shadow-lg cursor-grab active:cursor-grabbing touch-none select-none"
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId)
                    batDauKeo(e.clientX)
                  }}
                  onPointerMove={(e) => dangKeoToi(e.clientX)}
                  onPointerUp={ketThucKeo}
                  onPointerCancel={ketThucKeo}
                />
              )}

              <button
                type="button"
                onClick={() => tungChieu(true)}
                title={infoPet.kyNangNo}
                aria-label={infoPet.kyNangNo}
                className={`pointer-events-auto shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer transition-transform active:scale-90 ${
                  dung3D
                    ? 'bg-amber-500/25 border border-amber-400/70 text-amber-100 backdrop-blur-sm hover:bg-amber-500/45'
                    : 'bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                }`}
              >
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            </div>
            </div>
            {/* ═══ HẾT SÂN KHẤU ═══ */}

            {/* ═══ BẢNG ĐIỀU KHIỂN ═══ nền đục, tách hẳn khỏi cảnh. */}
            <div className="p-5 sm:p-6 pt-4 flex flex-col items-center gap-3">
            {thanhDongBo}

            {/* Thầy chốt 15-09: *"để nền và thú trọn vẹn không dính chữ gì"*.
                Ở bản 3D, sân khấu là cả thẻ nên hai nút chữ tên chiêu và dòng
                hướng dẫn nằm ngay ngực–mặt con thú. Bỏ hẳn: hai nút biểu tượng
                hai bên đã tung đúng hai chiêu đó, tên chiêu vẫn hiện đầy đủ ở
                dòng thông báo khi đánh trùm. Bản phẳng không có sân khấu nên
                giữ nguyên như cũ. */}
            {!dung3D && (
              <>
                <div className="relative z-10 grid grid-cols-2 gap-2 w-full text-[11px] -mt-1">
                  <button
                    type="button"
                    onClick={() => tungChieu(false)}
                    className="px-2 py-1.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold leading-tight cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition"
                  >
                    {infoPet.kyNangThuong}
                  </button>
                  <button
                    type="button"
                    onClick={() => tungChieu(true)}
                    className="px-2 py-1.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold leading-tight cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 transition"
                  >
                    {infoPet.kyNangNo}
                  </button>
                </div>

                <div className="relative z-10 text-[11px] text-slate-400 dark:text-slate-500 text-center -mt-1">
                  Vuốt ngang để xoay thần thú · chạm vào nó để nghe tiếng kêu ·
                  máy này không dựng được 3D nên đang hiện bản phẳng
                </div>
              </>
            )}

            {/* HAI BỂ: ỐNG NGHIỆM (EXP đã kiếm) và THANH CẤP ĐỘ (EXP đã nạp).
                Nút nạp chỉ CHUYỂN giữa hai bể, không sinh thêm EXP. */}
            <div className="relative w-full space-y-3 z-10">
              <div className="flex items-stretch gap-4">
                {/* Bể 1 — ống nghiệm */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <OngNghiemExp dangCo={hoSo.khoExp} sucChua={SUC_CHUA_ONG} dangRot={dangNap} />
                  <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                    {dangNap ? 0 : hoSo.khoExp}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-none">/ {SUC_CHUA_ONG}</div>
                </div>

                {/* Bể 2 — thanh cấp độ */}
                <div className="flex-1 flex flex-col justify-center gap-2 min-w-0">
                  <div className="flex items-center justify-between text-xs font-bold gap-2">
                    <span className="text-slate-700 dark:text-slate-300">
                      Cấp độ: <strong className="text-emerald-600 text-sm">Lv.{hoSo.capDo}</strong>
                    </span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {hoSo.capDo >= CAP_TOI_DA
                        ? 'ĐÃ TỚI ĐỈNH'
                        : `${hoSo.exp} / ${hoSo.expToiDa}`}
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${hoSo.capDo >= CAP_TOI_DA
                          ? 100
                          : Math.max(0, Math.min(100, (hoSo.exp / Math.max(1, hoSo.expToiDa)) * 100))}%`,
                      }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {hoSo.capDo >= CAP_TOI_DA
                      ? 'Hình thái tối thượng — không còn cấp nào cao hơn'
                      : `Còn ${Math.max(0, hoSo.expToiDa - hoSo.exp)} EXP nữa lên ${layHinhThai(hoSo.capDo + 1).ten}`}
                  </div>

                  <button
                    type="button"
                    onClick={napVaoThu}
                    disabled={hoSo.khoExp <= 0 || hoSo.capDo >= CAP_TOI_DA}
                    className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {hoSo.capDo >= CAP_TOI_DA
                        ? 'Thần thú đã tới đỉnh'
                        : hoSo.khoExp > 0
                          ? `Nạp ${hoSo.khoExp} tinh lực vào thần thú`
                          : 'Ống rỗng — đi học để đầy ống'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={nhanExpTuHocTap}
                  className="py-2.5 px-5 rounded-full border border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold text-xs flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Rót việc học vào ống</span>
                </button>
              </div>

              {ongDayKhongNhan > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[12px] text-amber-900 dark:text-amber-200 text-center">
                  Ống đã đầy nên còn <b>{ongDayKhongNhan} EXP</b> chưa rót được.
                  Nạp cho thần thú rồi rót tiếp — không mất đâu.
                </div>
              )}
              {viecVuaLam !== '' && (
                <div className="text-center text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
                  {viecVuaLam}
                </div>
              )}

              {/* EXP kiếm ở đâu — bảng này PHẢI khớp đúng con số trong mã */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  EXP chỉ đổi được bằng việc học
                </div>
                <div className="space-y-1">
                  {BANG_NGUON_EXP.map((n) => (
                    <div key={n.viec} className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-600 dark:text-slate-300">{n.viec}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{n.thuong}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
            {/* ═══ HẾT BẢNG ĐIỀU KHIỂN ═══ */}
          </div>

          {/* Cột phải: Chỉ số sức mạnh & Khung tăng lực chiến từ học tập */}
          <div className="space-y-4">
            {/* Thẻ chỉ số Combat */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span>Chỉ Số Chiến Đấu</span>
              </h3>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900/60">
                  <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Sinh Lực</div>
                  <div className="text-base font-black text-rose-700 dark:text-rose-300 font-mono mt-0.5">
                    {chiSoPet.mau}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900/60">
                  <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Công Kích</div>
                  <div className="text-base font-black text-amber-700 dark:text-amber-300 font-mono mt-0.5">
                    {chiSoPet.cong}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/60">
                  <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Giáp Bền</div>
                  <div className="text-base font-black text-blue-700 dark:text-blue-300 font-mono mt-0.5">
                    {chiSoPet.giap}
                  </div>
                </div>
              </div>

              {/* Tác động của điểm học tập */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-xs space-y-2">
                <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                  <span>Buff Sức Mạnh Từ Học Tập</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    +{Math.round((((chiSoHocTap.diemTb ?? 0) / 10) * 0.4 + chiSoHocTap.tyLeBtvn * 0.3) * 100)}% Lực
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {/* Chưa có dữ liệu thì NÓI LÀ CHƯA CÓ, không in 7.00đ và 80% */}
                  • Điểm trung bình ca thi:{' '}
                  <strong>
                    {chiSoHocTap.diemTb === null
                      ? 'chưa thi ca nào'
                      : chiSoHocTap.diemTb.toFixed(2) + 'đ (' + chiSoHocTap.soCa + ' ca)'}
                  </strong>
                  <br />
                  • Bài tập về nhà:{' '}
                  <strong>
                    {chiSoHocTap.tongBtvn === 0
                      ? 'chưa giao bài nào'
                      : Math.round(chiSoHocTap.tyLeBtvn * 100) + '% (' + chiSoHocTap.btvnDaNop + '/' + chiSoHocTap.tongBtvn + ' bài)'}
                  </strong>
                </div>
              </div>

              {/* TÓM TẮT EXP TỪNG NHIỆM VỤ — thầy chốt 15-09, đặt ngay trong thẻ
                  buff này để em thấy việc học nào đẻ ra bao nhiêu sức mạnh. */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    EXP đã kiếm theo nhiệm vụ
                  </div>
                  <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                    {tongSoExp(hoSo.soExp).toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1 text-[12px] items-baseline">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nhiệm vụ</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Cộng</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Trừ</div>
                  {DS_NGUON_EXP.map((k) => (
                    <Fragment key={k}>
                      <span className="text-slate-600 dark:text-slate-300">{TEN_NGUON_EXP[k]}</span>
                      <span className="text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        {(hoSo.soExp[k] ?? 0) > 0 ? '+' + (hoSo.soExp[k] ?? 0).toLocaleString() : '—'}
                      </span>
                      <span className="text-right font-mono tabular-nums text-slate-400">0</span>
                    </Fragment>
                  ))}
                </div>

                <div className="text-[10.5px] text-slate-400 leading-snug pt-1 border-t border-slate-200 dark:border-slate-700">
                  Cột trừ luôn bằng 0: <b>chưa có nhiệm vụ nào lấy EXP của em đi</b>.
                  Làm sai chỉ là không được cộng, không bị phạt.
                  Toàn bộ EXP trên đây đã cộng dồn vào ống nghiệm.
                </div>
              </div>
            </div>

            {/* SÁU HỆ — CHỈ ĐỌC. Em đã chốt một con, không đổi được nữa. */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Sáu Hệ Thần Thú
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(DANH_SACH_THAN_THU).map((pet) => {
                  const laCuaEm = hoSo.idThanhThuChon === pet.id
                  const tk = tinhHeSoTuongKhac(infoPet.he, pet.he)
                  return (
                    <div
                      key={pet.id}
                      className={`p-2.5 rounded-2xl border text-left ${
                        laCuaEm
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold line-clamp-1">{pet.ten}</div>
                      <div className="text-[10px] text-slate-500">{TEN_HE[pet.he]}</div>
                      <div className="text-[10px] mt-0.5 font-bold">
                        {laCuaEm ? (
                          <span className="text-emerald-600 dark:text-emerald-400">Thần thú của em</span>
                        ) : tk.loai === 'khac' ? (
                          <span className="text-emerald-600 dark:text-emerald-400">Em khắc hệ này +50%</span>
                        ) : tk.loai === 'biKhac' ? (
                          <span className="text-rose-600 dark:text-rose-400">Hệ này khắc em −30%</span>
                        ) : (
                          <span className="text-slate-400">Không tương khắc</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Thần thú chọn một lần là gắn bó cả chặng — không đổi được. Gặp hệ khắc
                mình thì phải trả lời chắc hơn, chứ không đổi thú để né.
              </p>
            </div>

            {/* HỒ SƠ NGUYÊN TỐ — phần "học" của game.
                Bốn thần thú đều dựng từ phản ứng có thật; trước đây `moTa`,
                `kyNangThuong`, `kyNangNo`, `nguyenToGoc` nằm trong dữ liệu mà
                không màn nào hiện ra, tức là viết xong rồi bỏ đó. */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Hồ Sơ Nguyên Tố</span>
              </h3>

              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{infoPet.danhHieu}</div>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {TEN_HE[infoPet.he]}
                </span>
              </div>

              <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
                {infoPet.moTa}
              </p>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1.5 text-[12px]">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 shrink-0">Nguyên tố gốc</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-right">{infoPet.nguyenToGoc}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 shrink-0">Chiêu thường</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-right">{infoPet.kyNangThuong}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 shrink-0">Chiêu nộ</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-right">{infoPet.kyNangNo}</span>
                </div>
              </div>

              <div className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Vòng khắc chế: Hoả ▸ Khí ▸ Base ▸ Acid ▸ Hoả. Đánh vào hệ mình khắc
                được <b className="text-emerald-600 dark:text-emerald-400">+50%</b> sát thương;
                đánh vào hệ khắc mình thì <b className="text-rose-600 dark:text-rose-400">−30%</b>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NỘI DUNG TAB 2: LEO THÁP TRI THỨC */}
      {daChonThu && tabGame === 'leo_thap' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm">
          {!dangLeoThap ? (
            <div className="text-center py-8 max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center shadow-inner">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Tháp Tri Thức 100 Tầng
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mỗi tầng canh giữ bởi Quái Vật Hóa Học. Trả lời đúng trong 15s để kích hoạt chiêu nộ hạ gục Boss!
                </p>
              </div>

              {daiNguonCau}

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                Kỷ lục tầng hiện tại của em: <strong className="text-purple-600 text-sm">Tầng {hoSo.tangThapCaoNhat}</strong>
              </div>

              <button
                onClick={batDauLeoThap}
                className="w-full py-3.5 px-6 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Swords className="w-5 h-5" />
                <span>Khiêu Chiến Tầng {hoSo.tangThapCaoNhat}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Đấu trường Boss vs Thần Thú */}
              <div className="grid grid-cols-2 gap-4 items-center">
                {/* Pet của em */}
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-left">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {infoPet.ten} (Lv.{hoSo.capDo})
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.max(0, Math.min(100, (mauPetCombat / Math.max(1, chiSoPet.mau)) * 100))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono tabular-nums">{mauPetCombat} / {chiSoPet.mau} HP</div>
                </div>

                {/* Boss tầng */}
                <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl text-right">
                  <div className="text-xs font-bold text-rose-800 dark:text-rose-300">
                    Tầng {tangHienTai}/{TANG_TOI_DA}: {tenTrumTang(tangHienTai)}
                  </div>
                  {/* ĐỘ KHÓ HIỆN THÀNH SỐ. "Tầng cao hơn thì khó hơn" phải là
                      thứ em nhìn thấy, không phải lời hứa suông. */}
                  <div className="text-[10px] text-rose-700/80 dark:text-rose-400/80 font-mono">
                    độ khó ★{saoMucTieuTheoTang(tangHienTai).toFixed(1)}/2,0
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${Math.max(0, Math.min(100, (mauBoss / Math.max(1, mauBossToiDa)) * 100))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono tabular-nums">{mauBoss} / {mauBossToiDa} HP</div>
                </div>
              </div>

              {lyDoNoiCau.length > 0 && (
                <div className="mt-2 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
                  {CHU_LY_DO_NOI[lyDoNoiCau[lyDoNoiCau.length - 1]!]}
                </div>
              )}

              {/* THẦN THÚ TRÊN SÀN ĐẤU.
                  Trước đây màn đấu chỉ có hai thanh máu — con thú em nuôi không
                  xuất hiện lúc nó đánh nhau, và ba cờ hiệu ứng nằm chết trong mã. */}
              <div className="flex flex-col items-center gap-1">
                <canvas
                  ref={canvasCombatRef}
                  width={260}
                  height={200}
                  className="max-w-full drop-shadow-lg"
                />
                <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                  <b className="text-slate-700 dark:text-slate-200">{layHinhThai(hoSo.capDo).ten}</b>
                  {' · '}Hệ {TEN_HE[infoPet.he]}
                  {' · '}Gốc <span className="font-mono">{infoPet.nguyenToGoc}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                  Đúng thì tung <b className="text-emerald-600 dark:text-emerald-400">{infoPet.kyNangThuong}</b>
                  {' · '}Hạ trùm thì nổ <b className="text-amber-600 dark:text-amber-400">{infoPet.kyNangNo}</b>
                </div>
              </div>

              {/* Thông báo diễn biến trận đấu */}
              {thongBaoChienDau && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-center text-xs font-bold text-amber-800 dark:text-amber-300 animate-pulse">
                  {thongBaoChienDau}
                </div>
              )}

              {/* SAU KHI TRẢ LỜI: dừng lại đọc lời giải, chờ em bấm đi tiếp.
                  Bản trước tự nhảy sau 1,2–1,8 giây — không đủ đọc một dòng. */}
              {ketQuaCauVua !== null && (
                <div className="space-y-3">
                  <KhungLoiGiaiGame
                    loiGiaiTho={
                      'loiGiaiTho' in ketQuaCauVua.cau
                        ? (ketQuaCauVua.cau as { loiGiaiTho?: unknown }).loiGiaiTho
                        : undefined
                    }
                    dapAnDung={ketQuaCauVua.cau.dung}
                    daChon={ketQuaCauVua.daChon}
                    phuongAn={ketQuaCauVua.cau.phuongAn}
                    duPhong={ketQuaCauVua.cau.giaiThich}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={diTiep}
                      className="py-3 px-6 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md cursor-pointer transition-transform active:scale-95"
                    >
                      {ketQuaCauVua.thua
                        ? 'Về Đảo Thần Thú'
                        : ketQuaCauVua.haTrum
                          ? `Lên tầng ${ketQuaCauVua.tangKeTiep} →`
                          : 'Câu tiếp theo →'}
                    </button>
                  </div>
                </div>
              )}

              {/* Khung câu hỏi Q&A chiến đấu */}
              {ketQuaCauVua === null && cauHoiHienTai && mauPetCombat > 0 && mauBoss > 0 && (
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-purple-600 dark:text-purple-400">
                      ⚡ CÂU HỎI KÍCH HOẠT TUYỆT KỸ
                    </span>
                    <span className="flex items-center gap-1 text-rose-600 font-mono">
                      <Clock className="w-4 h-4" />
                      <span>{thoiGianConLaiCau}s</span>
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {cauHoiHienTai.cau}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {cauHoiHienTai.phuongAn.map((pa, idx) => (
                      <button
                        key={idx}
                        onClick={() => xuLyTraLoi(idx)}
                        className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left text-xs font-medium transition cursor-pointer"
                      >
                        <strong className="text-purple-600 mr-2">{String.fromCharCode(65 + idx)}.</strong>
                        <span>{pa}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setDangLeoThap(false)}
                  className="btn-google-outlined text-xs py-2 px-4 rounded-full cursor-pointer"
                >
                  Rút lui khỏi Tháp
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NỘI DUNG TAB 3: SĂN BOSS CÂU SAI (Đột kích lò phản ứng) */}
      {daChonThu && tabGame === 'san_cau_sai' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <span>Đột Kích Lò Phản Ứng: Săn Boss Câu Sai</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mỗi câu em từng làm sai là một con quái. Trả lời đúng lại chính câu đó mới hạ được và mới có EXP.
              </p>
            </div>

            <button
              onClick={onChuyenSangKhacPhuc}
              className="btn-google-primary !bg-rose-600 hover:!bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-full flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Mở Kho Câu Khắc Phục</span>
            </button>
          </div>

          {daiNguonCau}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
              <div className="text-xs font-bold text-rose-800 dark:text-rose-300">Quái chưa hạ</div>
              <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono tabular-nums">
                {dsQuaiConLai.length} câu
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {/* SỐ NÀY ĐẾM TỪ CHÍNH CÂU SAI CỦA EM, không phải tổng soCauSai
                    trong bảng điểm — hai con số lệch nhau là chuyện thường vì
                    câu phần II, phần III và câu có hình không đưa vào game được. */}
                Mỗi quái là một câu em từng làm sai. Hạ được là trả lời đúng lại chính câu đó.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-300">Thưởng mỗi quái hạ được</div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono tabular-nums">
                +{NGUON_EXP.suaCauSai()} EXP
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Đã hạ <b className="tabular-nums">{qidDaThanhTay.length}</b> câu.
                Mỗi câu chỉ thưởng <b>một lần</b>; làm sai thì không có EXP, câu vẫn nằm đó.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Lực chiến thần thú</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                {chiSoPet.cp.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {layHinhThai(hoSo.capDo).ten} · Lv.{hoSo.capDo}/{CAP_TOI_DA}
              </p>
            </div>
          </div>

          {/* SÀN SĂN QUÁI — phải làm đúng mới có EXP, không còn nút tự khai. */}
          {cauSanHienTai === null ? (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-center space-y-3">
              {dsQuaiConLai.length > 0 ? (
                <>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Còn <b className="text-rose-600 dark:text-rose-400">{dsQuaiConLai.length}</b> quái đang giam Đá Tiến Hóa.
                  </div>
                  <button
                    type="button"
                    onClick={goiQuaiTiepTheo}
                    className="py-3 px-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md inline-flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                  >
                    <Swords className="w-5 h-5" />
                    <span>Khiêu chiến quái tiếp theo</span>
                  </button>
                </>
              ) : dungKhoCuaEm ? (
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                  Em đã làm đúng lại toàn bộ {dsCauCuaEm.length} câu từng sai. Không còn quái nào.
                </div>
              ) : (
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Chưa có câu sai nào của em đưa vào game được, nên chưa có quái để săn.
                  Phần này chỉ dùng câu thật của em — không lấy câu kho chung ra cho EXP.
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                <span className="text-rose-600 dark:text-rose-400">QUÁI CÂU SAI</span>
                <span className="text-slate-500 dark:text-slate-400 font-normal">
                  {cauSanHienTai.tenCa !== '' && <>Ca: {cauSanHienTai.tenCa} · </>}
                  Câu {cauSanHienTai.soCau}
                  {cauSanHienTai.tenDang !== '' && <> · Dạng: {cauSanHienTai.tenDang}</>}
                </span>
              </div>

              <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
                {cauSanHienTai.cau}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {cauSanHienTai.phuongAn.map((pa, idx) => {
                  const daXong = ketQuaSan !== null
                  const laDapAn = idx === cauSanHienTai.dung
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={daXong}
                      onClick={() => traLoiQuai(idx)}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition cursor-pointer disabled:cursor-default ${
                        daXong && laDapAn
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                    >
                      <strong className="text-rose-600 mr-2">{String.fromCharCode(65 + idx)}.</strong>
                      <span>{pa}</span>
                    </button>
                  )
                })}
              </div>

              {ketQuaSan !== null && (
                <div className="space-y-2.5">
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold ${
                      ketQuaSan.dung
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {ketQuaSan.dung
                      ? `Hạ quái! +${NGUON_EXP.suaCauSai()} EXP.`
                      : 'Vẫn sai. Không có EXP câu này — đọc kỹ rồi làm lại sau.'}
                  </div>
                  <KhungLoiGiaiGame
                    loiGiaiTho={cauSanHienTai.loiGiaiTho}
                    dapAnDung={cauSanHienTai.dung}
                    daChon={ketQuaSan.daChon}
                    phuongAn={cauSanHienTai.phuongAn}
                    duPhong={cauSanHienTai.giaiThich}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setCauSanHienTai(null); setKetQuaSan(null) }}
                  className="btn-google-outlined text-xs py-2 px-4 rounded-full cursor-pointer"
                >
                  Rời sàn
                </button>
                {ketQuaSan !== null && dsQuaiConLai.length > 0 && (
                  <button
                    type="button"
                    onClick={goiQuaiTiepTheo}
                    className="py-2 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Quái tiếp theo →
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-300 text-center sm:text-left">
              Cần luyện thêm đề thi hoặc làm bài tập về nhà để tăng cường giáp bền trước khi đi săn Boss?
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onChuyenSangVaoThi}
                className="btn-google-primary !bg-purple-600 hover:!bg-purple-700 text-white text-xs py-1.5 px-3 rounded-full flex items-center gap-1 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Vào phòng thi</span>
              </button>
              <button
                onClick={onChuyenSangBtvn}
                className="btn-google-outlined text-xs py-1.5 px-3 rounded-full cursor-pointer"
              >
                Bài Tập Về Nhà →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KỶ LỤC CỦA RIÊNG EM.
          Bản trước là "Bảng Xếp Hạng Thần Thú Cả Lớp" với hạng 2 và hạng 3 là
          HAI BẠN BỊA, CP tính ngược từ CP của em (× 0,88 và × 0,76), và em thì
          LUÔN LUÔN hạng 1 kèm nhãn "Bậc Thầy Hóa Học" bất kể học lực.
          Không có một byte dữ liệu bạn học nào trong máy để dựng bảng đó. Nói
          với học sinh rằng đây là xếp hạng cả lớp là bịa — nên bỏ hẳn, thay
          bằng kỷ lục thật của chính em. Muốn có bảng chung toàn trung tâm thì
          phải có máy chủ, làm sau. */}
      {daChonThu && tabGame === 'xep_hang' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Kỷ Lục Của Em</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Toàn bộ số dưới đây lấy từ chính máy này. Chưa có bảng xếp hạng chung
              toàn trung tâm — khi nào có thì mới hiện.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { nhan: 'Hình thái', so: layHinhThai(hoSo.capDo).ten, phu: `${hoSo.capDo}/${CAP_TOI_DA}` },
              { nhan: 'Lực chiến', so: chiSoPet.cp.toLocaleString(), phu: 'CP' },
              { nhan: 'Tầng tháp cao nhất', so: String(hoSo.tangThapCaoNhat), phu: 'tầng' },
              { nhan: 'Câu sai đã thanh tẩy', so: String(hoSo.soCauDaThanhTay), phu: 'câu' },
            ].map((o) => (
              <div key={o.nhan} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{o.nhan}</div>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-1 leading-tight">{o.so}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{o.phu}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Đường lên hình thái tối thượng
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: CAP_TOI_DA }, (_, i) => i + 1).map((c) => {
                const qua = c <= hoSo.capDo
                return (
                  <span key={c}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      qua
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    }`}>
                    {c}. {layHinhThai(c).ten}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
