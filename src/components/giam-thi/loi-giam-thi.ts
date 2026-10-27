// KHO LỜI CÀU NHÀU của 4 giám thị (thầy duyệt 27/10; sửa chữ trực tiếp ở đây). Luật chữ: khó tính nhưng KHÔNG xúc phạm, không chửi, không emoji;
// mỗi câu ≤ 42 kí tự để vừa MỘT dòng ở khung 360 px (test giam-thi-2710 khoá). Ngữ cảnh: ngauNhien (thỉnh thoảng) · cho (lâu không thao tác) ·
// dongHo (quá giờ) · voi (bấm quá nhanh) · sai · sai2 (sai 2 câu liền) · dung · combo (đúng liền ≥ 3) · xong (xong chặng).
import type { MucGT } from './giam-thi-ve'

export type NguCanhLoi = 'ngauNhien' | 'cho' | 'dongHo' | 'voi' | 'sai' | 'sai2' | 'dung' | 'combo' | 'xong'
export const LOI_GIAM_THI: Record<MucGT, Record<NguCanhLoi, readonly string[]>> = {
  nb: { // Tí — hiền, nghiêm nhẹ
    ngauNhien: ['Câu này dễ mà, đọc kĩ vào.', 'Từ từ thôi, đọc hết đề đã.', 'Nhớ lại bài hôm trước xem.', 'Gạch chân chữ quan trọng đi.', 'Bình tĩnh, câu này nằm trong sách.', 'Tí đang xem đấy nhé.', 'Đọc kĩ từng phương án.', 'Câu dễ thì đừng để mất điểm.', 'Hừ, đừng chọn theo cảm tính.'],
    cho: ['Còn ngồi nghĩ à?', 'Câu này dễ mà, chọn đi em.'],
    dongHo: ['Câu dễ mà lâu thế?'],
    voi: ['Bấm nhanh thế, đã đọc đề chưa?', 'Từ từ, đọc đề đã nào.'],
    sai: ['Học với hành!', 'Ôi, câu dễ thế mà.', 'Đọc lại lí thuyết nhé.'],
    sai2: ['Làm nên trò trống gì không đây?', 'Hai câu liền rồi, chậm lại nào.'],
    dung: ['Giỏi!', 'Đúng rồi, cứ thế!', 'Chuẩn!'],
    combo: ['Giỏi lắm, giữ nhịp nhé!'],
    xong: ['Xong chặng. Tí khen!'],
  },
  th: { // Cô Cốc — chỉn chu, đeo kính
    ngauNhien: ['Hừ.', 'Hiểu bản chất, đừng học vẹt.', 'Phản ứng xảy ra vì sao, nghĩ đi.', 'Đề hỏi tăng dần hay giảm dần?', 'Chú ý chữ «không» trong đề.', 'Viết phương trình ra nháp đi.', 'Cô không thích đoán mò.', 'So sánh thì phải có lí do.', 'Đọc chậm, hiểu rồi hãy chọn.'],
    cho: ['Còn ngồi nghĩ à?', 'Nghĩ lâu quá, bản chất là gì?'],
    dongHo: ['Thời gian không chờ em đâu.'],
    voi: ['Bấm nhanh thế, đã đọc đề chưa?', 'Chưa hiểu đã chọn à?'],
    sai: ['Hừ. Học với hành!', 'Thuộc mà chưa hiểu rồi.', 'Xem lại bản chất đi em.'],
    sai2: ['Làm nên trò trống gì không đây?', 'Hai câu rồi. Ôn lại lí thuyết đi.'],
    dung: ['Được, hiểu đúng bản chất.', 'Tốt.', 'Đúng. Nhớ lí do nhé.'],
    combo: ['Ừ, khá đấy.'],
    xong: ['Xong chặng. Cô ghi nhận.'],
  },
  vd: { // Chú Tam — kỹ tính, bảng kẹp
    ngauNhien: ['Hừ.', 'Viết ra nháp, đừng tính nhẩm.', 'Đổi đơn vị chưa đấy?', 'Bảo toàn nguyên tố đi.', 'Số mol trước, khối lượng sau.', 'Chú đang ghi đấy.', 'Kiểm tra lại phép tính.', 'Dữ kiện nào chưa dùng?', 'Làm cẩn thận, đừng ẩu.'],
    cho: ['Còn ngồi nghĩ à?', 'Tính đến đâu rồi?'],
    dongHo: ['Quá giờ rồi đấy.'],
    voi: ['Bấm nhanh thế, đã đọc đề chưa?', 'Chưa tính xong đã bấm?'],
    sai: ['Hừ. Học với hành!', 'Sai phép tính rồi.', 'Ẩu quá. Tính lại đi.'],
    sai2: ['Làm nên trò trống gì không đây?', 'Hai câu liền. Chú ghi sổ đấy.'],
    dung: ['Được. Tích một cái.', 'Đúng. Làm thế là chắc.'],
    combo: ['Khá. Giữ tay cho chắc.'],
    xong: ['Đạt. Chú ghi vào bảng.'],
  },
  vdc: { // Giáo sư Kíp — khó tính nhất
    ngauNhien: ['Hừ.', 'Hừ. Để xem em có qua được câu này không.', 'Câu này không dành cho người vội.', 'Biện luận đủ trường hợp chưa?', 'Đồ thị nói gì, đọc kĩ vào.', 'Ta đã thấy nhiều em sai câu này.', 'Đừng tin vào cảm giác.', 'Đặt ẩn rồi lập hệ đi.', 'Kiểm lại từng dữ kiện.', 'Giáo sư đang quan sát.'],
    cho: ['Còn ngồi nghĩ à?', 'Hừ. Nghĩ ra chưa?'],
    dongHo: ['Thời gian là điểm số đấy.'],
    voi: ['Bấm nhanh thế, đã đọc đề chưa?', 'Câu này mà bấm vội à?'],
    sai: ['Hừ. Học với hành!', 'Ta ghi sổ rồi đấy.', 'Thiếu một trường hợp.'],
    sai2: ['Làm nên trò trống gì không đây?'],
    dung: ['Được. Lần này tạm chấp nhận.', 'Hừm. Không tệ.'],
    combo: ['Khá. Ta bắt đầu để ý em rồi.'],
    xong: ['Đạt. Giáo sư ghi nhận.'],
  },
}

// Xác suất nói theo ngữ cảnh (khi đã hết thời gian nghỉ). Mức càng cao càng hiếm khen.
const XAC_SUAT: Record<Exclude<NguCanhLoi, 'sai2' | 'xong' | 'dung'>, number> = { ngauNhien: 0.5, cho: 1, dongHo: 1, voi: 1, sai: 0.75, combo: 1 }
const XS_DUNG: Record<MucGT, number> = { nb: 0.6, th: 0.5, vd: 0.4, vdc: 0.3 }

/** Nhịp nói dùng chung cả phiên làm bài (màn câu dựng lại mỗi câu nên giữ ở đây): tối đa 1 lần mỗi 2–3 câu (sai2, xong luôn nói);
 *  không chen ngay sau khi em chạm phương án (1,5 giây). `phien` đổi ⇒ đếm lại từ đầu. */
export type NhipLoi = { phien: string; cau: string; nghi: number; daNoi: boolean; lanCham: number; saiLien: number; truoc: Record<string, number> }
export const taoNhip = (phien = ''): NhipLoi => ({ phien, cau: '', nghi: 0, daNoi: false, lanCham: -1e9, saiLien: 0, truoc: {} })

export function chonLoi(n: NhipLoi, muc: MucGT, k: NguCanhLoi, rng: () => number = Math.random): string | null {
  const ds = LOI_GIAM_THI[muc][k]
  if (!ds.length) return null
  let i = Math.floor(rng() * ds.length)
  if (ds.length > 1 && n.truoc[muc + k] === i) i = (i + 1) % ds.length
  n.truoc[muc + k] = i
  return ds[i] ?? null
}
export function cauMoi(n: NhipLoi, qid: string) { if (n.cau === qid) return; n.cau = qid; n.daNoi = false; if (n.nghi > 0) n.nghi-- }
export function suLoi(n: NhipLoi, muc: MucGT, k: NguCanhLoi, bay: number, rng: () => number = Math.random): string | null {
  const luon = k === 'sai2' || k === 'xong'
  if (!luon) {
    if (n.nghi > 0 || n.daNoi) return null
    if ((k === 'ngauNhien' || k === 'cho' || k === 'dongHo') && bay - n.lanCham < 1500) return null
    const p = k === 'dung' ? XS_DUNG[muc] : XAC_SUAT[k]
    if (rng() > p) return null
  }
  n.daNoi = true; n.nghi = 1 + (rng() < 0.5 ? 1 : 0)
  return chonLoi(n, muc, k, rng)
}
