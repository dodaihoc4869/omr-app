// @vitest-environment node
// ĐỀ + ĐÁP ÁN TẢI SẴN Ở PHÒNG CHỜ (thầy 31/10: «bấm bắt đầu là phải tức thì… Mọi kiểu mở ca khác cũng vậy», «tải luôn đề và đáp án về máy như dolingo»;
// server/src/de-truoc.ts, src/lib/khoa-de-thi.ts):
//   · em ĐANG ở phòng chờ ⇒ `/de-truoc` trả gói đề MÃ HOÁ (không đọc được, không đáp án); em không ở phòng ⇒ từ chối;
//   · trước giờ bắt đầu `/vao-thi` không trao chìa; được vào (sau giờ bắt đầu) ⇒ trao chìa; mở gói bằng chìa = ĐÚNG gói `GET /de/:maCa`;
//   · `GET /de/:maCa?phien=<etag gói>` đúng phiên bản ⇒ một dòng «không đổi»; lệch ⇒ nguyên gói;
//   · gói tờ đáp án đã khoá (`/khoa-de`) tải được ngay từ phòng chờ (chìa vẫn chỉ trao sau khi nộp).
import { afterEach, describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { taoD1That } from './_d1-that'
import { moDeTruoc } from '../src/lib/khoa-de-thi'
import { xoaDemDeTruoc } from '../server/src/de-truoc'

type Any = Record<string, any>
afterEach(() => xoaDemDeTruoc())

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
  phanII: [], phanIII: [], soCau: { I: 2, II: 0, III: 0 },
}
const KEY = { ...BANK, phanI: [{ ...BANK.phanI[0], correct: 'B', solution: 'LG1' }, { ...BANK.phanI[1], correct: 'D', solution: 'LG2' }] }

async function dung() {
  const d = taoD1That()
  const r2 = r2Gia()
  const env = { ...d.env, DE: r2 } as unknown as Any
  d.sql.prepare(`INSERT INTO ca (ma_ca, ten_ca, trang_thai, thoi_gian_phut, loai, cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, cap_nhat_luc, lop, phong_cho, de_rieng, chi_nop_3_phut_cuoi, dong_bo_gio)
    VALUES ('C1','Ca thử','mo',45,'thi','ngay',3,30,'de/C1.json',?,?,'12A',1,0,0,0)`).run(JSON.stringify({ I: 2, II: 0, III: 0 }), new Date().toISOString())
  await r2.put('de/C1.json', JSON.stringify(BANK))
  await r2.put('key/C1.json', JSON.stringify(KEY))
  return { d, env, r2 }
}
async function goi(env: Any, duong: string, than?: Any) {
  const r = await worker.fetch(new Request('https://x.test' + duong, than ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(than) } : {}), env as never)
  const txt = await r.text()
  return { j: JSON.parse(txt) as Any, txt }
}

describe('đề + đáp án tải sẵn ở phòng chờ, chìa trao lúc vào thi', () => {
  it('em ở phòng chờ ⇒ gói đề đã khoá; em ngoài phòng ⇒ từ chối; chưa bắt đầu ⇒ không chìa; bắt đầu ⇒ chìa mở ra đúng gói /de', async () => {
    const { d, env } = await dung()
    expect((await goi(env, '/de-truoc', { maCa: 'C1', sbd: '10001' })).j.ok).toBe(false) // chưa vào phòng chờ
    const cho = await goi(env, '/vao-thi', { maCa: 'C1', sbd: '10001', idThietBi: 'm1' })
    expect(cho.j).toMatchObject({ ok: true, cach: 'cho' })
    expect(cho.j.khoaDeTruoc).toBeUndefined()
    const g = await goi(env, '/de-truoc', { maCa: 'C1', sbd: '10001' })
    expect(g.j.ok).toBe(true)
    expect(g.txt).not.toMatch(/Câu 1|choices|correct|LG1/) // gói chỉ là chuỗi mã hoá
    expect(typeof g.j.phien).toBe('string')
    // thầy bấm Bắt đầu
    d.sql.prepare("UPDATE ca SET bat_dau_thi_luc = ? WHERE ma_ca = 'C1'").run(new Date().toISOString())
    const vao = await goi(env, '/vao-thi', { maCa: 'C1', sbd: '10001', idThietBi: 'm1' })
    expect(vao.j.ok).toBe(true)
    expect(typeof vao.j.khoaDeTruoc).toBe('string')
    const goiDe = { maCa: 'C1', phien: g.j.phien as string, goi: g.j.goi as string }
    const mo = await moDeTruoc(goiDe, vao.j.khoaDeTruoc)
    const de = (await goi(env, '/de/C1')).j
    expect(mo).toEqual(de)
    expect(JSON.stringify(mo)).not.toMatch(/correct|LG1/)
    expect(await moDeTruoc(goiDe, String(vao.j.khoaDeTruoc).slice(0, -3) + 'AAA')).toBeNull() // chìa hỏng
    // nhánh phòng chờ (chưa bắt đầu) KHÔNG BAO GIỜ có chìa — đã kiểm ở trên (`cho.j.khoaDeTruoc` vắng)
  })

  it('/de?phien: đúng phiên bản ⇒ «không đổi» (một dòng); thầy nối câu sau lúc tải sẵn ⇒ trả nguyên gói mới', async () => {
    const { d, env, r2 } = await dung()
    await goi(env, '/vao-thi', { maCa: 'C1', sbd: '10001', idThietBi: 'm1' })
    const g = (await goi(env, '/de-truoc', { maCa: 'C1', sbd: '10001' })).j
    const k = await goi(env, `/de/C1?phien=${encodeURIComponent(g.phien)}`)
    expect(k.j).toMatchObject({ ok: true, khongDoi: true })
    expect(k.txt.length).toBeLessThan(120)
    const MOI = { ...BANK, phanI: [...BANK.phanI, { id: 'q9', text: 'Câu nối thêm', choices: ['a', 'b', 'c', 'd'] }] }
    await r2.put('de/C1.json', JSON.stringify(MOI))
    d.sql.prepare("UPDATE ca SET cap_nhat_luc = ? WHERE ma_ca = 'C1'").run(new Date(Date.now() + 1000).toISOString())
    const k2 = (await goi(env, `/de/C1?phien=${encodeURIComponent(g.phien)}`)).j
    expect(k2.khongDoi).toBeUndefined()
    expect(k2.phanI.map((c: Any) => c.id)).toEqual(['q1', 'q2', 'q9'])
  })

  it('gói tờ đáp án đã khoá tải được ngay từ phòng chờ (chưa có lượt); em ngoài phòng ⇒ không', async () => {
    const { env } = await dung()
    expect((await goi(env, '/khoa-de', { maCa: 'C1', sbd: '10001' })).j.ok).toBe(false)
    await goi(env, '/vao-thi', { maCa: 'C1', sbd: '10001', idThietBi: 'm1' })
    const k = await goi(env, '/khoa-de', { maCa: 'C1', sbd: '10001' })
    expect(k.j.ok).toBe(true)
    expect(k.txt).not.toMatch(/correct|LG1|"B"/)
  })
})
