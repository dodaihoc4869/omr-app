// ĐỢT 3 · ĐIỀU 6 (mở sớm chặng bài tập về nhà, Boss chốt B) — CHỮ trên thẻ cuối chặng: đủ điều kiện "Em làm tốt chặng 1 (đúng 9/10). Em được mở sớm chặng 2 ngay hôm nay." · không đủ "Chặng 2 mở 00:00 ngày mai. Muốn luyện thêm hôm nay: vào Đảo thần thú."
// Máy chủ (btvn-nang-do-d1.ts, Code 3) trả `moSom: {duoc, lyDo, chu}` khi chặng vừa xong KHÔNG phải chặng cuối. Máy khách đọc chặt `duoc`/`lyDo`, tự dựng chữ bằng `chuMoSomChang` của Code 1 (KHÔNG in `chu` của máy chủ); lý do không chắc chắn (đã mở sẵn / không ghi được / lạ) ⇒ không nói.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import TheCuoiChang from '../src/components/bang-nhiem-vu/TheCuoiChang'
import { chuMoSomCuaChang, docKetQuaChang, theChangView } from '../src/lib/btvn-ca-nhan-kieu'

afterEach(cleanup)
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const ket = (them: Record<string, unknown> = {}) => docKetQuaChang({ ok: true, ketQua: [], chuaLam: [], loDaXong: 1, chang: { chiSo: 0, soCau: 10, soDung: 9, xong: true }, ...them })!

describe('docKetQuaChang — đọc chặt moSom', () => {
  it('đủ {duoc: boolean, lyDo} ⇒ giữ (lyDo không phải chuỗi ⇒ null); `chu` của máy chủ KHÔNG được giữ; sai dạng ⇒ vắng', () => {
    expect(ket({ moSom: { duoc: true, lyDo: null, chu: 'CHỮ-CỦA-MÁY-CHỦ' } }).moSom).toEqual({ duoc: true, lyDo: null })
    expect(ket({ moSom: { duoc: false, lyDo: 'chua_du_ti_le', chu: 'x' } }).moSom).toEqual({ duoc: false, lyDo: 'chua_du_ti_le' })
    expect(ket({ moSom: { duoc: false, lyDo: 5 } }).moSom).toEqual({ duoc: false, lyDo: null })
    for (const v of [undefined, null, 'x', 5, [], {}, { duoc: 'true' }, { lyDo: 'het_chang' }]) expect(ket({ moSom: v }).moSom, JSON.stringify(v)).toBeUndefined()
    expect(JSON.stringify(ket({ moSom: { duoc: true, lyDo: null, chu: 'CHỮ-CỦA-MÁY-CHỦ' } }))).not.toContain('CHỮ-CỦA-MÁY-CHỦ')
  })
})

describe('chuMoSomCuaChang / theChangView — chữ Điều 6', () => {
  it('đủ điều kiện (đúng 9/10) ⇒ "Em làm tốt chặng 1 (đúng 9/10). Em được mở sớm chặng 2 ngay hôm nay."', () => {
    expect(chuMoSomCuaChang(ket({ moSom: { duoc: true, lyDo: null } }))).toEqual({ duoc: true, chu: 'Em làm tốt chặng 1 (đúng 9/10). Em được mở sớm chặng 2 ngay hôm nay.' })
  })
  it('số chặng đúng theo chỉ số: chặng thứ 2 xong (chiSo 1, loDaXong 2) ⇒ "chặng 2 … mở sớm chặng 3"; chặng kế lấy từ loDaXong', () => {
    const k = ket({ loDaXong: 2, chang: { chiSo: 1, soCau: 12, soDung: 11, xong: true }, moSom: { duoc: true, lyDo: null } })
    expect(chuMoSomCuaChang(k)!.chu).toBe('Em làm tốt chặng 2 (đúng 11/12). Em được mở sớm chặng 3 ngay hôm nay.')
    // chặng kế đi theo `loDaXong` của máy chủ (chỉ số chặng kế = số chặng đã xong), không suy từ chiSo + 2
    expect(chuMoSomCuaChang(ket({ loDaXong: 3, chang: { chiSo: 0, soCau: 10, soDung: 9, xong: true }, moSom: { duoc: true, lyDo: null } }))!.chu).toBe('Em làm tốt chặng 1 (đúng 9/10). Em được mở sớm chặng 4 ngay hôm nay.')
  })
  it('chưa đủ 80 % / hôm nay đã mở sớm một chặng ⇒ "Chặng 2 mở 00:00 ngày mai. Muốn luyện thêm hôm nay: vào Đảo thần thú."; hết chặng ⇒ câu hết chặng', () => {
    for (const lyDo of ['chua_du_ti_le', 'da_mo_som_hom_nay']) expect(chuMoSomCuaChang(ket({ chang: { chiSo: 0, soCau: 10, soDung: 6, xong: true }, moSom: { duoc: false, lyDo } })), lyDo).toEqual({ duoc: false, chu: 'Chặng 2 mở 00:00 ngày mai. Muốn luyện thêm hôm nay: vào Đảo thần thú.' })
    expect(chuMoSomCuaChang(ket({ moSom: { duoc: false, lyDo: 'het_chang' } }))).toEqual({ duoc: false, chu: 'Em đã làm hết các chặng của bài tập về nhà này.' })
  })
  it('KHÔNG nói điều chưa chắc: chặng kế đã mở sẵn / không ghi được (đua) / lý do lạ / thiếu moSom / thiếu chang ⇒ null', () => {
    for (const lyDo of ['da_mo_san', 'thua_cas', 'la', null]) expect(chuMoSomCuaChang(ket({ moSom: { duoc: false, lyDo } })), String(lyDo)).toBeNull()
    expect(chuMoSomCuaChang(ket())).toBeNull()
    expect(chuMoSomCuaChang(docKetQuaChang({ ok: true, ketQua: [], chuaLam: [], moSom: { duoc: true, lyDo: null } })!)).toBeNull()
  })
  it('theChangView.moSom: có ở chặng thường; KHÔNG có ở chặng cuối (đã nộp cả bài) và ở phần thử sức thêm', () => {
    expect(theChangView(ket({ moSom: { duoc: true, lyDo: null } }), 5)!.moSom).toEqual({ duoc: true, chu: 'Em làm tốt chặng 1 (đúng 9/10). Em được mở sớm chặng 2 ngay hôm nay.' })
    expect(theChangView(ket(), 5)!.moSom).toBeNull()
    const cuoi = ket({ moSom: { duoc: true, lyDo: null }, nop: { daNop: true, nopLuc: '2026-09-21T10:00:00Z', soDung: 8, soCau: 10, soCauCuaEm: 10, soCauThuongSai: 0, qidSai: [] } })
    expect(theChangView(cuoi, 5)!.moSom).toBeNull()
    const thuSuc = ket({ moSom: { duoc: true, lyDo: null }, chang: { chiSo: 5, soCau: 4, soDung: 4, xong: true }, thuSucThem: { chiSo: 5, soCau: 4, soDaLam: 4, soDung: 4, daNop: true } })
    expect(theChangView(thuSuc, 5)!.moSom).toBeNull()
  })
})

describe('TheCuoiChang — thẻ chữ mở sớm', () => {
  const ve = (k: ReturnType<typeof ket>) => render(<TheCuoiChang view={theChangView(k, 5)!} dong={() => {}} veBang={() => {}} />)
  it('được mở sớm ⇒ thẻ xanh (data-duoc) có câu Điều 6; chưa ⇒ thẻ trung tính "mở 00:00 ngày mai"; không có gì đáng nói ⇒ không thẻ', () => {
    const a = ve(ket({ moSom: { duoc: true, lyDo: null } })).container.querySelector('[data-vung="mo-som"]') as HTMLElement
    expect(a.textContent).toBe('Em làm tốt chặng 1 (đúng 9/10). Em được mở sớm chặng 2 ngay hôm nay.')
    expect(a.hasAttribute('data-duoc')).toBe(true)
    expect(a.getAttribute('role')).toBe('status')
    cleanup()
    const b = ve(ket({ chang: { chiSo: 0, soCau: 10, soDung: 6, xong: true }, moSom: { duoc: false, lyDo: 'chua_du_ti_le' } })).container.querySelector('[data-vung="mo-som"]') as HTMLElement
    expect(b.textContent).toBe('Chặng 2 mở 00:00 ngày mai. Muốn luyện thêm hôm nay: vào Đảo thần thú.')
    expect(b.hasAttribute('data-duoc')).toBe(false)
    cleanup()
    expect(ve(ket()).container.querySelector('[data-vung="mo-som"]')).toBeNull()
    cleanup()
    expect(ve(ket({ moSom: { duoc: false, lyDo: 'da_mo_san' } })).container.querySelector('[data-vung="mo-som"]')).toBeNull()
  })
  it('khoá nguồn: chữ chỉ từ mo-som-chang.ts (Code 1), thẻ không in `chu` của máy chủ; CSS có tiền tố tcc-, không màu thô', () => {
    expect(doc('src/lib/btvn-ca-nhan-kieu.ts')).toContain("import { chuMoSomChang } from './mo-som-chang'")
    expect(doc('src/components/bang-nhiem-vu/TheCuoiChang.tsx')).toContain('view.moSom.chu') // chữ từ view (do theChangView dựng bằng chuMoSomChang), không đọc phản hồi máy chủ trực tiếp
    const css = doc('src/components/bang-nhiem-vu/the-cuoi-chang.css')
    expect(css).toContain('.tcc-mo-som')
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})
