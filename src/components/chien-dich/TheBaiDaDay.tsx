// HÀNH TRÌNH GIỎI HÓA — MỘT TRANG 4 BƯỚC (tên tệp giữ từ thẻ "Bài đã dạy" cũ — mảnh nạp lười đã có trong vite.config.ts).
// LỊCH SỬ: 12/10 mục "Dạy học & đầu giờ" = một buổi dạy 4 bước, cạnh mục "Chữa bài".
// 21/10 — THẦY (bản vẽ docs/ban-ve-hanh-trinh-2110 đã duyệt, "ok build đi"): "bỏ thẻ dạy học và đầu giờ và thẻ chữa bài đi, phần này sẽ theo tiến
// trình từ trên xuống dưới, 1 điểm danh, 2 là gọi lên bảng đầu giờ, 3 dạy học, 4 chữa câu khó và tính toán" + "bước 1 điểm danh còn những bước sau
// đều lấy danh sách điểm danh ở bước 1, các bước sau chọn độc lập được theo chức năng" + "bỏ cái phần tick bài vừa dạy khỏi hành trình đi"
// (Tick bài nay là hộp "Bổ sung bài hôm nay" ở màn Hôm nay — `HopBoSungBai.tsx`). Đặc tả: docs/dac-ta-hanh-trinh-1-trang-2110.md.
//   · THƯỚC TIẾN TRÌNH (một điều khiển duy nhất): máy tính = cột trái dính (ô Buổi dạy + 4 bước dọc, vạch tách sau bước 1); hẹp = hàng 4 ô dính trên.
//   · THẺ BƯỚC xếp dọc. MỖI LÚC MỘT bước mở (viền xanh lam, có nút chính); bước khác thu thành MỘT dòng (tóm tắt + "Mở" / "Mở lại") nhưng vẫn
//     GẮN (chỉ ẩn) ⇒ quay lại vẫn đúng câu đang chiếu, em đang gọi. Bước 2–4 không khoá theo thứ tự; cả ba nhận MỘT `dd` (điểm danh bước 1).
//   · Bước 4 (`TheCanThayChua`: Câu khó & tính toán + Câu học sinh cần chữa) CHỈ nạp khi mở lần đầu ⇒ mở màn không thêm byte / lượt đọc.
//   · Kiểm tra ôn tập (`BangKiemTraCaNhan`, làn Codex — bọc ngoài, không sửa) nằm cuối, gập sẵn; tắt lịch ⇒ không có dòng.
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CalendarCheck, Check } from 'lucide-react'
import { BuocDiemDanh, emVangBuoi, useDiemDanhBuoi, type DiemDanhBuoi } from '../day-hoc/DiemDanhBuoi'
import { useSoDemGv } from '../../lib/so-dem-gv'
import BangBaiDangGiao from './BangBaiDangGiao'
import { buocMacDinh, chuBuoi, CHU_TRANG_THAI_BUOC, TEN_BUOC, TEN_NGAN_BUOC, trangThaiBuoc, type SoBuoc, type TrangThaiBuoc } from './buoi-day-ui'
import '../../styles/trong-gv-hanh-trinh.css' // «Trong» 26/10 — chỉ áp khi <html data-trong="gv">

const DayHocLenBang = lazy(() => import('../day-hoc/DayHocLenBang'))
const KiemTraDauGio = lazy(() => import('../day-hoc/KiemTraDauGio'))
const TheCanThayChua = lazy(() => import('./TheCanThayChua'))
const BangKiemTraCaNhan = lazy(() => import('./BangKiemTraCaNhan'))

const giamChuyenDong = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
/** Bước thầy mở lần trước trong buổi này (nhớ trên máy, theo buổi). */
const khoaNhoBuoc = (idBuoi: string) => `ddh.hanhTrinh.buoc.${idBuoi}`
function docNhoBuoc(idBuoi: string): SoBuoc | null {
  if (!idBuoi) return null
  try {
    const n = Number(localStorage.getItem(khoaNhoBuoc(idBuoi)))
    return n === 1 || n === 2 || n === 3 || n === 4 ? n : null
  } catch {
    return null
  }
}
function ghiNhoBuoc(idBuoi: string, so: SoBuoc) {
  if (!idBuoi) return
  try {
    localStorage.setItem(khoaNhoBuoc(idBuoi), String(so))
  } catch {
    /* máy chặn bộ nhớ: lần sau mở bước mặc định */
  }
}

/** Khung xương chờ một bước: đúng hình khối bước (thang chung `.tt-xuong`), không chữ "Đang mở…". */
function XuongBuoc({ nhan, cao = 120 }: { nhan: string; cao?: number }) {
  return (
    <div className="gvv2-cc-xuong" role="status" aria-label={nhan}>
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: cao, borderRadius: 16 }} />
    </div>
  )
}

/** Vòng số của bước: xong ⇒ dấu tích (kèm chữ ẩn — màu không là kênh duy nhất). */
function VongSo({ so, tt }: { so: number; tt: TrangThaiBuoc }) {
  return (
    <span className="gvv2-ht-vong" aria-hidden="true">
      {tt === 'xong' ? <Check size={18} strokeWidth={3} /> : so}
    </span>
  )
}

/** Tên em vắng (em LỚP CỦA BUỔI chưa điểm danh — cùng luật ô vắng của bước 1, `emVangBuoi`) — tối đa 2 tên, còn lại "và N em". Buổi "Mọi lớp" / chưa có
 *  danh sách lớp ⇒ null (không tính vắng). */
function chuVang(dd: DiemDanhBuoi): string | null {
  const lop = (dd.tt?.buoi.lop ?? '').trim()
  if (!dd.tt || !lop || !dd.tt.lopEm?.length) return null
  const vang = emVangBuoi(dd.tt).map((e) => e.hoTen || e.sbd)
  if (!vang.length) return 'đủ cả lớp'
  return `Vắng: ${vang.slice(0, 2).join(', ')}${vang.length > 2 ? ` và ${vang.length - 2} em` : ''}`
}

/** Thước tiến trình (một điều khiển duy nhất): bấm một bước ⇒ mở bước ấy. */
function ThuocTienTrinh({ dd, tt, phu, onMo }: { dd: DiemDanhBuoi; tt: readonly TrangThaiBuoc[]; phu: readonly ReactNode[]; onMo: (so: SoBuoc) => void }) {
  const siSo = dd.tt?.siSo ?? null
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
      </div>
      <ol>
        {TEN_BUOC.map((ten, i) => {
          const so = (i + 1) as SoBuoc
          return [
            <li key={ten} data-tt={tt[i]}>
              <button type="button" aria-current={tt[i] === 'dang' ? 'step' : undefined} onClick={() => onMo(so)}>
                <VongSo so={so} tt={tt[i]!} />
                <span className="gvv2-ht-thuoc-chu">
                  <span className="gvv2-ht-ten-dai">{ten}</span>
                  <span className="gvv2-ht-ten-ngan" aria-hidden="true">
                    {TEN_NGAN_BUOC[i]}
                  </span>
                  <span className="gvv2-ht-thuoc-phu">{phu[i]}</span>
                  <span className="sr-only"> · {CHU_TRANG_THAI_BUOC[tt[i]!]}</span>
                </span>
              </button>
            </li>,
            i === 0 ? (
              <li key="tach" className="gvv2-ht-tach" aria-hidden="true">
                Bước 2 · 3 · 4 dùng danh sách có mặt — mở bước nào tuỳ việc
              </li>
            ) : null,
          ]
        })}
      </ol>
      <p className="gvv2-ht-thuoc-ghi">Bước 2 · 3 · 4 mở độc lập, cùng dùng danh sách có mặt của bước 1.</p>
    </nav>
  )
}

/** Một thẻ bước. Thu ⇒ một dòng (vòng số, tên, tóm tắt, "Mở" / "Mở lại"); mở ⇒ thân của bước (thành phần sẵn có, tự có tiêu đề). Thân luôn GẮN khi
 *  `gan` (chỉ ẩn) để giữ trạng thái. `dauKhiMo` ⇒ bước tự vẽ tiêu đề cả khi mở (thân không có tiêu đề bước — bước 4). */
function TheBuoc(p: { so: SoBuoc; tt: TrangThaiBuoc; mo: boolean; gan: boolean; tomTat: ReactNode; moTaMo?: ReactNode; dauKhiMo?: boolean; onMo: () => void; children: ReactNode }) {
  const ten = TEN_BUOC[p.so - 1]
  const coDau = !p.mo || p.dauKhiMo
  return (
    <div className="gvv2-ht-buoc" data-buoc-ht={p.so} data-tt={p.tt} data-mo={p.mo} data-dau={coDau || undefined}>
      {coDau && (
        <div className="gvv2-ht-dong">
          <VongSo so={p.so} tt={p.mo ? 'dang' : p.tt} />
          <div className="gvv2-ht-dong-chu">
            <h2>{ten}</h2>
            <p>{p.mo ? (p.moTaMo ?? p.tomTat) : p.tomTat}</p>
          </div>
          {!p.mo && (
            <button type="button" className="gvv2-nut-vien gvv2-ht-nut-mo" aria-label={`${p.tt === 'xong' ? 'Mở lại' : 'Mở'} bước ${p.so} · ${ten}`} onClick={p.onMo}>
              {p.tt === 'xong' ? 'Mở lại' : 'Mở'}
            </button>
          )}
        </div>
      )}
      {p.gan && (
        <div className="gvv2-ht-than" hidden={!p.mo} data-buoc={p.so === 1 ? 1 : undefined}>
          {p.children}
        </div>
      )}
    </div>
  )
}

/** Kiểm tra ôn tập (làn Codex): gập sẵn; thành phần trả null khi lịch tắt ⇒ cả dòng ẩn theo (đo nội dung thật, không đoán). */
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

/** `buocDau` = bước lối vào chỉ định (Hôm nay › Cần thầy chữa ⇒ 4, khoá cũ `dau-gio` ⇒ 2); null ⇒ chọn theo điểm danh (`buocMacDinh`). */
export default function TheBaiDaDay({ buocDau = null }: { buocDau?: SoBuoc | null }) {
  const khung = useRef<HTMLDivElement>(null)
  // MỘT điểm danh cho cả trang — bước 2, 3, 4 nhận cùng `dd`.
  const dd = useDiemDanhBuoi()
  const [mo, setMo] = useState<SoBuoc | null>(buocDau)
  const [daGan4, setDaGan4] = useState(buocDau === 4)
  const [lanCuon, setLanCuon] = useState(0)
  const [choBam2, setChoBam2] = useState(false)
  const [xongDauGio, setXongDauGio] = useState(false)
  const [demDauGio, setDemDauGio] = useState({ goi: 0, dat: 0, chuaDat: 0 })
  const [ttDay, setTtDay] = useState({ day: false, tick: false })
  const nhanTtDay = useCallback((t: { day: boolean; tick: boolean }) => setTtDay((cu) => (cu.day === t.day && cu.tick === t.tick ? cu : t)), [])
  const nhanDemDauGio = useCallback((t: { goi: number; dat: number; chuaDat: number }) => setDemDauGio((cu) => (cu.goi === t.goi && cu.dat === t.dat && cu.chuaDat === t.chuaDat ? cu : t)), [])

  // Số "Cần thầy chữa": số màn Hôm nay đếm; bước 4 đọc xong danh sách ⇒ dùng đúng số ấy và ghi lại cho thanh bên (một con số ở mọi nơi).
  const canThayChua = useSoDemGv((s) => s.canThayChua)
  const datSo = useSoDemGv((s) => s.datSo)
  const [demDanhSach, setDemDanhSach] = useState<number | null>(null)
  const nhanDem = useCallback(
    (n: number) => {
      setDemDanhSach(n)
      datSo({ canThayChua: n })
    },
    [datSo],
  )
  const soCanChua = demDanhSach ?? canThayChua

  const coMat = dd.coMat.length
  const xong = [!!dd.tt && coMat > 0, xongDauGio, ttDay.day, false]
  const tt = trangThaiBuoc(xong, mo)

  // Bước mở khi vào màn: chờ biết buổi (tránh mở bước 1 rồi nhảy).
  useEffect(() => {
    if (mo !== null) return
    const so = buocMacDinh({ chiDinh: buocDau, dangTai: dd.dangTaiBuoi, coMat, nho: docNhoBuoc(dd.idBuoi) })
    // Cập nhật theo hàm: thầy vừa bấm một bước (trước khi lượt này chạy) thì giữ bước thầy bấm.
    if (so) setMo((cu) => cu ?? so)
  }, [mo, buocDau, dd.dangTaiBuoi, coMat, dd.idBuoi])

  // Bước 4 gắn từ lần mở đầu tiên (kể cả mở sẵn theo lối vào / phần nhớ) rồi giữ gắn.
  useEffect(() => {
    if (mo === 4) setDaGan4(true)
  }, [mo])

  const moBuoc = useCallback(
    (so: SoBuoc) => {
      setMo(so)
      if (so === 4) setDaGan4(true)
      ghiNhoBuoc(dd.idBuoi, so)
      setLanCuon((n) => n + 1)
    },
    [dd.idBuoi],
  )
  // Mở xong mới cuộn (thẻ vừa hiện): đầu thẻ ngay dưới thước dính.
  useEffect(() => {
    if (!lanCuon || mo === null) return
    khung.current?.querySelector<HTMLElement>(`[data-buoc-ht="${mo}"]`)?.scrollIntoView?.({ block: 'start', behavior: giamChuyenDong() ? 'auto' : 'smooth' })
  }, [lanCuon, mo])

  /** Từ bản chiếu Nhịp học (phím → / nút): mở bước 2, chờ thẻ hiện rồi bấm nút chính "Chiếu lên bảng" của bước ấy (không bấm được ⇒ chỉ đưa focus). */
  const sangDauGio = useCallback(() => {
    moBuoc(2)
    setChoBam2(true)
  }, [moBuoc])
  // Không mảng phụ thuộc có chủ đích: thân bước 2 là mảnh nạp lười — nút chính chỉ có sau một lượt vẽ muộn; cờ `choBam2` chặn bấm lặp.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!choBam2 || mo !== 2) return
    const nut = khung.current?.querySelector<HTMLButtonElement>('[data-buoc-ht="2"] .m3-nut-chinh')
    if (!nut) return
    setChoBam2(false)
    nut.focus()
    if (!nut.disabled) nut.click()
  })

  const siSo = dd.tt?.siSo ?? null
  const chuCoMat = `${coMat}${siSo ? `/${siSo}` : ''} em có mặt`
  const vang = chuVang(dd)
  const phuGoc: ReactNode[] = [
    xong[0] ? `Xong · ${chuCoMat}` : dd.dangTaiBuoi ? 'Đang tìm buổi…' : dd.tt ? chuCoMat : 'Chưa mở buổi',
    xongDauGio ? `Xong · Đạt ${demDauGio.dat}/${demDauGio.goi}` : demDauGio.goi ? `Đã gọi ${demDauGio.goi} em` : 'Chưa làm',
    ttDay.day ? 'Xong · đã chiếu câu' : 'Chưa làm',
    soCanChua !== null && soCanChua > 0 ? (
      <>
        <b className="gvv2-ht-hp">{soCanChua} chỗ</b> cần chữa
      </>
    ) : soCanChua === 0 ? (
      'Không còn chỗ cần chữa'
    ) : (
      'Câu khó · câu em sai'
    ),
  ]
  // Bước đang mở mà chưa xong ⇒ "Đang mở" (bước 4 giữ số chỗ cần chữa).
  const phuThuoc = phuGoc.map((p, i) => (i + 1 === mo && !xong[i] && i < 3 ? 'Đang mở' : p))

  return (
    // `gvv2-bd` + data-b1…b4: dùng lại kiểu thẻ bước sẵn có (viền xanh lam bước đang mở, vòng số xanh lá bước xong — gv-v2.css).
    <div ref={khung} className="gvv2-nhung gvv2-bd gvv2-ht" data-khoi="buoi-day" data-mo={mo ?? undefined} data-b1={tt[0]} data-b2={tt[1]} data-b3={tt[2]} data-b4={tt[3]}>
      <ThuocTienTrinh dd={dd} tt={tt} phu={phuThuoc} onMo={moBuoc} />
      <div className="gvv2-ht-cac-buoc">
        <TheBuoc
          so={1}
          tt={tt[0]!}
          mo={mo === 1}
          gan
          onMo={() => moBuoc(1)}
          tomTat={
            dd.tt ? (
              <>
                <b className="gvv2-so">{chuCoMat}</b>
                {vang ? ` · ${vang}` : ''}
              </>
            ) : dd.dangTaiBuoi ? (
              'Đang tìm buổi đang mở…'
            ) : (
              'Chưa mở buổi — mở bước này để điểm danh'
            )
          }
        >
          <BuocDiemDanh dd={dd} soBuoc={1} idTieuDe="bd-b1" thanh onSangDauGio={sangDauGio} />
        </TheBuoc>

        <TheBuoc
          so={2}
          tt={tt[1]!}
          mo={mo === 2}
          gan
          onMo={() => moBuoc(2)}
          tomTat={
            demDauGio.goi ? (
              <span className="gvv2-so">
                <b>Đã gọi {demDauGio.goi} em</b> · Đạt {demDauGio.dat} · Chưa đạt {demDauGio.chuaDat}
              </span>
            ) : coMat ? (
              <span className="gvv2-so">Gọi trong {coMat} em có mặt · Đạt / Chưa đạt ghi sổ</span>
            ) : (
              'Cần danh sách có mặt ở bước 1 — app chỉ gọi em có mặt'
            )
          }
        >
          {!coMat && !dd.dangTaiBuoi && (
            <p className="gvv2-ht-can">
              Chưa có danh sách có mặt — điểm danh ở bước 1 trước.
              <button type="button" className="gvv2-nut-vien" onClick={() => moBuoc(1)}>
                Về bước 1
              </button>
            </p>
          )}
          <Suspense fallback={<XuongBuoc nhan="Đang mở bước Gọi lên bảng đầu giờ" />}>
            <KiemTraDauGio dd={dd} soBuoc={2} onXong={setXongDauGio} onTomTat={nhanDemDauGio} />
          </Suspense>
        </TheBuoc>

        <TheBuoc
          so={3}
          tt={tt[2]!}
          mo={mo === 3}
          gan
          onMo={() => moBuoc(3)}
          tomTat={ttDay.day ? <b>Đã chiếu câu</b> : 'Chọn câu trong kho Dạy học, chiếu và gọi em có mặt lên bảng'}
        >
          <Suspense fallback={<XuongBuoc nhan="Đang mở bước Dạy học" cao={200} />}>
            <DayHocLenBang dd={dd} soBuocDau={3} onTrangThai={nhanTtDay} sauBaiHomNay={<BangBaiDangGiao onMoChuaBai={() => moBuoc(4)} />} />
          </Suspense>
        </TheBuoc>

        <TheBuoc
          so={4}
          tt={tt[3]!}
          mo={mo === 4}
          gan={daGan4 || mo === 4}
          dauKhiMo
          onMo={() => moBuoc(4)}
          moTaMo="Chiếu lên bảng · mỗi câu gọi một em có mặt đã làm sai lên chữa."
          tomTat={
            soCanChua ? (
              <span className="gvv2-so">
                <b className="gvv2-ht-hp">{soCanChua} chỗ</b> học sinh cần chữa · gọi em có mặt làm sai lên chữa
              </span>
            ) : (
              'Câu khó & tính toán thầy chọn · câu học sinh cần chữa'
            )
          }
        >
          <Suspense fallback={<XuongBuoc nhan="Đang mở bước Chữa câu khó & tính toán" cao={200} />}>
            <TheCanThayChua onDem={nhanDem} />
          </Suspense>
        </TheBuoc>

        <KiemTraOnTap />
      </div>
    </div>
  )
}
