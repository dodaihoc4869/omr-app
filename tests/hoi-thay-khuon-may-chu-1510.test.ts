// @vitest-environment node
// HỎI THẦY v3 · KHUÔN (bản vẽ docs/ban-ve-hoi-thay-v3-1510, thầy chốt 15/10 "chốt build luôn nhé"): máy chủ CHỌN khuôn trước khi gọi Gemini
// (đang làm ⇒ Gợi ý từng nấc · phần II ⇒ Từng ý a–d · có bài em ⇒ Chỉ chỗ sai · câu có số ⇒ Tính từng bước · còn lại ⇒ Giải thích), gửi lược
// đồ RIÊNG của khuôn, làm sạch phần mới; Đúng/Sai từng ý lấy từ kho; em đang làm thì không phần nào so với đáp án; câu hỏi lại trùng đề bị bỏ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { CHI_DAN_KHUON, HINH_DUNG, KHUON, chonKhuon, chuPhang, lamSachCauTruc, schemaChoKhuon, type BoiCanhKhuon } from '../server/src/hoi-tro-ly-cau-truc'
import { CAU_CHUA_NOP, CHI_DAN_THAY, chanLoDapAn, xoaNhoTram } from '../server/src/hoi-tro-ly'

const CHON = { dangLam: false, phan: 'I', ketQua: 'chua_lam' as const, cauHoi: 'Câu này làm sao ạ?', de: 'Chất nào làm quỳ tím hoá xanh?', dapAnEm: '' }
// SỬA CÓ CHỦ ĐÍCH 16/10: đối chiếu bước chỉ hợp lệ khi em thực sự cung cấp bài nháp.
const BO: BoiCanhKhuon = { khuon: 'cho-sai', phan: 'I', de: 'Thuỷ phân 8,8 gam ethyl acetate trong NaOH dư. Muối thu được là', pa: { A: 'CH3COONa', B: 'C2H5COONa', C: 'HCOONa', D: 'CH3ONa' }, y: null, dapAn: 'A', dapAnEm: 'B', baiNhap: 'n = 0,1 mol; C2H5COONa; m = 9,6' }

describe('chọn khuôn (máy chủ, không đọc D1 thêm)', () => {
  it('đang làm ⇒ gợi ý; phần II ⇒ từng ý; "vì sao" ⇒ giải thích; có bài em ⇒ chỉ chỗ sai; câu có số ⇒ tính', () => {
    expect(chonKhuon({ ...CHON, dangLam: true, ketQua: 'sai', dapAnEm: 'B' })).toBe('goi-y')
    expect(chonKhuon({ ...CHON, phan: 'II', ketQua: 'sai' })).toBe('tung-y')
    expect(chonKhuon({ ...CHON, ketQua: 'sai', cauHoi: 'Vì sao aniline không làm quỳ tím đổi màu ạ?' })).toBe('giai-thich')
    expect(chonKhuon({ ...CHON, ketQua: 'sai', dapAnEm: 'B', baiNhap: BO.baiNhap })).toBe('cho-sai')
    expect(chonKhuon({ ...CHON, cauHoi: 'Sao em ra 9,6 ạ?' })).toBe('giai-thich')
    expect(chonKhuon({ ...CHON, cauHoi: 'Em chọn B sai ở đâu ạ?' })).toBe('giai-thich')
    expect(chonKhuon({ ...CHON, ketQua: 'sai', cauHoi: 'Sao em sai ạ?' })).toBe('giai-thich') // không biết bài em ⇒ không đoán cột "Em làm"
    expect(chonKhuon({ ...CHON, phan: 'III' })).toBe('tinh')
    expect(chonKhuon({ ...CHON, ketQua: 'dung', de: 'Thuỷ phân 8,8 gam ethyl acetate…' })).toBe('tinh')
    expect(chonKhuon({ ...CHON, ketQua: 'sai', dapAnEm: 'B', cauHoi: 'Giải thích dễ hơn' })).toBe('giai-thich')
    expect(chonKhuon({ ...CHON, cauHoi: 'Em chưa hiểu: Chỗ lệch' })).toBe('giai-thich')
    expect(chonKhuon(CHON)).toBe('giai-thich')
  })

  it('lược đồ riêng mỗi khuôn: đúng phần của khuôn; gợi ý từng nấc KHÔNG có phần so với đáp án; chỉ dẫn đủ 5 khuôn + 4 hình', () => {
    for (const k of KHUON) {
      const sc = schemaChoKhuon(k)
      expect(sc.propertyOrdering.slice(0, 2)).toEqual(['lienQuan', 'yChinh'])
      expect(Object.keys(sc.properties)).toEqual(sc.propertyOrdering)
      expect(Object.values(sc.properties).every(Boolean)).toBe(true)
      expect(CHI_DAN_KHUON[k]).toContain('BẮT BUỘC')
    }
    const gy = Object.keys(schemaChoKhuon('goi-y').properties)
    for (const cam of ['soSanh', 'kiemLai', 'tinh', 'phuongTrinh', 'lyDoY', 'buocThu', 'xepHang']) expect(gy).not.toContain(cam)
    expect(Object.keys(schemaChoKhuon('cho-sai').properties)).toEqual(expect.arrayContaining(['soSanh', 'bay', 'kiemLai', 'chuaHieu']))
    expect(Object.keys(schemaChoKhuon('tung-y').properties)).toContain('lyDoY')
    expect(Object.keys(schemaChoKhuon('tinh').properties)).toEqual(expect.arrayContaining(['buocThu', 'tinh']))
    for (const h of HINH_DUNG) expect(CHI_DAN_THAY).toContain(h)
    expect(CHI_DAN_THAY).toContain('KHUÔN TRẢ LỜI')
  })
})

describe('làm sạch phần v3', () => {
  const MO = {
    lienQuan: true, yChinh: 'Em lấy nhầm muối.',
    soSanh: [{ em: 'n = 0,1 mol', dung: 'n = 0,1 mol' }, { em: 'C2H5COONa', dung: 'CH3COONa', lech: true }, { em: 'm = 9,6', dung: 'm = 8,2', lech: true }, { em: '', dung: 'x' }],
    xepHang: { tieuChi: 'Tính base', chat: [{ ct: '(CH3)2NH', ten: 'dimethylamine' }, { ct: 'CH3NH2' }, { ct: 'NH3' }, { ct: 'C6H5NH2', ten: 'aniline' }], hoi: 3, nguongSau: 2, nguongTren: 'quỳ hoá xanh', nguongDuoi: 'quỳ không đổi' },
    doiChieu: { a: 'Methylamine', b: 'Aniline', dong: [{ tieuChi: 'Gốc gắn N', a: 'CH3– đẩy e', b: 'C6H5– hút e' }, { tieuChi: 'thiếu', a: 'x' }] },
    hinhDung: 'cap-e-amine',
    buoc: [{ ten: 'Mol', chu: 'n = 0,1 mol' }, { ten: 'CO2', chu: 'n CO2 = 0,16 mol' }, { ten: 'V', chu: 'V = 3,97 L' }],
    buocThu: { buoc: 2, hoi: 'Mol CO2?', dap: '0.16', goiYSai: 'Nhân 2 rồi nhân 80%.' },
    kiemLai: { hoi: 'Thuỷ phân methyl propionate trong NaOH, muối là?', lua: ['CH3COONa ', 'C2H5COONa', 'CH3ONa'], dung: 1, vi: 'Muối giữ gốc acid.', goiYSai: 'Gốc acid đọc sau.' },
    chuaHieu: ['Chỗ lệch', 'Chỗ lệch', 'Vì sao M = 82?', 'Một chỗ dài quá hai mươi bốn ký tự luôn'],
    nac: [{ ten: 'Đọc đề', chu: 'Gợi ý một.' }, { ten: 'Cách làm', chu: 'Gợi ý hai.', khoi: 'thiNghiem' }],
  }
  it('em đã nộp: so bài giữ đúng MỘT dòng lệch; thang + ngưỡng; đối chiếu; em thử (số chuẩn hoá); câu hỏi lại; chạm "chưa hiểu" gọn', () => {
    const c = lamSachCauTruc(MO, false, undefined, BO)!
    expect(c.khuon).toBe('cho-sai')
    expect(c.soSanh!.map((r) => r.lech)).toEqual([false, true, false])
    expect(c.xepHang).toEqual({ tieuChi: 'Tính base', chat: [{ ct: '(CH3)2NH', ten: 'dimethylamine' }, { ct: 'CH3NH2', ten: '' }, { ct: 'NH3', ten: '' }, { ct: 'C6H5NH2', ten: 'aniline' }], hoi: 3, nguong: { sau: 2, tren: 'quỳ hoá xanh', duoi: 'quỳ không đổi' } })
    expect(c.doiChieu).toEqual({ a: 'Methylamine', b: 'Aniline', dong: [{ tieuChi: 'Gốc gắn N', a: 'CH3– đẩy e', b: 'C6H5– hút e' }] })
    expect(c.hinhDung).toBe('cap-e-amine')
    expect(c.buocThu).toEqual({ buoc: 2, hoi: 'Mol CO2?', dap: '0,16', goiYSai: 'Nhân 2 rồi nhân 80%.' })
    expect(c.kiemLai).toEqual({ hoi: 'Thuỷ phân methyl propionate trong NaOH, muối là?', lua: ['CH3COONa', 'C2H5COONa', 'CH3ONa'], dung: 1, vi: 'Muối giữ gốc acid.', goiYSai: 'Gốc acid đọc sau.' })
    expect(c.chuaHieu).toEqual(['Chỗ lệch', 'Vì sao M = 82?', 'Một chỗ dài quá hai…']) // cắt 24 ký tự, bỏ chữ dở
    expect(c.nac!.map((n) => n.khoi)).toEqual(['', 'thiNghiem'])
  })

  it('bỏ phần hỏng: em thử ngoài số bước / đáp số không phải số; câu hỏi lại lặp chính đề, thiếu hay trùng lựa chọn (chung chất với phương án thì GIỮ)', () => {
    const tron = lamSachCauTruc({ ...MO, buocThu: { buoc: 9, hoi: 'x?', dap: '1' }, kiemLai: { ...MO.kiemLai, lua: ['CH3COONa', 'ch3coona', 'Y'] } }, false, undefined, BO)!
    expect(tron.buocThu).toBeUndefined()
    expect(tron.kiemLai).toBeUndefined() // hai lựa chọn như nhau
    expect(lamSachCauTruc(MO, false, undefined, BO)!.kiemLai!.lua).toContain('C2H5COONa') // B của câu đang hỏi — vẫn giữ
    const c2 = lamSachCauTruc({ ...MO, buocThu: { buoc: 2, hoi: 'x?', dap: 'khoảng 0,16' }, kiemLai: { ...MO.kiemLai, lua: ['A', 'B'] } }, false, undefined, { ...BO, pa: null })!
    expect(c2.buocThu).toBeUndefined()
    expect(c2.kiemLai).toBeUndefined()
    const trungDe = lamSachCauTruc({ ...MO, kiemLai: { ...MO.kiemLai, hoi: 'Thuỷ phân 8,8 gam ethyl acetate trong NaOH dư. Muối thu được là' } }, false, undefined, BO)!
    expect(trungDe.kiemLai).toBeUndefined()
  })

  it('ĐO 15/10 (bay, xepHang, doiChieu, buocThu 0 lượt): khối dạng object luôn khai required; Chỉ chỗ sai bắt buộc bay; đáp số em thử kèm đơn vị chữ vẫn nhận', () => {
    for (const k of KHUON) {
      const p = schemaChoKhuon(k).properties as Record<string, { type?: string; required?: string[] }>
      for (const ten of ['bay', 'xepHang', 'doiChieu', 'buocThu', 'kiemLai']) if (p[ten]) expect(p[ten]!.required?.length, `${k}.${ten}`).toBeGreaterThan(0)
    }
    expect(schemaChoKhuon('cho-sai').required).toEqual(['lienQuan', 'yChinh', 'bay'])
    for (const k of KHUON.filter((x) => x !== 'cho-sai')) expect(schemaChoKhuon(k).required).toEqual(['lienQuan', 'yChinh'])
    const thu = (dap: string) => lamSachCauTruc({ ...MO, buocThu: { buoc: 2, hoi: 'Mol CO2?', dap } }, false, undefined, BO)!.buocThu?.dap
    expect(['0,16 mol', '0.16mol', '≈ 0,16', '3,97 L', '80%'].map(thu)).toEqual(['0,16', '0,16', '0,16', '3,97', '80'])
    expect(thu('2×10^-3')).toBeUndefined()
    expect(thu('0,1 và 0,2')).toBeUndefined()
  })

  it('Từng ý a–d: "Em" từ bài em gửi, "Đáp án" từ KHO (mô hình không ghi đè); lý do theo từng ý', () => {
    const bo: BoiCanhKhuon = { khuon: 'tung-y', phan: 'II', de: 'Phát biểu về glucose', pa: null, y: { a: 'Có 5 nhóm –OH.', b: 'Bị khử bởi AgNO3/NH3.', c: '<b>Hoà tan</b> Cu(OH)2.', d: 'Là disaccharide.' }, dapAn: 'DSDS', dapAnEm: 'ddss' }
    const c = lamSachCauTruc({ lienQuan: true, yChinh: 'Em sai ý b, c.', lyDoY: [{ y: 'b', lyDo: 'Glucose bị **oxi hoá**.', dapAn: 'D' }, { y: 'c', lyDo: 'Nhiều –OH kề nhau.' }] }, false, undefined, bo)!
    expect(c.yDS).toEqual([
      { y: 'a', noi: 'Có 5 nhóm –OH.', em: 'D', dapAn: 'D', lyDo: '' },
      { y: 'b', noi: 'Bị khử bởi AgNO3/NH3.', em: 'D', dapAn: 'S', lyDo: 'Glucose bị **oxi hoá**.' },
      { y: 'c', noi: 'Hoà tan Cu(OH)2.', em: 'S', dapAn: 'D', lyDo: 'Nhiều –OH kề nhau.' },
      { y: 'd', noi: 'Là disaccharide.', em: 'S', dapAn: 'S', lyDo: '' },
    ])
    expect(chuPhang(c)).toContain('Ý b (Sai): Glucose bị oxi hoá.')
  })

  it('em ĐANG LÀM: không so bài, không thang / đối chiếu / từng ý / em thử / câu hỏi lại; nấc gợi ý lộ đáp án bị bỏ', () => {
    const pa = { A: 'methylamine, glucose, aniline', B: 'aniline, glucose, methylamine', C: 'glucose, methylamine, aniline', D: 'methylamine, aniline, glucose' }
    const chan = (t: string) => { const r = chanLoDapAn(t, 'I', 'A', pa); return r === CAU_CHUA_NOP ? '' : r }
    const c = lamSachCauTruc({ ...MO, nac: [...MO.nac, { ten: 'Chốt', chu: 'Đáp án là A.' }] }, true, chan, { ...BO, khuon: 'goi-y', pa })!
    for (const cam of ['soSanh', 'xepHang', 'doiChieu', 'yDS', 'buocThu', 'kiemLai'] as const) expect(c[cam]).toBeUndefined()
    expect(c.nac!.map((n) => n.chu)).toEqual(['Gợi ý một.', 'Gợi ý hai.'])
    expect(c.khuon).toBe('goi-y')
  })

  it('chữ phẳng có chữ các phần v3 (ghi sổ, gửi lại làm lịch sử)', () => {
    const p = chuPhang(lamSachCauTruc(MO, false, undefined, BO)!)
    for (const x of ['So bài: em C2H5COONa | đúng CH3COONa (chỗ lệch)', 'Gợi ý 2: Cách làm: Gợi ý hai.', 'Xếp hạng (Tính base): (CH3)2NH > CH3NH2 > NH3 > C6H5NH2', 'Đối chiếu Gốc gắn N: Methylamine CH3– đẩy e | Aniline C6H5– hút e', 'Em thử bước 2: Mol CO2? (0,16)', 'Thầy hỏi lại: Thuỷ phân methyl propionate trong NaOH, muối là? → C2H5COONa']) expect(p).toContain(x)
  })
})

// ---------------------------------------------------------------- đầu-cuối qua Worker
const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { cau: Record<string, unknown> }>
const RA2 = path.join(GOC, 'docs/loi-giai-a/chay-thu-2/ra')
const DE = '12-THU-K3'
const Q = `${DE}-II-4`
const SBD = 'SBD-K3-1510'
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
  const goi: Record<string, any>[] = []
  const that = globalThis.fetch
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    if (!url.startsWith('https://generativelanguage.googleapis.com/')) return that(input, init)
    goi.push(JSON.parse(String(init?.body)))
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(o) }] }, finishReason: 'STOP' }], usageMetadata: {} }), { status: 200 })
  })
  return goi
}
afterEach(() => { vi.restoreAllMocks(); xoaNhoTram() })

describe('đầu-cuối /hs/hoi-tro-ly', () => {
  it('câu Đúng/Sai đã nộp + bài em "DDSS": gửi lược đồ khuôn Từng ý, dòng KHUÔN trong dữ liệu; trả "Em" từ bài em, "Đáp án" từ kho', async () => {
    const { d, token } = await chuanBi()
    const goi = giaGemini({ lienQuan: true, yChinh: 'Em sai ý b và c.', lyDoY: [{ y: 'a', lyDo: 'Lý do a.' }, { y: 'b', lyDo: 'Lý do b.' }], chuaHieu: ['Ý b'] })
    await em(d, '/hs/hoi-thay', { token, qid: Q, nguon: 'bai_hang_ngay' })
    const r = await em(d, '/hs/hoi-tro-ly', { token, qid: Q, nguon: 'bai_hang_ngay', cauHoi: 'Em sai ý nào ạ?', dapAnEm: 'DDSS' })
    expect(goi[0]!.generationConfig.responseSchema).toEqual(JSON.parse(JSON.stringify(schemaChoKhuon('tung-y'))))
    expect(goi[0]).not.toHaveProperty('luocDo') // lược đồ chỉ nằm trong generationConfig
    expect(JSON.stringify(goi[0]!.contents)).toContain('KHUÔN TRẢ LỜI \\"Từng ý a–d\\"')
    const ct = r.cauTruc as { khuon: string; yDS: { y: string; em: string; dapAn: string; lyDo: string }[]; chuaHieu: string[] }
    expect(ct.khuon).toBe('tung-y')
    const da = String(MAU['12-KT-C1-D4-II-4']!.cau.dap_an)
    expect(ct.yDS.map((y) => `${y.y}:${y.em}${y.dapAn}`)).toEqual(['a', 'b', 'c', 'd'].map((y, i) => `${y}:${'DDSS'[i]}${da[i]}`))
    expect(ct.yDS[1]!.lyDo).toBe('Lý do b.')
    expect(ct.chuaHieu).toEqual(['Ý b'])
  })
  it('em ĐANG LÀM: lược đồ khuôn Gợi ý từng nấc, bài em KHÔNG gửi Gemini, không có từng ý', async () => {
    const { d, token } = await chuanBi()
    const goi = giaGemini({ lienQuan: true, yChinh: 'Em đọc kỹ từng ý.', nac: [{ ten: 'Một', chu: 'Gợi ý 1.' }, { ten: 'Hai', chu: 'Gợi ý 2.' }, { ten: 'Ba', chu: 'Gợi ý 3.' }] })
    await em(d, '/hs/hoi-thay', { token, qid: Q, nguon: 'bai_hang_ngay', chiHoi: true })
    const r = await em(d, '/hs/hoi-tro-ly', { token, qid: Q, nguon: 'bai_hang_ngay', cauHoi: 'Câu này làm sao ạ?', dangLam: true })
    expect(goi[0]!.generationConfig.responseSchema).toEqual(JSON.parse(JSON.stringify(schemaChoKhuon('goi-y'))))
    expect(r).toMatchObject({ ok: true, cauTruc: { khuon: 'goi-y', nac: [{ chu: 'Gợi ý 1.' }, { chu: 'Gợi ý 2.' }, { chu: 'Gợi ý 3.' }] } })
    expect(r.cauTruc).not.toHaveProperty('yDS')
  })
})
