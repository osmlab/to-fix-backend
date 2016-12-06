# to-fix-backend

The server component of to-fix which provides the API that interacts with the front end. You can find the front end at https://github.com/osmlab/to-fix.

## Environment variables

- ElasticHost - default: 'localhost:9200'
- UploadPassword - required
- EsIndex, default = 'tofix'

## Environment variables for testing

- ElasticHost - default: 'localhost:9200'
- UploadPassword = test
- EsIndex = test 

## Installation

```
git clone https://github.com/osmlab/to-fix-backend.git 
cd to-fix-backend/
npm install
npm start
```