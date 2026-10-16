import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { NotificationDrawer } from './components/NotificationDrawer';
import { EmailViewerModal } from './components/EmailViewerModal';
import { CitizenDashboard } from './screens/CitizenDashboard';
import { ReportIssueScreen } from './screens/ReportIssueScreen';
import { IssueDetailsScreen } from './screens/IssueDetailsScreen';
import { CommunityVerificationScreen } from './screens/CommunityVerificationScreen';
import { OfficerDashboardScreen } from './screens/OfficerDashboardScreen';
import { EngineerPortalScreen } from './screens/EngineerPortalScreen';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { authApi, getStoredUser, notificationApi } from './services/api';
import { NotificationItem, User } from './types';

const homeScreenForRole = (role: string) => {
  if (role === 'Municipal Officer') return 'officer';
  if (role === 'Field Engineer') return 'engineer';
  if (role === 'Administrator') return 'admin';
  return 'citizen';
};

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [activeScreen, setActiveScreen] = useState<string>(() => {
    const user = getStoredUser();
    return user ? homeScreenForRole(user.role) : 'login';
  });
  const [selectedIssueId, setSelectedIssueId] = useState<string>('issue-001');

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const data = await notificationApi.list();
      setNotifications(data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 10000);
    return () => clearInterval(timer);
  }, [currentUser]);

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    setActiveScreen('login');
  };

  const handleMarkNotifRead = async (id: string) => {
    await notificationApi.markRead(id);
    fetchNotifications();
  };

  const handleMarkAllNotifRead = async () => {
    await notificationApi.markAllRead();
    fetchNotifications();
  };

  const handleSelectIssue = (issueId: string) => {
    setSelectedIssueId(issueId);
    setActiveScreen('issue-details');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Persistent Navigation */}
      <Navbar
        currentUser={currentUser}
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        onLogout={handleLogout}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onOpenEmailLogs={() => setIsEmailModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeScreen === 'citizen' && (
          <CitizenDashboard
            currentUser={currentUser}
            onNavigateReport={() => setActiveScreen('report')}
            onNavigateVerify={() => setActiveScreen('verify')}
            onSelectIssue={handleSelectIssue}
          />
        )}

        {activeScreen === 'report' && (
          <ReportIssueScreen
            currentUser={currentUser}
            onSuccess={(id) => {
              setSelectedIssueId(id);
              setActiveScreen('issue-details');
              fetchNotifications();
            }}
            onCancel={() => setActiveScreen('citizen')}
            onRequireLogin={() => setActiveScreen('login')}
          />
        )}

        {activeScreen === 'issue-details' && (
          <IssueDetailsScreen
            issueId={selectedIssueId}
            currentUser={currentUser}
            onBack={() => setActiveScreen('citizen')}
            onRequireLogin={() => setActiveScreen('login')}
          />
        )}

        {activeScreen === 'verify' && (
          <CommunityVerificationScreen
            currentUser={currentUser}
            onSelectIssue={handleSelectIssue}
            onRequireLogin={() => setActiveScreen('login')}
          />
        )}

        {activeScreen === 'officer' && (
          <OfficerDashboardScreen
            currentUser={currentUser}
            onSelectIssue={handleSelectIssue}
          />
        )}

        {activeScreen === 'engineer' && (
          <EngineerPortalScreen
            currentUser={currentUser}
            onSelectIssue={handleSelectIssue}
          />
        )}

        {activeScreen === 'admin' && (
          <AdminDashboardScreen
            currentUser={currentUser}
            onSelectIssue={handleSelectIssue}
          />
        )}

        {activeScreen === 'login' && (
          <LoginScreen
            onSuccess={(user) => {
              setCurrentUser(user);
              setActiveScreen(homeScreenForRole(user.role));
              fetchNotifications();
            }}
            onSwitchToRegister={() => setActiveScreen('register')}
          />
        )}

        {activeScreen === 'register' && (
          <RegisterScreen
            onSuccess={(user) => {
              setCurrentUser(user);
              setActiveScreen('citizen');
              fetchNotifications();
            }}
            onSwitchToLogin={() => setActiveScreen('login')}
          />
        )}
      </main>

      {/* Slide-out In-App Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifRead}
        onSelectIssueLink={(link) => {
          setIsNotifDrawerOpen(false);
          const parts = link.split('/');
          if (parts.length >= 3) {
            handleSelectIssue(parts[2]);
          }
        }}
      />

      {/* Simulated Email Dispatch Viewer Modal */}
      <EmailViewerModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>CivicLens:</strong> AI-Powered Community-Based Urban Issue Reporting & Intelligent Prioritization System
          </div>
          <div className="text-slate-400">
            MIT World Peace University &bull; Academic Year 2026-27 &bull; Karl E. Wiegers IEEE SRS & COCOMO II
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
