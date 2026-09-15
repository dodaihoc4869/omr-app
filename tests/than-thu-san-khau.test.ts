/**
 * SÂN KHẤU VÀ CHIÊU THỨC — KHOÁ LẠI BỐN LỖI CHỈ NHÌN ẢNH MỚI THẤY.
 *
 * Thầy chốt 15-09: *"nền xung quanh của thần thú tràn ra tất cả ô mà thần thú
 * đó đứng"*, *"chưởng cuồng nộ phải mãnh liệt dữ dội đẹp mắt và thật ngầu"* và
 * *"để nền và thú trọn vẹn không dính chữ gì"*.
 *
 * Bốn lỗi đã sửa, nay mỗi lỗi một phép kiểm:
 *  1. Khoảng lùi máy quay đo MỘT LẦN lúc gắn. Thẻ nở ra sau đó thì con thú
 *     phình to và cụt chân — `khopKhung()` phải tính lại theo tỷ lệ khung mới.
 *  2. Đạn bay 4,4 đơn vị, sát ống kính: quả chưởng phình kín góc màn. Điểm nổ
 *     phải nằm trong tầm nhìn, không quá 3 đơn vị.
 *  3. Đường đạn bắn thẳng vào mặt thú — phải chếch sang bên để không che mặt.
 *  4. Chưởng cuồng nộ chỉ khác chưởng thường ở chỗ phóng to. Nay phải khác ở
 *     BỐN thứ đo được: chớp loá, sóng loang đất, đèn loé, số mảnh vỡ.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import * as THREE from 'three'
import { ChieuThuc3D } from '../src/game/than-thu-hoa-hoc/chieu-thuc-3d'
import { dungCanh3D } from '../src/game/than-thu-hoa-hoc/canh-3d-chung'
import { DANH_SACH_THAN_THU } from '../src/game/than-thu-hoa-hoc/he-thong-pet'
import { DS_HE } from '../src/game/than-thu-hoa-hoc/tuong-khac'

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

/** Chạy chiêu bằng đồng hồ giả tới đúng pha muốn xem. */
function chayToi(c: ChieuThuc3D, pha: number, cuongNo: boolean, yDat = -1.66): void {
  c.ban(new THREE.Vector3(0, 0.2, 1.3), cuongNo, yDat)
  const dai = cuongNo ? 1.95 : 1.4
  const soBuoc = Math.max(1, Math.round((pha * dai) / (1 / 60)))
  for (let i = 0; i < soBuoc; i++) c.capNhat(1 / 60)
}

/** Gom mọi mesh đang hiện, kèm vị trí trong hệ toạ độ thế giới. */
function dangHien(c: ChieuThuc3D): THREE.Mesh[] {
  const ra: THREE.Mesh[] = []
  c.doiTuong.updateMatrixWorld(true)
  c.doiTuong.traverse((o) => {
    if ((o as THREE.Mesh).isMesh === true && o.visible) ra.push(o as THREE.Mesh)
  })
  return ra
}

describe('Khớp khung khi thẻ co giãn', () => {
  it('đổi tỷ lệ khung thì khoảng lùi máy quay đổi theo', () => {
    const kc = dungCanh3D(DANH_SACH_THAN_THU['loi_kim']!, 6, 1.5, 3)
    const xaRong = kc.xaThat
    // Khung hẹp và cao: bề ngang ít chỗ hơn nên máy quay PHẢI lùi xa thêm.
    kc.may.aspect = 0.5
    kc.khopKhung()
    expect(kc.xaThat).toBeGreaterThan(xaRong)
    // Trả về khung rộng thì lùi lại đúng chỗ cũ — phép tính không trôi.
    kc.may.aspect = 1.5
    kc.khopKhung()
    expect(kc.xaThat).toBeCloseTo(xaRong, 6)
    kc.don()
  })
})

describe('Đường chưởng nằm gọn trong sân khấu', () => {
  for (const he of DS_HE) {
    const info = Object.values(DANH_SACH_THAN_THU).find((t) => t.he === he)!
    it(`hệ ${he}: mọi thứ hiện ra đều trong tầm nhìn`, () => {
      const c = new ChieuThuc3D(info)
      for (const pha of [0.15, 0.5, 0.75, 0.9]) {
        chayToi(c, pha, true)
        for (const m of dangHien(c)) {
          const v = new THREE.Vector3().setFromMatrixPosition(m.matrixWorld)
          // Miệng ở z = 1,3, máy quay lùi ít nhất 4,6. Điểm nổ cộng đà mảnh vỡ
          // phải còn trong khung: bản cũ bắn xa 4,4 thì mảnh văng tới ~7,3 —
          // tức là xuyên qua ống kính, đúng cái lỗi "quả chưởng phình kín màn".
          expect(v.z).toBeLessThan(6)
          expect(Math.abs(v.x)).toBeLessThan(5)
        }
      }
      c.dispose()
    })
  }
})

describe('Chưởng cuồng nộ khác hẳn chưởng thường', () => {
  const info = DANH_SACH_THAN_THU['loi_kim']!

  it('rung máy quay mạnh hơn gấp đôi', () => {
    const c = new ChieuThuc3D(info)
    chayToi(c, 0.8, false)
    const thuong = c.manhNo
    chayToi(c, 0.8, true)
    expect(c.manhNo).toBeGreaterThan(thuong * 2)
    c.dispose()
  })

  it('chỉ cuồng nộ mới có chớp loá và sóng loang mặt đất', () => {
    const c = new ChieuThuc3D(info)
    chayToi(c, 0.75, false)
    const soThuong = dangHien(c).length
    chayToi(c, 0.75, true)
    const soNo = dangHien(c).length
    // Gấp đôi mảnh vỡ + chớp + sóng đất: phải nhiều hơn hẳn, không nhích một hai.
    expect(soNo).toBeGreaterThan(soThuong + 8)
    c.dispose()
  })

  it('cuồng nộ có quầng nộ lúc dồn lực, chưởng thường thì không', () => {
    const c = new ChieuThuc3D(info)
    chayToi(c, 0.12, false)
    const thuong = dangHien(c).length
    chayToi(c, 0.12, true)
    expect(dangHien(c).length).toBeGreaterThan(thuong)
    c.dispose()
  })
})

describe('Vũng acid và sóng loang bám mặt sàn', () => {
  it('không lơ lửng ngang mõm thú', () => {
    const c = new ChieuThuc3D(DANH_SACH_THAN_THU['thuy_quai']!)
    // Bàn chân thấp hơn mõm 1,66 đơn vị.
    chayToi(c, 0.78, true, -1.66)
    c.doiTuong.updateMatrixWorld(true)
    const thap = dangHien(c)
      .map((m) => new THREE.Vector3().setFromMatrixPosition(m.matrixWorld).y)
      .sort((a, b) => a - b)[0]!
    // Mõm ở y = 0,2 nên sàn ở y ≈ −1,46. Phải có thứ nằm sát sàn.
    expect(thap).toBeLessThan(-1.2)
    c.dispose()
  })
})


/**
 * CHẠM PHẢI XUYÊN QUA LỚP CHỮ MÀ TỚI ĐƯỢC CẢNH 3D.
 *
 * Thầy báo 15-09: *"xoay thú 360 độ bản mới không xoay được"*. Nguyên nhân:
 * lớp nội dung `z-10` chính là thứ quyết định chiều cao sân khấu, nên nó phủ
 * KÍN sân khấu và nuốt sạch cú chạm–kéo trước khi tới lớp canvas bên dưới.
 *
 * Đây là phép kiểm ĐỌC MÃ, yếu hơn phép kiểm hành vi — jsdom không tính bố cục
 * CSS nên không dựng lại được cảnh này. Hành vi thật đã đo bằng trình duyệt
 * (Chromium, 15-09): `document.elementFromPoint` ở giữa sân khấu trả về
 * `CANVAS`, và một cú kéo ngang 224 px làm ảnh dựng đổi — tức xoay được.
 */
describe('Lớp chữ không được nuốt cú chạm của sân khấu', () => {
  const ma = readFileSync(resolve(process.cwd(), 'src/components/ThanThuHoaHocGame.tsx'), 'utf8')

  it('lớp nội dung sân khấu cho chạm xuyên qua khi đang dựng 3D', () => {
    expect(ma).toContain("dung3D ? 'pointer-events-none' : ''")
  })

  it('hai nút chiêu bật lại nhận chạm, nếu không thì bấm chiêu cũng chết theo', () => {
    const so = ma.split('pointer-events-auto shrink-0 w-12 h-12').length - 1
    expect(so).toBe(2)
  })
})
