import { Project } from '../types';

export const filterProjectsByEstateAgent = (projects: Project[], name: string) => {
  if (!projects) {
    return [];
  }

  // Get only projects that match sales person name
  return projects.filter((project) => project.estate_agent?.toLocaleLowerCase() === name?.toLocaleLowerCase());
};
