// BÁO CÁO CHI TIẾT CỦA MỘT EM — phía HỌC SINH (thầy 28/09: "thay thế hết bằng bản mới"). Dựng ĐÚNG khuôn `BaoCaoMotEm`
// mà `BaoCaoChiTiet` (bản vẽ ca thi 28/09, tab "Từng em") đang vẽ, từ dữ liệu em được phép thấy:
//   · một dòng ca ĐÃ CÔNG BỐ của `/hs/lich-su` (điểm tổng + điểm từng phần + số câu);
//   · mọi câu em đã làm của ca đó (`/hs/cau-da-thi` — máy chủ đã chặn ca chưa công bố).
// THUẦN, không gọi mạng. Không so với lớp, không hạng (chỉ thầy có). Thiếu số ⇒ null/rỗng, màn ẨN — không bịa.
import type { BaoCaoMotEm, CauXemLai, DangCuaEm, OCau, PhanChiTiet } from './bao-cao-mot-em'
import { ketQuaCau, NGUONG_CAN_ON } from './bao-cao-mot-em'
import type { CauSaiHienThi } from '../components/KhoiCauSai'

export interface DongCaCuaEm {
  maCa: string
  tong?: number | null
  diemI?: number | null
  diemII?: number | null
  diemIII?: number | null
  soCauDung?: number | null
  tongCau?: number | null
  soCauDungMotPhan?: number | null
  [k: string]: unknown
}

const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const chu = (x: unknown): string => (typeof x === 'string' ? x : x == null ? '' : String(x))
const TEN_PHAN = { I: 'Phần I · Trắc nghiệm', II: 'Phần II · Đúng–sai', III: 'Phần III · Trả lời ngắn' } as const
const laPhan = (x: unknown): x is 'I' | 'II' | 'III' => x === 'I' || x === 'II' || x === 'III'

/** Một câu của `/hs/cau-da-thi` → khuôn câu vẽ bằng `TheCau` (qua `CauSaiChuan`). */
function cauHienThi(o: Record<string, unknown>): CauSaiHienThi {
  return {
    qid: chu(o.qid),
    phan: chu(o.phan),
    soCau: so(o.soCau) ?? undefined,
    chuyenDe: chu(o.chuyenDe),
    mucDo: chu(o.mucDo),
    dapAnChon: chu(o.dapAnChon),
    dapAnDung: chu(o.dapAnDung),
    text: chu(o.text),
    choices: Array.isArray(o.choices) ? o.choices.map(chu) : undefined,
    ideas: Array.isArray(o.ideas) ? o.ideas.map(chu) : undefined,
    table: Array.isArray(o.table) ? (o.table as string[][]) : null,
    imageDataUrl: typeof o.imageDataUrl === 'string' ? o.imageDataUrl : undefined,
    thanCauImg: typeof o.thanCauImg === 'string' ? o.thanCauImg : undefined,
    choiceImgs: Array.isArray(o.choiceImgs) ? (o.choiceImgs as (string | undefined)[]) : undefined,
    ideaImgs: Array.isArray(o.ideaImgs) ? (o.ideaImgs as (string | undefined)[]) : undefined,
    hinhAnh: o.hinhAnh,
    loiGiai: o.loiGiai as string | undefined,
  }
}

/** Dựng báo cáo của em. `cau` = null ⇒ chưa tải được câu: vẫn có điểm + số câu từ dòng lịch sử, khối từng câu ẩn. */
export function baoCaoCuaEm(ca: DongCaCuaEm, cau: readonly unknown[] | null): BaoCaoMotEm {
  const rows = (cau ?? [])
    .map((x) => (x ?? {}) as Record<string, unknown>)
    .filter((o) => chu(o.maCa) === ca.maCa && laPhan(o.phan) && so(o.soCau) !== null)
  // Một câu một dòng (máy chủ có thể trả trùng khi em làm lại ca).
  const daGap = new Set<string>()
  const dong = rows.filter((o) => {
    const k = `${chu(o.phan)}|${so(o.soCau)}`
    if (daGap.has(k)) return false
    daGap.add(k)
    return true
  })
  const kq = (o: Record<string, unknown>) =>
    ketQuaCau({ phan: o.phan as 'I', dapAnChon: chu(o.dapAnChon), dapAnDung: chu(o.dapAnDung), dungSai: o.dungSai === true })

  const diemPhan = { I: so(ca.diemI), II: so(ca.diemII), III: so(ca.diemIII) }
  const phan: PhanChiTiet[] = (['I', 'II', 'III'] as const).flatMap((ma) => {
    const cua = dong.filter((o) => o.phan === ma).sort((a, b) => (so(a.soCau) ?? 0) - (so(b.soCau) ?? 0))
    const d = diemPhan[ma]
    if (cua.length === 0 && d === null) return []
    const o: OCau[] = cua.map((r) => ({ soCau: so(r.soCau)!, kq: kq(r) }))
    return [
      {
        ma,
        ten: TEN_PHAN[ma],
        dung: o.filter((x) => x.kq === 'dung').length,
        tong: o.length,
        motPhan: o.filter((x) => x.kq === 'mot_phan').length,
        diem: d ?? NaN,
        // Trần điểm từng phần máy chủ chưa gửi cho em ⇒ NaN: màn chỉ in số điểm, không in "/trần".
        toiDa: NaN,
        cau: o,
      },
    ]
  })

  const theoDang = new Map<string, { dung: number; tong: number }>()
  for (const r of dong) {
    const ten = chu(r.dang || r.chuyenDe).replace(/^CD:/, '').trim()
    if (!ten) continue
    const x = theoDang.get(ten) ?? { dung: 0, tong: 0 }
    x.tong++
    if (r.dungSai === true) x.dung++
    theoDang.set(ten, x)
  }
  const dang: DangCuaEm[] = [...theoDang.entries()]
    .map(([ten, v]) => ({ ten, dung: v.dung, tong: v.tong, canOn: v.dung / v.tong < NGUONG_CAN_ON }))
    .sort((a, b) => a.dung / a.tong - b.dung / b.tong || b.tong - a.tong || a.ten.localeCompare(b.ten, 'vi'))

  // Câu cần chữa: MỌI câu không đúng trọn (sai · đúng một phần · bỏ trống), theo phần rồi số câu — kèm đủ đề để vẽ lời giải chuẩn.
  const thu = { I: 0, II: 1, III: 2 } as const
  const cauXemLai: CauXemLai[] = dong
    .filter((r) => r.dungSai !== true)
    .sort((a, b) => thu[a.phan as 'I'] - thu[b.phan as 'I'] || (so(a.soCau) ?? 0) - (so(b.soCau) ?? 0))
    .map((r) => ({
      qid: chu(r.qid) || `${chu(r.phan)}-${so(r.soCau)}`,
      phan: r.phan as 'I',
      soCau: so(r.soCau)!,
      dang: chu(r.dang || r.chuyenDe).replace(/^CD:/, '').trim(),
      loai: 'sai' as const,
      de: chu(r.text) || null,
      dapAnChon: chu(r.dapAnChon),
      dapAnDung: chu(r.dapAnDung),
      giay: null,
      tbGiayLop: null,
      loiGiai: r.loiGiai ?? null,
      cau: cauHienThi(r),
    }))

  const dungLs = so(ca.soCauDung)
  const tongLs = so(ca.tongCau)
  const hopLe = dungLs !== null && tongLs !== null && tongLs > 0 && dungLs >= 0 && dungLs <= tongLs
  return {
    daNop: true,
    tong: so(ca.tong),
    dung: hopLe ? dungLs : dong.length ? dong.filter((r) => r.dungSai === true).length : null,
    tongCau: hopLe ? tongLs : dong.length ? dong.length : null,
    motPhan: so(ca.soCauDungMotPhan) ?? dong.filter((r) => kq(r) === 'mot_phan').length,
    chuThoiGian: null,
    phan,
    dang,
    cauXemLai,
    soVoiLop: null,
    coBangCham: dong.length > 0,
  }
}
