// The documents as data, the share lines and the share-sheet copy (loaded on demand with the sheet).
// A document: title, two to four rows, a verdict, one line of small print, the call line by the QR.
// knock 功德结算单, smash 事故认定书, squish 谅解书, scratch 兑奖凭证 / 中奖凭证, purr (its own receipt), and the
// default document the other toys fall back to.
import { locale, tx, type Locale, type ToyId } from './i18n'
import { MINE, bunQuery, canon, catQuery, encodeWords, hopOut, landing, live, stats, store, type Method, type Peak } from './share'

export interface Look {
  surface: [string, string]
  grain: string
  paper: string
  ink: string
  faint: string
  accent: string
  accent2: string
}
export interface Doc {
  look: Look
  title: string
  seal?: string
  rows: [string, string][]
  /** a note instead of a form (squish): one paragraph where the rows would be */
  body?: string
  /** where the snapshot's centre of interest is, top 0 to bottom 1 (default 0.5) */
  focus?: number
  /** a picture of its own (scratch's unscratched gift ticket), shown whole rather than cropped */
  snap?: HTMLCanvasElement | null
  contain?: boolean
  verdict: string
  small: string
  call: string
  host: string
}

// ---------- copy ----------

const SHEET = {
  en: {
    heading: 'Send it to someone who gets it',
    primary: 'Send to a friend',
    reply: 'Your turn back',
    link: 'Link only',
    save: 'Save image',
    hold: 'Press and hold the picture to send or save',
    shot: 'Cannot save? A screenshot works too',
    copy_image: 'Copy image',
    copy_link: 'Copy link',
    copied: 'Copied. Go and paste it.',
    download: 'Download',
    close: 'Close',
    call: 'Scan to take your turn',
  },
  'zh-CN': {
    heading: '发给一个懂的人',
    primary: '发给朋友',
    reply: '回敬一下',
    link: '只发链接',
    save: '保存图片',
    hold: '长按图片，发给朋友或保存',
    shot: '保存不了？直接截图也行',
    copy_image: '复制图片',
    copy_link: '复制链接',
    copied: '已复制，去粘贴吧',
    download: '下载',
    close: '关闭',
    call: '长按识别，回敬一下',
  },
  es: {
    heading: 'Mándaselo a alguien que lo pille',
    primary: 'Enviar a un amigo',
    reply: 'Ahora te toca a ti',
    link: 'Solo el enlace',
    save: 'Guardar imagen',
    hold: 'Mantén pulsada la imagen para enviarla o guardarla',
    shot: '¿No se guarda? Una captura también vale',
    copy_image: 'Copiar imagen',
    copy_link: 'Copiar enlace',
    copied: 'Copiado. Ahora pégalo.',
    download: 'Descargar',
    close: 'Cerrar',
    call: 'Escanea y te toca a ti',
  },
  fr: {
    heading: 'À envoyer à quelqu’un qui comprendra',
    primary: 'Envoyer à un ami',
    reply: 'À vous de renvoyer',
    link: 'Juste le lien',
    save: 'Enregistrer l’image',
    hold: 'Appuyez longuement sur l’image pour l’envoyer ou l’enregistrer',
    shot: 'Ça ne s’enregistre pas ? Une capture d’écran marche aussi',
    copy_image: 'Copier l’image',
    copy_link: 'Copier le lien',
    copied: 'Copié. Il ne reste qu’à coller.',
    download: 'Télécharger',
    close: 'Fermer',
    call: 'Scannez : à vous de jouer',
  },
  ja: {
    heading: 'わかってくれる人に送ろう',
    primary: '友だちに送る',
    reply: 'お返しする',
    link: 'リンクだけ',
    save: '画像を保存',
    hold: '画像を長押しして送信・保存',
    shot: '保存できない？スクショでもOK',
    copy_image: '画像をコピー',
    copy_link: 'リンクをコピー',
    copied: 'コピーしました。貼りつけてどうぞ。',
    download: 'ダウンロード',
    close: '閉じる',
    call: '読み取って、お返しを',
  },
} satisfies Record<Locale, Record<string, string>>
export const S = SHEET[locale]
export const fileName = (toy: ToyId) => `${toy}-integ-life.png`

/** knock: 功德结算单 / Merit Statement. {n} is today's count, by hand and outsourced together. */
const KNOCK = {
  en: {
    title: 'Merit Statement',
    seal: 'MERIT',
    today: ['Merit today', '+{n}'],
    sticks: ['Incense burned', '{s} sticks'],
    sticks1: ['Incense burned', '1 stick'],
    words: ['Itemised', '“{w}” × {n}'],
    auto: ['Outsourced', '{m}'],
    fast: ['Told to slow down', '{k}'],
    v0: '“Not open for business yet”',
    v1: '“Last-minute believer”',
    v2: '“Casually devout”',
    v3: '“Office bodhisattva”',
    v4: '“Infinite merit (digital only)”',
    small: 'Merit is non-refundable and cannot be exchanged for annual leave.',
    done: 'I knocked through {s} sticks of incense. Merit +{n}. I lit one for you:',
    done1: 'I knocked through a stick of incense. Merit +{n}. I lit one for you:',
    invite: 'Someone lit a stick of incense for you. One knock, merit +1:',
    reply: 'Light one back',
  },
  'zh-CN': {
    title: '功德结算单',
    seal: '功德',
    today: ['今日功德', '+{n}'],
    sticks: ['烧完香', '{s} 炷'],
    sticks1: ['烧完香', '1 炷'],
    words: ['明细', '「{w}」× {n}'],
    auto: ['外包代敲', '{m} 下'],
    fast: ['手速过快被提醒', '{k} 次'],
    v0: '「尚未开张」',
    v1: '「临时抱佛脚」',
    v2: '「佛系打工人」',
    v3: '「工位活菩萨」',
    v4: '「功德无量（仅限电子）」',
    small: '功德不可提现，不可抵扣加班。',
    done: '我敲完了 {s} 炷香，功德 +{n}。给你也点了一炷，敲吧：',
    done1: '我敲完了 1 炷香，功德 +{n}。给你也点了一炷，敲吧：',
    invite: '有人给你点了一炷香。敲一下，功德 +1：',
    reply: '回敬一炷',
  },
  es: {
    title: 'Extracto de méritos',
    seal: 'MÉRITO',
    today: ['Méritos hoy', '+{n}'],
    sticks: ['Incienso quemado', '{s} varitas'],
    sticks1: ['Incienso quemado', '1 varita'],
    words: ['Desglose', '«{w}» × {n}'],
    auto: ['Subcontratado', '{m}'],
    fast: ['Avisos por ir deprisa', '{k}'],
    v0: '«Aún sin abrir al público»',
    v1: '«Creyente de última hora»',
    v2: '«Devoto, pero sin agobios»',
    v3: '«Bodhisattva de oficina»',
    v4: '«Mérito infinito (solo digital)»',
    small: 'Los méritos no se reembolsan ni se canjean por días de vacaciones.',
    done: 'Me he fundido {s} varitas de incienso. Mérito +{n}. Te he encendido una:',
    done1: 'Me he fundido una varita de incienso. Mérito +{n}. Te he encendido otra:',
    invite: 'Alguien te ha encendido una varita de incienso. Un golpe, mérito +1:',
    reply: 'Devuélvele una varita',
  },
  fr: {
    title: 'Relevé de mérites',
    seal: 'MÉRITE',
    today: ['Mérite du jour', '+{n}'],
    sticks: ['Encens brûlé', '{s} bâtons'],
    sticks1: ['Encens brûlé', '1 bâton'],
    words: ['Détail', '« {w} » × {n}'],
    auto: ['Sous-traité', '{m}'],
    fast: ['Rappels : trop vite', '{k}'],
    v0: '« Pas encore ouvert au public »',
    v1: '« Croyant de dernière minute »',
    v2: '« Pieux, mais détendu »',
    v3: '« Bodhisattva de bureau »',
    v4: '« Mérite infini (numérique uniquement) »',
    small: 'Mérite non remboursable, non convertible en jours de congé.',
    done: 'J’ai brûlé {s} bâtons d’encens. Mérite +{n}. J’en ai allumé un pour vous :',
    done1: 'J’ai brûlé un bâton d’encens. Mérite +{n}. J’en ai allumé un pour vous :',
    invite: 'Quelqu’un a allumé un bâton d’encens pour vous. Un coup, mérite +1 :',
    reply: 'Rendre la pareille',
  },
  ja: {
    title: '功徳明細書',
    seal: '功徳',
    today: ['本日の功徳', '+{n}'],
    sticks: ['燃やした線香', '{s} 本'],
    sticks1: ['燃やした線香', '1 本'],
    words: ['内訳', '「{w}」× {n}'],
    auto: ['外注', '{m} 回'],
    fast: ['叩きすぎ注意', '{k} 回'],
    v0: '「まだ開店前」',
    v1: '「駆け込み信心」',
    v2: '「ゆるふわ信者」',
    v3: '「デスクの生き菩薩」',
    v4: '「功徳無量（デジタル限定）」',
    small: '功徳は換金できません。有給休暇にも換えられません。',
    done: '線香 {s} 本ぶん叩きました。功徳 +{n}。あなたの分も一本つけておきました：',
    done1: '線香 1 本ぶん叩きました。功徳 +{n}。あなたの分も一本つけておきました：',
    invite: 'あなたのために線香が一本。ひと叩きで功徳 +1：',
    reply: '一本お返し',
  },
} satisfies Record<Locale, Record<string, string | string[]>>

/** smash: 事故认定书 / Incident Report. */
const SMASH = {
  en: {
    title: 'Incident Report',
    cause: ['Cause', '“{w}”'],
    damage: ['Damage', '{n} panes of tempered glass'],
    damage1: ['Damage', '1 pane of tempered glass'],
    fault: ['Fault', 'the glass, 100%'],
    verdict: '“Suspect’s mood: much improved”',
    small: 'Not valid for expense claims.',
    done: 'I smashed “{w}”. Much better. I saved you a pane:',
    done0: 'I smashed {n} panes of glass. Much better. I saved you one:',
    invite: 'Someone left you a pane of glass. It says “{w}”:',
    reply: 'Send one back',
  },
  'zh-CN': {
    title: '事故认定书',
    cause: ['事故原因', '「{w}」'],
    damage: ['损失', '钢化玻璃 {n} 块'],
    damage1: ['损失', '钢化玻璃 1 块'],
    fault: ['责任认定', '玻璃全责'],
    verdict: '「当事人情绪：稳定多了」',
    small: '本单不可用于报销。',
    done: '我把「{w}」砸了，舒服了。这块留给你：',
    done0: '我砸了 {n} 块玻璃，舒服了。这块留给你：',
    invite: '有人留了块玻璃给你，上面写着「{w}」：',
    reply: '回敬一块',
  },
  es: {
    title: 'Atestado del siniestro',
    cause: ['Causa', '«{w}»'],
    damage: ['Daños', '{n} lunas de vidrio templado'],
    damage1: ['Daños', '1 luna de vidrio templado'],
    fault: ['Responsable', 'el cristal, 100 %'],
    verdict: '«Estado de ánimo del implicado: mucho mejor»',
    small: 'No válido para notas de gastos.',
    done: 'He reventado «{w}». Mucho mejor. Te he guardado un cristal:',
    done0: 'He reventado {n} cristales. Mucho mejor. Te he guardado uno:',
    invite: 'Alguien te ha dejado un cristal. Pone «{w}»:',
    reply: 'Devuélvele uno',
  },
  fr: {
    title: 'Constat d’incident',
    cause: ['Cause', '« {w} »'],
    damage: ['Dégâts', '{n} vitres en verre trempé'],
    damage1: ['Dégâts', '1 vitre en verre trempé'],
    fault: ['Responsabilité', 'la vitre, à 100 %'],
    verdict: '« Humeur du suspect : bien meilleure »',
    small: 'Non valable pour une note de frais.',
    done: 'J’ai pulvérisé « {w} ». Ça va mieux. Je vous ai gardé une vitre :',
    done0: 'J’ai pulvérisé {n} vitres. Ça va mieux. Je vous en ai gardé une :',
    invite: 'Quelqu’un vous a laissé une vitre. Il y a écrit « {w} » :',
    reply: 'En renvoyer une',
  },
  ja: {
    title: '事故証明書',
    cause: ['事故原因', '「{w}」'],
    damage: ['損害', '強化ガラス {n} 枚'],
    damage1: ['損害', '強化ガラス 1 枚'],
    fault: ['過失割合', 'ガラス 100%'],
    verdict: '「当事者の気分：だいぶ落ち着いた」',
    small: '経費精算には使えません。',
    done: '「{w}」を割りました。すっきり。あなたの分も一枚残しておきました：',
    done0: 'ガラスを {n} 枚割りました。すっきり。あなたの分も一枚：',
    invite: 'あなたにガラスが一枚。「{w}」と書いてあります：',
    reply: '一枚お返し',
  },
} satisfies Record<Locale, Record<string, string | string[]>>

/** squish: 谅解书 / Letter of Forgiveness. A note, not a form: one paragraph instead of rows. */
const SQUISH = {
  en: {
    title: 'Letter of Forgiveness',
    body: 'I, the bun known as “{name}”, was squeezed {n} times today and flattened {k} times. Having slowly risen, I forgive you.',
    body0: 'I, a bun, was squeezed {n} times today and flattened {k} times. Having slowly risen, I forgive you.',
    verdict: '“Do not let it happen again. (It may happen again.)”',
    small: 'Signed in flour.',
    done: 'I squeezed “{name}” {n} times and it forgave me. Your turn:',
    done0: 'I squeezed a bun {n} times and it forgave me. Your turn:',
    invite: 'Someone handed you “{name}”. Squeeze:',
    reply: 'Send one back',
  },
  'zh-CN': {
    title: '谅解书',
    body: '本团子「{name}」今日被捏 {n} 下，捏扁 {k} 次。经慢慢回弹，现已原谅当事人。',
    body0: '本团子今日被捏 {n} 下，捏扁 {k} 次。经慢慢回弹，现已原谅当事人。',
    verdict: '「下不为例（可以为例）」',
    small: '立书团：按粉印为证。',
    done: '「{name}」被我捏了 {n} 下，它原谅我了。轮到你：',
    done0: '我把团子捏了 {n} 下，它原谅我了。轮到你：',
    invite: '有人把「{name}」交给你了。捏：',
    reply: '回敬一只',
  },
  es: {
    title: 'Carta de perdón',
    body: 'Yo, el bollo llamado «{name}», he sido apretado {n} veces hoy y aplastado {k}. Tras subir despacito, te perdono.',
    body0: 'Yo, un bollo, he sido apretado {n} veces hoy y aplastado {k}. Tras subir despacito, te perdono.',
    verdict: '«Que no se repita. (Puede repetirse.)»',
    small: 'Firmado con harina.',
    done: 'He apretado a «{name}» {n} veces y me ha perdonado. Te toca:',
    done0: 'He apretado un bollo {n} veces y me ha perdonado. Te toca:',
    invite: 'Alguien te ha dejado a «{name}». Apriétalo:',
    reply: 'Devuélvele uno',
  },
  fr: {
    title: 'Lettre de pardon',
    body: 'Moi, la brioche nommée « {name} », j’ai été pressée {n} fois aujourd’hui et aplatie {k} fois. Ayant lentement regonflé, je vous pardonne.',
    body0: 'Moi, une brioche, j’ai été pressée {n} fois aujourd’hui et aplatie {k} fois. Ayant lentement regonflé, je vous pardonne.',
    verdict: '« Que cela ne se reproduise pas. (Cela peut se reproduire.) »',
    small: 'Signé à la farine.',
    done: 'J’ai pressé « {name} » {n} fois et elle m’a pardonné. À vous :',
    done0: 'J’ai pressé une brioche {n} fois et elle m’a pardonné. À vous :',
    invite: 'Quelqu’un vous a confié « {name} ». Pressez :',
    reply: 'En renvoyer une',
  },
  ja: {
    title: '許し状',
    body: '私、団子「{name}」は本日 {n} 回つままれ、{k} 回つぶされました。ゆっくり膨らみ直しましたので、許します。',
    body0: '私、団子は本日 {n} 回つままれ、{k} 回つぶされました。ゆっくり膨らみ直しましたので、許します。',
    verdict: '「二度としないように（してもいい）」',
    small: '粉の手形をもって証とする。',
    done: '「{name}」を {n} 回つまんだら、許してくれました。次はあなた：',
    done0: '団子を {n} 回つまんだら、許してくれました。次はあなた：',
    invite: '「{name}」を託されました。つまんで：',
    reply: '一個お返し',
  },
} satisfies Record<Locale, Record<string, string>>

/** scratch: the gift ticket (sender), 兑奖凭证 (recipient after the reveal), 中奖凭证 (an ordinary win). */
const SCRATCH = {
  en: {
    call_gift: 'Scan to scratch it',
    gift: 'A Scratch Card for You',
    gift_v: '“I wrote the prize myself”',
    claim: 'Prize Claim',
    prize: 'Prize',
    how: 'To claim',
    how_gift: 'send this to whoever wrote it',
    claim_v: '“When do I collect?”',
    small: 'Subject to the writer’s conscience.',
    win: 'Winning Ticket',
    win_v: '“Better odds than my raise”',
    win_small: 'No cash value. No cash at all.',
    how_slack: 'start staring now',
    how_coffee: 'find someone to pay',
    how_nap: 'close your eyes, quietly',
    how_cat: 'open purr.integ.life',
    how_merit: 'knock once on the wood',
    how_dayoff: 'show this to your manager',
    done_gift: 'I left you a scratch card. I wrote the prize myself. Scratch it:',
    done_claim: 'I scratched it: “{w}”. When do I collect?',
    done_win: '{n} cards, {k} wins. Better odds than my raise. I left you one:',
    primary: 'Claim it',
    reply: 'Leave one for them',
  },
  'zh-CN': {
    call_gift: '长按识别，刮开它',
    gift: '给你的刮刮卡',
    gift_v: '「奖品是我亲手写的」',
    claim: '兑奖凭证',
    prize: '奖品',
    how: '兑奖方式',
    how_gift: '把这张图发回给出题人',
    claim_v: '「什么时候兑？」',
    small: '最终解释权归写奖品的人。',
    win: '中奖凭证',
    win_v: '「比加薪概率高」',
    win_small: '本券不可兑换现金，也没有现金。',
    how_slack: '现在就发呆',
    how_coffee: '找个人请你',
    how_nap: '闭眼，别出声',
    how_cat: '打开 purr.integ.life',
    how_merit: '敲一下木鱼',
    how_dayoff: '拿给领导看',
    done_gift: '给你留了张刮刮卡，奖品我亲手写的。刮开：',
    done_claim: '我刮出来了：「{w}」。什么时候兑？',
    done_win: '我刮了 {n} 张，中了 {k} 张，比加薪概率高。给你留了一张：',
    primary: '找 TA 兑奖',
    reply: '也给 TA 留一张',
  },
  es: {
    call_gift: 'Escanea y ráscalo',
    gift: 'Un rasca para ti',
    gift_v: '«El premio lo he escrito yo»',
    claim: 'Resguardo de premio',
    prize: 'Premio',
    how: 'Para cobrar',
    how_gift: 'mándaselo a quien lo escribió',
    claim_v: '«¿Cuándo lo cobro?»',
    small: 'Sujeto a la conciencia de quien lo escribió.',
    win: 'Boleto premiado',
    win_v: '«Más probable que mi aumento»',
    win_small: 'Sin valor en efectivo. Sin efectivo, en general.',
    how_slack: 'empieza a mirar la pared ya',
    how_coffee: 'busca quien invite',
    how_nap: 'cierra los ojos, sin ruido',
    how_cat: 'abre purr.integ.life',
    how_merit: 'da un golpe a la madera',
    how_dayoff: 'enséñaselo a tu jefe',
    done_gift: 'Te he dejado un rasca. El premio lo he escrito yo. Ráscalo:',
    done_claim: 'Lo he rascado: «{w}». ¿Cuándo lo cobro?',
    done_win: '{n} rascas, {k} premios. Más probable que mi aumento. Te he dejado uno:',
    primary: 'Reclamar el premio',
    reply: 'Dejarle uno a esa persona',
  },
  fr: {
    call_gift: 'Scannez et grattez',
    gift: 'Un ticket à gratter pour vous',
    gift_v: '« Le lot, je l’ai écrit moi-même »',
    claim: 'Bon de retrait',
    prize: 'Lot',
    how: 'Pour le retirer',
    how_gift: 'renvoyez ceci à qui l’a écrit',
    claim_v: '« C’est quand, que je passe le chercher ? »',
    small: 'Sous réserve de la conscience de l’auteur.',
    win: 'Ticket gagnant',
    win_v: '« Plus probable que mon augmentation »',
    win_small: 'Sans valeur monétaire. Sans monnaie du tout.',
    how_slack: 'fixez le mur, dès maintenant',
    how_coffee: 'trouvez qui paie',
    how_nap: 'fermez les yeux, sans bruit',
    how_cat: 'ouvrez purr.integ.life',
    how_merit: 'frappez une fois le bois',
    how_dayoff: 'montrez-le à votre chef',
    done_gift: 'Je vous ai laissé un ticket à gratter. Le lot, je l’ai écrit moi-même. Grattez :',
    done_claim: 'J’ai gratté : « {w} ». C’est quand, que je passe le chercher ?',
    done_win: '{n} tickets, {k} gagnants. Plus probable que mon augmentation. Je vous en ai laissé un :',
    primary: 'Réclamer le lot',
    reply: 'Lui en laisser un',
  },
  ja: {
    call_gift: '読み取って、削ってみて',
    gift: 'あなた宛てのスクラッチ',
    gift_v: '「賞品は手書きです」',
    claim: '引換証',
    prize: '賞品',
    how: '引換方法',
    how_gift: 'この画像を書いた人に送り返す',
    claim_v: '「いつもらえる？」',
    small: '最終的な解釈は書いた人の良心に委ねます。',
    win: '当選証',
    win_v: '「昇給より当たる」',
    win_small: '換金不可。そもそも現金なし。',
    how_slack: '今すぐぼーっとする',
    how_coffee: 'おごってくれる人を探す',
    how_nap: '目を閉じる。静かに',
    how_cat: 'purr.integ.life を開く',
    how_merit: '木魚をひと叩き',
    how_dayoff: '上司に見せる',
    done_gift: 'スクラッチを一枚置いておきました。賞品は手書きです。削って：',
    done_claim: '削りました：「{w}」。いつもらえる？',
    done_win: '{n} 枚削って {k} 枚当たり。昇給より当たる。あなたにも一枚：',
    primary: '引き換えを頼む',
    reply: 'お返しに一枚置く',
  },
} satisfies Record<Locale, Record<string, string>>
/** the built-in prizes, in the order the game numbers them for the card (data.prize) */
export const PRIZES = ['slack', 'coffee', 'nap', 'cat', 'merit', 'dayoff'] as const

/** purr: the receipt is drawn by the toy (receipt.ts); these are its share lines and the recipient's button. */
const PURR = {
  en: {
    done: 'I paid {name}’s cat tax. Rated {r}/5, fell for the belly {t} times. Cover my shift:',
    done0: 'I paid the cat tax. Rated {r}/5, fell for the belly {t} times. Cover my shift:',
    invite: 'There is a cat waiting to be petted. Mind the belly:',
    reply: 'Send the receipt back',
  },
  'zh-CN': {
    done: '{name}的猫税我交了，评分 {r}/5，中计 {t} 次。你来代个班：',
    done0: '猫税我交了，评分 {r}/5，中计 {t} 次。你来代个班：',
    invite: '有只猫等人摸。小心肚皮：',
    reply: '把小票寄回去',
  },
  es: {
    done: 'He pagado el impuesto gatuno de {name}. Nota {r}/5, caí {t} veces en la trampa de la barriga. Cúbreme el turno:',
    done0: 'He pagado el impuesto gatuno. Nota {r}/5, caí {t} veces en la trampa de la barriga. Cúbreme el turno:',
    invite: 'Hay un gato esperando caricias. Ojo con la barriga:',
    reply: 'Devolver el tique',
  },
  fr: {
    done: 'J’ai payé la taxe à chat de {name}. Note {r}/5, tombé {t} fois dans le piège du ventre. Prenez le relais :',
    done0: 'J’ai payé la taxe à chat. Note {r}/5, tombé {t} fois dans le piège du ventre. Prenez le relais :',
    invite: 'Un chat attend des caresses. Attention au ventre :',
    reply: 'Renvoyer le ticket',
  },
  ja: {
    done: '{name}の猫税、払いました。評価 {r}/5、お腹の罠に {t} 回。代わりにシフト入って：',
    done0: '猫税、払いました。評価 {r}/5、お腹の罠に {t} 回。代わりにシフト入って：',
    invite: '撫でられ待ちの猫がいます。お腹に注意：',
    reply: 'レシートを送り返す',
  },
} satisfies Record<Locale, Record<string, string>>

// ---------- looks (the toy's own surface and paper) ----------

const DARK: Look = { surface: ['#1b1b22', '#0c0c12'], grain: 'rgba(255,255,255,0.025)', paper: '#F7F4EC', ink: '#22201C', faint: 'rgba(34,32,28,0.5)', accent: '#22201C', accent2: 'rgba(34,32,28,0.35)' }
const LOOKS: Partial<Record<ToyId, Look>> = {
  knock: { surface: ['#2a1a10', '#120b06'], grain: 'rgba(255,214,160,0.035)', paper: '#FBF3E2', ink: '#3A1A0C', faint: 'rgba(58,26,12,0.5)', accent: '#9E1B1B', accent2: '#C9A24A' },
  charge: { surface: ['#0d2a3a', '#05121b'], grain: 'rgba(160,220,255,0.03)', paper: '#F4F7F8', ink: '#1D2A30', faint: 'rgba(29,42,48,0.5)', accent: '#C0392B', accent2: 'rgba(29,42,48,0.3)' },
  void: DARK,
  smash: { ...DARK, accent: '#B3261E' },
  pop: { surface: ['#C9A77A', '#A8835A'], grain: 'rgba(90,60,30,0.08)', paper: '#FFFDF7', ink: '#1E1E1E', faint: 'rgba(30,30,30,0.5)', accent: '#1E1E1E', accent2: 'rgba(30,30,30,0.3)' },
  purr: { surface: ['#E4CFB6', '#D6BD9F'], grain: 'rgba(120,84,56,0.08)', paper: '#FFFCF5', ink: '#3B2E24', faint: 'rgba(59,46,36,0.5)', accent: '#3B2E24', accent2: 'rgba(59,46,36,0.3)' },
  squish: { surface: ['#FBE1E6', '#F1CDD4'], grain: 'rgba(160,90,100,0.06)', paper: '#FFFBF3', ink: '#5A3B2A', faint: 'rgba(90,59,42,0.5)', accent: '#6B4A2E', accent2: 'rgba(107,74,46,0.3)' },
  scratch: { surface: ['#1d4a38', '#0f2a20'], grain: 'rgba(255,255,255,0.03)', paper: '#FFF8E7', ink: '#2A2418', faint: 'rgba(42,36,24,0.5)', accent: '#8A6A12', accent2: 'rgba(138,106,18,0.4)' },
  peel: { surface: ['#ECE7DF', '#DCD5CA'], grain: 'rgba(80,70,60,0.05)', paper: '#FFFFFF', ink: '#26302A', faint: 'rgba(38,48,42,0.5)', accent: '#2E7D32', accent2: 'rgba(46,125,50,0.35)' },
}
const look = (toy: ToyId) => LOOKS[toy] ?? LOOKS.purr!

// ---------- the link and the author ----------


/** base64url of the UTF-8 text: scratch's prize travels as `g` so the address does not spoil it */
export const b64u = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

/** The five toys with something to send have a /g/ page: same app, a link preview that says so. */
const GIFT_PAGE: ToyId[] = ['knock', 'smash', 'scratch', 'squish', 'purr']

export function shareUrl(toy: ToyId, method?: Method): string {
  let q = ''
  if (toy === 'scratch' && stats.words?.length) q = `?g=${b64u(stats.words.join(','))}`
  else if ((toy === 'smash' || toy === 'knock' || toy === 'stamp') && stats.words?.length) q = `?w=${encodeWords(stats.words)}`
  else if (toy === 'purr') q = catQuery(stats.name || '', stats.coat || '')
  else if (toy === 'squish') q = bunQuery(stats.name || '', stats.skin || '')
  const base = `https://${toy}.integ.life/${q && GIFT_PAGE.includes(toy) ? 'g/' : ''}`
  if (method) q += `${q ? '&' : '?'}r=${method}${hopOut()}`
  return base + q
}


/** The words / name in the address bar were written on this device (so they may go on a card). */
export function authored(): boolean {
  try {
    const c = canon(location.search)
    return !!c && c === (localStorage.getItem(MINE) || '')
  } catch {
    return false
  }
}


// ---------- share text: done form once the peak was reached in this visit, invite form otherwise ----------

const strip = (s: string) => s.replace(/^\p{Extended_Pictographic}️?\s*/u, '')
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''))

export function shareText(toy: ToyId): string {
  const n = stats.n ?? 0
  const k = stats.k ?? 0
  const mine = authored()
  const words = stats.words?.length ? stats.words.join(', ') : ''
  switch (toy) {
    case 'knock': {
      const K = KNOCK[locale]
      const p = store.peak?.data
      if (!store.done || !p) return K.invite
      return fill(p.sticks === 1 ? K.done1 : K.done, { s: p.sticks, n: p.today })
    }
    case 'smash': {
      const T = SMASH[locale]
      if (mine && words) return fill(store.done ? T.done : T.invite, { w: words })
      return store.done && n ? fill(T.done0, { n }) : tx('share_smash')
    }
    case 'scratch': {
      const T = SCRATCH[locale]
      const g = store.peak?.data.gift
      if (mine && words) return T.done_gift
      if (store.done && g && stats.words?.[g - 1]) return fill(T.done_claim, { w: stats.words[g - 1] })
      return n && k ? fill(T.done_win, { n, k }) : n ? tx('share_scratch_stat', { n, k }) : tx('share_scratch')
    }
    case 'stamp':
      return mine && words ? tx('share_stamp_words') : n ? tx('share_stamp_stat', { n, k }) : tx('share_stamp')
    case 'purr': {
      const T = PURR[locale]
      const p = store.peak?.data
      if (store.done && p) return fill(stats.name ? T.done : T.done0, { name: stats.name || '', r: (p.rating_x10 ?? 0) / 10, t: p.traps ?? 0 })
      return mine && stats.name ? tx('share_purr_name', { name: stats.name }) : T.invite
    }
    case 'squish': {
      const T = SQUISH[locale]
      if (store.done && n) return fill(stats.name ? T.done : T.done0, { name: stats.name || '', n })
      return mine && stats.name ? fill(T.invite, { name: stats.name }) : tx('share_squish')
    }
    case 'pour':
      return !n ? tx('share_pour') : stats.last === 'golden' ? tx('share_pour_golden', { n }) : tx('share_pour_stat', { n, k })
    default:
      return (n && tx(`share_${toy}_stat`, { n })) || tx(`share_${toy}`)
  }
}

/** The label on the sheet's primary button: a recipient answers back (scratch: claims the prize). */
export function primaryLabel(toy: ToyId) {
  if (!landing.recipient) return S.primary
  if (toy === 'scratch' && store.peak?.data.gift) return SCRATCH[locale].primary
  return toy === 'purr' ? PURR[locale].reply : S.reply
}

/** A recipient's answer: their own words / name, typed into the toy's box (live.reply). Empty when there is none. */
export function replyLabel(toy: ToyId): string {
  if (!landing.recipient || !live.reply || authored()) return ''
  const T = { knock: KNOCK, smash: SMASH, squish: SQUISH, scratch: SCRATCH } as Partial<Record<ToyId, Record<Locale, { reply: string }>>>
  return T[toy]?.[locale].reply ?? S.reply
}
/** On scratch the answer comes second (claiming the prize comes first); elsewhere it is the main button. */
export const replyFirst = (toy: ToyId) => toy !== 'scratch'

/** Numbers that ride along on share_done (never user text). */
export const shareExtra = (toy: ToyId): Record<string, number> =>
  toy === 'knock' && stats.n
    ? { total: stats.n }
    : toy === 'squish' && stats.n
      ? { squeezes: stats.n }
      : toy === 'scratch'
        ? { cards: stats.n ?? 0, wins: stats.k ?? 0 }
        : toy === 'peel' && stats.n
          ? { peels: stats.n }
          : toy === 'pour'
            ? { total: stats.n ?? 0, golden: stats.k ?? 0 }
            : toy === 'stamp'
              ? { total: stats.n ?? 0, denied: stats.k ?? 0 }
              : toy === 'zip' && stats.n
                ? { total: stats.n }
                : toy === 'purr' && store.peak
                  ? { traps: store.peak.data.traps ?? 0, rating_x10: store.peak.data.rating_x10 ?? 0 }
                  : {}

// ---------- the documents ----------

function knockDoc(p: Record<string, number> | null): Doc {
  const K = KNOCK[locale]
  const today = p?.today ?? 0
  const sticks = p?.sticks ?? 0
  const rows: [string, string][] = []
  if (today) rows.push([K.today[0], fill(K.today[1], { n: today })])
  if (sticks) rows.push(sticks === 1 ? [K.sticks1[0], K.sticks1[1]] : [K.sticks[0], fill(K.sticks[1], { s: sticks })])
  // the itemised line shows words only when they were typed on this device, never a sender's words
  const w = stats.words?.length && authored() ? stats.words.slice(0, 2).join('、') : ''
  if (w && p?.wordKnocks) rows.push([K.words[0], fill(K.words[1], { w: w.length > 14 ? w.slice(0, 13) + '…' : w, n: p.wordKnocks })])
  if (p?.auto) rows.push([K.auto[0], fill(K.auto[1], { m: p.auto })])
  if (p?.fast) rows.push([K.fast[0], fill(K.fast[1], { k: p.fast })])
  const verdict = !today ? K.v0 : today < 108 ? K.v1 : today < 324 ? K.v2 : today < 1080 ? K.v3 : K.v4
  return { look: look('knock'), title: K.title, seal: K.seal, rows: rows.slice(0, 4), focus: 0.5, verdict, small: K.small, call: S.call, host: 'knock.integ.life' }
}

const quote = (w: string) => (w.length > 14 ? w.slice(0, 13) + '…' : w)

/** smash: the word on the card only when it was typed on this device (a recipient's card leaves it out). */
function smashDoc(p: Record<string, number> | null): Doc {
  const T = SMASH[locale]
  const n = p?.panes ?? stats.n ?? 0
  const rows: [string, string][] = []
  const w = stats.words?.length && authored() ? stats.words[0] : ''
  if (w) rows.push([T.cause[0], fill(T.cause[1], { w: quote(w) })])
  if (n) rows.push(n === 1 ? [T.damage1[0], T.damage1[1]] : [T.damage[0], fill(T.damage[1], { n })])
  rows.push([T.fault[0], T.fault[1]])
  return { look: look('smash'), title: T.title, rows, focus: 0.5, verdict: T.verdict, small: T.small, call: S.call, host: 'smash.integ.life' }
}

function squishDoc(p: Record<string, number> | null): Doc {
  const T = SQUISH[locale]
  const v = { name: quote(stats.name || ''), n: p?.n ?? stats.n ?? 0, k: p?.k ?? stats.k ?? 0 }
  return { look: look('squish'), title: T.title, rows: [], body: fill(stats.name ? T.body : T.body0, v), focus: 0.55, verdict: T.verdict, small: T.small, call: S.call, host: 'squish.integ.life' }
}

/** scratch: the sender's unscratched gift ticket, the recipient's 兑奖凭证, or an ordinary 中奖凭证. */
function scratchDoc(p: Record<string, number> | null): Doc | null {
  const T = SCRATCH[locale]
  const base = { look: look('scratch'), focus: 0.5, contain: true, call: S.call, host: 'scratch.integ.life' }
  if (stats.words?.length && authored()) return { ...base, call: T.call_gift, title: T.gift, rows: [], snap: live.ticket?.() ?? null, verdict: T.gift_v, small: T.small }
  const g = p?.gift && stats.words?.[p.gift - 1]
  if (g) return { ...base, title: T.claim, rows: [[T.prize, quotes().join(quote(g))], [T.how, T.how_gift]], verdict: T.claim_v, small: T.small }
  const id = p?.prize ? PRIZES[p.prize - 1] : undefined
  if (id) return { ...base, title: T.win, rows: [[T.prize, quote(tx(`scratch_prize_${id}`))], [T.how, T[`how_${id}`]]], verdict: T.win_v, small: T.win_small }
  return null
}

const quotes = () => (locale === 'zh-CN' || locale === 'ja' ? ['「', '」'] : locale === 'fr' ? ['« ', ' »'] : locale === 'es' ? ['«', '»'] : ['“', '”'])

/** Every toy without its own document yet: its name and its current share line. */
function defaultDoc(toy: ToyId): Doc {
  const line = strip(shareText(toy)).replace(/\s*[:：]\s*$/, '')
  const q = quotes()
  return { look: look(toy), title: tx(`name_${toy}`), rows: [], verdict: q[0] + line + q[1], small: '', call: S.call, host: `${toy}.integ.life` }
}

export function buildDoc(toy: ToyId, peak: Peak | null): Doc {
  const p = peak?.data ?? live.data?.() ?? null
  if (toy === 'knock') return knockDoc(p)
  if (toy === 'smash') return smashDoc(p)
  if (toy === 'squish') return squishDoc(p)
  return (toy === 'scratch' && scratchDoc(p)) || defaultDoc(toy)
}
