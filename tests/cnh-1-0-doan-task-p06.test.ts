// @vitest-environment node
// CNH-1.0 P06 (02 §8) — VÒNG ĐỜI TASK CÁ NHÂN của Đoàn Hộ Tống trên MÁY CHỦ THẬT (SQLite + lược đồ thật):
//   · hiệp chuyển khi em CHƯA chốt ⇒ task `continuing` (vẫn nộp được tới hạn session 24 giờ), KHÔNG ghi thành sai;
//   · nộp task `continuing` chỉ ĐÓNG task, KHÔNG sửa thứ hạng đội đã chốt (máu Linh Tâm không đổi);
//   · quá hạn session ⇒ `expired_unanswered`: nộp bị TỪ CHỐI, KHÔNG cập nhật lỗi học thuật (không dòng sổ nào);
//   · mở lại ⇒ task `phat` với CÂU MỚI do máy chủ cấp (không phát lại đúng câu cũ).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { DEM_NGUOC_MS, NGHI_GIUA_HIEP_MS, AN_HAN_MS } from '../server/src/game-v2-doan'
import { taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-09-21T12:00:00+07:00')
let bayGio = T0
const troi = (ms: number) => { bayGio += ms; vi.setSystemTime(bayGio) }
beforeEach(() => { bayGio = T0; vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

type CauKho = { qid: string; phan: 'I' | 'II'; dang: string; correct: string; mucDo: string }
const KHO: CauKho[] = [
  ...Array.from({ length: 9 }, (_, i): CauKho => ({ qid: `X${i + 1}`, phan: 'I', dang: 'ES.A.X', correct: 'ABCD'[i % 4]!, mucDo: 'biet' })),
  ...Array.from({ length: 9 }, (_, i): CauKho => ({ qid: `Y${i + 1}`, phan: 'I', dang: 'AN.B.Y', correct: 'DCBA'[i % 4]!, mucDo: 'biet' })),
  { qid: 'TX1', phan: 'II', dang: 'ES.A.X', correct: 'DSDS', mucDo: 'biet' }, { qid: 'TX2', phan: 'II', dang: 'ES.A.X', correct: 'SSDD', mucDo: 'biet' },
  { qid: 'TY1', phan: 'II', dang: 'AN.B.Y', correct: 'DDSS', mucDo: 'biet' },
]
const dapAn = new Map(KHO.map((c) => [c.qid, c.correct]))

function dungTruong(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify({ toanBo: true }))
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',?,?,0,'v1')").run(KHO.length, 'kho/DE1.json')
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  for (const c of KHO) {
    const q = { qid: c.qid, maDe: 'DE1', version: 'v1', group: `g-${c.qid}`, phan: c.phan, text: `Đề ${c.qid}`, choices: c.phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: c.phan === 'II' ? ['ý a', 'ý b', 'ý c', 'ý d'] : [], hinhAnh: [], dang: c.dang, tenDang: c.dang, mucDo: c.mucDo, sao: 1, kienThuc: ['K1'], correct: c.correct, solution: 'x', reviewed: true }
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', q.qid, 'v1', q.group, q.dang, JSON.stringify(q))
  }
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn Thu Hà','12A','mk','x')").run()
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  return d
}


async function bangChung(d: D1That, sbd: string, qid: string) {
  await ghiSuKien(d.env, [{ nguon: 'btvn', maNguon: `BT-${sbd}`, sbd, qid, lan: 1, ketQua: 0, luc: new Date(T0 - 72 * 3_600_000).toISOString(), maDang: 'ES.A.X' }])
  await dungLaiHoSo(d.env, [sbd], new Date(T0).toISOString())
}
type KN = { ok: boolean; doan: any }
const goi = async (d: D1That, lenh: string, b: Record<string, unknown> = {}) =>
  gameV2(d.env, `doan-${lenh}`, { token: await gameToken(d.env, 'S1'), ...b }) as Promise<KN>
const dem = (d: D1That, sql: string, ...a: unknown[]) => Number((d.sql.prepare(sql).get(...(a as never[])) as { n: number }).n)
const nhiemVu = (xem: KN, hiep: number) => (xem.doan.nhiemVu as { hiep: number; tt: string; qid: string | null; conNop: boolean }[]).find((n) => n.hiep === hiep)!

/** Đi hết chặng, BỎ QUA hiệp 1 (không nộp): hiệp 1 hết giờ ⇒ hiệp chuyển. Trả hàng nhiệm vụ hiệp 1 lúc đó. */
async function diHetChang(d: D1That, ma: string, qidHiep1: string) {
  troi(DEM_NGUOC_MS)
  let xem = await goi(d, 'xem', { ma })
  troi(xem.doan.tran.giay * 1000 + AN_HAN_MS + 1_000)
  xem = await goi(d, 'xem', { ma })
  expect(xem.doan.tran.hiep).toBe(2)
  const nv1 = nhiemVu(xem, 1)
  while (!xem.doan.tran.ketThuc) {
    if (!xem.doan.tran.laTrum && !xem.doan.cau) { troi(NGHI_GIUA_HIEP_MS); xem = await goi(d, 'xem', { ma }); continue } // đang nghỉ giữa hiệp
    if (xem.doan.tran.laTrum) {
      for (const y of xem.doan.trum.yCuaEm as number[]) xem = await goi(d, 'nop-y', { ma, hiep: xem.doan.tran.hiep, y, answer: dapAn.get(xem.doan.trum.qid)![y] })
    } else {
      const qid = xem.doan.cau.qid as string
      xem = await goi(d, 'nop', { ma, hiep: xem.doan.tran.hiep, answer: dapAn.get(qid), hanhDong: 'danh' })
    }
    troi(NGHI_GIUA_HIEP_MS)
    xem = await goi(d, 'xem', { ma })
  }
  expect(qidHiep1).toBeTruthy()
  return nv1
}

describe('P06 §8 — vòng đời task cá nhân của Đoàn (máy chủ thật)', () => {
  it('chưa chốt khi hiệp chuyển ⇒ `continuing`; KHÔNG ghi thành sai; nộp bù chỉ đóng task, không đổi máu đội', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    const ma = (await goi(d, 'mo')).doan.ma as string
    troi(DEM_NGUOC_MS)
    const dau = await goi(d, 'xem', { ma })
    const qidHiep1 = dau.doan.cau.qid as string
    expect(nhiemVu(dau, 1)).toMatchObject({ tt: 'phat', qid: qidHiep1, conNop: true })
    const gocSo = dem(d, 'SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd=?', 'S1')
    const gocQid = dem(d, 'SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd=? AND qid=?', 'S1', qidHiep1)
    const nv1 = await diHetChang(d, ma, qidHiep1)
    expect(nv1).toMatchObject({ tt: 'continuing', conNop: true, qid: qidHiep1 })
    // KHÔNG tính thành sai: chặng chạy xong mà sổ KHÔNG thêm dòng nào cho câu bỏ ngỏ, và không có attempt nào.
    expect(dem(d, 'SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd=? AND qid=?', 'S1', qidHiep1)).toBe(gocQid)
    expect(dem(d, 'SELECT COUNT(*) n FROM game_v2_attempt WHERE sbd=? AND qid=?', 'S1', qidHiep1)).toBe(0)
    const truoc = (await goi(d, 'xem', { ma })).doan.tran.linhTam.hp as number
    const sau = await goi(d, 'nop-tiep', { ma, hiep: 1 })
    expect(nhiemVu(sau, 1).tt).toBe('da_nop')
    expect(nhiemVu(sau, 1).conNop).toBe(false)
    expect(sau.doan.tran.linhTam.hp).toBe(truoc) // thứ hạng/điểm đội đã chốt KHÔNG bị sửa
  })

  it('quá hạn session 24 giờ ⇒ `expired_unanswered`: nộp bị từ chối, KHÔNG cập nhật lỗi học thuật', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    const ma = (await goi(d, 'mo')).doan.ma as string
    troi(DEM_NGUOC_MS)
    const qidHiep1 = (await goi(d, 'xem', { ma })).doan.cau.qid as string
    await diHetChang(d, ma, qidHiep1)
    const goc = dem(d, 'SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd=?', 'S1')
    const gocQid = dem(d, 'SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd=? AND qid=?', 'S1', qidHiep1)
    troi(25 * 3_600_000)
    const xem = await goi(d, 'xem', { ma })
    expect(nhiemVu(xem, 1)).toMatchObject({ tt: 'expired_unanswered', conNop: false })
    await expect(goi(d, 'nop-tiep', { ma, hiep: 1 })).rejects.toThrow(/hết hạn/)
    expect(dem(d, 'SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd=?', 'S1')).toBe(goc) // không thêm dòng nào (không lỗi học thuật)
    expect(dem(d, 'SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd=? AND qid=?', 'S1', qidHiep1)).toBe(gocQid)
  })

  it('mở lại task hết hạn ⇒ task `phat` với CÂU MỚI (không phát lại đúng câu cũ)', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    const ma = (await goi(d, 'mo')).doan.ma as string
    troi(DEM_NGUOC_MS)
    const qidHiep1 = (await goi(d, 'xem', { ma })).doan.cau.qid as string
    await diHetChang(d, ma, qidHiep1)
    troi(25 * 3_600_000)
    await goi(d, 'xem', { ma })
    const mo = await goi(d, 'mo-lai', { ma, hiep: 1 })
    const nv = nhiemVu(mo, 1)
    expect(nv.tt).toBe('phat')
    expect(nv.conNop).toBe(true)
    expect(nv.qid).toBeTruthy()
    expect(nv.qid).not.toBe(qidHiep1) // KHÔNG phát lại cùng câu
  })
})

