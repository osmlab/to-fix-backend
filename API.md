API
---

The API address lies here: `https://to-fix-backend.mapbox.com/`.

### GET [`/status`](https://to-fix-backend.mapbox.com/status)
- confirms the server is working and publicly exposed
- response format: JSON
- response example: 
```js
{
    "status": "a ok"
}
```



### GET [`/tasks`](https://to-fix-backend.mapbox.com/tasks)
- list all to-fix task
- response format: JSON
- response example: 
```js
{
  tasks: [{
    id: "nonclosedways",
    title: "Broken polygons",
    source: "osmlint-multipoint",
    changeset_comment: "#to-fix:nonclosedways, Closing broken polygons, https://github.com/mapbox/mapping/issues/206",
    status: false
  }, {
    id: "crossingmajorhighways",
    title: "Crossing major highways",
    source: "osmlint-point",
    changeset_comment: "#to-fix:crossingmajorhighways, Fixing major highways that cross with other major highways. https://github.com/mapbox/mapping/issues/104",
    status: false
  }]
}

```


### GET [`/count/{taskId}`](https://to-fix-backend.mapbox.com/count/nonclosedways)

- returns the count of the total number of items and all available items for a given task
- request example: `/count/nonclosedways`
- response format: JSON
- response example: 
```js
{
    total: 19863,
    available: 19863,
    active: 0
}
```

### GET [`/track/{taskId}/{key}:{value}/{to}`](https://to-fix-backend.mapbox.com/track/nonclosedways/from:2016-07-27/to:2016-08-03)
- returns tracking results for a given task, key, and value
- {key}:{value} are dependent on what is tracked with `/track/{taskId}`
- results are sorted by unixtime in ascending order
- request example: `/track/nonclosedways/user:joey`
- {to} is optional, if {key} is "from" and "to" is set, results will be data from within that time period
  - for example: `/track/nonclosedways/from:2015-03-21/to:2015-03-24`
- response example: 

```js
{
  updated: 1470257275,
  data: [{
    time: 1470169712,
    attributes: {
      key: "357fb947f43e572ff35fff41ef190302",
      user: "Rub21",
      action: "edit",
      editor: "josm"
    }
  }, {
    time: 1470169751,
    attributes: {
      key: "357fb947f43e572ff35fff41ef190302",
      user: "Rub21",
      action: "fix"
    }
  }]
}
```

### GET [`/track_stats/{taskNId/{from}/{to}`](https://to-fix-backend.mapbox.com/track_stats/nonclosedways/from:2015-03-24/to:2016-08-03)
- returns summarized results for 'edit', 'skip', 'fix' events that were tracked
- request example: `/track_stats/nonclosedways/from:2015-03-21/to:2015-03-24`
- response example:

```js
{
  updated: 1470257637,
  stats: [{
    fix: 1,
    noterror: 1,
    edit: 3,
    user: "4b696d"
  }, {
    edit: 1,
    user: "aarondennis"
  }, {
    edit: 1,
    skip: 40,
    user: "Aaron Lidman"
  }]
}
```

### GET [`/count_history/{task}/{grouping}`](https://to-fix-backend.mapbox.com/count_history/nonclosedways/day)
- returns the count for 'fix', 'skip', and 'edit' actions during the grouping period
- {grouping} can be any field from [PostgreSQL's date_trunc](http://www.postgresql.org/docs/9.1/static/functions-datetime.html#FUNCTIONS-DATETIME-TRUNC)
    - ex: hour, day, week, month
- request example: `/count_history/nonclosedways/day`
- response example:
```js
{
  updated: 1470257783,
  data: [{
    skip: 1,
    start: 1427155200
  }, {
    skip: 1,
    start: 1427241600
  }, {
    skip: 3,
    start: 1427673600
  }]
}
```



### GET [`detail/{taskId}`](https://to-fix-backend.mapbox.com/detail/nonclosedways)
- returns detail of task
- request example: `/detail/nonclosedways`
- response example:

```js
{
  id: "nonclosedways",
  title: "Broken polygons",
  source: "osmlint-multipoint",
  description: "Unclosed ways which should be closed",
  changeset_comment: "#to-fix:nonclosedways, Closing broken polygons, https://github.com/mapbox/mapping/issues/206",
  updated: 1470231208,
  status: false
}
```


### POST [`/task/{task}`](https://to-fix-backend.mapbox.com/task/nonclosedways)
- get an item from a task
- JSON data
- required attributes
    - `user` - the user requesting the item
    ```js
    {user: "Rub21"}
    ```
- response example:

```js
{
  "key": "4671e84d466abe6af4c4a6f7e3edd094",
  "value": {
    "way": "408564289",
    "geom": "MULTIPOINT(18.832774367183447 51.4600577041148,18.832811834290624 51.45997560745553)"
  }
}
```

### POST [`/track/{task}`](https://to-fix-backend.mapbox.com/track/nonclosedways)
- track attributes about the given task
- JSON data
- no required attributes
- empty response

### POST [`/fixed/{task}`](https://to-fix-backend.mapbox.com/fixed/nonclosedways)
- mark a given item as fixed, so that other users don't get it later
- JSON data
- required attributes
    - `user` - the user who fixed the item
    - `key` - the key of the item that was fixed

```js
{
  user: "Rub21",
  key: "0a2a15c897596d2fcddeccebf1fca843"
}
```

- replys "ok"

### POST [`/noterror/{task}`](https://to-fix-backend.mapbox.com/noterror/crossingmajorhighways)
- mark a given item as not a error, so that other users don't get it later
- JSON data
- required attributes
    - `user` - the user who fixed the item
    - `key` - the key of the item that was not a error

```js
{
  user: "Rub21",
  key: "5505cc2b1ede0ef469492a89fc8d0099"
}
```
- replys "ok"


### POST [`/csv`](https://to-fix-backend.mapbox.com/csv)
- create a new task from a csv file or update the existing task
- form data
- required fields
    - `Task name` Title for task 
    - `Source` data source to be used in the task,`osmlint-point`,`keepright`,etc.  [here](https://github.com/osmlab/to-fix/wiki/Output-formats-osmlint-----osmlint2csv---tofix) more detail
    - `Description` description of the errors that the task is storing
    - `Changeset Comment` comment for the changeset
    - `password` - the server password, set with the env variable UploadPassword
    - `file` - the csv file
    - `preserve` load randomize the data or not.

- response example:

    - successful case

    ```js
    {
      status: true,
      taskid: "nonclosedways"
    }
    ```
    
    - unsuccessful case
    
    `error`

