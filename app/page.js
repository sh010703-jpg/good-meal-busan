"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [menus, setMenus] = useState([]);
  const [stores, setStores] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedKeyword, setSelectedKeyword] = useState("");
  const [selectedLocale, setSelectedLocale] = useState("전체");
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

  const localeOptions = useMemo(() => {
    const locales = stores
      .map((store) => stripHtml(store?.locale))
      .filter(Boolean);

    return ["전체", ...Array.from(new Set(locales)).sort((a, b) => a.localeCompare(b, "ko"))];
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
        if (selectedLocale === "전체") return true;
        return stripHtml(item.store?.locale) === selectedLocale;
      })
      .filter((item) => {
        if (priceLimit === "all") return true;
        return item.priceNumber <= Number(priceLimit);
      })
      .sort((a, b) => a.priceNumber - b.priceNumber)
      .slice(0, 60);
  }, [menus, selectedKeyword, selectedLocale, priceLimit, storeMap]);

  const cheapest = results[0];

  function handleSearch() {
    setSelectedKeyword(keyword.trim());
  }

  function handleQuickSearch(word) {
    setKeyword(word);
    setSelectedKeyword(word);
  }

  function getRankEmoji(index) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "🍽️";
  }

  return (
    <main className="page">
      <header className="topBar">
        <div className="topInner">
          <div className="brand">
            <div className="brandIcon">🍚</div>
            <div>
              <strong>착한한끼 부산</strong>
              <span>부산 착한가격업소 메뉴 가격 비교</span>
            </div>
          </div>

          <div className="headerTags">
            <span>📍 부산</span>
            <span>💸 가격비교</span>
            <span>🗺️ 지도연결</span>
          </div>
        </div>
      </header>

      <section className="heroWrap">
        <div className="heroCard">
          <div className="heroText">
            <p className="eyebrow">공공데이터 기반 생활물가 비교 서비스</p>
            <h1>
              🍱 오늘의 착한 한 끼,
              <br />
              가격부터 비교해보세요
            </h1>
            <p className="desc">
              부산 착한가격업소의 메뉴 가격을 검색하고,
              지역별로 골라보며 가장 저렴한 한 끼를 찾아보세요.
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

              <div className="optionRow">
                <div className="selectWrap">
                  <label>📍 지역 선택</label>
                  <select
                    value={selectedLocale}
                    onChange={(e) => setSelectedLocale(e.target.value)}
                  >
                    {localeOptions.map((locale) => (
                      <option key={locale} value={locale}>
                        {locale}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cuteBadgeWrap">
                  <span className="cuteBadge">💡 가격 낮은 순</span>
                  <span className="cuteBadge">🌊 부산 착한가격업소</span>
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
            <div className="artBubble bubble1">🍜</div>
            <div className="artBubble bubble2">☕</div>
            <div className="artBubble bubble3">🍙</div>

            <div className="miniCard">
              <div className="miniCardIcon">💸</div>
              <strong>오늘의 최저가</strong>
              <span>
                {cheapest
                  ? `${cheapest.priceNumber.toLocaleString()}원`
                  : "검색해보세요"}
              </span>
            </div>

            <div className="miniCard second">
              <div className="miniCardIcon">📍</div>
              <strong>선택 지역</strong>
              <span>{selectedLocale}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="summaryRow">
        <div className="summaryCard">
          <span>🔎 검색 기준</span>
          <strong>{selectedKeyword || "메뉴를 검색해보세요"}</strong>
        </div>
        <div className="summaryCard">
          <span>📍 지역</span>
          <strong>{selectedLocale}</strong>
        </div>
        <div className="summaryCard">
          <span>💰 최저가</span>
          <strong>{cheapest ? `${cheapest.priceNumber.toLocaleString()}원` : "-"}</strong>
        </div>
      </section>

      <section className="content">
        <div className="contentTop">
          <div>
            <p className="sectionLabel">PRICE RANKING</p>
            <h2>{selectedKeyword ? `🍽️ ${selectedKeyword} 검색 결과` : "메뉴를 검색해보세요"}</h2>
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
            <div className="stateEmoji">🐣</div>
            <strong>메뉴 정보를 불러오는 중이에요</strong>
            <p>조금만 기다려주세요!</p>
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
          <div className="guideGrid">
            <div className="guideCard">
              <div className="guideIcon">🍚</div>
              <strong>메뉴 검색</strong>
              <p>국밥, 김밥, 커피처럼 원하는 메뉴를 입력해보세요.</p>
            </div>
            <div className="guideCard">
              <div className="guideIcon">💸</div>
              <strong>가격 비교</strong>
              <p>검색 결과를 가격 낮은 순으로 편하게 비교할 수 있어요.</p>
            </div>
            <div className="guideCard">
              <div className="guideIcon">🗺️</div>
              <strong>위치 확인</strong>
              <p>지도 보기 버튼으로 업소 위치도 바로 확인할 수 있어요.</p>
            </div>
          </div>
        )}

        {!loading && !error && selectedKeyword && (
          <>
            <div className="statsGrid">
              <div className="statBox pink">
                <span>📦 검색 결과</span>
                <strong>{results.length}개</strong>
              </div>
              <div className="statBox mint">
                <span>💰 최저가</span>
                <strong>{cheapest ? `${cheapest.priceNumber.toLocaleString()}원` : "-"}</strong>
              </div>
              <div className="statBox yellow">
                <span>📍 선택 지역</span>
                <strong>{selectedLocale}</strong>
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
                  const address = store?.adres || "";
                  const mapQuery = encodeURIComponent(`${item.bsshNm} ${address}`);

                  return (
                    <div
                      className={index < 3 ? "resultCard topCard" : "resultCard"}
                      key={`${item.bsshNm}-${item.itemNm}-${index}`}
                    >
                      <div className="cardTop">
                        <div className="rankBadge">
                          <span>{getRankEmoji(index)}</span>
                          <strong>{index + 1}</strong>
                        </div>

                        <div className="priceBadge">
                          {item.priceNumber.toLocaleString()}원
                        </div>
                      </div>

                      <div className="storeTitle">
                        <strong>{item.bsshNm}</strong>
                        <em>{item.itemNm}</em>
                      </div>

                      <div className="infoChips">
                        {store?.locale && <span>📍 {stripHtml(store.locale)}</span>}
                        {store?.bsnTime && <span>⏰ {stripHtml(store.bsnTime)}</span>}
                        {store?.parkngAt && (
                          <span>{store.parkngAt === "Y" ? "🚗 주차 가능" : "🚫 주차 정보 없음"}</span>
                        )}
                      </div>

                      {address && <p className="addressText">{stripHtml(address)}</p>}

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
            radial-gradient(circle at top left, rgba(255, 201, 214, 0.35), transparent 24%),
            radial-gradient(circle at top right, rgba(183, 232, 230, 0.35), transparent 24%),
            linear-gradient(180deg, #fffdf8 0%, #f8fbff 100%);
          color: #24324a;
          font-family: "Pretendard", "Apple SD Gothic Neo", system-ui, sans-serif;
        }

        .topBar {
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(14px);
          background: rgba(255, 255, 255, 0.78);
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
          grid-template-columns: 1.2fr 0.8fr;
          gap: 28px;
          align-items: center;
          padding: 38px;
          border-radius: 36px;
          background:
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.55), transparent 30%),
            linear-gradient(135deg, #c8f1ef 0%, #d9ecff 42%, #ffe6d8 100%);
          border: 1px solid rgba(255, 255, 255, 0.75);
          box-shadow: 0 24px 60px rgba(77, 104, 135, 0.12);
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
          font-size: clamp(34px, 5vw, 58px);
          line-height: 1.15;
          letter-spacing: -2px;
          font-weight: 900;
        }

        .desc {
          margin: 18px 0 26px;
          max-width: 640px;
          color: #52616b;
          font-size: 17px;
          line-height: 1.7;
        }

        .searchPanel {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 28px;
          padding: 16px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .searchBox {
          display: flex;
          gap: 10px;
        }

        .searchBox input {
          flex: 1;
          border: none;
          outline: none;
          background: #ffffff;
          color: #24324a;
          padding: 16px 18px;
          border-radius: 18px;
          font-size: 16px;
          box-shadow: inset 0 0 0 1px #e7edf4;
        }

        .searchBox button {
          border: none;
          background: linear-gradient(135deg, #183b56, #2d587d);
          color: #ffffff;
          padding: 0 28px;
          border-radius: 18px;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .optionRow {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 14px;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .selectWrap {
          min-width: 230px;
        }

        .selectWrap label {
          display: block;
          margin-bottom: 8px;
          color: #52616b;
          font-size: 13px;
          font-weight: 800;
        }

        .selectWrap select {
          width: 100%;
          border: 1px solid #e2eaf2;
          background: #ffffff;
          color: #24324a;
          border-radius: 16px;
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
        }

        .cuteBadgeWrap {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cuteBadge {
          background: #ffffff;
          color: #506174;
          border: 1px dashed #d6e3ee;
          border-radius: 999px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 800;
        }

        .quickMenus {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .quickMenus button {
          border: 1px solid #dceaf0;
          background: rgba(255, 255, 255, 0.82);
          color: #183b56;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 800;
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
          min-height: 300px;
        }

        .artBubble {
          position: absolute;
          width: 76px;
          height: 76px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.78);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          box-shadow: 0 16px 30px rgba(92, 113, 137, 0.12);
        }

        .bubble1 {
          top: 20px;
          left: 10px;
          transform: rotate(-8deg);
        }

        .bubble2 {
          top: 118px;
          right: 28px;
          transform: rotate(8deg);
        }

        .bubble3 {
          bottom: 26px;
          left: 38px;
          transform: rotate(-6deg);
        }

        .miniCard {
          position: absolute;
          right: 24px;
          top: 20px;
          width: 250px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.95);
          border-radius: 30px;
          padding: 26px 22px;
          box-shadow: 0 20px 40px rgba(86, 107, 134, 0.15);
        }

        .miniCard.second {
          top: auto;
          bottom: 24px;
          left: 90px;
          right: auto;
        }

        .miniCardIcon {
          width: 48px;
          height: 48px;
          border-radius: 18px;
          background: linear-gradient(135deg, #ffe5e8, #fff2d9);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 14px;
        }

        .miniCard strong {
          display: block;
          color: #183b56;
          font-size: 20px;
          margin-bottom: 8px;
        }

        .miniCard span {
          color: #f26b5e;
          font-size: 22px;
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
          background: rgba(255, 255, 255, 0.84);
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
          letter-spacing: 0.08em;
        }

        h2 {
          margin: 0;
          color: #183b56;
          font-size: 32px;
          letter-spacing: -1px;
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

        .guideGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .guideCard {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #e7edf4;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 16px 34px rgba(24, 59, 86, 0.06);
        }

        .guideIcon {
          width: 52px;
          height: 52px;
          border-radius: 18px;
          background: linear-gradient(135deg, #dff7f6, #ffe9df);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          margin-bottom: 16px;
        }

        .guideCard strong {
          display: block;
          color: #183b56;
          font-size: 20px;
          margin-bottom: 8px;
        }

        .guideCard p {
          margin: 0;
          color: #52616b;
          line-height: 1.6;
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

        .resultGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .resultCard {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e7edf4;
          border-radius: 28px;
          padding: 22px;
          box-shadow: 0 16px 34px rgba(24, 59, 86, 0.06);
          transition: 0.18s ease;
        }

        .resultCard:hover {
          transform: translateY(-3px);
          box-shadow: 0 22px 42px rgba(24, 59, 86, 0.1);
        }

        .topCard {
          background: linear-gradient(135deg, #fff8f4, #ffffff);
          border-color: #ffd7c8;
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .rankBadge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f4f9fc;
          border-radius: 999px;
          padding: 8px 12px;
          color: #183b56;
          font-weight: 900;
        }

        .priceBadge {
          background: linear-gradient(135deg, #f26b5e, #ff9a6a);
          color: white;
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 900;
        }

        .storeTitle strong {
          display: block;
          color: #183b56;
          font-size: 21px;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .storeTitle em {
          font-style: normal;
          color: #f26b5e;
          font-size: 15px;
          font-weight: 900;
        }

        .infoChips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .infoChips span {
          background: #f3f8fb;
          color: #556474;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 13px;
          font-weight: 700;
        }

        .addressText {
          margin: 14px 0 0;
          color: #7b8794;
          font-size: 14px;
          line-height: 1.6;
        }

        .actionRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .actionRow a {
          text-decoration: none;
          background: #eaf6fa;
          color: #183b56;
          border-radius: 999px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 900;
        }

        .actionRow a:hover {
          background: #183b56;
          color: white;
        }

        @media (max-width: 920px) {
          .heroCard {
            grid-template-columns: 1fr;
            padding: 28px;
          }

          .heroArt {
            min-height: 220px;
          }

          .miniCard.second {
            left: 24px;
          }

          .summaryRow,
          .statsGrid,
          .guideGrid,
          .resultGrid {
            grid-template-columns: 1fr;
          }

          .contentTop {
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

          .heroWrap,
          .content {
            padding-left: 16px;
            padding-right: 16px;
          }

          .searchBox {
            flex-direction: column;
          }

          .searchBox button {
            padding: 15px;
          }

          .optionRow {
            flex-direction: column;
            align-items: stretch;
          }

          .heroArt {
            display: none;
          }

          h1 {
            font-size: 34px;
          }

          h2 {
            font-size: 28px;
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
