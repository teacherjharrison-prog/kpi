import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, RotateCcw, DollarSign, Target, Phone, Calendar, Gift, Clock } from 'lucide-react';

// DEFAULTS
const DEFAULT_GOALS = {
  calls_biweekly: 10,
  reservations_biweekly: 5,
  profit_biweekly: 0,
  spins_biweekly: 0,
  combined_biweekly: 0,
  misc_biweekly: 0,
  calls_daily: 0,
  reservations_daily: 0,
  profit_daily: 0,
  spins_daily: 0,
  avg_time_per_booking: 0,
};

const DEFAULT_CONVERSION = {
  exchange_rate: 15.86,
  processing_fee_percent: 17, // 17% processing fee
  period_fee: 100
};

// Settings component
function Settings({ goals, setGoals, onSettingsChange }) {
  const [conversion, setConversion] = useState(DEFAULT_CONVERSION);
  const [saved, setSaved] = useState(false);

  // Load saved settings from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('kpi_goals');
    const savedConversion = localStorage.getItem('kpi_conversion');
    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedConversion) setConversion(JSON.parse(savedConversion));
  }, [setGoals]);

  const handleGoalChange = (key, value) => {
    setGoals(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleConversionChange = (key, value) => {
    setConversion(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const saveSettings = () => {
    localStorage.setItem('kpi_goals', JSON.stringify(goals));
    localStorage.setItem('kpi_conversion', JSON.stringify(conversion));

    if (onSettingsChange) onSettingsChange({ goals, conversion });

    window.dispatchEvent(new Event('kpi_updated'));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetToDefaults = () => {
    setGoals(DEFAULT_GOALS);
    setConversion(DEFAULT_CONVERSION);
    localStorage.removeItem('kpi_goals');
    localStorage.removeItem('kpi_conversion');
    if (onSettingsChange) onSettingsChange({ goals: DEFAULT_GOALS, conversion: DEFAULT_CONVERSION });
  };

  // Helper function to convert USD to Pesos with 17% fee
  const convertToPesos = (usdAmount) => {
    if (!usdAmount || !conversion.exchange_rate) return 0;
    const baseConversion = usdAmount * conversion.exchange_rate;
    const processingFee = baseConversion * (conversion.processing_fee_percent / 100);
    return baseConversion + processingFee;
  };

  // Helper function to get conversion breakdown
  const getConversionBreakdown = (usdAmount) => {
    if (!usdAmount || !conversion.exchange_rate) {
      return { base: 0, fee: 0, total: 0 };
    }
    const base = usdAmount * conversion.exchange_rate;
    const fee = base * (conversion.processing_fee_percent / 100);
    return {
      base: base,
      fee: fee,
      total: base + fee
    };
  };

  const GoalInput = ({ label, icon: Icon, value, onChange, prefix = '' }) => (
    <div className="form-group">
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {Icon && <Icon size={14} />} {label}
      </label>
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
            {prefix}
          </span>
        )}
        <input
          type="number"
          step="0.01"
          className="form-input"
          style={{ paddingLeft: prefix ? '28px' : '12px' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );

  // Example calculation for display
  const exampleAmount = 100;
  const exampleBreakdown = getConversionBreakdown(exampleAmount);

  return (
    <div data-testid="settings">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="section-title font-display" style={{ fontSize: '2rem', margin: 0 }}>
          <SettingsIcon size={24} /> Settings
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={resetToDefaults} data-testid="reset-defaults-btn">
            <RotateCcw size={16} /> Reset Defaults
          </button>
          <button onClick={saveSettings} style={{ background: saved ? 'var(--success)' : 'var(--primary)' }} data-testid="save-settings-btn">
            <Save size={16} /> {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Peso Conversion Settings */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#FEF3C7', border: '2px solid #F59E0B' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#92400E' }}>
          <DollarSign size={20} /> Peso Conversion Settings
        </h3>
        <div className="grid grid-3" style={{ gap: '1rem' }}>
          <GoalInput 
            label="Exchange Rate (USD → MXN)" 
            value={conversion.exchange_rate} 
            onChange={(v) => handleConversionChange('exchange_rate', v)} 
          />
          <GoalInput 
            label="Processing Fee (%)" 
            value={conversion.processing_fee_percent} 
            onChange={(v) => handleConversionChange('processing_fee_percent', v)} 
            prefix="%" 
          />
          <GoalInput 
            label="Period Fee (Pesos)" 
            value={conversion.period_fee} 
            onChange={(v) => handleConversionChange('period_fee', v)} 
            prefix="$" 
          />
        </div>
        
        {/* Conversion Example Display */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: 'white', 
          borderRadius: '8px',
          border: '1px solid #F59E0B'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#92400E', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Conversion Example (${exampleAmount} USD):
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }}>Base Rate:</span>
              <div style={{ fontWeight: 'bold', color: '#92400E' }}>
                ${exampleBreakdown.base.toFixed(2)} MXN
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }}>+ {conversion.processing_fee_percent}% Fee:</span>
              <div style={{ fontWeight: 'bold', color: '#92400E' }}>
                ${exampleBreakdown.fee.toFixed(2)} MXN
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }}>Total:</span>
              <div style={{ fontWeight: 'bold', color: '#92400E', fontSize: '1.1rem' }}>
                ${exampleBreakdown.total.toFixed(2)} MXN
              </div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#92400E', marginTop: '1rem' }}>
          Rate: $1 USD = ${conversion.exchange_rate} MXN + {conversion.processing_fee_percent}% fee | Period fee: ${conversion.period_fee} MXN
        </p>
      </div>

      {/* Biweekly Goals */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Target size={20} /> Biweekly Goals (Pay Period)
        </h3>
        <div className="grid grid-3" style={{ gap: '1rem' }}>
          <GoalInput label="Calls" icon={Phone} value={goals.calls_biweekly} onChange={(v) => handleGoalChange('calls_biweekly', v)} />
          <GoalInput label="Reservations" icon={Calendar} value={goals.reservations_biweekly} onChange={(v) => handleGoalChange('reservations_biweekly', v)} />
          <GoalInput label="Profit" icon={DollarSign} value={goals.profit_biweekly} onChange={(v) => handleGoalChange('profit_biweekly', v)} prefix="$" />
          <GoalInput label="Spins" icon={Gift} value={goals.spins_biweekly} onChange={(v) => handleGoalChange('spins_biweekly', v)} prefix="$" />
          <GoalInput label="Combined Earnings" icon={DollarSign} value={goals.combined_biweekly} onChange={(v) => handleGoalChange('combined_biweekly', v)} prefix="$" />
          <GoalInput label="Misc Income" icon={DollarSign} value={goals.misc_biweekly} onChange={(v) => handleGoalChange('misc_biweekly', v)} prefix="$" />
        </div>
      </div>

      {/* Daily Goals */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Clock size={20} /> Daily Goals
        </h3>
        <div className="grid grid-3" style={{ gap: '1rem' }}>
          <GoalInput label="Calls" icon={Phone} value={goals.calls_daily} onChange={(v) => handleGoalChange('calls_daily', v)} />
          <GoalInput label="Reservations" icon={Calendar} value={goals.reservations_daily} onChange={(v) => handleGoalChange('reservations_daily', v)} />
          <GoalInput label="Profit" icon={DollarSign} value={goals.profit_daily} onChange={(v) => handleGoalChange('profit_daily', v)} prefix="$" />
          <GoalInput label="Spins" icon={Gift} value={goals.spins_daily} onChange={(v) => handleGoalChange('spins_daily', v)} prefix="$" />
          <GoalInput label="Avg Time per Booking (min)" icon={Clock} value={goals.avg_time_per_booking} onChange={(v) => handleGoalChange('avg_time_per_booking', v)} />
        </div>
      </div>
    </div>
  );
}

// EXPORTS
export default Settings;

// Helper functions for use in other components
export const getStoredSettings = () => {
  const savedGoals = localStorage.getItem('kpi_goals');
  const savedConversion = localStorage.getItem('kpi_conversion');
  return {
    goals: savedGoals ? JSON.parse(savedGoals) : DEFAULT_GOALS,
    conversion: savedConversion ? JSON.parse(savedConversion) : DEFAULT_CONVERSION,
  };
};

// Conversion helper that can be imported in other components
export const convertUsdToPesos = (usdAmount, conversionSettings) => {
  if (!usdAmount || !conversionSettings?.exchange_rate) return 0;
  const base = usdAmount * conversionSettings.exchange_rate;
  const feePercent = conversionSettings.processing_fee_percent || 17;
  const fee = base * (feePercent / 100);
  return base + fee;
};

export const getConversionBreakdown = (usdAmount, conversionSettings) => {
  if (!usdAmount || !conversionSettings?.exchange_rate) {
    return { base: 0, fee: 0, total: 0 };
  }
  const base = usdAmount * conversionSettings.exchange_rate;
  const feePercent = conversionSettings.processing_fee_percent || 17;
  const fee = base * (feePercent / 100);
  return {
    base: base,
    fee: fee,
    total: base + fee
  };
};

