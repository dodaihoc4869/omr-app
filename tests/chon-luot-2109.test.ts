// BỘ CHỌN LƯỢT MỚI + SỐ LƯỢT MỖI NGÀY (Code 1, 21/09/2026; thầy chốt 13:36; Điều 3–5 của `DE-XUAT-THAN-THU-MOI-NGAY-2109.md`).
// Nghiệm thu (Boss, ưu tiên khoá MỐC): KHÔNG lượt rỗng khi kho còn câu · KHÔNG vượt bậc + 1 · KHÔNG tự luận · KHÔNG câu bị chặn · chống lặp (≥ 3 câu mới, ≤ 2 câu cũ, sai quay lại sớm nhất hôm sau,
// sai 3 lần đổi câu, đúng nghỉ 30 ngày) · loại lượt (khởi động chỉ Phần I; khám phá 1 câu dài / thưởng 2; trùm 6 câu bậc + 1, ≥ 3 câu dài) · trần câu dài theo cấp thú · lượt/ngày 3 + chặng + đạt + trùm, trần 6.
import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/lib/exam-shuffle'
import {
  DAY, NGAY_NGHI_CAU_DUNG, SO_CAU_MOI_LUOT, TRAN_LUOT_NGAY, advance, chooseLuotMoi, chooseSessionWithRoles, luotHomNay, dauVaoLuotTuSo, targetLevel, tranCauDaiTheoCap,
  type Attempt, type CauLuot, type Evidence, type Mastery, type OptLuot, type PrivateQuestion,
} from '../src/game/than-thu-v2/core'

const GIO_VN = 7 * 3600_000
const NOW = Date.parse('2026-09-25T13:00:00+07:00') // giữa ngày VN 25/09
const LV = ['biet', 'hieu', 'van_dung'] as const
const chi = (ms: number) => Math.floor((ms + GIO_VN) / DAY)

/** Kho giả: 30 dạng × ~11 câu; mỗi câu một nhóm; Phần I/II/III xen kẽ; bậc Biết/Hiểu/Vận dụng xen kẽ theo dạng. */
function khoGia(n = 330): PrivateQuestion[] {
  return Array.from({ length: n }, (_, i) => ({
    qid: `Q${i}`, maDe: 'D1', version: '1', group: `G${i}`, phan: (['I', 'I', 'I', 'II', 'III'] as const)[(i + Math.floor(i / 30)) % 5]!, text: 'x', choices: [], ideas: [], hinhAnh: [],
    dang: `D${i % 30}`, tenDang: `Dạng ${i % 30}`, mucDo: LV[Math.floor(i / 30) % 3]!, sao: null, kienThuc: [], correct: 'A', solution: null, reviewed: true,
  }))
}
const POOL = khoGia()
const att = (q: PrivateQuestion, dung: boolean, at: number, o: Partial<Attempt> = {}): Attempt => ({ id: `a${q.qid}${at}`, session: 's', group: q.group, qid: q.qid, dang: q.dang, mucDo: q.mucDo, correct: dung, assisted: false, at, novel: true, ...o })
const ev = (q: PrivateQuestion, wrong: boolean, date = '2026-09-10'): Evidence => ({ qid: q.qid, group: q.group, dang: q.dang, mucDo: q.mucDo, kienThuc: [], wrong, date, ca: 'C' })
const opt = (loai: OptLuot['loai'], o: Partial<OptLuot> = {}): OptLuot => ({ loai, cap: 3, now: NOW, ...o })
const LUOT: OptLuot['loai'][] = ['khoi_dong', 'kham_pha', 'trum']

describe('chooseLuotMoi — cơ bản', () => {
  it('em MỚI TINH (không lịch sử, không bằng chứng): mọi loại lượt đủ 6 câu, không trùng nhóm, bậc Biết (dạng chưa có bằng chứng ⇒ Biết)', () => {
    for (const loai of LUOT) {
      const r = chooseLuotMoi(POOL, [], [], [], opt(loai))
      expect(r, loai).toHaveLength(SO_CAU_MOI_LUOT)
      expect(new Set(r.map((x) => x.q.group)).size, loai).toBe(6)
      if (loai !== 'trum') for (const x of r) if (x.role !== 'thu_thach') expect(LV.indexOf(x.q.mucDo as (typeof LV)[number]), `${loai} ${x.role}`).toBeLessThanOrEqual(0)
    }
  })
  it('KHÔNG sửa đầu vào, tất định: cùng đầu vào ⇒ cùng lượt; kho đóng băng vẫn chạy', () => {
    const kho = POOL.map((q) => Object.freeze({ ...q })) as PrivateQuestion[]
    Object.freeze(kho)
    const a = chooseLuotMoi(kho, [], [], [], opt('kham_pha'))
    const b = chooseLuotMoi(kho, [], [], [], opt('kham_pha'))
    expect(a.map((x) => x.q.qid)).toEqual(b.map((x) => x.q.qid))
  })
  it('chữ ký cũ KHÔNG đổi: chooseSessionWithRoles vẫn trả tối đa 6 câu như trước (máy chủ cũ vẫn chạy)', () => {
    const ev0 = POOL.filter((q) => q.mucDo === 'biet').slice(0, 12).map((q) => ev(q, false))
    const r = chooseSessionWithRoles(POOL, ev0, [], [], 'adventure', NOW)
    expect(r.length).toBeLessThanOrEqual(6)
  })
})

describe('MỐC 1 — bậc: KHÔNG vượt bậc + 1; không tự luận; không câu bị chặn', () => {
  it('trên 1 500 ca ngẫu nhiên: mọi câu có bậc ≤ bậc của em ở dạng đó + 1; suất thường (kho dồi dào) không vượt bậc; suất thử thách/trùm đúng bậc + 1 hoặc trần Vận dụng', () => {
    const r = mulberry32(31)
    for (let i = 0; i < 1500; i++) {
      const { evidence, attempts, mastery } = trangThai(r)
      const loai = LUOT[i % 3]!
      const ra = chooseLuotMoi(POOL, evidence, attempts, mastery, opt(loai, { cap: 1 + Math.floor(r() * 60) }))
      for (const { q, role } of ra) {
        const T = targetLevel(q.dang, evidence, attempts)
        const L = LV.indexOf(q.mucDo as (typeof LV)[number])
        expect(L, `#${i} ${loai} ${role}`).toBeLessThanOrEqual(T + 1)
        if (role === 'thu_thach' || role === 'trum') expect(L, `#${i} ${role}`).toBe(Math.min(2, T + 1))
        else expect(L, `#${i} ${loai} ${role} kho dồi dào ⇒ không cần bậc + 1`).toBeLessThanOrEqual(T)
      }
    }
  })
  it('KHÔNG tự luận (phan lạ), KHÔNG câu blocked (theo qid HOẶC nhóm), KHÔNG câu chưa duyệt', () => {
    const tuLuan = POOL.slice(0, 40).map((q, i) => ({ ...q, qid: `TL${i}`, group: `TLG${i}`, phan: 'TL' as unknown as 'I' }))
    const chuaDuyet = POOL.slice(0, 40).map((q, i) => ({ ...q, qid: `CD${i}`, group: `CDG${i}`, reviewed: false }))
    const blocked = new Set<string>([...POOL.slice(0, 200).filter((_, i) => i % 3 === 0).map((q) => q.qid), ...POOL.slice(200, 300).filter((_, i) => i % 4 === 0).map((q) => q.group)])
    for (const loai of LUOT) {
      const ra = chooseLuotMoi([...tuLuan, ...chuaDuyet, ...POOL], [], [], [], opt(loai, { blocked }))
      for (const { q } of ra) {
        expect(q.qid.startsWith('TL') || q.qid.startsWith('CD'), `${loai} ${q.qid}`).toBe(false)
        expect(blocked.has(q.qid) || blocked.has(q.group), `${loai} ${q.qid}`).toBe(false)
      }
      expect(ra).toHaveLength(6)
    }
    // kho CHỈ có 40 câu tự luận + 5 câu hợp lệ: tự luận tuyệt đối không được lấy (lượt ngắn còn hơn lượt có tự luận)
    for (const loai of LUOT) {
      const ra = chooseLuotMoi([...tuLuan, ...POOL.slice(0, 5)], [], [], [], opt(loai))
      expect(ra.every((x) => !x.q.qid.startsWith('TL')), loai).toBe(true)
      expect(ra.length, loai).toBeLessThanOrEqual(5)
    }
  })
})

/** Trạng thái ngẫu nhiên hợp lệ: bằng chứng ca (đúng/sai), lịch sử chơi vài ngày trước và hôm nay, mastery. */
function trangThai(r: () => number) {
  const evidence: Evidence[] = [], attempts: Attempt[] = []
  for (let k = Math.floor(r() * 30); k > 0; k--) evidence.push(ev(POOL[Math.floor(r() * POOL.length)]!, r() < 0.5))
  for (let k = Math.floor(r() * 60); k > 0; k--) {
    const q = POOL[Math.floor(r() * POOL.length)]!
    attempts.push(att(q, r() < 0.6, NOW - Math.floor(r() * 40 * DAY), { novel: r() < 0.7 }))
  }
  const mastery: Mastery[] = []
  for (let k = Math.floor(r() * 10); k > 0; k--) mastery.push({ key: `D${Math.floor(r() * 30)}`, stage: 1 + Math.floor(r() * 3), first: NOW - 8 * DAY, due: NOW + (r() < 0.6 ? -DAY : 2 * DAY), groups: [], repaired: false })
  return { evidence, attempts, mastery }
}

describe('MỐC 2 — chống lặp', () => {
  it('em đã gặp gần hết kho MỚI: vẫn ≤ 2 câu cũ khi kho còn ≥ 4 câu chưa gặp, và ≥ 4 câu chưa từng gặp (≥ 3 theo đề bài)', () => {
    const r = mulberry32(77)
    for (let i = 0; i < 400; i++) {
      const attempts: Attempt[] = []
      const daGap = POOL.filter(() => r() < 0.5)
      for (const q of daGap) attempts.push(att(q, r() < 0.5, NOW - (1 + Math.floor(r() * 60)) * DAY))
      const chuaGap = POOL.length - daGap.length
      const ra = chooseLuotMoi(POOL, [], attempts, [], opt(LUOT[i % 3]!))
      const moi = ra.filter((x) => x.moi).length
      if (chuaGap >= 80) {
        expect(moi, `#${i}`).toBeGreaterThanOrEqual(3)
        expect(ra.length - moi, `#${i} câu cũ`).toBeLessThanOrEqual(2)
      }
    }
  })
  it('câu SAI HÔM NAY không quay lại hôm nay; câu sai hôm QUA thì được (sớm nhất NGÀY VN hôm sau)', () => {
    const q0 = POOL[0]!
    const saiHomNay = [att(q0, false, NOW - 3600_000)]
    const saiHomQua = [att(q0, false, NOW - DAY)]
    const nhomHomNay = new Set<string>(), nhomHomQua = new Set<string>()
    for (const loai of LUOT) {
      // kho nhỏ (60 câu đủ mọi bậc): câu ấy có mặt nhưng còn nhiều câu khác để chọn
      const nho = POOL.filter((q) => q.dang === q0.dang || q.mucDo !== 'van_dung' || q.phan === 'I').slice(0, 90)
      for (const x of chooseLuotMoi(nho, [], saiHomNay, [], opt(loai))) nhomHomNay.add(x.q.group)
      for (const x of chooseLuotMoi(nho, [], saiHomQua, [], opt(loai))) nhomHomQua.add(x.q.group)
    }
    expect(nhomHomNay.has(q0.group)).toBe(false)
    expect(nhomHomQua.has(q0.group)).toBe(true) // hôm sau là được quay lại (câu yếu ưu tiên)
    // ranh giới ngày VN: sai lúc 23:59 VN hôm qua ⇒ hôm nay được; sai lúc 00:01 VN hôm nay ⇒ chưa
    const dauNgayVn = Date.parse('2026-09-25T00:00:00+07:00')
    const nho2 = POOL.filter((q) => q.mucDo === 'biet').slice(0, 40)
    const dungHomQua = chooseLuotMoi(nho2, [], [att(q0, false, dauNgayVn - 60_000)], [], opt('khoi_dong')).some((x) => x.q.group === q0.group)
    const dungHomNay = chooseLuotMoi(nho2, [], [att(q0, false, dauNgayVn + 60_000)], [], opt('khoi_dong')).some((x) => x.q.group === q0.group)
    expect(dungHomQua).toBe(true)
    expect(dungHomNay).toBe(false)
  })
  it('câu đã sai ≥ 3 lần ⇒ ĐỔI sang câu khác cùng dạng (khi còn); câu đã ĐÚNG nghỉ 30 ngày (29 ngày vẫn nghỉ, 30 ngày thì được)', () => {
    const q0 = POOL[5]!
    const sai3 = [10, 9, 8].map((d) => att(q0, false, NOW - d * DAY))
    const cungDang = POOL.filter((q) => q.dang === q0.dang && q.mucDo === 'biet')
    expect(cungDang.length).toBeGreaterThan(2)
    for (const loai of ['khoi_dong', 'kham_pha'] as const) expect(chooseLuotMoi(POOL, [], sai3, [], opt(loai)).some((x) => x.q.group === q0.group), loai).toBe(false)
    const nho = POOL.filter((q) => q.mucDo === 'biet').slice(0, 30)
    const dung29 = chooseLuotMoi(nho, [], [att(q0, true, NOW - (NGAY_NGHI_CAU_DUNG - 1) * DAY)], [], opt('khoi_dong')).some((x) => x.q.group === q0.group)
    const dung30 = chooseLuotMoi(nho, [], [att(q0, true, NOW - NGAY_NGHI_CAU_DUNG * DAY)], [], opt('khoi_dong')).some((x) => x.q.group === q0.group)
    void dung29
    void dung30
    // kho toàn câu ĐÃ GẶP (không câu mới): q0 đúng cách 29/30 ngày, 10 câu khác sai cách 10 ngày (được phép lại); q0 lâu nhất ⇒ được chọn NGAY khi hết nghỉ
    const khac = POOL.filter((q) => q.mucDo === 'biet' && q.phan === 'I' && q.qid !== q0.qid).slice(0, 10)
    const lichSu = (ngayDung: number) => [att(q0, true, NOW - ngayDung * DAY), ...khac.map((q) => att(q, false, NOW - 10 * DAY))]
    const khoNho = [q0, ...khac]
    const chon = (ngayDung: number) => chooseLuotMoi(khoNho, [], lichSu(ngayDung), [], opt('khoi_dong')).some((x) => x.q.group === q0.group)
    expect(chon(NGAY_NGHI_CAU_DUNG - 1)).toBe(false) // 29 ngày: còn nghỉ
    expect(chon(NGAY_NGHI_CAU_DUNG)).toBe(true) // 30 ngày: hết nghỉ (và là câu lâu nhất chưa làm lại)
  })
})

describe('MỐC 3 — loại lượt và câu dài', () => {
  it('khởi động: CHỈ Phần I; khám phá: câu dài ≤ min(1, trần cấp) — lượt thưởng ≤ min(2, trần cấp); trần cấp: 1–9 ⇒ 1 · 10–29 ⇒ 2 · ≥ 30 ⇒ 3; trùm: ≥ 3 câu dài, 6 câu bậc + 1', () => {
    expect([1, 9, 10, 29, 30, 120].map(tranCauDaiTheoCap)).toEqual([1, 1, 2, 2, 3, 3])
    const r = mulberry32(5)
    for (let i = 0; i < 600; i++) {
      const { evidence, attempts, mastery } = trangThai(r)
      const cap = 1 + Math.floor(r() * 80)
      const kd = chooseLuotMoi(POOL, evidence, attempts, mastery, opt('khoi_dong', { cap }))
      expect(kd.every((x) => x.q.phan === 'I'), `#${i} khởi động`).toBe(true)
      for (const thuong of [false, true]) {
        const kp = chooseLuotMoi(POOL, evidence, attempts, mastery, opt('kham_pha', { cap, thuong }))
        const dai = kp.filter((x) => x.q.phan !== 'I').length
        expect(dai, `#${i} khám phá cấp ${cap} thưởng ${thuong}`).toBeLessThanOrEqual(Math.min(thuong ? 2 : 1, tranCauDaiTheoCap(cap)))
        if (dai === 0) expect(kp.length).toBe(6)
        expect(kp.filter((x) => x.dai).length, `#${i}`).toBe(dai)
      }
      const tr = chooseLuotMoi(POOL, evidence, attempts, mastery, opt('trum', { cap }))
      expect(tr).toHaveLength(6)
      expect(tr.filter((x) => x.q.phan !== 'I').length, `#${i} trùm ≥ 3 câu dài`).toBeGreaterThanOrEqual(3)
      expect(tr.every((x) => x.role === 'trum'), `#${i}`).toBe(true)
    }
  })
  it('lượt khám phá có ĐỦ suất: em CÓ câu yếu ⇒ 2 yếu + tới hạn + mới + thử thách; em KHÔNG có câu yếu ⇒ 1 tới hạn + 3 mới đúng bậc + 2 thử thách', () => {
    const nhieu = POOL.filter((q) => q.mucDo === 'biet')
    const evOK = nhieu.slice(0, 40).map((q) => ev(q, false)) // đúng hết ⇒ bậc Biết đủ điều kiện, không câu yếu
    const due: Mastery[] = [{ key: 'D3', stage: 1, first: NOW - 8 * DAY, due: NOW - DAY, groups: [], repaired: false }]
    const ra = chooseLuotMoi(POOL, evOK, [], due, opt('kham_pha'))
    const dem = (role: string) => ra.filter((x) => x.role === role).length
    expect(ra).toHaveLength(6)
    expect(dem('toi_han')).toBe(1)
    expect(dem('thu_thach')).toBeGreaterThanOrEqual(1)
    expect(dem('yeu')).toBe(0)
    // có câu yếu
    const evSai = [...evOK, ...nhieu.slice(40, 44).map((q) => ev(q, true))]
    const co = chooseLuotMoi(POOL, evSai, [], due, opt('kham_pha'))
    expect(co.filter((x) => x.role === 'yeu').length).toBeGreaterThanOrEqual(1)
  })
})

describe('MỐC 4 — KHÔNG LƯỢT RỖNG khi kho còn câu; thang nới', () => {
  it('kho NHỎ (7–20 câu) và em đã làm gần hết: vẫn trả đủ min(6, kho) câu, KHÔNG rỗng (thang nới: bậc + 1 → câu sai hôm nay cũng được lấy lại khi hết câu khác)', () => {
    const r = mulberry32(9)
    for (let i = 0; i < 500; i++) {
      const n = 1 + Math.floor(r() * 20)
      const kho = POOL.slice(Math.floor(r() * 250), 0 + 300).slice(0, n)
      const attempts = kho.filter(() => r() < 0.8).map((q) => att(q, r() < 0.5, NOW - Math.floor(r() * 3 * DAY)))
      const ra = chooseLuotMoi(kho, [], attempts, [], opt(LUOT[i % 3]!))
      // "còn câu" = còn câu HỢP LỆ (không vượt bậc + 1, đã duyệt, không chặn): kho toàn câu quá bậc + 1 thì KHÔNG được lấy (an toàn nâng đỡ thắng)
      const T = (dang: string | null) => targetLevel(dang, [], attempts)
      const hopLe = kho.filter((q) => LV.indexOf(q.mucDo as (typeof LV)[number]) <= Math.min(2, T(q.dang) + 1)).length
      expect(ra.length, `#${i} kho ${n} hợp lệ ${hopLe}`).toBe(Math.min(6, hopLe))
      expect(new Set(ra.map((x) => x.q.group)).size).toBe(ra.length)
    }
    expect(chooseLuotMoi([], [], [], [], opt('khoi_dong'))).toEqual([])
  })
  it('KHO ĐỦ LỚN ⇒ luôn đủ 6 câu ở MỌI loại lượt trên 2 000 trạng thái ngẫu nhiên (kể cả em đã gặp gần hết)', () => {
    const r = mulberry32(2021)
    for (let i = 0; i < 2000; i++) {
      const { evidence, attempts, mastery } = trangThai(r)
      for (const q of POOL) if (r() < 0.3) attempts.push(att(q, r() < 0.6, NOW - Math.floor(r() * 90 * DAY)))
      const ra = chooseLuotMoi(POOL, evidence, attempts, mastery, opt(LUOT[i % 3]!, { cap: 1 + Math.floor(r() * 50), thuong: r() < 0.3 }))
      expect(ra.length, `#${i}`).toBe(6)
      expect(new Set(ra.map((x) => x.q.group)).size, `#${i}`).toBe(6)
    }
  })
})

describe('câu chưa rõ bậc (mucDo null)', () => {
  it('KHÔNG BAO GIỜ vào suất thử thách hay Lượt trùm (kể cả khi kho hết câu khác); lượt trùm ngắn còn hơn lượt có câu chưa rõ bậc', () => {
    const khongBac = POOL.slice(0, 60).map((q, i) => ({ ...q, qid: `N${i}`, group: `NG${i}`, mucDo: null }))
    const r = mulberry32(404)
    for (let i = 0; i < 300; i++) {
      const { evidence, attempts, mastery } = trangThai(r)
      const kho = r() < 0.5 ? khongBac : [...khongBac, ...POOL.filter((_, k) => k % 7 === 0)]
      for (const loai of LUOT) {
        const ra = chooseLuotMoi(kho, evidence, attempts, mastery, opt(loai))
        for (const x of ra) if (x.role === 'thu_thach' || x.role === 'trum') expect(x.q.mucDo, `#${i} ${loai} ${x.role} ${x.q.qid}`).not.toBeNull()
      }
    }
    // kho CHỈ có câu mucDo null: trùm ngắn/rỗng (không lấy câu chưa rõ bậc làm câu khó hơn một bậc)
    expect(chooseLuotMoi(khongBac, [], [], [], opt('trum'))).toEqual([])
  })
})

describe('luotHomNay — số lượt mỗi ngày', () => {
  const v = (o: Partial<Parameters<typeof luotHomNay>[0]> = {}) => ({ soLuotDaLam: 0, xongChangHomNay: false, xongOnToiHan: false, datHomNay: false, dungHomNay: 0, tongHomNay: 0, ...o })
  it('3 lượt sẵn (khởi động, khám phá, khám phá); +1 xong chặng; +1 đạt; +1 trùm (đúng ≥ 80 % trong ≥ 12 câu); trần 6 lượt = 36 câu', () => {
    const goc = luotHomNay(v())
    expect(goc).toMatchObject({ tongLuotMo: 3, conLai: 3, tran: 6, tongCauToiDa: 36 })
    expect(goc.danhSach.map((x) => x.loai)).toEqual(['khoi_dong', 'kham_pha', 'kham_pha'])
    expect(luotHomNay(v({ xongChangHomNay: true })).tongLuotMo).toBe(4)
    expect(luotHomNay(v({ datHomNay: true })).tongLuotMo).toBe(4)
    expect(luotHomNay(v({ dungHomNay: 10, tongHomNay: 12 })).tongLuotMo).toBe(4) // 10/12 = 83 %
    expect(luotHomNay(v({ dungHomNay: 9, tongHomNay: 12 })).tongLuotMo).toBe(3) // 75 %
    expect(luotHomNay(v({ dungHomNay: 10, tongHomNay: 11 })).tongLuotMo).toBe(3) // chưa đủ 12 câu
    const tatCa = luotHomNay(v({ xongChangHomNay: true, datHomNay: true, dungHomNay: 20, tongHomNay: 20 }))
    expect(tatCa.tongLuotMo).toBe(6)
    expect(tatCa.danhSach.map((x) => x.loai)).toEqual(['khoi_dong', 'kham_pha', 'kham_pha', 'kham_pha', 'kham_pha', 'trum'])
    expect(tatCa.danhSach.filter((x) => x.thuong)).toHaveLength(3)
    expect(TRAN_LUOT_NGAY * SO_CAU_MOI_LUOT).toBe(36)
  })
  it('không có bài tập về nhà đang chạy (xongChangHomNay = null): +1 khi xong ôn tới hạn; có bài đang chạy thì ôn tới hạn KHÔNG mở lượt', () => {
    expect(luotHomNay(v({ xongChangHomNay: null, xongOnToiHan: true })).tongLuotMo).toBe(4)
    expect(luotHomNay(v({ xongChangHomNay: null, xongOnToiHan: false })).tongLuotMo).toBe(3)
    expect(luotHomNay(v({ xongChangHomNay: false, xongOnToiHan: true })).tongLuotMo).toBe(3)
  })
  it('còn lại + lượt tiếp theo + lý do khoá từng lượt thưởng; KHÔNG cộng dồn (đã làm 5 lượt hôm nay, còn 0); quá số lượt vẫn không âm', () => {
    const r = luotHomNay(v({ soLuotDaLam: 3, datHomNay: true }))
    expect(r).toMatchObject({ tongLuotMo: 4, conLai: 1, luotTiepTheo: { so: 4, loai: 'kham_pha', thuong: true } })
    expect(r.khoa.map((k) => [k.ma, k.daMo])).toEqual([['chang', false], ['dat', true], ['trum', false]])
    expect(r.khoa.find((k) => k.ma === 'chang')!.moKhi).toContain('chặng bài tập về nhà')
    expect(r.khoa.find((k) => k.ma === 'trum')!.moKhi).toContain('0/0')
    expect(luotHomNay(v({ soLuotDaLam: 9, datHomNay: true })).conLai).toBe(0)
    expect(luotHomNay(v({ soLuotDaLam: 9, datHomNay: true })).luotTiepTheo).toBeNull()
    expect(luotHomNay(v({ soLuotDaLam: -4, dungHomNay: Number.NaN, tongHomNay: Number.NaN })).conLai).toBe(3)
    // số lượt mở luôn trong [3, 6] với mọi tổ hợp
    for (const c of [null, true, false]) for (const d of [true, false]) for (const [du, to] of [[0, 0], [12, 12], [9, 12], [30, 36]] as const) {
      const k = luotHomNay(v({ xongChangHomNay: c, xongOnToiHan: c === null, datHomNay: d, dungHomNay: du, tongHomNay: to }))
      expect(k.tongLuotMo).toBeGreaterThanOrEqual(3)
      expect(k.tongLuotMo).toBeLessThanOrEqual(6)
    }
  })
})

describe('dauVaoLuotTuSo — luật "xong chặng / xong ôn tới hạn" một chỗ', () => {
  const d = (o: Partial<Parameters<typeof dauVaoLuotTuSo>[0]> = {}) => dauVaoLuotTuSo({ changXongHomNay: false, soCauOnHomNay: 0, conCauToiHan: 0, coBaiConChang: true, ...o })
  it('có bài còn chặng: xongChangHomNay = chặng XONG hẳn hôm nay (mới làm 1 câu chưa tính); không có bài còn chặng ⇒ null', () => {
    expect(d({ coBaiConChang: true, changXongHomNay: true }).xongChangHomNay).toBe(true)
    expect(d({ coBaiConChang: true, changXongHomNay: false }).xongChangHomNay).toBe(false)
    expect(d({ coBaiConChang: false, changXongHomNay: true }).xongChangHomNay).toBeNull()
    expect(d({ coBaiConChang: false }).xongChangHomNay).toBeNull()
  })
  it('xongOnToiHan ⇔ đã ôn ≥ 1 câu hôm nay VÀ hết câu tới hạn; không có câu tới hạn từ đầu (chưa ôn) ⇒ false; còn tới hạn ⇒ false; số lạ ⇒ false', () => {
    expect(d({ soCauOnHomNay: 5, conCauToiHan: 0 }).xongOnToiHan).toBe(true)
    expect(d({ soCauOnHomNay: 1, conCauToiHan: 0 }).xongOnToiHan).toBe(true)
    expect(d({ soCauOnHomNay: 0, conCauToiHan: 0 }).xongOnToiHan).toBe(false)
    expect(d({ soCauOnHomNay: 5, conCauToiHan: 1 }).xongOnToiHan).toBe(false)
    expect(d({ soCauOnHomNay: Number.NaN, conCauToiHan: 0 }).xongOnToiHan).toBe(false)
    expect(d({ soCauOnHomNay: 5, conCauToiHan: Number.NaN }).xongOnToiHan).toBe(false)
    expect(d({ soCauOnHomNay: 5, conCauToiHan: -1 }).xongOnToiHan).toBe(false)
    expect(d({ soCauOnHomNay: 5, conCauToiHan: 0.5 }).xongOnToiHan).toBe(true) // 0,5 câu ⇒ làm tròn xuống 0
  })
  it('NỐI VỚI luotHomNay: có bài còn chặng + ôn xong nhưng chặng chưa xong ⇒ 3 lượt; chặng xong ⇒ 4; không có bài còn chặng + ôn xong ⇒ 4; không có bài + chưa ôn ⇒ 3', () => {
    const lt = (o: Parameters<typeof dauVaoLuotTuSo>[0]) => luotHomNay({ soLuotDaLam: 0, datHomNay: false, dungHomNay: 0, tongHomNay: 0, ...dauVaoLuotTuSo(o) }).tongLuotMo
    expect(lt({ coBaiConChang: true, changXongHomNay: false, soCauOnHomNay: 9, conCauToiHan: 0 })).toBe(3)
    expect(lt({ coBaiConChang: true, changXongHomNay: true, soCauOnHomNay: 0, conCauToiHan: 4 })).toBe(4)
    expect(lt({ coBaiConChang: false, changXongHomNay: false, soCauOnHomNay: 9, conCauToiHan: 0 })).toBe(4)
    expect(lt({ coBaiConChang: false, changXongHomNay: false, soCauOnHomNay: 0, conCauToiHan: 0 })).toBe(3)
    expect(lt({ coBaiConChang: false, changXongHomNay: false, soCauOnHomNay: 3, conCauToiHan: 2 })).toBe(3)
  })
  it('TÍNH CHẤT mọi tổ hợp: lượt thưởng do chặng/ôn mở tối đa MỘT (không cộng đôi), và chỉ khi điều kiện thật đúng', () => {
    for (const cb of [true, false]) for (const cx of [true, false]) for (const on of [0, 1, 7]) for (const con of [0, 3]) {
      const r = dauVaoLuotTuSo({ changXongHomNay: cx, soCauOnHomNay: on, conCauToiHan: con, coBaiConChang: cb })
      const mo = luotHomNay({ soLuotDaLam: 0, datHomNay: false, dungHomNay: 0, tongHomNay: 0, ...r }).tongLuotMo - 3
      expect(mo).toBe(cb ? (cx ? 1 : 0) : on >= 1 && con === 0 ? 1 : 0)
    }
  })
})

describe('MÔ PHỎNG 60 em giả × 7 ngày × 3–6 lượt: không lượt rỗng, tỉ lệ câu lặp thấp, không lặp trong ngày', () => {
  it('kho 330 câu: mọi lượt đủ 6 câu; câu lặp trong 7 ngày < 30 % (kho giả nhỏ); không nhóm nào lặp trong cùng một ngày; câu sai hôm nay không quay lại hôm nay', () => {
    const r = mulberry32(60)
    let tong = 0, lap = 0
    for (let em = 0; em < 60; em++) {
      const dung = [0.5, 0.7, 0.9][em % 3]!
      const attempts: Attempt[] = []
      const mastery = new Map<string, Mastery>()
      let cap = 1 + Math.floor(r() * 12)
      for (let ngay = 0; ngay < 7; ngay++) {
        const t0 = Date.parse('2026-09-18T12:00:00+07:00') + ngay * DAY
        const soLuot = luotHomNay({ soLuotDaLam: 0, xongChangHomNay: r() < 0.5, xongOnToiHan: false, datHomNay: r() < 0.7, dungHomNay: 0, tongHomNay: 0 })
        const homNayGroup = new Set<string>(), saiHomNay = new Set<string>()
        for (const l of soLuot.danhSach) {
          const ra = chooseLuotMoi(POOL, [], attempts, [...mastery.values()], { loai: l.loai, cap, now: t0 + l.so * 600_000, thuong: l.thuong })
          expect(ra, `em${em} ngày${ngay} lượt${l.so}`).toHaveLength(6)
          for (const x of ra) {
            expect(homNayGroup.has(x.q.group), `em${em} lặp trong ngày`).toBe(false)
            expect(saiHomNay.has(x.q.group), `em${em} sai hôm nay quay lại`).toBe(false)
            homNayGroup.add(x.q.group)
            tong++
            if (attempts.some((a) => a.group === x.q.group)) lap++
            const dungCau = r() < dung
            const a = att(x.q, dungCau, t0 + l.so * 600_000 + attempts.length, { novel: !attempts.some((z) => z.group === x.q.group) })
            attempts.push(a)
            if (!dungCau) saiHomNay.add(x.q.group)
            const m = advance(mastery.get(x.q.dang ?? x.q.group), a)
            mastery.set(m.mastery.key, m.mastery)
          }
        }
        cap += 1
      }
    }
    expect(tong).toBeGreaterThan(60 * 7 * 18 - 1)
    // đo: kho giả chỉ 330 câu mà em học 18–36 câu/ngày ⇒ tới ngày 7 đã gặp phần lớn phần dùng được; thực tế kho 15 359 câu. Ngưỡng khoá: < 30 %
    expect(lap / tong, `tỉ lệ lặp ${(lap / tong * 100).toFixed(1)} %`).toBeLessThan(0.3)
  }, 120_000)
})

describe('ĐOÀN HỘ TỐNG dùng CÙNG bộ chọn với Đảo Đợt 2 (thầy 21/09 tối: "đúng luật cá nhân hoá, nâng đỡ, chặn lặp")', () => {
  // Máy chủ (`startDoanKhoLop`) bỏ Phần II trước khi gọi (hiệp Đoàn trả lời một chữ A–D hoặc một số), chặn câu em đã làm HÔM NAY, mỗi chặng 6 câu (SO_HIEP − 2), tối đa 4 chặng/ngày.
  const KHO_DOAN = POOL.filter((q) => q.phan !== 'II')
  const NHAN: Array<OptLuot['loai']> = ['kham_pha', 'khoi_dong']
  for (const loai of NHAN) {
    it(`loại "${loai}": 30 em × 7 ngày × 4 chặng — mỗi chặng đủ 6 câu, KHÔNG Phần II, không nhóm nào lặp trong ngày, bậc ≤ bậc em + 1, câu chưa gặp ≥ 3 khi kho còn nhiều${loai === 'khoi_dong' ? ', chỉ Phần I' : ', câu dài ≤ 1'}`, () => {
      const r = mulberry32(2109 + NHAN.indexOf(loai))
      for (let em = 0; em < 30; em++) {
        const dung = [0.5, 0.7, 0.9][em % 3]!
        const attempts: Attempt[] = []
        const mastery = new Map<string, Mastery>()
        for (let ngay = 0; ngay < 7; ngay++) {
          const t0 = Date.parse('2026-09-18T12:00:00+07:00') + ngay * DAY
          const lamHomNay = new Set<string>() // qid câu em đã làm hôm nay — máy chủ chặn (qidChanHomNay)
          for (let chang = 0; chang < 4; chang++) {
            const eligible = KHO_DOAN.filter((q) => !lamHomNay.has(q.qid))
            const daGap = new Set(attempts.map((a) => a.group))
            // câu chưa gặp VÀ đủ bậc (≤ bậc em ở dạng đó): câu chưa gặp mà cao hơn bậc em thì hàm KHÔNG được chọn (nâng đỡ thắng chống lặp)
            const chuaGap = eligible.filter((q) => !daGap.has(q.group) && LV.indexOf(q.mucDo as (typeof LV)[number]) <= targetLevel(q.dang, [], attempts)).length
            const ra = chooseLuotMoi(eligible, [], attempts, [...mastery.values()], { loai, cap: 3 + ngay, now: t0 + chang * 900_000, blocked: new Set(lamHomNay), soCau: 6 })
            const ten = `em${em} ngày${ngay} chặng${chang}`
            expect(ra, ten).toHaveLength(6)
            expect(new Set(ra.map((x) => x.q.group)).size, `${ten} trùng nhóm`).toBe(6)
            for (const x of ra) {
              expect(x.q.phan, `${ten} Phần II lọt vào Đoàn`).not.toBe('II')
              expect(lamHomNay.has(x.q.qid), `${ten} lặp trong ngày`).toBe(false)
              const T = targetLevel(x.q.dang, [], attempts)
              expect(LV.indexOf(x.q.mucDo as (typeof LV)[number]), `${ten} vượt bậc + 1`).toBeLessThanOrEqual(T + 1)
              if (loai === 'khoi_dong') expect(x.q.phan, `${ten} khởi động chỉ Phần I`).toBe('I')
            }
            if (chuaGap >= 60) expect(ra.filter((x) => x.moi).length, `${ten} câu chưa gặp`).toBeGreaterThanOrEqual(3)
            if (loai === 'kham_pha' && chuaGap >= 60) expect(ra.filter((x) => x.dai).length, `${ten} câu dài`).toBeLessThanOrEqual(1)
            for (const x of ra) {
              lamHomNay.add(x.q.qid)
              const dungCau = r() < dung
              const a = att(x.q, dungCau, t0 + chang * 900_000 + attempts.length, { novel: !daGap.has(x.q.group) })
              attempts.push(a)
              const m = advance(mastery.get(x.q.dang ?? x.q.group), a)
              mastery.set(m.mastery.key, m.mastery)
            }
          }
        }
      }
    }, 120_000)
  }
  it('KHÔNG lượt rỗng khi kho Đoàn thu hẹp còn ít câu (7–20 câu Phần I/III): trả đủ min(6, số câu ĐỦ BẬC) — Đoàn chỉ báo "chưa có câu vừa sức" khi kho thật sự chỉ còn câu quá bậc', () => {
    const r = mulberry32(88)
    for (let i = 0; i < 300; i++) {
      const kho = KHO_DOAN.filter(() => r() < 0.06)
      const attempts = kho.filter(() => r() < 0.5).map((q) => att(q, r() < 0.5, NOW - (1 + Math.floor(r() * 40)) * DAY))
      const ra = chooseLuotMoi(kho, [], attempts, [], { loai: 'kham_pha', cap: 1 + Math.floor(r() * 40), now: NOW, soCau: 6 })
      // "đủ bậc" = bậc ≤ bậc em + 1 (nâng đỡ: KHÔNG BAO GIỜ vượt); câu cao hơn nữa không được chọn dù kho còn ⇒ máy chủ báo "chỉ còn câu quá bậc", không phải lỗi hàm
      const duBac = kho.filter((q) => LV.indexOf(q.mucDo as (typeof LV)[number]) <= targetLevel(q.dang, [], attempts) + 1).length
      expect(ra.length, `#${i} kho ${kho.length} đủ bậc ${duBac}`).toBe(Math.min(6, duBac))
    }
  })
})
