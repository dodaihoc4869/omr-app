// BỔ SUNG TỜ ĐÁP ÁN TỪ BẢNG `kho_ca_them` (câu NỐI THÊM của ca đề riêng) — thầy 06/10: "không được phép chấm sai cho bất kì bài kiểm tra nào".
//
// VÌ SAO CÓ. `noiKhoCa` nối câu NGOÀI KHO vào ca đề riêng (chế độ "Kiểm chứng câu đã đúng": câu lấy từ nguồn đề khác). Mỗi câu nối được cất ở ba nơi:
//   · `de/<maCa>.json`        — đề công khai (em THẤY câu);
//   · `key/<maCa>.json`       — tờ đáp án R2 (chỉ nối được nếu tờ đã có);
//   · D1 `kho_ca_them`        — khoa `maCa|qid`, `cau_json` (nội dung công khai), `dap_an` (đáp án: Phần I một chữ · Phần II 4 ký tự D/S · Phần III chuỗi số).
// Trước 06/10 ba đường ghi tờ đáp án (chốt đáp án, kho sửa, vá nền ở màn Theo dõi) ghi đè MÙ bằng gói chỉ có câu trong kho ⇒ câu nối thêm MẤT khỏi tờ đáp án
// trong khi em vẫn được giao và đã làm. Đo thật 06/10 bằng `/ca/kiem-cham`: ca 269409 — đề công khai 1 146 câu, tờ đáp án 929; thiếu đúng 217 câu nối thêm
// và CẢ 26 em đã nộp đều có câu thiếu (1–14 câu mỗi em) ⇒ máy chủ từ chối chấm (đúng — không có khoá thì không chấm), máy em không hiện được đáp án các câu ấy.
// Bảng `kho_ca_them` còn đủ 217/217 dòng có đáp án (trước đây bảng này chỉ ghi, không ai đọc).
//
// LUẬT (an toàn trước, không đoán):
//   · CHỈ THÊM câu mà tờ đáp án KHÔNG có — không bao giờ ghi đè câu có sẵn;
//   · đáp án phải đúng khuôn của phần và khớp dáng câu công khai: Phần I `A–D` + có `choices` · Phần II `D/S` ×4 + có `ideas` · Phần III chuỗi số chấm được
//     (`khopPhanIII(khoá, khoá)`) + không có `choices`/`ideas`; sai khuôn ⇒ BỎ (đếm vào `soBoQua`), để chỗ gọi vẫn báo thiếu thay vì chấm theo khoá đoán;
//   · `chuyenDe` / `mucDo` / lời giải không có trong bảng này ⇒ câu thêm vào chỉ đủ để CHẤM và HIỆN đáp án; `chuyenDe` / `mucDo` lấy thêm từ `chi_tiet_cau` nếu có.
// Hàm thuần + hai hàm đọc D1. Việc GHI lại tờ đáp án (phục hồi) ở `phucHoiKeyCa` — mặc định chỉ xem trước.
import type { Env } from './kieu'
import { khopPhanIII } from '../../src/lib/cham-so'
import { hopNhatKeyBank, laKeyBankHopLe } from './key-bank-hop-nhat'

type Obj = Record<string, unknown>
const laObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)

/** Một dòng bảng `kho_ca_them` (+ chuyên đề / mức độ lấy từ `chi_tiet_cau` nếu có). */
export interface DongKhoCaThem {
  qid: string
  cau_json: string
  dap_an: string
  chuyen_de?: string
  muc_do?: string
}

export interface KetQuaBoSung {
  /** Tờ đáp án đã thêm câu (cùng khuôn `key/<maCa>.json`). */
  giaTri: Obj
  /** Số câu đã thêm vào. */
  soBoSung: number
  /** Số dòng `kho_ca_them` KHÔNG thêm được vì sai khuôn (không có đáp án, JSON hỏng, đáp án không hợp phần). */
  soBoQua: number
  them: { I: number; II: number; III: number }
}

function phanCuaDapAn(dapAn: string): 'I' | 'II' | 'III' | null {
  const hoa = dapAn.toUpperCase()
  if (/^[A-D]$/.test(hoa)) return 'I'
  if (/^[DS]{4}$/.test(hoa)) return 'II'
  try {
    return khopPhanIII(dapAn, dapAn) ? 'III' : null
  } catch {
    return null
  }
}

const idCua = (q: unknown): string => (laObj(q) ? String(q.id ?? q.qid ?? '').trim() : '')

/**
 * Thêm vào tờ đáp án mọi câu của `kho_ca_them` mà tờ chưa có. `key` không hợp lệ (thiếu ba mảng câu) ⇒ `null`.
 * Không đụng câu có sẵn; thứ tự cũ giữ nguyên, câu thêm nối đuôi theo thứ tự `dong`.
 */
export function boSungKeyTuKhoCaThem(key: unknown, dong: readonly DongKhoCaThem[]): KetQuaBoSung | null {
  if (!laKeyBankHopLe(key)) return null
  const daCo = new Set<string>()
  for (const p of ['phanI', 'phanII', 'phanIII'] as const) for (const q of key[p] as unknown[]) daCo.add(idCua(q))
  const them: { I: Obj[]; II: Obj[]; III: Obj[] } = { I: [], II: [], III: [] }
  let soBoQua = 0
  for (const d of dong) {
    const qid = String(d.qid ?? '').trim()
    if (!qid || daCo.has(qid)) continue
    const dapAn = String(d.dap_an ?? '').trim()
    let item: unknown = null
    try {
      item = JSON.parse(String(d.cau_json ?? ''))
    } catch {
      item = null
    }
    const phan = dapAn ? phanCuaDapAn(dapAn) : null
    const coChoices = laObj(item) && Array.isArray(item.choices)
    const coIdeas = laObj(item) && Array.isArray(item.ideas)
    const khop = phan === 'I' ? coChoices : phan === 'II' ? coIdeas : phan === 'III' ? !coChoices && !coIdeas : false
    if (!laObj(item) || !phan || !khop) {
      soBoQua++
      continue
    }
    const moi: Obj = { ...item, id: qid, correct: phan === 'I' ? dapAn.toUpperCase() : phan === 'II' ? [...dapAn.toUpperCase()] : dapAn }
    if (!moi.chuyenDe && d.chuyen_de) moi.chuyenDe = d.chuyen_de
    if (!moi.mucDo && d.muc_do) moi.mucDo = d.muc_do
    them[phan].push(moi)
    daCo.add(qid)
  }
  const soBoSung = them.I.length + them.II.length + them.III.length
  return {
    giaTri: { ...key, phanI: [...(key.phanI as unknown[]), ...them.I], phanII: [...(key.phanII as unknown[]), ...them.II], phanIII: [...(key.phanIII as unknown[]), ...them.III] },
    soBoSung,
    soBoQua,
    them: { I: them.I.length, II: them.II.length, III: them.III.length },
  }
}

/** Đọc `kho_ca_them` của một ca (chỉ đọc). Bảng chưa có / lỗi ⇒ rỗng — không bao giờ làm hỏng đường chấm. */
export async function docKhoCaThem(env: Env, maCa: string): Promise<DongKhoCaThem[]> {
  try {
    const r = await env.DB.prepare('SELECT qid, cau_json, dap_an FROM kho_ca_them WHERE ma_ca = ? ORDER BY khoa').bind(maCa).all<Record<string, unknown>>()
    return (r.results ?? []).map((x) => ({ qid: String(x.qid ?? ''), cau_json: String(x.cau_json ?? ''), dap_an: String(x.dap_an ?? '') }))
  } catch {
    return []
  }
}

/** Chuyên đề / mức độ của từng câu theo các dòng `chi_tiet_cau` đã ghi cho ca (thầy chấm ghi lên). Lỗi ⇒ rỗng. */
async function docChuyenDeMucDo(env: Env, maCa: string): Promise<Map<string, { chuyen_de: string; muc_do: string }>> {
  const ra = new Map<string, { chuyen_de: string; muc_do: string }>()
  try {
    const r = await env.DB.prepare("SELECT qid, MAX(chuyen_de) AS chuyen_de, MAX(muc_do) AS muc_do FROM chi_tiet_cau WHERE ma_ca = ? AND qid <> '' GROUP BY qid")
      .bind(maCa)
      .all<Record<string, unknown>>()
    for (const x of r.results ?? []) ra.set(String(x.qid ?? ''), { chuyen_de: String(x.chuyen_de ?? ''), muc_do: String(x.muc_do ?? '') })
  } catch {
    /* không có chuyên đề thì thôi */
  }
  return ra
}

/** Đọc tờ đáp án R2 của ca + `kho_ca_them`, trả tờ đã bổ sung (CHỈ ĐỌC). `null` khi tờ không đọc được. */
export async function docKeyDaBoSung(env: Env, maCa: string): Promise<{ cu: Obj; moi: KetQuaBoSung } | { loi: 'chua_noi_r2' | 'chua_co_dap_an' | 'dap_an_hong' }> {
  if (!env.DE) return { loi: 'chua_noi_r2' }
  const o = await env.DE.get(`key/${maCa}.json`)
  if (!o?.body) return { loi: 'chua_co_dap_an' }
  let cu: unknown = null
  try {
    cu = await new Response(o.body).json()
  } catch {
    cu = null
  }
  if (!laKeyBankHopLe(cu)) return { loi: 'dap_an_hong' }
  const [dong, meta] = await Promise.all([docKhoCaThem(env, maCa), docChuyenDeMucDo(env, maCa)])
  const coMeta = dong.map((d) => ({ ...d, chuyen_de: meta.get(d.qid)?.chuyen_de, muc_do: meta.get(d.qid)?.muc_do }))
  return { cu, moi: boSungKeyTuKhoCaThem(cu, coMeta) as KetQuaBoSung }
}

/**
 * PHỤC HỒI TỜ ĐÁP ÁN của một ca từ `kho_ca_them`: mặc định CHỈ XEM TRƯỚC (đếm, không ghi). `ghi: true` mới ghi, và:
 *   · chỉ THÊM câu (không xoá, không đổi câu có sẵn); luôn qua `hopNhatKeyBank` nên giữ `soCau` / `boTheoEm`;
 *   · SAO LƯU tờ đáp án cũ nguyên văn sang `sao-luu-key/<maCa>/<giờ>.json` TRƯỚC khi ghi (lùi: chép ngược về `key/<maCa>.json`);
 *   · không chạy khi ca đang mở (`dangMo`) — chỗ gọi truyền vào.
 */
export async function phucHoiKeyCa(env: Env, maCa: string, tuyChon: { ghi: boolean; dangMo: boolean; nay?: number }): Promise<Obj> {
  const doc = await docKeyDaBoSung(env, maCa)
  if ('loi' in doc) {
    const loiChu = { chua_noi_r2: 'Chưa nối R2', chua_co_dap_an: 'Ca này chưa có tờ đáp án trên R2', dap_an_hong: 'Tờ đáp án của ca không đọc được / sai khuôn' } as const
    return { ok: false, lyDo: doc.loi, error: loiChu[doc.loi] }
  }
  const dem = (k: Obj) => ({ I: (k.phanI as unknown[]).length, II: (k.phanII as unknown[]).length, III: (k.phanIII as unknown[]).length })
  const baoCao = { truoc: dem(doc.cu), sau: dem(doc.moi.giaTri), soBoSung: doc.moi.soBoSung, soBoQua: doc.moi.soBoQua, them: doc.moi.them }
  if (doc.moi.soBoSung === 0) return { ok: true, xemTruoc: !tuyChon.ghi, daGhi: false, ...baoCao }
  if (!tuyChon.ghi) return { ok: true, xemTruoc: true, daGhi: false, ...baoCao }
  if (tuyChon.dangMo) return { ok: false, lyDo: 'ca_dang_mo', error: 'Ca đang mở — chỉ phục hồi tờ đáp án khi ca đã đóng', ...baoCao }
  const khoaSaoLuu = `sao-luu-key/${maCa}/${tuyChon.nay ?? Date.now()}.json`
  const hop = hopNhatKeyBank(doc.cu, doc.moi.giaTri)
  if (!hop) return { ok: false, lyDo: 'dap_an_hong', error: 'Không hợp nhất được tờ đáp án — không ghi', ...baoCao }
  await env.DE!.put(khoaSaoLuu, JSON.stringify(doc.cu))
  await env.DE!.put(`key/${maCa}.json`, JSON.stringify(hop))
  return { ok: true, xemTruoc: false, daGhi: true, saoLuu: khoaSaoLuu, ...baoCao }
}
