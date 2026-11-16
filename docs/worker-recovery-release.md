# Worker password recovery setup

Workers could previously skip recovery without a clear reminder: the optional question/answer fields were at the bottom of the full profile form. The existing reset flow cannot reset an account without saved recovery details.

## Changes

- Keep initial worker registration short and photo-optional. After saving or skipping a photo, show `/account/recovery`; preserve the photo-saved confirmation and existing successful-registration conversion behavior. Workers can choose “Do this later” and continue using their account.
- Show a prominent account reminder until recovery is set up. Add Password recovery to the worker menu and link it from profile editing. The reminder is independent of public profile completion.
- New setup uses a private 12–128-character recovery phrase with confirmation, rather than an easily guessed personal question. Require the current login password before saving or replacing recovery details. Store only a scrypt hash using the existing `secret_question` and `secret_answer_hash` fields, and preserve case-insensitive reset compatibility. No migration or password/account changes are required.
- Save only against the authenticated worker ID; ignore supplied target IDs. Guest/customer sessions cannot use this worker action. The general profile-update action no longer accepts recovery credential changes, closing a bypass around reauthentication.
- Read only a boolean recovery status for account pages; do not add private credential fields to the general session object or rendered HTML. Phrase/password values are not echoed in URLs, logs, analytics, or browser draft storage.
- Existing saved questions and answer hashes continue working. The Forgot password screen explains both old answers and new phrases. This remains a memorized-secret recovery method, not verified email/SMS recovery or MFA; no messaging provider or paid service is introduced.

## Validation

- Production build including TypeScript and ESLint passed; all 30 unit tests passed.
- Isolated PostgreSQL/PostgREST HTTP tests passed: registration and photo handoff, reminder before/after saving, guest/customer denial, short/mismatched/reused-password validation, incorrect current password, own-account save despite a forged ID, private HTML, old profile-form overwrite prevention, full password reset/new login, and legacy-question compatibility.
- Photo integration tests passed with synthetic Cloudinary/storage fixtures, including the new successful-photo redirect, attachment checks, failure preservation and private proof ownership. No real receipt uploads or production users were created.
- Chrome at 390px verified the account reminder, direct navigation, no horizontal overflow and blank masked credential fields on the noindex recovery page. No real account recovery credentials were changed during browser checks.

Official guidance reviewed: https://cheatsheetseries.owasp.org/cheatsheets/Choosing_and_Using_Security_Questions_Cheat_Sheet.html and https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html . Existing personal-question recovery is retained for compatibility; new setup asks for a private phrase rather than public personal facts and requires reauthentication before changes.
