// TỔNG QUAN VỀ CON CHO PHỤ HUYNH (thầy 12/10: "cho phụ huynh biết nhiều thông tin cần thiết nữa về con, số câu làm đúng, làm sai, thời gian làm từng câu
// gợi ý nhắc, bỏ mục thầy cần chữa … để phụ huynh theo dõi được con toàn diện"). Hợp đồng: `ph-con-tong-quan-kieu.ts`.
//
// `POST /ph/con-tong-quan {pass|sbd}` — LỆNH PHỤ HUYNH, CHỈ ĐỌC, chạy trên `envDoc` (bản sao gần nhất) như `/ph/hoc-2`.
//   · XÁC THỰC: `sbdCuaPhuHuynh` + `CHI_NHAN_TOKEN` — y hệt `/ph/tat-ca-ve-con`, `/ph/hoc-2`: có `pass` ⇒ danh tính từ liên kết riêng, `sbd` trong thân bị bỏ qua;
//     liên kết hỏng/hết hạn ⇒ báo lỗi, KHÔNG rơi xuống SBD trần. Việc ghi DUY NHẤT là dòng đếm truy cập của chính hàm xác thực (hoãn qua ctx, ghi `envGoc`).
//   · SỔ `su_kien_hoc` của đúng con đó, từ `tuNgay` tới hôm nay (giờ VN), tối đa 5000 lượt mới nhất. BỎ sự kiện còn giấu (`visibility = 'embargoed'`), mọi dòng
//     không phải lần làm (`SQL_LA_LAN_LAM`: đọc lời giải, lượt, chẩn đoán, chữa bước) và lượt của ca kiểm tra CHƯA công bố (`SQL_DA_CONG_BO`).
//     Truy vấn lỗi (D1 cũ thiếu cột lọc) ⇒ trả lỗi, KHÔNG lùi về câu lệnh không lọc.
//   · KHÔNG trả: mã câu, đề bài, đáp án đúng, đáp án con chọn, lời giải, tên trò chơi. Tiêu đề câu = "Câu N · <tên dạng>" (cách sẵn có `tieuDeCau`).
//   · SỐ GIÂY dùng lại đúng các hàm của lịch sử làm câu (ai-sai-cau.ts): cột `giay` ⇒ raw ms ⇒ chi tiết ca ⇒ ước tính lượt game ('uoc') ⇒ null.
//   · MỨC TỐI THIỂU từng ngày: `hanh_trinh_v3_ngay.toi_thieu` đã lưu (kế hoạch ngày đang chấm, như thẻ Nhịp học của thầy `bangHanhTrinh`); số câu tính vào mức
//     = câu của kế hoạch đã chốt (`srs2_ke_hoach`) con đã làm trong ngày (`idDaLam`). Ngày không có mức đã lưu ⇒ sàn hiện hành theo tầng (`CAU_TOI_THIEU`), `mucUocTinh`.
//   · GỢI Ý NHẮC: hàm thuần `sinhGoiYNhac` (luật ghi ngay trên hàm), tối đa 5, không đủ dữ liệu ⇒ ít hơn.
// Truy vấn: xác thực (1) + sổ (1) + kế hoạch (1) + mức (1) + chi tiết ca (≤ 1) + ước tính game (≤ 1 lô 2) + kho câu (đệm) + tên dạng thiếu (≤ 1).
import type { Env, ExecutionContext } from './kieu'
import type {
  CauSaiCon, DemCau, GoiYNhac, KetQuaConTongQuan, KhoangGiay, LuotGanDay, NgayHoc, NguonGiay, ThoiGianLam, TraLoiConTongQuan,
} from './ph-con-tong-quan-kieu'
import { GIAY_NHANH, MOC_THEO_DOI, SO_CAU_SAI_TOI_DA, SO_GOI_Y_TOI_DA, SO_LUOT_GAN_DAY } from './ph-con-tong-quan-kieu'
import { CHI_NHAN_TOKEN } from './ph-tat-ca-ve-con'
import { sbdCuaPhuHuynh } from './ph-truy-cap'
import { chiTietCauCuaLuot, giayDoCuaLuot, giayUocTinhGame } from './ai-sai-cau'
import { tieuDeCau } from './lich-su-lam-cau'
import { docCauKho, tenCuaDang } from './omni-d1'
import { tachSongSinh } from './loi-hoc-luat'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { CAU_TOI_THIEU, type TangHanhTrinh } from './hanh-trinh-ngay'
import { idDaLam } from './hanh-trinh-nguon-cau'
import { ngayBaiCuaMotEm } from './bai-hang-ngay'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x)).trim()
const MOT_NGAY = 86_400_000
const GIO_VN = 7 * 3_600_000

/** Số lượt mới nhất đọc tối đa trong khoảng (vượt ⇒ `catBot`). */
export const TOI_DA_LUOT_DOC_PH = 5000
/** Mốc các khoảng của phân bố số giây (giây): dưới 8 · 8–30 · 30–60 · 60–120 · 120–300 · từ 300. */
export const MOC_PHAN_BO_GIAY = [0, GIAY_NHANH, 30, 60, 120, 300] as const

export const ngayVnCuaMs = (ms: number): string => new Date(ms + GIO_VN).toISOString().slice(0, 10)
export const congNgay = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * MOT_NGAY).toISOString().slice(0, 10)
/** "12/10" từ "2026-10-12". */
export const ngayNgan = (ngay: string): string => `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`

/** Nơi làm bằng chữ đời thường cho phụ huynh — KHÔNG tên trò chơi (thầy 28/09: app phụ huynh không có trường game). */
export function noiChoPh(nguon: string): string {
  return ({
    thi: 'Ca kiểm tra',
    game: 'Bài luyện trên app',
    on_lai: 'Ôn lại',
    tu_luyen: 'Tu luyện',
    chua_loi: 'Tự chữa lỗi',
    len_bang: 'Lên bảng',
    dau_gio: 'Kiểm tra đầu giờ',
    btvn: 'Bài tập về nhà',
    btvn_lo: 'Bài tập về nhà',
    khac_phuc: 'Khắc phục',
    mom: 'Bài gia đình giao',
    luyen: 'Luyện đề',
  } as Record<string, string>)[nguon] ?? 'Bài luyện trên app'
}

/** "Câu 25 · Tên dạng"; không có tên dạng ⇒ "Câu 25" (theo quy ước mã `<mã tờ>-<phần>-<số>`); mã khác ⇒ ''. Không lộ mã câu. */
export function tieuDeChoPh(goc: string, tenDang: string): string {
  const t = tieuDeCau(goc, tenDang)
  if (t) return t
  const m = /-(III|II|I)-(\d+)$/.exec(goc)
  return m ? `Câu ${Number(m[2])}` : ''
}

/** Một lượt đã đọc (nội bộ máy chủ, không trả nguyên dòng cho app). */
export interface Dong {
  qid: string
  goc: string
  tc: string
  nguon: string
  maNguon: string
  lan: number
  /** 1 đúng · 0 (hoặc số khác 1) sai · null bỏ trống. */
  kq: number | null
  luc: string
  ngay: string
  maDang: string
  coGoiY: boolean
  giay: number | null
  nguonGiay: NguonGiay
}
const laDung = (d: Dong) => d.kq === 1
const laSai = (d: Dong) => d.kq !== null && d.kq !== 1

export function demCau(ds: readonly Dong[]): DemCau {
  const coGiay = ds.filter((d) => d.giay !== null)
  return {
    soLuot: ds.length,
    dung: ds.filter(laDung).length,
    sai: ds.filter(laSai).length,
    boTrong: ds.filter((d) => d.kq === null).length,
    soCau: new Set(ds.filter((d) => d.kq !== null).map((d) => d.goc)).size,
    giayTb: coGiay.length ? Math.round(coGiay.reduce((t, d) => t + (d.giay ?? 0), 0) / coGiay.length) : null,
  }
}

/** Giờ Việt Nam (0–23) của một mốc ISO; mốc hỏng ⇒ null. */
const gioVn = (luc: string): number | null => {
  const t = Date.parse(luc)
  return Number.isFinite(t) ? new Date(t + GIO_VN).getUTCHours() : null
}
/** Khung "khuya": 23:00–04:59 giờ VN. */
export const laGioKhuya = (luc: string): boolean => {
  const g = gioVn(luc)
  return g !== null && (g >= 23 || g < 5)
}

export function thoiGianLam(ds: readonly Dong[]): ThoiGianLam {
  const coGiay = ds.filter((d) => d.giay !== null)
  const giay = coGiay.map((d) => d.giay!).sort((a, b) => a - b)
  const giua = giay.length ? (giay.length % 2 ? giay[(giay.length - 1) / 2]! : Math.round((giay[giay.length / 2 - 1]! + giay[giay.length / 2]!) / 2)) : null
  const phanBo: KhoangGiay[] = MOC_PHAN_BO_GIAY.map((tu, i) => {
    const den = MOC_PHAN_BO_GIAY[i + 1] ?? null
    const trong = coGiay.filter((d) => d.giay! >= tu && (den === null || d.giay! < den))
    return { tu, den, so: trong.length, sai: trong.filter(laSai).length }
  })
  const nhanh = coGiay.filter((d) => d.giay! < GIAY_NHANH)
  return {
    giayTb: giay.length ? Math.round(giay.reduce((t, g) => t + g, 0) / giay.length) : null,
    giayGiua: giua,
    soDo: coGiay.filter((d) => d.nguonGiay === 'do').length,
    soUoc: coGiay.filter((d) => d.nguonGiay === 'uoc').length,
    soChuaDo: ds.length - coGiay.length,
    phanBo,
    nhanh: { so: nhanh.length, sai: nhanh.filter(laSai).length },
  }
}

// ---------------------------------------------------------------- GỢI Ý NHẮC CON (luật) ----------------------------------------------------------------
/** Ngưỡng của luật gợi ý (một chỗ, test khoá). */
export const LUAT_GOI_Y = {
  /** Nhanh mà sai: ít nhất 5 lượt dưới 8 giây trong 7 ngày và sai từ một nửa trở lên. */
  nhanhToiThieu: 5,
  nhanhTiLeSai: 0.5,
  /** Làm khuya: ít nhất 2 ngày trong 7 ngày có lượt 23:00–04:59. */
  khuyaSoNgay: 2,
  /** Tỉ lệ đúng giảm: mỗi bên ít nhất 20 lượt có kết quả và giảm từ 15 điểm phần trăm. */
  tiLeSoLuot: 20,
  tiLeGiam: 0.15,
  /** Dùng gợi ý: ít nhất 10 lượt trong 7 ngày và từ một nửa trở lên có dùng gợi ý. */
  goiYSoLuot: 10,
  goiYTiLe: 0.5,
} as const

export interface DauVaoGoiY {
  moc: string
  /** Ngày hôm nay (null ⇒ không có dòng ngày). */
  homNay: NgayHoc | null
  /** Các ngày TỪ MỐC tới trước hôm nay. */
  ngayTruoc: readonly NgayHoc[]
  nhanh: { so: number; sai: number }
  chuaSua: number
  khuya: { soNgay: number; soLuot: number }
  bay: { dung: number; sai: number }
  truoc: { dung: number; sai: number }
  goiYDaDung: { so: number; tong: number }
}

const pt = (x: number) => Math.round(x * 100)

/**
 * 3–5 câu nhắc cụ thể, theo THỨ TỰ ƯU TIÊN (lấy tối đa `SO_GOI_Y_TOI_DA`, luật không đủ dữ liệu ⇒ bỏ, không độn):
 *   1. Hôm nay chưa đủ mức: chưa làm câu nào ⇒ "chua-lam-hom-nay"; đã làm một phần ⇒ "con-cau-hom-nay" (số câu còn lại). Mức ước tính ⇒ ghi "≈".
 *   2. Câu sai chưa sửa ≥ 1 ⇒ nhắc vào mục Tự chữa lỗi.
 *   3. Nhanh mà sai: ≥ 5 lượt dưới 8 giây (7 ngày) và sai ≥ 50% trong số đó ⇒ nhắc đọc kỹ đề.
 *   4. Từ mốc 12/10 có ngày không làm / làm chưa đủ mức (không tính hôm nay).
 *   5. Tỉ lệ đúng 7 ngày giảm ≥ 15 điểm so với 7 ngày trước đó (mỗi bên ≥ 20 lượt có kết quả).
 *   6. Làm khuya: ≥ 2 ngày trong 7 ngày có lượt 23:00–04:59.
 *   7. Dùng gợi ý ở ≥ 50% lượt (≥ 10 lượt trong 7 ngày).
 * Giọng thẳng, không khen, không dấu gạch ngang dài, mỗi câu ≤ 30 chữ (quy tắc viết cho phụ huynh).
 */
export function sinhGoiYNhac(v: DauVaoGoiY): GoiYNhac[] {
  const ra: GoiYNhac[] = []
  const h = v.homNay
  if (h && h.daLam < h.canLam) {
    const xap = h.mucUocTinh ? '≈' : ''
    if (h.daLam === 0 && h.soCau === 0) ra.push({ ma: 'chua-lam-hom-nay', chu: `Hôm nay con chưa làm câu nào. Mức của ngày là ${xap}${h.canLam} câu.` })
    else ra.push({ ma: 'con-cau-hom-nay', chu: `Hôm nay con còn ${xap}${h.canLam - h.daLam} câu chưa làm (đã làm ${h.daLam}/${xap}${h.canLam} câu).` })
  }
  if (v.chuaSua > 0) ra.push({ ma: 'sai-chua-sua', chu: `Có ${v.chuaSua} câu con làm sai chưa sửa được. Nhắc con vào mục Tự chữa lỗi để làm lại.` })
  if (v.nhanh.so >= LUAT_GOI_Y.nhanhToiThieu && v.nhanh.sai >= v.nhanh.so * LUAT_GOI_Y.nhanhTiLeSai)
    ra.push({ ma: 'nhanh-sai', chu: `7 ngày qua có ${v.nhanh.so} câu con làm dưới ${GIAY_NHANH} giây và sai ${v.nhanh.sai} câu. Nhắc con đọc kỹ đề trước khi chọn.` })
  const khong = v.ngayTruoc.filter((n) => n.trangThai === 'khong').length
  const thieu = v.ngayTruoc.filter((n) => n.trangThai === 'thieu').length
  if (khong + thieu > 0) {
    const phan = [khong ? `${khong} ngày không làm bài` : '', thieu ? `${thieu} ngày làm chưa đủ mức` : ''].filter(Boolean).join(' và ')
    ra.push({ ma: 'thieu-ngay', chu: `Từ ${ngayNgan(v.moc)} con có ${phan}. Hỏi con lý do và chốt một giờ học cố định mỗi ngày.` })
  }
  const nBay = v.bay.dung + v.bay.sai, nTruoc = v.truoc.dung + v.truoc.sai
  if (nBay >= LUAT_GOI_Y.tiLeSoLuot && nTruoc >= LUAT_GOI_Y.tiLeSoLuot) {
    const a = v.bay.dung / nBay, b = v.truoc.dung / nTruoc
    if (b - a >= LUAT_GOI_Y.tiLeGiam - 1e-9)
      ra.push({ ma: 'ti-le-giam', chu: `Tỉ lệ đúng 7 ngày qua là ${pt(a)}%, thấp hơn 7 ngày trước đó (${pt(b)}%). Hỏi con phần nào đang khó để báo Thầy.` })
  }
  if (v.khuya.soNgay >= LUAT_GOI_Y.khuyaSoNgay)
    ra.push({ ma: 'lam-khuya', chu: `Con hay làm bài sau 23 giờ (${v.khuya.soNgay} trong 7 ngày qua). Nhắc con học sớm hơn để đủ giấc.` })
  if (v.goiYDaDung.tong >= LUAT_GOI_Y.goiYSoLuot && v.goiYDaDung.so >= v.goiYDaDung.tong * LUAT_GOI_Y.goiYTiLe)
    ra.push({ ma: 'dung-goi-y', chu: `Con dùng gợi ý ở ${v.goiYDaDung.so}/${v.goiYDaDung.tong} câu trong 7 ngày qua. Nhắc con tự làm trước, bí mới mở gợi ý.` })
  return ra.slice(0, SO_GOI_Y_TOI_DA)
}

// ---------------------------------------------------------------- mức từng ngày ----------------------------------------------------------------
const mangChuoi = (x: unknown): string[] => {
  try {
    const a: unknown = JSON.parse(String(x ?? '[]'))
    return Array.isArray(a) ? a.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}
const laTang = (t: number): t is TangHanhTrinh => t === 1 || t === 2 || t === 3 || t === 4

/** Tầng dùng để ước tính mức của một ngày không có mức đã lưu: tầng đã lưu gần nhất TRƯỚC ngày đó, không có ⇒ gần nhất SAU, không có ⇒ tầng 1. */
export function tangUocTinh(ngay: string, daLuu: readonly { ngay: string; tang: number }[]): TangHanhTrinh {
  const truoc = daLuu.filter((x) => x.ngay < ngay && laTang(x.tang)).sort((a, b) => (a.ngay < b.ngay ? 1 : -1))[0]
  if (truoc) return truoc.tang as TangHanhTrinh
  const sau = daLuu.filter((x) => x.ngay > ngay && laTang(x.tang)).sort((a, b) => (a.ngay < b.ngay ? -1 : 1))[0]
  return sau ? (sau.tang as TangHanhTrinh) : 1
}

async function hoi(env: Env, sql: string, ...bind: unknown[]): Promise<Row[]> {
  try {
    return (await env.DB.prepare(sql).bind(...bind).all<Row>()).results ?? []
  } catch {
    // Bảng kế hoạch / mức chưa có trên D1 (tạo lúc chạy) ⇒ chưa có dữ liệu ấy. Không làm hỏng cả lệnh.
    return []
  }
}

// ---------------------------------------------------------------- /ph/con-tong-quan ----------------------------------------------------------------
export async function phConTongQuan(envGoc: Env, b: Row, nowMs: number = Date.now(), envDoc: Env = envGoc, ctx?: ExecutionContext): Promise<TraLoiConTongQuan> {
  const { sbd } = await sbdCuaPhuHuynh(envDoc, b, 'ph-con-tong-quan', { chiToken: CHI_NHAN_TOKEN, envGhi: envGoc, ctx })
  const env = envDoc
  const homNay = ngayVnCuaMs(nowMs)
  const tuNgay = [MOC_THEO_DOI, congNgay(homNay, -13)].sort()[0]!
  const bayTu = congNgay(homNay, -6)
  const truocTu = congNgay(homNay, -13), truocDen = congNgay(homNay, -7)

  // 1 · sổ: CHỈ lần làm, KHÔNG sự kiện còn giấu, KHÔNG lượt của ca chưa công bố. Lỗi ⇒ trả lỗi (không lùi về câu lệnh không lọc).
  let rSo: Row[]
  try {
    rSo = (await env.DB.prepare(
      `SELECT s.qid, s.nguon, s.ma_nguon, s.lan, s.ket_qua, s.giay, s.luc, s.ngay_vn, s.ma_dang, s.assistance,
              CASE WHEN json_valid(s.raw_json) THEN json_extract(s.raw_json, '$.tc') END AS tc,
              CASE WHEN json_valid(s.raw_json) THEN json_extract(s.raw_json, '$.ms') END AS ms
         FROM su_kien_hoc s
        WHERE s.sbd = ? AND s.ngay_vn >= ? AND s.ngay_vn <= ?
          AND ${SQL_LA_LAN_LAM} AND COALESCE(s.visibility, '') <> 'embargoed'
          AND (s.nguon <> 'thi' OR EXISTS (SELECT 1 FROM ca c WHERE c.ma_ca = s.ma_nguon AND COALESCE(c.trang_thai, '') <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')}))
        ORDER BY s.ngay_vn DESC, s.luc DESC LIMIT ${TOI_DA_LUOT_DOC_PH + 1}`,
    ).bind(sbd, tuNgay, homNay).all<Row>()).results ?? []
  } catch {
    return { ok: false, error: 'Chưa đọc được sổ học của con. Anh/chị thử lại sau ít phút.' }
  }
  const catBot = rSo.length > TOI_DA_LUOT_DOC_PH
  const dong: Dong[] = rSo.slice(0, TOI_DA_LUOT_DOC_PH).map((x) => {
    const qid = str(x.qid)
    const tc = str(x.tc)
    const kq = x.ket_qua === null || x.ket_qua === undefined || x.ket_qua === '' ? null : Number(x.ket_qua)
    const giay = giayDoCuaLuot(x.giay, x.ms)
    return {
      qid, tc, goc: tachSongSinh(tc || qid).goc, nguon: str(x.nguon), maNguon: str(x.ma_nguon), lan: Number(x.lan) || 1,
      kq: kq === null || !Number.isFinite(kq) ? null : kq, luc: str(x.luc), ngay: str(x.ngay_vn), maDang: str(x.ma_dang),
      coGoiY: str(x.assistance) === 'assisted', giay, nguonGiay: giay === null ? null : 'do',
    }
  })
  dong.sort((a, c) => (a.luc < c.luc ? 1 : a.luc > c.luc ? -1 : 0))

  // 2 · tra phụ song song: số giây còn thiếu (chi tiết ca đã công bố · ước tính lượt game), kế hoạch đã chốt, mức đã lưu.
  const thiThieu = dong.filter((d) => d.giay === null && d.nguon === 'thi')
  const gameThieu = dong.filter((d) => d.giay === null && d.nguon === 'game')
  const [ct, uoc, rKh, rMuc] = await Promise.all([
    thiThieu.length ? chiTietCauCuaLuot(env, thiThieu.map((d) => d.maNguon), [sbd], thiThieu.map((d) => d.qid)).catch(() => new Map<string, { giay: number | null }>()) : Promise.resolve(new Map<string, { giay: number | null }>()),
    gameThieu.length ? giayUocTinhGame(env, gameThieu.map((d) => ({ sbd, phien: d.maNguon }))).catch(() => new Map<string, number>()) : Promise.resolve(new Map<string, number>()),
    hoi(env, 'SELECT ngay, dao_json, doan_json FROM srs2_ke_hoach WHERE sbd = ? AND ngay >= ? AND ngay <= ?', sbd, tuNgay, homNay),
    hoi(env, 'SELECT ngay, tang, toi_thieu FROM hanh_trinh_v3_ngay WHERE sbd = ? AND ngay <= ? ORDER BY ngay DESC LIMIT 60', sbd, homNay),
  ])
  for (const d of thiThieu) {
    const k = `${d.maNguon}|${sbd}|${d.qid}`
    const g = (ct.get(`${k}|${d.lan}`) ?? ct.get(`${k}|*`))?.giay ?? null
    if (g !== null) { d.giay = g; d.nguonGiay = 'do' }
  }
  for (const d of gameThieu) {
    const g = uoc.get(`${d.maNguon}|${Date.parse(d.luc)}`)
    if (g !== undefined) { d.giay = g; d.nguonGiay = 'uoc' }
  }

  // 3 · từng ngày từ `tuNgay` tới hôm nay
  const keHoach = new Map(rKh.map((r) => [str(r.ngay), [...new Set([...mangChuoi(r.dao_json), ...mangChuoi(r.doan_json)].map((q) => q.replace(/#\d+$/, '')))]]))
  const mucLuu = rMuc.map((r) => ({ ngay: str(r.ngay), tang: Number(r.tang), toiThieu: Number(r.toi_thieu) }))
  const theoNgay = new Map<string, Dong[]>()
  for (const d of dong) (theoNgay.get(d.ngay) ?? theoNgay.set(d.ngay, []).get(d.ngay)!).push(d)
  const ngay: NgayHoc[] = []
  for (let n = tuNgay; n <= homNay; n = congNgay(n, 1)) {
    const ds = theoNgay.get(n) ?? []
    const coKq = ds.filter((d) => d.kq !== null)
    const soCau = new Set(coKq.map((d) => d.goc)).size
    const luu = mucLuu.find((x) => x.ngay === n && Number.isInteger(x.toiThieu) && x.toiThieu > 0)
    const muc = luu ? luu.toiThieu : CAU_TOI_THIEU[tangUocTinh(n, mucLuu)]
    const plan = keHoach.get(n)
    const daXep = plan && plan.length ? plan.length : null
    let daLam = soCau
    if (plan && plan.length) {
      const tap = new Set(plan)
      const xong = new Set(coKq.map((d) => idDaLam({ qid: d.qid, tc: d.tc }, tap)))
      daLam = plan.filter((q) => xong.has(q)).length
    }
    const canLam = daXep !== null ? Math.min(muc, daXep) : muc
    ngay.push({
      ngay: n, dung: ds.filter(laDung).length, sai: ds.filter(laSai).length, boTrong: ds.filter((d) => d.kq === null).length, soCau,
      muc, mucUocTinh: !luu, daXep, canLam, daLam,
      trangThai: soCau === 0 && daLam === 0 ? 'khong' : daLam >= canLam ? 'du' : 'thieu',
      homNay: n === homNay,
    })
  }
  // 3b · "đã làm / mức" mỗi ngày lấy ĐÚNG phép tính bảng "Bài hằng ngày" của thầy (Gói 7 đếm câu của gói, Hành trình đếm câu kế hoạch) để phụ huynh và
  //      thầy thấy cùng một số. Không đọc đủ được ⇒ giữ cách tính riêng ở trên.
  const chung = await ngayBaiCuaMotEm(env, sbd, tuNgay, homNay, homNay).catch(() => null)
  if (chung) {
    const theo = new Map(chung.map((x) => [x.ngay, x]))
    for (const h of ngay) {
      const g = theo.get(h.ngay)
      if (!g) continue
      h.muc = g.mucToiThieu
      h.mucUocTinh = g.mucUocTinh
      h.canLam = g.mucToiThieu
      h.daLam = g.daLam
      h.trangThai = h.soCau === 0 && g.daLam === 0 ? 'khong' : g.datMuc ? 'du' : 'thieu'
    }
  }

  // 4 · các khoảng
  const trong = (tu: string, den: string = homNay) => dong.filter((d) => d.ngay >= tu && d.ngay <= den)
  const bay = trong(bayTu)
  const truoc = trong(truocTu, truocDen)
  const khuyaDs = bay.filter((d) => laGioKhuya(d.luc))

  // 5 · câu sai trong khoảng đọc (gom theo câu gốc; `dong` đang mới trước) + tiêu đề cho câu sai và lượt gần đây
  const theoGoc = new Map<string, Dong[]>()
  for (const d of dong) if (d.kq !== null) (theoGoc.get(d.goc) ?? theoGoc.set(d.goc, []).get(d.goc)!).push(d)
  const sai = [...theoGoc.entries()].filter(([, ds]) => ds.some(laSai))
  const ganDayDong = dong.slice(0, SO_LUOT_GAN_DAY)
  const canTen = [...new Set([...ganDayDong.map((d) => d.goc), ...sai.map(([g]) => g)])]
  const kho = await docCauKho(env, canTen).catch(() => new Map<string, { tenDang: string | null }>())
  const tenTuKho = (g: string) => str(kho.get(g)?.tenDang)
  const maDangThieu = [...new Set([...ganDayDong, ...sai.flatMap(([, ds]) => ds)].filter((d) => !tenTuKho(d.goc) && d.maDang).map((d) => d.maDang))]
  const tenDang = maDangThieu.length ? await tenCuaDang(env, maDangThieu).catch(() => new Map<string, string>()) : new Map<string, string>()
  const tieuDeCua = (d: Dong) => tieuDeChoPh(d.goc, tenTuKho(d.goc) || str(tenDang.get(d.maDang)))

  const dsSai: CauSaiCon[] = sai.map(([, ds]) => ({ tieuDe: tieuDeCua(ds[0]!), soSai: ds.filter(laSai).length, lanCuoi: ds[0]!.luc, daSua: laDung(ds[0]!) }))
  dsSai.sort((a, c) => Number(a.daSua) - Number(c.daSua) || (a.lanCuoi < c.lanCuoi ? 1 : a.lanCuoi > c.lanCuoi ? -1 : 0))
  const daSua = dsSai.filter((c) => c.daSua).length
  const ganDay: LuotGanDay[] = ganDayDong.map((d) => ({
    luc: d.luc, tieuDe: tieuDeCua(d), noi: noiChoPh(d.nguon), dung: d.kq === null ? null : laDung(d), giay: d.giay, nguonGiay: d.nguonGiay, coGoiY: d.coGoiY,
  }))

  const homNayDong = ngay.find((n) => n.homNay) ?? null
  const khuya = { soNgay: new Set(khuyaDs.map((d) => d.ngay)).size, soLuot: khuyaDs.length }
  const goiYDaDung = { so: bay.filter((d) => d.coGoiY).length, tong: bay.length }
  const thoiGian = thoiGianLam(bay)
  const ra: KetQuaConTongQuan = {
    ok: true,
    serverNow: nowMs,
    homNay,
    moc: MOC_THEO_DOI,
    tuNgay,
    dem: { homNay: demCau(trong(homNay)), bayNgay: demCau(bay), tuMoc: demCau(trong(MOC_THEO_DOI)) },
    ngay,
    thoiGian,
    ganDay,
    cauSai: { tong: dsSai.length, daSua, chuaSua: dsSai.length - daSua, ds: dsSai.slice(0, SO_CAU_SAI_TOI_DA) },
    khuya,
    goiYDaDung,
    goiY: sinhGoiYNhac({
      moc: MOC_THEO_DOI,
      homNay: homNayDong,
      ngayTruoc: ngay.filter((n) => !n.homNay && n.ngay >= MOC_THEO_DOI),
      nhanh: thoiGian.nhanh,
      chuaSua: dsSai.length - daSua,
      khuya,
      bay: { dung: bay.filter(laDung).length, sai: bay.filter(laSai).length },
      truoc: { dung: truoc.filter(laDung).length, sai: truoc.filter(laSai).length },
      goiYDaDung,
    }),
    catBot,
  }
  return ra
}
