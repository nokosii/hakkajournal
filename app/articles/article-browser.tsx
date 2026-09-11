'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { articles } from '@/lib/journal-data';

const types = ['全部', '研究論文', '數位方法', '研究紀要', '評論'];

type OpenSubmission = { id: string; title: string; authorName: string; affiliation: string | null; category: string; abstract: string; keywords: string | null; status: string; reviewCount: number };

export function ArticleBrowser() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('全部');
  const [openSubmissions, setOpenSubmissions] = useState<OpenSubmission[]>([]);
  useEffect(() => { fetch('/api/submissions').then((response) => response.json()).then((result: { submissions?: OpenSubmission[] }) => setOpenSubmissions(result.submissions ?? [])).catch(() => setOpenSubmissions([])); }, []);
  const filtered = useMemo(() => articles.filter((article) => {
    const matchesType = type === '全部' || article.type.includes(type);
    const text = [article.title, article.titleEn, article.authors, article.authorsEn, ...article.keywords].join(' ').toLowerCase();
    return matchesType && text.includes(query.toLowerCase());
  }), [query, type]);
  const filteredOpen = useMemo(() => openSubmissions.filter((submission) => {
    const matchesType = type === '全部' || submission.category.includes(type);
    const text = [submission.title, submission.authorName, submission.affiliation, submission.keywords].join(' ').toLowerCase();
    return matchesType && text.includes(query.toLowerCase());
  }), [openSubmissions, query, type]);

  return (
    <>
      <div className="archive-tools">
        <label><Search aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋題名、作者或關鍵字" aria-label="搜尋文章" /></label>
        <div className="filter-pills" role="group" aria-label="文章類型">
          {types.map((item) => <Button key={item} variant={type === item ? 'default' : 'outline'} onClick={() => setType(item)}>{item}</Button>)}
        </div>
      </div>
      <p className="result-count">共 {filteredOpen.length + filtered.length} 筆公開學術紀錄</p>
      <div className="archive-list">
        {filteredOpen.map((submission) => (
          <article className="archive-item" key={submission.id}>
            <p className="article-type">{submission.category} · 公開審查中</p>
            <h2><a href={`/preprints/${submission.id}`}>{submission.title}</a></h2>
            <p className="authors">{submission.authorName}</p>
            {submission.affiliation && <p className="archive-affiliation">{submission.affiliation}</p>}
            <div className="keyword-row">{(submission.keywords ?? '').split(/[、,]/).filter(Boolean).map((keyword) => <span key={keyword}>{keyword.trim()}</span>)}</div>
            <p className="archive-meta">PREPRINT · {submission.reviewCount} 份公開審查</p>
            <a className="read-link" href={`/preprints/${submission.id}`}>查看評議紀錄 <ArrowRight /></a>
          </article>
        ))}
        {filtered.map((article) => (
          <article className="archive-item" key={article.id}>
            <p className="article-type">{article.type}</p>
            <h2><a href={`/articles/${article.id}`}>{article.title}</a></h2>
            {article.titleEn && <p className="article-en">{article.titleEn}</p>}
            <p className="authors">{article.authors}{article.authorsEn && `　${article.authorsEn}`}</p>
            <p className="archive-affiliation">{article.affiliation}</p>
            <div className="keyword-row">{article.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
            <p className="archive-meta">{article.pages}{article.doi && `　・　DOI: ${article.doi}`}</p>
            <a className="read-link" href={`/articles/${article.id}`}>閱讀文章資訊 <ArrowRight /></a>
          </article>
        ))}
        {!filtered.length && !filteredOpen.length && <div className="empty-state"><Search /><h2>找不到相符紀錄</h2><p>請調整關鍵字或選擇其他文章類型。</p></div>}
      </div>
    </>
  );
}
