// @vitest-environment node
// BI-A PHẢN ỨNG GĐ2 · LỆNH SẢNH ONLINE (server/src/bi-a.ts) trên D1 thật: tạo bàn + mã 4 chữ số, nhập mã, có mặt ở Sảnh Bi-a (20 giây),
// mời bạn cùng lớp (hết hạn 60 giây), nhận/từ chối, xếp câu cho đúng các bi của ghế (G11) + vé trận cho phòng đấu, vé câu thay, Bàn giao hữu với bạn.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { biaAction } from '../server/src/bi-a'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { docVe, kyVe } from '../server/src/bi-a-ve'
import type { Env } from '../server/src/kieu'
import { biCuaGhe, chiaBi } from '../src/game/bi-a/luat'

const T0 = Date.parse('2026-09-30T07:59:00Z')
const NGAY = 86_400_000
function cauJson(qid: string, phan: 'I' | 'II' | 'III', mucDo: string, dang: string, correct: string) {
  return JSON.stringify({ qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [], hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo, sao: 1, kienThuc: ['k'], correct, reviewed: true, solution: { chot: 'x' } })
}
async function fixture(o: { online?: boolean } = {}) {
  const d = taoD1That()
  const env = d.env as Env
  if (o.online !== false) (env as { BAN_BIA?: unknown }).BAN_BIA = { idFromName: () => ({}), get: () => ({ fetch: async () => new Response(null) }) }
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn Khánh Linh','12A1','mk1','x'),('S2','Trần Minh Châu','12A1','mk2','x'),('S3','Lê Chi','12A2','mk3','x')")
  d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Ester',60,0,'v1')")
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 60; i++) { const phan = i % 4 === 0 ? 'II' : i % 5 === 0 ? 'III' : 'I'; st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, `D${i % 3}`, cauJson(`Q${i}`, phan, ['NB', 'TH', 'VD'][i % 3]!, `D${i % 3}`, 'B')) }
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x'),('bi_a','{"bat":true}','x')`)
  const r = await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: '2026-10-04' }, T0 - 3 * NGAY)
  expect(r.ok).toBe(true)
  return { d, env }
}
const goi = (env: Env, sbd: string, lenh: string, b: Record<string, unknown> = {}, now = T0) => biaAction(env, sbd, lenh, b, now)

describe('Sảnh online — tạo bàn, mã bàn', () => {
  it('bia-sanh báo online khi Worker có phòng đấu; Điểm bàn khởi đầu 1000', async () => {
    const a = await fixture({ online: false })
    expect(await goi(a.env, 'S1', 'bia-sanh')).toMatchObject({ online: false })
    await expect(goi(a.env, 'S1', 'bia-tao-ban', { cheDo: 'don' })).rejects.toThrow(/chưa mở/)
    const b = await fixture()
    expect(await goi(b.env, 'S1', 'bia-sanh')).toMatchObject({ online: true, diemBan: { diem: 1000, soVan: 0 } })
  })
  it('tạo bàn đấu đơn ⇒ mã 4 chữ số + vé chủ bàn; bạn nhập mã ⇒ vé vào bàn; mã sai ⇒ báo rõ', async () => {
    const { d, env } = await fixture()
    const t = await goi(env, 'S1', 'bia-tao-ban', { cheDo: 'don', loai: 'ban' })
    expect(t.ma).toMatch(/^\d{4}$/)
    const ve = await docVe(env, t.ve, 'sanh', T0)
    expect(ve).toMatchObject({ van: t.van, sbd: 'S1', ten: 'Nguyễn Khánh Linh', cheDo: 'don', loai: 'ban', chu: true, ma: t.ma })
    expect(d.dem('bi_a_van', `id='${t.van}' AND trang_thai='cho' AND chu_ban='S1'`)).toBe(1)
    const v = await goi(env, 'S2', 'bia-vao-ban', { ma: t.ma })
    expect(await docVe(env, v.ve, 'sanh', T0)).toMatchObject({ van: t.van, sbd: 'S2', chu: false })
    await expect(goi(env, 'S2', 'bia-vao-ban', { ma: '12' })).rejects.toThrow(/4 chữ số/)
    await expect(goi(env, 'S2', 'bia-vao-ban', { ma: t.ma === '9999' ? '1000' : String(Number(t.ma) + 1) })).rejects.toThrow(/Không thấy bàn/)
    // tạo bàn mới ⇒ bàn cũ đang chờ đóng (G8: mỗi em một ván mở)
    await goi(env, 'S1', 'bia-tao-ban', { cheDo: 'doi' })
    expect(d.dem('bi_a_van', `id='${t.van}' AND trang_thai='bo'`)).toBe(1)
  })
})

describe('Sảnh online — có mặt, mời bạn', () => {
  it('bạn cùng lớp ở Sảnh trong 20 giây thì hiện (kèm số câu Bi-a còn); khác lớp / quá 20 giây thì không', async () => {
    const { env } = await fixture()
    await goi(env, 'S2', 'bia-loi-moi', { con: 5 }, T0)
    await goi(env, 'S3', 'bia-loi-moi', { con: 9 }, T0)
    const a = await goi(env, 'S1', 'bia-loi-moi', { con: 12 }, T0 + 5_000)
    expect(a.ban).toEqual([{ sbd: 'S2', ten: 'Trần Minh Châu', conTran: 5 }])
    const b = await goi(env, 'S1', 'bia-loi-moi', { con: 12 }, T0 + 21_000)
    expect(b.ban).toEqual([])
  })
  it('mời ⇒ bạn thấy lời mời (tên người mời, còn giây) ⇒ Nhận ⇒ vé vào bàn; người mời thấy "đã nhận"; quá 60 giây ⇒ hết hạn; Từ chối', async () => {
    const { env } = await fixture()
    const t = await goi(env, 'S1', 'bia-tao-ban', { cheDo: 'don' })
    await expect(goi(env, 'S1', 'bia-moi', { van: t.van, den: 'S2' })).rejects.toThrow(/không còn ở Sảnh/)
    await goi(env, 'S2', 'bia-loi-moi', { con: 5 })
    const m = await goi(env, 'S1', 'bia-moi', { van: t.van, den: 'S2' }, T0 + 1000)
    expect(await goi(env, 'S1', 'bia-moi', { van: t.van, den: 'S2' }, T0 + 2000)).toEqual({ ok: true, id: m.id }) // không mời trùng
    await expect(goi(env, 'S2', 'bia-moi', { van: t.van, den: 'S1' })).rejects.toThrow(/không còn chờ/) // không phải chủ bàn
    const s2 = await goi(env, 'S2', 'bia-loi-moi', { con: 5 }, T0 + 6000)
    expect(s2.moi).toEqual([{ id: m.id, tu: 'Nguyễn Khánh Linh', cheDo: 'don', loai: 'ban', conGiay: 55 }])
    const n = await goi(env, 'S2', 'bia-tra-loi-moi', { id: m.id, nhan: true }, T0 + 7000)
    expect(await docVe(env, n.ve, 'sanh', T0)).toMatchObject({ van: t.van, sbd: 'S2', chu: false })
    expect((await goi(env, 'S1', 'bia-loi-moi', {}, T0 + 8000)).phanHoi).toEqual([{ id: m.id, ten: 'Trần Minh Châu', nhan: true }])
    // lời mời mới, để quá 60 giây
    const t2 = await goi(env, 'S1', 'bia-tao-ban', { cheDo: 'don' }, T0 + 9000)
    await goi(env, 'S2', 'bia-loi-moi', {}, T0 + 9000)
    const m2 = await goi(env, 'S1', 'bia-moi', { van: t2.van, den: 'S2' }, T0 + 9000)
    await expect(goi(env, 'S2', 'bia-tra-loi-moi', { id: m2.id, nhan: true }, T0 + 71_000)).rejects.toThrow(/hết hạn/)
    const t3 = await goi(env, 'S1', 'bia-tao-ban', { cheDo: 'don' }, T0 + 80_000)
    await goi(env, 'S2', 'bia-loi-moi', {}, T0 + 80_000)
    const m3 = await goi(env, 'S1', 'bia-moi', { van: t3.van, den: 'S2' }, T0 + 80_000)
    expect(await goi(env, 'S2', 'bia-tra-loi-moi', { id: m3.id, nhan: false }, T0 + 81_000)).toEqual({ ok: true, tuChoi: true })
    expect((await goi(env, 'S1', 'bia-loi-moi', {}, T0 + 82_000)).phanHoi).toContainEqual({ id: m3.id, ten: 'Trần Minh Châu', nhan: false })
  })
})

describe('Sảnh online — xếp câu cho ghế (sau khi phòng đấu Bắt đầu)', () => {
  it('đấu đơn ghế 1: 7 câu theo đúng 7 bi Kim loại + Câu chốt; vé trận khớp; phiên gắn mã bàn, không bị đóng; không lộ đáp án', async () => {
    const { d, env } = await fixture()
    const t = await goi(env, 'S1', 'bia-tao-ban', { cheDo: 'don' })
    const veGhe = await kyVe(env, { k: 'ghe', van: t.van, ghe: 0, sbd: 'S1', cheDo: 'don', loai: 'ban', het: T0 + 600_000 })
    const r = await goi(env, 'S1', 'bia-xep-ban', { veGhe })
    const kis = biCuaGhe(chiaBi('don'), 0)
    expect((r.bi as { ki: string }[]).map((x) => x.ki)).toEqual(kis)
    expect(JSON.stringify(r)).not.toMatch(/"correct"|"solution"|"answer"/)
    const vt = await docVe(env, r.veTran, 'tran', T0)
    expect(vt).toMatchObject({ van: t.van, ghe: 0, sbd: 'S1', session: r.session })
    for (const x of r.bi as { ki: string; cau: { qid: string } | null }[]) if (x.cau) expect(vt.bi[x.ki]!.qid).toBe(x.cau.qid)
    expect(vt.chot?.qid).toBe((r.chot as { qid: string }).qid)
    expect(Object.values(vt.bi).every((c) => c.giay === 90 || c.giay === 180)).toBe(true)
    expect(d.dem('game_v2_session', `id='${r.session}' AND json_extract(json,'$.van')='${t.van}' AND json_extract(json,'$.online')=1 AND COALESCE(json_extract(json,'$.dong'),0)=0`)).toBe(1)
    expect(d.dem('bi_a_van', `id='${t.van}' AND trang_thai='cho'`)).toBe(1) // xếp câu không đóng chính bàn này
    await expect(goi(env, 'S2', 'bia-xep-ban', { veGhe })).rejects.toThrow(/không phải của em/)
  })
  it('đánh đôi: ghế 3 (người 2 của Phe Kim loại) nhận đúng 3 bi (G11); đổi câu ở ván online có vé câu cho phòng', async () => {
    const { env } = await fixture()
    const t = await goi(env, 'S1', 'bia-tao-ban', { cheDo: 'doi' })
    const veGhe = await kyVe(env, { k: 'ghe', van: t.van, ghe: 2, sbd: 'S2', cheDo: 'doi', loai: 'ban', het: T0 + 600_000 })
    const r = await goi(env, 'S2', 'bia-xep-ban', { veGhe }, Date.now())
    expect((r.bi as { ki: string }[]).map((x) => x.ki)).toEqual(['Mg', 'Fe', 'Ag'])
    const q = (r.bi as { ki: string; cau: { qid: string; phan: string } }[])[0]!
    const token = await gameToken(env, 'S2')
    await gameV2(env, 'choose', { token, pet: 'dat_quy' })
    const tl = await gameV2(env, 'answer', { token, session: r.session, qid: q.cau.qid, answer: q.cau.phan === 'II' ? 'SDSD' : q.cau.phan === 'III' ? '9' : 'A' })
    expect(tl.ok).toBe(true)
    const dc = await goi(env, 'S2', 'bia-doi-cau', { session: r.session, qidCu: q.cau.qid, chot: false, ki: 'Mg' }, Date.now())
    const ve = await docVe(env, dc.ve, 'cau', Date.now())
    expect(ve).toMatchObject({ van: t.van, sbd: 'S2', ki: 'Mg' })
    if (dc.trong) expect(ve.cau).toBeNull(); else expect(ve.cau!.qid).toBe((dc.cau as { qid: string }).qid)
  })
  it('Bàn giao hữu với bạn: chưa xong kế hoạch ⇒ không tạo được', async () => {
    const { env } = await fixture()
    await expect(goi(env, 'S1', 'bia-tao-ban', { cheDo: 'don', loai: 'giao_huu' })).rejects.toThrow(/xong kế hoạch/)
  })
})
