import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { cn } from '@/lib/utils';

const SKELETON_BASE = '#1f2937'; // --bg-border
const SKELETON_HIGHLIGHT = '#374151'; // slightly lighter

interface SkeletonWrapperProps {
  children: React.ReactNode;
}

function SkeletonWrapper({ children }: SkeletonWrapperProps) {
  return (
    <SkeletonTheme baseColor={SKELETON_BASE} highlightColor={SKELETON_HIGHLIGHT}>
      {children}
    </SkeletonTheme>
  );
}

// -- Card skeleton ----------------------------------------------------------

interface CardSkeletonProps {
  lines?: number;
  className?: string;
}

export function CardSkeleton({ lines = 3, className }: CardSkeletonProps) {
  return (
    <SkeletonWrapper>
      <div
        className={cn(
          'bg-bg-card border border-bg-border rounded-xl p-4 space-y-3',
          className,
        )}
      >
        <Skeleton height={20} width="60%" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} height={14} />
        ))}
      </div>
    </SkeletonWrapper>
  );
}

// -- Table row skeleton -----------------------------------------------------

interface TableRowSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export function TableRowSkeleton({
  columns = 5,
  rows = 5,
  className,
}: TableRowSkeletonProps) {
  return (
    <SkeletonWrapper>
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center gap-4 bg-bg-card border border-bg-border rounded-lg px-4 py-3"
          >
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div key={colIdx} className="flex-1">
                <Skeleton height={14} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </SkeletonWrapper>
  );
}

// -- Page skeleton ----------------------------------------------------------

interface PageSkeletonProps {
  className?: string;
}

export function PageSkeleton({ className }: PageSkeletonProps) {
  return (
    <SkeletonWrapper>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="space-y-2">
          <Skeleton height={32} width="40%" />
          <Skeleton height={16} width="25%" />
        </div>

        {/* Content cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>

        {/* Table */}
        <TableRowSkeleton columns={4} rows={6} />
      </div>
    </SkeletonWrapper>
  );
}
