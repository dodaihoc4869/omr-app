// @vitest-environment node
// «ĐẤU NGUYÊN TỬ» 3 ĐẤU 3 · PHÒNG ĐẤU (Durable Object `PhongDauIon`, luật ở server/src/dau-ion-phong.ts) + VÉ + CÔNG TẮC — mô phỏng máy chủ.
// Khoá (thầy 01/11 tối, docs/ban-ve-dau-ion-3v3-0111): mỗi sân LUÔN 6 ghế 3 đấu 3, ghế trống là A.I; «Đấu» ⇒ thế chỗ A.I (sân đông người thật trước, phe
// ít người thật hơn), không có ⇒ sân mới 1 em + 5 A.I chạy ngay; rời / rớt quá 8 giây ⇒ A.I vào lại đúng ghế; tỉ số phe giữ khi đổi người; ván nối ván,
// chia lại phe cho đều, gom em ngồi một mình; phòng đầy ⇒ «sang:k+1»; nhịp theo đồng hồ thật + bước trận trong ảnh; tự ngắm / bắn ở phòng; ghế vắng;
// dội gói; thầy bắt đầu ⇒ {t:'dong'} + đóng 4000; giao thức có phiên bản (máy cũ ⇒ 4010); vé; cửa nhiều phòng; 0 lệnh D1.
import { describe, expect, it, vi } from 'vitest'
import { CHU_BAN_CU, GIAY_CHO_NOI_LAI, ID_AI_TU, MA_DONG, PHIEN_BAN, PhongDau, SO_PHONG_TOI_DA, TRAN_KET_NOI, type KetNoi } from '../server/src/dau-ion-phong'
import { PhongDauIon } from '../server/src/phong-dau-ion'
import { HAN_VE_MS, dongPhongDau, kiemVeDau, kyVeDau, tenGoi, vaoPhongDau, veDauChoEm } from '../server/src/dau-ion-ve'
import { BUOC, GIAY_NGHI, GIAY_VAN, MOI_PHE, TOI_DA, aiDi } from '../src/lib/dau-ion/loi'
import { docAnh, maYDinh } from '../src/lib/dau-ion/goi'
import type { DurableObjectState, Env, WsMayChu } from '../server/src/kieu'

interface KnGia extends KetNoi { tin: Record<string, unknown>[]; anh: Uint8Array[]; dongMa: number | null; dongLy: string; kem: unknown }
function kn(): KnGia {
  const k: KnGia = {
    tin: [], anh: [], dongMa: null, dongLy: '', kem: null,
    gui(d) { if (typeof d === 'string') k.tin.push(JSON.parse(d)); else k.anh.push(d) },
    dong(ma, ly) { k.dongMa = ma; k.dongLy = ly },
    ghiKem(v) { k.kem = v },
  }
  return k
}
const ve = (s: string, t = `Bạn ${s}`) => ({ c: '123456', s, t, h: Date.now() + 60_000 })
const cuoi = (k: KnGia, t: string) => [...k.tin].reverse().find((m) => m.t === t)
function phong(soPhong = 0) {
  let nay = 1_000_000
  const p = new PhongDau(() => nay, () => 0.5, soPhong)
  /** Tiến đồng hồ + chạy nhịp phòng; mọi máy trong `songs` gửi hướng đi mỗi nhịp (không thành «vắng»). */
  const chay = (giay: number, songs: KnGia[] = []) => { for (let t = 0; t < giay - 1e-9; t += BUOC) { nay += BUOC * 1000; for (const k of songs) p.nhan(k, maYDinh(0, 0, 0)); p.buoc(BUOC) } }
  return { p, chay, tien: (ms: number) => { nay += ms } }
}
const vaoSan = (p: PhongDau, s: string, nt = 0, t?: string) => { const k = kn(); p.vao(k, ve(s, t), nt, false); p.nhan(k, JSON.stringify({ t: 'vao-san' })); return k }
type Dong = [number, string, number, number, number]
const ghe = (k: KnGia) => (cuoi(k, 'ghe') ?? cuoi(k, 'van') ?? cuoi(k, 'san'))!.ghe as Dong[]
const toi = (k: KnGia) => cuoi(k, 'san')!.toi as number
const pheCua = (k: KnGia, id = toi(k)) => ghe(k).find((g) => g[0] === id)![4]

describe('Ghép phe 3 đấu 3 — bấm «Đấu» là chơi, không bao giờ chờ', () => {
  it('vào phòng: chào có giao thức 3, CHƯA vào sân (0 sân) ⇒ sảnh báo «Sân 1»', () => {
    const { p } = phong()
    const a = kn()
    p.vao(a, ve('11111', 'Minh Anh'), 2, false)
    expect(cuoi(a, 'chao')).toMatchObject({ v: PHIEN_BAN, toi: 1, ten: 'Minh Anh' })
    expect(PHIEN_BAN).toBe(3)
    expect(cuoi(a, 'sanh')).toEqual({ t: 'sanh', so: 1, that: 0 })
    expect(p.soSan).toBe(0)
    expect(a.kem).toMatchObject({ v: PHIEN_BAN, id: 1, s: '11111' })
  })

  it('chưa có sân ⇒ mở sân 1 em + 5 A.I (3 đấu 3) và CHẠY NGAY: đồng hồ chạy, A.I tự đi, tự bắn; dòng ghế ghi cờ A.I + phe', () => {
    const { p, chay } = phong()
    const a = vaoSan(p, '1', 3, 'Minh Anh')
    expect(cuoi(a, 'san')).toMatchObject({ v: PHIEN_BAN, so: 1, toi: 1, con: GIAY_VAN, ti: [0, 0] })
    const g = ghe(a)
    expect(g).toHaveLength(TOI_DA)
    expect(g.filter((d) => d[3] === 1)).toHaveLength(5)
    expect(g.filter((d) => d[4] === 0)).toHaveLength(MOI_PHE)
    expect(g.find((d) => d[0] === 1)).toEqual([1, 'Minh Anh', 3, 0, expect.any(Number)])
    expect(g.filter((d) => d[3] === 1).every((d) => d[0] >= ID_AI_TU && /^[A-Z][a-z]+$/.test(d[1]))).toBe(true)
    const x0 = p.sanCua(1)!.ghe.filter((q) => q.ai).map((q) => q.x).join()
    chay(3, [a])
    expect(p.sanCua(1)!.con).toBeLessThan(GIAY_VAN - 2.5)
    expect(p.sanCua(1)!.ghe.filter((q) => q.ai).map((q) => q.x).join()).not.toBe(x0)
    expect(p.dsSan()).toEqual([{ so: 1, that: 1, ghe: 6, ai: 5 }])
  })

  it('bạn thứ 2 ⇒ vào CÙNG sân, thế chỗ A.I ở PHE ÍT NGƯỜI THẬT hơn; cả sân nhận `thay {cu, moi}` + dòng ghế mới; tỉ số phe giữ nguyên', () => {
    const { p, chay } = phong()
    const a = vaoSan(p, '1', 0, 'Minh Anh')
    chay(1, [a])
    p.sanCua(1)!.ti = [3, 4]
    const b = vaoSan(p, '2', 0, 'Gia Huy')
    expect(cuoi(b, 'san')).toMatchObject({ so: 1, ti: [3, 4] })
    expect(pheCua(b)).toBe(1 - pheCua(a))
    const th = cuoi(a, 'thay')!
    expect(th).toMatchObject({ moi: toi(b), ten: 'Gia Huy', phe: pheCua(b), ai: 0 })
    expect(th.cu as number).toBeGreaterThanOrEqual(ID_AI_TU)
    expect(ghe(a).some((d) => d[0] === th.cu)).toBe(false)
    expect(p.dsSan()).toEqual([{ so: 1, that: 2, ghe: 6, ai: 4 }])
    expect(p.sanCua(1)!.ti).toEqual([3, 4])
    // Em mới vào: khiên 3 giây ở bệ phe mình.
    expect(p.sanCua(1)!.ghe.find((q) => q.id === toi(b))!.che).toBeGreaterThan(2.5)
  })

  it('đủ 6 người thật ⇒ người thứ 7 mở sân mới (1 + 5 A.I); có người rời sân 1 ⇒ A.I vào lại, người mới vào sân ĐÔNG người thật hơn', () => {
    const { p } = phong()
    const ds = Array.from({ length: TOI_DA }, (_, i) => vaoSan(p, `S${i}`, i % 7))
    expect(p.dsSan()).toEqual([{ so: 1, that: 6, ghe: 6, ai: 0 }])
    expect([0, 1].map((ph) => ghe(ds[5]).filter((d) => d[4] === ph).length)).toEqual([3, 3])
    const thu7 = vaoSan(p, 'S7')
    expect(cuoi(thu7, 'san')).toMatchObject({ so: 2 })
    p.nhan(ds[2], JSON.stringify({ t: 'roi-san' }))
    expect(cuoi(ds[0], 'thay')).toMatchObject({ cu: toi(ds[2]), ai: 1 })
    expect(p.dsSan()).toEqual([{ so: 1, that: 5, ghe: 6, ai: 1 }, { so: 2, that: 1, ghe: 6, ai: 5 }])
    const moi = vaoSan(p, 'S8')
    expect(cuoi(moi, 'san')).toMatchObject({ so: 1 })
  })

  it('mỗi sân nguyên tố khác nhau: trùng nguyên tố ⇒ phòng đổi em sang nguyên tố còn trống', () => {
    const { p } = phong()
    const a = vaoSan(p, '1', 3), b = vaoSan(p, '2', 3)
    const nt = ghe(b).map((g) => g[2])
    expect(new Set(nt).size).toBe(nt.length)
    expect(ghe(b).find((g) => g[0] === toi(a))![2]).toBe(3)
    expect(ghe(b).find((g) => g[0] === toi(b))![2]).not.toBe(3)
  })

  it('rời sân ⇒ A.I vào lại ĐÚNG ghế đó (cùng phe); người thật cuối cùng rời ⇒ đóng sân (không chạy A.I đấu A.I), phòng được ngủ', () => {
    const { p, chay } = phong()
    const a = vaoSan(p, '1'), b = vaoSan(p, '2')
    const pheB = pheCua(b)
    chay(1, [a, b])
    p.nhan(b, JSON.stringify({ t: 'roi-san' }))
    const th = cuoi(a, 'thay')!
    expect(th).toMatchObject({ cu: toi(b), phe: pheB, ai: 1 })
    expect(ghe(a).find((d) => d[0] === th.moi)).toMatchObject([th.moi, expect.any(String), expect.any(Number), 1, pheB])
    expect(cuoi(b, 'sanh')).toBeTruthy()
    expect(p.dsSan()).toEqual([{ so: 1, that: 1, ghe: 6, ai: 5 }])
    p.nhan(a, JSON.stringify({ t: 'roi-san' }))
    expect(p.soSan).toBe(0)
    expect(p.canThuc()).toBe(false)
  })

  it('ván nối ván KHÔNG cần bấm; ván mới CHIA LẠI PHE: người thật xen kẽ (lệch ≤ 1), A.I lấp đủ 3 đấu 3', () => {
    const { p, chay } = phong()
    const ks = ['1', '2', '3', '4'].map((s) => vaoSan(p, s))
    chay(GIAY_VAN + 0.2, ks)
    expect(cuoi(ks[0], 'ket')).toMatchObject({ nghi: GIAY_NGHI })
    chay(GIAY_NGHI + 0.2, ks)
    const van = cuoi(ks[0], 'van')!
    expect(van).toMatchObject({ con: GIAY_VAN })
    const g = van.ghe as Dong[]
    expect(g).toHaveLength(6)
    expect([0, 1].map((ph) => g.filter((d) => d[3] === 0 && d[4] === ph).length)).toEqual([2, 2])
    expect([0, 1].map((ph) => g.filter((d) => d[4] === ph).length)).toEqual([3, 3])
    expect(p.sanCua(Number(ks[0].tin.find((m) => m.t === 'san')!.toi))!.ghe.every((q) => q.cap === 1 && q.ha === 0)).toBe(true)
  })

  it('sang ván: em ngồi MỘT MÌNH với 5 A.I được gom sang sân đang có người còn ghế A.I', () => {
    const { p, chay } = phong()
    const ds = Array.from({ length: TOI_DA }, (_, i) => vaoSan(p, `S${i}`, i % 7))
    const le = vaoSan(p, 'LE')
    expect(cuoi(le, 'san')).toMatchObject({ so: 2 })
    p.nhan(ds[5], JSON.stringify({ t: 'roi-san' }))
    chay(GIAY_VAN + GIAY_NGHI + 0.5, [...ds.slice(0, 5), le])
    expect(cuoi(le, 'san')).toMatchObject({ so: 1 })
    expect(p.dsSan()).toEqual([{ so: 1, that: 6, ghe: 6, ai: 0 }])
  })

  it('phòng đầy (78 em) ⇒ đóng 4009 «sang:1» để máy em tự nối phòng kế; phòng cuối (số 7) đầy ⇒ báo đủ người', () => {
    expect(TRAN_KET_NOI).toBe(78); expect(SO_PHONG_TOI_DA).toBe(8)
    const { p } = phong()
    for (let i = 0; i < TRAN_KET_NOI; i++) vaoSan(p, `S${i}`)
    expect(p.soSan).toBe(13)
    const thua = kn(); p.vao(thua, ve('THUA'), 0, false)
    expect(thua.dongMa).toBe(MA_DONG.day); expect(thua.dongLy).toBe('sang:1')
    const cuoiCung = phong(7)
    for (let i = 0; i < TRAN_KET_NOI; i++) { const k = kn(); cuoiCung.p.vao(k, ve(`T${i}`), 0, false) }
    const k = kn(); cuoiCung.p.vao(k, ve('THUA'), 0, false)
    expect(k.dongLy).toBe('Sảnh đấu đã đủ người.')
  })
})

describe('Phòng quyết mọi thứ: tự ngắm, bắn, cấp súng, nhịp đồng hồ thật', () => {
  it('máy em chỉ gửi hướng đi; phòng đi, tự ngắm, tự bắn ⇒ ảnh trận mã 4: 6 ghế, loạt bắn, mục tiêu, BƯỚC TRẬN tăng đều, tỉ số, kèm ack', () => {
    const { p, chay } = phong()
    const a = vaoSan(p, '1')
    p.nhan(a, maYDinh(7, 1, 0))
    const x0 = p.sanCua(1)!.ghe.find((g) => g.id === 1)!.x
    chay(3)
    expect(p.sanCua(1)!.ghe.find((g) => g.id === 1)!.x).not.toBe(x0)
    const anh = a.anh.map((b) => docAnh(b)!)
    expect(anh.length).toBe(60)
    expect(anh.every((x) => x.ghe.length === 6)).toBe(true)
    expect(anh.slice(1).every((x, i) => x.buoc === anh[i].buoc + 1)).toBe(true)
    expect(anh.some((x) => x.su.some((s) => s.t === 'ban'))).toBe(true)
    expect(anh.some((x) => x.ghe.some((g) => g.muc > 0))).toBe(true)
    expect(anh[0].ack).toBe(7)
  })

  it('NHỊP THEO ĐỒNG HỒ THẬT: gọi trễ / dồn ⇒ bù đủ số bước cố định (tối đa 4), mỗi lần gọi chỉ gửi MỘT ảnh, bước trận khớp thời gian', () => {
    const { p, tien } = phong()
    const a = vaoSan(p, '1')
    const buoc = () => docAnh(a.anh.at(-1)!)!.buoc
    p.nhip() // mốc đầu: 1 bước
    const b0 = buoc(); let n = a.anh.length
    tien(50); p.nhip(); expect(buoc() - b0).toBe(1); expect(a.anh.length).toBe(n + 1); n = a.anh.length
    tien(130); p.nhip(); expect(buoc() - b0).toBe(3); expect(a.anh.length).toBe(n + 1); n = a.anh.length // 130 ms ⇒ 2 bước, dư 30 ms
    tien(20); p.nhip(); expect(buoc() - b0).toBe(4); expect(a.anh.length).toBe(n + 1) // 30 + 20 = 50 ms ⇒ 1 bước
    tien(1000); p.nhip(); expect(buoc() - b0).toBe(8) // máy treo 1 giây ⇒ bù tối đa 4 bước (không chạy dồn cả giây)
    tien(10); const truoc = a.anh.length; p.nhip(); expect(a.anh.length).toBe(truoc) // chưa đủ một bước ⇒ không gửi
  })

  it('súng tiến hoá theo electron / Xúc tác ở phòng; bị hạ KHÔNG tụt cấp (1 em + 5 A.I, 60 giây)', () => {
    const { p, tien } = phong()
    const a = vaoSan(p, '1')
    const su: string[] = []
    const capMax = new Map<number, number>()
    for (let t = 0; t < 60; t += BUOC) {
      tien(BUOC * 1000)
      const tr = p.sanCua(1)!, g = tr.ghe.find((x) => x.id === 1)!, y = aiDi(tr, g, BUOC)
      p.nhan(a, maYDinh(0, y.dx, y.dy))
      p.buoc(BUOC)
      for (const b of a.anh.splice(0)) { const x = docAnh(b)!; for (const s of x.su) { su.push(s.t); if (s.t === 'ha') { const bi = x.ghe.find((q) => q.id === s.ai); if (bi) expect(bi.cap).toBe(s.capCu) } } for (const g2 of x.ghe) capMax.set(g2.id, Math.max(capMax.get(g2.id) ?? 1, g2.cap)) }
    }
    expect(su).toContain('nhat'); expect(su).toContain('len'); expect(su).toContain('trung'); expect(su).toContain('ha')
    expect(Math.max(...capMax.values())).toBeGreaterThanOrEqual(3)
  })

  it('ghế vắng (không gửi hướng đi quá 3 giây): không tự bắn, không bị ngắm; vắng quá 8 giây ⇒ rời sân, A.I vào lại ghế', () => {
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
    expect(p.dsSan()).toEqual([{ so: 1, that: 1, ghe: 6, ai: 5 }])
    expect(cuoi(a, 'sanh')).toBeTruthy()
    expect(cuoi(b, 'thay')).toMatchObject({ cu: 1, ai: 1 })
  })

  it('rớt mạng giữa ván: giữ ghế 8 giây, nối lại về đúng sân, đúng cấp; quá 8 giây ⇒ A.I vào lại ghế', () => {
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
    expect(p.dsSan()).toEqual([{ so: 1, that: 1, ghe: 6, ai: 5 }])
    expect(p.soNguoi).toBe(1)
  })

  it('cùng số báo danh mở máy khác ⇒ kết nối cũ đóng 4002', () => {
    const { p } = phong()
    const a = vaoSan(p, '1'), a2 = kn()
    p.vao(a2, ve('1'), 0, false)
    expect(a.dongMa).toBe(MA_DONG.thayMay)
  })

  it('ván 60 giây ⇒ bảng kết quả 9 cột (đủ số liệu huy hiệu) + tỉ số phe; nghỉ 6 giây rồi ván mới tự chạy', () => {
    const { p, chay } = phong()
    const a = vaoSan(p, '1'), b = vaoSan(p, '2')
    chay(GIAY_VAN + 0.2, [a, b])
    const ket = cuoi(a, 'ket')!
    expect(ket.nghi).toBe(GIAY_NGHI)
    expect(ket.bang as number[][]).toHaveLength(6)
    expect((ket.bang as number[][])[0]).toHaveLength(9)
    expect(ket.ti).toHaveLength(2)
    const soVan = a.tin.filter((m) => m.t === 'van').length
    chay(GIAY_NGHI + 0.2, [a, b])
    expect(a.tin.filter((m) => m.t === 'van')).toHaveLength(soVan + 1)
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

  it('lệnh cũ (thách, nhóm, ván mới) không làm gì', () => {
    const { p } = phong()
    const a = kn(); p.vao(a, ve('1'), 0, false)
    const b = kn(); p.vao(b, ve('2'), 0, false)
    for (const t of ['thach', 'nhan', 'nhanh', 'nhom-tao', 'nhom-vao', 'nhom-bat', 'van-moi']) p.nhan(a, JSON.stringify({ t, den: 2, sbd: '2', ma: 10 }))
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
  it('gói `vao` không mang giao thức 3 (máy cũ) ⇒ đóng sạch 4010 «tải lại trang», không kiểm vé, không vào phòng', async () => {
    const { d, taoWs } = doGia()
    const w = taoWs({ ca: '123456', mo: 1 })
    await d.webSocketMessage(w, JSON.stringify({ t: 'vao', ve: 'x', nt: 0, an: false, km: false }))
    expect(w.ma).toBe(MA_DONG.tat)
    expect(w.ly).toBe(CHU_BAN_CU)
    const w2 = taoWs({ ca: '123456', mo: 1 })
    await d.webSocketMessage(w2, JSON.stringify({ t: 'vao', v: 2, ve: 'x', nt: 0 }))
    expect(w2.ma).toBe(MA_DONG.tat)
    expect(CHU_BAN_CU).toMatch(/tải lại trang/)
  })
  it('gói `vao` giao thức 3 với vé đúng ca ⇒ vào được; vé sai ⇒ 4003', async () => {
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
  it('CA ĐÔNG ⇒ NHIỀU PHÒNG: /dau-ion/<ca>/<k> ⇒ phòng k (k 1…7, header x-phong-so); k lạ ⇒ 400; thầy bắt đầu ⇒ đóng đủ 8 phòng song song', async () => {
    const fetch = vi.fn(async (r: Request) => new Response(r.headers.get('x-phong-so'), { status: 200 }))
    const ns = { idFromName: vi.fn((t: string) => ({ toString: () => t })), get: vi.fn(() => ({ fetch })) }
    const env = { MA_BI_MAT: BI_MAT, PHONG_DAU_ION: ns } as unknown as Env
    const ws = { headers: { upgrade: 'websocket' } }
    const r = await vaoPhongDau(new Request('https://x/dau-ion/123456/2', ws), env)
    expect(ns.idFromName).toHaveBeenLastCalledWith('dau-ion:123456:2')
    expect(await r.text()).toBe('2')
    expect((await vaoPhongDau(new Request('https://x/dau-ion/123456/8', ws), env)).status).toBe(400)
    expect((await vaoPhongDau(new Request('https://x/dau-ion/123456/x', ws), env)).status).toBe(400)
    ns.idFromName.mockClear(); fetch.mockClear()
    await dongPhongDau(env, '123456')
    expect(ns.idFromName.mock.calls.map((c) => c[0])).toEqual(['dau-ion:123456', ...Array.from({ length: 7 }, (_, k) => `dau-ion:123456:${k + 1}`)])
    expect(fetch).toHaveBeenCalledTimes(8)
  })
  it('0 lệnh D1: luật phòng và Durable Object không đọc env.DB', async () => {
    const { readFileSync } = await import('node:fs')
    for (const f of ['server/src/dau-ion-phong.ts', 'server/src/phong-dau-ion.ts', 'src/lib/dau-ion/loi.ts']) expect(readFileSync(f, 'utf8')).not.toMatch(/\bDB\b|prepare\(/)
  })
})
