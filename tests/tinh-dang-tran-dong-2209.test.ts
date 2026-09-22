// @vitest-environment node
// HẠ TẢI D1 (Boss 22/09, lượt 2): `tinhDang` (game-v2-luot.ts, dùng bởi `docDangLop`) đọc `chi_tiet_cau` KHÔNG mốc thời gian trước đây — Code 1 đo 268.796
// dòng/200 lượt, tệ nhất 191k một lượt (docs/do-tai-d1/ban-tai-348a09f-am.md dòng 79). Chặn bằng LIMIT theo ca GẦN NHẤT trước (TRAN_DONG_TINH_DANG).
// SQLite thật (tests/_d1-that.ts) — dựng đủ TRAN_DONG_TINH_DANG dòng NEW + 1 dòng OLD để chứng minh biên cắt thật, không đoán.
import { describe, it, expect } from 'vitest'
import { docDangLop, TRAN_DONG_TINH_DANG } from '../server/src/game-v2-luot'
import { taoD1That, type D1That } from './_d1-that'

function dungCa(d: D1That, maCa: string, batDau: string) {
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,cap_nhat_luc) VALUES(?,?,'dong',?,'x')").run(maCa, maCa, batDau)
}
function dungCauHoi(d: D1That, qid: string, dang: string) {
  d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('DE1',?,'v1',?,?,'{}')").run(qid, `g-${qid}`, dang)
}
/** `n` dòng `chi_tiet_cau` PHÂN BIỆT (PK khoa khác nhau qua `so_cau`) cùng trỏ về MỘT ca/qid — đủ để LIMIT đếm đúng số dòng, không cần n câu/ca thật. */
function dungChiTiet(d: D1That, maCa: string, qid: string, sbd: string, n: number) {
  const st = d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,cap_nhat_luc) VALUES(?,?,?,1,'I',?,?,'x')")
  for (let i = 0; i < n; i++) st.run(`${maCa}|${sbd}|1|I|${i}`, maCa, sbd, i, qid)
}

describe('tinhDang (qua docDangLop) chặn dòng chi_tiet_cau bằng TRAN_DONG_TINH_DANG', () => {
  it('em KHÔNG có lớp (đường rieng thuần) — dạng của ca CŨ vẫn thấy khi tổng dòng ≤ trần', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S1','Em Một','x')").run() // không có `lop` ⇒ docDangLop trả thẳng `rieng`
    dungCa(d, 'CA-OLD', '2020-01-01T00:00:00.000Z')
    dungCauHoi(d, 'Q-OLD', 'OLD.1')
    dungChiTiet(d, 'CA-OLD', 'Q-OLD', 'S1', 1)
    expect(await docDangLop(d.env, 'S1', Date.now())).toEqual(['OLD.1'])
  })

  it('tổng dòng VƯỢT trần: dạng của ca CŨ NHẤT bị cắt, dạng của ca MỚI vẫn còn — đúng ranh giới TRAN_DONG_TINH_DANG', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S1','Em Một','x')").run()
    dungCa(d, 'CA-OLD', '2020-01-01T00:00:00.000Z') // xa xưa nhất — phải bị cắt
    dungCauHoi(d, 'Q-OLD', 'OLD.1')
    dungChiTiet(d, 'CA-OLD', 'Q-OLD', 'S1', 1)
    dungCa(d, 'CA-NEW', '2026-09-20T00:00:00.000Z') // gần nhất — chiếm hết trần, đẩy CA-OLD ra ngoài
    dungCauHoi(d, 'Q-NEW', 'NEW.1')
    dungChiTiet(d, 'CA-NEW', 'Q-NEW', 'S1', TRAN_DONG_TINH_DANG) // đúng bằng trần ⇒ cùng 1 dòng OLD vượt trần, bị cắt
    expect(await docDangLop(d.env, 'S1', Date.now())).toEqual(['NEW.1'])
  })

  it('NHIỀU EM cùng lớp (đường tinhDangLop, Code 1 soát 22/09): trần áp theo TỪNG EM — em ÍT hoạt động không bị em NHIỀU hoạt động trong lớp lấn trần', async () => {
    const d = taoD1That()
    // S1: hoạt động dày (đúng bằng trần, dạng HEAVY.1). S2 CÙNG LỚP: chỉ 1 dòng CŨ (dạng RARE.1) — nếu trần áp gộp cả lớp, dòng của S2 sẽ bị dòng của S1 (mới hơn, đông hơn) đẩy hẳn ra ngoài.
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Em Một','12A','x'),('S2','Em Hai','12A','x')").run()
    dungCa(d, 'CA-HEAVY', '2026-09-20T00:00:00.000Z')
    dungCauHoi(d, 'Q-HEAVY', 'HEAVY.1')
    dungChiTiet(d, 'CA-HEAVY', 'Q-HEAVY', 'S1', TRAN_DONG_TINH_DANG)
    dungCa(d, 'CA-RARE', '2020-01-01T00:00:00.000Z') // cũ hơn nhiều, nhưng là CỦA S2 — phải xét RIÊNG với trần của S2, không cộng chung với dòng của S1
    dungCauHoi(d, 'Q-RARE', 'RARE.1')
    dungChiTiet(d, 'CA-RARE', 'Q-RARE', 'S2', 1)
    // docDangLop('S1') lần đầu ⇒ đệm lop_da_hoc trống ⇒ tính lại cả lớp (tinhDangLop, dsSbd = ['S1','S2']).
    expect(await docDangLop(d.env, 'S1', Date.now())).toEqual(['HEAVY.1', 'RARE.1'])
  })
})
