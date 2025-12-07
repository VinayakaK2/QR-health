# AI Chatbot Backend Testing Guide

## Prerequisites

1. **Verify OpenAI API Key is set:**
   - Check `server/.env` has `OPENAI_API_KEY=sk-...`
   - Server should be running (`npm run dev` in server folder)

2. **Get a Patient Token:**
   - Login as a patient to get the JWT token
   - Token will be in localStorage or response headers

---

## Method 1: Using Postman or Thunder Client (Recommended)

**Endpoint:** `POST http://localhost:5000/api/ai/chat`

**Headers:**
```
Authorization: Bearer <patient-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Do I have any allergies?",
  "history": []
}
```

**Expected Response:**
```json
{
  "success": true,
  "reply": "Based on your records, you are allergic to Peanuts. This is not medical advice. For serious concerns, please consult your doctor."
}
```

---

## Method 2: Using PowerShell

### Step 1: Login as Patient to get token

```powershell
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{
    email = "john.doe.617@example.com"
    password = "patient123"
} | ConvertTo-Json) -ContentType "application/json"

$token = $loginResponse.token
Write-Host "Token: $token"
```

### Step 2: Test Chat API

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    message = "What is my blood group?"
    history = @()
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/ai/chat" -Method Post -Headers $headers -Body $body

Write-Host "Bot Reply:"
Write-Host $response.reply
```

---

## Method 3: Browser Console (Quick Test)

1. **Login to Patient Dashboard** (http://localhost:3000)
2. **Open Browser DevTools** (F12)
3. **Run this in Console:**

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:5000/api/ai/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Do I have any allergies?',
    history: []
  })
})
.then(r => r.json())
.then(data => console.log('Bot says:', data.reply))
.catch(err => console.error('Error:', err));
```

---

## Test Questions to Try

1. **"Do I have any allergies?"**
   - Should return patient's allergies from profile

2. **"What is my blood group?"**
   - Should return patient's blood group

3. **"How is my recent health?"**
   - Should reference AI summary and recent reports

4. **"What medications am I on?"**
   - Should list medications from profile

5. **"Tell me about my latest report"**
   - Should reference recent report data

---

## Expected Behavior

✅ **Success Cases:**
- Returns personalized response based on patient data
- Includes disclaimer: "This is not medical advice..."
- Uses patient's name in context

❌ **Error Cases:**
- 403: If non-patient tries to access
- 401: If no/invalid token
- 503: If OpenAI API key missing
- 400: If message is empty

---

## Debugging Checklist

If the API doesn't work:

1. **Check server logs** for errors
2. **Verify OPENAI_API_KEY** in `.env`
3. **Verify token** is valid (not expired)
4. **Check patient role** (must be PATIENT, not HOSPITAL_ADMIN)
5. **Check patient has data** in database
6. **Test OpenAI connectivity** separately

---

## Sample Full curl Command

```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What allergies do I have?",
    "history": []
  }'
```

---

## Next Steps After Backend Test Passes

Once you confirm the backend API works:
1. Add chatbot to Patient Dashboard UI
2. Test end-to-end conversation flow
3. Verify privacy (patient can only see their own data)
