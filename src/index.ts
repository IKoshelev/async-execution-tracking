export async function foo() {
    return Promise.resolve(1);
}

type func = () => void;

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

function executionStarts(target: any, methodName: string, options: ITrackAsyncOptions): number {
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

    return currentTargetAndMethodTracking.lastExecutionStartId;
}

function executionEnd(target: any, methodName: string, executionStartId: number,  options: ITrackAsyncOptions) {
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

export function getCurrentRunTracker<T>(target: T, methodName: keyof T) {

    const warningnMessage = 
    `This indicates a likely mistake, please make sure that a call to getCurrentRunTracker(intance, methodName) ` +
    `is the first line inside the method decorated with trackAsync. At the very least, ` + 
    `it should be called before first await or calls to other trackAsync methods.`;

    if (target !== latestTrackAsyncTarget) {
        throw new Error('Target passed does not match context of currenly starting trackAsyn method' + warningnMessage );
    }

    if (methodName !== latestTrackAsyncMethodName) {
        throw new Error(`You are trying to get current run tracker for method ${methodName} ` +
                        `while currently starting method decorated with trackAsync is ${latestTrackAsyncMethodName}. ` +
                        warningnMessage );
    }

    const allTrackingForMethodName = executionTrackingDict[methodName];

    if (!allTrackingForMethodName) {
        throw new Error(`Unexpected state: could not get tracking info for method ${methodName}`);
    }

    const currentTargetAndMethodTracking = allTrackingForMethodName.find((x) => x.target === target);

    if (!currentTargetAndMethodTracking) {
        throw new Error(`Unexpected state: could not get tracking info for target instance`);
    }

    const latestRunIdDuringTrackerCreation = currentTargetAndMethodTracking.lastExecutionStartId;

    const isRunStillLatest = () => currentTargetAndMethodTracking.lastExecutionStartId === latestRunIdDuringTrackerCreation;

    return {
        isRunStillLatest,
        throwIfRunNotLatest: () => {
            if (isRunStillLatest() === false) {
                throw new Error(cancelationMessage);
            }
        },
    };
}

let latestTrackAsyncTarget: any = null;
let latestTrackAsyncMethodName: any = null;

// tslint:disable-next-line:no-shadowed-variable
export function trackAsync(options?: Partial<ITrackAsyncOptions>) {

    const finalOptions = { ...defaultTrackAsyncOptions, ...options };

    return function(target: Object, key: string | Symbol, descriptor: TypedPropertyDescriptor<Function>) {
        const originalFn = descriptor.value;

        if (typeof originalFn !== 'function') {
            throw new Error(`trackAsync decorator can only decorate functions. Invalid result for ${key}`);
        }

        descriptor.value = function() {
            const arg = arguments;

            const previousTrackAsyncTarget = latestTrackAsyncTarget;
            const previousTrackAsyncMethodName = latestTrackAsyncMethodName;

            latestTrackAsyncTarget = this;
            latestTrackAsyncMethodName = key;

            const res = originalFn
                        .apply(this, arg)
                        .then(
                            (result: any) => {

                                return result;
                            },
                            (reason: any) => {
                                
                                const shouldSwallow = finalOptions.swallowCancelationException;
                                const isAsyncCancelation = () => reason 
                                                                && (reason === cancelationMessage
                                                                    || reason.message === cancelationMessage);

                                if ( shouldSwallow && isAsyncCancelation()) {
                                    return undefined;
                                }
                                
                                return Promise.reject(reason);
                            });

            latestTrackAsyncTarget = previousTrackAsyncTarget;
            latestTrackAsyncMethodName = previousTrackAsyncMethodName;

            return res;
        };
    };
}
