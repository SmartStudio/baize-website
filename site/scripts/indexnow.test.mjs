import { describe, expect, it } from 'vitest';
import { indexNowKey, pathsForChanges } from './indexnow.mjs';

const pub = { draft: false, category: '企业落地' };
const meta = (f) => (f.includes('draft') ? { now: { draft: true }, before: null } : f.includes('unpub') ? { now: { ...pub, draft: true }, before: pub } : { now: pub, before: pub });

describe('pathsForChanges', () => {
  it('maps a Chinese note to its page, the lists, home and its category', () => {
    expect(pathsForChanges(['site/src/content/notes/foo.mdx'], { meta })).toEqual(
      ['/', '/notes/', '/notes/category/enterprise/', '/notes/foo/'],
    );
  });
  it('maps an English note under /en/ and skips drafts', () => {
    expect(pathsForChanges(['site/src/content/notes/en/foo.mdx', 'site/src/content/notes/draft-x.mdx'], { meta })).toEqual(
      ['/en/', '/en/notes/', '/en/notes/category/enterprise/', '/en/notes/foo/'],
    );
  });
  it('maps static page copy to both languages and ignores site-wide files', () => {
    expect(pathsForChanges(['site/src/i18n/services.ts', 'site/src/components/Seo.astro', 'site/src/i18n/home.ts'], { meta })).toEqual(
      ['/', '/en/', '/en/services/', '/services/'],
    );
  });
  it('submits a note that was unpublished', () => {
    expect(pathsForChanges(['site/src/content/notes/unpub.mdx'], { meta })).toContain('/notes/unpub/');
  });
  it('maps English page files and legal pages', () => {
    expect(pathsForChanges(['site/src/pages/en/about.astro', 'site/src/pages/fxai/privacy/en.mdx', 'site/src/pages/fxai/terms.mdx'], { meta })).toEqual(
      ['/about/', '/en/about/', '/fxai/privacy/en/', '/fxai/terms/'],
    );
  });
  it('adds redirect sources with a trailing slash', () => {
    expect(pathsForChanges([], { redirectLines: ['/notes/old/ /notes/new/ 301', '/notes/old /notes/new/ 301'] })).toEqual(['/notes/old/']);
  });
});

describe('indexNowKey', () => {
  it('finds the single key file in public/', () => {
    expect(indexNowKey()).toMatch(/^[0-9a-f]{32}$/);
  });
});
