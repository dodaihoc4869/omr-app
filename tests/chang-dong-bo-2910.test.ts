// @vitest-environment node
// CHẶNG ĐỒNG BỘ (thầy 29/10, ảnh Lộ trình «2/4 chặng» + «Học tiếp» vòng gần đầy: «Phần học tiếp ở dưới chưa làm câu nào thanh đã báo rồi»; «Chưa thông báo hoàn thành chặng trên
// thoát ra thấy đang làm dở chặng dưới rồi»). Đọc D1 thật của tài khoản thử: 3 chặng × 6 câu = 18 câu đã trả lời, nhưng «đã làm hôm nay» = 17 vì (a) 2 câu LÀM LẠI cuối chặng bị CỘNG
// (hỗ trợ, thêm sau 6 câu) và (b) 3 câu LƯỚT OMNI KHÔNG được cộng ⇒ ranh chặng lệch, chặng sau hiện «đã làm dở». Khoá: MỘT chặng = 6 câu em ĐÃ TRẢ LỜI trong chặng —
//  · câu làm lại cuối chặng (sổ `raw.ll = 1`) KHÔNG tính vào mức hôm nay (nhưng vẫn là «câu vừa làm»: không phát lại);
//  · câu lướt TÍNH (đã phát + đã trả lời; chỉ không tính đúng / sai); chẩn đoán vẫn không;
//  · Lộ trình, ô đếm, lịch ngày, chuỗi «đủ mức» ra CÙNG một số.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { demHomNay7, dongBoGoi7, lapGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { ngayBaiCuaMotEm } from '../server/src/bai-hang-ngay'
import { docNhatKyChuoi } from '../server/src/chuoi-ngay-bai-d1'
import { rawLamLai } from '../server/src/lam-lai-so'

const NOW = Date.parse('2026-10-29T13:10:00Z') // 20:10 giờ VN
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe() })

async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 60 }, 2)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL;
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8',60,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8', 8, '["DH-B8"]', '2026-10-28T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1', 'S2'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return k
}
const dong = (q: string, o: { purpose?: string; ketQua?: 0 | 1 | null; assistance?: 'none' | 'assisted'; raw?: unknown } = {}) => ({
  nguon: 'game', maNguon: 'phien-1', sbd: 'S1', qid: q, lan: 1, ketQua: o.ketQua === undefined ? 1 : o.ketQua, luc: new Date(NOW - 60_000).toISOString(), maDang: '', chuyenDe: '', mucDo: '',
  attemptId: `phien-1|${q}`, assistance: o.assistance ?? 'none', purpose: o.purpose ?? 'maintenance', receivedAt: NOW - 60_000, cauVersion: 'v1', ...(o.raw ? { raw: o.raw } : {}),
})

it('6 câu chặng (1 lướt) + 2 câu làm lại cuối chặng ⇒ ĐÃ LÀM = 6 (không 7, không 5): Lộ trình, ô đếm, lịch ngày, chuỗi cùng số; câu làm lại vẫn không phát lại', async () => {
  const k = await kho()
  const lap0 = (await lapGoi7(k.env, 'S1', NOW))!
  const ke = lap0.plan.viec.map((v) => v.qid)
  const chang = ke.slice(0, 6), lamLai = ke.slice(6, 8)
  const ll = rawLamLai({ lamLaiCuoi: true } as never, 'I')
  expect(ll).toMatchObject({ ll: 1 })
  await ghiSuKien(k.env, [
    ...chang.map((q, i) => dong(q, i === 0 ? { purpose: 'luot', ketQua: null } : {})),
    ...lamLai.map((q) => dong(q, { assistance: 'assisted', raw: ll })),
  ] as never)
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.daLamNgay).toBe(6)
  expect((await demHomNay7(k.env, 'S1', NOW)).daLamHomNay).toBe(6)
  expect((await ngayBaiCuaMotEm(k.env, 'S1', '2026-10-29', '2026-10-29', '2026-10-29'))?.map((n) => n.daLam)).toEqual([6])
  const nk = await docNhatKyChuoi(k.env, 'S1', NOW)
  expect(nk.soCau7.get('2026-10-29')).toBe(6)
  // câu làm lại KHÔNG tính nhưng vẫn nằm trong tập «đã làm hôm nay» để kế hoạch không phát lại câu em vừa làm
  for (const q of lamLai) expect(lap.daLamTap.has(q)).toBe(true)
  expect(lap.plan.viec.filter((v) => [...chang, ...lamLai].includes(v.qid))).toEqual([])
})

it('lượt vừa trả lời mà sổ chưa kịp ghi: câu làm lại (có hỗ trợ) không cộng; câu thường cộng', async () => {
  const k = await kho()
  const ke = (await lapGoi7(k.env, 'S1', NOW))!.plan.viec.map((v) => v.qid)
  const st = k.d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
  const luc = new Date(NOW - 30_000).toISOString()
  st.run('p|a', 'S1', 'p', ke[0]!, `g-${ke[0]}`, JSON.stringify({ attempt: { assisted: false } }), luc)
  st.run('p|b', 'S1', 'p', ke[1]!, `g-${ke[1]}`, JSON.stringify({ attempt: { assisted: true } }), luc) // làm lại cuối chặng luôn có hỗ trợ
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.daLamNgay).toBe(1)
  expect(lap.daLamTap.has(ke[1]!)).toBe(true)
})
