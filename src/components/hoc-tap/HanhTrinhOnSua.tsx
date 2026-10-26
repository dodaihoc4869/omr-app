import type { ReactNode } from 'react'
import { ArrowRight, Check, ChevronRight, Flag, History, Layers, Lock, RefreshCw, Wrench } from 'lucide-react'
import type { SanhHoa2 } from '../hoa2/api'
import { BieuTuongTuSua, Khung64, lapLanh } from './BieuTuongTuSua'
import { TANG, TEN_TU_SUA } from './HocTapHomNay'
import './hanh-trinh-on-sua.css'
import { laTrong } from '../../lib/trong-hs'

// ĐỢT 19 · LÀN N (13/10) — hai tab "Hành trình" và "Ôn & sửa" thiết kế lại (thầy: "cực đẹp, khoa học, thân thiện trực quan các nút bấm gọn gàng đẹp
// mắt" · "rõ từng phần vô cùng đẹp mắt trực quan khoa học thân thiện"). Khối NẠP KHI MỞ TAB (`lazy` trong HocTapHomNay) ⇒ không thêm byte tải mở app.
//   · Hành trình: thang 4 tầng thành lộ trình có hình vẽ riêng mỗi tầng (tầng đang luyện nổi bật, tầng đã vững có dấu, nhãn chữ ngay dưới) + thẻ từng bài
//     (tên · tầng nếu máy chủ gửi · "Gặp câu gốc a/b câu" · hạn). BỎ dòng chú giải màu. Nút "Học tiếp · N câu" gọn (≤ 360 px trên máy tính).
//   · Ôn & sửa: bốn thẻ có danh tính riêng — Tự sửa lỗi nổi bật nhất (số câu chờ sửa), ba thẻ phụ. Cùng hàm bấm như trước.
// LỖI 13/10 "Chưa có danh sách bài." khi Gói 7 bật: `hoc-tap-sanh` dạng Gói 7 KHÔNG gửi `hanhTrinh` ⇒ trước đây danh sách rỗng. Nay bài dựng từ `goi7.goi`
// (dữ liệu đã có), thêm bài của `hanhTrinh.bai` (bản Hành trình) không trùng tên. Tầng chỉ hiện khi máy chủ gửi số thật (`goi7.tang`, `goi7.goi[].tang`,
// `hanhTrinh.tang`, `hanhTrinh.bai[].tangMo`).

type Tang = 1 | 2 | 3 | 4
/** Một bài trên tab Hành trình. Trường vắng ⇒ không vẽ phần ấy (không bịa). */
export interface BaiEm { khoa: string; ten: string; tang?: Tang; gap?: { da: number; tong: number }; han?: string; quaHan?: boolean; choNguon?: boolean }

/** Bài em đang luyện: Gói 7 trước (hạn gần trước như máy chủ xếp), rồi bài Hành trình (tầng cao trước) chưa có tên trong Gói 7. */
export function baiHanhTrinhEm(sanh: SanhHoa2 | null | undefined): BaiEm[] {
  if (!sanh) return []
  const ra: BaiEm[] = (sanh.goi7?.goi ?? []).map((g) => ({
    khoa: g.id, ten: g.ten, ...(g.tang ? { tang: g.tang } : {}),
    ...(g.nguonDayDu === false ? { choNguon: true } : { gap: { da: g.daGap, tong: g.tong } }),
    ...(g.han ? { han: g.han } : {}), ...(g.quaHan ? { quaHan: true } : {}),
  }))
  const co = new Set(ra.map((b) => b.ten))
  for (const b of [...(sanh.hanhTrinh?.bai ?? [])].sort((x, y) => y.tangMo - x.tangMo)) if (!co.has(b.ten)) ra.push({ khoa: b.khoa, ten: b.ten, tang: b.tangMo })
  return ra
}
/** Tầng chung của em: Hành trình (`hanhTrinh.tang`) hoặc Gói 7 (`goi7.tang`, máy chủ mới). Vắng ⇒ thang trung tính. */
export const tangChungEm = (sanh: SanhHoa2 | null | undefined): Tang | undefined => {
  const t = sanh?.hanhTrinh?.tang ?? sanh?.goi7?.tang
  return t === 1 || t === 2 || t === 3 || t === 4 ? t : undefined
}
const ttTang = (i: number, tang?: Tang) => (!tang ? undefined : i + 1 < tang ? 'vung' : i + 1 === tang ? 'dang' : 'khoa')
const CHU_TT = { vung: 'Đã vững', dang: 'Đang luyện', khoa: 'Còn khoá' } as const
const hienNgay = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

// ── Hình vẽ riêng (cùng khung `Khung64`: nền gradient dịu, vệt bóng, nét tròn đầu 2.5) ──
const HINH_TANG: ReactNode[] = [
  // Nền: ba viên gạch móng + mầm non
  <Khung64 key="nen" sac="xanh">
    <rect className="bt-v" x="12" y="39" width="19" height="13" rx="4" /><rect className="bt-v" x="33" y="39" width="19" height="13" rx="4" />
    <rect className="bt-v" x="22.5" y="24" width="19" height="13" rx="4" />
    <path className="bt-n" d="M32 24v-6" /><path className="bt-v" d="M32 19c-5 0-8-3-8-8 5 0 8 3 8 8zm0-2c0-4.5 3-7.5 8-7.5 0 4.5-3 7.5-8 7.5z" />
  </Khung64>,
  // Hiểu: bóng đèn sáng
  <Khung64 key="hieu" sac="cam">
    <path className="bt-n bt-sang" d="M32 5v4M17.5 12.5l2.8 2.8M46.5 12.5l-2.8 2.8M9 27h4M51 27h4" />
    <path className="bt-v" d="M32 14a13 13 0 0 0-7.5 23.6c1.3 1 2 2.3 2 3.9V43h11v-1.5c0-1.6.7-2.9 2-3.9A13 13 0 0 0 32 14z" />
    <path className="bt-n" d="M28 30l2.7 3 1.3-3 1.3 3 2.7-3" />
    <rect className="bt-dam" x="26" y="45" width="12" height="4" rx="2" /><rect className="bt-dam" x="27.5" y="50.5" width="9" height="3.5" rx="1.75" />
  </Khung64>,
  // Vận dụng: bình tam giác đang phản ứng
  <Khung64 key="van-dung" sac="tim">
    <path className="bt-v" d="M26 11h12a2 2 0 0 1 0 4h-1v9.5l11 19.5c1.6 2.9-.5 6-3.7 6H19.7c-3.2 0-5.3-3.1-3.7-6L27 24.5V15h-1a2 2 0 0 1 0-4z" />
    <path className="bt-long" d="M20.5 36h23l4.5 8c1.6 2.9-.5 6-3.7 6H19.7c-3.2 0-5.3-3.1-3.7-6z" />
    <circle className="bt-v" cx="28" cy="44" r="2.2" /><circle className="bt-v" cx="35" cy="46.5" r="1.5" />
    <path className="bt-v" d={lapLanh(47, 15, 4)} />
  </Khung64>,
  // Tổng hợp: phân tử nối các mảng kiến thức
  <Khung64 key="tong-hop" sac="do">
    <path className="bt-n bt-sang" strokeWidth="3.5" d="M32 32 18 21m14 11 14-11M32 32v15" />
    <circle className="bt-v" cx="18" cy="21" r="6" /><circle className="bt-v" cx="46" cy="21" r="6" /><circle className="bt-v" cx="32" cy="48" r="6" />
    <circle className="bt-dam" cx="32" cy="32" r="8" /><circle className="bt-v bt-mo" cx="29.5" cy="29.5" r="2.5" />
  </Khung64>,
]
const HinhCauDaLam = () => <Khung64 sac="cham">
  <rect className="bt-v" opacity=".55" x="21" y="9" width="29" height="37" rx="6" /><rect className="bt-v" x="13" y="15" width="29" height="39" rx="6" />
  <path className="bt-n" d="M18.5 26l2.5 2.5 4.5-5M18.5 37l2.5 2.5 4.5-5" /><path className="bt-n bt-mo" d="M29.5 26h7M29.5 37h7M18.5 47h12" />
  <circle className="bt-dam" cx="45" cy="45" r="10.5" /><circle className="bt-v" cx="45" cy="45" r="7.5" /><path className="bt-n" d="M45 40.5V45l3 2" />
</Khung64>
const HinhTuLuyen = () => <Khung64 sac="xanh">
  <circle className="bt-v" cx="29" cy="35" r="18" /><circle className="bt-long" cx="29" cy="35" r="12" /><circle className="bt-v" cx="29" cy="35" r="6.5" />
  <circle className="bt-dam" cx="29" cy="35" r="3" />
  <path className="bt-n" strokeWidth="3" transform="rotate(-45 29 35)" d="M30 35h26M51.5 30.5 47 35l4.5 4.5M57 30.5 52.5 35l4.5 4.5" />
</Khung64>
const HinhLuyenLai = () => <Khung64 sac="do">
  <rect className="bt-v" x="13" y="10" width="30" height="40" rx="6" />
  <path className="bt-n bt-mo" d="M19 19.5h10M19 27h18M19 34.5h9" /><path className="bt-n bt-sai" d="M33 17l5 5m0-5-5 5" />
  <circle className="bt-dam" cx="44" cy="44" r="12" /><path className="bt-n bt-sang" d="M44 38a6 6 0 1 1-6 6" /><path className="bt-v" d="M34.5 45.5 38 40l3.5 5.5z" />
</Khung64>
const DauVung = () => <svg className="htn-dau" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="9.5" /><path d="M6.5 11.5l3 3 6-7" /></svg>

/** «Trong» (bản vẽ hs-hanh-trinh / hs-on-sua, thầy chốt 26/10): ô bậc đánh số + dấu (vững ✓ · đang luyện ⚑ · còn khoá 🔒), chấm tầng ở dòng bài,
 *  biểu tượng nét thay hình vẽ minh hoạ — chỉ đổi trình bày, cùng chữ, cùng số. */
const DAU_BAC = { vung: <Check size={16} aria-hidden="true" />, dang: <Flag size={16} aria-hidden="true" />, khoa: <Lock size={16} aria-hidden="true" /> } as const
const ChamTang = ({ tang }: { tang: Tang }) => <span className="tr-cham-tang" aria-hidden="true">{[1, 2, 3, 4].map((i) => <i key={i} data-on={i <= tang || undefined} />)}</span>

function TheBai({ b, trong }: { b: BaiEm; trong?: boolean }) {
  const ti = b.gap && b.gap.tong > 0 ? Math.round((100 * b.gap.da) / b.gap.tong) : 0
  return <article className="htn-bai" aria-label={b.ten}>
    <div className="htn-bai-dau">
      {b.tang && (trong ? <ChamTang tang={b.tang} /> : <span className="htn-bai-hinh">{HINH_TANG[b.tang - 1]}</span>)}
      <span className="htn-bai-ten"><h3>{b.ten}</h3>{b.tang && <small>Đang luyện tầng {TANG[b.tang - 1]}</small>}</span>
    </div>
    {b.gap && <div className="htn-gap">
      <p className="htn-so"><span>Gặp câu gốc</span><b>{b.gap.da}/{b.gap.tong} câu</b></p>
      <div className="htn-thanh" role="progressbar" aria-label={`Câu gốc đã gặp trong ${b.ten}`} aria-valuemin={0} aria-valuemax={b.gap.tong} aria-valuenow={b.gap.da}><i style={{ width: `${ti}%` }} /></div>
    </div>}
    {b.choNguon && <p className="htn-phu">Bộ bài đang chờ đủ nguồn</p>}
    {b.han && <p className="htn-han" data-qua={b.quaHan || undefined}>{b.quaHan ? `Đã qua hạn ${hienNgay(b.han)}` : `Hạn ${hienNgay(b.han)}`}</p>}
  </article>
}

function TheOn({ ten, mo, sac, hinh, onClick }: { ten: string; mo: string; sac: string; hinh: ReactNode; onClick: () => void }) {
  return <button type="button" className="htn-on" data-sac={sac} onClick={onClick}>
    <span className="htn-on-hinh">{hinh}</span>
    <span className="htn-on-chu"><strong>{ten}</strong><small>{mo}</small></span>
    <ChevronRight size={20} aria-hidden="true" className="htn-on-mui" />
  </button>
}

export interface PropsHanhTrinhOnSua {
  muc: 'hanh-trinh' | 'on-lai'
  sanh: SanhHoa2 | null
  dangTai: boolean
  /** Nút "Học tiếp · N câu" do màn chính dựng (đúng chữ / khoá như Hôm nay). */
  nut: ReactNode
  /** Số câu đang chờ em sửa: null ⇒ chưa biết (không ghi số), 0 ⇒ không còn câu. */
  soSua: number | null
  onChua: () => void; onXemLai: () => void; onTuLuyen: () => void; onLuyenLai?: () => void
}

export default function HanhTrinhOnSua(p: PropsHanhTrinhOnSua) {
  const trong = laTrong()
  if (p.muc === 'on-lai') {
    const coSo = !!p.soSua && p.soSua > 0
    return <div className="htn-os">
      <button type="button" className="htn-sua" data-co={coSo || undefined} onClick={p.onChua}>
        <span className="htn-sua-hinh">{trong ? <Wrench size={20} aria-hidden="true" /> : <BieuTuongTuSua hien />}</span>
        <span className="htn-sua-chu"><strong>{TEN_TU_SUA}</strong><small>{p.soSua === 0 ? 'Không còn câu cần sửa' : coSo ? 'Câu đang chờ em sửa' : 'Câu em làm sai'}</small></span>
        {coSo && <span className="htn-sua-so"><b>{p.soSua}</b> câu</span>}
        {coSo ? <span className="htn-sua-di">Sửa lỗi ngay<ArrowRight size={20} aria-hidden="true" /></span> : <ChevronRight size={22} aria-hidden="true" className="htn-sua-mui" />}
      </button>
      <div className="htn-on-ds">
        <TheOn ten="Câu đã làm" mo="Lời giải và lịch ôn từng câu" sac="cham" hinh={trong ? <History size={20} aria-hidden="true" /> : <HinhCauDaLam />} onClick={p.onXemLai} />
        <TheOn ten="Tu luyện" mo="Luyện thêm theo chương, dạng, mức" sac="xanh" hinh={trong ? <Layers size={20} aria-hidden="true" /> : <HinhTuLuyen />} onClick={p.onTuLuyen} />
        {p.onLuyenLai && <TheOn ten="Luyện lại từ bài kiểm tra" mo="Câu sai trong các bài kiểm tra" sac="do" hinh={trong ? <RefreshCw size={20} aria-hidden="true" /> : <HinhLuyenLai />} onClick={p.onLuyenLai} />}
      </div>
    </div>
  }
  const bai = baiHanhTrinhEm(p.sanh)
  const tang = tangChungEm(p.sanh)
  return <div className="htn-ht">
    <section className="htn-lo" aria-labelledby="htn-lo-tieu">
      <div className="htn-lo-dau">
        <p className="ht2-nhan" id="htn-lo-tieu">Thang 4 tầng của mỗi bài</p>
        {tang && <h2>Em đang luyện tầng <b>{TANG[tang - 1]}</b></h2>}
      </div>
      <ol className="htn-thang" aria-label={tang ? `Tầng đang luyện: ${TANG[tang - 1]}` : 'Thang 4 tầng'}>
        {TANG.map((t, i) => { const tt = ttTang(i, tang); return <li key={t} data-tt={tt}>
          <span className="htn-o">{trong ? <><b>{i + 1}</b>{tt && DAU_BAC[tt]}</> : <>{HINH_TANG[i]}{tt === 'vung' && <DauVung />}</>}</span>
          <strong>{t}</strong>{tt && <small>{CHU_TT[tt]}</small>}
        </li> })}
      </ol>
      {p.nut}
    </section>
    <section className="htn-bai-nhom" aria-labelledby="htn-bai-tieu">
      <h2 id="htn-bai-tieu">Bài đang luyện{bai.length > 0 && <span> · {bai.length} bài</span>}</h2>
      {bai.length > 0 ? bai.map((b) => <TheBai key={b.khoa} b={b} trong={trong} />) : p.dangTai && !p.sanh ? <div className="htn-cho" role="status" aria-busy="true" aria-label="Đang tải bài" /> : <p className="htn-trong">Chưa có bài đang luyện.</p>}
    </section>
  </div>
}
