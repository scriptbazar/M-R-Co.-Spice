import React from 'react';
import { ClipboardList, ThumbsUp, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OrderStepper({ status }) {
  const steps = [
    { label: 'Placed', icon: ClipboardList },
    { label: 'Confirmed', icon: ThumbsUp },
    { label: 'Packed', icon: Package },
    { label: 'Shipped', icon: Truck },
    { label: 'Delivered', icon: CheckCircle2 }
  ];

  if (status === 'Cancelled') {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: '#FFEBEE',
          color: 'var(--error)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          margin: '2rem 0',
          fontWeight: '600'
        }}
      >
        <AlertCircle size={24} />
        This order has been Cancelled.
      </div>
    );
  }

  if (status === 'Refunded') {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: '#E8F5E9',
          color: 'var(--success)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          margin: '2rem 0',
          fontWeight: '600'
        }}
      >
        <AlertCircle size={24} />
        This order has been Cancelled and Refunded.
      </div>
    );
  }

  // Determine active index
  const statusToIndex = {
    'Placed': 0,
    'Confirmed': 1,
    'Packed': 2,
    'Shipped': 3,
    'Delivered': 4
  };

  const currentIndex = statusToIndex[status] !== undefined ? statusToIndex[status] : 0;
  const progressWidth = `${(currentIndex / 4) * 100}%`;

  return (
    <div style={{ margin: '2rem 0' }}>
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontFamily: 'var(--font-body)' }}>Order Progress</h3>
      
      <div className="stepper-container">
        {/* Progress Line */}
        <div className="stepper-line">
          <div className="stepper-line-fill" style={{ width: progressWidth }}></div>
        </div>

        {/* Step Items */}
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          
          let stepClass = "";
          if (isCompleted) stepClass = "completed";
          else if (isActive) stepClass = "active";

          return (
            <div key={idx} className={`stepper-step ${stepClass}`}>
              <div className="step-circle">
                <StepIcon size={16} />
              </div>
              <div className="step-label" style={{ 
                color: isActive ? 'var(--secondary)' : (isCompleted ? 'var(--success)' : 'var(--text-light)'),
                fontWeight: isActive || isCompleted ? '600' : '400'
              }}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
