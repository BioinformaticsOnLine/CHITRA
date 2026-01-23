'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps, type Transition } from 'motion/react';

import {
  SlidingNumber,
  type SlidingNumberProps,
} from '@/components/animate-ui/text/sliding-number';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CounterProps = HTMLMotionProps<'div'> & {
  number: number;
  setNumber: (number: number) => void;
  slidingNumberProps?: Omit<SlidingNumberProps, 'number'>;
  buttonProps?: Omit<React.ComponentProps<typeof Button>, 'onClick'>;
  transition?: Transition;
  min?: number;
  max?: number;
  step?: number;
};

function Counter({
  number,
  setNumber,
  className,
  slidingNumberProps,
  buttonProps,
  transition = { type: 'spring', bounce: 0, stiffness: 300, damping: 30 },
  min,
  max,
  step = 1,
  ...props
}: CounterProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(String(number));
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
      const stepVal = step || 1;
      const nextVal = number + stepVal;
      if (max === undefined || nextVal <= max) {
        setNumber(nextVal);
      }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
      const stepVal = step || 1;
      const nextVal = number - stepVal;
      if (min === undefined || nextVal >= min) {
        setNumber(nextVal);
      }
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleInputBlur = () => {
    let newNumber = parseInt(inputValue, 10);
    if (!isNaN(newNumber)) {
      if (min !== undefined) newNumber = Math.max(min, newNumber);
      if (max !== undefined) newNumber = Math.min(max, newNumber);
      setNumber(newNumber);
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleInputBlur();
    } else if (event.key === 'Escape') {
      setInputValue(String(number));
      setIsEditing(false);
    }
  };

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(String(number));
    }
  }, [number, isEditing]);

  return (
    <motion.div
      data-slot="counter"
      layout
      tabIndex={0}
      onKeyDown={handleKeyDown}
      transition={transition}
      className={cn(
        'flex items-center justify-between w-full p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className,
      )}
      {...props}
    >
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="icon"
          {...buttonProps}
          onClick={() => {
            const nextVal = number - step;
            if (min === undefined || nextVal >= min) {
              setNumber(nextVal);
            }
          }}
          disabled={min !== undefined && number <= min}
          className={cn(
            'bg-white dark:bg-neutral-950 hover:bg-white/70 dark:hover:bg-neutral-950/70 text-neutral-950 dark:text-white text-2xl font-light pb-[3px] disabled:opacity-50 disabled:cursor-not-allowed',
            buttonProps?.className,
          )}
        >
          -
        </Button>
      </motion.div>

      <div
        className="relative h-8 grow flex items-center justify-center cursor-text"
        onClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-full text-center bg-transparent text-lg focus:outline-hidden"
          />
        ) : (
          <SlidingNumber
            number={number}
            {...slidingNumberProps}
            className={cn('text-lg', slidingNumberProps?.className)}
          />
        )}
      </div>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="icon"
          {...buttonProps}
          onClick={() => {
            const nextVal = number + step;
            if (max === undefined || nextVal <= max) {
              setNumber(nextVal);
            }
          }}
          disabled={max !== undefined && number >= max}
          className={cn(
            'bg-white dark:bg-neutral-950 hover:bg-white/70 dark:hover:bg-neutral-950/70 text-neutral-950 dark:text-white text-2xl font-light pb-[3px] disabled:opacity-50 disabled:cursor-not-allowed',
            buttonProps?.className,
          )}
        >
          +
        </Button>
      </motion.div>
    </motion.div>
  );
}

export { Counter, type CounterProps };