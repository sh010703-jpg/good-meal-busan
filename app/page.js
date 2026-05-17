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

export default function Home() {
  const [menus, setMenus] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("전체");
  const [keyword, setKeyword] = useState("");
  const [selectedKeyword, setSelectedKeyword] = useState("");
  const [priceLimit, setPriceLimit] = useState("all");
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

  const previewStores = useMemo(() => {
    return storesByDistrict.slice(0, 12);
  }, [storesByDistrict]);

  const results = useMemo(() => {
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
      .sort((a, b) => a.priceNumber - b.priceNumber)
      .slice(0, 60);
  }, [menus, selectedKeyword, selectedDistrict, priceLimit, storeMap]);

  const cheapest = results[0];

  function handleSearch() {
    setSelectedKeyword(keyword.trim());
  }

  function handleQuickSearch(word) {
    setKeyword(word);
    setSelectedKeyword(word);
  }

  function handleDistrictChange(e) {
    setSelectedDistrict(e.target.value);
    setSelectedKeyword("");
    setKeyword("");
  }

  function getRankLabel(index) {
    if (index === 0) return "🥇 1위";
    if (index === 1) return "🥈 2위";
    if (index === 2) return "🥉 3위";
    return `${index + 1}위`;
  }

  return (
    <main className="page">
      <header className="topBar">
        <div className="topInner">
          <div className="brand">
            <div className="brandIcon">🍱</div>
            <div>
              <strong>착한한끼 부산</strong>
              <span>부산 착한가격업소 메뉴 가격 비교</span>
            </div>
          </div>

          <div className="headerTags">
            <span>📍 지역 먼저 선택</span>
            <span>💸 가격 낮은 순</span>
            <span>🗺️ 지도 연결</span>
          </div>
        </div>
      </header>

      <section className="heroWrap">
        <div className="heroCard">
          <div className="heroText">
            <p className="eyebrow">공공데이터 기반 생활물가 비교 서비스</p>
            <h1>
              지역을 고르고,
              <br />
              착한 한 끼를 찾아보세요
            </h1>
            <p className="desc">
              부산의 착한가격업소를 지역별로 먼저 확인하고,
              원하는 메뉴를 선택하면 가장 저렴한 순서로 비교할 수 있어요.
            </p>

            <div className="stepPanel">
              <div className="selectBox">
                <label>1. 지역을 먼저 선택하세요</label>
                <select value={selectedDistrict} onChange={handleDistrictChange}>
                  {BUSAN_DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <div className="searchBox">
                <label>2. 먹고 싶은 메뉴를 선택하거나 검색하세요</label>
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

          <div className="heroArt">
            <div className="bubble one">🍜</div>
            <div className="bubble two">☕</div>
            <div className="bubble three">🍙</div>

            <div className="infoCard mainInfo">
              <span>선택 지역</span>
              <strong>{selectedDistrict}</strong>
              <p>착한가격업소 {storesByDistrict.length}곳</p>
            </div>

            <div className="infoCard subInfo">
              <span>최저가</span>
              <strong>
                {cheapest ? `${cheapest.priceNumber.toLocaleString()}원` : "메뉴 검색"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="summaryRow">
        <div className="summaryCard">
          <span>📍 선택 지역</span>
          <strong>{selectedDistrict}</strong>
        </div>
        <div className="summaryCard">
          <span>🏪 착한가격업소</span>
          <strong>{storesByDistrict.length}곳</strong>
        </div>
        <div className="summaryCard">
          <span>🍽️ 선택 메뉴</span>
          <strong>{selectedKeyword || "아직 선택 전"}</strong>
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
                <h2>
                  📍 {selectedDistrict} 착한가격업소
                </h2>
                <p className="sectionDesc">
                  지역을 선택하면 해당 지역의 착한가격업소를 먼저 보여드려요.
                  아래에는 최대 12개 업소가 표시됩니다.
                </p>
              </div>
            </div>

            {previewStores.length === 0 ? (
              <div className="stateBox">
                <div className="stateEmoji">🔍</div>
                <strong>해당 지역의 업소가 없어요</strong>
                <p>다른 지역을 선택해보세요.</p>
              </div>
            ) : (
              <div className="storeGrid">
                {previewStores.map((store, index) => {
                  const address = stripHtml(store?.adres);
                  const mapQuery = encodeURIComponent(`${store?.sj} ${address}`);

                  return (
                    <div className="storeCard" key={`${store?.sj}-${index}`}>
                      <div className="storeEmoji">{getStoreEmoji(store?.cn)}</div>
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
                  선택한 지역 안에서 메뉴 가격이 낮은 순서로 보여드려요.
                </p>
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

            <div className="statsGrid">
              <div className="statBox pink">
                <span>📦 검색 결과</span>
                <strong>{results.length}개</strong>
              </div>
              <div className="statBox mint">
                <span>💰 최저가</span>
                <strong>
                  {cheapest ? `${cheapest.priceNumber.toLocaleString()}원` : "-"}
                </strong>
              </div>
              <div className="statBox yellow">
                <span>📍 선택 지역</span>
                <strong>{selectedDistrict}</strong>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="stateBox">
                <div className="stateEmoji">🔍</div>
                <strong>검색 결과가 없어요</strong>
                <p>다른 메뉴명이나 지역으로 다시 검색해보세요.</p>
              </div>
            ) : (
              <div className="resultGrid">
                {results.map((item, index) => {
                  const store = item.store;
                  const address = stripHtml(store?.adres);
                  const mapQuery = encodeURIComponent(`${item.bsshNm} ${address}`);

                  return (
                    <div
                      className={index < 3 ? "resultCard topCard" : "resultCard"}
                      key={`${item.bsshNm}-${item.itemNm}-${index}`}
                    >
                      <div className="rankCorner">{getRankLabel(index)}</div>

                      <div className="pricePill">
                        {item.priceNumber.toLocaleString()}원
                      </div>

                      <div className="menuIcon">
                        {getMenuEmoji(item.itemNm)}
                      </div>

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
            )}
          </>
        )}
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(255, 201, 214, 0.34), transparent 25%),
            radial-gradient(circle at top right, rgba(186, 234, 232, 0.35), transparent 25%),
            linear-gradient(180deg, #fffdf8 0%, #f8fbff 100%);
          color: #24324a;
          font-family: "Pretendard", "Apple SD Gothic Neo", system-ui, sans-serif;
        }

        .topBar {
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(14px);
          background: rgba(255, 255, 255, 0.82);
          border-bottom: 1px solid rgba(227, 235, 242, 0.9);
        }

        .topInner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 16px 24px;
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
          border-radius: 18px;
          background: linear-gradient(135deg, #ffb6b9, #ffd8a8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          box-shadow: 0 12px 24px rgba(255, 182, 185, 0.35);
        }

        .brand strong {
          display: block;
          color: #183b56;
          font-size: 19px;
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
          border: 1px solid #e7edf4;
          color: #516173;
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
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 28px;
          align-items: center;
          padding: 36px;
          border-radius: 36px;
          background:
            radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.55), transparent 30%),
            linear-gradient(135deg, #c8f1ef 0%, #d9ecff 42%, #ffe6d8 100%);
          border: 1px solid rgba(255, 255, 255, 0.75);
          box-shadow: 0 24px 60px rgba(77, 104, 135, 0.12);
          overflow: hidden;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #f26b5e;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        h1 {
          margin: 0;
          color: #183b56;
          font-size: clamp(34px, 5vw, 56px);
          line-height: 1.15;
          letter-spacing: -2px;
          font-weight: 900;
        }

        .desc {
          margin: 18px 0 24px;
          max-width: 640px;
          color: #52616b;
          font-size: 17px;
          line-height: 1.7;
        }

        .stepPanel {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 14px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 28px;
          padding: 16px;
        }

        .selectBox label,
        .searchBox label {
          display: block;
          margin-bottom: 8px;
          color: #52616b;
          font-size: 13px;
          font-weight: 900;
        }

        .selectBox select,
        .searchRow input {
          width: 100%;
          border: none;
          outline: none;
          background: #ffffff;
          color: #24324a;
          padding: 15px 16px;
          border-radius: 17px;
          font-size: 15px;
          box-shadow: inset 0 0 0 1px #e7edf4;
        }

        .searchRow {
          display: grid;
          grid-template-columns: 1fr 86px;
          gap: 8px;
        }

        .searchRow button {
          border: none;
          background: linear-gradient(135deg, #183b56, #2d587d);
          color: #ffffff;
          border-radius: 17px;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
        }

        .quickMenus {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .quickMenus button {
          border: 1px solid #dceaf0;
          background: rgba(255, 255, 255, 0.85);
          color: #183b56;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(24, 59, 86, 0.05);
        }

        .quickMenus button span {
          margin-right: 6px;
        }

        .quickMenus button.selected,
        .quickMenus button:hover {
          background: linear-gradient(135deg, #ffdce2, #ffffff);
          border-color: #f6b4bf;
        }

        .heroArt {
          position: relative;
          min-height: 310px;
        }

        .bubble {
          position: absolute;
          width: 74px;
          height: 74px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.78);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          box-shadow: 0 16px 30px rgba(92, 113, 137, 0.12);
        }

        .one {
          top: 22px;
          left: 18px;
          transform: rotate(-8deg);
        }

        .two {
          top: 110px;
          right: 30px;
          transform: rotate(8deg);
        }

        .three {
          bottom: 20px;
          left: 54px;
          transform: rotate(-6deg);
        }

        .infoCard {
          position: absolute;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.95);
          border-radius: 30px;
          padding: 24px 22px;
          box-shadow: 0 20px 40px rgba(86, 107, 134, 0.15);
        }

        .mainInfo {
          right: 34px;
          top: 26px;
          width: 250px;
        }

        .subInfo {
          left: 72px;
          bottom: 28px;
          width: 210px;
        }

        .infoCard span {
          display: block;
          color: #7b8794;
          font-size: 13px;
          margin-bottom: 8px;
          font-weight: 800;
        }

        .infoCard strong {
          display: block;
          color: #183b56;
          font-size: 24px;
          margin-bottom: 8px;
        }

        .infoCard p {
          margin: 0;
          color: #f26b5e;
          font-size: 18px;
          font-weight: 900;
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
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid #e7edf4;
          border-radius: 22px;
          padding: 18px 20px;
          box-shadow: 0 14px 30px rgba(24, 59, 86, 0.06);
        }

        .summaryCard span {
          display: block;
          color: #7b8794;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .summaryCard strong {
          color: #183b56;
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
          color: #183b56;
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
          border: 1px solid #dce7ef;
          background: #ffffff;
          color: #52616b;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(24, 59, 86, 0.04);
        }

        .filters button.active {
          background: linear-gradient(135deg, #183b56, #345b7c);
          color: white;
          border-color: #183b56;
        }

        .stateBox {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e7edf4;
          border-radius: 30px;
          padding: 54px 28px;
          text-align: center;
          box-shadow: 0 18px 40px rgba(24, 59, 86, 0.07);
        }

        .stateEmoji {
          font-size: 44px;
          margin-bottom: 14px;
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

        .storeGrid,
        .resultGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .storeCard,
        .resultCard {
          position: relative;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e7edf4;
          border-radius: 28px;
          padding: 22px;
          box-shadow: 0 16px 34px rgba(24, 59, 86, 0.06);
          transition: 0.18s ease;
          overflow: hidden;
        }

        .storeCard:hover,
        .resultCard:hover {
          transform: translateY(-3px);
          box-shadow: 0 22px 42px rgba(24, 59, 86, 0.1);
        }

        .storeEmoji,
        .menuIcon {
          width: 54px;
          height: 54px;
          border-radius: 20px;
          background: linear-gradient(135deg, #dff7f6, #ffe9df);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
          margin-bottom: 16px;
        }

        .storeCard strong,
        .resultTitle strong {
          display: block;
          color: #183b56;
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
          background: #f3f8fb;
          color: #556474;
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
          background: #eaf6fa;
          color: #183b56;
          border-radius: 999px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 900;
        }

        .storeActions a:hover,
        .actionRow a:hover {
          background: #183b56;
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
          box-shadow: 0 14px 30px rgba(24, 59, 86, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.85);
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
          color: #183b56;
        }

        .pink {
          background: linear-gradient(135deg, #fff0f2, #ffffff);
        }

        .mint {
          background: linear-gradient(135deg, #effcf9, #ffffff);
        }

        .yellow {
          background: linear-gradient(135deg, #fff8e7, #ffffff);
        }

        .topCard {
          background: linear-gradient(135deg, #fff8f4, #ffffff);
          border-color: #ffd7c8;
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
          box-shadow: 0 10px 24px rgba(242, 107, 94, 0.24);
        }

        .pricePill {
          position: absolute;
          top: 18px;
          right: 18px;
          background: #183b56;
          color: white;
          padding: 9px 14px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 900;
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
          .heroCard {
            grid-template-columns: 1fr;
          }

          .heroArt {
            display: none;
          }

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

          h1 {
            font-size: 34px;
          }

          h2 {
            font-size: 27px;
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
