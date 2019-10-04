import { assert } from 'chai';
import { wrap } from '../src';

const base = {
  getName(name, cb) {
    cb(null, `My name is ${name}`);
  },
  getNameProm(name) {
    return Promise.resolve(`My name is ${name}`);
  },
  notHooked() {
    //
  }
};

const api = wrap(base);

api.pre(['getName', 'getNameProm'], (next, name) => {
  assert.equal(name, 'Milton Waddams');
  next(null, name);
});

api.post(['getName', 'getNameProm'], (next, result) => {
  // assert.equal('My name is Milton Waddams', result);
  next();
});

describe('Mustad', () => {

  it('Should list hooked methods in prototype.', () => {
    const list = api.mustad.list();
    assert.deepEqual(list, ['getName', 'getNameProm']);
  });

  it('Should handle callback method.', (done) => {
    api.getName('Milton Waddams', (err, result) => {
      assert.equal('My name is Milton Waddams', result);
      done();
    });
  });

  it('Should handle promise method.', (done) => {
    api.getNameProm('Milton Waddams')
      .then(res => {
        assert.equal('My name is Milton Waddams', res);
        done();
      });
  });

  it('Should add async pre method using timeout calling next(true).', (done) => {

    api.pre('getName', (next, name) => {
      setTimeout(() => {
        assert.equal(name, 'Milton Waddams');
        next(null, 'Peter Gibbons'); // change the name arg.
      });
      next(true);
    });

    api.getName('Milton Waddams', (err, result) => {
      assert.equal('My name is Peter Gibbons', result);
      done();
    });

  });

  it('Should add async pre method which returns promise.', (done) => {

    api.pre('getName', (next, name) => {
      return Promise.resolve('Milton Waddams Handle');
    });

    api.getName('Milton Waddams', (err, result) => {
      assert.equal('My name is Peter Gibbons', result);
      done();
    })

  });

});
