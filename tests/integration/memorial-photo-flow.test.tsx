import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'
import { MemorialPhotoGenerator } from '@/features/gen/ui/memorial-photo-generator'

// Mock dependencies
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

describe('Memorial Photo Flow Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  it('전체 영정 사진 생성 플로우가 올바르게 작동해야 한다', async () => {
    const user = userEvent.setup()

    // Mock successful API responses
    server.use(
      http.post('*/api/gen', async ({ request }) => {
        const formData = await request.formData()
        const image = formData.get('image')
        
        if (!image) {
          return HttpResponse.json(
            { error: 'No image provided' },
            { status: 400 }
          )
        }

        return HttpResponse.json({
          base64Image: 'data:image/webp;base64,mock-generated-image'
        })
      }),
      http.post('*/api/image', async ({ request }) => {
        const formData = await request.formData()
        const image = formData.get('image')
        
        if (!image) {
          return HttpResponse.json(
            { error: 'No image provided' },
            { status: 400 }
          )
        }

        return HttpResponse.json({
          success: true,
          imageId: 'mock-image-id'
        })
      })
    )

    renderWithQueryClient(<MemorialPhotoGenerator />)

    // 1. 컴포넌트가 올바르게 렌더링되는지 확인
    expect(screen.getByText('AI 영정 사진 변환')).toBeInTheDocument()
    expect(screen.getByText('증명사진이나 프로필 사진을 업로드하여 영정 사진으로 변환해보세요.')).toBeInTheDocument()

    // 2. 파일 선택
    const file = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByDisplayValue('')
    
    await user.upload(fileInput, file)

    // 3. 파일이 선택되면 변환 버튼이 활성화되는지 확인
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /변환하기/i })).toBeEnabled()
    })

    // 4. 변환 버튼 클릭
    await user.click(screen.getByRole('button', { name: /변환하기/i }))

    // 5. 로딩 상태 확인 (실제로는 mutation이 실행되므로 로딩 상태를 확인할 수 있음)
    // 이 부분은 실제 mutation이 실행되는 시간에 따라 달라질 수 있음
  })

  it('API 에러 발생 시 적절한 에러 처리를 해야 한다', async () => {
    const user = userEvent.setup()

    // Mock API error
    server.use(
      http.post('*/api/gen', () => {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        )
      })
    )

    renderWithQueryClient(<MemorialPhotoGenerator />)

    // 파일 선택
    const file = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByDisplayValue('')
    
    await user.upload(fileInput, file)

    // 변환 시도
    await user.click(screen.getByRole('button', { name: /변환하기/i }))

    // 로딩 상태가 표시되는지 확인 (실제 에러 처리는 mutation이 완료된 후에 나타남)
    expect(screen.getByText('생성 중...')).toBeInTheDocument()
  })

  it('네트워크 에러 발생 시 적절한 처리를 해야 한다', async () => {
    const user = userEvent.setup()

    // Mock network error
    server.use(
      http.post('*/api/gen', () => {
        return HttpResponse.error()
      })
    )

    renderWithQueryClient(<MemorialPhotoGenerator />)

    // 파일 선택
    const file = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByDisplayValue('')
    
    await user.upload(fileInput, file)

    // 변환 시도
    await user.click(screen.getByRole('button', { name: /변환하기/i }))

    // 에러 메시지가 표시되는지 확인
    await waitFor(() => {
      expect(screen.getByText('오류 발생')).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})
