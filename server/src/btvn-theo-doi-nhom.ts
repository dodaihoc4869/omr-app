// `/btvn/theo-doi` BẢN 2 — phần BỔ SUNG CHỈ-THÊM cho mục "Bài tập về nhà đã giao" thiết kế lại (Boss 21/09 18:10; đề prompt-btvn-da-giao-thiet-ke-lai-2109.md §2–§3; hợp đồng docs/hop-dong-btvn-theo-doi-v2-2109.md — Code 1 màn ⇄ Code 3 máy chủ).
// Mỗi bài thêm `ten` · `tenLop` · `soCauLoi` · `chang[{so, ngay, laHomNay}]` · `nhom{chuaMo, dungNhip, chamNhip, xongHomNay, daNop, nopTre}`; mỗi em thêm `nhom` · `changHienTai` · `soCauDaLam` · `soCauCuaEm` · `hocGanNhat` · `nopTreGio?`.
// KHÔNG đổi một khoá cũ. Màn KHÔNG tự tính nhóm: MỘT nguồn ở đây, cùng luật với Bảng tin thầy (`emChamNhip`, `trangThaiNopBai`, `baiTuNgayMoc`) và thẻ "Đường về đích" của em (mốc GỐC `truoc` của chặng mở sớm).
//
// LUẬT NHÓM MỘT EM (thứ tự ưu tiên — mỗi em thu hồi-KHÔNG đúng MỘT nhóm, nên `chuaMo + dungNhip + chamNhip + xongHomNay + daNop = tong`):
//   1. đã nộp (`nop_luc`)                                  → `da_nop` (`nopTre` ⊂ daNop: em nộp SAU hạn theo cột `nop_tre`)
//   2. chậm nhịp = `emChamNhip` của Bảng tin (chặng lẽ ra xong trước 00:00 hôm nay mà chưa xong; chặng MỞ SỚM chưa làm KHÔNG tính chậm; bài thường / em chưa chốt: chậm khi QUÁ HẠN chưa nộp) → `cham_nhip`
//      CHỈ với bài giao TỪ NGÀY MỐC (bài giao trước ngày mốc không tính nợ — cùng luật `noTheoLop`); bài cũ ⇒ không bao giờ `cham_nhip`
//   3. chưa mở bài (`trangThaiNopBai` = `chua_mo`: chưa chốt bộ / chưa có đáp án nào, chưa quá hạn)                                         → `chua_mo`
//   4. bài chia chặng và em ĐÃ XONG chặng lịch của hôm nay (`lo_da_xong` ≥ chặng có mốc GỐC mở ≤ hôm nay, đếm từ 1)                       → `xong_hom_nay`
//   5. còn lại (đang làm đúng nhịp; bài không chia chặng: "đang làm")                                                                      → `dung_nhip`
// Đối chiếu Bảng tin (test khoá): `nhom.chamNhip` = số em `emChamNhip`; `nhom.chuaMo` = `baiTap[].chuaMo`; `nhom.daNop` = `baiTap[].daNop` cho cùng bài.
//
// Chi phí: 5 truy vấn thêm mỗi lần gọi (chạy song song, mỗi cái MỘT lượt SELECT, không UNION): cột lịch/chặng của em (`btvn_em`, theo idx_btvn_lo), tên bài + chuyên đề, tên lớp (`hoc_sinh`), lần học gần nhất (`su_kien_hoc` theo (nguon, ma_nguon)), mốc (`cau_hinh`).
// Bất kỳ truy vấn nào lỗi ⇒ trả `null` (nơi gọi bỏ các khoá mới; máy cũ / màn dùng thẻ không thanh nhóm) — KHÔNG bao giờ làm hỏng lệnh cũ.
import type { Env } from './kieu'
import { ngayVnCuaMs, trangThaiNopBai } from './canh-bao-thay'
import { docLichDaLuu, moLucChang, moLucGocChangMoSom } from './btvn-nang-do-chang'
import { baiTuNgayMoc, docMocHienThi } from './moc-no'
import { tenLopCuaEm } from './ten-lop'
import { emChamNhip, tenBaiHienThi } from './gv-bang-tin'
import { docDapAnDaLuu } from './btvn-nang-do-d1'

type Hang = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const so = (v: unknown): number => Number(v) || 0

export type NhomEm = 'chua_mo' | 'dung_nhip' | 'cham_nhip' | 'xong_hom_nay' | 'da_nop'
export interface NhomBai { chuaMo: number; dungNhip: number; chamNhip: number; xongHomNay: number; daNop: number; nopTre: number }
export interface BoSungEm { nhom: NhomEm; changHienTai: number | null; soCauDaLam: number | null; soCauCuaEm: number | null; hocGanNhat: string | null; nopTreGio?: number }
export interface BoSungBai { ten: string; tenLop: string; soCauLoi: number | null; chang?: { so: number; ngay: string; laHomNay: boolean }[]; nhom: NhomBai; theoEm: Map<string, BoSungEm> }

export interface BaiDauVao {
  bt: Hang
  dsEm: Hang[]
  /** Bài cá nhân hoá: `thongKeTheoDoiCaNhan` (`soLoi`, số câu của em theo em). Vắng ⇒ bài thường. */
  cn?: { soLoi: number; theoEm: Map<string, { soCauCuaEm: number | null }> }
}

const nhieuNhat = <T>(ds: readonly T[], khoa: (x: T) => string): string | null => {
  const dem = new Map<string, number>()
  for (const x of ds) { const k = khoa(x); dem.set(k, (dem.get(k) ?? 0) + 1) }
  return [...dem].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? null
}

/** Số câu em ĐÃ LÀM ở bài = số câu có đáp án không rỗng trong `dap_an_json`. */
const demDaLam = (v: unknown): number => Object.values(docDapAnDaLuu(v)).filter((a) => chuoi(a) !== '').length

export async function tinhBoSungTheoDoi(env: Env, ds: readonly BaiDauVao[], nowMs: number): Promise<Map<string, BoSungBai> | null> {
  const ra = new Map<string, BoSungBai>()
  if (ds.length === 0) return ra
  try {
    const maBai = ds.map((x) => chuoi(x.bt.ma_btvn))
    const sbdTatCa = [...new Set(ds.flatMap((x) => x.dsEm.map((e) => chuoi(e.sbd))))]
    const [rEm, rTen, rHs, rSu, moc] = await Promise.all([
      env.DB.prepare('SELECT ma_btvn, sbd, so_chang, lo_da_xong, chot_luc, chang_mo_json, so_cau_em, xong_vong1_luc, nop_tre, gio_tre FROM btvn_em WHERE ma_btvn IN (SELECT value FROM json_each(?))').bind(JSON.stringify(maBai)).all<Hang>(),
      env.DB.prepare(
        `SELECT b.ma_btvn, COALESCE(NULLIF(TRIM(c.ten_ca), ''), d.ten_de, b.ma_de) AS ten,
                (SELECT bc.chuyen_de FROM btvn_cau bc WHERE bc.ma_btvn = b.ma_btvn AND COALESCE(bc.chuyen_de, '') <> '' GROUP BY bc.chuyen_de ORDER BY COUNT(*) DESC, bc.chuyen_de LIMIT 1) AS cd
           FROM btvn b LEFT JOIN ca c ON c.ma_ca = b.ma_ca LEFT JOIN de_kho d ON d.ma_de = b.ma_de WHERE b.ma_btvn IN (SELECT value FROM json_each(?))`,
      ).bind(JSON.stringify(maBai)).all<Hang>(),
      env.DB.prepare('SELECT sbd, lop, ten_lop FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?))').bind(JSON.stringify(sbdTatCa)).all<Hang>(),
      env.DB.prepare("SELECT ma_nguon, sbd, MAX(luc) AS luc FROM su_kien_hoc WHERE nguon IN ('btvn', 'btvn_lo') AND ma_nguon IN (SELECT value FROM json_each(?)) GROUP BY ma_nguon, sbd").bind(JSON.stringify(maBai)).all<Hang>(),
      docMocHienThi(env),
    ])
    const cot = new Map((rEm.results ?? []).map((x) => [`${chuoi(x.ma_btvn)}|${chuoi(x.sbd)}`, x]))
    const tenBai = new Map((rTen.results ?? []).map((x) => [chuoi(x.ma_btvn), { ten: chuoi(x.ten), cd: chuoi(x.cd) }]))
    const lopCua = new Map((rHs.results ?? []).map((x) => [chuoi(x.sbd), tenLopCuaEm(chuoi(x.lop), x.ten_lop)]))
    const hocGan = new Map((rSu.results ?? []).map((x) => [`${chuoi(x.ma_nguon)}|${chuoi(x.sbd)}`, chuoi(x.luc)]))
    const homNay = ngayVnCuaMs(nowMs)

    for (const { bt, dsEm, cn } of ds) {
      const ma = chuoi(bt.ma_btvn), han = chuoi(bt.han_nop), hanMs = Date.parse(han)
      const tinhCham = baiTuNgayMoc(bt.giao_luc, moc.ngayVn)
      const nhom: NhomBai = { chuaMo: 0, dungNhip: 0, chamNhip: 0, xongHomNay: 0, daNop: 0, nopTre: 0 }
      const theoEm = new Map<string, BoSungEm>()
      const chotChang: { so: number; ngayGoc: string[] }[] = []
      const emHoatDong = dsEm.filter((e) => !e.thu_hoi)

      for (const e of emHoatDong) {
        const sbd = chuoi(e.sbd)
        const c = cot.get(`${ma}|${sbd}`) ?? {}
        // dòng em gộp: cột cũ (nop_luc, dap_an_json) + cột lịch/chặng đọc thêm — đúng các khoá `emChamNhip` / `trangThaiNopBai` đòi
        const x: Hang = { nop_luc: e.nop_luc, dap_an_json: e.dap_an_json, so_chang: c.so_chang, lo_da_xong: c.lo_da_xong, chot_luc: c.chot_luc, chang_mo_json: c.chang_mo_json, xong_vong1_luc: c.xong_vong1_luc }
        const soChang = so(x.so_chang), loDaXong = so(x.lo_da_xong), chot = chuoi(x.chot_luc)
        const coChang = soChang > 0 && chot !== '' && Number.isFinite(Date.parse(chot))
        // mốc GỐC mở từng chặng (chặng mở sớm ⇒ `truoc`) — ngày VN để biết chặng nào là "hôm nay"
        let kHomNay = -1
        if (coChang) {
          const lich = docLichDaLuu(x.chang_mo_json, soChang, { chotLuc: chot, hanNop: han, nowMs })
          const moLuc = lich && lich.moLuc.length === soChang ? lich.moLuc : moLucChang(chot, soChang)
          const goc = moLucGocChangMoSom(x.chang_mo_json)
          const ngayGoc = moLuc.map((m, k) => ngayVnCuaMs(goc.get(k) ?? Date.parse(m)))
          ngayGoc.forEach((n, k) => { if (n <= homNay) kHomNay = k })
          chotChang.push({ so: soChang, ngayGoc })
        }
        const nop = chuoi(e.nop_luc) !== ''
        const st = trangThaiNopBai(x, han, nowMs)
        let nh: NhomEm
        if (nop) nh = 'da_nop'
        else if (tinhCham && emChamNhip(x, han, hanMs, nowMs)) nh = 'cham_nhip'
        else if (st.trangThai === 'chua_mo') nh = 'chua_mo'
        else if (coChang && kHomNay >= 0 && loDaXong >= kHomNay + 1) nh = 'xong_hom_nay'
        else nh = 'dung_nhip'
        if (nh === 'da_nop') { nhom.daNop++; if (so(c.nop_tre) === 1) nhom.nopTre++ }
        else if (nh === 'cham_nhip') nhom.chamNhip++
        else if (nh === 'chua_mo') nhom.chuaMo++
        else if (nh === 'xong_hom_nay') nhom.xongHomNay++
        else nhom.dungNhip++
        const lucCuoi = [hocGan.get(`${ma}|${sbd}`), chuoi(e.nop_luc), chuoi(x.xong_vong1_luc)].filter((v): v is string => !!v && Number.isFinite(Date.parse(v))).sort().pop() ?? null
        const daLam = demDaLam(e.dap_an_json)
        theoEm.set(sbd, {
          nhom: nh,
          changHienTai: coChang ? Math.min(loDaXong + 1, soChang) : null,
          soCauDaLam: nh === 'chua_mo' ? null : daLam,
          soCauCuaEm: cn ? (cn.theoEm.get(sbd)?.soCauCuaEm ?? null) : so(bt.so_cau) || null,
          hocGanNhat: nh === 'chua_mo' ? null : lucCuoi,
          ...(nop && so(c.nop_tre) === 1 && so(c.gio_tre) > 0 ? { nopTreGio: so(c.gio_tre) } : {}),
        })
      }

      // đường chặng CÓ NGÀY của bài: số chặng phổ biến nhất trong các em đã chốt; ngày mở GỐC phổ biến nhất của từng chặng
      let chang: BoSungBai['chang']
      const soChangBai = nhieuNhat(chotChang, (z) => String(z.so))
      if (soChangBai) {
        const nhomChot = chotChang.filter((z) => String(z.so) === soChangBai)
        chang = Array.from({ length: Number(soChangBai) }, (_, k) => {
          const ngay = nhieuNhat(nhomChot, (z) => z.ngayGoc[k] ?? '') ?? ''
          return { so: k + 1, ngay, laHomNay: ngay === homNay }
        })
      }
      const lopBai = [...new Set(emHoatDong.map((e) => lopCua.get(chuoi(e.sbd))).filter((v): v is string => !!v))]
      const t = tenBai.get(ma)
      ra.set(ma, {
        ten: tenBaiHienThi(t?.cd ?? '', t?.ten ?? ''),
        tenLop: lopBai.length === 1 ? lopBai[0]! : '',
        soCauLoi: cn ? cn.soLoi : null,
        ...(chang ? { chang } : {}),
        nhom,
        theoEm,
      })
    }
    return ra
  } catch (e) {
    console.error('[btvn-theo-doi] không tính được nhóm (bỏ khoá mới, lệnh cũ vẫn chạy):', e instanceof Error ? e.message : e)
    return null
  }
}
