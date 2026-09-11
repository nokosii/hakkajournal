import type { Metadata } from 'next';
import { MessageCircle, PenLine } from 'lucide-react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { MessageBoardForm } from '@/components/message-board-form';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const metadata: Metadata = { title: '留言板｜客家與數位人文期刊', description: '向客家與數位人文期刊編輯部提出投稿、審查與網站使用問題。' };
export const dynamic = 'force-dynamic';

type BoardMessage = { id: string; displayName: string; subject: string; message: string; createdAt: string | Date };

export default async function MessagesPage() {
  const [messages, user] = await Promise.all([
    query<BoardMessage>(`SELECT id,display_name AS "displayName",subject,message,created_at AS "createdAt" FROM guestbook_messages ORDER BY created_at DESC LIMIT 100`),
    getCurrentUser(),
  ]);
  return <main><SiteHeader /><section className="message-board-hero"><p className="eyebrow">COMMUNITY MESSAGE BOARD</p><h1>留言板</h1><p>關於投稿、審查、版本、數位材料或網站使用，歡迎在此提出問題。涉及帳號、個資或未公開稿件時，請改寄編輯部信箱。</p></section><section className="message-board-layout"><div className="message-list"><div className="message-list-head"><div><p className="eyebrow">PUBLIC MESSAGES</p><h2>公開留言</h2></div><span>{messages.rows.length} 則</span></div>{messages.rows.length ? messages.rows.map((item) => <article key={item.id}><header><div><b>{item.subject}</b><span>{item.displayName}</span></div><time dateTime={new Date(item.createdAt).toISOString()}>{new Date(item.createdAt).toLocaleDateString('zh-TW')}</time></header><p>{item.message}</p></article>) : <div className="empty-state message-empty"><MessageCircle /><h3>目前尚無留言</h3><p>第一則問題可以從投稿方式、審查流程或資料格式開始。</p></div>}</div><aside>{user ? <MessageBoardForm /> : <div className="message-login"><PenLine /><h2>會員留言</h2><p>留言內容公開顯示。請先登入會員，以您的顯示名稱發布訊息。</p><a href="/login?returnTo=%2Fmessages">登入後留言</a></div>}<div className="private-contact"><b>不宜公開的問題</b><p>帳號、個人資料或未公開稿件請寄：</p><a href="mailto:hsc@nuu.edu.tw">hsc@nuu.edu.tw</a></div></aside></section><SiteFooter /></main>;
}
