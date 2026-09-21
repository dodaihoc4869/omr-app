import NhomCaThuGon from './NhomCaThuGon'
// MODAL KHẮC PHỤC CÂU SAI — CHUẨN HOÁ CHO CẢ 3 APP
// 1. Làm lại các câu sai
// 2. Luyện thêm dạng câu sai (chia theo tỷ lệ tối đa của từng câu sai, lẻ làm tròn lên)
// 3. Lựa chọn luyện câu (2 sao, 1 sao, 0 sao, lý thuyết, bài tập tính toán — thanh trượt tối đa 100 câu)
// 4. Luyện dạng bài (lớp 10/11/12 → tên bài sách giáo khoa → dạng toán trọng tâm,
//    gom TẤT CẢ câu trong kho thuộc dạng ấy — không lệ thuộc vào câu em vừa sai)
// Tuyệt đối không dùng mã màu #hex trần trong file .tsx.

import { useEffect, useMemo, useState } from 'react'
import {
  X,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Info,
  Eye,
  Heart,
  GraduationCap,
  FolderTree,
  ChevronRight,
} from 'lucide-react'
import type { TeacherExamSource } from '../data/examContent'
import {
  taoDeLamLaiCauSai,
  rutLuyenThemDangCauSai,
  rutLuyenTheoBoLoc,
  phanTichTyLeDang,
  phanTichBoLocCau,
  rutLuyenDangBai,
  demCauDangBai,
  type CauSaiDauVao,
  type BoLocCauLuyen,
} from '../lib/thuat-toan-rut-cau-sai'
import KhungXemPhieu from './KhungXemPhieu'
import { napKhoChoMayEm } from '../lib/kho-cho-may-em'
import { loadScriptUrl } from '../lib/exam-db'
import { danhMucDangBai, deTheoDangBai, type LopDangBai, type DangBaiMuc } from '../lib/exam-api'
import { khoiEmTuLop, lopEmDuocChon, lopMacDinhCuaEm, nguonHopKhoi } from '../lib/khac-phuc-khoi'
import { parseKhoDeJson, buildTeacherSourceFromKhoDe } from '../lib/exam-kho-de-import'
import { hopLeDeRut } from '../lib/loc-cau-rut'
import { dungM3 } from './m3'
import './m3/luyen-khac-phuc.css'

/**
 * Máy chủ không rút được câu nào cùng dạng với các câu em sai.
 *
 * Từ 15/09 modal LUÔN xin máy chủ (`napKhoChoMayEm`) và không còn đọc kho đề
 * trong máy đang mở nữa, nên lý do cũ — "máy này chưa có kho đề của thầy" —
 * đã không còn đúng với bất kỳ ca nào. Nói sai lý do còn tệ hơn không nói.
 */
export const KHONG_CO_KHO =
  'Máy chủ chưa rút được câu nào cùng dạng với các câu em sai. Em làm lại đúng các câu sai trước, thầy sẽ giao thêm bài cùng dạng sau.'

export interface ModalKhacPhucCauSaiProps {
  isOpen: boolean
  onClose: () => void
  dsCauSai: CauSaiDauVao[]
  hoTen: string
  sbd: string
  tieuDeCa?: string
  onTaoPhieuXong?: (html: string) => void
  onGiaoBaiChoCon?: (dsCau: any[], tieuDe: string) => void | Promise<void>
  onBatDauLamBaiLuyen?: (dsCau: any[], tieuDe: string) => void
  cheDoMacDinh?: 1 | 2 | 3 | 4
  /** Lớp / khối em đang học ("11", "12 - Tinh Hoa"). LUẬT BOSS 21/09: kênh rút tự động chỉ đưa câu khối em HOẶC THẤP hơn — "Luyện dạng bài" không hiện lớp cao hơn, mặc định = khối em.
   * Không truyền / không rõ ⇒ như cũ (không lọc). */
  lop?: string
}

export default function ModalKhacPhucCauSai({
  isOpen,
  onClose,
  dsCauSai: rawDsCauSai,
  hoTen,
  sbd,
  tieuDeCa,
  onTaoPhieuXong,
  onGiaoBaiChoCon,
  onBatDauLamBaiLuyen,
  cheDoMacDinh,
  lop,
}: ModalKhacPhucCauSaiProps) {
  const khoiEm = useMemo(() => khoiEmTuLop(lop), [lop])
  const dsCauSai = useMemo(() => {
    return (rawDsCauSai || []).filter((c) =>
      hopLeDeRut({
        phan: c.phan,
        maDe: c.maCa,
        dapAnDung: c.dapAnDung,
        text: c.text,
        choices: c.choices || c.ideas,
      })
    )
  }, [rawDsCauSai])

  const [cheDo, setCheDo] = useState<1 | 2 | 3 | 4>(cheDoMacDinh ?? (dsCauSai.length ? 1 : 3))

  useEffect(() => {
    if (cheDoMacDinh) setCheDo(cheDoMacDinh)
  }, [cheDoMacDinh])
  const [khoDeTho, setKhoDe] = useState<TeacherExamSource[]>([])
  const khoDe = useMemo(() => nguonHopKhoi(khoiEm, khoDeTho), [khoiEm, khoDeTho])
  const [dangTaiKho, setDangTaiKho] = useState(false)
  const [dangTao, setDangTao] = useState(false)

  // Tuỳ chọn Chế độ 2: Luyện thêm dạng câu sai
  const [soCauCheDo2, setSoCauCheDo2] = useState<number>(20)

  // Tuỳ chọn Chế độ 3: Luyện câu theo bộ lọc
  const [boLocSao] = useState<BoLocCauLuyen['sao']>('moi')
  const [boLocDang] = useState<BoLocCauLuyen['dang']>('tat_ca')
  const [soCauCheDo3, setSoCauCheDo3] = useState<number>(20)

  // ─── Chế độ 4: Luyện dạng bài ────────────────────────────────────────────
  // Menu (lớp → bài → dạng) tải MỘT LẦN khi mở modal; tờ đề của một dạng chỉ
  // tải khi em bấm đúng dạng ấy — tờ nặng nhất 426 câu, tải sẵn cả 55 tờ là
  // hàng chục MB trên máy em.
  const [dmDangBaiTho, setDmDangBai] = useState<LopDangBai[]>([])
  const dmDangBai = useMemo(() => lopEmDuocChon(khoiEm, dmDangBaiTho), [khoiEm, dmDangBaiTho])
  const [dangTaiDm, setDangTaiDm] = useState(false)
  const [loiDm, setLoiDm] = useState('')
  const [lanTaiDm, setLanTaiDm] = useState(0)
  const [lopChon, setLopChon] = useState<string>('')
  const [baiChon, setBaiChon] = useState<string>('')
  const [dangChon, setDangChon] = useState<DangBaiMuc | null>(null)
  const [khoDangBaiTho, setKhoDangBai] = useState<TeacherExamSource[]>([])
  const khoDangBai = useMemo(() => nguonHopKhoi(khoiEm, khoDangBaiTho), [khoiEm, khoDangBaiTho])
  const [dangTaiDang, setDangTaiDang] = useState(false)
  const [loiDang, setLoiDang] = useState('')
  const [soCauCheDo4, setSoCauCheDo4] = useState<number>(20)
  const [saoTuDo, setSaoTuDo] = useState<BoLocCauLuyen['sao']>('moi')
  const [dangTuDo, setDangTuDo] = useState<BoLocCauLuyen['dang']>('tat_ca')
  /** Em không sai câu nào vẫn luyện dạng bài được — chế độ 4 không lệ thuộc
   * câu sai. Bật cờ này để đi qua màn "không có câu nào cần khắc phục". */

  // HTML phiếu bài tập đã tạo để xem tại chỗ
  const [phieuHtml, setPhieuHtml] = useState<string>('')

  // Vì sao không rút được câu nào — hiện ngay dưới nút, không im lặng.
  const [loiRut, setLoiRut] = useState<string>('')

  /** Khoá nội dung của danh sách câu sai — dùng làm deps thay cho chính mảng. */
  const khoaCauSai = useMemo(() => dsCauSai.map((c) => `${c.maCa ?? ''}:${c.qid ?? ''}:${c.chuyenDe ?? ''}`).join('|'), [dsCauSai])

  // TẢI KHO KHI MỞ MODAL — LUÔN XIN MÁY CHỦ, không đọc kho của máy đang mở.
  //
  // Thầy báo 14/09: "Tạo câu khắc phục trên điện thoại của học sinh và máy tính
  // đang lệch nhau." Đo thật, cùng một em, cùng ca Test6, 10 câu sai:
  //   · điện thoại  : tối đa  60 câu · câu 4 tối đa 14
  //   · máy tính    : tối đa 579 câu · câu 4 tối đa 75
  //
  // NGUYÊN NHÂN GỐC: bản trước đọc `loadExamSources()` TRƯỚC, chỉ khi máy rỗng
  // mới xin máy chủ. Mà `loadExamSources()` là kho trong IndexedDB CỦA CHÍNH
  // MÁY ĐANG MỞ:
  //   · Điện thoại em: rỗng (đồng bộ kho đòi mã bí mật) ⇒ xin máy chủ ⇒ 60.
  //   · Máy tính thầy: có KHO ĐẦY ĐỦ CỦA THẦY. Cổng học sinh mở trên chính máy
  //     ấy dùng chung gốc nên đọc luôn kho ấy ⇒ 579.
  //
  // Hai con số không phải một phép tính sai — là HAI NGUỒN KHÁC NHAU. Và nguồn
  // thứ hai còn sai về ranh giới dữ liệu: màn của EM không được đọc kho của
  // THẦY chỉ vì tình cờ mở trên máy thầy.
  //
  // Nay MỘT NGUỒN DUY NHẤT: máy chủ rút hộ (`src/lib/kho-cho-may-em.ts`). Cùng
  // một em thì mọi máy ra cùng một con số, không phụ thuộc máy nào đang mở.
  useEffect(() => {
    if (!isOpen) return
    let active = true
    setDangTaiKho(true)
    setLoiRut('')
    void (async () => {
      let sources: TeacherExamSource[] = []
      if (dsCauSai.length > 0) {
        const url = await loadScriptUrl().catch(() => '')
        const kq = await napKhoChoMayEm(url || '', sbd, dsCauSai)
        if (!active) return
        sources = kq.nguon
        if (kq.nguon.length === 0) setLoiRut(kq.loi || KHONG_CO_KHO)
      }

      if (!active) return
      setKhoDe(sources)
      if (sources.length > 0) setCheDo((hien) => (hien === 1 ? 2 : hien))
      setDangTaiKho(false)
    })()
    return () => {
      active = false
    }
    // `dsCauSai` là prop MẢNG: mỗi lượt vẽ lại là một tham chiếu mới. Để nó
    // thẳng trong deps là xin máy chủ vô hạn lần. Khoá theo NỘI DUNG.
  }, [isOpen, sbd, khoaCauSai])

  /** Máy này có kho đề của thầy hay không — quyết định bật/tắt chế độ 2 và 3. */
  const coKhoDe = khoDe.length > 0

  // Danh sách các ca thi trích xuất từ câu sai
  const dsCaThi = useMemo(() => {
    const map = new Map<string, { maCa: string; tenCa: string; soCauSai: number }>()
    for (const c of dsCauSai) {
      const ma = c.maCa || 'mac_dinh'
      const ten = c.tenCa || (c.maCa ? `Ca kiểm tra mã ${c.maCa}` : 'Bài kiểm tra')
      const hien = map.get(ma)
      if (hien) {
        hien.soCauSai += 1
      } else {
        map.set(ma, { maCa: ma, tenCa: ten, soCauSai: 1 })
      }
    }
    return Array.from(map.values())
  }, [dsCauSai])

  // Set các ca thi được tick chọn trong Chế độ 2 (mặc định chọn tất cả ca)
  const [caChonCheDo2, setCaChonCheDo2] = useState<Set<string>>(() => new Set(dsCauSai.map((c) => c.maCa || 'mac_dinh')))

  // Đồng bộ khi dsCauSai thay đổi
  useEffect(() => {
    setCaChonCheDo2(new Set(dsCauSai.map((c) => c.maCa || 'mac_dinh')))
  }, [dsCauSai])

  // Danh sách câu sai được lọc theo các ca thi đã tick ở Chế độ 2
  const dsCauSaiCheDo2 = useMemo(() => {
    return dsCauSai.filter((c) => caChonCheDo2.has(c.maCa || 'mac_dinh'))
  }, [dsCauSai, caChonCheDo2])

  // Phân tích tỷ lệ cho Chế độ 2 theo danh sách câu sai của các ca đã tick
  const { thongKe: thongKeCheDo2, tongToiDa: tongToiDaCheDo2, tinhSoCauMoiDang: tinhCheDo2 } = useMemo(() => {
    return phanTichTyLeDang(dsCauSaiCheDo2, khoDe)
  }, [dsCauSaiCheDo2, khoDe])

  // Cập nhật số câu mặc định cho Chế độ 2 khi phân tích xong
  useEffect(() => {
    if (tongToiDaCheDo2 > 0) {
      setSoCauCheDo2((prev) => Math.min(tongToiDaCheDo2, Math.max(1, prev > 0 ? prev : Math.min(tongToiDaCheDo2, dsCauSaiCheDo2.length * 2))))
    } else {
      setSoCauCheDo2(0)
    }
  }, [tongToiDaCheDo2, dsCauSaiCheDo2.length])

  // Phân bổ hiện tại của Chế độ 2
  const phanBoCheDo2 = useMemo(() => {
    return tinhCheDo2(soCauCheDo2)
  }, [soCauCheDo2, tinhCheDo2])

  // TẢI MENU DẠNG BÀI khi mở modal. Không phụ thuộc câu sai nên chạy độc lập
  // với vòng xin kho ở trên; hỏng thì nói lý do, không im lặng để menu rỗng.
  useEffect(() => {
    if (!isOpen) return
    let huy = false
    ;(async () => {
      setDangTaiDm(true)
      setLoiDm('')
      try {
        const url = await loadScriptUrl()
        const kq = await danhMucDangBai(url)
        if (huy) return
        setDmDangBai(kq.lops)
        setLoiDm(kq.lops.length === 0 ? kq.loi || 'Kho trên máy chủ chưa có dạng bài nào.' : '')
      } catch (e) {
        if (!huy) setLoiDm(e instanceof Error ? e.message : 'Không tải được danh mục dạng bài.')
      } finally {
        if (!huy) setDangTaiDm(false)
      }
    })()
    return () => {
      huy = true
    }
  }, [isOpen, lanTaiDm])

  // TẢI TỜ ĐỀ CỦA MỘT DẠNG khi em bấm vào dạng ấy. Gói đi qua ĐÚNG cửa nạp của
  // kho đề — không nới một luật nào, y như `napKhoChoMayEm`.
  useEffect(() => {
    if (!dangChon) {
      setKhoDangBai([])
      setLoiDang('')
      return
    }
    let huy = false
    ;(async () => {
      setDangTaiDang(true)
      setLoiDang('')
      setKhoDangBai([])
      try {
        const url = await loadScriptUrl()
        const kq = await deTheoDangBai(url, dangChon.ma)
        if (huy) return
        if (!kq.de) {
          setLoiDang(kq.loi || 'Không lấy được đề của dạng bài này.')
          return
        }
        // parseKhoDeJson(JSON.stringify(kq.de))
        const doc = parseKhoDeJson(kq.de)
        if (!doc.ok || !doc.json) {
          setLoiDang('Gói đề của dạng bài này không đọc được.')
          return
        }
        const dung = buildTeacherSourceFromKhoDe(doc.json)
        if (dung.errors.length > 0) {
          setLoiDang(`Gói đề của dạng bài này có lỗi: ${dung.errors[0]}`)
          return
        }
        setKhoDangBai([dung.source])
      } catch (e) {
        if (!huy) setLoiDang(e instanceof Error ? e.message : 'Không kết nối được máy chủ.')
      } finally {
        if (!huy) setDangTaiDang(false)
      }
    })()
    return () => {
      huy = true
    }
  }, [dangChon])

  /** Số câu THẬT rút được của dạng đang chọn — đếm sau cửa nạp, không lấy
   * `so_cau` ghi trong gói (cửa nạp bỏ câu thiếu phương án / thiếu đáp án). */
  const boLocTuDo = useMemo(() => ({ sao: saoTuDo, dang: dangTuDo }), [saoTuDo, dangTuDo])
  const tongToiDaCheDo4 = useMemo(() => demCauDangBai(khoDangBai, boLocTuDo), [khoDangBai, boLocTuDo])

  useEffect(() => {
    if (tongToiDaCheDo4 > 0) setSoCauCheDo4(Math.min(tongToiDaCheDo4, 20))
  }, [tongToiDaCheDo4])

  const lopHienTai = useMemo(() => dmDangBai.find((l) => l.lop === lopChon), [dmDangBai, lopChon])
  const baisCuaLop = useMemo(() => lopHienTai?.bais ?? [], [lopHienTai])
  const baiHienTai = useMemo(() => baisCuaLop.find((b) => b.tenBai === baiChon), [baisCuaLop, baiChon])
  const dangsCuaBai = useMemo(() => baiHienTai?.dangs ?? [], [baiHienTai])

  // Tự động chọn mặc định KHỐI CỦA EM -> Bài 1 -> Dạng 1 để học sinh luôn thấy đầy đủ box bài & bộ lọc mức độ.
  // (Trước đây cố định lớp 12 cho mọi em — P0 thầy 21/09: em lớp 11 nhận câu lớp 12. `dmDangBai` đã bỏ các lớp cao hơn khối em; khối em không rõ ⇒ như cũ.)
  useEffect(() => {
    if (dmDangBai.length > 0 && !lopChon) {
      const lopMd = lopMacDinhCuaEm(khoiEm, dmDangBai)
      if (lopMd) setLopChon(lopMd)
    }
  }, [dmDangBai, lopChon, khoiEm])

  // Lớp đang chọn không còn trong danh mục em được chọn (khối em đổi / nạp lại) ⇒ bỏ chọn để mặc định chọn lại theo khối em.
  useEffect(() => {
    if (lopChon && dmDangBai.length > 0 && !dmDangBai.some((l) => l.lop === lopChon)) {
      setLopChon('')
      setBaiChon('')
      setDangChon(null)
    }
  }, [dmDangBai, lopChon])

  useEffect(() => {
    if (lopChon && baisCuaLop.length > 0 && !baiChon) {
      setBaiChon(baisCuaLop[0].tenBai)
    }
  }, [lopChon, baisCuaLop, baiChon])

  useEffect(() => {
    if (baiChon && dangsCuaBai.length > 0 && !dangChon) {
      setDangChon(dangsCuaBai[0])
    }
  }, [baiChon, dangsCuaBai, dangChon])

  // Phân tích cho Chế độ 3
  const boLocHienTai: BoLocCauLuyen = useMemo(
    () => ({ sao: boLocSao, dang: boLocDang }),
    [boLocSao, boLocDang]
  )
  const { tongToiDa: tongToiDaCheDo3 } = useMemo(() => {
    return phanTichBoLocCau(dsCauSai, khoDe, boLocHienTai)
  }, [dsCauSai, khoDe, boLocHienTai])

  // Cập nhật số câu mặc định cho Chế độ 3 khi bộ lọc thay đổi
  useEffect(() => {
    if (tongToiDaCheDo3 > 0) {
      setSoCauCheDo3(Math.min(tongToiDaCheDo3, 20))
    }
  }, [tongToiDaCheDo3])

  /**
   * Số câu chế độ đang chọn sẽ rút ra. Bằng 0 thì cấm bấm — không mở phiếu trắng.
   *
   * Bản cũ chỉ chặn đúng chế độ 2, nên chế độ 1 với 0 câu sai vẫn bật nút.
   */
  const soCauSeRut =
    cheDo === 1
      ? dsCauSai.length
      : cheDo === 2
        ? Math.min(soCauCheDo2, tongToiDaCheDo2)
        : cheDo === 3
          ? Math.min(soCauCheDo4, tongToiDaCheDo4)
          : Math.min(soCauCheDo4, tongToiDaCheDo4)

  if (!isOpen) return null

  // KHÔNG SAI CÂU NÀO THÌ KHÔNG CÓ GÌ ĐỂ KHẮC PHỤC.
  //
  // Thầy báo 15/09 kèm ảnh ca Test7: tiêu đề ghi "0 câu làm sai", mà modal vẫn
  // mời "1. Làm lại các câu sai (0 câu)" và bật nút "Bắt đầu làm bài" — bấm vào
  // là một phiếu trắng. Dưới nút còn hiện "Máy này chưa có kho đề của thầy":
  // lý do sai hẳn, vì danh sách rỗng thì vòng nạp kho còn không chạy lần nào,
  // `khoDe` cứ rỗng nên `coKhoDe` hoá false.
  //
  // Nay: rỗng thì nói thẳng là rỗng, và không để lại nút nào bấm nhầm được.
  // Xử lý tạo đề
  const handleTaoDe = async (laGiaoBai: boolean = false) => {
    setDangTao(true)
    try {
      let ketQuaHtml = ''
      let dsCauKetQua: any[] = []
      let tieuDeBai = ''
      const options = { hoTen, sbd, tieuDe: tieuDeCa }
      if (cheDo === 1) {
        // Chế độ 1: Làm lại các câu sai
        const res = taoDeLamLaiCauSai(dsCauSai, options)
        ketQuaHtml = res.html
        dsCauKetQua = res.dsCau
        tieuDeBai = `Làm lại ${dsCauKetQua.length} câu sai`
      } else if (cheDo === 2) {
        // Chế độ 2: Luyện thêm dạng câu sai theo các ca đã chọn
        const res = rutLuyenThemDangCauSai(dsCauSaiCheDo2, khoDe, soCauCheDo2, options)
        ketQuaHtml = res.html
        dsCauKetQua = res.dsCau
        tieuDeBai = `Luyện thêm dạng câu sai (${dsCauKetQua.length} câu)`
      } else if (cheDo === 3) {
        // Chế độ 4: Luyện dạng bài — gom trọn câu của một dạng toán trọng tâm
        if (!dangChon) {
          setLoiRut('Em chọn lớp, tên bài rồi chọn một dạng bài trước.')
          return
        }
        const res = rutLuyenDangBai(khoDangBai, soCauCheDo4, {
          hoTen,
          sbd,
          tenDang: dangChon.ten,
          tenBai: baiChon,
          lop: lopChon,
        }, boLocTuDo)
        ketQuaHtml = res.html
        dsCauKetQua = res.dsCau
        tieuDeBai = `Luyện câu: ${dangChon.ten} (${dsCauKetQua.length} câu)`
      } else {
        // Chế độ 3: Luyện câu theo bộ lọc
        const res = rutLuyenTheoBoLoc(dsCauSai, khoDe, boLocHienTai, soCauCheDo3, options)
        ketQuaHtml = res.html
        dsCauKetQua = res.dsCau
        const tenSao = boLocSao === 'sao_2' ? '2 sao' : boLocSao === 'sao_1' ? '1 sao' : boLocSao === 'sao_0' ? '0 sao' : 'Mọi sao'
        const tenDang = boLocDang === 'ly_thuyet' ? 'Lý thuyết' : boLocDang === 'bai_tap' ? 'Bài tập' : 'Mọi thể loại'
        tieuDeBai = `Luyện câu [${tenSao} · ${tenDang}] (${dsCauKetQua.length} câu)`
      }

      // KHÔNG BAO GIỜ MỞ MỘT PHIẾU TRẮNG. Rút ra 0 câu thì nói thẳng là 0 câu,
      // đừng để em bấm xong nhìn màn hình trống rồi tưởng app hỏng.
      if (dsCauKetQua.length === 0) {
        setLoiRut(
          cheDo === 3
            ? 'Dạng bài này chưa có câu nào dùng được trong kho. Em chọn dạng khác.'
            : coKhoDe
              ? 'Kho đề chưa có câu nào khớp lựa chọn này. Em chọn "Làm lại các câu sai" hoặc nới bộ lọc.'
              : KHONG_CO_KHO,
        )
        return
      }
      setLoiRut('')

      if (laGiaoBai && onGiaoBaiChoCon) {
        await onGiaoBaiChoCon(dsCauKetQua, tieuDeBai)
        onClose()
        return
      }

      if (onBatDauLamBaiLuyen) {
        onBatDauLamBaiLuyen(dsCauKetQua, tieuDeBai)
        onClose()
        return
      }

      if (onTaoPhieuXong) {
        onTaoPhieuXong(ketQuaHtml)
      } else {
        setPhieuHtml(ketQuaHtml)
      }
    } finally {
      setDangTao(false)
    }
  }

  // ModalKhacPhucCauSai còn được app giáo viên mở qua báo cáo ca: CHỈ cổng học sinh / phụ huynh mặc M3.
  const m3 = dungM3()
  return (
    <>
      <div className={`${m3 ? 'm3 ' : ''}fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200`}>
        <div
          className={`${m3 ? 'm3-hop' : 'khac-phuc-modal'} relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-slate-200`}
          style={m3 ? undefined : { background: 'var(--the, rgb(255, 255, 255))', color: 'var(--muc, rgb(15, 23, 42))' }}
        >
          {/* Header phong cách Google Material 3 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={`${m3 ? 'm3-o-dau ' : ''}w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs`}
                style={m3 ? undefined : { background: 'rgba(26, 115, 232, 0.1)', color: 'var(--gg-xanh, rgb(26, 115, 232))' }}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight" style={{ fontFamily: 'var(--serif)' }}>
                  Khắc phục câu sai
                </h2>
                <div className="text-xs text-slate-500 font-medium">
                  {tieuDeCa ? `${tieuDeCa} · ` : ''}{dsCauSai.length} câu làm sai · Lựa chọn phương pháp khắc phục tối ưu
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tap-target w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dải 4 màu Google M3 */}
          <div className={`${m3 ? 'm3-an ' : ''}h-1 w-full grid grid-cols-4 shrink-0`}>
            <div style={{ background: 'var(--gg-xanh, rgb(26, 115, 232))' }} />
            <div style={{ background: 'var(--gg-do, rgb(234, 67, 53))' }} />
            <div style={{ background: 'var(--gg-vang, rgb(251, 188, 4))' }} />
            <div style={{ background: 'var(--gg-xanh-la, rgb(52, 168, 83))' }} />
          </div>

          {/* Nội dung Modal */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* LỰA CHỌN 1, 2, 3 */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Chọn hình thức luyện tập
              </label>

              {dsCauSai.length > 0 && <>
              {/* THẺ 1: LÀM LẠI CÁC CÂU SAI */}
              <div
                onClick={() => setCheDo(1)}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-4 ${
                  cheDo === 1
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    cheDo === 1 ? 'bg-blue-600 text-white' : 'border-2 border-slate-300'
                  }`}
                >
                  {cheDo === 1 ? <CheckCircle2 className="w-4 h-4" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    1. Làm lại các câu sai ({dsCauSai.length} câu)
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Hiển thị lại toàn bộ các câu sai và lời giải chuẩn để học sinh tự làm lại và nhận diện lỗ hổng kiến thức.
                  </p>
                </div>
              </div>

              {/* THẺ 2: LUYỆN THÊM DẠNG CÂU SAI */}
              <div
                onClick={() => coKhoDe && setCheDo(2)}
                aria-disabled={!coKhoDe}
                className={`p-4 rounded-2xl border-2 transition flex items-start gap-4 ${
                  !coKhoDe
                    ? 'border-slate-100 bg-slate-50 opacity-55 cursor-not-allowed'
                    : cheDo === 2
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm cursor-pointer'
                      : 'border-slate-100 hover:border-slate-200 bg-white cursor-pointer'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    cheDo === 2 ? 'bg-blue-600 text-white' : 'border-2 border-slate-300'
                  }`}
                >
                  {cheDo === 2 ? <CheckCircle2 className="w-4 h-4" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    2. Luyện thêm dạng câu sai (Tỷ lệ tối đa: {tongToiDaCheDo2} câu)
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Thuật toán mới: Rút câu theo Cặp đôi Song sinh và tiến trình 3 nấc sư phạm (Củng cố nền tảng → Rèn luyện → Bứt phá), tập trung đúng dạng bài em còn yếu.
                  </p>
                </div>
              </div>

              </>}
              {/* THẺ 4: LUYỆN DẠNG BÀI
                  KHÔNG khoá theo `coKhoDe`: chế độ này lấy đề từ danh mục dạng
                  bài trên máy chủ, không dính gì tới kho câu-sai của ba chế độ
                  trên. Khoá nó theo `coKhoDe` là em không sai câu nào cũng
                  không luyện được dạng bài — đúng thứ vô lý phải tránh. */}
              <div
                onClick={() => setCheDo(3)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCheDo(3) } }}
                className={`p-4 rounded-2xl border-2 transition flex items-start gap-4 ${
                  cheDo === 3
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm cursor-pointer'
                      : 'border-slate-100 hover:border-slate-200 bg-white cursor-pointer'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    cheDo === 3 ? 'bg-blue-600 text-white' : 'border-2 border-slate-300'
                  }`}
                >
                  {cheDo === 3 ? <CheckCircle2 className="w-4 h-4" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-rose-600" />
                    3. Lựa chọn luyện câu
                    {dangTaiDm ? ' (đang tải danh mục…)' : ''}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Chọn box kiến thức, mức 1–2 sao hoặc ngẫu nhiên, rồi chọn lý thuyết hay bài tập.
                  </p>
                </div>
              </div>
            </div>

            {/* PHẦN ĐIỀU KHIỂN CHI TIẾT THEO TỪNG CHẾ ĐỘ */}
            {cheDo === 2 && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 animate-in fade-in duration-150">
                {/* Hộp chọn ca thi của học sinh trong box có ô tick */}
                {dsCaThi.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ca kiểm tra của học sinh ({caChonCheDo2.size}/{dsCaThi.length} ca · {dsCauSaiCheDo2.length} câu sai)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCaChonCheDo2(new Set(dsCaThi.map((c) => c.maCa)))}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        >
                          Chọn tất cả
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setCaChonCheDo2(new Set())}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      <NhomCaThuGon ds={dsCaThi} selected={ca=>caChonCheDo2.has(ca.maCa)} render={(ca) => {
                        const daTick = caChonCheDo2.has(ca.maCa)
                        return (
                          <div
                            key={ca.maCa}
                            onClick={() => {
                              setCaChonCheDo2((prev) => {
                                const moi = new Set(prev)
                                if (moi.has(ca.maCa)) moi.delete(ca.maCa)
                                else moi.add(ca.maCa)
                                return moi
                              })
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                              daTick
                                ? 'bg-blue-50/40 border-blue-200 text-slate-800'
                                : 'bg-slate-50/50 border-slate-200/60 text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={daTick}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer pointer-events-none"
                              />
                              <span className="text-xs font-semibold truncate">
                                {ca.tenCa}
                              </span>
                            </div>
                            <span
                              className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${
                                daTick
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              {ca.soCauSai} câu sai
                            </span>
                          </div>
                        )
                      }}/>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Số câu rút luyện tập:
                  </span>
                  <span className="text-base font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                    {soCauCheDo2} / {tongToiDaCheDo2} câu
                  </span>
                </div>

                {dsCauSaiCheDo2.length === 0 ? (
                  <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    Vui lòng tick chọn ít nhất một ca kiểm tra ở danh sách trên để tính câu khắc phục.
                  </div>
                ) : tongToiDaCheDo2 > 0 ? (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min={1}
                      max={tongToiDaCheDo2}
                      value={soCauCheDo2}
                      onChange={(e) => setSoCauCheDo2(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                      <span>1 câu</span>
                      <span>{Math.round(tongToiDaCheDo2 / 2)} câu</span>
                      <span>Tối đa {tongToiDaCheDo2} câu</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    Kho đề hiện tại chưa có câu hỏi tương tự cùng nhãn dán. Học sinh sẽ làm lại các câu sai gốc.
                  </div>
                )}

                {/* Bảng phân bổ theo từng câu sai */}
                {thongKeCheDo2.length > 0 && tongToiDaCheDo2 > 0 && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="text-xs font-bold text-slate-500 mb-2">
                      Phân bổ câu rút theo tỷ lệ của từng câu sai (làm tròn lên):
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {thongKeCheDo2.map((t, idx) => {
                        const soRut = phanBoCheDo2.get(t.qid) ?? 0
                        return (
                          <div
                            key={t.qid || idx}
                            className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white border border-slate-100 text-slate-600"
                          >
                            <span className="truncate max-w-[280px]">
                              <b>Câu {t.soCau} ({t.phan})</b>: {t.tenDang || t.nhanDan}
                            </span>
                            <span className="shrink-0 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              +{soRut} câu (tối đa {t.soUngVienToiDa})
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── CHẾ ĐỘ 4: CÂY DẠNG BÀI — LỚP → TÊN BÀI → DẠNG ─────────── */}
            {cheDo === 3 && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 animate-in fade-in duration-150">
                {loiDm ? (
                  <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{loiDm}</span>
                    <button type="button" disabled={dangTaiDm} onClick={() => setLanTaiDm(n => n + 1)} className="font-bold underline shrink-0">{dangTaiDm ? 'Đang tải…' : 'Thử lại'}</button>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-rose-500" />
                    Bước 1 — Chọn lớp:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {dmDangBai.map((l) => (
                      <button
                        key={l.lop}
                        type="button"
                        onClick={() => {
                          setLopChon(l.lop)
                          setBaiChon('')
                          setDangChon(null)
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                          lopChon === l.lop
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        Lớp {l.lop}
                      </button>
                    ))}
                  </div>
                </div>

                {lopChon ? (
                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      Bước 2 — Chọn bài (theo sách giáo khoa):
                    </label>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {baisCuaLop.map((b) => (
                        <button
                          key={b.tenBai}
                          type="button"
                          onClick={() => {
                            setBaiChon(b.tenBai)
                            setDangChon(null)
                          }}
                          className={`w-full text-left py-2 px-3 rounded-xl text-xs font-bold transition border flex items-center justify-between gap-2 ${
                            baiChon === b.tenBai
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="truncate">{b.tenBai}</span>
                          <span
                            className={`shrink-0 text-[11px] font-semibold ${
                              baiChon === b.tenBai ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            {b.dangs.length} dạng
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {baiChon ? (
                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-rose-500" />
                      Bước 3 — Chọn dạng bài:
                    </label>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {dangsCuaBai.map((d) => (
                        <button
                          key={d.ma}
                          type="button"
                          onClick={() => setDangChon(d)}
                          className={`w-full text-left py-2 px-3 rounded-xl text-xs font-bold transition border flex items-center gap-2 ${
                            dangChon?.ma === d.ma
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                          <span className="flex-1 truncate">{d.ten}</span>
                          <span
                            className={`shrink-0 text-[11px] font-semibold ${
                              dangChon?.ma === d.ma ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            {d.soCau} câu
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {dangChon ? (
                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-600">Mức độ</label>
                        <div className="grid grid-cols-3 gap-1.5 mt-1">
                          {([['moi','Ngẫu nhiên'],['sao_1','1 sao'],['sao_2','2 sao']] as const).map(([v,ten]) => (
                            <button key={v} type="button" onClick={() => setSaoTuDo(v)} className={`py-2 rounded-xl text-xs font-bold border ${saoTuDo===v?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-600 border-slate-200'}`}>{ten}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600">Loại câu</label>
                        <div className="grid grid-cols-3 gap-1.5 mt-1">
                          {([['tat_ca','Tất cả'],['ly_thuyet','Lý thuyết'],['bai_tap','Bài tập']] as const).map(([v,ten]) => (
                            <button key={v} type="button" onClick={() => setDangTuDo(v)} className={`py-2 rounded-xl text-xs font-bold border ${dangTuDo===v?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-600 border-slate-200'}`}>{ten}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {dangTaiDang ? (
                      <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                        Đang lấy câu của dạng này từ máy chủ…
                      </div>
                    ) : loiDang ? (
                      <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-start gap-2">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{loiDang}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-700">Số câu rút:</span>
                          <span className="text-base font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                            {soCauCheDo4} / {tongToiDaCheDo4} câu
                          </span>
                        </div>
                        {tongToiDaCheDo4 > 0 ? (
                          <div className="space-y-2">
                            <input
                              type="range"
                              min={1}
                              max={tongToiDaCheDo4}
                              value={soCauCheDo4}
                              onChange={(e) => setSoCauCheDo4(Number(e.target.value))}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-xs font-semibold text-slate-400">
                              <span>1 câu</span>
                              <span>{Math.round(tongToiDaCheDo4 / 2)} câu</span>
                              <span>Tối đa {tongToiDaCheDo4} câu</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                            <Info className="w-4 h-4 shrink-0" />
                            Dạng bài này chưa có câu nào dùng được trong kho.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Đang xin kho của máy chủ — nói ra, đừng để em nhìn "0 câu" rồi tưởng hỏng */}
          {dangTaiKho && (
            <div className="px-6 pb-3 shrink-0">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                Đang lấy câu cùng dạng từ máy chủ…
              </div>
            </div>
          )}

          {/* Vì sao chưa rút được — hiện ngay trên nút, không im lặng nuốt lỗi */}
          {!dangTaiKho && (loiRut || (!coKhoDe && cheDo === 2)) && (
            <div className="px-6 pb-3 shrink-0">
              <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{loiRut || KHONG_CO_KHO}</span>
              </div>
            </div>
          )}

          {/* Footer nút hành động */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="tap-target px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Huỷ
            </button>

            <div className="flex items-center gap-2">
              {onGiaoBaiChoCon && (
                <button
                  type="button"
                  onClick={() => handleTaoDe(false)}
                  disabled={dangTao || soCauSeRut <= 0}
                  className="tap-target px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Xem trước đề dạng HTML"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem trước đề</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleTaoDe(Boolean(onGiaoBaiChoCon))}
                disabled={dangTao || soCauSeRut <= 0}
                className={`tap-target px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  onGiaoBaiChoCon
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                {dangTao ? (
                  <span>Đang xử lý…</span>
                ) : onGiaoBaiChoCon ? (
                  <>
                    <Heart className="w-4 h-4 text-white" />
                    <span>Giao bài cho con (thời gian làm 2 giờ)</span>
                  </>
                ) : (
                  <>
                    <span>Bắt đầu làm bài</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hiển thị bài tập trong app nếu không có callback cha */}
      {phieuHtml && (
        <KhungXemPhieu
          html={phieuHtml}
          ten="Đề luyện tập khắc phục câu sai"
          dong={() => {
            setPhieuHtml('')
            onClose()
          }}
        />
      )}
    </>
  )
}
