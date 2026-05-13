import { Tabs } from 'expo-router';
import PillTabBar from '../../components/PillTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <PillTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="outfits"  options={{ title: 'Kombin'   }} />
      <Tabs.Screen name="wardrobe" options={{ title: 'Gardırop' }} />
      <Tabs.Screen name="discover" options={{ title: 'Keşfet'   }} />
      <Tabs.Screen name="ai"       options={{ title: 'AI'       }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profil'   }} />
    </Tabs>
  );
}
