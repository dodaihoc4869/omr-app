// TRÒ «SINH TỒN» phòng chờ Live theo khối (thầy chốt 12/11, đặc tả docs/dac-ta-sinh-ton-1211.md mục 4, 7) — lõi thuần src/lib/live-khoi/sinh-ton-loi.ts.
import { describe, expect, it } from 'vitest'
import {
  AN_YEN_MS, BAT_TU_MS, BK_NV, HOI_CHO_MS, HOI_SINH_MS, LO_GAN, MAU_DAY, TAM_NHIN_X, TAM_NHIN_Y, TAM_XA, TOC_DO, VAN_CHOI_MS, VAN_MS, anVoi, buocToi, capBanDo, chanDuong, chonMucTieu, conLai, dangAn, dangChet,
  dangNghi, diChuyen, docDong, laMay, ngoaiVong, nhanDon, satThuong, taoBanDo, taoToi, timDuong, trongBui, vanSo, vong, type NhanVat,
} from '../src/lib/live-khoi/sinh-ton-loi'

/** Giây thứ 10 của một ván (đang chơi, vòng an toàn còn rộng). */
const T0 = 1000 * VAN_MS + 10_000
const bd = taoBanDo(0)
const nv = (o: Partial<NhanVat> & { id: string }): NhanVat => ({ x: 0, y: 0, mau: 100, doi: 1, cap: 1, t: '', ...o })

describe('bản đồ', () => {
  it('cỡ 0 = 1600 × 1000, đối xứng bốn góc ⇒ bốn đội công bằng', () => {
    expect([bd.rong, bd.cao]).toEqual([1600, 1000])
    const guong = (ds: { x: number; y: number; w: number; h: number }[]) => ds.every((t) =>
      ds.some((u) => u.x === bd.rong - t.x - t.w && u.y === t.y && u.w === t.w) && ds.some((u) => u.y === bd.cao - t.y - t.h && u.x === t.x && u.h === t.h))
    expect(guong(bd.tuong)).toBe(true); expect(guong(bd.thung)).toBe(true); expect(guong(bd.bui)).toBe(true)
    expect(bd.trai).toEqual([{ x: 130, y: 122 }, { x: 1470, y: 122 }, { x: 130, y: 878 }, { x: 1470, y: 878 }])
    // Trại và giữa sân (hộp tiếp tế) không bị vật chặn đè.
    for (const p of [...bd.trai, { x: 800, y: 500 }]) expect(diChuyen(bd, p.x, p.y, 1, 0).x).toBe(p.x + 1)
  })
  it('sĩ số lớn ⇒ sân lớn hơn, cùng mẫu', () => {
    expect([capBanDo(16), capBanDo(24), capBanDo(25), capBanDo(60), capBanDo(61), capBanDo(100)]).toEqual([0, 0, 1, 1, 2, 2])
    const to = taoBanDo(2)
    expect([to.rong, to.cao, to.tuong.length]).toEqual([3200, 2000, bd.tuong.length])
    expect(taoBanDo(7).cap).toBe(0)
  })
  it('ván 90 giây + 5 giây bảng kết quả; vòng an toàn co dần', () => {
    expect(vanSo(T0)).toBe(1000); expect(dangNghi(T0)).toBe(false); expect(conLai(T0)).toBe(80_000)
    expect(dangNghi(1000 * VAN_MS + VAN_CHOI_MS)).toBe(true); expect(conLai(1000 * VAN_MS + VAN_CHOI_MS + 1000)).toBe(0)
    const dau = vong(bd, 1000 * VAN_MS), cuoi = vong(bd, 1000 * VAN_MS + VAN_CHOI_MS)
    expect(ngoaiVong(dau, 20, 20)).toBe(false)
    expect(cuoi.rx).toBeLessThan(dau.rx * 0.4)
    expect(ngoaiVong(cuoi, bd.trai[0].x, bd.trai[0].y)).toBe(true)
    expect(ngoaiVong(cuoi, 800, 500)).toBe(false)
  })
})

describe('tường, thùng, bụi', () => {
  // Tường ngang giữa sân phần tư trên-trái: x 450..620, y 262..306.
  it('tường chắn đường ngắm; không có tường thì thông', () => {
    expect(chanDuong(bd, 535, 240, 535, 330)).toBe(true)
    expect(chanDuong(bd, 400, 240, 400, 330)).toBe(false)
    expect(chanDuong(bd, 440, 284, 630, 284)).toBe(true)
  })
  it('đi vào tường thì bị chặn, đi dọc tường thì trượt; không ra khỏi sân', () => {
    const p = diChuyen(bd, 535, 262 - BK_NV - 1, 3, 6)
    expect(p.y).toBe(262 - BK_NV - 1); expect(p.x).toBe(538)
    expect(diChuyen(bd, BK_NV, 500, -50, 0).x).toBe(BK_NV)
    expect(diChuyen(bd, 800, bd.cao - BK_NV, 0, 50).y).toBe(bd.cao - BK_NV)
  })
  it('bụi là hình bầu dục; đứng trong bụi, không bắn, ở xa ⇒ ẩn với đội khác, đồng đội vẫn thấy', () => {
    // Bụi trên-trái: ô x 340..490, y 150..242 ⇒ tâm (415, 196).
    expect(trongBui(bd, 415, 196)).toBe(true); expect(trongBui(bd, 342, 152)).toBe(false); expect(trongBui(bd, 800, 500)).toBe(false)
    const an = nv({ id: 'A', x: 415, y: 196, doi: 1 })
    expect(anVoi(bd, an, 415 + LO_GAN + 30, 196, 0)).toBe(true)
    expect(anVoi(bd, an, 415 + LO_GAN - 10, 196, 0)).toBe(false) // tới gần thì thấy
    expect(anVoi(bd, { ...an, t: 'X' }, 600, 196, 0)).toBe(false) // vừa bắn thì lộ
    expect(anVoi(bd, an, 600, 196, 1)).toBe(false) // cùng đội
    expect(anVoi(bd, { ...an, x: 800, y: 500 }, 600, 196, 0)).toBe(false) // ngoài bụi
  })
})

describe('súng tự bắn đối thủ gần nhất', () => {
  const toi = { x: 800, y: 700, doi: 0 }
  it('gần nhất, còn máu, khác đội, nằm trong khung nhìn — thấy là bắn, không cần tới sát', () => {
    const ds = [nv({ id: 'xa', x: 800 + 200, y: 700 }), nv({ id: 'gan', x: 800 - 120, y: 700 }), nv({ id: 'dongDoi', x: 810, y: 700, doi: 0 }), nv({ id: 'daHa', x: 805, y: 700, mau: 0 })]
    expect(chonMucTieu(bd, toi, ds)).toBe('gan')
    // Thấy ở mép màn (cách 480) vẫn bắn; ra khỏi khung nhìn thì thôi.
    expect(chonMucTieu(bd, toi, [nv({ id: 'mepMan', x: 800 + TAM_NHIN_X - 20, y: 600 })])).toBe('mepMan')
    expect(chonMucTieu(bd, toi, [nv({ id: 'ngoaiNgang', x: 800 + TAM_NHIN_X + 5, y: 700 })])).toBe('')
    expect(chonMucTieu(bd, toi, [nv({ id: 'ngoaiDoc', x: 800, y: 700 - TAM_NHIN_Y - 5 })])).toBe('')
    // Máy em truyền đúng khung màn của mình: ngoài khung ⇒ không bắn, trong khung ⇒ bắn.
    const khung = { x0: 500, y0: 600, x1: 1100, y1: 900 }
    expect(chonMucTieu(bd, toi, [nv({ id: 'trenMan', x: 1090, y: 610 })], khung)).toBe('trenMan')
    expect(chonMucTieu(bd, toi, [nv({ id: 'ngoaiMan', x: 1110, y: 700 })], khung)).toBe('')
    expect(TAM_XA).toBeGreaterThan(Math.hypot(TAM_NHIN_X, TAM_NHIN_Y))
  })
  it('tường chắn ⇒ không bắn; đối thủ ẩn trong bụi ⇒ không bắn', () => {
    expect(chonMucTieu(bd, { x: 535, y: 330, doi: 0 }, [nv({ id: 'sauTuong', x: 535, y: 240 })])).toBe('')
    expect(chonMucTieu(bd, { x: 415 + 150, y: 196, doi: 0 }, [nv({ id: 'trongBui', x: 415, y: 196 })])).toBe('')
    expect(chonMucTieu(bd, { x: 415 + 150, y: 196, doi: 0 }, [nv({ id: 'trongBui', x: 415, y: 196, t: 'ai-do' })])).toBe('trongBui')
  })
})

describe('sát thương (bên bị bắn tự tính từ ảnh chụp)', () => {
  const toi = { id: 'T', x: 800, y: 700, doi: 0 }
  it('cấp súng càng cao càng mất nhiều máu; máy bắn yếu hơn người; đồng đội và kẻ đã bị hạ không gây sát thương', () => {
    const mat = (o: Partial<NhanVat> & { id: string }) => satThuong(toi, [nv({ x: 900, y: 700, t: 'T', ...o })], 1).tong
    expect([mat({ id: 'A', cap: 1 }), mat({ id: 'A', cap: 2 }), mat({ id: 'A', cap: 3 }), mat({ id: 'A', cap: 4 })]).toEqual([30, 40, 50, 60])
    expect(mat({ id: '~3', cap: 1 })).toBeCloseTo(20.1, 1)
    expect(laMay('~3')).toBe(true); expect(laMay('S3')).toBe(false)
    expect(mat({ id: 'A', doi: 0 })).toBe(0); expect(mat({ id: 'A', mau: 0 })).toBe(0); expect(mat({ id: 'A', t: 'nguoi-khac' })).toBe(0)
  })
  it('ĐỒNG ĐỘI KHÔNG HẠ ĐƯỢC NHAU (thầy 12/11): không ngắm, không trúng đạn thẳng, không dính tia nảy hay nổ lan của đồng đội', () => {
    const dongDoi = (cap: number, t: string) => nv({ id: 'D', x: 860, y: 700, doi: 0, cap, t })
    // Súng không bao giờ chọn đồng đội, kể cả khi đứng sát và không có ai khác.
    expect(chonMucTieu(bd, toi, [nv({ id: 'D', x: 820, y: 700, doi: 0 })])).toBe('')
    // Đồng đội có khai nhầm đang bắn mình (gói sai / máy lệch đội) thì vẫn không mất máu, ở mọi cấp súng.
    for (const cap of [1, 2, 3, 4]) expect(satThuong(toi, [dongDoi(cap, 'T')], 1)).toEqual({ tong: 0, ai: '' })
    // Đồng đội bắn Súng Sấm / Pháo Sao vào đối thủ đứng sát mình: tia nảy và nổ lan không chạm mình.
    const doiThu = nv({ id: 'X', x: 830, y: 700, doi: 2 })
    expect(satThuong(toi, [dongDoi(3, 'X'), doiThu], 1).tong).toBe(0)
    expect(satThuong(toi, [dongDoi(4, 'X'), doiThu], 1).tong).toBe(0)
  })
  it('nhiều kẻ cùng bắn ⇒ cộng dồn; `ai` = kẻ gây nhiều nhất', () => {
    const kq = satThuong(toi, [nv({ id: 'A', x: 900, y: 700, t: 'T', cap: 1 }), nv({ id: 'B', x: 700, y: 700, t: 'T', cap: 3, doi: 2 })], 0.25)
    expect(kq.tong).toBeCloseTo((30 + 50) * 0.25); expect(kq.ai).toBe('B')
  })
  it('Súng Sấm nảy sang MỘT đối thủ gần mục tiêu nhất; Pháo Sao nổ lan quanh mục tiêu — đều nửa sát thương', () => {
    const mt = nv({ id: 'M', x: 865, y: 700, doi: 0 }) // đồng đội của T đang bị bắn, cách T 65
    expect(satThuong(toi, [nv({ id: 'A', x: 1000, y: 700, t: 'M', cap: 3 }), mt], 1).tong).toBe(25)
    // Có đồng đội khác đứng gần mục tiêu hơn ⇒ tia nảy sang bạn ấy, không sang T.
    expect(satThuong(toi, [nv({ id: 'A', x: 1000, y: 700, t: 'M', cap: 3 }), mt, nv({ id: 'N', x: 885, y: 700, doi: 0 })], 1).tong).toBe(0)
    expect(satThuong(toi, [nv({ id: 'A', x: 1000, y: 700, t: 'M', cap: 4 }), mt], 1).tong).toBe(0) // phải trong 60 mới dính nổ lan
    expect(satThuong(toi, [nv({ id: 'A', x: 1000, y: 700, t: 'M', cap: 4 }), { ...mt, x: 850 }], 1).tong).toBe(30)
    expect(satThuong(toi, [nv({ id: 'A', x: 1000, y: 700, t: 'M', cap: 2 }), mt], 1).tong).toBe(0)
  })
})

describe('bé ma của em', () => {
  it('hồi sinh ở trại đội, 2 giây đầu không mất máu; hết máu ⇒ bị hạ 3 giây rồi về trại với súng cấp 1', () => {
    let tt = taoToi(bd, 3, T0, 0)
    expect(Math.hypot(tt.x - bd.trai[3].x, tt.y - bd.trai[3].y)).toBeLessThan(70)
    expect(nhanDon(tt, 50, T0 + BAT_TU_MS - 1).mau).toBe(MAU_DAY)
    tt = { ...nhanDon(tt, 50, T0 + BAT_TU_MS), cap: 4 }
    expect(tt.mau).toBe(50)
    tt = nhanDon(tt, 60, T0 + BAT_TU_MS + 250)
    expect(tt.mau).toBe(0); expect(dangChet(tt, T0 + BAT_TU_MS + 300)).toBe(true)
    expect(nhanDon(tt, 60, T0 + BAT_TU_MS + 500)).toBe(tt) // đang bị hạ thì không trúng thêm
    const lucSong = T0 + BAT_TU_MS + 250 + HOI_SINH_MS
    expect(buocToi(bd, tt, { dx: 1, dy: 0 }, 16, lucSong - 1)).toBe(tt)
    const song = buocToi(bd, tt, { dx: 0, dy: 0 }, 16, lucSong, 0)
    expect([song.mau, song.cap, dangChet(song, lucSong)]).toEqual([MAU_DAY, 1, false])
    expect(Math.hypot(song.x - bd.trai[3].x, song.y - bd.trai[3].y)).toBeLessThan(70)
  })
  it('vuốt ⇒ chạy đúng tốc độ; 3 giây không trúng đạn ⇒ máu hồi dần; ngoài vòng ⇒ mất máu', () => {
    let tt = { ...taoToi(bd, 0, T0), x: 800, y: 700, mau: 40, lucTrung: T0, batTuDen: 0 }
    const di = buocToi(bd, tt, { dx: 1, dy: 0 }, 100, T0 + 100)
    expect(di.x).toBeCloseTo(800 + TOC_DO * 0.1); expect(di.lucDong).toBe(T0 + 100)
    expect(buocToi(bd, tt, { dx: 0, dy: 0 }, 100, T0 + HOI_CHO_MS - 100).mau).toBe(40)
    expect(buocToi(bd, tt, { dx: 0, dy: 0 }, 100, T0 + HOI_CHO_MS).mau).toBeCloseTo(41.5)
    // Cuối ván vòng co về giữa: đứng ở trại là ngoài vòng.
    const cuoi = 1000 * VAN_MS + VAN_CHOI_MS - 1000
    tt = { ...tt, x: bd.trai[0].x, y: bd.trai[0].y, lucTrung: 0 }
    expect(buocToi(bd, tt, { dx: 0, dy: 0 }, 100, cuoi).mau).toBeCloseTo(39.2)
  })
  it('đứng yên trong bụi ⇒ súng ngừng bắn để ẩn; còn di chuyển thì chưa', () => {
    const tt = { ...taoToi(bd, 0, T0), x: 415, y: 196, lucDong: T0 }
    expect(dangAn(bd, tt, T0 + AN_YEN_MS - 1)).toBe(false); expect(dangAn(bd, tt, T0 + AN_YEN_MS)).toBe(true)
    expect(dangAn(bd, { ...tt, x: 800, y: 500 }, T0 + 5000)).toBe(false)
  })
  it('chạm để tới: đường vòng qua tường, không khúc nào cắt tường; đi theo đường thì tới đích', () => {
    // Từ dưới tường ngang lên ngay trên tường: đường thẳng bị chắn.
    const duong = timDuong(bd, 535, 340, 535, 230)
    expect(duong.length).toBeGreaterThan(1)
    expect(duong.at(-1)).toEqual({ x: 535, y: 230 })
    let x = 535, y = 340
    for (const d of duong) { expect(chanDuong(bd, x, y, d.x, d.y)).toBe(false); x = d.x; y = d.y }
    let tt = { ...taoToi(bd, 0, T0), x: 535, y: 340, duong }
    for (let i = 1; i <= 80 && tt.duong.length; i++) tt = buocToi(bd, tt, { dx: 0, dy: 0 }, 50, T0 + i * 50)
    expect([Math.round(tt.x), Math.round(tt.y), tt.duong.length]).toEqual([535, 230, 0])
    // Chạm vào giữa tường ⇒ tới ô trống gần nhất; vuốt thì bỏ đường đang chạy.
    expect(timDuong(bd, 535, 340, 535, 284).length).toBeGreaterThan(0)
    expect(buocToi(bd, { ...tt, duong }, { dx: 1, dy: 0 }, 16, T0).duong).toEqual([])
  })
  it('đọc dòng ảnh chụp: dòng hỏng ⇒ bỏ; kẹp đội và cấp', () => {
    expect(docDong('A', [10, 20, 55, 9, 7, 'B'])).toEqual({ id: 'A', x: 10, y: 20, mau: 55, doi: 3, cap: 4, t: 'B' })
    expect(docDong('A', [10, 20, 55, 1, 2] as never)?.t).toBe('')
    expect(docDong('A', [10, 'x', 55, 1, 2, ''] as never)).toBeNull(); expect(docDong('A', undefined)).toBeNull()
  })
})
