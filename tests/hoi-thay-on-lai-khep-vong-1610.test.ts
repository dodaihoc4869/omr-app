// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { chamVaGhiTraLoi } from '../server/src/on-lai-nop'
import { ghiSuKien } from '../server/src/su-kien-hoc'

const { dongBo } = vi.hoisted(() => ({ dongBo: vi.fn(async () => ({ daXacNhan: true, soDotDong: 1, soYeuCauDong: 0 })) }))
vi.mock('../server/src/hoi-thay-dong-bo-sua', () => ({ dongBoSuaLoiHoiThay: dongBo }))
vi.mock('../server/src/game-v2-auth', async orig => ({
  ...(await orig<typeof import('../server/src/game-v2-auth')>()),
  gameIdentity: async (_: unknown, b: Record<string, unknown>) => {
    if (b.token !== 'token-S1') throw new Error('Không đăng nhập')
    return 'S1'
  },
}))

const Q = 'DE1-I-1', NOW = Date.parse('2026-10-16T01:00:00Z')
let d: D1That
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW); dongBo.mockClear()
  d = taoD1That()
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Em','12','x'); INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Bài','12',1,0,'v1'); INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')")
  const q = { qid: Q, maDe: 'DE1', lop: '12', version: 'trusted-v1', group: 'g', phan: 'I', text: 'Câu ôn.', choices: ['A. a', 'B. b', 'C. c', 'D. d'], hinhAnh: [], dang: 'ES.A.X', mucDo: 'biet', sao: 0, correct: 'B', solution: 'Hướng dẫn', reviewed: true }
  d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', Q, q.version, 'g', q.dang, JSON.stringify(q))
  await ghiSuKien(d.env, [{ nguon: 'btvn', maNguon: 'B', sbd: 'S1', qid: Q, lan: 1, luc: new Date(NOW - 4 * 86400000).toISOString(), ketQua: 0 }])
})
afterEach(() => { d.sql.close(); vi.useRealTimers() })
const nop = () => chamVaGhiTraLoi(d.env, { token: 'token-S1', cauVersion: 'gia-mao', traLoi: [{ qid: Q, dapAn: 'B' }] }, { nguon: 'on_lai', maNguon: () => 'on_lai:2026-10-16' })
const hen = () => d.sql.prepare(`INSERT INTO hoi_thay_kiem(id,sbd,qid_goc,nhom_goc,version_goc,qid_kiem,version_kiem,khoa_noi_dung,snapshot_json,assistance,trang_thai,phat_luc,het_han_luc,den_han)
  VALUES('k','S1',?,'g','trusted-v1','hk:1','p1','khac','{}','assisted','da_nop',?,?,?)`).run(Q, NOW - 2 * 86400000, NOW - 86400000, NOW - 1)

it('ôn thường ghi phiên bản tin cậy, không phát lại hồ sơ Hỏi thầy khi không có lịch', async () => {
  expect(await nop()).toMatchObject({ ok: true, ketQua: [{ qid: Q, dung: true }] })
  const row = d.sql.prepare("SELECT raw_json FROM su_kien_hoc WHERE nguon='on_lai'").get() as { raw_json: string }
  expect(JSON.parse(row.raw_json).ht_cau_version).toBe('trusted-v1')
  expect(dongBo).not.toHaveBeenCalled()
})

it('ôn thường có lịch kiểm lại mới gọi đồng bộ sau khi sổ được ghi, nộp lại vẫn đúng lần đầu', async () => {
  hen()
  expect(await nop()).toMatchObject({ ok: true, ketQua: [{ dung: true }] })
  expect(dongBo).toHaveBeenCalledWith(d.env, 'S1', Q, NOW)
  expect(d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE nguon='on_lai'").get()).toMatchObject({ n: 1 })
  expect(await nop()).toMatchObject({ ok: true, ketQua: [{ dung: true }] })
  expect(d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE nguon='on_lai'").get()).toMatchObject({ n: 1 })
})

it('thiếu bảng tính năng mới vẫn nộp ôn cũ thành công, không mất kết quả đã ghi', async () => {
  d.sql.exec('DROP TABLE hoi_thay_kiem')
  expect(await nop()).toMatchObject({ ok: true, ketQua: [{ dung: true }] })
  expect(dongBo).not.toHaveBeenCalled()
})
