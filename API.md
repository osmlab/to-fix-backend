### GET `/status`
- confirms the server is working and publicly exposed
- request example: <pre>http://localhost:8000<b>/status</b></pre>
- response format: JSON
- response example: 
```js
{
    "status": "a ok"
}
```

### GET `/count/{taskName}`
- returns the count of the total number of items and all available items for a given task
- request example: <pre>http://localhost:8000<b>/count/brokenbuildings</b></pre>
- response format: JSON
- response example: 
```js
{
    "total": 5096,
    "available": 3741
}
```

### GET `/track/{taskName}/{key}:{value}`
- returns tracking results for a given task, key, and value
- {key}:{value} are dependent on what is tracked with `/track/{taskName}`
- results are sorted by unixtime in ascending order
- request example: <pre>http://localhost:8000<b>/track/brokenbuildings/user:joey</b></pre>
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

### POST `/track/{taskName}`
- track attributes for a given task
