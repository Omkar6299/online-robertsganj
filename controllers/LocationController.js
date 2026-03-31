import State from '../models/State.js';
import District from '../models/District.js';

export const getStates = async (req, res) => {
    try {
        const states = await State.findAll({
            order: [['name', 'ASC']]
        });

        // Map to format expected by frontend
        const formattedStates = states.map(state => ({
            id: state.id, // Using numeric DB ID
            name: state.name,
            code: state.code // Optional, if needed
        }));

        res.json({
            success: true,
            data: {
                states: formattedStates
            }
        });
    } catch (error) {
        console.error('getStates Error:', error);
        res.status(500).json({ success: false, message: 'Failed to load states' });
    }
};

export const getDistricts = async (req, res) => {
    try {
        const { state_id } = req.query; // This can now be the numeric DB ID or state name

        if (!state_id) {
            return res.status(400).json({ success: false, message: 'State ID or Name is required' });
        }

        let queryStateId = state_id;
        if (isNaN(queryStateId)) {
            const stateRecord = await State.findOne({ where: { name: state_id } });
            if (!stateRecord) {
                return res.status(404).json({ success: false, message: 'State not found' });
            }
            queryStateId = stateRecord.id;
        }

        const districts = await District.findAll({
            where: { state_id: queryStateId },
            order: [['name', 'ASC']]
        });

        const formattedDistricts = districts.map(district => ({
            name: district.name
        }));

        res.json({
            success: true,
            data: {
                districts: formattedDistricts
            }
        });
    } catch (error) {
        console.error('getDistricts Error:', error);
        res.status(500).json({ success: false, message: 'Failed to load districts' });
    }
};
