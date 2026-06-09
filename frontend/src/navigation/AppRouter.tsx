import { useState } from 'react';
import { Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { CreatorDashboardScreen } from '../screens/creator/CreatorDashboardScreen';
import { PlayerDashboardScreen } from '../screens/player/PlayerDashboardScreen';
import { CertificatesScreen } from '../screens/player/CertificatesScreen';
import { colors, spacing, typography } from '../theme/tokens';
import { useAuth } from '../store/auth';

export function AppRouter() {
  const { activeMode, isBootstrapping, logout, setActiveMode, user } = useAuth();
  const [activePlayerPage, setActivePlayerPage] = useState<'dashboard' | 'certificates'>('dashboard');

  if (isBootstrapping) {
    return (
      <View style={{ alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' }}>
        <Text style={{ color: colors.textPrimary, fontFamily: typography.family, fontSize: typography.subheading }}>
          Loading RiskWatch...
        </Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <AppShell
      activeMode={activeMode}
      activePlayerPage={activePlayerPage}
      onLogout={logout}
      onSelectMode={setActiveMode}
      onSelectPlayerPage={setActivePlayerPage}
      userName={user.name.split(' ')[0] || user.email}
    >
      <View style={{ gap: spacing.lg }}>
        {activeMode === 'creator' ? (
          <CreatorDashboardScreen />
        ) : activePlayerPage === 'certificates' ? (
          <CertificatesScreen />
        ) : (
          <PlayerDashboardScreen onShowCertificates={() => setActivePlayerPage('certificates')} />
        )}
      </View>
    </AppShell>
  );
}
