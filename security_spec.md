# Security Specification for UNIDAS

## 1. Data Invariants

- A **Survey** must belong to the authenticated user (`user_id == request.auth.uid`).
- A **UserDocument** must belong to the authenticated user.
- A **Notification** must only be readable by the target user.
- **Roles** (admin, analyst) are stored in the `/users/{userId}` document.
- Only **Admins** can create/update News and Events.
- Only **Admins** can manage roles.
- **Analysts** can review surveys but not delete them.

## 2. The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a survey with a different `user_id`. (Rejected)
2. **Privilege Escalation**: User tries to update their own role from 'user' to 'admin'. (Rejected)
3. **Shadow Field Injection**: User tries to add an `is_verified: true` field to their document. (Rejected)
4. **Orphaned Write**: Create a Review for a Survey that doesn't exist. (Rejected)
5. **State Shortcutting**: Change survey status from 'draft' directly to 'approved' without analyst review. (Rejected)
6. **Denial of Wallet**: Attempt to use massive strings in ID path variables. (Rejected)
7. **Cross-Tenant Read**: User A tries to read User B's notifications. (Rejected)
8. **Public Write**: Unauthenticated user tries to post news. (Rejected)
9. **History Manipulation**: User tries to delete their own audit history. (Rejected)
10. **Resource Poisoning**: Uploading a document with 10MB file path string. (Rejected)
11. **Sync Bypass**: Create an enrollment without verifying the event capacity. (Handled by client but rules should gate if possible, though existsAfter is better for same-write).
12. **PII Leak**: Guest user reading all user emails. (Rejected)

## 3. Test Runner (Draft)

(Tests will be verified using `firestore.rules.test.ts` pattern)
- `it('rejects cross-user reads', ...)`
- `it('prevents role switching', ...)`
- `it('enforces string size limits', ...)`
