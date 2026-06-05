import { StatusBar } from 'expo-status-bar';
import { AppRegistry } from 'react-native';
import { AppRouter } from './src/navigation/AppRouter';
import { AuthProvider } from './src/store/auth';
import { colors } from './src/theme/tokens';

export default function App() {
  return (
    <>
      <StatusBar style="light" backgroundColor={colors.background} />
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </>
  );
}

AppRegistry.registerComponent('LearnPlay', () => App);
