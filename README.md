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
sh deploy/install.sh
npm start
```

####Other Installation
- install PostgreSQL, I recommend [postgres.app](http://postgresapp.com/) for OS X
- install node.js, npm if needed
- run `npm install`
- run `node index.js`

####Additional steps for running locally on OS X
- if you are running the Postgres.app don't forget to add the binaries to your $PATH environment. This can be done by adding `export PATH=$PATH:/Applications/Postgres.app/Contents/Versions/latest/bin` to your .bash_profile or .zshrc configuration files.

####Adding a task
Adding a task requires POSTing a CSV to the API, see [API.md](API.md) and adding the necessary logic to the front end of to-fix to know how to process the results. This is currently hard coded into the front end (at `src/stores/map_store.js`), but something that will be abstracted in the future, making it easier to add new tasks. Changing the items that are selectible in the sidebar happens in `src/data/tasks.json` on the front end.
