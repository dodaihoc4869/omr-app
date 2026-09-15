/**
 * KHUNG LỜI GIẢI TRONG GAME — một khuôn duy nhất cho Leo Tháp và Săn Câu Sai.
 *
 * Thầy bắt được 15-09 trên bản live: màn hình in nguyên chuỗi
 * `{"chot":"…","tung_pa":{"A":{"dung":false,"vi_sao":"…"}},"dap_an_de":"C",…}`
 * cho học sinh đọc. Nguyên nhân: kho ghi lời giải bằng JSON có cấu trúc, còn
 * game thì `String(loiGiai)` rồi dán thẳng vào thông báo.
 *
 * Khuôn hiện ra, đúng thứ tự thầy đã chốt cho mọi báo cáo:
 *   1. Đáp án
 *   2. KIẾN THỨC CỐT LÕI
 *   3. VÌ SAO CHỌN / KHÔNG CHỌN — đủ bốn phương án
 *   4. LÀM TỪNG BƯỚC (nếu kho có)
 *
 * Dùng chung `chuanHoaLoiGiaiCau` với báo cáo phụ huynh, không viết bộ đọc thứ
 * hai — hai bộ đọc là hai cách hiểu khác nhau về cùng một kho.
 *
 * KHÔNG BỊA: kho thiếu lời giải thì nói thẳng là thiếu.
 */

import { AlertTriangle, BookOpen, Check, X } from 'lucide-react'
import { chuanHoaLoiGiaiCau, CHUA_CO_LOI_GIAI } from '../lib/chuan-hoa-loi-giai'

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
  const lg = chuanHoaLoiGiaiCau(loiGiaiTho, phan, chuDung)
  const co = docCoDoiChieu(loiGiaiTho)

  // Kho không có lý do từng phương án thì dựng khung rỗng theo đúng bốn phương
  // án của câu — có khung mà không có chữ, chứ KHÔNG tự nghĩ ra lý do.
  const dsLyDo = lg.lyDo ?? phuongAn.map((_, i) => ({
    khoa: CHU[i] ?? String(i),
    dung: i === dapAnDung,
    ly: '',
  }))

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3 text-left">
      {/* 1 · ĐÁP ÁN */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
          Đáp án: {chuDung}
        </span>
        {daChon >= 0 && daChon !== dapAnDung && (
          <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
            Em chọn: {CHU[daChon] ?? '?'}
          </span>
        )}
        {daChon < 0 && (
          <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
            Hết giờ, chưa kịp chọn
          </span>
        )}
      </div>

      {/* Cờ đối chiếu lệch — nói thẳng, không giấu */}
      {co.lech && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-[12px] text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <b>Câu này đang lệch đáp án.</b> Máy tự giải ra một đáp án, tác giả đề ghi
            một đáp án khác. Em hỏi lại thầy trước khi tin lời giải dưới đây.
            {co.ghiChu !== '' && <> ({co.ghiChu})</>}
          </span>
        </div>
      )}

      {lg.thieu ? (
        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          {duPhong !== undefined && duPhong !== '' ? duPhong : CHUA_CO_LOI_GIAI}
        </p>
      ) : (
        <>
          {/* 2 · KIẾN THỨC CỐT LÕI */}
          {lg.chot !== '' && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Kiến thức cốt lõi</span>
              </div>
              <p className="text-[13px] leading-relaxed text-slate-800 dark:text-slate-100">
                {lg.chot}
              </p>
            </div>
          )}

          {/* 3 · VÌ SAO CHỌN / KHÔNG CHỌN */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vì sao chọn / không chọn
            </div>
            <div className="space-y-1.5">
              {dsLyDo.map((p, i) => {
                const laEmChon = CHU[daChon] === p.khoa
                return (
                  <div
                    key={p.khoa + i}
                    className={`flex items-start gap-2 p-2 rounded-xl text-[12.5px] leading-relaxed border ${
                      p.dung
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                        : laEmChon
                          ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span
                      className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white ${
                        p.dung ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                    >
                      {p.dung ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-slate-800 dark:text-slate-100">
                      <b>{p.khoa}.</b>{' '}
                      {phuongAn[i] !== undefined && (
                        <span className="text-slate-500 dark:text-slate-400">{phuongAn[i]} — </span>
                      )}
                      {p.ly !== '' ? p.ly : <i className="text-slate-400">kho chưa ghi lý do cho ý này</i>}
                      {laEmChon && !p.dung && (
                        <b className="text-rose-600 dark:text-rose-400"> ← em đã chọn ý này</b>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 4 · LÀM TỪNG BƯỚC */}
          {lg.buoc !== null && lg.buoc.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Làm từng bước
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[12.5px] leading-relaxed text-slate-800 dark:text-slate-100">
                {lg.buoc.map((b, i) => <li key={i}>{b}</li>)}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  )
}
