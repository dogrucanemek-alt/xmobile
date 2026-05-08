import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface ThreeDInlineProps {
  glbUrl: string;
  width: number;
  height: number;
  onTap?: () => void;
  overlayHtml?: string;
}

function threejsHtml(glbUrl: string, overlayHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: transparent; overflow: hidden; width: 100vw; height: 100vh; }
  #y { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
       color: rgba(0,212,255,0.6); font-family: system-ui; font-size: 10px;
       letter-spacing: 1px; text-align: center; pointer-events: none; }
</style>
</head>
<body>
<div id="y">3D<br>yükleniyor</div>
${overlayHtml}
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
<script>
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.01, 1000);
camera.position.set(0, 0.3, 2.8);

var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1.4));
var d1 = new THREE.DirectionalLight(0xffffff, 1.0); d1.position.set(1,2,3); scene.add(d1);
var d2 = new THREE.DirectionalLight(0x00D4FF, 0.25); d2.position.set(-2,1,-1); scene.add(d2);

var angle = 0;
new THREE.GLTFLoader().load(
  '${glbUrl}',
  function(gltf) {
    document.getElementById('y').style.display = 'none';
    var m = gltf.scene;
    var box = new THREE.Box3().setFromObject(m);
    var c   = box.getCenter(new THREE.Vector3());
    var s   = box.getSize(new THREE.Vector3());
    var sc  = 2.0 / Math.max(s.x, s.y, s.z);
    m.scale.setScalar(sc);
    m.position.sub(c.multiplyScalar(sc));
    m.position.y -= s.y * sc * 0.2;
    scene.add(m);
  },
  undefined,
  function() { document.getElementById('y').textContent = '—'; }
);

function animate() {
  requestAnimationFrame(animate);
  angle += 0.008;
  camera.position.x = Math.sin(angle) * 2.8;
  camera.position.z = Math.cos(angle) * 2.8;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}
animate();
</script>
</body>
</html>`;
}

export default function ThreeDInline({ glbUrl, width, height, onTap, overlayHtml = '' }: ThreeDInlineProps) {
  const html = useMemo(() => threejsHtml(glbUrl, overlayHtml), [glbUrl, overlayHtml]);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onTap} style={{ width, height }}>
      <WebView
        style={{ width, height, backgroundColor: 'transparent' }}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        pointerEvents="none"
      />
      {onTap && (
        <View style={styles.tapHint}>
          <Text style={styles.tapHintText}>⛶</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tapHint: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderRadius: 6, padding: 3,
  },
  tapHintText: { color: '#00D4FF', fontSize: 11 },
});
