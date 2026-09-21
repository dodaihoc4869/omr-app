// ĐỊA CHỈ MÁY CHỦ + MÃ BÍ MẬT KHO ĐỀ — DỜI NGUYÊN từ khối "Cấu hình (1 lần)" cuối màn Ngân hàng đề sang màn CÀI ĐẶT (dọn dư thừa G4, Boss soát):
// một việc chỉ nằm MỘT chỗ. Chữ, ô nhập, hàm lưu giữ nguyên (`saveScriptUrl`, `saveTeacherSecret`); chỉ khác là lưu xong KHÔNG tự đồng bộ nữa —
// Ngân hàng đề tự đồng bộ mỗi lần mở (đã có sẵn ở màn ấy), nên thầy lưu ở đây rồi quay lại là đề về.
import { useEffect, useState } from 'react'
import { NutChinh } from './DesignSystem'
import { loadScriptUrl, loadTeacherSecret, saveScriptUrl, saveTeacherSecret } from '../lib/exam-db'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const O_NHAP: React.CSSProperties = {
  height: 52,
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4)',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--sans)',
  fontSize: 'var(--cx-2)',
  color: 'var(--muc)',
  width: '100%',
}

export default function KhoiKetNoiKhoDe({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'warn') => void }) {
  const [scriptUrl, setScriptUrl] = useState('')
  const [secret, setSecret] = useState('')
  useEffect(() => {
    let con = true
    void Promise.all([loadScriptUrl(), loadTeacherSecret()]).then(([url, mat]) => {
      if (!con) return
      setScriptUrl(url)
      setSecret(mat)
    })
    return () => {
      con = false
    }
  }, [])

  const luu = async () => {
    await saveScriptUrl(scriptUrl.trim())
    await saveTeacherSecret(secret.trim())
    showToast('Đã lưu trên máy này', 'success')
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
      <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
        Địa chỉ máy chủ và mã bí mật kho đề
      </div>
      <div>
        <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Địa chỉ máy chủ (bỏ trống = dùng máy chủ mới đã cấu hình)</div>
        <input style={O_NHAP} aria-label="Địa chỉ máy chủ" value={scriptUrl} onChange={(e) => setScriptUrl(e.target.value)} placeholder="https://omr.ttadodaihoc.workers.dev" />
      </div>
      <div>
        <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Mã bí mật kho đề (đúng bằng MA_BI_MAT đã đặt trong Apps Script)</div>
        <input style={O_NHAP} type="password" aria-label="Mã bí mật kho đề" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Mã bí mật" autoComplete="off" />
      </div>
      <NutChinh variant="phu" onClick={luu}>
        Lưu
      </NutChinh>
      <div style={NHAN_NHO}>
        Mã chỉ lưu trên máy này (IndexedDB), không nằm trong code app, không gửi cho học sinh. Cách đặt MA_BI_MAT: xem đầu file <code>docs/apps-script-kiem-tra.gs</code>.
      </div>
    </div>
  )
}
