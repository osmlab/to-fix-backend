##to-fix-backend

The server component of to-fix which provides the API that interacts with the front end. You can find the front end at https://github.com/osmlab/to-fix.

####Environment variables
- DBUsername - default: postgres
- DBPassword - unset by default
- DBAddress - default: localhost
- Database - default: tofix
- UploadPassword - required
- UploadPath - default: `./`

*If DBAddress is set to something other than localhost, postgres will not be installed as part of install.sh*

####Ubuntu Installation
```sh
# set your environment variables
sh install.sh
npm server
```

####Other Installation
- install PostgreSQL, I recommend [postgres.app](http://postgresapp.com/)
- install node.js, npm if needed
- run `npm install`
- run `node index.js`
