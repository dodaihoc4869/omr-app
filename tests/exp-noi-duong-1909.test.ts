// @vitest-environment node
// EXP HỌC TẬP MỚI nối vào các LỆNH NỘP của em (BTVN cả bài, xong lô, khắc phục, bài Mẹ giao, luyện đề): cờ bật → phản hồi có `expNhan`/`manhNhan`;
// cờ tắt → phản hồi KHÔNG có hai trường đó (y hệt cũ). Chạy trên SQLite thật.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import worker from '../server/src/index'
import { nopKhacPhuc } from '../server/src/goi-cu'
import { mom } from '../server/src/mom'
import { luyenDe } from '../server/src/luyen-de'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

// Bảng giá được kiểm ở ngày 20/09; từ 22/09 có khoản câu đầu ngày mới.
beforeEach(() => { vi.useFakeTimers({toFake:['Date']}); vi.setSystemTime(new Date('2026-09-20T03:00:00Z')) })
afterEach(() => vi.useRealTimers())
const TU = '2026-09-01T00:00:00.000Z'
const HAN_XA = '2099-01-01T00:00:00.000Z'
const TO_KHO = {
  cau: [
    { phan: 'I', so: 1, dap_an: 'A', chuyen_de: 'ES', muc_do: '1 sao' },
    { phan: 'I', so: 2, dap_an: 'B', chuyen_de: 'ES', muc_do: '2 sao' },
    { phan: 'II', so: 1, dap_an: 'DSDS', chuyen_de: 'AM', muc_do: '' },
    { phan: 'III', so: 1, dap_an: '0.39', chuyen_de: 'AM', muc_do: '' },
  ],
}
const dung = (batCo: boolean) => {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','mk','x')").run()
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,0,?,?)').run('S1', JSON.stringify({ pet: 'dat_quy', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2026-08-01T00:00:00.000Z' }), 'x')
  if (batCo) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: TU, dsSbd: ['S1'] }))
  return d
}
const seedBtvn = (d: D1That) => {
  d.objects.set('kho/DE1.json', TO_KHO)
  d.sql.prepare('INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,?,0,?)').run('B1', 'CA1', 'DE1', 4, TU, HAN_XA, TU)
  d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES(?,?,?,?)').run('B1|S1', 'B1', 'S1', 'Em Một')
}
const loai = (r: Record<string, any>) => (r.expNhan as { loai: string }[]).map((x) => x.loai).sort()
const hoSo = (d: D1That) => JSON.parse((d.sql.prepare("SELECT json FROM game_v2_profile WHERE sbd='S1'").get() as { json: string }).json) as Record<string, any>

describe('BTVN', () => {
  it('xong lô có đáp án: cờ BẬT → expNhan có câu đúng + xong lô đúng nhịp +10; cờ TẮT → không có trường EXP', async () => {
    const b = dung(true)
    seedBtvn(b)
    const r = await goiWorker(worker, b.env, '/btvn/xong-lo', { maBtvn: 'B1', sbd: 'S1', chiSo: 0, dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'C' } })
    expect(r).toMatchObject({ ok: true, loDaXong: 1, suKien: 2 })
    // Xong lô trả nhanh; goiWorker đợi ctx.waitUntil, EXP được kiểm ở sổ sau hậu xử lý.
    expect(r.expNhan).toBeUndefined()
    expect(b.sql.prepare('SELECT loai,exp FROM exp_so ORDER BY loai').all()).toEqual([{loai:'cau',exp:2},{loai:'lo',exp:10}])
    expect(hoSo(b).earned).toBe(12)
    // Báo lại lô: không cộng thêm.
    const lai = await goiWorker(worker, b.env, '/btvn/xong-lo', { maBtvn: 'B1', sbd: 'S1', chiSo: 0, dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'C' } })
    expect(lai.expNhan).toBeUndefined()
    expect(hoSo(b).earned).toBe(12)

    const t = dung(false)
    seedBtvn(t)
    const rt = await goiWorker(worker, t.env, '/btvn/xong-lo', { maBtvn: 'B1', sbd: 'S1', chiSo: 0, dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'C' } })
    expect(rt).toMatchObject({ ok: true, loDaXong: 1 })
    expect('expNhan' in rt || 'manhNhan' in rt).toBe(false)
    expect(t.dem('exp_so')).toBe(0)
  })
  it('xong lô KHÔNG có đáp án (máy cũ): không ghi sổ nên không có EXP; phản hồi y hệt cũ', async () => {
    const d = dung(true)
    seedBtvn(d)
    const r = await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: 'B1', sbd: 'S1', chiSo: 0 })
    expect(r).toMatchObject({ ok: true, loDaXong: 1 })
    expect('expNhan' in r).toBe(false)
  })
  it('nộp cả bài đúng hạn: expNhan có nộp bài +15 và câu đúng; nộp lại không cộng đôi', async () => {
    const d = dung(true)
    seedBtvn(d)
    const dapAn = { 'DE1-I-1': 'A', 'DE1-I-2': 'C', 'DE1-II-1': 'DSDS', 'DE1-III-1': '0.39' }
    const r = await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: 'B1', sbd: 'S1', dapAn })
    expect(r.ok).toBe(true)
    expect(loai(r)).toEqual(['btvn', 'cau', 'cau', 'cau'])
    expect(r.expNhan.reduce((t: number, x: any) => t + x.exp, 0)).toBe(15 + 2 + 3 + 4)
    const lai = await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: 'B1', sbd: 'S1', dapAn })
    expect(lai.daNhan).toBe(true) // đường gửi lại y hệt: trả kết quả cũ, không tính gì thêm
    expect(d.dem('exp_so')).toBe(4)
    expect(hoSo(d).earned).toBe(24)
  })
})

describe('khắc phục, bài Mẹ giao, luyện đề', () => {
  it('nopKhacPhuc: câu đúng có EXP; cờ tắt thì không đính gì', async () => {
    for (const co of [true, false]) {
      const d = dung(co)
      d.objects.set('phieu/PH1.json', { maCa: 'CA1', phieu: { cau: [{ id: 'DE1-I-1', dapAn: 'A', chuyenDe: 'ES', mucDo: '1 sao' }, { id: 'DE1-I-2', dapAn: 'B' }] } })
      const r = await nopKhacPhuc(d.env, { ma: 'PH1', sbd: 'S1', dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'C' } })
      expect(r.ok).toBe(true)
      if (co) expect(loai(r)).toEqual(['cau'])
      else expect('expNhan' in r).toBe(false)
    }
  })
  it('bài Mẹ giao (submit): xong bài +10 và câu đúng; nộp trống không thưởng', async () => {
    const d = dung(true)
    const token = await gameToken(d.env, 'S1')
    const dsCau = [{ id: 'DE1-I-1', dapAn: 'A', chuyenDe: 'ES' }, { id: 'DE1-I-2', dapAn: 'B', chuyenDe: 'ES' }]
    await mom(d.env, 'create', { sbd: 'S1', id: 'M1', dsCau }, {noiBo:true})
    await mom(d.env, 'start', { token, id: 'M1' })
    const r = await mom(d.env, 'submit', { token, id: 'M1', answers: { 'DE1-I-1': 'A', 'DE1-I-2': 'C' } })
    expect((r.item as { soCauDung: number }).soCauDung).toBe(1)
    expect(loai(r)).toEqual(['cau', 'mom'])
    await mom(d.env, 'create', { sbd: 'S1', id: 'M2', dsCau }, {noiBo:true})
    await mom(d.env, 'start', { token, id: 'M2' })
    const trong = await mom(d.env, 'submit', { token, id: 'M2', answers: {} })
    expect(trong.expNhan).toEqual([])
  })
  it('luyện đề (submit): câu đúng có EXP', async () => {
    const d = dung(true)
    const token = await gameToken(d.env, 'S1')
    const nguon = [{ maDe: 'L', phanI: [{ id: 'L-I-1', text: 'a', choices: ['A', 'B', 'C', 'D'], correct: 'A', dang: { ma: 'AA.BB' } }], phanII: [], phanIII: [{ id: 'L-III-1', text: 'd', correct: '0.5' }] }]
    d.objects.set('luyen-de-2026/S1/LD1.json', nguon)
    const now = Date.now()
    d.sql.prepare('INSERT INTO luyen_de_2026(id,sbd,created_at,deadline,bank_key,updated_at) VALUES(?,?,?,?,?,?)').run('LD1', 'S1', now, now + 3_000_000, 'luyen-de-2026/S1/LD1.json', now)
    const r = await luyenDe(d.env, 'submit', { token, id: 'LD1', answers: { 'L-I-1': 'A', 'L-III-1': '0,5' } })
    expect(loai(r)).toEqual(['cau', 'cau'])
  })
})
