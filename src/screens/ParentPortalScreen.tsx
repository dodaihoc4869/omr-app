// APP PHỤ HUYNH ĐÃ NGỪNG (Game Hóa 2.0, thầy chốt 27/09: "bỏ hẳn app phụ huynh" — prompt-*game-hoa-2*, docs/hop-dong-game-hoa-2.md).
// Đường /ph còn sống để phụ huynh mở liên kết cũ không gặp trang lỗi: chỉ MỘT màn M3 báo đã ngừng. KHÔNG gọi máy chủ, KHÔNG đăng nhập,
// KHÔNG đọc/ghi mã liên kết cũ. Bản app phụ huynh đầy đủ nằm trong lịch sử git của tệp này (lùi commit là có lại).
import { useEffect } from 'react'
import { LogoDoc } from '../components/LogoVai'
import { nhoVaiDaDung } from '../lib/vai-tro'
import { datManifestTheoVai } from '../lib/pwa-install'
import '../components/m3'

export const CHU_PH_DA_NGUNG = 'Ứng dụng phụ huynh đã ngừng. Thầy gửi tiến độ của con trực tiếp cho phụ huynh.'

export default function ParentPortalScreen() {
  useEffect(() => {
    nhoVaiDaDung('ph')
    try {
      datManifestTheoVai('ph')
      document.title = 'ĐĐH Phụ Huynh'
    } catch {
      // máy chặn đổi tiêu đề: màn vẫn hiện đúng
    }
  }, [])

  return (
    <div className="m3" data-man="ph-da-ngung">
      <main
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom))',
          background: 'var(--m3-surface)',
          color: 'var(--m3-on-surface)',
        }}
      >
        <section
          aria-labelledby="ph-da-ngung-tieu-de"
          style={{
            width: '100%',
            maxWidth: 440,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: 24,
            borderRadius: 28,
            background: 'var(--m3-surface-container)',
          }}
        >
          <LogoDoc vai="ph" size={64} tieuDe />
          <h1 id="ph-da-ngung-tieu-de" style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>
            Ứng dụng phụ huynh đã ngừng
          </h1>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--m3-on-surface-variant)' }}>{CHU_PH_DA_NGUNG}</p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--m3-on-surface-variant)' }}>
            Phụ huynh cần hỏi thêm về việc học của con, xin nhắn trực tiếp cho thầy Đỗ Đại Học.
          </p>
        </section>
      </main>
    </div>
  )
}
