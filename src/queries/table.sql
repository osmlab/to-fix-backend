--DROP TABLE tasks;
CREATE TABLE tasks(
  idtask varchar(50) UNIQUE,
  status boolean,
  value jsonb
 );
CREATE INDEX idx_tasks_value ON tasks USING GIN (value);
CREATE INDEX idx_tasks_idtask ON tasks(idtask);

--DROP TABLE item
CREATE TABLE items( 
  key varchar(50) UNIQUE,
  time integer,
  value jsonb
 );
CREATE INDEX idx_items_value ON items USING GIN (value);
CREATE INDEX idx_items_key ON tasks(key);

--DROP TABLE stats
CREATE TABLE stats(
  "time" integer,
  value jsonb
);
CREATE INDEX idx_time_stats ON stats("time");


