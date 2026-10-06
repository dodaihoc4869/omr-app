/**
 * KHUNG LỜI GIẢI TRONG GAME — một khuôn duy nhất cho Leo Tháp và Săn Câu Sai.
 *
 * Thầy bắt được 15-09 trên bản live: màn hình in nguyên chuỗi
 * `{"chot":"…","tung_pa":{"A":{"dung":false,"vi_sao":"…"}},"dap_an_de":"C",…}`
 * cho học sinh đọc. Nguyên nhân: kho ghi lời giải bằng JSON có cấu trúc, còn
 * game thì `String(loiGiai)` rồi dán thẳng vào thông báo.
 *
 * Khuôn hiện ra (CHUẨN HIỂN THỊ 06/10): dải Đáp án / Em chọn, rồi khối LỜI GIẢI chuẩn
 * (`KhoiLoiGiaiChuan`: LỜI GIẢI → Kiến thức cốt lõi → từng phương án ✓ ✗ → bước).
 *
 * Dùng chung `chuanHoaLoiGiaiCau` với mọi báo cáo, không viết bộ đọc thứ hai.
 *
 * KHÔNG BỊA: kho thiếu lời giải thì nói thẳng là thiếu.
 */

import { AlertTriangle } from 'lucide-react'
import KhoiLoiGiaiChuan, { loiGiaiChuanTuKho } from './loi-giai/KhoiLoiGiaiChuan'

/**
 * Cờ đối chiếu của kho: `trang_thai` là `khop` khi đáp án máy tự giải trùng đáp
 * án tác giả đề, `lech` khi không trùng. LỆCH thì phải nói ra — câu đó có thể
 * sai đáp án, và để học sinh học thuộc một câu sai là hỏng hơn không học.
 */
export function docCoDoiChieu(tho: unknown): { lech: boolean; ghiChu: string } {
  let o: unknown = tho
  if (typeof o === 'string') {
    const t = o.trim()
    if (t.startsWith('{') && t.endsWith('}')) {
      try { o = JSON.parse(t) } catch { return { lech: false, ghiChu: '' } }
    } else return { lech: false, ghiChu: '' }
  }
  if (!o || typeof o !== 'object') return { lech: false, ghiChu: '' }
  const r = o as Record<string, unknown>
  const tt = String(r.trang_thai ?? r.trangThai ?? '').trim().toLowerCase()
  const de = String(r.dap_an_de ?? r.dapAnDe ?? '').trim().toUpperCase()
  const tg = String(r.dap_an_tu_giai ?? r.dapAnTuGiai ?? '').trim().toUpperCase()
  const lech = tt === 'lech' || (tt === '' && de !== '' && tg !== '' && de !== tg)
  return { lech, ghiChu: String(r.ghi_chu ?? r.ghiChu ?? '').trim() }
}

export default function KhungLoiGiaiGame({
  loiGiaiTho,
  dapAnDung,
  daChon,
  phuongAn,
  duPhong,
  phan = 'I',
}: {
  /** Lời giải nguyên bản từ kho: object, chuỗi JSON, hay chữ thô đều được. */
  loiGiaiTho: unknown
  /** Chỉ số phương án đúng, 0–3. */
  dapAnDung: number
  /** Chỉ số phương án em vừa chọn; −1 là hết giờ. */
  daChon: number
  phuongAn: readonly string[]
  /** Câu dự phòng khi kho không có lời giải — không phải để thay lời giải. */
  duPhong?: string
  phan?: string
}) {
  const CHU = ['A', 'B', 'C', 'D']
  const chuDung = CHU[dapAnDung] ?? ''
  const lg = loiGiaiChuanTuKho(loiGiaiTho, 'I', chuDung)
  const co = docCoDoiChieu(loiGiaiTho)
  void phan // game chỉ có Phần I (bốn phương án)

  return (
    <div className="text-left">
      {/* ĐÁP ÁN — dải nhãn phía trên khối lời giải */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-full font-bold" style={{ background: 'var(--xanh-nen)', color: 'var(--muc)', border: '1px solid var(--xanh)' }}>
          Đáp án: {chuDung}
        </span>
        {daChon >= 0 && daChon !== dapAnDung && (
          <span className="px-2.5 py-1 rounded-full font-bold" style={{ background: 'var(--do-nen)', color: 'var(--muc)', border: '1px solid var(--do)' }}>
            Em chọn: {CHU[daChon] ?? '?'}
          </span>
        )}
        {daChon < 0 && (
          <span className="px-2.5 py-1 rounded-full font-bold" style={{ background: 'var(--cam-nen)', color: 'var(--muc)', border: '1px solid var(--cam)' }}>
            Hết giờ, chưa kịp chọn
          </span>
        )}
      </div>

      {/* Cờ đối chiếu lệch — nói thẳng, không giấu */}
      {co.lech && (
        <div className="flex items-start gap-2 p-2.5 mt-3 rounded-xl text-[13px]" style={{ background: 'var(--cam-nen)', color: 'var(--muc)', border: '1px solid var(--cam)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <b>Câu này đang lệch đáp án.</b> Thầy Đỗ Đại Học tự giải ra một đáp án, tác giả đề ghi
            một đáp án khác. Em hỏi lại thầy trước khi tin lời giải dưới đây.
            {co.ghiChu !== '' && <> ({co.ghiChu})</>}
          </span>
        </div>
      )}

      <div>
        <KhoiLoiGiaiChuan
          phan="I"
          loiGiai={lg}
          explanation={!lg && duPhong ? duPhong : undefined}
          correct={chuDung}
          phuongAn={phuongAn}
          daChon={CHU[daChon]}
        />
      </div>
    </div>
  )
}
