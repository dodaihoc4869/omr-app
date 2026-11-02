// «MỘT TRANG VỀ CON» (thầy chốt bản vẽ 01/11, docs/ban-ve-ph-mot-trang-0111) — 4 SỐ ĐO cho PHỤ HUYNH: `POST /ph/bon-so-do {pass}`.
// CHỈ ĐỌC bản đã tính sẵn của ĐÚNG con (cron đêm, bảng `bon_chi_so_em` — bon-chi-so-d1.ts): MỘT câu SELECT theo khoá chính, không tính lại lúc mở,
// không thêm vòng chờ nối tiếp (gọi song song với các lệnh mở app phụ huynh khác). Riêng tư: danh tính lấy từ liên kết của phụ huynh; KHÔNG trả SBD / tên /
// điểm bạn khác, không hạng, không trung vị lớp, không `qid`. Bằng chứng dịch sang lời phụ huynh ở đây (bảng từ ngữ DAC-TA mục 3), tối đa 3 thẻ mỗi số đo.
import type { Env, ExecutionContext } from './kieu'
import { sbdCuaPhuHuynh } from './ph-truy-cap'
import { CHI_NHAN_TOKEN } from './ph-tat-ca-ve-con'
import type { BangChungPh, MaSoDo, NgaySoDo, TraLoiBonSoDo } from '../../src/lib/ph-v3/bon-so-do-kieu'

type Row = Record<string, unknown>
const MA: readonly MaSoDo[] = ['ht', 'dp', 'ch', 'lu']
const json = <T>(x: unknown, macDinh: T): T => { try { return x ? (JSON.parse(String(x)) as T) : macDinh } catch { return macDinh } }
const so = (x: unknown): number | null => (x === null || x === undefined || x === '' || !Number.isFinite(Number(x)) ? null : Math.round(Number(x)))

/** Lời phụ huynh cho từng thẻ bằng chứng (khoá `<số đo>:<mã thẻ>`): [câu đầy đủ cho tấm, nhãn ngắn ≤ 24 ký tự cho ô trên trang]; `lon` là con số lớn đứng trước.
 *  Thẻ lạ ⇒ bỏ (không lộ chữ của thầy). */
const LOI: Record<string, readonly [string, string]> = {
  'dp:voi': ['lượt con chọn đáp án khi chưa đọc hết đề', 'lượt chọn vội'],
  'dp:lap': ['lần con bấm cùng một đáp án nhiều câu liền', 'lần bấm lặp'],
  'dp:do': ['lượt con thử nhiều đáp án rồi mới bấm Kiểm tra (dò đáp án)', 'lượt dò đáp án'],
  'dp:lech': ['lúc luyện con đúng nhiều, nhưng điểm kiểm tra thấp', 'luyện cao, kiểm tra thấp'],
  'dp:boMac': ['câu sai con để đó, chưa sửa', 'câu sai bỏ đó'],
  'dp:treo': ['lượt con để máy đứng lâu mà không làm', 'lượt treo máy'],
  'dp:goiY': ['lượt con mở lời giải trước khi tự làm', 'lượt xem lời giải trước'],
  'dp:songSinh': ['câu đổi số liệu con làm đúng: thấp là con đang học thuộc đáp án', 'đúng khi đổi số liệu'],
  'dp:thi': ['bài con rời màn hình khi làm kiểm tra', 'bài rời màn khi thi'],
  // v3 (02/11): ca thi thật + lên bảng theo từng chuyên đề — lời tế nhị, nói việc, không gán nhãn con.
  'dp:lechCa': ['lúc luyện con đúng nhiều, nhưng vào ca thi ở cùng phần ấy con làm được ít hơn hẳn', 'luyện cao, thi thấp'],
  'dp:bangChua': ['lần con lên bảng chưa làm lại được câu con từng làm đúng lúc luyện', 'lên bảng chưa đạt'],
  'ht:sua': ['câu từng sai con đã tự sửa đúng', 'câu sai đã tự sửa'],
  'ht:songSinh': ['câu cùng dạng, khác số liệu con làm đúng', 'đúng câu đổi số liệu'],
  'ht:ky': ['câu con đọc đủ thời gian rồi mới chọn', 'câu đọc kỹ'],
  'ht:khop': ['đúng lúc luyện → điểm kiểm tra cá nhân', 'luyện → kiểm tra'],
  'ht:dungMoi': ['câu mới con tự làm đúng ngay lần đầu', 'câu mới tự làm đúng'],
  'ht:caThi': ['câu thi con làm đúng ở các phần đã luyện — ca thi khớp lúc luyện', 'ca thi khớp luyện'],
  'ht:lenBang': ['lần con lên bảng làm đạt', 'lên bảng đạt'],
  'ch:ngayDu': ['ngày con làm đủ mức', 'ngày đủ mức'],
  'ch:cauLam': ['câu thầy giao con đã làm', 'câu giao đã làm'],
  'ch:ky': ['câu con làm thật, không chọn vội', 'câu làm thật'],
  'ch:chuoi': ['ngày đủ mức liền nhau gần nhất', 'ngày liền đủ mức'],
  'lu:ngayCoLam': ['ngày con không làm câu nào', 'ngày không học'],
  'lu:lanCuoi': ['lần cuối con học', 'lần cuối học'],
  'lu:cauLam': ['câu thầy giao con chưa làm', 'câu giao chưa làm'],
  'lu:boMac': ['câu sai con chưa sửa', 'câu sai chưa sửa'],
  // v3b (02/11): Lười vì làm cho có / dồn sát giờ chốt (có làm đủ ngày).
  'lu:choCo': ['lượt con làm cho có (chọn vội mà sai, để máy đứng) — không tính là đã làm', 'lượt làm cho có'],
  'lu:donHan': ['ngày con dồn hết bài sau 23 giờ, sát giờ chốt', 'ngày dồn sát giờ'],
}

type TheTho = { ma?: string; tieu?: string; lon?: string; nhoSo?: string; w?: number; viDu?: { luc?: string; phu?: string; kq?: string; dung?: boolean | null }[] }

/** Thẻ của thầy ⇒ bằng chứng lời phụ huynh (thuần, test được). `lu:ngayCoLam` chỉ nói ngày KHÔNG làm (thẻ «Ngày có làm» khi không bỏ ngày nào ⇒ «0/14»). */
export function bangChungPh(ma: MaSoDo, ds: readonly TheTho[]): BangChungPh[] {
  const ra: BangChungPh[] = []
  for (const t of [...ds].sort((a, b) => (b.w ?? 0) - (a.w ?? 0))) {
    const loi = LOI[`${ma}:${t.ma ?? ''}`]
    if (!loi || !t.lon) continue
    const [chu, ngan] = loi
    let lon = String(t.lon)
    if (ma === 'lu' && t.ma === 'ngayCoLam' && !/^Ngày không/.test(t.tieu ?? '')) lon = `0/${lon.split('/')[1] ?? ''}`.replace(/\/$/, '')
    const vd = t.viDu?.[0]
    ra.push({
      so: lon,
      ngan,
      chu: ma === 'lu' && t.ma === 'lanCuoi' && t.nhoSo ? `${chu} (${t.nhoSo})` : chu,
      ...(vd && vd.luc ? { vd: { luc: String(vd.luc), chu: [vd.phu, vd.kq].filter(Boolean).join(' · ') } } : {}),
    })
    if (ra.length >= 3) break
  }
  return ra
}

/** Hàng `bon_chi_so_em` ⇒ câu trả lời cho phụ huynh (thuần). Không có hàng ⇒ `co:false` (cron chưa tính — màn nói «có từ sáng mai»). */
export function banPhuHuynh(r: Row | undefined): TraLoiBonSoDo {
  if (!r) return { ok: true, co: false }
  const the = json<Partial<Record<MaSoDo, TheTho[]>>>(r.the_json, {})
  const ngay = json<{ ngay?: string; muc?: number; ky?: number; voi?: number }[]>(r.ngay_json, [])
    .filter((n) => typeof n?.ngay === 'string')
    .slice(-14)
    .map((n): NgaySoDo => ({ ngay: n.ngay!, muc: Math.max(0, Number(n.muc) || 0), ky: Math.max(0, Number(n.ky) || 0), voi: Math.max(0, Number(n.voi) || 0) }))
  return {
    ok: true,
    co: true,
    tinhLuc: String(r.tinh_luc ?? ''),
    tu: ngay[0]?.ngay ?? '',
    den: ngay[ngay.length - 1]?.ngay ?? String(r.ngay ?? ''),
    soLuot: Number(r.so_luot) || 0,
    diem: { ht: so(r.ht), dp: so(r.dp), ch: so(r.ch), lu: so(r.lu) },
    bangChung: Object.fromEntries(MA.map((m) => [m, bangChungPh(m, the[m] ?? [])])) as Record<MaSoDo, BangChungPh[]>,
    ngay,
  }
}

export async function phBonSoDo(env: Env, b: Row, envDoc: Env = env, ctx?: ExecutionContext): Promise<TraLoiBonSoDo | { ok: false; error: string }> {
  const { sbd } = await sbdCuaPhuHuynh(envDoc, b, 'ph-bon-so-do', { chiToken: CHI_NHAN_TOKEN, envGhi: env, ctx })
  // Một câu theo khoá chính. Bảng chưa có (máy chủ mới, cron chưa chạy lần nào) ⇒ như chưa tính.
  const r = await envDoc.DB.prepare('SELECT ngay, tinh_luc, ht, dp, ch, lu, so_luot, the_json, ngay_json FROM bon_chi_so_em WHERE sbd = ?1').bind(sbd).first<Row>().catch(() => null)
  return banPhuHuynh(r ?? undefined)
}
