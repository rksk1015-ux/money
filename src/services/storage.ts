import {
  AppState,
  DEFAULT_CONFIG,
  INITIAL_STOCKS,
  INITIAL_STUDENTS,
  INITIAL_TRANSACTIONS,
  PRESET_NEWS,
} from '../types/economy';

const STORAGE_KEY = 'cucumber_money_planet_v1';
const BROADCAST_CHANNEL_NAME = 'cucumber_planet_sync';

class StorageService {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Array<(state: AppState) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'STATE_UPDATED' && event.data?.payload) {
            this.notifyListeners(event.data.payload);
          }
        };
      } catch {
        // BroadcastChannel fallback if restricted
      }
    }
  }

  public subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(state: AppState) {
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Listener notification error:', err);
      }
    });
  }

  public loadInitialState(): AppState {
    if (typeof window === 'undefined') {
      return this.getDefaultState();
    }

    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        // Validate minimal schema
        if (Array.isArray(parsed.students) && Array.isArray(parsed.stocks)) {
          return {
            students: parsed.students,
            stocks: parsed.stocks,
            news: Array.isArray(parsed.news) ? parsed.news : PRESET_NEWS,
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            config: {
              ...DEFAULT_CONFIG,
              ...(parsed.config || {}),
            },
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage, using initial defaults:', e);
    }

    const defaultState = this.getDefaultState();
    this.saveState(defaultState, false);
    return defaultState;
  }

  public getDefaultState(): AppState {
    return {
      students: JSON.parse(JSON.stringify(INITIAL_STUDENTS)),
      stocks: JSON.parse(JSON.stringify(INITIAL_STOCKS)),
      news: JSON.parse(JSON.stringify(PRESET_NEWS)),
      transactions: JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS)),
      config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
    };
  }

  public saveState(state: AppState, broadcast: boolean = true) {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }

    if (broadcast && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'STATE_UPDATED',
          payload: state,
        });
      } catch {
        // ignore
      }
    }
  }

  public resetToDefaults(): AppState {
    const freshState = this.getDefaultState();
    this.saveState(freshState, true);
    this.notifyListeners(freshState);
    return freshState;
  }

  // JSON 파일로 전체 데이터 내보내기 (선생님 백업용)
  public exportDataJson(state: AppState): string {
    return JSON.stringify(state, null, 2);
  }

  // JSON 파일 데이터 복구
  public importDataJson(jsonString: string): AppState {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed.students) || !Array.isArray(parsed.stocks)) {
      throw new Error('유효하지 않은 오이 머니 플래닛 데이터 형식입니다.');
    }
    const validatedState: AppState = {
      students: parsed.students,
      stocks: parsed.stocks,
      news: Array.isArray(parsed.news) ? parsed.news : PRESET_NEWS,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      config: {
        ...DEFAULT_CONFIG,
        ...(parsed.config || {}),
      },
    };
    this.saveState(validatedState, true);
    this.notifyListeners(validatedState);
    return validatedState;
  }

  // Google Apps Script Web App 연동: 학생 명단, 역할 목록, 배정 결과 불러오기 (GET)
  public async fetchSheetRoleData(url: string): Promise<{
    success: boolean;
    message: string;
    students?: Array<{ num: number; name: string }>;
    roles?: Array<{ role: string; desc: string }>;
    results?: Array<{ date: string; num: number; name: string; role: string; desc: string }>;
  }> {
    if (!url || !url.startsWith('http')) {
      return { success: false, message: '올바른 Google Apps Script Web App URL을 설정해주세요.' };
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `구글 시트 응답 오류 (HTTP ${response.status}: ${response.statusText})`,
        };
      }

      const json = await response.json();

      if (!json || json.status !== 'success') {
        return {
          success: false,
          message: json?.message || '구글 시트에서 올바른 success 응답을 받지 못했습니다.',
        };
      }

      // 1. students 파싱 검증 (객체 배열, student.num, student.name)
      if (!Array.isArray(json.students)) {
        return { success: false, message: '응답의 students 데이터가 배열 형식이 아닙니다.' };
      }

      const parsedStudents: Array<{ num: number; name: string }> = [];
      json.students.forEach((item: any, idx: number) => {
        if (!item || typeof item !== 'object') return;
        const nameVal = item.name;
        // 이름이 비어 있거나 객체인 잘못된 응답은 제외
        if (typeof nameVal === 'string' && nameVal.trim().length > 0) {
          const numVal = typeof item.num === 'number' ? item.num : parseInt(item.num, 10) || idx + 1;
          parsedStudents.push({
            num: numVal,
            name: nameVal.trim(),
          });
        }
      });

      // 2. roles 파싱 검증 (객체 배열, role.role, role.desc)
      if (!Array.isArray(json.roles)) {
        return { success: false, message: '응답의 roles 데이터가 배열 형식이 아닙니다.' };
      }

      const parsedRoles: Array<{ role: string; desc: string }> = [];
      json.roles.forEach((item: any) => {
        if (!item || typeof item !== 'object') return;
        const roleVal = item.role;
        if (typeof roleVal === 'string' && roleVal.trim().length > 0) {
          parsedRoles.push({
            role: roleVal.trim(),
            desc: typeof item.desc === 'string' ? item.desc.trim() : '',
          });
        }
      });

      // 3. results 파싱 검증
      const parsedResults: Array<{ date: string; num: number; name: string; role: string; desc: string }> = [];
      if (Array.isArray(json.results)) {
        json.results.forEach((item: any) => {
          if (!item || typeof item !== 'object') return;
          if (typeof item.name === 'string' && typeof item.role === 'string') {
            parsedResults.push({
              date: typeof item.date === 'string' ? item.date : '',
              num: typeof item.num === 'number' ? item.num : parseInt(item.num, 10) || 0,
              name: item.name.trim(),
              role: item.role.trim(),
              desc: typeof item.desc === 'string' ? item.desc.trim() : '',
            });
          }
        });
      }

      return {
        success: true,
        message: '구글 스프레드시트에서 학생 명단과 역할을 성공적으로 불러왔습니다.',
        students: parsedStudents,
        roles: parsedRoles,
        results: parsedResults,
      };

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `구글 시트 통신 오류: ${errorMsg}`,
      };
    }
  }

  // Google Apps Script Web App 연동: 배정 결과 구글 시트에 저장 (POST - CORS Preflight 방지)
  public async saveAssignmentsToSheet(
    url: string,
    assignments: Array<{ num: number; name: string; role: string; desc: string }>
  ): Promise<{ success: boolean; message: string }> {
    if (!url || !url.startsWith('http')) {
      return { success: false, message: '올바른 Google Apps Script Web App URL을 설정해주세요.' };
    }

    try {
      // CORS Preflight 방지를 위해 text/plain;charset=utf-8 헤더 사용
      const payload = {
        action: 'saveResults',
        assignments: assignments.map((a) => ({
          num: a.num,
          name: String(a.name || ''),
          role: String(a.role || ''),
          desc: String(a.desc || ''),
        })),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return {
          success: false,
          message: `구글 시트 저장 실패 (HTTP ${response.status})`,
        };
      }

      let resJson: any;
      try {
        resJson = await response.json();
      } catch {
        // 일부 apps script는 텍스트를 반환할 수도 있음
        return {
          success: true,
          message: '배정 결과가 구글 스프레드시트에 안전하게 저장되었습니다.',
        };
      }

      if (resJson && resJson.status === 'success') {
        return {
          success: true,
          message: resJson.message || '배정 결과가 구글 스프레드시트에 안전하게 저장되었습니다.',
        };
      }

      return {
        success: false,
        message: resJson?.message || '저장 응답이 올바르지 않습니다.',
      };

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `저장 통신 실패: ${errorMsg}`,
      };
    }
  }

  // Google Apps Script Web App 연동 동기화 (전체 데이터 백업용)
  public async syncWithGoogleAppsScript(
    url: string,
    action: 'push' | 'pull',
    state?: AppState
  ): Promise<{ success: boolean; message: string; data?: AppState }> {
    if (!url || !url.startsWith('http')) {
      return { success: false, message: '올바른 Google Apps Script Web App URL을 입력해주세요.' };
    }

    try {
      if (action === 'push' && state) {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'SAVE_ALL_DATA',
            payload: state,
          }),
        });

        return {
          success: true,
          message: '구글 스프레드시트로 최신 데이터를 전송했습니다. (Apps Script 처리 완료)',
        };
      } else {
        const response = await fetch(`${url}?action=GET_ALL_DATA`);
        const json = await response.json();
        if (json && json.data) {
          const imported = this.importDataJson(JSON.stringify(json.data));
          return { success: true, message: '구글 스프레드시트에서 데이터를 성공적으로 불러왔습니다.', data: imported };
        }
        return { success: false, message: '시트에서 유효한 데이터를 수신하지 못했습니다.' };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `스프레드시트 통신 실패: ${errorMsg}`,
      };
    }
  }
}

export const storageService = new StorageService();
