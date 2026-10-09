// CHIẾN DỊCH ĐÃ GIAO — BẢNG SỐ LIỆU (bản vẽ docs/ban-ve-gv-2809/GV-ChienDichDaGiao, thầy chốt 28/09).
// Hàng thẻ số (đang chạy, thành thạo TB, quá tải hôm nay, câu cần dạy lại) · lọc Tất cả / Đang chạy / Chờ buổi chữa / Đã kết thúc + ô tìm ·
// bảng: Chiến dịch · Lớp · Đã làm qua · Thành thạo · Đúng nhịp · Quá tải hôm nay · Cần dạy lại · Hạn nộp · Trạng thái.
// Số liệu lớp lấy từ `danh-sach` có `thongKe` (máy chủ cũ không gửi ⇒ ô số hiện "—"). "Xem bảng" / "Mở buổi chữa" mở đúng chiến dịch ở Chữa trên lớp.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { danhSachThongKe, doiRaiDeu, dongChienDich, huyChienDich, loiBaoDaHuy, type ChienDichTom, type KetQuaThuHoi } from './api'
import { KHOA_CHON_CHIEN_DICH } from './LenBangChienDich'
import { hienNgay, laHanGia, phanTram } from './ngay'
import SuaChienDich from './SuaChienDich'
import { hoiXacNhan } from '../hop-thoai'
import './chien-dich.css'
import { laChamNhip } from '../../lib/nhip-chien-dich'

export type LocChienDich = 'tat-ca' | 'dang-chay' | 'cho-chua' | 'da-dong'
export type TrangThaiHien = 'sap_bat_dau' | 'dang_chay' | 'cham_nhip' | 'cho_chua' | 'da_dong'

/** Trạng thái hiển thị: hết hạn mà chưa đóng ⇒ Chờ buổi chữa; chưa tới ngày bắt đầu ⇒ Sắp bắt đầu (chỉ ở Tất cả, không tính Đang chạy); đang chạy mà đã làm qua thấp hơn mức cần tới HẾT HÔM QUA từ 10 điểm % ⇒ Chậm nhịp (luật chung src/lib/nhip-chien-dich.ts). */
export function trangThaiHien(c: ChienDichTom): TrangThaiHien {
  if (c.trangThai !== 'dang_chay') return 'da_dong'
  if (c.hetHan) return 'cho_chua'
  if (c.sapBatDau) return 'sap_bat_dau'
  const tk = c.thongKe
  if (tk && laChamNhip(tk.coXat, tk)) return 'cham_nhip'
  return 'dang_chay'
}
const CHU_TRANG_THAI: Record<TrangThaiHien, string> = { sap_bat_dau: 'Sắp bắt đầu', dang_chay: 'Đang chạy', cham_nhip: 'Chậm nhịp', cho_chua: 'Chờ buổi chữa', da_dong: 'Đã kết thúc' }
const MAU_TRANG_THAI: Record<TrangThaiHien, string> = { sap_bat_dau: 'duong', dang_chay: 'xanh', cham_nhip: 'do', cho_chua: 'vang', da_dong: 'xam' }
const khopLoc = (t: TrangThaiHien, loc: LocChienDich) =>
  loc === 'tat-ca' || (loc === 'dang-chay' && (t === 'dang_chay' || t === 'cham_nhip')) || (loc === 'cho-chua' && t === 'cho_chua') || (loc === 'da-dong' && t === 'da_dong')

/** "còn 10 ngày" · "hết hôm nay" · "hết hạn 4 ngày". */
export function chuHan(hanNop: string, homNay: string): string {
  // Hạn giả của Hành trình (9999-12-31) ⇒ không ghi hạn (thầy chốt 09/10 — trước đây in "còn 2 912 xxx ngày").
  if (laHanGia(hanNop)) return ''
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
  // Hộp "Chỉnh sửa" (thầy 28/09): thêm đề, thêm/bớt em, sửa hạn của chiến dịch đang mở.
  const [dangSua, setDangSua] = useState<ChienDichTom | null>(null)

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
    // Hộp của app (không dùng confirm của trình duyệt — thầy 28/09): nút nói đúng việc, huỷ là việc nguy hiểm ⇒ nút đỏ.
    const ok = await hoiXacNhan(
      viec === 'huy'
        ? {
            tieuDe: 'Huỷ chiến dịch?',
            noiDung: `"${c.ten}" sẽ dừng hẳn: học sinh không nhận câu của chiến dịch này nữa — câu chưa làm được thu hồi ngay, kể cả lượt em đang mở. Kết quả đã làm vẫn giữ.`,
            nhanDongY: 'Huỷ chiến dịch',
            nhanKhong: 'Giữ lại',
            nguyHiem: true,
          }
        : {
            tieuDe: 'Kết thúc chiến dịch?',
            noiDung: `"${c.ten}" kết thúc ngay bây giờ, không chờ tới hạn.`,
            nhanDongY: 'Kết thúc ngay',
            nhanKhong: 'Chưa kết thúc',
          },
    )
    if (!ok) return
    setDangLam(c.id)
    const r = await (viec === 'huy' ? huyChienDich(c.id) : dongChienDich(c.id))
    setDangLam('')
    if (!r.ok) {
      showToast(r.chu, 'warn')
      return
    }
    showToast(viec === 'huy' ? loiBaoDaHuy((r.du as { thuHoi?: KetQuaThuHoi }).thuHoi) : 'Đã kết thúc chiến dịch', 'success')
    void tai()
  }

  // Công tắc rải đều câu mới (thầy 30/09) trên chiến dịch đang chạy: chỉ ghi cờ. Kế hoạch đã chốt hôm nay không đổi ⇒ em đã mở app hôm nay: từ ngày mai;
  // em chưa mở app hôm nay: kế hoạch lập lúc em mở theo cờ mới (phản biện vòng 2 PR 110 — chữ cũ "từ ngày mai" chưa đúng hết).
  const doiRai = async (c: ChienDichTom, bat: boolean) => {
    setDangLam(c.id)
    const r = await doiRaiDeu(c.id, bat)
    setDangLam('')
    if (!r.ok) {
      showToast(r.chu, 'warn')
      return
    }
    showToast(`Đã ${bat ? 'bật' : 'tắt'} rải đều câu mới — em đã mở app hôm nay: áp dụng từ ngày mai; em chưa mở: áp dụng ngay hôm nay`, 'success')
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
          <h2 id="cd-ds-da-giao">{ds?.some(c => c.hanhTrinh) ? 'Ba hành trình giỏi hoá' : 'Chiến dịch đã giao'}</h2>
          {ds && (
            <span className="cd-so cd-phu">
              {ds.length} chiến dịch · {dangChay.length} đang chạy
            </span>
          )}
        </div>
        <div className="cd-hang-nut">
          <input type="search" className="cd-tim-em" value={tim} placeholder="Tìm chiến dịch, lớp…" aria-label="Tìm chiến dịch" onChange={(e) => setTim(e.target.value)} />
          {onGiaoMoi && !ds?.some(c => c.hanhTrinh) && (
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
            <div className="cd-kpi" data-mau="xd">
              <span className="cd-kpi-nhan">Chiến dịch đang chạy</span>
              <strong data-so="dang-chay">
                {dangChay.length}
                <small>/ {ds.length} chiến dịch</small>
              </strong>
              <span className="cd-kpi-phu cd-so">{emDangChay} lượt em nhận (em ở 2 chiến dịch tính 2 lần)</span>
            </div>
            <div className="cd-kpi" data-mau="xl">
              <span className="cd-kpi-nhan">Thành thạo trung bình</span>
              <strong data-so="thanh-thao-tb">
                {thanhThaoTb == null ? '—' : Math.round(thanhThaoTb * 100)}
                <small>% câu</small>
              </strong>
              <span className="cd-kpi-phu">các chiến dịch đang chạy, tính theo số em</span>
            </div>
            <div className="cd-kpi" data-mau="hp">
              <span className="cd-kpi-nhan">Em quá tải hôm nay</span>
              <strong data-so="qua-tai">
                {quaTai}
                <small>em</small>
              </strong>
              <span className="cd-kpi-phu">phải làm vượt số lượt/ngày để kịp hạn</span>
            </div>
            <div className="cd-kpi" data-mau="ho">
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
          </div>

          <div className="cd-cuon-ngang cd-cuon-doc" role="region" aria-label="Danh sách chiến dịch đã giao" tabIndex={0}>
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
                        <b>{c.hanhTrinh ? 'Học mỗi ngày' : homNay ? chuHan(c.hanNop, homNay) : ''}</b>
                        <small className="cd-phu">{c.hanhTrinh ? 'Tối thiểu 24 / 30 / 36 câu theo tầng · chặng 6 câu' : `23:59 · ${hienNgay(c.hanNop, false)}`}</small>
                      </td>
                      <td>
                        <span className={`cd-chip-muc cd-chip-muc--${MAU_TRANG_THAI[tt]}`}>
                          {tt === 'sap_bat_dau' && c.batDau ? `${CHU_TRANG_THAI[tt]} · ${hienNgay(c.batDau, false)}` : CHU_TRANG_THAI[tt]}
                        </span>
                        {!c.hanhTrinh && c.trangThai === 'dang_chay' && !c.hetHan ? (
                          <label className="cd-tich cd-phu" data-khoi="rai-deu">
                            <input type="checkbox" role="switch" aria-label={`Rải đều câu mới · ${c.ten}`} aria-checked={c.raiDeu !== false} checked={c.raiDeu !== false} disabled={dangLam === c.id} onChange={(e) => void doiRai(c, e.target.checked)} />
                            <span>Rải đều câu mới: {c.raiDeu === false ? 'Tắt' : c.raiDeuMacDinh ? 'Bật (mặc định)' : 'Bật'}</span>
                          </label>
                        ) : (
                          c.raiDeu === false && <small className="cd-phu">Rải đều câu mới: Tắt</small>
                        )}
                      </td>
                      <td>
                        <div className="cd-hang-nut cd-hang-nut--hep">
                          <button type="button" className="m3-nut-vien cd-nut-nho" onClick={() => xemBang(c.id)}>
                            {tt === 'cho_chua' ? 'Mở buổi chữa' : tt === 'da_dong' ? 'Xem lại' : 'Xem bảng'}
                          </button>
                          {!c.hanhTrinh && c.trangThai === 'dang_chay' && (
                            <>
                              <button type="button" className="m3-nut-chu cd-nut-nho" disabled={dangLam === c.id} onClick={() => setDangSua(c)}>
                                Chỉnh sửa
                              </button>
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
      {dangSua && (
        <SuaChienDich
          id={dangSua.id}
          ten={dangSua.ten}
          onDong={() => setDangSua(null)}
          onDaLuu={(kq) => {
            setDangSua(null)
            showToast(`Đã lưu chiến dịch: ${kq.tomTat}${kq.soCauThem > 0 ? ` · ${kq.soCauSau} câu` : ''}`, 'success')
            void tai()
          }}
        />
      )}
    </section>
  )
}
