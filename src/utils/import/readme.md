# Import data into ElasticSearch

**Example:**

Requirements:

The task `lorito` must exist in the type.
```
 node index --task '{"idtask":"lorito","isCompleted":false,"isAllItemsLoad":false,"iduser":"510836","status":true,"value":{"name":"lorito","description":"lorito description","updated":1488665541,"changesetComment":"lorito comment","stats":[{"edit":0,"fixed":0,"noterror":0,"skip":0,"type":"v1"}]}}' --file '/tmp/brokenpolygons.geojson'
```