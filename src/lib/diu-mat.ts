// CHẾ ĐỘ "DỊU MẮT" của màn làm bài (thầy yêu cầu 28/09: nút phải LUÔN thấy ở cả dọc, ngang, máy tính — kể cả toàn màn hình).
// Bật ⇒ khung màn thi mang `data-diu-mat="bat"`, `src/screens/diu-mat.css` đổi bề mặt sang giấy ngà + chữ đậm (≥ 7:1).
// Màu đánh dấu đã chọn (primary) KHÔNG đổi. Lựa chọn nhớ trong localStorage của máy em (hỏng/chặn lưu thì chỉ mất tiện nhớ).
import { useCallback, useState } from 'react'

export const KHOA_DIU_MAT = 'ddh.lamBai.diuMat'

type Kho = Pick<Storage, 'getItem'> | null
const khoMacDinh = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function docDiuMat(kho: Kho = khoMacDinh()): boolean {
  try {
    return kho?.getItem(KHOA_DIU_MAT) === '1'
  } catch {
    return false
  }
}

export function ghiDiuMat(bat: boolean, kho: Pick<Storage, 'setItem'> | null = khoMacDinh()): void {
  try {
    kho?.setItem(KHOA_DIU_MAT, bat ? '1' : '0')
  } catch {
    /* chỉ mất tiện nhớ */
  }
}

/** [đang bật, đổi bật/tắt] — đọc một lần lúc dựng màn, ghi mỗi lần đổi. */
export function useDiuMat(): [boolean, () => void] {
  const [bat, setBat] = useState(() => docDiuMat())
  const doi = useCallback(() => {
    setBat((cu) => {
      ghiDiuMat(!cu)
      return !cu
    })
  }, [])
  return [bat, doi]
}
