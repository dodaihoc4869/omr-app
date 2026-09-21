// ĐOÀN HỘ TỐNG — máy chủ (bước 2 của prompt-game-doan-ho-tong.md): mở chặng / vào chặng / nộp hiệp / kết chặng.
//
// Luật chơi nằm TRỌN trong lõi thuần `src/game/than-thu-v2/doan-core.ts`. Tệp này chỉ làm bốn việc:
//   1. CHỌN CÂU cho từng em từ hồ sơ của chính em — bằng đúng đường `start` của game v2 (readScope + allowed + chooseSession +
//      chặn câu ca thi chưa công bố + chặn câu đã làm hôm nay + trần 200 câu/ngày), rồi xếp: tới hạn ôn → dạng yếu → câu còn lại.
//   2. CHẤM bằng đúng đường `answer` của game v2 → mọi luật đang có test khoá giữ nguyên (20/40/40 vào ví, có trợ giúp = không ghi
//      bằng chứng, ghi `su_kien_hoc` nguồn `game`, không chạm bảng học tập). Không có bản chấm thứ hai nào ở đây.
//   3. GIỮ PHÒNG trong bảng `doan_chang` (JSON + revision, khoá lạc quan như phòng Linh Tâm cũ), đồng bộ bằng hỏi-đáp ngắn.
//   4. DỰNG KHUNG NHÌN cho từng em: đáp án không bao giờ xuống máy em trước khi em chốt; không ai thấy bạn sai gì / chọn gì.
//
// Câu chung của TRÙM không tạo bằng chứng cá nhân: không ghi attempt, không ghi sổ, không tính vào trần 200.
import type { Env, D1PreparedStatement } from './kieu'
import type { Profile } from './game-v2'
import { PETS, publicQuestion, type PrivateQuestion, type Question } from '../../src/game/than-thu-v2/core'
import {
  moChang, giaiHiep, roiTran, datGiaoY, kiemHanhDong, hiepLaTrum, giayCuaHiep, tomTatChang, khungNhinHiep, kichBanChang,
  kiemTiepSuc, NHAN_TIEP_SUC_TOI_DA, SO_GHE_TOI_DA, SO_HIEP, SO_Y_TRUM, type Chang, type HanhDong, type NopHiep, type NopTrum,
} from '../../src/game/than-thu-v2/doan-core'
import { hashSeed } from '../../src/lib/exam-shuffle'
import { protectedQuestions } from './game-v2-bank'
import { laCauTuLuan } from './cam-tu-luan'
import { readGameScope } from './game-v2-reports'
import { qidChanHomNay } from './game-v2-ho-so'
import { ngayVn } from './su-kien-hoc'
import { soanThe, deRutGon, MO_TA_THE, type LoaiThe, type TheGoiY } from './game-v2-doan-the'
import { ghiTiepSuc } from './exp-d1'
import { docExpKetChang, traoExpKetChang } from './game-v2-doan-exp'
import { docCauBtvnChuaNop } from './game-v2-luot'
import { docSanh, quaCongVe, hoanVe, ketChangChoLop } from './game-v2-doan-mua'
import { docAnThach, anChoSanh, goiYBanDongHanh, docHienThi } from './game-v2-doan-an'

type Row = Record<string, unknown>
export type GoiGame = (env: Env, action: string, b: Record<string, unknown>) => Promise<Record<string, unknown>>

/** Đếm ngược trước hiệp 1 và quãng nghỉ giữa hai hiệp (đủ cho màn tung chưởng ≤ 3 s + đọc lời giải). */
export const DEM_NGUOC_MS = 3000
export const NGHI_GIUA_HIEP_MS = 6000
/** Bài tới trễ vì mạng chập chờn vẫn được nhận trong khoảng này sau khi đồng hồ về 0. */
export const AN_HAN_MS = 1500
export const PHONG_HET_HAN_MS = 3_600_000

// CỜ MỞ GAME (0.Planer đặt 19/09, cùng kiểu cờ EXP của Code 3): bảng `cau_hinh`, khoá `doan_ho_tong`, JSON `{"dsSbd":["12121212"],"toanBo":false}`.
// KHÔNG có dòng / JSON hỏng / thiếu bảng = TẮT với mọi em: game y hệt trước khi có Đoàn. Bật cho vài em để chơi thật trên bản sống rồi mới mở cả trường.
export const LOI_CHUA_MO = 'Đoàn Hộ Tống sắp ra mắt. Em chờ thêm ít hôm nhé.'
export async function doanMoCho(env: Env, sbd: string): Promise<boolean> {
  try {
    const r = await env.DB.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='doan_ho_tong'").first<{ gia_tri: string | null }>()
    if (!r?.gia_tri) return false
    const o = JSON.parse(r.gia_tri) as { dsSbd?: unknown; toanBo?: unknown }
    return o.toanBo === true || (Array.isArray(o.dsSbd) && o.dsSbd.map(x => String(x).trim()).includes(sbd))
  } catch { return false }
}

// Lệnh `answer` cho phiên câu của Đoàn chỉ được gọi TỪ ĐÂY (cờ `assisted` do máy chủ quyết, không do máy em khai).
// WeakSet theo đối tượng: gói tin từ máy em không cách nào tự đánh dấu mình là "nội bộ".
const noiBo = new WeakSet<object>()
export const laGoiNoiBoDoan = (b: object) => noiBo.has(b)
const danhDau = <T extends object>(b: T): T => { noiBo.add(b); return b }

export type NhanCau = 'toi_han_on' | 'dang_yeu' | 'cau_moi' | 'vua_suc'
/** `an` = dạng của câu này em ĐÃ KHẮC PHỤC XONG (ấn thạch sáng) → kỹ năng ở hiệp này là biến thể ấn (×1,25). */
interface CauRef { qid: string; maDe: string; version: string; nhan: NhanCau; dang: string | null; tenDang: string; nhom: string; kt: string[]; an?: boolean }
/** `cap` chỉ để VẼ đúng hình thái thần thú; không bao giờ vào lõi (cấp không cho chỉ số trong trận). */
interface NguoiDoan { sbd: string; ten: string; pet: number; cap: number; lop: string; phien: string; cau: CauRef[] }
interface NopLuu { dung: boolean; hanhDong: HanhDong; tuLam: boolean; boTrong: boolean; tiepSucBoi?: number }
/** Thẻ gợi ý một ghế đã nhận ở hiệp đang chạy: `tu` = ghế tiếp sức (có thể là bạn máy). Nội dung thẻ CHỈ xuống máy người nhận. */
interface TheLuu extends TheGoiY { tu: number }
export interface PhongDoan {
  kind: 'doan-phong'; chu: string; taoLuc: number; nguoi: NguoiDoan[]
  chang: Chang | null
  /** Lúc hiệp hiện tại MỞ (câu chỉ xuống máy em từ lúc này); hạn chót = hiepLuc + số giây của hiệp. */
  hiepLuc: number
  nop: Record<string, NopLuu>; nopY: Record<string, boolean>; tinHieu: Record<string, string>
  /** Tiếp sức của hiệp đang chạy: thẻ theo ghế NHẬN, và các ghế đã GIÚP (mỗi hiệp giúp một bạn). */
  the: Record<string, TheLuu>; daGiup: number[]
  /** Kết quả tiếp sức của hiệp vừa giải, chờ ghi vào `doan_tiep_suc` cùng giao dịch với lần lưu phòng. */
  choGhi: { hiep: number; den: string; thanhCong: boolean }[]
  /** Kết quả câu chung của trùm vừa giải (không tên em nào), chờ ghi vào `doan_trum_cau` cho bảng của thầy. */
  choGhiTrum?: { hiep: number; maDang: string | null; qid: string; yDung: number }[]
  /** Câu chung của hai hiệp trùm; null = không có câu hợp lệ → giáp vỡ theo phong độ 3 hiệp trước. */
  trum: Record<string, CauRef | null>
  /** Ý trùm giao theo bậc của từng bạn ở dạng của câu chung (ý a dễ nhất → bạn bậc thấp nhất). */
  giaoY: Record<string, number[]>
  ketLuc: number | null
}
const TIN_HIEU = ['can_tiep_suc', 'chac_y', 'ban_them', 'doi_ti'] as const

const iso = (ms: number) => new Date(ms).toISOString()
const hex = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
/** Tên gọi trong đội: hai chữ cuối của họ tên ("Nguyễn Thu Hà" → "Thu Hà"). Không bao giờ dùng SBD. */
export function tenGoi(hoTen: string, duPhong: string): string {
  const tu = hoTen.trim().split(/\s+/).filter(Boolean)
  return tu.length === 0 ? duPhong : tu.slice(-2).join(' ')
}
/** Câu cá nhân thứ mấy ứng với hiệp thường này (hiệp 1,2,3,5,6,7 → 0..5). */
export const chiSoCau = (hiep: number) => hiep - 1 - (hiep > 4 ? 1 : 0)
const hanHiep = (p: PhongDoan) => p.hiepLuc + giayCuaHiep(p.chang!.hiep) * 1000

// ───────────────────────── Đọc / ghi phòng ─────────────────────────
async function docPhong(env: Env, ma: string): Promise<{ phong: PhongDoan; revision: number }> {
  const row = await env.DB.prepare('SELECT json,revision FROM doan_chang WHERE ma=?').bind(ma).first<{ json: string; revision: number }>()
  if (!row) throw new Error('Không tìm thấy chặng này. Em kiểm tra lại mã đoàn.')
  const phong = JSON.parse(row.json) as PhongDoan
  phong.the ??= {}; phong.daGiup ??= []; phong.choGhi ??= [] // phòng mở trước bước 4
  return { phong, revision: row.revision }
}
/** Ghi có khoá lạc quan. Chặng vừa kết thúc → cùng một giao dịch chốt sổ lượt của từng em (khoá chính + `ket_luc IS NULL` chống ghi trùng). */
async function luuPhong(env: Env, ma: string, p: PhongDoan, revision: number): Promise<boolean> {
  const c = p.chang
  const trangThai = c?.ketThuc ? 'xong' : c ? 'dang_di' : p.nguoi.length ? 'sanh' : 'huy'
  const choGhi = p.choGhi ?? [], choGhiTrum = p.choGhiTrum ?? []; p.choGhi = []; p.choGhiTrum = []
  const lenh: D1PreparedStatement[] = [env.DB.prepare('UPDATE doan_chang SET json=?,revision=revision+1,trang_thai=?,chu=?,ket_luc=? WHERE ma=? AND revision=?')
    .bind(JSON.stringify(p), trangThai, p.chu, p.ketLuc ? iso(p.ketLuc) : null, ma, revision)]
  if (c?.ketThuc && p.ketLuc) {
    const t = tomTatChang(c)
    for (const g of t.ghe) {
      if (g.laMay) continue
      lenh.push(env.DB.prepare(`UPDATE doan_luot SET thang=?,sao=?,so_cau=?,so_dung=?,so_tu_lam_dung=?,so_giup=?,so_giup_thanh_cong=?,so_duoc_giup=?,ket_luc=?
        WHERE ma_chang=? AND sbd=? AND ket_luc IS NULL AND EXISTS(SELECT 1 FROM doan_chang WHERE ma=? AND revision=?)`)
        .bind(t.thang ? 1 : 0, t.sao, g.soCau, g.soDung, g.soTuLamDung, g.soLanGiup, g.soLanGiupThanhCong, g.soLanDuocGiup, iso(p.ketLuc), ma, g.id, ma, revision + 1))
    }
  }
  for (const g of choGhi) lenh.push(env.DB.prepare('UPDATE doan_tiep_suc SET thanh_cong=? WHERE ma_chang=? AND hiep=? AND den_sbd=? AND EXISTS(SELECT 1 FROM doan_chang WHERE ma=? AND revision=?)').bind(g.thanhCong ? 1 : 0, ma, g.hiep, g.den, ma, revision + 1))
  const r = await env.DB.batch(lenh)
  // ĐIỀU 9: chặng vừa kết thúc ⇒ trao EXP kết chặng (thắng 5/10/15, vỡ giáp +3/trùm) cho từng bạn thật, qua cửa trần 120 EXP game/ngày. Idempotent theo khoá; lỗi chỉ ghi log.
  if (r[0]?.meta.changes && c?.ketThuc && p.ketLuc) await traoExpKetChang(env, ma, p.ketLuc, tomTatChang(c))
  // Sổ câu trùm là sổ PHỤ cho thầy (bảng của bước 6 có thể chưa có) → ghi ngoài giao dịch, lỗi thì bỏ qua.
  if (r[0]?.meta.changes) for (const g of choGhiTrum) await env.DB.prepare('INSERT OR IGNORE INTO doan_trum_cau(ma_chang,hiep,lop,ngay_vn,ma_dang,qid,y_dung,so_ghe) VALUES(?,?,?,?,?,?,?,?)').bind(ma, g.hiep, p.nguoi[0]?.lop ?? '', ngayVn(iso(p.hiepLuc)), g.maDang, g.qid, g.yDung, p.nguoi.length).run().catch(() => {})
  return !!r[0]?.meta.changes
}

// ───────────────────────── Câu hỏi ─────────────────────────
async function cauRieng(env: Env, ref: Pick<CauRef, 'qid' | 'maDe' | 'version'>): Promise<PrivateQuestion | null> {
  const row = await env.DB.prepare(`SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc
    WHERE q.ma_de=? AND q.qid=? AND q.version=? AND COALESCE(d.da_xoa,0)=0`).bind(ref.maDe, ref.qid, ref.version).first<{ json: string }>()
  // CẤM RÚT TỰ LUẬN (21/09): phòng tạo trước lệnh cấm còn ghim câu tự luận ⇒ coi như câu đã rút khỏi kho (đường `rut: true` sẵn có, hiệp không bị tính sai).
  if (!row) return null
  const q = JSON.parse(row.json) as PrivateQuestion
  return laCauTuLuan(q) ? null : q
}

/** Xếp 6 câu máy chủ đã chọn: tới hạn ôn → dạng đang yếu → còn lại (giữ thứ tự của chooseSession trong từng nhóm). Thiếu bảng hồ sơ → nhãn trung tính. */
async function ganNhan(env: Env, sbd: string, qs: Question[], now: number): Promise<CauRef[]> {
  const homNay = ngayVn(iso(now))
  const toiHan = new Set<string>(), daGap = new Set<string>(), dangYeu = new Set<string>()
  let coHoSo = true
  try {
    const cho = qs.map(() => '?').join(',')
    const r = await env.DB.prepare(`SELECT qid,moc_on_ke,trang_thai FROM nam_kt_cau WHERE sbd=? AND qid IN (${cho})`).bind(sbd, ...qs.map(q => q.qid)).all<Row>()
    for (const x of r.results ?? []) { daGap.add(String(x.qid)); if ((x.trang_thai === 'moi_sai' || x.trang_thai === 'dang_on') && x.moc_on_ke && String(x.moc_on_ke) <= homNay) toiHan.add(String(x.qid)) }
    const d = await env.DB.prepare('SELECT ma_dang FROM nam_kt_dang WHERE sbd=? AND (so_moi_sai>0 OR moc_on_ke IS NOT NULL)').bind(sbd).all<Row>()
    for (const x of d.results ?? []) dangYeu.add(String(x.ma_dang))
  } catch { coHoSo = false }
  const nhan = (q: Question): NhanCau => !coHoSo ? 'vua_suc' : toiHan.has(q.qid) ? 'toi_han_on' : q.dang && dangYeu.has(q.dang) ? 'dang_yeu' : daGap.has(q.qid) ? 'vua_suc' : 'cau_moi'
  const thuTu: NhanCau[] = ['toi_han_on', 'dang_yeu', 'cau_moi', 'vua_suc']
  return qs.map((q, i) => ({ i, ref: { qid: q.qid, maDe: q.maDe, version: q.version, nhan: nhan(q), dang: q.dang, tenDang: q.tenDang, nhom: q.group, kt: q.kienThuc } }))
    .sort((a, b) => thuTu.indexOf(a.ref.nhan) - thuTu.indexOf(b.ref.nhan) || a.i - b.i).map(x => x.ref)
}

/** Mở phiên câu cá nhân của em bằng đường `start` sẵn có, rồi đóng dấu phiên để chỉ chấm được qua chặng. */
async function taoNguoi(env: Env, sbd: string, p: Profile, b: Row, goiGame: GoiGame, now: number): Promise<NguoiDoan> {
  const start = await goiGame(env, 'start', danhDau({ token: b.token, mode: 'adventure' }))
  const qs = (start.questions ?? []) as Question[]
  if (!qs.length) throw new Error(String(start.message ?? 'Chưa có câu vừa sức trong kho cho em. Em hoàn thành bài Thầy giao rồi quay lại lên đường nhé.'))
  const phien = String(start.id)
  await env.DB.prepare("UPDATE game_v2_session SET json=json_set(json,'$.doan',1) WHERE id=? AND sbd=?").bind(phien, sbd).run()
  const hs = await env.DB.prepare('SELECT ho_ten,lop FROM hoc_sinh WHERE sbd=?').bind(sbd).first<{ ho_ten: string | null; lop: string | null }>()
  const pet = Math.max(0, PETS.findIndex(x => x.id === p.pet))
  // Ấn thạch SÁNG của em (dạng đã khắc phục xong theo hồ sơ thật) → đánh dấu câu thuộc dạng ấy; chụp MỘT lần lúc vào đoàn để cả chặng tất định.
  const anSang = new Set((await docAnThach(env, sbd, ngayVn(iso(now)))).filter(a => a.trangThai === 'sang').map(a => a.dang))
  const cau = (await ganNhan(env, sbd, qs.slice(0, SO_HIEP - 2), now)).map(c => ({ ...c, an: !!c.dang && anSang.has(c.dang) }))
  return { sbd, ten: tenGoi(String(hs?.ho_ten ?? ''), p.nickname || PETS[pet]!.name), pet, cap: Math.max(1, Math.min(120, Number(p.cap) || 1)), lop: String(hs?.lop ?? ''), phien, cau }
}

/**
 * CÂU CHUNG của hai trùm: một câu Phần II đã duyệt, đủ 4 ý. PHẠM VI không bao giờ đoán từ tên chương: câu chỉ hợp lệ khi thuộc một dạng mà
 * ÍT NHẤT MỘT bạn trong đội đang có câu cá nhân (tức máy chủ đã xác nhận bạn ấy học dạng đó) VÀ mọi kiến thức nền của câu nằm trong kiến thức
 * nền của chính các câu cá nhân ấy. Ưu tiên dạng cả lớp đang sai nhiều nhất. Loại: câu ca thi chưa công bố, câu thầy chặn riêng cho bất kỳ bạn nào,
 * câu ai đó đang/đã làm hôm nay ở chỗ khác, và chính các câu cá nhân của chặng. Không có câu hợp lệ → null (giáp vỡ theo phong độ).
 * Kèm theo: chia 4 ý theo BẬC của từng bạn ở dạng ấy (ý đầu cho bạn bậc thấp nhất; bạn máy coi như bậc giữa).
 */
async function chonCauTrum(env: Env, ma: string, nguoi: NguoiDoan[], now: number): Promise<Pick<PhongDoan, 'trum' | 'giaoY'>> {
  const trum: Record<string, CauRef | null> = { 4: null, 8: null }, giaoY: Record<string, number[]> = {}
  const chan = new Set(await protectedQuestions(env))
  let loaiDuocPhep: Set<string> | null = null
  for (const n of nguoi) {
    const control = await readGameScope(env, n.sbd)
    for (const k of control.blocked) chan.add(k)
    if (control.types.length) loaiDuocPhep = new Set(control.types.filter(t => !loaiDuocPhep || loaiDuocPhep.has(t)))
    for (const q of await qidChanHomNay(env, n.sbd, now)) chan.add(q)
    // Game hiện lời giải ngay ⇒ câu CHUNG của trùm cũng KHÔNG được nằm trong bài tập về nhà CHƯA nộp của BẤT KỲ bạn nào trong đội (Code 1 rà chéo W2c).
    for (const x of await docCauBtvnChuaNop(env, n.sbd)) chan.add(x)
    for (const c of n.cau) { chan.add(c.qid); chan.add(c.nhom) }
  }
  const ktBiet = new Map<string, Set<string>>()
  for (const c of nguoi.flatMap(n => n.cau)) if (c.dang) { const bo = ktBiet.get(c.dang) ?? new Set<string>(); for (const k of c.kt) bo.add(k); ktBiet.set(c.dang, bo) }
  const ds = [...ktBiet.keys()].filter(d => !loaiDuocPhep || loaiDuocPhep.has(d)).slice(0, 80)
  if (!ds.length) return { trum, giaoY }
  const cho = (n: number) => Array.from({ length: n }, () => '?').join(',')
  const yeu = new Map<string, number>(), bac = new Map<string, number>()
  try {
    const lop = [...new Set(nguoi.map(n => n.lop).filter(Boolean))]
    if (lop.length) {
      const l = await env.DB.prepare(`SELECT ma_dang, SUM(so_moi_sai)*1000+SUM(so_sai) diem FROM nam_kt_dang WHERE sbd IN (SELECT sbd FROM hoc_sinh WHERE lop IN (${cho(lop.length)})) GROUP BY ma_dang`).bind(...lop).all<Row>()
      for (const x of l.results ?? []) yeu.set(String(x.ma_dang), Number(x.diem) || 0)
    }
    const r = await env.DB.prepare(`SELECT sbd,ma_dang,bac FROM nam_kt_dang WHERE sbd IN (${cho(nguoi.length)}) AND ma_dang IN (${cho(ds.length)})`).bind(...nguoi.map(n => n.sbd), ...ds).all<Row>()
    for (const x of r.results ?? []) bac.set(`${x.sbd}|${x.ma_dang}`, Number(x.bac) || 0)
  } catch { /* chưa có bảng hồ sơ: không xếp theo độ yếu của lớp, ai cũng bậc 0 */ }
  const r = await env.DB.prepare(`SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc
    WHERE COALESCE(d.da_xoa,0)=0 AND q.dang IN (${cho(ds.length)}) AND json_extract(q.json,'$.phan')='II' LIMIT 400`).bind(...ds).all<{ json: string }>()
  const ungVien = r.results.map(x => JSON.parse(x.json) as PrivateQuestion)
    .filter(q => q.reviewed && !laCauTuLuan(q) && /^[DS]{4}$/.test(q.correct) && q.ideas.length === SO_Y_TRUM && !chan.has(q.qid) && !chan.has(q.group)
      && q.kienThuc.length > 0 && q.kienThuc.every(k => ktBiet.get(q.dang!)!.has(k)))
    .sort((a, b) => (yeu.get(b.dang ?? '') ?? 0) - (yeu.get(a.dang ?? '') ?? 0) || hashSeed(`${ma}|${a.qid}`) - hashSeed(`${ma}|${b.qid}`) || a.qid.localeCompare(b.qid))
  const mot = ungVien[0]; if (!mot) return { trum, giaoY }
  const hai = ungVien.find(q => q.group !== mot.group && q.dang !== mot.dang) ?? ungVien.find(q => q.group !== mot.group)
  const soGhe = Math.max(2, nguoi.length)
  for (const [hiep, q] of [[4, mot], [8, hai]] as const) {
    if (!q) continue
    trum[hiep] = { qid: q.qid, maDe: q.maDe, version: q.version, nhan: 'vua_suc', dang: q.dang, tenDang: q.tenDang, nhom: q.group, kt: q.kienThuc }
    const xep = Array.from({ length: soGhe }, (_, ghe) => ({ ghe, bac: nguoi[ghe] ? bac.get(`${nguoi[ghe]!.sbd}|${q.dang}`) ?? 0 : 1 })).sort((a, b) => a.bac - b.bac || a.ghe - b.ghe)
    giaoY[hiep] = Array.from({ length: SO_Y_TRUM }, (_, y) => xep[Math.floor(y * soGhe / SO_Y_TRUM)]!.ghe)
  }
  return { trum, giaoY }
}

// ───────────────────────── Tiến trình hiệp ─────────────────────────
const gheNguoi = (p: PhongDoan) => p.chang!.ghe.map((g, i) => ({ g, i })).filter(x => !x.g.laMay && !x.g.roi)
function batDau(p: PhongDoan, ma: string, now: number) {
  p.chang = moChang({ hatGiong: ma, nguoi: p.nguoi.map(n => ({ id: n.sbd, ten: n.ten, pet: n.pet })) })
  p.hiepLuc = now + DEM_NGUOC_MS; p.nop = {}; p.nopY = {}; p.tinHieu = {}; p.the = {}; p.daGiup = []; p.choGhi = []
}
/** Trùm không có câu chung: ý của ghế nào ĐÚNG khi ghế ấy tự làm đúng ≥ 2 trong 3 hiệp thường vừa rồi — phong độ của đoạn đường quyết định vỡ giáp. */
function yTheoPhongDo(c: Chang): NopTrum[] {
  const gan = c.lichSu.filter(h => !h.laTrum).slice(-3)
  return c.giaoY.map((ghe, y) => ({ ghe, y, dung: gan.filter(h => h.ghe[ghe]?.dung && h.ghe[ghe]?.tuLam).length >= 2 }))
}
function giai(p: PhongDoan, now: number) {
  const c = p.chang!
  if (hiepLaTrum(c.hiep)) {
    const trum: NopTrum[] = p.trum[c.hiep] ? c.giaoY.flatMap((ghe, y) => p.nopY[y] === undefined ? [] : [{ ghe, y, dung: p.nopY[y]! }]) : yTheoPhongDo(c)
    p.chang = giaiHiep(c, { trum })
    const cauTrum = p.trum[c.hiep]
    if (cauTrum) (p.choGhiTrum ??= []).push({ hiep: c.hiep, maDang: cauTrum.dang, qid: cauTrum.qid, yDung: p.chang.lichSu.at(-1)!.trum!.yDung })
  } else {
    const nop: NopHiep[] = Object.entries(p.nop).map(([ghe, n]) => ({ ghe: Number(ghe), dung: n.dung, hanhDong: n.hanhDong, anThach: !!p.nguoi[Number(ghe)]?.cau[chiSoCau(c.hiep)]?.an, tiepSucBoi: n.tiepSucBoi }))
    p.chang = giaiHiep(c, { nop })
    const kq = p.chang.lichSu.at(-1)!
    for (const ghe of Object.keys(p.the)) if (p.nguoi[Number(ghe)]) p.choGhi.push({ hiep: kq.hiep, den: p.nguoi[Number(ghe)]!.sbd, thanhCong: !!kq.ghe[Number(ghe)]?.dung })
  }
  p.nop = {}; p.nopY = {}; p.tinHieu = {}; p.the = {}; p.daGiup = []; p.hiepLuc = now + NGHI_GIUA_HIEP_MS
  if (p.chang.ketThuc) p.ketLuc = now
  else if (hiepLaTrum(p.chang.hiep) && p.trum[p.chang.hiep] && p.giaoY[p.chang.hiep]) p.chang = datGiaoY(p.chang, p.giaoY[p.chang.hiep]!)
}
/** Đã đủ bài để giải sớm chưa: mọi em còn ở lại (và còn câu để làm) đã chốt; hiệp trùm thì mọi ý do người giữ đã chốt. */
function duBai(p: PhongDoan): boolean {
  const c = p.chang!
  if (hiepLaTrum(c.hiep)) return !p.trum[c.hiep] || c.giaoY.every((ghe, y) => c.ghe[ghe]!.laMay || c.ghe[ghe]!.roi || p.nopY[y] !== undefined)
  return gheNguoi(p).every(({ i }) => p.nop[i] !== undefined || !p.nguoi[i]!.cau[chiSoCau(c.hiep)])
}
/** Tiến một bước nếu tới lúc: hết giờ (kể cả ân hạn), hoặc hiệp đã mở và đủ bài. Trả về true nếu phòng đổi. */
function tienHanh(p: PhongDoan, now: number): boolean {
  const c = p.chang
  if (!c || c.ketThuc || now < p.hiepLuc) return false
  if (gheNguoi(p).length === 0) { p.chang = { ...c, ketThuc: true, thang: false }; p.ketLuc = now; return true } // cả đội đã rời: đóng chặng, không ai bị phạt
  if (now >= hanHiep(p) + AN_HAN_MS || duBai(p)) { giai(p, now); return true }
  return false
}

// ───────────────────────── Khung nhìn của MỘT em ─────────────────────────
async function tienBoHomNay(env: Env, p: PhongDoan, i: number) {
  const c = p.chang!, toi = tomTatChang(c).ghe[i]!
  const tuLamDung = c.lichSu.filter(h => !h.laTrum && h.ghe[i]?.dung && h.ghe[i]?.tuLam).map(h => p.nguoi[i]!.cau[chiSoCau(h.hiep)]?.qid).filter((q): q is string => !!q)
  // "Lên bậc ôn" đo từ SỔ: câu em tự làm đúng hôm nay mà đã từng đúng ở một NGÀY VN TRƯỚC đó (đúng luật Leitner của hồ sơ). Thiếu sổ → không in dòng này.
  let lenBac: number | null = null
  if (p.ketLuc) try {
    lenBac = 0
    if (tuLamDung.length) {
      const r = await env.DB.prepare(`SELECT COUNT(DISTINCT qid) n FROM su_kien_hoc WHERE sbd=? AND ket_qua=1 AND ngay_vn<? AND qid IN (${tuLamDung.map(() => '?').join(',')})`).bind(p.nguoi[i]!.sbd, ngayVn(iso(p.ketLuc)), ...tuLamDung).first<{ n: number }>()
      lenBac = r?.n ?? 0
    }
  } catch { lenBac = null }
  return { soCau: toi.soCau, tuLamDung: toi.soTuLamDung, lenBac, giup: toi.soLanGiup, giupThanhCong: toi.soLanGiupThanhCong, duocGiup: toi.soLanDuocGiup }
}

async function khungNhin(env: Env, ma: string, p: PhongDoan, revision: number, sbd: string, now: number, b: Row): Promise<Record<string, unknown>> {
  const i = p.nguoi.findIndex(n => n.sbd === sbd), c = p.chang
  if (i < 0) throw new Error('Em chưa ở trong đoàn này.')
  const laTrum = !!c && hiepLaTrum(c.hiep), mo = !!c && !c.ketThuc && now >= p.hiepLuc
  const trangThai = (ghe: number) => {
    const g = c?.ghe[ghe]
    if (!g) return 'cho'
    if (g.laMay || g.roi) return 'may'
    if (!mo) return 'cho'
    if (laTrum ? c!.giaoY.every((gi, y) => gi !== ghe || p.nopY[y] !== undefined) : p.nop[ghe] !== undefined) return 'da_chot'
    return p.tinHieu[ghe] === 'can_tiep_suc' ? 'can_tiep_suc' : 'dang_lam'
  }
  const ghe = (c ? c.ghe : p.nguoi.map(n => ({ ten: n.ten, pet: n.pet, laMay: false, roi: false }))).map((g, k) =>
    ({ ghe: k, ten: g.ten, pet: g.pet, cap: (p.nguoi[k] ?? p.nguoi[0]!).cap, laMay: g.laMay, roi: g.roi, laEm: k === i, trangThai: trangThai(k), tinHieu: laTrum && mo ? p.tinHieu[k] ?? null : null }))
  const doan: Record<string, unknown> = { ma, revision, laChu: p.chu === sbd, batDau: !!c, ghe, gioMayChu: now }
  if (!c) return { ok: true, doan }

  const kb = kichBanChang(c.hatGiong)
  doan.tran = {
    tenChang: c.tenChang, hiep: c.hiep, soHiep: SO_HIEP, laTrum, ketThuc: c.ketThuc, thang: c.thang, linhTam: c.linhTam, quai: c.quai, trumVoGiap: c.trumVoGiap,
    nangLuong: c.ghe[i]!.nangLuong, daNhanTiepSuc: c.ghe[i]!.daNhanTiepSuc, giay: giayCuaHiep(c.hiep), moSauMs: Math.max(0, p.hiepLuc - now), conMs: c.ketThuc ? 0 : Math.max(0, hanHiep(p) - Math.max(now, p.hiepLuc)),
    tenQuai: kb.quai.map(q => q.ten), loaiQuai: kb.quai.map(q => q.id), tenTrum: kb.trum.map(t => t.ten), loaiTrum: kb.trum.map(t => t.id),
  }
  const vuaXong = c.lichSu.at(-1)
  if (vuaXong) doan.hiepVuaXong = khungNhinHiep(vuaXong, i)

  if (mo && !laTrum) {
    const ref = p.nguoi[i]!.cau[chiSoCau(c.hiep)], da = p.nop[i]
    if (!ref) doan.cau = { het: true, loiNhan: 'Hôm nay em đã hết câu vừa sức trong kho — em cổ vũ đồng đội hiệp này nhé.' }
    else if (da) {
      // Em đã chốt → được xem lại kết quả câu CỦA MÌNH (tải lại trang không mất lời giải).
      const a = da.boTrong ? null : await env.DB.prepare('SELECT json FROM game_v2_attempt WHERE id=? AND sbd=?').bind(`${p.nguoi[i]!.phien}|${ref.qid}`, sbd).first<{ json: string }>()
      const q = b.coCau === ref.qid ? null : await cauRieng(env, ref) // tải lại trang sau khi chốt: máy em mất đề → gửi lại đề (vẫn là bản công khai)
      doan.cau = { qid: ref.qid, nhan: ref.nhan, daChot: true, hanhDong: da.hanhDong, boTrong: da.boTrong, ketQua: a ? ketQuaCau(JSON.parse(a.json)) : null, ...(q ? { de: publicQuestion(q) } : {}) }
    } else if (b.coCau === ref.qid) doan.cau = { qid: ref.qid, giuNguyen: true, nhan: ref.nhan, an: !!ref.an }
    else {
      const q = await cauRieng(env, ref)
      doan.cau = q ? { qid: ref.qid, nhan: ref.nhan, an: !!ref.an, de: publicQuestion(q) } : { qid: ref.qid, rut: true, loiNhan: 'Câu này vừa được rút khỏi kho. Em chọn Chắn rồi chốt — hiệp này không bị tính sai.' }
    }
  }
  if (mo && !laTrum) {
    const the = p.the[i], daGiup = p.daGiup.includes(i)
    doan.tiepSuc = {
      conLuotNhan: Math.max(0, NHAN_TIEP_SUC_TOI_DA - c.ghe[i]!.daNhanTiepSuc - (the ? 1 : 0)), daXin: p.tinHieu[i] === 'can_tiep_suc',
      // Nội dung thẻ CHỈ có trong gói của người NHẬN. Người tiếp sức không bao giờ thấy nội dung (không đọc hộ bạn).
      theNhan: the ? { tuTen: c.ghe[the.tu]!.ten, tuLaMay: c.ghe[the.tu]!.laMay || c.ghe[the.tu]!.roi, loai: the.loai, tieuDe: the.tieuDe, noiDung: the.noiDung } : null,
      banCan: p.nop[i] && !daGiup ? c.ghe.flatMap((g, k) => k !== i && !g.laMay && !g.roi && p.tinHieu[k] === 'can_tiep_suc' && !p.the[k] && !p.nop[k] && g.daNhanTiepSuc < NHAN_TIEP_SUC_TOI_DA ? [k] : []) : [],
      daGiup, lienKichSanSang: !!the || daGiup,
    }
  }
  if (mo && laTrum) {
    const ref = p.trum[c.hiep]
    const yCuaEm = c.giaoY.flatMap((g, y) => g === i ? [y] : [])
    // Về ý của bạn chỉ có "đã chốt / đang nghĩ" — không có Đúng/Sai bạn chọn, không có kết quả.
    const chung = { coCau: !!ref, giaoY: c.giaoY, yCuaEm, yDaChot: c.giaoY.map((_, y) => p.nopY[y] !== undefined) }
    if (!ref) doan.trum = { ...chung, loiNhan: 'Trùm này không có câu chung hợp lệ — giáp vỡ theo phong độ 3 hiệp vừa rồi của cả đội.' }
    else if (b.coCau === ref.qid) doan.trum = { ...chung, qid: ref.qid, giuNguyen: true }
    else { const q = await cauRieng(env, ref); doan.trum = q ? { ...chung, qid: ref.qid, tenDang: ref.tenDang, de: publicQuestion(q) } : { ...chung, coCau: false } }
  }
  if (c.ketThuc) {
    const t = tomTatChang(c)
    doan.ketChang = {
      thang: t.thang, sao: t.sao, linhTam: t.linhTam, trumVoGiap: t.trumVoGiap, quaiHaGuc: t.quaiHaGuc, soLienKich: t.soLienKich,
      cuaEm: t.ghe[i], tienBo: await tienBoHomNay(env, p, i),
      // Đợt 2 (chỉ-thêm): các khoản EXP của chặng này của em, chữ sẵn có số ("Thắng chặng 3 sao +15 EXP", "Vỡ giáp 2 trùm +6 EXP", "Tiếp sức …").
      expChang: await docExpKetChang(env, sbd, ma),
      // Bước 5: trạm của LỚP trước → sau chặng này, em là bạn thứ mấy góp sức hôm nay (đọc từ sổ lượt — bạn máy không có dòng nên không bao giờ được tính).
      // Bước 6: ấn đang nứt gần sáng nhất của em (đọc hồ sơ thật).
      anThach: anChoSanh(await docAnThach(env, sbd, ngayVn(iso(p.ketLuc ?? now))), p.nguoi[i]!.pet).ganSang,
      doanLop: p.ketLuc ? await ketChangChoLop(env, sbd, p.nguoi[i]!.lop, ma, t.thang, t.ghe[i]!.satThuong, p.ketLuc) : null,
      // Về bạn: chỉ điều tích cực (đã giúp ai bao nhiêu lần). Không có số câu đúng/sai của bạn.
      ban: t.ghe.filter(g => g.ghe !== i).map(g => ({ ghe: g.ghe, laMay: g.laMay, soLanGiupThanhCong: g.soLanGiupThanhCong })),
    }
  }
  return { ok: true, doan }
}
/** Phần kết quả của `answer` được phép về máy em SAU KHI em chốt. */
const ketQuaCau = (r: Row) => ({ correct: r.correct, answer: r.answer, solution: r.solution, solutionImages: r.solutionImages, reward: r.reward, stage: r.stage })

// ───────────────────────── Tiếp sức ─────────────────────────
/** Ghế `tu` có được tiếp sức ghế `den` ngay lúc này không. Lời báo in thẳng cho em. */
function kiemGiup(p: PhongDoan, tu: number, den: number, now: number) {
  const c = p.chang
  if (!c || c.ketThuc || now < p.hiepLuc) throw new Error('Hiệp chưa mở.')
  kiemTiepSuc(c, tu, den, p.daGiup)
  if (!p.nop[tu]) throw new Error('Em chốt câu của mình trước rồi mới tiếp sức bạn được.')
  if (p.nop[den]) throw new Error('Bạn ấy vừa chốt xong rồi.')
  if (p.the[den]) throw new Error('Bạn ấy vừa nhận thẻ của một bạn khác rồi.')
  if (p.tinHieu[den] !== 'can_tiep_suc') throw new Error('Bạn ấy chưa bật tín hiệu "cần tiếp sức".')
}
async function theChoGhe(env: Env, p: PhongDoan, ma: string, ghe: number): Promise<{ q: PrivateQuestion | null; the: TheGoiY[] }> {
  const ref = p.nguoi[ghe]?.cau[chiSoCau(p.chang!.hiep)], q = ref ? await cauRieng(env, ref) : null
  return { q, the: q ? soanThe(q, ma) : [] }
}
const ghiLuotTiepSuc = (env: Env, ma: string, hiep: number, den: string, tu: string, the: string, now: number) =>
  env.DB.prepare('INSERT OR IGNORE INTO doan_tiep_suc(ma_chang,hiep,den_sbd,tu_sbd,the,luc) VALUES(?,?,?,?,?,?)').bind(ma, hiep, den, tu, the, iso(now)).run().catch(() => { /* sổ phụ: lỗi ghi không làm hỏng trận */ })

// ───────────────────────── Bộ lệnh /game-v2/doan-* ─────────────────────────
export async function doanAction(env: Env, sbd: string, p: Profile, action: string, b: Row, goiGame: GoiGame): Promise<Record<string, unknown>> {
  if (!await doanMoCho(env, sbd)) throw new Error(LOI_CHUA_MO)
  try { return await chay(env, sbd, p, action, b, goiGame) } catch (e) {
    if (e instanceof Error && /no such table: doan_/i.test(e.message)) throw new Error('Đoàn Hộ Tống chưa mở trên máy chủ. Em quay lại sau nhé.')
    throw e
  }
}

async function chay(env: Env, sbd: string, hoSo: Profile, action: string, b: Row, goiGame: GoiGame): Promise<Record<string, unknown>> {
  const now = Date.now()
  const timDangDo = () => env.DB.prepare(`SELECT l.ma_chang FROM doan_luot l JOIN doan_chang c ON c.ma=l.ma_chang
      WHERE l.sbd=? AND l.ket_luc IS NULL AND c.trang_thai IN ('sanh','dang_di') AND c.tao_luc>? ORDER BY l.vao_luc DESC LIMIT 1`).bind(sbd, iso(now - PHONG_HET_HAN_MS)).first<{ ma_chang: string }>()
  if (action === 'doan-sanh') {
    // Sảnh hằng ngày: vé, chuỗi/rương, Đoàn lớp, Trùm lớp. Chưa chạy migration bước 5 → `sanh:null`, giao diện giữ các ô "SẮP MỞ".
    await env.DB.prepare("DELETE FROM doan_ve_so WHERE sbd=? AND loai='tieu' AND ma_nguon IN (SELECT ma FROM doan_chang WHERE trang_thai IN ('sanh','huy') AND tao_luc<?)").bind(sbd, iso(now - PHONG_HET_HAN_MS)).run().catch(() => { /* chưa có sổ vé */ })
    const homNay = ngayVn(iso(now)), pet = Math.max(0, PETS.findIndex(x => x.id === hoSo.pet)), sanh = await docSanh(env, sbd, now)
    return { ok: true, sanh, anThach: anChoSanh(await docAnThach(env, sbd, homNay), pet), banDongHanh: await goiYBanDongHanh(env, sbd, sanh?.lop ?? '', homNay, tenGoi), dangDo: (await timDangDo())?.ma_chang ?? null }
  }
  if (action === 'doan-hien-thi') {
    // Hợp đồng hiển thị NGOÀI game (docs/hop-dong-doan-hien-thi-2109.md): hào quang + danh hiệu của chính em.
    return { ok: true, hienThi: await docHienThi(env, sbd, now, ngayVn(iso(now))) }
  }
  if (action === 'doan-mo') {
    const dangDo = await timDangDo()
    if (dangDo) return chay(env, sbd, hoSo, 'doan-xem', { ...b, ma: dangDo.ma_chang }, goiGame)
    const toi = await taoNguoi(env, sbd, hoSo, b, goiGame, now), ma = 'DH' + hex(4)
    await quaCongVe(env, sbd, ma, now) // chặng đầu ngày miễn phí; chặng thêm trừ 1 vé; hết vé → lời chỉ cách kiếm vé
    const phong: PhongDoan = { kind: 'doan-phong', chu: sbd, taoLuc: now, nguoi: [toi], chang: null, hiepLuc: 0, nop: {}, nopY: {}, tinHieu: {}, the: {}, daGiup: [], choGhi: [], trum: {}, giaoY: {}, ketLuc: null }
    if (b.cheDo !== 'phong') { Object.assign(phong, await chonCauTrum(env, ma, phong.nguoi, now)); batDau(phong, ma, now) }
    await env.DB.batch([
      env.DB.prepare('INSERT INTO doan_chang(ma,json,chu,trang_thai,tao_luc) VALUES(?,?,?,?,?)').bind(ma, JSON.stringify(phong), sbd, phong.chang ? 'dang_di' : 'sanh', iso(now)),
      env.DB.prepare('INSERT INTO doan_luot(ma_chang,sbd,ngay_vn,lop,ghe,vao_luc) VALUES(?,?,?,?,0,?)').bind(ma, sbd, ngayVn(iso(now)), toi.lop, iso(now)),
    ])
    return khungNhin(env, ma, phong, 0, sbd, now, b)
  }

  const ma = String(b.ma ?? '').trim().toUpperCase()
  let toiMoi: NguoiDoan | null = null // mở phiên câu MỘT lần dù phải ghi lại phòng nhiều lượt
  // Mọi lệnh còn lại: đọc → tiến hiệp nếu tới lúc → áp lệnh → ghi có khoá lạc quan; đụng nhau thì đọc lại và làm lại (các bước đều lặp lại an toàn).
  for (let lan = 0; lan < 6; lan++) {
    const { phong, revision } = await docPhong(env, ma)
    if (now - phong.taoLuc > PHONG_HET_HAN_MS && !phong.chang?.ketThuc) throw new Error('Chặng đã hết hạn. Em mở chặng mới nhé.')
    let i = phong.nguoi.findIndex(n => n.sbd === sbd)
    let doi = tienHanh(phong, now)
    let kem: Record<string, unknown> = {}
    const sauLuu: (() => Promise<unknown>)[] = [] // việc phụ chỉ làm khi phòng đã lưu xong (ghi sổ tiếp sức, EXP tiếp sức)

    if (action === 'doan-vao') {
      if (i < 0) {
        if (phong.chang || phong.nguoi.length >= SO_GHE_TOI_DA) throw new Error('Đoàn đã lên đường hoặc đã đủ bốn bạn.')
        const khac = await timDangDo()
        if (khac && khac.ma_chang !== ma) throw new Error('Em đang ở một đoàn khác. Em rời đoàn ấy trước rồi vào đoàn này nhé.')
        const toi = toiMoi ??= await taoNguoi(env, sbd, hoSo, b, goiGame, now)
        await quaCongVe(env, sbd, ma, now)
        phong.nguoi.push(toi); i = phong.nguoi.length - 1; doi = true
        if (!await luuPhong(env, ma, phong, revision)) continue
        await env.DB.prepare('INSERT OR IGNORE INTO doan_luot(ma_chang,sbd,ngay_vn,lop,ghe,vao_luc) VALUES(?,?,?,?,?,?)').bind(ma, sbd, ngayVn(iso(now)), toi.lop, i, iso(now)).run()
        return khungNhin(env, ma, phong, revision + 1, sbd, now, b)
      }
    } else if (i < 0) throw new Error('Em chưa ở trong đoàn này.')
    else if (action === 'doan-xem') { /* chỉ xem */ }
    else if (action === 'doan-bat-dau') {
      if (phong.chu !== sbd) throw new Error('Chỉ bạn mở đoàn mới cho đoàn lên đường được.')
      if (!phong.chang) { Object.assign(phong, await chonCauTrum(env, ma, phong.nguoi, now)); batDau(phong, ma, now); doi = true }
    } else if (action === 'doan-roi') {
      if (!phong.chang) {
        phong.nguoi.splice(i, 1); if (phong.chu === sbd) phong.chu = phong.nguoi[0]?.sbd ?? sbd
        if (!await luuPhong(env, ma, phong, revision)) continue
        await env.DB.prepare('DELETE FROM doan_luot WHERE ma_chang=? AND sbd=? AND ket_luc IS NULL').bind(ma, sbd).run()
        await hoanVe(env, sbd, ma) // chưa lên đường mà rời → hoàn vé
        return { ok: true, daRoi: true }
      }
      if (!phong.chang.ketThuc && !phong.chang.ghe[i]!.roi) { phong.chang = roiTran(phong.chang, sbd); delete phong.nop[i]; tienHanh(phong, now); doi = true }
      if (doi && !await luuPhong(env, ma, phong, revision)) continue
      await env.DB.prepare('UPDATE doan_luot SET ket_luc=? WHERE ma_chang=? AND sbd=? AND ket_luc IS NULL').bind(iso(now), ma, sbd).run()
      return { ok: true, daRoi: true }
    } else if (action === 'doan-tin-hieu') {
      const t = String(b.tinHieu ?? '')
      if (!phong.chang || phong.chang.ketThuc || now < phong.hiepLuc) throw new Error('Hiệp chưa mở.')
      if (t === '') delete phong.tinHieu[i]
      else if (!(TIN_HIEU as readonly string[]).includes(t)) throw new Error('Chỉ dùng các tín hiệu có sẵn.')
      else if (t === 'can_tiep_suc') {
        const c = phong.chang
        if (hiepLaTrum(c.hiep)) throw new Error('Hiệp trùm cả đội bàn chung, không dùng thẻ tiếp sức.')
        if (phong.nop[i]) throw new Error('Em đã chốt đòn của hiệp này.')
        if (phong.the[i]) throw new Error('Hiệp này em đã nhận một thẻ rồi.')
        if (c.ghe[i]!.daNhanTiepSuc >= NHAN_TIEP_SUC_TOI_DA) throw new Error(`Em đã dùng hết ${NHAN_TIEP_SUC_TOI_DA} lần được tiếp sức của chặng này. Câu này em tự làm nhé.`)
        const { the } = await theChoGhe(env, phong, ma, i)
        if (!the.length) throw new Error('Câu này chưa có thẻ gợi ý nào gửi được. Em tự làm nhé.')
        phong.tinHieu[i] = t
        // Không còn bạn THẬT nào khác trong đoàn (đi một mình, hoặc bạn đã rời) → bạn máy tiếp sức ngay, thẻ rút tất định.
        const may = c.ghe.findIndex(g => g.laMay || g.roi)
        if (may >= 0 && !phong.daGiup.includes(may) && gheNguoi(phong).every(x => x.i === i)) {
          const chon = the[hashSeed(`${ma}|${c.hiep}|${i}|may`) % the.length]!
          phong.the[i] = { tu: may, ...chon }; phong.daGiup.push(may); delete phong.tinHieu[i]
          sauLuu.push(() => ghiLuotTiepSuc(env, ma, c.hiep, sbd, 'may', chon.loai, now))
        }
      } else phong.tinHieu[i] = t
      doi = true
    } else if (action === 'doan-the-goi-y') {
      // Người tiếp sức xem: thân câu rút gọn của bạn + TÊN các thẻ phát được. Không có phương án, không có gì bạn đã chọn, không có nội dung thẻ.
      const den = Number(b.den); kiemGiup(phong, i, den, now)
      const { q, the } = await theChoGhe(env, phong, ma, den), g = phong.chang!.ghe[den]!
      kem = { goiY: { den, ten: g.ten, pet: g.pet, cap: phong.nguoi[den]!.cap, tenDang: q?.tenDang ?? '', de: q ? deRutGon(q) : '', the: the.map(t => ({ loai: t.loai, ...MO_TA_THE[t.loai] })) } }
    } else if (action === 'doan-tiep-suc') {
      const den = Number(b.den), c = phong.chang
      if (c && Number(b.hiep) !== c.hiep) throw new Error('Hiệp vừa kết thúc.')
      kiemGiup(phong, i, den, now)
      const chon = (await theChoGhe(env, phong, ma, den)).the.find(t => t.loai === (b.the as LoaiThe))
      if (!chon) throw new Error('Thẻ này không dùng được cho câu của bạn. Em chọn thẻ khác nhé.')
      phong.the[den] = { tu: i, ...chon }; phong.daGiup.push(i); delete phong.tinHieu[den]; doi = true
      const hiep = c!.hiep, denSbd = phong.nguoi[den]!.sbd
      sauLuu.push(() => ghiLuotTiepSuc(env, ma, hiep, denSbd, sbd, chon.loai, now))
      // EXP tiếp sức do Code 3 giữ sổ (+3, tối đa 5 lần/ngày, khoá theo mã lượt nên bấm lại không cộng đôi). Game chỉ hiển thị theo số trả về.
      sauLuu.push(async () => { const r = await ghiTiepSuc(env, sbd, now, `${ma}|${hiep}|${den}`); kem = { ...kem, expTiepSuc: { bat: r.bat, exp: r.exp, conLai: r.conLai } } })
    } else if (action === 'doan-nop') {
      const c = phong.chang
      if (!c || c.ketThuc) throw new Error('Chặng chưa bắt đầu hoặc đã kết thúc.')
      if (now < phong.hiepLuc) throw new Error('Hiệp chưa mở. Em chờ đếm ngược nhé.')
      if (Number(b.hiep) !== c.hiep) throw new Error('Hiệp vừa kết thúc. Em làm câu của hiệp mới nhé.')
      const hanhDong = String(b.hanhDong ?? '') as HanhDong
      kiemHanhDong(c, i, hanhDong)
      if (c.ghe[i]!.roi) throw new Error('Em đã rời chặng này.')
      if (phong.nop[i]) throw new Error('Em đã chốt đòn của hiệp này.')
      const ref = phong.nguoi[i]!.cau[chiSoCau(c.hiep)]
      const boTrong = b.boTrong === true || !ref
      // Bỏ trống: không chấm, không ghi sổ, 0 sát thương — nhưng vẫn được Chắn (khiên yếu).
      if (boTrong && hanhDong !== 'chan') throw new Error('Bỏ trống thì em chỉ Chắn được. Muốn Đánh hay dùng Kỹ năng, em trả lời câu hỏi nhé.')
      let dung = false
      if (!boTrong) {
        // Đã nhận thẻ tiếp sức → `assisted:true`: máy chủ game KHÔNG ghi bằng chứng, KHÔNG thưởng mastery cho câu này (luật cũ giữ nguyên). Cờ do máy chủ quyết, không do máy em khai.
        const r = await goiGame(env, 'answer', danhDau({ token: b.token, session: phong.nguoi[i]!.phien, qid: ref!.qid, answer: b.answer, assisted: !!phong.the[i] }))
        dung = r.correct === true; kem = { ketQuaCau: ketQuaCau(r) }
      }
      phong.nop[i] = { dung, hanhDong, tuLam: !phong.the[i], boTrong, tiepSucBoi: phong.the[i]?.tu }
      delete phong.tinHieu[i]; tienHanh(phong, now); doi = true
    } else if (action === 'doan-nop-y') {
      const c = phong.chang, y = Number(b.y), chon = String(b.answer ?? '')
      if (!c || c.ketThuc || !hiepLaTrum(c.hiep) || now < phong.hiepLuc) throw new Error('Chưa tới hiệp trùm.')
      if (Number(b.hiep) !== c.hiep) throw new Error('Hiệp trùm vừa kết thúc.')
      const ref = phong.trum[c.hiep]; if (!ref) throw new Error('Trùm này không có câu chung.')
      if (!Number.isInteger(y) || c.giaoY[y] !== i) throw new Error('Ý này do bạn khác giữ — em góp ý bằng lời, bạn ấy sẽ chốt.')
      if (!/^[DS]$/.test(chon)) throw new Error('Em chọn Đúng hoặc Sai.')
      if (phong.nopY[y] !== undefined) throw new Error('Em đã chốt ý này.')
      const q = await cauRieng(env, ref)
      if (!q) { phong.trum[c.hiep] = null } else phong.nopY[y] = q.correct[y] === chon
      tienHanh(phong, now); doi = true
    } else if (action === 'doan-loi-giai-trum') {
      // Lời giải câu chung chỉ mở SAU KHI hiệp trùm ấy đã giải xong (mọi ý đã chốt hoặc hết giờ).
      const hiep = Number(b.hiep), ref = phong.trum[hiep]
      if (!phong.chang?.lichSu.some(h => h.hiep === hiep && h.laTrum)) throw new Error('Hiệp trùm này chưa kết thúc.')
      const q = ref ? await cauRieng(env, ref) : null
      kem = { loiGiaiTrum: q ? { hiep, de: publicQuestion(q), answer: q.correct, solution: q.solution, solutionImages: q.hinhAnh.filter(h => h.viTri === 'sau_loi_giai') } : null }
    } else throw new Error('Không có lệnh Đoàn Hộ Tống này.')

    if (doi && !await luuPhong(env, ma, phong, revision)) continue
    for (const viec of sauLuu) await viec()
    return { ...await khungNhin(env, ma, phong, doi ? revision + 1 : revision, sbd, now, b), ...kem }
  }
  throw new Error('Đoàn đang rất đông thao tác. Em bấm lại giúp thầy nhé.')
}
