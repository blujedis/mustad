
 <p align="left">
  <a href="http://github.com/blujedis/mustad"><img src="https://raw.githubusercontent.com/blujedis/mustad/master/fixtures/logo.png" width="225" /></a>
</p>

Library to bind pre and post hooks to functions. Often used to wrap a method before and after making a query to a database such as Mongodb.

## Installation

Install the package.

```sh
$ npm install mustad -s
```

OR

```sh
$ yarn add mustad
```

## Getting Started

You can either wrap an existing class/api or manually bind your hooks.

Take for example a simple API that does some work with a database.

### Wrapping Proto

```ts
import { wrap } from 'mustad';
import db from './db'; // fake Mongodb import.

const _api = {

  async findUser(queryOrId, options) {
    const user = await db.collection('user').findOne(queryOrId, options);
    return user;
  } 

};

const api = wrap(_api);

api.pre('findUser', (next, queryOrId, options) => {
  if (typeof queryOrId !== 'object')
    queryOrId = { _id: queryOrId } // convert user ObjectId to query object.
  next(null, queryOrId); // Mustad will append the missing "options" param if missing.
});
```

### Implement Manually

You can also implement Mustad manually and use in a class.

```ts
import { Mustad } from 'mustad';

class MyClass {

  constructor() {
    this._mustad = new Mustad(this);
  }

  findUser(queryOrId, options) {
    // call database to find user.
  }

  // You might do it this way to limit binding
  // to say only a few methods in your class.
  // rather than allowing any method to be bound.
  pre(type, handler) {

    // type here might be "update" for example so
    // you abtract away here so that you can bind
    // to multiple methods with the user only supplying
    // one keyword.
    if (type === 'update')
      this._mustad.pre(['update', 'updateOne', 'findOneAndUpdate'], handler);

    return this;

  }

}

const myClass = new MyClass();
```

## Hook Examples

Below are a couple common use case examples.

### Adding Arguments

One each call of the next callback handler arguments are synchornized at position. New arguments are also appended to the chain so as to be available in the next hook.

For example calling <code>next()</code> will provide all args as previously supplied. If you have two arguments after the next handler but you only override the first, <code>next(null, newFirst)</code> the next hook will see <code>args = [newFirst, oldSecond]</code>. If you add a new third argument the next hook in the chain will see all three arguments as show below:

```ts
api.pre('findUser', (next, queryOrId, options) => {
  const meta = { timestamp: Date.now() };
  next(null, queryOrId, options, meta); // meta now avail in next hook!!!
});
```

### Running Parallel

Say you want to log something but don't want to block in your hook by calling <code>next(true)</code> we tell Mustad to proceed to the next hook without waiting. Finally we call next again with our typical options and Mustad will wrap everything up and then call our bound handler from our class or api.

```ts
api.pre('findUser', (next, queryOrId, options) => {
  setTimeout(() => {
    console.log('Next hook won\'t wait for me, but I will finish before calling api.findUser()');
    next(); // this is the same as next(null, queryOrId, options)
  });
  next(true); // "true" tells Mustad to iterate to next hook.
});
```

### Promise Support

Mustad fully supports promises. To use a promise simply do whatever you like in your hook and return the promise. Mustad will just figure it all out for you.

```ts
api.pre('findUser', (next, queryOrId, options) => {
  return new Promise((resolve, reject) => {
    // do some task resolve or reject.
    if (false)
      return reject('some rejection');
    resolve('your_data');
  })
});
```

## Callback or Return

Hooks allow you to either return values and then handle as needed or you can callback as we've shown with our <code>next()</code> callback. Here are the options when returning a value or calling the next callback.

### Return Actions

<table>
  <tr>
    <th>Action</th><th>Description</th>
  </tr>
  <tr>
    <tr><td>return true;</td><td>same as calling next()</td></tr>
    <tr><td>return false;</td><td>same as calling next(new Error(`Hook "findUser" returned false and exited.`))</td></tr>
    <tr><td>return Promise.resolve();</td><td>waits for promise then runs next hook.</td></tr>
    <tr><td>return undefined;</td><td>no action taken</td></tr>
  </tr>
</table>

### Callback Actions

<table>
  <tr>
    <th>Action</th><th>Description</th>
  </tr>
  <tr><td>next()</td><td>same as calling next(null, ...args) where "args" are the original spread args.</td></tr>
  <tr><td>next(true)</td><td>won't wait causes next hook to be called but will finish before calling primary handler.</td></tr>
  <tr><td>next(false)</td><td>same as calling next(new Error(`Hook "findUser" returned false and exited.`))</td></tr>
  <tr><td>next(new Error())</td><td>will halt and exit all hooks.</td></tr>
  <tr><td>next(null, arg1)</td><td>calls next hook any args by index missing will be added to arg1</td></tr>

</table>

## Options

<table>
  <tr><th>Property</th><th>Description</th><th>Default</th></tr>
  <tr><td>enablePre</td><td>when enabled "pre" hooks are run</td><td>true</td></tr>
  <tr><td>enablePost</td><td>when enabled "post" hooks are run</td><td>true</td></tr>
  <tr><td>timeout</td><td>how long to wait for async hooks before continue</td><td>3000</td></tr>
  <tr><td>timeoutError</td><td>when timeout is elapsed whether to error or not</td><td>true</td></tr>
  <tr><td>include</td><td>array of methods to allow binding to undefined or [] is all</td><td>[]</td></tr>
  <tr><td>exclude</td><td>array of methods to allow PREVENT binding to</td><td>[]</td></tr>
  <tr><td>lazy</td><td>lazy mode binds hook wrapper automatically to any defined hook *</td><td>true</td></tr>
</table>

* When lazy mode is disabled any defined hook will need to bound. Defining a <code>pre(); post(); preExec(); postExec()</code> merely adds it to the internal collection as a hook. Lazy mode then ensures the defined handler name is wrapped so that it can handle calling these defined hooks. So by setting **lazy** to false you would then need to do the following manually:

```ts
// Name - the name of the method
// handler - the prototype function itself.
// context - the optional context to bind to the hooks.
mustad.hook(name, handler, context);
```

If you need to do this manually it will be obvious. Additionally Mustad will check if the handler has already been wrapped.

## Docs

See [https://blujedis.github.io/mustad/](https://blujedis.github.io/mustad/)

## Change

See [CHANGE.md](CHANGE.md)

## License

See [LICENSE.md](LICENSE)

