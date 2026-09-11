import type { Metadata } from 'next';
import { BookOpen, Database, Globe2, MessagesSquare, Scale, Users } from 'lucide-react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = { title: '關於本刊｜客家與數位人文期刊', description: '客家與數位人文期刊的宗旨、範圍、出版模式與編輯團隊。' };

const editors = ['張維安', '楊長鎮', '俞龍通', '李筑軒', '范以欣', '李志成'];

export default function AboutPage() {
  return <main><SiteHeader /><section className="about-journal-hero"><p className="eyebrow">ABOUT THE JOURNAL</p><h1>關於本刊</h1><blockquote>讓客家研究可閱讀、可驗證、可延伸、可引用。</blockquote></section><article className="about-journal-page"><section><div><p className="section-number">01</p><h2>本刊宗旨</h2></div><div><p>《客家與數位人文期刊》是客家研究者、數位人文實作者與客家社群共同參與的開放學術平台。我們關注客家如何在歷史、語言、地方生活、制度、遷徙與科技變遷中持續形成，也關注數位工具如何改變材料的保存、分析、展示與詮釋。</p><p>本刊鼓勵跨學科與跨地域對話，不把數位方法視為單純技術，也不把客家視為固定不變的研究對象。每篇作品都應說明材料從何而來、方法如何運作、推論界線何在，以及研究如何回應社群、資料權利與文化倫理。</p></div></section><section><div><p className="section-number">02</p><h2>出版特色</h2></div><div className="journal-feature-grid"><article><BookOpen /><b>鑽石開放取用</b><p>作者與讀者皆不付費，預印本、審查紀錄及正式文章均可公開閱讀。</p></article><article><MessagesSquare /><b>開放學術對話</b><p>作者先發布預印本，社群審查、作者回應與修正版本共同形成可追溯紀錄。</p></article><article><Users /><b>社群共同審查</b><p>所有註冊會員皆可依專長審稿，並可選擇具名或匿名公開身分。</p></article><article><Database /><b>數位材料責任</b><p>重視資料來源、可重製性、授權、個資、文化敏感資料與社群知識治理。</p></article><article><Scale /><b>人工編輯決定</b><p>AI 評閱只供作者與審查人參考，不列入接受、修正或拒絕的判定。</p></article><article><Globe2 /><b>跨語言與跨地域</b><p>歡迎中文、英文及客語作品，連結臺灣與全球客家經驗。</p></article></div></section><section><div><p className="section-number">03</p><h2>編輯團隊</h2></div><div className="about-editorial"><article><span>主編 · EDITOR-IN-CHIEF</span><strong>張陳基</strong></article><article><span>編輯 · EDITORS</span><ul>{editors.map((editor) => <li key={editor}>{editor}</li>)}</ul></article></div></section><section><div><p className="section-number">04</p><h2>發行與聯絡</h2></div><address className="about-contact"><b>國立聯合大學客家研究學院</b><p>36063 苗栗市南勢里聯大 2 號<br />八甲校區－客家研究學院</p><p>TEL +886-37-382131<br />FAX +886-37-382139</p><a href="mailto:hsc@nuu.edu.tw">hsc@nuu.edu.tw</a></address></section></article><SiteFooter /></main>;
}
