# LetterToFuture

<p align="center">
  <img src="logo.png" alt="LetterToFuture Logo" width="120" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/frontend-HTML5%20%7C%20TailwindCSS%20%7C%20Alpine.js-blue?logo=html5&logoColor=white" alt="Frontend" />
  <img src="https://img.shields.io/badge/backend-Node.js%20%7C%20Express%20%7C%20Supabase-brightgreen?logo=node.js&logoColor=white" alt="Backend" />
  <img src="https://img.shields.io/badge/email-Resend-yellow?logo=gmail&logoColor=white" alt="Email" />
  <img src="https://img.shields.io/badge/security-AES--256%20Encryption-orange?logo=security&logoColor=white" alt="Security" />
  <img src="https://img.shields.io/badge/deploy-Vercel-black?logo=vercel" alt="Deploy" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
</p>

---

##  Features

- **No logins required** — privacy-first, passwordless experience
- **Write and schedule** a letter to your future self for any future date
- **Edit, reschedule, or delete** your letters via a secure email link
- **Mobile-friendly** and fully responsive design
- **SEO-optimized** for discoverability
- **Accessible** and user-friendly UI
- **Email delivery** powered by Resend API
- **Data storage** via Supabase
- **Deployed on Vercel**

---

##  How It Works

1. **Write your letter** and pick a future delivery date.
2. **Submit** — your letter is safely stored and scheduled.
3. **Want to manage your letters?**
   - Request a management link by email.
   - Click the link in your inbox to edit, reschedule, or delete your letters.
4. **On your chosen date,** your letter is delivered to your inbox. 🎉

---

##  Local Development

1. **Clone the repo:**
   ```bash
   git clone https://github.com/BlankVox/LetterToFuture.git
   cd LetterToFuture
   ```
2. **Install backend dependencies:**
   ```bash
   npm install
   ```
3. **Create a `.env` file** in the root (see example below).
4. **Start the backend:**
   ```bash
   npm start
   ```
5. **Open `index.html` in your browser** for the frontend.
6. **For management,** open `manage.html?token=...` with a valid link from your email.

**.env example:**
```
RESEND_API_KEY=your_resend_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
TOKEN_SECRET=your_jwt_secret
LETTER_ENCRYPTION_KEY=your_32_char_encryption_key
APP_URL=http://localhost:3001
PORT=3001
```

---

##  Deployment (Vercel)
- Connect your GitHub repo to Vercel.
- Set all environment variables in the Vercel dashboard.
- Deploy and enjoy!

---

##  Usage

- **To schedule a letter:**
  1. Go to the main page, write your letter, pick a future date, and submit.
- **To manage your letters:**
  1. Enter your email in the "Manage Letters" section.
  2. Check your email for a secure management link.
  3. Click the link to open the management page and edit, reschedule, or delete your letters.

---

##  Support This Project

If you find LetterToFuture useful, consider supporting development:

<p align="center">
  <a href="https://www.buymeacoffee.com/tahir615" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" ></a>
</p>



---

##  License

MIT 