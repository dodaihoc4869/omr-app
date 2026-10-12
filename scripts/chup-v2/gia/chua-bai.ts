// LÀN CHỮA BÀI 12/10B — DỮ LIỆU GIẢ cho cảnh `?man=gv-nhip&the=can-chua&ttc=1&cb=1` (Hành trình › Chữa bài: khối "Học sinh cần chữa" + khối "Chữa câu khó
// & tính toán" mở sẵn, tờ chiếu gọi em lên bảng). Dùng lại bài + lớp giả của làn Thầy tự chữa (gia/thay-tu-chua.ts); thêm hai lệnh CHỈ ĐỌC:
//   · `/gv/ai-sai-nhieu-cau` — em của lớp làm sai từng câu (số em sai KHỚP số gộp `soGopTtc` của dải T: bài − đúng), số lần sai, lúc, số giây;
//   · `/gv/buoi-hoc` `gan-day` — một buổi điểm danh đang mở hôm nay (khoảng 3/4 lớp có mặt).
// Tên em là tên giả; không yêu cầu nào ra mạng.
import { LOP_TTC, soGopTtc } from './thay-tu-chua'

export const LA_CB = !!new URLSearchParams(globalThis.location?.search ?? '').get('cb')

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Chu', 'Lý']
const DEM = ['Minh', 'Ngọc', 'Gia', 'Thu', 'Khánh', 'Quốc', 'Hương', 'Thanh', 'Đức', 'Phương']
const TEN = ['Anh', 'Ánh', 'Bảo', 'Trang', 'Vy', 'Việt', 'Cúc', 'Tâm', 'Huy', 'Linh', 'Hân', 'Khôi']
const bam = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
export const tenCb = (sbd: string) => {
  const i = Number(sbd) % 97
  return `${HO[i % HO.length]} ${DEM[(i * 3) % DEM.length]} ${TEN[(i * 7) % TEN.length]}`
}

/** SBD có mặt ở buổi đang mở hôm nay: bỏ 1 em mỗi 4 em. */
const coMat = (sbd: readonly string[]) => sbd.filter((_, i) => i % 4 !== 2)

function aiSaiNhieuCau(b: Record<string, unknown>) {
  const sbd = (Array.isArray(b.sbd) ? b.sbd : []).map(String)
  const cau: Record<string, unknown> = {}
  for (const qid of (Array.isArray(b.qids) ? b.qids : []).map(String)) {
    const g = soGopTtc(qid) as { bai: number; dung: number }
    const h = bam(qid)
    const lam = Math.min(g.bai, sbd.length)
    const soSai = Math.max(0, Math.min(lam, g.bai - g.dung))
    const dau = h % Math.max(1, sbd.length)
    const ds = Array.from({ length: soSai }, (_, i) => sbd[(dau + i * 5) % sbd.length]!).filter((x, i, a) => a.indexOf(x) === i)
    cau[qid] = {
      lam,
      sai: ds.map((s, i) => ({
        sbd: s,
        ten: tenCb(s),
        soLanSai: 1 + ((h >>> i) % 3),
        lucSai: new Date(Date.UTC(2026, 9, 1 + ((h >>> (i + 2)) % 10), 2 + (i % 9), (i * 7) % 60)).toISOString(),
        giay: i % 6 === 4 ? null : 25 + ((h >>> (i + 1)) % 130),
      })),
    }
  }
  return { ok: true, cau, conNua: false }
}

/** Trả lời các lệnh của làn; không phải lệnh của làn ⇒ null. */
export function traLoiChuaBai(duong: string, b: Record<string, unknown>): { ok: true; du: Record<string, unknown> } | null {
  if (!LA_CB) return null
  if (duong === '/gv/ai-sai-nhieu-cau') return { ok: true, du: aiSaiNhieuCau(b) }
  if (duong === '/gv/buoi-hoc' && b.action === 'gan-day') {
    const lop = LOP_TTC[0]!
    return { ok: true, du: { ok: true, buoi: [{ id: 'buoi-cb', ten: 'Buổi tối thứ Hai', lop: lop.tenLop, moLuc: new Date(Date.now() - 40 * 60_000).toISOString(), hetHan: '', dongLuc: null, dangMo: true, coMat: coMat(lop.sbd) }] } }
  }
  return null
}
