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
    { name: "국밥", icon: "🥘" },
    { name: "김밥", icon: "🍙" },
    { name: "짜장면", icon: "🍜" },
    { name: "커피", icon: "☕" },
    { name: "백반", icon: "🍚" },
    { name: "칼국수", icon: "🥣" },
    { name: "돈가스", icon: "🍛" },
    { name: "냉면", icon: "🧊" },
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
      <header className="topBar">
        <div className="topInner">
          <div className="brand">
            <div className="brandIcon">한</div>
            <div>
              <strong>착한한끼 부산</strong>
              <span>Busan Good Price Meal</span>
            </div>
          </div>

          <nav>
            <span>공공데이터</span>
            <span>가격비교</span>
            <span>지도연결</span>
          </nav>
        </div>
      </header>

      <section className="heroWrap">
        <div className="heroCard">
          <div className="heroText">
            <p className="eyebrow">PUBLIC DATA SERVICE</p>
            <h1>
              부산의 착한 한 끼,
              <br />
              가격부터 비교하세요
            </h1>
            <p className="desc">
              부산 착한가격업소 메뉴 정보를 공공데이터로 불러와
              원하는 메뉴를 가격 낮은 순으로 보여드립니다.
            </p>

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
                <button
                  key={menu.name}
                  onClick={() => handleQuickSearch(menu.name)}
                  className={selectedKeyword === menu.name ? "selected" : ""}
                >
                  <span>{menu.icon}</span>
                  {menu.name}
                </button>
              ))}
            </div>
          </div>

          <div className="heroArt">
            <div className="sun"></div>
            <div className="plate">
              <div className="bowl">🍚</div>
              <strong>오늘의 알뜰 메뉴</strong>
              <span>
                {cheapest
                  ? `${cheapest.priceNumber.toLocaleString()}원부터`
                  : "가격 비교 준비 완료"}
              </span>
            </div>
            <div className="wave waveOne"></div>
            <div className="wave waveTwo"></div>
            <div className="miniBadge badgeOne">가격 낮은 순</div>
            <div className="miniBadge badgeTwo">부산 착한가격업소</div>
          </div>
        </div>
      </section>

      <section className="infoStrip">
        <div>
          <span>데이터</span>
          <strong>부산 착한가격업소</strong>
        </div>
        <div>
          <span>검색</span>
          <strong>메뉴명 · 업소명</strong>
        </div>
        <div>
          <span>정렬</span>
          <strong>가격 낮은 순</strong>
        </div>
      </section>

      <section className="content">
        <div className="contentTop">
          <div>
            <p className="sectionLabel">PRICE RANKING</p>
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
            <div className="stateIcon">🌊</div>
            <strong>착한가격 메뉴를 불러오는 중입니다</strong>
            <p>잠시만 기다려주세요.</p>
          </div>
        )}

        {error && (
          <div className="stateBox">
            <div className="stateIcon">!</div>
            <strong>확인이 필요합니다</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && !selectedKeyword && (
          <div className="guideGrid">
            <div>
              <span>01</span>
              <strong>메뉴 검색</strong>
              <p>국밥, 김밥, 커피처럼 원하는 메뉴를 입력해보세요.</p>
            </div>
            <div>
              <span>02</span>
              <strong>가격 비교</strong>
              <p>착한가격업소 메뉴를 낮은 가격순으로 확인할 수 있어요.</p>
            </div>
            <div>
              <span>03</span>
              <strong>위치 확인</strong>
              <p>지도 보기 버튼으로 업소 위치를 바로 확인할 수 있어요.</p>
            </div>
          </div>
        )}

        {!loading && !error && selectedKeyword && (
          <>
            <div className="stats">
              <div className="statCard">
                <span>검색 결과</span>
                <strong>{results.length}개</strong>
              </div>
              <div className="statCard">
                <span>최저가</span>
                <strong className="priceText">
                  {cheapest ? `${cheapest.priceNumber.toLocaleString()}원` : "-"}
                </strong>
              </div>
              <div className="statCard wide">
                <span>검색 기준</span>
                <strong>{selectedKeyword} · 가격 낮은 순</strong>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="stateBox">
                <div className="stateIcon">🔎</div>
                <strong>검색 결과가 없습니다</strong>
                <p>다른 메뉴명으로 검색해보세요.</p>
              </div>
            ) : (
              <div className="rankingList">
                {results.map((item, index) => {
                  const store = item.store;
                  const address = store?.adres || "";
                  const mapQuery = encodeURIComponent(`${item.bsshNm} ${address}`);

                  return (
                    <div
                      className={index < 3 ? "rankItem topRank" : "rankItem"}
                      key={`${item.bsshNm}-${item.itemNm}-${index}`}
                    >
                      <div className="rankNum">
                        {index + 1}
                      </div>

                      <div className="rankMain">
                        <div className="titleLine">
                          <strong>{item.bsshNm}</strong>
                          <em>{item.itemNm}</em>
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

                      <div className="rankSide">
                        <strong>{item.priceNumber.toLocaleString()}원</strong>
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
          background:
            radial-gradient(circle at top left, rgba(113, 201, 206, 0.22), transparent 30%),
            radial-gradient(circle at bottom right, rgba(242, 107, 94, 0.14), transparent 28%),
            #f6fbfd;
          color: #1f2933;
          font-family: "Pretendard", "Apple SD Gothic Neo", system-ui, sans-serif;
        }

        .topBar {
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(218, 232, 238, 0.8);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .topInner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brandIcon {
          width: 42px;
          height: 42px;
          border-radius: 16px;
          background: linear-gradient(135deg, #183b56, #1f6f5b);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          box-shadow: 0 12px 24px rgba(24, 59, 86, 0.22);
        }

        .brand strong {
          display: block;
          color: #183b56;
          font-size: 18px;
          letter-spacing: -0.5px;
        }

        .brand span {
          display: block;
          margin-top: 2px;
          color: #7b8794;
          font-size: 12px;
        }

        nav {
          display: flex;
          gap: 22px;
          color: #52616b;
          font-size: 14px;
          font-weight: 800;
        }

        .heroWrap {
          max-width: 1120px;
          margin: 0 auto;
          padding: 38px 24px 20px;
        }

        .heroCard {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 28px;
          align-items: center;
          min-height: 390px;
          padding: 48px;
          border-radius: 42px;
          background:
            linear-gradient(135deg, rgba(24, 59, 86, 0.98), rgba(31, 111, 91, 0.92)),
            linear-gradient(45deg, #183b56, #2b8c83);
          box-shadow: 0 30px 80px rgba(24, 59, 86, 0.25);
          color: white;
        }

        .heroCard:before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 85% 20%, rgba(255, 255, 255, 0.16), transparent 26%),
            radial-gradient(circle at 18% 88%, rgba(242, 107, 94, 0.23), transparent 24%);
          pointer-events: none;
        }

        .heroText {
          position: relative;
          z-index: 2;
        }

        .eyebrow {
          margin: 0 0 12px;
          color: #9ee7e5;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        h1 {
          margin: 0;
          font-size: clamp(38px, 5.8vw, 66px);
          line-height: 1.08;
          letter-spacing: -2.4px;
          font-weight: 900;
        }

        .desc {
          max-width: 620px;
          margin: 20px 0 28px;
          color: rgba(255, 255, 255, 0.82);
          font-size: 17px;
          line-height: 1.7;
        }

        .searchBox {
          max-width: 660px;
          display: flex;
          gap: 10px;
          padding: 9px;
          background: rgba(255, 255, 255, 0.98);
          border-radius: 24px;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.18);
        }

        .searchBox input {
          flex: 1;
          border: none;
          outline: none;
          background: #f6fbfd;
          color: #1f2933;
          padding: 17px 18px;
          border-radius: 18px;
          font-size: 16px;
        }

        .searchBox button {
          border: none;
          background: #f26b5e;
          color: white;
          border-radius: 18px;
          padding: 0 30px;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s;
        }

        .searchBox button:hover {
          transform: translateY(-1px);
          background: #ef5b4d;
        }

        .quickMenus {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .quickMenus button {
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: rgba(255, 255, 255, 0.14);
          color: white;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 800;
          cursor: pointer;
          backdrop-filter: blur(10px);
        }

        .quickMenus button.selected,
        .quickMenus button:hover {
          background: white;
          color: #183b56;
        }

        .quickMenus span {
          margin-right: 5px;
        }

        .heroArt {
          position: relative;
          height: 320px;
          z-index: 2;
        }

        .sun {
          position: absolute;
          width: 120px;
          height: 120px;
          right: 34px;
          top: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffd7c8, #f26b5e);
          opacity: 0.9;
        }

        .plate {
          position: absolute;
          right: 34px;
          top: 74px;
          width: 260px;
          min-height: 205px;
          border-radius: 38px;
          background: rgba(255, 255, 255, 0.94);
          color: #183b56;
          padding: 32px 28px;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.22);
        }

        .bowl {
          width: 62px;
          height: 62px;
          border-radius: 22px;
          background: #eaf6fa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          margin-bottom: 20px;
        }

        .plate strong {
          display: block;
          font-size: 24px;
          letter-spacing: -0.8px;
          margin-bottom: 10px;
        }

        .plate span {
          color: #f26b5e;
          font-size: 24px;
          font-weight: 900;
        }

        .wave {
          position: absolute;
          border-radius: 999px;
          background: rgba(234, 246, 250, 0.28);
        }

        .waveOne {
          width: 230px;
          height: 42px;
          right: 0;
          bottom: 36px;
          transform: rotate(-8deg);
        }

        .waveTwo {
          width: 160px;
          height: 32px;
          right: 130px;
          bottom: 5px;
          transform: rotate(-8deg);
          opacity: 0.7;
        }

        .miniBadge {
          position: absolute;
          background: white;
          color: #183b56;
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.16);
        }

        .badgeOne {
          left: 14px;
          top: 84px;
        }

        .badgeTwo {
          left: 30px;
          bottom: 72px;
        }

        .infoStrip {
          max-width: 980px;
          margin: -18px auto 0;
          padding: 0 24px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          position: relative;
          z-index: 4;
        }

        .infoStrip div {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e2edf2;
          border-radius: 22px;
          padding: 20px 22px;
          box-shadow: 0 16px 38px rgba(24, 59, 86, 0.09);
        }

        .infoStrip span {
          display: block;
          color: #7b8794;
          font-size: 13px;
          margin-bottom: 7px;
        }

        .infoStrip strong {
          color: #183b56;
          font-size: 17px;
        }

        .content {
          max-width: 1120px;
          margin: 54px auto 80px;
          padding: 0 24px;
        }

        .contentTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 18px;
          margin-bottom: 20px;
        }

        .sectionLabel {
          margin: 0 0 8px;
          color: #f26b5e;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        h2 {
          margin: 0;
          color: #183b56;
          font-size: 34px;
          letter-spacing: -1px;
        }

        .filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .filters button {
          border: 1px solid #dce9ee;
          background: white;
          color: #52616b;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(24, 59, 86, 0.04);
        }

        .filters button.active {
          background: #183b56;
          color: white;
          border-color: #183b56;
        }

        .stateBox {
          background: white;
          border: 1px solid #e1edf2;
          border-radius: 30px;
          padding: 54px 28px;
          text-align: center;
          box-shadow: 0 18px 50px rgba(24, 59, 86, 0.07);
        }

        .stateIcon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          border-radius: 24px;
          background: #eaf6fa;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #183b56;
          font-size: 28px;
          font-weight: 900;
        }

        .stateBox strong {
          display: block;
          color: #183b56;
          font-size: 24px;
          margin-bottom: 10px;
        }

        .stateBox p {
          margin: 0;
          color: #7b8794;
        }

        .guideGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .guideGrid div {
          background: white;
          border: 1px solid #e1edf2;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 18px 45px rgba(24, 59, 86, 0.06);
        }

        .guideGrid span {
          display: inline-flex;
          width: 42px;
          height: 42px;
          border-radius: 16px;
          background: #eaf6fa;
          color: #183b56;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          margin-bottom: 16px;
        }

        .guideGrid strong {
          display: block;
          color: #183b56;
          font-size: 20px;
          margin-bottom: 8px;
        }

        .guideGrid p {
          margin: 0;
          color: #52616b;
          line-height: 1.6;
        }

        .stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1.2fr;
          gap: 14px;
          margin-bottom: 16px;
        }

        .statCard {
          background: white;
          border: 1px solid #e1edf2;
          border-radius: 24px;
          padding: 22px;
          box-shadow: 0 14px 36px rgba(24, 59, 86, 0.06);
        }

        .statCard span {
          display: block;
          color: #7b8794;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .statCard strong {
          color: #183b56;
          font-size: 25px;
        }

        .priceText {
          color: #f26b5e !important;
        }

        .rankingList {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .rankItem {
          display: grid;
          grid-template-columns: 58px 1fr 170px;
          gap: 16px;
          align-items: center;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #e1edf2;
          border-radius: 26px;
          padding: 20px 22px;
          box-shadow: 0 12px 34px rgba(24, 59, 86, 0.06);
          transition: 0.18s;
        }

        .rankItem:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 42px rgba(24, 59, 86, 0.1);
        }

        .topRank {
          border-color: rgba(242, 107, 94, 0.28);
          background:
            linear-gradient(90deg, rgba(255, 246, 244, 0.96), rgba(255, 255, 255, 0.96));
        }

        .rankNum {
          width: 44px;
          height: 44px;
          border-radius: 17px;
          background: #eaf6fa;
          color: #183b56;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }

        .topRank .rankNum {
          background: #f26b5e;
          color: white;
        }

        .titleLine {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }

        .titleLine strong {
          color: #1f2933;
          font-size: 19px;
        }

        .titleLine em {
          font-style: normal;
          color: #1f6f5b;
          font-weight: 900;
        }

        .metaLine {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .metaLine span {
          background: #f3f8fa;
          color: #52616b;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 13px;
          font-weight: 700;
        }

        .rankMain p {
          margin: 10px 0 0;
          color: #7b8794;
          font-size: 14px;
          line-height: 1.5;
        }

        .rankSide {
          text-align: right;
        }

        .rankSide > strong {
          display: block;
          color: #f26b5e;
          font-size: 24px;
          margin-bottom: 11px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 7px;
        }

        .actions a {
          text-decoration: none;
          background: #eaf6fa;
          color: #183b56;
          border-radius: 999px;
          padding: 8px 11px;
          font-size: 13px;
          font-weight: 900;
        }

        .actions a:hover {
          background: #183b56;
          color: white;
        }

        @media (max-width: 880px) {
          nav {
            display: none;
          }

          .heroCard {
            grid-template-columns: 1fr;
            padding: 34px 24px;
            border-radius: 32px;
          }

          .heroArt {
            display: none;
          }

          .searchBox {
            flex-direction: column;
          }

          .searchBox button {
            padding: 15px;
          }

          .infoStrip {
            grid-template-columns: 1fr;
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

          .rankItem {
            grid-template-columns: 48px 1fr;
          }

          .rankSide {
            grid-column: 2;
            text-align: left;
          }

          .actions {
            justify-content: flex-start;
          }
        }

        @media (max-width: 520px) {
          .topInner {
            padding: 14px 16px;
          }

          .heroWrap {
            padding: 24px 16px 12px;
          }

          h1 {
            font-size: 36px;
          }

          .content {
            padding: 0 16px;
            margin-top: 42px;
          }

          .rankItem {
            padding: 18px;
          }

          .titleLine strong {
            font-size: 17px;
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
