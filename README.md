# async-execution-tracking
JS/TS decorator to track execution of async methods and simplify early cancelation

## install
```
npm install -save 'async-execution-tracking'
```

## usage

### tracking if run still latest
This library allows you to decorate your async methods, track if current continuation was triggered by the latest run and cancel 
if run is no longer relevant. Lets say you user is typing into an input with autocomplete options retrieved from the server. 
You would like to debounce the server call somewhat (to avoid request on every keypress and only make request once the user stopped
typing for half a second). You also only want to show autocomplete options from the latest run, even if a previous request was delayed
and came back later from the server.

```javascript
import { trackAsync, getCurrentRunTracker } from 'async-execution-tracking';

  class MyClass{
  
      //...more code

      @trackAsync()
      async getAutocompleteFromServer(query){
          // at the begining of the method we get the tracker
          const asyncRunTracker = getCurrentRunTracker(this, 'getAutocompleteFromServer');

          // give it half a second to debounce execution
          await delay(500); 

          // cancel if there is a more recent call of this method on this object
          asyncRunTracker.throwCancelationIfRunNotLatest();

          const result = await repo.getAutocompleteOptions(query)

          // cancel if there is a more recent call of this method on this object 
          // (to avoid overriding previous result if a request just lagged)
          asyncRunTracker.throwCancelationIfRunNotLatest();

          return result;
      }
}
```

If you are using something like a command pattern, where you expose objects with 'execute' method 
instead of functions directly, you can use `@trackAsyncNested({ property: 'execute' })` decorator.


```javascript
import { trackAsyncNested, getCurrentRunTracker } from 'async-execution-tracking';
import { command } from 'mobx-command';

  class MyClass {
  
      //...more code

      @trackAsyncNested({ property: 'execute' })
      getAutocompleteFromServerCommand = command({
          execute: async(query) => {

            const asyncRunTracker = getCurrentRunTracker(this, 'getAutocompleteFromServerCommand');

            await delay(500); 

            asyncRunTracker.throwCancelationIfRunNotLatest();

            const result = await repo.getAutocompleteOptions(query)

            asyncRunTracker.throwCancelationIfRunNotLatest();

            return result;
        }
      });
}
```

### tracking presence of outgoing async calls
In UI you often need to disable certian buttons or the whole screen while there is an outgoing request. 
```javascript
import { trackAsync, getCurrentRunTracker } from 'async-execution-tracking';

 const decoratorOptions {
        onExecutionStart(target, methodName, newRunningExecutionsCount){
            target.currentExecutingFns.set(methodName, newRunningExecutionsCount);
            target.isBusy = true;
        },
        onExecutionEnd(target, methodName, newRunningExecutionsCount, targetHasAnyExecutionsRunning){
            target.currentExecutingFns.set(methodName, newRunningExecutionsCount);
            target.isBusy = targetHasAnyExecutionsRunning;
        }
    }

class MyClass{

      //@observable from your favourite library
      public isBusy = false; 
      //@observable
      public currentExecutingFns = new ObservableMapFromYourFavouriteLib();

      //...more code

      // this will probably be your custom decorator wrapping @trackAsync wiht above options
      @trackAsync(decoratorOptions)
      async someMethod(){
          //...
      }
}

// in your markup somwhere. This examplee is what you would have with react-mobx
<Button 
    disabled={this.props.vm.currentExecutingFns.get('someMethod') > 0}
    onClick={()=> this.props.vm.someMethod()}> 
        Call someMethod 
    </Button>
//...
<SomeView disabled={this.props.vm.isBusy}/>
```

## compatibility
Transpiled version will work with ES5 and

Map https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map 

( polyfill https://github.com/eriwen/es6-map-shim )



Promise https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise 

( polyfill https://github.com/taylorhakes/promise-polyfill )


As such, works in IE11 ( just promise polyfill needed) and all evergreen browsers. With Map polyfill shoould work in up to IE7.

## TypeScript and @Types
Types are provided with the package. Library is developed in TypeScript, src available with the package and on github. 