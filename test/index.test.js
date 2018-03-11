"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var index_1 = require("./../src/index");
var delay = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
var expectNotToGetToThisLine = function () { return chai_1.expect.fail('Execution should not get to this line, ' +
    'one of the previous statements should have thrown an exception.'); };
var normalReturnA = 5;
var normalReturnB = 7;
describe('For @trackAsync decorated methods ', function () {
    describe(' every new execution is tracked and it ', function () {
        var TestSubject = /** @class */ (function () {
            function TestSubject() {
            }
            TestSubject.prototype.methodCancelsNonLatestAndSwallowsError = function (finalAction) {
                return __awaiter(this, void 0, void 0, function () {
                    var asyncRunTracker;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                asyncRunTracker = index_1.getCurrentRunTracker(this, 'methodCancelsNonLatestAndSwallowsError');
                                return [4 /*yield*/, delay(25)];
                            case 1:
                                _a.sent();
                                asyncRunTracker.throwIfRunNotLatest();
                                finalAction && finalAction();
                                return [2 /*return*/, normalReturnA];
                        }
                    });
                });
            };
            TestSubject.prototype.methodCancelsNonLatestAndDoesNotSwallowsError = function (finalAction) {
                return __awaiter(this, void 0, void 0, function () {
                    var asyncRunTracker;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                asyncRunTracker = index_1.getCurrentRunTracker(this, 'methodCancelsNonLatestAndDoesNotSwallowsError');
                                return [4 /*yield*/, delay(25)];
                            case 1:
                                _a.sent();
                                asyncRunTracker.throwIfRunNotLatest();
                                finalAction && finalAction();
                                return [2 /*return*/, normalReturnB];
                        }
                    });
                });
            };
            __decorate([
                index_1.trackAsync(),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Function]),
                __metadata("design:returntype", Promise)
            ], TestSubject.prototype, "methodCancelsNonLatestAndSwallowsError", null);
            __decorate([
                index_1.trackAsync({ swallowCancelationException: false }),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Function]),
                __metadata("design:returntype", Promise)
            ], TestSubject.prototype, "methodCancelsNonLatestAndDoesNotSwallowsError", null);
            return TestSubject;
        }());
        var subject = new TestSubject();
        afterEach(function () {
            subject = new TestSubject();
        });
        it('will run to completion normally', function () { return __awaiter(_this, void 0, void 0, function () {
            var finished, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        finished = false;
                        return [4 /*yield*/, subject.methodCancelsNonLatestAndSwallowsError(function () { return finished = true; })];
                    case 1:
                        res = _a.sent();
                        chai_1.expect(finished).to.equal(true);
                        chai_1.expect(res).to.equal(normalReturnA);
                        return [2 /*return*/];
                }
            });
        }); });
        it('allows tracking and cancelation if same method was run again on the instance', function () { return __awaiter(_this, void 0, void 0, function () {
            var counter, p1, p2, _a, res1, res2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        counter = 0;
                        p1 = subject.methodCancelsNonLatestAndSwallowsError(function () { return counter += 1; });
                        p2 = subject.methodCancelsNonLatestAndSwallowsError(function () { return counter += 1; });
                        return [4 /*yield*/, Promise.all([p1, p2])];
                    case 1:
                        _a = _b.sent(), res1 = _a[0], res2 = _a[1];
                        chai_1.expect(res1).to.equal(undefined);
                        chai_1.expect(res2).to.equal(normalReturnA);
                        chai_1.expect(counter).to.equal(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it('different methods on same instance don\'t interfiere with each other', function () { return __awaiter(_this, void 0, void 0, function () {
            var counter, p1, p2, _a, res1, res2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        counter = 0;
                        p1 = subject.methodCancelsNonLatestAndSwallowsError(function () { return counter += 1; });
                        p2 = subject.methodCancelsNonLatestAndDoesNotSwallowsError(function () { return counter += 1; });
                        return [4 /*yield*/, Promise.all([p1, p2])];
                    case 1:
                        _a = _b.sent(), res1 = _a[0], res2 = _a[1];
                        chai_1.expect(res1).to.equal(normalReturnA);
                        chai_1.expect(res2).to.equal(normalReturnB);
                        chai_1.expect(counter).to.equal(2);
                        return [2 /*return*/];
                }
            });
        }); });
        it('same methods on different instances don\'t interfiere with each other', function () { return __awaiter(_this, void 0, void 0, function () {
            var counter, p1, p2, _a, res1, res2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        counter = 0;
                        p1 = subject.methodCancelsNonLatestAndSwallowsError(function () { return counter += 1; });
                        p2 = new TestSubject().methodCancelsNonLatestAndSwallowsError(function () { return counter += 1; });
                        return [4 /*yield*/, Promise.all([p1, p2])];
                    case 1:
                        _a = _b.sent(), res1 = _a[0], res2 = _a[1];
                        chai_1.expect(res1).to.equal(normalReturnA);
                        chai_1.expect(res2).to.equal(normalReturnA);
                        chai_1.expect(counter).to.equal(2);
                        return [2 /*return*/];
                }
            });
        }); });
        it('can be configured not to swallow cancelation exception', function () { return __awaiter(_this, void 0, void 0, function () {
            var counter, cancelationWasNotSallowed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        counter = 0;
                        cancelationWasNotSallowed = false;
                        subject.methodCancelsNonLatestAndDoesNotSwallowsError(function () { return counter += 1; })
                            .catch(function () { return cancelationWasNotSallowed = true; });
                        return [4 /*yield*/, subject.methodCancelsNonLatestAndDoesNotSwallowsError(function () { return counter += 1; })];
                    case 1:
                        _a.sent();
                        chai_1.expect(counter).to.equal(1);
                        chai_1.expect(cancelationWasNotSallowed).to.equal(true);
                        return [2 /*return*/];
                }
            });
        }); });
        it('does not swallow non-cancelation exceptions', function () { return __awaiter(_this, void 0, void 0, function () {
            var errorWasNotSallowed, marker, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        errorWasNotSallowed = false;
                        marker = "marker777";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, subject.methodCancelsNonLatestAndSwallowsError(function () { throw new Error(marker); })];
                    case 2:
                        _a.sent();
                        expectNotToGetToThisLine();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        errorWasNotSallowed = true;
                        chai_1.expect(e_1.message).to.equal(marker);
                        return [3 /*break*/, 4];
                    case 4:
                        chai_1.expect(errorWasNotSallowed).to.equal(true);
                        return [2 /*return*/];
                }
            });
        }); });
        it('will warn if tracker retireved for wrong method / instance or too late', function () { return __awaiter(_this, void 0, void 0, function () {
            var Subject, s, e_2, e_3, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        Subject = /** @class */ (function () {
                            function Subject() {
                            }
                            Subject.prototype.wrongMethod = function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        index_1.getCurrentRunTracker(this, 'decoy');
                                        return [2 /*return*/];
                                    });
                                });
                            };
                            Subject.prototype.wrongTarget = function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        index_1.getCurrentRunTracker(new Subject(), 'wrongTarget');
                                        return [2 /*return*/];
                                    });
                                });
                            };
                            Subject.prototype.retrievedTooLate = function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, delay(25)];
                                            case 1:
                                                _a.sent();
                                                index_1.getCurrentRunTracker(new Subject(), 'retrievedTooLate');
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            };
                            Subject.prototype.decoy = function () { };
                            __decorate([
                                index_1.trackAsync(),
                                __metadata("design:type", Function),
                                __metadata("design:paramtypes", []),
                                __metadata("design:returntype", Promise)
                            ], Subject.prototype, "wrongMethod", null);
                            __decorate([
                                index_1.trackAsync(),
                                __metadata("design:type", Function),
                                __metadata("design:paramtypes", []),
                                __metadata("design:returntype", Promise)
                            ], Subject.prototype, "wrongTarget", null);
                            __decorate([
                                index_1.trackAsync(),
                                __metadata("design:type", Function),
                                __metadata("design:paramtypes", []),
                                __metadata("design:returntype", Promise)
                            ], Subject.prototype, "retrievedTooLate", null);
                            return Subject;
                        }());
                        s = new Subject();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, s.wrongMethod()];
                    case 2:
                        _a.sent();
                        expectNotToGetToThisLine();
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _a.sent();
                        chai_1.expect(e_2.message.startsWith('You are trying to get current run tracker for method decoy')).to.equal(true);
                        return [3 /*break*/, 4];
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, s.wrongTarget()];
                    case 5:
                        _a.sent();
                        expectNotToGetToThisLine();
                        return [3 /*break*/, 7];
                    case 6:
                        e_3 = _a.sent();
                        chai_1.expect(e_3.message.startsWith('Target passed does not match context of currenly starting trackAsyn method')).to.equal(true);
                        return [3 /*break*/, 7];
                    case 7:
                        _a.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, s.retrievedTooLate()];
                    case 8:
                        _a.sent();
                        expectNotToGetToThisLine();
                        return [3 /*break*/, 10];
                    case 9:
                        e_4 = _a.sent();
                        chai_1.expect(e_4.message.startsWith('You are trying to get current run tracker while no run is starting')).to.equal(true);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        }); });
    });
    describe(' you can pass hooks to check overall asycn execution state of a given target and ', function () {
        var decoratorOptions = {
            onExecutionStart: function (target, methodName, newRunningExecutionsCount) {
                target.activityLog.push([methodName, newRunningExecutionsCount]);
                target.isBusy = true;
            },
            onExecutionEnd: function (target, methodName, newRunningExecutionsCount, targetHasAnyExecutionsRunning) {
                target.activityLog.push([methodName, newRunningExecutionsCount]);
                target.isBusy = targetHasAnyExecutionsRunning;
            }
        };
        var TestSubject = /** @class */ (function () {
            function TestSubject() {
                this.isBusy = false;
                this.activityLog = [];
            }
            TestSubject.prototype.methodA = function (promise) {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, promise];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, normalReturnA];
                        }
                    });
                });
            };
            TestSubject.prototype.methodB = function (promise) {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, promise];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, normalReturnA];
                        }
                    });
                });
            };
            __decorate([
                index_1.trackAsync(decoratorOptions),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Promise]),
                __metadata("design:returntype", Promise)
            ], TestSubject.prototype, "methodA", null);
            __decorate([
                index_1.trackAsync(decoratorOptions),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Promise]),
                __metadata("design:returntype", Promise)
            ], TestSubject.prototype, "methodB", null);
            return TestSubject;
        }());
        var subject = new TestSubject();
        afterEach(function () {
            subject = new TestSubject();
        });
        it('hooks will receive status update on every async start and finish', function () { return __awaiter(_this, void 0, void 0, function () {
            function expectLastActivity(methodName, executionCount) {
                var lastActivity = subject.activityLog[subject.activityLog.length - 1];
                chai_1.expect(lastActivity[0]).to.equal(methodName);
                chai_1.expect(lastActivity[1]).to.equal(executionCount);
            }
            var resolves, promises, _i, _a, _, differentUninterfieringSubject;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        resolves = [];
                        promises = [];
                        for (_i = 0, _a = new Array(5); _i < _a.length; _i++) {
                            _ = _a[_i];
                            promises.push(new Promise(function (resolve) {
                                resolves.push(resolve);
                            }));
                        }
                        differentUninterfieringSubject = new TestSubject();
                        chai_1.expect(differentUninterfieringSubject.isBusy).to.equal(false);
                        differentUninterfieringSubject.methodA(promises[3]);
                        differentUninterfieringSubject.methodB(promises[4]);
                        chai_1.expect(differentUninterfieringSubject.isBusy).to.equal(true);
                        chai_1.expect(subject.isBusy).to.equal(false);
                        subject.methodA(promises[0]);
                        expectLastActivity('methodA', 1);
                        chai_1.expect(subject.isBusy).to.equal(true);
                        subject.methodA(promises[1]);
                        expectLastActivity('methodA', 2);
                        chai_1.expect(subject.isBusy).to.equal(true);
                        subject.methodB(promises[2]);
                        expectLastActivity('methodB', 1);
                        chai_1.expect(subject.isBusy).to.equal(true);
                        resolves[0]();
                        return [4 /*yield*/, delay(1)];
                    case 1:
                        _b.sent();
                        expectLastActivity('methodA', 1);
                        chai_1.expect(subject.isBusy).to.equal(true);
                        resolves[1]();
                        return [4 /*yield*/, delay(1)];
                    case 2:
                        _b.sent();
                        expectLastActivity('methodA', 0);
                        chai_1.expect(subject.isBusy).to.equal(true);
                        resolves[2]();
                        return [4 /*yield*/, delay(1)];
                    case 3:
                        _b.sent();
                        expectLastActivity('methodB', 0);
                        chai_1.expect(subject.isBusy).to.equal(false);
                        chai_1.expect(differentUninterfieringSubject.isBusy).to.equal(true);
                        resolves[3]();
                        resolves[4]();
                        return [4 /*yield*/, delay(1)];
                    case 4:
                        _b.sent();
                        chai_1.expect(differentUninterfieringSubject.isBusy).to.equal(false);
                        chai_1.expect(differentUninterfieringSubject.activityLog.length).to.equal(4);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=index.test.js.map