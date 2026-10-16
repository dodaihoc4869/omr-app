// @vitest-environment node
// HỎI THÊM THẦY (thầy 13/10): Gemini đọc TRỌN đề + lời giải, trả lời giọng Thầy Đỗ Đại Học, chỉ trong phạm vi câu đang xem; khoá ở máy chủ; không gửi SBD/tên.
import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { CAU_CHUA_NOP, CAU_NGOAI_PHAM_VI, DS_MODEL_DU_PHONG, chanLoDapAn, dapAnDeDoc, dungNoiDung, giaiCauHinhHoiThem, lamSachTraLoi, tachKetQua, type NguCanhCau } from '../server/src/hoi-tro-ly'

const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { cau: Record<string, unknown> }>
const RA2 = path.join(GOC, 'docs/loi-giai-a/chay-thu-2/ra')
const Q_TN = '12-KT-C1-D4-I-6', Q_DS = '12-KT-C1-D4-II-4', Q_TLN = '12-KT-C1-D2-III-6'
const cauThat = (qid: string, so: number) => ({ ...MAU[qid].cau, so })
const GOI_A = { cau: [cauThat(Q_TN, 6), cauThat(Q_DS, 4), cauThat(Q_TLN, 6)] }
const DE_A = '12-THU-A'
const QA = { tn: `${DE_A}-I-6`, ds: `${DE_A}-II-4`, tln: `${DE_A}-III-6` }
const SBD = 'SBD-ZX-9183'

const thay = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b, true)
const em = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b)
function hoSoTu(tep: string, qid: string, bam: string) {
  const h = JSON.parse(fs.readFileSync(path.join(RA2, tep), 'utf8'))
  const { canThayChot: _c, de: _de, ...r } = h
  return { ...r, qid, bam, co: [] }
}
async function chuanBi(khoa = 'khoa-thu-gemini') {
  const d = taoD1That()
  if (khoa) (d.env as { GEMINI_API_KEY?: string }).GEMINI_API_KEY = khoa
  await thay(d, '/kho/day', { maDe: DE_A, lop: '12', de: GOI_A, cau: [] })
  const l = await thay(d, '/kho/loi-giai/viec', { so: 5 })
  for (const v of l.viec as { qid: string; bam: string }[]) {
    if (v.qid === QA.tln) continue // câu chưa có hồ sơ từng bước
    const tep = v.qid === QA.tn ? '02-12-KT-C1-D4-I-6.json' : '04-12-KT-C1-D4-II-4.json'
    expect(await thay(d, '/kho/loi-giai/nop', { qid: v.qid, bam: v.bam, hoSo: hoSoTu(tep, v.qid, v.bam) })).toMatchObject({ ok: true })
  }
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(SBD, 'Nguyễn Văn Thử')
  return { d, token: await gameToken(d.env, SBD) }
}
type Goi = { url: string; body: Record<string, any>; headers: Record<string, string> }
function giaGemini(traLoi: (body: Record<string, any>) => unknown, status = 200) {
  const goi: Goi[] = []
  const that = globalThis.fetch
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    if (!url.startsWith('https://generativelanguage.googleapis.com/')) return that(input, init)
    const body = JSON.parse(String(init?.body)) as Record<string, any>
    goi.push({ url, body, headers: init?.headers as Record<string, string> })
    const kq = traLoi(body)
    const json = typeof kq === 'string' ? { candidates: [{ content: { parts: [{ text: kq }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 1200, candidatesTokenCount: 90 } } : kq
    return new Response(JSON.stringify(json), { status, headers: { 'content-type': 'application/json' } })
  })
  return goi
}
const traLoiJson = (o: unknown) => JSON.stringify(o)
afterEach(() => { vi.restoreAllMocks() })

describe('hàm thuần', () => {
  it('cấu hình: mặc định bật, chặn biên, JSON hỏng ⇒ mặc định', () => {
    expect(giaiCauHinhHoiThem(null)).toMatchObject({ bat: true, tranNgay: 36, tranCau: 6, model: 'gemini-3.1-flash-lite' }) // thầy tối 13/10: "chuyển xuống mô hình 3.1 flash lite"; 14/10: trần 36 lần/ngày
    expect(giaiCauHinhHoiThem('{"bat":false,"tranNgay":999,"lop":["12A1"," "],"model":"gemini-2.5-pro"}')).toMatchObject({ bat: false, tranNgay: 200, lop: ['12A1'], model: 'gemini-2.5-pro' })
    expect(giaiCauHinhHoiThem('{"model":"../x"}').model).toBe('gemini-3.1-flash-lite')
    expect(giaiCauHinhHoiThem('không phải json')).toMatchObject({ bat: true })
  })
  it('đáp án Phần II viết theo từng ý; phần khác giữ nguyên', () => {
    expect(dapAnDeDoc('II', 'DSSD', { a: '…', b: '…', c: '…', d: '…' })).toBe('a) Đúng · b) Sai · c) Sai · d) Đúng')
    expect(dapAnDeDoc('I', 'C', null)).toBe('C')
  })
  it('đầu ra JSON {lienQuan, traLoi}; có rào ```json; lỡ khuôn ⇒ coi cả chữ là lời trả lời', () => {
    expect(tachKetQua('{"lienQuan":false,"traLoi":""}')).toEqual({ lienQuan: false, traLoi: '' })
    expect(tachKetQua('```json\n{"lienQuan":true,"traLoi":"Em xem bước 2."}\n```')).toEqual({ lienQuan: true, traLoi: 'Em xem bước 2.' })
    expect(tachKetQua('Em xem bước 2.')).toEqual({ lienQuan: true, traLoi: 'Em xem bước 2.' })
  })
  it('làm sạch theo quy tắc của Thầy: bỏ in đậm, gạch ngang dài, emoji; gạch đầu dòng ⇒ •', () => {
    expect(lamSachTraLoi('**Chỗ em sai** — em ghép nhầm gốc 😀\n- bước 1\n\n\n\nhết')).toBe('Chỗ em sai, em ghép nhầm gốc\n• bước 1\n\nhết')
  })
  it('em ĐANG LÀM: bỏ câu lộ đáp án (phương án đúng, chữ phương án đúng, đúng/sai từng ý, đáp số); giữ câu gợi hướng', () => {
    const pa = { A: '8,2 gam', B: '9,6 gam', C: '6,8 gam', D: '4,1 gam' }
    expect(chanLoDapAn('Em viết phương trình thuỷ phân trước.\nĐáp án là A nhé.', 'I', 'A', pa)).toBe('Em viết phương trình thuỷ phân trước.')
    expect(chanLoDapAn('Tính n ester trước. Ra m = 8,2 gam.', 'I', 'A', pa)).toBe('Tính n ester trước.')
    expect(chanLoDapAn('Em chọn B là sai vì ghép nhầm gốc.', 'I', 'A', pa)).toBe(CAU_CHUA_NOP)
    expect(chanLoDapAn('Muối ứng với gốc acid, em xem lại tên ester.', 'I', 'A', pa)).toBe('Muối ứng với gốc acid, em xem lại tên ester.')
    expect(chanLoDapAn('Ý a sai vì chưa đun. Em đọc kĩ điều kiện phản ứng.', 'II', 'SDDS', null)).toBe('Em đọc kĩ điều kiện phản ứng.')
    expect(chanLoDapAn('b) đúng.', 'II', 'SDDS', null)).toBe(CAU_CHUA_NOP)
    expect(chanLoDapAn('Bảo toàn khối lượng cho CO2. Kết quả 58 nhé.', 'III', '58', null)).toBe('Bảo toàn khối lượng cho CO2.')
    expect(chanLoDapAn('Có 0,58 mol khí, 158 gam muối.', 'III', '58', null)).toBe('Có 0,58 mol khí, 158 gam muối.')
    expect(chanLoDapAn('Ra 2,5 mol.', 'III', '2.5', null)).toBe(CAU_CHUA_NOP)
  })

  it('nội dung gửi Gemini: đủ đề, phương án, bảng, HÌNH (ảnh nhúng), đáp án, lời giải; giọng Thầy; không lời nào có SBD', () => {
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const nc: NguCanhCau = {
      qid: 'X-I-1',
      cau: { phan: 'I', so: '1', chuong: 'Ester', mucDo: 'hiểu', de: 'Thuỷ phân 8,8 gam ethyl acetate trong NaOH dư.', pa: { A: '8,2 gam', B: '9,6 gam', C: '6,8 gam', D: '4,6 gam' }, y: null, dapAn: 'A', bang: [['Chất', 'M'], ['CH3COOC2H5', '88']], hinh: [{ viTri: 'sau_de', duLieu: png }, { viTri: 'sau_loi_giai', duLieu: png }], loiGiai: { chot: 'n = 0,1 mol, m = 8,2 gam', tung_pa: { B: { dung: false, vi_sao: 'nhầm C2H5COONa' } } } },
      hoSo: { buoc: [{ t: 'Viết phương trình', anh: png }] },
      loiGiaiChu: null,
      kiem: { buoc: ['Viết phương trình'], loiGo: [{ buoc: 0, noiDung: 'Thầy giảng: acetate vào muối.' }] },
      boTro: { cauKiem: [{ hoi: 'n ester?', dap_an: '0,1' }] },
      hocLieu: { buoc: [{ tieuDe: 'Xác định muối', loiThuongGap: [{ tinHieu: 'chọn 9,6' }] }] },
    }
    const nd = dungNoiDung(nc, [{ cauHoi: 'Muối là gì ạ?', traLoi: 'Muối là CH3COONa.' }], 'Sao B sai ạ?', { ketQuaGanNhat: 'sai', dapAnEm: 'B' })
    const dl = nd.contents[0]!.parts[0]!.text!
    for (const can of ['Thuỷ phân 8,8 gam ethyl acetate', 'A. 8,2 gam', 'D. 4,6 gam', 'CH3COOC2H5 | 88', 'ĐÁP ÁN ĐÚNG: A', 'nhầm C2H5COONa', 'Viết phương trình', 'Thầy giảng: acetate vào muối.', 'n ester?', 'Xác định muối', 'em chọn/ghi: B', 'SAI']) expect(dl).toContain(can)
    expect(nd.contents[0]!.parts.filter((p) => p.inline_data)).toHaveLength(3) // hình đề + hình lời giải + hình trong hồ sơ
    expect(dl).not.toContain('base64')
    expect(nd.systemInstruction.parts[0]!.text).toContain('Thầy Đỗ Đại Học')
    expect(nd.systemInstruction.parts[0]!.text).toContain('"lienQuan"')
    expect(nd.contents.map((c) => c.role)).toEqual(['user', 'model', 'user', 'model', 'user'])
    expect(nd.contents.at(-1)!.parts[0]!.text).toBe('Sao B sai ạ?')
  })
})

describe('/hs/hoi-tro-ly qua Worker, D1 thật', () => {
  it('chưa đặt khoá ⇒ Hỏi thầy không kèm hoiThem; hỏi thêm báo chưa mở, KHÔNG gọi Google', async () => {
    const { d, token } = await chuanBi('')
    const goi = giaGemini(() => 'x')
    expect(await em(d, '/hs/hoi-thay', { token, qid: QA.ds })).toMatchObject({ ok: true, hoiThem: false })
    expect(await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Vì sao ý b sai ạ?' })).toMatchObject({ ok: false, ma: 'chua_bat' })
    expect(goi).toHaveLength(0)
  })

  it('chưa bấm Hỏi thầy ở câu đó ⇒ chua_mo, KHÔNG gọi Google', async () => {
    const { d, token } = await chuanBi()
    const goi = giaGemini(() => 'x')
    expect(await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Vì sao ý b sai ạ?' })).toMatchObject({ ok: false, ma: 'chua_mo' })
    expect(goi).toHaveLength(0)
  })

  it('đầu-cuối: Gemini nhận TRỌN đề + ý + đáp án + lời giải kho + hồ sơ từng bước; khoá ở header; không SBD/tên; trả lời đã làm sạch; ghi sổ', async () => {
    const { d, token } = await chuanBi()
    // SỬA CÓ CHỦ ĐÍCH 16/10: ví dụ giải thích kiến thức, không quy kết bài nháp chưa có.
    const goi = giaGemini(() => traLoiJson({ lienQuan: true, traLoi: 'Ý b sai vì **điều kiện** chưa đủ — xem lại bước 2.' }))
    const mo = await em(d, '/hs/hoi-thay', { token, qid: QA.ds, nguon: 'luyen_de' })
    expect(mo).toMatchObject({ ok: true, coLoiGiai: true, hoiThem: true })
    const r = await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, nguon: 'luyen_de', cauHoi: 'Vì sao ý b sai ạ?', dapAnEm: 'b Đúng' })
    expect(r).toMatchObject({ ok: true, traLoi: 'Ý b sai vì điều kiện chưa đủ, xem lại bước 2.', conLai: 35, ngoaiPhamVi: false })
    expect(goi).toHaveLength(1)
    const g = goi[0]!
    expect(g.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent')
    expect(g.url).not.toContain('khoa-thu-gemini')
    expect(g.headers['x-goog-api-key']).toBe('khoa-thu-gemini')
    expect(g.body.generationConfig).toMatchObject({ responseMimeType: 'application/json' })
    expect(g.body.generationConfig.thinkingConfig).toBeUndefined() // thinkingBudget chỉ gửi cho dòng 2.5 (dòng khác báo lỗi tham số)
    const dl = g.body.contents[0].parts[0].text as string
    const goc = MAU[Q_DS].cau as Record<string, unknown>
    const deTho = String(goc.de ?? '').replace(/<[^>]+>/g, '').slice(0, 25)
    expect(deTho.length).toBeGreaterThan(10)
    expect(dl).toContain('ĐÁP ÁN ĐÚNG: a)')
    expect(dl).toContain('LỜI GIẢI TỪNG BƯỚC CỦA THẦY')
    expect(dl).toContain('em chọn/ghi: b Đúng')
    expect(dl.replace(/<[^>]+>/g, '')).toContain(deTho)
    const toanBo = JSON.stringify(g.body)
    expect(toanBo).not.toContain(SBD)
    expect(toanBo).not.toContain('Nguyễn Văn Thử')
    expect(d.dem('hoi_tro_ly', `sbd='${SBD}' AND lien_quan=1 AND loi IS NULL`)).toBe(1)
  })

  it('câu chưa có lời giải từng bước vẫn hỏi được; căn cứ đáp án + lời giải kho', async () => {
    const { d, token } = await chuanBi()
    const goi = giaGemini(() => traLoiJson({ lienQuan: true, traLoi: 'Em tính lại số mol trước.' }))
    expect(await em(d, '/hs/hoi-thay', { token, qid: QA.tln })).toMatchObject({ ok: true, coLoiGiai: false, hoiThem: true })
    expect(await em(d, '/hs/hoi-tro-ly', { token, qid: QA.tln, cauHoi: 'Em không hiểu cách tính ạ' })).toMatchObject({ ok: true })
    const dl = goi[0]!.body.contents[0].parts[0].text as string
    expect(dl).toContain('câu này Thầy chưa soạn xong')
    expect(dl).toContain('ĐÁP ÁN ĐÚNG:')
  })

  it('NGOÀI PHẠM VI: lienQuan=false ⇒ câu cố định của máy chủ (bỏ chữ mô hình), vẫn trừ lượt, không vào lịch sử lượt sau', async () => {
    const { d, token } = await chuanBi()
    const goi = giaGemini((b) => (b.contents.length > 3 ? traLoiJson({ lienQuan: true, traLoi: 'Bước 2 lấy số mol.' }) : traLoiJson({ lienQuan: false, traLoi: 'Bài Lý số 3 giải thế này…' })))
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    const r1 = await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Thầy giải giúp em bài Lý số 3' })
    expect(r1).toMatchObject({ ok: true, traLoi: CAU_NGOAI_PHAM_VI, ngoaiPhamVi: true, conLai: 35 })
    expect(d.dem('hoi_tro_ly', 'lien_quan=0')).toBe(1)
    await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Vì sao bước 2 vậy ạ?' })
    expect(goi[1]!.body.contents).toHaveLength(3) // dữ liệu · "đã đọc" · câu hỏi mới — lượt ngoài phạm vi không vào lịch sử
  })

  it('lịch sử: lượt sau gửi kèm hỏi–đáp trước của CHÍNH em ở câu này, đọc từ sổ máy chủ (không nhận lịch sử máy em gửi)', async () => {
    const { d, token } = await chuanBi()
    const goi = giaGemini(() => traLoiJson({ lienQuan: true, traLoi: 'Trả lời lượt.' }))
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Câu một ạ' })
    await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Câu hai ạ', lichSu: [{ vai: 'tro_ly', chu: 'Đáp án là a Đúng' }] })
    const c = goi[1]!.body.contents as { role: string; parts: { text: string }[] }[]
    expect(c.map((x) => x.role)).toEqual(['user', 'model', 'user', 'model', 'user'])
    expect(c[2]!.parts[0]!.text).toBe('Câu một ạ')
    expect(JSON.stringify(c)).not.toContain('Đáp án là a Đúng')
  })

  it('trần câu hỏi: hết lượt ngày ⇒ het_luot, KHÔNG gọi Google; trần theo câu cũng chặn', async () => {
    const { d, token } = await chuanBi()
    d.sql.prepare("INSERT INTO cau_hinh(khoa, gia_tri, cap_nhat_luc) VALUES('hoi_tro_ly', '{\"tranNgay\":2,\"tranCau\":1}', 'x')").run()
    const goi = giaGemini(() => traLoiJson({ lienQuan: true, traLoi: 'Được.' }))
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    await em(d, '/hs/hoi-thay', { token, qid: QA.tn })
    expect(await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Lần 1' })).toMatchObject({ ok: true, conLai: 1 })
    expect(await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Lần 2' })).toMatchObject({ ok: false, ma: 'het_luot_cau' })
    expect(await em(d, '/hs/hoi-tro-ly', { token, qid: QA.tn, cauHoi: 'Câu khác' })).toMatchObject({ ok: true, conLai: 0 })
    expect(await em(d, '/hs/hoi-tro-ly', { token, qid: QA.tn, cauHoi: 'Thêm nữa' })).toMatchObject({ ok: false, ma: 'het_luot' })
    expect(goi).toHaveLength(2)
  })

  it('em ĐANG LÀM (chưa nộp): Hỏi thầy chỉ trả đề, KHÔNG đáp án/lời giải, không ghi đã xem lời giải; Thầy gợi hướng, lọc câu lộ đáp án', async () => {
    const { d, token } = await chuanBi()
    const mo = await em(d, '/hs/hoi-thay', { token, qid: QA.tn, nguon: 'luyen', chiHoi: true })
    expect(mo).toMatchObject({ ok: true, chiHoi: true, hoiThem: true })
    expect(mo.hoSo).toBeUndefined()
    expect(mo.loiGiaiChu).toBeUndefined()
    expect(JSON.stringify(mo)).not.toMatch(/dap_?an|loi_?giai|"dapAn"/i)
    expect(d.dem('loi_giai_hoi', `sbd='${SBD}'`)).toBe(0)
    const dapAn = String(MAU[Q_TN].cau.dap_an)
    const goi = giaGemini(() => traLoiJson({ lienQuan: true, traLoi: `Em viết phương trình trước.\nĐáp án là ${dapAn}.` }))
    const r = await em(d, '/hs/hoi-tro-ly', { token, qid: QA.tn, nguon: 'luyen', cauHoi: 'Câu này làm sao ạ?', dangLam: true })
    expect(r).toMatchObject({ ok: true, traLoi: 'Em viết phương trình trước.', ngoaiPhamVi: false })
    const dl = goi[0]!.body.contents[0].parts[0].text as string
    expect(dl).toContain('EM ĐANG LÀM CÂU NÀY, CHƯA NỘP')
    // Thầy đã gợi hướng ⇒ một dòng "đã được chữa" (kiểm tra cá nhân chặn câu này 12 giờ)
    expect(d.dem('loi_giai_hoi', `sbd='${SBD}' AND co_ho_so=0 AND nguon='luyen:tro_ly'`)).toBe(1)
    // không gửi `dangLam` mà chưa mở lời giải ⇒ vẫn chặn như cũ
    expect(await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Vì sao ạ?' })).toMatchObject({ ok: false, ma: 'chua_mo' })
  })

  it('model Google báo 404 (ngừng cấp cho khoá mới) ⇒ tự thử tên dự phòng, em vẫn được trả lời; sổ ghi model thật đã trả lời', async () => {
    const { d, token } = await chuanBi()
    const goi = giaGemini(() => traLoiJson({ lienQuan: true, traLoi: 'Em tính lại số mol trước.' }))
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    vi.mocked(globalThis.fetch).mockImplementationOnce(async () => new Response(JSON.stringify({ error: { code: 404, message: 'models/gemini-3.1-flash-lite is not found' } }), { status: 404, headers: { 'content-type': 'application/json' } }))
    const r = await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Vì sao ạ?' })
    expect(r).toMatchObject({ ok: true, traLoi: 'Em tính lại số mol trước.', conLai: 35 })
    expect(goi.map((g) => g.url.split('/models/')[1])).toEqual(['gemini-3.5-flash-lite:generateContent'])
    expect(DS_MODEL_DU_PHONG[0]).toBe('gemini-3.5-flash-lite')
    expect(d.dem('hoi_tro_ly', "model='gemini-3.5-flash-lite' AND loi IS NULL")).toBe(1)
  })

  it('model đã bị gỡ (410) rồi bản dự phòng đầu cũng 404 ⇒ thử tiếp tên chung, em vẫn được trả lời', async () => {
    const { d, token } = await chuanBi()
    const goi = giaGemini(() => traLoiJson({ lienQuan: true, traLoi: 'Bước 1 em tính số mol.' }))
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    const het = (ma: number) => async () => new Response(JSON.stringify({ error: { code: ma, message: 'model gone' } }), { status: ma, headers: { 'content-type': 'application/json' } })
    vi.mocked(globalThis.fetch).mockImplementationOnce(het(410)).mockImplementationOnce(het(404))
    const r = await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Vì sao ạ?' })
    expect(r).toMatchObject({ ok: true, traLoi: 'Bước 1 em tính số mol.' })
    expect(goi.map((g) => g.url.split('/models/')[1])).toEqual(['gemini-flash-lite-latest:generateContent'])
    expect(d.dem('hoi_tro_ly', "model='gemini-flash-lite-latest' AND loi IS NULL")).toBe(1)
  })

  it('sổ hỏi Thầy (thầy 13/10 khuya: "bao nhiêu lượt hỏi, từ những số báo danh nào, hỏi câu gì"): chỉ máy thầy đọc được', async () => {
    const { d, token } = await chuanBi()
    giaGemini(() => traLoiJson({ lienQuan: true, yChinh: 'Em viết phương trình trước.' }))
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Câu này bắt đầu từ đâu ạ?' })
    await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Ý b sai chỗ nào ạ?' })
    const so = await thay(d, '/gv/hoi-tro-ly/so', {})
    expect(so).toMatchObject({ ok: true, tong: { luot: 2, traLoi: 2, ngoaiPhamVi: 0, loi: 0, soEm: 1, soCau: 1 } })
    expect(so.theoEm).toEqual([expect.objectContaining({ sbd: SBD, ten: 'Nguyễn Văn Thử', lop: '12', soLuot: 2, soCau: 1 })])
    expect(so.luot.map((x: { cauHoi: string }) => x.cauHoi)).toEqual(['Ý b sai chỗ nào ạ?', 'Câu này bắt đầu từ đâu ạ?']) // mới nhất trước
    expect(so.luot[0]).toMatchObject({ sbd: SBD, ten: 'Nguyễn Văn Thử', qid: QA.ds, ngoaiPhamVi: false, loi: '' })
    expect(so.luot[0].traLoi).toContain('Em viết phương trình trước.')
    expect(await thay(d, '/gv/hoi-tro-ly/so', { sbd: 'SBD-KHAC-1' })).toMatchObject({ ok: true, sbd: 'SBD-KHAC-1', tong: { luot: 0 }, theoEm: [], luot: [] })
    expect(await thay(d, '/gv/hoi-tro-ly/so', { sbd: 'x y' })).toMatchObject({ ok: false })
    const lo = await em(d, '/gv/hoi-tro-ly/so', { token })
    expect(lo.ok).toBe(false) // học sinh (không mã bí mật) không đọc được sổ
    expect(JSON.stringify(lo)).not.toContain('bắt đầu từ đâu')
  })

  it('lệnh thầy (13/10): xem lượt hôm nay, đặt lại (KHÔNG xoá sổ), SBD thử không giới hạn lượt; em không gọi được', async () => {
    const { d, token } = await chuanBi()
    d.sql.prepare("INSERT INTO cau_hinh(khoa, gia_tri, cap_nhat_luc) VALUES('hoi_tro_ly', '{\"tranNgay\":1}', 'x')").run()
    giaGemini(() => traLoiJson({ lienQuan: true, traLoi: 'Được.' }))
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    const hoi = (cauHoi: string) => em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi })
    expect(await hoi('Lần 1')).toMatchObject({ ok: true, conLai: 0 })
    expect(await hoi('Lần 2')).toMatchObject({ ok: false, ma: 'het_luot' })
    expect(await thay(d, '/gv/hoi-tro-ly/luot', { sbd: SBD })).toMatchObject({ ok: true, tranNgay: 1, tranCau: 6, homNay: 1, laSbdThu: false })
    expect(await em(d, '/gv/hoi-tro-ly/dat-lai', { token, sbd: SBD })).toMatchObject({ ok: false })
    expect(await thay(d, '/gv/hoi-tro-ly/dat-lai', { sbd: SBD })).toMatchObject({ ok: true, daDatLai: 1, homNay: 0 })
    expect(d.dem('hoi_tro_ly', `sbd='${SBD}'`)).toBe(1)
    expect(d.dem('hoi_tro_ly', `sbd='${SBD}' AND ngay_vn LIKE '%~dat-lai@%'`)).toBe(1)
    expect(await thay(d, '/gv/hoi-tro-ly/luot', { sbd: SBD })).toMatchObject({ homNay: 0 })
    expect(await hoi('Lần 3')).toMatchObject({ ok: true, conLai: 0 })
    expect(await hoi('Lần 4')).toMatchObject({ ok: false, ma: 'het_luot' })
    // SBD thử: ghi GỘP vào cấu hình (giữ trần thầy đã đặt), hỏi không giới hạn; bỏ ra ⇒ chặn lại như cũ
    expect(await thay(d, '/gv/hoi-tro-ly/sbd-thu', { sbd: SBD, them: true })).toMatchObject({ ok: true, sbdThu: [SBD] })
    const ch = JSON.parse(String((d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='hoi_tro_ly'").get() as { gia_tri: string }).gia_tri))
    expect(ch).toEqual({ tranNgay: 1, sbdKhongTran: [SBD] })
    expect(await thay(d, '/gv/hoi-tro-ly/luot', {})).toMatchObject({ ok: true, tranNgay: 1, sbdThu: [SBD] })
    expect(await hoi('Lần 5')).toMatchObject({ ok: true, conLai: 1 })
    expect(await hoi('Lần 6')).toMatchObject({ ok: true, conLai: 1 })
    expect(await thay(d, '/gv/hoi-tro-ly/sbd-thu', { sbd: SBD, them: false })).toMatchObject({ ok: true, sbdThu: [] })
    expect(await hoi('Lần 7')).toMatchObject({ ok: false, ma: 'het_luot' })
    expect(await thay(d, '/gv/hoi-tro-ly/dat-lai', { sbd: "x' OR 1=1" })).toMatchObject({ ok: false, error: 'Số báo danh không hợp lệ.' })
  })

  it('Gemini quá tải (429) ⇒ lời của Thầy cho em, KHÔNG trừ lượt, ghi lỗi vào sổ', async () => {
    const { d, token } = await chuanBi()
    giaGemini(() => ({ error: { message: 'Resource exhausted' } }), 429)
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    const r = await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Vì sao ạ?' })
    expect(r).toMatchObject({ ok: false, ma: 'qua_tai', conLai: 36 })
    expect(String(r.error)).toContain('Thầy đang trả lời nhiều em cùng lúc')
    expect(d.dem('hoi_tro_ly', "loi LIKE 'qua_tai%'")).toBe(1)
  })

  it('cấu hình chạy thử theo lớp: em không thuộc lớp ⇒ không hiện, không hỏi được', async () => {
    const { d, token } = await chuanBi()
    d.sql.prepare("INSERT INTO cau_hinh(khoa, gia_tri, cap_nhat_luc) VALUES('hoi_tro_ly', '{\"lop\":[\"11A1\"]}', 'x')").run()
    const goi = giaGemini(() => 'x')
    expect(await em(d, '/hs/hoi-thay', { token, qid: QA.ds })).toMatchObject({ ok: true, hoiThem: false })
    expect(await em(d, '/hs/hoi-tro-ly', { token, qid: QA.ds, cauHoi: 'Vì sao ạ?' })).toMatchObject({ ok: false, ma: 'chua_bat' })
    expect(goi).toHaveLength(0)
  })
})
