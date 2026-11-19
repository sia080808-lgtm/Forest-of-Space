// 0.8.1 계절 풍경 (SRS v2.31 SE-16~): the paper background stays, the objects take the season's ink-wash pictures, season
// props, winter snow cover and footprints, seasonal footsteps and music. Render/audio only: the state never changes.
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const web=path.resolve(__dirname,'../../app/src/main/assets/web'),F=require(web+'/engine'),E=F.Environment,Au=require(web+'/audio');
const game=()=>{const s=F.create(0,6);s.started=true;s.environment.calendar={start:0};return s;};

test('SE-16 the paper background never changes with the season (no seasonal colour over the world)',()=>{
 const s=game(),grade=t=>{s.worldTick=t;return JSON.stringify(E.lighting(s));};
 // same time of day and weather in every season gives the same world grade
 for(const t of [600+3600,600+7200,600+10800])a.equal(grade(t),grade(600));
 for(const se of ['spring','summer','autumn','winter'])a.equal(E.SEASON_TINT[se][3],0);
});

test('SE-17 seasonal pictures for every object picture and the season props exist',()=>{
 const dir=path.join(web,'assets/forest/seasons');
 for(const n of ['frame','shade-plant','shade-ground','terrain','shelter-art',...[1,2,3,4,5,6].map(i=>'fern-'+i)])for(const se of ['spring','autumn','winter'])a.ok(fs.statSync(path.join(dir,n+'-'+se+'.png')).size>500,n+se);
 for(const se of ['spring','autumn','winter'])a.ok(fs.statSync(path.join(dir,'garden-dry-'+se+'.jpg')).size>1000);
 for(const n of ['sprout-1','sprout-2','sprout-3','blossom','maple-1','maple-2','ginkgo-1','ginkgo-2','snow-1','snow-2'])a.ok(fs.statSync(path.join(dir,'props',n+'.png')).size>200,n);
 const scene=fs.readFileSync(path.join(web,'scene.js'),'utf8');for(const k of ['seasonProps','seasonFall','snowCover','springSeason','footprint','drawPrints'])a.match(scene,new RegExp(k+'\\('));
});

test('SE-18 each season has its own music (summer keeps the original tracks), day and night, full mixes',()=>{
 const s=game(),pick=(t,night)=>{s.worldTick=t;return Au.musicFor(s,night);};
 a.equal(pick(600,false),'springDay');a.equal(pick(600,true),'springNight');a.equal(pick(4200,false),'day');a.equal(pick(4200,true),'night');
 a.equal(pick(7800,false),'autumnDay');a.equal(pick(11400,true),'winterNight');
 a.equal(pick(3600+30,false),'springDay','the first 60 s of a season still play the last season (crossfade from halfway)');
 for(const k of Au.MUSIC){a.ok(Au.FILES[k].endsWith('_FULL.ogg'),k);a.ok(fs.statSync(path.join(web,'assets/audio',Au.FILES[k])).size>100000,k);}
 const save={...game(),environment:undefined};a.equal(Au.musicFor(save,false),'day','no calendar: the original music');
});
