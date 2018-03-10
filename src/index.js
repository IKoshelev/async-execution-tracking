"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
function foo() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Promise.resolve(1)];
        });
    });
}
exports.foo = foo;
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
    return currentTargetAndMethodTracking.lastExecutionStartId;
}
function executionEnd(target, methodName, executionStartId, options) {
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
function getCurrentRunTracker(target, methodName) {
    var warningnMessage = "This indicates a likely mistake, please make sure that a call to getCurrentRunTracker(intance, methodName) " +
        "is the first line inside the method decorated with trackAsync. At the very least, " +
        "it should be called before first await or calls to other trackAsync methods.";
    if (target !== latestTrackAsyncTarget) {
        throw new Error('Target passed does not match context of currenly starting trackAsyn method' + warningnMessage);
    }
    if (methodName !== latestTrackAsyncMethodName) {
        throw new Error("You are trying to get current run tracker for method " + methodName + " " +
            ("while currently starting method decorated with trackAsync is " + latestTrackAsyncMethodName + ". ") +
            warningnMessage);
    }
    var allTrackingForMethodName = executionTrackingDict[methodName];
    if (!allTrackingForMethodName) {
        throw new Error("Unexpected state: could not get tracking info for method " + methodName);
    }
    var currentTargetAndMethodTracking = allTrackingForMethodName.find(function (x) { return x.target === target; });
    if (!currentTargetAndMethodTracking) {
        throw new Error("Unexpected state: could not get tracking info for target instance");
    }
    var latestRunIdDuringTrackerCreation = currentTargetAndMethodTracking.lastExecutionStartId;
    var isRunStillLatest = function () { return currentTargetAndMethodTracking.lastExecutionStartId === latestRunIdDuringTrackerCreation; };
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
var latestTrackAsyncTarget = null;
var latestTrackAsyncMethodName = null;
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
            var previousTrackAsyncTarget = latestTrackAsyncTarget;
            var previousTrackAsyncMethodName = latestTrackAsyncMethodName;
            latestTrackAsyncTarget = this;
            latestTrackAsyncMethodName = key;
            var res = originalFn
                .apply(this, arg)
                .then(function (result) {
                return result;
            }, function (reason) {
                var shouldSwallow = finalOptions.swallowCancelationException;
                var isAsyncCancelation = function () { return reason
                    && (reason === exports.cancelationMessage
                        || reason.message === exports.cancelationMessage); };
                if (shouldSwallow && isAsyncCancelation()) {
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
exports.trackAsync = trackAsync;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7O1lBQ0ksc0JBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQzs7O0NBQzdCO0FBRkQsa0JBRUM7QUFRWSxRQUFBLHdCQUF3QixHQUF1QjtJQUN4RCwyQkFBMkIsRUFBRSxJQUFJO0NBQ3BDLENBQUM7QUFFRjtJQUtJLHNCQUFZLE1BQVc7UUFIaEIseUJBQW9CLEdBQVcsQ0FBQyxDQUFDO1FBQ2pDLDJCQUFzQixHQUFXLENBQUMsQ0FBQztRQUNuQyw4QkFBeUIsR0FBWSxLQUFLLENBQUM7UUFFOUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDekIsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0FBQyxBQVJELElBUUM7QUFFRCxJQUFJLDZCQUE2QixHQUFHLENBQUMsQ0FBQztBQUV0QyxJQUFNLHFCQUFxQixHQUE2QyxFQUFFLENBQUM7QUFFM0UseUJBQXlCLE1BQVcsRUFBRSxVQUFrQixFQUFFLE9BQTJCO0lBQ2pGLElBQUksd0JBQXdCLEdBQUcscUJBQXFCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFakUsRUFBRSxDQUFDLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7UUFDNUIsd0JBQXdCLEdBQUkscUJBQXFCLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3ZFLENBQUM7SUFFRCxJQUFJLDhCQUE4QixHQUFHLHdCQUF3QixDQUFDLElBQUksQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxNQUFNLEtBQUssTUFBTSxFQUFuQixDQUFtQixDQUFDLENBQUM7SUFFL0YsRUFBRSxDQUFDLENBQUMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUM7UUFDbEMsOEJBQThCLEdBQUcsSUFB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