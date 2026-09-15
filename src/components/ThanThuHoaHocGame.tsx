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

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
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
  type HoSoThanThuLuu,
  type CapTienHoa,
  type HeNguyenTo,
  type ThanThuInfo,
} from '../game/than-thu-hoa-hoc/he-thong-pet'
import { layHinhThai, CAP_TOI_DA } from '../game/than-thu-hoa-hoc/hinh-thai'
import { nhanExp, NGUON_EXP, BANG_NGUON_EXP } from '../game/than-thu-hoa-hoc/kinh-nghiem'
import {
  KHO_CAU_HOI, bacTheoTang, chiSoTheoBac, type CauHoi,
} from '../game/than-thu-hoa-hoc/kho-cau-hoi'
import {
  doiCauSaiThanhCauChoi, locTheoBac, TEN_LY_DO,
  type CauHoiCuaEm, type CauSaiTho, type KetQuaDoiCau,
} from '../game/than-thu-hoa-hoc/cau-hoi-cua-em'
import { veThanThuCanvas, khungVeThanThu } from '../game/than-thu-hoa-hoc/ve-than-thu'
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
  /**
   * Lấy danh sách câu em đã làm SAI, kèm nhãn `chuyenDe` / `mucDo` / `dang`
   * thầy gắn trong kho đề — đúng nguồn mục Khắc Phục Câu Sai đang dùng.
   *
   * Là HÀM GỌI LẠI chứ không phải số báo danh: game vẫn không biết em là ai,
   * cổng học sinh gọi máy chủ rồi đưa kết quả xuống.
   */
  layCauSaiCuaEm?: () => Promise<CauSaiTho[]>
  onDong: () => void
  onChuyenSangKhacPhuc: () => void
  onChuyenSangBtvn: () => void
  onChuyenSangVaoThi: () => void
}

type TabGame = 'dao_thu' | 'leo_thap' | 'san_cau_sai' | 'xep_hang'

/** Sổ ghi câu sai đã làm đúng lại — để mỗi câu chỉ trả EXP một lần trong đời. */
const KHOA_QID_THANH_TAY = 'omr_than_thu_qid_thanh_tay'

const TEN_HE: Record<HeNguyenTo, string> = {
  hoa: 'Hoả · nhiệt nhôm',
  axit: 'Acid · ăn mòn',
  kiem: 'Base · kết tủa',
  khi: 'Khí · halogen',
}

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
        },
      )
      animId = requestAnimationFrame(ve)
    }
    animId = requestAnimationFrame(ve)
    return () => cancelAnimationFrame(animId)
  }, [canvasRef, info, cap, hieuUngRef, dangHien])
}

export default function ThanThuHoaHocGame({
  dsLichSu,
  dsBtvn,
  layCauSaiCuaEm,
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

  const infoPet = DANH_SACH_THAN_THU[hoSo.idThanhThuChon] || DANH_SACH_THAN_THU['hoa_long']!
  const chiSoPet = useMemo(() => {
    return tinhLucChienPet({
      capDo: hoSo.capDo,
      capTienHoa: hoSo.capDo as CapTienHoa,
      diemTrungBinh: chiSoHocTap.diemTb,
      tyLeBtvn: chiSoHocTap.tyLeBtvn,
    })
  }, [hoSo.capDo, hoSo.capTienHoa, chiSoHocTap])

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
   * CỘNG EXP — ĐƯỜNG DUY NHẤT. Mọi nguồn đều đi qua đây.
   *
   * Trước đây mỗi chỗ tự viết nhánh lên cấp riêng, và chỗ thắng tháp quên viết:
   * leo hai mươi tầng vẫn Lv.1, thanh EXP tràn rồi bị Math.min(100,…) che đi.
   */
  const congExp = useCallback((them: number, viec: string) => {
    if (them <= 0) return
    amThanhRef.current?.moKhoa()
    setHoSo((prev) => {
      const kq = nhanExp({ capDo: prev.capDo, exp: prev.exp }, them)
      if (kq.soCapLen > 0) {
        amThanhRef.current?.tienHoa()
        setTinTienHoa({ cap: kq.capDo, ten: layHinhThai(kq.capDo).ten })
      }
      return {
        ...prev,
        capDo: kq.capDo,
        capTienHoa: kq.capTienHoa,
        exp: kq.exp,
        expToiDa: kq.expToiDa,
        danhHieuHienTai: `${layHinhThai(kq.capDo).ten} · Lv.${kq.capDo}`,
      }
    })
    setViecVuaLam(viec + ' · +' + them + ' EXP')
  }, [])

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
  useEffect(() => () => { conGanRef.current = false }, [])

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
  const [ketQuaSan, setKetQuaSan] = useState<{ dung: boolean; giai: string } | null>(null)

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
      setKetQuaSan({ dung: true, giai: q.giaiThich })
      // Chốt EXP theo qid: đã trả rồi thì thôi, dù em bấm lại bao nhiêu lần.
      setQidDaThanhTay((truoc) => {
        if (truoc.includes(q.qid)) return truoc
        const sau = [...truoc, q.qid]
        setHoSo((h) => ({ ...h, soCauDaThanhTay: sau.length }))
        congExp(NGUON_EXP.suaCauSai(), `Hạ quái câu sai: ${q.tenDang || q.chuyenDe}`)
        return sau
      })
    } else {
      amThanhRef.current?.saiCauHoi()
      amThanhRef.current?.trungDon()
      setKetQuaSan({ dung: false, giai: q.giaiThich })
    }
  }, [cauSanHienTai, ketQuaSan, congExp])

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

    let tong = 0
    const viec: string[] = []
    for (const ca of dsLichSu) {
      const khoa = 'ca_' + String((ca as { maCa?: string; id?: string }).maCa ?? (ca as { id?: string }).id ?? '')
      if (khoa === 'ca_' || daNhan[khoa]) continue
      if (typeof ca.tong !== 'number' || Number.isNaN(ca.tong)) continue
      daNhan[khoa] = true
      tong += NGUON_EXP.caThi(ca.tong)
      viec.push('ca thi')
    }
    let btvn = 0
    for (const bt of dsBtvn) {
      if (!bt.daNop) continue
      const khoa = 'bt_' + String((bt as { id?: string }).id ?? '')
      if (khoa === 'bt_' || daNhan[khoa]) continue
      daNhan[khoa] = true
      tong += NGUON_EXP.nopBtvn()
      btvn++
    }
    if (btvn > 0) viec.push(btvn + ' bài tập')
    try { localStorage.setItem(KHOA_DA_NHAN, JSON.stringify(daNhan)) } catch { /* bỏ qua */ }

    if (tong <= 0) { setViecVuaLam('Chưa có việc học nào mới để quy đổi'); return }
    congExp(tong, 'Quy đổi ' + viec.join(' + '))
  }, [dsLichSu, dsBtvn, congExp])

  // Đổi linh thú khác
  const doiThanhThu = (idMoi: string) => {
    amThanhRef.current?.moKhoa()
    amThanhRef.current?.tanCong()
    setHoSo((prev) => ({ ...prev, idThanhThuChon: idMoi }))
  }

  // State cho mini-game LEO THÁP TRI THỨC
  const [dangLeoThap, setDangLeoThap] = useState(false)
  const [tangHienTai, setTangHienTai] = useState(1)
  const [mauBoss, setMauBoss] = useState(100)
  const [mauPetCombat, setMauPetCombat] = useState(100)
  const [mauBossToiDa, setMauBossToiDa] = useState(100)
  /** Khoá câu đang hỏi: `qid` thật khi là câu của em, `kho_<i>` khi mượn kho chung. */
  const [khoaCauHienTai, setKhoaCauHienTai] = useState('')
  const [daHoiCau, setDaHoiCau] = useState<string[]>([])
  /** Đang chờ 1,2–1,8 giây sang câu/tầng kế: khoá đồng hồ và khoá bấm. */
  const [dangChoSangTang, setDangChoSangTang] = useState(false)
  const [thongBaoChienDau, setThongBaoChienDau] = useState('')
  const [cauHoiHienTai, setCauHoiHienTai] = useState<CauHoi | null>(null)
  const [thoiGianConLaiCau, setThoiGianConLaiCau] = useState(15)

  // Danh sách câu hỏi hóa học mẫu phong phú cho leo tháp
  /** Hệ của trùm tầng N — xoay vòng 4 hệ để mỗi tầng là một bài tương khắc khác. */
  const heTrumTang = useCallback((tang: number): HeNguyenTo => {
    const ds: HeNguyenTo[] = ['khi', 'kiem', 'axit', 'hoa']
    return ds[Math.max(0, Math.round(tang) - 1) % 4]!
  }, [])

  /** Máu trùm tầng N. Càng lên cao càng dày — trước đây tầng nào cũng 100. */
  const mauTrumTang = useCallback((tang: number) => 100 + Math.max(0, Math.round(tang) - 1) * 18, [])

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
    setThongBaoChienDau(`Tầng ${tang} — trùm hệ ${TEN_HE[heTrumTang(tang)]}. ${tkMo.thongDiep}`)
    raCauHoiMoi([], tang)
  }

  /**
   * Rút câu CHƯA HỎI trong lượt leo này. Trước đây rút thuần ngẫu nhiên nên
   * tầng 2 lặp lại y hệt câu tầng 1.
   */
  const raCauHoiMoi = useCallback((daHoi: string[], tang: number) => {
    const bac = bacTheoTang(tang)
    // ƯU TIÊN CÂU CỦA CHÍNH EM. Chỉ khi em chưa có câu sai nào đọc được mới
    // mượn kho chung — và màn hình nói rõ đang mượn, không giả vờ là câu của em.
    const nguon: { cau: CauHoi; khoa: string }[] = dsCauCuaEm.length > 0
      ? locTheoBac(dsCauCuaEm, bac).map((c) => ({ cau: c as CauHoi, khoa: c.qid }))
      : chiSoTheoBac(bac).map((i) => ({ cau: KHO_CAU_HOI[i]!, khoa: 'kho_' + i }))
    if (nguon.length === 0) return
    // Tránh hỏi lại câu đã hỏi trong lượt leo này; hết câu mới thì cho lặp.
    const conLai = nguon.filter((x) => !daHoi.includes(x.khoa))
    const chon = conLai.length > 0 ? conLai : nguon
    const x = chon[Math.floor(Math.random() * chon.length)]!
    setKhoaCauHienTai(x.khoa)
    setCauHoiHienTai(x.cau)
    setThoiGianConLaiCau(15)
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
    if (!dangLeoThap || !cauHoiHienTai || dangChoSangTang) return
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
  }, [dangLeoThap, cauHoiHienTai, dangChoSangTang])

  const xuLyTraLoi = (idxChon: number) => {
    if (!cauHoiHienTai || dangChoSangTang) return
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
        setDangChoSangTang(true)
        const thuong = NGUON_EXP.leoThap(tangHienTai)
        setThongBaoChienDau(`${infoPet.kyNangNo}! Hạ trùm tầng ${tangHienTai} — +${thuong} EXP`)
        setHoSo((prev) => ({
          ...prev,
          tangThapCaoNhat: Math.max(prev.tangThapCaoNhat, tangHienTai + 1),
        }))
        congExp(thuong, `Hạ trùm tầng ${tangHienTai}`)
        setTimeout(() => {
          const tangMoi = tangHienTai + 1
          setTangHienTai(tangMoi)
          setMauBoss(mauTrumTang(tangMoi))
          setMauBossToiDa(mauTrumTang(tangMoi))
          setDangChoSangTang(false)
          raCauHoiMoi(daHoi, tangMoi)
        }, 1800)
      } else {
        setDangChoSangTang(true)
        setTimeout(() => { setDangChoSangTang(false); raCauHoiMoi(daHoi, tangHienTai) }, 1200)
      }
    } else {
      amThanhRef.current?.saiCauHoi()
      amThanhRef.current?.trungDon()
      // Giáp thật sự đỡ đòn.
      const tk = tinhHeSoTuongKhac(heTrumTang(tangHienTai), infoPet.he)
      const satThuongBoss = Math.max(
        1,
        Math.round((28 + tangHienTai * 3) * tk.heSo - chiSoPet.giap * 0.25),
      )
      const mauPetMoi = Math.max(0, mauPetCombat - satThuongBoss)
      setMauPetCombat(mauPetMoi)
      batHieuUng('biDanh', 700)
      const loi = idxChon === -1 ? 'Hết giờ!' : 'Sai rồi!'
      setThongBaoChienDau(`${loi} Mất ${satThuongBoss} máu. ${cauHoiHienTai.giaiThich}`)

      if (mauPetMoi <= 0) {
        setThongBaoChienDau('Thần thú kiệt sức. Đi sửa câu sai và nộp bài để lấy EXP rồi quay lại.')
        setCauHoiHienTai(null)
      } else {
        setDangChoSangTang(true)
        setTimeout(() => { setDangChoSangTang(false); raCauHoiMoi(daHoi, tangHienTai) }, 1500)
      }
    }
  }

  // Đồng hồ gọi xuLyTraLoi qua ref: hàm này dựng lại mỗi lần vẽ, giữ bản mới nhất.
  const xuLyTraLoiRef = useRef(xuLyTraLoi)
  useEffect(() => { xuLyTraLoiRef.current = xuLyTraLoi })

  // Hai canvas, một con thú. Canvas nào không hiện thì không quay vòng lặp.
  useVeThanThu(canvasRef, infoPet, hoSo.capTienHoa, hieuUngYenRef, tabGame === 'dao_thu')
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

        {/* 4 Tabs Chế Độ Game */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
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

      {/* NỘI DUNG TAB 1: ĐẢO THẦN THÚ */}
      {tabGame === 'dao_thu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Cột trái: Khung hiển thị thần thú tương tác Canvas */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden">
            {/* Header thú cưng */}
            <div className="w-full flex items-center justify-between z-10">
              <div className="text-left">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                  Hình thái {hoSo.capDo}/{CAP_TOI_DA} · {layHinhThai(hoSo.capDo).ten}
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {infoPet.ten}
                </h2>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {infoPet.danhHieu}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-black text-amber-500 font-mono">
                  CP: {chiSoPet.cp.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">Lực chiến tổng</div>
              </div>
            </div>

            {/* Canvas động vẽ thần thú */}
            <div className="my-2 relative flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={280}
                height={260}
                className="max-w-full drop-shadow-lg"
              />
            </div>

            {/* Thanh kinh nghiệm EXP & Nút Nạp Năng Lượng */}
            <div className="w-full space-y-3 z-10">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  Cấp độ: <strong className="text-emerald-600 text-sm">Lv.{hoSo.capDo}</strong>
                </span>
                <span className="font-mono text-slate-500 tabular-nums">
                  {hoSo.capDo >= CAP_TOI_DA
                    ? 'ĐÃ TỚI ĐỈNH'
                    : `EXP: ${hoSo.exp} / ${hoSo.expToiDa}`}
                </span>
              </div>

              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${hoSo.capDo >= CAP_TOI_DA
                      ? 100
                      : Math.max(0, Math.min(100, (hoSo.exp / Math.max(1, hoSo.expToiDa)) * 100))}%`,
                  }}
                />
              </div>

              <div className="text-center text-[11px] text-slate-500 dark:text-slate-400">
                {hoSo.capDo >= CAP_TOI_DA
                  ? 'Hình thái tối thượng — không còn cấp nào cao hơn'
                  : `Còn ${Math.max(0, hoSo.expToiDa - hoSo.exp)} EXP nữa lên ${layHinhThai(hoSo.capDo + 1).ten}`}
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={nhanExpTuHocTap}
                  className="py-2.5 px-5 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Quy đổi việc học thành EXP</span>
                </button>
              </div>
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
            </div>

            {/* Chọn đổi linh thú 4 hệ */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Chọn Thần Thú Đồng Hành
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(DANH_SACH_THAN_THU).map((pet) => {
                  const isSelect = hoSo.idThanhThuChon === pet.id
                  return (
                    <button
                      key={pet.id}
                      onClick={() => doiThanhThu(pet.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelect
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="text-xs font-bold line-clamp-1">{pet.ten}</div>
                      <div className="text-[10px] text-slate-500">{TEN_HE[pet.he]}</div>
                    </button>
                  )
                })}
              </div>
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
      {tabGame === 'leo_thap' && (
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
                    Trùm Tầng {tangHienTai}: Quái Hóa Hắc Ám
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

              {/* Khung câu hỏi Q&A chiến đấu */}
              {cauHoiHienTai && mauPetCombat > 0 && mauBoss > 0 && (
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
      {tabGame === 'san_cau_sai' && (
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
                <div
                  className={`p-3 rounded-xl text-xs leading-relaxed ${
                    ketQuaSan.dung
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <b>{ketQuaSan.dung ? `Hạ quái! +${NGUON_EXP.suaCauSai()} EXP.` : 'Vẫn sai. Không có EXP câu này.'}</b>
                  {ketQuaSan.giai !== '' && <> {ketQuaSan.giai}</>}
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
      {tabGame === 'xep_hang' && (
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
