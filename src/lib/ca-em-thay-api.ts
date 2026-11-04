// LỆNH MÁY THẦY RÚT ĐỀ RIÊNG / KIỂM CHỨNG CÂU ĐÃ ĐÚNG (`/ca/loi-den-han`, `/ca/co-luot-moi`, `/ca/cau-da-dung`, `/ca/cau-thay-so`) — tách khỏi exam-api 31/10:
// exam-api nằm trong mảnh `app-nho` mà link phiếu `/p` và màn thi `/t` của học sinh nạp sẵn; bốn lệnh này chỉ máy thầy dùng (de-rieng-v2, de-rieng-da-dung)
// ⇒ dời sang đây cho học sinh khỏi tải mã của thầy (bù phần gói tờ đáp án đã khoá, khoa-de-thi.ts). Mã giữ nguyên.
import type { PublicExamBank, QuestionMedia, TeacherExamSource } from '../data/examContent'
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { HAN_GIAY, fetchCoHan } from './fetch-co-han'
import { HAN_NOI_KHO_CA_GIAY, postCoThuLai } from './exam-api'

/** Một lỗi của em (hàng chữa lỗi) như `/ca/loi-den-han` trả về. `cauSongSinh` có ĐÁP ÁN — chỉ ở máy thầy, chỉ để nối vào kho ca. */
export interface LoiDenHanEm {
  qid: string
  denHan: string
  trangThai: string
  nenSongSinh?: boolean
  songSinh?: number
  phan?: 'I' | 'II' | 'III'
  mucDo?: string
  dang?: string
  cauSongSinh?: { id: string; phan: 'I' | 'II' | 'III'; text: string; choices?: string[]; correct: string } & QuestionMedia
}

/** Lô em mỗi lượt `/ca/loi-den-han` (máy chủ nhận tối đa 20 — `TOI_DA_EM_MOT_LUOT`). Lô nhỏ ⇒ mỗi lượt ít truy vấn D1, không chạm trần lúc D1 nghẽn. */
export const LO_EM_LOI_DEN_HAN = 10
/** Số lô chạy song song. */
export const SONG_SONG_LOI_DEN_HAN = 6
/** Lỗi CẤU TRÚC (máy chủ chưa có lệnh / máy chưa có địa chỉ) — chỗ gọi đi đường rút cũ. Lỗi một lô (nghẽn, hết giờ) KHÔNG ném loại này. */
export class LoiChuaCoLenhRut extends Error {}

/**
 * RÚT ĐỀ v2 — `/ca/loi-den-han` theo LÔ `LO_EM_LOI_DEN_HAN` em, `SONG_SONG_LOI_DEN_HAN` lô song song.
 * BỀN (thầy 04/11: «Liên tục báo ko rút đc kiểu mới chỉ rút đc kiểu cũ», «rút cực lâu khi thầy bấm bắt đầu»): trước đây MỘT lô lỗi (giờ cao điểm D1 nghẽn,
 * lượt hết giờ, HTTP 5xx) là NÉM cả lượt ⇒ màn Theo dõi rơi về đường rút CŨ (chậm hơn nữa, đọc lại cả lớp). Nay lô lỗi ⇒ chia đôi thử lại; vẫn lỗi ⇒ các em
 * của lô ấy vào `hong` (rút như em chưa có lỗi nào — đủ câu, không câu ôn lại; bảng biên bản nói ra). CHỈ ném khi máy chủ chưa có lệnh (404) / chưa có địa
 * chỉ, hoặc MỌI lô đều hỏng (không đọc được hồ sơ của em nào — chỗ gọi đi đường cũ như trước).
 */
export async function loiDenHanTheoEm(
  scriptUrl: string,
  secret: string,
  dsSbd: string[],
  ngay: string,
  qids?: string[],
): Promise<{ em: Record<string, LoiDenHanEm[]>; daGap: Record<string, Record<string, string>>; hong: string[]; nhomTrung: Record<string, string> }> {
  const ds = [...new Set(dsSbd.map((x) => String(x || '').trim()).filter(Boolean))]
  const ra = { em: {} as Record<string, LoiDenHanEm[]>, daGap: {} as Record<string, Record<string, string>>, hong: [] as string[], nhomTrung: {} as Record<string, string> }
  if (ds.length === 0) return ra
  const base = await layDiaChiMayChu(scriptUrl)
  if (!base) throw new LoiChuaCoLenhRut('Máy này chưa có địa chỉ máy chủ mới')
  const lo: string[][] = []
  for (let i = 0; i < ds.length; i += LO_EM_LOI_DEN_HAN) lo.push(ds.slice(i, i + LO_EM_LOI_DEN_HAN))
  type TraVe = { ok?: boolean; error?: string; em?: Record<string, LoiDenHanEm[]>; daGap?: Record<string, Record<string, string>>; hong?: string[]; nhomTrung?: Record<string, string> }
  const goi = async (phan: string[]): Promise<TraVe> => {
    const res = await fetchCoHan(
      `${base}/ca/loi-den-han`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret.trim() },
        body: JSON.stringify({ secret: secret.trim(), sbd: phan, ngay, ...(qids && qids.length ? { qids } : {}) }),
      },
      HAN_GIAY,
    )
    if (res.status === 404) throw new LoiChuaCoLenhRut('Máy chủ chưa có lệnh lỗi đến hạn')
    if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
    const r = (await res.json()) as TraVe
    if (!r.ok) throw new Error(r.error || 'Không đọc được lỗi đến hạn')
    return r
  }
  let soDoc = 0
  let loiCuoi: unknown = null
  const nhan = (r: TraVe) => {
    Object.assign(ra.em, r.em ?? {})
    Object.assign(ra.daGap, r.daGap ?? {})
    Object.assign(ra.nhomTrung, r.nhomTrung ?? {})
    ra.hong.push(...(r.hong ?? []))
  }
  /** Một lô: thử; lỗi (không phải 404) ⇒ chia đôi thử lại (lô một em thử lại một lần); vẫn lỗi ⇒ em của lô vào `hong`. */
  const docLo = async (phan: string[], conChia: boolean): Promise<void> => {
    try { nhan(await goi(phan)); soDoc += phan.length; return } catch (e) {
      if (e instanceof LoiChuaCoLenhRut) throw e
      loiCuoi = e
    }
    if (conChia && phan.length > 1) {
      const g = Math.ceil(phan.length / 2)
      await Promise.all([docLo(phan.slice(0, g), false), docLo(phan.slice(g), false)])
      return
    }
    if (conChia) { try { nhan(await goi(phan)); soDoc += phan.length; return } catch (e) { if (e instanceof LoiChuaCoLenhRut) throw e; loiCuoi = e } }
    ra.hong.push(...phan)
  }
  let chiSo = 0
  const chay = async () => { while (chiSo < lo.length) await docLo(lo[chiSo++]!, true) }
  await Promise.all(Array.from({ length: Math.min(SONG_SONG_LOI_DEN_HAN, lo.length) }, chay))
  if (soDoc === 0) throw loiCuoi instanceof Error ? loiCuoi : new Error('Không đọc được lỗi đến hạn')
  ra.hong = [...new Set(ra.hong)]
  return ra
}

/** CA KIỂM TRA (06/10) — `/ca/co-luot-moi`: em nào có lượt tự làm MỚI kể từ `tuIso` (mốc chạy thử). Theo lô 200 em.
 * Máy chủ chưa có lệnh / lỗi ⇒ NÉM LỖI (chỗ gọi giữ bản cũ và nói ra, không coi là "không có lượt mới"). */
export async function coLuotMoiTheoEm(scriptUrl: string, secret: string, dsSbd: string[], tuIso: string): Promise<{ em: string[] }> {
  const ds = [...new Set(dsSbd.map((x) => String(x || '').trim()).filter(Boolean))]
  if (ds.length === 0) return { em: [] }
  const base = await layDiaChiMayChu(scriptUrl)
  if (!base) throw new Error('Máy này chưa có địa chỉ máy chủ mới')
  const ra = new Set<string>()
  for (let i = 0; i < ds.length; i += 200) {
    const res = await fetchCoHan(
      `${base}/ca/co-luot-moi`,
      { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret.trim() }, body: JSON.stringify({ secret: secret.trim(), sbd: ds.slice(i, i + 200), tu: tuIso }) },
      HAN_GIAY,
    )
    if (!res.ok) throw new Error(res.status === 404 ? 'Máy chủ chưa có lệnh kiểm bài vừa làm' : `Máy chủ trả lỗi HTTP ${res.status}`)
    const r = (await res.json()) as { ok?: boolean; error?: string; em?: string[] }
    if (!r.ok) throw new Error(r.error || 'Không kiểm được bài vừa làm')
    for (const s of r.em ?? []) ra.add(String(s))
  }
  return { em: [...ra].sort() }
}

/** Một câu em đã tự làm đúng như `/ca/cau-da-dung` trả về (KHÔNG có đáp án). */
export interface CauDaDungEm {
  qid: string
  phan: 'I' | 'II' | 'III'
  mucDo: string
  dang: string
  noi: string
  ngayDung: string
  nhan: string
  lucDung: string
  soLanDung: number
  soLanSai: number
}

/** KIỂM CHỨNG CÂU ĐÃ ĐÚNG (02/10) — `/ca/cau-da-dung` theo LÔ `LO_EM_LOI_DEN_HAN` em (`SONG_SONG_LOI_DEN_HAN` lô song song). Máy chủ chưa có lệnh ⇒ NÉM LỖI.
 *  04/11: lô lỗi (nghẽn / hết giờ) ⇒ THỬ LẠI một lần trước khi ném — trước đây một lô trượt là ca «Kiểm chứng câu đã đúng» không bắt đầu được (đường này không có
 *  đường dự phòng: đường cũ lấp câu em chưa đúng). */
export async function cauDaDungTheoEm(scriptUrl: string, secret: string, dsSbd: string[]): Promise<{ em: Record<string, CauDaDungEm[]> }> {
  const ds = [...new Set(dsSbd.map((x) => String(x || '').trim()).filter(Boolean))]
  const ra = { em: {} as Record<string, CauDaDungEm[]> }
  if (ds.length === 0) return ra
  const base = await layDiaChiMayChu(scriptUrl)
  if (!base) throw new Error('Máy này chưa có địa chỉ máy chủ mới')
  const lo: string[][] = []
  for (let i = 0; i < ds.length; i += LO_EM_LOI_DEN_HAN) lo.push(ds.slice(i, i + LO_EM_LOI_DEN_HAN))
  let chiSo = 0
  const motLo = async (phan: string[]) => {
      const res = await fetchCoHan(
        `${base}/ca/cau-da-dung`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret.trim() },
          body: JSON.stringify({ secret: secret.trim(), sbd: phan }),
        },
        HAN_GIAY,
      )
      if (res.status === 404) throw new LoiChuaCoLenhRut('Máy chủ chưa có lệnh câu đã làm đúng')
      if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
      const r = (await res.json()) as { ok?: boolean; error?: string; em?: Record<string, CauDaDungEm[]> }
      if (!r.ok) throw new Error(r.error || 'Không đọc được câu em đã làm đúng')
      Object.assign(ra.em, r.em ?? {})
  }
  const chay = async () => {
    while (chiSo < lo.length) {
      const phan = lo[chiSo++]!
      try { await motLo(phan) } catch (e) { if (e instanceof LoiChuaCoLenhRut) throw e; await motLo(phan) }
    }
  }
  await Promise.all(Array.from({ length: Math.min(SONG_SONG_LOI_DEN_HAN, lo.length) }, chay))
  return ra
}

/** Một câu trong đề của em gửi lên `/ca/cau-thay-so` (xem server/src/cau-thay-so.ts). `bu` = câu bù: không thay, chỉ để khỏi chọn trùng. */
export interface YeuCauThayEm {
  qid: string
  phan: 'I' | 'II' | 'III'
  mucDo: string
  dang: string
  lyThuyet: boolean
  bu: boolean
}
/** Bản thay của MỘT câu em đã đúng như `/ca/cau-thay-so` trả về. `cau` (có ĐÁP ÁN — chỉ ở máy thầy) là câu đổi số để nối vào kho ca; `ae` chỉ có `id` + `maDe` (nội dung lấy từ kho máy thầy). */
export interface BanThayEm {
  cach: 'ss' | 'bt' | 'ae'
  kieu: 'thay_so' | 'cung_dang'
  id: string
  phan: 'I' | 'II' | 'III'
  mucDo: string
  dang: string
  maDe?: string
  cau?: { id: string; phan: 'I' | 'II' | 'III'; text: string; choices?: string[]; correct: string } & QuestionMedia
}
export interface KetQuaThayEm {
  /** Công tắc máy chủ (`cau_hinh.da_dung_thay_so`): false ⇒ máy chủ chủ động không thay câu nào. */
  bat: boolean
  em: Record<string, Record<string, BanThayEm>>
  dem: { ss: number; bt: number; ae: number; giu: number }
  /** Em máy chủ không tìm được bản thay vì lỗi (giữ nguyên câu cũ). */
  loi: string[]
}

/** SỐ EM MỖI LƯỢT gọi `/ca/cau-thay-so` (khớp `TOI_DA_EM_CAU_THAY` của máy chủ: ~140–250 truy vấn D1 mỗi em, đo thật 06/10). */
const EM_MOI_LUOT_THAY = 2
/** Hạn chờ MỘT lượt `/ca/cau-thay-so` (giây): lượt có câu anh em của 2 em mất vài giây đến vài chục giây. */
const HAN_GIAY_THAY = 90

/**
 * KIỂM CHỨNG CÂU ĐÃ ĐÚNG — THAY CÂU (thầy 06/10): hỏi máy chủ bản đổi số / câu anh em cho từng câu em đã đúng trong đề (`cau`: sbd → câu trong đề của em).
 * Chia lô EM_MOI_LUOT_THAY em, 3 lô song song. Máy chủ chưa có lệnh (404) / lỗi ⇒ NÉM LỖI (nơi gọi giữ nguyên câu em đã đúng và nói ra). `tienDo` báo số em đã xong.
 */
export async function cauThayTheoEm(
  scriptUrl: string,
  secret: string,
  maCa: string,
  cau: Record<string, YeuCauThayEm[]>,
  tuyChon: { ngay?: string; tienDo?: (xong: number, tong: number) => void } = {},
): Promise<KetQuaThayEm> {
  const ds = Object.keys(cau).filter((s) => (cau[s] ?? []).some((c) => !c.bu))
  const ra: KetQuaThayEm = { bat: true, em: {}, dem: { ss: 0, bt: 0, ae: 0, giu: 0 }, loi: [] }
  if (ds.length === 0) return ra
  const base = await layDiaChiMayChu(scriptUrl)
  if (!base) throw new Error('Máy này chưa có địa chỉ máy chủ mới')
  const lo: string[][] = []
  for (let i = 0; i < ds.length; i += EM_MOI_LUOT_THAY) lo.push(ds.slice(i, i + EM_MOI_LUOT_THAY))
  let chiSo = 0
  let xong = 0
  const chay = async () => {
    while (chiSo < lo.length) {
      const phan = lo[chiSo++]!
      const res = await fetchCoHan(
        `${base}/ca/cau-thay-so`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret.trim() },
          body: JSON.stringify({ secret: secret.trim(), sbd: phan, seed: maCa, ...(tuyChon.ngay ? { ngay: tuyChon.ngay } : {}), cau: Object.fromEntries(phan.map((s) => [s, cau[s] ?? []])) }),
        },
        HAN_GIAY_THAY,
      )
      if (!res.ok) throw new Error(res.status === 404 ? 'Máy chủ chưa có lệnh thay câu đã làm đúng' : `Máy chủ trả lỗi HTTP ${res.status}`)
      const r = (await res.json()) as { ok?: boolean; error?: string; bat?: boolean; em?: KetQuaThayEm['em']; dem?: Partial<KetQuaThayEm['dem']>; loi?: string[] }
      if (!r.ok) throw new Error(r.error || 'Không tìm được câu thay cho câu em đã làm đúng')
      if (r.bat === false) ra.bat = false
      Object.assign(ra.em, r.em ?? {})
      for (const k of ['ss', 'bt', 'ae', 'giu'] as const) ra.dem[k] += Number(r.dem?.[k]) || 0
      ra.loi.push(...(r.loi ?? []))
      xong += phan.length
      tuyChon.tienDo?.(xong, ds.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, lo.length) }, chay))
  return ra
}

/** NỐI THÊM CÂU VÀO KHO CỦA MỘT CA — chỉ dùng cho đề riêng từng em (dời từ exam-api 31/10, mã giữ nguyên).
 *
 * Câu em từng sai có thể nằm ngoài kho thầy vừa rút cho ca. Muốn hỏi lại đúng
 * câu đó thì phải nối nó vào kho của ca trước khi phát đề (thầy chốt 08/09:
 * "bất kể là tôi chọn chuyên đề gì thi mà ca trước sai 9 câu phải rút đúng 3
 * câu đó ra vào đề mới").
 *
 * Máy chủ CHẶN khi ca đã bấm Bắt đầu: lúc đó kho là thứ em đang cầm. */
export async function noiKhoCa(
  scriptUrl: string,
  secret: string,
  maCa: string,
  bank: PublicExamBank,
  keyBank: { phanI: TeacherExamSource['phanI']; phanII: TeacherExamSource['phanII']; phanIII: TeacherExamSource['phanIII'] },
): Promise<{ themBank: number; themKey: number }> {
  // HẠN 60 GIÂY + THỬ LẠI 1 LẦN (30/10, ca 269333): nối 344 câu lúc bấm Bắt đầu quá hạn 25 giây chung khi D1 nghẽn ⇒ máy thầy bỏ HẾT câu sai cũ khỏi
  // đề «rút câu sai». Gửi lại AN TOÀN: máy chủ ghi `kho_ca_them` theo khoá `maCa|qid` (ghi đè đúng dòng ấy bằng cùng nội dung) và chỉ THÊM câu chưa
  // có vào `de/` + `key/` (so theo id) ⇒ lần hai không nhân đôi gì.
  const r = await postCoThuLai(scriptUrl, { action: 'noiKhoCa', secret, maCa, bank, keyBank }, HAN_NOI_KHO_CA_GIAY, 2)
  if (!r.ok) throw new Error(r.error || 'Không nối được kho ca')
  return { themBank: Number(r.themBank) || 0, themKey: Number(r.themKey) || 0 }
}
