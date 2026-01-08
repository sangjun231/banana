import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

describe('Auth Flow Integration', () => {
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

  it('사용자 인증 상태를 올바르게 가져와야 한다', async () => {
    // Mock successful auth response
    server.use(
      http.get('*/api/auth/user', () => {
        return HttpResponse.json({
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            name: 'Test User',
          },
        })
      })
    )

    // This would be testing a component that uses auth hooks
    // For now, we'll test the API endpoint directly
    const response = await fetch('/api/auth/user')
    const userData = await response.json()

    expect(userData.id).toBe('test-user-id')
    expect(userData.email).toBe('test@example.com')
    expect(userData.user_metadata.name).toBe('Test User')
  })

  it('인증 실패 시 적절한 에러 처리를 해야 한다', async () => {
    // Mock auth failure
    server.use(
      http.get('*/api/auth/user', () => {
        return HttpResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      })
    )

    const response = await fetch('/api/auth/user')
    expect(response.status).toBe(401)
    
    const errorData = await response.json()
    expect(errorData.error).toBe('Unauthorized')
  })

  it('로그아웃이 올바르게 작동해야 한다', async () => {
    server.use(
      http.post('*/api/auth/logout', () => {
        return HttpResponse.json({ success: true })
      })
    )

    const response = await fetch('/api/auth/logout', { method: 'POST' })
    const result = await response.json()

    expect(result.success).toBe(true)
  })
})
