// GÓI BÀI CẢ NGÀY TRÊN MÁY EM (thầy 29/10 22:05: «tìm mọi cách, cách khác hoàn toàn để app hs load tức thì ở mọi thời điểm, kể cả giờ cao điểm» · «bắt buộc, tới lúc nào load
// được tức thì tại mọi thời điểm mới được dừng lại»).
//
// Vì sao: mỗi lượt mở chặng đang phải chờ máy chủ LẬP KẾ HOẠCH (~5 đợt D1, ~0,4 s CPU, vài MB) — giờ cao điểm D1 ~1,3 s/đợt, isolate bị giết vì tràn bộ nhớ (`exceededMemory`
// 1 070 lượt 19–23h 29/10) ⇒ «Đang chuẩn bị những câu phù hợp với em…», «Máy chủ đang bận». Cách mới: máy em giữ SẴN mọi chặng còn lại của hôm nay; mở chặng hiện câu NGAY từ máy,
// chỉ gọi một lệnh NHẸ để mở phiên (`moGoi7`: một đợt đọc + một lệnh ghi, không lập kế hoạch).
//
//  · `goiNgay7` (lệnh `hoc-tap-goi-ngay`, máy em gọi NỀN khi Lộ trình hiện, không ai chờ): lập kế hoạch MỘT lần ⇒ tối đa SO_CAU_GOI_NGAY câu theo đúng thứ tự + mọi cổng phát câu
//    của lượt mở chặng (goi-bai-7.ts `xayGoiNgay7`), chia chặng 6 câu (chặng đầu bù cho đủ ranh ⌊đã làm / 6⌋ như Lộ trình). Mỗi chặng mang `ve` = bộ ref RIÊNG (mã đề, phiên bản,
//    hoán vị phương án…) NIÊM PHONG AES-GCM gắn em + ngày (máy em không đọc / sửa được) và đề CÔNG KHAI kèm tem hạn dài (đáp án vẫn KHÔNG xuống máy trước khi nộp).
//  · `moGoi7` (lệnh `hoc-tap-mo-goi`, lúc em mở chặng — máy em đã hiện câu): mở `ve` (đúng em, đúng hôm nay), bỏ câu em đã làm / vừa làm, câu đang giữ cho ca thi, câu thầy chặn,
//    câu BTVN chưa nộp (đọc MỚI, một đợt song song) ⇒ ghi phiên y như lượt mở chặng thường (cùng JSON, cùng cổng «gói còn nhận em») ⇒ trả mã phiên + tem MỚI (45 phút) từng câu.
//    Nộp câu, làm lại cuối chặng, đếm chặng… đi đúng đường cũ vì phiên y hệt.
//  · Công tắc GOI_NGAY_CHE_DO: 'tat' (không ai) · 'thu' (chỉ SBD_THU) · 'bat' (mọi em). Máy em không có gói / gói lỗi ⇒ đường mở chặng cũ.
import type { Env } from './kieu'
import { HAN_NIEM_CHUAN_BI_MS, lamMoiNiem, moMa, niemMa } from './niem-phong'
import { ngayVn7 } from './goi-bai-7-loi'
import { tachSongSinh } from './loi-hoc-luat'

export type CheDoGoiNgay = 'tat' | 'thu' | 'bat'
// 29/10 23h: BẬT cho mọi em (thầy «tới lúc nào app hs mọi chỗ, mọi lớp, load câu, nộp câu mọi thứ tức thì mới được dừng lại»). Lỗi / từ chối ở đâu ⇒ đường cũ.
export const GOI_NGAY_CHE_DO: CheDoGoiNgay = 'bat'
let cheDo: CheDoGoiNgay = GOI_NGAY_CHE_DO
/** Chỉ cho test. */
export const datCheDoGoiNgay = (m: CheDoGoiNgay = GOI_NGAY_CHE_DO): void => { cheDo = m }
/** Tài khoản thử của thầy (29/10). */
export const SBD_THU: ReadonlySet<string> = new Set(['12121212'])
export const CAU_MOI_CHANG = 6
/** Số chặng của một gói: chặng kế + MỘT chặng dự phòng. Máy em lập lại gói NỀN sau mỗi chặng (câu sửa lỗi mới, bài thầy vừa giao) ⇒ không cần dư hơn; gói nhỏ
 *  ⇒ lượt lập gói đọc ít câu (≈ lượt mở chặng cũ), không dồn thêm tải D1 giờ cao điểm. */
export const SO_CHANG_GOI = 2
export const SO_CAU_GOI_NGAY = SO_CHANG_GOI * CAU_MOI_CHANG
export const goiNgayBat = (sbd: string): boolean => cheDo === 'bat' || (cheDo === 'thu' && SBD_THU.has(sbd))
const aadVe = (sbd: string, ngay: string) => `goi-ngay|${sbd}|${ngay}`

type Ref = { qid: string; group: string; maDe?: unknown; version?: unknown } & Record<string, unknown>

/** Phiên bản HIỆN TẠI trong kho của từng câu gốc (một lệnh D1): `maDe|qid` ⇒ version. Câu vắng trong kho (tờ đang đồng bộ…) ⇒ không có khoá — nơi gọi giữ nguyên. */
async function phienBanHienTai(env: Env, refs: readonly Ref[]): Promise<Map<string, string>> {
  const ds = [...new Map(refs.filter((r) => typeof r.maDe === 'string').map((r) => { const goc = tachSongSinh(r.qid).goc; return [`${r.maDe}|${goc}`, [r.maDe as string, goc]] as const })).values()]
  if (!ds.length) return new Map()
  const rs = await env.DB.prepare(`SELECT ma_de, qid, version FROM game_v2_question WHERE ${ds.map(() => '(ma_de=? AND qid=?)').join(' OR ')}`).bind(...ds.flat()).all<{ ma_de: string; qid: string; version: string }>()
  return new Map(rs.results.map((x) => [`${x.ma_de}|${x.qid}`, String(x.version)]))
}
interface NoiDungVe { v: number; e: number; r: Ref[]; g: string[] }

/** Lập gói cả ngày cho em. Không có kế hoạch / thầy tạm dừng ⇒ gói rỗng. */
export async function goiNgay7(env: Env, sbd: string, now: number): Promise<Record<string, unknown>> {
  if (!goiNgayBat(sbd)) return { ok: true, tat: true, sbd }
  // BẢN SẴN (san-sang.ts — cron lập sẵn cho mọi em; dấu khớp, cùng ngày, chưa có đợt mới hơn): chặng kế đã lập ⇒ gói từ bản ấy, KHÔNG lập kế hoạch (một lệnh D1).
  // Gói một chặng; hết chặng máy em lập lại gói (đường đủ dưới).
  const ss = await import('./san-sang')
  const [dauSs, ban] = await ss.docDauVaBan(env, sbd, now)
  const c = ban?.chang as { refs?: unknown; questions?: unknown; goi7?: unknown; goiIds?: unknown; phienCu?: unknown } | null | undefined
  if (ss.dungDuoc(ban, dauSs, ngayVn7(now)) && ban.phienMoi < ban.luc && c && !c.phienCu && Array.isArray(c.refs) && c.refs.length > 0 && Array.isArray(c.questions)
    && c.questions.length === c.refs.length && Array.isArray(c.goiIds)) {
    const ve = await niemMa(env, aadVe(sbd, ban.ngay), { r: c.refs, g: c.goiIds }, now, HAN_NIEM_CHUAN_BI_MS)
    if (ve) return { ok: true, sbd, ngay: ban.ngay, luc: now, chang: [{ ve, questions: c.questions }], goi7: c.goi7, tuBanSan: true }
  }
  const g7 = await import('./goi-bai-7')
  const x = await g7.xayGoiNgay7(env, sbd, now, SO_CAU_GOI_NGAY)
  if (!x) return { ok: true, sbd, ngay: ngayVn7(now), luc: now, chang: [] }
  const daLam = Number((x.goi7 as { daLamHomNay?: unknown } | null)?.daLamHomNay) || 0
  const dau = CAU_MOI_CHANG - (daLam % CAU_MOI_CHANG) // chặng đầu bù cho khớp ranh chặng của Lộ trình (⌊đã làm / 6⌋)
  const chang: { ve: string; questions: Record<string, unknown>[] }[] = []
  for (let i = 0; i < x.refs.length && chang.length < SO_CHANG_GOI;) {
    const n = chang.length === 0 ? dau : CAU_MOI_CHANG
    const refs = x.refs.slice(i, i + n), questions = x.questions.slice(i, i + n)
    i += n
    const ve = await niemMa(env, aadVe(sbd, x.ngay), { r: refs, g: x.goiIds }, now, HAN_NIEM_CHUAN_BI_MS)
    if (!ve) return { ok: false, error: 'Chưa lập được gói bài hôm nay.' }
    chang.push({ ve, questions })
  }
  return { ok: true, sbd, ngay: x.ngay, luc: now, chang, goi7: x.goi7 }
}

/** Mở phiên từ gói. `b.ves` (hoặc `b.ve` của máy em cũ) = các bộ ref niêm phong (≤ 4 chặng của gói — máy em ghép câu còn lại cho đủ một chặng); `b.qids` (tuỳ chọn) =
 *  đúng các câu máy em đang hiện (chỉ giữ ref trong số này); `b.sk` = {qid: tem hạn dài} của gói. */
export async function moGoi7(env: Env, sbd: string, b: Record<string, unknown>, now: number): Promise<Record<string, unknown>> {
  if (!goiNgayBat(sbd)) return { ok: false, ma: 'GOI_TAT' }
  const g7 = await import('./goi-bai-7')
  const ngay = ngayVn7(now)
  const ves = Array.isArray(b.ves) ? b.ves.slice(0, 4) : [b.ve]
  const cacNd = await Promise.all(ves.map((ve) => moMa<NoiDungVe>(env, aadVe(sbd, ngay), ve, now, HAN_NIEM_CHUAN_BI_MS)))
  if (!cacNd.length || cacNd.some((x) => !x || !Array.isArray(x.r) || !Array.isArray(x.g))) return { ok: false, ma: 'GOI_CU' }
  const chon = Array.isArray(b.qids) ? new Set(b.qids.filter((x): x is string => typeof x === 'string')) : null
  const daCo = new Set<string>()
  const nd = { r: cacNd.flatMap((x) => x!.r).filter((r) => r && typeof r.qid === 'string' && (!chon || chon.has(r.qid)) && !daCo.has(r.qid) && !!daCo.add(r.qid)), g: [...new Set(cacNd.flatMap((x) => x!.g))] }
  const [{ docCauBtvnChuaNop }, { protectedQuestions }, { readGameScope }, { sqlCacGoiConNhan7 }] = await Promise.all([
    import('./game-v2-luot'), import('./game-v2-bank'), import('./game-v2-reports'), import('./goi-bai-7-quyen')])
  // Gói sống tới cả ngày ⇒ thầy có thể đã sửa đề / đáp án sau lúc lập: câu đổi phiên bản bị bỏ (tem cũ chấm theo đáp án cũ; lượt nộp sẽ báo «câu đã đổi»). Cùng đợt đọc.
  const [dl, baoVe, btvn, control, ban] = await Promise.all([g7.docDaLamVaVuaLam7(env, sbd, ngay, now), protectedQuestions(env), docCauBtvnChuaNop(env, sbd), readGameScope(env, sbd),
    phienBanHienTai(env, nd.r).catch(() => new Map<string, string>())])
  if (!control.enabled) throw new Error('Thầy đang tạm dừng bài học cho em.')
  const chan = new Set(control.blocked)
  const doiBan = (r: Ref) => { const v = ban.get(`${r.maDe}|${tachSongSinh(r.qid).goc}`); return v !== undefined && v !== String(r.version) }
  const refs = nd.r.filter((r) => !doiBan(r) && !dl.daLam.has(r.qid) && !dl.vuaLam.has(r.qid) && !baoVe.has(r.qid) && !baoVe.has(r.group) && !btvn.has(r.qid) && !chan.has(r.qid)).slice(0, CAU_MOI_CHANG)
  if (!refs.length) return { ok: false, ma: 'GOI_HET' }
  const tem = (b.sk && typeof b.sk === 'object' ? b.sk : {}) as Record<string, unknown>
  const sk: Record<string, string> = {}
  await Promise.all(refs.map(async (r) => { const m = await lamMoiNiem(env, sbd, r.qid, tem[r.qid], now); if (m) sk[r.qid] = m }))
  const id = crypto.randomUUID()
  const rs = await env.DB.prepare(`INSERT INTO game_v2_session(id,sbd,json,created_at) SELECT ?,?,?,? WHERE ${sqlCacGoiConNhan7('?', '?', g7.sqlTenLopHs('h'))}`)
    .bind(id, sbd, JSON.stringify({ mode: 'adventure', created: now, hoa2: 1, hocTap: 1, goi7: 1, goiNgay: 1, questions: refs }), new Date(now).toISOString(), JSON.stringify(nd.g), sbd).run()
  if (!Number(rs.meta.changes)) return { ok: false, ma: 'GOI_DOI' }
  return { ok: true, id, qids: refs.map((r) => r.qid), sk, daLam: dl.soDaLam }
}
