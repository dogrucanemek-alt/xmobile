const { createCanvas } = require('canvas');
const fs = require('fs');

const canvas = createCanvas(1024, 1024);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#0A0A0A';
ctx.fillRect(0, 0, 1024, 1024);

ctx.fillStyle = '#FFFFFF';
ctx.beginPath();
ctx.roundRect(362, 280, 300, 300, 40);
ctx.fill();

ctx.fillStyle = '#0A0A0A';
ctx.font = 'bold 180px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('X', 512, 430);

ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 55px Arial';
ctx.fillText('AI FURNITURE', 512, 670);

ctx.fillStyle = '#555555';
ctx.font = '28px Arial';
ctx.fillText('WARDROBE INTELLIGENCE', 512, 730);

fs.writeFileSync('./assets/images/splash-icon.png', canvas.toBuffer('image/png'));
console.log('Splash olusturuldu!');