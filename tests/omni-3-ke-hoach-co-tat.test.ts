// @vitest-environment node
// OMNI 3 · làn A2 — CỜ OMNI TẮT ⇒ docHoSo2 / layKeHoachHomNay / sanh2 / chan-doan Y HỆT bản trước OMNI 3 (đặc tả mục 8 GĐ B, mục 9.9).
// Ảnh chụp sinh ngày 05/10 trên commit f189d2b (srs2-d1.ts CHƯA sửa) bằng đúng kịch bản `dungKichBanHaiChienDich` (tests/omni-3-ke-hoach-chung.ts):
// hai chiến dịch đang chạy + một chiến dịch đã đóng + lịch sử đủ loại. Cờ tắt ⇒ chỉ MỘT chiến dịch (giao gần nhất) như cũ, câu ngoài phạm vi vẫn vào nợ như cũ,
// HoSo2 không có khoá mới (chienDichHet / onBaiCu / omni), không ghi bảng phụ srs2_ke_hoach_omni.
// KHÔNG sinh lại ảnh chụp sau khi sửa lõi — đỏ ở đây nghĩa là hành vi khi cờ tắt đã đổi.
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { chanDoanEm, docHoSo2, layKeHoachHomNay, sanh2 } from '../server/src/srs2-d1'
import { omniBat } from '../server/src/omni-d1'
import { chupHoSo, dungKichBanHaiChienDich, HOM_NAY, lam, T_SANG } from './omni-3-ke-hoach-chung'

const bam = (s: string) => createHash('sha256').update(s).digest('hex')
const KY_VONG = {
  hoSoS1: '894ce9cdda6b781beeb5a018025939c331e3fba86cf4d616ab3677418015e6ec',
  sanhS1: '{"ok":true,"cheDo2":true,"ngay":"2026-10-05","sapBatDau":null,"chienDich":{"id":"CD2","ten":"Bài CD2","hanNop":"2026-10-09","D":5,"tong":10,"coXat":2,"thanhThao":0,"canDayLai":0,"thanhThaoTangTu":"2026-10-07"},"theLuc":{"con":18,"tong":18},"huyetChien":false,"doan":{"con":9},"dao":{"con":9},"khoaDao":true,"loiKhoaDao":"Có xe hàng đang bị phục kích, hãy hoàn thành Hộ Tống trước khi ra Đảo nhé!","ruong":{"daLam":0,"tong":18,"moDuoc":false,"daMo":false},"thuSucThem":{"duoc":false,"soCau":0},"chuoiNgay":4}',
  khS1: '{"ngay":"2026-10-05","chienDichId":"CD2","dao":["DH-B2-4","DH-B2-6","KHO-A-4","DH-B2-3","DH-B2-8","DH-B2-2","DH-B2-9","DH-B2-7","DH-B2-5"],"doan":["KHO-A-1","KHO-A-0","DH-B3-0","DH-B2-0","DH-B1-3","DH-B1-1","DH-B0-1","DH-B3-1","DH-B1-0"],"huyetChien":false,"tong":18,"conDao":["DH-B2-4","DH-B2-6","KHO-A-4","DH-B2-3","DH-B2-8","DH-B2-2","DH-B2-9","DH-B2-7","DH-B2-5"],"conDoan":["KHO-A-1","KHO-A-0","DH-B3-0","DH-B2-0","DH-B1-3","DH-B1-1","DH-B0-1","DH-B3-1","DH-B1-0"]}',
  sanhS1Lan2: '{"ok":true,"cheDo2":true,"ngay":"2026-10-05","sapBatDau":null,"chienDich":{"id":"CD2","ten":"Bài CD2","hanNop":"2026-10-09","D":5,"tong":10,"coXat":3,"thanhThao":1,"canDayLai":0,"thanhThaoTangTu":null},"theLuc":{"con":16,"tong":18},"huyetChien":false,"doan":{"con":8},"dao":{"con":8},"khoaDao":true,"loiKhoaDao":"Có xe hàng đang bị phục kích, hãy hoàn thành Hộ Tống trước khi ra Đảo nhé!","ruong":{"daLam":2,"tong":18,"moDuoc":false,"daMo":false},"thuSucThem":{"duoc":false,"soCau":0},"chuoiNgay":5}',
  hoSoS1Lan2: '61ce974855f77c4f410f00cdabf914aa297b2b0156bb77e231c25c155108cc73',
  sanhS2: '{"ok":true,"cheDo2":true,"ngay":"2026-10-05","sapBatDau":null,"chienDich":{"id":"CD1","ten":"Bài CD1","hanNop":"2026-10-07","D":3,"tong":12,"coXat":0,"thanhThao":0,"canDayLai":0,"thanhThaoTangTu":null},"theLuc":{"con":12,"tong":12},"huyetChien":false,"doan":{"con":0},"dao":{"con":12},"khoaDao":false,"ruong":{"daLam":0,"tong":12,"moDuoc":false,"daMo":false},"thuSucThem":{"duoc":false,"soCau":0},"chuoiNgay":0}',
  chanDoanS1: '{"ok":true,"ngay":"2026-10-05","sbd":"S1","coHoa2":true,"chienDichCuaEm":[{"id":"CD2","ten":"Bài CD2","trangThai":"dang_chay","hanNop":"2026-10-09","batDau":"2026-10-03","soCau":10},{"id":"CD1","ten":"Bài CD1","trangThai":"dang_chay","hanNop":"2026-10-07","batDau":"2026-10-01","soCau":13},{"id":"CD0","ten":"Bài CD0","trangThai":"da_dong","hanNop":"2026-09-28","batDau":"2026-09-21","soCau":14}],"chienDichDangChay":{"id":"CD2","hanNop":"2026-10-09","theLucNgay":30,"soQid":10,"raiDeu":false,"raiDeuMacDinh":false},"soMetaTimThay":39,"soCauTuLuanBiBo":1,"soCauTrongHoSo":21,"soCauChienDich":10,"soCauMoi":7,"keHoachDaChot":{"chienDichId":"CD2","tong":18,"taoLuc":"2026-10-05T02:00:00.000Z","loi":null},"lapLaiSeRa":{"dao":8,"doan":8,"huyetChien":false,"raiDeu":false},"hangTheoDang":{"DH-B2.D0":"L2","DH-B2.D1":"L3","DH-B2.D2":"L2"},"hangChung":"L2"}',
}

describe('OMNI 3 · cờ tắt ⇒ hồ sơ, kế hoạch, Sảnh y hệt bản cũ', () => {
  it('hai chiến dịch đang chạy: chỉ chiến dịch giao gần nhất, nguồn cũ cho chiến dịch kia; kế hoạch + Sảnh + chẩn đoán khớp từng ký tự', async () => {
    const { d, env } = await dungKichBanHaiChienDich()
    expect(await omniBat(env, 'S1')).toBe(false)
    const hs = await docHoSo2(env, 'S1', HOM_NAY)
    expect(hs.chienDich?.id).toBe('CD2')
    expect('omni' in hs || 'chienDichHet' in hs || 'onBaiCu' in hs).toBe(false)
    expect(hs.cau.some((c) => 'cd' in c)).toBe(false)
    // câu bài 3 (chưa tick) và câu TU LUYỆN vẫn vào nợ như cũ khi cờ tắt
    expect(hs.cau.map((c) => c.qid)).toEqual(expect.arrayContaining(['DH-B3-0', 'DH-B3-1', 'KHO-A-4']))
    expect(bam(chupHoSo(hs))).toBe(KY_VONG.hoSoS1)
    expect(JSON.stringify(await sanh2(env, 'S1', T_SANG))).toBe(KY_VONG.sanhS1)
    const { kh } = await layKeHoachHomNay(env, 'S1', T_SANG + 1000)
    expect(JSON.stringify(kh)).toBe(KY_VONG.khS1)
    const q1 = kh.dao[0]!.replace(/#\d+$/, ''), q2 = (kh.doan[0] ?? kh.dao[1]!).replace(/#\d+$/, '')
    await lam(env, 'S1', q1, T_SANG + 60_000, true)
    await lam(env, 'S1', q2, T_SANG + 120_000, false)
    expect(JSON.stringify(await sanh2(env, 'S1', T_SANG + 180_000))).toBe(KY_VONG.sanhS1Lan2)
    expect(bam(chupHoSo(await docHoSo2(env, 'S1', HOM_NAY)))).toBe(KY_VONG.hoSoS1Lan2)
    expect(JSON.stringify(await sanh2(env, 'S2', T_SANG + 200_000))).toBe(KY_VONG.sanhS2)
    expect(JSON.stringify(await chanDoanEm(env, 'S1', T_SANG + 240_000))).toBe(KY_VONG.chanDoanS1)
    // không đụng bảng phụ OMNI
    expect(Number((d.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name = 'srs2_ke_hoach_omni'").get() as { n: number }).n)).toBe(0)
  })
})
