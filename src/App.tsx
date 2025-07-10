import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { useApiTokensClient, WithAuthentication } from 'hds-react';
import AuthSessionExpiringModal from './components/auth/AuthSessionExpiringModal';
import HandleCallback from './components/auth/HandleCallback';
import MainLayout from './components/common/mainLayout/MainLayout';
import { ROUTES } from './enums';
import AuthError from './pages/auth/AuthError';
import Login from './pages/auth/Login';
import Logout from './pages/auth/Logout';
import AddEditCustomer from './pages/customers/AddEditCustomer';
import CustomerDetail from './pages/customers/CustomerDetail';
import CustomerSearch from './pages/customers/CustomerSearch';
import NotFound from './pages/NotFound';
import ProjectDetail from './pages/project/ProjectDetail';
import ProjectList from './pages/project/ProjectList';
import CostIndex from './pages/reports/CostIndex';
import Reports from './pages/reports/Reports';

const Authenticated = (): JSX.Element => (
  <>
    <AuthSessionExpiringModal />
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
        <Route path={ROUTES.CALLBACK} element={<HandleCallback />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </>
);

const Unauthenticated = (): JSX.Element => (
  <Routes>
    <Route path="/" element={<MainLayout />}>
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.LOGOUT} element={<Logout />} />
      <Route path={ROUTES.AUTH_ERROR} element={<AuthError />} />
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} />} />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} />} />
      <Route path={ROUTES.CALLBACK} element={<HandleCallback />} />
    </Route>
  </Routes>
);

const App = (): React.ReactElement => {
  useApiTokensClient();
  return <WithAuthentication AuthorisedComponent={Authenticated} UnauthorisedComponent={Unauthenticated} />;
};

export default App;
