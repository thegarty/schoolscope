'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Database, Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

export default function SchoolImportPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setResult(null);

    // Preview first few rows
    const text = await selectedFile.text();
    const lines = text.split('\n').slice(0, 6); // Header + 5 rows
    const csvData = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
    setPreview(csvData);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/schools/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success && data.imported > 0) {
        // Clear file after successful import
        setFile(null);
        setPreview([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error importing schools:', error);
      setResult({
        success: false,
        imported: 0,
        errors: [{ row: 0, error: 'Failed to import file' }]
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,address,suburb,state,postcode,phone,email,website
"Example Primary School","123 School Street","Sydney","NSW","2000","(02) 1234 5678","info@example.edu.au","https://example.edu.au"
"Sample High School","456 Education Ave","Melbourne","VIC","3000","(03) 8765 4321","contact@sample.vic.edu.au","https://sample.vic.edu.au"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'school_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout user={currentUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Import School Data</h1>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <FileText className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">CSV Import Instructions</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• Download the template CSV file to see the required format</p>
                <p>• Required columns: <code className="bg-blue-100 px-1 rounded">name</code></p>
                <p>• Optional columns: <code className="bg-blue-100 px-1 rounded">address, suburb, state, postcode, phone, email, website</code></p>
                <p>• Each school name must be unique</p>
                <p>• State should be one of: NSW, VIC, QLD, WA, SA, TAS, ACT, NT</p>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload CSV File</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  {file ? file.name : 'Choose a CSV file to upload'}
                </p>
                <p className="text-sm text-gray-500">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'CSV files only, max 10MB'}
                </p>
              </div>
              
              <div className="mt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {file ? 'Choose Different File' : 'Select CSV File'}
                </button>
              </div>
            </div>

            {/* File Preview */}
            {preview.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">File Preview</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                                                 {preview[0]?.map((header: string, index: number) => (
                           <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                             {header}
                           </th>
                         ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {preview.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                                                     {row.map((cell: string, cellIndex: number) => (
                             <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900">
                               {cell}
                             </td>
                           ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Showing first 5 rows. Total rows in file: {preview.length - 1}
                </p>
              </div>
            )}

            {/* Import Button */}
            {file && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {importing ? 'Importing...' : 'Import Schools'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Import Results */}
        {result && (
          <div className={`rounded-lg p-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-medium mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  Import {result.success ? 'Completed' : 'Failed'}
                </h3>
                
                {result.imported > 0 && (
                  <p className={`text-sm mb-3 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    Successfully imported {result.imported} schools.
                  </p>
                )}

                {result.errors.length > 0 && (
                  <div>
                    <h4 className={`text-sm font-medium mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                      Errors ({result.errors.length}):
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.map((error, index) => (
                        <div key={index} className={`text-xs p-2 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                          Row {error.row}: {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.success && result.imported > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => router.push('/admin/schools')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      View Imported Schools
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setResult(null)}
                className={`p-1 rounded ${result.success ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Recent Imports */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Import Guidelines</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">✅ Best Practices</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use the provided template format</li>
                  <li>• Ensure school names are unique</li>
                  <li>• Include complete address information</li>
                  <li>• Validate email addresses and websites</li>
                  <li>• Use standard Australian state codes</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">⚠️ Common Issues</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Duplicate school names will be skipped</li>
                  <li>• Invalid email formats will cause errors</li>
                  <li>• Missing required 'name' column</li>
                  <li>• Special characters in CSV data</li>
                  <li>• Incorrect state abbreviations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 