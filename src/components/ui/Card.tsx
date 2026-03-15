import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLMotionProps<'div'> {
  glowing?: boolean;
  onClick?: () => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ glowing = false, onClick, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={onClick ? { scale: 1.01 } : undefined}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={cn(
          'bg-bg-card border border-bg-border rounded-xl p-4 transition-colors duration-150',
          onClick && 'cursor-pointer hover:bg-bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
          glowing && 'border-neon-green/50 shadow-[0_0_15px_rgba(0,255,135,0.15)]',
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

Card.displayName = 'Card';
