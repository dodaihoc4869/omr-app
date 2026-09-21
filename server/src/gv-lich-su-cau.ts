// `POST /gv/lich-su-cau-cua-em` — "EM NÀY ĐÃ LÀM CÂU NÀY CHƯA, ĐÚNG HAY SAI" cho thẻ tên màn Gọi lên bảng (thầy lệnh 21/09; hợp đồng docs/hop-dong-lich-su-cau-len-bang-2109.md, Code 1 màn · Code 3 máy chủ).
// ĐỌC-CHỈ, cổng mã bí mật như mọi lệnh /gv/*. Vào `{cap:[{sbd,qid}]}` ≤ 200 cặp; ra `{ok, ketQua:[…]}` ĐÚNG thứ tự cặp vào.
//
// NGOẠI LỆ CÓ CHỦ Ý — KHÔNG áp mốc hiển thị 12:00 21/09 (`docMocHienThi`): thầy lệnh quét HẾT lịch sử của em ("quét hết mọi lịch sử của học sinh đó"). Đây là lệnh của THẦY trước lớp, không phải số hiển thị cho học sinh/phụ huynh.
//
// Nguồn: sổ học `su_kien_hoc` theo (sbd, qid), MỌI ngày, đi bằng chỉ mục (sbd, qid) — cộng bảng `len_bang` cho phần "đã lên bảng". LUẬT KHÔNG LỘ ĐÁP ÁN của bài đang mở (màn chiếu trước lớp không được thành đường lộ):
//   • bài về nhà CHƯA NỘP (`btvn_em.nop_luc` rỗng) · gói gia đình giao CHƯA NỘP (`mom_bai.submitted_at` rỗng) · ca kiểm tra CHƯA công bố (cùng luật `SQL_DA_CONG_BO`) ⇒ vẫn tính "đã làm" (`soLan`, `daLam`) nhưng KHÔNG vào
//     `soDung`/`soSai` và `lanCuoi.dung = null`. Câu tự luận không có đúng/sai tự chấm (`ket_qua` rỗng trong sổ) ⇒ cũng `dung = null`, chỉ `daLam` + `lenBang`.
//   • Bài / gói KHÔNG còn dòng trong bảng gốc (đã dọn ở lần reset 21/09): không còn "đang mở" nên đọc như đã nộp — kết quả đã ghi trong sổ.
// Chi phí: 2 truy vấn D1 mỗi lần gọi (≤ 3 theo đề); mỗi truy vấn ≤ 5 term UNION (giới hạn D1 thật). Ước lượng ~0,5–3 nghìn dòng đọc/lần (200 cặp × vài sự kiện, đi chỉ mục), màn gọi vài lần/buổi ⇒ ≪ 0,1 triệu dòng/ngày.
import type { Env } from './kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'

type Hang = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const so = (v: unknown): number => Number(v) || 0
/** Khoá cặp (em, câu): JSON của mảng — không phụ thuộc ký tự nào có mặt trong sbd/qid. */
const khoaCap = (sbd: string, qid: string): string => JSON.stringify([sbd, qid])
export const TOI_DA_CAP_LICH_SU = 200
/** Nguồn của sổ mà kết quả CHỈ được trả khi bài/ca đã kết thúc (kiểm ở bảng gốc). */
const NGUON_BTVN = new Set(['btvn', 'btvn_lo'])
const NGUON_LEN_BANG = 'len_bang'

export interface KetQuaLichSuCau {
  sbd: string
  qid: string
  daLam: boolean
  soLan: number
  soDung: number
  soSai: number
  lanCuoi: { dung: boolean | null; ngay: string; nguon: string } | null
  lenBang: { soLan: number; datLanCuoi: boolean } | null
}

interface Su { nguon: string; ma: string; kq: 0 | 1 | null; luc: string; ngay: string }

export async function gvLichSuCauCuaEm(env: Env, b: Hang): Promise<Hang> {
  const cap = b.cap
  if (!Array.isArray(cap) || cap.length === 0) return { ok: false, lyDo: 'thieu', error: 'Thiếu danh sách cặp (em, câu).' }
  if (cap.length > TOI_DA_CAP_LICH_SU) return { ok: false, lyDo: 'qua_nhieu_cap', error: `Tối đa ${TOI_DA_CAP_LICH_SU} cặp mỗi lần.` }
  const cacCap: { sbd: string; qid: string }[] = []
  for (const x of cap as Hang[]) {
    const sbd = chuoi(x?.sbd), qid = chuoi(x?.qid)
    if (!sbd || !qid) return { ok: false, lyDo: 'thieu', error: 'Mỗi cặp cần đủ sbd và qid.' }
    cacCap.push({ sbd, qid })
  }
  const duy = [...new Map(cacCap.map((c) => [khoaCap(c.sbd, c.qid), c])).values()]
  const jsonCap = JSON.stringify(duy)
  try {
    // (1) Mọi sự kiện của các cặp, MỌI ngày (đi chỉ mục idx_skh_em_qid*).
    const r1 = await env.DB.prepare(
      `SELECT s.sbd, s.qid, s.nguon, s.ma_nguon, s.ket_qua, s.luc, s.ngay_vn
         FROM json_each(?) j JOIN su_kien_hoc s ON s.sbd = json_extract(j.value, '$.sbd') AND s.qid = json_extract(j.value, '$.qid')`,
    ).bind(jsonCap).all<Hang>()
    const theoCap = new Map<string, Su[]>()
    const khoaBtvn = new Set<string>(), khoaMom = new Set<string>(), maCa = new Set<string>()
    for (const x of r1.results ?? []) {
      const nguon = chuoi(x.nguon), ma = chuoi(x.ma_nguon), sbd = chuoi(x.sbd)
      const k = khoaCap(sbd, chuoi(x.qid))
      const kq = x.ket_qua === null || x.ket_qua === undefined ? null : so(x.ket_qua)
      ;(theoCap.get(k) ?? theoCap.set(k, []).get(k)!).push({ nguon, ma, kq: kq === 1 ? 1 : kq === 0 ? 0 : null, luc: chuoi(x.luc), ngay: chuoi(x.ngay_vn) })
      if (NGUON_BTVN.has(nguon)) khoaBtvn.add(`${ma}|${sbd}`)
      else if (nguon === 'mom') khoaMom.add(JSON.stringify([sbd, ma]))
      else if (nguon === 'thi') maCa.add(ma)
    }
    // (2) MỘT truy vấn gộp (≤ 4 term): len_bang + trạng thái bài về nhà / gói gia đình / công bố ca của đúng các nguồn vừa thấy.
    const phan: string[] = [
      `SELECT 'lb' AS k, l.sbd AS a, l.qid AS b, l.dat AS c, l.luc AS d FROM json_each(?) j JOIN len_bang l ON l.sbd = json_extract(j.value, '$.sbd') AND l.qid = json_extract(j.value, '$.qid')`,
    ]
    const bind: unknown[] = [jsonCap]
    if (khoaBtvn.size) {
      phan.push(`SELECT 'bt', be.khoa, CASE WHEN COALESCE(be.nop_luc, '') = '' THEN 0 ELSE 1 END, NULL, NULL FROM btvn_em be WHERE be.khoa IN (SELECT value FROM json_each(?))`)
      bind.push(JSON.stringify([...khoaBtvn]))
    }
    if (khoaMom.size) {
      phan.push(`SELECT 'mom', m.sbd || '|' || m.id, CASE WHEN COALESCE(m.submitted_at, '') = '' THEN 0 ELSE 1 END, NULL, NULL FROM json_each(?) j JOIN mom_bai m ON m.sbd = json_extract(j.value, '$[0]') AND m.id = json_extract(j.value, '$[1]')`)
      bind.push(`[${[...khoaMom].join(',')}]`)
    }
    if (maCa.size) {
      phan.push(`SELECT 'ca', c.ma_ca, CASE WHEN ${SQL_DA_CONG_BO('c')} THEN 1 ELSE 0 END, NULL, NULL FROM ca c WHERE c.ma_ca IN (SELECT value FROM json_each(?))`)
      bind.push(JSON.stringify([...maCa]))
    }
    const r2 = await env.DB.prepare(phan.join(' UNION ALL ')).bind(...bind).all<Hang>()
    const lenBang = new Map<string, { soLan: number; dat: boolean; luc: string }>()
    const btvnDaNop = new Map<string, boolean>(), momDaNop = new Map<string, boolean>(), caDaCongBo = new Map<string, boolean>()
    for (const x of r2.results ?? []) {
      const k = chuoi(x.k)
      if (k === 'lb') {
        const kc = khoaCap(chuoi(x.a), chuoi(x.b)), luc = chuoi(x.d), cu = lenBang.get(kc)
        const moiHon = !cu || luc >= cu.luc
        lenBang.set(kc, { soLan: (cu?.soLan ?? 0) + 1, dat: moiHon ? so(x.c) === 1 : cu!.dat, luc: moiHon ? luc : cu!.luc })
      } else if (k === 'bt') btvnDaNop.set(chuoi(x.a), so(x.b) === 1)
      else if (k === 'mom') momDaNop.set(chuoi(x.a), so(x.b) === 1)
      else if (k === 'ca') caDaCongBo.set(chuoi(x.a), so(x.b) === 1)
    }
    // Được phép thấy đúng/sai của sự kiện này? Chỉ chặn khi bảng gốc CÒN dòng và bài/ca còn ĐANG MỞ.
    const duocThay = (sbd: string, s: Su): boolean => {
      if (NGUON_BTVN.has(s.nguon)) return btvnDaNop.get(`${s.ma}|${sbd}`) !== false
      if (s.nguon === 'mom') return momDaNop.get(`${sbd}|${s.ma}`) !== false
      if (s.nguon === 'thi') return caDaCongBo.get(s.ma) !== false
      return true
    }
    const ketQua: KetQuaLichSuCau[] = cacCap.map(({ sbd, qid }) => {
      const tatCa = theoCap.get(khoaCap(sbd, qid)) ?? []
      const su = tatCa.filter((s) => s.nguon !== NGUON_LEN_BANG) // soLan KHÔNG gồm lên bảng
      const thay = su.filter((s) => s.kq !== null && duocThay(sbd, s))
      const cuoi = [...su].sort((a, c) => (a.luc < c.luc ? 1 : a.luc > c.luc ? -1 : 0))[0]
      const lb = lenBang.get(khoaCap(sbd, qid))
      return {
        sbd, qid,
        daLam: tatCa.length > 0 || !!lb,
        soLan: su.length,
        soDung: thay.filter((s) => s.kq === 1).length,
        soSai: thay.filter((s) => s.kq === 0).length,
        lanCuoi: cuoi ? { dung: cuoi.kq !== null && duocThay(sbd, cuoi) ? cuoi.kq === 1 : null, ngay: cuoi.ngay, nguon: cuoi.nguon } : null,
        lenBang: lb ? { soLan: lb.soLan, datLanCuoi: lb.dat } : null,
      }
    })
    return { ok: true, ketQua }
  } catch (e) {
    console.error('[lich-su-cau] lỗi đọc (không trả nửa vời):', e instanceof Error ? e.message : e)
    return { ok: false, lyDo: 'loi_doc', error: 'Chưa đọc được lịch sử làm câu. Thử lại sau.' }
  }
}
