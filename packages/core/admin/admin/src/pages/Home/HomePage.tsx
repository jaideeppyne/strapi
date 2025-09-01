import * as React from 'react';

import {
  Box,
  Button,
  Combobox,
  ComboboxOption,
  Flex,
  Grid,
  Main,
  Typography,
} from '@strapi/design-system';
import { Drag, Plus, PuzzlePiece, Trash } from '@strapi/icons';
import { produce } from 'immer';
import { useDrag, useDrop } from 'react-dnd';
import { useIntl } from 'react-intl';
import { Link as ReactRouterLink } from 'react-router-dom';

import { GuidedTourHomepageOverview } from '../../components/GuidedTour/Overview';
import { Layouts } from '../../components/Layouts/Layout';
import { Page } from '../../components/PageHelpers';
import { Widget } from '../../components/WidgetHelpers';
import { useEnterprise } from '../../ee';
import { useAuth } from '../../features/Auth';
import { useStrapiApp } from '../../features/StrapiApp';
import { useTracking } from '../../features/Tracking';

import { FreeTrialEndedModal } from './components/FreeTrialEndedModal';
import { FreeTrialWelcomeModal } from './components/FreeTrialWelcomeModal';

import type { WidgetWithUID } from '../../core/apis/Widgets';
import type { WidgetType } from '@strapi/admin/strapi-admin';

/* -------------------------------------------------------------------------------------------------
 * GapDropZone
 * -----------------------------------------------------------------------------------------------*/

interface GapDropZoneProps {
  insertIndex: number;
  moveWidget: (id: string, to: number) => void;
  onDropWidget: (widgetId: string, insertIndex: number) => void;
}

const GapDropZone = ({ insertIndex, moveWidget, onDropWidget }: GapDropZoneProps) => {
  const [, drop] = useDrop(
    () => ({
      accept: 'widget',
      drop: (item: { id: string }) => {
        onDropWidget(item.id, insertIndex);
      },
      hover({ id: draggedId }: { id: string }) {
        moveWidget(draggedId, insertIndex);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [insertIndex, moveWidget, onDropWidget]
  );

  return <Box ref={drop} height="100%" width="100%" />;
};

/* -------------------------------------------------------------------------------------------------
 * TrashBinButton
 * -----------------------------------------------------------------------------------------------*/

interface TrashBinButtonProps {
  onDrop: (widgetId: string) => void;
}

const TrashBinButton = ({ onDrop }: TrashBinButtonProps) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'widget',
      drop: (item: { id: string }) => {
        onDrop(item.id);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [onDrop]
  );

  return (
    <Button
      ref={drop}
      variant="danger"
      size="L"
      startIcon={<Trash />}
      style={{
        opacity: isOver ? 0.8 : 1,
        zIndex: isOver ? 9999 : 1000,
      }}
    >
      Delete widget
    </Button>
  );
};

/* -------------------------------------------------------------------------------------------------
 * WidgetRoot
 * -----------------------------------------------------------------------------------------------*/

interface WidgetRootProps
  extends Pick<WidgetType, 'title' | 'icon' | 'permissions' | 'link' | 'uid'> {
  children: React.ReactNode;
  findWidget: (id: string) => { index: number };
  moveWidget: (id: string, to: number) => void;
  setDisplayTrashBin: (display: boolean) => void;
  columnWidths: Record<string, number>;
  setColumnWidths: (
    widths: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)
  ) => void;
  gridRef: React.RefObject<HTMLDivElement | null>;
}

interface Item {
  id: string;
  originalIndex: number;
}

export const WidgetRoot = ({
  uid,
  title,
  icon = PuzzlePiece,
  children,
  link,
  findWidget,
  moveWidget,
  setDisplayTrashBin,
  columnWidths,
  setColumnWidths,
  gridRef,
}: WidgetRootProps) => {
  const { trackUsage } = useTracking();
  const nodeRef = React.useRef<HTMLDivElement | null>(null);
  const { formatMessage } = useIntl();
  const Icon = icon;
  const originalIndex = findWidget(uid).index;
  const [isDraggingFromHandle, setIsDraggingFromHandle] = React.useState(false);

  // Debounced move widget to reduce glitching during drag
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const debouncedMoveWidget = React.useCallback(
    (id: string, atIndex: number) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        moveWidget(id, atIndex);
      }, 16);
    },
    [moveWidget]
  );

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'widget',
      item: () => {
        setDisplayTrashBin(true);
        return { id: uid, originalIndex };
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (item, monitor) => {
        setDisplayTrashBin(false);
        const { id: droppedId, originalIndex } = item;
        const didDrop = monitor.didDrop();
        if (!didDrop) {
          moveWidget(droppedId, originalIndex);
        }
        setIsDraggingFromHandle(false);
      },
      canDrag: () => isDraggingFromHandle,
    }),
    [uid, originalIndex, moveWidget, isDraggingFromHandle]
  );

  const [, drop] = useDrop(
    () => ({
      accept: 'widget',
      hover({ id: draggedId }: Item) {
        if (draggedId !== uid) {
          const { index: overIndex } = findWidget(uid);
          debouncedMoveWidget(draggedId, overIndex);
        }
      },
    }),
    [findWidget, debouncedMoveWidget]
  );

  const opacity = isDragging ? 0 : 1;
  const columnWidth = columnWidths[uid] || 6;

  const handleClickOnLink = () => {
    trackUsage('didOpenHomeWidgetLink', { widgetUID: uid });
  };

  return (
    <Flex
      width="100%"
      hasRadius
      direction="column"
      alignItems="flex-start"
      background="neutral0"
      borderColor="neutral150"
      shadow="tableShadow"
      tag="section"
      gap={4}
      padding={6}
      aria-labelledby={uid}
      ref={(node: HTMLDivElement | null) => {
        if (node) {
          nodeRef.current = node;
          drag(drop(node));
        }
      }}
      position="relative"
      style={{ opacity, zIndex: isDragging ? 10 : 1 }}
    >
      <Flex direction="row" gap={2} width="100%" tag="header" alignItems="center">
        <Flex gap={2} marginRight="auto">
          <Icon fill="neutral500" aria-hidden />
          <Typography textColor="neutral500" variant="sigma" tag="h2" id={uid}>
            {formatMessage(title)}
          </Typography>
        </Flex>
        {link && (
          <Typography
            tag={ReactRouterLink}
            variant="omega"
            textColor="primary600"
            style={{ textDecoration: 'none' }}
            textAlign="right"
            to={link.href}
            onClick={handleClickOnLink}
          >
            {formatMessage(link.label)}
          </Typography>
        )}
        <Box
          cursor="grab"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={() => setIsDraggingFromHandle(true)}
          display={{
            initial: 'none',
            large: 'block',
          }}
        >
          <Drag display="block" />
        </Box>
      </Flex>
      <Box width="100%" height="261px" overflow="auto" tag="main">
        {children}
      </Box>
      <Flex
        position="absolute"
        top={0}
        bottom={0}
        right={0}
        padding={2}
        alignItems="center"
        display={{
          initial: 'none',
          large: 'block',
        }}
        style={{ cursor: 'col-resize' }}
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startWidth = columnWidth;

          const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const parentWidth = gridRef?.current?.clientWidth;
            const threshold = parentWidth ? Math.round(parentWidth / 12) : 100; // Base the threshold on 1/12 of the grid width
            const newWidth = Math.max(1, Math.min(12, startWidth + Math.round(deltaX / threshold)));

            if (newWidth >= 4) {
              setColumnWidths((prev) => ({
                ...prev,
                [uid]: newWidth,
              }));
            }
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      >
        <Box background="neutral150" height="24px" width="2px" borderRadius={1} />
      </Flex>
    </Flex>
  );
};

/* -------------------------------------------------------------------------------------------------
 * UnstableHomePageCe
 * -----------------------------------------------------------------------------------------------*/

const WidgetComponent = ({ component }: { component: () => Promise<React.ComponentType> }) => {
  const [loadedComponent, setLoadedComponent] = React.useState<React.ComponentType | null>(null);

  React.useEffect(() => {
    const loadComponent = async () => {
      const resolvedComponent = await component();

      setLoadedComponent(() => resolvedComponent);
    };

    loadComponent();
  }, [component]);

  const Component = loadedComponent;

  if (!Component) {
    return <Widget.Loading />;
  }

  return <Component />;
};

/* -------------------------------------------------------------------------------------------------
 * HomePageCE
 * -----------------------------------------------------------------------------------------------*/

const HomePageCE = () => {
  const { formatMessage } = useIntl();
  const user = useAuth('HomePageCE', (state) => state.user);
  const displayName = user?.firstname ?? user?.username ?? user?.email;
  const getAllWidgets = useStrapiApp('UnstableHomepageCe', (state) => state.widgets.getAll);
  const checkUserHasPermissions = useAuth('WidgetRoot', (state) => state.checkUserHasPermissions);
  const [listAuthorizedWidgets, setListAuthorizedWidgets] = React.useState<WidgetWithUID[]>([]);
  const [filteredWidgets, setFilteredWidgets] = React.useState<WidgetWithUID[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [displayTrashBin, setDisplayTrashBin] = React.useState(false);
  const [displayAddNewWidget, setDisplayAddNewWidget] = React.useState(false);
  const [selectedWidgetToAdd, setSelectedWidgetToAdd] = React.useState('');
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const gridRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const checkWidgetsPermissions = async () => {
      const allWidgets = getAllWidgets();
      const isWidgetAuthorized = await Promise.all(
        allWidgets.map(async (widget) => {
          if (!widget.permissions || widget.permissions.length === 0) return true;
          const matchingPermissions = await checkUserHasPermissions(widget.permissions);
          return matchingPermissions.length >= widget.permissions.length;
        })
      );
      const authorizedWidgets = allWidgets.filter((_, i) => isWidgetAuthorized[i]);
      setListAuthorizedWidgets(authorizedWidgets);
      setFilteredWidgets(authorizedWidgets);
      setLoading(false);
    };

    checkWidgetsPermissions();
  }, [checkUserHasPermissions, getAllWidgets]);

  const findWidget = React.useCallback(
    (id: string) => {
      const widget = filteredWidgets.find((c) => `${c.uid}` === id);
      if (!widget) {
        return {
          widget: undefined,
          index: -1,
        };
      }
      return {
        widget,
        index: filteredWidgets.indexOf(widget),
      };
    },
    [filteredWidgets]
  );

  const moveWidget = React.useCallback(
    (id: string, atIndex: number) => {
      const { widget, index } = findWidget(id);
      if (!widget || index === -1) {
        return;
      }
      setFilteredWidgets(
        produce(filteredWidgets, (draft) => {
          draft.splice(index, 1);
          draft.splice(atIndex, 0, widget);
        })
      );
    },
    [findWidget, filteredWidgets, setFilteredWidgets]
  );

  const handleAddWidget = () => {
    const widgetToAdd = listAuthorizedWidgets.find((widget) => widget.uid === selectedWidgetToAdd);
    if (widgetToAdd) {
      setFilteredWidgets((prev) => [...prev, widgetToAdd]);
      setDisplayAddNewWidget(false);
      setSelectedWidgetToAdd('');
    }
  };

  const handleDropWidget = (widgetId: string, insertIndex: number) => {
    // Move the widget to the specified position
    moveWidget(widgetId, insertIndex);
  };

  const [, drop] = useDrop(() => ({ accept: 'widget' }));
  let accumulator = 0;

  return (
    <Main>
      <Page.Title>
        {formatMessage({ id: 'HomePage.head.title', defaultMessage: 'Homepage' })}
      </Page.Title>
      <Layouts.Header
        title={formatMessage(
          { id: 'HomePage.header.title', defaultMessage: 'Hello {name}' },
          { name: displayName }
        )}
        subtitle={formatMessage({
          id: 'HomePage.header.subtitle',
          defaultMessage: 'Welcome to your administration panel',
        })}
        primaryAction={null}
      />
      <FreeTrialWelcomeModal />
      <FreeTrialEndedModal />
      <Layouts.Content>
        <Flex direction="column" alignItems="stretch" gap={8} paddingBottom={10} ref={gridRef}>
          <GuidedTourHomepageOverview />
          {loading ? (
            <Box position="absolute" top={0} left={0} right={0} bottom={0}>
              <Page.Loading />
            </Box>
          ) : (
            <Grid.Root gap={5} ref={drop}>
              {filteredWidgets.map((widget, index) => {
                const currentWidgetWidth = columnWidths[widget.uid] || 6;
                const nextWidgetWidth = columnWidths[filteredWidgets[index + 1]?.uid] || 6;
                if (accumulator + currentWidgetWidth > 12) {
                  accumulator = 0; // New row
                }
                accumulator += currentWidgetWidth;
                const nextAccumulator = accumulator + nextWidgetWidth;
                return (
                  <>
                    <Grid.Item col={columnWidths[widget.uid] || 6} s={12} key={widget.uid}>
                      <WidgetRoot
                        uid={widget.uid}
                        title={widget.title}
                        icon={widget.icon}
                        link={widget.link}
                        findWidget={findWidget}
                        moveWidget={moveWidget}
                        setDisplayTrashBin={setDisplayTrashBin}
                        columnWidths={columnWidths}
                        setColumnWidths={setColumnWidths}
                        gridRef={gridRef}
                      >
                        <WidgetComponent component={widget.component} />
                      </WidgetRoot>
                    </Grid.Item>
                    {nextAccumulator > 12 && accumulator < 12 && (
                      <Grid.Item
                        col={12 - accumulator}
                        display={{ initial: 'none', large: 'block' }}
                        key={`${widget.uid}-empty-box`}
                      >
                        <GapDropZone
                          insertIndex={index}
                          moveWidget={moveWidget}
                          onDropWidget={handleDropWidget}
                        />
                      </Grid.Item>
                    )}
                  </>
                );
              })}
              {filteredWidgets.length < listAuthorizedWidgets.length && (
                <Grid.Item col={6} s={12} key="add-new-widget">
                  <Flex
                    width="100%"
                    height="100%"
                    margin="auto"
                    alignItems="center"
                    justifyContent="center"
                    tag="section"
                    gap={4}
                    padding={6}
                  >
                    {displayAddNewWidget ? (
                      <Flex
                        direction="column"
                        justifyContent="center"
                        alignItems="center"
                        textAlign="center"
                        gap={2}
                      >
                        <Combobox
                          value={selectedWidgetToAdd}
                          placeholder={formatMessage({
                            id: 'global.selectWidgetToAdd',
                            defaultMessage: 'Search and select a widget to add',
                          })}
                          aria-label={formatMessage({
                            id: 'global.selectWidgetToAdd',
                            defaultMessage: 'Search and select a widget to add',
                          })}
                          onChange={(value) => setSelectedWidgetToAdd(value)}
                          onInputChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setSelectedWidgetToAdd(e.currentTarget.value);
                          }}
                        >
                          {listAuthorizedWidgets
                            .filter((widget) => !filteredWidgets.includes(widget))
                            .map((widget) => {
                              return (
                                <ComboboxOption key={widget.uid} value={widget.uid}>
                                  {formatMessage(widget.title)}
                                </ComboboxOption>
                              );
                            })}
                        </Combobox>
                        <Button
                          size="L"
                          startIcon={<Plus />}
                          onClick={() => handleAddWidget()}
                          disabled={!selectedWidgetToAdd}
                        >
                          Add widget
                        </Button>
                      </Flex>
                    ) : (
                      <Flex
                        width="100%"
                        height="100%"
                        direction="column"
                        justifyContent="center"
                        alignItems="center"
                        textAlign="center"
                        gap={2}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setDisplayAddNewWidget(true)}
                      >
                        <Plus width="3.2rem" height="3.2rem" fill="neutral500" />
                        <Typography variant="delta">
                          {formatMessage({
                            id: 'global.addAnotherWidget',
                            defaultMessage: 'Add another widget',
                          })}
                        </Typography>
                      </Flex>
                    )}
                  </Flex>
                </Grid.Item>
              )}
            </Grid.Root>
          )}
        </Flex>
      </Layouts.Content>
      {displayTrashBin && (
        <Box position="fixed" right="24px" top="12px" style={{ zIndex: 11 }}>
          <TrashBinButton
            onDrop={(widgetId) => {
              setFilteredWidgets((prev) => prev.filter((widget) => widget.uid !== widgetId));
              setDisplayTrashBin(false);
            }}
          />
        </Box>
      )}
    </Main>
  );
};

/* -------------------------------------------------------------------------------------------------
 * HomePage
 * -----------------------------------------------------------------------------------------------*/

const HomePage = () => {
  const Page = useEnterprise(
    HomePageCE,
    // eslint-disable-next-line import/no-cycle
    async () => (await import('../../../../ee/admin/src/pages/HomePage')).HomePageEE
  );

  // block rendering until the EE component is fully loaded
  if (!Page) {
    return null;
  }

  return <Page />;
};

export { HomePage, HomePageCE };
