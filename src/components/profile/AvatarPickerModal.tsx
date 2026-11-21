import { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { AVATARS } from '../../data/avatars';
import { compressImage } from '../../utils/image';
import StudioAvatar from '../ui/StudioAvatar';

interface Props {
  open: boolean;
  onClose: () => void;
  currentAvatarId: string;
  currentCustomAvatarUrl?: string | null;
  onSave: (avatarId: string, customAvatarUrl: string | null) => Promise<void>;
}

export default function AvatarPickerModal({
  open,
  onClose,
  currentAvatarId,
  currentCustomAvatarUrl,
  onSave,
}: Props) {
  const [avatarId, setAvatarId] = useState(currentAvatarId || 'av-01');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(
    currentCustomAvatarUrl || null
  );
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    setError('');

    try {
      const compressedDataUrl = await compressImage(file, 200, 0.75);
      setCustomAvatarUrl(compressedDataUrl);
      setAvatarId('custom');
    } catch (err) {
      console.error('Failed to compress avatar photo:', err);
      setError(err instanceof Error ? err.message : 'Could not process uploaded photo.');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleSelectPreset(id: string) {
    setAvatarId(id);
    setCustomAvatarUrl(null);
  }

  async function handleConfirm() {
    setSaving(true);
    setError('');
    try {
      await onSave(avatarId, customAvatarUrl);
      onClose();
    } catch (err) {
      console.error('Failed to update avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to save new avatar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 profile-bricolage"
      style={{
        backgroundColor: 'rgba(26, 51, 0, 0.4)',
        fontFamily: 'var(--font-bricolage)',
        letterSpacing: '-0.03em',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Change team avatar"
    >
      <div
        className="w-full max-w-sm p-5 max-h-[90vh] overflow-y-auto card-spring profile-bricolage"
        style={{
          backgroundColor: 'var(--color-cream-paper)',
          border: '2px solid var(--color-forest-ink)',
          borderRadius: 'var(--radius-cards)',
          fontFamily: 'var(--font-bricolage)',
          letterSpacing: '-0.03em',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-pencil-gray)]">
          <div>
            <h3
              className="text-base font-bold tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-forest-ink)' }}
            >
              Update Your Avatar
            </h3>
            <p
              className="text-xs font-semibold tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-pencil-gray)' }}
            >
              Upload a personal photo or select a team avatar
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center cursor-pointer btn-spring"
            style={{ borderRadius: 'var(--radius-buttons)' }}
            aria-label="Close"
          >
            <Icon icon="doodle:close" width={18} height={18} style={{ color: 'var(--color-forest-ink)' }} />
          </button>
        </div>

        {/* Live Circular Preview */}
        <div className="flex flex-col items-center justify-center mb-4">
          <div
            className="p-1.5 rounded-full"
            style={{
              border: '2px solid var(--color-forest-ink)',
              backgroundColor: customAvatarUrl ? 'var(--color-sticky-note-mint)' : 'var(--color-cream-paper)',
            }}
          >
            <StudioAvatar avatarId={avatarId} customAvatarUrl={customAvatarUrl} size={76} />
          </div>
          <span
            className="text-[11px] font-bold mt-1.5 tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-pencil-gray)' }}
          >
            {customAvatarUrl ? 'Custom Photo' : `Preset: ${avatarId}`}
          </span>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Option 1: Upload Photo */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={compressing}
          className="w-full p-3 mb-4 flex items-center justify-center gap-2.5 cursor-pointer btn-spring"
          style={{
            backgroundColor: customAvatarUrl ? 'var(--color-sticky-note-mint)' : 'var(--color-cream-paper)',
            border: '2px dashed var(--color-forest-ink)',
            borderRadius: 'var(--radius-buttons)',
          }}
        >
          <Icon icon="doodle:camera" width={18} height={18} style={{ color: 'var(--color-forest-ink)' }} />
          <span
            className="text-xs font-bold tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-forest-ink)' }}
          >
            {compressing ? 'Processing Image...' : customAvatarUrl ? 'Upload Different Photo' : 'Upload Your Photo'}
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-2 w-full mb-3">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-pencil-gray)' }} />
          <span
            className="text-[10px] uppercase tracking-[-0.03em] font-bold"
            style={{ fontFamily: 'var(--font-bricolage)', color: 'var(--color-pencil-gray)' }}
          >
            Or pick from team avatars
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-pencil-gray)' }} />
        </div>

        {/* Option 2: 16 Presets Grid */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {AVATARS.map((av) => {
            const isSelected = !customAvatarUrl && avatarId === av.id;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => handleSelectPreset(av.id)}
                className="aspect-square flex items-center justify-center cursor-pointer p-1.5 card-spring transition-colors"
                style={{
                  backgroundColor: isSelected ? 'var(--color-sticky-note-mint)' : 'var(--color-cream-paper)',
                  border: isSelected ? '2px solid var(--color-forest-ink)' : '1px solid var(--color-pencil-gray)',
                  borderRadius: 'var(--radius-cards)',
                }}
                aria-label={`Select avatar ${av.id}`}
                aria-pressed={isSelected}
              >
                <StudioAvatar avatarId={av.id} size={44} />
              </button>
            );
          })}
        </div>

        {error && (
          <p
            className="text-xs mb-3 text-center font-bold tracking-[-0.03em]"
            style={{ color: 'var(--color-terracotta)', fontFamily: 'var(--font-bricolage)' }}
          >
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving || compressing}
            onClick={handleConfirm}
            className="flex-1 py-2.5 text-xs font-bold cursor-pointer btn-spring tracking-[-0.03em]"
            style={{
              fontFamily: 'var(--font-bricolage)',
              backgroundColor: 'var(--color-forest-ink)',
              color: 'var(--color-cream-paper)',
              borderRadius: 'var(--radius-buttons)',
              border: 'none',
              opacity: saving || compressing ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Avatar →'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold cursor-pointer btn-spring tracking-[-0.03em]"
            style={{
              fontFamily: 'var(--font-bricolage)',
              color: 'var(--color-forest-ink)',
              backgroundColor: 'var(--color-cream-paper)',
              border: '1px solid var(--color-pencil-gray)',
              borderRadius: 'var(--radius-buttons)',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
