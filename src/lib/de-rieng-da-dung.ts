// CHẾ ĐỘ "KIỂM CHỨNG CÂU ĐÃ ĐÚNG" (02/10) — PHẦN MÁY THẦY: chạy thử lúc mở ca (bảng Xem trước phân bổ), chốt lúc bấm Bắt đầu thi.
// Dùng chung hạ tầng rút đề v2 (src/lib/de-rieng-v2.ts): kho đề CÓ đáp án của ca + câu ngoài kho tìm trong cả kho máy thầy, nối vào kho
// ca lúc chốt (`noiKhoCa`), bản đồ chốt MỘT lệnh qua `batDauThi` (`/ca/chot-bat-dau`).
//
// Nguồn câu của từng em: máy chủ `/ca/cau-da-dung` (câu em đã TỰ làm đúng trong các chiến dịch em có mặt — server/src/cau-da-dung.ts).
// Thuật toán: src/lib/rut-de-da-dung.ts (tỷ lệ ma trận 2026; thiếu câu đã đúng ⇒ BÙ câu khác trong kho ca cùng mức độ — thầy 05/10).
// THAY CÂU (thầy 06/10): sau khi rút, MỖI câu em đã đúng được thay bằng bản KHÁC — câu tính toán ⇒ bản đổi số (song sinh / biến thể bằng mã), câu lý thuyết
// (và Phần II, câu chưa có bản đổi số) ⇒ câu anh em cùng dạng — qua `/ca/cau-thay-so` (server/src/cau-thay-so.ts); nhãn ghi rõ trên câu (`nhanThay`).
// Không hỏi được máy chủ (máy chủ cũ, mạng, công tắc tắt) hoặc không có bản thay ⇒ GIỮ NGUYÊN câu em đã đúng như trước — ca không bao giờ bị chặn vì việc thay câu —
// và nói ra (bảng Xem trước phân bổ + cảnh báo lúc Bắt đầu).
import { mergeAndStrip, type TeacherExamSource, type TeacherMcqQuestion, type TeacherShortAnswerQuestion } from '../data/examContent'
import { loadExamSources, loadSessionTeacherBank, saveSessionTeacherBank } from './exam-db'
import { cauDaDungTheoEm, cauThayTheoEm, noiKhoCa, type CauDaDungEm, type YeuCauThayEm } from './exam-api'
import { ngayVnCua } from './de-rieng-nguon'
import { cauNgoaiTuBanDoiSo, khoDayDu, napNguon, timCau, type CauNgoai } from './de-rieng-v2'
import type { CauKhoV2 } from './rut-de-v2'
import { laCauRutDuoc } from './cau-tu-luan'
import {
  apThayVaoKetQua,
  banDoDaDung,
  chuThieuDaDung,
  gopKetQuaDaDung,
  khoBuTuKho,
  rutDeDaDung,
  taoNhanDaDung,
  thongKeThay,
  type CauDaDung,
  type KetQuaDaDung,
  type ThayTheoEm,
} from './rut-de-da-dung'

/** Kết quả bước THAY CÂU (thầy 06/10) — để bảng Xem trước phân bổ nói thật với thầy. */
export interface TomTatThay {
  /** `bat` = đã hỏi máy chủ và áp bản thay · `tat` = công tắc máy chủ tắt · `loi` = không hỏi được (máy chủ cũ / mạng) ⇒ giữ nguyên văn. */
  trangThai: 'bat' | 'tat' | 'loi'
  loi: string
  /** Em máy chủ báo lỗi khi tìm bản thay (giữ nguyên câu của em ấy). */
  emLoi: string[]
  /** Số bản thay máy chủ đưa mà máy thầy KHÔNG dùng được (thiếu nội dung câu anh em trong kho máy này / câu đổi số hỏng) ⇒ câu ấy giữ nguyên. */
  khongDung: number
  /** sbd → qid câu em đã đúng → bản thay ĐÃ ÁP (đúng như trong bộ câu). */
  theoEm: ThayTheoEm
  /** qid câu em đã đúng là câu LÝ THUYẾT (chọn lời nhãn). */
  lyThuyet: string[]
}
const thayRong = (trangThai: TomTatThay['trangThai'], loi = ''): TomTatThay => ({ trangThai, loi, emLoi: [], khongDung: 0, theoEm: {}, lyThuyet: [] })

export interface RutThuDaDung {
  maCa: string
  ngay: string
  cheDo: 'da_dung'
  kq: KetQuaDaDung
  tongCau: number
  /** sbd → câu em đã đúng CÓ nội dung trên máy thầy (đã gắn phần/mức theo kho đề). */
  nguon: Record<string, CauDaDung[]>
  /** Số câu em đã đúng mà máy thầy không có nội dung (không phát được) — theo em. */
  khongNoiDung: Record<string, number>
  /** Câu ngoài kho ca đã chọn (câu em đã đúng, câu thay) — nối vào kho ca lúc chốt. */
  cauNgoai: Record<string, CauNgoai>
  khoCa: CauKhoV2[]
  /** Kết quả bước thay câu (thầy 06/10). */
  thay: TomTatThay
  lucRut: string
  msThuatToan: number
}

const nho = new Map<string, RutThuDaDung>()
/** Lượt chạy thử ĐANG CHẠY của từng ca — thầy bấm Bắt đầu giữa chừng thì chốt ĐỢI lượt này (không chạy lại cả lớp lần hai: bước tìm câu thay mất vài chục giây). */
const dangChay = new Map<string, Promise<RutThuDaDung>>()
export const docRutThuDaDung = (maCa: string): RutThuDaDung | undefined => nho.get(maCa)
export const boRutThuDaDung = (maCa: string): void => void nho.delete(maCa)

/** Câu em đã đúng ⇒ ứng viên rút, chỉ giữ câu có trong `kho` (nội dung + đáp án ở máy thầy). Phần/mức theo kho; nhãn dựng lại theo mức ấy. */
export function nguonTuKho(ds: readonly CauDaDungEm[], kho: readonly CauKhoV2[]): { nguon: CauDaDung[]; thieu: number } {
  const theoId = new Map(kho.filter((c) => !c.songSinhCua).map((c) => [c.id, c]))
  const nguon: CauDaDung[] = []
  let thieu = 0
  for (const c of ds) {
    const k = theoId.get(c.qid)
    if (!k) { thieu++; continue }
    const mucDo = k.mucDo || c.mucDo
    nguon.push({ qid: c.qid, phan: k.phan, mucDo, dang: c.dang, nhan: taoNhanDaDung(c.noi, c.ngayDung, mucDo), lucDung: c.lucDung, soLanDung: c.soLanDung, soLanSai: c.soLanSai })
  }
  return { nguon, thieu }
}

async function docNguonEm(url: string, mat: string, ds: string[], khoCa: CauKhoV2[], cauNgoai: Record<string, CauNgoai>, khoToanBo: { v?: TeacherExamSource[] }) {
  const r = await cauDaDungTheoEm(url, mat, ds)
  const coTrongKho = new Set(khoCa.map((c) => c.id))
  const can = new Set<string>()
  for (const l of Object.values(r.em)) for (const c of l) if (!coTrongKho.has(c.qid) && !cauNgoai[c.qid]) can.add(c.qid)
  if (can.size > 0) {
    khoToanBo.v ??= await loadExamSources().catch(() => [] as TeacherExamSource[])
    for (const [id, c] of timCau(khoToanBo.v, can)) cauNgoai[id] = c
  }
  const kho = khoDayDu(khoCa, cauNgoai) // lọc tự luận bằng `khoTuNguon`
  const nguon: Record<string, CauDaDung[]> = {}
  const khongNoiDung: Record<string, number> = {}
  for (const sbd of ds) {
    const x = nguonTuKho(r.em[sbd] ?? [], kho)
    nguon[sbd] = x.nguon
    if (x.thieu > 0) khongNoiDung[sbd] = x.thieu
  }
  return { nguon, khongNoiDung, kho }
}

/**
 * THAY CÂU (thầy 06/10): với kết quả rút `kq0`, hỏi máy chủ bản thay cho từng câu em đã đúng rồi ÁP vào bộ câu. Nội dung câu thay vào `cauNgoai` (nối kho ca lúc chốt):
 * câu đổi số do máy chủ dựng (kèm đáp án), câu anh em tìm trong cả kho máy thầy theo qid. Bản thay không có nội dung dùng được ⇒ bỏ (câu giữ nguyên). Không ném lỗi:
 * máy chủ cũ / mạng / công tắc tắt ⇒ trả `kq0` y nguyên + `trangThai` cho thầy biết.
 */
async function thayCauChoEm(
  url: string, mat: string, maCa: string, ngay: string, kq0: KetQuaDaDung, kho: readonly CauKhoV2[], khoCa: readonly CauKhoV2[],
  cauNgoai: Record<string, CauNgoai>, khoToanBo: { v?: TeacherExamSource[] }, bank: readonly TeacherExamSource[], tienDo?: (xong: number, tong: number) => void,
): Promise<{ kq: KetQuaDaDung; tt: TomTatThay }> {
  const khoTheoId = new Map(kho.map((c) => [c.id, c]))
  const lyThuyet = new Set(kho.filter((c) => c.lyThuyet).map((c) => c.id))
  const cau: Record<string, YeuCauThayEm[]> = {}
  for (const [sbd, ds] of Object.entries(kq0.theoEm)) {
    const l = ds.map((c) => ({ qid: c.qid, phan: c.phan, mucDo: c.mucDo, dang: khoTheoId.get(c.qid)?.dang ?? '', lyThuyet: !c.bu && lyThuyet.has(c.qid), bu: !!c.bu }))
    if (l.some((x) => !x.bu)) cau[sbd] = l
  }
  if (Object.keys(cau).length === 0) return { kq: kq0, tt: thayRong('bat') }
  let r: Awaited<ReturnType<typeof cauThayTheoEm>>
  try {
    r = await cauThayTheoEm(url, mat, maCa, cau, { ngay, tienDo })
  } catch (e) {
    return { kq: kq0, tt: thayRong('loi', e instanceof Error ? e.message : 'Không hỏi được máy chủ') }
  }
  if (!r.bat) return { kq: kq0, tt: thayRong('tat') }
  const coTrongKho = new Set(khoCa.map((c) => c.id))
  const gocCua = timCau(bank, new Set(Object.values(cau).flatMap((l) => l.filter((x) => !x.bu).map((x) => x.qid))))
  // Câu anh em: nội dung lấy từ CẢ KHO máy thầy (câu không nằm trong kho ca).
  const canAe = new Set<string>()
  for (const em of Object.values(r.em)) for (const b of Object.values(em)) if (b.cach === 'ae' && !coTrongKho.has(b.id) && !cauNgoai[b.id]) canAe.add(b.id)
  if (canAe.size > 0) {
    khoToanBo.v ??= await loadExamSources().catch(() => [] as TeacherExamSource[])
    for (const [id, c] of timCau(khoToanBo.v, canAe)) cauNgoai[id] = c
  }
  const thay: ThayTheoEm = {}
  const moi: Record<string, CauNgoai> = {}
  let khongDung = 0
  for (const [sbd, em] of Object.entries(r.em)) {
    for (const [goc, b] of Object.entries(em)) {
      if (!cau[sbd]?.some((x) => x.qid === goc && !x.bu)) continue // chỉ câu em đã đúng nằm trong bộ câu của em
      if (b.cach === 'ae') {
        const c = coTrongKho.has(b.id) ? null : cauNgoai[b.id]
        if (!coTrongKho.has(b.id) && (!c || c.phan !== b.phan || !laCauRutDuoc(c.cau, c.phan))) { khongDung++; continue }
        ;(thay[sbd] ??= {})[goc] = { id: b.id, kieu: 'cung_dang' }
        continue
      }
      const g = (gocCua.get(goc) ?? cauNgoai[goc])?.cau
      const c = b.cau ? cauNgoaiTuBanDoiSo(b.cau, g as { mucDo?: unknown; chuyenDe?: string; dang?: unknown } | undefined, b.mucDo) : null
      if (!c || c.cau.id !== b.id || c.phan !== b.phan) { khongDung++; continue }
      if (!coTrongKho.has(b.id)) moi[b.id] = c
      ;(thay[sbd] ??= {})[goc] = { id: b.id, kieu: 'thay_so' }
    }
  }
  const kq = apThayVaoKetQua(kq0, thay, lyThuyet)
  // Chỉ nối câu thay THẬT SỰ nằm trong bộ câu (áp dụng có thể bỏ bản trùng qid đã có trong đề).
  const daAp: ThayTheoEm = {}
  for (const [sbd, ds] of Object.entries(kq.theoEm)) for (const c of ds) if (c.goc && c.thay) (daAp[sbd] ??= {})[c.goc] = { id: c.qid, kieu: c.thay }
  for (const id of new Set(Object.values(daAp).flatMap((m) => Object.values(m).map((b) => b.id)))) if (moi[id]) cauNgoai[id] = moi[id]!
  return { kq, tt: { trangThai: 'bat', loi: '', emLoi: r.loi, khongDung, theoEm: daAp, lyThuyet: [...lyThuyet] } }
}

/** CHẠY THỬ cho cả lớp lúc màn Theo dõi mở một ca chế độ này chưa bắt đầu. Không ghi gì lên máy chủ. `tienDo` báo tiến độ bước thay câu (em đã xong / tổng). */
export function chayThuRutDeDaDung(url: string, mat: string, maCa: string, dsSbd: string[], tuyChon: { ngay?: string; tienDo?: (xong: number, tong: number) => void } = {}): Promise<RutThuDaDung> {
  const p = chayThuThat(url, mat, maCa, dsSbd, tuyChon)
  dangChay.set(maCa, p)
  const xong = () => { if (dangChay.get(maCa) === p) dangChay.delete(maCa) }
  p.then(xong, xong)
  return p
}
async function chayThuThat(url: string, mat: string, maCa: string, dsSbd: string[], tuyChon: { ngay?: string; tienDo?: (xong: number, tong: number) => void }): Promise<RutThuDaDung> {
  const ngay = tuyChon.ngay ?? ngayVnCua(Date.now())
  const ds = [...new Set(dsSbd.map((x) => String(x || '').trim()).filter(Boolean))].sort()
  const ng = await napNguon(maCa)
  const tongCau = ng.soCau.I + ng.soCau.II + ng.soCau.III
  const cauNgoai: Record<string, CauNgoai> = {}
  const khoToanBo: { v?: TeacherExamSource[] } = {}
  const { nguon, khongNoiDung, kho } = await docNguonEm(url, mat, ds, ng.khoCa, cauNgoai, khoToanBo)
  const t0 = performance.now()
  const kq0 = rutDeDaDung({ nguon, dsSbd: ds, tongCau, seed: maCa, khoBu: khoBuTuKho(ng.khoCa) })
  const { kq, tt } = await thayCauChoEm(url, mat, maCa, ngay, kq0, kho, ng.khoCa, cauNgoai, khoToanBo, ng.bank, tuyChon.tienDo)
  const rt: RutThuDaDung = { maCa, ngay, cheDo: 'da_dung', kq, tongCau, nguon, khongNoiDung, cauNgoai, khoCa: ng.khoCa, thay: tt, lucRut: new Date().toISOString(), msThuatToan: performance.now() - t0 }
  nho.set(maCa, rt)
  return rt
}

export interface KetQuaChotDaDung {
  boTheoEm: Record<string, string[]>
  banDoDaDung: { daDung: Record<string, Record<string, string>>; demDaDung: Record<string, Record<string, [number, number]>> }
  bienBan: Record<string, unknown> & { lucRut: string }
  soEmRutThem: number
  soCauNoiThem: number
  /** Số câu em đã đúng đã thay số / thay bằng câu cùng dạng / giữ nguyên văn (thầy 06/10) — thông báo cho thầy lúc Bắt đầu. */
  soCauThay: { thaySo: number; cungDang: number; giuNguyen: number }
  canhBao: string[]
}

/** CHỐT lúc bấm Bắt đầu: dùng lại chạy thử, rút thêm cho em trong phòng chờ chưa có bộ, nối câu ngoài kho đã chọn vào kho ca. */
export async function chotRutDeDaDung(url: string, mat: string, maCa: string, dsCho: string[], tuyChon: { ngay?: string } = {}): Promise<KetQuaChotDaDung> {
  const ngay = tuyChon.ngay ?? ngayVnCua(Date.now())
  const canhBao: string[] = []
  let rt = nho.get(maCa)
  if (!rt && dangChay.has(maCa)) rt = await dangChay.get(maCa)!.catch(() => undefined) // đang chạy thử dở ⇒ đợi nó, không chạy lại
  if (rt && rt.ngay !== ngay) rt = undefined
  if (!rt) rt = await chayThuRutDeDaDung(url, mat, maCa, dsCho, { ngay })
  const them = [...new Set(dsCho.map((x) => String(x || '').trim()).filter(Boolean))].filter((s) => !rt!.kq.theoEm[s]).sort()
  if (them.length > 0) {
    const cauNgoai = { ...rt.cauNgoai }
    const khoToanBo: { v?: TeacherExamSource[] } = {}
    const x = await docNguonEm(url, mat, them, rt.khoCa, cauNgoai, khoToanBo)
    const kqThem0 = rutDeDaDung({ nguon: x.nguon, dsSbd: them, tongCau: rt.tongCau, seed: maCa, daDung: rt.kq.daDung, khoBu: khoBuTuKho(rt.khoCa) })
    const bank = (await loadSessionTeacherBank(maCa)) ?? []
    const th = rt.thay.trangThai === 'bat' ? await thayCauChoEm(url, mat, maCa, ngay, kqThem0, x.kho, rt.khoCa, cauNgoai, khoToanBo, bank) : { kq: kqThem0, tt: thayRong(rt.thay.trangThai, rt.thay.loi) }
    const thay: TomTatThay = {
      ...rt.thay,
      emLoi: [...rt.thay.emLoi, ...th.tt.emLoi],
      khongDung: rt.thay.khongDung + th.tt.khongDung,
      theoEm: { ...rt.thay.theoEm, ...th.tt.theoEm },
      lyThuyet: [...new Set([...rt.thay.lyThuyet, ...th.tt.lyThuyet])],
    }
    rt = { ...rt, kq: gopKetQuaDaDung(rt.kq, th.kq), cauNgoai, nguon: { ...rt.nguon, ...x.nguon }, khongNoiDung: { ...rt.khongNoiDung, ...x.khongNoiDung }, thay }
    nho.set(maCa, rt)
  }
  // NỐI CÂU NGOÀI KHO ĐÃ CHỌN vào kho ca TRƯỚC khi chốt — câu không có trong gói đề thì máy em không hiện được. Nối hỏng ⇒ rút lại cả
  // lớp chỉ từ câu em đã đúng CÓ SẴN trong kho ca (nguyên văn, không thay), và nói ra.
  const dung = new Set(Object.values(rt.kq.theoEm).flatMap((ds) => ds.map((c) => c.qid)))
  const canNoi = Object.entries(rt.cauNgoai).filter(([id]) => dung.has(id)).map(([, c]) => c)
  let soCauNoiThem = 0
  if (canNoi.length > 0) {
    const src: TeacherExamSource = {
      maDe: `${maCa}-da-dung`,
      phanI: canNoi.filter((c) => c.phan === 'I').map((c) => c.cau as TeacherMcqQuestion),
      phanII: canNoi.filter((c) => c.phan === 'II').map((c) => c.cau as TeacherExamSource['phanII'][number]),
      phanIII: canNoi.filter((c) => c.phan === 'III').map((c) => c.cau as TeacherShortAnswerQuestion),
    }
    try {
      await noiKhoCa(url, mat, maCa, mergeAndStrip([src]), { phanI: src.phanI, phanII: src.phanII, phanIII: src.phanIII })
      const bank = (await loadSessionTeacherBank(maCa)) ?? []
      await saveSessionTeacherBank(maCa, [...bank, src])
      soCauNoiThem = canNoi.length
    } catch (e) {
      canhBao.push(`Không nối được ${canNoi.length} câu em đã làm đúng / câu thay (ngoài kho ca) vào ca — đã rút lại chỉ từ kho ca, em nhận nguyên văn câu đã làm đúng. ${e instanceof Error ? e.message : ''}`.trim())
      const coKho = new Set(rt.khoCa.map((c) => c.id))
      const nguon = Object.fromEntries(Object.entries(rt.nguon).map(([s, l]) => [s, l.filter((c) => coKho.has(c.qid))]))
      const kq = rutDeDaDung({ nguon, dsSbd: Object.keys(rt.kq.theoEm), tongCau: rt.tongCau, seed: maCa, khoBu: khoBuTuKho(rt.khoCa) })
      rt = { ...rt, kq, nguon, cauNgoai: {}, thay: thayRong('loi', 'Không nối được câu thay vào kho ca') }
      nho.set(maCa, rt)
    }
  }
  const bd = banDoDaDung(rt.kq)
  const thieuChu = Object.entries(rt.kq.thieu).flatMap(([sbd, ds]) => chuThieuDaDung(`Em ${sbd}`, ds))
  const soEmBu = Object.keys(rt.kq.bu ?? {}).length
  if (soEmBu > 0) canhBao.push(`${soEmBu} em chưa làm đúng đủ câu — đã bù câu khác trong kho ca cùng mức độ (câu bù không có nhãn "đã làm đúng").`)
  if (thieuChu.length > 0) canhBao.push(`${Object.keys(rt.kq.thieu).length} em vẫn thiếu câu sau khi bù vì kho ca không đủ câu cùng phần — các ô đó máy em tự lấp từ đề ca.`)
  const khongBo = Object.keys(rt.kq.theoEm).filter((s) => !bd.bo[s])
  if (khongBo.length > 0) canhBao.push(`${khongBo.length} em chưa có bộ câu (kho ca trống) — máy em nhận đề chung của ca.`)
  // THAY CÂU (thầy 06/10): nói thật số câu đã thay và số câu giữ nguyên văn.
  const tk = thongKeThay(rt.kq)
  if (rt.thay.trangThai === 'loi') canhBao.push(`Chưa thay được câu em đã làm đúng (${rt.thay.loi || 'không hỏi được máy chủ'}) — em nhận NGUYÊN VĂN câu đã làm đúng.`)
  else if (rt.thay.trangThai === 'tat') canhBao.push('Việc thay câu đã làm đúng đang TẮT ở máy chủ — em nhận nguyên văn câu đã làm đúng.')
  else if (tk.giuNguyen > 0) canhBao.push(`${tk.giuNguyen} câu em đã làm đúng (${tk.emGiuNguyen} em) chưa có câu thay phù hợp — giữ nguyên văn, có nhãn "Em đã làm đúng".`)
  if (rt.thay.emLoi.length > 0) canhBao.push(`${rt.thay.emLoi.length} em máy chủ không tìm được câu thay (lỗi đọc) — các em đó nhận nguyên văn câu đã làm đúng.`)
  const cungDangTheoEm: Record<string, string[][]> = {}
  for (const [s, ds] of Object.entries(rt.kq.theoEm)) {
    const l = ds.filter((c) => c.thay === 'cung_dang' && c.goc).map((c) => [c.goc!, c.qid])
    if (l.length > 0) cungDangTheoEm[s] = l
  }
  const lucRut = new Date().toISOString()
  const bienBan = {
    canCua: {},
    soLapCua: {},
    saiCaTruocCua: {},
    thieu: [],
    boQua: [],
    caDaQuet: [],
    ghiChu: [
      { loai: 'tin' as const, loi: 'kiểm chứng câu đã đúng: câu em đã tự làm đúng trong các chiến dịch, bốc ngẫu nhiên theo tỷ lệ ma trận 2026; câu đã đúng được THAY bằng bản đổi số (câu tính toán) hoặc câu cùng dạng (câu lý thuyết), có nhãn rõ; thiếu thì bù câu khác trong kho cùng mức độ' },
      ...thieuChu.map((loi) => ({ loai: 'canh_bao' as const, loi })),
    ],
    lucRut,
    daDung: {
      phanBo: rt.kq.phanBo, thieu: rt.kq.thieu, bu: rt.kq.bu ?? {}, khongNoiDung: rt.khongNoiDung,
      // Câu đổi số có qid mang câu gốc ("<gốc>~ss<i>" / "<gốc>~bt<k>"); câu anh em ghi rõ cặp [câu gốc, câu thay] để truy ngược khi cần.
      thay: {
        trangThai: rt.thay.trangThai, loi: rt.thay.loi, thaySo: tk.thaySo, cungDang: tk.cungDang, lyThuyet: tk.lyThuyet, giuNguyen: tk.giuNguyen, emGiuNguyen: tk.emGiuNguyen, khongDung: rt.thay.khongDung, emLoi: rt.thay.emLoi,
        cungDangTheoEm,
      },
    },
  }
  return { boTheoEm: bd.bo, banDoDaDung: { daDung: bd.daDung, demDaDung: bd.demDaDung }, bienBan, soEmRutThem: them.length, soCauNoiThem, soCauThay: { thaySo: tk.thaySo, cungDang: tk.cungDang, giuNguyen: tk.giuNguyen }, canhBao }
}
