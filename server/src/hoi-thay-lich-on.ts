// Lịch kiểm sau Hỏi thầy là một ưu tiên trong ngân sách ôn có sẵn, không một bộ giao bài mới.
import { SQL_DAU_HO_TRO_CHUA } from './dau-ho-tro-chua'
// Hai đối số là biểu thức SQL cố định do mã máy chủ cung cấp, tuyệt đối không nhận từ request.
export function sqlCauHoiThayDenHan(sbdSql: string, nowSql: string): string {
  return `SELECT k.qid_goc FROM hoi_thay_kiem k
    WHERE k.sbd=${sbdSql} AND k.trang_thai='da_nop' AND k.den_han IS NOT NULL AND k.den_han<=${nowSql}
    AND EXISTS(SELECT 1 FROM game_v2_question q WHERE q.qid=k.qid_goc AND q.version=k.version_goc AND q.content_group=k.nhom_goc)
    AND NOT EXISTS(SELECT 1 FROM hoi_thay_kiem n WHERE n.sbd=k.sbd AND n.qid_goc=k.qid_goc
      AND n.trang_thai='da_nop' AND (n.phat_luc>k.phat_luc OR(n.phat_luc=k.phat_luc AND n.id>k.id)))
    AND NOT EXISTS(SELECT 1 FROM hoi_thay_kiem n WHERE n.sbd=k.sbd AND n.qid_goc=k.qid_goc
      AND n.trang_thai='dang_lam' AND n.het_han_luc>${nowSql})
    AND NOT EXISTS(SELECT 1 FROM loi_giai_hoi l WHERE l.sbd=k.sbd
      AND l.qid IN(SELECT k.qid_goc UNION ALL SELECT q.qid FROM game_v2_question q WHERE q.content_group=k.nhom_goc)
      AND l.luc>strftime('%Y-%m-%dT%H:%M:%fZ',(${nowSql}-43200000)/1000.0,'unixepoch')
      AND ${SQL_DAU_HO_TRO_CHUA})
    ORDER BY k.den_han,k.qid_goc LIMIT 12`
}

/** Ưu tiên ổn định, dùng CHỈ cho ứng viên ôn/sửa đã qua cửa phạm vi và sẵn sàng. */
export function soSanhOnHoiThay(a: string, b: string, denHan: ReadonlySet<string>): number {
  return Number(denHan.has(b)) - Number(denHan.has(a))
}
