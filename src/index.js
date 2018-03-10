"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTrackAsyncOptions = {
    swallowCancelationException: true,
};
var TrackingData = /** @class */ (function () {
    function TrackingData() {
        this.lastExecutionStartId = 0;
        this.ongoingExecutionsCount = 0;
        this.isLastStartStillExecuting = false;
    }
    return TrackingData;
}());
var globalExecutionStartIdCounter = 1;
var executionTrackingMap = new Map();
function executionStarts(target, methodName, options) {
    var allTrackingForTarget = executionTrackingMap.get(target);
    if (!allTrackingForTarget) {
        allTrackingForTarget = new Map();
        executionTrackingMap.set(target, allTrackingForTarget);
    }
    var trackingForMethod = allTrackingForTarget.get(methodName);
    if (!trackingForMethod) {
        trackingForMethod = new TrackingData();
        allTrackingForTarget.set(methodName, trackingForMethod);
    }
    trackingForMethod.ongoingExecutionsCount += 1;
    globalExecutionStartIdCounter += 1;
    trackingForMethod.lastExecutionStartId = globalExecutionStartIdCounter;
    trackingForMethod.isLastStartStillExecuting = true;
    return {
        runId: trackingForMethod.lastExecutionStartId,
        trackingData: trackingForMethod,
    };
}
function executionEnds(target, methodName, executionStartId, options) {
    var allTrackingForTarget = executionTrackingMap.get(target);
    if (!allTrackingForTarget) {
        throw new Error("Unexpected state: could not get tracking info for target instance");
    }
    var trackingForMethod = allTrackingForTarget.get(methodName);
    if (!trackingForMethod) {
        throw new Error("Unexpected state: could not get tracking info for method " + methodName);
    }
    trackingForMethod.ongoingExecutionsCount -= 1;
    if (trackingForMethod.lastExecutionStartId === executionStartId) {
        trackingForMethod.lastExecutionStartId = 0;
        trackingForMethod.isLastStartStillExecuting = false;
    }
    if (trackingForMethod.ongoingExecutionsCount === 0) {
        allTrackingForTarget.delete(methodName);
    }
    if (allTrackingForTarget.size === 0) {
        executionTrackingMap.delete(allTrackingForTarget);
    }
}
exports.cancelationMessage = 'Async cancelation thrown.';
function getCurrentRunTracker(target, methodName) {
    var warningnMessage = "This indicates a likely mistake, please make sure that a call to getCurrentRunTracker(intance, methodName) " +
        "is the first line inside the method decorated with trackAsync. At the very least, " +
        "it should be called before first await or calls to other trackAsync methods.";
    if (latestTrackAsyncTarget === undefined && latestTrackAsyncMethodName === undefined) {
        throw new Error('You are trying to get current run tracker while no run is starting' + warningnMessage);
    }
    if (target !== latestTrackAsyncTarget) {
        throw new Error('Target passed does not match context of currenly starting trackAsyn method' + warningnMessage);
    }
    if (methodName !== latestTrackAsyncMethodName) {
        throw new Error("You are trying to get current run tracker for method " + methodName + " " +
            ("while currently starting method decorated with trackAsync is " + latestTrackAsyncMethodName + ". ") +
            warningnMessage);
    }
    if (!latestTracking) {
        throw new Error('Unexpected error, latest tracking is not available');
    }
    var tracking = latestTracking;
    var latestStartIdDuringTrackerCreation = tracking.lastExecutionStartId;
    var isRunStillLatest = function () { return tracking.lastExecutionStartId === latestStartIdDuringTrackerCreation; };
    return {
        isRunStillLatest: isRunStillLatest,
        throwIfRunNotLatest: function () {
            if (isRunStillLatest() === false) {
                throw new Error(exports.cancelationMessage);
            }
        },
    };
}
exports.getCurrentRunTracker = getCurrentRunTracker;
var latestTrackAsyncTarget;
var latestTrackAsyncMethodName;
var latestTracking;
// tslint:disable-next-line:no-shadowed-variable
function trackAsync(options) {
    var finalOptions = __assign({}, exports.defaultTrackAsyncOptions, options);
    return function (target, key, descriptor) {
        var originalFn = descriptor.value;
        if (typeof originalFn !== 'function') {
            throw new Error("trackAsync decorator can only decorate functions. Invalid result for " + key);
        }
        descriptor.value = function () {
            var arg = arguments;
            var startResult = executionStarts(target, key, finalOptions);
            latestTrackAsyncTarget = this;
            latestTrackAsyncMethodName = key;
            latestTracking = startResult.trackingData;
            var res1 = originalFn
                .apply(this, arg)
                .then(function (result) {
                executionEnds(target, key, startResult.runId, finalOptions);
                return result;
            }, function (reason) {
                executionEnds(target, key, startResult.runId, finalOptions);
                var shouldSwallow = finalOptions.swallowCancelationException;
                var isAsyncCancelation = function () { return reason
                    && (reason === exports.cancelationMessage
                        || reason.message === exports.cancelationMessage); };
                if (shouldSwallow && isAsyncCancelation()) {
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
exports.trackAsync = trackAsync;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBSWEsUUFBQSx3QkFBd0IsR0FBdUI7SUFDeEQsMkJBQTJCLEVBQUUsSUFBSTtDQUNwQyxDQUFDO0FBRUY7SUFBQTtRQUNXLHlCQUFvQixHQUFXLENBQUMsQ0FBQztRQUNqQywyQkFBc0IsR0FBVyxDQUFDLENBQUM7UUFDbkMsOEJBQXlCLEdBQVksS0FBSyxDQUFDO0lBQ3RELENBQUM7SUFBRCxtQkFBQztBQUFELENBQUMsQUFKRCxJQUlDO0FBRUQsSUFBSSw2QkFBNkIsR0FBRyxDQUFDLENBQUM7QUFFdEMsSUFBTSxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBcUMsQ0FBQztBQU8xRSx5QkFBeUIsTUFBVyxFQUFFLFVBQWtCLEVBQUUsT0FBMkI7SUFFakYsSUFBSSxvQkFBb0IsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFNUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFDeEIsb0JBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQXdCLENBQUM7UUFDdkQsb0JBQW9CLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRCxJQUFJLGlCQUFpQixHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUU3RCxFQUFFLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztRQUNyQixpQkFBaUIsR0FBSSxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQ3hDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsaUJBQWlCLENBQUMsc0JBQXNCLElBQUksQ0FBQyxDQUFDO0lBRTlDLDZCQUE2QixJQUFJLENBQUMsQ0FB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