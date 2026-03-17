import React from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionCard } from './SectionCard';
import { CsvPreviewTable } from './CsvPreviewTable';

export interface CsvUploadSectionProps {
  title: string;
  delay: number;
  inputId: string;
  inputLabel: string;
  fileRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  preview: Record<string, string>[] | null;
  columns: readonly string[];
  onClearPreview: () => void;
  onConfirm: () => void;
  confirmLoading: boolean;
}

export function CsvUploadSection({
  title,
  delay,
  inputId,
  inputLabel,
  fileRef,
  onFileChange,
  preview,
  columns,
  onClearPreview,
  onConfirm,
  confirmLoading,
}: CsvUploadSectionProps) {
  return (
    <SectionCard title={title} icon={Upload} delay={delay}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor={inputId}
              className="mb-1 block text-xs text-text-muted"
            >
              {inputLabel}
            </label>
            <input
              ref={fileRef}
              id={inputId}
              type="file"
              accept=".csv"
              onChange={onFileChange}
              className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary file:mr-3 file:rounded-md file:border-0 file:bg-neon-green/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-neon-green transition-colors focus:border-neon-green focus:outline-none"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => fileRef.current?.click()}
            disabled={!!preview}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>

        {preview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-secondary">
                Preview ({preview.length} rows)
              </p>
              <button
                onClick={onClearPreview}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <CsvPreviewTable rows={preview} columns={columns} />
            <Button
              variant="primary"
              size="md"
              onClick={onConfirm}
              loading={confirmLoading}
            >
              Confirm Import
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
