#!/usr/bin/env python3
"""Build a signed offline APK with Android SDK build-tools and Eclipse ECJ.

No Gradle dependency download is required. All subprocess arguments are arrays.
See README.md for SDK versions, checksums and the signing backup requirement.
"""
import argparse
import pathlib
import shutil
import subprocess
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
def run(args):
    subprocess.run([str(a) for a in args], check=True, cwd=ROOT)

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--build-tools', type=pathlib.Path, required=True)
    p.add_argument('--android-jar', type=pathlib.Path, required=True)
    p.add_argument('--ecj', type=pathlib.Path, required=True)
    p.add_argument('--keystore', type=pathlib.Path, required=True)
    p.add_argument('--password-file', type=pathlib.Path, required=True)
    p.add_argument('--alias', default='ridleydesk-personal')
    p.add_argument('--output', type=pathlib.Path, default=ROOT/'build/Forest-of-Space-0.3.0.apk')
    a=p.parse_args()
    for key in ('build_tools','android_jar','ecj','keystore','password_file','output'):
        setattr(a,key,getattr(a,key).resolve())
    build=ROOT/'build';build.mkdir(exist_ok=True)
    for n in ('classes','dex','generated'):
        shutil.rmtree(build/n,ignore_errors=True);(build/n).mkdir()
    src=ROOT/'app/src/main'
    run([a.build_tools/'aapt2','compile','--dir',src/'res','-o',build/'resources.zip'])
    run([a.build_tools/'aapt2','link','-o',build/'base.apk','-I',a.android_jar,'--manifest',src/'AndroidManifest.xml','--java',build/'generated','-A',src/'assets',build/'resources.zip'])
    java_files=sorted((src/'java').rglob('*.java'))+sorted((build/'generated').rglob('*.java'))
    run(['java','-jar',a.ecj,'-8','-encoding','UTF-8','-warn:none','-bootclasspath',str(a.android_jar)+':'+str(a.build_tools/'core-lambda-stubs.jar'),'-d',build/'classes',*java_files])
    with zipfile.ZipFile(build/'classes.jar','w',zipfile.ZIP_DEFLATED) as z:
        for f in (build/'classes').rglob('*.class'):z.write(f,f.relative_to(build/'classes'))
    run(['java','-cp',a.build_tools/'lib/d8.jar','com.android.tools.r8.D8','--min-api','29','--lib',a.android_jar,'--output',build/'dex',build/'classes.jar'])
    shutil.copyfile(build/'base.apk',build/'unsigned.apk')
    with zipfile.ZipFile(build/'unsigned.apk','a',zipfile.ZIP_DEFLATED) as z:
        for f in (build/'dex').glob('*.dex'):z.write(f,f.name)
    run([a.build_tools/'zipalign','-f','4',build/'unsigned.apk',build/'aligned.apk'])
    a.output.parent.mkdir(parents=True,exist_ok=True)
    run(['java','-jar',a.build_tools/'lib/apksigner.jar','sign','--ks',a.keystore,'--ks-pass','file:'+str(a.password_file),'--ks-key-alias',a.alias,'--out',a.output,build/'aligned.apk'])
    run(['java','-jar',a.build_tools/'lib/apksigner.jar','verify','--verbose',a.output])
    run([a.build_tools/'zipalign','-c','4',a.output])
    print('APK:',a.output)
if __name__=='__main__':main()
