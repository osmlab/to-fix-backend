var queries = {}
queries.create_function = function(taskName) {
	return 'CREATE OR REPLACE FUNCTION task_'+taskName+'(lockPeriod int , now int) \
			RETURNS item AS $$ \
			DECLARE	\
			result item; \
			_noterror int; \
			_skip int; \
			_fix int; \
			_total int; \
			BEGIN \
				SELECT x.key, x.value INTO result.key , result.value  FROM '+taskName+' as x WHERE x.time < now AND x.time != 2147483647 ORDER BY time ASC LIMIT 1; \
				IF result.key ISNULL THEN \
					SELECT count(*) INTO _total FROM  '+taskName+'; \
					SELECT count(*) INTO _skip FROM (SELECT attributes FROM '+taskName+'_stats WHERE attributes -> \'action\' = \'skip\'AND attributes ->\'key\' !=\'\')as sub; \
					SELECT count(*) INTO _fix FROM (SELECT attributes FROM '+taskName+'_stats WHERE attributes -> \'action\' = \'fix\'AND attributes ->\'key\' !=\'\') as sub; \
					SELECT count(*) INTO _noterror FROM (SELECT attributes FROM '+taskName+'_stats WHERE attributes -> \'action\' = \'noterror\' AND attributes ->\'key\' !=\'\') as sub; \
					result.value = (\'{|skip|:|\' || _skip||\'|,|\'|| \'noterror|:|\'||_noterror||\'|,|\'||\'fix|:|\'||_fix||\'|,|\'||\'total|:|\'||_total||\'|}\'); \
					result.key=\'complete\'; \
				ELSE \
					UPDATE '+taskName+'  SET time = (now+lockPeriod) WHERE key=result.key; \
				END IF; \
				RETURN result; \
			END; \
			$$ LANGUAGE plpgsql;';
}

module.exports = queries