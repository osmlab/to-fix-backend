'use strict';

/* eslint-disable */

const removeDates = require('./lib/remove-dates');
const test = require('./lib/test');
const _ = require('lodash');

const noTags = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0'
  }
];
const noItems = JSON.parse(JSON.stringify(noTags));
const oneTag = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    tags: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'My Tag'
      }
    ]
  }
];
const oneTagMetadata = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    tags: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'My Tag',
        metadata: { key: 'value' }
      }
    ]
  }
];
const twoTags = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    tags: [
      {
        name: 'My Tag'
      },
      {
        name: 'My Other Tag'
      }
    ]
  }
];
const itemOneTag = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    items: [
      {
        id: '111111',
        pin: [77, 77],
        tags: ['My Tag']
      }
    ],
    tags: [
      {
        name: 'My Tag'
      }
    ]
  }
];
const itemTwoTags = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    items: [
      {
        id: '111111',
        pin: [77, 77],
        tags: ['My Tag', 'My Other Tag']
      }
    ],
    tags: [
      {
        name: 'My Tag'
      },
      {
        name: 'My Other Tag'
      }
    ]
  }
];
const itemNoTags = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    items: [
      {
        id: '111111',
        pin: [77, 77]
      }
    ],
    tags: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'My Tag'
      }
    ]
  }
];
const itemNotAssociatedWithTag = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    items: [
      {
        id: '111111',
        pin: [77, 77]
      }
    ],
    tags: [
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'My Tag'
      }
    ]
  }
];
const itemToDeleteTagFrom = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    items: [
      {
        id: '111111',
        pin: [77, 77],
        tags: ['My Tag']
      }
    ],
    tags: [
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'My Tag'
      }
    ]
  }
];

/* GET /:version/projects/:project/tags */

test(
  'GET /:version/projects/:project/tags - no project',
  [],
  (assert, token) => {
    assert.app
      .get(`/v1/projects/00000000-0000-0000-0000-000000000000/tags`)
      .set('authorization', token)
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(res.body.message, 'Invalid project ID');
        assert.end();
      });
  }
);

test('GET /:version/projects/:project/tags', twoTags, (assert, token) => {
  assert.app
    .get(`/v1/projects/00000000-0000-0000-0000-000000000000/tags`)
    .set('authorization', token)
    .expect(200, (err, res) => {
      assert.ifError(err, 'should not error');
      assert.deepEqual(res.body.length, 2, 'should return 2 tags');
      const prepped = res.body.map(tag => {
        assert.ok(
          /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/.test(
            tag.id
          ),
          'should return UU tag ID'
        );
        return _.omit(tag, ['id', 'createdAt', 'updatedAt']);
      });
      assert.deepEqual(
        prepped[0],
        {
          project_id: '00000000-0000-0000-0000-000000000000',
          name: 'My Other Tag',
          metadata: {}
        },
        'should return expected tag'
      );
      assert.deepEqual(
        prepped[1],
        {
          project_id: '00000000-0000-0000-0000-000000000000',
          name: 'My Tag',
          metadata: {}
        },
        'should return expected tag'
      );
      assert.end();
    });
});

test(
  'GET /:version/projects/:project/tags - tag query parameter',
  twoTags,
  (assert, token) => {
    assert.app
      .get(
        `/v1/projects/00000000-0000-0000-0000-000000000000/tags?tag=Other%20Tag`
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(res.body.length, 1, 'should return 1 tag');
        const prepped = res.body.map(tag => {
          assert.ok(
            /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/.test(
              tag.id
            ),
            'should return UU tag id'
          );
          return _.omit(tag, ['id', 'createdAt', 'updatedAt']);
        });
        assert.deepEqual(
          prepped[0],
          {
            project_id: '00000000-0000-0000-0000-000000000000',
            name: 'My Other Tag',
            metadata: {}
          },
          'should return expected tag'
        );
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:project/tags - empty tag query parameter',
  twoTags,
  (assert, token) => {
    assert.app
      .get(`/v1/projects/00000000-0000-0000-0000-000000000000/tags?tag=`)
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(res.body.length, 2, 'should return 2 tags');
        const prepped = res.body.map(tag => {
          assert.ok(
            /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/.test(
              tag.id
            ),
            'should return UU tag ID'
          );
          return _.omit(tag, ['id', 'createdAt', 'updatedAt']);
        });
        assert.deepEqual(
          prepped[0],
          {
            project_id: '00000000-0000-0000-0000-000000000000',
            name: 'My Other Tag',
            metadata: {}
          },
          'should return expected tag'
        );
        assert.deepEqual(
          prepped[1],
          {
            project_id: '00000000-0000-0000-0000-000000000000',
            name: 'My Tag',
            metadata: {}
          },
          'should return expected tag'
        );
        assert.end();
      });
  }
);

/* POST /:version/projects/:project/tags */

test(
  'POST /:version/projects/:project/tags - no project',
  [],
  (assert, token) => {
    assert.app
      .post('/v1/projects/00000000-0000-0000-0000-000000000000/tags')
      .set('authorization', token)
      .send({ name: 'My Tag' })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Invalid project ID',
          'should return expected error message'
        );
        assert.end();
      });
  }
);

test(
  'POST /:version/projects/:project/tags - missing name attribute',
  noTags,
  (assert, token) => {
    assert.app
      .post('/v1/projects/00000000-0000-0000-0000-000000000000/tags')
      .set('authorization', token)
      .send({})
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'req.body.name is a required body attribute'
        );
        assert.end();
      });
  }
);

test(
  'POST /:version/projects/:project/tags - missing name attribute',
  noTags,
  (assert, token) => {
    assert.app
      .post('/v1/projects/00000000-0000-0000-0000-000000000000/tags')
      .set('authorization', token)
      .send({})
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'req.body.name is a required body attribute'
        );
        assert.end();
      });
  }
);

test(
  'POST /:version/projects/:project/tags - invalid body attribute',
  noTags,
  (assert, token) => {
    assert.app
      .post('/v1/projects/00000000-0000-0000-0000-000000000000/tags')
      .set('authorization', token)
      .send({ name: 'My Tag', invalidAttr: true })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Request contains unexpected attribute invalidAttr'
        );
        assert.end();
      });
  }
);

test(
  'POST /:version/projects/:project/tags - no metadata',
  noTags,
  (assert, token) => {
    assert.app
      .post('/v1/projects/00000000-0000-0000-0000-000000000000/tags')
      .set('authorization', token)
      .send({ name: 'My Tag' })
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        const prepped = _.omit(res.body, ['id', 'createdAt', 'updatedAt']);
        assert.deepEqual(prepped, {
          project_id: '00000000-0000-0000-0000-000000000000',
          name: 'My Tag',
          metadata: {}
        });
        assert.end();
      });
  }
);

test(
  'POST /:version/projects/:project/tags - metadata',
  noTags,
  (assert, token) => {
    assert.app
      .post('/v1/projects/00000000-0000-0000-0000-000000000000/tags')
      .set('authorization', token)
      .send({ name: 'My Tag', metadata: { key: 'value' } })
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        const prepped = _.omit(res.body, ['id', 'createdAt', 'updatedAt']);
        assert.deepEqual(prepped, {
          project_id: '00000000-0000-0000-0000-000000000000',
          name: 'My Tag',
          metadata: { key: 'value' }
        });
        assert.end();
      });
  }
);

/* GET /:version/projects/:project/tags/:tag */

test(
  'GET /:version/projects/:project/tags/:tag - no project',
  [],
  (assert, token) => {
    assert.app
      .get('/v1/projects/00000000-0000-0000-0000-000000000000/tags')
      .set('authorization', token)
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Invalid project ID',
          'should return expected error message'
        );
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:project/tags/:tag - no tag',
  noTags,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/00000000-0000-0000-0000-000000000000/tags/11111111-1111-1111-1111-111111111111'
      )
      .set('authorization', token)
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Invalid tag ID',
          'should return expected error message'
        );
        assert.end();
      });
  }
);

test('GET /:version/projects/:project/tags/:tag', oneTag, (assert, token) => {
  assert.app
    .get('/v1/projects/00000000-0000-0000-0000-000000000000/tags/')
    .set('authorization', token)
    .expect(200, (err, res) => {
      assert.ifError(err, 'should not error');
      assert.app
        .get(
          `/v1/projects/00000000-0000-0000-0000-000000000000/tags/${res.body[0]
            .id}`
        )
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err, 'should not error');
          const prepped = _.omit(res.body, ['id', 'createdAt', 'updatedAt']);
          assert.deepEqual(prepped, {
            project_id: '00000000-0000-0000-0000-000000000000',
            name: 'My Tag',
            metadata: {}
          });
          assert.end();
        });
    });
});

/* PUT /:version/projects/:project/tags/:tag */

test(
  'PUT /:version/projects/:project/tags/:tag - no project',
  [],
  (assert, token) => {
    assert.app
      .put(
        '/v1/projects/00000000-0000-0000-0000-000000000000/tags/11111111-1111-1111-1111-111111111111'
      )
      .set('authorization', token)
      .send({ name: 'My New Tag Name' })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Invalid project ID',
          'should return expected error message'
        );
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:project/tags/:tag - no tag',
  noTags,
  (assert, token) => {
    assert.app
      .put(
        '/v1/projects/00000000-0000-0000-0000-000000000000/tags/11111111-1111-1111-1111-111111111111'
      )
      .set('authorization', token)
      .send({ name: 'My New Tag Name' })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Invalid tag ID',
          'should return expected error message'
        );
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:project/tags/:tag - no metadata',
  oneTag,
  (assert, token) => {
    assert.app
      .put(
        '/v1/projects/00000000-0000-0000-0000-000000000000/tags/11111111-1111-1111-1111-111111111111'
      )
      .set('authorization', token)
      .send({ name: 'My New Tag Name' })
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        const prepped = res.body.map(tag => {
          assert.ok(
            /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/.test(
              tag.id
            ),
            'should return UU tag ID'
          );
          return _.omit(tag, ['id', 'createdAt', 'updatedAt']);
        });
        assert.deepEqual(
          prepped[0],
          {
            project_id: '00000000-0000-0000-0000-000000000000',
            name: 'My New Tag Name',
            metadata: {}
          },
          'should return expected tag'
        );
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:project/tags/:tag - extends metadata',
  oneTagMetadata,
  (assert, token) => {
    assert.app
      .put(
        '/v1/projects/00000000-0000-0000-0000-000000000000/tags/11111111-1111-1111-1111-111111111111'
      )
      .set('authorization', token)
      .send({
        name: 'My New Tag Name',
        metadata: { anotherKey: 'anotherValue' }
      })
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        const prepped = res.body.map(tag => {
          assert.ok(
            /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/.test(
              tag.id
            ),
            'should return UU tag ID'
          );
          return _.omit(tag, ['id', 'createdAt', 'updatedAt']);
        });
        assert.deepEqual(
          prepped[0],
          {
            project_id: '00000000-0000-0000-0000-000000000000',
            name: 'My New Tag Name',
            metadata: { key: 'value', anotherKey: 'anotherValue' }
          },
          'should return expected tag'
        );
        assert.end();
      });
  }
);

/* DELETE /:version/projects/:project/tags/:tag */

test(
  'DELETE /:version/projects/:project/tags/:tag - no project',
  [],
  (assert, token) => {
    assert.app
      .delete(
        '/v1/projects/00000000-0000-0000-0000-000000000000/tags/22222222-2222-2222-2222-222222222222'
      )
      .set('authorization', token)
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(res.body.message, 'Invalid project ID');
        assert.end();
      });
  }
);

test(
  'DELETE /:version/projects/:project/tags/:tag - no tag',
  noTags,
  (assert, token) => {
    assert.app
      .delete(
        '/v1/projects/00000000-0000-0000-0000-000000000000/tags/22222222-2222-2222-2222-222222222222'
      )
      .set('authorization', token)
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(res.body.message, 'Invalid tag ID');
        assert.end();
      });
  }
);

test(
  'DELETE /:version/projects/:project/tags/:tag',
  itemNotAssociatedWithTag,
  (assert, token) => {
    assert.app
      .delete(
        '/v1/projects/00000000-0000-0000-0000-000000000000/tags/22222222-2222-2222-2222-222222222222'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body,
          {
            message:
              'Successfully deleted tag 22222222-2222-2222-2222-222222222222'
          },
          'should return expected response'
        );
        assert.end();
      });
  }
);

test(
  'DELETE /:version/projects/:project/tags/:tag - associated with item',
  itemToDeleteTagFrom,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(res.body.length, 1, 'should return 1 tag');
        assert.app
          .delete(
            '/v1/projects/00000000-0000-0000-0000-000000000000/tags/22222222-2222-2222-2222-222222222222'
          )
          .set('authorization', token)
          .expect(200, (err, res) => {
            assert.ifError(err, 'should not error');
            assert.deepEqual(
              res.body,
              {
                message:
                  'Successfully deleted tag 22222222-2222-2222-2222-222222222222'
              },
              'should return line number that was deleted'
            );
            assert.app
              .get(
                '/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags'
              )
              .set('authorization', token)
              .expect(200, (err, res) => {
                assert.ifError(err, 'should not error');
                assert.deepEqual(res.body.length, 0, 'should return 0 tags');
                assert.end();
              });
          });
      });
  }
);

/* GET /:version/projects/:project/items/:item/tags */

test(
  'GET /:version/projects/:project/items/:item/tags - no project',
  [],
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags'
      )
      .set('authorization', token)
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Invalid project ID',
          'should return expected error message'
        );
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:project/items/:item/tags - no items',
  noTags,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags'
      )
      .set('authorization', token)
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Invalid item ID',
          'should return expected error message'
        );
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:project/items/:item/tags - 1 tag',
  itemOneTag,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        const prepped = res.body.map(tag => {
          assert.ok(
            /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/.test(
              tag.id
            ),
            'should return a UU tag ID'
          );
          assert.ok(
            /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/.test(
              tag.item_tag.tagId
            ),
            'should return a UU tag ID'
          );
          assert.deepEqual(
            typeof tag.item_tag.itemAutoId,
            'number',
            'should return an item_tag auto-generated ID'
          );
          return _.omit(tag, ['id', 'createdAt', 'updatedAt', 'item_tag']);
        });
        assert.deepEqual(prepped, [
          {
            project_id: '00000000-0000-0000-0000-000000000000',
            name: 'My Tag',
            metadata: {}
          }
        ]);
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:project/items/:item/tags - 2 tags',
  itemTwoTags,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        const prepped = res.body.map(tag => {
          assert.ok(
            /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/.test(
              tag.id
            ),
            'should return a UU tag ID'
          );
          assert.ok(
            /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/.test(
              tag.item_tag.tagId
            ),
            'should return a UU tag ID'
          );
          assert.deepEqual(
            typeof tag.item_tag.itemAutoId,
            'number',
            'should return an item_tag auto-generated ID'
          );
          return _.omit(tag, ['id', 'createdAt', 'updatedAt', 'item_tag']);
        });
        assert.deepEqual(prepped, [
          {
            project_id: '00000000-0000-0000-0000-000000000000',
            name: 'My Other Tag',
            metadata: {}
          },
          {
            project_id: '00000000-0000-0000-0000-000000000000',
            name: 'My Tag',
            metadata: {}
          }
        ]);
        assert.end();
      });
  }
);

/* POST /:version/projects/:project/items/:item/tags */

test(
  'POST /:version/projects/:project/items/:item/tags - no project',
  [],
  (assert, token) => {
    assert.app
      .post(
        '/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags'
      )
      .set('authorization', token)
      .send({ tag: '11111111-1111-1111-1111-111111111111' })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Invalid project ID',
          'should return expected error message'
        );
        assert.end();
      });
  }
);

test(
  'POST /:version/projects/:project/items/:item/tags - no item',
  itemNoTags,
  (assert, token) => {
    assert.app
      .post(
        '/v1/projects/00000000-0000-0000-0000-000000000000/items/222222/tags'
      )
      .set('authorization', token)
      .send({ tag: '11111111-1111-1111-1111-111111111111' })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Invalid item ID',
          'should return expected error message'
        );
        assert.end();
      });
  }
);

test(
  'POST /:version/projects/:project/items/:item/tags - no tag',
  itemNoTags,
  (assert, token) => {
    assert.app
      .post(
        '/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags'
      )
      .set('authorization', token)
      .send({ tag: '22222222-2222-2222-2222-222222222222' })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Invalid tag ID',
          'should return expected error message'
        );
        assert.end();
      });
  }
);

test(
  'POST /:version/projects/:project/items/:item/tags',
  itemNoTags,
  (assert, token) => {
    assert.app
      .post(
        '/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags'
      )
      .set('authorization', token)
      .send({ tag: '11111111-1111-1111-1111-111111111111' })
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(res.body.length, 1, 'should return 1 result');
        const item = res.body[0];
        let prepped = _.omit(item, ['lockedTill', 'createdAt', 'updatedAt']);
        prepped.item_tag = _.omit(prepped.item_tag, ['createdAt', 'updatedAt']);
        assert.deepEqual(prepped, {
          id: '111111',
          project_id: '00000000-0000-0000-0000-000000000000',
          pin: { type: 'Point', coordinates: [77, 77] },
          instructions: 'created via the tests',
          createdBy: 'userone',
          featureCollection: { type: 'FeatureCollection', features: [] },
          status: 'open',
          lockedBy: null,
          metadata: {},
          sort: 0,
          item_tag: {
            itemAutoId: 1,
            tagId: '11111111-1111-1111-1111-111111111111'
          }
        });
        assert.end();
      });
  }
);

/* DELETE /:version/projects/:project/items/:item/tags */

test(
  'DELETE /:version/projects/:project/items/:item/tags - no project',
  [],
  (assert, token) => {
    assert.app
      .delete(
        '/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags/22222222-2222-2222-2222-222222222222'
      )
      .set('authorization', token)
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Invalid project ID',
          'should return expected error message'
        );
        assert.end();
      });
  }
);

test(
  'DELETE /:version/projects/:project/items/:item/tags - no item',
  itemToDeleteTagFrom,
  (assert, token) => {
    assert.app
      .delete(
        '/v1/projects/00000000-0000-0000-0000-000000000000/items/222222/tags/22222222-2222-2222-2222-222222222222'
      )
      .set('authorization', token)
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Invalid item ID',
          'should return expected error message'
        );
        assert.end();
      });
  }
);

test(
  'DELETE /:version/projects/:project/items/:item/tags - no tag',
  itemNotAssociatedWithTag,
  (assert, token) => {
    assert.app
      .delete(
        '/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags/22222222-2222-2222-2222-222222222222'
      )
      .set('authorization', token)
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Tag ID 22222222-2222-2222-2222-222222222222 was not associated with item 111111',
          'should return expected error message'
        );
        assert.end();
      });
  }
);

test(
  'DELETE /:version/projects/:project/items/:item/tags',
  itemToDeleteTagFrom,
  (assert, token) => {
    assert.app
      .delete(
        '/v1/projects/00000000-0000-0000-0000-000000000000/items/111111/tags/22222222-2222-2222-2222-222222222222'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        const prepped = _.omit(res.body, [
          'createdAt',
          'updatedAt',
          'lockedTill'
        ]);
        assert.deepEqual(
          prepped,
          {
            id: '111111',
            project_id: '00000000-0000-0000-0000-000000000000',
            pin: { type: 'Point', coordinates: [77, 77] },
            instructions: 'created via the tests',
            createdBy: 'userone',
            featureCollection: { type: 'FeatureCollection', features: [] },
            status: 'open',
            lockedBy: null,
            metadata: {},
            sort: 0
          },
          'should return expected message'
        );
        assert.end();
      });
  }
);
