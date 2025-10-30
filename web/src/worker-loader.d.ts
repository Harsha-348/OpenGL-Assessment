declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}

declare module '!!../node_modules/worker-loader/dist/runtime/inline.js' {
  const content: string;
  export default content;
}
