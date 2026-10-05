// OMNI 3 · làn A2 — KHO GIẢ DÙNG CHUNG cho test kế hoạch ngày trên D1 thật (node:sqlite, lược đồ đủ migration — tests/_d1-that.ts).
// Không phải tệp test (không có đuôi .test.ts). Dữ liệu tất định: mã chiến dịch cố định (không gọi gvChienDich — id ngẫu nhiên).
//   Tờ (mã GỐC, khoá game_v2_question.ma_de): DH-B0 (bài đứng trước bài 1) · DH-B1 · DH-B2 · DH-B3 (bài CHƯA tick) · KHO-A (TU LUYỆN, mã không "DH-").
import { taoD1That, type D1That } from './_d1-that'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import { xoaDemChienDich, type HoSo2 } from '../server/src/srs2-d1'
import type { Env } from '../server/src/kieu'

export const NGAY_MS = 86_400_000
/** 09:00 sáng Thứ Hai 05/10/2026 giờ VN. */
export const T_SANG = Date.parse('2026-10-05T02:00:00Z')
export const HOM_NAY = '2026-10-05'
export const congNgay = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * NGAY_MS).toISOString().slice(0, 10)
/** Mốc ms của `gio` giờ VN ngày `ngay`. */
export const lucVn = (ngay: string, gio = 9): number => Date.parse(`${ngay}T00:00:00Z`) - 7 * 3_600_000 + gio * 3_600_000

export const MUC = ['NB', 'TH', 'VD', 'VDC'] as const
export const phanCua = (i: number): 'I' | 'II' | 'III' => (i % 5 === 4 ? 'II' : i % 7 === 6 ? 'III' : 'I')
export const qidCua = (maDe: string, i: number): string => `${maDe}-${i}`

export function cauJson(qid: string, maDe: string, i: number, them: Record<string, unknown> = {}): string {
  const phan = phanCua(i)
  const dang = `${maDe}.D${i % 3}`
  return JSON.stringify({
    qid, maDe, version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo: MUC[i % 4], sao: 1, kienThuc: ['k'], correct: phan === 'I' ? 'B' : phan === 'II' ? 'DSDS' : '4', reviewed: true,
    solution: { chot: `Cốt lõi ${qid}`, tungPa: {} }, ...them,
  })
}

export interface KhoOmni { d: D1That; env: Env; qids: (maDe: string) => string[] }

/** Kho giả: mỗi tờ `soCau[maDe]` câu (mặc định DH-B0 8 · DH-B1 12 · DH-B2 10 · DH-B3 8 · KHO-A 6) + 1 câu tự luận ở DH-B1; lớp 12A1 bật Hoá 2.0. */
export function taoKhoOmni(soCau: Record<string, number> = {}, soEm = 3): KhoOmni {
  const d = taoD1That()
  const env = d.env as unknown as Env
  const em = d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES(?,?,'12A1','x')")
  for (let i = 1; i <= soEm; i++) em.run(`S${i}`, `Em ${i}`)
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  const so = { 'DH-B0': 8, 'DH-B1': 12, 'DH-B2': 10, 'DH-B3': 8, 'KHO-A': 6, ...soCau }
  const theoTo = new Map<string, string[]>()
  for (const [maDe, n] of Object.entries(so)) {
    const ds: string[] = []
    for (let i = 0; i < n; i++) {
      const q = qidCua(maDe, i)
      st.run(maDe, q, 'v1', `g-${q}`, `${maDe}.D${i % 3}`, cauJson(q, maDe, i))
      ds.push(q)
    }
    theoTo.set(maDe, ds)
  }
  // câu tự luận: không bao giờ vào kế hoạch / ôn bài cũ
  st.run('DH-B1', 'DH-B1-TL', 'v1', 'g-DH-B1-TL', 'DH-B1.D0', cauJson('DH-B1-TL', 'DH-B1', 1, { text: 'Trình bày cách điều chế (tự luận)', tuLuan: true }))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  return { d, env, qids: (maDe) => [...(theoTo.get(maDe) ?? [])] }
}

export interface ChienDichGia {
  id: string; ten?: string; maDe: string[]; qids: string[]; sbd: string[]; hanNop: string; taoLuc: string
  theLuc?: number; huyetChien?: boolean; trangThai?: 'dang_chay' | 'da_dong' | 'da_huy'; batDau?: string; raiDeu?: boolean
}
/** Chèn một chiến dịch với id cố định (+ cờ rải đều / ngày bắt đầu ở bảng phụ) rồi xoá đệm danh sách chiến dịch. */
export function themChienDich(d: D1That, c: ChienDichGia): void {
  d.sql.prepare(`INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, the_luc_ngay, huyet_chien, ma_ca, tao_luc, trang_thai) VALUES (?,?,?,?,?,?,?,?,?,NULL,?,?)`)
    .run(c.id, c.ten ?? `Bài ${c.id}`, '12A1', JSON.stringify(c.sbd), JSON.stringify(c.maDe), JSON.stringify(c.qids), c.hanNop, c.theLuc ?? 40, c.huyetChien === false ? 0 : 1, c.taoLuc, c.trangThai ?? 'dang_chay')
  d.sql.exec('CREATE TABLE IF NOT EXISTS chien_dich_tuy_chon (id TEXT PRIMARY KEY, rai_deu INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL)')
  d.sql.prepare('INSERT OR REPLACE INTO chien_dich_tuy_chon (id, rai_deu, cap_nhat_luc) VALUES (?,?,?)').run(c.id, c.raiDeu === false ? 0 : 1, c.taoLuc)
  if (c.batDau) {
    d.sql.exec('CREATE TABLE IF NOT EXISTS chien_dich_bat_dau (id TEXT PRIMARY KEY, bat_dau TEXT NOT NULL)')
    d.sql.prepare('INSERT OR REPLACE INTO chien_dich_bat_dau (id, bat_dau) VALUES (?,?)').run(c.id, c.batDau)
  }
  xoaDemChienDich()
}

let demLuot = 0
/** Ghi MỘT lần làm vào sổ (mặc định nguồn game, tự làm). */
export async function lam(env: Env, sbd: string, qid: string, ms: number, dung: boolean | null, them: Partial<SuKien> = {}): Promise<void> {
  await ghiSuKien(env, [{ nguon: 'game', maNguon: `phien-${ms}-${demLuot++}`, sbd, qid, lan: 1, ketQua: dung === null ? null : dung ? 1 : 0, luc: new Date(ms).toISOString(), ...them }])
}

/**
 * Kịch bản HAI CHIẾN DỊCH: hai chiến dịch đang chạy (CD1 bài 1 hạn 07/10; CD2 bài 2 giao SAU, hạn 09/10, thể lực 30, rải đều tắt), một chiến dịch cũ đã
 * đóng (CD0: KHO-A + DH-B0), lịch sử đủ loại của S1 (nợ cũ, duy trì, câu chiến dịch đúng/sai, sai Lên bảng, sai game ngoài chiến dịch — kể cả câu bài 3
 * và câu TU LUYỆN chưa thuộc chiến dịch nào). Dùng cho test "cờ tắt ⇒ y cũ" và test OMNI.
 */
export async function dungKichBanHaiChienDich(): Promise<KhoOmni> {
  const k = taoKhoOmni()
  const { d, env } = k
  const b0 = k.qids('DH-B0'), b1 = k.qids('DH-B1'), b2 = k.qids('DH-B2'), b3 = k.qids('DH-B3'), tl = k.qids('KHO-A')
  themChienDich(d, { id: 'CD0', maDe: ['KHO-A', 'DH-B0'], qids: [...tl, ...b0], sbd: ['S1', 'S2'], hanNop: '2026-09-28', taoLuc: '2026-09-21T01:00:00.000Z', trangThai: 'da_dong', theLuc: 35 })
  themChienDich(d, { id: 'CD1', maDe: ['DH-B1'], qids: [...b1, 'DH-B1-TL'], sbd: ['S1', 'S2'], hanNop: '2026-10-07', taoLuc: '2026-10-01T01:00:00.000Z', theLuc: 40 })
  themChienDich(d, { id: 'CD2', maDe: ['DH-B2'], qids: b2, sbd: ['S1'], hanNop: '2026-10-09', taoLuc: '2026-10-03T01:00:00.000Z', theLuc: 30, raiDeu: false })
  // CD0 (cũ): nợ cũ (sai), duy trì (đúng 2 ngày), câu đúng 1 lần, câu sai
  await lam(env, 'S1', tl[0]!, lucVn('2026-09-25'), false)
  await lam(env, 'S1', tl[1]!, lucVn('2026-09-22'), true)
  await lam(env, 'S1', tl[1]!, lucVn('2026-09-24'), true)
  await lam(env, 'S1', b0[0]!, lucVn('2026-09-22'), true)
  await lam(env, 'S1', b0[1]!, lucVn('2026-09-23'), false)
  // CD1: sai / đúng một lần / thành thạo / sai tối qua
  await lam(env, 'S1', b1[0]!, lucVn('2026-10-03'), false)
  await lam(env, 'S1', b1[1]!, lucVn('2026-10-02'), true)
  await lam(env, 'S1', b1[2]!, lucVn('2026-10-02'), true)
  await lam(env, 'S1', b1[2]!, lucVn('2026-10-04'), true)
  await lam(env, 'S1', b1[3]!, lucVn('2026-10-04', 20), false)
  // CD2: sai hôm qua, đúng hôm qua
  await lam(env, 'S1', b2[0]!, lucVn('2026-10-04'), false)
  await lam(env, 'S1', b2[1]!, lucVn('2026-10-04'), true)
  // ngoài chiến dịch: sai Lên bảng (bài 3), sai game (bài 3; câu TU LUYỆN chưa thuộc chiến dịch nào)
  await lam(env, 'S1', b3[0]!, lucVn('2026-10-02'), false, { nguon: 'len_bang', maNguon: 'buoi-1' })
  await lam(env, 'S1', b3[1]!, lucVn('2026-10-01'), false)
  await lam(env, 'S1', tl[4]!, lucVn('2026-10-02'), false)
  return k
}

/** Ảnh chụp HoSo2 dạng JSON tất định (Map/Set ⇒ mảng xếp theo khoá). */
export function chupHoSo(hs: HoSo2): string {
  const theoKhoa = <V,>(m: ReadonlyMap<string, V> | undefined) => (m ? [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)) : null)
  const tap = (s: ReadonlySet<string> | undefined) => (s ? [...s].sort() : null)
  return JSON.stringify({
    chienDich: hs.chienDich, cau: hs.cau, meta: theoKhoa(hs.meta), tt: theoKhoa(hs.tt), ttChienDich: hs.ttChienDich, lanLamChienDich: hs.lanLamChienDich ?? null,
    qidCaSai: tap(hs.qidCaSai), sapBatDau: hs.sapBatDau ?? null, qidSaiTaiLop: tap(hs.qidSaiTaiLop), chienDichCuCuaCau: theoKhoa(hs.chienDichCuCuaCau), theLucNoCu: hs.theLucNoCu ?? null,
    laMoiBo: tap(hs.laMoiBo), qidSaiV2: tap(hs.qidSaiV2), loiV2: theoKhoa(hs.loiV2), songSinhCho: theoKhoa(hs.songSinhCho), boTro: theoKhoa(hs.boTro),
    khoaThem: Object.keys(hs).sort(),
  })
}
