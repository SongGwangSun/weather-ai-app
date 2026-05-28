'use client';

import { useState } from 'react';
import type { Gender, UserProfile } from '@/lib/profile';
import { getBMI, getBodyType } from '@/lib/profile';
import AvatarSVG from './AvatarSVG';

const GENDERS: { value: Gender; label: string; emoji: string }[] = [
  { value: 'male',   label: '남성', emoji: '👨' },
  { value: 'female', label: '여성', emoji: '👩' },
  { value: 'other',  label: '기타', emoji: '🧑' },
];

interface Props {
  initial?: UserProfile | null;
  editMode?: boolean;   // true = 키/몸무게만 수정
  onSave: (p: UserProfile) => void;
  onClose: () => void;
}

export default function ProfileSetupModal({ initial, editMode = false, onSave, onClose }: Props) {
  const [gender, setGender] = useState<Gender>(initial?.gender ?? 'male');
  const [age,    setAge]    = useState(initial?.age?.toString()    ?? '');
  const [height, setHeight] = useState(initial?.height?.toString() ?? '');
  const [weight, setWeight] = useState(initial?.weight?.toString() ?? '');
  const [error,  setError]  = useState('');

  // 실시간 미리보기용 프로필
  const previewProfile: UserProfile | null = (() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseInt(age, 10);
    if (h >= 100 && h <= 250 && w >= 20 && w <= 300 && a >= 5 && a <= 120) {
      return { gender, age: a, height: h, weight: w };
    }
    // 부분 값으로도 미리보기
    if (h >= 100 && w >= 20) {
      return { gender, age: a || 25, height: h, weight: w };
    }
    return null;
  })();

  const bmi      = previewProfile ? getBMI(previewProfile.height, previewProfile.weight) : null;
  const bodyType = bmi ? getBodyType(bmi) : null;

  function handleSave() {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseInt(age, 10);

    if (!editMode && (isNaN(a) || a < 5 || a > 120)) { setError('나이를 올바르게 입력해주세요 (5–120)'); return; }
    if (isNaN(h) || h < 100 || h > 250) { setError('키를 올바르게 입력해주세요 (100–250cm)'); return; }
    if (isNaN(w) || w < 20  || w > 300) { setError('몸무게를 올바르게 입력해주세요 (20–300kg)'); return; }

    onSave({
      gender,
      age:    editMode ? (initial?.age ?? a) : a,
      height: h,
      weight: w,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 pt-8 pb-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-light">✕</button>
          <h2 className="text-white font-bold text-xl">
            {editMode ? '✏️ 체형 수정' : '👤 프로필 설정'}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {editMode ? '키와 몸무게를 업데이트하세요' : '정보를 입력하면 아바타와 함께 딱 맞는 코디를 추천해드려요'}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* 미리보기 아바타 */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-gradient-to-b from-violet-50 to-fuchsia-50 rounded-3xl p-4 border border-violet-100 w-36 h-52 flex items-center justify-center">
              {previewProfile ? (
                <AvatarSVG profile={previewProfile} size={110} />
              ) : (
                <div className="text-5xl opacity-30">🧍</div>
              )}
            </div>
            {bmi && bodyType && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  BMI <span className="font-bold text-violet-700">{bmi.toFixed(1)}</span>
                  {' · '}
                  <span className="text-violet-600">
                    {bodyType === 'slim' ? '슬림 체형' : bodyType === 'full' ? '풍성 체형' : '보통 체형'}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* 성별 (editMode가 아닐 때만) */}
          {!editMode && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">성별</label>
              <div className="grid grid-cols-3 gap-2">
                {GENDERS.map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setGender(value)}
                    className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${
                      gender === value
                        ? 'border-violet-500 bg-violet-50 text-violet-700 scale-[1.03]'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-violet-200'
                    }`}
                  >
                    <span className="block text-xl mb-1">{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 나이 (editMode가 아닐 때만) */}
          {!editMode && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">나이</label>
              <input
                type="number" min={5} max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="예: 28"
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-violet-400 transition-colors"
              />
            </div>
          )}

          {/* 키 & 몸무게 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">키 (cm)</label>
              <input
                type="number" min={100} max={250}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="예: 170"
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-violet-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">몸무게 (kg)</label>
              <input
                type="number" min={20} max={300}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="예: 65"
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-violet-400 transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center font-medium">{error}</p>
          )}

          <button
            onClick={handleSave}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold rounded-2xl text-base hover:opacity-90 transition-all shadow-lg shadow-violet-200"
          >
            {editMode ? '✓ 수정 완료' : '🚀 아바타 생성하기'}
          </button>

          {!editMode && (
            <p className="text-center text-xs text-gray-400">
              정보는 기기에만 저장되며 외부에 전송되지 않습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
