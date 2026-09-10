// NỐI CHẨN ĐOÁN VÀO PHIẾU — một cửa duy nhất cho cả hai đường dựng phiếu.
//
// Đặc tả: RUT-CAU-CHUA-THEO-NGUYEN-NHAN.md, mục "màn hình".
//
// VÌ SAO TỆP NÀY KHÔNG THAY BỘ CHỌN CÂU.
//
// Đường rút hiện có (`rutDeChua` → cổng mã dạng → bước lui) là thứ đã sống qua
// đúng hai đợt thầy truy lỗi 07/09 và 08/09: "em Tuân thi Ester mà gán câu xà
// phòng", rồi "phiếu trống thì mất `linkBaiTap` và mất hai nút copy". Rút nó ra
// thay bằng `keDon` giữa lúc chạy deadline là đổi một lỗi đã chữa lấy một lỗi
// chưa biết. Nên đợt này chẩn đoán vào phiếu ở đúng ba việc, cả ba đều CỘNG
// THÊM chứ không thay:
//
//   ① dán NHÃN BỆNH + lý do lên từng câu sai, để em đọc được vì sao mình sai;
//   ② gom bộ câu chữa ĐÃ RÚT thành cụm theo bệnh (nối qua `chuaCho.qid`), mỗi
//      cụm một dòng chẩn đoán;
//   ③ BỎ những câu kê cho lỗi `bua_het_gio` — đây là chỗ duy nhất chẩn đoán
//      được phép đổi bộ câu, và đặc tả bắt buộc: "Cấm kê câu kiến thức cho lỗi
//      đã phân loại là bừa / hết giờ".
//
// KHÔNG ĐỦ CĂN CỨ THÌ KHÔNG CHẨN. Không có bảng chấm cả lớp (báo cáo dựng ngay
// trên máy em) thì trả về đúng một dòng nói thật, không cụm nào, không nhãn
// nào — thà nói "chưa chẩn được" còn hơn dán nhãn bằng dữ liệu rỗng.
import type { ChiTietCauRow } from './exam-api'
import type { CauLuyen } from './bai-tap-pdf'
import type { TeacherExamSource } from '../data/examContent'
import { banDoDang, cauSaiTuRows, dangCuaCauKho, tenCauSai } from './rut-de-chua'
import { chanDoan, thongKeTungCau, tiLeCoGiay, type KetQuaChanDoan } from './chan-doan'
import { CAU_HINH_CHAN_DOAN_MAC_DINH, TEN_BENH, type Benh, type CauHinhChanDoan } from './chan-doan-cau-hinh'

export interface NhanBenhCau {
  benh: Benh
  tenBenh: string
  lyDo: string
}

export interface CumChanDoan {
  benh: Benh
  tenBenh: string
  /** Dòng chẩn đoán hiện trên phiếu, viết cho em đọc. Luôn kèm SỐ. */
  chu: string
  /** Câu sai thuộc cụm này, đã đặt tên kiểu "Câu 14". */
  tenCau: string[]
  qids: string[]
  /** Số câu chữa đã kê cho cụm — 0 với `bua_het_gio`, đúng theo đặc tả. */
  soCauKe: number
}

export interface CoChanDoan {
  chu: string
  qids: string[]
}

export interface KetQuaChanDoanPhieu {
  /** qid câu sai → nhãn bệnh. Rỗng khi không đủ căn cứ. */
  theoCau: Record<string, NhanBenhCau>
  cum: CumChanDoan[]
  /** Cờ cho thầy, hiện ở màn Ca thi. */
  co: CoChanDoan[]
  /** Bộ câu chữa SAU khi bỏ câu kê cho `bua_het_gio`. */
  cau: CauLuyen[]
  /** Số câu đã bỏ vì kê cho lỗi hết giờ. */
  daBo: number
  /** Dòng nói thật khi không chẩn được. Hiện nguyên văn trên phiếu. */
  canhBao: string[]
}

export interface NguonChanDoanPhieu {
  /** Bảng chấm từng câu CỦA EM trong ca. */
  rows: ChiTietCauRow[]
  /** Bảng chấm CẢ LỚP — nền để tính trung vị giây và độ chụm. Thiếu thì không chẩn. */
  rowsLop?: ChiTietCauRow[] | null
  /** Kho đề, để tra mã dạng. Dùng chung `banDoDang`, không tra bằng cách thứ hai. */
  khoDe?: TeacherExamSource[] | null
  /** Ngân hàng của chính ca — nguồn mã dạng thứ hai khi kho chưa có câu đó. */
  nguonCauSai?: TeacherExamSource[] | null
  /** `LuotThi.TongGiayRoiMan` của lượt này. Rời màn nhiều thì tắt luật đọc giờ cho em ấy. */
  giayRoiMan?: number | null
  /** Bộ câu chữa đường cũ đã rút xong. */
  cau: CauLuyen[]
}

const RONG = (cau: CauLuyen[], canhBao: string[]): KetQuaChanDoanPhieu => ({
  theoCau: {},
  cum: [],
  co: [],
  cau,
  daBo: 0,
  canhBao,
})

/** Viết hoa chữ đầu. Khai bằng `function` chứ không phải `const` mũi tên: nó
 * được dùng ở TRÊN chỗ khai, và phép kiểm `khong-dung-bien-truoc-khi-khai`
 * chặn đúng kiểu ấy — biến `const` đọc trước khi khai là lỗi lúc chạy. */
function hoaDau(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

export function chanDoanChoPhieu(n: NguonChanDoanPhieu, ch: CauHinhChanDoan = CAU_HINH_CHAN_DOAN_MAC_DINH): KetQuaChanDoanPhieu {
  const cauSaiEm = n.rows.filter((r) => r.dungSai === false)
  if (!cauSaiEm.length) return RONG(n.cau, [])

  const lop = n.rowsLop ?? []
  if (!lop.length) {
    return RONG(n.cau, ['Báo cáo này chưa có bảng chấm của cả lớp nên chưa chẩn được nguyên nhân sai — bài luyện dưới rút theo dạng như cũ.'])
  }

  const tkCau = thongKeTungCau(lop)
  const caCoGiay = tiLeCoGiay(lop) >= ch.TI_LE_CO_GIAY_TOI_THIEU
  const canhBao: string[] = []
  if (!caCoGiay) {
    canhBao.push(
      `Ca này chỉ ${Math.round(tiLeCoGiay(lop) * 100)}% số câu ghi được số giây làm bài nên chẩn đoán chỉ dựa vào phương án em chọn, không dựa vào tốc độ.`,
    )
  }

  // MÃ DẠNG: dùng đúng `banDoDang` + `cauSaiTuRows` của bộ chọn câu. Viết cách
  // tra thứ hai là hai chỗ ra hai mã dạng khác nhau cho cùng một câu.
  const banDo = banDoDang([...(n.khoDe ?? []), ...(n.nguonCauSai ?? [])])
  const traDang = (qid: string) => banDo.get(qid) ?? null
  const dsCauSai = cauSaiTuRows(n.rows, traDang)
  const dangCua = new Map(dsCauSai.map((s) => [s.qid, s.maDang]))
  const demDang = new Map<string, number>()
  for (const s of dsCauSai) if (s.maDang) demDang.set(s.maDang, (demDang.get(s.maDang) ?? 0) + 1)

  // Vùng cuối bài tính RIÊNG TỪNG PHẦN: câu 18 là cuối Phần I nhưng là đầu bài
  // nếu đo trên cả đề.
  const cuoiPhan = new Map<string, number>()
  for (const r of n.rows) cuoiPhan.set(r.phan, Math.max(cuoiPhan.get(r.phan) ?? 0, r.soCau))

  const ketQua: KetQuaChanDoan[] = cauSaiEm.map((r) => {
    const maDang = dangCua.get(r.qid) ?? ''
    return chanDoan(
      r,
      tkCau.get(r.qid),
      {
        caCoGiay,
        giayRoiMan: typeof n.giayRoiMan === 'number' ? n.giayRoiMan : undefined,
        soCauSaiCungDang: maDang ? (demDang.get(maDang) ?? 0) : 0,
        soCauCuoiPhan: cuoiPhan.get(r.phan) ?? 0,
      },
      ch,
    )
  })

  const theoCau: Record<string, NhanBenhCau> = {}
  for (const k of ketQua) theoCau[k.qid] = { benh: k.benh, tenBenh: TEN_BENH[k.benh], lyDo: k.lyDo }

  const traRow = new Map(cauSaiEm.map((r) => [r.qid, r]))
  const ten = (qid: string) => {
    const r = traRow.get(qid)
    return r ? tenCauSai(r.phan, r.soCau) : qid
  }

  // ---- BỎ CÂU KÊ CHO LỖI HẾT GIỜ. Đặc tả cấm kê câu kiến thức cho bệnh này.
  const quaHetGio = new Set(ketQua.filter((k) => k.benh === 'bua_het_gio').map((k) => k.qid))
  const giuLai = n.cau.filter((c) => !(c.chuaCho && quaHetGio.has(c.chuaCho.qid)))
  const daBo = n.cau.length - giuLai.length

  // ---- GOM BỘ CÂU ĐÃ RÚT THÀNH CỤM THEO BỆNH, nối qua `chuaCho.qid`.
  const keTheoBenh = new Map<Benh, number>()
  for (const c of giuLai) {
    const q = c.chuaCho?.qid
    if (!q) continue
    const b = theoCau[q]?.benh
    if (!b) continue
    keTheoBenh.set(b, (keTheoBenh.get(b) ?? 0) + 1)
  }

  const THU_TU: Benh[] = ['nham_khai_niem', 'loi_tinh', 'chua_biet', 'bua_het_gio', 'chua_ro', 'thieu_du_lieu']
  const cum: CumChanDoan[] = []
  for (const benh of THU_TU) {
    const ds = ketQua.filter((k) => k.benh === benh)
    if (!ds.length) continue
    const qids = ds.map((k) => k.qid)
    const soCauKe = keTheoBenh.get(benh) ?? 0
    cum.push({ benh, tenBenh: TEN_BENH[benh], chu: hoaDau(chuChoCum(benh, ds, soCauKe, ten)), tenCau: qids.map(ten), qids, soCauKe })
  }

  // ---- CỜ CHO THẦY.
  const co: CoChanDoan[] = []
  if (quaHetGio.size) {
    const ds = [...quaHetGio]
    co.push({
      chu: `${ds.length} câu (${ds.map(ten).join(', ')}) làm rất nhanh, phương án rải rác, lại nằm cuối bài. Nhiều khả năng em hết giờ chứ không hổng kiến thức — đã bỏ ${daBo} câu chữa kê cho mấy câu này.`,
      qids: ds,
    })
  }
  const canNhan = ketQua.filter((k) => k.canNhanPhuongAn).map((k) => k.qid)
  if (canNhan.length) {
    co.push({
      chu: `${canNhan.length} câu (${canNhan.map(ten).join(', ')}) chẩn ra nhầm khái niệm theo đám đông chọn sai. Có nhãn lỗi ở mức TỪNG PHƯƠNG ÁN thì chọn được câu đối chiếu đúng bẫy; hiện chỉ đối chiếu được ở mức dạng bài.`,
      qids: canNhan,
    })
  }

  return { theoCau, cum, co, cau: giuLai, daBo, canhBao }
}

function chuChoCum(benh: Benh, ds: KetQuaChanDoan[], soCauKe: number, ten: (qid: string) => string): string {
  const dau = ds[0]
  const ke = soCauKe > 0 ? `${soCauKe} câu dưới` : 'chưa kê câu nào'
  const dsTen = ds.map((k) => ten(k.qid)).join(', ')
  switch (benh) {
    case 'nham_khai_niem':
      return `${dsTen} — em nhầm khái niệm. ${hoaDau(dau.lyDo)}. ${ke} bẫy đúng chỗ đó, làm xong đối chiếu với nhau.`
    case 'loi_tinh':
      return `${dsTen} — em làm đúng hướng nhưng ra sai số. ${hoaDau(dau.lyDo)}. ${ke} cùng khuôn, số liệu gọn hơn.`
    case 'chua_biet':
      return `${dsTen} — em chưa nắm dạng này. ${hoaDau(dau.lyDo)}. Đọc lời giải mẫu trước rồi hãy làm ${soCauKe > 0 ? `${soCauKe} câu dưới` : 'bài luyện'}.`
    case 'bua_het_gio':
      return `${dsTen} — nhiều khả năng em hết giờ chứ không phải hổng kiến thức. ${hoaDau(dau.lyDo)}. Chưa kê câu chữa cho mấy câu này; việc cần sửa là phân bổ thời gian.`
    case 'chua_ro':
      return `${dsTen} — chưa đủ dấu hiệu để nói nguyên nhân. ${hoaDau(dau.lyDo)}. ${ke} rút theo dạng như cũ.`
    case 'thieu_du_lieu':
      return `${dsTen} — thiếu dữ liệu để chẩn đoán. ${hoaDau(dau.lyDo)}. ${ke} rút theo dạng như cũ.`
  }
}


/** Dùng lại ở màn Ca thi để tra dạng khi chỉ có kho — giữ một đường tra duy nhất. */
export { dangCuaCauKho }
