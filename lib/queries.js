var queries = {}
queries.create_function = function(taskName) {
	return 'CREATE OR REPLACE FUNCTION extract_'+taskName+'(lockPeriod int , now int) \
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
					SELECT count(*) INTO _skip FROM (SELECT time, (each(attributes)).* FROM '+taskName+'_stats) as sub WHERE sub.value = \'skip\' \
					SELECT count(*) INTO _fix FROM (SELECT time, (each(attributes)).* FROM '+taskName+'_stats) as sub WHERE sub.value = \'fix\' \
					SELECT count(*) INTO _noterror FROM (SELECT time, (each(attributes)).* FROM '+taskName+'_stats) as sub WHERE sub.value = \'noterror\' \
					result.value = (\'skip=>\' || _skip||\',\'|| \'noterror=>\'||_noterror||\',\'||\'fix=>\'||_fix||\',\'||\'total=>\'||_total)::hstore; \
					result.key=\'complete\'; \
				ELSE \
					UPDATE '+taskName+' SET time = (now+lockPeriod) WHERE key=result.key; \
				END IF; \
				RETURN result; \
			END; \
			$$ LANGUAGE plpgsql;';
}

module.exports = queries