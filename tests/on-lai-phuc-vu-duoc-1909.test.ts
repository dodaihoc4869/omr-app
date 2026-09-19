// @vitest-environment node
// LỖI 19/09 (0.Planer): kế hoạch ngày chọn qid cho việc `on_lai` mà `/hs/cau-theo-qid` KHÔNG phục vụ được → "Ôn 3 câu" không bao giờ xong.
// Sửa tận gốc: MỘT định nghĩa "phục vụ được" (`qidPhucVuDuoc`) dùng cho cả kế hoạch và lệnh lấy đề.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { docDoPhuPhucVu, layCauChoEm, qidPhucVuDuoc } from '../server/src/cau-theo-qid'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { ghiSuKien, ngayVn } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const D = 86_400_000
const cauKho = (qid: string) => ({
  qid, maDe: 'x', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Đề ${qid}`, choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], dang: 'ES.A.X', tenDang: 'Dạng', mucDo: 'biet', sao: 1,
  kienThuc: ['K1'], correct: 'B', solution: 'Giải', reviewed: true,
})
function themCau(d: D1That, maDe: string, cau: string[], daXoa = 0) {
  d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?, '12',?,?,?, 'v1')").run(maDe, maDe, cau.length, `kho/${maDe}.json`, daXoa)
  d.sql.prepare('INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(maDe, 'v1', 'x')
  for (const q of cau) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(maDe, q, 'v1', `g-${q}`, 'ES.A.X', JSON.stringify({ ...cauKho(q), maDe }))
}
/** Ca THI đang mở mà tờ đề có `qid` → mọi qid ấy là đề đang bảo vệ. */
function themCaBaoVe(d: D1That, maCa: string, qid: string[]) {
  d.objects.set(`de/${maCa}.json`, { phanI: qid.map((q) => ({ id: q, text: `Đề ${q}`, choices: ['A', 'B', 'C', 'D'], correct: 'B', dang: { ma: 'ES.A.X', ten: 'Dạng' }, mucDo: 'biet', kienThuc: ['K1'], loiGiai: { chot: 'g' } })), phanII: [], phanIII: [] })
  d.sql.prepare(
    "INSERT INTO ca(ma_ca,trang_thai,cong_bo,bank_r2,loai,thoi_gian_phut,bat_dau,het_han_vao,cap_nhat_luc) VALUES(?,'mo','ca_lop_xong',?,'thi',45,?,?,'x')",
  ).run(maCa, `de/${maCa}.json`, new Date(Date.now() + 3600_000).toISOString(), new Date(Date.now() + 7200_000).toISOString())
}
const themHs = (d: D1That, sbd = 'S1') => d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES(?,'x','mk','x')").run(sbd)
const luc = (soNgayTruoc: number) => new Date(Date.now() - soNgayTruoc * D).toISOString()
async function sai(d: D1That, qids: string[], sbd = 'S1') {
  const r = await ghiSuKien(d.env, qids.map((q, i) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd, qid: q, lan: i + 1, ketQua: 0 as const, luc: luc(3) })))
  expect(r.ok).toBe(true)
  await dungLaiHoSo(d.env, [sbd], new Date().toISOString())
}
const qidOnLai = async (d: D1That, sbd = 'S1') => {
  const kh = (await lapVaLuuKeHoach(d.env, [sbd], Date.now())).get(sbd)!
  const v = kh.viec.find((x) => x.loai === 'on_lai')
  return { kh, qid: ((v?.chiTiet.qid as string[] | undefined) ?? []).slice().sort() }
}

/** Trường hợp 12121212: 5 câu tới hạn — 2 phục vụ được, 1 chưa lập chỉ mục, 1 đề đã xoá, 1 nằm trong đề thi đang bảo vệ. */
async function dung() {
  const d = taoD1That()
  themHs(d)
  themCau(d, 'DE-OK', ['OK1', 'OK2'])
  themCau(d, 'DE-XOA', ['DEXOA1'], 1)
  themCau(d, 'DE-BV', ['BAOVE1'])
  themCaBaoVe(d, 'CA-MO-1', ['BAOVE1'])
  await sai(d, ['OK1', 'OK2', 'KHONG1', 'DEXOA1', 'BAOVE1'])
  return d
}

describe('kế hoạch chỉ chọn qid mà lệnh lấy đề PHỤC VỤ ĐƯỢC', () => {
  it('câu chưa lập chỉ mục, đề đã xoá, hoặc nằm trong đề thi đang bảo vệ KHÔNG vào việc on_lai; câu phục vụ được thì vào', async () => {
    const d = await dung()
    const { kh, qid } = await qidOnLai(d)
    expect(qid).toEqual(['OK1', 'OK2'])
    expect(kh.tienBo.soCauToiHan).toBe(2) // số câu tới hạn cũng chỉ đếm câu em làm được
  })

  it('TÍNH CHẤT: mọi qid trong việc on_lai đều được `layCauChoEm` trả về (không có câu chết)', async () => {
    const d = await dung()
    const { qid } = await qidOnLai(d)
    const r = await layCauChoEm(d.env, 'S1', qid)
    expect(r.khongCo).toEqual([])
    expect(r.cau.map((c) => c.qid).sort()).toEqual(qid)
  })

  it('đề thi được công bố/đóng lại → câu hết bị bảo vệ và vào hàng ôn ở lần lập kế hoạch sau', async () => {
    const d = await dung()
    expect((await qidOnLai(d)).qid).toEqual(['OK1', 'OK2'])
    d.sql.prepare("UPDATE ca SET trang_thai='dong' WHERE ma_ca='CA-MO-1'").run()
    const sau = await qidOnLai(d)
    expect(sau.qid).toEqual(['BAOVE1', 'OK1', 'OK2'])
    const r = await layCauChoEm(d.env, 'S1', sau.qid)
    expect(r.khongCo).toEqual([])
  })

  it('CÂU CHẾT KHÔNG CHIẾM CHỖ: hàng tới hạn dài hơn số câu được giao thì lấy câu tới hạn KẾ TIẾP, không lấy câu chết', async () => {
    const d = taoD1That()
    themHs(d)
    const song = Array.from({ length: 12 }, (_, i) => `S${String(i).padStart(2, '0')}`)
    const chet = ['C1', 'C2', 'C3']
    themCau(d, 'DE-OK', song)
    // Câu chết có mốc ôn SỚM hơn (sai lâu hơn) nên nếu không lọc thì chúng chiếm đầu hàng.
    await ghiSuKien(d.env, chet.map((q, i) => ({ nguon: 'btvn' as const, maNguon: 'B0', sbd: 'S1', qid: q, lan: i + 1, ketQua: 0 as const, luc: luc(9) })))
    await sai(d, song)
    const { qid } = await qidOnLai(d)
    expect(qid.length).toBeGreaterThan(0)
    expect(qid.every((q) => song.includes(q))).toBe(true)
    const r = await layCauChoEm(d.env, 'S1', qid)
    expect(r.khongCo).toEqual([])
  })

  it('chưa lập chỉ mục game nào (máy chủ mới/fixture cũ): KHÔNG lọc, giữ hành vi cũ', async () => {
    const d = taoD1That()
    themHs(d)
    await sai(d, ['A1', 'A2'])
    expect((await qidOnLai(d)).qid).toEqual(['A1', 'A2'])
  })

  it('không kiểm được phạm vi đề bảo vệ (tờ đề của ca mở đọc lỗi): kế hoạch không lọc theo bảo vệ (không làm trống việc ôn), lệnh lấy đề vẫn đóng cửa', async () => {
    const d = await dung()
    d.objects.delete('de/CA-MO-1.json') // R2 lỗi → protectedQuestions ném
    const pv = await qidPhucVuDuoc(d.env, ['OK1', 'BAOVE1', 'KHONG1'])
    expect(pv.kiemDuocBaoVe).toBe(false)
    expect([...pv.duoc].sort()).toEqual(['BAOVE1', 'OK1']) // chỉ mới qua chỉ mục
    expect((await qidOnLai(d)).qid).toEqual(['BAOVE1', 'OK1', 'OK2'])
    const r = await layCauChoEm(d.env, 'S1', ['OK1', 'BAOVE1'])
    expect(r.loi).toMatch(/Chưa kiểm tra xong/)
    expect(r.cau).toEqual([])
  })
})

describe('đo độ phủ trên dữ liệu (lệnh của thầy /ke-hoach/do-phu-phuc-vu)', () => {
  it('trả SỐ ĐẾM: qid tới hạn, phục vụ được, không chỉ mục, bị đề bảo vệ, số em ảnh hưởng — không lộ SBD/qid; đòi mã bí mật', async () => {
    const d = await dung()
    themHs(d, 'S2')
    await sai(d, ['OK1'], 'S2') // S2: mọi câu tới hạn đều phục vụ được
    const homNay = ngayVn(Date.now())
    const r = await docDoPhuPhucVu(d.env, homNay)
    expect(r).toMatchObject({
      ok: true, qidToiHan: 5, qidPhucVuDuoc: 2, qidKhongCoChiMuc: 2, qidBiDeBaoVe: 1, tiLeQidKhongPhucVuPhanTram: 60,
      capEmQid: 6, capEmQidKhongPhucVu: 3, soEm: 2, soEmCoCauKhongPhucVu: 1, soEmMatHetCauToiHan: 0, kiemDuocBaoVe: true,
    })
    expect(JSON.stringify(r)).not.toMatch(/S1|S2|OK1|BAOVE1|KHONG1/)
    expect((await goiWorker(worker, d.env, '/ke-hoach/do-phu-phuc-vu', {})).ok).not.toBe(true)
    expect((await goiWorker(worker, d.env, '/ke-hoach/do-phu-phuc-vu', {}, true)).qidToiHan).toBe(5)
  })
})
