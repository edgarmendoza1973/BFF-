const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'bff.db'));
db.pragma('journal_mode = WAL');

const VERSIONS = ['ESV', 'NLT', 'ASND', 'PINOY'];
const ins = db.prepare('INSERT OR IGNORE INTO bible_verses (version_id, book_number, chapter, verse, text) VALUES (?, ?, ?, ?, ?)');

const verses = {
  149: {
    ESV: [
      'Praise the LORD! Sing to the LORD a new song, his praise in the assembly of the godly!',
      'Let Israel be glad in his Maker; let the children of Zion rejoice in their King!',
      'Let them praise his name with dancing, making melody to him with tambourine and lyre!',
      'For the LORD takes pleasure in his people; he adorns the humble with salvation.',
      'Let the godly exult in glory; let them sing for joy on their beds.',
      'Let the high praises of God be in their throats and two-edged swords in their hands,',
      'to execute vengeance on the nations and punishments on the peoples,',
      'to bind their kings with chains and their nobles with fetters of iron,',
      'to execute on them the judgment written! This is honor for all his godly ones. Praise the LORD!'
    ],
    NLT: [
      'Praise the Lord! Sing to the Lord a new song. Sing his praises in the assembly of the faithful.',
      'O Israel, rejoice in your Maker. O people of Jerusalem, exult in your King.',
      'Praise his name with dancing, accompanied by tambourine and harp.',
      'For the Lord delights in his people; he crowns the humble with victory.',
      'Let the faithful rejoice that he honors them. Let them sing for joy as they lie on their beds.',
      'Let the praises of God be in their mouths, and a sharp sword in their hands—',
      'to execute vengeance on the nations and punishment on the peoples,',
      'to bind their kings with shackles and their leaders with iron chains,',
      'to execute the judgment written against them. This is the glorious privilege of his faithful ones. Praise the Lord!'
    ],
    ASND: [
      'Purihin ang Panginoon. Umawit kayo sa Panginoon ng bagong awit, at purihin siya sa kapulungan ng mga banal.',
      'Magalak si Israel sa kanyang Manlilikha; ang mga anak ng Sion ay magsisaya sa kanilang Hari.',
      'Purihin nila ang kanyang pangalan sa sayaw; umawit sila sa kanya ng papuri sa pandanolin at alpa.',
      'Sapagkat ang Panginoon ay nalulugod sa kanyang bayan; paguguandahin niya ang mga mapagpakumbabang tao ng kaligtasan.',
      'Ang mga banal ay magsisaya sa kaluwalhatian; umawit sila nang may kagalakan sa kanilang mga higaan.',
      'Ang mga pagpupuri sa Dios ay nasa kanilang lalamunan, at isang tabak na may dalawang talim ay nasa kanilang mga kamay;',
      'Upang gumawa ng panghihiganti sa mga bansa at parusa sa mga bayan;',
      'Upang gapusin ang kanilang mga hari ng mga kadena, at ang kanilang mga marangal ng mga tanikala ng bakal;',
      'Upang isagawa sa kanila ang kahatulan na nakasulat: ito ay karangalan para sa lahat ng kanyang mga banal. Purihin ang Panginoon.'
    ],
    PINOY: [
      'Purihin ang Panginoon! Umawit ng bagong awit sa Panginoon at purihin siya sa kapulungan ng mga tapat.',
      'Magalak ang Israel sa kanyang Manlalalang; ang mga taga-Sion ay magsisaya sa kanilang Hari.',
      'Purihin ang kanyang pangalan sa pamamagitan ng sayaw; umawit sa kanya nang may pandanolin at alpa.',
      'Sapagkat nasisiyahan ang Panginoon sa kanyang bayan; binibigyan niya ng tagumpay ang mga mapagpakumbaba.',
      'Magalak ang mga tapat sa kanilang karangalan; umawit sila nang may kagalakan sa kanilang mga higaan.',
      'Ang papuri sa Diyos ay nasa kanilang bibig at isang matalas na espada sa kanilang mga kamay,',
      'upang magsagawa ng parusa sa mga bansa at paghatol sa mga bayan,',
      'upang gapos ang kanilang mga hari ng mga kadena at ang kanilang mga marangal ng mga tanikala,',
      'upang maipatupad ang kahatulan na nakasulat laban sa kanila. Ito ang karangalan ng lahat ng kanyang mga tapat. Purihin ang Panginoon!'
    ]
  },
  150: {
    ESV: [
      'Praise the LORD! Praise God in his sanctuary; praise him in his mighty heavens!',
      'Praise him for his mighty deeds; praise him according to his excellent greatness!',
      'Praise him with trumpet sound; praise him with lute and harp!',
      'Praise him with tambourine and dance; praise him with strings and pipe!',
      'Praise him with sounding cymbals; praise him with loud clashing cymbals!',
      'Let everything that has breath praise the LORD! Praise the LORD!'
    ],
    NLT: [
      'Praise the Lord! Praise God in his sanctuary; praise him in his mighty heaven!',
      'Praise him for his mighty works; praise his unequaled greatness!',
      'Praise him with a blast of the ram\'s horn; praise him with the lyre and harp!',
      'Praise him with the tambourine and dancing; praise him with strings and flutes!',
      'Praise him with a clash of cymbals; praise him with loud clanging cymbals.',
      'Let everything that breathes sing praises to the Lord! Praise the Lord!'
    ],
    ASND: [
      'Purihin ang Panginoon. Purihin ang Dios sa kanyang santuwaryo; purihin siya sa kalagitnaan ng kanyang makapangyarihang kalawakan.',
      'Purihin siya dahil sa kanyang makapangyarihang mga gawa; purihin siya ayon sa kanyang sukdulang kadakilaan.',
      'Purihin siya sa tunog ng trompeta; purihin siya sa salterio at alpa.',
      'Purihin siya sa pandanolin at sayaw; purihin siya sa mga pisi at flauta.',
      'Purihin siya sa mga simbalang malakas; purihin siya sa mga simbalang malakas at matunog.',
      'Hayaan na ang lahat ng may hininga ay magpuri sa Panginoon. Purihin ang Panginoon.'
    ],
    PINOY: [
      'Purihin ang Panginoon! Purihin ang Diyos sa kanyang santuwaryo; purihin siya sa kanyang makapangyarihang kalangitan!',
      'Purihin siya para sa kanyang mga makapangyarihang gawa; purihin siya dahil sa kanyang walang kapantay na kadakilaan!',
      'Purihin siya sa tunog ng trumpeta; purihin siya sa kudyapi at alpa!',
      'Purihin siya sa pandanolin at sayaw; purihin siya sa mga kuwerdas at plawta!',
      'Purihin siya sa mga simbalang malakas; purihin siya sa malakas na mga simbalo!',
      'Hayaan ang lahat ng may hininga na purihin ang Panginoon! Purihin ang Panginoon!'
    ]
  }
};

const fill = db.transaction(() => {
  [149, 150].forEach(chapter => {
    const vData = verses[chapter];
    const numVerses = vData.ESV.length;
    for (let v = 1; v <= numVerses; v++) {
      VERSIONS.forEach(ver => {
        ins.run(ver, 19, chapter, v, vData[ver][v-1]);
      });
    }
  });
});
fill();

const total = db.prepare('SELECT COUNT(*) as cnt FROM bible_verses').get();
const ps = db.prepare("SELECT COUNT(DISTINCT chapter) as cnt FROM bible_verses WHERE version_id='ESV' AND book_number=19").get();
console.log('Total verses:', total.cnt.toLocaleString());
console.log('Psalms chapters:', ps.cnt + '/150');
db.close();
console.log('Done!');
