// LIVE BẢNG — MÁY EM (đợt 1B, thầy duyệt 10/11 «CHỐT BUILD»; đặc tả docs/dac-ta-live-bang-1011.md mục 2.2, 3, 4.4–4.7, 5; bản vẽ docs/ban-ve-live-1011 ảnh 13–27, 33–40).
// Nạp lười từ ManBinhPhanUng khi `viewEm.live.san` / `bat` ⇒ không thêm byte vào đường mở /hs. Thư viện nối (SFU, sổ nét, đệm phát): src/lib/live (đợt 1A).
// LUẬT HIỆN (thầy chốt 10/11 tối: «khi chuyển câu thì vẫn giữ live tiếng với hs, màn hình hs hiện câu hỏi như bình thường, khi bấm gọi lên bảng thu về màn chiếu
// thì lập tức màn hình hs chuyển sang chế độ live … tự động bật mic cho bạn lên bảng») — THAY điểm quyết 5:
//   · `che = 'an'`   : chỉ nối ngầm (tải sổ nét, nối SFU, vẫn phát tiếng nếu đang live) — không vẽ gì (chưa live / đang hiện cảnh báo rời màn).
//   · `che = 'dau'`  : thầy đang live (TIẾNG) nhưng chưa đưa bảng xuống máy em ⇒ màn Bình Phản Ứng như thường + một dấu nhỏ «Thầy đang live» kèm nút tiếng.
//   · `che = 'bang'` : cờ phòng `live.bang` (thầy gọi em lên bảng / bật tay) ⇒ lớp bảng live phủ kín, xoay ngang (Android khoá hướng sau khi toàn màn hình;
//                      iPhone / không khoá được ⇒ xoay hình bằng CSS). Cờ tắt (lượt mới) ⇒ lớp gỡ, nhả khoá ngang, về màn câu hỏi dọc.
// Em ĐƯỢC GỌI LÊN BẢNG: phòng báo `emDuocMoi` ⇒ mic tự bật (`taoLiveEm().batMicLenBang()`, đợt 1C); thẻ «Mic của em đang bật» + nút tắt; máy khác thấy
// «Bạn … đang nói». Thầy chấm / lượt mới / tắt live / «Thu mic» ⇒ phòng thu, thư viện tự thả mic.
// Điều khiển TỰ ẨN: chỉ còn tay nắm màu đội ở mép phải; chạm / vuốt ⇒ khay (tiếng, mạng, đội + kJ). KHÔNG có nút thoát — thầy tắt live thì lớp tự thu.
// ĐỢT 2 (11/11, đặc tả 4.8 — đàm thoại hai chiều): nút chính «Giơ tay» trong khay (và nút tay nhỏ trên dấu «Thầy đang live») ⇒ «Đang giơ tay · Em thứ N
// trong hàng · chạm để hạ tay», huy hiệu bàn tay trên tay nắm khi khay đóng; thầy mời ⇒ tấm giữa màn «Thầy mời em nói» + «Bật mic và nói» + «Để sau»
// (mic KHÔNG tự bật — lần chạm của em là điều kiện để trình duyệt cho mở mic); đang nói ⇒ viên «Em đang nói» luôn hiện + «Xong, tắt mic».
// Em Ở XA (`xa`): không đội, không kJ — tay nắm màu trung tính, khay ẩn dòng đội. Giấy đề soi đúng giấy của thầy: GiayThay.tsx.
// `luot`: dải việc của LƯỢT (đoán bạn lên bảng, tiếp sức, kết quả) do màn Bình Phản Ứng dựng — bảng live không nuốt các việc ấy (đặc tả 4.3c).
// SỬA 11/11 SAU KHI THẦY TEST MÁY THẬT:
//   · «Thanh ẩn và ô tắt mở tiếng ẩn hết vào thanh» rồi (lần 2, cùng ngày) «thanh ẩn trên app hs chuyển lên mép trên đầu của phần thẻ tên» ⇒ tay nắm + khay
//     ở MÉP TRÊN, giữa màn (trên màn câu hỏi: ngay trên đầu thẻ đội / tên của em); khay xổ từ trên xuống; ô tiếng và nút mic nằm TRONG khay (không còn
//     nút nổi riêng trên bảng); hết viên «Thầy đang live» nổi ở đáy màn.
//   · «Nút tạm dừng live» ⇒ phòng báo `nghi` ⇒ dải «Thầy tạm dừng live» (bảng đứng, tiếng ngừng; thầy tiếp tục là có lại ngay).
//   · Em gửi đáp án xong tự về bảng live / thầy gọi lên bảng ép cả lớp vào bảng live: luật ở ManBinhPhanUng (`cheLive`); lớp này báo thư viện
//     `datHienBang` để nhận điểm đang viết đúng lúc bảng hiện. Vào bảng không còn viên «Thầy đang live» chớp giữa màn (chỉ lúc thầy VỪA bật live).
// 11/11 LẦN 3 (thầy, kèm ảnh máy em: «Chuyển mic, tắt tiếng, thanh ẩn sang hẳn góc phải ở giữa bảng đen, tối ưu không gian hiển thị đề và bảng đen phải full để hs
//   đọc rõ, thiết kế ẩn hết vào thanh ẩn») — THAY «mép trên» của lần 2:
//   · MỘT tay nắm ở MÉP PHẢI, giữa chiều cao bảng đen: viên thuốc dọc mảnh màu đội, mờ khi không chạm, bút của thầy tới gần thì mờ hẳn. KHÔNG còn gì nổi
//     riêng: hết viên «Tiếng đang tắt», hết huy hiệu mic tròn — trạng thái báo bằng DẤU RẤT NHỎ xếp dọc trên tay nắm (tiếng tắt · mic mở · giơ tay · mạng yếu).
//   · Khay trượt ra từ mép phải (đè lên mép bảng, không đẩy bố cục), tự thu sau 4 giây / chạm ra ngoài. Lần ĐẦU vào live mà tiếng đang tắt: khay tự mở
//     3 giây cho em thấy nút «Tiếng» (một lần mỗi buổi) — thay cho viên nổi cũ.
//   · Giấy đề + bảng đen PHỦ KÍN: bo-cuc.ts thôi chừa dải tay nắm, bỏ lề tờ chiếu, nới ô giấy / ô bảng tới mép khung nhìn (`boCucEm`).
//   · Màn câu hỏi: tay nắm cũng ở mép phải nhưng đứng TRÊN nút «Gửi» nổi; khay mở ra bên trái cột nút «Gửi» (không che nút).
// 11/11 CHIỀU (thầy: «Làm chuẩn cái này luôn nhé. Tối ưu cho hs nhất có thể» — sau khi biết bản phủ kín chưa làm chữ to hơn vì giấy + bảng trói nhau bằng MỘT
//   phép co): GIẤY ĐỀ và BẢNG ĐEN co giãn ĐỘC LẬP (KhungDocLap.tsx + bo-cuc-doc-lap.ts, đặc tả 4.3h) — mỗi khung co theo bề ngang của chính nó, cao quá thì
//   cuộn; máy tự ưu tiên khung thầy đang viết (trễ 2 giây), em kéo vạch chia được, chạm hai lần vào khung nào thì khung đó phủ kín. Lớp này chỉ còn đo khổ
//   hình + vòng khung hình + các thứ nổi (khay, dải báo, dải lượt).
// AN TOÀN: lớp này không nhận gì về đáp án; đề do màn Bình Phản Ứng dựng từ `viewEm.luot.cau` (đã lọc) rồi truyền vào.
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MutableRefObject, type ReactNode } from 'react'
import type { SuKienBut } from '../../lib/but-bang-loi'
import { MAU_CHIEU } from '../../lib/bpu/mau-chieu'
import { DOI_BPU, kyHieu, tenNgan } from '../../lib/bpu/phong'
import { GIAO_DIEN_DOT_2 } from '../../lib/bpu/phong-live'
import { taoLiveEm, type LiveEm, type TrangThaiLiveEm, type ViewLiveEm } from '../../lib/live'
import { datKiemQuyenNgoai, khoaXoay } from '../bpu/tat-man'
import { anToanHinh, canXoayCss, giaiTrang } from './bo-cuc'
import ChonLoa from './ChonLoa'
import type { Vung } from './bo-cuc-doc-lap'
import { daiLuot, type DuLieuLuot } from './DaiLuot'
import { chonHeSoGiay } from './vua-giay'
import { DauGiay, PhuongAnTinh } from './GiayDung'
import GiayThay, { soiDuoc, type BoChu, type CauGiay } from './GiayThay'
import KhungDocLap, { type HinhDL, type TayKhungDL } from './KhungDocLap'
import './live-em.css'

export interface CauNoiPhongEm { tin: ((d: unknown) => void) | null; noiLai: (() => void) | null }
export interface PropsLopLive {
  ve: string
  goc: string
  /** Gửi thẳng qua WebSocket của phòng (chuỗi JSON hoặc khung nhị phân); kết nối chưa mở ⇒ bỏ (thư viện tự gửi lại khi nối lại). */
  guiTho: (d: string | Uint8Array) => void
  /** Lớp live đăng ký với màn Bình Phản Ứng: màn chuyển MỌI tin của phòng (chữ lẫn nhị phân) vào `tin`, gọi `noiLai` khi WebSocket nối lại. Gỡ = hai null. */
  dangKy: (c: CauNoiPhongEm) => void
  view: NonNullable<ViewLiveEm>
  che: 'an' | 'dau' | 'bang'
  /** (Trước 11/11: màn có nút đáy ⇒ dấu «Thầy đang live» nhích lên.) Dấu nay là tay nắm mép phải nên không còn dùng; giữ để chỗ gọi cũ không vỡ. */
  nang?: boolean
  /** Đề của câu đang chiếu (khối đề dùng chung của chặng); null ⇒ giấy ghi «Thầy đang giảng trên bảng». */
  de: ReactNode | null
  khoaDe: string
  /** Em ở xa (không đội) ⇒ null: tay nắm màu trung tính, khay ẩn dòng đội + kJ. */
  doi: { ten: string; ky: string; kj: number } | null
  matMang: boolean
  /** Phòng đang ghi em «rời màn» ⇒ tiếng ngừng (đặc tả 4.7). */
  roi: boolean
  /** Câu công khai của lượt (không đáp án) — để dựng giấy đề GIỐNG giấy của thầy (GiayThay.tsx); null ⇒ chỉ có cách dựng thường `de`. */
  q?: CauGiay | null
  /** Bộ dựng chữ có công thức của màn làm bài (`ChemText`) — giấy soi dùng lại, không nạp thêm gì. Vắng ⇒ không soi. */
  Chu?: BoChu
  tuLuan?: boolean
  /** Dữ liệu cho dải việc của LƯỢT trên bảng live (đoán bạn lên bảng, tiếp sức, kết quả của em) — dựng ở DaiLuot.tsx. */
  luot?: DuLieuLuot | null
  /** Em ở xa (thuộc lớp, chưa điểm danh, thầy bật «Cho em ở xa vào xem»). */
  xa?: boolean
  /** Số thứ tự câu của lượt («Câu 3» ở đầu giấy đề dựng tại máy em). */
  so?: number | null
}

/** Tấm giấy đề DỰNG THƯỜNG (câu có ảnh / bảng / sơ đồ, giấy lệch giấy thầy): khối đề dùng chung dựng theo bề ngang khung giấy của EM rồi phóng cho vừa
 *  chiều cao khung — chữ to tự nhiên theo khổ máy (hệ số phóng kẹp theo bề ngang khung), đề dài ⇒ cỡ nhỏ nhất + cuộn dọc. */
const GiayDe = memo(function GiayDe({ de, khoa, rong, cao, q, Chu, tuLuan, so }: { de: ReactNode | null; khoa: string; rong: number; cao: number; q?: CauGiay | null; Chu?: BoChu; tuLuan?: boolean; so?: number | null }) {
  const trong = useRef<HTMLDivElement>(null)
  const kMin = Math.max(1, Math.min(1.6, rong / 480)), kMax = Math.max(1.25, Math.min(2.6, rong / 340))
  const [k, setK] = useState(kMin)
  const coDe = de != null
  const da = useRef(0)
  useLayoutEffect(() => {
    const el = trong.current
    if (!el) return
    // Chọn hệ số phóng MỘT lần cho mỗi (câu, khổ ô giấy) bằng cách dò (vua-giay.ts) — bản trước tính lại theo chính chiều cao vừa đổi ⇒ không có điểm dừng,
    // khối đề đổi cỡ mỗi khung hình («đề nhấp nháy lên xuống», thầy 11/11). Chỉ dò lại khi khối đề đổi cao vì lý do KHÁC (ảnh / phông tải xong).
    const do1 = () => {
      const r = chonHeSoGiay((thu) => { el.style.width = `${(rong - 36) / thu}px`; return el.scrollHeight }, cao, kMin, kMax)
      el.style.width = `${(rong - 36) / r.k}px`
      da.current = r.h
      setK(r.k)
    }
    do1()
    if (typeof ResizeObserver !== 'function') return
    const ro = new ResizeObserver(() => { if (Math.abs((el.scrollHeight || 1) - da.current) > 1) do1() })
    ro.observe(el)
    return () => ro.disconnect()
  }, [khoa, rong, cao, coDe, kMin, kMax])
  if (!de) return <p className="lv-giay-trong" style={{ fontSize: Math.max(18, Math.min(34, rong / 18)) }}>Thầy đang giảng trên bảng</p>
  // GIẤY ĐỀ kiểu tờ chiếu (GiayDung.tsx): đầu giấy · thân đề (chữ + ảnh + bảng của câu) · phương án / ý là CHỮ — không có nút trả lời nào
  return <div className="lv-de"><div ref={trong} className="lv-de-trong" style={{ width: (rong - 36) / k, transform: `scale(${k})` }}><div className="lv-gd">{q ? <DauGiay q={q} so={so} tuLuan={!!tuLuan} /> : null}{de}{q && Chu ? <PhuongAnTinh q={q} Chu={Chu} tuLuan={!!tuLuan} /> : null}</div></div></div>
})

function Vach({ n }: { n: number }) {
  return <span className={`lv-vach${n > 0 && n < 3 ? ' yeu' : ''}`} role="img" aria-label={`Chất lượng mạng ${n}/3 vạch`}>{[5, 9, 14].map((h, i) => <i key={h} className={i < n ? 'b' : ''} style={{ height: h }} />)}</span>
}
const bt = (d: ReactNode) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
const BtLoa = () => bt(<><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>)
const BtMic = () => bt(<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>)
const BtLoaTat = () => bt(<><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" /><path d="M16 9.5l5 5m0-5l-5 5" /></>)
const BtMang = () => bt(<path d="M5 20v-4M12 20v-9M19 20V5" />)
const BtChia = () => bt(<path d="M12 4v16M8 9l-3.5 3L8 15M16 9l3.5 3L16 15" />)
const BtTay = () => bt(<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5V4a1.5 1.5 0 0 1 3 0v7m0-5.5a1.5 1.5 0 0 1 3 0V12m0-3a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-1.6a6 6 0 0 1-4.8-2.4L4.5 14.4a1.6 1.6 0 0 1 2.4-2.1L8 13.4" />)

/** Tấm giữa màn «Thầy mời em nói» (ảnh 30). `coMic` false = buổi này máy em chưa phát được mic (live chưa có tiếng) ⇒ em nói trực tiếp. */
function TamMoi({ coMic, onBat, onSau }: { coMic: boolean; onBat: () => void; onSau: () => void }) {
  return (
    <div className="lv-moi" role="dialog" aria-modal="false" aria-label="Thầy mời em nói">
      <span className="lv-moi-bt" aria-hidden="true"><BtMic /></span>
      <h3>Thầy mời em nói</h3>
      <p>{coMic ? 'Cả lớp sẽ nghe em qua máy. Nói xong em bấm «Xong, tắt mic».' : 'Em nói to cho thầy và cả lớp nghe nhé.'}</p>
      {coMic ? <button type="button" className="chinh" onClick={onBat}><BtMic />Bật mic và nói</button> : null}
      <button type="button" className="phu" onClick={onSau}>{coMic ? 'Để sau' : 'Đã rõ'}</button>
    </div>
  )
}
/** Viên «Em đang nói» (ảnh 31) — mic đang mở thì LUÔN HIỆN. `lenBang`: em đang lên bảng (mic tự bật — chữ của đợt 1C). */
function VienNoi({ goc, dangMo, lenBang, onTat, ghi }: { goc?: React.Ref<HTMLDivElement>; dangMo: boolean; lenBang: boolean; onTat: () => void; /** Xem lại Live: buổi live đang được ghi (điểm quyết 2). */ ghi?: boolean }) {
  return (
    <div ref={goc} className="lv-noi" role="status"><span className="lv-song" aria-hidden="true"><i /><i /><i /><i /><i /></span>
      <b>{!dangMo ? 'Đang bật mic…' : lenBang ? 'Mic của em đang bật' : 'Em đang nói'}</b><small>Thầy và cả lớp đang nghe</small>{ghi && dangMo ? <small>Đang ghi để lớp xem lại</small> : null}
      <button type="button" onClick={onTat}>{lenBang ? 'Tắt mic' : 'Xong, tắt mic'}</button></div>
  )
}

/** Dải báo tự ẩn sau `ms` (không che bảng mãi). */
function BaoTam({ ms, children }: { ms: number; children: ReactNode }) {
  const [hien, setHien] = useState(true)
  useEffect(() => { const h = setTimeout(() => setHien(false), ms); return () => clearTimeout(h) }, [ms])
  return hien ? <div className="lv-bao nho" role="status">{children}</div> : null
}
/** Dải «Mất kết nối»: giờ bảng dừng chốt MỘT lần lúc dải hiện (giờ của sự kiện bút cuối cùng nhận được). */
function BaoMatMang({ layLuc }: { layLuc: () => number }) {
  const [dung] = useState(() => { const t = layLuc(); return t ? new Date(t).toLocaleTimeString('vi-VN', { hour12: false }) : '' })
  return <div className="lv-bao" role="status"><i className="quay" aria-hidden="true" /><span>Mất kết nối · đang nối lại…<small>{dung ? `Bảng dừng ở lúc ${dung} · ` : ''}nối lại sẽ tự bắt kịp</small></span><Vach n={0} /></div>
}

const mayYeu = (): boolean => typeof document !== 'undefined' && document.documentElement.classList.contains('may-yeu')
const giamDong = (): boolean => mayYeu() || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)
type HuongMan = { lock?: (h: string) => Promise<void>; unlock?: () => void; type?: string }
const huongMan = (): HuongMan | null => (typeof screen !== 'undefined' ? ((screen as Screen & { orientation?: HuongMan }).orientation ?? null) : null)

/** Dấu trạng thái rất nhỏ trên tay nắm (khay đóng vẫn biết): `nhan` = chữ cho trình đọc màn (nối vào nhãn của tay nắm). */
export interface DauNam { loai: 'tieng' | 'mic' | 'tay' | 'mang'; nhan: string }
const BT_DAU: Record<DauNam['loai'], () => ReactNode> = { tieng: BtLoaTat, mic: BtMic, tay: BtTay, mang: BtMang }
/** Khay tự thu sau ngần này ms không chạm; lần tự mở đầu buổi (tiếng đang tắt) thì ngắn hơn. */
const THU_MS = 4000, GIOI_THIEU_MS = 3000

interface PropsKhay {
  mo: boolean
  datMo: (m: boolean | ((truoc: boolean) => boolean)) => void
  /** Hình đang xoay 90° bằng CSS ⇒ đổi trục con trỏ. */
  xoay?: () => boolean
  /** Bề cao của hình (px) — để kéo tay nắm lên / xuống dọc mép phải. Vắng ⇒ tay nắm đứng yên (màn câu hỏi: không được trôi xuống đè nút «Gửi»). */
  cao?: () => number
  namRef?: MutableRefObject<HTMLButtonElement | null>
  khayRef?: MutableRefObject<HTMLDivElement | null>
  /** Vị trí tay nắm dọc mép phải, 0..1 bề cao hình. */
  namY?: MutableRefObject<number>
  lopNam?: string
  /** Dấu trạng thái xếp dọc trên tay nắm khi khay đóng: tiếng đang tắt · mic của em đang mở · em đang giơ tay · mạng yếu. */
  dau?: DauNam[]
  /** Lần ĐẦU vào live mà tiếng đang tắt ⇒ khay tự mở 3 giây rồi tự thu; `khiGioiThieu` báo lớp trên «đã cho xem» (một lần mỗi buổi). */
  gioiThieu?: boolean
  khiGioiThieu?: () => void
  children: ReactNode
}
/** TAY NẮM + KHAY ở MÉP PHẢI (thầy 11/11 lần 3: «thanh ẩn sang hẳn góc phải ở giữa bảng đen … thiết kế ẩn hết vào thanh ẩn»): viên thuốc DỌC mảnh giữa mép
 *  phải; chạm ⇒ khay trượt ra từ phải; vuốt sang trái từ tay nắm ⇒ khay bám ngón tay; chạm ngoài / 4 giây không chạm ⇒ thu. Kéo dọc ⇒ dời tay nắm dọc mép
 *  phải. Dùng cho cả bảng live lẫn màn câu hỏi. */
function Khay({ mo, datMo, xoay, cao, namRef, khayRef, namY, lopNam, dau, gioiThieu, khiGioiThieu, children }: PropsKhay) {
  const khayTrong = useRef<HTMLDivElement | null>(null), namTrong = useRef<HTMLButtonElement | null>(null)
  const khay = khayRef ?? khayTrong, nam = namRef ?? namTrong
  const henThu = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hanThu = useRef(THU_MS)
  const hoanThu = useCallback(() => { clearTimeout(henThu.current); henThu.current = setTimeout(() => datMo(false), hanThu.current) }, [datMo])
  useEffect(() => { if (mo) hoanThu(); else { clearTimeout(henThu.current); hanThu.current = THU_MS } return () => clearTimeout(henThu.current) }, [mo, hoanThu])
  // Lần đầu vào live mà tiếng đang tắt: tự mở 3 giây (em thấy nút «Tiếng»), không lặp lại trong buổi.
  const baoGioiThieu = useRef(khiGioiThieu)
  baoGioiThieu.current = khiGioiThieu
  useEffect(() => { if (!gioiThieu) return; baoGioiThieu.current?.(); hanThu.current = GIOI_THIEU_MS; datMo(true) }, [gioiThieu, datMo])
  // Chạm ra ngoài khay + tay nắm ⇒ thu.
  useEffect(() => {
    if (!mo) return
    const ngoai = (e: Event) => { const t = e.target as Node | null; if (t && (khay.current?.contains(t) || nam.current?.contains(t))) return; datMo(false) }
    document.addEventListener('pointerdown', ngoai, true)
    return () => document.removeEventListener('pointerdown', ngoai, true)
  }, [mo, datMo, khay, nam])
  const keo = useRef<{ id: number; x0: number; y0: number; kieu: '' | 'ngang' | 'doc' } | null>(null)
  /** Toạ độ con trỏ theo trục của HÌNH (hình xoay 90° ⇒ đổi trục). */
  const toaDo = (e: { clientX: number; clientY: number }) => (xoay?.() ? { x: e.clientY, y: window.innerWidth - e.clientX } : { x: e.clientX, y: e.clientY })
  /** Quãng khay phải trượt để ra hẳn ngoài mép phải (bề rộng khay + khoảng cách tới mép). */
  const quang = () => { const k = khay.current; return k ? k.offsetWidth + 16 + (parseFloat(getComputedStyle(k).right) || 0) : 240 }
  const namXuong = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = toaDo(e)
    keo.current = { id: e.pointerId, x0: p.x, y0: p.y, kieu: '' }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* trình duyệt cũ */ }
  }
  const namDi = (e: React.PointerEvent<HTMLButtonElement>) => {
    const k = keo.current
    if (!k || k.id !== e.pointerId) return
    const p = toaDo(e), dx = p.x - k.x0, dy = p.y - k.y0
    if (!k.kieu && Math.hypot(dx, dy) > 8) k.kieu = Math.abs(dx) >= Math.abs(dy) ? 'ngang' : 'doc'
    if (k.kieu === 'doc') {
      if (!cao || !namY) return
      namY.current = Math.max(0.14, Math.min(0.86, p.y / Math.max(1, cao())))
      e.currentTarget.style.top = `${namY.current * 100}%`
    } else if (k.kieu === 'ngang' && khay.current) {
      // bám ngón tay 1:1 (vuốt từ mép phải vào); kéo quá ⇒ đàn hồi
      const q = quang(), ra = Math.max(0, -dx), vuot = Math.max(0, ra - q)
      khay.current.style.transition = 'none'
      khay.current.style.transform = `translate3d(${(q - Math.min(ra, q) - vuot * 0.25).toFixed(1)}px,-50%,0)`
      khay.current.style.opacity = '1'; khay.current.style.visibility = 'visible'
    }
  }
  const namNha = (e: React.PointerEvent<HTMLButtonElement>) => {
    const k = keo.current
    keo.current = null
    if (!k || k.id !== e.pointerId) return
    const p = toaDo(e)
    if (khay.current) { khay.current.style.transition = ''; khay.current.style.transform = ''; khay.current.style.opacity = ''; khay.current.style.visibility = '' }
    if (k.kieu === 'ngang') datMo(k.x0 - p.x > quang() * 0.3)
    else if (!k.kieu) datMo((m) => !m)
  }
  const ds = dau ?? []
  return (
    <>
      <button ref={nam} type="button" className={`lv-nam${lopNam ? ` ${lopNam}` : ''}`} aria-label={`${mo ? 'Thu khay điều khiển' : 'Mở khay điều khiển'}${ds.length ? ` · ${ds.map((d) => d.nhan).join(' · ')}` : ''}`} aria-expanded={mo}
        onPointerDown={namXuong} onPointerMove={namDi} onPointerUp={namNha} onPointerCancel={namNha}>
        <i />{!ds.length ? null : <span className="lv-nam-dau" aria-hidden="true">{ds.map((d) => { const Bt = BT_DAU[d.loai]; return <b key={d.loai} data-dau={d.loai} title={d.nhan}><Bt /></b> })}</span>}
      </button>
      <div ref={khay} className="lv-khay" data-mo={mo || undefined} inert={!mo} role="group" aria-label="Điều khiển live" onPointerDown={() => { hanThu.current = THU_MS; hoanThu() }}>{children}</div>
    </>
  )
}

/** «Trễ ~N ms» trong khay (thầy 11/11 «tức thì»): trễ tiếng ƯỚC TÍNH miệng thầy → máy này, đọc lại 2 giây một lần lúc khay đang mở. Chưa đo được ⇒ không hiện. */
function TreTieng({ le }: { le: MutableRefObject<LiveEm | null> }) {
  const [ms, setMs] = useState<number | null>(null)
  useEffect(() => {
    let hen: ReturnType<typeof setTimeout> | undefined
    const doc = () => { setMs(le.current?.treUocTinh?.() ?? null); hen = setTimeout(doc, 2000) }
    doc()
    return () => clearTimeout(hen)
  }, [le])
  return ms == null ? null : <small className="lv-tre" title="Ước tính, chưa gồm loa / tai nghe">Trễ ~{Math.round(ms / 5) * 5} ms</small>
}

export default function LopLive({ ve, goc, guiTho, dangKy, view, che, de, khoaDe, doi, matMang, roi, q, Chu, tuLuan, luot, xa, so }: PropsLopLive) {
  const [tt, setTt] = useState<TrangThaiLiveEm | null>(null)
  const le = useRef<LiveEm | null>(null)
  /** Lớp bảng (khi đang hiện) nhận sự kiện bút ở đây. */
  const nhanBut = useRef<((sk: SuKienBut) => void) | null>(null)
  const datNhanBut = useCallback((f: ((sk: SuKienBut) => void) | null) => { nhanBut.current = f }, [])
  const guiRef = useRef(guiTho)
  useEffect(() => { guiRef.current = guiTho }, [guiTho])
  const viewDau = useRef(view)

  useEffect(() => {
    const l = taoLiveEm({
      ve, goc, mayYeu: mayYeu(),
      kenh: { gui: (t) => { guiRef.current(JSON.stringify(t)) }, guiNhiPhan: (k) => { guiRef.current(k) } },
      khiBut: (sk) => { nhanBut.current?.(sk) },
      khiTrangThai: setTt,
    })
    le.current = l
    dangKy({ tin: l.nhanTinPhong, noiLai: l.khiNoiLai })
    datKiemQuyenNgoai(l.dangChoQuyenMic) // hộp hỏi quyền mic đang hiện ⇒ bộ bắt rời màn không báo «cửa sổ nổi»
    l.nhanView(viewDau.current)
    // Lần chạm đầu của em trong buổi mở khoá phát tiếng (đặc tả 4.5 bước 3) — bắt ở `click` (pointerdown của ngón tay không tính là thao tác).
    const cham = () => { void l.moKhoaTieng() }
    window.addEventListener('click', cham, { capture: true, once: true })
    return () => { window.removeEventListener('click', cham, true); dangKy({ tin: null, noiLai: null }); datKiemQuyenNgoai(null); le.current = null; l.huy() }
  }, [ve, goc, dangKy])
  // Rời màn ⇒ tiếng ngừng; về ⇒ nghe tiếp từ hiện tại.
  useEffect(() => {
    const dat = () => le.current?.datRoiMan(roi || document.hidden)
    dat()
    document.addEventListener('visibilitychange', dat)
    return () => document.removeEventListener('visibilitychange', dat)
  }, [roi])

  // EM LÊN BẢNG: phòng cho phép (`duocMoMic`) ⇒ mic tự bật; chưa nối xong SFU thì thử lại mỗi 1,5 giây. Em tự bấm tắt ⇒ thôi không tự bật lại trong lượt gọi
  // này (còn nút «Bật mic lại»). Hết được phép (thầy chấm, lượt mới, thu mic, tắt live) ⇒ thư viện tự thả mic.
  // EM ĐƯỢC MỜI NÓI (đợt 2): mic KHÔNG tự bật — em chạm «Bật mic và nói» (`muonMic`) rồi mới bật; chưa nối xong SFU thì cũng thử lại mỗi 1,5 giây.
  const [emTat, setEmTat] = useState(false)
  const [muonMic, setMuonMic] = useState(false)
  const duocMoi = !!tt?.duocMoi
  const duocMic = !!tt?.duocMoMic, micTat = tt?.mic === 'tat'
  const [duocTruoc, setDuocTruoc] = useState(false)
  if (duocMic !== duocTruoc) { setDuocTruoc(duocMic); if (!duocMic && emTat) setEmTat(false) } // lượt gọi mới ⇒ lại tự bật
  const [moiTruoc, setMoiTruoc] = useState(false)
  if (duocMoi !== moiTruoc) { setMoiTruoc(duocMoi); if (muonMic) setMuonMic(false) } // lời mời mới / hết lời mời ⇒ chờ em chạm lại
  const tuBat = duocMic && micTat && !emTat && (!duocMoi || muonMic)
  useEffect(() => {
    if (!tuBat) return
    const thu = () => { void le.current?.batMicLenBang() }
    thu()
    const h = setInterval(thu, 1500)
    return () => clearInterval(h)
  }, [tuBat])
  const tatMic = useCallback(() => { setEmTat(true); setMuonMic(false); le.current?.tatMic() }, [])
  const batMic = useCallback(() => setEmTat(false), []) // hiệu ứng ở trên thấy `emTat` hết ⇒ tự gọi bật
  // «Bật mic và nói»: gọi NGAY trong lần chạm (trình duyệt chỉ cho mở mic khi có thao tác của em), rồi để hiệu ứng thử lại nếu SFU chưa nối xong.
  const batMicMoi = useCallback(() => { setMuonMic(true); setEmTat(false); void le.current?.batMicLenBang() }, [])
  const deSau = useCallback(() => { setMuonMic(false); le.current?.deSau() }, [])
  const doiTay = useCallback(() => { const l = le.current; if (l) l.gioTay(!l.trangThai().tay) }, [])

  // Thư viện chỉ nhận điểm đang viết lúc bảng live đang hiện (em đang ở màn câu hỏi thì bỏ; nét xong vẫn vào sổ nên vào bảng là đủ nét).
  useEffect(() => { le.current?.datHienBang(che === 'bang') }, [che, tt === null])
  // Viên «Thầy đang live» giữa màn chỉ hiện lúc thầy VỪA bật live (không chớp lại mỗi lần em gửi đáp án rồi về bảng — thầy 11/11: chuyển cảnh tức thì).
  const lucBat = useRef(0)
  const dangBat = !!tt?.bat
  const [batTruoc, setBatTruoc] = useState(false)
  if (dangBat !== batTruoc) { setBatTruoc(dangBat); lucBat.current = dangBat ? Date.now() : 0 }
  const [moDau, setMoDau] = useState(false)
  /** Khay đã tự mở giới thiệu nút «Tiếng» trong buổi này chưa (một lần mỗi buổi, dù ở màn câu hỏi hay bảng live). */
  const daGioiThieu = useRef(false)
  const khiGioiThieu = useCallback(() => { daGioiThieu.current = true }, [])

  if (!tt || che === 'an') return null
  const nghe = tt.nghe && tt.tieng !== 'chua-cau-hinh'
  const coTieng = tt.tieng !== 'chua-cau-hinh'
  /** Trình duyệt chặn phát (chưa có thao tác của em) ⇒ ô «Tiếng» ghi «Chạm để nghe»: chạm là mở khoá, không phải tắt. */
  const biChan = nghe && tt.tieng === 'bi-chan'
  const doiTieng = () => { if (biChan) { void le.current?.moKhoaTieng(); return } le.current?.datTieng(!nghe); if (!nghe) void le.current?.moKhoaTieng() }
  const micMo = tt.mic === 'dang-phat' || tt.mic === 'dang-noi'
  /** Tấm «Thầy mời em nói»: đang được mời, chưa bấm bật (hoặc buổi chưa có tiếng ⇒ em nói trực tiếp). */
  const tamMoi = duocMoi && !micMo && tt.mic !== 'xin-quyen' && !muonMic ? <TamMoi coMic={duocMic} onBat={batMicMoi} onSau={deSau} /> : null
  /** Mic của em LÊN BẢNG (tự bật): điều khiển nằm trong khay; tay nắm mang huy hiệu mic khi mic đang mở (em luôn biết mic đang bật dù khay đóng). */
  const micBang = duocMic && !duocMoi
  const tayDuoc = !micMo && !duocMoi && tt.mic !== 'xin-quyen'
  /** TIẾNG ĐANG TẮT (thầy 11/11: thầy live «Em ở xa», máy em trong lớp mặc định tắt tiếng mà không ai biết) / trình duyệt chặn phát: khay đóng vẫn có DẤU
   *  loa gạch trên tay nắm; lần đầu trong buổi khay tự mở 3 giây cho em thấy nút «Tiếng» (thầy 11/11 lần 3: không còn viên nổi «Tiếng đang tắt»). */
  const tiengTat = tt.bat && !tt.nghi && tt.tieng !== 'chua-cau-hinh' && (!nghe || tt.tieng === 'bi-chan')
  const gioiThieu = tiengTat && !daGioiThieu.current
  /** Dấu rất nhỏ trên tay nắm (em luôn biết dù khay đóng): tiếng đang tắt · mic của em đang mở · em đang giơ tay · mạng yếu. */
  const dauNam = (mangYeu: boolean): DauNam[] => {
    const ds: DauNam[] = []
    if (tiengTat) ds.push({ loai: 'tieng', nhan: nghe ? 'máy chưa phát được tiếng thầy' : 'tiếng đang tắt' })
    if (micMo) ds.push({ loai: 'mic', nhan: 'mic của em đang bật' })
    if (tt.tay) ds.push({ loai: 'tay', nhan: `em đang giơ tay${tt.hangTay ? `, thứ ${tt.hangTay} trong hàng` : ''}` })
    if (mangYeu) ds.push({ loai: 'mang', nhan: 'mạng yếu' })
    return ds
  }
  /** Các dòng của khay — dùng chung cho bảng live và màn câu hỏi. `dau` = dòng đầu (bảng live: sóng «Thầy đang nói» + vạch mạng). */
  /** Em CHƯA gửi mà thầy đã gọi bạn lên bảng (cả lớp bị đưa vào bảng live): lượt đã khoá — nói rõ cho em trong khay. */
  const khoaChuaGui = che === 'bang' && !!luot && (luot.l.pha === 'goi' || luot.l.pha === 'lam-bang') && !luot.l.emTra && !luot.daGuiMay && !!luot.l.goi && luot.l.goi.sbd !== luot.sbd
  const dongKhay = (dau: ReactNode, them?: ReactNode) => (
    <>
      <div className="lv-khay-dau">{tt.nghi ? <span>Thầy tạm dừng live</span> : dau}{nghe && !tt.nghi ? <TreTieng le={le} /> : null}</div>
      {GIAO_DIEN_DOT_2 ? (
        // Nút chính màu đội: «Giơ tay» ⇄ «Đang giơ tay · Em thứ N trong hàng · chạm để hạ tay» (ảnh 28)
        <button type="button" className={`lv-tay${tt.tay ? ' gio' : ''}`} aria-pressed={tt.tay} disabled={!tayDuoc || matMang} onClick={doiTay}>
          <BtTay />{tt.tay ? <span>Đang giơ tay<small>{tt.hangTay ? `Em thứ ${tt.hangTay} trong hàng · ` : ''}chạm để hạ tay</small></span> : <span>Giơ tay</span>}
        </button>
      ) : null}
      {coTieng ? (
        <button type="button" className={`lv-vua${nghe && !biChan ? '' : ' tat'}`} aria-pressed={nghe && !biChan} aria-label={biChan ? 'Máy chưa phát được tiếng thầy. Chạm để nghe' : nghe ? 'Tiếng thầy: đang bật. Chạm để tắt' : 'Tiếng thầy: đang tắt. Chạm để bật'} onClick={doiTieng}>{nghe && !biChan ? <BtLoa /> : <BtLoaTat />}Tiếng<b>{biChan ? 'Chạm để nghe' : nghe ? 'Đang bật' : 'Đang tắt'}</b></button>
      ) : <p className="lv-ghi">Buổi này live chưa có tiếng trên máy. Em nghe thầy giảng trực tiếp.</p>}
      {coTieng && nghe ? <ChonLoa le={le} /> : null}
      {coTieng && !nghe ? <p className="lv-ghi">{xa ? 'Em đang xem từ xa: bật tiếng để nghe thầy giảng.' : 'Đang ngồi trong lớp: em nghe thầy trực tiếp. Đeo tai nghe thì bật tiếng.'}</p> : null}
      {micBang ? (
        <button type="button" className={`lv-vua mic${micMo ? '' : ' tat'}`} aria-pressed={micMo} aria-label={micMo ? 'Mic của em: đang bật. Chạm để tắt mic' : 'Mic của em: đang tắt. Chạm để bật mic lại'} onClick={micMo || tt.mic === 'xin-quyen' ? tatMic : batMic}>
          <BtMic />Mic của em<b>{micMo ? 'Đang bật' : tt.mic === 'xin-quyen' ? 'Đang bật…' : 'Đang tắt'}</b></button>
      ) : null}
      {micBang && micMo ? <p className="lv-ghi">Thầy và cả lớp đang nghe em.{view.ghi ? ' Đang ghi để lớp xem lại.' : ''}</p> : null}
      {khoaChuaGui ? <p className="lv-ghi">Thầy đã gọi bạn lên bảng — câu này đã khoá, em chưa gửi nên để trống.</p> : null}
      {them}
      {doi ? <div className="lv-doi"><span className="ky" aria-hidden="true">{doi.ky}</span><span>{doi.ten}</span><b>{doi.kj.toLocaleString('vi-VN')} kJ</b></div> : null}
    </>
  )
  if (che === 'dau') return (
    <div className="lv-phu lv-dau" role="group" aria-label="Thầy đang live" style={{ ...(MAU_CHIEU as CSSProperties), ...(doi ? {} : { ['--doi' as string]: 'var(--tr-chieu-giay)' }) }}>
      <Khay mo={moDau} datMo={setMoDau} lopNam={`song${micMo ? ' noi' : ''}`} dau={dauNam(matMang)} gioiThieu={gioiThieu} khiGioiThieu={khiGioiThieu}>
        {dongKhay(<span>{tt.banNoi ? `Bạn ${tenNgan(tt.banNoi.ten)} đang nói` : 'Thầy đang live'}</span>)}
      </Khay>
      {tamMoi ?? (tt.mic === 'tu-choi' ? <BaoTam ms={8000}>Máy em chưa cho dùng mic. Em mở Cài đặt của trình duyệt để cho phép, hoặc phát biểu sau.</BaoTam>
        : duocMoi && (micMo || tt.mic === 'xin-quyen') ? <VienNoi dangMo={micMo} lenBang={false} onTat={tatMic} ghi={!!view.ghi} /> : null)}
    </div>
  )
  return <BangLive le={le} datNhanBut={datNhanBut} tt={tt} de={de} khoaDe={khoaDe} matMang={matMang} tatMic={tatMic} vaoMoi={Date.now() - lucBat.current < 1500}
    tamMoi={tamMoi} giay={view.giay ?? null} q={q ?? null} Chu={Chu} tuLuan={!!tuLuan} so={so ?? null} luot={luot ? daiLuot(luot) : null} coDoi={!!doi} dauNam={dauNam} gioiThieu={gioiThieu} khiGioiThieu={khiGioiThieu} dongKhay={dongKhay} ghi={!!view.ghi} />
}

interface PropsBang { le: MutableRefObject<LiveEm | null>; datNhanBut: (f: ((sk: SuKienBut) => void) | null) => void; tt: TrangThaiLiveEm; de: ReactNode | null; khoaDe: string; matMang: boolean; tatMic: () => void
  /** Thầy vừa bật live (≤ 1,5 giây) ⇒ có viên «Thầy đang live» + bảng nở ra; các lần vào bảng sau (em gửi xong, thầy gọi lên bảng) hiện tức thì. */
  vaoMoi: boolean
  tamMoi: ReactNode; giay: NonNullable<ViewLiveEm>['giay']; q: CauGiay | null; Chu?: BoChu; tuLuan: boolean; so: number | null; luot: ReactNode; coDoi: boolean; dauNam: (mangYeu: boolean) => DauNam[]; gioiThieu: boolean; khiGioiThieu: () => void
  dongKhay: (dau: ReactNode, them?: ReactNode) => ReactNode; ghi?: boolean }
/** Khổ HÌNH (đã xoay nếu có) + kiểu giấy của thầy. */
interface KhoHinh { xoay: boolean; w: number; h: number; giayToi: boolean }

function BangLive({ le, datNhanBut, tt, de, khoaDe, matMang, tatMic, vaoMoi, tamMoi, giay, q, Chu, tuLuan, so, luot, coDoi, dauNam, gioiThieu, khiGioiThieu, dongKhay, ghi }: PropsBang) {
  const goc = useRef<HTMLDivElement>(null), kdl = useRef<TayKhungDL>(null)
  const nam = useRef<HTMLButtonElement>(null), khay = useRef<HTMLDivElement>(null), thuoc = useRef<HTMLDivElement>(null), theMic = useRef<HTMLDivElement>(null), daiBan = useRef<HTMLDivElement>(null)
  const trang = useRef({ trang: '', tiLe: 16 / 9 })
  const khoaNgang = useRef(false)
  /** Khung đang phóng kín (em chạm hai lần) · vạch chia đang do em giữ (em đã kéo / tắt «Tự phóng theo thầy»). */
  const [phongTo, setPhongTo] = useState<Vung | null>(null)
  const [tayChia, setTayChia] = useState(false)
  const [bc, setBc] = useState<KhoHinh | null>(null)
  const hinh = useRef<HinhDL | null>(null)
  const [coNet, setCoNet] = useState(false)
  const [vao, setVao] = useState(() => vaoMoi && !giamDong())
  const [mo, setMo] = useState(false)
  const moRef = useRef(mo)
  moRef.current = mo
  const [thayNoi, setThayNoi] = useState(false)
  const [mang, setMang] = useState(3)
  const lucCuoi = useRef(0)
  const layLuc = useCallback(() => lucCuoi.current, [])
  const namY = useRef(0.5)
  // GIẤY ĐỀ GIỐNG GIẤY THẦY (rủi ro R3): bố cục của đúng trang đang chiếu + máy em soi được ⇒ dựng giấy soi rồi tự kiểm; lệch / không soi được ⇒ cách dựng
  // thường + ẨN NÉT TRÊN GIẤY (nét trên bảng đen giữ nguyên), số đo `live-do` mang cờ giấy lệch.
  const [khopGiay, setKhopGiay] = useState(false)
  const datKhop = useCallback((k: boolean) => setKhopGiay(k), [])
  const soi = !!q && !!Chu && soiDuoc(giay, giaiTrang(bc ? trang.current.trang : '').khoa)
  const netGiay = soi && khopGiay
  useEffect(() => { le.current?.datGiayLech(!netGiay) }, [le, netGiay])
  /** Cỡ chữ đề / bề ngang ô giấy của thầy (khối đề = loại 2, cỡ chữ × 10 ở ô thứ 7) ⇒ máy chia bề ngang sao cho chữ đề không dưới 15 px. Giấy không soi
   *  được (dựng thường) ⇒ null: chữ xuống dòng theo khung của em, không phụ thuộc bề ngang khung. */
  const khoiDe = soi && giay ? giay.o.find((b) => b[0] === 2) : undefined
  const tiLeChu = khoiDe && giay && giay.w > 0 && khoiDe[6]! > 0 ? khoiDe[6]! / 10 / giay.w : null

  /** Đo khổ hình + vùng an toàn của máy (đọc thước `env(safe-area-inset-*)`). */
  const doHinh = useCallback((): HinhDL => {
    const W = window.innerWidth, H = window.innerHeight
    const xoay = canXoayCss(W, H, khoaNgang.current)
    const cs = thuoc.current ? getComputedStyle(thuoc.current) : null
    const px = (v: string | undefined) => parseFloat(v || '0') || 0
    return { xoay, w: xoay ? H : W, h: xoay ? W : H, at: anToanHinh({ tren: px(cs?.paddingTop), phai: px(cs?.paddingRight), duoi: px(cs?.paddingBottom), trai: px(cs?.paddingLeft) }, xoay) }
  }, [])
  const layHinh = useCallback((): HinhDL => hinh.current ?? (hinh.current = doHinh()), [doHinh])
  const layTrang = useCallback(() => trang.current, [])
  /** Tính lại bố cục theo màn + trang đang chiếu (hai khung + lớp vẽ: KhungDocLap). */
  const xep = useCallback(() => {
    const m = doHinh(), at = m.at
    hinh.current = m
    setBc({ xoay: m.xoay, w: m.w, h: m.h, giayToi: giaiTrang(trang.current.trang).vung.giayToi })
    goc.current?.style.setProperty('--lv-at-phai', `${at.phai}px`); goc.current?.style.setProperty('--lv-at-duoi', `${at.duoi}px`); goc.current?.style.setProperty('--lv-at-trai', `${at.trai}px`); goc.current?.style.setProperty('--lv-at-tren', `${at.tren ?? 0}px`)
    kdl.current?.xep()
  }, [doHinh])

  // Nối sự kiện bút + vòng khung hình (lớp vẽ nằm trong KhungDocLap — hiệu ứng của nó chạy trước hiệu ứng này).
  useLayoutEffect(() => {
    const l = le.current, t = kdl.current
    if (!t) return
    const ap = (sk: SuKienBut) => {
      lucCuoi.current = Date.now()
      if (sk.loai === 'trang') { const doi = sk.trang !== trang.current.trang || sk.tiLe !== trang.current.tiLe; trang.current = { trang: sk.trang, tiLe: sk.tiLe }; if (doi) xep() }
      t.ap(sk)
    }
    const b = l?.bang()
    if (b) trang.current = { trang: b.trang, tiLe: b.tiLe }
    xep()
    if (b) ap({ loai: 'trang', trang: b.trang, tiLe: b.tiLe, net: b.net.slice() })
    datNhanBut(ap)
    let raf = 0, le2 = false, lucAm = 0, noiDen = 0, dangNoi = false, lucMang = 0, neDen = 0, dangNe = false
    const yeu = mayYeu()
    const khung = (nay: number) => {
      raf = requestAnimationFrame(khung)
      if (yeu && (le2 = !le2)) return // máy yếu: 30 khung / giây
      const lv = le.current, b2 = hinh.current
      if (!lv || !b2) return
      const k = lv.khung()
      // cây bút của thầy (11/11, thay chấm tròn vàng) vẽ ngay trên lớp «đang viết», cùng lượt với đuôi nét; kèm tự ưu tiên khung + giấy tự trôi theo bút
      const p = t.khung(nay, k.dau, k.but, k.cuon)
      // tay nắm đè mép phải bảng đen: bút của thầy tới gần chỗ nó đứng ⇒ MỜ HẲN (không chặn nhìn nét); bút đi khỏi 1,2 giây ⇒ rõ lại
      if (p && p[0] > b2.w - b2.at.phai - 72 && Math.abs(p[1] - namY.current * b2.h) < 84) neDen = nay + 1200
      if ((nay < neDen) !== dangNe) { dangNe = nay < neDen; if (dangNe) nam.current?.setAttribute('data-ne', ''); else nam.current?.removeAttribute('data-ne') }
      if (nay - lucAm > 110) {
        lucAm = nay
        const am = Math.min(1, lv.mucAm() * 3)
        theMic.current?.style.setProperty('--lv-am', Math.min(1, lv.mucAmMic() * 2.2).toFixed(2)) // sóng của thẻ «Mic của em đang bật» theo mic thật
        daiBan.current?.style.setProperty('--lv-am', Math.min(1, lv.mucAmBan() * 3).toFixed(2))
        khay.current?.style.setProperty('--lv-am', am.toFixed(2)) // đặt ngay trên khay (không ở gốc): biến kế thừa đổi ở gốc ⇒ tính lại kiểu cả cây đề
        if (am > 0.08) noiDen = nay + 1200
        if ((nay < noiDen) !== dangNoi) { dangNoi = nay < noiDen; setThayNoi(dangNoi) }
      }
      // vạch tín hiệu trong khay: theo MỨC MẠNG lúc này của đệm phát (12/11: trước lấy trung vị D cả buổi nên mạng vừa xấu không thấy đổi)
      if (nay - lucMang > 1000) { lucMang = nay; const m = lv.soDo().mang; setMang(m === 2 ? 1 : m === 1 ? 2 : 3) }
    }
    raf = requestAnimationFrame(khung)
    return () => { cancelAnimationFrame(raf); datNhanBut(null) }
  }, [le, datNhanBut, xep])

  // Xoay ngang: Android khoá hướng sau khi đã toàn màn hình; không khoá được ⇒ `canXoayCss`. Mọi lần khoá / nhả / đổi hướng ⇒ «khoá xoay» 600 ms
  // để bộ bắt rời màn không báo nhầm chia đôi (tat-man.ts).
  useEffect(() => {
    let song = true
    const khoa = () => {
      const o = huongMan()
      if (!o?.lock || !document.fullscreenElement) { if (khoaNgang.current) { khoaNgang.current = false; xep() } return }
      khoaXoay()
      void o.lock('landscape').then(() => { if (song) { khoaNgang.current = true; khoaXoay(); xep() } }, () => { if (song) { khoaNgang.current = false; xep() } })
    }
    const doi = () => { khoaXoay(); xep() }
    khoa()
    document.addEventListener('fullscreenchange', khoa)
    window.addEventListener('resize', xep)
    window.addEventListener('orientationchange', doi)
    return () => {
      song = false
      document.removeEventListener('fullscreenchange', khoa); window.removeEventListener('resize', xep); window.removeEventListener('orientationchange', doi)
      if (khoaNgang.current) { khoaXoay(); try { huongMan()?.unlock?.() } catch { /* không hỗ trợ */ } }
    }
  }, [xep])

  useEffect(() => { if (!vao) return; const h = setTimeout(() => setVao(false), 620); return () => clearTimeout(h) }, [vao])

  /** Em chạm nền lúc khay đang mở ⇒ thu khay trước (không tính vào chạm hai lần). */
  const khiCham = useCallback((): boolean => { if (!moRef.current) return false; setMo(false); return true }, [])
  const khiNet = useCallback((v: { soNet: () => number; soDo: () => number }) => setCoNet(v.soNet() + v.soDo() > 0), [])
  const dungGiay = useCallback(({ rong, cao }: { rong: number; cao: number }) => (soi && giay && q && Chu
    ? <GiayThay giay={giay} q={q} Chu={Chu} tuLuan={tuLuan} rong={rong} khiKhop={datKhop} duPhong={<GiayDe de={de} khoa={khoaDe} rong={rong} cao={cao} q={q} Chu={Chu} tuLuan={tuLuan} so={so} />} />
    : <GiayDe de={de} khoa={khoaDe} rong={rong} cao={cao} q={q} Chu={Chu} tuLuan={tuLuan} so={so} />), [soi, giay, q, Chu, tuLuan, so, datKhop, de, khoaDe])
  const yeu = mayYeu()

  const nghe = tt.nghe && tt.tieng !== 'chua-cau-hinh'
  /** Mic của em đang mở (em được gọi lên bảng / được mời nói). Bạn đang nói = em khác đang mở mic (thư viện đã loại chính em). */
  const micMo = tt.mic === 'dang-phat' || tt.mic === 'dang-noi'
  const banNoi = tt.banNoi
  const kieu: CSSProperties = { ...(MAU_CHIEU as CSSProperties), ...(bc ? { width: bc.w, height: bc.h } : {}), ...(coDoi ? {} : { ['--doi' as string]: 'var(--tr-chieu-giay)' }) }
  /** Hàng «Tự phóng theo thầy» trong khay: bật = máy tự cho khung thầy đang viết to ra; em kéo vạch chia thì tự tắt (giữ chỗ em chia). Máy yếu: chia cố định. */
  const hangChia = yeu ? null : (
    <button type="button" className={`lv-tu-phong${tayChia ? ' tat' : ''}`} aria-pressed={!tayChia} aria-label={tayChia ? 'Tự phóng theo thầy: đang tắt. Chạm để bật' : 'Tự phóng theo thầy: đang bật. Chạm để tắt'} onClick={() => (tayChia ? kdl.current?.boTay() : kdl.current?.giuTay())}>
      <BtChia />Tự phóng theo thầy<b>{tayChia ? 'Đang tắt' : 'Đang bật'}</b></button>
  )
  return (
    <div ref={goc} className="lv" data-xoay={bc?.xoay || undefined} data-vao={vao || undefined} data-mat={matMang || undefined} data-giay={bc?.giayToi ? 'toi' : 'sang'} data-soi={netGiay || undefined} style={kieu} role="region" aria-label="Thầy đang live: bảng chữa bài">
      <div ref={thuoc} className="lv-thuoc" aria-hidden="true" />
      <div className="lv-nen">
        {/* GIẤY ĐỀ + BẢNG ĐEN: hai khung co giãn độc lập (giấy soi `.lv-gt` nằm trên tấm giấy = đúng ô giấy của thầy đã co) */}
        <KhungDocLap ref={kdl} lop="lv" layHinh={layHinh} layTrang={layTrang} netGiay={netGiay} tiLeChu={tiLeChu} tuUuTien={!yeu} dong={!giamDong()} giay={dungGiay} tamGoc={soi && giay ? { rong: giay.w, cao: giay.h } : null}
          bangTrong={coNet ? null : <p>Bảng đen<br />Thầy viết gì, em thấy ngay ở đây</p>} khiCham={khiCham} khiPhong={setPhongTo} khiTay={setTayChia} khiNet={khiNet} />
      </div>
      {vao ? <div className="lv-vao" role="status"><i aria-hidden="true" />Thầy đang live</div> : null}
      {matMang ? <BaoMatMang layLuc={layLuc} />
        : tt.nghi ? <div className="lv-bao nho" role="status">Thầy tạm dừng live</div>
        : tt.tieng === 'loi' ? <BaoTam ms={6000}>Mạng này chặn tiếng trực tiếp · bảng vẫn chạy</BaoTam>
        : phongTo ? <div className="lv-bao nho duoi" role="status">Chạm hai lần để về toàn cảnh</div> : null}
      {luot && !phongTo ? <div className="lv-luot" onPointerDown={(e) => e.stopPropagation()}>{luot}</div> : null}
      {/* Không còn nút nổi trên bảng (thầy 11/11): mic của em lên bảng điều khiển TRONG khay (tay nắm mang dấu mic rất nhỏ). Chỉ còn tấm mời / viên «Em đang
          nói» của em ĐƯỢC MỜI (đợt 2), dòng báo lỗi mic và dải «Bạn … đang nói». */}
      {tamMoi ? tamMoi : tt.duocMoi && (micMo || tt.mic === 'xin-quyen') ? <VienNoi goc={theMic} dangMo={micMo} lenBang={false} onTat={tatMic} ghi={ghi} />
        : tt.mic === 'tu-choi' || tt.mic === 'loi' ? <div className="lv-bao nho duoi" role="status">{tt.mic === 'tu-choi' ? 'Máy em chưa cho dùng mic. Em mở Cài đặt của trình duyệt để cho phép, hoặc phát biểu sau.' : 'Chưa bật được mic · em nói to cho thầy nghe'}</div>
        : banNoi && !phongTo && !luot ? <div ref={daiBan} className="lv-bao nho duoi ban" role="status" style={{ ['--doi' as string]: `var(${DOI_BPU[banNoi.doi]?.mau ?? '--tr-chieu-giay'})` }}><span className="ky" aria-hidden="true">{kyHieu(banNoi.ten)}</span>Bạn {tenNgan(banNoi.ten)} đang nói<span className="lv-song" aria-hidden="true"><i /><i /><i /></span></div> : null}
      <Khay mo={mo} datMo={setMo} xoay={() => !!hinh.current?.xoay} cao={() => hinh.current?.h ?? window.innerHeight} namRef={nam} khayRef={khay} namY={namY}
        lopNam={(thayNoi && nghe) || micMo ? 'noi' : ''} dau={dauNam(matMang || mang < 3)} gioiThieu={gioiThieu} khiGioiThieu={khiGioiThieu}>
        {dongKhay(<>{thayNoi ? <><span className="lv-song" aria-hidden="true"><i /><i /><i /><i /><i /></span><span>Thầy đang nói</span></> : <span>Thầy đang im</span>}<Vach n={matMang ? 0 : mang} /></>, hangChia)}
      </Khay>
    </div>
  )
}
