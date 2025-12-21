import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
const defaultState = {
    view: 'home'
};
const encodeState = (state) => {
    const json = JSON.stringify(state);
    return typeof window !== 'undefined' ? window.btoa(encodeURIComponent(json)) : json;
};
const decodeState = (value) => {
    try {
        const decoded = decodeURIComponent(typeof window !== 'undefined' ? window.atob(value) : value);
        const parsed = JSON.parse(decoded);
        return { ...defaultState, ...parsed };
    }
    catch (error) {
        console.warn('Failed to decode state param, falling back to defaults', error);
        return defaultState;
    }
};
export const useAppStateParam = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const raw = searchParams.get('state');
    const state = useMemo(() => {
        if (!raw)
            return defaultState;
        return decodeState(raw);
    }, [raw]);
    const setState = useCallback((nextState) => {
        const merged = { ...state, ...nextState };
        const encoded = encodeState(merged);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('state', encoded);
        setSearchParams(nextParams, { replace: true });
    }, [searchParams, setSearchParams, state]);
    return [state, setState, Boolean(raw)];
};
