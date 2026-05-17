"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [menus, setMenus] = useState([]);
  const [stores, setStores] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedKeyword, setSelectedKeyword] = useState("");
  const [priceLimit, setPriceLimit] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const menuKey = process.env.NEXT_PUBLIC_GOOD_PRICE_MENU_KEY;
  const storeKey = process.env.NEXT_PUBLIC_GOOD_PRICE_STORE_KEY;

  const quickMenus = [
    { label: "국밥", icon: "🍲" },
    { label: "김밥", icon: "🍙" },
    { label: "짜장면", icon: "🍜" },
    { label: "커피", icon: "☕" },
    { label: "백반", icon: "🍚" },
    { label: "칼국수", icon: "🥣" },
    { label: "돈가스", icon: "🍛" },
    { label: "냉면", icon: "🍜" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        if (!menuKey || !storeKey) {
          setError("Vercel 환경변수에 인증키 2개를 넣어주세요.");
          setLoading(false);
          return;
        }

        const menuUrl = `https://apis.data.go.kr/6260000/BsGoodpriceService/getBsGoodprice?ServiceKey=${menuKey}&pageNo=1&numOfRows=5000&resultType=json`;
        const storeUrl = `https://apis.data.go.kr/6260000/GoodPriceStoreService/getGoodPriceStore?ServiceKey=${storeKey}&pageNo=1&numOfRows=1500&resultType=json`;

        const [menuRes, storeRes] = await Promise.all([
          fetch(menuUrl),
          fetch(storeUrl),
        ]);

        const menuJson = await menuRes.json();
        const storeJson = await storeRes.json();

        const menuItems =
          menuJson?.response?.body?.items?.item ??
          menuJson?.response?.body?.items ??
          [];

        const storeItems =
          storeJson?.response?.body?.items?.item ??
          storeJson?.response?.body?.items ??
          [];

        setMenus(Array.isArray(menuItems) ? menuItems : [menuItems]);
        setStores(Array.isArray(storeItems) ? storeItems : [storeItems]);
      } catch (err) {
        console.error(err);
        setError("데이터를 불러오지 못했어요. 인증키나 API 주소를 확인해주세요.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [menuKey, storeKey]);

  const storeMap = useMemo(() => {
    const map = new Map();

    stores.forEach((store) => {
      if (store?.sj) {
        map.set(cleanText(store.sj), store);
      }
    });

    return map;
  }, [stores]);

  const results = useMemo(() => {
    const searchWord = selectedKeyword.trim();

    return menus
      .map((menu) => {
        const store = storeMap.get(cleanText(menu.bsshNm));

        return {
          ...menu,
          store,
          priceNumber: toNumber(menu.menuPrc),
        };
      })
      .filter((item) => {
        if (!searchWord) return false;

        const itemName = cleanText(item.itemNm);
        const storeName = cleanText(item.bsshNm);
        const word = cleanText(searchWord);

        return itemName.includes(word) || storeName.includes(word);
      })
      .filter((item) => {
        if (priceLimit === "all") return true;
        return item.priceNumber <= Number(priceLimit);
      })
      .sort((a, b) => a.priceNumber - b.priceNumber)
      .slice(0, 50);
  }, [menus, selectedKeyword, priceLimit, storeMap]);

  const cheapest = results[0];

  function handleSearch() {
    setSelectedKeyword(keyword);
  }

  function handleQuickSearch(word) {
    setKeyword(word);
    setSelectedKeyword(word);
  }

  return (
    <main className="page">
      <div className="floating one">🍚</div>
      <div className="floating two">🧾</div>
      <div className="floating three">💰</div>
      <div className="floating four">🍙</div>

      <section className="hero">
        <div className="badge">공공데이터 기반 생활물가 비교 서비스</div>

        <h1>
          <span>🍚</span> 착한한끼 부산
        </h1>

        <p className="subtitle">
          오늘 뭐 먹지? 부산 착한가격업소 메뉴 가격을 한눈에 비교해보세요.
        </p>

        <div className="searchBox">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="🔍 국밥, 김밥, 짜장면, 커피를 검색해보세요"
          />
          <button onClick={handleSearch}>검색하기</button>
        </div>

        <div className="quickArea">
          <p>추천 메뉴</p>
          <div className="quickButtons">
            {quickMenus.map((menu) => (
              <button key={menu.label} onClick={() => handleQuickSearch(menu.label)}>
                <span>{menu.icon}</span> {menu.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="filterArea">
        <button className={priceLimit === "all" ? "active" : ""} onClick={() => setPriceLimit("all")}>
          전체 보기
        </button>
        <button className={priceLimit === "5000" ? "active" : ""} onClick={() => setPriceLimit("5000")}>
          5,000원 이하
        </button>
        <button className={priceLimit === "8000" ? "active" : ""} onClick={() => setPriceLimit("8000")}>
          8,000원 이하
        </button>
        <button className={priceLimit === "10000" ? "active" : ""} onClick={() => setPriceLimit("10000")}>
          10,000원 이하
        </button>
      </section>

      {loading && (
        <section className="emptyBox">
          <div className="bigIcon">🥣</div>
          <h2>착한가격 메뉴를 불러오는 중이에요</h2>
          <p>잠시만 기다려주세요.</p>
        </section>
      )}

      {error && (
        <section className="emptyBox">
          <div className="bigIcon">⚠️</div>
          <h2>앗, 문제가 생겼어요</h2>
          <p>{error}</p>
        </section>
      )}

      {!loading && !error && !selectedKeyword && (
        <section className="emptyBox">
          <div className="bigIcon">🍱</div>
          <h2>메뉴를 검색하면 알뜰랭킹을 보여드릴게요</h2>
          <p>예: 국밥, 김밥, 짜장면, 커피, 백반</p>
        </section>
      )}

      {!loading && !error && selectedKeyword && (
        <section className="receiptWrap">
          <div className="receipt">
            <div className="receiptTop">
              <div className="receiptIcon">🧾</div>
              <h2>오늘의 알뜰랭킹</h2>
              <p>
                검색어 <strong>{selectedKeyword}</strong>
              </p>
            </div>

            <div className="dash"></div>

            {results.length === 0 ? (
              <div className="noResult">
                <div className="bigIcon">🔎</div>
                <h3>검색 결과가 없어요</h3>
                <p>다른 메뉴명으로 검색해보세요.</p>
              </div>
            ) : (
              <>
                {cheapest && (
                  <div className="bestBox">
                    <span>💰 오늘의 최저가 한끼</span>
                    <strong>{Number(cheapest.priceNumber).toLocaleString()}원</strong>
                  </div>
                )}

                <div className="rankingList">
                  {results.map((item, index) => {
                    const store = item.store;
                    const rankIcon =
                      index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : String(index + 1).padStart(2, "0");

                    const address = store?.adres || "";
                    const mapQuery = encodeURIComponent(`${item.bsshNm} ${address}`);

                    return (
                      <div className="rankItem" key={`${item.bsshNm}-${item.itemNm}-${index}`}>
                        <div className="rankLeft">
                          <div className="rankIcon">{rankIcon}</div>
                        </div>

                        <div className="rankBody">
                          <div className="storeLine">
                            <h3>{item.bsshNm}</h3>
                            <strong>{Number(item.priceNumber).toLocaleString()}원</strong>
                          </div>

                          <div className="menuLine">
                            <span>🍽️ {item.itemNm}</span>
                            <span className="goodPrice">착한가격</span>
                          </div>

                          <div className="infoLine">
                            {store?.locale && <span>📍 {store.locale}</span>}
                            {store?.bsnTime && <span>⏰ {stripHtml(store.bsnTime)}</span>}
                            {store?.parkngAt && (
                              <span>🅿️ {store.parkngAt === "Y" ? "주차 가능" : "주차 정보 없음"}</span>
                            )}
                          </div>

                          {address && <p className="address">📌 {stripHtml(address)}</p>}

                          <div className="actionLine">
                            <a href={`https://map.naver.com/p/search/${mapQuery}`} target="_blank" rel="noreferrer">
                              🗺️ 지도에서 보기
                            </a>

                            {store?.tel && <a href={`tel:${store.tel}`}>☎️ 전화하기</a>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="receiptBottom">
                  <p>공공데이터로 찾은 부산 착한가격 메뉴예요.</p>
                  <p>방문 전 영업시간과 가격은 한 번 더 확인해주세요.</p>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, #ffe6b8 0, transparent 32%),
            radial-gradient(circle at bottom right, #dff5d8 0, transparent 30%),
            #fff8ea;
          color: #2f261d;
          padding: 34px 18px 60px;
          position: relative;
          overflow: hidden;
          font-family: "Pretendard", "Apple SD Gothic Neo", system-ui, sans-serif;
        }

        .hero {
          max-width: 850px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 9px 16px;
          border-radius: 999px;
          background: #fff;
          color: #8a5a16;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 8px 20px rgba(139, 90, 22, 0.12);
          margin-bottom: 18px;
        }

        h1 {
          margin: 0;
          font-size: clamp(38px, 7vw, 68px);
          letter-spacing: -2px;
          font-weight: 900;
          color: #2f261d;
        }

        .subtitle {
          margin: 14px auto 26px;
          font-size: 18px;
          line-height: 1.6;
          color: #6d5b45;
        }

        .searchBox {
          max-width: 720px;
          margin: 0 auto;
          background: #ffffff;
          border: 3px solid #2f261d;
          border-radius: 28px;
          padding: 8px;
          display: flex;
          gap: 8px;
          box-shadow: 0 14px 0 #2f261d;
        }

        .searchBox input {
          flex: 1;
          border: none;
          outline: none;
          padding: 18px;
          border-radius: 22px;
          font-size: 16px;
          background: #fffdf8;
          color: #2f261d;
        }

        .searchBox button {
          border: none;
          border-radius: 22px;
          padding: 0 24px;
          background: #ff9f1c;
          color: #2f261d;
          font-weight: 900;
          font-size: 16px;
          cursor: pointer;
          transition: 0.2s;
        }

        .searchBox button:hover {
          transform: translateY(-2px);
          background: #ffb347;
        }

        .quickArea {
          margin-top: 34px;
        }

        .quickArea p {
          font-weight: 900;
          margin-bottom: 12px;
        }

        .quickButtons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
        }

        .quickButtons button,
        .filterArea button {
          border: 2px solid #2f261d;
          background: #ffffff;
          border-radius: 999px;
          padding: 11px 17px;
          font-weight: 800;
          color: #2f261d;
          cursor: pointer;
          box-shadow: 0 5px 0 #2f261d;
          transition: 0.2s;
        }

        .quickButtons button:hover,
        .filterArea button:hover {
          transform: translateY(-2px);
          box-shadow: 0 7px 0 #2f261d;
        }

        .filterArea {
          max-width: 850px;
          margin: 32px auto 0;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          position: relative;
          z-index: 2;
        }

        .filterArea button.active {
          background: #2f261d;
          color: #fff8ea;
        }

        .emptyBox {
          max-width: 650px;
          margin: 52px auto 0;
          text-align: center;
          background: rgba(255, 255, 255, 0.72);
          border: 3px dashed #d8b98b;
          border-radius: 32px;
          padding: 46px 24px;
          position: relative;
          z-index: 2;
        }

        .bigIcon {
          font-size: 58px;
          margin-bottom: 10px;
        }

        .emptyBox h2 {
          margin: 0 0 10px;
          font-size: 24px;
        }

        .emptyBox p {
          margin: 0;
          color: #7b6a53;
        }

        .receiptWrap {
          max-width: 760px;
          margin: 48px auto 0;
          position: relative;
          z-index: 2;
        }

        .receipt {
          background: #fffefa;
          border-radius: 12px;
          padding: 30px 26px;
          border: 3px solid #2f261d;
          box-shadow: 0 18px 0 #2f261d;
          position: relative;
        }

        .receiptTop {
          text-align: center;
        }

        .receiptIcon {
          font-size: 42px;
          animation: softBounce 2.2s infinite;
        }

        .receiptTop h2 {
          margin: 8px 0;
          font-size: 32px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .receiptTop p {
          margin: 0;
          color: #75624b;
        }

        .dash {
          border-top: 3px dashed #d4b283;
          margin: 24px 0;
        }

        .bestBox {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: #fff1c9;
          border: 2px solid #2f261d;
          border-radius: 20px;
          padding: 16px 18px;
          font-weight: 900;
          margin-bottom: 18px;
        }

        .bestBox strong {
          font-size: 24px;
          color: #e05b00;
        }

        .rankingList {
          display: flex;
          flex-direction: column;
        }

        .rankItem {
          display: grid;
          grid-template-columns: 54px 1fr;
          gap: 14px;
          padding: 20px 0;
          border-bottom: 2px dashed #e5cda9;
        }

        .rankItem:last-child {
          border-bottom: none;
        }

        .rankIcon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff1c9;
          border: 2px solid #2f261d;
          border-radius: 50%;
          font-weight: 900;
          box-shadow: 0 4px 0 #2f261d;
        }

        .storeLine {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .storeLine h3 {
          margin: 0;
          font-size: 20px;
          line-height: 1.35;
          word-break: keep-all;
        }

        .storeLine strong {
          flex-shrink: 0;
          font-size: 22px;
          color: #e05b00;
        }

        .menuLine {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
          font-size: 16px;
          font-weight: 800;
        }

        .goodPrice {
          background: #dcf7d5;
          color: #27651e;
          border-radius: 999px;
          padding: 4px 9px;
          font-size: 12px;
          font-weight: 900;
        }

        .infoLine {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
          color: #6f604d;
          font-size: 14px;
        }

        .infoLine span {
          background: #f7f0e5;
          border-radius: 999px;
          padding: 6px 9px;
        }

        .address {
          margin: 10px 0 0;
          color: #6f604d;
          font-size: 14px;
          line-height: 1.5;
        }

        .actionLine {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .actionLine a {
          text-decoration: none;
          color: #2f261d;
          background: #ffffff;
          border: 2px solid #2f261d;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 3px 0 #2f261d;
        }

        .receiptBottom {
          margin-top: 24px;
          border-top: 3px dashed #d4b283;
          padding-top: 18px;
          text-align: center;
          color: #7b6a53;
          font-size: 14px;
          line-height: 1.5;
        }

        .receiptBottom p {
          margin: 4px 0;
        }

        .noResult {
          text-align: center;
          padding: 34px 0;
        }

        .noResult h3 {
          margin: 0 0 8px;
          font-size: 23px;
        }

        .noResult p {
          margin: 0;
          color: #7b6a53;
        }

        .floating {
          position: absolute;
          font-size: 38px;
          opacity: 0.65;
          z-index: 1;
          animation: float 4s ease-in-out infinite;
          pointer-events: none;
        }

        .floating.one {
          top: 92px;
          left: 8%;
        }

        .floating.two {
          top: 180px;
          right: 10%;
          animation-delay: 0.8s;
        }

        .floating.three {
          bottom: 160px;
          left: 11%;
          animation-delay: 1.5s;
        }

        .floating.four {
          bottom: 80px;
          right: 12%;
          animation-delay: 2.1s;
        }

        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-14px) rotate(5deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }

        @keyframes softBounce {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
          100% {
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .page {
            padding: 26px 14px 46px;
          }

          .searchBox {
            flex-direction: column;
            border-radius: 24px;
            box-shadow: 0 10px 0 #2f261d;
          }

          .searchBox button {
            padding: 15px;
          }

          .receipt {
            padding: 26px 18px;
            box-shadow: 0 12px 0 #2f261d;
          }

          .rankItem {
            grid-template-columns: 44px 1fr;
            gap: 10px;
          }

          .rankIcon {
            width: 40px;
            height: 40px;
            font-size: 14px;
          }

          .storeLine {
            flex-direction: column;
            gap: 5px;
          }

          .storeLine strong {
            font-size: 24px;
          }

          .floating {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, "")
    .trim();
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function toNumber(value) {
  const onlyNumber = String(value ?? "").replace(/[^0-9]/g, "");
  return Number(onlyNumber || 0);
}
