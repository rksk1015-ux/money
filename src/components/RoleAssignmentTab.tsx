import React, { useState, useMemo } from 'react';
import {
  StudentRole,
  StudentSheetItem,
  AssignmentItem,
  AssignmentResult,
} from '../types/economy';
import { soundEffects } from '../services/sound';
import confetti from 'canvas-confetti';
import {
  Briefcase,
  Users,
  Shuffle,
  RefreshCw,
  Save,
  CheckCircle2,
  Calendar,
  Sparkles,
  Edit3,
  Layers,
  History,
} from 'lucide-react';

interface RoleAssignmentTabProps {
  students: StudentSheetItem[];
  roles: StudentRole[];
  currentAssignments: AssignmentItem[];
  savedResults: AssignmentResult[];
  onUpdateStudents: (nextStudents: StudentSheetItem[]) => void;
  onUpdateRoles: (nextRoles: StudentRole[]) => void;
  onUpdateAssignments: (nextAssignments: AssignmentItem[]) => void;
  onPullFromSheet: () => void;
  onPushAssignmentsToSheet: () => void;
  isPulling: boolean;
  isPushing: boolean;
  sheetUrl: string;
  onOpenSheetSettings: () => void;
}

export const RoleAssignmentTab: React.FC<RoleAssignmentTabProps> = ({
  students,
  roles,
  currentAssignments,
  savedResults,
  onUpdateStudents,
  onUpdateRoles,
  onUpdateAssignments,
  onPullFromSheet,
  onPushAssignmentsToSheet,
  isPulling,
  isPushing,
  sheetUrl,
  onOpenSheetSettings,
}) => {
  const [isEditingList, setIsEditingList] = useState<boolean>(false);
  const [studentText, setStudentText] = useState<string>('');
  const [roleText, setRoleText] = useState<string>('');

  // Start editing raw lists
  const handleStartEdit = () => {
    soundEffects.playClick();
    // 텍스트 영역에는 students.map(s => s.name).join('\n'), 역할 입력에는 roles.map(r => r.role).join('\n')처럼 문자열 필드만 표시
    setStudentText(students.map((s) => s.name).join('\n'));
    setRoleText(roles.map((r) => r.role).join('\n'));
    setIsEditingList(true);
  };

  // Save edited raw lists while preserving original numbers and descriptions
  const handleSaveEdit = () => {
    soundEffects.playSuccess();
    const studentLines = studentText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && typeof l === 'string');

    const nextStudents: StudentSheetItem[] = studentLines.map((name, idx) => {
      // 기존 번호 보존, 없으면 순서대로 부여
      const orig = students[idx];
      return {
        num: orig?.num ? orig.num : idx + 1,
        name: name,
      };
    });

    const roleLines = roleText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && typeof l === 'string');

    const nextRoles: StudentRole[] = roleLines.map((roleName, idx) => {
      // 기존 설명 보존
      const orig = roles[idx];
      return {
        role: roleName,
        desc: orig?.desc || '학급 1인 1역할 활동',
      };
    });

    onUpdateStudents(nextStudents);
    onUpdateRoles(nextRoles);
    setIsEditingList(false);
  };

  // 1인 1역할 랜덤 배정 실행
  const handleRandomAssign = () => {
    if (students.length === 0 || roles.length === 0) {
      alert('학생 명단 또는 역할 목록이 비어 있습니다.');
      soundEffects.playError();
      return;
    }

    soundEffects.playFanfare();
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    // 역할을 무작위로 섞기
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);

    const newAssignments: AssignmentItem[] = students.map((s, idx) => {
      const assignedRole = shuffledRoles[idx % shuffledRoles.length];
      return {
        num: s.num,
        name: s.name,
        role: assignedRole.role,
        desc: assignedRole.desc,
      };
    });

    onUpdateAssignments(newAssignments);
  };

  // 수동 개별 역할 변경
  const handleManualRoleChange = (studentNum: number, roleName: string) => {
    soundEffects.playClick();
    const targetRole = roles.find((r) => r.role === roleName) || {
      role: roleName,
      desc: '학급 역할',
    };

    const nextAssignments = currentAssignments.map((a) => {
      if (a.num === studentNum) {
        return {
          ...a,
          role: targetRole.role,
          desc: targetRole.desc,
        };
      }
      return a;
    });

    onUpdateAssignments(nextAssignments);
  };

  // Assignment lookup map
  const assignmentMap = useMemo(() => {
    const map = new Map<number, AssignmentItem>();
    currentAssignments.forEach((a) => {
      map.set(a.num, a);
    });
    return map;
  }, [currentAssignments]);

  return (
    <div className="space-y-6">
      
      {/* 상단 1인 1역할 헤더 배너 & 시트 연동 컨트롤 바 */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💼</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-500/30 rounded-full border border-emerald-400/30 text-emerald-200">
                학급 1인 1역할 & 구글 시트 양방향 연동
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              학급 1인 1역할 배정 및 구글 시트 동기화
            </h2>
            <p className="text-xs text-emerald-200/90 mt-0.5">
              학생별 담당 역할(은행원, 칠판당번, 급식도우미 등)을 정하고, 배정 결과를 구글 스프레드시트에 실시간으로 기록합니다.
            </p>
          </div>

          {/* 주요 액션 버튼들 */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* [🔄 시트에서 명단/결과 불러오기] */}
            <button
              onClick={() => {
                soundEffects.playClick();
                onPullFromSheet();
              }}
              disabled={isPulling}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-600 active:scale-95 transition-all text-white font-bold text-xs shadow-sm border border-teal-500/50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
              <span>{isPulling ? '불러오는 중...' : '🔄 시트에서 명단/결과 불러오기'}</span>
            </button>

            {/* [💾 배정 결과 구글 시트에 저장] */}
            <button
              onClick={() => {
                soundEffects.playClick();
                onPushAssignmentsToSheet();
              }}
              disabled={isPushing || currentAssignments.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-slate-950 font-black text-xs shadow-md border border-emerald-300 disabled:opacity-40"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>{isPushing ? '저장 중...' : '💾 배정 결과 구글 시트에 저장'}</span>
            </button>

          </div>
        </div>

        {/* 하단 URL 상태 바 */}
        <div className="mt-4 pt-3 border-t border-emerald-700/60 flex items-center justify-between text-xs text-emerald-200">
          <span className="truncate max-w-md">
            연동 시트 URL: {sheetUrl ? <strong className="text-white">{sheetUrl}</strong> : '미설정 (상단 [⚙️ 시트 URL 설정]에서 입력)'}
          </span>
          <button
            onClick={onOpenSheetSettings}
            className="text-amber-300 hover:underline font-bold shrink-0 ml-2"
          >
            ⚙️ 시트 URL 변경
          </button>
        </div>
      </div>

      {/* 명단 & 역할 관리 바 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            등록 학생: <strong className="text-emerald-700 text-sm">{students.length}명</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            등록 역할: <strong className="text-indigo-700 text-sm">{roles.length}종</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            배정 완료: <strong className="text-amber-700 text-sm">{currentAssignments.length}명</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* 명단/역할 텍스트 직접 편집 토글 버튼 */}
          <button
            onClick={isEditingList ? handleSaveEdit : handleStartEdit}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all text-slate-800 text-xs font-bold"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
            <span>{isEditingList ? '편집 완료 및 적용' : '명단·역할 직접 수정'}</span>
          </button>

          {/* 🎲 1인 1역할 랜덤 배정 버튼 */}
          <button
            onClick={handleRandomAssign}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all text-white text-xs font-black shadow-sm"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>🎲 랜덤 배정하기</span>
          </button>
        </div>
      </div>

      {/* 명단 & 역할 직접 편집 모드 열림 상태 */}
      {isEditingList && (
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase">
              학생 명단 및 역할 목록 직접 편집 (줄바꿈으로 구분)
            </h4>
            <span className="text-[11px] text-slate-500">
              * 기존 학생 번호와 역할 상세 설명은 자동으로 보존됩니다.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                학생 이름 목록 (한 줄에 한 명씩)
              </label>
              <textarea
                value={studentText}
                onChange={(e) => setStudentText(e.target.value)}
                rows={6}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="김민준&#10;이서연&#10;박도윤"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                역할 이름 목록 (한 줄에 하나씩)
              </label>
              <textarea
                value={roleText}
                onChange={(e) => setRoleText(e.target.value)}
                rows={6}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="은행원&#10;칠판당번&#10;급식도우미"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditingList(false)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
            >
              취소
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
            >
              수정 내용 적용
            </button>
          </div>
        </div>
      )}

      {/* 학생별 배정 결과 카드 그리드 (textContent 필수) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>학생별 1인 1역할 배정 현황 카드</span>
          </h3>
          <span className="text-xs text-slate-500">
            개별 역할을 직접 선택하거나 [랜덤 배정하기]를 누르세요.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {students.map((student) => {
            const assignment = assignmentMap.get(student.num);
            const assignedRoleName = assignment?.role || '';
            const assignedDesc = assignment?.desc || '';

            return (
              <div
                key={`student-card-${student.num}`}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* 학생 번호 및 이름 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-bold text-xs flex items-center justify-center">
                        {student.num}
                      </span>
                      <strong className="text-sm text-slate-900">{student.name}</strong>
                    </div>
                    {assignedRoleName === '은행원' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                        ★ 은행원
                      </span>
                    )}
                  </div>

                  {/* 역할 선택 드롭다운 */}
                  <div className="mt-2">
                    <label className="text-[11px] text-slate-400 block mb-1">담당 역할 선택</label>
                    <select
                      value={assignedRoleName}
                      onChange={(e) => handleManualRoleChange(student.num, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- 역할을 선택하세요 --</option>
                      {roles.map((r, rIdx) => (
                        <option key={`role-opt-${rIdx}`} value={r.role}>
                          {r.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 역할 설명 텍스트 표시 */}
                  {assignedDesc && (
                    <p className="mt-2 text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                      💡 {assignedDesc}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">배정 상태:</span>
                  <span className={assignedRoleName ? 'font-bold text-emerald-700' : 'text-slate-400'}>
                    {assignedRoleName ? `배정 완료 (${assignedRoleName})` : '미배정'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 구글 시트에서 불러온 최근 배정 히스토리 (results) */}
      {savedResults && savedResults.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" />
              <span>구글 스프레드시트에 저장된 배정 결과 내역 ({savedResults.length}건)</span>
            </h3>
            <span className="text-xs text-slate-400">시트 탭: 배정결과</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">일시</th>
                  <th className="p-2.5">번호</th>
                  <th className="p-2.5">이름</th>
                  <th className="p-2.5">담당 역할</th>
                  <th className="p-2.5">역할 설명</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedResults.slice(-20).reverse().map((res, idx) => (
                  <tr key={`res-${idx}`} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-400 font-mono">{res.date || '-'}</td>
                    <td className="p-2.5 font-bold font-mono text-slate-700">{res.num}</td>
                    <td className="p-2.5 font-bold text-slate-900">{res.name}</td>
                    <td className="p-2.5 font-bold text-indigo-700">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200">
                        {res.role}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600">{res.desc || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
