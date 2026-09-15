// CỬA KHOÁ APP CỦA THẦY — MÁY CHƯA CÓ MÃ BÍ MẬT THÌ KHÔNG VÀO ĐƯỢC.
//
// Thầy chốt 15/09: "app giáo viên khoá cứng lại không thể chạm vào được bằng
// cách nào".
//
// ─────────────────────────────────────────────────────────────────────────
// LỖ HỔNG BỊT Ở ĐÂY
//
// Bản trước, `App.tsx` quyết định thế này:
//
//     const ma = await loadTeacherSecret()
//     setKhoa(ma ? 'can_dat' : 'da_mo')     // ← máy TRẮNG vào THẲNG
//
// Ý ban đầu là "máy chưa có mã bí mật thì chưa có gì để khoá". Đúng về dữ
// liệu — máy em không có dữ liệu của thầy. Nhưng hậu quả: em gõ `/gv` trên
// điện thoại của chính em là MỞ RA APP QUẢN LÝ, không hỏi một câu nào. Mã bí
// mật lại từng lộ ngày 10/09, nên "em không có mã" không phải hàng rào.
//
// Nay đảo lại: KHÔNG CÓ MÃ BÍ MẬT TRÊN MÁY ⇒ KHÔNG CÓ APP. Cửa này là thứ duy
// nhất hiện ra, và cách duy nhất qua nó là nhập đúng mã bí mật — MÁY CHỦ chấm,
// không phải máy này tự chấm. Em không có mã thì không có đường nào đi tiếp:
// không nút, không link, không màn nào khác phía sau.
//
// VÌ SAO KHÔNG ĐỂ MÁY TỰ CHẤM: máy em sửa được mọi thứ trong trình duyệt. Chỉ
// câu trả lời của máy chủ mới đáng tin.
//
// THẦY TRÊN MÁY MỚI vẫn vào được: gõ mã một lần ở đây, máy nhớ, rồi đi tiếp
// đúng luồng mật khẩu mở app như cũ.
import { useState } from 'react'
import { Lock, ArrowRight } from 'lucide-react'
import { loadScriptUrlHoacMacDinh, saveTeacherSecret } from '../lib/exam-db'
import { lichSuLenBang } from '../lib/exam-api'

export default function KhoaMayThayScreen({ onMoDuoc }: { onMoDuoc: () => void }) {
  const [ma, setMa] = useState('')
  const [dangKiem, setDangKiem] = useState(false)
  const [loi, setLoi] = useState('')

  const kiem = async () => {
    const sach = ma.trim()
    if (!sach) return setLoi('Chưa nhập mã bí mật.')
    setDangKiem(true)
    setLoi('')
    // HAI BƯỚC, BÁO LỖI RIÊNG. Gộp một `try` thì lúc kho của trình duyệt hỏng,
    // thầy nhập ĐÚNG mã vẫn bị báo "mã không đúng" — sai chỗ, tìm cả buổi.
    try {
      const url = await loadScriptUrlHoacMacDinh()
      // MÁY CHỦ CHẤM MÃ. `lichSuLenBang` là lệnh của thầy, chỉ đọc, gói trả về
      // nhỏ — sai mã là máy chủ trả 403 và hàm này ném lỗi.
      await lichSuLenBang(url, sach, 1)
    } catch (e) {
      setLoi(
        e instanceof Error && /mạng|network|fetch|timeout/i.test(e.message)
          ? 'Không nối được máy chủ. Thử lại.'
          : 'Mã bí mật không đúng.',
      )
      setDangKiem(false)
      return
    }
    // MÃ ĐÃ ĐÚNG. Cất hỏng thì vẫn cho vào — thầy đã chứng minh là thầy rồi;
    // chỉ là lần sau phải nhập lại.
    try {
      await saveTeacherSecret(sach)
    } catch {
      console.warn('[khoa-may-thay] không cất được mã bí mật vào máy này')
    }
    onMoDuoc()
  }

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ minHeight: '100dvh', padding: 'var(--k5, 24px)', background: 'var(--nen)', gap: 'var(--k4, 16px)' }}
      data-man="khoa-may-thay"
    >
      <div className="flex flex-col items-center" style={{ gap: 'var(--k2, 8px)', textAlign: 'center' }}>
        <span
          className="flex items-center justify-center"
          style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--the-2)' }}
        >
          <Lock size={26} />
        </span>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', fontWeight: 800, color: 'var(--muc)' }}>
          App của Thầy
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--nhat)', maxWidth: 380 }}>
          Máy này chưa được cấp quyền. Nhập mã bí mật để mở trên máy này.
        </div>
      </div>

      <div className="flex flex-col w-full" style={{ gap: 'var(--k2, 8px)', maxWidth: 380 }}>
        <input
          type="password"
          value={ma}
          onChange={(e) => setMa(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !dangKiem) void kiem()
          }}
          placeholder="Mã bí mật"
          autoComplete="off"
          disabled={dangKiem}
          style={{
            height: 52,
            borderRadius: 'var(--bo-1)',
            padding: '0 var(--k4, 16px)',
            background: 'var(--the-2)',
            border: '1.5px solid var(--vien)',
            fontFamily: 'var(--sans)',
            fontSize: 'var(--cx-2)',
            color: 'var(--muc)',
          }}
        />
        <button
          type="button"
          onClick={() => void kiem()}
          disabled={dangKiem}
          className="tap-target inline-flex items-center justify-center font-bold"
          style={{
            gap: 8,
            minHeight: 52,
            borderRadius: 'var(--bo-1)',
            background: 'var(--gg-xanh)',
            color: 'rgb(255,255,255)',
            border: 'none',
            fontFamily: 'var(--sans)',
            fontSize: 'var(--cx-2)',
            opacity: dangKiem ? 0.6 : 1,
          }}
        >
          {dangKiem ? 'Đang kiểm tra…' : 'Mở app'} <ArrowRight size={18} />
        </button>
        {loi && (
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--gg-do)' }} role="alert">
            {loi}
          </div>
        )}
      </div>

      <div
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 'var(--cx-1)',
          color: 'var(--nhat)',
          textAlign: 'center',
          maxWidth: 380,
        }}
      >
        Em học sinh và phụ huynh mở app bằng đúng link Thầy gửi, không phải ở đây.
      </div>
    </div>
  )
}
