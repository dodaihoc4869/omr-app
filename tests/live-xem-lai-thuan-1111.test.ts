// XEM LẠI LIVE (thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.2, 4.4, 4.5, 4.6, 7): các luật THUẦN —
// khung MP3 (byte ↔ giây, cắt theo khung), khúc 10 giây, cắt đoạn, chọn đoạn đáng xem, đặt tên.
import { describe, expect, it } from 'vitest'
import { BYTE_MOI_KHUNG, MS_MOI_KHUNG, byteCua, catKhung, dayCam, docDauKhung, khungCam, laKhungInfo, msCua, soKhungCua, tachKhung } from '../src/lib/live/xem-lai-mp3'
import { chuanDauKhuc, dauGon, docDauGon, docKhuc, ghiKhuc, khoaKhuc, mucTuDb, mucTuRms } from '../src/lib/live/xem-lai-khuc'
import { LUAT_CAT, catDoan, chonDangXem, timLang, type DauVaoCat, type DoanDiem } from '../src/lib/live/xem-lai-cat'
import { chuDungLuong, chuanTenThay, soCauTuTenDoan, tenBaiTuDong, tenBuoiDayDu, tenDoan, tenGoi, thuNgay } from '../src/lib/live/xem-lai-ten'

const khung = (so: number): Uint8Array => { const k = new Uint8Array(BYTE_MOI_KHUNG); k.set([0xff, 0xf3, 0x64, 0xc4]); new DataView(k.buffer).setUint32(20, so, true); return k }
const noi = (ds: Uint8Array[]): Uint8Array => { const ra = new Uint8Array(ds.reduce((s, x) => s + x.length, 0)); let o = 0; for (const x of ds) { ra.set(x, o); o += x.length } return ra }
const soCua = (b: Uint8Array, vt: number): number => new DataView(b.buffer, b.byteOffset).getUint32(vt + 20, true)

describe('Khung MP3 48 kb/s mono 24 kHz', () => {
  it('một khung = 144 byte = 24 ms; byte ↔ giây tính thẳng (6.000 byte mỗi giây)', () => {
    expect(BYTE_MOI_KHUNG).toBe(144); expect(MS_MOI_KHUNG).toBe(24)
    const d = docDauKhung(khungCam(), 0)!
    expect(d).toMatchObject({ dai: 144, mau: 576, hz: 24000, kb: 48, mono: true })
    expect(byteCua(1000)).toBe(41 * 144) // khung chứa giây thứ 1 bắt đầu ở 984 ms
    expect(msCua(600 * 6000)).toBe(600_000) // 10 phút = 3,6 MB
    expect(soKhungCua(10_000)).toBe(417)
  })
  it('nối khúc = nối byte: tách lại ra đúng từng khung, bỏ rác đầu, bỏ khung cụt cuối, bỏ khung Info', () => {
    const info = khung(999); info.set([0x49, 0x6e, 0x66, 0x6f], 13) // «Info» sau 9 byte phần phụ
    expect(laKhungInfo(info, 0, docDauKhung(info, 0)!)).toBe(true)
    const b = noi([new Uint8Array([1, 2, 3]), info, khung(0), khung(1), khung(2), khung(3).subarray(0, 100)])
    const t = tachKhung(b)
    expect(t.khung.length).toBe(3); expect(t.hz).toBe(24000)
    expect(t.khung.map((k) => soCua(b, k.vt))).toEqual([0, 1, 2])
  })
  it('cắt một khoảng theo khung (không mã hoá lại): giữ đúng các khung ngoài khoảng', () => {
    const b = noi(Array.from({ length: 10 }, (_, i) => khung(i))), t = tachKhung(b)
    const ra = catKhung(b, t.khung, [[0, 3], [7, 10]])
    expect(ra.length).toBe(6 * 144)
    expect(tachKhung(ra).khung.map((k) => soCua(ra, k.vt))).toEqual([0, 1, 2, 7, 8, 9])
    expect(catKhung(b, t.khung, [[8, 99]]).length).toBe(2 * 144) // khoảng vượt cuối khúc ⇒ kẹp
  })
  it('khung câm hợp lệ, lấp đúng thời lượng', () => {
    const c = dayCam(5)
    expect(c.length).toBe(720); expect(tachKhung(c).khung.length).toBe(5)
  })
})

describe('Khúc 10 giây', () => {
  it('đóng / mở giữ nguyên phần đầu + thân; dạng gọn cho siêu dữ liệu R2', () => {
    const mp3 = noi([khung(1), khung(2)])
    const dau = { v: 1 as const, t0: 1_700_000_000_123, kh: 2, tm: 1_700_000_000_100, muc: [0, 135, 255], net: [['n1', 40], ['n2', -12]] as [string, number][] }
    const k = docKhuc(ghiKhuc(dau, mp3))!
    expect(k.dau).toEqual(dau); expect([...k.mp3]).toEqual([...mp3])
    expect(docDauGon(dauGon(dau))).toEqual(dau)
    expect(khoaKhuc('b1', 'p9', 7)).toBe('live/b1/k/p9-00007.bin')
  })
  it('khúc hỏng ⇒ null, không ném; quá nhiều mốc nét ⇒ dạng gọn tự bớt cho vừa', () => {
    expect(docKhuc(new Uint8Array([1, 2, 3, 4, 5, 6, 7]))).toBeNull()
    expect(chuanDauKhuc({ t0: 0, kh: 1 })).toBeNull()
    const nhieu = { v: 1 as const, t0: 5, kh: 1, tm: 5, muc: [], net: Array.from({ length: 110 }, (_, i) => [`net-dai-${i}-xxxxxxxxxxxx`, i] as [string, number]) }
    const gon = dauGon(nhieu)
    expect(gon.length).toBeLessThanOrEqual(1800); expect(docDauGon(gon)!.t0).toBe(5)
  })
  it('mức âm: −45 dBFS ⇒ ngưỡng lặng; im ⇒ 0; to nhất ⇒ 255', () => {
    expect(mucTuRms(0)).toBe(0); expect(mucTuRms(1)).toBe(255)
    expect(mucTuRms(10 ** (-45 / 20))).toBe(mucTuDb(-45)); expect(LUAT_CAT.nguong).toBe(mucTuDb(-45))
  })
})

// ── Cắt đoạn ──
const O = 500
/** Mức âm: mặc định CÓ TIẾNG cả buổi; `im` = các khoảng [từ, tới) ms lặng. */
function vao(o: Partial<DauVaoCat> & { msLive: number; im?: [number, number][] }): DauVaoCat {
  const muc = new Uint8Array(Math.ceil(o.msLive / O)).fill(200)
  for (const [a, b] of o.im ?? []) for (let i = Math.floor(a / O); i < Math.ceil(b / O); i++) muc[i] = 10
  return { msLive: o.msLive, luot: o.luot ?? [], ranh: o.ranh ?? [], net: o.net ?? [], muc, coTieng: o.coTieng ?? true }
}
const netDeu = (tu: number, so: number, cach = 2000): { t: number; ms: number }[] => Array.from({ length: so }, (_, i) => ({ t: tu + i * cach, ms: 800 }))

describe('Tự cắt đoạn (mục 4.4)', () => {
  it('lên bảng: bắt đầu 2 giây trước lúc gọi; chấm và mở đáp án KHÔNG kết thúc đoạn; hết ở lượt kế', () => {
    const r = catDoan(vao({ msLive: 300_000, luot: [{ so: 1, t0: 10_000, t1: 200_000, moDapAn: 150_000, bangTay: [], goi: [{ t: 60_000, sbd: 'a' }] }, { so: 2, t0: 200_000, t1: 300_000, moDapAn: 290_000, bangTay: [], goi: [] }] }))
    expect(r.doan).toHaveLength(1)
    expect(r.doan[0]).toMatchObject({ loai: 'len_bang', luot: 1, sbd: 'a', t0: 58_000, t1: 200_000, phan: 1 })
  })
  it('gọi ngay đầu chương ⇒ không lùi quá đầu chương; gọi em thứ hai ⇒ đoạn mới cho em ấy', () => {
    const r = catDoan(vao({ msLive: 200_000, luot: [{ so: 1, t0: 10_000, t1: 200_000, moDapAn: null, bangTay: [], goi: [{ t: 10_500, sbd: 'a' }, { t: 90_000, sbd: 'b' }] }] }))
    expect(r.doan.map((d) => [d.sbd, d.t0, d.t1])).toEqual([['a', 10_000, 90_000], ['b', 90_000, 200_000]])
  })
  it('thầy chữa: sau mở đáp án, cụm từ 5 nét và từ 10 giây có tiếng; bắt đầu 3 giây trước nét đầu', () => {
    const luot = [{ so: 1, t0: 0, t1: 120_000, moDapAn: 30_000, bangTay: [], goi: [] }]
    const r = catDoan(vao({ msLive: 120_000, luot, net: netDeu(40_000, 8) }))
    expect(r.doan).toHaveLength(1)
    expect(r.doan[0]).toMatchObject({ loai: 'thay_chua', sbd: null, t0: 37_000, t1: 120_000, soNet: 8 })
    // chỉ 4 nét ⇒ không thành đoạn; nét TRƯỚC khi mở đáp án không tính
    expect(catDoan(vao({ msLive: 120_000, luot, net: netDeu(40_000, 4) })).doan).toHaveLength(0)
    expect(catDoan(vao({ msLive: 120_000, luot, net: netDeu(5000, 8) })).doan).toHaveLength(0)
    // 5 nét nhưng cách nhau 9 giây ⇒ không phải một cụm
    expect(catDoan(vao({ msLive: 120_000, luot, net: netDeu(40_000, 5, 9000) })).doan).toHaveLength(0)
  })
  // 11/11 — thầy: «kết thúc live chưa thấy có bản ghi» (live thử ngắn, mic câm). Luật 3 hạ 30 giây → 10 giây tiếng; buổi KHÔNG CÓ TIẾNG thì 5 nét là đủ.
  it('thầy chữa (luật 11/11): đủ 5 nét VÀ (từ 10 giây có tiếng HOẶC buổi không có tiếng)', () => {
    expect(LUAT_CAT).toMatchObject({ cumNetSo: 5, chuaTiengMs: 10_000, vunMs: 8000, vunNetSo: 3 })
    const luot = [{ so: 1, t0: 0, t1: 40_000, moDapAn: 2000, bangTay: [], goi: [] }]
    // 6 nét trong 12 giây, tiếng phủ từ 7 giây tới hết chương (33 giây) ⇒ thành đoạn (trước 11/11 cần 30 giây tiếng: buổi 40 giây gần như không bao giờ đủ)
    expect(catDoan(vao({ msLive: 40_000, luot, net: netDeu(10_000, 6) })).doan).toMatchObject([{ loai: 'thay_chua', t0: 7000, soNet: 6 }])
    // có tiếng nhưng phần chữa chỉ 8,5 giây tiếng (còn lại lặng, không nét) ⇒ chưa đủ
    expect(catDoan(vao({ msLive: 40_000, luot, net: netDeu(10_000, 5, 1000), im: [[15_000, 40_000]] })).doan).toHaveLength(0)
    // buổi KHÔNG CÓ TIẾNG (mic câm): 5 nét là thành đoạn; 4 nét thì chưa
    const cam = catDoan(vao({ msLive: 40_000, luot, net: netDeu(10_000, 5), coTieng: false }))
    expect(cam.doan).toMatchObject([{ loai: 'thay_chua', t0: 7000, soNet: 5 }])
    expect(catDoan(vao({ msLive: 40_000, luot, net: netDeu(10_000, 4), coTieng: false })).doan).toHaveLength(0)
  })
  it('thầy chữa khi bảng live bật tay (chưa mở đáp án cũng tính từ lúc bật)', () => {
    const r = catDoan(vao({ msLive: 100_000, luot: [{ so: 1, t0: 0, t1: 100_000, moDapAn: 95_000, bangTay: [20_000], goi: [] }], net: netDeu(25_000, 6) }))
    expect(r.doan[0]).toMatchObject({ loai: 'thay_chua', t0: 22_000 })
  })
  it('lặng từ 6 giây vào chỉ mục, giữ 0,5 giây hai đầu; lặng mà có nét thì KHÔNG tính lặng', () => {
    const v = vao({ msLive: 100_000, im: [[20_000, 30_000], [50_000, 54_000], [60_000, 70_000]], net: [{ t: 64_000, ms: 500 }] })
    expect(timLang(v)).toEqual([[20_000, 30_000]])
    expect(catDoan(v).lang).toEqual([[20_500, 29_500]])
  })
  it('lặng từ 90 giây giữa đoạn ⇒ đoạn dừng ở đó, có tiếng lại thì mở phần 2', () => {
    const r = catDoan(vao({ msLive: 400_000, im: [[100_000, 200_000]], luot: [{ so: 1, t0: 0, t1: 400_000, moDapAn: null, bangTay: [], goi: [{ t: 30_000, sbd: 'a' }] }] }))
    expect(r.doan.map((d) => [d.phan, d.t0, d.t1])).toEqual([[1, 28_000, 100_500], [2, 199_500, 400_000]])
    expect(r.doan[0]!.giayCoTieng).toBe(73) // 72,5 giây có tiếng (phần lặng trong chỉ mục nằm ngoài đoạn), làm tròn
  })
  // 11/11 (lời thầy như trên): «đoạn vụn» trước là dưới 20 giây tiếng ⇒ bỏ. Nay GIỮ đoạn khi có từ 8 giây tiếng HOẶC từ 3 nét (buổi không có tiếng vẫn ra đoạn từ nét).
  it('đoạn vụn (dưới 8 giây tiếng VÀ dưới 3 nét) bị bỏ; từ 8 giây tiếng hoặc từ 3 nét thì giữ', () => {
    const luot = (goi: number) => [{ so: 1, t0: 0, t1: 60_000, moDapAn: null, bangTay: [], goi: [{ t: goi, sbd: 'a' }] }]
    expect(catDoan(vao({ msLive: 60_000, luot: luot(55_000) })).doan).toHaveLength(0) // 7 giây tiếng, 0 nét
    expect(catDoan(vao({ msLive: 60_000, luot: luot(45_000) })).doan).toMatchObject([{ loai: 'len_bang', giayCoTieng: 17 }]) // 17 giây: trước 11/11 bị bỏ
    expect(catDoan(vao({ msLive: 60_000, luot: luot(55_000), net: netDeu(55_500, 3, 1000) })).doan).toMatchObject([{ soNet: 3 }]) // 7 giây tiếng nhưng 3 nét
    // buổi không có tiếng: gọi em lên bảng, em viết 3 nét ⇒ có đoạn; không nét nào ⇒ không
    expect(catDoan(vao({ msLive: 60_000, coTieng: false, luot: luot(30_000), net: netDeu(35_000, 3) })).doan).toMatchObject([{ loai: 'len_bang', soNet: 3 }])
    expect(catDoan(vao({ msLive: 60_000, coTieng: false, luot: luot(30_000) })).doan).toHaveLength(0)
  })
  it('nhiều lần bật / tắt live: đoạn không vắt qua mốc nối', () => {
    const r = catDoan(vao({ msLive: 300_000, ranh: [100_000], luot: [{ so: 1, t0: 0, t1: 300_000, moDapAn: null, bangTay: [], goi: [{ t: 40_000, sbd: 'a' }, { t: 100_000, sbd: 'a' }] }] }))
    expect(r.doan.map((d) => [d.t0, d.t1])).toEqual([[38_000, 100_000], [100_000, 300_000]])
  })
  it('buổi không có tiếng: «có hoạt động» tính theo nét', () => {
    const luot = [{ so: 1, t0: 0, t1: 200_000, moDapAn: null, bangTay: [], goi: [{ t: 20_000, sbd: 'a' }] }]
    const r = catDoan(vao({ msLive: 200_000, coTieng: false, luot, net: netDeu(20_000, 30) }))
    expect(r.doan).toHaveLength(1); expect(r.doan[0]!.giayCoTieng).toBeGreaterThanOrEqual(60)
    expect(catDoan(vao({ msLive: 200_000, coTieng: false, luot })).doan).toHaveLength(0) // không nét nào ⇒ không có gì để xem
  })
})

const D = (o: Partial<DoanDiem> & { stt: number; luot: number }): DoanDiem => ({ loai: 'len_bang', dat: null, t0: 0, t1: 60_000, soNet: 5, giayCoTieng: 60, ...o })
describe('Tự chọn đoạn đáng xem (mục 4.5)', () => {
  const cau = [{ luot: 1, soDung: 9, soGui: 10, tuLuan: false }, { luot: 2, soDung: 4, soGui: 10, tuLuan: false }, { luot: 3, soDung: 5, soGui: 10, tuLuan: false }, { luot: 4, soDung: 8, soGui: 10, tuLuan: false }]
  it('L1: câu tỉ lệ đúng thấp nhất (từ 10 em gửi, ≤ 60 %) ⇒ «cả lớp sai nhiều nhất»', () => {
    const r = chonDangXem([D({ stt: 1, luot: 1 }), D({ stt: 2, luot: 2 }), D({ stt: 3, luot: 3 }), D({ stt: 4, luot: 4 })], cau)
    expect([...r.entries()]).toEqual([[2, { lyDo: 'cả lớp sai nhiều nhất', diem: 3 }]])
  })
  it('ngưỡng: dưới 10 em gửi hoặc tỉ lệ trên 60 % ⇒ không L1; không đoạn nào đủ điểm ⇒ không nhãn, không ép', () => {
    expect(chonDangXem([D({ stt: 1, luot: 1 }), D({ stt: 2, luot: 2 })], [{ luot: 1, soDung: 9, soGui: 10, tuLuan: false }, { luot: 2, soDung: 4, soGui: 9, tuLuan: false }]).size).toBe(0)
    expect(chonDangXem([D({ stt: 1, luot: 1 })], [{ luot: 1, soDung: 7, soGui: 10, tuLuan: false }]).size).toBe(0)
  })
  it('L2: nhiều nét nhất (từ 30 nét và ≥ 1,5 lần trung vị) · L3: lên bảng Đạt ở câu khó · L4: giảng lâu nhất chỉ 1 điểm (không đủ)', () => {
    const ds = [D({ stt: 1, luot: 1, soNet: 10 }), D({ stt: 2, luot: 1, soNet: 64 }), D({ stt: 3, luot: 4, soNet: 12, giayCoTieng: 400 }), D({ stt: 4, luot: 3, dat: true })]
    const r = chonDangXem(ds, [{ luot: 1, soDung: 9, soGui: 10, tuLuan: false }, { luot: 3, soDung: 5, soGui: 9, tuLuan: false }, { luot: 4, soDung: 9, soGui: 10, tuLuan: false }])
    expect(r.get(2)).toEqual({ lyDo: 'thầy viết nhiều nhất (64 nét)', diem: 2 })
    expect(r.get(4)).toEqual({ lyDo: 'bạn lên bảng Đạt ở câu khó', diem: 2 })
    expect(r.has(3)).toBe(false)
    // 64 nét nhưng không gấp 1,5 lần trung vị ⇒ không L2
    expect(chonDangXem([D({ stt: 1, luot: 1, soNet: 60 }), D({ stt: 2, luot: 1, soNet: 64 })], []).size).toBe(0)
  })
  it('tối đa 2 đoạn; buổi có ≤ 3 đoạn tối đa 1; hoà điểm ⇒ đoạn dài hơn', () => {
    const bon = [D({ stt: 1, luot: 2 }), D({ stt: 2, luot: 3, dat: true, t1: 90_000 }), D({ stt: 3, luot: 3, dat: true, t1: 200_000 }), D({ stt: 4, luot: 3, dat: true, t1: 100_000 })]
    expect([...chonDangXem(bon, cau).keys()]).toEqual([1, 3])
    const ba = bon.slice(1)
    expect([...chonDangXem(ba, cau).keys()]).toEqual([3])
  })
})

describe('Tự đặt tên (mục 4.6)', () => {
  it('tên buổi: một / hai / ba bài, thiếu bài', () => {
    expect(tenBaiTuDong([{ bai: 'Bài 8. Amine' }, { bai: 'Bài 8. Amine' }, { bai: '' }], '12A1')).toBe('Bài 8. Amine')
    expect(tenBaiTuDong([{ bai: 'Bài 9. Amino acid và peptide' }, { bai: 'Bài 8. Amine' }, { bai: 'Bài 8. Amine' }], '12A1')).toBe('Bài 8. Amine + Bài 9. Amino acid và peptide')
    expect(tenBaiTuDong([{ bai: 'Bài 8. Amine' }, { bai: 'Bài 8. Amine' }, { bai: 'Bài 9' }, { bai: 'Bài 10' }], '12A1')).toBe('Bài 8. Amine và 2 bài khác')
    expect(tenBaiTuDong([{ bai: '' }], '12A1')).toBe('Buổi live 12A1')
    expect(tenBaiTuDong([], '')).toBe('Buổi live')
  })
  it('dòng tên đầy đủ: thứ, ngày, lớp, tên, số câu, số phút tự ghép; thầy đổi tên chỉ thay phần tên; xoá trắng ⇒ về tự động', () => {
    const b = { ngay: '2026-11-10', lop: '12A1', tenTuDong: 'Bài 8. Amine', tenThay: null as string | null, soCau: 5, giayLive: 48 * 60 + 10 }
    expect(thuNgay('2026-11-10')).toBe('Thứ Ba 10/11')
    expect(tenBuoiDayDu(b)).toBe('Thứ Ba 10/11 · 12A1 · Bài 8. Amine · 5 câu · 48 phút')
    expect(tenBuoiDayDu({ ...b, tenThay: '  Chữa đề   amine khó ' })).toBe('Thứ Ba 10/11 · 12A1 · Chữa đề amine khó · 5 câu · 48 phút')
    expect(tenBuoiDayDu({ ...b, tenThay: '   ', lop: '' })).toBe('Thứ Ba 10/11 · Bài 8. Amine · 5 câu · 48 phút')
    expect(chuanTenThay('')).toBeNull(); expect(chuanTenThay('x'.repeat(200))!.length).toBe(80)
  })
  it('tên đoạn: có / không dạng, thầy chữa, phần 2; đọc lại số câu từ tên', () => {
    expect(tenDoan({ so: 3, dang: 'Amine tác dụng với acid', loai: 'len_bang', tenEm: 'Nguyễn Thị Minh Anh' })).toBe('Câu 3 · Amine tác dụng với acid · Minh Anh lên bảng')
    expect(tenDoan({ so: 2, dang: '', loai: 'thay_chua' })).toBe('Câu 2 · Thầy chữa')
    expect(tenDoan({ so: 4, dang: 'Peptide', loai: 'len_bang', tenEm: 'Trần Bảo', phan: 2 })).toBe('Câu 4 · Peptide · Trần Bảo lên bảng (phần 2)')
    expect(soCauTuTenDoan('Câu 12 · Peptide · Thầy chữa')).toBe(12); expect(soCauTuTenDoan('Buổi live')).toBe(0)
    expect(tenGoi('  Lê   Văn  Tám ')).toBe('Văn Tám')
  })
  it('dung lượng cho người đọc', () => {
    expect(chuDungLuong(121 * 1048576)).toBe('121 MB'); expect(chuDungLuong(0.94 * 1048576)).toBe('963 KB'); expect(chuDungLuong(5.26 * 1048576)).toBe('5,3 MB'); expect(chuDungLuong(0)).toBe('0 KB')
  })
})
