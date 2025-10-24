import React, { useState } from 'react';
import api from '../utils/api';

export default function TestSms() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('Test SMS from ServSync - if you receive this, SMS is working!');
  const [method, setMethod] = useState('POST');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !message.trim()) return;

    setLoading(true);
    setResult('');
    setError('');

    try {
      const { data } = await api.post('/api/test-sms/send', {
        phone: phone.trim(),
        message: message.trim(),
        method: method
      });
      
      setResult(`✅ ${data.message} (${data.phone}) - API Response: ${JSON.stringify(data.result, null, 2)}`);
      
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Test SMS Gateway</h1>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-sm font-semibold text-blue-800 mb-2">Instructions</h2>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Enter a valid phone number (international format recommended, e.g., 9477xxxxxxx)</li>
              <li>• Enter your test message</li>
              <li>• Click Send Test SMS</li>
              <li>• Check backend logs for SMS worker processing</li>
              <li>• Check your phone for the message delivery</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9477xxxxxxx (Sri Lankan format) or +94xxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your test message here..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Character count: {message.length}/160 (SMS typically splits after 160 chars)
              </p>
            </div>

            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-2">
                API Method
              </label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="POST">POST (Form Data)</option>
                <option value="GET">GET (Query Parameters)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Test both API methods to see which works better with Notify.lk
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !phone.trim() || !message.trim()}
              className={`w-full py-2 px-4 rounded-md font-medium text-white ${
                loading || !phone.trim() || !message.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {loading ? 'Sending...' : 'Send Test SMS'}
            </button>
          </form>

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">{result}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">❌ {error}</p>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">Environment Check</h3>
            <p className="text-sm text-yellow-700">
              Make sure your backend has these environment variables set in <code className="bg-yellow-100 px-1 rounded">.env</code>:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• <code className="bg-yellow-100 px-1 rounded">NOTIFYLK_USER_ID</code></li>
              <li>• <code className="bg-yellow-100 px-1 rounded">NOTIFYLK_API_KEY</code></li>
              <li>• <code className="bg-yellow-100 px-1 rounded">NOTIFYLK_SENDER_ID</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}