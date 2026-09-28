// MÀN "LỊCH SỬ CA KIỂM TRA" của em (mở từ thẻ nhỏ trên Sảnh bản đồ — thầy lệnh 28/09). Mảnh lazy, NGOÀI precache.
// Danh sách: tên ca, giờ nộp, điểm/10, số câu đúng, xu hướng so với ca đã công bố liền trước; mới nhất trên cùng.
// Ca chưa công bố: "Chờ thầy công bố", không điểm/không số câu. Bấm một ca đã công bố ⇒ BÁO CÁO CHI TIẾT bản mới
// (`BaoCaoChiTiet` chế độ em, nạp qua `BaoCaoCaCuaEm`). Khung + bảng màu theo "Câu đã làm" (cau-da-lam.css).
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { hsLichSuCaApi } from '../../lib/exam-api'
import { dungLichSuCa, type DongLichSuCa } from '../../lib/lich-su-ca-hs'
import { soVn } from '../../lib/ket-qua-sau-nop'
import type { LichSuCuaEm } from '../ca-thi/BaoCaoCaCuaEm'
import './cau-da-lam.css'
import './lich-su-ca-em.css'

const BaoCaoCaCuaEm = lazy(() => import('../ca-thi/BaoCaoCaCuaEm'))

export interface LichSuCaEmProps {
  sbd: string
  scriptUrl?: string
  /** Lịch sử cổng đã nạp (nếu có) — hiện ngay, vẫn hỏi lại máy chủ cho mới. */
  banDau?: LichSuCuaEm | null
  onVe: () => void
}

function XuHuong({ d }: { d: Extract<DongLichSuCa, { kieu: 'da_cong_bo' }> }) {
  if (d.xuHuong === null) return <span className="h2-lsc-xh" data-huong="dau">Ca đầu tiên</span>
  const huong = d.xuHuong > 0 ? 'len' : d.xuHuong < 0 ? 'xuong' : 'bang'
  const chu = huong === 'len' ? `Tăng ${soVn(d.xuHuong)}` : huong === 'xuong' ? `Giảm ${soVn(-d.xuHuong)}` : 'Bằng'
  return (
    <span className="h2-lsc-xh" data-huong={huong}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {huong === 'len' ? <path d="M4 17l6-6 4 4 6-8M14 7h6v6" /> : huong === 'xuong' ? <path d="M4 7l6 6 4-4 6 8M14 17h6v-6" /> : <path d="M4 12h16" />}
      </svg>
      {chu} điểm so với ca trước
    </span>
  )
}

export default function LichSuCaEm({ sbd, scriptUrl = '', banDau = null, onVe }: LichSuCaEmProps) {
  const [ls, setLs] = useState<LichSuCuaEm | null>(banDau)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState('')
  const [mo, setMo] = useState<{ maCa: string; ten: string } | null>(null)

  const nap = useCallback(async () => {
    setDangTai(true)
    setLoi('')
    try {
      const r = await hsLichSuCaApi(scriptUrl, sbd)
      if (r.ok) setLs({ items: (r.items ?? []) as LichSuCuaEm['items'], chuaCongBo: r.chuaCongBo ?? [] })
      else setLoi(r.error || 'Chưa lấy được lịch sử ca kiểm tra.')
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không kết nối được máy chủ.')
    } finally {
      setDangTai(false)
    }
  }, [scriptUrl, sbd])
  useEffect(() => {
    void nap()
  }, [nap])
  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mo) onVe()
    }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [mo, onVe])

  const ds = dungLichSuCa(ls?.items, ls?.chuaCongBo)

  return (
    <div className="h2-cdl h2-lsc">
      <header className="h2-cdl-dau">
        <div className="h2-cdl-hang">
          <button type="button" className="h2-cdl-ve" aria-label="Về Sảnh" onClick={onVe}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="h2-cdl-tieu">Lịch sử ca kiểm tra</h1>
        </div>
        <p className="h2-cdl-tom">Bấm một ca đã công bố để xem báo cáo chi tiết và lời giải từng câu.</p>
      </header>

      <main className="h2-cdl-ds h2-lsc-ds" aria-busy={dangTai && !ls}>
        {loi && (
          <div className="h2-lsc-thong-bao" role="alert">
            <p>{loi}</p>
            <button type="button" className="h2-lsc-nut-phu" onClick={() => void nap()}>
              Thử lại
            </button>
          </div>
        )}
        {!ls && dangTai && (
          <div role="status" className="h2-lsc-xuong">
            <span />
            <span />
            <span />
            <span className="h2-an">Đang tải lịch sử ca kiểm tra…</span>
          </div>
        )}
        {ls && ds.length === 0 && (
          <div className="h2-lsc-thong-bao" role="status">
            <p>Em chưa nộp ca kiểm tra nào. Khi thầy mở ca, em vào thi từ nút Ca kiểm tra trên Sảnh.</p>
          </div>
        )}
        {ds.length > 0 && (
          <ol className="h2-lsc-danh" aria-label="Các ca kiểm tra, mới nhất trên cùng">
            {ds.map((d) =>
              d.kieu === 'da_cong_bo' ? (
                <li key={d.maCa}>
                  <button type="button" className="h2-lsc-the" onClick={() => setMo({ maCa: d.maCa, ten: d.ten })} aria-label={`${d.ten}: ${d.chuDiem} điểm trên 10. Xem báo cáo chi tiết`}>
                    <span className="h2-lsc-chu">
                      <span className="h2-lsc-ten">{d.ten}</span>
                      <span className="h2-lsc-gio">{d.gio || 'Chưa rõ giờ nộp'}</span>
                      <span className="h2-lsc-phu">
                        {d.dung !== null && d.tong !== null && (
                          <span>
                            Đúng {d.dung}/{d.tong} câu
                          </span>
                        )}
                        <XuHuong d={d} />
                      </span>
                    </span>
                    <span className="h2-lsc-diem" aria-hidden="true">
                      <b>{d.chuDiem}</b>
                      <span>/10 điểm</span>
                    </span>
                  </button>
                </li>
              ) : (
                <li key={d.maCa}>
                  <div className="h2-lsc-the" data-cho="true">
                    <span className="h2-lsc-chu">
                      <span className="h2-lsc-ten">{d.ten}</span>
                      <span className="h2-lsc-gio">{d.gio || 'Chưa rõ giờ nộp'}</span>
                    </span>
                    <span className="h2-lsc-cho">Chờ thầy công bố</span>
                  </div>
                </li>
              ),
            )}
          </ol>
        )}
      </main>

      {mo && (
        <Suspense fallback={<div className="h2-lsc-phu-man" role="status">Đang mở báo cáo…</div>}>
          <BaoCaoCaCuaEm maCa={mo.maCa} tenCa={mo.ten} sbd={sbd} scriptUrl={scriptUrl} lichSu={ls} onDong={() => setMo(null)} />
        </Suspense>
      )}
    </div>
  )
}
