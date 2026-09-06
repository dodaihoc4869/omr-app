// TRỢ LÝ TRONG APP — TẦNG DỰNG CÂU TRẢ LỜI (TRO-LY-TRONG-APP.md, luồng bước 4).
//
// THUẦN: nhận dữ liệu đã lấy sẵn, trả ra chữ. Không đụng mạng, không đụng
// IndexedDB, không đụng DOM — nên mọi con số trong câu trả lời kiểm được bằng
// test, so bằng số chứ không so bằng mắt.
//
// LUẬT ĐỎ CỦA TẦNG NÀY: KHÔNG CÓ DỮ LIỆU THÌ NÓI KHÔNG CÓ. Cấm suy ra một con
// số từ chỗ khác rồi in như thể là số thật — thầy đang đứng lớp, đọc một con
// số sai còn tệ hơn không có số nào.
import type { CaTomTat, EmTomTat, HoSoEm, LuotThiRow, ParentMessage } from '../exam-api'
import type { TeacherExamSource } from '../../data/examContent'
import type { CauHoiCuaEm } from '../hoi-bai'
import { gomTheoCa } from '../hoi-bai'
import { CAU_GOI_Y, chuanHoaHoi, type YDinh } from './y-dinh'

/** Số dòng tối đa in ra một câu trả lời. Dài hơn thì cắt và ghi rõ còn bao
 * nhiêu — ô nhắn nằm trên điện thoại, ba chục dòng là cuộn mỏi tay. */
export const TRAN_DONG = 12

export interface TraLoi {
  /** Câu dẫn, luôn có. */
  chu: string
  /** Danh sách gạch đầu dòng, có thể rỗng. */
  dong: string[]
  /** Lấy số từ đâu — để thầy soi lại. Rỗng khi câu trả lời không có số. */
  nguon: string
  /** true = trợ lý không hiểu, màn hiện lại câu gợi ý. */
  khongHieu?: boolean
}

/** Dữ liệu tầng trên đã lấy về. Thiếu phần nào thì để `undefined`, tầng này tự
 * nói "chưa lấy được", KHÔNG tự bịa. */
export interface DuLieu {
  ca?: CaTomTat[]
  luot?: LuotThiRow[]
  caDangXem?: CaTomTat
  em?: EmTomTat[]
  hoSo?: HoSoEm
  kho?: TeacherExamSource[]
  cauHoi?: CauHoiCuaEm[]
  tinNhan?: ParentMessage[]
  /** Mốc thời gian coi là "bây giờ" — test bơm vào để số liệu cố định. */
  bayGio?: number
}

const HDAN: Record<string, { chu: string; dong: string[] }> = {
  van_tay: {
    chu: 'Mở app bằng vân tay đặt ở đây:',
    dong: ['Ngân hàng câu hỏi → Cấu hình (1 lần) → Mật khẩu mở app → Mở app bằng vân tay.', 'Phải đặt mật khẩu trước; vân tay là đường vào thứ hai tới cùng mã bí mật, không thay thế mật khẩu.'],
  },
  mat_khau: {
    chu: 'Mật khẩu mở app đặt ở đây:',
    dong: ['Ngân hàng câu hỏi → Cấu hình (1 lần) → Mật khẩu mở app.', 'Mật khẩu KHÔNG được lưu ở đâu cả, kể cả dạng băm. Quên thì nhập lại mã bí mật để đặt lại.'],
  },
  mo_ca: {
    chu: 'Mở ca kiểm tra:',
    dong: ['Màn Kiểm tra tại lớp → ô tím "Mở ca kiểm tra" trên cùng.', 'Chọn đề, đặt lớp và thời gian, máy phát mã ca cho em nhập.'],
  },
  nap_de: {
    chu: 'Nạp đề mới:',
    dong: ['Thả file PDF vào kho-de/moi/ trên ổ SSD, rồi nhờ Cowork chạy pipeline nạp đề.', 'Có sẵn file JSON thì vào Ngân hàng câu hỏi → "Đẩy file JSON từ kho-de/xong lên kho".'],
  },
  len_bang: {
    chu: 'Gọi lên bảng:',
    dong: ['Màn Kiểm tra tại lớp → ô "Gọi lên bảng".', 'Máy chọn câu đúng chỗ em yếu nhất, chấm Đạt / Không đạt xong là cộng vào bảng mạnh yếu của em.'],
  },
  gui_phieu: {
    chu: 'Gửi báo cáo cho phụ huynh:',
    dong: ['Ca thi → mở đúng ca → chọn em → Copy link phiếu, dán vào Zalo.', 'Link phiếu không kèm mã bí mật, phụ huynh mở được mà không vào được app của Thầy.'],
  },
  bang_diem: {
    chu: 'Xuất bảng điểm:',
    dong: ['Ca thi → mở đúng ca → nút xuất bảng điểm.'],
  },
}

function ngayGioVN(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
}

function cungNgay(iso: string, moc: number): boolean {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  const n = new Date(moc)
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

function so(x: number): string {
  return String(Math.round(x * 100) / 100).replace('.', ',')
}

function cat(dong: string[]): string[] {
  if (dong.length <= TRAN_DONG) return dong
  return [...dong.slice(0, TRAN_DONG), `… còn ${dong.length - TRAN_DONG} dòng nữa.`]
}

function tenCa(c: { maCa: string; tenCa?: string }): string {
  return c.tenCa || `Ca ${c.maCa}`
}

const CHUA_LAY = (viec: string): TraLoi => ({ chu: `Chưa lấy được ${viec}. Kiểm tra mạng hoặc mã bí mật rồi hỏi lại.`, dong: [], nguon: '' })

/** Dựng câu trả lời từ ý định + dữ liệu. */
export function dungTraLoi(y: YDinh, d: DuLieu): TraLoi {
  const bayGio = d.bayGio ?? Date.now()

  if (y.loai === 'huong_dan') {
    const h = y.muc ? HDAN[y.muc] : undefined
    if (!h) return khongHieu()
    return { chu: h.chu, dong: h.dong, nguon: 'Hướng dẫn dùng app' }
  }

  if (y.loai === 'ca_dang_mo') {
    if (!d.ca) return CHUA_LAY('danh sách ca')
    const mo = d.ca.filter((c) => c.trangThai === 'mo')
    if (mo.length === 0) return { chu: 'Không có ca nào đang mở.', dong: [], nguon: 'Danh sách ca' }
    return {
      chu: `Đang mở ${mo.length} ca:`,
      dong: cat(mo.map((c) => `${tenCa(c)} · mã ${c.maCa}${c.lop ? ` · lớp ${c.lop}` : ''} · ${c.thoiGianPhut} phút`)),
      nguon: 'Danh sách ca',
    }
  }

  if (y.loai === 'ca_gan_day') {
    if (!d.ca) return CHUA_LAY('danh sách ca')
    const song = d.ca.filter((c) => c.trangThai !== 'da_xoa')
    const homNay = song.filter((c) => cungNgay(c.moLuc, bayGio))
    const ds = homNay.length > 0 ? homNay : song.slice(0, TRAN_DONG)
    if (ds.length === 0) return { chu: 'Chưa mở ca nào.', dong: [], nguon: 'Danh sách ca' }
    return {
      chu: homNay.length > 0 ? `Hôm nay có ${homNay.length} ca:` : `Chưa có ca nào hôm nay. ${ds.length} ca gần đây:`,
      dong: cat(ds.map((c) => `${tenCa(c)} · mã ${c.maCa}${c.lop ? ` · lớp ${c.lop}` : ''} · ${c.trangThai === 'mo' ? 'đang mở' : 'đã đóng'}${c.moLuc ? ` · ${ngayGioVN(c.moLuc)}` : ''}`)),
      nguon: 'Danh sách ca',
    }
  }

  if (y.loai === 'ca_chua_nop') {
    if (!d.luot || !d.caDangXem) return CHUA_LAY('chi tiết ca')
    const chua = d.luot.filter((l) => l.trangThai !== 'da_nop' && l.trangThai !== 'khoa')
    if (d.luot.length === 0) return { chu: `${tenCa(d.caDangXem)}: chưa em nào vào thi.`, dong: [], nguon: `Ca ${d.caDangXem.maCa}` }
    if (chua.length === 0) return { chu: `${tenCa(d.caDangXem)}: cả ${d.luot.length} em đã nộp.`, dong: [], nguon: `Ca ${d.caDangXem.maCa}` }
    return {
      chu: `${tenCa(d.caDangXem)}: còn ${chua.length}/${d.luot.length} em chưa nộp.`,
      dong: cat(chua.map((l) => `${l.hoTen || l.sbd} · SBD ${l.sbd}${l.vaoLuc ? ` · vào ${ngayGioVN(l.vaoLuc)}` : ''}`)),
      nguon: `Ca ${d.caDangXem.maCa}`,
    }
  }

  if (y.loai === 'ca_diem') {
    if (!d.luot || !d.caDangXem) return CHUA_LAY('chi tiết ca')
    const daCham = d.luot.filter((l) => typeof l.tong === 'number' && isFinite(l.tong as number))
    if (daCham.length === 0) return { chu: `${tenCa(d.caDangXem)}: chưa có bài nào được chấm.`, dong: [], nguon: `Ca ${d.caDangXem.maCa}` }
    const diem = daCham.map((l) => l.tong as number)
    const tb = diem.reduce((a, b) => a + b, 0) / diem.length
    const xep = [...daCham].sort((a, b) => (b.tong as number) - (a.tong as number))
    return {
      chu: `${tenCa(d.caDangXem)}: ${daCham.length} bài đã chấm · trung bình ${so(tb)} · cao nhất ${so(diem.reduce((a, b) => Math.max(a, b)))} · thấp nhất ${so(diem.reduce((a, b) => Math.min(a, b)))}.`,
      dong: cat(xep.map((l) => `${so(l.tong as number)} — ${l.hoTen || l.sbd} (SBD ${l.sbd})`)),
      nguon: `Ca ${d.caDangXem.maCa}`,
    }
  }

  if (y.loai === 'em_diem_thap') {
    if (!d.em) return CHUA_LAY('danh sách học sinh')
    const nguong = y.nguongDiem ?? 5
    const thap = d.em.filter((e) => typeof e.diemGanNhat === 'number' && (e.diemGanNhat as number) < nguong)
    if (thap.length === 0) return { chu: `Không em nào dưới ${so(nguong)} điểm ở ca gần nhất.`, dong: [], nguon: 'Danh sách học sinh' }
    const xep = [...thap].sort((a, b) => (a.diemGanNhat as number) - (b.diemGanNhat as number))
    return {
      chu: `${thap.length} em dưới ${so(nguong)} điểm ở ca gần nhất:`,
      dong: cat(xep.map((e) => `${so(e.diemGanNhat as number)} — ${e.hoTen || e.sbd} (SBD ${e.sbd}${e.lop ? `, lớp ${e.lop}` : ''})`)),
      nguon: 'Danh sách học sinh · điểm ca gần nhất',
    }
  }

  if (y.loai === 'em_ho_so') {
    if (!d.hoSo) return CHUA_LAY('hồ sơ em này')
    const h = d.hoSo
    const yeu = [...h.chuyenDe].filter((c) => c.soCau > 0).sort((a, b) => b.soSai / b.soCau - a.soSai / a.soCau)
    const dong: string[] = []
    if (h.caGanNhat) dong.push(`Ca gần nhất: ${h.caGanNhat.tenCa || h.caGanNhat.maCa} · ${typeof h.caGanNhat.tong === 'number' ? `${so(h.caGanNhat.tong)} điểm` : 'chưa chấm'}`)
    dong.push(`Đã làm ${h.ca.length} ca.`)
    for (const c of yeu.slice(0, 5)) dong.push(`${c.ten}: sai ${c.soSai}/${c.soCau} câu`)
    return {
      chu: `${h.em.hoTen || h.em.sbd} (SBD ${h.em.sbd}${h.em.lop ? `, lớp ${h.em.lop}` : ''}):`,
      dong: cat(dong),
      nguon: 'Hồ sơ học sinh',
    }
  }

  if (y.loai === 'kho_tong_quan') {
    if (!d.kho) return CHUA_LAY('ngân hàng câu hỏi')
    if (d.kho.length === 0) return { chu: 'Ngân hàng trên máy này chưa có đề nào. Vào Ngân hàng câu hỏi bấm Đồng bộ.', dong: [], nguon: 'Ngân hàng trong máy' }
    const soCau = d.kho.reduce((n, s) => n + s.phanI.length + s.phanII.length + s.phanIII.length, 0)
    const cd = new Map<string, number>()
    for (const s of d.kho) for (const q of [...s.phanI, ...s.phanII, ...s.phanIII]) {
      const t = q.chuyenDe || ''
      if (t) cd.set(t, (cd.get(t) ?? 0) + 1)
    }
    const xep = [...cd.entries()].sort((a, b) => b[1] - a[1])
    return {
      chu: `Ngân hàng trên máy này: ${d.kho.length} đề · ${soCau} câu · ${cd.size} chuyên đề.`,
      dong: cat(xep.map(([t, n]) => `${t}: ${n} câu`)),
      nguon: 'Ngân hàng trong máy',
    }
  }

  if (y.loai === 'kho_theo_chuyen_de') {
    if (!d.kho) return CHUA_LAY('ngân hàng câu hỏi')
    const ten = y.chuyenDe || ''
    const dong: string[] = []
    let tong = 0
    for (const s of d.kho) {
      const n = [...s.phanI, ...s.phanII, ...s.phanIII].filter((q) => (q.chuyenDe || '') === ten).length
      if (n > 0) {
        dong.push(`${s.maDe}: ${n} câu`)
        tong += n
      }
    }
    if (tong === 0) return { chu: `Ngân hàng trên máy này chưa có câu nào của chuyên đề "${ten}".`, dong: [], nguon: 'Ngân hàng trong máy' }
    return { chu: `Chuyên đề "${ten}": ${tong} câu ở ${dong.length} đề.`, dong: cat(dong), nguon: 'Ngân hàng trong máy' }
  }

  if (y.loai === 'kho_nghi_dap_an') {
    if (!d.kho) return CHUA_LAY('ngân hàng câu hỏi')
    const CO = ['nghi_dap_an_sai', 'thieu_dap_an', 'lech_co_hd']
    const dong: string[] = []
    for (const s of d.kho) {
      const dem = (ds: { loiGiaiTrangThai?: string }[], phan: string) =>
        ds.forEach((q, i) => {
          if (CO.includes(q.loiGiaiTrangThai ?? '')) dong.push(`${s.maDe} ${phan}-${i + 1} · ${q.loiGiaiTrangThai}`)
        })
      dem(s.phanI, 'I')
      dem(s.phanII, 'II')
      dem(s.phanIII, 'III')
    }
    if (dong.length === 0) return { chu: 'Không còn câu nào chờ Thầy duyệt đáp án.', dong: [], nguon: 'Ngân hàng trong máy' }
    return { chu: `${dong.length} câu chờ Thầy duyệt đáp án:`, dong: cat(dong), nguon: 'Ngân hàng trong máy' }
  }

  if (y.loai === 'hoi_bai') {
    if (!d.cauHoi) return CHUA_LAY('câu hỏi của học sinh')
    const theoCa = gomTheoCa(d.cauHoi)
    const conCho = theoCa.filter((c) => c.chuaChua > 0)
    if (theoCa.length === 0) return { chu: 'Chưa em nào gửi câu hỏi.', dong: [], nguon: 'Học sinh hỏi' }
    if (conCho.length === 0) return { chu: `${theoCa.length} ca có câu hỏi, Thầy đã chữa hết.`, dong: [], nguon: 'Học sinh hỏi' }
    return {
      chu: `${conCho.reduce((n, c) => n + c.chuaChua, 0)} em đang chờ Thầy chữa, ở ${conCho.length} ca:`,
      dong: cat(conCho.map((c) => `${tenCa(c)} · ${c.chuaChua} em chờ · ${c.soCau} câu`)),
      nguon: 'Học sinh hỏi',
    }
  }

  if (y.loai === 'tin_nhan') {
    if (!d.tinNhan) return CHUA_LAY('hộp thư')
    const chuaDoc = d.tinNhan.filter((m) => !m.daDoc)
    if (d.tinNhan.length === 0) return { chu: 'Hộp thư trống.', dong: [], nguon: 'Hộp thư' }
    if (chuaDoc.length === 0) return { chu: `Không có tin mới. Hộp thư có ${d.tinNhan.length} tin đã đọc.`, dong: [], nguon: 'Hộp thư' }
    return {
      chu: `${chuaDoc.length} tin chưa đọc:`,
      dong: cat(chuaDoc.map((m) => `${m.nguoiGui === 'hocsinh' ? 'Học sinh' : 'Phụ huynh'} ${m.hoTenHocSinh || m.sbd || ''}: ${String(m.noiDung || '').slice(0, 60)}`)),
      nguon: 'Hộp thư',
    }
  }

  return khongHieu()
}

/** Câu trả lời khi không hiểu. KHÔNG được chứa con số nào — đây là chỗ dễ bịa
 * nhất, và bịa ở đây là thầy đọc ra một con số của việc khác. */
export function khongHieu(): TraLoi {
  return {
    chu: 'Chưa hiểu câu này. Thầy thử hỏi theo mấy cách dưới đây:',
    dong: CAU_GOI_Y.slice(),
    nguon: '',
    khongHieu: true,
  }
}

/** Tìm em theo số báo danh hoặc theo tên (bỏ dấu, khớp một phần). Nhiều em
 * cùng tên thì trả về danh sách để màn hỏi lại, KHÔNG tự chọn đại một em. */
export function timEm(ds: EmTomTat[], khoa: string): EmTomTat[] {
  const k = chuanHoaHoi(khoa)
  if (!k) return []
  const theoSbd = ds.filter((e) => e.sbd === khoa.trim())
  if (theoSbd.length > 0) return theoSbd
  return ds.filter((e) => chuanHoaHoi(e.hoTen).includes(k))
}
