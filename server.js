require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'supersecretkey';
const TOKEN_EXPIRY = '1h'; // 1 hour
const APP_URL = process.env.APP_URL || 'http://localhost:3001';
const ENCRYPTION_KEY = process.env.LETTER_ENCRYPTION_KEY || 'defaultkeydefaultkeydefaultkey12'; // 32 bytes for AES-256
const IV_LENGTH = 16; // AES block size

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return iv.toString('base64') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'base64');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// In-memory token store (for demonstration; use DB/Redis in production)
const validTokens = new Map();

// Endpoint to schedule a letter
app.post('/api/schedule', async (req, res) => {
  const { email, deliveryDate, letter } = req.body;
  if (!email || !deliveryDate || !letter) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const encryptedLetter = encrypt(letter);
  const { error } = await supabase.from('letters').insert([
    {
      email,
      delivery_date: deliveryDate,
      letter: encryptedLetter,
      sent: false
    }
  ]);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
});

// Scheduler: checks every minute for letters to send
setInterval(async () => {
  const now = new Date().toISOString();
  const { data: dueLetters, error } = await supabase
    .from('letters')
    .select('*')
    .eq('sent', false)
    .lte('delivery_date', now);
  if (error) {
    console.error('Supabase fetch error:', error.message);
    return;
  }
  for (const letter of dueLetters) {
    try {
      const decryptedLetter = decrypt(letter.letter);
      await axios.post('https://api.resend.com/emails', {
        from: 'noreply@lettertofuture.com',
        to: letter.email,
        subject: 'A Letter From Your Past',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Letter to the Future</title>
          </head>
          <body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;color:#222;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;padding:0;margin:0;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#fff;border-radius:12px;margin:32px 0 0 0;box-shadow:0 2px 8px rgba(59,130,246,0.08);">
                    <tr>
                      <td style="padding:32px 24px 16px 24px;text-align:center;">
                        <div style="font-size:32px;line-height:1.2;font-weight:bold;color:#3B82F6;letter-spacing:-1px;">LetterToFuture</div>
                        <div style="font-size:18px;margin-top:8px;color:#1D4ED8;">A message from your past self</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 24px 24px 24px;">
                        <div style="background:#f1f5f9;border-radius:8px;padding:20px 16px;font-size:16px;line-height:1.6;color:#222;white-space:pre-line;">
                          ${decryptedLetter.replace(/\n/g, '<br>')}
                        </div>
                        <div style="margin-top:24px;font-size:14px;color:#6B7280;text-align:center;">
                          Delivered by <a href="https://lettertofuture.com" style="color:#3B82F6;text-decoration:none;font-weight:bold;">LetterToFuture</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                  <div style="margin:24px 0 0 0;font-size:12px;color:#9ca3af;text-align:center;">&copy; ${new Date().getFullYear()} LetterToFuture</div>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      }, {
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      // Mark as sent
      await supabase.from('letters').update({ sent: true }).eq('id', letter.id);
      console.log(`Sent letter to ${letter.email}`);
    } catch (err) {
      console.error('Failed to send letter:', err.response?.data || err.message);
    }
  }
}, 60 * 1000); // every minute

// Send management link to email
app.post('/api/letters/manage-request', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  // Generate token
  const token = jwt.sign({ email }, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRY });
  // Store token with expiry
  validTokens.set(token, Date.now() + 60 * 60 * 1000); // 1 hour
  // Send email with management link
  try {
    await axios.post('https://api.resend.com/emails', {
      from: 'noreply@lettertofuture.com',
      to: email,
      subject: 'Manage Your Letters to the Future',
      html: `<p>Click the link below to manage your scheduled letters. This link is valid for 1 hour.</p>
                   <p><a href="${APP_URL}/manage?token=${token}">${APP_URL}/manage?token=${token}</a></p>
                   <p>If you did not request this, you can ignore this email.</p>`
    }, {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send management email.' });
  }
});

// Verify token and return letters
app.get('/api/letters/manage-verify', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token is required' });
  // Check token in memory
  const expiry = validTokens.get(token);
  if (!expiry || Date.now() > expiry) {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
  try {
    const payload = jwt.verify(token, TOKEN_SECRET);
    const { email } = payload;
    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .eq('email', email)
      .order('delivery_date', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    // Decrypt letter content before sending
    const decrypted = data.map(l => ({ ...l, letter: decrypt(l.letter) }));
    res.json({ letters: decrypted, email });
  } catch (err) {
    res.status(401).json({ error: 'Token invalid' });
  }
});

// Middleware to check token for sensitive actions
function requireToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ error: 'Token required' });
  const expiry = validTokens.get(token);
  if (!expiry || Date.now() > expiry) {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
  try {
    req.tokenPayload = jwt.verify(token, TOKEN_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalid' });
  }
}

// Edit a letter by ID (token required)
app.put('/api/letters/:id', requireToken, async (req, res) => {
  const { id } = req.params;
  const { letter, deliveryDate } = req.body;
  if (!letter && !deliveryDate) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  // Only allow editing if the email matches
  const { email } = req.tokenPayload;
  const { data: letterData, error: fetchError } = await supabase
    .from('letters')
    .select('email')
    .eq('id', id)
    .single();
  if (fetchError || !letterData || letterData.email !== email) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const updateFields = {};
  if (letter) updateFields.letter = encrypt(letter);
  if (deliveryDate) updateFields.delivery_date = deliveryDate;
  const { error } = await supabase
    .from('letters')
    .update(updateFields)
    .eq('id', id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
});

// Delete a letter by ID (token required)
app.delete('/api/letters/:id', requireToken, async (req, res) => {
  const { id } = req.params;
  // Only allow deleting if the email matches
  const { email } = req.tokenPayload;
  const { data: letterData, error: fetchError } = await supabase
    .from('letters')
    .select('email')
    .eq('id', id)
    .single();
  if (fetchError || !letterData || letterData.email !== email) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const { error } = await supabase
    .from('letters')
    .delete()
    .eq('id', id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));