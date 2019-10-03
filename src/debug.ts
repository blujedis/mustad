// tslint:disable
import { wrap, Mustad } from './mustad';

// const base = {

//   async one(name, obj?) {
//     return Promise.resolve(`My name is ${name}`);
//   }

// };

// const api = wrap(base);

// api.pre('one', (next, name, obj) => {
//   next();
// });

// api.pre('one', (next, name, obj) => {
//   setTimeout(() => {
//     obj.active = false;
//     next();
//   }, 100)
//   next();
// });

// api.post('one', (next, data) => {
//   next();
// });

// api.one('bob', { age: 33, active: true })
//   .then(res => {
//     console.log(res);
//   })
//   .catch(err => {
//     console.log(err);
//   });