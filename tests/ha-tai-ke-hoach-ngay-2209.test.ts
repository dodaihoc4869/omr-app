// @vitest-environment node
// HẠ TẢI D1 · `lapVaLuuKeHoach` (Boss 22/09, M3, lệnh: gom SELECT còn lại của kế hoạch ngày). Đo SỐ TRUY VẤN D1 thật
// CHO ĐÚNG PHẦN đã sửa (`docDauVao`/`lapVaLuuKeHoach`/`dungLaiHoSo` — KHÔNG qua route `/hs/ke-hoach-ngay` đầy đủ, vì
// route còn gọi EXP/doanMo/veDich/lời HLV/cảnh báo thầy — những phần KHÔNG đổi trong đợt này) cho LƯỢT NÓNG (em vừa có
// sự kiện mới — sổ đổi, hồ sơ phải dựng lại; ca THƯỜNG GẶP nhất khi em vừa nộp bài) trên một bộ dữ liệu có đủ thứ tốn
// truy vấn: câu tới hạn ôn, BTVN chưa nộp, bài Mẹ giao chưa nộp, ca thi sắp tới. KHÔNG kiểm đúng số cứng dễ vỡ theo
// lược đồ — kiểm biên trên (đo được 24 cho kịch bản dưới) và MỘT phép so sánh mutation: hồ sơ đã khớp sổ (không còn
// "sổ đổi") thì lượt SAU phải rẻ hơn lượt ĐẦU rõ rệt (chứng minh chỗ hạ tải thật sự được dùng, không phải test khớp số
// ngẫu nhiên). Số 57–62 Boss/Code 1 đo là cho CẢ route `/hs/ke-hoach-ngay` (gồm cả EXP/doanMo/veDich…, ngoài phạm vi
// đợt này); 24 ở đây là RIÊNG phần đã sửa — không so trực tiếp được hai con số.
import { describe, expect, it } from 'vitest'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { taoD1That, type D1That } from './_d1-that'

const H = 3_600_000
const D = 24 * H
const iso = (ms: number) => new Date(ms).toISOString()

function dem(d: D1That): () => number {
  let n = 0
  const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => { n++; return goc(q) }) as typeof d.env.DB.prepare
  return () => n
}

/** Em có: 2 câu tới hạn ôn (sai 5 ngày trước), 1 BTVN chưa nộp, 1 bài Mẹ giao chưa nộp, 1 ca thi sắp tới (câu ôn thi ứng viên). */
async function truong(): Promise<D1That> {
  const d = taoD1That()
  d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Em S1','12','x')").run()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',3,'kho/DE1.json',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  for (const q of ['DE1-I-1', 'DE1-I-2', 'DE1-I-3']) {
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
      .run('DE1', q, 'v1', `g-${q}`, 'ES.A.X', JSON.stringify({ qid: q, maDe: 'DE1', phan: 'I', text: 'Đề', choices: ['A', 'B'], ideas: [], correct: 'A', sao: 1 }))
  }
  d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES('BT1','CA0','DE1',3,?,?,0,'x')").run(iso(Date.now() - 2 * D), iso(Date.now() + 3 * D))
  d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,thu_hoi) VALUES('BT1|S1','BT1','S1',0)").run()
  d.sql.prepare("INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,started_at,submitted_at) VALUES('S1','M1','Bài Mẹ giao',?,5,'k',NULL,NULL)").run(iso(Date.now() - D))
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cong_bo,bank_r2,loai,lop,thoi_gian_phut,bat_dau,het_han_vao,cap_nhat_luc) VALUES('CA1','Ca 1','mo','ca_lop_xong','de/CA1.json','thi','12',45,?,?,'x')")
    .run(iso(Date.now() + 20 * H), iso(Date.now() + 22 * H))
  d.objects.set('de/CA1.json', { phanI: [{ id: 'BV1', text: 'Đề bảo vệ', choices: ['A', 'B'], correct: 'A', dang: { ma: 'ES.A.X', ten: 'Dạng' }, mucDo: 'biet', kienThuc: [] }] })
  await ghiSuKien(d.env, ['DE1-I-1', 'DE1-I-2', 'DE1-I-3'].map((q, i) => ({ nguon: 'btvn' as const, maNguon: 'B0', sbd: 'S1', qid: q, lan: i + 1, ketQua: 0 as const, luc: iso(Date.now() - 5 * D) })))
  return d
}

describe('lapVaLuuKeHoach · lượt nóng (sổ vừa đổi) · số truy vấn D1', () => {
  it('≤ 25 truy vấn (đo được 24/22/09, kịch bản đủ mọi loại việc), kế hoạch vẫn đúng (câu tới hạn, BTVN, mom đều có mặt)', async () => {
    const d = await truong()
    const soDem = dem(d)
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], Date.now())).get('S1')!
    const viec = kh.viec as { loai: string; nguon?: string }[]
    // Việc BTVN + Mom + (hồ sơ vừa dựng từ 3 câu sai) đều có mặt — kế hoạch KHÔNG rỗng, không chỉ chạy xong suông.
    expect(viec.some((v) => v.loai === 'btvn_lo')).toBe(true)
    expect(viec.some((v) => v.loai === 'mom')).toBe(true)
    expect(viec.some((v) => v.nguon === 'ho_so')).toBe(true) // câu vừa sai vào việc ôn (than_thu, dạng ES.A.X)
    const n = soDem()
    expect(n).toBeLessThanOrEqual(25)
    expect(n).toBeGreaterThan(0)
  })

  it('mutation: hồ sơ ĐÃ dựng sẵn trước (không còn "sổ đổi") ⇒ lượt sau vẫn rẻ hơn nhiều so với lượt đầu (tái dùng có tác dụng)', async () => {
    const d = await truong()
    await dungLaiHoSo(d.env, ['S1'], new Date().toISOString())
    const soDem1 = dem(d)
    await lapVaLuuKeHoach(d.env, ['S1'], Date.now())
    const n1 = soDem1()
    // Lượt kế (sổ không đổi nữa, hồ sơ đã khớp `so_su_kien`) ⇒ KHÔNG dựng lại hồ sơ ⇒ càng ít truy vấn hơn.
    const soDem2 = dem(d)
    await lapVaLuuKeHoach(d.env, ['S1'], Date.now())
    const n2 = soDem2()
    expect(n2).toBeLessThan(n1)
  })
})
