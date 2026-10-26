// @vitest-environment node
// THƯỞNG PHẠT 26/10 — THỬ THÁCH KIM CƯƠNG (LUAT «Thử thách Kim cương», DAC-TA §4.4): mở khi chuyên đề thành thạo, 10 câu khó KHÔNG đáp án, 3 ống nghiệm,
// vỡ đủ 3 ⇒ trượt, khoá 24 giờ; đạt ⇒ +40 tinh thể một lần mỗi chuyên đề + huy hiệu. Nộp qua lệnh `answer` sẵn có (D1 thật).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoKhoOmni, cauJson } from './omni-3-ke-hoach-chung'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameToken } from '../server/src/game-v2-auth'
import { hsKimCuongBatDau, chuyenDeThanhThao } from '../server/src/thuong-kim-cuong'
import { trangThaiKimCuong } from '../server/src/thuong-luat'
import { gvCongTacThuong } from '../server/src/thuong-d1'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-26T03:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

const CD = 'NGUYEN_TU'
async function kho(vung = true) {
  const k = taoKhoOmni({ 'DH-B8': 16 }, 2)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8',16,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');`)
  // 12 câu khó (2 sao) của chuyên đề NGUYEN_TU, mỗi câu một nhóm.
  const up = k.d.sql.prepare('UPDATE game_v2_question SET dang = ?, json = ? WHERE ma_de = ? AND qid = ?')
  for (let i = 0; i < 12; i++) up.run(`${CD.toLowerCase()}.d${i % 2}`, cauJson(`DH-B8-${i}`, 'DH-B8', i, { dang: `${CD.toLowerCase()}.d${i % 2}`, sao: 2 }), 'DH-B8', `DH-B8-${i}`)
  k.d.sql.prepare("INSERT INTO hanh_trinh_v5_muc(sbd,pham_vi,phien_ban,muc_json,tien_do_json,cap_nhat_luc) VALUES('S1','x','v',?,'{}',1)")
    .run(JSON.stringify([{ vkn: `${CD}.a`, tang: 1, trangThai: vung ? 'vung' : 'chua_vung' }, { vkn: `${CD}.b`, tang: 1, trangThai: 'vung' }]))
  const token = await gameToken(k.env, 'S1')
  return { ...k, token }
}
async function tra(env: Env, token: string, than: Record<string, unknown>) {
  const viec: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { viec.push(p) }, passThroughOnException() {} }
  const res = await worker.fetch(new Request('https://test/game-v2/answer', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token }) }), env, ctx as never)
  await Promise.allSettled(viec)
  return (await res.json()) as Record<string, unknown>
}
const dung = (phan: string) => (phan === 'I' ? 'B' : phan === 'II' ? 'DSDS' : '4')
const sai = (phan: string) => (phan === 'I' ? 'A' : phan === 'II' ? 'DSDD' : '7')

describe('luật thuần', () => {
  it('3 ống: sai mỗi câu vỡ 1, vỡ đủ 3 là trượt; đủ 10 câu còn ống là đạt', () => {
    expect(trangThaiKimCuong([true, false, true])).toEqual({ ongCon: 2, xong: false, dat: false })
    expect(trangThaiKimCuong([false, true, false, false])).toEqual({ ongCon: 0, xong: true, dat: false })
    expect(trangThaiKimCuong([...Array(8).fill(true), false, false])).toEqual({ ongCon: 1, xong: true, dat: true })
  })
  it('thành thạo = ≥ 80 % kỹ năng đã đo của chuyên đề «vững»', () => {
    expect(chuyenDeThanhThao(JSON.stringify([{ vkn: 'NGUYEN_TU.a', trangThai: 'vung' }]), 'NGUYEN_TU')).toBe(true)
    expect(chuyenDeThanhThao(JSON.stringify([{ vkn: 'NGUYEN_TU.a', trangThai: 'vung' }, { vkn: 'NGUYEN_TU.b', trangThai: 'chua_vung' }]), 'NGUYEN_TU')).toBe(false)
    expect(chuyenDeThanhThao('[]', 'NGUYEN_TU')).toBe(false)
  })
})

describe('bắt đầu + nộp (D1 thật)', () => {
  it('chưa thành thạo ⇒ chưa mở; công tắc tắt ⇒ ẩn', async () => {
    const k = await kho(false)
    expect(await hsKimCuongBatDau(k.env, { token: k.token, chuyenDe: CD }, NOW)).toMatchObject({ ok: false, chuaMo: true })
    const k2 = await kho(true)
    await gvCongTacThuong(k2.env, { khoa: 'thuong_kim_cuong', giaTri: 'tat' })
    expect(await hsKimCuongBatDau(k2.env, { token: k2.token, chuyenDe: CD }, NOW)).toMatchObject({ ok: false, tat: true })
  })
  it('10 câu khó KHÔNG đáp án, 3 ống; sai 3 câu ⇒ trượt, câu sau bị từ chối, khoá 24 giờ', async () => {
    const k = await kho()
    const r = await hsKimCuongBatDau(k.env, { token: k.token, chuyenDe: CD }, NOW)
    expect(r).toMatchObject({ ok: true, ong: 3 })
    const cau = r.cau as Record<string, unknown>[]
    expect(cau).toHaveLength(10)
    for (const q of cau) { expect(q).not.toHaveProperty('correct'); expect(q).not.toHaveProperty('solution'); expect(q.sao).toBe(2) }
    expect(JSON.stringify(r)).not.toMatch(/"correct"|"solution"/)
    // gọi lại khi đang dở ⇒ đúng lượt ấy
    expect(await hsKimCuongBatDau(k.env, { token: k.token, chuyenDe: CD }, NOW + 1000)).toMatchObject({ ok: true, phien: r.phien, tiepTuc: true, ong: 3 })
    let cuoi: Record<string, unknown> = {}
    for (let i = 0; i < 3; i++) {
      cuoi = await tra(k.env, k.token, { session: r.phien, qid: cau[i]!.qid, answer: sai(String(cau[i]!.phan)), msLam: 60_000 })
      expect(cuoi.ok, JSON.stringify(cuoi).slice(0, 200)).toBe(true)
      expect((cuoi.kimCuong as { ongCon: number }).ongCon).toBe(2 - i)
    }
    expect(cuoi.kimCuong).toEqual({ ongCon: 0, xong: true, dat: false })
    expect(cuoi.ketBai).toBeDefined()
    const sau = await tra(k.env, k.token, { session: r.phien, qid: cau[3]!.qid, answer: dung(String(cau[3]!.phan)), msLam: 60_000 })
    expect(sau.ok).toBe(false)
    expect(k.d.sql.prepare('SELECT ket_qua, ong_con FROM kim_cuong_phien WHERE id = ?').get(r.phien as string)).toEqual({ ket_qua: 'truot', ong_con: 0 })
    vi.setSystemTime(NOW + 3600_000)
    expect(await hsKimCuongBatDau(k.env, { token: k.token, chuyenDe: CD }, NOW + 3600_000)).toMatchObject({ ok: false, khoa: true })
    vi.setSystemTime(NOW + 26 * 3600_000)
    expect((await hsKimCuongBatDau(k.env, { token: k.token, chuyenDe: CD }, NOW + 26 * 3600_000)).ok).toBe(true)
  })
  it('đúng đủ 10 (còn ống) ⇒ đạt: +40 tinh thể một lần mỗi chuyên đề, huy hiệu kc|<chuyên đề>', async () => {
    const k = await kho()
    const r = await hsKimCuongBatDau(k.env, { token: k.token, chuyenDe: CD }, NOW)
    const cau = r.cau as Record<string, unknown>[]
    let cuoi: Record<string, unknown> = {}
    for (let i = 0; i < 10; i++) {
      vi.setSystemTime(NOW + (i + 1) * 60_000)
      cuoi = await tra(k.env, k.token, { session: r.phien, qid: cau[i]!.qid, answer: i === 4 ? sai(String(cau[i]!.phan)) : dung(String(cau[i]!.phan)), msLam: 60_000 })
      expect(cuoi.ok, JSON.stringify(cuoi).slice(0, 200)).toBe(true)
    }
    expect(cuoi.kimCuong).toEqual({ ongCon: 2, xong: true, dat: true })
    const du = () => (k.d.sql.prepare('SELECT COALESCE(SUM(so_vang),0) AS v FROM vang_so WHERE sbd = ?').get('S1') as { v: number }).v
    expect(du()).toBe(40)
    expect(k.d.sql.prepare("SELECT ma FROM huy_hieu_em WHERE em='S1'").all()).toEqual([{ ma: `kc|${CD}` }])
    // nộp lại câu cuối ⇒ không cộng đôi
    await tra(k.env, k.token, { session: r.phien, qid: cau[9]!.qid, answer: dung(String(cau[9]!.phan)), msLam: 60_000 })
    expect(du()).toBe(40)
  })
})
