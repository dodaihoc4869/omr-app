// TRÒ «SINH TỒN» phòng chờ Live theo khối (thầy chốt 12/11, đặc tả docs/dac-ta-sinh-ton-1211.md mục 4, 7) — lõi thuần src/lib/live-khoi/sinh-ton-loi.ts.
import { describe, expect, it } from 'vitest'
import {
  AN_YEN_MS, BAT_TU_MS, BK_NV, DAN_BAY_MS, HOI_CHO_MS, HOI_SINH_MS, LO_GAN, MAU_DAY, NHIP_BAN_MS, TAM_NHIN_X, TAM_NHIN_Y, TAM_XA, TOC_DO, VAN_CHOI_MS, VAN_MS, anVoi, buocToi, capBanDo, chanDuong, chonMucTieu, conLai, dangAn, dangChet,
  SO_CO_SAN, choTrai, dangNghi, diChuyen, docDong, laMay, ngoaiVong, nhanDon, satThuong, taoBanDo, taoToi, timDuong, trongBui, vanSo, vong, type NhanVat,
} from '../src/lib/live-khoi/sinh-ton-loi'

/** Giây thứ 10 của một ván (đang chơi, vòng an toàn còn rộng). */
const T0 = 1000 * VAN_MS + 10_000
const bd = taoBanDo(0)
const nv = (o: Partial<NhanVat> & { id: string }): NhanVat => ({ x: 0, y: 0, mau: 100, doi: 1, cap: 1, t: '', ...o })

describe('bản đồ', () => {
  it('cỡ 0 = 3200 × 2000 (bản 2: ghép 2 × 2 trang), đối xứng bốn góc ⇒ bốn đội công bằng', () => {
    expect([bd.rong, bd.cao, bd.ngang, bd.doc]).toEqual([3200, 2000, 2, 2])
    const guong = (ds: { x: number; y: number; w: number; h: number }[]) => ds.every((t) =>
      ds.some((u) => u.x === bd.rong - t.x - t.w && u.y === t.y && u.w === t.w) && ds.some((u) => u.y === bd.cao - t.y - t.h && u.x === t.x && u.h === t.h))
    expect(guong(bd.tuong)).toBe(true); expect(guong(bd.thung)).toBe(true); expect(guong(bd.bui)).toBe(true)
    expect(bd.trai).toEqual([{ x: 130, y: 122 }, { x: 3070, y: 122 }, { x: 130, y: 1878 }, { x: 3070, y: 1878 }])
    // Trại và giữa sân (hộp tiếp tế) không bị vật chặn đè.
    for (const p of [...bd.trai, { x: 1600, y: 1000 }]) expect(diChuyen(bd, p.x, p.y, 1, 0).x).toBe(p.x + 1)
  })
  // Thầy 13/11: «Tùy theo số lượng hs thì bản đồ được mở rộng ra hơn để chơi cho thú vị».
  it('sĩ số lớn ⇒ sân mở rộng theo năm cỡ; mọi cỡ GHÉP trang 1600 × 1000 (thêm chỗ nấp), không phóng to', () => {
    expect([16, 20, 21, 36, 37, 64, 65, 96, 97, 300].map(capBanDo)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4])
    expect(SO_CO_SAN).toBe(5)
    expect([0, 1, 2, 3, 4].map((c) => { const b = taoBanDo(c); return [b.cap, b.rong, b.cao, b.ngang, b.doc] }))
      .toEqual([[0, 3200, 2000, 2, 2], [1, 4800, 2000, 3, 2], [2, 4800, 3000, 3, 3], [3, 6400, 3000, 4, 3], [4, 6400, 4000, 4, 4]])
    // Cỡ 0..4 = ghép 4 · 6 · 9 · 12 · 16 trang, vật chặn giữ nguyên cỡ ⇒ số tường / thùng / bụi nhân theo số trang.
    const mot = [bd.tuong.length / 4, bd.thung.length / 4, bd.bui.length / 4]
    for (const [c, trang] of [[0, 4], [1, 6], [2, 9], [3, 12], [4, 16]] as const) {
      const b = taoBanDo(c)
      expect([b.tuong.length, b.thung.length, b.bui.length]).toEqual(mot.map((n) => n * trang))
      expect(b.tuong[0].w).toBe(bd.tuong[0].w)
    }
    for (const c of [7, -1, 1.5, Number.NaN]) expect(taoBanDo(c).cap).toBe(0)
  })
  it('mọi cỡ sân: đối xứng hai trục, trại ở bốn góc ngoài, trại + giữa sân không bị chặn, bốn trại và giữa sân thông nhau trên lưới tìm đường', () => {
    for (let c = 0; c < SO_CO_SAN; c++) {
      const b = taoBanDo(c)
      const gan = (a: number, d: number) => Math.abs(a - d) < 1e-6
      const guong = (ds: { x: number; y: number; w: number; h: number }[]) => ds.every((t) =>
        ds.some((u) => gan(u.x, b.rong - t.x - t.w) && gan(u.y, t.y) && gan(u.w, t.w) && gan(u.h, t.h)) && ds.some((u) => gan(u.y, b.cao - t.y - t.h) && gan(u.x, t.x) && gan(u.w, t.w) && gan(u.h, t.h)))
      expect(guong(b.tuong), `tường cỡ ${c}`).toBe(true); expect(guong(b.thung), `thùng cỡ ${c}`).toBe(true); expect(guong(b.bui), `bụi cỡ ${c}`).toBe(true)
      // Không vật nào thò ra ngoài sân.
      for (const v of [...b.chan, ...b.bui]) expect(v.x >= 0 && v.y >= 0 && v.x + v.w <= b.rong && v.y + v.h <= b.cao, `vật trong sân cỡ ${c}`).toBe(true)
      const he = b.trai[0].x / 130
      expect(b.trai).toEqual([{ x: 130 * he, y: 122 * he }, { x: b.rong - 130 * he, y: 122 * he }, { x: 130 * he, y: b.cao - 122 * he }, { x: b.rong - 130 * he, y: b.cao - 122 * he }])
      const giua = { x: b.rong / 2, y: b.cao / 2 }
      for (const p of [...b.trai, giua]) expect(diChuyen(b, p.x, p.y, 1, 0).x, `điểm trống cỡ ${c}`).toBe(p.x + 1)
      // Loang trên lưới từ trại đội 0: phải tới ba trại kia và giữa sân (máy bù tìm được đường, không đội nào bị nhốt).
      const O = 40 // ô lưới tìm đường của lõi
      const o = (p: { x: number; y: number }) => Math.min(b.hang - 1, Math.floor(p.y / O)) * b.cot + Math.min(b.cot - 1, Math.floor(p.x / O))
      const tham = new Uint8Array(b.cot * b.hang), hang: number[] = [o(b.trai[0])]
      tham[hang[0]] = 1
      while (hang.length) {
        const k = hang.pop()!, i = k % b.cot, j = (k - i) / b.cot
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = i + di, y = j + dj, m = y * b.cot + x
          if (x < 0 || y < 0 || x >= b.cot || y >= b.hang || tham[m] || b.luoi[m]) continue
          tham[m] = 1; hang.push(m)
        }
      }
      for (const p of [...b.trai, giua]) expect(tham[o(p)], `thông đường cỡ ${c}`).toBe(1)
      // Máy bù tìm được đường thật từ trại ra giữa sân.
      expect(timDuong(b, b.trai[0].x, b.trai[0].y, giua.x, giua.y).length, `tìm đường cỡ ${c}`).toBeGreaterThan(0)
    }
  })
  it('trại đã ngoài vòng an toàn (cuối ván) ⇒ hồi sinh ngay trong vòng, phía trại mình, không kẹt vật chặn — sân lớn không phải chạy bộ qua vùng mất máu', () => {
    const cuoiVan = 1000 * VAN_MS + VAN_CHOI_MS - 5000
    for (let c = 0; c < SO_CO_SAN; c++) {
      const b = taoBanDo(c), v = vong(b, cuoiVan)
      for (let doi = 0; doi < 4; doi++) for (const hat of [0, 0.3, 0.7]) {
        const toi = taoToi(b, doi, cuoiVan, hat), trai = b.trai[doi]
        expect(ngoaiVong(v, trai.x, trai.y), `trại ngoài vòng cỡ ${c}`).toBe(true)
        expect(ngoaiVong(v, toi.x, toi.y), `hồi sinh trong vòng cỡ ${c} đội ${doi}`).toBe(false)
        // Vẫn ở góc phần tư của trại mình.
        expect(Math.sign(toi.x - b.rong / 2)).toBe(Math.sign(trai.x - b.rong / 2)); expect(Math.sign(toi.y - b.cao / 2)).toBe(Math.sign(trai.y - b.cao / 2))
        // Không kẹt: nhích được ít nhất một hướng.
        expect([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const p = diChuyen(b, toi.x, toi.y, dx * 6, dy * 6); return Math.hypot(p.x - toi.x, p.y - toi.y) > 5 }), `không kẹt cỡ ${c} đội ${doi}`).toBe(true)
      }
    }
    // Đầu ván (vòng còn kín sân): vẫn hồi sinh đúng trại.
    const dau = taoToi(bd, 0, T0, 0)
    expect([dau.x, dau.y]).toEqual([130 + 66, 122])
  })
  it('ván 2 phút + 5 giây bảng kết quả; vòng an toàn co dần', () => {
    expect([VAN_CHOI_MS, VAN_MS]).toEqual([120_000, 125_000])
    expect(vanSo(T0)).toBe(1000); expect(dangNghi(T0)).toBe(false); expect(conLai(T0)).toBe(110_000)
    expect(dangNghi(1000 * VAN_MS + VAN_CHOI_MS)).toBe(true); expect(conLai(1000 * VAN_MS + VAN_CHOI_MS + 1000)).toBe(0)
    const dau = vong(bd, 1000 * VAN_MS), cuoi = vong(bd, 1000 * VAN_MS + VAN_CHOI_MS)
    expect(ngoaiVong(dau, 20, 20)).toBe(false)
    expect(cuoi.rx).toBeLessThan(dau.rx * 0.4)
    expect(ngoaiVong(cuoi, bd.trai[0].x, bd.trai[0].y)).toBe(true)
    expect(ngoaiVong(cuoi, bd.rong / 2, bd.cao / 2)).toBe(false)
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
    expect([1, 2, 3, 4, 5, 6].map((cap) => mat({ id: 'A', cap }))).toEqual([34, 42, 50, 58, 66, 74])
    expect(mat({ id: '~3-0', cap: 1 })).toBeCloseTo(22.78, 1)
    // Nhịp bắn: Hạt / Đôi / Sấm 4 phát / giây, Bọt và Lửa Màu thưa hơn, Pháo Sao 0,7 giây một phát; đạn tới đích trước phát kế.
    expect([...NHIP_BAN_MS]).toEqual([250, 250, 340, 250, 280, 700])
    for (let i = 0; i < 6; i++) expect(DAN_BAY_MS[i]).toBeLessThan(NHIP_BAN_MS[i])
    expect(laMay('~3-0')).toBe(true); expect(laMay('S3')).toBe(false)
    expect(mat({ id: 'A', doi: 0 })).toBe(0); expect(mat({ id: 'A', mau: 0 })).toBe(0); expect(mat({ id: 'A', t: 'nguoi-khac' })).toBe(0)
  })
  it('ĐỒNG ĐỘI KHÔNG HẠ ĐƯỢC NHAU (thầy 12/11): không ngắm, không trúng đạn thẳng, không dính tia nảy hay nổ lan của đồng đội', () => {
    const dongDoi = (cap: number, t: string) => nv({ id: 'D', x: 860, y: 700, doi: 0, cap, t })
    // Súng không bao giờ chọn đồng đội, kể cả khi đứng sát và không có ai khác.
    expect(chonMucTieu(bd, toi, [nv({ id: 'D', x: 820, y: 700, doi: 0 })])).toBe('')
    // Đồng đội có khai nhầm đang bắn mình (gói sai / máy lệch đội) thì vẫn không mất máu, ở mọi cấp súng.
    for (const cap of [1, 2, 3, 4, 5, 6]) expect(satThuong(toi, [dongDoi(cap, 'T')], 1)).toEqual({ tong: 0, ai: '', chay: '' })
    // Đồng đội bắn Súng Bọt / Sấm / Lửa Màu / Pháo Sao vào đối thủ đứng sát mình: bọt vỡ, tia nảy, lửa và nổ lan không chạm mình.
    const doiThu = nv({ id: 'X', x: 830, y: 700, doi: 2 })
    for (const cap of [3, 4, 5, 6]) expect(satThuong(toi, [dongDoi(cap, 'X'), doiThu], 1), `cấp ${cap}`).toEqual({ tong: 0, ai: '', chay: '' })
  })
  it('nhiều kẻ cùng bắn ⇒ cộng dồn; `ai` = kẻ gây nhiều nhất', () => {
    const kq = satThuong(toi, [nv({ id: 'A', x: 900, y: 700, t: 'T', cap: 1 }), nv({ id: 'B', x: 700, y: 700, t: 'T', cap: 3, doi: 2 })], 0.25)
    expect(kq.tong).toBeCloseTo((34 + 50) * 0.25); expect(kq.ai).toBe('B')
  })
  it('Súng Sấm (cấp 4) nảy sang MỘT đối thủ gần mục tiêu nhất; Pháo Sao (cấp 6) nổ lan quanh mục tiêu — đều nửa sát thương', () => {
    const mt = nv({ id: 'M', x: 865, y: 700, doi: 0 }) // đồng đội của T đang bị bắn, cách T 65
    expect(satThuong(toi, [nv({ id: 'A', x: 1000, y: 700, t: 'M', cap: 4 }), mt], 1).tong).toBe(29)
    // Có đồng đội khác đứng gần mục tiêu hơn ⇒ tia nảy sang bạn ấy, không sang T.
    expect(satThuong(toi, [nv({ id: 'A', x: 1000, y: 700, t: 'M', cap: 4 }), mt, nv({ id: 'N', x: 885, y: 700, doi: 0 })], 1).tong).toBe(0)
    expect(satThuong(toi, [nv({ id: 'A', x: 1000, y: 700, t: 'M', cap: 6 }), mt], 1).tong).toBe(0) // phải trong 60 mới dính nổ lan
    expect(satThuong(toi, [nv({ id: 'A', x: 1000, y: 700, t: 'M', cap: 6 }), { ...mt, x: 850 }], 1).tong).toBe(37)
    // Cấp 1, 2 và Lửa Màu (5) không lan.
    for (const cap of [1, 2, 5]) expect(satThuong(toi, [nv({ id: 'A', x: 1000, y: 700, t: 'M', cap }), { ...mt, x: 830 }], 1).tong, `cấp ${cap}`).toBe(0)
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
    // Về phía trại đội (sân bản 2 lớn hơn: giây thứ 15 trại góc đã ngoài vòng ⇒ hồi sinh ở mép trong vòng, phía trại mình — luật `choTrai(…, nay)`).
    expect({ x: song.x, y: song.y }).toEqual(choTrai(bd, 3, 0, lucSong))
    expect(song.x > bd.rong / 2 && song.y > bd.cao / 2).toBe(true)
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
    expect(docDong('A', [10, 20, 55, 9, 7, 'B'])).toEqual({ id: 'A', x: 10, y: 20, mau: 55, doi: 3, cap: 6, t: 'B' })
    expect(docDong('A', [10, 20, 55, 1, 0, ''])?.cap).toBe(1); expect(docDong('A', [10, 20, 55, 1, 5, ''])?.cap).toBe(5)
    expect(docDong('A', [10, 20, 55, 1, 2] as never)?.t).toBe('')
    expect(docDong('A', [10, 'x', 55, 1, 2, ''] as never)).toBeNull(); expect(docDong('A', undefined)).toBeNull()
  })
})
