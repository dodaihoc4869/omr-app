// Chỉ nạp khi em hỏi thêm; giữ nguyên yêu cầu đang làm và câu trả lời có cấu trúc.
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { docTokenHs, goiHs, type CauNen, type KetQuaCauKiem, type ThangGo, type SuKienKhung, type KetQuaNopNen, type MucCong, type CauChoKhung, type HoSoLoiGiai, type KiemKhung, type LoiGiaiChu, type KetQuaHoiThay, type KetQuaHoiThem } from './loi-giai-api'

export async function hoiThay(qid: string, nguon: string, chiHoi = false, luotId?: string): Promise<KetQuaHoiThay> {
  const token = docTokenHs()
  if (!token) return { ok: false, loi: 'Em đăng nhập lại để hỏi thầy.' }
  const j = await goiHs('/hs/hoi-thay', { token, qid, nguon, ...(chiHoi ? { chiHoi: true } : {}), ...(luotId ? { luotId } : {}) })
  if (!j) return { ok: false, loi: 'Chưa nối được máy chủ. Em thử lại sau.' }
  if (j.ok !== true) return { ok: false, loi: String(j.error ?? 'Chưa mở được lời giải.'), khoa: j.khoa as 'dang_kiem_tra' | 'ca_chua_cong_bo' | undefined }
  const hoiThem = j.hoiThem === true
  if (chiHoi && j.chiHoi === true) return { ok: true, chiHoi: true, cau: j.cau as CauChoKhung, hoiThem }
  if (j.coLoiGiai === true) return { ok: true, cau: j.cau as CauChoKhung, hoSo: j.hoSo as HoSoLoiGiai, ...(j.kiem ? { kiem: j.kiem as KiemKhung } : {}), hoiThem }
  return { ok: true, cau: j.cau as CauChoKhung, loiGiaiChu: j.loiGiaiChu as LoiGiaiChu, hoiThem }
}

export async function hoiThemThay(qid: string, nguon: string, cauHoi: string, dapAnEm = '', dangLam = false): Promise<KetQuaHoiThem> {
  const token = docTokenHs()
  if (!token) return { ok: false, ma: 'dang_nhap', loi: 'Em đăng nhập lại để hỏi Thầy.' }
  const dk = new AbortController()
  const t = setTimeout(() => dk.abort(), 45_000)
  try {
    const url = await layDiaChiMayChu()
    if (!url) return { ok: false, ma: 'mang', loi: 'Chưa nối được máy chủ. Em thử lại sau.' }
    const r = await fetch(`${url}/hs/hoi-tro-ly`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dangLam ? { token, qid, nguon, cauHoi, dapAnEm, dangLam: true } : { token, qid, nguon, cauHoi, dapAnEm }), signal: dk.signal })
    const j = (await r.json()) as Record<string, unknown>
    const conLai = typeof j.conLai === 'number' ? j.conLai : undefined
    if (j.ok === true) return { ok: true, traLoi: String(j.traLoi ?? ''), cauTruc: j.cauTruc, conLai: conLai ?? 0, ngoaiPhamVi: j.ngoaiPhamVi === true }
    return { ok: false, ma: String(j.ma ?? 'loi'), loi: String(j.error ?? 'Thầy chưa trả lời được. Em thử lại sau.'), ...(conLai !== undefined ? { conLai } : {}) }
  } catch {
    return { ok: false, ma: dk.signal.aborted ? 'cham' : 'mang', loi: dk.signal.aborted ? 'Thầy trả lời chưa kịp. Em gửi lại câu hỏi nhé.' : 'Chưa nối được máy chủ. Em thử lại sau.' }
  } finally {
    clearTimeout(t)
  }
}


export async function guiCauKiem(qid: string, buoc: number, traLoi: string, giay: number): Promise<KetQuaCauKiem> {
  const token = docTokenHs()
  if (!token) return { ok: false, loi: 'Em đăng nhập lại để trả lời.' }
  const j = await goiHs('/hs/cau-kiem', { token, qid, buoc, traLoi, giay })
  if (!j) return { ok: false, loi: 'Chưa nối được máy chủ. Em thử lại sau.' }
  if (j.ok !== true) return { ok: false, loi: String(j.error ?? 'Chưa kiểm được câu trả lời.') }
  return { ok: true, dung: j.dung === true, ...(typeof j.dapAn === 'string' ? { dapAn: j.dapAn } : {}), ...(typeof j.nhanNen === 'string' ? { nhanNen: j.nhanNen, tenNen: String(j.tenNen ?? '') } : {}) }
}

export async function thangGo(qid: string, dang?: { giay: number; suKien: SuKienKhung[] }): Promise<ThangGo | null> {
  const token = docTokenHs()
  if (!token) return null
  const j = await goiHs('/hs/thang-go', { token, qid, ...(dang ? { dang: { giay: dang.giay, suKien: dang.suKien.slice(0, 200) } } : {}) })
  if (!j || j.ok !== true || j.coThang !== true) return null
  return j as unknown as ThangGo
}

export async function luyenNen(nhan: string): Promise<{ ok: true; ten: string; cau: CauNen[] } | { ok: false; loi: string }> {
  const token = docTokenHs()
  if (!token) return { ok: false, loi: 'Em đăng nhập lại để luyện.' }
  const j = await goiHs('/hs/luyen-nen', { token, nhan })
  if (!j) return { ok: false, loi: 'Chưa nối được máy chủ. Em thử lại sau.' }
  if (j.ok !== true) return { ok: false, loi: String(j.error ?? 'Chưa mở được bài luyện.') }
  return { ok: true, ten: String(j.ten ?? ''), cau: Array.isArray(j.cau) ? (j.cau as CauNen[]) : [] }
}

export async function nopLuyenNen(id: string, traLoi: string, qid: string): Promise<KetQuaNopNen> {
  const token = docTokenHs()
  if (!token) return { ok: false, loi: 'Em đăng nhập lại để nộp.' }
  const j = await goiHs('/hs/luyen-nen/nop', { token, id, traLoi, qid })
  if (!j) return { ok: false, loi: 'Chưa nối được máy chủ. Em thử lại sau.' }
  if (j.ok !== true) return { ok: false, loi: String(j.error ?? 'Chưa nộp được.') }
  return { ok: true, dung: j.dung === true, dapAn: String(j.dapAn ?? ''), giai: Array.isArray(j.giai) ? (j.giai as unknown[]).map(String) : [], meo: String(j.meo ?? '') }
}

export async function guiThay(qid: string, buoc: number, viet: string): Promise<{ ok: true } | { ok: false; loi: string; cong?: MucCong[] }> {
  const token = docTokenHs()
  if (!token) return { ok: false, loi: 'Em đăng nhập lại để gửi.' }
  const j = await goiHs('/hs/gui-thay', { token, qid, buoc, viet })
  if (!j) return { ok: false, loi: 'Chưa nối được máy chủ. Em thử lại sau.' }
  if (j.ok === true) return { ok: true }
  const cong = Array.isArray(j.cong) ? (j.cong as MucCong[]) : undefined
  return { ok: false, loi: String(j.error ?? cong?.find((c) => !c.dat)?.viec ?? 'Chưa gửi được.'), ...(cong ? { cong } : {}) }
}
