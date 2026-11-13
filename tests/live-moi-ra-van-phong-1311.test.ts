// @vitest-environment node
// SỔ «MỜI RA KHỎI LỚP» cho văn phòng trực live (thầy 13/11, yêu cầu của Javis DDH: «app cần ghi lại mỗi lần một em bị mời ra và mở một đường cho văn phòng
// đọc»). Ghim: luật xếp việc chờ ghi (mời ra / từ chối / cho vào lại / tắt luật) · phòng ghi D1 không nhân đôi · `/gv/bpu/moi-ra` cần mã GV, đọc theo mốc
// `sau`, chưa có bảng ⇒ rỗng · không lộ gì ngoài tên, lớp, giờ, số lần. Hợp đồng: docs/hop-dong-live-moi-ra-van-phong-1311.md.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { ghiMoiRa, gvLiveMoiRa, gvLiveThongKe, tenGoiTheoBuoi } from '../server/src/live-moi-ra'
import { liveBat, liveDat } from '../src/lib/bpu/phong-live'
import { datLuat, layChoGhiLuat, luatDuyet } from '../src/lib/bpu/phong-luat'
import { roiMan, taoPhong, vaoLop, veMan, type TrangThaiPhong } from '../src/lib/bpu/phong'

const NAY = Date.parse('2026-11-13T12:30:00Z') // 19:30 giờ Việt Nam
function phong(): TrangThaiPhong {
  const st = taoPhong({ buoiId: 'b1', lop: 'Live Khối 10', nay: NAY, ds: [{ sbd: 'S1', ten: 'Gia Bảo', coMat: true, luc: 1 }, { sbd: 'S2', ten: 'Minh Khôi', coMat: true, luc: 1 }] })
  vaoLop(st, 'S1', NAY); vaoLop(st, 'S2', NAY)
  st.live = { cho: true, sfu: false, san: false, bat: false, tu: null, phien: 0, ss: null, tay: [], noi: [], xa: false, tiengLop: true, soNet: 0, nhip: 0 }
  liveBat(st, NAY); liveDat(st, { khoi: { k: 10, gd: 'dang', che: 'bang' } }, NAY)
  return st
}
const roiVe = (st: TrangThaiPhong, sbd: string, lan: number, tu: number) => { for (let i = 0; i < lan; i++) { roiMan(st, sbd, tu + i * 100); veMan(st, sbd, tu + i * 100 + 50) } }
function moi() {
  const d = taoD1That()
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, mat_khau, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', 'Trần Gia Bảo', '10', 'mk123456', 'x')
  return { d, env: d.env as unknown as Env }
}
const BUOI = { buoiId: 'b1', phong: 'Live Khối 10', khoi: 10, ten: (s: string) => (s === 'S1' ? 'Gia Bảo' : 'Minh Khôi') }

describe('luật rời màn — việc chờ ghi sổ', () => {
  it('mời ra, từ chối, cho vào lại, tắt luật lúc còn em chờ ⇒ mỗi việc một dòng; lấy ra là hết', () => {
    const st = phong()
    datLuat(st, { bat: true, n: 2 }, NAY)
    expect(layChoGhiLuat(st)).toEqual([{ loai: 'bat', sbd: '', luc: NAY, n: 2 }]) // thầy vừa bật luật ⇒ văn phòng biết buổi này có luật
    datLuat(st, { bat: true, n: 2 }, NAY + 1); expect(layChoGhiLuat(st)).toEqual([]) // bật lại y nguyên: không ghi thêm
    roiVe(st, 'S1', 1, NAY + 1000)
    expect(layChoGhiLuat(st)).toEqual([]) // mới bị nhắc: chưa có gì để báo phụ huynh
    roiVe(st, 'S1', 1, NAY + 2000)
    expect(layChoGhiLuat(st)).toEqual([{ loai: 'ra', sbd: 'S1', luc: NAY + 2000, lan: 2, n: 2 }])
    expect(layChoGhiLuat(st)).toEqual([])
    luatDuyet(st, 'S1', false, NAY + 3000); luatDuyet(st, 'S1', true, NAY + 4000)
    expect(layChoGhiLuat(st)).toEqual([{ loai: 'tu', sbd: 'S1', luc: NAY + 3000 }, { loai: 'vao', sbd: 'S1', luc: NAY + 4000 }])
    roiVe(st, 'S2', 2, NAY + 5000); layChoGhiLuat(st)
    datLuat(st, { bat: false }, NAY + 6000) // tắt luật: em đang chờ được vào lại ⇒ văn phòng cũng biết
    expect(layChoGhiLuat(st)).toEqual([{ loai: 'vao', sbd: 'S2', luc: NAY + 6000 }, { loai: 'tat', sbd: '', luc: NAY + 6000, n: 2 }])
  })
})

describe('/gv/bpu/moi-ra — văn phòng đọc sổ', () => {
  it('chưa có bảng ⇒ rỗng; cần mã GV', async () => {
    const { env } = moi()
    expect(await gvLiveMoiRa(env, {}, NAY)).toEqual({ ok: true, ds: [], moc: 0 })
    const khongMa = await goiWorker(worker, env, '/gv/bpu/moi-ra', {}, false)
    expect(khongMa.ok).toBe(false); expect(khongMa).not.toHaveProperty('ds')
    expect(await goiWorker(worker, env, '/gv/bpu/moi-ra', {}, true)).toMatchObject({ ok: true, ds: [], moc: 0 })
  })
  it('ghi không nhân đôi; đọc theo mốc `sau`; tên theo hồ sơ học sinh, giờ Việt Nam', async () => {
    const { env } = moi()
    const sk = [{ loai: 'ra' as const, sbd: 'S1', luc: NAY, lan: 3, n: 3 }, { loai: 'ra' as const, sbd: 'S2', luc: NAY + 60_000, lan: 3, n: 3 }]
    expect(await ghiMoiRa(env, BUOI, sk)).toBe(2)
    await ghiMoiRa(env, BUOI, sk) // phòng gọi lại (thử lại sau lỗi mạng) ⇒ không thêm dòng
    const l1 = await gvLiveMoiRa(env, {}, NAY + 120_000) as { ds: Record<string, unknown>[]; moc: number }
    expect(l1.ds).toHaveLength(2)
    expect(l1.ds[0]).toEqual({ stt: 1, loai: 'ra', sbd: 'S1', ten: 'Trần Gia Bảo', lop: '10', lan: 3, n: 3, luc: NAY, gio: '19:30', ngay: '2026-11-13', buoiId: 'b1', phong: 'Live Khối 10', khoi: 10 })
    expect(l1.ds[1]).toMatchObject({ sbd: 'S2', ten: 'Minh Khôi', lop: '', gio: '19:31' }) // em không có hồ sơ: dùng tên trong phòng
    expect(l1.moc).toBe(l1.ds[1]!.stt)
    expect(await gvLiveMoiRa(env, { sau: l1.moc }, NAY + 120_000)).toEqual({ ok: true, ds: [], moc: l1.moc })
    await ghiMoiRa(env, BUOI, [{ loai: 'tu', sbd: 'S1', luc: NAY + 90_000 }])
    const l2 = await gvLiveMoiRa(env, { sau: l1.moc }, NAY + 120_000) as { ds: Record<string, unknown>[]; moc: number }
    expect(l2.ds).toMatchObject([{ loai: 'tu', sbd: 'S1', lan: 0 }]); expect(l2.moc).toBeGreaterThan(l1.moc)
    // lần đầu (sau = 0) chỉ lấy 24 giờ gần nhất; lọc theo buổi; trần số dòng
    expect((await gvLiveMoiRa(env, {}, NAY + 2 * 86_400_000) as { ds: unknown[] }).ds).toEqual([])
    expect((await gvLiveMoiRa(env, { buoiId: 'khac' }, NAY + 120_000) as { ds: unknown[] }).ds).toEqual([])
    expect((await gvLiveMoiRa(env, { toiDa: 1 }, NAY + 120_000) as { ds: unknown[] }).ds).toHaveLength(1)
  })
})

describe('/gv/bpu/live-thong-ke — số liệu cho tin kết thúc buổi của văn phòng', () => {
  const themBuoi = (d: ReturnType<typeof taoD1That>, id: string, lop: string, mo: string) => d.sql.prepare('INSERT INTO buoi_hoc (id, ten, lop, bi_mat, mo_luc, het_han, dong_luc, cap_nhat_luc) VALUES (?,?,?,?,?,?,?,?)').run(id, `Live · ${id}`, lop, 'x', mo, mo, null, mo)
  const themEm = (d: ReturnType<typeof taoD1That>, sbd: string, ten: string, lop: string) => d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, mat_khau, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, ten, lop, 'mk123456', 'x')
  // phòng giả: S1 vào, rời 3 lần; S2 vào, không rời; S7 có tên trong phòng nhưng chưa bấm tham gia
  const phongGia = async () => ({ ok: true, phong: 'Live Khối 10', ketThuc: true, dangLive: false, em: [['S1', 'Gia Bảo', 1, 3], ['S2', 'Minh Khôi', 1, 0], ['S7', 'Em chưa vào', 0, 0]] })
  it('có mặt, vắng (em của khối không vào live), số lần rời màn, em bị mời ra kèm việc xảy ra sau đó', async () => {
    const { d, env } = moi() // đã có S1 lớp 10
    themEm(d, 'S2', 'Lê Minh Khôi', '10'); themEm(d, 'S3', 'Phạm Thu Hà', '10'); themEm(d, 'S9', 'Em Khối Khác', '11')
    themBuoi(d, 'b1', 'Live Khối 10', '2026-11-13T12:00:00.000Z')
    await ghiMoiRa(env, BUOI, [{ loai: 'ra', sbd: 'S1', luc: NAY, lan: 3, n: 3 }, { loai: 'tu', sbd: 'S1', luc: NAY + 60_000 }])
    const r = await gvLiveThongKe(env, { buoiId: 'b1' }, phongGia) as Record<string, any>
    expect(r).toMatchObject({ ok: true, buoiId: 'b1', khoi: 10, coPhong: true, ketThuc: true, siSo: 3, soCoMat: 2, soVang: 1, luat: { daBat: true } })
    expect(r.coMat).toEqual([{ sbd: 'S1', ten: 'Trần Gia Bảo', tenGoi: 'Bảo', lop: '10', roi: 3 }, { sbd: 'S2', ten: 'Lê Minh Khôi', tenGoi: 'Khôi', lop: '10', roi: 0 }])
    expect(r.roiMan).toEqual([{ sbd: 'S1', ten: 'Trần Gia Bảo', tenGoi: 'Bảo', lop: '10', lan: 3 }])
    expect(r.vang).toEqual([{ sbd: 'S3', ten: 'Phạm Thu Hà', lop: '10', tenGoi: 'Hà' }]) // em khối 11 không tính; S7 chưa bấm tham gia không có hồ sơ khối 10 ⇒ không tính
    expect(r.moiRa).toEqual([{ sbd: 'S1', ten: 'Trần Gia Bảo', lop: '10', soLan: 1, lan: 3, gio: '19:30', trangThai: 'tu-choi', tenGoi: 'Bảo' }])
  })
  it('bỏ buoiId ⇒ buổi live mở gần nhất; phòng không trả lời ⇒ vẫn trả sĩ số và sổ mời ra; chưa có buổi ⇒ báo rõ; cần mã GV', async () => {
    const { d, env } = moi()
    expect(await gvLiveThongKe(env, {}, phongGia)).toMatchObject({ ok: false, lyDo: 'khong-co-buoi' })
    themBuoi(d, 'cu', 'Live Khối 12', '2026-11-10T12:00:00.000Z'); themBuoi(d, 'moi', 'Live Khối 10', '2026-11-13T12:00:00.000Z'); themBuoi(d, 'lop-thuong', '12A', '2026-11-14T12:00:00.000Z')
    const r = await gvLiveThongKe(env, {}, async () => ({ ok: false })) as Record<string, any>
    expect(r).toMatchObject({ ok: true, buoiId: 'moi', khoi: 10, coPhong: false, soCoMat: 0, soVang: 1, moiRa: [], luat: { daBat: false, dangBat: false } }) // buổi không bật luật ⇒ văn phòng không nhắn nhóm về rời màn
    await ghiMoiRa(env, { ...BUOI, buoiId: 'moi' }, [{ loai: 'bat', sbd: '', luc: NAY, n: 3 }])
    expect((await gvLiveThongKe(env, { buoiId: 'moi' }, async () => ({ ok: false })) as Record<string, any>).luat).toEqual({ bat: true, daBat: true, dangBat: true, n: 3, batLuc: '19:30' })
    await ghiMoiRa(env, { ...BUOI, buoiId: 'moi' }, [{ loai: 'tat', sbd: '', luc: NAY + 60_000, n: 3 }])
    expect((await gvLiveThongKe(env, { buoiId: 'moi' }, async () => ({ ok: false })) as Record<string, any>).luat).toMatchObject({ bat: false, daBat: true, dangBat: false })
    // (Javis 13/11 «chỉ cần thêm một trường: luat: { bat, n }») phòng đang mở trả lời ⇒ nút luật theo PHÒNG: đang bật 5 lần ⇒ bat true, n 5; phòng báo 0 ⇒ bat false
    expect((await gvLiveThongKe(env, { buoiId: 'moi' }, async () => ({ ok: true, dangLive: true, luat: 5, em: [] })) as Record<string, any>).luat).toMatchObject({ bat: true, dangBat: true, daBat: true, n: 5 })
    expect((await gvLiveThongKe(env, { buoiId: 'moi' }, async () => ({ ok: true, dangLive: true, luat: 0, em: [] })) as Record<string, any>).luat).toMatchObject({ bat: false, dangBat: false, daBat: true })
    expect((await goiWorker(worker, env, '/gv/bpu/live-thong-ke', {}, false)).ok).toBe(false)
    expect(await goiWorker(worker, env, '/gv/bpu/live-thong-ke', { buoiId: 'moi' }, true)).toMatchObject({ ok: true, buoiId: 'moi', coPhong: false })
  })
})

describe('tên gọi trong tin của văn phòng', () => {
  it('chữ cuối của họ tên; trùng tên gọi ⇒ thêm tên đệm; vẫn trùng ⇒ cả họ tên', () => {
    const m = tenGoiTheoBuoi(['Nguyễn Thị Hà', 'Trần Quang', 'Lê Lan Anh', 'Phạm Minh Anh', 'Đỗ Minh Anh', '  Vũ   Ngọc  ', ''])
    expect(m.get('Nguyễn Thị Hà')).toBe('Hà'); expect(m.get('Trần Quang')).toBe('Quang'); expect(m.get('Vũ   Ngọc')).toBe('Ngọc')
    expect(m.get('Lê Lan Anh')).toBe('Lan Anh')
    expect(m.get('Phạm Minh Anh')).toBe('Phạm Minh Anh'); expect(m.get('Đỗ Minh Anh')).toBe('Đỗ Minh Anh')
  })
})
