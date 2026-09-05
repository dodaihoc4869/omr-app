// HỘP CHỌN ĐỀ — CÂY BỐN TẦNG, dùng chung cho Mở ca và Gọi lên bảng.
//
// Trước: danh sách phẳng 45 dòng, tích cả chương phải bấm 15 lần. Nay: khối →
// chương → bài → dạng, ô tích ba trạng thái, tích ô chương là chọn hết.
//
// BA THỨ KHÔNG ĐỂ THẦY ĐOÁN:
//   · Thanh tổng LUÔN hiện ở đáy hộp — bao nhiêu câu, chia ba phần thế nào.
//   · Ô tích nửa (gạch ngang) nghĩa là chọn một phần, khác hẳn ô trống.
//   · Gõ vào ô tìm thì cây tự mở đến chỗ có kết quả, không bắt bấm từng tầng.
//
// Mọi luật gom nhóm và trạng thái ô tích nằm trong `src/lib/cay-chon-de.ts`,
// có test. Ở đây chỉ vẽ.
import { useMemo, useState } from 'react'
import { CheckSquare, Square, MinusSquare, Search, ChevronRight, Circle, CircleDot } from 'lucide-react'
import type { TeacherExamSource } from '../data/examContent'
import { bamTich, dungCay, khoiCuaDe, locCay, moiMaTrongCay, tongCau, tongDaChon, trangThaiTich, type Nut } from '../lib/cay-chon-de'

export { khoiCuaDe }
export const KHOI_CO_THE = ['10', '11', '12'] as const

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }

/** Thụt lề theo tầng. Bốn tầng mà thụt đều nhau thì nhìn ra một khối chữ. */
const THUT: Record<Nut['tang'], number> = { khoi: 0, chuong: 14, bai: 28, dang: 42 }
const CO_CHU: Record<Nut['tang'], string> = { khoi: 'var(--cx-2)', chuong: 'var(--cx-2)', bai: 'var(--cx-1)', dang: 'var(--cx-1)' }

function OTich({ tt }: { tt: 'trong' | 'day' | 'nua' }) {
  const mau = tt === 'trong' ? 'var(--mo)' : 'var(--xanh)'
  return <span style={{ color: mau, display: 'flex', flex: '0 0 auto' }}>{tt === 'day' ? <CheckSquare size={18} /> : tt === 'nua' ? <MinusSquare size={18} /> : <Square size={18} />}</span>
}

function Hang({
  n,
  moRong,
  daChon,
  chonNhieu,
  onGap,
  onTich,
}: {
  n: Nut
  moRong: Set<string>
  daChon: Set<string>
  chonNhieu: boolean
  onGap: (khoa: string) => void
  onTich: (n: Nut) => void
}) {
  const la = !!n.maDe
  const mo = moRong.has(n.khoa)
  const tt = trangThaiTich(n, daChon)
  // Chọn MỘT đề (Gọi lên bảng): chỉ lá mới bấm chọn được, tầng trên chỉ gập/mở.
  // Cho tích ô cha ở chế độ chọn một thì bấm một cái là chọn 15 đề — vô nghĩa.
  const tichDuoc = chonNhieu || la
  const nhanSo = tongCau(n.soCau)

  return (
    <>
      <div
        className="flex items-center"
        style={{
          gap: 'var(--k2)',
          minHeight: 40,
          paddingLeft: 8 + THUT[n.tang],
          paddingRight: 'var(--k3)',
          background: la && tt === 'day' ? 'var(--xanh-nen)' : 'transparent',
          borderLeft: `3px solid ${la && tt === 'day' ? 'var(--xanh)' : 'transparent'}`,
          transitionProperty: 'background-color',
          transitionDuration: 'var(--nhanh)',
        }}
      >
        {n.con.length > 0 ? (
          <button type="button" onClick={() => onGap(n.khoa)} aria-expanded={mo} aria-label={mo ? `Gập ${n.nhan}` : `Mở ${n.nhan}`} className="tap-target" style={{ color: 'var(--nhat)', padding: 4, display: 'flex', flex: '0 0 auto' }}>
            <ChevronRight size={16} style={{ transform: mo ? 'rotate(90deg)' : 'none', transitionProperty: 'transform', transitionDuration: 'var(--nhanh)' }} />
          </button>
        ) : (
          <span style={{ width: 24, flex: '0 0 auto' }} />
        )}

        <button
          type="button"
          role={tichDuoc ? (chonNhieu ? 'checkbox' : 'radio') : undefined}
          aria-checked={tichDuoc ? tt !== 'trong' : undefined}
          disabled={!tichDuoc}
          onClick={() => tichDuoc && onTich(n)}
          className="tap-target flex-1 min-w-0 text-left flex items-center"
          style={{ gap: 'var(--k2)', minHeight: 40, color: 'var(--muc)', cursor: tichDuoc ? 'pointer' : 'default' }}
        >
          {tichDuoc ? (
            chonNhieu ? (
              <OTich tt={tt} />
            ) : (
              <span style={{ color: tt === 'day' ? 'var(--xanh)' : 'var(--mo)', display: 'flex', flex: '0 0 auto' }}>{tt === 'day' ? <CircleDot size={18} /> : <Circle size={18} />}</span>
            )
          ) : (
            <span style={{ width: 18, flex: '0 0 auto' }} />
          )}
          <span className={n.tang === 'dang' ? 'truncate' : 'truncate font-bold'} style={{ fontFamily: n.tang === 'khoi' || n.tang === 'chuong' ? 'var(--serif)' : 'var(--sans)', fontSize: CO_CHU[n.tang] }} title={la ? n.nhan : undefined}>
            {n.nhan}
          </span>
          {/* Mã đề vẫn phải hiện ở lá: thầy đối chiếu với file trên máy và với
              lịch sử ca cũ bằng mã, không bằng tên bài. */}
          {la && (
            <span className="truncate" style={{ ...NHAN_NHO, ...SO, flex: '0 1 auto' }}>
              {n.maDe}
            </span>
          )}
        </button>

        <span className="shrink-0 font-bold" style={{ ...SO, fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
          {nhanSo} câu
        </span>
      </div>

      {mo && n.con.map((c) => <Hang key={c.khoa} n={c} moRong={moRong} daChon={daChon} chonNhieu={chonNhieu} onGap={onGap} onTich={onTich} />)}
    </>
  )
}

export interface HopChonDeProps {
  /** Đề đã tách ba phần (xem tach-phan-de.ts). */
  ds: TeacherExamSource[]
  /** Mã đang chọn. Chọn MỘT (Gọi lên bảng) hay NHIỀU (Mở ca) do `chonNhieu`. */
  daChon: Set<string>
  onChon: (maDe: string) => void
  /** Lọc theo nhóm (chip "Tất cả / 12 · CI - Ester lipid") — rỗng = mọi nhóm. */
  nhomLoc?: string
  /** Chiều cao hộp cuộn. */
  cao?: number
  /** Cho tích ô cha và hiện nút Chọn tất cả. */
  chonNhieu?: boolean
  onChonTatCa?: (ma: string[]) => void
}

export default function HopChonDe({ ds, daChon, onChon, nhomLoc = '', cao = 308, chonNhieu, onChonTatCa }: HopChonDeProps) {
  const [tim, setTim] = useState('')
  const [khoi, setKhoi] = useState('')
  /** Nhánh thầy TỰ bấm mở/gập, gắn với chữ đang gõ. Đổi chữ tìm là quay về mặc định. */
  const [moTay, setMoTay] = useState<{ tim: string; set: Set<string> } | null>(null)

  const dsKhoi = useMemo(() => KHOI_CO_THE.filter((k) => ds.some((c) => khoiCuaDe(c) === k)), [ds])

  const dsLoc = useMemo(() => ds.filter((c) => (!khoi || khoiCuaDe(c) === khoi) && (!nhomLoc || (c.nhom || '') === nhomLoc)), [ds, khoi, nhomLoc])
  const cayGoc = useMemo(() => dungCay(dsLoc), [dsLoc])
  const { cay, moKhoa } = useMemo(() => locCay(cayGoc, tim), [cayGoc, tim])

  // TRẠNG THÁI GẬP/MỞ tính NGAY TRONG LÚC VẼ, không qua useEffect. Để effect
  // đặt mặc định thì lần vẽ đầu cây gập sạch rồi mới bung ra — nhìn thấy giật,
  // và test cũng bắt được đúng cái nháy đó.
  //
  //   · không gõ tìm  → mở tầng khối, gập từ chương xuống (đúng đặc tả 4.3)
  //   · đang gõ tìm   → mở đúng nhánh có kết quả
  //   · thầy tự bấm   → theo tay thầy, cho đến khi đổi chữ trong ô tìm
  const macDinh = useMemo(() => new Set(tim.trim() ? moKhoa : cayGoc.map((n) => n.khoa)), [tim, moKhoa, cayGoc])
  const moRong = moTay && moTay.tim === tim ? moTay.set : macDinh

  const gap = (khoa: string) => {
    const ra = new Set(moRong)
    if (ra.has(khoa)) ra.delete(khoa)
    else ra.add(khoa)
    setMoTay({ tim, set: ra })
  }

  const tich = (n: Nut) => {
    if (!chonNhieu) {
      // Chọn một: bấm lá nào thì màn gọi thay hẳn lựa chọn cũ.
      if (n.maDe) onChon(n.maDe)
      return
    }
    if (!onChonTatCa) {
      // Màn chỉ truyền onChon (bật/tắt từng mã) — lá thì bật/tắt, nút cha bó tay.
      if (n.maDe) onChon(n.maDe)
      return
    }
    onChonTatCa([...bamTich(n, daChon)])
  }

  const tong = useMemo(() => tongDaChon(cayGoc, daChon), [cayGoc, daChon])
  const tongTrongLoc = useMemo(() => moiMaTrongCay(cay).length, [cay])

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
      {dsKhoi.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }} role="group" aria-label="Lọc theo khối">
          {['', ...dsKhoi].map((k) => {
            const chon = khoi === k
            return (
              <button
                key={k || '__tat_ca'}
                type="button"
                onClick={() => setKhoi(k)}
                aria-pressed={chon}
                className="tap-target font-bold"
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 'var(--cx-1)',
                  minHeight: 36,
                  padding: '0 var(--k3)',
                  borderRadius: 'var(--bo-tron)',
                  background: chon ? 'var(--xanh-nen)' : 'var(--the-2)',
                  color: chon ? 'var(--xanh)' : 'var(--nhat)',
                  border: `1.5px solid ${chon ? 'var(--xanh)' : 'transparent'}`,
                  transitionProperty: 'background-color, color, border-color',
                  transitionDuration: 'var(--nhanh)',
                }}
              >
                {k ? `Lớp ${k}` : 'Tất cả'}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-center" style={{ gap: 'var(--k2)', height: 44, borderRadius: 'var(--bo-1)', padding: '0 var(--k3)', background: 'var(--the-2)', border: '1.5px solid transparent' }}>
        <Search size={16} style={{ color: 'var(--mo)', flex: '0 0 auto' }} />
        <input
          value={tim}
          onChange={(e) => setTim(e.target.value)}
          placeholder="Tìm chương, bài, mã đề…"
          aria-label="Tìm đề"
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}
        />
        <span style={{ ...NHAN_NHO, ...SO, flex: '0 0 auto' }}>{tongTrongLoc} đề</span>
      </div>

      <div role="tree" aria-label="Cây chọn đề" style={{ maxHeight: cao, overflowY: 'auto', borderRadius: 'var(--bo-2)', border: '1px solid var(--vien)', background: 'var(--the)', overscrollBehavior: 'contain' }}>
        {cay.length === 0 ? (
          <div style={{ ...NHAN_NHO, padding: 'var(--k4)' }}>Không có đề nào khớp "{tim.trim()}".</div>
        ) : (
          cay.map((n) => <Hang key={n.khoa} n={n} moRong={moRong} daChon={daChon} chonNhieu={!!chonNhieu} onGap={gap} onTich={tich} />)
        )}
      </div>

      {/* THANH TỔNG — luôn hiện, kể cả khi chưa chọn gì. Thầy phải biết ca này
          ra bao nhiêu câu mà không phải cuộn đi đâu. */}
      <div className="flex items-center justify-between" style={{ gap: 'var(--k3)', padding: '8px var(--k3)', borderRadius: 'var(--bo-1)', background: 'var(--the-2)' }}>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)' }}>
          Đã chọn: <b style={SO}>{tongCau(tong)}</b> câu
          <span style={{ color: 'var(--nhat)' }}>
            {' · '}I: <b style={SO}>{tong.I}</b> II: <b style={SO}>{tong.II}</b> III: <b style={SO}>{tong.III}</b>
          </span>
        </span>
        {chonNhieu && onChonTatCa && (
          <span className="flex items-center shrink-0" style={{ gap: 'var(--k3)' }}>
            <button type="button" onClick={() => onChonTatCa(moiMaTrongCay(cay))} className="tap-target font-bold" style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
              Chọn hết{tim.trim() || khoi ? ' đang lọc' : ''}
            </button>
            <button type="button" onClick={() => onChonTatCa([])} className="tap-target" style={NHAN_NHO} disabled={daChon.size === 0}>
              Bỏ chọn hết
            </button>
          </span>
        )}
      </div>
    </div>
  )
}
