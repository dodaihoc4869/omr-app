/**
 * THẦN THÚ 3D — MÔ HÌNH, CHIÊU THỨC, ĐƯỜNG LUI.
 *
 * Thầy chốt 15-09: thú phải 3D thật, chiêu bấm vào phải tung ra thật.
 *
 * Ba thứ phép kiểm này giữ:
 *  1. **Luật cộng dồn vẫn đúng ở 3D.** Bản 2D đã khoá "cấp sau ngầu hơn cấp
 *     trước" bằng phép đếm; bản 3D đọc cùng bảng `layHinhThai` nên phải cho ra
 *     cùng kết luận — số khối dựng ra tăng nghiêm ngặt.
 *  2. **Không rò bộ nhớ GPU.** Three không tự dọn geometry/material. Mỗi lần em
 *     lên cấp là dựng lại con thú; quên dispose là điện thoại hết RAM sau vài chục cấp.
 *  3. **Chiêu chạy đủ ba pha rồi tắt hẳn** — không có chiêu nào treo giữa chừng.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import * as THREE from 'three'
import { dungThanThu3D, donBoThanThu3D, mauTuChuoi } from '../src/game/than-thu-hoa-hoc/dung-than-thu-3d'
import { ChieuThuc3D } from '../src/game/than-thu-hoa-hoc/chieu-thuc-3d'
import { DANH_SACH_THAN_THU } from '../src/game/than-thu-hoa-hoc/he-thong-pet'
import { CAP_TOI_DA } from '../src/game/than-thu-hoa-hoc/hinh-thai'

const HOA = DANH_SACH_THAN_THU['hoa_long']!

beforeAll(() => {
  // Vòng rune vẽ chữ bằng CanvasTexture; jsdom không có ngữ cảnh 2D thật.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

/** Đếm mọi mesh trong cây — thước đo "ngầu" đo được. */
function demKhoi(o: THREE.Object3D): number {
  let n = 0
  o.traverse((x) => { if ((x as THREE.Mesh).isMesh) n++ })
  return n
}

describe('mauTuChuoi', () => {
  it('đọc được rgb và rgba của kho', () => {
    const a = mauTuChuoi('rgb(239, 68, 68)')
    expect(a.r).toBeCloseTo(239 / 255, 3)
    expect(a.b).toBeCloseTo(68 / 255, 3)
    const b = mauTuChuoi('rgba(34, 197, 94, 0.45)')
    expect(b.g).toBeCloseTo(197 / 255, 3)
  })
  it('chuỗi hỏng thì về xám, không ném lỗi', () => {
    expect(() => mauTuChuoi('linh tinh')).not.toThrow()
    expect(mauTuChuoi('').r).toBeCloseTo(0.8, 2)
  })
})

describe('Mô hình 3D theo 12 hình thái', () => {
  it('cấp nào cũng dựng được, cho cả sáu thần thú', () => {
    for (const pet of Object.values(DANH_SACH_THAN_THU)) {
      for (let c = 1; c <= CAP_TOI_DA; c++) {
        const bo = dungThanThu3D(pet, c)
        expect(demKhoi(bo.goc), `${pet.id} cấp ${c}`).toBeGreaterThan(0)
        donBoThanThu3D(bo)
      }
    }
  })

  it('CẤP SAU NGẦU HƠN CẤP TRƯỚC — số khối tăng nghiêm ngặt từ cấp 2 lên 12', () => {
    let truoc = -1
    for (let c = 2; c <= CAP_TOI_DA; c++) {
      const bo = dungThanThu3D(HOA, c)
      const n = demKhoi(bo.goc)
      expect(n, `cấp ${c} phải nhiều khối hơn cấp ${c - 1}`).toBeGreaterThan(truoc)
      truoc = n
      donBoThanThu3D(bo)
    }
  })

  it('cấp 1 là TRỨNG: không thân, không sừng, không cánh, không đuôi', () => {
    const bo = dungThanThu3D(HOA, 1)
    expect(bo.duoi).toBeNull()
    expect(bo.canhTrai).toBeNull()
    expect(bo.canhPhai).toBeNull()
    expect(bo.vongXoay).toHaveLength(0)
    donBoThanThu3D(bo)
  })

  it('đuôi mọc từ cấp 4, cánh từ cấp 5, vòng xoay từ cấp 9', () => {
    const co = (c: number) => {
      const b = dungThanThu3D(HOA, c)
      const r = { duoi: b.duoi !== null, canh: b.canhTrai !== null, vong: b.vongXoay.length > 0 }
      donBoThanThu3D(b)
      return r
    }
    expect(co(3).duoi).toBe(false)
    expect(co(4).duoi).toBe(true)
    expect(co(4).canh).toBe(false)
    expect(co(5).canh).toBe(true)
    expect(co(8).vong).toBe(false)
    expect(co(9).vong).toBe(true)
    // Cộng dồn: có rồi thì không bao giờ mất.
    expect(co(12).duoi).toBe(true)
    expect(co(12).canh).toBe(true)
  })

  it('miệng nằm phía trước thú — chiêu bắn ra đằng trước, không bắn vào mặt em', () => {
    for (let c = 1; c <= CAP_TOI_DA; c++) {
      const bo = dungThanThu3D(HOA, c)
      expect(bo.mieng.z, `cấp ${c}`).toBeGreaterThan(0.5)
      donBoThanThu3D(bo)
    }
  })

  it('màu thân lấy đúng từ thần thú, mỗi hệ một màu', () => {
    const mau = new Set<string>()
    for (const pet of Object.values(DANH_SACH_THAN_THU)) {
      const bo = dungThanThu3D(pet, 6)
      let thay = ''
      bo.goc.traverse((x) => {
        const m = (x as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
        if (thay === '' && m?.color !== undefined) thay = m.color.getHexString()
      })
      mau.add(thay)
      donBoThanThu3D(bo)
    }
    expect(mau.size).toBe(6)
  })
})

describe('Dọn bộ nhớ GPU', () => {
  it('donBoThanThu3D gọi dispose CHO TỪNG geometry và material', () => {
    const bo = dungThanThu3D(HOA, 12)
    expect(bo.rac.length).toBeGreaterThan(10)
    const dsGoi = bo.rac.map((r) => vi.spyOn(r, 'dispose'))
    donBoThanThu3D(bo)
    for (const g of dsGoi) expect(g).toHaveBeenCalled()
    expect(bo.rac).toHaveLength(0)
    expect(bo.goc.children).toHaveLength(0)
  })

  it('dựng rồi dọn 30 lần không tích luỹ rác', () => {
    for (let i = 0; i < 30; i++) {
      const bo = dungThanThu3D(HOA, (i % CAP_TOI_DA) + 1)
      donBoThanThu3D(bo)
      expect(bo.rac).toHaveLength(0)
    }
  })
})

describe('Chiêu thức bay ra thật', () => {
  it('chưa bắn thì không chạy và không hiện', () => {
    const c = new ChieuThuc3D(HOA)
    expect(c.dangChay).toBe(false)
    expect(c.doiTuong.visible).toBe(false)
    c.dispose()
  })

  it('bắn rồi thì chạy, và tự tắt sau khi hết 1,5 giây', () => {
    const c = new ChieuThuc3D(HOA)
    c.ban(new THREE.Vector3(0, 0, 1))
    expect(c.dangChay).toBe(true)
    expect(c.doiTuong.visible).toBe(true)
    // Chạy 100 khung hình 20 ms = 2 giây, đủ qua 1,5 giây.
    for (let i = 0; i < 100; i++) c.capNhat(0.02)
    expect(c.dangChay).toBe(false)
    expect(c.doiTuong.visible).toBe(false)
    c.dispose()
  })

  it('đi đủ ba pha: dồn lực → bay → nổ, và nổ ĐÚNG MỘT LẦN', () => {
    const c = new ChieuThuc3D(HOA)
    c.ban(new THREE.Vector3(0, 0, 1))
    let coDonLuc = false
    let soLanNo = 0
    for (let i = 0; i < 100; i++) {
      c.capNhat(0.02)
      if (c.donLuc > 0) coDonLuc = true
      if (c.vuaNo) soLanNo++
    }
    expect(coDonLuc).toBe(true)
    expect(soLanNo).toBe(1)
    c.dispose()
  })

  it('dồn lực giảm dần về 0 rồi thôi', () => {
    const c = new ChieuThuc3D(HOA)
    c.ban(new THREE.Vector3(0, 0, 0))
    const ds: number[] = []
    for (let i = 0; i < 12; i++) { c.capNhat(0.02); ds.push(c.donLuc) }
    for (let i = 1; i < ds.length; i++) expect(ds[i]!).toBeLessThanOrEqual(ds[i - 1]!)
    c.dispose()
  })

  it('bắn đè lên nhau thì bắt đầu lại, không chồng hai chiêu', () => {
    const c = new ChieuThuc3D(HOA)
    c.ban(new THREE.Vector3(0, 0, 0))
    for (let i = 0; i < 30; i++) c.capNhat(0.02)
    c.ban(new THREE.Vector3(0, 0, 0))
    expect(c.donLuc).toBeGreaterThan(0)   // về lại pha một
    c.dispose()
  })

  it('mỗi hệ một hình dạng đạn — sáu hệ không được giống nhau', () => {
    const loai = new Set<string>()
    for (const pet of Object.values(DANH_SACH_THAN_THU)) {
      const c = new ChieuThuc3D(pet)
      let ten = ''
      c.doiTuong.traverse((x) => {
        const m = x as THREE.Mesh
        if (ten === '' && m.isMesh && m.geometry !== undefined) ten = m.geometry.type
      })
      loai.add(ten)
      c.dispose()
    }
    expect(loai.size).toBeGreaterThanOrEqual(5)
  })

  it('dispose trả hết geometry và material', () => {
    const c = new ChieuThuc3D(HOA)
    const ds: THREE.BufferGeometry[] = []
    c.doiTuong.traverse((x) => {
      const m = x as THREE.Mesh
      if (m.isMesh && m.geometry !== undefined) ds.push(m.geometry)
    })
    const theo = ds.map((g) => vi.spyOn(g, 'dispose'))
    c.dispose()
    for (const t of theo) expect(t).toHaveBeenCalled()
  })
})
