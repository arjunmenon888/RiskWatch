import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { XPBadge } from './XPBadge';

type AppShellProps = {
  children: ReactNode;
  activeMode?: 'player' | 'creator';
  canAccessCreator?: boolean;
  userName?: string;
  onSelectMode?: (mode: 'player' | 'creator') => void;
  onLogout?: () => void;
};

const navItems: Array<{ label: string; mode: 'player' | 'creator' }> = [
  { label: 'Player Dashboard', mode: 'player' },
  { label: 'Creator Dashboard', mode: 'creator' },
];

export function AppShell({
  children,
  activeMode = 'player',
  canAccessCreator = true,
  userName = 'Arjun',
  onSelectMode,
  onLogout,
}: AppShellProps) {
  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <View style={styles.brandRow}>
          <MaterialCommunityIcons name="gamepad-variant" color={colors.primaryLight} size={32} />
          <Text style={styles.brand}>LearnPlay</Text>
        </View>
        <View style={styles.nav}>
          {navItems.map((item) => {
            const locked = item.mode === 'creator' && !canAccessCreator;
            const active = item.mode === activeMode;
            return (
              <Pressable
                disabled={locked}
                key={item.label}
                onPress={() => onSelectMode?.(item.mode)}
                style={[styles.navItem, active && styles.navActive, locked && styles.navLocked]}
              >
                <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.sidebarFooter}>
          <Text style={styles.userLabel}>{userName}</Text>
          <Pressable onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Good morning, {userName}!</Text>
            <Text style={styles.subtitle}>Learn, play, compete, and become the expert.</Text>
          </View>
          <XPBadge value="24,850" />
        </View>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
    flexDirection: 'row',
    minHeight: '100vh' as never,
  },
  sidebar: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRightWidth: 1,
    display: 'flex',
    gap: spacing.xl,
    padding: spacing.lg,
    width: 260,
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
  nav: {
    gap: spacing.sm,
  },
  navItem: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  navActive: {
    backgroundColor: colors.surfaceElevated,
  },
  navLocked: {
    opacity: 0.45,
  },
  navText: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '700',
  },
  navTextActive: {
    color: colors.textPrimary,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.xl,
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
  logoutButton: {
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  greeting: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
});
