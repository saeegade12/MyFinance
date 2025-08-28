// Basic AI categorization service using keyword matching
// In a production environment, this could be enhanced with ML models

interface CategoryKeywords {
  [category: string]: string[];
}

const categoryKeywords: CategoryKeywords = {
  'groceries': [
    'walmart', 'target', 'kroger', 'safeway', 'whole foods', 'trader joe',
    'grocery', 'market', 'food', 'supermarket', 'costco', 'sams club'
  ],
  'transportation': [
    'gas', 'fuel', 'shell', 'exxon', 'chevron', 'bp', 'uber', 'lyft',
    'taxi', 'bus', 'metro', 'parking', 'toll', 'dmv', 'registration',
    'car wash', 'automotive', 'mechanic', 'oil change'
  ],
  'entertainment': [
    'netflix', 'spotify', 'hulu', 'disney', 'amazon prime', 'youtube',
    'movie', 'theater', 'cinema', 'concert', 'show', 'game', 'gaming',
    'steam', 'playstation', 'xbox', 'restaurant', 'bar', 'club'
  ],
  'utilities': [
    'electric', 'gas bill', 'water', 'sewer', 'internet', 'phone',
    'cable', 'verizon', 'at&t', 'comcast', 'xfinity', 'utility',
    'power company', 'energy'
  ],
  'healthcare': [
    'doctor', 'hospital', 'clinic', 'pharmacy', 'cvs', 'walgreens',
    'medical', 'dental', 'dentist', 'health', 'insurance', 'copay'
  ],
  'shopping': [
    'amazon', 'ebay', 'best buy', 'home depot', 'lowes', 'macy',
    'nordstrom', 'clothing', 'shoes', 'electronics', 'furniture'
  ],
  'dining': [
    'mcdonalds', 'burger king', 'starbucks', 'chipotle', 'subway',
    'pizza', 'restaurant', 'cafe', 'coffee', 'fast food', 'delivery'
  ],
  'travel': [
    'hotel', 'airline', 'flight', 'airbnb', 'booking', 'expedia',
    'travel', 'vacation', 'trip', 'rental car', 'hertz', 'enterprise'
  ],
  'education': [
    'school', 'university', 'college', 'tuition', 'books', 'supplies',
    'course', 'training', 'certification', 'education'
  ],
  'fitness': [
    'gym', 'fitness', 'yoga', 'pilates', 'trainer', 'sports',
    'membership', 'workout', 'exercise'
  ]
};

export async function categorizeTransaction(description: string): Promise<string> {
  const lowercaseDescription = description.toLowerCase();
  
  // Check each category for keyword matches
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowercaseDescription.includes(keyword)) {
        return category;
      }
    }
  }
  
  // Default category if no match found
  return 'other';
}

export function getAvailableCategories(): string[] {
  return Object.keys(categoryKeywords).concat(['other', 'income']);
}

// Enhanced categorization with confidence score (for future ML integration)
export async function categorizeTransactionWithConfidence(description: string): Promise<{
  category: string;
  confidence: number;
}> {
  const lowercaseDescription = description.toLowerCase();
  let bestMatch = { category: 'other', confidence: 0 };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let matches = 0;
    let totalKeywords = keywords.length;
    
    for (const keyword of keywords) {
      if (lowercaseDescription.includes(keyword)) {
        matches++;
        // Give higher weight to exact matches
        if (lowercaseDescription === keyword) {
          matches += 2;
        }
      }
    }
    
    const confidence = matches / totalKeywords;
    if (confidence > bestMatch.confidence) {
      bestMatch = { category, confidence };
    }
  }
  
  return bestMatch;
}
