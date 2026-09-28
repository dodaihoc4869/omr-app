// CHIẾN DỊCH ĐÃ GIAO — BẢNG SỐ LIỆU (bản vẽ docs/ban-ve-gv-2809/GV-ChienDichDaGiao, thầy chốt 28/09).
// Hàng thẻ số (đang chạy, thành thạo TB, quá tải hôm nay, câu cần dạy lại) · lọc Tất cả / Đang chạy / Chờ buổi chữa / Đã kết thúc + ô tìm ·
// bảng: Chiến dịch · Lớp · Đã làm qua · Thành thạo · Đúng nhịp · Quá tải hôm nay · Cần dạy lại · Hạn nộp · Trạng thái.
// Số liệu lớp lấy từ `danh-sach` có `thongKe` (máy chủ cũ không gửi ⇒ ô số hiện "—"). "Xem bảng" / "Mở buổi chữa" mở đúng chiến dịch ở Chữa trên lớp.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { danhSachThongKe, dongChienDich, huyChienDich, type ChienDichTom } from './api'
import { KHOA_CHON_CHIEN_DICH } from './LenBangChienDich'
import { hienNgay, phanTram } from './ngay'
import './chien-dich.css'

export type LocChienDich = 'tat-ca' | 'dang-chay' | 'cho-chua' | 'da-dong'
export type TrangThaiHien = 'dang_chay' | 'cham_nhip' | 'cho_chua' | 'da_dong'

/** Trạng thái hiển thị: hết hạn mà chưa đóng ⇒ Chờ buổi chữa; đang chạy mà đã làm qua thấp hơn mức cần hôm nay từ 10 điểm % ⇒ Chậm nhịp. */
export function trangThaiHien(c: ChienDichTom): TrangThaiHien {
  if (c.trangThai !== 'dang_chay') return 'da_dong'
  if (c.hetHan) return 'cho_chua'
  const tk = c.thongKe
  if (tk && tk.coXat < tk.mucCanHomNay - 0.1) return 'cham_nhip'
  return 'dang_chay'
}
const CHU_TRANG_THAI: Record<TrangThaiHien, string> = { dang_chay: 'Đang chạy', cham_nhip: 'Chậm nhịp', cho_chua: 'Chờ buổi chữa', da_dong: 'Đã kết thúc' }
const MAU_TRANG_THAI: Record<TrangThaiHien, string> = { dang_chay: 'xanh', cham_nhip: 'do', cho_chua: 'vang', da_dong: 'xam' }
const khopLoc = (t: TrangThaiHien, loc: LocChienDich) =>
  loc === 'tat-ca' || (loc === 'dang-chay' && (t === 'dang_chay' || t === 'cham_nhip')) || (loc === 'cho-chua' && t === 'cho_chua') || (loc === 'da-dong' && t === 'da_dong')

/** "còn 10 ngày" · "hết hôm nay" · "hết hạn 4 ngày". */
export function chuHan(hanNop: string, homNay: string): string {
  const d = Math.round((Date.parse(`${hanNop}T00:00:00Z`) - Date.parse(`${homNay}T00:00:00Z`)) / 86_400_000)
  if (!Number.isFinite(d)) return ''
  if (d > 0) return `còn ${d} ngày`
  if (d === 0) return 'hết hôm nay 23:59'
  return `hết hạn ${-d} ngày`
}

function Thanh({ tiLe, vach }: { tiLe: number; vach?: number }) {
  return (
    <div className="cd-thanh cd-thanh--mong" aria-hidden="true">
      <div style={{ width: `${Math.max(0, Math.min(1, tiLe)) * 100}%` }} />
      {typeof vach === 'number' && <span className="cd-vach" style={{ left: `${Math.max(0, Math.min(1, vach)) * 100}%` }} />}
    </div>
  )
}

export default function DsChienDichDaGiao({ lanTai = 0, onGiaoMoi }: { lanTai?: number; /** Có ⇒ hiện nút "+ Giao chiến dịch mới" ở đầu bảng. */ onGiaoMoi?: () => void }) {
  const setScreen = useAppStore((s) => s.setScreen)
  const showToast = useAppStore((s) => s.showToast)
  const [ds, setDs] = useState<ChienDichTom[] | null>(null)
  const [homNay, setHomNay] = useState('')
  const [loi, setLoi] = useState('')
  const [dangLam, setDangLam] = useState('')
  const [loc, setLoc] = useState<LocChienDich>('tat-ca')
  const [tim, setTim] = useState('')

  const tai = useCallback(async () => {
    setLoi('')
    const r = await danhSachThongKe()
    if (!r.ok) {
      setLoi(r.chu)
      return
    }
    setDs(r.du.chienDich)
    setHomNay(r.du.homNay)
  }, [])
  useEffect(() => {
    void tai()
  }, [tai, lanTai])

  const xemBang = (id: string) => {
    try {
      sessionStorage.setItem(KHOA_CHON_CHIEN_DICH, id)
    } catch {
      /* không lưu được: Chữa trên lớp mở chiến dịch mới nhất */
    }
    setScreen('goilenbang')
  }
  const doi = async (c: ChienDichTom, viec: 'dong' | 'huy') => {
    const chu = viec === 'huy' ? `Huỷ chiến dịch "${c.ten}"? Học sinh sẽ không nhận câu của chiến dịch này nữa.` : `Kết thúc chiến dịch "${c.ten}" ngay bây giờ?`
    if (!window.confirm(chu)) return
    setDangLam(c.id)
    const r = await (viec === 'huy' ? huyChienDich(c.id) : dongChienDich(c.id))
    setDangLam('')
    if (!r.ok) {
      showToast(r.chu, 'warn')
      return
    }
    showToast(viec === 'huy' ? 'Đã huỷ chiến dịch' : 'Đã kết thúc chiến dịch', 'success')
    void tai()
  }

  const coTrangThai = useMemo(() => (ds ?? []).map((c) => ({ c, t: trangThaiHien(c) })), [ds])
  const dem = (l: LocChienDich) => coTrangThai.filter((x) => khopLoc(x.t, l)).length
  const t = tim.trim().toLowerCase()
  const hien = coTrangThai.filter((x) => khopLoc(x.t, loc) && (!t || x.c.ten.toLowerCase().includes(t) || (x.c.lop ?? '').toLowerCase().includes(t)))

  // Thẻ số: chỉ các chiến dịch đang chạy (chưa hết hạn).
  const dangChay = coTrangThai.filter((x) => x.t === 'dang_chay' || x.t === 'cham_nhip').map((x) => x.c)
  const coTk = dangChay.filter((c) => c.thongKe)
  const emDangChay = dangChay.reduce((s, c) => s + c.soEm, 0)
  const tongEmTk = coTk.reduce((s, c) => s + c.soEm, 0)
  const thanhThaoTb = tongEmTk ? coTk.reduce((s, c) => s + c.thongKe!.thanhThao * c.soEm, 0) / tongEmTk : null
  const quaTai = coTk.reduce((s, c) => s + c.thongKe!.quaTai, 0)
  const tatCaTk = coTrangThai.filter((x) => x.t !== 'da_dong' && x.c.thongKe).map((x) => x.c)
  const cauDayLai = tatCaTk.reduce((s, c) => s + c.thongKe!.canDayLaiCau, 0)
  const luotDayLai = tatCaTk.reduce((s, c) => s + c.thongKe!.canDayLaiLuot, 0)
  const soCdDayLai = tatCaTk.filter((c) => c.thongKe!.canDayLaiCau > 0).length

  return (
    <section className="cd-the" data-khoi="ds-chien-dich-da-giao" aria-labelledby="cd-ds-da-giao">
      <div className="cd-the-dau">
        <div>
          <h2 id="cd-ds-da-giao">Chiến dịch đã giao</h2>
          {ds && (
            <span className="cd-so cd-phu">
              {ds.length} chiến dịch · {dangChay.length} đang chạy
            </span>
          )}
        </div>
        <div className="cd-hang-nut">
          <input type="search" className="cd-tim-em" value={tim} placeholder="Tìm chiến dịch, lớp…" aria-label="Tìm chiến dịch" onChange={(e) => setTim(e.target.value)} />
          {onGiaoMoi && (
            <button type="button" className="m3-nut-chinh" onClick={onGiaoMoi}>
              + Giao chiến dịch mới
            </button>
          )}
        </div>
      </div>

      {loi && (
        <p className="cd-loi" role="alert">
          {loi}{' '}
          <button type="button" className="m3-nut-chu cd-nut-nho" onClick={() => void tai()}>
            Tải lại
          </button>
        </p>
      )}
      {!loi && ds === null && <p className="cd-phu">Đang tải danh sách chiến dịch…</p>}
      {ds && ds.length === 0 && <p className="cd-phu">Chưa giao chiến dịch nào. Bấm "Giao chiến dịch mới" để bắt đầu.</p>}

      {ds && ds.length > 0 && (
        <>
          <div className="cd-kpi-hang cd-kpi-hang--4" data-khoi="o-so-ds-chien-dich">
            <div className="cd-kpi">
              <span className="cd-kpi-nhan">Chiến dịch đang chạy</span>
              <strong data-so="dang-chay">
                {dangChay.length}
                <small>/ {ds.length} chiến dịch</small>
              </strong>
              <span className="cd-kpi-phu cd-so">{emDangChay} lượt em nhận (em ở 2 chiến dịch tính 2 lần)</span>
            </div>
            <div className="cd-kpi">
              <span className="cd-kpi-nhan">Thành thạo trung bình</span>
              <strong data-so="thanh-thao-tb">
                {thanhThaoTb == null ? '—' : Math.round(thanhThaoTb * 100)}
                <small>% câu</small>
              </strong>
              <span className="cd-kpi-phu">các chiến dịch đang chạy, tính theo số em</span>
            </div>
            <div className="cd-kpi">
              <span className="cd-kpi-nhan">Em quá tải hôm nay</span>
              <strong data-so="qua-tai">
                {quaTai}
                <small>em</small>
              </strong>
              <span className="cd-kpi-phu">phải làm vượt số lượt/ngày để kịp hạn</span>
            </div>
            <div className="cd-kpi">
              <span className="cd-kpi-nhan">Câu cần thầy dạy lại</span>
              <strong data-so="can-day-lai">
                {cauDayLai}
                <small>câu</small>
              </strong>
              <span className="cd-kpi-phu cd-so">
                ở {soCdDayLai} chiến dịch · {luotDayLai} lượt em
              </span>
            </div>
          </div>

          <div className="cd-tab-hang">
            <div className="cd-tab" role="group" aria-label="Lọc chiến dịch">
              {(
                [
                  ['tat-ca', 'Tất cả'],
                  ['dang-chay', 'Đang chạy'],
                  ['cho-chua', 'Chờ buổi chữa'],
                  ['da-dong', 'Đã kết thúc'],
                ] as const
              ).map(([k, chu]) => (
                <button key={k} type="button" aria-pressed={loc === k} onClick={() => setLoc(k)}>
                  {chu} · {dem(k)}
                </button>
              ))}
            </div>
            <span className="cd-phu">Vạch đen trên thanh Đã làm qua = mức lớp cần đạt hôm nay để kịp hạn</span>
          </div>

          <div className="cd-cuon-ngang">
            <table className="cd-bang cd-bang-cd" data-khoi="bang-chien-dich">
              <thead>
                <tr>
                  <th scope="col">Chiến dịch</th>
                  <th scope="col">Lớp</th>
                  <th scope="col" title="Câu em đã làm ít nhất 1 lần (trung bình lớp)">
                    Đã làm qua
                  </th>
                  <th scope="col" title="Câu đúng đủ lịch ôn, lần cuối đúng">
                    Thành thạo
                  </th>
                  <th scope="col">Đúng nhịp</th>
                  <th scope="col">Quá tải hôm nay</th>
                  <th scope="col">Cần dạy lại</th>
                  <th scope="col">Hạn nộp</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">
                    <span className="cd-an-chu">Việc</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {hien.map(({ c, t: tt }) => {
                  const tk = c.thongKe
                  const dong = tt === 'da_dong' || tt === 'cho_chua'
                  return (
                    <tr key={c.id} className="cd-muc-cd" data-trang-thai={c.trangThai}>
                      <th scope="row">
                        <b>{c.ten}</b>
                        <small className="cd-phu cd-so">{c.soCau} câu</small>
                      </th>
                      <td>
                        {c.lop || 'Nhiều em'}
                        <small className="cd-phu cd-so">{c.soEm} em</small>
                      </td>
                      <td className="cd-so">
                        {tk ? (
                          <>
                            <b>{phanTram(tk.coXat)}</b> số câu
                            <Thanh tiLe={tk.coXat} vach={dong ? undefined : tk.mucCanHomNay} />
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="cd-so">
                        {tk ? (
                          <>
                            <b>{phanTram(tk.thanhThao)}</b> {dong ? 'cuối kỳ' : 'số câu'}
                            <Thanh tiLe={tk.thanhThao} />
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="cd-so">
                        {tk && !dong ? (
                          <>
                            <b>{tk.dungNhip}</b> / {c.soEm}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="cd-so">{tk && !dong ? tk.quaTai : '—'}</td>
                      <td className={`cd-so${tk && tk.canDayLaiCau > 0 ? ' cd-chu-do' : ''}`}>{tk ? tk.canDayLaiCau : '—'}</td>
                      <td className="cd-so">
                        <b>{homNay ? chuHan(c.hanNop, homNay) : ''}</b>
                        <small className="cd-phu">23:59 · {hienNgay(c.hanNop, false)}</small>
                      </td>
                      <td>
                        <span className={`cd-chip-muc cd-chip-muc--${MAU_TRANG_THAI[tt]}`}>{CHU_TRANG_THAI[tt]}</span>
                      </td>
                      <td>
                        <div className="cd-hang-nut cd-hang-nut--hep">
                          <button type="button" className="m3-nut-vien cd-nut-nho" onClick={() => xemBang(c.id)}>
                            {tt === 'cho_chua' ? 'Mở buổi chữa' : tt === 'da_dong' ? 'Xem lại' : 'Xem bảng'}
                          </button>
                          {c.trangThai === 'dang_chay' && (
                            <>
                              <button type="button" className="m3-nut-chu cd-nut-nho" disabled={dangLam === c.id} onClick={() => void doi(c, 'dong')}>
                                Kết thúc
                              </button>
                              <button type="button" className="m3-nut-chu cd-nut-nho" disabled={dangLam === c.id} onClick={() => void doi(c, 'huy')}>
                                Huỷ
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {hien.length === 0 && (
                  <tr>
                    <td colSpan={10} className="cd-phu">
                      Không có chiến dịch nào khớp bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="cd-phu">
            <b>Đã làm qua</b> = câu em đã làm ít nhất 1 lần (trung bình lớp) · <b>Thành thạo</b> = câu đúng đủ lịch ôn, lần cuối đúng · <b>Quá tải hôm nay</b> = em phải làm
            vượt số lượt/ngày để kịp hạn · <b>Cần dạy lại</b> = câu có em sai từ 4 lần.
          </p>
        </>
      )}
    </section>
  )
}
