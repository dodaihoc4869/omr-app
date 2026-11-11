// NỢ CÂU — phần D1 (luật thuần: no-cau.ts; đặc tả: docs/ban-ve-lam-bu-1111/DAC-TA.md).
// LUẬT TỐC ĐỘ: sổ nợ + lựa chọn hôm nay đọc CÙNG câu đọc mức + loại ngày (`docMucLoai7`) ⇒ ngày thường 0 lệnh D1 thêm. Chỉ lần lập ĐẦU TIÊN của ngày
// (thường là lượt lập sẵn ban đêm, không ai chờ) mới thêm MỘT lô đọc các ngày đã qua + MỘT lô ghi (chốt nợ, lựa chọn mặc định, nâng mức hôm nay).
// Hai bảng CHỈ-THÊM (goi-bai-7-schema.ts): `goi_bai_7_no_em` (sổ nợ của em) · `goi_bai_7_no_chon` (lựa chọn trả nợ mỗi ngày, kèm mức gốc của ngày).
import type { Env, D1PreparedStatement } from './kieu'
import { congNgay7, ngayVn7 } from './goi-bai-7-loi'
import { NGAY_NO_CAU, NGAY_TRUOC_NO_CAU, chonMacDinh, chotNo, soCuaKieu, soNoRong, tomTatNo, type KieuTra, type LoaiNo, type NgayNo, type SoNo, type TomTatNo } from './no-cau'

type Row = Record<string, unknown>
export interface ChonNo { kieu: KieuTra; so: number; goc: number; /** lúc ghi lựa chọn — so với lúc tạo dòng mức để biết dòng mức vừa bị lập lại */ luc: string }
export interface DocNo7 { em: SoNo | null; chon: ChonNo | null }
/** Phần ghép vào câu đọc mức + loại ngày. Tham số theo thứ tự: sbd, sbd, ngày. */
export const SQL_COT_NO = '(SELECT json_array(no,lan,loai_json,den_ngay) FROM goi_bai_7_no_em WHERE sbd=?) nc,(SELECT json_array(kieu,so,goc,luc) FROM goi_bai_7_no_chon WHERE sbd=? AND ngay=?) ncc'

const so0 = (v: unknown): number => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0 }
const mang = (v: unknown): unknown[] | null => { try { const a: unknown = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(a) ? a : null } catch { return null } }
const laKieu = (v: unknown): v is KieuTra => v === 'toi_thieu' || v === 'het'
function docLoai(v: unknown): Record<LoaiNo, number> {
  let o: Row = {}
  try { const x: unknown = typeof v === 'string' ? JSON.parse(v) : v; if (x && typeof x === 'object') o = x as Row } catch { /* loại hỏng ⇒ 0 */ }
  return { moi: so0(o.moi), sua: so0(o.sua), on: so0(o.on), lai: so0(o.lai) }
}
export function docCotNo(nc: unknown, ncc: unknown): DocNo7 {
  const a = mang(nc), c = mang(ncc)
  return {
    em: a && typeof a[3] === 'string' ? { no: so0(a[0]), lan: so0(a[1]), loai: docLoai(a[2]), den: a[3] } : null,
    chon: c && laKieu(c[0]) ? { kieu: c[0], so: so0(c[1]), goc: so0(c[2]), luc: typeof c[3] === 'string' ? c[3] : '' } : null,
  }
}

/** Không chốt trong 2 phút đầu ngày: dòng sổ của câu em vừa làm lúc 23:59 ghi hoãn vài giây ⇒ chờ cho đủ rồi mới tính nợ. */
const CHO_SAU_NUA_DEM_MS = 120_000
const dauNgayMs = (ngay: string): number => Date.parse(`${ngay}T00:00:00+07:00`)
const SQL_NANG_MUC = 'UPDATE goi_bai_7_muc_ngay SET muc=(SELECT goc+so FROM goi_bai_7_no_chon WHERE sbd=?1 AND ngay=?2) WHERE sbd=?1 AND ngay=?2 AND EXISTS(SELECT 1 FROM goi_bai_7_no_chon WHERE sbd=?1 AND ngay=?2)'

/** Các ngày đã qua `tu`…`den` của em, đủ dữ kiện cho `chotNo` — MỘT lô đọc. Lỗi ⇒ null (không chốt, không đoán). */
async function docNgayQua(env: Env, sbd: string, tu: string, den: string, loaiVang: NgayNo['loai']): Promise<NgayNo[] | null> {
  try {
    const [bhn, kt] = await Promise.all([import('./bai-hang-ngay'), import('./kiem-tra-ca-nhan')])
    const ds = JSON.stringify([sbd]), q = (sql: string) => env.DB.prepare(sql).bind(sbd, tu, den)
    const [coKt, r] = await Promise.all([kt.coKtCn(env).catch(() => false), env.DB.batch<Row>([
      env.DB.prepare(bhn.SQL_DEM_GOI7).bind(ds, tu, den),
      env.DB.prepare(bhn.SQL_DEM_GAP).bind(ds, tu, den),
      q('SELECT ngay,muc FROM goi_bai_7_muc_ngay WHERE sbd=? AND ngay BETWEEN ? AND ?'),
      q('SELECT ngay,kieu,so FROM goi_bai_7_no_chon WHERE sbd=? AND ngay BETWEEN ? AND ?'),
      q('SELECT ngay,loai FROM goi_bai_7_loai_ngay WHERE sbd=? AND ngay BETWEEN ? AND ?'),
      q("SELECT ngay,trang_thai FROM kiem_tra_ca_nhan WHERE sbd=? AND ngay BETWEEN ? AND ? AND trang_thai<>'cho_nguon'"),
      env.DB.prepare('SELECT bat_dau,han FROM goi_bai_7_em WHERE sbd=? AND bat_dau<=? AND han>=?').bind(sbd, den, tu),
    ])])
    const theo = (i: number) => new Map((r[i]?.results ?? []).map((x) => [String(x.ngay), x]))
    const lam = new Map<string, number>()
    for (const i of [0, 1]) for (const x of r[i]?.results ?? []) lam.set(String(x.ngay), (lam.get(String(x.ngay)) ?? 0) + so0(x.n))
    const muc = theo(2), chon = theo(3), loai = theo(4), kiem = theo(5), ra: NgayNo[] = [], goi = r[6]?.results ?? []
    for (let d = tu; d <= den; d = congNgay7(d, 1)) {
      const m = muc.get(d), c = chon.get(d), l = loai.get(d)?.loai, k = coKt ? kiem.get(d) : undefined
      // Ngày em không mở app chỉ tính thiếu khi hôm ấy em ĐANG có bài trong hạn; không có bài (lớp chưa được giao, nghỉ giữa hai bài) ⇒ bỏ qua cả ngày, không nợ, không lãi.
      if (!m && !k && !goi.some((g) => String(g.bat_dau) <= d && String(g.han) >= d)) continue
      ra.push({ ngay: d, muc: m && so0(m.muc) > 0 ? so0(m.muc) : null, so: c ? so0(c.so) : 0, kieu: c && laKieu(c.kieu) ? c.kieu : null, lam: lam.get(d) ?? 0,
        kt: k ? (k.trang_thai === 'da_nop' ? 'da_nop' : 'chua') : null, loai: l === 'moi' || l === 'sua' ? l : m ? 'on' : loaiVang })
    }
    return ra
  } catch (e) { console.error('[no-cau] chưa đọc được các ngày đã qua:', e instanceof Error ? e.message : e); return null }
}

/**
 * NỢ CÂU CỦA EM HÔM NAY — gọi ngay sau khi có dòng mức hôm nay (`lapGoi7`). Trả MỨC HÔM NAY (đã gồm số câu trả nợ) và gắn tóm tắt vào `ml.noCau`.
 * `muc` = mức vừa đọc của dòng mức hôm nay; `daLam` = số câu em đã làm hôm nay. Mọi lỗi ⇒ trả đúng `muc` (em học như chưa có tính năng — không làm hỏng Sảnh).
 */
export async function noCau7(env: Env, sbd: string, ngay: string, now: number, ml: { no?: DocNo7; noCau?: TomTatNo | null; loaiNay?: string | null; mucLuc?: string }, muc: number, daLam: number): Promise<number> {
  const doc = ml.no
  if (!doc || ngay < NGAY_NO_CAU || !(muc > 0)) return muc
  try {
    const hq = congNgay7(ngay, -1), luc = new Date(now).toISOString()
    let s = doc.em, chon = doc.chon
    if (!s) { // em chưa có sổ: coi như sổ nợ 0 đã chốt tới NGAY_TRUOC_NO_CAU ⇒ mọi em tính nợ từ 11/11, không phụ thuộc hôm nào em mở app lần đầu
      s = soNoRong(NGAY_TRUOC_NO_CAU)
      if (s.den >= hq) { // chưa có ngày nào để chốt (chính ngày 11/11): chỉ mở sổ — ghi nền, không ai chờ (luật tốc độ: không thêm đợt chờ D1 vào lượt lập)
        env.DB.prepare('INSERT OR IGNORE INTO goi_bai_7_no_em(sbd,no,lan,loai_json,den_ngay,luc) VALUES(?,0,0,?,?,?)').bind(sbd, '{}', s.den, luc).run()
          .catch((e: unknown) => console.error('[no-cau] chưa mở được sổ nợ:', e instanceof Error ? e.message : e))
        return muc
      }
    }
    const lenh: D1PreparedStatement[] = []
    if (s.den < hq) {
      if (now - dauNgayMs(ngay) < CHO_SAU_NUA_DEM_MS) return muc
      const tu = [congNgay7(s.den, 1), congNgay7(ngay, -7), NGAY_NO_CAU].sort().pop()!
      const loaiVang = ml.loaiNay === 'moi' || ml.loaiNay === 'sua' ? ml.loaiNay : 'on'
      const ds = tu <= hq ? await docNgayQua(env, sbd, tu, hq, loaiVang) : []
      if (!ds) return muc
      s = { ...chotNo(s, ds, chon ? chon.goc : muc), den: hq }
      lenh.push(env.DB.prepare(`INSERT INTO goi_bai_7_no_em(sbd,no,lan,loai_json,den_ngay,luc) VALUES(?,?,?,?,?,?)
        ON CONFLICT(sbd) DO UPDATE SET no=excluded.no,lan=excluded.lan,loai_json=excluded.loai_json,den_ngay=excluded.den_ngay,luc=excluded.luc WHERE goi_bai_7_no_em.den_ngay<excluded.den_ngay`)
        .bind(sbd, s.no, s.lan, JSON.stringify(s.loai), hq, luc))
    }
    let mucMoi = muc
    if (s.no > 0 && !chon) { // lựa chọn mặc định của ngày + nâng mức hôm nay, CÙNG lô với chốt nợ; đọc lại dòng thắng (hai lượt lập cùng lúc ra cùng một số)
      const c = chonMacDinh(s)
      lenh.push(env.DB.prepare('INSERT OR IGNORE INTO goi_bai_7_no_chon(sbd,ngay,kieu,so,goc,luc) VALUES(?,?,?,?,?,?)').bind(sbd, ngay, c.kieu, c.so, muc, luc),
        env.DB.prepare(SQL_NANG_MUC).bind(sbd, ngay),
        env.DB.prepare('SELECT c.kieu,c.so,c.goc,(SELECT muc FROM goi_bai_7_muc_ngay WHERE sbd=c.sbd AND ngay=c.ngay) muc FROM goi_bai_7_no_chon c WHERE c.sbd=? AND c.ngay=?').bind(sbd, ngay))
      const kq = await env.DB.batch<Row>(lenh), x = kq[kq.length - 1]?.results?.[0]
      chon = x && laKieu(x.kieu) ? { kieu: x.kieu, so: so0(x.so), goc: so0(x.goc), luc } : { ...c, goc: muc, luc }
      mucMoi = x && so0(x.muc) > 0 ? so0(x.muc) : muc + chon.so
    } else if (s.no > 0 && chon && (!ml.mucLuc || ml.mucLuc > chon.luc)) {
      // DÒNG MỨC HÔM NAY VỪA BỊ LẬP LẠI sau khi em đã có lựa chọn (thầy giao bài mới ⇒ máy xoá mức tính sẵn rồi chốt lại — giao-bai-moi-xep-lai): mức gốc mới = `muc`,
      // nâng lại đúng số đã chọn. (Mức bị HẠ vì kho hết câu thì dòng mức không đổi lúc tạo ⇒ không rơi vào đây, giữ mức đã hạ.)
      lenh.push(env.DB.prepare('UPDATE goi_bai_7_no_chon SET goc=?,luc=? WHERE sbd=? AND ngay=?').bind(muc, luc, sbd, ngay), env.DB.prepare(SQL_NANG_MUC).bind(sbd, ngay))
      await env.DB.batch(lenh)
      chon = { ...chon, goc: muc, luc }
      mucMoi = muc + chon.so
    } else if (lenh.length) await env.DB.batch(lenh)
    ml.noCau = chon ? tomTatNo(s, chon, daLam, mucMoi) : null
    return mucMoi
  } catch (e) { console.error('[no-cau] lỗi, hôm nay em học như chưa có nợ:', e instanceof Error ? e.message : e); return muc }
}

/** Sổ nợ + lựa chọn hôm nay của em — cho lệnh chọn và test. */
export async function docNo7(env: Env, sbd: string, ngay: string): Promise<DocNo7> {
  const r = await env.DB.prepare(`SELECT ${SQL_COT_NO}`).bind(sbd, sbd, ngay).first<Row>()
  return docCotNo(r?.nc, r?.ncc)
}

/**
 * LỆNH `hoc-tap-no-cau-chon { kieu: 'toi_thieu' | 'het' }` — em đổi lựa chọn trả nợ hôm nay. Mức hôm nay = mức gốc + số câu của lựa chọn (một lô ghi);
 * bản Sảnh lập sẵn của em bị đánh dấu cũ ⇒ lượt Sảnh kế tiếp lập lại theo mức mới.
 */
export async function chonNoCau7(env: Env, sbd: string, b: Row, now: number): Promise<Record<string, unknown>> {
  const kieu = b.kieu
  if (!laKieu(kieu)) throw new Error('Lựa chọn trả nợ câu không hợp lệ.')
  const ngay = ngayVn7(now), { em, chon } = await docNo7(env, sbd, ngay)
  if (!em || em.no <= 0 || !chon || em.den !== congNgay7(ngay, -1)) throw new Error('Hôm nay em không có nợ câu cần trả. Em mở lại màn Hôm nay nhé.')
  const so = soCuaKieu(em, kieu)
  if (so === null) throw new Error('Em đã trả tối thiểu 3 lần. Hôm nay em cần trả hết nợ câu.')
  await env.DB.batch([
    env.DB.prepare('UPDATE goi_bai_7_no_chon SET kieu=?,so=?,luc=? WHERE sbd=? AND ngay=?').bind(kieu, so, new Date(now).toISOString(), sbd, ngay),
    env.DB.prepare(SQL_NANG_MUC).bind(sbd, ngay),
  ])
  await env.DB.prepare("UPDATE hoc_tap_san_sang SET dau='' WHERE sbd=?").bind(sbd).run().catch(() => null)
  return { ok: true, kieu, so, muc: chon.goc + so }
}
