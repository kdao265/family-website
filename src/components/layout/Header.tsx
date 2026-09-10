import { Heart, Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Trang Chủ' },
  { path: '/family-tree', label: 'Gia Phả' },
  { path: '/story', label: 'Câu Chuyện' },
  { path: '/moments', label: 'Khoảnh Khắc' },
  { path: '/guestbook', label: 'Lưu Bút' },
];

export default function Header() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const getLinkClass = (path: string) =>
    location.pathname === path
      ? 'text-on-primary font-label-md text-label-md font-semibold border-b-2 border-on-primary pb-1'
      : 'text-on-primary/80 hover:text-on-primary transition-colors font-label-md text-label-md pb-1';

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="fixed top-0 z-50 flex h-[72px] w-full items-center bg-primary shadow-md">
      <div className="mx-auto flex w-full max-w-container-max items-center justify-between px-margin-mobile md:px-margin-desktop">
        {/* Logo */}
        <Link to="/" onClick={closeMenu} className="flex shrink-0 items-center gap-2.5 group">
          <Heart className="h-7 w-7 fill-on-primary text-on-primary transition-transform group-hover:scale-110" />
          <span className="font-display-lg text-2xl text-on-primary font-bold tracking-wide">
            Love Family
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={getLinkClass(item.path)}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg p-2 text-on-primary transition-colors hover:bg-on-primary/10 md:hidden"
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="absolute left-0 top-[72px] w-full border-t border-on-primary/15 bg-primary px-margin-mobile py-4 shadow-xl md:hidden">
          <div className="mx-auto flex max-w-container-max flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={
                  'rounded-xl px-4 py-3 font-label-md transition-colors ' +
                  (location.pathname === item.path
                    ? 'bg-on-primary/20 text-on-primary font-semibold'
                    : 'text-on-primary/80 hover:bg-on-primary/10 hover:text-on-primary')
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
