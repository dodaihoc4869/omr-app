// CHẨN ĐOÁN BƯỚC SAI TRƯỚC KHI LÀM LẠI (06/10, lệnh thầy "Làm chuẩn đoán bước sai") — SO-VIEC-OMNI-3.md dòng 43 (1), 46, 155; đặc tả DAC-TA-BUILD-OMNI-3-0510.md
// mục 1 bước 5–6; ghi chú thiết kế (vị trí chèn, ghi sổ, công tắc): docs/chan-doan-buoc-sai-0610.md.
//
// KHI NÀO: chuyến Đảo / chặng Đoàn (kế hoạch ngày: srs2-game `napLuot` → cau-anh-em `apLamLaiKhac`) sắp phát LƯỢT LÀM LẠI ĐẦU TIÊN của câu lỗi Q trong cửa sổ lỗi
// hiện tại — `phatLaiLoi` trạng thái 'mo' (chưa có lượt tự làm nào sau lần sai cuối) — mà Q CHƯA được chẩn đoán sau lần sai cuối (`HoSo2.chanDoanXong`) ⇒ THAY lượt ấy
// bằng MỘT câu chẩn đoán; lượt làm lại của Q DỜI sang lần phát kế. KHÔNG cộng câu: độ dài chuyến (6 ải) và số câu kế hoạch ngày không đổi — câu chẩn đoán chiếm
// đúng chỗ của Q (sổ ghi `raw_json.tc = Q` ⇒ `docDemHomNay` tính chỗ của Q đã làm hôm nay).
// CÂU CHẨN ĐOÁN — một CÂU THƯỜNG qua đường sẵn có (`publicQuestion`, vai 'on_lai', chấm ở máy chủ khi nộp; giao diện / kiểu màn không đổi):
//   (a) Q có bước tính `nen:<nhãn>` mà nhãn có BỘ SINH câu nền (omni-cau-nen-sinh.ts) ⇒ MỘT câu nền sinh bằng mã của bước YẾU NHẤT: bước em TỰ KHAI trước
//       (omni_buoc_sai — luật omni-buoc-sai-uu-tien.ts: 14 ngày, nhiều dòng → gần nhất → P thấp), rồi P thấp nhất. qid `nen:sinh.<nhãn>.<số>` (đúng mã câu của bảng
//       `cau_nen`; số = băm tất định (em, Q, lần sai cuối)); 'tn' ⇒ Phần I, 'so' ⇒ Phần III (chấm như câu nền: khớp đáp án hoặc lệch ≤ 0,5 % giá trị đúng).
//   (b) không có (a) và Q Phần I (lý thuyết) ⇒ "CHÌA KHOÁ + 2 Ý Đ/S CÙNG KIẾN THỨC" từ kho ý Đ–S (cau_y_ds) CHỈ KHI có ≥ 2 ý của MỘT đề dẫn CÙNG DẠNG với Q (đúng khối,
//       đề không hình, không câu nghi đáp án, có chìa khoá = kiến thức cốt lõi của đề dẫn); kho rỗng / thiếu ⇒ KHÔNG chèn (lặng lẽ, không lỗi). Câu Phần I: đề dẫn +
//       "Chìa khoá: …" + hai phát biểu; bốn phương án = bốn tổ hợp Đúng/Sai. qid `nen:yds.<băm>.<stt1>.<stt2>`.
//   Không có (a)/(b) ⇒ không chèn: lượt làm lại như hôm nay.
// TRẦN: ≤ CHAN_DOAN_TOI_DA_LUOT câu mỗi chuyến / chặng, mỗi nhãn (đề dẫn) một câu; KHÔNG chèn vào ải TRÙM (câu cuối chuyến Đảo đủ 6 ải — thầy: Trùm là câu khó nhất).
// GIẢI MÃ khi chấm / resume / Đoàn (game-v2-bank `docCauTheoRef`, `napDayDuMem` — nhập trễ tệp này): sinh lại bằng mã từ qid (a) / đọc lại kho ý chỉ-thêm (b);
// `version` của ref = băm NỘI DUNG lúc phát ⇒ nội dung sinh lại khác (bộ sinh đổi) ⇒ null ("câu đổi": máy em bỏ qua, không tính sai) — không bao giờ chấm theo câu khác.
// GHI SỔ (game-v2.ts `answer`): nguon 'game' (câu của chuyến) + purpose 'chan_doan' + raw {chon, tc: Q, cd: 1, …OMNI}: OMNI phát lại coi là QUAN SÁT của vi kỹ năng nó
// kiểm (`nen:<nhãn>` — omni-d1 `qTuKho`; câu (b): `dang:<dạng>` theo cột dạng của sổ) ⇒ P cập nhật; mọi bộ đọc "lần làm" bỏ qua (`SQL_LA_LAN_LAM`, `lanLamTuDongTc`,
// tiền tố `nen:`) ⇒ KHÔNG tính cho luật đóng lỗi của Q. Em làm SAI ⇒ thêm một dòng `omni_buoc_sai` (bước = vi kỹ năng của câu) như em tự khai ⇒ Trạm / chẩn đoán
// lần sau ưu tiên bước đó.
// CÔNG TẮC: `cau_hinh` khoá `chan_doan_buoc_sai` — vắng / không đọc được ⇒ BẬT; `{"bat":false}` ⇒ y hệt hôm nay. CHỈ chạy khi OMNI bật cho em (`HoSo2.omni`).
// KHÔNG chèn ở Bi-a, vé thử thách, Tu luyện, Trạm (nơi gọi không truyền tuỳ chọn chẩn đoán) — đường hôm nay.
import type { Env } from './kieu'
import { grade, type PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { hashSeed } from '../../src/lib/exam-shuffle'
import { khoiCuaCau, khoiCuaMaDe, type Khoi } from '../../src/lib/khoi-cau'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import { docCauHinhDem } from './cau-hinh-dem'
import { khoiDaLocCua } from './chan-khac-khoi'
import { TEN_NEN, chamCauNen } from './thang-tu-go'
import { coBoSinh as coBoSinhNen, sinhCauNen, soCauKhongGian, type CauNenSinh } from './omni-cau-nen-sinh'
import { hoSoOmniEm, qCuaCau } from './omni-d1'
import { THAM_SO_OMNI, type QCau } from './omni-kieu'
import { chonBuocTuKhai, docBuocSaiGanDay, type DongBuocSai } from './omni-buoc-sai-uu-tien'
import { TRAN_BUOC_SAI_NGAY, damBaoBangCanThan } from './omni-can-than'
import { laQidChanDoan, nhanQidChanDoan, type LamLaiRef } from './lam-lai-so'
import { tachSongSinh } from './loi-hoc-luat'
import { deCoHinh } from './ban-khac-ao'
import type { HoSo2, MetaCau } from './srs2-d1'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))

/** Khoá `cau_hinh` công tắc khẩn. */
export const KHOA_CHAN_DOAN = 'chan_doan_buoc_sai'
/** Số câu chẩn đoán tối đa trong MỘT chuyến Đảo / chặng Đoàn (phần còn lại của chuyến vẫn là câu thật). */
export const CHAN_DOAN_TOI_DA_LUOT = 2
const NHAN_HOP_LE = /^[a-z][a-z0-9_]{1,39}$/
const CHU = ['A', 'B', 'C', 'D'] as const
const hex = (s: string): string => `${hashSeed(s).toString(16).padStart(8, '0')}${hashSeed(`#${s}`).toString(16).padStart(8, '0')}`

/** Công tắc: vắng dòng / JSON hỏng ⇒ BẬT; chỉ `{"bat":false}` tắt (đệm 15 s trong isolate như mọi cờ). */
export async function chanDoanBat(env: Env): Promise<boolean> {
  const v = await docCauHinhDem(env, KHOA_CHAN_DOAN).catch(() => null)
  if (v == null) return true
  try { const o = JSON.parse(v) as unknown; return !(!!o && typeof o === 'object' && !Array.isArray(o) && (o as Row).bat === false) } catch { return true }
}

// ---------------------------------------------------------------- điều kiện (thuần)
/**
 * KHỐI câu chẩn đoán sẽ mang (thuần): câu chẩn đoán phải qua MỌI cổng khối y như câu lỗi — lúc phát (`chanKhacKhoiEm`, câu đầy đủ) và lúc chấm / resume / Đoàn (cổng
 * `luot_cu` chỉ thấy ref {qid, maDe}: qid `nen:…` không mang khối, D1 không có dòng) ⇒ khối phải đọc được từ MÃ TỜ của câu lỗi và (hồ sơ đã lọc khối) bằng khối em.
 * Em chưa rõ khối (hồ sơ đã lọc ⇒ `null`: cổng chỉ giữ câu thầy giao) / tờ không mang khối trong mã (vd. tờ "100") / khác khối ⇒ null ⇒ KHÔNG chèn (lượt làm lại như
 * hôm nay) — thà bỏ chẩn đoán còn hơn làm hụt một ải. Hồ sơ chưa qua bộ lọc khối (`undefined`, chỉ ở test thuần) ⇒ chỉ đòi khối tờ đọc được.
 */
function khoiChoChanDoan(hs: Pick<HoSo2, 'meta'>, maDe: unknown): Khoi | null {
  const kEm = khoiDaLocCua(hs.meta), kTo = khoiCuaMaDe(maDe)
  return kEm === null || kTo === null || (kEm !== undefined && kTo !== kEm) ? null : kTo
}
/**
 * Câu lỗi Q đủ điều kiện chẩn đoán ở lượt này: qid thật (không phải bản khác / câu chẩn đoán), lỗi MỞ ('mo' = lượt làm lại đầu tiên sau lần sai tự làm cuối),
 * chưa chẩn đoán sau lần sai cuối, có siêu dữ liệu, không tự luận, khối tờ đọc được từ mã và đúng khối em (`khoiChoChanDoan`).
 */
export function canChanDoan(hs: Pick<HoSo2, 'loiV2' | 'chanDoanXong' | 'meta'>, qid: string): boolean {
  if (!qid || laQidChanDoan(qid) || tachSongSinh(qid).songSinh !== null) return false
  if (hs.loiV2?.get(qid)?.trangThai !== 'mo' || hs.chanDoanXong?.has(qid)) return false
  const m = hs.meta.get(qid)
  return !!m && !m.tuLuan && khoiChoChanDoan(hs, m.maDe) !== null
}

// ---------------------------------------------------------------- câu chẩn đoán (a): câu nền sinh bằng mã
/** Câu nền sinh bằng mã ⇒ câu game. `version` = băm NỘI DUNG (qid + đề + phương án + đáp án) ⇒ giải mã kiểm được câu sinh lại đúng câu đã phát. Không lắp được ⇒ null. */
export function cauTuCauNen(c: CauNenSinh, maDe: string, lop?: unknown): PrivateQuestion | null {
  const tn = c.kieu === 'tn'
  const choices = tn ? CHU.map((k) => str(c.pa?.[k]).trim()) : []
  if (tn && (choices.some((x) => !x) || !/^[ABCD]$/.test(c.dap_an))) return null
  if (!str(c.de).trim() || !str(c.dap_an).trim()) return null
  const ten = TEN_NEN[c.nhan] ?? 'Kiến thức nền'
  const q = {
    qid: `nen:${c.id}`, maDe, version: `cd-${hex(JSON.stringify([c.id, c.de, choices, c.dap_an]))}`, group: `nen:${c.nhan}`,
    phan: tn ? 'I' : 'III', text: c.de, choices, ideas: [], hinhAnh: [], dang: null, tenDang: ten, mucDo: c.muc === 1 ? 'NB' : 'TH', sao: 1, kienThuc: [], family: null,
    correct: c.dap_an, reviewed: true,
    solution: { chot: str(c.meo).trim() || ten, buoc: [...c.giai], ket_qua: c.dap_an, dap_an_de: c.dap_an, chan_doan: { nhan: c.nhan, gtd: str(c.gia_tri_dung) } },
    ...(lop !== undefined && lop !== null && lop !== '' ? { lop } : {}),
  } as unknown as PrivateQuestion
  return laCauTuLuan(q) ? null : q
}

// ---------------------------------------------------------------- câu chẩn đoán (b): chìa khoá + 2 ý Đ/S (kho ý)
/** Một ý Đ–S của kho dùng cho chẩn đoán. `d` là ĐÁP ÁN — chỉ ở máy chủ. */
export interface YChanDoan { stt: number; t: string; d: 'D' | 'S'; lyDo: string }
/** Các ý (cùng băm = cùng đề dẫn) + đề dẫn của câu mẫu trong kho. */
export interface NhomYChanDoan { bam: string; dang: string; tenDang: string; lop: string; de: string; chot: string; coHinh: boolean; ys: YChanDoan[] }
const chotTu = (sol: unknown): string => {
  let o: unknown = sol
  if (typeof o === 'string') { const s = o.trim(); if (!s.startsWith('{')) return ''; try { o = JSON.parse(s) } catch { return '' } }
  const c = o && typeof o === 'object' ? (o as Row).chot : null
  return typeof c === 'string' && c.trim() && !c.includes('[object Object]') ? c.trim() : ''
}
const mangHinh = (v: unknown): { viTri: string }[] => {
  try { const a = typeof v === 'string' ? JSON.parse(v) as unknown : v; return Array.isArray(a) ? a.map((h) => ({ viTri: str((h as Row)?.viTri) })) : [] } catch { return [] }
}
/** Dòng truy vấn (cau_y_ds ⋈ game_v2_question) ⇒ nhóm theo băm; bỏ trùng (bam, stt) do một câu mẫu có nhiều dòng kho. Thuần. */
export function nhomYTuDong(rows: readonly Row[]): NhomYChanDoan[] {
  const theo = new Map<string, NhomYChanDoan>()
  for (const x of rows) {
    const bam = str(x.bam), stt = Number(x.stt), t = str(x.noi_dung).trim(), d = str(x.gia_tri)
    if (!bam || !Number.isInteger(stt) || !t || (d !== 'D' && d !== 'S')) continue
    let n = theo.get(bam)
    if (!n) {
      const ideaImgs = (() => { try { const a = typeof x.yimg === 'string' ? JSON.parse(x.yimg) as unknown : x.yimg; return Array.isArray(a) ? a.map(String) : [] } catch { return [] } })()
      n = {
        bam, dang: str(x.dang), tenDang: str(x.ten_dang), lop: str(x.lop), de: str(x.de).trim(), chot: chotTu(x.sol),
        coHinh: deCoHinh({ thanCauImg: str(x.tci) || undefined, imageDataUrl: str(x.img) || undefined, hinhAnh: mangHinh(x.hinh) as PrivateQuestion['hinhAnh'], ideaImgs }),
        ys: [],
      }
      theo.set(bam, n)
    }
    if (!n.ys.some((y) => y.stt === stt)) n.ys.push({ stt, t, d, lyDo: str(x.ly_do).trim() })
  }
  for (const n of theo.values()) n.ys.sort((a, b) => a.stt - b.stt)
  return [...theo.values()]
}
const COT_Y = `y.bam, y.stt, y.noi_dung, y.gia_tri, y.ly_do, y.lop, q.dang AS dang, json_extract(q.json,'$.tenDang') AS ten_dang, json_extract(q.json,'$.text') AS de,
  json_extract(q.json,'$.solution') AS sol, json_extract(q.json,'$.thanCauImg') AS tci, json_extract(q.json,'$.imageDataUrl') AS img, json_extract(q.json,'$.hinhAnh') AS hinh,
  json_extract(q.json,'$.ideaImgs') AS yimg`
const KHONG_NGHI = "AND NOT EXISTS (SELECT 1 FROM loi_giai_cau lc JOIN cau_nghi_dap_an n ON n.qid = lc.qid AND n.trang_thai = 'nghi' WHERE lc.bam = y.bam)"
async function hoiYAnToan(env: Env, sql: (nghi: boolean) => string, ...tham: unknown[]): Promise<Row[]> {
  try { return (await env.DB.prepare(sql(true)).bind(...tham).all<Row>()).results ?? [] } catch {
    // Bảng câu nghi chưa có ⇒ không có câu nghi nào; bảng ý chưa có (kho rỗng) ⇒ rỗng — không ném, không tạo bảng.
    try { return (await env.DB.prepare(sql(false)).bind(...tham).all<Row>()).results ?? [] } catch { return [] }
  }
}
/** Ý Đ–S của các đề dẫn THUỘC các dạng (một truy vấn; kho rỗng / bảng chưa có ⇒ []). */
export async function docYChoChanDoan(env: Env, dangs: readonly string[]): Promise<NhomYChanDoan[]> {
  const ds = [...new Set(dangs.filter(Boolean))]
  if (!ds.length) return []
  const sql = (nghi: boolean) => `SELECT ${COT_Y} FROM cau_y_ds y JOIN game_v2_question q ON q.qid = y.qid_mau
    WHERE q.dang IN (SELECT value FROM json_each(?)) ${nghi ? KHONG_NGHI : ''} ORDER BY y.bam, y.stt LIMIT 600`
  return nhomYTuDong(await hoiYAnToan(env, sql, JSON.stringify(ds)))
}
/** Hai ý của một đề dẫn theo (băm, stt) — giải mã câu (b). Thiếu ⇒ null. */
async function docHaiY(env: Env, bam: string, stt: readonly [number, number]): Promise<NhomYChanDoan | null> {
  const sql = (nghi: boolean) => `SELECT ${COT_Y} FROM cau_y_ds y LEFT JOIN game_v2_question q ON q.qid = y.qid_mau WHERE y.bam = ? AND y.stt IN (?, ?) ${nghi ? KHONG_NGHI : ''} ORDER BY y.stt`
  const [n] = nhomYTuDong(await hoiYAnToan(env, sql, bam, stt[0], stt[1]))
  return n && stt.every((s) => n.ys.some((y) => y.stt === s)) ? n : null
}
/** Câu (b) — Phần I: đề dẫn + chìa khoá + hai phát biểu; bốn phương án là bốn tổ hợp Đúng/Sai. `version` = băm nội dung. Thuần. */
export function cauTuHaiY(n: NhomYChanDoan, y1: YChanDoan, y2: YChanDoan, maDe: string, lop?: unknown): PrivateQuestion | null {
  if (!n.de || !n.chot || n.coHinh || !n.dang) return null
  const text = `${n.de}\n\nChìa khoá: ${n.chot}\n\nXét hai phát biểu sau:\n(1) ${y1.t}\n(2) ${y2.t}`
  const choices = ['Cả (1) và (2) đều đúng.', 'Chỉ (1) đúng.', 'Chỉ (2) đúng.', 'Cả (1) và (2) đều sai.']
  const correct = y1.d === 'D' ? (y2.d === 'D' ? 'A' : 'B') : (y2.d === 'D' ? 'C' : 'D')
  const vi = (y: YChanDoan, i: number) => `(${i}) ${y.d === 'D' ? 'Đúng' : 'Sai'}${y.lyDo ? `: ${y.lyDo}` : '.'}`
  const q = {
    qid: `nen:yds.${n.bam}.${y1.stt}.${y2.stt}`, maDe, version: `cd-${hex(JSON.stringify([text, choices, correct]))}`, group: `nen:yds.${n.bam}`,
    phan: 'I', text, choices, ideas: [], hinhAnh: [], dang: n.dang, tenDang: n.tenDang || n.dang, mucDo: 'TH', sao: 1, kienThuc: [], family: null,
    correct, reviewed: true, solution: { chot: n.chot, buoc: [vi(y1, 1), vi(y2, 2)], ket_qua: correct, chan_doan: true },
    ...(lop !== undefined && lop !== null && lop !== '' ? { lop } : {}),
  } as unknown as PrivateQuestion
  return laCauTuLuan(q) ? null : q
}

// ---------------------------------------------------------------- đọc sớm + chọn cho một lượt
/** Dữ liệu chọn câu chẩn đoán của một lượt (đọc MỘT đợt song song): ma trận Q của câu ứng viên, P của em, bước em tự khai, ý Đ–S cùng dạng (chỉ khi có câu lý thuyết). */
export interface DuLieuChanDoan { q: Map<string, QCau>; p: Record<string, number>; khai: DongBuocSai[]; y: NhomYChanDoan[] }
/**
 * ĐỌC SỚM (gọi lúc biết câu của lượt, CÙNG đợt nạp câu — srs2-game `napLuot`): OMNI tắt cho em / không câu ứng viên ⇒ undefined (không đọc gì). Công tắc tắt ⇒ null.
 * Đọc lỗi ⇒ null (không chèn — đường hôm nay). Không ghi gì.
 */
export function batDauChanDoan(env: Env, hs: Pick<HoSo2, 'loiV2' | 'chanDoanXong' | 'meta' | 'omni'>, qids: readonly string[], sbd: string, nowMs: number): Promise<DuLieuChanDoan | null> | undefined {
  if (!hs.omni?.bat) return undefined
  const ung = [...new Set(qids)].filter((q) => canChanDoan(hs, q))
  if (!ung.length) return undefined
  const dangLyThuyet = [...new Set(ung.map((q) => hs.meta.get(q)!).filter((m) => m.phan === 'I' && !!m.dang).map((m) => m.dang!))]
  const p = (async (): Promise<DuLieuChanDoan | null> => {
    if (!(await chanDoanBat(env))) return null
    const [q, ho, khai, y] = await Promise.all([qCuaCau(env, ung), hoSoOmniEm(env, sbd, nowMs).catch(() => null), docBuocSaiGanDay(env, sbd, nowMs), docYChoChanDoan(env, dangLyThuyet)])
    return { q, p: Object.fromEntries(Object.entries(ho?.vkn ?? {}).map(([k, v]) => [k, v.p])), khai, y }
  })().catch((e: unknown) => { console.error('[chan-doan] đọc dữ liệu chẩn đoán lỗi (không chèn):', e instanceof Error ? e.message : e); return null })
  return p
}

/**
 * Một câu chẩn đoán cho câu lỗi `goc` (thuần): (a) câu nền của bước yếu nhất (bước tự khai trước), rồi (b) chìa khoá + 2 ý (chỉ Phần I). `q` = câu của lượt (câu gốc hoặc bản
 * song sinh của nó — cùng phần / dạng / tờ / khối); `daDung` = nhãn / đề dẫn đã dùng trong lượt.
 */
export function taoCauChanDoan(du: DuLieuChanDoan, goc: string, q: PrivateQuestion, muoi: string, daDung: ReadonlySet<string>): { q: PrivateQuestion; khoa: string } | null {
  const pCua = (k: string): number => du.p[k] ?? THAM_SO_OMNI.P0
  const lop = (q as unknown as Row).lop
  const qc = du.q.get(goc)
  const kn = qc ? [...new Set([...qc.vkn, ...(qc.vknY ?? []).flat()])] : []
  const nen = kn.filter((k) => k.startsWith('nen:') && !daDung.has(k)).filter((k) => { const nh = k.slice(4); return NHAN_HOP_LE.test(nh) && coBoSinhNen(nh) && soCauKhongGian(nh) > 0 })
  if (nen.length) {
    const k = chonBuocTuKhai(du.khai, nen, pCua) ?? [...nen].sort((a, b) => pCua(a) - pCua(b) || (a < b ? -1 : a > b ? 1 : 0))[0]!
    const nhan = k.slice(4)
    const c = sinhCauNen(nhan, 1 + (hashSeed(`${muoi}|${nhan}`) % soCauKhongGian(nhan)))
    const d = c ? cauTuCauNen(c, q.maDe, lop) : null
    if (d) return { q: d, khoa: k }
  }
  if (q.phan !== 'I' || !q.dang) return null
  const khoi = khoiCuaCau(q)
  if (khoi === null) return null
  const nhom = du.y.filter((n) => n.dang === q.dang && n.lop === String(khoi) && !n.coHinh && !!n.chot && !!n.de && n.ys.length >= 2 && !daDung.has(`yds:${n.bam}`))
    .sort((a, b) => hashSeed(`${muoi}|${a.bam}`) - hashSeed(`${muoi}|${b.bam}`) || (a.bam < b.bam ? -1 : 1))
  for (const n of nhom) {
    const [y1, y2] = [...n.ys].sort((a, b) => hashSeed(`${muoi}|${a.stt}`) - hashSeed(`${muoi}|${b.stt}`) || a.stt - b.stt)
    const d = cauTuHaiY(n, y1!, y2!, q.maDe, lop)
    if (d) return { q: d, khoa: `yds:${n.bam}` }
  }
  return null
}

/**
 * Chỗ nào của lượt (đúng thứ tự `ds` sau đan xen; câu có thể đã là bản song sinh của câu lỗi) nhận câu chẩn đoán: câu lỗi đủ điều kiện (`canChanDoan`, xét theo câu GỐC),
 * không phải ải Trùm (`boCuoiKhiDu` = số câu của lượt đủ ⇒ câu cuối là Trùm), mỗi nhãn / đề dẫn một câu, tối đa CHAN_DOAN_TOI_DA_LUOT.
 * Muối = (em, Q, ngày sai cuối) ⇒ tất định (chuyến chờ / resume sinh lại đúng câu). Thuần.
 */
export function chonChanDoanTrongLuot(du: DuLieuChanDoan, ds: readonly { q: PrivateQuestion; m: MetaCau }[], hs: Pick<HoSo2, 'loiV2' | 'chanDoanXong' | 'meta'>, sbd: string, boCuoiKhiDu?: number): Map<number, { q: PrivateQuestion; m: MetaCau; lamLai: LamLaiRef }> {
  const ra = new Map<number, { q: PrivateQuestion; m: MetaCau; lamLai: LamLaiRef }>()
  const daDung = new Set<string>()
  for (let i = 0; i < ds.length && ra.size < CHAN_DOAN_TOI_DA_LUOT; i++) {
    if (boCuoiKhiDu && ds.length === boCuoiKhiDu && i === ds.length - 1) continue
    const { q, m } = ds[i]!
    if (laQidChanDoan(q.qid)) continue
    const goc = tachSongSinh(q.qid).goc
    if (!canChanDoan(hs, goc)) continue
    // Khối theo tờ của CÂU ĐANG PHÁT (câu chẩn đoán mang `maDe` ấy); câu chẩn đoán đầy đủ phải ra đúng khối đó (không mâu thuẫn với `lop` chép từ câu lỗi).
    const k = khoiChoChanDoan(hs, q.maDe)
    if (k === null) continue
    const d = taoCauChanDoan(du, goc, q, `${sbd}|${goc}|${hs.loiV2?.get(goc)?.saiCuoi ?? ''}|chan_doan`, daDung)
    if (!d || khoiCuaCau(d.q) !== k) continue
    daDung.add(d.khoa)
    ra.set(i, { q: d.q, m: { ...m, qid: d.q.qid, version: d.q.version, group: d.q.group, phan: d.q.phan, mucDo: d.q.mucDo, dang: d.q.dang, tenDang: d.q.tenDang, sao: 1, tuLuan: false }, lamLai: { tc: goc, cd: 1 } })
  }
  return ra
}

// ---------------------------------------------------------------- giải mã (chấm / resume / Đoàn) + chấm + ghi bước sai
/** Câu chẩn đoán theo ref phiên (`qid`, `maDe`, `version`). Nội dung sinh lại khác lúc phát / thiếu ý ⇒ null (nơi gọi coi như câu đổi — không chấm theo câu khác). */
export async function giaiCauChanDoan(env: Env, ref: { qid: string; maDe: string; version: string }): Promise<PrivateQuestion | null> {
  if (!laQidChanDoan(ref.qid)) return null
  const nhan = nhanQidChanDoan(ref.qid)
  if (nhan) {
    const so = Number(/\.(\d+)$/.exec(ref.qid)![1])
    const c = coBoSinhNen(nhan) ? sinhCauNen(nhan, so) : null
    const d = c && `nen:${c.id}` === ref.qid ? cauTuCauNen(c, ref.maDe) : null
    return d && d.version === ref.version ? d : null
  }
  const m = /^nen:yds\.([0-9a-f]{16})\.(\d+)\.(\d+)$/.exec(ref.qid)!
  const stt: [number, number] = [Number(m[2]), Number(m[3])]
  const n = await docHaiY(env, m[1]!, stt)
  if (!n) return null
  const d = cauTuHaiY(n, n.ys.find((y) => y.stt === stt[0])!, n.ys.find((y) => y.stt === stt[1])!, ref.maDe)
  return d && d.version === ref.version ? d : null
}

/** Chấm câu chẩn đoán: khớp như câu game (`grade`); Phần III (câu nền 'so') thêm luật câu nền — lệch ≤ 0,5 % giá trị đúng (em làm tròn khác một chữ số). */
export function chamCauChanDoan(q: Pick<PrivateQuestion, 'phan' | 'correct' | 'solution'>, chon: string): boolean {
  if (grade(q, chon)) return true
  if (q.phan !== 'III') return false
  const cd = q.solution && typeof q.solution === 'object' ? (q.solution as Row).chan_doan : null
  const gtd = cd && typeof cd === 'object' ? str((cd as Row).gtd) : ''
  return chamCauNen({ kieu: 'so', dap_an: q.correct, gia_tri_dung: gtd }, chon)
}

/** Vi kỹ năng câu chẩn đoán kiểm: (a) `nen:<nhãn>`, (b) `dang:<dạng>`. */
export function vknCauChanDoan(q: Pick<PrivateQuestion, 'qid' | 'dang'>): string | null {
  const nhan = nhanQidChanDoan(q.qid)
  if (nhan) return `nen:${nhan}`
  return laQidChanDoan(q.qid) && q.dang ? `dang:${q.dang}` : null
}

/**
 * Em làm SAI câu chẩn đoán ⇒ ghi MỘT dòng `omni_buoc_sai` cho câu lỗi `qidLoi` (bước = vi kỹ năng của câu chẩn đoán) — tương đương em tự khai, để Trạm / chẩn đoán lần sau
 * ưu tiên bước ấy. Cùng bảng, cùng trần/ngày của Chương trình Cẩn thận (omni-can-than.ts); cùng (em, câu, ngày) đã có dòng ⇒ giữ dòng đầu. Lỗi ⇒ bỏ qua (không ném).
 */
export async function ghiBuocSaiChanDoan(env: Env, sbd: string, qidLoi: string, maVkn: string | null, nowMs: number): Promise<boolean> {
  const qid = tachSongSinh(str(qidLoi).trim()).goc
  if (!sbd || !maVkn || !/^[\w.-]{1,80}$/.test(qid)) return false
  try {
    await damBaoBangCanThan(env)
    const ngay = new Date(nowMs + 7 * 3_600_000).toISOString().slice(0, 10)
    const r = await env.DB.prepare('INSERT OR IGNORE INTO omni_buoc_sai (sbd, qid, ngay, ma_vkn, luc) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM omni_buoc_sai WHERE sbd = ? AND ngay = ?) < ?')
      .bind(sbd, qid, ngay, maVkn, new Date(nowMs).toISOString(), sbd, ngay, TRAN_BUOC_SAI_NGAY).run()
    return Number(r.meta?.changes ?? 0) > 0
  } catch (e) {
    console.error('[chan-doan] chưa ghi được bước sai của câu chẩn đoán:', e instanceof Error ? e.message : e)
    return false
  }
}
