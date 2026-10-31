// @vitest-environment node
// ĐÁP ÁN CÂU LUYỆN TẬP XUỐNG MÁY (31/10, dap-an-may.ts): khoá riêng em + ngày; gói mã hoá gắn chặt mã câu; sai khoá / sai câu / sai ngày ⇒ không giải được;
// công tắc thầy (vắng ⇒ bật; {"bat":false} ⇒ tắt; theo danh sách em); chấm tại máy khớp tuyệt đối chấm từ tem của máy chủ; máy chủ chỉ gắn `dm` cho câu có tem.
import { afterEach, describe, expect, it } from 'vitest'
import { dapAnMayBat, dmCau, giaiDapAn, khoaDapAnEm, maHoaDapAn } from '../server/src/dap-an-may'
import { chamTaiMay, moDm, type DapAnMay } from '../src/lib/dap-an-may'
import { chamTuNiem, xoaChamNhanh } from '../server/src/cham-nhanh'
import { moNiem, xoaKhoaNiem, type NoiDungNiem } from '../server/src/niem-phong'
import { ganNiemChoCau } from '../server/src/niem-cau'
import { taoD1That } from './_d1-that'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import type { PrivateQuestion } from '../src/game/than-thu-v2/core'
import type { Env } from '../server/src/kieu'

afterEach(() => { xoaChamNhanh(); xoaKhoaNiem() })

const env = { MA_BI_MAT: 'bi-mat-thu' }

describe('đáp án xuống máy: mã hoá', () => {
  it('giải đúng bằng khoá của em, đúng câu; sai câu / sai em / sai ngày ⇒ null; gói không chứa chữ đáp án rõ', async () => {
    const k = await khoaDapAnEm(env, 'S1', '2026-10-31')
    const goi = await maHoaDapAn(k, 'DH-B8-I-3', { loai: 'tn', dung: 'C' })
    expect(await giaiDapAn(k, 'DH-B8-I-3', goi)).toEqual({ loai: 'tn', dung: 'C' })
    expect(await giaiDapAn(k, 'DH-B8-I-4', goi)).toBeNull()
    expect(await giaiDapAn(await khoaDapAnEm(env, 'S2', '2026-10-31'), 'DH-B8-I-3', goi)).toBeNull()
    expect(await giaiDapAn(await khoaDapAnEm(env, 'S1', '2026-11-01'), 'DH-B8-I-3', goi)).toBeNull()
    expect(await giaiDapAn(k, 'DH-B8-I-3', goi.slice(0, -2) + 'AA')).toBeNull()
    expect(goi).not.toMatch(/dung|"C"/)
    // cùng đáp án, hai lần mã hoá khác nhau (iv ngẫu nhiên) ⇒ không đoán được bằng so gói
    expect(await maHoaDapAn(k, 'DH-B8-I-3', { loai: 'tn', dung: 'C' })).not.toBe(goi)
    expect(await khoaDapAnEm(env, 'S1', '2026-10-31')).toBe(k)
  })
  it('công tắc thầy', () => {
    expect(dapAnMayBat(null, 'S1')).toBe(true)
    expect(dapAnMayBat('{"bat":false}', 'S1')).toBe(false)
    expect(dapAnMayBat('{"bat":true}', 'S1')).toBe(true)
    expect(dapAnMayBat('{"bat":true,"sbd":["S9"]}', 'S9')).toBe(true)
    expect(dapAnMayBat('{"bat":true,"sbd":["S9"]}', 'S1')).toBe(false)
    expect(dapAnMayBat('hỏng', 'S1')).toBe(true)
  })
})

// ---------------------------------------------------------------- chấm tại máy khớp máy chủ
const LOI_GIAI = { buoc: ['Viết phương trình', 'Bảo toàn N'] }
const DE: Array<{ p: 'I' | 'II' | 'III'; c: string; tra: string[] }> = [
  { p: 'I', c: 'C', tra: ['C', 'c', ' C ', 'A', 'B', 'D', '', 'E', 'CC', 'c.'] },
  { p: 'II', c: 'DSDS', tra: ['DSDS', 'dsds', ' DSDS ', 'DSDD', 'SSSS', 'DSD', 'DSDSX', '', 'ĐSĐS'] },
  { p: 'III', c: '24', tra: ['24', '24.0', '24,0', ' 24 ', '2,4', '240', '23', 'abc', '', '24.00', '0024'] },
  { p: 'III', c: '0,25', tra: ['0,25', '0.25', '.25', '0,250', '0,2', '1/4', '25', '0.26'] },
  { p: 'III', c: '1,5', tra: ['1,5', '1.5', '1,50', '15', '1', '1,6'] },
]
const MS = [undefined, -5, 1200, 5000, 7999, 8000, 15000, '6000', 'x']

describe('chấm tại máy = chấm từ tem của máy chủ (chamTuNiem)', () => {
  it('mọi phần / đáp án / thời gian làm / cờ OMNI: máy có kết quả ⇒ trùng máy chủ; máy chủ không chấm nhanh ⇒ máy cũng không', () => {
    let soSo = 0
    for (const d of DE) for (const tra of d.tra) for (const ms of MS) for (const o of [0, 1] as const) for (const y of [undefined, 9000]) {
      const nd: NoiDungNiem = { v: 1, e: Date.now() + 60_000, q: 'Q1', r: 'v1', g: 'G1', p: d.p, c: d.c, l: LOI_GIAI, m: [{ src: 'a.png', viTri: 'sau_loi_giai' }], t: 60, h: 0, o, ...(y ? { y, u: 0 } : {}) }
      const may = chamTaiMay({ p: d.p, c: d.c, l: LOI_GIAI, m: nd.m, o, ...(y ? { y, u: 0 } : {}) }, tra, ms)
      const chu = chamTuNiem('S1', nd, { session: 'P1', qid: 'Q1', answer: tra, msLam: ms })
      if (!chu) { expect(may, `${d.p} ${tra} ${ms} o${o}`).toBeNull(); continue }
      if (!may) { expect(!chu.correct && o === 1, `${d.p} ${tra} ${ms}`).toBe(true); continue } // máy để máy chủ quyết lướt
      soSo++
      expect({ c: may.correct, a: may.answer, t: may.traLoi, l: may.solution, m: may.solutionImages }, `${d.p} «${tra}» ${ms}`).toEqual({ c: chu.correct, a: chu.answer, t: chu.traLoi, l: chu.solution, m: chu.solutionImages })
    }
    expect(soSo).toBeGreaterThan(300)
  })
})

// ---------------------------------------------------------------- máy chủ gắn `dm`
const cauMau = (o: Partial<PrivateQuestion> = {}): PrivateQuestion => ({
  qid: 'Q1', maDe: 'DH', version: 'v1', group: 'G1', phan: 'I', text: 'Amin X có công thức nào sau đây? '.repeat(6), choices: ['CH5N', 'C2H7N', 'C3H9N', 'C4H11N'], ideas: [],
  hinhAnh: [{ src: 'a.png', viTri: 'sau_loi_giai' }, { src: 'b.png', viTri: 'de' }], dang: 'amin', tenDang: 'Amin', mucDo: 'TH', sao: 2, kienThuc: ['k1'], correct: 'C', solution: LOI_GIAI, reviewed: true, ...o,
} as PrivateQuestion)

describe('máy chủ gắn đáp án mã hoá vào câu luyện tập', () => {
  it('bật (mặc định) ⇒ câu có tem mang `dm`, mở ra đúng phần chấm của tem; tắt ⇒ không; câu không tem (tự luận / ngoài kênh số) ⇒ không', async () => {
    const d = taoD1That()
    const env = { ...d.env, MA_BI_MAT: 'bi-mat-thu' } as unknown as Env
    xoaDemCauHinh(env)
    const rieng = [cauMau(), cauMau({ qid: 'Q2', phan: 'III', correct: '1/3' }), cauMau({ qid: 'Q3', phan: 'II', correct: 'DSDS', ideas: ['a', 'b', 'c', 'd'], choices: [] })]
    const cong = rieng.map((q) => ({ qid: q.qid } as Record<string, unknown>))
    await ganNiemChoCau(env, 'S1', cong, rieng, false)
    expect(typeof cong[0]!.dm).toBe('string')
    expect(cong[1]!.dm).toBeUndefined() // ngoài kênh số ⇒ không tem, không dm
    expect(JSON.stringify(cong)).not.toMatch(/"correct"|Bảo toàn N/)
    const da = await moDm('Q1', cong[0]!.dm) as DapAnMay
    const nd = (await moNiem(env, 'S1', 'Q1', cong[0]!.sk))!
    expect(da).toEqual({ p: nd.p, c: nd.c, l: nd.l, m: nd.m, o: nd.o })
    expect(await moDm('Q2', cong[0]!.dm)).toBeNull() // gói câu này không mở được cho câu khác
    expect((await moDm('Q3', cong[2]!.dm))?.c).toBe('DSDS')
    // thầy tắt ⇒ không gắn
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('dap_an_tren_may', '{\"bat\":false}', 'x')").run()
    xoaDemCauHinh(env)
    const cong2 = rieng.map((q) => ({ qid: q.qid } as Record<string, unknown>))
    await ganNiemChoCau(env, 'S1', cong2, rieng, false)
    expect(typeof cong2[0]!.sk).toBe('string')
    expect(cong2[0]!.dm).toBeUndefined()
  })
  it('dmCau: «khoá.gói»; thiếu bí mật ⇒ undefined', async () => {
    const dm = (await dmCau({ MA_BI_MAT: 'b' }, 'S1', 'Q1', { p: 'I', c: 'A', l: null, m: [], o: 0 }))!
    expect(dm.split('.')).toHaveLength(2)
    expect((await moDm('Q1', dm))?.c).toBe('A')
    expect(await dmCau({ MA_BI_MAT: '' }, 'S1', 'Q1', { p: 'I', c: 'A', l: null, m: [], o: 0 })).toBeUndefined()
  })
})
