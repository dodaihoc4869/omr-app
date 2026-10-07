// Bước cuối của vòng tự chữa: gom chỗ còn mắc, thầy chữa một lần trên lớp.
import type { Env } from './kieu'
import { docCauHinh } from './chua-cau-sai-cau-hinh'
import { docHocLieu } from './chua-cau-sai-hoc-lieu'
import { chonProbe, type AnhPhien } from './chua-cau-sai-phien'
import type { NhomChuaTrenLop } from './chua-cau-sai-chieu-kieu'
import { coCaDangMo } from './bi-a'
type Obj = Record<string, any>
const str = (x: unknown) => (typeof x === 'string' ? x.trim() : '')
const loi = (mo: string, status = 409) =>
  Response.json({ ok: false, mo }, { status })
async function bam(x: unknown) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify(x)),
      ),
    ),
  ]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')
}
async function docHang(
  env: Env,
  lop: string,
): Promise<{ ds: NhomChuaTrenLop[]; conNua: boolean }> {
  const cfg = await docCauHinh(env)
  const rows = await env.DB.prepare(
    `SELECT d.*,h.ho_ten,h.lop AS ten_lop,p.snapshot_json,
    (SELECT n.tra_loi FROM chua_loi_nop n WHERE n.dot_id=d.id ORDER BY n.nop_luc DESC,n.rowid DESC LIMIT 1) AS tra_loi,
    (SELECT i.public_json FROM chua_loi_nop n JOIN chua_loi_item i ON i.id=n.item_id WHERE n.dot_id=d.id ORDER BY n.nop_luc DESC,n.rowid DESC LIMIT 1) AS cau_cuoi,
    t.gui_luc FROM chua_loi_thay t JOIN chua_loi_dot d ON d.id=t.dot_id
    JOIN hoc_sinh h ON h.sbd=d.sbd JOIN chua_loi_phien p ON p.id=(SELECT id FROM chua_loi_phien WHERE dot_id=d.id ORDER BY lan_gap_lai DESC,so_luot DESC LIMIT 1)
    WHERE t.trang_thai='cho_thay' AND d.trang_thai_day='can_thay' AND (?='' OR h.lop=?) ORDER BY t.gui_luc,d.id LIMIT 501`,
  )
    .bind(lop, lop)
    .all<Obj>()
  const nhom = new Map<string, NhomChuaTrenLop>()
  for (const r of (rows.results ?? []).slice(0, 500)) {
    if (
      !cfg.bat ||
      !(
        cfg.phamVi === 'tat_ca' ||
        cfg.sbd.includes(r.sbd) ||
        cfg.lop.includes(r.ten_lop)
      )
    )
      continue
    let a: AnhPhien, cau: Obj
    try {
      a = JSON.parse(r.snapshot_json)
      cau = JSON.parse(r.cau_cuoi ?? '{}')
    } catch {
      continue
    }
    if (!a.hocLieu?.buoc || !a.tienDo || !a.cauGoc) continue
    const td = a.tienDo[a.buoc],
      buoc = td
        ? a.hocLieu.buoc.filter((b) => b.id === td.buocId)
        : a.hocLieu.buoc
    const buocId = td?.buocId ?? '__ghep_bai__'
    const maLoi = td?.maLoiDaXacNhan ?? null
    const key = JSON.stringify([
      r.ten_lop,
      r.content_group || r.qid_chuan,
      a.version,
      buocId,
      maLoi,
      buoc,
    ])
    let g = nhom.get(key)
    if (!g) {
      g = {
        id: await bam(key),
        lop: r.ten_lop,
        qid: r.qid_chuan,
        buocId,
        tieuDe: td?.tieuDe ?? 'Nối các bước thành cả bài',
        maLoi,
        diemVuong:
          a.phanHoi?.diemlech ?? 'Chưa đủ bằng chứng để kết luận nguyên nhân.',
        cauGoc: a.cauGoc,
        buoc: buoc.map((b) => ({
          id: b.id,
          tieuDe: b.tieuDe,
          hoTro: b.hoTro.map((x) => ({ muc: x.muc, noiDung: x.noiDung })),
          hieuBuoc: b.hieuBuoc
            ? {
                mucTieu: b.hieuBuoc.mucTieu,
                yNghiaDaiLuong: b.hieuBuoc.yNghiaDaiLuong,
                viSaoCanBuoc: b.hieuBuoc.viSaoCanBuoc,
                dieuKienApDung: b.hieuBuoc.dieuKienApDung,
                noiVoiBuocSau: b.hieuBuoc.noiVoiBuocSau,
              }
            : undefined,
        })),
        em: [],
        guiLuc: Number(r.gui_luc),
      }
      nhom.set(key, g)
    }
    g.em.push({
      dotId: r.id,
      sbd: r.sbd,
      hoTen: r.ho_ten ?? r.sbd,
      revision: Number(r.revision),
      daHieu: a.tienDo
        .filter((t) => t.trangThai === 'co_bang_chung_hieu_trong_phien')
        .map((t) => t.tieuDe),
      traLoi: str(r.tra_loi),
      hoi: str(cau.hoi),
      soVongHoTro: td?.soVongHoTro ?? 0,
    })
  }
  return {
    ds: [...nhom.values()].sort(
      (a, b) => b.em.length - a.em.length || a.guiLuc - b.guiLuc,
    ),
    conNua: (rows.results?.length ?? 0) > 500,
  }
}
export async function hangChieu(env: Env, b: Obj): Promise<Response> {
  const cfg = await docCauHinh(env)
  if (!cfg.bat)
    return Response.json({ ok: true, bat: false, ds: [], conNua: false })
  return Response.json({
    ok: true,
    bat: true,
    ...(await docHang(env, str(b.lop))),
  })
}

/** Một batch tối đa 6 em để nằm trong ngân sách D1; UI tự tiếp các batch còn lại. */
export async function daChuaTrenLop(env: Env, b: Obj): Promise<Response> {
  const id = str(b.requestId),
    buoiId = str(b.buoiId),
    nhomId = str(b.nhomId)
  const dot = Array.isArray(b.dot) ? b.dot : []
  if (
    !/^[a-zA-Z0-9_-]{16,100}$/.test(id) ||
    !buoiId ||
    !nhomId ||
    !dot.length ||
    dot.length > 6 ||
    dot.some((x: Obj) => !str(x.dotId) || !Number.isInteger(x.revision)) ||
    new Set(dot.map((x: Obj) => x.dotId)).size !== dot.length
  )
    return loi('Cần đúng buổi, nhóm câu và tiến độ của tối đa 6 em.', 422)
  const hash = await bam([buoiId, nhomId, dot, str(b.buocId)])
  const cu = await env.DB.prepare(
    'SELECT request_hash,response_json FROM chua_loi_chua_lop WHERE request_id=?',
  )
    .bind(id)
    .first<Obj>()
  if (cu)
    return cu.request_hash === hash
      ? Response.json(JSON.parse(cu.response_json))
      : loi('Mã xác nhận này đã dùng cho nội dung khác.')
  if (!(await docCauHinh(env)).bat) return loi('Vòng chữa đang tắt.', 403)
  const buoi = await env.DB.prepare(
    'SELECT id,lop,dong_luc,het_han FROM buoi_hoc WHERE id=?',
  )
    .bind(buoiId)
    .first<Obj>()
  if (!buoi || buoi.dong_luc || !(Date.parse(buoi.het_han) > Date.now()))
    return loi('Buổi đã kết thúc. Mở đúng buổi có mặt trước khi chữa.')
  const ds = await docHang(env, str(buoi.lop)),
    g = ds.ds.find((x) => x.id === nhomId)
  if (
    !g ||
    dot.some(
      (x: Obj) =>
        !g.em.some((e) => e.dotId === x.dotId && e.revision === x.revision),
    )
  ) {
    const daGhi = await env.DB.prepare(
      'SELECT request_hash,response_json FROM chua_loi_chua_lop WHERE request_id=?',
    )
      .bind(id)
      .first<Obj>()
    return daGhi?.request_hash === hash
      ? Response.json(JSON.parse(daGhi.response_json))
      : loi('Tiến độ đã đổi. Tải lại câu cần chữa trước khi xác nhận.')
  }
  const diemDanh = await env.DB.prepare(
    "SELECT sbd FROM buoi_hoc_diem_danh WHERE buoi_id=? AND trang_thai='co_mat'",
  )
    .bind(buoiId)
    .all<{ sbd: string }>()
  const coMat = new Set((diemDanh.results ?? []).map((x) => x.sbd))
  const em = g.em.filter((e) => dot.some((x: Obj) => x.dotId === e.dotId))
  if (em.some((e) => !coMat.has(e.sbd)))
    return loi('Có em chưa có mặt. Chỉ xác nhận cho các em đã điểm danh.', 422)
  const buocId = g.buocId === '__ghep_bai__' ? str(b.buocId) : g.buocId
  if (!g.buoc.some((x) => x.id === buocId))
    return loi('Chọn bước vừa được chữa trên lớp.', 422)
  const now = Date.now(),
    statements = [],
    giuHocLieu: string[] = []
  for (const e of em) {
    if (await coCaDangMo(env, e.sbd, Date.now(), true))
      return loi(
        'Có em đang trong ca kiểm tra; giữ tiến độ đến khi ca kết thúc.',
        423,
      )
    const ph = await env.DB.prepare(
      'SELECT * FROM chua_loi_phien WHERE dot_id=? ORDER BY lan_gap_lai DESC,so_luot DESC LIMIT 1',
    )
      .bind(e.dotId)
      .first<Obj>()
    if (!ph) return loi('Không tìm thấy phiên cần chữa.')
    const a: AnhPhien = JSON.parse(ph.snapshot_json)
    const h = await docHocLieu(env, a.hocLieu.qidGoc)
    if (!h.hocLieu || h.hocLieu.contentVersion !== a.version)
      return loi(
        'Học liệu đã đổi phiên bản. Kiểm học liệu trước khi cho em tiếp.',
      )
    if (
      JSON.stringify(a.hocLieu.buoc.map((x) => x.id)) !==
      JSON.stringify(h.hocLieu.buoc.map((x) => x.id))
    )
      return loi(
        'Các bước của bài đã đổi. Cần kiểm lại học liệu trước khi mang bằng chứng sang bài khác.',
      )
    for (const t of a.tienDo.filter(
      (x) =>
        x.buocId !== buocId && x.trangThai === 'co_bang_chung_hieu_trong_phien',
    )) {
      if (
        JSON.stringify(a.hocLieu.buoc.find((x) => x.id === t.buocId)) !==
        JSON.stringify(h.hocLieu.buoc.find((x) => x.id === t.buocId))
      )
        return loi('Bước đã hiểu đổi nội dung; cần giữ bằng chứng đúng bản.')
    }
    a.hocLieu = h.hocLieu
    a.buoc = a.tienDo.findIndex((x) => x.buocId === buocId)
    if (a.buoc < 0) return loi('Không tìm thấy bước cần tự kiểm.')
    const t = a.tienDo[a.buoc]
    t.receiptLyDo = undefined
    t.receiptChuyenGiao = undefined
    t.soVongHoTro = 0
    t.trangThai = 'can_ho_tro_tiep'
    a.pha = 'kiem_ly_do'
    a.phanHoi = null
    a.soChanDoan = 0
    a.batDauDoan = now
    const conCau = !!chonProbe(a)
    if (!conCau) giuHocLieu.push(e.dotId)
    // Không gắn bằng chứng hiểu từ việc nghe chữa; em phải tự kiểm lý do và chuyển giao.
    statements.push(
      env.DB.prepare(
        `UPDATE chua_loi_dot SET trang_thai_day=?,ly_do_thieu=?,ho_tro_cuoi_luc=?,revision=revision+1,cap_nhat_luc=? WHERE id=? AND revision=? AND trang_thai_day='can_thay' AND EXISTS(SELECT 1 FROM buoi_hoc_diem_danh WHERE buoi_id=? AND sbd=chua_loi_dot.sbd AND trang_thai='co_mat') AND EXISTS(SELECT 1 FROM chua_loi_chua_lop WHERE request_id=? AND request_hash=?)`,
      ).bind(
        conCau ? 'dang_chua_buoc' : 'thieu_hoc_lieu',
        conCau ? '' : 'het_cau_moi_sau_chua_lop',
        now,
        now,
        e.dotId,
        e.revision,
        buoiId,
        id,
        hash,
      ),
    )
    statements.push(
      env.DB.prepare(
        'UPDATE chua_loi_phien SET snapshot_json=?,tien_do_json=?,item_hien_tai=NULL,revision=revision+1,cap_nhat_luc=? WHERE id=? AND changes()=1',
      ).bind(JSON.stringify(a), JSON.stringify(a.tienDo), now, ph.id),
    )
    statements.push(
      env.DB.prepare(
        "UPDATE chua_loi_thay SET trang_thai='da_chua_tren_lop',loi_go=?,xu_ly_luc=?,doc_luc=0 WHERE dot_id=? AND changes()=1",
      ).bind(
        'Thầy đã chữa bước này trên lớp. Em giải thích lại quan hệ đúng rồi thử một câu mới; các bước đã hiểu được giữ.',
        now,
        e.dotId,
      ),
    )
  }
  const response = {
    ok: true,
    soEm: em.length,
    choHocLieu: giuHocLieu.length,
    daChua: true,
  }
  // Guard ở INSERT đọc lại tất cả revision/điểm danh; cạnh tranh chỉ một receipt thắng, không ghi một phần nhóm.
  const guard = `NOT EXISTS(SELECT 1 FROM json_each(?) x LEFT JOIN chua_loi_dot d ON d.id=json_extract(x.value,'$.dotId') LEFT JOIN buoi_hoc_diem_danh dd ON dd.sbd=d.sbd AND dd.buoi_id=? AND dd.trang_thai='co_mat' WHERE d.id IS NULL OR d.revision<>json_extract(x.value,'$.revision') OR d.trang_thai_day<>'can_thay' OR dd.sbd IS NULL)`
  await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO chua_loi_chua_lop(request_id,request_hash,buoi_id,nhom_id,dot_json,response_json,luc) SELECT ?,?,?,?,?,?,? WHERE ${guard} AND EXISTS(SELECT 1 FROM buoi_hoc WHERE id=? AND dong_luc IS NULL AND het_han>?)`,
    ).bind(
      id,
      hash,
      buoiId,
      nhomId,
      JSON.stringify(dot),
      JSON.stringify(response),
      now,
      JSON.stringify(dot),
      buoiId,
      buoiId,
      new Date(now).toISOString(),
    ),
    ...statements,
  ])
  const saved = await env.DB.prepare(
    'SELECT request_hash,response_json FROM chua_loi_chua_lop WHERE request_id=?',
  )
    .bind(id)
    .first<Obj>()
  if (!saved || saved.request_hash !== hash)
    return loi(
      'Tiến độ vừa đổi; chưa xác nhận buổi chữa. Tải lại trước khi thử tiếp.',
    )
  return Response.json(JSON.parse(saved.response_json))
}
