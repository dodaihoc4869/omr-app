// Nối kết quả Tu luyện đã khoá vào sổ chung; không cấp EXP hoặc chấm lại.
import type { Env } from './kieu'
import { docCauHinh, tinhNangBat } from './chua-cau-sai-cau-hinh'
import { lenhGhiSuKienNguyenTu, type SuKien } from './su-kien-hoc'
import { emCoGhi } from './dem-ke-hoach'
import { docLuatChua } from './chua-cau-sai-adapter'
type Obj = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
export async function dongBoTuLuyen(
  env: Env,
  sbd: string,
  luotId: string,
): Promise<boolean> {
  const cfg = await docCauHinh(env)
  if (!cfg.dongBoTuLuyen || !(await tinhNangBat(env, { sbd }))) return true
  const luot = await env.DB.prepare(
    'SELECT de_rieng_json FROM tu_luyen_luot WHERE id=? AND sbd=?',
  )
    .bind(luotId, sbd)
    .first<{ de_rieng_json: string }>()
  if (!luot) return false
  let rieng: Obj[]
  try {
    rieng = JSON.parse(luot.de_rieng_json)
    if (
      !Array.isArray(rieng) ||
      rieng.some((c) => !c || typeof c.qid !== 'string')
    )
      return false
  } catch {
    return false
  }
  // Câu chấm riêng được ưu tiên: timestamp và câu trả lời đầu tiên không bị lần nộp cả bài thay.
  const rows = await env.DB.prepare(
    `SELECT qid,dung,tra_loi,luc,0 AS co_goi_y FROM tu_luyen_cham_cau WHERE luot_id=? AND sbd=?
  UNION ALL SELECT qid,dung,tra_loi,nop_luc AS luc,co_goi_y FROM tu_luyen_cau c WHERE luot_id=? AND sbd=? AND NOT EXISTS(SELECT 1 FROM tu_luyen_cham_cau k WHERE k.luot_id=c.luot_id AND k.qid=c.qid)`,
  )
    .bind(luotId, sbd, luotId, sbd)
    .all<Obj>()
  const help = await env.DB.prepare(
    'SELECT qid,luc FROM loi_giai_hoi WHERE sbd=? AND co_ho_so=1 ORDER BY luc DESC LIMIT 1000',
  )
    .bind(sbd)
    .all<{ qid: string; luc: string }>()
  const gio = (await docLuatChua(env, sbd)).gioDocLoiGiai
  for (const r of rows.results ?? []) {
    const c = rieng.find((x) => x.qid === r.qid)
    if (!c) return false
    if (!Number.isFinite(Number(r.luc)) || Number(r.luc) <= 0) return false
    const t = Number(r.luc),
      qid = str(r.qid),
      tc = str(c.tc),
      assisted =
        Number(r.co_goi_y) > 0 ||
        help.results?.some(
          (x) =>
            [qid, tc].includes(x.qid) &&
            Date.parse(x.luc) <= t &&
            t - Date.parse(x.luc) < gio * 3600000,
        )
    const assistance = assisted ? 'assisted' : 'none',
      raw = {
        traLoi: r.tra_loi,
        ...(tc ? { tc } : {}),
        tuLuyen: { luotId, version: 1 },
      }
    const e: SuKien = {
      nguon: 'tu_luyen',
      maNguon: luotId,
      sbd,
      qid,
      lan: 1,
      ketQua: Number(r.dung) === 1 ? 1 : 0,
      luc: new Date(t).toISOString(),
      assistance,
      visibility: 'released',
      purpose: 'repair',
      attemptId: `${luotId}:${qid}`,
      maDang: str(c.dangMa),
      raw,
    }
    try {
      await env.DB.batch([
        env.DB.prepare(
          'INSERT OR IGNORE INTO chua_loi_tu_receipt(luot_id,qid,sbd,luc,assistance,raw_json) VALUES(?,?,?,?,?,?)',
        ).bind(luotId, qid, sbd, t, assistance, JSON.stringify(raw)),
        lenhGhiSuKienNguyenTu(env, [e], { sql: 'changes()=1', params: [] }),
      ])
    } catch {
      return false
    }
  }
  emCoGhi(sbd)
  return true
}
export async function nhanKetQuaTuLuyenChung(
  env: Env,
  sbd: string,
  rieng: { qid: string; tc?: string }[],
  ketQua: { qid: string; dung: boolean; khacPhuc?: string }[],
): Promise<void> {
  if (!(await tinhNangBat(env, { sbd }))) return
  const { docNhieuTrangThaiLoiDau } = await import('./chua-cau-sai-adapter')
  const { ngayVn } = await import('./su-kien-hoc')
  const map = await docNhieuTrangThaiLoiDau(
    env,
    sbd,
    rieng.map((c) => c.tc || c.qid),
    ngayVn(Date.now()),
  )
  for (const k of ketQua) {
    const c = rieng.find((x) => x.qid === k.qid),
      loi = map.get(c?.tc || k.qid)?.loiHoc
    if (loi && ['dong', 'duy_tri'].includes(loi.trangThai))
      k.khacPhuc =
        'Đã khắc phục theo lịch sử tự làm ở các ngày khác nhau. Tiếp tục kiểm duy trì theo lịch ôn.'
    else if (loi || k.khacPhuc)
      k.khacPhuc = k.dung
        ? 'Em làm đúng lượt này. Cần kiểm tiếp ở ngày khác và một bản tương đương để xác nhận khắc phục bền vững.'
        : 'Câu vẫn cần gỡ. Em có thể sửa từng bước để tìm đúng chỗ đang vướng.'
  }
}
