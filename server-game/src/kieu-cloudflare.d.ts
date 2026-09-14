/**
 * Vài kiểu của Cloudflare Workers mà lib "WebWorker" không có sẵn.
 * Khai tay ở đây thay vì thêm gói @cloudflare/workers-types — máy chủ thi
 * `server/` cũng làm đúng vậy, giữ cho hai máy chủ cùng một lối.
 */
export {}

declare global {
  interface DurableObjectState {
    readonly id: DurableObjectId
    blockConcurrencyWhile<T>(fn: () => Promise<T>): Promise<T>
  }
  interface DurableObjectId { toString(): string }
  interface DurableObjectStub { fetch(req: Request): Promise<Response> }
  interface DurableObjectNamespace {
    idFromName(name: string): DurableObjectId
    get(id: DurableObjectId): DurableObjectStub
  }
  class WebSocketPair {
    0: WebSocket
    1: WebSocket
  }
  interface WebSocket {
    accept(): void
  }
  interface ResponseInit {
    webSocket?: WebSocket | null
  }
}
