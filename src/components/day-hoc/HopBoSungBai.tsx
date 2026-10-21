// HỘP "BỔ SUNG BÀI HÔM NAY" (thầy 21/10: "nút này làm riêng bấm vào popup lên để chọn luôn chứ không gắn vào phần hành trình nữa" + "bỏ cái phần
// tick bài vừa dạy khỏi hành trình đi"; bản vẽ docs/ban-ve-hanh-trinh-2110 khung 04). Mở NGAY TẠI CHỖ từ màn Hôm nay (nút chính "Bổ sung bài hôm
// nay", việc "Lớp chưa có bài mới") và từ lối cũ `boSungBai` của Hành trình — không chuyển màn, không cuộn.
//   · Thân hộp = NGUYÊN chức năng bước "Bài hôm nay" (`useBaiHomNay` + `BuocBaiHomNay anDau`): lớp nhận bài, giao cho ai, cây bài, xác nhận, Giao.
//   · Điểm danh: hộp tự đọc buổi đang mở + danh sách lớp MỘT lần khi mở (không nhịp làm mới) — đủ cho lớp mặc định và chip "Theo điểm danh".
//   · Nhớ lớp + bài đang chọn theo buổi ở khoá `ddh.dayHoc.<buổi>` (hai trường `lopNhan` · `baiChon`, chung với màn Lên bảng): đóng rồi mở lại vẫn còn
//     (lỗi Đợt 16 không quay lại). Ghi = đọc-gộp-ghi, không đè phần nhớ câu chiếu của bước Dạy học.
//   · OMNI tắt / chưa đọc được cờ: hộp nói thật (đang đọc · lỗi + Thử lại · cần bật OMNI ở Cài đặt) — không hộp trống.
//   · Hộp chuẩn app thầy: cổng `createPortal`, Esc đóng, bẫy Tab trong hộp, trả focus về nút đã mở, khoá cuộn trang sau. Đang giao ⇒ chưa đóng được.
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { TeacherExamSource } from '../../data/examContent'
import { layLopThay, type LopThay } from '../../lib/ten-lop-thay'
import { buoiDangMo, xemBuoiHoc, type TrangThaiBuoi } from '../../lib/buoi-hoc-api'
import { khoDayHoc } from '../../lib/day-hoc-len-bang'
import { theoDoiBaiDangGiao } from '../../lib/bai-dang-giao-thay-doi'
import { BuocBaiHomNay, useBaiHomNay, type BaiChonNho } from './BaiHomNay'
import './day-hoc.css'
import './hop-bo-sung-bai.css'

/** Khoá nhớ theo buổi — CÙNG khoá với bảng Dạy học (`DayHocLenBang.tsx`); hộp chỉ đọc / ghi hai trường của mình. */
const khoaNho = (idBuoi: string) => `ddh.dayHoc.${idBuoi || '_'}`
function docNho(idBuoi: string): { lopNhan: string[] | null; baiChon: BaiChonNho | null } {
  try {
    const j = JSON.parse(localStorage.getItem(khoaNho(idBuoi)) || 'null') as { lopNhan?: unknown; baiChon?: Partial<BaiChonNho> } | null
    const lop = Array.isArray(j?.lopNhan) ? [...new Set(j!.lopNhan.filter((x): x is string => typeof x === 'string'))] : null
    const b = j?.baiChon
    return { lopNhan: lop, baiChon: b && typeof b.khoaBai === 'string' && typeof b.khoi === 'string' ? { khoaBai: b.khoaBai, khoi: b.khoi, tenBai: typeof b.tenBai === 'string' ? b.tenBai : '' } : null }
  } catch {
    return { lopNhan: null, baiChon: null }
  }
}
function ghiNho(idBuoi: string, lopNhan: string[] | null, baiChon: BaiChonNho | null) {
  try {
    const cu = JSON.parse(localStorage.getItem(khoaNho(idBuoi)) || 'null') as Record<string, unknown> | null
    localStorage.setItem(khoaNho(idBuoi), JSON.stringify({ maChon: [], boCau: [], giao: {}, ...(cu && typeof cu === 'object' ? cu : {}), lopNhan, baiChon }))
  } catch {
    /* máy chặn bộ nhớ: chỉ mất phần nhớ khi mở lại */
  }
}

/** Buổi đang mở + danh sách lớp, đọc MỘT lần (hai lệnh song song; chi tiết buổi đọc ngay sau khi biết buổi). */
function useBuoiChoHop() {
  const [dsLop, setDsLop] = useState<LopThay[]>([])
  const [tt, setTt] = useState<TrangThaiBuoi | null>(null)
  const [dangTai, setDangTai] = useState(true)
  useEffect(() => {
    let con = true
    void Promise.all([
      layLopThay().then((r) => con && r.ok && setDsLop(r.du.lop)),
      buoiDangMo().then(async (r) => {
        const b = r.ok ? r.du[0] : undefined
        if (!b) return
        const x = await xemBuoiHoc(b.id, true)
        if (con && x.ok) setTt(x.du)
      }),
    ]).finally(() => con && setDangTai(false))
    return () => {
      con = false
    }
  }, [])
  return { dsLop, tt, dangTai }
}

/** Kho Dạy học trên máy (đọc khi cần, một lượt một lúc) — cùng cách đọc với bảng Dạy học. */
function useKhoDayHoc() {
  const [kho, setKho] = useState<TeacherExamSource[] | null>(null)
  const [loiKho, setLoiKho] = useState('')
  const dang = useRef<Promise<TeacherExamSource[]> | null>(null)
  const napKho = useCallback((): Promise<TeacherExamSource[]> => {
    if (kho) return Promise.resolve(kho)
    if (dang.current) return dang.current
    setLoiKho('')
    const cho = (async () => {
      try {
        const [{ loadExamSources }, { khuTrungNguon }, { tachNhieuTheoPhan }] = await Promise.all([import('../../lib/exam-db'), import('../../lib/khu-trung-cau'), import('../../lib/tach-phan-de')])
        const ds = khoDayHoc(await loadExamSources(), khuTrungNguon, tachNhieuTheoPhan)
        setKho(ds)
        return ds
      } catch {
        setLoiKho('Chưa đọc được kho đề trên máy này. Thầy thử tải lại.')
        return []
      } finally {
        dang.current = null
      }
    })()
    dang.current = cho
    return cho
  }, [kho])
  return { kho, loiKho, napKho }
}

const PHIM_DUOC = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** `onDong(daGiao)` — `daGiao` = trong lần mở này đã giao / bỏ tick ít nhất một bài (màn gọi tải lại số của mình). */
export default function HopBoSungBai({ onDong }: { onDong: (daGiao: boolean) => void }) {
  const id = useId()
  const tam = useRef<HTMLElement>(null)
  const nutDong = useRef<HTMLButtonElement>(null)
  const buoi = useBuoiChoHop()
  const { kho, loiKho, napKho } = useKhoDayHoc()
  const bhn = useBaiHomNay(buoi, kho, napKho)
  const idBuoi = buoi.tt?.buoi.id ?? ''
  const daGiao = useRef(false)
  useEffect(() => theoDoiBaiDangGiao(() => (daGiao.current = true)), [])

  // Nạp phần nhớ khi biết buổi (một lần), rồi ghi lại mỗi lần thầy đổi lớp / bài.
  const daNap = useRef(false)
  useEffect(() => {
    if (buoi.dangTai || daNap.current) return
    daNap.current = true
    const n = docNho(idBuoi)
    if (n.lopNhan || n.baiChon) bhn.datNho(n.lopNhan, n.baiChon)
    // Chỉ chạy khi buổi vừa đọc xong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buoi.dangTai, idBuoi])
  useEffect(() => {
    if (daNap.current) ghiNho(idBuoi, bhn.lopTay, bhn.chonNho)
  }, [idBuoi, bhn.lopTay, bhn.chonNho])

  const dangGiao = bhn.dangGiao
  const goiDong = useRef(onDong)
  goiDong.current = onDong
  const dong = useCallback(() => {
    if (dangGiao) return
    goiDong.current(daGiao.current)
  }, [dangGiao])
  const dongMoiNhat = useRef(dong)
  dongMoiNhat.current = dong

  useEffect(() => {
    const cu = document.activeElement as HTMLElement | null
    const cuCuon = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    nutDong.current?.focus()
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Esc trong bộ chọn lớp / em đóng bộ chọn trước.
        if (tam.current?.querySelector('[aria-expanded="true"]')) return
        e.preventDefault()
        dongMoiNhat.current()
        return
      }
      if (e.key !== 'Tab') return
      const nut = [...(tam.current?.querySelectorAll<HTMLElement>(PHIM_DUOC) ?? [])].filter((x) => x.offsetParent !== null || x === nutDong.current)
      const dau = nut[0]
      const cuoi = nut[nut.length - 1]
      if (!dau) {
        e.preventDefault()
        tam.current?.focus()
        return
      }
      if (e.shiftKey && (document.activeElement === dau || !tam.current?.contains(document.activeElement))) {
        e.preventDefault()
        cuoi?.focus()
      } else if (!e.shiftKey && (document.activeElement === cuoi || !tam.current?.contains(document.activeElement))) {
        e.preventDefault()
        dau.focus()
      }
    }
    document.addEventListener('keydown', phim)
    return () => {
      document.removeEventListener('keydown', phim)
      document.body.style.overflow = cuCuon
      if (cu?.isConnected) cu.focus()
    }
  }, [])

  return createPortal(
    <div className="m3 gvv2 hbs-vo">
      <div className="hbs-phu" onMouseDown={(e) => e.target === e.currentTarget && dong()}>
        <section ref={tam} className="hbs-tam" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={`${id}-tieu`} aria-describedby={`${id}-phu`} data-khoi="hop-bo-sung-bai">
          <header className="hbs-dau">
            <div>
              <h2 id={`${id}-tieu`}>Bổ sung bài hôm nay</h2>
              <p id={`${id}-phu`}>Tick bài vừa dạy — app tự giao luyện theo bài cho lớp thầy chọn. Bài đứng trước bài đã tick là bài cũ để ôn lại.</p>
            </div>
            <button ref={nutDong} type="button" className="hbs-dong" aria-label="Đóng" disabled={dangGiao} onClick={dong}>
              <X size={22} aria-hidden="true" />
            </button>
          </header>
          <div className="hbs-than">
            {!bhn.co && bhn.dangTaiCo ? (
              <div className="hbs-xuong" role="status" aria-label="Đang đọc cấu hình giao bài">
                <span className="tt-xuong" />
                <span className="tt-xuong" />
                <span className="tt-xuong" />
              </div>
            ) : bhn.loiCo ? (
              <div className="dh-hang">
                <p className="dh-loi" role="alert">
                  Chưa tải được phần Tick bài: {bhn.loiCo}
                </p>
                <button type="button" className="m3-nut-vien dh-nut-nho" disabled={bhn.dangTaiCo} onClick={() => void bhn.taiCo()}>
                  Thử tải Tick bài lại
                </button>
              </div>
            ) : bhn.co && !bhn.bat ? (
              <p className="dh-phu">Tick bài vừa dạy cần bật OMNI cho lớp ở Cài đặt › OMNI (theo lớp).</p>
            ) : (
              <BuocBaiHomNay bhn={bhn} kho={kho} loiKho={loiKho} thuKho={() => void napKho()} anDau />
            )}
          </div>
        </section>
      </div>
    </div>,
    document.body,
  )
}
