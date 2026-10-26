// @vitest-environment node
// THƯỞNG PHẠT 26/10 — LUẬT CỨNG: hệ phát hiện lười (Học thật / Đối phó, ĐUỔI, Mức làm Bấm vội / treo máy) CHỈ thầy + phụ huynh thấy. MỌI phản hồi /hs mới của hệ
// thưởng phạt (tổng quan, rương, bình, cược, thông báo, huy hiệu, Kim cương, phần `thuong` / `ketBai` / `kimCuong` của `answer`) KHÔNG chứa khoá hay chữ lười —
// kể cả khi em đang làm vội (câu không được tính chỉ có `tinh: false`).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoKhoOmni, cauJson } from './omni-3-ke-hoach-chung'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameToken } from '../server/src/game-v2-auth'
import { hsCuocChuoi, hsDaXemThongBao, hsHuyHieu, hsMoRuong, hsMuaBinh, hsThuong, cronThuongNgay } from '../server/src/thuong-d1'
import { hsKimCuongBatDau } from '../server/src/thuong-kim-cuong'
import { datCauNoiChuoi } from '../server/src/thuong-cau-noi-chuoi'

const NOW = Date.parse('2026-10-26T03:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); datCauNoiChuoi(null); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

/** Khoá hoặc chữ của hệ lười — không được xuất hiện ở bất kỳ đâu trong phản hồi học sinh. */
const LUOI = /v[oộ]i\b|vội|treo|đối phó|doi_pho|doiPho|lười|luoi|đuổi|duoi\b|hoc_that|hocThat|học thật|muc_lam|mucLam|mức làm|bam_voi|bamVoi|\bbac\b|nhanLuoi|danh_gia|danhGia/i

it('mọi phản hồi /hs của thưởng phạt sạch nhãn lười (kể cả em đang làm vội)', async () => {
  const k = taoKhoOmni({ 'DH-B8': 14 }, 1)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8',14,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('thuong_moc','2026-10-01','x');
    INSERT INTO vang_so(sbd,loai,so_vang,exp_tru,khoa_yeu_cau,luc) VALUES('S1','doi',80,0,'nap','x');`)
  const up = k.d.sql.prepare('UPDATE game_v2_question SET dang = ?, json = ? WHERE ma_de = ? AND qid = ?')
  for (let i = 0; i < 12; i++) up.run('nguyen_tu.d', cauJson(`DH-B8-${i}`, 'DH-B8', i, { dang: 'nguyen_tu.d', sao: 2 }), 'DH-B8', `DH-B8-${i}`)
  k.d.sql.prepare("INSERT INTO hanh_trinh_v5_muc(sbd,pham_vi,phien_ban,muc_json,tien_do_json,cap_nhat_luc) VALUES('S1','x','v',?,'{}',1)").run(JSON.stringify([{ vkn: 'NGUYEN_TU.a', tang: 1, trangThai: 'vung' }]))
  const token = await gameToken(k.env, 'S1')
  const env = k.env
  datCauNoiChuoi({ docChuoiNgay: async () => ({ so: 3, giuChuoi: 1, sucChua: 2, lich7: [{ ngay: '2026-10-26', kieu: 'cho' }] }), congBinh: async () => true,
    docNgayCoHoc: async () => new Map(), docNgayDuocDo: async () => new Map(), docNgayCoPhep: async () => new Map() })
  const ra: unknown[] = []
  // Thăng hoa đêm trước ⇒ thông báo.
  await cronThuongNgay(env, Date.parse('2026-10-25T17:15:00Z'))
  ra.push(await hsThuong(env, { token }, undefined, NOW))
  ra.push(await hsMoRuong(env, { token }, NOW))
  ra.push(await hsMuaBinh(env, { token }, NOW))
  ra.push(await hsMuaBinh(env, { token }, NOW))
  ra.push(await hsCuocChuoi(env, { token, dat: 50 }, NOW))
  ra.push(await hsCuocChuoi(env, { token, dat: 50 }, NOW))
  ra.push(await hsDaXemThongBao(env, { token, ma: 'x' }, NOW))
  ra.push(await hsHuyHieu(env, { token }, undefined, NOW))
  const kc = await hsKimCuongBatDau(env, { token, chuyenDe: 'NGUYEN_TU' }, NOW)
  ra.push(kc)
  expect(kc.ok).toBe(true)
  // Em làm VỘI: sai nhanh hơn thời gian đọc đề (Mức làm 1) ⇒ phản hồi answer chỉ có tinh:false.
  const cau = kc.cau as { qid: string; phan: string }[]
  for (let i = 0; i < 3; i++) {
    const viec: Promise<unknown>[] = []
    const res = await worker.fetch(new Request('https://test/game-v2/answer', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, session: kc.phien, qid: cau[i]!.qid, answer: cau[i]!.phan === 'I' ? 'A' : cau[i]!.phan === 'II' ? 'DSDD' : '7', doGiay: { g: 1, t: 80, h: 0, p: cau[i]!.phan } }) }), env, { waitUntil: (p: Promise<unknown>) => { viec.push(p) }, passThroughOnException() {} } as never)
    await Promise.allSettled(viec)
    const j = (await res.json()) as Record<string, unknown>
    expect(j.ok, JSON.stringify(j).slice(0, 200)).toBe(true)
    expect((j.thuong as { tinh: boolean }).tinh).toBe(false)
    ra.push({ thuong: j.thuong, ketBai: j.ketBai, kimCuong: j.kimCuong })
  }
  ra.push(await hsKimCuongBatDau(env, { token, chuyenDe: 'NGUYEN_TU' }, NOW + 1000)) // khoá 24 giờ
  ra.push(await hsThuong(env, { token }, undefined, NOW + 2000))
  for (const x of ra) expect(JSON.stringify(x)).not.toMatch(LUOI)
})
