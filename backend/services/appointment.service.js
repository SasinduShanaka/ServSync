// src/services/appointment.service.js
import Session from '../models/session.model.js';
import Appointment from '../models/appointment.model.js';
import Branch from '../models/branch.model.js';
import InsuranceType from '../models/insuranceType.model.js';
import AppointmentCounter from '../models/appointmentCounter.model.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import SmsLog from '../models/smsLog.model.js';
import { sendSms } from './notify.service.js';

function pad2(n){ return String(n).padStart(2,'0'); }
function pad3(n){ return String(n).padStart(3,'0'); }
function initials(str){
  if (!str) return '';
  const words = String(str).trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0,3).toUpperCase();
  return words.map(w=>w[0]).join('').slice(0,3).toUpperCase();
}

export async function createAppointmentService({ sessionId, slotId, branchId, insuranceTypeId, customer, documents }){
  if (!sessionId || !slotId || !branchId || !insuranceTypeId) throw new Error('Missing required fields');
  if (!customer?.name || !customer?.nic || !customer?.phone) throw new Error('Missing customer details');

  // Ensure slotId is an ObjectId for use inside $expr comparisons
  let slotObjectId = slotId;
  try {
    if (!(slotId instanceof mongoose.Types.ObjectId)) {
      slotObjectId = new mongoose.Types.ObjectId(String(slotId));
    }
  } catch {
    // If casting fails, keep original value; query below will likely not match
  }

  // Atomically increment booked for the slot if capacity not exceeded
  const session = await Session.findOneAndUpdate(
    {
      _id: sessionId,
      'slots.slotId': slotObjectId,
      $expr: {
        $lt: [
          { $getField: { field: 'booked', input: { $first: { $filter: { input: '$slots', as: 's', cond: { $eq: ['$$s.slotId', slotObjectId] } } } } } },
          { $getField: { field: 'capacity', input: { $first: { $filter: { input: '$slots', as: 's', cond: { $eq: ['$$s.slotId', slotObjectId] } } } } } }
        ]
      }
    },
    { $inc: { 'slots.$.booked': 1 } },
    { new: true }
  );

  if (!session) {
    const err = new Error('Slot is full or session/slot not found');
    err.code = 'SLOT_FULL';
    throw err;
  }

  // Simple, foolproof booking code generation using timestamp + random
  const now = new Date();
  const timestamp = now.getTime().toString();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  const code = `SRV-${timestamp.slice(-8)}-${random}`;
  
  // Just create the appointment - this code format should never have duplicates
  let lastTriedCode = code;
  try {
    const appt = await Appointment.create({
      bookingCode: code,
      sessionId, slotId, branchId, insuranceTypeId,
      customer,
      documents: documents || []
    });
    return appt.toObject();
  } catch (e) {
    await Session.updateOne({ _id: sessionId, 'slots.slotId': slotId }, { $inc: { 'slots.$.booked': -1 } });
    throw new Error(`Booking failed: ${e?.message || e}. Code tried: ${lastTriedCode}`);
  }
}

export async function findAppointmentByCodeService(bookingCode){
  const appt = await Appointment.findOne({ bookingCode }).lean();
  if (!appt) throw new Error('Appointment not found');
  return appt;
}

export async function cancelAppointmentService({ bookingCode, nic }){
  if (!bookingCode || !nic) {
    const err = new Error('Missing booking code or auth');
    err.status = 400;
    throw err;
  }
  // Find appointment belonging to the caller and still booked
  const appt = await Appointment.findOne({ bookingCode, 'customer.nic': nic, status: 'booked' });
  if (!appt) {
    const err = new Error('Appointment not found or not cancellable');
    err.status = 404;
    throw err;
  }
  // Mark as cancelled first
  appt.status = 'cancelled';
  await appt.save();
  // Decrement slot booked counter defensively
  try{
    await Session.updateOne(
      { _id: appt.sessionId, slots: { $elemMatch: { slotId: appt.slotId, booked: { $gt: 0 } } } },
      { $inc: { 'slots.$.booked': -1 } }
    );
  }catch{
    // ignore; metrics can catch drift
  }
  return { ok: true };
}

export async function sendAppointmentSms({ appointment, session, branch, insuranceType, baseUrl }){
  if (!appointment?.customer?.phone) {
    console.log('[Appointment SMS] No phone number provided');
    return;
  }

  try {
    // Find the specific slot details
    const slot = session?.slots?.find(s => s.slotId.toString() === appointment.slotId.toString());
    
    // Format the appointment details message
    const message = `🏥 ServSync Appointment Confirmed!

📋 Code: ${appointment.bookingCode}
👤 Name: ${appointment.customer.name}
🏢 Branch: ${branch?.name || 'N/A'}
🛡️ Insurance: ${insuranceType?.name || 'N/A'}
📅 Date: ${new Date(session?.date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })}
⏰ Time: ${slot?.startTime || 'N/A'} - ${slot?.endTime || 'N/A'}

📱 Show this code at the branch. Safe travels!`;

    console.log(`[Appointment SMS] Sending to ${appointment.customer.phone}`);
    
    // Send SMS immediately using our working notify service
    const result = await sendSms({ 
      to: appointment.customer.phone, 
      message: message
    });
    
    console.log('[Appointment SMS] SMS sent successfully:', result);
    
    // Log the SMS for record keeping
    await SmsLog.create({
      to: appointment.customer.phone,
      message: message,
      contact: { firstName: appointment.customer?.name },
      meta: { kind: 'appointment_confirmation', bookingCode: appointment.bookingCode },
      status: 'sent',
      providerResponse: result,
      sentAt: new Date()
    });
    
  } catch (error) {
    console.error('[Appointment SMS] Failed to send:', error.message);
    
    // Log the failed attempt
    await SmsLog.create({
      to: appointment.customer.phone,
      message: `Appointment confirmed. Code: ${appointment.bookingCode}`,
      contact: { firstName: appointment.customer?.name },
      meta: { kind: 'appointment_confirmation', bookingCode: appointment.bookingCode },
      status: 'failed',
      errorMessage: error.message,
      sentAt: new Date()
    });
    
    // Don't throw error - appointment creation should still succeed
    console.log('[Appointment SMS] Continuing without SMS...');
  }
}

export async function sendCancellationSms({ appointment, reason = 'by customer request' }){
  if (!appointment?.customer?.phone) {
    console.log('[Cancellation SMS] No phone number provided');
    return;
  }

  try {
    const message = `🏥 ServSync Appointment Cancelled

📋 Code: ${appointment.bookingCode}
👤 Name: ${appointment.customer.name}
❌ Status: CANCELLED (${reason})

Your appointment slot has been freed for others. You can book a new appointment anytime through our system.

Thank you for using ServSync! 🙏`;

    console.log(`[Cancellation SMS] Sending to ${appointment.customer.phone}`);
    
    const result = await sendSms({ 
      to: appointment.customer.phone, 
      message: message
    });
    
    console.log('[Cancellation SMS] SMS sent successfully:', result);
    
    // Log the SMS
    await SmsLog.create({
      to: appointment.customer.phone,
      message: message,
      contact: { firstName: appointment.customer?.name },
      meta: { kind: 'appointment_cancellation', bookingCode: appointment.bookingCode },
      status: 'sent',
      providerResponse: result,
      sentAt: new Date()
    });
    
  } catch (error) {
    console.error('[Cancellation SMS] Failed to send:', error.message);
    
    await SmsLog.create({
      to: appointment.customer.phone,
      message: `Appointment ${appointment.bookingCode} cancelled`,
      contact: { firstName: appointment.customer?.name },
      meta: { kind: 'appointment_cancellation', bookingCode: appointment.bookingCode },
      status: 'failed',
      errorMessage: error.message,
      sentAt: new Date()
    });
  }
}

// Keep the old function for backwards compatibility but make it use the new one
export async function enqueueAppointmentSms({ appointment, baseUrl }){
  console.log('[Appointment SMS] Using legacy enqueue function - consider updating to sendAppointmentSms');
  return sendAppointmentSms({ appointment, baseUrl });
}
