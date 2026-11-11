/* Matching set packs for Habitat. Each piece: [item, options, tier] where tier 1 = essentials,
   2 = full set, 3 = deluxe. Options override the item's defaults; sizes scale with the chosen pack size. */
(function(root){
  const S={
    orchid:{name:'Orchid garden',group:'Flowers',colours:'Pink or white, with leaf green',note:'Pink flowers, leaves and vines, made for an orchid mantis.',pieces:[
      ['flower',{kind:'orchid'},1],['ledge',{shape:'leaf',pattern:'vine',under:'D'},1],['dish',{shape:'oval'},1],['plate',{shape:'leaf',mode:'raised'},1],
      ['flower',{kind:'moth',R:20},2],['feeder',{shape:'flower'},2],['ladder',{style:'vine',mount:'tie'},2],['planter',{shape:'scallop'},2],
      ['flower',{kind:'dendrobium',R:18},3],['flower',{kind:'sakura',R:15},3],['tile',{texture:'leaves'},3],['mister',{shape:'flower'},3],['moult',{shape:'leaf',post:'leaf'},3],['emblem',{shape:'leaf'},3]]},
    sakura:{name:'Cherry blossom',group:'Flowers',colours:'Blossom pink and dark brown',note:'Cherry blossom and soft curves.',pieces:[
      ['flower',{kind:'sakura'},1],['ledge',{shape:'moon',pattern:'scroll',under:'flat'},1],['feeder',{shape:'scallop'},1],['plate',{shape:'arch',mode:'raised'},1],
      ['flower',{kind:'sakura',R:16},2],['bridge',{style:'branch'},2],['mister',{shape:'flower'},2],['tile',{texture:'waves'},2],
      ['flower',{kind:'plumeria',R:20},3],['dish',{shape:'round'},3],['moult',{shape:'round',post:'branch'},3],['ladder',{style:'vine',mount:'tie'},3]]},
    cottage:{name:'Cottage garden',group:'Flowers',colours:'White, sunny yellow and red',note:'Daisies, poppies and cosmos in a country garden.',pieces:[
      ['flower',{kind:'daisy'},1],['flower',{kind:'poppy',R:22},1],['pot',{shape:'round'},1],['plate',{shape:'cloud',mode:'raised'},1],
      ['flower',{kind:'cosmos',R:20},2],['planter',{shape:'scallop'},2],['dish',{shape:'round'},2],['tile',{texture:'brick'},2],
      ['flower',{kind:'anemone',R:18},3],['ladder',{style:'rope',mount:'tie'},3],['moult',{shape:'round',post:'stake'},3],['stack',{kind:'foot',style:'bun'},3]]},
    lotus:{name:'Lotus pond',group:'Flowers',colours:'Pale pink with jade green',note:'Lotus flowers, ripples and pond stones.',pieces:[
      ['flower',{kind:'lotus'},1],['tile',{texture:'waves'},1],['dish',{shape:'round'},1],['plate',{shape:'leaf',mode:'engraved'},1],
      ['ledge',{shape:'moon',pattern:'rings',under:'D'},2],['moss',{shape:'round'},2],['mister',{shape:'leaf'},2],['flower',{kind:'lily',R:20},2],
      ['flower',{kind:'lotus',R:18,centre:'seedpod'},3],['bridge',{style:'arc'},3],['moult',{shape:'oval',post:'leaf'},3],['feeder',{shape:'round'},3]]},
    tropical:{name:'Tropical island',group:'Flowers',colours:'Coral, turquoise and sand',note:'Hibiscus, frangipani and pebble beaches.',pieces:[
      ['flower',{kind:'hibiscus'},1],['flower',{kind:'plumeria',R:20},1],['dish',{shape:'oval'},1],['plate',{shape:'banner',mode:'raised'},1],
      ['tile',{texture:'pebbles'},2],['planter',{shape:'cone'},2],['ledge',{shape:'leaf',pattern:'solid',under:'D'},2],['ladder',{style:'bamboo',mount:'tie'},2],
      ['mister',{shape:'flower'},3],['moss',{shape:'kidney'},3],['bridge',{style:'wave'},3],['moult',{shape:'pebble',post:'leaf'},3]]},
    protea:{name:'Cape flora',group:'Flowers',colours:'Dusty pink and sage',note:'Proteas and star flowers from dry hillsides.',pieces:[
      ['flower',{kind:'protea'},1],['flower',{kind:'star',R:18},1],['ledge',{shape:'tiered',pattern:'solid',under:'wedge'},1],['plate',{shape:'tag',mode:'stencil'},1],
      ['twig',{shape:'rock',mount:'free'},2],['dish',{shape:'pebble'},2],['tile',{texture:'stone'},2],['planter',{shape:'facet'},2],
      ['flower',{kind:'dahlia',R:18},3],['bridge',{style:'branch'},3],['moult',{shape:'pebble',post:'fork'},3]]},
    forest:{name:'Forest floor',group:'Woodland',colours:'Bark brown, moss green and mushroom cream',note:'Bark, fungus and pebbles, for a dead-leaf mantis like Deroplatys.',pieces:[
      ['ledge',{shape:'fungus',pattern:'solid',under:'D'},1],['bark',{style:'organic'},1],['dish',{shape:'pebble'},1],['plate',{shape:'cloud',mode:'engraved'},1],
      ['ledge',{shape:'tiered',pattern:'rings',under:'wedge'},2],['twig',{shape:'rock',mount:'free'},2],['tile',{texture:'bark'},2],['feeder',{shape:'pebble'},2],
      ['bridge',{style:'branch'},3],['ledge',{shape:'lobed',pattern:'solid',under:'ribs'},3],['moss',{shape:'kidney'},3],['moult',{shape:'log',post:'branch'},3],['ladder',{style:'bark',mount:'tie'},3]]},
    deadleaf:{name:'Dead leaf',group:'Woodland',colours:'Autumn brown, ochre and rust',note:'Dry leaves and twigs, where a dead-leaf mantis disappears.',pieces:[
      ['ledge',{shape:'leaf',pattern:'solid',under:'D'},1],['tile',{texture:'leaves'},1],['twig',{shape:'cylinder',mount:'free'},1],['plate',{shape:'leaf',mode:'stencil'},1],
      ['ledge',{shape:'leaf',pattern:'vine',under:'flat'},2],['ladder',{style:'bark',mount:'tie'},2],['dish',{shape:'pebble'},2],['bark',{style:'classic'},2],
      ['bridge',{style:'branch'},3],['moult',{shape:'leaf',post:'branch'},3],['feeder',{shape:'pebble'},3],['tile',{texture:'roots'},3]]},
    cabin:{name:'Log cabin',group:'Woodland',colours:'Pine yellow and walnut brown',note:'Planks, logs and rope, like a little cabin in the woods.',pieces:[
      ['tile',{texture:'planks'},1],['ladder',{style:'rope',mount:'tie'},1],['dish',{shape:'round'},1],['plate',{shape:'tag',mode:'engraved'},1],
      ['bark',{style:'cradle'},2],['bridge',{style:'straight'},2],['moult',{shape:'log',post:'stake'},2],['pot',{shape:'square'},2],
      ['stack',{kind:'foot',style:'bun'},3],['ledge',{shape:'classic',pattern:'solid',under:'ribs'},3],['transport',{shape:'square',handle:'loop'},3]]},
    rainforest:{name:'Rainforest',group:'Woodland',colours:'Deep green, lime and bark brown',note:'Hanging vines, big leaves and damp moss.',pieces:[
      ['ledge',{shape:'leaf',pattern:'vine',under:'D'},1],['ladder',{style:'vine',mount:'tie'},1],['moss',{shape:'kidney'},1],['plate',{shape:'leaf',mode:'raised'},1],
      ['tile',{texture:'leaves'},2],['planter',{shape:'halfround'},2],['bridge',{style:'vine'},2],['mister',{shape:'leaf'},2],
      ['flower',{kind:'hibiscus',R:20},3],['ledge',{shape:'fungus',pattern:'vine',under:'flat'},3],['tile',{texture:'moss'},3],['moult',{shape:'leaf',post:'leaf'},3]]},
    mossy:{name:'Mossy hollow',group:'Woodland',colours:'Moss green and stone grey',note:'Soft moss, roots and old stone.',pieces:[
      ['tile',{texture:'moss'},1],['moss',{shape:'corner'},1],['ledge',{shape:'pebble',pattern:'solid',under:'D'},1],['plate',{shape:'cloud',mode:'raised'},1],
      ['tile',{texture:'roots'},2],['dish',{shape:'pebble'},2],['twig',{shape:'rock',mount:'free'},2],['mister',{shape:'pebble'},2],
      ['ledge',{shape:'lobed',pattern:'rings',under:'wedge'},3],['bark',{style:'organic'},3],['moult',{shape:'pebble',post:'branch'},3]]},
    bamboo:{name:'Bamboo grove',group:'Asian garden',colours:'Bamboo green and natural cream',note:'Bamboo canes and quiet lines.',pieces:[
      ['ladder',{style:'bamboo',mount:'tie'},1],['tile',{texture:'bamboo'},1],['pot',{shape:'square'},1],['plate',{shape:'banner',mode:'stencil'},1],
      ['bridge',{style:'straight'},2],['dish',{shape:'round'},2],['moss',{shape:'corner'},2],['ledge',{shape:'classic',pattern:'solid',under:'flat'},2],
      ['planter',{shape:'square'},3],['mister',{shape:'leaf'},3],['moult',{shape:'square',post:'stake'},3],['stack',{kind:'foot',style:'block'},3]]},
    zen:{name:'Zen garden',group:'Asian garden',colours:'Sand, slate grey and moss',note:'Raked waves, smooth stones and a little bridge.',pieces:[
      ['tile',{texture:'waves'},1],['dish',{shape:'pebble'},1],['bridge',{style:'arc'},1],['plate',{shape:'arch',mode:'engraved'},1],
      ['moss',{shape:'crescent'},2],['ledge',{shape:'pebble',pattern:'solid',under:'D'},2],['pot',{shape:'round'},2],['mister',{shape:'round'},2],
      ['flower',{kind:'sakura',R:15},3],['moult',{shape:'round',post:'stake'},3],['stack',{kind:'foot',style:'turned'},3]]},
    pagoda:{name:'Pagoda',group:'Asian garden',colours:'Lacquer red, black and gold',note:'Arches, scales and lacquer colours.',pieces:[
      ['bridge',{style:'gothic'},1],['tile',{texture:'scales'},1],['plate',{shape:'scroll',mode:'raised'},1],['dish',{shape:'hex'},1],
      ['ledge',{shape:'moon',pattern:'scroll',under:'ribs'},2],['flower',{kind:'lotus',R:18},2],['ladder',{style:'chain',mount:'tie'},2],
      ['mister',{shape:'hex'},3],['stack',{kind:'foot',style:'turned'},3],['moult',{shape:'hex',post:'ring'},3],['transport',{shape:'octagon',handle:'loop'},3]]},
    stone:{name:'River stone',group:'Earth and water',colours:'Slate grey and sand',note:'Smooth river stones.',pieces:[
      ['dish',{shape:'pebble'},1],['ledge',{shape:'pebble',pattern:'solid',under:'D'},1],['tile',{texture:'pebbles'},1],['plate',{shape:'rounded',mode:'engraved'},1],
      ['pot',{shape:'pebble',taper:0},2],['moss',{shape:'pebble'},2],['feeder',{shape:'pebble'},2],['twig',{shape:'rock',mount:'free'},2],
      ['mister',{shape:'pebble'},3],['moult',{shape:'pebble',post:'branch'},3],['transport',{shape:'pebble'},3]]},
    canyon:{name:'Desert canyon',group:'Earth and water',colours:'Terracotta, sand and sage',note:'Layered rock, cacti pots and dry stone walls.',pieces:[
      ['ledge',{shape:'tiered',pattern:'solid',under:'D'},1],['tile',{texture:'stone'},1],['twig',{shape:'rock',mount:'free'},1],['plate',{shape:'tag',mode:'stencil'},1],
      ['planter',{shape:'facet'},2],['dish',{shape:'pebble'},2],['bridge',{style:'zigzag'},2],['pot',{shape:'hex'},2],
      ['ledge',{shape:'sharp',pattern:'solid',under:'wedge'},3],['moult',{shape:'square',post:'fork'},3],['stack',{kind:'foot',style:'cone'},3]]},
    reef:{name:'Coral reef',group:'Earth and water',colours:'Coral pink, sea blue and sand',note:'Coral shelves, scales and waves.',pieces:[
      ['ledge',{shape:'fungus',pattern:'rings',under:'ribs'},1],['tile',{texture:'scales'},1],['feeder',{shape:'scallop'},1],['plate',{shape:'cloud',mode:'raised'},1],
      ['ledge',{shape:'lobed',pattern:'web',under:'flat'},2],['tile',{texture:'waves'},2],['mister',{shape:'flower'},2],['dish',{shape:'oval'},2],
      ['flower',{kind:'anemone',R:20},3],['moss',{shape:'crescent'},3],['bridge',{style:'wave'},3],['moult',{shape:'oval',post:'fork'},3]]},
    moon:{name:'Moon and stars',group:'Fantasy',colours:'Midnight blue and silver or glow-in-the-dark',note:'Crescent moons and star flowers. Glow-in-the-dark filament is fun here.',pieces:[
      ['ledge',{shape:'moon',pattern:'rings',under:'D'},1],['flower',{kind:'star'},1],['moss',{shape:'crescent'},1],['plate',{shape:'arch',mode:'stencil'},1],
      ['flower',{kind:'star',R:15},2],['tile',{texture:'waves'},2],['mister',{shape:'round'},2],['dish',{shape:'round'},2],
      ['moult',{shape:'round',post:'ring'},3],['emblem',{shape:'round'},3],['ladder',{style:'chain',mount:'tie'},3]]},
    gothic:{name:'Gothic',group:'Fantasy',colours:'Black, deep purple and silver',note:'Pointed arches, cobwebs and old brick.',pieces:[
      ['ledge',{shape:'classic',pattern:'web',under:'ribs'},1],['bridge',{style:'gothic'},1],['tile',{texture:'brick'},1],['plate',{shape:'scroll',mode:'stencil'},1],
      ['ladder',{style:'chain',mount:'tie'},2],['flower',{kind:'rose'},2],['dish',{shape:'hex'},2],['moult',{shape:'hex',post:'ring'},2],
      ['ledge',{shape:'moon',pattern:'nouveau',under:'flat'},3],['emblem',{shape:'shield'},3],['stack',{kind:'foot',style:'turned'},3],['transport',{shape:'octagon',handle:'loop'},3]]},
    spider:{name:'Spider web',group:'Fantasy',colours:'Bone white and charcoal',note:'Webs and nets everywhere. A favourite for autumn sales.',pieces:[
      ['ledge',{shape:'fungus',pattern:'web',under:'flat'},1],['ladder',{style:'net',mount:'tie'},1],['dish',{shape:'round'},1],['plate',{shape:'tag',mode:'stencil'},1],
      ['ledge',{shape:'moon',pattern:'web',under:'ribs'},2],['tile',{texture:'roots'},2],['flyLid',{pattern:'radial'},2],
      ['bridge',{style:'twisted'},3],['moult',{shape:'round',post:'fork'},3],['flower',{kind:'protea',R:18},3]]},
    nouveau:{name:'Art nouveau',group:'Fantasy',colours:'Antique gold and bottle green',note:'Whiplash curves and filigree.',pieces:[
      ['ledge',{shape:'classic',pattern:'nouveau',under:'ribs'},1],['ladder',{style:'vine',mount:'tie'},1],['plate',{shape:'scroll',mode:'raised'},1],['flower',{kind:'lily'},1],
      ['bridge',{style:'vine'},2],['tile',{texture:'roots'},2],['ledge',{shape:'leaf',pattern:'scroll',under:'D'},2],['feeder',{shape:'flower'},2],
      ['moult',{shape:'oval',post:'leaf'},3],['mister',{shape:'flower'},3],['stack',{kind:'foot',style:'turned'},3],['emblem',{shape:'oval'},3]]},
    ruins:{name:'Ancient ruins',group:'Diorama',colours:'Marble white and terracotta, with moss green',note:'Broken columns, an arch and a mosaic floor, like a Roman site gone wild.',pieces:[
      ['diorama',{kind:'column',style:'broken'},1],['diorama',{kind:'arch',style:'broken',mount:'free'},1],['diorama',{kind:'mosaic',pattern:'meander'},1],['plate',{shape:'scroll',mode:'engraved',font:'caps'},1],
      ['diorama',{kind:'column',style:'intact',h:70},2],['diorama',{kind:'amphora'},2],['tile',{texture:'stone'},2],['ledge',{shape:'tiered',pattern:'solid',under:'D'},2],
      ['diorama',{kind:'column',style:'broken',size:22,h:40},3],['diorama',{kind:'mosaic',pattern:'rosette'},3],['moss',{shape:'crescent'},3],['moult',{shape:'square',post:'stake'},3]]},
    fairy:{name:'Fairy wood',group:'Diorama',colours:'Moss green, toadstool red and cream; glow filament for the accents',note:'A tiny cottage, toadstools and roots. With glow filament the windows and spots light up at night.',pieces:[
      ['diorama',{kind:'cottage',accent:'yes',mount:'free'},1],['diorama',{kind:'mushroom',accent:'yes',n:3},1],['tile',{texture:'roots'},1],['plate',{shape:'cloud',mode:'raised'},1],
      ['diorama',{kind:'mushroom',accent:'yes',n:1,size:22},2],['ladder',{style:'vine',mount:'tie'},2],['moss',{shape:'kidney'},2],['bridge',{style:'branch'},2],
      ['flower',{kind:'star',R:15,accent:'yes'},3],['tile',{texture:'moss'},3],['moult',{shape:'log',post:'branch'},3],['bark',{style:'organic'},3]]},
    temple:{name:'Temple garden',group:'Diorama',colours:'Vermilion red, black and moss green',note:'A torii gate, a pagoda and a lotus pond.',pieces:[
      ['diorama',{kind:'torii',mount:'free'},1],['diorama',{kind:'pagoda'},1],['flower',{kind:'lotus'},1],['plate',{shape:'banner',mode:'raised'},1],
      ['tile',{texture:'waves'},2],['moss',{shape:'crescent'},2],['bridge',{style:'arc'},2],['dish',{shape:'pebble'},2],
      ['diorama',{kind:'pagoda',tiers:2,size:22,h:40},3],['flower',{kind:'sakura',R:16},3],['tile',{texture:'bamboo'},3]]},
    library:{name:'Little library',group:'Diorama',colours:'Walnut brown with bright book colours',note:'Bookshelves and book stacks, for a mantis that looks well read.',pieces:[
      ['diorama',{kind:'shelf',mount:'free'},1],['diorama',{kind:'books',n:4},1],['plate',{shape:'scroll',mode:'raised'},1],['tile',{texture:'planks'},1],
      ['diorama',{kind:'books',n:6,size:22},2],['ledge',{shape:'classic',pattern:'solid',under:'ribs'},2],['dish',{shape:'round'},2],
      ['diorama',{kind:'shelf',h:50,mount:'free'},3],['moult',{shape:'square',post:'stake'},3],['stack',{kind:'foot',style:'turned'},3]]},
    glow:{name:'Midnight glow',group:'Fantasy',colours:'Dark blue or black, with glow-in-the-dark accents',note:'Every piece has an accent part for glow-in-the-dark or UV-reactive filament.',pieces:[
      ['tile',{texture:'stars',accent:'yes'},1],['flower',{kind:'star',accent:'yes'},1],['diorama',{kind:'mushroom',accent:'yes',n:3},1],['plate',{shape:'arch',mode:'raised'},1],
      ['ledge',{shape:'moon',pattern:'rings',under:'D'},2],['flower',{kind:'lily',R:20,accent:'yes'},2],['diorama',{kind:'cottage',accent:'yes',mount:'free'},2],
      ['moult',{shape:'round',post:'ring'},3],['emblem',{shape:'round'},3]]},
    graveyard:{name:'Vampire graveyard',group:'Gothic',colours:'Black, blood red and bone white',note:'Tombstones, a coffin, candles and bats, for a spooky enclosure or a Halloween sale.',pieces:[
      ['diorama',{kind:'tombstone',style:'intact',mount:'free'},1],['diorama',{kind:'coffin',accent:'yes'},1],['sculpt',{kind:'bat',size:80},1],['ledge',{shape:'moon',pattern:'web',under:'flat'},1],
      ['sculpt',{kind:'skull',size:32},2],['diorama',{kind:'candles',accent:'yes'},2],['motif',{motif:'gothicWindow',form:'plaque',base:'arch'},2],['flower',{kind:'rose'},2],['tile',{texture:'brick'},2],
      ['sculpt',{kind:'raven',size:45},3],['diorama',{kind:'tombstone',style:'broken',size:24,h:44,mount:'free'},3],['motif',{motif:'roseWindow',form:'stencil',base:'round'},3],['motif',{motif:'bat',form:'ornament'},3]]},
    curio:{name:'Cabinet of curiosities',group:'Gothic',colours:'Bone white or aged ivory, with black and brass',note:'Lifelike sculpted pieces: a skull, a raven, a death\'s-head moth and a coiled snake, with old books and candles, like a Victorian collector\'s cabinet.',pieces:[
      ['sculpt',{kind:'skull',size:34},1],['sculpt',{kind:'moth',size:70},1],['diorama',{kind:'books',n:4},1],['ledge',{shape:'classic',pattern:'solid',under:'ribs'},1],
      ['sculpt',{kind:'raven',size:45},2],['diorama',{kind:'candles',accent:'yes'},2],['tile',{texture:'planks'},2],['plate',{shape:'scroll',mode:'raised'},2],
      ['sculpt',{kind:'snake',size:55},3],['sculpt',{kind:'bat',size:80},3],['diorama',{kind:'openBook'},3]]},
    wizard:{name:"Wizard's tower",group:'Fantasy',colours:'Deep purple, midnight blue and silver; translucent filament for crystals and potions',note:'A tower, crystals, potions and an open spell book.',pieces:[
      ['diorama',{kind:'tower',style:'intact'},1],['diorama',{kind:'crystals',accent:'yes'},1],['diorama',{kind:'potions',accent:'yes'},1],['motif',{motif:'moon',form:'plaque',base:'round'},1],
      ['diorama',{kind:'openBook'},2],['motif',{motif:'wizardHat',form:'cutout',mount:'free'},2],['tile',{texture:'stars',accent:'yes'},2],['ledge',{shape:'tiered',pattern:'solid',under:'D'},2],
      ['diorama',{kind:'mushroom',accent:'yes',n:2},3],['motif',{motif:'potion',form:'ornament'},3],['diorama',{kind:'books',n:4},3]]},
    hoard:{name:"Dragon's hoard",group:'Fantasy',colours:'Dragon green or red, with gold',note:'A treasure chest, dice, a sword in the stone and a dragon on the wall, for D&D fans.',pieces:[
      ['diorama',{kind:'chest',accent:'yes'},1],['motif',{motif:'dragon',form:'plaque',base:'shield'},1],['diorama',{kind:'dice'},1],['ledge',{shape:'fungus',pattern:'solid',under:'D'},1],
      ['diorama',{kind:'sword'},2],['motif',{motif:'d20',form:'plaque',base:'hex'},2],['motif',{motif:'swordShield',form:'cutout',mount:'free'},2],['tile',{texture:'stone'},2],
      ['motif',{motif:'castle',form:'plaque',base:'arch'},3],['diorama',{kind:'tower',style:'broken',h:50},3],['motif',{motif:'scroll',form:'plaque',base:'square'},3]]},
    astral:{name:'Astral zodiac',group:'Fantasy',colours:'Midnight blue with gold or glow-in-the-dark',note:'A zodiac wheel, sun and moon, stars and crystals.',pieces:[
      ['motif',{motif:'zodiacWheel',form:'plaque',base:'round'},1],['tile',{texture:'stars',accent:'yes'},1],['ledge',{shape:'moon',pattern:'rings',under:'D'},1],['flower',{kind:'star',accent:'yes'},1],
      ['motif',{motif:'sun',form:'plaque',base:'round'},2],['motif',{motif:'moon',form:'plaque',base:'round'},2],['diorama',{kind:'crystals',accent:'yes'},2],
      ['motif',{motif:'zodiac-leo',form:'ornament'},3],['motif',{motif:'zodiac-pisces',form:'ornament'},3],['moult',{shape:'round',post:'ring'},3]]},
    olympus:{name:'Mount Olympus',group:'Diorama',colours:'Marble white with gold or terracotta',note:'Greek temples, laurels, an owl of Athena and a Corinthian helmet.',pieces:[
      ['motif',{motif:'temple',form:'plaque',base:'square'},1],['diorama',{kind:'column',style:'intact'},1],['diorama',{kind:'amphora'},1],['motif',{motif:'laurel',form:'plaque',base:'round'},1],
      ['motif',{motif:'owl',form:'cutout',mount:'free'},2],['motif',{motif:'helmet',form:'plaque',base:'shield'},2],['diorama',{kind:'mosaic',pattern:'meander'},2],['ledge',{shape:'classic',pattern:'solid',under:'ribs'},2],
      ['motif',{motif:'ionic',form:'plaque',base:'arch'},3],['motif',{motif:'lyre',form:'ornament'},3],['diorama',{kind:'column',style:'broken',size:22,h:40},3],['plate',{shape:'scroll',mode:'engraved',font:'caps'},3]]},
    sky:{name:'Cloud kingdom',group:'Fantasy',colours:'Sky blue and white, with sunny yellow',note:'Cloud shelves, a sun and rain clouds.',pieces:[
      ['ledge',{shape:'cloud',pattern:'solid',under:'D'},1],['motif',{motif:'sun',form:'plaque',base:'round'},1],['motif',{motif:'cloud',form:'cutout',mount:'free'},1],['dish',{shape:'round'},1],
      ['ledge',{shape:'cloud',pattern:'rings',under:'flat',L:55},2],['motif',{motif:'rainCloud',form:'ornament'},2],['tile',{texture:'waves'},2],['flower',{kind:'sakura',R:18},2],
      ['plate',{shape:'cloud',mode:'raised'},3],['mister',{shape:'flower'},3],['motif',{motif:'moon',form:'ornament'},3]]},
    botanical:{name:'Botanical garden',group:'Flowers',colours:'Fresh greens with bright petals',note:'A garden of big blooms: sunflower, peony, magnolia, gerbera and water lily.',pieces:[
      ['flower',{kind:'sunflower'},1],['flower',{kind:'peony',R:22},1],['planter',{shape:'scallop'},1],['motif',{motif:'tulip',form:'plaque',base:'arch'},1],
      ['flower',{kind:'magnolia',R:22},2],['flower',{kind:'gerbera',R:20},2],['pot',{shape:'round'},2],['ledge',{shape:'leaf',pattern:'vine',under:'D'},2],
      ['flower',{kind:'waterlily',R:20},3],['flower',{kind:'camellia',R:18},3],['motif',{motif:'rose',form:'plaque',base:'oval'},3],['tile',{texture:'leaves'},3]]},
    fanclub:{name:'Mantis fan club',group:'Keeper kits',colours:'Orchid pink and leaf green, or your brand colours',note:'Praying mantis artwork everywhere, plus your Shifty\'s mark.',pieces:[
      ['motif',{motif:'mantis',form:'plaque',base:'oval'},1],['flower',{kind:'orchid'},1],['emblem',{shape:'round'},1],['plate',{shape:'leaf',mode:'raised'},1],
      ['motif',{motif:'mantis',form:'ornament'},2],['motif',{motif:'mantis',form:'stencil',base:'hex'},2],['ledge',{shape:'leaf',pattern:'vine',under:'D'},2],
      ['moult',{shape:'leaf',post:'leaf'},3],['motif',{motif:'mantis',form:'cutout',mount:'free',size:80},3]]},
    honey:{name:'Honeycomb',group:'Modern',colours:'Honey yellow and black',note:'Hexagons everywhere.',pieces:[
      ['dish',{shape:'hex'},1],['tile',{texture:'hex'},1],['pot',{shape:'hex'},1],['plate',{shape:'hex',mode:'stencil'},1],
      ['feeder',{shape:'hex'},2],['twig',{shape:'hex',mount:'free'},2],['mister',{shape:'hex'},2],['moss',{shape:'hex'},2],
      ['planter',{shape:'halfhex'},3],['moult',{shape:'hex',post:'stake'},3],['stack',{kind:'foot',style:'hex'},3],['transport',{shape:'hex'},3],['emblem',{shape:'hex'},3]]},
    geo:{name:'Geometric',group:'Modern',colours:'Matte white with one bright accent',note:'Facets, diamonds and sharp lines.',pieces:[
      ['ledge',{shape:'sharp',pattern:'solid',under:'wedge'},1],['planter',{shape:'facet'},1],['dish',{shape:'hex'},1],['plate',{shape:'hex',mode:'engraved'},1],
      ['bridge',{style:'zigzag'},2],['ladder',{style:'zigzag',mount:'tie'},2],['flyLid',{pattern:'diamond'},2],['tile',{texture:'hex'},2],
      ['transport',{shape:'octagon'},3],['stack',{kind:'foot',style:'block'},3],['moult',{shape:'square',post:'stake'},3]]},
    minimal:{name:'Minimal',group:'Modern',colours:'One colour, white or grey',note:'Clean shapes, nothing extra.',pieces:[
      ['ledge',{shape:'classic',pattern:'solid',under:'flat'},1],['dish',{shape:'round'},1],['twig',{shape:'cylinder',mount:'free'},1],['plate',{shape:'rounded',mode:'engraved',font:'caps'},1],
      ['pot',{shape:'square'},2],['feeder',{shape:'round'},2],['mister',{shape:'round'},2],
      ['moult',{shape:'round',post:'stake'},3],['stack',{kind:'foot',style:'block'},3],['transport',{shape:'square'},3]]},
    nursery:{name:'Nymph nursery',group:'Keeper kits',colours:'Any light colour, so tiny nymphs are easy to spot',note:'Small, fine pieces for young nymphs: thin perches, a ladder for moulting and a fly lid for food.',size:.75,pieces:[
      ['ladder',{style:'net',mount:'tie',wid:18},1],['flyLid',{},1],['feeder',{shape:'round'},1],['ledge',{shape:'leaf',pattern:'solid',under:'flat'},1],
      ['moss',{shape:'round'},2],['mister',{shape:'round'},2],['flower',{kind:'daisy',R:16},2],['plate',{shape:'cloud',mode:'raised'},2],
      ['transport',{shape:'round'},3],['moult',{shape:'round',post:'stake'},3],['ladder',{style:'rope',mount:'tie',wid:16},3],['incubator',{},1],['oothClip',{style:'clip'},2],['cupRack',{cols:3,rows:2},2]]},
    breeder:{name:'Breeder kit',group:'Keeper kits',colours:'Practical colours; one colour is fine',note:'The working set for breeding feeders and raising mantises: fly cup lids, feeder cups, transport and records.',pieces:[
      ['flyLid',{mode:'fabric',pattern:'hex'},1],['flyLid',{mode:'vent',pattern:'grid',cork:'yes'},1],['feeder',{shape:'round'},1],['transport',{shape:'round'},1],
      ['label',{},2],['moult',{shape:'square',post:'stake',font:'caps'},2],['transport',{shape:'square'},2],['dish',{shape:'round'},2],
      ['ladder',{style:'rope',mount:'tie'},3],['mister',{kind:'hatch'},3],['plate',{shape:'tag',mode:'engraved',font:'caps'},3],['incubator',{},2],['cupRack',{},2],['oothClip',{},3],['chute',{},3],['airlock',{},3],['divider',{},3],['ship',{},3]]},
    shop:{name:'Shop display',group:'Keeper kits',colours:'Your brand colours',note:'Everything to show and sell your mantises and enclosures under your own mark.',pieces:[
      ['emblem',{shape:'round'},1],['plate',{shape:'banner',mode:'raised',logo:'yes'},1],['transport',{shape:'round',handle:'loop'},1],
      ['moult',{shape:'round',post:'branch'},2],['emblem',{shape:'shield',size:40},2],['plate',{shape:'tag',mode:'engraved'},2],
      ['transport',{shape:'hex'},3],['moult',{shape:'log',post:'leaf'},3],['label',{},3],['ship',{},1],['turntable',{},2]]}
  };
  root.HABITAT_SETS=S;
})(typeof window!=='undefined'?window:globalThis);
