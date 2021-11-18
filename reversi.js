/*
    あいすリバーシ メインスクリプト
    21.11.08 @avaice_
*/

/*
    ++++ソースコード注釈++++
    画像変数は先頭に必ず「i_」を付ける
    盤面 0=無, 1=黒, 2=白
    あいす丸のコメント表示にjquery必須です！
*/

/* 変数宣言 */
var VER = "Ver0.61(20211112)";

var c_scale; //キャンバススケール
var canvas; //キャンバス本体
var board; //実際に操作するキャンバス変数

var b_arr; //コマの場所

var stat; //ステータス表示ラベル
var stat_text = "あなたが先手(黒)です！"; //ステータス固定文字

var cur_x, cur_y; //マウスカーソルが選択している場所

var my_color = 1; //自分のコマの色（オンライン対戦に今後対応させるため。今は1で固定）
var cpu_color = 2; //CPUのコマの色（先手後手切り替えで使う）
var playing = 1; //ターン番号(0=未プレイ 1=黒 2=白)
var progress = 0; //試合の進行度(％)
var pass_count = 0; //連続パス回数

var se = new Audio('sound01.wav'); //効果音

var cpu_lv = 5; //CPUレベル(低いほど強い)

var blackmode = false; //棋譜読みゴリラモードのスイッチ
var kif; //棋譜
var kifpos = ["a", "b", "c", "d", "e", "f", "g", "h"];
//棋譜データはkif.js


/* CPUマップ宣言 */
cpu_arr = [
    [50,0,1,0,0,1,0,50],
    [0,0,0,0,0,0,0,0],
    [1,0,7,7,7,7,0,1],
    [0,0,7,15,15,7,0,0],
    [0,0,7,15,15,7,0,0],
    [1,0,7,7,7,5,0,1],
    [0,0,0,0,0,0,0,0],
    [50,0,1,0,0,1,0,50]
];

cpu_arr2 = [
    [50,0,10,10,10,10,0,50],
    [0,0,4,4,4,4,0,0],
    [10,4,5,3,3,5,4,10],
    [10,4,3,0,0,3,4,10],
    [10,4,3,0,0,3,4,10],
    [10,4,5,3,3,5,4,10],
    [0,0,4,4,4,4,0,0],
    [50,0,10,10,10,10,0,50]
];



/* 画像読み込み */
const i_bg = new Image();
i_bg.src="bg.png";
const i_w = new Image();
i_w.src="w.png";
const i_b = new Image();
i_b.src="b.png";


window.onload = ()=>{
    /* canvas初期化 */
    c_scale = getScale();
    canvas = document.getElementById('board');
    board = canvas.getContext('2d');
    canvas.width = 1000 * c_scale;
    canvas.height = 1000 * c_scale;
    canvas.addEventListener('mousemove', function (evt) {
        //canvasにマウスカーソルが乗った時のイベント
        const rect = canvas.getBoundingClientRect();
        const mousePos ={x: evt.clientX - rect.left, y: evt.clientY - rect.top};
        //1を足してゼロ除算防止
        let _cur_x = Math.floor((1 + mousePos.x) / (125 * c_scale));
        let _cur_y = Math.floor((1 + mousePos.y) / (125 * c_scale));
        if(_cur_x != cur_x || _cur_y != cur_y){
            cur_x = _cur_x;
            cur_y = _cur_y;
            cngStat("(" + kifpos[cur_x] + "" + (cur_y + 1) + ")");
        }
      }, false);
    canvas.addEventListener('click', place, false);
    window.onresize = onResized;

    /* ステータスラベル初期化 */
    stat = document.getElementById('status');

    reset(); 



    if(getParam('gote') == 1){
        //後手としてプレイ（他のCPUリバーシ
        my_color = 2;
        cpu_color = 1;
        playing = 2;
        stat_text = "あなたは後手(白)です！";
        setTimeout(cpuTurn, 400 * cpu_lv);
    }

    if(getParam('debug') == 1){
        document.getElementById('debug').style.display = 'inline';
    }
    if(getParam('black') == 1){
        document.getElementsByTagName("body")[0].style.backgroundImage = 'url("./bg058_04B.gif")';
        document.getElementsByTagName("body")[0].style.color = "white";
        blackmode = true;
    }

    document.getElementsByClassName("ver")[0].innerHTML = (VER);
    comment("よろしくね！");
    cngStat();

}

/* 盤面初期化 */
function reset() {

    b_arr = [
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,2,1,0,0,0],
        [0,0,0,1,2,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0]
    ];

    kif = "";

    
    drawBoard();
}

/* 盤面描画とデバッグ出力 */
function drawBoard() {
    board.drawImage(i_bg, 0, 0, 1000 * c_scale, 1000 * c_scale);
    for(let x=0; x<8; x++){
        for(let y=0; y<8; y++){
            switch(b_arr[y][x]){
                case 1:
                    //黒だったとき
                    board.drawImage(i_b, 125 * x * c_scale, 125 * y * c_scale, 125 * c_scale, 125 * c_scale);
                    break;
                case 2:
                    //白だったとき
                    board.drawImage(i_w, 125 * x * c_scale, 125 * y * c_scale, 125 * c_scale, 125 * c_scale);
                    break;
                default:
                    //何もなかったとき
                    break;
                }
        }
    }

    //デバッグ出力
    //showLog(b_arr)
    document.getElementById("debug").innerHTML = ('進行度: ' + progress + '%, CPULV: ' + cpu_lv);
    
    return;
}

function getScale() {
    let size = document.body.clientWidth / 1920 * 0.55; //横基準のスケーリング
    const sc_2 = window.innerHeight / 1080 * 0.55; //縦基準のスケーリング
    if(sc_2 > size){
        //大きいほうを選ぶ
        size = sc_2;
    }
    if((1000 * size) > document.body.clientWidth){
        size = window.innerHeight / 1080 * 0.45;
    }
    return size;
}

/* 画面サイズ変更時イベント */
function onResized() {
    c_scale = getScale();
    canvas.width = 1000 * c_scale;
    canvas.height = 1000 * c_scale;
    drawBoard();
}

/* 
    コマを置く
    player=置くコマの色（1=黒, 2=白)
    px,py=置く座標
*/
function place(player, px=cur_x, py=cur_y) {
    
    if(playing == 0) return;

    if(player != cpu_color){
        //CanvasのClickイベントリスナーから飛んできたなら自分のコマ
        player = my_color;
    }

    if(player == my_color && playing != 1){
        return;
    }

    let can_rep = placeCheck(px, py, player);
    if(can_rep[0] != 0){
        //cngStat("<b>ここは取れますよ！！！</b>");

    
        b_arr[py][px] = player;
        String(can_rep[1]).split(',').forEach(pos => {
            b_arr[pos[1]][pos[0]] = player;
        });

        kif = kif + kifpos[px] + String((py + 1));
        
    
        
        drawBoard();
        playSE();
        endCheck();
        if(playing == 0) return; //endCheckで終了判定が出たらもう止めちゃう

        pass_count = 0;

        if(player == my_color){
            getComment([can_rep[0],px,py]);
            stat_text = "あいす丸のターン";
            playing = 2;
            cngStat();
            setTimeout(cpuTurn, 100 * cpu_lv);
        }else{
            stat_text = "あなたのターン";
            playing = 1;
            cngStat();
        }
    }else{
        
        cngStat("<b><font color=red>そこにはおけません！</font></b>");
    }
    
    return;
}

function placeCheck(px, py, player, map) {

    if(!map){
        map = b_arr;
    }

    if(map[py][px] != 0){
        return [0, ""];

    }
    let count = 0; //取れるコマの数
    let can_get = [false, false, false, false, false, false, false, false] //コマをとれるか(方向別)
    let can_rep = ["","","","","","","",""]; //取れるコマの座標(カンマ区切り)
    let can_rep_all = "";
    let chk_dir = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]]; //チェックする方向

    let dir_n = 0;
    chk_dir.forEach(dir => {
        
        let cur_dir = [px, py];
        cur_dir[0] += dir[0];
        cur_dir[1] += dir[1];
        
        while(cur_dir[0] < 8 && cur_dir[1] < 8 && cur_dir[0] > -1 && cur_dir[1] > -1){
            let chk_koma = map[cur_dir[1]][cur_dir[0]];
            if(chk_koma != player && chk_koma != "0"){
                can_rep[dir_n] = can_rep[dir_n] + cur_dir[0] + cur_dir[1] + ",";
            }
            if(chk_koma == player || chk_koma == "0"){
                if(can_rep[dir_n] != "" && chk_koma == player){
                    can_get[dir_n] = true;
                    //console.log(cur_dir + "で挟めるので取れる。" + dir)
                }
                break;
            }
            cur_dir[0] += dir[0];
            cur_dir[1] += dir[1];

        }
        
        dir_n++;
    });

    for(let i=0; i < 8; i++){
        if(can_get[i]){
            can_rep_all = can_rep_all + can_rep[i];
        }
    }
    if(can_rep_all ==""){
        return [0, ""];
    }else{
        can_rep_all = can_rep_all.slice( 0, -1 );
        count = can_rep_all.split(',').length;
        return [count, can_rep_all];
    }
    
}


/* ステータス文字更新 */
function cngStat(arr="") {
    stat.innerHTML = stat_text + " " + arr;
    return;
}



/* CPUターン */
function cpuTurn() {

    if(playing == 0) return;

    if(!canPlace(cpu_color)){
        comment("置ける場所がないからパスするね");
        stat_text = "あなたのターン";
        playing = 1;
        cngStat();
        if(!canPlace(my_color)){
            pass_count = 2;
            endCheck();
        }
        return;
    }

    if(progress == 20 || progress == 21){
        if(count_koma()[0] > count_koma()[1]){
            comment("思い通り！");
        }
    }

    if(progress > 65 && count_koma()[0] - count_koma()[1] > 17 && cpu_lv > 1){
        comment(".....", "red");
        cpu_lv = 1;
    }else if(progress > 45 && count_koma()[0] - count_koma()[1] > 9 && cpu_lv > 3){
        comment("本気出す！！！", "pink");
        cpu_lv = 3;
    }


    let good_place = [-1, -1];
    let good_count = 0;
    let kif_length;
    let normal_play = true;
    if(blackmode){
        normal_play = false;
        const reg = new RegExp("^" + kif + ".*$");
        let _kif_matched;
        if(cpu_color == 2){
            _kif_matched = white_kif.filter(value => value.match(reg));
        }else{
            _kif_matched = black_kif.filter(value => value.match(reg));
        }
        
        if(!_kif_matched.length){
            showLog("ブラックモードになっていますが棋譜DBの内容から外れたので終了します");
            blackmode = false;
            normal_play = true;
        }else{
            kif_length = _kif_matched.length;
            const num = Math.floor( Math.random() * _kif_matched.length ) ;
            const play_kif = _kif_matched[num].replace(kif, "").substr( 0, 2 );
            good_place[0] = Number(play_kif[0].replace("a","0").replace("b","1").replace("c","2").replace("d","3").replace("e","4").replace("f","5").replace("g","6").replace("h","7"));
            good_place[1] = Number(play_kif[1]) - 1;
        }

    }
    
    if(normal_play){

        
        
        let judge;
        for(let x=0; x<8; x++){
            for(let y=0; y<8; y++){
                judge = placeCheck(x, y, cpu_color);

                
                if(judge[0] > 0){

                    let _testmap = JSON.parse(JSON.stringify(b_arr)); //配列コピー
                    _testmap[y][x] = cpu_color;
                    String(judge[1]).split(',').forEach(posi => {
                        _testmap[posi[1]][posi[0]] = cpu_color;
                    });

                    if(progress < 40){
                        const test_count = (4 - judge[0]) + cpu_arr[y][x]
                        if(test_count > good_count && guess(_testmap, my_color) != 999){
                            //console.log("序盤")
                            good_place = [x, y];
                            good_count = test_count;
                        }else if(good_count == 0){
                            good_place = [x, y];
                            good_count = test_count;
                            if(guess(_testmap, my_color) == 999){
                                good_count = -999;
                            }
                        }else if(guess(_testmap, my_color) != 999 && good_count == -999){
                            if(good_count == -999 && guess(_testmap, my_color) != 999){
                                showLog("角を取られる危険をぎりぎり回避しました");
                                comment("あぶなっ", "aqua", 3);
                            }
                            good_place = [x, y];
                            good_count = 999;
                        }else if(test_count == good_count && guess(_testmap, my_color) != 999 && Math.floor( Math.random() * 2 ) == 0){
                            good_place = [x, y];
                            good_count = test_count;
                        }
                    }else if((judge[0] + cpu_arr2[y][x]) > good_count){
                                                
                            let judge2 = guess(_testmap, my_color); //相手が取れる最善手スコア
                            
                            if(judge2 < (judge[0] + cpu_arr2[y][x]) && judge2 != 999){
                                console.log([x, y]+ "(" + (judge[0] + cpu_arr2[y][x]) + ")は相手("+judge2+")より良い手");
                                if(good_count == -999 && judge2 != 999){
                                    showLog("角を取られる危険を回避しました");
                                    comment("上手だな～・・", "aqua", 3);
                                }

                                good_place = [x, y];
                                good_count = judge[0] + cpu_arr2[y][x];
                                
                                //showLog(good_place + "におけば"+judge[0] + "こ取れる")
                            }else if(good_count == 0){
                                console.log([x, y]+ "(" + (judge[0] + cpu_arr2[y][x]) + ")は相手("+judge2+")より悪い手");
                                good_place = [x, y];
                                good_count = judge2 * -1;
                            }else if(judge2 != 999 && good_count == -999){
                                if(good_count == -999 && judge2 != 999){
                                    showLog("角を取られる危険をぎりぎり回避しました");
                                    comment("角は譲らないよ！！", "aqua", 3);
                                }
                                good_place = [x, y];
                                good_count = judge[0] + cpu_arr2[y][x];
                            }else if(judge2 < (judge[0] + cpu_arr2[y][x]) && judge2 != 999 && Math.floor( Math.random() * 2 ) == 0){
                                good_place = [x, y];
                                good_count = judge[0] + cpu_arr2[y][x];
                            }
                            
                            
                        
                    }
                }
            }
        }

    }



    

    if(good_count > 25){
        comment("えへへ～", "rgba(93, 241, 180, 0.842)");
    }else if(good_count > 15){
        comment("どうだーっ", "rgba(163, 211, 255, 0.842)", 2);
    }
    
    if(normal_play){
        showLog("あいす丸は評価点" + good_count + "の" + good_place + "に置きました");
    }else{
        showLog("あいす丸は棋譜DBを読み込んでよさそうな場所に置きました(Matched:" + kif_length + ")");
    }
    
    place(cpu_color, good_place[0], good_place[1]);

    
    
}

/* 推測 */
function guess(map, player) {
    let good_place = [-1, -1];
    let good_count = 0;
    let kiken;
    let judge;
    let current_cpu_arr;
    if(progress < 40){
        current_cpu_arr = cpu_arr;
    }else{
        current_cpu_arr = cpu_arr2;
    }

    for(let x=0; x<8; x++){
        for(let y=0; y<8; y++){
            judge = placeCheck(x, y, player, map);
            
            if(judge[0] > 0 && (judge[0] + current_cpu_arr[y][x]) > good_count){
                    
                good_place = [x, y];
                if(judge[0] + current_cpu_arr[y][x] >= 50){
                    good_count = 999;
                }else{
                    good_count = judge[0] + current_cpu_arr[y][x];
                }
                
                    
            }
        }
    }


    return good_count;
}



/* 置ける場所があるか確認 */
function canPlace(player) {
    let good_place = [-1, -1];
    for(let x=0; x<8; x++){
        for(let y=0; y<8; y++){
            let judge = placeCheck(x, y, player);
            if(judge[0] > 0){
                return true;
            }
        }
    }
    return false;
}

/* プレイヤーパスチェック */
function playerPass() {
    if(!playing) return;

    if(!canPlace(my_color)){
        
        playing = 2;
        stat_text = "あいす丸のターン";
        cngStat();
        cpuTurn();
    }else{
        comment("置ける場所、あると思うよ！","pink");
        return;
    }
}

/* 終了確認 */
function endCheck() {
    count = count_koma();

    //console.log("あなた:" + count[0] + "あいす丸:" + count[1]);

    if(count[0] + count[1] == 64 || count[0] == 0 || count[1] == 0 || pass_count == 2){
        let msg = "ゲームセット！ <b>あなた:" + count[0] + "あいす丸:" + count[1]+ "</b> 　\n";
        if(count[0] > count[1]){
            if(count[1] == 0){
                msg = msg + "強すぎるよ・・・";
            }else if(count[0] > 55){
                msg = msg + "強かった～・・・";
            }else if(count[0] > 40){
                msg = msg + "まけたーーー";
            }else if(count[0] > 35){
                msg = msg + "くやしいいいいいい";
            }else{
                msg = msg + "まけちゃった！！？！？";
            }
        }
        if(count[1] > count[0]){
            if(count[0] == 0){
                msg = msg + "んふふーーー！";
            }else if(count[1] > 55){
                msg = msg + "余裕！！";
            }else if(count[1] > 40){
                msg = msg + "やった～";
            }else if(count[1] > 35){
                msg = msg + "あぶなかった～～";
            }else{
                msg = msg + "勝てたの！？よかった・・";
            }
        }
        if(count[0] == count[1]) msg = msg + "引き分けだー";
        
        playing = 0;
        setTimeout(endgame(msg), 100);
    }
}

/* コマカウント */
function count_koma() {
    let count = [0, 0];
    for(let x=0; x<8; x++){
        for(let y=0; y<8; y++){
            if(b_arr[y][x] == my_color){
                count[0]++;
            }else if(b_arr[y][x] == cpu_color){
                count[1]++;
            }
        }
    }
    progress = Math.floor((count[0] + count[1] + 1) / 64 * 100);
    return count;
}

/* ゲームリザルト */
function endgame(msg) {
    let _msg = msg.split('\n');
    stat_text = _msg[0];
    cngStat();
    comment(_msg[1]);
}

/* 効果音再生 */
function playSE() {
    se.pause();
    se.currentTime = 0;
    se.play();
}

/* プレイヤー手に対するあいす丸のコメントを得る */
function getComment(param) {
    let p_score = param[0] + cpu_arr[param[1]][param[2]];
    if(p_score > 25){
        comment("あああっ！", "pink");
    }else if(p_score > 15){
        comment("うまい");
    }
    return;
}


/* あいす丸コメント表示 */
function comment(str, _color = "rgba(220, 220, 220, 0.842)", kakuritu = 1) {
    if(Math.floor( Math.random() * kakuritu ) != 0) return;

    document.getElementsByClassName("balloon-text")[0].innerHTML = str;
    $('.balloon').css('background-color', _color);
    $('.icemaru').hide();
    $('.icemaru').fadeIn("slow", function () {
        $(this).delay(2000).fadeOut("slow");
      });

      return;
}

/* URLクエリ処理用 */
function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function showLog(str) {
    if(getParam('debug') == 1){
        console.log(str);
    }
}

//F12デバッグ用
function showKif() {
    console.log(kif);
}