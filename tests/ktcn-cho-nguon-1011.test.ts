// @vitest-environment node
// KIỂM TRA ÔN TẬP KHÔNG KẸT «CHỜ NGUỒN» VÔ HẠN (thầy 10/11: «Sửa luôn 54 bài kiểm tra ôn tập kẹt chờ nguồn»).
// Số thật 10/11 (workflow chỉ đọc do-ktcn-cho-nguon-1011): cả 54 bài là của MỘT lớp (lớp 10), kẹt từ 07/11; mục «thiếu» toàn dạng `kn:cau:<mã câu>` —
// câu của Bài 10, Bài 11 (giao 01/11) chưa có mã dạng nên mang vi kỹ năng MẶC ĐỊNH `cau:<mã câu>` (omni-q.ts `vknMacDinh`); luật lập đề đòi phủ hết mọi
// «kiến thức» trong 3 đề × 28 câu ⇒ hơn trăm «kiến thức một câu» không bao giờ phủ hết ⇒ đề luôn «chờ nguồn».
// Khoá: (1) kỹ năng mặc định không phải kiến thức phải phủ, câu ấy vẫn vào đề; (2) kiến thức thật nhiều hơn sức chứa 84 câu cũng không giữ bài;
// (3) thiếu nguồn THẬT (câu chưa có dòng ma trận) vẫn chờ như cũ; (4) lịch đang chờ nguồn tự chuyển thành lịch thật ở lượt lập lại.
import { afterEach, expect, it } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { damBaoKtCn } from '../server/src/kiem-tra-ca-nhan-schema'
import { lapKtCn, docKtCn, tomTatKt } from '../server/src/kiem-tra-ca-nhan'
import { KHUNG_KT_2026 } from '../server/src/kiem-tra-ca-nhan-ma-tran'
import { xoaMoiDem } from '../server/src/dem-chung'

const NOW = Date.parse('2026-11-10T05:00:00Z'), MA = 'DH-12-C3-B10' // khối 12 như em S1 (12A1) — câu khác khối bị cổng khối chặn
afterEach(() => { xoaMoiDem(); xoaDemPhamVi() })

/** Bài 140 câu (5 bộ đủ ma trận); `vkn(i, qid)` = vi kỹ năng ghi vào ma trận của câu thứ i (null ⇒ không có dòng ma trận). */
async function kho(vkn: (i: number, qid: string) => string[] | null) {
  const SO_BAN = 5
  const k = taoKhoOmni({ [MA]: 28 * SO_BAN }, 1)
  await damBaoBangBaiDaDay(k.env); await damBaoKtCn(k.env)
  k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{"bat":true}','x');
    INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('b','12A1','B10','Bài 10. Quy tắc octet',0,'["${MA}"]','2026-11-01');
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('${MA}','Bài 10. Quy tắc octet',${28 * SO_BAN},0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('${MA}','v1','x');`)
  let i = 0
  for (const phan of ['I', 'II', 'III'] as const) for (const mucDo of ['biet', 'hieu', 'van_dung'] as const) for (let j = 0; j < KHUNG_KT_2026[phan][mucDo] * SO_BAN; j++) {
    const qid = k.qids(MA)[i]!, old = JSON.parse(String(k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(qid)!.json))
    const q = { ...old, phan, mucDo: ({ biet: 'NB', hieu: 'TH', van_dung: 'VD' } as const)[mucDo], dang: null, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [], correct: phan === 'I' ? 'B' : phan === 'II' ? 'DSDS' : '4' }
    k.d.sql.prepare('UPDATE game_v2_question SET dang=NULL,json=? WHERE qid=?').run(JSON.stringify(q), qid)
    const v = vkn(i, qid)
    if (v) k.d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,-1,?,'mac_dinh','x')").run(qid, JSON.stringify(v))
    i++
  }
  return k
}
const lich = (k: Awaited<ReturnType<typeof kho>>) => k.d.sql.prepare("SELECT ngay,trang_thai,json FROM kiem_tra_ca_nhan WHERE sbd='S1' ORDER BY ngay").all() as { ngay: string; trang_thai: string; json: string }[]
const phan = (d: { cau: { q: { phan: string } }[] }) => ['I', 'II', 'III'].map((p) => d.cau.filter((c) => c.q.phan === p).length)

it('câu chưa có mã dạng (vi kỹ năng mặc định `cau:<mã câu>`): đề vẫn lập, đủ 28 câu 18/4/6, không «chờ nguồn»', async () => {
  const k = await kho((_, qid) => [`cau:${qid}`])
  await lapKtCn(k.env, 'S1', NOW)
  const ds = lich(k)
  expect(ds.length).toBeGreaterThan(0)
  expect(ds.every((r) => r.trang_thai === 'hen')).toBe(true)
  const d = JSON.parse(ds[0]!.json)
  expect(d.cau).toHaveLength(28)
  expect(phan(d)).toEqual([18, 4, 6])
  expect(d.thieu).toEqual([])
  expect(d.muc.some((m: { id: string }) => m.id.startsWith('kn:cau:'))).toBe(false) // kỹ năng mặc định không thành «kiến thức phải phủ»
  // em thấy lịch sắp đến như mọi bài kiểm tra; không báo thiếu phần nào. (`nguonDayDu` vẫn false vì bài chưa có kiến thức nào được gắn — nói đúng sự thật cho bảng của thầy.)
  expect(tomTatKt((await docKtCn(k.env, 'S1', NOW))!, NOW)).toMatchObject({ trangThai: 'sap_den', thieuNguon: 0, tong: 28, tongKienThuc: 0 })
})

it('kiến thức thật nhiều hơn sức chứa 3 đề × 28 câu: không giữ bài của em, phần chưa phủ để chu kỳ sau', async () => {
  const k = await kho((i) => [`muc:${i}`]) // 140 kiến thức, mỗi câu một kiến thức ⇒ 84 câu không phủ hết
  await lapKtCn(k.env, 'S1', NOW)
  const ds = lich(k)
  expect(ds).toHaveLength(3)
  expect(ds.every((r) => r.trang_thai === 'hen')).toBe(true)
  for (const r of ds) { const d = JSON.parse(r.json); expect(d.cau).toHaveLength(28); expect(phan(d)).toEqual([18, 4, 6]); expect(d.thieu).toEqual([]) }
  expect(JSON.parse(ds[0]!.json).phuChuKy).toBe(84) // phủ được 84 / 140 kiến thức trong chu kỳ này — nói đúng số, không tuyên bố đủ
})

it('thiếu nguồn THẬT (câu chưa có dòng ma trận nào) vẫn «chờ nguồn» như cũ', async () => {
  const k = await kho((i, qid) => (i === 0 ? null : [`cau:${qid}`]))
  await lapKtCn(k.env, 'S1', NOW)
  const ds = lich(k)
  expect(ds.every((r) => r.trang_thai === 'cho_nguon')).toBe(true)
  expect(JSON.parse(ds[0]!.json).thieu).toEqual([`ma_tran:${k.qids(MA)[0]}`])
})

it('lịch đang «chờ nguồn» của ngày chưa mở tự thành lịch thật ở lượt lập lại (không cần sửa dữ liệu bằng tay)', async () => {
  const k = await kho((_, qid) => [`cau:${qid}`])
  await lapKtCn(k.env, 'S1', NOW)
  const ngay = lich(k)[0]!.ngay
  k.d.sql.prepare("UPDATE kiem_tra_ca_nhan SET trang_thai='cho_nguon' WHERE sbd='S1'").run() // như dòng kẹt trên máy chủ thật
  xoaMoiDem()
  await lapKtCn(k.env, 'S1', NOW + 60_000)
  expect(lich(k).filter((r) => r.ngay === ngay).map((r) => r.trang_thai)).toEqual(['hen'])
})
