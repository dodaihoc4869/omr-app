// BỘ NÃO — LỆNH MÁY CHỦ (`server/src/bo-nao.ts`, Code 1, 21/09/2026) trên D1 GIẢ BẰNG SQLITE THẬT (`_d1-that.ts`: nạp `schema.sql` + mọi migration, kể cả `migration-2109-bo-nao.sql`).
// Nghiệm thu: mọi em có hoạt động đều có thẻ · kiểm khuôn LẦN HAI ở máy chủ · chế độ BÓNG không đổi một byte ở bảng nào ngoài `ai_*` · tự áp dụng khi `that` + tin cậy ≥ 0,6 ·
// tự chấm hôm sau, `xau_di` ⇒ TỰ GỠ · bỏ điều chỉnh không bị "sống lại" khi nộp lại · số truy vấn mỗi trang ít · không có tên/SBD trong thẻ.
import { beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { taoD1That, type D1That } from './_d1-that'
import { boNaoBoDieuChinh, boNaoCauHinh, boNaoDemQua, boNaoHoSoNgay, boNaoNhatKy, boNaoNop, cheDoHieuLuc, docCauHinhBoNao, laPhanTuChieu, ngayVnTuMs } from '../server/src/bo-nao'
import { themNgay } from '../src/lib/bo-nao-dac-trung'
import { docDieuChinhHieuLuc } from '../server/src/bo-nao-doc'
import { docThuThachDaAp } from '../server/src/thu-thach-rieng'
import { gvBangTin } from '../server/src/gv-bang-tin'

const NGAY = '2026-09-22'
const NOW = Date.parse('2026-09-21T21:00:00.000Z') // 04:00 sáng 22/09 giờ Việt Nam
const truoc = (n: number) => themNgay(NGAY, -n)

let d: D1That
beforeEach(() => {
  d = taoD1That()
})

// ───────────────────────── dữ liệu mẫu ─────────────────────────
function themEm(sbd: string, ten: string, lop = '12A1', trangThai = 'da_duyet') {
  d.sql.exec(`INSERT OR REPLACE INTO hoc_sinh (sbd, ho_ten, lop, trang_thai, cap_nhat_luc) VALUES ('${sbd}', '${ten}', '${lop}', '${trangThai}', '2026-09-01T00:00:00Z')`)
}
let dem = 0
function suKien(sbd: string, nTruoc: number, qid: string, ketQua: 0 | 1 | null, o: { nguon?: string; giay?: number | null } = {}) {
  const ngay = truoc(nTruoc)
  d.sql.exec(
    `INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES ('k${++dem}', '${sbd}', '${qid}', '${o.nguon ?? 'btvn'}', 'm', 1, ${ketQua === null ? 'NULL' : ketQua}, ${o.giay ?? 'NULL'}, '${ngay}T02:00:00.000Z', '${ngay}')`,
  )
}
/** `k` câu trong ngày `n` ngày trước, `dung` câu đúng. */
function ngayHoc(sbd: string, nTruoc: number, k: number, dung: number, o: { nguon?: string; giay?: number | null; tienTo?: string } = {}) {
  for (let i = 0; i < k; i++) suKien(sbd, nTruoc, `${o.tienTo ?? 'q'}${sbd}-${nTruoc}-${i}`, i < dung ? 1 : 0, o)
}
function nkCau(sbd: string, qid: string, dang: string, lanSai: number, trangThai: string, nTruoc = 1) {
  d.sql.exec(
    `INSERT INTO nam_kt_cau (khoa, sbd, qid, ma_dang, chuyen_de, lan_gap, lan_sai, lan_trong, dung_lien_tiep, ngay_dung_khac_nhau, ket_qua_cuoi, nguon_cuoi, luc_cuoi, moc_on_ke, trang_thai, can_day_lai, giay_tb, cap_nhat_luc)
     VALUES ('${sbd}|${qid}', '${sbd}', '${qid}', '${dang}', 'CĐ', 2, ${lanSai}, 0, 0, 0, 0, 'btvn', '${truoc(nTruoc)}T02:00:00.000Z', '${truoc(0)}', '${trangThai}', 0, NULL, '${truoc(nTruoc)}T02:00:00.000Z')`,
  )
}
function nkDang(sbd: string, ma: string, bac: number, soGap: number, soSai: number, khac = 0, chua = 0) {
  d.sql.exec(`INSERT INTO nam_kt_dang (khoa, sbd, ma_dang, so_gap, so_sai, so_da_khac_phuc, so_moi_sai, so_chua_thay_sai, bac, moc_on_ke, moc_moi_sai, cap_nhat_luc) VALUES ('${sbd}|${ma}', '${sbd}', '${ma}', ${soGap}, ${soSai}, ${khac}, 0, ${chua}, ${bac}, NULL, NULL, '2026-09-21T00:00:00Z')`)
}
/** Em A: học đều, hôm qua 8 câu 7 đúng, có dạng ESTE.THUY_PHAN. Em B: vắng 4 ngày. Em C: chưa từng học. */
function dungBaEm() {
  themEm('12001', 'Nguyễn An', '12A1')
  themEm('12002', 'Trần Bình', '12A1')
  themEm('12003', 'Lê Chi', '12A2')
  ngayHoc('12001', 1, 8, 7)
  ngayHoc('12001', 3, 6, 4)
  ngayHoc('12001', 5, 6, 5)
  ngayHoc('12002', 5, 6, 4)
  nkCau('12001', 'q12001-3-0', 'ESTE.THUY_PHAN', 1, 'dang_on')
  nkDang('12001', 'ESTE.THUY_PHAN', 1, 9, 3, 2, 3)
  d.sql.exec(`INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('khac', '{}', 'x')`)
}
const hoSo = (o: Record<string, unknown> = {}) => boNaoHoSoNgay(d.env, { ngay: NGAY, ...o }, NOW)
const cauHinh = (o: Record<string, unknown>) => boNaoCauHinh(d.env, o)
/** Một phần tử đầu ra HỢP LỆ của bộ não cho em A. */
const dauRa = (o: Record<string, unknown> = {}) => ({
  sbd: '12001',
  doTinCay: 0.8,
  nhip: { lech: -2, khoiDong: 3 },
  dang: [{ ma: 'ESTE.THUY_PHAN', hanhDong: 'uu_tien', lyDo: 'đúng 7/8 câu hôm qua' }],
  khacPhuc: [],
  co: 'tut_nhip',
  loiNhanChoEm: 'Hôm qua em đúng 7/8 câu. Mai mình xếp sẵn ba câu cùng dạng cho em nhé.',
  loiNhanChoPhuHuynh: '',
  thuTuan: '',
  goiYChoThay: { chu: 'Hôm qua đúng 7/8 câu — theo dõi thêm', hanhDong: 'khong', dang: '' },
  ghiChuHlv: 'Đang thử giảm nhịp, chờ xem em có xong chặng',
  canSau: false,
  ...o,
})
const bang = (ten: string) => d.chup(ten)
const BANG_HOC_SINH = ['ke_hoach_ngay', 'btvn', 'btvn_em', 'su_kien_hoc', 'nam_kt_cau', 'nam_kt_dang', 'exp_so', 'game_v2_profile', 'luot', 'hoc_sinh']

// ───────────────────────── migration ─────────────────────────
describe('migration `migration-2109-bo-nao.sql`', () => {
  it('chỉ THÊM ba bảng ai_*; chạy lại nhiều lần không lỗi và không mất dữ liệu; không đụng bảng đang chạy', () => {
    const sql = readFileSync('server/migration-2109-bo-nao.sql', 'utf8')
    d.sql.exec(`INSERT INTO ai_ban_tin (ngay, json, nop_luc) VALUES ('2026-09-22', '{}', 'x')`)
    d.sql.exec(sql)
    d.sql.exec(sql)
    expect(d.dem('ai_ban_tin')).toBe(1)
    const ten = (d.sql.prepare(`SELECT name FROM sqlite_master WHERE name LIKE 'ai_%' AND type='table' ORDER BY name`).all() as { name: string }[]).map((x) => x.name)
    expect(ten).toEqual(['ai_ban_tin', 'ai_dieu_chinh', 'ai_ho_so_ngay'])
    expect(sql).not.toMatch(/\b(DROP|DELETE|ALTER)\b/i)
    expect(sql.match(/CREATE TABLE/g)).toHaveLength(3)
    const lenh = sql.split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n') // bỏ dòng chú thích
    expect(lenh.match(/IF NOT EXISTS/g)!.length).toBe(lenh.match(/CREATE (TABLE|INDEX)/g)!.length)
  })
})

// ───────────────────────── cấu hình ─────────────────────────
describe('/ai/cau-hinh', () => {
  it('mặc định {bat:true, cheDo:"bong", lopThat:[], thuThach:true}; ghi trộn từng phần (kể cả cờ thuThach); đọc lại đúng', async () => {
    expect(await boNaoCauHinh(d.env, {})).toEqual({ ok: true, cauHinh: { bat: true, cheDo: 'bong', lopThat: [], thuThach: true } })
    expect((await cauHinh({ lopThat: ['12A1', '12A1', '12B'] })).cauHinh).toEqual({ bat: true, cheDo: 'bong', lopThat: ['12A1', '12B'], thuThach: true })
    expect((await cauHinh({ cheDo: 'that' })).cauHinh).toEqual({ bat: true, cheDo: 'that', lopThat: ['12A1', '12B'], thuThach: true })
    expect((await cauHinh({ bat: false })).cauHinh.bat).toBe(false)
    expect((await cauHinh({ thuThach: false })).cauHinh).toMatchObject({ bat: false, thuThach: false }) // cờ thử thách riêng (Nấc 1) tắt được và các cờ khác giữ nguyên
    expect((await cauHinh({ cheDo: 'bong' })).cauHinh.thuThach).toBe(false) // ghi cờ khác KHÔNG làm mất cờ thuThach
    expect((await cauHinh({ thuThach: true })).cauHinh.thuThach).toBe(true)
    expect((await cauHinh({ thuThach: 'true' })).ok).toBe(false)
    await cauHinh({ cheDo: 'that' })
    expect(await docCauHinhBoNao(d.env)).toEqual({ bat: false, cheDo: 'that', lopThat: ['12A1', '12B'], thuThach: true })
    expect(d.dem('cau_hinh', "khoa = 'bo_nao'")).toBe(1)
  })
  it('giá trị lạ bị từ chối và KHÔNG ghi', async () => {
    for (const x of [{ bat: 'true' }, { cheDo: 'tu_hanh' }, { lopThat: 'a' }, { lopThat: [1] }, { lopThat: [''] }, { lopThat: ['x'.repeat(61)] }, { lopThat: Array.from({ length: 51 }, (_, i) => `l${i}`) }]) {
      expect((await cauHinh(x)).ok, JSON.stringify(x).slice(0, 40)).toBe(false)
    }
    expect(d.dem('cau_hinh', "khoa = 'bo_nao'")).toBe(0)
  })
  it('chế độ hiệu lực của lớp: nằm trong lopThat ⇒ that, còn lại theo cheDo chung; dữ liệu hỏng trong D1 rơi về mặc định', async () => {
    expect(cheDoHieuLuc({ bat: true, cheDo: 'bong', lopThat: ['12A1'] }, '12A1')).toBe('that')
    expect(cheDoHieuLuc({ bat: true, cheDo: 'bong', lopThat: ['12A1'] }, '12A2')).toBe('bong')
    expect(cheDoHieuLuc({ bat: true, cheDo: 'that', lopThat: [] }, '12A2')).toBe('that')
    d.sql.exec(`INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('bo_nao', 'không phải json', 'x')`)
    expect(await docCauHinhBoNao(d.env)).toEqual({ bat: true, cheDo: 'bong', lopThat: [], thuThach: true })
  })
  it('`bat:false` ⇒ hồ sơ ngày và nộp báo "đang tắt", không ghi gì', async () => {
    dungBaEm()
    await cauHinh({ bat: false })
    expect((await hoSo()).ok).toBe(false)
    expect((await boNaoNop(d.env, { ngay: NGAY, cacEm: [] }, NOW)).error).toContain('đang tắt')
    expect(d.dem('ai_ho_so_ngay')).toBe(0)
  })
})

// ───────────────────────── hồ sơ ngày ─────────────────────────
describe('/ai/ho-so-ngay', () => {
  it('mỗi em có hoạt động có thẻ + luồng; em vắng 4 ngày ⇒ vang; em chưa từng học ⇒ bo_qua (không thẻ, không lưu); thẻ được LƯU', async () => {
    dungBaEm()
    const r = await hoSo()
    expect(r).toMatchObject({ ok: true, ngay: NGAY, trang: 1, soTrang: 1, soEm: 3 })
    const em = (sbd: string) => (r.cacEm as { sbd: string; luong: string; lyDoLuong: string[]; the?: Record<string, unknown> }[]).find((x) => x.sbd === sbd)!
    expect(em('12001').luong).toMatch(/^(nhanh|sau)$/)
    expect(em('12001').the).toBeTruthy()
    expect(em('12002')).toMatchObject({ luong: 'vang', lyDoLuong: ['vắng 4 ngày liền'] })
    expect(em('12003')).toMatchObject({ luong: 'bo_qua' })
    expect(em('12003').the).toBeUndefined()
    expect(d.dem('ai_ho_so_ngay')).toBe(2) // chỉ em có hoạt động
    expect(d.dem('ai_ho_so_ngay', "sbd = '12003'")).toBe(0)
  })
  it('số liệu thẻ đúng cửa sổ ngày: hôm qua 8 câu 7 đúng; 7 ngày = 20 câu (không tính ngày−8 trở đi, không tính hôm nay)', async () => {
    dungBaEm()
    ngayHoc('12001', 9, 30, 30, { tienTo: 'cu' }) // ngoài 7 ngày
    ngayHoc('12001', 0, 9, 0, { tienTo: 'nay' }) // hôm nay
    const r = await hoSo()
    const t = (r.cacEm as { sbd: string; the: { cau: Record<string, number>; hoatDong: Record<string, number> } }[]).find((x) => x.sbd === '12001')!.the
    expect(t.cau).toMatchObject({ lam7: 20, dung7: 16, lamHomQua: 8, dungHomQua: 7 })
    expect(t.hoatDong.soNgayVang).toBe(0)
  })
  it('KHÔNG có SBD / tên / lớp trong thẻ đã lưu (AI không được thấy)', async () => {
    dungBaEm()
    await hoSo()
    const tat = (d.sql.prepare('SELECT the_json FROM ai_ho_so_ngay').all() as { the_json: string }[]).map((x) => x.the_json).join('\n')
    for (const cam of ['12001', '12002', 'Nguyễn An', 'Trần Bình', '12A1']) expect(tat, cam).not.toContain(cam)
  })
  it('PHÂN TRANG: coTrang 1 ⇒ 3 trang, mỗi trang một em theo SBD; trang ngoài phạm vi rỗng; coTrang kẹp ≤ 60', async () => {
    dungBaEm()
    const t1 = await hoSo({ trang: 1, coTrang: 1 })
    expect(t1).toMatchObject({ soTrang: 3, soEm: 3 })
    expect((t1.cacEm as { sbd: string }[]).map((x) => x.sbd)).toEqual(['12001'])
    expect(((await hoSo({ trang: 2, coTrang: 1 })).cacEm as { sbd: string }[]).map((x) => x.sbd)).toEqual(['12002'])
    expect(((await hoSo({ trang: 9, coTrang: 1 })).cacEm as unknown[]).length).toBe(0)
    expect((await hoSo({ coTrang: 9999 })).soTrang).toBe(1)
  })
  it('em bị khoá tài khoản không vào danh sách; em chỉ có trong danh sách lớp vẫn có (bo_qua nếu chưa học)', async () => {
    dungBaEm()
    themEm('12009', 'Khoá', '12A1', 'khoa')
    d.sql.exec(`INSERT INTO danh_sach (sbd, ho_ten, lop, cap_nhat_luc) VALUES ('12010', 'Chỉ có tên', '12A1', 'x')`)
    const r = await hoSo()
    const sbds = (r.cacEm as { sbd: string }[]).map((x) => x.sbd)
    expect(sbds).toContain('12010')
    expect(sbds).not.toContain('12009')
  })
  it('IDEMPOTENT: dựng lại cùng ngày ghi đè đúng dòng (không nhân đôi), thẻ giống hệt', async () => {
    dungBaEm()
    await hoSo()
    const truoc1 = d.chup('ai_ho_so_ngay').replace(/"tao_luc":"[^"]*"/g, '')
    await hoSo()
    expect(d.dem('ai_ho_so_ngay')).toBe(2)
    expect(d.chup('ai_ho_so_ngay').replace(/"tao_luc":"[^"]*"/g, '')).toBe(truoc1)
  })
  it('SỐ TRUY VẤN mỗi trang ít: ≤ 4 lượt batch và ≤ 25 câu lệnh với một trang 40 em', async () => {
    for (let i = 0; i < 40; i++) {
      themEm(`13${String(i).padStart(3, '0')}`, `Em ${i}`)
      ngayHoc(`13${String(i).padStart(3, '0')}`, 1, 3, 2)
    }
    const b0 = d.soLenh.batch
    const p0 = d.soLenh.prepare
    const r = await hoSo({ coTrang: 40 })
    expect((r.cacEm as unknown[]).length).toBe(40)
    expect(d.soLenh.batch - b0).toBeLessThanOrEqual(4)
    expect(d.soLenh.prepare - p0).toBeLessThanOrEqual(25 + 40) // truy vấn đọc (≈ 15) + 40 dòng ghi thẻ
  })
  it('tham số xấu: ngày sai định dạng ⇒ lỗi; `phan:"lop"` trả bức tranh cả lớp từ thẻ đã lưu', async () => {
    dungBaEm()
    expect((await boNaoHoSoNgay(d.env, { ngay: '22/09/2026' }, NOW)).ok).toBe(false)
    await hoSo()
    const l = await hoSo({ phan: 'lop' })
    expect(l).toMatchObject({ ok: true, ngay: NGAY, lop: { soEm: 2, soVang: 1 } })
    const macDinh = await boNaoHoSoNgay(d.env, {}, NOW) // ngày mặc định = hôm nay giờ Việt Nam
    expect(macDinh.ngay).toBe(NGAY)
    expect(ngayVnTuMs(NOW)).toBe(NGAY)
  })
  it('máy chủ chưa có cột `btvn_em.so_chang` vẫn dựng được hồ sơ (bài cũ không có chặng)', async () => {
    dungBaEm()
    const goc = d.env.DB.batch.bind(d.env.DB)
    let laLanDau = true
    ;(d.env.DB as { batch: unknown }).batch = async (ds: never[]) => {
      if (laLanDau && (ds as { _q?: string }[]).some((x) => /e\.so_chang/.test(x._q ?? ''))) {
        laLanDau = false
        throw new Error('D1_ERROR: no such column: e.so_chang')
      }
      return goc(ds)
    }
    expect((await hoSo()).ok).toBe(true)
    expect(laLanDau).toBe(false)
  })
})

// ───────────────────────── SAU XOÁ SỔ + TRẦN LỜI PHỤ HUYNH (Boss 21/09) ─────────────────────────
describe('máy chủ: `mocReset` và lịch sử lời cho phụ huynh đi vào thẻ', () => {
  const datMocReset = (ngayXong: string) =>
    d.sql.exec(`INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('reset_toan_app', '${JSON.stringify({ trangThai: 'xong', xongLuc: `${ngayXong}T05:00:00.000Z`, mocReset: ngayXong })}', 'x')`)
  /** Em tụt nhịp thật theo số đếm: 16 câu ở "4 ngày trước", 3 câu ở 3 ngày gần. */
  function emTut(sbd: string) {
    themEm(sbd, `Em Tụt ${sbd}`)
    ngayHoc(sbd, 5, 8, 6)
    ngayHoc(sbd, 6, 8, 6)
    ngayHoc(sbd, 1, 1, 1)
    ngayHoc(sbd, 2, 1, 1)
    ngayHoc(sbd, 3, 1, 1)
  }
  const theLuu = (sbd: string) => JSON.parse((d.sql.prepare('SELECT the_json FROM ai_ho_so_ngay WHERE sbd = ?').get(sbd) as { the_json: string }).the_json)

  it('CHƯA từng xoá sổ ⇒ như trước: em tụt nhịp có cờ tut_nhip', async () => {
    emTut('60001')
    await hoSo()
    expect(theLuu('60001').co).toContain('tut_nhip')
    expect(theLuu('60001').hoatDong).not.toHaveProperty('sauXoaSo')
  })
  it('vừa xoá sổ HÔM QUA ⇒ KHÔNG bật tut_nhip / moi_vao (tín hiệu giả); thẻ báo sauXoaSo; đủ 3 ngày sau xoá sổ ⇒ bật lại', async () => {
    datMocReset(truoc(1))
    emTut('60002')
    await hoSo()
    const t = theLuu('60002')
    expect(t.co).not.toContain('tut_nhip')
    expect(t.co).not.toContain('moi_vao')
    expect(t.hoatDong.sauXoaSo).toBe(true)
    d = taoD1That()
    datMocReset(truoc(3))
    emTut('60003')
    await hoSo()
    expect(theLuu('60003').co).toContain('tut_nhip')
  })
  it('lịch sử LỜI CHO PHỤ HUYNH trong 7 ngày: 1 lời ⇒ vẫn được viết; 2 lời ⇒ thẻ không còn lý do và nộp lời thứ ba bị bỏ (giữ núm) kèm cảnh báo trần', async () => {
    dungBaEm() // em 12002 vắng 4 ngày ⇒ có lý do "vang_3_ngay"
    const luuLoi = (sbd: string, nTruoc: number, dangMa: string) =>
      d.sql.exec(`INSERT INTO ai_dieu_chinh (sbd, ngay, json, do_tin, che_do, ap_dung, het_han, huy, tu_go, ly_do_bo, nop_luc) VALUES ('${sbd}', '${truoc(nTruoc)}', '${JSON.stringify({ nhip: { lech: 0, khoiDong: 2 }, dang: dangMa ? [{ ma: dangMa, hanhDong: 'uu_tien', lyDo: '7' }] : [], khacPhuc: [], co: 'khong', loiNhanChoEm: '', loiNhanChoPhuHuynh: 'Anh chị ơi, con làm đều.', thuTuan: '' })}', 0.7, 'bong', 0, '${truoc(nTruoc - 3)}', 0, 0, '[]', 'x')`)
    const nopPh = () => boNaoNop(d.env, { ngay: NGAY, cacEm: [dauRa({ sbd: '12002', dang: [], loiNhanChoEm: 'Em quay lại nhé, chỉ cần một chặng ngắn thôi.', goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' }, loiNhanChoPhuHuynh: 'Anh chị ơi, con vắng 4 ngày. Bộ não A.I đã xếp một chặng ngắn cho con. Anh chị chỉ cần nhắc con mở app.' })] }, NOW)
    luuLoi('12002', 2, 'ESTE.THUY_PHAN')
    // dạng do KHẮC PHỤC xử lý hôm đó cũng tính là "đã báo"
    d.sql.exec(`UPDATE ai_dieu_chinh SET json = json_set(json, '$.khacPhuc', json('[{"dang":"CARB.PHAN_LOAI","kieu":"on_som"}]')) WHERE sbd = '12002' AND ngay = '${truoc(2)}'`)
    await hoSo()
    let t = theLuu('12002')
    expect(t.soLoiPhuHuynh7).toBe(1)
    expect(t.lanCuoiLoiPhuHuynh).toBe(truoc(2))
    expect(t.dangLoiPhuHuynhTruoc).toEqual(['ESTE.THUY_PHAN', 'CARB.PHAN_LOAI'])
    expect(t.khiNaoVietPhuHuynh).toContain('vang_3_ngay') // 1 lời: chưa đủ trần
    expect((await nopPh()).canhBao).toEqual([]) // lời được nhận
    const luu1 = JSON.parse((d.sql.prepare("SELECT json FROM ai_dieu_chinh WHERE sbd = '12002' AND ngay = ?").get(NGAY) as { json: string }).json)
    expect(luu1.loiNhanChoPhuHuynh).toContain('Anh chị ơi')
    d.sql.exec(`DELETE FROM ai_dieu_chinh WHERE ngay = '${NGAY}'`)
    luuLoi('12002', 4, '')
    await hoSo()
    t = theLuu('12002')
    expect(t.soLoiPhuHuynh7).toBe(2)
    expect(t.khiNaoVietPhuHuynh).toEqual([]) // đủ 2 lời/7 ngày
    const r = await nopPh()
    expect(r.nhan).toBe(1) // núm vẫn được nhận
    expect(JSON.stringify(r.canhBao)).toContain('đã có 2 lời cho phụ huynh trong 7 ngày (trần 2)')
    const luu = JSON.parse((d.sql.prepare("SELECT json FROM ai_dieu_chinh WHERE sbd = '12002' AND ngay = ?").get(NGAY) as { json: string }).json)
    expect(luu.loiNhanChoPhuHuynh).toBe('') // lời bị bỏ
  })
  it('lời NGOÀI 7 ngày hoặc của hôm nay không tính vào trần; thư tuần không tính', async () => {
    dungBaEm()
    const luuLoi = (nTruoc: number) =>
      d.sql.exec(`INSERT INTO ai_dieu_chinh (sbd, ngay, json, do_tin, che_do, ap_dung, het_han, huy, tu_go, ly_do_bo, nop_luc) VALUES ('12001', '${truoc(nTruoc)}', '${JSON.stringify({ nhip: { lech: 0, khoiDong: 2 }, dang: [], khacPhuc: [], co: 'khong', loiNhanChoEm: '', loiNhanChoPhuHuynh: nTruoc === 3 ? '' : 'Anh chị ơi, con làm đều.', thuTuan: 'Thư tuần dài' })}', 0.7, 'bong', 0, '${truoc(nTruoc - 3)}', 0, 0, '[]', 'x')`)
    luuLoi(8) // ngoài cửa sổ
    luuLoi(9)
    luuLoi(3) // trong cửa sổ nhưng KHÔNG có lời phụ huynh (chỉ thư tuần)
    await hoSo()
    expect(theLuu('12001')).not.toHaveProperty('soLoiPhuHuynh7')
    expect(theLuu('12002')).not.toHaveProperty('soLoiPhuHuynh7')
  })
})

// ───────────────────────── chốt luồng cả lớp ─────────────────────────
describe('/ai/ho-so-ngay {phan:"lop"} — CHỐT LUỒNG CẢ LỚP (dạng cả lớp cùng sai, trần luồng sâu 25 %)', () => {
  /** Em học đều + 3 lần sai lặp cùng dạng `ma` trong 7 ngày. */
  function emSaiLap(sbd: string, ma: string) {
    themEm(sbd, `Em ${sbd}`)
    ngayHoc(sbd, 1, 6, 5)
    for (let i = 0; i < 3; i++) {
      const qid = `s${sbd}-${i}`
      nkCau(sbd, qid, ma, 1, 'moi_sai')
      suKien(sbd, 2 + i, qid, 0)
    }
  }
  function dungLop30() {
    for (let i = 0; i < 20; i++) emSaiLap(`40${String(i).padStart(3, '0')}`, 'DON.CHAT.NITROGEN')
    for (let i = 0; i < 10; i++) {
      themEm(`41${String(i).padStart(3, '0')}`, `Em thường ${i}`)
      ngayHoc(`41${String(i).padStart(3, '0')}`, 1, 6, 5)
    }
  }
  const soSauLuu = () => d.dem('ai_ho_so_ngay', "luong = 'sau'")

  it('20/30 em cùng sai lặp một dạng: các trang dựng TẠM (nhiều em sâu); phan:"lop" ghi dangCaLopYeu MỘT lần, đổi luồng, sâu ≤ 25 % (7/30), lưu lại', async () => {
    dungLop30()
    await hoSo({ coTrang: 60 })
    const tam = soSauLuu()
    expect(tam).toBeGreaterThan(7) // 20 em sai lặp ⇒ tạm thời đều là ứng viên sâu
    const r = (await hoSo({ phan: 'lop' })) as any
    expect(r.ok).toBe(true)
    expect(r.lop.dangCaLopYeu).toEqual([{ ma: 'DON.CHAT.NITROGEN', soEm: 20, phanTram: 67, tongSai: 60 }]) // 20/30 em có hoạt động
    expect(r.lop.soEmHoatDong).toBe(30)
    expect(r.tran.toiDaSau).toBe(7)
    expect(soSauLuu()).toBeLessThanOrEqual(7)
    expect(r.lop.soSoiKy).toBe(soSauLuu())
    expect(r.lop.soSoiNhanh + r.lop.soSoiKy + r.lop.soVang).toBe(30)
    expect(r.doiLuong.length).toBeGreaterThan(0)
    // em còn ở sâu KHÔNG còn vì dạng cả lớp: lý do chỉ là xoay vòng (không ai có dạng riêng)
    const sau = d.sql.prepare("SELECT ly_do_luong FROM ai_ho_so_ngay WHERE luong = 'sau'").all() as { ly_do_luong: string }[]
    for (const x of sau) expect(JSON.parse(x.ly_do_luong)).toEqual(['tới lượt soi kỹ xoay vòng hằng tuần'])
  })
  it('IDEMPOTENT: gọi lại phan:"lop" không đổi gì (doiLuong rỗng); dựng lại các trang rồi chốt lại ra CÙNG kết quả', async () => {
    dungLop30()
    await hoSo({ coTrang: 60 })
    const a = (await hoSo({ phan: 'lop' })) as any
    const luongA = d.chup('ai_ho_so_ngay').replace(/"tao_luc":"[^"]*"/g, '')
    const b = (await hoSo({ phan: 'lop' })) as any
    expect(b.doiLuong).toEqual([])
    expect(b.lop).toEqual(a.lop)
    await hoSo({ coTrang: 60 }) // dựng lại từng trang ⇒ luồng tạm ghi đè
    await hoSo({ phan: 'lop' })
    expect(d.chup('ai_ho_so_ngay').replace(/"tao_luc":"[^"]*"/g, '')).toBe(luongA)
  })
  it('dạng cả lớp chỉ áp khi ≥ 30 % em: 3 em sai lặp trong 30 em (10 %) ⇒ không ghi dangCaLopYeu, các em ấy vẫn được xét sâu theo điểm', async () => {
    for (let i = 0; i < 3; i++) emSaiLap(`42${String(i).padStart(3, '0')}`, 'DANG.HIEM')
    for (let i = 0; i < 27; i++) {
      themEm(`43${String(i).padStart(3, '0')}`, `Em ${i}`)
      ngayHoc(`43${String(i).padStart(3, '0')}`, 1, 6, 5)
    }
    await hoSo({ coTrang: 60 })
    const r = (await hoSo({ phan: 'lop' })) as any
    expect(r.lop.dangCaLopYeu).toEqual([])
    expect(d.dem('ai_ho_so_ngay', "luong = 'sau' AND ly_do_luong LIKE '%sai lặp%'")).toBe(3)
  })
  it('bản tin nhắc dạng cả lớp bằng số của lớp được nhận (số nằm trong lop.dangCaLopYeu); em vắng và bo_qua giữ nguyên luồng', async () => {
    dungLop30()
    themEm('44000', 'Vắng'); ngayHoc('44000', 6, 6, 4)
    await hoSo({ coTrang: 60 })
    const lop = (await hoSo({ phan: 'lop' })) as any
    expect(d.sql.prepare("SELECT luong FROM ai_ho_so_ngay WHERE sbd = '44000'").get()).toEqual({ luong: 'vang' })
    const so = lop.lop.dangCaLopYeu[0]
    const nop = await boNaoNop(d.env, { ngay: NGAY, cacEm: [], banTin: { cacDong: [{ loai: 'ca_lop', sbd: '', chu: `Cả lớp cùng sai một dạng: ${so.soEm} em (${so.phanTram} %)`, hanhDong: 'dua_vao_buoi_chua', dang: '' }] } }, NOW)
    expect(nop.banTin).toEqual({ nhan: 1, loi: [], canhBao: [] })
    const nopSai = await boNaoNop(d.env, { ngay: NGAY, cacEm: [], banTin: { cacDong: [{ loai: 'ca_lop', sbd: '', chu: 'Cả lớp cùng sai một dạng: 99 em', hanhDong: 'khong', dang: '' }] } }, NOW)
    // số lạ ở dòng bản tin CHỈ CẢNH BÁO: dòng vẫn được nhận (Boss 21/09)
    expect(nopSai.banTin).toEqual({ nhan: 1, loi: [], canhBao: ['dòng 1: số không có trong số liệu lớp: 99'] })
  })
})

// ───────────────────────── nộp ─────────────────────────
describe('/ai/dieu-chinh/nop', () => {
  const nop = (cacEm: unknown[], banTin?: unknown) => boNaoNop(d.env, { ngay: NGAY, cacEm, ...(banTin ? { banTin } : {}) }, NOW)
  beforeEach(async () => {
    dungBaEm()
    await hoSo()
  })

  it('CHẾ ĐỘ BÓNG (mặc định): phần tử hợp lệ được LƯU nhưng KHÔNG áp dụng; đếm đúng; bảng của học sinh không đổi một byte', async () => {
    const truocBang = BANG_HOC_SINH.map(bang)
    const r = await nop([dauRa()])
    expect(r).toMatchObject({ ok: true, nhan: 1, chiGhiSo: 1, soApDung: 0, biLoai: 0 })
    const x = d.sql.prepare(`SELECT * FROM ai_dieu_chinh WHERE sbd = '12001'`).get() as Record<string, unknown>
    expect(x).toMatchObject({ ngay: NGAY, che_do: 'bong', ap_dung: 0, huy: 0, tu_go: 0, het_han: truoc(-3), do_tin: 0.8 })
    expect(BANG_HOC_SINH.map(bang)).toEqual(truocBang) // bảng học sinh / kế hoạch ngày / BTVN nguyên vẹn
  })
  it('CHẾ ĐỘ THẬT (cả trường hoặc lớp của em trong lopThat) + tin cậy ≥ 0,6 ⇒ ÁP DỤNG; < 0,6 ⇒ chỉ ghi sổ', async () => {
    await cauHinh({ lopThat: ['12A1'] })
    const r = await nop([dauRa()])
    expect(r).toMatchObject({ nhan: 1, soApDung: 1, chiGhiSo: 0 })
    expect(d.dem('ai_dieu_chinh', "che_do = 'that' AND ap_dung = 1")).toBe(1)
    await nop([dauRa({ doTinCay: 0.59 })])
    expect(d.sql.prepare(`SELECT ap_dung FROM ai_dieu_chinh WHERE sbd = '12001'`).get()).toEqual({ ap_dung: 0 })
    await nop([dauRa({ doTinCay: 0.6 })])
    expect(d.sql.prepare(`SELECT ap_dung FROM ai_dieu_chinh WHERE sbd = '12001'`).get()).toEqual({ ap_dung: 1 })
    // lớp KHÁC (không trong lopThat, cheDo chung bóng) ⇒ không áp dụng
    await cauHinh({ lopThat: ['12A9'] })
    await nop([dauRa()])
    expect(d.sql.prepare(`SELECT che_do, ap_dung FROM ai_dieu_chinh WHERE sbd = '12001'`).get()).toEqual({ che_do: 'bong', ap_dung: 0 })
  })
  it('KIỂM KHUÔN LẦN HAI ở máy chủ: số không có trong thẻ, từ cấm, dạng lạ, biên độ ⇒ loại kèm lý do, KHÔNG lưu', async () => {
    const r = await nop([
      dauRa({ loiNhanChoEm: 'Hôm qua em đúng 99 câu.' }),
      dauRa({ sbd: '12002', loiNhanChoEm: 'Em còn yếu.' }),
    ])
    expect(r).toMatchObject({ ok: true, nhan: 0, biLoai: 2 })
    expect((r.loai as { sbd: string; lyDo: string[] }[])[0].lyDo.join()).toContain('có số không có trong thẻ: 99')
    expect((r.loai as { sbd: string; lyDo: string[] }[])[1].lyDo.join()).toContain('có từ cấm: yếu') // em 12002 có thẻ (vắng), nhưng lời "còn yếu" là nhãn năng lực
    expect(d.dem('ai_dieu_chinh')).toBe(0)
    const r2 = await nop([dauRa({ nhip: { lech: 5, khoiDong: 2 } }), dauRa({ dang: [{ ma: 'DANG.LA', hanhDong: 'uu_tien', lyDo: '7 câu' }] })])
    expect(r2.biLoai).toBe(2) // phần tử đầu sai biên độ nhịp; phần tử thứ hai cùng em ⇒ loại vì trùng (mỗi em một phần tử mỗi ngày, không "cứu" phần tử sau)
    expect((r2.loai as { lyDo: string[] }[]).map((x) => x.lyDo[0])).toEqual([expect.stringContaining('nhip.lech'), expect.stringContaining('trùng em')])
    expect(d.dem('ai_dieu_chinh')).toBe(0)
  })
  it('em KHÔNG có thẻ đêm ấy (chưa dựng hồ sơ / bo_qua) ⇒ loại; mỗi em MỘT phần tử mỗi ngày (phần tử trùng bị loại)', async () => {
    const r = await nop([dauRa({ sbd: '12003' }), dauRa(), dauRa({ loiNhanChoEm: 'Em làm tốt, đúng 7 câu.' })])
    expect(r).toMatchObject({ nhan: 1, biLoai: 2 })
    const lyDo = (r.loai as { sbd: string; lyDo: string[] }[]).map((x) => `${x.sbd}:${x.lyDo[0]}`)
    expect(lyDo.some((x) => x.startsWith('12003:không có thẻ'))).toBe(true)
    expect(lyDo.some((x) => x.startsWith('12001:trùng em'))).toBe(true)
    expect(d.dem('ai_dieu_chinh')).toBe(1)
  })
  it('LỜI CHO PHỤ HUYNH: ngày thường (thẻ không có lý do) ⇒ lời bị BỎ nhưng phần núm được giữ, báo cảnh báo; lời KHÔNG bao giờ được lưu', async () => {
    const r = await nop([dauRa({ loiNhanChoPhuHuynh: 'Anh chị ơi, con đúng 7 câu hôm qua. Bộ não A.I đã xếp thêm câu cho con.' })])
    expect(r.nhan).toBe(1)
    expect((r.canhBao as { sbd: string; canhBao: string[] }[])[0].canhBao.join()).toContain('không có lý do được phép')
    const j = JSON.parse((d.sql.prepare(`SELECT json FROM ai_dieu_chinh WHERE sbd = '12001'`).get() as { json: string }).json)
    expect(j.loiNhanChoPhuHuynh).toBe('')
    expect(j.nhip).toEqual({ lech: -2, khoiDong: 3 })
  })
  it('LỜI CHO PHỤ HUYNH có lý do (vắng 4 ngày ở thẻ em B) được LƯU nguyên văn; thư tuần chỉ khi tới lượt soi kỹ', async () => {
    const r = await nop([{ ...dauRa({ sbd: '12002', dang: [], loiNhanChoEm: 'Em quay lại nhé, chỉ cần một chặng ngắn thôi.', loiNhanChoPhuHuynh: 'Anh chị ơi, con vắng 4 ngày. Bộ não A.I đã xếp một chặng ngắn cho con. Anh chị chỉ cần nhắc con mở app.' }), goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' } }])
    expect(r).toMatchObject({ nhan: 1 })
    const j = JSON.parse((d.sql.prepare(`SELECT json FROM ai_dieu_chinh WHERE sbd = '12002'`).get() as { json: string }).json)
    expect(j.loiNhanChoPhuHuynh).toContain('Anh chị ơi')
  })
  it('NỘP LẠI ghi đè đúng dòng; điều chỉnh đã BỊ BỎ không "sống lại" (huy giữ nguyên, ap_dung về 0)', async () => {
    await cauHinh({ cheDo: 'that' })
    await nop([dauRa()])
    expect(d.dem('ai_dieu_chinh')).toBe(1)
    await boNaoBoDieuChinh(d.env, { sbd: '12001', ngay: NGAY })
    await nop([dauRa({ doTinCay: 0.9 })])
    expect(d.dem('ai_dieu_chinh')).toBe(1)
    expect(d.sql.prepare(`SELECT huy, ap_dung, do_tin FROM ai_dieu_chinh WHERE sbd = '12001'`).get()).toEqual({ huy: 1, ap_dung: 0, do_tin: 0.9 })
  })
  it('BẢN TIN: hợp lệ được lưu kèm số đếm đêm; số bịa / quá 6 dòng ⇒ báo lỗi, KHÔNG lưu bản tin (điều chỉnh vẫn nhận)', async () => {
    const dong = (o: Record<string, unknown> = {}) => ({ loai: 'ca_lop', sbd: '', chu: 'Có 2 em soi kỹ đêm nay', hanhDong: 'khong', dang: '', ...o })
    const ok = await nop([dauRa()], { cacDong: [dong(), dong({ loai: 'can_thay_y', sbd: '12002', chu: 'Có 1 em vắng liền nhiều ngày', hanhDong: 'nhan_phu_huynh' })] })
    expect(ok.banTin).toEqual({ nhan: 2, loi: [], canhBao: [] })
    expect(d.sql.prepare('SELECT so_em, so_vang, so_nhan, che_do FROM ai_ban_tin').get()).toMatchObject({ so_em: 2, so_vang: 1, so_nhan: 1, che_do: 'bong' })
    d.sql.exec('DELETE FROM ai_ban_tin')
    d.sql.exec('DELETE FROM ai_ban_tin')
    const xau = await nop([dauRa()], { cacDong: [dong({ chu: 'Có 77 em soi kỹ' })] })
    // số lạ ở bản tin CHỈ CẢNH BÁO: dòng vẫn được lưu
    expect(xau.banTin).toEqual({ nhan: 1, loi: [], canhBao: ['dòng 1: số không có trong số liệu lớp: 77'] })
    expect(xau.nhan).toBe(1)
    expect(d.dem('ai_ban_tin')).toBe(1)
    d.sql.exec('DELETE FROM ai_ban_tin')
    // dòng SAI KHUÔN thật (loại lạ) vẫn bị loại cả bản tin
    const hong = await nop([dauRa()], { cacDong: [dong({ loai: 'khac' })] })
    expect((hong.banTin as { nhan: number }).nhan).toBe(0)
    expect(d.dem('ai_ban_tin')).toBe(0)
    const nhieu = await nop([], { cacDong: Array.from({ length: 7 }, () => dong()) })
    expect((nhieu.banTin as { loi: string[] }).loi.join()).toContain('quá 6 dòng')
  })
  it('NHIỀU LÔ: bản tin gắn vào lô CUỐI vẫn đếm đủ số em đã nhận ở mọi lô (tính lại từ bảng)', async () => {
    await nop([dauRa()]) // lô 1: em 12001, chưa có bản tin
    const r = await nop([dauRa({ sbd: '12002', dang: [], loiNhanChoEm: 'Em quay lại nhé, chỉ cần một chặng ngắn thôi.', goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' } })], { cacDong: [{ loai: 'ca_lop', sbd: '', chu: 'Đêm nay có 2 em có thẻ', hanhDong: 'khong', dang: '' }] }) // lô 2 + bản tin
    expect(r).toMatchObject({ nhan: 1, banTin: { nhan: 1, loi: [] } })
    expect(d.sql.prepare('SELECT so_nhan, so_chi_ghi_so FROM ai_ban_tin').get()).toEqual({ so_nhan: 2, so_chi_ghi_so: 2 })
  })
  it('giới hạn: > 100 em một lượt ⇒ lỗi; ngày sai ⇒ lỗi; thân rỗng ⇒ ok, không nhận gì', async () => {
    expect((await nop(Array.from({ length: 101 }, () => dauRa()))).ok).toBe(false)
    expect((await boNaoNop(d.env, { ngay: 'x', cacEm: [] }, NOW)).ok).toBe(false)
    expect(await nop([])).toMatchObject({ ok: true, nhan: 0, biLoai: 0 })
  })
})

// ───────────────────────── tự chấm + tự gỡ ─────────────────────────
describe('TỰ CHẤM điều chỉnh hôm qua (lúc dựng hồ sơ ngày) và TỰ GỠ khi xau_di', () => {
  /** Đêm 21/09: em A có điều chỉnh (that hoặc bóng); hôm qua (21/09) em học `lam` câu, `dung` đúng; 7 ngày trước khá (75 %). */
  async function chuanBi(cheDo: 'that' | 'bong', lam: number, dung: number) {
    themEm('12001', 'Nguyễn An')
    ngayHoc('12001', 6, 8, 6)
    ngayHoc('12001', 4, 8, 6)
    ngayHoc('12001', 1, lam, dung)
    // thẻ + điều chỉnh của ĐÊM TRƯỚC (ngày 21/09)
    await boNaoHoSoNgay(d.env, { ngay: '2026-09-21' }, NOW - 86_400_000)
    await cauHinh({ cheDo })
    const r = await boNaoNop(d.env, { ngay: '2026-09-21', cacEm: [dauRa({ loiNhanChoEm: 'Em làm tốt.', dang: [], goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' }, ghiChuHlv: '' })] }, NOW - 86_400_000)
    expect(r.nhan).toBe(1)
  }
  it('xấu đi (đúng 2/8 so với 75 % trước đó) khi ĐANG ÁP DỤNG ⇒ ket_qua=xau_di, TỰ GỠ (huy, tu_go), em vào luồng soi kỹ với cờ xau_di_hom_qua', async () => {
    await chuanBi('that', 8, 2)
    const r = await hoSo()
    const em = (r.cacEm as { sbd: string; luong: string; lyDoLuong: string[]; the: { co: string[]; homQuaDanhGia: { ketQua: string } } }[])[0]
    expect(em.luong).toBe('sau')
    expect(em.the.co).toContain('xau_di_hom_qua')
    expect(em.lyDoLuong).toContain('điều chỉnh hôm qua chưa hiệu quả')
    expect(em.the.homQuaDanhGia.ketQua).toBe('xau_di')
    expect(d.sql.prepare(`SELECT ket_qua, huy, tu_go, ap_dung FROM ai_dieu_chinh WHERE ngay = '2026-09-21'`).get()).toMatchObject({ ket_qua: 'xau_di', huy: 1, tu_go: 1 })
    expect((d.sql.prepare(`SELECT ket_qua_chu FROM ai_dieu_chinh WHERE ngay = '2026-09-21'`).get() as { ket_qua_chu: string }).ket_qua_chu).toContain('hôm qua đúng 2/8 câu')
  })
  it('xấu đi nhưng chỉ CHẠY THỬ (không áp dụng) ⇒ chấm điểm ghi sổ, KHÔNG có gì để gỡ (tu_go = 0)', async () => {
    await chuanBi('bong', 8, 2)
    await hoSo()
    expect(d.sql.prepare(`SELECT ket_qua, huy, tu_go FROM ai_dieu_chinh WHERE ngay = '2026-09-21'`).get()).toEqual({ ket_qua: 'xau_di', huy: 0, tu_go: 0 })
  })
  it('ăn thua (đúng 7/8) ⇒ an_thua, GIỮ điều chỉnh; chưa đủ dữ liệu (2 câu) ⇒ chua_du_du_lieu, GIỮ', async () => {
    await chuanBi('that', 8, 7)
    await hoSo()
    expect(d.sql.prepare(`SELECT ket_qua, huy, tu_go FROM ai_dieu_chinh WHERE ngay = '2026-09-21'`).get()).toEqual({ ket_qua: 'an_thua', huy: 0, tu_go: 0 })
    d = taoD1That()
    await chuanBi('that', 2, 0)
    await hoSo()
    expect(d.sql.prepare(`SELECT ket_qua, huy FROM ai_dieu_chinh WHERE ngay = '2026-09-21'`).get()).toEqual({ ket_qua: 'chua_du_du_lieu', huy: 0 })
  })
})

// ───────────────────────── đọc (app thầy) ─────────────────────────
describe('/ai/dem-qua · /ai/nhat-ky · /ai/dieu-chinh/bo', () => {
  it('CHƯA CHẠY LẦN NÀO: chayLanCuoi null, bản tin rỗng, đếm 0, có cờ cấu hình', async () => {
    expect(await boNaoDemQua(d.env, {}, NOW)).toEqual({
      ok: true, ngay: NGAY, chayLanCuoi: null, cheDo: 'bong', bat: true, lopThat: [], soEm: 0, soSoiNhanh: 0, soSoiKy: 0, soVang: 0, soDieuChinh: { nhan: 0, chiGhiSo: 0, biLoai: 0 }, soEmHoTro: 0, banTin: { cacDong: [] },
    })
  })
  it('SAU KHI NỘP: bản tin có dòng, tên em do MÁY CHỦ ghép từ sbd, apDung/ngayDieuChinh/ketQua của điều chỉnh hôm qua, soEmHoTro, chayLanCuoi', async () => {
    dungBaEm()
    await hoSo()
    await cauHinh({ lopThat: ['12A1'] })
    await boNaoNop(d.env, { ngay: NGAY, cacEm: [dauRa()], banTin: { cacDong: [{ loai: 'dieu_chinh', sbd: '12001', chu: 'Đã giảm nhịp cho 1 em có hoạt động', hanhDong: 'xem_ho_so', dang: '' }, { loai: 'ca_lop', sbd: '', chu: 'Đêm nay có 2 em có thẻ', hanhDong: 'khong', dang: '' }] } }, NOW)
    // điều chỉnh HÔM QUA của em 12001 đã được chấm
    d.sql.exec(`INSERT INTO ai_dieu_chinh (sbd, ngay, json, do_tin, che_do, ap_dung, het_han, huy, tu_go, ly_do_bo, ket_qua, ket_qua_chu, nop_luc) VALUES ('12001', '${truoc(1)}', '{}', 0.7, 'that', 1, '${truoc(-2)}', 1, 1, '[]', 'xau_di', 'hôm qua đúng 2/8 câu', '${new Date(NOW - 3_600_000).toISOString()}')`)
    const r = (await boNaoDemQua(d.env, {}, NOW)) as Record<string, any>
    expect(r).toMatchObject({ ok: true, ngay: NGAY, cheDo: 'bong', bat: true, lopThat: ['12A1'], soEm: 2, soSoiNhanh: expect.any(Number), soVang: 1, soEmHoTro: 1 })
    expect(r.chayLanCuoi).toBe(NOW ? new Date(NOW).toISOString() : '')
    expect(r.soDieuChinh).toEqual({ nhan: 1, chiGhiSo: 0, biLoai: 0 })
    expect(r.banTin.cacDong).toHaveLength(2)
    expect(r.banTin.cacDong[0]).toEqual({ loai: 'dieu_chinh', sbd: '12001', hoTen: 'Nguyễn An', chu: 'Đã giảm nhịp cho 1 em có hoạt động', hanhDong: 'xem_ho_so', dang: '', apDung: true, ngayDieuChinh: NGAY, ketQua: 'xau_di', ketQuaChu: 'hôm qua đúng 2/8 câu', tuGo: true })
    expect(r.banTin.cacDong[1]).toMatchObject({ sbd: '', hoTen: '', apDung: false, ketQua: null, tuGo: false })
    const theoNgay = (await boNaoDemQua(d.env, { ngay: '2026-01-01' }, NOW)) as Record<string, any>
    expect(theoNgay.banTin.cacDong).toEqual([])
  })
  it('NHẬT KÝ của một em: ≤ 14 dòng mới nhất trước, NGUYÊN VĂN lời cho em / phụ huynh / thư tuần, cờ apDung / tuGo / daBo; thiếu sbd ⇒ lỗi', async () => {
    dungBaEm()
    for (let i = 0; i < 16; i++) {
      d.sql.exec(`INSERT INTO ai_dieu_chinh (sbd, ngay, json, do_tin, che_do, ap_dung, het_han, huy, tu_go, ly_do_bo, ket_qua, ket_qua_chu, nop_luc) VALUES ('12001', '${truoc(i + 1)}', '${JSON.stringify({ nhip: { lech: i, khoiDong: 2 }, loiNhanChoEm: `lời ${i}`, loiNhanChoPhuHuynh: i === 0 ? 'lời phụ huynh' : '', thuTuan: i === 0 ? 'thư tuần' : '', dang: [], khacPhuc: [], co: 'khong' })}', 0.7, 'that', ${i === 0 ? 1 : 0}, '${truoc(-2)}', ${i === 2 ? 1 : 0}, 0, '[]', NULL, NULL, 'x')`)
    }
    const r = (await boNaoNhatKy(d.env, { sbd: '12001' })) as { ok: boolean; hoTen: string; ds: Record<string, any>[] }
    expect(r).toMatchObject({ ok: true, hoTen: 'Nguyễn An' })
    expect(r.ds).toHaveLength(14)
    expect(r.ds[0]).toMatchObject({ ngay: truoc(1), loiNhanChoEm: 'lời 0', loiNhanChoPhuHuynh: 'lời phụ huynh', thuTuan: 'thư tuần', apDung: true, daBo: false, tuGo: false, cheDo: 'that' })
    expect(r.ds[2]).toMatchObject({ daBo: true, apDung: false })
    expect(r.ds.map((x) => x.ngay)).toEqual([...r.ds.map((x) => x.ngay)].sort().reverse())
    expect((await boNaoNhatKy(d.env, {})).ok).toBe(false)
    expect(((await boNaoNhatKy(d.env, { sbd: '99999' })) as { ds: unknown[] }).ds).toEqual([])
  })
  it('nhật ký phân biệt THẦY BỎ (daBo) với BỘ NÃO TỰ GỠ (tuGo): điều chỉnh tự gỡ không tính là thầy bỏ', async () => {
    dungBaEm()
    d.sql.exec(`INSERT INTO ai_dieu_chinh (sbd, ngay, json, do_tin, che_do, ap_dung, het_han, huy, tu_go, ly_do_bo, ket_qua, ket_qua_chu, nop_luc) VALUES ('12001', '${truoc(1)}', '{}', 0.8, 'that', 1, '${truoc(-2)}', 1, 1, '[]', 'xau_di', 'hôm qua đúng 2/8 câu', 'x')`)
    const r = (await boNaoNhatKy(d.env, { sbd: '12001' })) as { ds: Record<string, any>[] }
    expect(r.ds[0]).toMatchObject({ daBo: false, tuGo: true, apDung: false, ketQua: 'xau_di' })
  })
  it('BỎ điều chỉnh: đặt huy = 1 và ap_dung = 0; không có ⇒ ok, daBo false; bỏ hai lần vô hại; thiếu tham số ⇒ lỗi', async () => {
    d.sql.exec(`INSERT INTO ai_dieu_chinh (sbd, ngay, json, do_tin, che_do, ap_dung, het_han, huy, tu_go, ly_do_bo, nop_luc) VALUES ('12001', '${NGAY}', '{}', 0.8, 'that', 1, '${truoc(-3)}', 0, 0, '[]', 'x')`)
    expect(await boNaoBoDieuChinh(d.env, { sbd: '12001', ngay: NGAY })).toEqual({ ok: true, daBo: true })
    expect(d.sql.prepare(`SELECT huy, ap_dung FROM ai_dieu_chinh WHERE sbd = '12001'`).get()).toEqual({ huy: 1, ap_dung: 0 })
    expect(await boNaoBoDieuChinh(d.env, { sbd: '12001', ngay: NGAY })).toEqual({ ok: true, daBo: true }) // dòng có, đặt lại như cũ
    expect(await boNaoBoDieuChinh(d.env, { sbd: '12009', ngay: NGAY })).toEqual({ ok: true, daBo: false })
    expect((await boNaoBoDieuChinh(d.env, { sbd: '12001' })).ok).toBe(false)
    expect((await boNaoBoDieuChinh(d.env, { ngay: NGAY })).ok).toBe(false)
  })
})

describe('khoá nguồn', () => {
  it('server/src/bo-nao.ts: không tự kiểm mã bí mật, chỉ import lõi thuần + kiểu; không tên em trong thẻ (chỉ ghép tên ở đường đọc)', () => {
    const nguon = readFileSync('server/src/bo-nao.ts', 'utf8')
    expect(nguon.split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n')).not.toMatch(/MA_BI_MAT|x-ma-bi-mat|laThay/) // chú thích được nhắc tên; MÃ thì không
    expect([...nguon.matchAll(/^(?:import|\}).* from '([^']+)'/gm)].map((m) => m[1])).toEqual(['./kieu', './reset-toan-app', '../../src/lib/bo-nao-dac-trung', '../../src/lib/bo-nao-khuon'])
    expect(nguon).not.toMatch(/console\./)
    expect(readFileSync('server/src/index.ts', 'utf8')).toContain("from './bo-nao'") // Code 3 ĐÃ nối (chỉ sau cổng laThay, khoá ở tests/bo-nao-noi-route-2109.test.ts); tệp này không tự sửa index.ts
  })
})

describe('/ai/dieu-chinh/nop · THỬ THÁCH RIÊNG (khuôn d27ca44 của Code 1 khớp hợp đồng docs/hop-dong-thu-thach-rieng-2109.md)', () => {
  const nop = (cacEm: unknown[]) => boNaoNop(d.env, { ngay: NGAY, cacEm }, NOW)
  const daLuu = () => JSON.parse((d.sql.prepare(`SELECT json FROM ai_dieu_chinh WHERE sbd = '12001'`).get() as { json: string }).json) as Record<string, unknown>
  const TT = { dang: ['ESTE.THUY_PHAN'], soCau: 5, bac: 'dung_bac' }
  const LOI = 'Hôm qua em đúng 7/8 câu. Hôm nay thử mấy câu cùng dạng nhé.'
  beforeEach(async () => {
    dungBaEm()
    await hoSo()
  })

  it('thuThach + loiMoi HỢP LỆ đi qua kiểm khuôn lần hai và được LƯU nguyên vẹn (kể cả chế độ bóng: lưu nhưng không áp dụng)', async () => {
    const r = await nop([dauRa({ thuThach: TT, loiMoi: LOI })])
    expect(r).toMatchObject({ ok: true, nhan: 1, biLoai: 0 })
    expect(daLuu()).toMatchObject({ thuThach: TT, loiMoi: LOI })
    expect(d.sql.prepare(`SELECT ap_dung FROM ai_dieu_chinh WHERE sbd = '12001'`).get()).toEqual({ ap_dung: 0 })
  })

  it('SAI KHUÔN riêng phần thử thách (số câu hứa trong lời mời, dạng lạ, số ngoài thẻ, thiếu một nửa) ⇒ phần tử VẪN nhận nhưng thuThach + loiMoi bị bỏ CẢ HAI; phần còn lại giữ', async () => {
    const trường = [
      { thuThach: TT, loiMoi: 'Hôm qua em đúng 7/8 câu. Hôm nay thử 5 câu cùng dạng nhé.' }, // hứa số câu (số 5 không có trong thẻ)
      { thuThach: { ...TT, dang: ['DANG.LA'] }, loiMoi: LOI },
      { thuThach: { ...TT, soCau: 9 }, loiMoi: LOI },
      { thuThach: TT, loiMoi: 'Hôm qua em đúng 99 câu.' },
      { thuThach: TT },
      { loiMoi: LOI },
    ]
    for (const t of trường) {
      const r = await nop([dauRa(t)])
      expect(r, JSON.stringify(t)).toMatchObject({ ok: true, nhan: 1, biLoai: 0 })
      const x = daLuu()
      expect(x).not.toHaveProperty('thuThach')
      expect(x).not.toHaveProperty('loiMoi')
      expect(x.loiNhanChoEm).toBe('Hôm qua em đúng 7/8 câu. Mai mình xếp sẵn ba câu cùng dạng cho em nhé.') // phần khác của phần tử giữ nguyên
      expect(((r.canhBao as { sbd: string; canhBao: string[] }[]) ?? []).some((c) => c.sbd === '12001' && c.canhBao.join().includes('thuThach bị bỏ'))).toBe(true)
    }
  })

  it('không gửi thuThach ⇒ y hệt trước (không khoá thuThach/loiMoi trong bản lưu)', async () => {
    await nop([dauRa()])
    const x = daLuu()
    expect(x).not.toHaveProperty('thuThach')
    expect(x).not.toHaveProperty('loiMoi')
  })
})

describe('LƯỢT CHIỀU không đè núm của đêm (Code 1 + Boss 21/09; hàng chiều và hàng đêm CÙNG khoá (sbd, ngay))', () => {
  const nop = (cacEm: unknown[], banTin?: unknown) => boNaoNop(d.env, { ngay: NGAY, cacEm, ...(banTin ? { banTin } : {}) }, NOW)
  const TT = { dang: ['ESTE.THUY_PHAN'], soCau: 5, bac: 'dung_bac' }
  const LOI = 'Hôm qua em đúng 7/8 câu. Hôm nay thử mấy câu cùng dạng nhé.'
  /** Phần tử CHIỀU đúng như `nop.mjs --chieu` gửi: núm rỗng, không lời, chỉ thuThach + loiMoi. */
  const chieu = (o: Record<string, unknown> = {}) => dauRa({
    nhip: { lech: 0, khoiDong: 2 }, dang: [], khacPhuc: [], co: 'khong', loiNhanChoEm: '', loiNhanChoPhuHuynh: '', thuTuan: '',
    goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' }, ghiChuHlv: 'Lượt chiều: chỉ thử thách riêng hôm nay', canSau: false, thuThach: TT, loiMoi: LOI, ...o,
  })
  /** Phần tử ĐÊM: núm thật (nhịp −2, ưu tiên một dạng, khắc phục luôn kiểu on_som), không thuThach. */
  const dem = (o: Record<string, unknown> = {}) => dauRa({ nhip: { lech: -2, khoiDong: 3 }, khacPhuc: [{ dang: 'ESTE.THUY_PHAN', kieu: 'on_som' }], ...o })
  const hang = (sbd = '12001', ngay = NGAY) => d.sql.prepare('SELECT * FROM ai_dieu_chinh WHERE sbd = ? AND ngay = ?').get(sbd, ngay) as Record<string, unknown> | undefined
  const json = (sbd = '12001', ngay = NGAY) => JSON.parse(String(hang(sbd, ngay)?.json ?? '{}')) as Record<string, any>
  const hieuLuc = async (sbd = '12001') => (await docDieuChinhHieuLuc(d.env, [sbd], NGAY, await docCauHinhBoNao(d.env))).get(sbd)
  beforeEach(async () => {
    dungBaEm()
    await hoSo()
    await cauHinh({ cheDo: 'that' })
  })

  it('đêm rồi chiều CÙNG ngày: núm của đêm GIỮ NGUYÊN, hàng có thêm thuThach + loiMoi; áp dụng / độ tin cậy / hạn của đêm không đổi; chiều không tính là điều chỉnh mới', async () => {
    expect(await nop([dem({ doTinCay: 0.9 })])).toMatchObject({ ok: true, nhan: 1, soApDung: 1, nhanChieu: 0 })
    const truoc = hang()!
    const r = await nop([chieu({ doTinCay: 0.7 })])
    expect(r).toMatchObject({ ok: true, nhan: 0, nhanChieu: 1, soApDung: 0, chiGhiSo: 0, biLoai: 0 })
    const sau = hang()!
    expect(json()).toMatchObject({ nhip: { lech: -2, khoiDong: 3 }, dang: [{ ma: 'ESTE.THUY_PHAN', hanhDong: 'uu_tien' }], khacPhuc: [{ dang: 'ESTE.THUY_PHAN', kieu: 'on_som' }], thuThach: TT, loiMoi: LOI })
    expect(json()).not.toHaveProperty('luot') // vẫn là hàng ĐÊM
    expect({ do_tin: sau.do_tin, che_do: sau.che_do, ap_dung: sau.ap_dung, het_han: sau.het_han, huy: sau.huy }).toEqual({ do_tin: truoc.do_tin, che_do: truoc.che_do, ap_dung: truoc.ap_dung, het_han: truoc.het_han, huy: truoc.huy })
    const hl = await hieuLuc()
    expect(hl?.nhip).toBe(-2) // lõi vẫn nhận núm đêm
    expect(hl?.onSom).toEqual(['ESTE.THUY_PHAN'])
    expect(await docThuThachDaAp(d.env, '12001', NGAY)).toMatchObject({ thuThach: TT, loiMoi: LOI }) // thẻ thử thách vẫn có
    expect(d.dem('ai_dieu_chinh', `ngay = '${NGAY}'`)).toBe(1) // MỘT hàng, không thêm
  })

  it('chiều nộp hai lần (chạy lại) ⇒ vẫn một hàng, núm đêm còn, thuThach là bản mới nhất', async () => {
    await nop([dem()])
    await nop([chieu()])
    await nop([chieu({ thuThach: { ...TT, soCau: 7 }, loiMoi: 'Hôm qua em đúng 7/8 câu. Mai thử thêm nhé.' })])
    expect(d.dem('ai_dieu_chinh', `ngay = '${NGAY}'`)).toBe(1)
    expect(json().thuThach.soCau).toBe(7)
    expect((await hieuLuc())?.nhip).toBe(-2)
  })

  it('em CHỈ có hàng chiều: hàng mang dấu luot:"chieu"; điều chỉnh hiệu lực = VẮNG (y hệt không có); thử thách vẫn đọc được; không tính vào số đếm', async () => {
    const r = await nop([chieu()])
    expect(r).toMatchObject({ ok: true, nhan: 0, nhanChieu: 1, biLoai: 0 })
    expect(json()).toMatchObject({ luot: 'chieu', thuThach: TT, loiMoi: LOI })
    expect(await hieuLuc()).toBeUndefined()
    expect(await docThuThachDaAp(d.env, '12001', NGAY)).toMatchObject({ thuThach: TT, loiMoi: LOI })
    // số đếm: bản tin sáng (so_nhan, so_chi_ghi_so), soEmHoTro của /ai/dem-qua, bảng tin của thầy
    await nop([], { cacDong: [] })
    expect(d.sql.prepare('SELECT so_nhan, so_chi_ghi_so FROM ai_ban_tin WHERE ngay = ?').get(NGAY)).toEqual({ so_nhan: 0, so_chi_ghi_so: 0 })
    expect(await boNaoDemQua(d.env, { ngay: NGAY }, NOW)).toMatchObject({ soEmHoTro: 0 })
  })

  it('đêm HÔM QUA còn hạn + chiều-riêng-lẻ HÔM NAY ⇒ lõi vẫn nhận núm đêm hôm qua (hàng chiều không "mới nhất")', async () => {
    const homQua = themNgay(NGAY, -1)
    d.sql.prepare("INSERT INTO ai_dieu_chinh(sbd,ngay,json,do_tin,che_do,ap_dung,het_han,huy,tu_go,ly_do_bo,nop_luc) VALUES('12001',?,?,0.9,'that',1,?,0,0,'[]','x')")
      .run(homQua, JSON.stringify(dem()), themNgay(NGAY, 2))
    await nop([chieu()])
    const hl = await hieuLuc()
    expect(hl?.ngay).toBe(homQua)
    expect(hl?.nhip).toBe(-2)
    expect(await docThuThachDaAp(d.env, '12001', NGAY)).toMatchObject({ thuThach: TT })
  })

  it('đêm nộp lại SAU chiều (cùng ngày) giữ thuThach + loiMoi đã có, núm mới của đêm có hiệu lực', async () => {
    await nop([chieu()]) // hàng chiều-riêng-lẻ
    await nop([dem({ nhip: { lech: -1, khoiDong: 2 } })])
    expect(json()).toMatchObject({ nhip: { lech: -1 }, thuThach: TT, loiMoi: LOI, thuThachApDung: true })
    expect(json()).not.toHaveProperty('luot') // nay là hàng đêm thật
    expect((await hieuLuc())?.nhip).toBe(-1)
    expect(await docThuThachDaAp(d.env, '12001', NGAY)).toMatchObject({ thuThach: TT })
  })

  it('phần tử có thuThach nhưng CÓ núm hoặc CÓ lời nhắn không phải hàng chiều: ghi như hàng thường, tính là điều chỉnh', async () => {
    for (const o of [{ nhip: { lech: 1, khoiDong: 2 } }, { dang: [{ ma: 'ESTE.THUY_PHAN', hanhDong: 'uu_tien', lyDo: 'đúng 7/8 câu hôm qua' }] }, { khacPhuc: [{ dang: 'ESTE.THUY_PHAN', kieu: 'on_som' }] }, { loiNhanChoEm: 'Hôm qua em đúng 7/8 câu.' }]) {
      d.sql.exec(`DELETE FROM ai_dieu_chinh`)
      const r = await nop([chieu(o)])
      expect(r, JSON.stringify(o)).toMatchObject({ ok: true, nhan: 1, nhanChieu: 0 })
      expect(json()).not.toHaveProperty('luot')
      expect(json().thuThachApDung, JSON.stringify(o)).toBe(true) // hàng thường mang thuThach cũng có cờ áp riêng (chế độ thật, tin cậy đạt)
    }
  })

  describe('CỜ ÁP RIÊNG của thử thách (`json.thuThachApDung`) — hàng đêm BÓNG vẫn cho thẻ khi chiều nộp ở chế độ THẬT', () => {
    const mayDaLam = async () => ((await gvBangTin(d.env, {}, NOW)).mayDaLam as { loai: string; so: number }[]).find((x) => x.loai === 'thu_thach_rieng')
    it('(a) hàng đêm BÓNG (ap_dung 0) + chiều nộp chế độ THẬT ⇒ thẻ HIỆN, núm đêm vẫn KHÔNG áp', async () => {
      await cauHinh({ cheDo: 'bong' })
      await nop([dem()])
      expect(hang()?.ap_dung).toBe(0)
      await cauHinh({ cheDo: 'that' })
      expect(await nop([chieu()])).toMatchObject({ ok: true, nhanChieu: 1 })
      expect(hang()?.ap_dung).toBe(0) // ap_dung của đêm GIỮ NGUYÊN
      expect(json()).toMatchObject({ thuThachApDung: true, nhip: { lech: -2 } })
      expect(await docThuThachDaAp(d.env, '12001', NGAY)).toMatchObject({ thuThach: TT, loiMoi: LOI })
      expect(await hieuLuc()).toBeUndefined() // hàng bóng: núm KHÔNG áp
      expect((await mayDaLam())?.so).toBe(1) // (e) bảng tin đếm theo cờ riêng
    })
    it('(b) chiều nộp ở chế độ CHẠY THỬ ⇒ thẻ KHÔNG hiện — dù hàng đêm đang áp (cờ riêng nói không)', async () => {
      await nop([dem()]) // đêm thật, ap_dung 1
      await cauHinh({ cheDo: 'bong' })
      await nop([chieu()])
      expect(json().thuThachApDung).toBe(false)
      expect(hang()?.ap_dung).toBe(1)
      expect(await docThuThachDaAp(d.env, '12001', NGAY)).toBeNull()
      expect(await mayDaLam()).toBeUndefined()
      // em chỉ có hàng chiều, chế độ chạy thử
      d.sql.exec('DELETE FROM ai_dieu_chinh')
      await nop([chieu()])
      expect(json()).toMatchObject({ luot: 'chieu', thuThachApDung: false })
      expect(await docThuThachDaAp(d.env, '12001', NGAY)).toBeNull()
    })
    it('độ tin cậy dưới ngưỡng hoặc cờ bo_nao.thuThach tắt lúc nộp ⇒ cờ riêng false', async () => {
      await nop([chieu({ doTinCay: 0.5 })])
      expect(json().thuThachApDung).toBe(false)
      expect(await docThuThachDaAp(d.env, '12001', NGAY)).toBeNull()
      d.sql.exec('DELETE FROM ai_dieu_chinh')
      await cauHinh({ thuThach: false })
      await nop([chieu()])
      expect(json().thuThachApDung).toBe(false)
      await cauHinh({ thuThach: true })
      expect(await docThuThachDaAp(d.env, '12001', NGAY)).toBeNull() // cờ false đã ghi thì bật lại cờ chung KHÔNG làm sống lại hàng cũ (phải nộp lại)
      // cờ chung tắt + đã có hàng đêm (đường GỘP): cũng false
      d.sql.exec('DELETE FROM ai_dieu_chinh')
      await nop([dem()])
      await cauHinh({ thuThach: false })
      await nop([chieu()])
      expect(json().thuThachApDung).toBe(false)
    })
    it('(c) thầy huỷ điều chỉnh (huy = 1) ⇒ thẻ mất', async () => {
      await nop([chieu()])
      expect(await docThuThachDaAp(d.env, '12001', NGAY)).not.toBeNull()
      expect(await boNaoBoDieuChinh(d.env, { sbd: '12001', ngay: NGAY })).toMatchObject({ ok: true })
      expect(await docThuThachDaAp(d.env, '12001', NGAY)).toBeNull()
      expect(await mayDaLam()).toBeUndefined()
    })
    it('hàng chiều-riêng-lẻ chế độ thật ⇒ thẻ HIỆN và được đếm ở bảng tin (dù bị bỏ qua ở núm và số đếm điều chỉnh)', async () => {
      await nop([chieu()])
      expect(await docThuThachDaAp(d.env, '12001', NGAY)).toMatchObject({ thuThach: TT })
      expect(await hieuLuc()).toBeUndefined()
      expect((await mayDaLam())?.so).toBe(1)
    })
    it('hàng cũ CHƯA có cờ riêng ⇒ theo ap_dung của điều chỉnh (tương thích ngược)', async () => {
      for (const [ap, kq] of [[1, true], [0, false]] as const) {
        d.sql.exec('DELETE FROM ai_dieu_chinh')
        d.sql.prepare("INSERT INTO ai_dieu_chinh(sbd,ngay,json,do_tin,che_do,ap_dung,het_han,huy,tu_go,ly_do_bo,nop_luc) VALUES('12001',?,?,0.9,'that',?,?,0,0,'[]','x')").run(NGAY, JSON.stringify({ thuThach: TT, loiMoi: LOI }), ap, themNgay(NGAY, 3))
        expect((await docThuThachDaAp(d.env, '12001', NGAY)) !== null, `ap_dung ${ap}`).toBe(kq)
      }
    })
  })

  it('laPhanTuChieu (hàm thuần): chỉ đúng khi có thuThach VÀ không núm nào VÀ không lời nào', () => {
    const goc = { thuThach: TT, loiMoi: LOI, nhip: { lech: 0, khoiDong: 2 }, dang: [], khacPhuc: [], loiNhanChoEm: '', loiNhanChoPhuHuynh: '', thuTuan: '' }
    expect(laPhanTuChieu(goc)).toBe(true)
    expect(laPhanTuChieu({ ...goc, nhip: { lech: 0, khoiDong: 4 } })).toBe(true) // khoiDong không phải "núm" của đêm (chiều luôn gửi 2)
    for (const kac of [{ thuThach: undefined }, { thuThach: null }, { nhip: { lech: -1, khoiDong: 2 } }, { dang: [{ ma: 'A' }] }, { khacPhuc: [{ dang: 'A', kieu: 'on_som' }] }, { loiNhanChoEm: 'x' }, { loiNhanChoPhuHuynh: 'x' }, { thuTuan: 'x' }]) {
      expect(laPhanTuChieu({ ...goc, ...kac }), JSON.stringify(kac)).toBe(false)
    }
    expect(laPhanTuChieu({})).toBe(false)
  })

  it('số đếm: chiều-riêng-lẻ KHÔNG vào so_chi_ghi_so, không làm "áp dụng" trong dòng bản tin của /ai/dem-qua; hàng đêm thì có (đối chứng)', async () => {
    const dong = { loai: 'can_thay_y', sbd: '12001', chu: 'Có 1 em vắng liền nhiều ngày', hanhDong: 'nhan_phu_huynh', dang: '' }
    await nop([chieu({ doTinCay: 0.5 })]) // độ tin cậy thấp ⇒ ap_dung = 0 (chỉ ghi sổ)
    await nop([], { cacDong: [dong] })
    expect(d.sql.prepare('SELECT so_nhan, so_chi_ghi_so FROM ai_ban_tin WHERE ngay = ?').get(NGAY)).toEqual({ so_nhan: 0, so_chi_ghi_so: 0 })
    d.sql.exec('DELETE FROM ai_dieu_chinh')
    await nop([chieu()]) // ap_dung = 1
    let dq = await boNaoDemQua(d.env, { ngay: NGAY }, NOW)
    expect(dq).toMatchObject({ soEmHoTro: 0 })
    expect((dq.banTin as { cacDong: { apDung: boolean }[] }).cacDong[0]!.apDung).toBe(false) // không có điều chỉnh của đêm ⇒ không "áp dụng"
    d.sql.exec('DELETE FROM ai_dieu_chinh')
    await nop([dem({ doTinCay: 0.5 })])
    await nop([], { cacDong: [dong] })
    expect(d.sql.prepare('SELECT so_nhan, so_chi_ghi_so FROM ai_ban_tin WHERE ngay = ?').get(NGAY)).toEqual({ so_nhan: 1, so_chi_ghi_so: 1 }) // đối chứng: hàng đêm được đếm
    d.sql.exec('DELETE FROM ai_dieu_chinh')
    await nop([dem()])
    dq = await boNaoDemQua(d.env, { ngay: NGAY }, NOW)
    expect(dq).toMatchObject({ soEmHoTro: 1 })
    expect((dq.banTin as { cacDong: { apDung: boolean }[] }).cacDong[0]!.apDung).toBe(true)
  })

  it('bảng tin của thầy không đếm hàng chiều-riêng-lẻ là "Bộ não đã điều chỉnh" (đối chứng: hàng đêm đếm 1)', async () => {
    await nop([chieu()])
    await nop([], { cacDong: [] })
    const bt = await gvBangTin(d.env, {}, NOW)
    expect((bt.boNao as { soEmDieuChinh?: number } | undefined)?.soEmDieuChinh).toBe(0)
    d.sql.exec('DELETE FROM ai_dieu_chinh')
    await nop([dem()])
    expect(((await gvBangTin(d.env, {}, NOW)).boNao as { soEmDieuChinh?: number } | undefined)?.soEmDieuChinh).toBe(1)
  })

  it('nhật ký của em: hàng chiều-riêng-lẻ nhận diện được (luot) + thuThach/loiMoi; hàng đêm không có khoá luot', async () => {
    await nop([chieu()])
    const nk = (await boNaoNhatKy(d.env, { sbd: '12001' })).ds as Record<string, unknown>[]
    expect(nk[0]).toMatchObject({ luot: 'chieu', thuThach: TT, loiMoi: LOI })
    d.sql.exec(`DELETE FROM ai_dieu_chinh`)
    await nop([dem()])
    expect(((await boNaoNhatKy(d.env, { sbd: '12001' })).ds as Record<string, unknown>[])[0]).not.toHaveProperty('luot')
  })
})
