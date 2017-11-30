const sequelize = require('../../database/index');
const constants = require('../constants');

module.exports = getQuadkeysQuery;

/**
 * Returns a promise for query for quadkey item counts
 *
 * @param {UUID} projectId - project UUID
 * @param {number} zoomLevel - zoom level to fetch aggregations for
 * @param {quadkey} within - quadkey string to search within
 * @param {Object} q - additional query / filter parameters
 * @returns {Promise<Array>} - resolves to array of quadkey objects with counts 
 */
function getQuadkeysQuery(projectId, zoomLevel, within, q) {
  const selectFragment = getSelect();
  const whereFragment = getWhere(q);
  const joinFragment = getJoin(q);
  const groupBy = getGroupBy();
  const replacements = getReplacements(projectId, zoomLevel, within, q);
  const sql = `${selectFragment} ${joinFragment} ${whereFragment} ${groupBy}`;
  return sequelize
    .query(sql, {
      replacements: replacements,
      type: sequelize.QueryTypes.SELECT
    })
    .then(results => {
      return results;
    });
}

function getReplacements(projectId, zoomLevel, within, q) {
  let replacements = {
    projectId,
    zoomLevel,
    within: `${within}%`
  };
  if (q.item_tags) {
    replacements.item_tags = q.item_tags.split(',');
  }
  if (q.item_from) {
    replacements.item_from = q.item_from;
  }
  if (q.item_to) {
    replacements.item_to = q.item_to;
  }
  if (q.item_status) {
    replacements.item_status = q.item_status;
  }
  if (q.item_lock) {
    replacements.now = new Date().toISOString();
  }
  return replacements;
}

function getSelect() {
  return `
    SELECT COUNT(substring("quadkey", 1, :zoomLevel)) AS "item_count",
      substring("quadkey", 1, :zoomLevel) AS "quadkey"
    FROM
      "items" as "item"
  `;
}

function getJoin(q) {
  if (!q.item_tags) {
    return '';
  }
  return `
      INNER JOIN (
        "item_tag" AS "tags->item_tag"
          INNER JOIN "tags" AS "tags" ON "tags"."id" = "tags->item_tag"."tagId"
      ) ON "item"."auto_id" = "tags->item_tag"."itemAutoId"
        AND "tags"."id" IN (:item_tags)
  `;
}

function getWhere(q) {
  let where = `
    WHERE "item"."project_id" = :projectId
      AND "item"."quadkey" LIKE :within
  `;
  if (q.item_from) {
    where += ` AND "item"."createdAt" > :item_from`;
  }
  if (q.item_to) {
    where += ` AND "item"."createdAt" < :item_to`;
  }
  if (q.item_status) {
    where += ` AND "item"."status" = :item_status`;
  }
  if (q.item_lock) {
    const locked = q.lock === constants.LOCKED;
    const operator = locked ? '>' : '<';
    where += ` AND "item"."lockedTill" ${operator} :now`;
  }
  return where;
}

function getGroupBy() {
  return 'GROUP BY substring("quadkey", 1, :zoomLevel);';
}
