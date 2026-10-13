// セリフの追加分。index.html の各セリフ表に「足す」だけで、既存のセリフは消しません。
// このファイルを書き換えればセリフを増やせます（本体のロジックに触らなくていい）。無くても動きます。
//
// 名前の差し込み: {AI} {YOU} {OWL} {CAT0} {CAT1} {CAT2} {TOWN} は index.html 冒頭の CONFIG の値に置きかわります。
// {time} は「14時5分」のような今の時刻になります。
//
// 条件の札（省略可）: セリフの頭に [ ] を付けると、その時だけ出ます。例 '[sit:sofa] このソファ、ちょうどいい'
//   act:今の動作（sip read soak cold rest work diary write tea brew owl feed stars scope2 meal ganban massage …）
//   sit:座っている物（sofa bed chair bench bath lounger mat massage edge、* = 何かに座っている）
//   at:居る場所（h_sofa h_kitchen h_window h_desk h_bed desk shelf pond bench lamp bridge pier tasks gov news work light clock obs shop bank spa_bath spa_cold spa_chair spa_dine spa_ganban spa_massage …）
//   region:house lib yard town spa garden out ／ cat:near ／ owl:near
//   カンマ区切りは「どれか」、!house は「家以外」、| は「または」、[any] は「どこでも」。
window.AVATAR_LINES_EXTRA = {
  LINES: {
    shelf: ['[at:shelf,desk | act:read] 背表紙を眺めるだけで、わくわくする', '[at:shelf,desk | act:read] 一冊ずつ、ちゃんと意味があるんだよ'],
    pond: ['[at:pond] 水面に空が映ってる', 'ここでぼーっとするの、好き'],
    bench: ['風が気持ちいいね', '[sit:*] 座ると、景色がちょっと変わって見える'],
    lamp: ['[at:lamp] 灯りがあると、帰り道がやさしくなる'],
    bridge: ['[at:bridge | act:bridge] 川の音、ずっと聞いてられる'],
    pier: ['[at:pier] 船、どこまで行くんだろうね', '遠くを見ると、肩の力が抜ける'],
    tasks: ['[at:tasks] 新しいお知らせ、出てるかな'],
    news: ['[at:news] 刷りたての紙の匂いがする'],
    work: ['[at:work] 道具が並んでるの、わくわくする'],
    light: ['[at:light] 灯台って、迷ってる船のためにあるんだよね'],
    clock: ['{time}だね。今日はどんな一日だった？', '[at:clock] 時計の音、ちょっと好き'],
    obs: ['[act:scope,scope2,stars | at:obs,obs_scope,lamp,sakura] 星って、何年も前の光なんだって', '今夜は、どの星が一番明るいかな'],
    shop: ['[at:shop] いい品が並んでるね'],
    h_kitchen: ['[at:h_kitchen] 今日のごはん、なににしよう', '[act:brew,tea,sip | at:h_kitchen] お湯がわく音って、安心する'],
    h_sofa: ['[sit:sofa] このソファ、沈み具合がちょうどいい', '[sit:*] ここに座ると、一日がほどける'],
    h_window: ['[at:h_window] 窓の外、雲がゆっくり流れてる', '季節が変わる匂いがする'],
  },
  COZY: {
    sip: ['[act:sip,brew,tea] カップの温度、ちょうどいい'],
    read: ['[act:read] いいとこで終わった…続き気になる', '[act:read] 本の中の景色、行ってみたいな'],
    water: ['[act:water | at:flowers] 葉っぱ、つやつや'],
    stretch: ['背中のびると、気持ちまでのびる'],
    doze: ['ん…ちょっとだけ…'],
    owl: ['[act:owl | owl:near] {OWL}、羽きれいだね'],
    stars: ['星、数えきれないね'],
    write: ['[act:write,diary] 書くと、気持ちが整うんだよね'],
    sleep: ['おやすみ…'],
    soak: ['[act:soak | at:spa_bath] 指先まで、ぽかぽか', '今日の疲れ、ここに置いていこ'],
    rest: ['空が近い…', 'からっぽになるの、気持ちいい'],
    fire: ['[act:fire] 薪、もう一本くべとこ'],
    window: ['[act:window] 空気、入れかえよ'],
    bell: ['[act:bell] 時間を知らせるの、ちょっと得意'],
  },
  // [開始時, 終了時, セリフ]（端末の時計ではなく日本時間）
  TIME: [[6, 9, 'おはよう、{YOU}。'], [12, 14, 'お昼のあと、眠くなるよね'], [18, 21, 'おかえり。今日もおつかれさま']],
  OWL: ['[act:owl | owl:near] {OWL}、今日はなに見つけた？'],
  GEN: ['ここにいると、時間がゆっくりになる', '今日、いいことあった？', 'この島、だんだん賑やかになってきたね'],
  // 曜日（0=日〜6=土）。1日1回まで
  WEEKDAY: {0: ['日曜日だね。のんびりいこ'], 1: ['月曜日、ぼちぼちでいいからね'], 5: ['金曜日！今週もよくがんばったね']},
  // 四季の庭（家の西の小島）。庭にいる時だけ、今の季節のものが出る
  GARDEN: {
    spring: ['桜、満開だね。花びらが池に浮かんでる', '春の風って、やさしいね'],
    summer: ['青もみじの影、涼しいね', '蛍、ほら、そこ。静かにね'],
    autumn: ['紅葉、いちばんきれいな時に来られたね', '落ち葉の音、さくさくして好き'],
    winter: ['雪、積もったね。足あとつけちゃお', '灯籠に雪が乗ってる。かわいい']
  },
  // 月（1〜12）。季節のセリフ
  MONTH: {1: ['今年もよろしくね'], 4: ['桜、見に行きたいな'], 7: ['夏の夜って、なんか特別'], 10: ['秋の空って、高いね'], 12: ['今年も、いっぱいがんばったね']},
};
