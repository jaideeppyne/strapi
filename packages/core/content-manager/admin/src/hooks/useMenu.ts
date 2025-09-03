import * as React from 'react';

import { useIntl } from 'react-intl';

import { useTypedSelector } from '../modules/hooks';
import { getTranslation } from '../utils/translations';

import type { Permission } from '@strapi/admin/strapi-admin';

interface MenuItem {
  title: string;
  permissions: Permission[];
  search: string | null;
  kind: string;
  to: string;
  uid: string;
  name: string;
  isDisplayed: boolean;
}

interface Menu {
  id: string;
  title: string;
  searchable: boolean;
  links: MenuItem[];
}

const useMenu = (): { menu: Menu[] } => {
  const collectionTypeLinks = useTypedSelector(
    (state) => state['content-manager'].app.collectionTypeLinks
  );

  const singleTypeLinks = useTypedSelector((state) => state['content-manager'].app.singleTypeLinks);
  const { formatMessage } = useIntl();
  const menu = React.useMemo(
    () =>
      [
        {
          id: 'collectionTypes',
          title: formatMessage({
            id: getTranslation('components.LeftMenu.collection-types'),
            defaultMessage: 'Collection Types',
          }),
          searchable: true,
          links: collectionTypeLinks,
        },
        {
          id: 'singleTypes',
          title: formatMessage({
            id: getTranslation('components.LeftMenu.single-types'),
            defaultMessage: 'Single Types',
          }),
          searchable: true,
          links: singleTypeLinks,
        },
      ].map((section) => ({
        ...section,
        links: section.links
          /**
           * Apply the formated strings to the links from react-intl
           */
          .map((link) => {
            return {
              ...link,
              title: formatMessage({ id: link.title, defaultMessage: link.title }),
            };
          }),
      })),
    [collectionTypeLinks, singleTypeLinks, formatMessage]
  );

  return {
    menu,
  };
};

export { useMenu };
export type { Menu, MenuItem };
