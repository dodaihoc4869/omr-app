// THẺ "CA KIỂM TRA GẦN NHẤT CỦA CON" (đầu Bảng nhiệm vụ phụ huynh; mẫu ph-3-the-ca-gan-nhat.html, Boss soát ĐẠT 21/09). Ghép từ bộ xd-* đã chốt.
// Ca ĐÃ công bố: cả thẻ là MỘT nút ≥ 48 px ("Xem báo cáo ca này"); bấm ⇒ `onMo` (TẠM mở hộp báo cáo của đúng ca đó cho tới khi bảng "Mọi thứ về con" được thầy chốt; app PH đã gỡ tab Xem điểm).
// Ca CHƯA công bố ⇒ thẻ trung tính, KHÔNG bấm được (không có gì để mở): KHÔNG điểm, KHÔNG số câu, KHÔNG phần. Không game, không xếp hạng, không so con với bạn. Không mã nội bộ.
import { ChevronRight, Lock, Users } from 'lucide-react'
import '../m3'
import './xem-diem.css'
import { ChipCongBo, SoSanh } from './thanh-phan'
import { chuGioNop, soVn } from '../../lib/ket-qua-sau-nop'
import type { TheCaGanNhat } from '../../lib/the-ca-gan-nhat'

const TIEU_DE = 'Ca kiểm tra gần nhất của con'

export default function TheCaGanNhatCua({ the, onMo }: { the: TheCaGanNhat | null; onMo?: () => void }) {
  if (!the) return null
  const luc = chuGioNop(the.nopLuc)
  const duoi = (
    <span className="xd-tcg__duoi">
      <span>Xem báo cáo ca này</span>
      <ChevronRight className="xd-i xd-i--l" aria-hidden="true" />
    </span>
  )
  if (the.kieu !== 'da_cong_bo') {
    const gioBai = luc ? ` lúc ${luc.split(' · ')[0]}` : ''
    const dong =
      the.kieu === 'ca_lop'
        ? `Con đã nộp bài${gioBai}. Điểm hiện khi cả lớp nộp xong${the.nop !== null && the.si !== null && the.si >= the.nop && the.si > 0 ? ` (${the.nop}/${the.si} em đã nộp)` : ''}.`
        : `Con đã nộp bài${gioBai}. Thầy chưa công bố điểm.`
    return (
      <div className="xd xd--trong" data-vung="the-ca-gan-nhat" data-kieu={the.kieu}>
        <div className="xd-the xd-tcg" role="group" aria-label={`${TIEU_DE}: ${the.tenCa}. ${dong}`}>
          <span className="xd-tcg__tren">
            <span className="xd-tcg__nhan">{TIEU_DE}</span>
            <ChipCongBo tt={the.kieu} />
          </span>
          <span className="xd-tcg__giua">
            <span className="xd-tcg__diem xd-tcg__diem--khoa" aria-hidden="true">
              {the.kieu === 'ca_lop' ? <Users className="xd-i xd-i--l" /> : <Lock className="xd-i xd-i--l" />}
              <small>Chưa có điểm</small>
            </span>
            <span className="xd-tcg__chu">
              <h3>{the.tenCa}</h3>
              <p>{dong}</p>
            </span>
          </span>
        </div>
      </div>
    )
  }
  const coSoCau = the.dung !== null && the.tong !== null
  const nhanSoCau = coSoCau ? `, đúng ${the.dung} trên ${the.tong} câu` : ''
  return (
    <div className="xd xd--trong" data-vung="the-ca-gan-nhat" data-kieu="da_cong_bo">
      <button type="button" className="xd-the xd-tcg" onClick={onMo} disabled={!onMo} aria-label={`${TIEU_DE}: ${the.tenCa}, ${soVn(the.diem)} trên 10 điểm${nhanSoCau}. Xem báo cáo ca này.`}>
        <span className="xd-tcg__tren">
          <span className="xd-tcg__nhan">{TIEU_DE}</span>
          <ChipCongBo tt="da_cong_bo" />
        </span>
        <span className="xd-tcg__giua">
          <span className="xd-tcg__diem" aria-hidden="true">
            <b>{soVn(the.diem)}</b>
            <small>trên 10 điểm</small>
          </span>
          <span className="xd-tcg__chu">
            <h3>{the.tenCa}</h3>
            {luc && <p className="xd-so">Nộp {luc}</p>}
            {coSoCau && (
              <p className="xd-so">
                Con làm đúng {the.dung}/{the.tong} câu
              </p>
            )}
            {the.ss !== undefined && <SoSanh hieu={the.ss === null ? null : the.ss.hieu} truoc={the.ss?.truoc} ai="con" />}
          </span>
        </span>
        {the.phan.length > 0 && (
          <span className="xd-tcg__phan xd-tcg__phan--so">
            {the.phan.map((p) => (
              <span key={p.ma} className="xd-tcg__o" role="group" aria-label={`${p.ten}: ${soVn(p.diem)} điểm`}>
                <small>{p.ten}</small>
                <b className="xd-so">
                  {soVn(p.diem)}
                  <i>điểm</i>
                </b>
              </span>
            ))}
          </span>
        )}
        {duoi}
      </button>
    </div>
  )
}
