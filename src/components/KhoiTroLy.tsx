// TRỢ LÝ TRONG APP — Ô NHẮN (TRO-LY-TRONG-APP.md mục Màn hình).
//
// Thầy đang đứng lớp, cầm điện thoại, muốn một con số ngay mà không phải nhớ
// nó nằm ở màn nào. Chạm bong bóng, gõ câu hỏi, ra ngay.
//
// Ba tầng ở `src/lib/tro-ly/` lo phần nghĩ; component này chỉ lo phần hiện.
// Không nhét luật nhận dạng câu hỏi vào đây — một nguồn sự thật là `y-dinh.ts`.
import { useEffect, useRef, useState } from 'react'
import { Check, Copy, CornerDownLeft, RefreshCw } from 'lucide-react'
import { layDuLieu, quenHet } from '../lib/tro-ly/nguon'
import { dungTraLoi, khongHieu, type TraLoi } from '../lib/tro-ly/tra-loi'
import { CAU_GOI_Y, docYDinh } from '../lib/tro-ly/y-dinh'

interface Dong {
  ai: 'thay' | 'may'
  chu: string
  dong?: string[]
  nguon?: string
  /** Khối chữ chép một chạm — dùng cho danh sách link báo cáo. */
  chep?: string
}

export interface KhoiTroLyProps {
  scriptUrl: string
  secret: string
}

const CHU_NHO: React.CSSProperties = { fontSize: 12, color: 'var(--nhat)', lineHeight: 1.6 }

export default function KhoiTroLy({ scriptUrl, secret }: KhoiTroLyProps) {
  const [hoi, setHoi] = useState('')
  const [dong, setDong] = useState<Dong[]>([])
  const [dangNghi, setDangNghi] = useState(false)
  /** Chỉ số dòng vừa được chép — để đổi nhãn nút trong hai giây. */
  const [daChep, setDaChep] = useState(-1)
  const cuoiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    cuoiRef.current?.scrollIntoView({ block: 'end' })
  }, [dong, dangNghi])

  const chuaCauHinh = !scriptUrl.trim() || !secret.trim()

  const gui = async (cau: string) => {
    const q = cau.trim()
    if (!q || dangNghi) return
    setHoi('')
    setDong((cu) => [...cu, { ai: 'thay', chu: q }])
    setDangNghi(true)
    try {
      const y = docYDinh(q)
      // Câu hỏi cần dữ liệu mà máy chưa có cấu hình thì NÓI THẲNG, không dựng
      // câu trả lời rỗng rồi để thầy tưởng là chưa có dữ liệu thật.
      if (y.loai !== 'huong_dan' && y.loai !== 'khong_hieu' && chuaCauHinh) {
        setDong((cu) => [...cu, { ai: 'may', chu: 'Chưa có link Apps Script hoặc mã bí mật. Vào Ngân hàng câu hỏi → Cấu hình để nhập, rồi hỏi lại.' }])
        return
      }
      const { duLieu, hoiLai } = await layDuLieu(y, scriptUrl, secret)
      if (hoiLai) {
        setDong((cu) => [...cu, { ai: 'may', chu: hoiLai }])
        return
      }
      const t: TraLoi = y.loai === 'khong_hieu' ? khongHieu() : dungTraLoi(y, duLieu)
      setDong((cu) => [...cu, { ai: 'may', chu: t.chu, dong: t.dong, nguon: t.nguon, chep: t.chep }])
    } catch (e) {
      setDong((cu) => [...cu, { ai: 'may', chu: e instanceof Error ? e.message : 'Không tra được. Thầy thử lại khi mạng ổn.' }])
    } finally {
      setDangNghi(false)
    }
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 0, flex: '1 1 auto' }}>
      <div className="overflow-y-auto px-4 py-3" style={{ flex: '1 1 auto', minHeight: 0 }}>
        {dong.length === 0 && (
          <div className="space-y-3">
            <div style={CHU_NHO}>
              Hỏi bằng tiếng Việt về đúng dữ liệu trong app: ca thi, học sinh, kho đề, câu hỏi của em, hộp thư. Không có dữ liệu thì Thầy sẽ được báo là không có, máy không đoán.
            </div>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {CAU_GOI_Y.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => void gui(c)}
                  className="tap-target text-left"
                  style={{ minHeight: 44, padding: '10px 12px', borderRadius: 14, border: '1px solid var(--vien-dam)', background: 'none', color: 'var(--muc)', fontSize: 14 }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {dong.map((d, i) => (
            <div key={i} className={d.ai === 'thay' ? 'flex justify-end' : ''}>
              <div
                style={{
                  maxWidth: '92%',
                  padding: '10px 12px',
                  borderRadius: 14,
                  background: d.ai === 'thay' ? 'var(--chinh)' : 'var(--the-2)',
                  color: d.ai === 'thay' ? 'var(--muc-nguoc)' : 'var(--muc)',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{d.chu}</div>
                {d.dong && d.dong.length > 0 && (
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18, listStyle: 'disc' }}>
                    {d.dong.map((x, k) => (
                      <li key={k} style={{ marginTop: 2 }}>
                        {x}
                      </li>
                    ))}
                  </ul>
                )}
                {d.chep ? (
                  <button
                    type="button"
                    onClick={() => {
                      // Không có clipboard (trình duyệt cũ, không phải HTTPS)
                      // thì đừng im lặng — đổi nhãn báo cho thầy biết.
                      navigator.clipboard
                        ?.writeText(d.chep as string)
                        .then(() => setDaChep(i))
                        .catch(() => setDaChep(-2))
                      window.setTimeout(() => setDaChep(-1), 2000)
                    }}
                    className="tap-target inline-flex items-center font-bold"
                    style={{ gap: 6, marginTop: 8, minHeight: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--vien-dam)', background: 'none', color: 'var(--muc)', fontSize: 13 }}
                  >
                    {daChep === i ? <Check size={15} /> : <Copy size={15} />}
                    {daChep === i ? 'Đã chép' : daChep === -2 ? 'Máy không cho chép — bôi đen ở trên' : 'Chép để dán Zalo'}
                  </button>
                ) : null}
                {d.nguon ? <div style={{ ...CHU_NHO, marginTop: 6 }}>Nguồn: {d.nguon}</div> : null}
              </div>
            </div>
          ))}
          {dangNghi && <div style={CHU_NHO}>Đang tra…</div>}
        </div>
        <div ref={cuoiRef} />
      </div>

      <div className="flex items-center px-3 py-2" style={{ gap: 8, borderTop: '1px solid var(--vien)' }}>
        <input
          value={hoi}
          onChange={(e) => setHoi(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void gui(hoi)
            }
          }}
          placeholder="Thầy muốn biết gì?"
          aria-label="Câu hỏi cho trợ lý"
          style={{ flex: '1 1 auto', minWidth: 0, height: 44, borderRadius: 12, padding: '0 12px', border: '1px solid var(--vien-dam)', background: 'var(--the)', color: 'var(--muc)', fontSize: 14, outline: 'none' }}
        />
        <button
          type="button"
          onClick={() => void gui(hoi)}
          disabled={!hoi.trim() || dangNghi}
          aria-label="Gửi câu hỏi"
          className="tap-target shrink-0 flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: hoi.trim() ? 'var(--chinh)' : 'var(--the-2)', color: hoi.trim() ? 'var(--muc-nguoc)' : 'var(--mo)' }}
        >
          <CornerDownLeft size={18} />
        </button>
        {dong.length > 0 && (
          <button
            type="button"
            onClick={() => {
              quenHet()
              setDong([])
            }}
            aria-label="Hỏi lại cho mới"
            title="Quên số cũ, hỏi lại cho mới"
            className="tap-target shrink-0 flex items-center justify-center"
            style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: 'none', color: 'var(--nhat)' }}
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
