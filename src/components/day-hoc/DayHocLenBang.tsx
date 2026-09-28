// BẢNG DẠY HỌC — mục Lên bảng của app thầy (thầy lệnh 28/09: "thêm cho tôi một bảng thủ công DẠY HỌC"). BA BƯỚC:
//  1 · ĐIỂM DANH — nút "Điểm danh" mở buổi học trên máy chủ + chiếu mã 6 số & QR (tấm phủ `TamPhuChieuMa`, cùng kiểu Chiếu mã vào thi);
//      em trên app học sinh nhập/quét mã ⇒ vào danh sách CÓ MẶT (tự làm mới 5 giây qua nhịp chung `useNhipThay` như phòng chờ ca thi);
//      thầy thêm/bớt tay được (chọn từ lớp).
//  2 · CHỌN CÂU — hộp tích chọn RIÊNG cây thư mục DẠY HỌC của kho (`locDeDayHoc`), tích tờ/bài rồi bỏ từng câu; KHÔNG lọc tự luận.
//  3 · CHIẾU — màn chiếu MỚI (`dungToChieuDayHoc` → `taoHtmlMayChieu`, lớp bản vẽ 28/09): đủ từng câu thầy chọn. "Chiếu lên bảng" ⇒ app chọn em
//      CÓ MẶT có khả năng làm đúng cao nhất cho từng câu (`chon-em-day-hoc.ts`); "Đổi em khác"; "Đúng" / "Sai" ghi bằng `ghiLenBang` (đường ghi sẵn có).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, MonitorPlay, Plus, RefreshCw, Shuffle, UserCheck, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import type { TeacherExamSource } from '../../data/examContent'
import KhungXemPhieu from '../KhungXemPhieu'
import HopChonDe from '../HopChonDe'
import TamPhuChieuMa, { type ChuTamPhu, type PhongChoChieu } from '../TamPhuChieuMa'
import { hoiXacNhan } from '../hop-thoai'
import { useGhiToChieu } from '../chien-dich/ghi-to-chieu'
import { NHIP_PHONG_CHO_THAY, TUY_CHON_NHIP_THAY, useNhipThay } from '../../lib/nhip-may-thay'
import { layLopThay, type LopThay } from '../../lib/ten-lop-thay'
import {
  botEmBuoi,
  buoiDangMo,
  dongBuoiHoc,
  laySucHoc,
  linkDiemDanh,
  moBuoiHoc,
  themEmBuoi,
  xemBuoiHoc,
  locEmThem,
  type TrangThaiBuoi,
} from '../../lib/buoi-hoc-api'
import { cauTuDeChon, demCau, dungToChieuDayHoc, khoDayHoc, tomTatDe, type CauDayHoc, type EmLenCau } from '../../lib/day-hoc-len-bang'
import { chonEmChoCau, mucCauSo, TEN_MUC_CAU, xepEmChoDanhSach, type KetQuaChon, type SucHocEm } from '../../lib/chon-em-day-hoc'
import { khoaToChieu } from '../../lib/to-chieu-cau-noi'
import './day-hoc.css'

export const CHU_DIEM_DANH: ChuTamPhu = {
  tenMa: 'Mã điểm danh',
  vungMa: 'Mã điểm danh',
  nhanMa: 'ĐIỂM DANH BUỔI HỌC',
  tenHop: 'Chiếu mã điểm danh',
  danhSach: 'Đã điểm danh',
  chuRong: 'Chưa em nào điểm danh. Màn tự cập nhật mỗi 5 giây.',
  aria: 'Mã QR điểm danh',
}

/** Nhớ trên máy theo buổi: đề đã tích, câu đã bỏ, em đã giao. Hỏng/không có ⇒ bắt đầu trống. */
interface NhoBuoi {
  maChon: string[]
  boCau: string[]
  giao: Record<string, { sbd: string; hoTen: string; xacSuat: number; uocLuong: boolean; lyDo: string; boQua: string[] }>
}
const khoaNho = (id: string) => `ddh.dayHoc.${id}`
function docNhoBuoi(id: string): NhoBuoi {
  try {
    const j = JSON.parse(localStorage.getItem(khoaNho(id)) || 'null') as Partial<NhoBuoi> | null
    return { maChon: Array.isArray(j?.maChon) ? j!.maChon : [], boCau: Array.isArray(j?.boCau) ? j!.boCau : [], giao: j?.giao && typeof j.giao === 'object' ? j.giao : {} }
  } catch {
    return { maChon: [], boCau: [], giao: {} }
  }
}
function ghiNhoBuoi(id: string, n: NhoBuoi) {
  try {
    localStorage.setItem(khoaNho(id), JSON.stringify(n))
  } catch {
    /* máy chặn bộ nhớ: chỉ mất phần nhớ khi tải lại */
  }
}

const TEN_PHAN: Record<CauDayHoc['phan'], string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }
const gio = (iso: string) => {
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : ''
}
const tenNgan = (hoTen: string, sbd: string) => {
  const t = hoTen.split(/\s+/).filter(Boolean)
  return t.length ? (t.length >= 3 ? t.slice(-2).join(' ') : t.join(' ')) : `SBD ${sbd}`
}
const pt = (x: number) => `${Math.round(x * 100)}%`

export default function DayHocLenBang() {
  const showToast = useAppStore((s) => s.showToast)

  // ───── 1 · ĐIỂM DANH ─────
  const [dsLop, setDsLop] = useState<LopThay[]>([])
  const [lopChon, setLopChon] = useState('')
  const [tt, setTt] = useState<TrangThaiBuoi | null>(null)
  const [dangTaiBuoi, setDangTaiBuoi] = useState(true)
  const [loiBuoi, setLoiBuoi] = useState('')
  const [dangMo, setDangMo] = useState(false)
  const [chieuMa, setChieuMa] = useState(false)
  const [themMo, setThemMo] = useState(false)
  const [timEm, setTimEm] = useState('')
  const [emThem, setEmThem] = useState<Set<string>>(new Set())
  const [lopThem, setLopThem] = useState<string | null>(null)
  const [dangThem, setDangThem] = useState(false)
  // QR mở APP HỌC SINH trên cùng gốc Pages với app thầy (`<gốc>/hs?diem-danh=<mã>`).
  const goc = typeof window !== 'undefined' ? window.location.origin : ''
  const idBuoi = tt?.buoi.id ?? ''

  useEffect(() => {
    void layLopThay().then((r) => r.ok && setDsLop(r.du.lop))
    void (async () => {
      const r = await buoiDangMo()
      if (!r.ok) {
        setLoiBuoi(r.loai === 'chua_co_lenh' ? r.chu : '')
        setDangTaiBuoi(false)
        return
      }
      const b = r.du[0]
      if (b) {
        const x = await xemBuoiHoc(b.id, true)
        if (x.ok) setTt(x.du)
      }
      setDangTaiBuoi(false)
    })()
  }, [])

  const capNhat = useCallback(
    (x: TrangThaiBuoi) =>
      setTt((cu) => ({ ...x, lopEm: x.lopEm ?? cu?.lopEm ?? null })),
    [],
  )
  const lamMoi = useCallback(async () => {
    if (!idBuoi) return true
    const r = await xemBuoiHoc(idBuoi)
    if (!r.ok) return false
    capNhat(r.du)
    return true
  }, [idBuoi, capNhat])
  // TỰ LÀM MỚI 5 GIÂY qua nhịp chung của app thầy (không gọi chồng, tab ẩn không gọi, lỗi lùi dần) — chỉ khi buổi đang mở và KHÔNG đang chiếu mã
  // (tấm chiếu mã tự hỏi 5 giây của riêng nó).
  useNhipThay(lamMoi, NHIP_PHONG_CHO_THAY, !!tt?.buoi.dangMo && !chieuMa, TUY_CHON_NHIP_THAY.phongCho)

  const batDauDiemDanh = async () => {
    setDangMo(true)
    const r = await moBuoiHoc(lopChon)
    setDangMo(false)
    if (!r.ok) {
      showToast(r.chu, 'error')
      return
    }
    setTt(r.du)
    setChieuMa(true)
  }
  const hoiPhongCho = useCallback(async (): Promise<PhongChoChieu> => {
    if (!idBuoi) throw new Error('chưa có buổi')
    const r = await xemBuoiHoc(idBuoi)
    if (!r.ok) throw new Error(r.chu)
    capNhat(r.du)
    return {
      em: r.du.coMat.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen })),
      siSo: r.du.siSo,
      ...(r.du.ma ? { ma: r.du.ma, link: linkDiemDanh(goc, r.du.ma) } : {}),
    }
  }, [idBuoi, goc, capNhat])

  const ketThuc = async () => {
    if (!idBuoi) return
    const ok = await hoiXacNhan({
      tieuDe: 'Kết thúc buổi học?',
      noiDung: 'Mã điểm danh hết hiệu lực ngay; em chưa điểm danh sẽ không vào được nữa. Danh sách có mặt và kết quả lên bảng vẫn giữ.',
      nhanDongY: 'Kết thúc buổi',
      nhanKhong: 'Chưa',
    })
    if (!ok) return
    const r = await dongBuoiHoc(idBuoi)
    if (!r.ok) showToast(r.chu, 'error')
    else {
      capNhat(r.du)
      showToast('Đã kết thúc buổi học', 'success')
    }
  }
  const botEm = async (sbd: string) => {
    if (!idBuoi) return
    const r = await botEmBuoi(idBuoi, sbd)
    if (!r.ok) showToast(r.chu, 'error')
    else capNhat(r.du)
  }
  const themEm = async () => {
    if (!idBuoi || !emThem.size || dangThem) return
    setDangThem(true)
    const r = await themEmBuoi(idBuoi, [...emThem])
    setDangThem(false)
    if (!r.ok) showToast(r.chu, 'error')
    else {
      capNhat(r.du)
      showToast(`Đã thêm ${emThem.size} em vào danh sách có mặt`, 'success')
      setEmThem(new Set())
    }
  }
  const moThem = async () => {
    setThemMo(true)
    if (idBuoi && !tt?.lopEm) {
      const r = await xemBuoiHoc(idBuoi, true)
      if (r.ok) setTt(r.du)
    }
  }
  const coMat = useMemo(() => tt?.coMat ?? [], [tt])
  const lopCuaEm = useMemo(() => new Map((tt?.lopEm ?? []).map((e) => [e.sbd, e.tenLop])), [tt])
  const coMatMap = useMemo(() => new Map(coMat.map((e) => [e.sbd, e])), [coMat])
  const dsLopThem = useMemo(() => [...new Set((tt?.lopEm ?? []).map((e) => e.tenLop).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')), [tt])
  // Mặc định lọc theo lớp của buổi; thầy đổi sang "Mọi lớp" khi em học ghép.
  const lopLoc = lopThem ?? tt?.buoi.lop ?? ''
  const emLoc = useMemo(() => locEmThem(tt?.lopEm ?? [], lopLoc, timEm), [tt, lopLoc, timEm])
  const TOI_DA_HIEN = 150

  // ───── 2 · CHỌN CÂU ─────
  const [kho, setKho] = useState<TeacherExamSource[] | null>(null)
  const [hopMo, setHopMo] = useState(false)
  const [maTam, setMaTam] = useState<Set<string>>(new Set())
  const [maChon, setMaChon] = useState<Set<string>>(new Set())
  const [boCau, setBoCau] = useState<Set<string>>(new Set())
  const [giao, setGiao] = useState<NhoBuoi['giao']>({})
  const daNap = useRef('')
  useEffect(() => {
    // Nạp phần nhớ của buổi (đề đã tích, câu bỏ, em đã giao) một lần mỗi buổi.
    const k = idBuoi || '_'
    if (daNap.current === k) return
    daNap.current = k
    const n = docNhoBuoi(k)
    setMaChon(new Set(n.maChon))
    setBoCau(new Set(n.boCau))
    setGiao(n.giao)
  }, [idBuoi])
  useEffect(() => {
    if (daNap.current) ghiNhoBuoi(daNap.current, { maChon: [...maChon], boCau: [...boCau], giao })
  }, [maChon, boCau, giao])

  const napKho = useCallback(async () => {
    if (kho) return kho
    try {
      const [{ loadExamSources }, { khuTrungNguon }, { tachNhieuTheoPhan }] = await Promise.all([
        import('../../lib/exam-db'),
        import('../../lib/khu-trung-cau'),
        import('../../lib/tach-phan-de'),
      ])
      const ds = khoDayHoc(await loadExamSources(), khuTrungNguon, tachNhieuTheoPhan)
      setKho(ds)
      return ds
    } catch {
      setKho([])
      return []
    }
  }, [kho])
  useEffect(() => {
    if (maChon.size && !kho) void napKho()
  }, [maChon, kho, napKho])

  const tatCaCau = useMemo(() => (kho ? cauTuDeChon(kho, maChon) : []), [kho, maChon])
  const cauChieu = useMemo(() => tatCaCau.filter((c) => !boCau.has(c.khoa)), [tatCaCau, boCau])
  const demTam = useMemo(() => demCau(kho ? cauTuDeChon(kho, maTam) : []), [kho, maTam])
  const dem = demCau(cauChieu)

  // ───── 3 · CHIẾU ─────
  const [html, setHtml] = useState('')
  const [dangChieu, setDangChieu] = useState(false)
  const [sucHoc, setSucHoc] = useState<Record<string, SucHocEm>>({})
  const { ketQua, moPhien, ganO, dongPhien, ghi } = useGhiToChieu(idBuoi ? `day-hoc|${idBuoi}` : '')

  const moTo = async (coEm: boolean, giaoMoi = giao) => {
    if (!cauChieu.length) {
      showToast('Chưa chọn câu nào để chiếu', 'warn')
      return
    }
    setDangChieu(true)
    try {
      const ma = moPhien()
      const m = new Map<string, EmLenCau>()
      if (coEm)
        for (const c of cauChieu) {
          const g = giaoMoi[c.khoa]
          if (!g) continue
          const lan = cauChieu.slice(0, cauChieu.indexOf(c) + 1).filter((x) => giaoMoi[x.khoa]?.sbd === g.sbd).length
          m.set(c.khoa, { sbd: g.sbd, hoTen: g.hoTen, lop: lopCuaEm.get(g.sbd) || tt?.buoi.lop || undefined, lanLenBang: lan })
        }
      const { html: h, o } = await dungToChieuDayHoc(cauChieu, m, `Dạy học · ${tt?.buoi.ten || 'Buổi học'}`, coEm ? ma : undefined)
      ganO(ma, o)
      setHtml(h)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không mở được tờ máy chiếu', 'warn')
    } finally {
      setDangChieu(false)
    }
  }

  const cauChon = (c: CauDayHoc) => ({ qid: c.qid, maDang: c.maDang, chuyenDe: c.chuyenDe, mucDo: c.mucDo })
  const napSucHoc = async (): Promise<Record<string, SucHocEm>> => {
    const r = await laySucHoc(
      coMat.map((e) => e.sbd),
      cauChieu.map((c) => ({ qid: c.qid, maDang: c.maDang, chuyenDe: c.chuyenDe })),
    )
    if (!r.ok) {
      showToast(`${r.chu} — app chọn em theo ước lượng.`, 'warn')
      return {}
    }
    setSucHoc(r.du)
    return r.du
  }

  const chieuLenBang = async () => {
    if (!coMat.length || !cauChieu.length) return
    setDangChieu(true)
    const sh = await napSucHoc()
    const kq = xepEmChoDanhSach(cauChieu.map(cauChon), coMat, sh)
    const moi: NhoBuoi['giao'] = {}
    cauChieu.forEach((c, i) => {
      const k = kq[i]
      if (k) moi[c.khoa] = { sbd: k.sbd, hoTen: k.hoTen, xacSuat: k.xacSuat, uocLuong: k.uocLuong, lyDo: k.lyDo, boQua: [] }
    })
    setGiao(moi)
    await moTo(true, moi)
  }

  const doiEm = async (c: CauDayHoc) => {
    const cu = giao[c.khoa]
    const sh = Object.keys(sucHoc).length ? sucHoc : await napSucHoc()
    const daGoi: Record<string, number> = {}
    for (const x of cauChieu) if (x.khoa !== c.khoa && giao[x.khoa]) daGoi[giao[x.khoa]!.sbd] = (daGoi[giao[x.khoa]!.sbd] ?? 0) + 1
    const boQua = new Set([...(cu?.boQua ?? []), ...(cu ? [cu.sbd] : [])])
    let k: KetQuaChon | null = chonEmChoCau(cauChon(c), coMat, sh, daGoi, boQua)
    if (!k) {
      // Đã đổi qua hết lớp ⇒ quay vòng lại từ đầu (chỉ trừ em đang đứng).
      boQua.clear()
      if (cu) boQua.add(cu.sbd)
      k = chonEmChoCau(cauChon(c), coMat, sh, daGoi, boQua)
    }
    if (!k) {
      showToast('Không còn em nào khác có mặt', 'warn')
      return
    }
    const moi = { ...giao, [c.khoa]: { sbd: k.sbd, hoTen: k.hoTen, xacSuat: k.xacSuat, uocLuong: k.uocLuong, lyDo: k.lyDo, boQua: [...boQua] } }
    setGiao(moi)
    if (html) await moTo(true, moi)
  }

  const ghiKq = async (c: CauDayHoc, dat: boolean) => {
    const g = giao[c.khoa]
    if (!g) return
    await ghi(khoaToChieu(g.sbd, c.qid), { sbd: g.sbd, hoTen: g.hoTen, qid: c.qid, chuyenDe: c.chuyenDe || 'Dạy học' }, dat)
  }

  const coGiao = cauChieu.some((c) => giao[c.khoa])
  const buoiXong = !!tt && !tt.buoi.dangMo

  return (
    <div className="dh-trang" data-khoi="day-hoc-len-bang">
      <header className="dh-dau">
        <h1>Dạy học</h1>
        <p>Điểm danh lấy danh sách em học hôm nay → chọn câu trong kho Dạy học → chiếu lên máy chiếu. App gọi em có mặt có khả năng làm đúng câu cao nhất.</p>
      </header>

      {/* ───── BƯỚC 1 ───── */}
      <section className="dh-buoc" aria-labelledby="dh-b1">
        <div className="dh-buoc-dau">
          <span className="dh-so" aria-hidden="true">
            1
          </span>
          <div className="dh-buoc-ten">
            <h2 id="dh-b1">Điểm danh</h2>
            <p>{tt ? tt.buoi.ten : 'Mở buổi học, chiếu mã lên máy chiếu cho em điểm danh.'}</p>
          </div>
          {tt && <span className={`dh-chip${buoiXong ? ' dh-chip--xam' : ' dh-chip--xanh'}`}>{buoiXong ? 'Đã kết thúc' : 'Đang điểm danh'}</span>}
        </div>

        {dangTaiBuoi ? (
          <p className="dh-phu" aria-busy="true">
            Đang tìm buổi học đang mở…
          </p>
        ) : !tt || buoiXong ? (
          <div className="dh-hang">
            {loiBuoi && (
              <p className="dh-loi" role="alert">
                {loiBuoi}
              </p>
            )}
            <label className="dh-chon-lop">
              <span>Lớp học hôm nay</span>
              <select value={lopChon} onChange={(e) => setLopChon(e.target.value)}>
                <option value="">Mọi lớp (em lớp nào cũng điểm danh được)</option>
                {dsLop.map((l) => (
                  <option key={l.tenLop} value={l.tenLop}>
                    {l.tenLop} · {l.soEm} em
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="m3-nut-chinh dh-nut" onClick={() => void batDauDiemDanh()} disabled={dangMo}>
              <UserCheck size={18} aria-hidden="true" /> {dangMo ? 'Đang mở buổi…' : 'Điểm danh'}
            </button>
          </div>
        ) : null}

        {tt && (
          <>
            <div className="dh-dem">
              <b className="dh-so-lon">{coMat.length}</b>
              <span>
                {tt.siSo ? `/ ${tt.siSo} em` : 'em'} có mặt
                {tt.buoi.lop ? ` · ${tt.buoi.lop}` : ''}
              </span>
              {!buoiXong && (
                <span className="dh-dem-nut">
                  <button type="button" className="m3-nut-tonal dh-nut" onClick={() => setChieuMa(true)}>
                    <MonitorPlay size={18} aria-hidden="true" /> Chiếu mã điểm danh
                  </button>
                  <button type="button" className="m3-nut-vien dh-nut" onClick={() => (themMo ? setThemMo(false) : void moThem())} aria-expanded={themMo}>
                    <Plus size={18} aria-hidden="true" /> Thêm em chưa điểm danh được
                  </button>
                  <button type="button" className="m3-nut-chu dh-nut" onClick={() => void ketThuc()}>
                    Kết thúc buổi
                  </button>
                </span>
              )}
            </div>
            {coMat.length === 0 ? (
              <p className="dh-phu">Chưa em nào điểm danh. Bấm “Chiếu mã điểm danh” để em quét QR hoặc nhập mã; danh sách tự cập nhật mỗi 5 giây.</p>
            ) : (
              <ul className="dh-chip-ds" aria-label="Học sinh có mặt">
                {coMat.map((e) => (
                  <li key={e.sbd} className="dh-em">
                    <span className="dh-em-ten" title={`${e.hoTen || e.sbd} · điểm danh ${gio(e.luc)}${e.cach === 'thay' ? ' (thầy thêm)' : ''}`}>
                      {tenNgan(e.hoTen, e.sbd)}
                    </span>
                    {!buoiXong && (
                      <button type="button" className="dh-em-bo" onClick={() => void botEm(e.sbd)} aria-label={`Bớt ${e.hoTen || e.sbd} khỏi danh sách có mặt`}>
                        <X size={14} aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {themMo && !buoiXong && (
              <div className="dh-them" role="group" aria-labelledby="dh-them-ten">
                <div className="dh-them-dau">
                  <h3 id="dh-them-ten">Thêm em chưa điểm danh được</h3>
                  <button type="button" className="m3-nut-chu dh-nut" onClick={() => setThemMo(false)}>
                    Đóng
                  </button>
                </div>
                <p className="dh-phu">Em quên điện thoại hoặc không quét được mã: tích tên em rồi thêm vào danh sách có mặt (ghi là “thầy thêm”).</p>
                <div className="dh-hang">
                  <label className="dh-chon-lop dh-chon-lop--hep">
                    <span>Lớp</span>
                    <select value={lopLoc} onChange={(e) => setLopThem(e.target.value)}>
                      <option value="">Mọi lớp</option>
                      {dsLopThem.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="dh-chon-lop">
                    <span>Tìm theo SBD hoặc tên</span>
                    <input className="dh-tim" type="search" value={timEm} onChange={(e) => setTimEm(e.target.value)} placeholder="vd: 1203 hoặc minh anh" autoComplete="off" />
                  </label>
                </div>
                {!tt.lopEm ? (
                  <p className="dh-phu" aria-busy="true">
                    Đang tải danh sách lớp…
                  </p>
                ) : emLoc.length === 0 ? (
                  <p className="dh-phu">{timEm.trim() ? `Không có em nào khớp “${timEm.trim()}”${lopLoc ? ` trong lớp ${lopLoc} — thử chọn “Mọi lớp”` : ''}.` : 'Lớp này chưa có học sinh.'}</p>
                ) : (
                  <>
                    <ul className="dh-them-ds" aria-label="Danh sách học sinh để thêm">
                      {emLoc.slice(0, TOI_DA_HIEN).map((e) => {
                        const co = coMatMap.get(e.sbd)
                        return (
                          <li key={e.sbd} className="dh-them-dong">
                            <label className={`dh-them-o${co ? ' dh-them-o--co' : ''}`}>
                              <input
                                type="checkbox"
                                checked={!!co || emThem.has(e.sbd)}
                                disabled={!!co}
                                onChange={() =>
                                  setEmThem((cu) => {
                                    const m = new Set(cu)
                                    if (m.has(e.sbd)) m.delete(e.sbd)
                                    else m.add(e.sbd)
                                    return m
                                  })
                                }
                              />
                              <span className="dh-them-chu">
                                <span className="dh-them-ten">{e.hoTen || e.sbd}</span>
                                <small>
                                  SBD {e.sbd}
                                  {e.tenLop ? ` · ${e.tenLop}` : ''}
                                </small>
                              </span>
                            </label>
                            {co && <span className={`dh-chip ${co.cach === 'thay' ? 'dh-chip--vang' : 'dh-chip--xanh'}`}>{co.cach === 'thay' ? 'thầy thêm' : 'đã điểm danh'}</span>}
                            {co?.cach === 'thay' && (
                              <button type="button" className="m3-nut-chu dh-nut-nho" onClick={() => void botEm(e.sbd)} aria-label={`Bỏ ${e.hoTen || e.sbd} khỏi danh sách có mặt`}>
                                Bỏ
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                    {emLoc.length > TOI_DA_HIEN && <p className="dh-phu">Đang hiện {TOI_DA_HIEN} trong {emLoc.length} em — gõ tên hoặc SBD để lọc.</p>}
                  </>
                )}
                <div className="dh-hang">
                  <button type="button" className="m3-nut-chinh dh-nut" disabled={!emThem.size || dangThem} aria-busy={dangThem} onClick={() => void themEm()}>
                    Thêm {emThem.size} em vào danh sách có mặt
                  </button>
                  {emThem.size > 0 && (
                    <button type="button" className="m3-nut-chu dh-nut" onClick={() => setEmThem(new Set())}>
                      Bỏ chọn
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ───── BƯỚC 2 ───── */}
      <section className="dh-buoc" aria-labelledby="dh-b2">
        <div className="dh-buoc-dau">
          <span className="dh-so" aria-hidden="true">
            2
          </span>
          <div className="dh-buoc-ten">
            <h2 id="dh-b2">Chọn câu</h2>
            <p>Chỉ cây thư mục Dạy học của Ngân hàng câu hỏi. Câu tự luận cũng chiếu đủ.</p>
          </div>
          <button
            type="button"
            className="m3-nut-vien dh-nut"
            onClick={() => {
              setMaTam(new Set(maChon))
              setHopMo(true)
              void napKho()
            }}
          >
            {maChon.size ? 'Đổi bài' : 'Chọn bài trong kho Dạy học'}
          </button>
        </div>
        {maChon.size === 0 ? (
          <p className="dh-phu">Chưa chọn bài nào. Tích tờ / bài trong cây Dạy học, rồi bỏ bớt từng câu ở danh sách hiện ra.</p>
        ) : !kho ? (
          <p className="dh-phu" aria-busy="true">
            Đang đọc kho đề…
          </p>
        ) : (
          <>
            <p className="dh-tong">
              <b>{dem.tong}</b> câu sẽ chiếu · Trắc nghiệm {dem.I} · Đúng–sai {dem.II} · Trả lời ngắn {dem.III}
              {dem.tuLuan ? ` · trong đó ${dem.tuLuan} câu tự luận` : ''}
              {boCau.size ? ` · đã bỏ ${tatCaCau.length - cauChieu.length} câu` : ''}
            </p>
            <ol className="dh-cau-ds">
              {tatCaCau.map((c) => {
                const bo = boCau.has(c.khoa)
                const stt = bo ? null : cauChieu.indexOf(c) + 1
                const g = giao[c.khoa]
                const kq = g ? ketQua[khoaToChieu(g.sbd, c.qid)] : undefined
                return (
                  <li key={c.khoa} className={`dh-cau${bo ? ' dh-cau--bo' : ''}`}>
                    <label className="dh-cau-tich">
                      <input
                        type="checkbox"
                        checked={!bo}
                        onChange={() =>
                          setBoCau((cu) => {
                            const m = new Set(cu)
                            if (m.has(c.khoa)) m.delete(c.khoa)
                            else m.add(c.khoa)
                            return m
                          })
                        }
                        aria-label={`Chiếu câu ${stt ?? ''} ${tomTatDe(c, 40)}`}
                      />
                      <span className="dh-cau-so">{stt ? `Câu ${stt}` : 'Bỏ'}</span>
                    </label>
                    <div className="dh-cau-than">
                      <p className="dh-cau-nhan">
                        <span>{TEN_PHAN[c.phan]}</span>
                        {c.mucDo && <span>{TEN_MUC_CAU[mucCauSo(c.mucDo)]}</span>}
                        {c.tuLuan && <span className="dh-chip dh-chip--vang">Tự luận</span>}
                        <span className="dh-cau-dang">{c.tenDang || c.chuyenDe}</span>
                      </p>
                      <p className="dh-cau-de">{tomTatDe(c)}</p>
                      {g && !bo && (
                        <div className="dh-giao">
                          <span className="dh-giao-em">
                            <UserCheck size={16} aria-hidden="true" /> <b>{g.hoTen || g.sbd}</b>
                            <span className="dh-giao-p" title={g.lyDo}>
                              khả năng đúng ≈ {pt(g.xacSuat)}
                            </span>
                            {g.uocLuong && <span className="dh-chip dh-chip--vang">Ước lượng</span>}
                          </span>
                          <span className="dh-giao-ly">{g.lyDo}</span>
                          <span className="dh-giao-nut">
                            <button type="button" className="m3-nut-chu dh-nut-nho" onClick={() => void doiEm(c)} disabled={!coMat.length}>
                              <Shuffle size={16} aria-hidden="true" /> Đổi em khác
                            </button>
                            {kq ? (
                              <span className={`dh-chip ${kq === 'dat' ? 'dh-chip--xanh' : 'dh-chip--do'}`}>{kq === 'dat' ? 'Đã ghi: làm đúng' : 'Đã ghi: làm sai'}</span>
                            ) : (
                              <>
                                <button type="button" className="m3-nut-tonal dh-nut-nho" onClick={() => void ghiKq(c, true)}>
                                  <Check size={16} aria-hidden="true" /> Em làm đúng
                                </button>
                                <button type="button" className="m3-nut-vien dh-nut-nho" onClick={() => void ghiKq(c, false)}>
                                  <X size={16} aria-hidden="true" /> Em làm sai
                                </button>
                              </>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </>
        )}
      </section>

      {/* ───── BƯỚC 3 ───── */}
      <section className="dh-buoc dh-buoc--chieu" aria-labelledby="dh-b3">
        <div className="dh-buoc-dau">
          <span className="dh-so" aria-hidden="true">
            3
          </span>
          <div className="dh-buoc-ten">
            <h2 id="dh-b3">Chiếu lên bảng</h2>
            <p>
              {!cauChieu.length
                ? 'Chọn câu ở bước 2 trước.'
                : !coMat.length
                  ? `${cauChieu.length} câu sẵn sàng — cần danh sách có mặt (bước 1) để app gọi em.`
                  : `${cauChieu.length} câu · ${coMat.length} em có mặt. App chọn em có mức ≥ mức độ câu, khả năng đúng cao nhất; mỗi em tối đa 2 lần.`}
            </p>
          </div>
        </div>
        <div className="dh-hang">
          <button type="button" className="m3-nut-chinh dh-nut" disabled={dangChieu || !cauChieu.length || !coMat.length} onClick={() => void chieuLenBang()}>
            <MonitorPlay size={18} aria-hidden="true" /> {dangChieu ? 'Đang dựng tờ chiếu…' : coGiao ? 'Chọn lại em và chiếu' : 'Chiếu lên bảng'}
          </button>
          <button type="button" className="m3-nut-vien dh-nut" disabled={dangChieu || !cauChieu.length} onClick={() => void moTo(coGiao)}>
            {coGiao ? 'Mở lại tờ chiếu' : 'Chiếu đề (chưa gọi em)'}
          </button>
          {coGiao && (
            <button type="button" className="m3-nut-chu dh-nut" onClick={() => setGiao({})}>
              <RefreshCw size={16} aria-hidden="true" /> Bỏ phân công
            </button>
          )}
        </div>
      </section>

      {hopMo && (
        <div className="dh-phu-lop" role="dialog" aria-modal="true" aria-labelledby="dh-hop-ten" onKeyDown={(e) => e.key === 'Escape' && setHopMo(false)}>
          <div className="dh-hop">
            <div className="dh-hop-dau">
              <h2 id="dh-hop-ten">Chọn bài · kho Dạy học</h2>
              <button type="button" className="m3-nut-chu dh-nut" onClick={() => setHopMo(false)} aria-label="Đóng hộp chọn bài">
                <X size={18} aria-hidden="true" /> Đóng
              </button>
            </div>
            {!kho ? (
              <p className="dh-phu" aria-busy="true">
                Đang đọc kho đề…
              </p>
            ) : kho.length === 0 ? (
              <p className="dh-phu">Kho chưa có thư mục Dạy học. Vào Ngân hàng câu hỏi → Đồng bộ ngay để nạp đề.</p>
            ) : (
              <HopChonDe
                ds={kho}
                daChon={maTam}
                chonNhieu
                cao={420}
                onChon={(ma) =>
                  setMaTam((cu) => {
                    const m = new Set(cu)
                    if (m.has(ma)) m.delete(ma)
                    else m.add(ma)
                    return m
                  })
                }
                onChonTatCa={(ma) => setMaTam(new Set(ma))}
              />
            )}
            <div className="dh-hop-chan">
              <span className="dh-phu">
                Xem trước: <b>{demTam.tong}</b> câu{demTam.tuLuan ? ` (có ${demTam.tuLuan} câu tự luận — chiếu đủ)` : ''}
              </span>
              <button
                type="button"
                className="m3-nut-chinh dh-nut"
                disabled={!maTam.size}
                onClick={() => {
                  setMaChon(new Set(maTam))
                  setBoCau(new Set())
                  setGiao({})
                  setHopMo(false)
                }}
              >
                Dùng {demTam.tong} câu
              </button>
            </div>
          </div>
        </div>
      )}

      {chieuMa && tt && (
        <TamPhuChieuMa
          maCa={tt.ma ?? '------'}
          tenCa={tt.buoi.ten}
          lop={tt.buoi.lop}
          link={tt.ma ? linkDiemDanh(goc, tt.ma) : undefined}
          diaChi={`${(goc || '').replace(/^https?:\/\//, '')}/hs`}
          soEmCho={coMat.length}
          onDong={() => setChieuMa(false)}
          hoiPhongCho={hoiPhongCho}
          chu={CHU_DIEM_DANH}
          chuPhuMa="Mã đổi mỗi phút · em chỉ điểm danh được cho chính mình"
        />
      )}

      {html && (
        <KhungXemPhieu
          html={html}
          ten="Tờ máy chiếu — Dạy học"
          dong={() => {
            dongPhien()
            setHtml('')
          }}
        />
      )}
    </div>
  )
}
