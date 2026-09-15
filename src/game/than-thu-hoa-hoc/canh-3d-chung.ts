/**
 * MỘT NGUỒN DỰNG CẢNH 3D — dùng chung cho màn game và cho ảnh chụp tờ chiếu.
 *
 * Thầy chốt 15-09: *"Thần thú hiện lên bảng phải giống y hệt với trong mục thần
 * thú nhé."*
 *
 * ───────────────────────────────────────────────────────────────────────────
 * VÌ SAO PHẢI TÁCH RA. Bản đầu vẽ ảnh cho tờ chiếu bằng bộ canvas 2D, còn màn
 * game dựng bằng three.js — hai bộ vẽ khác nhau thì ra hai con thú khác nhau,
 * không cách nào giống được. Nay CẢ HAI gọi đúng hàm này: cùng hình khối, cùng
 * bộ lông, cùng khung cảnh, cùng ba ngọn đèn, cùng phép khớp khung máy quay.
 * Sửa một chỗ là hai nơi đổi theo — không có đường nào để chúng lệch nhau.
 *
 * Hàm này KHÔNG tạo renderer. Màn game cần renderer gắn vào DOM và chạy vòng
 * lặp; ảnh chụp cần renderer ngoài màn hình vẽ đúng một khung rồi đọc ra PNG.
 * Ai cần gì tự dựng, nhưng cảnh thì chung.
 */

import * as THREE from 'three'
import { dungThanThu3D, donBoThanThu3D, type BoThanThu3D } from './dung-than-thu-3d'
import { dungCanhNen, donCanhNen, type BoCanhNen } from './canh-nen-3d'
import type { ThanThuInfo } from './he-thong-pet'

/** Góc thú quay sẵn khi mở màn — ảnh chụp phải dùng đúng góc này. */
export const GOC_MO_MAN = 0.35
/** Độ rủ của ngọn lông lúc thú đứng yên. */
export const RU_LONG_DUNG_YEN = -0.055

export interface BoCanh3D {
  canh: THREE.Scene
  may: THREE.PerspectiveCamera
  bo: BoThanThu3D
  nen: BoCanhNen
  /** Tâm hộp bao — máy quay nhìn vào đây. */
  tam: THREE.Vector3
  /** Cỡ hộp bao. Giữ lại để tính LẠI khung khi ô chứa đổi tỉ lệ. */
  co: THREE.Vector3
  /** Khoảng lùi của máy quay, đã tính cả sàn tối thiểu. */
  xaThat: number
  yMay: number
  /**
   * Tính lại khoảng lùi theo tỉ lệ khung HIỆN TẠI của máy quay.
   *
   * Bắt buộc gọi khi ô chứa đổi cỡ. Bản trước tính đúng một lần lúc gắn: màn
   * 3D lấp đầy thẻ thì thẻ cao lên theo nội dung SAU khi gắn, tỉ lệ khung đổi
   * mà khoảng lùi giữ nguyên — thú phình to và bị cắt mất chân.
   */
  khopKhung(): void
  don(): void
}

/**
 * Dựng cảnh đầy đủ cho một thần thú ở một cấp.
 *
 * `tyLe` là tỉ lệ rộng/cao của khung vẽ — phép khớp khung cần nó để cấp nào
 * cũng vừa khung, cả khung ngang của màn game lẫn khung vuông của tờ chiếu.
 */
export function dungCanh3D(
  info: ThanThuInfo,
  cap: number,
  tyLe: number,
  soLop?: number,
): BoCanh3D {
  const canh = new THREE.Scene()
  const may = new THREE.PerspectiveCamera(42, tyLe, 0.1, 100)

  const bo = dungThanThu3D(info, cap, soLop)
  canh.add(bo.goc)

  // ── Đo hộp bao để đặt sàn và lùi máy quay cho vừa khung ──
  const hop = new THREE.Box3().setFromObject(bo.goc)
  const co = hop.getSize(new THREE.Vector3())
  const tam = hop.getCenter(new THREE.Vector3())
  // Mặt sàn đặt theo BÀN CHÂN thú, không theo đáy hộp bao: vòng lửa cấp 12
  // và vòng rune nằm thấp hơn bàn chân, lấy đáy hộp bao thì thú lơ lửng.
  const dayNen = bo.chanY
  // Thú xoay quanh trục đứng nên bề ngang lúc quay là cạnh dài nhất của X và Z.
  const ngang = Math.max(co.x, co.z)
  const tinhXa = (tyLeKhung: number): number => {
    const fovY = (may.fov * Math.PI) / 180
    const fovX = 2 * Math.atan(Math.tan(fovY / 2) * tyLeKhung)
    const xa = Math.max(co.y / 2 / Math.tan(fovY / 2), ngang / 2 / Math.tan(fovX / 2)) * 1.2
      + ngang / 2
    // Sàn tối thiểu: quả trứng cấp 1 bé nên phép khớp khung kéo máy quay sát
    // tận nơi, trứng chiếm trọn khung và mất hết khung cảnh. Lùi tối thiểu 4,6.
    return Math.max(xa, 4.6)
  }
  const khung = { xa: tinhXa(tyLe), y: tam.y + co.y * 0.08 }

  // ── KHUNG CẢNH riêng của hệ: trời, sương mù, sàn, hạt, đạo cụ ──
  const nen = dungCanhNen(info.he, dayNen - 0.02)
  canh.background = nen.troi
  canh.fog = nen.suongMu
  canh.add(nen.nhom)

  // ÁNH SÁNG — ba nguồn ăn màu theo cảnh: đèn chính tạo khối, đèn phụ vớt
  // bóng, đèn viền tách bộ lông khỏi nền tối.
  canh.add(new THREE.AmbientLight(nen.denChinh, nen.moiTruong))
  const chinh = new THREE.DirectionalLight(nen.denChinh, 1.85)
  chinh.position.set(3.2, 5.4, 4.6)
  chinh.castShadow = true
  chinh.shadow.mapSize.set(1024, 1024)
  chinh.shadow.camera.near = 0.5
  chinh.shadow.camera.far = 24
  canh.add(chinh)
  const phu = new THREE.DirectionalLight(nen.denPhu, 0.72)
  phu.position.set(-4.2, 1.4, 2.2)
  canh.add(phu)
  // Đèn viền đặt SAU thú: viền sáng chạy dọc mép lông là thứ làm lông trông
  // tơi và mềm; thiếu nó thì bộ lông chỉ là mảng màu tối.
  const vien = new THREE.PointLight(nen.denVien, 34, 16)
  vien.position.set(-1.8, tam.y + 2.2, -3.8)
  canh.add(vien)

  return {
    canh, may, bo, nen, tam, co,
    get xaThat() { return khung.xa },
    get yMay() { return khung.y },
    khopKhung() { khung.xa = tinhXa(may.aspect) },
    don() {
      donBoThanThu3D(bo)
      donCanhNen(nen)
    },
  }
}

/**
 * Đặt thú vào ĐÚNG dáng đứng yên lúc mở màn: góc quay sẵn, lông rủ theo trọng
 * lực, máy quay vào chỗ. Ảnh chụp gọi hàm này để trùng khít với màn game.
 */
export function datDangDungYen(b: BoCanh3D): void {
  b.bo.goc.rotation.y = GOC_MO_MAN
  const ru = new THREE.Vector3(0, RU_LONG_DUNG_YEN, 0)
  for (const l of b.bo.long) l.ruLong(ru)
  b.nen.capNhat(0, 0)
  b.may.position.set(0, b.yMay, b.xaThat)
  b.may.lookAt(0, b.tam.y, 0)
}
