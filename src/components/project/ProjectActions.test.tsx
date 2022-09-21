import { screen } from '@testing-library/react';

import ProjectActions from './ProjectActions';
import mockProject from '../../mocks/project.json';
import { renderWithProviders } from '../../test/test-utils';
import { Project } from '../../types';

const partialProjectData = mockProject as unknown;
const project = partialProjectData as Project;

describe('ProjectActions', () => {
  it('renders download lottery results button when lottery is completed', () => {
    renderWithProviders(<ProjectActions project={{ ...project, lottery_completed_at: '01-01-2000' }} />);
    expect(screen.getByText('components.project.ProjectActions.downloadLotteryResults')).toBeDefined();
  });

  it('does not render download lottery results button when lottery is not yet completed', () => {
    renderWithProviders(<ProjectActions project={{ ...project, lottery_completed_at: null }} />);
    expect(screen.queryByText('components.project.ProjectActions.downloadLotteryResults')).toBeNull();
  });

  it('renders download applicant list button', () => {
    renderWithProviders(<ProjectActions project={project} />);
    expect(screen.getByText('components.project.ProjectActions.downloadApplicantList')).toBeDefined();
  });
});
