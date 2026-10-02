// THANG TỰ GỠ — Vòng học khép kín v2, Giai đoạn 2 (phía HỌC SINH). Mỗi câu em sai đi qua 5 bậc:
//   (1) nhìn lại lựa chọn (màn báo cáo) · (2) ĐỌC LỜI GIẢI CHỦ ĐỘNG: các bước mở dần, bước then chốt có CÂU KIỂM, máy chủ chấm (`/hs/cau-kiem`)
//   · (3) làm lại kín bằng câu song sinh (kế hoạch ngày, qid "<gốc>~ss0|1") · (4) KIẾN THỨC NỀN: hỏng câu kiểm ở bước gắn nhãn nền ⇒ 3–5 câu
//   ngắn của nhãn đó (`/hs/luyen-nen`, ngân hàng `cau_nen`) · (5) GỬI THẦY (`/hs/gui-thay`) — CHỈ khi qua CỔNG NỖ LỰC 5 điều kiện:
//     [1] đã tự làm câu gốc và sai (sổ su_kien_hoc, lượt không hỗ trợ, không phải sự kiện đọc lời giải);
//     [2] đã đọc hết lời giải chủ động: mở đủ mọi bước, trả lời ≥ 80% câu kiểm, không lướt (trung bình ≥ 5 giây một bước);
//     [3] đã làm lại kín ≥ 2 lần SAU khi đọc (câu song sinh hoặc câu nền) mà vẫn còn sai;
//     [4] chỉ ra bước vướng: câu kiểm hỏng cùng một bước ≥ 2 lần, HOẶC em chọn bước và viết ≥ 10 chữ em hiểu đến đâu;
//     [5] không gửi bừa: ≤ TRAN_THE_NGAY thẻ/ngày, không khi đang có ca mở, bước đã có lời thầy gỡ thì phải đọc lời gỡ trước.
//   Thiếu điều kiện nào thì trả đúng câu chỉ việc còn thiếu ("Em đọc nốt bước 3", "Em thử câu tương tự này trước"…).
// Mọi chấm ở MÁY CHỦ: đáp án câu kiểm / câu nền không xuống máy em trước khi em trả lời. Bước đánh số từ 0 (như `cau_kiem.buoc`,
// `nut_that.buoc`, `loi_go.buoc`); chữ hiển thị cộng 1. Bảng `cau_nen` CHỈ THÊM, tự tạo lần đầu dùng; bản SQL: migration-0210-v2.sql.
import { docNguongLuot } from './ca-nhan-hoa-v2'
import type { D1PreparedStatement, Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { coCaDangMo } from './bi-a'
import { qidGoc } from './srs2-d1'
import { tachSongSinh, GIO_DOC_LOI_GIAI_CAM } from './loi-hoc-luat'
import { docBoTro, type BoTro, type CauKiem } from './cau-bo-tro'
import { damBaoBangNutThat, TRAN_THE_NGAY } from './nut-that'
import { damBaoBangLoiGiai, locSuKienDoc } from './loi-giai'
import { ghiSuKien, ngayVn, MUC_DICH_XEM_LOI_GIAI } from './su-kien-hoc'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim()
const laObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)

// ---------------------------------------------------------------- bảng câu nền

export const TAO_BANG_CAU_NEN = [
  // Ngân hàng câu kiến thức nền: mỗi câu một nhãn (doi_mol_khoi_luong, hieu_suat…), mức 1–3, kieu so (trả lời số) | tn (4 phương án).
  `CREATE TABLE IF NOT EXISTS cau_nen (id TEXT PRIMARY KEY, nhan TEXT NOT NULL, muc INTEGER NOT NULL DEFAULT 1, kieu TEXT NOT NULL, de TEXT NOT NULL,
    pa_json TEXT, dap_an TEXT NOT NULL, gia_tri_dung TEXT, giai_json TEXT, meo TEXT, cap_nhat_luc TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS cau_nen_nhan ON cau_nen(nhan, muc)',
]
const daTao = new WeakMap<object, Promise<void>>()
export function damBaoBangCauNen(env: Env): Promise<void> {
  const k = env.DB as unknown as object
  let p = daTao.get(k)
  if (!p) {
    p = env.DB.batch(TAO_BANG_CAU_NEN.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => daTao.delete(k))
    daTao.set(k, p)
  }
  return p
}

/** Tên kiến thức nền cho màn học sinh (không hiện mã nhãn). Nhãn lạ ⇒ "kiến thức nền của bước này". */
export const TEN_NEN: Readonly<Record<string, string>> = {
  doi_mol_khoi_luong: 'Đổi số mol ↔ khối lượng', doi_mol_the_tich_khi: 'Đổi số mol ↔ thể tích khí', nong_do_mol: 'Nồng độ mol',
  nong_do_phan_tram: 'Nồng độ phần trăm', khoi_luong_rieng: 'Khối lượng riêng', ti_khoi_khi: 'Tỉ khối chất khí',
  can_bang_phuong_trinh: 'Cân bằng phương trình', ti_le_mol_phuong_trinh: 'Tỉ lệ mol theo phương trình', bao_toan_khoi_luong: 'Bảo toàn khối lượng',
  bao_toan_nguyen_to: 'Bảo toàn nguyên tố', bao_toan_electron: 'Bảo toàn electron', bao_toan_dien_tich: 'Bảo toàn điện tích',
  hieu_suat: 'Hiệu suất phản ứng', chat_du_het: 'Chất dư, chất hết', lap_he_phuong_trinh: 'Lập hệ phương trình', gia_tri_trung_binh: 'Giá trị trung bình',
  cong_thuc_phan_tu: 'Tìm công thức phân tử', phan_tram_khoi_luong: 'Phần trăm khối lượng', do_bat_bao_hoa: 'Độ bất bão hoà',
  ph_nong_do_ion: 'pH và nồng độ ion', hang_so_can_bang: 'Hằng số cân bằng', bien_thien_enthalpy: 'Biến thiên enthalpy',
  nang_luong_lien_ket: 'Năng lượng liên kết', dien_phan_faraday: 'Điện phân (định luật Faraday)', the_dien_cuc_pin: 'Thế điện cực, pin điện',
  toc_do_phan_ung: 'Tốc độ phản ứng', dung_dich_pha_loang: 'Pha loãng dung dịch', tinh_chat_hoa_hoc: 'Tính chất hoá học', lam_tron_ket_qua: 'Làm tròn kết quả',
}
export const tenNen = (nhan: string) => TEN_NEN[nhan] ?? 'Kiến thức nền của bước này'
const NHAN_HOP_LE = /^[a-z][a-z0-9_]{1,39}$/

// ---------------------------------------------------------------- chấm (thuần)

/** Số em gõ: "0,25" · "0.25" · "−1,5" · "1/4" · "2,5e-3". Không đọc được ⇒ null. */
export function docSo(v: unknown): number | null {
  const t = str(v).replace(/\s+/g, '').replace(/[−–]/g, '-')
  const so = (x: string) => (/^-?\d+(?:[.,]\d+)?(?:e-?\d+)?$/i.test(x) ? Number(x.replace(',', '.')) : null)
  const m = /^(.+)\/(.+)$/.exec(t)
  if (m) { const a = so(m[1]!), b = so(m[2]!); return a === null || b === null || b === 0 ? null : a / b }
  return so(t)
}

/** Chấm một câu kiểm: `so` ⇒ sai số TƯƠNG ĐỐI `sai_so` (mặc định 1%); `chon` ⇒ chỉ số lựa chọn bằng `dung`. */
export function chamCauKiem(ck: CauKiem, traLoi: unknown): boolean {
  if (ck.kieu === 'chon') return /^\d+$/.test(str(traLoi)) && Number(str(traLoi)) === Number(ck.dung)
  const v = docSo(traLoi), d = docSo(ck.dap_an)
  if (v === null || d === null) return false
  const tol = Number(str(ck.sai_so ?? '0.01').replace(',', '.'))
  const t = Number.isFinite(tol) && tol >= 0 ? tol : 0.01
  return d === 0 ? Math.abs(v) <= 1e-9 : Math.abs(v - d) <= t * Math.abs(d) + 1e-12
}
/** Đáp án câu kiểm dạng chữ (giảng giải sau khi em đã sai). */
const dapAnChu = (ck: CauKiem) => (ck.kieu === 'chon' ? str((ck.lua_chon ?? [])[Number(ck.dung)]) : str(ck.dap_an))

/** Đếm chữ (từ) em viết. */
export const demChu = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

// ---------------------------------------------------------------- đọc chung

const goc = (q: unknown) => tachSongSinh(qidGoc(str(q))).goc

async function docBam(env: Env, qid: string): Promise<string> {
  const r = await env.DB.prepare('SELECT bam FROM loi_giai_cau WHERE qid = ?').bind(qid).first<Obj>().catch(() => null)
  return str(r?.bam)
}
async function docHocLieu(env: Env, qid: string): Promise<{ bam: string; bt: BoTro | undefined }> {
  const bam = await docBam(env, qid)
  if (!bam) return { bam, bt: undefined }
  return { bam, bt: (await docBoTro(env, [bam]).catch(() => new Map<string, BoTro>())).get(bam) }
}
/** Câu kiểm của bước (một câu mỗi bước — câu đầu tiên). */
const cauKiemBuoc = (bt: BoTro, buoc: number) => bt.cauKiem.find((k) => k.buoc === buoc)

// ---------------------------------------------------------------- /hs/cau-kiem

/**
 * `/hs/cau-kiem {token, qid, buoc, traLoi, giay}` — chấm câu kiểm của một bước ở máy chủ, ghi `cau_kiem_lam`. Chỉ khi em đã mở lời giải câu này
 * (có dòng `loi_giai_hoi`). Sai lần đầu: chỉ báo sai (em đọc lại chữ bước rồi thử lại); sai từ lần hai: kèm đáp án để giảng giải.
 */
export async function hsCauKiem(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const sbd = await gameIdentity(env, b)
  const qid = goc(b.qid)
  const buoc = Number(b.buoc)
  if (!qid || !Number.isInteger(buoc) || buoc < 0) return { ok: false, error: 'Thiếu câu hoặc bước.' }
  const traLoi = str(b.traLoi).slice(0, 40)
  if (!traLoi) return { ok: false, error: 'Em nhập câu trả lời trước.' }
  const daHoi = await env.DB.prepare('SELECT 1 AS co FROM loi_giai_hoi WHERE sbd = ? AND qid = ? LIMIT 1').bind(sbd, qid).first<Obj>()
  if (!daHoi) return { ok: false, error: 'Em chưa mở lời giải câu này.' }
  const { bam, bt } = await docHocLieu(env, qid)
  const ck = bt ? cauKiemBuoc(bt, buoc) : undefined
  if (!bt || !ck) return { ok: false, error: 'Bước này không có câu kiểm.' }
  await damBaoBangNutThat(env)
  const truoc = await env.DB.prepare('SELECT COUNT(*) AS n FROM cau_kiem_lam WHERE sbd = ? AND bam = ? AND buoc = ?').bind(sbd, bam, buoc).first<Obj>()
  const dung = chamCauKiem(ck, traLoi)
  const nay = Date.now()
  const giay = Math.min(3600, Math.max(0, Math.round(Number(b.giay) || 0)))
  await env.DB.prepare('INSERT INTO cau_kiem_lam (sbd, qid, bam, buoc, tra_loi, dung, giay, luc, ngay_vn) VALUES (?,?,?,?,?,?,?,?,?)')
    .bind(sbd, qid, bam, buoc, traLoi, dung ? 1 : 0, giay, new Date(nay).toISOString(), ngayVn(nay)).run()
  if (dung) return { ok: true, dung: true }
  const nen = bt.nhanNen.find((x) => x.buoc === buoc)?.nen
  return {
    ok: true, dung: false,
    ...(Number(truoc?.n ?? 0) >= 1 ? { dapAn: dapAnChu(ck) } : {}),
    ...(nen && nen !== 'khac' ? { nhanNen: nen, tenNen: tenNen(nen) } : {}),
  }
}

// ---------------------------------------------------------------- cổng nỗ lực

export interface MucCong { ma: 'tu_lam' | 'doc_het' | 'lam_lai' | 'chi_buoc' | 'khong_bua'; dat: boolean; viec: string }
export interface KetQuaCong {
  bac: 1 | 2 | 3 | 4 | 5
  cong: MucCong[]
  /** [1][2][3][5] đạt — [4] em hoàn tất ngay trong ô gửi (chọn bước + viết). */
  coTheGui: boolean
  soBuoc: number
  buocVuong?: number
  nhanNenVuong?: string
  tenNenVuong?: string
  bangChung: Record<string, unknown>
}
const NGUONG_KIEM = 0.8
const GIAY_MOI_BUOC = 5
const CHU_TOI_THIEU = 10

interface DongSo { qid: string; nguon: string; ketQua: number | null; luc: string; hoTro: boolean }

async function docSoHoc(env: Env, sbd: string, qids: string[], qidGocCau: string): Promise<DongSo[]> {
  const sql = (moi: boolean) => `SELECT qid, nguon, ket_qua, luc${moi ? ', assistance, purpose' : ''} FROM su_kien_hoc
    WHERE sbd = ? AND (qid IN (SELECT value FROM json_each(?)) OR qid GLOB ? OR (nguon = 'nen' AND ma_nguon = ?))`
  const tham = [sbd, JSON.stringify(qids), `${qidGocCau}[#~]*`, qidGocCau]
  let rows: Obj[]
  try { rows = (await env.DB.prepare(sql(true)).bind(...tham).all<Obj>()).results ?? [] } catch {
    try { rows = (await env.DB.prepare(sql(false)).bind(...tham).all<Obj>()).results ?? [] } catch { return [] }
  }
  return rows.map((x) => ({
    qid: str(x.qid), nguon: str(x.nguon), ketQua: x.ket_qua === null || x.ket_qua === undefined ? null : Number(x.ket_qua), luc: str(x.luc),
    hoTro: str(x.assistance) === 'assisted' || str(x.purpose) === MUC_DICH_XEM_LOI_GIAI,
  }))
}

/**
 * Tính cổng nỗ lực của một em với một câu. `dang`: thao tác của lần đọc CHƯA đóng (khung còn mở) — cùng mức tin như `/hs/doc-loi-giai`
 * (máy em báo), chỉ dùng để tính, KHÔNG ghi. `chon`: bước em chọn + chữ em viết (ô Gửi thầy) cho điều kiện [4].
 */
export async function tinhCong(env: Env, sbd: string, qid: string, tuy: { dang?: unknown; chon?: { buoc: number; viet: string } } = {}): Promise<KetQuaCong | null> {
  const { bam, bt } = await docHocLieu(env, qid)
  if (!bam || !bt || !bt.buoc.length) return null
  await Promise.all([damBaoBangNutThat(env), damBaoBangCauNen(env)])
  const n = bt.buoc.length
  const nay = Date.now()
  const homNay = ngayVn(nay)
  const cungNoiDung = ((await env.DB.prepare('SELECT qid FROM loi_giai_cau WHERE bam = ? LIMIT 30').bind(bam).all<Obj>().catch(() => ({ results: [] as Obj[] }))).results ?? [])
    .map((x) => str(x.qid)).filter(Boolean)
  const qids = [...new Set([qid, ...cungNoiDung])]
  const json = JSON.stringify(qids)
  const [so, hoi, doc, kiem, the, go, caMo, daDocGo, giayMoiBuoc] = await Promise.all([
    docSoHoc(env, sbd, qids, qid),
    env.DB.prepare('SELECT luc FROM loi_giai_hoi WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?)) ORDER BY luc').bind(sbd, json).all<Obj>().catch(() => ({ results: [] as Obj[] })),
    env.DB.prepare('SELECT giay, su_kien_json FROM doc_loi_giai WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?))').bind(sbd, json).all<Obj>().catch(() => ({ results: [] as Obj[] })),
    env.DB.prepare('SELECT buoc, dung FROM cau_kiem_lam WHERE sbd = ? AND bam = ?').bind(sbd, bam).all<Obj>().catch(() => ({ results: [] as Obj[] })),
    env.DB.prepare(`SELECT SUM(CASE WHEN ngay_vn = ? THEN 1 ELSE 0 END) AS hom_nay, SUM(CASE WHEN bam = ? AND trang_thai = 'cho' THEN 1 ELSE 0 END) AS dang_cho
      FROM nut_that WHERE sbd = ?`).bind(homNay, bam, sbd).first<Obj>().catch(() => null),
    env.DB.prepare('SELECT id, buoc, luc FROM loi_go WHERE bam = ?').bind(bam).all<Obj>().catch(() => ({ results: [] as Obj[] })),
    coCaDangMo(env, sbd, nay),
    // Đọc lời gỡ qua `/hs/loi-go` (ban-go-nut-that.ts ghi `loi_go_doc`) cũng tính là đã đọc — ngoài đường mở bước trong khung.
    env.DB.prepare('SELECT DISTINCT go_id FROM loi_go_doc WHERE sbd = ?').bind(sbd).all<Obj>().catch(() => ({ results: [] as Obj[] })),
    // CÁ NHÂN HOÁ (02/10): ngưỡng "lướt" theo tốc độ đọc thường ngày của chính em (ca-nhan-hoa-v2.ts), không 5 giây cho mọi em.
    docNguongLuot(env, sbd).catch(() => GIAY_MOI_BUOC),
  ])
  const goDaDoc = new Set((daDocGo.results ?? []).map((x) => str(x.go_id)))
  const lucHoi = (hoi.results ?? []).map((x) => str(x.luc)).filter(Boolean)
  const docDau = lucHoi[0] ?? ''

  // [1] đã tự làm câu gốc (hoặc bản cùng nội dung) và sai.
  const laGoc = (x: DongSo) => x.nguon !== 'nen' && tachSongSinh(x.qid).songSinh === null
  const soLanSai = so.filter((x) => laGoc(x) && !x.hoTro && (x.ketQua === 0 || (x.ketQua === null && x.nguon === 'thi'))).length
  const c1: MucCong = { ma: 'tu_lam', dat: soLanSai > 0, viec: soLanSai > 0 ? '' : 'Em tự làm câu này trước đã' }

  // [2] đọc hết lời giải chủ động.
  const dang = laObj(tuy.dang) ? tuy.dang : {}
  const suKien = [
    ...(doc.results ?? []).flatMap((x) => { try { return locSuKienDoc(JSON.parse(str(x.su_kien_json) || '[]')) } catch { return [] } }),
    ...locSuKienDoc(dang.suKien),
  ]
  const giayDoc = (doc.results ?? []).reduce((s, x) => s + (Number(x.giay) || 0), 0) + Math.min(6 * 3600, Math.max(0, Math.round(Number(dang.giay) || 0)))
  const moBuoc = new Map<number, number>() // bước → lúc mở muộn nhất (ms, đồng hồ máy em)
  for (const e of suKien) {
    if (e.k !== 'mo_buoc') continue
    const i = Number(e.y)
    if (Number.isInteger(i) && i >= 0 && i < n) moBuoc.set(i, Math.max(moBuoc.get(i) ?? 0, e.t))
  }
  const buocKiem = [...new Set(bt.cauKiem.map((k) => k.buoc).filter((i) => Number.isInteger(i) && i >= 0 && i < n))].sort((a, b) => a - b)
  const daTraLoi = new Set((kiem.results ?? []).map((x) => Number(x.buoc)))
  const soKiemDaTraLoi = buocKiem.filter((i) => daTraLoi.has(i)).length
  const tiLeKiem = buocKiem.length ? soKiemDaTraLoi / buocKiem.length : 1
  const chuaMo = Array.from({ length: n }, (_, i) => i).find((i) => !moBuoc.has(i))
  const luot = giayDoc < giayMoiBuoc * n
  const c2: MucCong = {
    ma: 'doc_het',
    dat: chuaMo === undefined && tiLeKiem >= NGUONG_KIEM && !luot,
    viec: chuaMo !== undefined ? `Em đọc nốt bước ${chuaMo + 1}`
      : tiLeKiem < NGUONG_KIEM ? `Em trả lời câu kiểm ở bước ${(buocKiem.find((i) => !daTraLoi.has(i)) ?? 0) + 1}`
        : luot ? 'Em đọc chậm lại từng bước rồi thử lại' : '',
  }

  // [3] làm lại kín ≥ 2 lần SAU khi đọc (song sinh / câu nền; câu không có song sinh thì tính cả lượt làm lại câu gốc ngoài 12 giờ sau khi đọc).
  const coSongSinh = bt.songSinh.length > 0
  const docTruoc = (luc: string) => lucHoi.some((h) => { const d = Date.parse(luc) - Date.parse(h); return d >= 0 && d < GIO_DOC_LOI_GIAI_CAM * 3600_000 })
  const lamLai = !docDau ? [] : so.filter((x) => {
    if (!(Date.parse(x.luc) > Date.parse(docDau)) || x.ketQua === null) return false
    if (x.nguon === 'nen') return true
    if (x.hoTro) return false
    if (tachSongSinh(x.qid).songSinh !== null) return true
    return !coSongSinh && !docTruoc(x.luc)
  })
  const soLamLaiSai = lamLai.filter((x) => x.ketQua === 0).length
  const c3: MucCong = {
    ma: 'lam_lai',
    dat: lamLai.length >= 2 && soLamLaiSai > 0,
    viec: lamLai.length >= 2 && soLamLaiSai === 0 ? 'Em đã làm đúng câu tương tự, chưa cần gửi thầy'
      : lamLai.length >= 2 ? '' : coSongSinh ? 'Em thử câu tương tự này trước' : 'Em luyện thêm rồi làm lại câu này trước',
  }

  // [4] bước vướng: câu kiểm hỏng cùng một bước ≥ 2 lần, hoặc em chọn bước + viết ≥ 10 chữ.
  const hong = new Map<number, number>()
  for (const x of kiem.results ?? []) if (Number(x.dung) === 0) hong.set(Number(x.buoc), (hong.get(Number(x.buoc)) ?? 0) + 1)
  const xepHong = [...hong.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])
  const buocVuong = xepHong[0] && xepHong[0][1] >= 2 ? xepHong[0][0] : undefined
  const chon = tuy.chon && Number.isInteger(tuy.chon.buoc) && tuy.chon.buoc >= 0 && tuy.chon.buoc < n ? tuy.chon : undefined
  const c4dat = chon ? (chon.buoc === buocVuong || demChu(chon.viet) >= CHU_TOI_THIEU) : buocVuong !== undefined
  const c4: MucCong = { ma: 'chi_buoc', dat: c4dat, viec: c4dat ? '' : chon ? `Em viết em hiểu đến đâu (ít nhất ${CHU_TOI_THIEU} chữ)` : 'Em chọn bước em chưa hiểu' }

  // [5] không gửi bừa.
  const soTheHomNay = Number(the?.hom_nay ?? 0)
  const buocXet = chon ? [chon.buoc] : buocVuong !== undefined ? [buocVuong] : Array.from({ length: n }, (_, i) => i)
  const goChuaDoc = (go.results ?? []).map((x) => ({ id: str(x.id), buoc: Number(x.buoc), luc: Date.parse(str(x.luc)) }))
    .filter((x) => buocXet.includes(x.buoc) && !goDaDoc.has(x.id) && !((moBuoc.get(x.buoc) ?? 0) > (Number.isFinite(x.luc) ? x.luc : 0)))
    .sort((a, b) => a.buoc - b.buoc)[0]
  const c5viec = caMo ? 'Em đang có ca kiểm tra, làm xong rồi gửi nhé'
    : soTheHomNay >= TRAN_THE_NGAY ? `Hôm nay em đã gửi đủ ${TRAN_THE_NGAY} câu`
      : Number(the?.dang_cho ?? 0) > 0 ? 'Câu này em đã gửi thầy, chờ thầy gỡ nhé'
        : goChuaDoc ? `Em đọc lời thầy gỡ ở bước ${goChuaDoc.buoc + 1} trước` : ''
  const c5: MucCong = { ma: 'khong_bua', dat: !c5viec, viec: c5viec }

  // Kiến thức nền đang vướng: bước hỏng câu kiểm nhiều nhất có nhãn nền (khác "khac") và ngân hàng có câu của nhãn đó.
  const nhanCua = (i: number) => bt.nhanNen.find((x) => x.buoc === i)?.nen
  const ungVien = xepHong.map(([i]) => nhanCua(i)).filter((x): x is string => !!x && x !== 'khac' && NHAN_HOP_LE.test(x))
  let nhanNenVuong: string | undefined
  if (ungVien.length) {
    const co = await env.DB.prepare('SELECT DISTINCT nhan FROM cau_nen WHERE nhan IN (SELECT value FROM json_each(?))').bind(JSON.stringify(ungVien)).all<Obj>().catch(() => ({ results: [] as Obj[] }))
    const coNhan = new Set((co.results ?? []).map((x) => str(x.nhan)))
    nhanNenVuong = ungVien.find((x) => coNhan.has(x))
  }

  const bac = !c1.dat ? 1 : !c2.dat ? 2 : !c3.dat ? (nhanNenVuong ? 4 : 3) : 5
  return {
    bac, cong: [c1, c2, c3, c4, c5], coTheGui: c1.dat && c2.dat && c3.dat && c5.dat, soBuoc: n,
    ...(buocVuong !== undefined ? { buocVuong } : {}),
    ...(nhanNenVuong ? { nhanNenVuong, tenNenVuong: tenNen(nhanNenVuong) } : {}),
    bangChung: {
      soLanSai, soBuoc: n, soBuocDaMo: moBuoc.size, soCauKiem: buocKiem.length, soCauKiemDaTraLoi: soKiemDaTraLoi, giayDoc,
      soLanLamLai: lamLai.length, soLanLamLaiSai: soLamLaiSai, hongTheoBuoc: Object.fromEntries(hong), ...(buocVuong !== undefined ? { buocVuong } : {}),
    },
  }
}

/** `/hs/thang-go {token, qid, dang?}` — em đang ở bậc nào, còn thiếu việc gì, gửi thầy được chưa. Câu chưa có học liệu ⇒ `coThang: false`. */
export async function hsThangGo(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const sbd = await gameIdentity(env, b)
  const qid = goc(b.qid)
  if (!qid) return { ok: false, error: 'Thiếu câu.' }
  const kq = await tinhCong(env, sbd, qid, { dang: b.dang })
  if (!kq) return { ok: true, coThang: false }
  const { bangChung: _bc, ...ra } = kq
  void _bc
  return { ok: true, coThang: true, ...ra }
}

/** `/hs/gui-thay {token, qid, buoc, viet}` — chỉ khi đủ 5 điều kiện ⇒ một thẻ nút thắt (`nut_that`, chờ thầy). Thiếu ⇒ `{ok:false, cong}`. */
export async function hsGuiThay(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const sbd = await gameIdentity(env, b)
  const qid = goc(b.qid)
  const buoc = Number(b.buoc)
  if (!qid) return { ok: false, error: 'Thiếu câu.' }
  const viet = str(b.viet).slice(0, 1000)
  const kq = await tinhCong(env, sbd, qid, { chon: { buoc: Number.isInteger(buoc) ? buoc : -1, viet } })
  if (!kq) return { ok: false, error: 'Câu này chưa có lời giải từng bước để gửi thầy.' }
  if (!Number.isInteger(buoc) || buoc < 0 || buoc >= kq.soBuoc) return { ok: false, error: 'Em chọn bước em chưa hiểu.', cong: kq.cong }
  if (!kq.cong.every((c) => c.dat)) return { ok: false, cong: kq.cong }
  const bam = await docBam(env, qid)
  const nay = Date.now()
  const luc = new Date(nay).toISOString()
  const id = crypto.randomUUID()
  // Trần thẻ/ngày kiểm lại NGAY trong câu ghi (hai lần bấm cùng lúc không vượt trần).
  const r = await env.DB.prepare(
    `INSERT INTO nut_that (id, sbd, qid, bam, buoc, viet, bang_chung_json, gui_luc, ngay_vn, trang_thai, cap_nhat_luc)
     SELECT ?,?,?,?,?,?,?,?,?,'cho',? WHERE (SELECT COUNT(*) FROM nut_that WHERE sbd = ? AND ngay_vn = ?) < ?
       AND NOT EXISTS (SELECT 1 FROM nut_that WHERE sbd = ? AND bam = ? AND trang_thai = 'cho')`,
  ).bind(id, sbd, qid, bam, buoc, viet, JSON.stringify(kq.bangChung), luc, ngayVn(nay), luc, sbd, ngayVn(nay), TRAN_THE_NGAY, sbd, bam).run()
  if (!Number(r.meta?.changes ?? 0)) return { ok: false, error: `Hôm nay em đã gửi đủ ${TRAN_THE_NGAY} câu hoặc câu này đang chờ thầy.` }
  return { ok: true, id }
}

// ---------------------------------------------------------------- luyện kiến thức nền

const SO_CAU_NEN = 5

/** `/hs/luyen-nen {token, nhan}` — 3–5 câu ngắn của nhãn, ưu tiên câu em chưa làm đúng, mức dễ trước. KHÔNG kèm đáp án / lời giải. */
export async function hsLuyenNen(env: Env, b: Obj) {
  await damBaoBangCauNen(env)
  const sbd = await gameIdentity(env, b)
  const nhan = str(b.nhan)
  if (!NHAN_HOP_LE.test(nhan)) return { ok: false, error: 'Thiếu kiến thức nền cần luyện.' }
  if (await coCaDangMo(env, sbd, Date.now())) return { ok: false, khoa: 'dang_kiem_tra', error: 'Em đang có ca kiểm tra mở. Làm xong ca kiểm tra rồi luyện nhé.' }
  const r = await env.DB.prepare('SELECT id, muc, kieu, de, pa_json FROM cau_nen WHERE nhan = ? ORDER BY muc, id LIMIT 80').bind(nhan).all<Obj>()
  const ds = r.results ?? []
  const daDung = await env.DB.prepare(`SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd = ? AND nguon = 'nen' AND ket_qua = 1 AND qid IN (SELECT value FROM json_each(?))`)
    .bind(sbd, JSON.stringify(ds.map((x) => `nen:${str(x.id)}`))).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  const xong = new Set((daDung.results ?? []).map((x) => str(x.qid).slice(4)))
  const chon = [...ds.filter((x) => !xong.has(str(x.id))), ...ds.filter((x) => xong.has(str(x.id)))].slice(0, SO_CAU_NEN)
  return {
    ok: true, nhan, ten: tenNen(nhan),
    cau: chon.map((x) => {
      let pa: Record<string, string> | undefined
      try { const v = JSON.parse(str(x.pa_json) || 'null'); if (laObj(v)) pa = Object.fromEntries(Object.entries(v).map(([k, t]) => [k, String(t)])) } catch { /* bỏ */ }
      return { id: str(x.id), muc: Number(x.muc) || 1, kieu: str(x.kieu) === 'tn' ? 'tn' : 'so', de: str(x.de), ...(pa ? { pa } : {}) }
    }),
  }
}

/** Chấm câu nền: tn ⇒ chữ cái; so ⇒ bằng đáp án (đã làm tròn) hoặc lệch ≤ 0,5% giá trị đúng (em làm tròn khác một chữ số). */
export function chamCauNen(c: { kieu: string; dap_an: string; gia_tri_dung?: string | null }, traLoi: unknown): boolean {
  if (c.kieu === 'tn') return str(traLoi).toUpperCase() === str(c.dap_an).toUpperCase()
  const v = docSo(traLoi)
  if (v === null) return false
  const d = docSo(c.dap_an)
  if (d !== null && Math.abs(v - d) <= 1e-9 * Math.max(1, Math.abs(d))) return true
  const g = docSo(c.gia_tri_dung)
  return g !== null && g !== 0 && Math.abs(v - g) <= 0.005 * Math.abs(g)
}

/**
 * `/hs/luyen-nen/nop {token, id, traLoi, qid?}` — chấm máy chủ, ghi sổ `su_kien_hoc` nguồn 'nen' (qid 'nen:<id>', mã nguồn = câu đang gỡ).
 * Dòng mang `assistance: assisted` + `purpose: luyen_nen`: câu nền là bài bổ trợ, không có trong kho đề ⇒ hàng chữa lỗi, ôn tập, năng lực
 * KHÔNG kéo dòng này thành "câu sai cần làm lại". Cổng nỗ lực [3] tự đọc nguồn 'nen' theo mã nguồn. Đã nộp ⇒ trả đáp án + lời giải để em xem.
 */
export async function hsLuyenNenNop(env: Env, b: Obj) {
  await damBaoBangCauNen(env)
  const sbd = await gameIdentity(env, b)
  const id = str(b.id)
  const traLoi = str(b.traLoi).slice(0, 40)
  if (!id || !traLoi) return { ok: false, error: 'Em nhập câu trả lời trước.' }
  const nay = Date.now()
  if (await coCaDangMo(env, sbd, nay)) return { ok: false, khoa: 'dang_kiem_tra', error: 'Em đang có ca kiểm tra mở. Làm xong ca kiểm tra rồi luyện nhé.' }
  const c = await env.DB.prepare('SELECT * FROM cau_nen WHERE id = ?').bind(id).first<Obj>()
  if (!c) return { ok: false, error: 'Không tìm thấy câu này.' }
  const dung = chamCauNen({ kieu: str(c.kieu), dap_an: str(c.dap_an), gia_tri_dung: str(c.gia_tri_dung) }, traLoi)
  const qidNen = `nen:${id}`
  const cho = goc(b.qid).slice(0, 80) || 'nen'
  const truoc = await env.DB.prepare(`SELECT COUNT(*) AS n FROM su_kien_hoc WHERE sbd = ? AND nguon = 'nen' AND qid = ?`).bind(sbd, qidNen).first<Obj>().catch(() => null)
  await ghiSuKien(env, [{
    nguon: 'nen', maNguon: cho, sbd, qid: qidNen, lan: Number(truoc?.n ?? 0) + 1, ketQua: dung ? 1 : 0, luc: new Date(nay).toISOString(),
    chuyenDe: str(c.nhan), assistance: 'assisted', purpose: 'luyen_nen', raw: { traLoi },
  }])
  let giai: string[] = []
  try { const v = JSON.parse(str(c.giai_json) || '[]'); if (Array.isArray(v)) giai = v.map(String) } catch { /* bỏ */ }
  let pa: Obj = {}
  try { const v = JSON.parse(str(c.pa_json) || 'null'); if (laObj(v)) pa = v } catch { /* bỏ */ }
  const dapAn = str(c.kieu) === 'tn' ? `${str(c.dap_an)}. ${str(pa[str(c.dap_an)])}`.trim() : str(c.dap_an)
  return { ok: true, dung, dapAn, giai, meo: str(c.meo) }
}

// ---------------------------------------------------------------- thầy nạp ngân hàng câu nền

/** Lọc một câu nền thô (định dạng scratchpad/gd1/nen/ngan-hang.json). Sai kiểu ⇒ null. */
export function locCauNen(x: unknown): { id: string; nhan: string; muc: number; kieu: 'so' | 'tn'; de: string; pa: Record<string, string> | null; dapAn: string; giaTriDung: string; giai: string[]; meo: string } | null {
  if (!laObj(x)) return null
  const id = str(x.id), nhan = str(x.nhan), kieu = str(x.kieu), de = str(x.de), dapAn = str(x.dap_an)
  if (!/^[\w.-]{1,80}$/.test(id) || !NHAN_HOP_LE.test(nhan) || (kieu !== 'so' && kieu !== 'tn') || !de || !dapAn) return null
  let pa: Record<string, string> | null = null
  if (kieu === 'tn') {
    if (!laObj(x.pa) || !/^[ABCD]$/.test(dapAn)) return null
    pa = Object.fromEntries(['A', 'B', 'C', 'D'].map((k) => [k, str((x.pa as Obj)[k])]))
    if (Object.values(pa).some((v) => !v)) return null
  } else if (docSo(dapAn) === null) return null
  const muc = Math.min(3, Math.max(1, Math.round(Number(x.muc) || 1)))
  return { id, nhan, muc, kieu, de, pa, dapAn, giaTriDung: str(x.gia_tri_dung), giai: Array.isArray(x.giai) ? x.giai.map(String) : [], meo: str(x.meo) }
}

/** `/kho/nen/day {cau:[…]}` (mã bí mật của thầy) — nạp / cập nhật ngân hàng câu nền theo `id`. */
export async function thayDayNen(env: Env, b: Obj) {
  await damBaoBangCauNen(env)
  const tho = Array.isArray(b.cau) ? b.cau.slice(0, 2000) : []
  const nay = new Date().toISOString()
  const lenh: D1PreparedStatement[] = []
  let boQua = 0
  for (const x of tho) {
    const c = locCauNen(x)
    if (!c) { boQua++; continue }
    lenh.push(env.DB.prepare(
      `INSERT INTO cau_nen (id, nhan, muc, kieu, de, pa_json, dap_an, gia_tri_dung, giai_json, meo, cap_nhat_luc) VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET nhan=excluded.nhan, muc=excluded.muc, kieu=excluded.kieu, de=excluded.de, pa_json=excluded.pa_json, dap_an=excluded.dap_an,
         gia_tri_dung=excluded.gia_tri_dung, giai_json=excluded.giai_json, meo=excluded.meo, cap_nhat_luc=excluded.cap_nhat_luc`,
    ).bind(c.id, c.nhan, c.muc, c.kieu, c.de, c.pa ? JSON.stringify(c.pa) : null, c.dapAn, c.giaTriDung || null, JSON.stringify(c.giai), c.meo, nay))
  }
  for (let i = 0; i < lenh.length; i += 50) await env.DB.batch(lenh.slice(i, i + 50))
  return { ok: true, soCau: lenh.length, boQua }
}
