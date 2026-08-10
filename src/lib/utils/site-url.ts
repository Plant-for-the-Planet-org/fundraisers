export function isProductionHost(host: string | null | undefined): boolean {
  const productionHost = process.env.NEXT_PUBLIC_APP_HOST;
  return !!host && productionHost === host;
}
