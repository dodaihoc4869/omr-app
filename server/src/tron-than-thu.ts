/**
 * TRỘN HAI BẢN HỒ SƠ THẦN THÚ TRÊN MÁY CHỦ.
 *
 * Tách riêng khỏi `goi-cu.ts` vì tệp kia dính API của Workers nên phép kiểm chỉ
 * đọc được mã chứ không chạy được. Luật hoà giải là chỗ đã sai hai lần trong
 * một ngày — nó phải CHẠY THẬT trong phép kiểm, không phải soi chữ.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * VÌ SAO PHẢI TRỘN, KHÔNG CHỈ CHỌN MỘT BÊN
 *
 * Thầy bắt được chiều 15-09: bảng `than_thu` có đúng MỘT dòng và dòng ấy RỖNG —
 * `idThanhThuChon: ""`, cấp 1, mọi số 0 — trong khi trên web em đang có một con
 * đã mọc sừng. Một máy có hồ sơ trắng đã đẩy đè lên.
 *
 * Cổng cũ chỉ chặn khi `tongExp < tongCu`. Hồ sơ trắng có tổng 0; bản thật cũng
 * có tổng 0, vì sổ `soExp` mới có từ 15-09 nên hồ sơ nuôi từ trước sổ rỗng.
 * `0 < 0` là sai ⇒ ghi đè lọt qua, con thú của em bị xoá trắng.
 *
 * Trộn thì thứ tự ghi hết quan trọng: máy nào đẩy trước đẩy sau, dòng trên máy
 * chủ cũng chỉ TỐT LÊN, không bao giờ nghèo đi.
 */

export interface HoSoThanThuMayChu {
  idThanhThuChon: string
  capDo: number
  exp: number
  expToiDa: number
  capTienHoa: number
  khoExp: number
  soExp: Record<string, number>
  tangThapCaoNhat: number
  soCauDaThanhTay: number
  danhHieuHienTai: string
  ngayNhanTrung: string
  ngayChonThu: string
  /**
   * SỔ CÂU ĐÃ HỎI Ở THÁP. Chỉ `qid` + hai con số — KHÔNG có nội dung câu,
   * không tên, không điểm. Tầng đỏ dữ liệu vẫn nguyên.
   */
  lichSuThap: { qid: string; lanCuoi: number; soLanHoi: number }[]
}

export const NGUON_EXP_HOP_LE = ['caThi', 'btvn', 'mom', 'leoThap', 'sanBoss'] as const

/** Trộn hai sổ tháp — lấy `max` cả hai trường, giữ 300 dòng mới nhất. */
export function tronSoThap(
  a: readonly { qid: string; lanCuoi: number; soLanHoi: number }[] = [],
  b: readonly { qid: string; lanCuoi: number; soLanHoi: number }[] = [],
): { qid: string; lanCuoi: number; soLanHoi: number }[] {
  const m = new Map<string, { qid: string; lanCuoi: number; soLanHoi: number }>()
  for (const d of [...(a ?? []), ...(b ?? [])]) {
    const cu = m.get(d.qid)
    m.set(d.qid, cu === undefined ? { ...d } : {
      qid: d.qid,
      lanCuoi: Math.max(cu.lanCuoi, d.lanCuoi),
      soLanHoi: Math.max(cu.soLanHoi, d.soLanHoi),
    })
  }
  return [...m.values()].sort((x, y) => y.lanCuoi - x.lanCuoi).slice(0, 300)
}

export function tongExpCuaThu(h: HoSoThanThuMayChu): number {
  let t = 0
  for (const k of NGUON_EXP_HOP_LE) t += h.soExp[k] ?? 0
  return t
}

/**
 * Thước đo tiến trình — CÙNG MỘT LUẬT với máy em (`src/game/.../dong-bo.ts`),
 * so theo thứ tự từ điển.
 *
 * Cấp đứng đầu vì cấp chỉ tăng không bao giờ giảm. Để tổng EXP đứng đầu thì gặp
 * ca "máy A cấp 3 đã nạp hết ống, máy B cấp 1 còn đầy ống" là máy A tụt cấp.
 */
export function mocTienTrinhThu(h: HoSoThanThuMayChu): number[] {
  return [h.capDo, tongExpCuaThu(h), h.tangThapCaoNhat, h.soCauDaThanhTay, h.khoExp + h.exp]
}

/** >0 là a hơn, <0 là b hơn, 0 là ngang. */
export function soMocThu(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x !== y) return x > y ? 1 : -1
  }
  return 0
}

/** Trộn bản em vừa gửi với bản đang nằm trên máy chủ. */
export function tronHoSoThu(
  moi: HoSoThanThuMayChu,
  cu: HoSoThanThuMayChu,
): HoSoThanThuMayChu {
  // Bằng nhau thì giữ bản MỚI — em vừa gửi là bản em đang nhìn.
  const nen = soMocThu(mocTienTrinhThu(moi), mocTienTrinhThu(cu)) >= 0 ? moi : cu
  const kia = nen === moi ? cu : moi

  const soExp: Record<string, number> = {}
  for (const k of NGUON_EXP_HOP_LE) {
    soExp[k] = Math.max(nen.soExp[k] ?? 0, kia.soExp[k] ?? 0)
  }

  return {
    ...nen,
    soExp,
    // Khối cấp độ lấy TRỌN một bên: cấp, `exp` và ống nghiệm ăn khớp nhau —
    // nạp ống vào thú là ống vơi đi, cấp lên. Trộn lẻ từng trường là cộng
    // khống. Ngoại lệ: cùng cấp thì chưa bên nào nạp, lấy ống đầy hơn.
    khoExp: nen.capDo === kia.capDo ? Math.max(nen.khoExp, kia.khoExp) : nen.khoExp,
    tangThapCaoNhat: Math.max(nen.tangThapCaoNhat, kia.tangThapCaoNhat),
    // Cộng hiểu biết hai máy: hỏi nhiều hơn thì giữ số lớn, hỏi gần đây hơn
    // thì giữ mốc mới. Không bên nào đè bên nào.
    lichSuThap: tronSoThap(nen.lichSuThap, kia.lichSuThap),
    soCauDaThanhTay: Math.max(nen.soCauDaThanhTay, kia.soCauDaThanhTay),
    // CHỌN MỘT LẦN, KHÔNG ĐỔI: bên nào đã chốt thần thú thì giữ. Bên rỗng là
    // bên chưa kịp đồng bộ, KHÔNG phải bên vừa bỏ thú — đây đúng là chỗ hồ sơ
    // trắng xoá mất con thú của em.
    idThanhThuChon: nen.idThanhThuChon !== '' ? nen.idThanhThuChon : kia.idThanhThuChon,
    ngayChonThu: nen.ngayChonThu !== '' ? nen.ngayChonThu : kia.ngayChonThu,
    danhHieuHienTai: nen.danhHieuHienTai !== '' ? nen.danhHieuHienTai : kia.danhHieuHienTai,
    ngayNhanTrung: nen.ngayNhanTrung !== '' ? nen.ngayNhanTrung : kia.ngayNhanTrung,
  }
}
