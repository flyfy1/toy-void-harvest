// The documents as data, the share lines and the share-sheet copy (loaded on demand with the sheet).
// A document: title, two to four rows, a verdict, one line of small print, the call line by the QR.
// knock 功德结算单, smash 事故认定书, squish 谅解书, scratch 兑奖凭证 / 中奖凭证, charge 血压测量单, pop 快递签收单,
// void 失物招领, peel 撕膜证明, purr (its own receipt), and the default document the unreleased toys fall back to.
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
    how_paid_break: 'take your phone',
    how_cat_cover: 'brief the cat, then leave',
    how_boss_lunch: 'show this to your boss (at your own risk)',
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
    how_paid_break: '带上手机，从容入座',
    how_cat_cover: '把工牌挂在猫脖子上',
    how_boss_lunch: '向领导出示本凭证（后果自负）',
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
    how_paid_break: 'llévate el móvil',
    how_cat_cover: 'déjale tu silla al gato',
    how_boss_lunch: 'enséñaselo al jefe (bajo tu responsabilidad)',
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
    how_paid_break: 'prenez votre téléphone',
    how_cat_cover: 'laissez votre chaise au chat',
    how_boss_lunch: 'montrez-le à votre chef (à vos risques)',
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
    how_paid_break: 'スマホを持って離席',
    how_cat_cover: '社員証を猫にかける',
    how_boss_lunch: '部長に見せる（自己責任）',
    done_gift: 'スクラッチを一枚置いておきました。賞品は手書きです。削って：',
    done_claim: '削りました：「{w}」。いつもらえる？',
    done_win: '{n} 枚削って {k} 枚当たり。昇給より当たる。あなたにも一枚：',
    primary: '引き換えを頼む',
    reply: 'お返しに一枚置く',
  },
} satisfies Record<Locale, Record<string, string>>
/** the built-in prizes, in the order the game numbers them for the card (data.prize): append-only, scratch's prizes.ts has the same list */
export const PRIZES = 'slack coffee nap cat merit dayoff paid_break skip_meeting last_snack early_night cat_cover not_your_fault lunch_hour no_overtime left_on_read bubble_wrap monday_fuel boss_lunch squishy free_card cat_email void_pass empty_promise glass friday_mode long_weekend raise coffee_for_life early_retirement cat_promotion annual_leave million_merit'.split(' ')

/** charge: 血压单 / Blood Pressure Reading. */
const CHARGE = {
  en: {
    title: 'Blood Pressure Reading',
    who: ['Patient', 'one pufferfish'],
    blew: ['Blew up', '{n} times'],
    blew1: ['Blew up', 'once'],
    pfft: ['Lost it early (pfft)', '{p}'],
    verdict: '“It cracked before you did”',
    small: 'Doctor’s note: mute the work chat.',
    done: 'I made a pufferfish lose it {n} times. It cracked before I did. Try:',
    done1: 'I made a pufferfish lose it. It cracked before I did. Try:',
    invite: 'Hold to make a pufferfish furious. Then let go:',
  },
  'zh-CN': {
    title: '血压测量单',
    who: ['被测者', '河豚'],
    blew: ['气炸', '{n} 次'],
    blew1: ['气炸', '1 次'],
    pfft: ['没憋住（噗）', '{p} 次'],
    verdict: '「它比你先破防」',
    small: '医嘱：少看工作群。',
    done: '我把河豚气炸了 {n} 次，它比我先破防。你试试：',
    done1: '我把河豚气炸了，它比我先破防。你试试：',
    invite: '按住，把河豚气成球。松手试试：',
  },
  es: {
    title: 'Toma de tensión',
    who: ['Paciente', 'un pez globo'],
    blew: ['Explotó', '{n} veces'],
    blew1: ['Explotó', '1 vez'],
    pfft: ['Se desinfló antes (pfff)', '{p}'],
    verdict: '«Se rompió antes que tú»',
    small: 'Indicación médica: silencia el chat del trabajo.',
    done: 'He sacado de quicio a un pez globo {n} veces. Se rompió antes que yo. Prueba:',
    done1: 'He sacado de quicio a un pez globo. Se rompió antes que yo. Prueba:',
    invite: 'Mantén pulsado para enfadar a un pez globo. Luego suelta:',
  },
  fr: {
    title: 'Relevé de tension',
    who: ['Patient', 'un poisson-globe'],
    blew: ['Explosé', '{n} fois'],
    blew1: ['Explosé', '1 fois'],
    pfft: ['Craqué trop tôt (pfft)', '{p}'],
    verdict: '« Il a craqué avant vous »',
    small: 'Prescription : couper le groupe du bureau.',
    done: 'J’ai fait craquer un poisson-globe {n} fois. Il a lâché avant moi. Essayez :',
    done1: 'J’ai fait craquer un poisson-globe. Il a lâché avant moi. Essayez :',
    invite: 'Appuyez pour énerver un poisson-globe. Puis lâchez :',
  },
  ja: {
    title: '血圧測定票',
    who: ['被測定者', 'フグ'],
    blew: ['爆発', '{n} 回'],
    blew1: ['爆発', '1 回'],
    pfft: ['こらえきれず（ぷっ）', '{p} 回'],
    verdict: '「先にキレたのはフグ」',
    small: '医師より：仕事のグループは通知オフに。',
    done: 'フグを {n} 回キレさせました。先に折れたのはフグ。やってみて：',
    done1: 'フグをキレさせました。先に折れたのはフグ。やってみて：',
    invite: '長押しでフグを怒らせて、離してみて：',
  },
} satisfies Record<Locale, Record<string, string | string[]>>

/** pop: 快递签收单 / Proof of Delivery. */
const POP = {
  en: {
    title: 'Proof of Delivery',
    contents: ['Contents', 'air'],
    qty: ['Quantity', '{n} cells'],
    time: ['Time', '{s} s'],
    note: ['Note', 'one refused. Complaint filed'],
    rival: ['Rival', '{s} s'],
    verdict: '“Signed for by: someone who should be working”',
    small: 'Fragile. No longer applicable.',
    done_dud: 'I popped a whole sheet in {s}s. One bubble refused. Your go:',
    done: 'I popped a whole sheet in {s}s. Not one left. Your go:',
    invite: 'A sheet of bubble wrap that never runs out. Go on:',
  },
  'zh-CN': {
    title: '快递签收单',
    contents: ['内件', '空气'],
    qty: ['数量', '{n} 格'],
    time: ['用时', '{s} 秒'],
    note: ['备注', '一格捏不爆，已投诉'],
    rival: ['对手', '{s} 秒'],
    verdict: '「签收人：手欠本人」',
    small: '易碎品。已全部碎完。',
    done_dud: '我 {s} 秒捏完一整张泡泡纸，有一格死活不爆。你来：',
    done: '我 {s} 秒捏完一整张泡泡纸，一格不剩。你来：',
    invite: '一张捏不完的泡泡纸，来捏：',
  },
  es: {
    title: 'Albarán de entrega',
    contents: ['Contenido', 'aire'],
    qty: ['Cantidad', '{n} burbujas'],
    time: ['Tiempo', '{s} s'],
    note: ['Nota', 'una no explotó. Reclamada'],
    rival: ['Rival', '{s} s'],
    verdict: '«Firmado: alguien que debería estar trabajando»',
    small: 'Frágil. Ya no aplica.',
    done_dud: 'He reventado una hoja entera en {s} s. Una burbuja se resistió. Te toca:',
    done: 'He reventado una hoja entera en {s} s. Ni una en pie. Te toca:',
    invite: 'Una hoja de plástico de burbujas que no se acaba. Venga:',
  },
  fr: {
    title: 'Bon de livraison',
    contents: ['Contenu', 'de l’air'],
    qty: ['Quantité', '{n} bulles'],
    time: ['Durée', '{s} s'],
    note: ['Remarque', 'une a résisté. Réclamée'],
    rival: ['Adversaire', '{s} s'],
    verdict: '« Reçu par : quelqu’un qui devrait travailler »',
    small: 'Fragile. Ne s’applique plus.',
    done_dud: 'J’ai éclaté une feuille entière en {s} s. Une bulle a résisté. À vous :',
    done: 'J’ai éclaté une feuille entière en {s} s. Pas une de reste. À vous :',
    invite: 'Une feuille de papier bulle qui ne finit jamais. Allez-y :',
  },
  ja: {
    title: '配達受領書',
    contents: ['内容物', '空気'],
    qty: ['数量', '{n} 粒'],
    time: ['所要時間', '{s} 秒'],
    note: ['備考', '1 粒割れず、クレーム済み'],
    rival: ['ライバル', '{s} 秒'],
    verdict: '「受取人：仕事中のはずの本人」',
    small: '割れ物注意。すでに全部割れています。',
    done_dud: 'プチプチ 1 枚を {s} 秒で潰しました。1 粒だけ割れず。次どうぞ：',
    done: 'プチプチ 1 枚を {s} 秒で潰しました。1 粒も残さず。次どうぞ：',
    invite: '終わらないプチプチ。どうぞ：',
  },
} satisfies Record<Locale, Record<string, string | string[]>>

/** void: 失物招领 / Lost Property. Short names for the clutter (the card's own, kept short). */
const VOID = {
  en: {
    title: 'Lost Property',
    time: ['Time', '{s} s'],
    ate: 'Swallowed',
    back: ['Returned', '{item} ×1'],
    v_sock: '“The other one stays”',
    v_back: '“Nothing else is coming back”',
    v_none: '“No returns”',
    small: 'Monday will not be returned.',
    done_sock: 'I swallowed Monday in {s}s. The hole gave one sock back. Beat that:',
    done: 'I swallowed Monday in {s}s, socks and all. Beat that:',
    invite: 'Be a black hole. Swallow Monday:',
    sock: 'socks', receipt: 'receipts', keys: 'keys', charger: 'chargers', bubble: 'unread', email: 'emails', monday: 'Monday',
    r_sock: 'a sock', r_tie: 'a hair tie', r_bud: 'an earbud', r_umbrella: 'an umbrella',
  },
  'zh-CN': {
    title: '失物招领',
    time: ['用时', '{s} 秒'],
    ate: '吞没',
    back: ['已归还', '{item} ×1'],
    v_sock: '「另一只不予归还」',
    v_back: '「其余概不归还」',
    v_none: '「概不归还」',
    small: '周一概不退还。',
    done_sock: '我 {s} 秒把周一吞了，黑洞还了我一只袜子。你能更快吗：',
    done: '我 {s} 秒把周一吞了，连袜子都没剩。你能更快吗：',
    invite: '变成黑洞，把周一吸走：',
    sock: '袜子', receipt: '小票', keys: '钥匙', charger: '充电头', bubble: '未读消息', email: '客户邮件', monday: '周一',
    r_sock: '袜子', r_tie: '发圈', r_bud: '耳机', r_umbrella: '雨伞',
  },
  es: {
    title: 'Objetos perdidos',
    time: ['Tiempo', '{s} s'],
    ate: 'Tragado',
    back: ['Devuelto', '{item} ×1'],
    v_sock: '«El otro se queda»',
    v_back: '«Lo demás no vuelve»',
    v_none: '«No se aceptan devoluciones»',
    small: 'El lunes no se devuelve.',
    done_sock: 'Me he tragado el lunes en {s} s. El agujero me devolvió un calcetín. Supéralo:',
    done: 'Me he tragado el lunes en {s} s, calcetines incluidos. Supéralo:',
    invite: 'Sé un agujero negro. Trágate el lunes:',
    sock: 'calcetines', receipt: 'tiques', keys: 'llaves', charger: 'cargadores', bubble: 'no leídos', email: 'correos', monday: 'lunes',
    r_sock: 'un calcetín', r_tie: 'una goma del pelo', r_bud: 'un auricular', r_umbrella: 'un paraguas',
  },
  fr: {
    title: 'Objets trouvés',
    time: ['Durée', '{s} s'],
    ate: 'Avalé',
    back: ['Rendu', '{item} ×1'],
    v_sock: '« L’autre reste ici »',
    v_back: '« Le reste ne revient pas »',
    v_none: '« Ni repris ni échangé »',
    small: 'Le lundi ne sera pas rendu.',
    done_sock: 'J’ai avalé lundi en {s} s. Le trou m’a rendu une chaussette. Faites mieux :',
    done: 'J’ai avalé lundi en {s} s, chaussettes comprises. Faites mieux :',
    invite: 'Soyez un trou noir. Avalez lundi :',
    sock: 'chaussettes', receipt: 'tickets', keys: 'clés', charger: 'chargeurs', bubble: 'non lus', email: 'mails', monday: 'lundi',
    r_sock: 'une chaussette', r_tie: 'un élastique', r_bud: 'un écouteur', r_umbrella: 'un parapluie',
  },
  ja: {
    title: '落とし物',
    time: ['所要時間', '{s} 秒'],
    ate: '吸い込んだ物',
    back: ['返却', '{item} ×1'],
    v_sock: '「もう片方は返しません」',
    v_back: '「ほかは返しません」',
    v_none: '「返品不可」',
    small: '月曜日は返却できません。',
    done_sock: '{s} 秒で月曜日を吸い込みました。靴下が片方だけ返ってきた。もっと速く：',
    done: '{s} 秒で月曜日を吸い込みました。靴下ごと。もっと速く：',
    invite: 'ブラックホールになって、月曜日を吸い込もう：',
    sock: '靴下', receipt: 'レシート', keys: '鍵', charger: '充電器', bubble: '未読', email: 'メール', monday: '月曜日',
    r_sock: '靴下', r_tie: 'ヘアゴム', r_bud: 'イヤホン', r_umbrella: '傘',
  },
} satisfies Record<Locale, Record<string, string | string[]>>
/** void's clutter groups and returns, in the order the game numbers them for the card */
export const VOID_ATE = ['sock', 'receipt', 'keys', 'charger', 'bubble', 'email', 'monday'] as const
export const VOID_BACK = ['sock', 'tie', 'bud', 'umbrella'] as const
/** yoink (tablecloth): the props that can break, in the order the card numbers them (`top` = 1 + index) */
export const YOINK_ITEMS = ['cup', 'bowls', 'fish', 'vase', 'thermos', 'heirloom'] as const

/** yoink (tablecloth): 家庭财产损失清单 / Household Damage Report. */
const YOINK = {
  en: {
    title: 'Household Damage Report',
    cloth: ['Tablecloth', 'removed in {s} s'],
    surv: ['Survivors', '{a} of {m}'],
    loss: 'Losses',
    none: 'none',
    more: '{item} and {j} more',
    rival: ['Their table', '{r} broken'],
    small: 'Not valid as an explanation to Mum.',
    cup: 'a tea cup', bowls: 'Mum’s bowl', fish: 'the fish', vase: 'a vase', thermos: 'Grandma’s thermos', heirloom: 'the family heirloom',
    v_heirloom: '“Handed down five generations. Until today.”',
    v_bowls: '“That was a set”',
    v_fish: '“Five-second rule”',
    v_thermos: '“The outside looks fine”',
    v_k: '“They say it is good luck”',
    v_cat: '“The cat did it. It does not count.”',
    v_0: '“Nothing broke. Mum still says no.”',
    done0: 'I pulled the cloth off a table of {m}. Nothing broke. Your turn:',
    donek: 'I pulled the cloth off a table of {m} and broke {k}. See if you can do better:',
    invite: 'There is a tablecloth here with Mum’s bowls on it. Pull it:',
    back: 'Send your table back',
  },
  'zh-CN': {
    title: '家庭财产损失清单',
    cloth: ['桌布', '已抽走，用时 {s} 秒'],
    surv: ['幸存', '{a} / {m} 件'],
    loss: '损失',
    none: '无',
    more: '{item} 等 {k} 件',
    rival: ['对手', '碎了 {r} 件'],
    small: '本清单不可用于向我妈解释。',
    cup: '茶杯', bowls: '我妈的碗', fish: '那条鱼', vase: '花瓶', thermos: '奶奶的暖水瓶', heirloom: '传家宝',
    v_heirloom: '「传了五代，传到今天为止」',
    v_bowls: '「那是成套的」',
    v_fish: '「今年没有余」',
    v_thermos: '「胆碎了，壳是好的」',
    v_k: '「碎碎平安」',
    v_cat: '「猫推的，不算我的」',
    v_0: '「一件没碎。我妈还是不同意。」',
    done0: '我抽了一桌 {m} 件的桌布，一件没碎。你来：',
    donek: '我抽了一桌 {m} 件的桌布，碎了 {k} 件。你能少碎点吗：',
    invite: '这儿有张桌布，上面是我妈的碗。你来抽：',
    back: '把战报甩回去',
  },
  es: {
    title: 'Parte de daños domésticos',
    cloth: ['Mantel', 'retirado en {s} s'],
    surv: ['Supervivientes', '{a} de {m}'],
    loss: 'Bajas',
    none: 'ninguna',
    more: '{item} y {j} más',
    rival: ['Su mesa', '{r} rotos'],
    small: 'No válido como explicación ante mamá.',
    cup: 'una taza de té', bowls: 'el cuenco de mamá', fish: 'el pescado', vase: 'un jarrón', thermos: 'el termo de la abuela', heirloom: 'la reliquia de la familia',
    v_heirloom: '«Cinco generaciones. Hasta hoy.»',
    v_bowls: '«Era un juego completo»',
    v_fish: '«Regla de los cinco segundos»',
    v_thermos: '«Por fuera, como nuevo»',
    v_k: '«Dicen que trae suerte»',
    v_cat: '«Ha sido el gato. No cuenta.»',
    v_0: '«No se ha roto nada. Mamá sigue diciendo que no.»',
    done0: 'He quitado el mantel de una mesa con {m} cosas. No se ha roto nada. Te toca:',
    donek: 'He quitado el mantel de una mesa con {m} cosas y he roto {k}. A ver si lo mejoras:',
    invite: 'Aquí hay un mantel con los cuencos de mamá encima. Tira:',
    back: 'Devuélvele tu mesa',
  },
  fr: {
    title: 'Constat de dégâts domestiques',
    cloth: ['Nappe', 'retirée en {s} s'],
    surv: ['Rescapés', '{a} sur {m}'],
    loss: 'Pertes',
    none: 'aucune',
    more: '{item} et {j} de plus',
    rival: ['Sa table', '{r} de cassés'],
    small: 'Non valable comme explication auprès de maman.',
    cup: 'une tasse à thé', bowls: 'le bol de maman', fish: 'le poisson', vase: 'un vase', thermos: 'le thermos de mamie', heirloom: 'le vase de famille',
    v_heirloom: '« Cinq générations. Jusqu’à aujourd’hui. »',
    v_bowls: '« C’était un service complet »',
    v_fish: '« Règle des cinq secondes »',
    v_thermos: '« L’extérieur est intact »',
    v_k: '« Il paraît que ça porte bonheur »',
    v_cat: '« C’est le chat. Ça ne compte pas. »',
    v_0: '« Rien de cassé. Maman dit toujours non. »',
    done0: 'J’ai retiré la nappe d’une table de {m} pièces. Rien de cassé. À vous :',
    donek: 'J’ai retiré la nappe d’une table de {m} pièces et j’en ai cassé {k}. Faites mieux :',
    invite: 'Il y a une nappe ici, avec les bols de maman dessus. Tirez :',
    back: 'Renvoyez votre table',
  },
  ja: {
    title: '家財損害報告書',
    cloth: ['テーブルクロス', '{s} 秒で引き抜き'],
    surv: ['無事', '{m} 個中 {a} 個'],
    loss: '損害',
    none: 'なし',
    more: '{item} ほか {j} 個',
    rival: ['相手', '{r} 個割った'],
    small: '本書は母への説明には使えません。',
    cup: '湯のみ', bowls: '母の茶碗', fish: '魚', vase: '花瓶', thermos: '祖母の魔法瓶', heirloom: '家宝',
    v_heirloom: '「五代続いた。今日まで」',
    v_bowls: '「揃いだったのに」',
    v_fish: '「3秒ルール」',
    v_thermos: '「外側は無事」',
    v_k: '「厄落としです」',
    v_cat: '「猫がやった。数に入れない」',
    v_0: '「何も割れていない。母はそれでも反対」',
    done0: '{m} 個のせたテーブルからクロスを引き抜いた。ひとつも割れなかった。次はあなた：',
    donek: '{m} 個のせたテーブルからクロスを引き抜いて、{k} 個割った。もっとうまくできる？：',
    invite: 'ここにテーブルクロスがある。上には母の茶碗。引いてみて：',
    back: '結果を送り返す',
  },
} satisfies Record<Locale, Record<string, string | string[]>>

/** yoink: a challenge link's table and the sender's breakage (?b=<set><k>), when this visit is a recipient's */
export function yoinkRival(): { set: number; k: number } | null {
  if (!landing.recipient) return null
  const m = /^([1-6])([0-9])$/.exec(new URLSearchParams(location.search).get('b') || '')
  return m ? { set: Number(m[1]), k: Number(m[2]) } : null
}

/** peel's objects, in the order the game numbers them (peak data `it` and `left`, the link's ?obj=). */
export const PEEL_ITEMS = ['phone', 'steel', 'remote', 'cam', 'watch', 'car', 'micro', 'fridge', 'laptop', 'cabinet'] as const
/** How many of them are built so far: the kinds row's total. */
const PEEL_LIVE = 10
const peelLeft = () => PEEL_ITEMS[store.peak?.data.left ?? 2] ?? 'remote'

/** peel: 撕膜证明 / Certificate of Peeling. */
const PEEL = {
  en: {
    title: 'Certificate of Peeling',
    today: ['Films peeled today', '{n}'],
    one: ['In one pull', '{k}'],
    mum: ['Mum informed', 'no'],
    v_remote: '“The remote was like that when I found it”',
    v_one: '“One pull. No tearing.”',
    v_else: '“Crooked still counts”',
    kinds: ['Kinds', '{d} of {t}'],
    v_cam: '“It was never my shaky hands”',
    v_watch: '“The film always said 10:09”',
    v_car: '“The dealer said it was factory-fitted”',
    v_micro: '“The bit under the trim stays”',
    v_fridge: '“So that is the colour I bought”',
    v_laptop: '“Kept the film. Return window.”',
    v_cabinet: '“Three years on. Brittle.”',
    small: 'Remove before use. No liability after removal.',
    done: 'Peeled {n} films today. Mum does not know. I left you {obj}:',
    done1: 'Peeled one film today. Mum does not know. I left you {obj}:',
    invite: 'There is a film waiting to be peeled. Mum is out:',
  },
  'zh-CN': {
    title: '撕膜证明',
    today: ['今日撕膜', '{n} 张'],
    one: ['一口气撕完', '{k} 张'],
    mum: ['我妈知情', '否'],
    v_remote: '「遥控器的膜不是我撕的」',
    v_one: '「一口气，没断」',
    v_else: '「撕歪了也算」',
    kinds: ['品类', '{d} / {t} 种'],
    v_cam: '「原来不是我手抖」',
    v_watch: '「膜上的时间一直是 10:09」',
    v_car: '「4S 店说是原厂的」',
    v_micro: '「缝里那一圈，就这样吧」',
    v_fridge: '「原来冰箱是这个颜色」',
    v_laptop: '「膜没扔，七天无理由」',
    v_cabinet: '「贴了三年，脆了」',
    small: '撕前请勿使用。撕后概不负责。',
    done: '今天撕了 {n} 张膜，我妈还不知道。{obj}那张留给你：',
    done1: '今天撕了 1 张膜，我妈还不知道。{obj}那张留给你：',
    invite: '有张膜等你撕。你妈不在：',
  },
  es: {
    title: 'Certificado de despegado',
    today: ['Láminas despegadas hoy', '{n}'],
    one: ['De un tirón', '{k}'],
    mum: ['Mamá lo sabe', 'no'],
    v_remote: '«El mando ya estaba así»',
    v_one: '«De un tirón. Sin romperse.»',
    v_else: '«Torcido también cuenta»',
    kinds: ['Tipos', '{d} de {t}'],
    v_cam: '«No era mi pulso»',
    v_watch: '«El plástico siempre marcó las 10:09»',
    v_car: '«En el concesionario dijeron que venía de fábrica»',
    v_micro: '«Lo de debajo del marco se queda»',
    v_fridge: '«Así que ese era el color»',
    v_laptop: '«El plástico, guardado. Por si lo devuelvo.»',
    v_cabinet: '«Tres años puesto. Quebradizo.»',
    small: 'Retirar antes de usar. Sin responsabilidad después.',
    done: 'Hoy he quitado {n} plásticos. Mamá no lo sabe. Te dejo {obj}:',
    done1: 'Hoy he quitado un plástico. Mamá no lo sabe. Te dejo {obj}:',
    invite: 'Hay una lámina esperando a que la despegues. Mamá ha salido:',
  },
  fr: {
    title: 'Certificat de décollage',
    today: ['Films retirés aujourd’hui', '{n}'],
    one: ['D’un seul geste', '{k}'],
    mum: ['Maman au courant', 'non'],
    v_remote: '« La télécommande était déjà nue »',
    v_one: '« D’un geste. Sans déchirer. »',
    v_else: '« De travers, ça compte aussi »',
    kinds: ['Sortes', '{d} sur {t}'],
    v_cam: '« Ce n’était pas moi qui tremblais »',
    v_watch: '« Le film a toujours indiqué 10 h 09 »',
    v_car: '« Le concessionnaire a dit que c’était d’origine »',
    v_micro: '« Le bout sous la baguette reste »',
    v_fridge: '« C’était donc cette couleur-là »',
    v_laptop: '« Film conservé. On ne sait jamais. »',
    v_cabinet: '« Trois ans. Cassant. »',
    small: 'À retirer avant usage. Aucune responsabilité après.',
    done: '{n} films retirés aujourd’hui. Maman ne sait rien. Je vous laisse {obj} :',
    done1: 'Un film retiré aujourd’hui. Maman ne sait rien. Je vous laisse {obj} :',
    invite: 'Un film attend d’être retiré. Maman est sortie :',
  },
  ja: {
    title: 'フィルム剥離証明書',
    today: ['本日はがした枚数', '{n} 枚'],
    one: ['一気にはがした', '{k} 枚'],
    mum: ['母の承知', 'なし'],
    v_remote: '「リモコンのフィルムは最初からなかった」',
    v_one: '「一気に、切れずに」',
    v_else: '「曲がってもはがしたうち」',
    kinds: ['種類', '{d} / {t}'],
    v_cam: '「手ブレじゃなかった」',
    v_watch: '「フィルムはずっと 10:09」',
    v_car: '「ディーラーは純正だと言った」',
    v_micro: '「ふちの下はそのまま」',
    v_fridge: '「こんな色だったのか」',
    v_laptop: '「フィルムは保管。返品に備えて」',
    v_cabinet: '「3年もの。もろい」',
    small: '使用前にはがしてください。はがした後は責任を負いません。',
    done: '今日は {n} 枚はがした。母はまだ知らない。{obj}のぶんは残しておいた：',
    done1: '今日は 1 枚はがした。母はまだ知らない。{obj}のぶんは残しておいた：',
    invite: 'はがされ待ちのフィルムがあります。母は留守です：',
  },
} satisfies Record<Locale, Record<string, string | string[]>>

/** twirl: 新裙试转单 / Twirl Test Slip, the tailor's slip for the mandatory first twirl. */
const TWIRL = {
  en: {
    title: 'Twirl Test Slip',
    fabric: ['Fabric', '{fabric}'],
    turns: ['In one go', '{t} turns'],
    peak: ['Top speed', '{p} turns a second'],
    bloom: ['Fully open', '{b} s'],
    rival: ['Theirs', '{r} turns'],
    small: 'The shop does not supply travel-sickness pills.',
    v_dz: '“The dress form got dizzy. The skirt is fine.”',
    v_pk: '“It has pockets. Had.”',
    v_mamian: '“Every pleat open”',
    v_tulle: '“The glitter stays for life”',
    v_wr: '“I stopped. The skirt did not.”',
    v_else: '“New skirt. Twirled first, as required.”',
    done: 'I spun a new skirt {t} times in one go. Beat that:',
    invite: 'There is a new skirt here. You know what to do first:',
    back: 'Send your turns back',
    chiffon: 'Chiffon', denim: 'Denim', mamian: 'Mamianqun', tulle: 'Tulle',
  },
  'zh-CN': {
    title: '新裙试转单',
    fabric: ['面料', '{fabric}'],
    turns: ['一口气', '{t} 圈'],
    peak: ['最快', '每秒 {p} 圈'],
    bloom: ['全开', '{b} 秒'],
    rival: ['对手', '{r} 圈'],
    small: '本店不提供晕车药。',
    v_dz: '「人台转晕了，裙子没事」',
    v_pk: '「有口袋，东西全飞了」',
    v_mamian: '「褶子全开」',
    v_tulle: '「亮片会跟我一辈子」',
    v_wr: '「我停了，裙子没停」',
    v_else: '「新裙子，按规定先转了一圈」',
    done: '我把一条新裙子一口气转了 {t} 圈。你来：',
    invite: '这儿有条新裙子。先转一圈，这是规定：',
    back: '把圈数甩回去',
    chiffon: '雪纺', denim: '牛仔', mamian: '马面裙', tulle: '纱裙',
  },
  es: {
    title: 'Ficha de prueba de vuelo',
    fabric: ['Tejido', '{fabric}'],
    turns: ['Del tirón', '{t} vueltas'],
    peak: ['Velocidad máxima', '{p} vueltas por segundo'],
    bloom: ['Abierta del todo', '{b} s'],
    rival: ['La suya', '{r} vueltas'],
    small: 'La casa no facilita pastillas para el mareo.',
    v_dz: '«El maniquí se ha mareado. La falda, perfecta.»',
    v_pk: '«Tiene bolsillos. Lo de dentro ya no.»',
    v_mamian: '«Todos los pliegues abiertos»',
    v_tulle: '«La purpurina es para toda la vida»',
    v_wr: '«Yo paré. La falda, no.»',
    v_else: '«Falda nueva. Primero la vuelta, como mandan las normas.»',
    done: 'He hecho girar una falda nueva {t} vueltas del tirón. Supéralo:',
    invite: 'Aquí hay una falda nueva. Ya sabes qué se hace primero:',
    back: 'Devuélvele tus vueltas',
    chiffon: 'Gasa', denim: 'Vaquera', mamian: 'Mamianqun', tulle: 'Tul',
  },
  fr: {
    title: 'Fiche d’essayage : est-ce qu’elle tourne ?',
    fabric: ['Tissu', '{fabric}'],
    turns: ['D’une traite', '{t} tours'],
    peak: ['Vitesse max.', '{p} tours par seconde'],
    bloom: ['Grande ouverte', '{b} s'],
    rival: ['La sienne', '{r} tours'],
    small: 'La maison ne fournit pas de comprimés contre le mal des transports.',
    v_dz: '« Le mannequin a le tournis. La jupe va très bien. »',
    v_pk: '« Elle a des poches. Elles sont vides. »',
    v_mamian: '« Tous les plis ouverts »',
    v_tulle: '« Les paillettes, c’est pour la vie »',
    v_wr: '« Je me suis arrêté. La jupe, non. »',
    v_else: '« Jupe neuve. D’abord le tour, comme il se doit. »',
    done: 'J’ai fait tourner une jupe neuve {t} fois d’une traite. À vous de faire mieux :',
    invite: 'Il y a une jupe neuve ici. Vous savez ce qu’on fait d’abord :',
    back: 'Renvoyez vos tours',
    chiffon: 'Mousseline', denim: 'Denim', mamian: 'Mamianqun', tulle: 'Tulle',
  },
  ja: {
    title: '試回転票',
    fabric: ['生地', '{fabric}'],
    turns: ['一気に', '{t} 回転'],
    peak: ['最高速', '毎秒 {p} 回'],
    bloom: ['全開', '{b} 秒'],
    rival: ['相手', '{r} 回転'],
    small: '当店に酔い止めの用意はございません。',
    v_dz: '「トルソーは目を回した。スカートは無事」',
    v_pk: '「ポケット付き。中身は飛んでいった」',
    v_mamian: '「ひだ全開」',
    v_tulle: '「ラメは一生もの」',
    v_wr: '「私は止まった。スカートは止まらなかった」',
    v_else: '「新しいスカート。決まりどおり、まず回った」',
    done: '新しいスカートを一気に {t} 回転させた。超えてみて：',
    invite: 'ここに新しいスカートがある。まず何をするかは、わかるよね：',
    back: '回転数を送り返す',
    chiffon: 'シフォン', denim: 'デニム', mamian: '馬面裙', tulle: 'チュール',
  },
} satisfies Record<Locale, Record<string, string | string[]>>
/** twirl's skirts, in the order the link's `f` numbers them */
export const TWIRL_FABRICS = ['chiffon', 'denim', 'mamian', 'tulle'] as const

/** silk: 请假条 / Leave Request. The reason is a curtain; the approver is the breeze. */
const SILK = {
  en: {
    title: 'Leave Request',
    reason: ['Reason', 'watching a curtain'],
    dur: ['Duration', '{m} min {s} s'],
    outside: 'Outside',
    approved: ['Approved by', 'the breeze'],
    small: 'Takes effect when the curtain closes.',
    views: ['', 'a cat', 'the neighbour', 'rain', 'a sunset', 'the moon'],
    verdicts: ['“Approved. — The breeze”', '“There was a cat behind the curtain the whole time”', '“0.8 seconds of eye contact with the neighbour”', '“The washing is still out”', '“Good sunset. Bad photo.”', '“The moon was up too”'],
    done: 'I took {m} minutes off to watch a curtain. I left a window for you:',
    invite: 'There is a window here with a silk curtain. Give it a pull:',
  },
  'zh-CN': {
    title: '请假条',
    reason: ['事由', '看窗帘飘'],
    dur: ['时长', '{m} 分 {s} 秒'],
    outside: '窗外',
    approved: ['审批', '风'],
    small: '本假条自拉上窗帘起生效。',
    views: ['', '一只猫', '对面邻居', '雨', '晚霞', '月亮'],
    verdicts: ['「同意。——风」', '「窗帘后面一直有猫」', '「和对面对视了 0.8 秒」', '「衣服还在外面」', '「晚霞很好，手机拍不出来」', '「月亮也没睡」'],
    done: '我请了 {m} 分钟假，在看窗帘。给你也留了一扇窗：',
    invite: '这儿有一扇窗，窗帘是真丝的。拉一下：',
  },
  es: {
    title: 'Solicitud de permiso',
    reason: ['Motivo', 'mirar una cortina'],
    dur: ['Duración', '{m} min {s} s'],
    outside: 'Fuera',
    approved: ['Aprobado por', 'la brisa'],
    small: 'Surte efecto al cerrar la cortina.',
    views: ['', 'un gato', 'el vecino', 'lluvia', 'un atardecer', 'la luna'],
    verdicts: ['«Concedido. — La brisa»', '«Había un gato detrás de la cortina todo el rato»', '«0,8 segundos de contacto visual con el vecino»', '«La ropa sigue fuera»', '«Buen atardecer. Mala foto.»', '«La luna tampoco dormía»'],
    done: 'Me he tomado {m} minutos libres para mirar una cortina. Te dejo una ventana:',
    invite: 'Aquí hay una ventana con una cortina de seda. Tira de ella:',
  },
  fr: {
    title: 'Demande de congé',
    reason: ['Motif', 'regarder un rideau'],
    dur: ['Durée', '{m} min {s} s'],
    outside: 'Dehors',
    approved: ['Accordé par', 'la brise'],
    small: 'Prend effet à la fermeture du rideau.',
    views: ['', 'un chat', 'le voisin', 'la pluie', 'un coucher de soleil', 'la lune'],
    verdicts: ['« Accordé. — La brise »', '« Il y avait un chat derrière le rideau depuis le début »', '« 0,8 seconde de regard croisé avec le voisin »', '« Le linge est toujours dehors »', '« Beau coucher de soleil. Photo ratée. »', '« La lune ne dormait pas non plus »'],
    done: "J'ai pris {m} minutes de congé pour regarder un rideau. Je vous laisse une fenêtre :",
    invite: 'Il y a ici une fenêtre avec un rideau de soie. Tirez-le :',
  },
  ja: {
    title: '休暇届',
    reason: ['理由', 'カーテンを眺めるため'],
    dur: ['期間', '{m} 分 {s} 秒'],
    outside: '窓の外',
    approved: ['承認', '風'],
    small: 'カーテンを閉めた時点から有効。',
    views: ['', '猫', '向かいの人', '雨', '夕焼け', '月'],
    verdicts: ['「承認します。——風」', '「カーテンの向こうにずっと猫がいた」', '「向かいの人と 0.8 秒、目が合った」', '「洗濯物はまだ外」', '「夕焼けは良かった。写真はだめ」', '「月も起きていた」'],
    done: 'カーテンを眺めるために {m} 分休んだ。あなたにも窓をひとつ：',
    invite: 'ここに窓がある。カーテンは絹。引いてみて：',
  },
} satisfies Record<Locale, Record<string, string | string[]>>
/** silk's events, as `view` on the card and `?v=` on the link (0 is none) */
export const SILK_VIEWS = ['none', 'cat', 'neighbour', 'rain', 'sunset', 'moon'] as const

/** pop and void: a recipient answers with their own time */
const TIME_BACK: Record<Locale, string> = { en: 'Send your time back', 'zh-CN': '把成绩甩回去', es: 'Devuélvele tu tiempo', fr: 'Renvoyer votre temps', ja: 'タイムを送り返す' }

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
  twirl: { surface: ['#EFE6DA', '#E2D5C3'], grain: 'rgba(110,80,50,0.05)', paper: '#FFFDF9', ink: '#3A2F2A', faint: 'rgba(58,47,42,0.5)', accent: '#D9728A', accent2: 'rgba(217,114,138,0.35)' },
  yoink: { surface: ['#E9DCC8', '#D9C6AA'], grain: 'rgba(90,60,30,0.05)', paper: '#FFFDF7', ink: '#3A1E14', faint: 'rgba(58,30,20,0.5)', accent: '#B3261E', accent2: 'rgba(179,38,30,0.35)' },
  silk: { surface: ['#F3EADB', '#E6D8C2'], grain: 'rgba(120,95,60,0.05)', paper: '#FFFDF8', ink: '#3B3A32', faint: 'rgba(59,58,50,0.5)', accent: '#7A9A6E', accent2: 'rgba(122,154,110,0.35)' },
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
  // pop and void carry the sender's time as a challenge; a peel link starts on the object left for the recipient
  else if ((toy === 'pop' || toy === 'void') && store.done && store.peak?.data.s) q = `?t=${store.peak.data.s}`
  else if (toy === 'peel') q = `?obj=${peelLeft()}`
  // twirl carries the sender's turns as a challenge, and the skirt
  else if (toy === 'twirl' && store.done && (store.peak?.data.t ?? 0) >= 5) q = `?k=${Math.min(999, store.peak!.data.t)}&f=${store.peak!.data.f ?? 0}`
  // yoink: the table and the sender's breakage, two digits
  else if (toy === 'yoink' && store.done && store.peak?.data.set) q = `?b=${store.peak.data.set}${Math.min(9, store.peak.data.k ?? 0)}`
  // silk: the sender's view, so the recipient's first open plays it
  else if (toy === 'silk' && store.done && (store.peak?.data.view ?? 0) > 0) q = `?v=${store.peak!.data.view}`
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
    case 'charge': {
      const T = CHARGE[locale]
      return store.done && n ? fill(n === 1 ? T.done1 : T.done, { n }) : T.invite
    }
    case 'pop': {
      const T = POP[locale]
      const p = store.peak?.data
      return store.done && p?.s ? fill(p.dud ? T.done_dud : T.done, { s: p.s }) : T.invite
    }
    case 'void': {
      const T = VOID[locale]
      const p = store.peak?.data
      return store.done && p?.s ? fill(p.back === 1 ? T.done_sock : T.done, { s: p.s }) : T.invite
    }
    case 'peel': {
      const T = PEEL[locale]
      return store.done && n ? fill(n === 1 ? T.done1 : T.done, { n, obj: tx(`peel_name_${peelLeft()}`) }) : T.invite
    }
    case 'twirl': {
      const T = TWIRL[locale]
      const p = store.peak?.data
      return store.done && p?.t ? fill(T.done, { t: p.t }) : T.invite
    }
    case 'yoink': {
      const T = YOINK[locale]
      const p = store.peak?.data
      if (!store.done || !p?.m) return T.invite
      return fill(p.k ? T.donek : T.done0, { m: p.m, k: p.k })
    }
    case 'silk': {
      const T = SILK[locale]
      const p = store.peak?.data
      return store.done && p ? fill(T.done, { m: Math.max(1, Math.floor((p.sec ?? 0) / 60)) }) : T.invite
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
  if ((toy === 'pop' || toy === 'void') && store.done && store.peak?.data.s) return TIME_BACK[locale]
  if (toy === 'twirl' && store.done && (store.peak?.data.t ?? 0) >= 5) return TWIRL[locale].back
  if (toy === 'yoink' && store.done && yoinkRival()) return YOINK[locale].back
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
          ? { peels: stats.n, kinds: store.peak?.data.d ?? 0 }
          : toy === 'pour'
            ? { total: stats.n ?? 0, golden: stats.k ?? 0 }
            : toy === 'stamp'
              ? { total: stats.n ?? 0, denied: stats.k ?? 0 }
              : toy === 'zip' && stats.n
                ? { total: stats.n }
                : toy === 'twirl' && store.peak
                  ? { turns: store.peak.data.t ?? 0, peak: store.peak.data.p ?? 0, f: store.peak.data.f ?? 0 }
                : toy === 'yoink'
                  ? { pulls: stats.n ?? 0, perfects: stats.k ?? 0, set: store.peak?.data.set ?? 0 }
                : toy === 'silk' && store.peak
                  ? { sec: store.peak.data.sec ?? 0, opens: store.peak.data.opens ?? 0 }
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
  // gl: which of the claim lines (2 to 4 are the toy's own text, loaded with its prize pool)
  if (g) return { ...base, title: T.claim, rows: [[T.prize, quotes().join(quote(g))], [T.how, tx(`scratch_how_gift_${p.gl}`) || T.how_gift]], verdict: T.claim_v, small: T.small }
  // the prize pool (text and claim lines from the toy's own strings); v the timed line, r 2 rare, 3 jackpot
  const id = p?.prize ? PRIZES[p.prize - 1] : undefined
  if (!id || !p) return null
  const v = p.v ? '_alt' : ''
  const prize = tx(`scratch_prize_${id}${v}`) || tx(`scratch_prize_${id}`)
  const how = tx(`scratch_how_${id}${v}`) || (T as Record<string, string>)[`how_${id}`] || tx(`scratch_how_${id}`)
  const verdict = (p.r === 3 && tx('scratch_win_v_jackpot')) || (p.r === 2 && tx('scratch_win_v_rare')) || T.win_v
  const small = (p.r === 3 && tx('scratch_win_small_jackpot')) || T.win_small
  // the built-in line is the toy's own (at most 52 characters, it fits the row): not shortened like a friend's words
  const rows: [string, string][] = [[T.prize, prize]]
  if (how) rows.push([T.how, how])
  return { ...base, title: T.win, rows, verdict, small }
}


/**
 * A challenge link's time (pop, void: `t`, seconds), rounded to 0.1; 0 when absent, not a recipient, or not a
 * sane number. pop's and void's App.tsx read it the same way for the tag (kept there, out of every main bundle).
 */
export function rivalTime(): number {
  if (!landing.recipient) return 0
  const v = Number(new URLSearchParams(location.search).get('t'))
  return v > 0 && v < 3600 ? Math.round(v * 10) / 10 : 0
}

function chargeDoc(p: Record<string, number> | null): Doc {
  const T = CHARGE[locale]
  const n = p?.n ?? stats.n ?? 0
  const rows: [string, string][] = [[T.who[0], T.who[1]]]
  if (n) rows.push(n === 1 ? [T.blew1[0], T.blew1[1]] : [T.blew[0], fill(T.blew[1], { n })])
  if (p?.p) rows.push([T.pfft[0], fill(T.pfft[1], { p: p.p })])
  return { look: look('charge'), title: T.title, rows, focus: 0.45, verdict: T.verdict, small: T.small, call: S.call, host: 'charge.integ.life' }
}

function popDoc(p: Record<string, number> | null): Doc {
  const T = POP[locale]
  const rows: [string, string][] = [[T.contents[0], T.contents[1]]]
  if (p?.cells) rows.push([T.qty[0], fill(T.qty[1], { n: p.cells })])
  if (p?.s) rows.push([T.time[0], fill(T.time[1], { s: p.s })])
  const r = rivalTime()
  if (r) rows.push([T.rival[0], fill(T.rival[1], { s: r })])
  if (p?.dud) rows.push([T.note[0], T.note[1]])
  // four rows at most: with a rival and a dud, the contents (air) gives way
  return { look: look('pop'), title: T.title, rows: rows.length > 4 ? rows.slice(1) : rows, focus: p?.fy ?? 0.5, verdict: T.verdict, small: T.small, call: S.call, host: 'pop.integ.life' }
}

function voidDoc(p: Record<string, number> | null): Doc {
  const T = VOID[locale]
  const rows: [string, string][] = []
  if (p?.s) rows.push([T.time[0], fill(T.time[1], { s: p.s })])
  const ate = VOID_ATE.map((k) => [k, p?.[k] ?? 0] as const)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
  const sep = locale === 'zh-CN' || locale === 'ja' ? '、' : ', '
  if (ate.length) rows.push([T.ate, ate.map(([k, c]) => `${T[k]} ×${c}`).join(sep)])
  const back = p?.back ? VOID_BACK[p.back - 1] : undefined
  if (back) rows.push([T.back[0], fill(T.back[1], { item: T[`r_${back}`] })])
  const r = rivalTime()
  if (r) rows.push([POP[locale].rival[0], fill(POP[locale].rival[1], { s: r })])
  const verdict = back === 'sock' ? T.v_sock : back ? T.v_back : T.v_none
  return { look: look('void'), title: T.title, rows, focus: 0.5, verdict, small: T.small, call: S.call, host: 'void.integ.life' }
}

/** A twirl challenge link's turns (`k`, 5 to 999); 0 when absent, not a recipient, or out of range. */
export function rivalTurns(): number {
  if (!landing.recipient) return 0
  const v = Number(new URLSearchParams(location.search).get('k'))
  return Number.isInteger(v) && v >= 5 && v <= 999 ? v : 0
}

function twirlDoc(p: Record<string, number> | null): Doc {
  const T = TWIRL[locale]
  const f = TWIRL_FABRICS[p?.f ?? 0] ?? 'chiffon'
  const rows: [string, string][] = [[T.fabric[0], fill(T.fabric[1], { fabric: T[f] })]]
  if (p?.t) rows.push([T.turns[0], fill(T.turns[1], { t: p.t })])
  if (p?.p) rows.push([T.peak[0], fill(T.peak[1], { p: (p.p / 10).toFixed(1) })])
  const r = p?.r || rivalTurns()
  if (r) rows.push([T.rival[0], fill(T.rival[1], { r })])
  else if (p?.b) rows.push([T.bloom[0], fill(T.bloom[1], { b: (p.b / 10).toFixed(1) })])
  const verdict = p?.dz ? T.v_dz : p?.pk ? T.v_pk : f === 'mamian' && p?.b ? T.v_mamian : f === 'tulle' ? T.v_tulle : p?.wr ? T.v_wr : T.v_else
  return { look: look('twirl'), title: T.title, rows, focus: f === 'mamian' ? 0.5 : 0.37, verdict, small: T.small, call: S.call, host: 'twirl.integ.life' }
}

function peelDoc(p: Record<string, number> | null): Doc {
  const T = PEEL[locale]
  const n = p?.n ?? stats.n ?? 0
  const rows: [string, string][] = []
  if (n) rows.push([T.today[0], fill(T.today[1], { n })])
  if (p?.k) rows.push([T.one[0], fill(T.one[1], { k: p.k })])
  if (p?.d && p.d >= 4) rows.push([T.kinds[0], fill(T.kinds[1], { d: p.d, t: PEEL_LIVE })])
  rows.push([T.mum[0], T.mum[1]])
  const it = p?.it !== undefined ? PEEL_ITEMS[p.it] : undefined
  const vi = it ? (T as Record<string, unknown>)[`v_${it}`] : undefined
  const verdict = p?.remote ? T.v_remote : typeof vi === 'string' ? vi : p?.k ? T.v_one : T.v_else
  return { look: look('peel'), title: T.title, rows, focus: 0.5, verdict, small: T.small, call: S.call, host: 'peel.integ.life' }
}

function yoinkDoc(p: Record<string, number> | null): Doc {
  const T = YOINK[locale]
  const rows: [string, string][] = []
  if (p?.ms) rows.push([T.cloth[0], fill(T.cloth[1], { s: (p.ms / 1000).toFixed(2) })])
  if (p?.m) rows.push([T.surv[0], fill(T.surv[1], { a: p.a ?? 0, m: p.m })])
  const k = p?.k ?? 0
  const top = p?.top ? YOINK_ITEMS[p.top - 1] : undefined
  if (p) rows.push([T.loss, !k || !top ? T.none : k === 1 ? T[top] : fill(T.more, { item: T[top], j: k - 1, k })])
  const rv = yoinkRival()
  if (rv && store.done) rows.push([T.rival[0], fill(T.rival[1], { r: rv.k })])
  const verdict = top === 'heirloom' ? T.v_heirloom : top === 'bowls' ? T.v_bowls : top === 'fish' ? T.v_fish : top === 'thermos' ? T.v_thermos : k > 0 ? T.v_k : p?.cat ? T.v_cat : T.v_0
  return { look: look('yoink'), title: T.title, rows: rows.slice(0, 4), focus: 0.45, verdict, small: T.small, call: S.call, host: 'yoink.integ.life' }
}

function silkDoc(p: Record<string, number> | null): Doc {
  const T = SILK[locale]
  const sec = p?.sec ?? 0
  const view = p?.view && p.view > 0 && p.view < SILK_VIEWS.length ? p.view : 0
  const rows: [string, string][] = [[T.reason[0], T.reason[1]], [T.dur[0], fill(T.dur[1], { m: Math.floor(sec / 60), s: sec % 60 })]]
  if (view) rows.push([T.outside, T.views[view]])
  rows.push([T.approved[0], T.approved[1]])
  return { look: look('silk'), title: T.title, rows, focus: 0.5, verdict: T.verdicts[view], small: T.small, call: S.call, host: 'silk.integ.life' }
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
  if (toy === 'charge') return chargeDoc(p)
  if (toy === 'pop') return popDoc(p)
  if (toy === 'void') return voidDoc(p)
  if (toy === 'peel') return peelDoc(p)
  if (toy === 'twirl') return twirlDoc(p)
  if (toy === 'yoink') return yoinkDoc(p)
  if (toy === 'silk') return silkDoc(p)
  return (toy === 'scratch' && scratchDoc(p)) || defaultDoc(toy)
}
