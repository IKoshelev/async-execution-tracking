export interface ITrackAsyncOptions<T = any> {
    swallowCancelationException: boolean;
    onExecutionStart(target: T, methodName: keyof T, newRunningExecutionsCount: number): void;
    onExecutionEnd(target: T, methodName: keyof T, newRunningExecutionsCount: number, targetHasAnyExecutionsRunning: boolean): void;
}
export declare const defaultTrackAsyncOptions: ITrackAsyncOptions;
export declare const cancelationMessage = "Async cancelation thrown.";
export declare const throwCancelationError: () => never;
export declare function getCurrentRunTracker<T>(target: T, methodName: keyof T): {
    isRunStillLatest: () => boolean;
    throwIfRunNotLatest: () => void;
};
export declare function trackAsync(options?: Partial<ITrackAsyncOptions>): (target: Object, key: string, descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>) => void;
