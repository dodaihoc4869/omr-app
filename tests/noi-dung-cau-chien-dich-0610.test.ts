// @vitest-environment node
// NỘI DUNG CÂU CHO TỜ CHỮA CỦA CHIẾN DỊCH (`/gv/chien-dich` action `noi-dung-cau`) — thầy 06/10:
//   "Mở câu chữa các chiến dịch đã xong của lớp 11 vẫn còn lẫn rất nhiều các câu thuộc lớp 10. Bạn áp dụng chặn câu luôn cho các chiến dịch đã xong nhé
//    và tờ chữa phải loại bỏ hết câu nhầm khối".
// GỐC LỖI: danh sách chữa của máy chủ đã sạch khối nhưng không mang nội dung câu (đoạn đính nội dung cũ chọn cột `phan` KHÔNG CÓ trong `game_v2_question`, lỗi bị nuốt),
// nên máy thầy đoán nội dung ⇒ lẫn câu tờ khác (thường khối 10). Nay máy chủ trả nội dung ĐÚNG mã câu qua CÙNG cổng khối với danh sách.
// Kho: tests/_kho-3-khoi-0510.ts (tờ khối 10 / 11 / 12 + tờ không rõ khối + tờ mâu thuẫn khối); chiến dịch lớp 11 thầy chọn cả 5 tờ (luật C: giữ đúng thầy chọn).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gvChienDich } from '../server/src/srs2-gv'
import { cauChoThay, TOI_DA_QID_NOI_DUNG } from '../server/src/noi-dung-cau-chien-dich'
import { demChanKhoi, xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { CAC_TO, DANG, TO, TO_LA, TO_MT, cacQidCua, dungKho, ghiSai, laCauDung11, mauMoiTo } from './_kho-3-khoi-0510'
import type { D1That } from './_d1-that'

const NGAY = '2026-10-06'
const T0 = Date.parse(`${NGAY}T10:00:00+07:00`)
const MOT_NGAY = 86_400_000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemChanKhoi(); vi.spyOn(console, 'log').mockImplementation(() => undefined) })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

const batHoa2 = (d: D1That) => { d.sql.exec(`INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["11","10",""]}','x')`); xoaDemCauHinh(d.env) }
async function giao(d: D1That, maDe: string[], lop: string | undefined = '11', nowMs = T0 - 2 * MOT_NGAY) {
  const r = await gvChienDich(d.env, { action: 'tao', ten: 'Ôn tổng hợp', ...(lop ? { lop } : {}), maDe, hanNop: '2026-10-20', theLucNgay: 60, raiDeu: false }, nowMs)
  expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
  return String(r.id)
}
const qidCuaChienDich = (d: D1That, id: string): string[] => JSON.parse((d.sql.prepare('SELECT qid_json FROM chien_dich WHERE id = ?').get(id) as { qid_json: string }).qid_json)
type KetQua = { ok: boolean; error?: string; khoiDich: number[]; cau: Record<string, Record<string, any>>; boKhoi: string[]; khongCo: string[] }
const xin = (d: D1That, id: string, qids: string[]) => gvChienDich(d.env, { action: 'noi-dung-cau', id, qids }, T0) as unknown as Promise<KetQua>
const laDungHoacKhongRo = (q: string) => laCauDung11(q) || q.startsWith(`${TO_LA}-`)

describe('noi-dung-cau — chiến dịch lớp 11 thầy chọn cả 5 tờ: nội dung CHỈ câu đúng khối', () => {
  it('xin MỌI mã của chiến dịch ⇒ có nội dung đủ câu khối 11; câu khối 10 / 12 / mâu thuẫn bị chặn (không nội dung, không chữ nào của tờ ấy)', async () => {
    const d = await dungKho()
    const id = await giao(d, CAC_TO)
    const tatCa = qidCuaChienDich(d, id)
    expect(tatCa.length).toBeGreaterThan(60)
    expect(tatCa.length).toBeLessThanOrEqual(TOI_DA_QID_NOI_DUNG)
    const r = await xin(d, id, tatCa)
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.khoiDich).toEqual([11])
    const co = Object.keys(r.cau)
    // mọi mã tờ khối 11 đều có nội dung
    expect(cacQidCua(TO[11]).filter((q) => !co.includes(q)), 'câu khối 11 thiếu nội dung').toEqual([])
    // nội dung CHỈ câu khối 11 (tờ không rõ khối được giữ như mọi danh sách lớp — `B_GIU_KHONG_RO`)
    expect(co.filter((q) => !laDungHoacKhongRo(q)), 'câu khác khối lọt vào nội dung').toEqual([])
    expect(co.some((q) => q.startsWith(`${TO[10]}-`) || q.startsWith(`${TO[12]}-`) || q.startsWith('DH-10-C9-B1-'))).toBe(false)
    // mọi câu khối 10 / 12 / mâu thuẫn của chiến dịch nằm ở `boKhoi`; không câu khối 11 nào bị chặn nhầm
    const khacKhoi = tatCa.filter((q) => !laDungHoacKhongRo(q))
    expect(khacKhoi.length).toBeGreaterThan(30)
    expect([...r.boKhoi].sort()).toEqual([...khacKhoi].sort())
    expect(r.boKhoi.filter(laCauDung11)).toEqual([])
    // không chữ nào của tờ khối khác trong nội dung trả ra
    const chu = JSON.stringify(r.cau)
    for (const to of [TO[10], TO[12], TO_MT]) expect(chu.includes(`của ${to}`), `chữ của tờ ${to} lọt ra`).toBe(false)
    // bảo toàn: mỗi mã xin rơi đúng một chỗ
    expect(co.length + r.boKhoi.length + r.khongCo.length).toBe(tatCa.length)
    expect(demChanKhoi()['lop:noi_dung_cau']?.khac_khoi ?? 0).toBeGreaterThan(0)
  })

  it('hình dạng nội dung đúng khuôn Ngân hàng đề của thầy: Phần I (4 phương án + đáp án chữ), Phần II (mảng 4 Đ/S), Phần III (đáp số), chuyên đề, dạng, lời giải', async () => {
    const d = await dungKho()
    const id = await giao(d, CAC_TO)
    const r = await xin(d, id, [`${TO[11]}-I-1`, `${TO[11]}-II-1`, `${TO[11]}-III-1`])
    const [p1, p2, p3] = [`${TO[11]}-I-1`, `${TO[11]}-II-1`, `${TO[11]}-III-1`].map((q) => r.cau[q]!)
    expect(p1).toMatchObject({ id: `${TO[11]}-I-1`, phan: 'I', correct: 'B', chuyenDe: 'CD1', dang: { ma: DANG, ten: 'Dạng A' } })
    expect(p1.choices).toHaveLength(4)
    expect(p1.text).toContain(TO[11])
    expect(p2).toMatchObject({ phan: 'II', correct: ['D', 'S', 'D', 'S'], chuyenDe: 'CD1' })
    expect(p2.ideas).toHaveLength(4)
    expect(p3).toMatchObject({ phan: 'III', correct: '0,5', chuyenDe: 'CD1' })
    // lời giải (có cấu trúc) đi theo câu — đúng thứ đã lưu ở chỉ mục game (`solution`)
    const goc = JSON.parse((d.sql.prepare('SELECT json FROM game_v2_question WHERE qid = ?').get(`${TO[11]}-I-1`) as { json: string }).json)
    if (goc.solution && typeof goc.solution === 'object') expect(p1.loiGiai).toEqual(goc.solution)
    else if (typeof goc.solution === 'string') expect(p1.explanation).toBe(goc.solution)
    expect(JSON.stringify(p1.loiGiai ?? p1.explanation ?? '')).toContain('Lời giải')
  })

  it('CHỈ câu của chính chiến dịch: mã ngoài chiến dịch (dù có trong kho, dù khối 11) không có nội dung — vào `khongCo`, không vào `boKhoi`', async () => {
    const d = await dungKho()
    const id = await giao(d, [TO[11]])
    const ngoai = `${TO[10]}-I-1`
    const r = await xin(d, id, [`${TO[11]}-I-1`, ngoai, 'khong-co-trong-kho-I-9'])
    expect(Object.keys(r.cau)).toEqual([`${TO[11]}-I-1`])
    expect([...r.khongCo].sort()).toEqual([ngoai, 'khong-co-trong-kho-I-9'].sort())
    expect(r.boKhoi).toEqual([])
  })

  it('NHẤT QUÁN với danh sách: mọi câu Buổi chữa / "Cần thầy dạy lại" máy chủ trả đều có nội dung, không câu nào bị chặn; dòng danh sách có `phan`, không còn `cau` rỗng-lẫn', async () => {
    const d = await dungKho()
    batHoa2(d)
    const id = await giao(d, CAC_TO, '11', T0 - 9 * MOT_NGAY)
    for (const s of ['S1', 'S2', 'S4']) await ghiSai(d, s, mauMoiTo(3), T0 - 5 * MOT_NGAY, { soLan: 5, nguon: ['game'] })
    const bc = await gvChienDich(d.env, { action: 'buoi-chua', id }, T0) as Record<string, any>
    const bang = await gvChienDich(d.env, { action: 'bang', id }, T0) as Record<string, any>
    expect(bc.ok && bang.ok).toBe(true)
    const trongDs = [...new Set([...(bc.cau as { qid: string }[]), ...(bang.canDayLai as { qid: string }[])].map((x) => x.qid))]
    expect(trongDs.length).toBeGreaterThan(0)
    for (const x of [...bc.cau, ...bang.canDayLai] as { phan?: string; cau?: unknown }[]) {
      expect(['I', 'II', 'III']).toContain(x.phan)
      expect(x.cau, 'đoạn đính nội dung hỏng đã gỡ — nội dung đi lệnh `noi-dung-cau`').toBeUndefined()
    }
    const r = await xin(d, id, trongDs)
    expect(r.boKhoi, 'cổng nội dung phải cùng kết luận với cổng danh sách').toEqual([])
    expect(Object.keys(r.cau).sort()).toEqual([...trongDs].sort())
    expect(r.khongCo).toEqual([])
  })

  it('câu tự luận / JSON hỏng / thiếu ở chỉ mục ⇒ KHÔNG nội dung (không đoán), vào `khongCo`', async () => {
    const d = await dungKho()
    const id = await giao(d, [TO[11]])
    const tuLuan = `${TO[11]}-I-2`
    const hong = `${TO[11]}-I-3`
    const mat = `${TO[11]}-I-4`
    d.sql.prepare("UPDATE game_v2_question SET json = json_set(json, '$.tuLuan', json('true')) WHERE qid = ?").run(tuLuan)
    d.sql.prepare("UPDATE game_v2_question SET json = '{khong-phai-json' WHERE qid = ?").run(hong)
    d.sql.prepare('DELETE FROM game_v2_question WHERE qid = ?').run(mat)
    const r = await xin(d, id, [`${TO[11]}-I-1`, tuLuan, hong, mat])
    expect(Object.keys(r.cau)).toEqual([`${TO[11]}-I-1`])
    expect([...r.khongCo].sort()).toEqual([tuLuan, hong, mat].sort())
  })

  it('mã chiến dịch lạ ⇒ lỗi rõ; vượt trần số mã một lượt ⇒ chỉ xét phần đầu (không treo máy chủ)', async () => {
    const d = await dungKho()
    const loi = await gvChienDich(d.env, { action: 'noi-dung-cau', id: 'khong-co', qids: ['a'] }, T0) as Record<string, any>
    expect(loi.ok).toBe(false)
    expect(String(loi.error)).toContain('Không tìm thấy chiến dịch')
    const id = await giao(d, [TO[11]])
    const nhieu = Array.from({ length: TOI_DA_QID_NOI_DUNG + 30 }, (_, i) => `x-I-${i}`)
    const r = await xin(d, id, nhieu)
    expect(r.khongCo).toHaveLength(TOI_DA_QID_NOI_DUNG)
    expect(Object.keys(r.cau)).toEqual([])
  })
})

describe('cauChoThay — đổi câu chỉ mục game sang khuôn Ngân hàng đề của thầy (thuần)', () => {
  const goc = (o: Record<string, unknown>) => ({ qid: 'T-II-1', phan: 'II', text: 'Cho các ý:', ideas: ['a', 'b', 'c', 'd'], correct: 'DSSD', mucDo: 'hieu', dang: 'X.Y.Z', tenDang: 'Dạng Z', kienThuc: ['K1'], sao: 2, solution: { chot: 'Chốt.' }, ...o })
  it('Phần II: chuỗi "DSSD" ⇒ mảng 4; lời giải cấu trúc ⇒ `loiGiai`; sao ⇒ `canChua.sao`; chuyên đề cắt khoảng trắng', () => {
    const c = cauChoThay(goc({}), '  Este – Lipit ')!
    expect(c).toMatchObject({ id: 'T-II-1', phan: 'II', correct: ['D', 'S', 'S', 'D'], loiGiai: { chot: 'Chốt.' }, mucDo: 'hieu', dang: { ma: 'X.Y.Z', ten: 'Dạng Z' }, kienThuc: ['K1'], canChua: { sao: 2 }, chuyenDe: 'Este – Lipit' })
    expect(c.explanation).toBeUndefined()
  })
  it('lời giải dạng chuỗi ⇒ `explanation`; không chuyên đề ⇒ không đặt trường; mức độ lạ / sao lạ bị bỏ', () => {
    const c = cauChoThay(goc({ solution: 'Giải thích.', mucDo: 'kho', sao: 7 }), '')!
    expect(c.explanation).toBe('Giải thích.')
    expect(c.loiGiai).toBeUndefined()
    expect('chuyenDe' in c).toBe(false)
    expect('mucDo' in c).toBe(false)
    expect('canChua' in c).toBe(false)
  })
  it('ảnh / bảng đi theo câu (kể cả ảnh sau lời giải — đường của thầy)', () => {
    const c = cauChoThay(goc({ phan: 'I', choices: ['A1', 'B1', 'C1', 'D1'], correct: 'C', ideas: [], hinhAnh: [{ src: 'data:x', viTri: 'sau_loi_giai' }], table: [['a', 'b']], imageDataUrl: 'data:y', thanCauImg: 'data:z', choiceImgs: ['', '', '', ''] }), 'CD')!
    expect(c).toMatchObject({ phan: 'I', correct: 'C', choices: ['A1', 'B1', 'C1', 'D1'], hinhAnh: [{ src: 'data:x', viTri: 'sau_loi_giai' }], table: [['a', 'b']], imageDataUrl: 'data:y', thanCauImg: 'data:z' })
  })
  it('câu hỏng ⇒ null: không đề, sai phần, thiếu phương án, đáp án sai khuôn, tự luận, không phải đối tượng', () => {
    for (const x of [goc({ text: ' ' }), goc({ phan: 'IV' }), goc({ ideas: ['a', 'b'] }), goc({ correct: 'DS' }), goc({ tuLuan: true }), goc({ phan: 'I', choices: ['a', 'b', 'c'], correct: 'A' }), goc({ phan: 'I', choices: ['a', 'b', 'c', 'd'], correct: 'E' }), goc({ phan: 'III', correct: ' ' }), goc({ qid: '' }), null, 'x', [], undefined]) {
      expect(cauChoThay(x, 'CD'), JSON.stringify(x)).toBeNull()
    }
  })
})
