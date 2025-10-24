// src/controllers/testSms.controller.js
import { sendSms, sendSmsGet } from '../services/notify.service.js';
import { normalizePhoneForNotify } from '../services/sms.service.js';
import SmsLog from '../models/smsLog.model.js';

export async function sendTestSms(req, res) {
  try {
    const { phone, message, method = 'POST' } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({ message: 'Phone number and message are required' });
    }

    // Normalize to Notify.lk format 94XXXXXXXXX
    const cleanPhone = normalizePhoneForNotify(phone);
    if (!cleanPhone) {
      return res.status(400).json({ message: 'Invalid phone number. Use formats like 076xxxxxxx or +9476xxxxxxx' });
    }
    
    console.log(`[Test SMS] Sending via ${method} method to ${cleanPhone}`);

    // Log the SMS attempt
    const smsLog = new SmsLog({
      to: cleanPhone,
      message: message.trim(),
      contact: { firstName: 'Test User' },
      meta: { kind: `test_sms_${method.toLowerCase()}`, source: 'admin_panel' },
      status: 'processing'
    });
    await smsLog.save();

    try {
      // Send SMS using chosen method
      const result = method === 'GET' 
        ? await sendSmsGet({ to: cleanPhone, message: message.trim() })
        : await sendSms({ to: cleanPhone, message: message.trim() });
      
      console.log('[Test SMS] Success:', result);
      
      // Update log with success
      smsLog.status = 'sent';
      smsLog.providerResponse = result;
      await smsLog.save();

      res.json({
        success: true,
        message: `SMS sent successfully via ${method}!`,
        phone: cleanPhone,
        result
      });
    } catch (smsError) {
      console.error('[Test SMS] Failed:', smsError.message);
      
      // Update log with failure
      smsLog.status = 'failed';
      smsLog.lastError = smsError.message;
      await smsLog.save();

      throw smsError;
    }
  } catch (e) {
    console.error('Test SMS controller error:', e);
    res.status(500).json({ 
      success: false,
      message: e.message || 'Failed to send test SMS' 
    });
  }
}