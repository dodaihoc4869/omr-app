import { useMemo, useState } from 'react'
import { Check, Copy, ExternalLink, QrCode, Smartphone, X } from 'lucide-react'
import { duongQr, taoQr } from '../../lib/ma-qr'

interface ModalDieuKhienTuXaProps {
  maPhien: string
  maPin?: string
  tieuDe?: string
  onDong: () => void
}

export default function ModalDieuKhienTuXa({ maPhien, maPin, tieuDe, onDong }: ModalDieuKhienTuXaProps) {
  const [daChep, setDaChep] = useState(false)

  const url = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    return `${origin}/?remote=${encodeURIComponent(maPhien)}`
  }, [maPhien])

  const qrSvg = useMemo(() => {
    if (!url) return null
    const m = taoQr(url)
    if (!m) return null
    return duongQr(m)
  }, [url])

  const saoChep = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setDaChep(true)
      setTimeout(() => setDaChep(false), 2000)
    } catch {
      /* trình duyệt không cho clipboard */
    }
  }

  return (
    <div
      className="dh-phu-lop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-remote-tieu-de"
      style={{ zIndex: 100000 }}
      onKeyDown={(e) => e.key === 'Escape' && onDong()}
    >
      <div
        className="dh-hop"
        style={{
          maxWidth: 480,
          borderRadius: 24,
          padding: 24,
          background: 'var(--m3-surface, white)',
          color: 'var(--muc)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(35,78,107,0.1)',
                color: 'var(--mc-xanh, rgb(35, 78, 107))',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Smartphone size={22} />
            </div>
            <div>
              <h2 id="modal-remote-tieu-de" style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                Điều khiển từ điện thoại
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--nhat)' }}>
                {tieuDe || 'Chiếu lên bảng'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="m3-nut-chu"
            onClick={onDong}
            style={{ width: 36, height: 36, borderRadius: '50%', padding: 0, display: 'grid', placeItems: 'center' }}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Khung QR Code */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 16px',
            background: 'var(--the-2)',
            borderRadius: 16,
            border: '1px solid var(--vien)',
            margin: '12px 0',
          }}
        >
          {qrSvg ? (
            <div
              style={{
                background: 'rgb(255, 255, 255)',
                padding: 12,
                borderRadius: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              <svg
                viewBox={`0 0 ${qrSvg.canh} ${qrSvg.canh}`}
                style={{ width: 200, height: 200, display: 'block' }}
                aria-label="Mã QR điều khiển từ xa"
              >
                <path d={qrSvg.d} fill="rgb(0, 0, 0)" />
              </svg>
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--nhat)' }}>
              <QrCode size={48} style={{ opacity: 0.5, margin: '0 auto 8px' }} />
              <p>Mã điều khiển: <b>{maPin || maPhien}</b></p>
            </div>
          )}

          <p style={{ marginTop: 14, marginBottom: 4, fontWeight: 700, fontSize: 14, textAlign: 'center' }}>
            Mở Camera điện thoại quét mã QR
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--nhat)', textAlign: 'center', maxWidth: 360 }}>
            Điện thoại kết nối ngay lập tức để: <b>Bấm gọi lên bảng</b>, <b>Hiện/ẩn lời giải</b>, <b>Chuyển câu</b>, <b>Chấm Đạt</b> từ xa.
          </p>
        </div>

        {maPin && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(35,78,107,0.06)',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>Mã số PIN kết nối:</span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: '0.15em',
                fontFamily: 'monospace',
                color: 'var(--mc-xanh, rgb(35, 78, 107))',
              }}
            >
              {maPin}
            </span>
          </div>
        )}

        {/* Link kết nối */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            aria-label="Liên kết kết nối điều khiển từ xa"
            type="text"
            readOnly
            value={url}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 12,
              borderRadius: 10,
              border: '1px solid var(--vien)',
              background: 'var(--the-2, white)',
              color: 'var(--muc)',
              fontFamily: 'monospace',
            }}
          />
          <button
            type="button"
            className="m3-nut-tonal"
            onClick={() => void saoChep()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '0 12px', height: 36, whiteSpace: 'nowrap' }}
          >
            {daChep ? <Check size={14} /> : <Copy size={14} />}
            {daChep ? 'Đã chép' : 'Chép link'}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="m3-nut-vien"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, padding: 0 }}
            title="Mở màn hình điều khiển trên tab mới"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  )
}
