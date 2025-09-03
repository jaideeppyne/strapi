import { useMemo } from 'react';

import { useIntl, type MessageDescriptor, type PrimitiveType } from 'react-intl';
import { useLocation, resolvePath } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface NavigationLink {
  title?:
    | string
    | {
        id: string;
        defaultMessage: string;
      };
  intlLabel?: MessageDescriptor & { values?: Record<string, PrimitiveType> };
  to?: string;
  uid?: string;
  links?: NavigationLink[]; // Recursive links
}

interface NavigationSection {
  id?: string;
  title?:
    | string
    | {
        id: string;
        defaultMessage: string;
      };
  intlLabel?: MessageDescriptor & { values?: Record<string, PrimitiveType> };
  links?: NavigationLink[];
}

interface UseBreadcrumbOptions {
  sideNavLinks?: NavigationSection[];
  customBreadcrumbs?: BreadcrumbItem[];
}

/**
 * Generates breadcrumb based on the side nav links and the current path
 */
const useBreadcrumb = (options: UseBreadcrumbOptions = {}): BreadcrumbItem[] => {
  const { formatMessage } = useIntl();
  const { pathname } = useLocation();
  const { sideNavLinks = [], customBreadcrumbs } = options;

  return useMemo(() => {
    // Recursive function to find matching links across all side nav links and build breadcrumb
    const findMatchingPath = (
      links: NavigationLink[],
      currentPath: BreadcrumbItem[] = []
    ): BreadcrumbItem[] | null => {
      for (const link of links) {
        if (!link.to) {
          // If no direct link, check nested links
          if (link.links) {
            const label = link?.title || (link?.intlLabel && formatMessage(link?.intlLabel));
            const linkBreadcrumb = label
              ? {
                  label: typeof label === 'string' ? label : formatMessage(label),
                  href: undefined,
                }
              : null;

            const newPath = linkBreadcrumb ? [...currentPath, linkBreadcrumb] : currentPath;
            const result = findMatchingPath(link.links, newPath);
            if (result) return result;
          }
          continue;
        }

        const label = link?.title || (link?.intlLabel && formatMessage(link?.intlLabel));

        if (!label) continue;

        // Check if current pathname matches this link
        const pathSegments = pathname.split('/');
        const basePath = pathSegments.slice(0, 2).join('/') || '/';
        const resolvedPath = resolvePath(link.to, basePath);
        // Match complete paths: exact match, followed by /, or query params
        const pathPattern = new RegExp(
          `^${resolvedPath.pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\/.*|\\?.*|$)`
        );
        if (pathPattern.test(pathname)) {
          const linkBreadcrumb = {
            label: typeof label === 'string' ? label : formatMessage(label),
            href: link.to,
          };

          const fullPath = [...currentPath, linkBreadcrumb];

          // Check if there are nested links that might be a better match
          if (link.links) {
            const nestedResult = findMatchingPath(link.links, fullPath);
            if (nestedResult) return nestedResult;
          }

          return fullPath;
        }
      }

      return null;
    };

    if (customBreadcrumbs && customBreadcrumbs.length > 0) {
      return customBreadcrumbs;
    }

    for (const section of sideNavLinks) {
      if (section.links) {
        const result = findMatchingPath(section.links);
        if (result && result.length > 0) {
          return result;
        }
      }
    }

    return [];
  }, [pathname, sideNavLinks, customBreadcrumbs, formatMessage]);
};

export { useBreadcrumb };
export type { BreadcrumbItem, NavigationSection, UseBreadcrumbOptions };
