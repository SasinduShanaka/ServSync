import React, { useState } from 'react';
import FeedbackForm from '../components/Feedback/FeedbackForm';
import FeedbackList from '../components/Feedback/FeedbackList';
import axios from 'axios';

export default function FeedbackPage() {
  const [view, setView] = useState('form'); // 'form' | 'list'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitFeedback = async () => {
    setError('');
    setSubmitting(true);
    try {
      const payload = { username: fullName, email, message, rating };
      await axios.post('/api/feedback', payload);
      // save email locally so replies can be associated
      try { localStorage.setItem('feedbackEmail', email || ''); } catch {}
      // Clear form fields after successful submission
      setFullName('');
      setEmail('');
      setMessage('');
      setRating(0);
      // Do not auto-navigate; let the form show its own thank-you screen
      return true;
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to submit feedback');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

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
