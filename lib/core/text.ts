/** Fills {placeholders} in an English template. The interface translates the template first. */
export type Params = Record<string, string | number>;
export const fill = (tpl: string, p: Params = {}) => tpl.replace(/\{(\w+)\}/g, (_, k) => (k in p ? String(p[k]) : `{${k}}`));
export interface Msg { k: string; p?: Params }
