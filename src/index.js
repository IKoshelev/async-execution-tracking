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
    function TrackingData(target) {
        this.lastExecutionStartId = 0;
        this.ongoingExecutionsCount = 0;
        this.isLastStartStillExecuting = false;
        this.target = target;
    }
    return TrackingData;
}());
var globalExecutionStartIdCounter = 1;
var executionTrackingDict = {};
function executionStarts(target, methodName, options) {
    var allTrackingForMethodName = executionTrackingDict[methodName];
    if (!allTrackingForMethodName) {
        allTrackingForMethodName = executionTrackingDict[methodName] = [];
    }
    var currentTargetAndMethodTracking = allTrackingForMethodName.find(function (x) { return x.target === target; });
    if (!currentTargetAndMethodTracking) {
        currentTargetAndMethodTracking = new TrackingData(target);
        allTrackingForMethodName.push(currentTargetAndMethodTracking);
    }
    currentTargetAndMethodTracking.ongoingExecutionsCount += 1;
    globalExecutionStartIdCounter += 1;
    currentTargetAndMethodTracking.lastExecutionStartId = globalExecutionStartIdCounter;
    currentTargetAndMethodTracking.isLastStartStillExecuting = true;
    return getRunIdAndTracker(currentTargetAndMethodTracking);
    function getRunIdAndTracker(trackingData) {
        var runId = trackingData.lastExecutionStartId;
        var isRunStillLatest = function () { return trackingData.lastExecutionStartId === runId; };
        var tracker = {
            isRunStillLatest: isRunStillLatest,
            throwIfRunNotLatest: function () {
                if (isRunStillLatest() === false) {
                    throw new Error(exports.cancelationMessage);
                }
            },
        };
        return {
            runId: runId,
            tracker: tracker,
        };
    }
}
function executionEnds(target, methodName, executionStartId, options) {
    var allTrackingForMethodName = executionTrackingDict[methodName];
    if (!allTrackingForMethodName) {
        throw new Error("Unexpected state: could not get tracking info for method " + methodName);
    }
    var currentTargetAndMethodTracking = allTrackingForMethodName.find(function (x) { return x.target === target; });
    if (!currentTargetAndMethodTracking) {
        throw new Error("Unexpected state: could not get tracking info for target instance");
    }
    currentTargetAndMethodTracking.ongoingExecutionsCount -= 1;
    if (currentTargetAndMethodTracking.lastExecutionStartId === executionStartId) {
        currentTargetAndMethodTracking.lastExecutionStartId = 0;
        currentTargetAndMethodTracking.isLastStartStillExecuting = false;
    }
    if (currentTargetAndMethodTracking.ongoingExecutionsCount === 0) {
        var arrWithoutCurrTarget = allTrackingForMethodName.splice(allTrackingForMethodName.indexOf(currentTargetAndMethodTracking), 1);
        if (arrWithoutCurrTarget.length > 0) {
            executionTrackingDict[methodName] = arrWithoutCurrTarget;
        }
        else {
            delete executionTrackingDict[methodName];
        }
    }
}
exports.cancelationMessage = 'Async cancelation thrown.';
function trackAsync(options) {
    var finalOptions = __assign({}, exports.defaultTrackAsyncOptions, options);
    return function (target, key, descriptor) {
        var originalFn = descriptor.value;
        if (typeof originalFn !== 'function') {
            throw new Error("trackAsync decorator can only decorate functions. Invalid result for " + key);
        }
        descriptor.value = function () {
            var arg = arguments;
            var fnObjectOnTarget = this[key];
            var previousTracker = fnObjectOnTarget.currentRunTracker;
            var executionStartResult = executionStarts(this, key, finalOptions);
            fnObjectOnTarget.currentRunTracker = executionStartResult.tracker;
            var res = originalFn
                .apply(this, arg)
                .then(function (result) {
                executionEnds(target, key, executionStartResult.runId, finalOptions);
                return result;
            }, function (reason) {
                executionEnds(target, key, executionStartResult.runId, finalOptions);
                var shouldSwallow = finalOptions.swallowCancelationException;
                var isAsyncCancelation = function () { return reason
                    && (reason === exports.cancelationMessage
                        || reason.message === exports.cancelationMessage); };
                if (shouldSwallow && isAsyncCancelation()) {
                    return undefined;
                }
                return Promise.reject(reason);
            });
            if (previousTracker) {
                fnObjectOnTarget.currentRunTracker = previousTracker;
            }
            else {
                delete fnObjectOnTarget.currentRunTracker;
            }
            return res;
        };
    };
}
exports.trackAsync = trackAsync;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBVWEsUUFBQSx3QkFBd0IsR0FBdUI7SUFDeEQsMkJBQTJCLEVBQUUsSUFBSTtDQUNwQyxDQUFDO0FBRUY7SUFLSSxzQkFBWSxNQUFXO1FBSGhCLHlCQUFvQixHQUFXLENBQUMsQ0FBQztRQUNqQywyQkFBc0IsR0FBVyxDQUFDLENBQUM7UUFDbkMsOEJBQXlCLEdBQVksS0FBSyxDQUFDO1FBRTlDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3pCLENBQUM7SUFDTCxtQkFBQztBQUFELENBQUMsQUFSRCxJQVFDO0FBRUQsSUFBSSw2QkFBNkIsR0FBRyxDQUFDLENBQUM7QUFFdEMsSUFBTSxxQkFBcUIsR0FBNkMsRUFBRSxDQUFDO0FBTzNFLHlCQUF5QixNQUFXLEVBQUUsVUFBa0IsRUFBRSxPQUEyQjtJQUNqRixJQUFJLHdCQUF3QixHQUFHLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRWpFLEVBQUUsQ0FBQyxDQUFDLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1FBQzVCLHdCQUF3QixHQUFJLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUN2RSxDQUFDO0lBRUQsSUFBSSw4QkFBOEIsR0FBRyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsTUFBTSxLQUFLLE1BQU0sRUFBbkIsQ0FBbUIsQ0FBQyxDQUFDO0lBRS9GLEVBQUUsQ0FBQyxDQUFDLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLDhCQUE4QixHQUFHLElBQUksWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFELHdCQUF3QixDQUFDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRCw4QkFBOEIsQ0FBQyxzQkFBc0Is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