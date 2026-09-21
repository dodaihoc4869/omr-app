// BẢN ĐỒ LỚP 3D · lõi three.js (`taoBan3D`) chạy với BỘ VẼ GIẢ (WebGLRenderer thay bằng bản ghi): cảnh, camera, hình học, chiếu nhãn, raycast là THẬT (three chạy được trong jsdom); chỉ bước "vẽ ra GPU" là giả.
// Khoá: WebGL hỏng ⇒ null (màn lùi 2D) · số cột theo số lớp · chiều cao nội suy / về đích ngay khi giảm chuyển động · màu theo tỉ lệ đúng · nhãn bám đầu cột · raycast · giải phóng đủ.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as Thuc from 'three'
import type { LopSan } from '../src/lib/bang-tin-san/kieu'
import type { MauSan } from '../src/components/bang-tin-san/hooks'

const ghi = vi.hoisted(() => ({ render: 0, dispose: 0, loseCtx: 0, setSize: [] as number[][], khoiTao: 0, hong: false, gioiHan: null as unknown }))
vi.mock('three', async (goc) => {
  const T = await goc<typeof import('three')>()
  class BoVeGia {
    shadowMap = { enabled: false, type: 0 }
    constructor() {
      if (ghi.hong) throw new Error('Error creating WebGL context.')
      ghi.khoiTao++
    }
    setPixelRatio() {}
    setClearColor() {}
    setSize(w: number, h: number) { ghi.setSize.push([w, h]) }
    render(canh: import('three').Scene, may: import('three').Camera) { ghi.render++; canh.updateMatrixWorld(); if (may.parent === null) may.updateMatrixWorld() } // như bộ vẽ thật: cập nhật ma trận thế giới trước khi vẽ
    dispose() { ghi.dispose++ }
    forceContextLoss() { ghi.loseCtx++ }
  }
  return { ...T, WebGLRenderer: BoVeGia }
})

const MAU: MauSan = {
  nen: 'rgb(255,255,255)', mat: 'rgb(2,2,2)', 'mat-2': 'rgb(3,3,3)', vien: 'rgb(4,4,4)', chu: 'rgb(5,5,5)', 'chu-phu': 'rgb(6,6,6)', 'chu-mo': 'rgb(7,7,7)', duong: 'rgb(8,8,255)',
  la: 'rgb(0,200,0)', do: 'rgb(200,0,0)', vang: 'rgb(200,200,0)', 'xam-o': 'rgb(120,120,120)', luoi: 'rgb(14,14,14)', 'tren-gia': 'rgb(15,15,15)',
}
const TOI: MauSan = { ...MAU, nen: 'rgb(10,10,10)' }
const lop = (ten: string, soCau: number, dung: number): LopSan => ({ lop: ten, siSo: 30, daHoc: 5, soCau, soCauDung: dung })
const DS = [lop('A', 300, 285), lop('B', 150, 120), lop('C', 0, 0)]

let taoBan3D: typeof import('../src/components/bang-tin-san/ban-do-3d-three').taoBan3D
beforeEach(async () => {
  ghi.render = 0; ghi.dispose = 0; ghi.loseCtx = 0; ghi.setSize = []; ghi.khoiTao = 0; ghi.hong = false
  ;({ taoBan3D } = await import('../src/components/bang-tin-san/ban-do-3d-three'))
})
const canvas = () => document.createElement('canvas')

describe('taoBan3D', () => {
  it('không tạo được WebGL (bộ vẽ ném lỗi) ⇒ trả null để màn lùi về 2D', () => {
    ghi.hong = true
    expect(taoBan3D(canvas())).toBeNull()
  })

  it('chưa có kích thước ⇒ KHÔNG vẽ; có kích thước ⇒ vẽ và đặt cỡ; cùng cỡ không đặt lại; raycast trả -1 khi chưa có khung', () => {
    const b = taoBan3D(canvas())!
    b.datMau(MAU)
    b.datLop(DS)
    b.buoc(0.016, true, false)
    expect(ghi.render).toBe(0)
    expect(b.chon(10, 10)).toBe(-1)
    b.doiKichThuoc(400, 300)
    b.doiKichThuoc(400, 300)
    expect(ghi.setSize).toEqual([[400, 300]])
    b.buoc(0.016, true, false)
    expect(ghi.render).toBe(1)
    b.giaiPhong()
  })

  it('nhãn: một vị trí cho MỖI lớp, nằm trong khung; cột CAO hơn ⇒ nhãn cao hơn trên màn (y nhỏ hơn); cột mới hiện NGAY đúng chiều cao', () => {
    const b = taoBan3D(canvas())!
    b.datMau(MAU)
    b.datLop(DS)
    b.doiKichThuoc(600, 400)
    b.buoc(0, false, true)
    const vt = b.vitriNhan(600, 400)
    expect(vt).toHaveLength(3)
    for (const p of vt) { expect(Number.isFinite(p.x)).toBe(true); expect(Number.isFinite(p.y)).toBe(true) }
    // A (300 câu) cao hơn B (150 câu) nhưng cùng hàng z? boTriLop(3) đặt 3 lớp cùng hàng ⇒ so y: A cao hơn ⇒ y nhỏ hơn B
    expect(vt[0]!.y).toBeLessThan(vt[1]!.y)
    expect(vt[1]!.y).toBeLessThan(vt[2]!.y) // C (0 câu) thấp nhất
  })

  it('nội suy chiều cao: giảm chuyển động ⇒ về đích NGAY; cho phép chuyển động ⇒ đuổi theo đích nhưng CHƯA tới; đích đổi ⇒ nhãn di chuyển', () => {
    const b = taoBan3D(canvas())!
    b.datMau(MAU)
    b.datLop([lop('A', 100, 90)])
    b.doiKichThuoc(600, 400)
    b.buoc(0, false, true)
    const y0 = b.vitriNhan(600, 400)[0]!.y
    b.datLop([lop('A', 300, 270)]) // đích cao gấp 3
    b.buoc(0.05, false, false)
    const y1 = b.vitriNhan(600, 400)[0]!.y
    expect(y1).toBeLessThan(y0) // đã lên
    b.buoc(0, false, true) // về đích ngay
    const y2 = b.vitriNhan(600, 400)[0]!.y
    expect(y2).toBeLessThan(y1) // đích còn cao hơn bước nội suy
    b.buoc(0, false, true)
    expect(b.vitriNhan(600, 400)[0]!.y).toBeCloseTo(y2, 6) // đứng yên khi đã tới
  })

  it('cột mới hiện ở ĐÚNG chiều cao ngay (không mọc từ 0): một bước nội suy nhỏ gần như không đổi so với vị trí về đích', () => {
    const b = taoBan3D(canvas())!
    b.datMau(MAU)
    b.datLop([lop('A', 300, 270)])
    b.doiKichThuoc(600, 400)
    b.buoc(0.016, false, false)
    const ynhe = b.vitriNhan(600, 400)[0]!.y
    b.buoc(0, false, true)
    const yden = b.vitriNhan(600, 400)[0]!.y
    expect(Math.abs(ynhe - yden)).toBeLessThan(1)
    b.giaiPhong()
  })

  it('camera xoay CHỈ khi được phép (xoay = true và không giảm chuyển động); rê chuột (xoay = false) hay giảm chuyển động ⇒ đứng yên', () => {
    const b = taoBan3D(canvas())!
    b.datMau(MAU)
    b.datLop(DS)
    b.doiKichThuoc(600, 400)
    b.buoc(0, false, true)
    const x0 = b.vitriNhan(600, 400).map((p) => p.x)
    b.buoc(5, false, false) // dừng xoay (rê chuột)
    expect(b.vitriNhan(600, 400).map((p) => p.x)).toEqual(x0)
    b.buoc(5, true, true) // giảm chuyển động
    expect(b.vitriNhan(600, 400).map((p) => p.x)).toEqual(x0)
    b.buoc(5, true, false) // xoay
    expect(b.vitriNhan(600, 400).map((p) => p.x)).not.toEqual(x0)
    b.giaiPhong()
  })

  it('raycast: con trỏ ở giữa khung trúng một cột (khi cột đủ cao), ngoài khung không trúng; chọn cột không làm hỏng vẽ', () => {
    const b = taoBan3D(canvas())!
    b.datMau(MAU)
    b.datLop([lop('A', 300, 270)])
    b.doiKichThuoc(600, 400)
    b.buoc(0, false, true)
    const p = b.vitriNhan(600, 400)[0]!
    expect(b.chon(p.x, p.y + 40)).toBe(0) // dưới đầu cột ⇒ trên thân cột
    expect(b.chon(2, 2)).toBe(-1)
    b.setChon(0)
    b.buoc(0, false, true)
    b.setChon(-1)
    expect(ghi.render).toBe(2)
  })

  it('đổi lớp: bớt lớp ⇒ bớt cột (vật liệu bị giải phóng); thêm lớp ⇒ thêm cột; không rò', () => {
    const disp = vi.spyOn(Thuc.MeshStandardMaterial.prototype, 'dispose')
    const b = taoBan3D(canvas())!
    b.datMau(MAU)
    b.datLop(DS)
    b.datLop(DS.slice(0, 1))
    expect(disp).toHaveBeenCalledTimes(2) // hai cột thừa
    b.doiKichThuoc(600, 400)
    b.buoc(0, false, true)
    expect(b.vitriNhan(600, 400)).toHaveLength(1)
    b.datLop(DS)
    expect(b.vitriNhan(600, 400)).toHaveLength(3)
    disp.mockRestore()
    b.giaiPhong()
  })

  it('giải phóng: dispose bộ vẽ + forceContextLoss đúng một lần; mọi vật liệu/hình bị dispose', () => {
    const mat = vi.spyOn(Thuc.MeshStandardMaterial.prototype, 'dispose')
    const hinh = vi.spyOn(Thuc.BoxGeometry.prototype, 'dispose')
    const b = taoBan3D(canvas())!
    b.datMau(MAU)
    b.datLop(DS)
    b.giaiPhong()
    expect(ghi.dispose).toBe(1)
    expect(ghi.loseCtx).toBe(1)
    expect(mat.mock.calls.length).toBeGreaterThanOrEqual(4) // 3 cột + sàn
    expect(hinh.mock.calls.length).toBeGreaterThanOrEqual(1)
    mat.mockRestore(); hinh.mockRestore()
  })

  it('đổi sáng/tối ⇒ datMau không ném và vẽ lại được (màu vật liệu đọc từ token)', () => {
    const b = taoBan3D(canvas())!
    b.datLop(DS) // datLop trước datMau: cột chưa có màu token vẫn không ném
    b.datMau(MAU)
    b.datMau(TOI)
    b.doiKichThuoc(300, 200)
    expect(() => b.buoc(0.016, true, false)).not.toThrow()
    b.giaiPhong()
  })
})
