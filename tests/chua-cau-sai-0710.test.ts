// TEST VÒNG CHỮA CÂU SAI — đặc tả §14.1, kịch bản §13.6–13.7.
// Kiểm: kiểu dữ liệu, FSM chuyển trạng thái, cấu hình mặc định, hai nhánh cá nhân hoá.
import { describe, it, expect } from 'vitest'
import {
  KHOA_CHUA_CAU_SAI, COHORT_PILOT, CAU_HINH_MAC_DINH,
  type TrangThaiDay, type HocLieuChua, type BuocChua, type CauHinhChuaCauSai,
} from '../server/src/chua-cau-sai-kieu'
import {
  chuyenTrang, khoiTaoTienDo, tinhTienDo, xayPhanHoi,
  type TrangThaiPhien, type SuKienNop,
} from '../server/src/chua-cau-sai-fsm'
import { qidChuan } from '../server/src/chua-cau-sai-adapter'
import { trangThaiDayBanDau } from '../server/src/chua-cau-sai-adapter'
import type { KetQuaLoi } from '../server/src/loi-hoc-luat'

// ---------------------------------------------------------------------------
// Học liệu fixture §13.6–13.7: NaOH, câu sai 0.01 mol, HAI nguyên nhân khác nhau
// ---------------------------------------------------------------------------

/** Bước lỗi tính M(NaOH) — học sinh Lan nhầm M = 23 thay vì 40. */
const buocTinhM: BuocChua = {
  id: 'buoc-tinh-m',
  thuTu: 0,
  tieuDe: 'Tính khối lượng mol NaOH',
  tienQuyet: [],
  viKyNang: ['tinh_toan', 'kien_thuc_hoa_dai_cuong'],
  chanDoan: [{ qid: 'q-naoh-m-cd', phienBan: '1', phan: 'I', kyNang: ['tinh_M'], laTuongDuong: false }],
  phanBiet: [],
  kiemLai: [{ qid: 'q-naoh-m-kl', phienBan: '1', phan: 'I', kyNang: ['tinh_M'], laTuongDuong: false }],
  hieuBuoc: {
    mucTieu: 'Tính đúng M(NaOH) = 23+16+1 = 40 g/mol',
    yNghiaDaiLuong: 'M là tổng nguyên tử khối các nguyên tố',
    viSaoCanBuoc: 'Sai M thì n=m/M sai, dẫn đến kết quả sai dù phương pháp đúng',
    dieuKienApDung: 'Áp dụng khi biết CTHH',
    noiVoiBuocSau: 'n đúng → tính V hoặc nồng độ mới đúng',
    doiChieu: [{
      maLoi: 'nham_M_Na',
      probeXacNhan: { qid: 'q-naoh-m-cd', phienBan: '1', phan: 'I', kyNang: [], laTuongDuong: false },
      cachNghiCu: 'M(NaOH) = M(Na) = 23',
      diemLech: 'Bỏ sót O và H trong tổng',
      heQua: 'n = 0.4/23 ≠ 0.4/40',
      cachDung: 'Cộng đủ: Na(23) + O(16) + H(1) = 40',
    }],
    kiemLyDo: [],
    chuyenGiao: [],
  },
  hoTro: [{ muc: 1, noiDung: 'Nhắc: NaOH có 3 nguyên tố, không phải 1.' }],
  loiThuongGap: [{ ma: 'nham_M_Na', loai: 'kien_thuc', tinHieu: 'Trả lời n = 0.4/23', probeXacNhan: 'q-naoh-m-cd' }],
}

/** Bước lỗi tính sai phép chia — học sinh Minh biết M=40 nhưng chia sai. */
const buocTinhNSaiPhepChia: BuocChua = {
  id: 'buoc-tinh-n-chia',
  thuTu: 0,
  tieuDe: 'Tính số mol n = m/M',
  tienQuyet: [],
  viKyNang: ['tinh_toan'],
  chanDoan: [{ qid: 'q-naoh-n-cd', phienBan: '1', phan: 'I', kyNang: ['tinh_n'], laTuongDuong: false }],
  phanBiet: [],
  kiemLai: [{ qid: 'q-naoh-n-kl', phienBan: '1', phan: 'I', kyNang: ['tinh_n'], laTuongDuong: false }],
  hieuBuoc: {
    mucTieu: 'Thực hiện đúng: 0.4 ÷ 40 = 0.01 mol',
    yNghiaDaiLuong: 'n = số mol = m/M',
    viSaoCanBuoc: 'Nhầm phép chia dẫn đến n sai dù biết đúng công thức',
    dieuKienApDung: 'Luôn áp dụng khi tính n từ m và M',
    noiVoiBuocSau: 'n đúng → các bước sau chạy đúng',
    doiChieu: [{
      maLoi: 'nhap_nham_so',
      probeXacNhan: { qid: 'q-naoh-n-cd', phienBan: '1', phan: 'I', kyNang: [], laTuongDuong: false },
      cachNghiCu: '0.4/40 = 0.1',
      diemLech: 'Nhầm vị trí chấm thập phân',
      heQua: 'n = 0.1 thay vì 0.01',
      cachDung: '0.4 ÷ 40: chia 4÷40=0.1 rồi nhân thêm 0.1 → 0.01',
    }],
    kiemLyDo: [],
    chuyenGiao: [],
  },
  hoTro: [{ muc: 1, noiDung: 'Nhắc: 0.4 ÷ 40 = 4/400 = 1/100 = 0.01.' }],
  loiThuongGap: [{ ma: 'nhap_nham_so', loai: 'tinh_toan', tinHieu: 'Trả lời n = 0.1', probeXacNhan: 'q-naoh-n-cd' }],
}

function taoHocLieu(buoc: BuocChua): HocLieuChua {
  return {
    schemaVersion: 1,
    contentVersion: 'v1',
    qidGoc: 'hoa-11-dd-05-II-2',
    buoc: [buoc],
    banGhepBai: [{ qid: 'q-ghep-bai', phienBan: '1', phan: 'II', kyNang: [], laTuongDuong: false, loai: 'ghep_bai' }],
    banKiemChung: [{ qid: 'q-kiem-chung', phienBan: '1', phan: 'II', kyNang: [], laTuongDuong: true, loai: 'kiem_chung' }],
  }
}

// ---------------------------------------------------------------------------
// §1 — Cấu hình mặc định
// ---------------------------------------------------------------------------
describe('CauHinhChuaCauSai — mặc định', () => {
  it('cờ tắt theo mặc định', () => {
    expect(CAU_HINH_MAC_DINH.bat).toBe(false)
  })
  it('cohortId = pilot', () => {
    expect(CAU_HINH_MAC_DINH.cohortId).toBe(COHORT_PILOT)
  })
  it('kiemLaiSauGio = 24', () => {
    expect(CAU_HINH_MAC_DINH.kiemLaiSauGio).toBe(24)
  })
  it('vongHoTroToiDaMoiBuoc = 2', () => {
    expect(CAU_HINH_MAC_DINH.vongHoTroToiDaMoiBuoc).toBe(2)
  })
  it('KHOA_CHUA_CAU_SAI đúng', () => {
    expect(KHOA_CHUA_CAU_SAI).toBe('chua_cau_sai_v1')
  })
})

// ---------------------------------------------------------------------------
// §2 — qidChuan: chuẩn hoá qid
// ---------------------------------------------------------------------------
describe('qidChuan', () => {
  it('giữ nguyên qid thường', () => {
    expect(qidChuan('hoa-11-dd-05-II-2')).toBe('hoa-11-dd-05-II-2')
  })
  it('bỏ hậu tố ~ss', () => {
    expect(qidChuan('hoa-11-dd-05-II-2~ss0')).toBe('hoa-11-dd-05-II-2')
  })
  it('bỏ hậu tố ~bt', () => {
    expect(qidChuan('hoa-11-dd-05-II-2~bt1')).toBe('hoa-11-dd-05-II-2')
  })
  it('bỏ prefix tc:', () => {
    expect(qidChuan('tc:hoa-11-dd-05-II-2')).toBe('hoa-11-dd-05-II-2')
  })
  it('bỏ cả ~ss lẫn #n (game)', () => {
    expect(qidChuan('hoa-11-dd-05-II-2~ss1#3')).toBe('hoa-11-dd-05-II-2')
  })
})

// ---------------------------------------------------------------------------
// §3 — trangThaiDayBanDau
// ---------------------------------------------------------------------------
describe('trangThaiDayBanDau', () => {
  const loiMo: KetQuaLoi = {
    trangThai: 'mo', saiCuoi: '2026-10-01', soLanSai: 1,
    ngayDung: [], daDungSongSinh: false, denHan: '2026-10-04',
    nenSongSinh: false, dongNgay: '', mocDuyTri: 0, nguonSai: 'thi',
  }
  const loiDong: KetQuaLoi = { ...loiMo, trangThai: 'dong' }
  it('lỗi mở + có học liệu → can_chan_doan', () => {
    expect(trangThaiDayBanDau(loiMo, true)).toBe('can_chan_doan')
  })
  it('lỗi mở + thiếu học liệu → thieu_hoc_lieu', () => {
    expect(trangThaiDayBanDau(loiMo, false)).toBe('thieu_hoc_lieu')
  })
  it('lỗi đóng → da_tu_sua', () => {
    expect(trangThaiDayBanDau(loiDong, true)).toBe('da_tu_sua')
  })
})

// ---------------------------------------------------------------------------
// §4 — FSM chuyển trạng thái (cơ bản)
// ---------------------------------------------------------------------------
describe('FSM chuyenTrang', () => {
  const cfg = CAU_HINH_MAC_DINH
  const hocLieuLan = taoHocLieu(buocTinhM)

  function phienMac(): TrangThaiPhien {
    return { trangThai: 'can_chan_doan', buocDangXuLy: -1, buocDaQua: new Set(), soVongHoTro: 0, soHoTroBuocHienTai: 0 }
  }

  it('chan_doan đúng → dang_chua_buoc', () => {
    const su: SuKienNop = { itemLoai: 'chan_doan', buocSo: 0, dung: true, coHoTro: false, mucHoTro: 0, hocLieu: hocLieuLan, cauHinh: cfg }
    const { moi } = chuyenTrang(phienMac(), su)
    expect(moi.trangThai).toBe('dang_chua_buoc')
    expect(moi.buocDangXuLy).toBe(0)
  })

  it('chan_doan sai → giữ can_chan_doan', () => {
    const su: SuKienNop = { itemLoai: 'chan_doan', buocSo: 0, dung: false, coHoTro: false, mucHoTro: 0, hocLieu: hocLieuLan, cauHinh: cfg }
    const { moi } = chuyenTrang(phienMac(), su)
    expect(moi.trangThai).toBe('can_chan_doan')
  })

  it('kiem_lai đúng (không hỗ trợ) → đánh dấu bước đã qua → dang_ghep_bai', () => {
    const phien: TrangThaiPhien = { trangThai: 'dang_chua_buoc', buocDangXuLy: 0, buocDaQua: new Set(), soVongHoTro: 0, soHoTroBuocHienTai: 0 }
    const su: SuKienNop = { itemLoai: 'kiem_lai', buocSo: 0, dung: true, coHoTro: false, mucHoTro: 0, hocLieu: hocLieuLan, cauHinh: cfg }
    const { moi } = chuyenTrang(phien, su)
    expect(moi.trangThai).toBe('dang_ghep_bai')
    expect(moi.buocDaQua.has(0)).toBe(true)
  })

  it('quá số vòng hỗ trợ → can_thay', () => {
    // vongHoTroToiDaMoiBuoc = 2; nộp 3 lần có hỗ trợ
    let phien: TrangThaiPhien = { trangThai: 'dang_chua_buoc', buocDangXuLy: 0, buocDaQua: new Set(), soVongHoTro: 0, soHoTroBuocHienTai: 0 }
    const suHoTro: SuKienNop = { itemLoai: 'kiem_lai', buocSo: 0, dung: false, coHoTro: true, mucHoTro: 2, hocLieu: hocLieuLan, cauHinh: cfg }
    for (let i = 0; i < 3; i++) {
      const { moi } = chuyenTrang(phien, suHoTro)
      phien = moi
      if (moi.trangThai === 'can_thay') break
    }
    expect(phien.trangThai).toBe('can_thay')
  })

  it('ghep_bai đúng → cho_gap_lai_2', () => {
    const phien: TrangThaiPhien = { trangThai: 'dang_ghep_bai', buocDangXuLy: 0, buocDaQua: new Set([0]), soVongHoTro: 0, soHoTroBuocHienTai: 0 }
    const su: SuKienNop = { itemLoai: 'ghep_bai', buocSo: 0, dung: true, coHoTro: false, mucHoTro: 0, hocLieu: hocLieuLan, cauHinh: cfg }
    const { moi } = chuyenTrang(phien, su)
    expect(moi.trangThai).toBe('cho_gap_lai_2')
  })

  it('kiem_chung đúng + tự làm → da_tu_sua', () => {
    const phien: TrangThaiPhien = { trangThai: 'dang_kiem_chung', buocDangXuLy: 0, buocDaQua: new Set([0]), soVongHoTro: 0, soHoTroBuocHienTai: 0 }
    const su: SuKienNop = { itemLoai: 'kiem_chung', buocSo: 0, dung: true, coHoTro: false, mucHoTro: 0, hocLieu: hocLieuLan, cauHinh: cfg }
    const { moi } = chuyenTrang(phien, su)
    expect(moi.trangThai).toBe('da_tu_sua')
  })

  it('kiem_chung sai → quay lại can_chan_doan', () => {
    const phien: TrangThaiPhien = { trangThai: 'dang_kiem_chung', buocDangXuLy: 0, buocDaQua: new Set([0]), soVongHoTro: 0, soHoTroBuocHienTai: 0 }
    const su: SuKienNop = { itemLoai: 'kiem_chung', buocSo: 0, dung: false, coHoTro: false, mucHoTro: 0, hocLieu: hocLieuLan, cauHinh: cfg }
    const { moi } = chuyenTrang(phien, su)
    expect(moi.trangThai).toBe('can_chan_doan')
    expect(moi.buocDaQua.size).toBe(0)  // reset
  })
})

// ---------------------------------------------------------------------------
// §5 — §13.6 vs §13.7: CÁ NHÂN HOÁ (hai nhánh cùng đáp án sai, khác nguyên nhân)
// ---------------------------------------------------------------------------
describe('Cá nhân hoá §13.6–13.7: cùng sai 0.01 mol NaOH, khác nguyên nhân', () => {
  const cfg = CAU_HINH_MAC_DINH

  // Học liệu LAN: sai M (nguyên nhân kiến thức)
  const hocLieuLan = taoHocLieu(buocTinhM)
  // Học liệu MINH: sai phép chia (nguyên nhân tính toán)
  const hocLieuMinh = taoHocLieu(buocTinhNSaiPhepChia)

  it('Lan (sai M) có bước chẩn đoán qid khác Minh (sai phép chia)', () => {
    const cdLan = hocLieuLan.buoc[0]!.chanDoan[0]!.qid
    const cdMinh = hocLieuMinh.buoc[0]!.chanDoan[0]!.qid
    expect(cdLan).toBe('q-naoh-m-cd')
    expect(cdMinh).toBe('q-naoh-n-cd')
    expect(cdLan).not.toBe(cdMinh)
  })

  it('Lan: loiThuongGap có loai=kien_thuc', () => {
    const loi = hocLieuLan.buoc[0]!.loiThuongGap[0]!
    expect(loi.loai).toBe('kien_thuc')
  })

  it('Minh: loiThuongGap có loai=tinh_toan', () => {
    const loi = hocLieuMinh.buoc[0]!.loiThuongGap[0]!
    expect(loi.loai).toBe('tinh_toan')
  })

  it('Lan: doiChieu giải thích đúng lý do nhầm M(NaOH)=23', () => {
    const dc = hocLieuLan.buoc[0]!.hieuBuoc!.doiChieu[0]!
    expect(dc.cachNghiCu).toContain('23')
    expect(dc.diemLech).toBeTruthy()
  })

  it('Minh: doiChieu giải thích nhầm vị trí thập phân', () => {
    const dc = hocLieuMinh.buoc[0]!.hieuBuoc!.doiChieu[0]!
    expect(dc.cachNghiCu).toContain('0.1')
    expect(dc.diemLech).toBeTruthy()
  })

  it('Hai luồng FSM độc lập: Lan chẩn đoán đúng q-naoh-m-cd không ảnh hưởng Minh', () => {
    function chayLuong(hocLieu: HocLieuChua): TrangThaiDay {
      let phien: TrangThaiPhien = {
        trangThai: 'can_chan_doan', buocDangXuLy: -1, buocDaQua: new Set(), soVongHoTro: 0, soHoTroBuocHienTai: 0,
      }
      // Bước 1: chẩn đoán đúng
      const su1: SuKienNop = { itemLoai: 'chan_doan', buocSo: 0, dung: true, coHoTro: false, mucHoTro: 0, hocLieu, cauHinh: cfg }
      phien = chuyenTrang(phien, su1).moi
      // Bước 2: kiểm lại đúng (không hỗ trợ) → dang_ghep_bai
      const su2: SuKienNop = { itemLoai: 'kiem_lai', buocSo: 0, dung: true, coHoTro: false, mucHoTro: 0, hocLieu, cauHinh: cfg }
      phien = chuyenTrang(phien, su2).moi
      // Bước 3: ghép bài đúng → cho_gap_lai_2
      const su3: SuKienNop = { itemLoai: 'ghep_bai', buocSo: 0, dung: true, coHoTro: false, mucHoTro: 0, hocLieu, cauHinh: cfg }
      phien = chuyenTrang(phien, su3).moi
      return phien.trangThai
    }

    expect(chayLuong(hocLieuLan)).toBe('cho_gap_lai_2')
    expect(chayLuong(hocLieuMinh)).toBe('cho_gap_lai_2')
  })
})

// ---------------------------------------------------------------------------
// §6 — khoiTaoTienDo, tinhTienDo
// ---------------------------------------------------------------------------
describe('tienDo', () => {
  const hocLieu = taoHocLieu(buocTinhM)

  it('khoiTaoTienDo: mảng 1 bước trạng thái chua_kiem', () => {
    const td = khoiTaoTienDo(hocLieu)
    expect(td).toHaveLength(1)
    expect(td[0]!.trangThai).toBe('chua_kiem')
  })

  it('tinhTienDo: 0/1 khi chưa qua bước nào', () => {
    const td = khoiTaoTienDo(hocLieu)
    expect(tinhTienDo(hocLieu, td)).toEqual({ soBuocDaQua: 0, soBuocCanKiem: 1 })
  })

  it('tinhTienDo: 1/1 khi bước da_lam_dung_trong_phien', () => {
    const td = khoiTaoTienDo(hocLieu)
    td[0]!.trangThai = 'da_lam_dung_trong_phien'
    expect(tinhTienDo(hocLieu, td)).toEqual({ soBuocDaQua: 1, soBuocCanKiem: 1 })
  })
})

// ---------------------------------------------------------------------------
// §7 — xayPhanHoi: KHÔNG lộ đáp án
// ---------------------------------------------------------------------------
describe('xayPhanHoi — không lộ đáp án', () => {
  it('sai: có diemLech, KHÔNG có dapAn', () => {
    const ph = xayPhanHoi('item-1', false, 'chan_doan', buocTinhM)
    expect(ph.dung).toBe(false)
    expect((ph as Record<string, unknown>).dapAn).toBeUndefined()
    expect(ph.diemlech).toBeDefined()
  })

  it('đúng: hanhDongTiep = hieu_buoc', () => {
    const ph = xayPhanHoi('item-2', true, 'chan_doan', buocTinhM)
    expect(ph.dung).toBe(true)
    expect(ph.hanhDongTiep).toBe('hieu_buoc')
  })

  it('đúng ghep_bai: hanhDongTiep = cho_gap_lai_2', () => {
    const ph = xayPhanHoi('item-3', true, 'ghep_bai', null)
    expect(ph.hanhDongTiep).toBe('cho_gap_lai_2')
  })

  it('đúng kiem_chung: hanhDongTiep = hoan_thanh', () => {
    const ph = xayPhanHoi('item-4', true, 'kiem_chung', null)
    expect(ph.hanhDongTiep).toBe('hoan_thanh')
  })
})
