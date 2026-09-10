import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Heart,
  Search,
  X,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';

interface Moment {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  is_favorite: boolean;
  created_at: string;
}

export default function Gallery() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Lightbox state
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadMoments() {
      setLoading(true);
      setErrorMessage('');

      const { data, error } = await supabase
        .from('moments')
        .select('id, title, description, image_url, category, is_favorite, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Load gallery moments error:', error);
        setErrorMessage('Không thể tải các khoảnh khắc.');
      } else {
        setMoments(data ?? []);
      }

      setLoading(false);
    }

    loadMoments();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    for (const moment of moments) {
      if (moment.category?.trim()) {
        uniqueCategories.add(moment.category.trim());
      }
    }
    return Array.from(uniqueCategories);
  }, [moments]);

  const filteredMoments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return moments.filter((moment) => {
      const matchesSearch =
        !query ||
        moment.title.toLowerCase().includes(query) ||
        moment.description?.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === 'Tất cả' || moment.category === selectedCategory;

      const matchesFavorite = !favoritesOnly || moment.is_favorite;

      return matchesSearch && matchesCategory && matchesFavorite;
    });
  }, [moments, searchQuery, selectedCategory, favoritesOnly]);

  // Keyboard navigation for Lightbox
  const handlePrev = useCallback(() => {
    setActivePhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const handleNext = useCallback(() => {
    setActivePhotoIndex((prev) =>
      prev !== null && prev < filteredMoments.length - 1 ? prev + 1 : prev
    );
  }, [filteredMoments.length]);

  const handleClose = useCallback(() => {
    setActivePhotoIndex(null);
  }, []);

  useEffect(() => {
    if (activePhotoIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, handleClose, handlePrev, handleNext]);

  const activeMoment =
    activePhotoIndex !== null ? filteredMoments[activePhotoIndex] : null;

  return (
    <div className="pt-[72px] bg-surface-container-lowest min-h-screen">
      {/* Header */}
      <section className="py-12 px-margin-mobile md:px-margin-desktop text-center border-b border-outline/10 bg-surface">
        <h1 className="font-display-lg text-display-lg text-secondary mb-4">
          Khoảnh Khắc
        </h1>

        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-8">
          Những khoảnh khắc được lưu giữ qua năm tháng, từ những ngày bình thường đến những dịp sum vầy đặc biệt của gia đình.
        </p>

        {/* Search */}
        <div className="flex justify-center mb-5">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm kiếm khoảnh khắc..."
              className="w-full bg-surface border border-outline/30 rounded-full py-3 pl-12 pr-4 font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('Tất cả');
              setFavoritesOnly(false);
            }}
            className={
              'flex-shrink-0 px-6 py-2.5 rounded-full font-label-md text-sm whitespace-nowrap transition-colors ' +
              (selectedCategory === 'Tất cả' && !favoritesOnly
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface text-on-surface-variant border border-outline/20 hover:bg-surface-variant')
            }
          >
            Tất cả ảnh
          </button>

          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSelectedCategory(category);
                setFavoritesOnly(false);
              }}
              className={
                'flex-shrink-0 px-5 py-2.5 rounded-full font-label-md text-sm whitespace-nowrap transition-colors ' +
                (selectedCategory === category && !favoritesOnly
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-on-surface-variant border border-outline/20 hover:bg-surface-variant')
              }
            >
              <Filter className="w-4 h-4 inline mr-1.5" />
              {category}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setFavoritesOnly((current) => !current);
              setSelectedCategory('Tất cả');
            }}
            className={
              'flex-shrink-0 px-5 py-2.5 rounded-full font-label-md text-sm whitespace-nowrap transition-colors flex items-center gap-2 ' +
              (favoritesOnly
                ? 'bg-primary text-on-primary'
                : 'bg-surface text-on-surface-variant border border-outline/20 hover:bg-surface-variant')
            }
          >
            <Heart className={'w-4 h-4 ' + (favoritesOnly ? 'fill-current' : '')} />
            Yêu thích
          </button>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-8 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        {loading ? (
          <div className="text-center py-16">
            <p className="font-body-md text-on-surface-variant">Đang tải khoảnh khắc...</p>
          </div>
        ) : errorMessage ? (
          <div className="text-center py-16">
            <p className="font-body-md text-primary">{errorMessage}</p>
          </div>
        ) : filteredMoments.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-body-md text-on-surface-variant">
              Không tìm thấy khoảnh khắc phù hợp.
            </p>
          </div>
        ) : (
          <div className="gallery-masonry">
            {filteredMoments.map((moment, index) => (
              <div
                key={moment.id}
                onClick={() => setActivePhotoIndex(index)}
                className="gallery-item group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                {moment.image_url ? (
                  <img
                    src={moment.image_url}
                    alt={moment.title}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="aspect-[4/3] flex items-center justify-center bg-surface-container-low">
                    <p className="font-body-md text-on-surface-variant">Chưa có ảnh</p>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-headline-md text-xl mb-1">
                      {moment.title}
                    </h3>

                    {moment.description && (
                      <p className="text-white/80 font-body-md text-sm mb-3 line-clamp-2">
                        {moment.description}
                      </p>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-white/80 font-body-md text-xs bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {moment.category || 'Gia đình'}
                      </span>

                      {moment.is_favorite && (
                        <div className="p-2 rounded-full backdrop-blur-sm bg-white/15 text-primary">
                          <Heart className="w-4 h-4 fill-current" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LIGHTBOX MODAL */}
      {activeMoment && activePhotoIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 select-none animate-fade-in-up"
          onClick={handleClose}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between text-white z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-label-md px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                {activeMoment.category || 'Khoảnh khắc'}
              </span>
              <span className="text-xs text-white/70">
                {activePhotoIndex + 1} / {filteredMoments.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Đóng"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Middle Image Area with Navigation */}
          <div
            className="relative flex-1 flex items-center justify-center my-2 max-h-[78vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev button */}
            {activePhotoIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 md:left-6 z-20 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm border border-white/15 transition-transform active:scale-95"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Image */}
            {activeMoment.image_url ? (
              <img
                src={activeMoment.image_url}
                alt={activeMoment.title}
                className="max-h-[75vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl"
              />
            ) : (
              <div className="w-80 h-60 rounded-2xl bg-white/10 flex items-center justify-center text-white/60">
                Không có ảnh
              </div>
            )}

            {/* Next button */}
            {activePhotoIndex < filteredMoments.length - 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 md:right-6 z-20 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm border border-white/15 transition-transform active:scale-95"
                aria-label="Ảnh sau"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Info Bar */}
          <div
            className="max-w-2xl mx-auto w-full text-center text-white bg-black/40 backdrop-blur-sm p-4 rounded-2xl border border-white/10 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline-md text-lg md:text-xl font-semibold mb-1">
              {activeMoment.title}
            </h3>
            {activeMoment.description && (
              <p className="font-body-md text-sm text-white/80 leading-relaxed max-w-xl mx-auto">
                {activeMoment.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
