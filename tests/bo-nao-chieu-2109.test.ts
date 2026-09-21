// BỘ NÃO — LƯỢT CHIỀU "THỬ THÁCH RIÊNG HÔM NAY" (`scripts/bo-nao/{lay,nop}.mjs --chieu`, `chay-chieu.sh`, Code 1, 21/09/2026; thầy chốt 11:31).
// Nghiệm thu: lấy CHỈ em có tín hiệu (không vắng, có mã dạng, tối đa N) · AI chỉ thấy bí danh · KHÔNG đụng lượt đêm · phần tử chỉ mang thuThach + loiMoi (núm rỗng) · `--xem-truoc` KHÔNG gọi máy chủ
// và KHÔNG cần mã bí mật · nộp thật chỉ khi ĐÃ xem trước và `ra/` không đổi sau đó · sai thử thách ⇒ loại (lượt chiều chỉ có việc này) · phiên AI không thể nộp.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error — mã lệnh .mjs không có khai báo kiểu
import { LoiBoNao } from '../scripts/bo-nao/chung.mjs'
// @ts-expect-error
import { chayLayChieu, diemTinHieuChieu } from '../scripts/bo-nao/lay.mjs'
// @ts-expect-error
import { canhBaoLoLoiMoi, chayNopChieu, moRongPhanTuChieu, nhomLyDo, soanBaoCaoChieu, soanXemTruoc } from '../scripts/bo-nao/nop.mjs'
import { LOI_CAM, LOI_KHONG_THU, LOI_TOT, THE, THE_KHONG_THU } from './_bo-nao-thu-thach-mau'

const NGAY = '2026-09-21'
let tam: string
let goc: string
beforeEach(() => {
  tam = mkdtempSync(join(tmpdir(), 'bo-nao-chieu-'))
  goc = join(tam, 'bo-nao')
  mkdirSync(goc, { recursive: true })
})
afterEach(() => rmSync(tam, { recursive: true, force: true }))

const { biDanh: _b, ...THE_TRON } = THE as Record<string, unknown> & { biDanh: string }
void _b
const the = (o: Record<string, unknown> = {}) => ({ ...THE_TRON, ...o })
/** Bảy em: A/D có tín hiệu; B không tín hiệu; C vắng; E không mã dạng; F bỏ qua; G tín hiệu yếu hơn A. */
const CAC_EM = [
  { sbd: '20001', hoTen: 'Trần Thu Hà', luong: 'nhanh', the: the({ mocDangKhen: [{ loai: 'dung_lai', dang: 'ESTE.THUY_PHAN', soCau: 4 }] }) },
  { sbd: '20002', luong: 'nhanh', the: the({ mocDangKhen: [], cau: { lamHomQua: 0, lam3: 0 }, thanThu: undefined }) },
  { sbd: '20003', luong: 'vang', the: the({ mocDangKhen: [{ loai: 'quay_lai', soNgay: 4 }] }) },
  { sbd: '20004', luong: 'sau', the: the({ maDang: ['LIPID.BEO'], mocDangKhen: [{ loai: 'len_bac', dang: 'LIPID.BEO', tu: 0, den: 1 }], thanThu: undefined }) },
  { sbd: '20005', luong: 'nhanh', the: the({ maDang: [], mocDangKhen: [{ loai: 'chuoi', soNgay: 3 }] }) },
  { sbd: '20006', luong: 'bo_qua', the: the({ mocDangKhen: [{ loai: 'chuoi', soNgay: 3 }] }) },
  { sbd: '20007', luong: 'nhanh', the: the({ mocDangKhen: [], thanThu: undefined, cau: { lamHomQua: 3, lam3: 0 } }) },
]
interface Goi {
  goi: (duong: string, than: any) => Promise<any>
  nhatKy: { duong: string; than: any }[]
}
function mayChuGia(cauHinh: Record<string, unknown> = { bat: true, cheDo: 'that', lopThat: [], thuThach: true }, cacEm: unknown[] = CAC_EM): Goi {
  const nhatKy: { duong: string; than: any }[] = []
  const goi = async (duong: string, than: any) => {
    nhatKy.push({ duong, than })
    if (duong === '/ai/cau-hinh') return { ok: true, cauHinh }
    if (duong === '/ai/ho-so-ngay') return { ok: true, cacEm, soTrang: 1 }
    if (duong === '/ai/dieu-chinh/nop') return { ok: true, nhan: than.cacEm.length, chiGhiSo: 0, soApDung: than.cacEm.length, biLoai: 0, loai: [] }
    throw new Error(`lệnh lạ ${duong}`)
  }
  return { goi, nhatKy }
}
const rng = () => 0
const thuMucChieu = () => join(goc, NGAY, 'chieu')
const docJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'))

async function lay(toiDa?: number, mc = mayChuGia()) {
  const kq = await chayLayChieu({ ngay: NGAY, goc, goi: mc.goi, rng, ...(toiDa ? { toiDa } : {}) })
  return { kq, mc, bang: docJson(join(thuMucChieu(), '.bi-danh.json')).bang as Record<string, string> }
}
const biDanhCua = (bang: Record<string, string>, sbd: string) => Object.entries(bang).find(([, s]) => s === sbd)?.[0] as string
const ghiRa = (mang: unknown[], ten = 'chieu-01.json') => {
  mkdirSync(join(thuMucChieu(), 'ra'), { recursive: true })
  writeFileSync(join(thuMucChieu(), 'ra', ten), JSON.stringify(mang))
}
const pt = (b: string, chu: string, dang = ['ESTE.THUY_PHAN'], o: Record<string, unknown> = {}) => ({ biDanh: b, doTinCay: 0.8, thuThach: { dang, soCau: 5, bac: 'dung_bac' }, loiMoi: chu, ...o })

describe('lay.mjs --chieu', () => {
  it('chỉ lấy em CÓ TÍN HIỆU, không vắng, có mã dạng; xếp tín hiệu nhiều trước; chỉ thấy bí danh (không SBD/tên); đếm đúng', async () => {
    const { kq, bang } = await lay()
    expect(kq.dem).toMatchObject({ soEmCoThe: 7, soEmDuDieuKien: 4, soEmDuocLay: 3, tep: 1, coLuatChieu: true })
    expect(Object.values(bang).sort()).toEqual(['20001', '20004', '20007'])
    const vao = readFileSync(join(thuMucChieu(), 'vao', 'chieu-01.json'), 'utf8')
    for (const cam of ['20001', '20004', '20007', 'Trần Thu Hà', 'hoTen', 'sbd']) expect(vao, cam).not.toContain(cam)
    const mang = JSON.parse(vao)
    expect(mang.map((x: { biDanh: string }) => x.biDanh).sort()).toEqual(Object.keys(bang).sort())
    expect(mang.find((x: { biDanh: string }) => x.biDanh === biDanhCua(bang, '20001')).the.thanThu.ten).toBe('Rồng Lửa') // tên thú tới được AI
    // LỆNH TẠM (Boss 21/09 chiều): AI KHÔNG thấy số EXP / cấp / khiên của game — chỉ còn tên thú + chuỗi ngày; thẻ đầy đủ mã lệnh giữ riêng vẫn CÓ đủ (đối chiếu)
    for (const e of mang as { the: Record<string, unknown> }[]) {
      expect('exp' in e.the, 'exp bị ẩn').toBe(false)
      for (const k of ['cap', 'expConThieu', 'manhKhien', 'manhKhienTong']) expect(e.the.thanThu && k in (e.the.thanThu as object), `thanThu.${k}`).toBeFalsy()
    }
    expect(mang.find((x: { biDanh: string }) => x.biDanh === biDanhCua(bang, '20001')).the.thanThu).toEqual({ ten: 'Rồng Lửa', chuoiNgay: 4 })
    const dayDu = JSON.parse(readFileSync(join(thuMucChieu(), '.the-day-du.json'), 'utf8')).the as Record<string, { thanThu?: Record<string, unknown>; exp?: unknown }>
    expect(dayDu[biDanhCua(bang, '20001')]!.thanThu).toMatchObject({ ten: 'Rồng Lửa', cap: 6, expConThieu: 40 })
  })
  it('KHÔNG đụng lượt đêm: không có vao/ra của đêm, không ghi lan-cuoi.json; bí danh + thẻ đầy đủ quyền 600; có LUAT-CHIEU.md; ra/ trống', async () => {
    await lay()
    expect(existsSync(join(goc, NGAY, 'vao'))).toBe(false)
    expect(existsSync(join(goc, 'lan-cuoi.json'))).toBe(false)
    for (const f of ['.bi-danh.json', '.the-day-du.json']) expect(statSync(join(thuMucChieu(), f)).mode & 0o777, f).toBe(0o600)
    expect(readFileSync(join(thuMucChieu(), 'LUAT-CHIEU.md'), 'utf8')).toContain('LUẬT LƯỢT CHIỀU')
    expect(existsSync(join(thuMucChieu(), 'ra'))).toBe(true)
  })
  it('--toi-da: giữ em nhiều tín hiệu nhất; chạy lại cùng ngày GIỮ NGUYÊN bí danh', async () => {
    const a = await lay(1)
    expect(Object.values(a.bang)).toEqual(['20001'])
    const b1 = await lay()
    const b2 = await lay()
    expect(b2.bang).toEqual(b1.bang)
  })
  it('LẤY LẠI = trang trắng: ra/, xem-truoc.*, nop-ket-qua.json của lượt trước bị xoá (không bao giờ nộp nhầm lời cũ); bí danh vẫn giữ', async () => {
    const l1 = await lay()
    ghiRa([pt(biDanhCua(l1.bang, '20001'), LOI_TOT[0].chu)])
    await chayNopChieu({ ngay: NGAY, goc, goi: mayChuGia().goi, xemTruoc: true })
    writeFileSync(join(thuMucChieu(), 'nop-ket-qua.json'), '{}')
    expect(existsSync(join(thuMucChieu(), 'xem-truoc.md'))).toBe(true)
    const l2 = await lay()
    expect(l2.bang).toEqual(l1.bang)
    for (const f of ['xem-truoc.md', 'xem-truoc.json', 'nop-ket-qua.json', join('ra', 'chieu-01.json')]) expect(existsSync(join(thuMucChieu(), f)), f).toBe(false)
    expect(existsSync(join(thuMucChieu(), 'ra'))).toBe(true)
    // ra/ trống ⇒ nộp bị chặn từ đầu (mã 6), không có gì để nộp nhầm
    await expect(chayNopChieu({ ngay: NGAY, goc, goi: mayChuGia().goi })).rejects.toMatchObject({ maThoat: 6 })
  })
  it('cờ thuThach tắt hoặc bộ não tắt ⇒ dừng bằng lời (mã 4), không gọi lệnh lấy hồ sơ', async () => {
    for (const ch of [{ bat: true, thuThach: false }, { bat: false, thuThach: true }]) {
      const mc = mayChuGia(ch)
      await expect(chayLayChieu({ ngay: NGAY, goc, goi: mc.goi, rng })).rejects.toMatchObject({ maThoat: 4 })
      expect(mc.nhatKy.map((x) => x.duong)).toEqual(['/ai/cau-hinh'])
    }
  })
  it('điểm tín hiệu: mốc đáng khen ×2, làm hôm qua, làm 3 ngày, có thanThu', () => {
    expect(diemTinHieuChieu({ mocDangKhen: [{}], cau: { lamHomQua: 2, lam3: 5 }, thanThu: { ten: 'x' } })).toBe(5)
    expect(diemTinHieuChieu({ mocDangKhen: [], cau: { lamHomQua: 0, lam3: 0 } })).toBe(0)
    expect(diemTinHieuChieu(null)).toBe(0)
  })
})

describe('nop.mjs --chieu — xem trước rồi nộp', () => {
  async function chuanBi() {
    const l = await lay()
    const a = biDanhCua(l.bang, '20001')
    const d = biDanhCua(l.bang, '20004')
    ghiRa([pt(a, LOI_TOT[0].chu), pt(d, LOI_KHONG_THU.chu, ['LIPID.BEO'])])
    return { ...l, a, d }
  }
  it('moRongPhanTuChieu: núm RỖNG, không lời nhắn, chỉ mang thuThach + loiMoi; khoá thừa của AI bị bỏ', () => {
    const x = moRongPhanTuChieu({ biDanh: 'E001', doTinCay: 0.7, thuThach: { dang: ['A'], soCau: 4, bac: 'dung_bac' }, loiMoi: 'x 4', nhip: { lech: 3, khoiDong: 3 }, dang: [{ ma: 'A', hanhDong: 'tam_nghi' }], co: 'qua_tai', loiNhanChoEm: 'lời' })
    expect(x).toMatchObject({ nhip: { lech: 0, khoiDong: 2 }, dang: [], khacPhuc: [], co: 'khong', loiNhanChoEm: '', loiNhanChoPhuHuynh: '', thuTuan: '', canSau: false })
    expect(x.goiYChoThay).toEqual({ chu: '', hanhDong: 'khong', dang: '' })
    expect(moRongPhanTuChieu(null)).toBeNull()
  })
  it('--xem-truoc: ghi xem-truoc.md + .json, KHÔNG gọi máy chủ, không SBD/tên; lời hợp lệ có mặt, em bị loại có lý do', async () => {
    const { a, d, bang } = await chuanBi()
    const e = biDanhCua(bang, '20007')
    ghiRa([pt(a, LOI_TOT[0].chu), pt(d, LOI_KHONG_THU.chu, ['LIPID.BEO']), pt(e, LOI_CAM[0].chu), pt('E999', LOI_TOT[0].chu)])
    const mc = mayChuGia()
    const kq = await chayNopChieu({ ngay: NGAY, goc, goi: mc.goi, xemTruoc: true })
    expect(mc.nhatKy).toHaveLength(0)
    expect(kq).toMatchObject({ hopLe: 2, biLoai: 2, daNop: false })
    const md = readFileSync(join(thuMucChieu(), 'xem-truoc.md'), 'utf8')
    expect(md).toContain(LOI_TOT[0].chu)
    expect(md).toContain('nắm chắc')
    for (const cam of ['20001', '20004', '20007', 'Trần Thu Hà']) expect(md, cam).not.toContain(cam)
    expect(kq.loai.map((l: { biDanh: string }) => l.biDanh).sort()).toEqual([e, 'E999'].sort())
    expect(docJson(join(thuMucChieu(), 'xem-truoc.json')).cacEm).toHaveLength(2)
  })
  it('phần tử thiếu thuThach/loiMoi, hoặc thuThach sai khuôn (dạng ngoài thẻ, soCau ngoài 3–8) ⇒ LOẠI (không nộp phần rỗng)', async () => {
    const { a, d, bang } = await chuanBi()
    const e = biDanhCua(bang, '20007')
    ghiRa([{ biDanh: a, doTinCay: 0.8 }, pt(d, LOI_KHONG_THU.chu, ['KHONG.CO']), pt(e, LOI_TOT[0].chu, ['ESTE.THUY_PHAN'], { thuThach: { dang: ['ESTE.THUY_PHAN'], soCau: 12, bac: 'dung_bac' } })])
    const kq = await chayNopChieu({ ngay: NGAY, goc, goi: mayChuGia().goi, xemTruoc: true })
    expect(kq.hopLe).toBe(0)
    expect(kq.biLoai).toBe(3)
    const lyDo = kq.loai.map((l: { lyDo: string[] }) => l.lyDo.join(' | ')).join('\n')
    expect(lyDo).toContain('thiếu thuThach hoặc loiMoi')
    expect(lyDo).toContain('không có trong thẻ')
    expect(lyDo).toContain('soCau phải là số nguyên trong [3, 8]')
  })
  it('NỘP THẬT: chưa xem trước ⇒ từ chối (mã 7); sau khi xem trước ⇒ nộp đúng một lô, có SBD thật, núm rỗng, không biDanh', async () => {
    const { a } = await chuanBi()
    const mc = mayChuGia()
    await expect(chayNopChieu({ ngay: NGAY, goc, goi: mc.goi })).rejects.toMatchObject({ maThoat: 7 })
    expect(mc.nhatKy).toHaveLength(0)
    await chayNopChieu({ ngay: NGAY, goc, goi: mc.goi, xemTruoc: true })
    const kq = await chayNopChieu({ ngay: NGAY, goc, goi: mc.goi })
    expect(kq).toMatchObject({ daNop: true, nhan: 2, soApDung: 2 })
    expect(mc.nhatKy.map((x) => x.duong)).toEqual(['/ai/dieu-chinh/nop'])
    const than = mc.nhatKy[0].than
    expect(than.ngay).toBe(NGAY)
    expect(than.banTin).toBeUndefined()
    const em1 = than.cacEm.find((x: { sbd: string }) => x.sbd === '20001')
    expect(em1).toBeTruthy()
    expect('biDanh' in em1).toBe(false)
    expect(em1).toMatchObject({ nhip: { lech: 0, khoiDong: 2 }, dang: [], khacPhuc: [], co: 'khong', loiNhanChoEm: '', loiMoi: LOI_TOT[0].chu })
    expect(em1.thuThach).toEqual({ dang: ['ESTE.THUY_PHAN'], soCau: 5, bac: 'dung_bac' })
    expect(existsSync(join(thuMucChieu(), 'nop-ket-qua.json'))).toBe(true)
    expect(a).toBeTruthy()
  })
  it('sửa ra/ SAU khi xem trước ⇒ nộp bị từ chối (mã 7) tới khi xem trước lại', async () => {
    const { a } = await chuanBi()
    const mc = mayChuGia()
    await chayNopChieu({ ngay: NGAY, goc, goi: mc.goi, xemTruoc: true })
    const tep = join(thuMucChieu(), 'ra', 'chieu-01.json')
    const sau = new Date(Date.now() + 60_000)
    utimesSync(tep, sau, sau)
    await expect(chayNopChieu({ ngay: NGAY, goc, goi: mc.goi })).rejects.toMatchObject({ maThoat: 7 })
    await chayNopChieu({ ngay: NGAY, goc, goi: mc.goi, xemTruoc: true })
    const sauXem = new Date(Date.now() + 120_000)
    utimesSync(join(thuMucChieu(), 'xem-truoc.json'), sauXem, sauXem)
    await expect(chayNopChieu({ ngay: NGAY, goc, goi: mc.goi })).resolves.toMatchObject({ daNop: true })
    expect(a).toBeTruthy()
  })
  it('chưa có dữ liệu chiều / chưa có ra/ ⇒ lỗi bằng lời (mã 5 / 6)', async () => {
    await expect(chayNopChieu({ ngay: NGAY, goc, goi: mayChuGia().goi, xemTruoc: true })).rejects.toMatchObject({ maThoat: 5 })
    await lay()
    await expect(chayNopChieu({ ngay: NGAY, goc, goi: mayChuGia().goi, xemTruoc: true })).rejects.toMatchObject({ maThoat: 6 })
  })
  it('BÁO CÁO 6 DÒNG cho thầy: ghi cùng xem trước (DỰ KIẾN) và sau nộp (thật); số em, lý do loại gộp, bậc, 3 lời mẫu; không SBD / tên / bí danh', async () => {
    const { a, d, bang } = await chuanBi()
    const e = biDanhCua(bang, '20007')
    ghiRa([pt(a, LOI_CAM[0].chu), pt(d, LOI_KHONG_THU.chu, ['LIPID.BEO']), pt(e, LOI_KHONG_THU.chu), pt('E999', LOI_TOT[0].chu)]) // hợp lệ = d, e (cả hai CHƯA có thú); a (có thú) bị loại vì từ cấm
    const mc = mayChuGia()
    const xem = await chayNopChieu({ ngay: NGAY, goc, goi: mc.goi, xemTruoc: true })
    expect(xem.tepBaoCao).toBe(`bo-nao/${NGAY}/chieu/bao-cao.md`)
    const bc1 = readFileSync(join(thuMucChieu(), 'bao-cao.md'), 'utf8')
    const dong1 = bc1.trim().split('\n')
    expect(dong1).toHaveLength(6)
    expect(dong1[0]).toBe('Lượt chiều 21/09 (DỰ KIẾN, chưa nộp): 2 em sẽ nhận lời mời thử thách riêng, trong đó 2 em chưa chọn thú được mời chọn.')
    expect(dong1[1]).toContain('2 lời bị loại')
    expect(dong1[1]).toContain('1 vì từ cấm')
    expect(dong1[1]).toContain('1 vì phần tử lạ / trùng')
    expect(dong1[2]).toBe('Bậc: đúng bậc 2 · thấp hơn 0 · cao hơn 0; máy chủ chọn câu, mỗi em khoảng 5 câu.')
    expect(dong1[3]).toMatch(/^Mẫu 1: "/)
    expect(dong1[4]).toMatch(/^Mẫu 2: "/)
    expect(dong1[5]).toBe('Mẫu 3: (chưa có)') // chỉ 2 em hợp lệ ⇒ 2 mẫu
    for (const cam of ['20001', '20004', '20007', 'Trần Thu Hà', a, d, e, 'E999']) expect(bc1, cam).not.toContain(cam)
    await chayNopChieu({ ngay: NGAY, goc, goi: mc.goi })
    const bc2 = readFileSync(join(thuMucChieu(), 'bao-cao.md'), 'utf8').trim().split('\n')
    expect(bc2).toHaveLength(6)
    expect(bc2[0]).toBe('Lượt chiều 21/09: 2 em nhận lời mời thử thách riêng (2 áp dụng ngay), trong đó 2 em chưa chọn thú được mời chọn.')
  })
  it('soanBaoCaoChieu: không em nào / không lời nào bị loại / chỉ 1–2 em vẫn đủ 6 dòng; 3 mẫu chọn rải đều và khác nhau', () => {
    const hl = (chu: string, bac = 'dung_bac', soCau = 4) => ({ biDanh: 'E001', dauRa: { loiMoi: chu, thuThach: { dang: ['A'], soCau, bac } } })
    expect(soanBaoCaoChieu({ ngay: NGAY, hopLe: [], loai: [] }).trim().split('\n')).toHaveLength(6)
    const mot = soanBaoCaoChieu({ ngay: NGAY, hopLe: [hl('x 4')], loai: [] }).trim().split('\n')
    expect(mot).toHaveLength(6)
    expect(mot[1]).toBe('Không có lời nào bị loại.')
    expect(mot[4]).toContain('(chưa có)')
    const nhieu = soanBaoCaoChieu({ ngay: NGAY, hopLe: ['a 1', 'b 2', 'c 3', 'd 4', 'e 5'].map((c, i) => hl(c, i % 2 ? 'cao_hon_mot_bac' : 'dung_bac', 3 + i)), loai: [] }).trim().split('\n')
    expect(nhieu.slice(3)).toEqual(['Mẫu 1: "a 1"', 'Mẫu 2: "c 3"', 'Mẫu 3: "e 5"'])
    expect(nhieu[2]).toContain('đúng bậc 3 · thấp hơn 0 · cao hơn 2')
  })
  it('CẢNH BÁO CẢ LÔ (không loại): quá nửa lời mở "Hôm qua", < 4 kiểu mở đầu, đuôi lặp; lô đa dạng thì im; < 6 lời không xét', () => {
    const dongDieu = Array.from({ length: 10 }, (_, i) => `Hôm qua em làm ${i} câu. Hôm nay thử vài câu nhé, rồi chọn một thần thú để EXP có chỗ về.`)
    const kq = canhBaoLoLoiMoi(dongDieu)
    expect(kq.join(' | ')).toContain('10/10 lời mở bằng "Hôm qua"')
    expect(kq.join(' | ')).toContain('chỉ có 1 kiểu mở đầu trong 10 lời')
    expect(kq.join(' | ')).toContain('10/10 lời kết bằng gần y hệt')
    const daDang = ['Sai rồi sửa được 4 câu. Thử ngay vài câu A nhé.', 'Chuỗi 4 ngày liền. Hãy thử vài câu B để chắc thêm.', 'Hôm qua em làm 8 câu. Thử vài câu C cùng Rồng Lửa.', 'Rồng Lửa còn thiếu 40 EXP. Thử mấy câu D đi.', 'Em đã đạt 4 ngày. Hôm nay hãy thử câu E.', 'Ba ngày liền em tự làm thêm. Thử ngay mấy câu F.', 'Lipid em làm đều. Thử ngay câu G, rồi chọn một thần thú.', 'Sửa được lỗi là cách nhớ lâu. Thử mấy câu H nhé.']
    expect(canhBaoLoLoiMoi(daDang)).toEqual([])
    expect(canhBaoLoLoiMoi(dongDieu.slice(0, 5))).toEqual([])
  })
  it('nhomLyDo: gom lý do theo nhóm ngắn, thứ tự ưu tiên', () => {
    expect(nhomLyDo(['loiMoi có số không có trong thẻ: 55'])).toBe('số không có trong thẻ')
    expect(nhomLyDo(['loiMoi có từ cấm: nắm chắc'])).toBe('từ cấm (nhãn năng lực, so với bạn…)')
    expect(nhomLyDo(['loiMoi nêu số câu sẽ làm sau chữ "thử"'])).toBe('nêu số câu sẽ làm')
    expect(nhomLyDo(['thiếu thuThach hoặc loiMoi — lượt chiều chỉ có việc này'])).toBe('thiếu thuThach hoặc loiMoi')
    expect(nhomLyDo(['thuThach.dang[0] không có trong thẻ của em'])).toBe('sai khuôn thử thách')
    expect(nhomLyDo(['bí danh không có trong dữ liệu đêm này'])).toBe('phần tử lạ / trùng')
    expect(nhomLyDo(['gì đó khác hẳn'])).toBe('lý do khác')
  })
  it('soanXemTruoc không chứa SBD; ghi rõ lệnh nộp', () => {
    const md = soanXemTruoc({ ngay: NGAY, tao: 'x', loai: [], hopLe: [{ biDanh: 'E001', dauRa: { doTinCay: 0.8, loiMoi: 'Em đúng 4 câu.', thuThach: { dang: ['A'], soCau: 4, bac: 'cao_hon_mot_bac' } } }] })
    expect(md).toContain('chay-chieu.sh --nop 2026-09-21')
    expect(md).toContain('cao hơn một bậc')
  })
})

describe('chạy thật bằng dòng lệnh (không mạng, không mã bí mật)', () => {
  it('`nop.mjs --chieu --xem-truoc <ngày>` chạy được khi CHƯA có tệp mã bí mật; trỏ thư mục qua OMR_BO_NAO_GOC', async () => {
    await lay()
    const { bang } = { bang: docJson(join(thuMucChieu(), '.bi-danh.json')).bang as Record<string, string> }
    ghiRa([pt(biDanhCua(bang, '20001'), LOI_TOT[0].chu)])
    const ra = execFileSync(process.execPath, ['scripts/bo-nao/nop.mjs', '--chieu', '--xem-truoc', NGAY], { cwd: process.cwd(), env: { ...process.env, OMR_BO_NAO_GOC: goc, OMR_BO_NAO_THU_MUC: join(tam, 'khong-co-ma') }, encoding: 'utf8' })
    expect(ra).toContain('1 em hợp lệ')
    expect(ra).toContain('CHƯA NỘP')
    expect(existsSync(join(thuMucChieu(), 'xem-truoc.md'))).toBe(true)
  })
  it('`--xem-truoc` không kèm --chieu bị từ chối', () => {
    expect(() => execFileSync(process.execPath, ['scripts/bo-nao/nop.mjs', '--xem-truoc', NGAY], { cwd: process.cwd(), env: { ...process.env, OMR_BO_NAO_GOC: goc }, encoding: 'utf8', stdio: 'pipe' })).toThrow()
  })
})

describe('chay-chieu.sh + gói + lời dặn — phiên AI KHÔNG nộp được', () => {
  const doc = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
  it('chay-chieu.sh: cú pháp bash đúng; AI chỉ được lay --chieu và nop --chieu --xem-truoc; không cho nop.mjs trần; --nop không gọi AI', () => {
    execFileSync('bash', ['-n', 'scripts/bo-nao/chay-chieu.sh'], { cwd: process.cwd() })
    const sh = doc('scripts/bo-nao/chay-chieu.sh')
    expect(sh).toContain('"Bash(node scripts/bo-nao/lay.mjs --chieu:*)"')
    expect(sh).toContain('"Bash(node scripts/bo-nao/nop.mjs --chieu --xem-truoc:*)"')
    expect(sh).not.toMatch(/Bash\(node scripts\/bo-nao\/nop\.mjs:\*\)/)
    expect(sh).not.toMatch(/Bash\(node scripts\/bo-nao\/nop\.mjs --chieu:\*\)/)
    expect(sh).toContain('"Bash(git:*)"')
    const nhanhNop = sh.slice(sh.indexOf('if [ "$CHE_DO" = "nop" ]'), sh.indexOf('LOI_DAN='))
    expect(nhanhNop).toContain('node scripts/bo-nao/nop.mjs --chieu')
    expect(nhanhNop).not.toContain('claude')
    expect(statSync(join(process.cwd(), 'scripts/bo-nao/chay-chieu.sh')).mode & 0o100).toBeTruthy() // có quyền chạy
  })
  it('dong-goi.sh chép chay-chieu.sh, LUAT-CHIEU.md, LOI-DAN-CHIEU.md sang gói ổ trong', () => {
    const g = doc('scripts/bo-nao/dong-goi.sh')
    for (const t of ['chay-chieu.sh', 'LUAT-CHIEU.md', 'LOI-DAN-CHIEU.md']) expect(g, t).toContain(t)
  })
  it('LOI-DAN-CHIEU.md cấm nộp thật và cấm mở tệp bí danh; LUAT-CHIEU.md ≤ 1400 chữ, LUAT-RUT-GON ≤ 1200 chữ', () => {
    const ld = doc('bo-nao/LOI-DAN-CHIEU.md')
    expect(ld).toContain('KHÔNG chạy `nop.mjs` mà không có `--xem-truoc`')
    expect(ld).toContain('KHÔNG mở `.bi-danh.json`, `.the-day-du.json`')
    const dem = (t: string) => t.split(/\s+/).filter(Boolean).length
    expect(dem(doc('bo-nao/LUAT-CHIEU.md'))).toBeLessThanOrEqual(1400)
    expect(dem(doc('bo-nao/LUAT-RUT-GON.md'))).toBeLessThanOrEqual(1200)
  })
  it('8 lời mẫu TỐT + 7 lời mẫu CẤM có nguyên chữ ở cẩm nang VÀ ở LUAT-CHIEU.md; LUAT-RUT-GON dặn lượt đêm không ghi thuThach', () => {
    const camNang = doc('bo-nao/HUONG-DAN-BO-NAO.md')
    const luatChieu = doc('bo-nao/LUAT-CHIEU.md')
    for (const { chu } of [...LOI_TOT, ...LOI_CAM]) {
      expect(camNang, chu).toContain(chu)
      expect(luatChieu, chu).toContain(chu)
    }
    expect(doc('bo-nao/LUAT-RUT-GON.md')).toContain('Lượt đêm KHÔNG ghi `thuThach`/`loiMoi`')
  })
  it('cẩm nang nói ĐÚNG luật đã cài: hai trường đi cùng nhau, không nêu số câu, tên thú chỉ từ thanThu, cao_hon_mot_bac ≥ 80 %, Boss đọc xem trước trước khi nộp', () => {
    const c = doc('bo-nao/HUONG-DAN-BO-NAO.md')
    for (const t of ['ĐI CÙNG NHAU', 'KHÔNG nêu số câu', '`thanThu.ten`', 'đúng ≥ 80 % trong ≥ 5 câu 7 ngày', 'xem-truoc.md', 'chay-chieu.sh --nop', 'thuThach', 'loiMoi']) expect(c, t).toContain(t)
  })
  it('LUAT-CHIEU + cẩm nang nói ĐÚNG các điều Boss chốt sau lượt thử: ba ý bắt buộc, theo bậc, đa dạng, mời chọn thú ở cuối, tạm cấm khiên', () => {
    const l = doc('bo-nao/LUAT-CHIEU.md')
    const c = doc('bo-nao/HUONG-DAN-BO-NAO.md')
    for (const t of ['BA Ý BẮT BUỘC', 'khó hơn một bậc ở dạng X, vì em đã đúng N trong M câu', 'mình lùi một bậc để em lấy lại nhịp', 'không chữ "yếu"', '≥ 4 kiểu MỞ ĐẦU', 'KHÔNG mở bằng "Hôm qua" quá 1/3', 'CÂU CUỐI', 'KHÔNG nhắc khiên', 'CẤM khen chung chung']) expect(l, t).toContain(t)
    for (const t of ['BA Ý BẮT BUỘC', 'khó hơn một bậc', 'lùi một bậc', 'TẠM KHÔNG dùng', 'CÂU CUỐI', '47/52']) expect(c, t).toContain(t)
  })
  it('THE_KHONG_THU không có thanThu (mẫu 5–6 dành cho em chưa chọn thú)', () => {
    expect('thanThu' in (THE_KHONG_THU as object)).toBe(false)
    expect(LoiBoNao).toBeTruthy()
  })
})
