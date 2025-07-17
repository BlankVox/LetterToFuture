import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'supersecretkey';
const TOKEN_EXPIRY = '24h'; // 24 hours
const APP_URL = process.env.APP_URL || 'http://localhost:3001';

// In-memory token store (for demonstration; use DB/Redis in production)
const validTokens = global.validTokens || new Map();
if (!global.validTokens) global.validTokens = validTokens;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    // Generate token
    const token = jwt.sign({ email }, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRY });
    // Store token with expiry
    validTokens.set(token, Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    // Send email with management link
    try {
        await axios.post('https://api.resend.com/emails', {
            from: 'noreply@lettertofuture.com',
            to: email,
            subject: 'Manage Your Letters to the Future',
            html: `<p>Click the link below to manage your scheduled letters. This link is valid for 24 hours.</p>
             <p><a href="${APP_URL}/manage?token=${token}">${APP_URL}/manage?token=${token}</a></p>
             <p>If you did not request this, you can ignore this email.</p>`
        }, {
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send management email.' });
    }
} 