// CÂU HỎI CỦA EM — HOIBAITHAY.md mục 4C, 4D, 4E.
//
// Hai lối nhìn cùng một dữ liệu, đúng như mục 1.1:
//
//   · DANH SÁCH THEO EM là LỐI VÀO — thầy nhìn ra ai đang vướng.
//   · TRANG TỔNG HỢP là BẢN ĐỂ CHỮA — gộp theo CÂU, xếp giảm dần theo số em
//     hỏi, nên câu phải chữa trên bảng đứng đầu.
//
// Nội dung câu dựng TẠI MÁY THẦY từ `ca_<mã>_bank.json` đã có; máy chủ chỉ giữ
// mã câu (mục 2.1). Chưa có bản đề CÓ đáp án trên máy này thì KHÔNG dựng được
// trang tổng hợp — nói thẳng thế, không dựng trang thiếu lời giải rồi để thầy
// tưởng kho đề hỏng.
import { useMemo, useState } from 'react'
import { Check, Loader2, MessageCircleQuestion } from 'lucide-react'
import type { TeacherExamSource } from '../data/examContent'
import { NutChinh, OThongBao, TheNoiDung } from './DesignSystem'
import KhungXemPhieu from './KhungXemPhieu'
import { cauLuyenTuNguon } from '../lib/bai-tap-pdf'
import { danhDauDaChua, danhSachCauHoi } from '../lib/exam-api'
import { demCauHoi, dungTrangTongHop, type CauHoiCuaEm } from '../lib/hoi-bai'

export interface KhoiCauHoiEmProps {
  scriptUrl: string
  secret: string
  maCa: string
  tenCa: string
  lop: string
  /** Bản đề CÓ đáp án của ca. Không có thì chỉ xem được danh sách theo em. */
  banks: TeacherExamSource[] | null
  showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void
}

const NHAN: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }

function gio(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export default function KhoiCauHoiEm({ scriptUrl, secret, maCa, tenCa, lop, banks, showToast }: KhoiCauHoiEmProps) {
  const [dong, setDong] = useState<CauHoiCuaEm[] | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [html, setHtml] = useState('')
  const [dangChua, setDangChua] = useState('')

  const deCuaCa = useMemo(() => (banks && banks.length ? cauLuyenTuNguon(banks) : []), [banks])
  const dem = useMemo(() => (dong ? demCauHoi(dong) : null), [dong])

  const tai = async () => {
    setDangTai(true)
    setLoi('')
    try {
      setDong(await danhSachCauHoi(scriptUrl, secret, maCa))
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không lấy được câu hỏi')
    } finally {
      setDangTai(false)
    }
  }

  const moTongHop = () => {
    if (!dong) return
    const t = dungTrangTongHop({ tenCa: tenCa || `Ca ${maCa}`, lop, ngay: new Date() }, dong, deCuaCa)
    // KHÔNG dựng trang rỗng (phép kiểm 12): không câu nào khớp đề thì nói ra.
    if (!t) return showToast('Không có câu nào của em còn trong đề của ca này', 'warn')
    setHtml(t)
  }

  const danhDau = async (sbd: string) => {
    setDangChua(sbd || 'ca')
    try {
      await danhDauDaChua(scriptUrl, secret, maCa, sbd, true)
      setDong((cu) => (cu ? cu.map((d) => (!sbd || d.sbd === sbd ? { ...d, daChua: true } : d)) : cu))
      showToast(sbd ? 'Đã đánh dấu chữa xong cho em này' : 'Đã đánh dấu chữa xong cả ca', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không đánh dấu được', 'error')
    } finally {
      setDangChua('')
    }
  }

  const chuaChua = dong ? dong.filter((d) => !d.daChua) : []
  const daChua = dong ? dong.filter((d) => d.daChua) : []

  const theEm = (d: CauHoiCuaEm) => (
    <div key={d.sbd} className="flex items-start justify-between" style={{ gap: 'var(--k3)', padding: 'var(--k2) 0', borderTop: '1px solid var(--vien)' }}>
      <div className="min-w-0">
        <div className="font-bold" style={{ fontSize: 'var(--cx-2)' }}>
          {d.hoTen || d.sbd}
        </div>
        <div style={NHAN}>
          hỏi {d.qids.length} câu{d.guiLuc ? ` · ${gio(d.guiLuc)}` : ''}
        </div>
        {d.ghiChu && <div style={{ ...NHAN, color: 'var(--muc-2)', fontStyle: 'italic' }}>“{d.ghiChu}”</div>}
      </div>
      {!d.daChua && (
        <button
          type="button"
          onClick={() => void danhDau(d.sbd)}
          disabled={dangChua === d.sbd}
          className="tap-target shrink-0 flex items-center"
          aria-label={`Đánh dấu đã chữa cho ${d.hoTen || d.sbd}`}
          style={{ gap: 4, minHeight: 36, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', border: '1px solid var(--vien-dam)', background: 'none', color: 'var(--nhat)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
        >
          <Check size={14} /> Đã chữa
        </button>
      )}
    </div>
  )

  return (
    <TheNoiDung>
      <div className="flex items-center" style={{ gap: 'var(--k2)', marginBottom: 'var(--k3)' }}>
        <span style={{ color: 'var(--nhat)' }}>
          <MessageCircleQuestion size={18} />
        </span>
        <span className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)' }}>
          Câu hỏi của em
        </span>
        {dem && dem.chuaChua > 0 && (
          <span className="font-bold" style={{ marginLeft: 'auto', padding: '2px 10px', borderRadius: 'var(--bo-tron)', background: 'var(--do)', color: 'var(--muc-nguoc)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}>
            {dem.chuaChua} chưa chữa
          </span>
        )}
      </div>

      {dem ? (
        <div style={{ ...NHAN, marginBottom: 'var(--k2)' }}>
          {dem.soEm} em hỏi · {dem.soCau} câu
        </div>
      ) : (
        <div style={{ ...NHAN, marginBottom: 'var(--k2)' }}>Em nộp bài xong tick câu chưa hiểu rồi gửi. Bấm để xem.</div>
      )}

      {loi && <OThongBao tone="cam">{loi}</OThongBao>}

      {dong && dong.length === 0 && <OThongBao tone="xanh">Chưa em nào gửi câu hỏi cho ca này.</OThongBao>}

      {chuaChua.length > 0 && <div>{chuaChua.map(theEm)}</div>}

      {daChua.length > 0 && (
        <div style={{ marginTop: 'var(--k3)' }}>
          <div style={{ ...NHAN, fontWeight: 700 }}>Đã chữa</div>
          <div style={{ opacity: 0.62 }}>{daChua.map(theEm)}</div>
        </div>
      )}

      <div className="flex flex-wrap" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
        <NutChinh variant="phu" onClick={() => void tai()} disabled={dangTai}>
          {dangTai ? (
            <span className="inline-flex items-center" style={{ gap: 6 }}>
              <Loader2 size={16} className="animate-spin" /> Đang tải…
            </span>
          ) : dong ? (
            'Tải lại'
          ) : (
            'Xem câu hỏi'
          )}
        </NutChinh>
        {/* Không em nào hỏi thì KHÔNG hiện nút Tổng hợp (phép kiểm 12). */}
        {dong && dong.length > 0 && deCuaCa.length > 0 && <NutChinh onClick={moTongHop}>Tổng hợp câu hỏi</NutChinh>}
        {dong && dong.length > 0 && chuaChua.length > 0 && (
          <NutChinh variant="phu" onClick={() => void danhDau('')} disabled={dangChua === 'ca'}>
            Đánh dấu đã chữa cả ca
          </NutChinh>
        )}
      </div>

      {dong && dong.length > 0 && deCuaCa.length === 0 && (
        <div style={{ ...NHAN, marginTop: 'var(--k2)' }}>Máy này chưa có bản đề CÓ đáp án của ca nên chưa dựng được trang tổng hợp. Mở lại ca ở máy đã tạo, hoặc bấm đồng bộ đề.</div>
      )}

      {html && <KhungXemPhieu html={html} ten={`Câu hỏi của em · ${tenCa || maCa}`} dong={() => setHtml('')} />}
    </TheNoiDung>
  )
}
