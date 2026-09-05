// HỌC SINH HỎI — màn riêng, vào từ ô ngoài màn chính (thầy chốt 06/09).
//
// Trước đó câu hỏi của em nằm lẫn trong Chi tiết ca: thầy phải nhớ ca nào rồi
// mở đúng ca đó mới thấy. Nay một ô ngoài màn chính là thấy NGAY ca nào đang
// có em chờ chữa, chạm vào ra đúng trang đã thiết kế.
//
// MỘT LỆNH GỌI cho cả màn: `danhSachCauHoi` với mã ca rỗng trả mọi dòng, rồi
// gom theo ca tại máy. Gọi từng ca một là ba chục lệnh cho một lần mở màn —
// đi ngược hẳn việc giảm tải vừa làm.
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, MessageCircleQuestion } from 'lucide-react'
import type { TeacherExamSource } from '../data/examContent'
import { NutChinh, OThongBao, TheNoiDung } from '../components/DesignSystem'
import KhoiCauHoiEm from '../components/KhoiCauHoiEm'
import { danhSachCauHoi } from '../lib/exam-api'
import { loadScriptUrl, loadSessionTeacherBank, loadTeacherSecret } from '../lib/exam-db'
import { gomTheoCa, type CaCoCauHoi } from '../lib/hoi-bai'
import { useAppStore } from '../store/appStore'

const NHAN: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }

function ngayGio(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
}

export default function CauHoiScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const [url, setUrl] = useState('')
  const [mat, setMat] = useState('')
  const [ds, setDs] = useState<CaCoCauHoi[] | null>(null)
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const [mo, setMo] = useState<CaCoCauHoi | null>(null)
  const [banks, setBanks] = useState<TeacherExamSource[] | null>(null)

  useEffect(() => {
    let con = true
    void (async () => {
      const [u, m] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!con) return
      setUrl(u || '')
      setMat(m || '')
      if (!u || !m) return setLoi('Chưa có link Apps Script hoặc mã bí mật. Vào Ngân hàng câu hỏi → Cấu hình để nhập.')
      setDang(true)
      try {
        const items = await danhSachCauHoi(u.trim(), m.trim(), '')
        if (con) setDs(gomTheoCa(items))
      } catch (e) {
        if (con) setLoi(e instanceof Error ? e.message : 'Không lấy được câu hỏi')
      } finally {
        if (con) setDang(false)
      }
    })()
    return () => {
      con = false
    }
  }, [])

  // Bản đề CÓ đáp án của ca — cần để dựng trang tổng hợp. Ca mở ở máy khác thì
  // máy này không có, và khối chi tiết nói thẳng điều đó chứ không dựng trang
  // thiếu lời giải.
  useEffect(() => {
    if (!mo) return setBanks(null)
    let con = true
    void (async () => {
      const b = await loadSessionTeacherBank(mo.maCa)
      if (con) setBanks(b ?? null)
    })()
    return () => {
      con = false
    }
  }, [mo])

  const tong = useMemo(() => {
    if (!ds) return null
    return { soCa: ds.length, chuaChua: ds.reduce((n, c) => n + c.chuaChua, 0) }
  }, [ds])

  if (mo) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)' }}>
        <button
          type="button"
          onClick={() => setMo(null)}
          className="tap-target inline-flex items-center self-start font-bold"
          style={{ gap: 4, minHeight: 44, padding: '0 var(--k3) 0 var(--k2)', borderRadius: 'var(--bo-tron)', border: 'none', background: 'var(--the)', color: 'var(--muc)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', boxShadow: 'var(--bong-1)' }}
        >
          <ChevronLeft size={18} /> Mọi ca
        </button>
        <div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--mo)', letterSpacing: '.16em', textTransform: 'uppercase' }}>Học sinh hỏi</div>
          <h1 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-5)', lineHeight: 1.15, marginTop: 2 }}>
            {mo.tenCa || `Ca ${mo.maCa}`}
          </h1>
        </div>
        <KhoiCauHoiEm scriptUrl={url.trim()} secret={mat.trim()} maCa={mo.maCa} tenCa={mo.tenCa} lop="" banks={banks} showToast={showToast} moSan />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)' }}>
      <header style={{ paddingTop: 'var(--k2)' }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--mo)', letterSpacing: '.16em', textTransform: 'uppercase' }}>Đỗ Đại Học</div>
        <h1 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-5)', lineHeight: 1.15, marginTop: 2 }}>
          Học sinh hỏi
        </h1>
        {tong && (
          <div style={{ ...NHAN, marginTop: 4 }}>
            {tong.soCa} ca có câu hỏi{tong.chuaChua > 0 ? ` · ${tong.chuaChua} em chờ Thầy chữa` : ' · đã chữa hết'}
          </div>
        )}
      </header>

      {loi && <OThongBao tone="cam">{loi}</OThongBao>}

      {dang && (
        <TheNoiDung>
          <div className="inline-flex items-center" style={{ gap: 8, ...NHAN }}>
            <Loader2 size={16} className="animate-spin" /> Đang lấy câu hỏi…
          </div>
        </TheNoiDung>
      )}

      {ds && ds.length === 0 && <OThongBao tone="xanh">Chưa em nào gửi câu hỏi. Em nộp bài xong bấm “Hỏi bài Thầy” là câu hỏi về đây.</OThongBao>}

      {ds?.map((c) => (
        <button key={c.maCa} type="button" onClick={() => setMo(c)} className="the-bam tap-target w-full text-left flex items-center">
          <span className="the-bam-icon shrink-0 flex items-center justify-center">
            <MessageCircleQuestion size={22} />
          </span>
          <span className="min-w-0" style={{ flex: '1 1 auto' }}>
            <span className="the-bam-ten font-bold">{c.tenCa || `Ca ${c.maCa}`}</span>
            <span className="the-bam-phu">
              {c.soEm} em hỏi · {c.soCau} câu{c.moiNhat ? ` · ${ngayGio(c.moiNhat)}` : ''}
            </span>
          </span>
          {c.chuaChua > 0 && (
            <span className="font-bold shrink-0" style={{ marginRight: 'var(--k2)', padding: '2px 10px', borderRadius: 'var(--bo-tron)', background: 'var(--do)', color: 'var(--muc-nguoc)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}>
              {c.chuaChua}
            </span>
          )}
          <ChevronRight size={18} className="the-bam-mui shrink-0" />
        </button>
      ))}

      {ds && ds.length > 0 && (
        <div style={NHAN}>Số đỏ là số em chưa được chữa. Chạm một ca để xem từng em hỏi câu nào, và dựng trang tổng hợp để chữa một lượt.</div>
      )}

      {!dang && !ds && !loi && (
        <NutChinh variant="phu" onClick={() => location.reload()}>
          Tải lại
        </NutChinh>
      )}
    </div>
  )
}
