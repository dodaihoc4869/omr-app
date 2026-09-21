// Khối "Ca kiểm tra gần nhất" của bảng "Mọi thứ về con" kiểu Apple (mẫu docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html #muc-ca). Điểm to + so với lần trước của CHÍNH con + ba phần I/II/III.
// Ca CHƯA công bố: KHÔNG điểm / phần / so sánh dù gói có mang (chỉ dòng khoá + chữ máy chủ). Thiếu số nào ⇒ ẩn đúng vế đó, không bịa 0.
import { chuThoiGian, gioVn, ngayDayDuVn, soVn } from '../../../lib/ph-moi/dinh-dang'
import type { CaGanNhat, PhMoi, PhanDiem } from '../../../lib/ph-moi/du-lieu'
import { chuCongBoCa } from '../nhan'
import { BtBang, BtDongHo, BtKhoa, BtMuiLen } from './bieu-tuong'
import { Thanh } from './dung-chung'
import './khoi-c.css'

export const coCa = (pm: PhMoi): boolean => !!pm.caGanNhat

const TEN_PHAN: Record<PhanDiem['ma'], string> = { I: 'Phần I · Trắc nghiệm', II: 'Phần II · Đúng–sai', III: 'Phần III · Trả lời ngắn' }

/** Mũi tên xuống (biểu tượng chưa có trong bieu-tuong.tsx: tự vẽ ở đây, cùng nét với các biểu tượng khác). */
const BtMuiXuongDai = () => (
  <svg className="phm-i" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    <path d="M12 5v14" />
    <path d="m6 13 6 6 6-6" />
  </svg>
)

/** Giờ + ngày nộp của ca: `gio` = "09:12", `ngay` = "Thứ Bảy 19/09/2026" — vế nào không dựng được thì rỗng (rồi bỏ). */
function moNop(ca: Pick<CaGanNhat, 'nopLuc'>): { gio: string; ngay: string } {
  return { gio: gioVn(ca.nopLuc), ngay: ngayDayDuVn(ca.nopLuc) }
}

function SoVoiLanTruoc({ doi }: { doi: number }) {
  const bang = Math.abs(doi) < 0.005
  const chu = bang ? 'Bằng lần trước của chính con' : doi > 0 ? `Hơn ${soVn(doi)} điểm so với lần trước của chính con` : `Kém ${soVn(-doi)} điểm so với lần trước của chính con`
  return (
    <p className="phm-ca__hon" data-doi={bang ? 'bang' : doi > 0 ? 'len' : 'xuong'}>
      <i>{bang ? <BtBang /> : doi > 0 ? <BtMuiLen /> : <BtMuiXuongDai />}</i>
      <span>{chu}</span>
    </p>
  )
}

function PhanCa({ p }: { p: PhanDiem }) {
  return (
    <li>
      <div className="phm-phan__dau">
        <h3>{TEN_PHAN[p.ma]}</h3>
        {p.diem !== null && (
          <span>
            {soVn(p.diem)}
            <small> điểm</small>
          </span>
        )}
      </div>
      <Thanh ti={p.tong > 0 ? p.dung / p.tong : 0} nhan={`${TEN_PHAN[p.ma].split(' · ')[0]}: đúng ${p.dung} trên ${p.tong} câu`} />
      <p>{p.ma === 'II' ? `đúng trọn ${p.dung}/${p.tong} câu` : `đúng ${p.dung}/${p.tong} câu`}</p>
    </li>
  )
}

export function Ca({ pm }: { pm: PhMoi }) {
  const ca = pm.caGanNhat
  if (!ca) return null
  // Luật công bố đứng trên mọi khối: chỉ chạm vào ketQua/truoc/phan khi máy chủ nói ĐÃ công bố.
  const daCongBo = ca.congBo.daCongBo === true
  const kq = daCongBo && ca.ketQua && ca.ketQua.tong !== null ? ca.ketQua : null
  const { gio, ngay } = moNop(ca)
  const nopDay = [gio ? `lúc ${gio}` : '', ngay].filter(Boolean).join(' · ') // "lúc 09:12 · Thứ Bảy 19/09/2026"

  let thanTrong
  if (kq && kq.tong !== null) {
    const truoc = ca.truoc
    const phu = [
      truoc && truoc.tong !== null ? `Lần trước ${soVn(truoc.tong)} điểm` : '',
      gio ? `nộp lúc ${gio}` : '',
      ngay,
      kq.soCau !== null && kq.soCauDung !== null ? `đúng ${kq.soCauDung}/${kq.soCau} câu` : '',
      ca.thoiGianLamGiay !== null ? `làm trong ${chuThoiGian(ca.thoiGianLamGiay)}` : '',
    ].filter(Boolean)
    thanTrong = (
      <div className="phm-the phm-the--dem">
        <p className="phm-nhan-muc" data-mau="xam">
          {ca.tenCa}
        </p>
        <p className="phm-diem" role="img" aria-label={`${soVn(kq.tong)} trên 10 điểm`}>
          <b>{soVn(kq.tong)}</b>
          <span>/10 điểm</span>
        </p>
        {truoc && <SoVoiLanTruoc doi={truoc.doi} />}
        {phu.length > 0 && <p className="phm-phu">{phu.join(' · ')}</p>}
        {ca.phan.length > 0 && (
          <ul className="phm-phan">
            {ca.phan.map((p) => (
              <PhanCa key={p.ma} p={p} />
            ))}
          </ul>
        )}
      </div>
    )
  } else if (!daCongBo) {
    thanTrong = (
      <div className="phm-the phm-dong-bt">
        <span className="phm-o-bt" data-mau="xam">
          <BtKhoa />
        </span>
        <div>
          <h3>Thầy chưa công bố điểm</h3>
          <p>
            {nopDay ? `Con đã nộp bài ${nopDay}. ` : ''}
            {chuCongBoCa(ca)}
          </p>
        </div>
      </div>
    )
  } else {
    // Máy chủ nói đã công bố nhưng không gửi điểm: không nói "chưa công bố" (sai sự thật), cũng không bịa điểm.
    thanTrong = (
      <div className="phm-the phm-dong-bt">
        <span className="phm-o-bt" data-mau="xam">
          <BtDongHo />
        </span>
        <div>
          <h3>Chưa có điểm của ca này</h3>
          <p>{nopDay ? `Con đã nộp bài ${nopDay}.` : ca.tenCa}</p>
        </div>
      </div>
    )
  }

  return (
    <section className="phm-muc" id="muc-ca" aria-label="Ca kiểm tra gần nhất">
      <header className="phm-muc__dau">
        <h2>Ca kiểm tra gần nhất</h2>
      </header>
      {thanTrong}
    </section>
  )
}
