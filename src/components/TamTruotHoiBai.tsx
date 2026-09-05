// TẤM TRƯỢT CHỌN CÂU HỎI THẦY — HOIBAITHAY.md mục 4A và 6.
//
// Em nộp bài xong, tick những câu chưa hiểu rồi gửi. BA CHẠM: mở tấm trượt →
// tick → Gửi (tiêu chí trải nghiệm số 1).
//
// DANH SÁCH DỰNG TẠI MÁY EM, KHÔNG GỌI MÁY CHỦ — bộ câu đã nằm sẵn trong bộ
// nhớ màn làm bài, nên tấm trượt hiện dưới 300 ms.
//
// CHỖ DỄ SAI NHẤT: chấm đỏ "câu em làm sai" và nút "Tick hết câu em làm sai"
// CHỈ hiện khi ca ĐÃ CÔNG BỐ ĐIỂM. Hiện sớm là lộ đáp án cho cả lớp — em nào
// nộp trước mở tấm trượt ra là biết mình sai câu nào, nhắn cho bạn chưa nộp.
// Đây là điều cấm số 3.
import { useMemo, useState } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { NutChinh, OThongBao } from './DesignSystem'
import { TOI_DA_GHI_CHU, loiNhacTickNhieu } from '../lib/hoi-bai'

/** Một câu trong tấm trượt — đủ để em nhận ra câu nào, không hơn. */
export interface CauChon {
  qid: string
  phan: 'I' | 'II' | 'III'
  /** Số thứ tự trong phần, 1-based — đúng con số em nhìn thấy lúc làm bài. */
  soCau: number
  /** Hai dòng đầu của đề. Câu chỉ có ảnh thì chuỗi rỗng. */
  trich: string
  /** Em làm sai câu này. CHỈ được truyền vào khi ca đã công bố điểm. */
  sai?: boolean
}

export interface TamTruotHoiBaiProps {
  cau: CauChon[]
  /** Ca đã công bố điểm chưa. Chưa thì giấu mọi dấu hiệu đúng/sai. */
  daCongBo: boolean
  /** Những câu em đã hỏi lần trước — mở ra là tick sẵn để em sửa. */
  daHoi?: string[]
  ghiChuCu?: string
  dang?: boolean
  loi?: string
  dong: () => void
  gui: (qids: string[], ghiChu: string) => void
}

const NHAN: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }
const TEN_PHAN: Record<string, string> = { I: 'Phần I', II: 'Phần II', III: 'Phần III' }

export default function TamTruotHoiBai({ cau, daCongBo, daHoi = [], ghiChuCu = '', dang = false, loi = '', dong, gui }: TamTruotHoiBaiProps) {
  const [chon, setChon] = useState<Set<string>>(() => new Set(daHoi))
  const [ghiChu, setGhiChu] = useState(ghiChuCu)

  const bat = (qid: string) =>
    setChon((cu) => {
      const m = new Set(cu)
      if (m.has(qid)) m.delete(qid)
      else m.add(qid)
      return m
    })

  // Chỉ có nghĩa khi đã công bố — trước đó `sai` luôn undefined nên mảng rỗng
  // và nút chọn nhanh không dựng.
  const cauSai = useMemo(() => (daCongBo ? cau.filter((c) => c.sai) : []), [cau, daCongBo])
  const nhac = loiNhacTickNhieu(chon.size, cau.length)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'var(--phu)' }}>
      <div
        className="w-full flex flex-col"
        style={{ maxWidth: 480, maxHeight: '90vh', background: 'var(--the)', borderRadius: 'var(--bo-3) var(--bo-3) 0 0', boxShadow: 'var(--bong-2)' }}
      >
        <div className="shrink-0 flex items-start justify-between" style={{ padding: 'var(--k5) var(--k5) var(--k3)', borderBottom: '1px solid var(--vien)' }}>
          <div>
            <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)' }}>
              Hỏi bài Thầy
            </div>
            <div style={NHAN}>Tick những câu em chưa hiểu</div>
          </div>
          <button onClick={dong} aria-label="Đóng" className="shrink-0 flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: 'var(--the-2)', color: 'var(--nhat)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--k3) var(--k5)' }}>
          {cauSai.length > 0 && (
            <button
              type="button"
              onClick={() => setChon(new Set(cauSai.map((c) => c.qid)))}
              className="tap-target font-bold"
              style={{ minHeight: 40, marginBottom: 'var(--k3)', padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', border: 'none', background: 'var(--the-2)', color: 'var(--muc)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
            >
              Tick hết câu em làm sai ({cauSai.length})
            </button>
          )}

          <div className="flex flex-col" style={{ gap: 2 }}>
            {cau.map((c) => {
              const daChon = chon.has(c.qid)
              return (
                <button
                  key={c.qid}
                  type="button"
                  role="checkbox"
                  aria-checked={daChon}
                  onClick={() => bat(c.qid)}
                  className="tap-target flex items-start text-left"
                  style={{
                    gap: 'var(--k3)',
                    minHeight: 48,
                    padding: 'var(--k2) var(--k3)',
                    borderRadius: 'var(--bo-1)',
                    border: 'none',
                    background: daChon ? 'var(--the-2)' : 'transparent',
                  }}
                >
                  <span
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      width: 22,
                      height: 22,
                      marginTop: 2,
                      borderRadius: 6,
                      border: daChon ? 'none' : '1.5px solid var(--vien-dam)',
                      background: daChon ? 'var(--phu-dam)' : 'transparent',
                      color: 'var(--muc-nguoc)',
                    }}
                  >
                    {daChon && <Check size={14} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center" style={{ gap: 6 }}>
                      <b style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}>
                        {TEN_PHAN[c.phan]} · Câu {c.soCau}
                      </b>
                      {daCongBo && c.sai && <span aria-label="Câu em làm sai" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--do)' }} />}
                    </span>
                    <span className="block" style={{ ...NHAN, color: 'var(--muc-2)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.trich || '(câu có hình)'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 'var(--k4)' }}>
            <div style={{ ...NHAN, marginBottom: 'var(--k1)' }}>Em chưa hiểu chỗ nào? (không bắt buộc)</div>
            <textarea
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value.slice(0, TOI_DA_GHI_CHU))}
              maxLength={TOI_DA_GHI_CHU}
              rows={3}
              aria-label="Em chưa hiểu chỗ nào"
              style={{ width: '100%', borderRadius: 'var(--bo-1)', padding: 'var(--k3)', background: 'var(--the-2)', border: '1.5px solid transparent', fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)', color: 'var(--muc)', outline: 'none', resize: 'vertical' }}
            />
            <div style={{ ...NHAN, textAlign: 'right' }}>
              {ghiChu.length}/{TOI_DA_GHI_CHU}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col" style={{ gap: 'var(--k2)', padding: 'var(--k3) var(--k5) var(--k5)', borderTop: '1px solid var(--vien)' }}>
          {/* NHẮC THÔI, VẪN CHO GỬI — em vướng thật cả bài thì đó là thông tin
              thầy cần biết (điều cấm số 6). */}
          {nhac && <OThongBao tone="cam">{nhac}</OThongBao>}
          {loi && <OThongBao tone="do">{loi}</OThongBao>}
          <NutChinh onClick={() => gui([...chon], ghiChu)} disabled={dang || chon.size === 0}>
            {dang ? (
              <span className="inline-flex items-center" style={{ gap: 6 }}>
                <Loader2 size={16} className="animate-spin" /> Đang gửi…
              </span>
            ) : (
              `Gửi ${chon.size} câu cho Thầy`
            )}
          </NutChinh>
        </div>
      </div>
    </div>
  )
}
