// HỘP CHỌN ĐỀ — dùng chung cho Mở ca và Gọi lên bảng.
//
// Thầy chốt 04-09 tối: "làm cái ô này gọn lại để tôi lướt tìm trong cái ô đó".
// Kho 8 đề tách ba phần là 24 dòng; mỗi dòng cao 80px như trước thì riêng
// danh sách đã dài hai màn hình, phần Lớp & thời gian bị đẩy tít xuống dưới.
//
// Nay: ô tìm dính ở trên, danh sách cuộn TRONG HỘP cao cố định (~5,5 dòng —
// nửa dòng cuối lộ ra để thầy biết còn nữa), mỗi dòng gọn một hàng: ô tích ·
// mã đề · phần · số câu. Bài gốc in một lần làm tiêu đề nhóm, ba dòng con
// thụt vào dưới nó — không lặp "cùng bài 10-C1-B1" ba lần.
import { useMemo, useState } from 'react'
import { CheckSquare, Square, Search } from 'lucide-react'
import type { TeacherExamSource } from '../data/examContent'
import { goMaDeTachRa, TEN_PHAN_TACH } from '../lib/tach-phan-de'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }

/** Nhãn ngắn của phần, in trong viên nhỏ cạnh mã. */
const NHAN_PHAN: Record<'I' | 'II' | 'III', string> = { I: 'TN', II: 'ĐS', III: 'TLN' }

/** KHỐI của một đề (10 / 11 / 12), đọc từ đầu mã đề (`10-C1-B1`) hoặc đầu nhóm
 * (`10 · C1 - Nguyên Tử`). Không nhận ra thì trả '' — đề vẫn hiện ở "Tất cả".
 *
 * Thầy chốt 04-09 khuya: "tạo cho tôi 3 bộ lọc đề là 10, 11, 12 ở cả mục gọi
 * lên bảng và mục tạo ca". Kho giờ có ba khối, 24 dòng, lướt tìm đề lớp 12 mà
 * phải qua hết lớp 10, 11 là mất thời gian trên lớp. */
export function khoiCuaDe(c: Pick<TeacherExamSource, 'maDe' | 'nhom'>): string {
  const m = /^(10|11|12)\b/.exec(c.maDe) || /^(10|11|12)\b/.exec(c.nhom || '')
  return m ? m[1] : ''
}
export const KHOI_CO_THE = ['10', '11', '12'] as const

export interface HopChonDeProps {
  /** Đề đã tách ba phần (xem tach-phan-de.ts). */
  ds: TeacherExamSource[]
  /** Mã đang chọn. Chọn MỘT (Gọi lên bảng) hay NHIỀU (Mở ca) do chỗ gọi quyết. */
  daChon: Set<string>
  onChon: (maDe: string) => void
  /** Lọc theo nhóm (chip "Tất cả / 12 · CI - Ester lipid") — rỗng = mọi nhóm. */
  nhomLoc?: string
  /** Chiều cao hộp cuộn. Mặc định vừa 5,5 dòng. */
  cao?: number
  /** Hiện nút Chọn tất cả / Bỏ chọn (chỉ khi cho chọn nhiều). */
  chonNhieu?: boolean
  onChonTatCa?: (ma: string[]) => void
}

export default function HopChonDe({ ds, daChon, onChon, nhomLoc = '', cao = 308, chonNhieu, onChonTatCa }: HopChonDeProps) {
  const [tim, setTim] = useState('')
  const [khoi, setKhoi] = useState('')

  // Chỉ bày chip cho khối THỰC CÓ trong kho; kho toàn lớp 12 thì không bày ba chip
  // mà hai chip bấm vào trống trơn.
  const dsKhoi = useMemo(() => KHOI_CO_THE.filter((k) => ds.some((c) => khoiCuaDe(c) === k)), [ds])

  const loc = useMemo(() => {
    const q = tim.trim().toLowerCase()
    return ds.filter(
      (c) =>
        (!khoi || khoiCuaDe(c) === khoi) &&
        (!nhomLoc || (c.nhom || '') === nhomLoc) &&
        (!q || c.maDe.toLowerCase().includes(q) || (c.nhom || '').toLowerCase().includes(q) || (c.nguon || '').toLowerCase().includes(q)),
    )
  }, [ds, tim, nhomLoc, khoi])

  // Gom theo bài gốc để in tiêu đề nhóm một lần.
  const nhom = useMemo(() => {
    const ra: { goc: string; nhom: string; dong: TeacherExamSource[] }[] = []
    for (const c of loc) {
      const { goc } = goMaDeTachRa(c.maDe)
      const cuoi = ra[ra.length - 1]
      if (cuoi && cuoi.goc === goc) cuoi.dong.push(c)
      else ra.push({ goc, nhom: c.nhom || '', dong: [c] })
    }
    return ra
  }, [loc])

  const tongChon = loc.filter((c) => daChon.has(c.maDe)).length

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
          placeholder="Tìm mã đề, bài, nhóm…"
          aria-label="Tìm đề"
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}
        />
        <span style={{ ...NHAN_NHO, ...SO, flex: '0 0 auto' }}>
          {tongChon > 0 ? `${tongChon}/${loc.length}` : `${loc.length} đề`}
        </span>
      </div>

      <div
        role="listbox"
        aria-multiselectable={chonNhieu ? true : undefined}
        aria-label="Danh sách đề"
        style={{ maxHeight: cao, overflowY: 'auto', borderRadius: 'var(--bo-2)', border: '1px solid var(--vien)', background: 'var(--the)', overscrollBehavior: 'contain' }}
      >
        {loc.length === 0 && <div style={{ ...NHAN_NHO, padding: 'var(--k4)' }}>Không có đề nào khớp "{tim.trim()}".</div>}
        {nhom.map((g) => (
          <div key={g.goc}>
            <div className="flex items-baseline justify-between" style={{ padding: '8px var(--k3) 4px', position: 'sticky', top: 0, background: 'var(--the)', zIndex: 1, borderBottom: '1px solid var(--vien)' }}>
              <span className="font-bold truncate" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                {g.goc}
              </span>
              {g.nhom && (
                <span className="truncate" style={{ ...NHAN_NHO, marginLeft: 'var(--k2)' }}>
                  {g.nhom}
                </span>
              )}
            </div>
            {g.dong.map((c) => {
              const chon = daChon.has(c.maDe)
              const { phan } = goMaDeTachRa(c.maDe)
              const n = c.phanI.length + c.phanII.length + c.phanIII.length
              return (
                <button
                  key={c.maDe}
                  type="button"
                  role="option"
                  aria-selected={chon}
                  onClick={() => onChon(c.maDe)}
                  className="tap-target w-full text-left flex items-center"
                  data-trang-thai={chon ? 'chon' : undefined}
                  style={{
                    gap: 'var(--k2)',
                    minHeight: 44,
                    padding: '6px var(--k3) 6px var(--k4)',
                    background: chon ? 'var(--xanh-nen)' : 'transparent',
                    borderLeft: `3px solid ${chon ? 'var(--xanh)' : 'transparent'}`,
                    color: 'var(--muc)',
                    transitionProperty: 'background-color',
                    transitionDuration: 'var(--nhanh)',
                  }}
                >
                  <span className="shrink-0" style={{ color: chon ? 'var(--xanh)' : 'var(--mo)', display: 'flex' }}>
                    {chon ? <CheckSquare size={18} /> : <Square size={18} />}
                  </span>
                  <span className="flex-1 min-w-0 flex items-center" style={{ gap: 'var(--k2)' }}>
                    <span className="font-bold truncate" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
                      {c.maDe}
                    </span>
                    {phan && (
                      <span
                        className="shrink-0"
                        title={TEN_PHAN_TACH[phan]}
                        style={{ ...NHAN_NHO, ...SO, fontWeight: 700, padding: '1px 7px', borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', color: 'var(--nhat)' }}
                      >
                        {NHAN_PHAN[phan]}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-bold" style={{ ...SO, fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
                    {n} câu
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {chonNhieu && loc.length > 1 && onChonTatCa && (
        <div className="flex items-center" style={{ gap: 'var(--k4)', ...NHAN_NHO }}>
          <button type="button" onClick={() => onChonTatCa(loc.map((c) => c.maDe))} className="tap-target" style={{ color: 'var(--muc)', fontWeight: 700 }}>
            Chọn tất cả{tim.trim() ? ' đang lọc' : ''}
          </button>
          <button type="button" onClick={() => onChonTatCa([])} className="tap-target">
            Bỏ chọn
          </button>
        </div>
      )}
    </div>
  )
}
