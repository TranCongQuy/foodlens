import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  UtensilsCrossed,
  Camera,
  Settings,
  ShieldCheck,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { vi } from '@/lib/i18n/vi';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export const UserLayout: React.FC = () => {
  const { profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Dropdown states
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const accountDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Desktop Center Tabs — điều hướng chính của FoodLens
  // (các trang truyện vẫn còn route làm đường lui, chỉ gỡ khỏi điều hướng)
  const centerTabs = [
    { to: '/foodlens', label: 'FoodLens', icon: UtensilsCrossed },
    { to: '/trust', label: 'An toàn AI', icon: ShieldCheck },
  ];

  // Mobile Bottom Tab Items
  const mobileTabs = [
    { to: '/foodlens', label: 'FoodLens', icon: UtensilsCrossed },
    { to: '/trust', label: 'An toàn', icon: ShieldCheck },
    { to: '/settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col selection:bg-brand-100 selection:text-brand-700 overflow-x-hidden">
      {/* Desktop Topbar (Slim & Refined) */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-ink/10 px-4 lg:px-8 py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* 1. Left: Brand Logo */}
          <NavLink to="/foodlens" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white shadow-btn-primary group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg text-ink tracking-tight block leading-none">
                FoodLens
              </span>
              <span className="text-[10px] font-bold text-brand-600 block mt-0.5">
                Chụp món ăn, biết ngay calo
              </span>
            </div>
          </NavLink>

          {/* 2. Center: Sliding Underline Navigation Tabs */}
          <nav 
            className="hidden md:flex items-center gap-1 bg-surface-2 p-1 rounded-full border border-ink/10 shadow-xs"
            role="navigation"
            aria-label="Thanh điều hướng chính"
          >
            {centerTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.to;

              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    'relative z-10 flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-heading font-bold rounded-full transition-colors min-h-[40px]',
                    isActive ? 'text-white' : 'text-ink-soft hover:text-ink'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>

                  {isActive && (
                    <motion.div
                      layoutId="desktop-active-nav-pill"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      className="absolute inset-0 z-[-1] rounded-full bg-brand-600 shadow-btn-primary"
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* 3. Right: Child Selector, Create CTA, Kid Mode & Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* FoodLens CTA Button (Primary Button, not a tab) */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/foodlens')}
              leftIcon={<Camera className="w-4 h-4" />}
              className="hidden sm:inline-flex"
            >
              Phân tích món
            </Button>

            {/* Account Profile Menu */}
            <div ref={accountDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="w-10 h-10 rounded-full bg-brand-100 border border-brand-400/30 flex items-center justify-center text-brand-700 font-heading font-extrabold text-sm shadow-xs hover:scale-105 transition-all cursor-pointer"
                aria-label="Tài khoản cá nhân"
              >
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'M'}
              </button>

              <AnimatePresence>
                {isAccountDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-surface border border-ink/10 rounded-2xl shadow-pop p-2 z-50 space-y-1"
                  >
                    <div className="px-3 py-2 border-b border-ink/10">
                      <div className="font-heading font-bold text-xs text-ink truncate">
                        {profile?.full_name || 'Bạn'}
                      </div>
                      <div className="text-[11px] text-ink-faint">
                        {profile?.role === 'admin' ? 'Quản trị viên' : 'Người dùng FoodLens'}
                      </div>
                    </div>

                    {profile?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-heading font-bold text-brand-600 hover:bg-brand-100 transition-colors cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Trang Quản trị AI</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-heading font-bold text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-ink-soft" />
                      <span>{vi.nav.settings}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-heading font-bold text-[#B42343] hover:bg-[#FFE3EA] transition-colors cursor-pointer border-t border-ink/10 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{vi.nav.logout}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-12">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (< 768px) with Safe-Area Inset */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-ink/10 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-pop flex items-center justify-around"
        role="navigation"
        aria-label="Điều hướng di động"
      >
        {mobileTabs.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center min-w-[48px] min-h-[48px] rounded-2xl transition-all cursor-pointer',
                isActive ? 'text-brand-600 scale-105' : 'text-ink-soft hover:text-ink'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-[10px] font-heading font-bold mt-1', isActive && 'text-brand-600')}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
