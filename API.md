API
---

The API address lies here: `http://54.147.184.23:8000/`.

### GET `/status`
- confirms the server is working and publicly exposed
- response format: JSON
- response example: 
```js
{
    "status": "a ok"
}
```

### GET `/count/{taskName}`
- returns the count of the total number of items and all available items for a given task
- request example: `/count/brokenbuildings`
- response format: JSON
- response example: 
```js
{
    "total": 5096,
    "available": 3741
}
```

### GET `/track/{taskName}/{key}:{value}/{to?}`
- returns tracking results for a given task, key, and value
- {key}:{value} are dependent on what is tracked with `/track/{taskName}`
- results are sorted by unixtime in ascending order
- request example: `/track/brokenbuildings/user:joey`
- {to} is optional, if {key} is "from" and "to" is set, results will be data from within that time period
  - for example: `/track/brokenbuildings/from:2015-03-20/to:2015-03-25`
- response example: 
```js
{
    "updated": 1426774350,
    "data":[
        {
            "unixtime": 1426734000,
            "attributes": {
                "action": "got",
                "user": "joey",
                "coords": "33.78, -117.91"
            }
        },
        {
            "unixtime": 1426774227,
            "attributes": {
                "action": "fixed",
                "user": "joey",
                "coords": "38.909, -77.0296"
            }
        }
    ]
}
```

### GET `/track_stats/{taskName}/{from}/{to}`
- returns summarized results for 'edit', 'skip', 'fix' events that were tracked
- request example: `/track_stats/brokenbuildings/from:2015-03-01/to:2015-03-29`
- response example:
```js
{
    "updated": 1427152632,
    "stats": [{
        "skip": "1776",
        "fix": "1249",
        "edit": "2",
        "user": "joey"
    }, {
        "skip": "54",
        "edit": "1671",
        "fix": "1539",
        "user": "franky"
    }, {
        "fix": "15",
        "skip": "1",
        "edit": "10",
        "user": "leslie"
    }]
}
```

### GET `/count_history/{task}/{grouping}`
- returns the count for 'fix', 'skip', and 'edit' actions during the grouping period
- {grouping} can be any field from [PostgreSQL's date_trunc](http://www.postgresql.org/docs/9.1/static/functions-datetime.html#FUNCTIONS-DATETIME-TRUNC)
    - ex: hour, day, week, month
- request example: `/count_history/unconnectedmajor/day`
- response example:
```js
{
    "updated":1427391497,
    "data":[
        {
            "skip":1483,
            "edit":589,
            "fix":2007,
            "start":"1426809600"
        },
        {
            "edit":58,
            "skip":56,
            "fix":35,
            "start":"1426896000"
        },
        {
            "skip":80,
            "edit":3,
            "fix":4,
            "start":"1426982400"
        },
        {
            "fix":1574,
            "edit":1527,
            "skip":386,
            "start":"1427068800"
        },
        {
            "fix":23,
            "edit":41,
            "skip":102,
            "start":"1427155200"
        },
        {
            "edit":7,
            "skip":61,
            "start":"1427241600"
        },
        {
            "skip":213,
            "edit":929,
            "fix":829,
            "start":"1427328000"
        }
    ]
}
```
