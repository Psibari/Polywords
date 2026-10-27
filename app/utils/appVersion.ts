export function formatAppVersion(
  nativeVersion: string | null,
  nativeBuildVersion: string | null,
  fallbackVersion?: string,
): string {
  const version = nativeVersion?.trim() || fallbackVersion?.trim() || 'Development';
  const build = nativeBuildVersion?.trim();
  return build ? `${version} (${build})` : version;
}
