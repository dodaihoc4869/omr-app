// NHÃN «ĐÃ LÀM ĐÚNG / ĐÃ LÀM SAI» ở màn thi + kiểm tra (thầy 03/11; bản vẽ docs/ban-ve-nhan-da-lam-0311.jpg; máy chủ server/src/lich-su-qid.ts).
// Mảnh NẠP LƯỜI (gắn từ cong-hs-nap-luoi.ts / do-treo-may-thi.ts — lượt mở app không mang thêm byte). Màn chỉ vẽ MỘT phần tử rỗng làm chỗ giữ:
//   · `.duo-kt-ls[data-qid][data-tru]`            ⇒ nhãn «Sai N lần · Đúng M lần» cạnh «Câu N» (lúc nhận câu);
//   · … + `[data-dung="1|0"]`                      ⇒ nhãn 1 trong 4 kết quả lần này so với lần trước (màn kết quả, từng hàng câu);
//   · `.duo-kt-t4[data-tru][data-ds="qid:1,qid:0"]` ⇒ ô tổng hợp 4 kết quả (sau khi nộp).
// `data-tru` = «nguon|maNguon» của CHÍNH lần làm hiện tại ⇒ máy chủ loại nó ra khỏi «trước» (tải lại giữa bài / so sánh sau khi nộp vẫn đúng).
// Quét bằng MutationObserver, gom các chỗ giữ cùng lượt thành MỘT lệnh; nhãn chỉ là phụ — lỗi mạng / chưa có phiên ⇒ im lặng, câu vẫn hiện bình thường.
import { layDiaChiMayChu } from './dia-chi-may-chu'
import '../styles/nhan-lich-su.css'

type Dem = [number, number, number] // [sai, dung, lanCuoi 0|1]
const MAC_DINH = 'https://omr.ttadodaihoc.workers.dev'
const nho = new Map<string, Dem | null>() // «tru|qid» → đếm (null = chưa từng làm)
const dangHoi = new Set<string>()

const token = (): string => { try { return String((JSON.parse(localStorage.getItem('omr_student_portal_auth') || 'null') as { token?: unknown } | null)?.token ?? '') } catch { return '' } }

const TEN: Record<string, string> = { dd: 'Đúng → đúng lại', sd: 'Sai → đúng lại', ds: 'Đúng → sai lại', ss: 'Sai → sai lại' }
/** Một trong 4 kết quả: lần cuối trước đó (1 đúng / 0 sai) × lần này (đúng / sai). */
export const mucLai = (lanCuoi: number, dungNay: boolean): 'dd' | 'sd' | 'ds' | 'ss' => `${lanCuoi === 1 ? 'd' : 's'}${dungNay ? 'd' : 's'}` as 'dd'

function veNhan(e: HTMLElement, d: Dem | null | undefined): void {
  const dung = e.dataset.dung
  if (!d || (!d[0] && !d[1])) { e.textContent = ''; e.hidden = true; return }
  e.hidden = false
  if (dung === undefined) {
    e.className = 'duo-kt-ls nl'
    e.innerHTML = `${d[0] ? `<i class="s">Sai ${d[0]} lần</i>` : ''}${d[1] ? `<i class="d">Đúng ${d[1]} lần</i>` : ''}`
    return
  }
  const m = mucLai(d[2], dung === '1')
  e.className = 'duo-kt-ls nm'; e.dataset.m = m
  e.title = `Trước đó: sai ${d[0]} lần · đúng ${d[1]} lần`
  e.textContent = TEN[m]!
}

function veTong(e: HTMLElement, tru: string): void {
  const dem = { sd: 0, dd: 0, ds: 0, ss: 0 }
  let co = 0
  for (const x of (e.dataset.ds ?? '').split(',')) {
    const [qid, k] = x.split(':'); const d = nho.get(`${tru}|${qid}`)
    if (!qid || !d || (!d[0] && !d[1])) continue
    dem[mucLai(d[2], k === '1')]++; co++
  }
  if (!co) { e.hidden = true; return }
  e.hidden = false
  e.innerHTML = `<h3>Kết quả so với lần làm trước</h3><p>Chỉ tính ${co} câu em từng làm ở nơi khác.</p><div class="g">${(['sd', 'dd', 'ds', 'ss'] as const).map((m) => `<div class="o" data-m="${m}"><b>${dem[m]}</b><span>${TEN[m]}</span></div>`).join('')}</div>`
}

let hen = 0
async function quet(): Promise<void> {
  hen = 0
  const tk = token(); if (!tk) return
  const cho = [...document.querySelectorAll<HTMLElement>('.duo-kt-ls[data-qid], .duo-kt-t4[data-ds]')]
  const can = new Map<string, Set<string>>() // tru → qid cần hỏi
  const them = (tru: string, qid: string) => { if (qid && !nho.has(`${tru}|${qid}`) && !dangHoi.has(`${tru}|${qid}`)) (can.get(tru) ?? can.set(tru, new Set()).get(tru)!).add(qid) }
  for (const e of cho) {
    const tru = e.dataset.tru ?? ''
    if (e.classList.contains('duo-kt-t4')) for (const x of (e.dataset.ds ?? '').split(',')) them(tru, x.split(':')[0]!)
    else them(tru, e.dataset.qid ?? '')
  }
  const goc = (await layDiaChiMayChu('')) || MAC_DINH
  await Promise.all([...can].map(async ([tru, ds]) => {
    const qids = [...ds].slice(0, 150); const [nguon, maNguon] = tru.split('|')
    for (const q of qids) dangHoi.add(`${tru}|${q}`)
    try {
      const r = await fetch(`${goc}/hs/lich-su-qid`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: tk, qids, ...(nguon && maNguon ? { tru: { nguon, maNguon } } : {}) }) })
      const j = (await r.json().catch(() => null)) as { ok?: boolean; ds?: Record<string, Dem> } | null
      if (j?.ok) for (const q of qids) nho.set(`${tru}|${q}`, j.ds?.[q] ?? null)
    } catch { /* mạng lỗi ⇒ không nhãn */ }
    for (const q of qids) dangHoi.delete(`${tru}|${q}`)
  }))
  for (const e of document.querySelectorAll<HTMLElement>('.duo-kt-ls[data-qid], .duo-kt-t4[data-ds]')) {
    const tru = e.dataset.tru ?? ''
    if (e.classList.contains('duo-kt-t4')) veTong(e, tru); else if (nho.has(`${tru}|${e.dataset.qid}`)) veNhan(e, nho.get(`${tru}|${e.dataset.qid}`))
  }
}
const hoan = () => { if (!hen) hen = window.setTimeout(() => void quet(), 120) }

let da = false
/** Bật bộ quét nhãn (một lần mỗi trang). */
export function ganNhanLichSu(): void {
  if (da || typeof document === 'undefined' || typeof MutationObserver !== 'function') return
  da = true
  const cho = '.duo-kt-ls, .duo-kt-t4'
  new MutationObserver((ds) => {
    let can = false
    for (const d of ds) {
      if (d.type === 'attributes') { const e = d.target as HTMLElement; if (e.matches?.(cho)) { e.hidden = true; e.textContent = ''; can = true } continue } // đổi câu ⇒ chỗ giữ cũ: ẩn, vẽ lại theo qid mới
      for (const n of d.addedNodes) if (n.nodeType === 1 && ((n as Element).matches?.(cho) || (n as Element).querySelector?.(cho))) can = true
    }
    if (can) hoan()
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-qid', 'data-ds', 'data-dung'] })
  hoan()
}
