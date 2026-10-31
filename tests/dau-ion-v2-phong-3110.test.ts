// @vitest-environment node
// «ĐẤU NGUYÊN TỬ 2» · PHÒNG ĐẤU (Durable Object `PhongDauIon`, luật ở server/src/dau-ion-phong.ts) + VÉ + CÔNG TẮC — mô phỏng máy chủ.
// Khoá: tự ghép sân (≤ 6 người thật, đủ 6 ⇒ sân mới), A.I lấp cho đủ 4 rồi nhường ghế, sân chỉ còn A.I ⇒ đóng, vào giữa ván, trùng nguyên tố ⇒ đổi,
// máy chủ tự ngắm + tự bắn (máy em chỉ gửi hướng đi), cấp súng / vật phẩm chạy ở phòng, ghế vắng không tự bắn, rớt mạng giữ ghế 8 giây,
// ván 60 giây xoay vòng, dội gói, thầy bắt đầu ⇒ {t:'dong'} + đóng 4000; GIAO THỨC CÓ PHIÊN BẢN: máy cũ ⇒ đóng sạch 4010; vé; 0 lệnh D1.
import { describe, expect, it, vi } from 'vitest'
import { CHU_BAN_CU, GIAY_CHO_NOI_LAI, MA_DONG, PHIEN_BAN, PhongDau, TRAN_KET_NOI, TRAN_SAN, type KetNoi } from '../server/src/dau-ion-phong'
import { PhongDauIon } from '../server/src/phong-dau-ion'
import { HAN_VE_MS, kiemVeDau, kyVeDau, tenGoi, vaoPhongDau, veDauChoEm } from '../server/src/dau-ion-ve'
import { BUOC, DU_AI, GIAY_NGHI, GIAY_VAN, TOI_DA } from '../src/lib/dau-ion/loi'
import { docAnh, maYDinh } from '../src/lib/dau-ion/goi'
import type { DurableObjectState, Env, WsMayChu } from '../server/src/kieu'

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
  /** Tiến đồng hồ + chạy nhịp phòng; mọi máy trong `songs` gửi hướng đi mỗi nhịp (không thành «vắng»). */
  const chay = (giay: number, songs: KnGia[] = []) => { for (let t = 0; t < giay - 1e-9; t += BUOC) { nay += BUOC * 1000; for (const k of songs) p.nhan(k, maYDinh(0, 0, 0)); p.buoc(BUOC) } }
  return { p, chay, tien: (ms: number) => { nay += ms } }
}
const vaoSan = (p: PhongDau, s: string, nt = 0, t?: string) => { const k = kn(); p.vao(k, ve(s, t), nt, false); p.nhan(k, JSON.stringify({ t: 'vao-san' })); return k }
const ghe = (k: KnGia) => (cuoi(k, 'ghe') ?? cuoi(k, 'san'))!.ghe as [number, string, number, number][]

describe('Ghép sân + A.I lấp ghế', () => {
  it('vào phòng: chào có phiên bản giao thức, CHƯA vào sân (0 sân) ⇒ sảnh báo «Sân 1»', () => {
    const { p } = phong()
    const a = kn()
    p.vao(a, ve('11111', 'Minh Anh'), 2, false)
    expect(cuoi(a, 'chao')).toMatchObject({ v: PHIEN_BAN, toi: 1, ten: 'Minh Anh' })
    expect(cuoi(a, 'sanh')).toEqual({ t: 'sanh', so: 1, that: 0 })
    expect(p.soSan).toBe(0)
    expect(a.kem).toMatchObject({ v: PHIEN_BAN, id: 1, s: '11111' })
  })

  it('một em vào sân ⇒ sân mới, A.I lấp cho đủ 4 (tên «A.I <nguyên tố>»); người thật vào ⇒ một A.I nhường ghế ngay', () => {
    const { p } = phong()
    const a = vaoSan(p, '1', 3, 'Minh Anh')
    const san = cuoi(a, 'san')!
    expect(san).toMatchObject({ v: PHIEN_BAN, so: 1, toi: 1, con: GIAY_VAN })
    expect(ghe(a)).toHaveLength(DU_AI)
    expect(ghe(a).filter((g) => g[3] === 1)).toHaveLength(3)
    expect(ghe(a).filter((g) => g[3]).every((g) => /^A\.I [A-Z][a-z]+$/.test(g[1]))).toBe(true)
    expect(p.dsSan()).toEqual([{ so: 1, that: 1, ai: 3 }])
    vaoSan(p, '2', 0)
    expect(p.dsSan()).toEqual([{ so: 1, that: 2, ai: 2 }])
    expect(ghe(a)).toHaveLength(4)
    vaoSan(p, '3'); vaoSan(p, '4')
    expect(p.dsSan()).toEqual([{ so: 1, that: 4, ai: 0 }])
  })

  it('tối đa 6 người thật mỗi sân; người thứ 7 ⇒ sân mới (có A.I lấp); sảnh báo đúng sân sẽ vào', () => {
    const { p } = phong()
    const ds = Array.from({ length: TOI_DA }, (_, i) => vaoSan(p, `S${i}`, i % 7))
    expect(p.dsSan()).toEqual([{ so: 1, that: 6, ai: 0 }])
    expect(ghe(ds[0])).toHaveLength(6)
    const cho = kn(); p.vao(cho, ve('CHO'), 0, false)
    expect(cuoi(cho, 'sanh')).toEqual({ t: 'sanh', so: 2, that: 0 })
    const thu7 = vaoSan(p, 'S7')
    expect(cuoi(thu7, 'san')).toMatchObject({ so: 2 })
    expect(p.dsSan()).toEqual([{ so: 1, that: 6, ai: 0 }, { so: 2, that: 1, ai: 3 }])
    expect(cuoi(cho, 'sanh')).toEqual({ t: 'sanh', so: 2, that: 1 })
  })

  it('mỗi sân 6 màu khác nhau: trùng nguyên tố ⇒ phòng đổi em sang nguyên tố còn trống (A.I trùng màu nhường ghế trước)', () => {
    const { p } = phong()
    const a = vaoSan(p, '1', 3), b = vaoSan(p, '2', 3)
    const nt = ghe(a).map((g) => g[2])
    expect(new Set(nt).size).toBe(nt.length)
    expect(ghe(b).find((g) => g[0] === 1)![2]).toBe(3)
    expect(ghe(b).find((g) => g[0] === 2)![2]).not.toBe(3)
  })

  it('rời sân ⇒ A.I vào thay cho đủ 4; sân chỉ còn A.I ⇒ đóng sân, phòng được ngủ', () => {
    const { p } = phong()
    const a = vaoSan(p, '1'), b = vaoSan(p, '2')
    p.nhan(b, JSON.stringify({ t: 'roi-san' }))
    expect(p.dsSan()).toEqual([{ so: 1, that: 1, ai: 3 }])
    expect(cuoi(b, 'sanh')).toBeTruthy()
    p.nhan(a, JSON.stringify({ t: 'roi-san' }))
    expect(p.soSan).toBe(0)
    expect(p.canThuc()).toBe(false)
  })

  it('sân đấu kín (14 sân) ⇒ báo chờ, không mở thêm', () => {
    const { p } = phong()
    for (let i = 0; i < TRAN_SAN * TOI_DA; i++) vaoSan(p, `S${i}`)
    expect(p.soSan).toBe(TRAN_SAN)
    const thua = kn(); p.vao(thua, ve('THUA'), 0, false)
    expect(thua.dongMa).toBe(MA_DONG.day) // 84 > 80 kết nối
    expect(TRAN_KET_NOI).toBe(80)
  })
})

describe('Phòng quyết mọi thứ: tự ngắm, bắn, cấp súng, vật phẩm', () => {
  it('máy em chỉ gửi hướng đi; phòng đi, tự ngắm, tự bắn ⇒ ảnh trận mã 3 có loạt bắn + mục tiêu, kèm ack của từng em', () => {
    const { p, chay } = phong()
    const a = vaoSan(p, '1')
    p.nhan(a, maYDinh(7, 1, 0))
    const x0 = p.sanCua(1)!.ghe.find((g) => g.id === 1)!.x
    chay(3, [])
    const tr = p.sanCua(1)!
    expect(tr.ghe.find((g) => g.id === 1)!.x).not.toBe(x0)
    const anh = a.anh.map((b) => docAnh(b)!)
    expect(anh.length).toBeGreaterThan(50)
    expect(anh.every((x) => x.ghe.length === 4)).toBe(true)
    expect(anh.some((x) => x.su.some((s) => s.t === 'ban'))).toBe(true)
    expect(anh.some((x) => x.ghe.some((g) => g.muc > 0))).toBe(true)
    expect(anh[0].ack).toBe(7)
  })

  it('súng tiến hoá theo electron và Xúc tác ở phòng; bị hạ thì xuống 1 cấp (một sân A.I chạy 60 giây)', () => {
    const { p, chay } = phong()
    const a = vaoSan(p, '1')
    const su: string[] = []
    const capMax = new Map<number, number>()
    for (let i = 0; i < 60; i++) {
      chay(1, [a])
      for (const b of a.anh.splice(0)) { const x = docAnh(b)!; for (const s of x.su) su.push(s.t); for (const g of x.ghe) capMax.set(g.id, Math.max(capMax.get(g.id) ?? 1, g.cap)) }
    }
    expect(su).toContain('nhat'); expect(su).toContain('len'); expect(su).toContain('trung'); expect(su).toContain('ha')
    expect(Math.max(...capMax.values())).toBeGreaterThanOrEqual(3)
  })

  it('ghế vắng (không gửi hướng đi quá 3 giây): không tự bắn, không bị A.I ngắm; vắng quá 8 giây ⇒ rời sân, A.I vào thay', () => {
    const { p, chay } = phong()
    const a = vaoSan(p, '1'), b = vaoSan(p, '2')
    chay(3.2, [b])
    const tr = p.sanCua(1)!
    const g = tr.ghe.find((x) => x.id === 1)!
    expect(g.vang).toBe(true)
    const banTruoc = g.ban
    chay(2, [b])
    expect(g.ban).toBe(banTruoc)
    expect(tr.ghe.filter((x) => x.id !== 1).every((x) => x.muc !== 1)).toBe(true)
    chay(3.5, [b])
    expect(p.dsSan()).toEqual([{ so: 1, that: 1, ai: 3 }])
    expect(cuoi(a, 'sanh')).toBeTruthy()
  })

  it('rớt mạng giữa ván: giữ ghế 8 giây, nối lại về đúng sân, đúng cấp; quá 8 giây ⇒ mất ghế', () => {
    const { p, chay } = phong()
    const a = vaoSan(p, '1'), b = vaoSan(p, '2')
    p.sanCua(1)!.ghe.find((x) => x.id === 1)!.cap = 4
    p.roi(a)
    chay(2, [b])
    const a2 = kn(); p.vao(a2, ve('1'), 0, false)
    expect(cuoi(a2, 'san')).toMatchObject({ so: 1, toi: 1 })
    expect(p.sanCua(1)!.ghe.find((x) => x.id === 1)!.cap).toBe(4)
    p.roi(a2)
    chay(GIAY_CHO_NOI_LAI + 0.5, [b])
    expect(p.dsSan()).toEqual([{ so: 1, that: 1, ai: 3 }])
    expect(p.soNguoi).toBe(1)
  })

  it('cùng số báo danh mở máy khác ⇒ kết nối cũ đóng 4002', () => {
    const { p } = phong()
    const a = vaoSan(p, '1'), a2 = kn()
    p.vao(a2, ve('1'), 0, false)
    expect(a.dongMa).toBe(MA_DONG.thayMay)
  })

  it('ván 60 giây ⇒ bảng kết quả (hạ · bị hạ · cấp cao nhất · chuỗi hạ), nghỉ 6 giây rồi ván mới tự chạy, ai cũng về Cấp 1', () => {
    const { p, chay } = phong()
    const a = vaoSan(p, '1')
    chay(GIAY_VAN + 0.2, [a])
    const ket = cuoi(a, 'ket')!
    expect(ket.nghi).toBe(GIAY_NGHI)
    expect((ket.bang as number[][])).toHaveLength(4)
    expect((ket.bang as number[][])[0]).toHaveLength(5)
    chay(GIAY_NGHI + 0.2, [a])
    expect(cuoi(a, 'van')).toMatchObject({ con: GIAY_VAN })
    expect(p.sanCua(1)!.ghe.every((g) => g.cap === 1 && g.ha === 0)).toBe(true)
  })

  it('«Chơi ván mới»: mọi bạn thật trong sân cùng bấm ⇒ ván mới ngay', () => {
    const { p, chay } = phong()
    const a = vaoSan(p, '1')
    chay(GIAY_VAN + 0.2, [a])
    p.nhan(a, JSON.stringify({ t: 'van-moi' }))
    expect(cuoi(a, 'van')).toBeTruthy()
  })

  it('phản ứng nhanh chỉ 4 câu có sẵn, 1 lần / 2 giây, chỉ trong sân; không có ô chat', () => {
    const { p, tien } = phong()
    const a = vaoSan(p, '1'), b = vaoSan(p, '2')
    p.nhan(a, JSON.stringify({ t: 'pu', i: 0 })); p.nhan(a, JSON.stringify({ t: 'pu', i: 1 })); p.nhan(a, JSON.stringify({ t: 'pu', i: 9 }))
    expect(b.tin.filter((m) => m.t === 'pu')).toEqual([{ t: 'pu', tu: 1, i: 0 }])
    tien(2100); p.nhan(a, JSON.stringify({ t: 'pu', i: 1 }))
    expect(b.tin.filter((m) => m.t === 'pu')).toHaveLength(2)
    p.nhan(a, JSON.stringify({ t: 'chat', chu: 'xin chào' }))
    expect(JSON.stringify(b.tin)).not.toContain('xin chào')
  })

  it('số báo danh KHÔNG bao giờ gửi cho máy khác; Ẩn tên ⇒ «Bạn <nguyên tố>»', () => {
    const { p } = phong()
    const a = kn(); p.vao(a, ve('11111', 'Minh Anh'), 3, true); p.nhan(a, JSON.stringify({ t: 'vao-san' }))
    const b = vaoSan(p, '22222')
    expect(JSON.stringify(b.tin)).not.toContain('11111')
    expect(ghe(b).find((g) => g[0] === 1)![1]).toBe('Bạn Cl')
  })

  it('bỏ «Thách theo số báo danh» và «Nhóm 3–4 bạn»: lệnh cũ không làm gì', () => {
    const { p } = phong()
    const a = kn(); p.vao(a, ve('1'), 0, false)
    const b = kn(); p.vao(b, ve('2'), 0, false)
    for (const t of ['thach', 'nhan', 'nhanh', 'nhom-tao', 'nhom-vao', 'nhom-bat']) p.nhan(a, JSON.stringify({ t, den: 2, sbd: '2', ma: 10 }))
    expect(b.tin.map((m) => m.t)).toEqual(['chao', 'sanh'])
    expect(p.soSan).toBe(0)
  })

  it('dội gói: > 40 gói/giây bị bỏ, > 80 ⇒ đóng 4008', () => {
    const { p } = phong()
    const a = vaoSan(p, '1')
    for (let i = 0; i < 81; i++) p.nhan(a, maYDinh(i, 0, 0))
    expect(a.dongMa).toBe(MA_DONG.quaNhieu)
  })

  it('thầy bắt đầu thi ⇒ mọi máy (sảnh lẫn sân) nhận {t:"dong", ly:"bat-dau"} rồi bị đóng 4000; phòng rỗng', () => {
    const { p, chay } = phong()
    const a = vaoSan(p, '1'), b = kn(); p.vao(b, ve('2'), 0, false)
    chay(1, [a])
    p.dongTatCa('bat-dau')
    for (const k of [a, b]) { expect(cuoi(k, 'dong')).toEqual({ t: 'dong', ly: 'bat-dau' }); expect(k.dongMa).toBe(MA_DONG.batDau) }
    expect(p.soNguoi).toBe(0); expect(p.soSan).toBe(0); expect(p.canThuc()).toBe(false)
  })
})

/** Durable Object với ngữ cảnh giả (không cần Cloudflare): kiểm phiên bản giao thức + đường `dong`. */
function doGia(env: Partial<Env> = {}) {
  const ws: (WsMayChu & { ma?: number; ly?: string; gui: unknown[]; kem: Record<string, unknown> })[] = []
  const taoWs = (kem: Record<string, unknown>) => {
    const w = { gui: [] as unknown[], kem, ma: undefined as number | undefined, ly: undefined as string | undefined,
      send(d: unknown) { w.gui.push(d) }, close(ma?: number, ly?: string) { w.ma = ma; w.ly = ly },
      serializeAttachment(v: unknown) { w.kem = v as Record<string, unknown> }, deserializeAttachment() { return w.kem } }
    ws.push(w); return w
  }
  const ctx = { storage: {}, acceptWebSocket() {}, getWebSockets: () => ws, waitUntil() {} } as unknown as DurableObjectState
  const d = new PhongDauIon(ctx, { MA_BI_MAT: 'bi-mat', ...env } as Env)
  return { d, taoWs }
}

describe('Giao thức có phiên bản (máy còn mảnh game cũ trong bộ nhớ đệm)', () => {
  it('gói `vao` không có v:2 (máy cũ) ⇒ đóng sạch 4010, không kiểm vé, không vào phòng', async () => {
    const { d, taoWs } = doGia()
    const w = taoWs({ ca: '123456', mo: 1 })
    await d.webSocketMessage(w, JSON.stringify({ t: 'vao', ve: 'x', nt: 0, an: false, km: false }))
    expect(w.ma).toBe(MA_DONG.tat)
    expect(w.ly).toBe(CHU_BAN_CU)
  })
  it('gói `vao` v:2 với vé đúng ca ⇒ vào được; vé sai ⇒ 4003', async () => {
    const { d, taoWs } = doGia()
    const w = taoWs({ ca: '123456', mo: 1 })
    const v = await kyVeDau('bi-mat', { c: '123456', s: '12121', t: 'Khánh Ngọc', h: Date.now() + 60_000 })
    await d.webSocketMessage(w, JSON.stringify({ t: 'vao', v: PHIEN_BAN, ve: v, nt: 1, an: false }))
    expect(w.ma).toBeUndefined()
    expect(String(w.gui[0])).toContain('"t":"chao"')
    const w2 = taoWs({ ca: '123456', mo: 1 })
    await d.webSocketMessage(w2, JSON.stringify({ t: 'vao', v: PHIEN_BAN, ve: 'rac', nt: 1 }))
    expect(w2.ma).toBe(MA_DONG.veSai)
  })
  it('kết nối mang dữ liệu bản cũ (không có v) khi phòng thức dậy ⇒ đóng 4010', async () => {
    const { d, taoWs } = doGia()
    const cu = taoWs({ ca: '123456', id: 3, s: '999', t: 'Cũ', nt: 0, an: false, km: false })
    await d.webSocketMessage(cu, maYDinh(1, 0, 0) as unknown as ArrayBuffer)
    expect(cu.ma).toBe(MA_DONG.tat)
  })
  it('POST /dong (thầy bấm Bắt đầu) ⇒ {t:"dong", ly:"bat-dau"} rồi đóng 4000', async () => {
    const { d, taoWs } = doGia()
    const w = taoWs({ ca: '123456', mo: 1 })
    const v = await kyVeDau('bi-mat', { c: '123456', s: '1', t: 'A', h: Date.now() + 60_000 })
    await d.webSocketMessage(w, JSON.stringify({ t: 'vao', v: PHIEN_BAN, ve: v, nt: 0 }))
    await d.fetch(new Request('https://phong-dau/dong', { method: 'POST' }))
    expect(w.gui.at(-1)).toBe('{"t":"dong","ly":"bat-dau"}')
    expect(w.ma).toBe(MA_DONG.batDau)
  })
})

describe('Vé vào sảnh đấu + công tắc (giữ nguyên)', () => {
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
  it('tên gọi = hai chữ cuối của họ tên, tối đa 16 ký tự', () => {
    expect(tenGoi('Nguyễn Khánh Ngọc')).toBe('Khánh Ngọc')
    expect(tenGoi('Lan')).toBe('Lan')
    expect(tenGoi(null)).toBe('')
  })
  it('phát vé chỉ khi có phòng đấu + không bật TAT_DAU_ION; vé sống 2 giờ', async () => {
    const env = { MA_BI_MAT: BI_MAT, PHONG_DAU_ION: {} } as unknown as Env
    const v = await veDauChoEm(env, '123456', '12121', 'Nguyễn Khánh Ngọc')
    const k = await kiemVeDau(BI_MAT, v)
    expect(k!.h - Date.now()).toBeGreaterThan(HAN_VE_MS - 5000)
    expect(await veDauChoEm({ ...env, TAT_DAU_ION: '1' } as Env, '123456', '1', '')).toBeUndefined()
  })
  it('cửa /dau-ion/<mã ca>: tắt ⇒ 410; mã ca lạ ⇒ 400; không phải WebSocket ⇒ 426; đúng ⇒ đúng phòng của ca', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 200 }))
    const ns = { idFromName: vi.fn((t: string) => ({ toString: () => t })), get: vi.fn(() => ({ fetch })) }
    const env = { MA_BI_MAT: BI_MAT, PHONG_DAU_ION: ns } as unknown as Env
    const ws = { headers: { upgrade: 'websocket' } }
    expect((await vaoPhongDau(new Request('https://x/dau-ion/123456', ws), { ...env, TAT_DAU_ION: '1' } as Env)).status).toBe(410)
    expect((await vaoPhongDau(new Request('https://x/dau-ion/12%20a%3B', ws), env)).status).toBe(400)
    expect((await vaoPhongDau(new Request('https://x/dau-ion/123456'), env)).status).toBe(426)
    await vaoPhongDau(new Request('https://x/dau-ion/123456', ws), env)
    expect(ns.idFromName).toHaveBeenCalledWith('dau-ion:123456')
  })
  it('0 lệnh D1: luật phòng và Durable Object không đọc env.DB', async () => {
    const { readFileSync } = await import('node:fs')
    for (const f of ['server/src/dau-ion-phong.ts', 'server/src/phong-dau-ion.ts', 'src/lib/dau-ion/loi.ts']) expect(readFileSync(f, 'utf8')).not.toMatch(/\bDB\b|prepare\(/)
  })
})
