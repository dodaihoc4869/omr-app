/**
 * BẢNG KHẮC CHẾ — SINH TỪ TÁM LUẬT, KHÔNG GÕ TAY 66 Ô.
 *
 * Gõ tay 66 ô thì sai một ô không ai phát hiện. Sinh từ luật thì sai là sai cả
 * một luật, và phép kiểm bắt được ngay.
 *
 * Đây là NGUỒN SỰ THẬT DUY NHẤT về hoá học của game. Cấm hard-code kết quả
 * khắc chế ở bất kỳ tệp nào khác.
 */
import {
  HOA_CHAT, DAY_HOAT_DONG, TRUOC_HIDRO, LUONG_TINH, KIM_LOAI_TRONG_MUOI,
  laKetTua, type HoaChat,
} from './hoa-chat'

export type LoaiKetQua = 'khacChe' | 'trungHoa' | 'khongPhanUng'
export type MaLuat = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8' | '—'

export interface KetQuaDam {
  loai: LoaiKetQua
  /** Công thức của bên THẮNG. null khi trung hoà hoặc không phản ứng. */
  thang: string | null
  luat: MaLuat
  /** Câu một dòng hiện dưới phương trình. Đây là thứ em thật sự học. */
  tieuChi: string
  /** Phương trình đã cân bằng. Rỗng khi không phản ứng. */
  pt: string
}

export const TEN_LUAT: Readonly<Record<MaLuat, string>> = {
  L1: 'kim loại trước H đẩy hiđro khỏi axit',
  L2: 'kim loại mạnh đẩy kim loại yếu khỏi muối',
  L3: 'clo oxi hoá kim loại',
  L4: 'ai bị kết tủa thì mất mạng',
  L5: 'kiềm hấp thụ khí clo',
  L6: 'kiềm hoà tan kim loại lưỡng tính',
  L7: 'axit gặp bazơ — không bên nào mạnh hơn',
  L8: 'axit mạnh đẩy khí CO₂ khỏi muối cacbonat',
  '—': 'không phản ứng ở điều kiện thường',
}

/**
 * Phương trình cho từng cặp. Khoá là hai công thức nối bằng '+', ĐÃ SẮP XẾP
 * theo thứ tự xuất hiện trong HOA_CHAT, nên tra được từ cả hai chiều.
 *
 * Phép kiểm `moi-phuong-trinh-can-bang` đếm nguyên tử hai vế của TỪNG dòng
 * dưới đây. Một phương trình lệch là hàng trăm em học sai — cổng này không nới.
 */
export const PHUONG_TRINH: Readonly<Record<string, string>> = {
  // ——— L7 trung hoà
  'HCl+NaOH':        'HCl + NaOH → NaCl + H₂O',
  'HCl+Ca(OH)₂':     '2HCl + Ca(OH)₂ → CaCl₂ + 2H₂O',
  'HCl+Ba(OH)₂':     '2HCl + Ba(OH)₂ → BaCl₂ + 2H₂O',
  'H₂SO₄+NaOH':      'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',
  'H₂SO₄+Ca(OH)₂':   'H₂SO₄ + Ca(OH)₂ → CaSO₄↓ + 2H₂O',
  'H₂SO₄+Ba(OH)₂':   'H₂SO₄ + Ba(OH)₂ → BaSO₄↓ + 2H₂O',
  'Ca(OH)₂+CuSO₄':   'Ca(OH)₂ + CuSO₄ → CaSO₄↓ + Cu(OH)₂↓',
  'Ba(OH)₂+CuSO₄':   'Ba(OH)₂ + CuSO₄ → BaSO₄↓ + Cu(OH)₂↓',

  // ——— L8 axit đẩy CO₂ khỏi cacbonat
  'HCl+Na₂CO₃':      '2HCl + Na₂CO₃ → 2NaCl + CO₂↑ + H₂O',
  'H₂SO₄+Na₂CO₃':    'H₂SO₄ + Na₂CO₃ → Na₂SO₄ + CO₂↑ + H₂O',

  // ——— L4 ai bị kết tủa thì mất mạng
  'HCl+AgNO₃':       'HCl + AgNO₃ → AgCl↓ + HNO₃',
  'NaOH+CuSO₄':      '2NaOH + CuSO₄ → Cu(OH)₂↓ + Na₂SO₄',
  'NaOH+AgNO₃':      '2NaOH + 2AgNO₃ → Ag₂O↓ + 2NaNO₃ + H₂O',
  'NaOH+FeCl₃':      '3NaOH + FeCl₃ → Fe(OH)₃↓ + 3NaCl',
  'Ca(OH)₂+Na₂CO₃':  'Ca(OH)₂ + Na₂CO₃ → CaCO₃↓ + 2NaOH',
  'Ca(OH)₂+AgNO₃':   'Ca(OH)₂ + 2AgNO₃ → Ag₂O↓ + Ca(NO₃)₂ + H₂O',
  'Ca(OH)₂+FeCl₃':   '3Ca(OH)₂ + 2FeCl₃ → 2Fe(OH)₃↓ + 3CaCl₂',
  'Ba(OH)₂+Na₂CO₃':  'Ba(OH)₂ + Na₂CO₃ → BaCO₃↓ + 2NaOH',
  'Ba(OH)₂+AgNO₃':   'Ba(OH)₂ + 2AgNO₃ → Ag₂O↓ + Ba(NO₃)₂ + H₂O',
  'Ba(OH)₂+FeCl₃':   '3Ba(OH)₂ + 2FeCl₃ → 2Fe(OH)₃↓ + 3BaCl₂',
  'Na₂CO₃+CuSO₄':    'Na₂CO₃ + CuSO₄ → CuCO₃↓ + Na₂SO₄',
  'Na₂CO₃+AgNO₃':    'Na₂CO₃ + 2AgNO₃ → Ag₂CO₃↓ + 2NaNO₃',
  'AgNO₃+FeCl₃':     '3AgNO₃ + FeCl₃ → 3AgCl↓ + Fe(NO₃)₃',

  // ——— L1 kim loại đẩy hiđro khỏi axit
  'HCl+Al':          '2Al + 6HCl → 2AlCl₃ + 3H₂↑',
  'HCl+Zn':          'Zn + 2HCl → ZnCl₂ + H₂↑',
  'H₂SO₄+Al':        '2Al + 3H₂SO₄ → Al₂(SO₄)₃ + 3H₂↑',
  'H₂SO₄+Zn':        'Zn + H₂SO₄ → ZnSO₄ + H₂↑',

  // ——— L6 kiềm hoà tan kim loại lưỡng tính
  'NaOH+Al':         '2Al + 2NaOH + 6H₂O → 2Na[Al(OH)₄] + 3H₂↑',
  'NaOH+Zn':         'Zn + 2NaOH + 2H₂O → Na₂[Zn(OH)₄] + H₂↑',
  'Ca(OH)₂+Al':      '2Al + Ca(OH)₂ + 6H₂O → Ca[Al(OH)₄]₂ + 3H₂↑',
  'Ca(OH)₂+Zn':      'Zn + Ca(OH)₂ + 2H₂O → Ca[Zn(OH)₄] + H₂↑',
  'Ba(OH)₂+Al':      '2Al + Ba(OH)₂ + 6H₂O → Ba[Al(OH)₄]₂ + 3H₂↑',
  'Ba(OH)₂+Zn':      'Zn + Ba(OH)₂ + 2H₂O → Ba[Zn(OH)₄] + H₂↑',

  // ——— L5 kiềm hấp thụ khí clo
  'NaOH+Cl₂':        'Cl₂ + 2NaOH → NaCl + NaClO + H₂O',
  'Ca(OH)₂+Cl₂':     'Cl₂ + Ca(OH)₂ → CaOCl₂ + H₂O',
  'Ba(OH)₂+Cl₂':     '2Cl₂ + 2Ba(OH)₂ → Ba(ClO)₂ + BaCl₂ + 2H₂O',

  // ——— L2 kim loại mạnh đẩy kim loại yếu khỏi muối
  'CuSO₄+Al':        '2Al + 3CuSO₄ → Al₂(SO₄)₃ + 3Cu↓',
  'CuSO₄+Zn':        'Zn + CuSO₄ → ZnSO₄ + Cu↓',
  'AgNO₃+Al':        'Al + 3AgNO₃ → Al(NO₃)₃ + 3Ag↓',
  'AgNO₃+Zn':        'Zn + 2AgNO₃ → Zn(NO₃)₂ + 2Ag↓',
  'Al+FeCl₃':        'Al + FeCl₃ → AlCl₃ + Fe↓',
  'Zn+FeCl₃':        '3Zn + 2FeCl₃ → 3ZnCl₂ + 2Fe↓',

  // ——— L3 clo oxi hoá kim loại
  'Al+Cl₂':          '2Al + 3Cl₂ → 2AlCl₃',
  'Zn+Cl₂':          'Zn + Cl₂ → ZnCl₂',
}

/** Khoá tra phương trình: hai công thức theo đúng thứ tự trong HOA_CHAT. */
export function khoaCap(a: string, b: string): string {
  const ia = HOA_CHAT.findIndex((h) => h.ct === a)
  const ib = HOA_CHAT.findIndex((h) => h.ct === b)
  return ia <= ib ? a + '+' + b : b + '+' + a
}

function ra(loai: LoaiKetQua, thang: string | null, luat: MaLuat, a: string, b: string): KetQuaDam {
  return {
    loai,
    thang,
    luat,
    tieuChi: TEN_LUAT[luat],
    pt: loai === 'khongPhanUng' ? '' : (PHUONG_TRINH[khoaCap(a, b)] ?? ''),
  }
}

const TRO: KetQuaDam = {
  loai: 'khongPhanUng', thang: null, luat: '—', tieuChi: TEN_LUAT['—'], pt: '',
}

/**
 * HÀM THUẦN. Trả về chuyện gì xảy ra khi người cầm `ctA` dẫm lên người cầm `ctB`.
 *
 * Kết quả KHÔNG phụ thuộc thứ tự: `xuLyHoaChat(a,b)` và `xuLyHoaChat(b,a)` luôn
 * ra cùng một kẻ thắng. Ai là người nhảy lên chỉ quyết định việc đó là "khắc chế"
 * hay "BỊ khắc chế" — và đó là việc của `xu-ly-dam.ts`, không phải của tệp này.
 */
export function xuLyHoaChat(ctA: string, ctB: string): KetQuaDam {
  if (ctA === ctB) return TRO
  const A = HOA_CHAT.find((h) => h.ct === ctA)
  const B = HOA_CHAT.find((h) => h.ct === ctB)
  if (!A || !B) return TRO

  const kl = A.vai === 'kimLoai' ? A : B.vai === 'kimLoai' ? B : null
  const kia: HoaChat | null = kl === null ? null : (kl === A ? B : A)

  // ——— L1 · kim loại trước H đẩy hiđro khỏi axit
  if (kl && kia && kia.vai === 'axit') {
    if (TRUOC_HIDRO.has(kl.ct)) return ra('khacChe', kl.ct, 'L1', ctA, ctB)
    return TRO
  }

  // ——— L2 · kim loại mạnh đẩy kim loại yếu khỏi muối
  if (kl && kia && KIM_LOAI_TRONG_MUOI[kia.ct] !== undefined) {
    const yeu = KIM_LOAI_TRONG_MUOI[kia.ct]!
    const iManh = DAY_HOAT_DONG.indexOf(kl.ct as (typeof DAY_HOAT_DONG)[number])
    const iYeu = DAY_HOAT_DONG.indexOf(yeu as (typeof DAY_HOAT_DONG)[number])
    if (iManh >= 0 && iYeu >= 0 && iManh < iYeu) return ra('khacChe', kl.ct, 'L2', ctA, ctB)
    return TRO
  }

  // ——— L3 · clo oxi hoá kim loại
  if (kl && kia && kia.vai === 'oxh') return ra('khacChe', kia.ct, 'L3', ctA, ctB)

  // ——— L6 · kiềm hoà tan kim loại lưỡng tính
  if (kl && kia && kia.vai === 'kiem' && LUONG_TINH.has(kl.ct)) {
    return ra('khacChe', kia.ct, 'L6', ctA, ctB)
  }

  // kim loại gặp thứ còn lại ⇒ không phản ứng
  if (kl) return TRO

  // ——— L5 · kiềm hấp thụ khí clo
  if (A.vai === 'oxh' && B.vai === 'kiem') return ra('khacChe', B.ct, 'L5', ctA, ctB)
  if (B.vai === 'oxh' && A.vai === 'kiem') return ra('khacChe', A.ct, 'L5', ctA, ctB)
  if (A.vai === 'oxh' || B.vai === 'oxh') return TRO

  // ——— L7 · axit gặp bazơ ⇒ trung hoà, CẢ HAI mất mạng
  if ((A.vai === 'axit' && B.vai === 'kiem') || (B.vai === 'axit' && A.vai === 'kiem')) {
    return ra('trungHoa', null, 'L7', ctA, ctB)
  }

  // ——— L8 · axit mạnh đẩy khí CO₂ khỏi muối cacbonat
  if (A.vai === 'axit' && B.anion === 'CO3') return ra('khacChe', A.ct, 'L8', ctA, ctB)
  if (B.vai === 'axit' && A.anion === 'CO3') return ra('khacChe', B.ct, 'L8', ctA, ctB)

  // ——— L4 · trao đổi ion: AI BỊ KẾT TỦA THÌ MẤT MẠNG
  const tuaA = laKetTua(A.cation, B.anion)   // cation của A bị anion của B khoá lại
  const tuaB = laKetTua(B.cation, A.anion)
  if (tuaA && tuaB) return ra('trungHoa', null, 'L4', ctA, ctB)
  if (tuaA) return ra('khacChe', B.ct, 'L4', ctA, ctB)
  if (tuaB) return ra('khacChe', A.ct, 'L4', ctA, ctB)

  return TRO
}

/** Họ khắc chế mình? Nghĩa hẹp: chỉ xét khắc chế, không xét trung hoà. */
export function biKhacChe(ctMinh: string, ctHo: string): boolean {
  const kq = xuLyHoaChat(ctMinh, ctHo)
  return kq.loai === 'khacChe' && kq.thang === ctHo
}

export type MucCanhBao = 'an' | 'trungHoa' | 'biKhacChe'

/**
 * NHẢY LÊN ĐẦU NGƯỜI NÀY THÌ CHÍNH MÌNH CÓ MẤT MẠNG KHÔNG.
 *
 * Đây mới là câu người chơi cần trả lời trong lúc đang rơi, và nó KHÁC
 * biKhacChe(): trung hoà cũng làm mình mất một mạng, mà biKhacChe() trả false.
 * Dùng đúng hàm này để vẽ viền cảnh báo — dùng nhầm là game phạt mà không báo.
 */
export function canhBaoDam(ctMinh: string, ctHo: string): MucCanhBao {
  const kq = xuLyHoaChat(ctMinh, ctHo)
  if (kq.loai === 'trungHoa') return 'trungHoa'
  if (kq.loai === 'khacChe' && kq.thang === ctHo) return 'biKhacChe'
  return 'an'
}

/** Đếm khắc chế / bị khắc / trơ của một chất, tính trên đúng những người đang trong ván. */
export function demDoiThu(ctMinh: string, ctDoiThu: readonly string[]): {
  khac: number; biKhac: number; trung: number; tro: number
} {
  let khac = 0, biKhac = 0, trung = 0, tro = 0
  for (const ct of ctDoiThu) {
    const kq = xuLyHoaChat(ctMinh, ct)
    if (kq.loai === 'trungHoa') trung++
    else if (kq.loai === 'khongPhanUng') tro++
    else if (kq.thang === ctMinh) khac++
    else biKhac++
  }
  return { khac, biKhac, trung, tro }
}
