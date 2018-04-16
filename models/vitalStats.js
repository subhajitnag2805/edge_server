const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const vitalStatsSchema = mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    loginTime: {
        type: Date,
        default: Date.now
    },
    individualId: {
        type: String
    },
    stats: [Schema.Types.Mixed],

    createdDate: {
        type: Date,
        default: Date.now
    },
    updatedDate: {
        type: Date,
        default: Date.now
    },
    enabled: {
        type: Number,
        default: 1
    }
});

const vitalStats = module.exports = mongoose.model('vitalStats', vitalStatsSchema);