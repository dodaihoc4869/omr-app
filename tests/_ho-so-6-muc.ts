// Trợ giúp test cho tấm "Hồ sơ làm bài" bố cục 6 mức (thầy duyệt bản vẽ docs/ban-ve-ho-so-em-2210, 22/10): khối cũ (Nhịp học 14 ngày, Sáu tín hiệu,
// Số giây theo mức độ câu, Câu đúng · Câu đã ôn, Toàn bộ sổ) nằm trong NGĂN GẬP và chỉ dựng khi mở; "Từng lượt" luôn hiện (không còn thẻ "Toàn bộ lịch sử").
import { fireEvent, waitFor } from '@testing-library/react'

/** Chờ tấm vẽ xong lịch sử (khối "Từng lượt" — phụ huynh: "Lượt sai gần đây"; sổ rỗng: khung "Chưa có lượt làm câu nào"). */
export async function choTamXong(tam: HTMLElement): Promise<void> {
  await waitFor(() => {
    if (!tam.querySelector('#hsv-lan, .hsv-trong')) throw new Error('tấm chưa vẽ xong lịch sử')
  })
}

/** Mở các ngăn gập (khớp `ten`, vắng ⇒ mọi ngăn). */
export function moGap(tam: HTMLElement, ten?: RegExp): void {
  for (const s of [...tam.querySelectorAll<HTMLElement>('.hsv-gap > details > summary')]) {
    const d = s.parentElement as HTMLDetailsElement
    if (d.open || (ten && !ten.test(s.textContent ?? ''))) continue
    d.open = true
    fireEvent(d, new Event('toggle'))
  }
}

/** Chờ hồ sơ thái độ về (ngăn "Sáu tín hiệu" chỉ có khi đã có dữ liệu) rồi mở mọi ngăn gập. */
export async function choVaMoGap(tam: HTMLElement): Promise<void> {
  await waitFor(() => {
    if (![...tam.querySelectorAll('.hsv-gap summary')].some((x) => /^Sáu tín hiệu/.test(x.textContent ?? ''))) throw new Error('chưa có hồ sơ thái độ')
  })
  moGap(tam)
}
