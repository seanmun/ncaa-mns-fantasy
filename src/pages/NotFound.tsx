import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="font-display text-8xl tracking-wide text-neon-green animate-glow select-none"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          className="mt-6 max-w-md font-body text-lg text-text-secondary"
        >
          This game went to overtime... and we lost the page.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
          className="mt-10"
        >
          <Link to="/dashboard">
            <Button variant="primary" size="lg">
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    </PageTransition>
  );
}
