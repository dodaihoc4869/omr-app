/**
 * CHIÊU THỨC BAY RA THẬT.
 *
 * Thầy chốt 15-09: "các chưởng khi bấm vào phải tung ra thật".
 *
 * Một chiêu gồm ba pha, tổng 1,5 giây:
 *   1. DỒN LỰC (0 → 0,22)  — thú thu người lại, quả cầu năng lượng tụ ở miệng
 *   2. BAY     (0,22 → 0,72) — quả cầu lao về phía trước, để lại vệt hạt
 *   3. NỔ      (0,72 → 1)  — bung thành vòng sóng xung kích và mảnh vỡ
 *
 * Mỗi hệ một hình dạng đạn, dựng từ chính chất của hệ — không phải đổi màu suông:
 *   Hoả      cầu lửa méo, vệt dài
 *   Khí      xoáy khí mỏng, quay nhanh
 *   Base     khối tinh thể tám mặt
 *   Acid     giọt nhọn, nhỏ giọt
 *   Điện hoá tia gấp khúc
 *   Hữu cơ   chuỗi hạt nối nhau
 *
 * Toàn bộ geometry và material tạo MỘT LẦN rồi dùng lại — mỗi lần bấm chiêu mà
 * dựng mới là rò bộ nhớ GPU, và em bấm liên tục.
 */

import * as THREE from 'three'
import { mauTuChuoi } from './dung-than-thu-3d'
import type { ThanThuInfo } from './he-thong-pet'

const DAI_CHIEU = 1.5
const MOC_BAY = 0.22
const MOC_NO = 0.72
const SO_MANH = 18
const XA = 4.2

function hinhDan(he: string): THREE.BufferGeometry {
  switch (he) {
    case 'khi': return new THREE.TorusGeometry(0.2, 0.07, 10, 20)
    case 'kiem': return new THREE.OctahedronGeometry(0.24, 0)
    case 'axit': return new THREE.ConeGeometry(0.17, 0.5, 14)
    case 'dien': return new THREE.TetrahedronGeometry(0.26, 0)
    case 'huuco': return new THREE.CapsuleGeometry(0.13, 0.26, 6, 12)
    default: return new THREE.SphereGeometry(0.24, 20, 16)
  }
}

export class ChieuThuc3D {
  private nhom = new THREE.Group()
  private dan: THREE.Mesh
  private manh: THREE.Mesh[] = []
  private song: THREE.Mesh
  private hao: THREE.Mesh
  private rac: (THREE.BufferGeometry | THREE.Material)[] = []
  private t = -1
  private no = false

  /** `erasableSyntaxOnly` của kho cấm tham số-thuộc-tính, nên khai riêng. */
  private info: ThanThuInfo

  constructor(info: ThanThuInfo) {
    this.info = info
    const mau = mauTuChuoi(info.mauPhu)
    const gDan = hinhDan(info.he)
    const mDan = new THREE.MeshBasicMaterial({ color: mau, transparent: true })
    this.rac.push(gDan, mDan)
    this.dan = new THREE.Mesh(gDan, mDan)
    this.nhom.add(this.dan)

    // Hào quang bọc quanh đạn — cùng geometry, phóng to và mờ.
    const mHao = new THREE.MeshBasicMaterial({
      color: mau, transparent: true, opacity: 0.32, depthWrite: false,
    })
    this.rac.push(mHao)
    this.hao = new THREE.Mesh(gDan, mHao)
    this.hao.scale.setScalar(2.1)
    this.dan.add(this.hao)

    const gManh = new THREE.SphereGeometry(0.075, 8, 6)
    const mManh = new THREE.MeshBasicMaterial({ color: mau, transparent: true })
    this.rac.push(gManh, mManh)
    for (let i = 0; i < SO_MANH; i++) {
      const m = new THREE.Mesh(gManh, mManh)
      m.visible = false
      this.nhom.add(m)
      this.manh.push(m)
    }

    const gSong = new THREE.TorusGeometry(0.5, 0.055, 10, 36)
    const mSong = new THREE.MeshBasicMaterial({
      color: mau, transparent: true, depthWrite: false,
    })
    this.rac.push(gSong, mSong)
    this.song = new THREE.Mesh(gSong, mSong)
    this.song.visible = false
    this.nhom.add(this.song)

    this.nhom.visible = false
  }

  get doiTuong(): THREE.Object3D { return this.nhom }
  get dangChay(): boolean { return this.t >= 0 }
  /** Pha dồn lực — thân thú thu lại trong lúc này. */
  get donLuc(): number { return this.t >= 0 && this.t < MOC_BAY ? 1 - this.t / MOC_BAY : 0 }
  /** Đúng khung hình nổ, để bên ngoài rung màn hình một nhịp. */
  get vuaNo(): boolean { return this.no }

  ban(tu: THREE.Vector3): void {
    this.t = 0
    this.no = false
    this.nhom.position.copy(tu)
    this.nhom.visible = true
    this.song.visible = false
    for (const m of this.manh) m.visible = false
  }

  /** Gọi mỗi khung hình. `dt` tính bằng giây. */
  capNhat(dt: number): void {
    if (this.t < 0) return
    this.no = false
    const truoc = this.t
    this.t += dt / DAI_CHIEU
    if (this.t >= 1) {
      this.t = -1
      this.nhom.visible = false
      return
    }
    const t = this.t
    const mDan = this.dan.material as THREE.MeshBasicMaterial
    const mSong = this.song.material as THREE.MeshBasicMaterial
    const mManh = this.manh[0]!.material as THREE.MeshBasicMaterial

    if (t < MOC_BAY) {
      // Dồn lực: đạn phình từ 0 lên, đứng yên tại miệng.
      const u = t / MOC_BAY
      this.dan.visible = true
      this.dan.position.z = 0
      this.dan.scale.setScalar(0.15 + u * 0.95)
      mDan.opacity = u
      this.dan.rotation.z += dt * 9
    } else if (t < MOC_NO) {
      // Bay: lao thẳng về phía trước, xoay theo hệ.
      const u = (t - MOC_BAY) / (MOC_NO - MOC_BAY)
      this.dan.visible = true
      this.dan.position.z = u * XA
      this.dan.scale.setScalar(1.1 + u * 0.35)
      mDan.opacity = 1
      this.dan.rotation.z += dt * (this.info.he === 'khi' ? 22 : 7)
      this.dan.rotation.x += dt * (this.info.he === 'dien' ? 18 : 3)
    } else {
      // Nổ.
      if (truoc < MOC_NO) {
        this.no = true
        this.song.position.z = XA
        this.song.visible = true
        for (const [i, m] of this.manh.entries()) {
          const a = (i / SO_MANH) * Math.PI * 2
          const nghieng = (i % 3 - 1) * 0.55
          m.position.set(0, 0, XA)
          m.userData.huong = new THREE.Vector3(
            Math.cos(a), Math.sin(a) * 0.8 + nghieng * 0.3, Math.sin(nghieng) * 0.6,
          ).normalize()
          m.visible = true
        }
      }
      const u = (t - MOC_NO) / (1 - MOC_NO)
      this.dan.visible = false
      this.song.scale.setScalar(0.4 + u * 3.6)
      mSong.opacity = 0.9 * (1 - u)
      for (const m of this.manh) {
        const huong = m.userData.huong as THREE.Vector3 | undefined
        if (huong !== undefined) m.position.addScaledVector(huong, dt * 3.4)
      }
      mManh.opacity = 1 - u
    }
  }

  dispose(): void {
    for (const r of this.rac) r.dispose()
    this.rac.length = 0
    this.nhom.clear()
  }
}
