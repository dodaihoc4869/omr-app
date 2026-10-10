// LỊCH SỬ LÀM CÂU GIẢ cho ảnh chụp Hành trình › Nhịp học › tấm hồ sơ một em (thầy 09/10 khuya). Hình dạng đúng hợp đồng
// `server/src/lich-su-lam-cau-kieu.ts`; dữ liệu cố định (không ngẫu nhiên) để hai lần chụp ra cùng ảnh. Tên em là tên giả.
import type { CauEmSai, KetQuaLichSuLamCau, LanLamCau, NguonGiay } from '../../../server/src/lich-su-lam-cau-kieu'

const CAU: { qid: string; tieuDe: string; mucDo: string }[] = [
  { qid: 'DH-12-C1-B2-17', tieuDe: 'Câu 17 · Thuỷ phân ester đơn chức', mucDo: 'hieu' },
  { qid: 'DH-12-C1-B4-23', tieuDe: 'Câu 23 · Chỉ số xà phòng hoá chất béo', mucDo: 'VD' },
  { qid: 'DH-12-C1-B1-5', tieuDe: 'Câu 5 · Gọi tên ester theo danh pháp', mucDo: 'biet' },
  { qid: 'DH-12-C1-B2-31', tieuDe: 'Câu 31 · Bảo toàn khối lượng khi xà phòng hoá', mucDo: 'VD' },
  { qid: 'DH-12-C1-B3-12', tieuDe: '', mucDo: 'hieu' },
  { qid: 'DH-12-C2-B1-8', tieuDe: 'Câu 8 · Glucose và fructose', mucDo: 'biet' },
  { qid: 'DH-12-C1-B4-40', tieuDe: 'Câu 40 · Hiệu suất phản ứng ester hoá', mucDo: 'VDC' },
]
const NOI = ['Ca Kiểm tra 15 phút 12A1', 'Đảo', 'Đoàn', 'Lên bảng', 'Ôn lại', 'Bài tập về nhà', 'Đảo', 'Đoàn']
const NGAY = ['2026-10-09', '2026-10-08', '2026-10-07', '2026-10-05']
const CHON = ['A', 'B', 'C', 'D']

/** 42 lượt, mới trước: lượt Ca / Đảo / Đoàn / Lên bảng / Ôn lại / BTVN; số giây đo thật, ƯỚC TÍNH (lượt game cũ) và không đo được. */
function dsLan(): LanLamCau[] {
  const ra: LanLamCau[] = []
  for (let i = 0; i < 42; i++) {
    const ngay = NGAY[Math.min(NGAY.length - 1, Math.floor(i / 11))]!
    const gio = 20 - (i % 11)
    const c = CAU[(i * 3) % CAU.length]!
    const noi = NOI[i % NOI.length]!
    const dung = noi.startsWith('Ca') && i % 9 === 0 ? null : (i * 7) % 5 < 3
    const nguonGiay: NguonGiay = i % 6 === 4 ? null : noi === 'Đảo' && ngay < '2026-10-08' ? 'uoc' : 'do'
    ra.push({
      luc: `${ngay}T${String(gio - 7).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:00Z`,
      ngay,
      qid: c.qid,
      tieuDe: c.tieuDe,
      mucDo: c.mucDo,
      noi,
      dung,
      chon: dung === null ? null : CHON[(i * 5) % 4]!,
      giay: nguonGiay ? 18 + ((i * 37) % 140) : null,
      nguonGiay,
      coGoiY: i % 8 === 5,
    })
  }
  return ra
}

export function lichSuGia(sbd: string, hoTen: string): KetQuaLichSuLamCau {
  const lan = dsLan()
  const theoCau = new Map<string, LanLamCau[]>()
  for (const l of [...lan].reverse()) theoCau.set(l.qid, [...(theoCau.get(l.qid) ?? []), l])
  const cauSai: CauEmSai[] = [...theoCau.values()]
    .filter((ds) => ds.some((l) => l.dung === false))
    .map((ds) => {
      const cuoi = ds[ds.length - 1]!
      return {
        qid: cuoi.qid,
        tieuDe: cuoi.tieuDe,
        mucDo: cuoi.mucDo,
        soLan: ds.length,
        soSai: ds.filter((l) => l.dung === false).length,
        soDung: ds.filter((l) => l.dung === true).length,
        lanCuoiDung: cuoi.dung === true,
        lanCuoi: cuoi.luc,
        giaySai: ds.filter((l) => l.dung === false).map((l) => l.giay),
      }
    })
    .sort((a, b) => Number(a.lanCuoiDung) - Number(b.lanCuoiDung) || b.soSai - a.soSai || b.lanCuoi.localeCompare(a.lanCuoi))
  const doDuoc = lan.filter((l) => l.giay !== null)
  const tongGiay = doDuoc.reduce((s, l) => s + (l.giay ?? 0), 0)
  return {
    ok: true,
    em: { sbd, hoTen, lop: '12A1' },
    tong: {
      soLuot: lan.length,
      soDung: lan.filter((l) => l.dung === true).length,
      soSai: lan.filter((l) => l.dung === false).length,
      soBoTrong: lan.filter((l) => l.dung === null).length,
      soCau: theoCau.size,
      soCauSai: cauSai.length,
      giayTb: doDuoc.length ? Math.round(tongGiay / doDuoc.length) : null,
      tongGiay,
    },
    lan,
    cauSai,
    conNua: false,
    catBot: false,
  }
}
