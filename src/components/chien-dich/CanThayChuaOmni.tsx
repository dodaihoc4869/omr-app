// "CẦN THẦY CHỮA" (OMNI 3 · đặc tả mục 0: việc DUY NHẤT còn lại của thầy) — phần thân thẻ "Cần thầy dạy lại" sẵn có của Bảng chiến dịch khi Bảng bài
// OMNI có số. Đủ BA nhóm, cùng kiểu dòng `cd-ds-cau` đang dùng: (1) vi kỹ năng có thẻ nút thắt · (2) câu sai từ 4 lần đã rời kế hoạch · (3) em sơ ý cao.
// "Chữa xong" giữ ĐÚNG lệnh cũ `/gv/chien-dich {action:'chua-xong', id, qids}` (api.ts `chuaXong`), hỏi lại nói thật hậu quả như nút cũ.
import { useState } from 'react'
import type { CanThayChua } from '../../../server/src/omni-kieu'
import { useAppStore } from '../../store/appStore'
import HopXacNhan from '../HopXacNhan'
import { chuaXong, type CauCanDayLai } from './api'
import { congNgay, hienNgay } from './ngay'
import { nhomCanThayChua } from './omni-bang'

export default function CanThayChuaOmni({
  ds,
  canDayLai,
  chienDichId,
  homNay,
  onDaChua,
}: {
  ds: readonly CanThayChua[]
  canDayLai: readonly CauCanDayLai[]
  chienDichId: string
  homNay: string
  onDaChua: () => void
}) {
  const showToast = useAppStore((s) => s.showToast)
  const [hoi, setHoi] = useState<CanThayChua | null>(null)
  const [dang, setDang] = useState(false)
  const nhom = nhomCanThayChua(ds, canDayLai)

  const chua = async () => {
    if (!hoi?.qids?.length) return
    setDang(true)
    const r = await chuaXong(chienDichId, hoi.qids)
    setDang(false)
    setHoi(null)
    if (!r.ok) {
      showToast(r.chu, 'warn')
      return
    }
    showToast(`Đã ghi chữa xong: ${r.du.soLuot} lượt em, ôn lại từ ${hienNgay(r.du.ngayOnLai)}`, 'success')
    onDaChua()
  }

  const tong = nhom.reduce((s, g) => s + g.dong.length, 0)
  return (
    // Hộp cuộn như danh sách "Cần thầy dạy lại" (thầy 05/10): danh sách dài không đẩy nút chiếu xuống tận cuối trang.
    <div className="cd-ds-cau-cuon" tabIndex={0} role="region" aria-label={`Danh sách cần thầy chữa · ${tong} mục`} data-khoi="can-thay-chua">
      {nhom.map((g) => (
        <div key={g.loai} data-nhom={g.loai}>
          <p className="cd-nhan-nhom">{g.ten}</p>
          {g.dong.length === 0 ? (
            <p className="cd-phu">{g.rong}</p>
          ) : (
            <ul className="cd-ds-cau">
              {g.dong.map((d, i) => (
                <li key={`${g.loai}-${d.vkn ?? d.qids?.join(',') ?? d.sbd?.join(',') ?? i}-${i}`}>
                  {/* Cột phải của Bảng chiến dịch hẹp (340 px): nút "Chữa xong" xuống dòng dưới chữ, số em giữ ở mép phải như dòng cũ. */}
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, flex: '1 1 auto' }}>
                    <span>
                      {/* whiteSpace: luật chung `.cd-ds-cau li b:last-child { nowrap }` (dành cho số "N em" cuối dòng) bắt nhầm tên câu khi dòng
                          không có chữ phụ ⇒ tên dài không xuống dòng, đè lên "N em" (ảnh chụp 05/10: "…đơn chức2 em"). */}
                      <b style={{ whiteSpace: 'normal' }}>{d.tieuDe || '—'}</b>
                      {d.phu && <small className="cd-phu"> · {d.phu}</small>}
                    </span>
                    {d.qids?.length ? (
                      <button type="button" className="m3-nut-vien cd-nut-nho" style={{ whiteSpace: 'nowrap' }} onClick={() => setHoi(d)}>
                        Chữa xong
                      </button>
                    ) : null}
                  </span>
                  <b className="cd-so">{d.soEm} em</b>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {hoi && (
        <HopXacNhan
          tieuDe={`Chữa xong: ${hoi.tieuDe || `${hoi.qids?.length ?? 0} câu`}?`}
          noiDung={
            <p>
              {hoi.soEm} em đang chờ thầy chữa {hoi.qids!.length > 1 ? `${hoi.qids!.length} câu này` : 'câu này'} được mở khoá: câu quay lại Đoàn Hộ Tống của các em từ{' '}
              {hienNgay(congNgay(homNay, 1))}, đếm sai về 0. Việc này không hoàn tác được.
            </p>
          }
          nhanXacNhan="Chữa xong"
          nhanDangLam="Đang ghi…"
          dangLam={dang}
          onXacNhan={() => void chua()}
          onHuy={() => setHoi(null)}
        />
      )}
    </div>
  )
}
