// LỆNH MÁY THẦY RÚT ĐỀ RIÊNG / KIỂM CHỨNG CÂU ĐÃ ĐÚNG (`/ca/loi-den-han`, `/ca/co-luot-moi`, `/ca/cau-da-dung`, `/ca/cau-thay-so`) — tách khỏi exam-api 31/10:
// exam-api nằm trong mảnh `app-nho` mà link phiếu `/p` và màn thi `/t` của học sinh nạp sẵn; bốn lệnh này chỉ máy thầy dùng (de-rieng-v2, de-rieng-da-dung)
// ⇒ dời sang đây cho học sinh khỏi tải mã của thầy (bù phần gói tờ đáp án đã khoá, khoa-de-thi.ts). Mã giữ nguyên.
import type { QuestionMedia } from '../data/examContent'
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { HAN_GIAY, fetchCoHan } from './fetch-co-han'

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

/** RÚT ĐỀ v2 — `/ca/loi-den-han` theo LÔ 20 em (4 lô song song). Máy chủ chưa có lệnh ⇒ NÉM LỖI (chỗ gọi đi đường rút cũ). */
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
  if (!base) throw new Error('Máy này chưa có địa chỉ máy chủ mới')
  const lo: string[][] = []
  for (let i = 0; i < ds.length; i += 20) lo.push(ds.slice(i, i + 20))
  let chiSo = 0
  const chay = async () => {
    while (chiSo < lo.length) {
      const phan = lo[chiSo++]!
      const res = await fetchCoHan(
        `${base}/ca/loi-den-han`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret.trim() },
          body: JSON.stringify({ secret: secret.trim(), sbd: phan, ngay, ...(qids && qids.length ? { qids } : {}) }),
        },
        HAN_GIAY,
      )
      if (!res.ok) throw new Error(res.status === 404 ? 'Máy chủ chưa có lệnh lỗi đến hạn' : `Máy chủ trả lỗi HTTP ${res.status}`)
      const r = (await res.json()) as { ok?: boolean; error?: string; em?: Record<string, LoiDenHanEm[]>; daGap?: Record<string, Record<string, string>>; hong?: string[]; nhomTrung?: Record<string, string> }
      if (!r.ok) throw new Error(r.error || 'Không đọc được lỗi đến hạn')
      Object.assign(ra.em, r.em ?? {})
      Object.assign(ra.daGap, r.daGap ?? {})
      Object.assign(ra.nhomTrung, r.nhomTrung ?? {})
      ra.hong.push(...(r.hong ?? []))
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, lo.length) }, chay))
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

/** KIỂM CHỨNG CÂU ĐÃ ĐÚNG (02/10) — `/ca/cau-da-dung` theo LÔ 20 em (4 lô song song). Máy chủ chưa có lệnh ⇒ NÉM LỖI. */
export async function cauDaDungTheoEm(scriptUrl: string, secret: string, dsSbd: string[]): Promise<{ em: Record<string, CauDaDungEm[]> }> {
  const ds = [...new Set(dsSbd.map((x) => String(x || '').trim()).filter(Boolean))]
  const ra = { em: {} as Record<string, CauDaDungEm[]> }
  if (ds.length === 0) return ra
  const base = await layDiaChiMayChu(scriptUrl)
  if (!base) throw new Error('Máy này chưa có địa chỉ máy chủ mới')
  const lo: string[][] = []
  for (let i = 0; i < ds.length; i += 20) lo.push(ds.slice(i, i + 20))
  let chiSo = 0
  const chay = async () => {
    while (chiSo < lo.length) {
      const phan = lo[chiSo++]!
      const res = await fetchCoHan(
        `${base}/ca/cau-da-dung`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret.trim() },
          body: JSON.stringify({ secret: secret.trim(), sbd: phan }),
        },
        HAN_GIAY,
      )
      if (!res.ok) throw new Error(res.status === 404 ? 'Máy chủ chưa có lệnh câu đã làm đúng' : `Máy chủ trả lỗi HTTP ${res.status}`)
      const r = (await res.json()) as { ok?: boolean; error?: string; em?: Record<string, CauDaDungEm[]> }
      if (!r.ok) throw new Error(r.error || 'Không đọc được câu em đã làm đúng')
      Object.assign(ra.em, r.em ?? {})
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, lo.length) }, chay))
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
