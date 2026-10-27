import { SQL_HOI_THAY_KIEM } from '../server/src/hoi-thay-kiem-chung-schema'
import { SQL_HOI_THAY_CAN_GIUP } from '../server/src/hoi-thay-can-giup-schema'
import { apSchemaHoiThay } from './hoi-thay-van-hanh.mjs'
// Import này tự chạy cổng ca thường trước khi trả hàm query. Không có --file/ngừng D1.
import { query } from './kiem-phat-hanh-chua.mjs'
import { xetChoKtcn } from './bo-cho-ktcn.mjs'
// Còn chặng kiểm tra cá nhân đang làm ⇒ chờ hết rồi đẩy (CHO_KTCN_PHUT, mặc định 45 phút); bước này đứng ngay trước bước đẩy Worker.
const choMs = Math.max(0, Number(process.env.CHO_KTCN_PHUT ?? 45)) * 60_000
// 27/10 (thầy duyệt): bản mới không đụng làn kiểm tra cá nhân/schema/wrangler so với Worker đang sống ⇒ không chờ chặng (scripts/bo-cho-ktcn.mjs, scripts/lan-ktcn.json).
const { cho } = await xetChoKtcn()
console.log(JSON.stringify(await apSchemaHoiThay(query, [...SQL_HOI_THAY_KIEM, ...SQL_HOI_THAY_CAN_GIUP], { choMs, boChoKtcn: !cho })))
