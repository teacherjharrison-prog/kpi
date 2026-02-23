import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, Phone, Calendar, DollarSign, Gift, Clock, Target, Banknote, 
  Play, Pause, RotateCcw, Trash2, Eye, Moon, Edit2, X, Check 
} from 'lucide-react';
import { getStoredSettings, getConversionBreakdown } from './Settings';

const KPICard = ({ label, value, goal, progress, status, icon: Icon, prefix = '' }) => {
  const getProgressColor = () => {
    if (progress >= 100) return 'success';
    if (progress >= 75) return 'warning';
    return 'danger';
  };

  return (
    <div className="card kpi-card" data-testid={`kpi-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="kpi-label">{label}</span>
        {Icon && <Icon size={18} style={{ color: 'var(--text-tertiary)' }} />}
      </div>
      <div className="kpi-value">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="progress-bar">
        <div
          className={`progress-fill ${getProgressColor()}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="kpi-meta">
        {value >= goal ? (
          <span className={`badge on_track`}>✓ Goal reached!</span>
        ) : (
          <span>{prefix}{(goal - value).toLocaleString()} more needed</span>
        )}
      </div>
    </div>
  );
};

const Skeleton = ({ height = 120 }) => (
  <div className="card skeleton" style={{ height }} />
);

// Individual Reservation Card with EDIT capability
const ReservationCard = ({ booking, onDelete, onEdit, index, entryDate }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editProfit, setEditProfit] = useState(booking.profit || 0);

  const handleSave = () => {
    onEdit(booking.id || booking._id, { ...booking, profit: parseFloat(editProfit) });
    setIsEditing(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="card" style={{ marginBottom: '0.5rem', background: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <span style={{ 
            background: '#3b82f6', 
            color: 'white', 
            padding: '4px 8px', 
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            minWidth: '60px'
          }}>
            #{index + 1}
          </span>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold', color: '#1e293b' }}>
                {formatDate(entryDate)}
              </span>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                {formatTime(booking.timestamp)}
              </span>
              {booking.is_prepaid && (
                <span style={{ 
                  background: '#10b981', 
                  color: 'white', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  fontSize: '0.7rem'
                }}>
                  PREPAID
                </span>
              )}
            </div>
            
            {isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>$</span>
                <input
                  type="number"
                  value={editProfit}
                  onChange={(e) => setEditProfit(e.target.value)}
                  style={{ 
                    width: '80px', 
                    padding: '4px 8px',
                    border: '1px solid #3b82f6',
                    borderRadius: '4px'
                  }}
                  autoFocus
                />
                <button onClick={handleSave} style={{ 
                  background: '#10b981', 
                  color: 'white', 
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  <Check size={14} />
                </button>
                <button onClick={() => {
                  setIsEditing(false);
                  setEditProfit(booking.profit || 0);
                }} style={{ 
                  background: '#ef4444', 
                  color: 'white', 
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#059669' }}>
                ${booking.profit || 0} profit
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: '#64748b', 
                  fontWeight: 'normal',
                  marginLeft: '1rem'
                }}>
                  {booking.time_since_last || 0} min since last
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              style={{ 
                background: '#dbeafe', 
                border: 'none', 
                padding: '8px', 
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#2563eb'
              }}
            >
              <Edit2 size={16} />
            </button>
          )}
          <button 
            onClick={() => setShowDetails(!showDetails)}
            style={{ 
              background: '#e2e8f0', 
              border: 'none', 
              padding: '8px', 
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => onDelete(booking.id || booking._id, entryDate)}
            style={{ 
              background: '#fee2e2', 
              border: 'none', 
              padding: '8px', 
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#dc2626'
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {showDetails && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: 'white', 
          borderRadius: '6px',
          border: '1px solid #e2e8f0'
        }}>
          <pre style={{ margin: 0, fontSize: '0.875rem', overflow: 'auto' }}>
            {JSON.stringify(booking, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// Midnight Countdown Component
const MidnightCountdown = () => {
  const [timeUntilMidnight, setTimeUntilMidnight] = useState('');

  useEffect(() => {
    const calculateTimeUntilMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${hours}h ${minutes}m ${seconds}s`;
    };

    setTimeUntilMidnight(calculateTimeUntilMidnight());
    const interval = setInterval(() => {
      setTimeUntilMidnight(calculateTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card" style={{ 
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', 
      color: 'white',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Moon size={24} style={{ color: '#fbbf24' }} />
        <div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Daily Reset In</div>
          <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {timeUntilMidnight}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>
            Stats auto-save at midnight
          </div>
        </div>
      </div>
    </div>
  );
};

function Dashboard({ 
  stats, 
  todayEntry, 
  periodInfo, 
  goals, 
  loading, 
  customSettings, 
  timer,
  onRefresh,
  onDeleteBooking,
  API_URL
}) {
  const [allEntries, setAllEntries] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  
  const settings = customSettings || getStoredSettings();
  const EXCHANGE_RATE = settings.conversion?.exchange_rate || 15.86;
  const PROCESSING_FEE = settings.conversion?.processing_fee_percent || 17;
  const PERIOD_FEE_PESOS = settings.conversion?.period_fee || 100;

  // Fetch all entries for the period
  useEffect(() => {
    const fetchAllEntries = async () => {
      if (!periodInfo?.start_date || !periodInfo?.end_date) return;
      
      try {
        const response = await fetch(
          `${API_URL}/api/entries?start_date=${periodInfo.start_date}&end_date=${periodInfo.end_date}`
        );
        if (response.ok) {
          const entries = await response.json();
          setAllEntries(entries);
          
          // Extract all reservations with their dates
          const reservations = [];
          entries.forEach(entry => {
            if (entry.bookings) {
              entry.bookings.forEach(booking => {
                reservations.push({
                  ...booking,
                  entryDate: entry.date,
                  entryId: entry.id
                });
              });
            }
          });
          
          // Sort by timestamp (newest first)
          reservations.sort((a, b) => {
            const dateA = new Date(b.timestamp || b.created_at || 0);
            const dateB = new Date(a.timestamp || a.created_at || 0);
            return dateA - dateB;
          });
          
          setAllReservations(reservations);
        }
      } catch (error) {
        console.error('Failed to fetch entries:', error);
      }
    };
    
    fetchAllEntries();
  }, [API_URL, periodInfo, stats]); // Refetch when stats update

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdate = () => {
      if (onRefresh) onRefresh();
    };

    window.addEventListener('kpi_updated', handleSettingsUpdate);
    return () => window.removeEventListener('kpi_updated', handleSettingsUpdate);
  }, [onRefresh]);

  // Check for midnight reset
  useEffect(() => {
    const checkMidnightReset = () => {
      const lastDate = localStorage.getItem('lastActiveDate');
      const today = new Date().toDateString();
      
      if (lastDate && lastDate !== today) {
        if (onRefresh) onRefresh();
      }
      localStorage.setItem('lastActiveDate', today);
    };

    checkMidnightReset();
    const interval = setInterval(checkMidnightReset, 60000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const { timerSeconds, isTimerRunning, isPaused, startTimer, pauseTimer, resumeTimer, stopTimer } = timer || {};

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Delete booking
  const handleDeleteBooking = useCallback(async (bookingId, entryDate) => {
    if (!window.confirm('Delete this reservation? This cannot be undone.')) return;
    
    try {
      const date = entryDate || new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_URL}/api/entries/${date}/bookings/${bookingId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      // Update local state
      setAllReservations(prev => prev.filter(r => r.id !== bookingId && r._id !== bookingId));
      if (onDeleteBooking) onDeleteBooking(bookingId);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert('Failed to delete booking: ' + error.message);
    }
  }, [API_URL, onDeleteBooking, onRefresh]);

  // Edit booking
  const handleEditBooking = useCallback(async (bookingId, updatedBooking) => {
    try {
      const date = updatedBooking.entryDate || new Date().toISOString().split('T')[0];
      
      // First delete old booking
      await fetch(`${API_URL}/api/entries/${date}/bookings/${bookingId}`, {
        method: 'DELETE'
      });
      
      // Then add updated booking
      const response = await fetch(`${API_URL}/api/entries/${date}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profit: updatedBooking.profit,
          is_prepaid: updatedBooking.is_prepaid,
          has_refund_protection: updatedBooking.has_refund_protection,
          time_since_last: updatedBooking.time_since_last
        })
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      // Refresh data
      if (onRefresh) onRefresh();
      
      // Update local state
      setAllReservations(prev => prev.map(r => 
        (r.id === bookingId || r._id === bookingId) ? { ...updatedBooking, id: bookingId } : r
      ));
      
    } catch (error) {
      alert('Failed to update booking: ' + error.message);
    }
  }, [API_URL, onRefresh]);

  if (loading) {
    return (
      <div>
        <div className="section">
          <div className="skeleton" style={{ height: 32, width: 200, marginBottom: '1rem' }} />
          <div className="grid grid-4">
            {[1,2,3,4].map(i => <Skeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const todayProfit = todayEntry?.bookings?.reduce((sum, b) => sum + (b.profit || 0), 0) || 0;
  const todaySpins = todayEntry?.spins?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
  const todayMisc = todayEntry?.misc_income?.reduce((sum, m) => sum + (m.amount || 0), 0) || 0;
  const todayTotalUsd = todayProfit + todaySpins + todayMisc;
  
  const todayConversion = getConversionBreakdown(todayTotalUsd, settings.conversion);
  const periodConversion = getConversionBreakdown(stats.combined.total, settings.conversion);
  const periodNetPesos = periodConversion.total - PERIOD_FEE_PESOS;

  return (
    <div data-testid="dashboard">
      <MidnightCountdown />

      {/* Timer Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#1a1a1a', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>CURRENT</div>
              <div className="font-display" style={{ fontSize: '2.5rem', fontWeight: 900 }}>{formatTime(timerSeconds)}</div>
            </div>
            <div style={{ borderLeft: '1px solid #444', paddingLeft: '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>LAST BOOKING</div>
              <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {(() => {
                  const bookings = todayEntry?.bookings || [];
                  if (bookings.length === 0) return '—';
                  const lastBooking = bookings[bookings.length - 1];
                  return `${lastBooking.time_since_last || 0} min`;
                })()}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid #444', paddingLeft: '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>PERIOD AVG</div>
              <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {stats?.avg_time?.average || 0} min
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isTimerRunning ? (
              <button onClick={startTimer} style={{ background: '#34C759', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: 700, cursor: 'pointer' }}>
                <Play size={20} /> START
              </button>
            ) : isPaused ? (
              <button onClick={resumeTimer} style={{ background: '#34C759', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: 700, cursor: 'pointer' }}>
                <Play size={20} /> RESUME
              </button>
            ) : (
              <button onClick={pauseTimer} style={{ background: '#F59E0B', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: 700, cursor: 'pointer' }}>
                <Pause size={20} /> PAUSE
              </button>
            )}
            <button onClick={stopTimer} style={{ background: '#FF3B30', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: 700, cursor: 'pointer' }}>
              <RotateCcw size={20} /> STOP
            </button>
          </div>
        </div>
      </div>

      {/* Period Info */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--primary)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Current Period</div>
            <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {periodInfo?.start_date} → {periodInfo?.end_date}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900 }} className="font-display">
              {periodInfo?.days_remaining}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>DAYS LEFT</div>
          </div>
        </div>
      </div>

      {/* Today's Activity */}
      <div className="section">
        <h2 className="section-title"><Clock size={20} /> Today's Activity</h2>
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div className="kpi-label">Calls</div>
              <div className="font-display" style={{ fontSize: '2rem', fontWeight: 700 }}>
                {todayEntry?.calls_received || 0}
              </div>
            </div>
            <div>
              <div className="kpi-label">Bookings</div>
              <div className="font-display" style={{ fontSize: '2rem', fontWeight: 700 }}>
                {todayEntry?.bookings?.length || 0}
              </div>
            </div>
            <div>
              <div className="kpi-label">Spins</div>
              <div className="font-display" style={{ fontSize: '2rem', fontWeight: 700 }}>
                {todayEntry?.spins?.length || 0}
              </div>
            </div>
            <div>
              <div className="kpi-label">Misc Income</div>
              <div className="font-display" style={{ fontSize: '2rem', fontWeight: 700 }}>
                {todayEntry?.misc_income?.length || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALL PERIOD RESERVATIONS - NEW SECTION */}
      <div className="section">
        <h2 className="section-title">
          <Calendar size={20} /> 
          All Period Reservations ({allReservations.length})
        </h2>
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {allReservations.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              No reservations yet this period
            </div>
          ) : (
            allReservations.map((booking, index) => (
              <ReservationCard 
                key={booking.id || booking._id || index} 
                booking={booking} 
                index={index}
                entryDate={booking.entryDate}
                onDelete={handleDeleteBooking}
                onEdit={handleEditBooking}
              />
            ))
          )}
        </div>
      </div>

      {/* Performance */}
      <div className="section">
        <h2 className="section-title"><TrendingUp size={20} /> Performance</h2>
        <div className="grid grid-4">
          <div className="card kpi-card">
            <span className="kpi-label">Combined Earnings</span>
            <div className="kpi-value">${stats.combined.total.toLocaleString()}</div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${stats.combined.status === 'on_track' ? 'success' : stats.combined.status === 'warning' ? 'warning' : 'danger'}`}
                style={{ width: `${Math.min(stats.combined.progress_percent, 100)}%` }}
              />
            </div>
          </div>

          <div className="card kpi-card" style={{ background: '#FEF3C7', border: '2px solid #F59E0B' }}>
            <span className="kpi-label" style={{ color: '#92400E' }}>Spin Progress</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span className="kpi-value" style={{ color: '#78350F' }}>{stats.reservations.prepaid_count || 0}</span>
              <span style={{ fontSize: '1rem', color: '#92400E' }}>prepaid</span>
            </div>
            <div className="progress-bar" style={{ background: '#FDE68A' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${((stats.reservations.prepaid_count || 0) % 4) / 4 * 100}%`,
                  background: '#F59E0B'
                }}
              />
            </div>
            <div className="kpi-meta" style={{ color: '#92400E' }}>
              {4 - ((stats.reservations.prepaid_count || 0) % 4)} more prepaid → next spin
            </div>
          </div>

          <div className="card kpi-card">
            <span className="kpi-label">Conversion Rate</span>
            <div className="kpi-value">{stats.conversion_rate.rate}%</div>
          </div>

          <div className="card kpi-card">
            <span className="kpi-label">Avg Time/Booking</span>
            <div className="kpi-value">{stats.avg_time.average} min</div>
          </div>
        </div>
      </div>

      {/* Peso Conversion */}
      <div className="section">
        <h2 className="section-title">
          <Banknote size={20} /> 
          Pesos Conversion (Rate: {EXCHANGE_RATE} + {PROCESSING_FEE}% fee)
        </h2>
        <div className="grid grid-2">
          <div className="card" style={{ background: '#FEF3C7', border: '2px solid #F59E0B' }}>
            <span className="kpi-label" style={{ color: '#92400E' }}>Today's Earnings (with fee)</span>
            <div className="font-display" style={{ fontSize: '2rem', fontWeight: 900, color: '#78350F' }}>
              ${todayConversion.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
            </div>
            <div style={{ fontSize: '0.875rem', color: '#92400E', marginTop: '0.5rem' }}>
              Base: ${todayConversion.base.toFixed(2)} + Fee: ${todayConversion.fee.toFixed(2)}
            </div>
          </div>

          <div className="card" style={{ background: '#D1FAE5', border: '2px solid #10B981' }}>
            <span className="kpi-label" style={{ color: '#065F46' }}>Pay Period Total (with fee)</span>
            <div className="font-display" style={{ fontSize: '2rem', fontWeight: 900, color: '#064E3B' }}>
              ${periodNetPesos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
            </div>
            <div style={{ fontSize: '0.875rem', color: '#065F46', marginTop: '0.5rem' }}>
              Gross: ${periodConversion.total.toFixed(2)} - Period Fee: ${PERIOD_FEE_PESOS}
            </div>
          </div>
        </div>
      </div>

      {/* Biweekly Progress */}
      <div className="section">
        <h2 className="section-title"><Target size={20} /> Biweekly Progress</h2>
        <div className="grid grid-4">
          <KPICard label="Calls" value={stats.calls.total} goal={stats.calls.goal} progress={stats.calls.progress_percent} status={stats.calls.status} icon={Phone} />
          <KPICard label="Reservations" value={stats.reservations.total} goal={stats.reservations.goal} progress={stats.reservations.progress_percent} status={stats.reservations.status} icon={Calendar} />
          <KPICard label="Profit" value={stats.profit.total} goal={stats.profit.goal} progress={stats.profit.progress_percent} status={stats.profit.status} icon={DollarSign} prefix="$" />
          <KPICard label="Spins" value={stats.spins.total} goal={stats.spins.goal} progress={stats.spins.progress_percent} status={stats.spins.status} icon={Gift} prefix="$" />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;