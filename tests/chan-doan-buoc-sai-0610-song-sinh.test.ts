// @vitest-environment node
// (2b) XOAY VÒNG SONG SINH "BẢN LÂU CHƯA PHỤC VỤ NHẤT" (06/10, lệnh thầy "Làm chuẩn đoán bước sai, còn nhỏ") — D1 thật (node:sqlite, đủ migration).
// Trước: bản của lượt làm lại = (số lượt song sinh / câu anh em / biến thể đã làm) mod (số bản) ⇒ lượt câu anh em chen giữa làm NHẢY CÓC một bản và có thể LẶP
// bản vừa ra trước khi ra hết. Nay: bản chưa làm lần nào trước (theo thứ tự chỗ), hết ⇒ bản có lần làm gần nhất CŨ nhất (sổ `su_kien_hoc`, qid `<gốc>~ss<i>`).
// Tương thích: em chỉ làm song sinh theo thứ tự ⇒ đúng dãy cũ ss0 → ss1 → ss2 → ss3 → ss0.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { docHoSo2, docLanLam } from '../server/src/srs2-d1'
import { chonBanSongSinh, chonSongSinh } from '../server/src/hang-chua-loi'
import { damBaoBangBoTro } from '../server/src/cau-bo-tro'
import { damBaoBangLoiGiai } from '../server/src/loi-giai'
import type { Env } from '../server/src/kieu'

const cau = (qid: string) => JSON.stringify({
  qid, maDe: 'DE9', lop: '12', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu gốc ${qid}`, choices: ['a', 'b', 'c', 'd'], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'TH',
  correct: 'B', reviewed: true, solution: { chot: 'Bảo toàn khối lượng' },
})
const ss = (k: number) => ({ de: `Song sinh ${k}: tính m`, pa: { A: `${k}1`, B: `${k}2`, C: `${k}3`, D: `${k}4` }, dap_an: 'C', buoc: ['n', 'm'], gia_tri_dung: '1' })
async function dung(soBan = 4, thieu: number[] = []) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const q of ['X1', 'A1']) st.run('DE9', q, 'v1', `g-${q}`, 'D1', cau(q))
  await damBaoBangLoiGiai(env); await damBaoBangBoTro(env)
  d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES('X1','BAM1','DE9','tn','x')").run()
  // `thieu`: chỗ song sinh THIẾU dữ kiện (đề nhắc bảng mà không có bảng) ⇒ không dùng được.
  const ds = Array.from({ length: soBan }, (_, k) => (thieu.includes(k) ? { ...ss(k), de: 'Cho các giá trị trong bảng sau. Tính m.' } : ss(k)))
  d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES('BAM1','X1',?,'[]','[]','[]','x')").run(JSON.stringify(ds))
  return { d, env }
}
let n = 0
const ghi = (d: ReturnType<typeof taoD1That>, qid: string, kq: number, luc: string, raw?: Record<string, unknown>) =>
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,raw_json) VALUES(?,?,?,?,?,1,?,?,?,?,?)')
    .run(`k${++n}`, 'S1', qid, 'game', `P${n}`, kq, luc, luc.slice(0, 10), 'none', raw ? JSON.stringify(raw) : null)
const banTiep = async (env: Env, homNay = '2026-10-09') => (await docHoSo2(env, 'S1', homNay)).songSinhLamLai?.get('X1')

describe('(2b) chonBanSongSinh — thuần', () => {
  it('chưa làm bản nào ⇒ bản đầu; làm theo thứ tự ⇒ ss0 → ss1 → ss2 → ss3 → ss0 (tương thích dãy cũ)', () => {
    const lam: { i: number; luc: string }[] = []
    const day: number[] = []
    for (let k = 0; k < 6; k++) { const i = chonBanSongSinh([0, 1, 2, 3], lam); day.push(i); lam.push({ i, luc: `2026-10-0${k + 1}T00:00:00Z` }) }
    expect(day).toEqual([0, 1, 2, 3, 0, 1])
    // cùng dãy với cách đếm cũ khi lượt song sinh là lượt duy nhất được đếm
    expect(day).toEqual(Array.from({ length: 6 }, (_, k) => [0, 1, 2, 3][chonSongSinh(Array.from({ length: k }, () => ({ qid: 'X', ngay: '', luc: '', dung: false, coGoiY: false, songSinh: true as const })), 4)]))
  })
  it('bản lâu chưa phục vụ nhất; không lặp bản vừa ra; chỗ không dùng được bị bỏ; không chỗ ⇒ −1', () => {
    expect(chonBanSongSinh([0, 1, 2], [{ i: 1, luc: 'b' }, { i: 0, luc: 'c' }, { i: 2, luc: 'a' }])).toBe(2)
    expect(chonBanSongSinh([0, 1, 2], [{ i: 0, luc: 'a' }, { i: 0, luc: 'z' }, { i: 1, luc: 'm' }, { i: 2, luc: 'n' }])).toBe(1) // ss0 vừa làm lại (z) ⇒ không phải ss0
    expect(chonBanSongSinh([1, 3], [{ i: 0, luc: 'a' }, { i: 1, luc: 'b' }])).toBe(3)
    expect(chonBanSongSinh([], [])).toBe(-1)
  })
})

describe('(2b) kế hoạch ngày xoay đủ các bản song sinh (D1 thật)', () => {
  it('4 bản: lượt làm lại liên tiếp ra ss0, ss1, ss2, ss3 rồi mới quay lại ss0 — kể cả khi có lượt câu anh em / biến thể chen giữa', async () => {
    const { d, env } = await dung(4)
    ghi(d, 'X1', 0, '2026-10-01T03:00:00.000Z') // lỗi mở
    const day: (number | undefined)[] = [await banTiep(env)]
    ghi(d, 'X1~ss0', 0, '2026-10-02T03:00:00.000Z'); day.push(await banTiep(env))
    ghi(d, 'A1', 0, '2026-10-03T03:00:00.000Z', { tc: 'X1' }) // câu anh em làm thay (cũng là lượt "song sinh" của X1) — cách cũ nhảy cóc ở đây
    ghi(d, 'X1~bt0', 0, '2026-10-03T04:00:00.000Z', { tc: 'X1' }) // biến thể bằng mã chen giữa
    day.push(await banTiep(env))
    ghi(d, 'X1~ss1', 0, '2026-10-04T03:00:00.000Z'); day.push(await banTiep(env))
    ghi(d, 'X1~ss2', 0, '2026-10-05T03:00:00.000Z'); day.push(await banTiep(env))
    ghi(d, 'X1~ss3', 0, '2026-10-06T03:00:00.000Z'); day.push(await banTiep(env))
    expect(day).toEqual([0, 1, 1, 2, 3, 0])
    // hồ sơ lỗi vẫn như cũ: mở, phục vụ song sinh; lượt câu anh em vẫn là lượt song sinh của X1 trong sổ đọc lại
    const hs = await docHoSo2(env, 'S1', '2026-10-09')
    expect(hs.loiV2?.get('X1')).toMatchObject({ trangThai: 'mo', nenSongSinh: true })
    expect(hs.songSinhCho?.get('X1')).toBe(0)
    expect((await docLanLam(env, 'S1', ['X1'])).filter((x) => x.songSinh).length).toBe(6)
  })
  it('bản không dùng được (thiếu dữ kiện) bị bỏ khỏi vòng; vòng chỉ qua các bản dùng được', async () => {
    const { d, env } = await dung(3, [1])
    ghi(d, 'X1', 0, '2026-10-01T03:00:00.000Z')
    expect(await banTiep(env)).toBe(0)
    ghi(d, 'X1~ss0', 0, '2026-10-02T03:00:00.000Z')
    expect(await banTiep(env)).toBe(2)
    ghi(d, 'X1~ss2', 0, '2026-10-03T03:00:00.000Z')
    expect(await banTiep(env)).toBe(0)
  })
  it('đã ra hết các bản ⇒ bản cũ nhất (không phải bản vừa ra), kể cả khi em làm lại bản cũ ngoài thứ tự', async () => {
    const { d, env } = await dung(3)
    ghi(d, 'X1', 0, '2026-10-01T03:00:00.000Z')
    ghi(d, 'X1~ss2', 0, '2026-10-02T03:00:00.000Z')
    ghi(d, 'X1~ss0', 0, '2026-10-03T03:00:00.000Z')
    ghi(d, 'X1~ss1', 0, '2026-10-04T03:00:00.000Z')
    expect(await banTiep(env)).toBe(2)
    ghi(d, 'X1~ss2', 0, '2026-10-05T03:00:00.000Z')
    expect(await banTiep(env)).toBe(0)
  })
  it('docLanLam không truyền phần đọc kèm ⇒ lần làm y hệt cũ (hình LanLam không đổi)', async () => {
    const { d, env } = await dung(2)
    ghi(d, 'X1~ss1', 1, '2026-10-02T03:00:00.000Z')
    expect(await docLanLam(env, 'S1', ['X1'])).toEqual([{ qid: 'X1', songSinh: true, ngay: '2026-10-02', luc: '2026-10-02T03:00:00.000Z', dung: true, coGoiY: false, nguon: 'game' }])
  })
})
