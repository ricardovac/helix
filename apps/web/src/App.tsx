import { AuthScreen } from './components/AuthScreen';
import { ChatApp } from './components/ChatApp';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { user, isAuthenticated, signIn, signUp, signOut } = useAuth();

  if (!isAuthenticated || !user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} />;
  }

  return <ChatApp user={user} onSignOut={signOut} />;
}
