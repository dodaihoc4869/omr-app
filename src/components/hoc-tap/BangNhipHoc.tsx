import { Suspense, useId, type CSSProperties } from 'react'
import { ChevronRight, Clock, Eye } from 'lucide-react'
import {
  chuDaiOEm,
  chuDuMucEm,
  chuMotOEm,
  chuRaKhoiLuoi,
  chuTocDo,
  chuViecTiep,
  loaiONgay,
  chuCanThem,
  chuDoTinCay,
  LUAT_NHOM_NHIP,
  NGUONG_TIN_CAY,
  TEN_LOAI_O_EM,
  type KetQuaNhipHocApp,
  type KetQuaNhipHocEm,
} from '../../lib/nhip-hoc-em'
import { ThangBacNhipLuoi } from '../bac-cham-chi/nap'
import './bang-nhip-hoc.css'

// BẢNG "NHỊP HỌC" (Lười / Chăm) DÙNG CHUNG — tách nguyên văn từ phần dưới thẻ "Hôm nay của em" (TheHomNayEm.tsx, 12/10E) để app PHỤ HUYNH vẽ CÙNG bảng
// (đợt 16, thầy 12/10: "App ph cũng phải hiển thị lười chăm đầy đủ như app hs"). Cùng số (`KetQuaNhipHocEm` — `/hs/nhip-hoc` hoặc `/ph/nhip-hoc`), cùng
// luật nhóm, cùng dải ô ngày + chú giải, cùng dòng "Ra khỏi nhóm Lười … k/6 ngày" + 6 ô, "Việc tiếp", tốc độ khi đáng lo.
//   · `ngoi='em'` (mặc định, app học sinh): markup + chữ Y NGUYÊN bản 12/10E (test the-hom-nay-em-1210e / nhip-hoc-em-1210c khoá).
//   · `ngoi='con'` (app phụ huynh): cùng câu, đổi ngôi "em" ⇒ "con" (`doiNgoiCon`), lời nhắc tốc độ nói với phụ huynh, dòng cuối "Con và thầy cùng thấy
//     bảng này.". Không mã nội bộ, không số bịa.
//   · Có `onMoHoSo` ⇒ khối dải ngày là MỘT nút "Xem hồ sơ làm bài của em/của con" (mở tấm `HoSoLamCauEm`).
//   · Máy chủ gửi `doTinCay` (đợt 16, tuỳ chọn) ⇒ một dòng "Độ tin cậy N%"; dưới 90% ⇒ "kết luận tạm, đang theo dõi" + câu `canThem`. Vắng ⇒ không dòng.
//   · 13/10 — máy chủ gửi `bacCham` ⇒ đầu bảng là THANG 12 BẬC (từ Lười đến Chăm, mỗi bậc một màu) + "Còn N điểm lên …" (khối nạp khi cần
//     src/components/bac-cham-chi/). Vắng ⇒ không có gì, bảng y như trước. Chip bậc nằm cạnh tên nhóm ở đầu thẻ (TheHomNayEm / NhipHocCon).
// Màu: lớp `ht2-hn-*` — app học sinh tô ở hoc-tap.css; app phụ huynh tô ở ph-v3/nhip-hoc-con.css (biến --ph3-* sẵn có).

export type NgoiNhip = 'em' | 'con'

/** Đổi ngôi "em" ⇒ "con" trong một câu đã viết cho em (chỉ cả từ "em"/"Em"; "xem", "đem"… giữ nguyên). Thuần. */
export function doiNgoiCon(chu: string): string {
  return chu.replace(/(^|[^\p{L}])([Ee])m(?=$|[^\p{L}])/gu, (_m, dau: string, e: string) => `${dau}${e === 'E' ? 'Con' : 'con'}`)
}

/** Câu tốc độ cho phụ huynh: đổi ngôi + lời nhắc nói với phụ huynh. */
const tocDoChoPhuHuynh = (chu: string): string => doiNgoiCon(chu).replace(/Đọc hết đề rồi mới chọn\.$/, 'Anh/chị nhắc con đọc hết đề rồi mới chọn.')

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

export default function BangNhipHoc({ k, onMoHoSo, ngoi = 'em' }: { k: KetQuaNhipHocEm; onMoHoSo?: () => void; ngoi?: NgoiNhip }) {
  const id = useId()
  const laCon = ngoi === 'con'
  const can = LUAT_NHOM_NHIP.ngayLienThoatLuoi
  const v = k.viecTiep
  const co = Math.min(v.loai === 'thoat-luoi' ? v.coNgay : k.chuoiDuGanNhat, can)
  const hom = k.homNayMuc
  const homDu = !!hom && hom.lam >= hom.muc
  // ô "đang làm" của thanh 6 ô = ngày hôm nay chưa đủ, tô theo số câu đã làm hôm nay (cùng số Sảnh).
  const phanHom = hom && !homDu && hom.muc > 0 ? Math.round((100 * hom.lam) / hom.muc) : 0
  const raKhoiLuoi = chuRaKhoiLuoi(k).replace(/^Ra khỏi nhóm Lười:/, '')
  const viecTiep = chuViecTiep(k)
  const { doTinCay: tin, canThem } = k as KetQuaNhipHocApp
  // Điện thoại: "Xem hồ sơ ›" là hàng cuối của khối (sau dải + chú giải); máy tính: góc phải hàng đầu (hoc-tap.css / nhip-hoc-con.css).
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
    <div className="ht2-hn-nhip" role="group" aria-label={laCon ? 'Nhịp học của con' : 'Nhịp học của em'}>
      {k.bacCham && (
        // giữ chỗ đúng chiều cao thang khi khối bậc chưa nạp xong (không xô lệch)
        <Suspense fallback={<span aria-hidden="true" style={{ display: 'block', minHeight: 30 }} />}>
          <ThangBacNhipLuoi k={k} />
        </Suspense>
      )}
      {onMoHoSo ? (
        <button
          type="button"
          className="ht2-hn-nhip-bam"
          onClick={onMoHoSo}
          aria-label={laCon ? 'Xem hồ sơ làm bài của con' : 'Xem hồ sơ làm bài của em'}
          aria-describedby={`${id}-du ${id}-dai`}
        >
          {ruot}
        </button>
      ) : (
        <div className="ht2-hn-nhip-bam">{ruot}</div>
      )}
      {tin !== undefined && (
        <p className="ht2-hn-tin" data-du={tin >= NGUONG_TIN_CAY ? 'true' : 'false'}>
          <b>{chuDoTinCay(tin)}</b>
          {tin < NGUONG_TIN_CAY && <span>Kết luận tạm, đang theo dõi.{canThem ? ` ${chuCanThem(laCon ? doiNgoiCon(canThem) : canThem)}` : ''}</span>}
        </p>
      )}
      {k.nhom === 'luoi' ? (
        <div className="ht2-hn-luoi">
          <p>
            <b>Ra khỏi nhóm Lười:</b>
            {laCon ? doiNgoiCon(raKhoiLuoi) : raKhoiLuoi}
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
          <b>Việc tiếp:</b> {laCon ? doiNgoiCon(viecTiep) : viecTiep}
        </p>
      )}
      {k.tocDo && (k.tocDo.muc === 'xau' || k.tocDo.muc === 'chu-y') && (
        <p className="ht2-hn-toc" data-muc={k.tocDo.muc}>
          <Clock size={18} aria-hidden="true" />
          <span>{laCon ? tocDoChoPhuHuynh(chuTocDo(k.tocDo)) : chuTocDo(k.tocDo)}</span>
        </p>
      )}
      <p className="ht2-hn-thay">
        <Eye size={18} aria-hidden="true" />
        {laCon ? 'Con và thầy cùng thấy bảng này.' : 'Thầy cũng thấy bảng này.'}
      </p>
    </div>
  )
}
