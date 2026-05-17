"use client";

import { useEffect, useMemo, useState } from "react";

const BUSAN_DISTRICTS = [
  "전체",
  "강서구",
  "금정구",
  "기장군",
  "남구",
  "동구",
  "동래구",
  "부산진구",
  "북구",
  "사상구",
  "사하구",
  "서구",
  "수영구",
  "연제구",
  "영도구",
  "중구",
  "해운대구",
];

const ITEMS_PER_PAGE = 12;

export default function Home() {
  const [menus, setMenus] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("전체");
  const [keyword, setKeyword] = useState("");
  const [selectedKeyword, setSelectedKeyword] = useState("");
  const [priceLimit, setPriceLimit] = useState("all");
  const [storePage, setStorePage] = useState(1);
  const [resultPage, setResultPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const menuKey = process.env.NEXT_PUBLIC_GOOD_PRICE_MENU_KEY;
  const storeKey = process.env.NEXT_PUBLIC_GOOD_PRICE_STORE_KEY;

  const quickMenus = [
    { name: "국밥", icon: "🍲" },
    { name: "김밥", icon: "🍙" },
    { name: "짜장면", icon: "🍜" },
    { name: "커피", icon: "☕" },
    { name: "백반", icon: "🍚" },
    { name: "칼국수", icon: "🥢" },
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

  const storesByDistrict = useMemo(() => {
    return stores.filter((store) => {
      if (selectedDistrict === "전체") return true;
      return stripHtml(store?.adres).includes(selectedDistrict);
    });
  }, [stores, selectedDistrict]);

  const pagedStores = useMemo(() => {
    const start = (storePage - 1) * ITEMS_PER_PAGE;
    return storesByDistrict.slice(start, start + ITEMS_PER_PAGE);
  }, [storesByDistrict, storePage]);

  const totalStorePages = Math.max(
    1,
    Math.ceil(storesByDistrict.length / ITEMS_PER_PAGE)
  );

  const allResults = useMemo(() => {
    const searchWord = selectedKeyword.trim();

    if (!searchWord) return [];

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
        const itemName = cleanText(item.itemNm);
        const storeName = cleanText(item.bsshNm);
        const word = cleanText(searchWord);

        return itemName.includes(word) || storeName.includes(word);
      })
      .filter((item) => {
        if (selectedDistrict === "전체") return true;
        return stripHtml(item.store?.adres).includes(selectedDistrict);
      })
      .filter((item) => {
        if (priceLimit === "all") return true;
        return item.priceNumber <= Number(priceLimit);
      })
      .sort((a, b) => a.priceNumber - b.priceNumber);
  }, [menus, selectedKeyword, selectedDistrict, priceLimit, storeMap]);

  const pagedResults = useMemo(() => {
    const start = (resultPage - 1) * ITEMS_PER_PAGE;
    return allResults.slice(start, start + ITEMS_PER_PAGE);
  }, [allResults, resultPage]);

  const totalResultPages = Math.max(
    1,
    Math.ceil(allResults.length / ITEMS_PER_PAGE)
  );

  const cheapest = allResults[0];

  function handleSearch() {
    setSelectedKeyword(keyword.trim());
    setResultPage(1);
  }

  function handleQuickSearch(word) {
    setKeyword(word);
    setSelectedKeyword(word);
    setResultPage(1);
  }

  function handleDistrictChange(e) {
    setSelectedDistrict(e.target.value);
    setSelectedKeyword("");
    setKeyword("");
    setStorePage(1);
    setResultPage(1);
  }

  function handlePriceLimit(value) {
    setPriceLimit(value);
    setResultPage(1);
  }

  function getRankLabel(index) {
    const realRank = (resultPage - 1) * ITEMS_PER_PAGE + index + 1;

    if (realRank === 1) return "🥇 1위";
    if (realRank === 2) return "🥈 2위";
    if (realRank === 3) return "🥉 3위";

    return `${realRank}위`;
  }

  return (
    <main className="page">
      <header className="topBar">
        <div className="topInner">
          <div className="brand">
            <div className="brandIcon">🍱</div>
            <div>
              <strong>부산, 착한한끼</strong>
              <span>공공데이터 기반 착한가격업소 메뉴 비교</span>
            </div>
          </div>

          <div className="headerTags">
            <span>📍 지역별</span>
            <span>💰 가격순</span>
            <span>🗺️ 지도연결</span>
          </div>
        </div>
      </header>

      <section className="heroWrap">
        <div className="heroCard">
          <div className="heroText">
            <p className="eyebrow">BUSAN GOOD PRICE MEAL</p>

            <h1 className="mainTitle">
              <span className="titleBusan">부산,</span>{" "}
              <span className="titleGood">착한</span>
              <span className="titleMeal">한끼</span>
            </h1>

            <p className="desc">
              지역을 먼저 고르고, 먹고 싶은 메뉴를 선택해보세요.
              부산 착한가격업소 메뉴를 가격 낮은 순서로 비교할 수 있어요.
            </p>

            <div className="stepPanel">
              <div className="selectBox">
                <label>1. 지역 선택</label>
                <select value={selectedDistrict} onChange={handleDistrictChange}>
                  {BUSAN_DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <div className="searchBox">
                <label>2. 메뉴 선택 또는 검색</label>
                <div className="searchRow">
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                    placeholder="예: 국밥, 김밥, 커피"
                  />
                  <button onClick={handleSearch}>검색</button>
                </div>
              </div>
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
        </div>
      </section>

      <section className="summaryRow">
        <div className="summaryCard">
          <span>📍 지역</span>
          <strong>{selectedDistrict}</strong>
        </div>
        <div className="summaryCard">
          <span>🏪 착한가격업소</span>
          <strong>{storesByDistrict.length}곳</strong>
        </div>
        <div className="summaryCard">
          <span>🍽️ 메뉴</span>
          <strong>{selectedKeyword || "선택 전"}</strong>
        </div>
      </section>

      <section className="content">
        {loading && (
          <div className="stateBox">
            <div className="stateEmoji">🐣</div>
            <strong>착한가격 정보를 불러오는 중이에요</strong>
            <p>잠시만 기다려주세요.</p>
          </div>
        )}

        {error && (
          <div className="stateBox">
            <div className="stateEmoji">😢</div>
            <strong>확인이 필요해요</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && !selectedKeyword && (
          <>
            <div className="sectionTop">
              <div>
                <p className="sectionLabel">GOOD PRICE STORES</p>
                <h2>📍 {selectedDistrict} 착한가격업소</h2>
                <p className="sectionDesc">
                  한 페이지에 12개씩 보여드려요. 다음 페이지를 눌러 더 볼 수 있어요.
                </p>
              </div>
            </div>

            {pagedStores.length === 0 ? (
              <div className="stateBox">
                <div className="stateEmoji">🔍</div>
                <strong>해당 지역의 업소가 없어요</strong>
                <p>다른 지역을 선택해보세요.</p>
              </div>
            ) : (
              <>
                <div className="storeGrid">
                  {pagedStores.map((store, index) => {
                    const address = stripHtml(store?.adres);
                    const mapQuery = encodeURIComponent(`${store?.sj} ${address}`);
                    const imageUrl = getImageUrl(store?.imgFile1);

                    return (
                      <div className="storeCard" key={`${store?.sj}-${index}`}>
                        {imageUrl ? (
                          <img
                            className="storePhoto"
                            src={imageUrl}
                            alt={stripHtml(store?.sj)}
                          />
                        ) : (
                          <div className="storeEmoji">{getStoreEmoji(store?.cn)}</div>
                        )}

                        <strong>{stripHtml(store?.sj)}</strong>

                        <div className="storeChips">
                          {store?.cn && <span>{stripHtml(store.cn)}</span>}
                          {store?.locale && <span>{stripHtml(store.locale)}</span>}
                        </div>

                        {address && <p>{address}</p>}

                        <div className="storeActions">
                          <a
                            href={`https://map.naver.com/p/search/${mapQuery}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            🗺️ 지도
                          </a>
                          {store?.tel && <a href={`tel:${store.tel}`}>📞 전화</a>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Pagination
                  page={storePage}
                  totalPages={totalStorePages}
                  onPrev={() => setStorePage((p) => Math.max(1, p - 1))}
                  onNext={() => setStorePage((p) => Math.min(totalStorePages, p + 1))}
                />
              </>
            )}
          </>
        )}

        {!loading && !error && selectedKeyword && (
          <>
            <div className="sectionTop">
              <div>
                <p className="sectionLabel">PRICE RANKING</p>
                <h2>
                  {selectedDistrict} · {selectedKeyword} 가격 순위
                </h2>
                <p className="sectionDesc">
                  선택한 지역 안에서 가격이 낮은 순서로 보여드려요.
                </p>
              </div>

              <div className="filters">
                <button
                  className={priceLimit === "all" ? "active" : ""}
                  onClick={() => handlePriceLimit("all")}
                >
                  전체
                </button>
                <button
                  className={priceLimit === "5000" ? "active" : ""}
                  onClick={() => handlePriceLimit("5000")}
                >
                  5천원 이하
                </button>
                <button
                  className={priceLimit === "8000" ? "active" : ""}
                  onClick={() => handlePriceLimit("8000")}
                >
                  8천원 이하
                </button>
                <button
                  className={priceLimit === "10000" ? "active" : ""}
                  onClick={() => handlePriceLimit("10000")}
                >
                  1만원 이하
                </button>
              </div>
            </div>

            <div className="statsGrid">
              <div className="statBox coral">
                <span>검색 결과</span>
                <strong>{allResults.length}개</strong>
              </div>
              <div className="statBox mint">
                <span>최저가</span>
                <strong>
                  {cheapest ? `${cheapest.priceNumber.toLocaleString()}원` : "-"}
                </strong>
              </div>
              <div className="statBox cream">
                <span>현재 페이지</span>
                <strong>
                  {resultPage} / {totalResultPages}
                </strong>
              </div>
            </div>

            {pagedResults.length === 0 ? (
              <div className="stateBox">
                <div className="stateEmoji">🔍</div>
                <strong>검색 결과가 없어요</strong>
                <p>다른 메뉴명이나 지역으로 다시 검색해보세요.</p>
              </div>
            ) : (
              <>
                <div className="resultGrid">
                  {pagedResults.map((item, index) => {
                    const store = item.store;
                    const address = stripHtml(store?.adres);
                    const mapQuery = encodeURIComponent(`${item.bsshNm} ${address}`);
                    const imageUrl = getImageUrl(store?.imgFile1);

                    return (
                      <div
                        className={
                          (resultPage - 1) * ITEMS_PER_PAGE + index < 3
                            ? "resultCard topCard"
                            : "resultCard"
                        }
                        key={`${item.bsshNm}-${item.itemNm}-${index}`}
                      >
                        <div className="rankCorner">{getRankLabel(index)}</div>

                        <div className="pricePill">
                          {item.priceNumber.toLocaleString()}원
                        </div>

                        {imageUrl ? (
                          <img
                            className="resultPhoto"
                            src={imageUrl}
                            alt={stripHtml(item.bsshNm)}
                          />
                        ) : (
                          <div className="menuIcon">
                            {getMenuEmoji(item.itemNm)}
                          </div>
                        )}

                        <div className="resultTitle">
                          <strong>{stripHtml(item.bsshNm)}</strong>
                          <em>{stripHtml(item.itemNm)}</em>
                        </div>

                        <div className="infoChips">
                          {store?.locale && <span>📍 {stripHtml(store.locale)}</span>}
                          {store?.bsnTime && <span>⏰ {stripHtml(store.bsnTime)}</span>}
                          {store?.parkngAt && (
                            <span>
                              {store.parkngAt === "Y"
                                ? "🚗 주차 가능"
                                : "🚫 주차 정보 없음"}
                            </span>
                          )}
                        </div>

                        {address && <p className="addressText">{address}</p>}

                        <div className="actionRow">
                          <a
                            href={`https://map.naver.com/p/search/${mapQuery}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            🗺️ 지도 보기
                          </a>
                          {store?.tel && <a href={`tel:${store.tel}`}>📞 전화</a>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Pagination
                  page={resultPage}
                  totalPages={totalResultPages}
                  onPrev={() => setResultPage((p) => Math.max(1, p - 1))}
                  onNext={() => setResultPage((p) => Math.min(totalResultPages, p + 1))}
                />
              </>
            )}
          </>
        )}
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(255, 219, 207, 0.52), transparent 28%),
            radial-gradient(circle at top right, rgba(198, 239, 234, 0.6), transparent 28%),
            linear-gradient(180deg, #fffaf4 0%, #f7fbfb 52%, #fff8f1 100%);
          color: #24324a;
          font-family: "Pretendard", "Apple SD Gothic Neo", system-ui, sans-serif;
        }

        .topBar {
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(16px);
          background: rgba(255, 250, 244, 0.82);
          border-bottom: 1px solid rgba(230, 221, 211, 0.8);
        }

        .topInner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 15px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brandIcon {
          width: 46px;
          height: 46px;
          border-radius: 17px;
          background: linear-gradient(135deg, #ff8a7a, #ffd6a5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          box-shadow: 0 12px 24px rgba(255, 138, 122, 0.24);
        }

        .brand strong {
          display: block;
          color: #17324d;
          font-size: 20px;
          letter-spacing: -0.5px;
        }

        .brand span {
          display: block;
          margin-top: 2px;
          color: #7b8794;
          font-size: 12px;
        }

        .headerTags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .headerTags span {
          background: #ffffff;
          border: 1px solid #eadfd4;
          color: #58677a;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
        }

        .heroWrap {
          max-width: 1120px;
          margin: 0 auto;
          padding: 28px 24px 16px;
        }

        .heroCard {
          padding: 36px 34px;
          border-radius: 34px;
          background:
            radial-gradient(circle at 10% 0%, rgba(255, 255, 255, 0.7), transparent 26%),
            linear-gradient(135deg, #fff4e8 0%, #e9fbf8 48%, #fff1ea 100%);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 24px 62px rgba(86, 94, 110, 0.12);
          overflow: hidden;
        }

        .heroText {
          max-width: 760px;
          margin: 0 auto;
          text-align: center;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #f26b5e;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .mainTitle {
          margin: 0;
          font-size: clamp(46px, 7vw, 82px);
          line-height: 1;
          letter-spacing: -3px;
          font-weight: 950;
        }

        .titleBusan {
          color: #17324d;
        }

        .titleGood {
          color: #f26b5e;
        }

        .titleMeal {
          color: #1f8a70;
        }

        .desc {
          margin: 18px auto 24px;
          max-width: 540px;
          color: #52616b;
          font-size: 17px;
          line-height: 1.7;
          text-align: center;
          word-break: keep-all;
        }

        .stepPanel {
          display: grid;
          grid-template-columns: 0.92fr 1.08fr;
          gap: 14px;
          background: rgba(255, 255, 255, 0.76);
          border: 1px solid rgba(255, 255, 255, 0.95);
          border-radius: 26px;
          padding: 16px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
        }

        .selectBox label,
        .searchBox label {
          display: block;
          margin-bottom: 8px;
          color: #52616b;
          font-size: 13px;
          font-weight: 900;
          text-align: left;
        }

        .selectBox select,
        .searchRow input {
          width: 100%;
          border: none;
          outline: none;
          background: #ffffff;
          color: #24324a;
          padding: 15px 16px;
          border-radius: 16px;
          font-size: 15px;
          box-shadow: inset 0 0 0 1px #eadfd4;
        }

        .searchRow {
          display: grid;
          grid-template-columns: 1fr 84px;
          gap: 8px;
        }

        .searchRow button {
          border: none;
          background: #17324d;
          color: #ffffff;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
        }

        .quickMenus {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 16px;
        }

        .quickMenus button {
          border: 1px solid #eadfd4;
          background: #ffffff;
          color: #17324d;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 7px 17px rgba(86, 94, 110, 0.06);
        }

        .quickMenus button span {
          margin-right: 6px;
        }

        .quickMenus button.selected,
        .quickMenus button:hover {
          background: #fff0eb;
          border-color: #ffb3a8;
          color: #e85d50;
        }

        .summaryRow {
          max-width: 980px;
          margin: 18px auto 0;
          padding: 0 24px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .summaryCard {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #eadfd4;
          border-radius: 22px;
          padding: 18px 20px;
          box-shadow: 0 13px 30px rgba(86, 94, 110, 0.07);
        }

        .summaryCard span {
          display: block;
          color: #7b8794;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .summaryCard strong {
          color: #17324d;
          font-size: 18px;
        }

        .content {
          max-width: 1120px;
          margin: 34px auto 80px;
          padding: 0 24px;
        }

        .sectionTop {
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
          letter-spacing: 0.08em;
        }

        h2 {
          margin: 0;
          color: #17324d;
          font-size: 32px;
          letter-spacing: -1px;
        }

        .sectionDesc {
          margin: 10px 0 0;
          color: #52616b;
          line-height: 1.6;
        }

        .filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .filters button {
          border: 1px solid #eadfd4;
          background: #ffffff;
          color: #52616b;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(86, 94, 110, 0.04);
        }

        .filters button.active {
          background: #17324d;
          color: white;
          border-color: #17324d;
        }

        .stateBox {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #eadfd4;
          border-radius: 30px;
          padding: 54px 28px;
          text-align: center;
          box-shadow: 0 18px 40px rgba(86, 94, 110, 0.07);
        }

        .stateEmoji {
          font-size: 44px;
          margin-bottom: 14px;
        }

        .stateBox strong {
          display: block;
          color: #17324d;
          font-size: 24px;
          margin-bottom: 10px;
        }

        .stateBox p {
          margin: 0;
          color: #7b8794;
        }

        .storeGrid,
        .resultGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .storeCard,
        .resultCard {
          position: relative;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid #eadfd4;
          border-radius: 28px;
          padding: 22px;
          box-shadow: 0 15px 34px rgba(86, 94, 110, 0.06);
          transition: 0.18s ease;
          overflow: hidden;
        }

        .storeCard:hover,
        .resultCard:hover {
          transform: translateY(-3px);
          box-shadow: 0 22px 42px rgba(86, 94, 110, 0.1);
        }

        .storePhoto,
        .resultPhoto {
          width: 100%;
          height: 160px;
          object-fit: cover;
          border-radius: 22px;
          margin-bottom: 16px;
          background: #f3f4f6;
          box-shadow: 0 10px 24px rgba(86, 94, 110, 0.08);
        }

        .resultPhoto {
          margin-top: 4px;
        }

        .storeEmoji,
        .menuIcon {
          width: 54px;
          height: 54px;
          border-radius: 20px;
          background: linear-gradient(135deg, #e4fbf4, #fff0e8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
          margin-bottom: 16px;
        }

        .storeCard strong,
        .resultTitle strong {
          display: block;
          color: #17324d;
          font-size: 20px;
          margin-bottom: 8px;
          letter-spacing: -0.4px;
        }

        .storeChips,
        .infoChips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .storeChips span,
        .infoChips span {
          background: #fff7f0;
          color: #5b6570;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 13px;
          font-weight: 700;
        }

        .storeCard p,
        .addressText {
          margin: 14px 0 0;
          color: #7b8794;
          font-size: 14px;
          line-height: 1.6;
        }

        .storeActions,
        .actionRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .storeActions a,
        .actionRow a {
          text-decoration: none;
          background: #e9f8f4;
          color: #17324d;
          border-radius: 999px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 900;
        }

        .storeActions a:hover,
        .actionRow a:hover {
          background: #17324d;
          color: white;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .statBox {
          border-radius: 24px;
          padding: 22px;
          box-shadow: 0 14px 30px rgba(86, 94, 110, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.9);
        }

        .statBox span {
          display: block;
          font-size: 13px;
          color: #5f6f80;
          margin-bottom: 8px;
          font-weight: 800;
        }

        .statBox strong {
          font-size: 26px;
          color: #17324d;
        }

        .coral {
          background: linear-gradient(135deg, #fff0eb, #ffffff);
        }

        .mint {
          background: linear-gradient(135deg, #e9fbf7, #ffffff);
        }

        .cream {
          background: linear-gradient(135deg, #fff8e9, #ffffff);
        }

        .topCard {
          background: linear-gradient(135deg, #fff4eb, #ffffff);
          border-color: #ffc8b8;
        }

        .rankCorner {
          position: absolute;
          top: 0;
          left: 0;
          background: linear-gradient(135deg, #f26b5e, #ff9a6a);
          color: white;
          padding: 9px 15px;
          border-bottom-right-radius: 20px;
          font-size: 14px;
          font-weight: 900;
          box-shadow: 0 10px 24px rgba(242, 107, 94, 0.22);
          z-index: 2;
        }

        .pricePill {
          position: absolute;
          top: 18px;
          right: 18px;
          background: #17324d;
          color: white;
          padding: 9px 14px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 900;
          z-index: 2;
        }

        .resultCard {
          padding-top: 58px;
        }

        .resultTitle em {
          font-style: normal;
          color: #f26b5e;
          font-size: 15px;
          font-weight: 900;
        }

        @media (max-width: 960px) {
          .stepPanel {
            grid-template-columns: 1fr;
          }

          .summaryRow,
          .statsGrid,
          .storeGrid,
          .resultGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sectionTop {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 640px) {
          .topInner {
            padding: 14px 16px;
            flex-direction: column;
            align-items: flex-start;
          }

          .headerTags {
            display: none;
          }

          .heroWrap,
          .content {
            padding-left: 16px;
            padding-right: 16px;
          }

          .heroCard {
            padding: 26px 20px;
            border-radius: 30px;
          }

          .searchRow {
            grid-template-columns: 1fr;
          }

          .searchRow button {
            padding: 14px;
          }

          .summaryRow,
          .statsGrid,
          .storeGrid,
          .resultGrid {
            grid-template-columns: 1fr;
          }

          .mainTitle {
            font-size: 48px;
          }

          h2 {
            font-size: 27px;
          }

          .storePhoto,
          .resultPhoto {
            height: 180px;
          }
        }
      `}</style>
    </main>
  );
}

function Pagination({ page, totalPages, onPrev, onNext }) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "38px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "18px",
          padding: "16px 20px",
          borderRadius: "999px",
          background: "rgba(255, 255, 255, 0.95)",
          border: "1px solid #eadfd4",
          boxShadow: "0 16px 36px rgba(86, 94, 110, 0.14)",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={onPrev}
          disabled={page <= 1}
          style={{
            border: "none",
            borderRadius: "999px",
            padding: "14px 24px",
            minWidth: "112px",
            background:
              page <= 1
                ? "#d7dce2"
                : "linear-gradient(135deg, #17324d, #27496b)",
            color: page <= 1 ? "#8b97a3" : "#ffffff",
            fontSize: "16px",
            fontWeight: "900",
            cursor: page <= 1 ? "not-allowed" : "pointer",
            boxShadow:
              page <= 1 ? "none" : "0 8px 18px rgba(23, 50, 77, 0.18)",
          }}
        >
          ← 이전
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            padding: "10px 18px",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #fff4eb, #ffffff)",
            border: "1px solid #f2d4c8",
            minWidth: "126px",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ff8a7a, #f26b5e)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "900",
              boxShadow: "0 8px 18px rgba(242, 107, 94, 0.24)",
            }}
          >
            {page}
          </span>

          <span
            style={{
              color: "#97a2ad",
              fontSize: "18px",
              fontWeight: "900",
            }}
          >
            /
          </span>

          <span
            style={{
              color: "#17324d",
              fontSize: "18px",
              fontWeight: "900",
            }}
          >
            {totalPages}
          </span>
        </div>

        <button
          onClick={onNext}
          disabled={page >= totalPages}
          style={{
            border: "none",
            borderRadius: "999px",
            padding: "14px 24px",
            minWidth: "112px",
            background:
              page >= totalPages
                ? "#d7dce2"
                : "linear-gradient(135deg, #17324d, #27496b)",
            color: page >= totalPages ? "#8b97a3" : "#ffffff",
            fontSize: "16px",
            fontWeight: "900",
            cursor: page >= totalPages ? "not-allowed" : "pointer",
            boxShadow:
              page >= totalPages
                ? "none"
                : "0 8px 18px rgba(23, 50, 77, 0.18)",
          }}
        >
          다음 →
        </button>
      </div>
    </div>
  );
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
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

function getImageUrl(value) {
  const raw = String(value ?? "")
    .replace(/&amp;/g, "&")
    .trim();

  if (!raw || raw === "null" || raw === "undefined") return "";

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  return `https://${raw}`;
}

function getStoreEmoji(category) {
  const text = cleanText(category);

  if (text.includes("음식")) return "🍽️";
  if (text.includes("이미용")) return "💇";
  if (text.includes("목욕")) return "🛁";
  return "🏪";
}

function getMenuEmoji(menuName) {
  const text = cleanText(menuName);

  if (text.includes("국밥")) return "🍲";
  if (text.includes("김밥")) return "🍙";
  if (text.includes("짜장")) return "🍜";
  if (text.includes("커피") || text.includes("아메리카노")) return "☕";
  if (text.includes("백반")) return "🍚";
  if (text.includes("칼국수")) return "🥢";
  if (text.includes("돈가스") || text.includes("돈까스")) return "🍛";
  if (text.includes("냉면")) return "🧊";
  return "🍽️";
}
