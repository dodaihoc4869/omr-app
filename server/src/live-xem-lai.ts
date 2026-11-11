// XEM LẠI LIVE — PHẦN CỦA PHÒNG (thầy chốt build 11/11 «Tôi không bấm gì lúc live cả, tự động làm hết»; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.3–4.7).
// Durable Object của phòng Bình Phản Ứng giữ MỘT `NhatKyXl` và chỉ gọi vào đây ở vài chỗ (mỗi chỗ một dòng):
//   · `soat(st)` mỗi lần phát view ⇒ so dấu vết, ghi DÒNG SỰ KIỆN (luật thuần src/lib/bpu/phong-nhat-ky.ts), tự chốt khi live tắt / hết buổi;
//   · `khung` / `bat` từ phần live của phòng ⇒ NHẬT KÝ NÉT chỉ-nối kèm giờ (sổ nét hiện tại bị dọn khi xoá bảng nên không dùng làm bản ghi được);
//   · `tinGhi` cho tin `live-ghi` của máy ghi (trạng thái ghi + mẫu đồng hồ máy thầy);  · `lenh` cho các cửa nội bộ `/xl-*` (cron, dựng lại, dọn).
// TẢI: lúc live 0 lệnh D1 (một lệnh ghi lúc BẬT, một lúc TẮT, chạy nền); nhật ký ghi storage GOM 1 giây, không ghi theo từng khung.
// CHỐT (máy chủ, không cần máy thầy): đọc phần đầu các khúc tiếng trên R2 ⇒ `dungBuoi` (thuần) ⇒ ghép `tieng.mp3` theo khung (nhiều phần 5 MiB, chia bước,
// chạy lại được) ⇒ `net.bin`, `su-kien.json`, `buoi.json` ⇒ MỘT lô ghi D1. Cùng đầu vào ⇒ cùng kết quả, `ban` không đổi. Khúc thô giữ 24 giờ sau lần tắt
// cuối (thầy bật live lại / khúc tải bù / mở đáp án muộn ⇒ dựng lại từ khúc gốc) rồi cron dọn.
// AN TOÀN: LỖI Ở ĐÂY KHÔNG BAO GIỜ ĐƯỢC LÀM HỎNG LIVE — mọi việc chạy nền, bọc bắt lỗi; bảng D1 chưa có ⇒ bỏ qua, live vẫn chạy.
import type { DurableObjectState, Env, R2NhieuPhan } from './kieu'
import type { TrangThaiPhong } from '../../src/lib/bpu/phong'
import { liveHetHan, liveTat } from '../../src/lib/bpu/phong-live'
import { MANH_NET_BYTE, bangVangCua, giaiNetXl, laTrangThaiGhi, maNetXl, soVet, vetRong, type DauVet } from '../../src/lib/bpu/phong-nhat-ky'
import { dungBuoi, type KhucVao, type LuotChup, type MucTieng, type NetXl, type SuKienXl } from '../../src/lib/live/xem-lai-dung'
import { docDauGon, docKhuc } from '../../src/lib/live/xem-lai-khuc'
import { TEP_LIVE } from '../../src/lib/live/xem-lai-kieu'
import { BYTE_MOI_KHUNG, catKhung, dayCam, tachKhung } from '../../src/lib/live/xem-lai-mp3'
import { chayDdlMotLan } from './ddl-mot-lan'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))

/** Công tắc `cau_hinh.live_xem_lai` — vắng dòng / JSON hỏng ⇒ BẬT (thầy 11/11 muốn dùng ngay, không bấm gì); `{"bat":false}` ⇒ tắt. */
export const KHOA_CH_XEM_LAI = 'live_xem_lai'
export function xemLaiBat(giaTri: string | null): boolean {
  if (!giaTri) return true
  try { const o = JSON.parse(giaTri) as { bat?: unknown } | null; return !(o && typeof o === 'object' && o.bat === false) } catch { return true }
}

/** Bản sao của server/migration-z-1011-live-xem-lai.sql (đúng mục 4.7) — test khoá hai bên khớp nhau. Chạy lười một lần mỗi isolate (chỉ-thêm). */
export const SQL_LIVE_XEM_LAI: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS live_buoi (id TEXT PRIMARY KEY, lop TEXT NOT NULL DEFAULT '', ngay TEXT NOT NULL, bat_luc TEXT NOT NULL, tat_luc TEXT, ten_tu_dong TEXT NOT NULL DEFAULT '', ten_thay TEXT, so_cau INTEGER NOT NULL DEFAULT 0, so_doan INTEGER NOT NULL DEFAULT 0, giay_live INTEGER NOT NULL DEFAULT 0, giay_doan INTEGER NOT NULL DEFAULT 0, byte INTEGER NOT NULL DEFAULT 0, trang_thai TEXT NOT NULL DEFAULT 'dang_ghi', tien_do INTEGER NOT NULL DEFAULT 0, quyen TEXT NOT NULL DEFAULT 'lop', ghi_giong_em INTEGER NOT NULL DEFAULT 1, ban INTEGER NOT NULL DEFAULT 1, tao_luc TEXT NOT NULL, cap_nhat TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_live_buoi_lop ON live_buoi(lop, ngay)`,
  `CREATE TABLE IF NOT EXISTS live_doan (buoi_id TEXT NOT NULL, stt INTEGER NOT NULL, loai TEXT NOT NULL, luot INTEGER, qid TEXT, ten TEXT NOT NULL, sbd_len_bang TEXT, dat INTEGER, t0 INTEGER NOT NULL, t1 INTEGER NOT NULL, giay_co_tieng INTEGER NOT NULL DEFAULT 0, so_net INTEGER NOT NULL DEFAULT 0, ti_le_dung REAL, dang_xem INTEGER NOT NULL DEFAULT 0, ly_do TEXT, PRIMARY KEY (buoi_id, stt))`,
  `CREATE INDEX IF NOT EXISTS idx_live_doan_em ON live_doan(sbd_len_bang)`,
]
export const damBaoBangLive = (env: Env): Promise<void> => chayDdlMotLan(env, 'live_xem_lai', SQL_LIVE_XEM_LAI)

export const tienToLive = (id: string): string => `live/${id}/`
export const khoaTep = (id: string, tep: string): string => `live/${id}/${tep}`
const KHOA_SU_KIEN = 'su-kien.json'
const KHOA_TAM = 'tam/tieng-du.bin'
const PHAN_BYTE = 5 * 1024 * 1024
const SK_MOI_MANH = 200
const NET_TRAN_BYTE = 24 * 1024 * 1024
const GOM_MS = 1000
/** Sau khi tắt live chờ máy ghi tải khúc cuối: máy ghi báo `xong` ⇒ chốt ngay; không báo ⇒ chốt sau ngần này. Mọi hẹn giữ DƯỚI 10 giây (phòng không còn
 *  việc gì quá 10 giây thì có thể bị dọn khỏi bộ nhớ, mất hẹn giờ); lỡ mất ⇒ cron mỗi phút chốt lại buổi `dang_xu_ly` quá 5 phút. */
export const HEN_CHOT = { tat: 8000, baoXong: 300, moMuon: 3000, taiBu: 8000 }
/** Mỗi bước chốt đọc tối đa ngần này khúc từ R2 (giới hạn yêu cầu con của một lượt chạy) rồi tự gọi bước kế. */
export const BUOC_CHOT = { khuc: 300 }
/** Máy thầy mất kết nối ngần này khi đang live ⇒ phòng tự tắt live rồi chốt (cron mỗi phút soát). */
export const MAT_THAY_MS = 180_000

export interface ChuXl {
  ctx: DurableObjectState
  env: Env
  doc(): Promise<TrangThaiPhong | null>
  nho(): TrangThaiPhong | null | undefined
  luu(henNghi?: boolean): Promise<void>
  phat(): void
  /** Ghi sớm kết quả các lượt đã mở đáp án vào `bpu_luot` (để em xem «Em làm đúng / chưa đúng» ngay sau buổi live). */
  ghiSom?(): Promise<void>
}
interface MetaXl { daLive: boolean; e: number; n: number; nByte: number; luot: number[]; mat: number | null; don: boolean; xoa: boolean }
interface CauHinhXl { bat: boolean; lop: string }
interface KetQuaChot { ban: number; bam: string; luc: number; byte: number }
interface TienTieng { bam: string; uploadId: string | null; parts: { partNumber: number; etag: string }[]; vt: number; du: number; doc: number }
const metaRong = (): MetaXl => ({ daLive: false, e: 0, n: 0, nByte: 0, luot: [], mat: null, don: false, xoa: false })

async function bam(chu: string, np: Uint8Array): Promise<string> {
  const a = new TextEncoder().encode(chu), tat = new Uint8Array(a.length + np.length)
  tat.set(a); tat.set(np, a.length)
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', tat))].slice(0, 12).map((x) => x.toString(16).padStart(2, '0')).join('')
}

/** Tên bài + tên dạng của các câu, tra từ kho lúc chốt (một đợt đọc song song). Bảng nào chưa có ⇒ coi như không tra được; không bịa. */
export async function traTenCau(env: Env, qid: readonly string[], lop: string): Promise<Record<string, { bai: string; dang: string }>> {
  const ra: Record<string, { bai: string; dang: string }> = {}
  if (!qid.length || !env.DB) return ra
  const tat = (q: string, ...b: unknown[]) => env.DB.prepare(q).bind(...b).all<Row>().then((r) => r.results ?? [], () => [] as Row[])
  const [cau, phamVi, daDay] = await Promise.all([
    tat("SELECT q.qid, q.ma_de, json_extract(q.json,'$.tenDang') AS ten_dang, (SELECT t.thu_muc FROM de_kho_thu_muc t WHERE t.ma_de = q.ma_de) AS thu_muc FROM game_v2_question q WHERE q.qid IN (SELECT value FROM json_each(?))", JSON.stringify([...new Set(qid)]))
      .then((r) => (r.length ? r : tat("SELECT q.qid, q.ma_de, json_extract(q.json,'$.tenDang') AS ten_dang, NULL AS thu_muc FROM game_v2_question q WHERE q.qid IN (SELECT value FROM json_each(?))", JSON.stringify([...new Set(qid)])))),
    tat('SELECT lop, ten_bai, ma_de_json AS ds FROM pham_vi_lop'),
    tat('SELECT lop, ten_bai, ma_to_json AS ds FROM bai_da_day WHERE bo_tick_luc IS NULL'),
  ])
  const baiCua = new Map<string, { ten: string; dungLop: boolean }>()
  for (const r of [...daDay, ...phamVi]) {
    let ds: unknown[] = []
    try { const j = JSON.parse(str(r.ds)); if (Array.isArray(j)) ds = j } catch { /* dòng hỏng */ }
    const dungLop = !!lop && str(r.lop).trim() === lop, ten = str(r.ten_bai).replace(/\s+/g, ' ').trim()
    if (!ten) continue
    for (const m of ds) { const k = str(m), cu = baiCua.get(k); if (!cu || (dungLop && !cu.dungLop)) baiCua.set(k, { ten, dungLop }) }
  }
  for (const r of cau) {
    const q = str(r.qid), cu = ra[q] ?? { bai: '', dang: '' }
    const thuMuc = str(r.thu_muc).split('/').map((x) => x.trim()).filter(Boolean)
    const tuThuMuc = [...thuMuc].reverse().find((x) => /^Bài\s/i.test(x)) ?? ''
    ra[q] = { bai: cu.bai || baiCua.get(str(r.ma_de))?.ten || tuThuMuc, dang: cu.dang || str(r.ten_dang).replace(/\s+/g, ' ').trim() }
  }
  return ra
}

export class NhatKyXl {
  private vet: DauVet | undefined
  private meta: MetaXl | undefined
  private cf: CauHinhXl | null | undefined
  private hang: Promise<unknown> = Promise.resolve()
  private skCho: SuKienXl[] = []
  private netCho: Uint8Array[] = []
  private netTong = 0
  private henXa: ReturnType<typeof setTimeout> | null = null
  private henChotH: ReturnType<typeof setTimeout> | null = null
  private dangChot = false
  private chotLai = false

  constructor(private chu: ChuXl) {}

  private get kho() { return this.chu.ctx.storage }
  private xep<T>(f: () => Promise<T>): Promise<T> { const p = this.hang.then(f, f); this.hang = p.catch(() => undefined); return p }
  private nen(p: Promise<unknown>): void { this.chu.ctx.waitUntil(p.catch((e) => console.error('[live-xem-lai]', e instanceof Error ? e.message : e))) }
  private async docMeta(): Promise<MetaXl> { return (this.meta ??= { ...metaRong(), ...((await this.kho.get<MetaXl>('xl:m')) ?? {}) }) }
  private async docCf(): Promise<CauHinhXl | null> { if (this.cf === undefined) this.cf = (await this.kho.get<CauHinhXl>('xl:cf')) ?? null; return this.cf }
  private d1(q: string, ...b: unknown[]): Promise<unknown> {
    const env = this.chu.env
    if (!env.DB) return Promise.resolve(null)
    return damBaoBangLive(env).catch(() => undefined).then(() => env.DB.prepare(q).bind(...b).run()).catch((e) => { console.error('[live-xem-lai] D1:', e instanceof Error ? e.message : e); return null })
  }

  // ── Việc phòng gọi ──
  /** `/khoi`: máy chủ nạp công tắc + lớp thật của buổi mỗi lần thầy mở phòng. Tắt ⇒ gỡ `live.ghi` (view không còn ngăn «Đang ghi»). */
  khoi(st: TrangThaiPhong, xl: unknown): void {
    const o = (xl ?? {}) as { bat?: unknown; lop?: unknown }
    if (!st.live) return
    const bat = o.bat === true && st.live.cho, lop = str(o.lop).trim().slice(0, 80)
    if (bat) st.live.ghi = st.live.ghi ?? 'tat'; else delete st.live.ghi
    if (this.cf && this.cf.bat === bat && this.cf.lop === lop) return
    this.cf = { bat, lop }
    this.nen(this.kho.put('xl:cf', this.cf))
  }

  /** Gọi mỗi lần phòng phát view (đồng bộ, rẻ): chụp dấu vết hiện tại rồi xử lý nền theo đúng thứ tự. Công tắc tắt ⇒ không làm gì. */
  soat(st: TrangThaiPhong): void {
    const lv = st.live
    if (!lv || lv.ghi === undefined) return
    if (!lv.bat && lv.ghi !== 'tat') lv.ghi = 'tat'
    const nay = Date.now(), l = st.luot
    // Bản đông cứng của đúng những trường `soVet` đọc (trạng thái thật còn đổi tiếp trước khi việc nền chạy).
    const ban = {
      ketThuc: st.ketThuc, live: { bat: lv.bat, bang: lv.bang, mic: lv.mic ? { sbd: lv.mic.sbd } : null },
      luot: l ? { so: l.so, batDau: l.batDau, qid: l.qid, phan: l.phan, tuLuan: l.tuLuan, cau: l.cau, dung: l.pha === 'mo' ? l.dung : '', giai: l.pha === 'mo' ? l.giai : null, pha: l.pha, tra: l.tra, ketQua: l.ketQua, goi: l.goi ? { sbd: l.goi.sbd, dat: l.goi.dat } : null } : null,
    } as unknown as TrangThaiPhong
    void this.xep(() => this.xuLy(ban, nay)).catch(() => undefined)
  }
  private async xuLy(ban: TrangThaiPhong, nay: number): Promise<void> {
    if (this.vet === undefined) this.vet = (await this.kho.get<DauVet>('xl:v')) ?? vetRong()
    const m = await this.docMeta()
    const r = soVet(ban, this.vet, nay)
    if (!r.suKien.length) { this.vet = r.vet; return }
    const vuaBat = r.suKien.some((e) => e.k === 'bat'), vuaTat = r.suKien.some((e) => e.k === 'tat')
    if (!m.daLive && !vuaBat) { this.vet = r.vet; return } // chưa từng live ⇒ không có gì để xem lại
    this.vet = r.vet
    if (m.xoa && vuaBat) { m.xoa = false; m.don = false } // thầy đã xoá buổi rồi live lại ⇒ ghi buổi mới từ đầu
    for (const e of r.suKien) this.skCho.push(e)
    // Ảnh chụp lượt quá lớn (đề kèm ảnh nặng) không ghi được ⇒ bỏ câu ấy khỏi bản xem lại, KHÔNG làm đứt nhật ký.
    if (r.chup) { try { await this.kho.put(`xl:l:${r.chup.so}`, r.chup); if (!m.luot.includes(r.chup.so)) m.luot.push(r.chup.so) } catch (e) { console.error('[live-xem-lai] ảnh chụp lượt lỗi:', e instanceof Error ? e.message : e) } }
    if (vuaBat) {
      m.daLive = true; m.mat = null; m.don = false
      if (this.henChotH) { clearTimeout(this.henChotH); this.henChotH = null }
      const cf = await this.docCf(), iso = new Date(nay).toISOString(), ngay = new Date(nay + 7 * 3_600_000).toISOString().slice(0, 10), id = this.chu.nho()?.buoiId ?? ''
      if (id) this.nen(this.d1(`INSERT INTO live_buoi (id, lop, ngay, bat_luc, trang_thai, quyen, tao_luc, cap_nhat) VALUES (?,?,?,?, 'dang_ghi', ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET trang_thai = 'dang_ghi', tien_do = 0, cap_nhat = excluded.cap_nhat WHERE live_buoi.trang_thai <> 'dang_xoa'`, id, cf?.lop ?? '', ngay, iso, cf?.lop ? 'lop' : 'diem_danh', iso, iso))
    }
    if (vuaTat) {
      await this.xaNgay(m)
      const id = this.chu.nho()?.buoiId ?? '', iso = new Date(nay).toISOString()
      if (id) this.nen(this.d1("UPDATE live_buoi SET trang_thai = 'dang_xu_ly', tien_do = 5, tat_luc = ?, cap_nhat = ? WHERE id = ? AND trang_thai = 'dang_ghi'", iso, iso, id))
      this.henChot(ban.ketThuc ? HEN_CHOT.moMuon : HEN_CHOT.tat)
    } else {
      // Mở đáp án SAU khi đã tắt live ⇒ câu ấy được phép hiện ⇒ dựng lại.
      if (!r.vet.bat && r.suKien.some((e) => e.k === 'mo')) this.henChot(HEN_CHOT.moMuon)
      this.henXaSau()
    }
  }

  /** Một khung sổ nét thầy gửi lúc đang live. */
  khung(k: Uint8Array, nay: number): void {
    if (this.chu.nho()?.live?.ghi === undefined || this.netTong > NET_TRAN_BYTE) return
    const b = maNetXl({ loai: 0, luc: nay, khung: k })
    this.netCho.push(b); this.netTong += b.length
    this.henXaSau()
  }
  /** Vừa bật live: mốc «làm lại» + ẢNH sổ nét đang có (bảng viết trước khi bật vẫn có trong bản xem lại). */
  bat(so: readonly Uint8Array[], nay: number): void {
    const st = this.chu.nho()
    if (!st?.live || st.live.ghi === undefined) return
    st.live.ghi = 'tat' // lần live mới: chờ máy ghi tự báo
    this.netCho.push(maNetXl({ loai: 1, luc: nay, khung: new Uint8Array(0) }))
    for (const k of so) { const b = maNetXl({ loai: 2, luc: nay, khung: k }); this.netCho.push(b); this.netTong += b.length }
    this.henXaSau()
  }
  /** Tin `live-ghi` của máy ghi: `{ tt, dh, p, xong? }`. Trả true khi trạng thái ghi đổi (phòng lưu + phát view). */
  tinGhi(st: TrangThaiPhong, j: Row, nay: number): boolean {
    const l = st.live
    if (!l || l.ghi === undefined) return false
    if (typeof j.dh === 'number' && Number.isFinite(j.dh)) { this.skCho.push({ k: 'dh', t: nay, m: j.dh, p: str(j.p).slice(0, 16) }); this.henXaSau() }
    if (j.xong === true && !l.bat) this.henChot(HEN_CHOT.baoXong)
    const tt = laTrangThaiGhi(j.tt) ? j.tt : null
    if (!tt || tt === l.ghi || (!l.bat && tt !== 'tat')) return false
    l.ghi = tt
    this.skCho.push({ k: 'ghi', t: nay, tt })
    return true
  }

  // ── Ghi storage gom 1 giây ──
  private henXaSau(): void { if (!this.henXa) this.henXa = setTimeout(() => { this.henXa = null; void this.xa().catch(() => undefined) }, GOM_MS) }
  private xa(): Promise<void> { return this.xep(async () => this.xaNgay(await this.docMeta())) }
  private async xaNgay(m: MetaXl): Promise<void> {
    if (this.henXa) { clearTimeout(this.henXa); this.henXa = null }
    const kho = this.kho
    try {
      if (this.skCho.length) {
        const ds = this.skCho; this.skCho = []
        let i = Math.max(0, m.e - 1), cur = m.e ? ((await kho.get<SuKienXl[]>(`xl:e:${i}`)) ?? []) : []
        for (const e of ds) { if (cur.length >= SK_MOI_MANH) { await kho.put(`xl:e:${i}`, cur); i += 1; cur = [] } cur.push(e) }
        await kho.put(`xl:e:${i}`, cur); m.e = i + 1
      }
      if (this.netCho.length) {
        const ds = this.netCho; this.netCho = []
        let i = Math.max(0, m.n - 1), cur: Uint8Array[] = m.n && m.nByte < MANH_NET_BYTE ? [((await kho.get<Uint8Array>(`xl:n:${i}`)) ?? new Uint8Array(0))] : []
        if (m.n && !cur.length) i += 1
        let byte = cur.reduce((s, x) => s + x.length, 0)
        const ghi = async (): Promise<void> => { const tat = new Uint8Array(byte); let o = 0; for (const x of cur) { tat.set(x, o); o += x.length } await kho.put(`xl:n:${i}`, tat) }
        for (const b of ds) { if (byte >= MANH_NET_BYTE) { await ghi(); i += 1; cur = []; byte = 0 } cur.push(b); byte += b.length }
        await ghi(); m.n = i + 1; m.nByte = byte
      }
      await kho.put('xl:m', m)
      if (this.vet) await kho.put('xl:v', this.vet)
    } catch (e) { console.error('[live-xem-lai] ghi nhật ký lỗi:', e instanceof Error ? e.message : e) }
  }

  // ── Chốt ──
  henChot(ms: number): void {
    if (this.henChotH) clearTimeout(this.henChotH)
    this.henChotH = setTimeout(() => { this.henChotH = null; this.nen(this.chot()) }, ms)
  }
  /** Chờ mọi việc ghi nhật ký đang xếp hàng xong (test). */
  xong(): Promise<void> { return this.hang.then(() => undefined) }
  /** Huỷ mọi hẹn giờ (test). */
  huyHen(): void { if (this.henChotH) clearTimeout(this.henChotH); if (this.henXa) clearTimeout(this.henXa); this.henChotH = this.henXa = null }

  async chot(o: { ep?: boolean } = {}): Promise<Row> {
    if (this.henChotH) { clearTimeout(this.henChotH); this.henChotH = null }
    if (this.dangChot) { this.chotLai = true; return { ok: true, dang: true } }
    this.dangChot = true
    let kq: Row
    try { kq = await this.chotThat(o) } catch (e) {
      console.error('[live-xem-lai] chốt lỗi:', e instanceof Error ? e.message : e)
      const id = (await this.chu.doc())?.buoiId ?? ''
      if (id) await this.d1("UPDATE live_buoi SET trang_thai = 'loi', cap_nhat = ? WHERE id = ? AND trang_thai IN ('dang_xu_ly', 'dang_ghi')", new Date().toISOString(), id)
      kq = { ok: false, lyDo: 'loi', error: e instanceof Error ? e.message : 'lỗi' }
    } finally { this.dangChot = false }
    if (this.chotLai) { this.chotLai = false; return this.chot() }
    return kq
  }
  private async chotThat(o: { ep?: boolean }): Promise<Row> {
    await this.xa()
    const st = await this.chu.doc(), m = await this.docMeta(), env = this.chu.env, de = env.DE
    if (!st) return { ok: false, lyDo: 'chua-mo' }
    const id = st.buoiId
    if (!m.daLive) return { ok: true, du: false, lyDo: 'khong-live' }
    if (m.don) return { ok: false, lyDo: 'da-don', error: 'Khúc gốc của buổi này đã được dọn nên không dựng lại được.' }
    if (st.live?.bat && !st.ketThuc) return { ok: false, lyDo: 'dang-live' }
    if (!de) return { ok: false, lyDo: 'khong-r2' }
    await this.chu.ghiSom?.().catch(() => undefined)
    const nay = Date.now()
    // Đầu vào: nhật ký của phòng + phần đầu các khúc trên R2 + tên bài / dạng + dòng D1 đang có (tên thầy đặt, bản dựng).
    const [suKien, net, luot, khuc, cf, dong, cu] = await Promise.all([
      Promise.all(Array.from({ length: m.e }, (_, i) => this.kho.get<SuKienXl[]>(`xl:e:${i}`))).then((ds) => ds.flatMap((x) => x ?? [])),
      Promise.all(Array.from({ length: m.n }, (_, i) => this.kho.get<Uint8Array>(`xl:n:${i}`))).then((ds) => ds.flatMap((x): NetXl[] => (x instanceof Uint8Array ? giaiNetXl(x) : []))),
      Promise.all(m.luot.map((so) => this.kho.get<LuotChup>(`xl:l:${so}`))).then((ds) => Object.fromEntries(ds.filter((x): x is LuotChup => !!x).map((x) => [x.so, x]))),
      this.docKhuc(id),
      this.docCf(),
      env.DB ? damBaoBangLive(env).catch(() => undefined).then(() => env.DB.prepare('SELECT ten_thay, ban, trang_thai FROM live_buoi WHERE id = ?').bind(id).first<Row>()).catch(() => null) : Promise.resolve(null),
      this.kho.get<KetQuaChot>('xl:c'),
    ])
    if (m.xoa || str(dong?.trang_thai) === 'dang_xoa') return { ok: false, lyDo: 'da-xoa' }
    const lop = cf?.lop ?? ''
    const ten = await traTenCau(env, Object.values(luot).map((x) => x.qid), lop)
    const banCu = Math.max(cu?.ban ?? 0, cu ? 0 : Number(dong?.ban) && str(dong?.trang_thai) === 'xong' ? Number(dong?.ban) : 0)
    const tenThay = str(dong?.ten_thay).trim() || null
    const v = { id, ban: 0, lop, suKien, net, khuc, luot, ds: st.ds.map((e) => ({ sbd: e.sbd, ten: e.ten, doi: e.doi })), bangVang: bangVangCua(st), ten, tenThay, nay }
    const kq = dungBuoi(v)
    if (!kq.du) {
      // Live quá ngắn / chưa có câu mở đáp án / chưa có đoạn ⇒ không tạo buổi (không hiện ở đâu). Buổi còn mở thì giữ nhật ký: thầy live tiếp sẽ dựng lại.
      if (!cu) await this.d1("DELETE FROM live_buoi WHERE id = ? AND trang_thai IN ('dang_ghi', 'dang_xu_ly', 'loi')", id)
      else await this.d1("UPDATE live_buoi SET trang_thai = 'xong', tien_do = 100, cap_nhat = ? WHERE id = ? AND trang_thai IN ('dang_ghi', 'dang_xu_ly')", new Date(nay).toISOString(), id)
      if (st.ketThuc && !cu) await this.don(false)
      return { ok: true, du: false, lyDo: kq.lyDo }
    }
    const dau = await bam(JSON.stringify(kq.buoi) + JSON.stringify(kq.tieng), kq.netBin)
    if (cu && cu.bam === dau && !o.ep) {
      await this.d1("UPDATE live_buoi SET trang_thai = 'xong', tien_do = 100, cap_nhat = ? WHERE id = ? AND trang_thai IN ('dang_ghi', 'dang_xu_ly', 'loi')", new Date(nay).toISOString(), id)
      return { ok: true, du: true, ban: cu.ban, doi: false }
    }
    const ban = banCu + 1
    kq.buoi.ban = ban
    // Tệp: tiếng (chia bước) ⇒ nét ⇒ sự kiện thô ⇒ chỉ mục trang ghi SAU CÙNG (máy em chỉ thấy bản mới khi mọi tệp đã đủ).
    if (kq.buoi.coTieng) {
      const tt = await this.ghepTieng(id, kq.tieng, dau, kq.buoi.byteTieng)
      if (tt === 'tiep') { this.tiepBuoc(id); return { ok: true, dang: true } }
    } else await de.delete(khoaTep(id, TEP_LIVE.tieng)).catch(() => undefined)
    await this.d1('UPDATE live_buoi SET tien_do = 90, cap_nhat = ? WHERE id = ? AND trang_thai = ?', new Date().toISOString(), id, 'dang_xu_ly')
    const suKienJson = JSON.stringify({ v: 1, id, ban, suKien, luot: m.luot, khuc: khuc.map((k) => ({ khoa: k.khoa, phien: k.phien, stt: k.stt, t0: k.dau.t0, kh: k.dau.kh })), matTieng: kq.matTieng })
    const buoiJson = JSON.stringify(kq.buoi)
    await de.put(khoaTep(id, TEP_LIVE.net), kq.netBin, { httpMetadata: { contentType: 'application/octet-stream' } })
    await de.put(khoaTep(id, KHOA_SU_KIEN), suKienJson, { httpMetadata: { contentType: 'application/json' } })
    await de.put(khoaTep(id, TEP_LIVE.buoi), buoiJson, { httpMetadata: { contentType: 'application/json' } })
    // Thầy xoá buổi trong lúc đang dựng ⇒ không ghi lại dòng, dọn tệp vừa ghi.
    if ((await this.docMeta()).xoa) { await xoaTienTo(env, tienToLive(id)); return { ok: false, lyDo: 'da-xoa' } }
    const b = kq.buoi, iso = new Date().toISOString(), byte = b.byteTieng + b.byteNet + new TextEncoder().encode(buoiJson).length + new TextEncoder().encode(suKienJson).length
    if (env.DB) {
      await damBaoBangLive(env).catch(() => undefined)
      const chen = () => env.DB.prepare('INSERT INTO live_doan (buoi_id, stt, loai, luot, qid, ten, sbd_len_bang, dat, t0, t1, giay_co_tieng, so_net, ti_le_dung, dang_xem, ly_do) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO live_buoi (id, lop, ngay, bat_luc, tat_luc, ten_tu_dong, so_cau, so_doan, giay_live, giay_doan, byte, trang_thai, tien_do, quyen, ghi_giong_em, ban, tao_luc, cap_nhat)
          VALUES (?,?,?,?,?,?,?,?,?,?,?, 'xong', 100, ?, 1, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET lop = excluded.lop, ngay = excluded.ngay, bat_luc = excluded.bat_luc, tat_luc = excluded.tat_luc, ten_tu_dong = excluded.ten_tu_dong, so_cau = excluded.so_cau,
            so_doan = excluded.so_doan, giay_live = excluded.giay_live, giay_doan = excluded.giay_doan, byte = excluded.byte, trang_thai = 'xong', tien_do = 100, ban = excluded.ban, cap_nhat = excluded.cap_nhat
          WHERE live_buoi.trang_thai <> 'dang_xoa'`).bind(id, b.lop, b.ngay, b.batLuc, b.tatLuc, b.tenTuDong, b.cau.length, b.doan.length, Math.round(b.msLive / 1000), Math.round(b.msDoan / 1000), byte, b.lop ? 'lop' : 'diem_danh', ban, iso, iso),
        env.DB.prepare('DELETE FROM live_doan WHERE buoi_id = ?').bind(id),
        ...kq.doan.map((d) => chen().bind(id, d.stt, d.loai, d.luot, d.qid, d.ten, d.sbd, d.dat, d.t0, d.t1, d.giayCoTieng, d.soNet, d.tiLeDung, d.dangXem, d.lyDo)),
      ])
    }
    await this.kho.put('xl:c', { ban, bam: dau, luc: nay, byte } satisfies KetQuaChot)
    return { ok: true, du: true, ban, doi: true, byte, soCau: b.cau.length, soDoan: b.doan.length }
  }
  /** Bước chốt chưa xong ⇒ tự gọi bước kế trong lượt chạy MỚI (mỗi lượt có hạn mức yêu cầu con riêng). Không có cửa tự gọi (test) ⇒ chạy tiếp tại chỗ. */
  private tiepBuoc(id: string): void {
    const env = this.chu.env
    if (env.PHONG_BPU) this.nen(env.PHONG_BPU.get(env.PHONG_BPU.idFromName(`bpu:${id}`)).fetch(new Request('https://bpu/xl-chot', { method: 'POST', body: '{}' })).then(() => undefined))
    else this.chotLai = true
  }

  /** Phần đầu của mọi khúc tiếng của buổi (đọc từ siêu dữ liệu R2 khi liệt kê; khúc thiếu siêu dữ liệu ⇒ mở tệp đọc phần đầu). */
  private async docKhuc(id: string): Promise<KhucVao[]> {
    const de = this.chu.env.DE, ra: KhucVao[] = []
    if (!de?.list) return ra
    let cursor: string | undefined
    do {
      const r = await de.list({ prefix: `${tienToLive(id)}k/`, cursor, include: ['customMetadata'] })
      for (const o of r.objects) {
        const k = /\/k\/([a-z0-9]{1,16})-(\d{1,6})\.bin$/.exec(o.key)
        if (!k) continue
        let dau = docDauGon(o.customMetadata?.d)
        if (!dau) { const t = await de.get(o.key); const b = t?.arrayBuffer ? docKhuc(new Uint8Array(await t.arrayBuffer())) : null; dau = b?.dau ?? null; if (dau && b) dau.kh = tachKhung(b.mp3).khung.length }
        if (dau) ra.push({ khoa: o.key, phien: k[1]!, stt: Number(k[2]), dau })
      }
      cursor = r.truncated ? r.cursor : undefined
    } while (cursor)
    return ra
  }

  /** Ghép `tieng.mp3` theo kế hoạch: nối khung, lấp khung câm chỗ thiếu; phần 5 MiB tải lên dần; quá hạn mức đọc ⇒ cất phần dư + tiến độ rồi trả 'tiep'. */
  private async ghepTieng(id: string, ke: readonly MucTieng[], dau: string, byteCan: number): Promise<'xong' | 'tiep'> {
    const de = this.chu.env.DE, khoa = khoaTep(id, TEP_LIVE.tieng), khoaTam = khoaTep(id, KHOA_TAM)
    let tt = await this.kho.get<TienTieng>('xl:t')
    if (tt && tt.bam !== dau) { if (tt.uploadId) await de.resumeMultipartUpload?.(khoa, tt.uploadId).abort().catch(() => undefined); tt = undefined }
    tt ??= { bam: dau, uploadId: null, parts: [], vt: 0, du: 0, doc: 0 }
    const nhieuPhan = !!de.createMultipartUpload && !!de.resumeMultipartUpload
    let dem = new Uint8Array(nhieuPhan ? PHAN_BYTE : Math.max(1, byteCan)), n = 0
    if (tt.du) { const o = await de.get(khoaTam); const b = o?.arrayBuffer ? new Uint8Array(await o.arrayBuffer()) : new Uint8Array(0); if (b.length !== tt.du) { await this.kho.delete('xl:t'); throw new Error('phần dư của tệp tiếng không khớp') } dem.set(b); n = b.length }
    let mp: R2NhieuPhan | null = tt.uploadId && de.resumeMultipartUpload ? de.resumeMultipartUpload(khoa, tt.uploadId) : null
    const day = async (b: Uint8Array): Promise<void> => {
      let o = 0
      while (o < b.length) {
        if (!nhieuPhan && n + (b.length - o) > dem.length) { const moi = new Uint8Array(Math.max(dem.length * 2, n + b.length - o)); moi.set(dem.subarray(0, n)); dem = moi }
        const c = Math.min(dem.length - n, b.length - o)
        dem.set(b.subarray(o, o + c), n); n += c; o += c
        if (nhieuPhan && n === PHAN_BYTE) {
          mp ??= await de.createMultipartUpload!(khoa, { httpMetadata: { contentType: 'audio/mpeg' } })
          tt!.uploadId = mp.uploadId
          tt!.parts.push(await mp.uploadPart(tt!.parts.length + 1, dem.slice()))
          n = 0
        }
      }
    }
    const cam = async (kh: number): Promise<void> => { for (let con = kh; con > 0; con -= 2000) await day(dayCam(Math.min(2000, con))) }
    let docLuot = 0
    for (; tt.vt < ke.length; tt.vt++) {
      const muc = ke[tt.vt]!
      if (muc.loai === 'cam') { await cam(muc.kh); continue }
      if (docLuot >= BUOC_CHOT.khuc && nhieuPhan) {
        await de.put(khoaTam, dem.slice(0, n)); tt.du = n
        await this.kho.put('xl:t', tt)
        await this.d1("UPDATE live_buoi SET tien_do = ?, cap_nhat = ? WHERE id = ? AND trang_thai = 'dang_xu_ly'", Math.min(88, 10 + Math.round((78 * tt.vt) / Math.max(1, ke.length))), new Date().toISOString(), id)
        return 'tiep'
      }
      docLuot += 1
      const can = muc.giu.reduce((s, g) => s + g[1] - g[0], 0)
      const o = await de.get(muc.khoa), k = o?.arrayBuffer ? docKhuc(new Uint8Array(await o.arrayBuffer())) : null
      if (!k) { await cam(can); continue } // khúc biến mất giữa chừng ⇒ lấp im lặng đúng thời lượng
      const lay = catKhung(k.mp3, tachKhung(k.mp3).khung, muc.giu)
      await day(lay)
      if (lay.length < can * BYTE_MOI_KHUNG) await cam(can - Math.floor(lay.length / BYTE_MOI_KHUNG))
    }
    if (!tt.parts.length) await de.put(khoa, dem.slice(0, n), { httpMetadata: { contentType: 'audio/mpeg' } })
    else { if (n) tt.parts.push(await mp!.uploadPart(tt.parts.length + 1, dem.slice(0, n))); await mp!.complete(tt.parts) }
    await this.kho.delete('xl:t')
    await de.delete(khoaTam).catch(() => undefined)
    return 'xong'
  }

  /** Dọn khúc thô + nhật ký của phòng (24 giờ sau lần tắt cuối, hoặc thầy xoá buổi). `xoa` ⇒ ghi nhớ thầy đã xoá (không dựng lại, live lại thì ghi buổi mới). */
  async don(xoa: boolean): Promise<Row> {
    if (this.henChotH) { clearTimeout(this.henChotH); this.henChotH = null }
    await this.xa()
    const m = await this.docMeta(), st = await this.chu.doc(), env = this.chu.env
    if (st && !xoa) {
      // Chỉ dọn khi tệp ghép đã ghi xong và khớp cỡ (hoặc buổi không có tiếng).
      const c = await this.kho.get<KetQuaChot>('xl:c')
      if (c && env.DE?.head) { const b = await env.DE.get(khoaTep(st.buoiId, TEP_LIVE.buoi)); if (!b) return { ok: false, lyDo: 'thieu-tep' } }
    }
    if (st && env.DE) await xoaTienTo(env, `${tienToLive(st.buoiId)}k/`).catch(() => 0)
    if (st && env.DE) await xoaTienTo(env, `${tienToLive(st.buoiId)}tam/`).catch(() => 0)
    for (let i = 0; i < m.e; i++) await this.kho.delete(`xl:e:${i}`)
    for (let i = 0; i < m.n; i++) await this.kho.delete(`xl:n:${i}`)
    for (const so of m.luot) await this.kho.delete(`xl:l:${so}`)
    for (const k of ['xl:t', 'xl:c', 'xl:v']) await this.kho.delete(k)
    this.meta = { ...metaRong(), don: true, xoa }
    this.vet = vetRong(); this.skCho = []; this.netCho = []; this.netTong = 0
    await this.kho.put('xl:m', this.meta)
    return { ok: true }
  }

  /** Cron mỗi phút soát buổi còn `dang_ghi`: máy thầy mất kết nối 3 phút (hoặc im 15 phút) khi đang live ⇒ tự tắt live rồi chốt; live đã tắt mà chưa chốt ⇒ chốt. */
  private async soatLive(): Promise<Row> {
    const st = await this.chu.doc(), m = await this.docMeta(), nay = Date.now()
    if (!st || !m.daLive) return { ok: false, lyDo: 'chua-mo' }
    if (st.live?.bat && !st.ketThuc) {
      const coThay = this.chu.ctx.getWebSockets('gv').length > 0
      if (coThay && !liveHetHan(st, nay)) { if (m.mat != null) { m.mat = null; await this.kho.put('xl:m', m) } return { ok: true, live: true } }
      if (coThay || (m.mat != null && nay - m.mat >= MAT_THAY_MS)) { if (liveTat(st, nay)) { await this.chu.luu(false); this.chu.phat() } return { ok: true, tuTat: true } }
      if (m.mat == null) { m.mat = nay; await this.kho.put('xl:m', m) }
      return { ok: true, live: true, mat: nay - (m.mat ?? nay) }
    }
    return this.chot()
  }

  /** Cửa nội bộ `/xl-*` của phòng (Worker gọi: cron, «Dựng lại», xoá buổi, khúc tải bù). */
  async lenh(duong: string, b: Row): Promise<Row> {
    try {
      if (duong === '/xl-chot') { if (b.ep === true) { const m = await this.docMeta(); if (m.don) return { ok: false, lyDo: 'da-don', error: 'Khúc gốc của buổi này đã được dọn nên không dựng lại được.' } } return await this.chot({ ep: b.ep === true }) }
      if (duong === '/xl-soat') return await this.soatLive()
      if (duong === '/xl-don') return await this.don(b.xoa === true)
      if (duong === '/xl-bu') {
        const m = await this.docMeta()
        if (m.don || m.xoa) return { ok: false, lyDo: 'da-don' }
        const st = await this.chu.doc()
        if (st && m.daLive && !(st.live?.bat && !st.ketThuc)) this.henChot(HEN_CHOT.taiBu)
        return { ok: true }
      }
      if (duong === '/xl-tt') { const m = await this.docMeta(); return { ok: true, meta: m, chot: (await this.kho.get('xl:c')) ?? null, cf: await this.docCf() } }
    } catch (e) { return { ok: false, lyDo: 'loi', error: e instanceof Error ? e.message : 'lỗi' } }
    return { ok: false, lyDo: 'khong-co' }
  }
}

/** Xoá mọi tệp R2 dưới một tiền tố (liệt kê + xoá theo lô). Trả số tệp đã xoá. Chạy lại được. */
export async function xoaTienTo(env: Env, tienTo: string): Promise<number> {
  const de = env.DE
  if (!de?.list || !/^live\/[A-Za-z0-9_-]{1,64}\//.test(tienTo)) return 0
  let dem = 0
  for (let vong = 0; vong < 50; vong++) {
    const r = await de.list({ prefix: tienTo, limit: 500 })
    if (!r.objects.length) break
    await de.delete(r.objects.map((o) => o.key))
    dem += r.objects.length
    if (!r.truncated) break
  }
  return dem
}
