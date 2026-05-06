# push

Değişiklikleri akıllı bir commit mesajıyla kaydet ve GitHub'a push et.

## Adımlar

1. `git status` ile değişen dosyaları listele.
2. `git diff` ile değişiklikleri incele.
3. Değişikliklere bakarak Türkçe, kısa (1 cümle) bir commit mesajı yaz.
   - Yeni özellik → "X eklendi"
   - Düzeltme → "X düzeltildi"
   - Stil/görsel → "X güncellendi"
4. Sadece proje dosyalarını stage'e al (`.claude/`, `expo_out.txt`, `expo_err.txt`, `qr_expo.png` hariç):
   ```
   git add -A
   git reset HEAD .claude/ expo_out.txt expo_err.txt qr_expo.png
   ```
5. Commit yap:
   ```
   git commit -m "<mesaj>\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
   ```
6. Push et: `git push`
7. Başarılıysa commit hash ve mesajı kullanıcıya göster.
