// GIÁO ÁN 80 PHÚT CÓ ĐỒNG HỒ — bản in thầy cầm lên lớp.
//
// Đặc tả: GOI-LEN-BANG-80-PHUT.md mục 4.4 và 6.
//
// LUẬT CỨNG CỦA TỆP NÀY: mọi dòng có dấu `%` phải có kèm một phân số `số/số` —
// tức là CỠ MẪU. `moiPhanTramCoCoMau()` ở cuối tệp là chốt tự kiểm, phép kiểm
// 8.9 chạy đúng hàm đó trên chính đầu ra này.
//
// Vì sao khoảng cách đối ngẫu in bằng phân số chứ không bằng phần trăm: nếu in
// `1,4%` thì có một dấu `%` không cỡ mẫu, và luật trên phải đẻ ra danh sách trừ.
// Danh sách trừ là chỗ để lách. In `đạt 8,42 / cận trên 8,54` vừa đúng luật vừa
// nói rõ hơn.
import { dongHo, TEN_LANE, TEN_NGUYEN_NHAN, type CauHinhLenBang, CAU_HINH_LEN_BANG_MAC_DINH, type Lane } from './len-bang-cau-hinh'
import { TEN_MUC_NHAM } from './phan-cong'
import type { DongXep, KetQuaXep } from './xep-gio-len-bang'

export interface DauDeGiaoAn {
  ngay: string
  maCa: string
  soEmNop: number
  /** Tên đề chữa và cách lấy được bộ câu — đường A/B ghi "khớp tuyệt đối". */
  tenDe: string
  duong: 'A' | 'B' | 'D'
  soCauKhop: number
  soCauTong: number
}

const TEN_DUONG: Record<DauDeGiaoAn['duong'], string> = {
  A: 'đường A — đề chính là ca đầu giờ, khớp tuyệt đối',
  B: 'đường B — đề đã lưu trong kho, khớp tuyệt đối',
  D: 'đường D — đối chiếu PDF',
}

function so(x: number, chuSo = 2): string {
  return x.toFixed(chuSo).replace('.', ',')
}

function tenCau(d: DongXep): string {
  return `${d.cau.phan}.${d.cau.so}${d.cau.sao ? ' ' + '★'.repeat(d.cau.sao) : ''}`
}

/** Mấy dòng nói VÌ SAO em này đứng trước câu này. Chỉ nói thứ đọc được từ bài
 * làm — không có "dự đoán em vấp ở bước nào" hay "câu mồi khi em đứng im": muốn
 * viết được hai thứ ấy phải có mô hình lời giải, chưa làm, và bịa ra thì đúng
 * loại số bị cấm. */
function chiTietBang(d: DongXep, ch: CauHinhLenBang): string[] {
  const ra: string[] = []
  const ten = d.em?.hoTen || `SBD ${d.em?.sbd ?? ''}`
  if (d.vap) {
    const v = d.vap
    ra.push(`Ca đầu giờ: ${ten} sai ${v.idCau}, cùng chuyên đề ${v.chuyenDe}${v.mucDo ? `, mức ${TEN_MUC_NHAM[v.mucDo]}` : ''}.`)
    if (v.chon) {
      ra.push(
        v.cungChon >= 2
          ? `${ten} chọn ${v.chon} — ${v.cungChon}/${v.soEmLam} em cùng chọn ${v.chon}. Đọc được là: ${TEN_NGUYEN_NHAN[v.nguyenNhan]}.`
          : `${ten} chọn ${v.chon} — ${TEN_NGUYEN_NHAN[v.nguyenNhan]}.`,
      )
    } else {
      ra.push(`${ten} bỏ trống câu ấy — ${TEN_NGUYEN_NHAN[v.nguyenNhan]}.`)
    }
    if (d.cau.mucDo && v.mucDo) {
      const b = d.cau.mucDo === v.mucDo ? 'cùng bậc' : `khác bậc chỗ ${ten} vấp`
      ra.push(`Câu này mức ${TEN_MUC_NHAM[d.cau.mucDo]}, ${b}, cùng chuyên đề.`)
    }
  } else {
    ra.push(`${ten} chưa vấp câu nào cùng chuyên đề trong ca này — gọi theo tần suất, không theo nội dung.`)
  }
  ra.push(`Câu này ${d.chuNguon}.`)
  void ch
  return ra
}

/** Dựng giáo án dạng chữ. Thuần hàm — cùng đầu vào ra cùng bản in. */
export function dungGiaoAn(
  kq: KetQuaXep,
  dd: DauDeGiaoAn,
  ch: CauHinhLenBang = CAU_HINH_LEN_BANG_MAC_DINH,
): string {
  const d: string[] = []
  const batBuoc = kq.dong.filter((x) => x.batBuoc).length
  d.push(`BUỔI CHỮA ${dd.ngay} · Ca đầu giờ ${dd.maCa} · ${dd.soEmNop} em nộp`)
  d.push(`Đề chữa: ${dd.tenDe} · ${dd.soCauKhop}/${dd.soCauTong} câu khớp kho (${TEN_DUONG[dd.duong]})`)
  d.push(
    `Bắt buộc chữa: ${batBuoc} câu · giáo án ${Math.round(kq.tongGiay / 60)}/${Math.round(kq.nganSach / 60)} phút phần chữa`,
  )
  d.push('')

  const theoLane = (l: Lane) => kq.dong.filter((x) => x.lane === l)
  let t = 0
  const dong = (nhan: string, giay: number) => {
    d.push(`${dongHo(t)}  ${nhan}${giay ? `   ${Math.max(1, Math.round(giay / 60))} phút` : ''}`)
    t += giay
  }

  dong('Ổn định, trả phiếu', ch.HAO_PHI_MO_DAU_GIAY)

  const l0 = theoLane('L0')
  if (l0.length) {
    dong(`${TEN_LANE.L0.toUpperCase()} ${l0.length} câu: ${l0.map(tenCau).join(', ')}`, l0.length * ch.GIAY_LANE.L0)
  }

  const l1 = theoLane('L1')
  if (l1.length) {
    dong(`${TEN_LANE.L1.toUpperCase()} ${l1.length} câu`, l1.length * ch.GIAY_LANE.L1)
    for (const x of l1) d.push(`       ${tenCau(x)} → ${x.chuNguon}`)
  }

  for (const x of theoLane('L3')) {
    dong(`▌BẢNG · ${tenCau(x)} · ${(x.em?.hoTen || '').toUpperCase() || `SBD ${x.em?.sbd ?? ''}`} (SBD ${x.em?.sbd ?? ''})`, x.giay)
    for (const c of chiTietBang(x, ch)) d.push(`       ${c}`)
  }

  for (const x of theoLane('L2')) {
    dong(`${TEN_LANE.L2.toUpperCase()} · ${tenCau(x)}`, x.giay)
    d.push(`       ${x.chuNguon}${x.batBuoc ? ' · BẮT BUỘC CHỮA' : ''}`)
  }

  dong('Chốt mấy ý phải nhớ', ch.HAO_PHI_CHOT_CUOI_GIAY)
  d.push('')
  d.push(`Tổng ${Math.round(t / 60)}/${ch.NGAN_SACH_PHUT} phút · ${kq.soEmLenBang}/${ch.SO_EM_LEN_BANG_TOI_DA} em lên bảng`)
  d.push(`Khoảng cách đối ngẫu: đạt ${so(kq.tongGiaTri)} / cận trên ${so(kq.canTrenNoi)}`)
  for (const c of kq.canhBao) d.push(`⚠ ${c}`)
  return d.join('\n')
}

/** CHỐT TỰ KIỂM: mọi dòng có `%` phải có kèm một phân số `số/số`.
 *
 * Trả về danh sách dòng phạm luật; rỗng là đạt. Phép kiểm 8.9 chạy đúng hàm này
 * trên đầu ra thật của `dungGiaoAn`, nên thêm một dòng mới có phần trăm trần là
 * ĐỎ ngay, không đợi ai để ý. */
export function moiPhanTramCoCoMau(chu: string): string[] {
  return chu
    .split('\n')
    .filter((l) => l.includes('%'))
    .filter((l) => !/\d\s*\/\s*\d/.test(l))
}
