import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { getThreeBundle } from '../lib/threejsLoader';

interface ThreeDInlineProps {
  glbUrl: string;
  width: number;
  height: number;
  onTap?: () => void;
  ustRenk?: string;
  altRenk?: string;
  ayakRenk?: string;
}

function normalizeHex(hex: string | undefined, fallback: string): string {
  if (!hex || hex.length < 4) return fallback;
  if (hex.length === 4) return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  return hex.slice(0, 7);
}

function threejsHtml(
  glbUrl: string,
  bundle: string,
  ustRenk: string,
  altRenk: string,
  ayakRenk: string,
  compW: number,
  compH: number,
): string {
  const VS = [
    'varying vec3 vWorldPos;',
    'varying vec3 vNorm;',
    'void main(){',
    '  vec4 wp=modelMatrix*vec4(position,1.0);',
    '  vWorldPos=wp.xyz;',
    '  vNorm=normalize(normalMatrix*normal);',
    '  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);',
    '}',
  ].join('\\n');

  const FS = [
    'uniform float minY;',
    'uniform float totH;',
    'uniform vec3 uRenk;',
    'uniform vec3 aRenk;',
    'uniform vec3 ayRenk;',
    'uniform bool isHead;',
    'varying vec3 vWorldPos;',
    'varying vec3 vNorm;',
    'void main(){',
    '  float t=clamp((vWorldPos.y-minY)/totH,0.0,1.0);',
    '  vec3 col;',
    '  if(isHead){col=vec3(0.88,0.73,0.60);}',
    '  else if(t<0.17){col=ayRenk;}',
    '  else if(t<0.52){col=aRenk;}',
    '  else{col=uRenk;}',
    '  vec3 ld=normalize(vec3(1.0,2.0,3.0));',
    '  vec3 ld2=normalize(vec3(-1.0,0.5,-1.0));',
    '  float d=max(dot(vNorm,ld),0.0)*0.5+max(dot(vNorm,ld2),0.0)*0.2;',
    '  gl_FragColor=vec4(col*(0.65+0.45*d),1.0);',
    '}',
  ].join('\\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:transparent;overflow:hidden;width:${compW}px;height:${compH}px;}
#y{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
   color:rgba(0,212,255,0.6);font-family:system-ui;font-size:10px;
   letter-spacing:1px;text-align:center;pointer-events:none;}
</style>
</head>
<body>
<div id="y">3D<br>yükleniyor</div>
<script>${bundle}</script>
<script>
var UST="${ustRenk}",ALT="${altRenk}",AYAK="${ayakRenk}";
var VS="${VS}",FS="${FS}";

var W=${compW},H=${compH};
var scene=new THREE.Scene();
var camera=new THREE.PerspectiveCamera(45,W/H,0.01,1000);
camera.position.set(0,0.1,2.8);

var renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setClearColor(0x000000,0);
renderer.setSize(W,H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.domElement.style.cssText='position:absolute;top:0;left:0;z-index:1;width:'+W+'px;height:'+H+'px;';
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff,1.2));
var d1=new THREE.DirectionalLight(0xffffff,1.0);d1.position.set(1,2,3);scene.add(d1);
var d2=new THREE.DirectionalLight(0x00D4FF,0.25);d2.position.set(-2,1,-1);scene.add(d2);

function hexV3(h){
  var r=parseInt(h.slice(1,3),16)/255;
  var g=parseInt(h.slice(3,5),16)/255;
  var b=parseInt(h.slice(5,7),16)/255;
  return new THREE.Vector3(r,g,b);
}

camera.position.set(0,0.1,2.8);
camera.lookAt(0,-0.2,0);

new THREE.GLTFLoader().load('${glbUrl}',function(gltf){
  document.getElementById('y').style.display='none';
  var m=gltf.scene;
  var box=new THREE.Box3().setFromObject(m);
  var c=box.getCenter(new THREE.Vector3());
  var s=box.getSize(new THREE.Vector3());
  var sc=2.0/Math.max(s.x,s.y,s.z);
  m.scale.setScalar(sc);
  m.position.sub(c.multiplyScalar(sc));
  m.position.y-=s.y*sc*0.2;

  var box2=new THREE.Box3().setFromObject(m);
  var minY=box2.min.y;
  var totH=box2.max.y-minY;

  m.traverse(function(child){
    if(!child.isMesh)return;
    var cb=new THREE.Box3().setFromObject(child);
    var nc=((cb.min.y+cb.max.y)/2-minY)/totH;
    child.material=new THREE.ShaderMaterial({
      uniforms:{
        minY:{value:minY},totH:{value:totH},
        uRenk:{value:hexV3(UST)},aRenk:{value:hexV3(ALT)},ayRenk:{value:hexV3(AYAK)},
        isHead:{value:nc>0.80},
      },
      vertexShader:VS,
      fragmentShader:FS,
    });
  });

  scene.add(m);
  renderer.render(scene,camera);
},undefined,function(){
  document.getElementById('y').textContent='—';
});
</script>
</body>
</html>`;
}

export default function ThreeDInline({ glbUrl, width, height, onTap, ustRenk, altRenk, ayakRenk }: ThreeDInlineProps) {
  const [bundle, setBundle] = useState<string | null>(null);

  useEffect(() => { getThreeBundle().then(setBundle); }, []);

  const u = normalizeHex(ustRenk, '#5B8CDB');
  const a = normalizeHex(altRenk, '#2C4A7A');
  const ay = normalizeHex(ayakRenk, '#2A2A2A');

  const html = useMemo(
    () => (bundle ? threejsHtml(glbUrl, bundle, u, a, ay, width, height) : null),
    [glbUrl, bundle, u, a, ay, width, height],
  );

  if (!html) return <View style={{ width, height }} />;

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
