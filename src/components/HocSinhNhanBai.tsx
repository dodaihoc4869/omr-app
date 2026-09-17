import BaiNopBtvn from './BaiNopBtvn'
import { useState } from 'react'
import type { DongTheoDoiBtvn } from '../lib/btvn-may-chu-moi'

export default function HocSinhNhanBai({
  bai,
  busy,
  onAction,
  maTheoSbd,
}: {
  maTheoSbd?: Record<string, string>
  bai: DongTheoDoiBtvn
  busy: boolean
  onAction: (sbd: string, action: 'reset' | 'thu-hoi') => void
}) {
  const [xem, setXem] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const norm = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()

  const all =
    bai.hocSinh ||
    bai.chuaNop.map((e) => ({
      ...e,
      nopLuc: null,
      soDung: null,
      soCau: null,
      thuHoi: false,
      gianLan: false,
      xacSuatGianLan: 0,
      lyDoGianLan: '',
      diemThiDoiChieu: null,
    }))

  // Sắp xếp ưu tiên:
  // 1. Học sinh có dấu hiệu nghi vấn gian lận (sao đỏ) ĐẨY LÊN ĐẦU
  // 2. Học sinh đã nộp trước học sinh chưa nộp
  // 3. Thời gian nộp mới nhất
  // 4. Số báo danh
  const found = [...all]
    .sort((a, b) => {
      const isSuspectA = Boolean(a.gianLan || (a.xacSuatGianLan && a.xacSuatGianLan >= 70))
      const isSuspectB = Boolean(b.gianLan || (b.xacSuatGianLan && b.xacSuatGianLan >= 70))
      if (isSuspectA !== isSuspectB) return isSuspectB ? 1 : -1
      if (isSuspectA && isSuspectB) {
        return (b.xacSuatGianLan || 0) - (a.xacSuatGianLan || 0)
      }

      const nopA = Number(Boolean(a.nopLuc))
      const nopB = Number(Boolean(b.nopLuc))
      if (nopA !== nopB) return nopB - nopA

      const timeA = Date.parse(a.nopLuc || '') || 0
      const timeB = Date.parse(b.nopLuc || '') || 0
      if (timeA !== timeB) return timeB - timeA

      return a.sbd.localeCompare(b.sbd, 'vi', { numeric: true })
    })
    .filter((e) => norm(`${e.sbd} ${e.hoTen}`).includes(norm(query.trim())))

  const dsGianLan = found.filter((e) => e.gianLan || (e.xacSuatGianLan && e.xacSuatGianLan >= 70))

  return (
    <div style={{ marginTop: 16 }}>
      {xem && <BaiNopBtvn maBtvn={maTheoSbd?.[xem] || bai.maBtvn} sbd={xem} onClose={() => setXem(null)} />}

      <input
        aria-label={`Tìm học sinh ${bai.maBtvn}`}
        placeholder="Tìm tên hoặc số báo danh…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 14px',
          border: '1px solid var(--vien-dam)',
          borderRadius: 12,
          background: 'var(--the)',
          color: 'var(--muc)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0', flexWrap: 'wrap', gap: 6 }}>
        <p style={{ color: 'var(--nhat)', fontSize: 13, margin: 0 }}>
          Hiển thị {found.length}/{all.length} học sinh
        </p>
        {dsGianLan.length > 0 && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#d93025',
              background: 'rgba(217, 48, 37, 0.08)',
              border: '1px solid rgba(217, 48, 37, 0.3)',
              borderRadius: 8,
              padding: '2px 8px',
            }}
          >
            ⭐ Có {dsGianLan.length} học sinh nghi vấn gian lận (đã đẩy lên đầu)
          </span>
        )}
      </div>

      <div
        role="region"
        aria-label="Học sinh nhận bài"
        tabIndex={0}
        style={{
          maxHeight: 450,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))',
          gap: 10,
          padding: 3,
        }}
      >
        {found.map((e) => {
          const isSuspect = Boolean(e.gianLan || (e.xacSuatGianLan && e.xacSuatGianLan >= 70))
          const diemBtvn =
            e.soCau && e.soCau > 0 && typeof e.soDung === 'number'
              ? ((e.soDung / e.soCau) * 10).toFixed(1)
              : null

          return (
            <article
              key={e.sbd}
              style={{
                padding: 16,
                border: isSuspect ? '2px solid #d93025' : '1px solid var(--vien)',
                borderRadius: 16,
                background: isSuspect ? 'rgba(217, 48, 37, 0.04)' : 'var(--the)',
                minWidth: 0,
                position: 'relative',
                boxShadow: isSuspect ? '0 2px 8px rgba(217, 48, 37, 0.12)' : 'none',
              }}
            >
              {/* Tiêu đề & Tên học sinh (Gắn dấu sao đỏ nếu nghi vấn) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {isSuspect && (
                  <span
                    title="Nghi vấn gian lận dựa trên đối chiếu ca thi thật và tương quan bài nộp"
                    style={{
                      fontSize: 16,
                      filter: 'drop-shadow(0 0 3px rgba(217,48,37,0.5))',
                      cursor: 'help',
                    }}
                  >
                    ⭐
                  </span>
                )}
                {e.nopLuc ? (
                  <button
                    onClick={() => setXem(e.sbd)}
                    aria-label={`Xem bài đã nộp của ${e.hoTen || e.sbd}`}
                    style={{
                      display: 'inline-block',
                      overflowWrap: 'anywhere',
                      background: 'none',
                      border: 0,
                      padding: 0,
                      textAlign: 'left',
                      font: 'inherit',
                      fontWeight: 700,
                      color: isSuspect ? '#d93025' : 'var(--xanh)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    {e.hoTen || e.sbd}
                  </button>
                ) : (
                  <strong style={{ color: isSuspect ? '#d93025' : 'inherit' }}>{e.hoTen || e.sbd}</strong>
                )}
              </div>

              <p style={{ fontSize: 13, color: 'var(--nhat)', margin: '4px 0 10px' }}>SBD {e.sbd}</p>

              {/* Badges trạng thái */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    background: e.thuHoi ? 'var(--the-2)' : e.nopLuc ? 'var(--xanh-nen)' : 'var(--vang-diu-nen)',
                    color: e.thuHoi ? 'var(--nhat)' : e.nopLuc ? 'var(--xanh)' : 'var(--vang-diu)',
                  }}
                >
                  {e.thuHoi ? 'Đã thu hồi' : e.nopLuc ? 'Đã nộp' : 'Chưa nộp'}
                </span>

                {isSuspect && (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      background: '#fce8e6',
                      color: '#c5221f',
                      border: '1px solid #fad2cf',
                    }}
                  >
                    ⭐ Nghi vấn {e.xacSuatGianLan}%
                  </span>
                )}
              </div>

              {/* Thông tin số câu đúng */}
              {e.nopLuc && (
                <p style={{ fontSize: 12, color: 'var(--nhat)', marginTop: 8, marginBottom: 4 }}>
                  {e.soDung}/{e.soCau} câu đúng ({diemBtvn}/10) · {new Date(e.nopLuc).toLocaleString('vi-VN')}
                </p>
              )}

              {/* Khối cảnh báo đối chiếu ca thi thật (nếu có nghi vấn) */}
              {isSuspect && e.lyDoGianLan && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: 'rgba(217, 48, 37, 0.07)',
                    border: '1px solid rgba(217, 48, 37, 0.25)',
                    fontSize: 11,
                    lineHeight: 1.4,
                    color: '#a50e0e',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>⚠️ Đối chiếu ca thi:</span>
                  </div>
                  <div>{e.lyDoGianLan}</div>
                </div>
              )}

              {/* Nút hành động */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <button
                  disabled={busy}
                  onClick={() => onAction(e.sbd, 'reset')}
                  className="btn-google-outlined"
                  style={{ padding: '8px 12px', fontSize: 13 }}
                >
                  Cho làm lại
                </button>
                <button
                  disabled={busy || e.thuHoi}
                  onClick={() => onAction(e.sbd, 'thu-hoi')}
                  className="btn-google-outlined"
                  style={{ padding: '8px 12px', fontSize: 13, color: 'var(--do)' }}
                >
                  Thu hồi
                </button>
              </div>
            </article>
          )
        })}
        {!found.length && <p style={{ color: 'var(--nhat)', padding: 16 }}>Không tìm thấy học sinh.</p>}
      </div>
    </div>
  )
}
