import React from 'react';
import { Plus, X, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Family {
  id: string;
  name: string;
}

interface FamilyMember {
  id: string;
  family_id: string;
  full_name: string;
  birth_date: string | null;
  relation_title: string | null;
  short_bio: string | null;
  hobbies: string[] | null;
  avatar_url: string | null;
}

export default function Members() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] =
    useState<FamilyMember | null>(null);

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [relationTitle, setRelationTitle] = useState('');
  const [shortBio, setShortBio] = useState('');
  const [hobbies, setHobbies] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function loadData() {
    setLoading(true);
    setErrorMessage('');

    const [membersResult, familiesResult] = await Promise.all([
      supabase
        .from('family_members')
        .select(
          'id, family_id, full_name, birth_date, relation_title, short_bio, hobbies, avatar_url'
        )
        .order('created_at', { ascending: true }),

      supabase
        .from('families')
        .select('id, name')
        .order('created_at', { ascending: true }),
    ]);

    if (membersResult.error) {
      console.error('Load members error:', membersResult.error);
      setErrorMessage('Không thể tải danh sách thành viên.');
    }

    if (familiesResult.error) {
      console.error('Load families error:', familiesResult.error);
      setErrorMessage('Không thể tải danh sách gia đình.');
    }

    setMembers(membersResult.data ?? []);
    setFamilies(familiesResult.data ?? []);

    setLoading(false);
  }

  function openAddModal() {
    setEditingMember(null);
  
    setFullName('');
    setBirthDate('');
    setFamilyId(families[0]?.id ?? '');
    setRelationTitle('');
    setShortBio('');
    setHobbies('');
  
    setSelectedFile(null);
  
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  
    setPreviewUrl('');
    setErrorMessage('');
    setIsModalOpen(true);
  }
  
  function openEditModal(member: FamilyMember) {
    setEditingMember(member);
  
    setFullName(member.full_name);
    setBirthDate(member.birth_date ?? '');
    setFamilyId(member.family_id);
    setRelationTitle(member.relation_title ?? '');
    setShortBio(member.short_bio ?? '');
    setHobbies((member.hobbies ?? []).join(', '));
  
    setSelectedFile(null);
  
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  
    setPreviewUrl(member.avatar_url ?? '');
    setErrorMessage('');
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
  
    setIsModalOpen(false);
    setEditingMember(null);
    setErrorMessage('');
    setSelectedFile(null);
  
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  
    setPreviewUrl('');
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn một file ảnh.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrorMessage('Ảnh không được lớn hơn 5MB.');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadAvatar(file: File, memberId: string) {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

    const filePath = `members/${memberId}-${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from('family-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload avatar error:', uploadError);
      throw new Error('Không thể tải ảnh lên.');
    }

    const { data } = supabase.storage
      .from('family-avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
  
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên.');
      return;
    }
  
    if (!familyId) {
      setErrorMessage('Vui lòng chọn gia đình.');
      return;
    }
  
    setSaving(true);
    setErrorMessage('');
  
    try {
      const hobbiesArray = hobbies
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
  
      /*
       * =========================
       * CHỈNH SỬA
       * =========================
       */
      if (editingMember) {
        let avatarUrl = editingMember.avatar_url;
        let uploadedFilePath: string | null = null;
      
        /*
         * Nếu admin chọn ảnh mới,
         * upload ảnh mới trước.
         */
        if (selectedFile) {
          const fileExtension =
            selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      
          uploadedFilePath = `members/${editingMember.id}-${Date.now()}.${fileExtension}`;
      
          const { error: uploadError } = await supabase.storage
            .from('family-avatars')
            .upload(uploadedFilePath, selectedFile, {
              cacheControl: '3600',
              upsert: false,
              contentType: selectedFile.type,
            });
      
          if (uploadError) {
            console.error(
              'Upload avatar error:',
              uploadError
            );
      
            throw new Error('Không thể tải ảnh lên.');
          }
      
          const { data: publicUrlData } =
            supabase.storage
              .from('family-avatars')
              .getPublicUrl(uploadedFilePath);
      
          avatarUrl = publicUrlData.publicUrl;
        }
      
        /*
         * Cập nhật thông tin member.
         */
        const { error: updateError } = await supabase
          .from('family_members')
          .update({
            family_id: familyId,
            full_name: fullName.trim(),
            birth_date: birthDate || null,
            relation_title:
              relationTitle.trim() || null,
            short_bio: shortBio.trim() || null,
            hobbies: hobbiesArray,
            avatar_url: avatarUrl,
          })
          .eq('id', editingMember.id);
      
        /*
         * Nếu DB update thất bại nhưng ảnh mới đã upload,
         * xóa ảnh mới để tránh tạo file rác.
         */
        if (updateError) {
          if (uploadedFilePath) {
            const { error: cleanupError } =
              await supabase.storage
                .from('family-avatars')
                .remove([uploadedFilePath]);
      
            if (cleanupError) {
              console.error(
                'Cleanup uploaded avatar error:',
                cleanupError
              );
            }
          }
      
          console.error(
            'Update member error:',
            updateError
          );
      
          throw new Error(
            'Không thể cập nhật thành viên.'
          );
        }
      
        /*
         * Sau khi DB đã cập nhật thành công,
         * xóa ảnh cũ khỏi Storage nếu có.
         */
        if (
          selectedFile &&
          editingMember.avatar_url
        ) {
          try {
            const marker =
              '/storage/v1/object/public/family-avatars/';
      
            const markerIndex =
              editingMember.avatar_url.indexOf(marker);
      
            if (markerIndex !== -1) {
              const oldFilePath =
                editingMember.avatar_url.substring(
                  markerIndex + marker.length
                );
      
              const { error: deleteOldError } =
                await supabase.storage
                  .from('family-avatars')
                  .remove([oldFilePath]);
      
              if (deleteOldError) {
                console.error(
                  'Delete old avatar error:',
                  deleteOldError
                );
              }
            }
          } catch (error) {
            console.error(
              'Delete old avatar exception:',
              error
            );
          }
        }
      
        await loadData();
      
        setSaving(false);
        closeModal();
        return;
      }
  
      /*
       * =========================
       * THÊM MỚI
       * =========================
       */
      const { data: newMember, error: insertError } =
        await supabase
          .from('family_members')
          .insert({
            family_id: familyId,
            full_name: fullName.trim(),
            birth_date: birthDate || null,
            relation_title:
              relationTitle.trim() || null,
            short_bio: shortBio.trim() || null,
            hobbies: hobbiesArray,
            avatar_url: null,
          })
          .select('id')
          .single();
  
      if (insertError || !newMember) {
        console.error(
          'Insert member error:',
          insertError
        );
  
        throw new Error(
          'Không thể thêm thành viên.'
        );
      }
  
      if (selectedFile) {
        const avatarUrl = await uploadAvatar(
          selectedFile,
          newMember.id
        );
  
        const { error: updateError } =
          await supabase
            .from('family_members')
            .update({
              avatar_url: avatarUrl,
            })
            .eq('id', newMember.id);
  
        if (updateError) {
          console.error(
            'Update avatar URL error:',
            updateError
          );
  
          throw new Error(
            'Đã tạo thành viên nhưng không thể lưu ảnh.'
          );
        }
      }
  
      await loadData();
  
      setSaving(false);
      closeModal();
    } catch (error) {
      console.error(
        'Save member error:',
        error
      );
  
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể lưu thành viên.'
      );
  
      setSaving(false);
    }
  }

  async function handleDelete(member: FamilyMember) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa "${member.full_name}"?\n\nCác quan hệ gia phả liên quan đến thành viên này cũng có thể bị xóa theo.`,
    );
  
    if (!confirmed) {
      return;
    }
  
    setErrorMessage('');
  
    /*
     * Nếu có ảnh:
     * cố gắng xóa ảnh khỏi Storage trước.
     */
    if (member.avatar_url) {
      try {
        const marker =
          '/storage/v1/object/public/family-avatars/';
  
        const markerIndex =
          member.avatar_url.indexOf(marker);
  
        if (markerIndex !== -1) {
          const filePath =
            member.avatar_url.substring(
              markerIndex + marker.length
            );
  
          const { error: storageError } =
            await supabase.storage
              .from('family-avatars')
              .remove([filePath]);
  
          if (storageError) {
            console.error(
              'Delete avatar error:',
              storageError
            );
          }
        }
      } catch (error) {
        console.error(
          'Delete avatar exception:',
          error
        );
      }
    }
  
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', member.id);
  
    if (error) {
      console.error(
        'Delete member error:',
        error
      );
  
      setErrorMessage(
        'Không thể xóa thành viên.'
      );
  
      return;
    }
  
    await loadData();
  }

  function getFamilyName(id: string) {
    return (
      families.find((family) => family.id === id)?.name ??
      'Không xác định'
    );
  }

  return (
    <div className="pt-[72px] min-h-screen bg-surface">
      {/* Header */}
      <section className="py-14 px-margin-mobile md:px-margin-desktop bg-surface-container-low border-b border-outline/10">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="font-label-md text-primary uppercase tracking-[0.15em]">
              Quản trị
            </p>

            <h1 className="font-display-lg text-display-lg text-secondary mt-3">
              Thành viên
            </h1>

            <p className="font-body-lg text-on-surface-variant max-w-2xl mt-4">
              Thêm và quản lý thành viên của đại gia đình.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            disabled={families.length === 0}
            className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full font-label-md hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Thêm thành viên
          </button>
        </div>
      </section>

      {/* Content */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto">
          {errorMessage && !isModalOpen && (
            <div className="mb-6 rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3">
              <p className="font-body-md text-sm text-primary">
                {errorMessage}
              </p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <p className="font-body-md text-on-surface-variant">
                Đang tải...
              </p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low rounded-3xl border border-outline/10">
              <h2 className="font-headline-md text-xl text-secondary mb-2">
                Chưa có thành viên nào
              </h2>

              <p className="font-body-md text-on-surface-variant mb-6">
                Hãy thêm thành viên đầu tiên cho gia đình.
              </p>

              {families.length > 0 && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 text-primary font-label-md"
                >
                  <Plus className="w-5 h-5" />
                  Thêm thành viên đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {members.map((member) => (
                <article
                  key={member.id}
                  className="bg-surface-container-lowest rounded-3xl border border-outline/10 overflow-hidden family-card-shadow"
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name}
                      className="w-full h-52 object-cover"
                    />
                  ) : (
                    <div className="w-full h-52 bg-surface-container-low flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-primary/30" />
                    </div>
                  )}

                  <div className="p-6">
                    <p className="font-label-md text-primary text-sm mb-2">
                      {getFamilyName(member.family_id)}
                    </p>

                    <h2 className="font-headline-md text-xl text-secondary">
                      {member.full_name}
                    </h2>

                    {member.relation_title && (
                      <p className="font-body-md text-primary mt-2">
                        {member.relation_title}
                      </p>
                    )}

                    {member.short_bio && (
                      <p className="font-body-md text-on-surface-variant mt-3">
                        {member.short_bio}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-6 pt-5 border-t border-outline/10">
                    <button
                      type="button"
                      onClick={() => openEditModal(member)}
                      className="inline-flex items-center gap-2 text-primary font-label-md"
                    >
                      ✏️
                      Sửa
                    </button>
                  
                    <button
                      type="button"
                      onClick={() => handleDelete(member)}
                      className="inline-flex items-center gap-2 text-secondary font-label-md hover:text-primary transition-colors"
                    >
                      🗑️
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-on-surface/40 backdrop-blur-sm flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="w-full max-w-2xl bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline/10 p-6 md:p-8 my-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-label-md text-primary uppercase tracking-[0.15em] mb-2">
                  Thành viên mới
                </p>

                <h2 className="font-headline-lg text-headline-lg text-secondary">
                  Thêm thành viên
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Họ tên */}
              <div>
                <label className="block font-label-md text-sm text-secondary mb-2">
                  Họ và tên
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Nguyễn Văn A"
                  required
                  className="w-full bg-surface border border-outline/30 rounded-2xl px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Ngày sinh + gia đình */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block font-label-md text-sm text-secondary mb-2">
                    Ngày sinh
                  </label>

                  <input
                    type="date"
                    value={birthDate}
                    onChange={(event) =>
                      setBirthDate(event.target.value)
                    }
                    className="w-full bg-surface border border-outline/30 rounded-2xl px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-label-md text-sm text-secondary mb-2">
                    Thuộc gia đình
                  </label>

                  <select
                    value={familyId}
                    onChange={(event) =>
                      setFamilyId(event.target.value)
                    }
                    required
                    className="w-full bg-surface border border-outline/30 rounded-2xl px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Chọn gia đình</option>

                    {families.map((family) => (
                      <option key={family.id} value={family.id}>
                        {family.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tiêu đề */}
              <div>
                <label className="block font-label-md text-sm text-secondary mb-2">
                  Tiêu đề dưới tên
                </label>

                <input
                  type="text"
                  value={relationTitle}
                  onChange={(event) =>
                    setRelationTitle(event.target.value)
                  }
                  placeholder="Ví dụ: Người giữ lửa"
                  className="w-full bg-surface border border-outline/30 rounded-2xl px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Giới thiệu */}
              <div>
                <label className="block font-label-md text-sm text-secondary mb-2">
                  Giới thiệu
                </label>

                <textarea
                  value={shortBio}
                  onChange={(event) =>
                    setShortBio(event.target.value)
                  }
                  rows={4}
                  placeholder="Một vài dòng giới thiệu về thành viên..."
                  className="w-full bg-surface border border-outline/30 rounded-2xl px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Sở thích */}
              <div>
                <label className="block font-label-md text-sm text-secondary mb-2">
                  Sở thích
                </label>

                <input
                  type="text"
                  value={hobbies}
                  onChange={(event) =>
                    setHobbies(event.target.value)
                  }
                  placeholder="Nấu ăn, đọc sách, trồng cây"
                  className="w-full bg-surface border border-outline/30 rounded-2xl px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />

                <p className="font-body-md text-xs text-on-surface-variant mt-2">
                  Ngăn cách các sở thích bằng dấu phẩy.
                </p>
              </div>

              {/* Ảnh */}
              <div>
                <label className="block font-label-md text-sm text-secondary mb-2">
                  Ảnh đại diện
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-outline/30 rounded-2xl px-6 py-8 hover:border-primary/40 hover:bg-surface-container-low transition-colors"
                >
                  {previewUrl ? (
                    <div className="flex flex-col items-center gap-4">
                      <img
                        src={previewUrl}
                        alt="Ảnh xem trước"
                        className="w-32 h-32 rounded-2xl object-cover"
                      />

                      <div className="flex items-center gap-2 text-primary font-label-md">
                        <Upload className="w-4 h-4" />
                        Đổi ảnh
                      </div>

                      <p className="font-body-md text-xs text-on-surface-variant">
                        {selectedFile?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-primary" />
                      </div>

                      <p className="font-label-md text-secondary">
                        Chọn ảnh từ máy
                      </p>

                      <p className="font-body-md text-xs text-on-surface-variant">
                        JPG, PNG, WEBP — tối đa 5MB
                      </p>
                    </div>
                  )}
                </button>
              </div>

              {/* Error */}
              {errorMessage && (
                <div className="rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3">
                  <p className="font-body-md text-sm text-primary">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 px-5 py-3 rounded-full border border-outline/30 text-secondary font-label-md hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving || families.length === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-full font-label-md hover:bg-primary-container transition-colors disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : 'Lưu thành viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
