// Nhập trước để giữ thứ tự khởi tạo của các module máy chủ hiện tại.
import '../server/src/index'
import { giaoVanHanh } from './chua-giao-van-hanh'
export default { fetch: giaoVanHanh }
