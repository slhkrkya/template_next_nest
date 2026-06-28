import { QueryProvider } from './query-provider';
import { PrimeProvider } from './prime-provider';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from './auth-provider';
import { SocketProvider } from './socket-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <PrimeProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthProvider>
        </PrimeProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
