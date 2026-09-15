/**
 * VÒNG TƯƠNG KHẮC SÁU HỆ — MỖI CẶP LÀ MỘT PHẢN ỨNG CÓ THẬT.
 *
 * Thầy chốt 15-09: sáu thần thú. Hai hệ mới là **Điện hoá** (dãy điện hoá, điện
 * phân, ăn mòn) và **Hữu cơ** (ester, carbohydrate, polymer).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * KHÔNG ÉP VÒNG TRÒN KHÉP KÍN. Bốn hệ cũ xếp được thành vòng kéo-búa-bao vì
 * may mắn có đủ bốn phản ứng. Sáu hệ thì KHÔNG: em đã liệt mọi cặp có phản ứng
 * thật trong chương trình phổ thông 2018 và đếm được
 *   · Hoả thắng 3 hệ, thua 1 (chỉ CO₂ dập cháy là khắc được lửa)
 *   · Base thắng 4 hệ, thua 1
 *   · Hữu cơ và Điện hoá thua nhiều hơn thắng
 * Ép cho cân đối nghĩa là bịa ra phản ứng không có. Nên: **giữ đúng hoá học,
 * bù cân bằng bằng chỉ số gốc của từng thần thú** (xem `he-thong-pet.ts`), và
 * đo lại bằng phép kiểm chứ không nói miệng.
 *
 * Cặp không có phản ứng đặc trưng thì hệ số 1,0 — và màn hình nói thẳng là
 * "không có tương tác đặc trưng", không bịa một câu cho có.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * MỘT CẶP CHỈ ĐƯỢC MỘT CHIỀU. Bản nháp đầu có ba cặp ghi cả hai chiều — acid ↔
 * điện hoá, khí ↔ hữu cơ, acid ↔ hữu cơ — vì cả hai chiều đều có phản ứng thật
 * (Fe + HCl, và Zn hi sinh bảo vệ Fe khỏi acid). Phép đếm bắt được ngay: có hệ
 * ra "trung tính −2 đối thủ", tức số âm. Luật chọn chiều: **cái nào cốt lõi hơn
 * trong chương trình thì thắng**, ứng dụng nhường phản ứng nền.
 *   · acid > điện hoá — Fe + 2HCl là kiến thức nền, bảo vệ điện hoá là ứng dụng
 *   · hữu cơ > khí     — than hoạt tính hấp phụ khí độc, một mục riêng trong SGK
 *   · hữu cơ > acid    — polymer bền hoá học, dùng chứa acid đặc
 */

export type HeNguyenTo = 'hoa' | 'axit' | 'kiem' | 'khi' | 'dien' | 'huuco'

export const DS_HE: readonly HeNguyenTo[] = ['hoa', 'khi', 'kiem', 'axit', 'dien', 'huuco'] as const

export const TEN_HE_DAY_DU: Record<HeNguyenTo, string> = {
  hoa: 'Hoả · nhiệt nhôm',
  khi: 'Khí · halogen',
  kiem: 'Base · kết tủa',
  axit: 'Acid · ăn mòn',
  dien: 'Điện hoá · kim loại',
  huuco: 'Hữu cơ · ester, polymer',
}

export const TEN_HE_NGAN: Record<HeNguyenTo, string> = {
  hoa: 'Hoả', khi: 'Khí', kiem: 'Base', axit: 'Acid', dien: 'Điện hoá', huuco: 'Hữu cơ',
}

/** Một cặp khắc chế: `cong` áp đảo `thu`, kèm phản ứng thật làm bằng chứng. */
export interface CapKhacChe {
  cong: HeNguyenTo
  thu: HeNguyenTo
  /** Phương trình hoặc hiện tượng có thật — đây là phần HỌC của cơ chế. */
  banChung: string
}

/**
 * BẢNG KHẮC CHẾ. Mỗi dòng phải chỉ ra được một phản ứng trong chương trình.
 * Thêm dòng mới thì phải kèm bằng chứng, không thêm cho đủ số.
 */
export const BANG_KHAC_CHE: readonly CapKhacChe[] = [
  // Hoả áp đảo
  { cong: 'hoa', thu: 'huuco', banChung: 'Đốt cháy hoàn toàn hợp chất hữu cơ: CxHyOz + O₂ → CO₂ + H₂O.' },
  { cong: 'hoa', thu: 'kiem', banChung: 'Nhiệt phân base không tan: 2Fe(OH)₃ → Fe₂O₃ + 3H₂O.' },
  { cong: 'hoa', thu: 'dien', banChung: 'Nhiệt nhôm khử oxide kim loại: 2Al + Fe₂O₃ → Al₂O₃ + 2Fe.' },
  // Khí áp đảo
  { cong: 'khi', thu: 'dien', banChung: 'Halogen oxi hoá kim loại: 2Fe + 3Cl₂ → 2FeCl₃.' },
  { cong: 'khi', thu: 'hoa', banChung: 'CO₂ nặng hơn không khí, không duy trì sự cháy — dùng dập đám cháy.' },
  // Base áp đảo
  { cong: 'kiem', thu: 'axit', banChung: 'Trung hoà: NaOH + HCl → NaCl + H₂O.' },
  { cong: 'kiem', thu: 'khi', banChung: 'Base hấp thụ khí halogen: Cl₂ + 2NaOH → NaCl + NaClO + H₂O.' },
  { cong: 'kiem', thu: 'huuco', banChung: 'Xà phòng hoá chất béo: (RCOO)₃C₃H₅ + 3NaOH → 3RCOONa + C₃H₅(OH)₃.' },
  { cong: 'kiem', thu: 'dien', banChung: 'Nhôm lưỡng tính tan trong base: 2Al + 2NaOH + 6H₂O → 2Na[Al(OH)₄] + 3H₂.' },
  // Acid áp đảo
  { cong: 'axit', thu: 'dien', banChung: 'Kim loại đứng trước H tan trong acid: Fe + 2HCl → FeCl₂ + H₂.' },
  // Điện hoá áp đảo
  { cong: 'dien', thu: 'huuco', banChung: 'Kim loại kiềm đẩy H linh động: 2Na + 2C₂H₅OH → 2C₂H₅ONa + H₂.' },
  // Hữu cơ áp đảo
  { cong: 'huuco', thu: 'khi', banChung: 'Than hoạt tính hấp phụ khí độc — nguyên lý mặt nạ phòng độc.' },
  { cong: 'huuco', thu: 'axit', banChung: 'Polymer bền hoá học (PVC, PTFE) dùng làm bình chứa acid đặc.' },
] as const

const CHI_MUC = new Map<string, CapKhacChe>()
for (const c of BANG_KHAC_CHE) CHI_MUC.set(c.cong + '>' + c.thu, c)

export const HE_SO_KHAC_CHE = 1.5
export const HE_SO_BI_KHAC = 0.7

export interface KetQuaTuongKhac {
  heSo: number
  /** 'khac' · 'biKhac' · 'trung' — màn hình đổi màu theo ba trạng thái này. */
  loai: 'khac' | 'biKhac' | 'trung'
  thongDiep: string
  /** Phản ứng thật đứng sau. Rỗng khi hai hệ không có tương tác đặc trưng. */
  banChung: string
}

/**
 * Hệ số sát thương khi hệ `heCong` đánh vào hệ `heThu`.
 *
 * HAI CHIỀU ĐỀU PHẢI TRA. Bản bốn hệ cũ suy chiều ngược bằng cách đảo điều
 * kiện; với bảng thưa như đây thì đảo là sai — A khắc B không có nghĩa B bị A
 * khắc theo một luật đối xứng nào cả, phải tra đúng bảng.
 */
export function tinhHeSoTuongKhac(heCong: HeNguyenTo, heThu: HeNguyenTo): KetQuaTuongKhac {
  const thang = CHI_MUC.get(heCong + '>' + heThu)
  if (thang) {
    return {
      heSo: HE_SO_KHAC_CHE,
      loai: 'khac',
      thongDiep: `Khắc chế ${TEN_HE_NGAN[heThu]}! Sát thương +50%`,
      banChung: thang.banChung,
    }
  }
  const thua = CHI_MUC.get(heThu + '>' + heCong)
  if (thua) {
    return {
      heSo: HE_SO_BI_KHAC,
      loai: 'biKhac',
      thongDiep: `Bị ${TEN_HE_NGAN[heThu]} khắc chế! Sát thương −30%`,
      banChung: thua.banChung,
    }
  }
  return {
    heSo: 1,
    loai: 'trung',
    thongDiep: 'Hai hệ không có tương tác đặc trưng',
    banChung: '',
  }
}

/** Các hệ mà `he` khắc được — dùng cho thẻ Hồ Sơ Nguyên Tố. */
export function heKhacDuoc(he: HeNguyenTo): CapKhacChe[] {
  return BANG_KHAC_CHE.filter((c) => c.cong === he)
}

/** Các hệ khắc được `he`. */
export function heBiKhacBoi(he: HeNguyenTo): CapKhacChe[] {
  return BANG_KHAC_CHE.filter((c) => c.thu === he)
}
