/** KIỂU DÙNG CHUNG + HỢP ĐỒNG PROP của Đảo thần thú bản mới (docs/hop-dong-dao-than-thu-prop-2109.md). */
import type {Mastery,Mode,Question} from '../core'
import type {ShieldState} from '../shields'
import type {HinhAnh} from '../../../data/examContent'

/** Phần của `Profile` (Game.tsx / lệnh `profile`) mà đảo đọc. */
export interface DaoProfile{nickname?:string;pet:string;choice:boolean;cap:number;exp:number;wallet:number;mastery:Mastery[];shields?:ShieldState
 /** Mảnh khiên rèn từ EXP mới — máy chủ trả trong `visible(profile)`. */
 khienRen?:{manh:number;daRen?:number;chuaDung?:number;conLai?:number;moiKhien:number}
 /** THẦN THÚ MỖI NGÀY (Điều 1, Đợt 1): hôm nay thú đã hấp thụ `da` EXP; hôm nay được ăn tối đa `tran` (200 khi đạt nhiệm vụ ngày · 120 khi có học · 0 khi chưa học). `lyDo` = vì sao lần nạp gần nhất bị chặn:
  *  'no' (đủ trần) · 'chua_hoc' · 'het_ong' · 'cap_toi_da' · null. Máy chủ cũ KHÔNG có trường này ⇒ màn ẩn thanh. */
 hapThuHomNay?:{da:number;tran:number;lyDo?:string|null;
  /** Luật "có học" (Code 1): số câu KHÁC NHAU hôm nay + số câu cần (4) — máy chủ mới; vắng ⇒ màn bỏ vế đếm. */
  soCauHomNay?:number;canCau?:number}}
/** EXP MỚI (nguồn /hs/ke-hoach-ngay, cổng HS đưa xuống). Vắng ⇒ ẩn, không bịa số. */
export interface DaoExp{homNay:number;manhKhien?:{manh:number;moiKhien:number;khienConLai?:number}|null}
/** Vai của một ải = đúng suất của `chooseSession`: 2 yếu · 1 tới hạn · lấp · 1 thử thách. */
export type VaiAi='yeu'|'toi_han'|'lap'|'thu_thach'
export interface CauDao extends Question{role?:VaiAi
 /** Đợt 2 (máy chủ mới): vai THẬT của ải — thêm 'moi' (dạng mới) và 'trum' (Lượt trùm); `role` giữ tập cũ cho máy em đang sống. */
 roleV2?:string}
export interface LyDoThuong{moc:0|1|2|3;exp:number;chu:string}
export interface DaoKetQua{ok:boolean;error?:string;message?:string;missing?:number;remaining?:number;dailyUsed?:number
 /** Trần lượt game/ngày do máy chủ nói (chỉ-thêm); máy chủ cũ không gửi ⇒ lời hết lượt không nói số. */
 tranNgay?:number
 suggestions?:{title:string;source:string;part:string}[]
 id?:string;mode?:Mode;questions?:CauDao[];answered?:{attempt:{qid:string;correct:boolean};correct:boolean;answer:string;solution:unknown;reward:number;stage:number;solutionImages:HinhAnh[]}[]
 correct?:boolean;answer?:string;solution?:unknown;reward?:number;stage?:number;solutionImages?:HinhAnh[];lyDoThuong?:LyDoThuong
 /** Đợt 2 (chỉ-thêm): tóm tắt lượt trong ngày · màn hết lượt (`het`) + "Mai thú chờ em" (`maiCho`) — đọc chặt bằng `docLuotNgay`/`docMaiCho`. */
 luot?:unknown;maiCho?:unknown;het?:boolean
 /** Thưởng ĐÁNG LẼ của câu — chỉ có khi trần 120 EXP/ngày từ game đã CẮT `reward` (máy chủ Đợt 1). */
 thuongGoc?:number
 dang?:{key:string;ten:string;chuong:string}[]
 /** Cửa hàng phụ kiện MỞ cho em này (cờ `shop_phu_kien` bật VÀ em thuộc `chiSbd` nếu có). Vắng / false ⇒ KHÔNG có cửa vào. Máy chủ gửi kèm `recommendations` — không thêm lượt gọi. */
 shopBat?:boolean}
/** = `request` của Game.tsx: ném Error khi máy chủ trả `ok:false`, tự cập nhật profile. */
export type DaoCall=(action:string,data?:Record<string,unknown>)=>Promise<DaoKetQua>
export type ManDao='dao'|'so-tay'|'tui-do'
export interface DaoThanThuProps{sbd:string;/** Token phiên game (chỉ để nối Cửa hàng phụ kiện thật). */token?:string;/** Cửa vào từ ngoài (Bảng nhiệm vụ): mở thẳng Cửa hàng khi máy chủ báo `shopBat`. */moShopLucDau?:boolean;profile:DaoProfile;doanMo:boolean;call:DaoCall;exp?:DaoExp|null;chuoiNgay?:number;tasks?:{id:string;dang:string}[];moiDoan?:boolean
 onMoDoan:()=>void;onMoVoDai?:()=>void;onMoTienBo?:()=>void;onDong:()=>void}
