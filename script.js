// デバッグモード
const DEBUG = true;

function debug(...args) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

// 祝日APIから日本の祝日データを取得
let holidayData = {};
fetch('https://holidays-jp.github.io/api/v1/date.json')
  .then(response => response.json())
  .then(data => { 
    holidayData = data;
    debug('祝日データ取得成功:', Object.keys(data).length, '件');
  })
  .catch(error => console.error("祝日データの取得に失敗しました:", error));

// 部屋タイプごとの定員と料金設定
const roomConfigs = {
  // グループ宿泊用の部屋
  group: {
    sakuhou: { name: "2F 作法室", capacity: 25, fee: 20000 },
    hifuku: { name: "3F 被服室", capacity: 35, fee: 20000 },
    shicho: { name: "3F 視聴覚室", capacity: 21, fee: 13000 },
    tosho: { name: "3F 図書室", capacity: 10, fee: 8000 }
  },
  // 個室
  individual: {
    class1_1: { name: "1年1組(2F)", capacity: 5, fee: 7000 },
    class1_2: { name: "1年2組(2F)", capacity: 5, fee: 7000 },
    class2_1: { name: "2年1組(2F)", capacity: 5, fee: 6000 },
    class2_2: { name: "2年2組(2F)", capacity: 5, fee: 6000 },
    class2_3: { name: "2年3組(2F)", capacity: 5, fee: 6000 },
    class3_1: { name: "3年1組(3F)", capacity: 5, fee: 5000 },
    class3_2: { name: "3年2組(3F)", capacity: 5, fee: 5000 },
    class3_3: { name: "3年3組(3F)", capacity: 5, fee: 5000 }
  }
};

// 個人料金設定
const individualFees = {
  group: {
    regular: {
      adult: { weekday: 4800, holiday: 5850 },
      student: { weekday: 4000, holiday: 4900 },
      elementary: { weekday: 3200, holiday: 3900 },
      preschool: { weekday: 2500, holiday: 3000 }
    },
    seasonal: {
      adult: { weekday: 5500, holiday: 6750 },
      student: { weekday: 4600, holiday: 5600 },
      elementary: { weekday: 3700, holiday: 4500 },
      preschool: { weekday: 2900, holiday: 3450 }
    }
  },
  individual: {
    regular: {
      adult: { weekday: 8500, holiday: 10300 },
      adultAccompany: { weekday: 6800, holiday: 8200 },
      student: { weekday: 5900, holiday: 7200 },
      elementary: { weekday: 5000, holiday: 6200 },
      preschool: { weekday: 4200, holiday: 5200 }
    },
    seasonal: {
      adult: { weekday: 9800, holiday: 11800 },
      adultAccompany: { weekday: 7800, holiday: 9450 },
      student: { weekday: 6800, holiday: 8300 },
      elementary: { weekday: 5800, holiday: 7200 },
      preschool: { weekday: 4800, holiday: 6000 }
    }
  }
};

// 施設利用料金設定
const facilityFees = {
  meetingRoom: { hourly: 2000 },
  gym: { hourly: 3000 }
};

// 食事オプション料金
const mealFees = {
  breakfast: 700,
  dinner: 1000,
  bbq: 2200
};

// シーズン料金の月設定
const seasonalMonths = [3, 4, 5, 7, 8, 9, 12];
const seasonalRate = 1.2; // シーズン期間は20%増
const taxRate = 1.1; // 消費税10%

// 最大収容人数
const MAX_GROUP_CAPACITY = 200; // グループ利用の最大人数
const MAX_INDIVIDUAL_CAPACITY = 50; // 個室利用の最大人数

// DOMContentLoadedイベントで初期化
document.addEventListener('DOMContentLoaded', function() {
  debug('ページ読み込み完了');

  // 初期日付の設定
  const today = new Date();
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);

  document.getElementById('checkinDate').value = today.toISOString().split('T')[0];
  document.getElementById('checkoutDate').value = threeDaysLater.toISOString().split('T')[0];

  // グループ宿泊の初期値設定（合計10人）
  document.getElementById('groupAdult').value = "4";
  document.getElementById('groupStudent').value = "3";
  document.getElementById('groupElementary').value = "2";
  document.getElementById('groupPreschool').value = "1";

  // 個室利用の初期値設定（合計5人）
  document.getElementById('individualAdult').value = "2";
  document.getElementById('individualAdultAccompany').value = "1";
  document.getElementById('individualStudent').value = "1";
  document.getElementById('individualElementary').value = "1";
  document.getElementById('individualPreschool').value = "0";

  // タブ切り替えの制御
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      debug('タブ切り替え:', tabId);
      
      // タブボタンのアクティブ状態を切り替え
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
      
      // タブコンテンツの表示を切り替え
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });

  // 施設利用のチェックボックスと時間入力の連動
  document.getElementById('meetingRoomOption').addEventListener('change', function() {
    const timeInput = document.getElementById('meetingRoomTime');
    timeInput.style.display = this.checked ? 'flex' : 'none';
    if (!this.checked) {
      document.getElementById('meetingRoomHours').value = 2;
    }
    debug('会議室オプション:', this.checked);
  });

  document.getElementById('gymOption').addEventListener('change', function() {
    const timeInput = document.getElementById('gymTime');
    timeInput.style.display = this.checked ? 'flex' : 'none';
    if (!this.checked) {
      document.getElementById('gymHours').value = 1;
    }
    debug('体育館オプション:', this.checked);
  });

  // 時間入力の制限
  document.getElementById('meetingRoomHours').addEventListener('input', function() {
    const value = parseInt(this.value) || 0;
    if (value < 1) this.value = 1;
    if (value > 12) this.value = 12;
    debug('会議室時間:', this.value);
  });

  document.getElementById('gymHours').addEventListener('input', function() {
    const value = parseInt(this.value) || 0;
    if (value < 1) this.value = 1;
    if (value > 12) this.value = 12;
    debug('体育館時間:', this.value);
  });

  // 計算ボタンのクリックイベント
  const calculateButton = document.getElementById('calculateButton');
  debug('計算ボタン要素:', calculateButton);

  calculateButton.addEventListener('click', function() {
    debug('計算ボタンがクリックされました');

    try {
      // 入力値の取得
      const checkin = document.getElementById('checkinDate').value;
      const checkout = document.getElementById('checkoutDate').value;

      // グループ利用者数の取得
      const groupAdult = parseInt(document.getElementById('groupAdult').value) || 0;
      const groupStudent = parseInt(document.getElementById('groupStudent').value) || 0;
      const groupElementary = parseInt(document.getElementById('groupElementary').value) || 0;
      const groupPreschool = parseInt(document.getElementById('groupPreschool').value) || 0;
      const totalGroup = groupAdult + groupStudent + groupElementary + groupPreschool;

      debug('グループ利用者数:', {
        adult: groupAdult,
        student: groupStudent,
        elementary: groupElementary,
        preschool: groupPreschool,
        total: totalGroup
      });

      // 個室利用者数の取得
      const individualAdult = parseInt(document.getElementById('individualAdult').value) || 0;
      const individualAdultAccompany = parseInt(document.getElementById('individualAdultAccompany').value) || 0;
      const individualStudent = parseInt(document.getElementById('individualStudent').value) || 0;
      const individualElementary = parseInt(document.getElementById('individualElementary').value) || 0;
      const individualPreschool = parseInt(document.getElementById('individualPreschool').value) || 0;
      const totalIndividual = individualAdult + individualAdultAccompany + individualStudent + individualElementary + individualPreschool;

      debug('個室利用者数:', {
        adult: individualAdult,
        adultAccompany: individualAdultAccompany,
        student: individualStudent,
        elementary: individualElementary,
        preschool: individualPreschool,
        total: totalIndividual
      });

      // 入力値の検証
      const errors = validateInput(checkin, checkout, totalGroup, totalIndividual);
      if (errors.length > 0) {
        const resultElement = document.getElementById('result');
        resultElement.innerHTML = `
          <div class="error-message">
            <ul>${errors.map(error => `<li>${error}</li>`).join('')}</ul>
          </div>
        `;
        resultElement.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // 日付配列の取得と日数カウント
      const dateArray = getDateArray(checkin, checkout);
      let weekdayCount = 0, holidayCount = 0;
      const isSeasonalPeriod = dateArray.some(date => seasonalMonths.includes(new Date(date).getMonth() + 1));
      
      dateArray.forEach(dateStr => {
        if (getDayType(dateStr) === "holiday") {
          holidayCount++;
        } else {
          weekdayCount++;
        }
      });
      const totalDays = weekdayCount + holidayCount;

      debug('日程情報:', {
        weekdayCount,
        holidayCount,
        totalDays,
        isSeasonalPeriod
      });

      // 施設利用料金計算
      const meetingRoomHours = document.getElementById('meetingRoomOption').checked ? 
        parseInt(document.getElementById('meetingRoomHours').value) || 0 : 0;
      const gymHours = document.getElementById('gymOption').checked ? 
        parseInt(document.getElementById('gymHours').value) || 0 : 0;

      const meetingRoomTotal = meetingRoomHours * facilityFees.meetingRoom.hourly;
      const gymTotal = gymHours * facilityFees.gym.hourly;
      const facilityTotal = meetingRoomTotal + gymTotal;

      debug('施設利用料金:', {
        meetingRoomHours,
        gymHours,
        meetingRoomTotal,
        gymTotal,
        facilityTotal
      });

      // 食事オプション料金計算
      const totalPeople = totalGroup + totalIndividual;
      const hasBreakfast = document.getElementById('breakfastOption').checked;
      const hasDinner = document.getElementById('dinnerOption').checked;
      const hasBBQ = document.getElementById('bbqOption').checked;

      const breakfastTotal = hasBreakfast ? totalPeople * mealFees.breakfast * totalDays : 0;
      const dinnerTotal = hasDinner ? totalPeople * mealFees.dinner * totalDays : 0;
      const bbqTotal = hasBBQ ? totalPeople * mealFees.bbq : 0;
      const mealTotal = breakfastTotal + dinnerTotal + bbqTotal;

      debug('食事オプション料金:', {
        hasBreakfast,
        hasDinner,
        hasBBQ,
        breakfastTotal,
        dinnerTotal,
        bbqTotal,
        mealTotal
      });

      // 見積もり計算
      const data = {
        checkin,
        checkout,
        totalGroup,
        groupAdult,
        groupStudent,
        groupElementary,
        groupPreschool,
        totalIndividual,
        individualAdult,
        individualAdultAccompany,
        individualStudent,
        individualElementary,
        individualPreschool,
        meetingRoomHours,
        gymHours,
        hasBreakfast,
        hasDinner,
        hasBBQ
      };

      const result = calculateEstimate(data);

      // 結果の表示
      const resultElement = document.getElementById('result');
      resultElement.innerHTML = generateResultHTML(result);
      resultElement.scrollIntoView({ behavior: 'smooth' });
      debug('結果表示完了');

    } catch (error) {
      console.error('計算処理でエラーが発生しました:', error);
      const resultElement = document.getElementById('result');
      resultElement.innerHTML = `
        <div class="error-message">
          <p>計算処理でエラーが発生しました。</p>
          <p>エラー内容: ${error.message}</p>
        </div>
      `;
      resultElement.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // チェックイン・チェックアウト日の変更イベントリスナー
  document.getElementById('checkinDate').addEventListener('change', function() {
    const checkin = this.value;
    const checkout = document.getElementById('checkoutDate').value;
    if (checkin && checkout) {
      updateStayDuration(checkin, checkout);
    }
  });

  document.getElementById('checkoutDate').addEventListener('change', function() {
    const checkin = document.getElementById('checkinDate').value;
    const checkout = this.value;
    if (checkin && checkout) {
      updateStayDuration(checkin, checkout);
    }
  });
});

/**
 * 日付配列を取得する関数
 */
function getDateArray(startDate, endDate) {
  const dates = [];
  const dt = new Date(startDate);
  const end = new Date(endDate);
  while (dt < end) {
    dates.push(dt.toISOString().split('T')[0]);
    dt.setDate(dt.getDate() + 1);
  }
  return dates;
}

/**
 * 日付の種類を判定する関数
 */
function getDayType(dateString) {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = holidayData[dateString];
  return (isWeekend || isHoliday) ? "holiday" : "weekday";
}

/**
 * シーズン期間かどうかを判定する関数
 */
function isSeasonalPeriod(dateString) {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  return seasonalMonths.includes(month);
}

/**
 * 金額をフォーマットする関数
 */
function formatPrice(price) {
  return price.toLocaleString() + '円';
}

function formatQuantity(quantity, nights, type = '') {
  if (type === 'room') {
    return `${quantity}室 × ${nights}泊`;
  }
  return `${quantity}人 × ${nights}泊`;
}

/**
 * 平均単価を計算する関数
 */
function calculateAveragePrice(regularPrice, seasonalPrice) {
  return Math.round((regularPrice + seasonalPrice) / 2);
}

/**
 * 最適な部屋の組み合わせを計算する関数
 */
function calculateOptimalRooms(totalPeople) {
  const assignment = {};
  let remainingPeople = totalPeople;
  
  // 部屋を定員の大きい順にソート
  const sortedRooms = Object.entries(roomConfigs.group)
    .sort((a, b) => b[1].capacity - a[1].capacity);
  
  // 最初に大きい部屋から埋めていく
  for (const [type, room] of sortedRooms) {
    if (remainingPeople <= 0) break;
    
    // この部屋タイプで何室必要か計算
    const neededRooms = Math.ceil(remainingPeople / room.capacity);
    const maxRoomsForType = Math.min(neededRooms, Math.ceil(remainingPeople / 5)); // 1部屋最低5名以上
    
    if (maxRoomsForType > 0) {
      assignment[type] = maxRoomsForType;
      remainingPeople -= maxRoomsForType * room.capacity;
    }
  }
  
  // 残りの人数が少ない場合、小さい部屋に再配分
  if (remainingPeople > 0) {
    const smallestRoom = sortedRooms[sortedRooms.length - 1];
    const additionalRooms = Math.ceil(remainingPeople / smallestRoom[1].capacity);
    assignment[smallestRoom[0]] = (assignment[smallestRoom[0]] || 0) + additionalRooms;
  }
  
  return assignment;
}

/**
 * 入力値の検証を行う関数
 */
function validateInput(checkin, checkout, totalGroup, totalIndividual) {
  const errors = [];
  debug('入力値の検証開始');
  debug('- チェックイン:', checkin);
  debug('- チェックアウト:', checkout);
  debug('- グループ人数:', totalGroup);
  debug('- 個室人数:', totalIndividual);
  
  // 日付の検証
  if (!checkin || !checkout) {
    errors.push("チェックイン日とチェックアウト日を入力してください。");
  } else {
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkinDate < today) {
      errors.push("チェックイン日は今日以降の日付を選択してください。");
    }
    if (checkoutDate <= checkinDate) {
      errors.push("チェックアウト日はチェックイン日の翌日以降を選択してください。");
    }
  }

  // 利用人数の検証
  if (totalGroup === 0 && totalIndividual === 0) {
    errors.push("利用人数を入力してください。");
  }

  // グループ利用人数の検証
  if (totalGroup > MAX_GROUP_CAPACITY) {
    errors.push(`グループ利用の最大人数は${MAX_GROUP_CAPACITY}名までです。`);
  }

  // 個室利用人数の検証
  if (totalIndividual > MAX_INDIVIDUAL_CAPACITY) {
    errors.push(`個室利用の最大人数は${MAX_INDIVIDUAL_CAPACITY}名までです。`);
  }

  // 個室の定員チェック
  if (totalIndividual > 0) {
    const requiredRooms = Math.ceil(totalIndividual / 5);
    if (totalIndividual > requiredRooms * 5) {
      errors.push(`個室の定員を超えています。必要な個室数: ${requiredRooms}室`);
    }
  }

  debug('検証エラー:', errors);
  return errors;
}

/**
 * 見積もり結果のHTML生成
 */
function generateResultHTML(data) {
  return `
    <div class="result-container">
      <h3>見積り結果</h3>
      <div class="result-section">
        <h4>利用日程</h4>
        <p>チェックイン: ${data.checkin}</p>
        <p>チェックアウト: ${data.checkout}</p>
        <p>宿泊日数: ${data.totalDays}日</p>
      </div>
      <div class="result-section">
        <table class="price-table">
          <thead>
            <tr>
              <th>項目</th>
              <th>数量</th>
              <th>単価</th>
              <th class="text-right">小計</th>
            </tr>
          </thead>
          <tbody>
            ${data.groupTotal > 0 ? `
              <tr class="category">
                <td colspan="4">グループ宿泊</td>
              </tr>
              ${Object.entries(data.roomAssignment || {}).map(([type, count]) => {
                const room = roomConfigs.group[type];
                const quantity = `${count}室 × ${data.totalDays}泊`;
                const unitPrice = room.fee;
                const subtotal = count * data.totalDays * unitPrice;
                return `
                  <tr>
                    <td class="item">${room.name}</td>
                    <td class="quantity">${quantity}</td>
                    <td class="unit-price">${formatPrice(unitPrice)}</td>
                    <td class="text-right">${formatPrice(subtotal)}</td>
                  </tr>
                `;
              }).join('')}
              ${data.groupAdult > 0 ? `
                <tr>
                  <td class="item">大人</td>
                  <td class="quantity">${data.groupAdult}人 × ${data.totalDays}泊</td>
                  <td class="unit-price">${formatPrice(calculateAveragePrice(
                    individualFees.group.regular.adult.weekday,
                    individualFees.group.seasonal.adult.weekday
                  ))}</td>
                  <td class="text-right">${formatPrice(data.groupAdult * data.totalDays * data.groupAdultFee)}</td>
                </tr>
              ` : ''}
              ${generatePriceRow('中・高/大学生', data.groupStudent, data.totalDays, 
                calculateAveragePrice(
                  individualFees.group.regular.student.weekday,
                  individualFees.group.seasonal.student.weekday
                ), data.groupStudentFee)}
              ${generatePriceRow('小学生', data.groupElementary, data.totalDays,
                calculateAveragePrice(
                  individualFees.group.regular.elementary.weekday,
                  individualFees.group.seasonal.elementary.weekday
                ), data.groupElementaryFee)}
              ${generatePriceRow('未就学児', data.groupPreschool, data.totalDays,
                calculateAveragePrice(
                  individualFees.group.regular.preschool.weekday,
                  individualFees.group.seasonal.preschool.weekday
                ), data.groupPreschoolFee)}
            ` : ''}
            ${data.individualTotal > 0 ? `
              <tr class="category">
                <td colspan="4">個室利用</td>
              </tr>
              <tr>
                <td class="item">個室基本料金</td>
                <td class="quantity">${data.individualRooms}室 × ${data.totalDays}泊</td>
                <td class="unit-price">${formatPrice(5000)}</td>
                <td class="text-right">${formatPrice(data.individualRooms * 5000 * data.totalDays)}</td>
              </tr>
              ${generatePriceRow('大人', data.individualAdult, data.totalDays,
                calculateAveragePrice(
                  individualFees.individual.regular.adult.weekday,
                  individualFees.individual.seasonal.adult.weekday
                ), data.individualAdultFee)}
              ${generatePriceRow('大人(合宿付添)', data.individualAdultAccompany, data.totalDays,
                calculateAveragePrice(
                  individualFees.individual.regular.adultAccompany.weekday,
                  individualFees.individual.seasonal.adultAccompany.weekday
                ), data.individualAdultAccompanyFee)}
              ${generatePriceRow('中・高/大学生', data.individualStudent, data.totalDays,
                calculateAveragePrice(
                  individualFees.individual.regular.student.weekday,
                  individualFees.individual.seasonal.student.weekday
                ), data.individualStudentFee)}
              ${generatePriceRow('小学生', data.individualElementary, data.totalDays,
                calculateAveragePrice(
                  individualFees.individual.regular.elementary.weekday,
                  individualFees.individual.seasonal.elementary.weekday
                ), data.individualElementaryFee)}
              ${generatePriceRow('未就学児', data.individualPreschool, data.totalDays,
                calculateAveragePrice(
                  individualFees.individual.regular.preschool.weekday,
                  individualFees.individual.seasonal.preschool.weekday
                ), data.individualPreschoolFee)}
            ` : ''}
            ${data.facilityTotal > 0 ? `
              <tr class="category">
                <td colspan="4">施設利用</td>
              </tr>
              ${data.meetingRoomHours > 0 ? `
                <tr>
                  <td class="item">会議室</td>
                  <td class="quantity">${data.meetingRoomHours}時間</td>
                  <td class="unit-price">${formatPrice(facilityFees.meetingRoom.hourly)}</td>
                  <td class="text-right">${formatPrice(data.meetingRoomHours * facilityFees.meetingRoom.hourly)}</td>
                </tr>
              ` : ''}
              ${data.gymHours > 0 ? `
                <tr>
                  <td class="item">体育館</td>
                  <td class="quantity">${data.gymHours}時間</td>
                  <td class="unit-price">${formatPrice(facilityFees.gym.hourly)}</td>
                  <td class="text-right">${formatPrice(data.gymHours * facilityFees.gym.hourly)}</td>
                </tr>
              ` : ''}
            ` : ''}
            ${data.mealTotal > 0 ? `
              <tr class="category">
                <td colspan="4">食事オプション</td>
              </tr>
              ${data.hasBreakfast ? `
                <tr>
                  <td class="item">朝食</td>
                  <td class="quantity">${data.totalGroup + data.totalIndividual}人 × ${data.totalDays}泊</td>
                  <td class="unit-price">${formatPrice(mealFees.breakfast)}</td>
                  <td class="text-right">${formatPrice((data.totalGroup + data.totalIndividual) * data.totalDays * mealFees.breakfast)}</td>
                </tr>
              ` : ''}
              ${data.hasDinner ? `
                <tr>
                  <td class="item">夕食</td>
                  <td class="quantity">${data.totalGroup + data.totalIndividual}人 × ${data.totalDays}泊</td>
                  <td class="unit-price">${formatPrice(mealFees.dinner)}</td>
                  <td class="text-right">${formatPrice((data.totalGroup + data.totalIndividual) * data.totalDays * mealFees.dinner)}</td>
                </tr>
              ` : ''}
              ${data.hasBBQ ? `
                <tr>
                  <td class="item">BBQ</td>
                  <td class="quantity">${data.totalGroup + data.totalIndividual}人</td>
                  <td class="unit-price">${formatPrice(mealFees.bbq)}</td>
                  <td class="text-right">${formatPrice((data.totalGroup + data.totalIndividual) * mealFees.bbq)}</td>
                </tr>
              ` : ''}
            ` : ''}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">合計金額(税込)</td>
              <td class="text-right total-amount">${formatPrice(data.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

// 価格行を生成するヘルパー関数
function generatePriceRow(label, count, days, unitPrice, fee) {
  if (count <= 0) return '';
  const quantity = `${count}人 × ${days}泊`;
  const subtotal = count * days * fee;
  return `
    <tr>
      <td class="item">${label}</td>
      <td class="quantity">${quantity}</td>
      <td class="unit-price">${formatPrice(unitPrice)}</td>
      <td class="text-right">${formatPrice(subtotal)}</td>
    </tr>
  `;
}

/**
 * 宿泊日数の表示を更新する関数
 */
function updateStayDuration(startDate, endDate) {
  const dateArray = getDateArray(startDate, endDate);
  let weekdayCount = 0, holidayCount = 0;
  let seasonalCount = 0, regularCount = 0;

  dateArray.forEach(date => {
    if (getDayType(date) === "holiday") {
      holidayCount++;
    } else {
      weekdayCount++;
    }
    if (isSeasonalPeriod(date)) {
      seasonalCount++;
    } else {
      regularCount++;
    }
  });

  const totalDays = weekdayCount + holidayCount;
  document.getElementById('stayDuration').textContent = 
    `${totalDays}日（平日:${weekdayCount}日、休日:${holidayCount}日）（オンシーズン: ${seasonalCount}日、オフシーズン: ${regularCount}日）`;
}

/**
 * 見積もり計算を行う関数
 */
function calculateEstimate(data) {
  // 宿泊日数の計算
  const startDate = new Date(data.checkin);
  const endDate = new Date(data.checkout);
  const dateArray = getDateArray(startDate, endDate);
  const totalDays = dateArray.length;
  
  // グループ宿泊の計算
  let groupTotal = 0;
  const roomAssignment = calculateOptimalRooms(data.totalGroup);
  
  // 部屋料金の計算
  Object.entries(roomAssignment).forEach(([type, count]) => {
    groupTotal += count * totalDays * roomConfigs.group[type].fee;
  });

  // 個人料金の計算（グループ）
  const groupAdultFee = calculateAveragePrice(
    individualFees.group.regular.adult.weekday,
    individualFees.group.seasonal.adult.weekday
  );
  const groupStudentFee = calculateAveragePrice(
    individualFees.group.regular.student.weekday,
    individualFees.group.seasonal.student.weekday
  );
  const groupElementaryFee = calculateAveragePrice(
    individualFees.group.regular.elementary.weekday,
    individualFees.group.seasonal.elementary.weekday
  );
  const groupPreschoolFee = calculateAveragePrice(
    individualFees.group.regular.preschool.weekday,
    individualFees.group.seasonal.preschool.weekday
  );

  groupTotal += data.groupAdult * totalDays * groupAdultFee;
  groupTotal += data.groupStudent * totalDays * groupStudentFee;
  groupTotal += data.groupElementary * totalDays * groupElementaryFee;
  groupTotal += data.groupPreschool * totalDays * groupPreschoolFee;

  // 個室利用の計算
  let individualTotal = 0;
  
  // 基本料金
  const individualRooms = Math.ceil((data.individualAdult + data.individualAdultAccompany + 
    data.individualStudent + data.individualElementary + data.individualPreschool) / 5);
  individualTotal += individualRooms * totalDays * 5000;

  // 個人料金の計算（個室）
  const individualAdultFee = calculateAveragePrice(
    individualFees.individual.regular.adult.weekday,
    individualFees.individual.seasonal.adult.weekday
  );
  const individualAdultAccompanyFee = calculateAveragePrice(
    individualFees.individual.regular.adultAccompany.weekday,
    individualFees.individual.seasonal.adultAccompany.weekday
  );
  const individualStudentFee = calculateAveragePrice(
    individualFees.individual.regular.student.weekday,
    individualFees.individual.seasonal.student.weekday
  );
  const individualElementaryFee = calculateAveragePrice(
    individualFees.individual.regular.elementary.weekday,
    individualFees.individual.seasonal.elementary.weekday
  );
  const individualPreschoolFee = calculateAveragePrice(
    individualFees.individual.regular.preschool.weekday,
    individualFees.individual.seasonal.preschool.weekday
  );

  individualTotal += data.individualAdult * totalDays * individualAdultFee;
  individualTotal += data.individualAdultAccompany * totalDays * individualAdultAccompanyFee;
  individualTotal += data.individualStudent * totalDays * individualStudentFee;
  individualTotal += data.individualElementary * totalDays * individualElementaryFee;
  individualTotal += data.individualPreschool * totalDays * individualPreschoolFee;

  // 施設利用料金の計算
  const facilityTotal = (data.meetingRoomHours * facilityFees.meetingRoom.hourly) +
                       (data.gymHours * facilityFees.gym.hourly);

  // 食事オプションの計算
  const totalPeople = data.totalGroup + data.totalIndividual;
  let mealTotal = 0;
  
  if (data.hasBreakfast) {
    mealTotal += totalPeople * totalDays * mealFees.breakfast;
  }
  if (data.hasDinner) {
    mealTotal += totalPeople * totalDays * mealFees.dinner;
  }
  if (data.hasBBQ) {
    mealTotal += totalPeople * mealFees.bbq;
  }

  // 総計の計算（税込）
  const grandTotal = Math.round((groupTotal + individualTotal + facilityTotal + mealTotal) * taxRate);

  return {
    ...data,
    totalDays,
    roomAssignment,
    groupTotal,
    individualTotal,
    facilityTotal,
    mealTotal,
    grandTotal,
    groupAdultFee,
    groupStudentFee,
    groupElementaryFee,
    groupPreschoolFee,
    individualAdultFee,
    individualAdultAccompanyFee,
    individualStudentFee,
    individualElementaryFee,
    individualPreschoolFee,
    individualRooms
  };
}
