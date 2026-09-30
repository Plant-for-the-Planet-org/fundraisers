'use client';

import { CopyLinkButton } from './copy-link-button';
import { useFundraiserShareUrl } from './use-fundraiser-share-url';

/** The fundraiser page's Copy Link. The page itself renders on the server, so the link is built here. */
export function FundraiserCopyLinkButton({ slug }: { slug: string }) {
  const url = useFundraiserShareUrl(slug);
  return <CopyLinkButton url={url} />;
}
