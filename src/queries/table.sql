CREATE TABLE projects( 
  id serial PRIMARY KEY,
  idstr varchar(50) UNIQUE,
  status boolean,
  body jsonb
 );
--DROP table projects

CREATE TABLE tasks(
  id serial PRIMARY KEY,
  idstr varchar(50) UNIQUE,
  idproject varchar(50),
  status boolean,
  body jsonb
 );
--DROP table tasks

 CREATE TABLE item( 
  id serial PRIMARY KEY,
  idstr varchar(50) UNIQUE,
  time integer,
  body jsonb
 );
--DROP table item

--select * from item


CREATE INDEX idx_argitosbwzfjy
  ON argitosbwzfjy
  USING gin
  (body jsonb_path_ops);

-- Index: idx_search_my_documents

-- DROP INDEX idx_search_my_documents;

CREATE INDEX index_time_argitosbwzfjy
ON argitosbwzfjy (time);

