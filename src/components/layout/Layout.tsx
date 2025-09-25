import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useLocation } from 'react-router-dom';
import {
  Gamepad2,
  User,
  LogOut,
  Settings,
  Trophy,
  Home
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { state, signOut } = useAuth();
  const location = useLocation();

  const isAuthenticated = state.user && !state.loading;
  const initials = state.user?.email ? state.user.email.substring(0, 2).toUpperCase() : 'U';

  const handleSignOut = async () => {
    await signOut();
  };

  // Don't show navigation on auth pages
  const hideNavigation = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      {!hideNavigation && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              {/* Logo/Brand */}
              <Link to="/" className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                  <Gamepad2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">Trivia Challenge</span>
              </Link>

              {/* Navigation Menu */}
              {isAuthenticated && (
                <NavigationMenu className="hidden md:flex">
                  <NavigationMenuList className="space-x-1">
                    <NavigationMenuItem>
                      <Button
                        asChild
                        variant={location.pathname === '/' ? 'default' : 'ghost'}
                        className="px-4"
                      >
                        <Link to="/">
                          <Home className="w-4 h-4 mr-2" />
                          Home
                        </Link>
                      </Button>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <Button
                        asChild
                        variant={location.pathname.startsWith('/game') ? 'default' : 'ghost'}
                        className="px-4"
                      >
                        <Link to="/game/setup">
                          <Gamepad2 className="w-4 h-4 mr-2" />
                          New Game
                        </Link>
                      </Button>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <Button
                        asChild
                        variant={location.pathname === '/profile' ? 'default' : 'ghost'}
                        className="px-4"
                      >
                        <Link to="/profile">
                          <Trophy className="w-4 h-4 mr-2" />
                          Stats
                        </Link>
                      </Button>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              )}

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium text-sm">{state.user?.email}</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/game/setup" className="cursor-pointer">
                          <Gamepad2 className="w-4 h-4 mr-2" />
                          New Game
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button asChild variant="ghost">
                      <Link to="/login">Sign In</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/register">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={hideNavigation ? '' : 'pt-0'}>
        {children}
      </main>

      {/* Footer */}
      {!hideNavigation && (
        <footer className="border-t bg-muted/50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <Gamepad2 className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Trivia Challenge - Test your knowledge
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Built with React, TypeScript & Supabase
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}