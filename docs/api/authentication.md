If token is provided and valid, `req.user` is populated. Otherwise, request continues without user context.

## Security Features

### Password Security
- Minimum 8 characters required
- Hashed using bcrypt with 12 salt rounds
- Never returned in API responses
- Password history not implemented (can be added)

### Token Security
- Access tokens signed with `JWT_ACCESS_SECRET`
- Refresh tokens signed with `JWT_REFRESH_SECRET`
- Secrets must be strong (minimum 32 characters recommended)
- Tokens stored in database for revocation capability

### Rate Limiting
- Login: 5 attempts per 15 minutes per IP
- Register: 3 attempts per hour per IP
- Password reset: 3 attempts per hour per IP
- Token refresh: 10 attempts per 15 minutes per IP

### Input Validation
- Email format validation
- Password strength requirements
- SQL injection prevention (MongoDB parameterized queries)
- XSS prevention (input sanitization)
- NoSQL injection prevention (mongo-sanitize)

### Email Verification
- Required before login
- Verification token expires after 24 hours
- Can resend verification email

## Error Responses

All error responses follow this format:
