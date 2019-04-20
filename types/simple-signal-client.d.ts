export = index;
declare class index {
  constructor(socket: any);
  id: any;
  socket: any;
  addListener(eventName: any, listener: any): any;
  connect(target: any, metadata: any, peerOptions: any): any;
  destroy(): void;
  discover(discoveryData: any): void;
  emit(eventName: any, ...args: any[]): any;
  listeners(eventName: any): any;
  on(eventName: any, listener: any): any;
  once(eventName: any, listener: any): any;
  peers(): any;
  prependListener(eventName: any, listener: any): any;
  prependOnceListener(eventName: any, listener: any): any;
  removeAllListeners(eventName: any): any;
  removeListener(eventName: any, listener: any): any;
}
declare namespace index {
  class SimplePeer {
    static WEBRTC_SUPPORT: boolean;
    static channelConfig: {};
    static config: {
      iceServers: {
        urls: any;
      }[];
      sdpSemantics: string;
    };
    constructor(opts: any);
    addListener(ev: any, fn: any): any;
    addStream(stream: any): void;
    addTrack(track: any, stream: any): void;
    addTransceiver(kind: any, init: any): void;
    address(): any;
    cork(): void;
    destroy(err: any): void;
    emit(type: any, args: any): any;
    end(chunk: any, encoding: any, cb: any): void;
    eventNames(): any;
    getMaxListeners(): any;
    getStats(cb: any): void;
    isPaused(): any;
    listenerCount(type: any): any;
    listeners(type: any): any;
    negotiate(): void;
    off(type: any, listener: any): any;
    on(ev: any, fn: any): any;
    once(type: any, listener: any): any;
    pause(): any;
    pipe(dest: any, pipeOpts: any): any;
    prependListener(type: any, listener: any): any;
    prependOnceListener(type: any, listener: any): any;
    push(chunk: any, encoding: any): any;
    rawListeners(type: any): any;
    read(n: any): any;
    removeAllListeners(type: any, ...args: any[]): any;
    removeListener(type: any, listener: any): any;
    removeStream(stream: any): void;
    removeTrack(track: any, stream: any): void;
    replaceTrack(oldTrack: any, newTrack: any, stream: any): void;
    resume(): any;
    send(chunk: any): void;
    setDefaultEncoding(encoding: any): any;
    setEncoding(enc: any): any;
    setMaxListeners(n: any): any;
    signal(data: any): void;
    uncork(): void;
    unpipe(dest: any): any;
    unshift(chunk: any): any;
    wrap(stream: any): any;
    write(chunk: any, encoding: any, cb: any): any;
  }
}
