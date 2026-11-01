// BONG BÓNG LỜI TRÊN ĐẦU MOL (Lộ trình) — HÌNH HỌC THUẦN, test ở tests/bong-bong-gon-0111.test.tsx.
// Thầy 01/11 23h (ảnh thật «Đủ rồi! Vào học ngay!» rộng gấp đôi chữ): «Viền bong bóng phải gọn vừa với chữ nhé» ⇒ bong bóng CO THEO CHỮ: bề rộng = dòng
// dài nhất + đệm (câu ngắn ôm sát; câu dài xuống dòng cân bằng trong bề rộng tối đa), rồi đặt lại vị trí + đuôi theo bề rộng thật.
export const RONG_TOI_DA = 280
export const RONG_TOI_THIEU = 130
/** Cách mép đường đi tối thiểu (px). */
export const MEP = 8
/** Đuôi lệch trái khỏi tâm Mol (px) — tránh nút bấc / lửa trên cổ bình. */
export const LECH_DUOI = 20
/** Đuôi cách mép bong bóng tối thiểu (px). */
export const DUOI_BIEN = 18

type Ngang = { left: number; right: number }

/** Bề rộng ôm chữ: từ mép trái nhất tới mép phải nhất của các dòng chữ (Range.getClientRects) + đệm + viền hai bên. Không đo được ⇒ null. */
export function rongOmChu(dong: readonly Ngang[], dem: number): number | null {
  const ds = dong.filter((d) => d.right > d.left)
  if (!ds.length) return null
  return Math.ceil(Math.max(...ds.map((d) => d.right)) - Math.min(...ds.map((d) => d.left)) + dem)
}

/**
 * Vị trí bong bóng bề rộng `w` trên đầu Mol (tâm ngang `tam`) trong khoảng `duong` (đường đi): căn giữa trên Mol rồi kẹp không tràn mép.
 * Trả `trai` = mép trái bong bóng so với tâm Mol (`--trai`), `duoi` = chỗ đuôi tính từ mép trái bong bóng (`--duoi`), chỉ đúng đầu Mol (lệch trái LECH_DUOI).
 */
export function viTriBong(duong: Ngang, tam: number, w: number): { trai: number; duoi: number } {
  const x = Math.min(Math.max(tam - w / 2, duong.left + MEP), duong.right - MEP - w)
  const trai = Math.round(x - tam)
  return { trai, duoi: Math.round(Math.min(Math.max(-trai - LECH_DUOI, DUOI_BIEN), w - DUOI_BIEN)) }
}

// ───────────────────────────── CHỖ ĐẶT BONG BÓNG — KHÔNG BAO GIỜ ĐÈ NÚT ─────────────────────────────
// Thầy 02/11 (ảnh thật nền tối: bong bóng «Hôm nay có Kiểm tra ôn tập…» đè nút KIỂM TRA ÔN TẬP ngay trên Mol): luật né cũ chỉ thử nâng lên / thu hẹp,
// hết cách thì GIỮ CHỖ MẶC ĐỊNH (vẫn đè). Nay thử lần lượt theo khung thật của mọi nút / vòng / nhãn / rương trên đường đi:
//   1) trên đầu Mol  2) nâng lên trên các nút  3) thu hẹp về phía trống  4) DƯỚI Mol (đuôi hướng lên)  5) CẠNH Mol (đuôi chỉ ngang)
//   6) không chỗ nào trống ⇒ THU THÀNH NÚT NHỎ cạnh Mol (chạm để đọc). Chỗ nào cũng phải nằm trong khung đường đi.

export type Hop = { left: number; top: number; right: number; bottom: number }
/** Khe tối thiểu giữa bong bóng (hoặc nút nhỏ) và mọi nút / vòng / nhãn (px). */
export const KHE = 6
/** Chỗ đuôi bong bóng (margin 9 px của `.bi-loi-bong`, trong-hs.css). */
export const DUOI = 9
/** Bong bóng TRÊN đầu Mol: mép dưới hộp cách chỗ neo (tâm Mol) — CSS `bottom: calc(54px | 70px + var(--nang))`. */
export const CACH_TREN = 54
export const CACH_TREN_TO = 70
/** Nút nhỏ «Mol nhắn» khi không còn chỗ trống (px). */
export const CHIP = 40

export type KieuCho = 'tren' | 'duoi' | 'canh'
export interface ChoBong {
  cho: KieuCho
  /** bề rộng tối đa (--rong) · bề rộng ôm chữ · chiều cao bong bóng */
  rong: number; w: number; h: number
  /** --trai (mép trái so với chỗ neo) · --duoi (chỗ đuôi tính từ mép trái) · --nang (nâng thêm, chỉ «trên») · --tren (mép trên hộp so với chỗ neo, «dưới» / «cạnh») */
  trai: number; duoi: number; nang: number; tren: number
  /** «cạnh»: bong bóng nằm BÊN TRÁI Mol (đuôi chỉ sang phải) */
  benTrai?: boolean
  hop: Hop
}
export interface KetChoBong {
  /** null ⇒ không chỗ nào trống: thu thành nút nhỏ (`chip`); `bong` = chỗ ít đè nhất — chỉ dùng khi em CHỦ ĐỘNG chạm để đọc. */
  cho: KieuCho | null
  bong: ChoBong
  chip?: { trai: number; tren: number }
}
export interface VaoChoBong {
  /** khung đường đi (`.da-duong`) */
  duong: Hop
  /** chỗ neo bong bóng (tâm Mol, `.da-lv-loi-o`) */
  neo: { x: number; y: number }
  /** khung Mol (`.da-linh-vat`) */
  mol: Hop
  /** khung thật mọi nút / vòng tiến độ / nhãn / rương trên đường đi */
  vat: readonly Hop[]
  /** Mol to (cấp 4–5) */
  to?: boolean
  /** cỡ bong bóng khi cho bề rộng tối đa `rong` (đo thật: ôm chữ, xuống dòng) */
  kho: (rong: number) => { w: number; h: number }
}

export const giaoHop = (a: Hop, b: Hop, khe = KHE): boolean => a.left < b.right + khe && a.right > b.left - khe && a.top < b.bottom + khe && a.bottom > b.top - khe
const dienTichGiao = (a: Hop, b: Hop) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))

/** Chọn chỗ bong bóng: chỗ ĐẦU TIÊN (theo thứ tự ưu tiên) không chạm vật nào và nằm trong khung đường đi; hết chỗ ⇒ `cho: null` + nút nhỏ. */
export function chonChoBong(v: VaoChoBong): KetChoBong {
  const { duong, neo, mol, vat } = v
  const coKhung = duong.bottom > duong.top && duong.right > duong.left // jsdom / chưa dàn trang ⇒ không đo được: giữ chỗ trên đầu Mol
  const cham = (h: Hop) => vat.filter((n) => giaoHop(h, n))
  const trongKhung = (h: Hop) => !coKhung || (h.top >= duong.top && h.bottom <= duong.bottom && h.left >= duong.left && h.right <= duong.right)
  const tot = (c: ChoBong): boolean => trongKhung(c.hop) && !cham(c.hop).length
  const rong0 = Math.round(Math.max(150, Math.min(RONG_TOI_DA, duong.right - duong.left - 16)))
  const daThu: ChoBong[] = []
  const ghi = (c: ChoBong) => { daThu.push(c); return c }
  const ngangDung = (cho: 'tren' | 'duoi', rong: number, nang: number, ngang: Ngang): ChoBong => {
    const { w, h } = v.kho(rong), { trai, duoi } = viTriBong(ngang, neo.x, w), left = neo.x + trai
    if (cho === 'tren') { const bottom = neo.y - (v.to ? CACH_TREN_TO : CACH_TREN) - nang - DUOI; return { cho, rong, w, h, trai, duoi, nang, tren: 0, hop: { left, right: left + w, top: bottom - h, bottom } } }
    const tren = Math.round(mol.bottom > mol.top ? mol.bottom - neo.y + 2 : 50), top = neo.y + tren + DUOI // «dưới»: đuôi chạm ngay dưới bóng Mol
    return { cho, rong, w, h, trai, duoi, nang: 0, tren, hop: { left, right: left + w, top, bottom: top + h } }
  }
  const phai = neo.x > (duong.left + duong.right) / 2 // Mol bên phải đường ⇒ phía trống là mép phải
  // thu hẹp về phía trống: mép trong sát sau các vật đang chạm, ≥ RONG_TOI_THIEU
  const hep = (c: ChoBong): { rong: number; ngang: Ngang } | null => {
    const g = cham(c.hop)
    if (!g.length) return null
    const mep = phai ? Math.max(...g.map((n) => n.right)) + KHE : Math.min(...g.map((n) => n.left)) - KHE
    const rong = Math.round(phai ? duong.right - MEP - mep : mep - (duong.left + MEP))
    return rong >= RONG_TOI_THIEU ? { rong, ngang: phai ? { left: mep - MEP, right: duong.right } : { left: duong.left, right: mep + MEP } } : null
  }
  // 1) trên đầu Mol
  const t0 = ghi(ngangDung('tren', rong0, 0, duong))
  if (tot(t0)) return { cho: 'tren', bong: t0 }
  // 2) nâng lên trên các vật đang chạm (tối đa 3 bậc: nhãn trên nút…), không vượt mép trên đường đi
  let c = t0
  for (let i = 0; i < 3; i++) {
    const g = cham(c.hop)
    if (!g.length) break
    c = ghi(ngangDung('tren', rong0, c.nang + Math.ceil(c.hop.bottom - (Math.min(...g.map((n) => n.top)) - KHE)), duong))
    if (coKhung && c.hop.top < duong.top) break
    if (tot(c)) return { cho: 'tren', bong: c }
  }
  // 3) thu hẹp về phía trống (trên đầu Mol)
  const h1 = hep(t0)
  if (h1) { const c1 = ghi(ngangDung('tren', h1.rong, 0, h1.ngang)); if (tot(c1)) return { cho: 'tren', bong: c1 } }
  // 4) dưới Mol, rồi dưới Mol thu hẹp
  const d0 = ghi(ngangDung('duoi', rong0, 0, duong))
  if (tot(d0)) return { cho: 'duoi', bong: d0 }
  const h2 = hep(d0)
  if (h2) { const c2 = ghi(ngangDung('duoi', h2.rong, 0, h2.ngang)); if (tot(c2)) return { cho: 'duoi', bong: c2 } }
  // 5) cạnh Mol: phía ngoài trước, rồi phía trong
  for (const benTrai of phai ? [false, true] : [true, false]) {
    const rong = Math.round(Math.min(RONG_TOI_DA, benTrai ? mol.left - DUOI - (duong.left + MEP) : duong.right - MEP - (mol.right + DUOI)))
    if (rong < RONG_TOI_THIEU) continue
    const { w, h } = v.kho(rong), left = benTrai ? mol.left - DUOI - w : mol.right + DUOI, top = Math.round(mol.top + (mol.bottom - mol.top) * 0.4 - h / 2)
    const c3 = ghi({ cho: 'canh', rong, w, h, trai: Math.round(left - neo.x), duoi: 0, nang: 0, tren: Math.round(top - neo.y), benTrai, hop: { left, right: left + w, top, bottom: top + h } })
    if (tot(c3)) return { cho: 'canh', bong: c3 }
  }
  // 6) hết chỗ ⇒ nút nhỏ cạnh Mol: góc trên phía ngoài · trên đầu · góc trên phía trong; không góc nào trống ⇒ đặt trên mình Mol (Mol đứng cạnh đường, không đè nút)
  const oChip = (left: number, top: number): Hop => ({ left, top, right: left + CHIP, bottom: top + CHIP })
  const chip = [
    oChip(phai ? mol.right - CHIP + 6 : mol.left - 6, mol.top - CHIP / 2),
    oChip(neo.x - CHIP / 2, mol.top - CHIP - 4),
    oChip(phai ? mol.left - 6 : mol.right - CHIP + 6, mol.top - CHIP / 2),
  ].find((h) => trongKhung(h) && !cham(h).length) ?? oChip(phai ? neo.x + 2 : neo.x - CHIP - 2, mol.top + 2)
  // em chạm để đọc ⇒ chỗ ít đè nhất (bằng nhau ⇒ chỗ ưu tiên trước)
  const de = (x: ChoBong) => vat.reduce((s, n) => s + dienTichGiao(x.hop, n), 0) + (trongKhung(x.hop) ? 0 : 1e6)
  const bong = daThu.reduce((a, b) => (de(b) < de(a) ? b : a))
  return { cho: null, bong, chip: { trai: Math.round(chip.left - neo.x), tren: Math.round(chip.top - neo.y) } }
}
