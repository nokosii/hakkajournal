import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:3000';
const socialImage = new URL('/og.png', siteUrl).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '客家與數位人文期刊｜Journal of Hakka and Digital Humanities',
  description: '連結客家歷史、語言、地方經驗與數位方法，採公開同儕審查、可追溯引用及鑽石開放取用的學術期刊。',
  publisher: '國立聯合大學客家研究學院',
  openGraph: {
    title: '客家與數位人文期刊',
    description: '讓客家研究可閱讀、可驗證、可延伸、可引用',
    type: 'website',
    locale: 'zh_TW',
    images: [{ url: socialImage, width: 1200, height: 630, alt: '客家與數位人文期刊' }],
  },
  twitter: {
    card: 'summary_large_image', title: '客家與數位人文期刊',
    description: '讓客家研究可閱讀、可驗證、可延伸、可引用', images: [socialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
