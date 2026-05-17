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
      .slice(0, 80);
  }, [menus, selectedKeyword, priceLimit, storeMap]);

  const cheapest = results[0];

  function handleSearch() {
    setSelectedKeyword(keyword.trim());
  }

  function handleQuickSearch(word) {
    setKeyword(word);
    setSelectedKeyword(word);
  }

  return (
    <main className="page">
      <header className="topHeader">
        <div className="headerInner">
          <div className="brand">
            <div className="brandMark">착</div>
            <div>
              <strong>착한한끼 부산</strong>
              <span>Busan Good Price Meal</span>
            </div>
          </div>

          <nav>
            <span>공공데이터</span>
            <span>메뉴 가격 비교</span>
            <span>착한가격업소</span>
          </nav>
        </div>
      </header>

      <section className="searchSection">
        <div className="titleBlock">
          <p>공공데이터 기반 생활물가 비교 서비스</p>
          <h1>부산 착한가격업소 메뉴 가격 비교</h1>
          <span>
            원하는 메뉴를 검색하면 부산 착한가격업소의 메뉴 가격을 낮은 가격순으로 확인할 수 있습니다.
          </span>
        </div>

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

        <div className="quickArea">
          <span>추천 검색어</span>
          <div>
            {quickMenus.map((menu) => (
              <button key={menu} onClick={() => handleQuickSearch(menu)}>
                {menu}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="content">
        <div className="contentTop">
          <div>
            <p className="label">PRICE RANKING</p>
            <h2>{selectedKeyword ? `${selectedKeyword} 검색 결과` : "메뉴를 검색해보세요"}</h2>
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
          <div className="guideGrid">
            <div>
              <strong>01. 메뉴 검색</strong>
              <p>국밥, 김밥, 커피처럼 원하는 메뉴명을 입력합니다.</p>
            </div>
            <div>
              <strong>02. 가격 비교</strong>
              <p>검색 결과를 낮은 가격순으로 확인합니다.</p>
            </div>
            <div>
              <strong>03. 위치 확인</strong>
              <p>지도 보기 버튼으로 업소 위치를 바로 확인합니다.</p>
            </div>
          </div>
        )}

        {!loading && !error && selectedKeyword && (
          <>
            <div className="stats">
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
                <p>다른 메뉴명으로 검색해보세요.</p>
              </div>
            ) : (
              <div className="listBox">
                <div className="listHead">
                  <span>순위</span>
                  <span>업소 및 메뉴</span>
                  <span>가격</span>
                </div>

                {results.map((item, index) => {
                  const store = item.store;
                  const address = store?.adres || "";
                  const mapQuery = encodeURIComponent(`${item.bsshNm} ${address}`);

                  return (
                    <div className="listRow" key={`${item.bsshNm}-${item.itemNm}-${index}`}>
                      <div className="rank">{index + 1}</div>

                      <div className="info">
                        <div className="mainLine">
                          <strong>{item.bsshNm}</strong>
                          <em>{item.itemNm}</em>
                        </div>

                        <div className="subLine">
                          {store?.locale && <span>{store.locale}</span>}
                          {store?.bsnTime && <span>{stripHtml(store.bsnTime)}</span>}
                          {store?.parkngAt && (
                            <span>{store.parkngAt === "Y" ? "주차 가능" : "주차 정보 없음"}</span>
                          )}
                        </div>

                        {address && <p>{stripHtml(address)}</p>}
                      </div>

                      <div className="priceArea">
                        <strong>{item.priceNumber.toLocaleString()}원</strong>
                        <div>
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
          background: #f6f9fb;
          color: #1f2933;
          font-family: "Pretendard", "Apple SD Gothic Neo", system-ui, sans-serif;
        }

        .topHeader {
          background: #ffffff;
          border-bottom: 1px solid #e5edf2;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .headerInner {
          max-width: 1080px;
          margin: 0 auto;
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brandMark {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          background: #183b56;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }

        .brand strong {
          display: block;
          font-size: 18px;
          color: #183b56;
          letter-spacing: -0.5px;
        }

        .brand span {
          display: block;
          margin-top: 2px;
          font-size: 12px;
          color: #7b8794;
        }

        nav {
          display: flex;
          gap: 20px;
          color: #52616b;
          font-size: 14px;
          font-weight: 700;
        }

        .searchSection {
          max-width: 1080px;
          margin: 0 auto;
          padding: 58px 24px 34px;
        }

        .titleBlock {
          max-width: 720px;
        }

        .titleBlock p {
          margin: 0 0 12px;
          color: #f26b5e;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.08em;
        }

        h1 {
          margin: 0;
          color: #183b56;
          font-size: clamp(34px, 5vw, 54px);
          line-height: 1.18;
          letter-spacing: -2px;
          font-weight: 900;
        }

        .titleBlock span {
          display: block;
          margin-top: 16px;
          color: #52616b;
          font-size: 17px;
          line-height: 1.7;
        }

        .searchBox {
          margin-top: 30px;
          background: #ffffff;
          border: 1px solid #dbe7ee;
          border-radius: 22px;
          padding: 8px;
          display: flex;
          gap: 8px;
          box-shadow: 0 14px 36px rgba(24, 59, 86, 0.08);
        }

        .searchBox input {
          flex: 1;
          border: none;
          outline: none;
          padding: 17px 18px;
          border-radius: 16px;
          background: #f8fbfd;
          color: #1f2933;
          font-size: 16px;
        }

        .searchBox button {
          border: none;
          border-radius: 16px;
          background: #183b56;
          color: #ffffff;
          padding: 0 30px;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .quickArea {
          margin-top: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .quickArea > span {
          color: #7b8794;
          font-size: 14px;
          font-weight: 800;
        }

        .quickArea div {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .quickArea button {
          border: 1px solid #d8e8ef;
          background: #eaf6fa;
          color: #183b56;
          border-radius: 999px;
          padding: 9px 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .content {
          max-width: 1080px;
          margin: 0 auto;
          padding: 26px 24px 80px;
        }

        .contentTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 18px;
          margin-bottom: 20px;
        }

        .label {
          margin: 0 0 8px;
          color: #f26b5e;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        h2 {
          margin: 0;
          color: #183b56;
          font-size: 30px;
          letter-spacing: -1px;
        }

        .filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .filters button {
          border: 1px solid #dbe7ee;
          background: #ffffff;
          color: #52616b;
          border-radius: 999px;
          padding: 9px 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .filters button.active {
          background: #183b56;
          color: #ffffff;
          border-color: #183b56;
        }

        .stateBox {
          background: #ffffff;
          border: 1px solid #e1e8ed;
          border-radius: 22px;
          padding: 46px 24px;
          text-align: center;
          box-shadow: 0 12px 30px rgba(24, 59, 86, 0.05);
        }

        .stateBox strong {
          display: block;
          color: #183b56;
          font-size: 22px;
          margin-bottom: 8px;
        }

        .stateBox p {
          margin: 0;
          color: #7b8794;
        }

        .guideGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .guideGrid div {
          background: #ffffff;
          border: 1px solid #e1e8ed;
          border-radius: 22px;
          padding: 24px;
          box-shadow: 0 12px 30px rgba(24, 59, 86, 0.05);
        }

        .guideGrid strong {
          display: block;
          color: #183b56;
          font-size: 18px;
          margin-bottom: 8px;
        }

        .guideGrid p {
          margin: 0;
          color: #52616b;
          line-height: 1.6;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-bottom: 14px;
        }

        .stats div {
          background: #ffffff;
          border: 1px solid #e1e8ed;
          border-radius: 20px;
          padding: 20px;
        }

        .stats span {
          display: block;
          color: #7b8794;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .stats strong {
          color: #183b56;
          font-size: 26px;
        }

        .stats .price {
          color: #f26b5e;
        }

        .listBox {
          background: #ffffff;
          border: 1px solid #e1e8ed;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(24, 59, 86, 0.07);
        }

        .listHead {
          display: grid;
          grid-template-columns: 70px 1fr 180px;
          gap: 18px;
          padding: 16px 22px;
          background: #f1f6f9;
          color: #7b8794;
          font-size: 13px;
          font-weight: 900;
        }

        .listRow {
          display: grid;
          grid-template-columns: 70px 1fr 180px;
          gap: 18px;
          padding: 22px;
          border-top: 1px solid #edf2f5;
          align-items: center;
        }

        .rank {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          background: #eaf6fa;
          color: #183b56;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }

        .mainLine {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }

        .mainLine strong {
          color: #1f2933;
          font-size: 18px;
        }

        .mainLine em {
          font-style: normal;
          color: #1f6f5b;
          font-weight: 900;
        }

        .subLine {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 9px;
        }

        .subLine span {
          background: #f5f8fa;
          color: #52616b;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 13px;
          font-weight: 700;
        }

        .info p {
          margin: 9px 0 0;
          color: #7b8794;
          font-size: 14px;
          line-height: 1.5;
        }

        .priceArea {
          text-align: right;
        }

        .priceArea > strong {
          display: block;
          color: #f26b5e;
          font-size: 24px;
          margin-bottom: 10px;
        }

        .priceArea div {
          display: flex;
          gap: 7px;
          justify-content: flex-end;
        }

        .priceArea a {
          text-decoration: none;
          background: #eaf6fa;
          color: #183b56;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 13px;
          font-weight: 900;
        }

        @media (max-width: 760px) {
          .headerInner {
            padding: 16px;
          }

          nav {
            display: none;
          }

          .searchSection {
            padding: 42px 18px 26px;
          }

          .searchBox {
            flex-direction: column;
          }

          .searchBox button {
            padding: 15px;
          }

          .content {
            padding: 18px 18px 60px;
          }

          .contentTop {
            flex-direction: column;
            align-items: flex-start;
          }

          .guideGrid {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .listHead {
            display: none;
          }

          .listRow {
            grid-template-columns: 44px 1fr;
            gap: 12px;
          }

          .priceArea {
            grid-column: 2;
            text-align: left;
          }

          .priceArea div {
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
