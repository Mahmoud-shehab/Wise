import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthContext';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import RoleBasedRedirect from '@/components/RoleBasedRedirect';
import Login from '@/features/auth/Login';
import DashboardPage from '@/routes/DashboardPage';
import TasksPage from '@/routes/TasksPage';
import AllTasksPage from '@/routes/AllTasksPage';
import TaskTypesPage from '@/routes/TaskTypesPage';
import CompaniesPage from '@/routes/CompaniesPage';
import ReportsPage from '@/routes/ReportsPage';
import TaskDetailsPage from '@/routes/TaskDetailsPage';
import AdminPage from '@/routes/AdminPage';
import ProjectsPage from '@/routes/ProjectsPage';
import ProjectDetailPage from '@/routes/ProjectDetailPage';
import ReviewPage from '@/routes/ReviewPage';

import CalendarPage from '@/routes/CalendarPage';
import MessagesPage from '@/routes/MessagesPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/Wise/">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<AuthGuard />}>
            <Route element={<Layout />}>
              <Route path="/" element={<RoleBasedRedirect />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/tasks/:id" element={<TaskDetailsPage />} />
              
              {/* Manager-only routes */}
              <Route element={<AuthGuard requireManager />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/all-tasks" element={<AllTasksPage />} />
                <Route path="/task-types" element={<TaskTypesPage />} />
                <Route path="/companies" element={<CompaniesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
