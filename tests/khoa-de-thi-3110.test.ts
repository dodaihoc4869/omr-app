// @vitest-environment node
// TỜ ĐÁP ÁN CA KIỂM TRA TẢI SẴN ĐÃ KHOÁ — CHÌA TRAO KHI NỘP (thầy 31/10 «Làm luôn đi», server/src/khoa-de-thi.ts, src/lib/khoa-de-thi.ts):
//   · `/khoa-de`: chỉ em có lượt trong ca; gói là chuỗi mã hoá (không đáp án, không lời giải rõ);
//   · ca «công bố ngay» + em báo giữ gói đúng phiên bản ⇒ `/nop` chỉ trao chìa; mở gói bằng chìa = ĐÚNG tờ đáp án đường cũ trả;
//   · thầy sửa đáp án sau khi em tải gói ⇒ lệch phiên bản ⇒ `/nop` trả tờ MỚI như cũ; chìa em này không mở gói em khác;
//   · ca chưa công bố ⇒ không chìa, không tờ; công bố sau ⇒ `ketQua` trao chìa (cùng cổng công bố).
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { taoD1That } from './_d1-that'
import { moGoiDe } from '../src/lib/khoa-de-thi'

type Any = Record<string, any>

function r2Gia() {
  const kho = new Map<string, { text: string; etag: string }>()
  let n = 0
  return {
    async get(key: string, tuyChon?: { onlyIf?: { etagDoesNotMatch?: string } }) {
      const v = kho.get(key)
      if (!v) return null
      if (tuyChon?.onlyIf?.etagDoesNotMatch === v.etag) return { key, etag: v.etag, httpEtag: `"${v.etag}"` }
      return { key, etag: v.etag, httpEtag: `"${v.etag}"`, body: new Response(v.text).body, arrayBuffer: async () => new TextEncoder().encode(v.text).buffer }
    },
    async put(key: string, value: string) { kho.set(key, { text: value, etag: `e${++n}` }); return {} },
    async delete(key: string) { kho.delete(key) },
  }
}
const BANK = {
  phanI: [{ id: 'q1', text: 'Câu 1', choices: ['a', 'b', 'c', 'd'] }, { id: 'q2', text: 'Câu 2', choices: ['a', 'b', 'c', 'd'] }],
  phanII: [{ id: 'q3', text: 'Câu 3', ideas: ['a', 'b', 'c', 'd'] }],
  phanIII: [{ id: 'q4', text: 'Câu 4' }],
  soCau: { I: 2, II: 1, III: 1 },
}
const KEY = {
  phanI: [{ ...BANK.phanI[0], correct: 'B', solution: 'LG1' }, { ...BANK.phanI[1], correct: 'D', solution: 'LG2' }],
  phanII: [{ ...BANK.phanII[0], correct: ['D', 'S', 'D', 'S'], solution: 'LG3' }],
  phanIII: [{ ...BANK.phanIII[0], correct: '2.5', solution: 'LG4' }],
  soCau: { I: 2, II: 1, III: 1 },
}
const DA = { phanI: { q1: 'B', q2: 'A' }, phanII: { q3: ['D', 'S', null, 'S'] }, phanIII: { q4: '2,5' } }

async function dung(congBo = 'ngay') {
  const d = taoD1That()
  const r2 = r2Gia()
  const env = { ...d.env, DE: r2 } as unknown as Any
  d.sql.prepare(`INSERT INTO ca (ma_ca, ten_ca, trang_thai, thoi_gian_phut, loai, cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, cap_nhat_luc, lop, phong_cho, de_rieng, chi_nop_3_phut_cuoi, dong_bo_gio)
    VALUES ('C1','Ca thử','mo',45,'thi',?,3,30,'de/C1.json',?,?,'12A',0,0,0,0)`).run(congBo, JSON.stringify({ I: 2, II: 1, III: 1 }), new Date().toISOString())
  await r2.put('de/C1.json', JSON.stringify(BANK))
  await r2.put('key/C1.json', JSON.stringify(KEY))
  return { d, env, r2 }
}
async function goi(env: Any, duong: string, than: Any) {
  const r = await worker.fetch(new Request('https://x.test' + duong, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(than) }), env as never)
  const txt = await r.text()
  return { j: JSON.parse(txt) as Any, txt }
}
// mở bằng ĐÚNG hàm của máy em (mảnh nạp lười tự mở AES-GCM) ⇒ canh định dạng máy chủ ↔ máy em không lệch nhau
const mo = (sbd: string, goiDe: { goi: string; phien: string }, chia: string) => moGoiDe({ maCa: 'C1', phien: goiDe.phien, goi: goiDe.goi }, sbd, chia, goiDe.phien)

describe('tờ đáp án ca kiểm tra tải sẵn đã khoá, chìa trao khi nộp', () => {
  it('công bố ngay: gói không lộ đáp án; nộp kèm gói ⇒ chỉ chìa; mở gói = đúng tờ đường cũ; chìa em này không mở gói em khác', async () => {
    const { env } = await dung('ngay')
    for (const sbd of ['10001', '10002']) expect((await goi(env, '/vao-thi', { maCa: 'C1', sbd, idThietBi: 'm' + sbd })).j.ok).toBe(true)
    expect((await goi(env, '/khoa-de', { maCa: 'C1', sbd: '99999' })).j.ok).toBe(false) // chưa vào ca ⇒ không gói
    const g1 = (await goi(env, '/khoa-de', { maCa: 'C1', sbd: '10001' }))
    expect(g1.j.ok).toBe(true)
    expect(g1.txt).not.toMatch(/LG1|correct|"B"/)
    const g2 = (await goi(env, '/khoa-de', { maCa: 'C1', sbd: '10002' })).j
    const n1 = await goi(env, '/nop', { maCa: 'C1', sbd: '10001', dapAn: DA, coGoiDe: true, phienGoi: g1.j.phien })
    expect(n1.j).toMatchObject({ ok: true, congBo: 'ngay', phienGoi: g1.j.phien })
    expect(typeof n1.j.khoaKq).toBe('string')
    expect(n1.j.keyBank).toBeUndefined()
    expect(n1.txt.length).toBeLessThan(400) // chỉ chìa, không ~tờ đáp án
    expect(await mo('10001', g1.j as never, n1.j.khoaKq)).toEqual(KEY)
    expect(await mo('10002', g2 as never, n1.j.khoaKq)).toBeNull() // chìa của em khác
    // không kèm gói ⇒ đường cũ: nguyên tờ đáp án
    const n2 = await goi(env, '/nop', { maCa: 'C1', sbd: '10002', dapAn: DA })
    expect(n2.j.keyBank).toEqual(KEY)
    expect(n2.j.khoaKq).toBeUndefined()
  })

  it('thầy sửa đáp án sau khi em tải gói ⇒ lệch phiên bản ⇒ nộp nhận tờ MỚI (đường cũ), không chìa', async () => {
    const { env, r2 } = await dung('ngay')
    expect((await goi(env, '/vao-thi', { maCa: 'C1', sbd: '10001', idThietBi: 'm1' })).j.ok).toBe(true)
    const g = (await goi(env, '/khoa-de', { maCa: 'C1', sbd: '10001' })).j
    const KEY2 = { ...KEY, phanI: [{ ...KEY.phanI[0], correct: 'A' }, KEY.phanI[1]] }
    await r2.put('key/C1.json', JSON.stringify(KEY2))
    const n = await goi(env, '/nop', { maCa: 'C1', sbd: '10001', dapAn: DA, coGoiDe: true, phienGoi: g.phien })
    expect(n.j.khoaKq).toBeUndefined()
    expect(n.j.keyBank).toEqual(KEY2)
  })

  it('ca chưa công bố ⇒ nộp không chìa, không tờ; thầy công bố sau ⇒ ketQua trao chìa (mở ra đúng tờ), không kèm gói ⇒ tờ như cũ', async () => {
    const { d, env } = await dung('khong')
    expect((await goi(env, '/vao-thi', { maCa: 'C1', sbd: '10001', idThietBi: 'm1' })).j.ok).toBe(true)
    const g = (await goi(env, '/khoa-de', { maCa: 'C1', sbd: '10001' })).j
    const n = await goi(env, '/nop', { maCa: 'C1', sbd: '10001', dapAn: DA, coGoiDe: true, phienGoi: g.phien })
    expect(n.j.khoaKq).toBeUndefined()
    expect(n.j.keyBank).toBeUndefined()
    const truoc = await goi(env, '/goi', { action: 'ketQua', maCa: 'C1', sbd: '10001', coGoiDe: true, phienGoi: g.phien })
    expect(truoc.j.sanSang).toBe(false)
    expect(truoc.j.khoaKq).toBeUndefined()
    d.sql.prepare("UPDATE ca SET cong_bo = 'ngay' WHERE ma_ca = 'C1'").run()
    const sau = await goi(env, '/goi', { action: 'ketQua', maCa: 'C1', sbd: '10001', coGoiDe: true, phienGoi: g.phien })
    expect(sau.j.sanSang).toBe(true)
    expect(sau.j.keyBank).toBeUndefined()
    expect(await mo('10001', g as never, sau.j.khoaKq)).toEqual(KEY)
    const cu = await goi(env, '/goi', { action: 'ketQua', maCa: 'C1', sbd: '10001' })
    expect(cu.j.keyBank).toEqual(KEY)
  })
})
