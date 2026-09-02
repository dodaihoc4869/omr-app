// LỊCH SỬ CA THI (QUANLYCATHI.md mục 2) — mọi ca nằm trên Google Sheet, máy
// nào của thầy mở cũng thấy đủ và giống nhau. Mỗi hàng: tên ca, mã ca, lớp,
// ngày, tỉ lệ đã nộp, nhãn trạng thái. Chạm → Chi tiết ca (ExamMonitorScreen).
// Chỉ dùng token + 6 thành phần thiết kế; số liệu dùng --sans.
import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import { danhSachCa, type CaTomTat } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { gioMayChu } from '../lib/gio-may-chu'
import { useAppStore } from '../store/appStore'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const O_NHAP: React.CSSProperties = {
  height: 48,
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4) 0 44px',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--sans)',
  fontSize: 'var(--cx-2)',
  color: 'var(--muc)',
  outline: 'none',
  width: '100%',
}

/** Trạng thái hiển thị của ca theo mốc thời gian máy chủ + số đã nộp. */
export function trangThaiCa(ca: Pick<CaTomTat, 'trangThai' | 'batDau' | 'hetHanVao' | 'daVao' | 'daNop'>, nowMs: number): { ten: string; tone: 'xanh' | 'cam' | 'do' | 'tim' | 'xam' } {
  if (ca.trangThai === 'dong') return { ten: 'Đã đóng', tone: 'xam' }
  const batDau = ca.batDau ? new Date(ca.batDau).getTime() : NaN
  if (Number.isFinite(batDau) && nowMs < batDau) return { ten: 'Chưa mở', tone: 'xam' }
  const hetHan = ca.hetHanVao ? new Date(ca.hetHanVao).getTime() : NaN
  if (Number.isFinite(hetHan) && nowMs > hetHan) {
    if (ca.daVao > 0 && ca.daNop >= ca.daVao) return { ten: 'Xong', tone: 'xanh' }
    return { ten: ca.daVao > ca.daNop ? 'Còn em đang làm' : 'Hết giờ vào', tone: 'cam' }
  }
  return { ten: 'Đang mở', tone: 'tim' }
}

function ngayGio(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
}

export default function LichSuCaScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)

  const [dsCa, setDsCa] = useState<CaTomTat[] | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [timKiem, setTimKiem] = useState('')
  const [lopLoc, setLopLoc] = useState('')

  const tai = async () => {
    setDangTai(true)
    setLoi('')
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim()) throw new Error('Chưa cấu hình link Apps Script — vào Ngân hàng câu hỏi → Cấu hình')
      if (!mat.trim()) throw new Error('Chưa nhập mã bí mật — vào Ngân hàng câu hỏi → Cấu hình')
      setDsCa(await danhSachCa(url.trim(), mat.trim()))
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Lỗi không rõ')
      if (dsCa === null) setDsCa([])
    } finally {
      setDangTai(false)
    }
  }

  useEffect(() => {
    tai()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dsLop = useMemo(() => Array.from(new Set((dsCa ?? []).map((c) => c.lop.trim()).filter(Boolean))).sort(), [dsCa])
  const dsLoc = useMemo(() => {
    const q = timKiem.trim().toLowerCase()
    return (dsCa ?? []).filter((c) => (!lopLoc || c.lop.trim() === lopLoc) && (!q || c.maCa.includes(q) || c.tenCa.toLowerCase().includes(q) || c.lop.toLowerCase().includes(q)))
  }, [dsCa, timKiem, lopLoc])

  const now = gioMayChu()

  return (
    <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <div className="flex items-center justify-between">
        <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
          Lịch sử ca thi
        </h1>
        <button onClick={() => setScreen('examhub')} style={NHAN_NHO} className="tap-target">
          ← Kiểm tra
        </button>
      </div>

      <TheNoiDung>
        <div className="flex items-center" style={{ gap: 'var(--k3)', marginBottom: 'var(--k3)' }}>
          <div className="relative flex-1">
            <Search size={18} className="absolute" style={{ left: 14, top: 15, color: 'var(--mo)' }} />
            <input style={O_NHAP} placeholder="Tìm mã ca, tên ca, lớp…" value={timKiem} onChange={(e) => setTimKiem(e.target.value)} inputMode="search" aria-label="Tìm ca" />
          </div>
          <button
            type="button"
            onClick={tai}
            disabled={dangTai}
            className="tap-target shrink-0 flex items-center justify-center"
            style={{ width: 48, height: 48, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)' }}
            aria-label="Tải lại"
            title="Tải lại"
          >
            <RefreshCw size={18} className={dangTai ? 'animate-spin' : ''} />
          </button>
        </div>
        {dsLop.length > 1 && (
          <div className="flex flex-wrap" style={{ gap: 'var(--k2)', marginBottom: 'var(--k3)' }} role="group" aria-label="Lọc theo lớp">
            {['', ...dsLop].map((l) => {
              const chon = lopLoc === l
              return (
                <button
                  key={l || '__tat_ca'}
                  type="button"
                  onClick={() => setLopLoc(l)}
                  className="tap-target font-bold"
                  style={{
                    ...SO,
                    fontSize: 'var(--cx-1)',
                    minHeight: 36,
                    padding: '0 var(--k3)',
                    borderRadius: 'var(--bo-tron)',
                    background: chon ? 'var(--muc)' : 'var(--the-2)',
                    color: chon ? 'var(--muc-nguoc)' : 'var(--nhat)',
                  }}
                >
                  {l || 'Tất cả'}
                </button>
              )
            })}
          </div>
        )}

        {loi && <OThongBao tone="do">{loi}</OThongBao>}
        {dsCa === null ? (
          <div style={{ ...NHAN_NHO, padding: 'var(--k4) 0' }}>Đang tải danh sách ca từ Google Sheet…</div>
        ) : dsLoc.length === 0 ? (
          <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
            <div style={{ ...NHAN_NHO, padding: 'var(--k2) 0' }}>{dsCa.length === 0 ? 'Chưa có ca nào.' : 'Không có ca khớp bộ lọc.'}</div>
            {dsCa.length === 0 && (
              <NutChinh variant="phu" onClick={() => setScreen('examsetup')}>
                Mở ca kiểm tra đầu tiên
              </NutChinh>
            )}
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
            {dsLoc.map((c) => {
              const tt = trangThaiCa(c, now)
              return (
                <Hang key={c.maCa} onClick={() => moChiTietCa(c.maCa)} data-trang-thai={tt.ten}>
                  <span className="flex-1 min-w-0">
                    <div className="font-bold truncate" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                      {c.tenCa || `Ca ${c.maCa}`}
                    </div>
                    <div style={NHAN_NHO}>
                      <span style={SO}>{c.maCa}</span>
                      {c.lop ? ` · Lớp ${c.lop}` : ''} · <span style={SO}>{ngayGio(c.batDau || c.moLuc)}</span> · {c.thoiGianPhut} phút
                    </div>
                  </span>
                  <span className="shrink-0 flex flex-col items-end" style={{ gap: 4 }}>
                    <span className="font-bold" style={{ ...SO, fontSize: 'var(--cx-2)' }}>
                      {c.daNop}/{c.daVao} nộp
                    </span>
                    <span className="flex items-center" style={{ gap: 4 }}>
                      {c.canhBao > 0 && <Nhan tone="cam">{c.canhBao} cảnh báo</Nhan>}
                      <Nhan tone={tt.tone}>{tt.ten}</Nhan>
                    </span>
                  </span>
                </Hang>
              )
            })}
          </div>
        )}
      </TheNoiDung>
    </div>
  )
}
