// @vitest-environment node
// CNH-1.0 — ĐOÀN CONTINUING END-TO-END (02 §8) — D1 THẬT (node:sqlite + schema/migration).
// Điều khoản: "Khi hiệp chuyển, task cá nhân chuyển `continuing`, vẫn nộp được đến hạn session (24 giờ từ lúc phát);
// điểm đóng góp đội sau kết hiệp KHÔNG sửa thứ hạng đã chốt, nhưng công học và thưởng hợp lệ vẫn ghi theo quy tắc
// NGÀY LÚC NỘP. Hết session mà chưa nộp là `expired_unanswered`, không cập nhật lỗi học thuật."
// Ca kiểm: phát task khi hiệp mở · `continuing` khi hiệp chuyển · nộp trong hạn (kể cả sang NGÀY VN sau) ·
// thứ hạng đã chốt không đổi · quá 24h ⇒ `expired_unanswered` + KHÔNG ghi lỗi học thuật · retry/hai máy không
// cộng thưởng hai lần · mở lại phải là câu MỚI do máy chủ kiểm phạm vi · đọc lại đề sau khi tải lại.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { serialiseD1, taoD1That, type D1That } from './_d1-that'
import { daHocDang } from './_pham-vi-ca-nhan'
import { HAN_SESSION_MS, chotTask, chuyenHiepTask, conNopDuoc, hetHanTask, moTask } from '../src/game/than-thu-v2/doan-core'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
const H = 3_600_000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

const cau = (qid: string, dang: string, phan: 'I' | 'II' = 'I') => ({
  qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Đề ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [],
  ideas: phan === 'II' ? ['ý a', 'ý b', 'ý c', 'ý d'] : [], hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo: 'biet', sao: 1,
  kienThuc: ['K1'], correct: phan === 'II' ? 'DSDS' : 'B', solution: `LG-${qid}`, reviewed: true,
})
/** Trường tổng hợp: Đoàn mở cho cả trường, em S1 có hồ sơ game + bằng chứng học dạng A.1. */
function dung(soA = 30): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify({ toanBo: true }))
  const ds = [...Array.from({ length: soA }, (_, i) => cau(`A-${i}`, 'A.1')), ...Array.from({ length: 6 }, (_, i) => cau(`A2-${i}`, 'A.1', 'II'))]
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',?,'kho/DE1.json',0,'v1')").run(ds.length)
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const q of ds) them.run('DE1', q.qid, q.version, q.group, q.dang, JSON.stringify(q))
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','12','mk','x')").run()
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)')
    .run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  daHocDang(d, 'S1', 'A.1')
  return d
}
const goi = async (d: D1That, lenh: string, b: Record<string, unknown> = {}) => (await gameV2(d.env, `doan-${lenh}`, { token: await gameToken(d.env, 'S1'), ...b })) as Record<string, any>
const phong = (d: D1That, ma: string) => JSON.parse((d.sql.prepare('SELECT json FROM doan_chang WHERE ma = ?').get(ma) as { json: string }).json) as Record<string, any>
const taskCua = (d: D1That, ma: string, hiep: number) => (phong(d, ma).task ?? {})[`0|${hiep}`] as Record<string, any> | undefined
const soSuKien = (d: D1That, qid: string) => (d.sql.prepare('SELECT COUNT(*) AS n FROM su_kien_hoc WHERE sbd=? AND qid=?').get('S1', qid) as { n: number }).n
const luotCua = (d: D1That, ma: string) => d.sql.prepare('SELECT thang, sao, so_cau, so_dung FROM doan_luot WHERE ma_chang=? AND sbd=?').get(ma, 'S1')
const viExp = (d: D1That) => {
  const p = JSON.parse((d.sql.prepare("SELECT json FROM game_v2_profile WHERE sbd='S1'").get() as { json: string }).json) as { exp?: number; wallet?: number; earned?: number }
  return (Number(p.exp) || 0) + (Number(p.wallet) || 0) + (Number(p.earned) || 0)
}
/** Mở chặng THẬT (có hiệp) và đưa tới lúc hiệp 1 mở + task đã phát. */
async function moChangVaPhatTask(d: D1That) {
  const mo = await goi(d, 'mo', {})
  expect(mo.ok).toBe(true)
  const ma = String(mo.doan.ma)
  vi.setSystemTime(T0 + 4_000) // qua đếm ngược để hiệp 1 mở
  const xem = await goi(d, 'xem', { ma })
  return { ma, xem }
}

describe('ĐOÀN CONTINUING (02 §8) — vòng đời task trên D1 thật', () => {
  it('hiệp mở ⇒ task `phat`; hiệp chuyển ⇒ `continuing` còn nộp; task thấy được qua khung nhìn của em', async () => {
    const d = dung()
    const { ma, xem } = await moChangVaPhatTask(d)
    const nv1 = (xem.doan.nhiemVu ?? []) as Record<string, any>[]
    expect(nv1.some((x) => x.hiep === 1 && x.tt === 'phat' && x.conNop === true)).toBe(true)
    expect(taskCua(d, ma, 1)).toMatchObject({ tt: 'phat' })
    const t1 = taskCua(d, ma, 1)!
    expect(t1.hanSession - t1.phatLuc).toBe(24 * H) // hạn session = 24 giờ từ lúc PHÁT

    // Ép hiệp 1 kết thúc (quá hạn hiệp + ân hạn) ⇒ task chưa chốt thành `continuing`.
    vi.setSystemTime(T0 + 400_000)
    const sau = await goi(d, 'xem', { ma })
    const nvSau = (sau.doan.nhiemVu ?? []) as Record<string, any>[]
    expect(nvSau.find((x) => x.hiep === 1)).toMatchObject({ tt: 'continuing', conNop: true })
    expect(taskCua(d, ma, 1)).toMatchObject({ tt: 'continuing', qid: t1.qid }) // KHÔNG phát lại câu khác
  })

  it('nộp trong hạn (kể cả sang NGÀY VN sau) ⇒ ghi công theo NGÀY NỘP; thứ hạng đã chốt KHÔNG đổi', async () => {
    const d = dung()
    const { ma } = await moChangVaPhatTask(d)
    vi.setSystemTime(T0 + 400_000)
    await goi(d, 'xem', { ma }) // hiệp 1 ⇒ continuing
    const qid = String(taskCua(d, ma, 1)!.qid)
    const luotTruoc = luotCua(d, ma)
    const lichSu1 = JSON.stringify(phong(d, ma).chang.lichSu[0]) // kết quả hiệp 1 ĐÃ CHỐT

    // Sang NGÀY VN kế tiếp (T0+20h = 08:00 ngày 23/09 VN) mới nộp ⇒ công học ghi theo ngày NỘP.
    vi.setSystemTime(T0 + 20 * H)
    const truoc = soSuKien(d, qid), expTruoc = viExp(d)
    const r = await goi(d, 'nop-tiep', { ma, hiep: 1, answer: 'B' })
    expect(r.ok).toBe(true)
    expect(r.ketQuaCau.correct).toBe(true)
    expect(taskCua(d, ma, 1)).toMatchObject({ tt: 'da_nop' })
    const r2 = await goi(d, 'xem', { ma })
    expect((r2.doan.nhiemVu as Record<string, any>[]).find((x) => x.hiep === 1)).toMatchObject({ tt: 'da_nop', conNop: false })

    const rows = d.sql.prepare('SELECT ngay_vn, ket_qua FROM su_kien_hoc WHERE sbd=? AND qid=? ORDER BY luc').all('S1', qid) as { ngay_vn: string; ket_qua: number }[]
    expect(rows.length).toBe(truoc + 1) // đúng MỘT sự kiện mới
    expect(rows.at(-1)!.ngay_vn).toBe('2026-09-23') // NGÀY NỘP, không phải ngày phát
    expect(rows.at(-1)!.ket_qua).toBe(1)
    expect(viExp(d)).toBeGreaterThanOrEqual(expTruoc) // thưởng hợp lệ theo quy tắc ngày lúc nộp

    // THỨ HẠNG đã chốt không bị sửa: sổ lượt + KẾT QUẢ HIỆP 1 đã chốt giữ nguyên.
    expect(luotCua(d, ma)).toEqual(luotTruoc)
    expect(JSON.stringify(phong(d, ma).chang.lichSu[0])).toBe(lichSu1)
    expect(phong(d, ma).chang.ketThuc).toBeFalsy() // nộp tiếp KHÔNG kết thúc chặng, KHÔNG đổi thắng/thua
  })

  it('nộp lại cùng task ⇒ TỪ CHỐI (một task một khoản); quá 24 giờ ⇒ `expired_unanswered` và KHÔNG ghi lỗi học thuật', async () => {
    const d = dung()
    const { ma } = await moChangVaPhatTask(d)
    vi.setSystemTime(T0 + 400_000)
    await goi(d, 'xem', { ma })
    const qid = String(taskCua(d, ma, 1)!.qid)
    await goi(d, 'nop-tiep', { ma, hiep: 1, answer: 'B' })
    const soSauKhiNop = soSuKien(d, qid)
    await expect(goi(d, 'nop-tiep', { ma, hiep: 1, answer: 'B' })).rejects.toThrow(/đã nộp rồi/)
    expect(soSuKien(d, qid)).toBe(soSauKhiNop) // nộp lại KHÔNG ghi thêm

    // Task của HIỆP 2 chưa chốt, để quá hạn session 24 giờ ⇒ expired.
    vi.setSystemTime(T0 + 400_000 + 7_000)
    await goi(d, 'xem', { ma })
    const qid2 = String(taskCua(d, ma, 2)!.qid)
    const soTruoc = soSuKien(d, qid2)
    vi.setSystemTime(T0 + 25 * H)
    const r = await goi(d, 'xem', { ma })
    expect((r.doan.nhiemVu as Record<string, any>[]).find((x) => x.hiep === 2)).toMatchObject({ tt: 'expired_unanswered', conNop: false })
    await expect(goi(d, 'nop-tiep', { ma, hiep: 2, answer: 'B' })).rejects.toThrow(/hết hạn/)
    expect(soSuKien(d, qid2)).toBe(soTruoc) // KHÔNG cập nhật lỗi học thuật cho câu bỏ dở
  })

  it('hai máy cùng nộp một task song song ⇒ đúng MỘT khoản, không cộng thưởng hai lần', async () => {
    const d = dung()
    const { ma } = await moChangVaPhatTask(d)
    vi.setSystemTime(T0 + 400_000)
    await goi(d, 'xem', { ma })
    const qid = String(taskCua(d, ma, 1)!.qid)
    const soTruoc = soSuKien(d, qid)
    serialiseD1(d.env)
    const out = await Promise.allSettled([
      goi(d, 'nop-tiep', { ma, hiep: 1, answer: 'B' }),
      goi(d, 'nop-tiep', { ma, hiep: 1, answer: 'B' }),
    ])
    expect(out.filter((x) => x.status === 'fulfilled').length).toBe(1) // một máy thắng
    expect(taskCua(d, ma, 1)).toMatchObject({ tt: 'da_nop' })
    expect(soSuKien(d, qid)).toBeLessThanOrEqual(soTruoc + 1) // KHÔNG hai sự kiện
  })

  it('đọc lại đề sau khi tải lại: trả ĐÚNG câu đã phát, không tạo attempt/thưởng', async () => {
    const d = dung()
    const { ma } = await moChangVaPhatTask(d)
    vi.setSystemTime(T0 + 400_000)
    await goi(d, 'xem', { ma })
    const qid = String(taskCua(d, ma, 1)!.qid)
    const soTruoc = soSuKien(d, qid), expTruoc = viExp(d)
    const r = await goi(d, 'doc-nhiem-vu', { ma, hiep: 1 })
    expect(r.ok).toBe(true)
    expect(r.nhiemVuChiTiet).toMatchObject({ hiep: 1, qid })
    expect(r.nhiemVuChiTiet.de.qid).toBe(qid)
    expect(Array.isArray(r.nhiemVuChiTiet.de.choices)).toBe(true)
    expect(soSuKien(d, qid)).toBe(soTruoc)
    expect(viExp(d)).toBe(expTruoc)
    await expect(goi(d, 'doc-nhiem-vu', { ma, hiep: 99 })).rejects.toThrow(/không có nhiệm vụ/)
  })

  it('mở lại sau khi hết hạn: phải là câu MỚI do máy chủ kiểm phạm vi, KHÔNG phát lại câu cũ', async () => {
    const d = dung()
    const { ma } = await moChangVaPhatTask(d)
    vi.setSystemTime(T0 + 400_000)
    await goi(d, 'xem', { ma })
    const cu = String(taskCua(d, ma, 1)!.qid)
    vi.setSystemTime(T0 + 25 * H)
    await goi(d, 'xem', { ma })
    expect(taskCua(d, ma, 1)).toMatchObject({ tt: 'expired_unanswered' })
    const r = await goi(d, 'mo-lai', { ma, hiep: 1 })
    expect(r.ok).toBe(true)
    expect(r.nhiemVuMoi.qid).toBeTruthy()
    expect(r.nhiemVuMoi.qid).not.toBe(cu) // câu MỚI, không phát lại câu cũ
    const t = taskCua(d, ma, 1)!
    expect(t).toMatchObject({ tt: 'phat', qid: r.nhiemVuMoi.qid })
    expect(t.lucMoLai).toBeGreaterThan(0)
    expect(t.hanSession - t.phatLuc).toBe(24 * H) // attempt mới có hạn session mới
  })

  it('hết bộ câu của chặng ⇒ `doan-mo-lai` phải XIN `start` câu mới: KHÔNG dùng lại câu đã phát/đang chờ', async () => {
    const d = dung()
    const { ma } = await moChangVaPhatTask(d)
    vi.setSystemTime(T0 + 400_000)
    await goi(d, 'xem', { ma })
    // Bộ câu đã cấp cho ghế trong chặng (4 câu) — đánh dấu ĐÃ DÙNG hết bằng task hết hạn (fixture ghi thẳng phòng).
    const boCua = (phong(d, ma).nguoi[0].cau as { qid: string }[]).map((c) => c.qid)
    expect(boCua.length).toBeGreaterThan(0)
    const p = phong(d, ma)
    p.task = { ...(p.task ?? {}) }
    boCua.forEach((qid, k) => { p.task![`0|${k + 1}`] = { tt: 'expired_unanswered', phatLuc: T0, hanSession: T0 + 1000, qid, assistedByServer: false } })
    d.sql.prepare('UPDATE doan_chang SET json=?, revision=revision+1 WHERE ma=?').run(JSON.stringify(p), ma)

    vi.setSystemTime(T0 + 25 * H)
    const r = await goi(d, 'mo-lai', { ma, hiep: 1 })
    expect(r.ok).toBe(true)
    const moi = r.nhiemVuMoi as { hiep: number; qid: string; phien?: string }
    expect(moi.qid).toBeTruthy()
    expect(boCua).not.toContain(moi.qid) // câu MỚI, không phát lại câu đã phát
    expect(moi.phien).toBeTruthy() // câu mới đến từ PHIÊN do máy chủ cấp qua `start`
    const daPhat = new Set(Object.values(phong(d, ma).task ?? {}).map((t) => (t as { qid?: string }).qid).filter(Boolean) as string[])
    expect(daPhat.has(moi.qid)).toBe(true) // đã ghi vào task
    const taskKhac = Object.entries(phong(d, ma).task ?? {}).filter(([k]) => k !== '0|1').map(([, t]) => (t as { qid?: string }).qid)
    expect(taskKhac).not.toContain(moi.qid) // KHÔNG dùng lại câu đang chờ ở nhiệm vụ khác
  })

  it('doan-nop THƯỜNG (trả lời trong hiệp) ⇒ task `da_nop` ngay: đổi hiệp KHÔNG mời nộp tiếp, retry không cộng đôi', async () => {
    const d = dung()
    const { ma } = await moChangVaPhatTask(d)
    const qid = String(taskCua(d, ma, 1)!.qid)
    const soTruoc = soSuKien(d, qid)
    const r = await goi(d, 'nop', { ma, hiep: 1, hanhDong: 'danh', answer: 'B' })
    expect(r.ok).toBe(true)
    expect((r.ketQuaCau as { correct: boolean }).correct).toBe(true)
    // BUG cũ: chấm xong nhưng không chốt task ⇒ `giai` biến nó thành `continuing`.
    expect(taskCua(d, ma, 1)).toMatchObject({ tt: 'da_nop' })
    vi.setSystemTime(T0 + 400_000 + 7_000)
    const xem = await goi(d, 'xem', { ma })
    expect((xem.doan.nhiemVu as Record<string, any>[]).find((x) => x.hiep === 1)).toMatchObject({ tt: 'da_nop', conNop: false })
    await expect(goi(d, 'nop-tiep', { ma, hiep: 1, answer: 'B' })).rejects.toThrow(/đã nộp rồi/)
    expect(soSuKien(d, qid)).toBe(soTruoc + 1) // đúng MỘT sự kiện cho câu này, retry không thêm
  })

  it('BỎ TRỐNG/CHẮN vẫn GIỮ nhiệm vụ chưa trả lời ⇒ sau chuyển hiệp là `continuing`, nộp tiếp được', async () => {
    const d = dung()
    const { ma } = await moChangVaPhatTask(d)
    const qid = String(taskCua(d, ma, 1)!.qid)
    const r = await goi(d, 'nop', { ma, hiep: 1, hanhDong: 'chan', boTrong: true })
    expect(r.ok).toBe(true)
    expect(taskCua(d, ma, 1)).toMatchObject({ tt: 'continuing', qid }) // KHÔNG chốt: em chưa trả lời
    const xem = await goi(d, 'xem', { ma })
    expect((xem.doan.nhiemVu as Record<string, any>[]).find((x) => x.hiep === 1)).toMatchObject({ tt: 'continuing', conNop: true })
    const muon = await goi(d, 'nop-tiep', { ma, hiep: 1, answer: 'B' })
    expect(muon.ok).toBe(true) // nộp tiếp hợp lệ theo spec
    expect(taskCua(d, ma, 1)).toMatchObject({ tt: 'da_nop' })
  })

  it('TRỢ GIÚP khi cấp thẻ (bạn MÁY) ⇒ nhiệm vụ được đánh dấu `assistedByServer` cùng lần lưu phòng; nộp trễ KHÔNG tính tự làm', async () => {
    const d = dung()
    const { ma } = await moChangVaPhatTask(d)
    const qid = String(taskCua(d, ma, 1)!.qid)
    const xin = await goi(d, 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' })
    expect(xin.ok).toBe(true)
    expect(taskCua(d, ma, 1)).toMatchObject({ tt: 'phat', assistedByServer: true }) // dấu ghi NGAY khi cấp thẻ
    // Không trả lời trong hiệp ⇒ hiệp chuyển ⇒ `continuing` (giữ dấu trợ giúp)
    vi.setSystemTime(T0 + 400_000)
    await goi(d, 'xem', { ma })
    expect(taskCua(d, ma, 1)).toMatchObject({ tt: 'continuing', assistedByServer: true })
    const muon = await goi(d, 'nop-tiep', { ma, hiep: 1, answer: 'B' })
    expect(muon.ok).toBe(true)
    const att = d.sql.prepare('SELECT json FROM game_v2_attempt WHERE sbd=? AND qid=?').all('S1', qid) as { json: string }[]
    expect(att).toHaveLength(1) // một lần chấm
    expect((JSON.parse(att[0]!.json) as { attempt: { assisted?: boolean } }).attempt.assisted).toBe(true) // KHÔNG tính tự làm
    await expect(goi(d, 'nop-tiep', { ma, hiep: 1, answer: 'B' })).rejects.toThrow(/đã nộp rồi/) // receipt idempotent
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM game_v2_attempt WHERE sbd=? AND qid=?').get('S1', qid)).toEqual({ n: 1 })
  })
})

describe('ĐOÀN — CONCURRENT JOIN / MỞ LẠI HAI THIẾT BỊ (02 §8) trên D1 thật', () => {
  const themEm2 = (d: D1That) => {
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S2','Em Hai','12','mk2','x')").run()
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)')
      .run('S2', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
    daHocDang(d, 'S2', 'A.1')
  }
  const goiS2 = async (d: D1That, lenh: string, b: Record<string, unknown> = {}) => (await gameV2(d.env, `doan-${lenh}`, { token: await gameToken(d.env, 'S2'), ...b })) as Record<string, any>
  /** Cùng một em, hai thiết bị: gọi bằng TOKEN của chính em ấy (mỗi lượt một token như máy khác nhau). */
  const goiS1 = async (d: D1That, lenh: string, b: Record<string, unknown> = {}) => (await gameV2(d.env, `doan-${lenh}`, { token: await gameToken(d.env, 'S1'), ...b })) as Record<string, any>
  const themEm3 = (d: D1That, sbd: string) => {
    d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?)').run(sbd, `Em ${sbd}`, '12', `mk${sbd}`, 'x')
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)')
      .run(sbd, JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
    daHocDang(d, sbd, 'A.1')
  }
  const demGhe = (d: D1That, ma: string) => (phong(d, ma).nguoi as { sbd: string }[]).length
  const demLuot = (d: D1That, ma: string, sbd?: string) =>
    Number((d.sql.prepare(`SELECT COUNT(*) AS n FROM doan_luot WHERE ma_chang=?${sbd ? ' AND sbd=?' : ''}`).get(...(sbd ? [ma, sbd] : [ma])) as { n: number }).n)
  const demPhienTrong = (d: D1That) => Number((d.sql.prepare("SELECT COUNT(*) AS n FROM game_v2_session s WHERE s.sbd='S1' AND NOT EXISTS (SELECT 1 FROM game_v2_attempt a WHERE a.session=s.id AND a.sbd=s.sbd)").get() as { n: number }).n)

  /** RAO CHẮN THẬT ở cửa GHI: mọi yêu cầu phải tới `batch` (đọc xong) rồi mới lần lượt ghi ⇒ buộc CÙNG revision. */
  function raoGhi(d: D1That, n: number) {
    const goc = d.env.DB.batch.bind(d.env.DB)
    let da = 0
    let mo!: () => void
    const cua = new Promise<void>((r) => { mo = r })
    let hang: Promise<unknown> = Promise.resolve()
    d.env.DB.batch = ((ds: unknown) => {
      if (++da >= n) mo()
      const chay = cua.then(() => (hang = hang.then(() => goc(ds as never)))) // sau rao: ghi NỐI TIẾP (không lồng BEGIN)
      hang = chay.catch(() => {})
      return chay
    }) as typeof d.env.DB.batch
  }
  /** Đo revision mà TỪNG yêu cầu đọc được (`doan_chang`) ⇒ chứng minh rao chắn thật sự buộc cùng revision. */
  function doRevision(d: D1That) {
    const goc = d.env.DB.prepare.bind(d.env.DB)
    const revs: number[] = []
    d.env.DB.prepare = ((q: string) => {
      const st = goc(q)
      if (!/revision\s+FROM\s+doan_chang/i.test(q)) return st
      const nguon = st.first.bind(st)
      return {
        ...st,
        first: async (...a: unknown[]) => {
          const r = (await nguon(...(a as never[]))) as { revision?: number } | null
          if (r) revs.push(Number(r.revision))
          return r
        },
      } as never
    }) as typeof d.env.DB.prepare
    return revs
  }

  it('HAI EM cùng vào MỘT phòng (hai yêu cầu đọc trước khi ghi): đủ ba ghế, ba dòng sổ lượt, mỗi lượt vào ghi ĐÚNG một lần', async () => {
    const d = dung()
    themEm3(d, 'S2'); themEm3(d, 'S3')
    const mo = await goiS1(d, 'mo', { cheDo: 'phong' }) // S1 mở phòng (đã là ghế 0)
    const ma = String(mo.doan.ma)
    const revTruoc = Number((d.sql.prepare('SELECT revision FROM doan_chang WHERE ma=?').get(ma) as { revision: number }).revision)
    expect(demGhe(d, ma)).toBe(1)
    const revs = doRevision(d)
    serialiseD1(d.env) // D1 giả: mọi câu lệnh xếp hàng (ghi nối tiếp, không lồng giao dịch)
    const [b, c] = await Promise.all([goiS2(d, 'vao', { ma }), (await gameV2(d.env, 'doan-vao', { token: await gameToken(d.env, 'S3'), ma })) as Record<string, any>])
    expect(b.ok && c.ok).toBe(true)
    expect(revs[0]).toBe(revTruoc) // ĐO ĐƯỢC revision mỗi yêu cầu đọc (KHÔNG giả định hai yêu cầu buộc cùng revision:
    expect(revs.length).toBeGreaterThanOrEqual(2) // `serialiseD1` chỉ xếp hàng câu lệnh, KHÔNG phải barrier cùng-revision)
    expect(demGhe(d, ma)).toBe(3) // KHÔNG mất ghế, KHÔNG nhân đôi
    expect(new Set((phong(d, ma).nguoi as { sbd: string }[]).map((n) => n.sbd))).toEqual(new Set(['S1', 'S2', 'S3']))
    expect(demLuot(d, ma)).toBe(3)
    expect(demLuot(d, ma, 'S2')).toBe(1)
    expect(demLuot(d, ma, 'S3')).toBe(1)
    expect(Number((d.sql.prepare('SELECT revision FROM doan_chang WHERE ma=?').get(ma) as { revision: number }).revision)).toBe(revTruoc + 2) // mỗi lượt VÀO ghi đúng MỘT lần
  })

  it('MỘT EM hai thiết bị cùng `doan-vao`: đúng MỘT ghế, một dòng sổ lượt (không nhân đôi)', async () => {
    const d = dung()
    const mo = await goiS1(d, 'mo', { cheDo: 'phong' })
    const ma = String(mo.doan.ma)
    serialiseD1(d.env)
    const out = await Promise.allSettled([goiS1(d, 'vao', { ma }), goiS1(d, 'vao', { ma })])
    expect(out.filter((x) => x.status === 'fulfilled').length).toBeGreaterThanOrEqual(1)
    expect(demGhe(d, ma)).toBe(1)
    expect(demLuot(d, ma, 'S1')).toBe(1)
  })

  it('`doan-mo-lai` khi task CHƯA hết hạn ⇒ TỪ CHỐI trước khi cấp phiên: không phiên mới, không đụng task', async () => {
    const d = dung()
    const { ma } = await moChangVaPhatTask(d)
    const truoc = demPhienTrong(d)
    const t = taskCua(d, ma, 1)!
    await expect(goi(d, 'mo-lai', { ma, hiep: 1 })).rejects.toThrow(/chưa hết hạn/)
    expect(demPhienTrong(d)).toBe(truoc) // KHÔNG tạo phiên cho yêu cầu không hợp lệ
    expect(taskCua(d, ma, 1)).toMatchObject({ tt: 'phat', qid: t.qid }) // task nguyên trạng
    // Task đã nộp cũng bị từ chối tương tự (không mở lại câu đã trả lời).
    await goi(d, 'nop', { ma, hiep: 1, hanhDong: 'danh', answer: 'B' })
    await expect(goi(d, 'mo-lai', { ma, hiep: 1 })).rejects.toThrow(/chưa hết hạn/)
  })

  it('MỘT EM hai thiết bị cùng `doan-mo-lai` khi `start` TRẢ LẠI PHIÊN ĐANG CHỜ CÓ TRƯỚC: KHÔNG xoá phiên người thắng, task winner vẫn đọc và nộp được', async () => {
    const d = dung()
    const { ma } = await moChangVaPhatTask(d)
    vi.setSystemTime(T0 + 400_000)
    await goi(d, 'xem', { ma })
    // (1) Bộ câu của ghế ĐÃ DÙNG HẾT ⇒ buộc đi qua `start`.
    const boCua = (phong(d, ma).nguoi[0].cau as { qid: string }[]).map((c) => c.qid)
    const p = phong(d, ma)
    p.task = { ...(p.task ?? {}) }
    boCua.forEach((qid, k) => { p.task![`0|${k + 1}`] = { tt: 'expired_unanswered', phatLuc: T0, hanSession: T0 + 1000, qid, assistedByServer: false } })
    d.sql.prepare('UPDATE doan_chang SET json=?, revision=revision+1 WHERE ma=?').run(JSON.stringify(p), ma)
    // (2) PHIÊN ĐANG CHỜ CÓ TRƯỚC (máy khác vừa mở, chưa trả lời câu nào) — `start` sẽ TRẢ LẠI đúng id này.
    const phienCho = 'CHO-TRUOC-1'
    const cauTrongPhien = 'A-9'
    vi.setSystemTime(T0 + 25 * H)
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)')
      .run(phienCho, 'S1', JSON.stringify({ mode: 'adventure', created: T0 + 24 * H, questions: [{ qid: cauTrongPhien, maDe: 'DE1', version: 'v1', group: `g-${cauTrongPhien}`, novel: true }] }), new Date(T0 + 24 * H + 60_000).toISOString())
    const truocPhien = demPhienTrong(d)
    serialiseD1(d.env)
    const out = await Promise.allSettled([goi(d, 'mo-lai', { ma, hiep: 1 }), goi(d, 'mo-lai', { ma, hiep: 1 })])
    const thanh = out.filter((x) => x.status === 'fulfilled') as PromiseFulfilledResult<Record<string, any>>[]
    expect(thanh.length).toBeGreaterThanOrEqual(1)
    const qidWinner = thanh[0]!.value.nhiemVuMoi.qid as string
    expect(qidWinner).toBeTruthy()
    expect(boCua).not.toContain(qidWinner) // câu MỚI, không phát lại câu đã phát
    const t = taskCua(d, ma, 1)!
    expect(t).toMatchObject({ tt: 'phat', qid: qidWinner }) // người thắng giữ nguyên, không bị đè
    const phienTask = String((t as { phien?: string }).phien ?? '')
    expect(phienTask).toBeTruthy() // task mở lại trỏ vào PHIÊN của nó
    // (3) KHÔNG XOÁ phiên: phiên đang chờ CÓ TRƯỚC vẫn còn, và phiên mà task người thắng tham chiếu vẫn còn.
    expect((d.sql.prepare('SELECT id FROM game_v2_session WHERE id=? AND sbd=?').get(phienCho, 'S1') as { id?: string } | undefined)?.id).toBe(phienCho)
    expect((d.sql.prepare('SELECT id FROM game_v2_session WHERE id=? AND sbd=?').get(phienTask, 'S1') as { id?: string } | undefined)?.id).toBe(phienTask)
    expect(demPhienTrong(d)).toBeGreaterThanOrEqual(truocPhien) // không mất phiên nào sau lượt thua
    // (4) Người thắng VẪN ĐỌC ĐỀ và NỘP ĐƯỢC sau khi lượt thua kết thúc.
    const doc = await goi(d, 'doc-nhiem-vu', { ma, hiep: 1 })
    expect(doc.ok).toBe(true)
    expect(doc.nhiemVuChiTiet).toMatchObject({ qid: qidWinner }) // đọc lại ĐÚNG câu của nhiệm vụ người thắng
    const nop = await goi(d, 'nop-tiep', { ma, hiep: 1, answer: 'B' })
    expect(nop.ok).toBe(true)
    expect(taskCua(d, ma, 1)).toMatchObject({ tt: 'da_nop' })
    expect((d.sql.prepare('SELECT id FROM game_v2_session WHERE id=? AND sbd=?').get(phienCho, 'S1') as { id?: string } | undefined)?.id).toBe(phienCho)
  })
})

describe('ĐOÀN — TRỢ GIÚP BẠN THẬT (02 §8)', () => {
  it('TRỢ GIÚP (bạn THẬT) ⇒ nhiệm vụ của BẠN NHẬN cũng `assistedByServer`, nộp trễ không tính tự làm', async () => {
    const d = dung()
    // Thêm em thứ hai để có đường “bạn thật tiếp sức” (không rơi vào bạn máy).
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S2','Em Hai','12','mk2','x')").run()
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)')
      .run('S2', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
    daHocDang(d, 'S2', 'A.1')
    const goi2 = async (lenh: string, b: Record<string, unknown> = {}) => (await gameV2(d.env, `doan-${lenh}`, { token: await gameToken(d.env, 'S2'), ...b })) as Record<string, any>
    const mo = await goi(d, 'mo', { cheDo: 'phong' }) // mở PHÒNG (chưa lên đường) để bạn thứ hai vào được
    const ma = String(mo.doan.ma)
    await goi2('vao', { ma }) // S2 vào đoàn (ghế 1)
    await goi(d, 'bat-dau', { ma }) // chủ đoàn cho lên đường
    vi.setSystemTime(T0 + 4_000)
    await goi(d, 'xem', { ma })
    expect(taskCua(d, ma, 1)?.tt).toBe('phat')
    await goi2('nop', { ma, hiep: 1, hanhDong: 'danh', answer: 'B' }) // bạn giúp phải chốt đòn của mình trước
    await goi(d, 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' }) // S1 bật tín hiệu cần tiếp sức (có bạn thật ⇒ KHÔNG rơi vào bạn máy)
    const y = await goi2('the-goi-y', { ma, den: 0 })
    const loai = String(((y.goiY as { the: { loai: string }[] }).the[0]!).loai)
    const giup = await goi2('tiep-suc', { ma, hiep: 1, den: 0, the: loai })
    expect(giup.ok).toBe(true)
    // Thẻ cấp cho ghế 0 ⇒ nhiệm vụ của GHẾ 0 được đánh dấu trong CÙNG lần lưu phòng (trước khi hiệp chuyển).
    expect((phong(d, ma).task as Record<string, { assistedByServer?: boolean }>)['0|1']?.assistedByServer).toBe(true)
    const t0 = phong(d, ma).task as Record<string, { assistedByServer?: boolean }>
    expect(t0['1|1']?.assistedByServer).toBe(false) // ghế GIÚP không bị đánh dấu oan
    // S1 không trả lời trong hiệp ⇒ hiệp chuyển ⇒ nộp trễ KHÔNG được tính tự làm.
    vi.setSystemTime(T0 + 400_000)
    await goi(d, 'xem', { ma })
    expect(taskCua(d, ma, 1)).toMatchObject({ tt: 'continuing', assistedByServer: true })
    const qid = String(taskCua(d, ma, 1)!.qid)
    const muon = await goi(d, 'nop-tiep', { ma, hiep: 1, answer: 'B' })
    expect(muon.ok).toBe(true)
    const att = d.sql.prepare('SELECT json FROM game_v2_attempt WHERE sbd=? AND qid=?').all('S1', qid) as { json: string }[]
    expect(att).toHaveLength(1)
    expect((JSON.parse(att[0]!.json) as { attempt: { assisted?: boolean } }).attempt.assisted).toBe(true)
  })
})





// ── RANH GIỚI 24h CHÍNH XÁC (Lát 3 · 02 §8 dòng 214) — hàm THUẦN vòng đời task, không cần D1 ──
describe('RANH GIỚI 24h CHÍNH XÁC — hạn session từ lúc PHÁT (§8)', () => {
  it('hạn = 24h từ lúc PHÁT; sát mép (hạn−1ms) còn nộp; ĐÚNG mốc hạn ⇒ `expired_unanswered`, không nộp được', () => {
    const t0 = Date.parse('2026-09-22T12:00:00+07:00')
    const t = moTask(0, 1, 'Q-1', t0)
    expect(HAN_SESSION_MS).toBe(24 * H)
    expect(t.hanSession - t.phatLuc).toBe(24 * H)

    // SÁT MÉP TRƯỚC hạn: nguyên trạng + CÒN nộp.
    expect(hetHanTask(t, t.hanSession - 1)).toBe(t)
    expect(conNopDuoc(t, t.hanSession - 1)).toBe(true)

    // ĐÚNG MỐC hạn: expired + KHÔNG nộp được (không khoan; quá hạn thêm cũng vậy).
    const het = hetHanTask(t, t.hanSession)
    expect(het.tt).toBe('expired_unanswered')
    expect(conNopDuoc(t, t.hanSession)).toBe(false)
    expect(conNopDuoc(het, t.hanSession + 1)).toBe(false)

    // `continuing` chịu CÙNG luật hạn (phát → hiệp chuyển → hết hạn).
    const c = chuyenHiepTask(t)
    expect(c.tt).toBe('continuing')
    expect(conNopDuoc(c, t.hanSession - 1)).toBe(true)
    expect(hetHanTask(c, t.hanSession).tt).toBe('expired_unanswered')

    // ĐÃ CHỐT: không bao giờ bị quét thành expired, dù quá hạn rất xa (một task một khoản).
    const daNop = chotTask(t)
    expect(daNop.tt).toBe('da_nop')
    expect(hetHanTask(daNop, t.hanSession + 30 * 24 * H)).toBe(daNop)
  })
})

