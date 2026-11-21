package com.ridleydesk.mobile;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.media.MediaCodec;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMuxer;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.AtomicFile;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.widget.FrameLayout;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

/** Offline Android shell. The bridge is reachable only by bundled assets. */
public final class MainActivity extends Activity {
    private static final String ORIGIN = "https://appassets.androidplatform.net/";
    private static final int EXPORT = 40, IMPORT = 41;
    private static final int MAX_BYTES = 16 * 1024 * 1024;
    private WebView web;
    private AtomicFile state;
    private String pendingExport;
    private boolean loaded, foreground;
    private long lastCheckpointArchive = 0;
    // No lambdas: the APK must run even when built with a dexer that does not desugar invokedynamic (0.6.12 crash).
    private static final java.io.FilenameFilter JSON_FILES = new java.io.FilenameFilter() { @Override public boolean accept(File d, String name) { return name.endsWith(".json"); } };
    private static final java.util.Comparator<File> NEWEST_FIRST = new java.util.Comparator<File>() { @Override public int compare(File x, File y) { return Long.compare(y.lastModified(), x.lastModified()); } };

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        state = new AtomicFile(new File(getFilesDir(), "forest-of-space.json"));
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#F7F4EC"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setMediaPlaybackRequiresUserGesture(true);
        web.addJavascriptInterface(new LocalBridge(), "RidleyNative");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView w, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (!"https".equals(u.getScheme()) || !"appassets.androidplatform.net".equals(u.getHost())) return empty();
                String path = u.getPath();
                if (path == null || path.contains("..")) return empty();
                if (path.equals("/")) path = "/index.html";
                String mime = path.endsWith(".js") ? "text/javascript" : path.endsWith(".css") ? "text/css" : path.endsWith(".png") ? "image/png" : path.endsWith(".jpg") ? "image/jpeg" : path.endsWith(".woff2") ? "font/woff2" : path.endsWith(".ttf") ? "font/ttf" : path.endsWith(".svg") ? "image/svg+xml" : path.endsWith(".ogg") ? "audio/ogg" : path.endsWith(".wav") ? "audio/wav" : path.endsWith(".json") ? "application/json" : "text/html";
                try { return new WebResourceResponse(mime, "UTF-8", getAssets().open("web" + path)); }
                catch (Exception e) { return empty(); }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView w, WebResourceRequest r) { return true; }
            @Override public void onPageFinished(WebView w, String url) {
                loaded = true;
                web.evaluateJavascript("window.RidleyApp && RidleyApp.nativeResume()", null);
            }
        });
        FrameLayout root = new FrameLayout(this);
        root.addView(web, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                // Android 15 draws edge-to-edge: keep all app controls clear of system bars/keyboard.
                v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
                return insets.consumeSystemWindowInsets();
            }
        });
        web.loadUrl(ORIGIN);
        if (saved != null) pendingExport = saved.getString("pendingExport");
    }
    private WebResourceResponse empty() { return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0])); }
    private void js(final String code) { runOnUiThread(new Runnable() { @Override public void run() { if (web != null) web.evaluateJavascript(code, null); } }); }
    private void message(String text) { js("window.RidleyApp && RidleyApp.notice(" + JSONObject.quote(text) + ")"); }

    public final class LocalBridge {
        @JavascriptInterface public synchronized String read() {
            if (!state.getBaseFile().exists() && !new File(state.getBaseFile()+".bak").exists()) {
                try { File legacy = new File(getFilesDir(), "ridleydesk-mobile.json");
                    return legacy.exists() ? new String(new AtomicFile(legacy).readFully(), StandardCharsets.UTF_8) : "";
                } catch (Exception e) { return "{\"storageError\":true}"; }
            }
            try { return new String(state.readFully(), StandardCharsets.UTF_8); }
            catch (Exception e) { return "{\"storageError\":true}"; }
        }
        @JavascriptInterface public synchronized boolean save(String json) {
            FileOutputStream out = null;
            try {
                byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
                if (bytes.length > MAX_BYTES || new JSONObject(json).optInt("schema") != 1) return false;
                long now = System.currentTimeMillis();
                if (now - lastCheckpointArchive >= 60000 && state.getBaseFile().exists()) {
                    if (!archive(new String(state.readFully(), StandardCharsets.UTF_8))) return false;
                    lastCheckpointArchive = now;
                }
                out = state.startWrite(); out.write(bytes); state.finishWrite(out); return true;
            } catch (Exception e) { if (out != null) state.failWrite(out); return false; }
        }
        @JavascriptInterface public synchronized boolean archive(String json) {
            File dir = new File(getFilesDir(), "forest-backups");
            if (!dir.exists() && !dir.mkdirs()) return false;
            AtomicFile backup = new AtomicFile(new File(dir, "backup-" + System.currentTimeMillis() + "-" + System.nanoTime() + ".json"));
            FileOutputStream out = null;
            try {
                byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
                if (bytes.length > MAX_BYTES || new JSONObject(json).optInt("schema") != 1) return false;
                out = backup.startWrite(); out.write(bytes); backup.finishWrite(out);
                File[] files = dir.listFiles(JSON_FILES);
                if (files != null) {
                    java.util.Arrays.sort(files, NEWEST_FIRST);
                    for (int i=10; i<files.length; i++) files[i].delete();
                }
                return true;
            } catch (Exception e) { if (out != null) backup.failWrite(out); return false; }
        }
        @JavascriptInterface public synchronized String readArchive() {
            File dir = new File(getFilesDir(), "forest-backups");
            File[] files = dir.listFiles(JSON_FILES);
            if (files == null) return "";
            java.util.Arrays.sort(files, NEWEST_FIRST);
            for (File f : files) try { return new String(new AtomicFile(f).readFully(), StandardCharsets.UTF_8); } catch (Exception ignored) { }
            return "";
        }
        @JavascriptInterface public void exportBackup(String json) {
            if (json.length() > MAX_BYTES) { message("백업 크기가 너무 큽니다."); return; }
            pendingExport = json;
            runOnUiThread(new Runnable() { @Override public void run() {
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE);
                i.putExtra(Intent.EXTRA_TITLE, "Forest-of-Space-" + new java.text.SimpleDateFormat("yyyyMMdd-HHmm", java.util.Locale.US).format(new java.util.Date()) + ".json");
                try { startActivityForResult(i, EXPORT); } catch (Exception e) { message("파일 저장 앱을 열 수 없습니다."); }
            } });
        }
        @JavascriptInterface public void importBackup() {
            runOnUiThread(new Runnable() { @Override public void run() {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE);
                try { startActivityForResult(i, IMPORT); } catch (Exception e) { message("파일 선택 앱을 열 수 없습니다."); }
            } });
        }
        /** 0.8.2: save a photo of the world (PNG from the game canvas) to Pictures/여백의 숲. MediaStore needs no permission on API 29+. */
        @JavascriptInterface public boolean savePhoto(String dataUrl, String name) {
            final String head = "data:image/png;base64,";
            if (dataUrl == null || !dataUrl.startsWith(head) || dataUrl.length() > 4 * MAX_BYTES) return false;
            String file = (name == null || !name.matches("[\\p{L}\\p{N}._-]{1,80}\\.png")) ? "Forest-of-Space.png" : name;
            Uri uri = null;
            try {
                byte[] png = Base64.decode(dataUrl.substring(head.length()), Base64.DEFAULT);
                ContentValues v = new ContentValues();
                v.put(MediaStore.Images.Media.DISPLAY_NAME, file);
                v.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                v.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/여백의 숲");
                v.put(MediaStore.Images.Media.IS_PENDING, 1);
                uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                if (uri == null) return false;
                try (OutputStream out = getContentResolver().openOutputStream(uri, "w")) {
                    if (out == null) throw new IllegalStateException();
                    out.write(png);
                }
                v.clear();
                v.put(MediaStore.Images.Media.IS_PENDING, 0);
                getContentResolver().update(uri, v, null, null);
                return true;
            } catch (Exception e) {
                if (uri != null) { try { getContentResolver().delete(uri, null, null); } catch (Exception ignored) { } }
                return false;
            }
        }
        /* 1.1.7 video: the page streams a recording of the world canvas here in pieces (begin, chunk..., end), so a one-minute
           video never has to sit in memory as one string. 1.1.9: the pieces go to a temporary file first. The browser's recorder
           writes a fragmented file whose header says the video is 0 s long, so galleries showed only a few seconds; at the end it
           is copied sample by sample into a normal video file (MediaMuxer) with the real length, and saved to Movies/여백의 숲.
           If that copy fails on some phone, the recording is saved as it came. */
        private OutputStream videoOut; private File videoTmp; private String videoName, videoMime; private long videoBytes;
        @JavascriptInterface public synchronized boolean videoBegin(String name, String mime) {
            videoEnd(false);
            if (!"video/mp4".equals(mime) && !"video/webm".equals(mime)) return false;
            String ext = "video/mp4".equals(mime) ? "mp4" : "webm";
            videoName = (name == null || !name.matches("[\\p{L}\\p{N}._-]{1,80}\\." + ext)) ? "Forest-of-Space." + ext : name;
            videoMime = mime;
            try {
                videoTmp = new File(getCacheDir(), "recording.part");
                videoOut = new FileOutputStream(videoTmp, false);
                videoBytes = 0;
                return true;
            } catch (Exception e) { videoEnd(false); return false; }
        }
        @JavascriptInterface public synchronized boolean videoChunk(String base64) {
            if (videoOut == null || base64 == null) return false;
            try {
                byte[] b = Base64.decode(base64, Base64.DEFAULT);
                videoBytes += b.length;
                if (videoBytes > 20L * MAX_BYTES) throw new IllegalStateException();
                videoOut.write(b);
                return true;
            } catch (Exception e) { videoEnd(false); return false; }
        }
        @JavascriptInterface public synchronized boolean videoEnd(boolean keep) {
            OutputStream out = videoOut; File tmp = videoTmp; videoOut = null; videoTmp = null;
            boolean ok = keep && out != null && tmp != null && videoBytes > 0;
            if (out != null) { try { out.close(); } catch (Exception e) { ok = false; } }
            Uri uri = null;
            try {
                if (ok) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Video.Media.DISPLAY_NAME, videoName);
                    v.put(MediaStore.Video.Media.MIME_TYPE, videoMime);
                    v.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/여백의 숲");
                    v.put(MediaStore.Video.Media.IS_PENDING, 1);
                    uri = getContentResolver().insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, v);
                    if (uri == null) throw new IllegalStateException();
                    try { remux(tmp, uri, "video/webm".equals(videoMime)); }
                    catch (Exception e) { copyFile(tmp, uri); }
                    v.clear();
                    v.put(MediaStore.Video.Media.IS_PENDING, 0);
                    getContentResolver().update(uri, v, null, null);
                }
            } catch (Exception e) {
                ok = false;
                if (uri != null) { try { getContentResolver().delete(uri, null, null); } catch (Exception ignored) { } }
            }
            if (tmp != null) tmp.delete();
            return ok;
        }
        private void copyFile(File src, Uri dst) throws Exception {
            try (InputStream in = new FileInputStream(src); OutputStream o = getContentResolver().openOutputStream(dst, "wt")) {
                if (o == null) throw new IllegalStateException();
                byte[] buf = new byte[1 << 16]; int n;
                while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
            }
        }
        private void remux(File src, Uri dst, boolean webm) throws Exception {
            MediaExtractor ex = new MediaExtractor(); MediaMuxer mx = null; ParcelFileDescriptor pfd = null;
            try {
                ex.setDataSource(src.getPath());
                pfd = getContentResolver().openFileDescriptor(dst, "rwt");
                if (pfd == null) throw new IllegalStateException();
                mx = new MediaMuxer(pfd.getFileDescriptor(), webm ? MediaMuxer.OutputFormat.MUXER_OUTPUT_WEBM : MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
                int n = ex.getTrackCount(), size = 1 << 21; int[] map = new int[n];
                for (int i = 0; i < n; i++) {
                    MediaFormat f = ex.getTrackFormat(i); String m = f.getString(MediaFormat.KEY_MIME);
                    if (m == null || !(m.startsWith("video/") || m.startsWith("audio/"))) { map[i] = -1; continue; }
                    ex.selectTrack(i); map[i] = mx.addTrack(f);
                    if (f.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) size = Math.max(size, f.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE));
                }
                mx.start();
                ByteBuffer buf = ByteBuffer.allocate(size); MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
                long base = -1; int count = 0;
                while (true) {
                    int len = ex.readSampleData(buf, 0);
                    if (len < 0) break;
                    int t = ex.getSampleTrackIndex(); long ts = ex.getSampleTime();
                    if (base < 0) base = ts;
                    if (t >= 0 && t < n && map[t] >= 0) {
                        info.set(0, len, Math.max(0, ts - base), (ex.getSampleFlags() & MediaExtractor.SAMPLE_FLAG_SYNC) != 0 ? MediaCodec.BUFFER_FLAG_KEY_FRAME : 0);
                        mx.writeSampleData(map[t], buf, info); count++;
                    }
                    ex.advance();
                }
                if (count == 0) throw new IllegalStateException();
                mx.stop();
            } finally {
                if (mx != null) { try { mx.release(); } catch (Exception ignored) { } }
                ex.release();
                if (pfd != null) { try { pfd.close(); } catch (Exception ignored) { } }
            }
        }
        @JavascriptInterface public void theme(final boolean dark) {
            runOnUiThread(new Runnable() { @Override public void run() {
                getWindow().setStatusBarColor(Color.parseColor(dark ? "#232A27" : "#F7F4EC"));
                getWindow().setNavigationBarColor(Color.parseColor(dark ? "#232A27" : "#F7F4EC"));
                getWindow().getDecorView().setSystemUiVisibility(dark ? 0 : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
            } });
        }
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (result != RESULT_OK || data == null || data.getData() == null) { pendingExport = null; return; }
        Uri uri = data.getData();
        try {
            if (request == EXPORT && pendingExport != null) {
                try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                    if (out == null) throw new IllegalStateException();
                    out.write(pendingExport.getBytes(StandardCharsets.UTF_8));
                }
                pendingExport = null; message("백업 파일을 저장했어요.");
            } else if (request == IMPORT) {
                ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                try (InputStream in = getContentResolver().openInputStream(uri)) {
                    if (in == null) throw new IllegalStateException();
                    byte[] b = new byte[8192]; int n;
                    while ((n = in.read(b)) != -1) { bytes.write(b, 0, n); if (bytes.size() > MAX_BYTES) throw new IllegalArgumentException(); }
                }
                String text = new String(bytes.toByteArray(), StandardCharsets.UTF_8);
                js("RidleyApp.offerImport("+JSONObject.quote(text)+")");
            }
        } catch (Exception e) { message("파일을 처리하지 못했어요. 원래 기록은 유지됩니다."); }
    }
    @Override public void onBackPressed() {
        web.evaluateJavascript("window.RidleyApp ? RidleyApp.back() : false", new android.webkit.ValueCallback<String>() { @Override public void onReceiveValue(String value) { if (!"true".equals(value)) moveTaskToBack(true); } });
    }
    @Override protected void onPause() {
        foreground = false;
        if (loaded) web.evaluateJavascript("RidleyApp.nativePause()", new android.webkit.ValueCallback<String>() { @Override public void onReceiveValue(String value) { if (!foreground && web != null) web.onPause(); } });
        else web.onPause();
        super.onPause();
    }
    @Override protected void onResume() { super.onResume(); foreground = true; if (web != null) { web.onResume(); if (loaded) web.evaluateJavascript("RidleyApp.nativeResume()", null); } }
    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); /* No large backup payload in Bundle. */ }
    @Override protected void onDestroy() { if (web != null) { web.removeJavascriptInterface("RidleyNative"); web.destroy(); web = null; } super.onDestroy(); }
}
