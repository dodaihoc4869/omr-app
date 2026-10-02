// @vitest-environment node
// Thầy 02/10: mọi câu sai phải có đường xử lý; chỉ tính từ 29/09. `/gv/cau-sai-mo-coi` đếm câu sai không thuộc chiến dịch nào (chỉ đọc).
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'

function ghi(d: ReturnType<typeof taoD1That>, sbd: string, qid: string, nguon: string, kq: number | null, luc: string, purpose: string | null = null) {
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,luc,ngay_vn,ket_qua,purpose) VALUES(?,?,?,?,?,?,?,?,?)')
    .run(`${nguon}|${sbd}|${qid}|${luc}`, sbd, qid, nguon, 'M', luc, luc.slice(0, 10), kq, purpose)
}

describe('/gv/cau-sai-mo-coi — câu sai không có đường quay lại', () => {
  it('chỉ tính từ 29/09; lần tự làm CUỐI quyết định; bỏ sự kiện đọc lời giải; câu chiến dịch không mồ côi', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,tao_luc) VALUES('CD1','Ôn','12','[\"E1\"]','[\"D\"]','[\"Q-CD\"]','2026-10-05','2026-09-28T00:00:00.000Z')").run()
    ghi(d, 'E1', 'Q-CU', 'thi', 0, '2026-09-20T03:00:00.000Z') // trước 29/09 ⇒ không tính
    ghi(d, 'E1', 'Q-CD', 'thi', 0, '2026-09-30T03:00:00.000Z') // sai nhưng thuộc chiến dịch
    ghi(d, 'E1', 'Q-A', 'thi', 0, '2026-09-30T03:00:00.000Z') // sai, mồ côi
    ghi(d, 'E1', 'Q-B', 'thi', null, '2026-09-30T03:00:00.000Z') // bỏ trống, mồ côi
    ghi(d, 'E1', 'Q-C', 'thi', 0, '2026-09-30T03:00:00.000Z') // sai rồi sau đó đúng ⇒ không tính
    ghi(d, 'E1', 'Q-C#2', 'game', 1, '2026-10-01T03:00:00.000Z')
    ghi(d, 'E2', 'Q-A', 'on_lai', 0, '2026-10-01T03:00:00.000Z', 'xem_loi_giai') // chỉ đọc lời giải ⇒ không phải lần làm
    const r = await goiWorker(worker, d.env, '/gv/cau-sai-mo-coi', {}, true)
    expect(r).toMatchObject({ ok: true, tuNgay: '2026-09-29', tong: { cauSai: 3, moCoi: 2, ngoaiKho: 3, soEm: 1 } })
    expect(r.kenh).toEqual([{ kenh: 'thi', cauSai: 3, boTrong: 1, moCoi: 2, ngoaiKho: 3, soEm: 1 }])
    expect(r.emNhieuNhat).toEqual([{ sbd: 'E1', moCoi: 2 }])
  })

  it('câu sai trong ca ĐÃ CÔNG BỐ và câu sai Lên bảng / đầu giờ đã có nguồn kéo ⇒ không mồ côi', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,cap_nhat_luc) VALUES('CA1','Ca 1','dong','thi','12','ngay','x')").run()
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,cap_nhat_luc) VALUES('CA2','Ca 2','dong','thi','12','khong','x')").run()
    const them = (qid: string, nguon: string, maNguon: string) => d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,luc,ngay_vn,ket_qua) VALUES(?,?,?,?,?,?,?,0)')
      .run(`${nguon}|${qid}`, 'E1', qid, nguon, maNguon, '2026-09-30T03:00:00.000Z', '2026-09-30')
    them('Q-CB', 'thi', 'CA1') // ca đã công bố ⇒ có nguồn
    them('Q-CHUA', 'thi', 'CA2') // ca chưa công bố ⇒ chưa có nguồn (mồ côi tới khi công bố)
    them('Q-LB', 'len_bang', 'B1') // Lên bảng ⇒ có nguồn
    them('Q-LUYEN', 'luyen', 'L1') // luyện đề ⇒ mồ côi
    const r = await goiWorker(worker, d.env, '/gv/cau-sai-mo-coi', {}, true)
    expect(r.tong).toMatchObject({ cauSai: 4, moCoi: 2 })
  })

  it('học sinh không gọi được', async () => {
    const d = taoD1That()
    const r = await goiWorker(worker, d.env, '/gv/cau-sai-mo-coi', {})
    expect(r.ok).not.toBe(true)
  })
})
