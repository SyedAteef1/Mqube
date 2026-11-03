import React from 'react';

export type TransactionState = 'DRAFT' | 'VERIFICATION' | 'COMPLETED' | 'CANCELLED';

interface TransactionStepperProps {
  currentState: TransactionState;
  onStateChange?: (state: TransactionState) => void;
  readOnly?: boolean;
}

const STEPS: { key: TransactionState; label: string; description: string; icon: string }[] = [
  {
    key: 'DRAFT',
    label: '1. Draft',
    description: 'Entry & Editing',
    icon: 'edit_note',
  },
  {
    key: 'VERIFICATION',
    label: '2. Verification',
    description: 'Audit & Tax Rule Check',
    icon: 'fact_check',
  },
  {
    key: 'COMPLETED',
    label: '3. Completion',
    description: 'Posted to Ledger',
    icon: 'task_alt',
  },
];

export const TransactionStepper: React.FC<TransactionStepperProps> = ({
  currentState,
  onStateChange,
  readOnly = false,
}) => {
  const getStepStatus = (stepKey: TransactionState) => {
    if (currentState === 'CANCELLED') return 'cancelled';
    if (stepKey === currentState) return 'active';
    
    const stateOrder: TransactionState[] = ['DRAFT', 'VERIFICATION', 'COMPLETED'];
    const currentIndex = stateOrder.indexOf(currentState);
    const stepIndex = stateOrder.indexOf(stepKey);

    return stepIndex < currentIndex ? 'completed' : 'pending';
  };

  return (
    <div className="w-full bg-[#f9f9f9] border-b border-[#c6c6c6] px-4 py-2.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#434343]">
          Transaction State:
        </span>
        {currentState === 'CANCELLED' && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-[14px]">cancel</span> Cancelled
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 flex-1 justify-end max-w-2xl">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.key);
          const isClickable = !readOnly && onStateChange;

          return (
            <React.Fragment key={step.key}>
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStateChange(step.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-left ${
                  status === 'active'
                    ? 'bg-[#545454] text-white shadow-xs font-semibold'
                    : status === 'completed'
                    ? 'bg-[#abf4ac]/30 text-[#286b33] font-medium border border-[#286b33]/20'
                    : 'bg-white text-[#474747] border border-[#c6c6c6] hover:border-[#545454]'
                } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    status === 'active' ? 'text-white' : status === 'completed' ? 'text-[#286b33]' : 'text-[#777777]'
                  }`}
                >
                  {status === 'completed' ? 'check_circle' : step.icon}
                </span>
                <div>
                  <div className="text-xs leading-none">{step.label}</div>
                  <div
                    className={`text-[10px] mt-0.5 leading-none ${
                      status === 'active' ? 'text-indigo-100' : 'text-[#777777]'
                    }`}
                  >
                    {step.description}
                  </div>
                </div>
              </button>

              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 max-w-[32px] ${
                    status === 'completed' ? 'bg-[#286b33]' : 'bg-[#c6c6c6]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
