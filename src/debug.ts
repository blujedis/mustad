// tslint:disable
import { wrap, Mustad } from './mustad';

const base = {

  async one(name, obj?) {
    return Promise.resolve(['one', 'two', 'three']);
  },

  async two(name, arr) {
    return Promise.resolve({ name, arr });
  }

};

const api = wrap(base);

// TEST ONE //

// api.pre('one', (next, name, obj) => {
//   next();
// });

// api.pre('one', (next, name, obj) => {
//   setTimeout(() => {
//     obj.active = false;
//     next();
//   }, 100);
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

// TEST TWO //

api.pre('two', (next, name, arr) => {
  console.log(arr);
  next();
});

api.post('two', (next, data) => {
  next();
});

api.two('bob', ['four', 'five', 'six'])
  .then(res => {
    console.log(res);
  })
  .catch(err => {
    console.log(err);
  });