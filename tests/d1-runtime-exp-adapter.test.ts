// LÁT 1 — CỬA DUY NHẤT của EXP (`cnh-exp-adapter.ts`). Bằng chứng trên RUNTIME D1 THẬT
// (workerd cục bộ qua `@cloudflare/vitest-pool-workers`, dữ liệu TỔNG HỢP, KHÔNG production).
//
// Chứng minh 3 bất biến của cửa:
//   (1) Cờ kích hoạt đọc từ `cau_hinh`, KIỂU CHẶT, vắng/hỏng ⇒ MẶC ĐỊNH (đóng).
//   (2) Cửa ĐÓNG (hoặc route lạ / ngoài lát) ⇒ `nopQuaP07` NÉM và **KHÔNG chạm substrate**.
//   (3) Cửa MỞ ⇒ nộp chạy đúng; retry CÙNG requestId trả receipt cũ, KHÔNG cộng hai lần.
//
// Chạy: `npx vitest run --config vitest.config.d1.ts tests/d1-runtime-exp-adapter.test.ts`.
import { beforeAll, describe, expect, it } from 'vitest'
import { DB, ENV, attemptMoi, gieoAttempt, gieoHocSinh, maMoi, napLuocDo, sbdMoi } from './_cnh-exp-fixture'
import {
  CAU_HINH_KICH_HOAT_MAC_DINH,
  KHOA_CAU_HINH_KICH_HOAT,
  LoiCuaExp,
  docCauHinhKichHoat,
  moCuaRoute,
  nopQuaP07,
  quyetToanQuaP07,
} from '../server/src/cnh-exp-adapter'
import { PHIEN_BAN_CHINH_SACH } from '../server/src/cnh-exp-ledger'

/** Route TRONG sổ kiểm, trạng thái `de_xuat_patch` (route của Cline: ôn lại). */
const DUONG = '/hs/on-lai/nop'
/** Route `ngoai_lat_nay` trong sổ kiểm (thuộc Aider) — phải bị từ chối ở lát này. */
const DUONG_NGOAI = '/game-v2/doan-nop'
/** Cờ MỞ đủ điều kiện: đã chạy bảng, đúng phiên bản, đường cũ TẮT, ví mới làm chủ, ảnh chụp đã nối. */
const CO_MO = JSON.stringify({
  bangDaChay: true,
  phienBanChinhSach: PHIEN_BAN_CHINH_SACH,
  duongCuConBat: false,
  viMoiLaChu: true,
  anhChupDaNoi: true,
})
/** Ngày VN + mốc nhận bài TỔNG HỢP (phải khớp nhau: `nopBaiCore` suy `learningDay` từ `receivedAt`). */
const NGAY_HOC = '2026-09-24'
const LUC_NHAN = Date.parse('2026-09-24T12:00:00+07:00')

beforeAll(async () => {
  await napLuocDo()
  await DB.prepare(
    'CREATE TABLE IF NOT EXISTS cau_hinh (khoa TEXT PRIMARY KEY, gia_tri TEXT, cap_nhat_luc TEXT NOT NULL)',
  ).run()
})

/** Đặt cờ kích hoạt (`null` = xoá dòng ⇒ vắng cờ). */
async function datCo(json: string | null): Promise<void> {
  await DB.prepare('DELETE FROM cau_hinh WHERE khoa = ?').bind(KHOA_CAU_HINH_KICH_HOAT).run()
  if (json !== null) {
    await DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?)')
      .bind(KHOA_CAU_HINH_KICH_HOAT, json, new Date().toISOString())
      .run()
  }
}

describe('cửa kích hoạt — đọc cờ từ D1 (kiểu chặt)', () => {
  it('vắng cờ ⇒ cấu hình MẶC ĐỊNH (mọi điều kiện chưa đạt)', async () => {
    await datCo(null)
    expect(await docCauHinhKichHoat(ENV)).toEqual(CAU_HINH_KICH_HOAT_MAC_DINH)
  })
  it('cờ hỏng JSON / không phải object ⇒ MẶC ĐỊNH', async () => {
    await datCo('{khong-phai-json')
    expect(await docCauHinhKichHoat(ENV)).toEqual(CAU_HINH_KICH_HOAT_MAC_DINH)
    await datCo('[1,2,3]')
    expect(await docCauHinhKichHoat(ENV)).toEqual(CAU_HINH_KICH_HOAT_MAC_DINH)
    await datCo('')
    expect(await docCauHinhKichHoat(ENV)).toEqual(CAU_HINH_KICH_HOAT_MAC_DINH)
  })
  it('cờ hợp lệ ⇒ đọc đúng; kiểu SAI về giá trị AN TOÀN', async () => {
    await datCo(
      JSON.stringify({ bangDaChay: true, phienBanChinhSach: 'CNH-1.0', duongCuConBat: false, viMoiLaChu: true, anhChupDaNoi: true, strictMetadata: true }),
    )
    expect(await docCauHinhKichHoat(ENV)).toEqual({
      bangDaChay: true,
      phienBanChinhSach: 'CNH-1.0',
      duongCuConBat: false,
      viMoiLaChu: true,
      anhChupDaNoi: true,
      strictMetadata: true,
    })
    await datCo(JSON.stringify({ bangDaChay: 'yes', viMoiLaChu: 1, anhChupDaNoi: 'true', duongCuConBat: null }))
    expect(await docCauHinhKichHoat(ENV)).toMatchObject({
      bangDaChay: false,
      phienBanChinhSach: '',
      duongCuConBat: true,
      viMoiLaChu: false,
      anhChupDaNoi: false,
    })
  })
})

describe('cửa route — fail-closed', () => {
  it('route NGOÀI sổ kiểm ⇒ CUA_KHONG_HOP_LE', async () => {
    await datCo(CO_MO)
    const r = await moCuaRoute(ENV, '/khong-co-trong-so')
    expect(r.choPhep).toBe(false)
    expect(r.ma).toBe('CUA_KHONG_HOP_LE')
  })
  it('route `ngoai_lat_nay` ⇒ CUA_KHONG_HOP_LE dù cờ mở', async () => {
    await datCo(CO_MO)
    const r = await moCuaRoute(ENV, DUONG_NGOAI)
    expect(r.choPhep).toBe(false)
    expect(r.ma).toBe('CUA_KHONG_HOP_LE')
  })
  it('cờ đóng ⇒ route hợp lệ vẫn bị chặn (THIEU_BANG)', async () => {
    await datCo(null)
    const r = await moCuaRoute(ENV, DUONG)
    expect(r.choPhep).toBe(false)
    expect(r.ma).toBe('THIEU_BANG')
  })
  it('HAI đường tiền cùng bật ⇒ HAI_DUONG_TIEN', async () => {
    await datCo(JSON.stringify({ bangDaChay: true, phienBanChinhSach: PHIEN_BAN_CHINH_SACH, duongCuConBat: true, viMoiLaChu: true, anhChupDaNoi: true }))
    const r = await moCuaRoute(ENV, DUONG)
    expect(r.choPhep).toBe(false)
    expect(r.ma).toBe('HAI_DUONG_TIEN')
  })
  it('sai phiên bản chính sách ⇒ SAI_PHIEN_BAN', async () => {
    await datCo(JSON.stringify({ bangDaChay: true, phienBanChinhSach: 'CNH-0.9', duongCuConBat: false, viMoiLaChu: true, anhChupDaNoi: true }))
    const r = await moCuaRoute(ENV, DUONG)
    expect(r.choPhep).toBe(false)
    expect(r.ma).toBe('SAI_PHIEN_BAN')
  })
  it('cờ mở đủ điều kiện ⇒ CHO PHÉP (kèm dòng sổ kiểm)', async () => {
    await datCo(CO_MO)
    const r = await moCuaRoute(ENV, DUONG)
    expect(r.choPhep).toBe(true)
    expect(r.dong?.duong).toBe(DUONG)
    expect(r.dong?.trangThai).toBe('de_xuat_patch')
  })
})

describe('cửa ĐÓNG ⇒ KHÔNG chạm substrate', () => {
  it('nopQuaP07 ném LoiCuaExp; ví/receipt/ledger KHÔNG đổi', async () => {
    await datCo(null)
    const sbd = sbdMoi()
    await gieoHocSinh(sbd, NGAY_HOC, { wallet: 0, earned: 0 })
    await expect(
      nopQuaP07(ENV, DUONG, {
        studentId: sbd,
        attemptId: attemptMoi(),
        rawAnswer: 'C',
        requestId: `R-${maMoi()}`,
        receivedAt: LUC_NHAN,
      }),
    ).rejects.toBeInstanceOf(LoiCuaExp)
    const tk = await DB.prepare('SELECT wallet_exp, earned_exp, revision FROM cnh_exp_account WHERE student_id = ?')
      .bind(sbd)
      .first<{ wallet_exp: number; earned_exp: number; revision: number }>()
    expect(tk).toMatchObject({ wallet_exp: 0, earned_exp: 0, revision: 0 })
    const lenh = await DB.prepare('SELECT COUNT(*) AS n FROM cnh_exp_command WHERE student_id = ?').bind(sbd).first<{ n: number }>()
    expect(lenh?.n).toBe(0)
    const so = await DB.prepare('SELECT COUNT(*) AS n FROM cnh_exp_grant_ledger WHERE student_id = ?').bind(sbd).first<{ n: number }>()
    expect(so?.n).toBe(0)
  })
  it('quyetToanQuaP07 ném LoiCuaExp khi cửa đóng', async () => {
    await datCo(null)
    const sbd = sbdMoi()
    await gieoHocSinh(sbd, NGAY_HOC, { wallet: 0, earned: 0, rawCore: 10, achieved: 1 })
    await expect(
      quyetToanQuaP07(ENV, DUONG, { studentId: sbd, learningDay: NGAY_HOC, requestHash: `H-${maMoi()}`, requestId: `RQ-${maMoi()}` }),
    ).rejects.toBeInstanceOf(LoiCuaExp)
    const tk = await DB.prepare('SELECT wallet_exp FROM cnh_exp_account WHERE student_id = ?').bind(sbd).first<{ wallet_exp: number }>()
    expect(tk?.wallet_exp).toBe(0)
  })
})

describe('cửa MỞ ⇒ nộp chạy; retry CÙNG requestId ⇒ receipt cũ', () => {
  it('nộp đúng phần I ⇒ receipt submit_core; retry cùng requestId ⇒ Y HỆT, không nhân đôi', async () => {
    await datCo(CO_MO)
    const sbd = sbdMoi()
    const attempt = attemptMoi()
    await gieoHocSinh(sbd, NGAY_HOC, { wallet: 0, earned: 0, rawCore: 0, achieved: 1 })
    await gieoAttempt(sbd, attempt, `G-${maMoi()}`, { part: 'I', difficulty: 1, issuedAt: LUC_NHAN - 60_000, expiresAt: LUC_NHAN + 3_600_000 })
    const req = `R-${maMoi()}`
    const yeuCau = { studentId: sbd, attemptId: attempt, rawAnswer: 'C', requestId: req, receivedAt: LUC_NHAN }
    const lan1 = await nopQuaP07(ENV, DUONG, yeuCau)
    expect(lan1.commandType).toBe('submit_core')
    expect(lan1.correct).toBe(true)
    expect(lan1.raw).toBeGreaterThan(0)
    const tk1 = await DB.prepare('SELECT wallet_exp, revision FROM cnh_exp_account WHERE student_id = ?')
      .bind(sbd)
      .first<{ wallet_exp: number; revision: number }>()
    const lan2 = await nopQuaP07(ENV, DUONG, yeuCau)
    expect(lan2).toEqual(lan1) // replay NGUYÊN VĂN (không có cờ `replayed`)
    const tk2 = await DB.prepare('SELECT wallet_exp, revision FROM cnh_exp_account WHERE student_id = ?')
      .bind(sbd)
      .first<{ wallet_exp: number; revision: number }>()
    expect(tk2?.wallet_exp).toBe(tk1?.wallet_exp)
    expect(tk2?.revision).toBe(tk1?.revision)
    const lenh = await DB.prepare('SELECT COUNT(*) AS n FROM cnh_exp_command WHERE student_id = ?').bind(sbd).first<{ n: number }>()
    expect(lenh?.n).toBe(1)
  })
  it('cùng requestId nhưng payload KHÁC ⇒ ném (IDEMPOTENCY_CONFLICT)', async () => {
    await datCo(CO_MO)
    const sbd = sbdMoi()
    const attempt = attemptMoi()
    await gieoHocSinh(sbd, NGAY_HOC, { wallet: 0, earned: 0 })
    await gieoAttempt(sbd, attempt, `G-${maMoi()}`, { part: 'I', issuedAt: LUC_NHAN - 60_000, expiresAt: LUC_NHAN + 3_600_000 })
    const req = `R-${maMoi()}`
    await nopQuaP07(ENV, DUONG, { studentId: sbd, attemptId: attempt, rawAnswer: 'C', requestId: req, receivedAt: LUC_NHAN })
    await expect(
      nopQuaP07(ENV, DUONG, { studentId: sbd, attemptId: attempt, rawAnswer: 'A', requestId: req, receivedAt: LUC_NHAN }),
    ).rejects.toThrow(/payload khác/)
  })
})

