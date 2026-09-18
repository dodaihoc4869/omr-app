/** Giới hạn cả tác vụ, kể cả khi trình duyệt không kết thúc lời hứa đang chờ. */
export async function voiHanCho<T>(task: Promise<T>, ms: number, message: string, abort?: () => void): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([task, new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(message))
        abort?.()
      }, ms)
    })])
  } finally { clearTimeout(timer) }
}
