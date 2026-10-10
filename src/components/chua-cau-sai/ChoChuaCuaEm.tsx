import { lazy, Suspense, useEffect, useState } from 'react'
import KhungChua from './KhungChua'
import { apiDanhSachChua } from '../../lib/chua-cau-sai-api'
const Man = lazy(() => import('./ManChuaCauSai'))
const nhan: Record<string, string> = {
  can_chan_doan: 'Tìm chỗ vướng',
  dang_chua_buoc: 'Tiếp bước đang gỡ',
  dang_ghep_bai: 'Thử ghép cả bài',
  cho_gap_lai_2: 'Hẹn tự kiểm bản mới',
  dang_kiem_chung: 'Tự làm bản mới',
  thieu_hoc_lieu: 'Đang chuẩn bị bài luyện',
  can_thay: 'Cùng thầy gỡ tiếp',
  tam_khoa: 'Đang giữ tiến độ',
  cau_thay_doi: 'Cần cập nhật học liệu',
}

function IconLoTrinh() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H8a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3h8" />
      <path d="M16 19l3 3-3 3" />
    </svg>
  )
}

function IconMo() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m7.5 5 5 5-5 5" />
    </svg>
  )
}

const ngayHan = (giaTri?: string) => {
  if (!giaTri) return ''
  const ngay = new Date(giaTri)
  if (Number.isNaN(ngay.getTime())) return ''
  const phan = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).formatToParts(ngay)
  const ngayTrongThang = phan.find((x) => x.type === 'day')?.value
  const thang = phan.find((x) => x.type === 'month')?.value
  return ngayTrongThang && thang ? `Hẹn ${ngayTrongThang}/${thang}` : ''
}

export default function ChoChuaCuaEm({ token }: { token: string }) {
  const [ds, setDs] = useState<
      { qid: string; trangThai: string; denHan?: string }[]
    >([]),
    [qid, setQid] = useState<string | null>(null),
    [lan, setLan] = useState(0)
  useEffect(() => {
    let song = true
    void apiDanhSachChua(token).then((r) => {
      if (song) setDs(r.filter((x) => x.trangThai !== 'da_tu_sua'))
    })
    return () => {
      song = false
    }
  }, [token, lan])
  if (!ds.length) return null
  const hienThi = ds.slice(0, 12)
  return (
    <section className="tlu-khoi tlu-cho-chua" aria-labelledby="tlu-cho-chua-tieu-de">
      <div className="tlu-cho-chua-dau">
        <span className="tlu-cho-chua-bieu-tuong"><IconLoTrinh /></span>
        <span className="tlu-cho-chua-gioi-thieu">
          <h2 className="tlu-muc" id="tlu-cho-chua-tieu-de">Câu cần gỡ tiếp</h2>
          <p className="tlu-ghi">Chọn một câu để tiếp tục từ đúng bước em đang dở.</p>
        </span>
        <span className="tlu-cho-chua-tom-tat" aria-label={`${hienThi.length} câu đang chờ`}>
          <strong className="tlu-tab">{hienThi.length}</strong>
          <span className="tlu-cho-chua-tom-tat-chu">
            <span>câu</span>
            <span>đang chờ</span>
          </span>
        </span>
      </div>
      <div className="tlu-cho-chua-luoi">
        {hienThi.map((x, i) => {
          const hen = ngayHan(x.denHan)
          const trangThai = nhan[x.trangThai] ?? 'Chữa tiếp'
          return (
            <button
              type="button"
              className="tlu-cho-chua-the"
              data-trang-thai={x.trangThai}
              aria-current={qid === x.qid ? 'true' : undefined}
              aria-label={`Câu ${i + 1}: ${trangThai}${hen ? `. ${hen}` : ''}`}
              key={x.qid}
              onClick={() => setQid(x.qid)}
            >
              <span className="tlu-cho-chua-so tlu-tab">{String(i + 1).padStart(2, '0')}</span>
              <span className="tlu-cho-chua-noi-dung">
                <strong>Câu {i + 1}</strong>
                <span>{trangThai}</span>
              </span>
              {hen && <span className="tlu-cho-chua-hen">{hen}</span>}
              <span className="tlu-cho-chua-mo"><IconMo /></span>
            </button>
          )
        })}
      </div>
      {qid && (
        <KhungChua
          onDong={() => {
            setQid(null)
            setLan((x) => x + 1)
          }}
        >
          <Suspense fallback={<p role="status">Đang mở câu chữa…</p>}>
            <Man
              token={token}
              qid={qid}
              onVe={() => {
                setQid(null)
                setLan((x) => x + 1)
              }}
            />
          </Suspense>
        </KhungChua>
      )}
    </section>
  )
}
