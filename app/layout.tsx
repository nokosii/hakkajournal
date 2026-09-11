import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:3000';
const socialImage = new URL('/og.png', siteUrl).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '客家與數位人文期刊｜Journal of Hakka and Digital Humanities',
  description: '由學術社群主導、採公開同儕審查的客家與數位人文鑽石開放取用期刊。',
  openGraph: {
    title: '客家與數位人文期刊',
    description: '社群主導 × 公開同儕審查 × 鑽石開放取用',
    type: 'website',
    locale: 'zh_TW',
    images: [{ url: socialImage, width: 1200, height: 630, alt: '客家與數位人文期刊' }],
  },
  twitter: {
    card: 'summary_large_image', title: '客家與數位人文期刊',
    description: '社群主導 × 公開同儕審查 × 鑽石開放取用', images: [socialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
