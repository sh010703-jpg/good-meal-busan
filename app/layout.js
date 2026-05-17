export const metadata = {
  title: "착한한끼 부산",
  description: "공공데이터 기반 부산 착한가격업소 메뉴 가격 비교 서비스",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
