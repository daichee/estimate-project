// 祝日APIから日本の祝日データを取得
let holidayData = {};
fetch('https://holidays-jp.github.io/api/v1/date.json')
  .then(response => response.json())
  .then(data => { holidayData = data; })
  .catch(error => console.error("祝日データの取得に失敗しました:", error));

// 定数（料金・定員など）
// 【グループ利用（大部屋・中部屋利用対象）】
// ※本サンプルでは、グループ利用は自動的に「作法室」
//     定員：25名、室料：平日20,000円／金土日祝25,000円
const groupRoomCapacity = 25;
const groupRoomFee = {
  weekday: 20000,
  holiday: 25000
};
const groupIndividualFees = {
  adult:      { weekday: 4800, holiday: 5850 },
  middle:     { weekday: 5500, holiday: 6750 },
  elementary: { weekday: 4000, holiday: 4900 },
  preschool:  { weekday: 3200, holiday: 3900 }
};

// 【個室利用（個室利用対象）】
// 個室定員：5名、室料は一律（ここでは簡易に5000円／日とする）
const individualRoomCapacity = 5;
const individualRoomFee = {
  fee: 5000
};
const individualIndividualFees = {
  adult:         { weekday: 8500, holiday: 10300 },
  adultAccompany:{ weekday: 9800, holiday: 11800 },
  middle:        { weekday: 6800, holiday: 8200 },
  elementary:    { weekday: 5900, holiday: 7200 },
  preschool:     { weekday: 5000, holiday: 6200 }
};

// ヘルパー関数：チェックイン～チェックアウトの日付（チェックアウトは除く）の配列を取得
function getDateArray(startDate, endDate) {
  const arr = [];
  const dt = new Date(startDate);
  const end = new Date(endDate);
  while (dt < end) {
    // 日付文字列 (YYYY-MM-DD)
    arr.push(dt.toISOString().split('T')[0]);
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
}

// ヘルパー関数：指定日が「平日」か「金土日祝」かを返す
function getDayType(dateString) {
  const date = new Date(dateString);
  const day = date.getDay(); // 0:日, 6:土
  // 祝日または土日なら「金土日祝」
  if (holidayData[dateString] || day === 0 || day === 6) {
    return "holiday";
  }
  return "weekday";
}

// フォーム送信時の処理
document.getElementById('estimateForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // 入力値の取得
  const checkin = document.getElementById('checkinDate').value;
  const checkout = document.getElementById('checkoutDate').value;
  if (!checkin || !checkout || new Date(checkin) >= new Date(checkout)) {
    alert("正しいチェックイン・チェックアウト日を入力してください。");
    return;
  }
  const dateArray = getDateArray(checkin, checkout);
  const totalDays = dateArray.length;

  // 各日の曜日（平日／holiday）をカウント
  let weekdayCount = 0, holidayCount = 0;
  dateArray.forEach(dateStr => {
    if (getDayType(dateStr) === "holiday") {
      holidayCount++;
    } else {
      weekdayCount++;
    }
  });

  // グループ利用者数（数値変換）
  const groupAdult = parseInt(document.getElementById('groupAdult').value, 10) || 0;
  const groupMiddle = parseInt(document.getElementById('groupMiddle').value, 10) || 0;
  const groupElementary = parseInt(document.getElementById('groupElementary').value, 10) || 0;
  const groupPreschool = parseInt(document.getElementById('groupPreschool').value, 10) || 0;
  const totalGroup = groupAdult + groupMiddle + groupElementary + groupPreschool;
  // 必要なグループ用部屋数（作法室、定員25名）
  const groupRooms = Math.ceil(totalGroup / groupRoomCapacity);

  // 個室利用者数
  const individualAdult = parseInt(document.getElementById('individualAdult').value, 10) || 0;
  const individualAdultAccompany = parseInt(document.getElementById('individualAdultAccompany').value, 10) || 0;
  const individualMiddle = parseInt(document.getElementById('individualMiddle').value, 10) || 0;
  const individualElementary = parseInt(document.getElementById('individualElementary').value, 10) || 0;
  const individualPreschool = parseInt(document.getElementById('individualPreschool').value, 10) || 0;
  const totalIndividual = individualAdult + individualAdultAccompany + individualMiddle + individualElementary + individualPreschool;
  // 必要な個室の部屋数（定員5名）
  const individualRooms = Math.ceil(totalIndividual / individualRoomCapacity);

  // 料金計算（各日ごとに計算して合算）
  let groupRoomTotal = 0, groupIndividualTotal = 0;
  let individualRoomTotal = 0, individualIndividualTotal = 0;

  // 日ごとにループ
  dateArray.forEach(dateStr => {
    const type = getDayType(dateStr); // "weekday" or "holiday"
    // グループ用部屋料金：1室あたり
    groupRoomTotal += (type === "holiday" ? groupRoomFee.holiday : groupRoomFee.weekday) * groupRooms;
    // グループ用個人料金
    groupIndividualTotal += (type === "holiday" ? groupIndividualFees.adult.holiday : groupIndividualFees.adult.weekday) * groupAdult;
    groupIndividualTotal += (type === "holiday" ? groupIndividualFees.middle.holiday : groupIndividualFees.middle.weekday) * groupMiddle;
    groupIndividualTotal += (type === "holiday" ? groupIndividualFees.elementary.holiday : groupIndividualFees.elementary.weekday) * groupElementary;
    groupIndividualTotal += (type === "holiday" ? groupIndividualFees.preschool.holiday : groupIndividualFees.preschool.weekday) * groupPreschool;

    // 個室用部屋料金：1室あたり（ここでは一律 individualRoomFee.fee）
    individualRoomTotal += individualRoomFee.fee * individualRooms;
    // 個室用個人料金
    individualIndividualTotal += (type === "holiday" ? individualIndividualFees.adult.holiday : individualIndividualFees.adult.weekday) * individualAdult;
    individualIndividualTotal += (type === "holiday" ? individualIndividualFees.adultAccompany.holiday : individualIndividualFees.adultAccompany.weekday) * individualAdultAccompany;
    individualIndividualTotal += (type === "holiday" ? individualIndividualFees.middle.holiday : individualIndividualFees.middle.weekday) * individualMiddle;
    individualIndividualTotal += (type === "holiday" ? individualIndividualFees.elementary.holiday : individualIndividualFees.elementary.weekday) * individualElementary;
    individualIndividualTotal += (type === "holiday" ? individualIndividualFees.preschool.holiday : individualIndividualFees.preschool.weekday) * individualPreschool;
  });

  const totalGroupCost = groupRoomTotal + groupIndividualTotal;
  const totalIndividualCost = individualRoomTotal + individualIndividualTotal;
  const grandTotal = totalGroupCost + totalIndividualCost;

  // 内訳表示用の文字列を生成
  let resultText = "";
  resultText += "【利用日程】\n";
  resultText += "チェックイン: " + checkin + "\n";
  resultText += "チェックアウト: " + checkout + "\n";
  resultText += "宿泊日数: " + totalDays + "日（平日：" + weekdayCount + "日、金土日祝：" + holidayCount + "日）\n\n";

  resultText += "【グループ利用（作法室 利用）】\n";
  resultText += "総参加人数: " + totalGroup + "人\n";
  resultText += "必要な部屋数（定員 " + groupRoomCapacity + "人）: " + groupRooms + "室\n";
  resultText += "・部屋料金合計: " + groupRoomTotal.toLocaleString() + "円\n";
  resultText += "・個人料金合計: " + groupIndividualTotal.toLocaleString() + "円\n";
  resultText += "→ グループ利用小計: " + totalGroupCost.toLocaleString() + "円\n\n";

  resultText += "【個室利用】\n";
  resultText += "総利用人数: " + totalIndividual + "人\n";
  resultText += "必要な個室数（定員 " + individualRoomCapacity + "人）: " + individualRooms + "室\n";
  resultText += "・個室部屋料金合計: " + individualRoomTotal.toLocaleString() + "円\n";
  resultText += "・個人料金合計: " + individualIndividualTotal.toLocaleString() + "円\n";
  resultText += "→ 個室利用小計: " + totalIndividualCost.toLocaleString() + "円\n\n";

  resultText += "【総合計】 " + grandTotal.toLocaleString() + "円";

  // 結果を表示
  document.getElementById('result').innerText = resultText;
});
