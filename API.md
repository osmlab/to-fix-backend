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
  - for example: `/track/unconnectedmajor/from:2015-03-21/to:2015-03-24`
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
- request example: `/track_stats/unconnectedmajor/from:2015-03-21/to:2015-03-24`
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
