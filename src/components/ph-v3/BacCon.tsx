// KHỐI BẬC CỦA CON — trang "Hôm nay của con" (đợt 19 · làn R). NẠP KHI CẦN (TrangVeCon.tsx `napBacCon`, nạp sẵn song song lúc mở trang): bảng 12 tên bậc
// + phép tính lại theo số hôm nay (bac.ts) + huy hiệu vẽ riêng (HuyHieuBac, làn M) không nằm trong tải đầu app.
//   · BacHomNay — khối bậc trong phần Hôm nay: huy hiệu 64 px · "Bậc N/12 · Tên" · nhóm · điểm chăm · chuỗi đủ mức.
//   · BacNhip   — phần bậc trong Nhịp học: huy hiệu 72 px · thang 12 bậc dạng bậc thềm (Lười 1–5 · Chưa đều 6–7 · Chăm 8–12) · luật lên bậc / lên nhóm
//                 bằng số (cần thêm mấy ngày đủ mức, còn mấy điểm chăm).
// Cả hai khối là MỘT nút: bấm ⇒ tấm "12 bậc từ Lười đến Chăm" của làn M (TamMuoiHaiBac, xưng "Con đang ở đây"; tấm nạp khi bấm, nạp sẵn khi trỏ / chạm).
// Bậc = `bacTheoSanh` (đúng phép máy chủ trên dải ngày đã theo số hôm nay) ⇒ cùng số thầy và con thấy. Máy chủ chưa gửi bậc ⇒ chỉ còn dòng nhóm.
import { Suspense, lazy, useState, type ReactNode } from 'react'
import type { KetQuaNhipHocEm } from '../../lib/nhip-hoc-em'
import { TEN_NHOM_NHIP } from '../../lib/nhip-hoc-em'
import type { KetQuaBac } from '../../lib/bac-cham-chi'
import { KHOANG_BAC } from '../../lib/bac-cham-chi'
import { BAC_CHAM_CHI, bacTheoSanh, chuBac, chuKhoangDiem, motBac } from '../bac-cham-chi/bac'
import HuyHieuBac from '../bac-cham-chi/HuyHieuBac'
import { BtPhai } from './BieuTuong'
// Màu 12 bậc (`.bcc[data-bac]` ⇒ --bac) + màu huy hiệu: tệp chung của làn M (chỉ nạp, không sửa) — đi cùng khối nạp khi cần này.
import '../bac-cham-chi/bac-cham-chi.css'

const napTam = () => import('../bac-cham-chi/TamMuoiHaiBac')
const TamMuoiHaiBac = lazy(napTam)

/** Một nút bọc khối bậc: bấm ⇒ tấm 12 bậc (đóng ⇒ tiêu điểm về nút). */
function NutTam({ kq, className, children, vung }: { kq: KetQuaBac; className: string; children: ReactNode; vung: string }) {
  const [mo, setMo] = useState<{ lopBoc?: string; traVe: HTMLButtonElement } | null>(null)
  const nap = () => void napTam().catch(() => {})
  return (
    <>
      <button
        type="button"
        className={`bcc ${className}`}
        data-bac={kq.bac}
        data-vung={vung}
        aria-haspopup="dialog"
        aria-expanded={!!mo}
        onPointerEnter={nap}
        onPointerDown={nap}
        onFocus={nap}
        onClick={(ev) => setMo({ lopBoc: ev.currentTarget.closest('.m3') ? 'm3' : undefined, traVe: ev.currentTarget })}
      >
        {children}
        <span className="ph3-an">, xem đủ 12 bậc</span>
        <span className="tvc-mui" aria-hidden="true"><BtPhai co={18} day={2.4} /></span>
      </button>
      {mo && (
        <Suspense fallback={null}>
          <TamMuoiHaiBac kq={kq} xung="con" lopBoc={mo.lopBoc} traVe={mo.traVe} onDong={() => setMo(null)} />
        </Suspense>
      )}
    </>
  )
}

export function BacHomNay({ k }: { k: KetQuaNhipHocEm }) {
  const b = bacTheoSanh(k)
  const hien = b ? motBac(b.bac) : null
  const nhom = TEN_NHOM_NHIP[k.nhom]
  if (!b || !hien)
    return (
      <div className="tvc-hn-bac" data-vung="bac-hom-nay">
        <span className="tvc-hn-bac-chu">
          <b>Nhóm {nhom}</b>
          <span>{k.nhom === 'chua-du' ? `Chưa xếp bậc: cần ít nhất 3 ngày đã qua, con đang có ${k.soNgayQua} ngày.` : <>Chuỗi đủ mức <b>{k.chuoiDuGanNhat}</b> ngày</>}</span>
        </span>
      </div>
    )
  return (
    <NutTam kq={b} className="tvc-hn-bac" vung="bac-hom-nay">
      <HuyHieuBac bac={b.bac} co={64} />
      <span className="tvc-hn-bac-chu">
        <b className="tvc-ten-bac">{chuBac(hien)}</b>
        <span>Nhóm <b>{nhom}</b>&nbsp;· Điểm chăm <b>{b.diem}</b>/100&nbsp;· Chuỗi đủ mức <b>{k.chuoiDuGanNhat}</b> ngày</span>
      </span>
    </NutTam>
  )
}

/** Luật lên bậc / lên nhóm của con bằng số (thuần — test gọi thẳng). Không có việc tiếp hợp lệ ⇒ rỗng. */
export function chuLuatLenBac(k: KetQuaNhipHocEm, b: KetQuaBac | null): ReactNode[] {
  const v = k.viecTiep
  const ra: ReactNode[] = []
  const ke = b && b.diemLenBac !== null ? motBac(b.bac + 1) : null
  if (b && ke && b.diemLenBac !== null) ra.push(<>Còn <b>{b.diemLenBac} điểm chăm</b> nữa lên <b>{chuBac(ke)}</b>.</>)
  const conCau = v.cauConHomNay > 0 && !v.homNayDu ? ` Hôm nay còn ${v.cauConHomNay} câu nữa là đủ mức.` : ''
  if (v.loai === 'len-cham') {
    const dau = motBac(KHOANG_BAC.cham[0])!
    if (v.homNayDu && v.ngayCanThem === 0) ra.push(<>Hôm nay con đã đủ mức — hết hôm nay con vào nhóm Chăm (<b>{chuBac(dau)}</b>).</>)
    else ra.push(<>Lên <b>{chuBac(dau)}</b> khi con vào nhóm Chăm (từ 80% số ngày đủ mức): cần thêm <b>{v.ngayCanThem} ngày đủ mức</b>{v.homNayDu ? ' nữa' : ', tính cả hôm nay'}.{conCau}</>)
    if (v.nhoChuoi) ra.push(<>Con đang ra khỏi nhóm Lười nhờ <b>{v.chuoi} ngày liền</b> đủ mức; thiếu một ngày là quay lại nhóm Lười.</>)
  } else if (v.loai === 'thoat-luoi') {
    const dau = motBac(KHOANG_BAC['chua-deu'][0])!
    ra.push(<>Ra khỏi nhóm Lười (lên <b>{chuBac(dau)}</b>) khi con đủ mức <b>{v.canNgay} ngày liền</b>: con đang có <b>{Math.min(v.coNgay, v.canNgay)}/{v.canNgay}</b> ngày.{conCau}</>)
  } else if (v.loai === 'giu-chuoi') {
    if (b && b.bac === 11 && !ke) ra.push(<>Lên <b>{chuBac(motBac(12)!)}</b> khi {chuKhoangDiem(12)}.</>)
    ra.push(<>Con đang ở nhóm Chăm. Chuỗi đủ mức {v.homNayDu ? 'tính cả hôm nay ' : ''}là <b>{v.chuoiNeuDu} ngày liền</b>.{conCau}</>)
  } else if (v.loai === 'chua-du') {
    ra.push(<>Chưa xếp nhóm và bậc: cần thêm <b>{v.conNgay} ngày</b> có số liệu.{conCau}</>)
  }
  return ra
}

export function BacNhip({ k }: { k: KetQuaNhipHocEm }) {
  const b = bacTheoSanh(k)
  const hien = b ? motBac(b.bac) : null
  const luat = chuLuatLenBac(k, b)
  return (
    <>
      {b && hien && (
        <div className="tvc-bac">
          <NutTam kq={b} className="tvc-bac-dau" vung="bac-nhip">
            <HuyHieuBac bac={b.bac} co={72} />
            <span className="tvc-hn-bac-chu">
              <span className="tvc-phu">Bậc của con · cùng số với thầy và con thấy</span>
              <b className="tvc-ten-bac">{chuBac(hien)}</b>
              <span>Điểm chăm <b>{b.diem}</b>/100</span>
            </span>
          </NutTam>
          <div className="tvc-thang" role="img" aria-label={`Thang 12 bậc từ Lười đến Chăm: con ở ${chuBac(hien)}`}>
            {BAC_CHAM_CHI.map((x) => (
              <i key={x.so} className="bcc" data-bac={x.so} data-hien={x.so === hien.so ? '' : undefined} style={{ height: `${10 + x.so * 2.8}px` }} title={chuBac(x)} />
            ))}
          </div>
          <div className="tvc-thang-nhan" aria-hidden="true">
            <span>Lười 1–5</span>
            <span>Chưa đều</span>
            <span>Chăm 8–12</span>
          </div>
        </div>
      )}
      {luat.length > 0 && (
        <div className="tvc-hop" data-vung="luat-len-bac">
          {luat.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </>
  )
}
