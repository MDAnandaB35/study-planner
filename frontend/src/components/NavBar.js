import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../api';

// User Icon for the profile dropdown
const UserIcon = () => (
  <img src="/profile.svg" alt="Roadmap icon" className="w-8 h-8" />
);

// Hamburger Menu Icon
const MenuIcon = () => (
  <img src="/menu.svg" alt="Roadmap icon" className="w-8 h-8" />
);


export default function NavBar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const onLogout = async () => {
    try {
      await api.logout();
    } finally {
      navigate('/', { replace: true });
    }
  };

  const activeLinkClass = 'bg-slate-700 text-white';
  const inactiveLinkClass = 'text-slate-300 hover:bg-slate-700 hover:text-white';
  const linkBaseClass = 'px-3 py-2 rounded-md text-sm font-medium transition-colors';

  const navLinkClassName = ({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`;

  return (
    <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side: Brand and Main Nav */}
          <div className="flex items-center">
            <Link to="/dashboard" className="text-slate-100 font-bold text-xl flex-shrink-0">
              QuickMap
            </Link>
            {/* Desktop Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink to="/dashboard" className={navLinkClassName}>My Plans</NavLink>
                <NavLink to="/public" className={navLinkClassName}>Public Plans</NavLink>
                <NavLink to="/bookmarks" className={navLinkClassName}>Bookmarked</NavLink>
              </div>
            </div>
          </div>

          {/* Right Side: Actions and Profile */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 gap-4">
              <Link to="/create" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Create Plan
              </Link>
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="max-w-xs bg-slate-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white p-1">
                    <span className="sr-only">Open user menu</span>
                    <UserIcon />
                  </button>
                </div>
                {isProfileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="bg-slate-800 inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white">
              <span className="sr-only">Open main menu</span>
              <MenuIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 space-y-1 sm:px-3 border-b border-t border-slate-700">
            <NavLink to="/dashboard" className={navLinkClassName + " block py-2 border-b border-slate-700"}>My Plans</NavLink>
            <NavLink to="/public" className={navLinkClassName + " block py-2 border-b border-slate-700"}>Public Plans</NavLink>
            <NavLink to="/bookmarks" className={navLinkClassName + " block py-2 border-b border-slate-700"}>Bookmarked</NavLink>
            <NavLink to="/create" className={navLinkClassName + " block py-2"}>Create Plan</NavLink>
          </div>
          <div className="pt-3 pb-3 border-t border-slate-700">
            <div className="mt-3 px-2 space-y-1">
              <button onClick={onLogout} className="block w-full text-left rounded-md px-2 py-2 text-base font-medium text-red-800 hover:text-white hover:bg-slate-700">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}