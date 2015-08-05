var queries = {};
queries.create_function = function(tableName, taskid) {
	return 'CREATE OR REPLACE FUNCTION task_' + tableName + '(lockPeriod int , now int) ' +
		' RETURNS item AS $$  ' +
		' DECLARE	 ' +
		' result item;  ' +
		' _total int;  ' +
		' BEGIN  ' +
		' SELECT x.key, x.value INTO result.key , result.value  FROM ' + tableName + ' as x WHERE x.time < now AND x.time != 2147483647 ORDER BY time ASC LIMIT 1; ' +
		' IF result.key ISNULL THEN  ' +
		' SELECT count(*) INTO _total FROM  ' + tableName + ';  ' +
		' result.value = (\'{|\'||\'total|:|\'||_total||\'|}\');  ' +
		' result.key=\'complete\';  ' +
		' UPDATE task_details SET status = subquery.status FROM (SELECT CASE when MIN("time")=2147483647 THEN true  ELSE false END AS status FROM ' + tableName + ') AS subquery WHERE task_details.id=\'' + taskid + '\'; ' +
		' ELSE  ' +
		' UPDATE ' + tableName + '  SET time = (now+lockPeriod) WHERE key=result.key;' +
		' UPDATE task_details  SET updated = now WHERE id=\'' + taskid + '\';' +
		' END IF;  ' +
		' RETURN result;  ' +
		' END;  ' +
		' $$ LANGUAGE plpgsql;';
}

queries.create_type = function() {
	return 'CREATE OR REPLACE FUNCTION create_type() \
			RETURNS void AS $$ \
			BEGIN \
				IF (select exists (select 1 from pg_type where typname = \'item\'))!= TRUE THEN \
					CREATE  TYPE item AS(key VARCHAR(255), value text); \
				END IF; \
			END; \
			$$  LANGUAGE plpgsql; SELECT create_type();'; //execute at same Time as created the function
}

// create table task_details
queries.create_task_details = function() {
	return "CREATE OR REPLACE FUNCTION create_table() \
			RETURNS void AS $$ \
			BEGIN \
				IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'task_details') \
				THEN \
				    CREATE TABLE task_details( task text NOT NULL, attributes hstore, CONSTRAINT task_details_pkey PRIMARY KEY (task)); \
				END IF; \
			END; \
			$$  LANGUAGE plpgsql; \
			SELECT create_table();"; //execute at same Time as created the function
}

module.exports = queries;