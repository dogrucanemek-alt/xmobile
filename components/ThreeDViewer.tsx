import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { getThreeBundle } from '../lib/threejsLoader';

interface ThreeDViewerProps {
  glbUrl: string;
  baslik: string;
  visible: boolean;
  onKapat: () => void;
}

function threejsHtml(glbUrl: string, bundle: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; overflow: hidden; width: 100vw; height: 100vh; }
  #yukleniyor {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    color: #00D4FF; font-family: -apple-system, system-ui, sans-serif;
    text-align: center; pointer-events: none;
  }
  #ilerleme { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
  #yukleniyorText { font-size: 11px; opacity: 0.5; letter-spacing: 1px; text-transform: uppercase; }
  #hata { display: none; position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    color: #ff4444; font-family: system-ui; text-align: center; font-size: 13px; }
</style>
</head>
<body>
<div id="yukleniyor">
  <div id="ilerleme">3D</div>
  <div id="yukleniyorText">Model yukleniyor...</div>
</div>
<div id="hata">Model yuklenemedi</div>
<script>${bundle}</script>
<script>
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(0, 0.5, 3);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 0.5;
controls.maxDistance = 10;

var ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);
var dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight1.position.set(1, 2, 3);
scene.add(dirLight1);
var dirLight2 = new THREE.DirectionalLight(0x00D4FF, 0.3);
dirLight2.position.set(-2, 1, -1);
scene.add(dirLight2);

var loader = new THREE.GLTFLoader();
loader.load(
  '${glbUrl}',
  function(gltf) {
    document.getElementById('yukleniyor').style.display = 'none';
    var model = gltf.scene;
    var box = new THREE.Box3().setFromObject(model);
    var center = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z);
    var scale = 2.0 / maxDim;
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    model.position.y -= size.y * scale * 0.2;
    scene.add(model);
  },
  undefined,
  function() {
    document.getElementById('yukleniyor').style.display = 'none';
    document.getElementById('hata').style.display = 'block';
  }
);

window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
</script>
</body>
</html>`;
}

export default function ThreeDViewer({ glbUrl, baslik, visible, onKapat }: ThreeDViewerProps) {
  const [bundle, setBundle] = useState<string | null>(null);

  useEffect(() => {
    if (visible && !bundle) {
      getThreeBundle().then(setBundle);
    }
  }, [visible]);

  const html = useMemo(
    () => (bundle ? threejsHtml(glbUrl, bundle) : null),
    [glbUrl, bundle],
  );

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.baslik} numberOfLines={1}>{baslik}</Text>
          <TouchableOpacity onPress={onKapat} style={styles.kapatBtn}>
            <Text style={styles.kapatText}>✕</Text>
          </TouchableOpacity>
        </View>
        {html ? (
          <WebView
            style={styles.webview}
            originWhitelist={['*']}
            source={{ html }}
            javaScriptEnabled
            allowFileAccess
            allowUniversalAccessFromFileURLs
            mixedContentMode="always"
          />
        ) : (
          <View style={styles.yukleniyor}>
            <Text style={styles.yukleniyorText}>3D hazırlanıyor...</Text>
          </View>
        )}
        <View style={styles.ipucu}>
          <Text style={styles.ipucuText}>Döndürmek için sürükle · Zoom için sıkıştır</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,212,255,0.15)',
  },
  baslik:     { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1, marginRight: 12 },
  kapatBtn:   { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  kapatText:  { color: 'rgba(255,255,255,0.5)', fontSize: 18 },
  webview:    { flex: 1, backgroundColor: '#000' },
  yukleniyor: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  yukleniyorText: { color: 'rgba(0,212,255,0.6)', fontSize: 13, letterSpacing: 1 },
  ipucu: {
    paddingVertical: 10, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  ipucuText:  { color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: 0.5 },
});
