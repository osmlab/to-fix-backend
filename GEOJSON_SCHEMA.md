See to-fix API docs at https://github.com/osmlab/to-fix-backend/blob/master/API.md.

### Reading the schema
Tofix accepts a geojson, so all the regular [geojson](http://geojson.org/) and [json](http://www.json.org/) schema rules apply automatically.

- Do not assume anything that is not explicitly written.
- `?` indicates an optional property.
```JSON
// this means `propA` is not required.
"propA"?: string
```
- `A<string>`: indicates `A` is a subset of string.
Example -
 ```
 // link is a type of URI which is to be sent as a string
 "link": URI<string>
 ```
 - ` X | Y `: indicates either type `X` or `Y`
 ```
 // `propA` could either be  "Point" or  "PolyLine"
"propA": "Point" | "PolyLine"
 ```
- `MUST`: (in all caps) anywhere in the documentation, means that something is required and that not following this statement will result in errors.
- `SHOULD`: (in all caps) anywhere in the documentation, means that something isn’t strictly required, but that not following the statement will result in unexpected outcomes.


## the item `featureCollection` property

All geometric attributes of an Item MUST be stored as Features in an item's `featureCollection` field. There are no exceptions to this rule. Because these properties have semantic meaning to to-fix, all features MUST also follow the guidelines described in the "feature property guidelines" section below.

#### Feature property guidelines

```js
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": GeojsonGeometry,
        "coordinates": Array
      },
      "properties": {

        /**
         * Used to assign the feature a color and to label the feature in map legend.
         * Examples of "category" include:
         *  - Feedback event
         *  - Reroute location
         *  - GPS trace
         *  - Directions line
         */
        "tofix:category": string,

        /**
         * Default Value = `false`.
         * This property is used to render directionality arrows on
         * LineStrings. It SHOULD not be used with Points or Polygons.
         */
        "tofix:has-direction"?: boolean,

        /**
         * this property is used to group related features.
         */
        "tofix:group"?: string,

        /**
         * this property is used to add directionality to a group of features.
         * The value of this number will dictate where in the linked list the feature falls.
         * CATCH - if used on one feature in a group it MUST be  used by all features in the group.
         */
        "tofix:group-position"?: number,

        /**
         * properties with this type will be displayed as strings in the table view. the value
         * for `[name]` will be shown in the left column of the table.
         */
        "string:[name]"?: string,

        /**
         * properties with this type will be displayed as numbers in the table view. the value for `[name]` will be shown in the
         * left column of the table.
         */
        "number:[name]"?: number,

        /**
         * properties with this type will be displayed as dates in the table view. the value for `[name]` will be shown in the
         * left column of the table.  All `date` properties MUST be the
         * `YYYY-MM-DDTHH:MM:SSZ` [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format.
         */
        "date:[name]"?: ISODate<string>,

        /**
         * properties with this type will be displayed with an <a> tag in the table view. the value for `[name]` will be
         * shown in the left column of the table. Value MUST be a valid URI.
         */
        "link:[name]"?: URI<string>,

        /**
         * properties with this type will be displayed with an <audio> tag in the table view. the value for `[name]` will be
         * shown in the left column of the table. Value MUST be a valid URI.
         */
        "audio:[name]"?: URI<string> | DATA_URI<string>,

        /**
         * properties with this type will be displayed with an <img> tag in the table view. the value for `[name]` will be
         * shown in the left column of the table. Value MUST be a valid URI.
         */
        "image:[name]"?: URI<string> | DATA_URI<string>
      }
    }
  ]
}
```

#### Examples

![example-1](/docs_images/example-1.png)

```js
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "PolyLine",
        "coordinates": [[0,0], [1,1]]
      },
      "properties": {
        "tofix:category": "Untagged oneway",
        "tofix:has-direction": true,
        "date:timestamp": "2017-10-03T13:02:57.058Z",
      }
    }
  ]
}
```


![example-2](/docs_images/example-2.png)

```js
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "PolyLine",
        "coordinates": [[0,0], [1,1]]
      },
      "properties": {
        "tofix:category": "Reroute",
        "tofix:has-direction": true,
        "image:Screenshot": "data:image/jpeg;base64,...",
        "date:timestamp": "2017-10-03T13:02:57.058Z",
        "link:someFile": "https://example.com/xyz"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [0,0]
      },
      "properties": {
        "tofix:category": "Routing error",
        "number:batteryLevel": 92,
        "date:created": "2017-10-03T13:02:57.058Z",
        "string:applicationState": "Foreground",
        ...more
      }
    }
    ...more
  ]
}
```
