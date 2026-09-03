// LỊCH SỬ CA THI (QUANLYCATHI.md mục 2) — mọi ca nằm trên Google Sheet, máy
// nào của thầy mở cũng thấy đủ và giống nhau. Mỗi hàng: tên ca, mã ca, lớp,
// ngày, tỉ lệ đã nộp, nhãn trạng thái. Chạm → Chi tiết ca (ExamMonitorScreen).
// Bật "Chọn" → mỗi hàng thành ô tích, xoá được nhiều ca ngay tại màn này.
// Chỉ dùng token + 6 thành phần thiết kế; số liệu dùng --sans.
import { useEffect, useMemo, useState } from 'react'
import { CheckSquare, RefreshCw, Search, Square, Trash2 } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import { danhSachCa, xoaNhieuCa, type CaTomTat } from '../lib/exam-api'
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
const O_XAC_NHAN: React.CSSProperties = { ...O_NHAP, padding: '0 var(--k4)' }

/** Chữ thầy phải gõ để xác nhận xoá lô có bài làm của học sinh. */
export const CHU_XAC_NHAN = 'XOA'

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
  const setScreen = useAppStore((s) => s.setScreen)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)
  const showToast = useAppStore((s) => s.showToast)

  const [dsCa, setDsCa] = useState<CaTomTat[] | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [timKiem, setTimKiem] = useState('')
  const [lopLoc, setLopLoc] = useState('')
  // Chế độ tích chọn để xoá nhiều ca
  const [chonMode, setChonMode] = useState(false)
  const [daChon, setDaChon] = useState<string[]>([])
  const [hoiXoa, setHoiXoa] = useState(false)
  const [chuXacNhan, setChuXacNhan] = useState('')
  const [dangXoa, setDangXoa] = useState(false)

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

  // Chỉ tính trên danh sách ĐANG hiện — tích "Tất cả" không bao giờ chạm ca bị bộ lọc giấu đi.
  const chonTrongLoc = useMemo(() => dsLoc.filter((c) => daChon.includes(c.maCa)), [dsLoc, daChon])
  const tichHet = dsLoc.length > 0 && chonTrongLoc.length === dsLoc.length
  const soBaiLam = useMemo(() => chonTrongLoc.reduce((s, c) => s + c.daVao, 0), [chonTrongLoc])
  const canGoChu = soBaiLam > 0
  const chuaDuXacNhan = canGoChu && chuXacNhan.trim().toUpperCase() !== CHU_XAC_NHAN

  const bat = (maCa: string) => setDaChon((cu) => (cu.includes(maCa) ? cu.filter((m) => m !== maCa) : [...cu, maCa]))
  const thoatChon = () => {
    setChonMode(false)
    setDaChon([])
    setHoiXoa(false)
    setChuXacNhan('')
  }

  const handleXoa = async () => {
    const ds = chonTrongLoc.map((c) => c.maCa)
    if (ds.length === 0) return
    setDangXoa(true)
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      const kq = await xoaNhieuCa(url.trim(), mat.trim(), ds)
      if (kq.loi.length === 0) showToast(`Đã xoá ${kq.ok.length} ca`, 'success')
      else if (kq.ok.length === 0) showToast(`Không xoá được ca nào: ${kq.loi[0].loi}`, 'error')
      else showToast(`Xoá được ${kq.ok.length} ca, ${kq.loi.length} ca lỗi (${kq.loi.map((l) => l.maCa).join(', ')})`, 'warn')
      thoatChon()
      await tai()
    } catch (e) {
      showToast(`Không xoá được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    } finally {
      setDangXoa(false)
    }
  }

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
            onClick={() => (chonMode ? thoatChon() : setChonMode(true))}
            className="tap-target shrink-0 flex items-center justify-center"
            style={{ width: 48, height: 48, borderRadius: 'var(--bo-1)', background: chonMode ? 'var(--muc)' : 'var(--the-2)', color: chonMode ? 'var(--muc-nguoc)' : 'var(--muc)' }}
            aria-label={chonMode ? 'Thoát chế độ chọn' : 'Chọn ca để xoá'}
            aria-pressed={chonMode}
            title={chonMode ? 'Xong' : 'Chọn ca để xoá'}
          >
            <CheckSquare size={18} />
          </button>
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

        {chonMode && (
          <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)', marginBottom: 'var(--k3)' }}>
            <button
              type="button"
              onClick={() => setDaChon(tichHet ? [] : dsLoc.map((c) => c.maCa))}
              className="tap-target font-bold inline-flex items-center"
              style={{ ...SO, gap: 6, fontSize: 'var(--cx-1)', minHeight: 36, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', color: 'var(--muc)' }}
            >
              {tichHet ? <CheckSquare size={16} /> : <Square size={16} />}
              {tichHet ? 'Bỏ chọn tất cả' : `Chọn tất cả (${dsLoc.length})`}
            </button>
            <span className="flex-1" style={{ ...NHAN_NHO, ...SO }}>
              Đã chọn {chonTrongLoc.length}
            </span>
            <button
              type="button"
              onClick={() => setHoiXoa(true)}
              disabled={chonTrongLoc.length === 0}
              className="tap-target font-bold inline-flex items-center"
              style={{
                ...SO,
                gap: 6,
                fontSize: 'var(--cx-1)',
                minHeight: 36,
                padding: '0 var(--k3)',
                borderRadius: 'var(--bo-tron)',
                background: chonTrongLoc.length === 0 ? 'var(--the-2)' : 'var(--do-nen)',
                color: chonTrongLoc.length === 0 ? 'var(--mo)' : 'var(--do)',
              }}
            >
              <Trash2 size={16} /> Xoá {chonTrongLoc.length > 0 ? chonTrongLoc.length : ''}
            </button>
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
              const tich = daChon.includes(c.maCa)
              return (
                <Hang
                  key={c.maCa}
                  onClick={() => (chonMode ? bat(c.maCa) : moChiTietCa(c.maCa))}
                  selected={chonMode && tich}
                  data-trang-thai={tt.ten}
                  className="flex-col"
                  style={{ alignItems: 'stretch' }}
                >
                  <span className="flex items-start justify-between" style={{ gap: 'var(--k3)' }}>
                    {chonMode && (
                      <span className="shrink-0" style={{ color: tich ? 'var(--xanh)' : 'var(--mo)', marginTop: 2 }} aria-hidden="true">
                        {tich ? <CheckSquare size={20} /> : <Square size={20} />}
                      </span>
                    )}
                    <span className="flex-1 min-w-0">
                      <div className="font-bold truncate" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                        {c.tenCa || `Ca ${c.maCa}`}
                      </div>
                      <div style={NHAN_NHO}>
                        <span style={SO}>{c.maCa}</span>
                        {c.lop ? ` · Lớp ${c.lop}` : ''} · <span style={SO}>{ngayGio(c.batDau || c.moLuc)}</span> · {c.thoiGianPhut} phút
                      </div>
                    </span>
                    <span className="shrink-0 font-bold" style={{ ...SO, fontSize: 'var(--cx-2)' }}>
                      {c.daNop}/{c.daVao} nộp
                    </span>
                  </span>
                  <span className="flex items-center flex-wrap" style={{ gap: 4, marginTop: 6 }}>
                    <Nhan tone={tt.tone}>{tt.ten}</Nhan>
                    {c.canhBao > 0 && <Nhan tone="cam">{c.canhBao} cảnh báo</Nhan>}
                  </span>
                </Hang>
              )
            })}
          </div>
        )}

        {hoiXoa && chonTrongLoc.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--phu)' }}>
            <div className="w-full flex flex-col" style={{ maxWidth: 400, background: 'var(--the)', borderRadius: 'var(--bo-3)', padding: 'var(--k5)', gap: 'var(--k3)', boxShadow: 'var(--bong-2)' }}>
              <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)' }}>
                Xoá {chonTrongLoc.length} ca?
              </div>
              <OThongBao tone="do">
                {soBaiLam > 0 ? (
                  <>
                    Trong đó có bài làm của <b style={SO}>{soBaiLam}</b> em, xoá rồi không khôi phục được.
                  </>
                ) : (
                  <>Các ca này chưa có em nào vào làm.</>
                )}
              </OThongBao>
              <div className="overflow-auto" style={{ ...NHAN_NHO, maxHeight: 120 }}>
                {chonTrongLoc.map((c) => (
                  <div key={c.maCa} className="truncate">
                    <span style={SO}>{c.maCa}</span> · {c.tenCa || 'Ca chưa đặt tên'}
                    {c.daVao > 0 ? ` · ${c.daVao} em` : ''}
                  </div>
                ))}
              </div>
              {canGoChu && (
                <>
                  <div style={NHAN_NHO}>
                    Gõ <b>{CHU_XAC_NHAN}</b> để xác nhận:
                  </div>
                  <input
                    style={{ ...O_XAC_NHAN, letterSpacing: '.15em' }}
                    placeholder={CHU_XAC_NHAN}
                    value={chuXacNhan}
                    onChange={(e) => setChuXacNhan(e.target.value)}
                    autoFocus
                    aria-label={`Gõ ${CHU_XAC_NHAN} để xác nhận xoá`}
                  />
                </>
              )}
              <div className="flex" style={{ gap: 'var(--k2)' }}>
                <NutChinh
                  variant="phu"
                  onClick={() => {
                    setHoiXoa(false)
                    setChuXacNhan('')
                  }}
                >
                  Huỷ
                </NutChinh>
                <NutChinh variant="nguyhiem" onClick={handleXoa} disabled={dangXoa || chuaDuXacNhan}>
                  {dangXoa ? 'Đang xoá…' : `Xoá ${chonTrongLoc.length} ca`}
                </NutChinh>
              </div>
            </div>
          </div>
        )}
      </TheNoiDung>
    </div>
  )
}
