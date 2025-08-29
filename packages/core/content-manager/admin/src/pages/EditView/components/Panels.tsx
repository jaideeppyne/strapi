import * as React from 'react';

import {
  useQueryParams,
  useStrapiApp,
  DescriptionComponentRenderer,
} from '@strapi/admin/strapi-admin';
import { Flex, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useMatch } from 'react-router-dom';
import { css, styled } from 'styled-components';

import { InjectionZone } from '../../../components/InjectionZone';
import { useDoc } from '../../../hooks/useDocument';
import { CLONE_PATH } from '../../../router';

import { DocumentActions } from './DocumentActions';

import type {
  ContentManagerPlugin,
  DocumentActionProps,
  PanelComponent,
  PanelComponentProps,
} from '../../../content-manager';

interface PanelDescription {
  type: string;
  title: string;
  content: React.ReactNode;
}

/* -------------------------------------------------------------------------------------------------
 * Panels
 * -----------------------------------------------------------------------------------------------*/

const Panels = () => {
  const isCloning = useMatch(CLONE_PATH) !== null;
  const [
    {
      query: { status },
    },
  ] = useQueryParams<{ status: 'draft' | 'published' }>({
    status: 'draft',
  });
  const { model, id, document, meta, collectionType } = useDoc();
  const plugins = useStrapiApp('Panels', (state) => state.plugins);

  const props = {
    activeTab: status,
    model,
    documentId: id,
    document: isCloning ? undefined : document,
    meta: isCloning ? undefined : meta,
    collectionType,
  } satisfies PanelComponentProps;

  return (
    <Flex direction="column" alignItems="stretch" gap={2}>
      <DescriptionComponentRenderer
        props={props}
        descriptions={(
          plugins['content-manager'].apis as ContentManagerPlugin['config']['apis']
        ).getEditViewSidePanels()}
      >
        {(panels) =>
          panels.map(({ content, id, type, ...description }) => (
            <Panel key={id} type={type} {...description}>
              {content}
            </Panel>
          ))
        }
      </DescriptionComponentRenderer>
    </Flex>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Default Action Panels (CE)
 * -----------------------------------------------------------------------------------------------*/

const ActionsPanel: PanelComponent = () => {
  const { formatMessage } = useIntl();

  return {
    type: 'actions',
    title: formatMessage({
      id: 'content-manager.containers.edit.panels.default.title',
      defaultMessage: 'Entry',
    }),
    content: <ActionsPanelContent />,
  };
};

const ActionsPanelContent = () => {
  const isCloning = useMatch(CLONE_PATH) !== null;
  const [
    {
      query: { status = 'draft' },
    },
  ] = useQueryParams<{ status: 'draft' | 'published' }>();
  const { model, id, document, meta, collectionType } = useDoc();
  const plugins = useStrapiApp('ActionsPanel', (state) => state.plugins);

  const props = {
    activeTab: status,
    model,
    documentId: id,
    document: isCloning ? undefined : document,
    meta: isCloning ? undefined : meta,
    collectionType,
  } satisfies DocumentActionProps;

  return (
    <Flex direction="column" gap={2} width="100%">
      <DescriptionComponentRenderer
        props={props}
        descriptions={(
          plugins['content-manager'].apis as ContentManagerPlugin['config']['apis']
        ).getDocumentActions('panel')}
      >
        {(actions) => <DocumentActions actions={actions} />}
      </DescriptionComponentRenderer>
      <InjectionZone area="editView.right-links" slug={model} />
    </Flex>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Panel
 * -----------------------------------------------------------------------------------------------*/

interface PanelProps extends Pick<PanelDescription, 'title'> {
  children: React.ReactNode;
  type: string;
}

const PanelContainer = styled(Flex)<{ $type: string }>`
  ${({ $type }) =>
    $type === 'actions' &&
    css`
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 2;
      border-radius: 0;
      border-left-width: 0;
      border-right-width: 0;
      border-bottom-width: 0;

      ${({ theme }) => theme.breakpoints.medium} {
        left: 23.2rem;
      }
      ${({ theme }) => theme.breakpoints.large} {
        position: relative;
        left: inherit;
        border-radius: ${({ theme }) => theme.borderRadius};
        border-left-width: 1px;
        border-right-width: 1px;
        border-bottom-width: 1px;
        z-index: inherit;
      }
    `}
`;

const Panel = React.forwardRef<any, PanelProps>(({ children, title, type }, ref) => {
  return (
    <PanelContainer
      ref={ref}
      tag="aside"
      aria-labelledby="additional-information"
      background="neutral0"
      borderColor="neutral150"
      hasRadius
      paddingBottom={4}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={4}
      shadow={
        type === 'actions'
          ? {
              initial: 'none',
              large: 'tableShadow',
            }
          : 'tableShadow'
      }
      gap={3}
      direction="column"
      justifyContent="stretch"
      alignItems="flex-start"
      $type={type}
    >
      <Typography
        tag="h2"
        variant="sigma"
        textTransform="uppercase"
        textColor="neutral600"
        display={type === 'actions' ? { initial: 'none', large: 'block' } : 'block'}
      >
        {title}
      </Typography>
      {children}
    </PanelContainer>
  );
});

export { Panels, ActionsPanel };
export type { PanelDescription };
