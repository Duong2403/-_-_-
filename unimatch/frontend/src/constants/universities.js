// Common universities in South Korea and international universities
export const UNIVERSITIES = [
  // South Korean Universities (.ac.kr)
  'Seoul National University',
  'Korea University', 
  'Yonsei University',
  'KAIST',
  'POSTECH',
  'Hanyang University',
  'Sungkyunkwan University',
  'Korea Advanced Institute of Science and Technology',
  'Ewha Womans University',
  'Sogang University',
  'Kyung Hee University',
  'Chung-Ang University',
  'Hankuk University of Foreign Studies',
  'Inha University',
  'Ajou University',
  'Hongik University',
  'Kookmin University',
  'Sejong University',
  'Dongguk University',
  'Dankook University',
  'Air Force Academy',
  
  // International Universities (.edu)
  'Harvard University',
  'Stanford University',
  'MIT',
  'University of California Berkeley',
  'University of California Los Angeles',
  'Princeton University',
  'Yale University',
  'Columbia University',
  'University of Pennsylvania',
  'Cornell University',
  'University of Chicago',
  'Northwestern University',
  'Duke University',
  'Johns Hopkins University',
  'University of Michigan',
  'New York University',
  'Carnegie Mellon University',
  'University of Virginia',
  'Georgetown University',
  'University of Southern California',
  
  // Add more as needed
  'Other'
];

// Map existing database values to proper names
export const UNIVERSITY_MAPPING = {
  'seoul': 'Seoul National University',
  'korea': 'Korea University',
  'airforce': 'Air Force Academy'
};

// Enhanced mapping for variations and aliases
export const UNIVERSITY_VARIATIONS = {
  // Seoul National University variations
  'seoul': 'Seoul National University',
  'seoul national university': 'Seoul National University',
  'seoul university': 'Seoul National University',
  'snu': 'Seoul National University',
  
  // Korea University variations
  'korea': 'Korea University',
  'korea university': 'Korea University',
  'ku': 'Korea University',
  
  // Air Force Academy variations
  'airforce': 'Air Force Academy',
  'air force academy': 'Air Force Academy',
  'afa': 'Air Force Academy',
  
  // Add more variations as needed
};

// Normalize university name for comparison
export const normalizeUniversityName = (universityName) => {
  if (!universityName) return '';
  
  // Convert to lowercase and remove extra spaces
  const normalized = universityName.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Check if it's a known variation
  if (UNIVERSITY_VARIATIONS[normalized]) {
    return UNIVERSITY_VARIATIONS[normalized];
  }
  
  // Check if it's already a standard name (case-insensitive)
  const standardMatch = UNIVERSITIES.find(uni => 
    uni.toLowerCase() === normalized
  );
  
  if (standardMatch) {
    return standardMatch;
  }
  
  // Return original if no match found
  return universityName;
};

// Check if two university names refer to the same institution
export const areUniversitiesEqual = (uni1, uni2) => {
  if (!uni1 || !uni2) return false;
  
  const normalized1 = normalizeUniversityName(uni1);
  const normalized2 = normalizeUniversityName(uni2);
  
  return normalized1 === normalized2;
};

// Get display name for a university
export const getUniversityDisplayName = (dbValue) => {
  // First try the mapping
  if (UNIVERSITY_MAPPING[dbValue]) {
    return UNIVERSITY_MAPPING[dbValue];
  }
  
  // Then try normalization
  const normalized = normalizeUniversityName(dbValue);
  if (normalized !== dbValue) {
    return normalized;
  }
  
  // Return original if no match
  return dbValue;
};

// Get database value for a university (for backward compatibility)
export const getUniversityDbValue = (displayName) => {
  // First check if it's a reverse mapping
  const entry = Object.entries(UNIVERSITY_MAPPING).find(([_, name]) => name === displayName);
  if (entry) {
    return entry[0];
  }
  
  // For new entries, normalize and use the standard name
  const normalized = normalizeUniversityName(displayName);
  
  // If it's a standard university name, return it as-is
  if (UNIVERSITIES.includes(normalized)) {
    return normalized;
  }
  
  // Otherwise, create a simple slug
  return displayName.toLowerCase().replace(/\s+/g, '');
}; 