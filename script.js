document.addEventListener("DOMContentLoaded", async () => {
  const calendarEl = document.getElementById("calendar");
  const prevBtn = document.getElementById("prevWeek");
  const nextBtn = document.getElementById("nextWeek");

    let holidayDates = [];

  const startHour = 10;
  const endHour = 18;
  let weekOffset = 0;

    const loadingOverlay = document.getElementById("loadingOverlay");

    function showLoading() {
      loadingOverlay.style.display = "block";
    }

    function hideLoading() {
      loadingOverlay.style.display = "none";
    }

    async function fetchHolidayDates() {
  try {
    const res = await fetch("/api/holiday");
    const result = await res.json();
    holidayDates = result.holidays || [];
  } catch (err) {
    console.error("祝日一覧の取得失敗:", err);
  }
}

  showLoading();

  function generateDates(offset) {
  const today = new Date();
  const currentDay = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - currentDay + offset * 7);

  return [...Array(7)].map((_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const day = d.getDay();

    const dayClass = holidayDates.includes(dateStr)
      ? "holiday"
      : day === 0 ? "sunday"
      : day === 6 ? "saturday"
      : "";

    return {
      date: dateStr,
      label: `${d.getMonth() + 1}/${d.getDate()}<br>(${["日","月","火","水","木","金","土"][day]})`,
      dayClass
    };
  });
}

  function generateHours() {
  return [...Array(endHour - startHour + 1)].map((_, i) => {
    const h = startHour + i;
    return `${h.toString().padStart(2, "0")}:00`; // ← "10:00" 形式で返す
  });
}

  async function renderCalendar() {   

  showLoading();
  await new Promise(requestAnimationFrame);

    calendarEl.innerHTML = "";
    const todayStr = new Date().toISOString().split("T")[0]; // ← renderCalendarの最初に1回だけ
    const maxDate = new Date();
    maxDate.setDate(new Date().getDate()+40);
    const maxDateStr = maxDate.toISOString().split("T")[0];
    const dates = generateDates(weekOffset);
    const hours = generateHours();
    const dateSet = new Set(dates.map(d => d.date));

    let availableSlots = [];        

    try {
      const response = await fetch(`/api/calendar-ava`);
      const result = await response.json();
      availableSlots = result.slots || [];
      console.log("availableSlots:",availableSlots);
    }catch (err){
      console.error("API取得失敗:", err);      
    }    

     // slotMapに「予約済み枠」だけを記録
    const slotMap = new Set();
      availableSlots.forEach(slot => {
        if (dateSet.has(slot.date)) {
        slotMap.add(`${slot.date}_${slot.time}`);
      }
    });    

    const table = document.createElement("table");

    // ヘッダー行（曜日ラベル）
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.appendChild(document.createElement("th")); // 時間列の空白

    dates.forEach(d => {
  const th = document.createElement("th");
  th.innerHTML = d.label;
  if (d.dayClass) th.classList.add(d.dayClass); // ← ここに変更！
  headerRow.appendChild(th);
});

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 本体   

    const tbodyFragment = document.createDocumentFragment();

    hours.forEach(hour => {
      const row = document.createElement("tr");
      const timeCell = document.createElement("td");
      timeCell.textContent = hour;
      row.appendChild(timeCell);

  dates.forEach(d => {
    const cell = document.createElement("td");
    if (d.dayClass) cell.classList.add(d.dayClass);
    
    const isReserved = slotMap.has(`${d.date}_${hour}`);
    const isAvailable = !isReserved;
    const isWithinLimit = d.date <= maxDateStr;
    const isPast = d.date < todayStr;    

    if (!isWithinLimit || isPast) {
      cell.textContent = "×";
      cell.classList.add("unavailable");
    } else if (isAvailable) {
      cell.textContent = "◎";
      cell.classList.add("available");
      cell.dataset.date = d.date;
      cell.dataset.time = hour;
    } else {
      cell.textContent = "×";
      cell.classList.add("unavailable");
    }

    row.appendChild(cell);
  });

      tbodyFragment.appendChild(row);
    });

    const tbody = document.createElement("tbody");
    tbody.appendChild(tbodyFragment);
    table.appendChild(tbody);     
    calendarEl.appendChild(table);

    hideLoading();
}

  await fetchHolidayDates(); // ← 祝日一覧を取得
  await renderCalendar();    // ← その後に描画

  calendarEl.addEventListener("click", (e) => {
  const cell = e.target.closest("td.available");
  if (!cell) return;

  const date = cell.dataset.date;
  const time = cell.dataset.time;
  const todayStr = new Date().toISOString().split("T")[0];

  if (date === todayStr) {
    alert("【本日の予約は直接店舗へお電話にてお問い合わせ下さい】");
  } else {
    const url = new URL("https://yoyaku-form.vercel.app/");
    url.searchParams.set("date", date);
    url.searchParams.set("time", time);
    window.location.href = url.toString();
  }
});

  // ボタンイベント
  prevBtn.addEventListener("click", () => {
    weekOffset--;
    renderCalendar();
  });

  nextBtn.addEventListener("click", () => {
    weekOffset++;
    renderCalendar();
  });
});