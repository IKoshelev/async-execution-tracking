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
describe('For @trackAsync decorated methods ', function () {
    describe(' every new execution is tracked and it ', function () {
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
        it('same methods on different instances don\'t interfiere with each othe', function () { return __awaiter(_this, void 0, void 0, function () {
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
                        chai_1.expect(res1).to.equal(undefined);
                        chai_1.expect(res2).to.equal(normalReturnA);
                        chai_1.expect(counter).to.equal(1);
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
                                        index_1.getCurrentRunTracker({}, 'wrongTarget');
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
                                                index_1.getCurrentRunTracker({}, 'retrievedTooLate');
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluZGV4LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUJBMkxHOztBQTFMSCw2QkFBOEI7QUFFOUIsd0NBQWtFO0FBRWxFLElBQU0sS0FBSyxHQUFHLFVBQUMsRUFBVSxJQUFLLE9BQUEsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLElBQUssT0FBQSxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUF2QixDQUF1QixDQUFDLEVBQWpELENBQWlELENBQUM7QUFFaEYsSUFBTSx3QkFBd0IsR0FBRyxjQUFNLE9BQUEsYUFBTSxDQUFDLElBQUksQ0FBQyx5Q0FBeUM7SUFDeEMsaUVBQWlFLENBQUMsRUFEL0UsQ0FDK0UsQ0FBQztBQUN2SCxJQUFNLGFBQWEsR0FBRyxDQUFDLENBQUM7QUFDeEIsSUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDO0FBRXhCO0lBQUE7SUEyQkEsQ0FBQztJQXhCUyw0REFBc0MsR0FBNUMsVUFBNkMsV0FBc0I7Ozs7Ozt3QkFDekQsZUFBZSxHQUFHLDRCQUFvQixDQUFDLElBQUksRUFBRSx3Q0FBd0MsQ0FBQyxDQUFDO3dCQUU3RixxQkFBTSxLQUFLLENBQUUsRUFBRSxDQUFDLEVBQUE7O3dCQUFoQixTQUFnQixDQUFDO3dCQUVqQixlQUFlLENBQUMsbUJBQW1CLEVBQUUsQ0FBQzt3QkFFdEMsV0FBVyxJQUFJLFdBQVcsRUFBRSxDQUFDO3dCQUU3QixzQkFBTyxhQUFhLEVBQUM7Ozs7S0FDeEI7SUFHSyxtRUFBNkMsR0FBbkQsVUFBb0QsV0FBc0I7Ozs7Ozt3QkFDaEUsZUFBZSxHQUFHLDRCQUFvQixDQUFDLElBQUksRUFBRSwrQ0FBK0MsQ0FBQyxDQUFDO3dCQUVwRyxxQkFBTSxLQUFLLENBQUUsRUFBRSxDQUFDLEVBQUE7O3dCQUFoQixTQUFnQixDQUFD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