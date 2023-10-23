import type { Constructor } from 'lowclass';
export declare function Eventful<T extends Constructor>(Base?: T): {
    new (...a: any[]): {
        on(eventName: string, callback: Function, context?: any): void;
        off(eventName: string, callback?: Function | undefined, context?: any): void;
        emit(eventName: string, data?: any): void;
        "__#1@#eventMap": Map<string, Array<[Function, any]>> | null;
    };
} & T;
export declare function emits(eventName: string): any;
//# sourceMappingURL=Eventful.d.ts.map