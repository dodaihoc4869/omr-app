// @vitest-environment node
// TÊN DẠNG cạnh MÃ DẠNG cho màn của thầy (chuẩn từ ngữ luật 4): /ai/nhat-ky (`dang[].ten`, `khacPhuc[].tenDang`) và /ai/dem-qua (`banTin.cacDong[].tenDang`).
// Lớp mỏng `server/src/ten-dang-bo-nao.ts` — không sửa lõi Bộ não; tên lấy từ chỉ mục game; không biết tên ⇒ KHÔNG thêm khoá; chỉ đọc; lỗi đọc ⇒ nguyên kết quả cũ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { tenCuaCacDang } from '../server/src/ten-dang-bo-nao'
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
