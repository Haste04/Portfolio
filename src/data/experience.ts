export const internship = {
 role: 'Software Engineering Intern', company: 'Lifewood Data Technology',
 dates: ['2026-08','2026-10'], location: 'Cebu City, Cebu, Philippines',
 overview: 'An internship spanning collaborative software projects, presentations, and applied AI activities.'
} as const;
export const contributions = [
 {id:'anthea',title:'Anthea',label:'Project management & full-stack development',description:'Project coordination, frontend and backend development, and API integration and credential configuration for the plant-care application.'},
 {id:'lifevent',title:'Lifevent',label:'Login experience & rate limiting',description:'Improved the login page UI/UX and implemented rate limiting as part of a collaborative company project.'},
 {id:'power-bi',title:'Power BI',label:'Presentations',description:'Power BI presentations as part of the internship activities.'},
 {id:'prompt-engineering',title:'Prompt Engineering',label:'Applied AI activities',description:'Prompt engineering activities during the internship.'},
 {id:'ai-media',title:'Text-to-Image & Text-to-Video',label:'AI-generated media activities',description:'Text-to-image and text-to-video activities during the internship.'}
] as const;
export const cebuLocation = {
 name:'Cebu City',coordinates:[123.901716666667,10.2929861111111],
 source:'https://ungegn.un.org/dashboard/cities/details?id=3186'
} as const;
/** Regional equirectangular display, not street/office-level positioning. */
export function experiencePoint(point:readonly [number,number]):[number,number] {
 return [48+(point[0]-122.95)*250,42+(11.55-point[1])*250];
}
export interface ExperiencePhoto {id:string;src:string;thumbnail:string;width:number;height:number;alt:string;caption?:string;}
