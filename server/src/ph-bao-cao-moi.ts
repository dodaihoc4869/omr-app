// APP PHỤ HUYNH MỚI (thầy 28/09: "app phụ huynh không có giao bài cho con nữa chỉ xem được báo cáo mọi thứ về con"; bản vẽ https://claude.ai/artifact/2HShm51xEiuVKcTAUpfeFT).
// BA LỆNH CHỈ-ĐỌC cho phụ huynh, cùng xác thực `sbdCuaPhuHuynh` và cùng hằng `CHI_NHAN_TOKEN` với `/ph/tat-ca-ve-con` (token liên kết riêng HOẶC SBD trần):
//   · POST /ph/bao-cao-ca {pass|sbd, maCa, lanThu?} — báo cáo MỘT ca của con. Bộ dựng dùng chung `baoCaoMotEm` (hợp đồng docs/hop-dong-xem-diem-v2-2109.md mục 2):
//       chanCongBo: true ⇒ ca CHƯA công bố chỉ có `ca` + `congBo` (không điểm, không đáp án); coExp: false (app phụ huynh không có EXP); choThay: false (không hạng trong lớp).
//       + `nhanXet` của thầy CHỈ khi ca đã công bố (báo cáo có `ketQua`).
//   · POST /ph/loi-thay {pass|sbd} — nhận xét của thầy ở các ca ĐÃ CÔNG BỐ của con (luật `SQL_DA_CONG_BO`), mới trước, ≤ TOI_DA_LOI_THAY dòng, kèm tên ca, lúc nộp, điểm.
//   · POST /ph/hoc-2 {pass|sbd} — Game Hoá 2.0 của con (chỉ khi công tắc bật cho con): chiến dịch đang chạy (câu đã gặp / đã thành thạo / cần thầy dạy lại),
//       kế hoạch HÔM NAY ĐÃ CHỐT (`docKeHoachDaChot`: KHÔNG lập, KHÔNG ghi — phụ huynh mở app không được chốt kế hoạch thay con), câu từng sai đã thành thạo lại.
// Không trường nào của game (thần thú, vàng, rương, khiên, EXP, Đảo, Đoàn). Khối nào không có số thật ⇒ VẮNG (không số 0 giả).
// Việc ghi DUY NHẤT: dòng đếm truy cập `ph_truy_cap` của chính hàm xác thực (hoãn qua ctx, như /ph/tat-ca-ve-con).
import type { Env, ExecutionContext } from './kieu'
import { baoCaoMotEm } from './bao-cao-ca'
import { docNhanXet } from './ca-thi-them'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { CHI_NHAN_TOKEN } from './ph-tat-ca-ve-con'
import { sbdCuaPhuHuynh } from './ph-truy-cap'
import { cheDo2, docHoSo2, docKeHoachDaChot, ngayVnCua } from './srs2-d1'
import { soNgayConLai, tiLeChienDich } from './srs2-loi'

type Row = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const soHoacNull = (v: unknown): number | null => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))

export const TOI_DA_LOI_THAY = 12

// ---------------------------------------------------------------- /ph/bao-cao-ca ----------------------------------------------------------------
export async function phBaoCaoCa(envGoc: Env, b: Row, nowMs: number = Date.now(), envDoc: Env = envGoc, ctx?: ExecutionContext): Promise<Row> {
  const { sbd } = await sbdCuaPhuHuynh(envDoc, b, 'ph-bao-cao-ca', { chiToken: CHI_NHAN_TOKEN, envGhi: envGoc, ctx })
  const maCa = chuoi(b.maCa)
  if (!maCa) return { ok: false, lyDo: 'thieu', error: 'Thiếu mã ca.' }
  const lanThu = typeof b.lanThu === 'number' && Number.isInteger(b.lanThu) && b.lanThu > 0 ? b.lanThu : undefined
  const ra = await baoCaoMotEm(envDoc, { maCa, sbd, ...(lanThu ? { lanThu } : {}), nowMs, chanCongBo: true, coExp: false, choThay: false })
  if (ra.ok === true && ra.ketQua) {
    const nx = await docNhanXet(envDoc, maCa, sbd)
    if (nx) ra.nhanXet = nx
  }
  return ra
}

// ---------------------------------------------------------------- /ph/loi-thay ----------------------------------------------------------------
export async function phLoiThay(envGoc: Env, b: Row, _nowMs: number = Date.now(), envDoc: Env = envGoc, ctx?: ExecutionContext): Promise<Row> {
  const { sbd } = await sbdCuaPhuHuynh(envDoc, b, 'ph-loi-thay', { chiToken: CHI_NHAN_TOKEN, envGhi: envGoc, ctx })
  const luotMoiNhat = (cot: string) =>
    `(SELECT l.${cot} FROM luot l WHERE l.ma_ca = n.ma_ca AND l.sbd = n.sbd AND COALESCE(l.nop_luc, '') <> '' ORDER BY l.nop_luc DESC, l.lan_thu DESC LIMIT 1)`
  let rows: Row[]
  try {
    rows = (await envDoc.DB.prepare(
      `SELECT n.ma_ca, n.noi_dung, n.cap_nhat_luc, COALESCE(c.ten_ca, '') AS ten_ca, ${luotMoiNhat('tong')} AS tong, ${luotMoiNhat('nop_luc')} AS nop_luc
         FROM nhan_xet_ca_em n JOIN ca c ON c.ma_ca = n.ma_ca
        WHERE n.sbd = ? AND COALESCE(c.trang_thai, '') <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')} AND TRIM(n.noi_dung) <> ''
        ORDER BY COALESCE(nop_luc, n.cap_nhat_luc) DESC LIMIT ?`,
    ).bind(sbd, TOI_DA_LOI_THAY).all<Row>()).results ?? []
  } catch (e) {
    // Bảng nhận xét được tạo lúc thầy lưu nhận xét đầu tiên (ca-thi-them.ts): chưa có bảng ⇒ chưa có nhận xét nào. Lỗi khác ⇒ ném như mọi lệnh.
    if (/no such table/i.test(e instanceof Error ? e.message : String(e))) return { ok: true }
    throw e
  }
  const nhanXet = rows.map((x) => {
    const tong = soHoacNull(x.tong)
    const nopLuc = chuoi(x.nop_luc)
    return { maCa: chuoi(x.ma_ca), tenCa: chuoi(x.ten_ca) || `Ca ${chuoi(x.ma_ca)}`, noiDung: chuoi(x.noi_dung), capNhatLuc: chuoi(x.cap_nhat_luc), ...(nopLuc ? { nopLuc } : {}), ...(tong !== null ? { tong } : {}) }
  })
  return { ok: true, ...(nhanXet.length > 0 ? { nhanXet } : {}) }
}

// ---------------------------------------------------------------- /ph/hoc-2 ----------------------------------------------------------------
export async function phHoc2(envGoc: Env, b: Row, nowMs: number = Date.now(), envDoc: Env = envGoc, ctx?: ExecutionContext): Promise<Row> {
  const { sbd } = await sbdCuaPhuHuynh(envDoc, b, 'ph-hoc-2', { chiToken: CHI_NHAN_TOKEN, envGhi: envGoc, ctx })
  if (!(await cheDo2(envDoc, sbd))) return { ok: true, cheDo2: false }
  const ngay = ngayVnCua(nowMs)
  const [hs, kh] = await Promise.all([docHoSo2(envDoc, sbd, ngay), docKeHoachDaChot(envDoc, sbd, nowMs)])
  const ra: Row = { ok: true, cheDo2: true, ngay }
  const cd = hs.chienDich
  if (cd) {
    const tl = tiLeChienDich(hs.ttChienDich)
    if (tl.tong > 0) ra.chienDich = { ten: cd.ten, hanNop: cd.hanNop, conNgay: soNgayConLai(ngay, cd.hanNop), tong: tl.tong, daGap: tl.coXat, thanhThao: tl.thanhThao, canDayLai: tl.canDayLai }
  }
  if (kh && kh.tong > 0) ra.homNay = { tong: kh.tong, daLam: kh.tong - kh.conDao.length - kh.conDoan.length }
  const tungSai = [...hs.tt.values()].filter((t) => t.lichSu.some((l) => !l.dung))
  if (tungSai.length > 0) {
    const thanhThao = tungSai.filter((t) => t.thanhThao).length
    const canDayLai = tungSai.filter((t) => t.catTia && !t.thanhThao).length
    ra.cauTungSai = { tong: tungSai.length, thanhThao, canDayLai, dangOn: tungSai.length - thanhThao - canDayLai }
  }
  return ra
}
