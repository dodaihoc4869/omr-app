// CỬA HÀNG PHỤ KIỆN THẦN THÚ — 5 lệnh dưới /game-v2/… (hợp đồng docs/hop-dong-shop-phu-kien-2109.md; danh mục src/lib/phu-kien-danh-muc.ts). Cờ `cau_hinh.shop_phu_kien` mặc định TẮT.
//   vang-xem · vang-doi (đổi EXP thừa ở ống nghiệm thành vàng) · shop-danh-sach · shop-mua · thu-mac-do
// Vàng KHÔNG nằm ở hồ sơ game: số dư = SUM(vang_so.so_vang) (sổ cái chỉ thêm dòng). Ống nghiệm = `wallet` của hồ sơ; đổi vàng trừ đúng số EXP ấy trong CÙNG MỘT lô với dòng sổ.
// Không đụng luật EXP, trần 120, thú ăn 200: chỉ trừ `wallet` và luôn giữ lại ≥ 200 EXP. Phụ kiện KHÔNG cộng chỉ số/EXP/vé/thứ hạng. Máy chủ quyết giá (giao diện gửi lại `giaThay`, lệch ⇒ gia_doi).
//
// NGUYÊN TỬ (mỗi lô D1 chạy trọn vẹn hoặc không chạy, không xen lệnh khác):
//   vang-doi: (a) INSERT sổ vàng NẾU hồ sơ còn ở đúng `revision` đã đọc và còn ≥ 200 EXP sau khi trừ; (b) UPDATE hồ sơ (trừ ống, revision+1) NẾU dòng sổ của CHÍNH lượt này (khoá + `luc`) có mặt.
//     Có ai ghi hồ sơ xen vào (revision đổi) ⇒ cả hai không làm gì ⇒ đọc lại, thử tối đa 3 lần. Khác bản phác của đề xuất: dòng sổ KHÔNG dựa vào "hồ sơ đang ở revision+1" (một lượt ghi hồ sơ của việc khác cũng làm revision+1 ⇒ có thể ghi vàng mà không trừ EXP).
//   shop-mua: (a) INSERT sở hữu NẾU chưa có dòng sổ mang khoá này, đủ vàng, và số cái đã bán < giới hạn; (b) INSERT sổ vàng (−giá) và (c) mặc món NẾU dòng sở hữu của CHÍNH lượt này có mặt. Hai em cùng mua cái cuối ⇒ lô sau thấy đủ số cái ⇒ het_suat.
// Bấm lặp (cùng khoaYeuCau) ⇒ đọc sổ trước: đã có ⇒ trả kết quả cũ `lapLai:true`, không ghi thêm.
import type { Env } from './kieu'
import type { Profile } from './game-v2'
import { DOT_MO_BAN, MUA_BAN, O_GAN, docMonPhuKien, monDangBan, type MonPhuKien, type OGanPhuKien } from '../../src/lib/phu-kien-danh-muc'
import { docAnThach } from './game-v2-doan-an'
import { docChuoiTruoc } from './exp-d1'
import { ngayVn } from './su-kien-hoc'

type Kq = Record<string, unknown>
export const LENH_SHOP: ReadonlySet<string> = new Set(['vang-xem', 'vang-doi', 'shop-danh-sach', 'shop-mua', 'thu-mac-do'])
/** EXP thần thú cần giữ lại ở ống nghiệm để ăn (luật hấp thụ 200/ngày). Đổi vàng không bao giờ xuống dưới mức này. */
export const GIU_LAI_EXP = 200
const KHOA_YEU_CAU = /^[A-Za-z0-9_-]{8,64}$/
/** Cửa sổ nhìn lại của chuỗi ngày cho cửa hàng: cửa sổ 7 ngày của kế hoạch ngày không bao giờ đạt "chuỗi 14 ngày" nên đọc CÙNG định nghĩa (ngày đạt liên tiếp, ngày nghỉ không đứt) với cửa sổ dài; điều kiện lớn nhất của danh mục là 30. */
export const SO_NGAY_CHUOI_SHOP = 45

const LOI: Record<string, string> = {
  tam_dong: 'Cửa hàng đang tạm đóng. Đồ em đã mua vẫn còn nguyên.',
  da_co: 'Em đã có món này rồi. Vào Tủ đồ để mặc.',
  gia_doi: 'Giá vừa thay đổi, em xem lại rồi mua nhé.',
  chua_co: 'Em chưa có món này nên chưa mặc được.',
  khong_co_mon: 'Cửa hàng không có món này. Em tải lại Cửa hàng rồi chọn lại nhé.',
  sap_mo: 'Món này sắp mở bán. Em ghé lại sau nhé.',
  sai_dau_vao: 'Có gì đó chưa đúng. Em tải lại trang rồi thử lại nhé.',
}
const loi = (ma: string, chu?: string): Kq => ({ ok: false, ma, loi: chu ?? LOI[ma] ?? LOI.sai_dau_vao })
const thieuBang = (e: unknown): boolean => /no such table/i.test(e instanceof Error ? e.message : String(e))
const nguyen = (v: unknown): number => Math.max(0, Math.floor(Number(v) || 0))
const conNgayAn = (ongNghiem: number): number => Math.floor(ongNghiem / GIU_LAI_EXP)

/** Cờ: `{"bat":true,"chiSbd":[…]?}`. Vắng / bat≠true / lỗi đọc ⇒ đóng. Có mảng `chiSbd` ⇒ chỉ các em trong mảng thấy cửa hàng mở (mảng rỗng ⇒ không ai). */
async function moCua(env: Env, sbd: string): Promise<boolean> {
  try {
    const r = await env.DB.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'shop_phu_kien'").first<{ gia_tri: string }>()
    if (!r?.gia_tri) return false
    const c = JSON.parse(r.gia_tri) as { bat?: unknown; chiSbd?: unknown }
    if (c.bat !== true) return false
    return Array.isArray(c.chiSbd) ? c.chiSbd.map(String).includes(sbd) : true
  } catch { return false }
}

async function docVang(env: Env, sbd: string): Promise<number> {
  const r = await env.DB.prepare('SELECT COALESCE(SUM(so_vang), 0) AS v FROM vang_so WHERE sbd = ?').bind(sbd).first<{ v: number }>()
  return Number(r?.v) || 0
}
interface DongSo { loai: string; so_vang: number; exp_tru: number; ma_mon: string | null }
const docSoKhoa = (env: Env, sbd: string, khoa: string) =>
  env.DB.prepare('SELECT loai, so_vang, exp_tru, ma_mon FROM vang_so WHERE sbd = ? AND khoa_yeu_cau = ?').bind(sbd, khoa).first<DongSo>()

/** Điều kiện học của em: chuỗi ngày ĐẠT nhiệm vụ ngày (cả hôm nay nếu đã đạt) + số ấn thạch sáng. */
async function docEmCo(env: Env, sbd: string, nowMs: number): Promise<{ chuoiNgay: number; anThachSang: number }> {
  const homNay = ngayVn(nowMs)
  const datHomNay = env.DB.prepare("SELECT 1 AS x FROM exp_so WHERE sbd = ? AND ngay_vn = ? AND loai = 'dat_ngay' LIMIT 1").bind(sbd, homNay).first().then((x) => !!x, () => false)
  const [truoc, dat, an] = await Promise.all([docChuoiTruoc(env, sbd, homNay, SO_NGAY_CHUOI_SHOP), datHomNay, docAnThach(env, sbd, homNay)])
  return { chuoiNgay: truoc + (dat ? 1 : 0), anThachSang: an.filter((a) => a.trangThai === 'sang').length }
}

async function docDangMac(env: Env, sbd: string): Promise<Record<OGanPhuKien, string | null>> {
  const ra = Object.fromEntries(O_GAN.map((o) => [o, null])) as Record<OGanPhuKien, string | null>
  const r = await env.DB.prepare('SELECT o_gan, ma_mon FROM phu_kien_dang_mac WHERE sbd = ?').bind(sbd).all<{ o_gan: string; ma_mon: string }>()
  for (const x of r.results ?? []) if ((O_GAN as readonly string[]).includes(x.o_gan)) ra[x.o_gan as OGanPhuKien] = String(x.ma_mon)
  return ra
}
/** Số cái ĐÃ BÁN của các món giới hạn số lượng (một truy vấn gộp, đi chỉ mục (ma_mon, mua)). */
async function docDaBan(env: Env, ds: readonly string[]): Promise<Map<string, number>> {
  const ra = new Map<string, number>()
  if (ds.length === 0) return ra
  const r = await env.DB.prepare('SELECT ma_mon, COUNT(*) AS n FROM phu_kien_so_huu WHERE mua = ? AND ma_mon IN (SELECT value FROM json_each(?)) GROUP BY ma_mon').bind(MUA_BAN, JSON.stringify(ds)).all<{ ma_mon: string; n: number }>()
  for (const x of r.results ?? []) ra.set(String(x.ma_mon), Number(x.n) || 0)
  return ra
}

/** Chữ ngắn cho trạng thái "chưa đủ điều kiện học" (null = đã đủ). */
function chuThieu(m: MonPhuKien, co: { chuoiNgay: number; anThachSang: number }): string | null {
  const thieuChuoi = m.canChuoiNgay !== null && co.chuoiNgay < m.canChuoiNgay
  const thieuAn = m.canAnThach !== null && co.anThachSang < m.canAnThach
  if (!thieuChuoi && !thieuAn) return null
  if (m.canChuoiNgay !== null) return `Cần chuỗi ${m.canChuoiNgay} ngày${m.canAnThach !== null ? ` + ${m.canAnThach} ấn thạch sáng` : ''}`
  return `Cần ${m.canAnThach} ấn thạch sáng`
}
/** Lời lỗi `chua_mo` (L3): nói điều em đang thiếu, kèm số em đang có. */
function loiChuaMo(m: MonPhuKien, co: { chuoiNgay: number; anThachSang: number }): string {
  if (m.canChuoiNgay !== null && co.chuoiNgay < m.canChuoiNgay) return `Món này cần chuỗi ${m.canChuoiNgay} ngày. Em đang chuỗi ${co.chuoiNgay} ngày.`
  return `Món này cần ${m.canAnThach} ấn thạch sáng. Em đang có ${co.anThachSang}.`
}

export async function shopAction(
  env: Env, sbd: string, p: Profile, revision: number, action: string, b: Record<string, unknown>,
  docLai: () => Promise<{ profile: Profile; revision: number }>, nowMs: number = Date.now(),
): Promise<Kq> {
  try {
    if (action === 'vang-xem') return await vangXem(env, sbd, p, nowMs)
    if (action === 'vang-doi') return await vangDoi(env, sbd, p, revision, b, docLai)
    if (action === 'shop-danh-sach') return await shopDanhSach(env, sbd, nowMs)
    if (action === 'shop-mua') return await shopMua(env, sbd, b, nowMs)
    return await thuMacDo(env, sbd, b)
  } catch (e) {
    // Chưa chạy migration (bảng chưa có) ⇒ coi như cửa hàng đóng, không ném lỗi kỹ thuật ra màn của em.
    if (thieuBang(e)) return action === 'vang-xem' ? { ok: true, bat: false } : loi(action === 'thu-mac-do' ? 'chua_co' : 'tam_dong')
    throw e
  }
}

async function vangXem(env: Env, sbd: string, p: Profile, nowMs: number): Promise<Kq> {
  if (!(await moCua(env, sbd))) return { ok: true, bat: false }
  const ongNghiem = nguyen(p.wallet)
  const [vang, co] = await Promise.all([docVang(env, sbd), docEmCo(env, sbd, nowMs)])
  return { ok: true, bat: true, vang, ongNghiem, giuLai: GIU_LAI_EXP, doiToiDa: Math.max(0, ongNghiem - GIU_LAI_EXP), ngayAn: conNgayAn(ongNghiem), chuoiNgay: co.chuoiNgay, anThachSang: co.anThachSang, mua: MUA_BAN }
}

async function vangDoi(env: Env, sbd: string, p0: Profile, revision0: number, b: Record<string, unknown>, docLai: () => Promise<{ profile: Profile; revision: number }>): Promise<Kq> {
  const khoa = String(b.khoaYeuCau ?? ''), soExp = b.soExp
  if (!KHOA_YEU_CAU.test(khoa) || typeof soExp !== 'number' || !Number.isInteger(soExp) || soExp < 1) return loi('sai_dau_vao')
  if (!(await moCua(env, sbd))) return loi('tam_dong')
  const ketQua = async (daDoi: number, wallet: number, lapLai: boolean): Promise<Kq> => ({ ok: true, daDoi, vang: await docVang(env, sbd), ongNghiem: wallet, ngayAn: conNgayAn(wallet), lapLai })
  const cu = await docSoKhoa(env, sbd, khoa)
  if (cu) return cu.loai === 'doi' ? ketQua(Number(cu.exp_tru) || 0, nguyen(p0.wallet), true) : loi('sai_dau_vao')
  let profile = p0, revision = revision0
  for (let lan = 0; lan < 3; lan++) {
    const wallet = nguyen(profile.wallet), toiDa = Math.max(0, wallet - GIU_LAI_EXP)
    if (soExp > toiDa) return loi('duoi_nguong', `Thần thú cần giữ lại ${GIU_LAI_EXP} EXP để ăn. Em đổi được tối đa ${toiDa} EXP.`)
    const luc = new Date().toISOString()
    const moi: Profile = { ...profile, wallet: Number(profile.wallet) - soExp }
    const r = await env.DB.batch([
      env.DB.prepare(
        `INSERT OR IGNORE INTO vang_so(sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc)
         SELECT ?, 'doi', ?, ?, NULL, ?, ?
          WHERE EXISTS (SELECT 1 FROM game_v2_profile WHERE sbd = ? AND revision = ? AND CAST(COALESCE(json_extract(json, '$.wallet'), 0) AS INTEGER) - ${GIU_LAI_EXP} >= ?)`,
      ).bind(sbd, soExp, soExp, khoa, luc, sbd, revision, soExp),
      env.DB.prepare(
        `UPDATE game_v2_profile SET json = ?, revision = revision + 1
          WHERE sbd = ? AND revision = ? AND EXISTS (SELECT 1 FROM vang_so WHERE sbd = ? AND khoa_yeu_cau = ? AND luc = ?)`,
      ).bind(JSON.stringify(moi), sbd, revision, sbd, khoa, luc),
    ])
    if (r[1]?.meta?.changes === 1) return ketQua(soExp, wallet - soExp, false)
    const da = await docSoKhoa(env, sbd, khoa) // lượt song song cùng khoá đã ghi trước
    if (da) return da.loai === 'doi' ? ketQua(Number(da.exp_tru) || 0, nguyen(profile.wallet), true) : loi('sai_dau_vao')
    ;({ profile, revision } = await docLai()) // hồ sơ vừa đổi (EXP mới về…): đọc lại rồi thử tiếp
  }
  throw new Error('Đổi vàng chưa xong vì hồ sơ đang bận. Em bấm lại nhé, số EXP của em chưa bị trừ.')
}

async function shopDanhSach(env: Env, sbd: string, nowMs: number): Promise<Kq> {
  if (!(await moCua(env, sbd))) return loi('tam_dong')
  const ban = monDangBan()
  const gioiHan = ban.filter((m) => m.suatTong !== null).map((m) => m.ma)
  const [vang, dangMac, co, daBan, so] = await Promise.all([
    docVang(env, sbd), docDangMac(env, sbd), docEmCo(env, sbd, nowMs), docDaBan(env, gioiHan),
    env.DB.prepare('SELECT ma_mon FROM phu_kien_so_huu WHERE sbd = ?').bind(sbd).all<{ ma_mon: string }>(),
  ])
  const daCo = new Set((so.results ?? []).map((x) => String(x.ma_mon)))
  const mon = ban.map((m) => {
    const thieu = chuThieu(m, co)
    return {
      ma: m.ma, gia: m.gia, daCo: daCo.has(m.ma), dangMac: dangMac[m.o] === m.ma, moKhoa: thieu === null, thieu,
      suatCon: m.suatTong === null ? null : Math.max(0, m.suatTong - (daBan.get(m.ma) ?? 0)), suatTong: m.suatTong,
    }
  })
  return { ok: true, phienBan: 'm1-v1', vang, mon, dangMac, emCo: co }
}

async function shopMua(env: Env, sbd: string, b: Record<string, unknown>, nowMs: number): Promise<Kq> {
  const khoa = String(b.khoaYeuCau ?? ''), maMon = b.maMon, giaThay = b.giaThay
  if (!KHOA_YEU_CAU.test(khoa) || typeof maMon !== 'string' || typeof giaThay !== 'number' || !Number.isInteger(giaThay)) return loi('sai_dau_vao')
  const ketQua = async (m: MonPhuKien, lapLai: boolean): Promise<Kq> => ({ ok: true, maMon: m.ma, vang: await docVang(env, sbd), daMac: (await docDangMac(env, sbd))[m.o] === m.ma, lapLai })
  const cu = await docSoKhoa(env, sbd, khoa)                               // bấm lặp: trả kết quả cũ TRƯỚC mọi kiểm khác
  if (cu) { const m = cu.loai === 'mua' ? docMonPhuKien(cu.ma_mon) : undefined; return m ? ketQua(m, true) : loi('sai_dau_vao') }
  if (!(await moCua(env, sbd))) return loi('tam_dong')
  const mon = docMonPhuKien(maMon)
  if (!mon) return loi('khong_co_mon')
  if (mon.moBan > DOT_MO_BAN) return loi('sap_mo')
  const daCoMon = async (): Promise<boolean> => !!(await env.DB.prepare('SELECT 1 AS x FROM phu_kien_so_huu WHERE sbd = ? AND ma_mon = ?').bind(sbd, mon.ma).first())
  if (await daCoMon()) return loi('da_co')
  const daBan = async (): Promise<number> => (await docDaBan(env, [mon.ma])).get(mon.ma) ?? 0
  if (mon.suatTong !== null && (await daBan()) >= mon.suatTong) return loi('het_suat', `Món này đã hết. Mùa 1 chỉ có ${mon.suatTong} cái.`)
  if (mon.canChuoiNgay !== null || mon.canAnThach !== null) {
    const co = await docEmCo(env, sbd, nowMs)
    if (chuThieu(mon, co) !== null) return loi('chua_mo', loiChuaMo(mon, co))
  }
  if (giaThay !== mon.gia) return loi('gia_doi')
  const vang = await docVang(env, sbd)
  if (vang < mon.gia) return loi('thieu_vang', `Chưa đủ vàng — còn thiếu ${mon.gia - vang} vàng.`)
  const luc = new Date().toISOString()
  const r = await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO phu_kien_so_huu(sbd, ma_mon, mua, gia, khoa_yeu_cau, luc)
       SELECT ?, ?, ?, ?, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM vang_so WHERE sbd = ? AND khoa_yeu_cau = ?)
          AND (SELECT COALESCE(SUM(so_vang), 0) FROM vang_so WHERE sbd = ?) >= ?
          AND (? IS NULL OR (SELECT COUNT(*) FROM phu_kien_so_huu WHERE ma_mon = ? AND mua = ?) < ?)`,
    ).bind(sbd, mon.ma, MUA_BAN, mon.gia, khoa, luc, sbd, khoa, sbd, mon.gia, mon.suatTong, mon.ma, MUA_BAN, mon.suatTong),
    env.DB.prepare(
      `INSERT OR IGNORE INTO vang_so(sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc)
       SELECT ?, 'mua', ?, 0, ?, ?, ? WHERE EXISTS (SELECT 1 FROM phu_kien_so_huu WHERE sbd = ? AND ma_mon = ? AND khoa_yeu_cau = ? AND luc = ?)`,
    ).bind(sbd, -mon.gia, mon.ma, khoa, luc, sbd, mon.ma, khoa, luc),
    env.DB.prepare(
      `INSERT OR REPLACE INTO phu_kien_dang_mac(sbd, o_gan, ma_mon, luc)
       SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM phu_kien_so_huu WHERE sbd = ? AND ma_mon = ? AND khoa_yeu_cau = ? AND luc = ?)`,
    ).bind(sbd, mon.o, mon.ma, luc, sbd, mon.ma, khoa, luc),
  ])
  if (r[0]?.meta?.changes === 1) return ketQua(mon, false)
  // Lô không ghi gì: một lượt song song đã đi trước (cùng khoá, cùng món, hết cái cuối, hoặc vừa tiêu vàng) — nói đúng lý do.
  const da = await docSoKhoa(env, sbd, khoa)
  if (da) { const m = da.loai === 'mua' ? docMonPhuKien(da.ma_mon) : undefined; return m ? ketQua(m, true) : loi('sai_dau_vao') }
  if (await daCoMon()) return loi('da_co')
  if (mon.suatTong !== null && (await daBan()) >= mon.suatTong) return loi('het_suat', `Món này đã hết. Mùa 1 chỉ có ${mon.suatTong} cái.`)
  const conLai = await docVang(env, sbd)
  if (conLai < mon.gia) return loi('thieu_vang', `Chưa đủ vàng — còn thiếu ${mon.gia - conLai} vàng.`)
  throw new Error('Chưa mua được món này. Em bấm lại nhé, vàng của em chưa bị trừ.')
}

async function thuMacDo(env: Env, sbd: string, b: Record<string, unknown>): Promise<Kq> {
  const o = b.oGan, ma = b.maMon
  if (typeof o !== 'string' || !(O_GAN as readonly string[]).includes(o) || (ma !== null && typeof ma !== 'string')) return loi('sai_dau_vao')
  if (ma === null) {
    await env.DB.prepare('DELETE FROM phu_kien_dang_mac WHERE sbd = ? AND o_gan = ?').bind(sbd, o).run()
  } else {
    const mon = docMonPhuKien(ma)
    if (!mon || mon.o !== o) return loi('chua_co')
    const luc = new Date().toISOString()
    const r = await env.DB.prepare(
      `INSERT OR REPLACE INTO phu_kien_dang_mac(sbd, o_gan, ma_mon, luc) SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM phu_kien_so_huu WHERE sbd = ? AND ma_mon = ?)`,
    ).bind(sbd, o, mon.ma, luc, sbd, mon.ma).run()
    if (!r.meta.changes) return loi('chua_co')
  }
  return { ok: true, dangMac: await docDangMac(env, sbd) }
}
