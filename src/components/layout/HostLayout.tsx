import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation } from 'react-router-dom';
import {
  Crown,
  User,
  LogOut,
  Home,
  Plus,
  Settings,
  BarChart3,
  Users,
  Gamepad2
} from 'lucide-react';

interface HostLayoutProps {
  children: React.ReactNode;
}

export function HostLayout({ children }: HostLayoutProps) {
  const { state: authState, signOut } = useAuth();
  const { state: gameState } = useGame();
  const location = useLocation();

  const initials = authState.user?.email ? authState.user.email.substring(0, 2).toUpperCase() : 'H';

  const handleSignOut = async () => {
    await signOut();
  };

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const path = location.pathname;
    const breadcrumbs = [
      { label: 'Host', href: '/host/dashboard' }
    ];

    if (path === '/host/dashboard') {
      breadcrumbs.push({ label: 'Dashboard', href: '/host/dashboard' });
    } else if (path === '/host/games/new') {
      breadcrumbs.push({ label: 'Create Game', href: '/host/games/new' });
    } else if (path.includes('/host/games/') && path.includes('/manage')) {
      const gameId = path.split('/')[3];
      breadcrumbs.push(
        { label: 'Games', href: '/host/dashboard' },
        { label: 'Manage Game', href: path }
      );
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="min-h-screen bg-background">
      {/* Host Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Host Brand */}
            <Link to="/host/dashboard" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-amber-500 rounded-lg">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">Host Dashboard</span>
            </Link>

            {/* Host Navigation Menu */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className="space-x-1">
                <NavigationMenuItem>
                  <Button
                    asChild
                    variant={location.pathname === '/host/dashboard' ? 'default' : 'ghost'}
                    className="px-4"
                  >
                    <Link to="/host/dashboard">
                      <Home className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Button
                    asChild
                    variant={location.pathname === '/host/games/new' ? 'default' : 'ghost'}
                    className="px-4"
                  >
                    <Link to="/host/games/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Game
                    </Link>
                  </Button>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Button
                    asChild
                    variant="ghost"
                    className="px-4"
                  >
                    <Link to="/host/games">
                      <Gamepad2 className="w-4 h-4 mr-2" />
                      My Games
                    </Link>
                  </Button>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Host User Menu */}
            <div className="flex items-center space-x-4">
              {/* Game Statistics Badge */}
              {gameState.hostDashboardData && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{gameState.hostDashboardData.gameStats.totalGamesHosted} games</span>
                </div>
              )}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Host Badge */}
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <Crown className="w-3 h-3 mr-1" />
                Host
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-amber-500 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{authState.user?.email}</p>
                      <p className="text-xs text-muted-foreground">Host Account</p>
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
                    <Link to="/host/games/new" className="cursor-pointer">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Game
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/host/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Host Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer">
                      <Gamepad2 className="w-4 h-4 mr-2" />
                      Switch to Player
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {breadcrumbs.length > 1 && (
          <div className="border-t bg-muted/50">
            <div className="container mx-auto px-4 py-2">
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <BreadcrumbItem key={crumb.href}>
                      {index < breadcrumbs.length - 1 ? (
                        <>
                          <BreadcrumbLink asChild>
                            <Link to={crumb.href}>{crumb.label}</Link>
                          </BreadcrumbLink>
                          <BreadcrumbSeparator />
                        </>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Host Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">
                Host Dashboard - Manage your trivia games
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {gameState.hostDashboardData && (
                <>
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="w-4 h-4" />
                    <span>{gameState.hostDashboardData.gameStats.activeGames} active games</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{gameState.hostDashboardData.gameStats.totalTeams} teams</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}