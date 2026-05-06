# expo-start

Port 8081'i kullanan prosesi öldür, ardından Expo'yu temiz cache ile başlat.

## Adımlar

1. PowerShell ile port 8081'i kontrol et:
   ```
   Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
   ```
   Proses varsa `Stop-Process -Id <PID> -Force` ile öldür.

2. Projenin kök dizininde (`C:\Users\emek.dogru\Desktop\xmobile`) şu komutu çalıştır:
   ```
   npx expo start --clear > expo_out.txt 2> expo_err.txt &
   ```

3. 20 saniye bekle, ardından `expo_out.txt` içeriğini oku ve kullanıcıya göster.

4. Expo başarıyla başladıysa ("Waiting on http://localhost:8081" görünüyorsa) kullanıcıya bildir. QR kod için terminali kontrol etmesini söyle veya `! npx expo start --clear` komutunu önер.
