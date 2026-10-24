// @vitest-environment node
// Báo cáo tuần gửi phụ huynh (thầy 24/10). Ghim luật viết: xưng Thầy, gọi Anh/chị, mỗi tin ≤ 120 chữ, không gạch dài / emoji / lời chào chúc,
// số nào thiếu dữ liệu thì không viết; tin 2 chỉ khi có điểm yếu và đủ 4 phần (lỗi · nguyên nhân · việc có số · mốc Thầy kiểm lại).
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { demChu, soanTinBaoCaoTuan, tenGoi, type DuLieuTuan } from '../server/src/bao-cao-tuan'

const GOC: DuLieuTuan = {
  hoTen: 'Nguyễn Văn An', tu: '18/10', den: '24/10', thuHaiToi: '26/10',
  buoi: { tong: 3, coMat: 2, coPhep: 1 }, soNgay: 7, ngayCoLam: 6, soCau: 84, soDung: 61,
  mucLam: { thuoc: 20, bamVoi: 3, treo: 1, coNghi: 50 }, ktcn: { nop: 2, bo: 1, diem: [7.5, 8.25] },
  banKhac: { lam: 12, dung: 9 }, banKhacTruoc: { lam: 10, dung: 5 }, chuyenDeYeu: [{ ten: 'Este', sai: 5, lam: 9 }],
}
const CAM = [/—/, /\p{Extended_Pictographic}/u, /Kính gửi|Trân trọng|Chúc|Hy vọng|cố gắng hơn|tôi|trung tâm/i]
const sach = (t: string) => { for (const r of CAM) expect(t).not.toMatch(r); expect(demChu(t)).toBeLessThanOrEqual(120) }

describe('soạn tin báo cáo tuần', () => {
  it('tin 1: đủ số liệu, đúng phép tính, ≤ 120 chữ', () => {
    const [t1, t2] = soanTinBaoCaoTuan(GOC)
    expect(tenGoi(GOC.hoTen)).toBe('An')
    expect(t1).toContain('Anh/chị, tuần 18/10 đến 24/10 của em An.')
    expect(t1).toContain('Đi học 2/3 buổi, vắng có phép 1 buổi.')
    expect(t1).toContain('Em làm bài 6/7 ngày, 84 câu, đúng 73%.') // 61/84 = 72,6%
    expect(t1).toContain('20 câu làm nhanh vì đã thuộc, 3 câu bấm vội mà sai, 1 lần để máy treo')
    expect(t1).toContain('Kiểm tra cá nhân nộp 2/3 bài, điểm trung bình 7,9, bỏ 1 bài.') // (7,5 + 8,25)/2 = 7,875
    expect(t1).toContain('đúng 75% (tuần trước 50%)')
    sach(t1!)
    // Điểm yếu lớn nhất ở đây là chuyên đề Este ⇒ tin 2 đủ 4 phần, có mốc Thầy kiểm lại.
    expect(t2).toContain('Chuyên đề Este em An sai 5/9 câu')
    expect(t2).toContain('Tuần tới em làm lại 10 câu Este')
    expect(t2).toContain('Thứ Hai 26/10 Thầy gửi lại số liệu')
    sach(t2!)
  })
  it('không có dữ liệu thì không viết số (không bịa)', () => {
    const [t1] = soanTinBaoCaoTuan({ ...GOC, buoi: null, mucLam: null, ktcn: { nop: 0, bo: 0, diem: [] }, banKhac: { lam: 3, dung: 1 }, chuyenDeYeu: [] })
    expect(t1).not.toMatch(/Đi học|Kiểm tra cá nhân|bản khác|thuộc/)
  })
  it('tuần tốt ⇒ chỉ một tin, không nhận xét gượng', () => {
    expect(soanTinBaoCaoTuan({ ...GOC, ktcn: { nop: 3, bo: 0, diem: [8] }, chuyenDeYeu: [] })).toHaveLength(1)
  })
  it('bỏ bài nhiều ngày ⇒ tin 2 nói đúng số ngày, việc 7/7 ngày', () => {
    const t = soanTinBaoCaoTuan({ ...GOC, ngayCoLam: 2 })
    expect(t[1]).toContain('Em An chỉ làm bài 2/7 ngày')
    expect(t[1]).toContain('7/7 ngày')
    sach(t[1]!)
  })
  it('bấm vội nhiều ⇒ tin 2 về bấm vội, mục tiêu bằng số', () => {
    const t = soanTinBaoCaoTuan({ ...GOC, mucLam: { thuoc: 5, bamVoi: 20, treo: 0, coNghi: 40 } })
    expect(t[1]).toContain('có 20 câu trả lời trước khi đọc xong đề và sai')
    expect(t[1]).toContain('dưới 10')
  })
  it('nhãn Đối phó chỉ xuất hiện khi có (công tắc bật); không bao giờ «Không dạy nổi»/«ĐUỔI»', () => {
    const t = soanTinBaoCaoTuan({ ...GOC, nhan: 'Đối phó', lyDo: ['22/80 lượt trả lời trước khi đọc xong đề mà sai'] })
    expect(t[1]).toContain('nhóm Đối phó: 22/80 lượt')
    expect(t.join(' ')).not.toMatch(/Không dạy nổi|ĐUỔI/)
    expect(soanTinBaoCaoTuan(GOC).join(' ')).not.toContain('Đối phó')
  })
})

describe('báo cáo tuần — D1', () => {
  it('thầy xem được tin của một em; số liệu đếm đúng từ su_kien_hoc', async () => {
    const d = taoD1That()
    d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, cap_nhat_luc) VALUES (?,?,?,?)').run('A1', 'Trần Thị Bình', '12', 'x')
    const now = Date.parse('2026-10-24T05:00:00Z')
    let k = 0
    for (const [ngay, n, dung] of [['2026-10-20', 10, 7], ['2026-10-22', 6, 6], ['2026-10-10', 9, 0]] as const)
      for (let i = 0; i < n; i++) d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, raw_json) VALUES (?, 'A1', ?, 'game', 'P1', 1, ?, 40, ?, ?, '{}')`)
        .run(`k${k++}`, `Q${k}`, i < dung ? 1 : 0, `${ngay}T03:00:00Z`, ngay)
    const r = await goiWorker(worker, d.env as unknown as Env, '/gv/danh-gia/bao-cao-tuan', { sbd: 'A1' }, true)
    expect(r.ok).toBe(true)
    expect(r.duLieu).toMatchObject({ tu: '18/10', den: '24/10', thuHaiToi: '26/10', ngayCoLam: 2, soCau: 16, soDung: 13 })
    expect(r.tin[0]).toContain('em Bình')
    expect(r.tin[0]).toContain('Em làm bài 2/7 ngày, 16 câu, đúng 81%.') // 13/16 = 81,25%
    expect(r.duLieu.nhan).toBeUndefined() // chạy ngầm ⇒ không kèm nhãn
    expect((await goiWorker(worker, d.env as unknown as Env, '/gv/danh-gia/bao-cao-tuan', { sbd: 'A1' }, false)).ok).toBe(false)
  })
})
