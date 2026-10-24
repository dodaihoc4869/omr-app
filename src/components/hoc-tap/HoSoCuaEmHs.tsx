// "HỒ SƠ LÀM BÀI CỦA EM" — app học sinh (thầy 12/10: "Cho hs bấm vào bảng lười chăm. Khi bấm vào hiển thị đủ hồ sơ như trong nhịp học nhé").
// Bọc ĐÚNG tấm thầy mở ở Hôm nay › Nhịp học (`HoSoLamCauEm`) ở chế độ học sinh, nguồn = hai lệnh học sinh CHỈ ĐỌC (`/hs/ho-so-thai-do`,
// `/hs/lich-su-lam-cau` — src/lib/ho-so-em-hs-api.ts; máy chủ lấy SBD từ token, bỏ lượt chưa được xem kết quả, không đáp án em chọn).
// Nơi mở (thẻ "Hôm nay của em" — làn khác, prop `onMoHoSo`) nạp LƯỜI: `lazy(() => import('../hoc-tap/HoSoCuaEmHs'))`; mảnh này ngoài precache.
//   · Trượt ra từ PHẢI trên máy tính (rộng ≤ 760 px, nền che), TOÀN MÀN trên điện thoại dọc (≤ 600 px) — khung sẵn có của tấm (gv-v2.css).
//   · Esc / nút Đóng (≥ 44 px) / bấm nền che ⇒ `onDong`; Tab giữ trong tấm (tấm lo); đóng xong focus TRỞ VỀ đúng phần tử đã mở tấm (ở đây lo).
//   · Mở ⇒ khoá trang phía sau (`useKhoaCuonTrang`); tấm có MỘT khung cuộn riêng (thân tấm), vuốt được tới đáy, không trôi xuống trang sau.
//   · Vẽ qua cổng (portal) vào <body>: lớp `position: fixed` của tấm không bị khung cha (transform / overflow / inert) cắt hay khoá.
//   · MÀU: xem ho-so-cua-em-hs.css (bảng --gvm-* sẵn có, sáng/tối theo máy như app học sinh; nền che = --phu của app học sinh).
// ĐỢT 18 (13/10 — thầy: "những câu chưa sửa lỗi mà có trong tự sửa lỗi mới hiện sửa câu này, nếu chưa có thì chưa hiện"): có `onChuaCau` ⇒ nạp MỘT lần
// danh sách Tự sửa lỗi (`taiTuSuaLoi` — bản nhớ dưới 1 phút thì dùng lại), dựng tập khoá mở `khoaMoChua(qid)` của câu còn cần sửa (cùng luật nhóm với màn
// Tự sửa lỗi) và giao cho tấm. Đang tải / lỗi / vòng chữa chưa mở ⇒ tập rỗng ⇒ không hộp nào có nút (tấm vẫn đủ, không vỡ).
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import HoSoLamCauEm from '../chien-dich/HoSoLamCauEm'
import { taoNguonHoSoEm } from '../../lib/ho-so-em-hs-api'
import { layHocThatEm, type HocThatEm } from '../../lib/hoc-that-hs-api'
import { useKhoaCuonTrang } from '../../lib/khoa-cuon-trang'
import { mucCanSua, soCauCanSua, taiTuSuaLoi } from '../../lib/tu-sua-loi'
import type { KetQuaDanhSachChua } from '../../lib/chua-cau-sai-api'
import { khoaMoChua } from '../../../server/src/ho-so-em-hs-loc'
// Tấm thầy dựa vào kiểu dáng khung của app thầy (gv-v2.css — chỉ lớp `.gvv2-*`, không luật toàn cục) mà app học sinh không nạp sẵn.
import '../chien-dich/gv-v2.css'
import './ho-so-cua-em-hs.css'

export interface HoSoCuaEmHsProps {
  /** Token phiên của em (cùng token `/hs/nhip-hoc`). */
  token: string
  /** Tên em hiện ở đầu tấm khi máy chủ chưa trả. */
  tenEm: string
  /** Tên lớp hiện ở đầu tấm khi máy chủ chưa trả (vd "12A1"). */
  lop?: string
  onDong(): void
  /** Đợt 16: bấm một hộp "Chưa sửa được" ⇒ mở Tự sửa lỗi đúng câu ấy (đợt 18: chỉ hộp của câu đang ở Tự sửa lỗi và còn cần sửa). `qid` = khoá câu của lệnh `/hs/lich-su-lam-cau` (bản học sinh: "c1", "c2"…
   *  theo hợp đồng lọc server/src/ho-so-em-hs-loc.ts). Cổng học sinh (StudentPortalScreen) nối. Vắng ⇒ hộp không bấm được. */
  onChuaCau?: (qid: string) => void
  /** 6 mức (22/10): hồ sơ trống ⇒ nút "Mở Bài tập về nhà" (cổng học sinh đóng tấm rồi mở màn làm bài). Vắng ⇒ không nút. */
  onMoBaiTap?: () => void
}

/** Bản nhớ danh sách Tự sửa lỗi còn dùng được cho hồ sơ (mở hồ sơ ngay sau khi sửa ở màn Tự sửa lỗi thì bản nhớ đã mới). */
export const NHO_HO_SO_MS = 60_000

/** Tập khoá mở ("g<số>") của câu còn cần sửa trong danh sách Tự sửa lỗi. Không có danh sách ⇒ tập rỗng. */
export function khoaCanSua(kq: KetQuaDanhSachChua | null | undefined, nayMs: number): ReadonlySet<string> {
  return new Set(mucCanSua(kq, nayMs).map((m) => khoaMoChua(m.qid)))
}

const RONG: ReadonlySet<string> = new Set()

export default function HoSoCuaEmHs({ token, tenEm, lop, onDong, onChuaCau, onMoBaiTap }: HoSoCuaEmHsProps) {
  useKhoaCuonTrang(true)
  const nguon = useMemo(() => taoNguonHoSoEm(token), [token])
  const coDuong = !!onChuaCau
  const [coTheChua, setCoTheChua] = useState<ReadonlySet<string>>(RONG)
  const [soCanSua, setSoCanSua] = useState<number | null>(null)
  useEffect(() => {
    if (!coDuong || !token) return
    let huy = false
    void taiTuSuaLoi(token, { toiDaMs: NHO_HO_SO_MS }).then((kq) => {
      if (!huy) { setCoTheChua(khoaCanSua(kq, Date.now())); setSoCanSua(soCauCanSua(kq, Date.now())) }
    })
    return () => {
      huy = true
    }
  }, [coDuong, token])
  const em = useMemo(() => ({ sbd: '', ten: tenEm, khoi: null, ...(lop ? { lop } : {}) }), [tenEm, lop])
  // (24/10) Học thật · Đối phó: chỉ hiện khi thầy đã bật (máy chủ trả null ⇒ không thẻ). Mở hồ sơ ⇒ máy chủ ghi «em đã xem» lời nhắc.
  const [ht, setHt] = useState<HocThatEm | null>(null)
  useEffect(() => {
    let huy = false
    void layHocThatEm(token).then((x) => { if (!huy) setHt(x) })
    return () => { huy = true }
  }, [token])
  // Trả focus: phần tử đang focus lúc mở (nút / bảng em vừa bấm) — đóng tấm thì focus về đó nếu còn trên trang.
  const moTu = useRef<HTMLElement | null>(null)
  if (moTu.current === null && typeof document !== 'undefined') moTu.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  useEffect(
    () => () => {
      const el = moTu.current
      if (el && el.isConnected && el !== document.body) el.focus()
    },
    [],
  )
  return createPortal(
    <div className="hs-ho-so-em" data-che-do="hoc-sinh">
      <HoSoLamCauEm em={em} nguon={nguon} cheDo="hoc-sinh" onDong={onDong} onChuaCau={onChuaCau} coTheChua={coTheChua} soCauCanSua={soCanSua ?? undefined} onMoBaiTap={onMoBaiTap} dauThan={ht ? <TheHocThat ht={ht} /> : null} />
    </div>,
    document.body,
  )
}

/** Thẻ Học thật / Đối phó của em: Đối phó kèm lý do bằng số để em tự sửa; Học thật không liệt kê lỗi nhỏ. */
export function TheHocThat({ ht }: { ht: HocThatEm }) {
  const tuanTruoc = ht.lichSu.slice(1, 4)
  if (ht.nhan === 'Học thật') {
    return (
      <div className="hsv-nhan" role="status">
        <small>Cách em học 14 ngày qua</small>
        <b>Học thật</b>
        {tuanTruoc.length > 0 && <span className="hsv-ghi">Các tuần trước: {tuanTruoc.map((x) => x.nhan).join(', ')}.</span>}
      </div>
    )
  }
  return (
    <div className="hsv-canh" role="alert">
      <div className="hsv-canh-dau">Thầy xếp em vào nhóm Đối phó</div>
      {ht.lyDo.length > 0 && <ol>{ht.lyDo.map((x) => <li key={x}>{x}</li>)}</ol>}
      <p>Hai tuần liền làm bài thật (không bấm vội, không bỏ bài) thì em về lại nhóm Học thật.</p>
    </div>
  )
}
