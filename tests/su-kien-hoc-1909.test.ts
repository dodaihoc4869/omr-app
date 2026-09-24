// @vitest-environment node
// GĐ 0 — SỔ SỰ KIỆN HỌC (DE-XUAT-CA-NHAN-HOA-1909.md mục 1.1, nghiệm thu GĐ 0).
//
// Chạy trên SQLite THẬT với lược đồ THẬT (xem `_d1-that.ts`): câu SQL `json_each`,
// `ON CONFLICT`, `date(..,'+7 hours')` được chạy chứ không đoán.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { nopKhacPhuc } from '../server/src/goi-cu'
import { mom } from '../server/src/mom'
import { gameV2 } from '../server/src/game-v2'
import { syncIndex } from '../server/src/game-v2-bank'
import { gameToken } from '../server/src/game-v2-auth'
import { chamDeChuan, luyenDe } from '../server/src/luyen-de'
import {
  DONG_MOI_LENH,
  cauTuKho,
  ghiSuKien,
  khoaSuKien,
  laBoTrong,
  ngayVn,
  suKienChamBai,
  suKienLuyenDe,
  suKienThi,
  type SuKien,
} from '../server/src/su-kien-hoc'
import { kiemCheoSuKien, napLaiSuKien } from '../server/src/su-kien-nap-lai'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const NOP = '2026-09-20T02:00:00.000Z' // 09:00 ngày 20/09 giờ Việt Nam
const HAN_XA = '2099-01-01T00:00:00.000Z'

const sk = (o: Partial<SuKien> = {}): SuKien => ({
  nguon: 'btvn', maNguon: 'B1', sbd: 'S1', qid: 'DE1-I-1', lan: 1, ketQua: 1, luc: NOP, ...o,
})
const hang = (d: D1That, dk = '1=1') => d.sql.prepare(`SELECT * FROM su_kien_hoc WHERE ${dk} ORDER BY khoa`).all() as Record<string, any>[]

// --- dữ liệu mẫu ------------------------------------------------------------

function seedCaThi(d: D1That, maCa = 'CA1', sbd = 'S1', lan = 1) {
  d.sql.prepare("INSERT OR IGNORE INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES(?,'dong','x')").run(maCa)
  d.sql.prepare('INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?)')
    .run(`${maCa}|${sbd}|${lan}`, maCa, sbd, lan, NOP, NOP, 'da_nop', NOP)
}

const CAU_THI = [
  { phan: 'I', soCau: 1, qid: 'DE1-I-1', chuyenDe: 'ES', mucDo: '1 sao', dapAnChon: 'A', dapAnDung: 'A', dungSai: true, giay: 40 },
  { phan: 'I', soCau: 2, qid: 'DE1-I-2', chuyenDe: 'ES', mucDo: '2 sao', dapAnChon: 'C', dapAnDung: 'B', dungSai: false, giay: 75 },
  { phan: 'II', soCau: 1, qid: 'DE1-II-1', chuyenDe: 'AM', mucDo: '', dapAnChon: '----', dapAnDung: 'DSDS', dungSai: false },
  { phan: 'III', soCau: 1, qid: 'DE1-III-1', chuyenDe: 'AM', mucDo: '', dapAnChon: '0,39', dapAnDung: '0,39', dungSai: true },
  { phan: 'III', soCau: 2, qid: '', chuyenDe: '', mucDo: '', dapAnChon: '1', dapAnDung: '2', dungSai: false }, // không qid: không có sự kiện
]

const bodyChamDiem = (cau = CAU_THI) => ({ maCa: 'CA1', bai: [{ sbd: 'S1', lanThu: 1, hoTen: 'Em Một', diem: { I: 1, II: 0, III: 1, tong: 2 }, cau }] })

/** Tờ kho 4 câu: đúng như định dạng R2 thật (`cau[]` có `phan`, `so`, `dap_an`). */
const TO_KHO = {
  cau: [
    { phan: 'I', so: 1, dap_an: 'A', chuyen_de: 'ES', muc_do: '1 sao' },
    { phan: 'I', so: 2, dap_an: 'B', chuyen_de: 'ES', muc_do: '2 sao' },
    { phan: 'II', so: 1, dap_an: 'DSDS', chuyen_de: 'AM', muc_do: '' },
    { phan: 'III', so: 1, dap_an: '0.39', chuyen_de: 'AM', muc_do: '' },
  ],
}

function seedBtvn(d: D1That, sbd = 'S1') {
  d.objects.set('kho/DE1.json', TO_KHO)
  d.sql.prepare('INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,?,0,?)').run('B1', 'CA1', 'DE1', 4, NOP, HAN_XA, NOP)
  d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES(?,?,?,?)').run(`B1|${sbd}`, 'B1', sbd, 'Em Một')
}

// ===========================================================================

describe('hàm thuần', () => {
  it('ngày Việt Nam: 17:00Z là sang ngày mới, 16:59:59Z còn ngày cũ, chuỗi hỏng → rỗng', () => {
    expect(ngayVn('2026-09-19T17:00:00Z')).toBe('2026-09-20')
    expect(ngayVn('2026-09-19T16:59:59Z')).toBe('2026-09-19')
    expect(ngayVn('không phải ngày')).toBe('')
  })

  it('bỏ trống: rỗng, khoảng trắng, toàn gạch → trống; "0" hay "D---" thì KHÔNG', () => {
    for (const v of ['', '  ', '----', '-', null, undefined]) expect(laBoTrong(v)).toBe(true)
    for (const v of ['0', 'D---', 'A', '0,39']) expect(laBoTrong(v)).toBe(false)
  })

  it('ca thi: trống → NULL (không phải 0), chưa chấm và không qid thì không có sự kiện', () => {
    const ds = suKienThi('CA1', 'S1', 1, NOP, CAU_THI)
    expect(ds.map((x) => [x.qid, x.ketQua])).toEqual([['DE1-I-1', 1], ['DE1-I-2', 0], ['DE1-II-1', null], ['DE1-III-1', 1]])
    expect(suKienThi('CA1', 'S1', 1, NOP, [{ qid: 'X', dapAnChon: 'A', dungSai: null }])).toEqual([])
  })

  it('chấm bài bằng luật chung: "0,39" = "0.39" (Phần III), Phần II đủ 4 ý, câu trống → NULL', () => {
    const cau = cauTuKho([
      { qid: 'D-I-1', dap_an: 'A' }, { qid: 'D-II-1', dap_an: 'DSDS' }, { qid: 'D-III-1', dap_an: '0.39' }, { qid: 'D-I-2', dap_an: 'B' }, { qid: 'D-I-3' },
    ])
    expect(cau.map((c) => c.qid)).toEqual(['D-I-1', 'D-II-1', 'D-III-1', 'D-I-2']) // câu không đáp án bị bỏ, không đoán
    const kq = suKienChamBai('btvn', 'B', 'S', 1, NOP, cau, { 'D-I-1': 'A', 'D-II-1': 'DSDD', 'D-III-1': '0,39' })
    expect(kq.map((x) => x.ketQua)).toEqual([1, 0, 1, null])
  })
})

// ===========================================================================

describe('ghiSuKien trên D1 thật', () => {
  it('idempotent: ghi hai lần cùng khoá = một dòng; sai/đúng không bị ghi đè ở nguồn thường', async () => {
    const d = taoD1That()
    expect((await ghiSuKien(d.env, [sk()])).ok).toBe(true)
    await ghiSuKien(d.env, [sk({ ketQua: 0 })]) // cùng khoá, kết quả khác → bản đầu giữ nguyên (sổ chỉ ghi thêm)
    const r = hang(d)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ khoa: 'btvn|B1|S1|DE1-I-1|1', ket_qua: 1, ngay_vn: '2026-09-20', nguon: 'btvn', lan: 1 })
  })

  it('ca thi chấm lại thì CẬP NHẬT kết quả (chamDiem cũng ghi đè), vẫn một dòng', async () => {
    const d = taoD1That()
    await ghiSuKien(d.env, [sk({ nguon: 'thi', maNguon: 'CA1', ketQua: 0 })], { capNhat: true })
    await ghiSuKien(d.env, [sk({ nguon: 'thi', maNguon: 'CA1', ketQua: 1 })], { capNhat: true })
    const r = hang(d, "nguon='thi'")
    expect(r).toHaveLength(1)
    expect(r[0]!.ket_qua).toBe(1)
  })

  it('bỏ trống lưu NULL thật trong D1, không phải 0', async () => {
    const d = taoD1That()
    await ghiSuKien(d.env, [sk({ ketQua: null })])
    expect(hang(d)[0]!.ket_qua).toBeNull()
  })

  it(`gom dòng: 95 sự kiện = ${Math.ceil(95 / DONG_MOI_LENH)} câu lệnh, MỘT lượt batch (≤ ${DONG_MOI_LENH} dòng/câu)`, async () => {
    const d = taoD1That()
    const truocP = d.soLenh.prepare
    const truocB = d.soLenh.batch
    const ds = Array.from({ length: 95 }, (_, i) => sk({ qid: `DE1-I-${i}` }))
    const r = await ghiSuKien(d.env, ds)
    expect(r.soGui).toBe(95)
    expect(d.dem('su_kien_hoc')).toBe(95)
    expect(d.soLenh.prepare - truocP).toBe(3)
    expect(d.soLenh.batch - truocB).toBe(1)
  })

  it('dòng thiếu sbd/qid hoặc giờ hỏng bị bỏ và ĐẾM vào boQua, không làm hỏng cả lượt', async () => {
    const d = taoD1That()
    const r = await ghiSuKien(d.env, [sk({ sbd: '' }), sk({ qid: '' }), sk({ luc: 'hỏng' }), sk({ qid: 'DE1-I-9' })])
    expect(r).toMatchObject({ ok: true, soGui: 1, boQua: 3 })
    expect(d.dem('su_kien_hoc')).toBe(1)
  })

  it('chưa chạy migration (mất bảng): trả ok=false, KHÔNG ném lỗi', async () => {
    const d = taoD1That()
    d.sql.exec('DROP TABLE su_kien_hoc')
    const r = await ghiSuKien(d.env, [sk()])
    expect(r.ok).toBe(false)
    expect(r.loi).toMatch(/no such table/i)
  })

  it('nộp cả bài lượt 1 bỏ qua câu đã ghi qua lô (không đếm đôi); lượt 2 thì ghi đủ', async () => {
    const d = taoD1That()
    await ghiSuKien(d.env, [sk({ nguon: 'btvn_lo', lan: 0, qid: 'DE1-I-1' })])
    await ghiSuKien(d.env, [sk({ qid: 'DE1-I-1' }), sk({ qid: 'DE1-I-2' })], { tranhTrungLo: true })
    expect(hang(d, "nguon='btvn'").map((x) => x.qid)).toEqual(['DE1-I-2'])
    await ghiSuKien(d.env, [sk({ qid: 'DE1-I-1', lan: 2 })]) // lượt làm lại: không tranhTrungLo
    expect(hang(d, "nguon='btvn'")).toHaveLength(2)
  })
})

// ===========================================================================

describe('mỗi điểm ghi ghi ĐÚNG số dòng và idempotent', () => {
  it('ca thi (/cham-diem): 4 dòng, trống = NULL, giờ = giờ NỘP của lượt, chấm lại không đẻ dòng', async () => {
    const d = taoD1That()
    seedCaThi(d)
    const r = await goiWorker(worker, d.env, '/cham-diem', bodyChamDiem(), true)
    expect(r.ok).toBe(true)
    const rows = hang(d, "nguon='thi'")
    expect(rows.map((x) => [x.qid, x.ket_qua, x.giay])).toEqual([['DE1-I-1', 1, 40], ['DE1-I-2', 0, 75], ['DE1-II-1', null, null], ['DE1-III-1', 1, null]])
    expect(rows.every((x) => x.luc === NOP && x.ngay_vn === '2026-09-20' && x.ma_nguon === 'CA1' && x.lan === 1)).toBe(true)
    await goiWorker(worker, d.env, '/cham-diem', bodyChamDiem(), true)
    expect(d.dem('su_kien_hoc', "nguon='thi'")).toBe(4)
    // Thầy sửa đáp án đúng rồi chấm lại: câu I-2 thành đúng → sổ theo.
    const sua = CAU_THI.map((c) => (c.qid === 'DE1-I-2' ? { ...c, dungSai: true } : c))
    await goiWorker(worker, d.env, '/cham-diem', bodyChamDiem(sua), true)
    expect(hang(d, "qid='DE1-I-2'")[0]!.ket_qua).toBe(1)
    expect(d.dem('su_kien_hoc', "nguon='thi'")).toBe(4)
  })

  it('BTVN cả bài (/btvn/nop): mỗi câu 1 dòng; bỏ trống NULL; gửi y hệt không thêm; đáp án khác = lượt 2', async () => {
    const d = taoD1That()
    seedBtvn(d)
    const dapAn = { 'DE1-I-1': 'A', 'DE1-II-1': 'DSDD', 'DE1-III-1': '0,39' } // I-2 bỏ trống
    const r = await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: 'B1', sbd: 'S1', dapAn })
    expect(r.ok).toBe(true)
    expect(hang(d, "nguon='btvn'").map((x) => [x.qid, x.ket_qua, x.lan])).toEqual([
      ['DE1-I-1', 1, 1], ['DE1-I-2', null, 1], ['DE1-II-1', 0, 1], ['DE1-III-1', 1, 1],
    ])
    await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: 'B1', sbd: 'S1', dapAn }) // mất mạng gửi lại
    expect(d.dem('su_kien_hoc', "nguon='btvn'")).toBe(4)
    await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: 'B1', sbd: 'S1', dapAn: { ...dapAn, 'DE1-II-1': 'DSDS' } })
    expect(d.dem('su_kien_hoc', "nguon='btvn' AND lan=2")).toBe(4)
    expect(hang(d, "nguon='btvn' AND lan=2 AND qid='DE1-II-1'")[0]!.ket_qua).toBe(1)
    // Bảng cũ vẫn do đường cũ ghi: lượt làm và đáp án nộp không đổi cách.
    expect(d.sql.prepare("SELECT so_lan_lam, so_dung FROM btvn_em WHERE khoa='B1|S1'").get()).toMatchObject({ so_lan_lam: 2, so_dung: 3 })
  })

  it('xong lô (/btvn/xong-lo) CÓ đáp án: chấm và ghi btvn_lo; KHÔNG đáp án: hành vi y như cũ, không ghi', async () => {
    const d = taoD1That()
    seedBtvn(d)
    const khong = await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: 'B1', sbd: 'S1', chiSo: 0 })
    expect(khong).toMatchObject({ ok: true, loDaXong: 1 })
    expect(khong.suKien).toBeUndefined()
    expect(d.dem('su_kien_hoc')).toBe(0)

    const co = await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: 'B1', sbd: 'S1', chiSo: 1, dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'C' } })
    expect(co).toMatchObject({ ok: true, loDaXong: 2, suKien: 2 })
    expect(hang(d, "nguon='btvn_lo'").map((x) => [x.qid, x.ket_qua, x.lan])).toEqual([['DE1-I-1', 1, 1], ['DE1-I-2', 0, 1]])
    await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: 'B1', sbd: 'S1', chiSo: 1, dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'B' } })
    expect(hang(d, "qid='DE1-I-2'")[0]!.ket_qua).toBe(0) // báo lại lô: bản đầu giữ nguyên

    // Sau đó nộp cả bài lượt 1: hai câu của lô KHÔNG bị ghi đôi.
    await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: 'B1', sbd: 'S1', dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'C', 'DE1-II-1': 'DSDS', 'DE1-III-1': '0.39' } })
    expect(hang(d, "nguon='btvn'").map((x) => x.qid)).toEqual(['DE1-II-1', 'DE1-III-1'])
  })

  it('khắc phục (nopKhacPhuc): mỗi câu 1 dòng; gửi y hệt không thêm; nộp lại đáp án khác = lan 2', async () => {
    const d = taoD1That()
    d.objects.set('phieu/PH1.json', { maCa: 'CA1', phieu: { cau: [{ id: 'DE1-I-1', dapAn: 'A', chuyenDe: 'ES', mucDo: '1 sao' }, { id: 'DE1-I-2', dapAn: 'B' }] } })
    const r = await nopKhacPhuc(d.env, { ma: 'PH1', sbd: 'S1', dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'C' } })
    expect(r.ok).toBe(true)
    expect(hang(d, "nguon='khac_phuc'").map((x) => [x.qid, x.ket_qua, x.lan, x.chuyen_de])).toEqual([['DE1-I-1', 1, 1, 'ES'], ['DE1-I-2', 0, 1, '']])
    await nopKhacPhuc(d.env, { ma: 'PH1', sbd: 'S1', dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'C' } })
    expect(d.dem('su_kien_hoc', "nguon='khac_phuc'")).toBe(2)
    await nopKhacPhuc(d.env, { ma: 'PH1', sbd: 'S1', dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'B' } })
    expect(hang(d, "nguon='khac_phuc' AND lan=2").map((x) => [x.qid, x.ket_qua])).toEqual([['DE1-I-1', 1], ['DE1-I-2', 1]])
    // Bảng cũ vẫn chỉ giữ lượt cuối (đúng thiết kế cũ) — sổ mới là nơi giữ mọi lượt.
    expect(d.dem('nop_khac_phuc')).toBe(1)
  })

  it('khắc phục KHÔNG có phiếu trên R2 (phiếu máy em tự sinh — cả 189 bài thật): chấm sổ bằng tờ kho theo qid', async () => {
    const d = taoD1That()
    d.objects.set('kho/DE1.json', TO_KHO)
    const dapAn = { 'DE1-I-1': 'A', 'DE1-I-2': 'C', 'DE1-III-1': '0,39' } // valid fallback control; mixed missing-source reject/repair is covered by code2-independent-remediation-validation
    const r = await nopKhacPhuc(d.env, { ma: 'sua_loi_S1_1789794169079', sbd: 'S1', dapAn })
    expect(r).toMatchObject({ ok: true, soCau: 0, soDung: 0 }) // điểm nộp cũ KHÔNG đổi (vẫn 0/0 như trước)
    expect(hang(d, "nguon='khac_phuc'").map((x) => [x.qid, x.ket_qua, x.chuyen_de])).toEqual([['DE1-I-1', 1, 'ES'], ['DE1-I-2', 0, 'ES'], ['DE1-III-1', 1, 'AM']])
    // Nạp lại từ bảng cũ ra cùng khoá, cùng kết quả.
    const truoc = hang(d).map((x) => [x.khoa, x.ket_qua])
    d.sql.exec('DELETE FROM su_kien_hoc')
    const n = await napLaiSuKien(d.env, ['S1'], 'khac_phuc')
    expect(n.ok).toBe(true)
    expect(hang(d).map((x) => [x.khoa, x.ket_qua])).toEqual(truoc)
  })

  it('bài Mom (submit): ghi câu có mã thật; câu cau_N không định danh được thì KHÔNG ghi; điểm vẫn do gradeMom', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','mk','x')").run()
    const token = await gameToken(d.env, 'S1')
    const dsCau = [{ id: 'DE1-I-1', dapAn: 'A', chuyenDe: 'ES' }, { id: 'DE1-III-1', dapAn: '0.39', chuyenDe: 'Hoá học' }, { id: 'cau_3', dapAn: 'B' }]
    await mom(d.env, 'create', { sbd: 'S1', id: 'M1', dsCau }, {noiBo:true})
    await mom(d.env, 'start', { token, id: 'M1' })
    const r = await mom(d.env, 'submit', { token, id: 'M1', answers: { 'DE1-I-1': 'B', 'DE1-III-1': '0,39', cau_3: 'B' } })
    // Điểm và sổ cùng nhận 0,39 = 0.39; câu cau_N được chấm nhưng không làm bằng chứng học.
    expect((r.item as { soCauDung: number }).soCauDung).toBe(2)
    expect(hang(d, "nguon='mom'").map((x) => [x.qid, x.ket_qua, x.chuyen_de])).toEqual([['DE1-I-1', 0, 'ES'], ['DE1-III-1', 1, '']])
    await mom(d.env, 'submit', { token, id: 'M1', answers: {} }) // nộp lại: đã nộp rồi, không ghi thêm
    expect(d.dem('su_kien_hoc', "nguon='mom'")).toBe(2)
  })

  it('lên bảng (/len-bang): mỗi lượt gọi một dòng theo id; không qid thì không ghi; tien_do_hs KHÔNG còn được cộng (thầy chốt 19/09 câu 11, GĐ 6)', async () => {
    const d = taoD1That()
    await goiWorker(worker, d.env, '/len-bang', { sbd: 'S1', chuyenDe: 'ES', qid: 'DE1-I-1', dat: true }, true)
    await goiWorker(worker, d.env, '/len-bang', { sbd: 'S1', chuyenDe: 'ES', qid: 'DE1-I-1', dat: false }, true) // gọi lần nữa cùng câu: sự kiện MỚI
    await goiWorker(worker, d.env, '/len-bang', { sbd: 'S1', chuyenDe: 'ES', dat: true }, true) // không qid
    expect(hang(d, "nguon='len_bang'").map((x) => [x.qid, x.ket_qua, x.lan])).toEqual([['DE1-I-1', 1, 1], ['DE1-I-1', 0, 2]])
    // ĐỔI HỢP ĐỒNG (GĐ 6): trước đây kiểm `{ so_cau: 3, so_sai: 1 }` — ghi chú cũ của chính dòng này đã nói 'GĐ 6 mới ngừng cộng'. Nay ngừng thật.
    expect(d.sql.prepare("SELECT so_cau, so_sai FROM tien_do_hs WHERE khoa='S1|ES'").get()).toBeUndefined()
  })

  it('game (answer): ghi đúng/sai với ma_dang; câu có trợ giúp KHÔNG ghi; trả lời lặp không đẻ dòng', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES('1','Em','mk','x')").run()
    const q = (i: number) => ({ id: `D-I-${i}`, text: `Đề ${i}`, choices: ['A', 'B', 'C', 'D'], correct: 'B', dang: { ma: 'AA.BB.CC', ten: 'Dạng' }, mucDo: 'biet', kienThuc: ['K1'], loiGiai: { chot: 'Giải' } })
    d.objects.set('kho/D.json', { phanI: [q(0), q(1)], phanII: [], phanIII: [] })
    d.sql.exec(`INSERT INTO ca(ma_ca,trang_thai,cong_bo,cap_nhat_luc) VALUES('CA','dong','ngay','1');
      INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc) VALUES('CA|1|1','CA','1',1,'x','2026-09-01T00:00:00.000Z','da_nop','x');
      INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,dung_sai,cap_nhat_luc) VALUES('CA|1|1|I|1','CA','1',1,'I',1,'D-I-0',0,'x'),('CA|1|1|I|2','CA','1',1,'I',2,'D-I-1',0,'x');
      INSERT INTO de_kho(ma_de,r2_khoa,cap_nhat_luc,da_xoa) VALUES('D','kho/D.json','1',0);`)
    await syncIndex(d.env)
    const token = await gameToken(d.env, '1')
    const start = (await gameV2(d.env, 'start', { token, mode: 'repair' })) as { id: string }
    const dung = await gameV2(d.env, 'answer', { token, session: start.id, qid: 'D-I-0', answer: 'B' })
    expect(dung.correct).toBe(true)
    await gameV2(d.env, 'answer', { token, session: start.id, qid: 'D-I-1', answer: 'A', assisted: true })
    await gameV2(d.env, 'answer', { token, session: start.id, qid: 'D-I-0', answer: 'A' }) // lặp cùng câu: replay
    const r = hang(d, "nguon='game'")
    expect(r.map((x) => [x.qid, x.ket_qua, x.ma_dang, x.ma_nguon === start.id])).toEqual([['D-I-0', 1, 'AA.BB.CC', true]])
  })

  it('luyện đề (submit): ghi đúng số câu của đề, nộp lại không ghi thêm', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES('S1','Em','mk','x')").run()
    const token = await gameToken(d.env, 'S1')
    const nguon = [{
      maDe: 'L',
      phanI: [{ id: 'L-I-1', text: 'a', choices: ['A', 'B', 'C', 'D'], correct: 'A', dang: { ma: 'AA.BB' } }, { id: 'L-I-2', text: 'b', choices: ['A', 'B', 'C', 'D'], correct: 'B' }],
      phanII: [{ id: 'L-II-1', text: 'c', ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'S', 'D', 'S'] }],
      phanIII: [{ id: 'L-III-1', text: 'd', correct: '0.5' }],
    }]
    d.objects.set('luyen-de-2026/S1/LD1.json', nguon)
    const now = Date.now()
    d.sql.prepare('INSERT INTO luyen_de_2026(id,sbd,created_at,deadline,bank_key,updated_at) VALUES(?,?,?,?,?,?)').run('LD1', 'S1', now, now + 3_000_000, 'luyen-de-2026/S1/LD1.json', now)
    await luyenDe(d.env, 'submit', { token, id: 'LD1', answers: { 'L-I-1': 'A', 'L-II-1': 'DSDS', 'L-III-1': '0,5' } })
    expect(hang(d, "nguon='luyen'").map((x) => [x.qid, x.ket_qua, x.ma_dang])).toEqual([
      ['L-I-1', 1, 'AA.BB'], ['L-I-2', null, null], ['L-II-1', 1, null], ['L-III-1', 1, null],
    ])
    await luyenDe(d.env, 'submit', { token, id: 'LD1', answers: { 'L-I-1': 'B' } }) // đã nộp: không chấm lại, không ghi thêm
    expect(d.dem('su_kien_hoc', "nguon='luyen'")).toBe(4)
  })

  it('luyện đề: sổ lấy đúng kết quả từng câu của chamDeChuan (trống → NULL, Phần II chỉ đúng khi đủ 4 ý)', () => {
    const nguon = [{
      maDe: 'L', nguon: 'x',
      phanI: [{ id: 'L-I-1', text: '', choices: [], correct: 'A', dang: { ma: 'AA.BB' } }, { id: 'L-I-2', correct: 'B' }],
      phanII: [{ id: 'L-II-1', correct: ['D', 'S', 'D', 'S'] }, { id: 'L-II-2', correct: ['D', 'D', 'D', 'D'] }],
      phanIII: [{ id: 'L-III-1', correct: '0.5' }],
    }] as any
    const dapAn = { 'L-I-1': 'A', 'L-II-1': 'DSDS', 'L-II-2': 'DDSS', 'L-III-1': '0,5' } // I-2 bỏ trống
    const { detail } = chamDeChuan(nguon, dapAn)
    const ds = suKienLuyenDe('S1', 'LD1', NOP, nguon, dapAn, detail)
    expect(ds.map((x) => [x.qid, x.ketQua])).toEqual([['L-I-1', 1], ['L-I-2', null], ['L-II-1', 1], ['L-II-2', 0], ['L-III-1', 1]])
    expect(ds[0]!.maDang).toBe('AA.BB')
  })
})

// ===========================================================================

describe('nạp lại dữ liệu cũ + kiểm chéo (nghiệm thu GĐ 0)', () => {
  function seedCu(d: D1That) {
    seedCaThi(d)
    d.sql.exec(`INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,chuyen_de,muc_do,dap_an_chon,dap_an_dung,dung_sai,giay,cap_nhat_luc) VALUES
      ('CA1|S1|1|I|1','CA1','S1',1,'I',1,'DE1-I-1','ES','1 sao','A','A',1,40,'${NOP}'),
      ('CA1|S1|1|I|2','CA1','S1',1,'I',2,'DE1-I-2','ES','2 sao','C','B',0,75,'${NOP}'),
      ('CA1|S1|1|II|1','CA1','S1',1,'II',1,'DE1-II-1','AM','','----','DSDS',0,NULL,'${NOP}'),
      ('CA1|S1|1|III|1','CA1','S1',1,'III',1,'DE1-III-1','AM','','0,39','0,39',1,NULL,'${NOP}'),
      ('CA1|S1|1|III|2','CA1','S1',1,'III',2,'','','','1','2',0,NULL,'${NOP}');
      INSERT INTO len_bang(sbd,chuyen_de,qid,dat,luc) VALUES('S1','ES','DE1-I-1',1,'${NOP}'),('S1','ES','',1,'${NOP}');`)
  }

  it('SQL nạp lại: thi = số dòng chi_tiet_cau có qid; trống → NULL; giờ = giờ nộp; kiểm chéo khớp', async () => {
    const d = taoD1That()
    seedCu(d)
    const r = await napLaiSuKien(d.env, ['S1'], undefined)
    expect(r.ok).toBe(true)
    expect(d.dem('su_kien_hoc', "nguon='thi'")).toBe(d.dem('chi_tiet_cau', "qid<>''"))
    expect(hang(d, "nguon='thi'").map((x) => [x.qid, x.ket_qua])).toEqual([['DE1-I-1', 1], ['DE1-I-2', 0], ['DE1-II-1', null], ['DE1-III-1', 1]])
    expect(hang(d, "nguon='len_bang'")).toHaveLength(1) // dòng không qid bị bỏ
    const kc = (await kiemCheoSuKien(d.env, ['S1'])) as { thi: { suKien: number; chiTiet: number; khop: boolean } }
    expect(kc.thi).toMatchObject({ suKien: 4, chiTiet: 4, khop: true })
  })

  it('nạp lại ra CÙNG KHOÁ với đường ghi trực tiếp: ghi trực tiếp rồi nạp lại không thêm dòng nào', async () => {
    const d = taoD1That()
    seedCaThi(d)
    await goiWorker(worker, d.env, '/cham-diem', bodyChamDiem(), true)
    await goiWorker(worker, d.env, '/len-bang', { sbd: 'S1', chuyenDe: 'ES', qid: 'DE1-I-1', dat: true }, true)
    const truoc = hang(d).map((x) => x.khoa)
    expect(truoc.length).toBe(5)
    await napLaiSuKien(d.env, ['S1'], undefined)
    expect(hang(d).map((x) => x.khoa)).toEqual(truoc)
  })

  it('chạy nạp lại nhiều lần: sổ không đổi; bảng cũ KHÔNG bị đụng', async () => {
    const d = taoD1That()
    seedCu(d)
    const bangCu = ['chi_tiet_cau', 'ban_do_sai', 'qid_da_lam', 'tien_do_hs', 'tien_do_ca', 'len_bang', 'luot', 'ca']
    const truoc = bangCu.map((b) => d.chup(b))
    await napLaiSuKien(d.env, ['S1'], undefined)
    const mot = d.chup('su_kien_hoc')
    await napLaiSuKien(d.env, ['S1'], undefined)
    expect(d.chup('su_kien_hoc')).toBe(mot)
    expect(bangCu.map((b) => d.chup(b))).toEqual(truoc)
  })

  it('nạp lại BTVN/khắc phục/Mom từ R2: chấm lại bằng đúng hàm của đường trực tiếp, ra cùng khoá', async () => {
    const d = taoD1That()
    seedBtvn(d)
    d.objects.set('phieu/PH1.json', { maCa: 'CA1', phieu: { cau: [{ id: 'DE1-I-1', dapAn: 'A' }, { id: 'DE1-I-2', dapAn: 'B' }] } })
    await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: 'B1', sbd: 'S1', dapAn: { 'DE1-I-1': 'A', 'DE1-II-1': 'DSDD', 'DE1-III-1': '0,39' } })
    await nopKhacPhuc(d.env, { ma: 'PH1', sbd: 'S1', dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'C' } })
    const truoc = hang(d).map((x) => [x.khoa, x.ket_qua])
    expect(truoc).toHaveLength(6)
    d.sql.exec('DELETE FROM su_kien_hoc') // giả lập: chưa có sổ (nộp từ trước GĐ 0)
    const a = await napLaiSuKien(d.env, ['S1'], 'btvn')
    const b = await napLaiSuKien(d.env, ['S1'], 'khac_phuc')
    expect([a.ok, b.ok]).toEqual([true, true])
    expect(hang(d).map((x) => [x.khoa, x.ket_qua])).toEqual(truoc)
  })

  it('giới hạn: tối đa 20 em mỗi lượt, thiếu danh sách và nguồn lạ đều bị từ chối rõ ràng', async () => {
    const d = taoD1That()
    expect((await napLaiSuKien(d.env, Array.from({ length: 21 }, (_, i) => `S${i}`), undefined)).ok).toBe(false)
    expect((await napLaiSuKien(d.env, [], undefined)).ok).toBe(false)
    expect((await napLaiSuKien(d.env, ['S1'], 'la' as never)).ok).toBe(false)
  })

  it('chưa chạy migration: nạp lại báo rõ, không ném lỗi', async () => {
    const d = taoD1That()
    d.sql.exec('DROP TABLE su_kien_hoc')
    const r = await napLaiSuKien(d.env, ['S1'], undefined)
    expect(r.ok).toBe(false)
    expect(String(r.error)).toContain('migration-1909-su-kien-hoc.sql')
  })

  it('đường thầy: /ho-so/nap-lai và /ho-so/kiem-cheo đòi mã bí mật', async () => {
    const d = taoD1That()
    seedCu(d)
    expect((await goiWorker(worker, d.env, '/ho-so/nap-lai', { sbd: ['S1'] })).ok).toBe(false)
    expect((await goiWorker(worker, d.env, '/ho-so/nap-lai', { sbd: ['S1'] }, true)).ok).toBe(true)
    const kc = await goiWorker(worker, d.env, '/ho-so/kiem-cheo', {}, true)
    expect(kc.ok).toBe(true)
    expect(kc.thi.khop).toBe(true)
  })
})

describe('lượt nộp KHÔNG bị hỏng khi chưa có bảng sổ (Worker lên trước migration)', () => {
  it('/btvn/nop, /cham-diem, /len-bang, /btvn/xong-lo đều trả ok', async () => {
    const d = taoD1That()
    d.sql.exec('DROP TABLE su_kien_hoc')
    seedCaThi(d)
    seedBtvn(d)
    expect((await goiWorker(worker, d.env, '/cham-diem', bodyChamDiem(), true)).ok).toBe(true)
    expect((await goiWorker(worker, d.env, '/len-bang', { sbd: 'S1', chuyenDe: 'ES', qid: 'Q', dat: true }, true)).ok).toBe(true)
    expect((await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: 'B1', sbd: 'S1', dapAn: { 'DE1-I-1': 'A' } })).ok).toBe(true)
    expect((await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: 'B1', sbd: 'S1', chiSo: 0, dapAn: { 'DE1-I-1': 'A' } })).ok).toBe(true)
    // Điểm và chi tiết cũ vẫn được ghi bình thường.
    expect(d.dem('chi_tiet_cau')).toBe(5)
    expect(d.sql.prepare("SELECT nop_luc FROM btvn_em WHERE khoa='B1|S1'").get()).not.toMatchObject({ nop_luc: null })
  })
})

it('khoá sự kiện đúng định dạng thiết kế: nguon|ma_nguon|sbd|qid|lan', () => {
  expect(khoaSuKien({ nguon: 'thi', maNguon: 'CA1', sbd: 'S1', qid: 'DE1-I-1', lan: 2 })).toBe('thi|CA1|S1|DE1-I-1|2')
})
