import React from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 ml-1">{label}</label>}
        <input
          ref={ref}
          className={twMerge(
            'flex h-12 w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 ring-offset-white dark:ring-offset-zinc-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';