'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('students', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      student_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      class: {
        type: Sequelize.STRING(50),
      },
      attendance: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      called_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('students');
  },
};
