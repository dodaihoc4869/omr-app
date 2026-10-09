// THAY `goiLenh` của app thầy trong BẢN BUILD CHỤP ẢNH V2: lệnh Hành trình (danh sách 3 khối + bảng nhịp hôm nay) trả dữ liệu GIẢ ở đây,
// mọi lệnh khác chuyển cho máy giả của chup-omni-3. Tên học sinh là tên giả.
export * from '../../../src/lib/goi-lenh-thay'
import { traLoiThay } from '../../chup-omni-3/gia/may-thay'

const HT = [
  { k: '10', id: 'hanh-trinh-v3-khoi-10', soEm: 38 },
  { k: '11', id: 'hanh-trinh-v3-khoi-11', soEm: 41 },
  { k: '12', id: 'hanh-trinh-v3-khoi-12', soEm: 12 },
]
const homNay = '2026-10-09'
const cd = (h: (typeof HT)[number]) => ({ hanhTrinh: true, id: h.id, ten: `Hành trình giỏi hoá · Khối ${h.k}`, lop: `Khối ${h.k}`, maDe: [], hanNop: '2026-12-31', theLucNgay: 30, huyetChien: false, maCa: null, taoLuc: '2026-10-09T00:00:00Z', trangThai: 'dang_chay', soCau: 0, soEm: h.soEm, hetHan: false })
// [tên, tầng, tối thiểu, đã làm, đã xếp, còn thiếu] — tối thiểu theo tầng 24/30/36/36.
const EM: [string, number | null, number, number, number, number][] = [
  ['Nguyễn Minh Anh', 2, 30, 30, 30, 0], ['Trần Đức Huy', 3, 36, 21, 36, 0], ['Lê Phương Linh', 1, 24, 0, 24, 0], ['Phạm Quang Minh', 2, 30, 12, 30, 0],
  ['Hoàng Thu Trang', 1, 24, 8, 20, 4], ['Đặng Khánh', 2, 30, 30, 30, 0], ['Vũ Anh', 1, 24, 24, 24, 0], ['Trịnh Thảo Linh', 3, 36, 36, 36, 0],
  ['Bùi Gia Bảo', 4, 36, 6, 30, 6], ['Ngô Hải Yến', null, 0, 0, 0, 0], ['Đỗ Quốc Việt', 2, 30, 18, 30, 0], ['Phan Mai Chi', 3, 36, 0, 36, 0],
]
// Câu sai từ 4 lần (đã rời kế hoạch, chờ thầy chữa) của từng Hành trình — thẻ Hành trình › Cần thầy chữa (trung tu 09/10 tối).
const CAN: Record<string, { qid: string; stt: number; dang: string; soEm: number; mucDo?: string }[]> = {
  '12': [
    { qid: 'DH-12-C1-B2-17', stt: 17, dang: 'Thuỷ phân ester đơn chức', soEm: 6, mucDo: 'hieu' },
    { qid: 'DH-12-C1-B4-23', stt: 23, dang: 'Chỉ số xà phòng hoá chất béo', soEm: 3, mucDo: 'van_dung' },
  ],
  '11': [{ qid: 'DH-11-C1-B3-8', stt: 8, dang: 'Chuyển dịch cân bằng hoá học', soEm: 5, mucDo: 'hieu' }],
}
export async function goiLenh(duong: string, body: unknown, _a?: string, _b?: string) {
  void _a
  void _b
  const b = (body ?? {}) as Record<string, unknown>
  // trung tu 09/10: ảnh app thầy chụp ở chế độ 2.0 — màn Cài đặt đọc lại cờ thì vẫn thấy BẬT (trước: "lệnh lạ" ⇒ cờ tắt ⇒ thanh bên cũ 9 mục)
  if (duong === '/gv/chien-dich' && b.action === 'co-doc') return { ok: true as const, du: { ok: true, co: { bat: true, lop: [], sbd: [] } } }
  if (duong === '/gv/chien-dich' && b.action === 'danh-sach') return { ok: true as const, du: { homNay, chienDich: HT.map(cd) } }
  if (duong === '/gv/chien-dich' && b.action === 'bang') {
    const h = HT.find((x) => x.id === b.id) ?? HT[2]!
    return {
      ok: true as const,
      du: {
        chienDich: cd(h), homNay, hetHan: false,
        lop: { coXat: 0, thanhThao: 0, huyetChien: 0, canDayLaiCau: CAN[h.k]?.length ?? 0, canDayLaiLuot: (CAN[h.k] ?? []).reduce((n, c) => n + c.soEm, 0) }, dang: [], canDayLai: CAN[h.k] ?? [], em: [],
        hanhTrinhNgay: { em: EM.map(([ten, tang, toiThieu, daLam, daXep, conThieu], i) => ({ sbd: String(11010 + i), ten, tang, toiThieu: tang ? toiThieu : null, daLam, daXep, conThieu })) },
      },
    }
  }
  return traLoiThay(duong, b)
}
