import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight, History, Search, Sparkles } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { danhSachThongKe, docBang, type BangChienDich, type ChienDichTom, type EmBang, type HangEm } from './api'
import { KHOA_CHON_CHIEN_DICH } from './LenBangChienDich'
import { phanTram } from './ngay'
import { laChamNhip } from '../../lib/nhip-chien-dich'
import './chien-dich.css'

export type LocChienDich = 'tat-ca' | 'dang-chay' | 'cho-chua' | 'da-dong'
export type TrangThaiHien = 'sap_bat_dau' | 'dang_chay' | 'cham_nhip' | 'cho_chua' | 'da_dong'

export function trangThaiHien(c: ChienDichTom): TrangThaiHien {
  if (c.trangThai !== 'dang_chay') return 'da_dong'
  if (c.hanhTrinh || c.id.startsWith('hanh-trinh-gioi-hoa-khoi-')) return 'dang_chay'
  if (c.hetHan) return 'cho_chua'
  if (c.sapBatDau) return 'sap_bat_dau'
  if (c.thongKe && laChamNhip(c.thongKe.coXat, c.thongKe)) return 'cham_nhip'
  return 'dang_chay'
}
export function chuHan(hanNop: string, homNay: string): string {
  const d = Math.round((Date.parse(`${hanNop}T00:00:00Z`) - Date.parse(`${homNay}T00:00:00Z`)) / 86_400_000)
  if (!Number.isFinite(d)) return ''
  if (d > 0) return `còn ${d} ngày`
  if (d === 0) return 'hết hôm nay 23:59'
  return `hết hạn ${-d} ngày`
}

const laHanhTrinh = (c: ChienDichTom) => c.hanhTrinh === true || c.id.startsWith('hanh-trinh-gioi-hoa-khoi-') || /^Hành trình giỏi Hóa/i.test(c.ten)
const khoiCua = (c: ChienDichTom): number => c.khoiHanhTrinh ?? Number(c.ten.match(/Khối\s*(10|11|12)/i)?.[1] ?? c.lop?.match(/(?:^|\D)(10|11|12)(?:\D|$)/)?.[1] ?? 0)
const thuTuHang: HangEm[] = ['L1', 'L2', 'L3', 'L4']
const hangCua = (e: EmBang): HangEm | null => {
  const ds = Object.values(e.hangTheoDang ?? {})
  return ds.length ? ds.sort((a, b) => thuTuHang.indexOf(b) - thuTuHang.indexOf(a))[0] : null
}
const tenHang = (h: HangEm | null) => h ? ({ L1: 'Đang xây nền', L2: 'Đang củng cố', L3: 'Khá vững', L4: 'Sẵn sàng bứt phá' } satisfies Record<HangEm, string>)[h] : 'Đang đo năng lực'
const mucTieu = (e: EmBang) => {
  if (e.canDayLai > 0) return { ten: `Gỡ ${e.canDayLai} lỗi đang vướng`, lyDo: 'Ưu tiên vòng sửa sai đến khi tự làm đúng', tone: 'do' }
  if ((e.soCauTon ?? 0) > 0) return { ten: `Hoàn thành ${e.soCauTon} câu còn lại`, lyDo: 'Máy giảm câu mới để em lấy lại nhịp', tone: 'vang' }
  if (e.nhip === 'vuot') return { ten: 'Thử thách cao hơn 1 bậc', lyDo: 'Đúng nhanh và ổn định ở mức hiện tại', tone: 'tim' }
  if (e.nhip === 'tre12' || e.nhip === 'tre3') return { ten: 'Củng cố phần cốt lõi', lyDo: 'Kế hoạch hôm nay đã được rút gọn theo nhịp', tone: 'vang' }
  return { ten: 'Ôn đúng hạn · học câu mới', lyDo: 'Giữ nhịp vừa sức theo hồ sơ riêng', tone: 'xanh' }
}

export default function HanhTrinhDashboard({ lanTai = 0 }: { lanTai?: number; onGiaoMoi?: () => void }) {
  const setScreen = useAppStore((s) => s.setScreen)
  const [ds, setDs] = useState<ChienDichTom[] | null>(null)
  const [loi, setLoi] = useState('')
  const [id, setId] = useState('')
  const [bang, setBang] = useState<BangChienDich | null>(null)
  const [dangTaiBang, setDangTaiBang] = useState(false)
  const [tim, setTim] = useState('')

  const tai = useCallback(async () => {
    setLoi('')
    const r = await danhSachThongKe()
    if (!r.ok) return setLoi(r.chu)
    setDs(r.du.chienDich)
  }, [])
  useEffect(() => { void tai() }, [tai, lanTai])

  const hanhTrinh = useMemo(() => (ds ?? []).filter(laHanhTrinh).sort((a, b) => khoiCua(a) - khoiCua(b)), [ds])
  const lichSu = useMemo(() => (ds ?? []).filter((c) => !laHanhTrinh(c)), [ds])
  useEffect(() => {
    if (hanhTrinh.length && !hanhTrinh.some((c) => c.id === id)) setId(hanhTrinh.at(-1)!.id)
  }, [hanhTrinh, id])
  useEffect(() => {
    if (!id) { setBang(null); return }
    let song = true
    setBang(null)
    setDangTaiBang(true)
    void docBang(id).then((r) => {
      if (!song) return
      setDangTaiBang(false)
      if (r.ok) setBang(r.du)
      else setLoi(r.chu)
    })
    return () => { song = false }
  }, [id, lanTai])

  const chon = hanhTrinh.find((c) => c.id === id) ?? null
  const q = tim.trim().toLowerCase()
  const em = (bang?.em ?? []).filter((e) => !q || e.ten.toLowerCase().includes(q) || e.sbd.toLowerCase().includes(q))
  const dungNhip = bang?.lop.dungNhip ?? (bang?.em.filter((e) => e.nhip === 'dung' || e.nhip === 'vuot').length ?? 0)
  const canGo = bang?.em.filter((e) => e.canDayLai > 0).length ?? 0
  const sanSang = bang?.em.filter((e) => e.nhip === 'vuot' || hangCua(e) === 'L4').length ?? 0

  const moCanChua = () => {
    if (id) try { sessionStorage.setItem(KHOA_CHON_CHIEN_DICH, id) } catch { /* tiếp tục bằng hành trình mới nhất */ }
    setScreen('goilenbang')
  }

  return (
    <section className="htgv" aria-label="Hành trình giỏi Hóa">
      {loi && <p className="cd-loi" role="alert">{loi} <button type="button" className="m3-nut-chu cd-nut-nho" onClick={() => void tai()}>Tải lại</button></p>}
      {!loi && ds === null && <p className="cd-phu">Đang mở hành trình…</p>}

      {hanhTrinh.length > 0 && <>
        <div className="htgv-toolbar">
          <div className="htgv-khoi" role="tablist" aria-label="Chọn khối">
            {hanhTrinh.map((c) => <button key={c.id} type="button" role="tab" aria-selected={id === c.id} onClick={() => setId(c.id)}>Khối {khoiCua(c) || c.lop || '—'}</button>)}
          </div>
          <div className="htgv-tabs" role="navigation" aria-label="Các phần của hành trình">
            <button type="button" onClick={() => setScreen('tongquan')}>Tổng quan</button>
            <button type="button" aria-current="page">Nhịp hôm nay</button>
            <button type="button" onClick={moCanChua}>Cần chữa {chon?.thongKe?.canDayLaiCau ? <b>{chon.thongKe.canDayLaiCau}</b> : null}</button>
          </div>
        </div>

        <div className="htgv-kpi" aria-label="Tóm tắt hành trình">
          <div data-tone="xanh"><span>Đúng nhịp hôm nay</span><b>{dungNhip}<small>/{bang?.em.length ?? chon?.soEm ?? 0} em</small></b></div>
          <div data-tone="do"><span>Cần gỡ lỗi</span><b>{canGo}<small>em</small></b></div>
          <div data-tone="tim"><span>Sẵn sàng nâng bậc</span><b>{sanSang}<small>em</small></b></div>
        </div>

        <div className="htgv-grid">
          <section className="htgv-panel htgv-panel--em" aria-labelledby="htgv-em">
            <div className="htgv-panel-head">
              <div><h2 id="htgv-em">Kế hoạch riêng hôm nay</h2><p>Máy tự cân câu, độ khó và vòng sửa sai cho từng em.</p></div>
              <label className="htgv-search"><Search size={17} aria-hidden="true" /><span className="cd-an-chu">Tìm học sinh</span><input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm học sinh…" /></label>
            </div>
            <div className="htgv-students" role="region" aria-label="Kế hoạch của từng học sinh" tabIndex={0}>
              {dangTaiBang ? <p className="cd-phu">Đang tính kế hoạch từng em…</p> : em.map((e) => {
                const mt = mucTieu(e)
                return <article key={e.sbd} className="htgv-student">
                  <span className="htgv-avatar" aria-hidden="true">{e.ten.trim().split(/\s+/).at(-1)?.[0]}</span>
                  <span className="htgv-name"><b>{e.ten}</b><small>SBD {e.sbd} · {tenHang(hangCua(e))}</small></span>
                  <span className="htgv-goal" data-tone={mt.tone}><b>{mt.ten}</b><small>{mt.lyDo}</small></span>
                  <span className="htgv-auto"><Sparkles size={15} aria-hidden="true" /> Tự tính theo nhịp</span>
                </article>
              })}
              {!dangTaiBang && em.length === 0 && <p className="cd-phu">Không có học sinh khớp tìm kiếm.</p>}
            </div>
          </section>

          <aside className="htgv-panel htgv-panel--bai" aria-labelledby="htgv-bai">
            <div className="htgv-panel-head"><div><h2 id="htgv-bai">Bài trong hành trình</h2><p>{chon?.soCau ?? 0} câu · tự rải theo ngày</p></div></div>
            <div className="htgv-lessons">
              {(chon?.maDe ?? []).map((ma, i) => <div key={ma}><span>{i + 1}</span><b>{ma}</b><small>Đang dùng</small></div>)}
              {!chon?.maDe.length && <p className="cd-phu">Chưa có bài trong hành trình này.</p>}
            </div>
            <button type="button" className="htgv-repair" onClick={moCanChua}><span><b>Cần chữa trên lớp</b><small>Điểm danh bằng mã rồi gọi đúng em có mặt</small></span><strong>{chon?.thongKe?.canDayLaiCau ?? bang?.canDayLai.length ?? 0}</strong><ChevronRight size={20} aria-hidden="true" /></button>
          </aside>
        </div>
      </>}

      {ds && hanhTrinh.length === 0 && <div className="htgv-empty"><Sparkles size={24} /><h2>Chưa có Hành trình giỏi Hóa</h2><p>Bổ sung bài đầu tiên để hệ thống tạo kế hoạch dài hạn theo khối.</p></div>}

      {lichSu.length > 0 && <details className="htgv-history"><summary><History size={18} aria-hidden="true" />Lịch sử trước khi hợp nhất <span>{lichSu.length}</span></summary><div className="htgv-history-list">{lichSu.map((c) => <button key={c.id} type="button" onClick={() => { try { sessionStorage.setItem(KHOA_CHON_CHIEN_DICH, c.id) } catch { /* bỏ qua */ } setScreen('goilenbang') }}><span><b>{c.ten}</b><small>{c.lop || 'Nhiều em'} · {c.soCau} câu</small></span><span>{phanTram(c.thongKe?.thanhThao ?? 0)} thành thạo</span><ChevronRight size={18} /></button>)}</div></details>}
    </section>
  )
}

