// LỆNH `hoSoOnCa` — HỒ SƠ ÔN CHO RÚT ĐỀ RIÊNG (Kênh 1), theo docs/hop-dong-ho-so-on-ca-1909.md (phiên Rút đề riêng).
//
// CHỈ ĐỌC. Không ghi bảng nào, không đổi luật chấm/vào thi. `banDoSaiCa` giữ nguyên; lệnh này chỉ là lớp thông tin THÊM.
// Đúng ≤ 3 truy vấn D1 cho MỘT lượt (≤ 20 em), mỗi truy vấn MỘT tham số `json_each(?)` cho danh sách em:
//   1. ca gần nhất mỗi em có nộp (chi_tiet_cau ⋈ ca) → chọn `soCa` ca đầu trong JS
//   2. câu sai ở các ca ấy (ban_do_sai) nối hồ sơ (nam_kt_cau)
//   3. câu em làm trong cửa sổ 7 ngày (su_kien_hoc, MỌI nguồn, MỌI ket_qua)
// TIN THẬT: thiếu bảng/lỗi bất kỳ → `{ok:false, error}`, KHÔNG BAO GIỜ `ok:true` với dữ liệu rỗng (rỗng thật ≠ hỏng: máy thầy phân biệt
// "em không có gì" với "lô này hỏng"). Mọi `sbd` trong `dsSbd` đều có khoá trong `em`, kể cả rỗng.
import type { Env } from './kieu'
import { ngayVn } from './su-kien-hoc'

type Row = Record<string, unknown>

export const TOI_DA_EM_MOT_LUOT = 20
export const SO_NGAY_CUA_SO_LAM = 7
export const TOI_DA_LAM_MOI_EM = 400
const MOT_NGAY_MS = 86_400_000

export interface HoSoOnCaEm {
  tuCa: string
  sai: { qid: string; lanSai: number; mocOnKe: string | null; maDang: string | null; trangThai: 'moi_sai' | 'dang_on' }[]
  daKhacPhuc: string[]
  lam: string[]
}

const laNgay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(`${v}T00:00:00Z`))
const lui = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * MOT_NGAY_MS).toISOString().slice(0, 10)

export async function hoSoOnCa(env: Env, b: Record<string, unknown>, now: number = Date.now()): Promise<Record<string, unknown>> {
  const ds = [...new Set((Array.isArray(b.dsSbd) ? (b.dsSbd as unknown[]) : []).map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean))]
  // Chặn cứng, KHÔNG cắt im lặng: cắt thì máy thầy tưởng các em bị cắt "không có hồ sơ".
  if (ds.length > TOI_DA_EM_MOT_LUOT) return { ok: false, error: 'Xin quá nhiều em một lượt' }
  if (ds.length === 0) return { ok: true, em: {} }
  const maCa = typeof b.maCa === 'string' ? b.maCa.trim() : ''
  const ngayCa = laNgay(b.ngayCa) ? b.ngayCa : ngayVn(now)
  const soCa = Number(b.soCa) === 3 ? 3 : 1

  try {
    const sbd = JSON.stringify(ds)
    // 1. Ca gần nhất MÀ CHÍNH EM CÓ NỘP: ca thi (không phải bài tập), chưa xoá, khác `maCa`; giờ mở MỚI NHẤT trước.
    const r1 = await env.DB.prepare(
      `SELECT t.sbd, t.ma_ca FROM (SELECT DISTINCT sbd, ma_ca FROM chi_tiet_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND ma_ca <> ? AND COALESCE(qid, '') <> '') t
         JOIN ca c ON c.ma_ca = t.ma_ca
        WHERE COALESCE(c.loai, 'thi') <> 'baitap' AND COALESCE(c.trang_thai, '') <> 'da_xoa'
        ORDER BY c.bat_dau DESC, t.ma_ca DESC`,
    ).bind(sbd, maCa).all<Row>()
    const caCuaEm = new Map<string, string[]>()
    for (const x of r1.results ?? []) {
      const s = String(x.sbd)
      const a = caCuaEm.get(s) ?? []
      if (a.length < soCa) a.push(String(x.ma_ca))
      caCuaEm.set(s, a)
    }
    const dsCa = [...new Set([...caCuaEm.values()].flat())]

    const [r2, r3] = await Promise.all([
      // 2. Câu sai ở các ca đã chọn + trạng thái hồ sơ (nam_kt_cau); giữ đúng cặp (em, ca) ở JS.
      dsCa.length === 0
        ? Promise.resolve({ results: [] as Row[] })
        : env.DB.prepare(
            `SELECT b.sbd, b.ma_ca, b.qid, k.ma_dang, k.lan_sai, k.moc_on_ke, k.trang_thai FROM ban_do_sai b
               LEFT JOIN nam_kt_cau k ON k.sbd = b.sbd AND k.qid = b.qid
              WHERE b.sbd IN (SELECT value FROM json_each(?)) AND b.ma_ca IN (SELECT value FROM json_each(?))`,
          ).bind(sbd, JSON.stringify(dsCa)).all<Row>(),
      // 3. Câu em ĐÃ THẤY trong cửa sổ [ngayCa − 7 ngày, ngayCa]: mọi nguồn, mọi kết quả; mới nhất trước, hoà thì qid tăng dần.
      env.DB.prepare(
        `SELECT sbd, qid, MAX(luc) AS luc FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn >= ? AND ngay_vn <= ?
          GROUP BY sbd, qid ORDER BY luc DESC, qid ASC`,
      ).bind(sbd, lui(ngayCa, -SO_NGAY_CUA_SO_LAM), ngayCa).all<Row>(),
    ])

    const em: Record<string, HoSoOnCaEm> = {}
    for (const s of ds) em[s] = { tuCa: (caCuaEm.get(s) ?? []).join(' + '), sai: [], daKhacPhuc: [], lam: [] }
    const thaySai = new Set<string>()
    for (const x of r2.results ?? []) {
      const s = String(x.sbd)
      const e = em[s]
      if (!e || !(caCuaEm.get(s) ?? []).includes(String(x.ma_ca))) continue // đúng cặp (em, ca đã chọn)
      const qid = String(x.qid)
      const k = `${s}|${qid}`
      if (thaySai.has(k)) continue
      const tt = x.trang_thai
      if (tt === 'moi_sai' || tt === 'dang_on') {
        thaySai.add(k)
        e.sai.push({ qid, lanSai: Number(x.lan_sai) || 0, mocOnKe: laNgay(x.moc_on_ke) ? x.moc_on_ke : null, maDang: x.ma_dang ? String(x.ma_dang) : null, trangThai: tt })
      } else if (tt === 'da_khac_phuc') {
        thaySai.add(k)
        e.daKhacPhuc.push(qid)
      }
      // `chua_thay_sai` hoặc KHÔNG có dòng hồ sơ: không đưa vào đâu cả — máy thầy xử theo luật cũ. Không đoán.
    }
    for (const x of r3.results ?? []) {
      const e = em[String(x.sbd)]
      if (e && e.lam.length < TOI_DA_LAM_MOI_EM) e.lam.push(String(x.qid)) // đã sắp mới nhất trước: cắt phần CŨ nhất
    }
    return { ok: true, em }
  } catch (e) {
    console.error('[hoSoOnCa] lỗi:', e instanceof Error ? e.message : e)
    return { ok: false, error: 'Chưa đọc được hồ sơ ôn' }
  }
}
