To-fix API
---

The API address lies here: `https://to-fix-backend.mapbox.com/`.

### GET [`/status`](https://to-fix-backend.mapbox.com/status)
- Confirms the server is working and publicly exposed
- Response format: JSON

```js
{
  status: "a ok",
  database: "PostgreSQL 9.5.4 on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 4.8.2-19ubuntu1) 4.8.2, 64-bit",
  server: "linux"
}
```

### POST [`/tasks`](https://to-fix-backend.mapbox.com/tasks)
- Creates a task
- Required attributes : `name, description, changesetComment, password, file`
- Example of attributes

```
name:Overlapping major highways
description:Detecting major roads which overlap other major highways.
changesetComment:Deleting overlapped highways using #to-fix https://github.com/mapbox/mapping/issues/167
password:xxxx
file: /path/to/file.geojson
```

- Response format: JSON


```js
{
  "idtask": "overlappingmajorhighwaysvfhl",
  "status": true,
  "value": {
    "name": "Overlapping major highways",
    "description": "Detecting major roads which overlap other major highways.",
    "updated": 1473190369,
    "changesetComment": "Deleting overlapped highways using #to-fix https://github.com/mapbox/mapping/issues/167",
    "stats": [
      {
        "edit": 0,
        "fixed": 0,
        "noterror": 0,
        "skip": 0,
        "date": 1473190369,
        "items": 616
      }
    ]
  }
}

```

### PUT [`/tasks`](https://to-fix-backend.mapbox.com/tasks)
- Updates a task
- Required attributes : `idtask, name, description, changesetComment, password, status, file`
- Example of attributes

```
idtask:overlappingmajorhighwaysvfhl
name:Overlapping major highways
description:Detecting major roads which overlap other major highways.
changesetComment:Deleting overlapped highways using #to-fix https://github.com/mapbox/mapping/issues/167
password:xxxx
status:true
file: /path/to/file.geojson

```

- Response format: JSON

```js
{
  "idtask": "overlappingmajorhighwaysvfhl",
  "status": true,
  "value": {
    "name": "Overlapping major highways",
    "description": "Detecting major roads which overlap other major highways.",
    "updated": 1473190780,
    "changesetComment": "Deleting overlapped highways using #to-fix https://github.com/mapbox/mapping/issues/167",
    "stats": [
      {
        "date": 1473190369,
        "edit": 500,
        "skip": 123,
        "fixed": 302,
        "items": 616,
        "noterror":244,
        "backupFile": "/tmp/overlappingmajorhighwaysvfhl-1.backup"
      },
      {
        "edit": 0,
        "fixed": 0,
        "noterror": 0,
        "skip": 0,
        "date": 1473190780,
        "items": 174
      }
    ],
    "status": "true"
  }
}
```


### DELETE [`/tasks`](https://to-fix-backend.mapbox.com/tasks)
- Removes a task
- Required attributes `idtask, password `
- Example of attributes

```
idtask:overlappingmajorhighwaysvfhl
password:xxxx
```

- Response format: JSON

```js
{
  "task": "overlappingmajorhighwaysvfhl",
  "message": "task was deleted"
}
```

### GET [`/tasks`](https://to-fix-backend.mapbox.com/tasks)
- list all to-fix task
- Response format: JSON

```js
{
  "tasks": [{
    "value": {
      "name": "Broken polygons",
      "stats": [{
        "date": 1473183841,
        "edit": 0,
        "skip": 0,
        "fixed": 0,
        "items": 174,
        "noterror": 0
      }],
      "updated": 1473183841,
      "description": "Unclosed ways which should be closed",
      "changesetComment": "Fixing invalid multipolygon relation by closing unclosed rings and self intersecting areas using #to-fix https://github.com/mapbox/mapping/issues/206"
    },
    "idtask": "brokenpolygonslyzn",
    "status": true
  }, {
    "value": {
      "name": "Overlapping major highways",
      "stats": [{
        "date": 1473183932,
        "edit": 0,
        "skip": 0,
        "fixed": 0,
        "items": 174,
        "noterror": 0
      }],
      "updated": 1473183932,
      "description": "Detecting major roads which overlap other major highways.",
      "changesetComment": "Deleting overlapped highways using #to-fix https://github.com/mapbox/mapping/issues/167"
    },
    "idtask": "overlappingmajorhighwayshysap",
    "status": true
  }]
}

```


### GET [`/tasks/{idtask}`](https://to-fix-backend.mapbox.com/tasks)
- list a task with all details
- Response format: JSON


```js
{
  "value": {
    "value": {
      "name": "Overlapping major highways",
      "stats": [
        {
          "date": 1473183932,
          "edit": 174,
          "skip": 67,
          "fixed": 120,
          "items": 174,
          "noterror": 44,
          "backupFile": "/tmp/overlappingmajorhighwayshysap-1.backup"
        },
        {
          "date": 1473184895,
          "edit": 0,
          "skip": 0,
          "fixed": 0,
          "items": 5727,
          "noterror": 0
        }
      ],
      "status": "true",
      "updated": 1473184895,
      "description": "Detecting major roads which overlap other major highways.",
      "changesetComment": "Deleting overlapped highways using #to-fix https://github.com/mapbox/mapping/issues/167"
    },
    "idtask": "overlappingmajorhighwayshysap",
    "status": true
  }
}
```

### GET [`/tasks/{idtask}/activity/{key}:{value}/{key}:{value}`](https://to-fix-backend.mapbox.com/tasks/nonclosedways/activity/from:2016-07-27/to:2016-08-03)
- Returns tracking results for a given task, key, and value
- {key}:{value} are dependent on what is tracked with `/track/{taskId}`
- results are sorted by unixtime in ascending order
- {to} is optional, if {key} is "from" and "to" is set, results will be data from within that time period
  - for example: `/tasks/nonclosedways/activity/from:2015-03-21/to:2015-03-24`
- Response format: JSON

```js
{
  "updated": 1473193236,
  "data": [
    {
      "time": 1473191491,
      "attributes": {
        "key": "tr9vmfeumrcmta72b8kvtcz6b",
        "user": "rub21",
        "action": "edit",
        "editor": "josm"
      }
    },
    {
      "time": 1473191496,
      "attributes": {
        "key": "gbhwwfypi4y7nnqhoxqqdq6kk",
        "user": "samely",
        "action": "skip",
        "editor": "josm"
      }
    },
    {
      "time": 1473191498,
      "attributes": {
        "key": "dzao5udsuh9xo854km4zcjrrd",
        "user": "ediyes",
        "action": "fixed",
        "editor": "josm"
      }
    } 
    .
    .
    .
  ]
}
```


### GET [`/tasks/{idtask}/activity/{user}/{key}:{value}/{key}:{value}`](https://to-fix-backend.mapbox.com/tasks/nonclosedways/activity/from:2016-07-27/to:2016-08-03)
- Returns tracking results for a given task, for a specific user.
- Example: `/tasks/nonclosedways/activity/user/from:2015-03-21/to:2015-03-24`
- Response format: JSON

```js
{
  "updated": 1473194083,
  "user": "rub21",
  "data": [
    {
      "time": 1473191491,
      "attributes": {
        "key": "tr9vmfeumrcmta72b8kvtcz6b",
        "user": "rub21",
        "action": "edit",
        "editor": "josm"
      }
    },
    {
      "time": 1473191496,
      "attributes": {
        "key": "gbhwwfypi4y7nnqhoxqqdq6kk",
        "user": "rub21",
        "action": "edit",
        "editor": "josm"
      }
    },
    {
      "time": 1473191498,
      "attributes": {
        "key": "dzao5udsuh9xo854km4zcjrrd",
        "user": "rub21",
        "action": "edit",
        "editor": "josm"
      }
    }]
}
```



### GET [`/tasks/{idtask}/track_stats/{key}:{value}/{key}:{value}`]()
- Returns summarized results for 'edit', 'skip', 'fix' events that were tracked
- Request example: `/tasks/nonclosedways/track_stats/from:2016-08-11/to:2017-08-18`
- Response format: JSON

```js
{
  updated: 1470257637,
  stats: [{
      "edit": 40,
      "fixed": 34,
      "noterror": 5,
      "skip": 1,
      "user": "rub21"
    },     {
      "edit": 56,
      "fixed": 53,
      "noterror": 3,
      "skip": 6,
      "user": "ediyes"
    },     {
      "edit": 65,
      "fixed": 46,
      "noterror": 56,
      "skip": 4,
      "user": "samely"
    }]
}
```


### POST [`/tasks/{idtask}/items`](https://to-fix-backend.mapbox.com/task/nonclosedways/items)
- get an item from a task
- required attributes

  ```
  user:rub21
  editor:josm
  ```
- Response format: JSON
- Response example:

```js
{
  "key": "rtal8epzvjavgkpqo59waxo7a",
  "time": 1473191472,
  "value": {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [
        -76.9277831,
        -12.1888769
      ]
    },
    "properties": {
      "name": "Ciber",
      "fixme": "name",
      "source": "Reconocimiento cartografico de campo 2016 por KG",
      "amenity": "internet_cafe",
      "addr:street": "Avenida 27 de Diciembre",
      "tofix": [
        {
          "action": "edit",
          "user": "rub21",
          "time": 1473191526,
          "editor": "josm"
        }
      ]
    }
  }
}

```

### PUT [`/tasks/{idtask}/items`](https://to-fix-backend.mapbox.com/task/nonclosedways/items)
- Mark a given item as fixed,not error or skip, so that other users don't get it later
- JSON data
- Required attributes

  **Fixed**

  ```
  user:rub21
  editor:josm
  action:fixed
  key:rtal8epzvjavgkpqo59waxo7a
  ```
  **Not Error**

  ```
  user:rub21
  editor:josm
  action:fixed
  key:rtal8epzvjavgkpqo59waxo7a
  ```

  **Skip**

  ```
  user:rub21
  editor:josm
  action:fixed
  key:rtal8epzvjavgkpqo59waxo7a
  ```
  - `user` - the user who fixed the item
  - `key` - the key of the item 
  - `action` - the action of the item we did, fixed ,noterror or skip
  - `editor` - the editor which used to work the issue


- Response format: JSON
- Response example:

```js
{
  "update": "ok",
  "key": "rtal8epzvjavgkpqo59waxo7a"
}

```


### GET [`/tasks/{idtask}/items`](https://to-fix-backend.mapbox.com/task/nonclosedways/items)
- Return a `FeatureCollection` of all items in the task
- Response format: JSON

```js
{
  "type": "FeatureCollection",
  "features": [
    {
      "value": {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            -74.228216,
            -13.1464422
          ]
        },
        "properties": {
          "tofix": [
            {
              "time": 1473191288,
              "user": "rub21",
              "action": "edit",
              "editor": "josm"
            }
          ],
          "amenity": "bench"
        }
      }
    },
    {
      "value": {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            -74.2166493,
            -13.1516264
          ]
        },
        "properties": {
          "addr:housenumber": "10"
        }
      }
    },
    .
    .
    .
}
```

### GET [`/tasks/{idtask}/items/{key}`](https://to-fix-backend.mapbox.com/task/nonclosedways/items)
- Return the detail of the item
- Response format: JSON

```js
{
  "key": "rtal8epzvjavgkpqo59waxo7a",
  "time": 1473192776,
  "value": {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [
        -76.9277831,
        -12.1888769
      ]
    },
    "properties": {
      "name": "Ciber",
      "fixme": "name",
      "tofix": [
        {
          "time": 1473191526,
          "user": "samely",
          "action": "edit",
          "editor": "josm"
        },
        {
          "time": 1473192109,
          "user": "rub21",
          "action": "edit",
          "editor": "josm"
        },
        {
          "time": 1473192169,
          "user": "rub21",
          "action": "fixed",
          "editor": "josm"
        }
      ],
      "source": "Reconocimiento cartografico de campo 2016 por KG",
      "amenity": "internet_cafe",
      "addr:street": "Avenida 27 de Diciembre"
    }
  }
}
```
