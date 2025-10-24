import React, { useState } from 'react';
import { UserCheck, QrCode, Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import api from '../../utils/api';

const CustomerCheckIn = () => {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [preview, setPreview] = useState(null); // appointment preview from backend
  const [videoInputs, setVideoInputs] = useState([]); // available cameras
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [manualQRCode, setManualQRCode] = useState(''); // for manual QR code entry
  const [loading, setLoading] = useState(false);
  
  // Override functionality
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [pendingOverrideData, setPendingOverrideData] = useState(null);

  // Camera setup
  const refreshDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices.filter(d => d.kind === 'videoinput');
      setVideoInputs(videos);
      if (videos.length) {
        const back = videos.find(d => /back|rear|environment/i.test(d.label));
        setSelectedDeviceId((back || videos[0]).deviceId);
      }
    } catch (e) {
      console.warn('enumerateDevices failed:', e);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach(t => t.stop());
      await refreshDevices();
    } catch (e) {
      setScanError(`Camera error: ${e?.message || 'Unable to access camera'}`);
    }
  };

  const startScan = async () => {
    setScanning(true);
    setScanError('');
    setPreview(null);
    await requestCameraPermission();
  };

  const stopScan = () => {
    setScanning(false);
    setScanError('');
  };

  const handleScan = (result) => {
    if (result) {
      processQRCode(result.text);
      setScanning(false);
    }
  };

  const handleError = (error) => {
    console.warn('Scanner error:', error);
    if (error.name === 'NotAllowedError') {
      setScanError('Camera permission denied. Please allow camera access and try again.');
    } else if (error.name === 'NotFoundError') {
      setScanError('No camera found. Please ensure a camera is connected.');
    } else {
      setScanError(`Camera error: ${error.message || 'Unknown error'}`);
    }
  };

  // Process QR code (from scan or manual entry)
  const processQRCode = async (qrText) => {
    setLoading(true);
    setScanError('');
    
    try {
      let bookingCode = '';
      
      // Try to parse as JSON first
      try {
        const obj = JSON.parse(qrText);
        bookingCode = obj.bookingCode || '';
      } catch {
        // If not JSON, check if it's a JWT token
        if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(qrText)) {
          bookingCode = decodeBookingCodeFromQR(qrText) || '';
        } else {
          // Assume it's a plain booking code
          bookingCode = qrText.trim();
        }
      }
      
      if (!bookingCode) {
        throw new Error('Invalid QR code: No booking code found');
      }

      // Fetch appointment details from backend
      const { data } = await api.get(`/api/appointments/staff/preview/${encodeURIComponent(bookingCode)}`);
      setPreview(data);
      setManualQRCode(''); // Clear manual input
    } catch (e) {
      setScanError(e?.response?.data?.message || e.message || 'Failed to process QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualQRCode.trim()) {
      processQRCode(manualQRCode.trim());
    }
  };

  // Mark customer as arrived and generate token
  const markAsArrived = async (isOverride = true) => {
    if (!preview) return;
    
    setLoading(true);
    try {
      const payload = { 
        bookingCode: preview.bookingCode,
        // Phase-1: always override validations per requirement
        isOverride: true,
        overrideReason: (overrideReason && overrideReason.trim()) || 'Receptionist override'
      };
      
      const { data } = await api.post('/api/checkin', payload);
      
      // Show success message with token number
      const tokenNumber = data?.token?.tokenNo || 'N/A';
      const overrideMsg = isOverride ? '\n⚠️ OVERRIDE APPLIED' : '';
      alert(`✅ Customer checked in successfully!${overrideMsg}\n\nCustomer: ${preview.customer?.name}\nBooking Code: ${preview.bookingCode}\nQueue Token: ${tokenNumber}\n\nPlease provide the token number to the customer.`);
      
      // Clear preview and close override modal
      setPreview(null);
      setShowOverrideModal(false);
      setOverrideReason('');
      setPendingOverrideData(null);
      
    } catch (e) {
      const errorMsg = e?.response?.data?.message || e.message || 'Check-in failed';
      alert(`❌ Check-in failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle override confirmation
  const handleOverrideConfirm = async () => {
    if (!overrideReason.trim()) {
      alert('Please provide a reason for the override');
      return;
    }
    
    setOverrideLoading(true);
    try {
      await markAsArrived(true);
    } finally {
      setOverrideLoading(false);
    }
  };

  // Helper functions for JWT decoding
  function decodeBookingCodeFromQR(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payloadJson = base64UrlDecode(parts[1]);
      const payload = JSON.parse(payloadJson);
      return payload?.bookingCode || null;
    } catch { 
      return null; 
    }
  }

  function base64UrlDecode(input) {
    try {
      const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
      const padLen = (4 - (base64.length % 4)) % 4;
      const padded = base64 + '='.repeat(padLen);
      const str = atob(padded);
      const bytes = Uint8Array.from(str, c => c.charCodeAt(0));
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(bytes);
    } catch { 
      return ''; 
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Check-In</h1>
        <p className="text-gray-600">Scan QR code or enter manually to check in customers</p>
      </div>

      {/* QR Scanner Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <QrCode className="mr-2" size={24} />
            QR Code Scanner
          </h2>
          <div className="flex space-x-2">
            {!scanning ? (
              <button
                onClick={startScan}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Camera className="mr-2" size={16} />
                Start Scan
              </button>
            ) : (
              <button
                onClick={stopScan}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <X className="mr-2" size={16} />
                Stop Scan
              </button>
            )}
          </div>
        </div>

        {/* Camera Scanner */}
        {scanning && (
          <div className="mb-4 rounded-lg border p-3 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Camera Selection:</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                >
                  {videoInputs.length === 0 && <option value="">Detecting cameras...</option>}
                  {videoInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0,6)}`}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                onClick={requestCameraPermission} 
                className="px-3 py-2 border rounded hover:bg-gray-50"
              >
                Refresh Cameras
              </button>
            </div>

            <div className="rounded-lg overflow-hidden bg-gray-900" style={{ minHeight: '400px', width: '100%' }}>
              <BarcodeScannerComponent
                width="100%"
                height={400}
                onUpdate={(err, result) => {
                  if (err) {
                    handleError(err);
                    return;
                  }
                  if (result) {
                    handleScan(result);
                  }
                }}
                facingMode={selectedDeviceId ? { exact: selectedDeviceId } : 'environment'}
                torch={false}
              />
            </div>
            
            <p className="text-xs text-gray-500">
              Point the camera at a QR code to scan automatically. Make sure the QR code is clearly visible and well-lit.
            </p>
          </div>
        )}

        {/* Manual QR Entry */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Manual QR Code Entry</h3>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Paste QR code content or booking code here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={manualQRCode}
                onChange={(e) => setManualQRCode(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={!manualQRCode.trim() || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Process'}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {scanError && (
          <div className="mt-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">
            {scanError}
          </div>
        )}
      </div>

      {/* Appointment Preview */}
      {preview && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-green-800 flex items-center">
              <CheckCircle className="mr-2" size={24} />
              Appointment Found
            </h2>
            <div className="text-sm text-green-600 font-mono bg-green-50 px-3 py-1 rounded">
              {preview.bookingCode}
            </div>
          </div>
          
          {/* Customer Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">👤 Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500 font-medium">Name:</span> <span className="font-semibold">{preview.customer?.name}</span></div>
              <div><span className="text-gray-500 font-medium">NIC:</span> <span className="font-mono">{preview.customer?.nic}</span></div>
              <div><span className="text-gray-500 font-medium">Phone:</span> {preview.customer?.phone}</div>
              <div><span className="text-gray-500 font-medium">Email:</span> {preview.customer?.email || 'Not provided'}</div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">📅 Appointment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500 font-medium">Branch:</span> {preview.branch?.name}</div>
              <div><span className="text-gray-500 font-medium">Insurance Type:</span> {preview.insuranceType?.name}</div>
              <div><span className="text-gray-500 font-medium">Date:</span> {preview.session?.serviceDate ? new Date(preview.session.serviceDate).toLocaleDateString() : 'Not available'}</div>
              <div><span className="text-gray-500 font-medium">Time:</span> {preview.slot?.startTime} - {preview.slot?.endTime}</div>
              <div><span className="text-gray-500 font-medium">Status:</span> 
                <span className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${
                  preview.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                  preview.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {preview.status?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {preview.status === 'checked_in' ? (
              <div className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded font-semibold">
                <CheckCircle className="mr-2" size={16} />
                Already Checked In
              </div>
            ) : preview.status === 'cancelled' ? (
              <div className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded font-semibold">
                <X className="mr-2" size={16} />
                Appointment Cancelled
              </div>
            ) : (
              <button 
                onClick={() => markAsArrived(false)} 
                disabled={loading}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
              >
                <UserCheck className="mr-2" size={20} />
                {loading ? 'Processing...' : 'Mark as Arrived'}
              </button>
            )}
            <button 
              onClick={() => setPreview(null)} 
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && pendingOverrideData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">⚠️ Override Required</h3>
              <button 
                onClick={() => setShowOverrideModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">Check-in validation failed:</p>
              <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                {pendingOverrideData.errorMsg}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                As a receptionist, you can override this validation. Please provide a reason:
              </p>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Enter reason for override (required)"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideConfirm}
                disabled={!overrideReason.trim() || overrideLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {overrideLoading ? 'Processing...' : 'Override & Check In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCheckIn;