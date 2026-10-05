// LÀM LẠI CÂU SAI BẰNG BẢN KHÁC — THANG 4 BẬC (thầy 05/10: "thay vì lặp lại câu sai bạn hãy tìm cách để học sinh vẫn hoàn thành được câu sai
// đó nhưng không học thuộc đáp án được"; đặc tả: DE-XUAT-LAM-LAI-CAU-SAI-0510.md). Mọi luật mới ở ĐÂY (+ phần thuần ở lam-lai-so.ts); chỗ cũ chỉ móc một dòng.
//
// Câu sai Q tới lượt làm lại (cửa sổ lỗi `laCuaSoLoi`: lỗi mở / chờ kiểm / kiểm duy trì theo luật chung `phatLaiLoi` — `HoSo2.loiV2`) lấy bậc đầu tiên có sẵn:
//   1. SONG SINH (sẵn có: hang-chua-loi `phuNeuCan` trong `napLuot`, qid ảo "<Q>~ss0..3", trần TRAN_SONG_SINH = 4). Thêm ở đây: lượt chờ kiểm SAU khi
//      em đã đúng song sinh (luật 02/10 để câu gốc ra nguyên văn) vẫn là song sinh, xoay bản kế (`HoSo2.songSinhLamLai`).
//   1b. (06/10, ban-khac-ao.ts) BẢN KHÁC "ẢO", câu chưa có song sinh: Phần I/III có bộ sinh theo dạng ⇒ BIẾN THỂ BẰNG MÃ (qid ảo "<Q>~bt<k>", đáp án tính bằng mã,
//      hạt giống = qid ảo ⇒ chấm / resume sinh lại đúng câu); Phần II ⇒ bộ 4 ý Đúng–Sai MỚI của đúng đề dẫn (qid ảo "<Q>~yd<k>", kho `cau_y_ds`; kho rỗng / thiếu ý ⇒ rơi xuống).
//      Sổ ghi dưới CHÍNH qid ảo + `raw_json.tc = Q` ⇒ lượt SONG SINH của Q (như câu anh em). k = số thứ tự kế tiếp đếm từ sổ (`HoSo2.banKhacTiep`).
//   2. CÂU ANH EM: một câu THẬT khác trong kho: cùng `dang`, cùng phần, cùng `mucDo` (không có ⇒ mức kề), KHÁC nhóm nội dung, ĐÚNG KHỐI của em,
//      em chưa gặp (hết ⇒ gặp lâu nhất > NGAY_GAP_LAI ngày), hợp lệ chung (không câu bảo vệ ca thi / BTVN chưa nộp / tự luận, trong phạm vi em),
//      không bị chặn ở lượt này (câu Bi-a đang giữ, câu đang phát ở phiên khác, câu thầy chặn trong game), không nằm trong kế hoạch hôm nay, không
//      làm hôm nay. DÙNG LẠI bộ chọn "câu lạ cùng dạng" của omni-game.ts. Tất định theo (em, ngày, Q). Phản hồi là câu thật qua `publicQuestion`
//      (không đáp án), vai 'on_lai' sẵn có. Sổ ghi dưới qid câu anh em + `raw_json.tc = Q` (lam-lai-so.ts) ⇒ phát lại lỗi của Q coi là lượt song sinh.
//      Nguồn: DẠY HỌC trong phạm vi em (như trước); THIẾU ⇒ (06/10) kho TU LUYỆN cùng dạng, cùng phần, cùng mức (nới kề), ĐÚNG KHỐI, em CHƯA gặp, không tự luận,
//      không câu ca bảo vệ / BTVN chưa nộp (không giới hạn phạm vi đã dạy — kho luyện tập). Câu đang NGHI sai đáp án (`cau_nghi_dap_an`) không bao giờ thành câu anh em.
//   3. BẢN XÁO: Phần I xáo 4 phương án, Phần II xáo 4 ý (đáp án + ảnh + lý do từng phương án/ý theo); tất định theo em + lần; hoán vị chỉ nằm trong
//      JSON phiên ở máy chủ (`xt`), máy em KHÔNG nhận; chấm theo thứ tự đã xáo (`apXaoTheoRef`), sổ ghi đáp án em chọn QUY VỀ khung gốc + `xt: 1`.
//      Phần III: KHÔNG xáo được; "câu kiểm đi trước khi nhập đáp số" cần giao diện mới (câu kiểm hiện chỉ có trong khung lời giải SAU khi nộp;
//      thầy 05/10 giữ nguyên giao diện học sinh) ⇒ BỎ, rơi xuống bậc 4.
//   4. NGUYÊN VĂN: như nay; lượt mang `raw_json.nv = 1` để đếm chỗ cần soạn thêm song sinh (scripts/do-phu-lam-lai.mjs).
// LUẬT KHỐI (thầy 05/10 "chặn chuẩn 100% không được rút nhầm kho khác khối"): câu anh em là kênh MỚI đưa câu cho em ⇒ lọc `cauHopKhoi` (src/lib/khoi-cau.ts,
// qua `hopLeChung`) VÀ `dungKhoi`: mọi nguồn khối đọc ra được của câu (mã tờ, qid, cột `lop` của `de_kho`) BẰNG khối em, ít nhất một nguồn đọc ra
// (em chưa rõ khối ⇒ bằng khối câu Q; cả hai không rõ ⇒ không có câu anh em). Câu không rõ / mâu thuẫn / khác khối KHÔNG BAO GIỜ thành câu anh em.
// Chỗ lọc: `chonCauAnhEm` dưới đây (điều phối nối cổng cuối `chan-khac-khoi.ts` tại đây). Bậc 1/3/4 phục vụ chính câu Q (không phải kênh mới).
// Công tắc an toàn `cau_hinh` khoá `lam_lai_khac` (vắng = BẬT; {"bat":false} ⇒ tắt hết phần mới của tệp này, về đúng đường hôm nay). Đọc qua cau-hinh-dem.ts.
// Giao diện học sinh KHÔNG đổi: không chữ mới, không khoá mới xuống máy em (khoá `tc`/`xt`/`nv` chỉ ở JSON phiên và raw_json sổ).
// Vòng phụ thuộc: tệp này nhập omni-game (có I/O) nên CHỈ srs2-game.ts nhập nó; game-v2.ts / game-v2-doan.ts chỉ nhập phần thuần lam-lai-so.ts.
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { khoiCuaCau, khoiCuaMaDe } from '../../src/lib/khoi-cau'
import { docCauHinhDem } from './cau-hinh-dem'
import { tachSongSinh } from './loi-hoc-luat'
import { phuNeuCan } from './hang-chua-loi'
import { bacMuc, bam32, boiCanh, docChiMucTheoDang, hopLeChung, lamHomNay, metaTheoDang, napTheoThuTu, phamViChon, xepUngVien, type BoiCanh, type PhamViChon } from './omni-game'
import { docMetaCau, ngayVnCua, qidGoc, type HoSo2, type MetaCau } from './srs2-d1'
import { napDayDuMem } from './game-v2-bank'
import { thuMucCuaMaDe } from './kho-thu-muc'
import { chonBanKhacMoi } from './ban-khac-ao'
import { coBoSinh } from './bien-the-sinh'
import { docCauNghiDem, docKhoiEmCong, khoiDaLocCua } from './chan-khac-khoi'
import { readGameScope } from './game-v2-reports'
import { laCauTuLuan } from './cam-tu-luan'
import { apXaoTheoRef, dungKhoi, khoiCanCo, laCuaSoLoi, xaoCau, type LamLaiRef } from './lam-lai-so'

type Obj = Record<string, unknown>
const laObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)
const NGAY_MS = 86_400_000
/** Hết câu chưa gặp ⇒ lấy câu cùng dạng em gặp lâu nhất, nhưng phải quá số ngày này. */
export const NGAY_GAP_LAI = 14
/** Số ứng viên đầu bảng xếp được thử nạp bản đầy đủ (câu vừa rút khỏi kho / tự luận bị bỏ qua). */
const SO_THU_NAP = 8

// ---------------------------------------------------------------- công tắc
export const KHOA_LAM_LAI_KHAC = 'lam_lai_khac'
/** Vắng dòng / không đọc được JSON ⇒ BẬT; chỉ `{"bat":false}` mới tắt. Đệm 15 s trong isolate như các cờ khác. */
export async function lamLaiKhacBat(env: Env): Promise<boolean> {
  const v = await docCauHinhDem(env, KHOA_LAM_LAI_KHAC)
  if (v == null) return true
  try { const o = JSON.parse(v) as unknown; return !(laObj(o) && o.bat === false) } catch { return true }
}

// ---------------------------------------------------------------- kiểu
export interface CauLuot { q: PrivateQuestion; m: MetaCau; lamLai?: LamLaiRef }
/** Bối cảnh một lượt (chuyến Đảo / chặng Đoàn): em, lúc, các khoá của kế hoạch hôm nay (câu anh em không được trùng câu sẽ phát). */
export interface BoiCanhLamLai { sbd: string; nowMs: number; keHoach?: readonly string[] }

/** Q đang trong cửa sổ lỗi ⇒ lượt làm lại phải là BẢN KHÁC (không nguyên văn nếu còn bậc 1–3). */
export function canBanKhac(hs: Pick<HoSo2, 'loiV2'>, qid: string): boolean {
  return laCuaSoLoi(hs.loiV2?.get(qid)?.trangThai)
}

/** Cột `lop` của `de_kho` theo mã tờ (ứng viên câu anh em). Lỗi đọc ⇒ NÉM (nơi gọi rơi xuống bậc 3/4 — không phát câu chưa kiểm được khối). */
async function docLopTo(env: Env, maDe: readonly string[]): Promise<Map<string, string>> {
  const r = await env.DB.prepare('SELECT ma_de, lop FROM de_kho WHERE ma_de IN (SELECT value FROM json_each(?))').bind(JSON.stringify([...new Set(maDe)])).all<Obj>()
  return new Map((r.results ?? []).filter((x) => x.lop != null && String(x.lop).trim()).map((x) => [String(x.ma_de), String(x.lop)]))
}

// ---------------------------------------------------------------- bậc 1–4 cho một lượt
/**
 * Áp thang bậc lên các câu đã nạp của lượt (sau khi `napLuot` đã phủ song sinh theo luật 02/10). Câu không phải lỗi / đã là song sinh ⇒ giữ nguyên.
 * `chan`: câu/nhóm bị chặn ở lượt này (ca thi, Bi-a đang giữ, đang phát ở phiên khác) — câu anh em cũng tránh. Công tắc tắt ⇒ trả y nguyên (đường hôm
 * nay). Lỗi đọc khi chọn câu anh em ⇒ rơi xuống bậc 3/4 cho câu ấy (không làm hỏng lượt).
 */
export async function apLamLaiKhac(env: Env, hs: HoSo2, ds: readonly { q: PrivateQuestion; m: MetaCau }[], bc: BoiCanhLamLai, chan: ReadonlySet<string> = new Set(), som?: DocSomLamLai): Promise<CauLuot[]> {
  const can = new Set(ds.filter((x) => tachSongSinh(x.q.qid).songSinh === null && canBanKhac(hs, x.q.qid)))
  if (!can.size || !(await (som?.bat ?? lamLaiKhacBat(env)))) return [...ds]
  const ngay = ngayVnCua(bc.nowMs)
  let chung: Promise<ChungAnhEm> | null = null // phạm vi + bối cảnh đọc MỘT lần cho cả lượt, và chỉ khi có câu cần
  const daDung = new Set(ds.map((x) => tachSongSinh(x.q.qid).goc)), nhomDung = new Set(ds.map((x) => x.m.group))
  // Bậc 1b (06/10): câu chưa có song sinh dùng được ⇒ biến thể bằng mã (Phần I/III có bộ sinh) / bộ ý Đ–S mới (Phần II) — MỘT lần cho cả lượt (một truy vấn cho mọi câu Phần II).
  // Khối em lấy từ hồ sơ đã lọc khối (0 truy vấn); chưa lọc lần nào ⇒ đọc một lần. Lỗi gì ⇒ rơi xuống bậc 2 (không làm hỏng lượt).
  const choBanKhac = ds.filter((x) => can.has(x) && phuNeuCan(x.q, hs.songSinhLamLai, hs.boTro).qid === x.q.qid).map((x) => x.q)
  let banKhac = new Map<string, PrivateQuestion>()
  if (choBanKhac.length) {
    try {
      const khoiEm = khoiDaLocCua(hs.meta) ?? await docKhoiEmCong(env, bc.sbd).catch(() => null)
      banKhac = await chonBanKhacMoi(env, choBanKhac, hs.banKhacTiep, khoiEm ?? null)
    } catch (e) { console.error('[cau-anh-em] không chọn được bản khác bằng mã / ý Đ–S mới (rơi xuống bậc 2):', e instanceof Error ? e.message : e) }
  }
  const ra: CauLuot[] = []
  for (const x of ds) {
    if (!can.has(x)) { ra.push(x); continue }
    // Bậc 1: lượt luật 02/10 để câu gốc nguyên văn (chờ kiểm, đã đúng song sinh) ⇒ vẫn song sinh, bản kế. Phần II / song sinh thiếu dữ kiện ⇒ không phủ.
    const ss = phuNeuCan(x.q, hs.songSinhLamLai, hs.boTro)
    if (ss.qid !== x.q.qid) { ra.push({ ...x, q: ss }); continue }
    // Bậc 1b: bản khác bằng mã / ý Đ–S mới (qid ảo `~bt<k>` / `~yd<k>`; sổ ghi dưới qid ảo + `tc = Q`).
    const bk = banKhac.get(x.q.qid)
    if (bk) { ra.push({ q: bk, m: x.m, lamLai: { tc: x.q.qid } }); continue }
    // Bậc 2: câu anh em.
    const ae = await chonCauAnhEm(env, bc, x.m, (chung ??= som?.chung ?? chungAnhEm(env, bc, chan)), daDung, nhomDung, som?.chiMuc)
      .catch((e: unknown) => { console.error('[cau-anh-em] không chọn được câu anh em (rơi xuống bậc 3/4):', e instanceof Error ? e.message : e); return null })
    if (ae) { daDung.add(ae.m.qid); nhomDung.add(ae.m.group); ra.push({ q: ae.q, m: ae.m, lamLai: { tc: x.q.qid } }); continue }
    // Bậc 3: bản xáo (muối theo em + ngày + câu + lần: số lần sai, số ngày đã đúng sau lần sai cuối).
    const loi = hs.loiV2!.get(x.q.qid)!
    const xao = xaoCau(x.q, `${bc.sbd}|${ngay}|${x.q.qid}|${loi.soLanSai}|${loi.ngayDung.length}`)
    if (xao) { ra.push({ q: xao.q, m: x.m, lamLai: { xt: xao.xt } }); continue }
    // Bậc 4: nguyên văn (đếm).
    ra.push({ ...x, lamLai: { nv: 1 } })
  }
  return ra
}

/** Đọc chung cho cả lượt (một lần): phạm vi, bối cảnh, kế hoạch, câu bị chặn; đệm meta theo dạng + lớp của tờ (nhiều câu lỗi cùng dạng/tờ ⇒ không đọc lại). */
interface ChungAnhEm { pv: PhamViChon; bc: BoiCanh; keHoach: Set<string>; chan: Set<string>; theoDang: Map<string, Promise<MetaCau[]>>; lopTo: Map<string, string | null>
  /** 06/10: câu đang NGHI sai đáp án (đệm 60 s trong isolate, đọc CÙNG đợt phạm vi/bối cảnh) — không thành câu anh em. */
  nghi: ReadonlySet<string>
  /** 06/10 (A3): meta kho TU LUYỆN theo dạng (kèm `lop` của tờ), đọc khi DẠY HỌC không còn ứng viên. */
  theoDangTL: Map<string, Promise<{ meta: MetaCau[]; lopTo: Map<string, string> }>>
  /** Tối ưu 05/10: `lop` của MỌI tờ ứng viên một dạng (tập cha của tờ cần kiểm khối), đọc CÙNG đợt meta của dạng ấy. */
  lopSom: { ma: ReadonlySet<string>; p: Promise<Map<string, string>> }[] }
async function chungAnhEm(env: Env, bc: BoiCanhLamLai, chan: ReadonlySet<string>): Promise<ChungAnhEm> {
  // `boiCanh` ném khi không đọc được tập câu bảo vệ ca thi ⇒ không chọn câu anh em (thà không phát còn hơn lộ câu ca thi).
  const [pv, boi, pham, nghi] = await Promise.all([
    phamViChon(env, bc.sbd),
    boiCanh(env, bc.sbd, bc.nowMs),
    readGameScope(env, bc.sbd).catch(() => null), // câu thầy chặn trong game (`answer` từ chối câu này ⇒ em kẹt) — lỗi đọc ⇒ không thêm
    docCauNghiDem(env, bc.nowMs), // câu nghi sai đáp án (không ném: lỗi/bảng chưa có ⇒ rỗng)
  ])
  return {
    pv, bc: boi,
    keHoach: new Set((bc.keHoach ?? []).map((k) => tachSongSinh(qidGoc(k)).goc)),
    chan: new Set([...chan, ...(Array.isArray(pham?.blocked) ? pham.blocked.map(String) : [])]),
    theoDang: new Map(), lopTo: new Map(), lopSom: [], nghi, theoDangTL: new Map(),
  }
}

/**
 * ĐỌC SỚM của thang (tối ưu 05/10): `napLuot` gọi NGAY khi biết câu của lượt (trước khi nạp câu) — công tắc, phần đọc chung (phạm vi, bối cảnh, câu
 * thầy chặn) và chỉ mục câu cùng dạng chạy CÙNG đợt nạp câu thay vì 4–5 đợt nối tiếp sau đó. Chỉ khi lượt có câu CHẮC tới bậc 2 nếu nạp được: câu gốc
 * trong cửa sổ lỗi mà không có song sinh dùng được (luật 02/10 lẫn bậc 1) ⇒ lượt không cần thì không đọc thêm gì. Đều là ĐỌC, không ghi nào xen giữa
 * (lượt đọc cũ cũng chạy sau lô đóng phiên Bi-a, trước lô ghi phiên) ⇒ cùng dữ liệu; `apLamLaiKhac` vẫn quyết y hệt (đoán thừa ⇒ phí vài lượt đọc).
 */
export interface DocSomLamLai { bat: Promise<boolean>; chung: Promise<ChungAnhEm>; chiMuc: ReadonlyMap<string, Promise<Record<string, unknown>[]>> }
const coSongSinh = (chon: ReadonlyMap<string, number> | undefined, boTro: HoSo2['boTro'], q: string): boolean => {
  const i = chon?.get(q)
  return i !== undefined && i >= 0 && !!boTro?.get(q)?.songSinh[i]
}
/** Câu CHẮC đi bậc 1b (biến thể bằng mã): Phần I/III, dạng có bộ sinh, khối câu = khối em đã biết ⇒ không cần đọc sớm cho câu anh em (rơi xuống bậc 2 thì đọc như cũ). */
const chacBienThe = (hs: Pick<HoSo2, 'meta'>, q: string): boolean => {
  const m = hs.meta.get(q), khoi = khoiDaLocCua(hs.meta)
  return !!m && (m.phan === 'I' || m.phan === 'III') && !!m.dang && coBoSinh(m.dang) && khoi != null && khoiCuaCau(m) === khoi
}
export function batDauLamLaiKhac(env: Env, hs: HoSo2, qids: readonly string[], bc: BoiCanhLamLai, chan: ReadonlySet<string>): DocSomLamLai | undefined {
  const can = qids.filter((q) => tachSongSinh(q).songSinh === null && canBanKhac(hs, q) && !coSongSinh(hs.songSinhCho, hs.boTro, q) && !coSongSinh(hs.songSinhLamLai, hs.boTro, q) && !chacBienThe(hs, q))
  if (!can.length) return undefined
  const chiMuc = new Map<string, Promise<Record<string, unknown>[]>>()
  for (const q of can) { const d = hs.meta.get(q)?.dang; if (d && !chiMuc.has(d)) chiMuc.set(d, docChiMucTheoDang(env, d)) }
  const ra: DocSomLamLai = { bat: lamLaiKhacBat(env), chung: chungAnhEm(env, bc, chan), chiMuc }
  for (const p of [ra.bat, ra.chung, ...chiMuc.values()]) p.catch(() => {}) // đoán thừa / lỗi ⇒ nơi dùng tự nhận lỗi như cũ, không treo lỗi
  return ra
}

/**
 * Câu anh em của Q: cùng dạng + cùng phần, khoảng cách bậc mức ≤ 1 (cùng mức xếp trước), khác nhóm nội dung, ĐÚNG KHỐI (`khoiCanCo`), không trùng
 * câu/nhóm đã có trong lượt hay kế hoạch hôm nay, không bị chặn, hợp lệ chung (`hopLeChung` ⇒ `cauHopKhoi`), chưa làm hôm nay, không nghi sai đáp án.
 * Nguồn 1 — DẠY HỌC trong phạm vi em: chưa gặp hoặc gặp quá NGAY_GAP_LAI ngày. Nguồn 2 (06/10) — kho TU LUYỆN khi nguồn 1 không còn ứng viên: CHƯA gặp.
 * Xếp tất định (`xepUngVien`, muối em|ngày|Q) rồi nạp bản đầy đủ của câu đầu còn trong kho. Không có ⇒ null.
 */
async function chonCauAnhEm(env: Env, lb: BoiCanhLamLai, m: MetaCau, chungP: Promise<ChungAnhEm>, daDung: ReadonlySet<string>, nhomDung: ReadonlySet<string>, chiMucSom?: DocSomLamLai['chiMuc']): Promise<{ q: PrivateQuestion; m: MetaCau } | null> {
  if (!m.dang) return null
  const dang = m.dang
  const chung = await chungP
  const { pv, bc, keHoach, chan } = chung
  const khoi = khoiCanCo(bc.khoiEm, m)
  if (khoi == null) return null
  const bacQ = bacMuc(m.mucDo)
  const khoang = (x: MetaCau): number => { if (bacQ == null) return 0; const b = bacMuc(x.mucDo); return b == null ? 9 : Math.abs(b - bacQ) }
  const lauRoi = (x: MetaCau): boolean => !bc.daLam.has(x.qid) || bc.daLam.get(x.qid)! <= lb.nowMs - NGAY_GAP_LAI * NGAY_MS
  const chuaGap = (x: MetaCau): boolean => !bc.daLam.has(x.qid)
  const muoi = `${lb.sbd}|${ngayVnCua(lb.nowMs)}|${m.qid}`
  /** Lọc chung của mọi nguồn (trừ luật khối đầy đủ cần `lop` của tờ — ở `chonTuUng`). */
  const hopLe = (x: MetaCau, daGap: (y: MetaCau) => boolean): boolean =>
    x.qid !== m.qid && x.phan === m.phan && x.group !== m.group && !daDung.has(x.qid) && !nhomDung.has(x.group) && !keHoach.has(x.qid)
    && !chan.has(x.qid) && !chan.has(x.group) && !chung.nghi.has(x.qid.split('~')[0]!) && hopLeChung(x, bc) && !lamHomNay(x.qid, bc) && khoang(x) <= 1 && daGap(x)
    && [khoiCuaMaDe(x.maDe), khoiCuaMaDe(x.qid)].every((k) => k === null || k === khoi) // lọc nhanh: mã tờ/qid không lệch khối; đủ luật `dungKhoi` (kèm `lop` của tờ) ở `chonTuUng`
  /** Ứng viên đã qua lọc nhanh ⇒ luật `dungKhoi` (đọc `lop` của tờ nếu chưa có) ⇒ xếp ⇒ nạp bản đầy đủ câu đầu còn trong kho. */
  const chonTuUng = async (truoc: readonly MetaCau[]): Promise<{ q: PrivateQuestion; m: MetaCau } | null> => {
    if (!truoc.length) return null
    const canDoc = [...new Set(truoc.map((x) => x.maDe))].filter((ma) => !chung.lopTo.has(ma))
    if (canDoc.length) {
      // Lượt đọc sớm PHỦ đủ tờ cần ⇒ dùng nó (cùng bảng, không ghi nào xen giữa ⇒ cùng số; lỗi đọc ⇒ ném như cũ); không thì đọc như cũ.
      const som = chung.lopSom.find((x) => canDoc.every((ma) => x.ma.has(ma)))
      const doc = await (som ? som.p : docLopTo(env, canDoc))
      for (const ma of canDoc) chung.lopTo.set(ma, doc.get(ma) ?? null)
    }
    const ung = truoc.filter((x) => dungKhoi(x, chung.lopTo.get(x.maDe), khoi))
    if (!ung.length) return null
    const thu = xepUngVien(ung, bc, khoang, muoi)
    const [chon] = await napTheoThuTu(env, thu.slice(0, SO_THU_NAP), 1)
    return chon ?? null
  }
  // Nguồn 1: DẠY HỌC trong phạm vi em.
  let theoDang = chung.theoDang.get(dang)
  if (!theoDang) {
    // Tối ưu 05/10: chỉ mục dạng đọc sớm (nếu có) + `lop` của mọi tờ ứng viên đọc CÙNG đợt meta (trước: một đợt riêng sau khi lọc).
    const khiCoMaTo = (maTo: string[]): void => { const p = docLopTo(env, maTo); p.catch(() => {}); chung.lopSom.push({ ma: new Set(maTo), p }) }
    theoDang = metaTheoDang(env, dang, pv, { chiMuc: chiMucSom?.get(dang), khiCoMaTo })
    chung.theoDang.set(dang, theoDang)
  }
  const dayHoc = await chonTuUng((await theoDang).filter((x) => hopLe(x, lauRoi)))
  if (dayHoc) return dayHoc
  // Nguồn 2 (06/10, A3): DẠY HỌC thiếu ⇒ kho TU LUYỆN cùng dạng — cùng luật khối / mức / khác nhóm, em CHƯA gặp, không tự luận, không câu ca bảo vệ (`hopLeChung`).
  let tl = chung.theoDangTL.get(dang)
  if (!tl) { tl = metaTuLuyenTheoDang(env, dang, bc.daLam, `${lb.sbd}|${ngayVnCua(lb.nowMs)}|${dang}`, chiMucSom?.get(dang)); chung.theoDangTL.set(dang, tl) }
  const kho = await tl
  for (const x of kho.meta) if (!chung.lopTo.has(x.maDe)) chung.lopTo.set(x.maDe, kho.lopTo.get(x.maDe) ?? null) // `lop` của tờ đã đọc cùng đợt ⇒ `chonTuUng` không đọc lại
  return chonTuUng(kho.meta.filter((x) => hopLe(x, chuaGap)))
}

/** Trần số câu TU LUYỆN (chưa gặp) của một dạng được nạp meta mỗi lượt — dạng lớn có hàng trăm câu; chọn mẫu tất định theo (em, ngày, dạng) để nhẹ D1. */
export const TRAN_UNG_VIEN_TU_LUYEN = 200
/**
 * Meta kho TU LUYỆN của một dạng (A3, 06/10): chỉ mục dạng (đã đọc sớm nếu có) → câu em CHƯA gặp (`daLam`), đã duyệt, mẫu tất định ≤ TRAN_UNG_VIEN_TU_LUYEN → tờ có thư mục `TU_LUYEN`
 * (`de_kho_thu_muc`; thiếu dòng ⇒ luật mã `DH-` = DẠY HỌC) → meta đầy đủ + cột `lop` của các tờ (luật khối). KHÔNG giới hạn phạm vi đã dạy (kho luyện tập).
 * Không có ⇒ rỗng; lỗi đọc ⇒ NÉM (nơi gọi rơi xuống bậc 3/4 — không phát câu chưa kiểm được).
 */
async function metaTuLuyenTheoDang(env: Env, dang: string, daLam: ReadonlyMap<string, number>, muoi: string, chiMucSom?: Promise<Record<string, unknown>[]>): Promise<{ meta: MetaCau[]; lopTo: Map<string, string> }> {
  const rows = await (chiMucSom ?? docChiMucTheoDang(env, dang))
  const laThat = (v: unknown): boolean => v === 1 || v === true || v === '1' || v === 'true'
  const chua = rows.filter((x) => laThat(x.rv) && !daLam.has(String(x.qid)))
  const hop = chua.length > TRAN_UNG_VIEN_TU_LUYEN ? [...chua].sort((a, b) => bam32(`${muoi}|${a.qid}`) - bam32(`${muoi}|${b.qid}`)).slice(0, TRAN_UNG_VIEN_TU_LUYEN) : chua
  if (!hop.length) return { meta: [], lopTo: new Map() }
  const maTo = [...new Set(hop.map((x) => String(x.ma_de)))]
  // MỘT đợt: thư mục tờ + `lop` của tờ + meta của mẫu câu đọc SONG SONG (meta đọc đoán trước — lọc theo tờ TU LUYỆN sau; mẫu ≤ TRAN_UNG_VIEN_TU_LUYEN dòng) ⇒ rơi vào TU LUYỆN chỉ tốn một đợt đọc.
  const [thuMuc, lopTo, meta] = await Promise.all([thuMucCuaMaDe(env, maTo), docLopTo(env, maTo), docMetaCau(env, [...new Set(hop.map((x) => String(x.qid)))], maTo)])
  const tl = new Set(maTo.filter((ma) => thuMuc.get(ma) === 'TU_LUYEN'))
  return { meta: tl.size ? [...meta.values()].filter((x) => tl.has(x.maDe) && !x.tuLuan) : [], lopTo }
}

/**
 * Nạp lại câu của LƯỢT ĐANG CHỜ theo ref phiên (startDao2 trả lại chuyến chưa làm câu nào): câu anh em không có trong meta kế hoạch, bản xáo phải
 * xáo lại y hệt ⇒ nạp theo (mã đề, qid, phiên bản) của ref. Lượt không có khoá làm lại ⇒ gọi đúng đường cũ (`napCu`).
 */
export async function napLaiLuotCho(env: Env, hs: Pick<HoSo2, 'meta'>, refs: readonly ({ qid: string; maDe: string; version: string; group: string } & LamLaiRef)[], toiDa: number, napCu: () => Promise<{ q: PrivateQuestion; m: MetaCau }[]>): Promise<{ q: PrivateQuestion; m: MetaCau }[]> {
  if (!refs.some((r) => r.tc || r.xt || r.nv)) return napCu()
  const day = await napDayDuMem(env, refs.map((r) => ({ maDe: r.maDe, qid: r.qid, version: r.version })))
  const ra: { q: PrivateQuestion; m: MetaCau }[] = []
  for (const r of refs) {
    const q = day.get(`${r.maDe}|${r.qid}|${r.version}`)
    if (!q || laCauTuLuan(q)) continue
    const m: MetaCau = hs.meta.get(r.qid) ?? { qid: r.qid, maDe: r.maDe, version: r.version, group: r.group, phan: q.phan, mucDo: q.mucDo ?? null, dang: q.dang ?? null, tenDang: q.tenDang ?? null, sao: Number(q.sao) || 0, tuLuan: false }
    ra.push({ q: apXaoTheoRef(q, r), m })
    if (ra.length >= toiDa) break
  }
  return ra
}
