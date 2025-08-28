import { IconButton, SubNavHeader } from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { styled } from 'styled-components';

import { useSubNav } from '../hooks/useSubNav';

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
  Header,
};
