// @vitest-environment node
// SỬA LAG TẬN GỐC (thầy 14/11 «sửa triệt để hiện tượng lag, sửa tận gốc»): mỗi view của em từng mang NGUYÊN đề của lượt và phòng phát lại view tới MỌI máy em
// mỗi lần có em nộp / rời / về / vào ⇒ hàng chục nghìn bản đề mỗi phút (đo 14/11). Nay: máy em báo `cg: 1` ⇒ đề đi MỘT lần mỗi lượt / kết nối, view sau
// `luot.cau = null` + `luot.ck`; view y hệt lần trước ⇒ không gửi; máy em bản cũ ⇒ như cũ; `xin-view` ⇒ gửi đủ; lượt mới ⇒ đề mới đi một lần.
import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { chu, datWebSocketPairGia, taoPhongGia, type WsGia } from './_live-phong-gia'

const DE_DAI = 'Enkephalin (A) là các cấu tử pentapeptide của các endorphin. '.repeat(40)
const cau = (qid: string) => ({ qid, phan: 'I' as const, tuLuan: false, cau: { qid, maDe: 'm', phan: 'I', text: `${DE_DAI} ${qid}`, choices: ['A1', 'B1', 'C1', 'D1'], ideas: [], hinhAnh: [], kienThuc: [] }, dung: 'B', hanGiay: 90 })
const viewEm = (ws: WsGia) => chu(ws).filter((m) => m.t === 'em') as { luot?: { so: number; ck?: string; cau: unknown } | null }[]
const byteEm = (ws: WsGia) => ws.tin.filter((t): t is string => typeof t === 'string' && t.startsWith('{"t":"em"')).reduce((n, t) => n + t.length, 0)

describe('phòng Bình Phản Ứng — đề gửi một lần mỗi lượt', () => {
  beforeAll(datWebSocketPairGia)
  beforeEach(() => { vi.useFakeTimers({ now: 1_700_000_000_000 }) })
  afterEach(() => { vi.useRealTimers() })

  it('máy em mới (cg): đề chỉ đi MỘT lần; view sau không kèm đề; máy em cũ vẫn nhận đủ đề; xin-view ⇒ đủ; lượt mới ⇒ đề mới một lần', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }, { sbd: 'S3' }, { sbd: 'S4' }], null)
    const moi = await ph.noi('hs', 'S1'), cu = await ph.noi('hs', 'S2'), e3 = await ph.noi('hs', 'S3'), e4 = await ph.noi('hs', 'S4')
    await ph.gui(moi, { t: 'chao', cg: 1 })
    await ph.gui(cu, { t: 'chao' })
    await ph.gui(e3, { t: 'chao', cg: 1 })
    await ph.gui(e4, { t: 'chao', cg: 1 })
    await ph.post('/luot', cau('q1'))
    // Lượt mở ⇒ cả hai nhận đề (máy mới chưa có đề của lượt này).
    expect(viewEm(moi).pop()?.luot).toMatchObject({ so: 1, cau: { qid: 'q1' } })
    expect(viewEm(cu).pop()?.luot).toMatchObject({ so: 1, cau: { qid: 'q1' } })
    const ck = viewEm(moi).pop()!.luot!.ck
    expect(ck).toMatch(/^1:/)
    const soCu = viewEm(cu).length, deDu = JSON.stringify(viewEm(cu).pop()).length
    // Em S4 (đội 0 như S1; S2 ở đội 1) rời / về 6 lần: đội 0 bị trừ kJ ⇒ view S1 đổi thật (phải gửi), view S2 KHÔNG đổi ⇒ phòng không gửi lại cho S2.
    for (let i = 0; i < 6; i++) { await ph.gui(e4, { t: 'roi', k: 'an' }); await ph.gui(e4, { t: 've' }) }
    expect(viewEm(cu).length).toBe(soCu)
    const dsMoi = viewEm(moi), sauMoi = dsMoi.slice(dsMoi.findIndex((v) => v.luot?.cau != null) + 1) // sau bản view mang đề của lượt
    expect(sauMoi.length).toBeGreaterThan(0)
    // Máy mới: không bản view nào sau lượt mở mang đề; khoá đề giữ nguyên; mỗi bản nhỏ hơn hẳn view đủ đề.
    expect(sauMoi.every((v) => v.luot?.cau === null && v.luot?.ck === ck)).toBe(true)
    expect(Math.max(...sauMoi.map((v) => JSON.stringify(v).length)) * 3).toBeLessThan(deDu)
    // Nộp bài đổi «đã gửi» của mọi em ⇒ máy cũ nhận view (vẫn ĐỦ đề), máy mới nhận view gọn.
    await ph.gui(e3, { t: 'tra', chon: 'A' }); vi.advanceTimersByTime(200)
    expect(viewEm(cu).length).toBe(soCu + 1)
    expect(viewEm(cu).every((v) => !v.luot || (v.luot.cau as { qid?: string } | null)?.qid === 'q1')).toBe(true)
    expect(viewEm(moi).pop()!.luot).toMatchObject({ cau: null, ck })
    // Máy mới thiếu đề (vừa nạp lại màn) ⇒ xin-view ⇒ nhận ĐỦ đề.
    await ph.gui(moi, { t: 'xin-view' })
    expect(viewEm(moi).pop()?.luot).toMatchObject({ ck, cau: { qid: 'q1' } })
    // Lượt mới ⇒ đề mới đi đúng một lần, khoá mới.
    await ph.post('/luot', { ...cau('q2'), bo: true })
    const l2 = viewEm(moi).pop()!.luot!
    expect(l2).toMatchObject({ so: 2, cau: { qid: 'q2' } })
    expect(l2.ck).not.toBe(ck)
    await ph.gui(e3, { t: 'roi', k: 'an' }); await ph.gui(e3, { t: 've' })
    expect(viewEm(moi).pop()!.luot).toMatchObject({ so: 2, cau: null, ck: l2.ck })
  })

  it('kết nối mới của cùng em (nối lại) ⇒ chao nhận ĐỦ đề dù kết nối cũ đã có', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }], null)
    const a = await ph.noi('hs', 'S1'), b = await ph.noi('hs', 'S2')
    await ph.gui(a, { t: 'chao', cg: 1 }); await ph.gui(b, { t: 'chao', cg: 1 })
    await ph.post('/luot', cau('q1'))
    await ph.dong(a)
    const a2 = await ph.noi('hs', 'S1')
    await ph.gui(a2, { t: 'chao', cg: 1 })
    expect(viewEm(a2).pop()?.luot).toMatchObject({ cau: { qid: 'q1' } })
    await ph.gui(b, { t: 'roi', k: 'an' }); await ph.gui(b, { t: 've' })
    expect(viewEm(a2).every((v, i) => i === 0 || v.luot?.cau === null)).toBe(true)
  })
})
