import * as React from 'react';

import { Flex, Typography } from '@strapi/design-system';
import { styled } from 'styled-components';

import { type BreadcrumbItem } from '../hooks/useBreadcrumb';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  maxItems?: number;
}

const BreadcrumbContainer = styled(Flex)`
  align-items: center;
  gap: ${({ theme }) => theme.spaces[2]};
  overflow: hidden;
`;

const BreadcrumbText = styled(Typography)<{ $isActive?: boolean }>`
  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.neutral800 : theme.colors.neutral600};
  font-weight: ${({ $isActive }) => ($isActive ? 600 : 400)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 20rem;
`;

const EllipsisText = styled(Typography)`
  color: ${({ theme }) => theme.colors.neutral400};
`;

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, maxItems = 4 }) => {
  const displayItems = React.useMemo(() => {
    if (items.length <= maxItems) {
      return items;
    }

    // Show first item, ellipsis, and last item
    const first = items[0];
    const last = items.slice(-(maxItems - 1));

    return [first, { label: '...', isEllipsis: true }, ...last];
  }, [items, maxItems]);

  if (items.length === 0) {
    return null;
  }

  return (
    <BreadcrumbContainer role="navigation" aria-label="Breadcrumb">
      {displayItems.map((item) => {
        // Handle ellipsis
        if ('isEllipsis' in item && item.isEllipsis) {
          return (
            <React.Fragment key="ellipsis">
              <Typography variant="pi" aria-hidden="true">
                /
              </Typography>
              <EllipsisText variant="pi" aria-hidden="true">
                {item.label}
              </EllipsisText>
            </React.Fragment>
          );
        }

        const breadcrumbItem = item as BreadcrumbItem;

        return (
          <React.Fragment key={`breadcrumb-${breadcrumbItem.href || breadcrumbItem.label}`}>
            <Typography variant="pi" aria-hidden="true">
              /
            </Typography>
            <BreadcrumbText
              variant="pi"
              $isActive={breadcrumbItem.isActive}
              title={breadcrumbItem.label}
              aria-current={breadcrumbItem.isActive ? 'page' : undefined}
            >
              {breadcrumbItem.label}
            </BreadcrumbText>
          </React.Fragment>
        );
      })}
    </BreadcrumbContainer>
  );
};

export { Breadcrumb };
export type { BreadcrumbProps };
