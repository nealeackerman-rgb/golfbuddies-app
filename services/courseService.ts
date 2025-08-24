import { Course } from '../types';
import { MOCK_COURSES } from '../constants';

/**
 * Simulates calling a backend API to search for courses.
 * In a real application, this would make an HTTP request (e.g., using fetch).
 * @param query The search query from the user.
 * @returns A Promise that resolves to an array of matching courses.
 */
export const searchCourses = (query: string): Promise<Course[]> => {
  console.log(`Simulating API search for: "${query}"`);

  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query) {
        return resolve([]);
      }
      
      const lowercasedQuery = query.toLowerCase();
      const results = MOCK_COURSES.filter(course =>
        course.name.toLowerCase().includes(lowercasedQuery) ||
        course.location.toLowerCase().includes(lowercasedQuery)
      );
      
      resolve(results);
    }, 500); // Simulate network latency of 500ms
  });
};
