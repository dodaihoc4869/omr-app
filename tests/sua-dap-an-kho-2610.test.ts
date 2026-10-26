// @vitest-environment node
// TỰ SỬA ĐÁP ÁN KHO (thầy 26/10: «Nếu lệch đáp án tự động lấy đáp án bạn giải ko cần hỏi tôi điều gì») — server/src/sua-dap-an-kho.ts + nối vào máy soạn
// sơ đồ (server/src/soan-so-do.ts). Chạy trên D1 giả bằng SQLite thật (lược đồ + mọi migration) và R2 giả của tests/_d1-that.ts.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, goiWorker, type D1That } from './_d1-that'
import worker from '../server/src/index'
import { dongBoCacTo, xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { luiDapAnKho, suaDapAnKho, timCauTrongGoi } from '../server/src/sua-dap-an-kho'
import { dapAnMoiTuMay, soanSoDoLo } from '../server/src/soan-so-do'
import type { BanSoDo } from '../src/lib/goi-y-cham/kieu'

const DE = 'DE-SUA-2610'
const KHOA = `kho/${DE}.json`
const DE_III = 'Đốt cháy 1 tấn quặng pyrite chứa 8% FeS2 về khối lượng để sản xuất SO2, hiệu suất 90%. Khối lượng SO2 thu được là m kg. Giá trị của m là'
const DE_I = 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng 100 mL dung dịch NaOH 1,5 M, đun nóng. Cô cạn dung dịch, thu được m gam chất rắn khan. Giá trị của m là'
/** Gói khuôn KHO (`cau[]`, như dayDeKho / kiemGoiDe ghi): đáp án ở `dap_an`; qid = `c.qid` hoặc `{ma_de}-{phan}-{so}`. */
const goiMau = () => ({
  ma_de: DE, nguon: 'thử', ngay_nap: '2026-10-01',
  cau: [
    { phan: 'III', so: 1, de: DE_III, dap_an: '76,8' },
    { qid: 'Q-RIENG-I', phan: 'I', so: 2, de: DE_I, pa: { A: '8,2.', B: '10,2.', C: '12,2.', D: '14,2.' }, dap_an: 'B' },
    { phan: 'II', so: 1, de: 'Cho 8,8 gam ethyl acetate…', y: { a: 'a', b: 'b', c: 'c', d: 'd' }, dap_an: 'DSDS' },
    { phan: 'I', so: 3, de: DE_I + ' (bản 2)', pa: { A: '10,2 gam', B: '10,25 gam', C: '12,2 gam', D: '14,2 gam' }, dap_an: 'C' },
    { phan: 'III', so: 5, de: 'Hoà tan 2,4 gam Mg trong dung dịch HCl dư, thu được V lít H2. Giá trị của V là', dap_an: '2,24' },
  ],
})
const Q_III = `${DE}-III-1`, Q_I = 'Q-RIENG-I', Q_II = `${DE}-II-1`, Q_I2 = `${DE}-I-3`, Q_III5 = `${DE}-III-5`

let d: D1That
const goiR2 = () => JSON.parse(String(d.objects.get(KHOA))) as { cau: Record<string, unknown>[] }
const dapAnTrongGoi = (so: number, phan: string) => goiR2().cau.find((c) => c.so === so && c.phan === phan)!.dap_an
const capNhat = () => (d.sql.prepare('SELECT cap_nhat_luc FROM de_kho WHERE ma_de = ?').get(DE) as { cap_nhat_luc: string }).cap_nhat_luc
const cauChiMuc = (qid: string) => {
  const r = d.sql.prepare('SELECT version, json FROM game_v2_question WHERE ma_de = ? AND qid = ?').get(DE, qid) as { version: string; json: string } | undefined
  return r ? { version: r.version, correct: (JSON.parse(r.json) as { correct: string }).correct } : null
}
const LUC = Date.parse('2026-10-26T03:00:00Z')

beforeEach(async () => {
  d = taoD1That()
  xoaDemCaBaoVe()
  d.objects.set(KHOA, JSON.stringify(goiMau()))
  d.sql.prepare("INSERT INTO de_kho (ma_de, ten_de, lop, so_cau, r2_khoa, da_xoa, cap_nhat_luc) VALUES (?, 'Đề thử', '12', 5, ?, 0, 'v1')").run(DE, KHOA)
  expect(await dongBoCacTo(d.env, [DE])).toBe(1)
})

describe('suaDapAnKho — sửa đúng câu trong gói R2', () => {
  it('qid khớp đúng như normalizeBank: `{ma_de}-{phan}-{so}` và `c.qid` riêng; khuôn cũ phanI/III theo `id ?? qid`', () => {
    expect(timCauTrongGoi(goiMau(), Q_III).map((x) => [x.phan, x.cu, x.truong])).toEqual([['III', '76,8', 'dap_an']])
    expect(timCauTrongGoi(goiMau(), Q_I).map((x) => x.cu)).toEqual(['B'])
    expect(timCauTrongGoi(goiMau(), `${DE}-I-2`)).toEqual([]) // có qid riêng ⇒ không còn mang qid sinh theo số
    const cu = { phanI: [{ id: 'X1', correct: 'A' }], phanIII: [{ qid: 'X3', correct: '1,5' }] }
    expect(timCauTrongGoi(cu, 'X3').map((x) => [x.phan, x.cu, x.truong])).toEqual([['III', '1,5', 'correct']])
  })

  it('Phần III: đổi `dap_an` của ĐÚNG câu, lưu bản cũ vào dap_an_kho_sua, đặt cap_nhat_luc mới, chỉ mục game dựng lại', async () => {
    const vCu = cauChiMuc(Q_III)!.version
    const kq = await suaDapAnKho(d.env, { maDe: DE, qid: Q_III, dapAnMoi: '70,0', lyDo: 'thử', nguon: 'soan-so-do' }, LUC)
    expect(kq).toMatchObject({ ok: true, phan: 'III', cu: '76,8', moi: '70,0' })
    expect(dapAnTrongGoi(1, 'III')).toBe('70,0')
    // các câu khác của gói không đổi; gói giữ khuôn kho (ma_de, nguon, ngay_nap, cau[])
    expect(goiR2()).toMatchObject({ ma_de: DE, nguon: 'thử', ngay_nap: '2026-10-01' })
    expect(goiR2().cau.map((c) => c.dap_an)).toEqual(['70,0', 'B', 'DSDS', 'C', '2,24'])
    const dong = d.sql.prepare('SELECT * FROM dap_an_kho_sua').all() as Record<string, unknown>[]
    expect(dong).toEqual([expect.objectContaining({ id: (kq as { id: string }).id, ma_de: DE, qid: Q_III, phan: 'III', cu: '76,8', moi: '70,0', ly_do: 'thử', nguon: 'soan-so-do', da_lui: 0 })])
    expect(capNhat()).toBe(new Date(LUC).toISOString())
    const moi = cauChiMuc(Q_III)!
    expect(moi.correct).toBe('70,0')
    expect(moi.version).not.toBe(vCu)
    expect(moi.version).toBe((kq as { versionMoi: string }).versionMoi)
    // KHÔNG đụng khoá đáp án các ca
    expect([...d.objects.keys()].filter((k) => k.startsWith('key/'))).toEqual([])
  })

  it('Phần I (qid riêng): đổi chữ phương án', async () => {
    const kq = await suaDapAnKho(d.env, { maDe: DE, qid: Q_I, dapAnMoi: 'c', nguon: 'soan-so-do' }, LUC)
    expect(kq).toMatchObject({ ok: true, phan: 'I', cu: 'B', moi: 'C' })
    expect(dapAnTrongGoi(2, 'I')).toBe('C')
  })

  it('gói khuôn cũ phanI/phanII/phanIII: đổi `correct`', async () => {
    d.objects.set(KHOA, JSON.stringify({ phanI: [{ id: 'C1', text: 'x', choices: ['1 gam', '2 gam', '3 gam', '4 gam'], correct: 'A' }], phanIII: [{ id: 'C3', text: 'y', correct: '1,5' }] }))
    const kq = await suaDapAnKho(d.env, { maDe: DE, qid: 'C3', dapAnMoi: '1,6', nguon: 'tay' }, LUC)
    expect(kq).toMatchObject({ ok: true, cu: '1,5', moi: '1,6' })
    expect((JSON.parse(String(d.objects.get(KHOA))) as { phanIII: { correct: string }[] }).phanIII[0]!.correct).toBe('1,6')
  })
})

describe('suaDapAnKho — từ chối, không ghi gì', () => {
  const khongDoi = () => {
    expect(String(d.objects.get(KHOA))).toBe(JSON.stringify(goiMau()))
    expect(capNhat()).toBe('v1')
    expect(d.sql.prepare("SELECT 1 FROM sqlite_master WHERE name = 'dap_an_kho_sua'").get() ? d.dem('dap_an_kho_sua') : 0).toBe(0)
  }
  it('Phần II', async () => {
    expect(await suaDapAnKho(d.env, { maDe: DE, qid: Q_II, dapAnMoi: 'DDDD', nguon: 'x' }, LUC)).toMatchObject({ ok: false, ma: 'phan_ii' })
    khongDoi()
  })
  it('không tìm thấy câu / đáp án không hợp lệ / trùng đáp án cũ', async () => {
    expect(await suaDapAnKho(d.env, { maDe: DE, qid: `${DE}-III-99`, dapAnMoi: '1', nguon: 'x' }, LUC)).toMatchObject({ ok: false, ma: 'khong_thay_cau' })
    expect(await suaDapAnKho(d.env, { maDe: 'KHONG-CO', qid: Q_III, dapAnMoi: '1', nguon: 'x' }, LUC)).toMatchObject({ ok: false, ma: 'khong_co_de' })
    expect(await suaDapAnKho(d.env, { maDe: DE, qid: Q_I, dapAnMoi: 'E', nguon: 'x' }, LUC)).toMatchObject({ ok: false, ma: 'dap_an_khong_hop_le' })
    expect(await suaDapAnKho(d.env, { maDe: DE, qid: Q_III, dapAnMoi: '123456789', nguon: 'x' }, LUC)).toMatchObject({ ok: false, ma: 'dap_an_khong_hop_le' })
    expect(await suaDapAnKho(d.env, { maDe: DE, qid: Q_III, dapAnMoi: '76,8', nguon: 'x' }, LUC)).toMatchObject({ ok: false, ma: 'trung_dap_an_cu' })
    khongDoi()
  })
  it('câu bị bảo vệ (ca chưa công bố có đề chứa câu)', async () => {
    d.objects.set('key/CA-BV.json', JSON.stringify(goiMau()))
    d.sql.prepare(`INSERT INTO ca (ma_ca, ten_ca, trang_thai, bat_dau, het_han_vao, thoi_gian_phut, loai, cong_bo, bank_r2, cap_nhat_luc)
      VALUES ('CA-BV', 'Ca bảo vệ', 'dong', '2026-10-25T01:00:00.000Z', '2026-10-25T02:00:00.000Z', 45, 'thi', 'khong', 'key/CA-BV.json', '2026-10-25T00:00:00.000Z')`).run()
    xoaDemCaBaoVe()
    expect(await suaDapAnKho(d.env, { maDe: DE, qid: Q_III, dapAnMoi: '70', nguon: 'x' }, LUC)).toMatchObject({ ok: false, ma: 'cau_bao_ve' })
    khongDoi()
    expect(String(d.objects.get('key/CA-BV.json'))).toBe(JSON.stringify(goiMau()))
  })
  it('đang có ca thi mở', async () => {
    d.sql.prepare(`INSERT INTO ca (ma_ca, trang_thai, loai, cong_bo, cap_nhat_luc) VALUES ('CA-MO', 'mo', 'thi', 'ngay', '2026-10-26T00:00:00.000Z')`).run()
    xoaDemCaBaoVe()
    expect(await suaDapAnKho(d.env, { maDe: DE, qid: Q_III, dapAnMoi: '70', nguon: 'x' }, LUC)).toMatchObject({ ok: false, ma: 'ca_thi_mo' })
    khongDoi()
  })
  it('chặng kiểm tra cá nhân đang làm có chứa câu (chặng khác / đã chốt thì không chặn)', async () => {
    const json = JSON.stringify({ chang: [{ qids: ['khac'], giay: 60 }, { qids: [Q_III], giay: 60 }] })
    d.sql.prepare(`INSERT INTO kiem_tra_ca_nhan (id, sbd, lop, ngay, mo_luc, han_luc, trang_thai, json, cap_nhat_luc) VALUES ('kt1', '1001', '12A', '2026-10-26', ?, ?, 'mo', ?, ?)`)
      .run(LUC - 60_000, LUC + 3_600_000, json, LUC)
    d.sql.prepare('INSERT INTO kiem_tra_ca_nhan_chang (bai_id, stt, bat_dau, han) VALUES (?, ?, ?, ?)').run('kt1', 1, LUC - 30_000, LUC + 600_000)
    expect(await suaDapAnKho(d.env, { maDe: DE, qid: Q_III, dapAnMoi: '70', nguon: 'x' }, LUC)).toMatchObject({ ok: false, ma: 'ktcn_dang_lam' })
    khongDoi()
    d.sql.prepare('UPDATE kiem_tra_ca_nhan_chang SET chot_luc = ?').run(LUC - 1)
    expect(await suaDapAnKho(d.env, { maDe: DE, qid: Q_III, dapAnMoi: '70', nguon: 'x' }, LUC)).toMatchObject({ ok: true })
  })
})

describe('luiDapAnKho', () => {
  it('lùi về đáp án cũ, đánh dấu da_lui, cap_nhat_luc đổi lần nữa; lùi lần hai bị từ chối', async () => {
    const kq = (await suaDapAnKho(d.env, { maDe: DE, qid: Q_III, dapAnMoi: '70,0', nguon: 'x' }, LUC)) as { id: string; versionMoi: string }
    const vCu = cauChiMuc(Q_III)!.version
    const lui = await luiDapAnKho(d.env, kq.id, LUC + 60_000)
    expect(lui).toMatchObject({ ok: true, qid: Q_III })
    expect(dapAnTrongGoi(1, 'III')).toBe('76,8')
    expect(capNhat()).toBe(new Date(LUC + 60_000).toISOString())
    expect(cauChiMuc(Q_III)).toMatchObject({ correct: '76,8' })
    expect(cauChiMuc(Q_III)!.version).not.toBe(vCu)
    expect(d.sql.prepare('SELECT da_lui FROM dap_an_kho_sua WHERE id = ?').get(kq.id)).toEqual({ da_lui: 1 })
    expect(await luiDapAnKho(d.env, kq.id, LUC + 120_000)).toMatchObject({ ok: false, ma: 'da_lui' })
    expect(await luiDapAnKho(d.env, 'khong-co', LUC)).toMatchObject({ ok: false, ma: 'khong_co_ban_sua' })
  })
  it('đáp án kho đã đổi sau lần sửa (đẩy lại tờ) ⇒ không lùi đè', async () => {
    const kq = (await suaDapAnKho(d.env, { maDe: DE, qid: Q_III, dapAnMoi: '70,0', nguon: 'x' }, LUC)) as { id: string }
    const g = goiR2(); g.cau[0]!.dap_an = '71,5'; d.objects.set(KHOA, JSON.stringify(g))
    expect(await luiDapAnKho(d.env, kq.id, LUC + 60_000)).toMatchObject({ ok: false, ma: 'dap_an_da_doi' })
    expect(dapAnTrongGoi(1, 'III')).toBe('71,5')
  })
  it('route quản trị POST /quan-tri/lui-dap-an-kho sau cổng mã bí mật', async () => {
    const kq = (await suaDapAnKho(d.env, { maDe: DE, qid: Q_III, dapAnMoi: '70,0', nguon: 'x' }, LUC)) as { id: string }
    expect(await goiWorker(worker, d.env, '/quan-tri/lui-dap-an-kho', { id: kq.id })).toMatchObject({ ok: false, error: 'Sai mã bí mật' })
    expect(dapAnTrongGoi(1, 'III')).toBe('70,0')
    expect(await goiWorker(worker, d.env, '/quan-tri/lui-dap-an-kho', { id: kq.id }, true)).toMatchObject({ ok: true, qid: Q_III })
    expect(dapAnTrongGoi(1, 'III')).toBe('76,8')
  })
})

describe('dapAnMoiTuMay — chọn đáp án mới từ số máy giải', () => {
  it('Phần III: làm tròn theo số chữ số thập phân của đáp án cũ, dấu phẩy', () => {
    expect(dapAnMoiTuMay({ phan: 'III', correct: '76,8', choices: [] }, '70,04')).toBe('70,0')
    expect(dapAnMoiTuMay({ phan: 'III', correct: '2,24', choices: [] }, '3,3600')).toBe('3,36')
    expect(dapAnMoiTuMay({ phan: 'III', correct: '70', choices: [] }, '64,6')).toBe('65')
    expect(dapAnMoiTuMay({ phan: 'III', correct: '76,8', choices: [] }, '76,83')).toBeNull() // làm tròn ra đúng đáp án cũ
    expect(dapAnMoiTuMay({ phan: 'III', correct: '5', choices: [] }, '0,012')).toBeNull() // làm tròn lệch quá 1%
  })
  it('Phần I: đúng MỘT phương án khớp ≤ 1%; khớp 2 phương án hoặc không khớp ⇒ null', () => {
    const pa = ['8,2.', '10,2.', '12,2.', '14,2.']
    expect(dapAnMoiTuMay({ phan: 'I', correct: 'B', choices: pa }, '12,2')).toBe('C')
    expect(dapAnMoiTuMay({ phan: 'I', correct: 'B', choices: pa }, '13')).toBeNull()
    expect(dapAnMoiTuMay({ phan: 'I', correct: 'C', choices: ['10,2 gam', '10,25 gam', '12,2 gam', '14,2 gam'] }, '10,22')).toBeNull()
    expect(dapAnMoiTuMay({ phan: 'I', correct: 'B', choices: ['$8,2$', '$10,2$', '$12,2$', '$14,2$'] }, '8,2')).toBe('A')
  })
})

// ---------------------------------------------------------------- máy soạn: nghi ⇒ sửa ⇒ soạn lại ⇒ dat

/** Số máy giải ra cho từng câu (mô hình giả luôn trả một bản đúng khuôn; cổng giả so số này với đáp án kho trong ctx). */
const MAY: Record<string, number> = { [Q_III]: 70.04, [Q_I]: 12.2, [Q_I2]: 10.22, [Q_III5]: 2.24 }
const so = (s: string) => Number(String(s).replace(/[^\d,.-]/g, '').replace(/\.$/, '').replace(',', '.'))
const congGia = vi.fn((ban: BanSoDo, ctx: { phan: string; dapAn: string; luaChon: readonly string[] }) => {
  const may = MAY[ban.qid]!
  const kho = ctx.phan === 'III' ? so(ctx.dapAn) : so(ctx.luaChon['ABCD'.indexOf(ctx.dapAn)] ?? '')
  return Math.abs(kho - may) <= 0.01 * Math.abs(may) ? { ket: 'dat' as const, giaTri: may } : { ket: 'lech' as const, lyDo: 'tích lệch đáp án kho', giaTri: may }
})
const moHinhGia = vi.fn(async () => ({ ok: true as const, chu: JSON.stringify({ deNoiGi: 'Đề cho khối lượng, hỏi khối lượng.', buoc: [{ ten: 'm', thuaSo: [{ so: '2', nghia: 'hệ số' }] }] }), model: 'gia', vao: 10, ra: 5 }))
const soan = async (thamSo: Record<string, unknown>) => {
  const r = await soanSoDoLo(d.env, thamSo, { goiMoHinh: moHinhGia, kiemCong: congGia, bayGio: () => LUC })
  return (await r.json()) as { ok: boolean; dem: Record<string, number>; ketQua: Record<string, unknown>[] }
}
const dongSoDo = (qid: string) => d.sql.prepare('SELECT * FROM loi_giai_so_do WHERE qid = ?').get(qid) as Record<string, unknown> | undefined

describe('máy soạn sơ đồ + tự sửa đáp án kho', () => {
  beforeEach(() => { congGia.mockClear(); moHinhGia.mockClear() })

  it('Phần III nghi ⇒ sửa kho theo số máy (làm tròn như kho) ⇒ soạn lại ⇒ ghi bản `dat` đúng version mới', async () => {
    const j = await soan({ qids: [Q_III] })
    expect(j.ok).toBe(true)
    expect(j.dem).toMatchObject({ dat: 1, lech: 0, nghi_dap_an: 1, da_sua_dap_an: 1 })
    expect(j.ketQua[0]).toMatchObject({ qid: Q_III, ket: 'dat', daSuaDapAn: true })
    expect(dapAnTrongGoi(1, 'III')).toBe('70,0')
    const sua = d.sql.prepare('SELECT * FROM dap_an_kho_sua').all() as Record<string, unknown>[]
    expect(sua).toEqual([expect.objectContaining({ qid: Q_III, cu: '76,8', moi: '70,0', nguon: 'soan-so-do', da_lui: 0 })])
    expect(j.ketQua[0]!.maSuaDapAn).toBe(sua[0]!.id)
    expect(dongSoDo(Q_III)).toMatchObject({ cong: 'dat', version: cauChiMuc(Q_III)!.version })
    // lượt soạn lại đưa ĐÁP ÁN MỚI cho cổng
    expect(congGia.mock.calls.at(-1)![1]).toMatchObject({ phan: 'III', dapAn: '70,0' })
  })

  it('Phần I nghi, khớp đúng một phương án ⇒ đổi chữ ⇒ soạn lại đạt', async () => {
    const j = await soan({ qids: [Q_I] })
    expect(j.dem).toMatchObject({ dat: 1, da_sua_dap_an: 1 })
    expect(dapAnTrongGoi(2, 'I')).toBe('C')
    expect(dongSoDo(Q_I)).toMatchObject({ cong: 'dat', version: cauChiMuc(Q_I)!.version })
  })

  it('Phần I khớp 2 phương án ⇒ KHÔNG sửa, giữ dòng `lech` + nghi', async () => {
    const j = await soan({ qids: [Q_I2] })
    expect(j.dem).toMatchObject({ lech: 1, nghi_dap_an: 1, da_sua_dap_an: 0 })
    expect(j.ketQua[0]).toMatchObject({ qid: Q_I2, ket: 'lech', khongSua: 'khong_chon_duoc' })
    expect(dapAnTrongGoi(3, 'I')).toBe('C')
    expect(dongSoDo(Q_I2)).toMatchObject({ cong: 'lech', nghi_dap_an: 1 })
  })

  it('thuKhong ⇒ không sửa kho, không ghi gì', async () => {
    const j = await soan({ qids: [Q_III], thuKhong: true })
    expect(j.dem).toMatchObject({ lech: 1, nghi_dap_an: 1, da_sua_dap_an: 0 })
    expect(String(d.objects.get(KHOA))).toBe(JSON.stringify(goiMau()))
    expect(capNhat()).toBe('v1')
  })

  it('tuSuaDapAn: false ⇒ chỉ đánh dấu nghi, không sửa kho', async () => {
    const j = await soan({ qids: [Q_III], tuSuaDapAn: false })
    expect(j.dem).toMatchObject({ lech: 1, nghi_dap_an: 1, da_sua_dap_an: 0 })
    expect(dapAnTrongGoi(1, 'III')).toBe('76,8')
    expect(dongSoDo(Q_III)).toMatchObject({ cong: 'lech', nghi_dap_an: 1, dap_an_may: '70,04' })
  })

  it('hai câu cùng tờ trong một đợt ⇒ sửa tuần tự, cả hai thay đổi đều còn trong gói', async () => {
    const j = await soan({ qids: [Q_III, Q_I] })
    expect(j.dem).toMatchObject({ dat: 2, da_sua_dap_an: 2 })
    expect(goiR2().cau.map((c) => c.dap_an)).toEqual(['70,0', 'C', 'DSDS', 'C', '2,24'])
  })

  it('câu bị từ chối sửa (ca thi mở) ⇒ giữ dòng nghi, ghi lý do không sửa', async () => {
    d.sql.prepare(`INSERT INTO ca (ma_ca, trang_thai, loai, cong_bo, cap_nhat_luc) VALUES ('CA-MO', 'mo', 'thi', 'ngay', '2026-10-26T00:00:00.000Z')`).run()
    xoaDemCaBaoVe()
    const j = await soan({ qids: [Q_III] })
    expect(j.dem).toMatchObject({ lech: 1, nghi_dap_an: 1, da_sua_dap_an: 0 })
    expect(j.ketQua[0]).toMatchObject({ khongSua: 'ca_thi_mo' })
    expect(dapAnTrongGoi(1, 'III')).toBe('76,8')
  })
})
