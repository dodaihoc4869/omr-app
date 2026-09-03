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
