/* eslint-disable import/no-default-export */
/* eslint-disable check-file/filename-naming-convention  */
/* eslint-disable check-file/no-index */
import { Page } from '@strapi/admin/strapi-admin';
import { useIntl } from 'react-intl';

import { AutoReloadOverlayBlockerProvider } from '../../components/AutoReloadOverlayBlocker';
import DataManagerProvider from '../../components/DataManager/DataManagerProvider';
import { ExitPrompt } from '../../components/ExitPrompt';
import { FormModalNavigationProvider } from '../../components/FormModalNavigation/FormModalNavigationProvider';
import { PERMISSIONS } from '../../constants';
import { pluginId } from '../../pluginId';

import AppContent from './Content';

const App = () => {
  const { formatMessage } = useIntl();
  const title = formatMessage({
    id: `${pluginId}.plugin.name`,
    defaultMessage: 'Content Types Builder',
  });

  return (
    <Page.Protect permissions={PERMISSIONS.main}>
      <Page.Title>{title}</Page.Title>
      <AutoReloadOverlayBlockerProvider>
        <FormModalNavigationProvider>
          <DataManagerProvider>
            <ExitPrompt />
            <AppContent />
          </DataManagerProvider>
        </FormModalNavigationProvider>
      </AutoReloadOverlayBlockerProvider>
    </Page.Protect>
  );
};

export default App;
