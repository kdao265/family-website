import { Heart } from 'lucide-react';
import React from 'react';

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

interface FamilyMemberCardProps {
  member: Member;
  isSelected?: boolean;
  onClick?: () => void;
}

function formatBirthDate(value: string) {
  if (!value || value === 'Chưa cập nhật') {
    return value;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return value;
  }

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
}

export default function FamilyMemberCard({
  member,
  isSelected = false,
  onClick,
}: FamilyMemberCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-[220px] text-left bg-surface-container-lowest rounded-2xl overflow-hidden border transition-all duration-200 ${
        isSelected
          ? 'border-primary shadow-lg -translate-y-1'
          : 'border-outline/15 family-card-shadow hover:-translate-y-1 hover:shadow-lg'
      }`}
    >
      <div className="h-40 overflow-hidden">
        <img
          src={member.imageUrl}
          alt={member.imageAlt}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-4 h-4 text-primary fill-current" />

          <h3 className="font-headline-md text-lg text-secondary truncate">
            {member.name}
          </h3>
        </div>

        {member.relation && (
          <p className="font-body-md text-sm text-primary mb-2">
            {member.relation}
          </p>
        )}

        <p className="font-body-md text-sm text-on-surface-variant">
          {formatBirthDate(member.birthDate)}
        </p>
      </div>
    </button>
  );
}
