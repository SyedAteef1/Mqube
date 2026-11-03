import React, { useState } from 'react';
import { useActiveField } from '../../context/ActiveFieldContext.tsx';
import { useDrillDown } from '../drilldown/drilldown_store.tsx';
import { CompanySelector } from '../layout/CompanySelector.tsx';

interface GlobalHeaderProps {
  activeModuleTitle: string;
  activeModuleId: string;
  onNavigateHome: () => void;
  onNavigateBack?: () => void;
  canNavigateBack?: boolean;
  onToggleNavRail: () => void;
  isNavRailCollapsed: boolean;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onSelectModule?: (moduleId: string) => void;
  onLogout?: () => void;
  userRole?: string;
  userName?: string;
  storeName?: string;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  activeModuleTitle,
  activeModuleId,
  onNavigateHome,
  onNavigateBack,
  canNavigateBack = false,
  onToggleNavRail,
  isNavRailCollapsed,
  isFocusMode,
  onToggleFocusMode,
  onSelectModule,
  onLogout,
  userRole = 'System Admin',
  userName = 'Jawahar Mallah',
  storeName = 'Main Store (Branch 01)',
}) => {
  const { category: activeCategory, fieldLabel } = useActiveField();
  const { setSearchOpen } = useDrillDown();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // No live notification feed is wired up yet, so show none rather than sample messages.
  const notifications: { id: string; title: string; desc: string; time: string; type: string }[] = [];
  const unreadNotifications = notifications.length;
  const breadcrumbTitle =
    activeModuleId === 'dashboard' || activeModuleId === 'launchpad'
      ? 'Home'
      : activeModuleTitle && activeModuleTitle === activeModuleTitle.toUpperCase()
      ? activeModuleTitle.charAt(0) + activeModuleTitle.slice(1).toLowerCase()
      : activeModuleTitle;

  return (
    <header className="bg-white text-[#0a0a0a] h-13 px-3 flex items-center justify-between border-b border-[#e5e5e5] select-none shadow-sm z-30 relative">
      {/* Left Navigation & Brand Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleNavRail}
          title={isNavRailCollapsed ? 'Expand Navigation Rail' : 'Collapse Navigation Rail'}
          className="p-1.5 hover:bg-[#f5f5f5] rounded-md transition-colors text-[#0a0a0a]"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isNavRailCollapsed ? 'side_navigation' : 'menu_open'}
          </span>
        </button>

        {/* Brand Title */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2 px-2 py-1 hover:bg-[#f5f5f5] rounded-md transition-colors text-left"
        >
          <div className="w-7 h-7 bg-[#171717] text-white font-black text-xs flex items-center justify-center rounded-md tracking-tighter shadow-xs">
            M
          </div>
          <div className="hidden sm:block leading-none">
            <span className="font-bold text-sm tracking-wide block">MQube</span>
          </div>
        </button>

        {/* Separator */}
        <div className="h-4 w-px bg-[#e5e5e5] mx-1" />

        {/* Internal Shell Stack Navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onNavigateHome}
            title="Home"
            className="p-1.5 hover:bg-[#f5f5f5] rounded-md transition-colors text-[#737373] hover:text-[#0a0a0a]"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
          </button>
          {onSelectModule && (
            <button
              type="button"
              onClick={() => onSelectModule('dashboard')}
              title="Dashboard"
              aria-label="Dashboard"
              className="p-1.5 hover:bg-[#f5f5f5] rounded-md transition-colors text-[#737373] hover:text-[#0a0a0a]"
            >
              <span className="material-symbols-outlined text-[18px]">account_circle</span>
            </button>
          )}
          {canNavigateBack && onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              title="Go Back"
              className="p-1.5 hover:bg-[#f5f5f5] rounded-md transition-colors text-[#737373] hover:text-[#0a0a0a]"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
          )}
        </div>

        {/* Context & Breadcrumb Display */}
        <div className="hidden md:flex items-center text-[13px] ml-1 font-medium">
          <span className="text-[#0a0a0a] font-semibold truncate max-w-[220px]" title={storeName}>{breadcrumbTitle}</span>
        </div>
      </div>

      {/* Center search bar */}
      <div className="flex-1 max-w-md mx-4 relative hidden sm:block">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="w-full bg-[#f5f5f5] hover:bg-[#efefef] text-[#0a0a0a] text-[13px] rounded-full pl-9 pr-2 py-1.5 border border-transparent hover:border-[#e5e5e5] transition-all flex items-center justify-between gap-2 text-left group"
        >
          <span className="material-symbols-outlined absolute left-3 text-[#737373] group-hover:text-[#0a0a0a] text-[18px]">
            search
          </span>
          <span className="truncate text-[#737373] group-hover:text-[#0a0a0a]">
            {activeCategory === "product" ? `Search Products / Barcode (${fieldLabel})...` :
             activeCategory === "customer" ? `Search Customers / Mobile (${fieldLabel})...` :
             activeCategory === "supplier" ? `Search Suppliers (${fieldLabel})...` :
             activeCategory === "invoice" ? `Search Invoices (${fieldLabel})...` :
             "Search items, bills, customers…"}
          </span>
          <span className="text-[11px] bg-white px-1.5 py-0.5 rounded-md border border-[#e5e5e5] text-[#737373] shrink-0">
            Ctrl+K
          </span>
        </button>
      </div>

      {/* Right Controls (Full screen, Notifications, User Menu) */}
      <div className="flex items-center gap-1.5">
        <CompanySelector />

        {/* Focus Mode Toggle */}
        <button
          type="button"
          onClick={onToggleFocusMode}
          title={isFocusMode ? 'Exit full screen (F11)' : 'Full screen (F11)'}
          aria-label={isFocusMode ? 'Exit full screen' : 'Full screen'}
          className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs ${
            isFocusMode ? 'bg-[#abf4ac] text-[#002107] font-semibold' : 'hover:bg-[#f5f5f5] text-[#0a0a0a]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isFocusMode ? 'fullscreen_exit' : 'fullscreen'}
          </span>
        </button>

        {/* Notifications Drawer */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsUserMenuOpen(false);
            }}
            title="Notifications"
            aria-label="Notifications"
            className="p-1.5 hover:bg-[#f5f5f5] rounded-md transition-colors text-[#737373] hover:text-[#0a0a0a] relative"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 bg-[#ba1a1a] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#3b3b3b]">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-[#1a1a1a] rounded-xl shadow-xl border border-[#c6c6c6] py-2 z-50 overflow-hidden">
              <div className="px-4 py-2 border-b border-[#c6c6c6] flex items-center justify-between bg-[#f9f9f9]">
                <span className="font-semibold text-xs text-[#3b3b3b]">Notifications</span>
                {unreadNotifications > 0 && (
                  <span className="text-[10px] bg-[#f5f5f5] text-[#0a0a0a] px-2 py-0.5 rounded-full font-bold">
                    {unreadNotifications} new
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-[#737373]">No new notifications</div>
                )}
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-2.5 hover:bg-[#f4f4f4] border-b border-[#c6c6c6]/40 transition-colors">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#1a1a1a]">
                      <span>{n.title}</span>
                      <span className="text-[10px] font-normal text-[#777777]">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#474747] mt-0.5 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-1.5 bg-[#f9f9f9] text-center border-t border-[#c6c6c6]">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs font-medium text-[#3b3b3b] hover:underline"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Session Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-1.5 p-1 hover:bg-[#f5f5f5] rounded-md transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-[#e5e5e5] text-[#171717] font-semibold text-xs flex items-center justify-center shadow-xs">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:block leading-none pr-1">
              <span className="text-xs font-semibold block">{userName}</span>
              <span className="text-[9px] text-[#737373]">{userRole}</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-[#737373]">arrow_drop_down</span>
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white text-[#1a1a1a] rounded-xl shadow-xl border border-[#c6c6c6] py-2 z-50 overflow-hidden">
              <div className="px-4 py-3 bg-[#f9f9f9] border-b border-[#c6c6c6]">
                <div className="font-semibold text-sm text-[#3b3b3b]">{userName}</div>
                <div className="text-xs text-[#474747]">{userRole}</div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectModule) onSelectModule('user-profile');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#1a1a1a] hover:bg-[#f4f4f4] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#434343]">account_circle</span> My profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectModule) onSelectModule('menu-manager');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#1a1a1a] hover:bg-[#f4f4f4] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#414141]">compass_calibration</span> Menu settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectModule) onSelectModule('profiles');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#1a1a1a] hover:bg-[#f4f4f4] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#434343]">settings</span> Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectModule) onSelectModule('about-tileflow');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#1a1a1a] hover:bg-[#f4f4f4] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#434343]">info</span> About MQube
                </button>

                {onLogout && (
                  <div className="pt-1 mt-1 border-t border-[#c6c6c6]/50">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">logout</span> Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Header Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
            className="p-1.5 hover:bg-[#f5f5f5] rounded-md transition-colors text-[#0a0a0a] hover:text-[#e7000b] cursor-pointer ml-0.5"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        )}
      </div>
    </header>
  );
};
