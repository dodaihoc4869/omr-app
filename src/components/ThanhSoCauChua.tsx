// THANH KÉO SỐ CÂU CHỮA — đặc tả v4 mục 6, một component dùng chung.
//
// Vì sao dùng chung: v3 để mỗi màn tự đặt trần (NutBaiTapPdf 5–60, chỗ khác 10)
// nên cùng một em, cùng một ca, hai màn ra hai số câu khác nhau và không màn nào
// nói được vì sao. v4 chốt: TRẦN LÀ `tongUngVien` — số câu kho THẬT SỰ có cùng
// nhãn với những câu em sai. Màn nào cũng phải dựng thanh bằng file này.
//
// `tongUngVien = 0` thì khoá thanh và nói đúng lý do lấy từ `thieu[]`, không để
// thầy kéo một thanh không sinh ra câu nào.
import { useEffect } from 'react'
import { AlertTriangle, Tags } from 'lucide-react'
import type { PoolCauSai, SuatThieu } from '../lib/rut-de-chua'
import { cauCanhBaoHetHang, cauGiaiThichThanh, cauKhongRutDuoc, soLieuThanhChua } from '../lib/noi-dung-thanh-chua'

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
  // SÀN, TRẦN, KIM và mọi câu chữ lấy từ `noi-dung-thanh-chua` — cùng một nguồn
  // với báo cáo phụ huynh và học sinh (thầy chốt 07/09: "đồng bộ phần rút câu ở
  // đây sang hai chỗ báo cáo phụ huynh và học sinh").
  const sai = soCauSai ?? poolTheoCauSai?.length ?? 0
  const { san, n } = soLieuThanhChua({ soCau, soCauSai: sai, coSan: tongUngVien })
  const canhBao = cauCanhBaoHetHang(poolTheoCauSai)

  // BÁO NGƯỢC SỐ ĐÃ KẸP LÊN CHO MÀN CHA.
  //
  // Không có chỗ này thì thanh hiện 16 (đã kẹp lên sàn) trong khi màn cha vẫn
  // giữ 10 và dựng phiếu 10 câu — con số thầy nhìn thấy khác con số máy làm.
  useEffect(() => {
    if (!khoa && n !== soCau) onDoi(n)
  }, [khoa, n, soCau, onDoi])

  if (khoa) {
    return (
      <div style={{ background: 'var(--do-nen)', borderRadius: 'var(--bo-2)', padding: 'var(--k4)' }}>
        <div className="flex items-center font-bold" style={{ gap: 'var(--k2)', color: 'var(--do)', fontSize: 'var(--cx-2)', fontFamily: 'var(--sans)' }}>
          <AlertTriangle size={16} /> Chưa rút được câu chữa nào
        </div>
        <ul style={{ ...NHAN_NHO, marginTop: 'var(--k2)', paddingLeft: 18, listStyle: 'disc' }}>
          {cauKhongRutDuoc(thieu).map((v, i) => (
            <li key={i}>{v}</li>
          ))}
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
          {MOC_NHAY.filter((m) => m > san && m < tongUngVien).map((m) => (
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
        min={san}
        max={Math.max(san, tongUngVien)}
        step={1}
        value={n}
        onChange={(e) => onDoi(Number(e.target.value))}
        className="w-full"
        style={{ marginTop: 'var(--k2)', accentColor: 'var(--phu-dam)' }}
        aria-label="Số câu chữa"
      />

      {/* Nói MAX VÀ MIN TỪ ĐÂU RA. Không có dòng này thì hai con số là số trên trời. */}
      <div style={{ ...NHAN_NHO, marginTop: 4 }}>{cauGiaiThichThanh({ tongUngVien, soCauSai: sai, san, choBac2 })}</div>

      {canhBao !== '' && <div style={{ ...NHAN_NHO, marginTop: 4, color: 'var(--cam)' }}>{canhBao}</div>}
    </div>
  )
}
