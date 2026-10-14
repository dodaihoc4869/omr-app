// @vitest-environment node
// HỎI THẦY v2 · KHỐI HÌNH (bản vẽ docs/ban-ve-hoi-thay-v2-1410, thầy 14/10: "Làm mọi thứ tốt nhất để hs hỏi cái là hiểu được bài ngay"):
// máy chủ làm sạch sơ đồ · thí nghiệm ảo · hiện tượng → nhóm chức · phương trình · tính nhanh · bẫy; tối đa 3 khối hình; ++đúng++ / !!sai!!;
// em ĐANG LÀM ⇒ không phương trình, không tính nhanh, sơ đồ chỉ giữ ký hiệu đề, nhãn ống ≤ 4 ký tự, không tô "đúng"; chữ phẳng có chữ khối.
import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { HIEN_TUONG, SCHEMA_TRA_LOI, SCHEMA_TRA_LOI_CU, chuPhang, lamSachCauTruc } from '../server/src/hoi-tro-ly-cau-truc'
import { CHI_DAN_THAY, chanLoDapAn, CAU_CHUA_NOP, xoaNhoTram } from '../server/src/hoi-tro-ly'

const MAU_DU = {
  lienQuan: true,
  yChinh: 'Muối là ++CH3COONa++, không phải !!C2H5COONa!! ⇒ ==8,2 gam==.',
  soDo: { nut: ['Tinh bột', 'Glucose (X)', 'Ethanol (Y)', 'Acetic acid'], dk: ['H2O, H^+, t°', 'men rượu', 'O2, men giấm', 'thừa'] },
  thiNghiem: [
    { nhan: 'X', thuoc: 'Quỳ tím', hien: 'quy-xanh', chu: 'Quỳ hoá xanh', phu: 'môi trường base' },
    { nhan: 'Y', thuoc: 'AgNO3/NH3, t°', hien: 'trang-bac', chu: 'Lớp bạc sáng', phu: '' },
    { nhan: 'Z', thuoc: 'Nước bromine', hien: 'lua-chay', chu: 'Mã lạ bị bỏ' },
  ],
  nhanBiet: [{ thuoc: 'Quỳ tím', hien: 'quy-xanh', chu: 'hoá xanh', nhom: '–NH2 gắn gốc no' }],
  phuongTrinh: [{ pt: 'CH3COOC2H5 + NaOH → CH3COONa + C2H5OH', dk: 't°', chinh: 'CH3COONa' }],
  tinh: { dong: ['n ester | 8,8 : 88 | 0,1 mol', 'm muối | 0,1 × 82 | 8,2 gam'], dapSo: '8,2 gam' },
  bay: { tieuDe: 'Chỗ em nhầm', chu: 'Em lấy !!gốc ethyl!! làm gốc muối.' },
  ghiNho: 'Muối giữ **gốc acid** RCOO–.',
}

describe('hàm thuần', () => {
  it('lược đồ: mã hiện tượng là danh sách đóng, khớp chỉ dẫn; mọi trường có trong propertyOrdering', () => {
    expect(SCHEMA_TRA_LOI.properties.thiNghiem.items.properties.hien.enum).toEqual([...HIEN_TUONG])
    expect(SCHEMA_TRA_LOI.properties.nhanBiet.items.properties.hien.enum).toEqual([...HIEN_TUONG])
    expect([...SCHEMA_TRA_LOI.propertyOrdering].sort()).toEqual(Object.keys(SCHEMA_TRA_LOI.properties).sort())
    for (const m of HIEN_TUONG) expect(CHI_DAN_THAY).toContain(m)
    for (const k of ['soDo', 'thiNghiem', 'nhanBiet', 'phuongTrinh', 'tinh', 'bay', '++…++', '!!…!!']) expect(CHI_DAN_THAY).toContain(k)
  })

  it('tối đa 3 khối hình theo thứ tự soDo → thiNghiem → nhanBiet → phuongTrinh → tinh; bẫy không tính', () => {
    const c = lamSachCauTruc(MAU_DU, false)!
    expect(c.soDo).toEqual({ nut: [{ ten: 'Tinh bột', nhan: '' }, { ten: 'Glucose', nhan: 'X' }, { ten: 'Ethanol', nhan: 'Y' }, { ten: 'Acetic acid', nhan: '' }], dk: ['H2O, H^+, t°', 'men rượu', 'O2, men giấm'] })
    expect(c.thiNghiem!.map((o) => o.hien)).toEqual(['quy-xanh', 'trang-bac']) // mã lạ bị bỏ
    expect(c.nhanBiet).toEqual([{ thuoc: 'Quỳ tím', hien: 'quy-xanh', chu: 'hoá xanh', nhom: '–NH2 gắn gốc no' }])
    expect(c.phuongTrinh).toBeUndefined()
    expect(c.tinh).toBeUndefined()
    expect(c.bay).toEqual({ tieuDe: 'Chỗ em nhầm', chu: 'Em lấy !!gốc ethyl!! làm gốc muối.' })
  })

  it('phương trình: tách vế, tách chất theo " + " (ion giữ nguyên), thuận nghịch, chất chính phải có trong phương trình; tính nhanh tách ô', () => {
    const c = lamSachCauTruc({ lienQuan: true, yChinh: 'Em xem phương trình.', phuongTrinh: [
      MAU_DU.phuongTrinh[0],
      { pt: 'NH4^+ + OH^- → NH3 + H2O', dk: '', chinh: 'Cl2' },
      { pt: 'CH3COOH + C2H5OH ⇌ CH3COOC2H5 + H2O', dk: 'H2SO4 đặc, t°' },
      { pt: 'không có mũi tên' },
    ], tinh: MAU_DU.tinh }, false)!
    expect(c.phuongTrinh).toEqual([
      { trai: ['CH3COOC2H5', 'NaOH'], phai: ['CH3COONa', 'C2H5OH'], mui: '→', dk: 't°', chinh: 'CH3COONa' },
      { trai: ['NH4^+', 'OH^-'], phai: ['NH3', 'H2O'], mui: '→', dk: '', chinh: '' },
      { trai: ['CH3COOH', 'C2H5OH'], phai: ['CH3COOC2H5', 'H2O'], mui: '⇌', dk: 'H2SO4 đặc, t°', chinh: '' },
    ])
    expect(c.tinh).toEqual({ dong: [{ nhan: 'n ester', phep: '8,8 : 88', kq: '0,1 mol' }, { nhan: 'm muối', phep: '0,1 × 82', kq: '8,2 gam' }], dapSo: '8,2 gam' })
  })

  it('đúng/sai: tối đa 2 cụm mỗi loại, chỉ ở ý chính và bẫy; ion "NH4^+ + OH^-" không bị hiểu nhầm; khối không giữ dấu tô, không HTML', () => {
    const c = lamSachCauTruc({ lienQuan: true, yChinh: '++a++ ++b++ ++c++ !!x!! !!y!! !!z!! NH4^+ + OH^-', buoc: [{ ten: 'Bước', chu: 'Chọn ++CH3COONa++ chứ !!không!! phải kia.' }],
      thiNghiem: [{ nhan: '<b>X</b>', thuoc: '**Quỳ tím**', hien: 'quy-xanh', chu: '==Quỳ xanh==' }] }, false)!
    expect(c.yChinh).toBe('++a++ ++b++ c !!x!! !!y!! z NH4^+ + OH^-')
    expect(c.buoc[0]!.chu).toBe('Chọn CH3COONa chứ không phải kia.')
    expect(c.thiNghiem).toEqual([{ nhan: 'X', thuoc: 'Quỳ tím', hien: 'quy-xanh', chu: 'Quỳ xanh', phu: '' }])
  })

  it('em ĐANG LÀM: bỏ phương trình + tính nhanh; sơ đồ chỉ giữ ký hiệu chất cần tìm; nhãn ống dài bị bỏ; không tô "đúng"; chữ lộ đáp án bị bỏ khỏi khối', () => {
    const pa = { A: 'glucose, ethanol', B: 'fructose, ethanol', C: 'glucose, acetic acid', D: 'saccharose, ethanol' }
    const chan = (t: string) => { const r = chanLoDapAn(t, 'I', 'A', pa); return r === CAU_CHUA_NOP ? '' : r }
    const c = lamSachCauTruc({ ...MAU_DU, soDo: { ...MAU_DU.soDo, nut: [...MAU_DU.soDo.nut, 'Glucose, ethanol'] },
      thiNghiem: [{ nhan: 'Hồ tinh bột', thuoc: 'Dung dịch iodine', hien: 'xanh-tim', chu: 'Xanh tím' }, { nhan: 'X', thuoc: 'Men rượu', hien: 'khi', chu: 'Sủi bọt', phu: 'X là glucose, ethanol' }] }, true, chan)!
    expect(c.phuongTrinh).toBeUndefined()
    expect(c.tinh).toBeUndefined()
    expect(c.soDo!.nut).toEqual([{ ten: 'Tinh bột', nhan: '' }, { ten: '', nhan: 'X' }, { ten: '', nhan: 'Y' }, { ten: 'Acetic acid', nhan: '' }])
    expect(c.thiNghiem).toEqual([{ nhan: '', thuoc: 'Dung dịch iodine', hien: 'xanh-tim', chu: 'Xanh tím', phu: '' }, { nhan: 'X', thuoc: 'Men rượu', hien: 'khi', chu: 'Sủi bọt', phu: '' }])
    expect(c.yChinh).toBe('Muối là CH3COONa, không phải !!C2H5COONa!! ⇒ 8,2 gam.')
  })

  it('chỉ có khối (ý chính rỗng) vẫn là câu trả lời; chữ phẳng có đủ chữ khối, không còn dấu tô', () => {
    expect(lamSachCauTruc({ lienQuan: true, yChinh: '', thiNghiem: MAU_DU.thiNghiem.slice(0, 1) }, false)).not.toBeNull()
    const c = lamSachCauTruc({ ...MAU_DU, soDo: undefined, nhanBiet: undefined }, false)!
    const p = chuPhang(c)
    expect(p).toContain('Thí nghiệm: X + Quỳ tím: Quỳ hoá xanh (môi trường base)')
    expect(p).toContain('CH3COOC2H5 + NaOH → (t°) CH3COONa + C2H5OH')
    expect(p).toContain('m muối = 0,1 × 82 = 8,2 gam')
    expect(p).toContain('Đáp số: 8,2 gam')
    expect(p).toContain('Chỗ em nhầm: Em lấy gốc ethyl làm gốc muối.')
    expect(p).not.toMatch(/\+\+|!!|\*\*|==/)
    expect(chuPhang(lamSachCauTruc(MAU_DU, false)!)).toContain('Sơ đồ: Tinh bột → (H2O, H^+, t°) Glucose (X) → (men rượu) Ethanol (Y) → (O2, men giấm) Acetic acid')
  })
})

// ---------------------------------------------------------------- đầu-cuối qua Worker
const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { cau: Record<string, unknown> }>
const RA2 = path.join(GOC, 'docs/loi-giai-a/chay-thu-2/ra')
const DE = '12-THU-KH'
const Q = `${DE}-II-4`
const SBD = 'SBD-KH-1410'
const thay = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b, true)
const em = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b)
async function chuanBi() {
  const d = taoD1That()
  ;(d.env as { GEMINI_API_KEY?: string }).GEMINI_API_KEY = 'khoa-thu'
  await thay(d, '/kho/day', { maDe: DE, lop: '12', de: { cau: [{ ...MAU['12-KT-C1-D4-II-4']!.cau, so: 4 }] }, cau: [] })
  const l = await thay(d, '/kho/loi-giai/viec', { so: 5 })
  for (const v of l.viec as { qid: string; bam: string }[]) {
    const { canThayChot: _c, de: _de, ...h } = JSON.parse(fs.readFileSync(path.join(RA2, '04-12-KT-C1-D4-II-4.json'), 'utf8'))
    await thay(d, '/kho/loi-giai/nop', { qid: v.qid, bam: v.bam, hoSo: { ...h, qid: v.qid, bam: v.bam, co: [] } })
  }
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(SBD, 'Em Thử')
  return { d, token: await gameToken(d.env, SBD) }
}
function giaGemini(o: unknown) {
  const that = globalThis.fetch
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    if (!url.startsWith('https://generativelanguage.googleapis.com/')) return that(input, init)
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(o) }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 300 } }), { status: 200, headers: { 'content-type': 'application/json' } })
  })
}
afterEach(() => { vi.restoreAllMocks(); xoaNhoTram() })

describe('đầu-cuối /hs/hoi-tro-ly', () => {
  const MAU_TINH = { lienQuan: true, yChinh: 'Muối là ++CH3COONa++.', phuongTrinh: MAU_DU.phuongTrinh, tinh: MAU_DU.tinh, bay: MAU_DU.bay }
  it('em đã nộp: trả khối đã làm sạch; sổ ghi chữ phẳng có chữ khối', async () => {
    const { d, token } = await chuanBi()
    giaGemini(MAU_TINH)
    await em(d, '/hs/hoi-thay', { token, qid: Q, nguon: 'luyen' })
    const r = await em(d, '/hs/hoi-tro-ly', { token, qid: Q, nguon: 'luyen', cauHoi: 'Sao em ra 9,6 ạ?' })
    expect(r).toMatchObject({ ok: true, ngoaiPhamVi: false, cauTruc: { yChinh: 'Muối là ++CH3COONa++.', tinh: { dapSo: '8,2 gam' }, bay: { tieuDe: 'Chỗ em nhầm' } } })
    expect((r.cauTruc as { phuongTrinh: unknown[] }).phuongTrinh).toHaveLength(1)
    const so = d.sql.prepare('SELECT tra_loi FROM hoi_tro_ly WHERE sbd=?').get(SBD) as { tra_loi: string }
    expect(so.tra_loi).toBe(r.traLoi)
    expect(so.tra_loi).toContain('Đáp số: 8,2 gam')
  })
  it('em ĐANG LÀM: không phương trình, không tính nhanh, không tô "đúng"', async () => {
    const { d, token } = await chuanBi()
    giaGemini(MAU_TINH)
    await em(d, '/hs/hoi-thay', { token, qid: Q, nguon: 'luyen', chiHoi: true })
    const r = await em(d, '/hs/hoi-tro-ly', { token, qid: Q, nguon: 'luyen', cauHoi: 'Câu này làm sao ạ?', dangLam: true })
    expect(r).toMatchObject({ ok: true, cauTruc: { yChinh: 'Muối là CH3COONa.' } })
    expect(r.cauTruc).not.toHaveProperty('phuongTrinh')
    expect(r.cauTruc).not.toHaveProperty('tinh')
    expect(String(r.traLoi)).not.toContain('8,2')
  })
  it('Google từ chối lược đồ có khối (HTTP 400) ⇒ gọi lại bằng lược đồ cũ, em vẫn được trả lời; lượt sau dùng thẳng lược đồ cũ', async () => {
    const { d, token } = await chuanBi()
    const that = globalThis.fetch
    const luocDo: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input)
      if (!url.startsWith('https://generativelanguage.googleapis.com/')) return that(input, init)
      const sc = JSON.parse(String(init?.body)).generationConfig.responseSchema
      const moi = 'thiNghiem' in sc.properties
      luocDo.push(moi ? 'moi' : 'cu')
      if (moi) return new Response(JSON.stringify({ error: { code: 400, message: 'Invalid JSON payload received. Unknown name "format"' } }), { status: 400 })
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ lienQuan: true, yChinh: 'Em viết phương trình trước.' }) }] }, finishReason: 'STOP' }], usageMetadata: {} }), { status: 200 })
    })
    await em(d, '/hs/hoi-thay', { token, qid: Q, nguon: 'luyen' })
    const r = await em(d, '/hs/hoi-tro-ly', { token, qid: Q, nguon: 'luyen', cauHoi: 'Câu này làm sao ạ?' })
    expect(r).toMatchObject({ ok: true, traLoi: 'Em viết phương trình trước.' })
    expect(luocDo).toEqual(['moi', 'cu'])
    await em(d, '/hs/hoi-tro-ly', { token, qid: Q, nguon: 'luyen', cauHoi: 'Bước 2 là gì ạ?' })
    expect(luocDo).toEqual(['moi', 'cu', 'cu'])
    expect(Object.keys(SCHEMA_TRA_LOI_CU.properties)).toEqual(['lienQuan', 'yChinh', 'buoc', 'bang', 'ghiNho', 'hoiTiep'])
  })
})
