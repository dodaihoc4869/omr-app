// @vitest-environment node
// Ca 3ce982f848a6: JSON cắt giữa sơ đồ không được thành chữ; câu thay của Tu luyện phải mở đúng nội dung.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { hsHoiThay } from '../server/src/loi-giai'
import { damBaoBangTuLuyen } from '../server/src/tu-luyen'
import { tachKetQua, traLoiHoiThem, type NguCanhCau } from '../server/src/hoi-tro-ly'

const GOC = '12-HOI-III-3', HIEN = '12-HOI-III-8', LUOT = 'tl_abcdef18'
const JSON_CUT = '{"lienQuan":true,"yChinh":"Glucose chuyển thành glycogen.","soDo":{"nut":[' + '"Glucose","Glycogen",'.repeat(300)

async function dung() {
  const d = taoD1That()
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('E1','Em thử','12','mk','x'),('E2','Em khác','12','mk','x')")
  await damBaoBangTuLuyen(d.env)
  d.objects.set('kho/12-HOI.json', { cau: [
    { phan: 'III', so: 3, de: 'Glucose và glycogen', dap_an: '1' },
    { phan: 'III', so: 8, de: 'Amphetamine có x nguyên tử H, methamphetamine có y nguyên tử H.', dap_an: '1315' },
  ] })
  d.sql.prepare("INSERT INTO tu_luyen_luot(id,sbd,che_do,de_rieng_json,tao_luc) VALUES(?,'E1',1,?,1)")
    .run(LUOT, JSON.stringify([{ qid: GOC + '~2', hien: HIEN, tc: GOC, bac: 'anh_em' }]))
  return { d, token: await gameToken(d.env, 'E1') }
}

describe('Hỏi Thầy: JSON lỗi', () => {
  it.each([JSON_CUT, '```json\n' + JSON_CUT, '{"yChinh":"Thiếu cờ"}', '[{"lienQuan":true}]'])('không đưa JSON hỏng/sai khuôn vào lời trả lời %#', (chu) => {
    expect(tachKetQua(chu).traLoi).toBe('')
  })
  it('giữ câu chữ cũ và JSON chữ cũ hợp lệ', () => {
    expect(tachKetQua('Em đếm số H từng nhóm.').traLoi).toBe('Em đếm số H từng nhóm.')
    expect(tachKetQua('{"lienQuan":true,"traLoi":"Em đếm từng nhóm."}').traLoi).toBe('Em đếm từng nhóm.')
  })
  it('JSON bị cắt trả lỗi có thể thử lại, không trừ lượt/ghi trợ giúp hay lưu JSON vào lịch sử', async () => {
    const { d } = await dung()
    d.env.GEMINI_API_KEY = 'gia-lap'
    const nc: NguCanhCau = { qid: GOC, cau: { phan: 'III', so: '3', de: 'Glucose và glycogen', pa: null, y: null, dapAn: '1', bang: null, hinh: [], loiGiai: null }, hoSo: null, loiGiaiChu: null }
    const r = await traLoiHoiThem(d.env, 'E1', { qid: GOC, cauHoi: 'Glycogen chuyển thành glucose không?' }, {
      nguCanh: async () => ({ ok: true, ...nc }),
      goiAi: async () => ({ ok: true, chu: JSON_CUT, vao: 1, ra: 2048 }),
    })
    expect(r).toMatchObject({ ok: false, ma: 'dinh_dang', conLai: 36 })
    expect(r).not.toHaveProperty('traLoi')
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM hoi_tro_ly WHERE loi IS NULL').get()).toMatchObject({ n: 0 })
    expect(d.sql.prepare('SELECT tra_loi,loi FROM hoi_tro_ly').get()).toMatchObject({ tra_loi: null, loi: 'dinh_dang: JSON không hoàn chỉnh hoặc sai khuôn' })
  })
})

describe('Hỏi Thầy: đúng câu của lượt Tu luyện', () => {
  it('mã chấm gốc vẫn giữ nhưng hộp hỏi mở câu anh em, kể cả lần lặp ~2', async () => {
    const { d, token } = await dung()
    const r = await hsHoiThay(d.env, { token, qid: GOC + '~2', luotId: LUOT, nguon: 'tu_luyen', chiHoi: true })
    expect(r).toMatchObject({ ok: true, cau: { qid: HIEN, de: expect.stringContaining('Amphetamine') } })
    expect(JSON.stringify(r)).not.toContain('1315')
    expect(d.sql.prepare('SELECT de_rieng_json FROM tu_luyen_luot WHERE id=?').get(LUOT)?.de_rieng_json).toContain(GOC + '~2')
  })
  it('không dùng lượt của em khác hoặc câu không thuộc lượt để mở câu', async () => {
    const { d } = await dung()
    const token = await gameToken(d.env, 'E2')
    expect(await hsHoiThay(d.env, { token, qid: GOC + '~2', luotId: LUOT, nguon: 'tu_luyen', chiHoi: true })).toMatchObject({ ok: false })
    const t1 = await gameToken(d.env, 'E1')
    expect(await hsHoiThay(d.env, { token: t1, qid: HIEN, luotId: LUOT, nguon: 'tu_luyen', chiHoi: true })).toMatchObject({ ok: false })
  })
  it('lượt cũ không thay câu: lần lặp ~2 vẫn mở đúng câu gốc', async () => {
    const { d, token } = await dung()
    d.sql.prepare('UPDATE tu_luyen_luot SET de_rieng_json=? WHERE id=?').run(JSON.stringify([{ qid: GOC + '~2' }]), LUOT)
    expect(await hsHoiThay(d.env, { token, qid: GOC + '~2', luotId: LUOT, nguon: 'tu_luyen', chiHoi: true })).toMatchObject({ ok: true, cau: { qid: GOC } })
  })
})
