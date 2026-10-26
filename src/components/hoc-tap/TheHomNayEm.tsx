import { lazy, Suspense, type ReactNode } from 'react'
import { ArrowRight, Check, Flame } from 'lucide-react'
import { CAU_MOI_CHANG, soChangXong, type SoHomNay } from './lam-bai'
import { nhipTheoSanh, type NhipHocHs } from '../../lib/nhip-hoc-em'
// 26/10 (luật tốc độ — «Trong» thay màn Hôm nay cũ): hook + hàm chữ dùng chung tách ra nhip-hom-nay.ts (nằm trong nhóm mở app); thẻ này chỉ giao diện cũ
// (ddh.trong = 'tat') dùng ⇒ HocTapHomNay nạp LƯỜI, không vào nhóm mở app học sinh. Xuất lại để nơi nhập cũ (test) giữ nguyên.
import { chiaChang, chuNutHoc, useNhipHocEm } from './nhip-hom-nay'
export { chiaChang, chuNutHoc, useNhipHocEm, xoaNhoNhipHocEm } from './nhip-hom-nay'
// Đợt 16: phần Nhịp học (dải ô ngày, Lười k/6, Việc tiếp, tốc độ) tách thành bảng DÙNG CHUNG với app phụ huynh — markup + chữ của em giữ nguyên.
// 26/10 (luật tốc độ — «Trong» thay màn Hôm nay cũ, app em mở thẳng Lộ trình): bảng Nhịp học chỉ hiện SAU khi `/hs/nhip-hoc` về (đã có khung xương chờ)
// ⇒ nạp LƯỜI cùng lúc, không nằm trong nhóm mở app học sinh (mảnh BangNhipHoc vốn tách riêng, dùng chung phụ huynh / thầy).
const BangNhipHoc = lazy(() => import('./BangNhipHoc'))

// THẺ "HÔM NAY CỦA EM" — đầu màn Hôm nay của app học sinh (thầy 12/10: "Bạn gộp 2 phần làm bài này vào làm một thôi nhé. Tập trung vào việc nhắc học
// sinh làm bao nhiêu câu. Thiết kế đẹp, trực quan, khoa học thân thiện nhất với hs nhé"). Thay CẢ khối vòng tròn "Mục tiêu hôm nay" (`.ht2-chinh` cũ) lẫn
// bảng "Nhịp học của em" (NhipHocEm.tsx cũ) — trước đây hai phần lặp số câu và có hai nút học.
//   PHẦN CHÍNH (to nhất): "Hôm nay · Thứ Hai 12/10" + chip nhóm · "Còn N câu" (N = M − đã làm) · "Đã làm x/M câu hôm nay" · vạch chặng (mỗi chặng tối đa 6
//   câu; xong / đang làm (tô theo số câu đã làm trong chặng) / chờ) · bài + "x câu tự làm · y câu học có hỗ trợ" (Gói 7, tổng = N) · MỘT nút học.
//   Đủ mức ⇒ "Đủ mức hôm nay" + "em có thể nghỉ", nút lùi thành nút viền "Học thêm".
//   PHẦN NHỊP HỌC (gọn, cùng thẻ; `/hs/nhip-hoc`): "Đủ mức a/b ngày từ 01/10" + dải ô ngày + chú giải · Lười: "Ra khỏi nhóm Lười … k/6 ngày" + 6 ô ·
//   Chưa đều / Chăm / Chưa đủ dữ liệu: "Việc tiếp" · tốc độ chỉ khi đáng lo (xấu / cần để mắt) · "Thầy cũng thấy bảng này.". Có `onMoHoSo` ⇒ khối dải
//   ngày là MỘT nút "Xem hồ sơ làm bài của em" (thầy 12/10: "Cho hs bấm vào bảng lười chăm"); nút học không nằm trong vùng ấy.
// MỘT CON SỐ: M và đã làm lấy từ Sảnh (`soHomNay`, cập nhật sau mỗi câu); ô hôm nay, chuỗi và câu "còn N câu" của phần Nhịp học tính lại từ CÙNG số ấy
// (`nhipTheoSanh`). Nhịp học lỗi ⇒ ẩn gọn, phần chính vẫn đủ. Đang tải ⇒ khung xương. Màu + tương phản: hoc-tap.css khối "THẺ HÔM NAY CỦA EM 12/10E".

// 26/10 (thầy: hệ phát hiện lười CHỈ thầy + phụ huynh xem): app em KHÔNG còn chip nhóm / chip bậc, không tô màu theo nhóm — máy chủ cũng không gửi
// nhóm, bậc (server/src/an-luoi-hs.ts). Chỗ chip là «Chuỗi N ngày» (số có sẵn, chỉ hiện khi N > 0).

export interface PropsTheHomNayEm {
  /** M + đã làm + số chặng của hôm nay — từ Sảnh (`soHomNay`). null ⇒ chưa có số (đang tải ⇒ khung xương). */
  so: SoHomNay | null
  dangTai: boolean
  /** "Thứ Hai 12/10". */
  ngayChu: string
  /** Tên bài / chiến dịch đang học (dòng phụ). */
  tenBai?: string
  /** Việc còn lại của ngày (Gói 7: "x câu tự làm · y câu học có hỗ trợ", tổng = N; Hành trình: "Nền · Chặng 2/4"). */
  viec?: string
  onHoc: () => void
  khoaHoc: boolean
  /** Hết câu được giao (thể lực 0) ⇒ nút "Đã làm hết câu được giao", khoá. */
  hetCau: boolean
  /** Gói 7, hết việc xếp được mà CHƯA đủ mức ⇒ số câu còn lại của mức đang chờ thầy bổ sung (nút khoá nói rõ số này). */
  choBoSung?: number
  /** Gói 7: số việc kế hoạch xếp được lúc này (`theLuc.con`) — ít hơn số còn lại của mức (kho thiếu) thì nút nói "x câu sẵn sàng". */
  sanSang?: number
  /** Ca kiểm tra đang mở ⇒ nút học lùi thành nút viền (nút chính của màn là Vào ca kiểm tra). */
  nutPhu?: boolean
  /** Token phiên ⇒ phần Nhịp học (`/hs/nhip-hoc`); không có ⇒ không hiện. */
  token?: string
  /** Có ⇒ khối Nhịp học bấm được, mở hồ sơ làm bài của em. */
  onMoHoSo?: () => void
}

/** Chip «Chuỗi N ngày» (N ngày liền đủ mức, cùng số dải ngày); N = 0 ⇒ không chip. */
export function ChipChuoi({ k }: { k: NhipHocHs }) {
  if (k.chuoiDuGanNhat <= 0) return null
  return (
    <span className="ht2-nhe-nhom">
      <Flame size={16} strokeWidth={2.6} aria-hidden="true" />
      Chuỗi {k.chuoiDuGanNhat} ngày
    </span>
  )
}

function PhanChinh(p: PropsTheHomNayEm & { chip: ReactNode }) {
  const so = p.so
  const con = so ? Math.max(0, so.muc - so.daLam) : null
  const du = con === 0
  const chang = so ? chiaChang(so) : []
  const xong = so ? soChangXong(so) : 0
  const nut = chuNutHoc(so, p.hetCau, { choBoSung: p.choBoSung, sanSang: p.sanSang })
  return (
    <div className="ht2-hn-chinh">
      <div className="ht2-hn-dau">
        <h2 className="ht2-hn-nhan">Hôm nay · {p.ngayChu}</h2>
        {p.chip}
      </div>
      {!so && p.dangTai ? (
        <div className="ht2-hn-xuong" aria-hidden="true">
          <span style={{ width: '62%', height: 56 }} />
          <span style={{ width: '48%', height: 18 }} />
          <span style={{ width: '100%', height: 14 }} />
        </div>
      ) : so && du ? (
        <>
          <p className="ht2-hn-so" data-du="true">
            <span className="ht2-hn-dau-tick" aria-hidden="true">
              <Check size={22} strokeWidth={3} />
            </span>
            Đủ mức hôm nay
          </p>
          <p className="ht2-hn-da">
            Đã làm <b>{so.daLam}/{so.muc}</b> câu hôm nay · em có thể nghỉ.
          </p>
        </>
      ) : so ? (
        <>
          <p className="ht2-hn-so">
            Còn <b>{con}</b> câu
          </p>
          <p className="ht2-hn-da">
            Đã làm <b>{so.daLam}/{so.muc}</b> câu hôm nay
          </p>
        </>
      ) : (
        <p className="ht2-hn-da">Số câu hôm nay sẽ hiện khi bài học tải xong.</p>
      )}
      {so && chang.length > 0 && (
        <>
          <div
            className="ht2-hn-vach"
            role="progressbar"
            aria-label="Tiến độ hôm nay"
            aria-valuemin={0}
            aria-valuemax={so.muc}
            aria-valuenow={Math.min(so.daLam, so.muc)}
            aria-valuetext={`Đã làm ${so.daLam} trên ${so.muc} câu · xong ${xong} trong ${chang.length} chặng`}
          >
            {chang.map((c, i) => (
              <i key={i} data-tt={c.tt} style={{ flexGrow: c.co }}>
                {c.tt === 'dang' && c.phan > 0 && <span style={{ transform: `scaleX(${c.phan / 100})` }} />}
              </i>
            ))}
          </div>
          <p className="ht2-hn-chang">
            <span>
              Xong {xong}/{chang.length} chặng
            </span>
            <span>mỗi chặng tối đa {CAU_MOI_CHANG} câu</span>
          </p>
        </>
      )}
      {(p.tenBai || (p.viec && !du)) && (
        <p className="ht2-hn-bai">
          {p.tenBai && <b>{p.tenBai}</b>}
          {p.tenBai && p.viec && !du ? ' · ' : ''}
          {!du && p.viec && <span>{p.viec}</span>}
        </p>
      )}
      <button type="button" className="ht2-hn-nut" data-phu={p.nutPhu || du || undefined} onClick={p.onHoc} disabled={p.khoaHoc}>
        {nut}
        {!p.hetCau && <ArrowRight size={20} aria-hidden="true" />}
      </button>
    </div>
  )
}

/** Khung xương phần Nhịp học (đang tải). */
export const XuongNhip = () => (
  <div className="ht2-hn-nhip ht2-hn-xuong" aria-label="Đang tải nhịp học của em">
    <span style={{ width: '58%', height: 18 }} />
    <span style={{ width: '100%', height: 22 }} />
    <span style={{ width: '84%', height: 40 }} />
  </div>
)

export default function TheHomNayEm(p: PropsTheHomNayEm) {
  // Khoá cố định (không theo số câu đã làm): số hôm nay đã tính lại từ sảnh bên dưới ⇒ không gọi /hs/nhip-hoc sau mỗi câu (khẩn 12/10 21h).
  const nhipGoc = useNhipHocEm(p.token, null)
  const nhip = typeof nhipGoc === 'string' ? nhipGoc : nhipTheoSanh(nhipGoc, p.so ? { muc: p.so.muc, daLam: p.so.daLam } : null)
  const coNhip = nhip !== 'an'
  const k = typeof nhip === 'string' ? null : nhip
  return (
    <section className="ht2-hn" data-mot={coNhip ? undefined : 'true'} aria-label="Hôm nay của em" aria-busy={(!p.so && p.dangTai) || nhip === 'tai'}>
      <PhanChinh {...p} chip={k ? <ChipChuoi k={k} /> : nhip === 'tai' ? <span className="ht2-hn-chip-xuong" aria-hidden="true" /> : null} />
      {k ? (
        <Suspense fallback={<XuongNhip />}><BangNhipHoc k={k} onMoHoSo={p.onMoHoSo} /></Suspense>
      ) : nhip === 'tai' ? (
        <XuongNhip />
      ) : null}
    </section>
  )
}
