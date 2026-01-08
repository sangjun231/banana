import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadImageMO, downloadImagePC } from '@/lib/utils'

// DOM 환경 모킹
const mockCreateElement = vi.fn()
const mockAppendChild = vi.fn()
const mockRemoveChild = vi.fn()
const mockClick = vi.fn()

describe('Download Functions', () => {
  beforeEach(() => {
    // DOM 메서드들 모킹
    vi.stubGlobal('document', {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    })

    // fetch 모킹
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('downloadImageMO', () => {
    it('성공적으로 이미지를 다운로드해야 한다', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' })
      const mockUrl = 'blob:mock-url'
      
      // fetch 모킹
      vi.mocked(fetch).mockResolvedValue({
        blob: vi.fn().mockResolvedValue(mockBlob),
      } as any)

      // URL.createObjectURL 모킹
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn().mockReturnValue(mockUrl),
        revokeObjectURL: vi.fn(),
      })

      // createElement 모킹
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      }
      mockCreateElement.mockReturnValue(mockAnchor)

      const finalPoster = 'data:image/png;base64,test'
      const fileName = 'test-image'

      await downloadImageMO(finalPoster, fileName)

      expect(fetch).toHaveBeenCalledWith(finalPoster)
      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockAnchor.download).toBe('generated-test-image.png')
      expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor)
      expect(mockClick).toHaveBeenCalled()
      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor)
    })

    it('에러 발생 시 적절한 처리를 해야 한다', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const finalPoster = 'invalid-url'
      const fileName = 'test-image'

      await downloadImageMO(finalPoster, fileName)

      // 에러가 발생해도 함수가 완료되어야 함
      expect(mockCreateElement).not.toHaveBeenCalled()
    })
  })

  describe('downloadImagePC', () => {
    it('성공적으로 이미지를 다운로드해야 한다', () => {
      const mockAnchor = {
        download: '',
        href: '',
        click: mockClick,
      }
      mockCreateElement.mockReturnValue(mockAnchor)

      const finalPoster = 'data:image/png;base64,test'
      const fileName = 'test-image'

      downloadImagePC(finalPoster, fileName)

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockAnchor.download).toBe('generated-test-image.png')
      expect(mockAnchor.href).toBe(finalPoster)
      expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor)
      expect(mockClick).toHaveBeenCalled()
      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor)
    })

    it('에러 발생 시 적절한 처리를 해야 한다', () => {
      mockCreateElement.mockImplementation(() => {
        throw new Error('DOM error')
      })

      const finalPoster = 'data:image/png;base64,test'
      const fileName = 'test-image'

      // 에러가 발생해도 함수가 완료되어야 함
      expect(() => {
        downloadImagePC(finalPoster, fileName)
      }).not.toThrow()
    })
  })
})
