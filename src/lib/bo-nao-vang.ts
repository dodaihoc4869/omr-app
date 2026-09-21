// BỘ NÃO — LỜI MỜI QUAY LẠI CHO EM VẮNG 2–4 NGÀY DO THUẬT TOÁN SOẠN (Code 1, 21/09/2026; Boss sau lượt chạy thật: token trợ lý con ≈ 1,62 triệu, quá đích ~5 lần).
// Em vắng 2–4 ngày chỉ cần MỘT lời mời quay lại bằng một chặng ngắn — không cần trợ lý AI. Tệp này soạn lời từ 8 MẪU luân phiên có SỐ THẬT lấy đúng từ thẻ; `lay.mjs` ghi vào `tu-dong/vang.json`
// (AI KHÔNG đọc) và `nop.mjs` nộp cùng kết quả của AI (AI có phần tử cho em nào thì phần tử AI thắng). Chỉ vắng ≥ 5 ngày mới vào `vao/vang-*.json` cho AI.
// THUẦN, không import (mã lệnh nạp trực tiếp bằng Node). Mọi lời soạn ra PHẢI qua `kiemKhuon` (test khoá).

export const VANG_TU_DONG_TU = 2
export const VANG_TU_DONG_DEN = 4

type Obj = Record<string, unknown>
const laDoiTuong = (x: unknown): x is Obj => x !== null && typeof x === 'object' && !Array.isArray(x)
const soDuong = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : null)

/** Một mẫu: `dung(the)` cho biết mẫu có dùng được không (đủ số thật); `viet(the)` ghép chữ. Không có tên em; xưng "mình", gọi "em". */
interface Mau {
  ma: string
  dung: (n: number, lam7: number | null, dung7: number | null) => boolean
  viet: (n: number, lam7: number | null, dung7: number | null) => string
}

/** 8 mẫu luân phiên. Số dùng: số ngày vắng (`soNgayVang`), số câu làm 7 ngày (`cau.lam7`), số câu đúng 7 ngày (`cau.dung7`) — đều có trong thẻ. Số chỉ số ngày/câu THẬT; không nhắc điểm, không so sánh, không doạ. */
export const CAC_MAU_MOI_VANG: readonly Mau[] = [
  { ma: 'm1', dung: () => true, viet: (n) => `Em ơi, mình chưa gặp em ${n} ngày rồi. Quay lại bằng một chặng ngắn thôi nhé, mình đã xếp sẵn cho em.` },
  { ma: 'm2', dung: () => true, viet: (n) => `Mấy hôm nay vắng em ${n} ngày, mình nhớ em đó. Chỉ cần mở app làm một chặng ngắn là đủ, không cần làm bù.` },
  { ma: 'm3', dung: () => true, viet: (n) => `Em nghỉ ${n} ngày rồi, không sao cả. Hôm nay mình bớt câu lại, em thử một chặng nhỏ để lấy lại đà nhé.` },
  { ma: 'm4', dung: (_n, l) => l !== null, viet: (_n, l) => `Tuần trước em đã làm ${l} câu, giờ chỉ cần một chặng ngắn để nối lại nhịp. Mình chờ em nhé.` },
  { ma: 'm5', dung: () => true, viet: (n) => `Đã ${n} ngày em chưa vào học. Mình chuẩn bị sẵn chặng ngắn nhất cho em, mở app là làm được ngay.` },
  { ma: 'm6', dung: (_n, _l, d) => d !== null, viet: (_n, _l, d) => `Trước khi nghỉ em đã đúng ${d} câu, vốn ấy vẫn còn đó. Quay lại với một chặng ngắn nhé em.` },
  { ma: 'm7', dung: () => true, viet: (n) => `Vắng em ${n} ngày, mình không giao thêm việc mới. Em chỉ cần làm một chặng ngắn cho quen tay lại thôi.` },
  { ma: 'm8', dung: () => true, viet: (n) => `Em ơi, ${n} ngày rồi mình chưa thấy em. Một chặng ngắn thôi cũng được, mình ở đây chờ em.` },
]

/** Băm chuỗi (FNV-1a 32 bit) — tất định, không phụ thuộc thư viện. */
function bam(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

const dauLoi = (s: unknown): string => Array.from(String(s ?? '')).slice(0, 24).join('')

/** Em có thuộc diện lời mời TỰ ĐỘNG không: vắng đủ 2–4 ngày (thẻ `hoatDong.soNgayVang`). */
export function laVangTuDong(the: unknown): boolean {
  const n = laDoiTuong(the) && laDoiTuong(the.hoatDong) ? the.hoatDong.soNgayVang : null
  return typeof n === 'number' && n >= VANG_TU_DONG_TU && n <= VANG_TU_DONG_DEN
}

/**
 * SOẠN phần tử đầu ra (đúng KHUÔN `DauRaEm`) cho em vắng 2–4 ngày: một chặng ngắn (nhịp −2, khởi động 3), lời mời từ MẪU luân phiên theo băm `biDanh|ngay`, bỏ mẫu trùng phần đầu của
 * ≤ 3 lời gần nhất (`the.loiNhanGanDay`) để không lặp cách mở đầu. Không thuộc diện (vắng < 2 hoặc > 4 ngày, thẻ sai) ⇒ `null`.
 * `doTinCay` 0,7 (luật rõ, bằng chứng là số ngày vắng) ⇒ ở chế độ thật được áp dụng.
 */
export function soanLoiMoiVang(the: unknown, biDanh: string, ngay: string): Obj | null {
  if (!laVangTuDong(the) || typeof biDanh !== 'string' || biDanh === '') return null
  const t = the as Obj
  const n = (t.hoatDong as Obj).soNgayVang as number
  const cau = laDoiTuong(t.cau) ? t.cau : {}
  const lam7 = soDuong(cau.lam7)
  const dung7 = soDuong(cau.dung7)
  const dungDuoc = CAC_MAU_MOI_VANG.filter((m) => m.dung(n, lam7, dung7))
  const gan = (Array.isArray(t.loiNhanGanDay) ? (t.loiNhanGanDay as unknown[]) : []).map(dauLoi).filter(Boolean)
  const khongLap = dungDuoc.filter((m) => !gan.includes(dauLoi(m.viet(n, lam7, dung7))))
  const kho = khongLap.length > 0 ? khongLap : dungDuoc
  const mau = kho[bam(`${biDanh}|${ngay}`) % kho.length]
  return {
    biDanh,
    doTinCay: 0.7,
    nhip: { lech: -2, khoiDong: 3 },
    dang: [],
    khacPhuc: [],
    co: 'khong',
    loiNhanChoEm: mau.viet(n, lam7, dung7),
    loiNhanChoPhuHuynh: '',
    thuTuan: '',
    goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' },
    ghiChuHlv: 'Lời mời quay lại soạn tự động theo số ngày vắng, không qua trợ lý AI',
    canSau: false,
  }
}
