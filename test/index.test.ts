import * as mocha from 'mocha';
import { expect } from 'chai';
import { command } from 'mobx-command';

import { trackAsync, trackAsyncNested, getCurrentRunTracker, ITrackAsyncOptions } from './../src/index';


//todo typescript couldn't find setTimeout?
declare function setTimeout(a:any, b:any ):void;

const delay = (ms: number = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const expectNotToGetToThisLine = () => expect.fail('Execution should not get to this line, '+ 
                                                    'one of the previous statements should have thrown an exception.');
const normalReturnA = 5;
const normalReturnB = 7;

describe('For @trackAsync decorated methods ', () => {

    describe(' every new execution is tracked and it ', () => {

        class TestSubject{

            @trackAsync()
            async methodCancelsNonLatestAndSwallowsError(finalAction?: () => {}){
                const asyncRunTracker = getCurrentRunTracker(this, 'methodCancelsNonLatestAndSwallowsError');
        
                await delay(); 
        
                asyncRunTracker.throwCancelationIfRunNotLatest();
        
                finalAction && finalAction();
                
                return normalReturnA;
            }
        
            @trackAsync({swallowCancelationException: false})
            async methodCancelsNonLatestAndDoesNotSwallowsError(finalAction?: () => {}){
                const asyncRunTracker = getCurrentRunTracker(this, 'methodCancelsNonLatestAndDoesNotSwallowsError');
        
                await delay(); 

                asyncRunTracker.throwCancelationIfRunNotLatest();
        
                finalAction && finalAction();
                
                return normalReturnB;
            }
        }

        let subject: TestSubject = new TestSubject();

        afterEach(() => {
            subject = new TestSubject();
        })

        it('will run to completion normally', async ()=> {

            let finished = false;

            const res = await subject.methodCancelsNonLatestAndSwallowsError(() => finished = true);

            expect(finished).to.equal(true);
            expect(res).to.equal(normalReturnA);
        });

        it('allows tracking and cancelation if same method was run again on the instance', async ()=> {

            let counter = 0;

            const p1 = subject.methodCancelsNonLatestAndSwallowsError(() => counter += 1);

            const p2 = subject.methodCancelsNonLatestAndSwallowsError(() => counter += 1);

            const [res1, res2] = await Promise.all([p1,p2]);

            expect(res1).to.equal(undefined);
            expect(res2).to.equal(normalReturnA);
            
            expect(counter).to.equal(1);
        });

        it('different methods on same instance don\'t interfiere with each other' , async ()=> {

            let counter = 0;

            const p1 = subject.methodCancelsNonLatestAndSwallowsError(() => counter += 1);

            const p2 = subject.methodCancelsNonLatestAndDoesNotSwallowsError(() => counter += 1);

            const [res1, res2] = await Promise.all([p1,p2]);

            expect(res1).to.equal(normalReturnA);
            expect(res2).to.equal(normalReturnB);
            
            expect(counter).to.equal(2);
        });

        it('same methods on different instances don\'t interfiere with each other', async ()=> {

            let counter = 0;

            const p1 = subject.methodCancelsNonLatestAndSwallowsError(() => counter += 1);

            const p2 = new TestSubject().methodCancelsNonLatestAndSwallowsError(() => counter += 1);

            const [res1, res2] = await Promise.all([p1,p2]);

            expect(res1).to.equal(normalReturnA);
            expect(res2).to.equal(normalReturnA);
            
            expect(counter).to.equal(2);
        });
        
        it('can be configured not to swallow cancelation exception', async ()=> {

            let counter = 0;
            let cancelationWasNotSallowed = false;

            subject.methodCancelsNonLatestAndDoesNotSwallowsError(() => counter += 1)
                    .catch(() => {
                        cancelationWasNotSallowed = true;
                    });

            await subject.methodCancelsNonLatestAndDoesNotSwallowsError(() => counter += 1);

            await delay();

            expect(counter).to.equal(1);
            expect(cancelationWasNotSallowed).to.equal(true);
        });

        it('does not swallow non-cancelation exceptions', async ()=> {

            let errorWasNotSallowed = false;

            const marker = "marker777";
            try {
                await subject.methodCancelsNonLatestAndSwallowsError(() => {throw new Error(marker)});
                expectNotToGetToThisLine();
            }
            catch(e) {
                errorWasNotSallowed = true;
                expect(e.message).to.equal(marker);
            }

            expect(errorWasNotSallowed).to.equal(true);
        });

        it('will warn if tracker retireved for wrong method / instance or too late', async ()=> {

            class Subject {

                @trackAsync()
                async wrongMethod(){
                    getCurrentRunTracker(this, 'decoy');
                }

                @trackAsync()
                async wrongTarget(){
                    getCurrentRunTracker(new Subject(), 'wrongTarget');
                }

                @trackAsync()
                async retrievedTooLate(){
                    await delay();
                    getCurrentRunTracker(new Subject(), 'retrievedTooLate');
                }

                decoy(){}
            }

            const s = new Subject();

            try {
                await s.wrongMethod();
                expectNotToGetToThisLine();
            } catch (e) {
                expect((e.message as string).startsWith('You are trying to get current run tracker for method decoy') ).to.equal(true);
            }

            try {
                await s.wrongTarget();
                expectNotToGetToThisLine();
            } catch (e) {
                expect((e.message as string).startsWith('Target passed does not match context of currenly starting trackAsyn method') ).to.equal(true);
            }

            try {
                await s.retrievedTooLate();
                expectNotToGetToThisLine();
            } catch (e) {
                expect((e.message as string).startsWith('You are trying to get current run tracker while no run is starting') ).to.equal(true);
            }
        });
    }); 

    describe(' you can pass hooks to check overall asycn execution state of a given target and ', () => {

        const decoratorOptions: Partial<ITrackAsyncOptions> = {
            onExecutionStart(target:TestSubject, methodName: keyof TestSubject, newRunningExecutionsCount: number){
                target.activityLog.push([methodName,newRunningExecutionsCount]);
                target.isBusy = true;
            },
            onExecutionEnd(target:TestSubject, methodName: keyof TestSubject, newRunningExecutionsCount: number, targetHasAnyExecutionsRunning: boolean){
                target.activityLog.push([methodName,newRunningExecutionsCount]);
                target.isBusy = targetHasAnyExecutionsRunning;
            }
        }

        class TestSubject{

            public isBusy: boolean = false; 
            public activityLog: [string,number][] = [];

            @trackAsync(decoratorOptions)
            async methodA(promise: Promise<any>){

                await promise;

                return normalReturnA;
            }

            @trackAsync(decoratorOptions)
            async methodB(promise: Promise<any>){

                await promise;

                return normalReturnA;
            }
        }

        let subject: TestSubject = new TestSubject();

        afterEach(() => {
            subject = new TestSubject();
        })

        it('hooks will receive status update on every async start and finish', async ()=> {

            const resolves: (()=>void)[] = [];
            const promises: Promise<any>[] = [];

            for(let _ of new Array(5)) {
                promises.push(new Promise((resolve) => { 
                    resolves.push(resolve);
                }));
            }

            function expectLastActivity(methodName: keyof TestSubject, executionCount: number) {
                const lastActivity = subject.activityLog[subject.activityLog.length - 1];
                expect(lastActivity[0]).to.equal(methodName);
                expect(lastActivity[1]).to.equal(executionCount);
            }

            let differentUninterfieringSubject = new TestSubject();

            expect(differentUninterfieringSubject.isBusy).to.equal(false);

            differentUninterfieringSubject.methodA(promises[3]);
            differentUninterfieringSubject.methodB(promises[4]);

            expect(differentUninterfieringSubject.isBusy).to.equal(true);

            expect(subject.isBusy).to.equal(false);

            subject.methodA(promises[0]);

            expectLastActivity('methodA', 1);
            expect(subject.isBusy).to.equal(true);

            subject.methodA(promises[1]);

            expectLastActivity('methodA', 2);
            expect(subject.isBusy).to.equal(true);
            
            subject.methodB(promises[2]);

            expectLastActivity('methodB', 1);
            expect(subject.isBusy).to.equal(true);

            resolves[0]();
            await delay(1);
            expectLastActivity('methodA', 1);
            expect(subject.isBusy).to.equal(true);

            resolves[1]();
            await delay(1);
            expectLastActivity('methodA', 0);
            expect(subject.isBusy).to.equal(true);

            resolves[2]();
            await delay(1);
            expectLastActivity('methodB', 0);
            expect(subject.isBusy).to.equal(false);

            expect(differentUninterfieringSubject.isBusy).to.equal(true);
            resolves[3]();
            resolves[4]();
            await delay(1);
            expect(differentUninterfieringSubject.isBusy).to.equal(false);
            expect(differentUninterfieringSubject.activityLog.length).to.equal(4);
        });

    });

});

describe('@trackAsyncNested can track methods on objects like command.execute', () => {

    const noop = () => {};

    class TestSubject{

        @trackAsyncNested({ property: 'execute' })
        commandCancelsNonLatestAndSwallowsError = command(async(finalAction?: () => {}) => {
            const asyncRunTracker = getCurrentRunTracker(this, 'commandCancelsNonLatestAndSwallowsError');
    
            await delay(); 
    
            asyncRunTracker.throwCancelationIfRunNotLatest();   
            
            finalAction && finalAction();
            
            return normalReturnA;
        });

        @trackAsyncNested({ property: 'execute', swallowCancelationException: false})
        commandCancelsNonLatestAndDoesNotSwallowsError = command(async(finalAction?: () => {}) => {
            const asyncRunTracker = getCurrentRunTracker(this, 'commandCancelsNonLatestAndDoesNotSwallowsError');
    
            await delay(); 

            asyncRunTracker.throwCancelationIfRunNotLatest();
    
            finalAction && finalAction();
            
            return normalReturnB;
        });
    }

    let subject: TestSubject = new TestSubject();

    beforeEach(() => {
        process.on('unhandledRejection', noop);
    });

    afterEach(() => {
        subject = new TestSubject();
        process.removeListener('unhandledRejection', noop);
    })

    it('will run to completion normally', async ()=> {

        let finished = false;

        const resPromise =  subject.commandCancelsNonLatestAndSwallowsError.execute(() => finished = true);

        expect(subject.commandCancelsNonLatestAndSwallowsError.isExecuting).to.equal(true);
        expect(subject.commandCancelsNonLatestAndSwallowsError.canExecuteCombined).to.equal(false);

        let res = await resPromise;

        expect(subject.commandCancelsNonLatestAndSwallowsError.isExecuting).to.equal(false);
        expect(subject.commandCancelsNonLatestAndSwallowsError.canExecuteCombined).to.equal(true);

        expect(finished).to.equal(true);
        expect(res).to.equal(normalReturnA);
    });

    it('allows tracking and cancelation if same method was run again on the instance', async ()=> {

        let counter = 0;

        const p1 = subject.commandCancelsNonLatestAndSwallowsError.execute(() => counter += 1);

        const p2 = subject.commandCancelsNonLatestAndSwallowsError.execute(() => counter += 1);

        const [res1, res2] = await Promise.all([p1,p2]);

        expect(res1).to.equal(undefined);
        expect(res2).to.equal(normalReturnA);
        
        expect(counter).to.equal(1);
    });

    it('different methods on same instance don\'t interfiere with each other' , async ()=> {

        let counter = 0;

        const p1 = subject.commandCancelsNonLatestAndSwallowsError.execute(() => counter += 1);

        const p2 = subject.commandCancelsNonLatestAndDoesNotSwallowsError.execute(() => counter += 1);

        const [res1, res2] = await Promise.all([p1,p2]);

        expect(res1).to.equal(normalReturnA);
        expect(res2).to.equal(normalReturnB);
        
        expect(counter).to.equal(2);
    });

    it('same methods on different instances don\'t interfiere with each other', async ()=> {

        let counter = 0;

        const p1 = subject.commandCancelsNonLatestAndSwallowsError.execute(() => counter += 1);

        const p2 = new TestSubject().commandCancelsNonLatestAndSwallowsError.execute(() => counter += 1);

        const [res1, res2] = await Promise.all([p1,p2]);

        expect(res1).to.equal(normalReturnA);
        expect(res2).to.equal(normalReturnA);
        
        expect(counter).to.equal(2);
    });
    
    it('can be configured not to swallow cancelation exception', async ()=> {

        let counter = 0;
        let cancelationWasNotSallowed = false;

        subject.commandCancelsNonLatestAndDoesNotSwallowsError.execute(() => counter += 1)
                .catch(() => {
                    cancelationWasNotSallowed = true;
                });

        await subject.commandCancelsNonLatestAndDoesNotSwallowsError.execute(() => counter += 1);

        await delay();

        expect(counter).to.equal(1);
        expect(cancelationWasNotSallowed).to.equal(true);
    });

    it('does not swallow non-cancelation exceptions', async ()=> {

        let errorWasNotSallowed = false;

        const marker = "marker777";
        try {
            await subject.commandCancelsNonLatestAndSwallowsError.execute(() => {throw new Error(marker)});
            expectNotToGetToThisLine();
        }
        catch(e) {
            errorWasNotSallowed = true;
            expect(e.message).to.equal(marker);
        }

        expect(errorWasNotSallowed).to.equal(true);
    });

    it('will warn if tracker retireved for wrong method / instance or too late', async ()=> {

        class Subject {

            @trackAsyncNested({property:'execute'})
            wrongMethod = command(async () => {
                getCurrentRunTracker(this, 'decoy');
            });

            @trackAsyncNested({property:'execute'})
            wrongTarget = command(async () => {
                getCurrentRunTracker(new Subject(), 'wrongTarget');
            });

            @trackAsyncNested({property:'execute'})
            retrievedTooLate = command(async() => {
                await delay();
                getCurrentRunTracker(new Subject(), 'retrievedTooLate');
            });

            decoy(){}
        }

        const s = new Subject();

        try {
            await s.wrongMethod.execute();
            expectNotToGetToThisLine();
        } catch (e) {
            expect((e.message as string).startsWith('You are trying to get current run tracker for method decoy') ).to.equal(true);
        }

        try {
            await s.wrongTarget.execute();
            expectNotToGetToThisLine();
        } catch (e) {
            expect((e.message as string).startsWith('Target passed does not match context of currenly starting trackAsyn method') ).to.equal(true);
        }

        try {
            await s.retrievedTooLate.execute();
            expectNotToGetToThisLine();
        } catch (e) {
            expect((e.message as string).startsWith('You are trying to get current run tracker while no run is starting') ).to.equal(true);
        }
    });
});