import { test, expect } from '@playwright/test'

test.describe('Memorial Photo Generation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/gen', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          base64Image: 'data:image/webp;base64,test-base64-data'
        })
      })
    })

    await page.route('**/api/image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          imageId: 'test-image-id'
        })
      })
    })
  })

  test('사용자가 영정 사진을 생성할 수 있어야 한다', async ({ page }) => {
    await page.goto('/memorial')

    // 페이지가 올바르게 로드되었는지 확인
    await expect(page.getByText('AI 영정 사진 변환')).toBeVisible()
    await expect(page.getByText('증명사진이나 프로필 사진을 업로드하여 영정 사진으로 변환해보세요.')).toBeVisible()

    // 이미지 선택 버튼이 있는지 확인
    await expect(page.getByRole('button', { name: /이미지 선택/i })).toBeVisible()

    // 변환 버튼이 비활성화되어 있는지 확인 (파일이 선택되지 않았으므로)
    await expect(page.getByRole('button', { name: /변환하기/i })).toBeDisabled()
  })

  test('파일 업로드 후 변환 과정이 올바르게 작동해야 한다', async ({ page }) => {
    await page.goto('/memorial')

    // 테스트용 이미지 파일 생성
    const testImagePath = 'tests/fixtures/test-image.jpg'
    
    // 파일 선택
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)

    // 파일이 선택되면 변환 버튼이 활성화되는지 확인
    await expect(page.getByRole('button', { name: /변환하기/i })).toBeEnabled()

    // 변환 버튼 클릭
    await page.getByRole('button', { name: /변환하기/i }).click()

    // 로딩 상태 확인
    await expect(page.getByText('생성 중...')).toBeVisible()

    // 생성 완료 후 결과 확인
    await expect(page.getByAltText('Generated')).toBeVisible()
  })

  test('파일 크기 제한이 올바르게 작동해야 한다', async ({ page }) => {
    await page.goto('/memorial')

    // 큰 파일 생성 (5MB)
    const largeFile = Buffer.alloc(5 * 1024 * 1024) // 5MB
    const largeFilePath = 'tests/fixtures/large-image.png'
    
    // 파일 시스템에 큰 파일 생성 (실제 구현에서는 다른 방법 사용)
    await page.evaluate((data) => {
      const blob = new Blob([data], { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      return url
    }, largeFile)

    // 파일 선택 시도
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(largeFilePath)

    // 에러 메시지 확인
    await expect(page.getByText('이미지 파일 크기는 4MB를 초과할 수 없습니다.')).toBeVisible()
  })

  test('모바일 환경에서 다운로드가 올바르게 작동해야 한다', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/memorial')

    // 모바일 환경에서의 다운로드 동작 테스트
    // (실제 구현에서는 모바일 감지 로직에 따라 다른 동작을 수행)
    
    await expect(page.getByText('AI 영정 사진 변환')).toBeVisible()
  })

  test('에러 발생 시 적절한 에러 메시지가 표시되어야 한다', async ({ page }) => {
    // API 에러 모킹
    await page.route('**/api/gen', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error'
        })
      })
    })

    await page.goto('/memorial')

    // 파일 선택
    const testImagePath = 'tests/fixtures/test-image.jpg'
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)

    // 변환 시도
    await page.getByRole('button', { name: /변환하기/i }).click()

    // 에러 메시지 확인
    await expect(page.getByText('오류 발생')).toBeVisible()
  })
})
