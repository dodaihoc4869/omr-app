// THỐNG KÊ LỚP CỦA TỪNG CÂU cho dải phím T trên tờ chiếu Lên bảng (hoàn thiện bản vẽ 28/09) — khi buổi chữa KHÔNG đi từ một ca.
//
// `POST /gv/thong-ke-lop-cau {sbd: string[], qid: string[]}` — LỆNH THẦY, CHỈ ĐỌC, sau cổng `laThay`. Không ghi gì.
// Nguồn: sổ `su_kien_hoc` (mọi nguồn, bỏ sự kiện CHE `visibility = 'embargoed'`, bỏ dòng chưa có kết quả). Với mỗi (em, câu) lấy LẦN LÀM MỚI NHẤT;
// đáp án em chọn đọc từ `raw_json.chon` / `raw_json.traLoi`, với ca kiểm tra thì từ `chi_tiet_cau.dap_an_chon`. Không có ⇒ không tính vào ô chọn.
// TRẢ VỀ CHỈ SỐ GỘP theo câu: `{ bai, dung, coChon, chon: {đáp án: số em}, chonSai }` — KHÔNG tên em, KHÔNG số báo danh.
// Câu không em nào làm ⇒ VẮNG khỏi `cau` (tờ ẩn dải, báo "chưa có số liệu lớp").
import type { Env } from './kieu'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x))
export const TOI_DA_EM_TK = 200
export const TOI_DA_CAU_TK = 120

export interface SoGopCau {
  bai: number
  dung: number
  coChon: number
  chon: Record<string, number>
  /** đáp án của các em làm SAI (cho "sai hay gặp" Phần III) */
  chonSai: Record<string, number>
}

function chonTuRaw(raw: unknown): string {
  if (!raw) return ''
  try {
    const j = JSON.parse(str(raw)) as Row
    return str(j.chon ?? j.traLoi).trim().slice(0, 40)
  } catch {
    return ''
  }
}

const dsChuoi = (v: unknown, toiDa: number): string[] =>
  Array.isArray(v) ? [...new Set(v.map((x) => str(x).trim()).filter((x) => x && x.length <= 120))].slice(0, toiDa) : []

export async function gvThongKeLopCau(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = dsChuoi(b.sbd, TOI_DA_EM_TK)
  const qid = dsChuoi(b.qid, TOI_DA_CAU_TK)
  if (!sbd.length || !qid.length) return { ok: true, cau: {} }
  let rows: Row[]
  try {
    rows =
      (
        await env.DB.prepare(
          `SELECT sbd, qid, luc, ket_qua, nguon, ma_nguon, raw_json, visibility FROM su_kien_hoc
            WHERE qid IN (SELECT value FROM json_each(?)) AND sbd IN (SELECT value FROM json_each(?)) AND ket_qua IS NOT NULL ORDER BY luc`,
        )
          .bind(JSON.stringify(qid), JSON.stringify(sbd))
          .all<Row>()
      ).results ?? []
  } catch {
    // sổ chưa có cột chuẩn CNH-1.0 (raw_json / visibility) ⇒ đọc cột gốc
    try {
      rows =
        (
          await env.DB.prepare(
            `SELECT sbd, qid, luc, ket_qua, nguon, ma_nguon FROM su_kien_hoc
              WHERE qid IN (SELECT value FROM json_each(?)) AND sbd IN (SELECT value FROM json_each(?)) AND ket_qua IS NOT NULL ORDER BY luc`,
          )
            .bind(JSON.stringify(qid), JSON.stringify(sbd))
            .all<Row>()
        ).results ?? []
    } catch {
      return { ok: false, lyDo: 'loi_doc', error: 'Chưa đọc được sổ học.' }
    }
  }
  // lần MỚI NHẤT của mỗi (em, câu) — rows đã xếp theo `luc`
  const moiNhat = new Map<string, Row>()
  for (const r of rows) if (str(r.visibility) !== 'embargoed') moiNhat.set(`${str(r.sbd)}|${str(r.qid)}`, r)
  // đáp án chọn của ca kiểm tra
  const canCa = [...moiNhat.values()].filter((r) => str(r.nguon) === 'thi' && !chonTuRaw(r.raw_json))
  const chonCa = new Map<string, string>()
  if (canCa.length) {
    try {
      const rc =
        (
          await env.DB.prepare(
            `SELECT sbd, qid, ma_ca, dap_an_chon FROM chi_tiet_cau WHERE qid IN (SELECT value FROM json_each(?)) AND sbd IN (SELECT value FROM json_each(?)) ORDER BY lan_thu`,
          )
            .bind(JSON.stringify([...new Set(canCa.map((r) => str(r.qid)))]), JSON.stringify([...new Set(canCa.map((r) => str(r.sbd)))]))
            .all<Row>()
        ).results ?? []
      for (const x of rc) if (str(x.dap_an_chon).trim()) chonCa.set(`${str(x.sbd)}|${str(x.qid)}|${str(x.ma_ca)}`, str(x.dap_an_chon).trim())
    } catch {
      /* không có bảng chấm ⇒ bỏ ô chọn của ca */
    }
  }
  const cau: Record<string, SoGopCau> = {}
  for (const r of moiNhat.values()) {
    const q = str(r.qid)
    const g = (cau[q] ??= { bai: 0, dung: 0, coChon: 0, chon: {}, chonSai: {} })
    g.bai++
    if (Number(r.ket_qua) === 1) g.dung++
    const c = chonTuRaw(r.raw_json) || (str(r.nguon) === 'thi' ? chonCa.get(`${str(r.sbd)}|${q}|${str(r.ma_nguon)}`) ?? '' : '')
    if (c) {
      g.coChon++
      g.chon[c] = (g.chon[c] ?? 0) + 1
      if (Number(r.ket_qua) !== 1) g.chonSai[c] = (g.chonSai[c] ?? 0) + 1
    }
  }
  return { ok: true, cau }
}
