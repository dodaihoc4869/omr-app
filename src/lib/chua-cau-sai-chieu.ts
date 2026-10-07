import type { NhomChuaTrenLop } from '../../server/src/chua-cau-sai-chieu-kieu'
import type { OBang } from './html-may-chieu'
/** Tờ công khai chỉ có đề và quan hệ cần nối; bằng chứng cá nhân ở màn thầy. */
export function oChuaCuoi(g: NhomChuaTrenLop, soCau: number): OBang {
  const q = g.cauGoc
  return {
    sbd: '',
    hoTen: 'Chữa chung',
    qid: g.id,
    soCau,
    chuaCuoi: `Cùng nối lại: ${g.tieuDe}`,
    cau: {
      id: g.qid,
      maDe: '',
      phan: q.phan as 'I' | 'II' | 'III',
      chuyenDe: '',
      dang: 'chua_ro',
      sao: 1,
      mucDo: '',
      text: q.text,
      luaChon:
        (q.phan === 'I' ? q.choices : q.phan === 'II' ? q.ideas : null) ?? null,
      bang: q.table,
      anhThanCau: q.thanCauImg ?? q.imageDataUrl,
      anhLuaChon: q.choiceImgs ?? q.ideaImgs,
      hinh: q.hinhAnh,
      dapAn: '',
      ketQua: '',
      chot: '',
      lyDo: null,
      buoc: g.buoc
        .flatMap((b) => [
          b.tieuDe,
          b.hieuBuoc?.viSaoCanBuoc ?? '',
          b.hieuBuoc?.dieuKienApDung ?? '',
          b.hoTro.find((x) => x.muc === 3)?.noiDung ?? '',
          b.hieuBuoc?.noiVoiBuocSau ?? '',
        ])
        .filter(Boolean),
    },
  }
}
