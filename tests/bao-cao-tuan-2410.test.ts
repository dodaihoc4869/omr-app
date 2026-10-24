// @vitest-environment node
// Báo cáo tuần gửi phụ huynh (thầy 24/10). Ghim luật viết: xưng Thầy, gọi Anh/chị, mỗi tin ≤ 120 chữ, không gạch dài / emoji / lời chào chúc,
// số nào thiếu dữ liệu thì không viết. Tin NHẬN XÉT chỉ ở bản thầy, đủ 4 phần theo thứ tự (lỗi có ngày + số câu · nguyên nhân · việc có số · mốc);
// nguyên nhân máy không đo được ⇒ ô «[Thầy điền nguyên nhân]». Phụ huynh chỉ nhận tin SỐ LIỆU; nhãn Đối phó chỉ khi tuần đó đã báo phụ huynh.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { demChu, O_DIEN, soanTinBaoCaoTuan, tenGoi, type DuLieuTuan } from '../server/src/bao-cao-tuan'

const GOC: DuLieuTuan = {
  hoTen: 'Nguyễn Văn An', tu: '18/10', den: '24/10', ngayKiem: '31/10',
  buoi: { tong: 3, coMat: 2, coPhep: 1 }, soNgay: 7, ngayCoLam: 6, ngayKhongLam: ['21/10'], soCau: 84, soDung: 61,
  mucLam: { thuoc: 20, bamVoi: 3, treo: 1, doDuoc: 70 }, ktcn: { nop: 2, hetHan: ['22/10'], diem: [7.5, 8.25] },
  banKhac: { lam: 12, dung: 9 }, banKhacTruoc: { lam: 10, dung: 5 }, chuyenDeYeu: [{ ten: 'Este', sai: 5, lam: 9 }],
}
const CAM = [/—/, /\p{Extended_Pictographic}/u, /Kính gửi|Trân trọng|Chúc|Hy vọng|cố gắng hơn|tôi|trung tâm|Không dạy nổi|ĐUỔI/i]
const sach = (t: string) => { for (const r of CAM) expect(t).not.toMatch(r); expect(demChu(t)).toBeLessThanOrEqual(120) }
/** 4 phần theo đúng thứ tự: lỗi (có ngày dd/mm) → nguyên nhân → việc (có số) → mốc Thầy kiểm lại. */
function du4Phan(t: string, loi: string, viec: string) {
  const i = [t.indexOf(loi), t.indexOf(O_DIEN), t.indexOf(viec), t.indexOf('Thầy kiểm lại')]
  expect(i.every((x) => x >= 0)).toBe(true)
  expect([...i].sort((a, b) => a - b)).toEqual(i)
  expect(t.slice(0, i[1])).toMatch(/\d\d\/\d\d/)
  expect(t.slice(i[2]!, i[3])).toMatch(/\d/)
}

describe('soạn tin báo cáo tuần', () => {
  it('tin số liệu: đủ số, đúng phép tính, ≤ 120 chữ', () => {
    const { soLieu, nhanXet, canDien } = soanTinBaoCaoTuan(GOC)
    expect(tenGoi(GOC.hoTen)).toBe('An')
    expect(soLieu).toContain('Anh/chị, tuần 18/10 đến 24/10 của em An.')
    expect(soLieu).toContain('Đi học 2/3 buổi, vắng có phép 1 buổi.')
    expect(soLieu).toContain('Em làm bài 6/7 ngày, 84 câu, đúng 73%.') // 61/84 = 72,6%
    expect(soLieu).toContain('Trong 70 câu đo được giờ làm có 20 câu làm nhanh vì đã thuộc, 3 câu bấm vội mà sai, 1 lần để máy treo.')
    expect(soLieu).toContain('Kiểm tra cá nhân nộp 2/3 bài, điểm trung bình 7,9, để hết hạn 1 bài.') // (7,5 + 8,25)/2 = 7,875
    expect(soLieu).toContain('Câu bản khác của câu đã làm: đúng 75% (tuần trước 50%).')
    sach(soLieu)
    // Điểm yếu lớn nhất ở đây: chuyên đề Este.
    du4Phan(nhanXet!, 'sai 5/9 câu chuyên đề Este', 'làm lại 10 câu Este')
    expect(nhanXet).toContain('Tuần 18/10 đến 24/10 em An sai 5/9 câu chuyên đề Este.')
    expect(nhanXet).toContain('Ngày 31/10 Thầy kiểm lại số liệu 7 ngày tới.')
    expect(canDien).toBe(true)
    sach(nhanXet!)
  })
  it('không có dữ liệu thì không viết số (không bịa)', () => {
    const { soLieu } = soanTinBaoCaoTuan({ ...GOC, buoi: null, mucLam: null, ktcn: { nop: 0, hetHan: [], diem: [] }, banKhac: { lam: 3, dung: 1 }, chuyenDeYeu: [] })
    expect(soLieu).not.toMatch(/Đi học|Kiểm tra cá nhân|bản khác|thuộc/)
  })
  it('tuần tốt ⇒ không có tin nhận xét, không nhận xét gượng', () => {
    expect(soanTinBaoCaoTuan({ ...GOC, ktcn: { nop: 3, hetHan: [], diem: [8] }, chuyenDeYeu: [] })).toMatchObject({ nhanXet: null, canDien: false })
  })
  it('nghỉ làm nhiều ngày ⇒ nêu đúng các ngày, việc 7/7 ngày', () => {
    const t = soanTinBaoCaoTuan({ ...GOC, ngayCoLam: 3, ngayKhongLam: ['19/10', '21/10', '23/10', '24/10'] }).nhanXet!
    du4Phan(t, 'không mở bài các ngày 19/10, 21/10, 23/10 và 24/10', '7/7 ngày')
    sach(t)
  })
  it('bấm vội nhiều ⇒ nhận xét về bấm vội, mục tiêu bằng số', () => {
    const t = soanTinBaoCaoTuan({ ...GOC, mucLam: { thuoc: 5, bamVoi: 20, treo: 0, doDuoc: 70 } }).nhanXet!
    du4Phan(t, '20/70 câu trả lời trước khi đọc xong đề và sai', 'dưới 10')
  })
  it('để hết hạn ≥ 2 bài kiểm tra cá nhân ⇒ nêu ngày từng bài', () => {
    const t = soanTinBaoCaoTuan({ ...GOC, ktcn: { nop: 1, hetHan: ['20/10', '22/10'], diem: [6] }, chuyenDeYeu: [] }).nhanXet!
    expect(t).toContain('để hết hạn 2 bài kiểm tra cá nhân, ngày 20/10 và 22/10.')
  })
  it('nhãn Đối phó chỉ xuất hiện khi có; không bao giờ «Không dạy nổi»/«ĐUỔI»', () => {
    const t = soanTinBaoCaoTuan({ ...GOC, nhan: 'Đối phó', lyDo: ['22/80 lượt trả lời trước khi đọc xong đề mà sai'] })
    expect(t.nhanXet).toContain('nhóm Đối phó: 22/80 lượt')
    expect(soanTinBaoCaoTuan(GOC).nhanXet).not.toContain('Đối phó')
  })
})

describe('báo cáo tuần — D1', () => {
  const NOW = Date.parse('2026-10-24T05:00:00Z')
  function duLieu() {
    const d = taoD1That()
    d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, cap_nhat_luc) VALUES (?,?,?,?)').run('A1', 'Trần Thị Bình', '12', 'x')
    let k = 0
    // 20/10: 10 câu (7 đúng), 22/10: 6 câu đúng, 10/10: ngoài cửa sổ. Có thông tin đọc đề ⇒ đo được giờ làm.
    for (const [ngay, n, dung] of [['2026-10-20', 10, 7], ['2026-10-22', 6, 6], ['2026-10-10', 9, 0]] as const)
      for (let i = 0; i < n; i++) d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, raw_json) VALUES (?, 'A1', ?, 'game', 'P1', 1, ?, ?, ?, ?, ?)`)
        .run(`k${k++}`, `Q${k}`, i < dung ? 1 : 0, i < dung ? 40 : 2, `${ngay}T0${i % 9}:00:00Z`, ngay, JSON.stringify({ doc: { t: 20, h: 0, p: 'I', dh: 1 }, chon: 'ABCD'[i % 4] }))
    return d
  }
  it('thầy xem được hai tin; số liệu đếm đúng; phần cách làm là tập con số câu', async () => {
    const d = duLieu()
    const r = await goiWorker(worker, d.env as unknown as Env, '/gv/danh-gia/bao-cao-tuan', { sbd: 'A1' }, true)
    expect(r.ok).toBe(true)
    expect(r.duLieu).toMatchObject({ tu: '18/10', den: '24/10', ngayKiem: '31/10', ngayCoLam: 2, soCau: 16, soDung: 13 })
    expect(r.duLieu.ngayKhongLam).toEqual(['18/10', '19/10', '21/10', '23/10', '24/10'])
    const m = r.duLieu.mucLam
    expect(m).not.toBeNull()
    expect(m.doDuoc).toBeLessThanOrEqual(16)
    expect(m.thuoc + m.bamVoi).toBeLessThanOrEqual(m.doDuoc)
    expect(r.soLieu).toContain('em Bình')
    expect(r.soLieu).toContain('Em làm bài 2/7 ngày, 16 câu, đúng 81%.') // 13/16 = 81,25%
    expect(r.nhanXet).toContain('không mở bài 5/7 ngày')
    expect(r.duLieu.nhan).toBeUndefined() // chạy ngầm ⇒ không kèm nhãn
    expect((await goiWorker(worker, d.env as unknown as Env, '/gv/danh-gia/bao-cao-tuan', { sbd: 'A1' }, false)).ok).toBe(false)
  })
  it('BẬT + Đối phó tuần ĐẦU (mới nhắc em, chưa báo phụ huynh) ⇒ phụ huynh KHÔNG thấy nhãn; đã báo phụ huynh ⇒ thấy', async () => {
    const d = duLieu()
    const env = d.env as unknown as Env
    await goiWorker(worker, env, '/gv/danh-gia/che-do', { cheDo: 'bat' }, true)
    await (await import('../server/src/danh-gia-hoc-that-d1')).damBaoBangDanhGia(env)
    d.sql.prepare(`INSERT INTO danh_gia_em_tuan (sbd, tuan, diem, bac, bac_tuan, phat_json, so_lieu_json, tien_bo_json, tinh_luc) VALUES ('A1', '2026-10-19', 40, 3, 3, ?, '{}', '{}', 'x')`)
      .run(JSON.stringify([{ ma: 'khongLam', chu: '5/7 ngày không làm câu nào' }]))
    d.sql.prepare(`INSERT INTO can_thiep_em (id, sbd, loai, tuan, gui_luc, tao_boi) VALUES ('c1', 'A1', 'nhac_em', '2026-10-19', '2026-10-19T01:00:00Z', 'may')`).run()
    const { gvBaoCaoTuan } = await import('../server/src/bao-cao-tuan')
    expect((await gvBaoCaoTuan(env, { sbd: 'A1' }, NOW)).duLieu).not.toHaveProperty('nhan')
    expect((await goiWorker(worker, env, '/ph/danh-gia', { sbd: 'A1' }, true)).coDanhGia).toBe(false)
    d.sql.prepare(`INSERT INTO can_thiep_em (id, sbd, loai, tuan, gui_luc, tao_boi) VALUES ('c2', 'A1', 'bao_ph', '2026-10-19', '2026-10-19T01:05:00Z', 'may')`).run()
    const r = await gvBaoCaoTuan(env, { sbd: 'A1' }, NOW)
    expect(r.duLieu).toMatchObject({ nhan: 'Đối phó', lyDo: ['5/7 ngày không làm câu nào'] })
    expect(r.nhanXet).toContain('nhóm Đối phó')
  })
})
