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
  thieu_hoc_lieu: 'Cần bổ sung bài luyện',
  can_thay: 'Cùng thầy gỡ tiếp',
  tam_khoa: 'Đang giữ tiến độ',
  cau_thay_doi: 'Cần cập nhật học liệu',
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
  return (
    <section className="tlu-khoi">
      <h2 className="tlu-muc">Những câu mình đang gỡ</h2>
      <p className="tlu-ghi">
        Tiếp đúng chỗ đang vướng, giữ những bước em đã hiểu.
      </p>
      {ds.slice(0, 12).map((x, i) => (
        <button
          type="button"
          className="tlu-nut-phu"
          key={x.qid}
          onClick={() => setQid(x.qid)}
        >
          Câu {i + 1} · {nhan[x.trangThai] ?? 'Chữa tiếp'}
          {x.denHan
            ? ` · ${new Date(x.denHan).toLocaleDateString('vi-VN')}`
            : ''}
        </button>
      ))}
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
