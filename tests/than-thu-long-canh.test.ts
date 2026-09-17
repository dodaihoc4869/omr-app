/**
 * LÔNG THÚ VÀ SÁU KHUNG CẢNH.
 *
 * Thầy chốt 15-09: "con thú phải mềm mại đáng yêu, có lông mịn màng" và "mỗi
 * con phải xuất hiện ở một khung cảnh phù hợp khác nhau, không để hình nền
 * trắng".
 *
 * Ba lỗi CHỈ NHÌN ẢNH CHỤP MỚI THẤY, nay khoá lại bằng phép kiểm để không ai
 * làm tái phát:
 *  1. Mắt và mõm chìm trong lông — phải nhô hẳn ra trước mặt lông.
 *  2. Thú lơ lửng trên sàn — vòng lửa cấp 12 thấp hơn bàn chân nên màn cha lấy
 *     đáy hộp bao làm mặt sàn thì thú treo lơ lửng.
 *  3. Đạo cụ cảnh chắn ngay trước mặt thú — vòng sáu cạnh hữu cơ xiên qua mõm,
 *     ba vòng khí halogen cắt thân thành khoanh.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import * as THREE from 'three'
import { texSoiLong, bocLong, soLopTheoMay } from '../src/game/than-thu-hoa-hoc/long-thu-3d'
import { dungCanhNen, donCanhNen, TEN_CANH, CAU_HINH_CANH } from '../src/game/than-thu-hoa-hoc/canh-nen-3d'
import { dungThanThu3D, donBoThanThu3D } from '../src/game/than-thu-hoa-hoc/dung-than-thu-3d'
import { DANH_SACH_THAN_THU } from '../src/game/than-thu-hoa-hoc/he-thong-pet'
import { DS_HE } from '../src/game/than-thu-hoa-hoc/tuong-khac'
import { CAP_TOI_DA } from '../src/game/than-thu-hoa-hoc/hinh-thai'

const HOA = DANH_SACH_THAN_THU['hoa_long']!

beforeAll(() => {
  // jsdom không có ngữ cảnh canvas 2D thật; mọi hàm vẽ vân phải chịu được null.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

describe('Tấm vân sợi lông', () => {
  it('sinh được kể cả khi máy không cho ngữ cảnh canvas', () => {
    const t = texSoiLong(40, 64)
    expect(t).toBeInstanceOf(THREE.CanvasTexture)
    expect(t.wrapS).toBe(THREE.RepeatWrapping)
    t.dispose()
  })
  it('số lớp theo máy luôn ít nhất 2', () => {
    expect(soLopTheoMay()).toBeGreaterThanOrEqual(2)
  })
})

describe('Bọc lông nhiều lớp', () => {
  const dung = (soLop: number) => {
    const vao = new THREE.Group()
    const hinh = new THREE.SphereGeometry(1, 8, 6)
    const bo = bocLong(vao, hinh, {
      vt: new THREE.Vector3(0, 0, 0), co: new THREE.Vector3(1, 1, 1),
    }, new THREE.Color(1, 0, 0), new THREE.Color(0, 0, 1), { soLop })
    return { vao, hinh, bo }
  }

  it('đủ số lớp, mọi lớp DÙNG CHUNG một geometry', () => {
    const { vao, hinh, bo } = dung(10)
    expect(bo.lop).toHaveLength(10)
    expect(vao.children).toHaveLength(10)
    for (const m of bo.lop) expect(m.geometry).toBe(hinh)
  })

  it('ngưỡng alpha TĂNG NGHIÊM NGẶT ra ngoài — đó là cái làm sợi thon thành ngọn', () => {
    const { bo } = dung(12)
    let truoc = -1
    for (const m of bo.lop) {
      const vl = m.material as THREE.MeshStandardMaterial
      expect(vl.alphaTest).toBeGreaterThan(truoc)
      truoc = vl.alphaTest
      // Vỏ phải là khối ĐỤC: vỏ trong suốt phải sắp lại theo chiều sâu mỗi
      // khung hình và vẫn sai khi thú xoay, lông sẽ nháy.
      expect(vl.transparent).toBe(false)
      expect(vl.alphaMap).not.toBeNull()
    }
    expect(truoc).toBeLessThan(1)
  })

  it('lớp ngoài phình ra hơn lớp trong', () => {
    const { bo } = dung(8)
    for (let i = 1; i < bo.lop.length; i++) {
      expect(bo.lop[i]!.scale.x).toBeGreaterThan(bo.lop[i - 1]!.scale.x)
    }
  })

  it('CHỈ lớp sát da đổ bóng — mười mấy lớp cùng đổ bóng là mười mấy lần vẽ bóng', () => {
    const { bo } = dung(9)
    expect(bo.lop.filter((m) => m.castShadow)).toHaveLength(1)
    expect(bo.lop[0]!.castShadow).toBe(true)
  })

  it('rủ lông: ngọn đi xa, gốc gần như đứng yên', () => {
    const { bo } = dung(10)
    bo.ruLong(new THREE.Vector3(0, -1, 0))
    const trong = Math.abs(bo.lop[0]!.position.y)
    const ngoai = Math.abs(bo.lop[bo.lop.length - 1]!.position.y)
    expect(ngoai).toBeGreaterThan(trong * 4)
    expect(ngoai).toBeCloseTo(1, 5)
    // Rủ rồi trả về 0 thì lông phải về đúng chỗ cũ, không trôi tích luỹ.
    bo.ruLong(new THREE.Vector3(0, 0, 0))
    for (const m of bo.lop) expect(m.position.length()).toBeCloseTo(0, 6)
  })

  it('rác gom đủ: mỗi lớp một material, cộng tấm vân đã nhân bản', () => {
    const { bo } = dung(6)
    const ds = bo.rac.map((r) => vi.spyOn(r, 'dispose'))
    expect(bo.rac.length).toBeGreaterThanOrEqual(7)
    for (const r of bo.rac) r.dispose()
    for (const g of ds) expect(g).toHaveBeenCalled()
  })
})

describe('Sáu khung cảnh', () => {
  it('hệ nào cũng dựng được, và SÁU TÊN CẢNH KHÁC NHAU', () => {
    const ten = new Set<string>()
    for (const he of DS_HE) {
      const bo = dungCanhNen(he, -1.46)
      expect(bo.nhom.children.length).toBeGreaterThan(1)
      ten.add(bo.ten)
      expect(bo.ten).toBe(TEN_CANH[he])
      donCanhNen(bo)
    }
    expect(ten.size).toBe(DS_HE.length)
  })

  it('KHÔNG có nền trắng: mỗi hệ một màu trời và một màu sương mù riêng', () => {
    const troi = new Set<string>()
    const mu = new Set<number>()
    for (const he of DS_HE) {
      const c = CAU_HINH_CANH[he]
      troi.add(c.troi.join('|'))
      const bo = dungCanhNen(he, -1.46)
      mu.add(bo.suongMu.color.getHex())
      // Trắng là rgb(255, 255, 255); không nấc trời nào được là trắng.
      for (const nac of c.troi) expect(nac).not.toContain('255, 255, 255')
      donCanhNen(bo)
    }
    expect(troi.size).toBe(DS_HE.length)
    expect(mu.size).toBe(DS_HE.length)
  })

  it('KHÔNG đạo cụ nào đứng chắn trước mặt thú', () => {
    // Máy quay ở +Z nhìn vào gốc. Đạo cụ ở z dương mà gần trục đứng sẽ che mặt.
    // Ảnh chụp bản trước bắt được hai ca: vòng sáu cạnh hữu cơ xiên qua mõm, ba
    // vòng khí halogen cắt thân thành khoanh.
    for (const he of DS_HE) {
      const bo = dungCanhNen(he, -1.46)
      bo.nhom.traverse((o) => {
        const m = o as THREE.Mesh
        if (!m.isMesh) return
        // Sàn là đĩa nằm ngang ngay dưới chân, không tính.
        if (m.geometry.type === 'CircleGeometry') return
        const v = new THREE.Vector3()
        m.getWorldPosition(v)
        const ok = v.z <= -1.2 || Math.abs(v.x) >= 2.8
        expect(ok, `${he}: đạo cụ ở x=${v.x.toFixed(2)} z=${v.z.toFixed(2)} chắn mặt thú`).toBe(true)
      })
      donCanhNen(bo)
    }
  })

  it('capNhat chạy 200 khung hình không ném lỗi và hạt có di chuyển', () => {
    for (const he of DS_HE) {
      const bo = dungCanhNen(he, -1.46)
      let hat: THREE.Points | null = null
      bo.nhom.traverse((o) => { if ((o as THREE.Points).isPoints) hat = o as THREE.Points })
      expect(hat).not.toBeNull()
      const truoc = ((hat! as THREE.Points).geometry.getAttribute('position').array as Float32Array).slice(0, 9)
      for (let i = 0; i < 200; i++) bo.capNhat(i * 0.016, 0.016)
      const sau = (hat! as THREE.Points).geometry.getAttribute('position').array as Float32Array
      expect(Array.from(sau.slice(0, 9))).not.toEqual(Array.from(truoc))
      donCanhNen(bo)
    }
  })

  it('donCanhNen gọi dispose cho TỪNG geometry, material, texture', () => {
    const bo = dungCanhNen('dien', -1.46)
    expect(bo.rac.length).toBeGreaterThan(8)
    const ds = bo.rac.map((r) => vi.spyOn(r, 'dispose'))
    donCanhNen(bo)
    for (const g of ds) expect(g).toHaveBeenCalled()
    expect(bo.rac).toHaveLength(0)
    expect(bo.nhom.children).toHaveLength(0)
  })
})

describe('Thú đứng trên sàn, mặt không bị lông nuốt', () => {
  it('chanY nằm dưới thân và KHÔNG bộ phận nào chui xuống dưới nó quá một chút', () => {
    for (let c = 1; c <= CAP_TOI_DA; c++) {
      const bo = dungThanThu3D(HOA, c, 4)
      expect(bo.chanY).toBeLessThan(0)
      // Vòng lửa cấp 12 và vòng rune cấp 11 từng nằm dưới bàn chân; nay phải ở
      // trên. Chừa 0,1 cho phần lông bụng hơi trễ xuống.
      for (const v of [...bo.vongXoay, ...bo.vongPhep]) {
        expect(v.position.y, `cấp ${c}`).toBeGreaterThan(bo.chanY - 0.1)
      }
      donBoThanThu3D(bo)
    }
  })

  it('MẮT nhô hẳn ra trước mặt lông, cả sáu thần thú', () => {
    for (const pet of Object.values(DANH_SACH_THAN_THU)) {
      const bo = dungThanThu3D(pet, 5, 4)
      expect(bo.mat).toHaveLength(2)
      for (const m of bo.mat) {
        // Mặt lông đầu ở z ≈ 1,07 ngay hốc mắt. Bản đầu để mắt ở 0,84 nên lông
        // trùm kín tròng — ảnh chụp ra hai con mắt lem nhem.
        expect(m.position.z).toBeGreaterThan(1.0)
      }
      donBoThanThu3D(bo)
    }
  })

  it('miệng bắn chiêu nằm trước cả mặt lông', () => {
    const bo = dungThanThu3D(HOA, 7, 4)
    expect(bo.mieng.z).toBeGreaterThan(1.1)
    donBoThanThu3D(bo)
  })

  it('có lông từ cấp 2 (đầu, thân, hai tai), trứng thì không', () => {
    const trung = dungThanThu3D(HOA, 1, 4)
    expect(trung.long).toHaveLength(0)
    donBoThanThu3D(trung)
    const non = dungThanThu3D(HOA, 2, 4)
    expect(non.long.length).toBeGreaterThanOrEqual(4)
    donBoThanThu3D(non)
    // Cấp 4 mọc đuôi: bốn cục lông xù nữa.
    const co = dungThanThu3D(HOA, 4, 4)
    expect(co.long.length).toBeGreaterThan(non.long.length)
    donBoThanThu3D(co)
  })

  it('đầu là nhóm riêng từ cấp 2 — trứng thì đầu chính là thân', () => {
    const trung = dungThanThu3D(HOA, 1, 4)
    expect(trung.dau).toBe(trung.than)
    donBoThanThu3D(trung)
    const non = dungThanThu3D(HOA, 3, 4)
    expect(non.dau).not.toBe(non.than)
    expect(non.dau.position.y).toBeGreaterThan(0)
    donBoThanThu3D(non)
  })

  it('số lớp lông ép được, để máy yếu còn hạ xuống', () => {
    const it = dungThanThu3D(HOA, 6, 3)
    const nhieu = dungThanThu3D(HOA, 6, 12)
    let a = 0
    let b = 0
    it.goc.traverse((x) => { if ((x as THREE.Mesh).isMesh) a++ })
    nhieu.goc.traverse((x) => { if ((x as THREE.Mesh).isMesh) b++ })
    expect(b).toBeGreaterThan(a)
    donBoThanThu3D(it)
    donBoThanThu3D(nhieu)
  })
})
