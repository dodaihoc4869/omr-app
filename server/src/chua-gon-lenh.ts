// CHỮA CÂU GỌN — HAI LỆNH CỦA MÀN SỬA CÂU (thầy 25/10, docs/de-xuat-chua-cau-gon-2510.md mục 2, 4, 6). Luật dùng chung ở chua-gon.ts.
//   POST /hs/chua-cau-sai/gon-mo  {token, dotId}                    ⇒ đề công khai của BẢN làm lại (KHÔNG đáp án, KHÔNG lời giải) + lần thứ mấy hôm nay.
//   POST /hs/chua-cau-sai/gon-nop {token, dotId, ban, traLoi, khoa}  ⇒ MÁY CHỦ chấm; đúng lần 1 qua luật tự làm ⇒ "Đã tự sửa" NGAY (đóng đợt cùng lô ghi).
// Một câu: lần 1 → (sai) gợi ý → lần 2 → (sai) lời giải đầy đủ. Đúng sau gợi ý / đúng mà chưa qua luật tự làm ⇒ "xong phần hôm nay", đợt vẫn mở.
// Bản làm lại (chống học thuộc đáp án): song sinh soạn sẵn (`~ss`, cau_bo_tro) → biến thể bằng mã (`~bt` Phần I/III, `~yd` Phần II) → câu gốc.
// Chưa có: câu anh em (cùng dạng, khác nội dung) và xáo phương án câu gốc — câu gốc chỉ tính "Đã tự sửa" khi làm ở NGÀY KHÁC ngày sai (luật b).
// Đáp án / lời giải CHỈ ra sau khi em nộp, và chỉ khi đúng hoặc đã hết lần thử. Bấm lặp cùng `khoa` ⇒ đúng kết quả cũ. Trần 2 lần / đợt / ngày chốt trong câu INSERT.
// Chi phí: gon-mo = 1 đợt đọc song song + nạp câu; gon-nop = 1 đợt đọc song song + nạp câu + 1 lô ghi. Không lệnh nóng nào đổi.
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { cauCongKhai } from './cau-theo-qid'
import { cauDuoc, quyen } from './chua-cau-sai'
import { docHocLieu } from './chua-cau-sai-hoc-lieu'
import { chamCauTuLuyen } from '../../src/lib/tu-luyen'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import { lenhGhiSuKienNguyenTu, ngayVn } from './su-kien-hoc'
import { docBoTroLoi } from './hang-chua-loi'
import { apSongSinh, qidSongSinh } from './song-sinh-game'
import { phuQidAoMoi, SO_THU_BIEN_THE } from './ban-khac-ao'
import { qidBienThe, qidYDsMoi } from './loi-hoc-luat'
import { GIO_LOI_GIAI_GAN, sqlHoCau } from './chua-gon'
import { emCoGhi } from './dem-ke-hoach'
import { goiYTuLoiGiai } from './goi-y-rieng'

type Obj = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const loi = (ma: string, mo: string, status = 400) => Response.json({ ok: false, ma, mo }, { status })
export const SO_LAN_MOI_NGAY = 2

/** Mọi bản làm lại dùng được của câu gốc, theo thứ tự ưu tiên (song sinh → biến thể → gốc). */
export async function cacBan(env: Env, q: PrivateQuestion): Promise<PrivateQuestion[]> {
  const ra: PrivateQuestion[] = []
  const boTro = await docBoTroLoi(env, [q.qid])
  const ss = boTro.get(q.qid)?.songSinh ?? []
  ss.forEach((s, i) => { const b = apSongSinh(q, s, i); if (b && b.qid === qidSongSinh(q.qid, i)) ra.push(b) })
  if (!ra.length) {
    const ao = q.phan === 'II' ? [qidYDsMoi(q.qid, 0)] : Array.from({ length: SO_THU_BIEN_THE }, (_, k) => qidBienThe(q.qid, k))
    for (const qid of ao) {
      const b = await phuQidAoMoi(env, q, qid).catch(() => null)
      if (b && b.qid === qid) { ra.push(b); break }
    }
  }
  ra.push(q)
  return ra.filter((b) => !laCauTuLuan(b) && !!String(b.correct ?? '').trim())
}

/** Bản đề để XEM LẠI sau khi nộp (như `publicQuestionDayDu` của srs2-game): giữ cả hình sau lời giải. */
const deDayDu = (q: PrivateQuestion) => { const { correct: _c, solution: _s, reviewed: _r, hanhTrinh: _h, ...pub } = q; return pub }

/** Đọc song song: đợt, các lần hôm nay, tổng lần của đợt, mốc luật tự làm (ngày sai cuối, đọc lời giải gần). */
async function docChung(env: Env, sbd: string, dotId: string, nowMs: number) {
  const homNay = ngayVn(nowMs)
  const tu = new Date(nowMs - GIO_LOI_GIAI_GAN * 3600_000).toISOString()
  const [dot, lan, dem] = await Promise.all([
    env.DB.prepare(`SELECT d.id,d.qid_chuan,d.trang_thai_day,d.dong_luc,
        (SELECT w.ngay_vn FROM su_kien_hoc w WHERE w.sbd=?2 AND ${sqlHoCau('w.qid', 'd.qid_chuan')} AND COALESCE(w.ket_qua,0)=0
          AND COALESCE(w.purpose,'') NOT IN ('xem_loi_giai','luot','chan_doan','chua_buoc') AND COALESCE(w.assistance,'none') IN ('none','') ORDER BY w.luc DESC LIMIT 1) AS ngay_sai,
        (EXISTS(SELECT 1 FROM loi_giai_hoi g WHERE g.sbd=?2 AND ${sqlHoCau('g.qid', 'd.qid_chuan')} AND g.luc>=?3)
          OR EXISTS(SELECT 1 FROM su_kien_hoc x WHERE x.sbd=?2 AND ${sqlHoCau('x.qid', 'd.qid_chuan')} AND x.purpose='xem_loi_giai' AND x.luc>=?3)) AS doc_gan
      FROM chua_loi_dot d WHERE d.id=?1 AND d.sbd=?2`).bind(dotId, sbd, tu).first<Obj>(),
    env.DB.prepare('SELECT khoa,lan,ban,dung,ket FROM chua_gon_lan WHERE dot_id=? AND sbd=? AND ngay_vn=? ORDER BY lan').bind(dotId, sbd, homNay).all<Obj>(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM chua_gon_lan WHERE dot_id=? AND sbd=?').bind(dotId, sbd).first<{ n: number }>(),
  ])
  return { dot, lanHomNay: lan.results ?? [], tongLan: Number(dem?.n) || 0, homNay }
}

/** Kết quả lưu KHÔNG kèm đề + lời giải (câu có thể mang ảnh lớn); trả ra thì dựng lại từ bản đã chấm. */
async function kemChiTiet(env: Env, sbd: string, Q: string, kq: Obj, ban?: PrivateQuestion): Promise<Obj> {
  if (!kq.ket || kq.ket === 'goi_y') return kq
  const b = ban ?? await (async () => { const q = await cauDuoc(env, sbd, Q); return q ? (await cacBan(env, q)).find((x) => x.qid === str(kq.ban)) : undefined })()
  return b ? { ...kq, chiTiet: { de: deDayDu(b), dapAn: b.correct, loiGiai: b.solution } } : kq
}

/** Lần nộp cuối hôm nay đã khép câu (đúng, hoặc đã ra lời giải) ⇒ trả lại kết quả ấy. */
function ketDaKhep(ds: Obj[]): Obj | null {
  const cuoi = ds.at(-1)
  if (!cuoi) return null
  if (Number(cuoi.dung) === 1 || ds.length >= SO_LAN_MOI_NGAY) { try { return JSON.parse(str(cuoi.ket)) as Obj } catch { return null } }
  return null
}

/** Câu đúng NGAY bây giờ có tính "Đã tự sửa" không (luật tự làm a + b; lần 1, không gợi ý). */
const tinhTuSua = (ban: PrivateQuestion, goc: string, lan: number, c: { ngaySai: string; docGan: boolean; homNay: string }) =>
  lan === 1 && !c.docGan && (ban.qid !== goc || (!!c.ngaySai && c.homNay > c.ngaySai))

export async function gonMo(env: Env, b: Obj): Promise<Response> {
  const sbd = await quyen(env, b)
  if (sbd instanceof Response) return sbd
  const dotId = str(b.dotId)
  if (!dotId || dotId.length > 160) return loi('THIEU_THAM_SO', 'Thiếu câu cần sửa.')
  const nowMs = Date.now()
  const c = await docChung(env, sbd, dotId, nowMs)
  if (!c.dot) return loi('KHONG_CO_DOT', 'Không tìm thấy câu này trong danh sách của em.', 404)
  if (str(c.dot.trang_thai_day) === 'da_tu_sua') return Response.json({ ok: true, dotId, trangThai: 'da_tu_sua' })
  const khep = ketDaKhep(c.lanHomNay)
  if (khep) return Response.json(await kemChiTiet(env, sbd, str(c.dot.qid_chuan), { ...khep, ok: true, dotId, daKhepHomNay: true }))
  const q = await cauDuoc(env, sbd, str(c.dot.qid_chuan))
  if (!q) return loi('KHONG_MO_DUOC_CAU', 'Chưa mở được câu này ở đây. Em bấm Hỏi thầy nhé.', 404)
  const ds = await cacBan(env, q)
  if (!ds.length) return loi('KHONG_MO_DUOC_CAU', 'Câu này chưa chấm tự động được. Em bấm Hỏi thầy nhé.', 404)
  // Lần 2 hôm nay làm lại ĐÚNG bản lần 1 (sau gợi ý); lần đầu hôm nay xoay bản theo số lần đã làm của đợt.
  const truoc = c.lanHomNay.at(-1)
  const ban = (truoc && ds.find((x) => x.qid === str(truoc.ban))) || ds[c.tongLan % ds.length]!
  const lan = c.lanHomNay.length + 1
  const ngaySai = str(c.dot.ngay_sai), docGan = Number(c.dot.doc_gan) === 1
  return Response.json({
    ok: true, dotId, lan, ban: ban.qid, banKhac: ban.qid !== q.qid,
    tuSuaNeuDung: tinhTuSua(ban, q.qid, lan, { ngaySai, docGan, homNay: c.homNay }),
    de: cauCongKhai(ban),
  })
}

export async function gonNop(env: Env, b: Obj): Promise<Response> {
  const sbd = await quyen(env, b)
  if (sbd instanceof Response) return sbd
  const dotId = str(b.dotId), banXin = str(b.ban), traLoi = str(b.traLoi).trim().slice(0, 200), khoa = str(b.khoa)
  if (!dotId || dotId.length > 160 || !banXin || banXin.length > 160 || !khoa || khoa.length > 80) return loi('THIEU_THAM_SO', 'Thiếu câu trả lời.')
  if (!traLoi) return loi('CHUA_TRA_LOI', 'Em trả lời rồi bấm Kiểm tra nhé.')
  const nowMs = Date.now()
  const [c, cu] = await Promise.all([
    docChung(env, sbd, dotId, nowMs),
    env.DB.prepare('SELECT ket FROM chua_gon_lan WHERE khoa=? AND sbd=?').bind(khoa, sbd).first<{ ket: string }>(),
  ])
  if (!c.dot) return loi('KHONG_CO_DOT', 'Không tìm thấy câu này trong danh sách của em.', 404)
  const Q = str(c.dot.qid_chuan)
  if (cu) { try { return Response.json(await kemChiTiet(env, sbd, Q, JSON.parse(cu.ket) as Obj)) } catch { /* hỏng ⇒ chấm như mới */ } }
  const khep = ketDaKhep(c.lanHomNay)
  if (khep) return Response.json(await kemChiTiet(env, sbd, Q, { ...khep, ok: true, dotId, daKhepHomNay: true }))
  const q = await cauDuoc(env, sbd, Q)
  if (!q) return loi('KHONG_MO_DUOC_CAU', 'Chưa mở được câu này ở đây. Em bấm Hỏi thầy nhé.', 404)
  // CHỈ nhận bản máy chủ dựng lại được từ chính câu gốc của đợt (không nộp được câu lạ để lấy "Đã tự sửa").
  const ban = (await cacBan(env, q)).find((x) => x.qid === banXin)
  if (!ban) return loi('SAI_BAN', 'Câu vừa đổi. Em mở lại câu này nhé.', 409)
  const truoc = c.lanHomNay.at(-1)
  if (truoc && str(truoc.ban) !== ban.qid) return loi('SAI_BAN', 'Câu vừa đổi. Em mở lại câu này nhé.', 409)
  const lan = c.lanHomNay.length + 1
  const dung = chamCauTuLuyen(ban.phan, ban.correct, traLoi).dung
  const daDong = str(c.dot.trang_thai_day) === 'da_tu_sua'
  const tuSua = dung && !daDong && tinhTuSua(ban, Q, lan, { ngaySai: str(c.dot.ngay_sai), docGan: Number(c.dot.doc_gan) === 1, homNay: c.homNay })
  const ket = dung ? (tuSua || daDong ? 'tu_sua' : 'xong_phan') : lan < SO_LAN_MOI_NGAY ? 'goi_y' : 'loi_giai'
  const moLoiGiai = ket !== 'goi_y'
  const goiY = ket === 'goi_y' ? await goiYMot(env, Q, ban) : undefined
  const kq: Obj = {
    ok: true, dotId, lan, ban: ban.qid, dung, ket,
    ...(ket === 'tu_sua' ? { trangThai: 'da_tu_sua' } : {}),
    ...(ket === 'xong_phan' ? { lyDo: lan > 1 ? 'co_goi_y' : Number(c.dot.doc_gan) === 1 ? 'doc_loi_giai' : 'cung_ngay' } : {}),
    ...(goiY ? { goiY } : {}),
  }
  const luc = new Date(nowMs).toISOString()
  const cong = { sql: 'EXISTS(SELECT 1 FROM chua_gon_lan WHERE khoa=? AND luc=?)', params: [khoa, nowMs] }
  const ghi = [
    // Trần 2 lần / đợt / ngày: đếm và chèn trong CÙNG câu lệnh (hai cú bấm song song không cùng lọt).
    env.DB.prepare(`INSERT OR IGNORE INTO chua_gon_lan(khoa,dot_id,sbd,ngay_vn,lan,ban,tra_loi,dung,ket,luc)
      SELECT ?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM chua_gon_lan WHERE dot_id=? AND sbd=? AND ngay_vn=?)<?`)
      .bind(khoa, dotId, sbd, c.homNay, lan, ban.qid, traLoi, dung ? 1 : 0, JSON.stringify(kq), nowMs, dotId, sbd, c.homNay, lan),
    lenhGhiSuKienNguyenTu(env, [{
      nguon: 'chua_loi', maNguon: dotId, sbd, qid: ban.qid, cauVersion: ban.version, lan, ketQua: dung ? 1 : 0, luc,
      attemptId: khoa, assistance: lan > 1 ? 'assisted' : 'none', visibility: 'released', purpose: 'repair',
      maDang: ban.dang ?? null,
      raw: { traLoi, tc: Q, chua: { dotId, gon: 1, lan } },
    }], cong),
    ...(tuSua ? [env.DB.prepare(`UPDATE chua_loi_dot SET trang_thai_day='da_tu_sua',dong_luc=?,revision=revision+1,cap_nhat_luc=? WHERE id=? AND sbd=? AND dong_luc IS NULL AND ${cong.sql}`)
      .bind(nowMs, nowMs, dotId, sbd, ...cong.params)] : []),
    // Em đã thấy lời giải ⇒ dấu đọc lời giải (luật tự làm a của mọi kênh khác cũng thấy).
    ...(moLoiGiai ? [env.DB.prepare(`INSERT OR IGNORE INTO loi_giai_hoi(sbd,qid,luc,co_ho_so,nguon) SELECT ?,?,?,0,'chua_gon:sau_nop' WHERE ${cong.sql}`)
      .bind(sbd, Q, new Date(nowMs + 1).toISOString(), ...cong.params)] : []),
    env.DB.prepare('SELECT ket,luc FROM chua_gon_lan WHERE khoa=? AND sbd=?').bind(khoa, sbd),
  ]
  const r = await env.DB.batch(ghi)
  const dong = (r.at(-1)?.results?.[0] ?? null) as { ket: string; luc: number } | null
  if (!dong) return loi('HET_LUOT', 'Hôm nay em đã làm câu này đủ lần. Mai làm lại nhé.', 409)
  emCoGhi(sbd) // như nopItem: sổ vừa có dòng mới ⇒ bỏ bản đếm kế hoạch / hồ sơ đệm của em
  if (Number(dong.luc) !== nowMs) { try { return Response.json(await kemChiTiet(env, sbd, Q, JSON.parse(dong.ket) as Obj)) } catch { /* rơi xuống */ } }
  return Response.json(await kemChiTiet(env, sbd, Q, kq, ban))
}

/** Gợi ý sau lần sai đầu (thầy 27/10: lời khuyên chung chung «đọc lại đề, gạch chân…» là vô nghĩa ⇒ bỏ): bước 1 bài luyện từng bước thầy đã duyệt ·
 *  không có ⇒ vế đầu bước 1 / kiến thức cốt lõi của lời giải kho nếu KHÔNG lộ đáp án (goi-y-rieng.ts) · không có ⇒ undefined (máy em không hiện dòng Gợi ý). */
async function goiYMot(env: Env, Q: string, ban: PrivateQuestion): Promise<string | undefined> {
  const h = await docHocLieu(env, Q).catch(() => null)
  const buoc = h?.duDung ? h.hocLieu?.buoc?.[0] : undefined
  const m1 = buoc?.hoTro?.find((x) => x.muc === 1)?.noiDung?.trim()
  if (m1) return m1
  return goiYTuLoiGiai(ban) ?? undefined
}
