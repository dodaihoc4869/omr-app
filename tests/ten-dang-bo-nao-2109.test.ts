// @vitest-environment node
// TÊN DẠNG cạnh MÃ DẠNG cho màn của thầy (chuẩn từ ngữ luật 4): /ai/nhat-ky (`dang[].ten`, `khacPhuc[].tenDang`) và /ai/dem-qua (`banTin.cacDong[].tenDang`).
// Lớp mỏng `server/src/ten-dang-bo-nao.ts` — không sửa lõi Bộ não; tên lấy từ chỉ mục game; không biết tên ⇒ KHÔNG thêm khoá; chỉ đọc; lỗi đọc ⇒ nguyên kết quả cũ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { tenCuaCacDang, themTenDangDemQua, themTenDangNhatKy } from '../server/src/ten-dang-bo-nao'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

afterEach(() => vi.useRealTimers())

const goi = (d: D1That, duong: string, b: Record<string, unknown> = {}, thay = true) => goiWorker(worker, d.env, duong, b, thay)
function truong(): D1That {
  const d = taoD1That()
  for (const [ma, ten] of [['ESTE.THUY_PHAN', 'Thuỷ phân ester'], ['AMIN.BAC', 'Bậc của amin']] as const) {
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('X', `Q-${ma}`, 'v', `g-${ma}`, ma, JSON.stringify({ tenDang: ten }))
  }
  const j = { nhip: { lech: 0, khoiDong: 2 }, dang: [{ ma: 'ESTE.THUY_PHAN', nut: 'ha_mot_bac' }, { ma: 'CD:Polime', nut: 'giu' }, { ma: 'DANG.LA', nut: 'giu' }], khacPhuc: [{ dang: 'AMIN.BAC', kieu: 'khac_phuc', soCau: 3, bac: 'dung_bac' }, { dang: 'DANG.LA', kieu: 'on_som' }], co: 'khong', loiNhanChoEm: 'x', loiNhanChoPhuHuynh: 'y', thuTuan: '' }
  d.sql.prepare('INSERT INTO ai_dieu_chinh(sbd,ngay,json,do_tin,che_do,ap_dung,het_han,huy,tu_go,ly_do_bo,nop_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run('S1', '2026-09-21', JSON.stringify(j), 0.9, 'that', 1, '2026-09-24', 0, 0, '[]', 'x')
  const bt = { cacDong: [{ loai: 'x', sbd: 'S1', chu: 'Em làm đều', hanhDong: 'khong', dang: 'ESTE.THUY_PHAN' }, { loai: 'x', sbd: 'S1', chu: 'Chưa rõ', hanhDong: 'khong', dang: 'DANG.LA' }, { loai: 'x', sbd: 'S1', chu: 'Không dạng', hanhDong: 'khong' }] }
  d.sql.prepare('INSERT INTO ai_ban_tin(ngay,json,che_do,nop_luc,so_em) VALUES(?,?,?,?,?)').run('2026-09-21', JSON.stringify(bt), 'that', 'x', 1)
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','12A','mk','x')")
  return d
}

describe('tenCuaCacDang', () => {
  it('mã dạng thật ⇒ tên từ chỉ mục game; CD:<tên> ⇒ phần sau CD:; mã lạ vắng; rỗng/trùng bỏ; chia lô > 60 mã vẫn đủ', async () => {
    const d = truong()
    const t = await tenCuaCacDang(d.env, ['ESTE.THUY_PHAN', 'AMIN.BAC', 'CD:Polime', 'DANG.LA', '', 'ESTE.THUY_PHAN', 'CD:'])
    expect(Object.fromEntries(t)).toEqual({ 'CD:Polime': 'Polime', 'ESTE.THUY_PHAN': 'Thuỷ phân ester', 'AMIN.BAC': 'Bậc của amin' })
    for (let i = 0; i < 70; i++) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('X', `Q${i}`, 'v', `g${i}`, `MA.${i}`, JSON.stringify({ tenDang: `Tên ${i}` }))
    const nhieu = await tenCuaCacDang(d.env, Array.from({ length: 70 }, (_, i) => `MA.${i}`))
    expect(nhieu.size).toBe(70)
    expect(nhieu.get('MA.69')).toBe('Tên 69')
  })
})

describe('/ai/nhat-ky: dang[].ten + khacPhuc[].tenDang', () => {
  it('có tên thì thêm cạnh mã (mã giữ nguyên); mã không biết tên KHÔNG có khoá ten/tenDang; phần còn lại của bản ghi nguyên', async () => {
    const d = truong()
    const r = await goi(d, '/ai/nhat-ky', { sbd: 'S1' })
    expect(r.ok).toBe(true)
    const x = r.ds[0]
    expect(x.dang).toEqual([
      { ma: 'ESTE.THUY_PHAN', nut: 'ha_mot_bac', ten: 'Thuỷ phân ester' },
      { ma: 'CD:Polime', nut: 'giu', ten: 'Polime' },
      { ma: 'DANG.LA', nut: 'giu' },
    ])
    expect(x.khacPhuc).toEqual([
      { dang: 'AMIN.BAC', kieu: 'khac_phuc', soCau: 3, bac: 'dung_bac', tenDang: 'Bậc của amin' },
      { dang: 'DANG.LA', kieu: 'on_som' },
    ])
    expect(x).toMatchObject({ ngay: '2026-09-21', cheDo: 'that', apDung: true, loiNhanChoEm: 'x', loiNhanChoPhuHuynh: 'y' })
    expect(r.hoTen).toBe('Em Một')
  })
  it('chưa có chỉ mục nào (không biết tên nào) ⇒ trả Y HỆT lệnh gốc; lỗi bảng ⇒ nguyên', async () => {
    const d = truong()
    d.sql.exec('DELETE FROM game_v2_question')
    const r = await goi(d, '/ai/nhat-ky', { sbd: 'S1' })
    expect(r.ds[0].dang[0]).not.toHaveProperty('ten') // mã dạng thật nhưng chỉ mục trống ⇒ không tên
    expect(r.ds[0].dang[1]).toMatchObject({ ma: 'CD:Polime', ten: 'Polime' }) // mã chuyên đề `CD:` luôn có tên (phần sau CD:)
    expect(JSON.stringify(r.ds[0].khacPhuc)).not.toContain('tenDang')
    const goc = { ok: true, ds: [{ dang: [{ ma: 'A' }], khacPhuc: [] }] }
    d.sql.exec('DROP TABLE game_v2_question')
    expect(await themTenDangNhatKy(d.env, goc)).toEqual(goc)
    expect(await themTenDangNhatKy(d.env, { ok: false, error: 'x' })).toEqual({ ok: false, error: 'x' })
  })
  it('KHÔNG ghi gì (lệnh chỉ đọc) và cần mã bí mật như cũ', async () => {
    const d = truong()
    expect((await goi(d, '/ai/nhat-ky', { sbd: 'S1' }, false)).ok).toBe(false)
    const truoc = d.chup('ai_dieu_chinh')
    await goi(d, '/ai/nhat-ky', { sbd: 'S1' })
    expect(d.chup('ai_dieu_chinh')).toBe(truoc)
  })
})

describe('/ai/dem-qua: banTin.cacDong[].tenDang', () => {
  it('dòng có dạng biết tên ⇒ tenDang; dạng lạ hoặc không có dạng ⇒ KHÔNG khoá; mã `dang` giữ nguyên', async () => {
    const d = truong()
    const r = await goi(d, '/ai/dem-qua', { ngay: '2026-09-21' })
    expect(r.ok).toBe(true)
    const [a, b, c] = r.banTin.cacDong
    expect(a).toMatchObject({ dang: 'ESTE.THUY_PHAN', tenDang: 'Thuỷ phân ester' })
    expect(b).toMatchObject({ dang: 'DANG.LA' })
    expect(b).not.toHaveProperty('tenDang')
    expect(c).not.toHaveProperty('tenDang')
    expect(await themTenDangDemQua(d.env, { ok: true, banTin: { cacDong: [] } })).toEqual({ ok: true, banTin: { cacDong: [] } })
    expect(await themTenDangDemQua(d.env, { ok: true, ngay: 'x' })).toEqual({ ok: true, ngay: 'x' }) // chưa có bản tin ⇒ nguyên
  })
})
