import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must contain at least a header and one data row' },
        { status: 400 }
      );
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    const nameIndex = headers.indexOf('name');
    
    if (nameIndex === -1) {
      return NextResponse.json(
        { error: 'CSV must contain a "name" column' },
        { status: 400 }
      );
    }

    const addressIndex = headers.indexOf('address');
    const suburbIndex = headers.indexOf('suburb');
    const stateIndex = headers.indexOf('state');
    const postcodeIndex = headers.indexOf('postcode');
    const phoneIndex = headers.indexOf('phone');
    const emailIndex = headers.indexOf('email');
    const websiteIndex = headers.indexOf('website');

    const validStates = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
    const errors: Array<{ row: number; error: string }> = [];
    let imported = 0;

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
      const rowNumber = i + 1;

      try {
        const name = row[nameIndex]?.trim();
        if (!name) {
          errors.push({ row: rowNumber, error: 'School name is required' });
          continue;
        }

        // Check if school already exists
        const existingSchool = await db.school.findFirst({
          where: {
            name: {
              equals: name,
              mode: 'insensitive'
            }
          }
        });

        if (existingSchool) {
          errors.push({ row: rowNumber, error: `School "${name}" already exists` });
          continue;
        }

        const state = stateIndex >= 0 ? row[stateIndex]?.trim().toUpperCase() : '';
        if (state && !validStates.includes(state)) {
          errors.push({ row: rowNumber, error: `Invalid state "${state}". Must be one of: ${validStates.join(', ')}` });
          continue;
        }

        const email = emailIndex >= 0 ? row[emailIndex]?.trim() : '';
        if (email && !email.includes('@')) {
          errors.push({ row: rowNumber, error: `Invalid email format: "${email}"` });
          continue;
        }

        // Generate acara_id
        const acara_id = `IMPORT_${Date.now()}_${name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 10)}_${i}`;

        // Create school
        await db.school.create({
          data: {
            acara_id,
            name,
            suburb: suburbIndex >= 0 ? row[suburbIndex]?.trim() || '' : '',
            state: state || '',
            postcode: postcodeIndex >= 0 ? row[postcodeIndex]?.trim() || '' : '',
            type: 'Unknown',
            sector: 'Unknown',
            status: 'Active',
            latitude: 0,
            longitude: 0,
            address: addressIndex >= 0 ? row[addressIndex]?.trim() : null,
            phone: phoneIndex >= 0 ? row[phoneIndex]?.trim() : null,
            email: email || null,
            website: websiteIndex >= 0 ? row[websiteIndex]?.trim() : null,
          },
        });

        imported++;
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        errors.push({ row: rowNumber, error: 'Failed to create school' });
      }
    }

    return NextResponse.json({
      success: imported > 0,
      imported,
      errors,
      message: `Import completed. ${imported} schools imported, ${errors.length} errors.`,
    });

  } catch (error) {
    console.error('Error importing schools:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 