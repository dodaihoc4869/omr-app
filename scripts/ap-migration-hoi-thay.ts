import { SQL_HOI_THAY_KIEM } from '../server/src/hoi-thay-kiem-chung-schema'
import { SQL_HOI_THAY_CAN_GIUP } from '../server/src/hoi-thay-can-giup-schema'
import { apSchemaHoiThay } from './hoi-thay-van-hanh.mjs'
// Import này tự chạy cổng ca thường trước khi trả hàm query. Không có --file/ngừng D1.
import { query } from './kiem-phat-hanh-chua.mjs'
// Còn chặng kiểm tra cá nhân đang làm ⇒ chờ hết rồi đẩy (CHO_KTCN_PHUT, mặc định 45 phút); bước này đứng ngay trước bước đẩy Worker.
const choMs = Math.max(0, Number(process.env.CHO_KTCN_PHUT ?? 45)) * 60_000
console.log(JSON.stringify(await apSchemaHoiThay(query, [...SQL_HOI_THAY_KIEM, ...SQL_HOI_THAY_CAN_GIUP], { choMs })))
