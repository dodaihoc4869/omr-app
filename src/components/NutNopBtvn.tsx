// NÚT NỘP BTVN — đứng cạnh nút "Xem điểm của em" trên màn của học sinh.
//
// Đặc tả `claude/PHAN-CONG-GIAO-BTVN.md`: dưới ô nhập số báo danh có HAI nút —
// *Xem điểm* (y như cũ) và *Nộp BTVN* (mở phiếu bài tập của chính em đó), kèm
// đồng hồ đếm ngược tới hạn 48 giờ.
//
// CHẶN QUÁ HẠN Ở MÁY CHỦ. Đồng hồ ở đây chỉ để em nhìn; giờ trên máy em chỉnh
// được nên nó không bao giờ là cái chặn. Máy chủ từ chối thì hiện đúng câu thầy
// chốt: "Bạn đã quá hạn nộp BTVN".
import { useEffect, useState } from 'react'
import { NutChinh, OThongBao } from './DesignSystem'
import { layCauHinhChoEmBtvn } from '../lib/btvn-cho-em'
import { btvnCuaEm } from '../lib/btvn-may-chu-moi'

/** Đếm ngược thành chữ. Hết giờ thì trả rỗng — chỗ gọi hiện câu quá hạn. */
export function demNguoc(hanIso: string, nay = Date.now()): string {
  const han = Date.parse(hanIso)
  if (!Number.isFinite(han)) return ''
  const con = han - nay
  if (con <= 0) return ''
  const gio = Math.floor(con / 3600000)
  const phut = Math.floor((con % 3600000) / 60000)
  if (gio >= 24) {
    const ngay = Math.floor(gio / 24)
    return `còn ${ngay} ngày ${gio % 24} giờ`
  }
  if (gio > 0) return `còn ${gio} giờ ${phut} phút`
  return `còn ${phut} phút`
}

export default function NutNopBtvn({ maCa, sbd }: { maCa: string; sbd: string }) {
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const [han, setHan] = useState('')
  const [nhip, setNhip] = useState(0)

  // Đồng hồ nhích mỗi phút. Không cần nhanh hơn: hạn tính bằng giờ.
  useEffect(() => {
    if (!han) return
    const t = setInterval(() => setNhip((n) => n + 1), 60000)
    return () => clearInterval(t)
  }, [han])

  async function mo() {
    setDang(true)
    setLoi('')
    try {
      const ch = await layCauHinhChoEmBtvn()
      const r = await btvnCuaEm(ch, maCa, sbd)
      if (!r.ok) {
        // Câu chữ của máy chủ được dùng NGUYÊN VĂN — nó là câu thầy đã chốt.
        setLoi(r.error || 'Không mở được bài tập')
        if (r.lyDo === 'qua_han') setHan('')
        return
      }
      setHan(String(r.hanNop ?? ''))
      // Mở phiếu bằng chính đường phiếu đang chạy: gói đề đã có trong tay.
      const w = window.open('', '_blank')
      if (!w) {
        setLoi('Trình duyệt chặn mở cửa sổ. Bấm lại và cho phép mở.')
        return
      }
      const { dungPhieuBtvn } = await import('../lib/btvn-cho-em')
      w.document.write(await dungPhieuBtvn(r, maCa, sbd))
      w.document.close()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không mở được bài tập')
    } finally {
      setDang(false)
    }
  }

  const conLai = han ? demNguoc(han, Date.now() + nhip * 0) : ''

  return (
    <div style={{ display: 'grid', gap: 'var(--k2)' }}>
      <NutChinh variant="phu" onClick={() => void mo()} disabled={dang || !sbd.trim()}>
        {dang ? 'Đang mở…' : 'Nộp BTVN'}
      </NutChinh>
      {conLai && (
        <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
          Hạn nộp bài tập về nhà: <b>{conLai}</b>
        </div>
      )}
      {loi && <OThongBao tone="do">{loi}</OThongBao>}
    </div>
  )
}
