import { QRCodeSVG } from 'qrcode.react';
import { CopyButton } from '@/components/ui/CopyButton';
import { truncateAddress } from '@/lib/utils';

interface CryptoWalletDisplayProps {
  walletType: 'eth' | 'btc';
  address: string;
}

const WALLET_LABELS: Record<'eth' | 'btc', string> = {
  eth: 'Ethereum (ETH)',
  btc: 'Bitcoin (BTC)',
};

const WALLET_URI_PREFIX: Record<'eth' | 'btc', string> = {
  eth: 'ethereum:',
  btc: 'bitcoin:',
};

export function CryptoWalletDisplay({
  walletType,
  address,
}: CryptoWalletDisplayProps) {
  const qrValue = `${WALLET_URI_PREFIX[walletType]}${address}`;

  return (
    <div className="inline-flex items-center gap-3 rounded-xl border border-bg-border bg-bg-card px-4 py-3">
      {/* QR code */}
      <div
        className="shrink-0 rounded-lg bg-white p-1.5"
        title="Scan to send your buy-in. MNSfantasy does not process payments."
      >
        <QRCodeSVG
          value={qrValue}
          size={56}
          level="M"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      {/* Label + address */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {WALLET_LABELS[walletType]}
        </span>
        <div className="flex items-center gap-1">
          <span
            className="font-mono text-sm text-text-secondary"
            title={address}
          >
            {truncateAddress(address)}
          </span>
          <CopyButton text={address} />
        </div>
        <span className="text-[9px] leading-tight text-text-muted">
          Scan to send your buy-in. MNSfantasy does not process payments.
        </span>
      </div>
    </div>
  );
}
