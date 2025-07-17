import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'supersecretkey';
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
const validTokens = global.validTokens || new Map();
if (!global.validTokens) global.validTokens = validTokens;

export default async function handler(req, res) {
    const { id } = req.query;
    const token = req.headers['authorization']?.split(' ')[1] || req.query.token;
    if (!token) return res.status(401).json({ error: 'Token required' });
    const expiry = validTokens.get(token);
    if (!expiry || Date.now() > expiry) {
        return res.status(401).json({ error: 'Token expired or invalid' });
    }
    let email;
    try {
        const payload = jwt.verify(token, TOKEN_SECRET);
        email = payload.email;
    } catch {
        return res.status(401).json({ error: 'Token invalid' });
    }

    if (req.method === 'PUT') {
        const { letter, deliveryDate } = req.body;
        if (!letter && !deliveryDate) {
            return res.status(400).json({ error: 'Nothing to update' });
        }
        // Only allow editing if the email matches
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
        res.status(200).json({ success: true });
    } else if (req.method === 'DELETE') {
        // Only allow deleting if the email matches
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
        res.status(200).json({ success: true });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
} 