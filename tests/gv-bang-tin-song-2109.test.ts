// @vitest-environment node
// `POST /gv/bang-tin-song` (Bảng tin kiểu sàn giao dịch; hợp đồng docs/hop-dong-bang-tin-song-2109.md): mọi khoá của /gv/bang-tin + `song`. ĐỌC-CHỈ, cổng mã bí mật, luật KHỚP giữa các khối, nến trượt 5 phút, tia 60 phút,
// băng tin thật, dẫn đầu (tiến bộ so với CHÍNH em), đệm 10 giây (song) / 60 giây (bản 3), cờ lùi `bang_tin_san`, tên bài hiển thị (không mã kỹ thuật), ≤ 5 term UNION. SQLite thật.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gvBangTinSong, taoTinTuSu, tinhNen, tinhTia, xoaDemBangTinSong, DEM_BANG_TIN_MS, DEM_CHAM_MS, DEM_SONG_MS, type Ev } from '../server/src/gv-bang-tin-song'
import { tenBaiHienThi } from '../server/src/gv-bang-tin'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const VN = (s: string): number => Date.parse(`${s}+07:00`)
const MOC = '2026-09-21T05:00:00.000Z' // 12:00 trưa 21/09
const NOW = VN('2026-09-22T10:00:00') // thứ Ba 22/09 10:00 — mốc trước hôm nay ⇒ có "nền" ngày 21/09
beforeEach(() => { xoaDemBangTinSong(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => vi.useRealTimers())
const dat = (ms: number) => vi.setSystemTime(ms)
const goi = (d: D1That, thay = true) => goiWorker(worker, d.env, '/gv/bang-tin-song', {}, thay) as Promise<any>
let dem = 0
const sk = (d: D1That, o: { sbd: string; luc: number; kq: 0 | 1 | null; dang?: string; qid?: string }) =>
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(`k${++dem}`, o.sbd, o.qid ?? `Q${dem}`, 'on_lai', 'm', 1, o.kq, 30, new Date(o.luc).toISOString(), new Date(o.luc + 7 * 3_600_000).toISOString().slice(0, 10), o.dang ?? 'D.1')
const themHs = (d: D1That, sbd: string, hoTen: string, tenLop: string, tt: string | null = null) =>
  d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,trang_thai,mat_khau,cap_nhat_luc) VALUES(?,?,'12',?,?,'mk','x')").run(sbd, hoTen, tenLop, tt)

/** 6 em ở hai lớp + tài khoản thử + một em đã khoá; mốc 21/09 12:00. */
function truong(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bang_tin_tu',?,'x')").run(MOC)
  for (const [s, ten, lop] of [['S1', 'An', '12 - Tinh Hoa'], ['S2', 'Bình', '12 - Tinh Hoa'], ['S3', 'Chi', '12 - Tinh Hoa'], ['S4', 'Dũng', '12 - Lớp Thường'], ['S5', 'Em', '12 - Lớp Thường'], ['S6', 'Phúc', '12 - Lớp Thường']] as const) themHs(d, s, ten, lop)
  themHs(d, '12121212', 'Tài khoản thử', '12 - Lớp Thường')
  themHs(d, 'SK', 'Đã khoá', '12 - Lớp Thường', 'khoa')
  return d
}
/** Sự kiện hôm nay: S1 12 câu (10 đúng), S2 6 câu (3 đúng), S4 3 câu (1 đúng); rải từ 09:00 tới 09:55. S3, S5, S6 chưa học. Kèm rác phải bị loại. */
function ghiSuKien(d: D1That) {
  const t = (phut: number) => VN('2026-09-22T09:00:00') + phut * 60_000
  for (let i = 0; i < 12; i++) sk(d, { sbd: 'S1', luc: t(i * 2), kq: i === 3 || i === 7 ? 0 : 1 })
  for (let i = 0; i < 6; i++) sk(d, { sbd: 'S2', luc: t(1 + i * 5), kq: i % 2 === 0 ? 1 : 0 })
  for (let i = 0; i < 3; i++) sk(d, { sbd: 'S4', luc: t(40 + i), kq: i === 0 ? 1 : 0, dang: 'D.VAP' })
  sk(d, { sbd: '12121212', luc: t(5), kq: 1 }) // tài khoản thử: loại
  sk(d, { sbd: 'SK', luc: t(6), kq: 1 }) // em đã khoá: loại
  sk(d, { sbd: 'S3', luc: t(7), kq: null }) // chưa chấm: loại
  sk(d, { sbd: 'S5', luc: VN('2026-09-21T11:00:00'), kq: 1 }) // TRƯỚC mốc 12:00 21/09: loại
  sk(d, { sbd: 'S6', luc: NOW + 300_000, kq: 1 }) // TƯƠNG LAI (lệch đồng hồ): loại
}

describe('hàm thuần: nến trượt 5 phút', () => {
  const T0 = VN('2026-09-22T10:00:00') // bội của 5 phút
  const ev = (...x: [number, 0 | 1][]): Ev[] => x.map(([s, kq]) => ({ sbd: 'S1', ms: T0 + s * 1000, kq, dang: '' }))
  it('không câu nào ⇒ []', () => { expect(tinhNen([], T0)).toEqual([]) })
  it('khung đầu: mo = giá tại câu đầu, cao/thap/dong theo cửa sổ trượt 5 phút; khung yên kế tiếp giữ giá và soCau 0', () => {
    const e = ev([30, 1], [90, 1], [150, 0], [210, 1], [270, 1]) // 100, 100, 66,7, 75, 80
    const nen = tinhNen(e, T0 + 6 * 60_000)
    expect(nen).toEqual([
      { tu: T0, mo: 100, cao: 100, thap: 66.7, dong: 80, soCau: 5, soLuot: 5 },
      { tu: T0 + 300_000, mo: 80, cao: 80, thap: 75, dong: 75, soCau: 0, soLuot: 0 }, // A(T0+5') = 80; A(now) = cửa sổ (T0+60s, T0+360s] = 1,0,1,1 = 75
    ])
  })
  it('tổng soCau các nến = số sự kiện; khung trống giữa hai đợt là nến phẳng; tối đa 100 nến (cũ → mới)', () => {
    const e = ev([10, 1], [20, 0], [1500, 1], [1510, 1]) // hai đợt cách 25 phút
    const nen = tinhNen(e, T0 + 1600_000)
    expect(nen.reduce((s, n) => s + n.soCau, 0)).toBe(4)
    const trong = nen.filter((n) => n.soCau === 0)
    expect(trong.length).toBeGreaterThanOrEqual(3)
    for (const n of trong) expect(n.cao).toBeGreaterThanOrEqual(n.thap)
    const dai = tinhNen(Array.from({ length: 200 }, (_, i) => ({ sbd: 'S1', ms: T0 + i * 300_000, kq: 1 as const, dang: '' })), T0 + 200 * 300_000)
    expect(dai).toHaveLength(100)
    expect(dai[0]!.tu).toBeLessThan(dai[99]!.tu)
    for (const n of nen) expect(n.cao).toBeGreaterThanOrEqual(Math.max(n.mo, n.dong)); for (const n of nen) expect(n.thap).toBeLessThanOrEqual(Math.min(n.mo, n.dong))
  })
})

describe('hàm thuần: tia 60 phút và băng tin', () => {
  it('60 điểm, cuối = luỹ kế toàn bộ; không giảm; hs đếm em KHÁC nhau', () => {
    const T = VN('2026-09-22T10:30:00')
    const e: Ev[] = [
      { sbd: 'S1', ms: T - 90 * 60_000, kq: 1, dang: '' }, // ngoài cửa sổ 60 phút nhưng vẫn luỹ kế
      { sbd: 'S1', ms: T - 30 * 60_000, kq: 0, dang: '' },
      { sbd: 'S2', ms: T - 5 * 60_000, kq: 1, dang: '' },
    ]
    const t = tinhTia(e, T + 20_000)
    for (const k of ['hs', 'cau', 'tile'] as const) expect(t[k]).toHaveLength(60)
    expect([t.hs[59], t.cau[59], t.tile[59]]).toEqual([2, 3, 66.67])
    expect(t.cau[0]).toBe(1) // luỹ kế: câu cách 90 phút đã có ở điểm đầu
    for (let k = 1; k < 60; k++) { expect(t.cau[k]!).toBeGreaterThanOrEqual(t.cau[k - 1]!); expect(t.hs[k]!).toBeGreaterThanOrEqual(t.hs[k - 1]!) }
  })
  it('tin: vào học · đúng 5 câu liền · lớp thêm 12 câu (kèm % đúng) · dạng 3 lượt sai (mã dạng chỉ để đổi tên); cũ → mới', () => {
    const em = new Map([['S1', { hoTen: 'An', tenLop: 'Lớp A' }]])
    const ev: Ev[] = [...Array.from({ length: 12 }, (_, i) => ({ sbd: 'S1', ms: 1000 + i, kq: 1 as const, dang: '' })), ...Array.from({ length: 3 }, (_, i) => ({ sbd: 'S1', ms: 2000 + i, kq: 0 as const, dang: 'D.X' }))]
    const tin = taoTinTuSu(ev, em)
    expect(tin[0]).toMatchObject({ loai: 'cham', chu: 'An', phu: '· Lớp A · vừa vào học' })
    expect(tin.some((t) => t.loai === 'len' && t.phu === '· Lớp A · đúng 5 câu liền')).toBe(true)
    expect(tin.some((t) => t.loai === 'len' && t.phu === '· Lớp A · đúng 8 câu liền')).toBe(true)
    expect(tin.some((t) => t.loai === 'cham' && t.chu === 'Lớp A' && t.phu === '· thêm 12 câu · đúng 100 %')).toBe(true)
    expect(tin.find((t) => t.loai === 'xuong')).toMatchObject({ dang: 'D.X', phu: '· 3 lượt sai vừa qua' })
    expect(tin.map((t) => t.luc)).toEqual([...tin.map((t) => t.luc)].sort((a, b) => a - b))
  })
})

describe('/gv/bang-tin-song: khối song và luật KHỚP', () => {
  it('cổng mã bí mật; trả đủ mọi khoá của bản 3 + song; tài khoản thử / em khoá / câu chưa chấm / câu trước mốc bị loại', async () => {
    const d = truong(); ghiSuKien(d)
    expect((await goi(d, false)).ok).not.toBe(true)
    const r = await goi(d)
    expect(r.ok).toBe(true); expect(r.serverNow).toBe(NOW)
    for (const k of ['nhip', 'baiTap', 'tienBo', 'canDeY', 'dangVap', 'sucKhoe', 'song']) expect(r, k).toHaveProperty(k)
    const s = r.song
    expect(Object.keys(s).sort()).toEqual(['danDau', 'dungNhip', 'nen', 'nhiet', 'suKienMoi', 'theoLop', 'tia60', 'tongEm'])
    expect(s.tongEm).toBe(6) // 6 em (không tài khoản thử, không em khoá)
    expect(r.nhip).toMatchObject({ soCau: 21, soCauDung: 14, soEmHoc: 3, tongEm: 6, tiLeDung: 0.667 }) // 12 + 6 + 3 câu; đúng 10 + 3 + 1
  })

  it('luật KHỚP: Σ theoLop = nhip = cuối tia60; số ô nhiệt có câu = soEmHoc = Σ daHoc = cuối tia60.hs; nhiet = tongEm = Σ siSo; Σ nến.soCau = soCau', async () => {
    const d = truong(); ghiSuKien(d)
    const r = await goi(d); const s = r.song
    expect(s.theoLop.reduce((a: number, x: any) => a + x.soCau, 0)).toBe(r.nhip.soCau)
    expect(s.theoLop.reduce((a: number, x: any) => a + x.soCauDung, 0)).toBe(r.nhip.soCauDung)
    expect(s.tia60.cau[59]).toBe(r.nhip.soCau); expect(s.tia60.hs[59]).toBe(r.nhip.soEmHoc)
    expect(s.tia60.nhip).toBeNull() // khoá có mặt nhưng null (không đo được nhịp ở đây)
    expect(s.nhiet.filter((x: any) => x.soCau > 0)).toHaveLength(r.nhip.soEmHoc)
    expect(s.theoLop.reduce((a: number, x: any) => a + x.daHoc, 0)).toBe(r.nhip.soEmHoc)
    expect(s.nhiet).toHaveLength(s.tongEm)
    expect(s.theoLop.reduce((a: number, x: any) => a + x.siSo, 0)).toBe(s.tongEm)
    expect(s.nen.reduce((a: number, x: any) => a + x.soCau, 0)).toBe(r.nhip.soCau)
    expect(s.theoLop).toEqual([
      { lop: '12 - Lớp Thường', siSo: 3, daHoc: 1, soCau: 3, soCauDung: 1 },
      { lop: '12 - Tinh Hoa', siSo: 3, daHoc: 2, soCau: 18, soCauDung: 13 },
    ])
  })

  it('ô nhiệt: MỌI em (kể cả chưa học), theo lớp rồi tên; có hoTen thật và soCau/soCauDung', async () => {
    const d = truong(); ghiSuKien(d)
    const nhiet = (await goi(d)).song.nhiet
    expect(nhiet.map((x: any) => `${x.lop}|${x.hoTen}`)).toEqual([
      '12 - Lớp Thường|Dũng', '12 - Lớp Thường|Em', '12 - Lớp Thường|Phúc', '12 - Tinh Hoa|An', '12 - Tinh Hoa|Bình', '12 - Tinh Hoa|Chi',
    ])
    expect(nhiet.find((x: any) => x.sbd === 'S1')).toMatchObject({ soCau: 12, soCauDung: 10, dangVap: false })
    expect(nhiet.find((x: any) => x.sbd === 'S3')).toMatchObject({ soCau: 0, soCauDung: 0 })
  })

  it('băng tin: ≤ 20, cũ → mới, chữ soạn sẵn, KHÔNG mã dạng/qid; dạng "xuống" dùng TÊN dạng nếu tra được, không tra được ⇒ "Một dạng bài"', async () => {
    const d = truong(); ghiSuKien(d)
    const tin0 = (await goi(d)).song.suKienMoi as { luc: number; loai: string; chu: string; phu?: string }[]
    expect(tin0.find((t) => t.loai === 'xuong')).toMatchObject({ chu: 'Một dạng bài', phu: '· 3 lượt sai vừa qua' }) // S2 sai 3 lần dạng D.1, chưa có tên
    xoaDemBangTinSong()
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Tờ',1,0,'v1')").run()
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', 'QX', 'v1', 'g', 'D.1', JSON.stringify({ qid: 'QX', dang: 'D.1', tenDang: 'Phản ứng tráng bạc' }))
    const tin = (await goi(d)).song.suKienMoi as { luc: number; loai: string; chu: string; phu?: string }[]
    expect(tin.length).toBeGreaterThan(0); expect(tin.length).toBeLessThanOrEqual(20)
    expect(tin.map((t) => t.luc)).toEqual([...tin.map((t) => t.luc)].sort((a, b) => a - b))
    expect(JSON.stringify(tin)).not.toMatch(/D\.VAP|D\.1|"Q\d+"/)
    expect(tin.find((t) => t.loai === 'xuong')).toMatchObject({ chu: 'Phản ứng tráng bạc' })
    expect(tin.some((t) => t.chu === 'An' && /vừa vào học/.test(t.phu ?? ''))).toBe(true)
    expect(tin.some((t) => t.loai === 'cham' && t.chu === '12 - Tinh Hoa' && /thêm 12 câu/.test(t.phu ?? ''))).toBe(true) // lớp Tinh Hoa 18 câu ⇒ mốc 12
  })

  it('dẫn đầu: xếp theo SỐ CÂU trước, đồng số câu thì TIẾN BỘ cao hơn trước; tối đa 5 (em thứ 6 ít câu nhất bị cắt); tiến bộ âm giữ nguyên dấu', async () => {
    const d = truong()
    const t0 = VN('2026-09-22T06:00:00'), hqua = VN('2026-09-21T15:00:00')
    const lam = (sbd: string, n: number, dung: number, tu: number) => { for (let i = 0; i < n; i++) sk(d, { sbd, luc: tu + i * 60_000, kq: i < dung ? 1 : 0 }) }
    lam('S1', 20, 16, t0)               // 20 câu, không nền ⇒ 0
    lam('S2', 15, 12, t0 + 3_600_000)   // 15 câu, 80 %; nền 100 % ⇒ −20
    lam('S3', 15, 15, t0 + 7_200_000)   // 15 câu, 100 %; nền 50 % ⇒ +50
    lam('S4', 12, 6, t0 + 1_800_000)    // 12 câu
    lam('S5', 11, 11, t0 + 5_400_000)   // 11 câu
    lam('S6', 10, 10, t0 + 9_000_000)   // 10 câu ⇒ hạng 6 (bị cắt)
    lam('S2', 10, 10, hqua); lam('S3', 10, 5, hqua + 1_200_000)
    const dd = (await goi(d)).song.danDau
    expect(dd.map((x: any) => `${x.sbd}:${x.soCau}:${x.tienBo}`)).toEqual(['S1:20:0', 'S3:15:50', 'S2:15:-20', 'S4:12:0', 'S5:11:0'])
  })

  it('nền tiến bộ chỉ lấy tối đa 7 ngày trước hôm nay (dù mốc xa hơn): ngày thứ 12 trước bị bỏ, ngày thứ 4 trước tính', async () => {
    const d = truong()
    d.sql.prepare("UPDATE cau_hinh SET gia_tri = '2026-09-01T00:00:00.000Z' WHERE khoa = 'bang_tin_tu'").run()
    for (let i = 0; i < 10; i++) sk(d, { sbd: 'S1', luc: VN('2026-09-10T09:00:00') + i * 60_000, kq: 1 }) // 12 ngày trước: 100 % (bỏ)
    for (let i = 0; i < 10; i++) sk(d, { sbd: 'S1', luc: VN('2026-09-18T09:00:00') + i * 60_000, kq: i < 5 ? 1 : 0 }) // 4 ngày trước: 50 %
    for (let i = 0; i < 10; i++) sk(d, { sbd: 'S1', luc: VN('2026-09-22T08:00:00') + i * 60_000, kq: 1 }) // hôm nay 100 %
    expect((await goi(d)).song.danDau).toEqual([{ sbd: 'S1', hoTen: 'An', tenLop: '12 - Tinh Hoa', soCau: 10, tienBo: 50 }])
  })

  it('đệm nền tiến bộ THEO NGÀY: qua nửa đêm (chưa tới 10 phút) nền phải tính lại — ngày hôm qua vừa thành nền', async () => {
    const d = truong()
    for (let i = 0; i < 10; i++) sk(d, { sbd: 'S1', luc: VN('2026-09-22T20:00:00') + i * 60_000, kq: 1 })
    dat(VN('2026-09-22T23:58:00'))
    expect((await goi(d)).song.danDau).toEqual([{ sbd: 'S1', hoTen: 'An', tenLop: '12 - Tinh Hoa', soCau: 10, tienBo: 0 }]) // nền = 21/09: chưa có ⇒ 0
    for (let i = 0; i < 10; i++) sk(d, { sbd: 'S1', luc: VN('2026-09-23T00:01:00') + i * 5_000, kq: 0 })
    dat(VN('2026-09-23T00:03:00'))
    expect((await goi(d)).song.danDau).toEqual([{ sbd: 'S1', hoTen: 'An', tenLop: '12 - Tinh Hoa', soCau: 10, tienBo: -100 }]) // hôm nay 0 %, nền 22/09 100 %
  })

  it('nền tiến bộ đếm CÂU khác nhau của các ngày trước (làm lại một câu 5 lần chưa là 5 câu): hôm qua 10 lượt trên 2 câu (một câu có lần đúng) = 50 %, hôm nay 10/10 ⇒ tienBo +50, không phải +90', async () => {
    const d = truong()
    const hqua = VN('2026-09-21T15:00:00')
    for (let i = 0; i < 5; i++) sk(d, { sbd: 'S1', qid: 'A', luc: hqua + i * 60_000, kq: i === 4 ? 1 : 0 }) // A: 4 lượt sai + 1 đúng ⇒ câu A có lần đúng
    for (let i = 0; i < 5; i++) sk(d, { sbd: 'S1', qid: 'B', luc: hqua + (10 + i) * 60_000, kq: 0 })      // B: 5 lượt sai ⇒ chưa từng đúng
    for (let i = 0; i < 10; i++) sk(d, { sbd: 'S1', qid: `T${i}`, luc: VN('2026-09-22T08:00:00') + i * 60_000, kq: 1 })
    expect((await goi(d)).song.danDau).toEqual([{ sbd: 'S1', hoTen: 'An', tenLop: '12 - Tinh Hoa', soCau: 10, tienBo: 50 }])
  })

  it('băng tin chỉ giữ 20 tin MỚI NHẤT (cũ → mới): nhiều em học liên tục ⇒ tin cũ nhất bị cắt, tin mới nhất còn', async () => {
    const d = truong()
    const base = VN('2026-09-22T06:00:00')
    ;['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].forEach((sbd, k) => { for (let i = 0; i < 25; i++) sk(d, { sbd, luc: base + (k * 25 + i) * 60_000, kq: 1 }) })
    const tin = (await goi(d)).song.suKienMoi as { luc: number }[]
    expect(tin).toHaveLength(20)
    expect(tin.every((t) => t.luc > base)).toBe(true) // tin "vừa vào học" của em đầu (đúng giờ base) đã bị cắt
    expect(tin[19]!.luc).toBeGreaterThanOrEqual(base + (5 * 25 + 19) * 60_000) // mốc "đúng 20 câu liền" của em cuối
  })

  it('tin bài vừa nộp: bài đã thu hồi KHÔNG lên băng tin; bài nộp thật ghi chuyên đề; dungNhip = {soEm đúng nhịp, soCoLo em có bài}', async () => {
    const d = truong()
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('B1','Riêng','DH-12-C2-B4-TN',10,'2026-09-21T03:50:00.000Z','2026-09-22T02:00:00.000Z',0,'x',1)").run()
    const ins = d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,nop_luc,thu_hoi) VALUES(?,?,?,?,?,?)")
    ins.run('B1|S1', 'B1', 'S1', 'An', '2026-09-22T01:30:00.000Z', 0) // nộp 08:30 VN hôm nay
    ins.run('B1|S2', 'B1', 'S2', 'Bình', '2026-09-22T01:45:00.000Z', 1) // thu hồi
    ins.run('B1|S3', 'B1', 'S3', 'Chi', null, 0) // chưa nộp, bài quá hạn 09:00 VN ⇒ chậm
    d.sql.prepare("INSERT INTO btvn_cau(ma_btvn,qid,thu_tu,dang,chuyen_de,muc_do,sao,phan,loi,ghim) VALUES('B1','Q1',1,'D','Carbohydrate',0,0,'I',0,0)").run()
    const r = await goi(d)
    const tin = r.song.suKienMoi as { chu: string; phu?: string }[]
    expect(tin.filter((t) => /vừa nộp bài/.test(t.phu ?? ''))).toEqual([expect.objectContaining({ chu: 'An', phu: '· 12 - Tinh Hoa · vừa nộp bài Carbohydrate' })])
    expect(r.song.dungNhip).toEqual({ soEm: 1, soCoLo: 2 }) // An đã nộp (đúng nhịp); Chi chưa nộp quá hạn (chậm); Bình thu hồi không tính
  })

  it('nến: có ≥ 1 khung, soCau khớp; tia60 luôn 60 điểm; chưa có câu nào ⇒ nen: [] (màn ẩn khối)', async () => {
    const d = truong(); ghiSuKien(d)
    const s = (await goi(d)).song
    expect(s.nen.length).toBeGreaterThan(5)
    expect(s.nen.every((n: any) => n.cao >= n.thap && n.cao >= n.mo && n.cao >= n.dong && n.thap <= n.mo && n.thap <= n.dong)).toBe(true)
    expect(s.tia60.hs).toHaveLength(60)
    xoaDemBangTinSong()
    const trong = truong()
    const s2 = (await goi(trong)).song
    expect(s2.nen).toEqual([]); expect(s2.tia60.cau[59]).toBe(0); expect(s2.nhiet).toHaveLength(6)
  })

  it('dẫn đầu: em ≥ 10 câu hôm nay, chăm trước, ≤ 5; tienBo = điểm % so với CHÍNH em ở các ngày từ mốc (không so em khác); không có nền ⇒ 0', async () => {
    const d = truong(); ghiSuKien(d)
    // nền của S1: hôm qua 21/09 (sau mốc) làm 10 câu đúng 5 ⇒ 50 %; hôm nay 10/12 = 83 % ⇒ +33
    for (let i = 0; i < 10; i++) sk(d, { sbd: 'S1', luc: VN('2026-09-21T15:00:00') + i * 60_000, kq: i < 5 ? 1 : 0 })
    const dd = (await goi(d)).song.danDau
    expect(dd).toHaveLength(1) // chỉ S1 đạt ≥ 10 câu (S2 6 câu, S4 3 câu)
    expect(dd[0]).toEqual({ sbd: 'S1', hoTen: 'An', tenLop: '12 - Tinh Hoa', soCau: 12, tienBo: 33 })
  })

  it('mốc hiển thị TRONG ngày: câu trước mốc 12:00 bị loại, sau mốc tính; chưa có ngày nào từ mốc tới hôm qua ⇒ tienBo 0', async () => {
    const d = truong()
    dat(VN('2026-09-21T15:00:00'))
    for (let i = 0; i < 10; i++) sk(d, { sbd: 'S1', luc: VN('2026-09-21T11:00:00') + i * 60_000, kq: 1 }) // trước mốc
    for (let i = 0; i < 10; i++) sk(d, { sbd: 'S2', luc: VN('2026-09-21T12:30:00') + i * 60_000, kq: i < 7 ? 1 : 0 }) // sau mốc
    const r = await goi(d)
    expect(r.nhip).toMatchObject({ soCau: 10, soCauDung: 7, soEmHoc: 1 })
    expect(r.song.danDau).toEqual([{ sbd: 'S2', hoTen: 'Bình', tenLop: '12 - Tinh Hoa', soCau: 10, tienBo: 0 }])
    expect(r.song.nen.reduce((a: number, x: any) => a + x.soCau, 0)).toBe(10)
  })
})

describe('MỘT định nghĩa "câu": câu khác nhau, không phải lượt (cau-da-lam.ts)', () => {
  const ev = (...x: [string, string, number, 0 | 1][]): Ev[] => x.map(([sbd, qid, s, kq]) => ({ sbd, qid, ms: VN('2026-09-22T09:00:00') + s * 1000, kq, dang: '' }))
  it('hàm thuần: làm lại một câu ⇒ nến.soCau đếm MỘT lần (soLuot đếm mọi lượt), tia cuối = câu khác nhau, tỉ lệ = câu có ≥ 1 lần đúng / câu', () => {
    const e = ev(['S1', 'A', 5, 0], ['S1', 'A', 20, 0], ['S1', 'A', 35, 1], ['S1', 'B', 50, 1], ['S2', 'A', 65, 1]) // S1 làm A 3 lần (sai, sai, đúng) + B; S2 làm A
    const nen = tinhNen(e, VN('2026-09-22T09:02:00'))
    expect(nen.reduce((a, n) => a + n.soCau, 0)).toBe(3)   // (S1,A) (S1,B) (S2,A)
    expect(nen.reduce((a, n) => a + n.soLuot, 0)).toBe(5)
    const t = tinhTia(e, VN('2026-09-22T09:02:00'))
    expect([t.hs[59], t.cau[59], t.tile[59]]).toEqual([2, 3, 100]) // 3 câu, cả 3 có lần đúng ⇒ 100 %
  })
  it('chuỗi "đúng N câu liền" và "lớp thêm 12 câu" chỉ nuôi bởi câu MỚI: đúng 10 lần cùng một câu không ra "đúng 5 câu liền"', () => {
    const em = new Map([['S1', { hoTen: 'An', tenLop: 'Lớp A' }]])
    const lapLai = taoTinTuSu(Array.from({ length: 30 }, (_, i) => ({ sbd: 'S1', qid: 'A', ms: 1000 + i, kq: 1 as const, dang: '' })), em)
    expect(lapLai.filter((t) => /câu liền|thêm 12 câu/.test(t.phu ?? ''))).toEqual([])
    const khacNhau = taoTinTuSu(Array.from({ length: 5 }, (_, i) => ({ sbd: 'S1', qid: `Q${i}`, ms: 1000 + i, kq: 1 as const, dang: '' })), em)
    expect(khacNhau.some((t) => t.phu === '· Lớp A · đúng 5 câu liền')).toBe(true)
  })
  it('/gv/bang-tin-song: em làm lại một câu nhiều lần ⇒ soCau (nhip · theoLop · nhiet · tia · dẫn đầu) đều đếm câu khác nhau, luật KHỚP vẫn đúng; lượt làm lại chỉ ở nến.soLuot', async () => {
    const d = truong()
    const t = (phut: number) => VN('2026-09-22T09:00:00') + phut * 60_000
    for (let i = 0; i < 10; i++) sk(d, { sbd: 'S1', qid: `Q${i}`, luc: t(i), kq: 1 })                 // 10 câu khác nhau ⇒ vào Dẫn đầu (≥ 10)
    for (let i = 0; i < 20; i++) sk(d, { sbd: 'S1', qid: 'Q0', luc: t(20 + i), kq: i % 2 as 0 | 1 })  // làm lại Q0 20 lần
    sk(d, { sbd: 'S2', qid: 'Q0', luc: t(2), kq: 0 })                                                // S2: một câu, sai
    sk(d, { sbd: 'S2', qid: 'Q0', luc: t(3), kq: null })                                             // chưa chấm: bỏ
    const r = await goi(d); const s = r.song
    expect(r.nhip).toMatchObject({ soCau: 11, soCauDung: 10, soEmHoc: 2, tiLeDung: 0.909 })         // 10 + 1 câu; đúng: S1 10 (Q0 có lần đúng), S2 0
    expect(s.nhiet.find((x: any) => x.sbd === 'S1')).toMatchObject({ soCau: 10, soCauDung: 10 })
    expect(s.theoLop.reduce((a: number, x: any) => a + x.soCau, 0)).toBe(11)
    expect(s.tia60.cau[59]).toBe(11)
    expect(s.tia60.tile[59]).toBe(90.91)
    expect(s.nen.reduce((a: number, x: any) => a + x.soCau, 0)).toBe(11)
    expect(s.nen.reduce((a: number, x: any) => a + x.soLuot, 0)).toBe(31)                            // 10 + 20 + 1 lượt
    expect(s.danDau).toEqual([{ sbd: 'S1', hoTen: 'An', tenLop: '12 - Tinh Hoa', soCau: 10, tienBo: 0 }])
  })
})

describe('đệm 10 giây (song) / 60 giây (bản 3)', () => {
  it('lần 2 trong 10 giây: không truy vấn nào; sau 10 giây: chỉ tính lại phần song (bản 3 còn đệm) và số mới hiện; sau 60 giây: tính lại cả hai', async () => {
    const d = truong(); ghiSuKien(d)
    const cauLenh: string[] = []
    const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => { cauLenh.push(q); return goc(q) }) as typeof d.env.DB.prepare
    const a = await goi(d)
    expect(a.dem).toEqual({ bangTin: false, song: false })
    const soLenhA = cauLenh.length
    expect(soLenhA).toBeGreaterThan(12)
    dat(NOW + 5_000)
    const b = await goi(d)
    expect(b.dem).toEqual({ bangTin: true, song: true }); expect(b.soTruyVan).toBe(0)
    // chỉ truy vấn cấu hình của route (cờ `bang_tin_san`); cổng đóng băng của reset nay ĐỆM 30 giây (SỬA CÓ CHỦ Ý 21/09 hạ tải D1: 3 s → 30 s) nên lượt thứ hai trong 5 giây không đọc lại; KHÔNG đọc sổ học / bảng nào khác
    const them = cauLenh.slice(soLenhA)
    expect(them).toHaveLength(1)
    expect(them.every((q) => /FROM cau_hinh/.test(q))).toBe(true)
    // câu mới ghi: sau 10 giây phần song đọc lại, số nhip GHI ĐÈ bằng số mới dù bản 3 còn đệm
    sk(d, { sbd: 'S3', luc: NOW + 6_000, kq: 1 })
    dat(NOW + DEM_SONG_MS + 1_000)
    const c = await goi(d)
    expect(c.dem).toEqual({ bangTin: true, song: false })
    expect(c.nhip.soCau).toBe(22); expect(c.song.tia60.cau[59]).toBe(22); expect(c.nhip.soEmHoc).toBe(4)
    expect(c.soTruyVan).toBe(2) // chỉ sự kiện hôm nay + bài vừa nộp: danh sách em, nền tiến bộ, tên dạng còn đệm
    dat(NOW + DEM_BANG_TIN_MS + 1_000)
    const e = await goi(d)
    expect(e.dem).toEqual({ bangTin: false, song: false })
    expect(e.soTruyVan).toBe(a.soTruyVan - 2) // như lần đầu trừ nền tiến bộ và tên dạng (còn đệm 10 phút)
    dat(NOW + DEM_CHAM_MS + 1_000)
    expect((await goi(d)).soTruyVan).toBe(a.soTruyVan) // hết đệm 10 phút: nền tiến bộ + tên dạng đọc lại như lần đầu
  })

  it('phần song đệm còn mới nhưng bản 3 vừa HẾT hạn ⇒ tính lại cả hai (số bản 3 và song luôn cùng một lượt)', async () => {
    const d = truong(); ghiSuKien(d)
    await goi(d)                                  // t0: cả hai tính
    dat(NOW + 55_000); expect((await goi(d)).dem).toEqual({ bangTin: true, song: false }) // t0+55 s: song hết hạn, bản 3 còn
    dat(NOW + 61_000); expect((await goi(d)).dem).toEqual({ bangTin: false, song: false }) // t0+61 s: bản 3 hết hạn dù song mới 6 s
  })
})

describe('cờ lùi, chỉ đọc, giới hạn D1', () => {
  it("cau_hinh.bang_tin_san = 'tat' ⇒ {ok:false, lyDo:'tat'} (máy thầy dùng bản 3)", async () => {
    const d = truong()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bang_tin_san','tat','x')").run()
    expect(await goi(d)).toMatchObject({ ok: false, lyDo: 'tat' })
  })

  it('KHÔNG ghi một byte; mỗi truy vấn của phần song ≤ 5 term (chốt của D1 giả) và chỉ SELECT', async () => {
    const d = truong(); ghiSuKien(d)
    const ghi: string[] = []
    const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => { if (/^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(q)) ghi.push(q.trim().slice(0, 60)); return goc(q) }) as typeof d.env.DB.prepare
    const r = await gvBangTinSong(d.env, {}, NOW, { dem: false })
    expect(r.ok).toBe(true)
    expect(ghi).toEqual([])
  })

  it('phần song lỗi (thiếu bảng btvn_cau) ⇒ vẫn trả bản 3, các khối trực tiếp vẫn có (bài nộp lỗi chỉ mất dòng tin nộp bài)', async () => {
    const d = truong(); ghiSuKien(d); d.sql.exec('DROP TABLE btvn_cau')
    const r = await goi(d)
    expect(r.ok).toBe(true)
    expect(r.song.nhiet).toHaveLength(6)
  })
})

describe('tên bài hiển thị (không mã kỹ thuật)', () => {
  it('tenBaiHienThi: chuyên đề trội nhất → tên ca/tờ nếu không phải mã → "Bài tập về nhà"; kèm lớp', () => {
    expect(tenBaiHienThi('Carbohydrate', 'DH-12-C2-B4-TN,DH-12-C2-B4-DS', '12 - Tinh Hoa')).toBe('Carbohydrate · 12 - Tinh Hoa')
    expect(tenBaiHienThi('', 'Este – Lipid', '12 - Lớp Thường')).toBe('Este – Lipid · 12 - Lớp Thường')
    expect(tenBaiHienThi('', 'DH-12-C2-B4-TN,DH-12-C2-B4-DS,DH-12-C2-B4-TLN')).toBe('Bài tập về nhà')
    expect(tenBaiHienThi('', 'DH-10-C2-B5-TN')).toBe('Bài tập về nhà')
    expect(tenBaiHienThi('', '')).toBe('Bài tập về nhà')
    expect(tenBaiHienThi('', 'DE1', 'Lớp')).toBe('DE1 · Lớp') // tên ngắn không phải mã kỹ thuật
  })

  it('/gv/bang-tin-song: baiTap[].ten là CHUYÊN ĐỀ + lớp (btvn_cau), tenGoc giữ mã; danh sách "em chưa mở bài" dùng tên hiển thị', async () => {
    const d = truong()
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('B1','Riêng','DH-12-C2-B4-TN,DH-12-C2-B4-DS',10,'2026-09-21T03:50:00.000Z','2026-09-25T05:00:00.000Z',0,'x',1)").run()
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('B1|S1','B1','S1','An')").run()
    const ins = d.sql.prepare("INSERT INTO btvn_cau(ma_btvn,qid,thu_tu,dang,chuyen_de,muc_do,sao,phan,loi,ghim) VALUES('B1',?,?,'D',?,0,0,'I',0,0)")
    ;[['Q1', 'Carbohydrate'], ['Q2', 'Carbohydrate'], ['Q3', 'Polime']].forEach(([q, cd], i) => ins.run(q, i + 1, cd))
    const bai = (await goi(d)).baiTap
    expect(bai).toHaveLength(1)
    expect(bai[0]).toMatchObject({ maBtvn: 'B1', ten: 'Carbohydrate · 12 - Tinh Hoa', tenGoc: 'DH-12-C2-B4-TN,DH-12-C2-B4-DS' })
    expect(JSON.stringify(bai[0])).not.toMatch(/"ten":"DH-/)
  })
})
