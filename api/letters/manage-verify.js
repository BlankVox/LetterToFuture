import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'supersecretkey';
const ENCRYPTION_KEY = process.env.LETTER_ENCRYPTION_KEY || 'defaultkeydefaultkeydefaultkey12'; // 32 bytes for AES-256
const IV_LENGTH = 16; // AES block size

function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'base64');
    const encryptedText = parts[1];
    const decipher = require('crypto').createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const validTokens = global.validTokens || new Map();
if (!global.validTokens) global.validTokens = validTokens;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
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
        res.status(200).json({ letters: decrypted, email });
    } catch (err) {
        res.status(401).json({ error: 'Token invalid' });
    }
} 