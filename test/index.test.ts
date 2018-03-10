import * as mocha from 'mocha';
import { expect } from 'chai';

import { trackAsync, getCurrentRunTracker } from './../src/index';

//todo typescript couldn't find setTimeout?
declare function setTimeout(a:any, b:any ):void;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const expectNotToGetToThisLine = () => expect.fail('Execution should not get to this line, '+ 
                                                    'one of the previous statements should have thrown an exception.');
const normalReturnA = 5;
const normalReturnB = 7;

class TestSubject{

    @trackAsync()
    async methodCancelsNonLatestAndSwallowsError(finalAction?: () => {}){
        const asyncRunTracker = getCurrentRunTracker(this, 'methodCancelsNonLatestAndSwallowsError');

        await delay (25); 

        asyncRunTracker.throwIfRunNotLatest();

        finalAction && finalAction();
        
        return normalReturnA;
    }

    @trackAsync({swallowCancelationException: false})
    async methodCancelsNonLatestAndDoesNotSwallowsError(finalAction?: () => {}){
        const asyncRunTracker = getCurrentRunTracker(this, 'methodCancelsNonLatestAndDoesNotSwallowsError');

        await delay (25); 

        asyncRunTracker.throwIfRunNotLatest();

        finalAction && finalAction();
        
        return normalReturnB;
    }
}

describe('For @trackAsync decorated methods ', () => {

    describe(' every new execution is tracked and it ', () => {

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

        it('same methods on different instances don\'t interfiere with each othe', async ()=> {

            let counter = 0;

            const p1 = subject.methodCancelsNonLatestAndSwallowsError(() => counter += 1);

            const p2 = new TestSubject().methodCancelsNonLatestAndSwallowsError(() => counter += 1);

            const [res1, res2] = await Promise.all([p1,p2]);

            expect(res1).to.equal(undefined);
            expect(res2).to.equal(normalReturnA);
            
            expect(counter).to.equal(1);
        });
        
        it('can be configured not to swallow cancelation exception', async ()=> {

            let counter = 0;
            let cancelationWasNotSallowed = false;

            subject.methodCancelsNonLatestAndDoesNotSwallowsError(() => counter += 1)
                    .catch(() => cancelationWasNotSallowed = true);

            await subject.methodCancelsNonLatestAndDoesNotSwallowsError(() => counter += 1);

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
                    await delay(25);
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
});