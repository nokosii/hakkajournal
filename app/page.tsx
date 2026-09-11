import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  MessagesSquare,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { query } from '@/lib/db';
import { articles } from '@/lib/journal-data';

const editors = ['張維安', '楊長鎮', '俞龍通', '李筑軒', '范以欣', '李志成'];

type PublishedIssue = {
  id: string;
  volume: number;
  number: number;
  year: number;
  title: string;
  description: string;
  publishedAt: string;
  articleCount: number;
};

type PublishedArticle = {
  id: string;
  title: string;
  titleEn: string | null;
  authorName: string;
  category: string;
  abstract: string;
  pages: string | null;
  doi: string | null;
};

export const dynamic = 'force-dynamic';

export default async function Home() {
  const featured = articles[0];
  const issues = await query<PublishedIssue>(`SELECT i.id,i.volume,i.number,i.year,i.title,i.description,i.published_at AS "publishedAt",COUNT(s.id)::int AS "articleCount" FROM issues i LEFT JOIN submissions s ON s.issue_id=i.id AND s.status='published' WHERE i.status='published' GROUP BY i.id ORDER BY i.volume DESC,i.number DESC`);
  const latestIssue = issues.rows[0];
  const latestArticles = latestIssue
    ? await query<PublishedArticle>(`SELECT id,title,title_en AS "titleEn",author_name AS "authorName",category,abstract,pages,doi FROM submissions WHERE issue_id=$1 AND status='published' ORDER BY published_at,id`, [latestIssue.id])
    : { rows: [] as PublishedArticle[], rowCount: 0 };

  return (
    <main>
      <SiteHeader />

      <section className="community-hero">
        <div className="hero-copy">
          <p className="eyebrow">COMMUNITY-LED · DIAMOND OPEN ACCESS</p>
          <h1>讓客家經驗，<br /><em>進入數位時代的知識對話。</em></h1>
          <p className="intro">
            《客家與數位人文期刊》關注客家如何在遷徙、地方社會、語言、制度與科技變遷中持續形成。歡迎以歷史文獻、田野材料、語言資料、數位方法與理論對話，提出可被檢驗、延伸與引用的研究。
          </p>
          <div className="hero-actions">
            <Button nativeButton={false} render={<a href="/submit" />} size="lg" className="primary-cta">會員投稿 <ArrowRight /></Button>
            <Button nativeButton={false} render={<a href="/review" />} size="lg" variant="outline">參與審稿</Button>
          </div>
          <p className="access-note"><CheckCircle2 /> 不收投稿費與文章處理費（APC）；預印本、審查紀錄及正式文章皆開放閱讀。</p>
        </div>
        <aside className="principles-card" aria-label="期刊運作原則">
          <p className="card-kicker">JHDH / OPEN PROCESS</p>
          <h2>研究不只保存客家，<br />更要解釋客家如何改變。</h2>
          <ol>
            <li><span>01</span><div><b>從材料提出問題</b><small>讓歷史、語言、田野與數位資料彼此對話</small></div></li>
            <li><span>02</span><div><b>讓社群參與知識形成</b><small>共同檢視資料使用、研究觀點與倫理選擇</small></div></li>
            <li><span>03</span><div><b>留下可追溯的引用紀錄</b><small>預印本、審查、修訂、推薦與正式文章一併保存</small></div></li>
          </ol>
        </aside>
      </section>

      <section className="member-strip" aria-label="會員權利">
        <div><FileText /><p><b>跨領域的客家研究皆可投稿</b><span>歷史、語言、文化、社會、空間、資料庫與人工智慧</span></p></div>
        <div><MessagesSquare /><p><b>所有註冊會員皆可參與審稿</b><span>讓不同世代、地區與方法的觀點相互檢驗</span></p></div>
        <div><Users /><p><b>每一步研究歷程都可閱讀</b><span>審查與推薦公開，正式成果更容易被發現與引用</span></p></div>
      </section>

      <section className="current-issue" aria-labelledby="latest-issue-heading">
        <div className="section-heading latest-issue-heading">
          <div>
            <p className="eyebrow">LATEST ISSUE</p>
            <h2 id="latest-issue-heading">最新一期</h2>
          </div>
          <a href={latestIssue ? `/issues/${latestIssue.id}` : '/issues'}>查看期刊卷期 <ArrowRight /></a>
        </div>
        {latestIssue ? <>
          <header className="latest-issue-summary">
            <div className="latest-issue-number"><span>VOL.</span><strong>{String(latestIssue.volume).padStart(2, '0')}</strong><small>NO. {latestIssue.number}</small></div>
            <div>
              <p>{latestIssue.year} · 正式出版 · {latestArticles.rows.length} 篇文章</p>
              <h3>{latestIssue.title}</h3>
              {latestIssue.description && <p className="latest-issue-description">{latestIssue.description}</p>}
            </div>
          </header>
          <div className="latest-article-list">
            {latestArticles.rows.map((article, index) => <article className="article-row latest-article-row" key={article.id}>
              <span className="article-index">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <p className="article-type">{article.category}</p>
                <h3><a href={`/articles/${article.id}`}>{article.title}</a></h3>
                {article.titleEn && <p className="article-en">{article.titleEn}</p>}
                <p className="authors">{article.authorName}{article.doi && ` · DOI ${article.doi}`}</p>
                <p className="latest-article-abstract">{article.abstract}</p>
              </div>
              <span className="pages">{article.pages || '全文'}</span>
              <a href={`/articles/${article.id}`} aria-label={`閱讀正式文章：${article.title}`}><ArrowRight /></a>
            </article>)}
          </div>
        </> : <div className="empty-state latest-issue-empty"><BookOpen /><h3>尚無已發布卷期</h3><p>首期正式發布後，文章內容會自動顯示於首頁。</p><a href="/articles">先瀏覽預印本與公開審查</a></div>}
      </section>

      <section className="open-record" id="open-record">
        <div className="section-heading">
          <div><p className="eyebrow">OPEN REVIEW RECORD</p><h2>正在形成的客家研究</h2></div>
          <a href="/articles">查看全部紀錄 <ArrowRight /></a>
        </div>
        <article className="record-card">
          <div className="record-status"><span /> 徵求審稿人</div>
          <div className="record-main">
            <p className="article-type">{featured.type} · PREPRINT</p>
            <h3><a href="/articles">{featured.title}</a></h3>
            <p>{featured.authors} · {featured.affiliation}</p>
            <div className="keyword-row">{featured.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
          </div>
          <div className="record-flow" aria-label="稿件流程">
            <div className="done"><span>1</span><b>預印本提交</b><small>作者版本已登錄</small></div>
            <div className="active"><span>2</span><b>公開同儕審查</b><small>開放會員參與</small></div>
            <div><span>3</span><b>推薦與出版</b><small>尚待完成</small></div>
          </div>
          <div className="record-actions">
            <Button nativeButton={false} render={<a href="/articles" />} variant="outline"><BookOpen /> 瀏覽預印本</Button>
            <Button nativeButton={false} render={<a href="/review" />}>我要審稿 <ArrowRight /></Button>
          </div>
        </article>
      </section>

      <section className="editorial-section" id="editorial">
        <div>
          <p className="eyebrow">EDITORIAL COMMUNITY</p>
          <h2>在客家經驗與數位方法之間，建立可被檢驗的研究</h2>
          <p>數位工具能擴大語料保存、地方記憶與跨區比較，也帶來資料由誰提供、誰能使用與如何解釋的問題。本刊重視社群參與、資料權利與數位倫理，鼓勵研究者讓材料與理論彼此對話，而非只套用既有答案。</p>
        </div>
        <div className="editorial-board">
          <div className="chief-editor"><span>主編 · EDITOR-IN-CHIEF</span><strong>張陳基</strong></div>
          <div className="editors"><span>編輯 · EDITORS</span><ul>{editors.map((editor) => <li key={editor}>{editor}</li>)}</ul></div>
        </div>
      </section>

      <section className="mission" id="about">
        <p className="eyebrow">OUR COMMITMENT</p>
        <blockquote>保存材料，更要提出問題；<br />運用科技，也要回到社群。</blockquote>
        <p>讓客家研究可閱讀 · 可驗證 · 可延伸 · 可引用</p>
      </section>
      <SiteFooter />
    </main>
  );
}
