// MÀN XEM ĐIỂM — đường `/d/<mã ca>`.
//
// ============================================================================
// VÌ SAO CÓ MÀN NÀY — thầy báo 07/09
// ============================================================================
// Thầy gửi link ca cho em xem điểm thì em nhận về một ô đỏ báo chặn. Đúng như
// vậy: `/t/<mã ca>` là link VÀO THI. Nộp xong, máy chủ chặn vào lại, và màn làm
// bài chỉ mở lại được điểm khi CHÍNH MÁY đó còn giữ bài trong IndexedDB. Em mở
// ở máy khác, hay đã xoá dữ liệu trình duyệt, là cụt đường — mà máy chủ cũng
// không có lối trả bài về: `lichSuEm` khoá theo id thiết bị của lượt đã nộp.
//
// Màn này là lối riêng: em nhập lại ĐÚNG BA thứ như lúc vào thi (số báo danh,
// họ tên, năm sinh), máy chủ đối chiếu danh sách lớp rồi trả về MÃ PHIẾU của
// chính em; app chuyển thẳng sang `/p#<mã>` — vẫn đúng trang phiếu thầy gửi phụ
// huynh, không dựng thêm một trang điểm thứ hai để rồi hai nơi nói hai kiểu.
//
// KHÔNG hạ cổng danh tính: biết mỗi số báo danh thì không lấy được gì, y như
// link vào thi. Màn này cũng không đọc dữ liệu của thầy và không cần mã bí mật.
import { useEffect, useState } from 'react'
import { GraduationCap, Search } from 'lucide-react'
import { TheNoiDung, NutChinh, OThongBao } from '../components/DesignSystem'
import LogoDDH from '../components/LogoDDH'
import { phieuCuaEm } from '../lib/exam-api'
import { docDuongVao } from '../lib/vai-tro'
import { taoLinkPhieu } from '../lib/phieu-link'
import { loadScriptUrlHoacMacDinh } from '../lib/exam-db'

const KHOA_HO_TEN = 'ddh.em.hoTen'
const KHOA_NAM_SINH = 'ddh.em.namSinh'
const KHOA_SBD = 'ddh.em.sbd'

const O_NHAP: React.CSSProperties = {
  height: 52,
  width: '100%',
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4)',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--serif)',
  fontSize: 'var(--cx-3)',
  color: 'var(--muc)',
  outline: 'none',
}

function docNho(k: string): string {
  try {
    return localStorage.getItem(k) || ''
  } catch {
    return ''
  }
}

function O({
  nhan,
  giaTri,
  doi,
  goiY,
  so = false,
}: {
  nhan: string
  giaTri: string
  doi: (v: string) => void
  goiY: string
  so?: boolean
}) {
  return (
    <label className="flex flex-col" style={{ gap: 6 }}>
      <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>{nhan}</span>
      <input
        value={giaTri}
        onChange={(e) => doi(e.target.value)}
        inputMode={so ? 'numeric' : 'text'}
        placeholder={goiY}
        style={O_NHAP}
      />
    </label>
  )
}

export default function XemDiemScreen() {
  const [maCa, setMaCa] = useState(() => docDuongVao(location.search, location.pathname).maCa)
  const [sbd, setSbd] = useState(() => docNho(KHOA_SBD))
  const [hoTen, setHoTen] = useState(() => docNho(KHOA_HO_TEN))
  const [namSinh, setNamSinh] = useState(() => docNho(KHOA_NAM_SINH))
  const [url, setUrl] = useState('')
  const [dangTim, setDangTim] = useState(false)
  const [loi, setLoi] = useState('')

  useEffect(() => {
    loadScriptUrlHoacMacDinh()
      .then(setUrl)
      .catch(() => setUrl(''))
  }, [])

  const tim = async () => {
    const ma = maCa.trim()
    const sb = sbd.trim()
    const ten = hoTen.trim()
    const nam = namSinh.trim()
    setLoi('')
    if (!ma || !sb) return setLoi('Nhập đủ mã ca và số báo danh.')
    if (!ten) return setLoi('Nhập họ tên đúng như Thầy ghi trong sổ.')
    if (!/^(19|20)\d{2}$/.test(nam)) return setLoi('Nhập năm sinh 4 chữ số, ví dụ 2009.')
    if (!url.trim()) return setLoi('Chưa có link kết nối — mở đúng link Thầy gửi.')
    setDangTim(true)
    try {
      const kq = await phieuCuaEm(url.trim(), ma, sb, ten, nam)
      if (!kq.ma) throw new Error('Thầy chưa dựng phiếu kết quả cho ca này. Nhắn Thầy dựng phiếu rồi mở lại link.')
      try {
        localStorage.setItem(KHOA_SBD, sb)
        localStorage.setItem(KHOA_HO_TEN, ten)
        localStorage.setItem(KHOA_NAM_SINH, nam)
      } catch {
        // trình duyệt chặn storage — chỉ mất tiện dùng lần sau
      }
      // Đi thẳng sang trang phiếu, thay cả đường dẫn để em bấm quay lại không
      // rơi ngược vào ô nhập.
      location.replace(taoLinkPhieu(`${location.origin}${import.meta.env.BASE_URL}`, kq.ma))
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không tìm được phiếu của em.')
      setDangTim(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--nen)', color: 'var(--muc)', fontFamily: 'var(--serif)' }}>
      <div className="w-full flex flex-col" style={{ maxWidth: 420, gap: 'var(--k4)', padding: 'var(--k5) 0' }}>
        <div className="flex items-center" style={{ gap: 'var(--k3)' }}>
          <LogoDDH size={44} />
          <div className="min-w-0">
            <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)' }}>
              Xem điểm và báo cáo
            </div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
              Nhập đúng như lúc em vào thi
            </div>
          </div>
        </div>

        <TheNoiDung>
          <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
            <O nhan="Mã ca" giaTri={maCa} doi={setMaCa} goiY="6 chữ số" so />
            <O nhan="Số báo danh" giaTri={sbd} doi={setSbd} goiY="Ví dụ 12026" so />
            <O nhan="Họ và tên" giaTri={hoTen} doi={setHoTen} goiY="Ghi có dấu, đúng như trong sổ" />
            <O nhan="Năm sinh" giaTri={namSinh} doi={setNamSinh} goiY="Ví dụ 2009" so />
          </div>
        </TheNoiDung>

        {loi !== '' && <OThongBao tone="do">{loi}</OThongBao>}

        <NutChinh onClick={tim} disabled={dangTim}>
          <span className="inline-flex items-center gap-2">
            {dangTim ? <Search size={18} /> : <GraduationCap size={18} />} {dangTim ? 'Đang tìm…' : 'Xem điểm của em'}
          </span>
        </NutChinh>
      </div>
    </div>
  )
}
