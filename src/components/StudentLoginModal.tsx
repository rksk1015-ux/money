import React, { useState } from 'react';
import { Student } from '../types/economy';
import { soundEffects } from '../services/sound';
import { Lock, UserCheck, KeyRound, ArrowLeft, AlertCircle, Building2, ShieldCheck } from 'lucide-react';

interface StudentLoginModalProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onOpenTellerDesk: () => void;
  onOpenTeacherConsole: () => void;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  students,
  onSelectStudent,
  onOpenTellerDesk,
  onOpenTeacherConsole,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const handleSelect = (student: Student) => {
    soundEffects.playClick();
    setSelectedStudent(student);
    setPinInput('');
    setPinError('');
  };

  const handleKeypadPress = (val: string) => {
    soundEffects.playClick();
    if (val === 'DEL') {
      setPinInput((prev) => prev.slice(0, -1));
      setPinError('');
      return;
    }
    if (pinInput.length >= 4) return;
    const nextPin = pinInput + val;
    setPinInput(nextPin);
    setPinError('');

    if (nextPin.length === 4) {
      if (selectedStudent && nextPin === selectedStudent.pin) {
        soundEffects.playSuccess();
        onSelectStudent(selectedStudent);
      } else {
        soundEffects.playError();
        setPinError('비밀번호 4자리가 일치하지 않습니다.');
        setPinInput('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
        
        {/* 상단 브랜딩 헤더 */}
        <div className="px-6 py-6 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white text-center relative">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner border border-white/30 backdrop-blur-sm mb-2">
            🥒
          </div>
          <h2 className="text-2xl font-black tracking-tight">오이 머니 플래닛</h2>
          <p className="text-xs text-emerald-100 mt-0.5">
            초등학교 학급 경제 스톡 & 뱅킹 플랫폼
          </p>

          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <button
              onClick={() => {
                soundEffects.playClick();
                onOpenTellerDesk();
              }}
              title="은행 창구"
              className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>창구</span>
            </button>
            <button
              onClick={() => {
                soundEffects.playClick();
                onOpenTeacherConsole();
              }}
              title="선생님 관리"
              className="px-2.5 py-1 rounded-xl bg-emerald-900/80 hover:bg-emerald-900 text-emerald-100 font-bold text-xs flex items-center gap-1 border border-emerald-500/40"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>관리</span>
            </button>
          </div>
        </div>

        {/* 메인 내용: 학생 선택 또는 PIN 입력 */}
        <div className="p-6">
          {!selectedStudent ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">
                  접속할 학생 본인의 이름을 선택해주세요
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  내 통장 잔액 확인, 지갑 간 이체, 주식 투자를 시작할 수 있습니다.
                </p>
              </div>

              {/* 학생 카드 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleSelect(student)}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 bg-slate-50/60 transition-all flex flex-col items-center gap-1 text-center group active:scale-95"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {student.avatar || '🥒'}
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      {student.name}
                    </span>
                    {student.isTeller && (
                      <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-2 py-0.2 rounded-full">
                        은행원
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* 선택 후 PIN 입력 화면 */
            <div className="space-y-4 max-w-xs mx-auto text-center">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setSelectedStudent(null);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>학생 다시 선택</span>
              </button>

              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl mx-auto shadow-sm">
                {selectedStudent.avatar || '🥒'}
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedStudent.name} 학생의 비밀번호 4자리
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  통장 개인 비밀번호를 키패드로 눌러주세요 (초기값: 1234)
                </p>
              </div>

              {/* PIN 도트 */}
              <div className="flex justify-center gap-3 my-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all ${
                      pinInput.length > idx ? 'bg-emerald-600 scale-125' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {pinError && (
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{pinError}</span>
                </div>
              )}

              {/* 숫자 키패드 */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleKeypadPress(String(n))}
                    className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 text-lg font-black transition-all"
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setSelectedStudent(null);
                  }}
                  className="py-3 rounded-2xl bg-slate-50 text-slate-500 text-xs font-bold hover:bg-slate-100 active:scale-95"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 text-lg font-black transition-all"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('DEL')}
                  className="py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 text-xs font-bold transition-all"
                >
                  지움
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
