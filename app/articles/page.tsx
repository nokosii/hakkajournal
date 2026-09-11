import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ArticleBrowser } from './article-browser';

export const metadata: Metadata = { title: '預印本與推薦｜客家與數位人文期刊', description: '瀏覽並引用客家與數位人文研究的預印本、公開審查、作者回覆、修訂版本與推薦紀錄。' };

export default function ArticlesPage() {
  return (
    <main><SiteHeader /><section className="page-hero"><p className="eyebrow">PREPRINTS · REVIEWS · RECOMMENDATIONS</p><h1>預印本與推薦</h1><p>從研究問題到正式出版，每份稿件連同審查、作者回覆、修訂版本與推薦理由一併公開，讓客家研究的形成過程可以閱讀、檢驗與引用。</p></section><section className="archive-section"><ArticleBrowser /></section><SiteFooter /></main>
  );
}
