// NẠP SẴN CÂU CHO PHÒNG BÌNH PHẢN ỨNG (thầy 13/11: «tốc độ chuyển đề trên máy học sinh bị chậm quá, làm cho tức thì đi nhé»).
//
// GỐC CHẬM: mỗi lần thầy sang câu, `/gv/bpu/luot` phải đọc D1 một đợt (câu, câu bảo vệ, em đang thi, lớp, ca đang mở) RỒI mới gửi vào phòng ⇒ giờ cao
// điểm 19–23h một đợt chờ D1 mất từ 0,7 giây trở lên (docs/moc-toc-do.json, đo bản sống 27/10). Máy em tự dựng đề chỉ 0,16 s (CPU ×6: 0,35 s — bộ thử
// `DO_CHUYEN` trong scripts/thu-live-1011/thu-gv-that-1211.mjs).
// CÁCH LÀM: tờ chiếu vừa mở ⇒ báo app danh sách mã câu ⇒ `/gv/bpu/nap` ⇒ PHÒNG tự đọc D1 MỘT LẦN cho cả bài và cất (bộ nhớ + kho của phòng).
// Thầy sang câu ⇒ Worker hỏi phòng `/luot-nhanh` TRƯỚC: phòng mở lượt ngay từ bộ nhớ (0 D1) khi đủ điều kiện an toàn, không thì Worker đi đường cũ y như trước.
// AN TOÀN (cổng «lớp có ca thi đang mở» + câu giữ cho ca kiểm tra — CLAUDE.md): đường nhanh CHỈ chạy khi
//   · ảnh chụp ca / câu bảo vệ chưa quá `NAP_TUOI_MS` (phòng tự làm mới ngầm, tối đa `NAP_LAM_MOI_MS` một lần, mỗi khi có tin trong phòng — máy thầy gửi
//     nhịp giữ kết nối 45 giây + nét bút liên tục);
//   · TOÀN HỆ THỐNG không có ca thi nào đang mở (chặt hơn đường cũ — đường cũ chỉ chặn ca của đúng lớp buổi / lớp các em có mặt);
//   · đọc được phạm vi đề bảo vệ và câu không bị giữ cho ca kiểm tra.
// Thiếu một điều kiện ⇒ `nhanh: false` ⇒ Worker đi đường cũ (kiểm đầy đủ, trả đúng lý do chặn). Đáp án + lời giải chỉ nằm trong phòng như đường cũ (viewEm
// không đổi). Không có lệnh D1 mới trên đường nóng.
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { TU_CHI_MUC_GAME, cauCongKhai, qidPhucVuDuoc } from './cau-theo-qid'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))

/** Số câu tối đa một lần nạp · ảnh chụp an toàn sống bao lâu · làm mới ngầm không dày hơn ngần này (ms). */
export const NAP_TOI_DA = 80, NAP_TUOI_MS = 60_000, NAP_LAM_MOI_MS = 20_000

/** Một câu đã nạp: đúng các trường đường cũ gửi vào `/luot` (đề công khai, đáp án, lời giải — đáp án / lời giải KHÔNG ra máy em trước khi mở). */
export interface CauNap { qid: string; phan: 'I' | 'II' | 'III'; tuLuan: boolean; cau: Row; dung: string; giai: Row; baoVe: boolean }
/** Ảnh chụp an toàn: có ca thi nào đang mở không · đọc được phạm vi đề bảo vệ không · lúc chụp (ms). */
export interface AnToanNap { coCaMo: boolean; kiemDuocBaoVe: boolean; luc: number }

/** Mã câu hợp lệ, bỏ trùng, giữ thứ tự, tối đa `NAP_TOI_DA`. */
export function locMaCau(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  const ra: string[] = []
  for (const x of v) { const q = str(x).trim().slice(0, 200); if (q && !ra.includes(q)) ra.push(q); if (ra.length >= NAP_TOI_DA) break }
  return ra
}

/** Có ca THI nào đang mở trong cả hệ thống (bỏ ca đo tải `DOTAI` — ca giả, không lớp). Không đọc được ⇒ coi như CÓ (đi đường cũ cho chắc). */
async function coCaThiMo(env: Env): Promise<boolean> {
  try {
    const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM ca WHERE trang_thai = 'mo' AND COALESCE(loai, 'thi') = 'thi' AND ma_ca <> 'DOTAI'").first<Row>()
    return Number(r?.n ?? 1) > 0
  } catch { return true }
}

/** Ảnh chụp an toàn + danh sách câu đang bị giữ (một đợt song song). */
export async function chupAnToan(env: Env, qids: string[]): Promise<{ an: AnToanNap; biBaoVe: Set<string>; tuLuan: Set<string> }> {
  const [co, pv] = await Promise.all([coCaThiMo(env), qidPhucVuDuoc(env, qids)])
  return { an: { coCaMo: co, kiemDuocBaoVe: pv.kiemDuocBaoVe, luc: Date.now() }, biBaoVe: new Set(pv.biBaoVe), tuLuan: new Set(pv.tuLuan) }
}

/** Đọc D1 MỘT đợt cho cả bài: nội dung câu + ảnh chụp an toàn. Câu không có trong kho / đọc hỏng ⇒ bỏ (sang câu đó thì đi đường cũ, báo đúng lý do). */
export async function docNap(env: Env, qids: string[]): Promise<{ cau: CauNap[]; an: AnToanNap }> {
  if (!qids.length) return { cau: [], an: { coCaMo: true, kiemDuocBaoVe: false, luc: Date.now() } }
  const [rc, at] = await Promise.all([
    env.DB.prepare(`SELECT q.qid AS qid, q.json AS json ${TU_CHI_MUC_GAME}`).bind(JSON.stringify(qids)).all<{ qid: string; json: string }>(),
    chupAnToan(env, qids),
  ])
  const cau: CauNap[] = [], co = new Set<string>()
  for (const d of rc.results ?? []) {
    const qid = str(d.qid)
    if (!qid || co.has(qid) || !qids.includes(qid)) continue
    let q: PrivateQuestion
    try { q = JSON.parse(str(d.json)) as PrivateQuestion } catch { continue }
    co.add(qid)
    const tuLuan = at.tuLuan.has(qid)
    cau.push({
      qid, phan: q.phan === 'II' || q.phan === 'III' ? q.phan : 'I', tuLuan, cau: cauCongKhai(q) as unknown as Row, dung: tuLuan ? '' : str(q.correct),
      // Lời giải + ảnh lời giải giữ trong PHÒNG (chỉ ra máy em sau khi mở đáp án — viewEm), y như đường cũ `gvBpuLuot`.
      giai: { solution: (q as { solution?: unknown }).solution ?? null, anh: (q.hinhAnh ?? []).filter((h) => h.viTri === 'sau_loi_giai') },
      baoVe: at.biBaoVe.has(qid),
    })
  }
  return { cau, an: at.an }
}

/** Sang câu `qid` theo đường nhanh được không (và vì sao không). `nay` = giờ phòng. */
export function duocNhanh(an: AnToanNap | null, c: CauNap | undefined, nay: number): '' | 'chua-nap' | 'cu' | 'ca-mo' | 'bao-ve' {
  if (!an || !c) return 'chua-nap'
  if (nay - an.luc > NAP_TUOI_MS) return 'cu'
  if (an.coCaMo) return 'ca-mo'
  if (!an.kiemDuocBaoVe || c.baoVe) return 'bao-ve'
  return ''
}
