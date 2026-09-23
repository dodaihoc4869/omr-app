// @vitest-environment node
// CHẤM LẠI MỘT CA CŨ Ở MÁY CHỦ — `POST /ca/cham-lai` (việc còn lại của MỤC 3; thầy chốt 23/09/2026).
//
// VÌ SAO CÓ ĐƯỜNG NÀY: 23/09 luật chấm Phần III của CA THI đổi sang `so_hoc` dùng chung
// (`src/lib/cham-so.ts` — "0,540" = "0,54") nhưng chỉ áp cho lượt NỘP SAU đó. Điểm của ca đã nộp
// trước vẫn nằm nguyên con số chấm sai trên D1. Lệnh này chấm lại bằng ĐÚNG lõi chấm hiện hành rồi
// ghi lại D1 qua chính `chamDiem` (MỘT đường ghi duy nhất cho ca thi).
//
// Test chạy trên SQLite THẬT (`_d1-that.ts`) nên `chamDiem` chạy thật: `chi_tiet_cau`, `ban_do_sai`,
// `su_kien_hoc`, `tien_do_ca/hs` đều được kiểm chứ không đoán.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { chamLaiMotCa, type LuotChoCham, type NganHangDapAn } from '../server/src/cham-lai-ca'
import { caDaXong } from '../server/src/cong-bo-diem'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const MA = 'CR1'
const NOP = '2026-09-23T03:00:00.000Z'

/** Ngân hàng đáp án 1/1/1. Phần III khóa "0.54" để bắt ĐÚNG ca "0.540" của luật `so_hoc`. */
const NH: NganHangDapAn = {
  phanI: [{ id: `${MA}-I-1`, text: 'I1', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Este', mucDo: 'biet' }],
  phanII: [{ id: `${MA}-II-1`, text: 'II1', ideas: ['1', '2', '3', '4'], correct: ['D', 'S', 'D', 'S'], chuyenDe: 'Điện hoá', mucDo: 'hieu' }],
  phanIII: [{ id: `${MA}-III-1`, text: 'III1', correct: '0.54', chuyenDe: 'Este', mucDo: 'van_dung' }],
  soCau: { I: 1, II: 1, III: 1 },
}
/** Đúng cả ba câu THEO LUẬT `so_hoc`: Phần III gõ "0.540" (khớp giá trị với khóa "0.54"). */
const DUNG = { phanI: { [`${MA}-I-1`]: 'A' }, phanII: { [`${MA}-II-1`]: ['D', 'S', 'D', 'S'] }, phanIII: { [`${MA}-III-1`]: '0.540' } }
/** Sai cả ba câu (Phần II chọn ngược hết nên 0 ý đúng). */
const SAI = { phanI: { [`${MA}-I-1`]: 'B' }, phanII: { [`${MA}-II-1`]: ['S', 'D', 'S', 'D'] }, phanIII: { [`${MA}-III-1`]: '9' } }

const luot = (sbd: string, o: Partial<LuotChoCham> = {}): LuotChoCham => ({
  sbd,
  hoTen: `Em ${sbd}`,
  lanThu: 1,
  trangThai: 'da_nop',
  dapAn: DUNG,
  giayCau: null,
  diem: { I: 4.5, II: 4, III: 0, tong: 8.5 },
  ...o,
})

describe('chamLaiMotCa (hàm thuần)', () => {
  it('"0,540" khớp "0,54" ⇒ 8,5 lên 10,0, chi tiết câu nói ĐÚNG, báo đổi', () => {
    const kq = chamLaiMotCa(MA, 'Ca thử', NH, [luot('S1')])
    expect(kq.em).toHaveLength(1)
    expect(kq.em[0]!.cu.tong).toBe(8.5)
    expect(kq.em[0]!.moi).toEqual({ I: 4.5, II: 4, III: 1.5, tong: 10 })
    expect(kq.em[0]!.doi).toBe(true)
    expect(kq.soDoi).toBe(1)
    expect(kq.bai).toHaveLength(1)
    expect(kq.bai[0]!.cau.find((c) => c.phan === 'III')!.dungSai).toBe(true)
    expect(kq.tuChoi).toEqual([])
  })

  it('bài KHÔNG đổi thì doi=false; lượt đang làm bị bỏ qua', () => {
    const kq = chamLaiMotCa(MA, 'Ca thử', NH, [
      luot('S1', { dapAn: SAI, diem: { I: 0, II: 0, III: 0, tong: 0 } }),
      luot('S2', { trangThai: 'dang_lam', dapAn: null, diem: { I: null, II: null, III: null, tong: null } }),
    ])
    expect(kq.em.map((e) => e.sbd)).toEqual(['S1'])
    expect(kq.soDoi).toBe(0)
    expect(kq.bai).toHaveLength(1)
  })

  it('lấy lượt NỘP MỚI NHẤT, không phải lượt cũ', () => {
    const kq = chamLaiMotCa(MA, 'Ca thử', NH, [
      luot('S1', { lanThu: 1, dapAn: SAI, diem: { I: 0, II: 0, III: 0, tong: 0 } }),
      luot('S1', { lanThu: 2, dapAn: DUNG, diem: { I: 0, II: 0, III: 0, tong: 0 } }),
    ])
    expect(kq.bai).toHaveLength(1)
    expect(kq.bai[0]!.lanThu).toBe(2)
    expect(kq.em[0]!.moi.tong).toBe(10)
  })

  it('khóa đáp án hỏng ⇒ vào tuChoi, KHÔNG dựng gói ghi (không ghi đè điểm cũ)', () => {
    const hong = { ...NH, phanI: [{ ...NH.phanI[0]!, correct: '' as 'A' }] }
    const kq = chamLaiMotCa(MA, 'Ca thử', hong, [luot('S1')])
    expect(kq.bai).toHaveLength(0)
    expect(kq.tuChoi.map((x) => x.sbd)).toEqual(['S1'])
  })
})

describe('caDaXong — cổng "ca cũ"', () => {
  it('đóng là xong; cả lớp nộp là xong; còn em đang làm thì CHƯA', () => {
    expect(caDaXong('dong', 0, 0)).toBe(true)
    expect(caDaXong('mo', 3, 3)).toBe(true)
    expect(caDaXong('mo', 3, 2)).toBe(false)
    expect(caDaXong('mo', 0, 0)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Đường thật: `POST /ca/cham-lai` trên D1 giả bằng SQLite thật.

function dung(ca = { trangThai: 'dong' }): D1That {
  const d = taoD1That()
  d.sql
    .prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,so_cau_json,sinh_tai_d1,cap_nhat_luc) VALUES(?,?,?,?,?,?,1,?)')
    .run(MA, 'Ca chấm lại', ca.trangThai, 'thi', 'ngay', JSON.stringify({ I: 1, II: 1, III: 1 }), NOP)
  d.objects.set(`key/${MA}.json`, NH)
  return d
}

function themLuot(d: D1That, sbd: string, o: { dapAn?: unknown; tong?: number | null; iii?: number | null; lan?: number; tt?: string } = {}) {
  const tt = o.tt ?? 'da_nop'
  d.sql
    .prepare(
      'INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc,ho_ten,tong,diem_i,diem_ii,diem_iii,dap_an_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    )
    .run(
      `${MA}|${sbd}|${o.lan ?? 1}`, MA, sbd, o.lan ?? 1, NOP, tt === 'dang_lam' ? null : NOP, tt, NOP, `Em ${sbd}`,
      o.tong === undefined ? 8.5 : o.tong, 4.5, 4, o.iii === undefined ? 0 : o.iii,
      tt === 'dang_lam' ? null : JSON.stringify(o.dapAn ?? DUNG),
    )
}

describe('/ca/cham-lai — đường thật trên D1', () => {
  it('chấm lại rồi GHI D1: điểm · chi tiết câu · dọn bản đồ câu sai · sổ sự kiện', async () => {
    const d = dung()
    themLuot(d, 'S1') // 8,5 → 10,0 (câu III từ chấm sai thành đúng)
    themLuot(d, 'S2', { dapAn: SAI, tong: 0, iii: 0 }) // giữ 0
    themLuot(d, 'S3', { tt: 'dang_lam', tong: null, iii: null }) // đang làm — không đụng
    // Bản đồ câu sai CŨ do lần chấm sai: câu III của S1 bị ghi sai oan.
    d.sql
      .prepare('INSERT INTO ban_do_sai(khoa,ma_ca,sbd,qid,chuyen_de,muc_do,so_lan_sai,da_chua,cap_nhat_luc) VALUES(?,?,?,?,?,?,1,0,?)')
      .run(`${MA}|S1|${MA}-III-1`, MA, 'S1', `${MA}-III-1`, 'Este', 'van_dung', NOP)

    const kq = await goiWorker(worker, d.env, '/ca/cham-lai', { maCa: MA }, true)
    expect(kq.ok).toBe(true)
    expect(kq.soDoi).toBe(1)
    expect(kq.soGhi).toBe(2)
    expect(kq.soEmDaVao).toBe(3)
    expect(kq.soEmDaNop).toBe(2)
    expect(kq.tuChoi).toEqual([])
    expect(kq.em.find((e: { sbd: string }) => e.sbd === 'S1')).toMatchObject({ cu: { tong: 8.5 }, moi: { tong: 10 }, doi: true })
    expect(kq.em.find((e: { sbd: string }) => e.sbd === 'S2')).toMatchObject({ cu: { tong: 0 }, doi: false })

    // ĐIỂM trên dòng lượt
    const s1 = d.sql.prepare("SELECT tong, diem_iii FROM luot WHERE ma_ca=? AND sbd='S1'").get(MA) as { tong: number; diem_iii: number }
    expect(s1.tong).toBe(10)
    expect(s1.diem_iii).toBe(1.5)
    // CHI TIẾT CÂU dựng lại
    const ct = d.sql.prepare('SELECT dung_sai FROM chi_tiet_cau WHERE ma_ca=? AND sbd=? AND qid=?').get(MA, 'S1', `${MA}-III-1`) as { dung_sai: number }
    expect(ct.dung_sai).toBe(1)
    // DỌN bản đồ câu sai: câu đã đúng ⇒ dòng sai oan biến mất; S2 sai thật ⇒ còn 3 dòng
    expect(d.dem('ban_do_sai', `ma_ca='${MA}' AND sbd='S1'`)).toBe(0)
    expect(d.dem('ban_do_sai', `ma_ca='${MA}' AND sbd='S2'`)).toBe(3)
    // SỔ SỰ KIỆN HỌC: 2 em × 3 câu
    expect(d.dem('su_kien_hoc', `nguon='thi' AND ma_nguon='${MA}'`)).toBe(6)
    // EM ĐANG LÀM không bị ghi gì
    const s3 = d.sql.prepare("SELECT tong, trang_thai FROM luot WHERE ma_ca=? AND sbd='S3'").get(MA) as { tong: number | null; trang_thai: string }
    expect(s3).toEqual({ tong: null, trang_thai: 'dang_lam' })
    expect(d.dem('chi_tiet_cau', `ma_ca='${MA}' AND sbd='S3'`)).toBe(0)
    // TIẾN ĐỘ tổng dựng lại từ chi tiết câu
    expect(d.dem('tien_do_hs', `sbd='S1'`)).toBeGreaterThan(0)
  })

  it('ca CHƯA xong ⇒ TỪ CHỐI, không ghi gì', async () => {
    const d = dung({ trangThai: 'mo' })
    themLuot(d, 'S1')
    themLuot(d, 'S2', { tt: 'dang_lam', tong: null, iii: null })
    const kq = await goiWorker(worker, d.env, '/ca/cham-lai', { maCa: MA }, true)
    expect(kq.ok).toBe(false)
    expect(kq.lyDo).toBe('ca_chua_xong')
    expect(d.dem('chi_tiet_cau')).toBe(0)
    expect(d.dem('su_kien_hoc')).toBe(0)
  })

  it('ca chưa cất ngân hàng đáp án ⇒ TỪ CHỐI', async () => {
    const d = dung()
    d.objects.delete(`key/${MA}.json`)
    themLuot(d, 'S1')
    const kq = await goiWorker(worker, d.env, '/ca/cham-lai', { maCa: MA }, true)
    expect(kq.ok).toBe(false)
    expect(kq.lyDo).toBe('chua_co_dap_an')
  })

  it('không có ca ⇒ khong_co_ca', async () => {
    const d = taoD1That()
    const kq = await goiWorker(worker, d.env, '/ca/cham-lai', { maCa: 'KHONG-CO' }, true)
    expect(kq.ok).toBe(false)
    expect(kq.lyDo).toBe('khong_co_ca')
  })

  it('thiếu mã ca ⇒ từ chối ngay, không chạm D1', async () => {
    const d = dung()
    const kq = await goiWorker(worker, d.env, '/ca/cham-lai', {}, true)
    expect(kq.ok).toBe(false)
    expect(String(kq.error)).toContain('mã ca')
  })

  it('KHÔNG có mã bí mật ⇒ 403, không ghi gì (lệnh đổi điểm của em thật)', async () => {
    const d = dung()
    themLuot(d, 'S1')
    const r = await worker.fetch(
      new Request('https://test/ca/cham-lai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ maCa: MA }) }),
      d.env,
    )
    expect(r.status).toBe(403)
    expect(d.dem('chi_tiet_cau')).toBe(0)
    expect((d.sql.prepare("SELECT tong FROM luot WHERE ma_ca=? AND sbd='S1'").get(MA) as { tong: number }).tong).toBe(8.5)
  })
})
