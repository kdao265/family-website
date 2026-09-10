import {
  Heart,
  MessageSquare,
  Quote,
  Send,
} from 'lucide-react';
import React, {
  FormEvent,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';

interface Member {
  id: string;
  full_name: string;
}

interface GuestbookMessage {
  id: string;
  sender_name: string;
  recipient_id: string | null;
  recipient_name: string | null;
  message: string;
  is_approved: boolean;
  created_at: string;
}

const RECIPIENT_GRANDMOTHER = 'RECIPIENT_GRANDMOTHER';
const RECIPIENT_ALL_FAMILY = 'RECIPIENT_ALL_FAMILY';

export default function Guestbook() {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [senderName, setSenderName] = useState('');
  const [recipientOption, setRecipientOption] = useState(RECIPIENT_GRANDMOTHER);
  const [message, setMessage] = useState('');

  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [sending, setSending] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadGuestbook();
  }, []);

  async function loadGuestbook() {
    setLoadingMessages(true);
    setLoadingMembers(true);
    setErrorMessage('');

    const [messagesResult, membersResult] = await Promise.all([
      supabase
        .from('guestbook_messages')
        .select('id, sender_name, recipient_id, recipient_name, message, is_approved, created_at')
        .eq('is_approved', true)
        .order('created_at', { ascending: false }),

      supabase
        .from('family_members')
        .select('id, full_name')
        .order('full_name', { ascending: true }),
    ]);

    if (messagesResult.error) {
      console.error('Load guestbook messages error:', messagesResult.error);
      setErrorMessage('Không thể tải những lời chúc.');
    } else {
      setMessages(messagesResult.data ?? []);
    }

    if (membersResult.error) {
      console.error('Load guestbook members error:', membersResult.error);
      setErrorMessage('Không thể tải danh sách thành viên.');
    } else {
      setMembers(membersResult.data ?? []);
    }

    setLoadingMessages(false);
    setLoadingMembers(false);
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    const trimmedSender = senderName.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSender) {
      setErrorMessage('Vui lòng nhập tên của bạn.');
      return;
    }

    if (!trimmedMessage) {
      setErrorMessage('Vui lòng nhập lời chúc.');
      return;
    }

    if (trimmedMessage.length < 5) {
      setErrorMessage('Lời chúc cần có ít nhất 5 ký tự.');
      return;
    }

    setSending(true);

    try {
      let recipientId = null;
      let recipientName = 'Bà Đào Thị Dỏn';

      if (recipientOption === RECIPIENT_GRANDMOTHER) {
        const gran = members.find((m) => m.full_name.toLowerCase().includes('dỏn'));
        recipientId = gran ? gran.id : null;
        recipientName = 'Bà Đào Thị Dỏn';
      } else if (recipientOption === RECIPIENT_ALL_FAMILY) {
        recipientId = null;
        recipientName = 'Cả gia đình';
      } else {
        const target = members.find((m) => m.id === recipientOption);
        recipientId = target ? target.id : null;
        recipientName = target ? target.full_name : 'Người thân';
      }

      // Đặt is_approved: true để lời chúc xuất hiện ngay trong buổi tiệc
      const { error } = await supabase.from('guestbook_messages').insert({
        sender_name: trimmedSender,
        recipient_id: recipientId,
        recipient_name: recipientName,
        message: trimmedMessage,
        is_approved: true,
      });

      if (error) {
        console.error('Send guestbook message error:', error);
        throw new Error('Không thể gửi lời chúc. Vui lòng thử lại.');
      }

      setSenderName('');
      setMessage('');
      setRecipientOption(RECIPIENT_GRANDMOTHER);

      setSuccessMessage('Lời chúc của bạn đã được gửi và hiển thị trong lưu bút ❤️');

      await loadGuestbook();
    } catch (error) {
      console.error('Guestbook submit error:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Không thể gửi lời chúc.'
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pt-[72px]">
      {/* Page Header */}
      <section className="py-14 px-margin-mobile md:px-margin-desktop text-center border-b border-outline/10 bg-surface">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 font-label-md text-xs text-primary mb-4">
          <Heart className="w-3.5 h-3.5 fill-current" /> Mừng thọ & Tri ân Bà Đào Thị Dỏn
        </span>

        <h1 className="font-display-lg text-display-lg text-secondary mb-4">
          Lưu bút yêu thương
        </h1>

        <div className="w-16 h-1 bg-primary/30 mx-auto rounded-full mb-6" />

        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          Nơi con cháu, người thân gửi gắm những lời chúc tốt đẹp nhất mừng tuổi mới của Bà và vun đắp tình cảm gia đình.
        </p>
      </section>

      {/* Guestbook Content */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Messages List */}
          <div className="lg:col-span-2 space-y-6 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingMessages ? (
              <div className="text-center py-16">
                <p className="font-body-md text-on-surface-variant">Đang tải lời chúc...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="bg-surface-container-low p-10 rounded-3xl border border-outline/10 text-center">
                <MessageSquare className="w-10 h-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-headline-md text-xl text-secondary mb-2">
                  Chưa có lời chúc nào
                </h3>
                <p className="font-body-md text-on-surface-variant">
                  Hãy là người đầu tiên gửi lời chúc mừng sinh nhật cho Bà và đại gia đình!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isForGrandmother =
                  msg.recipient_name &&
                  (msg.recipient_name.toLowerCase().includes('bà') ||
                    msg.recipient_name.toLowerCase().includes('dỏn'));

                return (
                  <div
                    key={msg.id}
                    className="bg-surface-container-lowest p-6 rounded-2xl border border-outline/10 family-card-shadow flex gap-4 transition-all hover:border-primary/20"
                  >
                    <div className="shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display-lg text-xl font-semibold">
                        {msg.sender_name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                        <h4 className="font-label-md text-base text-on-surface font-semibold">
                          {msg.sender_name}
                        </h4>
                        <span className="text-xs text-on-surface-variant/70">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>

                      {msg.recipient_name && (
                        <div className="mb-3">
                          <span
                            className={
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ' +
                              (isForGrandmother
                                ? 'bg-primary/15 text-primary border border-primary/20'
                                : 'bg-surface-container-low text-secondary')
                            }
                          >
                            {isForGrandmother && <Heart className="w-3 h-3 fill-current" />}
                            Gửi {msg.recipient_name}
                          </span>
                        </div>
                      )}

                      <p className="font-body-md text-on-surface-variant italic relative pl-4 leading-relaxed">
                        <Quote className="absolute -left-1 -top-2 w-4 h-4 text-outline/30 rotate-180" />
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Form Write Wish */}
          <div className="bg-surface-container-low p-8 rounded-3xl border border-outline/10 h-fit sticky top-[100px] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-headline-md text-xl text-on-surface">Viết lời chúc</h2>
                <p className="font-body-md text-xs text-on-surface-variant">Gửi tình cảm tới người thân yêu</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sender Name */}
              <div>
                <label className="block font-label-md text-xs uppercase tracking-wider text-secondary mb-2">
                  Tên của bạn
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Ví dụ: Cháu Khánh, Bác Hoà, ..."
                  maxLength={100}
                  required
                  className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body-md text-sm text-on-surface"
                />
              </div>

              {/* Recipient */}
              <div>
                <label className="block font-label-md text-xs uppercase tracking-wider text-secondary mb-2">
                  Gửi đến
                </label>
                <select
                  value={recipientOption}
                  onChange={(e) => setRecipientOption(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body-md text-sm text-on-surface"
                >
                  <option value={RECIPIENT_GRANDMOTHER}>
                    🌹 Bà Đào Thị Dỏn (Mừng sinh nhật Bà)
                  </option>
                  <option value={RECIPIENT_ALL_FAMILY}>
                    🏡 Cả gia đình
                  </option>
                  {members
                    .filter((m) => !m.full_name.toLowerCase().includes('dỏn'))
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        👤 {member.full_name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block font-label-md text-xs uppercase tracking-wider text-secondary mb-2">
                  Lời chúc yêu thương
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Viết những lời chân thành gửi tới Bà và gia đình..."
                  maxLength={1000}
                  required
                  className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body-md text-sm text-on-surface min-h-[120px] resize-none"
                />
                <p className="text-right text-xs text-on-surface-variant/60 mt-1">
                  {message.length}/1000
                </p>
              </div>

              {/* Success */}
              {successMessage && (
                <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
                  <p className="font-body-md text-xs text-primary">{successMessage}</p>
                </div>
              )}

              {/* Error */}
              {errorMessage && (
                <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
                  <p className="font-body-md text-xs text-primary">{errorMessage}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-label-md text-sm hover:bg-primary-container transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? 'Đang gửi lời chúc...' : 'Gửi lời chúc'}
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
