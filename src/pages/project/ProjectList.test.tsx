import React from 'react';
import { render, screen } from '@testing-library/react';

import ProjectList from './ProjectList';

jest.mock('hds-react', () => ({
  Button: ({ children }: any) => <button>{children}</button>,
  IconGroup: () => null,
  IconPlus: () => null,
  IconUser: () => null,
  Koros: () => null,
  Notification: ({ children }: any) => <div>{children}</div>,
  SearchInput: () => null,
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabList: ({ children }: any) => <div>{children}</div>,
  Tab: ({ children }: any) => <div>{children}</div>,
  TabPanel: ({ children }: any) => <div>{children}</div>,
  useOidcClient: () => ({ getUser: () => ({ profile: { name: 'Test User' } }) }),
  ButtonVariant: { Primary: 'Primary', Secondary: 'Secondary' },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../utils/usePageTitle', () => ({
  usePageTitle: () => undefined,
}));

jest.mock('../../components/common/spinner/Spinner', () => () => <div data-testid="spinner" />);

jest.mock('../../components/common/container/Container', () => ({ children }: any) => <div>{children}</div>);

jest.mock('../../components/project/ProjectCard', () => ({ project }: any) => <div>{project.housing_company}</div>);

jest.mock('../../utils/useLocalStorage', () => () => [false, jest.fn()]);

jest.mock('../../redux/services/useAllProjects', () => ({
  useAllProjects: jest.fn(),
}));

const { useAllProjects } = jest.requireMock('../../redux/services/useAllProjects');

describe('ProjectList', () => {
  it('renders projects incrementally (shows loading-more spinner)', () => {
    useAllProjects.mockReturnValue({
      projects: [
        {
          uuid: 'p1',
          housing_company: 'Housing Company 1',
          archived: false,
          published: true,
          state_of_sale: 'for_sale',
        },
      ],
      isLoadingInitial: false,
      isLoadingMore: true,
      isError: false,
    });

    render(<ProjectList />);

    expect(screen.getByText('Housing Company 1')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
});
