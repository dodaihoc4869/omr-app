// Học liệu chỉ chạy sau kiểm cấu trúc và duyệt chuyên môn; không dùng đáp án kho sống để chấm phiên cũ.
import type { Env } from './kieu'
import type { HocLieuChua, ProbeRef } from './chua-cau-sai-kieu'
import { dauNoiDung, chamProbe } from './chua-cau-sai-phien'
export interface KetQuaKiemHocLieu {
  duDung: boolean
  lyDo: string
  hocLieu: HocLieuChua | null
}
export function tatCaProbe(h: HocLieuChua): ProbeRef[] {
  return [
    ...h.buoc.flatMap((b) => [
      ...b.chanDoan,
      ...b.phanBiet,
      ...b.kiemLai,
      ...(b.hieuBuoc?.kiemLyDo ?? []),
      ...(b.hieuBuoc?.chuyenGiao ?? []),
      ...(b.hieuBuoc?.doiChieu.map((d) => d.probeXacNhan) ?? []),
    ]),
    ...h.banGhepBai,
    ...h.banKiemChung,
  ]
}
export function kiemTinhDayDu(v: unknown): string[] {
  const loi: string[] = [],
    h = v as HocLieuChua
  const chu = (x: unknown): x is string =>
    typeof x === 'string' && !!x.trim() && x.length <= 20000
  const mangChu = (x: unknown): x is string[] =>
    Array.isArray(x) && x.length <= 80 && x.every(chu)
  const mang = (x: unknown): x is unknown[] =>
    Array.isArray(x) && x.length <= 40
  // Cổng JSON ngoài cùng: dữ liệu nhập tay/máy soạn sai kiểu phải trả 422, không làm hỏng phiên học.
  if (
    !h ||
    h.schemaVersion !== 1 ||
    !chu(h.qidGoc) ||
    h.qidGoc.length > 120 ||
    !chu(h.contentVersion) ||
    !Array.isArray(h.buoc) ||
    h.buoc.length < 1 ||
    h.buoc.length > 8 ||
    !mang(h.banGhepBai) ||
    !mang(h.banKiemChung)
  )
    return ['hoc_lieu_sai_cau_truc']
  for (const b of h.buoc) {
    if (
      !b ||
      !chu(b.id) ||
      !chu(b.tieuDe) ||
      !mangChu(b.tienQuyet) ||
      !mangChu(b.viKyNang) ||
      ![b.chanDoan, b.phanBiet, b.kiemLai, b.hoTro, b.loiThuongGap].every(mang)
    )
      return ['buoc_sai_cau_truc']
    if (!b.hoTro.every((x) => x && [1, 2, 3].includes(x.muc) && chu(x.noiDung)))
      return ['ho_tro_sai_cau_truc']
    const hb = b.hieuBuoc
    if (
      hb &&
      (!mang(hb.doiChieu) ||
        !mang(hb.kiemLyDo) ||
        !mang(hb.chuyenGiao) ||
        !hb.doiChieu.every((d) => d && d.probeXacNhan))
    )
      return ['hieu_buoc_sai_cau_truc']
  }
  const ids = new Set<string>()
  const day = (x: unknown): x is unknown[] => Array.isArray(x) && x.length > 0
  for (const [i, b] of h.buoc.entries()) {
    if (
      !b ||
      !b.id ||
      ids.has(b.id) ||
      b.thuTu !== i ||
      !Array.isArray(b.tienQuyet) ||
      b.tienQuyet.some((x) => !ids.has(x))
    )
      loi.push(`buoc_${i}_thu_tu_tien_quyet`)
    ids.add(b?.id)
    if (
      !day(b?.viKyNang) ||
      !day(b?.chanDoan) ||
      !day(b?.kiemLai) ||
      !Array.isArray(b?.phanBiet) ||
      !Array.isArray(b?.loiThuongGap)
    )
      loi.push(`buoc_${i}_thieu_probe`)
    const hb = b?.hieuBuoc
    if (
      !hb ||
      ![
        hb.mucTieu,
        hb.yNghiaDaiLuong,
        hb.viSaoCanBuoc,
        hb.dieuKienApDung,
        hb.noiVoiBuocSau,
      ].every((x) => typeof x === 'string' && x.trim()) ||
      !Array.isArray(hb.doiChieu) ||
      !day(hb.kiemLyDo) ||
      !day(hb.chuyenGiao)
    )
      loi.push(`buoc_${i}_thieu_hieu_buoc`)
    if (
      (hb?.kiemLyDo?.length ?? 0) < 2 ||
      (hb?.chuyenGiao?.length ?? 0) < 2 ||
      (b?.kiemLai?.length ?? 0) < 2
    )
      loi.push(`buoc_${i}_thieu_ban_moi_de_thu_lai`)
    if (
      ![1, 2, 3].every((m) =>
        b?.hoTro?.some((x) => x.muc === m && x.noiDung.trim()),
      )
    )
      loi.push(`buoc_${i}_thieu_ho_tro`)
    if (!day(b?.phanBiet) && !hb?.doiChieu?.length)
      loi.push(`buoc_${i}_thieu_phan_biet`)
  }
  if (h.banGhepBai.length < 2 || h.banKiemChung.length < 2)
    loi.push('thieu_ban_toan_bai')
  if (loi.length) return loi
  const refs = new Map<string, string>()
  for (const p of tatCaProbe(h)) {
    if (
      !p ||
      !chu(p.qid) ||
      p.qid.length > 120 ||
      !chu(p.phienBan) ||
      !mangChu(p.kyNang) ||
      !p.kyNang.length ||
      !['I', 'II', 'III'].includes(p.phan) ||
      (p.dapAnSai !== undefined && !mangChu(p.dapAnSai))
    ) {
      loi.push('probe_sai_cau_truc')
      continue
    }
    const n = p.noiDungTrucTiep
    if (
      !n ||
      !chu(n.hoi) ||
      !chu(n.dapAn) ||
      !['so', 'chon', 'chon_ly_do', 'ds'].includes(n.kieu)
    ) {
      loi.push(`probe_${p.qid}_chua_co_noi_dung_cham`)
      continue
    }
    if (n.kieu === 'chon' || n.kieu === 'chon_ly_do') {
      if (
        !Array.isArray(n.luaChon) ||
        n.luaChon.length < 2 ||
        n.luaChon.length > 6 ||
        !n.luaChon.every(
          (x) => x && chu(x.ky) && /^[A-F]$/.test(x.ky) && chu(x.noi),
        ) ||
        new Set(n.luaChon.map((x) => x?.ky)).size !== n.luaChon.length ||
        !n.luaChon.some((x) => x?.ky === n.dapAn.toUpperCase())
      )
        loi.push(`probe_${p.qid}_lua_chon`)
    }
    if (
      (n.y !== undefined && !mangChu(n.y)) ||
      (n.bang !== undefined &&
        (!Array.isArray(n.bang) ||
          n.bang.length > 100 ||
          !n.bang.every((r) => mangChu(r))))
    )
      loi.push(`probe_${p.qid}_media_sai_cau_truc`)
    if (
      n.hinhAnh !== undefined &&
      (!Array.isArray(n.hinhAnh) ||
        n.hinhAnh.length > 8 ||
        !n.hinhAnh.every(
          (x) =>
            x &&
            chu(x.alt) &&
            chu(x.src) &&
            /^(https:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp);base64,)/.test(
              x.src,
            ) &&
            x.viTri !== 'sau_loi_giai',
        ))
    )
      loi.push(`probe_${p.qid}_hinh_sai_cau_truc`)
    if (n.kieu === 'ds' && !/^[DS]{1}$|^[DS]{4}$/i.test(n.dapAn))
      loi.push(`probe_${p.qid}_ds`)
    if (n.kieu === 'ds' && n.dapAn.length === 4 && n.y?.length !== 4)
      loi.push(`probe_${p.qid}_thieu_4_y`)
    if (n.kieu === 'ds' && n.dapAn.length === 1 && n.y?.length)
      loi.push(`probe_${p.qid}_ds_mau_thuan`)
    if (!chamProbe(p, n.dapAn))
      loi.push(`probe_${p.qid}_dap_an_khong_cham_duoc`)
    const key = `${p.qid}@${p.phienBan}`,
      noi = JSON.stringify(n)
    if (refs.has(key) && refs.get(key) !== noi)
      loi.push(`probe_${p.qid}_ref_mau_thuan`)
    refs.set(key, noi)
  }
  if (loi.length) return [...new Set(loi)]
  const cauNho = h.buoc.flatMap((b) => [
    ...b.chanDoan,
    ...b.phanBiet,
    ...b.kiemLai,
    ...b.hieuBuoc!.kiemLyDo,
    ...b.hieuBuoc!.chuyenGiao,
    ...b.hieuBuoc!.doiChieu.map((x) => x.probeXacNhan),
  ])
  const nho = new Set(cauNho.map(dauNoiDung)),
    ghep = new Set(h.banGhepBai.map(dauNoiDung))
  const kyNang = [...new Set(h.buoc.flatMap((b) => b.viKyNang))]
  for (const p of [...h.banGhepBai, ...h.banKiemChung]) {
    if (
      !p.laTuongDuong ||
      kyNang.some((k) => !p.kyNang.includes(k)) ||
      nho.has(dauNoiDung(p))
    )
      loi.push('ban_toan_bai_chua_tuong_duong')
  }
  if (h.banKiemChung.some((p) => ghep.has(dauNoiDung(p))))
    loi.push('ban_kiem_trung_ban_ghep')
  for (const b of h.buoc) {
    if (
      b.hieuBuoc!.kiemLyDo.some((p) => p.noiDungTrucTiep?.kieu !== 'chon_ly_do')
    )
      loi.push(`buoc_${b.id}_ly_do_chua_kiem_cach_hieu`)
    const truoc = new Set(
      [
        ...b.chanDoan,
        ...b.phanBiet,
        ...b.kiemLai,
        ...b.hieuBuoc!.doiChieu.map((d) => d.probeXacNhan),
      ].map(dauNoiDung),
    )
    if (b.hieuBuoc!.chuyenGiao.some((p) => truoc.has(dauNoiDung(p))))
      loi.push(`buoc_${b.id}_chuyen_giao_khong_moi`)
    for (const d of b.hieuBuoc!.doiChieu)
      if (
        !d.probeXacNhan.dapAnSai?.length ||
        ![d.maLoi, d.cachNghiCu, d.diemLech, d.heQua, d.cachDung].every(
          (x) => typeof x === 'string' && x.trim(),
        )
      )
        loi.push(`buoc_${b.id}_gia_thuyet_chua_kiem`)
  }
  return [...new Set(loi)]
}
export async function docHocLieu(
  env: Env,
  qid: string,
): Promise<KetQuaKiemHocLieu> {
  const row = await env.DB.prepare(
    `SELECT hoc_lieu_json,nguoi_duyet,phien_ban_duyet FROM chua_loi_hoc_lieu WHERE qid_chuan=? AND trang_thai='du_dung' ORDER BY kiem_tra_luc DESC LIMIT 1`,
  )
    .bind(qid)
    .first<{
      hoc_lieu_json: string
      nguoi_duyet: string
      phien_ban_duyet: string
    }>()
  if (!row) return { duDung: false, lyDo: 'chua_co_hoc_lieu', hocLieu: null }
  let h: HocLieuChua
  try {
    h = JSON.parse(row.hoc_lieu_json)
  } catch {
    return { duDung: false, lyDo: 'hoc_lieu_hong', hocLieu: null }
  }
  const loi = kiemTinhDayDu(h)
  if (!row.nguoi_duyet || !row.phien_ban_duyet)
    loi.push('chua_duyet_chuyen_mon')
  if (h?.qidGoc !== qid) loi.push('sai_cau_goc')
  return loi.length
    ? { duDung: false, lyDo: loi.join(', '), hocLieu: null }
    : { duDung: true, lyDo: '', hocLieu: h }
}
export function timBuocVuong(h: HocLieuChua, da: Set<number>): number {
  return h.buoc.findIndex((_, i) => !da.has(i))
}
