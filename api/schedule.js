import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENCRYPTION_KEY = process.env.LETTER_ENCRYPTION_KEY || 'defaultkeydefaultkeydefaultkey12'; // 32 bytes for AES-256
const IV_LENGTH = 16; // AES block size

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { email, deliveryDate, letter } = req.body;
    if (!email || !deliveryDate || !letter) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    try {
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
            res.status(500).json({ error: error.message });
            return;
        }
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
} 