import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type ViewKey = 'home' | 'paytax' | 'mortgage' | 'super';

export interface AppState {
  view: ViewKey;
}

const defaultState: AppState = {
  view: 'home'
};

const encodeState = (state: AppState) => {
  const json = JSON.stringify(state);
  return typeof window !== 'undefined' ? window.btoa(encodeURIComponent(json)) : json;
};

const decodeState = (value: string): AppState => {
  try {
    const decoded = decodeURIComponent(typeof window !== 'undefined' ? window.atob(value) : value);
    const parsed = JSON.parse(decoded);
    return { ...defaultState, ...parsed };
  } catch (error) {
    console.warn('Failed to decode state param, falling back to defaults', error);
    return defaultState;
  }
};

export const useAppStateParam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('state');

  const state = useMemo(() => {
    if (!raw) return defaultState;
    return decodeState(raw);
  }, [raw]);

  const setState = useCallback((nextState: Partial<AppState>) => {
    const merged = { ...state, ...nextState } as AppState;
    const encoded = encodeState(merged);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('state', encoded);
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, state]);

  return [state, setState, Boolean(raw)] as const;
};
