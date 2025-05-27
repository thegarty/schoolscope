// Helper function to create a slug from school name and suburb
export function createSchoolSlug(name: string, suburb: string, state: string): string {
  const combined = `${name} ${suburb} ${state}`
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

// Helper function to find school by slug
export async function findSchoolBySlug(slug: string, db: any) {
  // First try to find by exact slug match if we had stored slugs
  // For now, we'll search by reconstructing from name, suburb, state
  const schools = await db.school.findMany({
    select: {
      id: true,
      name: true,
      suburb: true,
      state: true
    }
  })

  // Find the school that matches the slug
  const school = schools.find((s: any) => 
    createSchoolSlug(s.name, s.suburb, s.state) === slug
  )

  return school?.id || null
} 