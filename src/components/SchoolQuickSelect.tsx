"use client"

interface School {
  id: string
  name: string
  suburb: string
  state: string
}

interface SchoolQuickSelectProps {
  schools: School[]
}

export default function SchoolQuickSelect({ schools }: SchoolQuickSelectProps) {
  const handleSchoolSelect = (school: School) => {
    // Find the form and inputs
    const form = document.querySelector('form')
    const hiddenInput = form?.querySelector('input[name="schoolId"]') as HTMLInputElement
    const textInput = form?.querySelector('input[type="text"]') as HTMLInputElement
    
    if (hiddenInput && textInput) {
      hiddenInput.value = school.id
      textInput.value = `${school.name} (${school.suburb}, ${school.state})`
    }
  }

  if (schools.length === 0) {
    return null
  }

  return (
    <div className="mb-2">
      <p className="text-sm text-gray-500">Quick select from your children's schools:</p>
      <div className="flex flex-wrap gap-2 mt-1">
        {schools.map((school) => (
          <button
            key={school.id}
            type="button"
            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
            onClick={() => handleSchoolSelect(school)}
          >
            {school.name}
          </button>
        ))}
      </div>
    </div>
  )
} 