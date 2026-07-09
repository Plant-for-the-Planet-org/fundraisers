const PRODUCTION_HOSTS = [
  'www.startplanting.org',
  // TODO: remove once this PR's preview deployment is no longer needed
  '292-6jwpb.startplanting.org',
];

export function isProductionHost(host: string | null | undefined): boolean {
  return !!host && PRODUCTION_HOSTS.includes(host);
}
