import _workletUrl from './dough-worklet.mjs?url'; // todo: change ?url to ?audioworklet before build (?audioworklet doesn't hot reload)

export * from './dough.mjs';
export const workletUrl = _workletUrl;
