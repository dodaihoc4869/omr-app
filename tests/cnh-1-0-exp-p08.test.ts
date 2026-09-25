// CNH-1.0 P08 — BẰNG CHỨNG HÀM THUẦN (config thường, không cần D1).
//
// ⚠️ `03` §10 chốt: *"`MAU-KET-QUA.json` chứa đầu vào/đầu ra số học. Cline phải nối những vector này
// vào hàm sản phẩm qua adapter mỏng, không viết lại engine trong adapter chỉ để qua test."*
// Tệp này ĐỌC CHÍNH `docs/cline-ca-nhan-hoa-2309/MAU-KET-QUA.json` và chạy từng vector qua hàm thật.
// Hằng số thì đối chiếu `THAM-SO.json` — KHÔNG chép số vào test (chép là test tự khen mình).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  KINH_TE,
  TRAN_INVESTED_EXP,
  capTuInvestedExp,
  expThieuToiCapToiDa,
  expTieuDuoc,
  moPhongChuan,
  ngayLichTuNgayHoc,
  tinhHapThu,
  tranHapThuNgay,
  xetDoiVang,
  xetKhien,
  type TrangThaiNgay,
} from '../server/src/cnh-exp-p08'
import { BANG_THANH_EXP, thanhExp, tongExpToiCap } from '../src/game/than-thu-hoa-hoc/kinh-nghiem'

const THAM_SO = JSON.parse(readFileSync('docs/cline-ca-nhan-hoa-2309/THAM-SO.json', 'utf8')) as {
  economy: Record<string, unknown>
}
interface Vector {
  id: string
  kind: string
  input: Record<string, unknown>
  expected: Record<string, unknown>
}
const VECTORS = (JSON.parse(readFileSync('docs/cline-ca-nhan-hoa-2309/MAU-KET-QUA.json', 'utf8')) as { vectors: Vector[] }).vectors
const loai = (k: string) => VECTORS.filter((v) => v.kind === k)

/** §6: vector cho `missingToMax` (hộp đen) ⇒ quy về `invested_exp` của hàm thật. */
const investedTuThieu = (missingToMax: number) => TRAN_INVESTED_EXP - missingToMax
const trangThai = (s: unknown): TrangThaiNgay => (s === 'achieved' ? 'achieved' : s === 'studied' ? 'studied' : 'chua_hoc')

/**
 * ADAPTER MỎNG (§10): vector → hàm sản phẩm. KHÔNG tính lại số ở đây; chỉ đổi tên trường.
 * Cố tình trả ĐÚNG các khoá `expected` của vector để phép so là so từng trường.
 */
const chay: Record<string, (i: Record<string, number | string | boolean>) => Record<string, unknown>> = {
  absorb: (i) => {
    const r = tinhHapThu({
      walletExp: Number(i.wallet),
      absorbedToday: Number(i.absorbed),
      trangThaiNgay: trangThai(i.state),
      investedExp: investedTuThieu(Number(i.missingToMax)),
    })
    return { take: r.take, walletAfter: r.walletAfter, absorbedAfter: r.absorbedTodayAfter }
  },
  shield: (i) => {
    const r = xetKhien({
      level: Number(i.level),
      fragmentBalance: Number(i.fragments),
      unusedShields: Number(i.unused),
      achievedDays: Number(i.days),
      firstShieldClaimed: i.firstClaimed === true,
      walletExp: Number(i.wallet),
    })
    return { allowed: r.loai !== 'khong', cost: r.expCost, walletAfter: r.walletAfter, fragmentsAfter: r.fragmentBalanceAfter, unusedAfter: r.unusedAfter }
  },
  exchange: (i) => {
    const r = xetDoiVang(Number(i.wallet), Number(i.amount), Number(i.gold))
    return { allowed: r.ok, walletAfter: r.walletAfter, goldAfter: r.goldAfter }
  },
  simulation: (i) => moPhongChuan({ earnedEachAchievedDay: Number(i.earnedEachAchievedDay), days: Number(i.days) }),
  weekdaySchedule: (i) => {
    // `03` §10: ngày HỌC → ngày LỊCH. Vector hỏi 3 mốc 12/21/42 nên gọi hàm 3 lần (không tính lại).
    const chung = { startWeekday: String(i.startWeekday), studyWeekdays: i.studyWeekdays as number[] }
    return {
      studyDay12Calendar: ngayLichTuNgayHoc({ ...chung, studyDay: 12 }),
      studyDay21Calendar: ngayLichTuNgayHoc({ ...chung, studyDay: 21 }),
      studyDay42Calendar: ngayLichTuNgayHoc({ ...chung, studyDay: 42 }),
    }
  },
}

describe('P08 · VECTOR CHUẨN `MAU-KET-QUA.json` qua adapter mỏng (`03` §10)', () => {
  it('có ĐỦ vector P08 để chạy (hấp thụ · khiên · đổi vàng · mô phỏng)', () => {
    expect(loai('absorb').length).toBe(5)
    expect(loai('shield').length).toBe(6)
    expect(loai('exchange').length).toBe(2)
    expect(loai('simulation').length).toBe(3)
    expect(loai('weekdaySchedule').length).toBe(1)
  })

  for (const k of ['absorb', 'shield', 'exchange', 'simulation', 'weekdaySchedule']) {
    describe(`kind = ${k}`, () => {
      for (const v of loai(k)) {
        it(`${v.id}: ${JSON.stringify(v.input)} ⇒ ${JSON.stringify(v.expected)}`, () => {
          expect(chay[k]!(v.input)).toEqual(v.expected)
        })
      }
    })
  }
})

describe('P08 · HẰNG SỐ đối chiếu `THAM-SO.json` (không chép số vào test)', () => {
  it('mọi con số kinh tế P08 khớp THAM-SO', () => {
    const e = THAM_SO.economy
    expect(KINH_TE.coreCap).toBe(e.coreCap)
    expect(KINH_TE.optionalCap).toBe(e.optionalCap)
    expect(KINH_TE.achievedAbsorbCap).toBe(e.achievedAbsorbCap)
    expect(KINH_TE.studiedAbsorbCap).toBe(e.studiedAbsorbCap)
    expect(KINH_TE.noneAbsorbCap).toBe(e.noneAbsorbCap)
    expect(KINH_TE.reserveExp).toBe(e.reserveExp)
    expect(KINH_TE.expToGold).toBe(e.expToGold)
    expect(KINH_TE.fragmentPerAchievedDay).toBe(e.fragmentPerAchievedDay)
    expect(KINH_TE.fragmentsPerShield).toBe(e.fragmentsPerShield)
    expect(KINH_TE.firstShieldMinAchievedDays).toBe(e.firstShieldMinAchievedDays)
    expect(KINH_TE.shieldMinLevel).toBe(e.shieldMinLevel)
    expect(KINH_TE.firstShieldExpCost).toBe(e.firstShieldExpCost)
    expect(KINH_TE.laterShieldExpCost).toBe(e.laterShieldExpCost)
    expect(KINH_TE.maxUnusedShields).toBe(e.maxUnusedShields)
    expect(KINH_TE.maxLevel).toBe(e.maxLevel)
    expect(KINH_TE.postLevel10Curve).toBe(e.postLevel10Curve) // giữ ĐÚNG chữ của THAM-SO
    expect(KINH_TE.curveEnabled365Days).toBe(e.enable365DayCurve)
    expect(KINH_TE.autoAbsorbDefault).toBe(e.autoAbsorbDefault)
  })

  it('9 thanh đầu: khớp `THAM-SO.firstNineBars` VÀ đúng 9 số đầu của bảng cấp thật (§6)', () => {
    expect([...KINH_TE.firstNineBars]).toEqual(THAM_SO.economy.firstNineBars)
    expect([...KINH_TE.firstNineBars]).toEqual(BANG_THANH_EXP.slice(0, 9))
    expect(tongExpToiCap(10)).toBe(2400)
  })

  it('mảnh: đúng 1 mảnh mỗi NGÀY ĐẠT (§7.1) — không phải "mỗi lần đạt" hay "mỗi câu"', () => {
    expect(KINH_TE.fragmentPerAchievedDay).toBe(1)
  })
})

describe('P08 · ĐƯỜNG CẤP (`03` §6) — vượt thanh, dừng ở cấp 120', () => {
  it('`capTuInvestedExp`: suy cấp từ tổng thâm nhập, đúng mốc thanh', () => {
    expect(capTuInvestedExp(0)).toEqual({ level: 1, progress: 0 })
    expect(capTuInvestedExp(119)).toEqual({ level: 1, progress: 119 })
    expect(capTuInvestedExp(120)).toEqual({ level: 2, progress: 0 })
    expect(capTuInvestedExp(269)).toEqual({ level: 2, progress: 149 })
    expect(capTuInvestedExp(2399)).toEqual({ level: 9, progress: 429 })
    expect(capTuInvestedExp(2400)).toEqual({ level: 10, progress: 0 })
    expect(capTuInvestedExp(TRAN_INVESTED_EXP)).toEqual({ level: 120, progress: 0 })
    expect(TRAN_INVESTED_EXP).toBe(238200)
    expect(TRAN_INVESTED_EXP).toBe(tongExpToiCap(120))
    expect(thanhExp(120)).toBe(0) // cấp tối đa: hết thanh ⇒ "không chia cho thanh 0"
  })

  it('vượt trần đường cấp ⇒ NÉM `VUOT_DUONG_CAP`, không kẹp im lặng', () => {
    expect(() => capTuInvestedExp(TRAN_INVESTED_EXP + 1)).toThrow(/vượt trần/)
    try {
      capTuInvestedExp(TRAN_INVESTED_EXP + 1)
      expect.unreachable('phải ném')
    } catch (e) {
      expect((e as { ma?: string }).ma).toBe('VUOT_DUONG_CAP')
    }
  })

  it('bơm 200/ngày: cấp 10 ở NGÀY 12, cấp 120 ở NGÀY 1191 (nhịp game đã chốt trong bảng cấp)', () => {
    let invested = 0
    let ngayCap10: number | null = null
    let ngay = 0
    while (invested < TRAN_INVESTED_EXP) {
      ngay += 1
      invested = Math.min(TRAN_INVESTED_EXP, invested + 200)
      if (ngayCap10 === null && capTuInvestedExp(invested).level >= 10) ngayCap10 = ngay
    }
    expect(ngayCap10).toBe(12)
    expect(ngay).toBe(1191)
  })

  it('`expThieuToiCapToiDa` = trần − đã thâm nhập', () => {
    expect(expThieuToiCapToiDa(0)).toBe(TRAN_INVESTED_EXP)
    expect(expThieuToiCapToiDa(TRAN_INVESTED_EXP)).toBe(0)
    expect(expThieuToiCapToiDa(200)).toBe(TRAN_INVESTED_EXP - 200)
  })
})

describe('P08 · TỪ CHỐI đầu vào hỏng (`03` §1) — KHÔNG ép về 0', () => {
  const nen = { walletExp: 500, absorbedToday: 0, trangThaiNgay: 'achieved' as TrangThaiNgay, investedExp: 0 }
  const HONG = [Number.NaN, -1, 1.5, '500', null, undefined, Number.POSITIVE_INFINITY]

  it('`tinhHapThu`: ví / đã hấp thụ / thâm nhập hỏng ⇒ NÉM (không lặng lẽ thành 0 EXP)', () => {
    for (const x of HONG) {
      const nhan = String(x)
      expect(() => tinhHapThu({ ...nen, walletExp: x as number }), `wallet=${nhan}`).toThrow()
      expect(() => tinhHapThu({ ...nen, absorbedToday: x as number }), `absorbed=${nhan}`).toThrow()
      expect(() => tinhHapThu({ ...nen, investedExp: x as number }), `invested=${nhan}`).toThrow()
    }
    try {
      tinhHapThu({ ...nen, walletExp: Number.NaN })
      expect.unreachable('phải ném')
    } catch (e) {
      expect((e as { ma?: string }).ma).toBe('SO_KHONG_HOP_LE')
    }
  })

  it('`tinhHapThu`: số vượt miền an toàn ⇒ NÉM `TRAN_SO`', () => {
    try {
      tinhHapThu({ ...nen, walletExp: Number.MAX_SAFE_INTEGER + 2 })
      expect.unreachable('phải ném')
    } catch (e) {
      expect((e as { ma?: string }).ma).toBe('TRAN_SO')
    }
  })

  it('`tranHapThuNgay`: trạng thái lạ ⇒ NÉM (không mặc định thành "chưa học")', () => {
    expect(() => tranHapThuNgay('xyz' as TrangThaiNgay)).toThrow(/trạng thái ngày lạ/)
  })

  it('`xetKhien`: trạng thái máy chủ hỏng ⇒ NÉM', () => {
    const g = { level: 10, fragmentBalance: 21, unusedShields: 0, achievedDays: 21, firstShieldClaimed: false, walletExp: 700 }
    expect(() => xetKhien({ ...g, unusedShields: 1.5 })).toThrow()
    expect(() => xetKhien({ ...g, fragmentBalance: -1 })).toThrow()
    expect(() => xetKhien({ ...g, level: Number.NaN })).toThrow()
  })

  it('`xetDoiVang`: `x` là số NGƯỜI DÙNG đưa ⇒ từ chối bằng `ok:false`, KHÔNG ném', () => {
    for (const x of [0, -5, 1.5, Number.NaN, '10', null, undefined]) {
      const r = xetDoiVang(700, x)
      expect(r.ok, String(x)).toBe(false)
      expect(r.walletAfter, String(x)).toBe(700)
      expect(r.expTru, String(x)).toBe(0)
      expect(r.goldNhan, String(x)).toBe(0)
    }
  })
})

describe('P08 · HẤP THỤ — biên, vượt thanh, "không bù hạn mức ngày cũ" (`03` §5/§6)', () => {
  const hap = (walletExp: number, absorbedToday: number, tt: TrangThaiNgay, investedExp = 0) =>
    tinhHapThu({ walletExp, absorbedToday, trangThaiNgay: tt, investedExp })

  it('trần biên 199/200 ⇒ còn 1; đã 200 ⇒ 0; studied 120; chưa học 0', () => {
    expect(hap(999, 199, 'achieved').take).toBe(1)
    expect(hap(999, 200, 'achieved').take).toBe(0)
    expect(hap(999, 0, 'studied').take).toBe(120)
    expect(hap(999, 0, 'chua_hoc').take).toBe(0)
  })

  it('cấp 120: KHÔNG hấp thụ thêm, VÍ GIỮ NGUYÊN, `chamTranCap` = true (§6)', () => {
    const r = hap(5000, 0, 'achieved', TRAN_INVESTED_EXP)
    expect(r).toMatchObject({ take: 0, chamTranCap: true, walletAfter: 5000, investedExpAfter: TRAN_INVESTED_EXP, levelAfter: 120, progressAfter: 0 })
  })

  it('sát trần cấp: còn thiếu 80 ⇒ chỉ lấy 80 dù trần ngày còn 200', () => {
    const r = hap(999, 0, 'achieved', TRAN_INVESTED_EXP - 80)
    expect(r).toMatchObject({ take: 80, levelAfter: 120, progressAfter: 0, chamTranCap: false, walletAfter: 919 })
  })

  it('VƯỢT THANH trong MỘT lượt: thâm nhập 100 rồi hấp thụ 200 ⇒ cấp 3, tiến độ 30', () => {
    const r = hap(999, 0, 'achieved', 100)
    expect(r).toMatchObject({ take: 200, investedExpAfter: 300, levelAfter: 3, progressAfter: 30 })
  })

  it('§5 "KHÔNG bù hạn mức đã bỏ qua ngày cũ": trần là CỦA NGÀY, KHÔNG tích luỹ', () => {
    // Bỏ qua ngày (absorbedToday = 0) ⇒ vẫn chỉ 200, KHÔNG dồn thành 400 cho hôm sau.
    expect(hap(100000, 0, 'achieved').take).toBe(200)
    expect(hap(100000, 0, 'achieved').take).toBe(200)
    // Không có tham số "số ngày đã bỏ qua" ⇒ không tồn tại đường bù hạn mức.
    expect(Object.keys(hap(100000, 0, 'achieved'))).not.toContain('ngayBoQua')
    // Thu nhập nhiều KHÔNG nâng trần (§6).
    expect(hap(999999, 0, 'achieved').take).toBe(200)
  })
})

describe('P08 · KHIÊN — `claim_index`, kho đầy, first KHÔNG cần ví (`03` §7.1/§9.1)', () => {
  const nen = (o: Record<string, unknown> = {}) => ({
    level: 10,
    fragmentBalance: 21,
    unusedShields: 0,
    achievedDays: 21,
    firstShieldClaimed: false,
    walletExp: 0,
    ...o,
  })

  it('`claim_index` tăng đơn điệu, tính CẢ khiên đã dùng (§7.1 "Ghi claim_index")', () => {
    expect(xetKhien(nen())).toMatchObject({ loai: 'first', claimIndexAfter: 1, expCost: 0 })
    const l = xetKhien(nen({ firstShieldClaimed: true, unusedShields: 1, usedShields: 0, achievedDays: 42, walletExp: 700 }))
    expect(l).toMatchObject({ loai: 'later', claimIndexAfter: 2, expCost: 300 })
    const l2 = xetKhien(nen({ firstShieldClaimed: true, unusedShields: 4, usedShields: 6, achievedDays: 42, fragmentBalance: 42, walletExp: 700 }))
    expect(l2).toMatchObject({ loai: 'later', claimIndexAfter: 11, expCost: 300 })
  })

  it('FIRST KHÔNG cần ví: ví 0 vẫn nhận được khiên đầu, ví giữ nguyên (§7.1)', () => {
    expect(xetKhien(nen({ walletExp: 0 }))).toMatchObject({
      loai: 'first',
      walletAfter: 0,
      fragmentBalanceAfter: 0,
      unusedAfter: 1,
      firstClaimedAfter: true,
    })
  })

  it('§9.1 "giữ mọi khiên cũ, KỂ CẢ VƯỢT 5": kho 5/6/9 ⇒ từ chối, KHÔNG trừ mảnh/tiền', () => {
    for (const unused of [5, 6, 9]) {
      const r = xetKhien(nen({ unusedShields: unused, firstShieldClaimed: true, achievedDays: 42, fragmentBalance: 42, walletExp: 5000 }))
      expect(r, `kho ${unused}`).toMatchObject({
        loai: 'khong',
        common: false,
        fragmentBalanceAfter: 42,
        walletAfter: 5000,
        unusedAfter: unused,
        claimIndexAfter: null, // KHÔNG cấp ⇒ KHÔNG ghi `claim_index`
      })
    }
  })

  it('`claimIndexAfter` = null khi TỪ CHỐI, là số khi ĐƯỢC CẤP (§7.1 "Ghi claim_index")', () => {
    expect(xetKhien(nen({ fragmentBalance: 20 })).claimIndexAfter).toBeNull()
    expect(xetKhien(nen({ level: 9 })).claimIndexAfter).toBeNull()
    expect(xetKhien(nen({ unusedShields: 5 })).claimIndexAfter).toBeNull()
    expect(xetKhien(nen({ achievedDays: 20 })).claimIndexAfter).toBeNull()
    expect(xetKhien(nen()).claimIndexAfter).toBe(1)
  })

  it('42 ngày + 42 mảnh chưa nhận lần nào ⇒ first RỒI later (không phải đợi 21 ngày)', () => {
    const a = xetKhien(nen({ achievedDays: 42, fragmentBalance: 42, walletExp: 700 }))
    expect(a).toMatchObject({ loai: 'first', fragmentBalanceAfter: 21, walletAfter: 700, unusedAfter: 1 })
    const b = xetKhien(
      nen({
        firstShieldClaimed: a.firstClaimedAfter,
        unusedShields: a.unusedAfter,
        achievedDays: 42,
        fragmentBalance: a.fragmentBalanceAfter,
        walletExp: a.walletAfter,
      }),
    )
    expect(b).toMatchObject({ loai: 'later', fragmentBalanceAfter: 0, walletAfter: 400, unusedAfter: 2 })
  })

  it('"từ chối vì kho đầy" KHÁC "từ chối vì thiếu mảnh": cả hai đều không trừ gì', () => {
    const khoDay = xetKhien(nen({ unusedShields: 5, firstShieldClaimed: true, achievedDays: 42, walletExp: 700 }))
    const thieuManh = xetKhien(nen({ fragmentBalance: 20 }))
    expect(khoDay).toMatchObject({ loai: 'khong', common: false, fragmentBalanceAfter: 21, walletAfter: 700 })
    expect(thieuManh).toMatchObject({ loai: 'khong', common: false, fragmentBalanceAfter: 20, walletAfter: 0 })
  })
})

describe('P08 · VÍ · VÀNG — biên + dự trữ (`03` §8)', () => {
  it('ví tiêu được: 399→0 · 400→0 · 699→299 · 700→300', () => {
    expect(expTieuDuoc(399)).toBe(0)
    expect(expTieuDuoc(400)).toBe(0)
    expect(expTieuDuoc(699)).toBe(299)
    expect(expTieuDuoc(700)).toBe(300)
  })

  it('HAI lượt đổi 200 từ ví 700: lượt đầu được (ví 500), lượt sau TỪ CHỐI (§8)', () => {
    const a = xetDoiVang(700, 200)
    expect(a).toMatchObject({ ok: true, expTru: 200, goldNhan: 200, walletAfter: 500 })
    const b = xetDoiVang(a.walletAfter, 200) // ví 500 ⇒ chỉ tiêu được 100
    expect(b.ok).toBe(false)
    expect(b.walletAfter).toBe(500)
  })

  it('dự trữ 400 không bị xuyên qua: ví 700 đổi 301 ⇒ từ chối; 300 ⇒ ví còn đúng 400', () => {
    expect(xetDoiVang(700, 301).ok).toBe(false)
    expect(xetDoiVang(700, 300).walletAfter).toBe(400)
  })

  it('vàng nhận theo `expToGold` (một nguồn), cộng lên vàng đang có', () => {
    const r = xetDoiVang(700, 300, 20)
    expect(r).toMatchObject({ ok: true, expTru: 300, goldNhan: 300 * KINH_TE.expToGold, goldAfter: 20 + 300 * KINH_TE.expToGold })
  })
})

describe('P08 · NGÀY HỌC → NGÀY LỊCH (`03` §10: "không hứa 21 ngày LỊCH")', () => {
  const t2t6 = { startWeekday: 'Monday', studyWeekdays: [1, 2, 3, 4, 5] }

  it('§10 in nguyên văn: học T2–T6, bắt đầu T2 ⇒ học-12 = lịch 16, đạt-21 = lịch 29, đạt-42 = lịch 58', () => {
    expect(ngayLichTuNgayHoc({ ...t2t6, studyDay: 12 })).toBe(16)
    expect(ngayLichTuNgayHoc({ ...t2t6, studyDay: 21 })).toBe(29)
    expect(ngayLichTuNgayHoc({ ...t2t6, studyDay: 42 })).toBe(58)
  })

  it('lịch 21 là CHỦ NHẬT (không học) ⇒ mới 15 ngày đạt, CHƯA có khiên', () => {
    // Tuần 3 = lịch 15…21 (T2…CN). Lịch 21 = Chủ Nhật ⇒ ngày học gần nhất là lịch 19 = ngày học 15.
    expect(ngayLichTuNgayHoc({ ...t2t6, studyDay: 15 })).toBe(19)
    expect(ngayLichTuNgayHoc({ ...t2t6, studyDay: 16 })).toBe(22) // Thứ Hai tuần 4
    const taiLich21 = xetKhien({ level: 10, fragmentBalance: 15, unusedShields: 0, achievedDays: 15, firstShieldClaimed: false, walletExp: 700 })
    expect(taiLich21.loai).toBe('khong') // 15 NGÀY ĐẠT < 21
    // Đúng 21 NGÀY ĐẠT mới là LỊCH 29 — lệch 8 ngày lịch so với lời hứa "21 ngày lịch".
    expect(ngayLichTuNgayHoc({ ...t2t6, studyDay: 21 })).toBe(29)
  })

  it('học cả 7 ngày ⇒ ngày học = ngày lịch (không nhảy tuần)', () => {
    for (const n of [1, 7, 12, 21, 42]) {
      expect(ngayLichTuNgayHoc({ startWeekday: 'Monday', studyWeekdays: [1, 2, 3, 4, 5, 6, 7], studyDay: n })).toBe(n)
    }
  })

  it('bắt đầu giữa tuần (T4) ⇒ ngày lịch 1 vẫn là ngày HỌC 1', () => {
    expect(ngayLichTuNgayHoc({ startWeekday: 'Wednesday', studyWeekdays: [3, 4, 5], studyDay: 1 })).toBe(1)
    expect(ngayLichTuNgayHoc({ startWeekday: 'Wednesday', studyWeekdays: [3, 4, 5], studyDay: 3 })).toBe(3)
    expect(ngayLichTuNgayHoc({ startWeekday: 'Wednesday', studyWeekdays: [3, 4, 5], studyDay: 4 })).toBe(8) // sang tuần sau
  })

  it('đầu vào hỏng ⇒ NÉM (không trả số bịa)', () => {
    expect(() => ngayLichTuNgayHoc({ ...t2t6, startWeekday: 'Thứ Hai' })).toThrow(/startWeekday/)
    expect(() => ngayLichTuNgayHoc({ startWeekday: 'Monday', studyWeekdays: [], studyDay: 1 })).toThrow(/KHÁC RỖNG/)
    expect(() => ngayLichTuNgayHoc({ startWeekday: 'Monday', studyWeekdays: [1, 1], studyDay: 1 })).toThrow(/TRÙNG/)
    expect(() => ngayLichTuNgayHoc({ startWeekday: 'Monday', studyWeekdays: [0], studyDay: 1 })).toThrow(/1…7/)
    expect(() => ngayLichTuNgayHoc({ startWeekday: 'Monday', studyWeekdays: [8], studyDay: 1 })).toThrow(/1…7/)
    expect(() => ngayLichTuNgayHoc({ ...t2t6, studyDay: 0 })).toThrow(/bắt đầu từ 1/)
    expect(() => ngayLichTuNgayHoc({ ...t2t6, studyDay: 1.5 })).toThrow(/số nguyên/)
  })
})



