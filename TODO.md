- [ ] Determine admin login credentials source (current code uses Admin collection with exact username/password)
- [ ] Create/insert initial Admin record OR add a config-based fallback admin account
- [ ] Prefer hashing (bcrypt) and secure storage via environment variables
- [ ] Update frontend if needed (AdminLogin already posts username/password)
- [ ] Provide steps to set credentials and verify login endpoint: POST /api/auth/login

