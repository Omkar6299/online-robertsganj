import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import State from './State.js';

const District = sequelize.define('District', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    state_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'states',
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'districts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: false
});

// Define association
State.hasMany(District, { foreignKey: 'state_id' });
District.belongsTo(State, { foreignKey: 'state_id' });

export default District;
