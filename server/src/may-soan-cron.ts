// MÁY SOẠN «LỜI GIẢI KIỂU SƠ ĐỒ» CHẠY BẰNG CRON SẴN CÓ (27/10; thầy: «Tự làm hết đi», «tôi ko làm gì cả»).
// Workflow GitHub không gọi được route quản trị (Actions không có mã bí mật của thầy) ⇒ cron mỗi phút của Worker tự gọi `soanSoDoLo` (soan-so-do.ts)
// theo lô nhỏ tới hết kho, rồi một vòng sửa câu lệch. KHÔNG có route / mã / đường xác thực mới: bật tắt bằng cờ `cau_hinh.may_soan_so_do`
// (workflow .github/workflows/bat-may-soan-so-do-2710.yml ghi cờ bằng wrangler d1).
//
//   · CỜ `may_soan_so_do` = {"bat":bool,"gioCaoDiem"?:bool,"tuSuaDapAn"?:bool}, đọc qua đệm 15 s (`docCauHinhDem`, như cờ `duolingo_bai`).
//     Vắng / hỏng / bat:false ⇒ trả ngay (≤ 1 câu đọc, thường 0 nhờ đệm).
//   · BẢNG CHỈ-THÊM `may_soan_trang_thai` (một dòng id = 1; migration-2710-may-soan-cron.sql + CREATE IF NOT EXISTS một lần mỗi isolate):
//       vong 'chinh' (quét kho, con trỏ «ma_de|qid» của soanSoDoLo) ⇒ 'sua' (câu đang lech / lo_dap_an, con trỏ = qid cuối đã xử lý) ⇒ 'xong' (không gọi gì nữa).
//   · KHOÁ CHẠY (lease): UPDATE … SET dang_chay_den = now + THOI_HAN_KHOA_MS WHERE dang_chay_den < now ⇒ không đổi dòng nào thì có lượt khác đang chạy.
//     Giá trị `dang_chay_den` của lượt là THẺ SỞ HỮU: lưu trạng thái + nhả khoá đều kèm `AND dang_chay_den = <thẻ>` ⇒ lượt chạy quá giờ bị lượt khác
//     giành khoá thì KHÔNG ghi đè con trỏ / vòng mới hơn.
//   · TỰ HÃM (hạn mức Gemini dùng chung với Hỏi thầy): lượt mà mọi câu đều `loi_goi`, hoặc gặp 429 / 503, hoặc lỗi ném ra ⇒ so_loi_lien_tiep++;
//     đạt 3 ⇒ nghỉ 30 phút. Lượt có câu soạn được ⇒ về 0. Hết giờ nghỉ mà lượt đầu lại lỗi ⇒ nghỉ tiếp 30 phút (bộ đếm không xoá khi bắt đầu nghỉ).
//   · GIỜ CAO ĐIỂM 19–24h VN: chỉ chạy khi cờ `gioCaoDiem`, và `songSong` 1.
//   · TỰ SỬA ĐÁP ÁN KHO: MẶC ĐỊNH TẮT (soanSoDoLo mặc định BẬT ⇒ luôn truyền boolean rõ ràng). Lý do: lời giải chữ trong gói R2 (`loi_giai.buoc` / `chot` /
//     `noi_dung` / `tung_pa[X].vi_sao`) là CHỮ TỰ DO vẫn tính ra đáp án cũ — chỉ đổi `dap_an` thì lời giải cũ tự mâu thuẫn. Chỉ bật khi cờ `tuSuaDapAn:true`,
//     và lượt đó KHÔNG có chặng kiểm tra cá nhân nào đang mở (đếm theo đúng điều kiện cổng phát hành; lỗi đếm ⇒ coi như có, đóng cửa).
//   · Lỗi bất kỳ chỉ ghi log + trạng thái (ly_do do cron tự viết, KHÔNG chép lý do / giá trị từng câu — có thể chứa đáp án; repo công khai).
import type { Env } from './kieu'
import { docCauHinhDem, dbGoc } from './cau-hinh-dem'

export const KHOA_MAY_SOAN = 'may_soan_so_do'
export interface CoMaySoan { bat: boolean; gioCaoDiem: boolean; tuSuaDapAn: boolean }

/** Giá trị thô ⇒ cờ. Vắng / hỏng ⇒ tắt hết. Chỉ `true` thật mới bật. */
export function docCoMaySoan(v: string | null | undefined): CoMaySoan {
  if (!v) return { bat: false, gioCaoDiem: false, tuSuaDapAn: false }
  try {
    const j = JSON.parse(v) as Record<string, unknown> | null
    return { bat: j?.bat === true, gioCaoDiem: j?.gioCaoDiem === true, tuSuaDapAn: j?.tuSuaDapAn === true }
  } catch { return { bat: false, gioCaoDiem: false, tuSuaDapAn: false } }
}

/** Khoá chạy: một lượt soạn (lô 6 câu, có câu thử 4 lượt + 2 lần giải mù, mỗi lần gọi tới 60 s) thường quá 90 s ⇒ 5 phút để lượt phút sau không gọi chồng
 *  (gấp đôi chi Gemini). Máy chết giữa chừng ⇒ tối đa 5 phút là lượt sau tự giành lại. */
export const THOI_HAN_KHOA_MS = 300_000
export const NGHI_KHI_LOI_MS = 30 * 60_000
export const SO_LOI_DE_NGHI = 3
export const GIOI_HAN_MOI_LUOT = 6
export const NGAN_SACH_GIAY = 25
export const SONG_SONG = 3

/** Câu vòng sửa: CHÉP NGUYÊN `SQL_CAN_SUA` của soan-so-do.ts (không nạp máy soạn khi cờ tắt); test may-soan-cron-2710 giữ hai bản bằng nhau. */
export const SQL_CAN_SUA = `cong IN ('lech', 'lo_dap_an') OR (cong = 'khong_kiem_duoc' AND ly_do = 'Câu tính thiếu sơ đồ hoặc bước tính.')`
/** 19:00–23:59 giờ VN — cùng mốc với `laGioCaoDiem` của soan-so-do.ts (viết lại ở đây để không nạp cả máy soạn khi cờ tắt). */
export const laGioCaoDiemSoan = (ms: number) => (new Date(ms).getUTCHours() + 7) % 24 >= 19

export const SQL_BANG_MAY_SOAN: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS may_soan_trang_thai (id INTEGER PRIMARY KEY, vong TEXT NOT NULL, con_tro TEXT NOT NULL DEFAULT '',
    dang_chay_den INTEGER NOT NULL DEFAULT 0, so_loi_lien_tiep INTEGER NOT NULL DEFAULT 0, nghi_den INTEGER NOT NULL DEFAULT 0, ly_do TEXT,
    dem_json TEXT NOT NULL DEFAULT '{}', cap_nhat_luc TEXT)`,
  `INSERT OR IGNORE INTO may_soan_trang_thai (id, vong, con_tro, dang_chay_den, so_loi_lien_tiep, nghi_den, dem_json) VALUES (1, 'chinh', '', 0, 0, 0, '{}')`,
]

/** Chặng kiểm tra cá nhân đang mở — ĐÚNG điều kiện cổng phát hành (scripts/hoi-thay-van-hanh.mjs `SQL_CHANG_MO`). */
const SQL_CHANG_KTCN_MO = `SELECT COUNT(*) AS n FROM kiem_tra_ca_nhan_chang c JOIN kiem_tra_ca_nhan k ON k.id = c.bai_id
  WHERE k.nop_luc IS NULL AND c.chot_luc IS NULL AND c.bat_dau <= ? AND c.han > ?`

type Obj = Record<string, unknown>
type Vong = 'chinh' | 'sua' | 'xong'
export interface TrangThaiMaySoan { vong: Vong; conTro: string; dangChayDen: number; soLoiLienTiep: number; nghiDen: number; lyDo: string | null; dem: Record<string, number> }
export type SoanLo = (env: Env, thamSo: unknown) => Promise<Response>
export interface PhuMaySoan { soanLo?: SoanLo }
export interface KetQuaCron { chay: boolean; lyDo: string; vong?: Vong; daXuLy?: number; tuSuaDapAn?: boolean; nghi?: boolean }

const daDungBang = new WeakMap<object, Promise<void>>()
/** CREATE + dòng id 1 MỘT lần mỗi isolate (theo D1 gốc). Lỗi ⇒ bỏ ghi nhớ, phút sau thử lại. */
function damBaoBang(env: Env): Promise<void> {
  const goc = dbGoc(env.DB as unknown as object)
  let p = daDungBang.get(goc)
  if (!p) {
    p = env.DB.batch(SQL_BANG_MAY_SOAN.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => { if (daDungBang.get(goc) === p) daDungBang.delete(goc) })
    daDungBang.set(goc, p)
  }
  return p
}

function docTrangThai(x: Obj | undefined): TrangThaiMaySoan {
  const vong = x?.vong === 'sua' || x?.vong === 'xong' ? x.vong : 'chinh'
  let dem: Record<string, number> = {}
  try {
    const j = JSON.parse(String(x?.dem_json ?? '{}')) as Obj
    for (const [k, v] of Object.entries(j ?? {})) if (Number.isFinite(Number(v))) dem[k] = Number(v)
  } catch { dem = {} }
  return {
    vong, conTro: String(x?.con_tro ?? ''), dangChayDen: Number(x?.dang_chay_den) || 0, soLoiLienTiep: Number(x?.so_loi_lien_tiep) || 0,
    nghiDen: Number(x?.nghi_den) || 0, lyDo: x?.ly_do == null ? null : String(x.ly_do), dem,
  }
}

/** Đếm chặng KTCN đang mở. Bảng chưa có ⇒ 0. Lỗi khác ⇒ ném (nơi gọi coi như CÓ chặng mở). */
async function demChangKtcnMo(env: Env, nowMs: number): Promise<number> {
  try {
    const r = await env.DB.prepare(SQL_CHANG_KTCN_MO).bind(nowMs, nowMs).first<{ n: number }>()
    return Number(r?.n) || 0
  } catch (e) {
    if (/no such table/i.test(e instanceof Error ? e.message : String(e))) return 0
    throw e
  }
}

/** Vòng SỬA: lấy tiếp các câu đang lệch / lộ đáp án SAU qid đã xử lý (con trỏ theo khoá, không lệch khi câu vừa sửa xong rời danh sách). */
async function cauSuaTiep(env: Env, sau: string): Promise<string[]> {
  try {
    const r = await env.DB.prepare(`SELECT qid FROM loi_giai_so_do WHERE (${SQL_CAN_SUA}) AND qid > ? ORDER BY qid LIMIT ${GIOI_HAN_MOI_LUOT}`)
      .bind(sau).all<{ qid: string }>()
    return (r.results ?? []).map((x) => String(x.qid ?? '')).filter(Boolean)
  } catch (e) {
    if (/no such table/i.test(e instanceof Error ? e.message : String(e))) return []
    throw e
  }
}

const RE_HAN_MUC = /\bHTTP (429|503)\b/
/** Cùng mẫu `RE_QID` của soan-so-do.ts (`docThamSo`): một qid sai mẫu làm CẢ lô `qids` trả 400 ⇒ lọc trước, qid sai mẫu bị bước qua. */
const RE_QID = /^[A-Za-z0-9][A-Za-z0-9._~:-]{0,120}$/
const ngan = (s: string) => s.replace(/\s+/g, ' ').slice(0, 160)

/**
 * Một lượt cron (gọi mỗi phút trong nhánh `* * * * *` của `scheduled`). Không bao giờ ném: lỗi ⇒ log + trạng thái.
 * `phu.soanLo` thay `soanSoDoLo` trong test.
 */
export async function chayMaySoanCron(env: Env, nowMs: number, phu: PhuMaySoan = {}): Promise<KetQuaCron> {
  let co: CoMaySoan
  try { co = docCoMaySoan(await docCauHinhDem(env, KHOA_MAY_SOAN, nowMs)) } catch { return { chay: false, lyDo: 'khong_doc_duoc_co' } }
  if (!co.bat) return { chay: false, lyDo: 'co_tat' }
  const caoDiem = laGioCaoDiemSoan(nowMs)
  if (caoDiem && !co.gioCaoDiem) return { chay: false, lyDo: 'gio_cao_diem' }

  let the = 0
  try {
    await damBaoBang(env)
    the = nowMs + THOI_HAN_KHOA_MS
    const [giu, doc] = await env.DB.batch([
      env.DB.prepare("UPDATE may_soan_trang_thai SET dang_chay_den = ? WHERE id = 1 AND dang_chay_den < ? AND nghi_den <= ? AND vong <> 'xong'").bind(the, nowMs, nowMs),
      env.DB.prepare('SELECT * FROM may_soan_trang_thai WHERE id = 1'),
    ])
    const tt = docTrangThai(((doc as { results?: Obj[] } | undefined)?.results ?? [])[0])
    if (!Number((giu as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)) {
      const lyDo = tt.vong === 'xong' ? 'da_xong' : tt.nghiDen > nowMs ? 'dang_nghi' : 'dang_chay'
      return { chay: false, lyDo, vong: tt.vong }
    }

    // TỰ SỬA ĐÁP ÁN: chỉ khi cờ bật rõ ràng VÀ không có chặng KTCN đang mở.
    let tuSua = false
    if (co.tuSuaDapAn) {
      try { tuSua = (await demChangKtcnMo(env, nowMs)) === 0 } catch { tuSua = false }
    }

    let vong: Vong = tt.vong
    let conTro = tt.conTro
    const dem = { ...tt.dem }
    let soLoi = tt.soLoiLienTiep
    let lyDo: string | null = null
    let daXuLy = 0

    const thamChung = {
      gioiHan: GIOI_HAN_MOI_LUOT, nganSachGiay: NGAN_SACH_GIAY, songSong: caoDiem ? 1 : SONG_SONG, choChayGioCaoDiem: true, tuSuaDapAn: tuSua,
    }
    let qidsSua: string[] | null = null
    let cuoiTrang = ''
    let goi = true
    if (vong === 'sua') {
      const trang = await cauSuaTiep(env, conTro)
      qidsSua = trang.filter((q) => RE_QID.test(q))
      if (!trang.length) { vong = 'xong'; conTro = ''; lyDo = 'đã soạn hết kho và xong vòng sửa'; goi = false }
      else if (!qidsSua.length) { conTro = trang[trang.length - 1]!; goi = false } // cả trang là qid sai mẫu ⇒ bước qua, không gọi
      else cuoiTrang = trang[trang.length - 1]!
    }
    if (goi) {
      const soanLo = phu.soanLo ?? (await import('./soan-so-do')).soanSoDoLo
      const thamSo = vong === 'sua' ? { ...thamChung, qids: qidsSua, chiSuaLoi: true } : { ...thamChung, conTro }
      let r: Response | null = null
      let body: Obj | null = null
      try {
        r = await soanLo(env, thamSo)
        body = (await r.json().catch(() => null)) as Obj | null
      } catch (e) {
        soLoi++
        lyDo = `lỗi lượt soạn: ${ngan(e instanceof Error ? e.message : String(e))}`
      }
      if (r) {
        const ketQua = Array.isArray(body?.ketQua) ? (body!.ketQua as Obj[]) : []
        daXuLy = ketQua.length
        const soDuoc = ketQua.filter((k) => k.ket !== 'loi_goi' && k.ket !== 'hong').length
        const hanMuc = r.status === 429 || r.status === 503 || ketQua.some((k) => k.ket === 'loi_goi' && RE_HAN_MUC.test(String(k.lyDo ?? '')))
        const tatCaLoiGoi = ketQua.length > 0 && ketQua.every((k) => k.ket === 'loi_goi')
        if (!r.ok || body?.ok !== true) {
          if (r.status === 429 || r.status === 503) soLoi++
          // Vòng sửa: lô bị từ chối vì lý do khác hạn mức (vd 400) ⇒ bước qua lô, không kẹt mãi một chỗ.
          else if (vong === 'sua' && cuoiTrang) conTro = cuoiTrang
          lyDo = `máy soạn trả HTTP ${r.status}${typeof body?.ma === 'string' ? ` (${ngan(body.ma)})` : ''}`
        } else {
          const d = (body.dem ?? {}) as Obj
          for (const [k, v] of Object.entries(d)) if (Number.isFinite(Number(v))) dem[k] = (dem[k] ?? 0) + Number(v)
          dem.luot = (dem.luot ?? 0) + 1
          if (soDuoc > 0) { soLoi = 0; lyDo = null }
          else if (tatCaLoiGoi || hanMuc) { soLoi++; lyDo = hanMuc ? 'Gemini báo hết hạn mức (429/503)' : 'mọi câu trong lượt đều lỗi gọi mô hình' }
          const xong = body.xong === true
          if (vong === 'chinh') {
            if (xong) { vong = 'sua'; conTro = ''; lyDo = lyDo ?? 'xong vòng chính, sang vòng sửa câu lệch' } else conTro = String(body.conTro ?? conTro)
          } else if (qidsSua) {
            // conTro của soanSoDoLo là «#n» trong danh sách qids vừa truyền ⇒ đổi ra qid cuối đã xử lý; xong cả lô ⇒ qid cuối TRANG (kể cả qid sai mẫu ở đuôi).
            const n = /^#\d+$/.test(String(body.conTro ?? '')) ? Number(String(body.conTro).slice(1)) : 0
            if (xong) conTro = cuoiTrang || conTro
            else if (n > 0) conTro = qidsSua[Math.min(n, qidsSua.length) - 1]!
          }
        }
      }
    }

    let nghiDen = tt.nghiDen
    if (soLoi >= SO_LOI_DE_NGHI) {
      nghiDen = nowMs + NGHI_KHI_LOI_MS
      lyDo = `nghỉ 30 phút sau ${soLoi} lượt lỗi liên tiếp${lyDo ? ` — ${lyDo}` : ''}`
    }
    // Lưu + nhả khoá trong MỘT câu, chỉ khi còn giữ đúng thẻ của lượt này.
    const luu = await env.DB.prepare(`UPDATE may_soan_trang_thai SET vong = ?, con_tro = ?, dang_chay_den = 0, so_loi_lien_tiep = ?, nghi_den = ?, ly_do = ?,
      dem_json = ?, cap_nhat_luc = ? WHERE id = 1 AND dang_chay_den = ?`)
      .bind(vong, conTro, soLoi, nghiDen, lyDo ? lyDo.slice(0, 200) : null, JSON.stringify(dem), new Date(nowMs).toISOString(), the).run()
    if (!Number(luu.meta?.changes ?? 0)) console.warn('[may-soan] lượt chạy quá giờ khoá, lượt khác đã giành — bỏ lưu trạng thái lượt này')
    return { chay: true, lyDo: lyDo ?? 'ok', vong, daXuLy, tuSuaDapAn: tuSua, nghi: nghiDen > nowMs }
  } catch (e) {
    console.error('[may-soan] cron lỗi:', e)
    // Ghi lỗi + nhả khoá (nếu đang giữ). Lỗi tiếp ở đây cũng chỉ ghi log.
    if (the) {
      await env.DB.prepare(`UPDATE may_soan_trang_thai SET dang_chay_den = 0, so_loi_lien_tiep = so_loi_lien_tiep + 1,
        nghi_den = CASE WHEN so_loi_lien_tiep + 1 >= ? THEN ? ELSE nghi_den END, ly_do = ?, cap_nhat_luc = ? WHERE id = 1 AND dang_chay_den = ?`)
        .bind(SO_LOI_DE_NGHI, nowMs + NGHI_KHI_LOI_MS, `lỗi cron: ${ngan(e instanceof Error ? e.message : String(e))}`, new Date(nowMs).toISOString(), the)
        .run().catch((e2) => console.error('[may-soan] ghi trạng thái lỗi:', e2))
    }
    return { chay: false, lyDo: 'loi' }
  }
}
