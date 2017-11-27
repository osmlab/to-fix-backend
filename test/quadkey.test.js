const test = require('./lib/test');
const createQuadkeys = require('./lib/quadkeys').createQuadkeys;

const quadkeysNoSetFixture = [
  {
    quadkey: '11002122',
    set_id: null,
    priority: 0.1234
  },
  {
    quadkey: '11002123',
    set_id: null,
    priority: 0.4321
  }
];

const quadkeysWithSetFixture = [
  {
    quadkey: '11002122',
    set_id: 'abc',
    priority: 0.2222
  },
  {
    quadkey: '11002123',
    set_id: 'abc',
    priority: 0.3333
  }
];

const quadkeysz13Fixture = [
  {
    quadkey: '0000000000001',
    set_id: null,
    priority: 0.6
  },
  {
    quadkey: '0000000000002',
    set_id: null,
    priority: 0.2
  },
  {
    quadkey: '0000000000003',
    set_id: null,
    priority: 0.3
  },
  {
    quadkey: '1010101010101',
    set_id: null,
    priority: 1
  },
  {
    quadkey: '1010000000000',
    set_id: null,
    priority: 0.01
  }
];

const projectFixture = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    items: [
      {
        id: '01',
        pin: [-179.94, 85.05],
        createdAt: new Date('2017-11-04')
      },
      {
        id: '02',
        pin: [-179.98, 85.046],
        createdAt: new Date('2017-11-07'),
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() + 2 * 1000 * 15 * 60)
      },
      {
        id: '03',
        pin: [-179.92, 85.045],
        status: 'closed'
      },
      {
        id: '10',
        pin: [60, 85.05]
      }
    ]
  }
];

test(
  'GET /:version/projects/:project/quadkeys - GET quadkeys data for a project with within param',
  projectFixture,
  (assert, token) => {
    createQuadkeys(quadkeysz13Fixture).then(() => {
      assert.app
        .get(
          '/v1/projects/00000000-0000-0000-0000-000000000000/quadkeys?within=0000&zoom_level=8'
        )
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err, 'get quadkeys does not error');
          assert.equal(
            res.body[0].quadkey,
            '00000000',
            'correct quadkey returned'
          );
          assert.equal(res.body[0].item_count, 3, '3 items returned');
          assert.equal(
            res.body[0].max_priority,
            0.6,
            'correct max_priority returned'
          );
          assert.end();
        });
    });
  }
);

test(
  'GET /:version/projects/:project/quadkeys - GET quadkeys data filtering items by status',
  projectFixture,
  (assert, token) => {
    createQuadkeys(quadkeysz13Fixture).then(() => {
      assert.app
        .get(
          '/v1/projects/00000000-0000-0000-0000-000000000000/quadkeys?within=0000&zoom_level=8&item_status=open'
        )
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err, 'get filtered quadkeys does not error');
          assert.equal(res.body[0].item_count, 2, '2 items returned');
          assert.end();
        });
    });
  }
);

test(
  'GET /:version/projects/:project/quadkeys - GET quadkeys data filtering items by item_lock',
  projectFixture,
  (assert, token) => {
    createQuadkeys(quadkeysz13Fixture).then(() => {
      assert.app
        .get(
          '/v1/projects/00000000-0000-0000-0000-000000000000/quadkeys?within=0000&zoom_level=8&item_lock=unlocked'
        )
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err, 'get filtered quadkeys does not error');
          assert.equal(res.body[0].item_count, 2, '2 items returned');
          assert.end();
        });
    });
  }
);

test(
  'GET /:version/projects/:project/quadkeys - GET quadkeys data filtering items by date',
  projectFixture,
  (assert, token) => {
    createQuadkeys(quadkeysz13Fixture).then(() => {
      assert.app
        .get(
          '/v1/projects/00000000-0000-0000-0000-000000000000/quadkeys?within=0000&zoom_level=8&item_from=2017-11-01&item_to=2017-11-10'
        )
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err, 'get filtered by date does not error');
          assert.equal(res.body[0].item_count, 2, '2 items returned');
          assert.end();
        });
    });
  }
);

test(
  'GET /:version/projects/:project/quadkeys - GET quadkeys data filtering items by item_to',
  projectFixture,
  (assert, token) => {
    createQuadkeys(quadkeysz13Fixture).then(() => {
      assert.app
        .get(
          '/v1/projects/00000000-0000-0000-0000-000000000000/quadkeys?within=0000&zoom_level=8&item_to=2017-11-05'
        )
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err, 'get filtered by date does not error');
          assert.equal(res.body[0].item_count, 1, '1 item returned');
          assert.end();
        });
    });
  }
);

test(
  'GET /:version/projects/:project/quadkeys - GET quadkeys data filtering items by item_from',
  projectFixture,
  (assert, token) => {
    createQuadkeys(quadkeysz13Fixture).then(() => {
      assert.app
        .get(
          '/v1/projects/00000000-0000-0000-0000-000000000000/quadkeys?within=0000&zoom_level=8&item_from=2017-11-05'
        )
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err, 'get filtered by date does not error');
          assert.equal(res.body[0].item_count, 2, '2 items returned');
          assert.end();
        });
    });
  }
);

test(
  'GET /:version/projects/:project/quadkeys - GET quadkeys data invalid param for item_from',
  projectFixture,
  (assert, token) => {
    createQuadkeys(quadkeysz13Fixture).then(() => {
      assert.app
        .get(
          '/v1/projects/00000000-0000-0000-0000-000000000000/quadkeys?within=0000&zoom_level=8&item_from=foobar'
        )
        .set('authorization', token)
        .expect(400, err => {
          assert.ifError(err, 'get filtered by invalid date does not error');
          assert.end();
        });
    });
  }
);

test(
  'GET /:version/projects/:project/quadkeys - GET quadkeys should error with required params not supplied',
  projectFixture,
  (assert, token) => {
    assert.app
      .get('/v1/projects/00000000-0000-0000-0000-000000000000/quadkeys')
      .set('authorization', token)
      .expect(400, err => {
        assert.ifError(err);
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:project/quadkeys - GET quadkeys should error with invalid within parameter',
  projectFixture,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/00000000-0000-0000-0000-000000000000/quadkeys?zoom_level=8&within=foobar'
      )
      .set('authorization', token)
      .expect(400, err => {
        assert.ifError(err);
        assert.end();
      });
  }
);

test(
  'GET /:version/quadkeys/:quadkey - get priority for a quadkey without set_id',
  [],
  (assert, token) => {
    createQuadkeys(quadkeysNoSetFixture).then(() => {
      assert.app
        .get('/v1/quadkeys/11002122')
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err, 'fetching quadkey should not error');
          assert.equal(res.body.priority, 0.1234);
          assert.end();
        });
    });
  }
);

test(
  'GET /:version/quadkeys/:quadkey - expect -1 priority for not found quadkey',
  [],
  (assert, token) => {
    assert.app
      .get('/v1/quadkeys/111111')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err);
        assert.equal(res.body.priority, -1);
        assert.end();
      });
  }
);

test(
  'GET /:version/quadkeys/:quadkey?set_id=foobar - expect -1 priority for not found quadkey+set_id',
  [],
  (assert, token) => {
    createQuadkeys(quadkeysWithSetFixture).then(() => {
      assert.app
        .get('/v1/quadkeys/11002122?set_id=foobar')
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err);
          assert.equal(res.body.priority, -1);
          assert.end();
        });
    });
  }
);

test(
  'GET /:version/quadkeys/:quadkey - get priority for a quadkey with set_id',
  [],
  (assert, token) => {
    createQuadkeys(quadkeysWithSetFixture).then(() => {
      assert.app
        .get('/v1/quadkeys/11002122?set_id=abc')
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err, 'fetching quadkey for set_id should not error');
          assert.equal(res.body.priority, 0.2222);
          assert.end();
        });
    });
  }
);

test(
  'POST /:version/quadkeys/:quadkey - POST priority for a quadkey UPDATE',
  [],
  (assert, token) => {
    createQuadkeys(quadkeysNoSetFixture).then(() => {
      assert.app
        .post('/v1/quadkeys/11002122')
        .set('authorization', token)
        .send({
          set_id: null,
          priority: 0.1111
        })
        .expect(200, (err, res) => {
          assert.ifError(err, 'no error on POSTing quadkey');
          assert.equal(res.body.quadkey, '11002122');
          assert.equal(res.body.priority, 0.1111);
          assert.end();
        });
    });
  }
);

test(
  'POST /:version/quadkeys/:quadkey - POST priority for a quadkey INSERT',
  [],
  (assert, token) => {
    assert.app
      .post('/v1/quadkeys/11002122')
      .set('authorization', token)
      .send({
        set_id: null,
        priority: 0.3333
      })
      .expect(200, (err, res) => {
        assert.ifError(err, 'POSTing quadkey does not error');
        assert.equal(res.body.quadkey, '11002122');
        assert.equal(res.body.priority, 0.3333);
        assert.end();
      });
  }
);

test(
  'POST /:version/quadkeys/:quadkey - POSTing quadkey with set_id',
  [],
  (assert, token) => {
    assert.app
      .post('/v1/quadkeys/11002122')
      .set('authorization', token)
      .send({
        set_id: 'xyz',
        priority: 0.8888
      })
      .expect(200, (err, res) => {
        assert.ifError(err, 'does not error');
        assert.equal(res.body.set_id, 'xyz');
        assert.equal(res.body.priority, 0.8888);
        assert.equal(res.body.quadkey, '11002122');
        assert.end();
      });
  }
);

test(
  'POST /:version/quadkeys/:quadkey - POSTing invalid quadkey returns 400',
  [],
  (assert, token) => {
    assert.app
      .post('/v1/quadkeys/foobar')
      .set('authorization', token)
      .send({
        set_id: 'xyz',
        priority: 0.666
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'does not error');
        assert.equal(
          res.body.message,
          'Please supply a valid quadkey identifier'
        );
        assert.end();
      });
  }
);
