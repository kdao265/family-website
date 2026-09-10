import { Heart, LockKeyhole, Menu, X } from 'lucide-react';
import React, { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const navItems = [
  { path: '/', label: 'Trang Chủ' },
  { path: '/family-tree', label: 'Gia Phả' },
  { path: '/story', label: 'Câu Chuyện' },
  { path: '/moments', label: 'Khoảnh Khắc' },
  { path: '/guestbook', label: 'Lưu Bút' },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getLinkClass = (path: string) =>
    location.pathname === path
      ? 'text-on-primary font-label-md text-label-md'
      : 'text-on-primary/80 hover:text-on-primary transition-colors font-label-md text-label-md';

  const closeMenu = () => setMenuOpen(false);

  function openLogin() {
    setEmail('');
    setPassword('');
    setErrorMessage('');
    setLoginOpen(true);
  }

  function closeLogin() {
    if (!loading) {
      setLoginOpen(false);
      setErrorMessage('');
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setErrorMessage('Email hoặc mật khẩu không đúng.');
      return;
    }

    setLoginOpen(false);
    navigate('/admin');
  }

  return (
    <>
      <nav className="fixed top-0 z-50 flex h-[72px] w-full items-center bg-primary shadow-md">
        <div className="mx-auto flex w-full max-w-container-max items-center justify-between px-margin-mobile md:px-margin-desktop">
          <Link to="/" onClick={closeMenu} className="flex shrink-0 items-center gap-2 group">
            <Heart className="h-8 w-8 fill-on-primary text-on-primary transition-transform group-hover:scale-110" />
            <span className="font-display-lg text-headline-md text-on-primary">Love Family</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={getLinkClass(item.path)}>
                {item.label}
              </Link>
            ))}
            <button type="button" onClick={openLogin} className="flex items-center gap-2 rounded-full border border-on-primary/30 px-4 py-2 font-label-md text-on-primary transition-colors hover:bg-on-primary/10">
              <LockKeyhole className="h-4 w-4" />
              Đăng nhập
            </button>
          </div>

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

        {menuOpen && (
          <div className="absolute left-0 top-[72px] w-full border-t border-on-primary/15 bg-primary px-margin-mobile py-4 shadow-xl md:hidden">
            <div className="mx-auto flex max-w-container-max flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 font-label-md text-on-primary transition-colors hover:bg-on-primary/10"
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => { closeMenu(); openLogin(); }}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-on-primary/30 px-4 py-3 font-label-md text-on-primary"
              >
                <LockKeyhole className="h-4 w-4" />
                Đăng nhập
              </button>
            </div>
          </div>
        )}
      </nav>

      {loginOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/50 p-4" role="dialog" aria-modal="true" aria-label="Đăng nhập quản trị">
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="font-label-md text-sm text-primary">Khu vực quản trị</p>
                <h2 className="font-headline-md text-headline-md text-on-surface">Đăng nhập</h2>
              </div>
              <button type="button" onClick={closeLogin} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container" aria-label="Đóng">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-5" onSubmit={handleLogin}>
              <label className="block">
                <span className="mb-2 block font-label-md text-sm text-secondary">Email</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="admin@example.com" className="w-full rounded-2xl border border-outline/30 bg-surface px-4 py-3 font-body-md text-on-surface focus:border-primary focus:outline-none" />
              </label>
              <label className="block">
                <span className="mb-2 block font-label-md text-sm text-secondary">Mật khẩu</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className="w-full rounded-2xl border border-outline/30 bg-surface px-4 py-3 font-body-md text-on-surface focus:border-primary focus:outline-none" />
              </label>
              {errorMessage && <p className="rounded-2xl bg-primary/10 px-4 py-3 font-body-md text-sm text-primary">{errorMessage}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3.5 font-label-md text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60">
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
