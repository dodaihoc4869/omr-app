// GÓI TỰ SỬA LỖI HÔM NAY ĐÓNG SẴN (thầy 31/10 17:20: «Tại sao bây giờ ko tải sẵn hết luôn và cũng tự động tải sẵn cho mỗi ngày, hs mở app lên là mọi thứ sẵn rồi»).
// Trước: mở app ⇒ máy em hẹn 3–15 giây rồi xin từng lượt 12 câu (`gon-mo-ngay`, mỗi câu = giao đợt + mở bản làm lại ≈ chục lệnh D1) ⇒ 36 câu ~15–20 giây,
// và lúc cả lớp mở app 19–20h thì D1 gánh đúng giờ đông nhất.
// Nay: CRON (khung đêm + bù trong ngày, hạn mức theo giờ) đóng sẵn cho từng em MỘT gói = mọi câu Tự sửa lỗi hôm nay chưa xong, mỗi câu ĐÚNG như máy em bấm mở
// (`moMotCauNgay`: đề công khai + tem `sk` hạn dài + đáp án mã hoá `dm` khoá riêng em + ngày VN), cất ở R2 (`goi-sua/<ngày>/<sbd>.json`). Mở app ⇒ máy em xin
// `/hs/chua-cau-sai/goi-ngay` NGAY: một lần đọc R2 + một câu đọc D1 kiểm lệch ⇒ cả phần hôm nay nằm trên máy trong ~1 giây.
//  · DANH SÁCH CÂU = đúng danh sách lượt mở app đầu tiên của em sẽ dựng (src/lib/tu-sua-viec-hom-nay.ts): máy chủ đã có việc hôm nay (`viecNgay`) ⇒ dùng nguyên; chưa có ⇒
//    lập theo kế hoạch 12–36 câu (`lapKeSuaNgay`, cùng câu đọc + cùng bước đóng đợt đã làm đúng của lệnh danh sách) rồi GHI `viecNgay` + mục tiêu ⇒ máy em gộp ra
//    CÙNG danh sách (bản máy chủ dài bằng ⇒ máy chủ thắng; mục tiêu đã lưu ⇒ không lập lại).
//  · LỆCH: lượt mở app đọc kèm các đợt em đã nộp hôm nay SAU lúc đóng gói (`chua_gon_lan.luc`) ⇒ bỏ câu ấy khỏi gói (máy em mở theo đường cũ). Câu thiếu / gói chưa có
//    (cron chưa tới em) ⇒ máy em tải từng lượt như trước. Máy chủ VẪN chấm lại mọi lần nộp (dòng 2 là chuẩn).
//  · AN TOÀN: chỉ câu Tự sửa lỗi luyện tập (cùng cổng `gonMo` / `cauDuocNho` như lệnh mở câu); không đóng gói lúc em có ca thi mở hoặc không bật vòng chữa; lượt mở
//    app vẫn qua quyền + khoá Kiểm tra ôn tập như `gon-mo-ngay`.
import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'
import { ngayVn } from './su-kien-hoc'
import { ghiViecNgay, lenhDocViecNgay, viecNgayTuDong, type MucNgay } from './tu-sua-viec-ngay'
import { lapKeSuaNgay, SQL_UNG_VIEN_SUA } from './sua-loi-ke-ngay'
import { lenhDemSua } from './chua-cau-sai'
import { tinhNangBat } from './chua-cau-sai-cau-hinh'
import { coCaDangMo } from './ca-dang-mo'
import { moNhieuCau } from './chua-gon-lenh'
import { HAN_NIEM_CHUAN_BI_MS } from './niem-phong'
import { NGAY_CUA_SO_GON, SQL_DONG_DA_DUNG_LAI } from './chua-gon'

type Obj = Record<string, unknown>
const num = (v: unknown) => Number(v) || 0

export const BANG_GOI_SUA = 'sua_goi_ngay'
/** Bảng CHỈ-THÊM: em nào đã có gói hôm nay (cron chọn em chưa có). `so` = số câu trong gói; −1 = đang đóng (giữ chỗ 10 phút cho lượt cron chồng nhau). */
export const SQL_GOI_SUA: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS ${BANG_GOI_SUA} (sbd TEXT PRIMARY KEY, ngay TEXT NOT NULL, luc INTEGER NOT NULL, so INTEGER NOT NULL DEFAULT 0)`,
]
export const khoaGoiSua = (ngay: string, sbd: string): string => `goi-sua/${ngay}/${sbd}.json`
export interface GoiSuaNgay { v: 1; n: string; luc: number; ds: Obj[] }
/** Giữ chỗ «đang đóng» bao lâu (lượt cron chồng nhau không đóng trùng một em). */
const GIU_CHO_MS = 10 * 60_000

/**
 * Danh sách câu hôm nay của em — đúng như lượt mở app đầu sẽ dựng. Một lô D1: đóng đợt em đã làm đúng lại (như lệnh danh sách) · việc hôm nay · đếm · ứng viên.
 * Chưa có việc hôm nay ⇒ lập kế hoạch rồi ghi `viecNgay`. Không có câu nào ⇒ null.
 */
export async function danhSachNgay(env: Env, sbd: string, nowMs: number): Promise<{ m: MucNgay[]; xong: Set<string> } | null> {
  const ngay = ngayVn(nowMs), nay = new Date(nowMs).toISOString()
  const r = await env.DB.batch([
    env.DB.prepare(SQL_DONG_DA_DUNG_LAI).bind(nowMs, sbd, nowMs - NGAY_CUA_SO_GON * 86_400_000),
    lenhDocViecNgay(env, sbd, ngay),
    lenhDemSua(env, sbd, nay, nowMs),
    env.DB.prepare(SQL_UNG_VIEN_SUA).bind(sbd, nay),
  ])
  const viec = viecNgayTuDong(r[1]?.results?.[0] as Obj | undefined, ngay)
  if (viec?.m.length) return { m: viec.m, xong: new Set(viec.x) }
  const d = r[2]?.results?.[0] as Obj | undefined
  const ke = lapKeSuaNgay((r[3]?.results ?? []) as Obj[], { can: num(d?.can), cho: num(d?.cho), daSua: num(d?.daSua11) }, viec, nowMs)
  if (!ke?.ung.length) return null
  await ghiViecNgay(env, sbd, ngay, { m: ke.ung, x: viec?.x ?? [], them: 0, mt: ke.n }, nowMs)
  return { m: ke.ung, xong: new Set(viec?.x ?? []) }
}

/** Đóng gói cho MỘT em. Trả số câu trong gói; null = chưa đóng được lúc này (ca thi mở / lỗi) ⇒ lượt cron sau thử lại. */
/** Trần cỡ gói (ký tự JSON) — khớp ngân sách bộ nhớ máy em (src/lib/nap-truoc-sua.ts `NGAN_SACH`). */
export const TRAN_GOI_SUA = 2_000_000

export async function dongGoiSuaEm(env: Env, sbd: string, nowMs: number): Promise<number | null> {
  const ngay = ngayVn(nowMs)
  const danDau = (so: number) => env.DB.prepare(`INSERT INTO ${BANG_GOI_SUA}(sbd,ngay,luc,so) VALUES(?1,?2,?3,?4)
    ON CONFLICT(sbd) DO UPDATE SET ngay=excluded.ngay,luc=excluded.luc,so=excluded.so`).bind(sbd, ngay, nowMs, so).run()
  try {
    await chayDdlMotLan(env, BANG_GOI_SUA, SQL_GOI_SUA)
    const [bat, ca] = await Promise.all([tinhNangBat(env, { sbd }).catch(() => false), coCaDangMo(env, sbd, nowMs, true).catch(() => true)])
    if (ca) return null
    if (!bat) { await danDau(0); return 0 }
    await danDau(-1)
    const ds = await danhSachNgay(env, sbd, nowMs)
    const qids = (ds?.m ?? []).filter((x) => !ds!.xong.has(x.d || x.q) && !ds!.xong.has(x.q)).map((x) => x.q)
    if (!qids.length) { await danDau(0); return 0 }
    const mo = await moNhieuCau(env, sbd, qids, { song: 3, hetMs: 90_000, hanTem: HAN_NIEM_CHUAN_BI_MS })
    // NGÂN SÁCH CỠ GÓI (thầy 31/10, iPhone sập lúc «Tiếp tục»): đề có thể kèm ảnh nhúng ⇒ gói chỉ giữ tới TRAN_GOI_SUA ký tự (máy em phân tích MỘT lượt);
    // câu vượt ⇒ máy em tải từng lượt / khi bấm như cũ (cùng ngân sách bộ nhớ nap-truoc-sua.ts).
    let co = 0
    const tot = mo.filter((x) => x.ok === true && !!x.gon && (x.gon as Obj).ok === true)
      .filter((x) => { const n = JSON.stringify(x).length; if (co + n > TRAN_GOI_SUA) return false; co += n; return true })
    const goi: GoiSuaNgay = { v: 1, n: ngay, luc: nowMs, ds: tot }
    await env.DE.put(khoaGoiSua(ngay, sbd), JSON.stringify(goi), { httpMetadata: { contentType: 'application/json' } })
    await env.DE.delete(khoaGoiSua(ngayVn(nowMs - 86_400_000), sbd)).catch(() => {})
    await danDau(tot.length)
    return tot.length
  } catch (e) {
    console.error('[goi-sua] đóng gói lỗi:', e instanceof Error ? e.message : e)
    await env.DB.prepare(`DELETE FROM ${BANG_GOI_SUA} WHERE sbd=? AND so=-1`).bind(sbd).run().catch(() => null)
    return null
  }
}

/** Hạn mức số em đóng gói mỗi phút theo giờ VN: 00:00–00:14 nghỉ (ngày mới, cron đóng đợt cũ chạy trước) · đêm 6 · sáng 4 · chiều 3 · tối 19–24h 1 em mỗi 5 phút. */
export function toiDaGoiSua(now: number): number {
  const d = new Date(now + 7 * 3_600_000), g = d.getUTCHours(), p = d.getUTCMinutes()
  if (g === 0 && p < 15) return 0
  if (g < 4) return 6
  if (g < 13) return 4
  if (g < 19) return 3
  return p % 5 === 0 ? 1 : 0
}

/** CRON mỗi phút: em còn câu cần sửa, chưa có gói hôm nay (em vừa học gần đây trước) ⇒ đóng gói. Trả số em đã đóng. */
export async function cronGoiSuaDem(env: Env, now: number, toiDa: number = toiDaGoiSua(now)): Promise<number> {
  if (toiDa <= 0 || !env.DE) return 0
  try {
    await chayDdlMotLan(env, BANG_GOI_SUA, SQL_GOI_SUA)
    const ngay = ngayVn(now)
    const rs = await env.DB.prepare(`SELECT d.sbd AS sbd FROM chua_loi_dot d WHERE d.trang_thai_day<>'da_tu_sua' AND d.dong_luc IS NULL
        AND NOT EXISTS (SELECT 1 FROM ${BANG_GOI_SUA} g WHERE g.sbd=d.sbd AND g.ngay=?1 AND (g.so>=0 OR g.luc>?2))
      GROUP BY d.sbd ORDER BY MAX(d.cap_nhat_luc) DESC LIMIT ?3`).bind(ngay, now - GIU_CHO_MS, toiDa).all<{ sbd: string }>()
    let n = 0
    for (const r of rs.results ?? []) if ((await dongGoiSuaEm(env, String(r.sbd), now)) !== null) n++
    return n
  } catch (e) { console.error('[goi-sua] cron lỗi:', e instanceof Error ? e.message : e); return 0 }
}

/**
 * Lượt mở app (`/hs/chua-cau-sai/goi-ngay`, nơi gọi đã kiểm quyền + khoá Kiểm tra ôn tập): MỘT lần đọc R2 + MỘT câu đọc D1 (đợt em đã nộp hôm nay, lần cuối) song song.
 * Bỏ câu có lần nộp SAU lúc đóng gói (gói của câu ấy đã cũ). `co` = có gói hôm nay (máy em thôi hỏi lại trong ngày).
 */
export async function docGoiSua(env: Env, sbd: string, nowMs: number): Promise<{ ok: true; co: boolean; n: string; luc?: number; ds: Obj[] }> {
  const ngay = ngayVn(nowMs)
  const [tho, lan] = await Promise.all([
    env.DE ? env.DE.get(khoaGoiSua(ngay, sbd)).then((o) => (o ? new Response(o.body).text() : null)).catch(() => null) : Promise.resolve(null),
    env.DB.prepare('SELECT dot_id AS d, MAX(luc) AS luc FROM chua_gon_lan WHERE sbd=? AND ngay_vn=? GROUP BY dot_id').bind(sbd, ngay).all<{ d: string; luc: number }>().catch(() => null),
  ])
  let goi: GoiSuaNgay | null = null
  try { goi = tho ? (JSON.parse(tho) as GoiSuaNgay) : null } catch { goi = null }
  if (!goi || goi.v !== 1 || goi.n !== ngay || !Array.isArray(goi.ds)) return { ok: true, co: false, n: ngay, ds: [] }
  const nopSau = new Set((lan?.results ?? []).filter((r) => num(r.luc) >= goi!.luc).map((r) => String(r.d)))
  return { ok: true, co: true, n: ngay, luc: goi.luc, ds: goi.ds.filter((x) => !nopSau.has(String(x.dotId))) }
}
