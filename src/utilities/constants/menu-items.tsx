import { getDictionary } from '@/app/[lang]/dictionaries';
import { IconName } from './icons';

export async function getMenus(locale: string) {
  const dictionary = await getDictionary(locale);
  const { sidebar } = dictionary;

  const icon = (name: IconName): IconName => name;

  return [
    {
      label: sidebar.menu.home,
      type: 'section',
      children: [
        {
          uri: `/${locale}/dashboard`,
          label: sidebar.menuItem.dashboard,
          type: 'nav-item',
          icon: icon('dashboard'),
        },
      ],
    },
    {
      label: sidebar.menu.organizations,
      type: 'section',
      children: [
        {
          uri: `/${locale}/organizations`,
          label: sidebar.menuItem.organizations,
          type: 'nav-item',
          icon: icon('organizations'),
        },
        {
          uri: `/${locale}/invitations`,
          label: sidebar.menuItem.invitations,
          type: 'nav-item',
          icon: icon('invitations'),
        },
      ],
    },
  ];
}
