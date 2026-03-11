// Use type-safe message keys with `next-intl`
import type MessagesCommon from '../../locales/en/common.json';
import type MessagesExplore from '../../locales/en/explore.json';
import type MessagesFundraisers from '../../locales/en/fundraisers.json';
import type MessageAuth from '../../locales/en/auth.json';
import type MessageDashboard from '../../locales/en/dashboard.json';

type Messages = typeof MessagesCommon &
  typeof MessagesExplore &
  typeof MessagesFundraisers &
  typeof MessageAuth &
  typeof MessageDashboard;

declare module 'next-intl' {
  interface AppConfig {
    Messages: Messages;
  }
}
