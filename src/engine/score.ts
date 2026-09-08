// CHẤM ĐIỂM — thang 10 giữ nguyên TỈ LỆ ba phần của đề chuẩn, số câu tuỳ ca.
//
// ============================================================================
// VÌ SAO PHẢI ĐỔI — thầy báo 07/09, ca 248567
// ============================================================================
// Bản cũ chốt cứng "mỗi câu 0,25 điểm" và "câu đúng–sai tối đa 1,0 điểm", lấy
// thẳng từ đề chuẩn 18/4/6. Số cố định đó chỉ đúng khi ca có đúng 18/4/6 câu.
//
// Ca 248567 thầy rút 8 câu Phần I, 2 câu Phần II, 2 câu Phần III. Trần điểm
// thành 8×0,25 + 2×1,0 + 2×0,25 = **4,50**, không phải 10. Em làm tốt nhất ca
// đó được 3,5/4,5 mà bảng điểm ghi 3,5/10 — sai với chính em và sai với phụ
// huynh đọc phiếu.
//
// ============================================================================
// LUẬT MỚI: KHOÁ TỈ LỆ, KHÔNG KHOÁ SỐ ĐIỂM MỖI CÂU
// ============================================================================
// Đề chuẩn của Bộ chia 10 điểm thành ba phần:
//
//     Phần I  18 câu → 4,50   (45%)
//     Phần II  4 câu → 4,00   (40%)
//     Phần III 6 câu → 1,50   (15%)
//
// Ba tỉ lệ đó mới là thứ phải giữ. Số điểm mỗi câu là hệ quả:
//
//     điểm mỗi câu Phần I = 4,50 / (số câu Phần I của ca)
//
// Ca 8/2/2 ⇒ Phần I 0,5625/câu · Phần II tối đa 2,0/câu · Phần III 0,75/câu,
// cộng lại vẫn đúng 10,00.
//
// Ca đủ 18/4/6 ra **y hệt bản cũ**: 450/18 = 25, 400/4 = 100, 150/6 = 25 cents.
// Không ca cũ nào đổi điểm — có test khoá điều này.
//
// ============================================================================
// PHẦN THIẾU THÌ CHIA LẠI, KHÔNG BỎ TRỐNG
// ============================================================================
// Ca chỉ có Phần I và Phần III thì 4,00 điểm của Phần II không được rơi mất,
// nếu không trần điểm chỉ còn 6,0. Quota chia lại theo đúng tỉ lệ giữa các
// phần CÓ CÂU: 450 và 150 ⇒ 750 và 250. Trần luôn là 10,00.
//
// ============================================================================
// CÔNG BẰNG: ĐIỂM MỘT PHẦN CHỈ PHỤ THUỘC SỐ CÂU ĐÚNG
// ============================================================================
// 4,50 chia cho 8 câu không ra số tròn cents. Có hai lối:
//
//   (a) chia quota thành 8 phần nguyên rồi cộng phần của các câu đúng — phần
//       dư phải dồn vào vài câu đầu, thành ra hai em cùng đúng 7/8 câu lại
//       lệch nhau 0,01 điểm chỉ vì trượt câu khác nhau. KHÔNG DÙNG.
//   (b) tính thẳng từ SỐ CÂU ĐÚNG: cents = làm tròn(quota × đúng / tổng).
//       Cùng số câu đúng thì cùng điểm, bất kể trượt câu nào. DÙNG LỐI NÀY.
//
// Trường `cents` của từng câu là điểm câu đó làm tròn để HIỂN THỊ, cộng lại có
// thể lệch điểm phần vài cents — đó là lý do assert cộng chéo không so tổng
// từng câu, mà so tổng ba phần với tổng chung.
//
// Toàn bộ phép cộng chạy trên đơn vị "cents" (1/100 điểm, số nguyên) để tránh
// sai số dấu phẩy động (0.1 + 0.2 !== 0.3). Phép chia dùng số nguyên hết cỡ
// rồi mới làm tròn một lần, không để phép chia đôi lần nào lọt vào.

export type Choice = 'A' | 'B' | 'C' | 'D'
export type DS = 'D' | 'S'
export type ItemFlag = 'EMPTY' | 'WARN_ERASURE' | 'ERR_DOUBLE_MARK' | null

export interface GradedItem<T> {
  value: T | null
  flag: ItemFlag
}

export interface AnswerKey {
  madeThi: string
  phanI: Choice[] // số câu tuỳ ca; đề chuẩn 18
  phanII: DS[][] // số câu tuỳ ca, mỗi câu 4 ý; đề chuẩn 4
  phanIII: string[] // số câu tuỳ ca; đề chuẩn 6
}

export interface StudentAnswers {
  sbd: string
  madeThi: string
  phanI: GradedItem<Choice>[]
  phanII: GradedItem<DS>[][]
  phanIII: GradedItem<string>[]
}

export interface QuestionResult {
  index: number
  correct: boolean
  /** Điểm câu này (cents), ĐÃ LÀM TRÒN ĐỂ HIỂN THỊ. Xem ghi chú đầu file. */
  cents: number
  flag: ItemFlag
}

export interface ScoreResult {
  phanI: { items: QuestionResult[]; cents: number }
  phanII: { items: QuestionResult[]; cents: number }
  phanIII: { items: QuestionResult[]; cents: number }
  totalCents: number
  total: number // điểm hiển thị, 2 chữ số thập phân
  phanIScore: number
  phanIIScore: number
  phanIIIScore: number
  /** Trần điểm của từng phần trong ca này (cents). Giao diện cần để nói biểu điểm. */
  quota: QuotaPhan
  remainingFlags: number
  crossSumOk: boolean
}

export interface SoCauBaPhan {
  I: number
  II: number
  III: number
}
export type QuotaPhan = SoCauBaPhan

/** TEM LUẬT CHẤM — đổi luật thì đổi chuỗi này.
 *
 * VÌ SAO CÓ (thầy báo tối 08/09: "điểm 9 nhưng phiếu lại ghi điểm 4").
 *
 * Máy học sinh cũng chấm và cũng được ghi điểm lên Sheet. Máy nào còn bản app
 * trước 07/09 thì chấm bằng thang TUYỆT ĐỐI cũ (0,25/câu Phần I · 1,00/câu
 * Phần II · 0,25/câu Phần III) — ca 8/2/2 trần chỉ 4,50. Mỗi lần em đó mở lại
 * trang kết quả, máy em ghi đè con số cũ lên điểm thầy vừa chấm lại. Thầy chấm
 * lại buổi chiều, tối vào xem thì cả 36 em lại về thang cũ.
 *
 * Máy chủ nay CHỈ nhận điểm từ máy em khi gói mang đúng tem này. Bản cũ không
 * gửi tem ⇒ điểm của nó bị từ chối, chi tiết câu vẫn nhận (chuyên đề, mức độ,
 * giây làm không phụ thuộc luật chấm). Máy thầy có mã bí mật thì luôn ghi được.
 *
 * Đổi biểu điểm về sau: đổi chuỗi này VÀ hằng `LUAT_DIEM` trong
 * `docs/apps-script-kiem-tra.gs` — hai nơi phải khớp từng ký tự. */
export const LUAT_DIEM = 'tile-450-400-150-v1'

/** Tổng điểm một bài, tính bằng cents. */
export const TONG_CENTS = 1000

/** Tỉ lệ điểm ba phần, lấy từ cấu trúc đề chuẩn 18/4/6: 4,50 · 4,00 · 1,50. */
export const TI_LE_PHAN: QuotaPhan = { I: 450, II: 400, III: 150 }

/** Số ý mỗi câu Phần II theo đề chuẩn. */
export const SO_Y_PHAN_II = 4

/** Điểm một câu Phần II theo số ý đúng, tính bằng PHẦN NGHÌN của trần câu đó.
 * Đề chuẩn: 1 ý 0,1đ · 2 ý 0,25đ · 3 ý 0,5đ · 4 ý 1,0đ trên trần 1,0đ. */
export const PHAN_NGHIN_THEO_Y_DUNG = [0, 100, 250, 500, 1000]

const PHAN: (keyof QuotaPhan)[] = ['I', 'II', 'III']

/** Làm tròn `tu/mau` về số nguyên gần nhất, CHỈ dùng số nguyên.
 *
 * `Math.round(tu / mau)` có thể lệch một đơn vị khi thương đúng bằng x,5 và
 * phép chia dấu phẩy động rơi xuống x,49999…; điểm học sinh không được phép
 * phụ thuộc chuyện đó. */
function chiaLamTron(tu: number, mau: number): number {
  if (mau <= 0) return 0
  return Math.floor((2 * tu + mau) / (2 * mau))
}

/** Chia 1 000 cents cho các phần CÓ CÂU, theo đúng tỉ lệ chuẩn giữa chúng.
 *
 * Phần không có câu nào nhận 0 và nhường quota cho các phần còn lại, nếu không
 * ca thiếu một phần sẽ có trần điểm dưới 10. Phần dư (do chia không hết) rơi
 * vào phần có phần lẻ lớn nhất, nên tổng LUÔN đúng 1 000. */
export function quotaPhan(soCau: SoCauBaPhan): QuotaPhan {
  const co = PHAN.filter((k) => soCau[k] > 0)
  const ra: QuotaPhan = { I: 0, II: 0, III: 0 }
  if (co.length === 0) return ra
  const tongTiLe = co.reduce((a, k) => a + TI_LE_PHAN[k], 0)
  let daChia = 0
  const le: { k: keyof QuotaPhan; du: number }[] = []
  for (const k of co) {
    const tu = TONG_CENTS * TI_LE_PHAN[k]
    ra[k] = Math.floor(tu / tongTiLe)
    le.push({ k, du: tu - ra[k] * tongTiLe })
    daChia += ra[k]
  }
  le.sort((a, b) => b.du - a.du)
  for (let i = 0; i < TONG_CENTS - daChia; i++) ra[le[i % le.length].k] += 1
  return ra
}

/** Số câu ba phần đọc từ đáp án — nguồn duy nhất, không truyền tay từ ngoài
 * vào để khỏi lệch với đề em thật sự làm. */
export function soCauCuaKey(key: AnswerKey): SoCauBaPhan {
  return { I: key.phanI.length, II: key.phanII.length, III: key.phanIII.length }
}

/** Chuẩn hoá số Phần III: "0,87" ≡ "0.87", bỏ khoảng trắng thừa. */
export function normalizeNumericAnswer(raw: string): string {
  return raw.trim().replace(',', '.')
}

function centsToScore(cents: number): number {
  return Math.round(cents) / 100
}

/** Điểm hiển thị của MỘT câu trong phần có `n` câu và trần `quota` cents. */
function centsMotCau(quota: number, n: number): number {
  return chiaLamTron(quota, n)
}

export function scorePhanI(
  answers: GradedItem<Choice>[],
  key: Choice[],
  quota: number,
): { items: QuestionResult[]; cents: number } {
  if (answers.length !== key.length) {
    throw new Error(`Phần I: số câu trả lời (${answers.length}) khác số câu đáp án (${key.length})`)
  }
  const n = key.length
  const moiCau = centsMotCau(quota, n)
  let dung = 0
  const items: QuestionResult[] = answers.map((a, i) => {
    const correct = a.flag !== 'ERR_DOUBLE_MARK' && a.value !== null && a.value === key[i]
    if (correct) dung++
    return { index: i + 1, correct, cents: correct ? moiCau : 0, flag: a.flag }
  })
  return { items, cents: chiaLamTron(quota * dung, n) }
}

export function scorePhanII(
  answers: GradedItem<DS>[][],
  key: DS[][],
  quota: number,
): { items: QuestionResult[]; cents: number } {
  if (answers.length !== key.length) {
    throw new Error(`Phần II: số câu trả lời (${answers.length}) khác số câu đáp án (${key.length})`)
  }
  const n = key.length
  const tranCau = centsMotCau(quota, n)
  // Cộng dồn theo PHẦN NGHÌN để phép chia chỉ xảy ra đúng một lần ở cuối.
  let tongPhanNghin = 0
  const items: QuestionResult[] = answers.map((ideaAnswers, i) => {
    const ideaKey = key[i]
    if (ideaAnswers.length !== ideaKey.length) {
      throw new Error(`Phần II câu ${i + 1}: số ý trả lời khác số ý đáp án`)
    }
    if (ideaKey.length !== SO_Y_PHAN_II) {
      throw new Error(`Phần II câu ${i + 1}: có ${ideaKey.length} ý, biểu điểm chỉ định nghĩa cho ${SO_Y_PHAN_II} ý`)
    }
    let correctIdeas = 0
    let hasDoubleMark = false
    ideaAnswers.forEach((a, j) => {
      if (a.flag === 'ERR_DOUBLE_MARK') hasDoubleMark = true
      if (a.flag !== 'ERR_DOUBLE_MARK' && a.value !== null && a.value === ideaKey[j]) correctIdeas++
    })
    const phanNghin = hasDoubleMark ? 0 : PHAN_NGHIN_THEO_Y_DUNG[correctIdeas]
    tongPhanNghin += phanNghin
    const flag: ItemFlag = ideaAnswers.some((a) => a.flag) ? (ideaAnswers.find((a) => a.flag)?.flag ?? null) : null
    return {
      index: i + 1,
      correct: correctIdeas === SO_Y_PHAN_II && !hasDoubleMark,
      cents: chiaLamTron(tranCau * phanNghin, 1000),
      flag,
    }
  })
  return { items, cents: chiaLamTron(quota * tongPhanNghin, n * 1000) }
}

export function scorePhanIII(
  answers: GradedItem<string>[],
  key: string[],
  quota: number,
): { items: QuestionResult[]; cents: number } {
  if (answers.length !== key.length) {
    throw new Error(`Phần III: số câu trả lời (${answers.length}) khác số câu đáp án (${key.length})`)
  }
  const n = key.length
  const moiCau = centsMotCau(quota, n)
  let dung = 0
  const items: QuestionResult[] = answers.map((a, i) => {
    const normalizedKey = normalizeNumericAnswer(key[i])
    const correct =
      a.flag !== 'ERR_DOUBLE_MARK' && a.value !== null && normalizeNumericAnswer(a.value) === normalizedKey
    if (correct) dung++
    return { index: i + 1, correct, cents: correct ? moiCau : 0, flag: a.flag }
  })
  return { items, cents: chiaLamTron(quota * dung, n) }
}

/**
 * EMPTY là trạng thái bình thường (chưa tô câu đó, chấm 0 điểm) — không cần
 * duyệt. Chỉ WARN_ERASURE và ERR_DOUBLE_MARK mới đẩy vào hàng Duyệt và khoá
 * nút Xuất, theo đúng "cờ không chặn luồng quét nhưng chặn xuất khi còn cờ".
 */
export function isReviewFlag(flag: ItemFlag): boolean {
  return flag === 'WARN_ERASURE' || flag === 'ERR_DOUBLE_MARK'
}

/** Đếm tổng số cờ cần duyệt (WARN/ERR) còn hiện diện trong bài — dùng để khoá nút Xuất. */
function countFlags(answers: StudentAnswers): number {
  let n = 0
  const bump = (f: ItemFlag) => {
    if (isReviewFlag(f)) n++
  }
  answers.phanI.forEach((a) => bump(a.flag))
  answers.phanII.forEach((q) => q.forEach((a) => bump(a.flag)))
  answers.phanIII.forEach((a) => bump(a.flag))
  return n
}

export function scoreStudent(answers: StudentAnswers, key: AnswerKey): ScoreResult {
  const soCau = soCauCuaKey(key)
  const quota = quotaPhan(soCau)
  const phanI = scorePhanI(answers.phanI, key.phanI, quota.I)
  const phanII = scorePhanII(answers.phanII, key.phanII, quota.II)
  const phanIII = scorePhanIII(answers.phanIII, key.phanIII, quota.III)

  const totalCents = phanI.cents + phanII.cents + phanIII.cents
  // Assert cộng chéo: điểm không được vượt trần 10,00 và không được âm. Trần
  // bị vượt nghĩa là quota chia sai — bắt ngay tại chỗ chứ không để nó chạy ra
  // bảng điểm của thầy.
  const crossSumOk = totalCents >= 0 && totalCents <= TONG_CENTS
  if (!crossSumOk) {
    throw new Error(`Assert cộng chéo thất bại: tổng ${totalCents} cents nằm ngoài khoảng 0…${TONG_CENTS}`)
  }

  return {
    phanI,
    phanII,
    phanIII,
    totalCents,
    total: centsToScore(totalCents),
    phanIScore: centsToScore(phanI.cents),
    phanIIScore: centsToScore(phanII.cents),
    phanIIIScore: centsToScore(phanIII.cents),
    quota,
    remainingFlags: countFlags(answers),
    crossSumOk,
  }
}

/** Số kiểu Việt: 4.5 -> "4,5". */
function soVN(n: number): string {
  return String(n).replace('.', ',')
}

/** Dòng biểu điểm hiện dưới đầu mỗi phần lúc em làm bài.
 *
 * Phải tính từ số câu THẬT của ca. Bản cũ in cứng "Mỗi câu đúng 0,25 điểm" nên
 * ca 8/2/2 nói dối em ngay trên màn làm bài. Chia hết thì nói điểm mỗi câu cho
 * gọn, chia không hết thì nói trần cả phần — không in ra một con số lẻ mà cộng
 * lại không khớp. */
export function moTaBieuDiem(soCau: SoCauBaPhan, phan: keyof QuotaPhan): string {
  const n = soCau[phan]
  if (n <= 0) return ''
  const quota = quotaPhan(soCau)[phan]
  const chan = quota % n === 0
  const moiCau = soVN(quota / n / 100)
  const tranPhan = soVN(quota / 100)
  if (phan === 'II') {
    const y = PHAN_NGHIN_THEO_Y_DUNG.slice(1).map((p) => soVN(chiaLamTron(chiaLamTron(quota, n) * p, 1000) / 100))
    return `${n} câu, tối đa ${tranPhan} điểm · trong một câu: 1 ý ${y[0]}đ · 2 ý ${y[1]}đ · 3 ý ${y[2]}đ · cả 4 ý ${y[3]}đ`
  }
  return chan ? `Mỗi câu đúng ${moiCau} điểm (${n} câu, ${tranPhan} điểm)` : `${n} câu chia đều ${tranPhan} điểm`
}

/** Xếp loại theo thang điểm 10 chuẩn phổ thông — chỉ dùng hiển thị, không ảnh hưởng điểm số. */
export function classify(total: number): string {
  if (total >= 8) return 'Giỏi'
  if (total >= 6.5) return 'Khá'
  if (total >= 5) return 'Trung bình'
  return 'Yếu'
}
