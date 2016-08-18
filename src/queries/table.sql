--DROP TABLE projects;
CREATE TABLE projects( 
  id serial PRIMARY KEY,
  idstr varchar(50) UNIQUE,
  status boolean,
  body jsonb
 );
CREATE INDEX idx_projects_body ON projects USING GIN (body);

--DROP TABLE tasks;
CREATE TABLE tasks(
  id serial PRIMARY KEY,
  idstr varchar(50) UNIQUE,
  idproject varchar(50),
  status boolean,
  body jsonb
 );
CREATE INDEX idx_tasks_body ON tasks USING GIN (body);

--DROP TABLE item
CREATE TABLE items( 
  id serial PRIMARY KEY,
  idstr varchar(50) UNIQUE,
  time integer,
  body jsonb
 );
CREATE INDEX idx_items_body ON items USING GIN (body);

--DROP TABLE stats
CREATE TABLE stats(
  "time" integer,
  body jsonb
);
CREATE INDEX idx_time_stats ON stats("time");



