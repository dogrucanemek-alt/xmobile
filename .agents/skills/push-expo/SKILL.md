# push-expo

Push et, ardından Expo'yu başlat. `push` ve `expo-start` skill'lerini sırayla çalıştırır.

## Adımlar

1. Önce `push` skill'ini çalıştır (commit + push).
2. Push başarılıysa `expo-start` skill'ini çalıştır (port öldür + expo start --clear).
3. Her iki adım tamamlandığında kullanıcıya özet bildir.
