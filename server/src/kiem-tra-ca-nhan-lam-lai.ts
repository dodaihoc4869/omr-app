// THẦY CHO LÀM LẠI CHẶNG (13/11 — thầy: «Cho 20 em làm lại chặng bị khoá»). Đo 01–12/11: 20 em / 21 bài có chặng HẾT GIỜ khi em vắng, 0 câu trả lời (bấm mở chặng
// rồi rời app), bài ĐÃ CHỐT. Bài GIỮ NGUYÊN «đã nộp» (chuỗi ngày, lịch, điểm danh không đổi); chỉ chặng được thầy cấp quyền (bảng kiem_tra_ca_nhan_lam_lai, có hạn
// `het_luc`) mở lại MỘT lần với đồng hồ mới. Chốt chặng ⇒ chấm lại cả bài (cùng công thức) + ghi sổ các câu vừa trả lời, MỐC = giờ làm lại, CÓ TRỢ GIÚP (em đã có
// phần chữa của cả bài sau khi nộp — không tính là kiểm chứng độc lập).
import type { Env } from './kieu'
import { publicQuestion } from '../../src/game/than-thu-v2/core'
import { ghiSuKien, type SuKien } from './su-kien-hoc'
import { ketQuaTungY } from './omni-game'

type Row = Record<string, unknown>
const s = (v: unknown): string => (v == null ? '' : String(v))
/** Một quyền làm lại của chặng: chưa mở (bd null) · đang chạy (now < han) · đã dùng (dung_luc). */
export interface QuyenLamLai { bd: number | null; han: number | null; het: number; dung: number | null }
export const SQL_QUYEN_LAM_LAI = 'SELECT stt,bat_dau,han,het_luc,dung_luc FROM kiem_tra_ca_nhan_lam_lai WHERE bai_id=?'
export const quyenTuDong = (x: Row): QuyenLamLai => ({ bd: x.bat_dau == null ? null : Number(x.bat_dau), han: x.han == null ? null : Number(x.han), het: Number(x.het_luc), dung: x.dung_luc == null ? null : Number(x.dung_luc) })
/** Quyền còn dùng được lúc `now`: chưa dùng, chưa hết hạn quyền; đã mở thì đồng hồ chặng còn chạy. */
export const quyenConDung = (q: QuyenLamLai | undefined, now: number): q is QuyenLamLai => !!q && q.dung == null && now < q.het && (q.bd == null || now < Number(q.han))

interface CauDe { q: { qid: string; phan: string; version?: unknown; correct: string; dang?: string; mucDo?: string | null } & Record<string, unknown> }
interface Phu {
  de: (r: Row) => { cau: CauDe[]; chang: { qids: string[]; giay: number }[] }
  tra: (r: Row) => Record<string, string>
  duTraKt: (phan: string, a: string) => boolean
  dungKt: (q: CauDe['q'], a: string) => boolean
  diemBaiKt: (cau: readonly CauDe[], t: Record<string, string>) => number
  tomTatKt: (r: Row, now: number) => Record<string, unknown>
  docBai: (env: Env, sbd: string, id: string) => Promise<Row>
}

/** Lệnh của em trên bài ĐÃ NỘP có quyền làm lại chặng `b.chang` (start / lưu / chốt). Không có quyền ⇒ null (nơi gọi xử lý như cũ). */
export async function lamLaiChangKt(env: Env, sbd: string, action: string, b: Row, r: Row, now: number, p: Phu): Promise<Row | null> {
  if (!r.nop_luc || !['hoc-tap-ktcn-start', 'hoc-tap-ktcn-luu', 'hoc-tap-ktcn-chot-chang'].includes(action)) return null
  const stt = Number(b.chang), d = p.de(r)
  if (!Number.isInteger(stt) || stt < 0 || stt >= d.chang.length) return null
  const doc = async () => { const x = await env.DB.prepare('SELECT stt,bat_dau,han,het_luc,dung_luc FROM kiem_tra_ca_nhan_lam_lai WHERE bai_id=? AND stt=?').bind(r.id, stt).first<Row>().catch(() => null); return x ? quyenTuDong(x) : undefined }
  let q = await doc()
  if (!q) return null
  const ch = d.chang[stt]!, cs = d.cau.filter((c) => ch.qids.includes(c.q.qid))
  const chot = async (): Promise<Row> => {
    const ra = await env.DB.prepare('UPDATE kiem_tra_ca_nhan_lam_lai SET dung_luc=? WHERE bai_id=? AND stt=? AND dung_luc IS NULL AND bat_dau IS NOT NULL').bind(Math.min(now, Number(q!.han ?? now)), r.id, stt).run()
    let r2 = await p.docBai(env, sbd, s(r.id))
    if (Number(ra.meta.changes)) {
      const t = p.tra(r2), cu = r2.diem == null ? null : Number(r2.diem), moi = p.diemBaiKt(p.de(r2).cau, t)
      await env.DB.prepare('UPDATE kiem_tra_ca_nhan SET diem=?,cap_nhat_luc=? WHERE id=? AND nop_luc IS NOT NULL AND diem IS ?').bind(moi, now, r2.id, cu).run()
      const luc = new Date(now).toISOString()
      const events: SuKien[] = cs.filter((c) => p.duTraKt(c.q.phan, t[c.q.qid] ?? '')).map((c) => ({ nguon: 'game', maNguon: s(r2.id), sbd: s(r2.sbd), qid: c.q.qid, cauVersion: c.q.version, lan: 1,
        ketQua: p.dungKt(c.q, t[c.q.qid]!) ? 1 : 0, luc, receivedAt: now, assistance: 'assisted', purpose: 'de_thu', attemptId: `${s(r2.id)}|${c.q.qid}`, maDang: c.q.dang, mucDo: c.q.mucDo ?? undefined,
        raw: { answer: t[c.q.qid], kiemTraCaNhan: true, recall: true, lamLaiThayCho: true }, ...(c.q.phan === 'II' ? { subitem: ketQuaTungY(t[c.q.qid]!, c.q.correct) } : {}) }) as unknown as SuKien)
      if (events.length) await ghiSuKien(env, events)
      r2 = await p.docBai(env, sbd, s(r.id))
    }
    return { ok: true, kiemTra: p.tomTatKt(r2, now), revision: Number(r2.revision), chang: stt, daChot: true, daLuu: false }
  }
  if (action === 'hoc-tap-ktcn-start') {
    if (q.dung != null || now >= q.het) return null
    if (q.bd == null) {
      await env.DB.prepare('UPDATE kiem_tra_ca_nhan_lam_lai SET bat_dau=?,han=? WHERE bai_id=? AND stt=? AND bat_dau IS NULL AND dung_luc IS NULL AND het_luc>?').bind(now, Math.min(q.het, now + ch.giay * 1000), r.id, stt, now).run()
      q = (await doc())!
    }
    if (now >= Number(q.han)) return chot()
    const t = p.tra(r)
    return { ok: true, kiemTra: p.tomTatKt(r, now), revision: Number(r.revision), chang: stt, hanChang: Number(q.han), daChot: false, lamLai: true,
      questions: cs.map((c) => publicQuestion(c.q as never)), tra: Object.fromEntries(cs.map((c) => [c.q.qid, t[c.q.qid] ?? ''])) }
  }
  if (q.bd == null) return null
  let daLuu = false
  if (q.dung == null && now < Number(q.han)) {
    const input = b.tra
    if (input && typeof input === 'object' && !Array.isArray(input)) {
      const entries = Object.entries(input as Record<string, unknown>).filter(([id, a]) => ch.qids.includes(id) && typeof a === 'string' && a.length <= 100)
      if (entries.length) {
        const ra = await env.DB.prepare(`UPDATE kiem_tra_ca_nhan SET tra_json=json_patch(tra_json,?),revision=revision+1,cap_nhat_luc=? WHERE id=? AND sbd=? AND nop_luc IS NOT NULL
          AND EXISTS(SELECT 1 FROM kiem_tra_ca_nhan_lam_lai l WHERE l.bai_id=? AND l.stt=? AND l.bat_dau IS NOT NULL AND l.han>? AND l.dung_luc IS NULL)`).bind(JSON.stringify(Object.fromEntries(entries)), now, r.id, sbd, r.id, stt, now).run()
        daLuu = Number(ra.meta.changes) > 0
      }
    }
  }
  if (action === 'hoc-tap-ktcn-chot-chang' || now >= Number(q.han)) return { ...(await chot()), daLuu }
  const r2 = await p.docBai(env, sbd, s(r.id))
  return { ok: true, kiemTra: p.tomTatKt(r2, now), revision: Number(r2.revision), daLuu, daChot: false }
}
