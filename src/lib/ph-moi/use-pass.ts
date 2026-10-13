import { useSyncExternalStore } from 'react'
import { docPass, theoDoiPass } from '../ph-token'

const passMayChu = () => ''
/** Liên kết đổi ⇒ React dựng phiên đọc mới ngay; không phải chờ nhịp nền. */
export const usePassPhuHuynh = (): string => useSyncExternalStore(theoDoiPass, docPass, passMayChu)
