// Dựng phiếu chỉ khi mở kết quả; hàm dựng được truyền vào để không tạo phụ thuộc vòng.
import type { ThongTinPhieu } from './html-phieu'
import type { CauLuyen } from './bai-tap-pdf'
import { chuanHoaLoiGiaiCau } from './chuan-hoa-loi-giai'

export function dungPhieuMom(b: any, dungPhieu: typeof import('./html-phieu').dungPhieu): string {
  const dsCauRaw = Array.isArray(b.dsCau) ? b.dsCau : (Array.isArray(b.cau) ? b.cau : [])
  const dapAnDaNop = b.dapAnDaNop || b.answers || {}

  const cauLuyen: CauLuyen[] = dsCauRaw.map((c: any, i: number) => {
    const daChon = dapAnDaNop[c.id] || ''
    const dung = String(c.dapAn || c.dapAnDung || '').trim()
    const lg = chuanHoaLoiGiaiCau(c.loiGiai, c.phan || 'I', dung)
    const phan = (c.phan as 'I' | 'II' | 'III') || (/^[DS]{4}$/i.test(dung) ? 'II' : (c.choices?.length || c.luaChon?.length ? 'I' : 'III'))

    return {
      id: c.id || `cau_${i + 1}`,
      phan,
      maDe: c.maDe || 'MOM',
      chuyenDe: c.chuyenDe || 'Hoá học',
      dang: 'chua_ro',
      sao: 1,
      mucDo: c.mucDo || '',
      text: c.text || c.noiDung || '',
      luaChon: c.choices || c.luaChon || null,
      dapAn: dung,
      chot: lg.chot,
      lyDo: lg.lyDo,
      buoc: lg.buoc,
      ketQua: lg.ketQua,
      anhThanCau: c.anhThanCau || c.thanCauImg,
      anhLuaChon: c.anhLuaChon,
      chuaCho: {
        qid: c.id,
        soCau: i + 1,
        phan,
        maDang: '',
        bac: 1,
        laDeCuaEm: true,
        daChon,
        dapAnDung: dung,
      },
    }
  })

  const thongTin: ThongTinPhieu = {
    hoTen: b.sbd ? `SBD: ${b.sbd}` : '',
    sbd: b.sbd || '',
    ngay: new Date(b.nopLuc || b.taoLuc || Date.now()),
    tenChuyenDe: b.tieuDe || 'Bài luyện gia đình giao',
    ketQua: `${b.diem ?? 0} điểm · Đúng ${b.soCauDung ?? 0}/${b.soCau ?? cauLuyen.length} câu`,
    hienDapAn: true,
    giaoDienHocSinh: true,
    nhanBia: 'BÀI GIA ĐÌNH GIAO',
    oBia: [
      { nhan: 'Điểm số', gia: `${b.diem ?? 0}/10` },
      { nhan: 'Kết quả', gia: `${b.soCauDung ?? 0}/${b.soCau ?? cauLuyen.length} câu đúng` },
      { nhan: 'Thời gian nộp', gia: b.nopLuc ? new Date(b.nopLuc).toLocaleDateString('vi-VN') : 'Đã nộp' },
    ],
  }

  return dungPhieu(thongTin, cauLuyen, {
    moSan: true,
    loiNhac: `Kết quả bài gia đình giao: Đạt ${b.diem ?? 0}/10 điểm (Đúng ${b.soCauDung ?? 0}/${b.soCau ?? cauLuyen.length} câu). Bấm vào từng câu để mở hoặc đóng lời giải chi tiết.`,
  })
}
