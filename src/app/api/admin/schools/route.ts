import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();

    const data = await request.json();
    const { name, address, city, state, postcode, phone, email, website, description } = data;

    if (!name) {
      return NextResponse.json(
        { error: 'School name is required' },
        { status: 400 }
      );
    }

    // Generate acara_id from name (simplified for admin-created schools)
    const acara_id = `ADMIN_${Date.now()}_${name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10)}`;

    // Check if school with same name already exists
    const existingSchool = await db.school.findFirst({
      where: { 
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: 'A school with this name already exists' },
        { status: 400 }
      );
    }

    const school = await db.school.create({
      data: {
        acara_id,
        name,
        suburb: city || '',
        state: state || '',
        postcode: postcode || '',
        type: 'Unknown',
        sector: 'Unknown', 
        status: 'Active',
        latitude: 0,
        longitude: 0,
        address,
        phone,
        email,
        website,
      },
    });

    return NextResponse.json({
      success: true,
      school,
      message: 'School created successfully',
    });

  } catch (error) {
    console.error('Error creating school:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 