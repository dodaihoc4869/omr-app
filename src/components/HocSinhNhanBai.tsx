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
  onAction: (sbd: string, action: 'reset' | 'thu-hoi' | 'cho-lam-lai') => void
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
      soCauCuaEm: null,
      soChang: null,
      loDaXong: null,
      soDungLoi: null,
      soCauLoi: null,
      diemLoi: null,
      soCauThuongSai: null,
      gianLan: false,
      xacSuatGianLan: 0,
      lyDoGianLan: '',
      diemThiDoiChieu: null,
    }))

  // Sắp xếp:
  // 1. Học sinh đã nộp trước học sinh chưa nộp
  // 2. Thời gian nộp mới nhất
  // 3. Số báo danh
  const found = [...all]
    .sort((a, b) => {
      const nopA = Number(Boolean(a.nopLuc))
      const nopB = Number(Boolean(b.nopLuc))
      if (nopA !== nopB) return nopB - nopA

      const timeA = Date.parse(a.nopLuc || '') || 0
      const timeB = Date.parse(b.nopLuc || '') || 0
      if (timeA !== timeB) return timeB - timeA

      return a.sbd.localeCompare(b.sbd, 'vi', { numeric: true })
    })
    .filter((e) => norm(`${e.sbd} ${e.hoTen}`).includes(norm(query.trim())))

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
          const diemBtvn =
            e.soCau && e.soCau > 0 && typeof e.soDung === 'number'
              ? ((e.soDung / e.soCau) * 10).toFixed(1)
              : null

          return (
            <article
              key={e.sbd}
              style={{
                padding: 16,
                border: '1px solid var(--vien)',
                borderRadius: 16,
                background: 'var(--the)',
                minWidth: 0,
                position: 'relative',
              }}
            >
              {/* Tiêu đề & Tên học sinh */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
                      color: 'var(--xanh)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    {e.hoTen || e.sbd}
                  </button>
                ) : (
                  <strong>{e.hoTen || e.sbd}</strong>
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
              </div>

              {/* Thông tin số câu đúng */}
              {e.nopLuc && (
                <p style={{ fontSize: 12, color: 'var(--nhat)', marginTop: 8, marginBottom: 4 }}>
                  {e.soDung}/{e.soCau} câu đúng{bai.caNhan ? ' (trên câu của em)' : ''} ({diemBtvn}/10) · {new Date(e.nopLuc).toLocaleString('vi-VN')}
                </p>
              )}
              {/* BÀI NÂNG ĐỠ: bộ câu riêng, chặng, so lớp CHỈ trên lõi — toàn SỐ ĐẾM, không xếp hạng em với em. */}
              {bai.caNhan && (
                <p className="bn-theo-doi-em" data-khoi="nang-do">
                  {e.soCauCuaEm == null ? (
                    <span>Chưa mở bài — bộ câu chưa chốt</span>
                  ) : (
                    <span>
                      Bộ của em: {e.soCauCuaEm} câu{e.soChang != null ? ` · chặng ${e.loDaXong ?? 0}/${e.soChang}` : ''}
                    </span>
                  )}
                  {e.soCauLoi != null && e.soCauLoi > 0 && typeof e.soDungLoi === 'number' && (
                    <span>
                      Lõi: {e.soDungLoi}/{e.soCauLoi}
                      {typeof e.diemLoi === 'number' ? ` (${e.diemLoi.toFixed(1)}/10)` : ''}
                    </span>
                  )}
                  {typeof e.soCauThuongSai === 'number' && e.soCauThuongSai > 0 && <span>Câu thưởng chưa đúng: {e.soCauThuongSai} (không tính vào điểm)</span>}
                </p>
              )}

              {/* Nút hành động */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {/* BÀI NÂNG ĐỠ KHÔNG tự cho làm lại (thầy chốt 21/09): chỉ em ĐÃ NỘP mới có nút "Cho làm lại", gọi lệnh riêng /btvn/cho-lam-lai (giữ bộ câu + hạn nộp, điểm cũ vào lịch sử). Quá hạn ⇒ máy chủ từ chối, nên nói trước để thầy gia hạn. Bài cũ: y như trước. */}
                {!bai.caNhan ? (
                  <button
                    disabled={busy}
                    onClick={() => onAction(e.sbd, 'reset')}
                    className="btn-google-outlined"
                    style={{ padding: '8px 12px', fontSize: 13 }}
                  >
                    Cho làm lại
                  </button>
                ) : e.nopLuc && !e.thuHoi ? (
                  bai.quaHan ? (
                    <span data-khoi="cho-lam-lai-qua-han" style={{ fontSize: 12, color: 'var(--nhat)', alignSelf: 'center' }}>
                      Quá hạn — gia hạn bài rồi mới cho làm lại
                    </span>
                  ) : (
                    <button
                      disabled={busy}
                      onClick={() => onAction(e.sbd, 'cho-lam-lai')}
                      className="btn-google-outlined"
                      style={{ padding: '8px 12px', fontSize: 13 }}
                    >
                      Cho làm lại
                    </button>
                  )
                ) : null}
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
