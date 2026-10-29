// CẦU NỐI CHUỖI NGÀY ⇄ THƯỞNG PHẠT — TỆP MỎNG. Chuỗi ngày + bình giữ chuỗi + cứu chuỗi là làn của «Code app 4» (B3, PR #396 đã lên main:
// `chuoi-ngay-bai.ts` hàm thuần, `chuoi-ngay-bai-d1.ts` phần D1). Phía thưởng phạt (tác tử A, 26/10) CHỈ ĐỌC chuỗi và gọi hàm cộng bình của B3; KHÔNG tự
// viết luật chuỗi. Mọi chỗ gọi B3 đi qua đây ⇒ B3 đổi chữ ký thì chỉ sửa tệp này. Test thay phần thân bằng `datCauNoiChuoi` (giả lập).
//   · `chuoiNgay`: đúng trường B3 trả (gác cờ `duolingo_bai` như B3 — cờ tắt ⇒ null, giao diện ẩn khối chuỗi; không bịa số);
//   · mua bình: nơi gọi TRỪ tinh thể trước (khoá chống lặp), rồi `congBinhGiuChuoi` (id = khoá giao dịch ví ⇒ gọi lại không cộng đôi);
//   · «ngày có học» / «ngày được đỡ» (thăng hoa, cược) dùng ĐÚNG định nghĩa B3: ≥ CAU_MOT_BAI câu khác nhau có kết quả trong ngày VN hoặc tự sửa xong;
//     được đỡ = vắng có phép (chỉ ngày trước 27/10), bình đã dùng, ngày đã cứu.
import type { Env } from './kieu'
import { CAU_MOT_BAI, chuoiNgayCuaEm, ngayVn, NGAY_CHUOI_DU_MUC, phepConGiuChuoi, SQL_CAU_TINH_MUC, SQL_CO_KET_QUA_HOAC_LUOT, type ChuoiNgay as ChuoiNgayB3 } from './chuoi-ngay-bai'
import { chuoiBaiNeuBat, congBinh, docNhatKyChuoi } from './chuoi-ngay-bai-d1'
import { ngayBaoTriTrong } from './ngay-bao-tri'

/** Trường dùng chung §4.3 (B3 trả; thêm 'cuu' | 'cho' theo hợp đồng docs/hop-dong-duolingo-2610.md mục 4). */
export type ChuoiNgay = ChuoiNgayB3

/** Số em tối đa mỗi lượt cron được tính lại chuỗi từng em (4 lượt đọc song song mỗi em) để biết ngày nào bình đã đỡ. */
export const TOI_DA_EM_TINH_BINH = 60
/** Dấu trong `docNgayDuocDo`: em CHƯA tính được bình lượt này (vượt ngân sách) ⇒ nơi gọi không được phạt em. */
export const CHUA_TINH_BINH = '*'

export interface CauNoiChuoi {
  /** Chuỗi ngày của em (bắt đầu SỚM, song song lượt đọc khác — không thêm vòng chờ). Cờ tắt / lỗi ⇒ null. Không bao giờ ném. */
  docChuoiNgay(env: Env, sbd: string, nowMs: number, thang?: boolean): Promise<ChuoiNgay | null>
  /** Cộng 1 bình giữ chuỗi (đã trừ tinh thể ở nơi gọi). `id` chống trùng. */
  congBinh(env: Env, sbd: string, id: string, nowMs: number): Promise<boolean>
  /** Ngày VN CÓ HỌC (≥ 1 chặng) của các em trong [tu, den]. `duMuc` (28/10, cược chuỗi) ⇒ ngày GIỮ CHUỖI theo luật mới: từ NGAY_CHUOI_DU_MUC phải đủ mức. */
  docNgayCoHoc(env: Env, ds: readonly string[], tu: string, den: string, duMuc?: boolean): Promise<Map<string, Set<string>>>
  /** Ngày được ĐỠ (vắng có phép, bình đã dùng, ngày đã cứu) — thăng hoa không phạt ngày ấy. */
  docNgayDuocDo(env: Env, ds: readonly string[], tu: string, den: string, nowMs: number): Promise<Map<string, Set<string>>>
  /** Ngày vắng CÓ PHÉP — cược chuỗi không thua vì ngày ấy (bình thì vẫn thua, LUAT «Cược chuỗi»). */
  docNgayCoPhep(env: Env, ds: readonly string[], tu: string, den: string): Promise<Map<string, Set<string>>>
}

type Dong = { sbd: unknown; ngay: unknown }
const gom = (...ds: readonly Dong[][]): Map<string, Set<string>> => {
  const m = new Map<string, Set<string>>()
  for (const rows of ds) for (const r of rows) { const s = String(r.sbd); if (!m.has(s)) m.set(s, new Set()); m.get(s)!.add(String(r.ngay)) }
  return m
}
const rongNeuLoi = (p: Promise<{ results?: Dong[] }>): Promise<Dong[]> => p.then((r) => r.results ?? [], () => [])
const congNgayCN = (ngay: string, n: number) => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
const dauNgayIso = (ngay: string) => new Date(Date.parse(`${ngay}T00:00:00+07:00`)).toISOString()
const cuoiNgayIso = (ngay: string) => new Date(Date.parse(`${ngay}T00:00:00+07:00`) + 86_400_000).toISOString()

/** Vắng có phép theo ngày VN của buổi (đúng câu B3, chạy cho cả lô em). Luật 27/10: chỉ ngày TRƯỚC mốc còn giữ chuỗi ⇒ ngày từ mốc bỏ. */
function docPhep(env: Env, ds: readonly string[], tu: string, den: string): Promise<Dong[]> {
  // + ngày bảo trì (ngay-bao-tri.ts): mọi em được đỡ ngày đó (thăng hoa không phạt, cược không thua).
  const baoTri = ngayBaoTriTrong(tu, den).flatMap((ngay) => ds.map((sbd) => ({ sbd, ngay })))
  return docPhepTho(env, ds, tu, den).then((r) => [...r.filter((x) => phepConGiuChuoi(String(x.ngay))), ...baoTri])
}
function docPhepTho(env: Env, ds: readonly string[], tu: string, den: string): Promise<Dong[]> {
  return rongNeuLoi(env.DB.prepare(`SELECT DISTINCT d.sbd AS sbd, date(b.mo_luc, '+7 hours') AS ngay FROM buoi_hoc_diem_danh d JOIN buoi_hoc b ON b.id = d.buoi_id
      WHERE d.sbd IN (SELECT value FROM json_each(?)) AND d.trang_thai = 'co_phep' AND b.mo_luc >= ? AND b.mo_luc < ?`).bind(JSON.stringify(ds), dauNgayIso(tu), cuoiNgayIso(den)).all<Dong>())
}

const B3: CauNoiChuoi = {
  docChuoiNgay: (env, sbd, nowMs, thang) => chuoiBaiNeuBat(env, sbd, nowMs, env, !!thang),
  congBinh: (env, sbd, id, nowMs) => congBinh(env, sbd, 1, 'tinh_the', id, nowMs),
  async docNgayCoHoc(env, ds, tu, den, duMuc) {
    if (!ds.length) return new Map()
    const [a, b] = await Promise.all([
      rongNeuLoi(env.DB.prepare(duMuc
        ? `SELECT sbd, ngay_vn AS ngay FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay_vn >= ?2 AND ngay_vn <= ?3 AND ${SQL_CO_KET_QUA_HOAC_LUOT}
            GROUP BY sbd, ngay_vn HAVING (ngay_vn < '${NGAY_CHUOI_DU_MUC}' AND COUNT(DISTINCT CASE WHEN ket_qua IS NOT NULL THEN qid END) >= ?4)
              OR (ngay_vn >= '${NGAY_CHUOI_DU_MUC}' AND COUNT(DISTINCT CASE WHEN ${SQL_CAU_TINH_MUC} THEN qid END)
                  >= COALESCE((SELECT g.muc FROM goi_bai_7_muc_ngay g WHERE g.sbd = su_kien_hoc.sbd AND g.ngay = su_kien_hoc.ngay_vn AND g.muc > 0), ?4))`
        : `SELECT sbd, ngay_vn AS ngay FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay_vn >= ?2 AND ngay_vn <= ?3 AND ket_qua IS NOT NULL
            GROUP BY sbd, ngay_vn HAVING COUNT(DISTINCT qid) >= ?4`).bind(JSON.stringify(ds), tu, den, CAU_MOT_BAI).all<Dong>()),
      // Tự sửa xong: chỉ còn giữ chuỗi ở ngày TRƯỚC 28/10 khi `duMuc`.
      duMuc && tu >= NGAY_CHUOI_DU_MUC ? Promise.resolve([] as Dong[]) : rongNeuLoi(env.DB.prepare(`SELECT DISTINCT sbd, date(dong_luc, '+7 hours') AS ngay FROM chua_loi_dot WHERE sbd IN (SELECT value FROM json_each(?)) AND trang_thai_day = 'da_tu_sua'
          AND dong_luc >= ? AND dong_luc < ?`).bind(JSON.stringify(ds), dauNgayIso(tu), cuoiNgayIso(duMuc && den >= NGAY_CHUOI_DU_MUC ? congNgayCN(NGAY_CHUOI_DU_MUC, -1) : den)).all<Dong>()),
    ])
    return gom(a, b)
  },
  async docNgayDuocDo(env, ds, tu, den, nowMs) {
    if (!ds.length) return new Map()
    // Bình chỉ đỡ khi chuỗi đang sống ⇒ chỉ em có học trong 10 ngày trước mới cần tính chuỗi từng em (B3, hàm thuần); còn lại chỉ có ngày phép.
    const [phep, ganDay] = await Promise.all([
      docPhep(env, ds, tu, den),
      rongNeuLoi(env.DB.prepare(`SELECT DISTINCT sbd, '' AS ngay FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn >= ? AND ngay_vn <= ?`)
        .bind(JSON.stringify(ds), new Date(Date.parse(`${tu}T00:00:00Z`) - 10 * 86_400_000).toISOString().slice(0, 10), den).all<Dong>()),
    ])
    const tatCa = ganDay.map((x) => String(x.sbd))
    const tinh = tatCa.slice(0, TOI_DA_EM_TINH_BINH)
    const homNay = ngayVn(nowMs)
    const doDo: Dong[] = tatCa.slice(TOI_DA_EM_TINH_BINH).map((sbd) => ({ sbd, ngay: CHUA_TINH_BINH }))
    for (let i = 0; i < tinh.length; i += 10) {
      await Promise.all(tinh.slice(i, i + 10).map(async (sbd) => {
        try {
          const c = chuoiNgayCuaEm(await docNhatKyChuoi(env, sbd, nowMs), homNay)
          for (const n of c.lich7) if (n.ngay >= tu && n.ngay <= den && (n.kieu === 'binh' || n.kieu === 'phep' || n.kieu === 'cuu')) doDo.push({ sbd, ngay: n.ngay })
        } catch { doDo.push({ sbd, ngay: CHUA_TINH_BINH }) /* lỗi đọc ⇒ không phạt em lượt này */ }
      }))
    }
    return gom(phep, doDo)
  },
  async docNgayCoPhep(env, ds, tu, den) {
    return ds.length ? gom(await docPhep(env, ds, tu, den)) : new Map()
  },
}

let hienTai: CauNoiChuoi = B3

/** Thay phần thân (test dùng bản giả). Truyền null ⇒ về B3 thật. */
export function datCauNoiChuoi(x: Partial<CauNoiChuoi> | null): void {
  hienTai = x ? { ...B3, ...x } : B3
}
export const cauNoiChuoi = (): CauNoiChuoi => hienTai

/**
 * Hàm cộng bình giữ chuỗi (tên do điều phối chốt). Chỉ cộng — KHÔNG trừ tinh thể (việc trừ ở `/hs/thuong/mua-binh`, làm TRƯỚC).
 * `ok: true` khi bình mang `id` đã có trong sổ của B3 (vừa ghi, hoặc ghi từ lần gọi trước — gọi lại không cộng đôi). Lỗi ghi ⇒ `ok: false` (nơi gọi hoàn tinh thể).
 */
export async function congBinhGiuChuoi(env: Env, em: string, id: string, nowMs: number = Date.now()): Promise<{ ok: boolean }> {
  try { await hienTai.congBinh(env, em, id, nowMs); return { ok: true } } catch { return { ok: false } }
}
