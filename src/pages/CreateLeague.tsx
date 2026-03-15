import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Globe, Lock, DollarSign, Users, Wallet } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import PageTransition from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/Button';

/* ------------------------------------------------------------------ */
/*  Validation schema                                                  */
/* ------------------------------------------------------------------ */

const createLeagueSchema = z.object({
  name: z
    .string()
    .min(3, 'League name must be at least 3 characters')
    .max(50, 'League name must be 50 characters or fewer'),
  teamName: z
    .string()
    .min(2, 'Team name must be at least 2 characters')
    .max(30, 'Team name must be 30 characters or fewer'),
  visibility: z.enum(['public', 'private']),
  buyInAmount: z.coerce
    .number()
    .min(0, 'Buy-in cannot be negative')
    .default(0),
  buyInCurrency: z.enum(['USD', 'ETH', 'BTC']).default('USD'),
  cryptoWalletAddress: z.string().optional(),
  cryptoWalletType: z.enum(['eth', 'btc']).optional(),
  maxMembers: z.coerce
    .number()
    .min(2, 'Must allow at least 2 members')
    .max(500, 'Maximum 500 members')
    .default(50),
});

type CreateLeagueFormData = z.infer<typeof createLeagueSchema>;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CreateLeague() {
  const navigate = useNavigate();
  const { apiFetch } = useApi();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateLeagueFormData>({
    resolver: zodResolver(createLeagueSchema),
    defaultValues: {
      visibility: 'private',
      buyInAmount: 0,
      buyInCurrency: 'USD',
      maxMembers: 50,
    },
  });

  const visibility = watch('visibility');
  const buyInAmount = watch('buyInAmount');
  const buyInCurrency = watch('buyInCurrency');

  const showCurrencySelect = buyInAmount > 0;
  const showWalletInput =
    showCurrencySelect && (buyInCurrency === 'ETH' || buyInCurrency === 'BTC');

  const onSubmit = async (data: CreateLeagueFormData) => {
    setIsSubmitting(true);
    try {
      // Set cryptoWalletType based on currency selection
      const payload = {
        ...data,
        cryptoWalletType:
          data.buyInCurrency === 'ETH'
            ? 'eth'
            : data.buyInCurrency === 'BTC'
              ? 'btc'
              : undefined,
      };
      const league = await apiFetch('/api/leagues', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success('League created! Share the invite link with your friends.');
      navigate(`/leagues/${league.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create league';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Page title */}
        <h1 className="font-display text-3xl tracking-wide text-text-primary mb-8">
          Create a League
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ---- League Name ---- */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl bg-bg-card border border-bg-border p-5 space-y-4"
          >
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-text-primary"
            >
              League Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="March Madness Elite"
              {...register('name')}
              className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors"
            />
            {errors.name && (
              <p className="text-xs text-neon-red">{errors.name.message}</p>
            )}
          </motion.div>

          {/* ---- Your Team Name ---- */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-bg-card border border-bg-border p-5 space-y-4"
          >
            <label
              htmlFor="teamName"
              className="block text-sm font-semibold text-text-primary"
            >
              Your Team Name
            </label>
            <input
              id="teamName"
              type="text"
              placeholder="Bracket Busters"
              {...register('teamName')}
              className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors"
            />
            {errors.teamName && (
              <p className="text-xs text-neon-red">{errors.teamName.message}</p>
            )}
          </motion.div>

          {/* ---- Visibility ---- */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl bg-bg-card border border-bg-border p-5 space-y-4"
          >
            <span className="block text-sm font-semibold text-text-primary">
              Visibility
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValue('visibility', 'public')}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-150 ${
                  visibility === 'public'
                    ? 'bg-neon-green text-gray-900 shadow-[0_0_15px_rgba(0,255,135,0.3)]'
                    : 'bg-bg-primary border border-bg-border text-text-secondary hover:text-text-primary hover:bg-bg-card-hover'
                }`}
              >
                <Globe className="h-4 w-4" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setValue('visibility', 'private')}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-150 ${
                  visibility === 'private'
                    ? 'bg-neon-green text-gray-900 shadow-[0_0_15px_rgba(0,255,135,0.3)]'
                    : 'bg-bg-primary border border-bg-border text-text-secondary hover:text-text-primary hover:bg-bg-card-hover'
                }`}
              >
                <Lock className="h-4 w-4" />
                Private
              </button>
            </div>
          </motion.div>

          {/* ---- Buy-In ---- */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-bg-card border border-bg-border p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-neon-green" />
              <label
                htmlFor="buyInAmount"
                className="text-sm font-semibold text-text-primary"
              >
                Buy-In Amount
              </label>
            </div>
            <input
              id="buyInAmount"
              type="number"
              min={0}
              step="any"
              {...register('buyInAmount')}
              className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors"
            />
            {errors.buyInAmount && (
              <p className="text-xs text-neon-red">
                {errors.buyInAmount.message}
              </p>
            )}

            {/* Currency selector — only visible when buy-in > 0 */}
            {showCurrencySelect && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label
                  htmlFor="buyInCurrency"
                  className="block text-sm font-medium text-text-secondary"
                >
                  Currency
                </label>
                <select
                  id="buyInCurrency"
                  {...register('buyInCurrency')}
                  className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors"
                >
                  <option value="USD">USD</option>
                  <option value="ETH">ETH</option>
                  <option value="BTC">BTC</option>
                </select>
              </motion.div>
            )}

            {/* Wallet address — only visible for crypto currencies */}
            {showWalletInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-neon-cyan" />
                  <label
                    htmlFor="cryptoWalletAddress"
                    className="text-sm font-medium text-text-secondary"
                  >
                    Crypto Wallet Address
                  </label>
                </div>
                <input
                  id="cryptoWalletAddress"
                  type="text"
                  placeholder={
                    buyInCurrency === 'ETH' ? '0x...' : 'bc1...'
                  }
                  {...register('cryptoWalletAddress')}
                  className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors font-mono"
                />
                <p className="text-xs text-text-muted">
                  Optional: share your wallet so members can send their buy-in
                  directly. MNSfantasy does not handle payments.
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* ---- Max Members ---- */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl bg-bg-card border border-bg-border p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-neon-green" />
              <label
                htmlFor="maxMembers"
                className="text-sm font-semibold text-text-primary"
              >
                Max Members
              </label>
            </div>
            <input
              id="maxMembers"
              type="number"
              min={2}
              max={500}
              {...register('maxMembers')}
              className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors"
            />
            {errors.maxMembers && (
              <p className="text-xs text-neon-red">
                {errors.maxMembers.message}
              </p>
            )}
          </motion.div>

          {/* ---- Submit ---- */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full"
            >
              Create League
            </Button>
          </motion.div>
        </form>
      </div>
    </PageTransition>
  );
}
