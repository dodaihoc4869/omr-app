// BÁO CÁO CẢ LỚP LẤY TỪ MÁY CHỦ (Xem điểm bản 2 · GV-1) — lệnh `POST /gv/bao-cao-ca {maCa}` (server/src/bao-cao-ca.ts; hợp đồng docs/hop-dong-xem-diem-v2-2109.md mục 4, Code 3).
// Máy chủ có kho câu nên KHÔNG cần máy thầy giữ ngân hàng đáp án của ca: dạng cả lớp vấp / câu sai nhiều có cả khi máy thầy chưa có đáp án. ĐỌC-CHỈ, không bị chặn công bố.
// Bộ đọc CHỐNG SAI KIỂU: khối sai dạng ⇒ bỏ khối; thiếu `tongQuan.soEm` ⇒ null (màn rơi về số tính ở máy — `tinhBaoCaoCaLop`). Chữ lý do giữ ĐÚNG như bản tính ở máy (`lyDoDiemThap`, `lyDoRoiMan`); dữ kiện
// "rời màn làm bài" chỉ máy thầy có (đếm khi em làm) nên nhận từ nơi gọi. Số liệu, không nhãn năng lực, không xếp hạng em.
import { goiLenh } from './goi-lenh-thay'
import {
  KHOANG_DIEM, NGUONG_DIEM_THAP, NGUONG_ROI_MAN, TOI_DA_CAU_SAI, TOI_DA_DANG, TOI_DA_EM_CAN_YY, lyDoDiemThap, lyDoRoiMan,
  type BaoCaoCaLop, type CauSaiNhieu, type DangCaLop, type EmCanYY, type PhanTrungBinh,
} from './bao-cao-ca-lop'
import { soVn } from './ket-qua-sau-nop'

/** Dữ kiện rời màn của từng em (chỉ máy thầy có): dùng để gộp lý do "rời màn ≥ 3 lần" vào danh sách em cần để ý. */
export interface EmRoiMan {
  sbd: string
  hoTen: string
  lop: string
  soLanRoiMan: number
  tongGiayRoiMan: number
}

/** Điểm giảm từ mức này so với lần trước của CHÍNH em thì nêu (khớp GIAM_DIEM_CAN_Y ở máy chủ). */
export const GIAM_DIEM_NEU = 1.5

const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const khongAm = (v: unknown): number | null => {
  const n = so(v)
  return n !== null && n >= 0 ? n : null
}
const chu = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const doiTuong = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null)
const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const PHAN = ['I', 'II', 'III'] as const
const TEN_PHAN = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' } as const

interface HocSinhMayChu {
  sbd: string
  hoTen: string
  tong: number
  thoiGianLamGiay: number | null
  soCauDung: number | null
  soCau: number | null
}
function docHocSinh(v: unknown): HocSinhMayChu[] {
  const ra: HocSinhMayChu[] = []
  for (const x of mang(v)) {
    const o = doiTuong(x)
    if (!o) continue
    const sbd = chu(o.sbd)
    const tong = so(o.tong)
    if (!sbd || tong === null) continue
    ra.push({ sbd, hoTen: chu(o.hoTen) || sbd, tong, thoiGianLamGiay: khongAm(o.thoiGianLamGiay), soCauDung: khongAm(o.soCauDung), soCau: khongAm(o.soCau) })
  }
  return ra
}

/** Thân `/gv/bao-cao-ca` ⇒ `BaoCaoCaLop` (đúng hình của bản tính ở máy để màn dùng chung). null ⇒ thân không đọc được. */
export function docBaoCaoCaLopMayChu(j: Record<string, unknown>, roiMan: readonly EmRoiMan[] = []): BaoCaoCaLop | null {
  const tq = doiTuong(j.tongQuan)
  const nop = tq ? khongAm(tq.soEm) : null
  if (!tq || nop === null) return null
  const congBo = doiTuong(j.congBo)
  const daVao = Math.max(nop, Math.round(khongAm(congBo?.soEmDaVao) ?? nop))
  const hs = docHocSinh(j.hocSinh)

  // thời gian làm trung bình: từ thời gian làm của từng em (máy chủ chỉ gửi khi có mốc vào/nộp)
  const giay = hs.map((e) => e.thoiGianLamGiay).filter((g): g is number => g !== null && g > 0)
  const phutTB = giay.length ? Math.round(giay.reduce((t, g) => t + g, 0) / giay.length / 60) : null

  // phổ điểm: máy chủ đếm 10 khoảng đơn vị [0,1)…[9,10] ⇒ gộp vào các khoảng của màn (`KHOANG_DIEM`, biên nguyên); hỏng ⇒ tự đếm từ điểm từng em
  const phoMay = mang(tq.phoDiem)
    .map((x) => {
      const o = doiTuong(x)
      return o ? { tu: so(o.tu), so: khongAm(o.so) } : null
    })
    .filter((o): o is { tu: number; so: number } => o !== null && o.tu !== null && o.so !== null)
  const pho = KHOANG_DIEM.map(([tu, den, nhan]) => ({
    nhan,
    soEm: phoMay.length >= 10 ? phoMay.filter((o) => o.tu >= tu && o.tu < den).reduce((t, o) => t + o.so, 0) : hs.filter((e) => e.tong >= tu && e.tong < den).length,
  }))

  const baPhan: PhanTrungBinh[] = []
  for (const x of mang(tq.phanTb)) {
    const o = doiTuong(x)
    const ma = PHAN.find((m) => m === o?.ma)
    const diemTB = so(o?.diemTb), dungTB = so(o?.dungTb), tong = khongAm(o?.tong), toiDa = khongAm(o?.toiDa)
    if (!ma || diemTB === null || dungTB === null || tong === null || toiDa === null) continue
    baPhan.push({ ma, ten: TEN_PHAN[ma], diemTB, toiDa, dungTB, tong })
  }

  const dang: DangCaLop[] = []
  for (const x of mang(j.dangCaLopVap)) {
    const o = doiTuong(x)
    const ten = chu(o?.ten)
    const ti = so(o?.tiLeDung), soEmSai = khongAm(o?.soEmSai), soEm = khongAm(o?.soEm)
    if (!ten || ti === null || ti < 0 || ti > 1 || soEmSai === null || soEm === null) continue
    dang.push({ ten, tiLeDung: Math.round(ti * 100), soEmSai, soEmLam: soEm })
  }
  dang.sort((a, b) => a.tiLeDung - b.tiLeDung || b.soEmSai - a.soEmSai || a.ten.localeCompare(b.ten, 'vi'))

  const cauSai: CauSaiNhieu[] = []
  for (const x of mang(j.cauSaiNhieu)) {
    const o = doiTuong(x)
    const phan = PHAN.find((m) => m === o?.phan)
    const qid = chu(o?.qid)
    const soCau = khongAm(o?.soCau), soEmSai = khongAm(o?.soEmSai), soEm = khongAm(o?.soEm)
    if (!o || !phan || !qid || soCau === null || soEmSai === null || soEm === null || soEm < 1) continue
    const sn = doiTuong(o.dapAnSaiNhieu)
    const dapAn = chu(sn?.dapAn), emChon = khongAm(sn?.soEm)
    cauSai.push({
      qid, phan, soCau, dang: chu(o.dang), soSai: soEmSai, soLam: soEm, tiLeSai: Math.round((soEmSai / soEm) * 100), dapAnDung: chu(o.dapAnDung),
      dapAnSaiNhieu: dapAn && emChon !== null ? { dapAn, soEm: emChon } : null,
    })
  }
  cauSai.sort((a, b) => b.tiLeSai - a.tiLeSai || b.soSai - a.soSai || a.soCau - b.soCau)

  // em cần để ý: dữ kiện của máy chủ (điểm dưới 5, điểm giảm ≥ 1,5 so với lần trước của CHÍNH em) + "rời màn ≥ 3 lần" của máy thầy; lý do luôn bằng SỐ
  const roiTheoSbd = new Map(roiMan.map((e) => [e.sbd, e]))
  const canYY: EmCanYY[] = []
  const daCo = new Map<string, EmCanYY>()
  const them = (sbd: string, hoTen: string, lop: string, ly: string) => {
    const cu = daCo.get(sbd)
    if (cu) cu.lyDo.push(ly)
    else {
      const m: EmCanYY = { sbd, hoTen, lop, lyDo: [ly] }
      daCo.set(sbd, m)
      canYY.push(m)
    }
  }
  for (const x of mang(j.emCanYY)) {
    const o = doiTuong(x)
    const sbd = chu(o?.sbd)
    const tong = so(o?.tong)
    if (!o || !sbd || tong === null) continue
    const h = hs.find((e) => e.sbd === sbd)
    const roi = roiTheoSbd.get(sbd)
    const hoTen = chu(o.hoTen) || h?.hoTen || roi?.hoTen || sbd
    const lop = roi?.lop ?? ''
    if (tong < NGUONG_DIEM_THAP) them(sbd, hoTen, lop, lyDoDiemThap(tong, h?.soCauDung ?? null, h?.soCau ?? null))
    const truoc = so(o.diemTruoc), doi = so(o.doi)
    if (truoc !== null && doi !== null && doi <= -GIAM_DIEM_NEU) them(sbd, hoTen, lop, `Điểm giảm ${soVn(-doi)} so với lần trước (${soVn(truoc)} → ${soVn(tong)})`)
  }
  for (const e of [...roiMan].sort((a, b) => b.soLanRoiMan - a.soLanRoiMan)) {
    if (e.soLanRoiMan >= NGUONG_ROI_MAN) them(e.sbd, e.hoTen, e.lop, lyDoRoiMan(e.soLanRoiMan, e.tongGiayRoiMan))
  }

  return {
    nop,
    daVao,
    chuaNop: Math.max(0, daVao - nop),
    tb: so(tq.tb),
    cao: so(tq.cao),
    thap: so(tq.thap),
    phutTB,
    pho,
    baPhan,
    dang: dang.slice(0, TOI_DA_DANG),
    cauSai: cauSai.slice(0, TOI_DA_CAU_SAI),
    emCanYY: canYY.slice(0, TOI_DA_EM_CAN_YY),
    coBangCham: true, // máy chủ có kho câu: không phụ thuộc ngân hàng đáp án của máy thầy
  }
}

/** Hỏi máy chủ MỘT lần. Không có lệnh (404) / từ chối / lỗi mạng / thân sai dạng ⇒ null ⇒ nơi gọi rơi về số tính ở máy. */
export async function layBaoCaoCaLopMayChu(maCa: string, roiMan: readonly EmRoiMan[] = []): Promise<BaoCaoCaLop | null> {
  const r = await goiLenh('/gv/bao-cao-ca', { maCa }, 'Máy chủ chưa có lệnh Báo cáo ca — tính từ số ở máy này.')
  return r.ok ? docBaoCaoCaLopMayChu(r.du as Record<string, unknown>, roiMan) : null
}
