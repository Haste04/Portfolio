/** Education content supplied by Haggai. Points locate towns/cities, not school addresses. */
export const educationPlaces = [
  { id: 'cagayan-de-oro', label: 'Cagayan de Oro City', shortLabel: 'Cagayan de Oro', coordinates: [124.65, 8.48], callout: [490, 505], color: '#d89476', steps: '01' },
  { id: 'aloran', label: 'Aloran, Misamis Occidental', shortLabel: 'Aloran', coordinates: [123.75, 8.42], callout: [220, 510], color: '#a8b588', steps: '02' },
  { id: 'argao', label: 'Argao, Cebu', shortLabel: 'Argao', coordinates: [123.60, 9.88], callout: [490, 390], color: '#b8a6d9', steps: '03/06' },
  { id: 'boracay', label: 'Boracay, Aklan', shortLabel: 'Boracay', coordinates: [121.93, 11.96], callout: [100, 255], color: '#85bab1', steps: '04' },
  { id: 'iloilo', label: 'Iloilo City, Iloilo', shortLabel: 'Iloilo City', coordinates: [122.56, 10.72], callout: [100, 370], color: '#d3b772', steps: '05' },
  { id: 'cebu-city', label: 'Cebu City, Cebu', shortLabel: 'Cebu City', coordinates: [123.89, 10.32], callout: [490, 275], color: '#88aec5', steps: '07' },
] as const;
export type EducationPlaceId = typeof educationPlaces[number]['id'];
export interface EducationEntry {
  readonly id: string;
  readonly place: EducationPlaceId;
  readonly schoolName: string;
  readonly stage: string;
  readonly notes: string;
  readonly recognition: readonly string[];
  readonly logo?: string;
}
export const educationEntries: readonly EducationEntry[] = [
  { id: 'nursery', place: 'cagayan-de-oro', schoolName: 'Not yet confirmed', stage: 'Nursery', notes: 'Early childhood foundation', recognition: [] },
  { id: 'kindergarten', place: 'aloran', schoolName: 'Aloran Christian School Inc', stage: 'Kindergarten through Grade 2', notes: 'Early formal schooling in Aloran. Continued elementary foundation.', recognition: ["Honors List"], logo: 'aloran-christian-school-inc.jpg' },
  { id: 'grade-3-before-break', place: 'argao', schoolName: 'Binlod Elementary School', stage: 'Grade 3 (Before Semester Break)', notes: 'Short transition period before moving again', recognition: ["Honors List"], logo: 'binlod-elementary-school.jpg' },
  { id: 'grade-3-5', place: 'boracay', schoolName: 'River of Knowledge Foundation Academy Inc', stage: 'Grade 3 (After Semester Break) through Grade 5', notes: 'Continued elementary education during relocation', recognition: ["Class Auditor","Honors List","Pageant Winner (Mr. Academa 2016)"], logo: 'river-of-knowledge-foundation-academy-inc.jpg' },
  { id: 'grade-6-9', place: 'iloilo', schoolName: 'Central Philippine University', stage: 'Grades 6–9', notes: 'Junior high years', recognition: ["Class President","Honors List"], logo: 'central-philippine-university.jpg' },
  { id: 'grade-10', place: 'argao', schoolName: 'Christian Learning Center of Argao, Cebu, Inc', stage: 'Grade 10', notes: 'Final junior high year in Argao', recognition: ["Valedictorian","Honors List"], logo: 'christian-learning-center-of-argao-cebu-inc.png' },
  { id: 'senior-high-college', place: 'cebu-city', schoolName: 'University of Cebu - Main Campus', stage: 'Grade 11 through 4th Year College', notes: 'Senior high through college, BS Computer Science', recognition: ["Honors List","Graduated with High Honors (Senior High School)","College Volunteer","Consistent Dean's Lister"], logo: 'university_of_cebu_main_campus.jpg' },
];
/** An editorial equirectangular projection shared by the coastline and location points. */
export function educationPoint(coordinates: readonly [number, number]): [number, number] {
  return [100 + (coordinates[0] - 116) * 34, 20 + (21.5 - coordinates[1]) * 34];
}
