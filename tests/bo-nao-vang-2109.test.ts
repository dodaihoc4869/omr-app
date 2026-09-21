// BỘ NÃO — LỜI MỜI QUAY LẠI CHO EM VẮNG 2–4 NGÀY DO THUẬT TOÁN SOẠN (`src/lib/bo-nao-vang.ts`, Code 1, 21/09/2026). Đích của Boss: token ≤ 500 nghìn/đêm (lượt thật đầu: ≈ 1,62 triệu).
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { CAC_MAU_MOI_VANG, VANG_TU_DONG_DEN, VANG_TU_DONG_TU, laVangTuDong, soanLoiMoiVang } from '../src/lib/bo-nao-vang'
import { CO_BO_NAO, HANH_DONG_CHO_THAY, HANH_DONG_DANG, HAN_MUC_BO_NAO, KHI_NAO_VIET_PHU_HUYNH, kiemKhuon, lamSachDauRa, timSoTrongChu, type DauRaEm, type TheDeKiem } from '../src/lib/bo-nao-khuon'
import { dieuChinhTuDauRa } from '../src/lib/bo-nao-khuon'

const NGAY = '2026-09-22'
/** Thẻ vắng thật (dạng máy chủ dựng): vắng `n` ngày, làm `lam7` câu / đúng `dung7` câu trong 7 ngày trước. */
const theVang = (n: number, lam7 = 12, dung7 = 8, o: Record<string, unknown> = {}) => ({
  ngay: NGAY,
  maDang: ['ESTE.THUY_PHAN'],
  bacCuaMaDang: [1],
  hoatDong: { ngayCoBai7: 3, soNgayVang: n, soNgayTuLucDau: 30 },
  cau: { lam7, dung7, sai7: lam7 - dung7, tiLe7: lam7 ? dung7 / lam7 : null, lam3: 0, tiLe3: null, lam4Truoc: lam7, lamHomQua: 0, dungHomQua: 0 },
  xuHuong: 'on',
  giay: { trungVi7: 40, homQua: null },
  nguon: { btvn7: lam7, btvn2: 0, onLai7: 0, game7: 0, khac7: 0 },
  chuoi: 0,
  datNgay7: 0,
  ngayNghi7: 0,
  btvn: { baiMo: 0, changXong: 0, tongChang: null },
  noOn: 0,
  exp: { tong: null, cap: null },
  ca: null,
  dangChuY: [],
  co: [],
  mocDangKhen: [],
  luotSoiKyTuan: false,
  khiNaoVietPhuHuynh: n >= 3 ? ['vang_3_ngay'] : [],
  loiNhanGanDay: [] as string[],
  homQuaDc: null,
  ...o,
})
const kiem = (d: unknown, the: Record<string, unknown>, biDanh = 'E001') => kiemKhuon(d, { ...the, biDanh } as TheDeKiem)

describe('diện áp dụng', () => {
  it('chỉ em vắng 2–4 ngày; 1 ngày (chưa vắng) và ≥ 5 ngày (AI xem, có gợi ý nhắn phụ huynh) không thuộc diện', () => {
    expect([VANG_TU_DONG_TU, VANG_TU_DONG_DEN]).toEqual([2, 4])
    for (const n of [2, 3, 4]) expect(laVangTuDong(theVang(n)), String(n)).toBe(true)
    for (const n of [0, 1, 5, 6, 30]) expect(laVangTuDong(theVang(n)), String(n)).toBe(false)
    for (const x of [null, undefined, 5, 'x', {}, { hoatDong: null }, { hoatDong: { soNgayVang: '3' } }, { hoatDong: { soNgayVang: NaN } }]) expect(laVangTuDong(x)).toBe(false)
    expect(soanLoiMoiVang(theVang(5), 'E001', NGAY)).toBeNull()
    expect(soanLoiMoiVang(theVang(1), 'E001', NGAY)).toBeNull()
    expect(soanLoiMoiVang(theVang(3), '', NGAY)).toBeNull()
    expect(soanLoiMoiVang(null, 'E001', NGAY)).toBeNull()
  })
})

describe('MẪU: 8 mẫu, mỗi mẫu qua kiemKhuon với thẻ thật; số đều lấy từ thẻ', () => {
  it('có đúng 8 mẫu (Boss: 6–8), mã khác nhau, lời khác nhau', () => {
    expect(CAC_MAU_MOI_VANG).toHaveLength(8)
    expect(new Set(CAC_MAU_MOI_VANG.map((m) => m.ma)).size).toBe(8)
    const lời = CAC_MAU_MOI_VANG.map((m) => m.viet(3, 12, 8))
    expect(new Set(lời).size).toBe(8)
  })
  it('MỖI mẫu × số ngày vắng 2, 3, 4: hợp lệ với kiemKhuon (0 từ cấm, ≤ 160 ký tự, mọi số có trong thẻ), không cảnh báo, không tên/SBD', () => {
    for (const m of CAC_MAU_MOI_VANG)
      for (const n of [2, 3, 4]) {
        const the = theVang(n)
        const loi = m.viet(n, 12, 8)
        const d = { ...soanLoiMoiVang(the, 'E001', NGAY)!, loiNhanChoEm: loi }
        const k = kiem(d, the)
        expect(k.hopLe, `${m.ma} n=${n}: ${loi} ${JSON.stringify(k.lyDo)}`).toBe(true)
        expect(k.canhBao, `${m.ma} n=${n}`).toBeUndefined()
        expect(Array.from(loi).length, m.ma).toBeLessThanOrEqual(HAN_MUC_BO_NAO.LOI_NHAN_TOI_DA)
        for (const so of timSoTrongChu(loi)) expect(['2', '3', '4', '12', '8']).toContain(so)
      }
  })
  it('mẫu cần số (m4: câu làm tuần trước, m6: câu đúng) chỉ dùng khi thẻ CÓ số ấy (> 0); thiếu ⇒ chỉ 6 mẫu còn lại', () => {
    const co = new Set<string>()
    for (let i = 0; i < 400; i++) co.add(soanLoiMoiVang(theVang(3), `E${i}`, NGAY)!.loiNhanChoEm as string)
    expect([...co].some((l) => l.includes('Tuần trước em đã làm 12 câu'))).toBe(true)
    expect([...co].some((l) => l.includes('Trước khi nghỉ em đã đúng 8 câu'))).toBe(true)
    const thieu = new Set<string>()
    for (let i = 0; i < 400; i++) thieu.add(soanLoiMoiVang(theVang(3, 0, 0), `E${i}`, NGAY)!.loiNhanChoEm as string)
    expect(thieu.size).toBe(6)
    for (const l of thieu) {
      expect(l).not.toContain('Tuần trước em đã làm')
      expect(l).not.toContain('Trước khi nghỉ em đã đúng')
    }
    const khongCau = soanLoiMoiVang({ ...theVang(3), cau: undefined }, 'E001', NGAY)!
    expect(khongCau.loiNhanChoEm).toMatch(/3 ngày/)
    expect(kiem(khongCau, { ...theVang(3), cau: undefined }).hopLe).toBe(true)
  })
})

describe('PHẦN TỬ soạn ra: đúng khuôn, hợp lệ, một chặng ngắn, không có lời phụ huynh', () => {
  it('cấu trúc: nhịp −2, khởi động 3, không dạng, không khắc phục, không cờ, không lời phụ huynh/thư tuần, doTinCay 0,7 (≥ ngưỡng áp dụng), canSau false', () => {
    const the = theVang(3)
    const d = soanLoiMoiVang(the, 'E017', NGAY)! as unknown as DauRaEm
    expect(d).toMatchObject({ biDanh: 'E017', doTinCay: 0.7, nhip: { lech: -2, khoiDong: 3 }, dang: [], khacPhuc: [], co: 'khong', loiNhanChoPhuHuynh: '', thuTuan: '', canSau: false })
    expect(d.goiYChoThay).toEqual({ chu: '', hanhDong: 'khong', dang: '' })
    expect(d.doTinCay).toBeGreaterThanOrEqual(HAN_MUC_BO_NAO.NGUONG_TIN_CAY)
    expect(kiem(d, the, 'E017')).toEqual({ hopLe: true, lyDo: [] })
    expect(lamSachDauRa(d, kiem(d, the, 'E017')).loiNhanChoEm).toBe(d.loiNhanChoEm)
    // đi vào lõi BTVN thành cổng nhịp −2, khởi động 3 (không núm dạng)
    expect(dieuChinhTuDauRa(d)).toMatchObject({ nhip: -2, khoiDong: 3 })
  })
  it('THUẬT TOÁN, TẤT ĐỊNH: cùng (thẻ, bí danh, ngày) ⇒ cùng lời; đổi bí danh hoặc ngày ⇒ có thể khác; không sửa thẻ', () => {
    const the = theVang(3)
    const truoc = JSON.stringify(the)
    expect(soanLoiMoiVang(the, 'E001', NGAY)).toEqual(soanLoiMoiVang(the, 'E001', NGAY))
    expect(JSON.stringify(the)).toBe(truoc)
    const khac = new Set<string>()
    for (let i = 0; i < 40; i++) khac.add(soanLoiMoiVang(the, 'E001', `2026-10-${String(i % 28 + 1).padStart(2, '0')}`)!.loiNhanChoEm as string)
    expect(khac.size).toBeGreaterThan(3) // ngày khác nhau ⇒ mẫu luân phiên
  })
  it('LUÂN PHIÊN đều: 800 em cùng ngày ⇒ mọi mẫu được dùng, không mẫu nào chiếm quá 25 %', () => {
    const dem = new Map<string, number>()
    for (let i = 0; i < 800; i++) {
      const l = soanLoiMoiVang(theVang(3), `E${String(i).padStart(3, '0')}`, NGAY)!.loiNhanChoEm as string
      dem.set(l.slice(0, 20), (dem.get(l.slice(0, 20)) ?? 0) + 1)
    }
    expect(dem.size).toBeGreaterThanOrEqual(7) // m1 và m8 cùng mở "Em ơi," có thể gộp khoá 20 ký tự
    for (const [k, v] of dem) expect(v, k).toBeLessThan(200)
  })
  it('KHÔNG LẶP cách mở đầu của lời gần nhất: bỏ mẫu trùng 24 ký tự đầu với ≤ 3 lời trước (khi còn mẫu khác)', () => {
    const the = theVang(3)
    const goc = soanLoiMoiVang(the, 'E001', NGAY)!.loiNhanChoEm as string
    const gan = { ...the, loiNhanGanDay: [goc] }
    const tiep = soanLoiMoiVang(gan, 'E001', NGAY)!.loiNhanChoEm as string
    expect(Array.from(tiep).slice(0, 24).join('')).not.toBe(Array.from(goc).slice(0, 24).join(''))
    // dù đêm nào cũng không lặp lại lời hôm qua
    for (let i = 0; i < 60; i++) {
      const ngay = `2026-11-${String(i % 28 + 1).padStart(2, '0')}`
      const a = soanLoiMoiVang(the, 'E009', ngay)!.loiNhanChoEm as string
      const b = soanLoiMoiVang({ ...the, loiNhanGanDay: [a] }, 'E009', ngay)!.loiNhanChoEm as string
      expect(Array.from(b).slice(0, 24).join('')).not.toBe(Array.from(a).slice(0, 24).join(''))
    }
    // cả 3 lời gần nhất: cũng tránh
    const ba = { ...the, loiNhanGanDay: CAC_MAU_MOI_VANG.slice(0, 3).map((m) => m.viet(3, 12, 8)) }
    for (let i = 0; i < 50; i++) {
      const l = soanLoiMoiVang(ba, `E${i}`, NGAY)!.loiNhanChoEm as string
      for (const g of ba.loiNhanGanDay) expect(Array.from(l).slice(0, 24).join('')).not.toBe(Array.from(g).slice(0, 24).join(''))
    }
    // hết mẫu để tránh (mọi mẫu đều trùng) ⇒ vẫn trả một lời hợp lệ
    const het = { ...the, loiNhanGanDay: CAC_MAU_MOI_VANG.map((m) => m.viet(3, 12, 8)) }
    expect(kiem(soanLoiMoiVang(het, 'E001', NGAY)!, het).hopLe).toBe(true)
  })
  it('LUAT-RUT-GON.md: ≤ 1.200 chữ; mọi hằng số và tên trong tệp KHỚP khuôn thật (đổi khuôn mà quên sửa tệp ⇒ đỏ); không tên lớp/em; không lệnh dẫn đường dẫn nguy hiểm', () => {
    const luat = readFileSync('bo-nao/LUAT-RUT-GON.md', 'utf8')
    expect(luat.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(1200)
    const H = HAN_MUC_BO_NAO
    // biên số
    expect(luat).toContain(`≤ ${H.LY_DO_TOI_DA} ký tự`)
    expect(luat).toContain(`≤ ${H.LOI_NHAN_TOI_DA} ký tự`)
    expect(luat).toContain(`≤ ${H.LOI_PHU_HUYNH_TOI_DA} ký tự`)
    expect(luat).toContain(`≤ ${H.THU_TUAN_TOI_DA} ký tự`)
    expect(luat).toContain(`≤ ${H.GOI_Y_TOI_DA} ký tự`)
    expect(luat).toContain(`≤ ${H.GHI_CHU_HLV_TOI_DA} ký tự`)
    expect(luat).toContain(`−${H.NHIP_LECH_TOI_DA}…+${H.NHIP_LECH_TOI_DA}`)
    expect(luat).toContain(`${H.KHOI_DONG_TOI_THIEU}…${H.KHOI_DONG_TOI_DA}`)
    expect(luat).toContain(`\`dang\` ≤ ${H.SO_DANG_TOI_DA} phần tử`)
    expect(luat).toContain(`\`khacPhuc\` ≤ ${H.SO_KHAC_PHUC_TOI_DA} phần tử`)
    expect(luat).toContain(`\`soCau\` ${H.KHAC_PHUC_SO_CAU_TOI_THIEU}…${H.KHAC_PHUC_SO_CAU_TOI_DA}`)
    expect(luat).toContain(`Tối đa ${H.TRAN_LOI_PHU_HUYNH_7_NGAY} lời/em/7 ngày`)
    expect(luat).toContain(`dưới ${String(H.NGUONG_TIN_CAY).replace('.', ',')}`)
    // danh sách giá trị hợp lệ: đúng bộ trong khuôn, không thừa không thiếu
    const dongDang = luat.match(/"hanhDong": "(uu_tien[^"]+)"/)![1].split('|')
    expect([...dongDang].sort()).toEqual([...HANH_DONG_DANG].sort())
    const dongCo = luat.match(/"co": "(khong\|tut_nhip[^"]+)"/)![1].split('|')
    expect([...dongCo].sort()).toEqual([...CO_BO_NAO].sort())
    const dongThay = luat.match(/"hanhDong": "(khong\|goi_len_bang[^"]+)"/)![1].split('|')
    expect([...dongThay].sort()).toEqual([...HANH_DONG_CHO_THAY].sort())
    for (const k of KHI_NAO_VIET_PHU_HUYNH) expect(luat, k).toContain(k)
    expect(luat).toContain('khac_phuc|on_som')
    expect(luat).toContain('dung_bac|thap_hon_mot_bac')
    // an toàn: không tên lớp, không đường dẫn tuyệt đối, không khoá bí mật, không dặn mở tệp ẩn
    expect(luat).not.toMatch(/\b1[012][A-Z]\d\b/)
    expect(luat).not.toMatch(/\/Users\/|https?:\/\/|x-ma-bi-mat|ma-bi-mat/)
    expect(luat).toContain('Không mở tệp bắt đầu bằng dấu chấm')
    // đúng phạm vi vắng: vắng 2–4 ngày do thuật toán, ≥ 5 ngày mới vào `vang-*` (số trong tệp khớp hằng số của thuật toán)
    expect(luat).toContain(`vắng ${VANG_TU_DONG_TU}–${VANG_TU_DONG_DEN} ngày thuật toán đã lo`)
    expect(luat).toContain(`từ ${VANG_TU_DONG_DEN + 1} ngày`)
  })
  it('THUẦN: bo-nao-vang.ts không import, không đồng hồ, không ngẫu nhiên', () => {
    const ma = readFileSync('src/lib/bo-nao-vang.ts', 'utf8')
      .split('\n')
      .filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*') && !l.trimStart().startsWith('/**'))
      .join('\n')
    expect(ma).not.toMatch(/^import /m)
    expect(ma).not.toMatch(/Date\.now|new Date|Math\.random|process\.|fetch\(/)
  })
})
