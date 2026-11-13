// Bình Phản Ứng — luật phòng thuần (src/lib/bpu/phong.ts). Khoá bất biến: máy em KHÔNG nhận đáp án trước khi mở; khoá bài trước khi phát đáp án.
import { describe, expect, it } from 'vitest'
import {
  KJ, chamLenBang, chiaDoi, diemDoi, duDoan, goiLenBang, kyHieu, lamBang, moDapAn, moLuot, nhanTra, roiMan, taoPhong, tenNgan, tiepSuc, vaoLop, viewBang, viewEm, xepDoi,
} from '../src/lib/bpu/phong'

const T0 = Date.parse('2026-11-06T12:00:00Z')
const chamSo = (a: string, b: string) => a.replace(',', '.') === b.replace(',', '.')
const ds = Array.from({ length: 12 }, (_, i) => ({ sbd: `S${i + 1}`, ten: `Nguyễn Văn Em${i + 1}`, coMat: i < 10, luc: T0 + i * 1000 }))
const phong = () => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds })
const cauTN = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: { qid: 'q1', text: 'Chất nào là amine bậc hai?', choices: ['a', 'b', 'c', 'd'] }, dung: 'B', hanGiay: 60 }

describe('chia đội', () => {
  // SỬA CÓ CHỦ ĐÍCH 09/11: trước đây chia theo BĂM (sbd + tháng), «cố định cả tháng». Thầy 09/11 «chia thật công bằng dựa trên năng lực» ⇒ chia theo
  // năng lực (rắn + đổi chỗ); vẫn lệch tối đa một bạn và TẤT ĐỊNH (không phụ thuộc thứ tự đầu vào). Test năng lực chi tiết: tests/bpu-chia-doi-0911.test.ts.
  it('bốn đội lệch nhau tối đa một bạn, tất định theo năng lực (không theo thứ tự đầu vào)', () => {
    const s = Array.from({ length: 31 }, (_, i) => ({ sbd: `X${i}`, nangLuc: ((i * 37) % 100) / 100 }))
    const a = chiaDoi(s), b = chiaDoi([...s].reverse())
    const dem = [0, 0, 0, 0]; for (const v of a.values()) dem[v]!++
    expect(a.size).toBe(31)
    expect(Math.max(...dem) - Math.min(...dem)).toBeLessThanOrEqual(1)
    expect([...a.entries()].every(([k, v]) => b.get(k) === v)).toBe(true)
  })
  it('chữ trên ô', () => { expect(kyHieu('Phan Hoài Nam')).toBe('Na'); expect(kyHieu('Lê Đạt')).toBe('Da'); expect(tenNgan('Nguyễn Minh Anh')).toBe('Minh Anh') })
})

describe('điểm danh', () => {
  it('mỗi em vào +10 cho đội; đội đủ quân đầu tiên +50; em lạ bị từ chối', () => {
    const st = taoPhong({ buoiId: 'b', lop: 'L', nay: T0, ds: ds.map((x) => ({ ...x, coMat: false })) })
    expect(vaoLop(st, 'S1', T0)).toBe(true)
    expect(st.doiThuong[st.ds[0]!.doi]).toBe(KJ.vaoLop)
    expect(vaoLop(st, 'LA', T0)).toBe(false)
    for (const e of st.ds) vaoLop(st, e.sbd, T0)
    expect(st.doiDu).not.toBeNull()
    expect(st.doiThuong[st.doiDu!]).toBe(KJ.vaoLop * st.ds.filter((e) => e.doi === st.doiDu).length + KJ.duQuanDau)
  })
})

describe('một lượt', () => {
  it('máy em KHÔNG có đáp án trước khi mở, có sau khi mở', () => {
    const st = phong(); moLuot(st, cauTN, T0)
    nhanTra(st, 'S1', 'B', T0 + 5000)
    for (const pha of ['tra-loi', 'goi', 'lam-bang'] as const) {
      if (pha === 'goi') goiLenBang(st, 'S2', ['Lý do'], T0 + 9000)
      if (pha === 'lam-bang') lamBang(st, T0 + 9500)
      const s = JSON.stringify(viewEm(st, 'S1'))
      expect(s).not.toContain('"dung"')
      expect(JSON.stringify(viewBang(st))).not.toContain('"dung"')
    }
    moDapAn(st, T0 + 10000, chamSo)
    expect(viewEm(st, 'S1').luot?.dung).toBe('B')
  })
  it('chỉ nhận lần gửi đầu; khoá sau khi mở; quá hạn bị từ chối', () => {
    const st = phong(); moLuot(st, cauTN, T0)
    expect(nhanTra(st, 'S1', 'B', T0 + 1000)).toEqual({ ok: true })
    expect(nhanTra(st, 'S1', 'C', T0 + 2000)).toEqual({ ok: false, ly: 'da-gui' })
    expect(nhanTra(st, 'S2', 'B', T0 + 63_000)).toEqual({ ok: false, ly: 'het-gio' })
    expect(nhanTra(st, 'LA', 'B', T0 + 1000)).toEqual({ ok: false, ly: 'la' })
    moDapAn(st, T0 + 5000, chamSo)
    expect(nhanTra(st, 'S3', 'B', T0 + 6000)).toEqual({ ok: false, ly: 'da-khoa' })
  })
  it('kJ: đúng 100 + nhanh, sai 0; năng lượng hoạt hoá khi ≥ 75% có mặt đúng', () => {
    const st = phong(); moLuot(st, cauTN, T0)
    for (let i = 1; i <= 8; i++) nhanTra(st, `S${i}`, 'B', T0 + i * 1000)
    nhanTra(st, 'S9', 'A', T0 + 9000)
    moDapAn(st, T0 + 20_000, chamSo)
    const l = st.luot!
    expect(l.kich).toBe(true) // 8/10 có mặt
    expect(l.ketQua!.S1!.dung).toBe(true)
    expect(l.ketQua!.S1!.nhanh).toBe(1)
    expect(l.ketQua!.S1!.kj).toBe(KJ.dung + Math.round(50 * (1 - 1000 / 60000)) + KJ.kichHoat)
    expect(l.ketQua!.S9!.kj).toBe(KJ.kichHoat)
  })
  it('Đúng–sai: 25 kJ mỗi ý, đủ 4 ý mới cộng nhanh', () => {
    const st = phong(); moLuot(st, { ...cauTN, phan: 'II', dung: 'DSDD' }, T0)
    nhanTra(st, 'S1', 'DSDS', T0 + 1000); nhanTra(st, 'S2', 'DSDD', T0 + 1000)
    moDapAn(st, T0 + 5000, chamSo)
    expect(st.luot!.ketQua!.S1).toMatchObject({ dung: false, soY: 3, kj: 75 })
    expect(st.luot!.ketQua!.S2!.kj).toBe(100 + Math.round(50 * (1 - 1000 / 60000)))
  })
  it('tự luận: không chấm, chỉ đếm làm xong', () => {
    const st = phong(); moLuot(st, { ...cauTN, tuLuan: true, dung: '' }, T0)
    expect(nhanTra(st, 'S1', '', T0 + 1000)).toEqual({ ok: true })
    moDapAn(st, T0 + 2000, chamSo)
    expect(st.luot!.ketQua!.S1!.kj).toBe(0)
    expect(st.luot!.kich).toBe(false)
  })
})

describe('gọi lên bảng, đoán, tiếp sức, rời màn', () => {
  // SỬA CÓ CHỦ ĐÍCH 09/11 (luật mới): Đạt ⇒ em được gọi +100 VÀ đội +200 (trước chỉ đội +200).
  it('Đạt ⇒ em +100, đội +200, đoán đúng +20; tiếp sức tối đa 10; em được gọi không tự đoán', () => {
    const st = phong(); moLuot(st, cauTN, T0)
    expect(goiLenBang(st, 'S3', ['a', 'b', 'c', 'd'], T0)).toBe(true)
    expect(st.luot!.goi!.lyDo).toHaveLength(3)
    expect(duDoan(st, 'S3', 1, T0)).toBe(false)
    duDoan(st, 'S1', 1, T0); duDoan(st, 'S2', 0, T0)
    for (let i = 0; i < 15; i++) tiepSuc(st, 'S1', T0)
    expect(st.luot!.goi!.tiep.S1).toBe(12) // 13/11: thầy nâng 10 → 12 lần mỗi em mỗi lượt lên bảng
    const doi = st.ds.find((e) => e.sbd === 'S3')!.doi, truoc = diemDoi(st, doi), thuongTruoc = st.doiThuong[doi]!
    chamLenBang(st, true, T0)
    moDapAn(st, T0 + 1000, chamSo)
    expect(diemDoi(st, doi) - truoc).toBeGreaterThanOrEqual(KJ.lenBangDat + KJ.lenBangDatEm)
    expect(st.doiThuong[doi]! - thuongTruoc).toBe(200)
    expect(st.ds.find((e) => e.sbd === 'S3')!.kj).toBe(100)
    expect(st.bienDong!.at(-1)).toMatchObject({ sbd: 'S3', kjEm: 100, kjDoi: 200, lyDo: 'Giải đúng trên bảng' })
    expect(st.ds.find((e) => e.sbd === 'S1')!.kj).toBe(KJ.doanDung)
    expect(st.ds.find((e) => e.sbd === 'S2')!.kj).toBe(0)
  })
  // SỬA CÓ CHỦ ĐÍCH 09/11 (lần 3): rời màn tính MỌI LÚC em đã vào lớp (cả khi chưa có lượt / đã mở đáp án) — em chỉ thoát khi thầy kết thúc buổi.
  it('rời màn tính mọi lúc em đã vào lớp; em chưa vào / buổi kết thúc ⇒ không tính', () => {
    const st = phong()
    expect(roiMan(st, 'S1', T0)).toBe(st.ds[0]!.vao)
    moLuot(st, cauTN, T0); moDapAn(st, T0 + 1000, chamSo)
    expect(roiMan(st, 'S1', T0)).toBe(st.ds[0]!.vao)
  })
  // SỬA CÓ CHỦ ĐÍCH 09/11 (luật chặt, thầy «thoát màn hình cảnh báo bị trừ cả đội và cá nhân»): trước đó rời màn KHÔNG trừ (KJ.roiMan = 0).
  // Nay mỗi LẦN RỜI MỚI ⇒ em −50 (kẹp ≥ 0) + đội −50; máy báo `roi` trùng (chưa `ve`) không trừ lần hai; vẫn đếm lần + ghi vào lượt.
  it('rời màn trừ em −50 (kẹp 0) và đội −50; báo trùng không trừ lần hai, vẫn đếm lần', () => {
    const st = phong(); moLuot(st, cauTN, T0)
    const e = st.ds[0]!, d = e.doi, truoc = st.doiThuong[d]!
    e.kj = 30
    roiMan(st, 'S1', T0); roiMan(st, 'S1', T0)
    expect(KJ.roiMan).toBe(50)
    expect(st.doiThuong[d]).toBe(truoc - 50)
    expect(e.kj).toBe(0)
    expect(st.bienDong!.at(-1)).toMatchObject({ sbd: 'S1', doi: d, kjEm: -30, kjDoi: -50, lyDo: 'Rời màn hình' })
    expect(st.bienDong!.filter((x) => x.lyDo === 'Rời màn hình')).toHaveLength(1)
    expect(e.roi).toBe(2)
    expect(st.luot!.roiMe).toEqual(['S1'])
  })
  // SỬA CÓ CHỦ ĐÍCH 09/11: `phong()` có 10 em có mặt ⇒ nay HAI đội (≤ 12 có mặt ⇒ 2 đội), trước đây bốn.
  it('xếp đội theo tổng kJ (con số hiện trên bảng)', () => {
    const st = phong()
    const x = xepDoi(st)
    expect(x).toHaveLength(2)
    expect(x[0]!.tong).toBeGreaterThanOrEqual(x[1]!.tong)
  })
})

describe('hai đội khi lớp ít em (thầy 07/11 «dưới 12 bạn thì chỉ tạo 2 đội»)', () => {
  it('sĩ số dưới 12 ⇒ hai đội ngay từ đầu, lệch nhau tối đa 1 bạn', () => {
    const st = taoPhong({ buoiId: 'b', lop: 'L', nay: T0, ds: ds.slice(0, 9) })
    expect(st.soDoi).toBe(2)
    expect(new Set(st.ds.map((e) => e.doi))).toEqual(new Set([0, 1]))
    const dem = [0, 1].map((d) => st.ds.filter((e) => e.doi === d).length)
    expect(Math.abs(dem[0]! - dem[1]!)).toBeLessThanOrEqual(1)
    expect(xepDoi(st)).toHaveLength(2)
    expect(viewBang(st).soDoi).toBe(2)
  })
  // SỬA CÓ CHỦ ĐÍCH 09/11 (hai test dưới): trước đây số đội theo SĨ SỐ lúc mở phòng, gộp còn hai ở lượt đầu, và từ lượt hai «không đổi giữa buổi»;
  // 12 em có mặt ⇒ bốn đội. Thầy 09/11 «dưới 12 học sinh thì tự động chia 2 đội, từ học sinh thứ 13 trở lên lập tức chia thành 4 đội» ⇒ theo số em
  // ĐANG CÓ MẶT, ngay lúc em vào (kể cả giữa buổi); 12 có mặt ⇒ hai đội, em thứ 13 ⇒ bốn đội.
  it('sĩ số đông nhưng có mặt dưới 12 ⇒ hai đội ngay khi mở, giữ đủ kJ điểm danh; em thứ 13 vào giữa buổi ⇒ bốn đội', () => {
    const lon = Array.from({ length: 20 }, (_, i) => ({ sbd: `X${i}`, ten: `Em ${i}`, coMat: i < 8, luc: T0 }))
    const st = taoPhong({ buoiId: 'b', lop: 'L', nay: T0, ds: lon })
    expect(st.soDoi).toBe(2)
    expect(st.doiThuong).toHaveLength(2)
    const tong = st.doiThuong.reduce((a, b) => a + b, 0)
    expect(st.doiDu).toBeNull()
    expect(tong).toBe(8 * KJ.vaoLop)
    moLuot(st, cauTN, T0)
    expect(st.soDoi).toBe(2)
    expect(st.ds.every((e) => e.doi < 2)).toBe(true)
    for (const e of st.ds) vaoLop(st, e.sbd, T0)
    expect(st.soDoi).toBe(4)
    expect(st.doiThuong).toHaveLength(4)
    expect(st.doiThuong.reduce((a, b) => a + b, 0)).toBe(tong + 12 * KJ.vaoLop + (st.doiDu != null ? KJ.duQuanDau : 0))
  })
  it('đủ 12 em có mặt ⇒ hai đội (09/11: ≤ 12 ⇒ hai)', () => {
    const st = phong()
    for (const e of st.ds) vaoLop(st, e.sbd, T0)
    moLuot(st, cauTN, T0)
    expect(st.soDoi).toBe(2)
  })
})

describe('«Em chưa biết làm» (thầy 07/11 «để học sinh thành thật»)', () => {
  it('cờ riêng: khoá như đã gửi, không bao giờ chấm đúng, +20 kJ thành thật; đoán sai 0 kJ; không lộ đáp án trước khi mở', () => {
    const st = phong(); moLuot(st, cauTN, T0)
    expect(nhanTra(st, 'S1', '', T0 + 1000, true)).toEqual({ ok: true })
    expect(nhanTra(st, 'S1', 'B', T0 + 2000)).toEqual({ ok: false, ly: 'da-gui' })
    nhanTra(st, 'S2', 'A', T0 + 1000)
    expect(viewBang(st).luot!.chuaBiet).toEqual(['S1'])
    expect(viewBang(st).luot!.daGui).toContain('S1')
    expect(JSON.stringify(viewEm(st, 'S1'))).not.toContain('"dung"')
    expect(JSON.stringify(viewBang(st))).not.toContain('"dung"')
    moDapAn(st, T0 + 5000, chamSo)
    expect(st.luot!.ketQua!.S1).toMatchObject({ dung: false, kb: true, kj: KJ.thanhThat, nhanh: null })
    expect(st.luot!.ketQua!.S2!.kj).toBe(0)
    expect(viewBang(st).luot!.chon).toEqual({ S2: 'A' }) // ống nghiệm không đếm «chưa biết» vào phương án nào
  })
  it('Đúng–sai: chưa biết không được tính ý nào đúng', () => {
    const st = phong(); moLuot(st, { ...cauTN, phan: 'II', dung: 'SSSS' }, T0)
    nhanTra(st, 'S1', '', T0 + 1000, true)
    moDapAn(st, T0 + 5000, chamSo)
    expect(st.luot!.ketQua!.S1).toMatchObject({ dung: false, soY: 0, kj: KJ.thanhThat })
  })
})

describe('lượt rỗng (thầy lật nhanh qua câu)', () => {
  it('mở đáp án lượt không ai gửi: không đụng chuỗi, không vào tổng kết; chuyển câu khi lượt rỗng ⇒ không đánh số mới', async () => {
    const { boLuotRong } = await import('../src/lib/bpu/phong')
    const st = phong(); moLuot(st, cauTN, T0)
    nhanTra(st, 'S1', 'B', T0 + 1000); moDapAn(st, T0 + 2000, chamSo)
    expect(st.ds[0]!.chuoi).toBe(1)
    moLuot(st, cauTN, T0 + 3000)
    expect(boLuotRong(st)).toBe(true)
    expect(st.soLuot).toBe(1)
    moLuot(st, cauTN, T0 + 4000)
    moDapAn(st, T0 + 5000, chamSo)
    expect(st.ds[0]!.chuoi).toBe(1)
    expect(st.lichSu).toHaveLength(1)
  })
  it('lời giải: giữ trong phòng; máy em chỉ nhận SAU khi mở đáp án; bảng chiếu không bao giờ nhận (thầy 07/11)', async () => {
    const P = await import('../src/lib/bpu/phong')
    const st = P.taoPhong({ buoiId: 'g', lop: 'L', nay: 1, ds: [{ sbd: 'S1', ten: 'A B', coMat: true, luc: 1 }] })
    P.moLuot(st, { qid: 'q', phan: 'I', tuLuan: false, cau: {}, dung: 'B', hanGiay: 60, giai: { solution: 'Vì B đúng', anh: [{ src: 'x.png', viTri: 'sau_loi_giai' }] } }, 2)
    expect(JSON.stringify(P.viewEm(st, 'S1'))).not.toContain('Vì B đúng')
    expect(JSON.stringify(P.viewBang(st))).not.toContain('Vì B đúng')
    P.moDapAn(st, 3, (a, b) => a === b)
    expect(P.viewEm(st, 'S1').luot).toMatchObject({ qid: 'q', giai: { solution: 'Vì B đúng' } })
    expect(JSON.stringify(P.viewBang(st))).not.toContain('Vì B đúng')
  })
})
