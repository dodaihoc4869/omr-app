// KHUNG BÀI BỔ SUNG CHỜ DUYỆT — màn Ca thi của thầy (01/10). Không có bài nào thì không hiện gì.
// Nhận ⇒ máy chủ gộp phần em làm thêm vào bài rồi chấm lại cả ca bằng luật hiện hành. Bỏ ⇒ giữ nguyên điểm.
import { useCallback, useEffect, useState } from 'react'
import { loadTeacherSecret } from '../lib/exam-db'
import { layBaiBoSung, xuLyBaiBoSung, type BaiBoSung } from '../lib/bai-bo-sung'
import { OThongBao } from './DesignSystem'

const gio = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', hour12: false })
}

export default function KhungBaiBoSung({ maCa, secret }: { maCa?: string; secret?: string }) {
  const [ds, setDs] = useState<BaiBoSung[]>([])
  const [dang, setDang] = useState('')
  const [bao, setBao] = useState('')
  const matKhau = useCallback(async () => (secret || (await loadTeacherSecret()) || '').trim(), [secret])
  const tai = useCallback(async () => {
    try {
      const m = await matKhau()
      if (m) setDs(await layBaiBoSung(m, maCa))
    } catch {
      /* máy chủ chưa có bảng / mất mạng: im lặng, lần sau tải lại */
    }
  }, [maCa, matKhau])
  // Tải khi mở màn / đổi ca (không chạy nhịp nền — bảng nhịp-bảng giữ mọi vòng setInterval có xếp loại).
  useEffect(() => {
    void tai()
  }, [tai])

  if (ds.length === 0 && !bao) return null
  const xuLy = async (b: BaiBoSung, nhan: boolean) => {
    setDang(b.khoa)
    setBao('')
    try {
      const r = await xuLyBaiBoSung(await matKhau(), b.khoa, nhan)
      setBao(nhan ? (r.chamLai ? `Đã nhận bài bổ sung của ${b.hoTen || b.sbd} và chấm lại ca ${b.tenCa || b.maCa}.` : `Đã nhận bài bổ sung của ${b.hoTen || b.sbd}. Điểm sẽ chấm khi ca đóng.`) : `Đã bỏ bài bổ sung của ${b.hoTen || b.sbd}, điểm giữ nguyên.`)
      setDs((x) => x.filter((y) => y.khoa !== b.khoa))
    } catch (e) {
      setBao(`Chưa xử lý được: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setDang('')
    }
  }
  return (
    <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
      {ds.length > 0 && (
        <OThongBao tone="cam">
          {ds.length} bài bổ sung chờ thầy duyệt: máy em còn giữ câu làm thêm mà máy chủ đã chốt bài trước khi nhận được. Nhận thì điểm được chấm lại; Bỏ thì giữ điểm cũ.
        </OThongBao>
      )}
      {ds.map((b) => (
        <div key={b.khoa} className="flex items-center flex-wrap" style={{ gap: 'var(--k2)', padding: 'var(--k3)', borderRadius: 'var(--bo-1)', background: 'var(--the-2)' }}>
          <div className="flex-1" style={{ minWidth: 180 }}>
            <div className="font-bold">{b.hoTen || 'Học sinh'} · SBD {b.sbd}</div>
            <div style={{ color: 'var(--nhat)', fontSize: 'var(--cx-6, 13px)' }}>
              Ca {b.tenCa || b.maCa} · {b.soCauMoi} câu làm thêm · gửi lúc {gio(b.guiLuc)}{b.nopLuc ? ` · máy chủ chốt lúc ${gio(b.nopLuc)}` : ''}
            </div>
          </div>
          <button type="button" disabled={!!dang} onClick={() => void xuLy(b, true)} className="tap-target font-bold" style={{ padding: '0 var(--k4)', height: 44, borderRadius: 'var(--bo-1)', background: 'var(--xanh)', color: 'var(--muc-nguoc)' }}>
            {dang === b.khoa ? '…' : 'Nhận'}
          </button>
          <button type="button" disabled={!!dang} onClick={() => void xuLy(b, false)} className="tap-target font-bold" style={{ padding: '0 var(--k4)', height: 44, borderRadius: 'var(--bo-1)', border: '1px solid var(--vien)' }}>
            Bỏ
          </button>
        </div>
      ))}
      {bao && <OThongBao tone="xanh">{bao}</OThongBao>}
    </div>
  )
}
