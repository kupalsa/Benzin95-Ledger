function imageExtension(type) {
  return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' })[type] || 'jpg';
}

export function remoteImagePath(check) {
  return `checks/${check.month}/${check.id}.${imageExtension(check.imageType)}`;
}

export function mergeChecks(remoteChecks, localChecks) {
  const merged = new Map();
  for (const check of [...remoteChecks, ...localChecks]) {
    const current = merged.get(check.id);
    if (!current || String(check.updatedAt || check.createdAt || '') >= String(current.updatedAt || current.createdAt || '')) merged.set(check.id, check);
  }
  return [...merged.values()].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}
