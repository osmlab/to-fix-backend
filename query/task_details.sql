DROP TABLE task_details;

CREATE TABLE task_details
(
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  title VARCHAR(150),
  source VARCHAR(150),
  owner VARCHAR(150),
  description TEXT,
  updated INTEGER,
  status BOOLEAN
)
-- The updated is for test, thiking on do a function to update or update on index.js 
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('unconnectedmajor', 'Unconnected major', 'unconnected', 'mapbox', 'Unconnected major',1436882027,true );
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('unconnectedminor', 'Unconnected minor', 'unconnected', 'mapbox', 'Unconnected minor',1436882027,true);
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('deadendoneway', 'Impossible one-ways', 'keepright', 'mapbox', 'Impossible one-ways',1436882027,false);
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('impossibleangle', 'Kinks', 'keepright', 'mapbox', 'Kinks',1436882027,false);
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('mixedlayer', 'Mixed layers', 'keepright', 'mapbox', 'Mixed layers',1436882027,false);
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('nonclosedways', 'Broken polygons', 'keepright', 'mapbox', 'Broken polygons',1436882027,false);
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('loopings', 'Loopings', 'keepright', 'mapbox', 'Loopings',1436882027,false);
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('strangelayer', 'Strange layer', 'keepright', 'mapbox', 'Strange layer',1436882027,false);
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('highwayhighway', 'Highway intersects highway', 'keepright', 'mapbox', 'Highway intersects highway',1436882027,false);
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('highwayfootpath', 'Highway intersects footpath', 'keepright', 'mapbox', 'Highway intersects footpath',1436882027,false);
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('highwayriverbank', 'Highway intersects water', 'keepright', 'mapbox', 'Highway intersects water',1436882027,false);
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('mispelledtags', 'Misspelled tags', 'keepright', 'mapbox', 'Misspelled tags',1436882027,false);
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('tigerdelta', 'Tiger delta', 'tigerdelta', 'mapbox', 'Tiger delta',1436882027,false);
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('usabuildingoverlaps', 'USA overlapping buildings', 'nycbuildings', 'mapbox', 'USA overlapping buildings',1436882027,false);
INSERT INTO task_details(id, title, source, owner, description, updated, status)  VALUES ('rk', 'krakatoa', 'krakatoa', 'mapbox', 'krakatoa',1436882027, true);
--SELECT  MAX("time") FROM impossibleangle_stats

--DELETE FROM task_details

SELECT id, title, source FROM task_details WHERE status = false




