import { query } from '../index';

export async function seed(): Promise<void> {
  try {
    // Check if departments already exist
    const checkResult = await query('SELECT COUNT(*) FROM departments');
    if (parseInt(checkResult.rows[0].count) > 0) {
      console.log('Departments already seeded, skipping...');
      return;
    }
    
    // Get organisation IDs with explicit debugging
    console.log('Fetching organisations from database...');
    const orgsResult = await query('SELECT id, name FROM organisations');
    console.log('Raw organisations result:', JSON.stringify(orgsResult.rows, null, 2));
    
    if (orgsResult.rows.length === 0) {
      throw new Error('No organisations found in the database. Please seed organisations first.');
    }
    
    // Hard-code the department creation for maximum control
    console.log('Creating departments with explicit organisation IDs...');
    
    // Get the first organisation ID as a fallback
    const firstOrgId = orgsResult.rows[0].id;
    console.log(`Using first organisation ID as fallback: ${firstOrgId}`);
    
    // IT Department - With explicit ID and logging
    console.log('Inserting IT Department...');
    await query(
      'INSERT INTO departments (organisation_id, name, department_code) VALUES ($1, $2, $3)',
      [firstOrgId, 'IT Department', 'IT']
    );
    console.log('IT Department created successfully');
    
    // Human Resources
    console.log('Inserting Human Resources...');
    await query(
      'INSERT INTO departments (organisation_id, name, department_code) VALUES ($1, $2, $3)',
      [firstOrgId, 'Human Resources', 'HR']
    );
    console.log('Human Resources created successfully');
    
    // Administration
    console.log('Inserting Administration...');
    await query(
      'INSERT INTO departments (organisation_id, name, department_code) VALUES ($1, $2, $3)',
      [firstOrgId, 'Administration', 'ADMIN']
    );
    console.log('Administration created successfully');
    
    // If we have more than one organisation, use the second one for R&D
    if (orgsResult.rows.length > 1) {
      const secondOrgId = orgsResult.rows[1].id;
      console.log(`Using second organisation ID for R&D: ${secondOrgId}`);
      
      console.log('Inserting R&D...');
      await query(
        'INSERT INTO departments (organisation_id, name, department_code) VALUES ($1, $2, $3)',
        [secondOrgId, 'Research & Development', 'R&D']
      );
      console.log('R&D created successfully');
    } else {
      // Fall back to first organisation
      console.log('No second organisation, using first for R&D');
      await query(
        'INSERT INTO departments (organisation_id, name, department_code) VALUES ($1, $2, $3)',
        [firstOrgId, 'Research & Development', 'R&D']
      );
    }
    
    // If we have more than two organisations, use the third one for operations departments
    if (orgsResult.rows.length > 2) {
      const thirdOrgId = orgsResult.rows[2].id;
      console.log(`Using third organisation ID for operations: ${thirdOrgId}`);
      
      console.log('Inserting Field Operations...');
      await query(
        'INSERT INTO departments (organisation_id, name, department_code) VALUES ($1, $2, $3)',
        [thirdOrgId, 'Field Operations', 'FIELD']
      );
      console.log('Field Operations created successfully');
      
      console.log('Inserting Logistics...');
      await query(
        'INSERT INTO departments (organisation_id, name, department_code) VALUES ($1, $2, $3)',
        [thirdOrgId, 'Logistics', 'LOG']
      );
      console.log('Logistics created successfully');
    } else {
      // Fall back to first organisation
      console.log('No third organisation, using first for operations departments');
      
      await query(
        'INSERT INTO departments (organisation_id, name, department_code) VALUES ($1, $2, $3)',
        [firstOrgId, 'Field Operations', 'FIELD']
      );
      
      await query(
        'INSERT INTO departments (organisation_id, name, department_code) VALUES ($1, $2, $3)',
        [firstOrgId, 'Logistics', 'LOG']
      );
    }
    
    console.log('All departments seeded successfully');
  } catch (error) {
    console.error('Error seeding departments:', error);
    throw error;
  }
}