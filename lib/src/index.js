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
    onExecutionStart: function () { },
    onExecutionEnd: function () { },
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
    options.onExecutionStart(target, methodName, trackingForMethod.ongoingExecutionsCount);
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
    var targetHasMoreExecutionsRunning = true;
    if (allTrackingForTarget.size === 0) {
        executionTrackingMap.delete(allTrackingForTarget);
        targetHasMoreExecutionsRunning = false;
    }
    options.onExecutionEnd(target, methodName, trackingForMethod.ongoingExecutionsCount, targetHasMoreExecutionsRunning);
}
exports.cancelationMessage = 'Async cancelation thrown.';
exports.throwCancelationError = function () { throw new Error(exports.cancelationMessage); };
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
                exports.throwCancelationError();
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
            var currentTarget = this;
            var startResult = executionStarts(currentTarget, key, finalOptions);
            latestTrackAsyncTarget = this;
            latestTrackAsyncMethodName = key;
            latestTracking = startResult.trackingData;
            var res1 = originalFn
                .apply(this, arg)
                .then(function (result) {
                executionEnds(currentTarget, key, startResult.runId, finalOptions);
                return result;
            }, function (reason) {
                executionEnds(currentTarget, key, startResult.runId, finalOptions);
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
//# sourceMappingURL=index.js.map