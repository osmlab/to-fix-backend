# to-fix-backend

The server component of to-fix which provides the API that interacts with the front end. You can find the front end at https://github.com/osmlab/to-fix.

## API

For API documentation can be found in [API.md](https://github.com/osmlab/to-fix-backend/blob/master/API.md)

* The API address lies here: `https://build-to-fix-production.mapbox.com`.
* The docs of API address lies here: `https://build-to-fix-production.mapbox.com/docs`

## Requirements

* node >= 6.9.1
* npm >= 5.3.0
* postgres >= 9.6
* postgis >= 2.4.1

## Development and Setup

```
git clone https://github.com/osmlab/to-fix-backend.git
cd to-fix-backend
npm install
```

For OSX, use [Postgress App](http://postgresapp.com/) to install Postgress as it also has PostGIS. For exploring your Postgres database,[Postico](https://eggerapps.at/postico/) is a good solution.

After installing Postgres, create a database for tests, perferablly called `tofix_test`. This database will have tables created and deleted when running the tests.

If you want a non-test database locally, run `node ./bin/setup-database.js` to create the tables and configure PostGIS.

**Environment variables**

This project uses [dotenv](https://www.npmjs.com/package/dotenv) to load environment variable from a `.env` file.

Copy the below example into a `.env` file and fill it out with your information. When running `to-fix-backend` on a server, these are the variables you'll want to exposed to the server's environment.

```
PG_USER=username
PG_PASSWORD=password
PG_DATABASE=database-name
PG_HOST=database-host
PG_PORT=database-port
```

The sequelize CLI is configured from these environment variables in the file `sequelize-config.js`.

**Trusted Client**

If you want to restrict your deployment to users of a trusted frontend client app, you can wrap the
JWT authentication token in another JWT token that is signed with a secret you share between
this backend and your trusted client app.

You will need to add that shared secret to the environment:

```
JWT_TRUSTED_CLIENT_SECRET=your super-duper s3cret
```

**Running tests**

`npm test`

**Running locally**

`npm start`

## Database migrations

Create a new database migration by running the command `npm run migration:create YOUR_MIGRATION_NAME`. This will make a skeleton migration file as described in the [sequelize migration tutorial](http://docs.sequelizejs.com/manual/tutorial/migrations.html).

Run created migrations by running the command `npm run db:migrate`

Undo migrations by running the command `npm run db:migrate:undo`.

When testing migrations it can be helpful to run and then immediately undo migrations, which you can do by combining the two commands `npm run db:migrate && npm run db:migrate:undo`.

## Code Formatting

This project uses [prettier](https://www.npmjs.com/package/prettier) and [eslint](https://www.npmjs.com/package/eslint) to enforce coding standards. It uses [husky](https://www.npmjs.com/package/husky) to make sure these tools are run before every commit. If you need to skip this check for some reason, commit via `git commit -m "your message" --no-verify".
