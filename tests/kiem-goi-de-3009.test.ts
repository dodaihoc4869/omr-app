// @vitest-environment node
// Rà thêm đề 30/09 — cổng kiểm gói đề ở máy chủ (src/lib/kiem-goi-de.ts, /kho/day) + khoá câu đang bảo vệ theo NHÓM NỘI DUNG
// cho kênh ngoài game (qidDangBaoVe: BTVN, Câu đã làm). D1 giả bằng SQLite thật (tests/_d1-that.ts).
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { qidDangBaoVe, xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { kiemGoiDe } from '../src/lib/kiem-goi-de'
import { goiWorker, taoD1That } from './_d1-that'

const TN = { phan: 'I', so: 1, de: 'Chất nào sau đây là ester?', pa: { A: 'CH₃COOH', B: 'CH₃COOCH₃', C: 'C₂H₅OH', D: 'HCHO' }, dap_an: 'B' }
const DS = { phan: 'II', so: 1, de: 'Xét các phát biểu về glucose.', y: { a: 'ý a', b: 'ý b', d: 'ý d', c: 'ý c' }, dap_an: 'DSSD' }
const TLN = { phan: 'III', so: 1, de: 'Tính khối lượng (gam) muối thu được.', dap_an: '12,5' }

describe('kiemGoiDe — luật chặn', () => {
  it('gói đúng: không lỗi; khoá ý xếp về a,b,c,d; đáp án viết hoa', () => {
    const r = kiemGoiDe('12-THU', { ma_de: '12-THU', cau: [{ ...TN, dap_an: 'b' }, DS, TLN] })
    expect(r.loi).toEqual([])
    const [tn, ds] = r.goi.cau as Record<string, unknown>[]
    expect(tn.dap_an).toBe('B')
    expect(Object.keys(ds.y as object)).toEqual(['a', 'b', 'c', 'd'])
    expect(ds.dap_an).toBe('DSSD')
  })
  it('từng lỗi được nêu theo câu', () => {
    const r = kiemGoiDe('12-THU', {
      cau: [
        { ...TN, dap_an: 'E' },
        { ...TN, so: 2, pa: { A: 'a', B: 'b', C: 'c' } },
        { ...DS, dap_an: 'DSD' },
        { ...DS, so: 2, y: { a: 'x', b: 'y', c: 'z' } },
        { ...TLN, dap_an: '' },
        { ...TLN, so: 1 }, // trùng III.1
        { phan: 'V', so: 1, de: 'x' },
        { ...TN, so: 3, hinh: [{ tep: 'h.png', vi_tri: 'sau_de' }] },
      ],
    })
    const s = r.loi.join('\n')
    expect(s).toContain('Câu I.1: đáp án "E"')
    expect(s).toContain('Câu I.2: thiếu phương án D')
    expect(s).toContain('Câu II.1: đáp án phải đúng 4 chữ Đ/S')
    expect(s).toContain('Câu II.2: thiếu ý d')
    // Phần III không có đáp án = câu tự luận theo định nghĩa dùng chung (cau-tu-luan.ts) ⇒ không chặn, mọi kênh đã loại.
    expect(s).not.toContain('Câu III.1: thiếu đáp án')
    expect(s).toContain('trùng phần và số')
    expect(s).toContain('phần "V" không hợp lệ')
    expect(s).toContain('Câu I.3: hình "h.png" thiếu dữ liệu ảnh')
  })
  it('mã đề trong gói khác mã gửi lên ⇒ lỗi; Phần IV tự luận không kiểm đáp án', () => {
    expect(kiemGoiDe('12-A', { ma_de: '12-B', cau: [TN] }).loi[0]).toContain('khác mã đề gửi lên')
    expect(kiemGoiDe('12-A', { cau: [{ phan: 'IV', so: 1, de: 'Trình bày…' }] }).loi).toEqual([])
  })
  it('Phần III đáp án máy chấm không đọc được ⇒ không chặn, gắn cờ cần xem; đáp án Đ/S dạng "ĐSSĐ" được chuẩn hoá', () => {
    const r = kiemGoiDe('12-THU', { cau: [{ ...TLN, dap_an: 'khoảng 5' }, { ...DS, dap_an: 'ĐSSĐ' }] })
    expect(r.loi).toEqual([])
    expect(r.canhBao).toHaveLength(1)
    const [tln, ds] = r.goi.cau as Record<string, unknown>[]
    expect(tln.can_xem).toBe(true)
    expect(ds.dap_an).toBe('DSSD')
  })
})

describe('/kho/day — gói lỗi bị từ chối CẢ GÓI, chưa ghi gì', () => {
  it('gói lỗi: 400 kèm danh sách lỗi; không có R2, de_kho, cau_hoi', async () => {
    const d = taoD1That()
    const r = await goiWorker(worker, d.env, '/kho/day', { maDe: '12-LOI', lop: '12', de: { cau: [{ ...TN, dap_an: 'E' }, TLN] }, cau: [] }, true)
    expect(r).toMatchObject({ ok: false, loi: [expect.stringContaining('Câu I.1')] })
    expect(d.objects.has('kho/12-LOI.json')).toBe(false)
    expect(d.dem('de_kho')).toBe(0)
    expect(d.dem('cau_hoi')).toBe(0)
  })
  it('gói đúng: ghi bản đã chuẩn hoá (khoá ý a–d, cờ cần xem) và trả cảnh báo', async () => {
    const d = taoD1That()
    const r = await goiWorker(worker, d.env, '/kho/day', { maDe: '12-OK', lop: '12', de: { cau: [TN, DS, { ...TLN, so: 2, dap_an: 'khoảng 5' }] }, cau: [] }, true)
    expect(r).toMatchObject({ ok: true, canhBao: [expect.stringContaining('Câu III.2')] })
    const goi = JSON.parse(String(d.objects.get('kho/12-OK.json'))) as { cau: Record<string, unknown>[] }
    expect(Object.keys(goi.cau[1].y as object)).toEqual(['a', 'b', 'c', 'd'])
    expect(goi.cau[2].can_xem).toBe(true)
  })
})

describe('qidDangBaoVe — khoá theo qid và theo NHÓM NỘI DUNG (bản chép ở tờ khác)', () => {
  it('câu trong đề ca chưa công bố và bản chép cùng nội dung đều bị khoá; câu khác thì không', async () => {
    const d = taoD1That()
    const iso = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString()
    d.objects.set('ca/BT1.json', JSON.stringify({ ma_de: '12-GOC', cau: [TN] }))
    d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,bat_dau,han_nop,cong_bo,bank_r2,pham_vi,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
      .run('BT1', 'Bài tập', 'mo', 'baitap', '12', iso(-1), iso(48), 'khong', 'ca/BT1.json', 'tu_do', 'x')
    xoaDemCaBaoVe()
    const khoa = await qidDangBaoVe(d.env, [
      { ...TN, qid: '12-GOC-I-1' },
      { ...TN, qid: 'DB-12-CHEP-I-7', so: 7 }, // bản chép: qid khác, cùng nội dung
      { ...TLN, qid: '12-KHAC-III-1' },
    ])
    expect([...khoa].sort()).toEqual(['12-GOC-I-1', 'DB-12-CHEP-I-7'])
  })
})
