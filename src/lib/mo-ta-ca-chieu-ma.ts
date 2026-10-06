// MÔ TẢ "CA NÀY KIỂM TRA GÌ" cho màn Chiếu mã vào thi (thầy duyệt bản vẽ 06/10). Hàm THUẦN: từ trường THẬT của ca (phamViHoiLai, deRieng,
// lenBang, thoiGianPhut, soCau) ⇒ chế độ + chữ + số cho biểu đồ. Không gọi mạng, không đồng hồ, KHÔNG con số bịa:
//   · số câu từng phần lấy từ ca (`soCau`);
//   · trần câu ôn lại = ceil(TI_LE_MUC_DICH_CA × số câu phần) — hằng của rút đề v2 (src/lib/rut-de-v2.ts), không viết số thứ hai;
//   · lưới Phần × Mức độ = phanBoMaTran2026 (MA_TRAN_HOA_2026); thời gian "điểm yếu" cắt ở PHUT_TOI_DA_LEN_BANG.
import { TI_LE_MUC_DICH_CA, PHAN_V2, type PhanV2 } from './rut-de-v2'
import { MUC_MA_TRAN, TEN_MUC_DO_CAU, phanBoMaTran2026 } from './rut-de-da-dung'
import { SO_CAU_CHUAN_2026 } from './ma-tran-hoa-2026'
import { PHUT_TOI_DA_LEN_BANG } from './rut-de'

export type CheDoChieuMa = 'rut_sai' | 'khong' | 'diem_yeu' | 'da_dung' | 'chung'
/** Khoá màu biểu đồ (CSS `.km-c-*`): câu ôn lại · câu mới · câu cùng dạng · câu đã sửa đúng chưa kiểm chứng · ba bậc xanh cho Phần I/II/III. */
export type MauBieuDo = 'on' | 'moi' | 'dung' | 'bu' | 'p1' | 'p2' | 'p3'

export interface DuLieuCaChieuMa {
  phamViHoiLai?: string | null
  deRieng?: boolean | null
  lenBang?: boolean | null
  thoiGianPhut?: number | null
  /** Số câu mỗi phần của ca (`so_cau_json`). Vắng ⇒ không vẽ số câu (không đoán). */
  soCau?: { I: number; II: number; III: number } | null
}

export interface DoanVong { nhan: string; so: number; mau: MauBieuDo }
export interface DoanThanh { so: number; mau: MauBieuDo }
export interface HangThanh { ten: string; tong: number; rong: number; doan: DoanThanh[]; ghiChu: string }
export interface BuocThang { n: number; mau: MauBieuDo; ten: string; phu: string }
export interface HangLuoi { ten: string; o: number[]; tong: number }
export type ChiTietBieuDo =
  | { kieu: 'thanh'; tieuDe: string; thanh: HangThanh[] }
  | { kieu: 'thang'; tieuDe: string; thang: BuocThang[] }
  | { kieu: 'luoi'; tieuDe: string; cot: string[]; hang: HangLuoi[]; ghiChu: string }

export interface MoTaCaChieuMa {
  cheDo: CheDoChieuMa
  tag: string
  mauTag: MauBieuDo
  tieuDe: string
  moTa: string
  tongCau: number
  phut: number | null
  vong: { tieuDe: string; don: string; tong: number; doan: DoanVong[]; aria: string }
  chiTiet: ChiTietBieuDo
  soLieu: { so: string; nhan: string }[]
  why: { h: string; t: string }[]
}

export const TEN_PHAN_CHIEU: Record<PhanV2, string> = { I: 'Phần I · Trắc nghiệm', II: 'Phần II · Đúng–sai', III: 'Phần III · Trả lời ngắn' }
const PHAN_NGAN: Record<PhanV2, string> = { I: 'Phần I', II: 'Phần II', III: 'Phần III' }
const MAU_PHAN: Record<PhanV2, MauBieuDo> = { I: 'p1', II: 'p2', III: 'p3' }

/** Xác định chế độ từ trường thật của ca. */
export function cheDoCuaCa(ca: Pick<DuLieuCaChieuMa, 'phamViHoiLai' | 'deRieng' | 'lenBang'>): CheDoChieuMa {
  if (ca.phamViHoiLai === 'da_dung') return 'da_dung'
  if (ca.deRieng === true && ca.lenBang === true) return 'diem_yeu'
  if (ca.deRieng === true) return ca.phamViHoiLai === 'khong' ? 'khong' : 'rut_sai' // 'gan_nhat' / 'ba_ca' / vắng: cùng một luật (docPhamViHoiLai)
  return 'chung'
}

/** Trần số câu ÔN LẠI ở một phần của ca thường: ceil(30% × số câu phần). 14 câu 9·2·3 ⇒ 3·1·1. */
export function tranOnLai(soCauPhan: number): number {
  const n = Math.max(0, Math.floor(Number(soCauPhan) || 0))
  return Math.min(n, Math.ceil(n * TI_LE_MUC_DICH_CA))
}

const so0 = (v: unknown): number => Math.max(0, Math.floor(Number(v) || 0))
const chuSo = (n: number): string => String(n).replace('.', ',')
const phutMoiCau = (phut: number | null, tong: number): string => (phut && tong > 0 ? chuSo(Math.round((phut / tong) * 10) / 10) : '—')

function chuanSoCau(sc: DuLieuCaChieuMa['soCau']): Record<PhanV2, number> | null {
  if (!sc) return null
  const r = { I: so0(sc.I), II: so0(sc.II), III: so0(sc.III) }
  return r.I + r.II + r.III > 0 ? r : null
}

function veThanh(sc: Record<PhanV2, number> | null, laySoDoan: (n: number) => DoanThanh[], ghiChu: (n: number) => string, tieuDe: string): ChiTietBieuDo {
  const dsPhan = sc ? PHAN_V2.filter((p) => sc[p] > 0) : []
  const max = Math.max(1, ...dsPhan.map((p) => sc![p]))
  return {
    kieu: 'thanh',
    tieuDe,
    thanh: dsPhan.map((p) => ({ ten: TEN_PHAN_CHIEU[p], tong: sc![p], rong: Math.round((sc![p] / max) * 100), doan: laySoDoan(sc![p]), ghiChu: ghiChu(sc![p]) })),
  }
}

function vongTheoPhan(sc: Record<PhanV2, number> | null): MoTaCaChieuMa['vong'] {
  const doan: DoanVong[] = sc ? PHAN_V2.filter((p) => sc[p] > 0).map((p) => ({ nhan: PHAN_NGAN[p], so: sc[p], mau: MAU_PHAN[p] })) : []
  return dungVong(doan)
}
function dungVong(doan: DoanVong[]): MoTaCaChieuMa['vong'] {
  const tong = doan.reduce((a, d) => a + d.so, 0)
  const tieuDe = 'Đề của mỗi em'
  return { tieuDe, don: 'câu', tong, doan, aria: `${tieuDe}: ${tong} câu${doan.length ? ' — ' + doan.map((d) => `${d.nhan} ${d.so}`).join(', ') : ''}` }
}

/** Mô tả đầy đủ của màn theo ca. */
export function moTaCaChieuMa(ca: DuLieuCaChieuMa): MoTaCaChieuMa {
  const cheDo = cheDoCuaCa(ca)
  const sc = chuanSoCau(ca.soCau)
  const phutCa = ca.thoiGianPhut && ca.thoiGianPhut > 0 ? Math.floor(ca.thoiGianPhut) : null
  const tong = sc ? sc.I + sc.II + sc.III : 0
  const soLieu = (t: number, phut: number | null) => [
    { so: t > 0 ? String(t) : '—', nhan: 'câu' },
    { so: phut ? String(phut) : '—', nhan: 'phút' },
    { so: phutMoiCau(phut, t), nhan: 'phút mỗi câu' },
  ]

  if (cheDo === 'rut_sai') {
    const onTong = sc ? PHAN_V2.reduce((a, p) => a + tranOnLai(sc[p]), 0) : 0
    return {
      cheDo, tag: 'KIỂM TRA: CÂU SAI ĐẾN LỊCH ÔN LẠI', mauTag: 'on',
      tieuDe: 'Hôm nay hỏi lại những câu em từng sai',
      moTa: 'Câu sai đã đến lịch ôn lại sẽ quay lại trong đề của em. Phần còn lại là câu mới em chưa gặp.',
      tongCau: tong, phut: phutCa,
      vong: dungVong(sc ? [{ nhan: 'Câu ôn lại, nhiều nhất', so: onTong, mau: 'on' as const }, { nhan: 'Câu mới, ít nhất', so: tong - onTong, mau: 'moi' as const }].filter((d) => d.so > 0) : []),
      chiTiet: veThanh(
        sc,
        (n) => [{ so: tranOnLai(n), mau: 'on' as const }, { so: n - tranOnLai(n), mau: 'moi' as const }].filter((d) => d.so > 0),
        (n) => `Ôn lại nhiều nhất ${tranOnLai(n)} câu · mới ít nhất ${n - tranOnLai(n)} câu`,
        'Số câu từng phần, trong đó câu ôn lại',
      ),
      soLieu: soLieu(tong, phutCa),
      why: [
        { h: 'Câu sai không bị bỏ quên', t: 'Mỗi câu sai có lịch ôn riêng. Đến lịch là câu đó quay lại.' },
        { h: 'Làm đúng là khép được lỗi', t: 'Câu từng sai mà nay làm đúng thì chuyển sang lịch ôn xa hơn.' },
        { h: 'Câu mới cho thấy sức thật', t: 'Phần còn lại là câu em chưa gặp ở ca nào, em tự làm bằng hiểu bài.' },
      ],
    }
  }

  if (cheDo === 'khong') {
    return {
      cheDo, tag: 'KIỂM TRA: TOÀN CÂU MỚI', mauTag: 'moi',
      tieuDe: 'Hôm nay toàn câu em chưa gặp',
      moTa: 'Đề khác hẳn các ca trước: bỏ mọi câu em đã gặp ở ca kiểm tra trước. Câu song sinh cùng dạng, đổi số, vẫn có thể xuất hiện.',
      tongCau: tong, phut: phutCa,
      vong: dungVong(tong > 0 ? [{ nhan: 'Câu mới em chưa gặp', so: tong, mau: 'moi' as const }] : []),
      chiTiet: veThanh(sc, (n) => [{ so: n, mau: 'moi' as const }], (n) => `${n} câu mới`, 'Số câu từng phần, đều là câu mới'),
      soLieu: soLieu(tong, phutCa),
      why: [
        { h: 'Em dựa vào hiểu bài', t: 'Em chưa gặp các câu này ở ca kiểm tra trước nên không thể nhớ đáp án.' },
        { h: 'Mỗi em một bộ câu riêng', t: 'Bộ câu chọn riêng cho từng em theo kiến thức em đang học.' },
        { h: 'Kho thiếu thì nói rõ', t: 'Nếu kho hết câu mới, câu em làm lâu nhất được lấy lại và ghi ngày em từng làm.' },
      ],
    }
  }

  if (cheDo === 'diem_yeu') {
    const phut = Math.min(phutCa ?? PHUT_TOI_DA_LEN_BANG, PHUT_TOI_DA_LEN_BANG)
    return {
      cheDo, tag: 'KIỂM TRA ĐIỂM YẾU', mauTag: 'bu',
      tieuDe: 'Hôm nay thầy xem em cần luyện thêm dạng nào',
      moTa: 'Mỗi em một bộ câu riêng, lấy từ câu em đã sửa nhưng chưa kiểm chứng và câu sai đến lịch ôn lại. Ca này để thầy đo dạng em cần luyện thêm.',
      tongCau: tong, phut,
      vong: vongTheoPhan(sc),
      chiTiet: {
        kieu: 'thang', tieuDe: 'Thứ tự chọn câu cho mỗi em',
        thang: [
          { n: 1, mau: 'bu', ten: 'Câu em đã sửa đúng, chưa kiểm chứng', phu: 'Làm lại để chắc em thật sự đã sửa được' },
          { n: 2, mau: 'on', ten: 'Câu sai đến lịch ôn lại', phu: 'Ưu tiên câu song sinh, đổi số' },
          { n: 3, mau: 'dung', ten: 'Câu cùng dạng', phu: 'Lấp khi hai nguồn trên chưa đủ' },
          { n: 4, mau: 'moi', ten: 'Câu mới', phu: 'Lấp nốt cho đủ số câu' },
        ],
      },
      soLieu: soLieu(tong, phut),
      why: [
        { h: 'Ca ngắn, đo đúng chỗ cần', t: `Thời gian tối đa ${PHUT_TOI_DA_LEN_BANG} phút, chỉ gồm câu liên quan đến chỗ em từng vướng.` },
        { h: 'Kết quả chỉ ra dạng cần luyện', t: 'Thầy nhìn theo dạng bài để biết em nên luyện thêm gì.' },
        { h: 'Làm đúng là tiến thêm một bước', t: 'Câu sửa đúng được kiểm chứng lại; sai thì quay lại lịch ôn.' },
      ],
    }
  }

  if (cheDo === 'da_dung') {
    // Ma trận 2026 chia theo TỔNG số câu của ca; ca không ghi số câu ⇒ cỡ chuẩn 18·4·6 (SO_CAU_CHUAN_2026) = cỡ ca "đã đúng" mặc định.
    const n = tong > 0 ? tong : SO_CAU_CHUAN_2026.I + SO_CAU_CHUAN_2026.II + SO_CAU_CHUAN_2026.III
    const pb = phanBoMaTran2026(n)
    const hang: HangLuoi[] = PHAN_V2.map((p) => {
      const o = MUC_MA_TRAN.map((m) => pb[p][m])
      return { ten: PHAN_NGAN[p], o, tong: o.reduce((a, b) => a + b, 0) }
    })
    const scMa = { I: hang[0]!.tong, II: hang[1]!.tong, III: hang[2]!.tong }
    return {
      cheDo, tag: 'KIỂM TRA: CÂU EM ĐÃ LÀM ĐÚNG', mauTag: 'dung',
      tieuDe: 'Hôm nay kiểm lại những câu em từng làm đúng',
      moTa: 'Đề của mỗi em gồm câu em đã tự làm đúng trong các chiến dịch. Thiếu câu thì bù câu khác cùng mức độ.',
      tongCau: n, phut: phutCa,
      vong: vongTheoPhan(scMa),
      chiTiet: {
        kieu: 'luoi', tieuDe: 'Số câu theo phần và mức độ (ma trận 2026)',
        cot: MUC_MA_TRAN.map((m) => TEN_MUC_DO_CAU[m]!), hang,
        ghiChu: 'Ô càng đậm càng nhiều câu. Mức độ: Nhận biết · Thông hiểu · Vận dụng.',
      },
      soLieu: soLieu(n, phutCa),
      why: [
        { h: 'Em tự làm đúng rồi, giờ kiểm lại', t: 'Chỉ gồm câu em tự làm đúng, không tính lần có hỗ trợ hay chỉ đọc lời giải.' },
        { h: 'Mỗi câu có nhãn nguồn', t: 'Em thấy mình đã làm đúng câu đó ở đâu, ngày nào, mức độ gì.' },
        { h: 'Thiếu câu vẫn đủ đề', t: 'Chưa đủ câu đã đúng thì bù câu khác cùng mức độ, em không bị chặn.' },
      ],
    }
  }

  // ĐỀ CHUNG ("Lấy trọn kho"): cả phòng làm bộ câu thầy chọn trong đề. Ba ý đều là điều ứng dụng thật sự làm (không hứa thêm).
  return {
    cheDo: 'chung', tag: 'ĐỀ CỦA THẦY', mauTag: 'p2',
    tieuDe: 'Hôm nay làm đề của thầy',
    moTa: 'Cả phòng làm các câu thầy đã chọn trong đề. Mỗi câu em làm được ghi lại để thầy biết em cần ôn chuyên đề nào.',
    tongCau: tong, phut: phutCa,
    vong: vongTheoPhan(sc),
    chiTiet: veThanh(sc, (n) => [{ so: n, mau: 'p2' as const }], (n) => `${n} câu`, 'Số câu từng phần'),
    soLieu: soLieu(tong, phutCa),
    why: [
      { h: 'Cả phòng cùng một bộ câu', t: 'Mọi em làm các câu thầy đã chọn trong đề, nên kết quả so sánh được với nhau.' },
      { h: phutCa ? `Mỗi em có ${phutCa} phút` : 'Mỗi em có thời gian làm bài như nhau', t: 'Em chia thời gian giữa ba phần, nộp bài khi làm xong hoặc khi hết giờ.' },
      { h: 'Câu sai được ghi lại', t: 'Điểm và từng câu em làm được lưu, thầy xem được em còn yếu chuyên đề nào.' },
    ],
  }
}
