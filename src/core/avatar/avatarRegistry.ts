import type { AvatarIntentAdapter, AvatarMode } from './adapters';
import { ruleBasedEmpathicAvatarIntentAdapter, ruleBasedMirrorAvatarIntentAdapter } from './adapters';

const avatarIntentAdapters: Record<AvatarMode, AvatarIntentAdapter> = {
  mirror: ruleBasedMirrorAvatarIntentAdapter,
  empathic: ruleBasedEmpathicAvatarIntentAdapter,
};

export function getAvatarIntentAdapter(mode: AvatarMode): AvatarIntentAdapter {
  return avatarIntentAdapters[mode];
}

export function setAvatarIntentAdapter(mode: AvatarMode, adapter: AvatarIntentAdapter): void {
  avatarIntentAdapters[mode] = adapter;
}

export function resetAvatarIntentAdapter(mode?: AvatarMode): void {
  if (!mode || mode === 'mirror') avatarIntentAdapters.mirror = ruleBasedMirrorAvatarIntentAdapter;
  if (!mode || mode === 'empathic') avatarIntentAdapters.empathic = ruleBasedEmpathicAvatarIntentAdapter;
}
