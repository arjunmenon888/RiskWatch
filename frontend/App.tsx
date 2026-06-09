import { StatusBar } from 'expo-status-bar';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppRegistry } from 'react-native';
import { AppRouter } from './src/navigation/AppRouter';
import { AuthProvider } from './src/store/auth';
import { colors } from './src/theme/tokens';

export default function App() {
  const app = (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.background} />
      {process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID}>{app}</GoogleOAuthProvider>
      ) : app}
    </>
  );
}

AppRegistry.registerComponent('RiskWatch', () => App);
