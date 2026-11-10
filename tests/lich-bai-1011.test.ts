// @vitest-environment node
// LỊCH BÀI (khối B, bản vẽ docs/ban-ve-moi-on-sua-0911 dt-sang-1; thầy 10/11 «Làm nốt mấy việc còn lại đi đẩy hết lên bản sống»).
// Khoá: ngày đã qua / hôm nay = loại ĐÃ CHỐT; ngày tới = dự kiến bằng CHÍNH luật đang chạy (`chonLoaiNgay7`, `ngayKtTheoBai`) — ngày mai dự kiến phải trùng
// đúng loại mà luật sẽ chọn với cùng số liệu; ngày Kiểm tra ôn tập đã lập lấy theo lịch thật (mã gói); không đánh dấu «xong» ngày cũ; đọc CÙNG câu mức/loại (0 lệnh D1 thêm).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { duKienLichBai7 } from '../server/src/goi-bai-7-lich-bai'
import { chonLoaiNgay7, congNgay7, SO_LOI_NGAY_SUA } from '../server/src/goi-bai-7-loi'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7, tomTatGoi7 } from '../server/src/goi-bai-7'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { SQL_KT_CN } from '../server/src/kiem-tra-ca-nhan-schema'

const GOI = { id: 'g7:a', ten: 'Bài 8. Amine', batDau: '2026-11-08', han: '2026-11-17', conMoi: 60 }
const co = { homNay: '2026-11-10', goi: GOI, daChot: new Map([['2026-11-08', 'moi'], ['2026-11-09', 'moi']] as const), loaiHomNay: 'sua' as const, truoc: ['moi', 'moi'],
  soMoiCon: 60, soSua: 20, moiHomNay: 0 }

describe('duKienLichBai7 (thuần)', () => {
  it('ngày qua + hôm nay theo loại đã chốt; ngày tới theo đúng luật; Kiểm tra ôn tập muộn nhất hạn − 2 khi còn câu mới', () => {
    const l = duKienLichBai7(co)!
    expect(l.ngay.map(x => x.ngay)).toEqual(['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17'])
    expect(l.ngay.slice(0, 3).map(x => x.loai)).toEqual(['moi', 'moi', 'sua'])
    // ngày mai = đúng loại luật chọn với cùng số liệu (truoc = [hôm nay, …], câu mới còn sau kế hoạch hôm nay)
    expect(l.ngay[3]!.loai).toBe(chonLoaiNgay7({ ngay: '2026-11-11', truoc: ['sua', 'moi', 'moi'], soSua: 20, soMoiCon: 60 }))
    // 60 câu mới: Mới 11 (28) · Mới 12 (28) · Sửa 13 (hai Mới liền + ≥ 12 lỗi) · Mới 14 (4 câu cuối) ⇒ hết câu mới ⇒ Kiểm tra ôn tập ngày 15 · sau đó còn lỗi ⇒ Sửa
    expect(l.ngay.slice(3).map(x => x.loai)).toEqual(['moi', 'moi', 'sua', 'moi', 'kiem', 'sua', 'sua'])
    expect(l).toMatchObject({ goiId: 'g7:a', ten: 'Bài 8. Amine', han: '2026-11-17' })
  })
  it('còn nhiều câu mới ⇒ Kiểm tra ôn tập đúng hạn − 2; lịch Kiểm tra đã lập ⇒ lấy ngày thật, không dự kiến thêm', () => {
    const nhieu = duKienLichBai7({ ...co, goi: { ...GOI, conMoi: 400 }, soMoiCon: 400 })!
    expect(nhieu.ngay.filter(x => x.loai === 'kiem').map(x => x.ngay)).toEqual([congNgay7(GOI.han, -2)])
    const daLap = duKienLichBai7({ ...co, goi: { ...GOI, conMoi: 400 }, soMoiCon: 400, ktDaCo: ['2026-11-12'] })!
    expect(daLap.ngay.filter(x => x.loai === 'kiem').map(x => x.ngay)).toEqual(['2026-11-12'])
  })
  it('ít lỗi ⇒ còn câu mới thì không chen ngày Sửa, hết câu mới ⇒ Kiểm tra ngày mai rồi Sửa; hết hạn ⇒ null; ngày chưa chốt loại ⇒ «dự phòng», không «xong»', () => {
    const it = duKienLichBai7({ ...co, soSua: SO_LOI_NGAY_SUA - 1, loaiHomNay: 'moi' })!
    expect(it.ngay.slice(3).map(x => x.loai)).toEqual(['moi', 'moi', 'moi', 'kiem', 'sua', 'sua', 'sua'])
    expect(duKienLichBai7({ ...co, homNay: '2026-11-18' })).toBeNull()
    const thieu = duKienLichBai7({ ...co, daChot: new Map() })!
    expect(thieu.ngay.slice(0, 2).map(x => x.loai)).toEqual(['du', 'du'])
    expect(JSON.stringify(thieu)).not.toMatch(/xong/)
  })
})

const NOW = Date.parse('2026-11-10T02:00:00Z'), NGAY_MS = 86_400_000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe() })

describe('lapGoi7 gửi lichBai', () => {
  it('tóm tắt Gói 7 mang lịch bài đang học; ngày Kiểm tra ôn tập đã lập (mã gói trong json) hiện đúng ngày', async () => {
    const k = taoKhoOmni({ 'DH-B8': 127 })
    for (const q of SQL_KT_CN) k.d.sql.exec(q)
    await damBaoBangBaiDaDay(k.env)
    k.d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',127,0,'v1');INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
      INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-11-05"}','x')`)
    k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
      .run('amine', '12A1', 'B8', 'Bài 8. Amine', 8, '["DH-B8-TN","DH-B8-DS","DH-B8-TLN"]', '2026-11-07T11:00:00Z')
    themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
    await dongBoGoi7(k.env, NOW - 2 * NGAY_MS)
    const lap = (await lapGoi7(k.env, 'S1', NOW))!
    const lich = tomTatGoi7(lap, NOW).lichBai!
    expect(lich).toBeTruthy()
    const nay = lich.ngay.find(x => x.ngay === '2026-11-10')!
    expect(nay.loai).toBe(lap.loaiNgay)
    expect(lich.ngay[lich.ngay.length - 1]!.ngay).toBe(lich.han)
    // lịch Kiểm tra ôn tập đã lập cho gói này ⇒ đúng ngày ấy là «kiem»
    const goiId = lich.goiId, ngayKt = congNgay7('2026-11-10', 2)
    k.d.sql.prepare('INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?)')
      .run('kt1', 'S1', '12A1', ngayKt, 0, 0, 'can_lam', JSON.stringify({ goiId, cau: [] }), 0)
    const lap2 = (await lapGoi7(k.env, 'S1', NOW + 60_000))!
    expect(tomTatGoi7(lap2, NOW).lichBai!.ngay.find(x => x.ngay === ngayKt)!.loai).toBe('kiem')
  })
})
