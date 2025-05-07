"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const index_1 = require("../index");
async function seed() {
    // Check if organisations already exist
    const checkResult = await (0, index_1.query)('SELECT COUNT(*) FROM organisations');
    if (parseInt(checkResult.rows[0].count) > 0) {
        console.log('Organisations already seeded, skipping...');
        return;
    }
    // Seed organisations
    await (0, index_1.query)(`
    INSERT INTO organisations (name) VALUES
    ('Main Organisation'),
    ('Research Division'),
    ('Operations Division')
  `);
    console.log('Organisations seeded successfully');
}
;
//# sourceMappingURL=001_organisations.js.map