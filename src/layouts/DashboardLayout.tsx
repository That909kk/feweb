import React from 'react';
import AppShell from './AppShell';
import type { UserRole } from '../types/api';

type SupportedRole = Extract<UserRole, 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN'>;

type DashboardLayoutProps = {
  role: SupportedRole;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  title,
  description,
  actions,
  toolbar,
  children
}) => {
  return (
    <AppShell role={role} title={title} description={description} actions={actions} toolbar={toolbar}>
      {children}
    </AppShell>
  );
};

export default DashboardLayout;

