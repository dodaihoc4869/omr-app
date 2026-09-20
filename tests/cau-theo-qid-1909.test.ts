// @vitest-environment node
// POST /hs/cau-theo-qid — nội dung câu để em LÀM đúng các câu việc on_lai đã chọn. LUẬT ĐỎ: không đáp án, không lời giải, không dò kho.
import { describe, it, expect, vi } from 'vitest'
import worker from '../server/src/index'
import { cauCongKhai, TOI_DA_QID_MOT_LUOT } from '../server/src/cau-theo-qid'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

vi.mock('../server/src/game-v2-auth', async (orig) => ({
  ...(await orig<typeof import('../server/src/game-v2-auth')>()),
  gameIdentity: async (_e: unknown, b: Record<string, unknown>) => {
    if (b.token !== 'token-S1') throw new Error('Phiên đăng nhập không hợp lệ.')
    return 'S1'
  },
}))

// Mọi chuỗi "bí mật" dùng làm dấu vết: nếu chúng xuất hiện ở phản hồi thì đã lộ đáp án/lời giải.
const DAP_AN_BI_MAT = 'DSDS'
const LOI_GIAI_BI_MAT = 'LOI-GIAI-BI-MAT-XYZ'
const H = 3_600_000

const cauKho = (qid: string, o: Record<string, unknown> = {}) => ({
  qid, maDe: 'x', version: 'v-bi-mat', group: `g-${qid}`, phan: 'II', text: `Xét các phát biểu về ${qid}.`, choices: [], ideas: ['ý a', 'ý b', 'ý c', 'ý d'],
  hinhAnh: [{ viTri: 'truoc_de', url: 'a.png' }, { viTri: 'sau_loi_giai', url: 'ANH-LOI-GIAI.png' }], dang: 'ES.A.X', tenDang: 'Tên dạng', mucDo: 'hieu', sao: 1,
  kienThuc: ['k1'], correct: DAP_AN_BI_MAT, solution: LOI_GIAI_BI_MAT, reviewed: true, truongLa: 'TRUONG-LA-BI-MAT', ...o,
})

function themCau(d: D1That, maDe: string, cau: ReturnType<typeof cauKho>[]) {
  d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'12',?,?,0,'v1')").run(maDe, maDe, cau.length, `kho/${maDe}.json`)
  d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(maDe)
  for (const c of cau) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(maDe, c.qid, 'v', c.group, c.dang, JSON.stringify({ ...c, maDe }))
}
const themHs = (d: D1That, sbd: string) => d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES(?,'x','x')").run(sbd)
async function daGap(d: D1That, sbd: string, qids: string[]) {
  const r = await ghiSuKien(d.env, qids.map((q, i) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd, qid: q, lan: i + 1, ketQua: 0 as const, luc: new Date(Date.now() - 48 * H).toISOString() })))
  expect(r.ok).toBe(true)
}
const goi = (d: D1That, b: Record<string, unknown>) => goiWorker(worker, d.env, '/hs/cau-theo-qid', b)

/** Em S1 đã gặp A, B, C; kho có A, B, C, D (D em CHƯA gặp), E (em đã gặp nhưng kho không có). */
async function dung() {
  const d = taoD1That()
  themHs(d, 'S1'); themHs(d, 'S2')
  themCau(d, 'DE1', ['A', 'B', 'C', 'D'].map((k) => cauKho(`DE1-II-${k}`)))
  await daGap(d, 'S1', ['DE1-II-A', 'DE1-II-B', 'DE1-II-C', 'KHONG-CO-TRONG-KHO'])
  return d
}

describe('không bao giờ lộ đáp án, lời giải hay trường lạ', () => {
  it('phản hồi không chứa đáp án/lời giải/ảnh lời giải/trường lạ/khoá reviewed, version, group', async () => {
    const d = await dung()
    const r = await goi(d, { sbd: 'S1', qid: ['DE1-II-A', 'DE1-II-B'] })
    expect(r.ok).toBe(true)
    expect(r.cau).toHaveLength(2)
    const chuoi = JSON.stringify(r)
    for (const bi of [DAP_AN_BI_MAT, LOI_GIAI_BI_MAT, 'ANH-LOI-GIAI', 'TRUONG-LA-BI-MAT', 'v-bi-mat', 'g-DE1']) expect(chuoi).not.toContain(bi)
    for (const c of r.cau as Record<string, unknown>[]) {
      for (const k of ['correct', 'solution', 'reviewed', 'dapAn', 'dapAnDung', 'loiGiai', 'version', 'group', 'truongLa']) expect(k in c).toBe(false)
      expect(Object.keys(c).sort()).toEqual(
        ['choiceImgs', 'choices', 'dang', 'hinhAnh', 'ideaImgs', 'ideas', 'imageDataUrl', 'kienThuc', 'maDe', 'mucDo', 'phan', 'qid', 'sao', 'table', 'tenDang', 'text', 'thanCauImg'].filter((k) => k in c || ['choices', 'ideas', 'hinhAnh', 'kienThuc'].includes(k)).sort(),
      )
    }
  })

  it('hàm cauCongKhai là whitelist: thêm trường lạ vào nguồn cũng không ra', () => {
    const c = cauCongKhai({ ...cauKho('Q'), correct: 'X', solution: 'Y', bi: 'Z' } as never) as Record<string, unknown>
    expect(JSON.stringify(c)).not.toMatch(/"correct"|"solution"|"bi"|"reviewed"|"version"|"group"/)
    expect(c.hinhAnh).toEqual([{ viTri: 'truoc_de', url: 'a.png' }])
  })

  it('giữ nội dung em cần để làm: thân câu, ý, bảng, ảnh thân câu, dạng, mức độ', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    themCau(d, 'DE1', [cauKho('DE1-I-1', { phan: 'I', choices: ['A. a', 'B. b', 'C. c', 'D. d'], ideas: [], table: [['x', 'y']], thanCauImg: 'than.png', imageDataUrl: 'data:x' })])
    await daGap(d, 'S1', ['DE1-I-1'])
    const c = ((await goi(d, { sbd: 'S1', qid: ['DE1-I-1'] })).cau as Record<string, unknown>[])[0]!
    expect(c).toMatchObject({ qid: 'DE1-I-1', phan: 'I', choices: ['A. a', 'B. b', 'C. c', 'D. d'], table: [['x', 'y']], thanCauImg: 'than.png', dang: 'ES.A.X', mucDo: 'hieu' })
  })
})

describe('không cho dò kho', () => {
  it('qid em CHƯA từng gặp (dù có trong kho) không được trả và không phân biệt được với qid không tồn tại', async () => {
    const d = await dung()
    const r = await goi(d, { sbd: 'S1', qid: ['DE1-II-D', 'KHONG-TON-TAI', 'DE1-II-A'] })
    expect((r.cau as { qid: string }[]).map((c) => c.qid)).toEqual(['DE1-II-A'])
    expect(r.khongCo).toEqual(['DE1-II-D', 'KHONG-TON-TAI'])
    expect(JSON.stringify(r)).not.toContain('DE1-II-D.') // không có thân câu D
  })

  it('em khác gặp câu đó không giúp được: S2 chưa gặp gì → không lấy được câu của S1', async () => {
    const d = await dung()
    const r = await goi(d, { sbd: 'S2', qid: ['DE1-II-A', 'DE1-II-B'] })
    expect(r).toMatchObject({ ok: true, cau: [], khongCo: ['DE1-II-A', 'DE1-II-B'] })
  })

  it('qid em đã gặp nhưng kho không có → khongCo, không lỗi', async () => {
    const d = await dung()
    expect(await goi(d, { sbd: 'S1', qid: ['KHONG-CO-TRONG-KHO'] })).toMatchObject({ ok: true, cau: [], khongCo: ['KHONG-CO-TRONG-KHO'] })
  })

  it('câu của đề thi CHƯA công bố bị loại dù em đã gặp (người biết SBD không lấy đề ra sớm)', async () => {
    const d = await dung()
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CAP','Ca','mo',?,?,45,'thi','khong','key/CAP.json','x')")
      .run(new Date(Date.now() + 24 * H).toISOString(), new Date(Date.now() + 30 * H).toISOString())
    await d.env.DE.put('key/CAP.json', JSON.stringify({ phanI: [{ id: 'DE1-II-B', text: 'x', choices: ['A. a', 'B. b', 'C. c', 'D. d'], correct: 'B', dang: { ma: 'ES.A.X' }, mucDo: 'hieu', kienThuc: ['k1'] }] }))
    const r = await goi(d, { sbd: 'S1', qid: ['DE1-II-A', 'DE1-II-B'] })
    expect((r.cau as { qid: string }[]).map((c) => c.qid)).toEqual(['DE1-II-A'])
    expect(r.khongCo).toEqual(['DE1-II-B'])
  })

  it('không kiểm được phạm vi đề bảo vệ thì ĐÓNG CỬA: không trả câu nào', async () => {
    const d = await dung()
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CAP','Ca','mo',?,?,45,'thi','khong','key/HONG.json','x')")
      .run(new Date(Date.now() + 24 * H).toISOString(), new Date(Date.now() + 30 * H).toISOString())
    // key/HONG.json không tồn tại → protectedQuestions ném lỗi
    const r = await goi(d, { sbd: 'S1', qid: ['DE1-II-A'] })
    expect(r.ok).toBe(false)
    expect(JSON.stringify(r)).not.toContain('Xét các phát biểu')
  })
})

describe('kiểm đầu vào', () => {
  it('SBD lạ / SBD bịa / SBD quá dài → ok:false, không trả gì, không ghi gì', async () => {
    const d = await dung()
    const truoc = ['su_kien_hoc', 'ke_hoach_ngay', 'hoc_sinh'].map((b) => d.chup(b))
    for (const sbd of ['00000000', 'khong-co', 'x'.repeat(200), "1'; DROP TABLE hoc_sinh;--"]) {
      const r = await goi(d, { sbd, qid: ['DE1-II-A'] })
      expect(r).toMatchObject({ ok: false })
      expect('cau' in r).toBe(false)
    }
    expect(['su_kien_hoc', 'ke_hoach_ngay', 'hoc_sinh'].map((b) => d.chup(b))).toEqual(truoc)
  })

  it('thiếu SBD/token, qid không phải mảng, quá 20 qid → ok:false có lời báo', async () => {
    const d = await dung()
    expect(await goi(d, { qid: ['A'] })).toMatchObject({ ok: false, error: 'Thiếu số báo danh' })
    expect(await goi(d, { sbd: 'S1' })).toMatchObject({ ok: false })
    expect(await goi(d, { sbd: 'S1', qid: 'DE1-II-A' })).toMatchObject({ ok: false })
    const nhieu = Array.from({ length: TOI_DA_QID_MOT_LUOT + 1 }, (_, i) => `Q${i}`)
    expect(await goi(d, { sbd: 'S1', qid: nhieu })).toMatchObject({ ok: false })
    expect((await goi(d, { sbd: 'S1', qid: nhieu.slice(0, TOI_DA_QID_MOT_LUOT) })).ok).toBe(true)
  })

  it('qid rỗng, trùng, có khoảng trắng, không phải chữ, quá dài: dọn sạch, giữ thứ tự xin', async () => {
    const d = await dung()
    const r = await goi(d, { sbd: 'S1', qid: [' DE1-II-C ', 'DE1-II-A', 'DE1-II-C', '', 7, null, 'y'.repeat(500), 'DE1-II-B'] })
    expect((r.cau as { qid: string }[]).map((c) => c.qid)).toEqual(['DE1-II-C', 'DE1-II-A', 'DE1-II-B'])
    expect(r.khongCo).toEqual([])
  })

  it('mảng qid rỗng → ok, không câu nào, không truy vấn nội dung', async () => {
    const d = await dung()
    expect(await goi(d, { sbd: 'S1', qid: [] })).toMatchObject({ ok: true, cau: [], khongCo: [] })
  })
})

describe('đăng nhập bằng token', () => {
  it('có token thì lấy SBD từ chữ ký, bỏ qua sbd trong body (không giả danh em khác)', async () => {
    const d = await dung()
    const r = await goi(d, { token: 'token-S1', sbd: 'S2', qid: ['DE1-II-A'] })
    expect((r.cau as { qid: string }[]).map((c) => c.qid)).toEqual(['DE1-II-A'])
    const sai = await goi(d, { token: 'token-sai', qid: ['DE1-II-A'] })
    expect((sai as { ok?: boolean }).ok).not.toBe(true)
  })
})

describe('chi phí', () => {
  it('đúng 3 truy vấn D1 của lệnh + 1 truy vấn kiểm đề bảo vệ; không đọc R2 kho', async () => {
    const d = await dung()
    let docR2 = 0
    const get = d.env.DE.get.bind(d.env.DE)
    d.env.DE.get = (async (k: string) => { docR2++; return get(k) }) as never
    await goiWorker(worker, d.env, '/khong-co-duong-nay', {}) // làm nóng đệm cổng đóng băng reset (1 truy vấn cau_hinh / 3 giây / isolate), không tính vào lệnh
    const truoc = d.soLenh.prepare
    const r = await goi(d, { sbd: 'S1', qid: ['DE1-II-A', 'DE1-II-B', 'DE1-II-C'] })
    expect(r.ok).toBe(true)
    // 1 (em thật + đã gặp) + 1 (nội dung) + 1 (protectedQuestions: danh sách ca; không ca bảo vệ nên không đọc R2)
    expect(d.soLenh.prepare - truoc).toBe(3)
    expect(docR2).toBe(0)
  })
})
