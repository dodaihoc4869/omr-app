/**
 * SÁU HỆ — BẢNG KHẮC CHẾ PHẢI THẬT, VÀ PHẢI CÂN.
 *
 * Hai thứ dễ sai nhất ở đây, phép kiểm này chặn cả hai:
 *  · **Cặp hai chiều.** Bản nháp đầu ghi cả `acid > điện hoá` lẫn
 *    `điện hoá > acid` (cả hai đều có phản ứng thật), và phép đếm ra "trung
 *    tính −2 đối thủ" — số âm, tức bảng tự mâu thuẫn.
 *  · **Lệch sức mạnh.** Bảng sáu hệ không đối xứng được nếu không bịa phản ứng.
 *    Nên cân bằng bằng chỉ số gốc, và con số bù phải ĐO chứ không nói miệng.
 */
import { describe, it, expect } from 'vitest'
import {
  BANG_KHAC_CHE, DS_HE, TEN_HE_NGAN, TEN_HE_DAY_DU,
  tinhHeSoTuongKhac, heKhacDuoc, heBiKhacBoi,
  HE_SO_KHAC_CHE, HE_SO_BI_KHAC, type HeNguyenTo,
} from '../src/game/than-thu-hoa-hoc/tuong-khac'
import {
  DANH_SACH_THAN_THU, BU_CAN_BANG_HE, tinhLucChienPet,
} from '../src/game/than-thu-hoa-hoc/he-thong-pet'

const KHOA = (a: HeNguyenTo, b: HeNguyenTo) => a + '>' + b
const TAP = new Set(BANG_KHAC_CHE.map((c) => KHOA(c.cong, c.thu)))

describe('Bảng khắc chế sáu hệ', () => {
  it('đúng sáu hệ, tên đủ cả hai kiểu', () => {
    expect(DS_HE).toHaveLength(6)
    for (const h of DS_HE) {
      expect(TEN_HE_NGAN[h]).toBeTruthy()
      expect(TEN_HE_DAY_DU[h]).toBeTruthy()
    }
  })

  it('KHÔNG có cặp hai chiều — một cặp chỉ được một chiều', () => {
    const nguoc = BANG_KHAC_CHE.filter((c) => TAP.has(KHOA(c.thu, c.cong)))
    expect(nguoc.map((c) => `${c.cong}↔${c.thu}`)).toEqual([])
  })

  it('không hệ nào tự khắc chính mình', () => {
    expect(BANG_KHAC_CHE.filter((c) => c.cong === c.thu)).toEqual([])
  })

  it('mọi cặp đều nêu được phản ứng thật làm bằng chứng', () => {
    for (const c of BANG_KHAC_CHE) {
      expect(c.banChung.trim().length, `${c.cong}>${c.thu}`).toBeGreaterThan(20)
      // Bằng chứng phải là phương trình hoặc hiện tượng cụ thể, không phải câu chung chung.
      expect(/→|＋|\+|hấp phụ|bền|dập/.test(c.banChung), `${c.cong}>${c.thu}`).toBe(true)
    }
  })

  it('không hệ nào bất bại, không hệ nào thua sạch', () => {
    for (const h of DS_HE) {
      expect(heKhacDuoc(h).length, `${h} phải khắc được ít nhất một hệ`).toBeGreaterThanOrEqual(1)
      expect(heBiKhacBoi(h).length, `${h} phải bị ít nhất một hệ khắc`).toBeGreaterThanOrEqual(1)
    }
  })

  it('thắng + thua + trung tính luôn bằng đúng 5 đối thủ', () => {
    for (const h of DS_HE) {
      const thang = heKhacDuoc(h).length
      const thua = heBiKhacBoi(h).length
      const trung = DS_HE.filter((k) => k !== h && tinhHeSoTuongKhac(h, k).loai === 'trung').length
      expect(thang + thua + trung, TEN_HE_NGAN[h]).toBe(5)
    }
  })
})

describe('tinhHeSoTuongKhac tra đúng hai chiều', () => {
  it('khắc chế 1,5 · bị khắc 0,7 · trung tính 1,0', () => {
    for (const c of BANG_KHAC_CHE) {
      const xuoi = tinhHeSoTuongKhac(c.cong, c.thu)
      expect(xuoi.heSo).toBe(HE_SO_KHAC_CHE)
      expect(xuoi.loai).toBe('khac')
      expect(xuoi.banChung).toBe(c.banChung)

      const nguoc = tinhHeSoTuongKhac(c.thu, c.cong)
      expect(nguoc.heSo).toBe(HE_SO_BI_KHAC)
      expect(nguoc.loai).toBe('biKhac')
      expect(nguoc.banChung).toBe(c.banChung)
    }
  })

  it('cặp trung tính nói thẳng là không có tương tác, không bịa bằng chứng', () => {
    let soTrung = 0
    for (const a of DS_HE) for (const b of DS_HE) {
      if (a === b) continue
      const k = tinhHeSoTuongKhac(a, b)
      if (k.loai === 'trung') {
        soTrung++
        expect(k.heSo).toBe(1)
        expect(k.banChung).toBe('')
        expect(k.thongDiep).toContain('không có tương tác')
      }
    }
    expect(soTrung).toBeGreaterThan(0)
  })

  it('đánh chính hệ mình luôn trung tính', () => {
    for (const h of DS_HE) expect(tinhHeSoTuongKhac(h, h).heSo).toBe(1)
  })
})

describe('Cân bằng — đo, không nói miệng', () => {
  /** Lợi thế thô của một hệ: hệ số công trung bình ÷ hệ số thủ trung bình. */
  function loiThe(h: HeNguyenTo): number {
    const khac = DS_HE.filter((k) => k !== h)
    const cong = khac.reduce((t, k) => t + tinhHeSoTuongKhac(h, k).heSo, 0) / khac.length
    const thu = khac.reduce((t, k) => t + tinhHeSoTuongKhac(k, h).heSo, 0) / khac.length
    return cong / thu
  }

  it('bảng thô LỆCH — ghi lại để không ai tưởng nó cân sẵn', () => {
    const ds = DS_HE.map(loiThe)
    expect(Math.max(...ds) / Math.min(...ds)).toBeGreaterThan(2)
  })

  it('sau khi nhân hệ số bù, chênh lệch dưới 1,05 lần', () => {
    const hieuDung = DS_HE.map((h) => loiThe(h) * BU_CAN_BANG_HE[h] ** 2)
    const lech = Math.max(...hieuDung) / Math.min(...hieuDung)
    // eslint-disable-next-line no-console
    console.log(`  chênh lệch sức mạnh sáu hệ sau bù: ${lech.toFixed(3)} lần`)
    expect(lech).toBeLessThan(1.05)
  })

  it('mọi hệ đều có hệ số bù, và hệ số nằm trong khoảng hợp lý', () => {
    for (const h of DS_HE) {
      expect(BU_CAN_BANG_HE[h], TEN_HE_NGAN[h]).toBeGreaterThan(0.5)
      expect(BU_CAN_BANG_HE[h], TEN_HE_NGAN[h]).toBeLessThan(2)
    }
  })

  it('hệ khắc được nhiều thì chỉ số gốc phải thấp hơn', () => {
    const base = BU_CAN_BANG_HE['kiem']   // Base khắc 4 hệ — mạnh nhất bảng
    const dien = BU_CAN_BANG_HE['dien']   // Điện hoá khắc 1, thua 4 — yếu nhất
    expect(base).toBeLessThan(dien)
  })

  it('lực chiến thật sự đổi theo hệ', () => {
    const chung = { capDo: 5, capTienHoa: 5 as const, diemTrungBinh: 8, tyLeBtvn: 0.8 }
    const base = tinhLucChienPet({ ...chung, he: 'kiem' })
    const dien = tinhLucChienPet({ ...chung, he: 'dien' })
    expect(dien.mau).toBeGreaterThan(base.mau)
    expect(dien.cong).toBeGreaterThan(base.cong)
    // Không truyền hệ thì không bù — giữ tương thích chỗ gọi cũ.
    const khongHe = tinhLucChienPet(chung)
    expect(khongHe.cp).toBeGreaterThan(0)
  })
})

describe('Sáu thần thú', () => {
  it('đúng sáu con, mỗi hệ đúng một con', () => {
    const ds = Object.values(DANH_SACH_THAN_THU)
    expect(ds).toHaveLength(6)
    const theoHe = new Map<string, number>()
    for (const p of ds) theoHe.set(p.he, (theoHe.get(p.he) ?? 0) + 1)
    for (const h of DS_HE) expect(theoHe.get(h), `hệ ${h}`).toBe(1)
  })

  it('con nào cũng có đủ lore: mô tả, hai chiêu, nguyên tố gốc', () => {
    for (const p of Object.values(DANH_SACH_THAN_THU)) {
      expect(p.ten.length, p.id).toBeGreaterThan(3)
      expect(p.danhHieu.length, p.id).toBeGreaterThan(3)
      expect(p.moTa.length, p.id).toBeGreaterThan(30)
      expect(p.kyNangThuong.length, p.id).toBeGreaterThan(3)
      expect(p.kyNangNo.length, p.id).toBeGreaterThan(3)
      expect(p.nguyenToGoc.length, p.id).toBeGreaterThan(1)
    }
  })

  it('id trong bản ghi khớp khoá, và màu chỉ dùng rgb', () => {
    for (const [khoa, p] of Object.entries(DANH_SACH_THAN_THU)) {
      expect(p.id).toBe(khoa)
      for (const m of [p.mauChinh, p.mauPhu, p.mauHaoQuang]) {
        expect(m.startsWith('rgb'), `${p.id}: ${m}`).toBe(true)
      }
    }
  })
})
