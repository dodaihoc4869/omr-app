// TU LUYỆN · CHẾ ĐỘ 1 "SỬA CÂU SAI" — LUẬT MỚI (thầy lệnh 30/09, Boss chuyển nguyên văn):
//   "phần tu luyện sửa câu sai nó lấy hết câu sai ở mọi ca thi từ ngày hôm qua và chiến dịch từ ngày hôm qua cộng dồn lại xong học sinh được
//    chọn số câu để luyện, lần luyện sau câu sẽ khác lần luyện trước, sắp xếp bốc ngẫu nhiên câu khó và dễ, nếu lần luyện sau chọn số câu nhiều
//    hơn mà kho câu sai không đủ thì lấy lại trùng cũng được, nhớ gắn nhãn bạn đã luyện lại câu này mấy lần, đã sai gốc ở đâu nhé."
//
// 1. NGUỒN (chỉ ĐỌC): mọi câu em trả lời SAI ít nhất một lần từ MỐC 29/09/2026 00:00 (+07) trong sổ `su_kien_hoc`:
//      · ca kiểm tra (`nguon = 'thi'`, ca ĐÃ CÔNG BỐ, không xoá, lần làm không bị che) — sai hoặc bỏ trống (đúng như câu sai của ca);
//      · chiến dịch làm trong game (`nguon = 'game'`: Đảo thần thú / Đoàn Hộ Tống / Bi-a theo phiên) — chỉ lần trả lời SAI (`ket_qua = 0`).
//    Cộng dồn, khử trùng theo qid và NHÓM NỘI DUNG; bỏ câu tự luận, câu thuộc ca đang bảo vệ, câu đã đổi/rút khỏi kho (không còn trong chỉ mục game).
// 2. CHỌN (ở máy chủ): câu CHƯA luyện ở Tu luyện trước, rồi câu luyện ít lần nhất, rồi câu luyện lâu nhất ⇒ lần sau khác lần trước. Em xin nhiều
//    hơn kho ⇒ lấy LẶP theo cùng thứ tự (bản lặp mang mã `<qid>~2`, `~3`… để chấm riêng từng lần). Trong lượt: TRỘN câu khó và dễ, rải câu khó đều.
// 3. NHÃN mỗi câu: "Luyện lần đầu" / "Luyện lại lần K" và "Sai gốc: …" (chữ đời thường, không mã nội bộ).
// KHÔNG ghi gì ngoài hai bảng tu_luyen_* (ghi khi rút/nộp ở tu-luyen.ts); không EXP, không sổ sự kiện. Đáp án chỉ nằm trong phần RIÊNG của lượt.
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import type { CauLuyen } from '../../src/lib/bai-tap-pdf'
import { cauLuyenTuBoCau } from '../../src/lib/bai-tap-pdf'
import { laCauTuLuan } from './cam-tu-luan'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { docBaoVeKho, LOI_CHUA_KIEM_BAO_VE } from './bao-ve-kho-cong-khai'

type Row = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))

/** MỐC nguồn câu sai: 29/09/2026 00:00 giờ Việt Nam (thầy: "từ ngày hôm qua" — lệnh ngày 30/09). Hằng số, không trượt theo ngày. */
export const MOC_CAU_SAI_NGAY = '2026-09-29'
export const MOC_CAU_SAI_ISO = '2026-09-28T17:00:00.000Z'
export const LOI_KHO_CAU_SAI_TRONG = 'Từ 29/09 em chưa có câu sai nào ở ca kiểm tra hay chiến dịch. Làm thêm rồi quay lại nhé.'

/** Nguồn của một lần sai: ca kiểm tra, hoặc trò chơi trong chiến dịch. */
export type LoaiNguonSai = 'ca' | 'dao' | 'doan' | 'bia'
export interface LanSai { qid: string; loai: LoaiNguonSai; tenCa: string; tenChienDich: string; luc: string; ngay: string }

const TEN_TRO: Record<Exclude<LoaiNguonSai, 'ca'>, string> = { dao: 'Đảo thần thú', doan: 'Đoàn Hộ Tống', bia: 'Bi-a' }
const ddmm = (ngay: string) => (/^\d{4}-\d{2}-\d{2}/.test(ngay) ? `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}` : '')

/** Chữ một nguồn sai: "Ca kiểm tra Ester · 29/09" · "Chiến dịch Ôn ester · Đoàn Hộ Tống · 30/09" · "Đảo thần thú · 30/09". */
export function chuNguonSai(l: LanSai): string {
  const ngay = ddmm(l.ngay)
  const duoi = ngay ? ` · ${ngay}` : ''
  if (l.loai === 'ca') return `${l.tenCa.trim() || 'Ca kiểm tra'}${duoi}`
  return `${l.tenChienDich.trim() ? `Chiến dịch ${l.tenChienDich.trim()} · ` : ''}${TEN_TRO[l.loai]}${duoi}`
}

const khoaNguon = (l: LanSai) => (l.loai === 'ca' ? `ca|${l.tenCa}` : `${l.loai}|${l.tenChienDich}`)
const theoLuc = (a: LanSai, b: LanSai) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0)

/**
 * Nhãn "Sai gốc" của một câu. Một nguồn ⇒ lần sai ĐẦU TIÊN kể từ mốc ("Sai gốc: Ca kiểm tra Ester · 29/09").
 * Nhiều nguồn ⇒ nguồn GẦN NHẤT + "và N lần khác" (N = số lần sai còn lại kể từ mốc) — đúng chữ Boss chốt 30/09.
 */
export function nhanSaiGoc(ds: readonly LanSai[]): string {
  if (!ds.length) return ''
  const xep = [...ds].sort(theoLuc)
  if (new Set(xep.map(khoaNguon)).size <= 1) return `Sai gốc: ${chuNguonSai(xep[0]!)}`
  return `Sai gốc: ${chuNguonSai(xep[xep.length - 1]!)} và ${xep.length - 1} lần khác`
}

/** "Luyện lần đầu" (K = 1) / "Luyện lại lần K" — K = số lần câu đã có trong các lượt Tu luyện ĐÃ NỘP + 1. */
export const nhanLanLuyen = (k: number): string => (k <= 1 ? 'Luyện lần đầu' : `Luyện lại lần ${k}`)

/** Câu KHÓ để trộn: 2 sao, hoặc mức Vận dụng trở lên. */
export const laCauKho = (q: { sao?: number | null; mucDo?: string | null }): boolean => Number(q.sao) === 2 || /van_dung|vd/i.test(str(q.mucDo))

/** Mã bản lặp trong cùng lượt: `<qid>~2`. Bỏ đuôi ⇒ qid gốc (đếm lần luyện, đề bảo vệ, Hỏi thầy). */
export const qidGoc = (id: string): string => str(id).replace(/~\d+$/, '')

/** Trộn Fisher–Yates bằng `rnd` (test truyền hàm tất định). */
export function tron<T>(ds: readonly T[], rnd: () => number): T[] {
  const a = [...ds]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/**
 * XEN KẼ dễ/khó (thầy: "bốc ngẫu nhiên câu khó và dễ", Boss: "không dồn khó về một chỗ"): trộn riêng hai nhóm rồi RẢI câu khó đều trên cả lượt
 * (vị trí câu khó thứ i = ⌊(i + lệch)·n/k⌋, lệch ngẫu nhiên) — số câu khó ≤ nửa lượt thì không bao giờ có hai câu khó liền nhau.
 */
export function xenKeDeKho<T extends { kho: boolean }>(ds: readonly T[], rnd: () => number): T[] {
  const kho = tron(ds.filter((c) => c.kho), rnd)
  const de = tron(ds.filter((c) => !c.kho), rnd)
  if (!kho.length || !de.length) return [...kho, ...de]
  const n = ds.length
  const lech = rnd()
  const viTri = new Set(kho.map((_, i) => Math.min(n - 1, Math.floor(((i + lech) * n) / kho.length))))
  const ra: T[] = []
  let k = 0, d = 0
  for (let i = 0; i < n; i++) {
    if ((viTri.has(i) && k < kho.length) || d >= de.length) ra.push(kho[k++]!)
    else ra.push(de[d++]!)
  }
  return ra
}

export interface UngVienSai { qid: string; kho: boolean; soLanLuyen: number; lanCuoi: number }

/** Thứ tự ƯU TIÊN: chưa luyện → luyện ít lần nhất → luyện lâu nhất; bằng nhau thì ngẫu nhiên. */
export function thuTuUuTien<T extends UngVienSai>(ds: readonly T[], rnd: () => number): T[] {
  return tron(ds, rnd).sort((a, b) => a.soLanLuyen - b.soLanLuyen || a.lanCuoi - b.lanCuoi)
}

/** Trần số câu một lượt chế độ 1: mỗi câu lặp tối đa hai lần trong lượt (kho N câu ⇒ tối đa 2N), không quá `tran`. */
export const tranSoCauCheDo1 = (n: number, tran: number): number => Math.max(0, Math.min(tran, 2 * n))

/**
 * CHỌN `soCau` câu từ kho câu sai: lấy theo thứ tự ưu tiên; hết kho mà còn thiếu ⇒ vòng LẶP (cùng thứ tự). Mỗi vòng trộn dễ/khó riêng rồi nối lại
 * (bản lặp của một câu không đứng liền bản trước của nó). `lap` = 0 ở vòng đầu, 1 ở vòng lặp thứ nhất…
 */
export function chonCauSai<T extends UngVienSai>(ds: readonly T[], soCau: number, rnd: () => number): (T & { lap: number })[] {
  const xep = thuTuUuTien(ds, rnd)
  const ra: (T & { lap: number })[] = []
  for (let vong = 0; ra.length < soCau && xep.length; vong++) {
    const lay = xenKeDeKho(xep.slice(0, soCau - ra.length).map((c) => ({ ...c, lap: vong })), rnd)
    if (lay.length > 1 && ra.length && lay[0]!.qid === ra[ra.length - 1]!.qid) [lay[0], lay[1]] = [lay[1]!, lay[0]!]
    ra.push(...lay)
  }
  return ra
}

/** Câu kho (chỉ mục game, CÓ đáp án) → CauLuyen (khuôn Tu luyện dùng để tách câu công khai / phần riêng). */
export function cauLuyenTuCauGame(q: PrivateQuestion): CauLuyen {
  const sol = q.solution
  const loiGiai = sol && typeof sol === 'object' ? sol : typeof sol === 'string' && sol.trim() ? { chot: sol } : undefined
  const chung = {
    id: q.qid,
    text: q.text,
    mucDo: q.mucDo ?? undefined,
    loiGiai,
    thanCauImg: q.thanCauImg,
    imageDataUrl: q.imageDataUrl,
    hinhAnh: q.hinhAnh,
    table: q.table,
    canChua: q.sao === 1 || q.sao === 2 ? { sao: q.sao } : undefined,
    dang: q.dang ? { ma: q.dang, ten: q.tenDang || q.dang } : undefined,
  }
  const cau =
    q.phan === 'I' ? { ...chung, choices: q.choices, choiceImgs: q.choiceImgs, correct: q.correct }
    : q.phan === 'II' ? { ...chung, ideas: q.ideas, ideaImgs: q.ideaImgs, correct: str(q.correct).split('') }
    : { ...chung, correct: q.correct }
  return cauLuyenTuBoCau([{ phan: q.phan, maDe: q.maDe, q: cau as never }])[0]!
}

export interface CauSaiKho { qid: string; q: PrivateQuestion; lanSai: LanSai[]; kho: boolean }
export interface KhoCauSai { ds: CauSaiKho[]; tuCa: number; tuChienDich: number; loi: string }

/** Lần sai của em từ mốc (sổ `su_kien_hoc`, chỉ ĐỌC). Cột `visibility` chưa có ở CSDL cũ ⇒ đọc lại không có cột ấy. */
async function docLanSai(env: Env, sbd: string): Promise<LanSai[]> {
  const sql = (coVis: boolean) => `SELECT s.qid, s.nguon, s.luc, s.ngay_vn, ${coVis ? 's.visibility' : 'NULL AS visibility'},
      c.ten_ca, CASE WHEN s.nguon = 'thi' THEN (c.ma_ca IS NOT NULL AND COALESCE(c.trang_thai, '') <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')}) ELSE 1 END AS hop_le,
      COALESCE(json_extract(g.json, '$.bia'), 0) AS bia, json_extract(g.json, '$.doan') AS doan
    FROM su_kien_hoc s
    LEFT JOIN ca c ON s.nguon = 'thi' AND c.ma_ca = s.ma_nguon
    LEFT JOIN game_v2_session g ON s.nguon = 'game' AND g.id = s.ma_nguon
    WHERE s.sbd = ? AND s.ngay_vn >= ? AND s.luc >= ? AND s.nguon IN ('thi', 'game') AND COALESCE(s.qid, '') <> ''
      AND ((s.nguon = 'thi' AND COALESCE(s.ket_qua, 0) <> 1) OR (s.nguon = 'game' AND s.ket_qua = 0))`
  const r = await env.DB.prepare(sql(true)).bind(sbd, MOC_CAU_SAI_NGAY, MOC_CAU_SAI_ISO).all<Row>()
    .catch(() => env.DB.prepare(sql(false)).bind(sbd, MOC_CAU_SAI_NGAY, MOC_CAU_SAI_ISO).all<Row>())
  const ra: LanSai[] = []
  for (const x of r.results ?? []) {
    if (str(x.visibility) === 'embargoed' || Number(x.hop_le) !== 1) continue
    const nguon = str(x.nguon)
    const loai: LoaiNguonSai = nguon === 'thi' ? 'ca' : Number(x.bia) === 1 ? 'bia' : x.doan != null ? 'doan' : 'dao'
    ra.push({ qid: str(x.qid), loai, tenCa: loai === 'ca' ? str(x.ten_ca) : '', tenChienDich: '', luc: str(x.luc), ngay: str(x.ngay_vn) })
  }
  return ra
}

/** qid → tên chiến dịch (mới nhất trước) của CHÍNH em. Lỗi đọc ⇒ rỗng (nhãn chỉ còn tên trò). */
async function docTenChienDich(env: Env, sbd: string): Promise<Map<string, string>> {
  const r = await env.DB.prepare("SELECT ten, qid_json FROM chien_dich WHERE trang_thai <> 'da_huy' AND EXISTS (SELECT 1 FROM json_each(chien_dich.sbd_json) WHERE value = ?) ORDER BY tao_luc DESC")
    .bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))
  const ra = new Map<string, string>()
  for (const c of r.results ?? []) {
    let qids: unknown[] = []
    try { qids = JSON.parse(str(c.qid_json) || '[]') as unknown[] } catch { /* bỏ */ }
    for (const q of Array.isArray(qids) ? qids : []) if (!ra.has(str(q))) ra.set(str(q), str(c.ten))
  }
  return ra
}

/** Nội dung câu từ chỉ mục game (tờ còn, chỉ mục khớp nguồn). Câu vắng = đã đổi/rút khỏi kho ⇒ bỏ. */
async function docNoiDung(env: Env, qids: string[]): Promise<Map<string, { group: string; q: PrivateQuestion }>> {
  const ra = new Map<string, { group: string; q: PrivateQuestion }>()
  for (let i = 0; i < qids.length; i += 800) {
    const r = await env.DB.prepare(`SELECT q.qid, q.content_group, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de
        JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
       WHERE COALESCE(d.da_xoa, 0) = 0 AND q.qid IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(qids.slice(i, i + 800))).all<Row>()
    for (const x of r.results ?? []) {
      const qid = str(x.qid)
      if (ra.has(qid)) continue
      try { ra.set(qid, { group: str(x.content_group), q: JSON.parse(str(x.json)) as PrivateQuestion }) } catch { /* dòng hỏng: bỏ */ }
    }
  }
  return ra
}

/** KHO CÂU SAI của em từ mốc — khử trùng, lọc, kèm lịch sử sai từng câu. `loi` ≠ '' khi kho rỗng hoặc phải đóng cửa. */
export async function docKhoCauSai(env: Env, sbd: string): Promise<KhoCauSai> {
  const rong = (loi: string): KhoCauSai => ({ ds: [], tuCa: 0, tuChienDich: 0, loi })
  const lan = await docLanSai(env, sbd)
  if (!lan.length) return rong(LOI_KHO_CAU_SAI_TRONG)
  const tenCd = lan.some((l) => l.loai !== 'ca') ? await docTenChienDich(env, sbd) : new Map<string, string>()
  const theoQid = new Map<string, LanSai[]>()
  for (const l of lan) {
    if (l.loai !== 'ca') l.tenChienDich = tenCd.get(l.qid) ?? ''
    theoQid.set(l.qid, [...(theoQid.get(l.qid) ?? []), l])
  }
  const noiDung = await docNoiDung(env, [...theoQid.keys()])
  const baoVe = await docBaoVeKho(env)
  if (!baoVe) return rong(LOI_CHUA_KIEM_BAO_VE)
  // Khử trùng theo NHÓM NỘI DUNG: cùng một đề chép ở nhiều tờ ⇒ một câu (gộp lịch sử sai), giữ qid có lần sai gần nhất.
  const theoNhom = new Map<string, CauSaiKho>()
  for (const [qid, ds] of theoQid) {
    const nd = noiDung.get(qid)
    if (!nd || laCauTuLuan(nd.q) || baoVe.has(qid) || (nd.group && baoVe.has(nd.group))) continue
    const khoa = nd.group || `qid|${qid}`
    const cu = theoNhom.get(khoa)
    const xep = [...ds].sort(theoLuc)
    if (!cu) { theoNhom.set(khoa, { qid, q: nd.q, lanSai: xep, kho: laCauKho(nd.q) }); continue }
    const gop = [...cu.lanSai, ...xep].sort(theoLuc)
    const moiHon = xep[xep.length - 1]!.luc > cu.lanSai[cu.lanSai.length - 1]!.luc
    theoNhom.set(khoa, moiHon ? { qid, q: nd.q, lanSai: gop, kho: laCauKho(nd.q) } : { ...cu, lanSai: gop })
  }
  const ds = [...theoNhom.values()]
  if (!ds.length) return rong(LOI_KHO_CAU_SAI_TRONG)
  const tuCa = ds.filter((c) => c.lanSai[0]!.loai === 'ca').length
  return { ds, tuCa, tuChienDich: ds.length - tuCa, loi: '' }
}

/** Số lần mỗi câu (qid gốc) đã có trong lượt Tu luyện ĐÃ NỘP của em + lần gần nhất (ms). Bảng chưa có ⇒ rỗng. */
export async function docLanLuyen(env: Env, sbd: string): Promise<Map<string, { n: number; cuoi: number }>> {
  const r = await env.DB.prepare('SELECT qid, COUNT(*) AS n, MAX(nop_luc) AS cuoi FROM tu_luyen_cau WHERE sbd = ? GROUP BY qid').bind(sbd).all<Row>()
    .catch(() => ({ results: [] as Row[] }))
  const ra = new Map<string, { n: number; cuoi: number }>()
  for (const x of r.results ?? []) {
    const q = qidGoc(str(x.qid))
    const cu = ra.get(q) ?? { n: 0, cuoi: 0 }
    ra.set(q, { n: cu.n + (Number(x.n) || 0), cuoi: Math.max(cu.cuoi, Number(x.cuoi) || 0) })
  }
  return ra
}
