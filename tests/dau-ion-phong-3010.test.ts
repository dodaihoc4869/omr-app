// @vitest-environment node
// «ĐẤU ION» · PHÒNG ĐẤU (Durable Object `PhongDauIon`, luật ở server/src/dau-ion-phong.ts) + VÉ + CÔNG TẮC.
// Khoá: ai thấy ai (không lộ số báo danh), thách theo SBD trả lời giống nhau dù có hay không, đấu nhanh ghép đôi, nhóm theo mã,
// trận chạy theo nhịp và gửi ảnh nhị phân kèm ack từng em, rớt mạng giữ ghế rồi xử thua, chống dội gói, thầy bắt đầu ⇒ đóng hết,
// phòng ngủ được khi hết việc; vé ký đúng ca, hết hạn, sai chữ ký; tắt bằng TAT_DAU_ION; 0 lệnh D1.
import { describe, expect, it, vi } from 'vitest'
import { CHU_DA_MOI, GIAY_CHO_NOI_LAI, MA_DONG, PhongDau, TRAN_KET_NOI, type KetNoi } from '../server/src/dau-ion-phong'
import { HAN_VE_MS, kiemVeDau, kyVeDau, tenGoi, vaoPhongDau, veDauChoEm } from '../server/src/dau-ion-ve'
import { BUOC, LUAT } from '../src/lib/dau-ion/loi'
import { docAnh, maYDinh } from '../src/lib/dau-ion/goi'
import type { Env } from '../server/src/kieu'

interface KnGia extends KetNoi { tin: Record<string, unknown>[]; anh: Uint8Array[]; dongMa: number | null; kem: unknown }
function kn(): KnGia {
  const k: KnGia = {
    tin: [], anh: [], dongMa: null, kem: null,
    gui(d) { if (typeof d === 'string') k.tin.push(JSON.parse(d)); else k.anh.push(d) },
    dong(ma) { k.dongMa = ma },
    ghiKem(v) { k.kem = v },
  }
  return k
}
const ve = (s: string, t = `Bạn ${s}`) => ({ c: '123456', s, t, h: Date.now() + 60_000 })
const cuoi = (k: KnGia, t: string) => [...k.tin].reverse().find((m) => m.t === t)
function phong() {
  let nay = 1_000_000
  const p = new PhongDau(() => nay, () => 0.5)
  return { p, tien: (ms: number) => { nay += ms }, bayGio: () => nay }
}

describe('Phòng đấu · sảnh', () => {
  it('vào sảnh: chào kèm danh sách; người khác chỉ thấy số thứ tự + tên gọi, KHÔNG thấy số báo danh', () => {
    const { p } = phong()
    const a = kn(), b = kn()
    p.vao(a, ve('11111', 'Minh Anh'), 0, false, false)
    p.vao(b, ve('22222', 'Quốc Bảo'), 1, false, false)
    const chao = cuoi(b, 'chao')!
    expect(chao.toi).toBe(2)
    expect(JSON.stringify(b.tin)).not.toContain('11111')
    expect(JSON.stringify(a.tin)).not.toContain('22222')
    expect(cuoi(a, 's')!.d).toEqual([2, 'Quốc Bảo', 1, 'ranh'])
    expect(a.kem).toMatchObject({ id: 1, s: '11111' }) // dữ liệu gắn trên kết nối (sống qua lúc phòng ngủ) — chỉ phòng đọc
  })

  it('Ẩn tên ⇒ bạn thấy «Bạn <nguyên tố>»; cùng SBD mở máy khác ⇒ kết nối cũ đóng 4002, giữ nguyên số thứ tự', () => {
    const { p } = phong()
    const a = kn(), b = kn(), a2 = kn()
    p.vao(a, ve('11111', 'Minh Anh'), 3, true, false)
    p.vao(b, ve('22222'), 0, false, false)
    expect(cuoi(b, 'chao')!.ds).toContainEqual([1, 'Bạn Cl', 3, 'ranh'])
    p.vao(a2, ve('11111', 'Minh Anh'), 3, true, false)
    expect(a.dongMa).toBe(MA_DONG.thayMay)
    expect(cuoi(a2, 'chao')!.toi).toBe(1)
    expect(p.soNguoi).toBe(2)
  })

  it('đầy sảnh ⇒ đóng 4009', () => {
    const { p } = phong()
    for (let i = 0; i < TRAN_KET_NOI; i++) p.vao(kn(), ve(`S${i}`), 0, false, false)
    const thua = kn()
    expect(p.vao(thua, ve('THUA'), 0, false, false)).toBeNull()
    expect(thua.dongMa).toBe(MA_DONG.day)
  })

  it('thách theo SBD: trả lời GIỐNG NHAU dù SBD có trong phòng hay không; bạn nhận lời ⇒ trận 1–1 bắt đầu', () => {
    const { p } = phong()
    const a = kn(), b = kn()
    p.vao(a, ve('11111', 'Minh Anh'), 0, false, false)
    p.vao(b, ve('22222', 'Quốc Bảo'), 1, false, false)
    p.nhan(a, JSON.stringify({ t: 'thach', sbd: '99999' }))
    p.nhan(a, JSON.stringify({ t: 'thach', sbd: '22222' }))
    const tinA = a.tin.filter((m) => m.t === 'tin').map((m) => m.chu)
    expect(tinA).toEqual([CHU_DA_MOI, CHU_DA_MOI])
    const moi = cuoi(b, 'moi')!
    expect(moi).toMatchObject({ tu: 1, ten: 'Minh Anh', con: 20 })
    p.nhan(b, JSON.stringify({ t: 'nhan', tu: 1 }))
    expect(p.soTran).toBe(1)
    expect(cuoi(a, 'tran')).toMatchObject({ kieu: 'doi', toi: 1, giay: LUAT.doi.giay, ghe: [[1, 'Minh Anh', 0], [2, 'Quốc Bảo', 1]] })
  })

  it('«Không nhận lời thách» ⇒ không gửi lời mời; lời mời hết hạn sau 20 giây', () => {
    const { p, tien } = phong()
    const a = kn(), b = kn(), c = kn()
    p.vao(a, ve('1'), 0, false, false); p.vao(b, ve('2'), 0, false, true); p.vao(c, ve('3'), 0, false, false)
    p.nhan(a, JSON.stringify({ t: 'thach', den: 2 }))
    expect(cuoi(b, 'moi')).toBeUndefined()
    p.nhan(a, JSON.stringify({ t: 'thach', den: 3 }))
    tien(21_000); p.buoc()
    p.nhan(c, JSON.stringify({ t: 'nhan', tu: 1 }))
    expect(p.soTran).toBe(0)
    expect(cuoi(c, 'tin')!.chu).toBe('Lời thách đã hết hạn.')
  })

  it('thách quá 5 lần/phút ⇒ chặn; hai bạn thách nhau ⇒ vào trận luôn', () => {
    const { p } = phong()
    const a = kn(), b = kn()
    p.vao(a, ve('1'), 0, false, false); p.vao(b, ve('2'), 0, false, false)
    for (let i = 0; i < 6; i++) p.nhan(a, JSON.stringify({ t: 'thach', sbd: 'x' + i }))
    expect(cuoi(a, 'tin')!.chu).toMatch(/thách nhiều quá/)
    p.nhan(b, JSON.stringify({ t: 'thach', den: 1 }))
    expect(cuoi(a, 'moi')).toBeTruthy()
    const { p: q } = phong()
    const x = kn(), y = kn()
    q.vao(x, ve('1'), 0, false, false); q.vao(y, ve('2'), 0, false, false)
    q.nhan(x, JSON.stringify({ t: 'thach', den: 2 })); q.nhan(y, JSON.stringify({ t: 'thach', den: 1 }))
    expect(q.soTran).toBe(1)
  })

  it('đấu nhanh: người thứ nhất vào hàng (phòng phải thức), người thứ hai ghép ngay', () => {
    const { p } = phong()
    const a = kn(), b = kn()
    p.vao(a, ve('1'), 0, false, false); p.vao(b, ve('2'), 0, false, false)
    expect(p.canThuc()).toBe(false)
    p.nhan(a, JSON.stringify({ t: 'nhanh' }))
    expect(cuoi(b, 's')!.d).toEqual([1, 'Bạn 1', 0, 'tim'])
    expect(p.canThuc()).toBe(true)
    p.nhan(b, JSON.stringify({ t: 'nhanh' }))
    expect(p.soTran).toBe(1)
  })

  it('nhóm theo mã 2 chữ số: tạo, vào, đủ 3 ⇒ trận nhóm; mã sai ⇒ báo lỗi', () => {
    const { p } = phong()
    const [a, b, c, d] = [kn(), kn(), kn(), kn()]
    ;[a, b, c, d].forEach((k, i) => p.vao(k, ve(String(i + 1)), i, false, false))
    p.nhan(a, JSON.stringify({ t: 'nhom-tao' }))
    const ma = cuoi(a, 'nhom')!.ma as number
    expect(ma).toBeGreaterThanOrEqual(10); expect(ma).toBeLessThan(100)
    p.nhan(b, JSON.stringify({ t: 'nhom-vao', ma })); p.nhan(c, JSON.stringify({ t: 'nhom-vao', ma }))
    p.nhan(d, JSON.stringify({ t: 'nhom-vao', ma: ma === 99 ? 98 : ma + 1 }))
    expect(cuoi(d, 'loi')!.chu).toMatch(/Không thấy nhóm/)
    expect(cuoi(c, 'nhom')!.ds).toEqual([1, 2, 3])
    p.nhan(b, JSON.stringify({ t: 'nhom-bat' })) // không phải chủ nhóm ⇒ bỏ qua
    expect(p.soTran).toBe(0)
    p.nhan(a, JSON.stringify({ t: 'nhom-bat' }))
    expect(cuoi(c, 'tran')).toMatchObject({ kieu: 'nhom', giay: LUAT.nhom.giay })
  })
})

describe('Phòng đấu · trận', () => {
  function vaoTran() {
    const ph = phong()
    const a = kn(), b = kn()
    ph.p.vao(a, ve('1'), 0, false, false); ph.p.vao(b, ve('2'), 1, false, false)
    ph.p.nhan(a, JSON.stringify({ t: 'nhanh' })); ph.p.nhan(b, JSON.stringify({ t: 'nhanh' }))
    return { ...ph, a, b }
  }

  it('mỗi nhịp gửi ảnh trận nhị phân; ack = seq ý định cuối của ĐÚNG em; ý định đổi vị trí do phòng tính', () => {
    const { p, a, b } = vaoTran()
    const x0 = docAnh((p.buoc(), a.anh[0]))!.ghe[0].x
    p.nhan(a, maYDinh(41, { dx: 1, dy: 0, ngam: 0, ban: false }))
    for (let i = 0; i < 10; i++) p.buoc()
    const anhA = docAnh(a.anh[a.anh.length - 1])!, anhB = docAnh(b.anh[b.anh.length - 1])!
    expect(anhA.ack).toBe(41); expect(anhB.ack).toBe(0)
    expect(anhA.ghe[0].x).toBeGreaterThan(x0 + 50)
    expect(a.anh.every((g) => g.length < 120)).toBe(true)
  })

  it('ý định méo (vector dài 100) bị chuẩn hoá ⇒ không chạy nhanh hơn luật', () => {
    const { p, a } = vaoTran()
    p.buoc()
    const x0 = docAnh(a.anh[0])!.ghe[0].x
    const goi = maYDinh(1, { dx: 1, dy: 1, ngam: 0, ban: false })
    p.nhan(a, goi)
    for (let i = 0; i < 4; i++) p.buoc(BUOC)
    const g = docAnh(a.anh[a.anh.length - 1])!.ghe[0]
    expect(Math.hypot(g.x - x0, g.y - docAnh(a.anh[0])!.ghe[0].y)).toBeLessThanOrEqual(210 * BUOC * 4 + 1)
  })

  it('hết giờ ⇒ gửi kết quả cho cả hai, về Rảnh, phòng hết việc thì được ngủ', () => {
    const { p, a, b } = vaoTran()
    for (let i = 0; i < (LUAT.doi.giay + 1) / BUOC; i++) p.buoc()
    expect(cuoi(a, 'ket')).toMatchObject({ thang: null })
    expect((cuoi(b, 'ket')!.bang as unknown[]).length).toBe(2)
    expect(p.soTran).toBe(0)
    expect(p.canThuc()).toBe(false)
  })

  it('rớt mạng giữa trận: giữ ghế 8 giây (nối lại được); quá hạn ⇒ bạn còn lại thắng', () => {
    const { p, a, b, tien } = vaoTran()
    p.roi(a)
    tien(3000); p.buoc()
    const a2 = kn()
    p.vao(a2, ve('1'), 0, false, false)
    expect(cuoi(a2, 'tran')).toBeTruthy()
    p.roi(a2)
    tien(GIAY_CHO_NOI_LAI * 1000 + 1); p.buoc()
    expect(cuoi(b, 'ket')).toMatchObject({ thang: 2, banRoi: true })
    expect(p.soTran).toBe(0)
  })

  it('Rời trận ⇒ bạn thắng ngay', () => {
    const { p, a, b } = vaoTran()
    p.nhan(a, JSON.stringify({ t: 'roi-tran' }))
    expect(cuoi(a, 'ket')).toMatchObject({ roi: true })
    expect(cuoi(b, 'ket')).toMatchObject({ thang: 2 })
  })

  it('phản ứng nhanh chỉ 4 câu có sẵn, 1 lần / 2 giây; không có ô chat', () => {
    const { p, a, b, tien } = vaoTran()
    p.nhan(a, JSON.stringify({ t: 'pu', i: 0 })); p.nhan(a, JSON.stringify({ t: 'pu', i: 1 })); p.nhan(a, JSON.stringify({ t: 'pu', i: 9 }))
    expect(b.tin.filter((m) => m.t === 'pu')).toEqual([{ t: 'pu', tu: 1, i: 0 }])
    tien(2100); p.nhan(a, JSON.stringify({ t: 'pu', i: 1 }))
    expect(b.tin.filter((m) => m.t === 'pu')).toHaveLength(2)
    p.nhan(a, JSON.stringify({ t: 'chat', chu: 'xin chào' }))
    expect(JSON.stringify(b.tin)).not.toContain('xin chào')
  })

  it('dội gói: > 40 gói/giây bị bỏ, > 80 ⇒ đóng 4008', () => {
    const { p, a } = vaoTran()
    for (let i = 0; i < 81; i++) p.nhan(a, maYDinh(i, { dx: 0, dy: 0, ngam: 0, ban: false }))
    expect(a.dongMa).toBe(MA_DONG.quaNhieu)
  })

  it('thầy bắt đầu thi ⇒ mọi máy nhận {t:"dong"} rồi bị đóng 4000; phòng rỗng', () => {
    const { p, a, b } = vaoTran()
    p.dongTatCa('bat-dau')
    for (const k of [a, b]) { expect(cuoi(k, 'dong')).toEqual({ t: 'dong', ly: 'bat-dau' }); expect(k.dongMa).toBe(MA_DONG.batDau) }
    expect(p.soNguoi).toBe(0); expect(p.soTran).toBe(0); expect(p.canThuc()).toBe(false)
  })
})

describe('Vé vào sảnh đấu + công tắc', () => {
  const BI_MAT = 'bi-mat-thu'
  it('ký ⇄ kiểm; sai chữ ký / hết hạn / rác ⇒ null', async () => {
    const v = await kyVeDau(BI_MAT, { c: '123456', s: '12121', t: 'Khánh Ngọc', h: Date.now() + 1000 })
    expect(await kiemVeDau(BI_MAT, v)).toMatchObject({ c: '123456', s: '12121', t: 'Khánh Ngọc' })
    expect(await kiemVeDau('khac', v)).toBeNull()
    expect(await kiemVeDau(BI_MAT, v, Date.now() + 5000)).toBeNull()
    expect(await kiemVeDau(BI_MAT, v.replace(/^./, 'x'))).toBeNull()
    expect(await kiemVeDau(BI_MAT, 'abc')).toBeNull()
    expect(await kiemVeDau(BI_MAT, 42)).toBeNull()
  })
  it('tên gọi = hai chữ cuối của họ tên trong danh sách lớp, tối đa 16 ký tự', () => {
    expect(tenGoi('Nguyễn Khánh Ngọc')).toBe('Khánh Ngọc')
    expect(tenGoi('Lan')).toBe('Lan')
    expect(tenGoi(null)).toBe('')
    expect(tenGoi('A Bbbbbbbbbbbbbbbbbbbb Ccccc').length).toBeLessThanOrEqual(16)
  })
  it('phát vé chỉ khi có phòng đấu + không bật TAT_DAU_ION; vé sống 2 giờ', async () => {
    const env = { MA_BI_MAT: BI_MAT, PHONG_DAU_ION: {} } as unknown as Env
    const v = await veDauChoEm(env, '123456', '12121', 'Nguyễn Khánh Ngọc')
    const k = await kiemVeDau(BI_MAT, v)
    expect(k!.h - Date.now()).toBeGreaterThan(HAN_VE_MS - 5000)
    expect(await veDauChoEm({ ...env, TAT_DAU_ION: '1' } as Env, '123456', '1', '')).toBeUndefined()
    expect(await veDauChoEm({ MA_BI_MAT: BI_MAT } as Env, '123456', '1', '')).toBeUndefined()
  })
  it('cửa /dau-ion/<mã ca>: tắt ⇒ 410; mã ca lạ ⇒ 400; không phải WebSocket ⇒ 426; đúng ⇒ chuyển đúng phòng của ca', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 200 }))
    const ns = { idFromName: vi.fn((t: string) => ({ toString: () => t })), get: vi.fn(() => ({ fetch })) }
    const env = { MA_BI_MAT: BI_MAT, PHONG_DAU_ION: ns } as unknown as Env
    const ws = { headers: { upgrade: 'websocket' } }
    expect((await vaoPhongDau(new Request('https://x/dau-ion/123456', ws), { ...env, TAT_DAU_ION: '1' } as Env)).status).toBe(410)
    expect((await vaoPhongDau(new Request('https://x/dau-ion/12%20a%3B', ws), env)).status).toBe(400)
    expect((await vaoPhongDau(new Request('https://x/dau-ion/123456'), env)).status).toBe(426)
    await vaoPhongDau(new Request('https://x/dau-ion/123456', ws), env)
    expect(ns.idFromName).toHaveBeenCalledWith('dau-ion:123456')
    expect(ns.get).toHaveBeenCalledWith(expect.anything(), { locationHint: 'apac' })
    const req = (fetch.mock.calls[0] as unknown as [Request])[0]
    expect(req.headers.get('x-ma-ca')).toBe('123456')
  })
})
