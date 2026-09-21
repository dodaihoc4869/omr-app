// @vitest-environment node
// GỠ 2 EM KHỐI 12 CHƯA TỪNG MỞ APP (thầy chốt 21/09 ~11:00: Dương Quỳnh Mai 12121 + 12126; mọi em khác giữ nguyên) — KHÔI PHỤC ĐƯỢC (thầy lệnh 21/09, Boss soát): server/migration-2109-hoc-sinh-da-go.sql (bảng lưu, chỉ-thêm) + server/go-2109-em-chua-mo-app.sql (chép sang bảng lưu RỒI mới xoá)
// + server/go-2109-em-chua-mo-app-lui.sql (chép ngược). Dữ liệu THẬT chỉ đụng khi thầy bấm cho phép; ở đây chạy trên D1 giả (đúng lược đồ thật).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'

const GO = ['12121', '12126']
const sqlGo = readFileSync('server/go-2109-em-chua-mo-app.sql', 'utf-8')
const sqlLui = readFileSync('server/go-2109-em-chua-mo-app-lui.sql', 'utf-8')
const sbdTrongTep = (sql: string): string[] => [...new Set([...sql.replace(/^--.*$/gm, '').matchAll(/'(\d{5})'/g)].map((m) => m[1]!))].sort()

const hs = (d: D1That, sbd: string, o: { lop?: string; token?: string | null; matKhau?: string | null; tenLop?: string | null } = {}) =>
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,nam_sinh,lop,sdt,trang_thai,token,mat_khau,tao_luc,cap_nhat_luc,ten_lop) VALUES(?,?,?,?,NULL,NULL,?,?,'2026-09-11T15:00:39.562Z','2026-09-11T15:00:39.562Z',?)")
    .run(sbd, `Em ${sbd}`, '2008', o.lop ?? '12', o.token ?? null, o.matKhau ?? null, o.tenLop ?? null)
const ds = (d: D1That, sbd: string, lop = '12') => d.sql.prepare("INSERT INTO danh_sach(sbd,ho_ten,nam_sinh,lop,cap_nhat_luc) VALUES(?,?,?,?,'2026-09-11T15:00:39.562Z')").run(sbd, `Em ${sbd}`, '2008', lop)
const tat = (d: D1That, b: string) => d.sql.prepare(`SELECT * FROM ${b} ORDER BY sbd`).all()
const cot = (d: D1That, b: string, c: string) => (d.sql.prepare(`SELECT ${c} FROM ${b} ORDER BY sbd`).all() as Record<string, string>[]).map((x) => x[c])

/** Trường: 12121 (hồ sơ + danh sách cổng) và 12126 (CHỈ danh sách cổng) là hai em bị gỡ; 12028/12065/12118 cũng "sạch" nhưng KHÔNG nằm trong danh sách ⇒ phải giữ; 12029 có sổ học, 12038 có mật khẩu. */
function dung(): D1That {
  const d = taoD1That()
  hs(d, '12121', { tenLop: '12 - Lớp Thường' }); hs(d, '12028'); hs(d, '12029'); hs(d, '12038', { matKhau: 'matkhau-em-dat' }); hs(d, '12065'); hs(d, '12118')
  hs(d, '12078', { tenLop: '12 - Nhóm 10 điểm' }); hs(d, '12999')
  for (const s of ['12121', '12126', '12028', '12029', '12038', '12065', '12118', '12078', '12999']) ds(d, s)
  d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES('k1','12029','Q1','on_lai','M1',1,1,'2026-09-20T03:00:00.000Z','2026-09-20')").run()
  d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,giao_luc,han_nop,so_cau,da_xoa,cap_nhat_luc) VALUES('B1','CA1','DE1','2026-09-20T03:00:00.000Z','2026-09-30T03:00:00.000Z',10,0,'x')").run()
  d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,so_cau) VALUES('B1|12121','B1','12121','Em 12121',10)").run() // được giao, CHƯA làm
  d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,so_cau,nop_luc) VALUES('B1|12118','B1','12118','Em 12118',10,'2026-09-20T05:00:00.000Z')").run() // ĐÃ nộp
  return d
}

describe('tệp SQL: đúng 7 SBD, không đụng nhóm khác, không có đường xoá mà không lưu', () => {
  it('2 SBD trong tệp gỡ và tệp lùi = danh sách thầy chốt; không trùng "12 - Tinh Hoa" (42 em) và "12 - Nhóm 10 điểm" (15 em)', () => {
    expect(sbdTrongTep(sqlGo)).toEqual([...GO].sort())
    expect(sbdTrongTep(sqlLui)).toEqual([...GO].sort())
    const tinhHoa = sbdTrongTep(readFileSync('server/gan-2109-ten-lop-tinh-hoa.sql', 'utf-8'))
    const nhom = sbdTrongTep(readFileSync('server/gan-2109-ten-lop-nhom-10-diem.sql', 'utf-8'))
    expect(tinhHoa).toHaveLength(42)
    expect(nhom).toHaveLength(15)
    expect(GO.filter((s) => tinhHoa.includes(s) || nhom.includes(s))).toEqual([])
    expect(nhom.filter((s) => tinhHoa.includes(s))).toEqual([])
  })
  it('MỌI danh sách `IN (…)` trong tệp gỡ và tệp lùi đều đúng 2 SBD; cả 27 bảng dấu vết + btvn_em có mặt trong điều kiện an toàn cho cả hồ sơ (h) và danh sách cổng (d)', () => {
    for (const sql of [sqlGo, sqlLui]) {
      const ds = [...sql.replace(/^--.*$/gm, '').matchAll(/sbd IN \(\s*('\d{5}'(?:,\s*'\d{5}')*)\s*\)/g)].map((m) => [...m[1]!.matchAll(/'(\d+)'/g)].map((x) => x[1]!).sort())
      expect(ds.length).toBeGreaterThanOrEqual(4)
      for (const l of ds) expect(l).toEqual([...GO].sort())
    }
    for (const t of ['su_kien_hoc', 'luot', 'phong_cho', 'chi_tiet_cau', 'phieu', 'tien_do_hs', 'nam_kt_cau', 'nam_kt_dang', 'qid_da_lam', 'game_v2_profile', 'game_v2_session', 'game_v2_attempt', 'game_v2_reward', 'game_v2_task', 'mom_bai', 'nop_khac_phuc', 'student_push', 'ph_truy_cap', 'study_preferences', 'cau_hoi_em', 'luyen_de_2026', 'than_thu', 'exp_so', 'chan_vao', 'trang_thai', 'tien_do_ca', 'ban_do_sai', 'btvn_em'])
      for (const al of ['h', 'd']) expect(sqlGo, `${t} ${al}`).toContain(`NOT EXISTS (SELECT 1 FROM ${t} x WHERE x.sbd = ${al}.sbd`)
  })
  it('mọi DELETE ở tệp gỡ có điều kiện "đã nằm trong bảng lưu"; tệp gỡ chỉ đụng hoc_sinh + danh_sach (+ hai bảng lưu); không DROP/TRUNCATE/UPDATE', () => {
    const lenh = sqlGo.replace(/^--.*$/gm, '')
    const xoa = lenh.split(';').filter((l) => /\bDELETE\b/i.test(l))
    expect(xoa).toHaveLength(2)
    for (const l of xoa) expect(l).toMatch(/sbd IN \(SELECT sbd FROM (hoc_sinh|danh_sach)_da_go WHERE ly_do = 'chua_mo_app_lan_nao_21_09'\)/)
    expect(lenh).not.toMatch(/\b(DROP|TRUNCATE|UPDATE|ALTER)\b/i)
    expect([...lenh.matchAll(/\b(?:FROM|INTO)\s+([a-z_0-9]+)/gi)].map((m) => m[1]!.toLowerCase()).filter((t) => !['hoc_sinh', 'danh_sach', 'hoc_sinh_da_go', 'danh_sach_da_go'].includes(t) && !/^x$/.test(t))
      .every((t) => ['su_kien_hoc', 'luot', 'phong_cho', 'chi_tiet_cau', 'phieu', 'tien_do_hs', 'nam_kt_cau', 'nam_kt_dang', 'qid_da_lam', 'game_v2_profile', 'game_v2_session', 'game_v2_attempt', 'game_v2_reward', 'game_v2_task', 'mom_bai', 'nop_khac_phuc', 'student_push', 'ph_truy_cap', 'study_preferences', 'cau_hoi_em', 'luyen_de_2026', 'than_thu', 'exp_so', 'chan_vao', 'trang_thai', 'tien_do_ca', 'ban_do_sai', 'btvn_em'].includes(t))).toBe(true)
  })
  it('bảng lưu có ĐỦ mọi cột của hoc_sinh và danh_sach (khôi phục không mất cột nào, kể cả token, mật khẩu, tên lớp)', () => {
    const d = taoD1That()
    const cotCua = (b: string) => (d.sql.prepare(`PRAGMA table_info(${b})`).all() as { name: string }[]).map((c) => c.name)
    for (const c of cotCua('hoc_sinh')) expect(cotCua('hoc_sinh_da_go'), `hoc_sinh.${c}`).toContain(c)
    for (const c of cotCua('danh_sach')) expect(cotCua('danh_sach_da_go'), `danh_sach.${c}`).toContain(c)
    expect(cotCua('hoc_sinh_da_go')).toEqual(expect.arrayContaining(['go_luc', 'ly_do']))
  })
})

describe('chạy tệp gỡ trên D1 giả', () => {
  it('chép sang bảng lưu RỒI xoá: em sạch dấu vết bị gỡ; em có sổ học / mật khẩu / bài đã nộp / khối 11 / ngoài danh sách được GIỮ; btvn_em và bảng khác nguyên vẹn', async () => {
    const d = dung()
    const btvnTruoc = tat(d, 'btvn_em')
    const hsConLai = tat(d, 'hoc_sinh').filter((x) => (x as { sbd: string }).sbd !== '12121')
    const dsConLai = tat(d, 'danh_sach').filter((x) => !GO.includes((x as { sbd: string }).sbd))
    d.sql.exec(sqlGo)
    expect(cot(d, 'hoc_sinh_da_go', 'sbd')).toEqual(['12121'])
    expect(cot(d, 'hoc_sinh', 'sbd')).toEqual(['12028', '12029', '12038', '12065', '12078', '12118', '12999'])
    expect(cot(d, 'danh_sach_da_go', 'sbd')).toEqual(['12121', '12126']) // 12126 chỉ có ở danh sách cổng
    expect(cot(d, 'danh_sach', 'sbd')).toEqual(['12028', '12029', '12038', '12065', '12078', '12118', '12999'])
    expect(tat(d, 'hoc_sinh')).toEqual(hsConLai) // các em còn lại (kể cả em "sạch" 12028/12065/12118 KHÔNG nằm trong danh sách) KHÔNG bị đổi một byte
    expect(tat(d, 'danh_sach')).toEqual(dsConLai)
    expect(tat(d, 'btvn_em')).toEqual(btvnTruoc)
    const luu = d.sql.prepare("SELECT * FROM hoc_sinh_da_go WHERE sbd = '12121'").get() as Record<string, unknown>
    expect(luu).toMatchObject({ ho_ten: 'Em 12121', lop: '12', ten_lop: '12 - Lớp Thường', ly_do: 'chua_mo_app_lan_nao_21_09' })
    expect(String(luu.go_luc)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })
  it('CHẠY LẠI cùng tệp: không lỗi, không nhân đôi, trạng thái y hệt', () => {
    const d = dung()
    d.sql.exec(sqlGo)
    const sau1 = JSON.stringify([tat(d, 'hoc_sinh'), tat(d, 'danh_sach'), tat(d, 'hoc_sinh_da_go'), tat(d, 'danh_sach_da_go')])
    d.sql.exec(sqlGo)
    expect(JSON.stringify([tat(d, 'hoc_sinh'), tat(d, 'danh_sach'), tat(d, 'hoc_sinh_da_go'), tat(d, 'danh_sach_da_go')])).toBe(sau1)
  })
  it('em vừa mở app SAU khi lập danh sách (có sổ học mới) ⇒ tự được giữ lại ở CẢ hai bảng; em kia vẫn được gỡ', () => {
    const d = dung()
    d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES('k2','12121','Q1','on_lai','M1',1,0,'2026-09-21T03:00:00.000Z','2026-09-21')").run()
    d.sql.exec(sqlGo)
    expect(cot(d, 'hoc_sinh_da_go', 'sbd')).toEqual([])
    expect(cot(d, 'hoc_sinh', 'sbd')).toContain('12121')
    expect(cot(d, 'danh_sach', 'sbd')).toContain('12121') // hồ sơ còn ⇒ dòng danh sách cũng còn
    expect(cot(d, 'danh_sach_da_go', 'sbd')).toEqual(['12126'])
  })
  it('TỪNG lớp chặn đứng độc lập: chỉ có token / chỉ có mật khẩu / chỉ có sổ học / chỉ có bài tập đã chốt hoặc nộp / là khối 11 ⇒ em được GIỮ', () => {
    const chan: [string, (d: D1That) => void][] = [
      ['token', (d) => d.sql.prepare("UPDATE hoc_sinh SET token = 'tok' WHERE sbd = '12121'").run()],
      ['mat_khau', (d) => d.sql.prepare("UPDATE hoc_sinh SET mat_khau = 'mk' WHERE sbd = '12121'").run()],
      ['su_kien_hoc', (d) => d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES('kk','12121','Q1','on_lai','M1',1,1,'2026-09-20T03:00:00.000Z','2026-09-20')").run()],
      ['btvn_em nộp', (d) => d.sql.prepare("UPDATE btvn_em SET nop_luc = '2026-09-20T05:00:00.000Z' WHERE sbd = '12121'").run()],
      ['btvn_em chốt bộ', (d) => d.sql.prepare("UPDATE btvn_em SET chot_luc = '2026-09-20T05:00:00.000Z' WHERE sbd = '12121'").run()],
      ['khối 11', (d) => d.sql.prepare("UPDATE hoc_sinh SET lop = '11' WHERE sbd = '12121'").run()],
    ]
    for (const [ten, them] of chan) {
      const d = dung()
      them(d)
      d.sql.exec(sqlGo)
      expect(cot(d, 'hoc_sinh', 'sbd'), ten).toContain('12121')
      expect(cot(d, 'hoc_sinh_da_go', 'sbd'), ten).not.toContain('12121')
      expect(cot(d, 'danh_sach', 'sbd'), ten).toContain('12121') // hồ sơ còn ⇒ dòng danh sách cổng cũng còn (không để hồ sơ mồ côi)
      expect(cot(d, 'danh_sach_da_go', 'sbd'), ten).not.toContain('12121')
    }
  })
  it('em chỉ có ở danh sách cổng nhưng là khối 11 ⇒ giữ (ràng buộc lop = 12 cả ở danh sách cổng)', () => {
    const d = dung()
    d.sql.prepare("UPDATE danh_sach SET lop = '11' WHERE sbd = '12126'").run()
    d.sql.exec(sqlGo)
    expect(cot(d, 'danh_sach', 'sbd')).toContain('12126')
    expect(cot(d, 'danh_sach_da_go', 'sbd')).not.toContain('12126')
  })
  it('bị ngắt giữa chừng (đã lưu nhưng chưa xoá): chạy lại KHÔNG lỗi, hoàn tất việc xoá, giữ nguyên dòng lưu đầu tiên', () => {
    const d = dung()
    d.sql.prepare("INSERT INTO hoc_sinh_da_go(sbd,ho_ten,lop,go_luc,ly_do) VALUES('12121','Em 12121','12','2026-09-21T03:00:00.000Z','chua_mo_app_lan_nao_21_09')").run()
    d.sql.prepare("INSERT INTO danh_sach_da_go(sbd,ho_ten,lop,go_luc,ly_do) VALUES('12126','Em 12126','12','2026-09-21T03:00:00.000Z','chua_mo_app_lan_nao_21_09')").run()
    d.sql.exec(sqlGo)
    expect(cot(d, 'hoc_sinh', 'sbd')).not.toContain('12121')
    expect(cot(d, 'danh_sach', 'sbd')).not.toContain('12126')
    expect(d.sql.prepare("SELECT go_luc FROM hoc_sinh_da_go WHERE sbd = '12121'").get()).toEqual({ go_luc: '2026-09-21T03:00:00.000Z' })
    expect(d.sql.prepare("SELECT go_luc FROM danh_sach_da_go WHERE sbd = '12126'").get()).toEqual({ go_luc: '2026-09-21T03:00:00.000Z' })
  })
  it('thiếu bảng lưu (chưa chạy migration) ⇒ tệp gỡ LỖI và KHÔNG xoá gì', () => {
    const d = dung()
    d.sql.exec('DROP TABLE hoc_sinh_da_go')
    const truoc = JSON.stringify([tat(d, 'hoc_sinh'), tat(d, 'danh_sach')])
    expect(() => d.sql.exec(sqlGo)).toThrow()
    expect(JSON.stringify([tat(d, 'hoc_sinh'), tat(d, 'danh_sach')])).toBe(truoc)
  })
})

describe('tệp LÙI', () => {
  it('chép NGUYÊN dòng về (token, mật khẩu, tên lớp, ngày tạo giữ nguyên), dọn bảng lưu; chạy lại vẫn an toàn', () => {
    const d = dung()
    const hsTruoc = JSON.stringify([tat(d, 'hoc_sinh'), tat(d, 'danh_sach')])
    d.sql.exec(sqlGo)
    expect(JSON.stringify([tat(d, 'hoc_sinh'), tat(d, 'danh_sach')])).not.toBe(hsTruoc)
    d.sql.exec(sqlLui)
    expect(JSON.stringify([tat(d, 'hoc_sinh'), tat(d, 'danh_sach')])).toBe(hsTruoc)
    expect(tat(d, 'hoc_sinh_da_go')).toEqual([])
    expect(tat(d, 'danh_sach_da_go')).toEqual([])
    d.sql.exec(sqlLui)
    expect(JSON.stringify([tat(d, 'hoc_sinh'), tat(d, 'danh_sach')])).toBe(hsTruoc)
  })
  it('khôi phục giữ ĐỦ cột kể cả token / mật khẩu / tên lớp / ngày tạo của dòng lưu (dòng lưu từ đường khác cũng về nguyên vẹn)', () => {
    const d = dung()
    d.sql.exec("DELETE FROM hoc_sinh WHERE sbd = '12121'; DELETE FROM danh_sach WHERE sbd = '12121'")
    d.sql.prepare("INSERT INTO hoc_sinh_da_go(sbd,ho_ten,nam_sinh,lop,sdt,trang_thai,token,mat_khau,tao_luc,cap_nhat_luc,ten_lop,go_luc,ly_do) VALUES('12121','Em Đầy Đủ','2008','12','0900','da_duyet','tok-x','mk-x','2026-09-11T15:00:39.562Z','2026-09-12T00:00:00.000Z','12 - Tinh Hoa','2026-09-21T03:00:00.000Z','chua_mo_app_lan_nao_21_09')").run()
    d.sql.prepare("INSERT INTO danh_sach_da_go(sbd,ho_ten,nam_sinh,lop,cap_nhat_luc,go_luc,ly_do) VALUES('12121','Em Đầy Đủ','2008','12','2026-09-12T00:00:00.000Z','2026-09-21T03:00:00.000Z','chua_mo_app_lan_nao_21_09')").run()
    d.sql.exec(sqlLui)
    expect(d.sql.prepare("SELECT * FROM hoc_sinh WHERE sbd = '12121'").get()).toEqual({ sbd: '12121', ho_ten: 'Em Đầy Đủ', nam_sinh: '2008', lop: '12', sdt: '0900', trang_thai: 'da_duyet', token: 'tok-x', mat_khau: 'mk-x', tao_luc: '2026-09-11T15:00:39.562Z', cap_nhat_luc: '2026-09-12T00:00:00.000Z', ten_lop: '12 - Tinh Hoa' })
    expect(d.sql.prepare("SELECT * FROM danh_sach WHERE sbd = '12121'").get()).toEqual({ sbd: '12121', ho_ten: 'Em Đầy Đủ', nam_sinh: '2008', lop: '12', cap_nhat_luc: '2026-09-12T00:00:00.000Z' })
  })
  it('lùi khi em đã có mặt lại ở bảng gốc: KHÔNG lỗi, KHÔNG ghi đè dòng đang có, dọn dòng lưu; dòng lưu lý do khác của cùng SBD không bị đụng', () => {
    const d = dung()
    d.sql.exec(sqlGo)
    hs(d, '12121', { matKhau: 'mat-khau-moi' }); ds(d, '12121') // em được thêm lại bằng tay ở CẢ hai bảng
    d.sql.exec(sqlLui)
    expect(d.sql.prepare("SELECT mat_khau FROM hoc_sinh WHERE sbd = '12121'").get()).toEqual({ mat_khau: 'mat-khau-moi' })
    expect(cot(d, 'hoc_sinh_da_go', 'sbd')).not.toContain('12121')
    const e = dung() // 12121 đang có ở bảng gốc; bảng lưu có dòng của LÝ DO KHÁC cho cùng SBD ⇒ tệp lùi không được đụng
    e.sql.prepare("INSERT INTO hoc_sinh_da_go(sbd,ho_ten,lop,go_luc,ly_do) VALUES('12121','Em lý do khác','12','x','ly_do_khac')").run()
    e.sql.prepare("INSERT INTO danh_sach_da_go(sbd,ho_ten,lop,go_luc,ly_do) VALUES('12121','Em lý do khác','12','x','ly_do_khac')").run()
    e.sql.exec(sqlLui)
    expect(cot(e, 'hoc_sinh_da_go', 'sbd')).toEqual(['12121'])
    expect(cot(e, 'danh_sach_da_go', 'sbd')).toEqual(['12121'])
  })
  it('không đụng bảng lưu của lý do khác và em ngoài danh sách 7 em', () => {
    const d = dung()
    d.sql.prepare("INSERT INTO hoc_sinh_da_go(sbd,ho_ten,lop,go_luc,ly_do) VALUES('19999','Em khác','12','x','ly_do_khac')").run()
    d.sql.exec(sqlGo)
    d.sql.exec(sqlLui)
    expect(cot(d, 'hoc_sinh_da_go', 'sbd')).toEqual(['19999'])
    expect(cot(d, 'hoc_sinh', 'sbd')).not.toContain('19999')
  })
})

describe('reset toàn app không xoá bảng lưu', () => {
  it('hoc_sinh_da_go và danh_sach_da_go nằm trong BANG_GIU', async () => {
    const { BANG_GIU, BANG_XOA } = await import('../server/src/reset-toan-app')
    expect(BANG_GIU).toEqual(expect.arrayContaining(['hoc_sinh_da_go', 'danh_sach_da_go']))
    expect(BANG_XOA).not.toContain('hoc_sinh_da_go')
  })
})
