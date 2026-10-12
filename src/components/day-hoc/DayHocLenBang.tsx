// BẢNG DẠY HỌC — mục Lên bảng của app thầy (thầy lệnh 28/09: "thêm cho tôi một bảng thủ công DẠY HỌC"). BA BƯỚC:
//  1 · ĐIỂM DANH — nút "Điểm danh" mở buổi học trên máy chủ + chiếu mã 6 số & QR (tấm phủ `TamPhuChieuMa`, cùng kiểu Chiếu mã vào thi);
//      em trên app học sinh nhập/quét mã ⇒ vào danh sách CÓ MẶT (tự làm mới 5 giây qua nhịp chung `useNhipThay` như phòng chờ ca thi);
//      thầy thêm/bớt tay được (chọn từ lớp). Bước này nay là thành phần CHUNG `DiemDanhBuoi.tsx` (thẻ Kiểm tra đầu giờ dùng lại, 29/09).
//  2 · CHỌN CÂU — hộp tích chọn RIÊNG cây thư mục DẠY HỌC của kho (`locDeDayHoc`), tích tờ/bài rồi bỏ từng câu; KHÔNG lọc tự luận.
//  3 · CHIẾU — màn chiếu MỚI (`dungToChieuDayHoc` → `taoHtmlMayChieu`, lớp bản vẽ 28/09): đủ từng câu thầy chọn. "Chiếu lên bảng" ⇒ app chọn em
//      CÓ MẶT có khả năng làm đúng cao nhất cho từng câu (`chon-em-day-hoc.ts`); "Đổi em khác"; "Đúng" / "Sai" ghi bằng `ghiLenBang` (đường ghi sẵn có).
//  4 · BÀI HÔM NAY (OMNI 3, 05/10 — `BaiHomNay.tsx`): CHỈ khi công tắc OMNI bật — tick bài vừa dạy ⇒ tự giao luyện theo bài; OMNI tắt ⇒ bảng y như cũ.
// 12/10 — thầy: Hành trình còn 2 mục; mục "Dạy học & đầu giờ" là MỘT buổi dạy 4 bước (Điểm danh · Gọi lên bảng đầu giờ · Dạy và chiếu câu · Tick
// bài vừa dạy). Mục ấy truyền `dd` (điểm danh dùng chung, tạo MỘT lần ở cha) ⇒ bảng này KHÔNG tự tìm/mở buổi, KHÔNG vẽ bước Điểm danh; "Chọn câu" +
// "Chiếu" gộp thành bước "Dạy và chiếu câu", bước "Bài hôm nay" nằm trong bước "Tick bài vừa dạy" (gập sẵn, nút chính "Tick bài hôm nay" /
// "Bổ sung bài" mở và cuộn tới) kèm `sauBaiHomNay` (bảng Bài đang giao của cha). Mọi chức năng giữ nguyên; vắng `dd` ⇒ y như cũ (màn Lên bảng).
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, Eye, EyeOff, Lightbulb, MonitorPlay, RefreshCw, Shuffle, UserCheck, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import type { TeacherExamSource } from '../../data/examContent'
import KhungXemPhieu from '../KhungXemPhieu'
import HopChonDe from '../HopChonDe'
import { thayChuaQuaMayChu, useGhiToChieu } from '../chien-dich/ghi-to-chieu'
import { ngayVn } from '../chien-dich/ngay'
import { laySucHoc } from '../../lib/buoi-hoc-api'
import { cauTuDeChon, demCau, dungToChieuDayHoc, khoDayHoc, tomTatDe, type CauDayHoc, type EmLenCau } from '../../lib/day-hoc-len-bang'
import { chonEmChoCau, mucCauSo, TEN_MUC_CAU, xepEmChoDanhSach, type KetQuaChon, type SucHocEm } from '../../lib/chon-em-day-hoc'
import { khoaToChieu } from '../../lib/to-chieu-cau-noi'
import { ChemText } from '../../lib/chem-format'
import TheCauHienThi from './TheCauHienThi'
import { BuocDiemDanh, useDiemDanhBuoi, type DiemDanhBuoi } from './DiemDanhBuoi'
import { BuocBaiHomNay, DongChoBaiMoi, useBaiHomNay, type BaiHomNay } from './BaiHomNay'
import './day-hoc.css'

/** Chữ tấm chiếu mã điểm danh — nay nằm ở `DiemDanhBuoi.tsx` (dùng chung với Kiểm tra đầu giờ); giữ lối xuất cũ. */
export { CHU_DIEM_DANH } from './DiemDanhBuoi'

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
const pt = (x: number) => `${Math.round(x * 100)}%`

/** Lớp đang chọn ở bước Bài hôm nay đã có bài tick HÔM NAY (giờ Việt Nam) ⇒ nút chính đổi thành "Bổ sung bài"; bước Tick bài tính là xong. */
export function daTickHomNay(bhn: Pick<BaiHomNay, 'lopChon' | 'dsTheoLop' | 'homNay'>): boolean {
  return bhn.lopChon.some((l) => (bhn.dsTheoLop[l]?.bai ?? []).some((b) => Number.isFinite(Date.parse(b.tickLuc)) && ngayVn(Date.parse(b.tickLuc)) === bhn.homNay))
}

export interface TuyChonDayHoc {
  /** Điểm danh dùng chung do cha tạo (mục Hành trình "Dạy học & đầu giờ"): có ⇒ KHÔNG tạo buổi riêng, KHÔNG vẽ bước Điểm danh. */
  dd?: DiemDanhBuoi
  /** Số của bước "Dạy và chiếu câu" (bước "Tick bài vừa dạy" = số này + 1). Chỉ khi có `dd`; mặc định 3. */
  soBuocDau?: number
  /** Tăng mỗi lần thầy bấm "Bổ sung bài" (Hôm nay / lối vào khác) ⇒ mở bước Bài hôm nay. Chỉ khi có `dd`. */
  lanBoSung?: number
  /** Khối thêm ở cuối bước "Tick bài vừa dạy" (bảng Bài đang giao). Chỉ khi có `dd`. */
  sauBaiHomNay?: ReactNode
  /** Báo cha hai bước đã xong chưa (thanh bước): `day` = đã mở tờ chiếu / đã ghi kết quả em lên bảng; `tick` = lớp đã có bài tick hôm nay. */
  onTrangThai?: (t: { day: boolean; tick: boolean }) => void
}

/** Vắng `dd` ⇒ tự tạo điểm danh như cũ (màn Lên bảng); có `dd` ⇒ hai bước gọn của buổi dạy. */
export default function DayHocLenBang({ dd, ...p }: TuyChonDayHoc = {}) {
  return dd ? <DayHocThan dd={dd} nhung {...p} /> : <DayHocTuTao />
}
function DayHocTuTao() {
  const dd = useDiemDanhBuoi()
  return <DayHocThan dd={dd} nhung={false} />
}

function DayHocThan({ dd, nhung, soBuocDau = 3, lanBoSung = 0, sauBaiHomNay, onTrangThai }: Omit<TuyChonDayHoc, 'dd'> & { dd: DiemDanhBuoi; nhung: boolean }) {
  const showToast = useAppStore((s) => s.showToast)

  // ───── 1 · ĐIỂM DANH (dùng chung với Kiểm tra đầu giờ — `DiemDanhBuoi.tsx`) ─────
  const { tt, idBuoi, coMat, lopCuaEm } = dd

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
  // ───── 4 · BÀI HÔM NAY (OMNI 3) — dùng chung kho Dạy học đã nạp; ẩn hẳn khi OMNI tắt ─────
  const bhn = useBaiHomNay(dd, kho, napKho)

  const tatCaCau = useMemo(() => (kho ? cauTuDeChon(kho, maChon) : []), [kho, maChon])
  const cauChieu = useMemo(() => tatCaCau.filter((c) => !boCau.has(c.khoa)), [tatCaCau, boCau])
  const demTam = useMemo(() => demCau(kho ? cauTuDeChon(kho, maTam) : []), [kho, maTam])
  const dem = demCau(cauChieu)

  // ───── 3 · CHIẾU ─────
  const [html, setHtml] = useState('')
  const [dangChieu, setDangChieu] = useState(false)
  // Đã mở tờ chiếu ít nhất một lần trong lần vào màn này (thanh bước: bước "Dạy và chiếu câu" xong).
  const [daChieu, setDaChieu] = useState(false)
  const [sucHoc, setSucHoc] = useState<Record<string, SucHocEm>>({})
  // Nút "Thầy chữa" trên tờ (thầy 05/10): nhãn "Thầy đã chữa" + mốc dạy lại, nguồn day_hoc theo buổi.
  const thayChuaO = useCallback((o: { sbd: string; qid: string }) => thayChuaQuaMayChu(o, 'day_hoc', idBuoi || 'day-hoc'), [idBuoi])
  const { ketQua, moPhien, ganO, dongPhien, ghi } = useGhiToChieu(idBuoi ? `day-hoc|${idBuoi}` : '', undefined, thayChuaO)

  const [xemLoiGiai, setXemLoiGiai] = useState<Set<string>>(new Set())

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
      const { html: h, o } = await dungToChieuDayHoc(cauChieu, m, `Dạy học · ${tt?.buoi.ten || 'Buổi học'}`, coEm ? ma : undefined, false)
      ganO(ma, o)
      setHtml(h)
      setDaChieu(true)
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

  // ───── THANH BƯỚC của buổi dạy (chỉ khi nhúng): báo cha hai bước đã xong chưa ─────
  const tickHomNay = daTickHomNay(bhn)
  const dayXong = daChieu || Object.keys(ketQua).length > 0
  useEffect(() => {
    if (nhung) onTrangThai?.({ day: dayXong, tick: tickHomNay })
  }, [nhung, dayXong, tickHomNay, onTrangThai])
  // Bước Bài hôm nay GẬP sẵn trong buổi dạy (bản vẽ 12/10: bước 4 chỉ hiện bảng Bài đang giao); "Tick bài hôm nay" / "Bổ sung bài" mở rồi cuộn tới.
  const [moTick, setMoTick] = useState(lanBoSung > 0)
  const [lanCuonTick, setLanCuonTick] = useState(0)
  useEffect(() => {
    if (lanBoSung > 0) setMoTick(true)
  }, [lanBoSung])
  const khungTick = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!lanCuonTick) return
    const giamChuyenDong = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    khungTick.current?.scrollIntoView?.({ block: 'start', behavior: giamChuyenDong ? 'auto' : 'smooth' })
  }, [lanCuonTick])
  const idKhungTick = useId()

  const moHopChon = () => {
    setMaTam(new Set(maChon))
    setHopMo(true)
    void napKho()
  }

  // ───── các khối dùng chung cho hai cách vẽ (bảng đầy đủ · bước gọn trong buổi dạy) ─────
  const danhSachCau =
    maChon.size === 0 ? (
      <p className="dh-phu">Chưa chọn bài nào. Tích tờ / bài trong cây Dạy học, rồi bỏ bớt từng câu ở danh sách hiện ra.</p>
    ) : !kho ? (
      <p className="dh-phu" aria-busy="true">
        Đang đọc kho đề…
      </p>
    ) : (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
          <p className="dh-tong" style={{ margin: 0 }}>
            <b>{dem.tong}</b> câu sẽ chiếu · Trắc nghiệm {dem.I} · Đúng–sai {dem.II} · Trả lời ngắn {dem.III}
            {dem.tuLuan ? ` · trong đó ${dem.tuLuan} câu tự luận` : ''}
            {boCau.size ? ` · đã bỏ ${tatCaCau.length - cauChieu.length} câu` : ''}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="m3-nut-tonal dh-nut-nho" onClick={() => setXemLoiGiai(new Set(cauChieu.map((c) => c.khoa)))}>
              <Eye size={15} /> Hiện lời giải tất cả
            </button>
            {xemLoiGiai.size > 0 && (
              <button type="button" className="m3-nut-chu dh-nut-nho" onClick={() => setXemLoiGiai(new Set())}>
                <EyeOff size={15} /> Ẩn tất cả
              </button>
            )}
          </div>
        </div>
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
                    <button
                      type="button"
                      className={`dh-nut-giai ${xemLoiGiai.has(c.khoa) ? 'dh-nut-giai--mo' : ''}`}
                      onClick={() =>
                        setXemLoiGiai((cu) => {
                          const m = new Set(cu)
                          if (m.has(c.khoa)) m.delete(c.khoa)
                          else m.add(c.khoa)
                          return m
                        })
                      }
                      style={{ marginLeft: 'auto' }}
                    >
                      <Lightbulb size={14} /> {xemLoiGiai.has(c.khoa) ? 'Ẩn lời giải' : 'Hiện lời giải'}
                    </button>
                  </p>
                  <div className="dh-cau-de" style={c.tuLuan ? { whiteSpace: 'pre-wrap' } : undefined}>
                    {c.tuLuan ? <ChemText text={c.q.text || tomTatDe(c)} /> : tomTatDe(c)}
                  </div>
                  {c.tuLuan &&
                    (() => {
                      const h = (c.q as any).imageDataUrl || (c.q as any).hinhAnh?.[0]?.src || (c.q as any).hinh?.[0]?.du_lieu || (c.q as any).hinh?.[0]?.src
                      return h ? (
                        <div style={{ marginTop: 6 }}>
                          <img src={h} alt="Hình câu hỏi" width={640} height={360} loading="lazy" decoding="async" style={{ maxWidth: '100%', height: 'auto', maxHeight: 240, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--vien)' }} />
                        </div>
                      ) : null
                    })()}
                  {xemLoiGiai.has(c.khoa) && <TheCauHienThi c={c} stt={stt ?? undefined} />}
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
    )

  const moTaChieu = !cauChieu.length
    ? 'Chọn câu ở bước 2 trước.'
    : !coMat.length
      ? `${cauChieu.length} câu sẵn sàng — cần danh sách có mặt (bước 1) để app gọi em.`
      : `${cauChieu.length} câu · ${coMat.length} em có mặt. App chọn em có mức ≥ mức độ câu, khả năng đúng cao nhất; mỗi em tối đa 2 lần.`

  const hangChieu = (
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
  )

  const hopChon = hopMo && (
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
  )

  const khungChieu = html && (
    <KhungXemPhieu
      html={html}
      ten="Tờ máy chiếu — Dạy học"
      dong={() => {
        dongPhien()
        setHtml('')
      }}
    />
  )

  if (nhung) {
    const so3 = soBuocDau
    const so4 = soBuocDau + 1
    return (
      <>
        {/* ───── BƯỚC 3 · DẠY VÀ CHIẾU CÂU (Chọn câu + Chiếu của bảng đầy đủ) ───── */}
        <section className="dh-buoc gvv2-bd-buoc" data-buoc={so3} data-khoi="buoc-day-chieu" aria-labelledby={`bd-b${so3}`}>
          <div className="dh-buoc-dau">
            <span className="dh-so" aria-hidden="true">
              {so3}
            </span>
            <div className="dh-buoc-ten">
              <h2 id={`bd-b${so3}`}>Dạy và chiếu câu</h2>
              <p>
                {maChon.size && kho && cauChieu.length
                  ? moTaChieu
                  :'Chọn câu trong kho Dạy học của bài, chiếu cả lớp làm, app gọi em có mặt lên bảng. Câu tự luận cũng chiếu đủ.'}
              </p>
            </div>
            <div className="gvv2-bd-nut">
              <button type="button" className="m3-nut-vien dh-nut" onClick={moHopChon}>
                {maChon.size ? 'Đổi bài' : 'Chọn câu để chiếu'}
              </button>
            </div>
          </div>
          {maChon.size > 0 && danhSachCau}
          {maChon.size > 0 && kho && cauChieu.length > 0 && hangChieu}
        </section>

        {/* ───── BƯỚC 4 · TICK BÀI VỪA DẠY (Bài hôm nay gập sẵn + bảng Bài đang giao) ───── */}
        <section className="dh-buoc gvv2-bd-buoc" data-buoc={so4} data-khoi="buoc-tick-bai" aria-labelledby={`bd-b${so4}`}>
          <div className="dh-buoc-dau">
            <span className="dh-so" aria-hidden="true">
              {so4}
            </span>
            <div className="dh-buoc-ten">
              <h2 id={`bd-b${so4}`}>Tick bài vừa dạy</h2>
              <p>Tick xong, app giao bài đó cho lớp trong 7 ngày: mỗi em gặp đủ câu gốc rồi tự làm.</p>
            </div>
            {bhn.bat && (
              <div className="gvv2-bd-nut">
                <button
                  type="button"
                  className="m3-nut-chinh dh-nut"
                  aria-expanded={moTick}
                  aria-controls={idKhungTick}
                  onClick={() => {
                    setMoTick(true)
                    setLanCuonTick((n) => n + 1)
                  }}
                >
                  {tickHomNay ? 'Bổ sung bài' : 'Tick bài hôm nay'}
                </button>
              </div>
            )}
          </div>
          <DongChoBaiMoi bhn={bhn} />
          {bhn.co && !bhn.bat && <p className="dh-phu">Tick bài vừa dạy cần bật OMNI cho lớp ở Cài đặt › OMNI (theo lớp).</p>}
          {bhn.bat && moTick && (
            <div id={idKhungTick} ref={khungTick} className="gvv2-bd-tick">
              <BuocBaiHomNay bhn={bhn} kho={kho} soBuoc={so4} />
            </div>
          )}
          {sauBaiHomNay}
        </section>
        {hopChon}
        {khungChieu}
      </>
    )
  }

  return (
    <div className="dh-trang" data-khoi="day-hoc-len-bang">
      <header className="dh-dau">
        <h1>Dạy học</h1>
        <p>Điểm danh lấy danh sách em học hôm nay → chọn câu trong kho Dạy học → chiếu lên máy chiếu. App gọi em có mặt có khả năng làm đúng câu cao nhất.</p>
        <DongChoBaiMoi bhn={bhn} />
      </header>

      <BuocDiemDanh dd={dd} />

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
          <button type="button" className="m3-nut-vien dh-nut" onClick={moHopChon}>
            {maChon.size ? 'Đổi bài' : 'Chọn bài trong kho Dạy học'}
          </button>
        </div>
        {danhSachCau}
      </section>

      {/* ───── BƯỚC 3 ───── */}
      <section className="dh-buoc dh-buoc--chieu" aria-labelledby="dh-b3">
        <div className="dh-buoc-dau">
          <span className="dh-so" aria-hidden="true">
            3
          </span>
          <div className="dh-buoc-ten">
            <h2 id="dh-b3">Chiếu lên bảng</h2>
            <p>{moTaChieu}</p>
          </div>
        </div>
        {hangChieu}
      </section>

      {/* ───── BƯỚC 4 (OMNI 3) ───── */}
      <BuocBaiHomNay bhn={bhn} kho={kho} />

      {hopChon}

      {khungChieu}
    </div>
  )
}
