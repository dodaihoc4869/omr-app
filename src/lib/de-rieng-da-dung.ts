// CHẾ ĐỘ "KIỂM CHỨNG CÂU ĐÃ ĐÚNG" (02/10) — PHẦN MÁY THẦY: chạy thử lúc mở ca (bảng Xem trước phân bổ), chốt lúc bấm Bắt đầu thi.
// Dùng chung hạ tầng rút đề v2 (src/lib/de-rieng-v2.ts): kho đề CÓ đáp án của ca + câu ngoài kho tìm trong cả kho máy thầy, nối vào kho
// ca lúc chốt (`noiKhoCa`), bản đồ chốt MỘT lệnh qua `batDauThi` (`/ca/chot-bat-dau`).
//
// Nguồn câu của từng em: máy chủ `/ca/cau-da-dung` (câu em đã TỰ làm đúng trong các chiến dịch em có mặt — server/src/cau-da-dung.ts).
// Thuật toán: src/lib/rut-de-da-dung.ts (tỷ lệ ma trận 2026; thiếu câu đã đúng ⇒ BÙ câu khác trong kho ca cùng mức độ — thầy 05/10).
import { mergeAndStrip, type TeacherExamSource, type TeacherMcqQuestion, type TeacherShortAnswerQuestion } from '../data/examContent'
import { loadExamSources, loadSessionTeacherBank, saveSessionTeacherBank } from './exam-db'
import { cauDaDungTheoEm, noiKhoCa, type CauDaDungEm } from './exam-api'
import { ngayVnCua } from './de-rieng-nguon'
import { khoDayDu, napNguon, timCau, type CauNgoai } from './de-rieng-v2'
import type { CauKhoV2 } from './rut-de-v2'
import { banDoDaDung, chuThieuDaDung, gopKetQuaDaDung, khoBuTuKho, rutDeDaDung, taoNhanDaDung, type CauDaDung, type KetQuaDaDung } from './rut-de-da-dung'

export interface RutThuDaDung {
  maCa: string
  ngay: string
  cheDo: 'da_dung'
  kq: KetQuaDaDung
  tongCau: number
  /** sbd → câu em đã đúng CÓ nội dung trên máy thầy (đã gắn phần/mức theo kho). */
  nguon: Record<string, CauDaDung[]>
  /** Số câu em đã đúng mà máy thầy không có nội dung (không phát được) — theo em. */
  khongNoiDung: Record<string, number>
  cauNgoai: Record<string, CauNgoai>
  khoCa: CauKhoV2[]
  lucRut: string
  msThuatToan: number
}

const nho = new Map<string, RutThuDaDung>()
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
  return { nguon, khongNoiDung }
}

/** CHẠY THỬ cho cả lớp lúc màn Theo dõi mở một ca chế độ này chưa bắt đầu. Không ghi gì lên máy chủ. */
export async function chayThuRutDeDaDung(url: string, mat: string, maCa: string, dsSbd: string[], tuyChon: { ngay?: string } = {}): Promise<RutThuDaDung> {
  const ngay = tuyChon.ngay ?? ngayVnCua(Date.now())
  const ds = [...new Set(dsSbd.map((x) => String(x || '').trim()).filter(Boolean))].sort()
  const ng = await napNguon(maCa)
  const tongCau = ng.soCau.I + ng.soCau.II + ng.soCau.III
  const cauNgoai: Record<string, CauNgoai> = {}
  const { nguon, khongNoiDung } = await docNguonEm(url, mat, ds, ng.khoCa, cauNgoai, {})
  const t0 = performance.now()
  const kq = rutDeDaDung({ nguon, dsSbd: ds, tongCau, seed: maCa, khoBu: khoBuTuKho(ng.khoCa) })
  const rt: RutThuDaDung = { maCa, ngay, cheDo: 'da_dung', kq, tongCau, nguon, khongNoiDung, cauNgoai, khoCa: ng.khoCa, lucRut: new Date().toISOString(), msThuatToan: performance.now() - t0 }
  nho.set(maCa, rt)
  return rt
}

export interface KetQuaChotDaDung {
  boTheoEm: Record<string, string[]>
  banDoDaDung: { daDung: Record<string, Record<string, string>>; demDaDung: Record<string, Record<string, [number, number]>> }
  bienBan: Record<string, unknown> & { lucRut: string }
  soEmRutThem: number
  soCauNoiThem: number
  canhBao: string[]
}

/** CHỐT lúc bấm Bắt đầu: dùng lại chạy thử, rút thêm cho em trong phòng chờ chưa có bộ, nối câu ngoài kho đã chọn vào kho ca. */
export async function chotRutDeDaDung(url: string, mat: string, maCa: string, dsCho: string[], tuyChon: { ngay?: string } = {}): Promise<KetQuaChotDaDung> {
  const ngay = tuyChon.ngay ?? ngayVnCua(Date.now())
  const canhBao: string[] = []
  let rt = nho.get(maCa)
  if (rt && rt.ngay !== ngay) rt = undefined
  if (!rt) rt = await chayThuRutDeDaDung(url, mat, maCa, dsCho, { ngay })
  const them = [...new Set(dsCho.map((x) => String(x || '').trim()).filter(Boolean))].filter((s) => !rt!.kq.theoEm[s]).sort()
  if (them.length > 0) {
    const cauNgoai = { ...rt.cauNgoai }
    const x = await docNguonEm(url, mat, them, rt.khoCa, cauNgoai, {})
    const kqThem = rutDeDaDung({ nguon: x.nguon, dsSbd: them, tongCau: rt.tongCau, seed: maCa, daDung: rt.kq.daDung, khoBu: khoBuTuKho(rt.khoCa) })
    rt = { ...rt, kq: gopKetQuaDaDung(rt.kq, kqThem), cauNgoai, nguon: { ...rt.nguon, ...x.nguon }, khongNoiDung: { ...rt.khongNoiDung, ...x.khongNoiDung } }
    nho.set(maCa, rt)
  }
  // NỐI CÂU NGOÀI KHO ĐÃ CHỌN vào kho ca TRƯỚC khi chốt — câu không có trong gói đề thì máy em không hiện được. Nối hỏng ⇒ rút lại cả
  // lớp chỉ từ câu em đã đúng CÓ SẴN trong kho ca, và nói ra.
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
      canhBao.push(`Không nối được ${canNoi.length} câu em đã làm đúng (ngoài kho ca) vào ca — đã rút lại chỉ từ kho ca. ${e instanceof Error ? e.message : ''}`.trim())
      const coKho = new Set(rt.khoCa.map((c) => c.id))
      const nguon = Object.fromEntries(Object.entries(rt.nguon).map(([s, l]) => [s, l.filter((c) => coKho.has(c.qid))]))
      const kq = rutDeDaDung({ nguon, dsSbd: Object.keys(rt.kq.theoEm), tongCau: rt.tongCau, seed: maCa, khoBu: khoBuTuKho(rt.khoCa) })
      rt = { ...rt, kq, nguon, cauNgoai: {} }
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
  const lucRut = new Date().toISOString()
  const bienBan = {
    canCua: {},
    soLapCua: {},
    saiCaTruocCua: {},
    thieu: [],
    boQua: [],
    caDaQuet: [],
    ghiChu: [
      { loai: 'tin' as const, loi: 'kiểm chứng câu đã đúng: câu em đã tự làm đúng trong các chiến dịch, bốc ngẫu nhiên theo tỷ lệ ma trận 2026; thiếu thì bù câu khác trong kho cùng mức độ' },
      ...thieuChu.map((loi) => ({ loai: 'canh_bao' as const, loi })),
    ],
    lucRut,
    daDung: { phanBo: rt.kq.phanBo, thieu: rt.kq.thieu, bu: rt.kq.bu ?? {}, khongNoiDung: rt.khongNoiDung },
  }
  return { boTheoEm: bd.bo, banDoDaDung: { daDung: bd.daDung, demDaDung: bd.demDaDung }, bienBan, soEmRutThem: them.length, soCauNoiThem, canhBao }
}
