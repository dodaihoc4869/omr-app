// SỔ «MỜI RA KHỎI LỚP» CỦA BUỔI LIVE (thầy 13/11, luật rời màn — src/lib/bpu/phong-luat.ts). Văn phòng trực live (Javis DDH) cần biết NGAY em nào vừa bị
// mời ra / bị thầy từ chối / được vào lại để nhắn Zalo cho phụ huynh ⇒ phòng ghi từng việc vào bảng `live_moi_ra` (CHỈ-THÊM, DDL lúc chạy) và văn phòng đọc
// qua `POST /gv/bpu/moi-ra` (mã GV như các lệnh văn phòng khác). Tin kết thúc buổi lấy số liệu ở `POST /gv/bpu/live-thong-ke`. App KHÔNG tự nhắn phụ huynh. Hợp đồng: docs/hop-dong-live-moi-ra-van-phong-1311.md.
import type { SuKienLuat } from '../../src/lib/bpu/phong-luat'
import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'

type Row = Record<string, unknown>
const num = (x: unknown): number => (typeof x === 'number' ? x : Number(x)) || 0
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x))

const SQL_MOI_RA = [
  `CREATE TABLE IF NOT EXISTS live_moi_ra (stt INTEGER PRIMARY KEY AUTOINCREMENT, ma TEXT NOT NULL UNIQUE, buoi_id TEXT NOT NULL, phong TEXT NOT NULL DEFAULT '',
     khoi INTEGER NOT NULL DEFAULT 0, sbd TEXT NOT NULL, ten TEXT NOT NULL DEFAULT '', loai TEXT NOT NULL, lan INTEGER NOT NULL DEFAULT 0, n INTEGER NOT NULL DEFAULT 0, luc INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_live_moi_ra_buoi ON live_moi_ra(buoi_id, stt)`,
] as const
const damBao = (env: Env) => chayDdlMotLan(env, 'live_moi_ra_v1', SQL_MOI_RA)

export interface BuoiMoiRa { buoiId: string; phong: string; khoi: number; ten: (sbd: string) => string }
/** Phòng gọi (ngoài đường nóng, `waitUntil`) mỗi khi luật vừa mời ra / từ chối / cho vào lại một em. Trùng mã ⇒ bỏ qua (gọi lại không nhân đôi). */
export async function ghiMoiRa(env: Env, b: BuoiMoiRa, ds: readonly SuKienLuat[]): Promise<number> {
  if (!ds.length || !env.DB) return 0
  await damBao(env)
  const SQL = 'INSERT OR IGNORE INTO live_moi_ra (ma, buoi_id, phong, khoi, sbd, ten, loai, lan, n, luc) VALUES (?,?,?,?,?,?,?,?,?,?)'
  await env.DB.batch(ds.map((x) => env.DB.prepare(SQL).bind(`${b.buoiId}|${x.sbd}|${x.loai}|${x.luc}`, b.buoiId, b.phong, b.khoi, x.sbd, b.ten(x.sbd), x.loai, x.lan ?? 0, x.n ?? 0, x.luc)))
  return ds.length
}

const gioVn = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(11, 16)
const ngayVn = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
/** `POST /gv/bpu/moi-ra { sau?, toiDa?, buoiId? }` — văn phòng đọc các việc MỚI hơn mốc `sau` (số thứ tự của dòng cuối đã đọc; 0 / bỏ trống = 24 giờ gần nhất).
 *  Trả `{ ok, ds: [{ stt, loai, sbd, ten, lop, lan, n, luc, gio, ngay, buoiId, phong, khoi }], moc }`; lần sau gửi `sau = moc`. Một lệnh đọc, không ghi. */
export async function gvLiveMoiRa(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  const sau = Math.max(0, Math.floor(num(b.sau))), toiDa = Math.max(1, Math.min(200, num(b.toiDa) || 50)), buoi = str(b.buoiId).trim()
  let dong: Row[] = []
  try {
    dong = (await env.DB.prepare(`SELECT m.stt, m.buoi_id, m.phong, m.khoi, m.sbd, m.ten, m.loai, m.lan, m.n, m.luc, h.ho_ten, COALESCE(NULLIF(h.ten_lop, ''), h.lop, '') AS lop
      FROM live_moi_ra m LEFT JOIN hoc_sinh h ON h.sbd = m.sbd WHERE m.stt > ?1 AND (?1 > 0 OR m.luc >= ?2) AND (?3 = '' OR m.buoi_id = ?3) ORDER BY m.stt LIMIT ?4`)
      .bind(sau, nowMs - 86_400_000, buoi, toiDa).all<Row>()).results ?? []
  } catch (e) { if (!/no such table/i.test(e instanceof Error ? e.message : String(e))) throw e } // chưa buổi nào có em bị mời ra ⇒ chưa có bảng
  const ds = dong.map((r) => ({
    stt: num(r.stt), loai: str(r.loai), sbd: str(r.sbd), ten: str(r.ho_ten) || str(r.ten), lop: str(r.lop), lan: num(r.lan), n: num(r.n),
    luc: num(r.luc), gio: gioVn(num(r.luc)), ngay: ngayVn(num(r.luc)), buoiId: str(r.buoi_id), phong: str(r.phong), khoi: num(r.khoi),
  }))
  return { ok: true, ds, moc: ds.length ? ds[ds.length - 1]!.stt : sau }
}

// ───────────────────────── THỐNG KÊ BUỔI LIVE (tin kết thúc của văn phòng) ─────────────────────────
/** TÊN GỌI cho tin nhắn của văn phòng (Javis DDH 13/11: «tên trong các danh sách chỉ ghi tên gọi (Hà, Quang, Ngọc…); hai em trùng tên gọi thì ghi thêm tên đệm
 *  (Lan Anh, Minh Anh)»): chữ cuối của họ tên; trùng trong buổi ⇒ hai chữ cuối; vẫn trùng ⇒ cả họ tên. THUẦN. */
export function tenGoiTheoBuoi(hoTen: readonly string[]): Map<string, string> {
  const tu = (t: string): string[] => t.trim().split(/\s+/).filter(Boolean), ds = [...new Set(hoTen.map((t) => t.trim()).filter(Boolean))]
  const dem = (lay: (t: string) => string): Map<string, number> => { const m = new Map<string, number>(); for (const t of ds) m.set(lay(t), (m.get(lay(t)) ?? 0) + 1); return m }
  const mot = (t: string): string => tu(t).slice(-1).join(' '), hai = (t: string): string => tu(t).slice(-2).join(' ')
  const d1 = dem(mot), d2 = dem(hai), ra = new Map<string, string>()
  for (const t of ds) ra.set(t, d1.get(mot(t)) === 1 ? mot(t) : d2.get(hai(t)) === 1 ? hai(t) : t)
  return ra
}
const khoiCua = (lop: unknown): number => Number(/(?:^|\D)(1[0-2])(?:\D|$)/.exec(str(lop))?.[1] ?? 0)
/** `POST /gv/bpu/live-thong-ke { buoiId? }` — số liệu MỘT buổi live theo khối cho tin kết thúc của văn phòng: sĩ số khối, em có mặt, em KHÔNG vào live, số lần
 *  rời màn của từng em, em bị mời ra (đang chờ / bị từ chối / đã vào lại). Bỏ `buoiId` ⇒ buổi live mở gần nhất. Đọc-chỉ: một đợt D1 + một lượt hỏi phòng.
 *  `hoiPhong` = cách hỏi phòng (truyền vào để tệp này không kéo theo mã phòng; test thay bằng phòng giả). */
export async function gvLiveThongKe(env: Env, b: Row, hoiPhong: (buoiId: string) => Promise<Row>): Promise<Row> {
  let id = str(b.buoiId).trim()
  if (!id) id = str((await env.DB.prepare("SELECT id FROM buoi_hoc WHERE lop LIKE 'Live Khối %' ORDER BY mo_luc DESC LIMIT 1").first<Row>().catch(() => null))?.id)
  if (!id) return { ok: false, lyDo: 'khong-co-buoi', error: 'Chưa có buổi live nào.' }
  const docMoiRa = env.DB.prepare('SELECT sbd, ten, loai, lan, n, luc FROM live_moi_ra WHERE buoi_id = ? ORDER BY stt').bind(id).all<Row>().then((r) => r.results ?? []).catch(() => [] as Row[])
  const [[buoiR, hsR], tk, sk] = await Promise.all([
    env.DB.batch([
      env.DB.prepare('SELECT id, ten, lop, mo_luc, dong_luc FROM buoi_hoc WHERE id = ?').bind(id),
      env.DB.prepare("SELECT sbd, ho_ten, lop, ten_lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'"),
    ]),
    hoiPhong(id), docMoiRa,
  ])
  const buoi = (buoiR?.results as Row[] | undefined)?.[0]
  if (!buoi) return { ok: false, lyDo: 'khong-co-buoi', error: 'Không có buổi này.' }
  const khoi = khoiCua(buoi.lop), hs = new Map<string, { ten: string; lop: string; khoi: number }>()
  for (const h of (hsR?.results as Row[] | undefined) ?? []) hs.set(str(h.sbd), { ten: str(h.ho_ten), lop: str(h.ten_lop) || str(h.lop), khoi: khoiCua(h.lop) || khoiCua(h.ten_lop) })
  const ten = (sbd: string, duPhong = ''): string => hs.get(sbd)?.ten || duPhong || sbd, lop = (sbd: string): string => hs.get(sbd)?.lop ?? ''
  // phòng: [sbd, tên, đã vào (1/0), số lần rời màn]
  const em = (Array.isArray(tk.em) ? (tk.em as unknown[]) : []).flatMap((x) => (Array.isArray(x) && str(x[0]) ? [{ sbd: str(x[0]), ten: ten(str(x[0]), str(x[1])), lop: lop(str(x[0])), vao: num(x[2]) === 1, roi: num(x[3]) }] : []))
  const coMat = em.filter((e) => e.vao), daVao = new Set(coMat.map((e) => e.sbd))
  const vang = khoi ? [...hs].filter(([sbd, h]) => h.khoi === khoi && !daVao.has(sbd)).map(([sbd, h]) => ({ sbd, ten: h.ten, lop: h.lop })) : []
  // sổ mời ra: gộp theo em — lần mời ra cuối + việc xảy ra sau đó
  const moiRa = new Map<string, { sbd: string; ten: string; lop: string; soLan: number; lan: number; gio: string; trangThai: 'cho' | 'tu-choi' | 'da-vao-lai' }>()
  // luật rời màn của buổi: `bat` / `dangBat` = nút đang bật, `daBat` = đã từng bật, `n` = số lần thầy đặt trên nút (văn phòng CHỈ nhắn nhóm về rời màn / mời ra khi `daBat`; tin kết thúc buổi thì luôn gửi)
  const luat = { daBat: false, dangBat: false, n: 0, batLuc: '' }
  for (const r of sk) {
    const sbd = str(r.sbd), loai = str(r.loai), cu = moiRa.get(sbd)
    if (loai === 'bat') { luat.daBat = true; luat.dangBat = true; luat.n = num(r.n); if (!luat.batLuc) luat.batLuc = gioVn(num(r.luc)); continue }
    if (loai === 'tat') { luat.dangBat = false; continue }
    if (loai === 'ra') { luat.daBat = true; moiRa.set(sbd, { sbd, ten: ten(sbd, str(r.ten)), lop: lop(sbd), soLan: (cu?.soLan ?? 0) + 1, lan: num(r.lan), gio: gioVn(num(r.luc)), trangThai: 'cho' }) }
    else if (cu) cu.trangThai = loai === 'tu' ? 'tu-choi' : 'da-vao-lai'
  }
  // phòng đang mở là nguồn đúng nhất của NÚT LUẬT lúc này (`/tk` trả số lần của luật, 0 = đang tắt); phòng không trả lời ⇒ theo sổ
  if (tk.ok === true && typeof tk.luat === 'number') { luat.dangBat = tk.luat > 0; if (tk.luat > 0) { luat.daBat = true; luat.n = tk.luat } }
  // tên gọi ngắn, không trùng trong buổi (em có mặt + em vắng) — văn phòng dùng thẳng trong tin
  const goi = tenGoiTheoBuoi([...coMat.map((e) => e.ten), ...vang.map((e) => e.ten), ...[...moiRa.values()].map((e) => e.ten)]), tg = (t: string): string => goi.get(t.trim()) ?? t
  return {
    ok: true, buoiId: id, ten: str(buoi.ten), khoi, moLuc: str(buoi.mo_luc), dongLuc: str(buoi.dong_luc) || null, coPhong: tk.ok === true, dangLive: tk.dangLive === true, ketThuc: tk.ketThuc === true || !!str(buoi.dong_luc),
    luat: { bat: luat.dangBat, ...luat }, siSo: khoi ? coMat.length + vang.length : coMat.length, soCoMat: coMat.length, soVang: vang.length,
    coMat: coMat.map((e) => ({ sbd: e.sbd, ten: e.ten, tenGoi: tg(e.ten), lop: e.lop, roi: e.roi })).sort((x, y) => y.roi - x.roi || x.ten.localeCompare(y.ten, 'vi')),
    roiMan: coMat.filter((e) => e.roi > 0).map((e) => ({ sbd: e.sbd, ten: e.ten, tenGoi: tg(e.ten), lop: e.lop, lan: e.roi })).sort((x, y) => y.lan - x.lan),
    moiRa: [...moiRa.values()].map((e) => ({ ...e, tenGoi: tg(e.ten) })), vang: vang.map((e) => ({ ...e, tenGoi: tg(e.ten) })).sort((x, y) => x.lop.localeCompare(y.lop, 'vi') || x.ten.localeCompare(y.ten, 'vi')),
  }
}
