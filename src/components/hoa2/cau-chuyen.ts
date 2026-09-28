// Đổi câu "Câu đã làm" (hoa2-cau-chi-tiet) sang hai khuôn CHUẨN có sẵn của app — KHÔNG dựng khối lời giải thứ hai:
//   · màn hình: props của `TheCau` chế độ `xem_lai` (LỜI GIẢI → KIẾN THỨC CỐT LÕI → từng phương án/ý ✓✗; Phần III bước + kết quả),
//     lời giải thô của kho đọc qua `chuanHoaLoiGiaiCau` (một bộ đọc cho cả app);
//   · bản in dự phòng: `CauLuyen` cho `dungPhieu` (html-phieu.ts); tệp PDF chính dựng ở pdf-cau-da-lam.ts (cùng `chuanHoaLoiGiaiCau`);
//   · thẻ đóng: `tomTatThe` (một dòng đề + "Em chọn: … · Đáp án: …").
import type { HinhAnh, LoiGiaiCauTruc } from '../../data/examContent'
import type { TheCauProps } from '../TheCau'
import type { CauLuyen, MucDoCau } from '../../lib/bai-tap-pdf'
import { chuanHoaLoiGiaiCau } from '../../lib/chuan-hoa-loi-giai'
import type { CauDaLamMuc, ChiTietCau, LanLam, TrangThaiCau } from './api'
import { ngayThang } from './thoi-gian'
import { normalizeNumericAnswer } from '../../engine/score'

type Chu = 'A' | 'B' | 'C' | 'D'
type DS = 'D' | 'S'

export const NHAN_PHAN: Record<'I' | 'II' | 'III', string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }

/** Mức độ của câu theo kho ('biet' | 'hieu' | 'van_dung', hoặc viết tắt NB/TH/VD) → khoá chuẩn. Lạ ⇒ null (không đoán). */
export function mucDoChuan(m: string | null | undefined): MucDoCau | null {
  const k = String(m ?? '').trim().toLowerCase().replace(/\s+/g, '_')
  if (['biet', 'nb', 'nhan_biet'].includes(k)) return 'biet'
  if (['hieu', 'th', 'thong_hieu'].includes(k)) return 'hieu'
  if (['van_dung', 'vd', 'vdc', 'van_dung_cao'].includes(k)) return 'van_dung'
  return null
}
const NHAN_MUC: Record<MucDoCau, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng' }
export function nhanMucDo(m: string | null | undefined): string {
  const k = mucDoChuan(m)
  return k ? NHAN_MUC[k] : ''
}

export const NHAN_TRANG_THAI: Record<TrangThaiCau, string> = { dang_on: 'Đang ôn', thanh_thao: 'Thành thạo', can_day_lai: 'Cần thầy dạy lại' }

/** "Câu 17 · Trắc nghiệm · Vận dụng" */
export function dauCau(c: Pick<CauDaLamMuc, 'stt' | 'phan' | 'mucDo'>): string {
  return [c.stt > 0 ? `Câu ${c.stt}` : 'Câu', NHAN_PHAN[c.phan], nhanMucDo(c.mucDo)].filter(Boolean).join(' · ')
}

/** Chip lịch sử: "Sai 29/09 · có gợi ý". */
export function chuLanLam(l: LanLam): string {
  return `${l.dung ? 'Đúng' : 'Sai'} ${ngayThang(l.ngay)}${l.coGoiY ? ' · có gợi ý' : ''}`
}

/** Ngày làm gần nhất (để xếp danh sách): lần cuối trong lịch sử; không có ⇒ ''. */
export function ngayGanNhat(c: CauDaLamMuc): string {
  return c.lichSu.reduce((m, l) => (l.ngay > m ? l.ngay : m), '')
}

/** Đáp án Đúng–sai "DSSD"/"ĐSSĐ" → [D,S,S,D]; không đủ 4 ý hợp lệ ⇒ null. */
export function tachDungSai(s: string | null | undefined): (DS | null)[] | null {
  const k = String(s ?? '').toUpperCase().replace(/Đ/g, 'D').replace(/[^DS-]/g, '')
  if (k.length !== 4) return null
  return k.split('').map((x) => (x === 'D' || x === 'S' ? x : null))
}

/** Lời giải thô của kho → dạng có cấu trúc `TheCau` đọc. Đọc qua `chuanHoaLoiGiaiCau`; kho thiếu ⇒ undefined (TheCau tự nói "chưa nhập lời giải"). */
export function loiGiaiChoTheCau(tho: unknown, phan: 'I' | 'II' | 'III', dapAn: string): LoiGiaiCauTruc | undefined {
  const lg = chuanHoaLoiGiaiCau(tho, phan, dapAn)
  if (lg.thieu) return undefined
  const ra: LoiGiaiCauTruc = { chot: lg.chot }
  if (lg.lyDo && phan === 'I') {
    ra.tungPa = {}
    for (const p of lg.lyDo) if (/^[A-D]$/.test(p.khoa)) ra.tungPa[p.khoa as Chu] = { dung: p.dung, viSao: p.ly }
  }
  if (lg.lyDo && phan === 'II') {
    ra.tungY = {}
    for (const p of lg.lyDo) if (/^[a-d]$/.test(p.khoa)) ra.tungY[p.khoa as 'a' | 'b' | 'c' | 'd'] = { dung: p.dung, viSao: p.ly }
  }
  if (lg.buoc) ra.buoc = lg.buoc
  if (phan === 'III' && lg.ketQua) ra.ketQua = lg.ketQua
  return ra
}

const CHI_SO_UNICODE = '₀₁₂₃₄₅₆₇₈₉'
/** Chỉ số dưới Unicode của kho (C₆H₁₂O₆) → cú pháp `_{6}` mà ChemText vẽ bằng <sub> CÙNG phông chữ quanh nó. Be Vietnam Pro không có
 * glyph ₀–₉ nên máy lấy phông dự phòng — chữ bé, lệch dòng, khó đọc (thầy nhắc 28/09). Chỉ đổi cách vẽ, không đổi nội dung. */
export function chiSoDuoiRo(s: string): string {
  return s.replace(/[₀-₉]+/g, (d) => `_{${[...d].map((c) => CHI_SO_UNICODE.indexOf(c)).join('')}}`)
}
function loiGiaiRo(lg: LoiGiaiCauTruc | undefined): LoiGiaiCauTruc | undefined {
  if (!lg) return lg
  const ly = <T extends object>(m: T): T =>
    Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v && typeof v.viSao === 'string' ? { ...v, viSao: chiSoDuoiRo(v.viSao) } : v])) as T
  const ra: LoiGiaiCauTruc = { ...lg }
  if (typeof lg.chot === 'string') ra.chot = chiSoDuoiRo(lg.chot)
  if (lg.tungPa) ra.tungPa = ly(lg.tungPa)
  if (lg.tungY) ra.tungY = ly(lg.tungY)
  if (lg.buoc) ra.buoc = lg.buoc.map((b) => (typeof b === 'string' ? chiSoDuoiRo(b) : b))
  if (typeof lg.ketQua === 'string') ra.ketQua = chiSoDuoiRo(lg.ketQua)
  return ra
}

const bon = <T,>(a: T[] | undefined, lap: T): [T, T, T, T] => [a?.[0] ?? lap, a?.[1] ?? lap, a?.[2] ?? lap, a?.[3] ?? lap]

/** Props `TheCau` (xem_lai) cho một câu em đã làm: đáp án đúng tô xanh, lựa chọn sai của em tô đỏ, ô LỜI GIẢI chuẩn. */
export function propsTheCau(ct: ChiTietCau, stt: number): TheCauProps {
  const { de } = ct
  const chung = {
    cheDo: 'xem_lai' as const,
    stt: Math.max(1, stt),
    tieuDe: de.tenDang || undefined,
    text: chiSoDuoiRo(de.text),
    thanCauImg: de.thanCauImg,
    table: de.table,
    imageDataUrl: de.imageDataUrl,
    hinhAnh: de.hinhAnh as HinhAnh[],
    loiGiai: loiGiaiRo(loiGiaiChoTheCau(ct.loiGiai, de.phan, ct.dapAn)),
  }
  if (de.phan === 'I') {
    const chon = String(ct.emTraLoi ?? '').trim().toUpperCase()
    const dung = ct.dapAn.trim().toUpperCase()
    return {
      ...chung,
      phan: 'I',
      choices: bon(de.choices, '').map(chiSoDuoiRo) as [string, string, string, string],
      choiceImgs: de.choiceImgs ? (bon(de.choiceImgs.map((x) => x || undefined), undefined) as [string?, string?, string?, string?]) : undefined,
      choicePerm: [0, 1, 2, 3],
      selected: /^[A-D]$/.test(chon) ? (chon as Chu) : null,
      correct: /^[A-D]$/.test(dung) ? (dung as Chu) : undefined,
    }
  }
  if (de.phan === 'II') {
    const dung = tachDungSai(ct.dapAn)
    return {
      ...chung,
      phan: 'II',
      ideas: bon(de.ideas, '').map(chiSoDuoiRo) as [string, string, string, string],
      ideaImgs: de.ideaImgs ? (bon(de.ideaImgs.map((x) => x || undefined), undefined) as [string?, string?, string?, string?]) : undefined,
      selected: tachDungSai(ct.emTraLoi) ?? [null, null, null, null],
      correct: dung && dung.every((x) => x !== null) ? (dung as [DS, DS, DS, DS]) : undefined,
    }
  }
  return { ...chung, phan: 'III', selected: ct.emTraLoi, correct: ct.dapAn || undefined }
}

/** Một câu cho phiếu in (`dungPhieu`): lời giải đọc qua `chuanHoaLoiGiaiCau`; câu em sai lần gần nhất mang nhãn "Em làm sai câu N". */
export function cauLuyenTuChiTiet(ct: ChiTietCau, muc: CauDaLamMuc | undefined): CauLuyen {
  const { de } = ct
  const lg = chuanHoaLoiGiaiCau(ct.loiGiai, de.phan, ct.dapAn)
  const sao = de.sao === 2 || de.sao === 1 ? de.sao : 0
  const stt = muc?.stt ?? 0
  const saiGanNhat = muc?.lanCuoiDung === false
  return {
    phan: de.phan,
    id: de.qid,
    maDe: de.maDe,
    chuyenDe: de.tenDang,
    dang: 'chua_ro',
    sao,
    mucDo: mucDoChuan(de.mucDo ?? muc?.mucDo) ?? '',
    text: de.text,
    luaChon: de.phan === 'I' ? de.choices : de.phan === 'II' ? de.ideas : null,
    dapAn: de.phan === 'II' ? (tachDungSai(ct.dapAn)?.map((x) => x ?? '-').join('') ?? ct.dapAn) : ct.dapAn,
    chot: lg.chot,
    lyDo: lg.lyDo,
    buoc: lg.buoc,
    ketQua: lg.ketQua,
    anhThanCau: de.thanCauImg,
    anhLuaChon: de.phan === 'I' ? de.choiceImgs?.map((x) => x || undefined) : de.phan === 'II' ? de.ideaImgs?.map((x) => x || undefined) : undefined,
    hinh: de.hinhAnh,
    bang: de.table ?? null,
    ...(saiGanNhat
      ? {
          chuaCho: {
            qid: de.qid,
            soCau: stt,
            phan: de.phan,
            maDang: '',
            tenDang: de.tenDang,
            bac: 1 as const,
            daChon: ct.emTraLoi ?? '',
            laDeCuaEm: true as const,
            dapAnDung: ct.dapAn,
          },
        }
      : {}),
  }
}

const CHU_Y = ['a', 'b', 'c', 'd'] as const
/** 'D' → "Đúng", 'S' → "Sai", trống → "bỏ trống". */
export const chuDS = (v: DS | null | undefined): string => (v === 'D' ? 'Đúng' : v === 'S' ? 'Sai' : 'bỏ trống')
const soChuan = (s: string | null | undefined): string => normalizeNumericAnswer(String(s ?? ''))

/** Phần III: câu trả lời của em có khớp đáp án không (cùng luật chấm số với TheCau). */
export function traLoiNganDung(em: string | null | undefined, dapAn: string): boolean {
  const e = soChuan(em)
  return !!e && !!soChuan(dapAn) && e === soChuan(dapAn)
}

/** Phần tóm tắt của THẺ ĐANG ĐÓNG (bản vẽ HS-CauDaLam): một dòng đề + "Em chọn: … · Đáp án: …".
 *  Phần II: dòng đề là ý em làm sai đầu tiên ("a) …") và đầu thẻ thêm "sai 1/4 ý". Chỉ dựng từ `hoa2-cau-chi-tiet`. */
export interface TomTatThe {
  /** Thêm vào đầu thẻ, ví dụ "sai 1/4 ý" (chỉ phần II có ý sai). */
  phuDau: string
  /** Dòng đề (có thể chứa công thức — hiện bằng ChemText). */
  de: string
  /** "Em chọn" (I, II) · "Em trả lời" (III). */
  nhanEm: string
  em: string
  /** Rỗng khi em đúng (khỏi nhắc lại). */
  dapAn: string
  dung: boolean
}
export function tomTatThe(ct: ChiTietCau): TomTatThe {
  const { de } = ct
  if (de.phan === 'I') {
    const chon = String(ct.emTraLoi ?? '').trim().toUpperCase()
    const dung = ct.dapAn.trim().toUpperCase()
    const pa = (k: string) => {
      const i = 'ABCD'.indexOf(k)
      if (!/^[A-D]$/.test(k)) return ''
      const chu = (de.choices[i] ?? '').trim()
      return chu && !de.choiceImgs?.[i] ? `${k}. ${chu}` : k
    }
    const dungKhong = !!chon && chon === dung
    return { phuDau: '', de: de.text, nhanEm: 'Em chọn', em: pa(chon) || 'bỏ trống', dapAn: dungKhong ? '' : pa(dung) || dung, dung: dungKhong }
  }
  if (de.phan === 'II') {
    const em = tachDungSai(ct.emTraLoi) ?? [null, null, null, null]
    const dung = tachDungSai(ct.dapAn)
    const sai = dung ? [0, 1, 2, 3].filter((i) => em[i] !== dung[i]) : []
    if (!dung || sai.length === 0) {
      return { phuDau: '', de: de.text, nhanEm: 'Em chọn', em: dung ? 'đúng cả 4 ý' : em.map((v, i) => `${CHU_Y[i]}) ${chuDS(v)}`).join(' · '), dapAn: '', dung: !!dung }
    }
    const i = sai[0]!
    return {
      phuDau: `sai ${sai.length}/4 ý`,
      de: `${CHU_Y[i]}) ${(de.ideas[i] ?? '').trim()}`,
      nhanEm: 'Em chọn',
      em: chuDS(em[i]),
      dapAn: chuDS(dung[i]),
      dung: false,
    }
  }
  const em = String(ct.emTraLoi ?? '').trim()
  const dung = traLoiNganDung(em, ct.dapAn)
  return { phuDau: '', de: de.text, nhanEm: 'Em trả lời', em: em || 'bỏ trống', dapAn: dung ? '' : ct.dapAn, dung }
}
