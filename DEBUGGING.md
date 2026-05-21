# 🔍 TIKETMU - Debugging & Troubleshooting

Use this guide if you encounter any issues during development.

## 🛠 Common Issues & Solutions

### 1. Prisma Connection Error
**Symptoms**: App crashes on start with "Can't reach database server".
**Fix**: 
- Ensure your `DATABASE_URL` is correct in `.env`.
- If using Docker, ensure the container is running.
- Try `npx prisma db pull` to verify connectivity.

### 2. Blank White Screen
**Symptoms**: The page loads but nothing renders.
**Fix**:
- Check the Browser Console (F12).
- Search for "ErrorBoundary" logs; often a `null` property access is caught here.
- Ensure `localStorage` is clean of corrupted `auth_token` values.

### 3. Real-time Sync Not Working
**Symptoms**: Ticket status doesn't update without refresh.
**Fix**:
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct.
- Check if your Supabase project has "Realtime" enabled for the `Ticket` table.

### 4. Port 3000 Conflict
**Symptoms**: "Address already in use :::3000".
**Fix**: 
- Find and kill the process: `lsof -i :3000` then `kill -9 <PID>`.
- Or restart VSCode.

## 📈 Logging Strategy
The app uses a prefix-based logging system to help you find relevant info:
- `[AuthContext]`: Authentication state changes and token verification.
- `[GlobalErrorHandler]`: Backend exceptions.
- `[GlobalErrorBoundary]`: Frontend rendering crashes.

## 🧪 Testing API
You can test the backend health directly via:
`GET http://localhost:3000/api/health`

Expected Output:
```json
{
  "status": "ok",
  "env": "development"
}
```
