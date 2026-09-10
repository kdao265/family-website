import { Heart, LockKeyhole } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-secondary text-on-secondary-container border-t border-primary/10">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <Heart className="w-6 h-6 fill-current text-primary-container" />
              <span className="font-display-lg text-headline-md font-bold">
                Love Family
              </span>
            </div>

            <p className="font-body-md text-on-secondary-container/80 max-w-md text-sm leading-relaxed">
              Một nơi nhỏ để gia đình lưu giữ những người mình yêu thương,
              những câu chuyện đã đi qua và những khoảnh khắc muốn nhớ mãi.
            </p>
          </div>

          {/* Slogan */}
          <div className="text-center md:text-right">
            <p className="font-headline-md text-lg mb-2">
              Một gia đình. Nhiều thế hệ. Một mái nhà.
            </p>
            <p className="font-body-md text-on-secondary-container/60 text-sm">
              Được xây dựng bằng trọn vẹn tình yêu và lòng biết ơn.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-on-secondary-container/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-secondary-container/60">
          <p>© 2026 Love Family. Dành tặng Bà Đào Thị Dỏn & Đại gia đình.</p>

          {/* Subtle admin link */}
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity hover:text-on-primary py-1 px-2 rounded"
            title="Dành cho người quản trị"
          >
            <LockKeyhole className="w-3.5 h-3.5" />
            <span>Quản trị viên</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
