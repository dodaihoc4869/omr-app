// NẠP LẠI SỔ TỪ DỮ LIỆU CŨ + ĐẾM KIỂM CHÉO — GĐ 0 (DE-XUAT-CA-NHAN-HOA-1909.md mục 1.1).
//
// Lệnh của thầy (đòi mã bí mật), ≤ 20 em mỗi lượt. CHỈ ĐỌC các bảng cũ và CHỈ
// THÊM vào `su_kien_hoc`: không sửa, không xoá dòng nào của bảng nào.
//
// Vì sao cần: từ lúc phát hành GĐ 0 mỗi lượt nộp mới tự ghi sổ, nhưng bài đã nộp
// TRƯỚC đó (và lượt nộp nào ghi sổ hụt vì lỗi tạm) chỉ có ở bảng cũ. Nạp lại dùng
// CÙNG hàm dựng sự kiện với đường ghi trực tiếp, nên một câu nộp trước hay sau
// GĐ 0 đều ra cùng một dòng sổ (cùng khoá) — chạy lại bao nhiêu lần cũng không đôi.
//
// Ba nguồn đọc thẳng bằng SQL (không cần R2): `thi`, `len_bang`, `game`.
// Bốn nguồn phải CHẤM LẠI từ tờ đề trên R2 (đáp án không nằm trong D1): `btvn`,
// `khac_phuc`, `mom`, `luyen` — mỗi lượt gọi chỉ đọc tối đa TOI_DA_DOC_R2 tờ.
import type { Env } from './kieu'
import { gradeHomework, homeworkKeys, homeworkQuestions } from './btvn-grading'
import {
  CAC_NGUON,
  cauTuKhoTheoQid,
  HetLuotDoc,
  ghiSuKien,
  suKienChamBai,
  suKienLuyenDe,
  suKienTuKetQuaCham,
  type CauChamBai,
  type NguonSuKien,
  type SuKien,
} from './su-kien-hoc'

export type NguonNapLai = 'sql' | 'btvn' | 'khac_phuc' | 'mom' | 'luyen'
export const CAC_NGUON_NAP_LAI: readonly NguonNapLai[] = ['sql', 'btvn', 'khac_phuc', 'mom', 'luyen']
export const TOI_DA_EM_MOI_LUOT = 20
/** Số tờ đề tối đa đọc từ R2 trong MỘT lượt gọi (giữ dưới giới hạn lệnh con của Worker). */
export const TOI_DA_DOC_R2 = 30

const COT = 'khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de, muc_do'
const CAP_NHAT_THI = `ON CONFLICT(khoa) DO UPDATE SET
   ket_qua = excluded.ket_qua,
   giay = COALESCE(excluded.giay, su_kien_hoc.giay),
   luc = excluded.luc, ngay_vn = excluded.ngay_vn,
   chuyen_de = COALESCE(NULLIF(excluded.chuyen_de, ''), su_kien_hoc.chuyen_de),
   muc_do = COALESCE(NULLIF(excluded.muc_do, ''), su_kien_hoc.muc_do)`

/** SQL đọc thẳng — mỗi câu nhận đúng danh sách SBD (`?,?,…`) ở chỗ `${cho}`. */
export const SQL_NAP_LAI = {
  // Bỏ trống (ô chọn rỗng/gạch) → NULL, giống `suKienThi`. Giờ nộp lấy từ `luot.nop_luc`.
  thi: (cho: string) => `INSERT INTO su_kien_hoc (${COT})
    SELECT 'thi|' || c.ma_ca || '|' || c.sbd || '|' || c.qid || '|' || c.lan_thu, c.sbd, c.qid, 'thi', c.ma_ca, c.lan_thu,
           CASE WHEN trim(COALESCE(c.dap_an_chon, ''), ' -–—_') = '' THEN NULL ELSE c.dung_sai END,
           c.giay, COALESCE(l.nop_luc, c.cap_nhat_luc), date(COALESCE(l.nop_luc, c.cap_nhat_luc), '+7 hours'),
           NULL, COALESCE(c.chuyen_de, ''), COALESCE(c.muc_do, '')
      FROM chi_tiet_cau c LEFT JOIN luot l ON l.ma_ca = c.ma_ca AND l.sbd = c.sbd AND l.lan_thu = c.lan_thu
     WHERE c.sbd IN (${cho}) AND c.qid <> '' AND c.dung_sai IS NOT NULL
       AND date(COALESCE(l.nop_luc, c.cap_nhat_luc), '+7 hours') IS NOT NULL
    ${CAP_NHAT_THI}`,
  lenBang: (cho: string) => `INSERT OR IGNORE INTO su_kien_hoc (${COT})
    SELECT 'len_bang|lb|' || sbd || '|' || qid || '|' || id, sbd, qid, 'len_bang', 'lb', id, dat, NULL, luc,
           date(luc, '+7 hours'), NULL, COALESCE(chuyen_de, ''), ''
      FROM len_bang
     WHERE sbd IN (${cho}) AND qid IS NOT NULL AND qid <> '' AND date(luc, '+7 hours') IS NOT NULL`,
  // Câu có trợ giúp không phải bằng chứng tự làm → bỏ, đúng như đường ghi trực tiếp.
  game: (cho: string) => `INSERT OR IGNORE INTO su_kien_hoc (${COT})
    SELECT 'game|' || session || '|' || sbd || '|' || qid || '|1', sbd, qid, 'game', session, 1,
           CASE WHEN json_extract(json, '$.attempt.correct') = 1 THEN 1 ELSE 0 END, NULL, created_at,
           date(created_at, '+7 hours'), json_extract(json, '$.attempt.dang'), '',
           COALESCE(json_extract(json, '$.attempt.mucDo'), '')
      FROM game_v2_attempt
     WHERE sbd IN (${cho}) AND COALESCE(json_extract(json, '$.attempt.assisted'), 0) = 0
       AND date(created_at, '+7 hours') IS NOT NULL`,
}

function laDsSbd(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null
  const ds = [...new Set(v.map((x) => String(x ?? '').trim()).filter(Boolean))]
  return ds.length ? ds : null
}

const iso = (ms: unknown): string => {
  const n = Number(ms)
  return Number.isFinite(n) && n > 0 ? new Date(n).toISOString() : ''
}

interface Tien {
  daXong: string[]
  chuaXong: string[]
  loi: string[]
  soSuKien: number
}

/** Sổ theo nguồn cho danh sách em — để so trước/sau và dán làm bằng chứng. */
async function demTheoNguon(env: Env, ds: string[]): Promise<Record<string, number>> {
  const cho = ds.map(() => '?').join(',')
  const r = await env.DB.prepare(`SELECT nguon, COUNT(*) AS n FROM su_kien_hoc WHERE sbd IN (${cho}) GROUP BY nguon`)
    .bind(...ds)
    .all<{ nguon: string; n: number }>()
  const ra: Record<string, number> = Object.fromEntries(CAC_NGUON.map((n) => [n, 0]))
  for (const x of r.results ?? []) ra[String(x.nguon)] = Number(x.n) || 0
  return ra
}

export async function napLaiSuKien(env: Env, dsSbd: unknown, nguon: NguonNapLai | undefined): Promise<Record<string, unknown>> {
  const ds = laDsSbd(dsSbd)
  if (!ds) return { ok: false, error: 'Thiếu danh sách SBD (mảng "sbd").' }
  if (ds.length > TOI_DA_EM_MOI_LUOT) return { ok: false, error: `Tối đa ${TOI_DA_EM_MOI_LUOT} em mỗi lượt (đang gửi ${ds.length}).` }
  const chon: NguonNapLai = nguon ?? 'sql'
  if (!CAC_NGUON_NAP_LAI.includes(chon)) return { ok: false, error: `Nguồn không hợp lệ: ${String(nguon)}` }

  let truoc: Record<string, number>
  try {
    truoc = await demTheoNguon(env, ds)
  } catch {
    return { ok: false, error: 'Chưa có bảng su_kien_hoc — thầy cần chạy server/migration-1909-su-kien-hoc.sql trước.' }
  }

  const tien: Tien = { daXong: [], chuaXong: [], loi: [], soSuKien: 0 }
  if (chon === 'sql') {
    const cho = ds.map(() => '?').join(',')
    for (const [ten, sql] of Object.entries(SQL_NAP_LAI)) {
      try {
        await env.DB.prepare(sql(cho)).bind(...ds).run()
      } catch (e) {
        tien.loi.push(`${ten}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    tien.daXong = ds
  } else {
    await napLaiTuR2(env, chon, ds, tien)
  }

  const sau = await demTheoNguon(env, ds)
  return {
    ok: tien.loi.length === 0,
    nguon: chon,
    soEm: ds.length,
    daXong: tien.daXong,
    chuaXong: tien.chuaXong,
    loi: tien.loi,
    soDongTruoc: truoc,
    soDongSau: sau,
    ...(tien.chuaXong.length ? { ghiChu: `Còn ${tien.chuaXong.length} em chưa nạp (hết lượt đọc R2) — gửi lại danh sách "chuaXong".` } : {}),
  }
}

// --- Bốn nguồn phải chấm lại từ tờ đề trên R2 ------------------------------

type Doc = <T>(khoa: string, lay: () => Promise<T>) => Promise<T>

async function napLaiTuR2(env: Env, nguon: Exclude<NguonNapLai, 'sql'>, ds: string[], tien: Tien): Promise<void> {
  let daDoc = 0
  const boNho = new Map<string, unknown>()
  // Mỗi tờ đề chỉ chạm R2 một lần trong cả lượt; hết ngân sách thì dừng ở ranh giới em.
  const doc: Doc = async (khoa, lay) => {
    if (boNho.has(khoa)) return boNho.get(khoa) as never
    if (daDoc >= TOI_DA_DOC_R2) throw new HetLuotDoc()
    daDoc++
    const v = await lay()
    boNho.set(khoa, v)
    return v as never
  }
  for (const sbd of ds) {
    if (daDoc >= TOI_DA_DOC_R2) {
      tien.chuaXong.push(sbd)
      continue
    }
    try {
      const dsSk = await docSuKienMotEm(env, nguon, sbd, doc, tien.loi)
      const r = await ghiSuKien(env, dsSk)
      if (!r.ok) throw new Error(r.loi ?? 'không ghi được sổ')
      tien.soSuKien += r.soGui
      tien.daXong.push(sbd)
    } catch (e) {
      if (e instanceof HetLuotDoc) tien.chuaXong.push(sbd)
      else tien.loi.push(`${nguon}/${sbd}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
}

class KhongCoTepR2 extends Error {}

async function docR2Json(env: Env, khoa: string): Promise<unknown> {
  const o = await env.DE.get(khoa)
  if (!o) throw new KhongCoTepR2(`Không có ${khoa} trên R2`)
  return await new Response(o.body).json()
}

const mangCau = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as Record<string, unknown>[]) : [])
const doiObj = (s: unknown): Record<string, unknown> => {
  try {
    const v = JSON.parse(String(s ?? '{}'))
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

async function docSuKienMotEm(env: Env, nguon: Exclude<NguonNapLai, 'sql'>, sbd: string, doc: Doc, loiRieng: string[]): Promise<SuKien[]> {
  const ra: SuKien[] = []
  if (nguon === 'btvn') {
    const r = await env.DB.prepare(
      `SELECT be.ma_btvn, be.dap_an_json, be.nop_luc, COALESCE(be.so_lan_lam, 1) AS lan, b.ma_de
         FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn
        WHERE be.sbd = ? AND be.nop_luc IS NOT NULL AND be.dap_an_json IS NOT NULL AND be.thu_hoi = 0`,
    ).bind(sbd).all<Record<string, unknown>>()
    for (const x of r.results ?? []) {
      const maDe = String(x.ma_de ?? '')
      const cau = await doc(`kho:${maDe}`, () => homeworkQuestions(env, maDe))
      // Cùng đường với lúc nộp: `dap_an_json` là bản `gradeHomework` đã chuẩn hoá theo qid, chấm lại bằng
      // chính `gradeHomework` rồi dựng sự kiện bằng CÙNG `suKienTuKetQuaCham` → cùng khoá, cùng kết quả.
      // Một tờ hỏng không được kéo sập các bài còn lại của em: ghi lỗi rồi đi tiếp.
      try {
        const g = gradeHomework(homeworkKeys(cau), doiObj(x.dap_an_json), maDe)
        ra.push(...suKienTuKetQuaCham('btvn', String(x.ma_btvn), sbd, Number(x.lan) || 1, String(x.nop_luc), g))
      } catch (e) {
        loiRieng.push(`btvn ${String(x.ma_btvn)}/${sbd}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  } else if (nguon === 'khac_phuc') {
    const r = await env.DB.prepare('SELECT ma_phieu, dap_an_json, nop_luc FROM nop_khac_phuc WHERE sbd = ?')
      .bind(sbd).all<Record<string, unknown>>()
    for (const x of r.results ?? []) {
      const ma = String(x.ma_phieu ?? '')
      const dapAn = doiObj(x.dap_an_json)
      // Cùng luật với `nopKhacPhuc`: có phiếu trên R2 thì chấm theo phiếu; không có (phiếu máy em tự sinh)
      // thì chấm theo tờ kho bằng qid. Chỉ lỗi "không có phiếu" mới rơi sang kho — lỗi khác vẫn báo.
      let cau: CauChamBai[] = []
      try {
        const goi = (await doc(`phieu:${ma}`, () => docR2Json(env, `phieu/${ma}.json`))) as Record<string, unknown>
        cau = mangCau((goi.phieu as Record<string, unknown> | undefined)?.cau).flatMap((c) => {
          const qid = String(c.id ?? '').trim()
          const dung = String(c.dapAn ?? '').trim().toUpperCase()
          return qid && dung ? [{ qid, dapAnDung: dung, chuyenDe: String(c.chuyenDe ?? ''), mucDo: String(c.mucDo ?? '') }] : []
        })
      } catch (e) {
        if (e instanceof HetLuotDoc || !(e instanceof KhongCoTepR2)) throw e
      }
      if (cau.length === 0) cau = await cauTuKhoTheoQid(env, Object.keys(dapAn), (g) => doc(`kho:${g}`, () => homeworkQuestions(env, g)))
      ra.push(...suKienChamBai('khac_phuc', ma, sbd, 1, String(x.nop_luc), cau, dapAn))
    }
  } else if (nguon === 'mom') {
    const r = await env.DB.prepare('SELECT id, answers, bank_key, submitted_at FROM mom_bai WHERE sbd = ? AND submitted_at IS NOT NULL')
      .bind(sbd).all<Record<string, unknown>>()
    for (const x of r.results ?? []) {
      const key = String(x.bank_key ?? '')
      const q = mangCau(await doc(`mom:${key}`, () => docR2Json(env, key)))
      // Cùng luật với `mom.ts`: câu không có mã thật (`cau_N`) không định danh được → bỏ.
      const cau: CauChamBai[] = q.flatMap((c) => {
        const qid = String(c.id ?? '').trim()
        return qid && !/^cau_\d+$/.test(qid)
          ? [{ qid, dapAnDung: String(c.dapAn || c.dapAnDung || 'A'), chuyenDe: String(c.chuyenDe ?? ''), mucDo: String(c.mucDo ?? ''), phan: typeof c.phan === 'string' ? c.phan : undefined }]
          : []
      })
      ra.push(...suKienChamBai('mom', String(x.id), sbd, 1, String(x.submitted_at), cau, doiObj(x.answers)))
    }
  } else {
    const r = await env.DB.prepare("SELECT id, answers, bank_key, updated_at, result FROM luyen_de_2026 WHERE sbd = ? AND status = 'submitted'")
      .bind(sbd).all<Record<string, unknown>>()
    for (const x of r.results ?? []) {
      const key = String(x.bank_key ?? '')
      const nguonDe = (await doc(`luyen:${key}`, () => docR2Json(env, key))) as Parameters<typeof suKienLuyenDe>[3]
      const kq = doiObj(x.result)
      ra.push(...suKienLuyenDe(sbd, String(x.id), iso(x.updated_at) || new Date(0).toISOString(), Array.isArray(nguonDe) ? nguonDe : [],
        doiObj(x.answers) as Record<string, string>, (kq.detail ?? {}) as Record<string, { points: number }>))
    }
  }
  return ra
}

// --- Đếm kiểm chéo ---------------------------------------------------------

/**
 * "Số sự kiện thi = số dòng chi_tiet_cau" (nghiệm thu GĐ 0). Vế `chiTiet` đếm KHOÁ khác nhau
 * (ca|em|lượt|qid) của dòng đã chấm có qid — đúng những gì `suKienThi` được phép ghi.
 * Chỉ ĐỌC. `sbd` bỏ trống thì đếm toàn hệ thống.
 */
export async function kiemCheoSuKien(env: Env, dsSbd: unknown): Promise<Record<string, unknown>> {
  const ds = laDsSbd(dsSbd)
  const loc = (cot: string) => (ds ? ` AND ${cot} IN (${ds.map(() => '?').join(',')})` : '')
  const tham = ds ?? []
  try {
    const thi = await env.DB.prepare(`SELECT COUNT(*) AS n FROM su_kien_hoc WHERE nguon = 'thi'${loc('sbd')}`).bind(...tham).first<{ n: number }>()
    const ct = await env.DB.prepare(
      `SELECT COUNT(DISTINCT ma_ca || '|' || sbd || '|' || lan_thu || '|' || qid) AS n FROM chi_tiet_cau
        WHERE qid <> '' AND dung_sai IS NOT NULL${loc('sbd')}`,
    ).bind(...tham).first<{ n: number }>()
    const chua = await env.DB.prepare(`SELECT COUNT(*) AS n FROM chi_tiet_cau WHERE qid <> '' AND dung_sai IS NULL${loc('sbd')}`).bind(...tham).first<{ n: number }>()
    const theo = await env.DB.prepare(`SELECT nguon, COUNT(*) AS n FROM su_kien_hoc WHERE 1 = 1${loc('sbd')} GROUP BY nguon`)
      .bind(...tham).all<{ nguon: string; n: number }>()
    const suKien = Number(thi?.n) || 0
    const chiTiet = Number(ct?.n) || 0
    return {
      ok: true,
      phamVi: ds ? `${ds.length} em` : 'toàn hệ thống',
      thi: { suKien, chiTiet, khop: suKien === chiTiet, lech: suKien - chiTiet, chiTietChuaCham: Number(chua?.n) || 0 },
      theoNguon: Object.fromEntries((theo.results ?? []).map((x) => [String(x.nguon) as NguonSuKien, Number(x.n) || 0])),
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
