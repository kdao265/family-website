import React from 'react';
import {
  Users,
  UserRound,
  GitBranch,
  Images,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  families: number;
  members: number;
  moments: number;
  guestbook: number;
  pendingGuestbook: number;
}

export default function AdminDashboard() {
  const [stats, setStats] =
    useState<DashboardStats>({
      families: 0,
      members: 0,
      moments: 0,
      guestbook: 0,
      pendingGuestbook: 0,
    });

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);

    const [
      familiesResult,
      membersResult,
      momentsResult,
      guestbookResult,
      pendingGuestbookResult,
    ] = await Promise.all([
      supabase
        .from('families')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      supabase
        .from('family_members')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      supabase
        .from('moments')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      supabase
        .from('guestbook_messages')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      supabase
        .from('guestbook_messages')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('is_approved', false),
    ]);

    if (
      familiesResult.error ||
      membersResult.error ||
      momentsResult.error ||
      guestbookResult.error ||
      pendingGuestbookResult.error
    ) {
      console.error(
        'Load dashboard stats error:',
        {
          families: familiesResult.error,
          members: membersResult.error,
          moments: momentsResult.error,
          guestbook: guestbookResult.error,
          pendingGuestbook:
            pendingGuestbookResult.error,
        }
      );
    }

    setStats({
      families: familiesResult.count ?? 0,
      members: membersResult.count ?? 0,
      moments: momentsResult.count ?? 0,
      guestbook: guestbookResult.count ?? 0,
      pendingGuestbook:
        pendingGuestbookResult.count ?? 0,
    });

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <section className="px-6 md:px-10 py-8 border-b border-outline/10 bg-surface-container-low">
        <p className="font-label-md text-primary uppercase tracking-[0.15em]">
          Tổng quan
        </p>

        <h1 className="font-display-lg text-display-lg text-secondary mt-2">
          Gia đình
        </h1>

        <p className="font-body-lg text-on-surface-variant mt-3 max-w-2xl">
          Quản lý toàn bộ dữ liệu và nội dung của đại gia đình.
        </p>
      </section>

      {/* Statistics */}
      <section className="px-6 md:px-10 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Gia đình"
            value={stats.families}
            loading={loading}
          />

          <StatCard
            icon={<UserRound className="w-6 h-6" />}
            label="Thành viên"
            value={stats.members}
            loading={loading}
          />

          <StatCard
            icon={<Images className="w-6 h-6" />}
            label="Khoảnh khắc"
            value={stats.moments}
            loading={loading}
          />

          <StatCard
            icon={<MessageSquare className="w-6 h-6" />}
            label="Lời chúc"
            value={stats.guestbook}
            loading={loading}
          />
        </div>

        {/* Pending guestbook */}
        {stats.pendingGuestbook > 0 && (
          <Link
            to="/admin/guestbook"
            className="mt-5 flex items-center justify-between gap-5 bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4 hover:bg-primary/15 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>

              <div>
                <p className="font-label-md text-secondary">
                  Có {stats.pendingGuestbook} lời chúc đang chờ duyệt
                </p>

                <p className="font-body-md text-on-surface-variant text-sm mt-1">
                  Xem và duyệt những lời nhắn mới gửi tới gia đình.
                </p>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-primary shrink-0" />
          </Link>
        )}

        {/* Management */}
        <div className="mt-10">
          <div className="mb-5">
            <p className="font-label-md text-primary uppercase tracking-[0.15em]">
              Quản lý
            </p>

            <h2 className="font-headline-md text-xl text-secondary mt-2">
              Nội dung gia đình
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <DashboardCard
              icon={<Users className="w-6 h-6" />}
              title="Gia đình"
              description="Quản lý các gia đình nhỏ."
              path="/admin/families"
            />

            <DashboardCard
              icon={<UserRound className="w-6 h-6" />}
              title="Thành viên"
              description="Thêm và chỉnh sửa thành viên."
              path="/admin/members"
            />

            <DashboardCard
              icon={<GitBranch className="w-6 h-6" />}
              title="Quan hệ gia phả"
              description="Thiết lập quan hệ huyết thống và hôn phối."
              path="/admin/relationships"
            />

            <DashboardCard
              icon={<Images className="w-6 h-6" />}
              title="Khoảnh khắc"
              description="Quản lý ảnh kỷ niệm."
              path="/admin/moments"
            />

            <DashboardCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Lưu bút"
              description="Xem, duyệt và quản lý lời nhắn."
              path="/admin/guestbook"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: StatCardProps) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 p-6 family-card-shadow">
      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
        {icon}
      </div>

      <p className="font-body-md text-on-surface-variant text-sm">
        {label}
      </p>

      {loading ? (
        <div className="mt-2 w-12 h-9 bg-surface-container-low rounded-lg animate-pulse" />
      ) : (
        <p className="font-display-lg text-3xl text-secondary mt-1">
          {value}
        </p>
      )}
    </div>
  );
}

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
}

function DashboardCard({
  icon,
  title,
  description,
  path,
}: DashboardCardProps) {
  return (
    <Link
      to={path}
      className="group bg-surface-container-lowest rounded-2xl border border-outline/10 p-6 hover:-translate-y-1 hover:border-primary/20 transition-all family-card-shadow"
    >
      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
        {icon}
      </div>

      <h3 className="font-headline-md text-lg text-secondary">
        {title}
      </h3>

      <p className="font-body-md text-on-surface-variant mt-2 leading-relaxed">
        {description}
      </p>

      <div className="mt-5 inline-flex items-center gap-2 text-primary text-sm font-medium group-hover:gap-3 transition-all">
        Quản lý
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
