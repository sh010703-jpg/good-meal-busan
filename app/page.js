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

  const quickMenus = ["국밥", "김밥", "짜장면", "커피", "백반", "칼국수", "돈가스", "냉면"];

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
      .slice(0, 60);
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
      <section className="hero">
        <nav className="nav">
          <div className="logo">착한한끼 부산</div>
          <div className="navLinks">
            <span>공공데이터</span>
            <span>메뉴가격비교</span>
            <span>부산 착한가격업소</span>
          </div>
        </nav>

        <div className="heroInner">
          <div className="heroText">
            <p className="eyebrow">Busan Good Price Meal</p>
            <h1>
              부산 착한가격업소
              <br />
              메뉴 가격을 한눈에
            </h1>
            <p className="heroDesc">
              공공데이터를 활용해 부산의 착한가격업소 메뉴를 검색하고,
              가격순으로 비교할 수 있는 생활물가 비교 서비스입니다.
            </p>

            <div className="searchPanel">
              <div className="searchBox">
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  placeholder="메뉴명을 입력하세요. 예: 국밥, 김밥, 커피"
                />
                <button onClick={handleSearch}>검색</button>
              </div>

              <div className="quickMenus">
                {quickMenus.map((menu) => (
                  <button key={menu} onClick={() => handleQuickSearch(menu)}>
                    {menu}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="heroVisual">
            <div className="visualCard mainCard">
              <span className="smallLabel">오늘의 추천</span>
              <strong>합리적인 한 끼</strong>
              <p>부산 착한가격업소 메뉴를 가격순으로 확인하세요.</p>
            </div>

            <div className="visualCard priceCard">
              <span>최저가 검색</span>
              <strong>{cheapest ? `${cheapest.priceNumber.toLocaleString()}원` : "가격 비교"}</strong>
            </div>

            <div className="circle circleOne"></div>
            <div className="circle circleTwo"></div>
          </div>
        </div>
      </section>

      <section className="summaryBand">
        <div>
          <span>데이터 기준</span>
          <strong>부산 착한가격업소</strong>
        </div>
        <div>
          <span>검색 방식</span>
          <strong>메뉴명·업소명</strong>
        </div>
        <div>
          <span>정렬 방식</span>
          <strong>가격 낮은 순</strong>
        </div>
      </section>

      <section className="content">
        <div className="sectionHeader">
          <div>
            <p className="sectionLabel">Price Ranking</p>
            <h2>
              {selectedKeyword ? `${selectedKeyword} 검색 결과` : "메뉴 가격 비교"}
            </h2>
          </div>

          <div className="filters">
            <button
              className={priceLimit === "all" ? "active" : ""}
              onClick={() => setPriceLimit("all")}
            >
              전체
            </button>
            <button
              className={priceLimit === "5000" ? "active" : ""}
              onClick={() => setPriceLimit("5000")}
            >
              5천원 이하
            </button>
            <button
              className={priceLimit === "8000" ? "active" : ""}
              onClick={() => setPriceLimit("8000")}
            >
              8천원 이하
            </button>
            <button
              className={priceLimit === "10000" ? "active" : ""}
              onClick={() => setPriceLimit("10000")}
            >
              1만원 이하
            </button>
          </div>
        </div>

        {loading && (
          <div className="stateBox">
            <strong>데이터를 불러오는 중입니다</strong>
            <p>잠시만 기다려주세요.</p>
          </div>
        )}

        {error && (
          <div className="stateBox">
            <strong>확인이 필요합니다</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && !selectedKeyword && (
          <div className="introGrid">
            <div className="introCard">
              <span>01</span>
              <strong>메뉴 검색</strong>
              <p>국밥, 김밥, 커피처럼 원하는 메뉴명을 입력하세요.</p>
            </div>
            <div className="introCard">
              <span>02</span>
              <strong>가격 비교</strong>
              <p>검색 결과를 가격 낮은 순으로 확인할 수 있습니다.</p>
            </div>
            <div className="introCard">
              <span>03</span>
              <strong>지도 연결</strong>
              <p>업소 위치는 네이버지도 검색으로 바로 확인할 수 있습니다.</p>
            </div>
          </div>
        )}

        {!loading && !error && selectedKeyword && (
          <>
            <div className="resultStats">
              <div>
                <span>검색 결과</span>
                <strong>{results.length}개</strong>
              </div>
              <div>
                <span>최저가</span>
                <strong className="price">
                  {cheapest ? `${cheapest.priceNumber.toLocaleString()}원` : "-"}
                </strong>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="stateBox">
                <strong>검색 결과가 없습니다</strong>
                <p>다른 메뉴명으로 다시 검색해보세요.</p>
              </div>
            ) : (
              <div className="rankingList">
                {results.map((item, index) => {
                  const store = item.store;
                  const address = store?.adres || "";
                  const mapQuery = encodeURIComponent(`${item.bsshNm} ${address}`);

                  return (
                    <div className="rankRow" key={`${item.bsshNm}-${item.itemNm}-${index}`}>
                      <div className="rankNum">{index + 1}</div>

                      <div className="rankInfo">
                        <div className="titleLine">
                          <strong>{item.bsshNm}</strong>
                          <span>{item.itemNm}</span>
                        </div>

                        <div className="metaLine">
                          {store?.locale && <span>{store.locale}</span>}
                          {store?.bsnTime && <span>{stripHtml(store.bsnTime)}</span>}
                          {store?.parkngAt && (
                            <span>{store.parkngAt === "Y" ? "주차 가능" : "주차 정보 없음"}</span>
                          )}
                        </div>

                        {address && <p>{stripHtml(address)}</p>}
                      </div>

                      <div className="rankPrice">
                        <strong>{Number(item.priceNumber).toLocaleString()}원</strong>
                        <div className="actions">
                          <a
                            href={`https://map.naver.com/p/search/${mapQuery}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            지도 보기
                          </a>
                          {store?.tel && <a href={`tel:${store.tel}`}>전화</a>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f5f8fa;
          color: #1f2933;
          font-family: "Pretendard", "Apple SD Gothic Neo", system-ui, sans-serif;
        }

        .hero {
          background:
            linear-gradient(135deg, rgba(24, 59, 86, 0.96), rgba(31, 94, 75, 0.9)),
            radial-gradient(circle at 80% 20%, rgba(242, 107, 94, 0.3), transparent 30%);
          color: white;
          padding: 24px 32px 72px;
          border-bottom-left-radius: 42px;
          border-bottom-right-radius: 42px;
        }

        .nav {
          max-width: 1120px;
          margin: 0 auto 52px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-weight: 900;
          font-size: 22px;
          letter-spacing: -0.5px;
        }

        .navLinks {
          display: flex;
          gap: 22px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.78);
        }

        .heroInner {
          max-width: 1120px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 42px;
          align-items: center;
        }

        .eyebrow {
          margin: 0 0 12px;
          color: #bfe5e0;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 13px;
        }

        h1 {
          margin: 0;
          font-size: clamp(42px, 6vw, 72px);
          line-height: 1.08;
          letter-spacing: -2.5px;
          font-weight: 900;
        }

        .heroDesc {
          max-width: 620px;
          margin: 22px 0 30px;
          font-size: 18px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.82);
        }

        .searchPanel {
          background: white;
          border-radius: 28px;
          padding: 16px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
        }

        .searchBox {
          display: flex;
          gap: 10px;
        }

        .searchBox input {
          flex: 1;
          border: 1px solid #dde7ec;
          background: #f8fafc;
          color: #1f2933;
          outline: none;
          border-radius: 18px;
          padding: 17px 18px;
          font-size: 16px;
        }

        .searchBox button {
          border: none;
          border-radius: 18px;
          background: #f26b5e;
          color: white;
          padding: 0 28px;
          font-weight: 900;
          font-size: 16px;
          cursor: pointer;
        }

        .quickMenus {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .quickMenus button {
          border: none;
          background: #eaf6fa;
          color: #183b56;
          border-radius: 999px;
          padding: 9px 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .heroVisual {
          position: relative;
          min-height: 360px;
        }

        .visualCard {
          position: absolute;
          background: rgba(255, 255, 255, 0.94);
          color: #183b56;
          border-radius: 30px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.22);
        }

        .mainCard {
          top: 24px;
          right: 32px;
          width: 300px;
          padding: 30px;
        }

        .mainCard .smallLabel {
          display: inline-block;
          background: #eaf6fa;
          color: #1f6f5b;
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 13px;
          font-weight: 900;
          margin-bottom: 18px;
        }

        .mainCard strong {
          display: block;
          font-size: 30px;
          letter-spacing: -1px;
          margin-bottom: 12px;
        }

        .mainCard p {
          margin: 0;
          line-height: 1.6;
          color: #52616b;
        }

        .priceCard {
          left: 10px;
          bottom: 28px;
          width: 210px;
          padding: 24px;
        }

        .priceCard span {
          display: block;
          color: #52616b;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .priceCard strong {
          color: #f26b5e;
          font-size: 30px;
          letter-spacing: -1px;
        }

        .circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(234, 246, 250, 0.22);
        }

        .circleOne {
          width: 180px;
          height: 180px;
          right: 0;
          bottom: 0;
        }

        .circleTwo {
          width: 90px;
          height: 90px;
          left: 80px;
          top: 30px;
          background: rgba(242, 107, 94, 0.22);
        }

        .summaryBand {
          max-width: 960px;
          margin: -34px auto 0;
          background: white;
          border-radius: 26px;
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          box-shadow: 0 18px 60px rgba(24, 59, 86, 0.12);
          position: relative;
          z-index: 2;
        }

        .summaryBand div {
          padding: 8px 16px;
          border-right: 1px solid #e4edf2;
        }

        .summaryBand div:last-child {
          border-right: none;
        }

        .summaryBand span {
          display: block;
          color: #7b8794;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .summaryBand strong {
          font-size: 18px;
          color: #183b56;
        }

        .content {
          max-width: 1120px;
          margin: 64px auto 80px;
          padding: 0 28px;
        }

        .sectionHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 24px;
        }

        .sectionLabel {
          margin: 0 0 8px;
          color: #f26b5e;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h2 {
          margin: 0;
          color: #183b56;
          font-size: 34px;
          letter-spacing: -1px;
        }

        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-end;
        }

        .filters button {
          border: 1px solid #d8e4ea;
          background: white;
          color: #52616b;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .filters button.active {
          background: #183b56;
          color: white;
          border-color: #183b56;
        }

        .stateBox {
          background: white;
          border: 1px solid #e1e8ed;
          border-radius: 28px;
          padding: 46px 28px;
          text-align: center;
          color: #52616b;
        }

        .stateBox strong {
          display: block;
          color: #183b56;
          font-size: 24px;
          margin-bottom: 10px;
        }

        .introGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .introCard {
          background: white;
          border-radius: 26px;
          padding: 28px;
          border: 1px solid #e1e8ed;
          box-shadow: 0 12px 36px rgba(24, 59, 86, 0.06);
        }

        .introCard span {
          color: #f26b5e;
          font-weight: 900;
          font-size: 14px;
        }

        .introCard strong {
          display: block;
          margin: 12px 0 8px;
          color: #183b56;
          font-size: 22px;
        }

        .introCard p {
          margin: 0;
          color: #52616b;
          line-height: 1.6;
        }

        .resultStats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }

        .resultStats div {
          background: white;
          border: 1px solid #e1e8ed;
          border-radius: 22px;
          padding: 22px;
        }

        .resultStats span {
          display: block;
          color: #7b8794;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .resultStats strong {
          color: #183b56;
          font-size: 28px;
        }

        .resultStats .price {
          color: #f26b5e;
        }

        .rankingList {
          background: white;
          border: 1px solid #e1e8ed;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 18px 50px rgba(24, 59, 86, 0.08);
        }

        .rankRow {
          display: grid;
          grid-template-columns: 62px 1fr 170px;
          gap: 18px;
          padding: 22px 24px;
          border-bottom: 1px solid #edf2f5;
          align-items: center;
        }

        .rankRow:last-child {
          border-bottom: none;
        }

        .rankNum {
          width: 42px;
          height: 42px;
          border-radius: 15px;
          background: #eaf6fa;
          color: #183b56;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }

        .titleLine {
          display: flex;
          gap: 10px;
          align-items: baseline;
          flex-wrap: wrap;
        }

        .titleLine strong {
          color: #1f2933;
          font-size: 19px;
        }

        .titleLine span {
          color: #1f6f5b;
          font-weight: 900;
        }

        .metaLine {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 10px 0 0;
        }

        .metaLine span {
          background: #f5f8fa;
          color: #52616b;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 13px;
          font-weight: 700;
        }

        .rankInfo p {
          margin: 10px 0 0;
          color: #7b8794;
          font-size: 14px;
          line-height: 1.5;
        }

        .rankPrice {
          text-align: right;
        }

        .rankPrice strong {
          display: block;
          color: #f26b5e;
          font-size: 24px;
          margin-bottom: 12px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .actions a {
          text-decoration: none;
          color: #183b56;
          background: #eaf6fa;
          border-radius: 999px;
          padding: 8px 11px;
          font-size: 13px;
          font-weight: 900;
        }

        @media (max-width: 820px) {
          .hero {
            padding: 22px 18px 58px;
            border-bottom-left-radius: 28px;
            border-bottom-right-radius: 28px;
          }

          .navLinks {
            display: none;
          }

          .heroInner {
            grid-template-columns: 1fr;
          }

          .heroVisual {
            display: none;
          }

          .searchBox {
            flex-direction: column;
          }

          .searchBox button {
            padding: 15px;
          }

          .summaryBand {
            margin: -26px 18px 0;
            grid-template-columns: 1fr;
          }

          .summaryBand div {
            border-right: none;
            border-bottom: 1px solid #e4edf2;
          }

          .summaryBand div:last-child {
            border-bottom: none;
          }

          .sectionHeader {
            align-items: flex-start;
            flex-direction: column;
          }

          .introGrid {
            grid-template-columns: 1fr;
          }

          .resultStats {
            grid-template-columns: 1fr;
          }

          .rankRow {
            grid-template-columns: 42px 1fr;
          }

          .rankPrice {
            grid-column: 2;
            text-align: left;
          }

          .actions {
            justify-content: flex-start;
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
