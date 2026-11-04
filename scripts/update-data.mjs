// 블로그(Tistory)와 GitHub에서 최신 데이터를 가져와 data.json을 갱신합니다.
// GitHub Actions에서 6시간마다 실행됩니다. 직접 실행: node scripts/update-data.mjs
// 가져오기에 실패한 항목은 기존 data.json 값을 그대로 둡니다.
import { readFile, writeFile } from 'node:fs/promises';

const BLOG = 'https://hangeulsprogram.tistory.com';
const GH_USER = 'Hangeul245';
const FILE = new URL('../data.json', import.meta.url);
const token = process.env.GITHUB_TOKEN;

const old = JSON.parse(await readFile(FILE, 'utf8').catch(() => '{}'));
const data = structuredClone(old);
data.blog ??= {}; data.github ??= {};

const decode = (s = '') => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').trim();
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1]) : ''; };
const ymd = d => { const t = new Date(d); return isNaN(t) ? '' : new Date(t.getTime() + 9 * 3600e3).toISOString().slice(0, 10); };

async function get(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { 'user-agent': 'hangeul-portfolio-updater', ...(opts.headers || {}) } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

// 1) 블로그 최근 글: RSS
try {
  const xml = await (await get(`${BLOG}/rss`)).text();
  data.blog.title = decode(tag(xml.split('<item>')[0], 'title')) || data.blog.title;
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const it = m[1];
    const cats = [...it.matchAll(/<category>([\s\S]*?)<\/category>/g)].map(c => decode(c[1]));
    return { title: tag(it, 'title'), url: tag(it, 'link'), date: ymd(tag(it, 'pubDate')), category: cats[0] || '' };
  }).filter(p => p.title && p.url);
  if (items.length) data.blog.recent = items.slice(0, 8);
  console.log(`blog rss: ${items.length} posts`);
} catch (e) { console.warn('blog rss failed:', e.message); }

// 2) 블로그 전체 글 수와 분류별 글 수: 블로그 첫 화면의 분류 목록
try {
  const html = await (await get(`${BLOG}/`)).text();
  const total = html.match(/분류\s*전체\s*보기[\s\S]{0,200}?\((\d+)\)/);
  if (total) data.blog.total = +total[1];
  const seen = new Map();
  for (const m of html.matchAll(/<a[^>]+href="\/category\/([^"#?]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const path = decodeURIComponent(m[1]);
    const cnt = m[2].match(/\((\d+)\)/);
    if (!cnt || path.includes('/')) continue;           // 하위 분류는 건너뜀
    const name = decode(m[2].replace(/<[^>]+>/g, '').replace(/\(\d+\)/, '')).trim() || path;
    if (!seen.has(name)) seen.set(name, +cnt[1]);
  }
  if (seen.size) data.blog.categories = [...seen].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  console.log(`blog total: ${data.blog.total}, categories: ${seen.size}`);
} catch (e) { console.warn('blog page failed:', e.message); }

// 3) GitHub 프로필, 저장소, 저장소별 커밋 수
const ghHeaders = { accept: 'application/vnd.github+json', ...(token ? { authorization: `Bearer ${token}` } : {}) };
try {
  const user = await (await get(`https://api.github.com/users/${GH_USER}`, { headers: ghHeaders })).json();
  const repos = await (await get(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`, { headers: ghHeaders })).json();
  data.github.user = GH_USER;
  data.github.publicRepos = user.public_repos;
  data.github.followers = user.followers;
  data.github.repos = [];
  for (const r of repos.filter(r => !r.fork)) {
    let commits = old.github?.repos?.find(o => o.name === r.name)?.commits ?? null;
    try {
      const res = await get(`https://api.github.com/repos/${GH_USER}/${r.name}/commits?per_page=1`, { headers: ghHeaders });
      const last = (res.headers.get('link') || '').match(/[?&]page=(\d+)>; rel="last"/);
      commits = last ? +last[1] : (await res.json()).length;
    } catch (e) { console.warn(`commits ${r.name} failed:`, e.message); }
    data.github.repos.push({
      name: r.name, url: r.html_url, description: r.description || '', language: r.language || '',
      stars: r.stargazers_count, forks: r.forks_count, pushedAt: ymd(r.pushed_at), commits
    });
  }
  console.log(`github: ${data.github.repos.length} repos`);
} catch (e) { console.warn('github failed:', e.message); }

// 바뀐 내용이 있을 때만 기록
const strip = o => JSON.stringify({ ...o, updatedAt: undefined });
if (strip(data) !== strip(old)) {
  data.updatedAt = ymd(new Date());
  await writeFile(FILE, JSON.stringify(data, null, 2) + '\n');
  console.log('data.json updated');
} else {
  console.log('no changes');
}
