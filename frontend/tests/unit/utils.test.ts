import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, base64ToFile } from '@/lib/utils'

// downloadImageMO와 downloadImagePC는 DOM과 fetch에 의존하므로 별도로 테스트
describe('Utils', () => {
  describe('cn', () => {
    it('클래스명을 올바르게 병합해야 한다', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('조건부 클래스명을 올바르게 처리해야 한다', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional')
      expect(cn('base', false && 'conditional')).toBe('base')
    })

    it('중복 클래스명을 올바르게 병합해야 한다', () => {
      expect(cn('p-4 p-2')).toBe('p-2') // tailwind-merge가 작동
    })

    it('빈 값들을 올바르게 처리해야 한다', () => {
      expect(cn('', null, undefined, 'valid')).toBe('valid')
    })
  })

  describe('base64ToFile', () => {
    it('base64 문자열을 File 객체로 변환해야 한다', () => {
      const base64String = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      const fileName = 'test.png'
      const fileType = 'image/png'

      const file = base64ToFile(base64String, fileName, fileType)

      expect(file).toBeInstanceOf(File)
      expect(file.name).toBe(fileName)
      expect(file.type).toBe(fileType)
      expect(file.size).toBeGreaterThan(0)
    })

    it('잘못된 base64 문자열에 대해 에러를 처리해야 한다', () => {
      const invalidBase64 = 'invalid-base64-string'
      const fileName = 'test.png'
      const fileType = 'image/png'

      expect(() => {
        base64ToFile(invalidBase64, fileName, fileType)
      }).toThrow()
    })

    it('빈 base64 문자열에 대해 빈 파일을 생성해야 한다', () => {
      const emptyBase64 = 'data:image/png;base64,'
      const fileName = 'empty.png'
      const fileType = 'image/png'

      const file = base64ToFile(emptyBase64, fileName, fileType)

      expect(file).toBeInstanceOf(File)
      expect(file.name).toBe(fileName)
      expect(file.type).toBe(fileType)
      expect(file.size).toBe(0)
    })
  })
})
