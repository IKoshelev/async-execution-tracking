
// tslint:disable-next-line:interface-name
export declare interface Function {
    currentRunTracker: ICurrentRunTracker;
}

export interface ITrackAsyncOptions {
    swallowCancelationException: boolean;
}

export const defaultTrackAsyncOptions: ITrackAsyncOptions = {
    swallowCancelationException: true,
};

class TrackingData {
    public target: any;
    public lastExecutionStartId: number = 0;
    public ongoingExecutionsCount: number = 0;
    public isLastStartStillExecuting: boolean = false;
    constructor(target: any) {
        this.target = target;
    }
}

let globalExecutionStartIdCounter = 1;

const executionTrackingDict: { [methodName: string]: TrackingData[] } = {};

interface IExecutioStartResult { 
    runId: number;
    tracker: ICurrentRunTracker;
}

function executionStarts(target: any, methodName: string, options: ITrackAsyncOptions): IExecutioStartResult {
    let allTrackingForMethodName = executionTrackingDict[methodName];

    if (!allTrackingForMethodName) {
        allTrackingForMethodName =  executionTrackingDict[methodName] = [];
    }

    let currentTargetAndMethodTracking = allTrackingForMethodName.find((x) => x.target === target);

    if (!currentTargetAndMethodTracking) {
        currentTargetAndMethodTracking = new TrackingData(target);
        allTrackingForMethodName.push(currentTargetAndMethodTracking);
    }

    currentTargetAndMethodTracking.ongoingExecutionsCount += 1;

    globalExecutionStartIdCounter += 1;

    currentTargetAndMethodTracking.lastExecutionStartId = globalExecutionStartIdCounter;

    currentTargetAndMethodTracking.isLastStartStillExecuting = true;
    
    return getRunIdAndTracker(currentTargetAndMethodTracking);

    function getRunIdAndTracker(trackingData: TrackingData) {

        const runId = trackingData.lastExecutionStartId;

        const isRunStillLatest = () => trackingData.lastExecutionStartId === runId;

        const tracker: ICurrentRunTracker =  {
            isRunStillLatest,
            throwIfRunNotLatest: () => {
                if (isRunStillLatest() === false) {
                    throw new Error(cancelationMessage);
                }
            },
        };
    
        return { 
            runId ,
            tracker ,
        };
    }
}

function executionEnds(target: any, methodName: string, executionStartId: number,  options: ITrackAsyncOptions) {
    const allTrackingForMethodName = executionTrackingDict[methodName];

    if (!allTrackingForMethodName) {
        throw new Error(`Unexpected state: could not get tracking info for method ${methodName}`);
    }

    const currentTargetAndMethodTracking = allTrackingForMethodName.find((x) => x.target === target);

    if (!currentTargetAndMethodTracking) {
        throw new Error(`Unexpected state: could not get tracking info for target instance`);
    }

    currentTargetAndMethodTracking.ongoingExecutionsCount -= 1;

    if (currentTargetAndMethodTracking.lastExecutionStartId === executionStartId) {
        currentTargetAndMethodTracking.lastExecutionStartId = 0;
        currentTargetAndMethodTracking.isLastStartStillExecuting = false;
    }

    if (currentTargetAndMethodTracking.ongoingExecutionsCount === 0) {
        const arrWithoutCurrTarget =  allTrackingForMethodName.splice(allTrackingForMethodName.indexOf(currentTargetAndMethodTracking), 1);
        if (arrWithoutCurrTarget.length > 0) {
            executionTrackingDict[methodName] = arrWithoutCurrTarget;
        } else {
            delete executionTrackingDict[methodName];
        }
    }
}

export const cancelationMessage = 'Async cancelation thrown.';

export interface ICurrentRunTracker {
    isRunStillLatest: () => boolean;
    throwIfRunNotLatest: () => void;
}

export function trackAsync(options?: Partial<ITrackAsyncOptions>) {

    const finalOptions = { ...defaultTrackAsyncOptions, ...options };

    return function(target: Object, key: string, descriptor: TypedPropertyDescriptor<() => Promise<any>>) {
        const originalFn = descriptor.value;

        if (typeof originalFn !== 'function') {
            throw new Error(`trackAsync decorator can only decorate functions. Invalid result for ${key}`);
        }

        descriptor.value = function() {
            const arg = arguments;

            const fnObjectOnTarget =  ((this as any) [key] as Function);
            const previousTracker = fnObjectOnTarget.currentRunTracker;

            const executionStartResult = executionStarts(this, key, finalOptions);

            fnObjectOnTarget.currentRunTracker = executionStartResult.tracker;

            const res = originalFn
                        .apply(this, arg)
                        .then(
                            (result: any) => {
                                executionEnds(target, key, executionStartResult.runId, finalOptions);
                                return result;
                            },
                            (reason: any) => {
                                executionEnds(target, key, executionStartResult.runId, finalOptions);
                                const shouldSwallow = finalOptions.swallowCancelationException;
                                const isAsyncCancelation = () => reason 
                                                                && (reason === cancelationMessage
                                                                    || reason.message === cancelationMessage);

                                if ( shouldSwallow && isAsyncCancelation()) {
                                    return undefined;
                                }
                                
                                return Promise.reject(reason);
                            });

            fnObjectOnTarget.currentRunTracker = previousTracker;

            return res;
        };
    };
}
