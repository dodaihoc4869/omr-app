/**
 * MƯỜI HAI HOÁ CHẤT — bộ chốt 14-09-2026.
 *
 * Bộ này KHÔNG phải chọn theo cảm tính. Bộ nháp đầu tiên (HCl, NaOH, H₂SO₄,
 * KMnO₄, Cl₂, KI, Na, Zn, AgNO₃, NH₃, CO₂, Ca(OH)₂) cho 35/66 cặp KHÔNG phản
 * ứng — 53%. Hơn nửa số cú dẫm trong ván sẽ không có gì xảy ra. Bộ dưới đây
 * đo được 22/66 — 33%. Phép kiểm `cap-tro-duoi-nguong` giữ con số đó.
 */

/** Ion dương. 'kimLoai' nghĩa là đơn chất kim loại, không phải ion trong dung dịch. */
export type Cation = 'H' | 'Na' | 'Ca' | 'Ba' | 'Cu' | 'Ag' | 'Fe3' | null
/** Ion âm. */
export type Anion = 'Cl' | 'SO4' | 'OH' | 'CO3' | 'NO3' | null

export type Vai = 'axit' | 'kiem' | 'muoi' | 'kimLoai' | 'oxh'

export interface HoaChat {
  /** Công thức hiện trên bình. Đây mới là thứ nói chính xác chất gì. */
  ct: string
  /** Màu dung dịch trong bình. Ba chất mang ĐÚNG màu thật, chín chất còn lại
   *  không màu nên được gán màu thẻ để phân biệt ở cỡ 40 px. */
  mau: string
  vai: Vai
  cation: Cation
  anion: Anion
}

export const HOA_CHAT: readonly HoaChat[] = [
  { ct: 'HCl',      mau: 'rgb(18, 181, 203)', vai: 'axit',    cation: 'H',   anion: 'Cl'  },
  { ct: 'H₂SO₄',    mau: 'rgb(199, 154, 46)', vai: 'axit',    cation: 'H',   anion: 'SO4' },
  { ct: 'NaOH',     mau: 'rgb(79, 107, 237)', vai: 'kiem',    cation: 'Na',  anion: 'OH'  },
  { ct: 'Ca(OH)₂',  mau: 'rgb(237, 242, 248)', vai: 'kiem',    cation: 'Ca',  anion: 'OH'  },
  { ct: 'Ba(OH)₂',  mau: 'rgb(169, 190, 242)', vai: 'kiem',    cation: 'Ba',  anion: 'OH'  },
  { ct: 'Na₂CO₃',   mau: 'rgb(95, 208, 182)', vai: 'muoi',    cation: 'Na',  anion: 'CO3' },
  { ct: 'CuSO₄',    mau: 'rgb(30, 127, 212)', vai: 'muoi',    cation: 'Cu',  anion: 'SO4' }, // xanh lam — màu thật
  { ct: 'AgNO₃',    mau: 'rgb(207, 199, 222)', vai: 'muoi',    cation: 'Ag',  anion: 'NO3' },
  { ct: 'Al',       mau: 'rgb(191, 199, 208)', vai: 'kimLoai', cation: null,  anion: null  },
  { ct: 'Zn',       mau: 'rgb(126, 147, 168)', vai: 'kimLoai', cation: null,  anion: null  },
  { ct: 'FeCl₃',    mau: 'rgb(200, 106, 46)', vai: 'muoi',    cation: 'Fe3', anion: 'Cl'  }, // vàng nâu — màu thật
  { ct: 'Cl₂',      mau: 'rgb(184, 214, 43)', vai: 'oxh',     cation: null,  anion: null  }, // vàng lục — màu thật
] as const

export const SO_HOA_CHAT = HOA_CHAT.length

/** Dãy hoạt động hoá học, mạnh → yếu. Dùng cho L1 và L2. */
export const DAY_HOAT_DONG = ['K', 'Na', 'Ca', 'Mg', 'Al', 'Zn', 'Fe', 'Cu', 'Ag'] as const

/** Kim loại đứng TRƯỚC hiđro ⇒ đẩy được hiđro khỏi axit (L1). */
export const TRUOC_HIDRO = new Set(['Al', 'Zn'])

/** Kim loại lưỡng tính ⇒ tan trong kiềm (L6). */
export const LUONG_TINH = new Set(['Al', 'Zn'])

/** Muối nào mang kim loại nào — để L2 biết đẩy được ai. */
export const KIM_LOAI_TRONG_MUOI: Readonly<Record<string, string>> = {
  'CuSO₄': 'Cu',
  'AgNO₃': 'Ag',
  'FeCl₃': 'Fe',
}

/** Cặp (cation, anion) tạo KẾT TỦA. Đây là bảng nền của L4 — luật lõi của game. */
export const KET_TUA = new Set([
  'Ag|Cl', 'Ag|OH', 'Ag|CO3',
  'Ba|SO4', 'Ba|CO3',
  'Ca|SO4', 'Ca|CO3',
  'Cu|OH', 'Cu|CO3',
  'Fe3|OH',
])

export function laKetTua(cation: Cation, anion: Anion): boolean {
  if (cation === null || anion === null) return false
  return KET_TUA.has(cation + '|' + anion)
}

/** Tra chỉ số một chất theo công thức. -1 nếu không có. */
export function chiSoChat(ct: string): number {
  return HOA_CHAT.findIndex((h) => h.ct === ct)
}
