// THẦN THÚ MỖI NGÀY · ĐỢT 1 · MÀN (Code 2; đề prompt-than-thu-moi-ngay-2109.md; thầy chốt 21/09 13:36): thanh "Hôm nay {tên thú} đã hấp thụ 120 / 200 EXP" cạnh khối có nút nạp +
// 3 lời báo khi lần nạp bị chặn (chữ có sẵn trong đề bài). Dữ liệu từ `profile.hapThuHomNay:{da,tran,lyDo}` (máy chủ Code 3, chỉ-thêm). Máy chủ cũ (thiếu trường) ⇒ ẨN, không bịa số.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import DaoCuaEm from '../src/game/than-thu-v2/dao/DaoCuaEm'
import { HAP_THU_TOI_DA_NGAY, hapThuHienThi } from '../src/game/than-thu-v2/dao/dao-core'
import type { DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

afterEach(cleanup)
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const hoSo = (them: Partial<DaoProfile> = {}): DaoProfile => ({ nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 34, exp: 640, wallet: 0, mastery: [], ...them })
const CHU_ANH_NO = 'Hôm nay Lửa Nhỏ đã ăn no. EXP còn lại nằm trong ống nghiệm, mai em nạp tiếp.'
const CHU_CHUA_HOC = 'Thần thú chỉ ăn vào ngày em có học. Em làm vài câu rồi quay lại nạp nhé.'
const CHU_CHUA_DAT = 'Đạt nhiệm vụ ngày hôm nay thì Lửa Nhỏ ăn được thêm 80 EXP.'

describe('hapThuHienThi — lõi thuần', () => {
  it('trần hiển thị = 200; chữ chính "Hôm nay {tên} đã hấp thụ 120 / 200 EXP"; tỉ lệ = da/200', () => {
    expect(HAP_THU_TOI_DA_NGAY).toBe(200)
    const v = hapThuHienThi({ da: 120, tran: 120 }, 'Lửa Nhỏ', false)!
    expect(v).toMatchObject({ da: 120, toiDa: 200, chu: 'Hôm nay Lửa Nhỏ đã hấp thụ 120 / 200 EXP', bao: '' })
    expect(v.tiLe).toBeCloseTo(0.6)
  })

  it('ba lời báo đúng chữ của đề: ăn no (tran 200) · chưa học · chưa đạt (tran 120 ⇒ "thêm 80 EXP" = 200 − 120)', () => {
    expect(hapThuHienThi({ da: 200, tran: 200, lyDo: 'no' }, 'Lửa Nhỏ', true)!.bao).toBe(CHU_ANH_NO)
    expect(hapThuHienThi({ da: 0, tran: 0, lyDo: 'chua_hoc' }, 'Lửa Nhỏ', true)!.bao).toBe(CHU_CHUA_HOC)
    expect(hapThuHienThi({ da: 120, tran: 120, lyDo: 'no' }, 'Lửa Nhỏ', true)!.bao).toBe(CHU_CHUA_DAT)
    expect(hapThuHienThi({ da: 150, tran: 150, lyDo: 'no' }, 'Bông', true)!.bao).toBe('Đạt nhiệm vụ ngày hôm nay thì Bông ăn được thêm 50 EXP.') // số thêm tính từ trần, không cứng 80
  })

  it('không có EXP chờ nạp ⇒ KHÔNG lời báo (không có gì bị chặn); lý do khác (het_ong, cap_toi_da, null, lạ) ⇒ không lời', () => {
    expect(hapThuHienThi({ da: 200, tran: 200, lyDo: 'no' }, 'Lửa Nhỏ', false)!.bao).toBe('')
    for (const lyDo of ['het_ong', 'cap_toi_da', null, undefined, 'gi_do_la']) expect(hapThuHienThi({ da: 60, tran: 120, lyDo }, 'Lửa Nhỏ', true)!.bao, String(lyDo)).toBe('')
  })

  it('thiếu / sai dạng ⇒ null (ẩn): undefined, không phải số, âm; số quá trần bị kẹp về 200 (không hiện "230 / 200")', () => {
    for (const x of [undefined, null, {}, { da: 'a', tran: 1 }, { da: 1 }, { da: NaN, tran: 5 }, { da: -1, tran: 5 }, { da: 5, tran: -5 }, 'x' as never]) expect(hapThuHienThi(x as never, 'T', true), JSON.stringify(x)).toBeNull()
    const v = hapThuHienThi({ da: 230, tran: 999 }, 'T', false)!
    expect([v.da, v.toiDa, v.tiLe]).toEqual([200, 200, 1])
    expect(hapThuHienThi({ da: 33.9, tran: 120 }, 'T', false)!.da).toBe(33)
  })
})

describe('DaoCuaEm — thanh hấp thụ trên màn', () => {
  const ve = (them: Partial<DaoProfile> = {}, props: Record<string, unknown> = {}) => render(<DaoCuaEm profile={hoSo(them)} onLenDuong={() => {}} {...props} />)

  it('có dữ liệu: dòng chữ + thanh (role progressbar, aria-valuenow=120, max=200, aria-valuetext) nằm NGAY SAU khối có nút nạp', () => {
    const { container } = ve({ hapThuHomNay: { da: 120, tran: 200 }, wallet: 500 }, { onNap: () => {} })
    const khoi = container.querySelector('[data-vung="hap-thu"]') as HTMLElement
    expect(khoi.textContent).toContain('Hôm nay Lửa Nhỏ đã hấp thụ 120 / 200 EXP')
    const thanh = screen.getByRole('progressbar', { name: 'EXP Lửa Nhỏ đã hấp thụ hôm nay' })
    expect(thanh.getAttribute('aria-valuenow')).toBe('120')
    expect(thanh.getAttribute('aria-valuemax')).toBe('200')
    expect(thanh.getAttribute('aria-valuetext')).toBe('120 trên 200 EXP')
    expect((thanh.querySelector('i') as HTMLElement).style.width).toBe('60%')
    const hon = container.querySelector('.dao-hon')!
    expect(hon.nextElementSibling).toBe(khoi) // ngay dưới khối hero chứa nút nạp
    expect(screen.getByRole('button', { name: /Nạp 500 EXP cho Lửa Nhỏ/ })).toBeTruthy() // nút nạp giữ nguyên
  })

  it('bị chặn: ba lời báo hiện đúng lúc (chỉ khi có EXP chờ nạp) và là role=status', () => {
    for (const [lyDo, da, tran, chu] of [['no', 200, 200, CHU_ANH_NO], ['chua_hoc', 0, 0, CHU_CHUA_HOC], ['no', 120, 120, CHU_CHUA_DAT]] as const) {
      const { container, unmount } = ve({ hapThuHomNay: { da, tran, lyDo }, wallet: 300 }, { onNap: () => {} })
      const bao = container.querySelector('.dao-hap-thu-bao') as HTMLElement
      expect(bao.textContent).toBe(chu)
      expect(bao.getAttribute('role')).toBe('status')
      unmount()
    }
    const { container } = ve({ hapThuHomNay: { da: 200, tran: 200, lyDo: 'no' }, wallet: 0 })
    expect(container.querySelector('.dao-hap-thu-bao')).toBeNull() // ống rỗng: không có gì bị chặn
  })

  it('MÁY CHỦ CŨ (thiếu hapThuHomNay) hoặc sai dạng ⇒ ẨN thanh, phần còn lại của đảo nguyên vẹn', () => {
    for (const x of [undefined, {} as never, { da: 'x', tran: 1 } as never]) {
      const { container, unmount } = ve({ hapThuHomNay: x })
      expect(container.querySelector('[data-vung="hap-thu"]')).toBeNull()
      expect(container.querySelector('.dao-hon')).toBeTruthy()
      expect(screen.getByRole('button', { name: /LÊN ĐƯỜNG/ })).toBeTruthy()
      unmount()
    }
  })

  it('tên thú tự đặt được dùng trong chữ; không có biệt danh ⇒ tên loài; không nhắc "cấp thiếu N EXP" giả', () => {
    const { container } = ve({ nickname: 'Bông', hapThuHomNay: { da: 40, tran: 120 } })
    expect(container.querySelector('[data-vung="hap-thu"]')!.textContent).toContain('Hôm nay Bông đã hấp thụ 40 / 200 EXP')
  })

  it('"còn N EXP lên cấp" vẫn đọc từ thanhExp CHUNG (Code 1 đổi bảng ⇒ màn tự theo; không số cứng ở đây)', () => {
    const nguon = doc('src/game/than-thu-v2/dao/DaoCuaEm.tsx') + doc('src/game/than-thu-v2/dao/dao-core.ts')
    expect(nguon).toContain("import {thanhExp} from '../../than-thu-hoa-hoc/kinh-nghiem'")
    expect(nguon).not.toMatch(/1[ .,]?286[ .,]?590|3[ .,]?610|15[ .,]?120/) // các số của đường cấp CŨ không được nằm cứng ở màn
    expect(nguon).toMatch(/còn \$\{vong\.con\.toLocaleString/)
  })
})

describe('khoá nguồn', () => {
  it('kiểu DaoProfile có hapThuHomNay chỉ-thêm (tùy chọn); CSS có khối; tệp logic của Code 1 KHÔNG bị sửa ở đây', () => {
    expect(doc('src/game/than-thu-v2/dao/kieu.ts')).toContain('hapThuHomNay?:{da:number;tran:number;lyDo?:string|null}')
    const css = doc('src/game/than-thu-v2/dao/dao.css')
    for (const l of ['.dao .dao-hap-thu{', '.dao .dao-hap-thu-chu{', '.dao .dao-hap-thu-bao{']) expect(css).toContain(l)
  })
})
