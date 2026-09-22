// @vitest-environment node
// VIỆC `on_thi` MANG DANH SÁCH CÂU (server/src/ke-hoach-ngay.ts + ke-hoach-ngay-d1.ts): câu lấy từ hồ sơ của em, lệnh lấy đề PHỤC VỤ ĐƯỢC, và cùng luồng
// `/hs/cau-theo-qid` + `/hs/on-lai/nop` với on_lai (nên LamCauOn dùng chung). SQLite thật, lược đồ thật + mọi migration.
import { describe, it, expect, vi } from 'vitest'
import worker from '../server/src/index'
import { layCauChoEm } from '../server/src/cau-theo-qid'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

vi.mock('../server/src/game-v2-auth', async (orig) => ({
  ...(await orig<typeof import('../server/src/game-v2-auth')>()),
  gameIdentity: async (_e: unknown, b: Record<string, unknown>) => {
    if (b.token !== 'token-S1') throw new Error('Phiên đăng nhập không hợp lệ.')
    return 'S1'
  },
}))

const H = 3_600_000
const D = 24 * H
const cauKho = (qid: string) => ({
  qid, maDe: 'x', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Đề ${qid}`, choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], dang: 'ES.A.X', tenDang: 'Dạng', mucDo: 'biet', sao: 1,
  kienThuc: ['K1'], correct: 'B', solution: 'Giải', reviewed: true,
})
function themCau(d: D1That, maDe: string, cau: string[], daXoa = 0) {
  d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?, '12',?,?,?, 'v1')").run(maDe, maDe, cau.length, `kho/${maDe}.json`, daXoa)
  d.sql.prepare('INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(maDe, 'v1', 'x')
  for (const q of cau) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(maDe, q, 'v1', `g-${q}`, 'ES.A.X', JSON.stringify({ ...cauKho(q), maDe }))
}
/** Ca THI mở, của lớp 12, bắt đầu sau `gio` giờ; tờ đề có `qid` (đề bảo vệ). */
function themCa(d: D1That, maCa: string, gio: number, qid: string[]) {
  d.objects.set(`de/${maCa}.json`, { phanI: qid.map((q) => ({ id: q, text: `Đề ${q}`, choices: ['A', 'B', 'C', 'D'], correct: 'B', dang: { ma: 'ES.A.X', ten: 'Dạng' }, mucDo: 'biet', kienThuc: ['K1'], loiGiai: { chot: 'g' } })), phanII: [], phanIII: [] })
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cong_bo,bank_r2,loai,lop,thoi_gian_phut,bat_dau,het_han_vao,cap_nhat_luc) VALUES(?,?,'mo','ca_lop_xong',?,'thi','12',45,?,?,'x')")
    .run(maCa, `Ca ${maCa}`, `de/${maCa}.json`, new Date(Date.now() + gio * H).toISOString(), new Date(Date.now() + (gio + 2) * H).toISOString())
  xoaDemCaBaoVe() // test tự ghi bảng `ca` bằng SQL thô, không qua lệnh thật ⇒ tự xoá đệm (production có móc bất hoạt ở mọi lệnh sửa ca thật)
}
const themHs = (d: D1That) => d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','x','12','mk','x')").run()
const luc = (soNgayTruoc: number) => new Date(Date.now() - soNgayTruoc * D).toISOString()
async function sai(d: D1That, qids: string[], soNgayTruoc: number) {
  const r = await ghiSuKien(d.env, qids.map((q, i) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd: 'S1', qid: q, lan: i + 1, ketQua: 0 as const, luc: luc(soNgayTruoc) })))
  expect(r.ok).toBe(true)
}
const viecOnThi = async (d: D1That) => {
  const kh = (await lapVaLuuKeHoach(d.env, ['S1'], Date.now())).get('S1')!
  return { kh, thi: kh.viec.find((v) => v.loai === 'on_thi'), lai: (kh.viec.find((v) => v.loai === 'on_lai')?.chiTiet.qid as string[] | undefined) ?? [] }
}

/** S1 lớp 12: ÔN-1/2 sai 3 ngày trước (tới hạn → on_lai); N1..N3 sai HÔM NAY (chưa tới hạn, phục vụ được); NOIDX chưa lập chỉ mục; DEXOA đề đã xoá; BAOVE nằm trong tờ đề ca sắp thi. */
async function dung(coCa = true) {
  const d = taoD1That()
  themHs(d)
  themCau(d, 'DE-OK', ['ON1', 'ON2', 'N1', 'N2', 'N3'])
  themCau(d, 'DE-XOA', ['DEXOA'], 1)
  themCau(d, 'DE-BV', ['BAOVE'])
  if (coCa) themCa(d, 'CA-SAP', 30, ['BAOVE'])
  await sai(d, ['ON1', 'ON2'], 3)
  await sai(d, ['N1', 'N2', 'N3', 'NOIDX', 'DEXOA', 'BAOVE'], 0.02)
  await dungLaiHoSo(d.env, ['S1'], new Date().toISOString())
  return d
}

describe('việc on_thi mang câu từ hồ sơ, chỉ câu phục vụ được', () => {
  it('ca trong 3 ngày: on_thi có `chiTiet.qid` gồm câu em từng sai, phục vụ được, KHÔNG trùng on_lai, KHÔNG có câu đề bảo vệ / chưa lập chỉ mục / đề đã xoá', async () => {
    const d = await dung()
    const { thi, lai } = await viecOnThi(d)
    expect(lai.slice().sort()).toEqual(['ON1', 'ON2'])
    expect(thi).toBeDefined()
    expect(thi!.chiTiet).toMatchObject({ maCa: 'CA-SAP', tenCa: 'Ca CA-SAP' })
    const qid = (thi!.chiTiet.qid as string[]).slice().sort()
    expect(qid).toEqual(['N1', 'N2', 'N3'])
    expect(thi!.soCau).toBe(3)
    for (const cam of ['BAOVE', 'NOIDX', 'DEXOA', 'ON1', 'ON2']) expect(qid).not.toContain(cam)
  })
  it('câu đã khắc phục và câu cần dạy lại (`can_day_lai`) KHÔNG vào on_thi', async () => {
    const d = await dung()
    await viecOnThi(d) // lập một lần để `so_su_kien` khớp sổ: lần sau KHÔNG dựng lại hồ sơ (không ghi đè hai dòng sửa tay dưới)
    d.sql.prepare("UPDATE nam_kt_cau SET trang_thai = 'da_khac_phuc' WHERE sbd = 'S1' AND qid = 'N2'").run()
    d.sql.prepare("UPDATE nam_kt_cau SET can_day_lai = 1 WHERE sbd = 'S1' AND qid = 'N3'").run()
    const { thi } = await viecOnThi(d)
    expect((thi!.chiTiet.qid as string[]).sort()).toEqual(['N1'])
    expect(thi!.soCau).toBe(1)
  })
  it('TÍNH CHẤT: mọi qid của on_thi được `layCauChoEm` trả về (không có câu chết) và LẤY/NỘP qua đúng luồng on_lai: /hs/cau-theo-qid + /hs/on-lai/nop ghi sổ và lên bậc', async () => {
    const d = await dung()
    const { thi } = await viecOnThi(d)
    const qid = thi!.chiTiet.qid as string[]
    const r = await layCauChoEm(d.env, 'S1', qid)
    expect(r.khongCo).toEqual([])
    expect(r.cau.map((c) => c.qid).sort()).toEqual(qid.slice().sort())
    const lay = await goiWorker(worker, d.env, '/hs/cau-theo-qid', { token: 'token-S1', qid })
    expect(lay.ok).toBe(true)
    expect(lay.cau.map((c: any) => c.qid).sort()).toEqual(qid.slice().sort())
    for (const c of lay.cau) expect('correct' in c).toBe(false)
    const nop = await goiWorker(worker, d.env, '/hs/on-lai/nop', { token: 'token-S1', traLoi: qid.map((q) => ({ qid: q, dapAn: 'B' })) })
    expect(nop.ok).toBe(true)
    expect(nop.ketQua).toHaveLength(qid.length)
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE nguon='on_lai' AND sbd='S1'").get()).toEqual({ n: qid.length })
  })
  it('KHÔNG có ca sắp tới ⇒ không có on_thi và KHÔNG tốn truy vấn tìm ứng viên; ca xa hơn 3 ngày ⇒ như không có', async () => {
    const soTim = (d: D1That) => { const g = d.env.DB.prepare.bind(d.env.DB); let n = 0; d.env.DB.prepare = ((q: string) => { if (/can_day_lai = 0/.test(q) && /trang_thai IN \('moi_sai','dang_on'\)/.test(q) && !/moc_on_ke/.test(q)) n++; return g(q) }) as never; return () => n }
    const khong = await dung(false)
    const dem0 = soTim(khong)
    expect((await viecOnThi(khong)).thi).toBeUndefined()
    expect(dem0()).toBe(0)
    const xa = await dung(false)
    themCa(xa, 'CA-XA', 24 * 6, [])
    const dem1 = soTim(xa)
    expect((await viecOnThi(xa)).thi).toBeUndefined()
    expect(dem1()).toBe(0)
    // Có ca sắp tới + hồ sơ vừa dựng lại trong CHÍNH lượt này (`dung()` gọi `dungLaiHoSo` rồi `lapVaLuuKeHoach` lần đầu ⇒
    // `so_su_kien` chưa khớp `ke_hoach_ngay` ⇒ dựng lại lần nữa) ⇒ HẠ TẢI M3: ứng viên on_thi lấy từ hồ sơ VỪA dựng
    // trong bộ nhớ, không đọc lại D1 nữa — 0 truy vấn tìm ứng viên (trước 21/09 là 1; nay 0, đỡ hẳn một lượt đọc).
    const co = await dung()
    const dem2 = soTim(co)
    expect((await viecOnThi(co)).thi).toBeDefined()
    expect(dem2()).toBe(0)
  })
  it('em có ca sắp tới nhưng KHÔNG có câu ứng viên (chưa sai gì, hoặc chỉ câu chưa phục vụ được) ⇒ không giao on_thi rỗng', async () => {
    const d = taoD1That()
    themHs(d)
    themCau(d, 'DE-BV', ['BAOVE'])
    themCa(d, 'CA-SAP', 30, ['BAOVE'])
    expect((await viecOnThi(d)).thi).toBeUndefined() // chưa có hồ sơ
    await sai(d, ['BAOVE', 'NOIDX'], 0.02)
    await dungLaiHoSo(d.env, ['S1'], new Date().toISOString())
    expect((await viecOnThi(d)).thi).toBeUndefined() // chỉ câu bảo vệ / chưa lập chỉ mục
  })
  it('đề thi được công bố/đóng lại ⇒ câu hết bị bảo vệ và vào on_thi ở lần lập kế hoạch sau', async () => {
    const d = await dung()
    expect(((await viecOnThi(d)).thi!.chiTiet.qid as string[])).not.toContain('BAOVE')
    d.sql.prepare("UPDATE ca SET trang_thai='dong' WHERE ma_ca='CA-SAP'").run()
    xoaDemCaBaoVe() // test sửa bảng `ca` bằng SQL thô, không qua lệnh thật ⇒ tự xoá đệm 5 giây của protectedQuestions
    expect((await viecOnThi(d)).thi).toBeUndefined() // ca đóng thì không còn "ca sắp tới"
    themCa(d, 'CA-KHAC', 40, [])
    const sau = await viecOnThi(d)
    expect((sau.thi!.chiTiet.qid as string[])).toContain('BAOVE') // ca cũ đóng ⇒ đề không còn bảo vệ
  })
})
