// src/services/notify.service.js
import axios from 'axios';
import qs from 'querystring';

const BASE = process.env.NOTIFYLK_API_BASE || 'https://app.notify.lk/api/v1';
const USER_ID = process.env.NOTIFYLK_USER_ID || '27423';  // Temp hardcode for testing
const API_KEY = process.env.NOTIFYLK_API_KEY || 'PKCtUzHQM032uI8aeGW6';  // Temp hardcode for testing
const SENDER_ID = process.env.NOTIFYLK_SENDER_ID || 'BrightEdu';

// Debug logging to check environment variables
console.log('[Notify.lk Debug] Environment variables:');
console.log('USER_ID:', USER_ID);
console.log('API_KEY:', API_KEY ? 'SET (length: ' + API_KEY.length + ')' : 'NOT SET');
console.log('SENDER_ID:', SENDER_ID);
// Trigger restart

export async function sendSms({ to, message, contact = {} }){
  if (!USER_ID || !API_KEY) {
    throw new Error('Notify.lk credentials not configured');
  }

  console.log('[Notify.lk POST] Sending SMS:', {
    user_id: USER_ID,
    sender_id: SENDER_ID,
    to: to,
    message: message.substring(0, 50) + '...',
    api_key: API_KEY ? 'SET' : 'MISSING'
  });

  // Use simple payload matching the working GET format
  const payload = {
    user_id: USER_ID,
    api_key: API_KEY,
    sender_id: SENDER_ID,
    to,
    message
  };

  const url = `${BASE}/send`;
  
  try {
    console.log('[Notify.lk POST] Making request to:', url);
    console.log('[Notify.lk POST] Payload:', { ...payload, api_key: 'HIDDEN' });
    
    const res = await axios.post(url, qs.stringify(payload), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    });
    
    console.log('[Notify.lk POST] Response Status:', res.status);
    console.log('[Notify.lk POST] Response Data:', res.data);
    return res.data;
    
  } catch (error) {
    console.error('[Notify.lk] Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.data) {
      throw new Error(`Notify.lk API Error: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Simple GET method test (exactly like documentation example that works!)
export async function sendSmsGet({ to, message }){
  if (!USER_ID || !API_KEY) {
    throw new Error('Notify.lk credentials not configured');
  }

  // Use exact same format as the working browser example
  const url = `${BASE}/send?user_id=${USER_ID}&api_key=${API_KEY}&sender_id=${SENDER_ID}&to=${to}&message=${encodeURIComponent(message)}`;
  
  try {
    console.log('[Notify.lk GET] Making request to:', url.replace(API_KEY, 'HIDDEN'));
    const res = await axios.get(url, { timeout: 15000 });
    
    console.log('[Notify.lk GET] Response Status:', res.status);
    console.log('[Notify.lk GET] Response Data:', res.data);
    return res.data;
    
  } catch (error) {
    console.error('[Notify.lk GET] Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: url.replace(API_KEY, 'HIDDEN')
    });
    throw error;
  }
}
