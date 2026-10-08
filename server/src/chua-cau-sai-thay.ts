// Các route chỉ đặt sau cổng laThay trong Worker. Học liệu không bao giờ đi route học sinh.
import type { Env } from './kieu'
import { chuanCauHinh, docCauHinh, xoaDemChua } from './chua-cau-sai-cau-hinh'
import { kiemTinhDayDu } from './chua-cau-sai-hoc-lieu'
import { kiemBangMay } from './chua-hoc-lieu-kiem-may'
import { giaoDotCuaEm } from './chua-cau-sai'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import type { HocLieuChua } from './chua-cau-sai-kieu'
import { dongBoTuLuyen } from './chua-cau-sai-tu-luyen'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
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
    if (b.kiemMay !== undefined && goc.reviewed !== true) return Response.json({ok:false,mo:'Câu gốc chưa được kiểm nội dung.'},{status:422})
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
    const laMay = b.kiemMay !== undefined
    const loiMay = laMay ? await kiemBangMay(h,b.kiemMay) : []
    if (loiMay.length) return Response.json({ok:false,mo:'Học liệu chưa qua kiểm máy độc lập.',loiHocLieu:loiMay},{status:422})
    if (!laMay && (b.duyetChuyenMon !== true || !str(b.nguoiDuyet).trim()))
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
    const hocLieuJson=JSON.stringify({...h,...(laMay ? {kiemMay:b.kiemMay} : {})})
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
        hocLieuJson,
        laMay ? 'máy kiểm độc lập · v1' : str(b.nguoiDuyet).trim().slice(0, 100),
        bam,
        now,
        now,
        now,
      )
      .run()
    // Một bộ học liệu đã qua đủ các cổng kiểm phải mở ngay mọi vòng đang chờ
    // đúng câu + đúng phiên bản. Không đụng vòng đã có phiên để tránh đổi bài
    // giữa lúc học sinh đang tự gỡ.
    const mo = await env.DB.prepare(
      `UPDATE chua_loi_dot SET trang_thai_day='can_chan_doan',ly_do_thieu='',revision=revision+1,cap_nhat_luc=?
       WHERE qid_chuan=? AND phien_ban_cau=? AND dong_luc IS NULL
         AND trang_thai_day IN ('thieu_hoc_lieu','tam_khoa','cau_thay_doi')
         AND NOT EXISTS(SELECT 1 FROM chua_loi_phien p WHERE p.dot_id=chua_loi_dot.id)`,
    )
      .bind(now, h.qidGoc, h.contentVersion)
      .run()
    return Response.json({ ok: true, bam, soDotDaMo: Number(mo.meta?.changes ?? 0) })
  }
  const rows = await env.DB.prepare(
    `SELECT qid_chuan AS qid,content_version AS version,trang_thai AS trangThai,nguoi_duyet AS nguoiDuyet,kiem_tra_luc AS luc FROM chua_loi_hoc_lieu ORDER BY kiem_tra_luc DESC LIMIT 100`,
  ).all()
  return Response.json({ ok: true, ds: rows.results ?? [] })
}
export async function hangHocLieu(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    `WITH cau_hien_tai AS (
       SELECT q.qid,q.version,q.json FROM game_v2_question q
       JOIN de_kho d ON d.ma_de=q.ma_de
       JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc
       WHERE COALESCE(d.da_xoa,0)=0 GROUP BY q.qid
     ), hang AS (
       SELECT qid_chuan AS qid,phien_ban_cau AS version,trang_thai_day AS trangThai,ly_do_thieu AS lyDo,
         COUNT(DISTINCT id) AS soDot,COUNT(DISTINCT sbd) AS soEm,MIN(chot_do_luc) AS hanGanNhat
       FROM chua_loi_dot
       WHERE dong_luc IS NULL AND trang_thai_day IN ('thieu_hoc_lieu','cau_thay_doi','tam_khoa')
       GROUP BY qid_chuan,phien_ban_cau,trang_thai_day,ly_do_thieu
     )
     SELECT hang.*,c.version AS versionMoi,c.json AS cauJson,
       EXISTS(SELECT 1 FROM chua_loi_hoc_lieu h WHERE h.qid_chuan=hang.qid AND h.content_version=c.version AND h.trang_thai='du_dung') AS coHocLieuMoi
     FROM hang LEFT JOIN cau_hien_tai c ON c.qid=hang.qid
     ORDER BY soEm DESC,CASE WHEN hanGanNhat IS NULL THEN 1 ELSE 0 END,hanGanNhat ASC,qid LIMIT 5000`,
  ).all<Record<string, unknown>>()
  const ds = (rows.results ?? []).map((x) => {
    let cau: Record<string, unknown> | null = null
    if (typeof x.cauJson === 'string') {
      try {
        cau = JSON.parse(x.cauJson) as Record<string, unknown>
      } catch {
        cau = null
      }
    }
    const versionMoi = str(x.versionMoi)
    const coHocLieuMoi = Number(x.coHocLieuMoi ?? 0) === 1
    const loaiHang = !x.cauJson
      ? 'thieu_cau_goc'
      : !cau
        ? 'cau_goc_hong'
        : cau.reviewed !== true
          ? 'cau_chua_duyet'
          : laCauTuLuan(cau)
            ? 'tu_luan_khong_tu_dong'
            : coHocLieuMoi
              ? 'da_co_hoc_lieu_moi'
              : 'san_sang_soan'
    return {
      qid: str(x.qid),
      version: str(x.version),
      versionMoi,
      daDoi: Boolean(versionMoi && versionMoi !== str(x.version)),
      trangThai: str(x.trangThai),
      lyDo: str(x.lyDo),
      loaiHang,
      soDot: Number(x.soDot ?? 0),
      soEm: Number(x.soEm ?? 0),
      hanGanNhat: x.hanGanNhat == null ? null : Number(x.hanGanNhat),
    }
  })
  const thuTu: Record<string, number> = {
    da_co_hoc_lieu_moi: 0,
    san_sang_soan: 1,
    cau_chua_duyet: 2,
    cau_goc_hong: 3,
    tu_luan_khong_tu_dong: 4,
    thieu_cau_goc: 5,
  }
  ds.sort(
    (a, b) =>
      (thuTu[a.loaiHang] ?? 9) - (thuTu[b.loaiHang] ?? 9) ||
      b.soEm - a.soEm ||
      (a.hanGanNhat ?? Number.MAX_SAFE_INTEGER) -
        (b.hanGanNhat ?? Number.MAX_SAFE_INTEGER) ||
      a.qid.localeCompare(b.qid),
  )
  const tongHop: Record<
    string,
    { soNhomCau: number; soDot: number; soEmCau: number }
  > = {}
  for (const x of ds) {
    const t = (tongHop[x.loaiHang] ??= {
      soNhomCau: 0,
      soDot: 0,
      soEmCau: 0,
    })
    t.soNhomCau++
    t.soDot += x.soDot
    t.soEmCau += x.soEm
  }
  return Response.json({ ok: true, ds, tongHop, tongNhom: ds.length })
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
