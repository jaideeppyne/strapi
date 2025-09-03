import * as React from 'react';

import { Box, Flex, Typography, TypographyProps } from '@strapi/design-system';
import { styled } from 'styled-components';

import { useElementOnScreen } from '../../hooks/useElementOnScreen';

/* -------------------------------------------------------------------------------------------------
 * BaseHeaderLayout
 * -----------------------------------------------------------------------------------------------*/

const StickyHeader = styled(Box)`
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
`;

interface BaseHeaderLayoutProps extends Omit<TypographyProps<'div'>, 'tag'> {
  navigationAction?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  subtitle?: React.ReactNode;
  sticky?: boolean;
}

const BaseHeaderLayout = React.forwardRef<HTMLDivElement, BaseHeaderLayoutProps>(
  (
    { navigationAction, primaryAction, secondaryAction, subtitle, title, sticky, ...props },
    ref
  ) => {
    const isSubtitleString = typeof subtitle === 'string';

    if (sticky) {
      return (
        <StickyHeader
          paddingLeft={{
            initial: 4,
            medium: 6,
          }}
          paddingRight={{
            initial: 4,
            medium: 6,
          }}
          paddingTop={2}
          paddingBottom={2}
          position="fixed"
          top={{
            initial: '5.7rem',
            large: 0,
          }}
          right={0}
          background="neutral0"
          shadow="tableShadow"
          width={{
            initial: '100%',
            medium: `calc(100% - 23.2rem)`,
            large: `calc(100% - 23.2rem - 5.6rem)`,
          }}
          zIndex={2}
          minHeight={'5.7em'}
          data-strapi-header-sticky
        >
          <Flex justifyContent="space-between" wrap="wrap">
            <Flex>
              {navigationAction && <Box paddingRight={3}>{navigationAction}</Box>}
              <Box>
                <Typography variant="beta" tag="h1" {...props}>
                  {title}
                </Typography>
                {isSubtitleString ? (
                  <Typography variant="pi" textColor="neutral600">
                    {subtitle}
                  </Typography>
                ) : (
                  subtitle
                )}
              </Box>
              {secondaryAction ? <Box paddingLeft={4}>{secondaryAction}</Box> : null}
            </Flex>
            <Flex>{primaryAction ? <Box paddingLeft={2}>{primaryAction}</Box> : undefined}</Flex>
          </Flex>
        </StickyHeader>
      );
    }

    return (
      <Box
        ref={ref}
        paddingLeft={{
          initial: 4,
          medium: 6,
          large: 10,
        }}
        paddingRight={{
          initial: 4,
          medium: 6,
          large: 10,
        }}
        paddingBottom={{
          initial: 4,
          large: 8,
        }}
        paddingTop={{
          initial: 4,
          large: navigationAction ? 6 : 8,
        }}
        background="neutral100"
        data-strapi-header
      >
        <Flex direction="column" alignItems="flex-start" gap={2}>
          {navigationAction}
          <Flex justifyContent="space-between" wrap="wrap" gap={4}>
            <Flex minWidth={0}>
              <Typography tag="h1" variant="alpha" {...props}>
                {title}
              </Typography>
              {secondaryAction ? <Box paddingLeft={4}>{secondaryAction}</Box> : null}
            </Flex>
            {primaryAction}
          </Flex>
        </Flex>
        {isSubtitleString ? (
          <Typography
            variant="epsilon"
            textColor="neutral600"
            tag="p"
            paddingTop={{ initial: 4, large: 0 }}
          >
            {subtitle}
          </Typography>
        ) : (
          subtitle
        )}
      </Box>
    );
  }
);

/* -------------------------------------------------------------------------------------------------
 * HeaderLayout
 * -----------------------------------------------------------------------------------------------*/

interface HeaderLayoutProps extends BaseHeaderLayoutProps {}

const HeaderLayout = (props: HeaderLayoutProps) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const containerRef = useElementOnScreen<HTMLDivElement>(setIsVisible, {
    root: null,
    rootMargin: '0px',
    threshold: 0,
  });

  return (
    <>
      <div ref={containerRef}>{isVisible && <BaseHeaderLayout {...props} />}</div>

      {!isVisible && <BaseHeaderLayout {...props} sticky />}
    </>
  );
};

HeaderLayout.displayName = 'HeaderLayout';

export type { HeaderLayoutProps, BaseHeaderLayoutProps };
export { HeaderLayout, BaseHeaderLayout };
