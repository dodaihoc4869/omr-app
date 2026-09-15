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
import { mauTuChuoi, type BoThanThu3D } from '../game/than-thu-hoa-hoc/dung-than-thu-3d'
import { dungCanh3D } from '../game/than-thu-hoa-hoc/canh-3d-chung'
import { dungTanHuVo } from '../game/than-thu-hoa-hoc/tan-hu-vo-3d'
import { CAP_TOI_DA } from '../game/than-thu-hoa-hoc/hinh-thai'
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
  lapDay = false,
}: {
  info: ThanThuInfo
  cap: number
  lenhChieu: LenhChieu
  /** Chạm vào thú (không phải kéo) — màn cha cho nó kêu. */
  onCham?: () => void
  /** Máy không dựng được WebGL. */
  onKhongDungDuoc?: () => void
  cao?: number
  /**
   * LẤP ĐẦY Ô CHỨA. Thầy chốt 15-09: *"nền xung quanh của thần thú nó tràn ra
   * tất cả ô mà thần thú đó đứng"*. Bật cờ này thì màn 3D bám sát bốn cạnh của
   * thẻ cha thay vì là một ô vuông nhỏ giữa thẻ; chữ và nút của thẻ nổi lên
   * trên nó.
   */
  lapDay?: boolean
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
    const caoThat = lapDay ? Math.max(200, oBoc.clientHeight || cao) : cao
    renderer.setSize(rong, caoThat)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.06
    oBoc.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.cursor = 'grab'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = lapDay ? '100%' : 'auto'
    renderer.domElement.style.display = 'block'

    // MỘT NGUỒN DỰNG CẢNH. Màn này và ảnh chụp cho tờ chiếu lên bảng gọi
    // CHUNG `dungCanh3D` — cùng hình khối, cùng bộ lông, cùng khung cảnh, cùng
    // ba ngọn đèn, cùng phép khớp khung. Thầy chốt 15-09: thú lên bảng phải
    // giống y hệt thú trong mục Thần Thú, nên hai nơi không được có hai bộ vẽ.
    const kc = dungCanh3D(info, cap, rong / caoThat)
    const { canh, may, nen, tam } = kc
    let bo: BoThanThu3D = kc.bo
    if (nhan.current !== null) nhan.current.textContent = nen.ten

    const chieu = new ChieuThuc3D(info)
    bo.goc.add(chieu.doiTuong)

    /**
     * CẤP 120 — TAN THÀNH HƯ VÔ, NHẬP VỚI ĐẠI THỂ.
     *
     * Thầy chốt 15-09. Chỉ dựng khi đúng cấp tối đa: đây là cảnh cuối cùng của
     * cả hành trình, không phải hiệu ứng trang trí bật ở mọi cấp.
     */
    const tanHuVo = cap >= CAP_TOI_DA
      ? dungTanHuVo(Math.max(0.8, kc.co.y * 0.55), mauTuChuoi(info.mauChinh), mauTuChuoi(info.mauPhu))
      : null
    if (tanHuVo !== null) {
      tanHuVo.nhom.position.y = kc.tam.y
      canh.add(tanHuVo.nhom)
    }
    let tTan = 0
    /**
     * Vật liệu của thân thú, gom MỘT LẦN lúc bắt đầu tan.
     *
     * Đổi `transparent` trên vật liệu three là phải bật `needsUpdate` cho nó
     * dịch lại shader — không bật thì `opacity` bị bỏ qua hoàn toàn và thân thú
     * đứng nguyên đó trong suốt cảnh tan. Và chỉ bật ĐÚNG MỘT LẦN: mỗi lần bật
     * là một lượt dịch shader, bật mỗi khung hình thì màn đứng hình.
     */
    let vlThan: THREE.Material[] | null = null

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
        // Cờ cuồng nộ đi THẲNG vào chiêu thức: chưởng nộ có kịch bản riêng
        // (quầng nộ, chớp loá, sóng loang đất), không phải chưởng thường phóng to.
        // Truyền cao độ bàn chân: vũng acid và sóng loang phải bám mặt sàn.
        chieu.ban(bo.mieng, lenh.no, bo.chanY - bo.mieng.y)
        if (lenh.no) bo.goc.scale.setScalar(1.16)
      }
      chieu.capNhat(dt)

      // ── TAN HƯ VÔ: thân mờ dần, hạt hiện lên, rồi thành thiên hà nhỏ ──
      if (tanHuVo !== null) {
        tTan += dt
        tanHuVo.capNhat(tTan, dt)
        const mo = tanHuVo.doMoThan(tTan)
        if (vlThan === null) {
          const gom = new Set<THREE.Material>()
          bo.goc.traverse((o) => {
            const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
            if (m === undefined) return
            for (const v of Array.isArray(m) ? m : [m]) gom.add(v)
          })
          vlThan = [...gom]
          for (const v of vlThan) {
            v.transparent = true
            v.depthWrite = false
            v.needsUpdate = true
          }
        }
        for (const v of vlThan) v.opacity = mo
        bo.goc.visible = mo > 0.004
      }
      // Rung theo sức của chiêu — cuồng nộ rung hơn gấp đôi.
      if (chieu.vuaNo) rungConLai = 0.22 * chieu.manhNo

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

      // MÁY QUAY TRÔI NHẸ. Nền lấp đầy cả thẻ mà đứng chết một khung thì nhìn
      // như ảnh dán; trôi chậm thế này là cảnh có chiều sâu, hạt và đạo cụ phía
      // sau chạy lệch tầng với con thú.
      const troiX = Math.sin(t * 0.13) * 0.55
      const troiY = Math.sin(t * 0.09 + 1.2) * 0.2

      // Rung máy quay một nhịp khi chiêu nổ.
      dich.set(0, 0, 0)
      if (rungConLai > 0) {
        rungConLai = Math.max(0, rungConLai - dt)
        dich.set((Math.random() - 0.5) * rungConLai * 0.8, (Math.random() - 0.5) * rungConLai * 0.8, 0)
      }
      // Đọc thẳng kc.* chứ không hứng ra biến: khopKhung() đổi khoảng lùi khi
      // thẻ co giãn, hứng ra biến thì máy quay đứng nguyên chỗ cũ.
      may.position.set(troiX + dich.x, kc.yMay + troiY + dich.y, kc.xaThat)
      may.lookAt(0, tam.y, 0)

      renderer.render(canh, may)
    }
    may.position.set(0, kc.yMay, kc.xaThat)
    may.lookAt(0, tam.y, 0)
    id = requestAnimationFrame(ve)

    const doiCo = () => {
      const w = Math.max(200, oBoc.clientWidth || 320)
      const h = lapDay ? Math.max(200, oBoc.clientHeight || cao) : cao
      may.aspect = w / h
      may.updateProjectionMatrix()
      // Tính lại khoảng lùi theo tỷ lệ khung MỚI. Ở chế độ lấp đầy, thẻ nở ra
      // sau khi gắn, khoảng lùi đo lúc gắn làm con thú phình to và cụt chân.
      kc.khopKhung()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', doiCo)
    // Ô cha co giãn theo thẻ chứ không theo cửa sổ, nên riêng lượt resize của
    // cửa sổ là không đủ.
    const theoCo = typeof ResizeObserver === 'function' ? new ResizeObserver(doiCo) : null
    theoCo?.observe(oBoc)

    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', doiCo)
      theoCo?.disconnect()
      document.removeEventListener('visibilitychange', doiTab)
      theoDoi.disconnect()
      el.removeEventListener('pointerdown', xuong)
      el.removeEventListener('pointermove', chuyen)
      el.removeEventListener('pointerup', len)
      el.removeEventListener('pointercancel', len)
      chieu.dispose()
      tanHuVo?.don()
      kc.don()
      renderer.dispose()
      if (el.parentNode !== null) el.parentNode.removeChild(el)
    }
  }, [info, cap, cao, lapDay, onKhongDungDuoc])

  if (lapDay) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div ref={boc} className="w-full h-full" />
        {/* Nhãn tên khung cảnh vẫn được gắn để giữ ref, nhưng ẩn đi: ở chế độ
            lấp đầy, sân khấu phải sạch chữ — thầy chốt 15-09. */}
        <span ref={nhan} className="hidden" />
      </div>
    )
  }
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
