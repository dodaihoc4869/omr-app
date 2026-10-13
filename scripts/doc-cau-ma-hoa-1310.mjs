// CHỈ ĐỌC (Claude 13/10, thầy: "Bạn tự làm hết nhé") — đọc MỘT câu trong kho để tự kiểm đáp án câu đang bị nghi, KHÔNG để đề/đáp án lộ ra log:
// nội dung mã hoá AES-256-GCM, khoá AES bọc RSA-OAEP bằng khoá công khai scripts/khoa/doc-cau-1310.pub.pem (khoá riêng chỉ ở máy phiên Claude).
import { readFileSync } from 'node:fs'
import { publicEncrypt, randomBytes, createCipheriv, constants } from 'node:crypto'
import { query } from './kiem-phat-hanh-chua.mjs'
const QID = 'DH-12-C1-B1-P2-II-15'
const rows = await query(`SELECT q.qid,q.ma_de,q.version,q.json,(SELECT json_group_array(json_object('y',o.y,'vkn',o.vkn_json)) FROM omni_q o WHERE o.qid=q.qid) omni FROM game_v2_question q WHERE q.qid='${QID}'`)
const ban = Buffer.from(JSON.stringify(rows), 'utf8')
const k = randomBytes(32), iv = randomBytes(12), c = createCipheriv('aes-256-gcm', k, iv)
const ma = Buffer.concat([c.update(ban), c.final()]), tag = c.getAuthTag()
const boc = publicEncrypt({ key: readFileSync('scripts/khoa/doc-cau-1310.pub.pem'), padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, k)
console.log('SO_DONG', rows.length)
console.log('MA_HOA ' + JSON.stringify({ boc: boc.toString('base64'), iv: iv.toString('base64'), tag: tag.toString('base64'), ma: ma.toString('base64') }))
