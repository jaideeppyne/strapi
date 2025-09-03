import * as React from 'react';

import { useQueryParams, SubNav } from '@strapi/admin/strapi-admin';
import {
  Flex,
  Searchbar,
  useCollator,
  useFilter,
  Divider,
  ScrollArea,
} from '@strapi/design-system';
import { parse, stringify } from 'qs';
import { useIntl } from 'react-intl';

import { useContentTypeSchema } from '../hooks/useContentTypeSchema';
import { useTypedSelector } from '../modules/hooks';
import { getTranslation } from '../utils/translations';

import type { ContentManagerLink } from '../hooks/useContentManagerInitData';
import type { Menu } from '../hooks/useMenu';

const LeftMenu = ({ menu }: { menu: Menu[] }) => {
  const [search, setSearch] = React.useState('');
  const [{ query }] = useQueryParams<{ plugins?: object }>();
  const { formatMessage, locale } = useIntl();

  const { schemas } = useContentTypeSchema();

  const { startsWith } = useFilter(locale, {
    sensitivity: 'base',
  });

  const formatter = useCollator(locale, {
    sensitivity: 'base',
  });

  const filteredMenu = React.useMemo(
    () =>
      menu.map((section) => ({
        ...section,
        links: section.links
          /**
           * Sort correctly using the language
           */
          .sort((a, b) => formatter.compare(a.title, b.title)),
      })),
    [formatter, menu]
  );

  const handleClear = () => {
    setSearch('');
  };

  const handleChangeSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const label = formatMessage({
    id: getTranslation('header.name'),
    defaultMessage: 'Content Manager',
  });

  const getPluginsParamsForLink = (link: ContentManagerLink) => {
    const schema = schemas.find((schema) => schema.uid === link.uid);
    const isI18nEnabled = Boolean((schema?.pluginOptions?.i18n as any)?.localized);

    // The search params have the i18n plugin
    if (query.plugins && 'i18n' in query.plugins) {
      // Prepare removal of i18n from the plugins search params
      const { i18n, ...restPlugins } = query.plugins;

      // i18n is not enabled, remove it from the plugins search params
      if (!isI18nEnabled) {
        return restPlugins;
      }

      // i18n is enabled, put the plugins search params back together
      return { i18n, ...restPlugins };
    }

    return query.plugins;
  };

  return (
    <SubNav.Main aria-label={label}>
      <SubNav.Header label={label} />
      <Divider />
      <ScrollArea>
        <Flex padding={5} paddingBottom={0} gap={3} direction="column" alignItems="stretch">
          <Searchbar
            value={search}
            onChange={handleChangeSearch}
            onClear={handleClear}
            placeholder={formatMessage({
              id: 'search.placeholder',
              defaultMessage: 'Search',
            })}
            size="S"
            // eslint-disable-next-line react/no-children-prop
            children={undefined}
            name={'search_contentType'}
            clearLabel={formatMessage({ id: 'clearLabel', defaultMessage: 'Clear' })}
          />
        </Flex>
        <SubNav.Sections>
          {filteredMenu.map((section) => {
            return (
              <SubNav.Section
                key={section.id}
                label={section.title}
                badgeLabel={section.links.length.toString()}
              >
                {section.links.map((link) => {
                  return (
                    <SubNav.Link
                      key={link.uid}
                      to={{
                        pathname: link.to,
                        search: stringify({
                          ...parse(link.search ?? ''),
                          plugins: getPluginsParamsForLink(link),
                        }),
                      }}
                      label={link.title}
                    />
                  );
                })}
              </SubNav.Section>
            );
          })}
        </SubNav.Sections>
      </ScrollArea>
    </SubNav.Main>
  );
};

export { LeftMenu };
