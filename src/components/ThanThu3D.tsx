/**
 * MÀN 3D CỦA THẦN THÚ — WebGL thật bằng three.js.
 *
 * Thầy chốt 15-09: thú phải 3D, chiêu bấm vào phải tung ra thật, làm kỹ như
 * game nuôi thú hoạt hoạ.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * BA ĐIỀU PHẢI GIỮ, vì đây là app cho 300 em dùng điện thoại:
 *
 * 1. **Có đường lui.** Máy không dựng được WebGL (máy cũ, trình duyệt tắt tăng
 *    tốc phần cứng, jsdom lúc chạy phép kiểm) thì gọi `onKhongDungDuoc` để màn
 *    cha quay về canvas 2D — chứ không để em nhìn một ô trống.
 * 2. **Dừng khi không nhìn.** Rời tab hoặc cuộn khỏi màn thì ngừng vòng lặp;
 *    một vòng lặp WebGL chạy ngầm là pin điện thoại bốc hơi.
 * 3. **Dọn sạch.** Three không tự trả bộ nhớ GPU. Rời màn là dispose tất.
 *
 * Nặng khoảng 600 KB nên tệp này được nhập kiểu `lazy` — chỉ tải khi em thật sự
 * mở Đảo Thần Thú, không nằm trong gói khởi động.
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { dungThanThu3D, donBoThanThu3D, type BoThanThu3D } from '../game/than-thu-hoa-hoc/dung-than-thu-3d'
import { ChieuThuc3D } from '../game/than-thu-hoa-hoc/chieu-thuc-3d'
import type { ThanThuInfo } from '../game/than-thu-hoa-hoc/he-thong-pet'

export interface LenhChieu {
  /** Tăng lên mỗi lần bấm — đổi là bắn. */
  lan: number
  no: boolean
}

export default function ThanThu3D({
  info,
  cap,
  lenhChieu,
  onCham,
  onKhongDungDuoc,
  cao = 300,
}: {
  info: ThanThuInfo
  cap: number
  lenhChieu: LenhChieu
  /** Chạm vào thú (không phải kéo) — màn cha cho nó kêu. */
  onCham?: () => void
  /** Máy không dựng được WebGL. */
  onKhongDungDuoc?: () => void
  cao?: number
}) {
  const boc = useRef<HTMLDivElement | null>(null)
  const lenhRef = useRef(lenhChieu)
  const chamRef = useRef(onCham)
  useEffect(() => { lenhRef.current = lenhChieu }, [lenhChieu])
  useEffect(() => { chamRef.current = onCham }, [onCham])

  useEffect(() => {
    const oBoc = boc.current
    if (oBoc === null) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      onKhongDungDuoc?.()
      return
    }
    // Trình duyệt có thể trả renderer rồi mới hỏng ngữ cảnh.
    if (renderer.getContext() === null) {
      renderer.dispose()
      onKhongDungDuoc?.()
      return
    }

    const rong = Math.max(200, oBoc.clientWidth || 320)
    renderer.setSize(rong, cao)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    oBoc.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.cursor = 'grab'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = 'auto'

    const canh = new THREE.Scene()
    const may = new THREE.PerspectiveCamera(42, rong / cao, 0.1, 100)
    may.position.set(0, 0.55, 6.1)
    may.lookAt(0, 0, 0)

    // ÁNH SÁNG — ba nguồn, đúng lối dựng sáng ba điểm của phim hoạt hình:
    // đèn chính tạo khối, đèn phụ vớt bóng, đèn viền tách thú khỏi nền.
    canh.add(new THREE.AmbientLight(0xffffff, 0.62))
    const chinh = new THREE.DirectionalLight(0xffffff, 1.5)
    chinh.position.set(3.2, 5.4, 4.6)
    chinh.castShadow = true
    chinh.shadow.mapSize.set(1024, 1024)
    chinh.shadow.camera.near = 0.5
    chinh.shadow.camera.far = 22
    canh.add(chinh)
    const phu = new THREE.DirectionalLight(0xbfdbfe, 0.5)
    phu.position.set(-4, 1.4, 2.2)
    canh.add(phu)
    const vien = new THREE.PointLight(0xffffff, 26, 14)
    vien.position.set(-1.6, 2.2, -3.4)
    canh.add(vien)

    // Nền hứng bóng — trong suốt, chỉ để lấy bóng đổ.
    const gNen = new THREE.PlaneGeometry(14, 14)
    const mNen = new THREE.ShadowMaterial({ opacity: 0.2 })
    const nen = new THREE.Mesh(gNen, mNen)
    nen.rotation.x = -Math.PI / 2
    nen.position.y = -1.42
    nen.receiveShadow = true
    canh.add(nen)

    let bo: BoThanThu3D = dungThanThu3D(info, cap)
    canh.add(bo.goc)

    const chieu = new ChieuThuc3D(info)
    bo.goc.add(chieu.doiTuong)

    // ── Xoay bằng ngón tay ──
    let gocY = 0.35
    let daQuan = 0
    let keo = false
    let xTruoc = 0
    let vanToc = 0
    const el = renderer.domElement
    const xuong = (e: PointerEvent) => {
      keo = true; xTruoc = e.clientX; daQuan = 0; vanToc = 0
      el.setPointerCapture(e.pointerId)
      el.style.cursor = 'grabbing'
    }
    const chuyen = (e: PointerEvent) => {
      if (!keo) return
      const dx = e.clientX - xTruoc
      xTruoc = e.clientX
      daQuan += Math.abs(dx)
      vanToc = dx * 0.006
      gocY += vanToc
    }
    const len = () => {
      if (!keo) return
      keo = false
      el.style.cursor = 'grab'
      if (daQuan < 6) chamRef.current?.()
    }
    el.addEventListener('pointerdown', xuong)
    el.addEventListener('pointermove', chuyen)
    el.addEventListener('pointerup', len)
    el.addEventListener('pointercancel', len)

    // ── Chỉ chạy khi thật sự nhìn thấy ──
    let hien = true
    const theoDoi = new IntersectionObserver(
      (mucs) => { hien = mucs[0]?.isIntersecting ?? true },
      { threshold: 0.05 },
    )
    theoDoi.observe(oBoc)
    const doiTab = () => { hien = !document.hidden }
    document.addEventListener('visibilitychange', doiTab)

    let lanCuoi = lenhRef.current.lan
    let id = 0
    let truoc = performance.now()
    let rungConLai = 0

    const ve = (now: number) => {
      id = requestAnimationFrame(ve)
      const dt = Math.min(0.05, (now - truoc) / 1000)
      truoc = now
      if (!hien) return
      const t = now / 1000

      // Bấm nút chiêu ở màn cha → bắn.
      const lenh = lenhRef.current
      if (lenh.lan !== lanCuoi) {
        lanCuoi = lenh.lan
        chieu.ban(bo.mieng)
        if (lenh.no) bo.goc.scale.setScalar(1.1)
      }
      chieu.capNhat(dt)
      if (chieu.vuaNo) rungConLai = 0.22

      // Quán tính xoay: thả tay ra thì thú quay trôi rồi tự dừng.
      if (!keo) {
        gocY += vanToc
        vanToc *= 0.94
        if (Math.abs(vanToc) < 0.0002) vanToc = 0
      }
      bo.goc.rotation.y = gocY

      // Thở: squash-and-stretch, thể tích giữ gần như không đổi.
      const donLuc = chieu.donLuc
      const tho = Math.sin(t * 2.1) * 0.035
      const thu = donLuc * 0.16
      bo.than.scale.set(1 + tho + thu * 0.6, 1 - tho - thu, 1 + tho + thu * 0.6)
      bo.goc.position.y = Math.sin(t * 2.1 + 0.6) * 0.055 - thu * 0.2
      bo.goc.scale.lerp(new THREE.Vector3(1, 1, 1), 0.08)

      if (bo.duoi !== null) bo.duoi.rotation.y = Math.sin(t * 1.7) * 0.42
      const vayCanh = Math.sin(t * 3.4) * 0.34
      if (bo.canhTrai !== null) bo.canhTrai.rotation.z = vayCanh
      if (bo.canhPhai !== null) bo.canhPhai.rotation.z = -vayCanh
      for (const [i, v] of bo.vongXoay.entries()) {
        v.rotation.y += dt * (i % 2 === 0 ? 0.75 : -0.5)
      }

      // Rung máy quay một nhịp khi chiêu nổ.
      if (rungConLai > 0) {
        rungConLai = Math.max(0, rungConLai - dt)
        may.position.x = (Math.random() - 0.5) * rungConLai * 0.8
        may.position.y = 0.55 + (Math.random() - 0.5) * rungConLai * 0.8
      } else {
        may.position.x = 0
        may.position.y = 0.55
      }
      may.lookAt(0, 0, 0)

      renderer.render(canh, may)
    }
    id = requestAnimationFrame(ve)

    const doiCo = () => {
      const w = Math.max(200, oBoc.clientWidth || 320)
      may.aspect = w / cao
      may.updateProjectionMatrix()
      renderer.setSize(w, cao)
    }
    window.addEventListener('resize', doiCo)

    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', doiCo)
      document.removeEventListener('visibilitychange', doiTab)
      theoDoi.disconnect()
      el.removeEventListener('pointerdown', xuong)
      el.removeEventListener('pointermove', chuyen)
      el.removeEventListener('pointerup', len)
      el.removeEventListener('pointercancel', len)
      chieu.dispose()
      donBoThanThu3D(bo)
      gNen.dispose()
      mNen.dispose()
      renderer.dispose()
      if (el.parentNode !== null) el.parentNode.removeChild(el)
    }
  }, [info, cap, cao, onKhongDungDuoc])

  return <div ref={boc} className="w-full flex items-center justify-center" style={{ minHeight: cao }} />
}
