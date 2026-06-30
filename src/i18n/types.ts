// Use type-safe message keys with `next-intl`
import type MessageAuth from '../../locales/en/auth.json';
import type MessagesBundles from '../../locales/en/bundles.json';
import type MessagesCommon from '../../locales/en/common.json';
import type MessagesCookies from '../../locales/en/cookies.json';
import type MessageDashboard from '../../locales/en/dashboard.json';
import type MessageDonate from '../../locales/en/donate.json';
import type MessagesExplore from '../../locales/en/explore.json';
import type MessagesFundraisers from '../../locales/en/fundraisers.json';
import type MessagesLeaderboard from '../../locales/en/leaderboard.json';
import type MessagesStage from '../../locales/en/stage.json';

type Messages = typeof MessagesCommon &
  typeof MessagesExplore &
  typeof MessagesFundraisers &
  typeof MessagesBundles &
  typeof MessageAuth &
  typeof MessageDashboard &
  typeof MessageDonate &
  typeof MessagesStage &
  typeof MessagesLeaderboard &
  typeof MessagesCookies;

declare module 'next-intl' {
  interface AppConfig {
    Messages: Messages;
  }
}
