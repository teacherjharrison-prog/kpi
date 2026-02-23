import React, { useState, useEffect } from 'react';
import { Phone, DollarSign, Gift, Plus, Check, Loader, Play, Pause, RotateCcw, Timer } from 'lucide-react';

function DataEntry({ todayEntry, onUpdate, apiUrl, timer }) {
  const today = new Date().toISOString().split('T')[0];
  const [loading, setLoading] = useState({});
  const [success, setSuccess] = useState({});
  
  // Timer from props
  const { timerSeconds, isTimerRunning, isPaused, startTimer, pauseTimer, resumeTimer, stopTimer, resetAndStartTimer } = timer || {};
  
  const [calls, setCalls] = useState(todayEntry?.calls_received || 0);
  const [booking, setBooking] = useState({ profit: '', is_prepaid: false, has_refund_protection: false, time_since_last: '' });
  const [spin, setSpin] = useState({ amount: '', is_mega: false, booking_number: '' });
  const [misc, setMisc] = useState({ amount: '', source: 'request_lead', description: '' });

  // Sync calls with todayEntry
  useEffect(() => {
    if (todayEntry?.calls_received !== undefined) {
      setCalls(todayEntry.calls_received);
    }
  }, [todayEntry]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showSuccess = (key) => {
    setSuccess(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setSuccess(prev => ({ ...prev, [key]: false })), 2000);
  };

  const updateCalls = async () => {
    setLoading(prev => ({ ...prev, calls: true }));
    try {
      const response = await fetch(`${apiUrl}/api/entries/${today}/calls?calls_received=${calls}`, { 
        method: 'PUT' 
      });
      if (!response.ok) throw new Error('Failed to update calls');
      showSuccess('calls');
      onUpdate();
    } catch (err) {
      alert('Failed to update calls: ' + err.message);
    }
    setLoading(prev => ({ ...prev, calls: false }));
  };

  const addBooking = async () => {
    if (!booking.profit) return alert('Enter profit amount');
    setLoading(prev => ({ ...prev, booking: true }));
    
    // Use timer value for time_since_last (convert to minutes)
    const timeMinutes = booking.time_since_last 
      ? parseInt(booking.time_since_last) 
      : Math.floor(timerSeconds / 60);
    
    try {
      const response = await fetch(`${apiUrl}/api/entries/${today}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profit: parseFloat(booking.profit),
          is_prepaid: booking.is_prepaid,
          has_refund_protection: booking.has_refund_protection,
          time_since_last: timeMinutes,
          created_at: new Date().toISOString()
        })
      });
      
      if (!response.ok) throw new Error('Failed to add booking');
      
      // Reset form
      setBooking({ profit: '', is_prepaid: false, has_refund_protection: false, time_since_last: '' });
      
      // CRITICAL FIX: Reset timer and auto-start for next booking
      if (resetAndStartTimer) {
        resetAndStartTimer();
      }
      
      showSuccess('booking');
      onUpdate(); // Refresh dashboard
      
    } catch (err) {
      alert('Failed to add booking: ' + err.message);
    }
    setLoading(prev => ({ ...prev, booking: false }));
  };

  const addSpin = async () => {
    if (!spin.amount) return alert('Enter spin amount');
    setLoading(prev => ({ ...prev, spin: true }));
    try {
      const response = await fetch(`${apiUrl}/api/entries/${today}/spins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(spin.amount),
          is_mega: spin.is_mega,
          booking_number: parseInt(spin.booking_number) || 0,
          created_at: new Date().toISOString()
        })
      });
      
      if (!response.ok) throw new Error('Failed to add spin');
      
      setSpin({ amount: '', is_mega: false, booking_number: '' });
      showSuccess('spin');
      onUpdate();
    } catch (err) {
      alert('Failed to add spin: ' + err.message);
    }
    setLoading(prev => ({ ...prev, spin: false }));
  };

  const addMisc = async () => {
    if (!misc.amount) return alert('Enter amount');
    setLoading(prev => ({ ...prev, misc: true }));
    try {
      const response = await fetch(`${apiUrl}/api/entries/${today}/misc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(misc.amount),
          source: misc.source,
          description: misc.description,
          created_at: new Date().toISOString()
        })
      });
      
      if (!response.ok) throw new Error('Failed to add misc income');
      
      setMisc({ amount: '', source: 'request_lead', description: '' });
      showSuccess('misc');
      onUpdate();
    } catch (err) {
      alert('Failed to add misc income: ' + err.message);
    }
    setLoading(prev => ({ ...prev, misc: false }));
  };

  const ButtonContent = ({ loading: isLoading, success: isSuccess, children }) => {
    if (isLoading) return <><Loader size={16} className="animate-spin" /> Saving...</>;
    if (isSuccess) return <><Check size={16} /> Saved!</>;
    return children;
  };

  return (
    <div data-testid="data-entry">
      <h2 className="section-title font-display" style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
        Add Data for {today}
      </h2>

      {/* Timer Section */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--primary)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Timer size={16} /> Time Since Last Reservation
            </div>
            <div className="font-display" style={{ fontSize: '3rem', fontWeight: 900 }}>
              {formatTime(timerSeconds)}
            </div>
            {isPaused && <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>PAUSED</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isTimerRunning ? (
              <button onClick={startTimer} style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}>
                <Play size={16} /> Start
              </button>
            ) : isPaused ? (
              <button onClick={resumeTimer} style={{ background: '#34C759', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}>
                <Play size={16} /> Resume
              </button>
            ) : (
              <button onClick={pauseTimer} style={{ background: '#F59E0B', color: 'var(--primary)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}>
                <Pause size={16} /> Pause
              </button>
            )}
            <button onClick={stopTimer} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '9999px', cursor: 'pointer' }}>
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: '1.5rem' }}>
        {/* Calls */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Phone size={20} /> Update Calls
          </h3>
          <div className="form-group">
            <label className="form-label">Total Calls Received</label>
            <input type="number" className="form-input" value={calls} onChange={(e) => setCalls(parseInt(e.target.value) || 0)} />
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={updateCalls} disabled={loading.calls}>
            <ButtonContent loading={loading.calls} success={success.calls}>
              <Check size={16} /> Update Calls
            </ButtonContent>
          </button>
        </div>

        {/* Booking */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <DollarSign size={20} /> Add Booking
          </h3>
          <div className="form-group">
            <label className="form-label">Profit Amount ($)</label>
            <input type="number" step="0.01" className="form-input" placeholder="0.00" value={booking.profit} onChange={(e) => setBooking({ ...booking, profit: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label">
              Time Since Last (min) 
              <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '0.5rem' }}>
                (Auto: {Math.floor(timerSeconds / 60)} min)
              </span>
            </label>
            <input type="number" className="form-input" placeholder="Leave empty to use timer" value={booking.time_since_last} onChange={(e) => setBooking({ ...booking, time_since_last: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={booking.is_prepaid} onChange={(e) => setBooking({ ...booking, is_prepaid: e.target.checked })} />
              Prepaid
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={booking.has_refund_protection} onChange={(e) => setBooking({ ...booking, has_refund_protection: e.target.checked })} />
              Refund Protection
            </label>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={addBooking} disabled={loading.booking}>
            <ButtonContent loading={loading.booking} success={success.booking}>
              <Plus size={16} /> Add Booking
            </ButtonContent>
          </button>
        </div>

        {/* Spin */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Gift size={20} /> Add Spin
          </h3>
          <div className="form-group">
            <label className="form-label">Amount ($)</label>
            <input type="number" step="0.01" className="form-input" placeholder="0.00" value={spin.amount} onChange={(e) => setSpin({ ...spin, amount: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label">Booking Number</label>
            <input type="number" className="form-input" placeholder="1" value={spin.booking_number} onChange={(e) => setSpin({ ...spin, booking_number: e.target.value })} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={spin.is_mega} onChange={(e) => setSpin({ ...spin, is_mega: e.target.checked })} />
            Mega Spin
          </label>
          <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={addSpin} disabled={loading.spin}>
            <ButtonContent loading={loading.spin} success={success.spin}>
              <Plus size={16} /> Add Spin
            </ButtonContent>
          </button>
        </div>

        {/* Misc Income */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <DollarSign size={20} /> Add Misc Income
          </h3>
          <div className="form-group">
            <label className="form-label">Amount ($)</label>
            <input type="number" step="0.01" className="form-input" placeholder="0.00" value={misc.amount} onChange={(e) => setMisc({ ...misc, amount: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label">Source</label>
            <select className="form-input" value={misc.source} onChange={(e) => setMisc({ ...misc, source: e.target.value })}>
              <option value="request_lead">Request Lead</option>
              <option value="refund_protection">Refund Protection</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label">Description (optional)</label>
            <input type="text" className="form-input" placeholder="Notes..." value={misc.description} onChange={(e) => setMisc({ ...misc, description: e.target.value })} />
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={addMisc} disabled={loading.misc}>
            <ButtonContent loading={loading.misc} success={success.misc}>
              <Plus size={16} /> Add Misc Income
            </ButtonContent>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataEntry;