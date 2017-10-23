'use strict';

const test = require('./lib/test');

const itemFixture = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    items: [
      {
        id: '77',
        pin: [77, 77],
        comments: [
          {
            createdBy: 'usertwo',
            body: 'first'
          },
          {
            body: 'second'
          }
        ]
      },
      {
        id: '30',
        pin: [30, 30]
      }
    ]
  }
];

test(
  'GET /projects/:project/items/:item/comments - get comments for item',
  itemFixture,
  (assert, token) => {
    assert.app
      .get('/projects/00000000-0000-0000-0000-000000000000/items/77/comments')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'get comments does not error');
        assert.equal(res.body.length, 2, '2 comments fetched');
        assert.end();
      });
  }
);

test(
  'GET /projects/:project/items:item/comments - comments should be empty for no comments',
  itemFixture,
  (assert, token) => {
    assert.app
      .get('/projects/00000000-0000-0000-0000-000000000000/items/30/comments')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'get 0 comments does not error');
        assert.equal(res.body.length, 0, '0 comments fetched');
        assert.end();
      });
  }
);

test(
  'GET /projects/:project/items/:item/comments/:comment - fetch a single comment',
  itemFixture,
  (assert, token) => {
    assert.app
      .get('/projects/00000000-0000-0000-0000-000000000000/items/77/comments')
      .set('authorization', token)
      .expect(200, (err, res) => {
        const comment1 = res.body[0];
        assert.app
          .get(
            `/projects/00000000-0000-0000-0000-000000000000/items/77/comments/${comment1.id}`
          )
          .set('authorization', token)
          .expect(200, (err, res) => {
            assert.ifError(err, 'fetching single comment does not error');
            assert.deepEqual(
              res.body,
              comment1,
              'fetches single comment as expected'
            );
            assert.end();
          });
      });
  }
);

test(
  'POST /projects/:project/items/:item/comments - create a comment',
  itemFixture,
  (assert, token) => {
    assert.app
      .post('/projects/00000000-0000-0000-0000-000000000000/items/30/comments')
      .set('authorization', token)
      .send({
        body: 'test comment',
        pin: [20, 20]
      })
      .expect(200, err => {
        assert.ifError(err, 'POSTing comment did not error');
        assert.end();
      });
  }
);

test(
  'DELETE /projects/:project/items/:item/comments/:comment - delete a comment',
  itemFixture,
  (assert, token) => {
    assert.app
      .get('/projects/00000000-0000-0000-0000-000000000000/items/77/comments')
      .set('authorization', token)
      .expect(200, (err, res) => {
        const comments = res.body;
        assert.equal(comments.length, 2, '2 comments before deletion');
        const comment1id = res.body[0].id;
        assert.app
          .delete(
            `/projects/00000000-0000-0000-0000-000000000000/items/77/comments/${comment1id}`
          )
          .set('authorization', token)
          .expect(200, (err, res) => {
            assert.ifError(err, 'deleting comment did not error');
            assert.equal(res.body.id, comment1id, 'correct id was deleted');
            assert.app
              .get(
                '/projects/00000000-0000-0000-0000-000000000000/items/77/comments'
              )
              .set('authorization', token)
              .expect(200, (err, res) => {
                assert.equal(
                  res.body.length,
                  1,
                  'Only 1 comment after deletion'
                );
                assert.end();
              });
          });
      });
  }
);

//TODO: test error conditions and other things
