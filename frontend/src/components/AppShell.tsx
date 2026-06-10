import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type AppShellProps = {
  children: ReactNode;
  activeMode?: 'player' | 'creator';
  activePlayerPage?: 'dashboard' | 'certificates';
  userName?: string;
  onSelectMode?: (mode: 'player' | 'creator') => void;
  onSelectPlayerPage?: (page: 'dashboard' | 'certificates') => void;
  onLogout?: () => void;
};

const navItems: Array<{
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  mode: 'player' | 'creator';
}> = [
  { icon: 'view-dashboard-outline', label: 'Player Dashboard', mode: 'player' },
  { icon: 'gamepad-variant-outline', label: 'Creator Dashboard', mode: 'creator' },
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export function AppShell({
  children,
  activeMode = 'player',
  activePlayerPage = 'dashboard',
  userName = 'Arjun',
  onSelectMode,
  onSelectPlayerPage,
  onLogout,
}: AppShellProps) {
  const [greeting, setGreeting] = useState(getGreeting);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const selectMode = (mode: 'player' | 'creator') => {
    onSelectMode?.(mode);
    if (mode === 'player') {
      onSelectPlayerPage?.('dashboard');
    }
  };

  const selectCertificates = () => {
    onSelectMode?.('player');
    onSelectPlayerPage?.('certificates');
  };

  return (
    <View style={[styles.root, isMobile && styles.rootMobile]}>
      {!isMobile ? <View style={styles.sidebar}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <MaterialCommunityIcons name="shield-check" color={colors.white} size={25} />
          </View>
          <Text style={styles.brand}>RiskWatch</Text>
        </View>
        <Text style={styles.navEyebrow}>Workspace</Text>
        <View style={styles.nav}>
          {navItems.map((item) => {
            const active = item.mode === activeMode && (item.mode === 'creator' || activePlayerPage === 'dashboard');
            return (
              <Pressable
                key={item.label}
                onPress={() => selectMode(item.mode)}
                style={[styles.navItem, active && styles.navActive]}
              >
                <MaterialCommunityIcons
                  color={active ? colors.white : colors.textMuted}
                  name={item.icon}
                  size={20}
                />
                <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={selectCertificates}
            style={[styles.navItem, activeMode === 'player' && activePlayerPage === 'certificates' && styles.navActive]}
          >
            <MaterialCommunityIcons
              color={activeMode === 'player' && activePlayerPage === 'certificates' ? colors.white : colors.textMuted}
              name="certificate-outline"
              size={20}
            />
            <Text style={[styles.navText, activeMode === 'player' && activePlayerPage === 'certificates' && styles.navTextActive]}>
              Certificates
            </Text>
          </Pressable>
        </View>
        <View style={styles.sidebarFooter}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.userLabel}>{userName}</Text>
              <Text style={styles.userRole}>{activeMode === 'creator' ? 'Creator mode' : 'Player mode'}</Text>
            </View>
          </View>
          <Pressable onPress={onLogout} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" color={colors.textMuted} size={17} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View> : null}
      {isMobile ? (
        <View style={styles.mobileHeader}>
          <View style={styles.brandRow}>
            <View style={styles.mobileBrandIcon}>
              <MaterialCommunityIcons name="shield-check" color={colors.white} size={20} />
            </View>
            <Text style={styles.mobileBrand}>RiskWatch</Text>
          </View>
          <View style={styles.mobileHeaderActions}>
            <View style={styles.mobileAvatar}>
              <Text style={styles.headerAvatarText}>{userName.slice(0, 1).toUpperCase()}</Text>
            </View>
            <Pressable accessibilityLabel="Logout" hitSlop={8} onPress={onLogout} style={styles.mobileLogout}>
              <MaterialCommunityIcons name="logout" color={colors.textSecondary} size={20} />
            </Pressable>
          </View>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
        style={styles.scroll}
      >
        <View style={[styles.topBar, isMobile && styles.topBarMobile]}>
          <View>
            <Text style={[styles.greeting, isMobile && styles.greetingMobile]}>{greeting}, {userName}!</Text>
            <Text style={[styles.subtitle, isMobile && styles.subtitleMobile]}>Learn, play, compete, and become the expert.</Text>
          </View>
          {!isMobile ? <View style={styles.headerProfile}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{userName.slice(0, 1).toUpperCase()}</Text>
            </View>
            <Text style={styles.headerName}>{userName}</Text>
          </View> : null}
        </View>
        {children}
      </ScrollView>
      {isMobile ? (
        <View style={styles.mobileNav}>
          <MobileNavItem
            active={activeMode === 'player' && activePlayerPage === 'dashboard'}
            icon="view-dashboard-outline"
            label="Player"
            onPress={() => selectMode('player')}
          />
          <MobileNavItem
            active={activeMode === 'creator'}
            icon="gamepad-variant-outline"
            label="Creator"
            onPress={() => selectMode('creator')}
          />
          <MobileNavItem
            active={activeMode === 'player' && activePlayerPage === 'certificates'}
            icon="certificate-outline"
            label="Awards"
            onPress={selectCertificates}
          />
        </View>
      ) : null}
    </View>
  );
}

function MobileNavItem({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.mobileNavItem, active && styles.mobileNavItemActive]}>
      <MaterialCommunityIcons color={active ? colors.primary : colors.textMuted} name={icon} size={22} />
      <Text style={[styles.mobileNavLabel, active && styles.mobileNavLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
    flexDirection: 'row',
    minHeight: '100vh' as never,
  },
  rootMobile: {
    flexDirection: 'column',
  },
  sidebar: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRightWidth: 1,
    display: 'flex',
    gap: spacing.lg,
    padding: spacing.lg,
    width: 250,
    zIndex: 1,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  brand: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  brandIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    width: 46,
  },
  navEyebrow: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.tiny,
    fontWeight: '900',
    marginTop: spacing.md,
    textTransform: 'uppercase',
  },
  nav: {
    gap: spacing.sm,
  },
  navItem: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  navActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  navText: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '700',
  },
  navTextActive: {
    color: colors.white,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    minWidth: 0,
    padding: spacing.xl,
  },
  contentMobile: {
    gap: spacing.md,
    paddingBottom: 104,
    paddingHorizontal: spacing.md,
    paddingTop: 0,
  },
  sidebarFooter: {
    borderColor: colors.cardBorder,
    borderTopWidth: 1,
    gap: spacing.md,
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  userLabel: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '800',
  },
  userRole: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.tiny,
    marginTop: 2,
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  avatarText: {
    color: colors.white,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  logoutButton: {
    alignItems: 'center',
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  logoutText: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
  topBar: {
    alignItems: 'center',
    borderBottomColor: colors.cardBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -spacing.xl,
    marginTop: -spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  topBarMobile: {
    alignItems: 'flex-start',
    marginHorizontal: -spacing.md,
    marginTop: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  greeting: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  greetingMobile: {
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
  subtitleMobile: {
    fontSize: typography.helper,
    lineHeight: 19,
  },
  headerProfile: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerAvatarText: {
    color: colors.white,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  headerName: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '800',
  },
  mobileHeader: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
    borderBottomColor: colors.cardBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 2,
  },
  mobileBrandIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  mobileBrand: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  mobileHeaderActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mobileAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  mobileLogout: {
    alignItems: 'center',
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  mobileNav: {
    backgroundColor: colors.backgroundSoft,
    borderTopColor: colors.cardBorder,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    paddingBottom: 8,
    paddingHorizontal: spacing.sm,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
    zIndex: 10,
  },
  mobileNavItem: {
    alignItems: 'center',
    borderRadius: radius.md,
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    minHeight: 52,
  },
  mobileNavItemActive: {
    backgroundColor: colors.surfaceElevated,
  },
  mobileNavLabel: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 10,
    fontWeight: '800',
  },
  mobileNavLabelActive: {
    color: colors.primary,
  },
});
