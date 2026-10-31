// @vitest-environment node
// KHO CÂU LUYỆN TỰ CẬP NHẬT (01/11 — thầy: «Bài 10 Quy tắc octet 63 câu mà Câu rút được 0»). Gốc lỗi: chỉ mục `game_v2_question` chỉ được lập khi em mở Đảo
// (`sync`); Đảo gỡ 27/10 ⇒ tờ nạp sau đó không bao giờ vào kho câu ⇒ «Bổ sung bài hôm nay» rút 0 câu. Khoá:
//   · `dongBoKhoLech` (cron mỗi phút): lập tờ lệch, tờ MỚI trước; tờ nguồn R2 hỏng bị BỎ QUA (không kẹt), tờ sau vẫn lập; đủ trần thì dừng;
//   · `/gv/bai-da-day xem-truoc`: tờ của bài chưa vào kho ⇒ lập ngay rồi đếm ⇒ «Câu rút được» = số câu thật của tờ (bỏ câu chưa duyệt);
//   · `tick`: giao được bài vừa nạp (chiến dịch có đủ câu).
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { dongBoKhoLech } from '../server/src/game-v2-bank'
import { gvBaiDaDay } from '../server/src/bai-da-day'

const T0 = Date.parse('2026-11-01T07:00:00+07:00')
const LOP = '10'
const MA = 'DH-10-C3-B10'
const DANG = { ma: 'LK.A.X', ten: 'Dạng X' }
/** Gói kho dạng `cau` (như tờ thầy nạp): `nI` câu Phần I, `nII` Phần II, `nIII` Phần III (đáp số). */
const goi = (ma: string, nI: number, nII: number, nIII: number) => ({
  ma_de: ma,
  cau: [
    ...Array.from({ length: nI }, (_, i) => ({ phan: 'I', so: i + 1, de: `${ma} câu I.${i + 1} octet`, pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'B', dang: DANG, chuyen_de: 'Liên kết', muc_do: 'biet' })),
    ...Array.from({ length: nII }, (_, i) => ({ phan: 'II', so: i + 1, de: `${ma} câu II.${i + 1}`, y: { a: 'ý a', b: 'ý b', c: 'ý c', d: 'ý d' }, dap_an: 'DSDS', dang: DANG, chuyen_de: 'Liên kết', muc_do: 'hieu' })),
    ...Array.from({ length: nIII }, (_, i) => ({ phan: 'III', so: i + 1, de: `${ma} câu III.${i + 1}: số electron lớp ngoài cùng?`, dap_an: String(8 - i), dang: DANG, chuyen_de: 'Liên kết', muc_do: 'van_dung' })),
  ],
})
function themTo(d: D1That, ma: string, capNhat: string, nguon: unknown | null): void {
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'10',0,?,0,?)").run(ma, ma, `kho/${ma}.json`, capNhat)
  if (nguon) d.objects.set(`kho/${ma}.json`, nguon)
}
const soCauTrongKho = (d: D1That, ma: string) => (d.sql.prepare('SELECT COUNT(*) n FROM game_v2_question WHERE ma_de = ?').get(ma) as { n: number }).n

describe('kho câu luyện tự cập nhật', () => {
  it('cron: tờ mới trước; tờ nguồn hỏng bị bỏ qua (không kẹt); dừng ở trần; không tờ lệch ⇒ không làm gì', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    themTo(d, 'AA-HONG', '2026-10-24T06:00:00.000Z', null) // mã đứng đầu theo chữ, nguồn R2 không có ⇒ trước đây kẹt mãi ở đây
    themTo(d, MA, '2026-10-24T06:51:16.695Z', goi(MA, 4, 2, 2))
    themTo(d, 'DH-10-C3-B11', '2026-10-24T06:51:21.664Z', goi('DH-10-C3-B11', 3, 0, 0))
    const r1 = await dongBoKhoLech(env, 1)
    expect(r1).toEqual({ lap: 1, loi: 0, conLai: 2 })
    expect(soCauTrongKho(d, 'DH-10-C3-B11')).toBe(3) // tờ sửa/nạp MỚI NHẤT trước
    const r2 = await dongBoKhoLech(env, 6)
    expect(r2).toEqual({ lap: 1, loi: 1, conLai: 1 })
    expect(soCauTrongKho(d, MA)).toBe(8)
    expect(d.sql.prepare('SELECT source_version FROM game_v2_index WHERE ma_de = ?').get(MA)).toEqual({ source_version: '2026-10-24T06:51:16.695Z' })
    // thầy sửa tờ (cap_nhat_luc đổi) ⇒ lệch lại ⇒ lập lại
    d.sql.prepare('UPDATE de_kho SET cap_nhat_luc = ? WHERE ma_de = ?').run('2026-11-01T00:00:00.000Z', MA)
    d.objects.set(`kho/${MA}.json`, goi(MA, 5, 2, 2))
    expect((await dongBoKhoLech(env, 6)).lap).toBe(1)
    expect(soCauTrongKho(d, MA)).toBe(9)
    d.objects.set('kho/AA-HONG.json', goi('AA-HONG', 1, 0, 0))
    expect(await dongBoKhoLech(env, 6)).toEqual({ lap: 1, loi: 0, conLai: 0 })
    expect(await dongBoKhoLech(env, 6)).toEqual({ lap: 0, loi: 0, conLai: 0 })
  })

  it('«Bổ sung bài hôm nay»: tờ của bài chưa vào kho ⇒ xem-truoc tự lập rồi đếm đúng; tick giao được', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    for (const [s, ten] of [['S1', 'An'], ['S2', 'Bảo']]) d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,?,?)').run(s, ten, '10', LOP, null, 'x')
    themTo(d, MA, '2026-10-24T06:51:16.695Z', goi(MA, 6, 2, 3))
    expect(soCauTrongKho(d, MA)).toBe(0)
    const than = { lop: LOP, khoaBai: MA, tenBai: 'Bài 10. Quy tắc octet', viTri: 10, maDe: [`${MA}-TN`, `${MA}-DS`, `${MA}-TLN`] }
    const xem = await gvBaiDaDay(env, { action: 'xem-truoc', ...than }, T0)
    expect(xem.ok).toBe(true)
    expect(xem.soCau).toBe(11) // 6 + 2 + 3 (trước khi sửa: 0)
    const giao = await gvBaiDaDay(env, { action: 'tick', ...than }, T0)
    expect(giao).toMatchObject({ ok: true, daCo: false })
    const cd = d.sql.prepare('SELECT qid_json FROM chien_dich WHERE id = ?').get(String(giao.chienDichId)) as { qid_json: string }
    expect(JSON.parse(cd.qid_json)).toHaveLength(11)
  })
})
