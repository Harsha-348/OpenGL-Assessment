// Type definitions for Web Workers
declare module '*.worker.ts' {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

// Add types for the worker context
declare const self: WorkerGlobalScope;

// Allow TypeScript to understand the worker file as a module
export {};
