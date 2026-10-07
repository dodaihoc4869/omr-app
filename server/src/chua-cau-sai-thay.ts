// Các route chỉ đặt sau cổng laThay trong Worker. Học liệu không bao giờ đi route học sinh.
import type { Env } from './kieu'
import { chuanCauHinh, docCauHinh, xoaDemChua } from './chua-cau-sai-cau-hinh'
import { kiemTinhDayDu } from './chua-cau-sai-hoc-lieu'
import { giaoDotCuaEm } from './chua-cau-sai'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import type { HocLieuChua } from './chua-cau-sai-kieu'
import { dongBoTuLuyen } from './chua-cau-sai-tu-luyen'
type Obj = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
export async function cauHinhThay(env: Env, b: Obj): Promise<Response> {
  if (b.luu === true) {
    const cfg = chuanCauHinh(b.cauHinh)
    if ((b.cauHinh as Obj)?.bat === true && !cfg.bat)
      return Response.json(
        { ok: false, mo: 'Cần chọn lớp hoặc học sinh trước khi bật pilot.' },
        { status: 422 },
      )
    await env.DB.prepare(
      `INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('chua_cau_sai_v1',?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri,cap_nhat_luc=excluded.cap_nhat_luc`,
    )
      .bind(JSON.stringify(cfg), new Date().toISOString())
      .run()
    xoaDemChua(env)
  }
  return Response.json({ ok: true, cauHinh: await docCauHinh(env) })
}
export async function hocLieuThay(env: Env, b: Obj): Promise<Response> {
  if (b.luu !== true && str(b.qid)) {
    const row = await env.DB.prepare(
      `SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WHERE q.qid=? AND COALESCE(d.da_xoa,0)=0 LIMIT 1`,
    )
      .bind(str(b.qid))
      .first<{ json: string }>()
    return row
      ? Response.json({ ok: true, cauGocRieng: JSON.parse(row.json) })
      : Response.json(
          {
            ok: false,
            mo: 'Câu gốc hiện không còn trong kho được lập chỉ mục.',
          },
          { status: 404 },
        )
  }
  if (b.luu === true) {
    const h = b.hocLieu as HocLieuChua,
      errors = kiemTinhDayDu(h)
    if (errors.length)
      return Response.json(
        { ok: false, mo: 'Học liệu chưa đủ điều kiện.', loiHocLieu: errors },
        { status: 422 },
      )
    const root = await env.DB.prepare(
      `SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WHERE q.qid=? AND COALESCE(d.da_xoa,0)=0 LIMIT 1`,
    )
      .bind(h.qidGoc)
      .first<{ json: string }>()
    if (!root || JSON.parse(root.json).version !== h.contentVersion)
      return Response.json(
        { ok: false, mo: 'Phiên bản học liệu phải khớp câu gốc đang dùng.' },
        { status: 422 },
      )
    const goc = JSON.parse(root.json)
    if (
      [...h.banGhepBai, ...h.banKiemChung].some(
        (p) =>
          p.phan !== goc.phan ||
          (p.phan === 'I' &&
            (p.noiDungTrucTiep?.kieu !== 'chon' ||
              p.noiDungTrucTiep.luaChon?.length !== 4)) ||
          (p.phan === 'II' &&
            (p.noiDungTrucTiep?.kieu !== 'ds' ||
              p.noiDungTrucTiep.y?.length !== 4)) ||
          (p.phan === 'III' && p.noiDungTrucTiep?.kieu !== 'so'),
      )
    )
      return Response.json(
        {
          ok: false,
          mo: 'Bản toàn bài phải giữ đúng định dạng phần của câu gốc (I: 4 lựa chọn; II: 4 ý; III: trả lời số).',
        },
        { status: 422 },
      )
    if (b.duyetChuyenMon !== true || !str(b.nguoiDuyet).trim())
      return Response.json(
        {
          ok: false,
          mo: 'Cần thầy duyệt nội dung, độ khó, tính tương đương và xác nhận tên người duyệt.',
        },
        { status: 422 },
      )
    const rootText = JSON.parse(root.json)
      .text?.normalize('NFKC')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
    if (
      [...h.banGhepBai, ...h.banKiemChung].some(
        (p) =>
          p.noiDungTrucTiep?.hoi
            .normalize('NFKC')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim() === rootText,
      )
    )
      return Response.json(
        {
          ok: false,
          mo: 'Bản ghép/kiểm chứng phải khác đề gốc, không chỉ đổi mã phương án.',
        },
        { status: 422 },
      )
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify(h)),
    )
    const bam = [...new Uint8Array(hash)]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join(''),
      now = Date.now()
    await env.DB.prepare(
      `INSERT OR IGNORE INTO chua_loi_hoc_lieu(bam,content_version,qid_chuan,hoc_lieu_json,trang_thai,nguoi_duyet,phien_ban_duyet,kiem_tra_luc,tao_luc,cap_nhat_luc) VALUES(?,?,?,?,'du_dung',?,?,?,?,?)`,
    )
      .bind(
        bam,
        h.contentVersion,
        h.qidGoc,
        JSON.stringify(h),
        str(b.nguoiDuyet).trim().slice(0, 100),
        bam,
        now,
        now,
        now,
      )
      .run()
    return Response.json({ ok: true, bam })
  }
  const rows = await env.DB.prepare(
    `SELECT qid_chuan AS qid,content_version AS version,trang_thai AS trangThai,nguoi_duyet AS nguoiDuyet,kiem_tra_luc AS luc FROM chua_loi_hoc_lieu ORDER BY kiem_tra_luc DESC LIMIT 100`,
  ).all()
  return Response.json({ ok: true, ds: rows.results ?? [] })
}
export async function hangHocLieu(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    `SELECT qid_chuan AS qid,phien_ban_cau AS version,trang_thai_day AS trangThai,ly_do_thieu AS lyDo,COUNT(*) AS soDot,COUNT(DISTINCT sbd) AS soEm,MIN(chot_do_luc) AS hanGanNhat FROM chua_loi_dot WHERE dong_luc IS NULL AND trang_thai_day IN ('thieu_hoc_lieu','cau_thay_doi','tam_khoa') GROUP BY qid_chuan,phien_ban_cau,trang_thai_day,ly_do_thieu ORDER BY soEm DESC,hanGanNhat ASC LIMIT 200`,
  ).all()
  return Response.json({ ok: true, ds: rows.results ?? [] })
}
export async function giaoPilot(env: Env, b: Obj): Promise<Response> {
  const cfg = await docCauHinh(env)
  if (!cfg.bat)
    return Response.json(
      { ok: false, mo: 'Chọn phạm vi pilot và bật cờ trước khi giao.' },
      { status: 409 },
    )
  // Mẫu số hình thành khi GIAO cho toàn bộ phạm vi, không chờ các em tự mở màn chữa.
  const offset = Math.max(
    0,
    Math.min(100000, Math.floor(Number(b.offset) || 0)),
  )
  const rows = await env.DB.prepare(
    `SELECT s.sbd,COALESCE(json_extract(s.raw_json,'$.tc'),s.qid) AS qid FROM su_kien_hoc s JOIN hoc_sinh h ON h.sbd=s.sbd
  WHERE s.ngay_vn>='2026-09-29' AND COALESCE(s.ket_qua,0)=0 AND COALESCE(s.assistance,'none') IN ('none','') AND COALESCE(s.visibility,'released')<>'embargoed' AND ${SQL_LA_LAN_LAM}
  AND (?=1 OR h.sbd IN (SELECT value FROM json_each(?)) OR h.lop IN (SELECT value FROM json_each(?)))
  AND (s.nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=s.ma_nguon AND c.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('c')}))
  AND (s.nguon<>'luyen' OR EXISTS(SELECT 1 FROM luyen_de_2026 ld WHERE ld.id=s.ma_nguon AND ld.sbd=s.sbd AND ld.status='submitted'))
  GROUP BY s.sbd,COALESCE(json_extract(s.raw_json,'$.tc'),s.qid) ORDER BY s.sbd,qid LIMIT 2 OFFSET ?`,
  )
    .bind(
      cfg.phamVi === 'tat_ca' ? 1 : 0,
      JSON.stringify(cfg.sbd),
      JSON.stringify(cfg.lop),
      offset,
    )
    .all<{ sbd: string; qid: string }>()
  const ds = []
  for (const row of rows.results ?? []) {
    const r = await giaoDotCuaEm(env, row.sbd, row.qid)
    ds.push({ sbd: row.sbd, qid: row.qid, ...(await r.json()) })
  }
  return Response.json({
    ok: true,
    ds,
    tiepOffset: offset + (rows.results?.length ?? 0),
    con: rows.results?.length === 2,
  })
}
/** Bù kết quả Tu luyện cũ từ receipt của máy chủ, không lấy đáp án/timestamp ở trình duyệt. */
export async function dongBoTuCu(env: Env, b: Obj): Promise<Response> {
  const cfg = await docCauHinh(env)
  if (!cfg.bat || !cfg.dongBoTuLuyen)
    return Response.json(
      {
        ok: false,
        mo: 'Bật phạm vi và đồng bộ Tu luyện trước khi rà kết quả cũ.',
      },
      { status: 409 },
    )
  const cursor = str(b.cursor).slice(0, 100)
  const row = await env.DB.prepare(
    `SELECT t.id,t.sbd FROM tu_luyen_luot t JOIN hoc_sinh h ON h.sbd=t.sbd WHERE t.id>? AND (?=1 OR h.sbd IN (SELECT value FROM json_each(?)) OR h.lop IN (SELECT value FROM json_each(?))) AND (EXISTS(SELECT 1 FROM tu_luyen_cham_cau c WHERE c.luot_id=t.id AND c.sbd=t.sbd AND c.luc>=?) OR EXISTS(SELECT 1 FROM tu_luyen_cau c WHERE c.luot_id=t.id AND c.sbd=t.sbd AND c.nop_luc>=?)) ORDER BY t.id LIMIT 1`,
  )
    .bind(
      cursor,
      cfg.phamVi === 'tat_ca' ? 1 : 0,
      JSON.stringify(cfg.sbd),
      JSON.stringify(cfg.lop),
      Date.parse('2026-09-28T17:00:00Z'),
      Date.parse('2026-09-28T17:00:00Z'),
    )
    .first<{ id: string; sbd: string }>()
  if (!row) return Response.json({ ok: true, con: false, cursor })
  if (!(await dongBoTuLuyen(env, row.sbd, row.id)))
    return Response.json(
      {
        ok: false,
        mo: `Chưa đồng bộ được lượt ${row.id}. Vị trí cũ được giữ để thử lại.`,
      },
      { status: 503 },
    )
  return Response.json({ ok: true, con: true, cursor: row.id })
}
export async function hangThay(env: Env, b: Obj): Promise<Response> {
  if (b.moLai === true || str(b.loiGo) || b.xong === true)
    return Response.json(
      {
        ok: false,
        mo: 'Chữa bước cuối tại Lên bảng → Câu cần chữa; bấm Thầy chữa trên tờ để các em có mặt tiếp tục tự kiểm.',
      },
      { status: 422 },
    )
  const rows = await env.DB.prepare(
    `SELECT t.dot_id AS dotId,t.sbd,h.ho_ten AS hoTen,t.qid,t.bang_chung_json AS bangChung,t.gui_luc AS guiLuc,d.trang_thai_day AS trangThai,d.ly_do_thieu AS lyDoThieu FROM chua_loi_thay t LEFT JOIN hoc_sinh h ON h.sbd=t.sbd JOIN chua_loi_dot d ON d.id=t.dot_id WHERE t.trang_thai='cho_thay' ORDER BY t.gui_luc ASC LIMIT 100`,
  ).all()
  const ds = rows.results ?? []
  const ns = await env.DB.prepare(
    `SELECT n.dot_id AS dotId,n.tra_loi AS traLoi,n.dung,n.co_ho_tro AS coHoTro,i.public_json AS cau FROM chua_loi_nop n JOIN chua_loi_item i ON i.id=n.item_id WHERE n.dot_id IN (SELECT value FROM json_each(?)) ORDER BY n.nop_luc DESC LIMIT 1200`,
  )
    .bind(JSON.stringify(ds.map((x: any) => x.dotId)))
    .all<any>()
  return Response.json({
    ok: true,
    ds: ds.map((x: any) => ({
      ...x,
      baiLam: (ns.results ?? [])
        .filter((n) => n.dotId === x.dotId)
        .slice(0, 12)
        .map((n) => ({ ...n, cau: JSON.parse(n.cau) })),
    })),
  })
}
