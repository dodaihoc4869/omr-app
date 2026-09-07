// THÊM MỘT HỌC SINH — thầy chốt 07/09.
//
// Thầy gõ ba ô (họ tên, năm sinh, số báo danh), bấm Thêm; máy ghi thẳng vào
// Google Sheet GỐC của khối đó rồi thêm luôn vào bản sao trên máy chủ.
//
// VÌ SAO PHẢI GHI VÀO SHEET GỐC: bản sao `DanhSachLop` bị lượt Đồng bộ kế tiếp
// ghi đè bằng nội dung ba link. Thêm em vào mỗi bản sao thì buổi sau em biến
// mất khỏi danh sách mà không ai biết, và em đứng ngoài phòng thi.
//
// Máy chủ chọn sheet theo NĂM SINH (sheet của thầy đặt tên đúng bằng năm sinh).
// Không tìm ra, hoặc thấy hai tệp cùng tên, thì nó dừng và nói rõ chứ không
// đoán — đoán bừa là ghi tên em vào khối khác.
import { useState } from 'react'
import { UserPlus, Check } from 'lucide-react'
import { themEmVaoSheet } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'

const NHAN: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', marginBottom: 'var(--k2)' }
const O_NHAP: React.CSSProperties = {
  height: 48,
  width: '100%',
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k3)',
  background: 'var(--the)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--sans)',
  fontSize: 'var(--cx-2)',
  color: 'var(--muc)',
  outline: 'none',
}

export default function NutThemHocSinh({ onXong }: { onXong?: (soEm: number, tomTat: string) => void }) {
  const [mo, setMo] = useState(false)
  const [hoTen, setHoTen] = useState('')
  const [namSinh, setNamSinh] = useState('')
  const [sbd, setSbd] = useState('')
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const [xong, setXong] = useState('')

  const dong = () => {
    setMo(false)
    setLoi('')
    setXong('')
  }

  const them = async () => {
    setLoi('')
    setXong('')
    const ten = hoTen.replace(/\s+/g, ' ').trim()
    const nam = namSinh.trim()
    const so = sbd.trim()
    // Kiểm ngay tại máy trước khi gọi mạng — ba lỗi này thầy sửa trong một giây.
    if (!ten) return setLoi('Chưa nhập họ tên')
    if (!/^(19|20)\d{2}$/.test(nam)) return setLoi('Năm sinh phải là 4 chữ số, ví dụ 2009')
    if (!/^\d{3,12}$/.test(so)) return setLoi('Số báo danh phải là số, 3 tới 12 chữ số')
    setDang(true)
    try {
      const [url, secret] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim() || !secret.trim()) return setLoi('Chưa cấu hình máy chủ')
      const kq = await themEmVaoSheet(url.trim(), secret.trim(), { sbd: so, hoTen: ten, namSinh: nam })
      setXong(`Đã thêm ${kq.hoTen} · SBD ${kq.sbd} vào sheet ${kq.tenSheet}${kq.lop ? ` · lớp ${kq.lop}` : ''}`)
      setHoTen('')
      setNamSinh('')
      setSbd('')
      onXong?.(1, `Đã thêm ${kq.hoTen}`)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không thêm được học sinh')
    } finally {
      setDang(false)
    }
  }

  return (
    <div className="flex flex-col items-end" style={{ gap: 'var(--k2)' }}>
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-expanded={mo}
        className="tap-target inline-flex items-center justify-center font-bold whitespace-nowrap"
        style={{
          gap: 'var(--k2)',
          height: 40,
          minHeight: 40,
          padding: '0 var(--k4) 0 var(--k3)',
          borderRadius: 'var(--bo-tron)',
          background: 'var(--the-2)',
          color: 'var(--muc)',
          border: '1.5px solid transparent',
          fontFamily: 'var(--sans)',
          fontSize: 'var(--cx-1)',
        }}
      >
        <UserPlus size={16} />
        <span>Thêm học sinh</span>
      </button>

      {mo && (
        <div style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-2)', padding: 'var(--k4)', width: '100%', maxWidth: 520 }}>
          <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
            <div>
              <div style={NHAN}>Họ và tên</div>
              <input style={O_NHAP} value={hoTen} onChange={(e) => setHoTen(e.target.value)} placeholder="Nguyễn Văn A" autoComplete="off" aria-label="Họ và tên" />
            </div>
            <div>
              <div style={NHAN}>Năm sinh</div>
              <input
                style={{ ...O_NHAP, fontVariantNumeric: 'tabular-nums' }}
                value={namSinh}
                onChange={(e) => setNamSinh(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="2009"
                inputMode="numeric"
                maxLength={4}
                aria-label="Năm sinh"
              />
              <div style={{ ...NHAN, marginTop: 'var(--k1)', marginBottom: 0 }}>Năm sinh quyết định ghi vào sheet khối nào.</div>
            </div>
            <div>
              <div style={NHAN}>Số báo danh</div>
              <input
                style={{ ...O_NHAP, fontVariantNumeric: 'tabular-nums' }}
                value={sbd}
                onChange={(e) => setSbd(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="12050"
                inputMode="numeric"
                aria-label="Số báo danh"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void them()
                }}
              />
            </div>

            {loi && (
              <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--do)', background: 'var(--do-nen)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>{loi}</div>
            )}
            {xong && (
              <div className="flex items-center" style={{ gap: 'var(--k2)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--xanh)', background: 'var(--xanh-nen)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
                <Check size={16} />
                <span>{xong}</span>
              </div>
            )}

            <div className="flex items-center justify-end" style={{ gap: 'var(--k2)' }}>
              <button
                type="button"
                onClick={dong}
                className="tap-target"
                style={{ height: 44, padding: '0 var(--k3)', borderRadius: 'var(--bo-1)', background: 'transparent', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => void them()}
                disabled={dang}
                className="tap-target font-bold"
                style={{ height: 44, padding: '0 var(--k5)', borderRadius: 'var(--bo-1)', background: 'var(--muc)', color: 'var(--muc-nguoc)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}
              >
                {dang ? 'Đang thêm…' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
