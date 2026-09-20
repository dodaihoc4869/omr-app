// ĐOÀN HỘ TỐNG — bước 5: MỒI HẰNG NGÀY. Vé hộ tống · Đoàn lớp theo mùa 4 tuần, 30 trạm · rương chuỗi 3/7/14 · Trùm lớp Chủ nhật 20:00–20:20.
//
// Nguyên tắc: (1) vé CHỈ sinh từ việc học — đọc sổ EXP của Code 3 (`docThanhTichNgay`), KHÔNG tự tính lại "đạt ngày" hay "lô đúng nhịp";
// (2) mọi khoản là một dòng trong sổ vé với KHOÁ IDEMPOTENT → nạp lại hai lần không cộng trùng; (3) phần thưởng "ngẫu nhiên" tất định theo
// (sbd, ngày, mùa); (4) bạn máy không bao giờ được tính: mọi con số đọc từ `doan_luot`, nơi chỉ EM THẬT có dòng; (5) không bao giờ ném lỗi ra
// ngoài vì thiếu bảng của bước 5 — khi đó game vẫn chạy với luật "mỗi ngày một chặng miễn phí".
import type { Env, D1PreparedStatement } from './kieu'
import { hashSeed } from '../../src/lib/exam-shuffle'
import { ngayVn } from './su-kien-hoc'
import { capNhatExp, docThanhTichNgay } from './exp-d1'

type Row = Record<string, unknown>
export const SO_TRAM = 30
export const MOC_TRAM: readonly number[] = [10, 20, 30]
export const TEN_MOC: Record<number, string> = { 10: 'Rừng Xúc Tác', 20: 'Hồ Cân Bằng', 30: 'Thành Pha Lê' }
export const NGAY_MOI_MUA = 28
/** Mục tiêu cả mùa: mỗi em khoảng 3 chặng thắng mỗi tuần → 12 chặng/em/mùa chia đều cho 30 trạm. */
export const CHANG_THANG_MOI_EM_MOI_MUA = 12
export const MOC_RUONG: readonly number[] = [3, 7, 14]
export const VE_DAT_NGAY = 2, VE_LO_DUNG_NHIP = 1
export const TRUM_LOP = { thu: 0, gioBatDau: 20, phutKeoDai: 20, mauMoiEm: 100 } // Chủ nhật 20:00–20:20 giờ VN
export const LOI_HET_VE = 'Hôm nay em đã đi chặng miễn phí rồi và em chưa có vé. Vé chỉ kiếm bằng học: đạt nhiệm vụ ngày +2 vé, xong một lô bài tập đúng nhịp +1 vé. Làm xong nhiệm vụ hôm nay là có vé đi tiếp.'

const MOT_NGAY = 86_400_000, GIO_VN = 7 * 3_600_000
const iso = (ms: number) => new Date(ms).toISOString()
const soNgay = (ngay: string) => Math.floor(Date.parse(`${ngay}T00:00:00Z`) / MOT_NGAY)
const ngayTu = (so: number) => new Date(so * MOT_NGAY).toISOString().slice(0, 10)

// ───────────────────────── Hàm thuần ─────────────────────────
export interface MuaDoan { khoa: string; so: number; tuNgay: string; denNgay: string; conNgay: number }
/** Mùa 4 tuần. Mốc bắt đầu = ngày ghi trong mùa game (`<YYYY-MM-DD>-mua-N`, Code 3 ghi lúc reset) — KHÔNG gắn cứng ngày nào trong mã. */
export function muaHienTai(seasonId: string, homNay: string): MuaDoan {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(seasonId)
  // Chưa có mùa game (chưa reset): mùa tính theo khối 28 ngày kể từ một thứ Hai cố định của lịch (1970-01-05).
  const goc = m && soNgay(m[1]!) <= soNgay(homNay) ? soNgay(m[1]!) : 4 + Math.floor((soNgay(homNay) - 4) / NGAY_MOI_MUA) * NGAY_MOI_MUA
  const so = Math.floor((soNgay(homNay) - goc) / NGAY_MOI_MUA) + 1, tu = goc + (so - 1) * NGAY_MOI_MUA
  return { khoa: `${seasonId || 'chua-reset'}|m${so}|${ngayTu(tu)}`, so, tuNgay: ngayTu(tu), denNgay: ngayTu(tu + NGAY_MOI_MUA - 1), conNgay: tu + NGAY_MOI_MUA - soNgay(homNay) }
}
/** Số chặng thắng của cả lớp cần cho MỘT trạm (theo sĩ số, tối thiểu 2 để lớp "Tự do" vài em không về đích trong một buổi). */
export const changMoiTram = (siSo: number) => Math.max(2, Math.ceil(Math.max(1, siSo) * CHANG_THANG_MOI_EM_MOI_MUA / SO_TRAM))
export const tramCuaLop = (soChangThang: number, siSo: number) => Math.min(SO_TRAM, Math.floor(soChangThang / changMoiTram(siSo)))
/** Chuỗi ngày liên tiếp có đi chặng, tính tới hôm nay; hôm nay chưa đi thì chuỗi tới hôm qua vẫn còn sống. */
export function chuoiNgay(dsNgay: readonly string[], homNay: string): { ngay: number; daDiHomNay: boolean } {
  const co = new Set(dsNgay), h = soNgay(homNay), daDiHomNay = co.has(homNay)
  let n = 0
  for (let d = daDiHomNay ? h : h - 1; co.has(ngayTu(d)); d--) n++
  return { ngay: n, daDiHomNay }
}
/** Rương chuỗi: 3 ngày +1 vé · 7 ngày +2 · 14 ngày +3; "rương may mắn" +1 vé nữa, rút TẤT ĐỊNH theo (sbd, ngày, mùa). */
export function quaRuong(sbd: string, ngay: string, mua: string, moc: number): { ve: number; mayMan: boolean } {
  const mayMan = hashSeed(`${sbd}|${ngay}|${mua}|ruong|${moc}`) % 3 === 0
  return { ve: MOC_RUONG.indexOf(moc) + 1 + (mayMan ? 1 : 0), mayMan }
}
/** Khung Trùm lớp quanh thời điểm `now`: đang mở không, Chủ nhật nào, còn bao lâu nữa mở. Mọi thứ theo GIỜ VIỆT NAM. */
export function khungTrumLop(now: number): { dangMo: boolean; chuNhat: string; moSauMs: number; conMs: number } {
  const vn = new Date(now + GIO_VN), thu = vn.getUTCDay()
  const dauNgayVn = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) - GIO_VN
  let mo = dauNgayVn + ((TRUM_LOP.thu - thu + 7) % 7) * MOT_NGAY + TRUM_LOP.gioBatDau * 3_600_000
  const dong = () => mo + TRUM_LOP.phutKeoDai * 60_000
  if (now >= dong()) mo += 7 * MOT_NGAY
  return { dangMo: now >= mo && now < dong(), chuNhat: ngayVn(iso(mo)), moSauMs: Math.max(0, mo - now), conMs: now >= mo ? dong() - now : 0 }
}

// ───────────────────────── D1 ─────────────────────────
const thieuBang = (e: unknown) => e instanceof Error && /no such table/i.test(e.message)
async function docMua(env: Env, homNay: string): Promise<MuaDoan> {
  let id = ''
  try { const r = await env.DB.prepare("SELECT json FROM game_v2_settings WHERE key='season'").first<{ json: string }>(); id = r ? String((JSON.parse(r.json) as { id?: unknown }).id ?? '') : '' } catch { /* chưa có bảng mùa */ }
  return muaHienTai(id, homNay)
}
const themVe = (env: Env, khoa: string, sbd: string, ngay: string, loai: string, so: number, maNguon: string | null, now: number): D1PreparedStatement =>
  env.DB.prepare('INSERT OR IGNORE INTO doan_ve_so(khoa,sbd,ngay_vn,loai,so,ma_nguon,luc) VALUES(?,?,?,?,?,?,?)').bind(khoa, sbd, ngay, loai, so, maNguon, iso(now))
export async function soVe(env: Env, sbd: string): Promise<number | null> {
  try { const r = await env.DB.prepare('SELECT COALESCE(SUM(so),0) n FROM doan_ve_so WHERE sbd=?').bind(sbd).first<{ n: number }>(); return Math.max(0, Number(r?.n) || 0) } catch (e) { if (thieuBang(e)) return null; throw e }
}

/** Phát vé từ việc học: đọc sổ EXP (hôm nay + hôm qua, vì khoản có thể được ghi bù muộn). Trả số vé MỚI phát. Không ném lỗi. */
export async function dongBoVe(env: Env, sbd: string, now: number): Promise<number> {
  try {
    await capNhatExp(env, sbd, now)
    const lenh: D1PreparedStatement[] = []
    for (const ngay of [ngayVn(iso(now)), ngayVn(iso(now - MOT_NGAY))]) {
      const t = await docThanhTichNgay(env, sbd, now, ngay)
      if (!t.bat) continue
      if (t.datNgay) lenh.push(themVe(env, `${sbd}|dat|${ngay}`, sbd, ngay, 'dat', VE_DAT_NGAY, `dat|${ngay}`, now))
      for (const lo of t.loDungNhip) lenh.push(themVe(env, `${sbd}|${lo.khoa}`, sbd, ngay, 'lo', VE_LO_DUNG_NHIP, lo.khoa, now))
    }
    if (!lenh.length) return 0
    const r = await env.DB.batch(lenh)
    return r.reduce((s, x) => s + (x.meta.changes ? 1 : 0), 0)
  } catch { return 0 }
}

/** Em có đang ở một chặng ĐÃ LÊN ĐƯỜNG hôm nay không (chặng miễn phí đã dùng). Sảnh bỏ dở không tính. */
async function daDiHomNay(env: Env, sbd: string, homNay: string, truMa: string): Promise<boolean> {
  const r = await env.DB.prepare("SELECT COUNT(*) n FROM doan_luot l JOIN doan_chang c ON c.ma=l.ma_chang WHERE l.sbd=? AND l.ngay_vn=? AND l.ma_chang<>? AND c.trang_thai IN ('dang_di','xong')").bind(sbd, homNay, truMa).first<{ n: number }>()
  return (r?.n ?? 0) > 0
}
/**
 * CỔNG VÉ lúc em mở / vào một đoàn: chặng đầu ngày (giờ VN) miễn phí; chặng thêm tốn 1 vé, trừ NGAY (khoá `tieu|<mã chặng>` nên bấm lại không trừ đôi).
 * Hết vé → ném lời tiếng Việt chỉ cách kiếm vé. Thiếu bảng vé (chưa chạy migration bước 5) → chỉ cho chặng miễn phí.
 */
export async function quaCongVe(env: Env, sbd: string, maChang: string, now: number): Promise<{ mienPhi: boolean }> {
  const homNay = ngayVn(iso(now))
  if (!await daDiHomNay(env, sbd, homNay, maChang)) return { mienPhi: true }
  await dongBoVe(env, sbd, now)
  const ve = await soVe(env, sbd)
  const daTru = ve === null ? null : await env.DB.prepare('SELECT 1 x FROM doan_ve_so WHERE khoa=?').bind(`${sbd}|tieu|${maChang}`).first()
  if (daTru) return { mienPhi: false }
  if (!ve) throw new Error(LOI_HET_VE)
  await themVe(env, `${sbd}|tieu|${maChang}`, sbd, homNay, 'tieu', -1, maChang, now).run()
  return { mienPhi: false }
}
/** Rời sảnh trước khi đoàn lên đường → hoàn vé (xoá dòng trừ). */
export const hoanVe = (env: Env, sbd: string, maChang: string) => env.DB.prepare('DELETE FROM doan_ve_so WHERE khoa=?').bind(`${sbd}|tieu|${maChang}`).run().then(() => {}, () => {})

export interface DoanLopXem { lop: string; tram: number; tongTram: number; changThang: number; changMoiTram: number; conChangToiTramKe: number; mocKe: number | null; tenMocKe: string | null; conTramToiMoc: number | null; gopSucHomNay: number; siSo: number }
async function docDoanLop(env: Env, lop: string, mua: MuaDoan, homNay: string): Promise<DoanLopXem> {
  const si = await env.DB.prepare("SELECT COUNT(*) n FROM hoc_sinh WHERE COALESCE(lop,'')=? AND COALESCE(trang_thai,'')<>'khoa'").bind(lop).first<{ n: number }>()
  const r = await env.DB.prepare('SELECT COUNT(*) thang, COUNT(DISTINCT CASE WHEN ngay_vn=? THEN sbd END) homNay FROM doan_luot WHERE lop=? AND thang=1 AND ngay_vn BETWEEN ? AND ?').bind(homNay, lop, mua.tuNgay, mua.denNgay).first<{ thang: number; homNay: number }>()
  const siSo = Math.max(1, si?.n ?? 1), thang = r?.thang ?? 0, moi = changMoiTram(siSo), tram = tramCuaLop(thang, siSo)
  const mocKe = MOC_TRAM.find(m => m > tram) ?? null
  return { lop, tram, tongTram: SO_TRAM, changThang: thang, changMoiTram: moi, conChangToiTramKe: tram >= SO_TRAM ? 0 : moi - (thang % moi), mocKe, tenMocKe: mocKe ? TEN_MOC[mocKe]! : null, conTramToiMoc: mocKe ? mocKe - tram : null, gopSucHomNay: r?.homNay ?? 0, siSo }
}

export interface SanhXem {
  lop: string; tenDoan: string; mua: { so: number; conNgay: number }; ve: number | null; mienPhiHomNay: boolean
  chuoi: { ngay: number; daDiHomNay: boolean; mocKe: number | null; conNgay: number | null }
  doanLop: DoanLopXem
  trumLop: { dangMo: boolean; chuNhat: string; moSauMs: number; conMs: number; daGop: number; mucTieu: number; daHa: boolean }
  quaMoi: { loai: 'dat' | 'lo' | 'ruong' | 'moc' | 'trum'; ve: number; ghiChu: string }[]
}
/** SẢNH: đồng bộ vé từ việc học, mở rương / quà mốc còn nợ (idempotent), rồi trả mọi con số — tất cả ĐỌC từ sổ, không số nào do máy em khai. */
export async function docSanh(env: Env, sbd: string, now: number): Promise<SanhXem | null> {
  try {
    const homNay = ngayVn(iso(now)), mua = await docMua(env, homNay)
    const hs = await env.DB.prepare('SELECT lop FROM hoc_sinh WHERE sbd=?').bind(sbd).first<{ lop: string | null }>()
    const lop = String(hs?.lop ?? '')
    const truoc = new Set(((await env.DB.prepare('SELECT khoa FROM doan_ve_so WHERE sbd=? AND ngay_vn>=?').bind(sbd, ngayVn(iso(now - 2 * MOT_NGAY))).all<{ khoa: string }>()).results ?? []).map(x => x.khoa))
    await dongBoVe(env, sbd, now)

    const luot = (await env.DB.prepare('SELECT DISTINCT ngay_vn FROM doan_luot WHERE sbd=? AND thang IS NOT NULL AND ngay_vn>=?').bind(sbd, ngayVn(iso(now - 40 * MOT_NGAY))).all<{ ngay_vn: string }>()).results ?? []
    const chuoi = chuoiNgay(luot.map(x => x.ngay_vn), homNay)
    const doanLop = await docDoanLop(env, lop, mua, homNay)
    const daGopMua = ((await env.DB.prepare('SELECT COUNT(*) n FROM doan_luot WHERE sbd=? AND thang=1 AND ngay_vn BETWEEN ? AND ?').bind(sbd, mua.tuNgay, mua.denNgay).first<{ n: number }>())?.n ?? 0) > 0
    const khung = khungTrumLop(now), chuNhatXet = khung.dangMo || khung.moSauMs > 6 * MOT_NGAY ? (khung.dangMo ? khung.chuNhat : ngayVn(iso(Date.parse(`${khung.chuNhat}T12:00:00+07:00`) - 7 * MOT_NGAY))) : khung.chuNhat
    const gop = await env.DB.prepare('SELECT COALESCE(SUM(sat_thuong),0) tong, COALESCE(SUM(CASE WHEN sbd=? THEN 1 ELSE 0 END),0) cuaEm FROM doan_trum_lop WHERE lop=? AND chu_nhat=?').bind(sbd, lop, chuNhatXet).first<{ tong: number; cuaEm: number }>()
    const mucTieu = doanLop.siSo * TRUM_LOP.mauMoiEm, daHa = (gop?.tong ?? 0) >= mucTieu

    const lenh: D1PreparedStatement[] = []
    if (chuoi.daDiHomNay && MOC_RUONG.includes(chuoi.ngay)) lenh.push(themVe(env, `${sbd}|ruong|${chuoi.ngay}|${homNay}`, sbd, homNay, 'ruong', quaRuong(sbd, homNay, mua.khoa, chuoi.ngay).ve, `ruong|${chuoi.ngay}`, now))
    if (daGopMua) for (const m of MOC_TRAM) if (doanLop.tram >= m) lenh.push(themVe(env, `${sbd}|moc|${mua.khoa}|${m}`, sbd, homNay, 'moc', 1, `moc|${m}`, now))
    if (daHa && (gop?.cuaEm ?? 0) > 0) lenh.push(themVe(env, `${sbd}|trum|${mua.khoa}|${chuNhatXet}`, sbd, homNay, 'trum', 1, `trum|${chuNhatXet}`, now))
    if (lenh.length) await env.DB.batch(lenh)

    const moi = ((await env.DB.prepare('SELECT khoa,loai,so,ma_nguon FROM doan_ve_so WHERE sbd=? AND ngay_vn>=? AND so>0').bind(sbd, ngayVn(iso(now - 2 * MOT_NGAY))).all<Row>()).results ?? []).filter(x => !truoc.has(String(x.khoa)))
    const ghiChu = (x: Row) => x.loai === 'dat' ? 'Em đạt nhiệm vụ ngày' : x.loai === 'lo' ? 'Em xong một lô bài tập đúng nhịp' : x.loai === 'ruong' ? `Rương chuỗi ${String(x.ma_nguon).split('|')[1]} ngày` : x.loai === 'moc' ? `Cả lớp tới ${TEN_MOC[Number(String(x.ma_nguon).split('|')[1])] ?? 'mốc mới'}` : 'Lớp em đã hạ Trùm lớp'
    const mocKe = MOC_RUONG.find(m => m > chuoi.ngay) ?? null
    return {
      lop, tenDoan: `Đoàn Hộ Tống ${lop || 'Tự do'}`, mua: { so: mua.so, conNgay: mua.conNgay }, ve: await soVe(env, sbd), mienPhiHomNay: !await daDiHomNay(env, sbd, homNay, ''),
      chuoi: { ...chuoi, mocKe, conNgay: mocKe ? mocKe - chuoi.ngay : null }, doanLop,
      trumLop: { dangMo: khung.dangMo, chuNhat: khung.chuNhat, moSauMs: khung.moSauMs, conMs: khung.conMs, daGop: gop?.tong ?? 0, mucTieu, daHa },
      quaMoi: moi.map(x => ({ loai: x.loai as SanhXem['quaMoi'][number]['loai'], ve: Number(x.so), ghiChu: ghiChu(x) })),
    }
  } catch (e) { if (thieuBang(e)) return null; throw e }
}

/** KẾT CHẶNG (em thật, chặng THẮNG): trạm của lớp trước → sau chặng này, em là bạn thứ mấy góp sức hôm nay; đang khung Trùm lớp thì ghi đóng góp. */
export async function ketChangChoLop(env: Env, sbd: string, lop: string, maChang: string, thang: boolean, satThuong: number, ketLuc: number): Promise<{ tramTruoc: number; tramSau: number; tongTram: number; banThu: number; siSo: number; conTramToiMoc: number | null; tenMocKe: string | null; trumLop: number | null } | null> {
  try {
    const homNay = ngayVn(iso(ketLuc)), mua = await docMua(env, homNay), lopXem = await docDoanLop(env, lop, mua, homNay)
    const khung = khungTrumLop(ketLuc)
    let trumLop: number | null = null
    if (thang && khung.dangMo && satThuong > 0) { await env.DB.prepare('INSERT OR IGNORE INTO doan_trum_lop(khoa,lop,chu_nhat,sbd,sat_thuong,luc) VALUES(?,?,?,?,?,?)').bind(`${maChang}|${sbd}`, lop, khung.chuNhat, sbd, satThuong, iso(ketLuc)).run(); trumLop = satThuong }
    // Dòng sổ lượt của chặng này đã chốt (thang=1) nên `lopXem` là con số SAU; trừ đúng một chặng thắng để ra con số TRƯỚC.
    const tramTruoc = thang ? tramCuaLop(Math.max(0, lopXem.changThang - 1), lopXem.siSo) : lopXem.tram
    const thu = thang ? await env.DB.prepare('SELECT COUNT(DISTINCT sbd) n FROM doan_luot WHERE lop=? AND thang=1 AND ngay_vn=? AND (ket_luc < (SELECT ket_luc FROM doan_luot WHERE ma_chang=? AND sbd=?) OR sbd=?)').bind(lop, homNay, maChang, sbd, sbd).first<{ n: number }>() : null
    return { tramTruoc, tramSau: lopXem.tram, tongTram: SO_TRAM, banThu: thu?.n ?? 0, siSo: lopXem.siSo, conTramToiMoc: lopXem.conTramToiMoc, tenMocKe: lopXem.tenMocKe, trumLop }
  } catch (e) { if (thieuBang(e)) return null; throw e }
}
