'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable(
        'item_tag',
        {
          authorName: {
            type: Sequelize.STRING,
            allowNull: false,
            field: 'authorName'
          },
          authorId: {
            type: Sequelize.STRING,
            allowNull: false,
            field: 'authorId'
          },
          createdAt: {
            type: Sequelize.DATE,
            field: 'createdAt'
          },
          updatedAt: {
            type: Sequelize.DATE,
            field: 'updatedAt'
          },
          tagId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'tags',
              key: 'id'
            }
          },
          itemAutoId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'items',
              key: 'auto_id'
            }
          }
        },
        {
          timestamps: true,
          freezeTableName: true,
          tableName: 'item_tag'
        }
      )
      .then(() => {
        let sql = `CREATE UNIQUE INDEX "ItemTagCompoundIndex"
            ON public."item_tag"
            USING btree
            ("tagId","itemAutoId");
          `;
        return queryInterface.sequelize.query(sql, { raw: true });
      });
  },

  down: queryInterface => {
    return queryInterface.dropTable('item_tag');
  }
};
