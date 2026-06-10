import { StatusBar } from 'expo-status-bar';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect } from 'react';
import { AppRegistry } from 'react-native';
import { AppRouter } from './src/navigation/AppRouter';
import { AuthProvider } from './src/store/auth';
import { colors } from './src/theme/tokens';

export default function App() {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const style = document.createElement('style');
    style.id = 'riskwatch-responsive-styles';
    style.textContent = `
      html, body, #root {
        margin: 0;
        min-height: 100%;
        width: 100%;
      }

      body {
        overflow-x: hidden;
      }

      * {
        box-sizing: border-box;
      }

      @media (max-width: 767px) {
        #root, #root > div {
          max-width: 100vw;
          overflow-x: hidden;
          width: 100%;
        }

        #root * {
          min-width: 0 !important;
          max-width: 100%;
          overflow-wrap: anywhere;
        }

        #root input,
        #root textarea,
        #root iframe {
          max-width: 100% !important;
          width: 100% !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

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
