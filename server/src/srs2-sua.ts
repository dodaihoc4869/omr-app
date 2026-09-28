// SỬA CHIẾN DỊCH ĐANG MỞ — LỆNH CỦA THẦY `POST /gv/chien-dich/sua` (nằm SAU cổng `laThay`; thầy 28/09).
//   action: doc | xem-truoc | luu (mặc định luu)
//   body: { id, themMaDe?: string[], themSbd?: string[], botSbd?: string[], hanNop?: 'YYYY-MM-DD', theLucNgay?: number, nguoi?: string }
// Luật (ghi chú đầy đủ: docs/sua-chien-dich-2809/GHI-CHU.md):
//   · Thêm đề ⇒ câu mới lấy bằng ĐÚNG hàm của lúc tạo (`cauCuaToChiTiet`: câu đã duyệt, bỏ tự luận, bỏ trùng), NỐI SAU câu cũ.
//     Sổ làm bài + `tao_luc` giữ nguyên ⇒ câu em đã làm vẫn tính (không mất tiến độ/EXP/điểm); thuật toán chia câu (`lapKeHoachNgay`)
//     chia lại phần câu CHƯA làm trên số ngày còn lại. Kế hoạch HÔM NAY đã chốt được đánh dấu để lập lại (giữ câu đã làm hôm nay).
//   · Thêm em ⇒ mốc tính lần làm của em = lúc được thêm (như em giao từ đầu); em từng bị bớt rồi thêm lại giữ mốc cũ.
//   · Bớt em ⇒ bỏ khỏi `sbd_json` (em không thấy chiến dịch nữa); KHÔNG xoá sổ làm bài.
//   · Số câu/ngày (Boss chốt 28/09): thêm đề hoặc rút hạn mà câu CHƯA LÀM của em nhiều nhất > số câu/ngày × số ngày còn lại (tính cả hôm nay)
//     ⇒ tự NÂNG số câu/ngày = ⌈câu chưa làm lớn nhất / ngày còn lại⌉; KHÔNG bao giờ tự hạ. Thầy gửi `theLucNgay` ⇒ dùng số của thầy
//     (thấp hơn mức cần ⇒ `chuaKipHan: true`, vẫn lưu).
//   · Sửa hạn ⇒ hạn mới ≥ hôm nay; chiến dịch đã hết hạn / đã kết thúc ⇒ mở lại (`dang_chay`). Chiến dịch đã huỷ ⇒ từ chối.
//   · Nhật ký: `chien_dich_sua` (ai, lúc nào, đổi gì) + một dòng `nhat_ky_may`.
// Schema CHỈ-THÊM, tạo lúc chạy (CI không chạy migration): `chien_dich_em`, `chien_dich_sua`.
// Không gửi đáp án/lời giải: chỉ trả mã tờ, số câu, SBD.
import type { Env } from './kieu'
import { cauCuaToChiTiet, lanLamCaLop, maGocCuaTo, THE_LUC_TOI_DA } from './srs2-gv'
import { docChienDichTuDong, docMocThemCaLop, mocTinhCua, ngayVnCua, type ChienDich } from './srs2-d1'
import { soNgayConLai } from './srs2-loi'
import { chuTomTatSua } from '../../src/lib/tom-tat-sua-chien-dich'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const mangChuoi = (v: unknown): string[] => [...new Set(Array.isArray(v) ? v.map(str).map((x) => x.trim()).filter(Boolean) : [])]
const NGAY = /^\d{4}-\d{2}-\d{2}$/
/** Đánh dấu kế hoạch hôm nay đã chốt với chiến dịch vừa sửa ⇒ `layKeHoachHomNay` thấy khác mã chiến dịch và lập lại (giữ câu đã làm). */
export const hauToSua = (id: string): string => `${id}#sua`

export const LENH_TAO_BANG_SUA = [
  `CREATE TABLE IF NOT EXISTS chien_dich_em (
    chien_dich_id TEXT NOT NULL,
    sbd           TEXT NOT NULL,
    them_luc      TEXT,
    bot_luc       TEXT,
    PRIMARY KEY (chien_dich_id, sbd)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_chien_dich_em_sbd ON chien_dich_em(sbd)',
  `CREATE TABLE IF NOT EXISTS chien_dich_sua (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    chien_dich_id  TEXT NOT NULL,
    luc            TEXT NOT NULL,
    ai             TEXT NOT NULL,
    tom_tat        TEXT NOT NULL,
    thay_doi_json  TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_chien_dich_sua_cd ON chien_dich_sua(chien_dich_id, luc)',
]
async function taoBang(env: Env): Promise<void> {
  for (const l of LENH_TAO_BANG_SUA) await env.DB.prepare(l).run()
}

export interface KeHoachSua {
  cd: ChienDich
  homNay: string
  /** Tờ thêm (mã thầy chọn, có thể là tờ tách phần) — chỉ tờ góp ít nhất một câu MỚI. */
  themMaDe: string[]
  /** Tờ thầy chọn mà không góp câu mới (trùng câu cũ / toàn tự luận / chưa duyệt). */
  toKhongCoCauMoi: string[]
  soCauTheoTo: Record<string, number>
  qidThem: string[]
  themSbd: string[]
  botSbd: string[]
  hanMoi: string | null
  moLai: boolean
  sbdSau: string[]
  maDeSau: string[]
  qidSau: string[]
  theLucCu: number
  /** Số câu/ngày sau khi lưu. */
  theLucSau: number
  /** Số câu/ngày NHỎ NHẤT để em nhiều câu chưa làm nhất kịp hạn. */
  theLucCan: number
  tuNang: boolean
  chuaKipHan: boolean
  tomTat: string
}

/** Số câu CHƯA LÀM lớn nhất trong lớp (em mới: mọi câu; em cũ: câu chưa có lần làm từ mốc của em). */
async function cauChuaLamLonNhat(env: Env, cd: ChienDich, sbd: readonly string[], qids: readonly string[], themSbd: readonly string[], nowLuc: string): Promise<number> {
  if (!sbd.length || !qids.length) return 0
  const [lan, them] = await Promise.all([lanLamCaLop(env, sbd, qids), docMocThemCaLop(env, cd.id)])
  let lonNhat = 0
  for (const s of sbd) {
    const tu = themSbd.includes(s) ? nowLuc : mocTinhCua(cd.taoLuc, them.get(s))
    const daLam = new Set((lan.get(s) ?? []).filter((x) => x.luc >= tu).map((x) => x.qid))
    lonNhat = Math.max(lonNhat, qids.filter((q) => !daLam.has(q)).length)
  }
  return lonNhat
}
/** Luật nâng số câu/ngày (Boss chốt 28/09): cần = ⌈chưa làm lớn nhất / ngày còn lại⌉; chỉ NÂNG, không hạ. */
export function theLucSauSua(theLucCu: number, chuaLamLonNhat: number, ngayConLai: number, coXet: boolean): { can: number; sau: number } {
  const can = Math.min(THE_LUC_TOI_DA, Math.max(1, Math.ceil(chuaLamLonNhat / Math.max(1, ngayConLai))))
  return { can, sau: coXet && can > theLucCu ? can : theLucCu }
}

async function docMot(env: Env, id: string): Promise<ChienDich> {
  if (!id) throw new Error('Thiếu mã chiến dịch.')
  const r = await env.DB.prepare('SELECT * FROM chien_dich WHERE id = ?').bind(id).first<Row>()
  if (!r) throw new Error('Không tìm thấy chiến dịch.')
  return docChienDichTuDong(r)
}

/** Tính thay đổi (KHÔNG ghi). Ném lỗi bằng MỘT câu thầy đọc được khi đầu vào không hợp lệ. */
export async function lapKeHoachSua(env: Env, b: Row, nowMs: number): Promise<KeHoachSua> {
  const cd = await docMot(env, str(b.id).trim())
  if (cd.trangThai === 'da_huy') throw new Error('Chiến dịch đã huỷ — không sửa được. Hãy giao chiến dịch mới.')
  const homNay = ngayVnCua(nowMs)

  // ---- thêm đề: đúng hàm lấy câu của lúc tạo (bỏ tự luận, câu chưa duyệt, câu trùng)
  const maDeChon = mangChuoi(b.themMaDe)
  const daCo = new Set(cd.qids)
  const qidThem: string[] = []
  const soCauTheoTo: Record<string, number> = {}
  if (maDeChon.length) {
    const { qids } = await cauCuaToChiTiet(env, maDeChon)
    // Đếm câu MỚI từng tờ góp vào (theo thứ tự tờ; câu đã có trong chiến dịch không tính).
    const theoTo = await Promise.all(maDeChon.map(async (m) => [m, (await cauCuaToChiTiet(env, [m])).qids] as const))
    for (const q of qids) if (!daCo.has(q)) { daCo.add(q); qidThem.push(q) }
    const daDem = new Set<string>()
    for (const [m, ds] of theoTo) {
      const moi = ds.filter((q) => qidThem.includes(q) && !daDem.has(q))
      for (const q of moi) daDem.add(q)
      soCauTheoTo[m] = moi.length
    }
  }
  const themMaDe = maDeChon.filter((m) => (soCauTheoTo[m] ?? 0) > 0)
  const toKhongCoCauMoi = maDeChon.filter((m) => !themMaDe.includes(m))

  // ---- em
  const coSan = new Set(cd.sbd)
  const botSbd = mangChuoi(b.botSbd).filter((s) => coSan.has(s))
  const themSbd = mangChuoi(b.themSbd).filter((s) => !coSan.has(s) && !botSbd.includes(s))
  const sbdSau = [...cd.sbd.filter((s) => !botSbd.includes(s)), ...themSbd]
  if (!sbdSau.length) throw new Error('Chiến dịch phải còn ít nhất một em.')

  // ---- hạn
  const hanGui = str(b.hanNop).trim()
  let hanMoi: string | null = null
  if (hanGui && hanGui !== cd.hanNop) {
    if (!NGAY.test(hanGui)) throw new Error('Hạn nộp phải là ngày dạng YYYY-MM-DD.')
    if (hanGui < homNay) throw new Error('Hạn nộp mới phải từ hôm nay trở đi.')
    hanMoi = hanGui
  }
  // Hết hạn hoặc đã kết thúc: chỉ đặt hạn mới (≥ hôm nay) mới mở lại được.
  const daDung = cd.hanNop < homNay || cd.trangThai === 'da_dong'
  const moLai = daDung && !!hanMoi
  if (daDung && !hanMoi && (qidThem.length || themSbd.length)) throw new Error('Chiến dịch đã hết hạn — chọn hạn nộp mới để mở lại rồi mới thêm đề/em.')

  // ---- số câu/ngày
  const theLucGui = b.theLucNgay == null || b.theLucNgay === '' ? null : Math.floor(Number(b.theLucNgay))
  if (theLucGui != null && (!Number.isFinite(theLucGui) || theLucGui < 1)) throw new Error('Số câu mỗi ngày phải là số nguyên từ 1 trở lên.')
  const hanSau = hanMoi ?? cd.hanNop
  const qidSau = [...cd.qids, ...qidThem]
  const coXet = qidThem.length > 0 || (!!hanMoi && hanMoi < cd.hanNop)
  const chuaLam = await cauChuaLamLonNhat(env, cd, sbdSau, qidSau, themSbd, new Date(nowMs).toISOString())
  const { can: theLucCan, sau: theLucTu } = theLucSauSua(cd.theLucNgay, chuaLam, soNgayConLai(homNay, hanSau < homNay ? homNay : hanSau), coXet)
  const theLucSau = theLucGui != null ? Math.min(THE_LUC_TOI_DA, theLucGui) : theLucTu
  const doiTheLuc = theLucSau !== cd.theLucNgay

  if (!maDeChon.length && !themSbd.length && !botSbd.length && !hanMoi && !doiTheLuc) throw new Error('Chưa có thay đổi nào.')
  if (maDeChon.length && !qidThem.length && !themSbd.length && !botSbd.length && !hanMoi && !doiTheLuc)
    throw new Error('Các tờ đề đã chọn không có câu mới (trùng câu đã có, câu tự luận hoặc câu chưa duyệt).')

  const maDeSau = [...cd.maDe, ...maGocCuaTo(themMaDe).filter((m) => !cd.maDe.includes(m))]
  const tomTat = chuTomTatSua({ themDe: themMaDe.length, themEm: themSbd.length, botEm: botSbd.length, hanCu: cd.hanNop, hanMoi, theLucCu: cd.theLucNgay, theLucMoi: theLucSau })
  return {
    cd, homNay, themMaDe, toKhongCoCauMoi, soCauTheoTo, qidThem, themSbd, botSbd, hanMoi, moLai, sbdSau, maDeSau, qidSau,
    theLucCu: cd.theLucNgay, theLucSau, theLucCan, tuNang: theLucGui == null && theLucSau > cd.theLucNgay, chuaKipHan: chuaLam > 0 && theLucSau < theLucCan, tomTat,
  }
}

const traVe = (k: KeHoachSua) => ({
  tomTat: k.tomTat,
  themMaDe: k.themMaDe, toKhongCoCauMoi: k.toKhongCoCauMoi, soCauTheoTo: k.soCauTheoTo,
  soCauCu: k.cd.qids.length, soCauThem: k.qidThem.length, soCauSau: k.qidSau.length,
  themSbd: k.themSbd, botSbd: k.botSbd, soEmSau: k.sbdSau.length,
  hanCu: k.cd.hanNop, hanNop: k.hanMoi ?? k.cd.hanNop, moLai: k.moLai,
  theLucCu: k.theLucCu, theLucNgay: k.theLucSau, theLucCan: k.theLucCan, tuNang: k.tuNang, chuaKipHan: k.chuaKipHan,
})

async function luu(env: Env, b: Row, nowMs: number) {
  const k = await lapKeHoachSua(env, b, nowMs)
  await taoBang(env)
  const luc = new Date(nowMs).toISOString()
  const { cd } = k
  // Khoá lạc quan: chỉ ghi khi chiến dịch CHƯA bị sửa ở máy khác từ lúc đọc.
  const r = await env.DB.prepare(`UPDATE chien_dich SET sbd_json = ?, ma_de_json = ?, qid_json = ?, han_nop = ?, the_luc_ngay = ?,
        trang_thai = CASE WHEN ? = 1 THEN 'dang_chay' ELSE trang_thai END, dong_luc = CASE WHEN ? = 1 THEN NULL ELSE dong_luc END
      WHERE id = ? AND trang_thai <> 'da_huy' AND sbd_json = ? AND qid_json = ? AND han_nop = ?`)
    .bind(JSON.stringify(k.sbdSau), JSON.stringify(k.maDeSau), JSON.stringify(k.qidSau), k.hanMoi ?? cd.hanNop, k.theLucSau, k.moLai ? 1 : 0, k.moLai ? 1 : 0,
      cd.id, JSON.stringify(cd.sbd), JSON.stringify(cd.qids), cd.hanNop).run()
  if (!r.meta.changes) throw new Error('Chiến dịch vừa đổi ở nơi khác — mở lại hộp Chỉnh sửa rồi lưu lại.')

  const ai = str(b.nguoi).trim().slice(0, 60) || 'thầy'
  const lenh = [
    // Em mới: mốc = lúc được thêm; em từng ở chiến dịch (bị bớt rồi thêm lại) ⇒ giữ mốc cũ, chỉ xoá dấu bớt.
    ...k.themSbd.map((s) => env.DB.prepare('INSERT INTO chien_dich_em (chien_dich_id, sbd, them_luc, bot_luc) VALUES (?,?,?,NULL) ON CONFLICT(chien_dich_id, sbd) DO UPDATE SET bot_luc = NULL').bind(cd.id, s, luc)),
    // Bớt em: chỉ ghi dấu bớt (em giao từ đầu có them_luc NULL). Sổ làm bài KHÔNG đụng.
    ...k.botSbd.map((s) => env.DB.prepare('INSERT INTO chien_dich_em (chien_dich_id, sbd, them_luc, bot_luc) VALUES (?,?,NULL,?) ON CONFLICT(chien_dich_id, sbd) DO UPDATE SET bot_luc = excluded.bot_luc').bind(cd.id, s, luc)),
    // Phân bổ lại: kế hoạch hôm nay đã chốt với chiến dịch này ⇒ lập lại ở lần mở kế tiếp (giữ câu đã làm hôm nay).
    env.DB.prepare('UPDATE srs2_ke_hoach SET chien_dich_id = ? WHERE ngay = ? AND chien_dich_id = ?').bind(hauToSua(cd.id), k.homNay, cd.id),
    env.DB.prepare('INSERT INTO chien_dich_sua (chien_dich_id, luc, ai, tom_tat, thay_doi_json) VALUES (?,?,?,?,?)').bind(cd.id, luc, ai, k.tomTat, JSON.stringify({
      themMaDe: k.themMaDe, soCauThem: k.qidThem.length, qidThem: k.qidThem, themSbd: k.themSbd, botSbd: k.botSbd, hanCu: cd.hanNop, hanMoi: k.hanMoi, moLai: k.moLai,
      theLucCu: k.theLucCu, theLucMoi: k.theLucSau, tuNang: k.tuNang, theLucCan: k.theLucCan,
    })),
  ]
  for (let i = 0; i < lenh.length; i += 50) await env.DB.batch(lenh.slice(i, i + 50))
  await env.DB.prepare("INSERT INTO nhat_ky_may (luc, nguon, muc, chu) VALUES (?, 'sua_chien_dich', 'tin', ?)")
    .bind(luc, `${ai} sửa chiến dịch "${cd.ten}" (${cd.id}): ${k.tomTat}`).run().catch(() => null)
  return { ok: true, id: cd.id, ...traVe(k) }
}

async function doc(env: Env, b: Row, nowMs: number) {
  const cd = await docMot(env, str(b.id).trim())
  const homNay = ngayVnCua(nowMs)
  const nk = await env.DB.prepare('SELECT luc, ai, tom_tat FROM chien_dich_sua WHERE chien_dich_id = ? ORDER BY luc DESC LIMIT 20').bind(cd.id).all<Row>().catch(() => ({ results: [] as Row[] }))
  return {
    ok: true, homNay,
    chienDich: { id: cd.id, ten: cd.ten, lop: cd.lop, maDe: cd.maDe, sbd: cd.sbd, hanNop: cd.hanNop, theLucNgay: cd.theLucNgay, trangThai: cd.trangThai, soCau: cd.qids.length, soEm: cd.sbd.length, hetHan: cd.hanNop < homNay },
    nhatKy: (nk.results ?? []).map((x) => ({ luc: str(x.luc), ai: str(x.ai), tomTat: str(x.tom_tat) })),
  }
}

export async function gvSuaChienDich(env: Env, b: Row, nowMs = Date.now()): Promise<Record<string, unknown>> {
  const action = str(b.action) || 'luu'
  try {
    if (action === 'doc') return await doc(env, b, nowMs)
    if (action === 'xem-truoc') return { ok: true, ...traVe(await lapKeHoachSua(env, b, nowMs)) }
    if (action === 'luu') return await luu(env, b, nowMs)
    return { ok: false, error: 'Hành động không hợp lệ.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
