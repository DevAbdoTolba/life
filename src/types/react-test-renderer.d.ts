/**
 * Minimal type declaration for react-test-renderer.
 * Prevents TS7016 error in node jest environment where @types/react-test-renderer is unavailable.
 */
declare module 'react-test-renderer' {
  export function create(element: any, options?: any): any;
  export function act(callback: () => any): any;
}
