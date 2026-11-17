const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../../app/src/main/java/com/ridleydesk/mobile/MainActivity.java'),'utf8');
// 0.6.12 crashed on launch: a dexer without lambda desugaring left invokedynamic/LambdaMetafactory in classes.dex.
test('APK0613-01 Android shell has no lambdas or method references (safe with any dexer)',()=>{
 const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'').replace(/"(?:\\.|[^"\\])*"/g,'""');
 a.ok(!/->/.test(code),'lambda arrow found');a.ok(!/::/.test(code),'method reference found');});
