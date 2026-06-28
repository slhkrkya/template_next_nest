'use client';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { useTranslations } from 'next-intl';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const t = useTranslations('common');
  const confirmSeverity = variant === 'destructive' ? 'danger' : undefined;

  const footer = (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        label={cancelLabel ?? t('cancel')}
        severity="secondary"
        outlined
        onClick={onCancel}
        disabled={isLoading}
      />
      <Button
        type="button"
        label={confirmLabel ?? t('confirm')}
        severity={confirmSeverity}
        loading={isLoading}
        onClick={onConfirm}
      />
    </div>
  );

  return (
    <Dialog
      header={title}
      visible={open}
      onHide={onCancel}
      footer={footer}
      modal
      dismissableMask={!isLoading}
      className="w-[92vw] max-w-md"
    >
      <p className="m-0 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </Dialog>
  );
}
