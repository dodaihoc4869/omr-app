// @vitest-environment node
// BỘ NÃO A.I — TẦNG ĐỌC (chế độ THẬT; `server/src/bo-nao-doc.ts`): điều chỉnh còn hạn → kế hoạch ngày (nhịp, on_som) + BTVN nâng đỡ (chốt + thích nghi chặng CHƯA MỞ);
// lời nhắn → `/hs/ke-hoach-ngay` (loiNhanHlv) và `/ph/ke-hoach` (boNaoAi). LUẬT CỨNG: chạy thử (bong) / tắt / hết hạn / đã huỷ / độ tin cậy thấp ⇒ Y HỆT chưa có gì, từng byte;
// không núm nào đổi han_nop; chặng đã mở không bao giờ đổi; công tắc về bong ⇒ dừng NGAY.
import { xoaDemKeHoach } from '../server/src/dem-ke-hoach'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { tinhNganSach, type DauVaoKeHoach } from '../server/src/ke-hoach-ngay'
import worker from '../server/src/index'
import { docBoNaoAiChoPhuHuynh, docLoiNhanHlv } from '../server/src/bo-nao-doc'
import { xoaDemCauHinhBoNao } from '../server/src/bo-nao'
import { thichNghiSauChang } from '../server/src/btvn-nang-do-d1'
import { parentPass } from '../server/src/game-v2-auth'
import { themNgay } from '../server/src/ho-so-nam-kt'
import { goiWorker, type D1That } from './_d1-that'
import { BAY_GIO, DAP_AN_DUNG, boCuaEm, dung, giao, gio, loiThieuKhongThay, maBtvn, mo, nopChang } from './_btvn-nang-do-mau'

// Lõi BTVN của Code 1 bọc lại để một test có thể GIẢ một lỗi lõi (trả bộ vi phạm bất biến) — mặc định đi thẳng qua hàm thật.
const loiLoi = { bien: null as null | ((kq: { bo: { chang: string[][]; loi: string[]; thuThach: string[] }; doi: unknown[]; henOnLai: string[] }) => unknown) }
vi.mock('../src/lib/btvn-nang-do', async (goc) => {
  const m = await goc<typeof import('../src/lib/btvn-nang-do')>()
  return { ...m, thichNghiChangSau: (...a: Parameters<typeof m.thichNghiChangSau>) => { const kq = m.thichNghiChangSau(...a); return loiLoi.bien ? (loiLoi.bien(kq as never) as typeof kq) : kq } }
})

afterEach(() => { vi.useRealTimers(); loiLoi.bien = null })

const HOM_NAY = '2026-09-22'
const bo = (r: Record<string, unknown>) => JSON.stringify({ ...r, serverNow: 0 })

function datCheDo(d: D1That, cauHinh: Record<string, unknown> | null) {
  d.sql.exec("DELETE FROM cau_hinh WHERE khoa = 'bo_nao'")
  if (cauHinh) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bo_nao',?,'x')").run(JSON.stringify(cauHinh))
  xoaDemCauHinhBoNao() // test tự sửa cau_hinh.bo_nao bằng SQL thô (không qua lệnh thật) ⇒ tự xoá đệm 30 giây (bo-nao.ts, HẠ TẢI 22/09)
}
interface TuyChonAi { apDung?: number; cheDo?: 'bong' | 'that'; huy?: number; tuGo?: number; hetHan?: string; lop?: string; doTin?: number }
/** Ghi một điều chỉnh + thẻ ngày (đường ghi DB — `bo-nao.ts` của Code 1 có test riêng cho đường nộp). */
function ai(d: D1That, sbd: string, ngay: string, dauRa: Record<string, unknown>, o: TuyChonAi = {}) {
  const j = { biDanh: '', doTinCay: 0.9, nhip: { lech: 0, khoiDong: 2 }, dang: [], khacPhuc: [], co: {}, loiNhanChoEm: '', loiNhanChoPhuHuynh: '', thuTuan: '', goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' }, ghiChuHlv: '', canSau: false, ...dauRa }
  d.sql.prepare('INSERT OR REPLACE INTO ai_dieu_chinh(sbd,ngay,json,do_tin,che_do,ap_dung,het_han,huy,tu_go,ly_do_bo,nop_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .run(sbd, ngay, JSON.stringify(j), o.doTin ?? 0.9, o.cheDo ?? 'that', o.apDung ?? 1, o.hetHan ?? themNgay(ngay, 3), o.huy ?? 0, o.tuGo ?? 0, '[]', 'x')
  d.sql.prepare('INSERT OR REPLACE INTO ai_ho_so_ngay(sbd,ngay,lop,luong,ly_do_luong,the_json,tao_luc) VALUES(?,?,?,?,?,?,?)').run(sbd, ngay, o.lop ?? '12A1', 'sau', '[]', '{}', 'x')
}
const keHoach = (d: D1That, sbd = 'S1') => goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd })
/** Xoá CHỈ kế hoạch hôm nay (lập lại khi gọi). Có sẵn một dòng kế hoạch ngày trước với so_su_kien = 0 để máy chủ KHÔNG dựng lại hồ sơ từ sổ (sổ trống) và xoá hồ sơ đặt tay. */
function xoaKeHoachHomNay(d: D1That) {
  xoaDemKeHoach() // SỬA CÓ CHỦ Ý 21/09 (đệm kế hoạch ngày 20 giây): test ghi thẳng SQL rồi dựng lại kế hoạch ⇒ phải xoá đệm mô-đun
  d.sql.prepare('DELETE FROM ke_hoach_ngay WHERE ngay = ?').run(HOM_NAY)
  for (const s of ['S1', 'S2']) d.sql.prepare("INSERT OR IGNORE INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,ket_qua,so_cau_da_lam,so_cau_len_bac,so_cau_tut_bac,la_ngay_nghi,so_su_kien,cap_nhat_luc) VALUES(?,?,?,1,1,'{}','[]','[]',NULL,0,0,0,0,0,'x')").run(`${s}|${themNgay(HOM_NAY, -1)}`, s, themNgay(HOM_NAY, -1))
}

describe('CHẠY THỬ / TẮT / KHÔNG HỢP LỆ ⇒ y như chưa có gì (kế hoạch ngày em)', () => {
  it('có điều chỉnh "áp dụng" + lời nhắn nằm trong bảng nhưng cấu hình BÓNG / bat:false / thiếu ⇒ /hs/ke-hoach-ngay GIỐNG HỆT bản không có bảng ai_*, không khoá loiNhanHlv', async () => {
    gio(BAY_GIO)
    const trang = dung()
    const goc = await keHoach(trang)
    for (const cauHinh of [null, { bat: true, cheDo: 'bong', lopThat: [] }, { bat: false, cheDo: 'that', lopThat: [] }, { bat: true, cheDo: 'bong', lopThat: ['LỚP-KHÁC'] }]) {
      const d = dung()
      datCheDo(d, cauHinh)
      ai(d, 'S1', HOM_NAY, { nhip: { lech: 3, khoiDong: 3 }, loiNhanChoEm: 'Hôm qua em làm 8 câu.' }, { cheDo: 'that', lop: '12A1' })
      xoaKeHoachHomNay(d)
      const r = await keHoach(d)
      expect(bo(r), JSON.stringify(cauHinh)).toBe(bo(goc))
      expect(r).not.toHaveProperty('loiNhanHlv')
    }
  })
  it('THẬT nhưng điều chỉnh HẾT HẠN / đã HUỶ / TỰ GỠ / độ tin cậy thấp (ap_dung 0) ⇒ nhịp và on_som KHÔNG có hiệu lực (kế hoạch y hệt)', async () => {
    gio(BAY_GIO)
    const trang = dung()
    const goc = await keHoach(trang)
    const truong: [string, TuyChonAi][] = [['hết hạn', { hetHan: '2026-09-21' }], ['đã huỷ', { huy: 1 }], ['tự gỡ', { tuGo: 1 }], ['tin cậy thấp', { apDung: 0, doTin: 0.4 }]]
    for (const [ten, o] of truong) {
      const d = dung()
      datCheDo(d, { bat: true, cheDo: 'that', lopThat: [] })
      ai(d, 'S1', themNgay(HOM_NAY, -1), { nhip: { lech: 3, khoiDong: 2 } }, o)
      xoaKeHoachHomNay(d)
      expect(bo(await keHoach(d)), ten).toBe(bo(goc))
    }
  })
})

describe('THẬT: nhịp vào ngân sách ngày (kẹp [6, 16], không vượt số phút em đặt), không đổi hạn', () => {
  it('nhịp −3 ⇒ ngân sách bớt (có lý do "Bộ não A.I"); nhịp +3 ⇒ thêm nhưng không vượt trần; nhịp 0 ⇒ y hệt', async () => {
    gio(BAY_GIO)
    const goc = (await keHoach(dung())).nganSach
    const chay = async (lech: number) => {
      const d = dung()
      datCheDo(d, { bat: true, cheDo: 'that', lopThat: [] })
      ai(d, 'S1', themNgay(HOM_NAY, -1), { nhip: { lech, khoiDong: 2 } })
      return (await keHoach(d)).nganSach
    }
    const giam = await chay(-3)
    expect(giam.mucTieuCau).toBe(Math.max(Math.min(6, goc.mucTieuCau), goc.mucTieuCau - 3))
    expect(giam.mucTieuCau).toBeLessThan(goc.mucTieuCau)
    expect(giam.dieuChinh.some((x: { lyDo: string }) => x.lyDo.startsWith('Bộ não A.I'))).toBe(true)
    const tang = await chay(3)
    expect(tang.mucTieuCau).toBeGreaterThanOrEqual(goc.mucTieuCau)
    expect(tang.mucTieuCau).toBeLessThanOrEqual(16)
    expect(tang.mucTieuCau).toBeLessThanOrEqual(Math.max(goc.mucTieuCau, Math.floor((goc.phutNgay * 60) / goc.vanTocGiay))) // không vượt phút/ngày em đặt
    expect(JSON.stringify(await chay(0))).toBe(JSON.stringify(goc))
  })
  it('KHÔNG BAO GIỜ đổi hạn nộp: han_nop của mọi bài giữ nguyên, hạn cứng/mềm việc BTVN trong kế hoạch không đổi', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    const hanTruoc = d.sql.prepare('SELECT han_nop FROM btvn').all()
    const viecHan = (r: Record<string, any>) => (r.viec as Record<string, any>[]).filter((v) => v.loai === 'btvn_lo' || v.loai === 'btvn_nop').map((v) => [v.loai, v.hanCung, v.nguon])
    const truoc = viecHan(await keHoach(d))
    datCheDo(d, { bat: true, cheDo: 'that', lopThat: [] })
    ai(d, 'S1', themNgay(HOM_NAY, -1), { nhip: { lech: -3, khoiDong: 3 }, dang: [{ ma: 'DA-1', hanhDong: 'tam_nghi', lyDo: 'x' }] })
    xoaKeHoachHomNay(d)
    expect(viecHan(await keHoach(d))).toEqual(truoc)
    expect(d.sql.prepare('SELECT han_nop FROM btvn').all()).toEqual(hanTruoc)
  })
})

describe('THẬT: on_som kéo mốc ôn SỚM hơn (chỉ sớm, không muộn), công tắc dừng NGAY', () => {
  function themCau(d: D1That, qid: string, dang: string, moc: string, trangThai = 'moi_sai') {
    d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,can_day_lai,cap_nhat_luc) VALUES(?,?,?,?,1,1,0,0,0,0,'thi','x',?,?,0,'x')")
      .run(`S1|${qid}`, 'S1', qid, dang, moc, trangThai)
  }
  const cauOn = (r: Record<string, any>) => ((r.viec as Record<string, any>[]).find((v) => v.loai === 'on_lai')?.chiTiet?.qid ?? []) as string[]

  it('câu vừa sai của dạng on_som có mốc ở tương lai ⇒ vào hàng ôn từ "ngày mai" của đêm điều chỉnh; dạng khác / mốc đã tới / hồ sơ nguồn KHÔNG đổi', async () => {
    gio(BAY_GIO)
    const d = dung()
    themCau(d, 'A-I-1', 'DA-X', themNgay(HOM_NAY, 5)) // dạng chọn, mốc xa ⇒ được kéo sớm
    themCau(d, 'A-I-2', 'DA-Y', themNgay(HOM_NAY, 5)) // dạng KHÁC ⇒ không đụng
    themCau(d, 'A-I-3', 'DA-X', themNgay(HOM_NAY, -2)) // mốc ĐÃ tới ⇒ vẫn như cũ (không muộn hơn)
    themCau(d, 'A-I-4', 'DA-X', themNgay(HOM_NAY, 6), 'da_khac_phuc') // đã khắc phục ⇒ không phải "vừa sai"
    xoaKeHoachHomNay(d)
    const truocHoSo = d.chup('nam_kt_cau')
    const goc = cauOn(await keHoach(d))
    expect(goc).toContain('A-I-3')
    expect(goc).not.toContain('A-I-1')
    datCheDo(d, { bat: true, cheDo: 'that', lopThat: [] })
    ai(d, 'S1', themNgay(HOM_NAY, -1), { khacPhuc: [{ dang: 'DA-X', kieu: 'on_som' }] })
    xoaKeHoachHomNay(d)
    const sau = cauOn(await keHoach(d))
    expect(sau).toContain('A-I-1')
    expect(sau).toContain('A-I-3')
    expect(sau).not.toContain('A-I-2')
    expect(sau).not.toContain('A-I-4')
    expect(d.chup('nam_kt_cau')).toBe(truocHoSo) // chỉ kéo trong bộ nhớ, không ghi lại hồ sơ
    // Điều chỉnh của CHÍNH hôm nay: "ngày mai" chưa tới ⇒ chưa kéo.
    ai(d, 'S1', HOM_NAY, { khacPhuc: [{ dang: 'DA-X', kieu: 'on_som' }] })
    d.sql.prepare('DELETE FROM ai_dieu_chinh WHERE ngay <> ?').run(HOM_NAY) // chỉ còn điều chỉnh của CHÍNH hôm nay (mới nhất mỗi em thắng)
    xoaKeHoachHomNay(d)
    expect(cauOn(await keHoach(d))).not.toContain('A-I-1')
    // CÔNG TẮC: về bong ⇒ dừng NGAY (không đợi hết hạn).
    d.sql.prepare('DELETE FROM ai_dieu_chinh WHERE ngay = ?').run(HOM_NAY)
    ai(d, 'S1', themNgay(HOM_NAY, -1), { khacPhuc: [{ dang: 'DA-X', kieu: 'on_som' }] })
    xoaKeHoachHomNay(d)
    expect(cauOn(await keHoach(d))).toContain('A-I-1')
    datCheDo(d, { bat: true, cheDo: 'bong', lopThat: [] })
    xoaKeHoachHomNay(d)
    expect(cauOn(await keHoach(d))).not.toContain('A-I-1')
  })
  it('THẬT theo LỚP: chỉ lớp trong lopThat có hiệu lực (lớp ghi ở thẻ ngày)', async () => {
    gio(BAY_GIO)
    const d = dung(2)
    for (const s of ['S1', 'S2']) d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,can_day_lai,cap_nhat_luc) VALUES(?,?,?,?,1,1,0,0,0,0,'thi','x',?,'moi_sai',0,'x')").run(`${s}|Q-I-1`, s, 'Q-I-1', 'DA-X', themNgay(HOM_NAY, 5))
    xoaKeHoachHomNay(d)
    datCheDo(d, { bat: true, cheDo: 'bong', lopThat: ['12A1'] })
    ai(d, 'S1', themNgay(HOM_NAY, -1), { khacPhuc: [{ dang: 'DA-X', kieu: 'on_som' }] }, { lop: '12A1' })
    ai(d, 'S2', themNgay(HOM_NAY, -1), { khacPhuc: [{ dang: 'DA-X', kieu: 'on_som' }] }, { lop: '12B2' })
    expect(cauOn(await keHoach(d, 'S1'))).toContain('Q-I-1')
    expect(cauOn(await keHoach(d, 'S2'))).not.toContain('Q-I-1')
  })
})

describe('THẬT: lời nhắn — loiNhanHlv (học sinh) và boNaoAi (phụ huynh)', () => {
  const dauRa = (e: string, ph = '', tuan = '') => ({ loiNhanChoEm: e, loiNhanChoPhuHuynh: ph, thuTuan: tuan })

  it('/hs/ke-hoach-ngay: {ngay, loi, gan≤7 mới nhất trước}; CHỈ lời cho em — không lời phụ huynh/thư tuần; đêm chạy thử/đã huỷ không lọt ra', async () => {
    gio(BAY_GIO)
    const d = dung()
    datCheDo(d, { bat: true, cheDo: 'that', lopThat: [] })
    for (let k = 9; k >= 0; k--) ai(d, 'S1', themNgay(HOM_NAY, -k), dauRa(`Lời em ngày -${k}`, `LỜI-PH-BÍ-MẬT-${k}`, `THƯ-TUẦN-BÍ-MẬT-${k}`))
    ai(d, 'S1', themNgay(HOM_NAY, -3), dauRa('Lời đêm CHẠY THỬ'), { cheDo: 'bong' })
    ai(d, 'S1', themNgay(HOM_NAY, -4), dauRa('Lời ĐÃ HUỶ'), { huy: 1 })
    const r = await keHoach(d)
    expect(r.loiNhanHlv).toMatchObject({ ngay: HOM_NAY, loi: 'Lời em ngày -0' })
    const ngayGan = r.loiNhanHlv.gan.map((x: { ngay: string }) => x.ngay)
    expect(r.loiNhanHlv.gan.length).toBeLessThanOrEqual(7)
    expect(ngayGan).toEqual([...ngayGan].sort().reverse()) // mới nhất trước
    expect(ngayGan).not.toContain(themNgay(HOM_NAY, -3)) // đêm chạy thử
    expect(ngayGan).not.toContain(themNgay(HOM_NAY, -4)) // đã huỷ
    const chuoi = JSON.stringify(r)
    expect(chuoi).not.toMatch(/BÍ-MẬT|CHẠY THỬ|ĐÃ HUỶ/)
  })
  it('lời mới nhất đã cũ (> 1 ngày) ⇒ không có khoá; đêm nay chưa có lời nhưng hôm qua có ⇒ vẫn hiện lời hôm qua', async () => {
    gio(BAY_GIO)
    const d = dung()
    datCheDo(d, { bat: true, cheDo: 'that', lopThat: [] })
    ai(d, 'S1', themNgay(HOM_NAY, -2), dauRa('Lời cũ hai ngày'))
    expect(await docLoiNhanHlv(d.env, 'S1', HOM_NAY)).toBeNull()
    ai(d, 'S1', themNgay(HOM_NAY, -1), dauRa('Lời hôm qua'))
    expect(await docLoiNhanHlv(d.env, 'S1', HOM_NAY)).toMatchObject({ ngay: themNgay(HOM_NAY, -1), loi: 'Lời hôm qua' })
    ai(d, 'S1', HOM_NAY, dauRa('')) // hôm nay không có lời ⇒ dùng lời hôm qua (bỏ dòng rỗng)
    expect(await docLoiNhanHlv(d.env, 'S1', HOM_NAY)).toMatchObject({ loi: 'Lời hôm qua' })
  })
  it('/ph/ke-hoach: boNaoAi {ngay, loiNhan, thuTuan, tuanTu} của ĐÚNG con (token); bong/không có ⇒ không khoá; không lộ lời cho em', async () => {
    gio(BAY_GIO)
    const d = dung(2)
    for (const s of ['S1', 'S2']) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES(?,?,?,'x')").run(s, `Em ${s}`, 'mk')
    const t1 = await parentPass(d.env, 'S1')
    const ph = (pass: string, them: Record<string, unknown> = {}) => goiWorker(worker, d.env, '/ph/ke-hoach', { pass, ...them })
    datCheDo(d, { bat: true, cheDo: 'bong', lopThat: [] })
    ai(d, 'S1', HOM_NAY, dauRa('Lời cho em', 'Lời cho phụ huynh S1', 'Thư tuần S1'))
    ai(d, 'S2', HOM_NAY, dauRa('Lời cho em', 'Lời cho phụ huynh S2', 'Thư tuần S2'))
    expect(await ph(t1)).not.toHaveProperty('boNaoAi') // chạy thử ⇒ không trả gì
    datCheDo(d, { bat: true, cheDo: 'that', lopThat: [] })
    const r = await ph(t1, { sbd: 'S2' }) // sbd trong thân bị bỏ, danh tính lấy từ token
    expect(r.boNaoAi).toEqual({ ngay: HOM_NAY, loiNhan: 'Lời cho phụ huynh S1', thuTuan: 'Thư tuần S1', tuanTu: HOM_NAY })
    expect(JSON.stringify(r)).not.toMatch(/S2|Lời cho em/)
    // thư tuần cũ 5 ngày vẫn hiện; lời phụ huynh cũ 3 ngày thì không.
    d.sql.exec("DELETE FROM ai_dieu_chinh WHERE sbd = 'S1'")
    ai(d, 'S1', themNgay(HOM_NAY, -3), dauRa('', 'Lời cũ', ''))
    ai(d, 'S1', themNgay(HOM_NAY, -5), dauRa('', '', 'Thư tuần cũ 5 ngày'))
    expect(await docBoNaoAiChoPhuHuynh(d.env, 'S1', HOM_NAY)).toEqual({ ngay: themNgay(HOM_NAY, -5), loiNhan: '', thuTuan: 'Thư tuần cũ 5 ngày', tuanTu: themNgay(HOM_NAY, -5) })
    d.sql.exec("DELETE FROM ai_dieu_chinh WHERE sbd = 'S1'")
    expect(await docBoNaoAiChoPhuHuynh(d.env, 'S1', HOM_NAY)).toBeNull()
  })
  it('lời nhắn KHÔNG có ở đường học sinh nào khác: /hs/btvn, /btvn/cua-em không chứa lời', async () => {
    gio(BAY_GIO)
    const d = dung()
    datCheDo(d, { bat: true, cheDo: 'that', lopThat: [] })
    ai(d, 'S1', HOM_NAY, dauRa('LỜI-EM-XYZ', 'LỜI-PH-XYZ', 'THƯ-XYZ'))
    await giao(d)
    for (const r of [await mo(d), await goiWorker(worker, d.env, '/hs/btvn', { sbd: 'S1' })]) expect(JSON.stringify(r)).not.toMatch(/XYZ/)
  })
})

describe('THẬT: BTVN nâng đỡ — chốt bộ + thích nghi chặng CHƯA MỞ', () => {
  const HOSO_MANH = (d: D1That, sbd = 'S1') => {
    for (const ma of ['DA-1', 'DA-2', 'DA-3', 'DA-4']) d.sql.prepare('INSERT OR REPLACE INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)').run(`${sbd}|${ma}`, sbd, ma, 10, 1, 1, 0, 9, 2, 'x')
  }
  const moChot = async (d: D1That) => {
    await giao(d)
    return mo(d)
  }

  it('BÓNG ≡ chưa có gì: cùng bộ câu, cùng phản hồi mở bài, cùng kết quả nộp chặng — dù bảng có điều chỉnh "áp dụng"', async () => {
    gio(BAY_GIO)
    const goc = dung()
    HOSO_MANH(goc)
    const m0 = await moChot(goc)
    const bo0 = boCuaEm(goc) // bộ NGAY SAU KHI CHỐT (trước khi nộp chặng): lượt mở bài của bảng có điều chỉnh phải ra đúng bộ này
    const c0 = bo0.filter((x) => x.chang === 0).map((x) => x.qid)
    // Làm SAI hết chặng 0: nếu thích nghi chạy ngầm (dù bóng) thì chặng kế sẽ đổi — phép thử nhạy hơn làm đúng.
    const SAI = (q: string) => (/-II-/.test(q) ? 'SDSD' : /-III-/.test(q) ? '1.5' : 'B')
    const n0 = await nopChang(goc, 0, Object.fromEntries(c0.map((q) => [q, SAI(q)])))
    for (const cauHinh of [{ bat: true, cheDo: 'bong', lopThat: [] }, null, { bat: false, cheDo: 'that', lopThat: [] }]) {
      const d = dung()
      HOSO_MANH(d)
      datCheDo(d, cauHinh)
      ai(d, 'S1', HOM_NAY, { nhip: { lech: 3, khoiDong: 3 }, dang: [{ ma: 'DA-1', hanhDong: 'tam_nghi', lyDo: 'x' }] })
      const m = await moChot(d)
      expect(bo(m)).toBe(bo(m0))
      expect(boCuaEm(d)).toEqual(bo0)
      const n = await nopChang(d, 0, Object.fromEntries(c0.map((q) => [q, SAI(q)])))
      expect(bo(n)).toBe(bo(n0))
      expect(boCuaEm(d)).toEqual(boCuaEm(goc)) // không thích nghi khi bóng
    }
  })

  it('THẬT lúc CHỐT: điều chỉnh còn hạn đi qua cổng dieuChinh (tam_nghi ⇒ không câu riêng của dạng, lõi vẫn còn); lưu vào ngan_sach_json; hạn nộp không đổi', async () => {
    gio(BAY_GIO)
    const goc = dung()
    HOSO_MANH(goc)
    await moChot(goc)
    const d = dung()
    HOSO_MANH(d)
    datCheDo(d, { bat: true, cheDo: 'that', lopThat: [] })
    ai(d, 'S1', themNgay(HOM_NAY, -1), { dang: [{ ma: 'DA-1', hanhDong: 'tam_nghi', lyDo: 'x' }] })
    await giao(d)
    const han = d.sql.prepare('SELECT han_nop FROM btvn').get()
    await mo(d)
    const loi = new Set((d.sql.prepare('SELECT qid FROM btvn_cau WHERE loi = 1').all() as { qid: string }[]).map((x) => x.qid))
    const dangCua = new Map((d.sql.prepare('SELECT qid, dang FROM btvn_cau').all() as { qid: string; dang: string }[]).map((x) => [x.qid, x.dang]))
    // LÕI ĐÚNG BẬC: câu thay lõi cũng không thuộc `loi` của bài ⇒ đếm theo DẠNG: tam_nghi ⇒ dạng ấy chỉ còn ĐÚNG số câu lõi của nó, không thêm câu riêng nào
    const soDA1 = (sbd: string, ds = boCuaEm(d, sbd)) => ds.filter((x) => dangCua.get(x.qid) === 'DA-1').length
    const soLoiDA1 = [...loi].filter((q) => dangCua.get(q) === 'DA-1').length
    expect(soDA1('S1')).toBeLessThanOrEqual(soLoiDA1) // tam_nghi
    expect(soDA1('S1', boCuaEm(goc))).toBeGreaterThan(soLoiDA1) // đối chứng: không điều chỉnh thì có câu riêng của dạng
    expect(loiThieuKhongThay(d)).toEqual([]) // lõi còn đủ
    const nsj = JSON.parse((d.sql.prepare("SELECT ngan_sach_json FROM btvn_em WHERE sbd='S1'").get() as { ngan_sach_json: string }).ngan_sach_json)
    expect(nsj.dieuChinh.dang).toEqual([{ ma: 'DA-1', nut: 'tam_nghi' }])
    expect(d.sql.prepare('SELECT han_nop FROM btvn').get()).toEqual(han)
  })

  it('THẬT thích nghi sau chặng: chặng ĐÃ MỞ / lõi / thử thách / số chặng / hạn KHÔNG đổi; so_cau_em + tom_tat khớp bộ mới; câu mới không lặp', async () => {
    gio(BAY_GIO)
    const d = dung()
    HOSO_MANH(d)
    await moChot(d)
    const truoc = boCuaEm(d)
    const em = d.sql.prepare("SELECT * FROM btvn_em WHERE sbd='S1'").get() as Record<string, unknown>
    const bt = d.sql.prepare('SELECT * FROM btvn').get() as Record<string, unknown>
    const c0 = truoc.filter((x) => x.chang === 0).map((x) => x.qid)
    // Chặng 0 làm SAI hết (mọi câu thường) ⇒ mẫu đủ để lõi thích nghi thêm/đổi câu ở chặng kế (nếu bộ còn chỗ).
    const dung0 = Object.fromEntries(c0.map((q) => [q, false]))
    const dc = { ngay: themNgay(HOM_NAY, -1), hetHan: themNgay(HOM_NAY, 2), doTin: 0.9, dieuChinh: {}, onSom: [], nhip: 0 }
    const han = d.sql.prepare('SELECT han_nop FROM btvn').get()
    const soDoi = await thichNghiSauChang(d.env, bt, em, 'S1', 0, 1, dung0, dc, BAY_GIO.getTime())
    const sau = boCuaEm(d)
    const soChangTruoc = Math.max(...truoc.map((x) => x.chang)) + 1
    expect(Math.max(...sau.map((x) => x.chang)) + 1).toBe(soChangTruoc)
    expect(sau.filter((x) => x.chang === 0)).toEqual(truoc.filter((x) => x.chang === 0)) // chặng 0 (đã mở/vừa xong) không đổi
    const loi = new Set((d.sql.prepare('SELECT qid FROM btvn_cau WHERE loi = 1').all() as { qid: string }[]).map((x) => x.qid))
    for (const x of truoc.filter((y) => loi.has(y.qid) || y.nhan === 'thu_thach')) expect(sau.some((y) => y.qid === x.qid && y.nhan === x.nhan)).toBe(true)
    expect(new Set(sau.map((x) => x.qid)).size).toBe(sau.length)
    expect(d.sql.prepare("SELECT so_cau_em FROM btvn_em WHERE sbd='S1'").get()).toMatchObject({ so_cau_em: sau.length })
    expect((JSON.parse((d.sql.prepare("SELECT tom_tat_json FROM btvn_em WHERE sbd='S1'").get() as { tom_tat_json: string }).tom_tat_json) as { tong: number }).tong).toBe(sau.length)
    expect(d.sql.prepare('SELECT han_nop FROM btvn').get()).toEqual(han)
    console.log(`[đo] thích nghi sau chặng 0 (toàn sai): ${soDoi} thay đổi; bộ ${truoc.length} → ${sau.length} câu`)
  })

  it('THẬT qua đường nộp chặng: có điều chỉnh còn hạn ⇒ thích nghi chạy nhưng chặng 0/hạn/số chặng không đổi; công tắc về bong giữa chừng ⇒ chặng kế KHÔNG bị đụng', async () => {
    gio(BAY_GIO)
    const d = dung()
    HOSO_MANH(d)
    datCheDo(d, { bat: true, cheDo: 'that', lopThat: [] })
    ai(d, 'S1', themNgay(HOM_NAY, -1), { nhip: { lech: 1, khoiDong: 2 } })
    await moChot(d)
    const truoc = boCuaEm(d)
    const c0 = truoc.filter((x) => x.chang === 0).map((x) => x.qid)
    const han = d.sql.prepare('SELECT han_nop FROM btvn').get()
    const r = await nopChang(d, 0, Object.fromEntries(c0.map((q) => [q, DAP_AN_DUNG(q)])))
    expect(r).toMatchObject({ ok: true, chang: { xong: true } })
    const sau = boCuaEm(d)
    expect(sau.filter((x) => x.chang === 0)).toEqual(truoc.filter((x) => x.chang === 0))
    expect(Math.max(...sau.map((x) => x.chang))).toBe(Math.max(...truoc.map((x) => x.chang)))
    expect(d.sql.prepare('SELECT han_nop FROM btvn').get()).toEqual(han)
    expect(JSON.stringify(await mo(d))).not.toContain('dap_an')
    // Công tắc về bong ⇒ nộp chặng tiếp theo không thích nghi nữa (bộ giữ nguyên như hiện có).
    datCheDo(d, { bat: true, cheDo: 'bong', lopThat: [] })
    const giua = boCuaEm(d)
    gio(new Date(BAY_GIO.getTime() + 24 * 3_600_000))
    const c1 = giua.filter((x) => x.chang === 1).map((x) => x.qid)
    await nopChang(d, 1, Object.fromEntries(c1.map((q) => [q, 'B'])))
    expect(boCuaEm(d)).toEqual(giua)
  })
})

describe('nhịp: biên [6, 16] và trần theo phút (hàm thuần tinhNganSach)', () => {
  const dauVao = (o: Partial<DauVaoKeHoach> = {}): DauVaoKeHoach => ({
    sbd: 'S1', now: BAY_GIO.getTime(), homNay: HOM_NAY, phutNgay: 45, mauGiay: Array(6).fill(50), btvn: [], mom: [], cauToiHan: [], soCauChuaKhacPhuc: 0, dang: [], nhiemVuThanThu: [], caSapToi: [], lichSu: [],
    daLamHomNay: { soCau: 0, lenBac: 0, tutBac: 0 }, homNayLaNgayNghi: false, ...o,
  })
  it('gốc 16 (em nhanh, học 45 phút): nhịp +3 vẫn 16, nhịp −3 còn 13; gốc 8 (đang nợ nhiều): nhịp −3 còn 6, +3 lên 11', () => {
    const nhanh = dauVao()
    expect(tinhNganSach(nhanh, 1).mucTieuCau).toBe(16)
    expect(tinhNganSach({ ...nhanh, boNao: { nhip: 3 } }, 1).mucTieuCau).toBe(16)
    expect(tinhNganSach({ ...nhanh, boNao: { nhip: -3 } }, 1).mucTieuCau).toBe(13)
    const no = dauVao({ soCauChuaKhacPhuc: 25, mauGiay: [] })
    const goc = tinhNganSach(no, 1).mucTieuCau
    expect(goc).toBe(8)
    expect(tinhNganSach({ ...no, boNao: { nhip: -3 } }, 1).mucTieuCau).toBe(6)
    expect(tinhNganSach({ ...no, boNao: { nhip: 3 } }, 1).mucTieuCau).toBeLessThanOrEqual(11)
    expect(tinhNganSach({ ...no, boNao: { nhip: 9 } }, 1).mucTieuCau).toBe(tinhNganSach({ ...no, boNao: { nhip: 3 } }, 1).mucTieuCau) // ngoài ±3 bị kẹp về ±3
    expect(tinhNganSach({ ...no, boNao: { nhip: 0 } }, 1)).toEqual(tinhNganSach(no, 1)) // nhịp 0 ⇒ y hệt (không dòng điều chỉnh)
  })
})

describe('bất biến của thích nghi được KIỂM LẠI ở máy chủ (một lỗi lõi không bao giờ chạm tới em)', () => {
  it('lõi trả bộ đổi chặng ĐÃ MỞ / bỏ câu lõi / thêm chặng ⇒ máy chủ bỏ cả thay đổi, bộ của em giữ nguyên', async () => {
    gio(BAY_GIO)
    const d = dung()
    for (const ma of ['DA-1', 'DA-2', 'DA-3', 'DA-4']) d.sql.prepare('INSERT OR REPLACE INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)').run(`S1|${ma}`, 'S1', ma, 10, 1, 1, 0, 9, 2, 'x')
    await giao(d)
    await mo(d)
    const truoc = boCuaEm(d)
    const em = d.sql.prepare("SELECT * FROM btvn_em WHERE sbd='S1'").get() as Record<string, unknown>
    const bt = d.sql.prepare('SELECT * FROM btvn').get() as Record<string, unknown>
    const dc = { ngay: themNgay(HOM_NAY, -1), hetHan: themNgay(HOM_NAY, 2), doTin: 0.9, dieuChinh: {}, onSom: [], nhip: 0 }
    const chay = () => thichNghiSauChang(d.env, bt, em, 'S1', 0, 1, {}, dc, BAY_GIO.getTime())
    const loiLoiKieu: [string, (kq: any) => any][] = [
      ['đổi chặng 0 (đã mở)', (kq) => ({ ...kq, doi: [{}], bo: { ...kq.bo, chang: kq.bo.chang.map((c: string[], i: number) => (i === 0 ? [...c].reverse().concat(c.length > 1 ? [] : ['X']) : c)) } })],
      ['bỏ một câu lõi', (kq) => ({ ...kq, doi: [{}], bo: { ...kq.bo, chang: kq.bo.chang.map((c: string[]) => c.filter((q) => q !== kq.bo.loi[kq.bo.loi.length - 1])) } })],
      ['thêm một chặng (đổi số ngày)', (kq) => ({ ...kq, doi: [{}], bo: { ...kq.bo, chang: [...kq.bo.chang, ['DE1-I-1']] } })],
    ]
    for (const [ten, bien] of loiLoiKieu) {
      loiLoi.bien = bien
      expect(await chay(), ten).toBe(0)
      expect(boCuaEm(d), ten).toEqual(truoc)
    }
    loiLoi.bien = null
  })
})
