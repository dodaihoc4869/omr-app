// DỮ LIỆU GIẢ cho ảnh chụp THẬT của tờ chiếu có Mức làm 1–4 (thầy 21/10): "Ai đã sai?" hai thẻ và chi tiết em gọi lên bảng. Tên giả, số giả. Mức của từng lượt do CHÍNH hàm máy chủ `mucLamCuaLuot` tính.
// Câu đang chiếu: Câu 12 · phần I · 46 từ không hình ⇒ T_đọc 24 giây, sàn nghĩ 6 giây; thời gian thường 75 giây (β thật) ⇒ ranh giới 24 / 30 / 60 giây.
import { mucLamCuaLuot, tongMucLam, type MucLamLuot } from '../../server/src/muc-lam'

type L = { sbd: string; ten: string; luc: string; noi: string; giay: number | null; uocTinh?: boolean; mucLam?: MucLamLuot }
export type KichBan = 'thuong' | 'dong' | 'ngay-dau' | 'chua-diem-danh'

const SO_TU = 46
// 6 mức (22/10): `treo` = số đo treo máy của lượt (v · a · l · n · w); vắng ⇒ "chưa đo treo máy" (lượt cũ / những ngày đầu).
type DoTreoGia = { v: number; a: number; l: number; n: number; w: 0 | 1 }
const mucCua = (giay: number, dung: boolean, thuong: number | null, treo?: DoTreoGia) => mucLamCuaLuot({ giay, soTu: SO_TU, coHinh: false, phan: 'I', dung, thuongGiay: thuong, ...(treo ? { treo } : {}) })!
/** Lượt treo GIẢ (tên · thứ tự lượt ⇒ khoảng lặng dài nhất, giây). Lượt khác đã đo mà không treo. */
const TREO_GIA: Record<string, number> = { 'Tô Gia Hân|0': 420, 'Trần Bảo Châu|0': 720, 'Đặng Thu Trang|0': 540, 'Phan Diệp Chi|0': 900 }
const doTreo = (ten: string, k: number, giay: number, dong: boolean): DoTreoGia => {
  const l = TREO_GIA[`${ten}|${k}`] ?? (dong && (ten.length + k * 3) % 9 === 0 ? 360 + ((ten.length * 37) % 600) : Math.min(giay, 25))
  return { v: giay + l, a: 0, l, n: 0, w: 1 }
}

// [tên, có mặt, [giây, nơi, ngày, giờ, cũ?, ước?]…]; "cũ" = đồng hồ cũ ⇒ chưa có số đo
type Em = [string, boolean, [number, string, string, string, number?, number?][]]
const EM: Em[] = [
  ['Phạm Quốc Huy', true, [[9, 'BTVN', '26/10', '18:30'], [6, 'Luyện theo dạng', '24/10', '20:12', 1]]],
  ['Lê Thu Hà', true, [[11, 'BTVN', '26/10', '18:48'], [24, 'Tự sửa lỗi', '25/10', '19:08']]],
  ['Vũ Minh Quân', true, [[14, 'BTVN', '26/10', '18:57'], [21, 'Luyện theo dạng', '24/10', '20:31', 1]]],
  ['Đỗ Khánh Linh', true, [[17, 'BTVN', '26/10', '19:06'], [19, 'Luyện theo dạng', '24/10', '21:44', 1]]],
  ['Bùi Tuấn Kiệt', true, [[31, 'BTVN', '26/10', '19:33'], [38, 'Tự sửa lỗi', '25/10', '19:40']]],
  ['Mai Hồng Nhung', true, [[36, 'BTVN', '26/10', '20:45'], [33, 'Luyện theo dạng', '24/10', '21:20', 1]]],
  ['Lương Tuệ Minh', true, [[61, 'BTVN', '26/10', '21:03'], [70, 'Luyện theo dạng', '25/10', '21:05']]],
  ['Tô Gia Hân', true, [[58, 'BTVN', '26/10', '21:12'], [49, 'Tự sửa lỗi', '25/10', '20:03']]],
  ['Nguyễn Đức Anh', true, [[7, 'BTVN', '26/10', '19:21']]],
  ['Trần Bảo Châu', true, [[27, 'BTVN', '26/10', '19:40']]],
  ['Hoàng Minh Khôi', true, [[44, 'BTVN', '26/10', '20:10']]],
  ['Đặng Thu Trang', true, [[66, 'BTVN', '26/10', '20:58']]],
  ['Ngô Quang Vinh', false, [[12, 'BTVN', '26/10', '22:05']]],
  ['Phan Diệp Chi', false, [[25, 'BTVN', '26/10', '21:48']]],
  ['Võ Hải Đăng', false, [[40, 'Luyện theo dạng', '23/10', '20:02', 1]]],
  ['Lý Mỹ Duyên', false, [[8, 'BTVN', '26/10', '19:55']]],
  ['Dương Gia Bảo', false, [[34, 'BTVN', '26/10', '21:30']]],
  ['Hồ Khánh Vy', false, [[45, 'Tự sửa lỗi', '24/10', '18:15', 1, 1]]],
  ['Trịnh Công Sơn', false, [[15, 'BTVN', '26/10', '22:20']]],
]
// Câu khó: 27 em làm sai (22 em có mặt), nhiều lượt.
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Phan', 'Võ']
const LOT = ['Văn', 'Thị', 'Minh', 'Quốc', 'Thu', 'Gia', 'Khánh', 'Hải', 'Mỹ', 'Bảo', 'Tuệ', 'Diệp', 'Công', 'Đức']
const TEN = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hiếu', 'Khoa', 'Lan', 'Mai', 'Nam', 'Oanh', 'Phúc', 'Quỳnh', 'Sơn', 'Thảo', 'Uyên', 'Vy', 'Yến', 'Trang', 'Long', 'Nhi']
let hat = 7
const ngau = (n: number) => { hat = (hat * 1103515245 + 12345) & 0x7fffffff; return hat % n }
function emDong(): Em[] {
  hat = 7
  return Array.from({ length: 27 }, (_, i): Em => {
    const ten = `${HO[(i * 7 + 3) % HO.length]} ${LOT[(i * 5 + 1) % LOT.length]} ${TEN[(i * 3 + 2) % TEN.length]}`
    const n = 1 + (ngau(3) === 0 ? 2 : ngau(2))
    return [ten, i < 22, Array.from({ length: n }, (): [number, string, string, string, number?] => [4 + ngau(85), ['BTVN', 'Luyện theo dạng', 'Tự sửa lỗi'][ngau(3)]!, `${24 + ngau(3)}/10`, `${18 + ngau(5)}:${String(ngau(6) * 10).padStart(2, '0')}`, ngau(7) === 0 ? 1 : 0])]
  })
}

const isoTu = (ngay: string, gio: string) => `2026-${ngay.slice(3, 5)}-${ngay.slice(0, 2)}T${String((Number(gio.slice(0, 2)) + 17) % 24).padStart(2, '0')}:${gio.slice(3, 5)}:00Z`

/** `ds` + `lop` đúng hình tin AI_SAI_TRA. */
export function luotSaiGia(kb: KichBan): { ds: L[]; lop: { soLop: number; soCoMat: number | null; coMat: string[] | null } } {
  const em = kb === 'dong' ? emDong() : EM
  const thuong = kb === 'ngay-dau' ? null : 75
  const ds: L[] = []
  em.forEach(([ten, coMat, ls], i) => {
    const sbd = `S${i + 1}`
    ls.forEach(([giay, noi, ngay, gio, cu, uoc], k) => {
      const choCu = kb === 'ngay-dau' ? !(k === 0 && ['Phạm Quốc Huy', 'Lê Thu Hà', 'Bùi Tuấn Kiệt'].includes(ten)) : !!cu
      ds.push({ sbd, ten, luc: isoTu(ngay, gio), noi, giay, ...(uoc ? { uocTinh: true } : {}), ...(choCu ? {} : { mucLam: mucCua(giay, false, thuong, kb === 'ngay-dau' ? undefined : doTreo(ten, k, giay, kb === 'dong')) }) })
    })
  })
  ds.sort((a, b) => (a.luc < b.luc ? 1 : -1))
  const coMat = em.map(([, c], i) => (c ? `S${i + 1}` : null)).filter((x): x is string => !!x)
  return { ds, lop: { soLop: 34, soCoMat: kb === 'chua-diem-danh' ? null : 28, coMat: kb === 'chua-diem-danh' ? null : coMat } }
}

/** Hồ sơ em đúng hình `/gv/ho-so-len-bang`. `chuaDo` ⇒ mọi lượt là đồng hồ cũ. */
export function hoSoEmGia(chuaDo = false) {
  const lan = [
    { luc: '2026-10-24T13:12:00Z', dung: false, coGoiY: false, nguon: 'Luyện theo dạng', giay: 22, chon: 'B', cu: true, d: false },
    { luc: '2026-10-25T12:08:00Z', dung: true, coGoiY: false, nguon: 'Tự sửa lỗi', giay: 18, chon: 'A', cu: false, d: true },
    { luc: '2026-10-26T11:48:00Z', dung: false, coGoiY: false, nguon: 'BTVN', giay: 11, chon: 'C', cu: false, d: false },
    { luc: '2026-10-27T01:42:00Z', dung: false, coGoiY: false, nguon: 'Lên bảng', giay: 41, chon: 'B', cu: false, d: false },
  ].map(({ cu, d, ...x }) => ({ ...x, ...(cu || chuaDo ? {} : { mucLam: mucCua(x.giay, d, chuaDo ? null : 75) }) }))
  const mau: [number, number][] = [[1, 5], [3, 6], [26, 5], [10, 2]]
  const luot = mau.flatMap(([dung, sai], i) => [
    ...Array.from({ length: dung }, () => ({ dung: true as boolean | null, mucLam: { ma: i + 1, ghiChu: undefined } as unknown as MucLamLuot })),
    ...Array.from({ length: sai }, () => ({ dung: false as boolean | null, mucLam: { ma: i + 1 } as unknown as MucLamLuot })),
  ])
  const cachLam14 = chuaDo ? { ...tongMucLam([]), chuaCoSoDo: 71 } : { ...tongMucLam(luot), chuaCoSoDo: 13 }
  return {
    ok: true,
    em: { sbd: 'S2', hoTen: 'Lê Thu Hà', tenLop: '12 - Tinh Hoa', expTong: 1280, expHomNay: 40, chuoiNgay: 5 },
    cauNay: { qid: 'Q12', soLan: lan.length, soDung: 1, soSai: 3, lan },
    ngay14: Array.from({ length: 14 }, (_, i) => ({ ngay: `2026-10-${String(14 + i).padStart(2, '0')}`, dung: [4, 6, 2, 8, 5, 0, 3, 7, 6, 4, 9, 5, 3, 6][i]!, sai: [1, 2, 0, 3, 1, 0, 2, 1, 2, 1, 3, 1, 1, 2][i]! })),
    dang: [{ ten: 'Pin điện hóa', soLan: 30, tiLe: 0.58, hang: 'L2' }, { ten: 'Điện phân', soLan: 22, tiLe: 0.41, hang: 'L2' }, { ten: 'Đại cương kim loại', soLan: 18, tiLe: 0.88, hang: 'L4' }],
    saiGanNhat: [{ qid: 'DH-12-C4-I-12', luc: '2026-10-26T11:48:00Z', nguon: 'BTVN', dang: 'Pin điện hóa' }, { qid: 'DH-12-C4-I-21', luc: '2026-10-25T12:08:00Z', nguon: 'BTVN', dang: 'Điện phân' }],
    lenBang: [{ qid: 'DH-12-C4-I-9', dat: true, luc: '2026-10-20T01:00:00Z' }, { qid: 'DH-12-C4-I-14', dat: false, luc: '2026-10-13T01:00:00Z' }],
    caGanNhat: { diem: 7.5, tenCa: 'Kiểm tra tuần 3', luc: '2026-10-25T10:00:00Z', diemTruoc: 6.8 },
    chienDich: { ten: 'Hành trình Hóa 12 · tuần 4', hanNop: '2026-11-02', coXat: 0.62, thanhThao: 0.31, nhip: 'dung', soNgayTre: 0 },
    tienDoCap: { cap: 14, exp: 320, moc: 500, toiDa: false },
    cachLam14,
  }
}
