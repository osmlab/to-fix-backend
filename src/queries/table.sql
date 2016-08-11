CREATE TABLE projects( 
  id serial PRIMARY KEY,
  idstr varchar(50),
  name varchar(150),
  data text,
  status boolean
 );
--DROP table projects

CREATE TABLE tasks( 
  id serial PRIMARY KEY,
  idstr varchar(50),
  idprojects varchar(50),
  name varchar(150),
  description text,
  updated integer,
  status boolean,
  changeset_comment text 
 )
--DROP table tasks

 CREATE TABLE item( 
  id serial PRIMARY KEY,
  idsrt varchar(50),
  time integer,
  body jsonb
 )
 --DROP table item

select * from item