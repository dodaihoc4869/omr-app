// PHẠM VI SGK cho Hỏi Thầy (thầy 21/10, kèm ảnh Câu 33 C4H11N: "chỉ được phép trả lời kiến thức phạm vi sách giáo khoa 10, 11, 12 kết nối tri thức
// với cuộc sống, không được phép trả lời ngoài phạm vi. Ví dụ amine bậc 2 và bậc 3 không phản ứng theo sách giáo khoa thì phải trả lời cho chuẩn").
// Hai lớp: (1) mục PHẠM VI SGK trong lời dặn hệ thống; (2) chốt chặn máy chủ `chanNgoaiSgk` bỏ CÂU chứa kiến thức ngoài chương trình
// (mô hình lite không phải lúc nào cũng theo lời dặn). Thuật ngữ đã có trong đề hoặc lời giải của Thầy thì không chặn.

export const PHAM_VI_SGK = `PHẠM VI SGK (BẮT BUỘC, Thầy chốt 21/10)
- Mọi KIẾN THỨC Hoá (phản ứng, điều kiện, hiện tượng, tính chất, quy tắc, khái niệm, cách gọi tên) chỉ lấy trong SGK Hoá học 10, 11, 12 bộ "Kết nối tri thức với cuộc sống" (chương trình GDPT 2018). Điều SGK không viết thì KHÔNG nêu, kể cả khi đúng ở bậc đại học.
- Không giải thích bằng cơ chế phản ứng (carbocation, gốc tự do trung gian, SN1, SN2, trạng thái chuyển tiếp); không đặt tên bước hay nấc là "Cơ chế".
- SGK chỉ nêu một phản ứng cho một nhóm chất thì các nhóm khác coi là KHÔNG phản ứng theo chương trình. Không mô tả sản phẩm của nhóm khác bằng kiến thức ngoài SGK.
- Ví dụ Thầy chốt: nitrous acid (HNO2) theo SGK chỉ phản ứng với amine bậc một: alkylamine bậc một ở nhiệt độ thường tạo alcohol và giải phóng khí N2; aniline ở 0–5 °C tạo muối diazonium. Amine bậc hai, bậc ba: theo SGK coi là KHÔNG phản ứng với HNO2, nên không có khí. KHÔNG nhắc "nitroso", "chất dạng dầu", "muối diazonium phân huỷ".
- KĨ THUẬT GIẢI (tỉ lệ mol, bảo toàn nguyên tố, bảo toàn khối lượng, bảo toàn electron, bảo toàn điện tích, quy đổi, giá trị trung bình, độ bất bão hoà, đếm đồng phân có hệ thống) là cách giải của Thầy, được dùng. Giới hạn SGK áp cho KIẾN THỨC Hoá, không áp cho kĩ thuật tính.
- Em hỏi kiến thức ngoài SGK về chính câu này: lienQuan = true, yChinh "Phần này nằm ngoài SGK, đề thi không hỏi. Em chỉ cần nhớ: …" rồi nêu đúng điều SGK viết.
- BỘ CHÌA KHOÁ, THẦY ĐÃ GIẢNG, HỌC LIỆU trong DỮ LIỆU CÂU có chỗ trái mục này thì theo mục này.`

/** Câu trả lời bị chốt chặn bỏ hết (mô hình chỉ viết kiến thức ngoài SGK) — KHÔNG phải câu hỏi ngoài phạm vi. */
export const CAU_NGOAI_SGK = 'Câu trả lời tự động lần này đi ra ngoài SGK nên Thầy không gửi. Em hỏi lại cụ thể hơn, hoặc mang lên lớp hỏi Thầy nhé.'

const BAC_CAO = '(?:bậc\\s*(?:hai|ba|II|III|2|3)|R2NH|R3N|secondary|tertiary)'
/** Mỗi mục: [mẫu tìm trong câu, mẫu "đã có trong nguồn" — nguồn (đề / lời giải Thầy) có thì không chặn]. */
const NGOAI_SGK: [RegExp, RegExp][] = [
  [/nitroso|N\s*[–-]\s*N\s*=\s*O/i, /nitroso/i],
  [/carbocation|cacbocation|cacbocation/i, /carbocation|cacbocation/i],
  // SN1/SN2 PHÂN BIỆT HOA THƯỜNG: "Sn2+" (ion thiếc, dãy điện hoá) là kiến thức SGK.
  [/(?<![\p{L}\d])SN\s?[12](?![\p{L}\d+])/u, /(?<![\p{L}\d])SN[12](?![\p{L}\d+])/u],
  [/trạng thái chuyển tiếp/iu, /trạng thái chuyển tiếp/iu],
  [/gốc tự do trung gian/i, /gốc tự do/i],
  // Chỉ cơ chế PHẢN ỨNG hữu cơ; "cơ chế giặt rửa của xà phòng", "cơ chế ăn mòn điện hoá" là chữ SGK ⇒ giữ.
  [/cơ chế\s+(?:của\s+)?(?:phản ứng|thế|cộng|tách|gốc|electrophin|nucleophin|ái điện|ái nhân|SN|E[12])/iu, /cơ chế\s+(?:của\s+)?(?:phản ứng|thế|cộng|tách|gốc)/iu],
  [/diazoni(?:um)?[^.;\n]{0,60}phân hu[ỷy]|phân hu[ỷy][^.;\n]{0,30}diazoni/iu, /phân hu[ỷy][^.;\n]{0,30}diazoni|diazoni(?:um)?[^.;\n]{0,60}phân hu[ỷy]/iu],
  [/chất (?:lỏng )?dạng dầu|chất (?:lỏng )?màu vàng[^.;\n]{0,20}(?:dầu|nitro)/i, /dạng dầu/i],
]
const RE_BAC_CAO_HNO2 = new RegExp(`${BAC_CAO}[^.;\\n]{0,80}(?:HNO2|HONO|nitrous)|(?:HNO2|HONO|nitrous)[^.;\\n]{0,80}${BAC_CAO}`, 'iu')
const RE_PHU_DINH = /không\s+(?:phản ứng|tác dụng|giải phóng|tạo|có)|coi là không|chỉ\s+(?:amine\s+)?bậc\s*(?:một|I|1)/iu

/** Một câu có kiến thức ngoài SGK không (so với nguồn của câu: đề + lời giải Thầy). */
export function ngoaiSgk(cau: string, nguon = ''): boolean {
  if (NGOAI_SGK.some(([tim, coSan]) => tim.test(cau) && !coSan.test(nguon))) return true
  // Amine bậc hai / ba "phản ứng với HNO2 tạo …": trái SGK (trừ câu phủ định "không phản ứng", "chỉ bậc một").
  return RE_BAC_CAO_HNO2.test(cau) && !RE_PHU_DINH.test(cau) && !RE_BAC_CAO_HNO2.test(nguon)
}

/** Bỏ từng CÂU (theo dòng, rồi theo dấu kết câu) có kiến thức ngoài SGK. Bỏ hết ⇒ ''. */
export function chanNgoaiSgk(chu: string, nguon = ''): string {
  if (!chu) return chu
  return chu.split('\n').map((d) => d.split(/(?<=[.!?;])\s+/).filter((c) => !ngoaiSgk(c, nguon)).join(' ').trim()).filter(Boolean).join('\n')
}
