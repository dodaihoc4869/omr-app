// CHẶN MÀN TRẮNG.
//
// React gỡ toàn bộ cây khi một component ném lỗi lúc render. Không có lớp chắn
// thì thầy chỉ thấy màn trắng: không biết hỏng ở đâu, không có đường quay lại,
// và nếu đang giữa buổi thì mất luôn buổi đó.
//
// Lớp này bắt lỗi, hiện đúng một màn: nói hỏng ở đâu, cho thông báo lỗi để chụp
// gửi lại, và hai đường thoát — về màn chính (không mất dữ liệu) hoặc tải lại.
// Lỗi vẫn được in ra console cho lần gỡ sau.
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Tên màn/khu vực để câu báo lỗi nói đúng chỗ. */
  o?: string
  /** Đường thoát: gọi khi thầy bấm "Về màn chính". Không có thì chỉ hiện nút tải lại. */
  veManChinh?: () => void
}
interface State {
  loi: Error | null
}

export default class ChanLoi extends Component<Props, State> {
  state: State = { loi: null }

  static getDerivedStateFromError(loi: Error): State {
    return { loi }
  }

  componentDidCatch(loi: Error, thongTin: ErrorInfo) {
    console.error('[ChanLoi]', this.props.o ?? 'app', loi, thongTin.componentStack)
  }

  render() {
    const { loi } = this.state
    if (!loi) return this.props.children

    const nut: React.CSSProperties = {
      minHeight: 44,
      padding: '0 var(--k5)',
      borderRadius: 'var(--bo-tron)',
      fontFamily: 'var(--sans)',
      fontSize: 'var(--cx-2)',
      fontWeight: 700,
      border: 'none',
      cursor: 'pointer',
    }
    return (
      <div
        role="alert"
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)' }}
      >
        <div style={{ background: 'var(--the)', borderRadius: 'var(--bo-3)', boxShadow: 'var(--bong-1)', padding: 'var(--k5)', maxWidth: 520, width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--k3)' }}>
          <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)' }}>
            Màn {this.props.o ?? 'này'} gặp lỗi
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--nhat)' }}>
            Dữ liệu đã lưu vẫn còn nguyên. Thầy quay về màn chính rồi vào lại; còn lỗi thì chụp dòng dưới gửi lại.
          </div>
          <pre
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'var(--cx-1)',
              background: 'var(--the-2)',
              color: 'var(--do)',
              borderRadius: 'var(--bo-1)',
              padding: 'var(--k3)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 180,
              overflow: 'auto',
            }}
          >
            {loi.message || String(loi)}
          </pre>
          <div className="flex" style={{ gap: 'var(--k3)', flexWrap: 'wrap' }}>
            {this.props.veManChinh && (
              <button
                type="button"
                style={{ ...nut, background: 'var(--g1)', color: 'var(--giay)' }}
                onClick={() => {
                  this.setState({ loi: null })
                  this.props.veManChinh?.()
                }}
              >
                Về màn chính
              </button>
            )}
            <button type="button" style={{ ...nut, background: 'var(--the-2)', color: 'var(--muc)' }} onClick={() => window.location.reload()}>
              Tải lại app
            </button>
          </div>
        </div>
      </div>
    )
  }
}
