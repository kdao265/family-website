import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import FamilyMemberCard from './FamilyMemberCard';

interface Member {
  id: string;
  name: string;
  birthDate: string;
  hobbies: string[];
  imageUrl: string;
  imageAlt: string;
  relation?: string;
  shortBio?: string;
}

interface FamilyTreeBranchProps {
  parents: Member[];
  children?: any;
  key?: React.Key;
  allMembers: Member[];
  childrenMap: Map<string, string[]>;
  spouseMap: Map<string, Member[]>;
  selectedMemberId: string | null;
  onMemberClick: (memberId: string) => void;
  renderedIds: Set<string>;
  collapsedFamilyIds: Set<string>;
  onToggleCollapse: (memberIds: string[]) => void;
  showParents?: boolean;
}

const CARD_WIDTH = 220;
const SPOUSE_GAP = 24;
const FAMILY_GAP = 48;
const CONNECTOR_HEIGHT = 68;
const SPLIT_Y = 40;

export default function FamilyTreeBranch({
  parents,
  children,
  allMembers,
  childrenMap,
  spouseMap,
  selectedMemberId,
  onMemberClick,
  renderedIds,
  collapsedFamilyIds,
  onToggleCollapse,
  showParents = true,
}: FamilyTreeBranchProps) {
  const memberMap = useMemo(
    () => new Map(allMembers.map((member) => [member.id, member])),
    [allMembers]
  );

  const familyUnitId = useMemo(
    () =>
      parents
        .map((p) => p.id)
        .sort()
        .join('|'),
    [parents]
  );

  const isCollapsed = collapsedFamilyIds.has(familyUnitId);

  // Lấy spouse hợp lệ
  const getAvailableSpouse = (member: Member) => {
    const spouses = spouseMap.get(member.id) ?? [];
    return (
      spouses.find(
        (spouse) => spouse.id !== member.id && !renderedIds.has(spouse.id)
      ) ?? null
    );
  };

  // Lấy con ruột trực hệ
  const getChildrenOfFamily = (familyParents: Member[]) => {
    const childIds = new Set<string>();
    const excludedIds = new Set<string>();

    for (const parent of familyParents) {
      excludedIds.add(parent.id);
      const spouses = spouseMap.get(parent.id) ?? [];
      for (const spouse of spouses) {
        excludedIds.add(spouse.id);
      }
      const ids = childrenMap.get(parent.id) ?? [];
      for (const childId of ids) {
        childIds.add(childId);
      }
    }

    return Array.from(childIds)
      .filter((id) => !excludedIds.has(id))
      .map((id) => memberMap.get(id))
      .filter((member): member is Member => Boolean(member))
      .filter((member) => !renderedIds.has(member.id));
  };

  const visibleChildren = useMemo(() => {
    if (children && children.length > 0) return children;
    return getChildrenOfFamily(parents);
  }, [children, parents]);

  const hasSpouse = parents.length > 1;
  const parentCardsWidth = hasSpouse ? CARD_WIDTH * 2 + SPOUSE_GAP : CARD_WIDTH;

  const childUnits = useMemo(() => {
    return visibleChildren.map((child) => {
      const spouse = getAvailableSpouse(child);
      const familyMembers = spouse ? [child, spouse] : [child];
      const familyChildren = getChildrenOfFamily(familyMembers);

      const nextRenderedIds = new Set(renderedIds);
      nextRenderedIds.add(child.id);
      if (spouse) nextRenderedIds.add(spouse.id);

      return {
        child,
        spouse,
        familyMembers,
        familyChildren,
        renderedIds: nextRenderedIds,
        cardWidth: spouse ? CARD_WIDTH * 2 + SPOUSE_GAP : CARD_WIDTH,
      };
    });
  }, [visibleChildren, renderedIds, spouseMap, childrenMap]);

  if (!showParents && childUnits.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center select-none">
      {/* 1. KHỐI THẺ CHA MẸ */}
      {showParents && (
        <div
          className="flex items-center justify-center relative z-20"
          style={{ width: parentCardsWidth }}
        >
          {parents.map((parent, index) => (
            <React.Fragment key={parent.id}>
              <FamilyMemberCard
                member={parent}
                isSelected={selectedMemberId === parent.id}
                onClick={() => onMemberClick(parent.id)}
              />
              {index < parents.length - 1 && (
                <div
                  className="shrink-0 flex items-center justify-center text-primary text-xl font-bold"
                  style={{ width: SPOUSE_GAP }}
                  title="Hôn phối"
                >
                  ♥
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* 2. KHỐI ĐƯỜNG NỐI VÀ CON CÁI */}
      {childUnits.length > 0 && (
        <>
          {/* Nút thu gọn / mở rộng khi đang collapsed */}
          {isCollapsed ? (
            <div
              className="relative flex flex-col items-center"
              style={{ width: parentCardsWidth, height: 36 }}
            >
              <div className="w-[2px] h-3 bg-primary/60" />
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse(parents.map((p) => p.id));
                }}
                className="w-6 h-6 rounded-full bg-surface-container-lowest border-2 border-primary/70 text-primary hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center text-xs font-bold shadow-sm z-30 cursor-pointer"
                aria-label="Mở rộng nhánh con"
                title="Mở rộng"
              >
                +
              </button>
            </div>
          ) : (
            <ChildrenWithConnectors
              parents={parents}
              childUnits={childUnits}
              allMembers={allMembers}
              childrenMap={childrenMap}
              spouseMap={spouseMap}
              selectedMemberId={selectedMemberId}
              onMemberClick={onMemberClick}
              collapsedFamilyIds={collapsedFamilyIds}
              onToggleCollapse={onToggleCollapse}
            />
          )}
        </>
      )}
    </div>
  );
}

interface ChildrenWithConnectorsProps {
  parents: Member[];
  childUnits: Array<{
    child: Member;
    spouse: Member | null;
    familyMembers: Member[];
    familyChildren: Member[];
    renderedIds: Set<string>;
    cardWidth: number;
  }>;
  allMembers: Member[];
  childrenMap: Map<string, string[]>;
  spouseMap: Map<string, Member[]>;
  selectedMemberId: string | null;
  onMemberClick: (memberId: string) => void;
  collapsedFamilyIds: Set<string>;
  onToggleCollapse: (memberIds: string[]) => void;
}

function ChildrenWithConnectors({
  parents,
  childUnits,
  allMembers,
  childrenMap,
  spouseMap,
  selectedMemberId,
  onMemberClick,
  collapsedFamilyIds,
  onToggleCollapse,
}: ChildrenWithConnectorsProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [lineCoords, setLineCoords] = useState<{
    parentX: number;
    childAnchors: number[];
  } | null>(null);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const measure = () => {
      const childNodes = row.children;
      if (childNodes.length === 0) return;

      const anchors = [];
      for (let i = 0; i < childNodes.length; i++) {
        const node = childNodes[i];
        // Con ruột luôn ở thẻ đầu tiên của khối (tâm thẻ con ruột = node.offsetLeft + 110)
        anchors.push(node.offsetLeft + CARD_WIDTH / 2);
      }

      // Trục của cha mẹ nằm chính giữa hàng con vì flex flex-col items-center căn giữa
      const pX = row.offsetWidth / 2;

      setLineCoords({
        parentX: pX,
        childAnchors: anchors,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(row);
    for (let i = 0; i < row.children.length; i++) {
      observer.observe(row.children[i]);
    }

    return () => observer.disconnect();
  }, [childUnits.length]);

  const pX = lineCoords?.parentX ?? (rowRef.current ? rowRef.current.offsetWidth / 2 : 0);
  const anchors = lineCoords?.childAnchors ?? [];
  const firstX = anchors[0] ?? pX;
  const lastX = anchors[anchors.length - 1] ?? pX;

  return (
    <div className="flex flex-col items-center relative">
      {/* Vùng nối SVG có chiều cao CONNECTOR_HEIGHT */}
      <div
        className="relative w-full pointer-events-none z-10"
        style={{ height: CONNECTOR_HEIGHT }}
      >
        <svg
          className="w-full h-full overflow-visible"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Đường từ cha mẹ xuống nút toggle và thanh ngang */}
          <line
            x1={pX}
            y1={0}
            x2={pX}
            y2={anchors.length > 1 ? SPLIT_Y : CONNECTOR_HEIGHT}
            stroke="#A84A3A"
            strokeOpacity={0.65}
            strokeWidth={2}
          />

          {/* Thanh ngang nối từ con đầu đến con cuối */}
          {anchors.length > 1 && (
            <line
              x1={firstX}
              y1={SPLIT_Y}
              x2={lastX}
              y2={SPLIT_Y}
              stroke="#A84A3A"
              strokeOpacity={0.65}
              strokeWidth={2}
            />
          )}

          {/* Đường thả dọc từ thanh ngang xuống từng con */}
          {anchors.length > 1 &&
            anchors.map((cX, idx) => (
              <line
                key={idx}
                x1={cX}
                y1={SPLIT_Y}
                x2={cX}
                y2={CONNECTOR_HEIGHT}
                stroke="#A84A3A"
                strokeOpacity={0.65}
                strokeWidth={2}
              />
            ))}
        </svg>

        {/* Nút thu gọn nằm trên đường dọc */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(parents.map((p) => p.id));
          }}
          className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-container-lowest border-2 border-primary/70 text-primary hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center text-xs font-bold shadow-sm z-30 cursor-pointer"
          style={{
            left: pX,
            top: 18,
          }}
          aria-label="Thu gọn nhánh con"
          title="Thu gọn"
        >
          −
        </button>
      </div>

      {/* HÀNG CÁC THÀNH VIÊN CON */}
      <div
        ref={rowRef}
        className="flex items-start relative z-20"
        style={{ gap: FAMILY_GAP + "px" }}
      >
        {childUnits.map((unit) => (
          <div key={unit.child.id} className="flex flex-col items-center shrink-0">
            {/* Thẻ con (+ vợ/chồng) */}
            <div
              className="flex items-center justify-center"
              style={{ width: unit.cardWidth }}
            >
              <FamilyMemberCard
                member={unit.child}
                isSelected={selectedMemberId === unit.child.id}
                onClick={() => onMemberClick(unit.child.id)}
              />

              {unit.spouse && (
                <>
                  <div
                    className="shrink-0 flex items-center justify-center text-primary text-xl font-bold"
                    style={{ width: SPOUSE_GAP }}
                    title="Hôn phối"
                  >
                    ♥
                  </div>
                  <FamilyMemberCard
                    member={unit.spouse}
                    isSelected={selectedMemberId === unit.spouse.id}
                    onClick={() => onMemberClick(unit.spouse.id)}
                  />
                </>
              )}
            </div>

            {/* Đệ quy con của con này */}
            {unit.familyChildren.length > 0 && (
              <FamilyTreeBranch
                parents={unit.familyMembers}
                children={unit.familyChildren}
                allMembers={allMembers}
                childrenMap={childrenMap}
                spouseMap={spouseMap}
                selectedMemberId={selectedMemberId}
                onMemberClick={onMemberClick}
                renderedIds={unit.renderedIds}
                collapsedFamilyIds={collapsedFamilyIds}
                onToggleCollapse={onToggleCollapse}
                showParents={false}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
