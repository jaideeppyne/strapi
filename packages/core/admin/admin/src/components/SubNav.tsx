import {
  IconButton,
  SubNavHeader,
  SubNav as DSSubNav,
  ScrollArea,
  type BoxProps,
  Box,
} from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { styled } from 'styled-components';

import { useSubNav } from '../hooks/useSubNav';

const SubNavContainer = styled(DSSubNav)`
  display: flex;
  flex-direction: column;
`;

type SubNavProps = {
  children: React.ReactNode;
  header: React.ReactNode;
} & BoxProps;

const Main = ({ children, header, ...props }: SubNavProps) => (
  <SubNavContainer {...props}>
    {header}
    <ScrollArea>
      <Box paddingBottom={4}>{children}</Box>
    </ScrollArea>
  </SubNavContainer>
);

const CloseButton = styled(IconButton)`
  display: block;

  ${({ theme }) => theme.breakpoints.medium} {
    display: none;
  }
`;

const Header = ({ label }: { label: string }) => {
  const { closeSideNav } = useSubNav();
  return (
    <SubNavHeader
      label={label}
      additionalAction={
        <CloseButton
          onClick={closeSideNav}
          label="Close side navigation" // TODO: translate
          type="button"
        >
          <Cross display="block" />
        </CloseButton>
      }
    />
  );
};

export const SubNav = {
  Main,
  Header,
};
