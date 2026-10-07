// KPI CHỮA CÂU SAI — màn thống kê cho giáo viên (Phase E, 07/10/2026).
// Gọi GET /gv/chua-cau-sai/thong-ke — không cần token học sinh.
// Mục tiêu KPI: 90% đợt đủ điều kiện tự sửa được ở gặp lại 2.
import { useState, useEffect } from 'react'
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import './chua-cau-sai.css'

interface ThongKeKpi {
  ok: boolean
  cohortId?: string
  tuNgay?: string
  denNgay?: string
  mauSo?: number
  tuSo?: number
  kpiPhanTram?: number | null
  mucTieu?: number
  datMucTieu?: boolean
  loi?: string
}

export default function KpiChuaCauSai() {
  const [dang, setDang] = useState(true)
  const [du, setDu] = useState<ThongKeKpi | null>(null)
  const [loi, setLoi] = useState('')

  useEffect(() => {
    let huy = false
    setDang(true)
    ;(async () => {
      const goc = await layDiaChiMayChu()
      if (!goc || huy) return
      try {
        const r = await fetch(`${goc}/gv/chua-cau-sai/thong-ke`)
        const j = (await r.json()) as ThongKeKpi
        if (!huy) { setDu(j); if (!j.ok) setLoi(j.loi ?? 'Lỗi tải thống kê.') }
      } catch {
        if (!huy) setLoi('Không kết nối được máy chủ.')
      } finally {
        if (!huy) setDang(false)
      }
    })()
    return () => { huy = true }
  }, [])

  if (dang) return <div className="ccs-dang-tai">Đang tải KPI…</div>
  if (loi) return <p className="ccs-loi">{loi}</p>
  if (!du) return null

  const kpi = du.kpiPhanTram
  const dat = du.datMucTieu ?? false

  return (
    <section className="ccs-kpi" aria-label="KPI chữa câu sai">
      <h2 className="ccs-kpi-tieu">Vòng chữa câu sai — KPI pilot</h2>
      <p className="ccs-kpi-cua-so">{du.tuNgay} → {du.denNgay}</p>
      <div className="ccs-kpi-hang">
        <div className="ccs-kpi-o" data-dat={dat ? 'true' : 'false'}>
          <span className="ccs-kpi-so">{kpi != null ? `${kpi}%` : '—'}</span>
          <span className="ccs-kpi-nhan">Tự sửa được<br />(mục tiêu ≥ 90%)</span>
        </div>
        <div className="ccs-kpi-o">
          <span className="ccs-kpi-so">{du.tuSo ?? 0}</span>
          <span className="ccs-kpi-nhan">Đợt tự sửa<br />(tử số)</span>
        </div>
        <div className="ccs-kpi-o">
          <span className="ccs-kpi-so">{du.mauSo ?? 0}</span>
          <span className="ccs-kpi-nhan">Đợt đủ điều kiện<br />(mẫu số)</span>
        </div>
      </div>
      {(du.mauSo ?? 0) === 0 && (
        <p className="ccs-ghi" style={{ marginTop: '0.75rem' }}>
          Chưa có dữ liệu — học sinh pilot chưa hoàn thành gặp lại 2 lần nào.
        </p>
      )}
      <p className="ccs-kpi-cohort">Cohort: {du.cohortId}</p>
    </section>
  )
}
