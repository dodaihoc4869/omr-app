import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { Activity, ArrowRight, Check, ChevronRight, Clock, Eye, Hourglass, TriangleAlert } from 'lucide-react'
import { CAU_MOI_CHANG, soChangXong, type SoHomNay } from './lam-bai'
import {
  chuDaiOEm,
  chuDuMucEm,
  chuMotOEm,
  chuRaKhoiLuoi,
  chuTocDo,
  chuViecTiep,
  layNhipHocEm,
  loaiONgay,
  LUAT_NHOM_NHIP,
  nhipTheoSanh,
  TEN_LOAI_O_EM,
  TEN_NHOM_NHIP,
  type KetQuaNhipHocEm,
  type NhomNhip,
} from '../../lib/nhip-hoc-em'

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
const NHO_MS = 60_000
/** Chỉ cho test: xoá bản nhớ. */
export const xoaNhoNhipHocEm = (): void => NHO.clear()

/** Nạp `/hs/nhip-hoc`: 'tai' (đang tải) · 'an' (không token / lỗi lần đầu ⇒ ẩn gọn) · số. Lỗi khi đã có số ⇒ giữ số cũ. */
export function useNhipHocEm(token: string | undefined, lamMoi: number | null | undefined): KetQuaNhipHocEm | 'tai' | 'an' {
  const [kq, setKq] = useState<KetQuaNhipHocEm | null>(() => (token ? (NHO.get(token)?.kq ?? null) : null))
  const [hong, setHong] = useState(false)
  useEffect(() => {
    if (!token) return
    const c = NHO.get(token)
    if (c && c.khoa === lamMoi && Date.now() - c.luc < NHO_MS) {
      setKq(c.kq)
      return
    }
    let huy = false
    void layNhipHocEm(token).then((r) => {
      if (huy) return
      if (r) {
        NHO.set(token, { kq: r, luc: Date.now(), khoa: lamMoi })
        setKq(r)
        setHong(false)
      } else setHong(true)
    })
    return () => {
      huy = true
    }
  }, [token, lamMoi])
  if (!token) return 'an'
  return kq ?? (hong ? 'an' : 'tai')
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
  /** Ca kiểm tra đang mở ⇒ nút học lùi thành nút viền (nút chính của màn là Vào ca kiểm tra). */
  nutPhu?: boolean
  /** Token phiên ⇒ phần Nhịp học (`/hs/nhip-hoc`); không có ⇒ không hiện. */
  token?: string
  /** Có ⇒ khối Nhịp học bấm được, mở hồ sơ làm bài của em. */
  onMoHoSo?: () => void
}

/** Chữ nút học — MỘT nút cho cả màn (Hôm nay và Hành trình dùng chung). */
export function chuNutHoc(so: SoHomNay | null, hetCau: boolean): string {
  if (hetCau) return 'Đã làm hết câu được giao'
  if (!so) return 'Bắt đầu học'
  const con = Math.max(0, so.muc - so.daLam)
  if (con === 0) return 'Học thêm'
  return so.daLam > 0 ? `Học tiếp · ${con} câu` : `Bắt đầu học · ${con} câu`
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

function PhanChinh(p: PropsTheHomNayEm & { chip: ReactNode }) {
  const so = p.so
  const con = so ? Math.max(0, so.muc - so.daLam) : null
  const du = con === 0
  const chang = so ? chiaChang(so) : []
  const xong = so ? soChangXong(so) : 0
  const nut = chuNutHoc(so, p.hetCau)
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

function DaiNgay({ k, idMo }: { k: KetQuaNhipHocEm; idMo: string }) {
  const n = Math.min(Math.max(k.ngay.length, 1), 14)
  const nRong = Math.min(Math.max(k.ngay.length, 1), 21)
  return (
    <>
      {/* Số cột = số ngày, tối đa 14 (điện thoại) / 21 (máy tính) rồi xuống hàng; ít ngày thì ô không kéo giãn. */}
      <span className="ht2-hn-dai" id={idMo} role="img" aria-label={chuDaiOEm(k)} style={{ '--cot': n, '--cot-rong': nRong } as CSSProperties}>
        {k.ngay.map((x) => (
          <i key={x.ngay} data-loai={loaiONgay(x, k.homNay)} data-hom-nay={x.ngay === k.homNay ? 'true' : undefined} title={chuMotOEm(x, k.homNay)} />
        ))}
      </span>
      <span className="ht2-hn-chu-thich" aria-hidden="true">
        {(Object.keys(TEN_LOAI_O_EM) as (keyof typeof TEN_LOAI_O_EM)[]).map((l) => (
          <span key={l}>
            <i data-loai={l} />
            {TEN_LOAI_O_EM[l]}
          </span>
        ))}
        <span>
          <i data-loai="cho" />
          Hôm nay
        </span>
      </span>
    </>
  )
}

function PhanNhip({ k, onMoHoSo }: { k: KetQuaNhipHocEm; onMoHoSo?: () => void }) {
  const id = useId()
  const can = LUAT_NHOM_NHIP.ngayLienThoatLuoi
  const v = k.viecTiep
  const co = Math.min(v.loai === 'thoat-luoi' ? v.coNgay : k.chuoiDuGanNhat, can)
  const hom = k.homNayMuc
  const homDu = !!hom && hom.lam >= hom.muc
  // ô "đang làm" của thanh 6 ô = ngày hôm nay chưa đủ, tô theo số câu đã làm hôm nay (cùng số Sảnh).
  const phanHom = hom && !homDu && hom.muc > 0 ? Math.round((100 * hom.lam) / hom.muc) : 0
  // Điện thoại: "Xem hồ sơ ›" là hàng cuối của khối (sau dải + chú giải); máy tính: góc phải hàng đầu (hoc-tap.css).
  const ruot = (
    <>
      <span className="ht2-hn-du-dong" id={`${id}-du`}>
        {chuDuMucEm(k)}
      </span>
      <DaiNgay k={k} idMo={`${id}-dai`} />
      {onMoHoSo && (
        <span className="ht2-hn-xem" aria-hidden="true">
          Xem hồ sơ
          <ChevronRight size={18} />
        </span>
      )}
    </>
  )
  return (
    <div className="ht2-hn-nhip" role="group" aria-label="Nhịp học của em">
      {onMoHoSo ? (
        <button type="button" className="ht2-hn-nhip-bam" onClick={onMoHoSo} aria-label="Xem hồ sơ làm bài của em" aria-describedby={`${id}-du ${id}-dai`}>
          {ruot}
        </button>
      ) : (
        <div className="ht2-hn-nhip-bam">{ruot}</div>
      )}
      {k.nhom === 'luoi' ? (
        <div className="ht2-hn-luoi">
          <p>
            <b>Ra khỏi nhóm Lười:</b>
            {chuRaKhoiLuoi(k).replace(/^Ra khỏi nhóm Lười:/, '')}
          </p>
          <span className="ht2-hn-sau" role="img" aria-label={`${co} trên ${can} ngày liền đủ mức`}>
            {Array.from({ length: can }, (_, i) => {
              const tt = i < co ? 'xong' : i === co && hom && !homDu ? 'dang' : 'cho'
              return <i key={i} data-tt={tt}>{tt === 'dang' && phanHom > 0 && <span style={{ transform: `scaleX(${phanHom / 100})` }} />}</i>
            })}
          </span>
        </div>
      ) : (
        <p className="ht2-hn-tiep">
          <b>Việc tiếp:</b> {chuViecTiep(k)}
        </p>
      )}
      {k.tocDo && (k.tocDo.muc === 'xau' || k.tocDo.muc === 'chu-y') && (
        <p className="ht2-hn-toc" data-muc={k.tocDo.muc}>
          <Clock size={18} aria-hidden="true" />
          <span>{chuTocDo(k.tocDo)}</span>
        </p>
      )}
      <p className="ht2-hn-thay">
        <Eye size={18} aria-hidden="true" />
        Thầy cũng thấy bảng này.
      </p>
    </div>
  )
}

export default function TheHomNayEm(p: PropsTheHomNayEm) {
  const nhipGoc = useNhipHocEm(p.token, p.so?.daLam ?? null)
  const nhip = typeof nhipGoc === 'string' ? nhipGoc : nhipTheoSanh(nhipGoc, p.so ? { muc: p.so.muc, daLam: p.so.daLam } : null)
  const coNhip = nhip !== 'an'
  const k = typeof nhip === 'string' ? null : nhip
  return (
    <section className="ht2-hn" data-nhom={k?.nhom} data-mot={coNhip ? undefined : 'true'} aria-label="Hôm nay của em" aria-busy={(!p.so && p.dangTai) || nhip === 'tai'}>
      <PhanChinh {...p} chip={k ? <Chip nhom={k.nhom} /> : nhip === 'tai' ? <span className="ht2-hn-chip-xuong" aria-hidden="true" /> : null} />
      {k ? (
        <PhanNhip k={k} onMoHoSo={p.onMoHoSo} />
      ) : nhip === 'tai' ? (
        <div className="ht2-hn-nhip ht2-hn-xuong" aria-label="Đang tải nhịp học của em">
          <span style={{ width: '58%', height: 18 }} />
          <span style={{ width: '100%', height: 22 }} />
          <span style={{ width: '84%', height: 40 }} />
        </div>
      ) : null}
    </section>
  )
}
