import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';

import AddEditCustomer from './pages/customers/AddEditCustomer';
import AuthError from './pages/auth/AuthError';
import CostIndex from './pages/reports/CostIndex';
import CustomerDetail from './pages/customers/CustomerDetail';
import CustomerSearch from './pages/customers/CustomerSearch';
import Login from './pages/auth/Login';
import Logout from './pages/auth/Logout';
import MainLayout from './components/common/mainLayout/MainLayout';
import NotFound from './pages/NotFound';
import ProjectDetail from './pages/project/ProjectDetail';
import ProjectList from './pages/project/ProjectList';
import Reports from './pages/reports/Reports';
import Spinner from './components/common/spinner/Spinner';
import WithAuth from './components/auth/WithAuth';

import { ROUTES } from './enums';

const Authenticated = (): JSX.Element => (
  <Routes>
    <Route path="/" element={<MainLayout authenticated />}>
      <Route index element={<Navigate to={ROUTES.PROJECTS} />} />
      <Route path={ROUTES.PROJECTS} element={<ProjectList />} />
      <Route path={`${ROUTES.PROJECTS}/:projectId`} element={<ProjectDetail />} />
      <Route path={ROUTES.CUSTOMERS} element={<CustomerSearch />} />
      <Route path={`${ROUTES.CUSTOMERS}/:customerId`} element={<CustomerDetail />} />
      <Route path={`${ROUTES.ADD_CUSTOMER}`} element={<AddEditCustomer isEditMode={false} />} />
      <Route path={`${ROUTES.EDIT_CUSTOMER}/:customerId`} element={<AddEditCustomer isEditMode />} />
      <Route path={ROUTES.REPORTS} element={<Reports />} />
      <Route path={ROUTES.COST_INDEX} element={<CostIndex />} />
      <Route path={ROUTES.LOGIN} element={<Navigate to={ROUTES.INDEX} />} />
      <Route path={ROUTES.LOGOUT} element={<Navigate to={ROUTES.INDEX} />} />
      <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

const Unauthenticated = (): JSX.Element => (
  <Routes>
    <Route path="/" element={<MainLayout />}>
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.LOGOUT} element={<Logout />} />
      <Route path={ROUTES.AUTH_ERROR} element={<AuthError />} />
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} />} />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} />} />
    </Route>
  </Routes>
);

const App = (): React.ReactElement => WithAuth(Authenticated, Unauthenticated, Spinner);

export default App;
