// @vitest-environment node
// LOẠI NGÀY — khối B đợt 1 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911: «duyệt, build và đẩy lên bản sống luôn»).
// Khoá: từ 10/11 mỗi em mỗi ngày là NGÀY HỌC MỚI (28 câu mới, đúng ma trận) hoặc NGÀY SỬA LỖI (câu sai trước, không giới hạn ⅓; thiếu thì ôn / mới cho đủ 28);
// «2 ngày Mới chen 1 ngày Sửa» khi có ≥ 12 câu sai chờ sửa; chốt MỘT lần mỗi ngày (bảng goi_bai_7_loai_ngay, cùng lô dòng mức 28); ngày trước mốc giữ nguyên.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7, tomTatGoi7 } from '../server/src/goi-bai-7'
import { chonLoaiNgay7, chonGoi7, NGAY_LOAI_NGAY, SO_LOI_NGAY_SUA, type CauGoi7 } from '../server/src/goi-bai-7-loi'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'

const NOW = Date.parse('2026-11-10T02:00:00Z') // 09:00 Thứ Ba 10/11 giờ VN
const NGAY_MS = 86_400_000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe() })

async function kho(n = 127) {
  const k = taoKhoOmni({ 'DH-B8': n })
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',${n},0,'v1');INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-11-05"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12A1', 'B8', 'Bài 8. Amine', 8, '["DH-B8-TN","DH-B8-DS","DH-B8-TLN"]', '2026-11-07T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW - 2 * NGAY_MS)
  return k
}
const loaiDaGhi = (k: Awaited<ReturnType<typeof kho>>) => k.d.sql.prepare("SELECT ngay,loai FROM goi_bai_7_loai_ngay WHERE sbd='S1' ORDER BY ngay").all()
const ghiLoai = (k: Awaited<ReturnType<typeof kho>>, ngay: string, loai: string) => k.d.sql.prepare('INSERT INTO goi_bai_7_loai_ngay(sbd,ngay,loai,luc) VALUES(?,?,?,?)').run('S1', ngay, loai, 'x')

describe('chonLoaiNgay7 (luật thuần)', () => {
  const co = { ngay: '2026-11-12', truoc: ['moi', 'moi'], soSua: SO_LOI_NGAY_SUA, soMoiCon: 50 }
  it('hai ngày Mới liền + đủ lỗi ⇒ Sửa; thiếu một trong hai ⇒ Mới', () => {
    expect(chonLoaiNgay7(co)).toBe('sua')
    expect(chonLoaiNgay7({ ...co, soSua: SO_LOI_NGAY_SUA - 1 })).toBe('moi')
    expect(chonLoaiNgay7({ ...co, truoc: ['moi', 'sua'] })).toBe('moi')
    expect(chonLoaiNgay7({ ...co, truoc: ['moi'] })).toBe('moi')
    expect(chonLoaiNgay7({ ...co, truoc: ['sua', 'moi'] })).toBe('moi')
  })
  it('hết câu mới: còn lỗi ⇒ Sửa; không còn gì ⇒ không gắn loại; trước mốc / ngày kiểm tra nhẹ ⇒ không gắn loại', () => {
    expect(chonLoaiNgay7({ ...co, soMoiCon: 0, soSua: 1, truoc: [] })).toBe('sua')
    expect(chonLoaiNgay7({ ...co, soMoiCon: 0, soSua: 0 })).toBeNull()
    expect(chonLoaiNgay7({ ...co, ngay: '2026-11-09' })).toBeNull()
    expect(NGAY_LOAI_NGAY).toBe('2026-11-10')
    expect(chonLoaiNgay7({ ...co, kiemNhe: true })).toBeNull()
  })
  it('chonGoi7 ngày Sửa: câu sửa không bị giới hạn ⅓ mức; ngày thường giữ giới hạn', () => {
    const cau = Array.from({ length: 40 }, (_, i) => ({ qid: `q${i}`, group: `g${i}`, maDe: 'x', version: 'v1', phan: 'I', kho: false, tinhToan: false, kyNang: ['a'] } as CauGoi7))
    const sua = Array.from({ length: 20 }, (_, i) => `s${i}`)
    const vao = { cau, daGap: new Set<string>(), daLamNgay: new Set<string>(), quotaCon: 0, sanSang: new Set([...cau.map(c => c.qid), ...sua]), chan: new Set<string>(), sua, on: [], mucTieuNgay: 28, chiTrongMuc: true, nhomPhu: [{ qids: cau.map(c => c.qid), quota: 0 }] }
    expect(chonGoi7({ ...vao, loaiNgay: 'sua' }).viec.filter(v => v.vai === 'sua')).toHaveLength(20)
    expect(chonGoi7(vao).viec.filter(v => v.vai === 'sua')).toHaveLength(10)
    expect(chonGoi7({ ...vao, loaiNgay: 'sua' }).viec).toHaveLength(28)
  })
})

describe('lapGoi7 theo loại ngày (từ 10/11)', () => {
  it('ngày học mới: 28 câu đều là câu mới của bài (không chia theo lịch), chốt loại một lần, tóm tắt gửi loaiNgay', async () => {
    const k = await kho()
    const lap = await lapGoi7(k.env, 'S1', NOW)
    expect(lap!.loaiNgay).toBe('moi')
    expect(lap!.toiThieu).toBe(28)
    expect(lap!.plan.viec).toHaveLength(28)
    expect(lap!.plan.viec.every(v => v.vai === 'moi' || v.vai === 'tiep_can')).toBe(true)
    expect(tomTatGoi7(lap!, NOW)).toMatchObject({ loaiNgay: 'moi', toiThieu: 28 })
    expect(loaiDaGhi(k)).toEqual([{ ngay: '2026-11-10', loai: 'moi' }])
    // mở lại trong ngày: đọc lại đúng loại đã chốt, không ghi thêm
    vi.setSystemTime(NOW + 60_000)
    expect((await lapGoi7(k.env, 'S1', NOW + 60_000))!.loaiNgay).toBe('moi')
    expect(loaiDaGhi(k)).toHaveLength(1)
  })
  it('hai ngày Mới trước đó + ≥ 12 câu sai ⇒ ngày sửa lỗi: câu sửa đứng đầu, vượt giới hạn ⅓ của ngày thường, vẫn đủ 28', async () => {
    const k = await kho()
    ghiLoai(k, '2026-11-08', 'moi'); ghiLoai(k, '2026-11-09', 'moi')
    // em sai đúng những câu máy đã phát cho em hôm 08/11 (câu em làm được ở tầng đã mở — động cơ chặn câu tầng chưa mở như mọi ngày)
    const t8 = NOW - 2 * NGAY_MS
    // … mỗi câu một nhóm nội dung (động cơ không phát hai câu cùng nhóm trong một ngày — luật sẵn có)
    const lap8 = (await lapGoi7(k.env, 'S1', t8))!, nhom = new Set<string>()
    const sai = lap8.plan.viec.filter(v => v.vai === 'moi').map(v => v.qid).filter(q => { const g = lap8.hs.meta.get(q)?.group ?? q; if (nhom.has(g)) return false; nhom.add(g); return true })
    expect(sai.length).toBeGreaterThanOrEqual(SO_LOI_NGAY_SUA)
    for (const [i, qid] of sai.entries()) await lam(k.env, 'S1', qid, t8 + i * 60_000, false, { cauVersion: 'v1' })
    const lap = await lapGoi7(k.env, 'S1', NOW)
    expect(lap!.loaiNgay).toBe('sua')
    const vai = lap!.plan.viec.map(v => v.vai)
    const soSua = vai.filter(v => v === 'sua').length
    expect(soSua).toBeGreaterThan(10) // ngày thường chỉ tới ⌈28/3⌉ = 10 (câu động cơ cho phát lại; câu tầng chẩn đoán / trùng nhóm vẫn chặn như mọi ngày)
    expect(vai.slice(0, soSua).every(v => v === 'sua')).toBe(true)
    expect(lap!.plan.viec).toHaveLength(28)
    expect(loaiDaGhi(k)).toContainEqual({ ngay: '2026-11-10', loai: 'sua' })
  })
  it('loại đã chốt trong ngày giữ nguyên dù số lỗi đổi giữa ngày', async () => {
    const k = await kho()
    ghiLoai(k, '2026-11-10', 'sua')
    expect((await lapGoi7(k.env, 'S1', NOW))!.loaiNgay).toBe('sua')
  })
  it('ngày trước mốc (09/11): không gắn loại, không ghi bảng loại ngày — kế hoạch như cũ', async () => {
    const k = await kho()
    const t = Date.parse('2026-11-09T02:00:00Z')
    vi.setSystemTime(t)
    const lap = await lapGoi7(k.env, 'S1', t)
    expect(lap!.loaiNgay).toBeNull()
    expect('loaiNgay' in tomTatGoi7(lap!, t)).toBe(false)
    expect(loaiDaGhi(k)).toEqual([])
  })
})
