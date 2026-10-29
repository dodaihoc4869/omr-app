// CHỮA CÂU GỌN — HAI LỆNH CỦA MÀN SỬA CÂU (thầy 25/10, docs/de-xuat-chua-cau-gon-2510.md mục 2, 4, 6). Luật dùng chung ở chua-gon.ts.
//   POST /hs/chua-cau-sai/gon-mo  {token, dotId}                    ⇒ đề công khai của BẢN làm lại (KHÔNG đáp án, KHÔNG lời giải) + lần thứ mấy hôm nay.
//   POST /hs/chua-cau-sai/gon-nop {token, dotId, ban, traLoi, khoa}  ⇒ MÁY CHỦ chấm; đúng lần 1 qua luật tự làm ⇒ "Đã tự sửa" NGAY (đóng đợt cùng lô ghi).
// Một câu: lần 1 → (sai) gợi ý → lần 2 → (sai) lời giải đầy đủ. Đúng sau gợi ý / đúng mà chưa qua luật tự làm ⇒ "xong phần hôm nay", đợt vẫn mở.
// Bản làm lại (chống học thuộc đáp án): song sinh soạn sẵn (`~ss`, cau_bo_tro) → biến thể bằng mã (`~bt` Phần I/III, `~yd` Phần II) → câu gốc.
// Chưa có: câu anh em (cùng dạng, khác nội dung) và xáo phương án câu gốc — câu gốc chỉ tính "Đã tự sửa" khi làm ở NGÀY KHÁC ngày sai (luật b).
// Đáp án / lời giải CHỈ ra sau khi em nộp, và chỉ khi đúng hoặc đã hết lần thử. Bấm lặp cùng `khoa` ⇒ đúng kết quả cũ. Trần 2 lần / đợt / ngày chốt trong câu INSERT.
// Chi phí: gon-mo = 1 đợt đọc song song + nạp câu; gon-nop = 1 đợt đọc song song + nạp câu + 1 lô ghi. Không lệnh nóng nào đổi.
// THƯỞNG (thầy duyệt 28/10): câu ra khỏi hàng ⇒ +2 nguyên tử (exp-cau-hinh.ts NT_TU_SUA_RA_HANG) — MỘT câu chèn exp_so CÙNG lô ghi, cấu hình EXP đọc CÙNG đợt đọc.
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { cauCongKhai } from './cau-theo-qid'
import { cauDuocNho, docHocLieuNho, quyen } from './chua-cau-sai'
import { NhoCoLuot } from './chua-gon-nho'
import { boTroTheoQid } from './song-sinh-game'
import type { BoTro } from './cau-bo-tro'
import { gameSbdDaKy } from './game-v2-auth'
import { chamCauTuLuyen } from '../../src/lib/tu-luyen'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import { lenhGhiSuKienNguyenTu, ngayVn } from './su-kien-hoc'
import { apSongSinh, qidSongSinh } from './song-sinh-game'
import { phuQidAoMoi, SO_THU_BIEN_THE } from './ban-khac-ao'
import { qidBienThe, qidYDsMoi } from './loi-hoc-luat'
import { GIO_LOI_GIAI_GAN, sqlHoCau } from './chua-gon'
import { emCoGhi } from './dem-ke-hoach'
import { goiYTuLoiGiai } from './goi-y-rieng'
import { docCauHinhExp, mocExpCuaEm } from './exp-d1'
import { LOAI_TU_SUA, NT_TU_SUA_RA_HANG, NT_TU_SUA_TRAN_NGAY } from './exp-cau-hinh'
import { tachSongSinh } from './loi-hoc-luat'

type Obj = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const loi = (ma: string, mo: string, status = 400) => Response.json({ ok: false, ma, mo }, { status })
export const SO_LAN_MOI_NGAY = 2

/** Dựng danh sách bản làm lại; `tot` = KHÔNG có lượt đọc nào lỗi (lỗi thoáng qua ⇒ danh sách rút gọn, KHÔNG được nhớ). */
async function dungCacBan(env: Env, q: PrivateQuestion): Promise<{ ds: PrivateQuestion[]; tot: boolean }> {
  let tot = true
  const ra: PrivateQuestion[] = []
  const boTro = await boTroTheoQid(env, [q.qid]).catch(() => { tot = false; return new Map<string, BoTro>() })
  const ss = boTro.get(q.qid)?.songSinh ?? []
  ss.forEach((s, i) => { const b = apSongSinh(q, s, i); if (b && b.qid === qidSongSinh(q.qid, i)) ra.push(b) })
  if (!ra.length) {
    const ao = q.phan === 'II' ? [qidYDsMoi(q.qid, 0)] : Array.from({ length: SO_THU_BIEN_THE }, (_, k) => qidBienThe(q.qid, k))
    for (const qid of ao) {
      const b = await phuQidAoMoi(env, q, qid).catch(() => { tot = false; return null })
      if (b && b.qid === qid) { ra.push(b); break }
    }
  }
  ra.push(q)
  return { ds: ra.filter((b) => !laCauTuLuan(b) && !!String(b.correct ?? '').trim()), tot }
}
// 29/10 (thầy «Mở câu quá lâu»): danh sách bản làm lại là hàm THUẦN của câu gốc + học liệu bổ trợ (song sinh) ⇒ nhớ trong isolate 3 phút (chua-gon-nho.ts); dùng chung cho
// mọi em cùng câu (giờ cao điểm cả lớp sai cùng vài câu). Không nhớ khi một lượt đọc lỗi.
const nhoBan = new NhoCoLuot<PrivateQuestion[]>()
/** Mọi bản làm lại dùng được của câu gốc, theo thứ tự ưu tiên (song sinh → biến thể → gốc). Mảng dùng chung — nơi gọi KHÔNG sửa. */
export async function cacBan(env: Env, q: PrivateQuestion): Promise<PrivateQuestion[]> {
  const khoa = `${q.qid}|${q.version ?? ''}`
  const co = nhoBan.doc(khoa)
  if (co) return co
  const r = await dungCacBan(env, q)
  if (r.tot) nhoBan.ghi(khoa, r.ds)
  return r.ds
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
  const b = ban ?? await (async () => { const q = await cauDuocNho(env, sbd, Q); return q ? (await cacBan(env, q)).find((x) => x.qid === str(kq.ban)) : undefined })()
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

/**
 * Xác thực rồi đọc phần chung SONG SONG (29/10, thầy «Mở câu quá lâu»): chữ ký token kiểm KHÔNG chạm D1 (`gameSbdDaKy`) ⇒ các lượt ĐỌC theo SBD ấy chạy CÙNG đợt với `quyen`
 * (mật khẩu, cờ, ca thi đang mở). Chỉ ĐỌC, chỉ dùng sau khi `quyen` qua và SBD khớp — như `gameIdentityHaiBuoc`. `sbdDaKiem`: nơi gọi vừa chạy `quyen` rồi (mo-dot kèm gon-mo).
 */
async function quyenKemDocChung<T>(env: Env, b: Obj, sbdDaKiem: string | undefined, doc: (sbd: string) => Promise<T>): Promise<{ sbd: string; kq: Promise<T> } | Response> {
  if (sbdDaKiem) return { sbd: sbdDaKiem, kq: doc(sbdDaKiem) }
  const sbdSom = await gameSbdDaKy(env, b).catch(() => '')
  const som = sbdSom ? doc(sbdSom) : null
  som?.catch(() => {}) // lỗi tới đúng chỗ khi `await kq`; chặn cảnh báo khi `quyen` từ chối trước
  const sbd = await quyen(env, b)
  if (sbd instanceof Response) return sbd
  return { sbd, kq: som && sbdSom === sbd ? som : doc(sbd) }
}

/**
 * Làm ẤM bản nhớ câu + bản làm lại của câu `qid` (máy em gợi ý — đúng câu gốc của đợt) CÙNG đợt với phần đọc đầu: câu nguội mất 4–6 đợt D1 nối tiếp để nạp, đợt của em
 * chỉ cho biết mã câu sau đợt đầu. Gợi ý sai / lỗi ⇒ bỏ qua (đường thường tự nạp sau). Chỉ ĐỌC, kết quả chỉ nằm trong bản nhớ — nơi gọi vẫn kiểm đợt thuộc về em và khớp mã câu.
 */
const lamAm = (env: Env, sbd: string, qid: string): Promise<null> =>
  (qid && qid.length <= 160 ? cauDuocNho(env, sbd, qid).then((q) => (q ? cacBan(env, q) : null)) : Promise.resolve(null)).then(() => null, () => null)

export async function gonMo(env: Env, b: Obj, sbdDaKiem?: string): Promise<Response> {
  const dotId = str(b.dotId)
  const nowMs = Date.now()
  const qHint = str(b.qid)
  const qk = await quyenKemDocChung(env, b, sbdDaKiem, (s) => (dotId && dotId.length <= 160 ? Promise.all([docChung(env, s, dotId, nowMs), lamAm(env, s, qHint)]).then(([c]) => c) : Promise.resolve(null)))
  if (qk instanceof Response) return qk
  const sbd = qk.sbd
  if (!dotId || dotId.length > 160) return loi('THIEU_THAM_SO', 'Thiếu câu cần sửa.')
  const c = (await qk.kq)!
  if (!c.dot) return loi('KHONG_CO_DOT', 'Không tìm thấy câu này trong danh sách của em.', 404)
  if (str(c.dot.trang_thai_day) === 'da_tu_sua') return Response.json({ ok: true, dotId, trangThai: 'da_tu_sua' })
  const khep = ketDaKhep(c.lanHomNay)
  if (khep) return Response.json(await kemChiTiet(env, sbd, str(c.dot.qid_chuan), { ...khep, ok: true, dotId, daKhepHomNay: true }))
  const q = await cauDuocNho(env, sbd, str(c.dot.qid_chuan))
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
  const dotId = str(b.dotId), banXin = str(b.ban), traLoi = str(b.traLoi).trim().slice(0, 200), khoa = str(b.khoa)
  const hopLe = !!dotId && dotId.length <= 160 && !!banXin && banXin.length <= 160 && !!khoa && khoa.length <= 80
  const nowMs = Date.now()
  // 29/10 (thầy «Kiểm tra chưa tức thì»): `quyen` + ba lượt đọc (đợt / lần hôm nay, lần đã nộp theo khoá, cấu hình EXP) CÙNG một đợt D1 — trước: nối tiếp.
  const qHint = str(b.qid)
  const qk = await quyenKemDocChung(env, b, undefined, (s) => (hopLe && traLoi ? Promise.all([
    docChung(env, s, dotId, nowMs),
    env.DB.prepare('SELECT ket FROM chua_gon_lan WHERE khoa=? AND sbd=?').bind(khoa, s).first<{ ket: string }>(),
    docCauHinhExp(env).catch(() => null),
    lamAm(env, s, qHint),
  ]).then(([c0, cu0, cfg0]) => [c0, cu0, cfg0] as const) : Promise.resolve(null)))
  if (qk instanceof Response) return qk
  const sbd = qk.sbd
  if (!hopLe) return loi('THIEU_THAM_SO', 'Thiếu câu trả lời.')
  if (!traLoi) return loi('CHUA_TRA_LOI', 'Em trả lời rồi bấm Kiểm tra nhé.')
  const [c, cu, cfgExp] = (await qk.kq)!
  if (!c.dot) return loi('KHONG_CO_DOT', 'Không tìm thấy câu này trong danh sách của em.', 404)
  const Q = str(c.dot.qid_chuan)
  if (cu) { try { return Response.json(await kemChiTiet(env, sbd, Q, JSON.parse(cu.ket) as Obj)) } catch { /* hỏng ⇒ chấm như mới */ } }
  const khep = ketDaKhep(c.lanHomNay)
  if (khep) return Response.json(await kemChiTiet(env, sbd, Q, { ...khep, ok: true, dotId, daKhepHomNay: true }))
  const q = await cauDuocNho(env, sbd, Q)
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
  ]
  // Thưởng sửa đúng câu cũ (28/10): chỉ khi câu RA KHỎI HÀNG ở lượt này và EXP mới đang bật cho em; điều kiện trần / lặp ngày chốt TRONG câu chèn.
  const thuong = tuSua && cfgExp && mocExpCuaEm(cfgExp, sbd, nowMs) ? ghi.push(lenhThuongTuSua(env, { sbd, Q, dotId, ngay: c.homNay, luc, cong })) - 1 : -1
  ghi.push(env.DB.prepare('SELECT ket,luc FROM chua_gon_lan WHERE khoa=? AND sbd=?').bind(khoa, sbd))
  const r = await env.DB.batch(ghi)
  const dong = (r.at(-1)?.results?.[0] ?? null) as { ket: string; luc: number } | null
  if (!dong) return loi('HET_LUOT', 'Hôm nay em đã làm câu này đủ lần. Mai làm lại nhé.', 409)
  emCoGhi(sbd) // như nopItem: sổ vừa có dòng mới ⇒ bỏ bản đếm kế hoạch / hồ sơ đệm của em
  if (Number(dong.luc) !== nowMs) { try { return Response.json(await kemChiTiet(env, sbd, Q, JSON.parse(dong.ket) as Obj)) } catch { /* rơi xuống */ } }
  const nguyenTu = thuong >= 0 && Number(r[thuong]?.meta.changes) > 0 ? NT_TU_SUA_RA_HANG : 0
  return Response.json(await kemChiTiet(env, sbd, Q, nguyenTu ? { ...kq, nguyenTu } : kq, ban))
}

/**
 * Khoản «Sửa đúng câu cũ» vào sổ nguyên tử (exp_so — trigger bảng giải tuần cộng như mọi khoản, nhãn Đối phó tuần ⇒ 0 ở bảng giải). Khoá theo MÃ GỐC + ngày
 * (bỏ hậu tố song sinh / biến thể ⇒ một câu gốc một lần mỗi ngày). Chỉ vào khi: dòng lần nộp của CHÍNH lượt này vừa chèn (`cong`), em chưa có đủ
 * NT_TU_SUA_TRAN_NGAY khoản hôm nay, và mã gốc chưa ĐÚNG ở kênh khác hôm nay trước lúc này (luật lặp câu #525). Mọi điều kiện theo chỉ mục (sbd, ngay_vn) / (sbd, qid).
 */
export function lenhThuongTuSua(env: Env, x: { sbd: string; Q: string; dotId: string; ngay: string; luc: string; cong: { sql: string; params: unknown[] } }) {
  const goc = tachSongSinh(x.Q).goc
  return env.DB.prepare(`INSERT OR IGNORE INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu)
    SELECT ?1,?2,?3,'${LOAI_TU_SUA}',?4,?5,?6,?7,?8
    WHERE EXISTS(SELECT 1 FROM chua_gon_lan WHERE khoa=?9 AND luc=?10)
      AND (SELECT COUNT(*) FROM exp_so WHERE sbd=?2 AND ngay_vn=?3 AND loai='${LOAI_TU_SUA}') < ?11
      AND NOT EXISTS(SELECT 1 FROM su_kien_hoc s WHERE s.sbd=?2 AND ${sqlHoCau('s.qid', '?4')} AND s.ngay_vn=?3 AND s.ket_qua=1 AND s.nguon<>'chua_loi' AND s.luc<?7)`)
    .bind(`${x.sbd}|${LOAI_TU_SUA}|${goc}|${x.ngay}`, x.sbd, x.ngay, goc, x.dotId, NT_TU_SUA_RA_HANG, x.luc, `Sửa đúng câu cũ: +${NT_TU_SUA_RA_HANG}`,
      ...x.cong.params, NT_TU_SUA_TRAN_NGAY)
}

/** Gợi ý sau lần sai đầu (thầy 27/10: lời khuyên chung chung «đọc lại đề, gạch chân…» là vô nghĩa ⇒ bỏ): bước 1 bài luyện từng bước thầy đã duyệt ·
 *  không có ⇒ vế đầu bước 1 / kiến thức cốt lõi của lời giải kho nếu KHÔNG lộ đáp án (goi-y-rieng.ts) · không có ⇒ undefined (máy em không hiện dòng Gợi ý). */
async function goiYMot(env: Env, Q: string, ban: PrivateQuestion): Promise<string | undefined> {
  const h = await docHocLieuNho(env, Q).catch(() => null)
  const buoc = h?.duDung ? h.hocLieu?.buoc?.[0] : undefined
  const m1 = buoc?.hoTro?.find((x) => x.muc === 1)?.noiDung?.trim()
  if (m1) return m1
  return goiYTuLoiGiai(ban) ?? undefined
}
