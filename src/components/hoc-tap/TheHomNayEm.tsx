import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { Activity, ArrowRight, Check, Hourglass, TriangleAlert } from 'lucide-react'
import { modTrongHs } from './nap-trong-hs'
import { CAU_MOI_CHANG, soChangXong, type SoHomNay } from './lam-bai'
import { layNhipHocEm, nhipTheoSanh, TEN_NHOM_NHIP, type KetQuaNhipHocEm, type NhomNhip } from '../../lib/nhip-hoc-em'
// Đợt 16: phần Nhịp học (dải ô ngày, Lười k/6, Việc tiếp, tốc độ) tách thành bảng DÙNG CHUNG với app phụ huynh — markup + chữ của em giữ nguyên.
import BangNhipHoc from './BangNhipHoc'
import { ChipBacNhipLuoi, napBacNhip } from '../bac-cham-chi/nap'

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

const ICON_NHOM: Record<NhomNhip, typeof Check> = { cham: Check, 'chua-deu': Activity, luoi: TriangleAlert, 'chua-du': Hourglass }

/** Bản nhớ trong phiên (mỗi token một bản, 60 giây, gắn với `lamMoi`): em chuyển qua lại các mục rồi về Hôm nay thì vẽ ngay, không gọi lại máy
 *  chủ (bớt lượt D1); số câu hôm nay đổi ⇒ khoá khác ⇒ nạp lại. */
const NHO = new Map<string, { kq: KetQuaNhipHocEm; luc: number; khoa: number | null | undefined }>()
// Khẩn 12/10 21h (giờ cao điểm): lịch sử ngày không đổi trong ngày — số HÔM NAY lấy từ sảnh ⇒ nhớ 10 phút, KHÔNG nạp lại sau mỗi câu.
const NHO_MS = 600_000
/** Chỉ cho test: xoá bản nhớ. */
export const xoaNhoNhipHocEm = (): void => NHO.clear()

/** Nạp `/hs/nhip-hoc`: 'tai' (đang tải) · 'an' (không token / lỗi lần đầu ⇒ ẩn gọn) · số. Lỗi khi đã có số ⇒ giữ số cũ. */
export function useNhipHocEm(token: string | undefined, lamMoi: number | null | undefined): KetQuaNhipHocEm | 'tai' | 'an' {
  // Bản hiện gắn với phiên: đổi em trên máy dùng chung không được giữ nhóm/nhịp của em trước.
  const [ban, setBan] = useState(() => ({ token, kq: token ? NHO.get(token)?.kq ?? null : null, hong: false }))
  useEffect(() => {
    if (!token) return
    const c = NHO.get(token)
    if (c && c.khoa === lamMoi && Date.now() - c.luc < NHO_MS) {
      setBan({ token, kq: c.kq, hong: false })
      return
    }
    let huy = false
    // 13/10: nạp sẵn khối 12 bậc song song lệnh nhịp học (không thêm lệnh máy chủ) — số về là chip + thang vẽ ngay
    void napBacNhip()
    void layNhipHocEm(token).then((r) => {
      if (huy) return
      if (r) {
        NHO.set(token, { kq: r, luc: Date.now(), khoa: lamMoi })
        setBan({ token, kq: r, hong: false })
      } else setBan(v => ({ token, kq: v.token === token ? v.kq : null, hong: true }))
    })
    return () => {
      huy = true
    }
  }, [token, lamMoi])
  if (!token) return 'an'
  return ban.token === token ? ban.kq ?? (ban.hong ? 'an' : 'tai') : NHO.get(token)?.kq ?? 'tai'
}

/** Các chặng của hôm nay: chặng i gồm câu (6·i, min(6·(i+1), M)] — đúng luật vạch chặng / `soChangXong`; chặng cuối lấy hết phần còn lại tới M. */
export function chiaChang(so: SoHomNay): { co: number; tt: 'xong' | 'dang' | 'cho'; phan: number }[] {
  const xong = soChangXong(so)
  return Array.from({ length: so.soChang }, (_, i) => {
    const dau = Math.min(i * CAU_MOI_CHANG, so.muc)
    const cuoi = i === so.soChang - 1 ? so.muc : Math.min((i + 1) * CAU_MOI_CHANG, so.muc)
    const co = Math.max(1, cuoi - dau)
    const tt = i < xong ? 'xong' : i === xong ? 'dang' : 'cho'
    return { co, tt, phan: tt === 'dang' ? Math.max(0, Math.min(100, Math.round((100 * (so.daLam - dau)) / co))) : 0 }
  })
}

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
  /** Giao diện «Trong» (26/10): chỗ vẽ thẻ Nhịp học ở CỘT PHỤ (máy tính) — cùng một lượt nạp `/hs/nhip-hoc`, chỉ đổi chỗ hiện. */
  noiNhip?: Element | null
}

/** Chữ nút học — MỘT nút cho cả màn (Hôm nay và Hành trình dùng chung).
 *  Gói 7 kho thiếu (khẩn 12/10 21h30): hết việc xếp được mà chưa đủ mức ⇒ "Hôm nay còn N câu chờ thầy bổ sung" (nút khoá); còn việc xếp được nhưng ít
 *  hơn phần còn lại của mức ⇒ nút VẪN BẤM ĐƯỢC, nói đúng số câu sẵn sàng ("Học tiếp · 1 câu sẵn sàng") — số "Còn N câu" phía trên vẫn theo M. */
export function chuNutHoc(so: SoHomNay | null, hetCau: boolean, kho?: { choBoSung?: number; sanSang?: number }): string {
  if (hetCau) return kho?.choBoSung ? `Hôm nay còn ${kho.choBoSung} câu chờ thầy bổ sung` : 'Đã làm hết câu được giao'
  if (!so) return 'Bắt đầu học'
  const con = Math.max(0, so.muc - so.daLam)
  if (con === 0) return 'Học thêm'
  const dau = so.daLam > 0 ? 'Học tiếp' : 'Bắt đầu học'
  const sanSang = kho?.sanSang
  return sanSang !== undefined && sanSang > 0 && sanSang < con ? `${dau} · ${sanSang} câu sẵn sàng` : `${dau} · ${con} câu`
}

function Chip({ nhom }: { nhom: NhomNhip }) {
  const Icon = ICON_NHOM[nhom]
  return (
    <span className="ht2-nhe-nhom" data-nhom={nhom}>
      <Icon size={16} strokeWidth={2.6} aria-hidden="true" />
      {TEN_NHOM_NHIP[nhom]}
    </span>
  )
}

/** Chip nhóm; máy chủ có bậc (13/10) ⇒ thêm chip "Bậc N/12 · Tên" ngay cạnh (khối nạp khi cần), hai chip xuống hàng khi chật. */
export function ChipNhom({ k }: { k: KetQuaNhipHocEm }) {
  if (!k.bacCham) return <Chip nhom={k.nhom} />
  return (
    <span className="bcc-hang">
      <Chip nhom={k.nhom} />
      <Suspense fallback={null}>
        <ChipBacNhipLuoi k={k} />
      </Suspense>
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
  // «Trong»: mảnh trình bày nạp lười (TrongHs.tsx) — đã nạp xong trước khi vẽ (cổng ở HocTapHomNay); chưa có ⇒ vẽ bản cũ.
  const Trong = modTrongHs()?.HomNayTrong
  if (Trong) return <Trong p={p} k={k} nhip={nhip} />
  return (
    <section className="ht2-hn" data-nhom={k?.nhom} data-mot={coNhip ? undefined : 'true'} aria-label="Hôm nay của em" aria-busy={(!p.so && p.dangTai) || nhip === 'tai'}>
      <PhanChinh {...p} chip={k ? <ChipNhom k={k} /> : nhip === 'tai' ? <span className="ht2-hn-chip-xuong" aria-hidden="true" /> : null} />
      {k ? (
        <BangNhipHoc k={k} onMoHoSo={p.onMoHoSo} />
      ) : nhip === 'tai' ? (
        <XuongNhip />
      ) : null}
    </section>
  )
}
