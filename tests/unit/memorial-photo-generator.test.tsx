import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemorialPhotoGenerator } from '@/features/gen/ui/memorial-photo-generator'

// Mock dependencies
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

// Mock mutations with proper implementation
const mockGenerateMutation = vi.fn()
const mockSaveMutation = vi.fn()

vi.mock('@/features/gen/mutations', () => ({
  useGenerateMemorialPhotoMutation: vi.fn(() => mockGenerateMutation()),
  useSaveMemorialPhotoMutation: vi.fn(() => mockSaveMutation()),
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

describe('MemorialPhotoGenerator', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Reset mocks before each test
    mockGenerateMutation.mockReturnValue({
      mutate: vi.fn(),
      data: null,
      isPending: false,
      error: null,
    })

    mockSaveMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    })
  })

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  it('컴포넌트가 올바르게 렌더링되어야 한다', () => {
    renderWithQueryClient(<MemorialPhotoGenerator />)
    
    expect(screen.getByText('AI 영정 사진 변환')).toBeInTheDocument()
    expect(screen.getByText('증명사진이나 프로필 사진을 업로드하여 영정 사진으로 변환해보세요.')).toBeInTheDocument()
    expect(screen.getByText('이미지를 여기에 업로드하세요')).toBeInTheDocument()
    expect(screen.getByText('변환된 이미지가 여기에 표시됩니다')).toBeInTheDocument()
  })

  it('파일 선택 버튼이 올바르게 작동해야 한다', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<MemorialPhotoGenerator />)
    
    const fileInput = screen.getByRole('button', { name: /이미지 선택/i })
    expect(fileInput).toBeInTheDocument()
    
    await user.click(fileInput)
    // 파일 입력이 클릭되었는지 확인 (실제 파일 선택은 브라우저에서 처리)
  })

  it('파일이 선택되면 미리보기가 표시되어야 한다', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<MemorialPhotoGenerator />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByDisplayValue('')
    
    await user.upload(fileInput, file)
    
    // 미리보기 이미지가 표시되는지 확인
    await waitFor(() => {
      expect(screen.getByAltText('Preview')).toBeInTheDocument()
    })
  })

  it('파일 크기가 4MB를 초과하면 에러가 표시되어야 한다', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<MemorialPhotoGenerator />)
    
    // 4MB보다 큰 파일 생성
    const largeFile = new File(['x'.repeat(5 * 1024 * 1024)], 'large.jpg', { 
      type: 'image/jpeg' 
    })
    const fileInput = screen.getByDisplayValue('')
    
    await user.upload(fileInput, largeFile)
    
    await waitFor(() => {
      expect(screen.getByText('이미지 파일 크기는 4MB를 초과할 수 없습니다.')).toBeInTheDocument()
    })
  })

  it('파일이 선택되지 않으면 변환 버튼이 비활성화되어야 한다', () => {
    renderWithQueryClient(<MemorialPhotoGenerator />)
    
    const generateButton = screen.getByRole('button', { name: /변환하기/i })
    expect(generateButton).toBeDisabled()
  })

  it('파일이 선택되면 변환 버튼이 활성화되어야 한다', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<MemorialPhotoGenerator />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByDisplayValue('')
    
    await user.upload(fileInput, file)
    
    await waitFor(() => {
      const generateButton = screen.getByRole('button', { name: /변환하기/i })
      expect(generateButton).toBeEnabled()
    })
  })

  it('생성 중일 때 로딩 상태가 표시되어야 한다', () => {
    mockGenerateMutation.mockReturnValue({
      mutate: vi.fn(),
      data: null,
      isPending: true,
      error: null,
    })

    renderWithQueryClient(<MemorialPhotoGenerator />)
    
    expect(screen.getByText('생성 중...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /생성 중.../i })).toBeDisabled()
  })

  it('생성된 이미지가 표시되어야 한다', () => {
    const mockBase64Image = 'data:image/webp;base64,test'
    mockGenerateMutation.mockReturnValue({
      mutate: vi.fn(),
      data: { base64Image: mockBase64Image },
      isPending: false,
      error: null,
    })

    renderWithQueryClient(<MemorialPhotoGenerator />)
    
    expect(screen.getByAltText('Generated')).toBeInTheDocument()
    expect(screen.getByAltText('Generated')).toHaveAttribute('src', mockBase64Image)
  })

  it('에러가 발생하면 에러 메시지가 표시되어야 한다', () => {
    mockGenerateMutation.mockReturnValue({
      mutate: vi.fn(),
      data: null,
      isPending: false,
      error: { message: '생성 실패' },
    })

    renderWithQueryClient(<MemorialPhotoGenerator />)
    
    expect(screen.getByText('오류 발생')).toBeInTheDocument()
    expect(screen.getByText('생성 실패')).toBeInTheDocument()
  })
})
