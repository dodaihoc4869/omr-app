// THANH KÉO SỐ CÂU CHỮA — đặc tả v4 mục 6, một component dùng chung.
//
// Vì sao dùng chung: v3 để mỗi màn tự đặt trần (NutBaiTapPdf 5–60, chỗ khác 10)
// nên cùng một em, cùng một ca, hai màn ra hai số câu khác nhau và không màn nào
// nói được vì sao. v4 chốt: TRẦN LÀ `tongUngVien` — số câu kho THẬT SỰ có cùng
// nhãn với những câu em sai. Màn nào cũng phải dựng thanh bằng file này.
//
// `tongUngVien = 0` thì khoá thanh và nói đúng lý do lấy từ `thieu[]`, không để
// thầy kéo một thanh không sinh ra câu nào.
import { AlertTriangle, Tags } from 'lucide-react'
import { tenCauSai, type PoolCauSai, type SuatThieu } from '../lib/rut-de-chua'

const NHAN_NHO = { fontSize: 'var(--cx-1)', color: 'var(--nhat)', fontFamily: 'var(--sans)' } as const

/** Nút nhảy nhanh của mục 6. "Tối đa" luôn là nút cuối. */
export const MOC_NHAY = [10, 20, 50] as const

export default function ThanhSoCauChua({
  soCau,
  onDoi,
  tongUngVien,
  poolTheoCauSai,
  thieu,
  soCauSai,
  onSangNganHang,
  choBac2,
}: {
  soCau: number
  onDoi: (n: number) => void
  tongUngVien: number
  poolTheoCauSai?: PoolCauSai[]
  thieu?: SuatThieu[]
  soCauSai?: number
  /** Có nút nhảy sang màn Ngân hàng câu hỏi khi nguyên nhân là chưa gán dạng. */
  onSangNganHang?: () => void
  choBac2?: boolean
}) {
  const khoa = tongUngVien <= 0
  const hetDang = (thieu ?? []).some((t) => t.vi.includes('chưa gắn dạng'))
  const n = Math.min(Math.max(1, soCau), Math.max(1, tongUngVien))
  const canhBao = (poolTheoCauSai ?? []).filter((p) => p.pool === 0)

  if (khoa) {
    return (
      <div style={{ background: 'var(--do-nen)', borderRadius: 'var(--bo-2)', padding: 'var(--k4)' }}>
        <div className="flex items-center font-bold" style={{ gap: 'var(--k2)', color: 'var(--do)', fontSize: 'var(--cx-2)', fontFamily: 'var(--sans)' }}>
          <AlertTriangle size={16} /> Chưa rút được câu chữa nào
        </div>
        <ul style={{ ...NHAN_NHO, marginTop: 'var(--k2)', paddingLeft: 18, listStyle: 'disc' }}>
          {(thieu ?? []).slice(0, 6).map((t, i) => (
            <li key={i}>{t.vi}</li>
          ))}
          {(thieu ?? []).length === 0 && <li>Ca này chưa có câu nào sai.</li>}
        </ul>
        {hetDang && onSangNganHang && (
          <button
            className="tap-target font-bold flex items-center"
            onClick={onSangNganHang}
            style={{ gap: 'var(--k2)', marginTop: 'var(--k3)', padding: '8px 14px', borderRadius: 'var(--bo-1)', background: 'var(--do)', color: 'var(--nen)', fontSize: 'var(--cx-1)', fontFamily: 'var(--sans)' }}
          >
            <Tags size={14} /> Sang Ngân hàng câu hỏi để gán dạng
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k2)' }}>
        <span className="font-bold" style={{ fontSize: 'var(--cx-2)', fontFamily: 'var(--sans)' }}>
          Số câu chữa: <b style={{ fontVariantNumeric: 'tabular-nums' }}>{n}</b> / tối đa {tongUngVien}
        </span>
        <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
          {MOC_NHAY.filter((m) => m < tongUngVien).map((m) => (
            <button
              key={m}
              className="tap-target font-bold"
              onClick={() => onDoi(m)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--bo-tron)',
                background: n === m ? 'var(--phu-dam)' : 'var(--the-2)',
                color: n === m ? 'var(--muc-nguoc)' : 'var(--muc)',
                fontSize: 'var(--cx-1)',
                fontFamily: 'var(--sans)',
              }}
            >
              {m}
            </button>
          ))}
          <button
            className="tap-target font-bold"
            onClick={() => onDoi(tongUngVien)}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--bo-tron)',
              background: n === tongUngVien ? 'var(--phu-dam)' : 'var(--the-2)',
              color: n === tongUngVien ? 'var(--muc-nguoc)' : 'var(--muc)',
              fontSize: 'var(--cx-1)',
              fontFamily: 'var(--sans)',
            }}
          >
            Tối đa
          </button>
        </div>
      </div>

      <input
        type="range"
        min={1}
        max={tongUngVien}
        step={1}
        value={n}
        onChange={(e) => onDoi(Number(e.target.value))}
        className="w-full"
        style={{ marginTop: 'var(--k2)', accentColor: 'var(--phu-dam)' }}
        aria-label="Số câu chữa"
      />

      {/* Nói MAX TỪ ĐÂU RA. Không có dòng này thì con số 90 là số trên trời. */}
      <div style={{ ...NHAN_NHO, marginTop: 4 }}>
        Kho có {tongUngVien} câu cùng dạng với {soCauSai ?? poolTheoCauSai?.length ?? 0} câu em sai
        {choBac2 ? ' (đã tính thêm câu cùng cơ chế)' : ''}.
      </div>

      {canhBao.length > 0 && (
        <div style={{ ...NHAN_NHO, marginTop: 4, color: 'var(--cam)' }}>
          {/* KÈM PHẦN. Không có phần thì dòng này nói "câu 2" trong khi phiếu vẫn
              in câu khắc phục cho một câu 2 khác — thầy bắt được 07/09. */}
          Kho chưa có câu cùng dạng để chữa: {canhBao.map((p) => tenCauSai(p.phan, p.soCau)).join(' · ')}. Những câu này đưa lại chính đề em làm sai để em làm lại.
        </div>
      )}
    </div>
  )
}
