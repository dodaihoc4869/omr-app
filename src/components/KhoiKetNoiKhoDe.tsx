// ĐỊA CHỈ MÁY CHỦ + MÃ BÍ MẬT — DỜI NGUYÊN từ khối "Cấu hình (1 lần)" cuối màn Ngân hàng đề sang màn CÀI ĐẶT (dọn dư thừa G4, Boss soát):
// một việc chỉ nằm MỘT chỗ. Chữ, ô nhập, hàm lưu giữ nguyên (`saveScriptUrl`, `saveTeacherSecret`); chỉ khác là lưu xong KHÔNG tự đồng bộ nữa —
// Ngân hàng đề tự đồng bộ mỗi lần mở (đã có sẵn ở màn ấy), nên thầy lưu ở đây rồi quay lại là đề về.
//
// ĐỔI MÃ BÍ MẬT KHI MÁY ĐÃ ĐẶT MẬT KHẨU MỞ APP (07/10, thầy đổi MA_BI_MAT ở Cloudflare rồi bấm Lưu ở đây mà app vẫn 403):
// máy có mật khẩu thì `loadTeacherSecret()` trả mã trong BỘ NHỚ PHIÊN (giải từ bản ghi `khoaApp`), bỏ qua khoá chữ thường — nên bấm Lưu như
// cũ chỉ ghi một bản chữ thường vô dụng (lại còn phá luật "có mật khẩu thì không để chữ thường"), app vẫn gửi mã cũ. Nay: máy có mật khẩu ⇒
// hỏi mật khẩu mở app, cất lại BẢN MÃ HOÁ bằng mã mới (đúng như màn "Quên mật khẩu"), đặt mã mới vào bộ nhớ phiên ngay — không ghi chữ thường.
// Mã đổi thì KIỂM VỚI MÁY CHỦ trước khi cất (lệnh chỉ đọc như màn mở máy lần đầu): máy chủ đáp 403 ⇒ không cất, nói rõ "mã chưa đúng".
import { useEffect, useState } from 'react'
import { NutChinh } from './DesignSystem'
import { batKhoaApp, coMaBiMatPhien, datMaBiMatPhien, loadKhoaApp, loadScriptUrl, loadScriptUrlHoacMacDinh, loadTeacherSecret, saveScriptUrl, saveTeacherSecret } from '../lib/exam-db'
import { diaChiMayChuHopLe } from '../lib/cau-hinh-may-chu'
import { lichSuLenBang } from '../lib/exam-api'
import { datMatKhau, moKhoa, type BanGhiKhoa } from '../lib/khoa-app'
import { catPhien } from '../lib/khoa-phien'

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
  // Mã đã nạp lúc mở màn — để biết thầy có đổi mã hay chỉ đổi địa chỉ.
  const [maDaNap, setMaDaNap] = useState('')
  // Bản ghi khoá app của máy này. Có = máy đã đặt mật khẩu mở app.
  const [khoa, setKhoa] = useState<BanGhiKhoa | null>(null)
  const [matKhauApp, setMatKhauApp] = useState('')
  const [dang, setDang] = useState(false)
  useEffect(() => {
    let con = true
    void Promise.all([loadScriptUrl(), loadTeacherSecret(), loadKhoaApp().catch(() => null)]).then(([url, mat, kh]) => {
      if (!con) return
      setScriptUrl(url)
      setSecret(mat)
      setMaDaNap(mat)
      setKhoa(kh)
    })
    return () => {
      con = false
    }
  }, [])

  const maDoi = secret.trim() !== maDaNap.trim()
  // Ô mật khẩu mở app chỉ hiện khi CẦN: máy có mật khẩu VÀ thầy đang đổi mã.
  const canMatKhauApp = !!khoa && maDoi && secret.trim() !== ''

  const luu = async () => {
    if (dang) return
    const url = scriptUrl.trim()
    const ma = secret.trim()
    if (url && !diaChiMayChuHopLe(url)) {
      showToast('Địa chỉ máy chủ chưa hợp lệ. Thầy nhập địa chỉ HTTPS dùng được trên máy khác.', 'error')
      return
    }
    // Máy có mật khẩu mà đổi mã: hỏi mật khẩu mở app TRƯỚC, khỏi gọi máy chủ vô ích.
    const doiMaCoKhoa = maDoi && !!ma && !!khoa
    if (doiMaCoKhoa && !matKhauApp) {
      showToast('Máy này có mật khẩu mở app. Nhập mật khẩu mở app để cất mã mới.', 'warn')
      return
    }
    setDang(true)
    try {
      let daKiem = false
      if (maDoi && ma) {
        // KIỂM MÃ VỚI MÁY CHỦ TRƯỚC KHI CẤT. Chỉ chặn khi máy chủ nói thẳng mã sai (HTTP 403); mạng chậm thì vẫn cho cất, kèm lời nhắc.
        try {
          const diaChi = url || (await loadScriptUrlHoacMacDinh())
          await lichSuLenBang(diaChi, ma, 1)
          daKiem = true
        } catch (e) {
          const chu = e instanceof Error ? e.message : ''
          if (/403/.test(chu) || /sai mã/i.test(chu)) {
            showToast('Mã bí mật chưa đúng với máy chủ — CHƯA lưu. Gõ lại đúng mã đã đặt ở Cloudflare.', 'error')
            return
          }
        }
      }

      if (doiMaCoKhoa && khoa) {
        // MÁY CÓ MẬT KHẨU MỞ APP: cất lại bản mã hoá bằng mã mới; không ghi chữ thường.
        const cu = await moKhoa(matKhauApp, khoa)
        if (cu === null) {
          showToast('Mật khẩu mở app không đúng — chưa đổi mã.', 'error')
          return
        }
        const b = await datMatKhau(matKhauApp, ma, khoa.hoiLai)
        await saveScriptUrl(url)
        // Cất bản mã hoá + đặt mã mới vào bộ nhớ phiên (batKhoaApp), rồi thay chìa phiên của tab này. `catPhien` hỏng thì tự dọn bộ nhớ ⇒ đặt lại.
        await batKhoaApp(b, ma)
        await catPhien(ma)
        datMaBiMatPhien(ma)
        setKhoa(b)
        setMaDaNap(ma)
        setMatKhauApp('')
        showToast(daKiem ? 'Đã lưu mã mới, app dùng ngay. Mã khớp với máy chủ.' : 'Đã lưu mã mới, app dùng ngay. Chưa kiểm được với máy chủ (mạng chậm).', daKiem ? 'success' : 'warn')
        return
      }

      await saveScriptUrl(url)
      if (khoa) {
        // Máy có mật khẩu: mã nằm trong bản ghi mã hoá, KHÔNG ghi chữ thường. Ô mã để trống ⇒ giữ mã cũ.
        showToast(maDoi ? 'Đã lưu địa chỉ máy chủ. Ô mã bí mật để trống nên giữ nguyên mã cũ.' : 'Đã lưu trên máy này', maDoi ? 'warn' : 'success')
        return
      }
      await saveTeacherSecret(ma)
      // Bộ nhớ phiên còn giữ mã cũ (vừa gỡ mật khẩu chẳng hạn) thì `loadTeacherSecret()` vẫn trả mã cũ — cập nhật luôn.
      if (coMaBiMatPhien()) datMaBiMatPhien(ma)
      setMaDaNap(ma)
      showToast('Đã lưu trên máy này', 'success')
    } finally {
      setDang(false)
    }
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
      <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
        Địa chỉ máy chủ và mã bí mật
      </div>
      <div>
        <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Địa chỉ máy chủ (bỏ trống = dùng máy chủ mới đã cấu hình)</div>
        <input style={O_NHAP} aria-label="Địa chỉ máy chủ" value={scriptUrl} onChange={(e) => setScriptUrl(e.target.value)} placeholder="https://omr.ttadodaihoc.workers.dev" />
      </div>
      <div>
        <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Mã bí mật (đúng bằng MA_BI_MAT đã đặt ở máy chủ Cloudflare)</div>
        <input style={O_NHAP} type="password" aria-label="Mã bí mật" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Mã bí mật" autoComplete="off" />
      </div>
      {canMatKhauApp && (
        <div>
          <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Mật khẩu mở app (để cất mã mới — máy này đang đặt mật khẩu)</div>
          <input style={O_NHAP} type="password" aria-label="Mật khẩu mở app" value={matKhauApp} onChange={(e) => setMatKhauApp(e.target.value)} placeholder="Mật khẩu mở app" autoComplete="off" />
        </div>
      )}
      <NutChinh variant="phu" onClick={luu} disabled={dang}>
        {dang ? 'Đang lưu…' : 'Lưu'}
      </NutChinh>
      <div style={NHAN_NHO}>
        Mã chỉ lưu trên máy này (IndexedDB), không nằm trong code app, không gửi cho học sinh. Đổi mã: đặt lại biến MA_BI_MAT của máy chủ trên Cloudflare, rồi nhập mã mới ở đây.
      </div>
    </div>
  )
}
