// THẺ "BUỔI CHỮA TỐI NAY (ĐÃ XẾP SẴN)" — đầu mục 2 màn Gọi lên bảng (B6, Code 1, 21/09/2026; Boss duyệt `docs/de-xuat-buoi-chua-xep-san-2109.md`).
// Chỉ TRÌNH BÀY kết quả của `deXuatBuoiChua` (số thật: câu · phút · em cần chú ý · vì sao). Máy chỉ chuẩn bị sẵn; thầy bấm "Mở buổi chữa này" hoặc "Tự chọn lại" (luồng cũ).
// Không có đề xuất (`co: false`) ⇒ KHÔNG vẽ gì (không báo lỗi đỏ). Chữ theo `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`: con số nào cũng có nhãn + đơn vị, nút = động từ + kết quả, không nhãn năng lực, không emoji.
import { NutChinh } from './DesignSystem'
import type { DeXuatBuoiChua } from '../lib/buoi-chua-de-xuat'

/** Số tên em hiện trực tiếp; còn lại gom thành "và N em khác". */
export const SO_TEN_EM_HIEN = 6

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }

/** Câu chữ "em cần chú ý": tên (hoặc SBD nếu thiếu tên) của ≤ 6 em đầu, rồi "và N em khác". */
export function chuEmCanChuY(em: readonly { sbd: string; hoTen: string }[]): string {
  const ten = em.map((e) => e.hoTen.trim() || e.sbd)
  if (ten.length <= SO_TEN_EM_HIEN) return ten.join(', ')
  return `${ten.slice(0, SO_TEN_EM_HIEN).join(', ')} và ${ten.length - SO_TEN_EM_HIEN} em khác`
}

export default function TheBuoiChuaXepSan({ deXuat, dangMo = false, onMo, onTuChon }: { deXuat: DeXuatBuoiChua | null; dangMo?: boolean; onMo: () => void; onTuChon: () => void }) {
  if (!deXuat || !deXuat.co) return null
  const { boQua } = deXuat
  return (
    <section data-buoi-xep-san aria-label="Buổi chữa tối nay đã xếp sẵn" style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3) var(--k4)', marginBottom: 'var(--k3)' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)', fontWeight: 700, color: 'var(--muc)' }}>Buổi chữa tối nay (đã xếp sẵn)</div>
      <div className="flex flex-wrap" style={{ gap: 'var(--k1) var(--k4)', marginTop: 'var(--k2)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)', ...SO }}>
        <span>
          <b>{deXuat.soCau}</b> câu để chữa
        </span>
        <span>
          khoảng <b>{deXuat.phut}</b> phút
        </span>
        <span>
          <b>{deXuat.soEm}</b> em cần chú ý
        </span>
      </div>
      {deXuat.cacLyDo.length > 0 && (
        <ul style={{ margin: 'var(--k2) 0 0', paddingLeft: 'var(--k4)', ...NHAN_NHO, listStyle: 'disc' }}>
          {deXuat.cacLyDo.map((l) => (
            <li key={l} style={SO}>
              {l}
            </li>
          ))}
        </ul>
      )}
      {deXuat.em.length > 0 && (
        <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)', minWidth: 0, overflowWrap: 'anywhere' }} data-em-can-chu-y>
          Em cần chú ý: {chuEmCanChuY(deXuat.em)}
        </div>
      )}
      {boQua.khongCoTrongKho > 0 && (
        <div style={{ ...NHAN_NHO, marginTop: 'var(--k1)' }}>
          <span style={SO}>{boQua.khongCoTrongKho}</span> câu chưa có trên máy này — đồng bộ đề ở Ngân hàng câu hỏi để thêm.
        </div>
      )}
      {boQua.tuLuan > 0 && (
        <div style={{ ...NHAN_NHO, marginTop: 'var(--k1)' }}>
          <span style={SO}>{boQua.tuLuan}</span> câu tự luận không đưa vào buổi xếp sẵn — thầy vẫn thêm tay được.
        </div>
      )}
      <div className="flex flex-wrap items-center" style={{ gap: 'var(--k3)', marginTop: 'var(--k3)' }}>
        <div style={{ flex: '1 1 240px', maxWidth: 360, minWidth: 0 }}>
          <NutChinh onClick={onMo} disabled={dangMo}>
            Mở buổi chữa này
          </NutChinh>
        </div>
        <button
          type="button"
          onClick={onTuChon}
          className="tap-target font-bold"
          style={{ minHeight: 44, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'var(--the)', color: 'var(--muc)', border: '1px solid var(--vien-dam)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
        >
          Tự chọn lại
        </button>
      </div>
    </section>
  )
}
