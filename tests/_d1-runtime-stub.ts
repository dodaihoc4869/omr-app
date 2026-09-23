// WORKER STUB cho bộ test runtime D1 (RV06). Test chạy TRONG isolate workerd và dùng binding `DB` qua
// `cloudflare:test`; worker này chỉ để pool có một entry point hợp lệ — không phục vụ production.
export default {
  fetch(): Response {
    return new Response('cnh1-d1-runtime-test', { status: 200 })
  },
}
