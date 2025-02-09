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
  large: { name: "大部屋(理科室)", capacity: 10, fee: { weekday: 20000, holiday: 25000 } },
  medium: { name: "中部屋(作法室)", capacity: 25, fee: { weekday: 13000, holiday: 16000 } },
  medium2: { name: "中部屋(図書室)", capacity: 10, fee: { weekday: 8000, holiday: 10000 } },
  medium3: { name: "中部屋(視聴覚室)", capacity: 21, fee: { weekday: 11000, holiday: 14000 } },
  medium4: { name: "中部屋(被服室)", capacity: 35, fee: { weekday: 15000, holiday: 18000 } }
};

// 施設利用料金設定
const facilityFees = {
  meetingRoom: { hourly: 2000 },
  gym: { hourly: 3000 }
};

// 個人料金設定
const individualFees = {
  group: {
    adult: { weekday: 4800, holiday: 5850 },
    middle: { weekday: 4000, holiday: 4900 },
    elementary: { weekday: 3200, holiday: 3900 },
    preschool: { weekday: 2500, holiday: 3000 }
  },
  individual: {
    adult: { weekday: 8500, holiday: 10300 },
    adultAccompany: { weekday: 6800, holiday: 8200 },
    middle: { weekday: 5900, holiday: 7200 },
    elementary: { weekday: 5000, holiday: 6200 },
    preschool: { weekday: 4200, holiday: 5200 }
  }
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
      const groupMiddle = parseInt(document.getElementById('groupMiddle').value) || 0;
      const groupElementary = parseInt(document.getElementById('groupElementary').value) || 0;
      const groupPreschool = parseInt(document.getElementById('groupPreschool').value) || 0;
      const totalGroup = groupAdult + groupMiddle + groupElementary + groupPreschool;

      debug('グループ利用者数:', {
        adult: groupAdult,
        middle: groupMiddle,
        elementary: groupElementary,
        preschool: groupPreschool,
        total: totalGroup
      });

      // 個室利用者数の取得
      const individualAdult = parseInt(document.getElementById('individualAdult').value) || 0;
      const individualAdultAccompany = parseInt(document.getElementById('individualAdultAccompany').value) || 0;
      const individualMiddle = parseInt(document.getElementById('individualMiddle').value) || 0;
      const individualElementary = parseInt(document.getElementById('individualElementary').value) || 0;
      const individualPreschool = parseInt(document.getElementById('individualPreschool').value) || 0;
      const totalIndividual = individualAdult + individualAdultAccompany + individualMiddle + individualElementary + individualPreschool;

      debug('個室利用者数:', {
        adult: individualAdult,
        adultAccompany: individualAdultAccompany,
        middle: individualMiddle,
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

      // 部屋の割り当てと料金計算
      let groupTotal = 0;
      let roomAssignment = null;
      let groupAdultFee = 0, groupMiddleFee = 0, groupElementaryFee = 0, groupPreschoolFee = 0;

      if (totalGroup > 0) {
        roomAssignment = calculateOptimalRooms(totalGroup);
        debug('部屋割り当て:', roomAssignment);

        const roomTotal = Object.entries(roomAssignment).reduce((total, [type, count]) => {
          const room = roomConfigs[type];
          const baseFee = count * (weekdayCount * room.fee.weekday + holidayCount * room.fee.holiday);
          return total + (isSeasonalPeriod ? Math.round(baseFee * seasonalRate) : baseFee);
        }, 0);

        const calcGroupFee = (type) => {
          const base = weekdayCount * individualFees.group[type].weekday + 
                      holidayCount * individualFees.group[type].holiday;
          return isSeasonalPeriod ? Math.round(base * seasonalRate) : base;
        };

        groupAdultFee = calcGroupFee('adult');
        groupMiddleFee = calcGroupFee('middle');
        groupElementaryFee = calcGroupFee('elementary');
        groupPreschoolFee = calcGroupFee('preschool');

        groupTotal = roomTotal + 
                    groupAdult * groupAdultFee +
                    groupMiddle * groupMiddleFee +
                    groupElementary * groupElementaryFee +
                    groupPreschool * groupPreschoolFee;

        debug('グループ料金:', {
          roomTotal,
          groupAdultFee,
          groupMiddleFee,
          groupElementaryFee,
          groupPreschoolFee,
          groupTotal
        });
      }

      // 個室料金計算
      let individualTotal = 0;
      let individualAdultFee = 0, individualAdultAccompanyFee = 0, 
          individualMiddleFee = 0, individualElementaryFee = 0, individualPreschoolFee = 0;

      if (totalIndividual > 0) {
        const individualRooms = Math.ceil(totalIndividual / 5);
        const calcIndividualFee = (type) => {
          const base = weekdayCount * individualFees.individual[type].weekday + 
                      holidayCount * individualFees.individual[type].holiday;
          return isSeasonalPeriod ? Math.round(base * seasonalRate) : base;
        };

        individualAdultFee = calcIndividualFee('adult');
        individualAdultAccompanyFee = calcIndividualFee('adultAccompany');
        individualMiddleFee = calcIndividualFee('middle');
        individualElementaryFee = calcIndividualFee('elementary');
        individualPreschoolFee = calcIndividualFee('preschool');

        const roomBaseFee = 5000 * totalDays;
        const roomTotalFee = isSeasonalPeriod ? Math.round(roomBaseFee * seasonalRate) : roomBaseFee;

        individualTotal = individualRooms * roomTotalFee +
                         individualAdult * individualAdultFee +
                         individualAdultAccompany * individualAdultAccompanyFee +
                         individualMiddle * individualMiddleFee +
                         individualElementary * individualElementaryFee +
                         individualPreschool * individualPreschoolFee;

        debug('個室料金:', {
          individualRooms,
          roomTotalFee,
          individualAdultFee,
          individualAdultAccompanyFee,
          individualMiddleFee,
          individualElementaryFee,
          individualPreschoolFee,
          individualTotal
        });
      }

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

      // 総合計(税込)
      const subtotal = groupTotal + individualTotal + facilityTotal + mealTotal;
      const grandTotal = Math.round(subtotal * taxRate);

      debug('合計金額:', {
        subtotal,
        grandTotal
      });

      // 結果の表示
      const resultData = {
        checkin,
        checkout,
        totalDays,
        weekdayCount,
        holidayCount,
        isSeasonalPeriod,
        roomAssignment,
        totalGroup,
        groupAdult,
        groupMiddle,
        groupElementary,
        groupPreschool,
        groupAdultFee,
        groupMiddleFee,
        groupElementaryFee,
        groupPreschoolFee,
        groupTotal,
        totalIndividual,
        individualRooms: Math.ceil(totalIndividual / 5),
        individualAdult,
        individualAdultAccompany,
        individualMiddle,
        individualElementary,
        individualPreschool,
        individualAdultFee,
        individualAdultAccompanyFee,
        individualMiddleFee,
        individualElementaryFee,
        individualPreschoolFee,
        individualTotal,
        meetingRoomHours,
        gymHours,
        meetingRoomTotal,
        gymTotal,
        facilityTotal,
        hasBreakfast,
        hasDinner,
        hasBBQ,
        breakfastTotal,
        dinnerTotal,
        bbqTotal,
        mealTotal,
        grandTotal
      };

      const resultElement = document.getElementById('result');
      resultElement.innerHTML = generateResultHTML(resultData);
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
  const day = date.getDay();
  return (holidayData[dateString] || day === 0 || day === 6) ? "holiday" : "weekday";
}

/**
 * シーズン期間かどうかを判定する関数
 */
function isSeasonalPeriod(dateString) {
  const month = new Date(dateString).getMonth() + 1;
  return seasonalMonths.includes(month);
}

/**
 * 金額をフォーマットする関数
 */
function formatPrice(price) {
  return price.toLocaleString() + '円';
}

/**
 * 最適な部屋の組み合わせを計算する関数
 */
function calculateOptimalRooms(totalPeople) {
  const rooms = [];
  let remainingPeople = totalPeople;
  
  // 部屋を定員の大きい順にソート
  const sortedRooms = Object.entries(roomConfigs)
    .sort((a, b) => b[1].capacity - a[1].capacity);
  
  while (remainingPeople > 0) {
    // 最適な部屋を探す
    const room = sortedRooms.find(([_, config]) => config.capacity <= remainingPeople) ||
                sortedRooms[sortedRooms.length - 1];
    
    if (!room) break;
    
    rooms.push(room[0]);
    remainingPeople -= room[1].capacity;
  }
  
  // 部屋タイプごとにカウント
  return rooms.reduce((acc, roomType) => {
    acc[roomType] = (acc[roomType] || 0) + 1;
    return acc;
  }, {});
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
  debug('見積もり結果の生成開始:', data);
  const seasonalNote = data.isSeasonalPeriod ?
    '<div class="notice">※3月/4月/5月GW/7月/8月/9月/12月はシーズン料金(通常料金の20%増)が適用されます。</div>' : '';

  let roomAssignmentHtml = '';
  if (data.roomAssignment && Object.keys(data.roomAssignment).length > 0) {
    roomAssignmentHtml = `
      <div class="room-assignment">
        <p>割り当て部屋:</p>
        <ul>
          ${Object.entries(data.roomAssignment).map(([type, count]) =>
            `<li>${roomConfigs[type].name} × ${count}室</li>`
          ).join('')}
        </ul>
      </div>
    `;
  }

  return `
    <div class="result-section">
      <div class="result-header">【利用日程】</div>
      <div class="result-detail">
        チェックイン: ${data.checkin}<br>
        チェックアウト: ${data.checkout}<br>
        宿泊日数: ${data.totalDays}日(平日:${data.weekdayCount}日、休日:${data.holidayCount}日)
        ${seasonalNote}
      </div>
    </div>

    <div class="result-section">
      <div class="result-header">【料金内訳】</div>
      <div class="result-detail">
        <table class="price-breakdown">
          <thead>
            <tr>
              <th class="item">項目</th>
              <th class="quantity">数量</th>
              <th class="unit-price">単価</th>
              <th class="unit">単位</th>
              <th class="subtotal">小計</th>
            </tr>
          </thead>
          <tbody>
            ${data.groupTotal > 0 ? `
              <tr class="category">
                <td colspan="5">グループ宿泊</td>
              </tr>
              ${Object.entries(data.roomAssignment || {}).map(([type, count]) => `
                <tr>
                  <td class="item">${roomConfigs[type].name}</td>
                  <td class="quantity">${count}</td>
                  <td class="unit-price">${formatPrice(data.isSeasonalPeriod ?
                    Math.round(roomConfigs[type].fee.weekday * seasonalRate) :
                    roomConfigs[type].fee.weekday)}</td>
                  <td class="unit">/室</td>
                  <td class="subtotal">${formatPrice(count * (data.isSeasonalPeriod ?
                    Math.round(roomConfigs[type].fee.weekday * seasonalRate) :
                    roomConfigs[type].fee.weekday))}</td>
                </tr>
              `).join('')}
              ${data.groupAdult > 0 ? `
                <tr>
                  <td class="item">大人</td>
                  <td class="quantity">${data.groupAdult}</td>
                  <td class="unit-price">${formatPrice(data.groupAdultFee)}</td>
                  <td class="unit">/人</td>
                  <td class="subtotal">${formatPrice(data.groupAdult * data.groupAdultFee)}</td>
                </tr>
              ` : ''}
              ${data.groupMiddle > 0 ? `
                <tr>
                  <td class="item">中・高/大学生</td>
                  <td class="quantity">${data.groupMiddle}</td>
                  <td class="unit-price">${formatPrice(data.groupMiddleFee)}</td>
                  <td class="unit">/人</td>
                  <td class="subtotal">${formatPrice(data.groupMiddle * data.groupMiddleFee)}</td>
                </tr>
              ` : ''}
              ${data.groupElementary > 0 ? `
                <tr>
                  <td class="item">小学生</td>
                  <td class="quantity">${data.groupElementary}</td>
                  <td class="unit-price">${formatPrice(data.groupElementaryFee)}</td>
                  <td class="unit">/人</td>
                  <td class="subtotal">${formatPrice(data.groupElementary * data.groupElementaryFee)}</td>
                </tr>
              ` : ''}
              ${data.groupPreschool > 0 ? `
                <tr>
                  <td class="item">未就学児</td>
                  <td class="quantity">${data.groupPreschool}</td>
                  <td class="unit-price">${formatPrice(data.groupPreschoolFee)}</td>
                  <td class="unit">/人</td>
                  <td class="subtotal">${formatPrice(data.groupPreschool * data.groupPreschoolFee)}</td>
                </tr>
              ` : ''}
            ` : ''}

            ${data.individualTotal > 0 ? `
              <tr class="category">
                <td colspan="5">個室利用</td>
              </tr>
              <tr>
                <td class="item">個室基本料金</td>
                <td class="quantity">${data.individualRooms}</td>
                <td class="unit-price">${formatPrice(5000)}</td>
                <td class="unit">/室</td>
                <td class="subtotal">${formatPrice(data.individualRooms * 5000 * data.totalDays)}</td>
              </tr>
              ${data.individualAdult > 0 ? `
                <tr>
                  <td class="item">大人</td>
                  <td class="quantity">${data.individualAdult}</td>
                  <td class="unit-price">${formatPrice(data.individualAdultFee)}</td>
                  <td class="unit">/人</td>
                  <td class="subtotal">${formatPrice(data.individualAdult * data.individualAdultFee)}</td>
                </tr>
              ` : ''}
              ${data.individualAdultAccompany > 0 ? `
                <tr>
                  <td class="item">大人(合宿付添)</td>
                  <td class="quantity">${data.individualAdultAccompany}</td>
                  <td class="unit-price">${formatPrice(data.individualAdultAccompanyFee)}</td>
                  <td class="unit">/人</td>
                  <td class="subtotal">${formatPrice(data.individualAdultAccompany * data.individualAdultAccompanyFee)}</td>
                </tr>
              ` : ''}
              ${data.individualMiddle > 0 ? `
                <tr>
                  <td class="item">中・高/大学生</td>
                  <td class="quantity">${data.individualMiddle}</td>
                  <td class="unit-price">${formatPrice(data.individualMiddleFee)}</td>
                  <td class="unit">/人</td>
                  <td class="subtotal">${formatPrice(data.individualMiddle * data.individualMiddleFee)}</td>
                </tr>
              ` : ''}
              ${data.individualElementary > 0 ? `
                <tr>
                  <td class="item">小学生</td>
                  <td class="quantity">${data.individualElementary}</td>
                  <td class="unit-price">${formatPrice(data.individualElementaryFee)}</td>
                  <td class="unit">/人</td>
                  <td class="subtotal">${formatPrice(data.individualElementary * data.individualElementaryFee)}</td>
                </tr>
              ` : ''}
              ${data.individualPreschool > 0 ? `
                <tr>
                  <td class="item">未就学児</td>
                  <td class="quantity">${data.individualPreschool}</td>
                  <td class="unit-price">${formatPrice(data.individualPreschoolFee)}</td>
                  <td class="unit">/人</td>
                  <td class="subtotal">${formatPrice(data.individualPreschool * data.individualPreschoolFee)}</td>
                </tr>
              ` : ''}
            ` : ''}

            ${data.facilityTotal > 0 ? `
              <tr class="category">
                <td colspan="5">施設利用</td>
              </tr>
              ${data.meetingRoomHours > 0 ? `
                <tr>
                  <td class="item">会議室</td>
                  <td class="quantity">${data.meetingRoomHours}</td>
                  <td class="unit-price">${formatPrice(facilityFees.meetingRoom.hourly)}</td>
                  <td class="unit">/時間</td>
                  <td class="subtotal">${formatPrice(data.meetingRoomTotal)}</td>
                </tr>
              ` : ''}
              ${data.gymHours > 0 ? `
                <tr>
                  <td class="item">体育館</td>
                  <td class="quantity">${data.gymHours}</td>
                  <td class="unit-price">${formatPrice(facilityFees.gym.hourly)}</td>
                  <td class="unit">/時間</td>
                  <td class="subtotal">${formatPrice(data.gymTotal)}</td>
                </tr>
              ` : ''}
            ` : ''}

            ${data.mealTotal > 0 ? `
              <tr class="category">
                <td colspan="5">食事オプション</td>
              </tr>
              ${data.hasBreakfast ? `
                <tr>
                  <td class="item">朝食</td>
                  <td class="quantity">${data.totalGroup + data.totalIndividual}</td>
                  <td class="unit-price">${formatPrice(mealFees.breakfast)}</td>
                  <td class="unit">/人</td>
                  <td class="subtotal">${formatPrice(data.breakfastTotal)}</td>
                </tr>
              ` : ''}
              ${data.hasDinner ? `
                <tr>
                  <td class="item">夕食</td>
                  <td class="quantity">${data.totalGroup + data.totalIndividual}</td>
                  <td class="unit-price">${formatPrice(mealFees.dinner)}</td>
                  <td class="unit">/人</td>
                  <td class="subtotal">${formatPrice(data.dinnerTotal)}</td>
                </tr>
              ` : ''}
              ${data.hasBBQ ? `
                <tr>
                  <td class="item">BBQ</td>
                  <td class="quantity">${data.totalGroup + data.totalIndividual}</td>
                  <td class="unit-price">${formatPrice(mealFees.bbq)}</td>
                  <td class="unit">/人</td>
                  <td class="subtotal">${formatPrice(data.bbqTotal)}</td>
                </tr>
              ` : ''}
            ` : ''}
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="4">合計金額(税込)</td>
              <td class="grand-total">${formatPrice(data.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}
