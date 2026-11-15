import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Moon, Sun, TrendingUp, Brain, FolderOpen,
  PanelLeftClose, PanelLeft, Code2, Menu, LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/trending', label: 'GitHub Trending', icon: TrendingUp, description: 'Discover trending repos' },
  { to: '/models', label: 'AI Models', icon: Brain, description: 'Compare AI models' },
  { to: '/files', label: 'File Manager', icon: FolderOpen, description: 'Manage & sync files' },
];

const pageTitles: Record<string, string> = {
  '/trending': 'GitHub Trending',
  '/models': 'AI Models',
  '/files': 'File Manager',
};

function SidebarContent({
  collapsed,
  onCollapse,
  theme,
  onToggleTheme,
  onNavClick,
  onLogout,
}: {
  collapsed: boolean;
  onCollapse?: () => void;
  theme: string;
  onToggleTheme: () => void;
  onNavClick?: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <div className={cn('flex items-center gap-3 px-4 py-5', collapsed && 'justify-center px-2')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Code2 className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight">OneHub</span>
            <span className="text-[11px] leading-tight text-muted-foreground">Everything. One Platform.</span>
          </div>
        )}
      </div>
      <Separator />

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Platform
          </p>
        )}
        <nav className="flex flex-col gap-1" role="navigation" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavClick}
              aria-label={label}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="px-3 pb-4">
        <Separator className="mb-3" />
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn(
              'w-full gap-3 text-muted-foreground hover:text-foreground',
              collapsed ? 'justify-center px-2' : 'justify-start'
            )}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </Button>
          {onCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'w-full gap-3 text-muted-foreground hover:text-foreground',
                collapsed ? 'justify-center px-2' : 'justify-start'
              )}
            >
              {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              {!collapsed && <span className="text-sm">Collapse</span>}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            aria-label="Sign out"
            className={cn(
              'w-full gap-3 text-muted-foreground hover:text-destructive',
              collapsed ? 'justify-center px-2' : 'justify-start'
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="text-sm">Sign out</span>}
          </Button>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { email, role, logout } = useAuth();
  const location = useLocation();
  const currentTitle = pageTitles[location.pathname] || 'OneHub';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden flex-col border-r bg-card transition-all duration-200 md:flex',
          collapsed ? 'w-[60px]' : 'w-[240px]'
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={logout}
        />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 md:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent
                collapsed={false}
                theme={theme}
                onToggleTheme={toggleTheme}
                onNavClick={() => setMobileOpen(false)}
                onLogout={logout}
              />
            </SheetContent>
          </Sheet>

          <h1 className="text-lg font-semibold">{currentTitle}</h1>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Everything. One Platform.
            </span>
            {role && (
              <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {role === 'admin' ? 'Admin' : 'User'}
              </span>
            )}
            {email && (
              <span className="hidden rounded-md bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground sm:inline">
                {email}
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
