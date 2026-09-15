/**
 * CHIÊU THỨC — SÁU HỆ SÁU LỐI, THƯỜNG VÀ CUỒNG NỘ KHÁC HẲN NHAU.
 *
 * Thầy chốt 15-09: *"sửa lại chưởng, mỗi chưởng phải khác nhau, chưởng thường,
 * chưởng cuồng nộ phải mãnh liệt dữ dội đẹp mắt và thật ngầu."*
 *
 * ───────────────────────────────────────────────────────────────────────────
 * BẢN TRƯỚC SAI Ở ĐÂU. Sáu hệ dùng CHUNG một kịch bản — tụ cầu ở miệng, bay
 * thẳng, nổ thành vòng — chỉ đổi hình quả đạn. Mắt đọc ra sáu lần cùng một
 * chiêu sơn sáu màu. Và chưởng cuồng nộ chỉ khác chưởng thường đúng một dòng
 * phóng to thân thú 1,1 lần; bấm xong không thấy "nộ" ở đâu.
 *
 * BẢN NÀY. Mỗi hệ một NGÔN NGỮ riêng, dựng từ chính chất của hệ:
 *
 *   Hoả      cầu lửa méo, VỆT LỬA dài phía sau, nổ bung mảnh + chớp cam
 *   Acid     giọt cường toan, NHỎ GIỌT dọc đường bay, nổ loang thành vũng
 *   Base     khối tinh thể, BA VỆ TINH quay quanh, nổ mọc măng tinh thể
 *   Khí      vòng xoáy, BỐN VÒNG nối đuôi quay ngược chiều, nổ thành lốc phễu
 *   Điện hoá TIA SÉT gấp khúc nối miệng tới đích, nổ phóng nhánh điện
 *   Hữu cơ   chuỗi mắt xích uốn lượn, nổ bung LƯỚI POLYMER sáu cạnh
 *
 * CUỒNG NỘ không phải chưởng thường phóng to. Khác ở bốn chỗ đo được:
 *   · dồn lực LÂU HƠN và có quầng nộ phình dần quanh miệng
 *   · đạn to gấp ~1,7, vệt dài gấp đôi
 *   · lúc chạm: CHỚP TRẮNG loá, HAI vòng sóng (một dựng, một loang mặt đất),
 *     gấp đôi số mảnh
 *   · rung máy quay mạnh gấp hơn hai lần (`manhNo`)
 *
 * Toàn bộ geometry và material tạo MỘT LẦN rồi dùng lại — mỗi lần bấm chiêu mà
 * dựng mới là rò bộ nhớ GPU, và em bấm liên tục.
 */

import * as THREE from 'three'
import { mauTuChuoi } from './dung-than-thu-3d'
import type { ThanThuInfo } from './he-thong-pet'

/** Chưởng thường gọn nhịp; cuồng nộ kéo dài hơn cho đủ sức nặng. */
const DAI_THUONG = 1.4
const DAI_NO = 1.95
const MOC_BAY = 0.24
const MOC_NO = 0.70
/** Khoảng bay tới điểm nổ. Trước để 4,4 — đạn bay sát ống kính nên quả nộ
 *  phình kín một góc màn, nhìn ra miếng nhựa trắng chứ không ra chưởng. 2,9 là
 *  vẫn lao về phía người xem mà cả cú nổ còn nằm gọn trong khung. */
const XA = 2.35
/** Độ vồng của đường đạn — bay cong mới có lực, bay thẳng trông như trượt ray. */
const VONG = 0.5
/** Đường đạn chếch sang phải và hơi chúc xuống. Bắn thẳng vào ống kính thì cả
 *  cú chưởng nằm đè lên mặt thú — che mắt, che mõm, không thấy gì. Chếch thế
 *  này là tia rời khỏi thân thú ngay, quả nổ bung ra khoảng trống bên cạnh. */
const CHECH_NGANG = 0.42
const CHECH_DOC = 0.1
/** Điểm xuất chiêu dời khỏi mõm: xuống ngực, ra trước một chút. */
const DOI_MIENG = new THREE.Vector3(0.12, -0.34, 0.18)
const SO_MANH = 20
const SO_DUOI = 10
const SO_DOT_TIA = 9
/** Số đốt thân tia sét (mỗi đốt một ống, để tia có BỀ DÀY thật). */
const SO_DOT_THAN = SO_DOT_TIA - 1

/** Đệm dùng lại — cấp phát Vector3 trong vòng lặp vẽ là rác cho bộ thu gom. */
const TAM = new THREE.Vector3()
const TRUC_Y = new THREE.Vector3(0, 1, 0)

type KieuNo = 'lua' | 'vung' | 'tinhThe' | 'loc' | 'dien' | 'luoi'

/**
 * SÁU CHƯỞNG TỐI THƯỢNG — đúng sáu tấm ảnh thầy gửi 15-09.
 *
 *   tiaNgocBich  Thanh Long   ULTIMATE JADE BLAST — chùm tia bích ngọc bảy sắc
 *   tiaNganHa    Kỳ Lân       GALAXY CROWN LASER — tia từ sừng, xoáy thiên hà
 *   danPhao      Huyền Quy    CHRONO-CORE CANON ARRAY — dàn pháo trên mai
 *   bungNoMatTroi Xích Phượng SOLAR FLARE ERUPTION — bùng nổ hào quang
 *   hongBang     Lôi Lân      CHILLING FROST ROAR — nộ hống băng sương
 *   xoayQuangSinh Bích Long   BIOLUMINESCENT VORTEX BLAST — xoáy quang sinh học
 */
export type KieuToiThuong =
  | 'tiaNgocBich' | 'tiaNganHa' | 'danPhao'
  | 'bungNoMatTroi' | 'hongBang' | 'xoayQuangSinh'

const TOI_THUONG: Record<string, KieuToiThuong> = {
  khi: 'tiaNgocBich',
  axit: 'tiaNganHa',
  kiem: 'danPhao',
  hoa: 'bungNoMatTroi',
  dien: 'hongBang',
  huuco: 'xoayQuangSinh',
}

interface NetChieu {
  dan: () => THREE.BufferGeometry
  /** Số đốm vệt bám sau đạn. 0 là không có vệt. */
  duoi: number
  /** Số vệ tinh quay quanh đạn. */
  veTinh: number
  /** Tốc độ tự xoay của đạn, radian/giây theo ba trục. */
  quay: readonly [number, number, number]
  /** Có kéo một tia sét gấp khúc từ miệng tới đạn không. */
  tia: boolean
  kieuNo: KieuNo
}

const NET: Record<string, NetChieu> = {
  hoa: { dan: () => new THREE.SphereGeometry(0.24, 18, 14), duoi: SO_DUOI, veTinh: 0, quay: [2, 3, 8], tia: false, kieuNo: 'lua' },
  axit: { dan: () => new THREE.ConeGeometry(0.17, 0.52, 14), duoi: 5, veTinh: 0, quay: [0, 0, 0], tia: false, kieuNo: 'vung' },
  kiem: { dan: () => new THREE.OctahedronGeometry(0.24, 0), duoi: 0, veTinh: 3, quay: [3, 4, 0], tia: false, kieuNo: 'tinhThe' },
  khi: { dan: () => new THREE.TorusGeometry(0.22, 0.06, 10, 22), duoi: 0, veTinh: 0, quay: [0, 0, 24], tia: false, kieuNo: 'loc' },
  dien: { dan: () => new THREE.TetrahedronGeometry(0.24, 0), duoi: 0, veTinh: 0, quay: [16, 12, 0], tia: true, kieuNo: 'dien' },
  huuco: { dan: () => new THREE.CapsuleGeometry(0.12, 0.24, 6, 12), duoi: 8, veTinh: 0, quay: [0, 0, 5], tia: false, kieuNo: 'luoi' },
}

export class ChieuThuc3D {
  private nhom = new THREE.Group()
  private dan: THREE.Mesh
  private hao: THREE.Mesh
  private quangNo: THREE.Mesh
  private duoi: THREE.Mesh[] = []
  private veTinh: THREE.Mesh[] = []
  private tia: THREE.Line | null = null
  /** Thân tia sét: chuỗi ống nối các đốt. Đường `Line` của WebGL luôn dày đúng
   *  1 pixel dù đặt `linewidth` bao nhiêu, nên tia cũ mảnh như sợi tóc. */
  private thanTia: THREE.Mesh[] = []
  private diemTia: THREE.Vector3[] = []
  /** Đèn loé lúc chạm — thứ làm cú nổ hắt sáng lên bộ lông và mặt sàn. */
  private denNo: THREE.PointLight
  private manh: THREE.Mesh[] = []
  private song: THREE.Mesh
  private songDat: THREE.Mesh
  private chop: THREE.Mesh
  private rac: (THREE.BufferGeometry | THREE.Material)[] = []
  private viTriCu: THREE.Vector3[] = []
  /** Cao độ mặt sàn, quy về hệ toạ độ của nhóm chiêu. Vũng acid và sóng loang
   *  phải NẰM TRÊN ĐẤT; để mặc y = 0 thì chúng lơ lửng ngang mõm thú. */
  private yDat = -1.3
  private t = -1
  private no = false
  private cuongNo = false

  /** `erasableSyntaxOnly` của kho cấm tham số-thuộc-tính, nên khai riêng. */
  private net: NetChieu
  /** Kiểu chưởng tối thượng của hệ này. */
  private kieuTT: KieuToiThuong
  /** Bộ phận riêng của chưởng tối thượng — chỉ hiện khi bấm chưởng nộ. */
  private tt: THREE.Object3D[] = []
  private ttVatLieu: THREE.Material[] = []

  constructor(info: ThanThuInfo) {
    this.net = NET[info.he] ?? NET['hoa']!
    this.kieuTT = TOI_THUONG[info.he] ?? 'bungNoMatTroi'
    const mau = mauTuChuoi(info.mauPhu)
    const mauChinh = mauTuChuoi(info.mauChinh)
    const ghi = <T extends THREE.BufferGeometry | THREE.Material>(x: T): T => {
      this.rac.push(x)
      return x
    }

    // ĐẠN — phải là MESH ĐẦU TIÊN trong cây: phép kiểm "mỗi hệ một hình dạng
    // đạn" lấy geometry của mesh gặp đầu tiên khi duyệt.
    const gDan = ghi(this.net.dan())
    const mDan = ghi(new THREE.MeshBasicMaterial({ color: mau, transparent: true }))
    this.dan = new THREE.Mesh(gDan, mDan)
    this.nhom.add(this.dan)

    // Hào quang bọc quanh đạn — cùng geometry, phóng to và mờ.
    const mHao = ghi(new THREE.MeshBasicMaterial({
      color: mau, transparent: true, opacity: 0.3, depthWrite: false,
      blending: THREE.AdditiveBlending,
    }))
    this.hao = new THREE.Mesh(gDan, mHao)
    this.hao.scale.setScalar(1.55)
    this.dan.add(this.hao)

    // QUẦNG NỘ — chỉ hiện ở chưởng cuồng nộ, phình dần trong lúc dồn lực.
    const gQuang = ghi(new THREE.SphereGeometry(0.5, 20, 14))
    const mQuang = ghi(new THREE.MeshBasicMaterial({
      color: mauChinh, transparent: true, opacity: 0.22, depthWrite: false,
      side: THREE.BackSide, blending: THREE.AdditiveBlending,
    }))
    this.quangNo = new THREE.Mesh(gQuang, mQuang)
    this.quangNo.visible = false
    this.nhom.add(this.quangNo)

    // VỆT — các đốm bám theo đường đạn vừa đi qua.
    if (this.net.duoi > 0) {
      const gD = ghi(new THREE.SphereGeometry(0.13, 10, 8))
      for (let i = 0; i < this.net.duoi; i++) {
        const mD = ghi(new THREE.MeshBasicMaterial({
          color: mau, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending,
        }))
        const m = new THREE.Mesh(gD, mD)
        m.visible = false
        this.nhom.add(m)
        this.duoi.push(m)
      }
    }

    // VỆ TINH — quay quanh đạn (hệ Base).
    if (this.net.veTinh > 0) {
      const gV = ghi(new THREE.OctahedronGeometry(0.1, 0))
      const mV = ghi(new THREE.MeshBasicMaterial({ color: mauChinh, transparent: true }))
      for (let i = 0; i < this.net.veTinh; i++) {
        const m = new THREE.Mesh(gV, mV)
        m.visible = false
        this.nhom.add(m)
        this.veTinh.push(m)
      }
    }

    // TIA SÉT — đường gấp khúc nối miệng tới đạn (hệ Điện hoá).
    if (this.net.tia) {
      const gT = ghi(new THREE.BufferGeometry())
      gT.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SO_DOT_TIA * 3), 3))
      const mT = ghi(new THREE.LineBasicMaterial({
        color: mau, transparent: true, blending: THREE.AdditiveBlending,
      }))
      this.tia = new THREE.Line(gT, mT)
      this.tia.visible = false
      this.nhom.add(this.tia)

      // Thân tia: ống bán kính 1 cao 1, mỗi khung hình kéo–xoay cho khớp đốt.
      const gThan = ghi(new THREE.CylinderGeometry(1, 1, 1, 6, 1, true))
      const mThan = ghi(new THREE.MeshBasicMaterial({
        color: new THREE.Color(mau).lerp(new THREE.Color(1, 1, 1), 0.55),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }))
      for (let i = 0; i < SO_DOT_THAN; i++) {
        const m = new THREE.Mesh(gThan, mThan)
        m.visible = false
        this.nhom.add(m)
        this.thanTia.push(m)
      }
      for (let i = 0; i < SO_DOT_TIA; i++) this.diemTia.push(new THREE.Vector3())
    }

    // MẢNH VỠ khi chạm.
    const gManh = ghi(new THREE.SphereGeometry(0.075, 8, 6))
    const mManh = ghi(new THREE.MeshBasicMaterial({ color: mau, transparent: true }))
    for (let i = 0; i < SO_MANH; i++) {
      const m = new THREE.Mesh(gManh, mManh)
      m.visible = false
      this.nhom.add(m)
      this.manh.push(m)
    }

    // SÓNG XUNG KÍCH dựng đứng — hình dạng đổi theo kiểu nổ của hệ.
    const gSong = ghi(this.hinhSong(this.net.kieuNo))
    const mSong = ghi(new THREE.MeshBasicMaterial({
      color: mau, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }))
    this.song = new THREE.Mesh(gSong, mSong)
    this.song.visible = false
    this.nhom.add(this.song)

    // SÓNG LOANG MẶT ĐẤT — chỉ chưởng cuồng nộ mới có.
    const gDat = ghi(new THREE.RingGeometry(0.5, 0.72, 44))
    const mDat = ghi(new THREE.MeshBasicMaterial({
      color: mauChinh, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }))
    this.songDat = new THREE.Mesh(gDat, mDat)
    this.songDat.rotation.x = -Math.PI / 2 - CHECH_DOC
    this.songDat.visible = false
    this.nhom.add(this.songDat)

    // CHỚP LOÁ — chỉ chưởng cuồng nộ.
    const gChop = ghi(new THREE.SphereGeometry(0.6, 16, 12))
    const mChop = ghi(new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 1, 1), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
    }))
    this.chop = new THREE.Mesh(gChop, mChop)
    this.chop.visible = false
    this.nhom.add(this.chop)

    // ═══════════════════════════════════════════════════════════════════
    // CHƯỞNG TỐI THƯỢNG — sáu bộ, mỗi hệ một bộ, dựng sẵn rồi ẩn đi.
    // Dựng sẵn vì em bấm liên tục: dựng mới mỗi lần bấm là rò bộ nhớ GPU.
    // ═══════════════════════════════════════════════════════════════════
    const themTT = (o: THREE.Object3D, ...vl: THREE.Material[]) => {
      o.visible = false
      this.nhom.add(o)
      this.tt.push(o)
      for (const v of vl) this.ttVatLieu.push(v)
    }
    const trang = new THREE.Color(1, 1, 1)

    if (this.kieuTT === 'tiaNgocBich' || this.kieuTT === 'tiaNganHa') {
      // CHÙM TIA — bảy lõi lồng nhau, lõi trong trắng loá, ngoài ngả màu hệ.
      // Bích ngọc thì bảy sắc; ngân hà thì tím hồng dần ra.
      for (let i = 0; i < 7; i++) {
        const u = i / 6
        const mauTia = this.kieuTT === 'tiaNgocBich'
          ? new THREE.Color().setHSL((0.33 + u * 0.55) % 1, 0.85, 0.6)
          : mau.clone().lerp(new THREE.Color(1, 0.45, 0.95), u)
        const g = ghi(new THREE.CylinderGeometry(0.06 + u * 0.19, 0.03 + u * 0.1, XA * 2.4, 16, 1, true))
        const m = ghi(new THREE.MeshBasicMaterial({
          color: i === 0 ? trang : mauTia, transparent: true,
          opacity: 0.9 - u * 0.62, depthWrite: false, side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        }))
        const t = new THREE.Mesh(g, m)
        t.rotation.x = Math.PI / 2
        t.position.z = XA * 1.2
        themTT(t, m)
      }
    } else if (this.kieuTT === 'danPhao') {
      // DÀN PHÁO — sáu nòng trên mai bắn sáu tia vàng chéo nhau.
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        const g = ghi(new THREE.CylinderGeometry(0.07, 0.11, XA * 2.2, 10, 1, true))
        const m = ghi(new THREE.MeshBasicMaterial({
          color: new THREE.Color(1, 0.86, 0.42), transparent: true, opacity: 0.85,
          depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        }))
        const t = new THREE.Mesh(g, m)
        t.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.4 + 0.3, XA * 1.1)
        t.rotation.set(Math.PI / 2, 0, 0)
        t.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.cos(a) * 0.2)
        t.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), Math.sin(a) * 0.16)
        themTT(t, m)
      }
    } else if (this.kieuTT === 'bungNoMatTroi') {
      // BÙNG NỔ HÀO QUANG — vành lửa khổng lồ cộng tám lưỡi lửa toả ra.
      const gVanh = ghi(new THREE.TorusGeometry(1.5, 0.22, 14, 56))
      const mVanh = ghi(new THREE.MeshBasicMaterial({
        color: new THREE.Color(1, 0.55, 0.12), transparent: true, opacity: 0.9,
        depthWrite: false, blending: THREE.AdditiveBlending,
      }))
      const vanh = new THREE.Mesh(gVanh, mVanh)
      vanh.position.z = XA * 0.5
      themTT(vanh, mVanh)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const g = ghi(new THREE.ConeGeometry(0.3, 2.4, 6, 1, true))
        const m = ghi(new THREE.MeshBasicMaterial({
          color: new THREE.Color(1, 0.78, 0.22), transparent: true, opacity: 0.7,
          depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        }))
        const t = new THREE.Mesh(g, m)
        t.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, XA * 0.5)
        t.rotation.z = a - Math.PI / 2
        themTT(t, m)
      }
    } else if (this.kieuTT === 'hongBang') {
      // NỘ HỐNG BĂNG SƯƠNG — nón hơi lạnh cộng mười hai phiến băng bay tới.
      const gNon = ghi(new THREE.ConeGeometry(1.5, XA * 2.2, 26, 1, true))
      const mNon = ghi(new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.68, 0.92, 1), transparent: true, opacity: 0.4,
        depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      }))
      const non = new THREE.Mesh(gNon, mNon)
      non.rotation.x = Math.PI / 2
      non.position.z = XA * 1.1
      themTT(non, mNon)
      for (let i = 0; i < 12; i++) {
        const g = ghi(new THREE.OctahedronGeometry(0.16, 0))
        const m = ghi(new THREE.MeshBasicMaterial({
          color: trang, transparent: true, opacity: 0.85, depthWrite: false,
          blending: THREE.AdditiveBlending,
        }))
        const t = new THREE.Mesh(g, m)
        t.userData.pha = i / 12
        themTT(t, m)
      }
    } else {
      // XOÁY QUANG SINH HỌC — bốn vòng xoáy lồng nhau chạy tới, phát sáng lạnh.
      for (let i = 0; i < 4; i++) {
        const g = ghi(new THREE.TorusGeometry(0.5 + i * 0.32, 0.075, 12, 44))
        const m = ghi(new THREE.MeshBasicMaterial({
          color: new THREE.Color(0.25, 0.95, 0.95).lerp(mau, i / 6), transparent: true,
          opacity: 0.8 - i * 0.12, depthWrite: false, blending: THREE.AdditiveBlending,
        }))
        const t = new THREE.Mesh(g, m)
        t.userData.pha = i / 4
        themTT(t, m)
      }
      const gLoi = ghi(new THREE.CylinderGeometry(0.14, 0.3, XA * 2, 16, 1, true))
      const mLoi = ghi(new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.6, 1, 1), transparent: true, opacity: 0.7,
        depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      }))
      const loi = new THREE.Mesh(gLoi, mLoi)
      loi.rotation.x = Math.PI / 2
      loi.position.z = XA
      themTT(loi, mLoi)
    }

    // ĐÈN LOÉ — đặt đúng điểm nổ, tắt hẳn lúc thường. Ánh sáng thật hắt lên
    // lông thú và mặt sàn là thứ tách "nổ" khỏi "dán thêm một hình sáng".
    this.denNo = new THREE.PointLight(mau, 0, 11, 2)
    this.nhom.add(this.denNo)

    for (let i = 0; i < SO_DUOI; i++) this.viTriCu.push(new THREE.Vector3())
    this.nhom.visible = false
  }

  /** Hình sóng xung kích: mỗi kiểu nổ một dáng, không dùng chung cái vòng tròn. */
  private hinhSong(kieu: KieuNo): THREE.BufferGeometry {
    switch (kieu) {
      // Lốc: phễu xoáy, hở hai đầu.
      case 'loc': return new THREE.ConeGeometry(0.6, 1.5, 22, 1, true)
      // Vũng acid: đĩa dẹt loang ra mặt đất.
      case 'vung': return new THREE.CircleGeometry(0.62, 34)
      // Măng tinh thể mọc lên.
      case 'tinhThe': return new THREE.ConeGeometry(0.34, 1.1, 5)
      // Lưới polymer: vành sáu cạnh.
      case 'luoi': return new THREE.TorusGeometry(0.58, 0.075, 4, 6)
      // Phóng điện: vành mảnh, nhiều cạnh gãy.
      case 'dien': return new THREE.TorusGeometry(0.5, 0.04, 4, 14)
      // Lửa: vành dày.
      default: return new THREE.TorusGeometry(0.5, 0.09, 10, 34)
    }
  }

  get doiTuong(): THREE.Object3D { return this.nhom }
  get dangChay(): boolean { return this.t >= 0 }
  /** Pha dồn lực — thân thú thu lại trong lúc này. */
  get donLuc(): number { return this.t >= 0 && this.t < MOC_BAY ? 1 - this.t / MOC_BAY : 0 }
  /** Đúng khung hình chạm, để bên ngoài rung màn hình một nhịp. */
  get vuaNo(): boolean { return this.no }
  /** Rung mạnh cỡ nào. Cuồng nộ rung hơn gấp đôi chưởng thường. */
  get manhNo(): number { return this.cuongNo ? 2.4 : 1 }
  /** Chiêu đang chạy có phải cuồng nộ không — màn cha đổi ánh sáng theo. */
  get dangNo(): boolean { return this.cuongNo }

  ban(tu: THREE.Vector3, cuongNo = false, yDatSoVoiMieng = -1.66): void {
    this.yDat = yDatSoVoiMieng - DOI_MIENG.y
    this.t = 0
    this.no = false
    this.cuongNo = cuongNo
    this.nhom.position.copy(tu).add(DOI_MIENG)
    this.nhom.rotation.set(CHECH_DOC, CHECH_NGANG, 0)
    this.nhom.visible = true
    this.song.visible = false
    this.songDat.visible = false
    this.chop.visible = false
    this.quangNo.visible = cuongNo
    if (this.tia !== null) this.tia.visible = false
    for (const m of this.thanTia) m.visible = false
    for (const o of this.tt) o.visible = false
    this.denNo.intensity = 0
    for (const m of this.manh) m.visible = false
    for (const m of this.duoi) m.visible = false
    for (const m of this.veTinh) m.visible = false
    for (const v of this.viTriCu) v.set(0, 0, 0)
  }

  /** Gọi mỗi khung hình. `dt` tính bằng giây. */
  capNhat(dt: number): void {
    if (this.t < 0) return
    this.no = false
    const truoc = this.t
    this.t += dt / (this.cuongNo ? DAI_NO : DAI_THUONG)
    if (this.t >= 1) {
      this.t = -1
      this.nhom.visible = false
      return
    }
    const t = this.t
    // 1,35 chứ không 1,7: ở khung sân khấu rộng, 1,7 làm quả đạn che mất mặt thú.
    const co = this.cuongNo ? 1.35 : 1
    const mDan = this.dan.material as THREE.MeshBasicMaterial

    if (t < MOC_BAY) this.phaDonLuc(t, dt, co, mDan)
    else if (t < MOC_NO) this.phaBay(t, dt, co, mDan)
    else this.phaCham(t, truoc, dt, co)
    // CHƯỞNG TỐI THƯỢNG chỉ chạy ở chưởng cuồng nộ, và chỉ từ lúc phóng.
    if (this.cuongNo && t >= MOC_BAY) this.phaToiThuong(t, dt)
  }

  private phaDonLuc(t: number, dt: number, co: number, mDan: THREE.MeshBasicMaterial): void {
    const u = t / MOC_BAY
    this.dan.visible = true
    this.dan.position.set(0, 0, 0)
    this.dan.scale.setScalar((0.12 + u * 0.78) * co)
    mDan.opacity = u
    this.dan.rotation.z += dt * 9
    if (this.cuongNo) {
      // Quầng nộ phình dần rồi bóp lại đúng lúc phóng — cảm giác nén trước khi bung.
      this.quangNo.visible = true
      const p = Math.sin(u * Math.PI)
      this.quangNo.scale.setScalar(0.6 + p * 2.4)
      ;(this.quangNo.material as THREE.MeshBasicMaterial).opacity = 0.3 * p
    }
  }

  private phaBay(t: number, dt: number, co: number, mDan: THREE.MeshBasicMaterial): void {
    const u = (t - MOC_BAY) / (MOC_NO - MOC_BAY)
    const z = u * XA
    // Vồng lên rồi rơi về điểm nổ — quỹ đạo cong mới ra lực ném.
    const y = Math.sin(u * Math.PI) * VONG * (this.cuongNo ? 1.25 : 1)
    this.dan.visible = true
    this.dan.position.set(0, y, z)
    this.dan.scale.setScalar((1 + u * 0.18) * co)
    mDan.opacity = 1
    this.quangNo.visible = false
    const [rx, ry, rz] = this.net.quay
    this.dan.rotation.x += dt * rx
    this.dan.rotation.y += dt * ry
    this.dan.rotation.z += dt * rz

    // VỆT: đẩy vị trí vào sổ rồi rải các đốm lên đó, đốm càng xa càng nhỏ và mờ.
    if (this.duoi.length > 0) {
      for (let i = this.viTriCu.length - 1; i > 0; i--) this.viTriCu[i]!.copy(this.viTriCu[i - 1]!)
      this.viTriCu[0]!.set(0, y, z)
      for (const [i, m] of this.duoi.entries()) {
        const v = this.viTriCu[Math.min(i, this.viTriCu.length - 1)]!
        const p = 1 - i / this.duoi.length
        m.visible = true
        m.position.copy(v)
        // Acid NHỎ GIỌT: đốm vệt rơi dần xuống thay vì bám đúng đường bay.
        if (this.net.kieuNo === 'vung') m.position.y -= (i / this.duoi.length) ** 2 * 1.1
        m.scale.setScalar(p * co * (this.cuongNo ? 1.4 : 1))
        ;(m.material as THREE.MeshBasicMaterial).opacity = p * 0.85
      }
    }

    // VỆ TINH quay quanh đạn.
    for (const [i, m] of this.veTinh.entries()) {
      const a = (i / this.veTinh.length) * Math.PI * 2 + t * 14
      m.visible = true
      m.position.set(Math.cos(a) * 0.5 * co, y + Math.sin(a) * 0.5 * co, z)
      m.scale.setScalar(co)
    }

    // TIA SÉT nối miệng tới đạn, gấp khúc ngẫu nhiên từng khung hình.
    if (this.tia !== null) {
      const vt = this.tia.geometry.getAttribute('position') as THREE.BufferAttribute
      const m = vt.array as Float32Array
      const lech = this.cuongNo ? 0.62 : 0.3
      for (let i = 0; i < SO_DOT_TIA; i++) {
        const p = i / (SO_DOT_TIA - 1)
        const bien = p * (1 - p) * 4 * lech
        const d = this.diemTia[i]!
        d.set(
          (Math.random() - 0.5) * bien,
          Math.sin(p * Math.PI) * VONG * (this.cuongNo ? 1.25 : 1) * p + (Math.random() - 0.5) * bien,
          p * z,
        )
        m[i * 3] = d.x
        m[i * 3 + 1] = d.y
        m[i * 3 + 2] = d.z
      }
      vt.needsUpdate = true
      this.tia.visible = true
      ;(this.tia.material as THREE.LineBasicMaterial).opacity = 0.55 + Math.random() * 0.45

      // Đắp ống lên từng đốt để tia có bề dày — `Line` chỉ dày 1 pixel.
      const ban = (this.cuongNo ? 0.062 : 0.032) * (0.75 + Math.random() * 0.5)
      for (const [i, ong] of this.thanTia.entries()) {
        const a = this.diemTia[i]!
        const b = this.diemTia[i + 1]!
        TAM.subVectors(b, a)
        const dai = TAM.length()
        if (dai < 1e-4) { ong.visible = false; continue }
        ong.visible = true
        ong.position.copy(a).addScaledVector(TAM, 0.5)
        ong.quaternion.setFromUnitVectors(TRUC_Y, TAM.normalize())
        ong.scale.set(ban, dai, ban)
      }
    }
  }

  private phaCham(t: number, truoc: number, dt: number, co: number): void {
    if (truoc < MOC_NO) this.batDauCham(co)
    const u = (t - MOC_NO) / (1 - MOC_NO)
    this.dan.visible = false
    this.quangNo.visible = false
    for (const m of this.duoi) m.visible = false
    for (const m of this.veTinh) m.visible = false
    if (this.tia !== null) this.tia.visible = false
    for (const m of this.thanTia) m.visible = false

    // ĐÈN LOÉ tắt rất nhanh theo hàm mũ — chớp sáng rồi trả cảnh về như cũ.
    // Cuồng nộ sáng gấp hơn ba lần chưởng thường; đây là chỗ "dữ dội" nằm.
    this.denNo.intensity = (this.cuongNo ? 24 : 7) * Math.max(0, 1 - u * 2.6) ** 2

    // SÓNG: mỗi kiểu nổ nở ra một kiểu.
    const mSong = this.song.material as THREE.MeshBasicMaterial
    switch (this.net.kieuNo) {
      case 'loc':
        // Lốc phễu: xoáy tít và cao dần.
        this.song.scale.set((0.32 + u * 1.25) * co, (0.4 + u * 1.5) * co, (0.32 + u * 1.25) * co)
        this.song.rotation.y += dt * 16
        break
      case 'tinhThe':
        // Măng tinh thể: mọc vọt lên rồi đứng.
        this.song.scale.set(co, (0.3 + Math.min(1, u * 2.4) * 2.2) * co, co)
        break
      case 'vung':
        // Vũng acid: loang rộng trên mặt đất.
        this.song.scale.setScalar((0.5 + u * 4.2) * co)
        break
      default:
        this.song.scale.setScalar((0.4 + u * 3.6) * co)
        this.song.rotation.z += dt * 4
    }
    // Vật liệu cộng sáng: 0,95 là loá trắng bệt. 0,62 vẫn rực mà còn thấy hình.
    mSong.opacity = 0.62 * (1 - u)

    for (const m of this.manh) {
      const huong = m.userData.huong as THREE.Vector3 | undefined
      if (huong !== undefined) m.position.addScaledVector(huong, dt * (this.cuongNo ? 5.4 : 3.4))
    }
    ;(this.manh[0]!.material as THREE.MeshBasicMaterial).opacity = 1 - u

    if (this.cuongNo) {
      // Sóng loang mặt đất + chớp loá: hai thứ chỉ cuồng nộ mới có.
      this.songDat.scale.setScalar(0.6 + u * 6)
      ;(this.songDat.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - u)
      const c = Math.max(0, 1 - u * 3.2)
      this.chop.visible = c > 0
      this.chop.scale.setScalar(0.45 + (1 - c) * 1.5)
      ;(this.chop.material as THREE.MeshBasicMaterial).opacity = c * 0.6
    }
  }

  /**
   * SÁU CHƯỞNG TỐI THƯỢNG.
   *
   * Dựng theo đúng sáu tấm ảnh thầy gửi 15-09. Điểm chung: bắt đầu từ lúc
   * phóng (`MOC_BAY`), mạnh nhất ở khoảng giữa, tắt dần về cuối — nên nó ôm
   * trọn cú chưởng chứ không phải một chớp loé rời rạc.
   */
  private phaToiThuong(t: number, dt: number): void {
    const u = (t - MOC_BAY) / (1 - MOC_BAY)          // 0…1 suốt cú chưởng
    const manh = Math.sin(Math.min(1, u * 1.15) * Math.PI)   // lên rồi xuống
    const k = this.kieuTT

    if (k === 'tiaNgocBich' || k === 'tiaNganHa') {
      for (const [i, o] of this.tt.entries()) {
        o.visible = true
        const p = i / Math.max(1, this.tt.length - 1)
        o.scale.set(manh * (1 + p * 0.5), 1, manh * (1 + p * 0.5))
        o.rotation.y += dt * (k === 'tiaNganHa' ? 2.2 + i * 0.5 : 0.8 + i * 0.3)
        const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial
        m.opacity = (0.92 - p * 0.6) * manh
      }
    } else if (k === 'danPhao') {
      for (const [i, o] of this.tt.entries()) {
        // Sáu nòng bắn LỆCH NHỊP nhau — cả dàn nổ cùng lúc thì mất chất "dàn pháo".
        const tre = (i / this.tt.length) * 0.35
        const uu = Math.max(0, Math.min(1, (u - tre) * 1.9))
        o.visible = uu > 0
        o.scale.set(uu, 1, uu)
        ;((o as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.9 * Math.sin(uu * Math.PI)
      }
    } else if (k === 'bungNoMatTroi') {
      for (const [i, o] of this.tt.entries()) {
        o.visible = true
        if (i === 0) {
          o.scale.setScalar(0.2 + u * 2.3)
          o.rotation.z += dt * 1.1
        } else {
          const a = ((i - 1) / 8) * Math.PI * 2
          o.scale.setScalar(manh * (0.8 + u * 1.4))
          o.position.set(Math.cos(a) * (1.1 + u * 1.9), Math.sin(a) * (1.1 + u * 1.9), XA * 0.5)
        }
        ;((o as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = manh * 0.85
      }
    } else if (k === 'hongBang') {
      for (const [i, o] of this.tt.entries()) {
        o.visible = true
        const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial
        if (i === 0) {
          o.scale.set(0.3 + u * 1.1, 1, 0.3 + u * 1.1)
          m.opacity = manh * 0.45
        } else {
          // Phiến băng bay tới theo nhịp riêng, xoay tít.
          const pha = (o.userData.pha as number) ?? 0
          const w = (u * 1.6 + pha) % 1
          o.position.set((pha - 0.5) * 2.2, Math.sin(pha * 9) * 0.7, w * XA * 2)
          o.rotation.x += dt * 7
          o.rotation.y += dt * 5
          o.scale.setScalar(0.7 + w * 0.9)
          m.opacity = manh * 0.9 * (1 - w * 0.5)
        }
      }
    } else {
      for (const [i, o] of this.tt.entries()) {
        o.visible = true
        const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial
        if (i < 4) {
          const pha = (o.userData.pha as number) ?? 0
          const w = (u * 1.4 + pha) % 1
          o.position.z = w * XA * 2
          o.rotation.z += dt * (3 + i * 1.6)
          o.scale.setScalar(0.6 + w * 1.5)
          m.opacity = manh * 0.85 * (1 - w * 0.55)
        } else {
          o.scale.set(manh, 1, manh)
          o.rotation.y += dt * 4
          m.opacity = manh * 0.75
        }
      }
    }
  }

  private batDauCham(co: number): void {
    this.no = true
    const kieu = this.net.kieuNo
    this.song.position.set(0, kieu === 'vung' ? this.yDat + 0.02 : 0, XA)
    this.song.rotation.set(0, 0, 0)
    // Vũng acid nằm ngang trên đất; măng tinh thể dựng đứng; còn lại quay mặt
    // về phía máy quay.
    if (kieu === 'vung') this.song.rotation.x = -Math.PI / 2 - CHECH_DOC
    else if (kieu === 'loc') this.song.rotation.x = Math.PI
    this.song.visible = true
    this.denNo.position.set(0, 0, XA)

    if (this.cuongNo) {
      this.songDat.position.set(0, this.yDat + 0.03, XA)
      this.songDat.visible = true
      this.chop.position.set(0, 0, XA)
      this.chop.visible = true
    }

    const soManh = this.cuongNo ? SO_MANH : Math.round(SO_MANH / 2)
    for (const [i, m] of this.manh.entries()) {
      if (i >= soManh) { m.visible = false; continue }
      const a = (i / soManh) * Math.PI * 2
      const nghieng = ((i % 3) - 1) * 0.55
      m.position.set(0, 0, XA)
      m.scale.setScalar(co)
      m.userData.huong = new THREE.Vector3(
        Math.cos(a), Math.sin(a) * 0.8 + nghieng * 0.3, Math.sin(nghieng) * 0.6,
      ).normalize()
      m.visible = true
    }
  }

  dispose(): void {
    for (const r of this.rac) r.dispose()
    this.rac.length = 0
    this.nhom.clear()
  }
}
