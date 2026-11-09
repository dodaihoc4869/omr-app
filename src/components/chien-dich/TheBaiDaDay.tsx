// HÀNH TRÌNH GIỎI HÓA — CÁC BƯỚC BUỔI DẠY (tên tệp giữ từ thẻ "Bài đã dạy" cũ — mảnh nạp lười đã có trong vite.config.ts).
// 07/11 — THẦY duyệt bản vẽ docs/ban-ve-buoc-day-0711 («duyệt, build luôn rồi đẩy lên bản sống»): «Khi điểm danh xong bấm Xong thì hiện các tuỳ chọn
// … tôi chọn xong thì hiện nút chiếu lên bảng, kiểu theo từng bước cho thống nhất dễ dùng» + «load lại phải giữ nguyên, đồng bộ mọi thiết bị cho đến
// khi tôi bấm kết thúc buổi học» + «tôi chỉ việc chiếu lên bảng rồi bấm chuyển câu».
//   · ĐƯỜNG THẲNG 4 BƯỚC: 1 Điểm danh → «Xong điểm danh» → 2 Hôm nay làm gì? (thẻ hoạt động) → 3 Chọn câu & chiếu (khối chức năng sẵn có của hoạt
//     động, nút «Chiếu lên bảng» của chính khối) → 4 Đang chiếu (Câu tiếp / Câu trước / Lời giải — điều khiển từ máy thầy nào cũng được).
//   · Thước bước luôn hiện; bấm bước để quay lại. Một chỗ kết thúc: «Kết thúc buổi học» trên thước (hộp xác nhận).
//   · ĐỒNG BỘ: bước + hoạt động ghi lên phòng của buổi (`/gv/buoi-hoc` tien-trinh) và đọc kèm nhịp làm mới 5 giây sẵn có ⇒ tải lại / máy khác về
//     đúng chỗ; ghi sau thắng ghi trước (`luc`). Khối hoạt động đã mở vẫn GẮN (chỉ ẩn) ⇒ quay lại vẫn đúng câu đang chiếu, em đang gọi.
//   · Khối của hoạt động chỉ nạp khi chọn ⇒ mở màn không thêm byte / lượt đọc. Kiểm tra ôn tập (làn Codex) gập sẵn ở cuối như cũ.
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CalendarCheck, Check, ChevronLeft, ClipboardCheck, Flame, MonitorPlay, Presentation } from 'lucide-react'
import { BuocDiemDanh, emVangBuoi, useDiemDanhBuoi, type DiemDanhBuoi } from '../day-hoc/DiemDanhBuoi'
import { ghiTienTrinhBuoi, type HoatDongBuoi } from '../../lib/buoi-hoc-api'
import { useSoDemGv } from '../../lib/so-dem-gv'
import BangBaiDangGiao from './BangBaiDangGiao'
import { buocVaoMan, chuBuoi, TEN_BUOC_DAY, TEN_NGAN_BUOC_DAY as TEN_NGAN, type SoBuoc, type TrangThaiBuoc } from './buoi-day-ui'
import '../../styles/trong-gv-hanh-trinh.css' // «Trong» 26/10 — chỉ áp khi <html data-trong="gv">
import './buoc-day.css'

const DayHocLenBang = lazy(() => import('../day-hoc/DayHocLenBang'))
const KiemTraDauGio = lazy(() => import('../day-hoc/KiemTraDauGio'))
const TheCanThayChua = lazy(() => import('./TheCanThayChua'))
const BangKiemTraCaNhan = lazy(() => import('./BangKiemTraCaNhan'))
const DangChieuBpu = lazy(() => import('./DangChieuBpu'))

type HoatDong = Exclude<HoatDongBuoi, ''>
const HOAT_DONG: { id: HoatDong; ten: string; moTa: string; Icon: typeof Flame }[] = [
  { id: 'dau-gio', ten: 'Kiểm tra đầu giờ · gọi lên bảng', moTa: 'App chọn tối đa 6 em có mặt, mỗi em một câu em đã làm đúng; thầy chấm Đạt / Chưa đạt.', Icon: ClipboardCheck },
  { id: 'day-hoc', ten: 'Dạy học', moTa: 'Chọn câu trong kho Dạy học, chiếu lên bảng; cả lớp cùng làm trên máy, app gọi em lên bảng.', Icon: Presentation },
  { id: 'chua-cau', ten: 'Chữa câu khó & tính toán', moTa: 'Câu nhiều em sai nhất và câu tính toán thầy chọn; mỗi câu gọi một em làm sai lên chữa.', Icon: Flame },
]
const tenHoatDong = (h: HoatDongBuoi) => HOAT_DONG.find((x) => x.id === h)?.ten ?? ''

const giamChuyenDong = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function XuongBuoc({ nhan, cao = 120 }: { nhan: string; cao?: number }) {
  return (
    <div className="gvv2-cc-xuong" role="status" aria-label={nhan}>
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: cao, borderRadius: 16 }} />
    </div>
  )
}

function VongSo({ so, tt }: { so: number; tt: TrangThaiBuoc }) {
  return (
    <span className="gvv2-ht-vong" aria-hidden="true">
      {tt === 'xong' ? <Check size={18} strokeWidth={3} /> : so}
    </span>
  )
}

/** Tên em vắng (em lớp của buổi chưa điểm danh) — tối đa 2 tên. Buổi "Mọi lớp" / chưa có danh sách lớp ⇒ null. */
function chuVang(dd: DiemDanhBuoi): string | null {
  const lop = (dd.tt?.buoi.lop ?? '').trim()
  if (!dd.tt || !lop || !dd.tt.lopEm?.length) return null
  const vang = emVangBuoi(dd.tt).map((e) => e.hoTen || e.sbd)
  if (!vang.length) return 'đủ cả lớp'
  return `Vắng: ${vang.slice(0, 2).join(', ')}${vang.length > 2 ? ` và ${vang.length - 2} em` : ''}`
}

/** Thước 4 bước (luôn hiện) + ô buổi dạy + dải đồng bộ + «Kết thúc buổi học» (chỗ kết thúc DUY NHẤT). */
function ThuocTienTrinh({ dd, tt, phu, onMo }: { dd: DiemDanhBuoi; tt: readonly TrangThaiBuoc[]; phu: readonly ReactNode[]; onMo: (so: SoBuoc) => void }) {
  const siSo = dd.tt?.siSo ?? null
  const dangMo = !!dd.tt?.buoi.dangMo
  return (
    <nav className="gvv2-ht-thuoc" aria-label="Các bước của buổi dạy" data-khoi="thuoc-tien-trinh">
      <div className="gvv2-ht-buoi" data-nhieu={dd.dsBuoiMo.length > 1 || undefined}>
        <span className="gvv2-ht-nhan">Buổi dạy hôm nay</span>
        {dd.dsBuoiMo.length > 0 ? (
          <label className="gvv2-ht-chon-buoi">
            <span className="sr-only">Buổi dạy</span>
            <select value={dd.idBuoi} onChange={(e) => void dd.chonBuoi(e.target.value)} disabled={dd.dangChonBuoi} aria-busy={dd.dangChonBuoi}>
              {dd.dsBuoiMo.map((b) => (
                <option key={b.id} value={b.id}>
                  {chuBuoi(b)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <b aria-busy={dd.dangTaiBuoi}>{dd.dangTaiBuoi ? 'Đang tìm buổi đang mở…' : 'Chưa mở buổi'}</b>
        )}
        {dd.tt && (
          <span className="gvv2-ht-co-mat gvv2-so">
            <b>
              {dd.coMat.length}
              {siSo ? `/${siSo}` : ''} em có mặt
            </b>
          </span>
        )}
        {dangMo && (
          <span className="gvv2-ht-dong-bo" data-loi={dd.loiLamMoi || undefined} role="status">
            {dd.loiLamMoi ? 'Mất kết nối · đang thử lại' : 'Đồng bộ mọi máy · tải lại vẫn giữ tới khi kết thúc buổi'}
          </span>
        )}
        {dangMo && (
          <button type="button" className="gvv2-nut-vien gvv2-ht-ket-thuc" onClick={() => void dd.ketThuc()}>
            Kết thúc buổi học
          </button>
        )}
      </div>
      <ol>
        {TEN_BUOC_DAY.map((ten, i) => {
          const so = (i + 1) as SoBuoc
          return (
            <li key={ten} data-tt={tt[i]}>
              <button type="button" aria-current={tt[i] === 'dang' ? 'step' : undefined} onClick={() => onMo(so)}>
                <VongSo so={so} tt={tt[i]!} />
                <span className="gvv2-ht-thuoc-chu">
                  <span className="gvv2-ht-ten-dai">{ten}</span>
                  <span className="gvv2-ht-ten-ngan" aria-hidden="true">
                    {TEN_NGAN[i]}
                  </span>
                  <span className="gvv2-ht-thuoc-phu">{phu[i]}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Kiểm tra ôn tập (làn Codex): gập sẵn; thành phần trả null khi lịch tắt ⇒ cả dòng ẩn theo. */
function KiemTraOnTap() {
  const vo = useRef<HTMLDivElement>(null)
  const [co, setCo] = useState(true)
  useEffect(() => {
    const el = vo.current
    if (!el || typeof MutationObserver === 'undefined') return
    const xem = () => setCo(el.childElementCount > 0)
    const theo = new MutationObserver(xem)
    theo.observe(el, { childList: true })
    xem()
    return () => theo.disconnect()
  }, [])
  return (
    <details className="gvv2-ht-on-tap" hidden={!co} data-khoi="kiem-tra-on-tap">
      <summary>
        <span className="gvv2-ht-vong" aria-hidden="true">
          <CalendarCheck size={18} />
        </span>
        <span className="gvv2-ht-dong-chu">
          <b>Kiểm tra ôn tập</b>
          <span>Ngoài buổi dạy · lịch và đề dành riêng cho từng em</span>
        </span>
        <span className="gvv2-ht-xem">Xem</span>
      </summary>
      <div ref={vo}>
        <Suspense fallback={null}>
          <BangKiemTraCaNhan />
        </Suspense>
      </div>
    </details>
  )
}

/** `buocDau` = lối vào chỉ định (Hôm nay › Cần thầy chữa ⇒ 4 ⇒ hoạt động Chữa câu; khoá cũ `dau-gio` ⇒ 2 ⇒ Kiểm tra đầu giờ). */
export default function TheBaiDaDay({ buocDau = null }: { buocDau?: SoBuoc | null }) {
  const khung = useRef<HTMLDivElement>(null)
  const dd = useDiemDanhBuoi()
  const [buoc, setBuoc] = useState<SoBuoc | null>(null)
  const [hd, setHd] = useState<HoatDongBuoi>('')
  const [daGan, setDaGan] = useState<ReadonlySet<HoatDong>>(() => new Set())
  const [lanCuon, setLanCuon] = useState(0)
  const [choBamDauGio, setChoBamDauGio] = useState(false)
  const [choMoLai, setChoMoLai] = useState(false)
  /** Nút «Chiếu lên bảng» thầy bấm gần nhất ở bước 3 (Chữa câu khó không có nút «Mở lại tờ chiếu» riêng). */
  const nutChieu = useRef<HTMLButtonElement | null>(null)
  const [xongDauGio, setXongDauGio] = useState(false)
  const [demDauGio, setDemDauGio] = useState({ goi: 0, dat: 0, chuaDat: 0 })
  const [ttDay, setTtDay] = useState({ day: false, tick: false })
  const nhanTtDay = useCallback((t: { day: boolean; tick: boolean }) => setTtDay((cu) => (cu.day === t.day && cu.tick === t.tick ? cu : t)), [])
  const nhanDemDauGio = useCallback((t: { goi: number; dat: number; chuaDat: number }) => setDemDauGio((cu) => (cu.goi === t.goi && cu.dat === t.dat && cu.chuaDat === t.chuaDat ? cu : t)), [])
  const canThayChua = useSoDemGv((s) => s.canThayChua)
  const datSo = useSoDemGv((s) => s.datSo)
  const [demDanhSach, setDemDanhSach] = useState<number | null>(null)
  const nhanDem = useCallback((n: number) => { setDemDanhSach(n); datSo({ canThayChua: n }) }, [datSo])
  const soCanChua = demDanhSach ?? canThayChua

  const coMat = dd.coMat.length
  const buoiMo = !!dd.tt?.buoi.dangMo
  const gan = useCallback((h: HoatDongBuoi) => { if (h) setDaGan((cu) => (cu.has(h) ? cu : new Set([...cu, h]))) }, [])

  // ĐỒNG BỘ: mốc tiến trình đã áp (của máy này hoặc máy khác) — chỉ áp bản MỚI hơn.
  const lucDaAp = useRef(0)
  const idBuoiRef = useRef(dd.idBuoi)
  idBuoiRef.current = dd.idBuoi
  const buoiMoRef = useRef(buoiMo)
  buoiMoRef.current = buoiMo
  /** Đổi bước (+ hoạt động) trên máy này và ghi lên phòng của buổi ⇒ máy khác thấy ở nhịp làm mới kế tiếp; tải lại về đúng chỗ. */
  const daVao = useRef(false)
  const hdRef = useRef(hd)
  hdRef.current = hd
  const dat = useCallback((b: SoBuoc, h?: HoatDongBuoi) => {
    const moi = h ?? hdRef.current
    hdRef.current = moi
    daVao.current = true // thầy đã chọn ⇒ lượt «bước vào màn» (có thể đang chờ chạy) không ghi đè
    setBuoc(b)
    setHd(moi)
    gan(moi)
    const luc = Date.now()
    lucDaAp.current = luc
    if (idBuoiRef.current && buoiMoRef.current) void ghiTienTrinhBuoi(idBuoiRef.current, { buoc: b, hoatDong: moi, luc })
    setLanCuon((n) => n + 1)
  }, [gan])

  // Tiến trình từ máy chủ (tải lại / máy thầy khác vừa đổi bước).
  const ttMayChu = dd.tt?.tienTrinh ?? null
  useEffect(() => {
    if (!ttMayChu || ttMayChu.luc <= lucDaAp.current) return
    lucDaAp.current = ttMayChu.luc
    setBuoc(ttMayChu.buoc)
    setHd(ttMayChu.hoatDong)
    gan(ttMayChu.hoatDong)
  }, [ttMayChu, gan])

  // Bước vào màn khi CHƯA có tiến trình: lối vào chỉ định thắng (và được ghi lên máy chủ), không thì theo điểm danh.
  useEffect(() => {
    if (daVao.current || buoc !== null || dd.dangTaiBuoi) return
    if (ttMayChu && !buocDau) return
    const v = buocVaoMan({ buocDau, dangTai: dd.dangTaiBuoi, coMat })
    if (!v) return
    daVao.current = true
    if (buocDau) dat(v.buoc, v.hd)
    else { setBuoc(v.buoc); setHd(v.hd); gan(v.hd) }
  }, [buoc, buocDau, dd.dangTaiBuoi, coMat, ttMayChu, dat, gan])

  // Buổi kết thúc ⇒ mọi máy về bước 1 (chưa mở buổi).
  useEffect(() => {
    if (dd.tt && !dd.tt.buoi.dangMo && buoc && buoc > 1) { setBuoc(1); setHd('') }
  }, [dd.tt, buoc])

  // Bảng Bình Phản Ứng vừa mở lượt trên máy này (tờ chiếu chuyển câu) ⇒ bước «Đang chiếu». 09/11: thầy chọn câu NGAY TRÊN BẢNG điểm danh ⇒ từ bước 1 / 2
  // cũng sang bước 4 (máy khác + «Đang chiếu» đồng bộ theo).
  useEffect(() => {
    const nghe = () => { if (buoc !== 4) dat(4) }
    window.addEventListener('bpu-dang-chieu', nghe)
    return () => window.removeEventListener('bpu-dang-chieu', nghe)
  }, [buoc, dat])

  useEffect(() => {
    if (!lanCuon || buoc === null) return
    khung.current?.scrollIntoView?.({ block: 'start', behavior: giamChuyenDong() ? 'auto' : 'smooth' })
  }, [lanCuon, buoc])

  /** Bản chiếu Nhịp học (phím → / nút) ⇒ Kiểm tra đầu giờ, chờ khối hiện rồi bấm nút chính «Chiếu lên bảng». */
  const sangDauGio = useCallback(() => { dat(3, 'dau-gio'); setChoBamDauGio(true) }, [dat])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!choBamDauGio || buoc !== 3 || hd !== 'dau-gio') return
    const nut = khung.current?.querySelector<HTMLButtonElement>('[data-hd="dau-gio"] .m3-nut-chinh')
    if (!nut) return
    setChoBamDauGio(false)
    nut.focus()
    if (!nut.disabled) nut.click()
  })

  /** Bước «Đang chiếu» › «Mở lại tờ chiếu» (thầy 07/11 «bấm mở tờ chiếu load luôn vào bình phản ứng»): về khối hoạt động và BẤM LUÔN nút mở lại tờ
   *  ⇒ tờ mở ⇒ bảng Bình Phản Ứng tự đè lên, nối lại lượt đang chạy. Chỉ bấm nút KHÔNG gọi em mới: «Mở lại tờ chiếu…» (Đầu giờ, Dạy học) hoặc
   *  «Chiếu lên bảng» vừa bấm của Chữa câu khó (dựng lại đúng tờ ấy); không có thì chỉ hiện khối để thầy chọn. */
  const moLaiTo = useCallback(() => { dat(3); setChoMoLai(true) }, [dat])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!choMoLai || buoc !== 3) return
    setChoMoLai(false)
    const khoi = khung.current?.querySelector<HTMLElement>(`[data-hd="${hd}"]`)
    const nut = [...(khoi?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find((b) => /^\s*Mở lại tờ chiếu/.test(b.textContent ?? ''))
      ?? (hd === 'chua-cau' && nutChieu.current?.isConnected && /^\s*Chiếu lên bảng\s*$/.test(nutChieu.current.textContent ?? '') ? nutChieu.current : null)
    if (nut && !nut.disabled) nut.click()
  })

  const siSo = dd.tt?.siSo ?? null
  const chuCoMat = `${coMat}${siSo ? `/${siSo}` : ''} em có mặt`
  const vang = chuVang(dd)
  const xong = [!!dd.tt && coMat > 0, !!hd, !!hd && (hd === 'dau-gio' ? xongDauGio || demDauGio.goi > 0 : hd === 'day-hoc' ? ttDay.day : false), false]
  const tt: TrangThaiBuoc[] = xong.map((x, i) => (i + 1 === buoc ? 'dang' : x ? 'xong' : 'cho'))
  const phu: ReactNode[] = [
    dd.dangTaiBuoi ? 'Đang tìm buổi…' : dd.tt ? chuCoMat : 'Chưa mở buổi',
    hd ? tenHoatDong(hd) : 'Chọn một hoạt động',
    hd ? 'Chọn câu · Chiếu lên bảng' : 'Sau khi chọn hoạt động',
    'Chỉ cần bấm Câu tiếp',
  ]
  const soSan: Record<HoatDong, ReactNode> = {
    'dau-gio': demDauGio.goi ? <>Đã gọi <b>{demDauGio.goi}</b> em · Đạt {demDauGio.dat}</> : coMat ? <>Gọi trong <b>{coMat}</b> em có mặt</> : 'Cần điểm danh trước',
    'day-hoc': ttDay.day ? <b>Đã chiếu câu</b> : 'Kho Dạy học của lớp',
    'chua-cau': soCanChua ? <><b className="gvv2-ht-hp">{soCanChua} chỗ</b> cần chữa</> : soCanChua === 0 ? 'Không còn chỗ cần chữa' : 'Câu khó · câu em sai',
  }
  const daLam = (h: HoatDong) => (h === 'dau-gio' ? xongDauGio : h === 'day-hoc' ? ttDay.day : false)

  return (
    <div ref={khung} className="gvv2-nhung gvv2-bd gvv2-ht gvv2-hd" data-khoi="buoi-day" data-mo={buoc ?? undefined} data-b1={tt[0]} data-b2={tt[1]} data-b3={tt[2]} data-b4={tt[3]}>
      <ThuocTienTrinh dd={dd} tt={tt} phu={phu} onMo={(so) => dat(so)} />

      <div className="gvv2-ht-cac-buoc">
        {/* BƯỚC 1 — ĐIỂM DANH (khối sẵn có) + «Xong điểm danh». */}
        <section className="gvv2-hd-buoc" data-buoc-ht={1} data-mo={buoc === 1} hidden={buoc !== 1} aria-label="Bước 1 · Điểm danh">
          <BuocDiemDanh dd={dd} soBuoc={1} idTieuDe="bd-b1" thanh onSangDauGio={sangDauGio} />
          {dd.tt && <div className="gvv2-hd-day">
            <span className="gvv2-so"><b>{chuCoMat}</b>{vang ? ` · ${vang}` : ''} · em đến muộn vẫn nhập mã được tới khi kết thúc buổi</span>
            <button type="button" className="m3-nut-chinh" disabled={!buoiMo} onClick={() => dat(2)}>
              Xong điểm danh →
            </button>
          </div>}
        </section>

        {/* BƯỚC 2 — HÔM NAY LÀM GÌ? */}
        <section className="gvv2-hd-buoc" data-buoc-ht={2} data-mo={buoc === 2} hidden={buoc !== 2} aria-labelledby="hd-b2">
          {buoiMo && dd.tt && (
            <p className="gvv2-hd-da-dd gvv2-so">
              <Check size={18} strokeWidth={3} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
              <span>Đã điểm danh · <b>{chuCoMat}</b> · em đến muộn vẫn nhập mã được tới khi kết thúc buổi.</span>
            </p>
          )}
          {!buoiMo && !dd.dangTaiBuoi && (
            <p className="gvv2-ht-can">
              Chưa mở buổi — điểm danh ở bước 1 trước.
              <button type="button" className="gvv2-nut-vien" onClick={() => dat(1)}>Về bước 1</button>
            </p>
          )}
          <h2 id="hd-b2" className="gvv2-hd-h2">Hôm nay làm gì?</h2>
          <p className="gvv2-hd-phu">Chọn một hoạt động. Xong hoạt động này thầy quay lại chọn hoạt động khác.</p>
          <div className="gvv2-hd-the-luoi">
            {HOAT_DONG.map(({ id, ten, moTa, Icon }) => (
              <button key={id} type="button" className="gvv2-hd-the" data-chon={hd === id || undefined} onClick={() => dat(3, id)}>
                <span className="gvv2-hd-the-icon" aria-hidden="true"><Icon size={24} /></span>
                <span className="gvv2-hd-the-chu">
                  <b>{ten}{daLam(id) ? <span className="gvv2-hd-da-lam"> · ✓ Đã làm</span> : null}</b>
                  <span>{moTa}</span>
                  <span className="gvv2-hd-the-so gvv2-so">{soSan[id]}</span>
                </span>
                <span className="gvv2-hd-the-mui" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>

        {/* BƯỚC 3 — CHỌN CÂU & CHIẾU: khối của hoạt động (đã mở thì giữ gắn, chỉ ẩn). */}
        <section className="gvv2-hd-buoc" data-buoc-ht={3} data-mo={buoc === 3} hidden={buoc !== 3} aria-label="Bước 3 · Chọn câu & chiếu"
          onClickCapture={(e) => { const b = (e.target as HTMLElement).closest?.('button'); if (b && /Chiếu lên bảng/.test(b.textContent ?? '')) nutChieu.current = b }}>
          <div className="gvv2-hd-dau3">
            <button type="button" className="gvv2-nut-vien" onClick={() => dat(2)}>
              <ChevronLeft size={18} aria-hidden="true" /> Đổi hoạt động
            </button>
            <b>{tenHoatDong(hd)}</b>
            <span className="gvv2-hd-goi-y"><MonitorPlay size={16} aria-hidden="true" /> Chiếu lên bảng ⇒ câu tự gửi xuống máy em có mặt, giờ tự tính (tối đa 3 phút)</span>
          </div>
          {!hd && <p className="gvv2-ht-can">Chưa chọn hoạt động. <button type="button" className="gvv2-nut-vien" onClick={() => dat(2)}>Chọn hoạt động</button></p>}
          {daGan.has('dau-gio') && (
            <div data-hd="dau-gio" hidden={hd !== 'dau-gio'}>
              {!coMat && !dd.dangTaiBuoi && (
                <p className="gvv2-ht-can">
                  Chưa có danh sách có mặt — điểm danh ở bước 1 trước.
                  <button type="button" className="gvv2-nut-vien" onClick={() => dat(1)}>Về bước 1</button>
                </p>
              )}
              <Suspense fallback={<XuongBuoc nhan="Đang mở Kiểm tra đầu giờ" />}>
                <KiemTraDauGio dd={dd} soBuoc={3} onXong={setXongDauGio} onTomTat={nhanDemDauGio} />
              </Suspense>
            </div>
          )}
          {daGan.has('day-hoc') && (
            <div data-hd="day-hoc" hidden={hd !== 'day-hoc'}>
              <Suspense fallback={<XuongBuoc nhan="Đang mở Dạy học" cao={200} />}>
                <DayHocLenBang dd={dd} soBuocDau={3} onTrangThai={nhanTtDay} sauBaiHomNay={<BangBaiDangGiao onMoChuaBai={() => dat(3, 'chua-cau')} />} />
              </Suspense>
            </div>
          )}
          {daGan.has('chua-cau') && (
            <div data-hd="chua-cau" hidden={hd !== 'chua-cau'}>
              <Suspense fallback={<XuongBuoc nhan="Đang mở Chữa câu khó & tính toán" cao={200} />}>
                <TheCanThayChua onDem={nhanDem} />
              </Suspense>
            </div>
          )}
        </section>

        {/* BƯỚC 4 — ĐANG CHIẾU (điều khiển từ máy nào cũng được). */}
        <section className="gvv2-hd-buoc" data-buoc-ht={4} data-mo={buoc === 4} hidden={buoc !== 4} aria-label="Bước 4 · Đang chiếu">
          {buoc === 4 && dd.idBuoi && buoiMo ? (
            <Suspense fallback={<XuongBuoc nhan="Đang nối màn chiếu" cao={220} />}>
              <DangChieuBpu buoiId={dd.idBuoi} onVe={() => dat(2)} onMoTo={hd ? moLaiTo : undefined} />
            </Suspense>
          ) : buoc === 4 ? (
            <p className="gvv2-ht-can">Chưa mở buổi — điểm danh ở bước 1 trước. <button type="button" className="gvv2-nut-vien" onClick={() => dat(1)}>Về bước 1</button></p>
          ) : null}
        </section>

        <KiemTraOnTap />
      </div>
    </div>
  )
}
