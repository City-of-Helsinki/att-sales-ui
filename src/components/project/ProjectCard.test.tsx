import React from 'react';
import { render, screen } from '@testing-library/react';

import ProjectCard from './ProjectCard';
import mockProject from '../../mocks/project.json';
import { BrowserRouter } from 'react-router-dom';
import { Project } from '../../types';

const partialProjectData = mockProject as unknown;
const project = partialProjectData as Project;

describe('ProjectCard', () => {
  it('renders project details', () => {
    render(
      <ProjectCard
        project={project}
        renderAsLink={false}
        showActions
        lotteryLoading={false}
        lotteryOnClick={() => null}
      />
    );

    expect(screen.getByText('Taloyhtiö 30+')).toBeDefined(); // housing_company
    expect(screen.getByText('Hitas')).toBeDefined(); // ownership_type
    expect(screen.getByText('Pasila', { exact: false })).toBeDefined(); // district
    expect(screen.getByText('Kolkyt 30')).toBeDefined(); // street_address
  });

  it('renders project page link', () => {
    render(
      <ProjectCard
        project={project}
        renderAsLink={false}
        showActions
        lotteryLoading={false}
        lotteryOnClick={() => null}
      />
    );
    expect(screen.getByText('components.project.ProjectCard.showProject')).toBeDefined();
  });

  it('does not render project page link', () => {
    render(
      <BrowserRouter>
        <ProjectCard
          project={project}
          renderAsLink
          showActions={false}
          lotteryLoading={false}
          lotteryOnClick={() => null}
        />
      </BrowserRouter>
    );
    expect(screen.queryByText('components.project.ProjectCard.showProject')).toBeNull();
  });

  const mockProjectNoLottery = { ...project, lottery_completed_at: null };

  it('renders action buttons', () => {
    render(
      <ProjectCard
        project={mockProjectNoLottery}
        renderAsLink={false}
        showActions
        lotteryLoading={false}
        lotteryOnClick={() => null}
      />
    );
    expect(screen.getByText('components.project.ProjectCard.startHitasLottery')).toBeDefined();
  });
});
