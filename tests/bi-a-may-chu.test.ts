// @vitest-environment node
// BI-A PHẢN ỨNG — máy chủ trên D1 thật (node:sqlite, lược đồ đủ migration). Đặc tả DAC-TA-BI-A-PHAN-UNG-2809.md, nghiệm thu 4–9.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { layKeHoachHomNay } from '../server/src/srs2-d1'
import { startDao2, startDoan2 } from '../server/src/srs2-game'
import { readFileSync } from 'node:fs'
import { biaAction, SQL_BANG_BIA, tinhTranBia, xepUngVienChot } from '../server/src/bi-a'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { dieuKienLoaiPhien } from '../server/src/game-v2-luot'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-09-30T07:59:00Z') // 14:59 Thứ Tư 30/09 giờ VN
const NGAY = 86_400_000

function cauJson(qid: string, phan: 'I' | 'II' | 'III', mucDo: string, dang: string, correct: string) {
  return JSON.stringify({
    qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo, sao: 1, kienThuc: ['k'], correct, reviewed: true,
    solution: { chot: `Cốt lõi của ${qid}`, tungPa: {} },
  })
}
const dapAn = (i: number) => (i % 4 === 0 ? 'DSDS' : i % 5 === 0 ? '4' : 'B')
const dapAnSai = (i: number) => (i % 4 === 0 ? 'SDSD' : i % 5 === 0 ? '9' : 'A')

function fixture(soCau = 30, coBia: string | null = '{"bat":true,"lop":["12A1"]}') {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x'),('S2','Trần Bảo','12A1','mk2','x')")
  d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Ester',30,0,'v1')")
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= soCau; i++) {
    const phan = i % 4 === 0 ? 'II' : i % 5 === 0 ? 'III' : 'I'
    st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, `D${i % 3}`, cauJson(`Q${i}`, phan, ['NB', 'TH', 'VD'][i % 3]!, `D${i % 3}`, dapAn(i)))
  }
  st.run('DE1', 'QTL', 'v1', 'g-QTL', 'D0', JSON.stringify({ ...JSON.parse(cauJson('QTL', 'III', 'VD', 'D0', '')), text: 'Trình bày cách điều chế ester (tự luận)', tuLuan: true }))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  if (coBia) d.sql.prepare(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bi_a',?,'x')`).run(coBia)
  return { d, env }
}
const suKien = (sbd: string, qid: string, msLuc: number, dung: boolean): SuKien => ({ nguon: 'game', maNguon: `phien-${msLuc}`, sbd, qid, lan: 1, ketQua: dung ? 1 : 0, luc: new Date(msLuc).toISOString() })
async function giao(env: Env, hanNop = '2026-10-04', nowMs = T0 - 3 * NGAY) {
  const r = await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop }, nowMs)
  expect(r.ok).toBe(true)
}
/** Có câu ôn (Đoàn) hôm nay: sai Phần I/III từ hôm trước. */
async function taoCauOn(env: Env, qids: string[]) {
  await ghiSuKien(env, qids.map((q) => suKien('S1', q, T0 - NGAY, false)))
}
/** Quét sâu: không có khoá đáp án/lời giải ở bất kỳ tầng nào. */
function khongLoDapAn(o: unknown) {
  const tim = (x: unknown): void => {
    if (!x || typeof x !== 'object') return
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
      expect(['correct', 'solution', 'answer'], `lộ khoá ${k}`).not.toContain(k)
      tim(v)
    }
  }
  tim(o)
}

describe('Bi-a — trần 40% (thuần)', () => {
  it('14 + 26 → 5 + 10 = 15; 1 + 1 → 0; 80 câu Huyết Chiến ≈ 32; đã dùng trừ đúng phần', () => {
    expect(tinhTranBia(14, 26, 0, 0)).toMatchObject({ tranDoan: 5, tranDao: 10, tong: 15, con: 15 })
    expect(tinhTranBia(1, 1, 0, 0).tong).toBe(0)
    expect(tinhTranBia(30, 50, 0, 0).tong).toBe(32)
    expect(tinhTranBia(14, 26, 5, 3)).toMatchObject({ conDoan: 0, conDao: 7, con: 7 })
    expect(tinhTranBia(14, 26, 9, 0).conDoan).toBe(0) // không âm
  })
  it('Câu chốt: Vận dụng trước, trong đó câu ôn đang sai (cc = 0) trước', () => {
    const meta = new Map([['A', { mucDo: 'NB' }], ['B', { mucDo: 'VD' }], ['C', { mucDo: 'VD' }], ['D', { mucDo: 'TH' }]]) as never
    const tt = new Map([['B', { laMoi: true, cc: 0 }], ['C', { laMoi: false, cc: 0 }]]) as never
    expect(xepUngVienChot(['A', 'B', 'C', 'D'], { meta, tt })[0]).toBe('C')
    expect(xepUngVienChot(['A', 'D'], { meta, tt })[0]).toBe('D') // không có Vận dụng ⇒ khó nhất còn lại
  })
})

describe('Bi-a — máy chủ trên D1 thật', () => {
  it('cờ tắt ⇒ bat:false, không lộ gì; cờ bật lớp khác ⇒ đóng', async () => {
    const { env } = fixture(30, null)
    await giao(env)
    expect(await biaAction(env, 'S1', 'bia-sanh', {}, T0)).toMatchObject({ ok: true, bat: false, lyDoKhoa: 'chua_bat' })
    const f2 = fixture(30, '{"bat":true,"lop":["11B2"]}')
    expect(await biaAction(f2.env, 'S1', 'bia-sanh', {}, T0)).toMatchObject({ bat: false })
  })

  it('Sảnh: trần = floor(40% Đoàn) + floor(40% Đảo) của kế hoạch chốt; hoa2-sanh có phần bia', async () => {
    const { env } = fixture()
    await giao(env)
    await taoCauOn(env, ['Q1', 'Q2', 'Q3', 'Q5', 'Q6'])
    const nay = Date.now() // hoa2-sanh đọc giờ thật ⇒ cùng một ngày cho cả hai phía
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    const s = await biaAction(env, 'S1', 'bia-sanh', {}, nay)
    const tran = s.tran as { tong: number; tranDoan: number; tranDao: number; con: number }
    expect(tran.tranDoan).toBe(Math.floor(0.4 * kh.doan.length))
    expect(tran.tranDao).toBe(Math.floor(0.4 * kh.dao.length))
    expect(tran.tong).toBe(tran.tranDoan + tran.tranDao)
    expect(s.theLuc).toEqual({ con: kh.conDao.length + kh.conDoan.length, tong: kh.tong })
    const token = await gameToken(env, 'S1')
    await gameV2(env, 'choose', { token, pet: 'dat_quy' })
    const h = await gameV2(env, 'hoa2-sanh', { token })
    expect(h.bia).toMatchObject({ bat: true, tong: tran.tong })
  })

  it('xếp bàn: câu đều thuộc kế hoạch hôm nay, câu ôn Đoàn trước, có Câu chốt vai trùm, không tự luận, không lộ đáp án', async () => {
    const { env } = fixture()
    await giao(env)
    await taoCauOn(env, ['Q1', 'Q2', 'Q3', 'Q5', 'Q6', 'Q7', 'Q9', 'Q10', 'Q11', 'Q13'])
    const { kh } = await layKeHoachHomNay(env, 'S1', T0)
    const r = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, T0)
    expect(r.ok).toBe(true)
    khongLoDapAn(r)
    const bi = r.bi as { qid: string; vai: string }[], chot = r.chot as { qid: string; vai: string }
    const keHoach = new Set([...kh.doan, ...kh.dao])
    for (const q of [...bi, chot]) expect(keHoach.has(q.qid)).toBe(true)
    expect(chot.vai).toBe('trum')
    expect(JSON.stringify(r)).not.toContain('QTL')
    const tran = tinhTranBia(kh.doan.length, kh.dao.length, 0, 0)
    expect(bi.length + 1).toBeLessThanOrEqual(tran.tong)
    // Câu ôn phần Đoàn đi trước câu phần Đảo
    const doan = new Set(kh.doan)
    const viTriDao = bi.findIndex((q) => !doan.has(q.qid))
    if (viTriDao >= 0) expect(bi.slice(viTriDao).every((q) => !doan.has(q.qid))).toBe(true)
    expect(bi.filter((q) => doan.has(q.qid)).length).toBeLessThanOrEqual(tran.tranDoan)
  })

  it('trả lời qua answer chung: ghi su_kien_hoc nguon game, Thể lực giảm; Câu chốt đúng không Bùa có EXP câu trùm; phiên không lẫn Đảo', async () => {
    const { d, env } = fixture()
    await giao(env)
    const token = await gameToken(env, 'S1')
    const r = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, Date.now())
    const session = String(r.session)
    const truoc = (await biaAction(env, 'S1', 'bia-sanh', {}, Date.now())).theLuc as { con: number }
    const b1 = (r.bi as { qid: string }[])[0]!
    const i1 = Number(b1.qid.slice(1))
    const a = await gameV2(env, 'answer', { token, session, qid: b1.qid, answer: dapAn(i1) })
    expect(a.correct).toBe(true)
    expect(d.dem('su_kien_hoc', `sbd='S1' AND nguon='game' AND qid='${b1.qid}'`)).toBe(1)
    const sau = (await biaAction(env, 'S1', 'bia-sanh', {}, Date.now())).theLuc as { con: number }
    expect(sau.con).toBe(truoc.con - 1)
    const chot = r.chot as { qid: string; goiY?: unknown }
    const ic = Number(chot.qid.slice(1))
    const ac = await gameV2(env, 'answer', { token, session, qid: chot.qid, answer: dapAn(ic) })
    expect(ac.correct).toBe(true)
    // Câu chốt mang vai `trum` trong phiên ⇒ `answer` chấm như câu trùm (EXP câu trùm khi sổ EXP bật, không Bùa, chưa quá câu 40).
    const phien = JSON.parse((d.sql.prepare('SELECT json FROM game_v2_session WHERE id=?').get(session) as { json: string }).json) as { mode: string; bia: number; hoa2: number; questions: { qid: string; role: string }[] }
    expect(phien).toMatchObject({ mode: 'bia', bia: 1, hoa2: 1 })
    expect(phien.questions.find((q) => q.qid === chot.qid)?.role).toBe('trum')
    // lượt Bi-a không tính là Đảo (trần 36) — dieuKienLoaiPhien
    const nDao = Number((d.sql.prepare(`SELECT COUNT(*) n FROM game_v2_attempt a WHERE a.sbd='S1' AND ${dieuKienLoaiPhien('dao')}`).get() as { n: number }).n)
    expect(nDao).toBe(0)
    // resume của Đảo không lấy phiên Bi-a
    expect((await gameV2(env, 'resume', { token })).questions).toEqual([])
  })

  it('đổi câu khi sai: phải trả lời trước; câu thay cùng dạng khi có, nằm trong phiên (answer nhận), vẫn trong trần', async () => {
    const { env } = fixture()
    await giao(env)
    const token = await gameToken(env, 'S1')
    const r = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'doi', soBi: 4 }, Date.now())
    expect((r.bi as unknown[]).length).toBeLessThanOrEqual(4)
    const session = String(r.session)
    const b1 = (r.bi as { qid: string; tenDang: string }[])[0]!
    await expect(biaAction(env, 'S1', 'bia-doi-cau', { session, qidCu: b1.qid }, Date.now())).rejects.toThrow('trả lời câu này trước')
    const sai = await gameV2(env, 'answer', { token, session, qid: b1.qid, answer: dapAnSai(Number(b1.qid.slice(1))) })
    expect(sai.correct).toBe(false)
    const doi = await biaAction(env, 'S1', 'bia-doi-cau', { session, qidCu: b1.qid }, Date.now())
    khongLoDapAn(doi)
    if (!doi.trong) {
      const moi = doi.cau as { qid: string; tenDang: string }
      expect(moi.qid).not.toBe(b1.qid)
      const i = Number(moi.qid.slice(1))
      const a = await gameV2(env, 'answer', { token, session, qid: moi.qid, answer: dapAn(i) })
      expect(a.correct).toBe(true)
    }
  })

  it('kết thúc ván: ghi bi_a_van + bi_a_ghe (ghế A.I sbd NULL), đóng phiên; câu chưa trả lời về lại cho Đảo/Đoàn', async () => {
    const { d, env } = fixture()
    await giao(env)
    const r = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'doi', soBi: 4 }, Date.now())
    const giu = [...(r.bi as { qid: string }[]), r.chot as { qid: string }].map((q) => q.qid)
    // Đang giữ trên bàn ⇒ Đảo không phát
    const dao = await startDao2(env, 'S1', Date.now())
    for (const q of (dao.questions as { qid: string }[]) ?? []) expect(giu).not.toContain(q.qid)
    const k = await biaAction(env, 'S1', 'bia-ket-van', { van: r.van, ketQua: { doiThang: 1, diem: [40, 120], lyDo: 'thua' },
      ghe: [{ ghe: 1, doi: 0, ai: false, an: 2, vang: 1 }, { ghe: 2, doi: 1, ai: true, dung: 3, sai: 1, an: 4, vang: 2 }, { ghe: 3, doi: 0, ai: true, dung: 1, sai: 0, an: 1, vang: 0 }, { ghe: 4, doi: 1, ai: true, dung: 2, sai: 2, an: 3, vang: 1 }] }, Date.now())
    expect(k.ok).toBe(true)
    expect(d.dem('bi_a_van', `id='${r.van}' AND trang_thai='xong' AND doi_thang=1 AND che_do='doi'`)).toBe(1)
    expect(d.dem('bi_a_ghe', `van='${r.van}'`)).toBe(4)
    expect(d.dem('bi_a_ghe', `van='${r.van}' AND sbd IS NULL`)).toBe(3)
    expect(d.dem('game_v2_session', `id='${r.session}' AND json_extract(json,'$.dong')=1`)).toBe(1)
    // gọi lại không ghi đè
    expect(await biaAction(env, 'S1', 'bia-ket-van', { van: r.van, ketQua: { lyDo: 'bo' } }, Date.now())).toMatchObject({ daGhiTruoc: true })
  })

  it('CI không chạy migration: CSDL chưa có bảng bi_a_* ⇒ lệnh bia-* tự dựng bảng (chỉ thêm), xếp bàn + kết ván chạy được; bảng khớp migration', async () => {
    const { d, env } = fixture()
    for (const t of ['bi_a_ghe', 'bi_a_van', 'bi_a_diem_ban', 'bi_a_moi', 'bi_a_co_mat']) d.sql.exec(`DROP TABLE ${t}`)
    expect(d.dem('sqlite_master', "type='table' AND name LIKE 'bi_a_%'")).toBe(0)
    await giao(env)
    const r = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, Date.now())
    expect(typeof r.van).toBe('string')
    expect(d.dem('sqlite_master', "type='table' AND name LIKE 'bi_a_%'")).toBe(5)
    expect(d.dem('sqlite_master', "type='index' AND name LIKE 'bi_a_%'")).toBe(4)
    const k = await biaAction(env, 'S1', 'bia-ket-van', { van: r.van, ketQua: { doiThang: 0, diem: [90, 20], lyDo: 'thang' }, ghe: [{ ghe: 1, doi: 0, ai: false, an: 3, vang: 0 }, { ghe: 2, doi: 1, ai: true, dung: 2, sai: 1, an: 1, vang: 0 }] }, Date.now())
    expect(k.ok).toBe(true)
    expect(d.dem('bi_a_ghe', `van='${r.van}'`)).toBe(2)
    // danh sách dựng tại chỗ = đúng các bảng/chỉ mục của migration
    const mig = readFileSync('server/migration-2809-bi-a.sql', 'utf8')
    const ten = (s: string) => /(?:TABLE|INDEX) IF NOT EXISTS (\w+)/.exec(s)![1]
    expect(SQL_BANG_BIA.map(ten).sort()).toEqual([...mig.matchAll(/(?:TABLE|INDEX) IF NOT EXISTS (\w+)/g)].map((m) => m[1]).sort())
  })

  it('vào ván mới là bỏ ván cũ (G8): ván cũ thành "bo", câu cũ nhả ra', async () => {
    const { d, env } = fixture()
    await giao(env)
    const a = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, Date.now())
    const b = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, Date.now())
    expect(d.dem('bi_a_van', `id='${a.van}' AND trang_thai='bo'`)).toBe(1)
    expect(d.dem('bi_a_van', `id='${b.van}' AND trang_thai='mo'`)).toBe(1)
    expect((b.bi as unknown[]).length).toBe((a.bi as unknown[]).length)
  })

  it('Đoàn không phát câu đang nằm trên bàn Bi-a', async () => {
    const { env } = fixture()
    await giao(env)
    await taoCauOn(env, ['Q1', 'Q2', 'Q3', 'Q5', 'Q6', 'Q7', 'Q9', 'Q10', 'Q11', 'Q13'])
    const r = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, Date.now())
    const giu = new Set([...(r.bi as { qid: string }[]), r.chot as { qid: string }].map((q) => q.qid))
    const doan = await startDoan2(env, 'S1', Date.now())
    for (const q of (doan.questions as { qid: string }[]) ?? []) expect(giu.has(q.qid)).toBe(false)
  })

  it('Bàn giao hữu: chỉ mở khi xong kế hoạch; tối đa 2 ván/ngày (tính cả ván bỏ); không câu, không su_kien_hoc', async () => {
    const { d, env } = fixture(6)
    await giao(env)
    expect(await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'giao_huu', cheDo: 'don' }, T0)).toMatchObject({ lyDo: 'giao_huu_chua_mo' })
    const { kh } = await layKeHoachHomNay(env, 'S1', T0)
    await ghiSuKien(env, [...kh.dao, ...kh.doan].map((k) => suKien('S1', k.replace(/#\d+$/, ''), T0 - 60_000, true)))
    const s = await biaAction(env, 'S1', 'bia-sanh', {}, T0)
    expect(s).toMatchObject({ lyDoKhoa: 'xong_ke_hoach', giaoHuu: { mo: true, con: 2 } })
    const truoc = d.dem('su_kien_hoc')
    const g1 = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'giao_huu', cheDo: 'don' }, T0)
    expect(g1).toMatchObject({ ok: true, bi: [], chot: null, giaoHuu: { con: 1 } })
    await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'giao_huu', cheDo: 'doi' }, T0) // ván 1 bị bỏ vẫn tính
    expect(await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'giao_huu', cheDo: 'don' }, T0)).toMatchObject({ lyDo: 'het_luot_giao_huu' })
    expect(d.dem('su_kien_hoc')).toBe(truoc)
    expect(await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don' }, T0)).toMatchObject({ lyDo: 'xong_ke_hoach' })
  })

  it('ca kiểm tra của lớp đang mở ⇒ mọi bia-* trả dang_co_ca', async () => {
    const { d, env } = fixture()
    await giao(env)
    d.sql.prepare("INSERT INTO ca(ma_ca,lop,trang_thai,loai,bat_dau,het_han_vao,thoi_gian_phut,cap_nhat_luc) VALUES('CA1','12A1','mo','thi',?,?,45,'x')")
      .run(new Date(T0 - 3_600_000).toISOString(), new Date(T0 + 3_600_000).toISOString())
    expect(await biaAction(env, 'S1', 'bia-sanh', {}, T0)).toMatchObject({ bat: true, lyDoKhoa: 'dang_co_ca' })
    expect(await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai' }, T0)).toMatchObject({ lyDoKhoa: 'dang_co_ca' })
  })

  it('công tắc thầy: bia-co-luu / bia-co-doc dùng khoá riêng bi_a, không đụng game_hoa_2', async () => {
    const { d, env } = fixture(30, null)
    const luu = await gvChienDich(env, { action: 'bia-co-luu', bat: true, lop: ['12A1'] }, T0)
    expect(luu).toMatchObject({ ok: true, co: { bat: true, lop: ['12A1'], sbd: [] } })
    expect(await gvChienDich(env, { action: 'bia-co-doc' }, T0)).toMatchObject({ co: { bat: true, lop: ['12A1'] } })
    expect((d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='game_hoa_2'").get() as { gia_tri: string }).gia_tri).toContain('"bat":true')
  })
})
