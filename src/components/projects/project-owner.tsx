import { useTranslations } from 'next-intl';
import { getImageUrl } from '@/lib/utils/images';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { FallbackAvatar } from '@/components/ui/fallback-avatar';

interface ProjectOwnerProps {
  ownerName: string;
  /** CDN filename of the owner's logo. */
  ownerAvatar: string | null;
}

/**
 * Organization running the project, shown as an avatar plus name.
 */
export function ProjectOwner({ ownerName, ownerAvatar }: ProjectOwnerProps) {
  const t = useTranslations('Projects.hero');
  const avatarUrl = getImageUrl('profile', 'thumb', ownerAvatar);

  return (
    <div className='flex flex-row items-center gap-2.5'>
      <Avatar className='h-6 w-6'>
        {/* The name sits right next to it, so the image itself is decorative. */}
        {avatarUrl && <AvatarImage src={avatarUrl} alt='' loading='lazy' />}
        <FallbackAvatar seed={ownerName} />
      </Avatar>
      <p className='wrap-anywhere text-base leading-tight text-foreground'>
        {t.rich('owner', {
          name: ownerName,
          owner: chunks => <strong className='font-semibold'>{chunks}</strong>,
        })}
      </p>
    </div>
  );
}
