/* eslint-disable import/no-default-export */
import { lazy, Suspense } from 'react';

import { Page, Layouts, useAppInfo } from '@strapi/admin/strapi-admin';
import { Layout } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { Route, Routes } from 'react-router-dom';

import { ContentTypeBuilderNav } from '../../components/ContentTypeBuilderNav/ContentTypeBuilderNav';
import { useContentTypeBuilderMenu } from '../../components/ContentTypeBuilderNav/useContentTypeBuilderMenu';
import { FormModal } from '../../components/FormModal/FormModal';
import { getTrad } from '../../utils/getTrad';
import { EmptyState } from '../ListView/EmptyState';

const ListView = lazy(() => import('../ListView/ListView'));

const AppContent = () => {
  const { formatMessage } = useIntl();

  const autoReload = useAppInfo('DataManagerProvider', (state) => state.autoReload);
  const { menu } = useContentTypeBuilderMenu();

  return (
    <>
      {autoReload && <FormModal />}
      <Layouts.Root
        sideNav={<ContentTypeBuilderNav />}
        sideNavLinks={menu}
        breadcrumbIcon={<Layout />}
        rootLabel={formatMessage({
          id: getTrad('plugin.name'),
          defaultMessage: 'Content-Type Builder',
        })}
      >
        <Suspense fallback={<Page.Loading />}>
          <Routes>
            <Route path="content-types/create-content-type" element={<EmptyState />} />
            <Route path="content-types/:contentTypeUid" element={<ListView />} />
            <Route
              path={`component-categories/:categoryUid/:componentUid`}
              element={<ListView />}
            />
            <Route path="*" element={<ListView />} />
          </Routes>
        </Suspense>
      </Layouts.Root>
    </>
  );
};

export default AppContent;
