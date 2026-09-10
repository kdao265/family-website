import { ArrowRight, CalendarDays, Heart, Images, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface FamilyMember {
  id: string;
  full_name: string;
  birth_date: string | null;
  hobbies: string[] | null;
  avatar_url: string | null;
}

interface Moment {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  is_favorite: boolean;
  created_at: string;
}

function formatDate(date: string | null) {
  if (!date) return 'Chưa cập nhật ngày sinh';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date + 'T00:00:00'));
}

function LoadingCard() {
  return <div className="animate-pulse rounded-2xl bg-surface-container-low p-5"><div className="mb-4 h-44 rounded-xl bg-surface-container" /><div className="mb-3 h-5 w-2/3 rounded bg-surface-container" /><div className="h-4 w-1/2 rounded bg-surface-container" /></div>;
}

export default function Home() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    async function loadHome() {
      setLoading(true);
      const [membersResult, momentsResult] = await Promise.all([
        supabase.from('family_members').select('id, full_name, birth_date, hobbies, avatar_url').order('created_at', { ascending: true }),
        supabase.from('moments').select('id, title, description, image_url, category, is_favorite, created_at').order('created_at', { ascending: false }),
      ]);
      setMembers(membersResult.data ?? []);
      setMoments(momentsResult.data ?? []);
      setLoadError(Boolean(membersResult.error || momentsResult.error));
      setLoading(false);
    }
    loadHome();
  }, []);

  const heroMoment = moments.find((moment) => moment.image_url) ?? null;
  const featuredMoments = moments.filter((moment) => moment.image_url).slice(0, 3);

  return (
    <main className="pt-[72px]">
      <section className="relative isolate overflow-hidden bg-secondary px-margin-mobile py-20 text-on-primary md:px-margin-desktop md:py-28">
        {heroMoment?.image_url && <img src={heroMoment.image_url} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/95 via-secondary/90 to-primary/80" />
        <div className="mx-auto grid max-w-container-max gap-10 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-on-primary/30 bg-on-primary/10 px-4 py-2 font-label-md text-sm"><Heart className="h-4 w-4 fill-current" /> Mừng sinh nhật bà Đào Thị Dỏn</p>
            <h1 className="max-w-3xl font-display-lg text-display-lg leading-tight">Một gia đình. Nhiều thế hệ. Một mái nhà.</h1>
            <p className="mt-6 max-w-2xl font-body-lg text-body-lg leading-relaxed text-on-primary/85">Nơi con cháu cùng lưu giữ những người thân yêu, những điều bình dị và những kỷ niệm muốn kể lại cho mai sau.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/guestbook" className="inline-flex items-center gap-2 rounded-full bg-on-primary px-6 py-3 font-label-md text-primary transition-transform hover:-translate-y-0.5">Xem lời chúc dành cho bà <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/family-tree" className="inline-flex items-center gap-2 rounded-full border border-on-primary/50 px-6 py-3 font-label-md text-on-primary hover:bg-on-primary/10">Khám phá gia phả</Link>
            </div>
          </div>
          <aside className="rounded-3xl border border-on-primary/25 bg-on-primary/10 p-7 backdrop-blur-sm">
            <p className="font-label-md text-sm tracking-wide text-on-primary/75">22 THÁNG 09</p>
            <h2 className="mt-2 font-headline-md text-headline-md">Một lời tri ân gửi tới bà</h2>
            <p className="mt-4 font-body-md leading-relaxed text-on-primary/85">Cảm ơn bà vì tình yêu, sự tần tảo và những điều bà đã vun đắp để chúng con có một mái nhà để trở về.</p>
            <Link to="/guestbook" className="mt-6 inline-flex items-center gap-2 font-label-md underline underline-offset-4">Gửi một lời chúc <ArrowRight className="h-4 w-4" /></Link>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div><p className="font-label-md text-sm text-primary">NHỮNG NGƯỜI THÂN YÊU</p><h2 className="mt-2 font-headline-lg text-headline-lg text-secondary">Mỗi người là một mảnh ghép</h2></div>
          <Link to="/family-tree" className="inline-flex items-center gap-2 font-label-md text-primary hover:underline">Xem gia phả <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {loadError && <div role="status" className="mb-6 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4 font-body-md text-on-surface">Một phần dữ liệu chưa tải được. Bạn có thể thử tải lại trang sau ít phút.</div>}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? Array.from({ length: 3 }, (_, index) => <LoadingCard key={index} />) : members.map((member) => (
            <article key={member.id} className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest family-card-shadow">
              {member.avatar_url ? <img src={member.avatar_url} alt={member.full_name} className="h-52 w-full object-cover" /> : <div className="flex h-52 items-center justify-center bg-surface-container-low text-primary"><Users className="h-12 w-12" /></div>}
              <div className="p-5"><h3 className="font-headline-md text-xl text-on-surface">{member.full_name}</h3><p className="mt-2 flex items-center gap-2 font-body-md text-sm text-on-surface-variant"><CalendarDays className="h-4 w-4 text-primary" />Sinh ngày {formatDate(member.birth_date)}</p><p className="mt-2 font-body-md text-sm text-on-surface-variant">{member.hobbies?.join(' · ') || 'Những niềm vui giản dị bên gia đình'}</p><button type="button" onClick={() => setSelectedMember(member)} className="mt-5 font-label-md text-primary hover:underline">Xem vài dòng kỷ niệm</button></div>
            </article>
          ))}
        </div>
        {!loading && members.length === 0 && <p className="rounded-2xl bg-surface-container-low p-6 font-body-md text-on-surface-variant">Thông tin thành viên sẽ được cập nhật trong thời gian tới.</p>}
      </section>

      <section className="border-y border-outline/10 bg-surface-container-low px-margin-mobile py-section-gap md:px-margin-desktop">
        <div className="mx-auto max-w-container-max"><div className="mb-10 flex items-end justify-between gap-4"><div><p className="font-label-md text-sm text-primary">KÝ ỨC</p><h2 className="mt-2 font-headline-lg text-headline-lg text-secondary">Khoảnh khắc đáng nhớ</h2></div><Link to="/moments" className="inline-flex items-center gap-2 font-label-md text-primary hover:underline">Xem tất cả <Images className="h-4 w-4" /></Link></div><div className="grid gap-6 md:grid-cols-3">{loading ? Array.from({ length: 3 }, (_, index) => <LoadingCard key={index} />) : featuredMoments.map((moment) => <Link key={moment.id} to="/moments" className="group overflow-hidden rounded-2xl bg-surface"><img src={moment.image_url ?? ''} alt={moment.title} className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105" /><div className="p-5"><p className="font-label-md text-sm text-primary">{moment.category || 'Kỷ niệm gia đình'}</p><h3 className="mt-1 font-headline-md text-xl text-on-surface">{moment.title}</h3></div></Link>)}</div>{!loading && featuredMoments.length === 0 && <p className="rounded-2xl bg-surface p-6 font-body-md text-on-surface-variant">Album ảnh đang chờ những khoảnh khắc đầu tiên của gia đình.</p>}</div>
      </section>

      <section className="mx-auto max-w-4xl px-margin-mobile py-section-gap text-center md:px-margin-desktop"><Heart className="mx-auto h-10 w-10 fill-primary text-primary" /><h2 className="mt-5 font-headline-lg text-headline-lg text-secondary">Gửi một lời đến gia đình</h2><p className="mx-auto mt-4 max-w-2xl font-body-lg text-on-surface-variant">Có những điều đôi khi thật khó nói thành lời. Hãy để lại một lời nhắn để bà và gia đình mình cùng gìn giữ.</p><Link to="/guestbook" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-label-md text-on-primary">Viết lời chúc <ArrowRight className="h-4 w-4" /></Link></section>

      {selectedMember && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/50 p-4" role="dialog" aria-modal="true" aria-label="Thông tin thành viên"><div className="relative w-full max-w-md rounded-3xl bg-surface p-7 shadow-2xl"><button type="button" onClick={() => setSelectedMember(null)} className="absolute right-4 top-4 rounded-full p-2 text-on-surface-variant hover:bg-surface-container" aria-label="Đóng"><X className="h-5 w-5" /></button>{selectedMember.avatar_url && <img src={selectedMember.avatar_url} alt={selectedMember.full_name} className="mb-5 h-48 w-full rounded-2xl object-cover" />}<p className="font-label-md text-sm text-primary">MỘT MẢNH GHÉP CỦA GIA ĐÌNH</p><h2 className="mt-1 font-headline-md text-2xl text-on-surface">{selectedMember.full_name}</h2><p className="mt-3 font-body-md text-on-surface-variant">Sinh ngày {formatDate(selectedMember.birth_date)}</p><p className="mt-3 font-body-md leading-relaxed text-on-surface-variant">Mỗi người đều góp vào mái nhà này bằng tình yêu, sự hiện diện và những kỷ niệm rất riêng. Phần lưu bút cá nhân sẽ được gia đình bổ sung theo thời gian.</p></div></div>}
    </main>
  );
}
