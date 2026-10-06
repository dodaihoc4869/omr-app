// KIỂM CHỨNG CÂU ĐÃ ĐÚNG — THAY CÂU (thầy 06/10) — PHẦN MÁY CHỦ.
// Thầy: "Tôi muốn mở ca thi chọn câu đúng được thay bằng câu thay số của câu đúng đó (ghi rõ câu này thay số của câu em đã đúng ở…).
//        Các câu lý thuyết thì bạn xử lý theo cách thay thế câu lý thuyết và cũng ghi rõ nhé."
//
// `/ca/cau-thay-so` (thầy, mã bí mật) {sbd:[≤ TOI_DA_EM_CAU_THAY em], cau:{sbd:[{qid, phan, mucDo, dang, lyThuyet, bu}]}, ngay, seed}
//   ⇒ {ok, bat, em:{sbd:{<qid câu em đã đúng>: BanThayRa}}, dem:{ss, bt, ae, giu}, loi:[sbd…]}
// Máy thầy gọi SAU khi đã rút bộ câu (`rutDeDaDung`): `cau` là các câu đã chọn vào đề của em (`bu` = câu bù — không thay, chỉ để khỏi chọn trùng). Với MỖI câu em đã đúng:
//   1. CÂU TÍNH TOÁN (không lý thuyết, Phần I / III) ⇒ BẢN ĐỔI SỐ, theo thứ tự:
//        a) SONG SINH `<gốc>~ss<i>` trong `cau_bo_tro` (máy soạn + hai lượt kiểm; Phần I đủ 4 phương án, Phần III đáp số) — ưu tiên bản em CHƯA làm, gặp hết ⇒ bản gặp lâu nhất;
//        b) BIẾN THỂ BẰNG MÃ `<gốc>~bt<k>` (ban-khac-ao.ts / bien-the-sinh.ts; đáp án tính bằng mã, qua cổng kiểm của máy; cần khối em = khối câu gốc, đề không hình);
//   2. CÂU LÝ THUYẾT, Phần II, và câu tính toán chưa có bản đổi số ⇒ CÂU ANH EM đúng cách thay câu lý thuyết của thang làm lại câu sai (cau-anh-em.ts
//      `chonAnhEmChoCaDaDung` → `chonCauAnhEm`: cùng dạng, cùng phần, cùng mức hoặc kề, KHÁC nhóm nội dung, đúng khối, em chưa gặp, không câu ca bảo vệ…);
//   3. không tìm được ⇒ vắng khỏi `em` (máy thầy giữ nguyên câu em đã đúng, nhãn "Em đã làm đúng: …").
// Câu lý thuyết KHÔNG BAO GIỜ thay số (đổi số không có nghĩa) — thầy: theo cách thay câu lý thuyết.
// ĐÁP ÁN: `cau` (câu đổi số có đáp án) chỉ về máy thầy (mã bí mật) để NỐI VÀO KHO CA như câu song sinh của rút đề v2; máy em không bao giờ nhận lệnh này.
// Công tắc an toàn `cau_hinh` khoá `da_dung_thay_so`: vắng = BẬT; {"bat":false} ⇒ `bat:false`, máy thầy rút y như trước (nguyên văn câu đã đúng).
// Tất định theo (mã ca, em, câu): cùng đầu vào + cùng sổ ⇒ cùng bản thay. Chỉ ĐỌC (không ghi D1 / R2).
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { bam, type PhanV2 } from '../../src/lib/rut-de-v2'
import type { Khoi } from '../../src/lib/khoi-cau'
import { docDaGapAo, thayDaDungBat } from './cau-da-dung'
import type { BoTro } from './cau-bo-tro'
import { apSongSinh, boTroTheoQid } from './song-sinh-game'
import { SO_THU_BIEN_THE, bienTheTheoQid } from './ban-khac-ao'
import { coBoSinh } from './bien-the-sinh'
import { qidBienThe } from './loi-hoc-luat'
import { docMetaCau, ngayVnCua, type MetaCau } from './srs2-d1'
import { napDayDuMem } from './game-v2-bank'
import { docKhoiCacEmCong } from './chan-khac-khoi'
import { chuanMucDo, type CauSongSinhRa } from './rut-de-v2'

/** Nhập trễ: cau-anh-em.ts kéo theo omni-game / srs2-game (vòng nạp với tệp này nếu nhập tĩnh — như game-v2-bank.ts nhập trễ chan-doan-buoc-sai). */
const lanAnhEm = () => import('./cau-anh-em')

type Obj = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim())
const SBD_HOP_LE = /^[A-Za-z0-9_-]{1,64}$/
const HINH_HOP_LE = /^(sau_de|cuoi_cau|sau_pa_[ABCD]|sau_y_[abcd])$/

/**
 * Số em tối đa mỗi lượt gọi. ĐO THẬT 06/10 (12 em mẫu, D1 thật, scripts/do-phu-thay-so-0610.ts): mỗi em trung vị 143 truy vấn D1, lớn nhất 249 (phần câu anh em đọc theo từng dạng)
 * ⇒ 2 em ≤ ~500 truy vấn, dưới trần 1000 truy vấn phụ của một lần chạy Worker (4 em có thể chạm 996).
 */
export const TOI_DA_EM_CAU_THAY = 2
/** Số câu tối đa mỗi em (đề ca ≤ 40 câu; dư ra bị bỏ). */
export const TOI_DA_CAU_MOI_EM = 60
/** Số hạt `~bt<k>` liền nhau được xét cho MỖI câu (bỏ hạt em đã làm; thử sinh tối đa SO_THU_BIEN_THE hạt còn lại). */
const SO_HAT_BIEN_THE = SO_THU_BIEN_THE + 3

/** Một câu trong đề của em như máy thầy gửi. */
export interface YeuCauThay { qid: string; phan: PhanV2; mucDo: string; dang: string; lyThuyet: boolean; bu: boolean }
export type CachThay = 'ss' | 'bt' | 'ae'
export interface BanThayRa {
  /** ss = song sinh · bt = biến thể bằng mã · ae = câu anh em. */
  cach: CachThay
  /** `thay_so` (ss, bt) hoặc `cung_dang` (ae) — khớp `KieuThay` của src/lib/rut-de-da-dung.ts. */
  kieu: 'thay_so' | 'cung_dang'
  /** qid của câu thay TRONG ĐỀ: "<gốc>~ss<i>" · "<gốc>~bt<k>" · qid thật của câu anh em. */
  id: string
  phan: PhanV2
  mucDo: string
  dang: string
  /** Chỉ `ae`: tờ chứa câu anh em (máy thầy tìm nội dung theo qid trong kho của máy). */
  maDe?: string
  /** `ss` / `bt`: câu đổi số CÓ ĐÁP ÁN — chỉ về máy thầy, để nối vào kho ca. */
  cau?: CauSongSinhRa
}

/** Đọc `cau` của MỘT em phòng thủ: bỏ phần tử hỏng / trùng qid / qua trần. */
export function docYeuCauThay(v: unknown): YeuCauThay[] {
  if (!Array.isArray(v)) return []
  const ra: YeuCauThay[] = []
  const da = new Set<string>()
  for (const x of v.slice(0, TOI_DA_CAU_MOI_EM)) {
    if (!x || typeof x !== 'object' || Array.isArray(x)) continue
    const o = x as Obj
    const qid = chuoi(o.qid)
    const phan = o.phan === 'I' || o.phan === 'II' || o.phan === 'III' ? o.phan : null
    if (!qid || qid.length > 200 || !phan || da.has(qid)) continue
    da.add(qid)
    ra.push({ qid, phan, mucDo: chuanMucDo(o.mucDo), dang: chuoi(o.dang), lyThuyet: o.lyThuyet === true, bu: o.bu === true })
  }
  return ra
}

/** Khung câu rỗng để dùng lại `apSongSinh` (cùng cổng kiểm dữ liệu song sinh như game) khi chưa nạp câu gốc: chỉ `qid` + `phan` có nghĩa. */
const khungCau = (qid: string, phan: PhanV2): PrivateQuestion => ({
  qid, maDe: '', version: '', group: '', phan, text: '', choices: [], ideas: [], hinhAnh: [], dang: null, tenDang: '', mucDo: null, sao: null, kienThuc: [],
  correct: '', solution: null, reviewed: true,
})

/** Câu đổi số (PrivateQuestion) → dạng máy thầy nối vào kho ca (`CauSongSinhRa`, như `/ca/loi-den-han`). Phần II / thiếu đề / thiếu đáp án ⇒ null. */
export function cauThayRa(t: PrivateQuestion): CauSongSinhRa | null {
  if (!t || !t.qid || !chuoi(t.text) || !chuoi(t.correct)) return null
  if (t.phan === 'I') {
    if (!Array.isArray(t.choices) || t.choices.length !== 4 || t.choices.some((c) => !chuoi(c)) || !/^[ABCD]$/.test(chuoi(t.correct))) return null
  } else if (t.phan !== 'III') return null
  const hinh = (t.hinhAnh ?? []).filter((h) => h && h.src && HINH_HOP_LE.test(String(h.viTri))).map((h) => ({ src: h.src, viTri: h.viTri }))
  return {
    id: t.qid, phan: t.phan, text: t.text, correct: chuoi(t.correct),
    ...(t.phan === 'I' ? { choices: t.choices.map((c) => String(c)) } : {}),
    ...(Array.isArray(t.table) && t.table.length > 0 ? { table: t.table } : {}),
    ...(hinh.length > 0 ? { hinhAnh: hinh } : {}),
  }
}

/** Chọn một phần tử của `ds` (đã xếp) theo băm: ưu tiên phần tử CHƯA gặp; gặp hết ⇒ phần tử gặp lâu nhất (ngày nhỏ nhất, hoà ⇒ thứ tự). Tất định. */
function chonTheoBam<T>(ds: readonly T[], khoa: (x: T) => string, daGap: Readonly<Record<string, string>>, hat: string): T | null {
  if (ds.length === 0) return null
  const chua = ds.filter((x) => !daGap[khoa(x)])
  if (chua.length > 0) return chua[bam(hat) % chua.length]!
  return [...ds].sort((a, b) => (daGap[khoa(a)] ?? '').localeCompare(daGap[khoa(b)] ?? '') || khoa(a).localeCompare(khoa(b)))[0]!
}

/** Số lần dùng từng cách (báo máy thầy + nhật ký). */
export interface DemThay { ss: number; bt: number; ae: number; giu: number }

async function thayChoMotEm(env: Env, sbd: string, ds: readonly YeuCauThay[], ctx: { seed: string; ngay: string; nowMs: number; khoiEm: Khoi | null }): Promise<Record<string, BanThayRa>> {
  const ra: Record<string, BanThayRa> = {}
  const can = ds.filter((x) => !x.bu)
  if (can.length === 0) return ra
  const tinhToan = can.filter((x) => !x.lyThuyet && x.phan !== 'II')
  // Đọc song song: meta mọi câu trong đề (nhóm nội dung, tờ, phiên bản) + học liệu bổ trợ (song sinh) của câu tính toán.
  const [meta, boTro] = await Promise.all([
    docMetaCau(env, ds.map((x) => x.qid)),
    tinhToan.length > 0 ? boTroTheoQid(env, tinhToan.map((x) => x.qid)) : Promise.resolve(new Map<string, BoTro>()),
  ])
  // Chỉ số song sinh DÙNG ĐƯỢC của từng câu (qua đúng cổng kiểm của game: `apSongSinh`).
  const ssDung = new Map<string, number[]>()
  for (const x of tinhToan) {
    const ss = boTro.get(x.qid)?.songSinh ?? []
    const ok = ss.map((s, i) => (apSongSinh(khungCau(x.qid, x.phan), s, i) ? i : -1)).filter((i) => i >= 0)
    if (ok.length > 0) ssDung.set(x.qid, ok)
  }
  // Câu tính toán chưa có song sinh ⇒ thử biến thể bằng mã nếu dạng (theo kho game — nguồn đúng của bộ sinh) có bộ sinh.
  const dangKho = (x: YeuCauThay): string => chuoi(meta.get(x.qid)?.dang) || x.dang
  const btCan = tinhToan.filter((x) => !ssDung.has(x.qid) && dangKho(x) && coBoSinh(dangKho(x)) && meta.has(x.qid))
  const hatBt = new Map(btCan.map((x) => [x.qid, 1 + (bam(`${ctx.seed}|${sbd}|${x.qid}|bt`) % 40)] as const))
  // MỘT truy vấn (chỉ khi có gì để xét): em đã gặp những qid ảo nào (song sinh có thể dùng + các hạt biến thể xét).
  const daGap = ssDung.size > 0 || btCan.length > 0 ? await docDaGapAo(env, sbd, ctx.ngay) : {}
  // (1a) song sinh
  for (const x of tinhToan) {
    const dung = ssDung.get(x.qid)
    if (!dung) continue
    const i = chonTheoBam(dung, (k) => `${x.qid}~ss${k}`, daGap, `${ctx.seed}|${sbd}|${x.qid}|ss`)
    const ss = i === null ? undefined : boTro.get(x.qid)?.songSinh[i]
    const t = ss && i !== null ? apSongSinh(khungCau(x.qid, x.phan), ss, i) : null
    const cau = t ? cauThayRa(t) : null
    if (cau) ra[x.qid] = { cach: 'ss', kieu: 'thay_so', id: cau.id, phan: x.phan, mucDo: x.mucDo, dang: x.dang, cau }
  }
  // (1b) biến thể bằng mã — cần câu gốc đầy đủ + khối em.
  if (btCan.length > 0 && ctx.khoiEm !== null) {
    const metas = btCan.map((x) => meta.get(x.qid)!)
    const day = await napDayDuMem(env, metas.map((m) => ({ maDe: m.maDe, qid: m.qid, version: m.version }))).catch(() => new Map<string, PrivateQuestion>())
    for (const x of btCan) {
      const m = meta.get(x.qid)!
      const goc = day.get(`${m.maDe}|${m.qid}|${m.version}`)
      if (!goc) continue
      let thu = 0
      for (let j = 0; j < SO_HAT_BIEN_THE && thu < SO_THU_BIEN_THE; j++) {
        const qidAo = qidBienThe(x.qid, hatBt.get(x.qid)! + j)
        if (daGap[qidAo]) continue // em đã làm hạt này
        thu++
        const t = bienTheTheoQid(goc, qidAo, ctx.khoiEm)
        const cau = t ? cauThayRa(t) : null
        if (cau) { ra[x.qid] = { cach: 'bt', kieu: 'thay_so', id: cau.id, phan: x.phan, mucDo: x.mucDo, dang: x.dang, cau }; break }
      }
    }
  }
  // (2) câu anh em cho mọi câu còn lại (lý thuyết · Phần II · tính toán chưa có bản đổi số).
  const cho = can.filter((x) => !ra[x.qid] && meta.has(x.qid)).map((x) => meta.get(x.qid) as MetaCau)
  if (cho.length > 0) {
    const ae = await (await lanAnhEm()).chonAnhEmChoCaDaDung(env, sbd, ctx.nowMs, cho, ds.flatMap((x) => { const m = meta.get(x.qid); return m ? [m] : [] }))
    for (const [qid, { q, m }] of ae) {
      const goc = ds.find((x) => x.qid === qid)
      if (!goc || q.phan !== goc.phan) continue
      ra[qid] = { cach: 'ae', kieu: 'cung_dang', id: q.qid, phan: goc.phan, mucDo: chuanMucDo(m.mucDo) || goc.mucDo, dang: chuoi(m.dang) || goc.dang, maDe: m.maDe }
    }
  }
  return ra
}

/** `/ca/cau-thay-so` — xem đầu tệp. */
export async function cauThayDaDung(env: Env, b: Obj, nowMs: number = Date.now()): Promise<Obj> {
  const dsSbd = [...new Set((Array.isArray(b.sbd) ? b.sbd : []).map(chuoi).filter((s) => SBD_HOP_LE.test(s)))]
  if (dsSbd.length === 0) return { ok: true, bat: true, em: {}, dem: { ss: 0, bt: 0, ae: 0, giu: 0 }, loi: [] }
  if (dsSbd.length > TOI_DA_EM_CAU_THAY) return { ok: false, error: `Tối đa ${TOI_DA_EM_CAU_THAY} em mỗi lượt` }
  if (!(await thayDaDungBat(env))) return { ok: true, bat: false, em: {}, dem: { ss: 0, bt: 0, ae: 0, giu: 0 }, loi: [] }
  const cau = b.cau && typeof b.cau === 'object' && !Array.isArray(b.cau) ? (b.cau as Obj) : {}
  const ngay = /^\d{4}-\d{2}-\d{2}$/.test(chuoi(b.ngay)) ? chuoi(b.ngay) : ngayVnCua(nowMs)
  const seed = chuoi(b.seed).slice(0, 80)
  const khoi = await docKhoiCacEmCong(env, dsSbd).catch(() => new Map<string, Khoi | null>())
  const em: Record<string, Record<string, BanThayRa>> = {}
  const dem: DemThay = { ss: 0, bt: 0, ae: 0, giu: 0 }
  const loi: string[] = []
  for (const sbd of dsSbd) {
    const ds = docYeuCauThay(cau[sbd])
    try {
      const r = await thayChoMotEm(env, sbd, ds, { seed, ngay, nowMs, khoiEm: khoi.get(sbd) ?? null })
      em[sbd] = r
      for (const x of ds) { if (x.bu) continue; const t = r[x.qid]; if (t) dem[t.cach]++; else dem.giu++ }
    } catch (e) {
      console.error('[cau-thay-so] không tìm được bản thay cho một em (giữ nguyên câu):', e instanceof Error ? e.message : e)
      em[sbd] = {}
      loi.push(sbd)
      dem.giu += ds.filter((x) => !x.bu).length
    }
  }
  return { ok: true, bat: true, em, dem, loi }
}

