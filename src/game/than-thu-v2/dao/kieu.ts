/** KIỂU DÙNG CHUNG + HỢP ĐỒNG PROP của Đảo thần thú bản mới (docs/hop-dong-dao-than-thu-prop-2109.md). */
import type {Mastery,Mode,Question} from '../core'
import type {ShieldState} from '../shields'
import type {HinhAnh} from '../../../data/examContent'

/** Phần của `Profile` (Game.tsx / lệnh `profile`) mà đảo đọc. */
export interface DaoProfile{nickname?:string;pet:string;choice:boolean;cap:number;exp:number;wallet:number;mastery:Mastery[];shields?:ShieldState
 /** Mảnh khiên rèn từ EXP mới — máy chủ trả trong `visible(profile)`. */
 khienRen?:{manh:number;daRen?:number;chuaDung?:number;conLai?:number;moiKhien:number}}
/** EXP MỚI (nguồn /hs/ke-hoach-ngay, cổng HS đưa xuống). Vắng ⇒ ẩn, không bịa số. */
export interface DaoExp{homNay:number;manhKhien?:{manh:number;moiKhien:number;khienConLai?:number}|null}
/** Vai của một ải = đúng suất của `chooseSession`: 2 yếu · 1 tới hạn · lấp · 1 thử thách. */
export type VaiAi='yeu'|'toi_han'|'lap'|'thu_thach'
export interface CauDao extends Question{role?:VaiAi}
export interface LyDoThuong{moc:0|1|2|3;exp:number;chu:string}
export interface DaoKetQua{ok:boolean;error?:string;message?:string;missing?:number;remaining?:number;dailyUsed?:number
 suggestions?:{title:string;source:string;part:string}[]
 id?:string;mode?:Mode;questions?:CauDao[];answered?:{attempt:{qid:string;correct:boolean};correct:boolean;answer:string;solution:unknown;reward:number;stage:number;solutionImages:HinhAnh[]}[]
 correct?:boolean;answer?:string;solution?:unknown;reward?:number;stage?:number;solutionImages?:HinhAnh[];lyDoThuong?:LyDoThuong
 dang?:{key:string;ten:string;chuong:string}[]}
/** = `request` của Game.tsx: ném Error khi máy chủ trả `ok:false`, tự cập nhật profile. */
export type DaoCall=(action:string,data?:Record<string,unknown>)=>Promise<DaoKetQua>
export type ManDao='dao'|'so-tay'|'tui-do'
export interface DaoThanThuProps{sbd:string;profile:DaoProfile;doanMo:boolean;call:DaoCall;exp?:DaoExp|null;chuoiNgay?:number;tasks?:{id:string;dang:string}[];moiDoan?:boolean
 onMoDoan:()=>void;onMoVoDai?:()=>void;onMoTienBo?:()=>void;onDong:()=>void}
