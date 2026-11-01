import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
test('Company branding resolves supplied local formats and has a missing-logo fallback',async()=>{
 const {findCompanyLogo}=await import('../scripts/company-logos.mjs');
 await mkdir('.cache/experience-refinement',{recursive:true});
 const dir=await mkdtemp(resolve('.cache/experience-refinement/logos-'));
 assert.equal(await findCompanyLogo(dir),undefined);
 await writeFile(join(dir,'lifewood.svg'),'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"></svg>');
 assert.equal((await findCompanyLogo(dir)).src,'/company-logos/lifewood.svg');
 await writeFile(join(dir,'lifewood-logo.png'),'filename fixture');
 assert.equal((await findCompanyLogo(dir)).src,'/company-logos/lifewood-logo.png');
});
