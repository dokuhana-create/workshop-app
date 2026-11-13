/* Matching set packs for Habitat. Each piece: [item, options, tier] where tier 1 = essentials,
   3 = deluxe (2 counts as deluxe too). Options override the item's defaults; sizes scale with the chosen pack size. */
(function(root){
  const S={
    orchid:{name:'Orchid and flowers',group:'Themes',colours:'Blush pink or white, with leaf green; a second colour for the petal relief',note:'Moth orchids, blossoms and leafy vines in soft petal forms, made for an orchid mantis.',pieces:[
      ['flower',{kind:'orchid',R:30,stemL:90,mount:'stem'},1],['flower',{kind:'orchid'},1],['flower',{kind:'moth',R:20},1],['ledge',{shape:'leaf',pattern:'solid',under:'wedge'},1],
      ['ladder',{style:'vine',mount:'tie'},1],['bridge',{style:'branch',hstyle:'branch'},1],['dish',{shape:'flower'},1],['plate',{shape:'leaf',mode:'raised'},1],
      ['flower',{kind:'sakura',R:16},3],['flower',{kind:'peony',R:22},3],['feeder',{shape:'flower'},3],
      ['mister',{shape:'flower'},3],['twig',{shape:'cone',mount:'peg'},1]]},
    temple:{name:'Ancient temple',group:'Themes',colours:'Marble white and terracotta, with moss green or gold',note:'Greek and Roman: marble columns, an arch, laurels and a mosaic floor, like a temple gone quietly wild.',pieces:[
      ['diorama',{kind:'column',style:'intact',h:70},1],['diorama',{kind:'column',style:'broken'},1],['diorama',{kind:'arch',style:'broken',mount:'free'},1],['diorama',{kind:'mosaic',pattern:'meander'},1],
      ['ledge',{shape:'classic',pattern:'solid',under:'ribs'},1],['motif',{motif:'laurel',form:'plaque',base:'round'},1],['plate',{shape:'scroll',mode:'engraved',font:'caps'},1],
      ['sculpt',{kind:'torso',size:60},3],['sculpt',{kind:'lion',size:50},3],['motif',{motif:'temple',form:'plaque',base:'square'},3],['motif',{motif:'owl',form:'cutout',mount:'free'},3],
      ['motif',{motif:'helmet',form:'plaque',base:'shield'},3],['motif',{motif:'ionic',form:'plaque',base:'arch'},3],['motif',{motif:'lyre',form:'ornament'},3],['diorama',{kind:'amphora'},3],
      ['diorama',{kind:'column',style:'broken',size:22,h:40},3],['diorama',{kind:'mosaic',pattern:'rosette'},3],['tile',{texture:'stone'},3],['moss',{shape:'crescent'},3]]},
    gothic:{name:'Gothic and vampiric',group:'Themes',colours:'Black, deep purple or blood red, with silver or bone white',note:'Pointed arches, roses, candles and old stone, with a vampire\'s graveyard and a collector\'s curiosities.',pieces:[
      ['ledge',{shape:'classic',pattern:'rings',under:'ribs'},1],['bridge',{style:'gothic',hstyle:'rope'},1],['flower',{kind:'rose'},1],['diorama',{kind:'candles',accent:'yes'},1],
      ['motif',{motif:'gothicWindow',form:'plaque',base:'arch'},1],['dish',{shape:'hex'},1],['plate',{shape:'scroll',mode:'stencil'},1],
      ['sculpt',{kind:'angel',size:70},3],['sculpt',{kind:'raven',size:45},3],['sculpt',{kind:'bat',size:80},3],['sculpt',{kind:'real',size:32},3],['sculpt',{kind:'moth',size:70},3],
      ['diorama',{kind:'tombstone',style:'intact',mount:'free'},3],['diorama',{kind:'coffin',accent:'yes'},3],['ladder',{style:'chain',mount:'tie'},3],['tile',{texture:'brick'},3],
      ['motif',{motif:'roseWindow',form:'stencil',base:'round'},3],['motif',{motif:'bat',form:'ornament'},3],['ledge',{shape:'moon',pattern:'nouveau',under:'flat'},3],['emblem',{shape:'shield'},3]]},
    fantasy:{name:'Fantasy and medieval',group:'Themes',colours:'Castle grey and dragon green or red, with gold',note:'A castle tower, a dragon, a treasure chest and a sword in the stone, for D&D and fantasy fans.',pieces:[
      ['diorama',{kind:'tower',style:'intact'},1],['diorama',{kind:'chest',accent:'yes'},1],['motif',{motif:'dragon',form:'plaque',base:'shield'},1],['ledge',{shape:'tiered',pattern:'solid',under:'D'},1],
      ['bridge',{style:'straight',hstyle:'swag'},1],['ladder',{style:'chain',mount:'tie'},1],['plate',{shape:'banner',mode:'raised'},1],
      ['diorama',{kind:'sword'},3],['motif',{motif:'castle',form:'plaque',base:'arch'},3],['motif',{motif:'swordShield',form:'cutout',mount:'free'},3],['diorama',{kind:'crystals',accent:'yes'},3],
      ['diorama',{kind:'potions',accent:'yes'},3],['diorama',{kind:'dice'},3],['motif',{motif:'d20',form:'plaque',base:'hex'},3],['sculpt',{kind:'amethyst',size:60},3],['sculpt',{kind:'barnowl',size:55},3],
      ['diorama',{kind:'tower',style:'broken',h:50},3],['motif',{motif:'scroll',form:'plaque',base:'square'},3],['tile',{texture:'stone'},3],['emblem',{shape:'shield'},3]]},
    forest:{name:'Forest',group:'Themes',colours:'Bark brown, moss green and mushroom cream',note:'Bark, fungus shelves, moss and fallen leaves, where a dead-leaf mantis disappears.',pieces:[
      ['ledge',{shape:'fungus',pattern:'solid',under:'D'},1],['bark',{style:'organic'},1],['bridge',{style:'branch',hstyle:'branch'},1],['ladder',{style:'bark',mount:'tie'},1],
      ['twig',{shape:'rock',mount:'free'},1],['dish',{shape:'pebble'},1],['plate',{shape:'leaf',mode:'stencil'},1],
      ['sculpt',{kind:'pinecone',size:45},3],['sculpt',{kind:'stagbeetle',size:80},3],['ledge',{shape:'tiered',pattern:'rings',under:'wedge'},3],['ledge',{shape:'leaf',pattern:'solid',under:'D'},3],
      ['ledge',{shape:'lobed',pattern:'solid',under:'ribs'},3],['diorama',{kind:'mushroom',accent:'yes',n:3},3],['moss',{shape:'kidney'},3],['tile',{texture:'bark'},3],['tile',{texture:'moss'},3],
      ['feeder',{shape:'pebble'},3],['mister',{shape:'pebble'},3]]},
    library:{name:'Library',group:'Themes',colours:'Walnut brown with oxblood, bottle green and gold book spines',note:'Bookshelves, book stacks, an open book and candles, like a scholar\'s study.',pieces:[
      ['diorama',{kind:'shelf',mount:'free'},1],['diorama',{kind:'books',n:4},1],['diorama',{kind:'openBook'},1],['diorama',{kind:'candles',accent:'yes'},1],
      ['ledge',{shape:'classic',pattern:'solid',under:'ribs'},1],['ladder',{style:'rope',mount:'tie'},1],['plate',{shape:'scroll',mode:'raised'},1],
      ['diorama',{kind:'books',n:6,size:22},3],['diorama',{kind:'shelf',h:50,mount:'free'},3],['sculpt',{kind:'barnowl',size:55},3],['sculpt',{kind:'ammonite',size:60},3],['sculpt',{kind:'nautilus',size:45},3],
      ['motif',{motif:'books',form:'plaque',base:'arch'},3],['bridge',{style:'straight',hstyle:'swag'},3],['tile',{texture:'planks'},3],['dish',{shape:'round'},3]]},
    geo:{name:'Geometric',group:'Themes',colours:'Matte white, grey or black, with one bright or metallic accent',note:'Facets, hexagons and clean lines.',pieces:[
      ['ledge',{shape:'sharp',pattern:'solid',under:'wedge'},1],['bridge',{style:'zigzag',hstyle:'chain'},1],['ladder',{style:'zigzag',mount:'tie'},1],['twig',{shape:'hex',mount:'free'},1],
      ['dish',{shape:'hex'},1],['plate',{shape:'hex',mode:'engraved'},1],
      ['tile',{texture:'hex'},3],['feeder',{shape:'hex'},3],['mister',{shape:'hex'},3],['moss',{shape:'hex'},3],['stack',{kind:'foot',style:'block'},3],['emblem',{shape:'hex'},3]]},
    namekit:{name:'Name kit',group:'Keeper tools',colours:'Any two colours that suit the customer\'s mantis',note:'Everything with the mantis\'s name on it: name plates, a badge and a keepsake. Type the name once.',pieces:[
      ['plate',{shape:'scroll',mode:'raised'},1],['emblem',{shape:'round',named:1},1],
      ['plate',{shape:'leaf',mode:'raised'},2],['plate',{shape:'arch',mode:'raised'},2],
      ['diorama',{kind:'tombstone',style:'intact',mount:'free'},3]]},
    nursery:{name:'Nymph nursery',group:'Keeper tools',colours:'Any light colour, so tiny nymphs are easy to spot',note:'Small, fine pieces for young nymphs: thin perches, a ladder for moulting and a fly lid for food.',size:.75,pieces:[
      ['ladder',{style:'net',mount:'tie',wid:18},1],['flyLid',{},1],['feeder',{shape:'round'},1],['ledge',{shape:'leaf',pattern:'solid',under:'flat'},1],
      ['moss',{shape:'round'},2],['mister',{shape:'round'},2],['flower',{kind:'daisy',R:16},2],['plate',{shape:'cloud',mode:'raised'},2],
      ['transport',{shape:'round'},3],['ladder',{style:'rope',mount:'tie',wid:16},3],['incubator',{},1],['oothClip',{style:'clip'},2],['cupRack',{cols:3,rows:2},2]]},
    breeder:{name:'Breeder kit',group:'Keeper tools',colours:'Practical colours; one colour is fine',note:'The working set for breeding feeders and raising mantises: fly cup lids, feeder cups, transport and records.',pieces:[
      ['flyLid',{mode:'fabric',pattern:'hex'},1],['flyLid',{mode:'vent',pattern:'grid',cork:'yes'},1],['feeder',{shape:'round'},1],['transport',{shape:'round'},1],
      ['label',{},2],['transport',{shape:'square'},2],['dish',{shape:'round'},2],
      ['ladder',{style:'rope',mount:'tie'},3],['mister',{kind:'hatch'},3],['plate',{shape:'tag',mode:'engraved',font:'caps'},3],['incubator',{},2],['cupRack',{},2],['oothClip',{},3],['chute',{},3],['airlock',{},3],['divider',{},3],['ship',{},3]]},
    shop:{name:'Shop display',group:'Keeper tools',colours:'Your brand colours',note:'Everything to show and sell your mantises and enclosures under your own mark.',pieces:[
      ['emblem',{shape:'round'},1],['plate',{shape:'banner',mode:'raised',logo:'yes'},1],['transport',{shape:'round',handle:'loop'},1],
      ['emblem',{shape:'shield',size:40},2],['plate',{shape:'tag',mode:'engraved'},2],
      ['transport',{shape:'hex'},3],['label',{},3],['ship',{},1],['turntable',{},2]]}
  };
  root.HABITAT_SETS=S;
  /* styles removed in v32 and the theme that took their place */
  const OLD={sakura:'orchid',cottage:'orchid',lotus:'orchid',tropical:'orchid',protea:'orchid',botanical:'orchid',nouveau:'orchid',fanclub:'orchid',sky:'orchid',
    ruins:'temple',olympus:'temple',canyon:'temple',stone:'temple',graveyard:'gothic',curio:'gothic',glow:'gothic',moon:'gothic',
    hoard:'fantasy',wizard:'fantasy',astral:'fantasy',deadleaf:'forest',cabin:'forest',rainforest:'forest',mossy:'forest',fairy:'forest',bamboo:'forest',zen:'forest',pagoda:'forest',reef:'forest',
    honey:'geo',minimal:'geo'};
  root.HABITAT_THEME=k=>S[k]?k:OLD[k]||'orchid';

  /* Flowerpots for each style: the tiered back planter (front surface, top edge, tiers), a standing pot and a wall
     pot (shape, surface, form). Group first, then the styles that differ from their group. */
  const PG={Themes:{tiers:{front:'smooth',top:'flat',tiers:'2'},pot:{shape:'round',surface:'smooth',form:'belly'},wall:{shape:'round',surface:'smooth',form:'belly'}},
    'Keeper tools':{tiers:{front:'smooth',top:'flat',tiers:'2'},pot:{shape:'round',surface:'smooth',form:'belly'},wall:{shape:'round',surface:'smooth',form:'belly'}}};
  const PT={orchid:{tiers:{front:'petals',top:'pointed'},pot:{surface:'petals',form:'belly'},wall:{surface:'petals',form:'tulip'}},
    temple:{tiers:{front:'flutes',top:'flat'},pot:{surface:'flutes',form:'urn'},wall:{surface:'flutes',form:'urn'}},
    gothic:{tiers:{front:'flutes',top:'pointed'},pot:{shape:'square',surface:'flutes',form:'urn'},wall:{shape:'square',surface:'flutes',form:'urn'}},
    fantasy:{tiers:{front:'rock',top:'battlements'},pot:{shape:'pebble',surface:'rock',form:'belly'},wall:{shape:'pebble',surface:'rock',form:'belly'}},
    forest:{tiers:{front:'bark',tiers:'3',layout:'cornerL'},pot:{shape:'pebble',surface:'bark',form:'belly'},wall:{shape:'pebble',surface:'bark',form:'belly'}},
    library:{tiers:{front:'knit',top:'battlements'},pot:{shape:'square',surface:'knit',form:'straight'},wall:{shape:'square',surface:'knit',form:'straight'}},
    geo:{tiers:{front:'facets',tiers:'3'},pot:{shape:'hex',surface:'facets',form:'straight'},wall:{shape:'hex',surface:'facets',form:'straight'}}};
  root.HABITAT_PLANTS=k=>{k=root.HABITAT_THEME(k);const s=S[k],g=PG[s.group]||PG.Themes,t=PT[k]||{},o={};for(const part of ['tiers','pot','wall'])o[part]=Object.assign({},g[part],t[part]||{});return o};
})(typeof window!=='undefined'?window:globalThis);
