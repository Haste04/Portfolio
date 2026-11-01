import { projects } from '../src/data/projects.ts';
const pending = projects.filter((project) => project.publication === 'pending');
if (pending.length) {
  console.error('PUBLICATION BLOCKED: public-use permission remains unconfirmed for ' + pending.map((project) => project.title).join(', ') + '.');
  console.error('Production withholds restricted media and outbound links. Do not deploy this portfolio until permission or an approved omission is resolved.');
  process.exitCode = 1;
} else console.log('Publication permission records are clear.');
