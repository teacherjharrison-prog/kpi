import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, Phone, Calendar, DollarSign, Gift, Clock, Target, Banknote, 
  Play, Pause, RotateCcw, Trash2, Eye, Moon 
} from 'lucide-react';
import { getStoredSettings, convertUsdToPesos, getConversionBreakdown } from './Settings';

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

// Individual Reservation Card Component
const ReservationCard = ({ booking, onDelete, index }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="card" style={{ marginBottom: '0.5rem', background: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ 
            background: '#3b82f6', 
            color: 'white', 
            padding: '4px 8px', 
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}>
            #{index + 1}
          </span>
          <div>
            <div style={{ fontWeight: 'bold' }}>${booking.profit || 0} profit</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {booking.time_since_last || 0} min since last
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            onClick={() => onDelete(booking.id || booking._id)}
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
  // Get custom settings or defaults
  const settings = customSettings || getStoredSettings();
  const EXCHANGE_RATE = settings.conversion?.exchange_rate || 15.86;
  const PROCESSING_FEE = settings.conversion?.processing_fee_percent || 17;
  const PERIOD_FEE_PESOS = settings.conversion?.period_fee || 100;

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

  // Timer from props
  const { timerSeconds, isTimerRunning, isPaused, startTimer, pauseTimer, resumeTimer, stopTimer } = timer || {};

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // FIXED: Correct delete URL with today's date
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Delete this reservation? This cannot be undone.')) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_URL}/api/entries/${today}/bookings/${bookingId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      if (onDeleteBooking) onDeleteBooking(bookingId);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert('Failed to delete booking: ' + error.message);
    }
  };

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

  // Calculate conversions with 17% fee
  const todayProfit = todayEntry?.bookings?.reduce((sum, b) => sum + (b.profit || 0), 0) || 0;
  const todaySpins = todayEntry?.spins?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
  const todayMisc = todayEntry?.misc_income?.reduce((sum, m) => sum + (m.amount || 0), 0) || 0;
  const todayTotalUsd = todayProfit + todaySpins + todayMisc;
  
  const todayConversion = getConversionBreakdown(todayTotalUsd, settings.conversion);
  const periodConversion = getConversionBreakdown(stats.combined.total, settings.conversion);
  const periodNetPesos = periodConversion.total - PERIOD_FEE_PESOS;

  return (
    <div data-testid="dashboard">
      {/* Midnight Countdown */}
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

      {/* Individual Reservations List */}
      {todayEntry?.bookings?.length > 0 && (
        <div className="section">
          <h2 className="section-title"><Calendar size={20} /> Today's Reservations ({todayEntry.bookings.length})</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {todayEntry.bookings.map((booking, index) => (
              <ReservationCard 
                key={booking.id || booking._id || index} 
                booking={booking} 
                index={index}
                onDelete={handleDeleteBooking}
              />
            ))}
          </div>
        </div>
      )}

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

      {/* Peso Conversion with 17% Fee */}
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