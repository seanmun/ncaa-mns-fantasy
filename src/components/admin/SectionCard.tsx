import { motion } from 'framer-motion';

export interface SectionCardProps {
  title: string;
  icon: React.ElementType;
  delay: number;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  icon: Icon,
  delay,
  children,
}: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-bg-border bg-bg-card p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon-green/10">
          <Icon className="h-5 w-5 text-neon-green" />
        </div>
        <h2 className="font-display text-xl tracking-wide text-text-primary">
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  );
}
