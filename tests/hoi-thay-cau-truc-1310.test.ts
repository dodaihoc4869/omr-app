// @vitest-environment node
// HỎI THẦY · câu trả lời CÓ CẤU TRÚC (bản vẽ docs/ban-ve-hoi-thay-1310, thầy chốt 13/10: "hiển thị khoa học hơn, ngắt câu tô đậm … hs đọc cái
// hiểu ngay"): mô hình trả {yChinh, buoc, bang, ghiNho, hoiTiep}; máy chủ làm sạch từng phần, giới hạn tô đậm/làm nổi, chặn lộ đáp án khi em
// đang làm, ghi sổ + trả `traLoi` chữ phẳng cho máy em bản cũ. Khuôn cũ {lienQuan, traLoi} vẫn chạy (tests/hoi-them-thay-1310).
import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { SCHEMA_TRA_LOI, chuPhang, lamSachCauTruc, tachCauTruc } from '../server/src/hoi-tro-ly-cau-truc'
import { CAU_CHUA_NOP, chanLoDapAn } from '../server/src/hoi-tro-ly'

const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { cau: Record<string, unknown> }>
const RA2 = path.join(GOC, 'docs/loi-giai-a/chay-thu-2/ra')
const Q_TN = '12-KT-C1-D4-I-6', Q_DS = '12-KT-C1-D4-II-4', Q_TLN = '12-KT-C1-D2-III-6'
const cauThat = (qid: string, so: number) => ({ ...MAU[qid].cau, so })
const DE_A = '12-THU-A'
const QA = { tn: `${DE_A}-I-6`, ds: `${DE_A}-II-4` }
const SBD = 'SBD-CT-1310'
const thay = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b, true)
const em = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b)
function hoSoTu(tep: string, qid: string, bam: string) {
  const h = JSON.parse(fs.readFileSync(path.join(RA2, tep), 'utf8'))
  const { canThayChot: _c, de: _de, ...r } = h
  return { ...r, qid, bam, co: [] }
}
async function chuanBi() {
  const d = taoD1That()
  ;(d.env as { GEMINI_API_KEY?: string }).GEMINI_API_KEY = 'khoa-thu'
  await thay(d, '/kho/day', { maDe: DE_A, lop: '12', de: { cau: [cauThat(Q_TN, 6), cauThat(Q_DS, 4), cauThat(Q_TLN, 6)] }, cau: [] })
  const l = await thay(d, '/kho/loi-giai/viec', { so: 5 })
  for (const v of l.viec as { qid: string; bam: string }[]) {
    if (v.qid.endsWith('-III-6')) continue
    const tep = v.qid === QA.tn ? '02-12-KT-C1-D4-I-6.json' : '04-12-KT-C1-D4-II-4.json'
    await thay(d, '/kho/loi-giai/nop', { qid: v.qid, bam: v.bam, hoSo: hoSoTu(tep, v.qid, v.bam) })
  }
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(SBD, 'Em Thử')
  return { d, token: await gameToken(d.env, SBD) }
}
function giaGemini(o: unknown) {
  const goi: Record<string, any>[] = []
  const that = globalThis.fetch
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    if (!url.startsWith('https://generativelanguage.googleapis.com/')) return that(input, init)
    goi.push(JSON.parse(String(init?.body)))
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(o) }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 120 } }), { status: 200, headers: { 'content-type': 'application/json' } })
  })
  return goi
}
afterEach(() => { vi.restoreAllMocks() })

const MAU_AMINE = {
  lienQuan: true,
  yChinh: 'Em dùng **tính chất vật lý của amine**: có ==4 amine== ở thể khí.',
  buoc: [
    { ten: 'Nhớ quy tắc', chu: 'Amine **phân tử khối nhỏ** là **chất khí**, mùi khai, tan nhiều trong nước.' },
    { ten: 'Xét từng chất', chu: 'So trạng thái của năm chất ở điều kiện thường.' },
    { ten: 'Đếm', chu: '4 chất khí ⇒ đáp số **4**.' },
  ],
  bang: { cot: ['Chất', 'Công thức', 'Thể'], dong: ['methylamine | CH3NH2 | khí', 'ethylamine | C2H5NH2 | khí', 'dimethylamine | (CH3)2NH | khí', 'trimethylamine | (CH3)3N | khí', 'aniline | C6H5NH2 | lỏng'], sauBuoc: 2 },
  ghiNho: 'Bốn amine khí: CH3NH2, (CH3)2NH, (CH3)3N, C2H5NH2.',
  hoiTiep: ['Vì sao aniline là chất lỏng?', 'Amine nào tan tốt trong nước?', 'Câu thứ ba bị bỏ'],
}

describe('hàm thuần', () => {
  it('nhận khuôn mới; khuôn cũ {lienQuan, traLoi} ⇒ null (nơi gọi đọc khuôn cũ)', () => {
    expect(tachCauTruc(JSON.stringify(MAU_AMINE))?.lienQuan).toBe(true)
    expect(tachCauTruc('```json\n{"lienQuan":false,"yChinh":""}\n```')).toEqual({ lienQuan: false, o: { lienQuan: false, yChinh: '' } })
    expect(tachCauTruc('{"lienQuan":true,"traLoi":"Em xem bước 2."}')).toBeNull()
    expect(tachCauTruc('Em xem bước 2.')).toBeNull()
    expect(SCHEMA_TRA_LOI.required).toEqual(['lienQuan', 'yChinh'])
  })

  it('làm sạch: bảng tách ô theo " | ", gắn đúng bước; hỏi tiếp tối đa 2; tô đậm tối đa 4 cụm; làm nổi chỉ 1 cụm và chỉ ở ý chính', () => {
    const c = lamSachCauTruc({ ...MAU_AMINE, ghiNho: '**Một** **hai**', buoc: [...MAU_AMINE.buoc, { ten: 'Thừa 5', chu: 'x' }, { ten: 'Thừa 6', chu: 'y' }] }, false)!
    expect(c.bang).toEqual({ cot: ['Chất', 'Công thức', 'Thể'], dong: MAU_AMINE.bang.dong.map((d) => d.split('|').map((x) => x.trim())), sauBuoc: 2 })
    expect(c.buoc).toHaveLength(4)
    expect(c.hoiTiep).toEqual(['Vì sao aniline là chất lỏng?', 'Amine nào tan tốt trong nước?'])
    const tatCa = [c.yChinh, ...c.buoc.map((b) => b.chu), c.ghiNho].join(' ')
    expect(tatCa.match(/\*\*.+?\*\*/g)).toHaveLength(4)
    expect(c.yChinh).toContain('==4 amine==')
    expect(lamSachCauTruc({ yChinh: '==a== và ==b==', buoc: [{ ten: 'B', chu: 'x ==c==' }] }, false)).toMatchObject({ yChinh: '==a== và b', buoc: [{ ten: 'B', chu: 'x c' }] })
  })

  it('bỏ HTML, emoji, gạch ngang dài, markdown lạ; cắt độ dài không để dấu tô lẻ; rỗng hết ⇒ null', () => {
    const c = lamSachCauTruc({ yChinh: '<b>Chú ý</b> 😀 — ## em **xem lại', buoc: [{ ten: '<i>Bước</i>', chu: 'a'.repeat(400) }] }, false)!
    expect(c.yChinh).toBe('Chú ý, em xem lại')
    expect(c.buoc[0]!.ten).toBe('Bước')
    expect(c.buoc[0]!.chu.length).toBeLessThanOrEqual(321)
    expect(lamSachCauTruc({ yChinh: '', buoc: [] }, false)).toBeNull()
  })

  it('em ĐANG LÀM: không bảng, không làm nổi; câu lộ đáp án trong từng phần bị bỏ', () => {
    const chan = (t: string) => { const r = chanLoDapAn(t, 'I', 'B', { A: 'CH3NH2', B: '(CH3)2NH', C: '(CH3)3N', D: 'C6H5NH2' }); return r === CAU_CHUA_NOP ? '' : r }
    const c = lamSachCauTruc({ ...MAU_AMINE, yChinh: 'Em đếm số gốc gắn vào N. ==Đáp án là B==.', buoc: [{ ten: 'Đếm gốc', chu: 'N gắn mấy gốc CH3?' }, { ten: 'Kết luận', chu: 'Chọn B.' }] }, true, chan)!
    expect(c.bang).toBeNull()
    expect(c.yChinh).toBe('Em đếm số gốc gắn vào N.')
    expect(c.buoc).toEqual([{ ten: 'Đếm gốc', chu: 'N gắn mấy gốc CH3?' }])
    expect(JSON.stringify(c)).not.toContain('==')
  })

  it('chữ phẳng: không còn dấu tô; bảng chèn sau đúng bước; có dòng Ghi nhớ', () => {
    const p = chuPhang(lamSachCauTruc(MAU_AMINE, false)!)
    expect(p).not.toMatch(/\*\*|==/)
    const dong = p.split('\n')
    expect(dong[0]).toBe('Em dùng tính chất vật lý của amine: có 4 amine ở thể khí.')
    expect(dong[2]).toBe('2. Xét từng chất: So trạng thái của năm chất ở điều kiện thường.')
    expect(dong[3]).toBe('Chất | Công thức | Thể')
    expect(dong.at(-1)).toBe('Ghi nhớ: Bốn amine khí: CH3NH2, (CH3)2NH, (CH3)3N, C2H5NH2.')
  })
})

describe('đầu-cuối /hs/hoi-tro-ly', () => {
  it('gửi Gemini lược đồ có cấu trúc; trả cauTruc đã làm sạch + traLoi chữ phẳng; sổ ghi chữ phẳng', async () => {
    const { d, token } = await chuanBi()
    const goi = giaGemini(MAU_AMINE)
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds, nguon: 'luyen_de' })
    const r = await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, nguon: 'luyen_de', cauHoi: 'Em dùng kiến thức gì ạ?' })
    expect(goi[0]!.generationConfig.responseSchema).toEqual(JSON.parse(JSON.stringify(SCHEMA_TRA_LOI)))
    expect(String(goi[0]!.systemInstruction.parts[0].text)).toContain('TRÌNH BÀY')
    expect(r).toMatchObject({ ok: true, ngoaiPhamVi: false, conLai: 19 })
    expect((r.cauTruc as { bang: { sauBuoc: number } }).bang.sauBuoc).toBe(2)
    expect(r.traLoi).toBe(chuPhang(lamSachCauTruc(MAU_AMINE, false)!))
    const so = d.sql.prepare('SELECT tra_loi FROM hoi_tro_ly WHERE sbd=?').get(SBD) as { tra_loi: string }
    expect(so.tra_loi).toBe(r.traLoi)
  })

  it('ngoài phạm vi (lienQuan=false) ⇒ câu cố định, KHÔNG có cauTruc', async () => {
    const { d, token } = await chuanBi()
    giaGemini({ lienQuan: false, yChinh: '' })
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    const r = await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Giải bài Lý giúp em' })
    expect(r).toMatchObject({ ok: true, ngoaiPhamVi: true })
    expect(r.cauTruc).toBeUndefined()
  })

  it('em ĐANG LÀM: câu lộ đáp án bị bỏ trong cauTruc lẫn traLoi; lộ hết ⇒ câu cố định, không cauTruc', async () => {
    const { d, token } = await chuanBi()
    const dapAn = String(MAU[Q_TN].cau.dap_an)
    giaGemini({ lienQuan: true, yChinh: 'Em viết phương trình trước.', buoc: [{ ten: 'Kết luận', chu: `Đáp án là ${dapAn}.` }], bang: { cot: ['a', 'b'], dong: ['1 | 2'] } })
    await em(d, '/hs/hoi-thay', { token, qid: QA.tn, nguon: 'luyen', chiHoi: true })
    const r = await em(d, '/hs/hoi-tro-ly', { token, qid: QA.tn, nguon: 'luyen', cauHoi: 'Câu này làm sao ạ?', dangLam: true })
    expect(r).toMatchObject({ ok: true, traLoi: 'Em viết phương trình trước.', cauTruc: { yChinh: 'Em viết phương trình trước.', buoc: [], bang: null } })
    vi.restoreAllMocks()
    giaGemini({ lienQuan: true, yChinh: `Đáp án là ${dapAn}.` })
    const r2 = await em(d, '/hs/hoi-tro-ly', { token, qid: QA.tn, nguon: 'luyen', cauHoi: 'Đáp án là gì ạ?', dangLam: true })
    expect(r2).toMatchObject({ ok: true, traLoi: CAU_CHUA_NOP, ngoaiPhamVi: false })
    expect(r2.cauTruc).toBeUndefined()
  })
})
