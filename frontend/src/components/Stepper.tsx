// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Check } from 'lucide-react';

interface StepperProps {
  steps: readonly string[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

/** Numbered circular stepper on desktop; a compact "Step X of Y" progress bar on mobile. */
export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="mb-6">
      <div className="hidden items-center md:flex">
        {steps.map((label, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          const clickable = isCompleted && !!onStepClick;
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStepClick?.(i)}
                className={`flex items-center gap-2 ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isCurrent || isCompleted
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : i + 1}
                </span>
                <span
                  className={`text-sm font-medium whitespace-nowrap ${
                    isCurrent ? 'text-indigo-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </button>
              {i < steps.length - 1 && <span className="mx-3 h-px flex-1 bg-slate-200" />}
            </div>
          );
        })}
      </div>

      <div className="md:hidden">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-indigo-700">{steps[currentStep]}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
