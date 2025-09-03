import { Cog } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { Navigate, Outlet, useMatch } from 'react-router-dom';

import { Layouts } from '../../components/Layouts/Layout';
import { Page } from '../../components/PageHelpers';
import { useSettingsMenu } from '../../hooks/useSettingsMenu';

import { SettingsNav } from './components/SettingsNav';

const Layout = () => {
  /**
   * This ensures we're capturing the settingId from the URL
   * but also lets any nesting after that pass.
   */
  const match = useMatch('/settings/:settingId/*');
  const { formatMessage } = useIntl();
  const { isLoading, menu } = useSettingsMenu();

  // Since the useSettingsMenu hook can make API calls in order to check the links permissions
  // We need to add a loading state to prevent redirecting the user while permissions are being checked
  if (isLoading) {
    return <Page.Loading />;
  }

  if (!match?.params.settingId) {
    return <Navigate to="application-infos" />;
  }

  const pageTitle = formatMessage({
    id: 'global.settings',
    defaultMessage: 'Settings',
  });

  return (
    <Layouts.Root
      sideNav={<SettingsNav menu={menu} />}
      sideNavLinks={menu}
      breadcrumbIcon={<Cog width="20" height="20" fill="neutral500" />}
      rootLabel={pageTitle}
    >
      <Page.Title>{pageTitle}</Page.Title>
      <Outlet />
    </Layouts.Root>
  );
};

export { Layout };
