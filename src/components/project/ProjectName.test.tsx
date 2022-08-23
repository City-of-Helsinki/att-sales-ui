import { render, screen } from '@testing-library/react';
import ProjectName from './ProjectName';

import dummyProjects from '../../mocks/projects.json';
import { BrowserRouter } from 'react-router-dom';

const project = dummyProjects[0];

describe('ProjectName Page', () => {
  it('renders the component', () => {
    const { container } = render(<ProjectName />);
    const element = container.firstChild;
    expect(element).toBeDefined();
  });

  it('renders null without assigned project', () => {
    render(<ProjectName project={undefined} />);
    expect(screen.queryByText('Hitas')).toBeNull();
  });

  it('renders project details', () => {
    render(<ProjectName project={project} />);
    expect(screen.getByText('Hitas')).toBeDefined(); // ownership_type
    expect(screen.getByText('Taloyhti\u00f6 30+')).toBeDefined(); // housing_company
    expect(screen.getByText('Pasila', { exact: false })).toBeDefined(); // district
    expect(screen.getByText('Kolkyt 30')).toBeDefined(); // street_address
  });

  it('renders project page link', () => {
    render(
      <BrowserRouter>
        <ProjectName project={project} asLink />
      </BrowserRouter>
    );
    expect(screen.getByText('Taloyhti\u00f6 30+').closest('a')).toHaveAttribute(
      'href',
      '/projects/9f79116b-898c-4fa0-80ba-c3870c624373'
    );
  });
});
