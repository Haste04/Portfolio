export type Theme='dark'|'light';
export const themeKey='portfolio-theme';
export const themeColors={dark:'#101114',light:'#F5F1E9'} as const;
export function isTheme(value:unknown):value is Theme{return value==='dark'||value==='light';}
export function resolveTheme(saved:unknown,systemDark:boolean):Theme{return isTheme(saved)?saved:systemDark?'dark':'light';}
/** Serialized into head; deliberately independent of imports, body markup and async modules. */
function prepaint(key:string,colors:Record<Theme,string>):void{
 let saved:string|null=null;try{saved=localStorage.getItem(key)}catch{}
 const theme:Theme=saved==='dark'||saved==='light'?saved:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
 document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;
 const meta=document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');if(meta)meta.content=colors[theme];
}
export const themeInitScript='('+prepaint.toString()+')('+JSON.stringify(themeKey)+','+JSON.stringify(themeColors)+');';
