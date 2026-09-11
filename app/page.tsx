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
          <h1>客家研究，<br /><em>由社群共同評議。</em></h1>
          <p className="intro">
            《客家與數位人文期刊》是一個由研究社群主導的公開出版平台。會員先公開預印本，再由推薦者邀請同儕審查；審查、修訂與推薦紀錄全程可讀、可引用。
          </p>
          <div className="hero-actions">
            <Button nativeButton={false} render={<a href="/submit" />} size="lg" className="primary-cta">會員投稿 <ArrowRight /></Button>
            <Button nativeButton={false} render={<a href="/review" />} size="lg" variant="outline">參與審稿</Button>
          </div>
          <p className="access-note"><CheckCircle2 /> 不收投稿費，不收文章處理費（APC），成果永久開放取用。</p>
        </div>
        <aside className="principles-card" aria-label="期刊運作原則">
          <p className="card-kicker">JHDH / OPEN PROCESS</p>
          <h2>投稿不是投進黑箱，<br />而是加入一場學術對話。</h2>
          <ol>
            <li><span>01</span><div><b>預印本</b><small>作者提交可公開閱讀的研究稿件</small></div></li>
            <li><span>02</span><div><b>公開審查</b><small>會員審稿，意見與回覆同步保存</small></div></li>
            <li><span>03</span><div><b>推薦發表</b><small>推薦文字與完整版本紀錄一併出版</small></div></li>
          </ol>
        </aside>
      </section>

      <section className="member-strip" aria-label="會員權利">
        <div><FileText /><p><b>所有註冊會員皆可投稿</b><span>跨領域研究、數位方法、資料與評論皆歡迎</span></p></div>
        <div><MessagesSquare /><p><b>所有註冊會員皆可審稿</b><span>依專長認領或接受邀請，揭露利益衝突</span></p></div>
        <div><Users /><p><b>編輯協調，社群決定</b><span>審查紀錄公開，推薦理由具名且可引用</span></p></div>
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
          <div><p className="eyebrow">OPEN REVIEW RECORD</p><h2>進行中的公開評議</h2></div>
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
          <h2>由熟悉客家社群與數位方法的研究者共同維護</h2>
          <p>編輯團隊負責範圍檢核、指定推薦者與確保程序公平；學術判斷建立在公開的同儕意見、作者回覆與推薦文字之上。</p>
        </div>
        <div className="editorial-board">
          <div className="chief-editor"><span>主編 · EDITOR-IN-CHIEF</span><strong>張陳基</strong></div>
          <div className="editors"><span>編輯 · EDITORS</span><ul>{editors.map((editor) => <li key={editor}>{editor}</li>)}</ul></div>
        </div>
      </section>

      <section className="mission" id="about">
        <p className="eyebrow">OUR COMMITMENT</p>
        <blockquote>知識公開，審查透明，<br />出版回到學術社群手中。</blockquote>
        <p>社群主導 · 公開同儕審查 · 鑽石開放取用 · 無 APC</p>
      </section>
      <SiteFooter />
    </main>
  );
}
