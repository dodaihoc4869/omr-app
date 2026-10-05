// THAY vài hàm đọc IndexedDB của app thầy trong BẢN BUILD CHỤP ẢNH: kho đề giả, địa chỉ máy chủ giả, mã thầy giả. Phần còn lại giữ nguyên bản thật.
export * from '../../../src/lib/exam-db'
import { KHO } from './may-thay'
export async function loadExamSources() { return KHO }
export async function loadScriptUrl() { return 'https://may-chu-gia.example.com' }
export async function loadTeacherSecret() { return 'ma-thay-gia' }
