import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FeedbackForm from '../components/Feedback/FeedbackForm.jsx';
import FeedbackList from '../components/Feedback/FeedbackList.jsx';
import api from '../utils/api.js';

function base64UrlDecode(input) {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);
    const str = atob(padded);
    const bytes = Uint8Array.from(str, c => c.charCodeAt(0));
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch { return ''; }
}

function decodeFeedbackToken(ft) {
  if (!ft || typeof ft !== 'string') return {};
  const parts = ft.split('.');
  if (parts.length !== 3) return {};
  try {
    const payloadJson = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadJson);
    return payload || {};
  } catch { return {}; }
}

export default function FeedbackInvite() {
  const [params] = useSearchParams();
  const ft = params.get('ft');
  const payload = useMemo(() => decodeFeedbackToken(ft), [ft]);

  const [view, setView] = useState('form'); // kept for FeedbackForm API compatibility
  const [fullName, setFullName] = useState(payload.fn || '');
  const [email, setEmail] = useState(payload.em || '');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [error, setError] = useState('');

  const submitFeedback = async () => {
    setError('');
    try {
      const body = {
        username: fullName,
        email,
        message,
        rating,
        sessionId: payload.sid || undefined
      };
      await api.post('/api/feedback', body);
      // Clear form fields and return success; let FeedbackForm handle navigation
      setFullName('');
      setEmail('');
      setMessage('');
      setRating(0);
      return true;
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to submit feedback');
      return false;
    }
  };

  // reference view to avoid unused var lint
  const _viewState = view;
  return (
    <div>
      {view === 'form' ? (
        <FeedbackForm
          fullName={fullName}
          setFullName={setFullName}
          email={email}
          setEmail={setEmail}
          message={message}
          setMessage={setMessage}
          rating={rating}
          setRating={setRating}
          submitFeedback={submitFeedback}
          setView={setView}
        />
      ) : (
        <FeedbackList onBack={() => setView('form')} />
      )}
      {error && <div className="max-w-3xl mx-auto mt-4 text-center text-red-600">{error}</div>}
    </div>
  );
}
