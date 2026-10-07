// Hợp đồng chữa lỗi: quyền từ token, ảnh chụp bất biến, CAS và sổ học trong cùng batch.
import type { Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { coCaDangMo } from './bi-a'
import { cauCongKhai, layCauChoEm } from './cau-theo-qid'
import { chuanCauHinh, docCauHinh, tinhNangBat } from './chua-cau-sai-cau-hinh'
import { docHocLieu } from './chua-cau-sai-hoc-lieu'
import {
  qidChuan,
  docTrangThaiLoiDau,
  docLuatChua,
} from './chua-cau-sai-adapter'
import { tinhTienDo } from './chua-cau-sai-fsm'
import {
  anhMoi,
  chamProbe,
  chonProbe,
  dauNoiDung,
  nhanSauNop,
  type AnhPhien,
} from './chua-cau-sai-phien'
import { lenhGhiSuKienNguyenTu, ngayVn } from './su-kien-hoc'
import { emCoGhi } from './dem-ke-hoach'
import type { ItemCongKhai, ProbeRef } from './chua-cau-sai-kieu'
import { khopPhanIII } from '../../src/lib/cham-so'
type Obj = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const num = (v: unknown) => Number(v) || 0
const loi = (ma: string, mo: string, status = 400) =>
  Response.json({ ok: false, ma, mo }, { status })
async function quyen(env: Env, b: Obj): Promise<string | Response> {
  const sbd = await gameIdentity(env, b).catch(() => '')
  if (!sbd) return loi('CAN_DANG_NHAP', 'Em đăng nhập lại để tiếp tục.', 401)
  if (!(await tinhNangBat(env, { sbd })))
    return loi('FEATURE_TAT', 'Vòng chữa chưa mở cho tài khoản này.', 403)
  try {
    if (await coCaDangMo(env, sbd, Date.now(), true))
      return loi(
        'DANG_KIEM_TRA',
        'Em hoàn thành ca kiểm tra trước khi chữa câu.',
        403,
      )
  } catch {
    return loi(
      'CHO_KIEM_QUYEN',
      'Chưa kiểm tra được lịch thi. Tiến độ được giữ; em thử lại sau.',
      503,
    )
  }
  return sbd
}
async function bam(v: unknown): Promise<string> {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(v)),
  )
  return [...new Uint8Array(bytes)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
}
const docDot = (env: Env, sbd: string, id: string) =>
  env.DB.prepare('SELECT * FROM chua_loi_dot WHERE id=? AND sbd=?')
    .bind(id, sbd)
    .first<Obj>()
const docPhien = (env: Env, sbd: string, dot: string) =>
  env.DB.prepare(
    'SELECT * FROM chua_loi_phien WHERE dot_id=? AND sbd=? ORDER BY lan_gap_lai DESC,so_luot DESC LIMIT 1',
  )
    .bind(dot, sbd)
    .first<Obj>()
function docAnh(ph: Obj): AnhPhien | null {
  try {
    const a = JSON.parse(str(ph.snapshot_json))
    return a.hocLieu && Array.isArray(a.tienDo) ? a : null
  } catch {
    return null
  }
}
async function cauDuoc(env: Env, sbd: string, qid: string) {
  // Chỉ gọi sau bằng chứng lỗi đã công bố hoặc đợt máy chủ đã giao; alias cùng nhóm nội dung được phép phục vụ.
  const r = await layCauChoEm(env, sbd, [qid], new Set([qid]))
  if (r.loi || !r.cau[0] || r.nghi?.has(qid)) return null
  return r.cau[0]
}
async function kiemAnh(
  env: Env,
  sbd: string,
  dot: Obj,
  a: AnhPhien,
): Promise<Response | null> {
  const q = await cauDuoc(env, sbd, str(dot.qid_chuan))
  if (!q)
    return loi(
      'CAU_BI_BAO_VE',
      'Câu hiện chưa được phép luyện. Tiến độ của em vẫn được giữ.',
      403,
    )
  if (q.version !== a.version || q.group !== str(dot.content_group))
    return loi(
      'CAU_THAY_DOI',
      'Câu đã thay phiên bản. Không chấm bản cũ bằng đáp án mới.',
      409,
    )
  return null
}
function congKhai(id: string, a: AnhPhien, p: ProbeRef): ItemCongKhai {
  const nd = p.noiDungTrucTiep!,
    buoc = a.hocLieu.buoc[a.buoc]
  return {
    id,
    loai: a.pha,
    buocSo:
      buoc && !['ghep_bai', 'kiem_chung'].includes(a.pha) ? a.buoc : undefined,
    tieuDe: ['ghep_bai', 'kiem_chung'].includes(a.pha)
      ? a.pha === 'ghep_bai'
        ? 'Ghép lại cả bài'
        : 'Tự làm một bản mới'
      : (buoc?.tieuDe ?? ''),
    kieu: nd.kieu,
    hoi: nd.hoi,
    luaChon: nd.luaChon?.map((x) => ({ ky: x.ky, noi: x.noi })) ?? null,
    donVi: nd.donVi,
    ...(nd.bang ? { bang: nd.bang } : {}),
    ...(nd.y ? { y: nd.y } : {}),
    ...(nd.hinhAnh
      ? {
          hinhAnh: nd.hinhAnh.map((x) => ({
            src: x.src,
            alt: x.alt,
            viTri: x.viTri,
          })),
        }
      : {}),
  }
}
async function traPhien(
  env: Env,
  dot: Obj,
  ph: Obj | null,
  a: AnhPhien | null,
  item: Obj | null = null,
) {
  const docLoiThay = ![
    'dang_kiem_chung',
    'dang_ghep_bai',
    'cho_gap_lai_2',
  ].includes(str(dot.trang_thai_day))
  const thay = await env.DB.prepare(
    'SELECT loi_go,doc_luc FROM chua_loi_thay WHERE dot_id=? AND sbd=?',
  )
    .bind(dot.id, dot.sbd)
    .first<{ loi_go: string; doc_luc: number }>()
  if (docLoiThay && thay?.loi_go && !thay.doc_luc) {
    const now = Date.now()
    await env.DB.batch([
      env.DB.prepare(
        'UPDATE chua_loi_thay SET doc_luc=? WHERE dot_id=? AND doc_luc=0',
      ).bind(now, dot.id),
      env.DB.prepare(
        "UPDATE chua_loi_dot SET ho_tro_cuoi_luc=?,den_han=CASE WHEN trang_thai_day='cho_gap_lai_2' THEN ? ELSE den_han END,revision=revision+1 WHERE id=? AND changes()=1",
      ).bind(
        now,
        new Date(
          Math.max(
            Date.parse(str(dot.den_han)) || 0,
            now +
              Math.max(a?.cfg.kiemLaiSauGio ?? 24, a?.gioDocLoiGiai ?? 12) *
                3600000,
          ),
        ).toISOString(),
        dot.id,
      ),
    ])
    dot = (await docDot(env, str(dot.sbd), str(dot.id)))!
  }
  const daNop = item?.trang_thai === 'da_nop'
  const receipt = daNop
    ? await env.DB.prepare(
        'SELECT tra_loi,response_json FROM chua_loi_nop WHERE item_id=? AND sbd=?',
      )
        .bind(item?.id, dot.sbd)
        .first<{ tra_loi: string; response_json: string }>()
    : null
  const hien = item ? (JSON.parse(str(item.public_json)) as ItemCongKhai) : null
  return Response.json({
    ok: true,
    serverNow: new Date().toISOString(),
    dotId: dot.id,
    phienId: ph?.id,
    revision: num(dot.revision),
    trangThai: dot.trang_thai_day,
    lanGapLai: num(dot.lan_gap_lai),
    denHan: dot.den_han || undefined,
    lyDoThieu: dot.ly_do_thieu || undefined,
    tienDo: a
      ? tinhTienDo(a.hocLieu, a.tienDo)
      : { soBuocDaQua: 0, soBuocCanKiem: 0 },
    tienDoChiTiet:
      a?.tienDo.map((x) => ({
        buocId: x.buocId,
        tieuDe: x.tieuDe,
        trangThai: x.trangThai,
      })) ?? [],
    loiThay: docLoiThay ? thay?.loi_go || undefined : undefined,
    cauGoc: a?.cauGoc ?? null,
    item: hien ? { ...hien, mucHoTro: num(item?.muc_ho_tro_cao_nhat) } : null,
    traLoiDaNop: receipt?.tra_loi,
    phanHoiTruoc: receipt ? JSON.parse(receipt.response_json) : null,
    hanhDong: {
      coTheNop: !!item && !daNop,
      coTheXinGoiY: !!item && !daNop,
      coTheTiep: daNop,
    },
  })
}
export async function moDot(env: Env, b: Obj): Promise<Response> {
  const sbd = await quyen(env, b)
  if (sbd instanceof Response) return sbd
  return giaoDotCuaEm(env, sbd, str(b.qid))
}
export async function giaoDotCuaEm(
  env: Env,
  sbd: string,
  qidVao: string,
): Promise<Response> {
  const qid = qidChuan(qidVao)
  if (!qid || qid.length > 120)
    return loi('THIEU_THAM_SO', 'Thiếu câu cần chữa.')
  const dau = await docTrangThaiLoiDau(env, sbd, qid, ngayVn(Date.now()))
  if (!dau || ['dong', 'khong_loi'].includes(dau.loiHoc.trangThai))
    return loi('CHUA_CO_LOI', 'Câu này chưa có lỗi đang mở đã công bố.', 404)
  const cfg = await docCauHinh(env),
    h = await docHocLieu(env, qid),
    q = await cauDuoc(env, sbd, qid),
    now = Date.now()
  const cu = await env.DB.prepare(
    `SELECT * FROM chua_loi_dot WHERE sbd=? AND (qid_chuan=? OR (content_group<>'' AND content_group=?)) AND dong_luc IS NULL ORDER BY giao_luc ASC,id ASC LIMIT 1`,
  )
    .bind(sbd, qid, q?.group ?? '')
    .first<Obj>()
  if (cu && cu.qid_chuan !== qid)
    return giaoDotCuaEm(env, sbd, str(cu.qid_chuan))
  const id = cu
    ? str(cu.id)
    : 'cl-' + (await bam([sbd, q?.group || qid, dau.moLuc])).slice(0, 40)
  const tt = !q
    ? 'tam_khoa'
    : !h.duDung
      ? 'thieu_hoc_lieu'
      : h.hocLieu?.contentVersion !== q.version
        ? 'cau_thay_doi'
        : 'can_chan_doan'
  // Giao và chốt cửa sổ đo một lần; không kéo dài cửa sổ khi em quay lại hay sai tiếp.
  await env.DB.prepare(
    `INSERT OR IGNORE INTO chua_loi_dot(id,sbd,qid_chuan,content_group,cohort_id,nguon_sai,phien_ban_cau,mo_luc,sai_cuoi_luc,trang_thai_day,ly_do_thieu,policy_snapshot,giao_luc,chot_do_luc,tao_luc,cap_nhat_luc)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM chua_loi_dot WHERE sbd=? AND (qid_chuan=? OR (content_group<>'' AND content_group=?)) AND dong_luc IS NULL)`,
  )
    .bind(
      id,
      sbd,
      qid,
      q?.group ?? '',
      cfg.cohortId,
      dau.loiHoc.nguonSai,
      q?.version ?? '',
      dau.moLuc ?? now,
      dau.saiCuoiLuc ?? now,
      tt,
      h.lyDo,
      JSON.stringify(cfg),
      now,
      now + cfg.cuaSoDoNgay * 86400000,
      now,
      now,
      sbd,
      qid,
      q?.group ?? '',
    )
    .run()
  let dot = await docDot(env, sbd, id)
  if (!dot) {
    const winner = await env.DB.prepare(
      `SELECT qid_chuan FROM chua_loi_dot WHERE sbd=? AND (qid_chuan=? OR (content_group<>'' AND content_group=?)) AND dong_luc IS NULL ORDER BY giao_luc ASC,id ASC LIMIT 1`,
    )
      .bind(sbd, qid, q?.group ?? '')
      .first<{ qid_chuan: string }>()
    if (winner) return giaoDotCuaEm(env, sbd, winner.qid_chuan)
    return loi('LOI_MAY_CHU', 'Chưa lưu được đợt chữa.', 503)
  }
  // Học liệu được duyệt sau khi giao: mở lại đợt cũ, giữ mẫu số và cửa sổ đo.
  if (
    ['thieu_hoc_lieu', 'tam_khoa', 'cau_thay_doi'].includes(
      str(dot.trang_thai_day),
    ) &&
    q &&
    h.hocLieu?.contentVersion === q.version
  ) {
    await env.DB.prepare(
      `UPDATE chua_loi_dot SET trang_thai_day='can_chan_doan',content_group=?,phien_ban_cau=?,ly_do_thieu='',revision=revision+1,cap_nhat_luc=? WHERE id=? AND revision=? AND NOT EXISTS(SELECT 1 FROM chua_loi_phien WHERE dot_id=?)`,
    )
      .bind(q.group, q.version, now, id, num(dot.revision), id)
      .run()
    dot = (await docDot(env, sbd, id))!
  }
  return Response.json({
    ok: true,
    dotId: dot.id,
    trangThai: dot.trang_thai_day,
    coHocLieu: h.duDung,
    lyDoThieu: dot.ly_do_thieu,
    denHan: dot.den_han || undefined,
  })
}
export async function phatItem(env: Env, b: Obj): Promise<Response> {
  const sbd = await quyen(env, b)
  if (sbd instanceof Response) return sbd
  let dot = await docDot(env, sbd, str(b.dotId))
  if (!dot) return loi('KHONG_TIM_THAY', 'Không tìm thấy đợt chữa.', 404)
  let ph = await docPhien(env, sbd, str(dot.id)),
    a = ph ? docAnh(ph) : null
  if (a) {
    const cam = await kiemAnh(env, sbd, dot, a)
    if (cam) return cam
  }
  // Bổ sung bài mới là việc chuẩn bị học liệu chung; thầy không mở lại riêng từng em.
  if (
    a &&
    ph &&
    dot.trang_thai_day === 'thieu_hoc_lieu' &&
    ['het_cau_moi_sau_chua_lop', 'het_cau_moi_trong_phien'].includes(
      str(dot.ly_do_thieu),
    )
  ) {
    const h = await docHocLieu(env, str(dot.qid_chuan))
    const idBuoc = a.hocLieu.buoc[a.buoc]?.id
    const giuDuoc = a.tienDo
      .filter((t) => t.trangThai === 'co_bang_chung_hieu_trong_phien')
      .every(
        (t) =>
          JSON.stringify(a!.hocLieu.buoc.find((x) => x.id === t.buocId)) ===
          JSON.stringify(h.hocLieu?.buoc.find((x) => x.id === t.buocId)),
      )
    if (
      h.hocLieu?.contentVersion === a.version &&
      giuDuoc &&
      JSON.stringify(a.hocLieu.buoc.map((x) => x.id)) ===
        JSON.stringify(h.hocLieu.buoc.map((x) => x.id))
    ) {
      const moi = structuredClone(a)
      moi.hocLieu = h.hocLieu
      moi.buoc = idBuoc
        ? h.hocLieu.buoc.findIndex((x) => x.id === idBuoc)
        : h.hocLieu.buoc.length
      if (moi.buoc >= 0 && chonProbe(moi)) {
        const now = Date.now()
        await env.DB.batch([
          env.DB.prepare(
            "UPDATE chua_loi_dot SET trang_thai_day=?,ly_do_thieu='',revision=revision+1,cap_nhat_luc=? WHERE id=? AND revision=? AND trang_thai_day='thieu_hoc_lieu'",
          ).bind(
            moi.pha === 'kiem_chung'
              ? 'dang_kiem_chung'
              : moi.pha === 'ghep_bai'
                ? 'dang_ghep_bai'
                : 'dang_chua_buoc',
            now,
            dot.id,
            num(dot.revision),
          ),
          env.DB.prepare(
            'UPDATE chua_loi_phien SET snapshot_json=?,revision=revision+1,cap_nhat_luc=? WHERE id=? AND changes()=1',
          ).bind(JSON.stringify(moi), now, ph.id),
        ])
        dot = (await docDot(env, sbd, str(dot.id)))!
        ph = await docPhien(env, sbd, str(dot.id))
        a = ph ? docAnh(ph) : null
      }
    }
  }
  if (
    [
      'thieu_hoc_lieu',
      'tam_khoa',
      'cau_thay_doi',
      'can_thay',
      'da_tu_sua',
    ].includes(str(dot.trang_thai_day))
  )
    return traPhien(env, dot, ph, a)
  const now = Date.now()
  if (dot.trang_thai_day === 'cho_gap_lai_2') {
    const han = Date.parse(str(dot.den_han))
    if (!Number.isFinite(han) || now < han) return traPhien(env, dot, ph, a)
    if (!a)
      return loi(
        'THIEU_HOC_LIEU',
        'Phiên cũ chưa có ảnh chụp để kiểm lại.',
        409,
      )
    const lanMoi = Math.max(2, num(dot.lan_gap_lai) + 1)
    const id = crypto.randomUUID(),
      moi = structuredClone(a)
    moi.pha = 'kiem_chung'
    moi.phanHoi = null
    moi.batDauDoan = now
    moi.soChanDoan = 0
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE chua_loi_dot SET trang_thai_day='dang_kiem_chung',lan_gap_lai=?,revision=revision+1,cap_nhat_luc=? WHERE id=? AND revision=? AND trang_thai_day='cho_gap_lai_2'`,
      ).bind(lanMoi, now, dot.id, num(dot.revision)),
      env.DB.prepare(
        `INSERT INTO chua_loi_phien(id,dot_id,sbd,qid_chuan,lan_gap_lai,tien_do_json,snapshot_json,bat_dau_luc,policy_snapshot,tao_luc,cap_nhat_luc) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE changes()=1`,
      ).bind(
        id,
        dot.id,
        sbd,
        dot.qid_chuan,
        lanMoi,
        JSON.stringify(moi.tienDo),
        JSON.stringify(moi),
        now,
        JSON.stringify(moi.cfg),
        now,
        now,
      ),
    ])
    dot = (await docDot(env, sbd, str(dot.id)))!
    ph = await docPhien(env, sbd, str(dot.id))
    a = ph ? docAnh(ph) : null
  }
  if (!ph) {
    const q = await cauDuoc(env, sbd, str(dot.qid_chuan)),
      h = await docHocLieu(env, str(dot.qid_chuan))
    if (!q)
      return loi('CAU_BI_BAO_VE', 'Câu này hiện chưa được phép luyện.', 403)
    if (!h.hocLieu || h.hocLieu.contentVersion !== q.version)
      return loi(
        'THIEU_HOC_LIEU',
        'Chưa có học liệu đã duyệt đúng phiên bản.',
        409,
      )
    const cfg = chuanCauHinh(JSON.parse(str(dot.policy_snapshot))),
      id = crypto.randomUUID()
    a = anhMoi(
      h.hocLieu,
      { phan: q.phan, text: q.text, table: q.table },
      q.version,
      cfg,
      now,
    )
    a.gioDocLoiGiai = (await docLuatChua(env, sbd)).gioDocLoiGiai
    const ck = cauCongKhai(q)
    a.cauGoc = ck
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE chua_loi_dot SET lan_gap_lai=1,revision=revision+1,cap_nhat_luc=? WHERE id=? AND revision=? AND NOT EXISTS(SELECT 1 FROM chua_loi_phien WHERE dot_id=?)`,
      ).bind(now, dot.id, num(dot.revision), dot.id),
      env.DB.prepare(
        `INSERT INTO chua_loi_phien(id,dot_id,sbd,qid_chuan,lan_gap_lai,tien_do_json,snapshot_json,bat_dau_luc,policy_snapshot,tao_luc,cap_nhat_luc) SELECT ?,?,?,?,1,?,?,?,?,?,? WHERE changes()=1`,
      ).bind(
        id,
        dot.id,
        sbd,
        dot.qid_chuan,
        JSON.stringify(a.tienDo),
        JSON.stringify(a),
        now,
        JSON.stringify(a.cfg),
        now,
        now,
      ),
    ])
    dot = (await docDot(env, sbd, str(dot.id)))!
    ph = await docPhien(env, sbd, str(dot.id))
    a = ph ? docAnh(ph) : null
  }
  if (!ph || !a)
    return loi(
      'PHIEN_CU',
      'Phiên chưa có ảnh chụp hợp lệ. Thầy cần kiểm tra học liệu.',
      409,
    )
  const hien = await env.DB.prepare(
    'SELECT * FROM chua_loi_item WHERE id=? AND sbd=?',
  )
    .bind(ph.item_hien_tai ?? '', sbd)
    .first<Obj>()
  if (hien && (hien.trang_thai === 'chua_nop' || b.tiep !== true))
    return traPhien(env, dot, ph, a, hien)
  const het =
    a.soChanDoan >= a.cfg.chanDoanToiDa ||
    now - a.batDauDoan >= a.cfg.phutToiDaMotLuot * 60000
  if (het && b.tiepDoan !== true)
    return Response.json({
      ok: true,
      dotId: dot.id,
      trangThai: dot.trang_thai_day,
      canNghi: true,
      tienDo: tinhTienDo(a.hocLieu, a.tienDo),
      mo: 'Em có thể nghỉ ở đây. Những bước đã hiểu đã được lưu.',
    })
  if (het) {
    a.soChanDoan = 0
    a.batDauDoan = now
  }
  const p = chonProbe(a)
  if (!p) {
    await env.DB.prepare(
      "UPDATE chua_loi_dot SET trang_thai_day='thieu_hoc_lieu',ly_do_thieu='het_cau_moi_trong_phien',revision=revision+1,cap_nhat_luc=? WHERE id=? AND revision=?",
    )
      .bind(now, dot.id, num(dot.revision))
      .run()
    dot = (await docDot(env, sbd, str(dot.id)))!
    return traPhien(env, dot, ph, a)
  }
  const id = crypto.randomUUID(),
    pub = congKhai(id, a, p),
    stt = a.soItem
  a.soItem++
  a.daDung.push(dauNoiDung(p))
  a.phanHoi = null
  await env.DB.batch([
    env.DB.prepare(
      'UPDATE chua_loi_dot SET revision=revision+1,cap_nhat_luc=? WHERE id=? AND sbd=? AND revision=?',
    ).bind(now, dot.id, sbd, num(dot.revision)),
    env.DB.prepare(
      `INSERT INTO chua_loi_item(id,phien_id,dot_id,sbd,thu_tu,loai,buoc_so,buoc_id,probe_ref,public_json,tieu_de,phat_luc,tao_luc,cap_nhat_luc) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE changes()=1`,
    ).bind(
      id,
      ph.id,
      dot.id,
      sbd,
      stt,
      a.pha,
      pub.buocSo ?? null,
      a.hocLieu.buoc[a.buoc]?.id ?? '',
      JSON.stringify(p),
      JSON.stringify(pub),
      pub.tieuDe,
      now,
      now,
      now,
    ),
    env.DB.prepare(
      `UPDATE chua_loi_phien SET snapshot_json=?,tien_do_json=?,item_hien_tai=?,revision=revision+1,cap_nhat_luc=? WHERE id=? AND EXISTS(SELECT 1 FROM chua_loi_item WHERE id=?)`,
    ).bind(JSON.stringify(a), JSON.stringify(a.tienDo), id, now, ph.id, id),
  ])
  dot = (await docDot(env, sbd, str(dot.id)))!
  ph = await docPhien(env, sbd, str(dot.id))
  a = ph ? docAnh(ph) : null
  const it = await env.DB.prepare(
    'SELECT * FROM chua_loi_item WHERE id=? AND sbd=?',
  )
    .bind(ph?.item_hien_tai ?? '', sbd)
    .first<Obj>()
  return traPhien(env, dot, ph, a, it)
}
export async function nopItem(env: Env, b: Obj): Promise<Response> {
  const sbd = await quyen(env, b)
  if (sbd instanceof Response) return sbd
  const dotId = str(b.dotId),
    itemId = str(b.itemId),
    attempt = str(b.attemptId),
    tra = str(b.traLoi).trim()
  if (
    !dotId ||
    !itemId ||
    !attempt ||
    attempt.length > 120 ||
    !tra ||
    tra.length > 1000
  )
    return loi('THIEU_THAM_SO', 'Cần câu trả lời và mã lần nộp hợp lệ.')
  const hash = await bam([dotId, itemId, tra])
  const cu = await env.DB.prepare(
    'SELECT request_hash,response_json FROM chua_loi_nop WHERE sbd=? AND attempt_id=?',
  )
    .bind(sbd, attempt)
    .first<Obj>()
  if (cu)
    return cu.request_hash === hash
      ? Response.json({
          ...JSON.parse(str(cu.response_json)),
          idempotent: true,
        })
      : loi(
          'XUNG_DOT_ATTEMPT',
          'Mã nộp cũ gắn với câu trả lời khác. Kết quả đầu tiên đã được giữ.',
          409,
        )
  const dot = await docDot(env, sbd, dotId),
    ph = await docPhien(env, sbd, dotId)
  const item = await env.DB.prepare(
    'SELECT * FROM chua_loi_item WHERE id=? AND sbd=? AND dot_id=?',
  )
    .bind(itemId, sbd, dotId)
    .first<Obj>()
  if (
    !dot ||
    !ph ||
    !item ||
    item.phien_id !== ph.id ||
    item.id !== ph.item_hien_tai ||
    (b.phienId && b.phienId !== ph.id)
  )
    return loi(
      'XUNG_DOT_PHIEN',
      'Câu này thuộc phiên khác. Em tải lại tiến độ.',
      409,
    )
  if (item.trang_thai !== 'chua_nop')
    return loi('DA_NOP', 'Câu đã khoá lần nộp đầu tiên.', 409)
  const a = docAnh(ph)
  if (!a) return loi('PHIEN_CU', 'Thiếu ảnh chụp học liệu.', 409)
  const cam = await kiemAnh(env, sbd, dot, a)
  if (cam) return cam
  const p = JSON.parse(str(item.probe_ref)) as ProbeRef
  if (
    (p.noiDungTrucTiep?.kieu === 'so' && !khopPhanIII(tra, tra)) ||
    (p.noiDungTrucTiep?.kieu === 'ds' &&
      p.noiDungTrucTiep.y?.length === 4 &&
      !/^[DS]{4}$/i.test(tra))
  )
    return loi(
      'CAU_TRA_LOI_CHUA_HOP_LE',
      'Em nhập đủ một số hoặc chọn đủ bốn ý trước khi kiểm tra nhé.',
      422,
    )
  const dung = chamProbe(p, tra),
    now = Date.now(),
    id = crypto.randomUUID()
  const doc = await env.DB.prepare(
    `SELECT MAX(luc) AS luc FROM loi_giai_hoi WHERE sbd=? AND co_ho_so=1 AND (qid=? OR qid IN (SELECT qid FROM game_v2_question WHERE content_group=?))`,
  )
    .bind(sbd, dot.qid_chuan, dot.content_group)
    .first<{ luc: string | null }>()
  const coTro =
    num(item.co_ho_tro) > 0 ||
    item.loai === 'ghep_bai' ||
    now - Math.max(num(dot.ho_tro_cuoi_luc), Date.parse(doc?.luc ?? '') || 0) <
      (a.gioDocLoiGiai ?? 12) * 3600000
  const ket = nhanSauNop(
      a,
      p,
      tra,
      itemId,
      id,
      dung,
      ['ghep_bai', 'kiem_chung'].includes(str(item.loai))
        ? coTro
        : num(item.co_ho_tro) > 0,
    ),
    muc = num(item.muc_ho_tro_cao_nhat)
  const td = ket.anh.tienDo[num(item.buoc_so)]
  if (td) td.mucHoTroCaoNhat = Math.max(td.mucHoTroCaoNhat, muc)
  const denHan =
    ket.trangThai === 'cho_gap_lai_2'
      ? new Date(
          now + Math.max(a.cfg.kiemLaiSauGio, a.gioDocLoiGiai ?? 12) * 3600000,
        ).toISOString()
      : str(dot.den_han)
  const gap2 = item.loai === 'kiem_chung' && num(ph.lan_gap_lai) === 2
  const result = {
    ok: true,
    ...ket.phanHoi,
    trangThaiMoi: ket.trangThai,
    receiptId: id,
    denHan: denHan || undefined,
  }
  const bang = {
    maLoi: td?.maLoiDaXacNhan,
    mucKetLuan: td?.maLoiDaXacNhan ? 'co_bang_chung' : 'chua_xac_dinh',
    banTuongDuongDaKiem: p.laTuongDuong,
    receiptIds: [
      td?.receiptChanDoan,
      td?.receiptLyDo,
      td?.receiptChuyenGiao,
    ].filter(Boolean),
  }
  const giay = Math.min(
    1800,
    Math.max(0, Math.floor((now - num(item.phat_luc)) / 1000)),
  )
  const cong = 'EXISTS(SELECT 1 FROM chua_loi_nop WHERE id=?)'
  const events = lenhGhiSuKienNguyenTu(
    env,
    [
      {
        nguon: 'chua_loi',
        maNguon: str(ph.id),
        sbd,
        qid: ['ghep_bai', 'kiem_chung'].includes(str(item.loai))
          ? p.qid
          : str(dot.qid_chuan),
        lan: a.soItem,
        ketQua: dung ? 1 : 0,
        luc: new Date(now).toISOString(),
        giay,
        attemptId: itemId,
        assistance: coTro ? 'assisted' : 'none',
        visibility: 'released',
        purpose: ['ghep_bai', 'kiem_chung'].includes(str(item.loai))
          ? 'repair'
          : 'chua_buoc',
        raw: {
          traLoi: tra,
          ...(['ghep_bai', 'kiem_chung'].includes(str(item.loai))
            ? { tc: dot.qid_chuan }
            : {}),
          chua: {
            dotId,
            phienId: ph.id,
            itemId,
            loai: item.loai,
            mucHoTro: muc,
            version: a.version,
            lanGapLai: ph.lan_gap_lai,
            banTuongDuongDaKiem: p.laTuongDuong,
            probeId: p.qid,
          },
        },
      },
    ],
    { sql: cong, params: [id] },
  )
  try {
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE chua_loi_dot SET revision=revision+1,cap_nhat_luc=? WHERE id=? AND sbd=? AND revision=? AND NOT EXISTS(SELECT 1 FROM chua_loi_nop WHERE sbd=? AND (attempt_id=? OR item_id=?))`,
      ).bind(now, dotId, sbd, num(dot.revision), sbd, attempt, itemId),
      env.DB.prepare(
        `INSERT INTO chua_loi_nop(id,attempt_id,item_id,phien_id,dot_id,sbd,tra_loi,dung,giay,co_ho_tro,muc_ho_tro,bang_chung_json,response_json,nop_luc,server_luc,request_hash) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE changes()=1`,
      ).bind(
        id,
        attempt,
        itemId,
        ph.id,
        dotId,
        sbd,
        tra,
        dung ? 1 : 0,
        giay,
        coTro ? 1 : 0,
        muc,
        JSON.stringify(bang),
        JSON.stringify(result),
        now,
        now,
        hash,
      ),
      env.DB.prepare(
        `UPDATE chua_loi_item SET trang_thai='da_nop',cap_nhat_luc=? WHERE id=? AND ${cong}`,
      ).bind(now, itemId, id),
      env.DB.prepare(
        `UPDATE chua_loi_phien SET snapshot_json=?,tien_do_json=?,revision=revision+1,cap_nhat_luc=? WHERE id=? AND ${cong}`,
      ).bind(
        JSON.stringify(ket.anh),
        JSON.stringify(ket.anh.tienDo),
        now,
        ph.id,
        id,
      ),
      env.DB.prepare(
        `UPDATE chua_loi_dot SET trang_thai_day=?,den_han=?,ho_tro_cuoi_luc=CASE WHEN ?=1 THEN ? ELSE ho_tro_cuoi_luc END,ket_qua_gap2=CASE WHEN ?=1 AND ket_qua_gap2='' THEN ? ELSE ket_qua_gap2 END,receipt_gap2=CASE WHEN ?=1 AND receipt_gap2='' THEN ? ELSE receipt_gap2 END WHERE id=? AND ${cong}`,
      ).bind(
        ket.trangThai,
        denHan,
        !dung || coTro ? 1 : 0,
        now,
        gap2 ? 1 : 0,
        dung && !coTro ? 'dung_tu_lam' : 'chua_dat',
        gap2 ? 1 : 0,
        id,
        dotId,
        id,
      ),
      events,
      ...(ket.canThay
        ? [
            env.DB.prepare(
              `INSERT INTO chua_loi_thay(dot_id,sbd,qid,bang_chung_json,gui_luc) SELECT ?,?,?,?,? WHERE ${cong} ON CONFLICT(dot_id) DO UPDATE SET trang_thai='cho_thay',bang_chung_json=excluded.bang_chung_json,gui_luc=excluded.gui_luc,loi_go='',doc_luc=0`,
            ).bind(
              dotId,
              sbd,
              dot.qid_chuan,
              JSON.stringify({
                tienDo: ket.anh.tienDo,
                receipt: id,
                phanHoi: ket.phanHoi,
              }),
              now,
              id,
            ),
          ]
        : []),
    ])
  } catch {
    return loi(
      'CHO_GHI_SO',
      'Chưa lưu được kết quả. Em giữ câu trả lời và thử nộp lại.',
      503,
    )
  }
  const receipt = await env.DB.prepare(
    'SELECT request_hash,response_json FROM chua_loi_nop WHERE sbd=? AND attempt_id=?',
  )
    .bind(sbd, attempt)
    .first<Obj>()
  if (!receipt)
    return loi(
      'XUNG_DOT_PHIEN',
      'Tiến độ vừa đổi ở thiết bị khác. Em tải lại trước khi nộp.',
      409,
    )
  if (receipt.request_hash !== hash)
    return loi('XUNG_DOT_ATTEMPT', 'Kết quả đầu đã được giữ.', 409)
  emCoGhi(sbd)
  return Response.json(JSON.parse(str(receipt.response_json)))
}
export async function xinGoiY(env: Env, b: Obj): Promise<Response> {
  const sbd = await quyen(env, b)
  if (sbd instanceof Response) return sbd
  const dot = await docDot(env, sbd, str(b.dotId)),
    ph = await docPhien(env, sbd, str(b.dotId))
  const item = await env.DB.prepare(
    'SELECT * FROM chua_loi_item WHERE id=? AND sbd=? AND dot_id=?',
  )
    .bind(str(b.itemId), sbd, str(b.dotId))
    .first<Obj>()
  if (
    !dot ||
    !ph ||
    !item ||
    ph.item_hien_tai !== item.id ||
    item.phien_id !== ph.id ||
    item.trang_thai !== 'chua_nop'
  )
    return loi('XUNG_DOT_PHIEN', 'Câu đã đổi hoặc đã nộp.', 409)
  const a = docAnh(ph)
  if (!a) return loi('PHIEN_CU', 'Thiếu ảnh chụp học liệu.', 409)
  const cam = await kiemAnh(env, sbd, dot, a)
  if (cam) return cam
  const muc = Math.min(3, Math.max(1, Math.floor(num(b.mucHoTro) || 1))),
    buoc = a.hocLieu.buoc[num(item.buoc_so)],
    g = buoc?.hoTro.find((x) => x.muc === muc)
  if (!g || item.loai === 'kiem_chung' || item.loai === 'ghep_bai')
    return loi(
      'KHONG_CO_GOI_Y',
      'Bài tổng hợp dùng để tự kiểm. Em nộp cách mình nghĩ; chỗ còn mắc sẽ được xếp vào buổi chữa trên lớp.',
      409,
    )
  if (muc > num(item.muc_ho_tro_cao_nhat) + 1)
    return loi(
      'GOI_Y_KHONG_DUNG_THU_TU',
      'Em thử gợi mở trước rồi mới mở mức tiếp.',
      409,
    )
  if (muc <= num(item.muc_ho_tro_cao_nhat))
    return Response.json({
      ok: true,
      mucHoTro: muc,
      noiDungGoiY: g.noiDung,
      idempotent: true,
    })
  const now = Date.now()
  const r = await env.DB.batch([
    env.DB.prepare(
      `UPDATE chua_loi_dot SET ho_tro_cuoi_luc=?,revision=revision+1,cap_nhat_luc=? WHERE id=? AND revision=?`,
    ).bind(now, now, dot.id, num(dot.revision)),
    env.DB.prepare(
      `UPDATE chua_loi_item SET co_ho_tro=1,muc_ho_tro_cao_nhat=?,lo_luc=?,cap_nhat_luc=? WHERE id=? AND trang_thai='chua_nop' AND changes()=1`,
    ).bind(muc, now, now, item.id),
  ])
  if (!r[1]?.meta.changes)
    return loi(
      'XUNG_DOT_PHIEN',
      'Tiến độ vừa đổi. Em tải lại để xem gợi ý.',
      409,
    )
  return Response.json({ ok: true, mucHoTro: muc, noiDungGoiY: g.noiDung })
}
export async function tienDo(env: Env, b: Obj): Promise<Response> {
  const sbd = await quyen(env, b)
  if (sbd instanceof Response) return sbd
  const dot = await docDot(env, sbd, str(b.dotId))
  if (!dot) return loi('KHONG_TIM_THAY', 'Không tìm thấy đợt.', 404)
  const ph = await docPhien(env, sbd, str(dot.id)),
    a = ph ? docAnh(ph) : null
  if (a) {
    const cam = await kiemAnh(env, sbd, dot, a)
    if (cam) return cam
  }
  return traPhien(env, dot, ph, a)
}
export async function thongKeKpi(env: Env, b: Obj): Promise<Response> {
  const cfg = await docCauHinh(env),
    cohortId = str(b.cohortId) || cfg.cohortId,
    now = Date.now()
  const r = await env.DB.prepare(
    `SELECT COUNT(*) AS giao,COUNT(DISTINCT sbd) AS soHs,
    SUM(CASE WHEN chot_do_luc>0 AND chot_do_luc<=? THEN 1 ELSE 0 END) AS mauSo,
    SUM(CASE WHEN chot_do_luc>0 AND chot_do_luc<=? AND ket_qua_gap2='dung_tu_lam' AND EXISTS(SELECT 1 FROM chua_loi_nop n JOIN chua_loi_item i ON i.id=n.item_id JOIN chua_loi_phien p ON p.id=n.phien_id WHERE n.id=receipt_gap2 AND n.nop_luc<=chot_do_luc AND n.dung=1 AND n.co_ho_tro=0 AND i.loai='kiem_chung' AND p.lan_gap_lai=2 AND n.pending=0) THEN 1 ELSE 0 END) AS tuSo,
    SUM(CASE WHEN trang_thai_day='thieu_hoc_lieu' AND ly_do_thieu<>'can_kiem_hoc_lieu' THEN 1 ELSE 0 END) AS thieuHocLieu,
    SUM(CASE WHEN trang_thai_day='thieu_hoc_lieu' AND ly_do_thieu='can_kiem_hoc_lieu' THEN 1 ELSE 0 END) AS choKiemHocLieu,
    SUM(CASE WHEN trang_thai_day='can_thay' THEN 1 ELSE 0 END) AS canThay
    FROM chua_loi_dot WHERE cohort_id=?`,
  )
    .bind(now, now, cohortId)
    .first<{
      giao: number
      soHs: number
      mauSo: number
      tuSo: number
      thieuHocLieu: number
      choKiemHocLieu: number
      canThay: number
    }>()
  const mauSo = num(r?.mauSo),
    tuSo = num(r?.tuSo),
    kpi = mauSo ? Math.round((tuSo / mauSo) * 1000) / 10 : null
  return Response.json({
    ok: true,
    cohortId,
    ...r,
    thieuHocLieu: num(r?.thieuHocLieu),
    choKiemHocLieu: num(r?.choKiemHocLieu),
    canThay: num(r?.canThay),
    mauSo,
    tuSo,
    kpiPhanTram: kpi,
    mucTieu: 90,
    datMucTieu: kpi !== null && kpi >= 90,
    duQuyMoPilot: num(r?.soHs) >= 30 && mauSo >= 300,
    choTruongThanh: num(r?.giao) - mauSo,
    cuaSoDoNgay: cfg.cuaSoDoNgay,
    canhBao:
      'Mẫu số gồm mọi đợt đã giao đủ cửa sổ đo, kể cả bỏ dở, thiếu học liệu và cần thầy. Kết quả lần kiểm đầu tiên không thay đổi khi em thử tiếp.',
  })
}

export async function guiThay(env: Env, b: Obj): Promise<Response> {
  const sbd = await quyen(env, b)
  if (sbd instanceof Response) return sbd
  const dot = await docDot(env, sbd, str(b.dotId))
  if (!dot) return loi('KHONG_TIM_THAY', 'Không tìm thấy đợt.', 404)
  if (dot.trang_thai_day !== 'can_thay')
    return loi(
      'CHUA_DEN_BUOC_CUOI',
      'Em tiếp tục tự gỡ bước đang học. Chỗ còn mắc sau vòng tự chữa mới được xếp vào buổi chữa trên lớp.',
      409,
    )
  const ph = await docPhien(env, sbd, str(dot.id)),
    a = ph ? docAnh(ph) : null,
    now = Date.now()
  await env.DB.prepare(
    `INSERT OR IGNORE INTO chua_loi_thay(dot_id,sbd,qid,bang_chung_json,gui_luc) VALUES(?,?,?,?,?)`,
  )
    .bind(
      dot.id,
      sbd,
      dot.qid_chuan,
      JSON.stringify({
        tienDo: a?.tienDo ?? [],
        phanHoi: a?.phanHoi,
        phienId: ph?.id,
        lyDoThieu: dot.ly_do_thieu,
      }),
      now,
    )
    .run()
  return Response.json({ ok: true, daLuu: true })
}
export async function danhSach(env: Env, b: Obj): Promise<Response> {
  const sbd = await quyen(env, b)
  if (sbd instanceof Response) return sbd
  const rows = await env.DB.prepare(
    `SELECT id AS dotId,qid_chuan AS qid,trang_thai_day AS trangThai,lan_gap_lai AS lanGapLai,den_han AS denHan FROM chua_loi_dot WHERE sbd=? ORDER BY CASE WHEN trang_thai_day='cho_gap_lai_2' AND den_han<=? THEN 0 WHEN trang_thai_day='da_tu_sua' THEN 2 ELSE 1 END,giao_luc DESC LIMIT 100`,
  )
    .bind(sbd, new Date().toISOString())
    .all()
  return Response.json({ ok: true, ds: rows.results ?? [] })
}
