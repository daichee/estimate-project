# 研修施設見積もりフォーム

## システム概要

研修施設の利用料金を計算するWebアプリケーションです。グループ宿泊、個室利用、施設利用、食事オプションなどの組み合わせに対応し、自動で最適な部屋の割り当てと料金計算を行います。

## 料金体系

### 1. 宿泊料金

#### グループ宿泊

##### 部屋料金(1室あたり・税込)
| 部屋タイプ | 定員 | 平日料金(税込) | 休日料金(税込) |
|------------|------|----------|----------|
| 理科室 | 10名 | 20,000円 | 25,000円 |
| 作法室 | 25名 | 13,000円 | 16,000円 |
| 図書室 | 10名 | 8,000円 | 10,000円 |
| 視聴覚室 | 21名 | 11,000円 | 14,000円 |
| 被服室 | 35名 | 15,000円 | 18,000円 |

##### 利用者料金(1名あたり・税込)
| 区分 | 平日料金(税込) | 休日料金(税込) |
|------|----------|----------|
| 大人 | 4,800円 | 5,850円 |
| 中・高/大学生 | 4,000円 | 4,900円 |
| 小学生 | 3,200円 | 3,900円 |
| 未就学児 | 2,500円 | 3,000円 |

#### 個室利用

- 基本料金: 5,000円/室/泊(税込)

##### 利用者料金(1名あたり・税込)
| 区分 | 平日料金(税込) | 休日料金(税込) |
|------|----------|----------|
| 大人 | 8,500円 | 10,300円 |
| 大人(合宿付添) | 6,800円 | 8,200円 |
| 中・高/大学生 | 5,900円 | 7,200円 |
| 小学生 | 5,000円 | 6,200円 |
| 未就学児 | 4,200円 | 5,200円 |

### 2. 施設利用料金

| 施設 | 料金(税込) |
|------|------------|
| 会議室 | 2,000円/時間 |
| 体育館 | 3,000円/時間 |

### 3. 食事オプション

| メニュー | 料金(税込) |
|----------|------------|
| 朝食 | 700円/人 |
| 夕食 | 1,000円/人 |
| BBQ | 2,200円/人 |

### 4. その他料金条件

- シーズン料金: 3月/4月/5月GW/7月/8月/9月/12月は通常料金の20%増
- 上記の料金はすべて税込(10%)です
- 休日定義: 土曜日、日曜日、祝日
- 料金の端数処理: 1円未満切り捨て

## 機能仕様

### 1. 利用日程

- チェックイン日とチェックアウト日の選択
- 日付範囲の自動バリデーション
- 祝日の自動判定(祝日APIを使用)
- 初期値として当日の日付と3日後の日付を自動設定

### 2. 宿泊利用

#### グループ宿泊
- 最大収容人数: 200名
- 年齢区分別の人数入力
- 最適な部屋の自動割り当て
- 定員に応じた料金計算

#### 個室利用
- 最大収容人数: 50名
- 個室定員: 5名/室
- 年齢区分別の人数入力
- 必要な個室数の自動計算

### 3. 施設利用

- 会議室・体育館の選択
- 利用時間の指定(1-12時間)
- 時間単位の料金計算

### 4. 食事オプション

- 朝食・夕食・BBQの選択
- 宿泊日数に応じた料金計算(BBQは1回分のみ)
- 全利用者分の一括計算

### 5. 計算結果表示

- 利用日程の詳細(平日・休日の内訳)
- シーズン料金の適用有無
- 部屋割り当ての詳細
- 料金の内訳(項目ごとの小計)
- 税込合計金額

## 技術仕様

### フロントエンド

- HTML5
- CSS3
- JavaScript (ES6+)
- レスポンシブデザイン対応

### 外部API

- 祝日API (https://holidays-jp.github.io/api/v1/date.json)

### ブラウザ対応

- Google Chrome (最新版)
- Mozilla Firefox (最新版)
- Safari (最新版)
- Microsoft Edge (最新版)

## 制約条件

### 1. 入力制限

- グループ宿泊の最大人数: 200名
- 個室利用の最大人数: 50名
- 施設利用時間: 1-12時間
- 日付選択: 当日以降のみ

### 2. 部屋割り当て

- 定員の大きい部屋から優先的に割り当て
- 1部屋あたりの定員を超えない範囲で割り当て
- 個室は5名/室で固定

### 3. 料金計算

- シーズン料金は基本料金に20%上乗せ
- 消費税は最後に一括計算
- 端数処理は1円未満切り捨て

## 更新履歴

### Version 1.0.2 (2025-02-09)
- 料金内訳テーブルのレイアウトを改善
  - 5列構造(項目・人数・単価・単位・小計)に変更
  - カテゴリと内訳の視覚的な区分けを強化
  - 単価と単位を分離して表示
  - 合計行のみに税込表示を集約

### Version 1.0.1 (2025-02-09)
- 日付入力フィールドの改善
  - チェックイン日に当日の日付を自動設定
  - チェックアウト日に3日後の日付を自動設定
  - 日付フォーマットを日本語表示に対応(YYYY年MM月DD日)
- 料金表示の改善
  - 金額表示のフォーマットを統一
  - 料金内訳の表示を詳細化
  - サブカテゴリごとの料金表示を追加

### Version 1.0.0 (2025-02-08)
- 初期リリース
- 基本機能の実装
- UI/UXの最適化
