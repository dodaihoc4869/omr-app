import ExperimentDemo from './ExperimentDemo'
// MỘT KHỐI CÂU SAI DUY NHẤT — dùng ở MỌI báo cáo của cả ba app.
//
// Thầy chốt 14/09: "Tất cả các câu sai phải hiển thị đủ đề và hình ảnh đầy đủ,
// lời giải theo chuẩn ở trong tất cả các báo cáo."
//
// Trước bản này, hai cổng tự vẽ hai kiểu và cùng thiếu ba thứ:
//   · ẢNH đề bài — câu Hoá rất hay có sơ đồ, bảng biến thiên, hình thí nghiệm.
//     Không vẽ ảnh thì em đọc "Cho sơ đồ sau" rồi không thấy sơ đồ đâu.
//   · BỐN Ý a–b–c–d của phần II. Cổng học sinh chỉ vẽ `choices` (A–D) nên câu
//     phần II ra mỗi dòng dẫn "Mỗi phát biểu sau đây là đúng hay sai?" — thầy
//     chụp được đúng cảnh ấy.
//   · BẢNG số liệu (`table`).
//
// Máy chủ vẫn trả đủ cả ba (`hsCauSai` đọc kho đề rồi gắn kèm). Lỗi nằm ở chỗ
// vẽ, nên sửa ở chỗ vẽ — và sửa MỘT lần cho cả ba app.
import { useState } from 'react'
import { ChemText } from '../lib/chem-format'
import { chuanHoaLoiGiaiCau, CHUA_CO_LOI_GIAI } from '../lib/chuan-hoa-loi-giai'
import { chuDiemTheoY, soYCuaCau, soYDungPhanII } from '../lib/dem-ket-qua'

export interface CauSaiHienThi {
  qid?: string
  phan?: string
  soCau?: number
  chuyenDe?: string
  mucDo?: string
  dapAnChon?: string
  dapAnDung?: string
  text?: string
  choices?: string[]
  ideas?: string[]
  table?: string[][] | null
  imageDataUrl?: string
  /** Ảnh của THÂN CÂU (đề bài), khác hẳn ảnh của từng phương án. */
  thanCauImg?: string
  /** Ảnh THAY CHỮ cho từng phương án A–D của phần I. */
  choiceImgs?: (string | undefined)[]
  /** Ảnh THAY CHỮ cho từng ý a–d của phần II. */
  ideaImgs?: (string | undefined)[]
  /** Ảnh có VỊ TRÍ: `sau_de` · `cuoi_cau` · `sau_pa_A` · `sau_y_a` … */
  hinhAnh?: unknown
  loiGiai?: string
}

const CHU_Y = ['a', 'b', 'c', 'd']

interface AnhCoViTri {
  src: string
  viTri: string
  alt?: string
}


/** Một đường dẫn ảnh vẽ được, hay chuỗi rỗng. */
function duongAnh(v: unknown): string {
  const s = typeof v === 'string' ? v.trim() : ''
  if (s.length > 10 && (s.startsWith('data:image/') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/'))) return s
  return ''
}

/** Mảng ảnh CÓ VỊ TRÍ của một câu, đã chuẩn hoá. */
function anhCoViTri(c: CauSaiHienThi): AnhCoViTri[] {
  const ra: AnhCoViTri[] = []
  const ds = Array.isArray(c.hinhAnh) ? c.hinhAnh : c.hinhAnh ? [c.hinhAnh] : []
  for (const h of ds) {
    if (typeof h === 'string') {
      const src = duongAnh(h)
      if (src) ra.push({ src, viTri: 'sau_de' })
      continue
    }
    const o = h as { src?: unknown; viTri?: unknown; alt?: unknown }
    const src = duongAnh(o?.src)
    if (src) ra.push({ src, viTri: String(o?.viTri ?? 'sau_de'), alt: typeof o?.alt === 'string' ? o.alt : undefined })
  }
  return ra
}

/** ẢNH CỦA THÂN CÂU — và CHỈ của thân câu.
 *
 * Thầy bắt được 14/09: câu có bốn phương án bằng ảnh thì cả bốn ảnh bị dồn lên
 * đầu câu, còn bốn dòng phương án chỉ còn chữ "(xem hình phương án A)". Ảnh đặt
 * sau phương án A phải nằm SAU PHƯƠNG ÁN A. */
export function anhCuaCau(c: CauSaiHienThi): string[] {
  const ra: string[] = []
  const them = (v: string) => {
    if (v && !ra.includes(v)) ra.push(v)
  }
  them(duongAnh(c.thanCauImg))
  them(duongAnh(c.imageDataUrl))
  for (const h of anhCoViTri(c)) {
    // Chỉ lấy ảnh của thân câu. `sau_pa_*` và `sau_y_*` thuộc về phương án.
    if (h.viTri.startsWith('sau_pa_') || h.viTri.startsWith('sau_y_')) continue
    them(h.src)
  }
  return ra
}

/** Ảnh của MỘT phương án: ưu tiên ảnh thay chữ, rồi tới ảnh đặt sau nó. */
export function anhPhuongAn(c: CauSaiHienThi, phan: string, i: number): string {
  const thayChu = phan === 'II' ? c.ideaImgs?.[i] : c.choiceImgs?.[i]
  const t = duongAnh(thayChu)
  if (t) return t
  const khoa = phan === 'II' ? `sau_y_${CHU_Y[i] ?? ''}` : `sau_pa_${'ABCD'[i] ?? ''}`
  return anhCoViTri(c).find((h) => h.viTri === khoa)?.src ?? ''
}

/** Một ký tự Đ/S đã chuẩn hoá; `-` hoặc rỗng = em chưa tô ô đó. */
function y(v: string | undefined, i: number): string {
  const s = String(v ?? '').trim().toUpperCase().replace(/Đ/g, 'D')
  const k = s[i]
  return k === 'D' || k === 'S' ? k : ''
}

function ChuY({ k }: { k: string }) {
  if (!k) return <span className="text-slate-400 font-bold">–</span>
  return <span className={k === 'D' ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-rose-600 dark:text-rose-400 font-black'}>{k === 'D' ? 'Đ' : 'S'}</span>
}

/** THÂN CÂU: đề bài, ảnh, bảng, rồi phương án theo đúng phần của câu. */
export function ThanCauSai({ c }: { c: CauSaiHienThi }) {
  const anh = anhCuaCau(c)
  const phan = String(c.phan || 'I')
  return (
    <>
      {c.text && (
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-wrap">
          {c.text}
        </div>
      )}

      <ExperimentDemo text={c.text}/>
      {/* ẢNH ĐỀ BÀI. Câu Hoá hay có sơ đồ và hình thí nghiệm; thiếu ảnh là
          thiếu nửa đề. */}
      {anh.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Hình của câu ${c.soCau ?? ''}`}
          loading="lazy"
          // ĐÚNG CHUẨN `.q-hinh` CỦA PHIẾU HTML (`html-phieu.ts`):
          //   display:block · max-width:100% · height:auto · margin:12px auto
          //
          // Bản trước dùng `w-full`, tức ÉP ảnh rộng bằng cả khung. Ảnh công
          // thức trong kho đề thường chỉ vài trăm pixel, bị kéo giãn lên thành
          // khổng lồ, tràn ra ngoài thẻ và đẩy chữ xuống mất hút (thầy chụp
          // 14/09). `max-w-full` chỉ CHẶN TRÊN, ảnh nhỏ giữ nguyên cỡ thật.
          //
          // `max-h` + `object-contain` là ràng buộc riêng của khung xem trong
          // app: ảnh cao quá thì thu lại vừa màn, KHÔNG cắt xén.
          className="block mx-auto max-w-full h-auto max-h-[420px] object-contain my-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
        />
      ))}

      {/* BẢNG SỐ LIỆU — cùng khuôn `.q-bang` của phiếu HTML: hàng đầu là
          tiêu đề, nền xám nhạt, chữ đậm; cả bảng cuộn ngang được trên điện
          thoại thay vì bóp chữ. */}
      {Array.isArray(c.table) && c.table.length > 0 && (
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {(c.table[0] ?? []).map((o, j) => (
                  <th key={j} className="border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {o}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.table.slice(1).map((hang, i) => (
                <tr key={i}>
                  {(hang ?? []).map((o, j) => (
                    <td key={j} className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-center text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {o}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PHẦN I — bốn phương án A–D. */}
      {phan === 'I' && Array.isArray(c.choices) && c.choices.length > 0 && (
        <div className="space-y-1.5">
          {c.choices.map((ch, i) => {
            const k = String.fromCharCode(65 + i)
            const laDung = k === String(c.dapAnDung || '').trim().toUpperCase()
            const laChon = k === String(c.dapAnChon || '').trim().toUpperCase()
            return (
              <div
                key={k}
                className={`p-2.5 rounded-xl border flex items-start gap-2 text-xs ${
                  laDung
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                    : laChon
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">{k}</span>
                {/* ẢNH CỦA PHƯƠNG ÁN NẰM Ở PHƯƠNG ÁN — không dồn lên đầu câu.
                    Kho đề ghi chữ "(xem hình phương án A)" ở những câu này, nên
                    in chữ ấy ra là em nhìn bốn dòng trống rỗng. */}
                {anhPhuongAn(c, 'I', i) ? (
                  <img
                    src={anhPhuongAn(c, 'I', i)}
                    alt={`Phương án ${k}`}
                    loading="lazy"
                    className="block max-w-full h-auto max-h-32 object-contain"
                  />
                ) : (
                  <span className="min-w-0 whitespace-pre-wrap">{ch}</span>
                )}
                {laChon && <span className="ml-auto shrink-0 text-[10px] font-bold">em chọn</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* PHẦN II — BỐN Ý a–b–c–d, mỗi ý một dòng, so Đ/S em tô với đáp án.
          Đây là chỗ bản cũ bỏ trắng: em nhìn thấy mỗi câu dẫn. */}
      {phan === 'II' && Array.isArray(c.ideas) && c.ideas.length > 0 && (
        <div className="space-y-1.5">
          {c.ideas.map((noiDung, i) => {
            const chon = y(c.dapAnChon, i)
            const dung = y(c.dapAnDung, i)
            const khop = Boolean(chon) && chon === dung
            return (
              <div
                key={i}
                className={`p-2.5 rounded-xl border text-xs ${
                  khop
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                    {CHU_Y[i] ?? i + 1}
                  </span>
                  {anhPhuongAn(c, 'II', i) ? (
                    <img
                      src={anhPhuongAn(c, 'II', i)}
                      alt={`Ý ${CHU_Y[i] ?? i + 1}`}
                      loading="lazy"
                      className="block max-w-full h-auto max-h-32 object-contain"
                    />
                  ) : (
                    <span className="min-w-0 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{noiDung}</span>
                  )}
                </div>
                <div className="mt-1.5 pl-7 flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                  <span>Em chọn: <ChuY k={chon} /></span>
                  <span>Đáp án: <ChuY k={dung} /></span>
                  <span className={`ml-auto font-bold ${khop ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {khop ? '✓ đúng ý này' : '✗ sai ý này'}
                  </span>
                </div>
              </div>
            )
          })}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-1">
            Em đúng <strong>{soYDungPhanII(c.dapAnChon, c.dapAnDung)}</strong>/{c.ideas.length} ý của câu này.
          </div>
        </div>
      )}

      {/* PHẦN III — trả lời ngắn: đặt hai con số cạnh nhau cho dễ so. */}
      {phan === 'III' && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200">
            Em điền: <strong>{c.dapAnChon || 'bỏ trống'}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200">
            Đáp án: <strong>{c.dapAnDung || '—'}</strong>
          </span>
        </div>
      )}
    </>
  )
}

/** HỘP LỜI GIẢI CHUẨN — cùng một khuôn ở mọi báo cáo. */
export function LoiGiaiCauSai({ c, hoaHoc = false }: { c: Omit<CauSaiHienThi, 'loiGiai'> & {loiGiai?: unknown}; hoaHoc?: boolean }) {
  const lg = chuanHoaLoiGiaiCau(c.loiGiai, (c.phan as 'I' | 'II' | 'III') || 'I', c.dapAnDung || '')
  return (
    <div className="readable-solution p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-100 shadow-sm space-y-3">
      <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">
        Đáp án: <strong className="text-base font-black text-amber-950 dark:text-amber-100">{lg.ketQua || c.dapAnDung || '—'}</strong>
      </div>
      {lg.thieu && (
        <div className="text-xs italic leading-relaxed text-amber-900/80 dark:text-amber-200/80">{CHUA_CO_LOI_GIAI}</div>
      )}
      {lg.chot && (
        <div>
          <div className="text-[10px] font-extrabold tracking-wider uppercase text-amber-800 dark:text-amber-400 mb-1">KIẾN THỨC CỐT LÕI</div>
          <div className="text-xs sm:text-sm font-bold leading-relaxed text-amber-950 dark:text-amber-100">{hoaHoc ? <ChemText text={lg.chot}/> : lg.chot}</div>
        </div>
      )}
      {lg.lyDo && lg.lyDo.length > 0 && (
        <div>
          <div className="text-[10px] font-extrabold tracking-wider uppercase text-amber-800 dark:text-amber-400 mb-1">
            {String(c.phan) === 'II' ? 'VÌ SAO ĐÚNG / SAI TỪNG Ý' : 'VÌ SAO CHỌN / KHÔNG CHỌN TỪNG PHƯƠNG ÁN'}
          </div>
          <div className="space-y-1 text-xs leading-relaxed">
            {lg.lyDo.map((p) => (
              <div key={p.khoa} className="flex items-start gap-1.5 py-0.5 border-t border-amber-200/40 dark:border-amber-800/40 first:border-t-0">
                <strong className="text-amber-900 dark:text-amber-200">{p.khoa}.</strong>
                <span className={`font-bold ${(hoaHoc && c.phan === 'II' && /^[DS]{4}$/.test(c.dapAnDung || '') ? c.dapAnDung?.['abcd'.indexOf(p.khoa.toLowerCase())] === 'D' : p.dung) ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>{(hoaHoc && c.phan === 'II' && /^[DS]{4}$/.test(c.dapAnDung || '') ? c.dapAnDung?.['abcd'.indexOf(p.khoa.toLowerCase())] === 'D' : p.dung) ? '✓' : '✗'}</span>
                <span className="text-amber-900 dark:text-amber-200">{hoaHoc ? <ChemText text={p.ly}/> : p.ly}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {lg.buoc && lg.buoc.length > 0 && (
        <div>
          <div className="text-[10px] font-extrabold tracking-wider uppercase text-amber-800 dark:text-amber-400 mb-1">LÀM TỪNG BƯỚC</div>
          <div className="space-y-1 text-xs">
            {lg.buoc.map((b, i) => (
              <div key={i}>{i + 1}. {hoaHoc ? <ChemText text={b}/> : b}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Cả câu: thân + lời giải. Đây là thứ mọi báo cáo phải dùng. */
export default function KhoiCauSai({ c }: { c: CauSaiHienThi }) {
  return (
    <div className="space-y-3">
      <ThanCauSai c={c} />
      <LoiGiaiCauSai c={c} />
    </div>
  )
}

/** MỘT DÒNG CÂU SAI TRỌN VẸN — đầu dòng bấm mở, thân dòng là `KhoiCauSai`.
 *
 * Cả hai cổng dùng ĐÚNG component này, nên bố cục, nhãn và màu giống nhau 100%.
 * Trước đây mỗi cổng tự dựng một kiểu đầu dòng, và chỉ cổng học sinh có nhãn
 * biểu điểm theo ý. */
export function DongCauSai({ c, stt }: { c: CauSaiHienThi; stt: number }) {
  const [mo, setMo] = useState(false)
  const phan = String(c.phan || 'I')
  const yDung = phan === 'II' ? soYDungPhanII(c.dapAnChon, c.dapAnDung) : null
  const daTo = String(c.dapAnChon ?? '').replace(/-/g, '').trim()
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 overflow-hidden shadow-sm transition-all">
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        className="w-full p-3.5 text-left flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center shrink-0">
            {stt}
          </span>
          <div className="truncate">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Câu {stt} (Phần {phan}):
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">{c.chuyenDe || 'Hoá học'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {yDung !== null && yDung > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              {chuDiemTheoY(yDung, soYCuaCau(c.dapAnDung))}
            </span>
          )}
          {!daTo && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Bỏ trống
            </span>
          )}
          {/* Ô "em chọn" ĐỎ RÕ: đây là chỗ phải nhìn thấy đầu tiên. */}
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white border border-rose-700">
            Em chọn: {c.dapAnChon || '—'}
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Đúng: {c.dapAnDung || '—'}
          </span>
          <span className="text-xs text-slate-400">{mo ? '\u25b2' : '\u25bc'}</span>
        </div>
      </button>

      {mo && (
        <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-xs animate-google-fade">
          <KhoiCauSai c={c} />
        </div>
      )}
    </div>
  )
}
