// Mã ca + link mời — dùng chung cho ca kiểm tra (ExamSetupScreen) và bài tập
// về nhà (GiaoBaiTap). Tách khỏi màn hình để hai nơi không tự sinh mã theo hai
// kiểu khác nhau.

export function randomSessionCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** Link mời NGẮN: <origin>/omr-app/t/<mã ca> (public/404.html chuyển hướng về
 * ?examCode=…; máy em lấy link Apps Script từ public/cau-hinh.json). Chỉ dùng
 * link ngắn khi link trong cau-hinh.json ĐÚNG BẰNG link thầy đang dùng — lệch
 * thì quay về link dài có &api=… để em không nộp nhầm chỗ. */
export async function taoLinkMoi(maCa: string, scriptUrl: string): Promise<string> {
  const base = import.meta.env.BASE_URL
  const linkDai = `${location.origin}${base}?examCode=${maCa}&api=${encodeURIComponent(scriptUrl)}`
  try {
    const res = await fetch(`${base}cau-hinh.json`, { cache: 'no-cache' })
    if (!res.ok) return linkDai
    const cfg = (await res.json()) as { scriptUrl?: string }
    if ((cfg.scriptUrl || '').trim() !== scriptUrl) return linkDai
    return `${location.origin}${base}t/${maCa}`
  } catch {
    return linkDai
  }
}

// ---------------------------------------------------------------------------
// LINK RIÊNG CỦA EM VÀ CỦA PHỤ HUYNH — MỘT NGUỒN SỰ THẬT.
//
// Hai app đó đã tách khỏi repo này sang repo riêng (TACHAPPHSPH.md), nên link
// riêng KHÔNG còn nằm cùng gốc với app thầy nữa. Chừng nào hai app mới chưa
// chạy thật thì để RỖNG: app ẩn hẳn nút copy link thay vì đưa thầy một link
// chết để gửi Zalo. Dựng xong hai app thì điền đúng gốc vào đây, một chỗ duy
// nhất, rồi build lại — nút copy tự hiện lại.
//
// Ví dụ khi đã có: 'https://dodaihoc4869.github.io/hs-app/'
// ---------------------------------------------------------------------------
export const GOC_APP_HS: string = ''
export const GOC_APP_PH: string = ''

/** Link riêng đầy đủ để gửi Zalo. Rỗng = app của vai đó chưa dựng xong. */
export function linkRiengVai(vai: 'hs' | 'ph', token: string): string {
  const goc = vai === 'hs' ? GOC_APP_HS : GOC_APP_PH
  if (!goc || !token) return ''
  return `${goc.replace(/\/?$/, '/')}${vai}/${token}`
}

/** Tin nhắn thầy gửi kèm link riêng. Viết theo đúng quy tắc: vào thẳng việc,
 * xưng Thầy, không lời chào/chúc. */
export function tinGuiLinkCaiApp(link: string, hoTen: string, vai: 'hs' | 'ph'): string {
  if (vai === 'ph') {
    return `Đây là link riêng xem kết quả của em ${hoTen}: ${link}\nBấm link, rồi bấm Cài đặt để có biểu tượng trên màn hình. Lần sau mở thẳng, không cần link. Link này chỉ dùng cho một người, đừng chuyển tiếp.`
  }
  return `Link riêng của em ${hoTen}: ${link}\nBấm link, rồi bấm Cài đặt để có biểu tượng trên màn hình. Lần sau mở thẳng, không cần link. Không đưa link này cho bạn khác.`
}
