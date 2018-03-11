export interface ITrackAsyncOptions<T = any> {
    swallowCancelationException: boolean;
    onExecutionStart (target: T, methodName: keyof T, newRunningExecutionsCount: number): void;
    onExecutionEnd (target: T, methodName: keyof T, newRunningExecutionsCount: number, targetHasAnyExecutionsRunning: boolean): void;  
}

export const defaultTrackAsyncOptions: ITrackAsyncOptions = {
    swallowCancelationException: true,
    onExecutionStart: () => {},
    onExecutionEnd: () => {},
};

class TrackingData {
    public lastExecutionStartId: number = 0;
    public ongoingExecutionsCount: number = 0;
    public isLastStartStillExecuting: boolean = false;
}

let globalExecutionStartIdCounter = 1;

const executionTrackingMap = new Map<object, Map<string, TrackingData>>();

interface IExecutionStartResult {
    runId: number;
    trackingData: TrackingData;
}

function executionStarts(target: any, methodName: string, options: ITrackAsyncOptions): IExecutionStartResult {

    let allTrackingForTarget = executionTrackingMap.get(target);

    if (!allTrackingForTarget) {
        allTrackingForTarget = new Map<string, TrackingData>();
        executionTrackingMap.set(target, allTrackingForTarget);
    }

    let trackingForMethod = allTrackingForTarget.get(methodName);

    if (!trackingForMethod) {
        trackingForMethod  = new TrackingData();
        allTrackingForTarget.set(methodName, trackingForMethod);
    }

    trackingForMethod.ongoingExecutionsCount += 1;

    globalExecutionStartIdCounter += 1;

    trackingForMethod.lastExecutionStartId = globalExecutionStartIdCounter;

    trackingForMethod.isLastStartStillExecuting = true;

    options.onExecutionStart(target, methodName, trackingForMethod.ongoingExecutionsCount);

    return  {
        runId: trackingForMethod.lastExecutionStartId ,
        trackingData: trackingForMethod ,
    };
}

function executionEnds(target: any, methodName: string, executionStartId: number,  options: ITrackAsyncOptions) {
   
    const allTrackingForTarget =  executionTrackingMap.get(target);

    if (!allTrackingForTarget) {
        throw new Error(`Unexpected state: could not get tracking info for target instance`);
    }
   
    const trackingForMethod = allTrackingForTarget.get(methodName);

    if (!trackingForMethod) {
        throw new Error(`Unexpected state: could not get tracking info for method ${methodName}`);
    }

    trackingForMethod.ongoingExecutionsCount -= 1;

    if (trackingForMethod.lastExecutionStartId === executionStartId) {
        trackingForMethod.lastExecutionStartId = 0;
        trackingForMethod.isLastStartStillExecuting = false;
    }

    if (trackingForMethod.ongoingExecutionsCount === 0) {
        allTrackingForTarget.delete(methodName);
    }

    let targetHasMoreExecutionsRunning = true;
    if (allTrackingForTarget.size === 0) {
        executionTrackingMap.delete(allTrackingForTarget);
        targetHasMoreExecutionsRunning = false;
    }

    options.onExecutionEnd(target, methodName, trackingForMethod.ongoingExecutionsCount, targetHasMoreExecutionsRunning);
}

export const cancelationMessage = 'Async cancelation thrown.';

export const throwCancelationError = () => {throw new Error(cancelationMessage)};

export function getCurrentRunTracker<T>(target: T, methodName: keyof T) {

    const warningnMessage = 
    `This indicates a likely mistake, please make sure that a call to getCurrentRunTracker(intance, methodName) ` +
    `is the first line inside the method decorated with trackAsync. At the very least, ` + 
    `it should be called before first await or calls to other trackAsync methods.`;

    if (latestTrackAsyncTarget === undefined && latestTrackAsyncMethodName === undefined) {
        throw new Error('You are trying to get current run tracker while no run is starting' + warningnMessage );
    }

    if (target !== latestTrackAsyncTarget) {
        throw new Error('Target passed does not match context of currenly starting trackAsyn method' + warningnMessage );
    }

    if (methodName !== latestTrackAsyncMethodName) {
        throw new Error(`You are trying to get current run tracker for method ${methodName} ` +
                        `while currently starting method decorated with trackAsync is ${latestTrackAsyncMethodName}. ` +
                        warningnMessage );
    }

    if (!latestTracking) {
        throw new Error('Unexpected error, latest tracking is not available');
    }

    const tracking = latestTracking;

    const latestStartIdDuringTrackerCreation = tracking.lastExecutionStartId;

    const isRunStillLatest = () => tracking.lastExecutionStartId === latestStartIdDuringTrackerCreation;

    return {
        isRunStillLatest,
        throwIfRunNotLatest: () => {
            if (isRunStillLatest() === false) {
                throwCancelationError();
            }
        },
    };
}

let latestTrackAsyncTarget: object | undefined;
let latestTrackAsyncMethodName: string | undefined;
let latestTracking: TrackingData | undefined;

// tslint:disable-next-line:no-shadowed-variable
export function trackAsync(options?: Partial<ITrackAsyncOptions>) {

    const finalOptions = { ...defaultTrackAsyncOptions, ...options };

    return function(target: Object, key: string, descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>) {
        const originalFn = descriptor.value;

        if (typeof originalFn !== 'function') {
            throw new Error(`trackAsync decorator can only decorate functions. Invalid result for ${key}`);
        }

        descriptor.value = function() {
            const arg = arguments;

            const currentTarget = this;

            const startResult = executionStarts(currentTarget, key, finalOptions);

            latestTrackAsyncTarget = this;
            latestTrackAsyncMethodName = key;
            latestTracking = startResult.trackingData;
            
            const res1 = originalFn
                        .apply(this, arg)
                        .then(
                            (result: any) => {
                                executionEnds(currentTarget, key, startResult.runId, finalOptions);
                                return result;
                            },
                            (reason: any) => {
                                executionEnds(currentTarget, key, startResult.runId, finalOptions);
                                const shouldSwallow = finalOptions.swallowCancelationException;
                                const isAsyncCancelation = () => reason 
                                                                && (reason === cancelationMessage
                                                                    || reason.message === cancelationMessage);

                                if ( shouldSwallow && isAsyncCancelation()) {
                                    return undefined;
                                }
                                
                                return Promise.reject(reason);
                            });

            latestTrackAsyncTarget = undefined;
            latestTrackAsyncMethodName = undefined;
            latestTracking = undefined;

            return res1; 
        };
    };
}
