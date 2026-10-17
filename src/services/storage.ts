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

  // Google Apps Script Web App 연동 동기화
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
        const response = await fetch(url, {
          method: 'POST',
          mode: 'no-cors', // Apps script CORS handles via text/plain or no-cors
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
        // pull action
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
