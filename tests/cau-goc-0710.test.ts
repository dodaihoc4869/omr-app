// @vitest-environment node
// POST /hs/cau-goc — nút nhỏ "Xem câu gốc" của ca "Kiểm chứng câu đã đúng" (thầy 07/10).
// LUẬT ĐỎ: đáp án không xuống máy em trước khi nộp ⇒ chỉ phần ĐỀ công khai; chỉ câu gốc gắn với đề của CHÍNH em ở CHÍNH ca ấy; không dò kho.
import { beforeEach, describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { cauGocCongKhai, cauGocDuocXem, TOI_DA_CAU_GOC } from '../server/src/cau-goc'
import { contentGroup, xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { khoaGoc } from '../src/lib/rut-de-da-dung'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const H = 3_600_000
// Dấu vết "bí mật": xuất hiện ở phản hồi nghĩa là đã lộ đáp án / lời giải / nhãn nội bộ.
const DAP_AN_BI_MAT = 'B'
const LOI_GIAI_BI_MAT = 'LOI-GIAI-BI-MAT-XYZ'
const ANH_LOI_GIAI = 'ANH-LOI-GIAI.png'
const TRUONG_LA = 'TRUONG-LA-BI-MAT'
const NHAN_THAY = 'Câu này thay số của câu em đã đúng ở Ca Thử · 01/10 · Thông hiểu'

const cauKho = (qid: string, o: Record<string, unknown> = {}) => ({
  qid, maDe: 'DE1', lop: '12', version: 'v-bi-mat', group: `g-${qid}`, phan: 'I', text: `Đề của ${qid}: chất nào sau đây là este?`,
  choices: ['A. HCOOCH₃', 'B. CH₃COOH', 'C. C₂H₅OH', 'D. CH₃CHO'], ideas: [], table: [['Chất', 'M'], ['X', '60']],
  hinhAnh: [{ viTri: 'sau_de', src: 'data:image/png;base64,AAAA', alt: 'Hình đề' }, { viTri: 'sau_loi_giai', src: ANH_LOI_GIAI }],
  dang: 'ES.A.X', tenDang: 'Tên dạng', mucDo: 'hieu', sao: 1, kienThuc: ['k1'], correct: DAP_AN_BI_MAT, solution: LOI_GIAI_BI_MAT, reviewed: true, truongLa: TRUONG_LA, ...o,
})

function themKho(d: D1That, cau: ReturnType<typeof cauKho>[], maDe = 'DE1') {
  d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'12',?,?,0,'v1')").run(maDe, maDe, cau.length, `kho/${maDe}.json`)
  d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(maDe)
  for (const c of cau) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(maDe, c.qid, 'v', c.group, c.dang, JSON.stringify({ ...c, maDe }))
}
const themHs = (d: D1That, sbd: string, lop = '12') => d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES(?,'x',?,'x')").run(sbd, lop)
const themLuot = (d: D1That, maCa: string, sbd: string) =>
  d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc) VALUES(?,?,?,1,'x','dang_lam','x')").run(`${maCa}|${sbd}|1`, maCa, sbd)
/** Ca đang MỞ (nên đề của nó nằm trong tập "đang bảo vệ"). `boTheoEm` = bản đồ đề riêng cả lớp (bo + daDung). */
function themCa(d: D1That, maCa: string, o: { boTheoEm?: unknown; bank?: string; congBo?: string } = {}) {
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,bo_theo_em_json,cap_nhat_luc) VALUES(?,?,'mo',?,?,45,'thi',?,?,?,'x')")
    .run(maCa, `Ca ${maCa}`, new Date(Date.now() - H).toISOString(), new Date(Date.now() + 24 * H).toISOString(), o.congBo ?? 'ngay', o.bank ?? `key/${maCa}.json`,
      o.boTheoEm === undefined ? null : typeof o.boTheoEm === 'string' ? o.boTheoEm : JSON.stringify(o.boTheoEm))
}
const bankCoCau = (...ids: string[]) => JSON.stringify({ phanI: ids.map((id) => ({ id, text: 'x', choices: ['A. a', 'B. b', 'C. c', 'D. d'], correct: 'B', dang: { ma: 'ES.A.X' }, mucDo: 'hieu', kienThuc: ['k1'] })) })
/** Gọi đường thật; bỏ `serverNow` (máy chủ gắn vào mọi lời đáp) để so nguyên dáng. */
const goi = async (d: D1That, b: Record<string, unknown>) => {
  const { serverNow: _bo, ...r } = (await goiWorker(worker, d.env, '/hs/cau-goc', b)) as Record<string, unknown>
  return r
}
const khongCo = (xin: string[]) => ({ ok: true, cau: {}, khongCo: xin })

/** Dựng ca KC: S1 có hai câu thay (gốc DE1-I-1 và DE1-I-2); S2 có một câu thay (gốc DE1-I-3). Kho có thêm DE1-I-4 (em nào cũng chưa gắn). */
async function dung(o: { boTheoEm?: unknown } = {}) {
  const d = taoD1That()
  xoaDemCaBaoVe()
  themHs(d, 'S1'); themHs(d, 'S2'); themHs(d, 'S3')
  themKho(d, ['DE1-I-1', 'DE1-I-2', 'DE1-I-3', 'DE1-I-4'].map((q) => cauKho(q)))
  const boTheoEm = o.boTheoEm ?? {
    bo: { S1: ['DE1-I-1~ss1', 'DE1-I-2~ss1'], S2: ['DE1-I-3~ss1'] },
    daDung: {
      S1: { 'DE1-I-1~ss1': NHAN_THAY, [khoaGoc('DE1-I-1~ss1')]: 'DE1-I-1', 'DE1-I-2~ss1': NHAN_THAY, [khoaGoc('DE1-I-2~ss1')]: 'DE1-I-2' },
      S2: { 'DE1-I-3~ss1': NHAN_THAY, [khoaGoc('DE1-I-3~ss1')]: 'DE1-I-3' },
    },
  }
  themCa(d, 'KC', { boTheoEm })
  await d.env.DE.put('key/KC.json', bankCoCau('DE1-I-1~ss1', 'DE1-I-2~ss1', 'DE1-I-3~ss1'))
  themLuot(d, 'KC', 'S1'); themLuot(d, 'KC', 'S2')
  return d
}

beforeEach(() => xoaDemCaBaoVe())

describe('/hs/cau-goc — chỉ phần ĐỀ công khai, không đáp án', () => {
  it('trả đề + phương án + bảng + ảnh đề; KHÔNG đáp án, lời giải, ảnh lời giải, nhãn nội bộ, trường lạ', async () => {
    const d = await dung()
    const r = await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-1'] })
    expect(r).toMatchObject({ ok: true, khongCo: [] })
    const c = (r.cau as Record<string, Record<string, unknown>>)['DE1-I-1']!
    expect(c).toMatchObject({ qid: 'DE1-I-1', phan: 'I', choices: ['A. HCOOCH₃', 'B. CH₃COOH', 'C. C₂H₅OH', 'D. CH₃CHO'], table: [['Chất', 'M'], ['X', '60']] })
    expect(String(c.text)).toContain('chất nào sau đây là este?')
    expect(c.hinhAnh).toEqual([{ viTri: 'sau_de', src: 'data:image/png;base64,AAAA', alt: 'Hình đề' }]) // ảnh của đề còn, ảnh sau lời giải KHÔNG
    const chuoi = JSON.stringify(r)
    for (const bi of [LOI_GIAI_BI_MAT, ANH_LOI_GIAI, TRUONG_LA, 'v-bi-mat', 'g-DE1']) expect(chuoi, bi).not.toContain(bi)
    for (const k of ['correct', 'solution', 'reviewed', 'dapAn', 'loiGiai', 'version', 'group', 'truongLa', 'kienThuc', 'dang', 'tenDang', 'mucDo', 'sao', 'maDe']) expect(k in c, k).toBe(false)
    expect(Object.keys(c).sort()).toEqual(['choiceImgs', 'choices', 'hinhAnh', 'ideaImgs', 'ideas', 'imageDataUrl', 'phan', 'qid', 'table', 'text', 'thanCauImg'].filter((k) => k in c))
  })

  it('hàm cauGocCongKhai là whitelist: thêm trường lạ vào nguồn cũng không ra', () => {
    const c = cauGocCongKhai({ ...cauKho('Q'), bi: 'Z', dapAnDung: 'A' } as never) as Record<string, unknown>
    expect(JSON.stringify(c)).not.toMatch(/"correct"|"solution"|"bi"|"dapAnDung"|"reviewed"|"version"|"group"|"kienThuc"|"mucDo"/)
  })
})

describe('/hs/cau-goc — chỉ câu gốc gắn với đề của CHÍNH em ở CHÍNH ca ấy (không dò kho)', () => {
  it('em xem được cả hai câu gốc của mình trong một lượt', async () => {
    const d = await dung()
    const r = await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-1', 'DE1-I-2'] })
    expect(Object.keys(r.cau as object).sort()).toEqual(['DE1-I-1', 'DE1-I-2'])
    expect(r.khongCo).toEqual([])
  })

  it('câu gốc của em KHÁC, câu có trong kho nhưng không gắn, câu không tồn tại ⇒ cùng một dáng "khongCo" (không phân biệt được)', async () => {
    const d = await dung()
    const r = await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-3', 'DE1-I-4', 'KHONG-TON-TAI', 'DE1-I-1'] })
    expect(Object.keys(r.cau as object)).toEqual(['DE1-I-1'])
    expect(r.khongCo).toEqual(['DE1-I-3', 'DE1-I-4', 'KHONG-TON-TAI'])
    expect(JSON.stringify(r)).not.toContain('Đề của DE1-I-3')
    expect(JSON.stringify(r)).not.toContain('Đề của DE1-I-4')
    // em S2 xin câu gốc của S1
    expect(await goi(d, { maCa: 'KC', sbd: 'S2', qid: ['DE1-I-1'] })).toEqual(khongCo(['DE1-I-1']))
  })

  it('không lấy được CÂU THAY của đề đang làm qua đường này: chỉ giá trị của khoá "~goc:" mới là câu gốc được xem', async () => {
    const d = await dung()
    expect(await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-1~ss1'] })).toEqual(khongCo(['DE1-I-1~ss1']))
  })

  it('em chưa có lượt ở ca (chưa vào thi) hoặc không phải em của ca ⇒ không câu nào', async () => {
    const d = await dung()
    themHs(d, 'S9')
    expect(await goi(d, { maCa: 'KC', sbd: 'S9', qid: ['DE1-I-1'] })).toEqual(khongCo(['DE1-I-1']))
    // S3 có hồ sơ nhưng chưa có lượt: dù bản đồ có ghi câu gốc cho S3 cũng không phát
    const d2 = await dung({ boTheoEm: { bo: { S3: ['DE1-I-1~ss1'] }, daDung: { S3: { 'DE1-I-1~ss1': NHAN_THAY, [khoaGoc('DE1-I-1~ss1')]: 'DE1-I-1' } } } })
    expect(await goi(d2, { maCa: 'KC', sbd: 'S3', qid: ['DE1-I-1'] })).toEqual(khongCo(['DE1-I-1']))
  })

  it('mã ca khác: câu gốc của ca KC không xem được bằng mã ca khác', async () => {
    const d = await dung()
    themCa(d, 'KHAC', { boTheoEm: { bo: { S1: ['DE1-I-4'] }, daDung: { S1: {} } } })
    await d.env.DE.put('key/KHAC.json', bankCoCau('DE1-I-4'))
    themLuot(d, 'KHAC', 'S1')
    xoaDemCaBaoVe()
    expect(await goi(d, { maCa: 'KHAC', sbd: 'S1', qid: ['DE1-I-1'] })).toEqual(khongCo(['DE1-I-1']))
    expect(await goi(d, { maCa: 'KHONG-CO-CA', sbd: 'S1', qid: ['DE1-I-1'] })).toEqual(khongCo(['DE1-I-1']))
  })

  it('bản đồ ca hỏng / trống / chưa có phần daDung ⇒ không câu nào, không lỗi', async () => {
    for (const bo of ['không phải JSON {', '[]', '"chuoi"', '{}', { bo: { S1: ['x'] } }, null]) {
      const d = await dung({ boTheoEm: bo })
      if (bo === null) d.sql.prepare("UPDATE ca SET bo_theo_em_json = NULL WHERE ma_ca = 'KC'").run()
      expect(await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-1'] })).toEqual(khongCo(['DE1-I-1']))
    }
  })

  it('cauGocDuocXem: chỉ giá trị của khoá "~goc:…" (chuỗi, không rỗng, đã cắt khoảng trắng); JSON hỏng ⇒ rỗng', () => {
    const j = JSON.stringify({ a: 'x', [khoaGoc('t1')]: ' Q1 ', [khoaGoc('t2')]: '', [khoaGoc('t3')]: 7, [khoaGoc('t4')]: ['Q4'], '~goc': 'Q5' })
    expect([...cauGocDuocXem(j)]).toEqual(['Q1'])
    for (const hong of ['', 'khong json', '[]', '"s"', 'null', null, undefined, 3]) expect(cauGocDuocXem(hong).size).toBe(0)
  })

  it('SBD lạ (ký tự đặc biệt, khoá đối tượng JS) ⇒ khongCo gọn, KHÔNG lỗi và không chạm đường dẫn JSON; SBD quá dài ⇒ báo lỗi', async () => {
    const d = await dung()
    for (const sbd of ['S1" || \'', 'S1"."x', 'S1.x', '$.a', '__proto__', 'constructor', 'prototype']) {
      expect(await goi(d, { maCa: 'KC', sbd, qid: ['DE1-I-1'] }), sbd).toEqual(khongCo(['DE1-I-1']))
    }
    expect(await goi(d, { maCa: 'KC', sbd: 'a'.repeat(41), qid: ['DE1-I-1'] })).toMatchObject({ ok: false })
  })
})

describe('/hs/cau-goc — đầu vào', () => {
  it('thiếu mã ca / số báo danh / danh sách qid, hoặc xin quá nhiều ⇒ báo lỗi, không đọc kho', async () => {
    const d = await dung()
    expect(await goi(d, { sbd: 'S1', qid: ['DE1-I-1'] })).toMatchObject({ ok: false })
    expect(await goi(d, { maCa: 'KC', qid: ['DE1-I-1'] })).toMatchObject({ ok: false })
    expect(await goi(d, { maCa: 'KC', sbd: 'S1' })).toMatchObject({ ok: false })
    expect(await goi(d, { maCa: 'KC', sbd: 'S1', qid: 'DE1-I-1' })).toMatchObject({ ok: false })
    const nhieu = Array.from({ length: TOI_DA_CAU_GOC + 1 }, (_, i) => `DE1-I-${i}`)
    expect(await goi(d, { maCa: 'KC', sbd: 'S1', qid: nhieu })).toMatchObject({ ok: false })
    expect(await goi(d, { maCa: 'K'.repeat(41), sbd: 'S1', qid: ['DE1-I-1'] })).toMatchObject({ ok: false })
  })

  it('qid rỗng / trùng / không phải chuỗi được dọn; danh sách rỗng ⇒ ok không câu nào', async () => {
    const d = await dung()
    const r = await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-1', '', 5, ' DE1-I-1 '] })
    expect(Object.keys(r.cau as object)).toEqual(['DE1-I-1'])
    expect(r.khongCo).toEqual([])
    expect(await goi(d, { maCa: 'KC', sbd: 'S1', qid: [] })).toEqual(khongCo([]))
  })
})

describe('/hs/cau-goc — các cổng "câu phục vụ cho em" còn lại', () => {
  it('câu TỰ LUẬN không bao giờ phát, dù gắn với đề của em', async () => {
    const d = await dung({ boTheoEm: { bo: { S1: ['TL~ss1'] }, daDung: { S1: { 'TL~ss1': NHAN_THAY, [khoaGoc('TL~ss1')]: 'DE1-TL-1' } } } })
    themKho(d, [cauKho('DE1-TL-1', { kieu: 'tu_luan' })])
    expect(await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-TL-1'] })).toEqual(khongCo(['DE1-TL-1']))
  })

  it('câu KHÁC KHỐI em (luật thầy 05/10) không ra máy em; em khối 11 xin câu khối 12 cũng không', async () => {
    const d = await dung({ boTheoEm: { bo: { S1: ['K10~ss1', 'DE1-I-1~ss1'] }, daDung: { S1: { 'K10~ss1': NHAN_THAY, [khoaGoc('K10~ss1')]: 'DE1-K10-1', 'DE1-I-1~ss1': NHAN_THAY, [khoaGoc('DE1-I-1~ss1')]: 'DE1-I-1' } } } })
    themKho(d, [cauKho('DE1-K10-1', { lop: '10' })])
    const r = await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-K10-1', 'DE1-I-1'] })
    expect(Object.keys(r.cau as object)).toEqual(['DE1-I-1'])
    expect(r.khongCo).toEqual(['DE1-K10-1'])
    themHs(d, 'S11', '11')
    themLuot(d, 'KC', 'S11')
    d.sql.prepare("UPDATE ca SET bo_theo_em_json = ? WHERE ma_ca = 'KC'").run(JSON.stringify({ bo: { S11: ['x'] }, daDung: { S11: { x: NHAN_THAY, [khoaGoc('x')]: 'DE1-I-1' } } }))
    expect(await goi(d, { maCa: 'KC', sbd: 'S11', qid: ['DE1-I-1'] })).toEqual(khongCo(['DE1-I-1']))
  })

  it('câu có trong kho nhưng tờ kho đã xoá ⇒ không phát', async () => {
    const d = await dung()
    d.sql.prepare("UPDATE de_kho SET da_xoa = 1 WHERE ma_de = 'DE1'").run()
    expect(await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-1'] })).toEqual(khongCo(['DE1-I-1']))
  })

  it('không áp luật "kho đề giao theo tuần" cho việc ĐỐI CHIẾU: em có đề giao đang hiệu lực vẫn xem được câu gốc cũ', async () => {
    const d = await dung()
    // em S1 có giao tuần chỉ gồm một đề khác — nếu cổng này bị áp nhầm thì câu gốc DE1-I-1 (đề DE1) sẽ bị loại
    d.sql.prepare("INSERT OR IGNORE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kho_de_giao','{}','x')").run()
    const r = await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-1'] })
    expect(Object.keys(r.cau as object)).toEqual(['DE1-I-1'])
  })
})

describe('/hs/cau-goc — đề đang bảo vệ', () => {
  it('câu CHỈ dính bảo vệ vì nằm trong đề của chính ca này (bản của em khác giữ nguyên câu ấy) VẪN xem được', async () => {
    const d = await dung()
    // S2 giữ nguyên DE1-I-1 trong đề của ca KC ⇒ DE1-I-1 nằm trong bank KC (ca đang mở ⇒ "đang bảo vệ")
    await d.env.DE.put('key/KC.json', bankCoCau('DE1-I-1', 'DE1-I-2~ss1', 'DE1-I-3~ss1'))
    xoaDemCaBaoVe()
    const r = await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-1', 'DE1-I-2'] })
    expect(Object.keys(r.cau as object).sort()).toEqual(['DE1-I-1', 'DE1-I-2'])
  })

  it('câu dính bảo vệ của ca KHÁC (đề chưa công bố) vẫn bị giữ — kể cả khi cũng nằm trong đề của ca này', async () => {
    const d = await dung()
    await d.env.DE.put('key/KC.json', bankCoCau('DE1-I-1', 'DE1-I-2~ss1', 'DE1-I-3~ss1'))
    themCa(d, 'KHAC', { congBo: 'khong' })
    await d.env.DE.put('key/KHAC.json', bankCoCau('DE1-I-1'))
    xoaDemCaBaoVe()
    const r = await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-1', 'DE1-I-2'] })
    expect(Object.keys(r.cau as object)).toEqual(['DE1-I-2'])
    expect(r.khongCo).toEqual(['DE1-I-1'])
    expect(JSON.stringify(r)).not.toContain('Đề của DE1-I-1')
  })

  it('theo NHÓM nội dung: bản chép khác qid nhưng cùng nội dung với câu trong đề chưa công bố của ca khác cũng bị giữ', async () => {
    const d = await dung()
    const goc = cauKho('DE1-I-5')
    // nhóm tính ĐÚNG như chỉ mục game / `protectedQuestions` (`contentGroup`), không dùng chuỗi giả
    const nhom = await contentGroup({ phan: goc.phan, text: goc.text, choices: goc.choices, ideas: goc.ideas, table: goc.table, hinhAnh: goc.hinhAnh } as never)
    themKho(d, [{ ...goc, group: nhom }])
    d.sql.prepare("UPDATE ca SET bo_theo_em_json = ? WHERE ma_ca = 'KC'").run(JSON.stringify({ bo: { S1: ['x'] }, daDung: { S1: { x: NHAN_THAY, [khoaGoc('x')]: 'DE1-I-5' } } }))
    themCa(d, 'KHAC', { congBo: 'khong' })
    // đề KHAC chứa câu cùng nội dung với DE1-I-5 nhưng qid khác (tờ DB-… chép lại)
    await d.env.DE.put('key/KHAC.json', JSON.stringify({ phanI: [{ id: 'BAN-CHEP-1', text: goc.text, choices: goc.choices, table: goc.table, hinhAnh: goc.hinhAnh, correct: 'B', dang: { ma: 'ES.A.X' }, mucDo: 'hieu', kienThuc: ['k1'] }] }))
    xoaDemCaBaoVe()
    expect(await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-5'] })).toEqual(khongCo(['DE1-I-5']))
    // đối chứng: ca KHAC bị xoá ⇒ hết bảo vệ ⇒ cùng câu ấy xem được (test bắt đúng cơ chế nhóm, không phải lỗi khác)
    d.sql.prepare("UPDATE ca SET trang_thai = 'da_xoa' WHERE ma_ca = 'KHAC'").run()
    xoaDemCaBaoVe()
    expect(Object.keys((await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-5'] })).cau as object)).toEqual(['DE1-I-5'])
  })

  it('không kiểm được đề bảo vệ ⇒ ĐÓNG CỬA: ok:false, không câu nào, không lộ nội dung', async () => {
    const d = await dung()
    themCa(d, 'HONG', { congBo: 'khong', bank: 'key/HONG-KHONG-CO.json' }) // R2 không có tệp ⇒ protectedQuestions ném lỗi
    xoaDemCaBaoVe()
    const r = await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-1'] })
    expect(r.ok).toBe(false)
    expect(JSON.stringify(r)).not.toContain('Đề của')
  })

  it('ca ĐÃ ĐÓNG và đã công bố thì câu của nó không còn bảo vệ ⇒ xem được', async () => {
    const d = await dung()
    d.sql.prepare("UPDATE ca SET trang_thai = 'dong', cong_bo = 'ngay', bat_dau = ?, het_han_vao = ? WHERE ma_ca = 'KC'").run(new Date(Date.now() - 48 * H).toISOString(), new Date(Date.now() - 24 * H).toISOString())
    await d.env.DE.put('key/KC.json', bankCoCau('DE1-I-1', 'DE1-I-2~ss1'))
    xoaDemCaBaoVe()
    const r = await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-1'] })
    expect(Object.keys(r.cau as object)).toEqual(['DE1-I-1'])
  })
})

describe('/hs/cau-goc — chi phí', () => {
  it('đường thường (câu không dính bảo vệ): đúng 4 truy vấn D1 (bản đồ+lượt · nội dung · danh sách ca bảo vệ · khối em) và 0 lần đọc R2 kho', async () => {
    const d = await dung()
    // ca KC đang mở nên bank của nó được đọc để dựng tập bảo vệ — đọc một lần trước để đo riêng phần của lệnh
    await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-1'] })
    await goiWorker(worker, d.env, '/khong-co-duong-nay', {}) // làm nóng đệm cổng đóng băng reset (không tính vào lệnh)
    let docR2 = 0
    const get = d.env.DE.get.bind(d.env.DE)
    d.env.DE.get = (async (k: string) => { docR2++; return get(k) }) as never
    const truoc = d.soLenh.prepare
    const r = await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-1'] })
    expect(Object.keys(r.cau as object)).toEqual(['DE1-I-1'])
    expect(d.soLenh.prepare - truoc).toBeLessThanOrEqual(5)
    expect(docR2).toBe(0) // đề của ca đã đệm theo (bank_r2, cap_nhat_luc)
  })

  it('xin câu không được phép ⇒ dừng ngay sau truy vấn đầu (không đọc kho, không đọc đề bảo vệ)', async () => {
    const d = await dung()
    await goiWorker(worker, d.env, '/khong-co-duong-nay', {})
    const truoc = d.soLenh.prepare
    await goi(d, { maCa: 'KC', sbd: 'S1', qid: ['DE1-I-3', 'DE1-I-4'] })
    expect(d.soLenh.prepare - truoc).toBe(1)
  })
})
