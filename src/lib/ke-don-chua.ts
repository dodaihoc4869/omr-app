// KÊ ĐƠN THEO BỆNH — chia câu sai theo nguyên nhân rồi rút riêng từng nhóm.
//
// Đặc tả: RUT-CAU-CHUA-THEO-NGUYEN-NHAN.md, mục "luồng chính" phần Kê đơn.
//
// VÌ SAO GỌI LẠI `rutDeChua` CHỨ KHÔNG VIẾT BỘ CHỌN THỨ HAI: bộ chọn hiện có đã
// gánh cả lọc sao, lọc dạng, tránh câu trùng, chia suất theo câu sai, và có phép
// kiểm riêng đứng sau. Viết bản thứ hai là mở thêm một mặt trận để sai, mà sai ở
// đây nghĩa là em nhận nhầm bộ câu. Nên tệp này chỉ làm đúng ba việc:
//
//   ① gom câu sai theo BỆNH;
//   ② gọi `rutDeChua` MỘT lượt cho mỗi bệnh, với trần riêng của bệnh ấy;
//   ③ cộng dồn `qidTranh` giữa các lượt để không câu nào bị kê hai lần.
//
// Bệnh `bua_het_gio` KHÔNG được kê câu nào — chỉ sinh một cờ báo thầy. Bệnh
// `thieu_du_lieu` và `chua_ro` gom chung vào MỘT lượt rút theo đường cũ, kèm
// dòng nói rõ lý do.
import type { ChiTietCauRow } from './exam-api'
import type { CauLuyen } from './bai-tap-pdf'
import { rutDeChua, type KetQuaRutChua, type YeuCauRutChua } from './rut-de-chua'
import { duocKe, type KetQuaChanDoan } from './chan-doan'
import { CAU_HINH_CHAN_DOAN_MAC_DINH, TEN_BENH, type Benh, type CauHinhChanDoan } from './chan-doan-cau-hinh'

export interface CumTheoBenh {
  benh: Benh
  /** Câu sai thuộc bệnh này. */
  rows: ChiTietCauRow[]
  /** Câu chữa đã kê cho cụm. Rỗng với `bua_het_gio`. */
  cau: CauLuyen[]
  /** Dòng chữ hiện trên phiếu cho em đọc. */
  chu: string
}

export interface CoBaoThay {
  /** Vì sao cờ — hiện trên màn Ca thi của thầy. */
  chu: string
  qids: string[]
}

export interface KetQuaKeDon {
  cum: CumTheoBenh[]
  /** Cờ cho thầy: em hết giờ, hoặc câu đáng gán nhãn mức phương án. */
  co: CoBaoThay[]
  /** Tổng số câu đã kê — luôn ≤ `TRAN_CAU_MOT_PHIEU`. */
  tongCau: number
  canhBao: string[]
}

/** Thứ tự kê: bệnh nào chữa được nhiều nhất thì lấy suất trước khi chạm trần. */
const UU_TIEN: Benh[] = ['nham_khai_niem', 'loi_tinh', 'chua_biet', 'chua_ro', 'thieu_du_lieu']

export function keDon(
  chanDoanRows: KetQuaChanDoan[],
  rows: ChiTietCauRow[],
  nen: Omit<YeuCauRutChua, 'rows' | 'soCau' | 'qidTranh'>,
  ch: CauHinhChanDoan = CAU_HINH_CHAN_DOAN_MAC_DINH,
  qidTranhBanDau: string[] = [],
): KetQuaKeDon {
  const traBenh = new Map(chanDoanRows.map((c) => [c.qid, c]))
  const theoBenh = new Map<Benh, ChiTietCauRow[]>()
  for (const r of rows) {
    const c = traBenh.get(r.qid)
    if (!c) continue
    const a = theoBenh.get(c.benh)
    if (a) a.push(r)
    else theoBenh.set(c.benh, [r])
  }

  const cum: CumTheoBenh[] = []
  const co: CoBaoThay[] = []
  const canhBao: string[] = []
  const tranh = new Set(qidTranhBanDau)
  let tongCau = 0

  // ---- CỜ: em hết giờ. KHÔNG kê câu kiến thức nào.
  const bua = theoBenh.get('bua_het_gio') ?? []
  if (bua.length) {
    cum.push({
      benh: 'bua_het_gio',
      rows: bua,
      cau: [],
      chu: `${bua.length} câu làm rất nhanh, phương án rải rác, nằm cuối bài. Nhiều khả năng hết giờ chứ không phải hổng kiến thức — chưa kê câu chữa.`,
    })
    co.push({
      chu: `${bua.length} câu cuối bài làm rất nhanh và phương án rải rác. Nhiều khả năng hết giờ, không phải hổng kiến thức. Chưa kê câu chữa.`,
      qids: bua.map((r) => r.qid),
    })
  }

  // ---- CỜ: câu mà nhãn lỗi mức TỪNG PHƯƠNG ÁN sẽ giúp được (câu hỏi ❷).
  const canNhan = chanDoanRows.filter((c) => c.canNhanPhuongAn).map((c) => c.qid)
  if (canNhan.length) {
    co.push({
      chu: `${canNhan.length} câu chẩn ra "nhầm khái niệm" theo đám đông chọn sai. Có nhãn lỗi ở mức TỪNG PHƯƠNG ÁN thì chọn được câu đối chiếu đúng bẫy; hiện chỉ đối chiếu được ở mức dạng bài.`,
      qids: canNhan,
    })
  }

  // ---- KÊ TỪNG BỆNH, theo thứ tự ưu tiên, cộng dồn trần cả phiếu.
  for (const benh of UU_TIEN) {
    const ds = theoBenh.get(benh)
    if (!ds || !ds.length) continue
    const conLai = ch.TRAN_CAU_MOT_PHIEU - tongCau
    if (conLai <= 0) {
      canhBao.push(`Đã chạm trần ${ch.TRAN_CAU_MOT_PHIEU} câu cả phiếu nên nhóm "${TEN_BENH[benh]}" chưa được kê câu nào.`)
      continue
    }
    const tran = Math.min(ch.TRAN_CAU_MOT_LOI, conLai)
    const kq: KetQuaRutChua = rutDeChua({ ...nen, rows: ds, soCau: tran, qidTranh: [...tranh] })
    const lay = kq.cau.slice(0, tran)
    for (const c of lay) tranh.add(c.id)
    tongCau += lay.length

    cum.push({ benh, rows: ds, cau: lay, chu: chuChoBenh(benh, ds.length, lay.length, traBenh) })
    if (!duocKe(benh) && lay.length) {
      // Đường cũ vẫn kê được, nhưng phải nói rõ là chưa chẩn ra bệnh.
      canhBao.push(`Nhóm "${TEN_BENH[benh]}" rút theo đường cũ (theo dạng), không theo nguyên nhân.`)
    }
    if (!lay.length) canhBao.push(`Nhóm "${TEN_BENH[benh]}": kho chưa có câu nào cùng dạng để kê.`)
  }

  return { cum, co, tongCau, canhBao }
}

function chuChoBenh(benh: Benh, soCauSai: number, soCauKe: number, tra: Map<string, KetQuaChanDoan>): string {
  const mau = [...tra.values()].find((c) => c.benh === benh)
  const vi = mau ? ` ${mau.lyDo}.` : ''
  switch (benh) {
    case 'nham_khai_niem':
      return `${soCauSai} câu em nhầm khái niệm.${vi} ${soCauKe} câu dưới bẫy đúng chỗ đó — làm xong đối chiếu với nhau.`
    case 'loi_tinh':
      return `${soCauSai} câu em làm đúng hướng nhưng ra sai số.${vi} ${soCauKe} câu dưới cùng khuôn, số liệu gọn hơn.`
    case 'chua_biet':
      return `${soCauSai} câu em chưa nắm.${vi} Đọc lời giải mẫu trước rồi hãy làm ${soCauKe} câu dưới.`
    case 'chua_ro':
      return `${soCauSai} câu chưa đủ dấu hiệu để nói nguyên nhân.${vi} ${soCauKe} câu dưới rút theo dạng như cũ.`
    case 'thieu_du_lieu':
      return `${soCauSai} câu thiếu dữ liệu để chẩn đoán.${vi} ${soCauKe} câu dưới rút theo dạng như cũ.`
    default:
      return ''
  }
}
