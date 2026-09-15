/**
 * MÀN 3D CỦA THẦN THÚ — WebGL thật bằng three.js.
 *
 * Thầy chốt 15-09: thú phải đáng yêu, lông mịn, và "mỗi con phải xuất hiện ở
 * một khung cảnh phù hợp khác nhau, không để hình nền trắng".
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
 * MÁY QUAY TỰ ĐO. Bản trước đặt cứng `z = 6,1`: cấp 1 thì thú bé tí giữa khung,
 * cấp 12 thì vương miện và vòng rune bị cắt cụt. Bản này đo hộp bao con thú rồi
 * lùi máy quay đúng khoảng cần — cấp nào cũng vừa khung, và mặt sàn đặt đúng
 * đáy hộp bao nên thú ĐỨNG trên sàn chứ không lơ lửng.
 *
 * Nặng khoảng 600 KB nên tệp này được nhập kiểu `lazy` — chỉ tải khi em thật sự
 * mở Đảo Thần Thú, không nằm trong gói khởi động.
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { dungThanThu3D, donBoThanThu3D, type BoThanThu3D } from '../game/than-thu-hoa-hoc/dung-than-thu-3d'
import { dungCanhNen, donCanhNen, type BoCanhNen } from '../game/than-thu-hoa-hoc/canh-nen-3d'
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
  const nhan = useRef<HTMLSpanElement | null>(null)
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.06
    oBoc.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.cursor = 'grab'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = 'auto'
    renderer.domElement.style.display = 'block'

    const canh = new THREE.Scene()
    const may = new THREE.PerspectiveCamera(42, rong / cao, 0.1, 100)

    let bo: BoThanThu3D = dungThanThu3D(info, cap)
    canh.add(bo.goc)

    // ── Đo hộp bao để đặt sàn và lùi máy quay cho vừa khung ──
    const hop = new THREE.Box3().setFromObject(bo.goc)
    const co = hop.getSize(new THREE.Vector3())
    const tam = hop.getCenter(new THREE.Vector3())
    // Mặt sàn đặt theo BÀN CHÂN thú, không theo đáy hộp bao: vòng lửa cấp 12
    // và vòng rune nằm thấp hơn bàn chân, lấy đáy hộp bao thì thú lơ lửng.
    const dayNen = bo.chanY
    const fovY = (may.fov * Math.PI) / 180
    const fovX = 2 * Math.atan(Math.tan(fovY / 2) * may.aspect)
    // Thú xoay quanh trục đứng nên bề ngang lúc quay là cạnh dài nhất của X và Z.
    const ngang = Math.max(co.x, co.z)
    const xa = Math.max(co.y / 2 / Math.tan(fovY / 2), ngang / 2 / Math.tan(fovX / 2)) * 1.2
      + ngang / 2
    // Sàn tối thiểu: quả trứng cấp 1 bé nên phép khớp khung kéo máy quay sát
    // tận nơi, trứng chiếm trọn khung và mất hết khung cảnh. Lùi tối thiểu 4,6.
    const xaThat = Math.max(xa, 4.6)
    const yMay = tam.y + co.y * 0.08

    // ── KHUNG CẢNH riêng của hệ: trời, sương mù, sàn, hạt, đạo cụ ──
    const nen: BoCanhNen = dungCanhNen(info.he, dayNen - 0.02)
    canh.background = nen.troi
    canh.fog = nen.suongMu
    canh.add(nen.nhom)
    if (nhan.current !== null) nhan.current.textContent = nen.ten

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
    let chopTiep = 2.2
    let dangChop = -1
    const huongLong = new THREE.Vector3()
    const dich = new THREE.Vector3()

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

      // LÔNG MỀM: ngọn lông rủ xuống vì trọng lực, và trượt ngược chiều xoay vì
      // quán tính. Đây là thứ phân biệt "bộ lông" với "lớp sơn xù".
      huongLong.set(
        -vanToc * 2.6 + Math.sin(t * 1.3) * 0.012,
        -0.055 - Math.abs(vanToc) * 0.5 - thu * 0.1,
        Math.cos(t * 0.9) * 0.01,
      )
      for (const l of bo.long) l.ruLong(huongLong)

      // Đầu gật gù nhẹ — trứng thì không, vì trứng lấy chính thân làm đầu.
      if (bo.dau !== bo.than) {
        bo.dau.rotation.z = Math.sin(t * 1.15) * 0.052
        bo.dau.rotation.x = Math.sin(t * 0.83) * 0.036
        bo.dau.position.y = 0.5 + Math.sin(t * 2.1 + 0.9) * 0.028
      }

      // Chớp mắt: hai đến sáu giây một lần, dẹt xuống rồi bật lại trong 0,14 s.
      if (dangChop < 0) {
        chopTiep -= dt
        if (chopTiep <= 0) { dangChop = 0; chopTiep = 2 + Math.random() * 4 }
      } else {
        dangChop += dt
        if (dangChop > 0.14) { dangChop = -1 }
      }
      const mo = dangChop < 0 ? 1 : Math.abs(Math.cos((dangChop / 0.14) * Math.PI)) * 0.92 + 0.08
      for (const m of bo.mat) m.scale.y = mo

      if (bo.duoi !== null) bo.duoi.rotation.y = Math.sin(t * 1.7) * 0.42
      const vayCanh = Math.sin(t * 3.4) * 0.34
      if (bo.canhTrai !== null) bo.canhTrai.rotation.z = vayCanh
      if (bo.canhPhai !== null) bo.canhPhai.rotation.z = -vayCanh
      for (const [i, v] of bo.vongXoay.entries()) {
        v.rotation.y += dt * (i % 2 === 0 ? 0.75 : -0.5)
      }
      for (const v of bo.vongPhep) v.rotation.z += dt * 0.26

      nen.capNhat(t, dt)

      // Rung máy quay một nhịp khi chiêu nổ.
      dich.set(0, 0, 0)
      if (rungConLai > 0) {
        rungConLai = Math.max(0, rungConLai - dt)
        dich.set((Math.random() - 0.5) * rungConLai * 0.8, (Math.random() - 0.5) * rungConLai * 0.8, 0)
      }
      may.position.set(dich.x, yMay + dich.y, xaThat)
      may.lookAt(0, tam.y, 0)

      renderer.render(canh, may)
    }
    may.position.set(0, yMay, xaThat)
    may.lookAt(0, tam.y, 0)
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
      donCanhNen(nen)
      renderer.dispose()
      if (el.parentNode !== null) el.parentNode.removeChild(el)
    }
  }, [info, cap, cao, onKhongDungDuoc])

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ minHeight: cao }}>
      <div ref={boc} className="w-full flex items-center justify-center" style={{ minHeight: cao }} />
      <span
        ref={nhan}
        className="pointer-events-none absolute bottom-2 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/90 backdrop-blur-sm"
      />
    </div>
  )
}
