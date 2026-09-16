/**
 * ĐẤU TRƯỜNG CHÂN LÝ — SÁU NGƯỜI MỘT PHÒNG, ĐÁNH TỰ ĐỘNG THEO VÒNG.
 *
 * Thầy chốt 15-09: *"bấm vào võ đài xếp hạng thì phải hiện ra đấu trường chân
 * lý luôn, chọn cửa mời số báo danh tối đa được 6 người chơi cùng lúc, thiết
 * kế đánh nhau như đấu trường chân lý"*.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * TỆP NÀY LÀ PHẦN LÕI, VÀ NÓ THUẦN. Không đọc mạng, không đọc `localStorage`,
 * không `Date.now()`, không `Math.random()` trừ khi màn hình đưa hàm ngẫu
 * nhiên vào. Nhờ vậy mỗi trận đấu KIỂM ĐƯỢC BẰNG VITEST: cùng một hạt giống
 * ngẫu nhiên thì ra cùng một kết quả, không có chuyện "máy em bảo thắng, máy
 * bạn bảo thua".
 *
 * BỐN CƠ CHẾ GỐC CỦA ĐẤU TRƯỜNG CHÂN LÝ ĐƯỢC GIỮ NGUYÊN:
 *
 *  1. **Cửa hàng quay số.** Năm ô, tỉ lệ ra quân đắt tăng theo CẤP ĐỘI. Làm
 *     mới tốn vàng. Đây là thứ làm mỗi ván một khác.
 *  2. **Ba ghép một.** Ba quân giống nhau cùng sao tự ghép lên một sao, chỉ số
 *     nhân 1,8 lần. Ghép tiếp ba quân hai sao ra ba sao.
 *  3. **Vàng và lãi.** Mỗi vòng được vàng nền, cộng LÃI theo số vàng để dành
 *     (10 vàng ăn 1 lãi, tối đa 5) và cộng chuỗi thắng/thua. Giữ tiền hay tiêu
 *     tiền là quyết định thật, y như bản gốc.
 *  4. **Đánh tự động, thua thì mất máu theo số quân địch còn sống.** Hết máu
 *     là bị loại; người trụ cuối cùng hạng nhất.
 *
 * MỘT CƠ CHẾ THÊM VÀO, VÀ LÀ LÝ DO GAME NÀY TỒN TẠI: **trả lời đúng câu Hoá
 * thì được vàng**. Không học thì không có tiền mua quân, có ngồi lì cũng không
 * lên nổi hạng. Bản gốc cho vàng theo thời gian; ở đây cho theo câu đúng.
 *
 * KHÁC BẢN GỐC, NÓI THẲNG RA:
 *  · Bản gốc có KHO QUÂN CHUNG (cả bàn tranh nhau một số lượng quân hữu hạn).
 *    Ở đây mỗi em một cửa hàng riêng, kho không giới hạn. Kho chung buộc phải
 *    giữ trạng thái chung trên máy chủ và đồng bộ từng lượt quay; một em rớt
 *    mạng là cả phòng kẹt. Với lớp học 100–300 em dùng 3G thì cái giá ấy quá
 *    đắt so với thứ nó thêm vào.
 *  · Bản gốc có vị trí đứng và tầm đánh. Ở đây bỏ vị trí: màn hình điện thoại
 *    không đủ chỗ kéo thả tám ô mà vẫn đọc được đề Hoá bên cạnh.
 */

import { DS_HE, TEN_HE_NGAN, tinhHeSoTuongKhac, type HeNguyenTo } from './tuong-khac'

// ═══════════════════════════════════════════════════════════════════════════
// HẰNG SỐ LUẬT CHƠI — MỘT NGUỒN SỰ THẬT, màn hình không được chép lại số nào.
// ═══════════════════════════════════════════════════════════════════════════

export const SO_NGUOI_TOI_DA = 6
export const MAU_KHOI_DAU = 100
export const CAP_KHOI_DAU = 2
export const CAP_TOI_DA_DOI = 6
export const SO_O_CUA_HANG = 5
export const GIA_LAM_MOI = 2
export const GIA_MUA_KINH_NGHIEM = 4
export const KN_MOI_LAN_MUA = 4
export const VANG_NEN_MOI_VONG = 5
export const LAI_TOI_DA = 5
export const VANG_MOI_CAU_DUNG = 2
export const VANG_KHOI_DAU = 8
/** Sau ngần này nhịp mà hai bên còn sống thì xử theo phần trăm máu còn lại. */
export const NHIP_TOI_DA = 200

/** Kinh nghiệm cần để lên từng cấp đội. Chỉ số [cấp] = cần bấy nhiêu KN. */
export const KN_LEN_CAP: readonly number[] = [0, 0, 2, 6, 10, 20, 36]

/**
 * TỈ LỆ RA QUÂN theo cấp đội — bốn bậc giá 1 · 2 · 3 · 4, cộng lại đúng 100.
 * Cấp thấp gần như chỉ ra quân rẻ; muốn quân 4 vàng thì phải lên cấp, tức là
 * phải tiêu vàng vào kinh nghiệm thay vì vào quân. Đúng thế lưỡng nan gốc.
 */
export const TI_LE_CUA_HANG: Record<number, readonly [number, number, number, number]> = {
  1: [100, 0, 0, 0],
  2: [75, 25, 0, 0],
  3: [60, 35, 5, 0],
  4: [45, 40, 13, 2],
  5: [30, 42, 22, 6],
  6: [20, 38, 30, 12],
}

// ═══════════════════════════════════════════════════════════════════════════
// QUÂN CỜ — HAI MƯƠI TƯ QUÂN, SÁU HỆ × BỐN BẬC GIÁ.
//
// Mỗi quân là một chất hoặc một quá trình CÓ THẬT trong chương trình Hoá phổ
// thông, danh pháp 2018. Em nhìn bàn cờ là ôn lại được chất nào thuộc hệ nào.
// ═══════════════════════════════════════════════════════════════════════════

export interface QuanCo {
  id: string
  ten: string
  he: HeNguyenTo
  /** Giá mua, 1…4. Cũng là bậc hiếm. */
  gia: 1 | 2 | 3 | 4
  /** Một dòng kiến thức — hiện ở thẻ quân, đây là phần HỌC. */
  ghiChu: string
}

export const DS_QUAN_CO: readonly QuanCo[] = [
  // ─── HOẢ · nhiệt nhôm ───
  { id: 'mg', ten: 'Magnesium Cháy Trắng', he: 'hoa', gia: 1, ghiChu: '2Mg + O₂ → 2MgO, ngọn lửa trắng chói' },
  { id: 'fe3o4', ten: 'Oxide Sắt Từ', he: 'hoa', gia: 2, ghiChu: '3Fe + 2O₂ → Fe₃O₄' },
  { id: 'nhiet_nhom', ten: 'Nhiệt Nhôm', he: 'hoa', gia: 3, ghiChu: '2Al + Fe₂O₃ → Al₂O₃ + 2Fe, toả nhiệt mạnh' },
  { id: 'lo_cao', ten: 'Lò Cao Luyện Gang', he: 'hoa', gia: 4, ghiChu: 'Fe₂O₃ + 3CO → 2Fe + 3CO₂' },
  // ─── KHÍ · halogen ───
  { id: 'cl2', ten: 'Chlorine Vàng Lục', he: 'khi', gia: 1, ghiChu: 'Cl₂ khí vàng lục, mùi xốc, rất độc' },
  { id: 'hcl_khi', ten: 'Hydrogen Chloride', he: 'khi', gia: 2, ghiChu: 'HCl khí tan vô hạn trong nước' },
  { id: 'nuoc_javel', ten: 'Nước Javel', he: 'khi', gia: 3, ghiChu: 'Cl₂ + 2NaOH → NaCl + NaClO + H₂O' },
  { id: 'f2', ten: 'Fluorine Bạo Chúa', he: 'khi', gia: 4, ghiChu: 'F₂ oxi hoá mạnh nhất, ăn cả nước' },
  // ─── BASE · kết tủa ───
  { id: 'caoh2', ten: 'Nước Vôi Trong', he: 'kiem', gia: 1, ghiChu: 'CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O' },
  { id: 'aloh3', ten: 'Aluminium Hydroxide', he: 'kiem', gia: 2, ghiChu: 'Al(OH)₃ lưỡng tính, tan cả acid lẫn base' },
  { id: 'baso4', ten: 'Kết Tủa BaSO₄', he: 'kiem', gia: 3, ghiChu: 'Ba²⁺ + SO₄²⁻ → BaSO₄↓ trắng, không tan acid' },
  { id: 'naoh_dac', ten: 'Xút Đặc Nóng', he: 'kiem', gia: 4, ghiChu: 'NaOH đặc hoà tan cả Al và Zn' },
  // ─── ACID · ăn mòn ───
  { id: 'hcl_loang', ten: 'Acid Chloride Loãng', he: 'axit', gia: 1, ghiChu: 'Fe + 2HCl → FeCl₂ + H₂↑' },
  { id: 'h2so4_loang', ten: 'Sulfuric Loãng', he: 'axit', gia: 2, ghiChu: 'Chỉ tan kim loại đứng trước H' },
  { id: 'hno3_dac', ten: 'Nitric Đặc', he: 'axit', gia: 3, ghiChu: 'Cu + 4HNO₃ đặc → Cu(NO₃)₂ + 2NO₂ + 2H₂O' },
  { id: 'nuoc_cuong_toan', ten: 'Nước Cường Toan', he: 'axit', gia: 4, ghiChu: 'HNO₃ : HCl = 1 : 3, hoà tan được vàng' },
  // ─── ĐIỆN HOÁ · kim loại ───
  { id: 'zn_cu', ten: 'Pin Zn–Cu', he: 'dien', gia: 1, ghiChu: 'Zn + Cu²⁺ → Zn²⁺ + Cu, sinh dòng điện' },
  { id: 'an_mon_dien', ten: 'Ăn Mòn Điện Hoá', he: 'dien', gia: 2, ghiChu: 'Cặp Fe–Cu trong dung dịch: Fe bị ăn mòn trước' },
  { id: 'dien_phan', ten: 'Điện Phân Nóng Chảy', he: 'dien', gia: 3, ghiChu: '2Al₂O₃ → 4Al + 3O₂ (điện phân, cryolite)' },
  { id: 'ma_dien', ten: 'Mạ Điện Bảo Hộ', he: 'dien', gia: 4, ghiChu: 'Anode hi sinh: Zn bảo vệ thân tàu thép' },
  // ─── HỮU CƠ · ester, polymer ───
  { id: 'ethanol', ten: 'Ethanol Men Rượu', he: 'huuco', gia: 1, ghiChu: 'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂' },
  { id: 'ester', ten: 'Ester Thơm', he: 'huuco', gia: 2, ghiChu: 'RCOOH + R′OH ⇌ RCOOR′ + H₂O' },
  { id: 'xa_phong', ten: 'Xà Phòng Hoá', he: 'huuco', gia: 3, ghiChu: '(RCOO)₃C₃H₅ + 3NaOH → 3RCOONa + C₃H₅(OH)₃' },
  { id: 'polymer', ten: 'Chuỗi Polymer', he: 'huuco', gia: 4, ghiChu: 'n CH₂=CH₂ → (–CH₂–CH₂–)ₙ' },
]

const CHI_MUC_QUAN = new Map(DS_QUAN_CO.map((q) => [q.id, q]))

export function quanTheoId(id: string): QuanCo | undefined {
  return CHI_MUC_QUAN.get(id)
}

/** Chỉ số gốc của một quân theo giá — công thức, không phải bảng chép tay. */
export function chiSoGoc(gia: number): { mau: number; cong: number; giap: number } {
  return {
    mau: 380 + gia * 170,
    cong: 32 + gia * 17,
    giap: 8 + gia * 8,
  }
}

/** Nhân theo sao: mỗi sao nhân 1,8 — đúng bậc thang của bản gốc. */
export function heSoSao(sao: number): number {
  return Math.pow(1.8, Math.max(1, Math.min(3, sao)) - 1)
}

export interface QuanTrenBan {
  idQuan: string
  sao: 1 | 2 | 3
}

export interface ChiSoQuan {
  idQuan: string
  ten: string
  he: HeNguyenTo
  sao: 1 | 2 | 3
  mau: number
  cong: number
  giap: number
}

export function dungChiSo(q: QuanTrenBan): ChiSoQuan | null {
  const goc = CHI_MUC_QUAN.get(q.idQuan)
  if (goc === undefined) return null
  const c = chiSoGoc(goc.gia)
  const k = heSoSao(q.sao)
  return {
    idQuan: goc.id, ten: goc.ten, he: goc.he, sao: q.sao,
    mau: Math.round(c.mau * k), cong: Math.round(c.cong * k), giap: c.giap,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BA GHÉP MỘT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ghép hết mức có thể. Ba quân CÙNG id CÙNG sao → một quân sao kế tiếp; lặp
 * lại cho tới khi không ghép được nữa (nên chín quân một sao ra một quân ba
 * sao trong đúng một lần gọi, y như bản gốc).
 */
export function ghepBaThanhMot(kho: readonly QuanTrenBan[]): QuanTrenBan[] {
  let ra = kho.map((q) => ({ ...q }))
  for (let vong = 0; vong < 8; vong++) {
    let daGhep = false
    for (const sao of [1, 2] as const) {
      const dem = new Map<string, number>()
      for (const q of ra) if (q.sao === sao) dem.set(q.idQuan, (dem.get(q.idQuan) ?? 0) + 1)
      for (const [id, n] of dem) {
        if (n < 3) continue
        const soLan = Math.floor(n / 3)
        let phaiBo = soLan * 3
        ra = ra.filter((q) => {
          if (q.sao === sao && q.idQuan === id && phaiBo > 0) { phaiBo -= 1; return false }
          return true
        })
        for (let i = 0; i < soLan; i++) ra.push({ idQuan: id, sao: (sao + 1) as 2 | 3 })
        daGhep = true
      }
    }
    if (!daGhep) break
  }
  return ra
}

// ═══════════════════════════════════════════════════════════════════════════
// VÀNG
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vàng nhận đầu mỗi vòng = nền + LÃI + thưởng chuỗi.
 * `chuoi` dương là chuỗi thắng, âm là chuỗi thua; cả hai đều được thưởng —
 * bản gốc cũng thế, để người đang thua vẫn có đường gỡ.
 */
export function vangDauVong(vangDangCo: number, chuoi: number): number {
  const lai = Math.min(LAI_TOI_DA, Math.floor(Math.max(0, vangDangCo) / 10))
  const d = Math.abs(chuoi)
  const thuongChuoi = d >= 5 ? 3 : d >= 4 ? 2 : d >= 3 ? 1 : 0
  return VANG_NEN_MOI_VONG + lai + thuongChuoi
}

// ═══════════════════════════════════════════════════════════════════════════
// CỬA HÀNG
// ═══════════════════════════════════════════════════════════════════════════

/** Quay năm ô cửa hàng theo tỉ lệ của cấp đội. `ngauNhien` trả về [0, 1). */
export function quayCuaHang(capDoi: number, ngauNhien: () => number): string[] {
  const cap = Math.max(1, Math.min(CAP_TOI_DA_DOI, Math.round(capDoi)))
  const tiLe = TI_LE_CUA_HANG[cap] ?? TI_LE_CUA_HANG[1]!
  const ra: string[] = []
  for (let i = 0; i < SO_O_CUA_HANG; i++) {
    let m = ngauNhien() * 100
    let bac = 1
    for (let b = 0; b < 4; b++) {
      if (m < tiLe[b]!) { bac = b + 1; break }
      m -= tiLe[b]!
      bac = b + 1
    }
    const nhom = DS_QUAN_CO.filter((q) => q.gia === bac)
    const chon = nhom[Math.floor(ngauNhien() * nhom.length)] ?? DS_QUAN_CO[0]!
    ra.push(chon.id)
  }
  return ra
}

/** Cấp đội theo kinh nghiệm đã tích. */
export function capTheoKinhNghiem(kn: number): number {
  let cap = CAP_KHOI_DAU
  let con = kn
  while (cap < CAP_TOI_DA_DOI && con >= (KN_LEN_CAP[cap] ?? Infinity)) {
    con -= KN_LEN_CAP[cap]!
    cap += 1
  }
  return cap
}

// ═══════════════════════════════════════════════════════════════════════════
// ĐÁNH TỰ ĐỘNG
// ═══════════════════════════════════════════════════════════════════════════

export interface DongNhatKy {
  nhip: number
  ben: 'ta' | 'dich'
  tenCong: string
  tenThu: string
  satThuong: number
  /** 'khac' · 'biKhac' · 'thuong' — để màn hình tô màu và nói lý do. */
  loai: string
}

export interface KetQuaGiaoTranh {
  /** 'ta' thắng, 'dich' thắng, hay hoà. */
  ben: 'ta' | 'dich' | 'hoa'
  /** Số quân còn sống của bên thắng — quyết định mất bao nhiêu máu. */
  quanSongSot: number
  nhipDaChay: number
  nhatKy: DongNhatKy[]
}

interface QuanDangDanh extends ChiSoQuan {
  mauConLai: number
}

function batDau(ds: readonly QuanTrenBan[]): QuanDangDanh[] {
  const ra: QuanDangDanh[] = []
  for (const q of ds) {
    const c = dungChiSo(q)
    if (c !== null) ra.push({ ...c, mauConLai: c.mau })
  }
  return ra
}

/** Chỉ số mục tiêu: quân địch CÒN SỐNG có máu thấp nhất; hoà thì lấy đứng trước. */
function chonMucTieu(dich: readonly QuanDangDanh[]): number {
  let iTot = -1
  for (let i = 0; i < dich.length; i++) {
    if (dich[i]!.mauConLai <= 0) continue
    if (iTot < 0 || dich[i]!.mauConLai < dich[iTot]!.mauConLai) iTot = i
  }
  return iTot
}

/** Sát thương một đòn. Giáp giảm theo công thức `100 / (100 + giáp)`. */
export function satThuongMotDon(cong: number, giap: number, heSo: number): number {
  return Math.max(1, Math.round(cong * heSo * (100 / (100 + Math.max(0, giap)))))
}

/**
 * ĐÁNH TỰ ĐỘNG tới khi một bên hết quân.
 *
 * Mỗi NHỊP: quân bên ta đánh trước theo thứ tự đứng, rồi tới quân bên địch —
 * quân đã chết trong nhịp ấy không đánh trả. Thứ tự cố định nên KẾT QUẢ LÀ TẤT
 * ĐỊNH: cùng hai đội hình thì máy nào chạy cũng ra một kết quả, không cần máy
 * chủ phân xử.
 */
export function giaoTranh(
  doiTa: readonly QuanTrenBan[],
  doiDich: readonly QuanTrenBan[],
  ghiNhatKy = true,
): KetQuaGiaoTranh {
  const ta = batDau(doiTa)
  const dich = batDau(doiDich)
  const nhatKy: DongNhatKy[] = []
  const song = (ds: readonly QuanDangDanh[]) => ds.filter((q) => q.mauConLai > 0).length

  let nhip = 0
  for (; nhip < NHIP_TOI_DA; nhip++) {
    if (song(ta) === 0 || song(dich) === 0) break
    for (const ben of ['ta', 'dich'] as const) {
      const cong = ben === 'ta' ? ta : dich
      const thu = ben === 'ta' ? dich : ta
      for (const q of cong) {
        if (q.mauConLai <= 0) continue
        const i = chonMucTieu(thu)
        if (i < 0) break
        const m = thu[i]!
        const tk = tinhHeSoTuongKhac(q.he, m.he)
        const st = satThuongMotDon(q.cong, m.giap, tk.heSo)
        m.mauConLai -= st
        if (ghiNhatKy && nhatKy.length < 400) {
          nhatKy.push({ nhip, ben, tenCong: q.ten, tenThu: m.ten, satThuong: st, loai: tk.loai })
        }
      }
    }
  }

  const sTa = song(ta)
  const sDich = song(dich)
  if (sTa > 0 && sDich === 0) return { ben: 'ta', quanSongSot: sTa, nhipDaChay: nhip, nhatKy }
  if (sDich > 0 && sTa === 0) return { ben: 'dich', quanSongSot: sDich, nhipDaChay: nhip, nhatKy }
  if (sTa === 0 && sDich === 0) return { ben: 'hoa', quanSongSot: 0, nhipDaChay: nhip, nhatKy }
  // Hết nhịp mà hai bên còn quân: xử theo PHẦN TRĂM máu còn lại của cả đội.
  const ty = (ds: readonly QuanDangDanh[]) => {
    const tong = ds.reduce((s, q) => s + q.mau, 0)
    const con = ds.reduce((s, q) => s + Math.max(0, q.mauConLai), 0)
    return tong === 0 ? 0 : con / tong
  }
  const tTa = ty(ta)
  const tDich = ty(dich)
  if (Math.abs(tTa - tDich) < 1e-9) return { ben: 'hoa', quanSongSot: 0, nhipDaChay: nhip, nhatKy }
  return tTa > tDich
    ? { ben: 'ta', quanSongSot: sTa, nhipDaChay: nhip, nhatKy }
    : { ben: 'dich', quanSongSot: sDich, nhipDaChay: nhip, nhatKy }
}

/**
 * MÁU MẤT khi thua: nền theo chặng + 2 máu mỗi quân địch còn sống.
 * Vòng càng sâu càng đau — bản gốc cũng vậy, để ván không kéo dài vô tận.
 */
export function mauMatKhiThua(vong: number, quanDichSongSot: number): number {
  const nen = 2 + Math.floor(Math.max(1, vong) / 3)
  return nen + quanDichSongSot * 2
}

// ═══════════════════════════════════════════════════════════════════════════
// PHÒNG ĐẤU
// ═══════════════════════════════════════════════════════════════════════════

export interface NguoiTrongPhong {
  /** Số báo danh — KHÓA DUY NHẤT trong phòng. Không có tên, không có lớp. */
  sbd: string
  /** Biệt danh hiện ra cho bạn cùng phòng: tên thần thú, KHÔNG phải tên em. */
  biDanh: string
  he: HeNguyenTo
  mau: number
  vang: number
  kinhNghiem: number
  /** Chuỗi thắng (dương) hoặc chuỗi thua (âm). */
  chuoi: number
  kho: QuanTrenBan[]
  /** Máy chơi thay khi ghế trống hoặc em rớt mạng. */
  laMay: boolean
  /** Vòng bị loại; 0 nghĩa là còn sống. */
  vongBiLoai: number
}

export interface PhongDau {
  ma: string
  vong: number
  nguoi: NguoiTrongPhong[]
  /** Thứ tự bị loại, sớm nhất đứng đầu. Hạng = đảo ngược danh sách này. */
  daLoai: string[]
  ketThuc: boolean
}

/** Đội hình ra trận: `capTheoKinhNghiem` quân mạnh nhất trong kho. */
export function doiHinhRaTran(n: NguoiTrongPhong): QuanTrenBan[] {
  const suc = (q: QuanTrenBan) => {
    const c = dungChiSo(q)
    return c === null ? 0 : c.mau + c.cong * 10
  }
  return [...n.kho].sort((a, b) => suc(b) - suc(a)).slice(0, capTheoKinhNghiem(n.kinhNghiem))
}

/**
 * GHÉP CẶP một vòng: xáo danh sách người còn sống rồi bắt cặp.
 *
 * Lẻ người thì người cuối đánh với BÓNG — bản sao đội hình của người vừa bị
 * loại gần nhất, hoặc của người đứng đầu nếu chưa ai bị loại. Bản gốc cũng
 * dùng bóng đúng như vậy; đánh với không khí thì vòng ấy thành vòng chùa.
 */
export function ghepCap(
  phong: PhongDau,
  ngauNhien: () => number,
): { a: string; b: string; bong: boolean }[] {
  const song = phong.nguoi.filter((n) => n.vongBiLoai === 0).map((n) => n.sbd)
  const xao = [...song]
  for (let i = xao.length - 1; i > 0; i--) {
    const j = Math.floor(ngauNhien() * (i + 1))
    const t = xao[i]!
    xao[i] = xao[j]!
    xao[j] = t
  }
  const cap: { a: string; b: string; bong: boolean }[] = []
  for (let i = 0; i + 1 < xao.length; i += 2) cap.push({ a: xao[i]!, b: xao[i + 1]!, bong: false })
  if (xao.length % 2 === 1) {
    const le = xao[xao.length - 1]!
    const bongSbd = phong.daLoai.length > 0
      ? phong.daLoai[phong.daLoai.length - 1]!
      : (song.find((s) => s !== le) ?? le)
    cap.push({ a: le, b: bongSbd, bong: true })
  }
  return cap
}

export interface KetQuaVong {
  vong: number
  tran: {
    a: string
    b: string
    bong: boolean
    thang: string | null
    quanSongSot: number
    mauMat: number
  }[]
  /** Ai bị loại ở vòng này. */
  biLoai: string[]
}

/**
 * CHẠY MỘT VÒNG: ghép cặp → đánh → trừ máu → cập nhật chuỗi → loại người hết
 * máu → phát vàng cho vòng sau.
 *
 * Hàm này SỬA TẠI CHỖ đối tượng `phong` được đưa vào (màn hình giữ một bản
 * `structuredClone` nếu cần bản cũ). Trả về biên bản để màn hình kể lại.
 */
export function chayMotVong(phong: PhongDau, ngauNhien: () => number): KetQuaVong {
  const tim = (sbd: string) => phong.nguoi.find((n) => n.sbd === sbd)
  const bienBan: KetQuaVong = { vong: phong.vong, tran: [], biLoai: [] }
  if (phong.ketThuc) return bienBan

  for (const c of ghepCap(phong, ngauNhien)) {
    const A = tim(c.a)
    const B = tim(c.b)
    if (A === undefined || B === undefined) continue
    const kq = giaoTranh(doiHinhRaTran(A), doiHinhRaTran(B), false)
    let thang: string | null = null
    let mauMat = 0
    if (kq.ben === 'ta') {
      thang = A.sbd
      mauMat = mauMatKhiThua(phong.vong, kq.quanSongSot)
      // Đánh với BÓNG thì bóng không mất máu — người đã bị loại rồi.
      if (!c.bong) { B.mau -= mauMat; B.chuoi = Math.min(-1, B.chuoi - 1) }
      A.chuoi = Math.max(1, A.chuoi + 1)
    } else if (kq.ben === 'dich') {
      thang = B.sbd
      mauMat = mauMatKhiThua(phong.vong, kq.quanSongSot)
      A.mau -= mauMat
      A.chuoi = Math.min(-1, A.chuoi - 1)
      if (!c.bong) B.chuoi = Math.max(1, B.chuoi + 1)
    } else {
      // HOÀ: cả hai mất một nửa máu nền, chuỗi về 0.
      mauMat = Math.max(1, Math.floor(mauMatKhiThua(phong.vong, 0) / 2))
      A.mau -= mauMat
      A.chuoi = 0
      if (!c.bong) { B.mau -= mauMat; B.chuoi = 0 }
    }
    bienBan.tran.push({ a: c.a, b: c.b, bong: c.bong, thang, quanSongSot: kq.quanSongSot, mauMat })
  }

  // LOẠI người hết máu. Cùng vòng nhiều người chết thì người ít máu âm hơn
  // đứng hạng cao hơn — không bốc thăm, không bịa.
  const chet = phong.nguoi
    .filter((n) => n.vongBiLoai === 0 && n.mau <= 0)
    .sort((x, y) => x.mau - y.mau)
  for (const n of chet) {
    n.mau = 0
    n.vongBiLoai = phong.vong
    phong.daLoai.push(n.sbd)
    bienBan.biLoai.push(n.sbd)
  }

  const conSong = phong.nguoi.filter((n) => n.vongBiLoai === 0)
  if (conSong.length <= 1) {
    phong.ketThuc = true
    if (conSong.length === 1) phong.daLoai.push(conSong[0]!.sbd)
  } else {
    phong.vong += 1
    for (const n of conSong) n.vang += vangDauVong(n.vang, n.chuoi)
  }
  return bienBan
}

/** Bảng hạng: hạng 1 là người trụ lâu nhất. */
export function bangHang(phong: PhongDau): { hang: number; sbd: string }[] {
  return [...phong.daLoai].reverse().map((sbd, i) => ({ hang: i + 1, sbd }))
}

// ═══════════════════════════════════════════════════════════════════════════
// MÁY CHƠI THAY — lấp ghế trống, và gánh khi em rớt mạng.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Máy tiêu vàng theo một luật đơn giản và CÔNG KHAI: mua quân đắt nhất trong
 * cửa hàng còn đủ tiền, giữ lại 10 vàng để ăn lãi, cứ ba vòng thì mua một lần
 * kinh nghiệm. Không có quân nào chỉ máy mới có — máy không ăn gian.
 */
export function mayChoiMotVong(n: NguoiTrongPhong, ngauNhien: () => number): void {
  if (n.vongBiLoai !== 0) return
  if (n.vang >= GIA_MUA_KINH_NGHIEM + 10 && ngauNhien() < 0.34) {
    n.vang -= GIA_MUA_KINH_NGHIEM
    n.kinhNghiem += KN_MOI_LAN_MUA
  }
  const oHang = quayCuaHang(capTheoKinhNghiem(n.kinhNghiem), ngauNhien)
  const theoGiaGiam = oHang
    .map((id) => CHI_MUC_QUAN.get(id))
    .filter((q): q is QuanCo => q !== undefined)
    .sort((a, b) => b.gia - a.gia)
  for (const q of theoGiaGiam) {
    if (n.vang - q.gia < 10 && ngauNhien() < 0.7) continue
    if (n.vang < q.gia) continue
    n.vang -= q.gia
    n.kho.push({ idQuan: q.id, sao: 1 })
  }
  n.kho = ghepBaThanhMot(n.kho)
}

/** Tạo một đối thủ máy — biệt danh lấy theo hệ, không mượn tên em nào. */
export function dungNguoiMay(soThuTu: number, he: HeNguyenTo): NguoiTrongPhong {
  return {
    sbd: `MAY${soThuTu}`,
    biDanh: `Luyện Hồn ${TEN_HE_NGAN[he]} ${soThuTu}`,
    he,
    mau: MAU_KHOI_DAU,
    vang: VANG_KHOI_DAU,
    kinhNghiem: 0,
    chuoi: 0,
    kho: [],
    laMay: true,
    vongBiLoai: 0,
  }
}

/** Lấp cho đủ sáu ghế bằng máy — phòng hai người vẫn chơi được ngay. */
export function lapGheTrong(phong: PhongDau): void {
  let i = 1
  while (phong.nguoi.length < SO_NGUOI_TOI_DA) {
    const he = DS_HE[(phong.nguoi.length + i) % DS_HE.length]!
    phong.nguoi.push(dungNguoiMay(i, he))
    i += 1
  }
}

/** Bộ sinh số giả ngẫu nhiên TẤT ĐỊNH (mulberry32) — cùng hạt, cùng ván. */
export function boSinhSo(hat: number): () => number {
  let a = hat >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hạt giống của một phòng: từ mã phòng, để mọi máy quay ra cùng một ván. */
export function hatTuMaPhong(ma: string, vong: number): number {
  let h = 2166136261
  const s = `${ma}#${vong}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// ═══════════════════════════════════════════════════════════════════════════
// CHẠY LẠI CẢ VÁN TỪ SỔ NỘP CỦA MÁY CHỦ.
//
// Đây là chỗ nối phần thuần này với phòng đấu thật. Máy chủ chỉ cất ĐỘI HÌNH
// từng người nộp cho từng vòng; hàm dưới đây chạy lại cả ván từ vòng 1 nên mọi
// máy ra cùng một kết quả, không cần máy chủ phân xử và không có bản luật thứ
// hai nằm trên Worker.
//
// MÁU KHÔNG LẤY TỪ MÁY EM. Máu là do chạy trận mà ra; nhận máu máy em gửi lên
// nghĩa là ai sửa được gói tin thì bất tử. Cũng vì thế đội hình nộp lên bị cắt
// còn `CAP_TOI_DA_DOI` quân — nộp hai mươi quân cũng chỉ ra trận được sáu.
// ═══════════════════════════════════════════════════════════════════════════

export interface NopMotVong {
  doiHinh: QuanTrenBan[]
  vang: number
  kinhNghiem: number
}

export interface GheNguoiThat {
  /** Chỗ ngồi do máy chủ đánh số — KHÔNG phải số báo danh. */
  khoa: string
  biDanh: string
  he: HeNguyenTo
  /** Sổ nộp theo vòng, khoá là số vòng ở dạng chuỗi. */
  nop: Record<string, NopMotVong>
}

export interface VanDaChay {
  phong: PhongDau
  bienBan: KetQuaVong[]
}

/** Lọc một đội hình nộp lên về mức chơi được: quân có thật, tối đa số ô cho phép. */
export function locDoiHinhNop(ds: readonly QuanTrenBan[]): QuanTrenBan[] {
  return ds
    .filter((q) => CHI_MUC_QUAN.has(q.idQuan))
    .slice(0, CAP_TOI_DA_DOI)
    .map((q) => ({ idQuan: q.idQuan, sao: (Math.max(1, Math.min(3, q.sao)) as 1 | 2 | 3) }))
}

/**
 * Chạy lại ván tới hết vòng `denVong`.
 *
 * Người không nộp vòng nào thì GIỮ NGUYÊN đội hình vòng trước — em rớt mạng
 * giữa ván thì đội hình cũ vẫn đánh tiếp, y như bản gốc, chứ không bị xử thua
 * trắng vì mất sóng.
 */
export function chayVanTheoNop(
  ma: string,
  ghe: readonly GheNguoiThat[],
  denVong: number,
): VanDaChay {
  const nguoi: NguoiTrongPhong[] = ghe.map((g) => ({
    sbd: g.khoa,
    biDanh: g.biDanh,
    he: g.he,
    mau: MAU_KHOI_DAU,
    vang: VANG_KHOI_DAU,
    kinhNghiem: 0,
    chuoi: 0,
    kho: [],
    laMay: false,
    vongBiLoai: 0,
  }))
  const phong: PhongDau = { ma, vong: 1, nguoi, daLoai: [], ketThuc: false }
  lapGheTrong(phong)

  const bienBan: KetQuaVong[] = []
  for (let v = 1; v <= Math.max(0, denVong); v++) {
    if (phong.ketThuc) break
    const r = boSinhSo(hatTuMaPhong(ma, v))
    for (const n of phong.nguoi) {
      if (n.vongBiLoai !== 0) continue
      if (n.laMay) { mayChoiMotVong(n, r); continue }
      const g = ghe.find((x) => x.khoa === n.sbd)
      const nop = g?.nop[String(v)]
      if (nop !== undefined) {
        n.kho = locDoiHinhNop(nop.doiHinh)
        n.vang = Math.max(0, Math.round(nop.vang))
        n.kinhNghiem = Math.max(0, Math.round(nop.kinhNghiem))
      }
      // Không nộp: giữ nguyên `n.kho` của vòng trước.
    }
    bienBan.push(chayMotVong(phong, r))
  }
  return { phong, bienBan }
}

/**
 * Vòng nào MỌI người còn sống đều đã nộp — tức là vòng chạy được ngay.
 * Trả 0 nghĩa là còn phải đợi.
 */
export function vongChayDuoc(ghe: readonly GheNguoiThat[], vongHienTai: number): number {
  for (let v = vongHienTai; v >= 1; v--) {
    if (ghe.length > 0 && ghe.every((g) => g.nop[String(v)] !== undefined)) return v
  }
  return 0
}
