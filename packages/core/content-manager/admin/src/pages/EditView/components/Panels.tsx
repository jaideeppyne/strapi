import * as React from 'react';

import {
  useQueryParams,
  useStrapiApp,
  DescriptionComponentRenderer,
} from '@strapi/admin/strapi-admin';
import { Box, Flex, IconButton, Typography } from '@strapi/design-system';
import { ChevronDown } from '@strapi/icons';
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
  type?: string;
  title: string;
  content: React.ReactNode;
  foldable?: boolean;
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
    <Flex direction="column" alignItems="stretch" gap={4}>
      <DescriptionComponentRenderer
        props={props}
        descriptions={(
          plugins['content-manager'].apis as ContentManagerPlugin['config']['apis']
        ).getEditViewSidePanels()}
      >
        {(panels) =>
          panels.map(({ content, id, type, foldable, ...description }) => (
            <Panel key={id} type={type} foldable={foldable} {...description}>
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
  type?: string;
  foldable?: boolean;
}

const PanelContainer = styled(Box)<{ $type?: string }>`
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

const MobilePanelExpandButton = styled(Box)<{ $isFolded: boolean }>`
  svg {
    transform: ${({ $isFolded }) => ($isFolded ? 'rotate(0deg)' : 'rotate(180deg)')};
    transition: transform 0.3s ease-in-out;
  }

  ${({ theme }) => theme.breakpoints.large} {
    display: none;
  }
`;

const MobilePanelContent = styled(Box)`
  max-height: ${({ $foldable, $isFolded, $contentHeight }) =>
    $foldable && $isFolded ? '0px' : $contentHeight ? `${$contentHeight}px` : '100%'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;

  ${({ theme }) => theme.breakpoints.large} {
    max-height: none;
    overflow: visible;
  }
`;

const Panel = React.forwardRef<any, PanelProps>(
  ({ children, title, type, foldable = false }, ref) => {
    const [isFolded, setIsFolded] = React.useState(true);
    const [contentHeight, setContentHeight] = React.useState(0);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const updateHeight = React.useCallback(() => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    }, []);

    React.useEffect(() => {
      updateHeight();
    }, [children, updateHeight]);

    React.useEffect(() => {
      const element = contentRef.current;
      if (!element) return;

      const resizeObserver = new ResizeObserver(() => {
        updateHeight();
      });

      resizeObserver.observe(element);

      return () => {
        resizeObserver.disconnect();
      };
    }, [updateHeight]);

    return (
      <PanelContainer
        ref={ref}
        tag="aside"
        aria-labelledby="additional-information"
        background="neutral0"
        borderColor="neutral150"
        hasRadius
        paddingLeft={{
          initial: 4,
          medium: 6,
          large: 4,
        }}
        paddingRight={{
          initial: 4,
          medium: 6,
          large: 4,
        }}
        paddingTop={4}
        paddingBottom={4}
        shadow={
          type === 'actions'
            ? {
                initial: 'none',
                large: 'tableShadow',
              }
            : 'tableShadow'
        }
        $type={type}
      >
        <Flex
          gap={4}
          width="100%"
          onClick={() => {
            if (foldable) {
              setIsFolded(!isFolded);
            }
          }}
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
          {foldable && (
            <MobilePanelExpandButton marginLeft="auto" $isFolded={isFolded}>
              <IconButton label="Fold">
                <ChevronDown />
              </IconButton>
            </MobilePanelExpandButton>
          )}
        </Flex>
        <MobilePanelContent
          width="100%"
          overflow="hidden"
          $foldable={foldable}
          $isFolded={isFolded}
          $contentHeight={contentHeight}
        >
          <Flex
            ref={contentRef}
            direction="column"
            width="100%"
            paddingTop={type === 'actions' ? 0 : 3}
            gap={3}
            justifyContent="stretch"
            alignItems="flex-start"
          >
            {children}
          </Flex>
        </MobilePanelContent>
      </PanelContainer>
    );
  }
);

export { Panels, ActionsPanel };
export type { PanelDescription };
