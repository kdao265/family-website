import { Heart } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import FamilyTreeBranch from '../components/family/FamilyTreeBranch';
import { supabase } from '../lib/supabase';

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

interface FamilyRelationship {
  id: string;
  parent_id: string;
  child_id: string;
}

interface FamilyCouple {
  id: string;
  person1_id: string;
  person2_id: string;
}

interface DisplayMember {
  id: string;
  name: string;
  birthDate: string;
  hobbies: string[];
  imageUrl: string;
  imageAlt: string;
  relation?: string;
  shortBio?: string;
}

export default function FamilyTree() {
  const [members, setMembers] = useState<DisplayMember[]>([]);
  const [relationships, setRelationships] = useState<
    FamilyRelationship[]
  >([]);
  const [couples, setCouples] = useState<FamilyCouple[]>([]);

  const [selectedMemberId, setSelectedMemberId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [zoom, setZoom] = useState(1);

  const [pan, setPan] = useState({
    x: 0,
    y: 0,
  });

  const [isDragging, setIsDragging] = useState(false);

  const [collapsedFamilyIds, setCollapsedFamilyIds] =
    useState<Set<string>>(new Set());

  const dragStart = useRef({
    x: 0,
    y: 0,
  });

  const panStart = useRef({
    x: 0,
    y: 0,
  });

  const canvasRef =
    useRef<HTMLDivElement | null>(null);

  const treeRef =
    useRef<HTMLDivElement | null>(null);

  /* =========================================================
     LOAD FAMILY TREE DATA
     ========================================================= */

  useEffect(() => {
    async function loadFamilyTree() {
      setLoading(true);
      setErrorMessage('');

      const [
        membersResult,
        relationshipsResult,
        couplesResult,
      ] = await Promise.all([
        supabase
          .from('family_members')
          .select(
            'id, family_id, full_name, birth_date, relation_title, short_bio, hobbies, avatar_url'
          )
          .order('created_at', {
            ascending: true,
          }),

        supabase
          .from('family_relationships')
          .select(
            'id, parent_id, child_id'
          )
          .order('created_at', {
            ascending: true,
          }),

        supabase
          .from('family_couples')
          .select(
            'id, person1_id, person2_id'
          )
          .order('created_at', {
            ascending: true,
          }),
      ]);

      if (membersResult.error) {
        console.error(
          'Load family members error:',
          membersResult.error
        );

        setErrorMessage(
          'Không thể tải dữ liệu thành viên.'
        );

        setLoading(false);
        return;
      }

      if (relationshipsResult.error) {
        console.error(
          'Load family relationships error:',
          relationshipsResult.error
        );

        setErrorMessage(
          'Không thể tải dữ liệu gia phả.'
        );

        setLoading(false);
        return;
      }

      if (couplesResult.error) {
        console.error(
          'Load family couples error:',
          couplesResult.error
        );

        setErrorMessage(
          'Không thể tải quan hệ vợ chồng.'
        );

        setLoading(false);
        return;
      }

      const mappedMembers: DisplayMember[] = (
        membersResult.data ?? []
      ).map(
        (member: FamilyMember) => ({
          id: member.id,
          name: member.full_name,
          birthDate:
            member.birth_date ??
            'Chưa cập nhật',
          hobbies: member.hobbies ?? [],
          imageUrl:
            member.avatar_url ||
            'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
          imageAlt: member.full_name,
          relation:
            member.relation_title ??
            undefined,
          shortBio:
            member.short_bio ??
            undefined,
        })
      );

      setMembers(mappedMembers);
      setRelationships(
        relationshipsResult.data ?? []
      );
      setCouples(
        couplesResult.data ?? []
      );
      setLoading(false);
    }

    loadFamilyTree();
  }, []);

  /* =========================================================
     SELECTED MEMBER
     ========================================================= */

  const selectedMember = useMemo(
    () =>
      members.find(
        (member) =>
          member.id ===
          selectedMemberId
      ) ?? null,
    [members, selectedMemberId]
  );

  /* =========================================================
     CHILDREN MAP
     ========================================================= */

  const childrenMap = useMemo(() => {
    const map = new Map<
      string,
      string[]
    >();

    for (const relationship of relationships) {
      const children =
        map.get(
          relationship.parent_id
        ) ?? [];

      if (
        !children.includes(
          relationship.child_id
        )
      ) {
        children.push(
          relationship.child_id
        );
      }

      map.set(
        relationship.parent_id,
        children
      );
    }

    return map;
  }, [relationships]);

  /* =========================================================
     PARENT MAP
     ========================================================= */

  const parentMap = useMemo(() => {
    const map = new Map<
      string,
      string[]
    >();

    for (const relationship of relationships) {
      const parents =
        map.get(
          relationship.child_id
        ) ?? [];

      if (
        !parents.includes(
          relationship.parent_id
        )
      ) {
        parents.push(
          relationship.parent_id
        );
      }

      map.set(
        relationship.child_id,
        parents
      );
    }

    return map;
  }, [relationships]);

  /* =========================================================
     SPOUSE MAP
     ========================================================= */

  const spouseMap = useMemo(() => {
    const map = new Map<
      string,
      DisplayMember[]
    >();

    const memberMap = new Map<string, DisplayMember>(
      members.map((member) => [
        member.id,
        member,
      ])
    );

    for (const couple of couples) {
      const person1 =
        memberMap.get(
          couple.person1_id
        );

      const person2 =
        memberMap.get(
          couple.person2_id
        );

      if (!person1 || !person2) {
        continue;
      }

      const person1Spouses =
        map.get(person1.id) ?? [];

      if (
        !person1Spouses.some(
          (spouse) =>
            spouse.id === person2.id
        )
      ) {
        person1Spouses.push(person2);
      }

      map.set(
        person1.id,
        person1Spouses
      );

      const person2Spouses =
        map.get(person2.id) ?? [];

      if (
        !person2Spouses.some(
          (spouse) =>
            spouse.id === person1.id
        )
      ) {
        person2Spouses.push(person1);
      }

      map.set(
        person2.id,
        person2Spouses
      );
    }

    return map;
  }, [members, couples]);

  /* =========================================================
     MEMBER CLICK
     ========================================================= */

  const handleMemberClick = useCallback(
    (memberId: string) => {
      setSelectedMemberId((current) =>
        current === memberId
          ? null
          : memberId
      );
    },
    []
  );

  /* =========================================================
     FAMILY UNIT
     ========================================================= */

  const getFamilyUnitId = useCallback(
    (memberIds: string[]) =>
      [...memberIds]
        .sort()
        .join('|'),
    []
  );

  const toggleFamilyUnit =
    useCallback(
      (memberIds: string[]) => {
        const familyId =
          getFamilyUnitId(
            memberIds
          );

        setCollapsedFamilyIds(
          (current) => {
            const next = new Set(
              current
            );

            if (
              next.has(familyId)
            ) {
              next.delete(
                familyId
              );
            } else {
              next.add(
                familyId
              );
            }

            return next;
          }
        );
      },
      [getFamilyUnitId]
    );

  /* =========================================================
     TREE HELPERS
     ========================================================= */

  const getChildrenOfParents = useCallback(
    (parentIds: string[]) => {
      const childIds =
        new Set<string>();

      for (const parentId of parentIds) {
        const ids =
          childrenMap.get(
            parentId
          ) ?? [];

        for (const childId of ids) {
          childIds.add(
            childId
          );
        }
      }

      return Array.from(childIds)
        .map((id) =>
          members.find(
            (member) =>
              member.id === id
          )
        )
        .filter(
          (
            member
          ): member is DisplayMember =>
            Boolean(member)
        );
    },
    [childrenMap, members]
  );

  const getSpouses = useCallback(
    (memberId: string) =>
      spouseMap.get(
        memberId
      ) ?? [],
    [spouseMap]
  );

  const getRootMembers =
    useCallback(
      () =>
        members.filter(
          (member) =>
            !parentMap.has(
              member.id
            )
        ),
      [members, parentMap]
    );

  /* =========================================================
     FIT TREE TO SCREEN
     ========================================================= */

  const fitTreeToScreen =
    useCallback(() => {
      const canvas =
        canvasRef.current;

      const tree =
        treeRef.current;

      if (!canvas || !tree) {
        return;
      }

      const canvasWidth =
        canvas.clientWidth;

      const canvasHeight =
        canvas.clientHeight;

      const treeWidth =
        tree.offsetWidth;

      const treeHeight =
        tree.offsetHeight;

      if (
        canvasWidth <= 0 ||
        canvasHeight <= 0 ||
        treeWidth <= 0 ||
        treeHeight <= 0
      ) {
        return;
      }

      const horizontalPadding = 80;
      const verticalPadding = 80;

      const availableWidth =
        canvasWidth -
        horizontalPadding;

      const availableHeight =
        canvasHeight -
        verticalPadding;

      const widthRatio =
        availableWidth /
        treeWidth;

      const heightRatio =
        availableHeight /
        treeHeight;

      const calculatedZoom =
        Math.min(
          widthRatio,
          heightRatio
        );

      const nextZoom = Math.min(
        2,
        Math.max(
          0.5,
          Number(
            calculatedZoom.toFixed(
              2
            )
          )
        )
      );

      setZoom(nextZoom);

      setPan({
        x: 0,
        y: 0,
      });
    }, []);

  /* =========================================================
     AUTO FIT
     ========================================================= */

  useEffect(() => {
    if (
      loading ||
      members.length === 0
    ) {
      return;
    }

    const frame =
      requestAnimationFrame(() => {
        fitTreeToScreen();
      });

    return () => {
      cancelAnimationFrame(
        frame
      );
    };
  }, [
    loading,
    members.length,
    relationships.length,
    couples.length,
    fitTreeToScreen,
  ]);

  /* =========================================================
     ZOOM
     ========================================================= */

  function zoomIn() {
    setZoom((current) =>
      Math.min(
        2,
        Number(
          (current + 0.1).toFixed(
            2
          )
        )
      )
    );
  }

  function zoomOut() {
    setZoom((current) =>
      Math.max(
        0.5,
        Number(
          (current - 0.1).toFixed(
            2
          )
        )
      )
    );
  }

  /* =========================================================
     WHEEL ZOOM
     ========================================================= */

  function handleWheel(
    event: React.WheelEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setZoom((current) => {
      const next =
        event.deltaY < 0
          ? current + 0.1
          : current - 0.1;

      return Math.min(
        2,
        Math.max(
          0.5,
          Number(
            next.toFixed(2)
          )
        )
      );
    });
  }

  /* =========================================================
     DRAG / PAN
     ========================================================= */

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (event.button !== 0) {
      return;
    }

    setIsDragging(true);

    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
    };

    panStart.current = {
      x: pan.x,
      y: pan.y,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (!isDragging) {
      return;
    }

    const deltaX =
      event.clientX -
      dragStart.current.x;

    const deltaY =
      event.clientY -
      dragStart.current.y;

    setPan({
      x:
        panStart.current.x +
        deltaX,
      y:
        panStart.current.y +
        deltaY,
    });
  }

  function handlePointerUp(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    setIsDragging(false);

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }
  }

  /* =========================================================
     EMPTY STATE
     ========================================================= */

  if (
    !loading &&
    members.length === 0
  ) {
    return (
      <div className="pt-[72px] min-h-screen bg-surface">
        <section className="py-20 px-margin-mobile md:px-margin-desktop">
          <div className="max-w-2xl mx-auto text-center">
            <Heart className="w-10 h-10 text-primary mx-auto mb-5" />

            <h1 className="font-display-lg text-display-lg text-secondary">
              Chưa có dữ liệu gia phả
            </h1>

            <p className="font-body-lg text-on-surface-variant mt-4">
              Hãy thêm thành viên và
              thiết lập quan hệ trong khu vực
              quản trị.
            </p>
          </div>
        </section>
      </div>
    );
  }

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="pt-[72px] min-h-screen bg-surface flex items-center justify-center">
        <p className="font-body-md text-on-surface-variant">
          Đang tải cây gia phả...
        </p>
      </div>
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

  if (errorMessage) {
    return (
      <div className="pt-[72px] min-h-screen bg-surface flex items-center justify-center px-margin-mobile">
        <div className="max-w-lg text-center">
          <Heart className="w-8 h-8 text-primary mx-auto mb-4" />

          <p className="font-body-lg text-primary">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN UI
     ========================================================= */

  return (
    <div className="pt-[72px] min-h-screen bg-surface">
      {/* =====================================================
          HEADER
         ===================================================== */}

      <section className="py-16 px-margin-mobile md:px-margin-desktop bg-surface-container-low border-b border-outline/10">
        <div className="max-w-4xl mx-auto text-center">
          <span className="font-label-md text-primary uppercase tracking-[0.15em]">
            Cội nguồn
          </span>

          <h1 className="font-display-lg text-display-lg text-secondary mt-3 mb-5">
            Gia Phả Gia Đình
          </h1>

          <div className="w-16 h-1 bg-primary/30 mx-auto rounded-full mb-6" />

          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Mỗi thế hệ là một phần
            của câu chuyện. Hãy cùng
            tìm về những người đã tạo nên
            mái nhà này.
          </p>
        </div>
      </section>

      {/* =====================================================
          TREE SECTION
         ===================================================== */}

      <section className="py-section-gap px-margin-mobile md:px-margin-desktop">
        <div className="max-w-[1400px] mx-auto">
          {/* Section title */}

          <div className="text-center mb-8">
            <span className="font-label-md text-primary uppercase tracking-[0.15em]">
              Cây gia phả
            </span>

            <h2 className="font-headline-lg text-headline-lg text-secondary mt-3">
              Các thế hệ
            </h2>
          </div>

          {/* =================================================
              TOOLBAR
             ================================================= */}

          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-1 bg-surface-container-lowest border border-outline/10 rounded-full p-1 shadow-sm">
              <button
                type="button"
                onClick={zoomOut}
                className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center text-secondary transition-colors"
                aria-label="Thu nhỏ"
              >
                −
              </button>

              <div
                className="min-w-[70px] h-10 px-3 rounded-full flex items-center justify-center text-sm font-medium text-secondary"
                aria-label="Mức thu phóng hiện tại"
              >
                {Math.round(
                  zoom * 100
                )}
                %
              </div>

              <button
                type="button"
                onClick={zoomIn}
                className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center text-secondary transition-colors"
                aria-label="Phóng to"
              >
                +
              </button>

              <div className="w-px h-5 bg-outline/20 mx-1" />

              <button
                type="button"
                onClick={
                  fitTreeToScreen
                }
                className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center text-secondary transition-colors"
                aria-label="Đưa toàn bộ cây vừa với màn hình"
                title="Vừa màn hình"
              >
                ↺
              </button>
            </div>
          </div>

          {/* =================================================
              CANVAS
             ================================================= */}

          <div
            ref={canvasRef}
            className={`relative h-[800px] md:h-[850px] overflow-hidden rounded-3xl border border-outline/10 bg-surface-container-low ${
              isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
            }`}
            style={{
              touchAction:
                'none',
            }}
            onWheel={
              handleWheel
            }
            onPointerDown={
              handlePointerDown
            }
            onPointerMove={
              handlePointerMove
            }
            onPointerUp={
              handlePointerUp
            }
            onPointerCancel={
              handlePointerUp
            }
          >
            {/* Hint */}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm border border-outline/10 text-xs text-on-surface-variant shadow-sm">
              Kéo để di chuyển · Lăn chuột để phóng to
            </div>

            {/* =================================================
                TREE
               ================================================= */}

            <div
              ref={treeRef}
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `translate(
                  calc(-50% + ${pan.x}px),
                  calc(-50% + ${pan.y}px)
                ) scale(${zoom})`,
                transformOrigin:
                  'center center',
              }}
            >
              <div className="w-max min-w-[900px] px-16 py-16">
                <div className="space-y-16">
                  {(() => {
                    const rootMembers =
                      getRootMembers();

                    const rootIds =
                      new Set(
                        rootMembers.map(
                          (member) =>
                            member.id
                        )
                      );

                    /*
                     * --------------------------------------------------
                     * Tìm root thực sự cần render.
                     *
                     * Nếu:
                     *
                     * A → C
                     * C ♥ B
                     *
                     * thì B không tạo một cây riêng.
                     * --------------------------------------------------
                     */

                    const coveredRootIds =
                      new Set<string>();

                    function markConnectedRoots(
                      startId: string
                    ) {
                      const visited =
                        new Set<string>();

                      const stack = [
                        startId,
                      ];

                      while (
                        stack.length > 0
                      ) {
                        const currentId =
                          stack.pop();

                        if (
                          !currentId ||
                          visited.has(
                            currentId
                          )
                        ) {
                          continue;
                        }

                        visited.add(
                          currentId
                        );

                        if (
                          currentId !==
                            startId &&
                          rootIds.has(
                            currentId
                          )
                        ) {
                          coveredRootIds.add(
                            currentId
                          );
                        }

                        const childIds =
                          childrenMap.get(
                            currentId
                          ) ?? [];

                        for (
                          const childId of childIds
                        ) {
                          if (
                            !visited.has(
                              childId
                            )
                          ) {
                            stack.push(
                              childId
                            );
                          }
                        }

                        const spouses =
                          getSpouses(
                            currentId
                          );

                        for (
                          const spouse of spouses
                        ) {
                          if (
                            !visited.has(
                              spouse.id
                            )
                          ) {
                            stack.push(
                              spouse.id
                            );
                          }
                        }
                      }
                    }

                    for (
                      const root of rootMembers
                    ) {
                      if (
                        coveredRootIds.has(
                          root.id
                        )
                      ) {
                        continue;
                      }

                      markConnectedRoots(
                        root.id
                      );
                    }

                    const actualRoots =
                      rootMembers.filter(
                        (root) =>
                          !coveredRootIds.has(
                            root.id
                          )
                      );

                    /*
                     * --------------------------------------------------
                     * Tạo family unit ở root.
                     * --------------------------------------------------
                     */

                    const rootUnits:
                      DisplayMember[][] =
                      [];

                    for (
                      const root of actualRoots
                    ) {
                      const unit = [
                        root,
                      ];

                      const spouses =
                        getSpouses(
                          root.id
                        );

                      for (
                        const spouse of spouses
                      ) {
                        if (
                          !unit.some(
                            (member) =>
                              member.id ===
                              spouse.id
                          )
                        ) {
                          unit.push(
                            spouse
                          );
                        }
                      }

                      rootUnits.push(
                        unit
                      );
                    }

                    return (
                      <>
                        {rootUnits.map(
                          (
                            unit,
                            index
                          ) => {
                            const children =
                              getChildrenOfParents(
                                unit.map(
                                  (member) =>
                                    member.id
                                )
                              );

                            return (
                              <FamilyTreeBranch
                                key={`root-unit-${index}`}
                                parents={
                                  unit
                                }
                                children={
                                  children
                                }
                                allMembers={
                                  members
                                }
                                childrenMap={
                                  childrenMap
                                }
                                spouseMap={
                                  spouseMap
                                }
                                selectedMemberId={
                                  selectedMemberId
                                }
                                onMemberClick={
                                  handleMemberClick
                                }
                                renderedIds={
                                  new Set(
                                    unit.map(
                                      (
                                        member
                                      ) =>
                                        member.id
                                    )
                                  )
                                }
                                collapsedFamilyIds={
                                  collapsedFamilyIds
                                }
                                onToggleCollapse={
                                  toggleFamilyUnit
                                }
                                showParents={
                                  true
                                }
                              />
                            );
                          }
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              SELECTED MEMBER
             ================================================= */}

          {selectedMember && (
            <div className="max-w-2xl mx-auto mt-8 bg-surface-container-low rounded-3xl p-8 border border-outline/10">
              <div className="text-center">
                <Heart className="w-7 h-7 text-primary fill-current mx-auto mb-4" />

                <h3 className="font-headline-md text-headline-md text-secondary mb-2">
                  {
                    selectedMember.name
                  }
                </h3>

                <p className="font-body-md text-on-surface-variant">
                  Sinh ngày{' '}
                  {
                    selectedMember.birthDate
                  }
                </p>

                {selectedMember.relation && (
                  <p className="font-body-md text-primary mt-2">
                    {
                      selectedMember.relation
                    }
                  </p>
                )}

                {selectedMember.shortBio && (
                  <p className="font-body-md text-on-surface-variant mt-4 leading-relaxed">
                    {
                      selectedMember.shortBio
                    }
                  </p>
                )}

                {selectedMember.hobbies.length >
                  0 && (
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {selectedMember.hobbies.map(
                      (hobby) => (
                        <span
                          key={
                            hobby
                          }
                          className="px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline/10 text-xs text-on-surface-variant"
                        >
                          {
                            hobby
                          }
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
