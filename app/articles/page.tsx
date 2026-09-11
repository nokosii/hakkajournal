import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ArticleBrowser } from './article-browser';

export const metadata: Metadata = { title: '預印本與推薦｜客家與數位人文期刊', description: '瀏覽預印本、公開審查、作者回覆與編輯推薦紀錄。' };

export default function ArticlesPage() {
  return (
    <main><SiteHeader /><section className="page-hero"><p className="eyebrow">PREPRINTS · REVIEWS · RECOMMENDATIONS</p><h1>預印本與推薦</h1><p>每份稿件連同公開審查、作者回覆、版本與推薦理由一併保存。</p></section><section className="archive-section"><ArticleBrowser /></section><SiteFooter /></main>
  );
}
