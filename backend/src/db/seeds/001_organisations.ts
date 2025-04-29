import { query } from '../index';

export async function seed(): Promise<void> {
  // Check if organisations already exist
  const checkResult = await query('SELECT COUNT(*) FROM organisations');
  if (parseInt(checkResult.rows[0].count) > 0) {
    console.log('Organisations already seeded, skipping...');
    return;
  }
  
  // Seed organisations
  await query(`
    INSERT INTO organisations (name) VALUES
    ('Main Organisation'),
    ('Research Division'),
    ('Operations Division')
  `);
  
  console.log('Organisations seeded successfully');
};