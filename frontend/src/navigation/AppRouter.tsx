import { Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';
import { CreatorDashboardScreen } from '../screens/creator/CreatorDashboardScreen';
import { PlayerDashboardScreen } from '../screens/player/PlayerDashboardScreen';
import { colors, spacing, typography } from '../theme/tokens';
import { useAuth } from '../store/auth';

export function AppRouter() {
  const { activeMode, chooseRole, isBootstrapping, logout, setActiveMode, user } = useAuth();

  if (isBootstrapping) {
    return (
      <View style={{ alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' }}>
        <Text style={{ color: colors.textPrimary, fontFamily: typography.family, fontSize: typography.subheading }}>
          Loading LearnPlay...
        </Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!activeMode || (activeMode === 'creator' && !user.role_creator && !user.role_admin)) {
    return <RoleSelectScreen onChooseRole={chooseRole} />;
  }

  return (
    <AppShell
      activeMode={activeMode}
      canAccessCreator={user.role_creator || user.role_admin}
      onLogout={logout}
      onSelectMode={(mode) => {
        if (mode === 'creator' && !user.role_creator && !user.role_admin) {
          chooseRole('creator');
          return;
        }
        setActiveMode(mode);
      }}
      userName={user.full_name.split(' ')[0] || user.email}
    >
      <View style={{ gap: spacing.lg }}>
        {activeMode === 'creator' ? <CreatorDashboardScreen /> : <PlayerDashboardScreen />}
      </View>
    </AppShell>
  );
}

