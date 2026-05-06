Port 8081'i kullanan prosesi öldür, ardından Expo'yu temiz cache ile başlat.

Adımlar:
1. PowerShell ile port 8081'deki prosesi bul ve öldür: `Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1` → varsa `Stop-Process -Id <PID> -Force`
2. `cd "C:\Users\emek.dogru\Desktop\xmobile" && npx expo start --clear > expo_out.txt 2> expo_err.txt &` komutunu çalıştır
3. 20 saniye bekle, expo_out.txt oku ve sonucu göster
