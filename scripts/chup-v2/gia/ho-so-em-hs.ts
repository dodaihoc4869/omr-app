// LÀN HỒ SƠ EM 12/10F — trả lời GIẢ của hai lệnh học sinh `/hs/ho-so-thai-do` + `/hs/lich-su-lam-cau` cho ảnh chụp "Hồ sơ làm bài của em" (em bấm
// bảng "Nhịp học của em" ⇒ tấm thầy ở chế độ học sinh). Lịch từng ngày dựng từ ĐÚNG bộ Nhịp học giả của cảnh (gia/nhip-hoc-em.ts — bảng phía sau và
// tấm không tự mâu thuẫn), khung tín hiệu / câu lấy từ bộ giả Bài hằng ngày; mọi trả lời đi qua ĐÚNG hàm lọc bản học sinh của máy chủ
// (server/src/ho-so-em-hs-loc.ts: không đáp án em chọn, không mã câu thật). Tên em là tên giả, không dữ liệu học sinh thật.
import type { KetQuaHoSoThaiDo, NgayHoatDong, TinHieuThaiDo } from '../../../server/src/bai-hang-ngay-kieu'
import type { KetQuaLichSuLamCau } from '../../../server/src/lich-su-lam-cau-kieu'
import type { KetQuaNhipHocEm } from '../../../server/src/nhip-hoc-kieu'
import { banHocSinhHoSoThaiDo, banHocSinhLichSu } from '../../../server/src/ho-so-em-hs-loc'
import { hoSoThaiDoGia } from './bai-hang-ngay'
import { lichSuGia } from './lich-su-lam-cau'
import { nhipEmGia } from './nhip-hoc-em'

const TEN = { luoi: 'Phạm Ngọc Ánh', cham: 'Nguyễn Minh Anh' } as const

/** `/hs/ho-so-thai-do` giả của em trong cảnh (`nhe` = cham | luoi …, mặc định luoi). */
export function hoSoEmGia(nhe: string | null): KetQuaHoSoThaiDo {
  const nhip = nhipEmGia(nhe ?? 'luoi') as KetQuaNhipHocEm
  const laLuoi = nhip.nhom === 'luoi'
  const goc = hoSoThaiDoGia('')
  const ngay: NgayHoatDong[] = nhip.ngay.map((n, j) => {
    const dung = Math.round(n.lam * (laLuoi ? 0.5 + 0.04 * (j % 4) : 0.74 + 0.03 * (j % 3)))
    return {
      ngay: n.ngay, mucToiThieu: n.muc, daLam: n.lam, thieu: Math.max(0, n.muc - n.lam), datMuc: n.lam >= n.muc, mucUocTinh: false, nguonMuc: 'da-chot',
      tang: 2, cheDo: 'hanh-trinh', homNay: n.ngay === nhip.homNay, soLuot: n.lam, soDung: dung, soSai: n.lam - dung, tiLeDung: n.lam ? Math.round((100 * dung) / n.lam) : null,
    }
  })
  const soLuot = ngay.reduce((t, n) => t + n.soLuot, 0)
  const soDung = ngay.reduce((t, n) => t + n.soDung, 0)
  const td = nhip.tocDo!
  const pNhanh = Math.round((100 * td.soNhanh) / Math.max(1, td.soCoGiay))
  const chuA = `Đủ mức ${nhip.soNgayDu}/${nhip.soNgayQua} ngày (${nhip.phanTram}%)`
  const tinHieu: TinHieuThaiDo[] = goc.tinHieu.map((t) =>
    t.ma === 'ngay-du-muc' ? { ...t, tu: nhip.soNgayDu, mau: nhip.soNgayQua, giaTri: nhip.phanTram, chu: chuA, muc: laLuoi ? 'xau' : 'tot' }
    : t.ma === 'qua-nhanh' ? { ...t, tu: td.soNhanh, mau: td.soCoGiay, giaTri: pNhanh, muc: td.muc, chu: `Quá nhanh ${td.soNhanh}/${td.soCoGiay} lượt (${pNhanh}%)${td.dungNhanh !== null ? ` · nhóm quá nhanh đúng ${td.dungNhanh}%` : ''} · lượt thường đúng 71%` }
    : t,
  )
  const doiPho = td.muc === 'xau'
  const lyDo = doiPho ? [`Trả lời quá nhanh: ${tinHieu[1]!.chu}.`, `Ngày đủ mức: ${chuA}.`] : [`Ngày đủ mức: ${chuA}.`]
  return banHocSinhHoSoThaiDo({
    ...goc,
    em: { sbd: '12121212', hoTen: laLuoi ? TEN.luoi : TEN.cham, lop: '12A1', khoi: '12' },
    tu: nhip.tu, den: nhip.homNay, homNay: nhip.homNay, ngay, tinHieu,
    ketLuan: { nhan: doiPho ? 'doi-pho' : laLuoi ? 'luoi' : 'cham-chi', chu: doiPho ? 'Có dấu hiệu đối phó' : laLuoi ? 'Lười' : 'Chăm chỉ', lyDo },
    dem: { ...goc.dem, soLuot, soCau: Math.round(soLuot * 0.86), soDung, soSai: soLuot - soDung, soBoTrong: 0, soLuotCoGiay: td.soCoGiay },
    canhBao: [],
    nhomNhip: nhip.nhom, coDoiPho: doiPho, chuoiDuGanNhat: nhip.chuoiDuGanNhat,
  })
}

/** `/hs/lich-su-lam-cau` giả (bản học sinh — qua đúng hàm lọc của máy chủ). */
export function lichSuEmGia(nhe: string | null): KetQuaLichSuLamCau {
  return banHocSinhLichSu(lichSuGia('12121212', (nhe ?? 'luoi').startsWith('luoi') ? TEN.luoi : TEN.cham))
}
