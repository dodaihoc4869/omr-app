// @vitest-environment node
// BÁO CÁO ĐỘ PHỦ "làm lại câu sai bằng bản khác" (tiêu chí 7, DE-XUAT-LAM-LAI-CAU-SAI-0510.md) — scripts/do-phu-lam-lai.mjs chạy CHỈ ĐỌC trên
// D1 test (node:sqlite, lược đồ thật). Kho thật: CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… node scripts/do-phu-lam-lai.mjs (không chạy ở đây).
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { docDoPhu, HANG_MUC_DO as HANG_SCRIPT, khoiCuaLop as lopScript, khoiCuaMaDe as khoiScript, songSinhDungDuoc } from '../scripts/do-phu-lam-lai.mjs'
import { HANG_MUC_DO } from '../server/src/srs2-loi'
import { damBaoBangBoTro, songSinhDuDuLieu, type SongSinh } from '../server/src/cau-bo-tro'
import { damBaoBangLoiGiai } from '../server/src/loi-giai'
import { khoiCuaLop, khoiCuaMaDe } from '../src/lib/khoi-cau'
import type { Env } from '../server/src/kieu'

const cau = (qid: string, maDe: string, phan: string, dang: string, mucDo: string, them: Record<string, unknown> = {}) => ({
  qid, maDe, version: 'v1', group: `g-${qid}`, phan, text: `Đề ${qid}`, choices: phan === 'I' ? ['1', '2', '3', '4'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
  hinhAnh: [], dang, tenDang: dang, mucDo, sao: 1, kienThuc: [], correct: phan === 'I' ? 'A' : phan === 'II' ? 'DSDS' : '1', reviewed: true, solution: { chot: 'x' }, ...them,
})
const SS_TOT: SongSinh = { de: 'Song sinh: tính m', pa: { A: '1', B: '2', C: '3', D: '4' }, dap_an: 'B' }
const SS_THIEU_BANG: SongSinh = { de: 'Cho bảng số liệu sau. Tính m.', pa: { A: '1', B: '2', C: '3', D: '4' }, dap_an: 'B' }

describe('báo cáo độ phủ làm lại (chỉ đọc)', () => {
  it('theo chương: % có song sinh · có câu anh em (cùng dạng, cùng phần, khác nhóm, mức kề, ĐÚNG KHỐI) · không có gì; đếm lượt nv / tc / xt từ 05/10', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    const to = [['DH-12-C1-B1', 'Chương 1 · Ester', '12'], ['DH-11-C3-B2', null, '11'], ['DH-B9', 'Chương 9', null]] as const
    for (const [ma, cd, lop] of to) d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,chuyen_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,1,0,?)').run(ma, ma, lop, cd, 'v1')
    const ds = [
      cau('E1', 'DH-12-C1-B1', 'I', 'ES', 'TH'), // có song sinh (+ có anh em)
      cau('E2', 'DH-12-C1-B1', 'I', 'ES', 'TH'), // anh em: E1, E3 (E6 cùng nhóm ⇒ không tính)
      cau('E3', 'DH-12-C1-B1', 'I', 'ES', 'VD'), // anh em mức kề
      cau('E4', 'DH-12-C1-B1', 'II', 'ES', 'TH'), // Phần II một mình ⇒ không gì
      cau('E5', 'DH-12-C1-B1', 'III', 'ESX', 'TH'), // Phần III một mình ⇒ không gì
      { ...cau('E6', 'DH-12-C1-B1', 'I', 'ES', 'TH'), group: 'g-E2' },
      cau('E7', 'DH-12-C1-B1', 'I', 'ES', 'TH', { tuLuan: true }), // tự luận ⇒ không đếm, không làm anh em
      cau('P1', 'DH-11-C3-B2', 'I', 'ES', 'TH'), // cùng mã dạng nhưng KHỐI 11 ⇒ không có anh em khối 12
      cau('X1', 'DH-B9', 'I', 'ES', 'TH'), // không rõ khối ⇒ không có anh em, không làm anh em
    ]
    const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
    for (const c of ds) st.run(c.maDe, c.qid, 'v1', c.group, c.dang, JSON.stringify(c))
    await damBaoBangLoiGiai(env); await damBaoBangBoTro(env)
    d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES('E1','B1','DH-12-C1-B1','tn','x'),('E2','B2','DH-12-C1-B1','tn','x')").run()
    d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES('B1','E1',?,'[]','[]','[]','x'),('B2','E2',?,'[]','[]','[]','x')")
      .run(JSON.stringify([SS_TOT, SS_THIEU_BANG]), JSON.stringify([SS_THIEU_BANG])) // E2 chỉ có song sinh thiếu dữ kiện ⇒ không tính
    const so = d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,raw_json) VALUES(?,?,?,?,?,1,?,?,?,?)')
    so.run('k1', 'S1', 'E4', 'game', 'P', 0, '2026-10-05T03:00:00.000Z', '2026-10-05', '{"chon":"DSDS","nv":1}')
    so.run('k2', 'S2', 'E4', 'game', 'P', 1, '2026-10-06T03:00:00.000Z', '2026-10-06', '{"nv":1}')
    so.run('k3', 'S1', 'E3', 'game', 'P', 1, '2026-10-06T03:00:00.000Z', '2026-10-06', '{"chon":"A","tc":"E2"}')
    so.run('k4', 'S1', 'E2', 'game', 'P', 1, '2026-10-07T03:00:00.000Z', '2026-10-07', '{"chon":"A","xt":1}')
    so.run('k5', 'S1', 'E4', 'game', 'P', 0, '2026-10-04T03:00:00.000Z', '2026-10-04', '{"nv":1}') // trước 05/10 ⇒ không đếm
    const ghiTruoc = Number((d.sql.prepare('SELECT total_changes() AS n').get() as { n: number }).n)
    const kq = await docDoPhu(async (sql: string, p: unknown[]) => d.sql.prepare(sql).all(...(p as string[])) as Record<string, unknown>[])
    expect(Number((d.sql.prepare('SELECT total_changes() AS n').get() as { n: number }).n)).toBe(ghiTruoc) // chỉ đọc
    expect(kq.chiDoc).toBe(true)
    expect(kq.soCauDaQuet).toBe(ds.length)
    const chuong = Object.fromEntries(kq.theoChuong.map((c: Record<string, unknown>) => [c.chuong, c]))
    expect(chuong['Chương 1 · Ester']).toMatchObject({ tong: 6, coSongSinh: 1, coAnhEm: 4, chiAnhEm: 3, chiXaoHoacNguyenVan: 2, phanIII_khongGi: 1, pctSongSinh: 16.7, pctAnhEm: 66.7, pctKhongGi: 33.3 })
    expect(chuong['DH-11-C3']).toMatchObject({ tong: 1, coAnhEm: 0, chiXaoHoacNguyenVan: 1 }) // tờ không ghi chuyên đề ⇒ mã chương trong mã tờ
    expect(chuong['Chương 9']).toMatchObject({ tong: 1, coAnhEm: 0, chiXaoHoacNguyenVan: 1 })
    expect(kq.tong).toMatchObject({ tong: 8, coSongSinh: 1, coAnhEm: 4, chiXaoHoacNguyenVan: 4 })
    expect(kq.suKien).toEqual({ nv: 2, tc: 1, xt: 1, nvTheoCau: [{ qid: 'E4', n: 2 }] })
    // Nhật ký chỉ số lượng + mã câu: không đề, không đáp án.
    expect(JSON.stringify(kq)).not.toMatch(/Đề E|Song sinh|"correct"|DSDS/)
  })

  it('bản chép trong script khớp máy chủ: bậc mức độ, song sinh dùng được, khối từ mã tờ / lớp', () => {
    expect(HANG_SCRIPT).toEqual(HANG_MUC_DO)
    const mau: [string, SongSinh][] = [
      ['I', SS_TOT], ['I', SS_THIEU_BANG], ['I', { ...SS_TOT, dap_an: 'E' }], ['I', { ...SS_TOT, pa: { A: '1', B: '2', C: '3' } }], ['II', SS_TOT],
      ['III', { de: 'Tính m', dap_an: '3,6' }], ['III', { de: 'Tính m', dap_an: '3.6' }], ['III', { de: '  ', dap_an: '1' }],
      ['I', { ...SS_THIEU_BANG, bang: [['a', 'b'], ['1', '2']] }], ['I', { ...SS_THIEU_BANG, de: 'Cho bảng sau: chất | t° | khối lượng 1 | 2 | 3' }],
    ]
    for (const [phan, ss] of mau) expect(songSinhDungDuoc(phan, ss), JSON.stringify(ss)).toBe(songSinhDuDuLieu(phan, ss))
    for (const ma of ['DH-12-C2-B6-TN', 'DB-12-B8-D1', 'DH-11-III-1', '12-C1-B2-D1', '10-C1-B1-I-1', 'DH-B9', 'DH-120-X', 'DH-12-A, DH-10-B', '']) expect(khoiScript(ma), ma).toBe(khoiCuaMaDe(ma))
    for (const lop of ['12', '11A1', 'Lớp 10', '12 - Tinh Hoa', '120', '', null]) expect(lopScript(lop), String(lop)).toBe(khoiCuaLop(lop))
  })
})
