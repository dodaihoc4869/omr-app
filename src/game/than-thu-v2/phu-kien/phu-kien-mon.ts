// PHỤ KIỆN THẦN THÚ · SỔ HÌNH của 24 món ĐỢT 1 + 16 món ĐỢT 2 (đề xuất DE-XUAT-SHOP-PHU-KIEN-2109.md mục 3): MÃ món · ô gắn · bậc · kiểu hình. KHÔNG có tên hiển thị, giá hay mô tả —
// chữ của món (tên, mô tả) do danh mục `src/lib/phu-kien-danh-muc.ts` (Code 3) giữ; ở đây chỉ có cái để VẼ. Mã / ô / bậc đúng bảng đã chốt (test của Code 3 khoá `MON_DOT_1`: đúng 24 món — đừng thêm món khác vào đó).
// Mã = tiền tố ô + số thứ tự trong ô: HQ = hào quang (nền), VD = vệt di chuyển, KT = khung tên (đợt 1) · DA = trên đầu, CL = trên lưng (đợt 2, cần bảng điểm đặt `phu-kien-neo.ts`).
export type OGan = 'hao-quang' | 'vet' | 'khung' | 'dau' | 'co-lung'
/** Điểm đặt của món đợt 2 trên bảng neo: đỉnh đầu · cổ · lưng. */
export type DiemDat = 'dau' | 'co' | 'lung'
export type Bac = 1 | 2 | 3 | 4 | 5
export interface MonHinh {
  ma: string
  o: OGan
  bac: Bac
  /** Tên KIỂU hình (chỉ để đặt lớp CSS / tệp hình) — không phải chữ hiện ra màn. */
  kieu: string
  /** Chỉ món đợt 2: đặt tại điểm nào của bảng neo. */
  neo?: DiemDat
  /** Chỉ món đợt 2: vẽ SAU thú (cánh, áo choàng — thú che bớt) hay TRƯỚC thú (mũ, khăn, áo, ba lô). */
  lop?: 'sau' | 'truoc'
}

const mon = (ma: string, o: OGan, bac: Bac, kieu: string, neo?: DiemDat, lop?: 'sau' | 'truoc'): MonHinh => (neo ? { ma, o, bac, kieu, neo, lop: lop ?? 'truoc' } : { ma, o, bac, kieu })

export const MON_DOT_1: readonly MonHinh[] = [
  mon('HQ-01', 'hao-quang', 1, 'hoi-nuoc'),
  mon('HQ-02', 'hao-quang', 1, 'giay-quy'),
  mon('HQ-03', 'hao-quang', 2, 'sodium'),
  mon('HQ-04', 'hao-quang', 2, 'cuso4'),
  mon('HQ-05', 'hao-quang', 3, 'neon'),
  mon('HQ-06', 'hao-quang', 3, 'kim-cuong'),
  mon('HQ-07', 'hao-quang', 4, 'cuc-quang'),
  mon('HQ-08', 'hao-quang', 5, 'orbital'),
  mon('VD-01', 'vet', 1, 'bot-khi'),
  mon('VD-02', 'vet', 1, 'muoi-an'),
  mon('VD-03', 'vet', 1, 'phenolphthalein'),
  mon('VD-04', 'vet', 2, 'potassium'),
  mon('VD-05', 'vet', 2, 'copper'),
  mon('VD-06', 'vet', 3, 'magnesium'),
  mon('VD-07', 'vet', 4, 'strontium'),
  mon('VD-08', 'vet', 5, 'electron'),
  mon('KT-01', 'khung', 1, 'ong-nghiem'),
  mon('KT-02', 'khung', 1, 'nhan-lo'),
  mon('KT-03', 'khung', 1, 'o-nguyen-to'),
  mon('KT-04', 'khung', 2, 'silver'),
  mon('KT-05', 'khung', 2, 'benzene'),
  mon('KT-06', 'khung', 3, 'thach-anh-tim'),
  mon('KT-07', 'khung', 4, 'titanium'),
  mon('KT-08', 'khung', 5, 'gold'),
]

export const MON_DOT_2: readonly MonHinh[] = [
  mon('DA-01', 'dau', 1, 'kinh-bao-ho', 'dau'),
  mon('DA-02', 'dau', 1, 'mu-phe', 'dau'),
  mon('DA-03', 'dau', 2, 'no-doi', 'dau'),
  mon('DA-04', 'dau', 2, 'binh-cau', 'dau'),
  mon('DA-05', 'dau', 3, 'nguyet-que-dong', 'dau'),
  mon('DA-06', 'dau', 3, 'sung-bismuth', 'dau'),
  mon('DA-07', 'dau', 4, 'thach-anh', 'dau'),
  mon('DA-08', 'dau', 5, 'bach-kim', 'dau'),
  mon('CL-01', 'co-lung', 1, 'khan-loang-mau', 'co'),
  mon('CL-02', 'co-lung', 1, 'ngoc-trai', 'co'),
  mon('CL-03', 'co-lung', 2, 'ao-khoa-hoc', 'lung'),
  mon('CL-04', 'co-lung', 2, 'khan-lua-trang', 'co'),
  mon('CL-05', 'co-lung', 3, 'canh-giot-nuoc', 'lung', 'sau'),
  mon('CL-06', 'co-lung', 3, 'ba-lo-bong-bay', 'lung'),
  mon('CL-07', 'co-lung', 4, 'canh-graphene', 'lung', 'sau'),
  mon('CL-08', 'co-lung', 5, 'ao-choang', 'lung', 'sau'),
]

const THEO_MA = new Map([...MON_DOT_1, ...MON_DOT_2].map((m) => [m.ma, m] as const))

/** Món theo mã; mã lạ / không phải chuỗi ⇒ null (thú vẫn hiện, chỉ bỏ lớp ấy — không bao giờ ném lỗi vì một mã hỏng). */
export function docMon(ma: unknown): MonHinh | null {
  return typeof ma === 'string' ? (THEO_MA.get(ma) ?? null) : null
}

/** Món của ô đúng loại: mã thuộc ô khác (vd đặt mã khung vào ô vệt) ⇒ null. */
export function monCuaO(o: OGan, ma: unknown): MonHinh | null {
  const m = docMon(ma)
  return m && m.o === o ? m : null
}

/** Ký hiệu nguyên tố trên "Ô nguyên tố" từ tên thú: chữ cái đầu của chữ thứ nhất (hoa) + chữ cái đầu của chữ thứ hai (thường), bỏ dấu; một chữ ⇒ chữ cái thứ hai của nó. ("Mập Địch" ⇒ "Md") */
export function kiHieuNguyenTo(ten: string): string {
  const sach = ten.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, (c) => (c === 'đ' ? 'd' : 'D'))
  const chu = sach.split(/\s+/).map((x) => x.replace(/[^A-Za-z]/g, '')).filter(Boolean)
  if (chu.length === 0) return ''
  const hai = chu.length > 1 ? chu[1]![0]! : (chu[0]![1] ?? '')
  return chu[0]![0]!.toUpperCase() + hai.toLowerCase()
}
