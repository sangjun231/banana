import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('*/api/auth/user*', () => {
    return HttpResponse.json({
      id: "mock-user-id",
      app_metadata: {
        provider_type: "mock-provider-type",
      },
      user_metadata: {
        name: "mock-name",
      },
      aud: "mock-aud",
      confirmation_sent_at: "mock-confirmation-sent-at",
      recovery_sent_at: "mock-recovery-sent-at",
      email_change_sent_at: "mock-email-change-sent-at",
      new_email: "mock-new-email",
      new_phone: "mock-new-phone",
      invited_at: "mock-invited-at",
      action_link: "mock-action-link",
      email: "mock-email",
      phone: "mock-phone",
      created_at: "mock-created-at",
      confirmed_at: "mock-confirmed-at",
      email_confirmed_at: "mock-email-confirmed-at",
      phone_confirmed_at: "mock-phone-confirmed-at",
      last_sign_in_at: "mock-last-sign-in-at",
      role: "mock-role",
      updated_at: "mock-updated-at",
      identities: ["mock-identity-1", "mock-identity-2"],
      is_anonymous: true,
      is_sso_user: true,
      factors: ["mock-factor-1", "mock-factor-2"],
      deleted_at: "mock-deleted-at",
    })
  }),
]